# Third-Party Notices & Credits

## 1. Bundled Open-Source Software

### Three.js (r170) & Post-Processing Addons

- **Location**: `vendor/three-bundle.js`
- **Authors**: Mr.doob (Ricardo Cabello) and the Three.js Authors (`https://threejs.org/`)
- **License**: MIT License

```text
The MIT License

Copyright © 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 2. Media assets (CC0 1.0 / public domain)

All textures (ambientCG), the HDRI (Poly Haven), the orchestral samples and impulse responses used to render the score (VSCO 2 CE, Freesound), and the recorded sound effects (Freesound, Wikimedia Commons) are CC0 1.0. Each file is listed with its author and source URL in [`CREDITS.md`](CREDITS.md):

- `assets/tex/1k/` (14 maps) and, in the full-tier release zip, `assets/full/tex/2k/`
- `assets/hdri/studio_1k.hdr` and, in the full tier, `assets/full/hdri/studio_2k.hdr`
- `assets/music/lite/` (18 cues × 3 stems) and, in the full tier, `assets/full/music/`
- `assets/audio/*.mp3` (8 files) and `assets/audio/sfx-clips.js` (base64 copies of `bell`, `floppy`, `keys`, `modem`)

---

## 3. Data fetched at run time (not redistributed)

- **visual6502 netlist** (Greg James, Brian Silverman, Barry Silverman), **CC BY-NC-SA 3.0**. It is downloaded from `raw.githubusercontent.com/trebonian/visual6502` at a pinned commit, and verified by SHA-256, only when you turn on the 6502's transistor-level mode. It is not included in this repository or the `.exe`. The procedural die artwork and the behavioural 6502 core are original work. Eric Schlaepfer's MOnSter 6502 inspired the discrete-board model.
- **Klaus Dormann 6502 functional test**, **GPL-3.0**. `tools/dormann-6502.mjs` downloads it in CI to test the 6502 core. It is not included in this repository.

---

## 4. Scientific literature references

- **DishBrain Wetware Model**: Kagan et al., _"In vitro neurons learn and exhibit sentience when embodied in a simulated game-world"_, _Neuron_ 110 (2022) 3952; spiking dynamics modeled via E. M. Izhikevich, _IEEE Trans. Neural Networks_ 14 (2003) 1569.
- **Programmable Nanophotonic Processor**: Clements et al., _Optica_ 3 (2016) 1460; Shen et al., _Nature Photonics_ 11 (2017) 441.
- **Enzyme-Free Nucleic Acid Logic**: Seelig, Soloveichik, Zhang & Winfree, _"Enzyme-free nucleic acid logic circuits"_, _Science_ 314 (2006) 1585.
- **H₂ STO-3G integrals**: A. Szabo & N. S. Ostlund, _Modern Quantum Chemistry_ (Dover, 1996), §3.5.

## 5. Music

The score is original. There are 49 scene cues in the procedural engine (`src/audio/cinematic-score.js`) and 18 sampled cues (`assets/music/`) rendered from CC0 samples. No copyrighted melody, sample or recording is included.
