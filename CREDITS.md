# Credits and licenses

Every media file in this repository is CC0 1.0 or public domain. Code is the author's own (see `LICENSE`) except three.js (MIT). No film audio, film melody, composer reference or copyrighted texture is used (see `docs/adr/0002-score-attribution.md`). The in-app **🔊 → Credits** panel shows the sound list.

## Music

18 original cues: the melodies, progressions and arrangements were written for this lab (`tools/score/cues.py`). They were rendered offline from the CC0 samples below by `tools/score/build.py`, as 3 stems per cue (bed, pulse, lead). The other 30 scenes reuse the cue of the closest machine (`STEM_CUE_FOR` in `src/audio/stem-score.js`). The standard tier ships Opus "lite" stems in `assets/music/lite/`; the full tier (release zip) has full-bitrate stems. Without them (on `file://`, or if Opus can't be decoded) the live procedural WebAudio score in `src/audio/cinematic-score.js` plays instead.

| Cue                      | Scenes                                                         | Key      | BPM | Texture                                            |
| :----------------------- | :------------------------------------------------------------- | :------- | --: | :------------------------------------------------- |
| Gallery of Minds         | hub                                                            | D major  |  76 | lyrical strings and horns                          |
| Tape and Thought         | turing                                                         | A minor  | 104 | pulsing low strings, ticking clocks, running piano |
| Sliding Plates           | z1                                                             | F minor  |  96 | mechanical 3+3+2 spiccato, clockwork               |
| Integrators              | analog                                                         | E minor  | 112 | swirling spiccato, low brass, timpani              |
| Three Thousand Valves    | tube, eniac46, cdc6600                                         | C minor  | 120 | relentless pedal strings, heartbeat drums          |
| Core Planes              | pdp8, agc66, s360, unix70                                      | B♭ major | 132 | counting piano in 3/4, flute and strings           |
| Switches and Lamps       | altair, alto73, tandem77                                       | E♭ major |  80 | warm horns, harp, glockenspiel                     |
| Raster Lines             | home80, lisp83, vax78, cray1, systolic82                       | A minor  | 120 | synth arpeggiator with orchestra                   |
| Rain on Beige            | pc90, sun90, cm2, ascired97                                    | F dorian |  66 | slow synth brass, bells, long reverb               |
| Deeper Pipeline          | pc00, blade04, bgene                                           | G minor  |  60 | monumental low brass, Shepard-tone riser           |
| Four Cores               | pc10, arm07, cloud10                                           | E minor  |  72 | piano eighths, slow strings, brass at the turns    |
| Shader Cores             | pc20, zmain20, fugaku20, exascale                              | D minor  | 132 | driving taiko, spiccato and brass stabs            |
| Gradient Descent         | aibox, wse24, gb200                                            | C♯ minor | 100 | music-box piano, pulse, blooming strings           |
| 3,510 Transistors        | m6502                                                          | B♭ major | 108 | heroic horn theme, timpani, cymbals                |
| Superposition            | quantum, qion, qanneal, qatom, qtransmon, qspin, qtopo, qomega | E minor  |  70 | pipe-organ swells, ticking, church acoustics       |
| Culture in a Dish        | bci                                                            | E major  |  60 | sparse piano, string pads                          |
| Reaction-Diffusion       | alife                                                          | F lydian |  56 | lydian shimmer, harp, cello song                   |
| Light Through Waveguides | photonic, qphotonic                                            | D minor  |  50 | breathing string clusters, flute air               |

| Used for                                                                                                                                                                                             | Title                                                 | Author                                                                                    | License | Source                                                   |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- | :---------------------------------------------------------------------------------------- | :------ | :------------------------------------------------------- |
| Orchestral samples: string sections (sustain and spiccato), solo contrabass, harp, F horn, tenor trombone, tuba, flute, upright piano, pipe organ, timpani, glockenspiel, bass drum, claves, cymbals | VS Chamber Orchestra 2: Community Edition (VSCO 2 CE) | Versilian Studios (Sam Gossner, Simon Dalzell; sample cutting by Elan Hickler/Soundemote) | CC0 1.0 | https://github.com/sgossner/VSCO-2-CE                    |
| Score reverb (concert hall impulse response)                                                                                                                                                         | IR_ST_Hall_04.wav                                     | Tim_Verberne (Freesound)                                                                  | CC0 1.0 | https://freesound.org/people/Tim_Verberne/sounds/537650/ |
| Score reverb for the quantum cue (church impulse response)                                                                                                                                           | IR_ST_Church_03.wav                                   | Tim_Verberne (Freesound)                                                                  | CC0 1.0 | https://freesound.org/people/Tim_Verberne/sounds/537633/ |

## Recorded sound effects (`assets/audio/`)

Played only over http(s); on `file://` the synthesized versions play. Grains were cut by `tools/assets/make_sfx.py`.

| File         | Used for                                                    | Source recording                                 | Author                                            | License | Source                                                                                                                                                                      |
| :----------- | :---------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------------ | :------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `relay.mp3`  | Relay armature clacks (Z1, analog, relay and tube machines) | relay1.wav; Relay 3; Relay and loud click        | Mihacappy; JoontheFloof; bassmosphere (Freesound) | CC0 1.0 | https://freesound.org/people/Mihacappy/sounds/876593/ · https://freesound.org/people/JoontheFloof/sounds/740253/ · https://freesound.org/people/bassmosphere/sounds/384701/ |
| `toggle.mp3` | Toggle snaps (Altair), paddle clacks (PDP-8)                | toggle switch 1; Toggle Switch                   | TheTechTinkerer; pillwave (Freesound)             | CC0 1.0 | https://freesound.org/people/TheTechTinkerer/sounds/795663/ · https://freesound.org/people/pillwave/sounds/423957/                                                          |
| `ttyhit.mp3` | ASR-33 Teletype print-hammer strikes                        | R20-17-Teletype Machine.wav                      | craigsmith (Freesound)                            | CC0 1.0 | https://freesound.org/people/craigsmith/sounds/483336/                                                                                                                      |
| `seek.mp3`   | Hard-disk voice-coil seek clicks                            | computer hard drive access fan click.wav         | martian (Freesound)                               | CC0 1.0 | https://freesound.org/people/martian/sounds/570733/                                                                                                                         |
| `keys.mp3`   | Key clicks                                                  | Typing - Model F 122 1984; Typing - Model M 1986 | Raymangold22 (Wikimedia Commons)                  | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Typing_-_Model_F_122_1984.ogg · https://commons.wikimedia.org/wiki/File:Typing_-_Model_M_1986.ogg                                   |
| `floppy.mp3` | Floppy seek/read (1541 drive, SAVE/LOAD)                    | Floppy drive sounds                              | AlepouTheFox (Wikimedia Commons)                  | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Floppy_drive_sounds.ogg                                                                                                             |
| `modem.mp3`  | Modem handshake (DOS `DIAL`)                                | Dial up connection (short)                       | PDSounds (Wikimedia Commons)                      | CC0 1.0 | https://commons.wikimedia.org/wiki/File:Dial_up_connection_(short).oga                                                                                                      |
| `bell.mp3`   | Teletype bell                                               | Typewriter ding (near, mono)                     | \_stubb (Wikimedia Commons)                       | CC0 1.0 | https://commons.wikimedia.org/wiki/File:406243_stubb_typewriter-ding-near-mono.wav                                                                                          |

`assets/audio/sfx-clips.js` embeds base64 copies of `bell`, `floppy`, `keys` and `modem` (same sources) so those four also work on `file://`.

Everything else is synthesized in the browser; see `SOUNDS.md`.

## Graphics

| Used for                             | Files                                             | Title           | Author                        | License | Source                                    |
| :----------------------------------- | :------------------------------------------------ | :-------------- | :---------------------------- | :------ | :---------------------------------------- |
| Brushed aluminium (panels, cases)    | `brushed_n/_r`                                    | Metal009        | ambientCG (Lennart Demes)     | CC0 1.0 | https://ambientcg.com/view?id=Metal009    |
| Steel (chassis, racks, screws)       | `steel_n/_r`                                      | Metal038        | ambientCG (Lennart Demes)     | CC0 1.0 | https://ambientcg.com/view?id=Metal038    |
| Textured plastic (case shells)       | `plastic_n/_r`                                    | Plastic010      | ambientCG (Lennart Demes)     | CC0 1.0 | https://ambientcg.com/view?id=Plastic010  |
| ABS plastic (keycaps, bezels)        | `abs_n/_r`                                        | Plastic013A     | ambientCG (Lennart Demes)     | CC0 1.0 | https://ambientcg.com/view?id=Plastic013A |
| Wood (Z1 frame, desks, cabinets)     | `wood_c/_n/_r`                                    | Wood094         | ambientCG (Lennart Demes)     | CC0 1.0 | https://ambientcg.com/view?id=Wood094     |
| Concrete gallery floor               | `concrete_c/_n/_r`                                | Concrete034     | ambientCG (Lennart Demes)     | CC0 1.0 | https://ambientcg.com/view?id=Concrete034 |
| Image-based lighting and reflections | `assets/hdri/studio_1k.hdr` (2K in the full tier) | Studio Small 09 | Sergej Majboroda (Poly Haven) | CC0 1.0 | https://polyhaven.com/a/studio_small_09   |

Procedural (generated in the browser): PCB artwork, chip markings, the 6502 die floorplan and its transistor-scale close-zoom detail, keycap legends, panel lettering, CRT/LCD shading.

## Data fetched at run time (not bundled)

- **visual6502 netlist** (`segdefs.js`, `transdefs.js`, `nodenames.js`), © Greg James, Brian Silverman, Barry Silverman, **CC BY-NC-SA 3.0**, https://github.com/trebonian/visual6502. Downloaded only when you switch the 6502 to transistor mode; pinned to commit `d8ecc129b34e0eaf320e0400fcf33329475bdb1e` and verified by SHA-256.
- **Klaus Dormann 6502 functional test** binary, **GPL-3.0**, https://github.com/Klaus2m5/6502_65C02_functional_tests. Downloaded by `tools/dormann-6502.mjs` (CI only), pinned to commit `fe99e561` and verified by SHA-256.

## Code

three.js r170 (MIT), bundled in `vendor/three-bundle.js` by `tools/build-vendor.mjs` with esbuild (MIT). Build-time tools that are not shipped: Prettier (MIT), Playwright (Apache-2.0), numpy/scipy/soundfile (BSD), ffmpeg/libopus (LGPL/BSD).
