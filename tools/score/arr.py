"""Arrangement engine: a Cue is key/mode/tempo/progression + part generators writing note events into three stems
(bed = always on, pulse = enters when the machine runs, lead = enters at high activity). All parts read the same chord grid."""
import numpy as np
from theory import chord, voice, parse_line, fit, near, degree
from lib import SR, render_note, soft_synth, load, Stem
RNG = np.random.default_rng(7)
class Cue:
    def __init__(self, id, mood, key, mode, bpm, prog, bars=None, meter=4, ir='hall', wet=(0.5, 0.3, 0.38), dyn=None, title=''):
        self.id, self.mood, self.key, self.mode, self.bpm, self.meter, self.ir, self.wet, self.title = id, mood, key, mode, bpm, meter, ir, wet, title
        self.prog = prog; self.bars = bars or len(prog); self.beat = 60 / bpm; self.barlen = self.beat * meter
        self.length = self.bars * self.barlen; self.ev = []   # (stem, kind, t, payload)
        self.dyn = dyn or (lambda b: 1.0)  # intensity curve per bar (0..1.2)
    def ch(self, bar): s = self.prog[bar % len(self.prog)]; return chord(s, self.key)
    def t(self, bar, beat=0.0): return bar * self.barlen + beat * self.beat
    def note(self, stem, inst, t, midi, dur, vel, pan=0.0, att=0.01, rel=0.4, g=1.0):
        h = RNG.normal(0, 0.006) if dur < 1.5 else 0
        self.ev.append((stem, 'n', max(0, t + h), (inst, int(midi), dur, float(np.clip(vel + RNG.normal(0, 0.04), 0.05, 1)), pan, att, rel, g)))
    def hit(self, stem, name, t, vel=0.8, pan=0.0, g=1.0, idx=None, tune=None): self.ev.append((stem, 'h', t, (name, vel, pan, g, idx, tune)))
    def synth(self, stem, t, freqs, dur, kind='pad', vel=0.5, pan=0.0, cutoff=1800, g=1.0): self.ev.append((stem, 's', t, (list(np.atleast_1d(freqs)), dur, kind, vel, pan, cutoff, g)))
    def raw(self, stem, t, y, pan=0.0, g=1.0): self.ev.append((stem, 'r', t, (y, pan, g)))

mf = lambda m: 440 * 2 ** ((m - 69) / 12)
# ---------------- part generators ----------------
def pad(c, stem, inst, lo, hi, n=4, vel=0.55, every=1, att=0.5, rel=1.2, pan=0.0, g=1.0, bars=None, legato=0.25):
    prev = []
    for b in range(0, c.bars, every):
        if bars and not bars(b): prev = []; continue
        _, pcs, _ = c.ch(b); v = voice(pcs, prev, lo, hi, n); prev = v
        for i, m in enumerate(v): c.note(stem, inst, c.t(b), m, c.barlen * every + legato, vel * c.dyn(b), pan + (i - n / 2) * 0.12, att, rel, g)
def bass(c, stem, inst, octave=2, vel=0.6, pattern=None, every=1, att=0.08, rel=0.8, g=1.0, pan=0.15, bars=None):
    """pattern: list of (beat, len, interval) relative to the chord bass; None = whole bar"""
    for b in range(0, c.bars, every):
        if bars and not bars(b): continue
        _, _, bp = c.ch(b); root = 12 * (octave + 1) + bp
        for (bt, L, iv) in (pattern or [(0, c.meter * every, 0)]): c.note(stem, inst, c.t(b, bt), root + iv, L * c.beat, vel * c.dyn(b), pan, att, rel, g)
def ostinato(c, stem, inst, steps, rate=0.5, octave=3, vel=0.65, accent=None, pan=0.0, g=1.0, bars=None, dur=0.9, spread=None):
    """Repeated ostinato cell: steps index chord tones (0=root,1=3rd,2=5th,3=octave,-1=rest, 'b'=bass-2 etc.); rate in beats"""
    n = int(c.meter / rate)
    for b in range(c.bars):
        if bars and not bars(b): continue
        r, pcs, bp = c.ch(b); base = 12 * (octave + 1) + r; tones = sorted({near(p, base + 5) for p in pcs})
        tones = [tones[0] - 12] + tones + [tones[0] + 12, tones[1] + 12 if len(tones) > 1 else tones[0] + 12]
        for k in range(n):
            s = steps[(b * n + k) % len(steps)]
            if s is None or s < 0: continue
            v = vel * c.dyn(b) * ((accent[k % len(accent)]) if accent else 1.0)
            c.note(stem, inst, c.t(b, k * rate), tones[min(s + 1, len(tones) - 1)], rate * c.beat * dur, v, pan, 0.003, 0.15, g)
def arp(c, stem, inst, pattern, rate=0.5, lo=55, hi=84, vel=0.5, pan=0.0, g=1.0, bars=None, ring=1.6):
    n = int(c.meter / rate)
    for b in range(c.bars):
        if bars and not bars(b): continue
        _, pcs, _ = c.ch(b); tones = sorted(m for m in range(lo, hi + 1) if m % 12 in pcs)
        for k in range(n):
            i = pattern[(b * n + k) % len(pattern)]
            if i is None: continue
            c.note(stem, inst, c.t(b, k * rate), tones[i % len(tones)], ring, vel * c.dyn(b) * (1.1 if k == 0 else 1), pan, 0.002, 0.6, g)
def melody(c, stem, inst, line, start_bar, octave=5, vel=0.7, pan=0.0, g=1.0, att=0.12, rel=0.6, legato=1.02, snap=True, transpose=0, repeat=1, seq=0):
    """original motif in scale degrees; each repetition can be sequenced by `seq` scale steps; strong-beat notes snap to the chord"""
    notes, L = parse_line(line, c.key, c.mode, octave)
    for r in range(repeat):
        for (bt, m, d) in notes:
            if m is None: continue
            abs_beat = start_bar * c.meter + r * L + bt; bar = int(abs_beat // c.meter); inbar = abs_beat - bar * c.meter
            if bar >= c.bars: continue
            mm = m + transpose + (degree(str(1 + seq * r), c.key, c.mode, octave) - degree('1', c.key, c.mode, octave) if seq else 0)
            _, pcs, _ = c.ch(bar); mm = fit(mm, pcs, snap and (inbar % 2 == 0))
            c.note(stem, inst, c.t(bar, inbar), mm, d * c.beat * legato, vel * c.dyn(bar), pan, att, rel, g)
def perc(c, stem, name, grid, rate=0.5, vel=0.8, pan=0.0, g=1.0, bars=None, idx=None):
    """grid string per bar: 'X' accent, 'x' normal, '.' rest"""
    for b in range(c.bars):
        if bars and not bars(b): continue
        for k, ch_ in enumerate(grid):
            if ch_ == '.': continue
            tune = c.ch(b)[2] if name.startswith(('timp', 'bd')) else None   # timpani/kick retuned to the bar's bass note
            c.hit(stem, name, c.t(b, k * rate), (vel if ch_ == 'X' else vel * 0.6) * c.dyn(b), pan, g, idx, tune)
def clock(c, stem, rate=1.0, vel=0.5, g=1.0, pan=-0.2, bars=None, synth=True):
    """mechanical ticking: clave + a tiny filtered click (tick/tock alternate pitch)"""
    for b in range(c.bars):
        if bars and not bars(b): continue
        for k in range(int(c.meter / rate)):
            t = c.t(b, k * rate); c.hit(stem, 'clave', t, vel * (1 if k % 2 == 0 else 0.7), pan, g * 0.55, k % 2)
            if synth: c.raw(stem, t, tick(2600 if k % 2 == 0 else 2100), pan, g * vel)
def tick(f):
    n = int(0.03 * SR); t = np.arange(n) / SR; y = np.sin(2 * np.pi * f * t) * np.exp(-t * 260) * 0.5 + np.random.default_rng(1).normal(0, 1, n) * np.exp(-t * 900) * 0.15
    return np.stack([y, y], 1).astype(np.float32)
def swells(c, stem, bars_at, kind='swell', g=0.8):
    for b in bars_at:
        x = load_hit(kind)[0]; L = len(x) / SR; c.hit(stem, kind, max(0, c.t(b) - L + 0.15), 0.9, 0, g)
def shepard(c, stem, octaves_per_loop=2, base=55, vel=0.18, g=1.0, bars=None):
    """endless rising Shepard tone (seamless: an integer number of octaves per loop); Gaussian loudness over log-frequency"""
    n = int(c.length * SR); t = np.arange(n) / SR; ph = (t / c.length) * octaves_per_loop; y = np.zeros(n)
    for k in range(-1, 7):
        x = (k + ph) % 7; f = base * 2 ** x; a = np.exp(-0.5 * ((x - 3.2) / 1.2) ** 2)
        y += a * np.sin(2 * np.pi * np.cumsum(f) / SR)
    env = np.array([c.dyn(int(tt / c.barlen)) for tt in t[::SR // 10]]); env = np.interp(t, t[::SR // 10][:len(env)], env)
    if bars: m = np.array([1.0 if bars(int(tt / c.barlen)) else 0.0 for tt in t[::SR // 10]]); env *= np.interp(t, t[::SR // 10][:len(m)], np.convolve(m, np.ones(20) / 20, 'same'))
    y = (y * env * vel / 3).astype(np.float32); c.raw(stem, 0, np.stack([y, y * 0.98], 1), 0, g)
_hits = {}
_pit = {}
def retune(name, j, x, pc):
    from lib import lowest_partial
    if (name, j) not in _pit: _pit[(name, j)] = lowest_partial(x)
    src = _pit[(name, j)]; tgt = src + ((pc - src) % 12 + 6) % 12 - 6; r = 2 ** ((tgt - src) / 12)   # nearest note with that pitch class
    n = int(len(x) / r); pos = np.arange(n) * r
    return np.stack([np.interp(pos, np.arange(len(x)), x[:, ch]) for ch in range(x.shape[1])], 1).astype(np.float32)
def load_hit(name):
    from insts import UNPITCHED
    if name not in _hits: _hits[name] = [load(f) for f in UNPITCHED[name]]
    return _hits[name]

def render(c, I, tail=8.0):
    stems = {s: Stem(c.length + tail) for s in ('bed', 'pulse', 'lead')}
    for stem, kind, t, p in sorted(c.ev, key=lambda e: e[2]):
        S = stems[stem]
        if kind == 'n':
            inst, m, d, v, pan, att, rel, g = p; ins = I[inst]
            while m < ins.lo - 3: m += 12
            while m > ins.hi + 3: m -= 12
            S.add(render_note(ins, m, d, v, att, rel), t, pan, g)
        elif kind == 'h':
            name, v, pan, g, idx, tune = p; xs = load_hit(name); j = idx % len(xs) if idx is not None else min(len(xs) - 1, int(v * len(xs))); x = xs[j]
            if tune is not None: x = retune(name, j, x, tune)
            S.add(x * (0.3 + 0.7 * v) * 0.6, t, pan, g)   # percussion sits under the strings
        elif kind == 's':
            fr, d, k, v, pan, cut, g = p; S.add(soft_synth(fr, d, k, v, cut), t, pan, g)
        else:
            y, pan, g = p; S.add(y, t, pan, g)
    return {k: s.buf for k, s in stems.items()}
