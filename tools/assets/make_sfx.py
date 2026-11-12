"""Cut the Freesound CC0 recordings (see SOUNDS.md / CREDITS.md) into small embeddable assets in assets/audio/:
   <name>.mp3 sprites of one-shot grains on a fixed slot grid (engine.grains() finds them again), and seamless loops."""
import os, subprocess, numpy as np, soundfile as sf
from scipy import signal
SRC = os.path.join(os.environ.get('CEL_ASSET_SRC', '/workspace/assets-src'), 'fs'); OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'audio'); SR = 44100
def rd(n):
    x, sr = sf.read(f'{SRC}/{n}.wav'); x = x.mean(1) if x.ndim > 1 else x; assert sr == SR; return signal.sosfilt(signal.butter(2, 30, 'hp', fs=SR, output='sos'), x)
def onsets(x, thr_db=-24, gap=0.06):
    e = np.sqrt(signal.convolve(x ** 2, np.ones(64) / 64, 'same')); top = e.max(); on = []; i = 0; need = top * 10 ** (thr_db / 20)
    while i < len(x):
        if e[i] > need and (not on or i - on[-1] > gap * SR): on.append(max(0, i - int(0.002 * SR))); i += int(gap * SR)
        else: i += 32
    return on
def grain(x, s, L): g = x[s:s + int(L * SR)].copy(); f = min(len(g) // 3, int(0.015 * SR)); g[-f:] *= np.linspace(1, 0, f) ** 2; return g / (np.abs(g).max() + 1e-9) * 0.89
def sprite(name, parts, slot, L):
    y = np.zeros(int(slot * SR * len(parts)) + SR // 10)
    for k, g in enumerate(parts): g = g[:int(min(L, slot - 0.01) * SR)]; y[int(k * slot * SR):int(k * slot * SR) + len(g)] += g
    write(name, y); print(name, len(parts), 'grains')
def loop(name, x, s, L, F=0.35):
    s, L, F = int(s * SR), int(L * SR), int(F * SR); seg = x[s:s + L + F]; y = seg[:L].copy(); r = np.linspace(0, 1, F)
    y[:F] = seg[:F] * np.sin(r * np.pi / 2) + seg[L:L + F] * np.cos(r * np.pi / 2)   # equal power: y wraps from seg[L-1] to ≈seg[L]
    y = y / (np.abs(y).max() + 1e-9) * 0.7; write(name, y); print(name, 'loop', L / SR, 's')
def write(name, y):
    sf.write('/tmp/sfx.wav', y.astype(np.float32), SR, subtype='FLOAT')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/sfx.wav', '-ac', '1', '-b:a', '96k', f'{OUT}/{name}.mp3'], check=True)
# relay armatures: every distinct clack in the three recordings
rel = []
for n in ('relay_a', 'relay_b', 'relay_c'): x = rd(n); rel += [grain(x, s, 0.09) for s in onsets(x, -20, 0.04)]
sprite('relay', rel[:10], 0.12, 0.1)
tog = []
for n in ('toggle_a', 'toggle_b'): x = rd(n); tog += [grain(x, s, 0.16) for s in onsets(x, -18, 0.12)]
sprite('toggle', tog[:8], 0.2, 0.18)
# teletype: single print-hammer strikes for typed characters + a chatter loop for continuous printing
t = rd('tty_b'); on = onsets(t, -10, 0.07); sprite('ttyhit', [grain(t, s, 0.1) for s in on[5:21]], 0.12, 0.1)
loop('ttyloop', rd('tty_a'), 4.0, 3.0)
# hard disk: voice-coil seek clicks (grains) + spindle/air loop
h = rd('hddclick'); sprite('seek', [grain(h, s, 0.06) for s in onsets(h, -14, 0.08)[:12]], 0.08, 0.06)
loop('hddspin', rd('hdd'), 9.0, 4.0)
loop('fanloop', rd('fan'), 5.0, 4.0)
loop('crtwhine', rd('crt'), 6.0, 3.0)
