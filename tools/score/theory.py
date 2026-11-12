"""Harmony helpers: roman-numeral chords in a key, smooth voice leading, motif fitting."""
import re
SCALES = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10], 'lydian': [0, 2, 4, 6, 7, 9, 11],
          'harm': [0, 2, 3, 5, 7, 8, 11], 'phryg': [0, 1, 3, 5, 7, 8, 10], 'mixo': [0, 2, 4, 5, 7, 9, 10]}
KEYS = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
ROM = {'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6}
MAJ = [0, 2, 4, 5, 7, 9, 11]
def chord(sym, key):
    """'bVI', 'iv', 'V7', 'Isus2', 'iiadd9', 'i/5', 'VImaj7', 'v' ... -> (root pc, pcs list, bass pc). Root degrees follow the MAJOR scale + accidentals."""
    t = KEYS[key]; bass = None
    if '/' in sym: sym, b = sym.split('/'); bass = b
    m = re.match(r'(b|#)?([ivIV]+)(.*)', sym); acc, rn, q = m.groups()
    deg = ROM[rn.lower()]; root = (t + MAJ[deg] + (-1 if acc == 'b' else 1 if acc == '#' else 0)) % 12
    minor = rn.islower(); third = 3 if minor else 4; pcs = [0, third, 7]
    if 'dim' in q: pcs = [0, 3, 6]
    if 'sus2' in q: pcs = [0, 2, 7]
    if 'sus4' in q: pcs = [0, 5, 7]
    if 'maj7' in q: pcs.append(11)
    elif '7' in q: pcs.append(10)
    if 'add9' in q or q.endswith('9'): pcs.append(14)
    if '6' in q and 'add' not in q: pcs.append(9)
    pcs = [(root + p) % 12 for p in pcs]
    bpc = root if bass is None else (root + {'3': third, '5': 7, '7': 10, '2': 2, '4': 5}.get(bass, 0)) % 12 if bass.isdigit() else KEYS[bass]
    return root, pcs, bpc
def near(pc, ref):
    """midi with pitch class pc nearest to ref"""
    c = ref - ((ref - pc) % 12); return c if ref - c <= 6 else c + 12
def voice(pcs, prev, lo, hi, n):
    """n voices covering the chord, each moving as little as possible from prev (voice leading); stays inside lo..hi"""
    if not prev: base = (lo + hi) // 2 - 6; prev = [base + i * (hi - lo) // max(1, n) // 2 for i in range(n)]
    out = []; need = list(pcs)
    for i, p in enumerate(sorted(prev)):
        cands = sorted(need if need else pcs, key=lambda q: abs(near(q, p) - p)); q = cands[0]
        if q in need: need.remove(q)
        v = near(q, p)
        while v < lo: v += 12
        while v > hi: v -= 12
        out.append(v)
    return sorted(out)
def degree(d, key, mode, octave=5):
    """scale degree string ('1', 'b3', '#4', '5,' = octave down, "8" = octave up) -> midi"""
    s = SCALES[mode]; acc = 0; o = 0
    while d and d[0] in 'b#': acc += -1 if d[0] == 'b' else 1; d = d[1:]
    o -= d.count(','); o += d.count("'"); n = int(d.strip(",'")) - 1
    return 12 * (octave + 1) + KEYS[key] + s[n % 7] + 12 * (n // 7) + acc + 12 * o
def parse_line(txt, key, mode, octave=5):
    """melody tokens 'deg:beats' (r = rest, deg~ = tie/legato) -> list of (beat, midi|None, beats)"""
    b = 0; out = []
    for tok in txt.split():
        if tok == '|': continue
        d, _, L = tok.partition(':'); L = float(L or 1)
        out.append((b, None if d == 'r' else degree(d, key, mode, octave), L)); b += L
    return out, b
def fit(midi, pcs, strong):
    """on strong beats snap a melody note to the nearest chord tone (keeps sequences consonant over new harmony)"""
    if not strong or midi % 12 in pcs: return midi
    return min((near(p, midi) for p in pcs), key=lambda v: abs(v - midi))
