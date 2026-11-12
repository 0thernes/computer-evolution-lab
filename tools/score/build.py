"""Render every cue to three loopable stems + a 30 s preview, check levels/spectrum, encode Opus.
usage: python3 build.py [cue ids...]   (no args = all)"""
import sys, os, json, subprocess
import numpy as np, soundfile as sf
from scipy import signal
from lib import SR, reverb, fold_loop, ir
from insts import lib
from arr import render
import cues
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.environ.get('CEL_ASSET_SRC', '/workspace/assets-src')
OUT_FULL = f'{ROOT}/assets/full/music'; OUT_EMB = f'{ROOT}/assets/music/embed'; PREV = f'{ROOT}/renders/audio'; WAV = f'{SRC}/stems'
for d in (OUT_FULL, OUT_EMB, PREV, WAV): os.makedirs(d, exist_ok=True)

def env_follow(x, att, rel):
    """one-pole attack/release follower (vectorised by blocks of 64 samples)"""
    blk = 64; n = len(x) // blk; xb = x[:n * blk].reshape(n, blk).max(1); y = np.zeros(n); a = np.exp(-blk / (att * SR)); r = np.exp(-blk / (rel * SR)); v = 0.0
    for i in range(n): v = a * v + (1 - a) * xb[i] if xb[i] > v else r * v + (1 - r) * xb[i]; y[i] = v
    return np.repeat(y, blk)[:len(x)] if len(x) == n * blk else np.concatenate([np.repeat(y, blk), np.full(len(x) - n * blk, y[-1] if n else 0)])

def master(stems):
    """linked bus processing: gentle 2:1 compression above -20 dBFS RMS, makeup to -17 dBFS RMS, lookahead peak limiter at -1 dBFS.
    the SAME gain curve multiplies every stem, so bed+pulse+lead always sum to the mastered mix."""
    mix = sum(stems.values()); m = np.abs(mix).max(1)
    rms = np.sqrt(env_follow(m ** 2, 0.03, 0.3) + 1e-12); db = 20 * np.log10(rms + 1e-9); over = np.maximum(0, db + 20); gr = -over * (1 - 1 / 2.0)
    g = 10 ** (gr / 20); cur = np.sqrt(np.mean((mix * g[:, None]) ** 2)); g *= 10 ** (-17 / 20) / max(cur, 1e-9)
    la = int(0.005 * SR); pk = np.abs(mix).max(1) * g; pk = np.concatenate([pk[la:], np.zeros(la)]); pk = np.maximum(pk, np.abs(mix).max(1) * g)
    lim = np.minimum(1, 0.891 / np.maximum(pk, 1e-9)); lim = -env_follow(-lim + 1, 0.0005, 0.12) + 1  # fast attack, 120 ms release
    lim = np.minimum(lim, 0.891 / np.maximum(np.abs(mix).max(1) * g, 1e-9)); G = (g * lim)[:, None].astype(np.float32)
    return {k: v * G for k, v in stems.items()}

def stats(x):
    m = x.mean(1); pk = np.abs(x).max(); rms = np.sqrt(np.mean(x ** 2)); f, P = signal.welch(m, SR, nperseg=8192)
    band = lambda a, b: float(10 * np.log10(P[(f >= a) & (f < b)].sum() / P.sum() + 1e-12))
    return {'peak_dbfs': round(float(20 * np.log10(pk + 1e-12)), 2), 'rms_dbfs': round(float(20 * np.log10(rms + 1e-12)), 2), 'crest_db': round(float(20 * np.log10(pk / rms)), 1),
            'clipped_samples': int((np.abs(x) >= 0.999).sum()), 'low_20_250': round(band(20, 250), 1), 'mid_250_4k': round(band(250, 4000), 1), 'high_4k_10k': round(band(4000, 10000), 1), 'air_10k_up': round(band(10000, 22050), 1)}, (f, P)

def spectrum_png(path, fP, title):
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    f, P = fP; plt.figure(figsize=(7, 3)); plt.semilogx(f[1:], 10 * np.log10(P[1:] + 1e-14)); plt.xlim(20, 20000); plt.ylim(-130, -40); plt.grid(alpha=0.3); plt.title(title, fontsize=9); plt.xlabel('Hz'); plt.ylabel('dB'); plt.tight_layout(); plt.savefig(path, dpi=90); plt.close()

def build(cid, I, irs):
    c = cues.CUES[cid](); dry = render(c, I)
    for k, v in dry.items():   # per-stem trim: RMS over the stem's ACTIVE frames to a target, so every layer is clearly audible when it enters
        e = np.sqrt(np.maximum(signal.fftconvolve((v ** 2).mean(1), np.ones(4410) / 4410, 'same'), 0)); act = e > e.max() * 10 ** (-30 / 20)
        r = np.sqrt(np.mean(v[act] ** 2)) if act.any() else 0; tgt = 10 ** ({'bed': -21, 'pulse': -23, 'lead': -20}[k] / 20)
        if r > 0: dry[k] = v * float(np.clip(tgt / r, 0.25, 6.0))
    wet = {k: fold_loop(reverb(v, irs[c.ir], c.wet[i], hp=120 if k == 'bed' else 160), c.length) for i, (k, v) in enumerate(dry.items())}
    st = master(wet); full = sum(st.values())
    for k, v in st.items():
        sf.write(f'{WAV}/{cid}_{k}.wav', v, SR, subtype='FLOAT')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{WAV}/{cid}_{k}.wav', '-c:a', 'libopus', '-b:a', '112k', '-vbr', 'on', f'{OUT_FULL}/{cid}_{k}.ogg'], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{WAV}/{cid}_{k}.wav', '-c:a', 'libopus', '-b:a', '32k', '-vbr', 'on', '-ar', '48000', f'{OUT_EMB}/{cid}_{k}.ogg'], check=True)
    # 30 s preview from the most intense section, all stems
    hop = int(c.barlen * SR); best = max(range(0, max(1, len(full) - 30 * SR), hop), key=lambda i: np.mean(full[i:i + 30 * SR] ** 2))
    pv = full[best:best + 30 * SR].copy(); fd = int(0.5 * SR); pv[:fd] *= np.linspace(0, 1, fd)[:, None]; pv[-fd:] *= np.linspace(1, 0, fd)[:, None]
    sf.write('/tmp/pv.wav', pv, SR, subtype='FLOAT'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/pv.wav', '-b:a', '192k', f'{PREV}/{cid}_preview.mp3'], check=True)
    s, fP = stats(full); s.update(length_s=round(c.length, 2), bpm=c.bpm, key=f'{c.key} {c.mode}', mood=c.mood, title=c.title, stems={k: stats(v)[0]['rms_dbfs'] for k, v in st.items()})
    spectrum_png(f'{PREV}/{cid}_spectrum.png', fP, f'{cid}: {c.title} (peak {s["peak_dbfs"]} dBFS, RMS {s["rms_dbfs"]})')
    return s

if __name__ == '__main__':
    I = lib(); irs = {'hall': ir('ir_hall'), 'church': ir('ir_church')}
    ids = sys.argv[1:] or list(cues.CUES); rep = json.load(open(f'{PREV}/levels.json')) if os.path.exists(f'{PREV}/levels.json') else {}
    for cid in ids: rep[cid] = build(cid, I, irs); print(cid, json.dumps(rep[cid]))
    json.dump(rep, open(f'{PREV}/levels.json', 'w'), indent=1)
