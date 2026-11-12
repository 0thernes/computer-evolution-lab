"""The 18 original cues. Every melody and progression here was written for this lab. Each cue carries
a plain mood descriptor (tempo, orchestration, texture); no film, composer or existing theme is named, quoted or imitated
(see docs/adr/0002-score-attribution.md)."""
import numpy as np
from arr import Cue, pad, bass, ostinato, arp, melody, perc, clock, swells, shepard
P = dict(vln=-0.45, vla=-0.12, vc=0.3, cb=0.45, hn=-0.28, tbn=0.25, tba=0.35, harp=-0.5, pno=0.02, glock=0.22, fl=-0.18, org=0.0)
def arc(n, lo=0.55, hi=1.05, peak=0.7):
    """intensity over the loop: rises to `hi` at `peak` of the way through, falls back to `lo` so the loop seam is calm"""
    return lambda b: lo + (hi - lo) * np.sin(np.pi * min(1, (b + 0.5) / n / peak) / 2) ** 2 if (b + 0.5) / n <= peak else hi - (hi - lo) * (((b + 0.5) / n - peak) / (1 - peak)) ** 1.5
CUES = {}
def cue(f): CUES[f.__name__.replace('c_', '')] = f; return f

@cue
def c_hub():   # long-breathed string/horn melody over warm major harmony
    prog = ['I', 'vi', 'IV', 'V', 'I/3', 'IV', 'ii7', 'Vsus4', 'vi', 'IV', 'I/5', 'V', 'IV', 'I/3', 'ii7', 'V']
    c = Cue('hub', 'lyrical strings and horns', 'D', 'major', 76, prog, bars=32, title='Gallery of Minds', dyn=arc(32, 0.5, 1.0, 0.72))
    pad(c, 'bed', 'vla', 55, 69, 3, 0.45, pan=P['vla']); pad(c, 'bed', 'vc', 43, 57, 2, 0.45, pan=P['vc']); bass(c, 'bed', 'cb', 2, 0.42, pan=P['cb'])
    arp(c, 'bed', 'harp', [0, 2, 4, 5, 7, 5, 4, 2], 0.5, 50, 79, 0.42, P['harp'], 0.8)
    arp(c, 'pulse', 'pno', [0, 4, 7, 4, 9, 4, 7, 4], 0.5, 50, 76, 0.38, 0.05, 0.75)
    pad(c, 'pulse', 'hn', 50, 65, 2, 0.4, every=2, att=0.9, pan=P['hn'], g=0.8)
    perc(c, 'pulse', 'timp_roll', 'x' + '.' * 7, 0.5, 0.35, 0.05, 0.55, bars=lambda b: b % 8 == 7)
    A = "3:1.5 2:0.5 1:1 5,:1 | 6,:2 1:1 2:1 | 3:3 4:1 | 5:4 | 6:1.5 5:0.5 4:1 3:1 | 2:2 5,:2 | 1:1 2:1 3:1 6:1 | 5:4"
    melody(c, 'lead', 'hn', A, 0, 4, 0.62, P['hn'], 0.95, att=0.2)
    melody(c, 'lead', 'vln', A, 8, 5, 0.66, P['vln'], 0.9, att=0.25); melody(c, 'lead', 'fl', A, 8, 6, 0.42, P['fl'], 0.55, att=0.2)
    melody(c, 'lead', 'vln', "5:2 6:1 7:1 | 8:3 7:0.5 6:0.5 | 5:2 3:2 | 2:4 | 3:1.5 4:0.5 5:2 | 6:1 5:1 4:1 3:1 | 2:2 7,:2 | 1:4", 16, 5, 0.72, P['vln'], 0.95, att=0.2)
    melody(c, 'lead', 'vc', "5:2 6:1 7:1 | 8:3 7:0.5 6:0.5 | 5:2 3:2 | 2:4", 24, 3, 0.6, P['vc'], 0.9, att=0.25)
    swells(c, 'lead', [16], 'swell', 0.5); perc(c, 'lead', 'crash', 'x' + '.' * 7, 0.5, 0.5, 0, 0.4, bars=lambda b: b == 16)
    return c

@cue
def c_turing():   # pulsing low strings + ticking clocks, running piano figures 
    prog = ['i', 'i', 'bVI', 'bVI', 'iv', 'iv', 'V', 'V', 'i', 'bVII', 'bVI', 'bIII', 'iv', 'bVI', 'V', 'V']
    c = Cue('turing', 'pulsing low strings, ticking clocks, running piano', 'A', 'minor', 104, prog, bars=44, title='Tape and Thought', dyn=arc(44, 0.55, 1.05, 0.7))
    pad(c, 'bed', 'vc', 40, 55, 2, 0.4, pan=P['vc']); bass(c, 'bed', 'cb', 1, 0.45, pan=P['cb']); pad(c, 'bed', 'vla', 52, 64, 2, 0.3, every=2, pan=P['vla'])
    clock(c, 'bed', 1.0, 0.35, 0.6)
    ostinato(c, 'pulse', 'vc_sp', [0, 0, 2, 0, 3, 0, 2, 1], 0.5, 2, 0.6, [1.2, 0.8, 1, 0.8, 1.1, 0.8, 1, 0.8], P['vc'])
    ostinato(c, 'pulse', 'cb_sp', [0, -1, 0, -1, 0, -1, 0, 0], 0.5, 1, 0.55, None, P['cb'])
    arp(c, 'pulse', 'pno', [0, 2, 4, 7, 4, 2, 5, 3, 0, 2, 4, 7, 9, 7, 4, 2], 0.25, 57, 84, 0.33, 0.0, 0.8, ring=0.5)
    clock(c, 'pulse', 0.5, 0.25, 0.5, pan=0.25)
    L = "5:2 6:1 5:1 | 3:4 | 4:2 3:1 2:1 | 1:3 7,:1 | 1:2 2:1 3:1 | 5:3 4:1 | 3:2 2:2 | 7,:4"
    melody(c, 'lead', 'vln', L, 8, 5, 0.6, P['vln'], 0.85, att=0.3); melody(c, 'lead', 'vln', L, 24, 5, 0.68, P['vln'], 0.9, att=0.3); melody(c, 'lead', 'vla', L, 24, 4, 0.5, P['vla'], 0.6, att=0.3)
    perc(c, 'lead', 'timp_hit', 'X' + '.' * 7, 0.5, 0.6, 0.05, 0.5, bars=lambda b: b % 4 == 0 and 16 <= b < 40)
    return c

@cue
def c_z1():   # mechanical 3+3+2 ostinato, clockwork clicks; glass-like piano/glock line
    prog = ['i', 'bVII', 'bVI', 'V', 'i', 'iv', 'bVI', 'V', 'bVI', 'bIII', 'iv', 'V']
    c = Cue('z1', 'mechanical 3+3+2 spiccato, clockwork', 'F', 'minor', 96, prog, bars=40, title='Sliding Plates', dyn=arc(40, 0.55, 1.0, 0.7))
    pad(c, 'bed', 'hn', 41, 56, 2, 0.32, every=2, att=1.0, pan=P['hn'], g=0.7); pad(c, 'bed', 'vc', 41, 55, 2, 0.38, pan=P['vc']); bass(c, 'bed', 'cb', 1, 0.42, pan=P['cb'])
    clock(c, 'bed', 1.0, 0.3, 0.55, pan=-0.35)
    ostinato(c, 'pulse', 'vla_sp', [0, 2, 3, 0, 2, 3, 1, 2], 0.5, 4, 0.6, [1.25, 0.75, 0.8, 1.2, 0.75, 0.8, 1.15, 0.8], P['vla'])
    ostinato(c, 'pulse', 'vc_sp', [0, -1, -1, 0, -1, -1, 0, -1], 0.5, 2, 0.6, None, P['vc'])
    perc(c, 'pulse', 'clave', 'x..x..x.', 0.5, 0.5, 0.3, 0.45)
    L = "5:1.5 4:0.5 3:1 1:1 | 2:3 r:1 | 3:1.5 4:0.5 5:1 7:1 | 8:3 r:1 | 6:1 5:1 4:1 3:1 | 2:2 5:2 | 4:1.5 3:0.5 2:1 7,:1 | 1:4"
    melody(c, 'lead', 'pno', L, 8, 5, 0.55, 0.0, 0.85, att=0.005, snap=True); melody(c, 'lead', 'glock', L, 24, 6, 0.4, P['glock'], 0.45, att=0.002)
    melody(c, 'lead', 'vln', L, 24, 5, 0.55, P['vln'], 0.7, att=0.25)
    return c

@cue
def c_analog():   # swirling spiccato arpeggios, low brass swells, timpani 
    prog = ['i', 'i', 'bVI', 'bVI', 'bIII', 'bIII', 'bVII', 'V']
    c = Cue('analog', 'swirling spiccato, low brass, timpani', 'E', 'minor', 112, prog, bars=48, title='Integrators', dyn=arc(48, 0.5, 1.1, 0.72))
    pad(c, 'bed', 'vla', 52, 66, 2, 0.35, pan=P['vla']); pad(c, 'bed', 'vc', 40, 55, 2, 0.4, pan=P['vc']); bass(c, 'bed', 'cb', 1, 0.45, pan=P['cb'])
    ostinato(c, 'pulse', 'vln_sp', [0, 1, 2, 3, 4, 3, 2, 1], 0.25, 4, 0.55, [1.2, 0.8, 0.9, 0.8], P['vln'], dur=1.0)
    ostinato(c, 'pulse', 'vc_sp', [0, 0, 0, 2, 0, 0, 3, 2], 0.5, 2, 0.6, [1.2, 0.8, 0.9, 1, 1.1, 0.8, 1, 0.9], P['vc'])
    perc(c, 'pulse', 'timp_hit', 'X...x...', 0.5, 0.55, 0.05, 0.55)
    pad(c, 'lead', 'tbn', 45, 60, 2, 0.55, every=2, att=1.4, pan=P['tbn'], g=0.85); pad(c, 'lead', 'tba', 31, 43, 1, 0.5, every=2, att=1.4, pan=P['tba'], g=0.85)
    melody(c, 'lead', 'vln', "1:3 2:1 | 3:4 | 5:2 4:1 3:1 | 2:4 | 3:3 4:1 | 5:4 | 6:2 5:2 | #7:4", 16, 5, 0.62, P['vln'], 0.85, att=0.35)
    swells(c, 'lead', [16, 32], 'swell_long', 0.5)
    return c

@cue
def c_tube():   # relentless pedal spiccato, Phrygian bII darkness, heartbeat drums (darker)
    prog = ['i', 'i', 'bII', 'bII', 'i', 'i', 'bVI', 'V']
    c = Cue('tube', 'relentless pedal strings, heartbeat drums', 'C', 'minor', 120, prog, bars=52, title='Three Thousand Valves', dyn=arc(52, 0.5, 1.1, 0.75))
    pad(c, 'bed', 'vc', 36, 52, 2, 0.42, pan=P['vc']); bass(c, 'bed', 'cb', 1, 0.5, pan=P['cb']); pad(c, 'bed', 'hn', 43, 58, 2, 0.28, every=4, att=1.6, pan=P['hn'], g=0.7)
    ostinato(c, 'pulse', 'cb_sp', [0] * 16, 0.25, 1, 0.5, [1.3, 0.7, 0.8, 0.7], P['cb'])
    ostinato(c, 'pulse', 'vln_sp', [2, 3, 2, 4, 2, 3, 2, 1], 0.25, 4, 0.45, [1.2, 0.8, 0.9, 0.8], P['vln'])
    perc(c, 'pulse', 'bd', 'X..x....', 0.5, 0.7, 0, 0.6)
    pad(c, 'lead', 'tbn', 43, 60, 3, 0.6, every=2, att=1.8, pan=P['tbn'], g=0.85); pad(c, 'lead', 'tba', 29, 41, 1, 0.55, every=2, att=1.8, pan=P['tba'])
    melody(c, 'lead', 'vla', "5:4 | b6:4 | 5:2 4:2 | 3:4 | 2:4 | b2:4 | 1:2 7,:2 | 1:4", 20, 4, 0.6, P['vla'], 0.8, att=0.4)
    perc(c, 'lead', 'taiko', 'X...X.x.', 0.5, 0.7, 0, 0.6, bars=lambda b: 24 <= b < 44)
    swells(c, 'lead', [24, 40], 'swell', 0.5)
    return c

@cue
def c_pdp8():   # counting piano ostinato in 3/4, flute + strings melody
    prog = ['I', 'I', 'vi', 'vi', 'IV', 'IV', 'V', 'V', 'I', 'iii', 'IV', 'ii', 'V', 'V', 'I', 'Vsus4']
    c = Cue('pdp8', 'counting piano in 3/4, flute and strings', 'Bb', 'major', 132, prog, bars=76, meter=3, title='Core Planes', dyn=arc(76, 0.5, 1.0, 0.7))
    pad(c, 'bed', 'vla', 53, 67, 3, 0.38, every=2, pan=P['vla']); bass(c, 'bed', 'cb', 2, 0.38, every=2, pan=P['cb']); pad(c, 'bed', 'vc', 41, 55, 1, 0.35, every=2, pan=P['vc'])
    arp(c, 'pulse', 'pno', [0, 3, 5, 3, 6, 3], 0.5, 53, 77, 0.42, 0.0, 0.85, ring=0.9)
    arp(c, 'pulse', 'harp', [0, None, None, 4, None, None], 0.5, 41, 65, 0.4, P['harp'], 0.7)
    L = "5:2 6:1 | 5:2 3:1 | 2:2 3:1 | 1:3 | 6,:2 1:1 | 2:2 3:1 | 2:3 | 5,:3"
    melody(c, 'lead', 'fl', L, 16, 5, 0.55, P['fl'], 0.65, att=0.12); melody(c, 'lead', 'vln', L, 32, 5, 0.62, P['vln'], 0.9, att=0.2)
    melody(c, 'lead', 'vln', "3:2 4:1 | 5:3 | 6:2 5:1 | 4:3 | 3:2 2:1 | 1:2 2:1 | 3:3 | 2:3", 48, 5, 0.64, P['vln'], 0.9, att=0.2)
    melody(c, 'lead', 'hn', "1:3 | 5,:3 | 6,:3 | 3,:3 | 4,:3 | 1,:3 | 4,:3 | 5,:3", 48, 4, 0.45, P['hn'], 0.7, att=0.3)
    return c

@cue
def c_altair():   # warmth: horns + strings, harp, glock sparkle 
    prog = ['I', 'V/3', 'vi', 'iii', 'IV', 'I/3', 'ii7', 'V', 'IV', 'V/3', 'vi', 'I/5', 'IV', 'V', 'Isus4', 'I']
    c = Cue('altair', 'warm horns, harp, glockenspiel', 'Eb', 'major', 80, prog, bars=34, title='Switches and Lamps', dyn=arc(34, 0.5, 1.0, 0.7))
    pad(c, 'bed', 'vla', 55, 68, 3, 0.4, pan=P['vla']); pad(c, 'bed', 'vc', 43, 55, 1, 0.38, pan=P['vc']); bass(c, 'bed', 'cb', 2, 0.38, pan=P['cb'])
    arp(c, 'bed', 'harp', [0, 2, 4, 7, 4, 2, 0, 2], 0.5, 51, 82, 0.36, P['harp'], 0.75)
    arp(c, 'pulse', 'glock', [7, None, 4, None, 9, None, 4, None], 0.5, 79, 100, 0.35, P['glock'], 0.45, ring=1.2)
    arp(c, 'pulse', 'pno', [0, 4, 7, 9, 7, 4, 2, 4], 0.5, 51, 79, 0.35, 0.0, 0.7)
    L = "1:1 2:1 3:2 | 5:2 4:1 3:1 | 2:3 1:1 | 6,:4 | 4,:1 6,:1 1:2 | 3:2 2:1 1:1 | 7,:2 2:2 | 5,:4"
    melody(c, 'lead', 'hn', L, 8, 4, 0.62, P['hn'], 0.95, att=0.25); melody(c, 'lead', 'vln', L, 16, 5, 0.66, P['vln'], 0.9, att=0.25)
    melody(c, 'lead', 'vc', L, 24, 3, 0.55, P['vc'], 0.8, att=0.25); melody(c, 'lead', 'fl', L, 24, 6, 0.4, P['fl'], 0.5, att=0.2)
    return c

@cue
def c_home80():   # synth arpeggiator + orchestral strings/brass hybrid
    prog = ['i', 'bVI', 'bIII', 'bVII', 'i', 'bVI', 'iv', 'V']
    c = Cue('home80', 'synth arpeggiator with orchestra', 'A', 'minor', 120, prog, bars=52, title='Raster Lines', dyn=arc(52, 0.55, 1.05, 0.72))
    pad(c, 'bed', 'vla', 52, 67, 3, 0.36, pan=P['vla']); bass(c, 'bed', 'cb', 1, 0.4, pan=P['cb'])
    for b in range(c.bars):
        r, pcs, bp = c.ch(b); c.synth('bed', c.t(b), [220 * 2 ** (((p - 9) % 12) / 12) for p in pcs], c.barlen + 0.3, 'pad', 0.22, -0.1, 1400, 0.8)
    for b in range(c.bars):   # 16th-note pulse arpeggio, 1-5-8-5 shape climbing through the chord
        r, pcs, bp = c.ch(b); tones = sorted({57 + ((p - 9) % 12) for p in pcs}); seq = [tones[0], tones[1 % len(tones)], tones[2 % len(tones)], tones[0] + 12]
        for k in range(16): m = seq[k % 4] + (12 if k >= 8 and k % 4 == 3 else 0); c.synth('pulse', c.t(b, k * 0.25), [440 * 2 ** ((m - 69) / 12)], 0.2, 'arp', 0.32 * c.dyn(b), 0.15, 2600, 0.9)
        c.synth('pulse', c.t(b), [55 * 2 ** (((bp - 9) % 12) / 12)], c.barlen, 'sub', 0.175 * c.dyn(b), 0, 200, 0.9)
    perc(c, 'pulse', 'bd', 'X...x...', 0.5, 0.6, 0, 0.5)
    pad(c, 'lead', 'hn', 52, 65, 2, 0.55, every=2, att=0.5, pan=P['hn'], g=0.85)
    L = "1:2 5:1 4:1 | 3:2 2:2 | 1:1 3:1 5:1 8:1 | 7:4 | 6:2 5:1 4:1 | 3:2 5:2 | 4:2 3:1 2:1 | #7,:4"
    melody(c, 'lead', 'tbn', L, 16, 4, 0.6, P['tbn'], 0.85, att=0.12); melody(c, 'lead', 'vln', L, 32, 5, 0.6, P['vln'], 0.85, att=0.2)
    return c

@cue
def c_pc90():   # slow synth brass, long reverb, bell tones
    prog = ['i', 'bVI', 'iv', 'bVII', 'i', 'bIII', 'iv', 'v']
    c = Cue('pc90', 'slow synth brass, bells, long reverb', 'F', 'dorian', 66, prog, bars=28, title='Rain on Beige', wet=(0.65, 0.45, 0.55), dyn=arc(28, 0.55, 1.0, 0.7))
    for b in range(c.bars):
        r, pcs, bp = c.ch(b); fr = [174.6 * 2 ** (((p - 5) % 12) / 12) for p in pcs] + [87.3 * 2 ** (((bp - 5) % 12) / 12)]
        c.synth('bed', c.t(b), fr, c.barlen + 0.8, 'pad', 0.32, 0, 1100, 0.9)
    pad(c, 'bed', 'vc', 41, 53, 2, 0.3, pan=P['vc'])
    arp(c, 'pulse', 'glock', [4, None, None, 7, None, 2, None, None], 0.5, 79, 98, 0.3, P['glock'], 0.5, ring=2.5)
    arp(c, 'pulse', 'pno', [0, None, 2, None, 4, None, 2, None], 0.5, 53, 72, 0.3, 0.1, 0.6, ring=2.0)
    bass(c, 'pulse', 'cb', 1, 0.4, pan=P['cb'])
    for (b0, line) in [(8, "5:3 4:0.5 3:0.5 | 1:4 | 3:2 4:1 5:1 | 7:4 | 8:3 7:0.5 5:0.5 | 4:4 | 3:2 4:2 | 2:4")]:
        from theory import parse_line
        notes, _ = parse_line(line, c.key, c.mode, 4)
        for rep in (0, 1):
            for (bt, m, d) in notes:
                bar = b0 + rep * 8 + int(bt // 4); c.synth('lead', c.t(bar, bt % 4), [440 * 2 ** ((m - 69) / 12)], d * c.beat * 1.05, 'brass', 0.4 * c.dyn(bar), -0.05, 1600, 0.9)
    melody(c, 'lead', 'vln', "5:3 4:0.5 3:0.5 | 1:4 | 3:2 4:1 5:1 | 7:4", 16, 5, 0.45, P['vln'], 0.5, att=0.4)
    return c

@cue
def c_pc00():   # monumental low brass, string ostinato, Shepard riser
    prog = ['i', 'i', 'bVI', 'bVI', 'bIII', 'bIII', 'bVII', 'bVII']
    c = Cue('pc00', 'monumental low brass, Shepard-tone riser', 'G', 'minor', 60, prog, bars=26, title='Deeper Pipeline', dyn=arc(26, 0.5, 1.1, 0.75))
    pad(c, 'bed', 'vc', 38, 55, 2, 0.4, pan=P['vc']); bass(c, 'bed', 'cb', 1, 0.45, pan=P['cb']); pad(c, 'bed', 'vla', 50, 62, 2, 0.3, pan=P['vla'])
    ostinato(c, 'pulse', 'vln_sp', [0, 1, 2, 1, 0, 1, 2, 3], 0.25, 4, 0.45, [1.2, 0.8, 0.9, 0.8], P['vln'])
    ostinato(c, 'pulse', 'vc_sp', [0, 0, -1, 0, 0, -1, 2, -1], 0.25, 2, 0.5, None, P['vc'])
    perc(c, 'pulse', 'taiko', 'X.......x.......', 0.25, 0.6, 0, 0.6)
    pad(c, 'lead', 'tbn', 43, 58, 3, 0.75, every=2, att=0.25, rel=2.0, pan=P['tbn'], g=0.95); pad(c, 'lead', 'tba', 26, 38, 1, 0.75, every=2, att=0.25, rel=2.0, pan=P['tba'])
    pad(c, 'lead', 'hn', 50, 62, 2, 0.65, every=2, att=0.3, rel=2.0, pan=P['hn'], g=0.9)
    shepard(c, 'lead', 2, 55, 0.16, 0.9); swells(c, 'lead', [8, 16, 24], 'swell', 0.45)
    return c

@cue
def c_pc10():   # half-time "dilation": piano 8ths over slow strings, brass at the turns
    prog = ['i', 'bVII', 'bVI', 'iv', 'i', 'bVII', 'bVI', 'V']
    c = Cue('pc10', 'piano eighths, slow strings, brass at the turns', 'E', 'minor', 72, prog, bars=30, title='Four Cores', dyn=arc(30, 0.5, 1.05, 0.7))
    pad(c, 'bed', 'vla', 52, 66, 3, 0.36, pan=P['vla']); pad(c, 'bed', 'vc', 40, 52, 1, 0.38, pan=P['vc']); bass(c, 'bed', 'cb', 1, 0.42, pan=P['cb'])
    arp(c, 'pulse', 'pno', [0, 4, 7, 4, 9, 7, 4, 2], 0.5, 52, 76, 0.4, 0.0, 0.8, ring=1.0)
    ostinato(c, 'pulse', 'cb_sp', [0, -1, 0, -1, 0, 0, -1, 0], 0.5, 1, 0.5, None, P['cb'])
    perc(c, 'pulse', 'timp_hit', 'X.......', 0.5, 0.5, 0.05, 0.5)
    pad(c, 'lead', 'tbn', 43, 57, 2, 0.6, every=2, att=0.35, rel=1.6, pan=P['tbn'], g=0.85); pad(c, 'lead', 'hn', 50, 62, 2, 0.6, every=2, att=0.35, rel=1.6, pan=P['hn'])
    melody(c, 'lead', 'vln', "5:4 | 4:2 3:2 | 3:4 | 2:2 1:2 | 1:3 2:1 | 3:2 5:2 | 4:4 | #7,:4", 8, 5, 0.6, P['vln'], 0.85, att=0.4)
    shepard(c, 'lead', 1, 60, 0.12, 0.8, bars=lambda b: 12 <= b < 24)
    return c

@cue
def c_pc20():   # driving percussion, brass stabs, 16th spiccato, sub
    prog = ['i', 'i', 'bII', 'i', 'bVII', 'bVI', 'bII', 'V']
    c = Cue('pc20', 'driving taiko, spiccato and brass stabs', 'D', 'minor', 132, prog, bars=58, title='Shader Cores', dyn=arc(58, 0.6, 1.1, 0.72))
    pad(c, 'bed', 'vc', 38, 53, 2, 0.4, pan=P['vc']); bass(c, 'bed', 'cb', 1, 0.45, pan=P['cb'])
    for b in range(c.bars): c.synth('bed', c.t(b), [36.7 * 2 ** (((c.ch(b)[2] - 2) % 12) / 12)], c.barlen, 'sub', 0.122, 0, 200, 0.8)
    ostinato(c, 'pulse', 'vln_sp', [0, 0, 2, 0, 3, 0, 2, 1, 0, 0, 2, 0, 4, 3, 2, 1], 0.25, 4, 0.5, [1.25, 0.75, 0.9, 0.75], P['vln'])
    ostinato(c, 'pulse', 'vc_sp', [0, 0, 0, 0, 2, 0, 0, 0], 0.5, 2, 0.6, [1.2, 0.8], P['vc'])
    perc(c, 'pulse', 'taiko', 'X..x..X.x.X..x..', 0.25, 0.65, 0, 0.65); perc(c, 'pulse', 'bd', 'X.......X.......', 0.25, 0.55, 0, 0.5)
    for b in range(16, 52):   # brass stabs on the offbeats
        r, pcs, _ = c.ch(b)
        for bt in (1.5, 3.5):
            for i, p in enumerate(sorted(pcs)): c.note('lead', 'tbn', c.t(b, bt), 48 + (p - 2) % 12, 0.28, 0.75 * c.dyn(b), P['tbn'] + i * 0.1, 0.01, 0.25, 0.9)
    melody(c, 'lead', 'hn', "1:4 | b2:2 1:2 | 7,:4 | 1:4 | 5:4 | b6:2 5:2 | b2:4 | #7,:4", 24, 4, 0.7, P['hn'], 0.9, att=0.15)
    swells(c, 'lead', [16, 32], 'swell', 0.5)
    return c

@cue
def c_aibox():   # music-box piano + glock over pulsing synth, strings that bloom
    prog = ['i', 'bVI', 'bIII', 'bVII', 'i', 'bVI', 'iv', 'V']
    c = Cue('aibox', 'music-box piano, pulse, blooming strings', 'C#', 'minor', 100, prog, bars=42, title='Gradient Descent', dyn=arc(42, 0.5, 1.05, 0.7))
    pad(c, 'bed', 'vla', 54, 68, 3, 0.36, pan=P['vla']); pad(c, 'bed', 'vc', 40, 52, 1, 0.36, pan=P['vc'])
    arp(c, 'bed', 'pno', [7, 4, 9, 4, 7, 4, 11, 4], 0.5, 61, 92, 0.3, 0.05, 0.7, ring=1.5)
    for b in range(c.bars):
        r, pcs, bp = c.ch(b)
        for k in range(8): c.synth('pulse', c.t(b, k * 0.5), [277.2 * 2 ** (((pcs[k % len(pcs)] - 1) % 12) / 12) / 2], 0.32, 'arp', 0.22 * c.dyn(b), 0.25 if k % 2 else -0.25, 1500, 0.8)
        c.synth('pulse', c.t(b), [34.6 * 2 ** (((bp - 1) % 12) / 12)], c.barlen, 'sub', 0.158 * c.dyn(b), 0, 200, 0.9)
    perc(c, 'pulse', 'taiko', 'X.......x...x...', 0.25, 0.55, 0, 0.55, bars=lambda b: b >= 8)
    L = "5:2 4:1 3:1 | 2:4 | 3:1 5:1 8:2 | 7:4 | 6:2 5:1 4:1 | 3:4 | 2:1 3:1 4:1 2:1 | 1:4"
    melody(c, 'lead', 'glock', L, 8, 6, 0.4, P['glock'], 0.45, att=0.002); melody(c, 'lead', 'vln', L, 16, 5, 0.66, P['vln'], 0.95, att=0.3)
    melody(c, 'lead', 'vc', L, 24, 3, 0.6, P['vc'], 0.85, att=0.3); pad(c, 'lead', 'hn', 52, 64, 2, 0.5, every=2, att=0.6, pan=P['hn'], g=0.75, bars=lambda b: 16 <= b < 36)
    return c

@cue
def c_m6502():   # heroic: horn call, driving strings, timpani/taiko, cymbal crashes at the arrivals
    prog = ['I', 'I', 'bVII', 'IV', 'vi', 'IV', 'I/5', 'V', 'I', 'iii', 'IV', 'bVII', 'vi', 'IV', 'Vsus4', 'V']
    c = Cue('m6502', 'heroic horn theme, timpani, cymbals', 'Bb', 'major', 108, prog, bars=46, title='3,510 Transistors', dyn=arc(46, 0.55, 1.1, 0.7))
    pad(c, 'bed', 'vla', 53, 67, 3, 0.38, pan=P['vla']); pad(c, 'bed', 'vc', 41, 55, 2, 0.4, pan=P['vc']); bass(c, 'bed', 'cb', 1, 0.42, pan=P['cb'])
    ostinato(c, 'pulse', 'vln_sp', [0, 2, 3, 2, 0, 2, 3, 4], 0.5, 4, 0.55, [1.2, 0.8, 1, 0.8], P['vln'])
    ostinato(c, 'pulse', 'vc_sp', [0, 0, 2, 0, 0, 0, 2, 3], 0.5, 2, 0.6, [1.2, 0.8], P['vc'])
    perc(c, 'pulse', 'timp_hit', 'X...x...', 0.5, 0.6, 0.05, 0.55); perc(c, 'pulse', 'taiko', '....X..x', 0.5, 0.5, 0, 0.5)
    H = "1:1 5:1.5 4:0.5 3:1 | 2:1 1:1 5,:2 | 1:1 3:1 5:1.5 6:0.5 | 5:4 | 4:1.5 3:0.5 2:1 1:1 | 6,:2 4:2 | 3:1 2:1 1:1 7,:1 | 1:4"
    melody(c, 'lead', 'hn', H, 8, 4, 0.75, P['hn'], 1.0, att=0.08); melody(c, 'lead', 'tbn', H, 8, 3, 0.5, P['tbn'], 0.6, att=0.08)
    melody(c, 'lead', 'vln', H, 24, 5, 0.75, P['vln'], 0.95, att=0.12); melody(c, 'lead', 'hn', H, 24, 4, 0.7, P['hn'], 0.85, att=0.08)
    perc(c, 'lead', 'crash', 'X' + '.' * 7, 0.5, 0.6, 0, 0.45, bars=lambda b: b in (8, 24, 32)); swells(c, 'lead', [8, 24], 'swell', 0.45)
    return c

@cue
def c_quantum():   # organ swells over a slow original progression, ticking pulse, high repeated piano 
    prog = ['i', 'bVIIadd9', 'bVImaj7', 'iv', 'i/5', 'bIII', 'bVII', 'Vsus4']
    c = Cue('quantum', 'pipe-organ swells, ticking, church acoustics', 'E', 'minor', 70, prog, bars=30, title='Superposition', ir='church', wet=(0.55, 0.35, 0.5), dyn=arc(30, 0.45, 1.1, 0.75))
    pad(c, 'bed', 'org', 52, 71, 3, 0.35, att=1.2, rel=2.0, pan=0); pad(c, 'bed', 'vc', 40, 52, 1, 0.3, pan=P['vc'])
    clock(c, 'pulse', 1.0, 0.4, 0.6, pan=0.0)
    arp(c, 'pulse', 'pno', [7, 7, 9, 7, 7, 7, 11, 7], 0.5, 64, 88, 0.3, 0.1, 0.7, ring=0.8)
    pad(c, 'lead', 'org', 55, 79, 4, 0.8, att=2.2, rel=2.5, pan=0, g=1.0); bass(c, 'lead', 'orgped', 1, 0.7, att=1.0, rel=2.0, pan=0)
    melody(c, 'lead', 'org', "5:4 | 4:4 | 3:4 | 1:4 | 2:4 | 3:2 5:2 | 4:4 | 5:4", 14, 6, 0.6, 0, 0.6, att=1.0)
    return c

@cue
def c_bci():   # sparse piano, open string pads, space
    prog = ['I', 'IVadd9', 'vi', 'IVmaj7', 'I/3', 'ii7', 'IV', 'Vsus4']
    c = Cue('bci', 'sparse piano, string pads', 'E', 'major', 60, prog, bars=26, title='Culture in a Dish', wet=(0.6, 0.5, 0.5), dyn=arc(26, 0.5, 0.95, 0.65))
    pad(c, 'bed', 'vla', 56, 71, 3, 0.32, att=1.5, rel=2.0, pan=P['vla']); pad(c, 'bed', 'vc', 40, 52, 1, 0.3, att=1.5, pan=P['vc']); bass(c, 'bed', 'cb', 1, 0.3, att=1.0, pan=P['cb'])
    rng = np.random.default_rng(11)
    for b in range(c.bars):
        _, pcs, _ = c.ch(b)
        for bt in sorted(rng.choice([0, 1, 1.5, 2, 3, 3.5], size=rng.integers(1, 4), replace=False)):
            m = 64 + (pcs[rng.integers(len(pcs))] - 4) % 12 + 12 * rng.integers(0, 2); c.note('pulse', 'pno', c.t(b, bt), m, 3.0, 0.32 * c.dyn(b), 0.1, 0.002, 1.5)
    arp(c, 'pulse', 'harp', [0, None, None, None, 4, None, None, None], 0.5, 52, 76, 0.3, P['harp'], 0.6, ring=3)
    melody(c, 'lead', 'vc', "3:3 2:1 | 1:4 | 6,:2 1:2 | 5,:4 | 4,:2 6,:1 1:1 | 3:4 | 2:4 | 5,:4", 8, 3, 0.55, P['vc'], 0.85, att=0.6)
    melody(c, 'lead', 'fl', "5:4 | 6:2 5:2 | 3:4 | 2:4", 18, 5, 0.4, P['fl'], 0.55, att=0.5)
    return c

@cue
def c_alife():   # lydian shimmer, glock + harp, slow cello song
    prog = ['I', 'II', 'I', 'II', 'vi', 'II', 'IVmaj7', 'Vsus2']
    c = Cue('alife', 'lydian shimmer, harp, cello song', 'F', 'lydian', 56, prog, bars=24, title='Reaction-Diffusion', wet=(0.6, 0.5, 0.5), dyn=arc(24, 0.5, 0.95, 0.65))
    pad(c, 'bed', 'vla', 57, 72, 3, 0.3, att=1.8, rel=2.2, pan=P['vla']); bass(c, 'bed', 'cb', 1, 0.28, att=1.2, pan=P['cb'])
    for b in range(c.bars): c.synth('bed', c.t(b), [174.6 * 2 ** (((p - 5) % 12) / 12) * 2 for p in c.ch(b)[1]], c.barlen + 1, 'pad', 0.12, 0.1, 900, 0.7)
    arp(c, 'pulse', 'glock', [0, None, 4, None, None, 2, None, None], 0.5, 79, 100, 0.26, P['glock'], 0.4, ring=2.5)
    arp(c, 'pulse', 'harp', [0, 2, 4, None, 5, None, 4, None], 0.5, 53, 81, 0.3, P['harp'], 0.6, ring=2.5)
    melody(c, 'lead', 'vc', "5:2 #4:1 5:1 | 3:4 | 2:2 3:1 #4:1 | 5:4 | 6:2 5:2 | #4:2 2:2 | 3:4 | 1:4", 8, 3, 0.55, P['vc'], 0.85, att=0.6)
    melody(c, 'lead', 'pno', "5:2 #4:1 5:1 | 3:4 | 2:2 3:1 #4:1 | 5:4", 16, 5, 0.35, 0.1, 0.7, att=0.002)
    return c

@cue
def c_photonic():   # slowly breathing string clusters, flute air, low drone, sparse pings
    prog = ['i', 'i', 'bVI', 'bVI', 'iv', 'iv', 'bVII', 'bVII', 'i', 'i', 'bIII', 'bIII']
    c = Cue('photonic', 'breathing string clusters, flute air', 'D', 'minor', 50, prog, bars=22, title='Light Through Waveguides', wet=(0.65, 0.5, 0.55), dyn=arc(22, 0.5, 1.0, 0.7))
    bass(c, 'bed', 'cb', 1, 0.35, every=2, att=2.0, rel=2.5, pan=P['cb'])
    for b in range(c.bars):   # clusters: chord tones + added 2nds, entering one by one
        r, pcs, _ = c.ch(b); cl = sorted({(p + d) % 12 for p in pcs[:2] for d in (0, 2)})
        for i, p in enumerate(cl): c.note('bed', ['vla', 'vln', 'vc', 'vla'][i % 4], c.t(b, i * 0.6), 55 + (p - 2) % 12 + (12 if i % 2 else 0), c.barlen + 0.5 - i * 0.6 * c.beat, 0.32 * c.dyn(b), (-0.4 + i * 0.25), 1.5, 2.0)
    arp(c, 'pulse', 'glock', [4, None, None, None, None, None, 7, None], 0.5, 79, 98, 0.24, P['glock'], 0.4, ring=3)
    arp(c, 'pulse', 'harp', [0, None, None, 2, None, None, None, None], 0.5, 50, 74, 0.28, P['harp'], 0.55, ring=3)
    melody(c, 'lead', 'fl', "1:4 | 2:4 | b3:6 2:2 | 1:8", 6, 5, 0.45, P['fl'], 0.6, att=1.2)
    pad(c, 'lead', 'hn', 45, 57, 2, 0.45, every=2, att=2.5, rel=2.5, pan=P['hn'], g=0.75, bars=lambda b: 8 <= b < 18)
    return c
