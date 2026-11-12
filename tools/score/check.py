import os, sys, numpy as np, soundfile as sf
from scipy import signal
from theory import SCALES, KEYS
import cues
def chroma(x, sr):
    f, t, Z = signal.stft(x, sr, nperseg=16384); P = (np.abs(Z) ** 2).sum(1); ch = np.zeros(12)
    for fi, p in zip(f, P):
        if 60 < fi < 2000: ch[int(round(12 * np.log2(fi / 440) + 69)) % 12] += p
    return ch / ch.sum()
for cid in sys.argv[1:]:
    c = cues.CUES[cid](); st = {k: sf.read(f"{os.environ.get('CEL_ASSET_SRC', '/workspace/assets-src')}/stems/{cid}_{k}.wav")[0] for k in ('bed', 'pulse', 'lead')}
    mix = sum(st.values()); ch = chroma(mix.mean(1), 44100); root = KEYS[c.key]; sc = {(root + s) % 12 for s in SCALES[c.mode]}
    inkey = sum(ch[p] for p in sc); seam = np.abs(mix[0] - mix[-1]).max(); step = np.abs(np.diff(mix, axis=0)).max(0).max()
    lc = {k: round(float(sum(chroma(v.mean(1), 44100)[p] for p in sc)), 2) for k, v in st.items()}
    print(f'{cid}: in-key energy {inkey:.2f} per-stem {lc}  seam jump {seam:.4f} (max sample step {step:.3f})')
