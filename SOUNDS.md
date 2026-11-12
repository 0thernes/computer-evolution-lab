# Sounds and music

Sources and licenses for every recording and sample are in [`CREDITS.md`](CREDITS.md). All are CC0 1.0.

## Score

- **Sampled score (http/https).** `src/audio/stem-score.js` plays 18 original cues rendered offline from the VSCO 2 Community Edition orchestra (`tools/score/`). Each cue has three sample-synchronous looping stems:
  - **bed** is always on;
  - **pulse** fades in while the machine's simulator is running;
  - **lead** fades in under sustained activity.
    On a machine switch the old cue fades out over about 2.4 s and the new one fades in over about 2.2 s. The 30 scenes without their own cue reuse the cue of the closest machine.
- **Procedural score (fallback).** On `file://`, before the stems have decoded, or where Opus isn't supported, `src/audio/cinematic-score.js` synthesizes the music live in WebAudio: convolution reverb, divisi strings, piano, pipe organ, horns, choir, ribbon synth and timpani. The swap to stems happens only after they have decoded.
- **Mood palettes.** The palette menu offers `epic`, `noble`, `clockwork`, `suspended`, `elegiac`, `slowbuild` and `synthnoir`. No composer or film is named (see `docs/adr/0002-score-attribution.md`).
- **Background tabs.** The AudioContext is suspended while the tab is hidden and resumed when it's visible again.

## Sound effects

Every effect is triggered by a simulator event (a bus pulse, keypress, disk access, spike or clock edge), not by a timer.

- **Recorded (http/https):** relay clacks, toggle snaps, Teletype hammer, hard-disk seek, key clicks, floppy, modem and bell (`assets/audio/*.mp3`). Each play uses a random grain with small pitch and gain changes so repeats don't sound identical.
- **Embedded for `file://`:** bell, floppy, keys and modem (`assets/audio/sfx-clips.js`).
- **Synthesized:**
  - relay armature and contact bounce;
  - Z1 sliding plates;
  - mercury delay-line ticks;
  - HDD voice-coil seek and spin-up;
  - PC-speaker POST beep;
  - coil whine and coolant gurgle;
  - NMR RF pulse and free-induction decay;
  - biphasic stimulation clicks and spike pops;
  - thermo-optic heater ticks and photodetector chime;
  - droplet plop and syringe-pump steps;
  - 6502 φ1/φ2 clock ticks;
  - Turing tape step and write;
  - cryocooler breath and 400 Hz inverter tone.
    Recorded grains replace the synthesized relay, toggle, Teletype and seek sounds once they have loaded.
