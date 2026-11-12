"""Sample library + offline renderer for the lab's orchestral cues.
Samples: VSCO 2 Community Edition (CC0, Versilian Studios). Every pitched sample's root is taken from its file name, with the per-instrument
octave convention verified by pitch detection (VSCO names some sets one octave low). Rendering is plain numpy: nearest-root resampling,
crossfade-looped sustains, per-note envelopes, constant-power panning, convolution reverb with a CC0 measured hall/church IR."""
import os, re, glob, functools, json
import numpy as np, soundfile as sf
from scipy import signal
SR = 44100
VSCO = os.environ.get('CEL_VSCO', '/workspace/vsco')  # VSCO-2-CE checkout
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def name_midi(s):
    m = re.search(r'_([A-G])(#|b)?(-?\d)(?=_|\.|$)', s)
    if not m: return None
    return 12 * (int(m.group(3)) + 1) + NOTE[m.group(1)] + (1 if m.group(2) == '#' else -1 if m.group(2) == 'b' else 0)

def lowest_partial(x):
    """MIDI of the lowest strong spectral peak (robust for organ pipes and plucked strings)"""
    m = x.mean(1); s = m[int(0.1 * SR):int(0.1 * SR) + 32768]; w = np.abs(np.fft.rfft(s * np.hanning(len(s)), 1 << 16)); f = np.fft.rfftfreq(1 << 16, 1 / SR)
    w[f < 25] = 0; top = w.max(); idx = np.where((w > top * 0.12) & (w >= np.roll(w, 1)) & (w >= np.roll(w, -1)))[0]
    return 69 + 12 * np.log2(f[idx[0]] / 440)

def detect_pitch(x):
    """fundamental (MIDI float) by YIN (cumulative-mean-normalised difference, threshold 0.12), median over frames after the attack"""
    m = (x.mean(1) if x.ndim > 1 else x).astype(np.float64); W = 4096; tau_max = int(SR / 27)
    st = int(0.12 * SR); res = []
    for k in range(st, min(len(m) - W - tau_max, st + SR), W // 2):
        f = m[k:k + W + tau_max]
        if np.abs(f).max() < 1e-4: continue
        F = np.fft.rfft(f, 2 * len(f)); ac = np.fft.irfft(F * np.conj(F))[:tau_max]
        e = np.cumsum(f ** 2); d = e[W - 1] + (e[W - 1 + np.arange(tau_max)] - e[np.arange(tau_max) - 1 + (np.arange(tau_max) == 0)] * (np.arange(tau_max) > 0)) - 2 * ac
        d[0] = 1; cm = d * np.arange(tau_max) / np.maximum(np.cumsum(d), 1e-12); cm[0] = 1
        lo = int(SR / 2500); cand = np.where(cm[lo:] < 0.12)[0]
        t = lo + (cand[0] if len(cand) else np.argmin(cm[lo:]))
        while t + 1 < tau_max and cm[t + 1] < cm[t]: t += 1
        res.append(69 + 12 * np.log2(SR / t / 440))
    return float(np.median(res)) if res else 0.0

@functools.lru_cache(maxsize=None)
def load(path):
    x, sr = sf.read(path, dtype='float32', always_2d=True)
    if x.shape[1] == 1: x = np.repeat(x, 2, 1)
    if sr != SR: x = signal.resample_poly(x, SR, sr, axis=0).astype(np.float32)
    a = np.abs(x).max(1); thr = a.max() * 0.004; i0 = int(np.argmax(a > thr)); x = x[max(0, i0 - 64):]
    return x

class Inst:
    """pitched instrument: dict layer -> {midi: path}. kind: 'sus' (loopable sustain) or 'hit' (one-shot)."""
    def __init__(self, name, files, kind='sus', layer_re=r'_v(\d)', gain=1.0, verify=False, fixed=None, off=12):
        self.name, self.kind, self.gain = name, kind, gain; self.layers = {}
        roots = {}
        for f in files:
            mid = name_midi(os.path.basename(f)) if fixed is None else fixed(f)
            if mid is None: continue
            lm = re.search(layer_re, os.path.basename(f)); L = int(lm.group(1)) if lm else 1
            self.layers.setdefault(L, {})[mid] = f; roots[mid] = f
        self.off = off if fixed is None else 0
        if verify and roots:   # octave convention check on a few samples
            ds = [round((detect_pitch(load(roots[k])) - k) / 12) for k in sorted(roots)[len(roots) // 4::max(1, len(roots) // 4)][:4]]
            self.off = 12 * int(np.median(ds)) if ds else 0
        self.layers = {L: {k + self.off: v for k, v in d.items()} for L, d in self.layers.items()}
        self.lo = min(min(d) for d in self.layers.values()); self.hi = max(max(d) for d in self.layers.values())
    def pick(self, midi, vel):
        Ls = sorted(self.layers); L = Ls[min(len(Ls) - 1, int(vel * len(Ls)))]
        d = self.layers[L]; k = min(d, key=lambda r: (abs(r - midi), r > midi)); return d[k], k

@functools.lru_cache(maxsize=None)
def looped(path, need):
    """sustain extended by crossfade-looping its stable middle (so long notes never run out)"""
    x = load(path); n = len(x)
    if n >= need: return x
    a, b = int(n * 0.3), int(n * 0.85); seg = x[a:b]; L = len(seg); xf = min(int(0.4 * SR), L // 3)
    out = [x[:b]]; tot = b
    fade = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
    while tot < need:
        prev = out[-1]; s = seg.copy(); s[:xf] = s[:xf] * np.sqrt(fade) + prev[-xf:] * np.sqrt(1 - fade); out[-1] = prev[:-xf]; out.append(s); tot += L - xf
    return np.concatenate(out)

def render_note(inst, midi, dur, vel=0.7, attack=0.01, release=0.35, detune=0.0):
    path, root = inst.pick(midi, vel); ratio = 2 ** ((midi + detune - root) / 12)
    tail = release if inst.kind == 'sus' else 0
    n_out = int((dur + tail) * SR) if inst.kind == 'sus' else int(min(len(load(path)) / ratio, (dur + release) * SR))
    src = looped(path, int(n_out * ratio) + 16) if inst.kind == 'sus' else load(path)
    pos = np.arange(n_out) * ratio; pos = pos[pos < len(src) - 1]; n_out = len(pos)
    i = pos.astype(np.int64); fr = (pos - i).astype(np.float32)[:, None]; y = src[i] * (1 - fr) + src[i + 1] * fr
    env = np.ones(n_out, np.float32); na = min(n_out, int(attack * SR))
    if na > 0: env[:na] = np.linspace(0, 1, na) ** 1.5
    if inst.kind == 'sus':
        r0 = int(dur * SR); nr = n_out - r0
        if nr > 0: env[r0:] *= np.exp(-np.linspace(0, 6, nr))
    else:
        r0 = int(dur * SR)
        if r0 < n_out: env[r0:] *= np.exp(-np.linspace(0, 7, n_out - r0))
    return y * env[:, None] * (inst.gain * (0.25 + 0.75 * vel))

class Stem:
    def __init__(self, length): self.buf = np.zeros((int(length * SR), 2), np.float32)
    def add(self, y, t, pan=0.0, gain=1.0):
        i = int(t * SR); n = min(len(y), len(self.buf) - i)
        if n <= 0 or i < 0: return
        a = (pan + 1) * np.pi / 4; gl, gr = np.cos(a) * 1.4142, np.sin(a) * 1.4142   # constant-power pan, centre = unity
        self.buf[i:i + n, 0] += y[:n, 0] * gl * gain; self.buf[i:i + n, 1] += y[:n, 1] * gr * gain

def ir(name):
    x = load(f"{os.environ.get('CEL_ASSET_SRC', '/workspace/assets-src')}/fs/{name}.wav"); x = x / np.sqrt((x ** 2).sum(0).mean()); return x

def reverb(x, irx, wet=0.3, predelay=0.02, hp=180):
    pd = np.zeros((int(predelay * SR), 2), np.float32); h = np.concatenate([pd, irx])
    b, a = signal.butter(2, hp / (SR / 2), 'high'); xin = signal.lfilter(b, a, x, axis=0)
    y = np.stack([signal.fftconvolve(xin[:, c], h[:, c])[:len(x)] for c in range(2)], 1).astype(np.float32)
    b2, a2 = signal.butter(2, 9000 / (SR / 2), 'low'); y = signal.lfilter(b2, a2, y, axis=0)
    return x * (1 - wet * 0.4) + y * wet * 0.55

def fold_loop(x, loop_len):
    """seamless loop: everything rendered past the loop point (reverb tails, releases) is overlap-added onto the start"""
    n = int(loop_len * SR); y = x[:n].copy(); t = x[n:]; k = 0
    while len(t):
        m = min(len(t), n); y[:m] += t[:m]; t = t[m:]
    return y

def soft_synth(freqs, dur, kind='pad', vel=0.6, cutoff=1800, detune=0.08):
    """small analog-style synth layer: detuned saws -> 2-pole lowpass (pad/brass), or square pulse (arp), or sine sub"""
    n = int(dur * SR); t = np.arange(n) / SR; y = np.zeros(n, np.float32)
    for f in np.atleast_1d(freqs):
        if kind == 'sub': y += np.sin(2 * np.pi * f * t)
        elif kind == 'arp': y += signal.square(2 * np.pi * f * t, 0.32) * 0.5 + signal.sawtooth(2 * np.pi * f * 1.003 * t) * 0.3
        else:
            for d in (-detune, 0, detune): y += signal.sawtooth(2 * np.pi * f * (1 + d / 100) * t + np.random.rand() * 6) / 3
    if kind != 'sub':
        b, a = signal.butter(2, min(cutoff, SR * 0.45) / (SR / 2), 'low'); y = signal.lfilter(b, a, y)
    env = np.ones(n, np.float32); at = {'pad': 0.6, 'brass': 0.12, 'arp': 0.004, 'sub': 0.02}[kind]; rl = {'pad': 0.8, 'brass': 0.3, 'arp': 0.08, 'sub': 0.1}[kind]
    na, nr = min(n, int(at * SR)), min(n, int(rl * SR)); env[:na] = np.linspace(0, 1, na); env[n - nr:] *= np.linspace(1, 0, nr)
    y = (y * env * vel / max(1, len(np.atleast_1d(freqs))) ** 0.5).astype(np.float32)
    return np.stack([y, y], 1)
