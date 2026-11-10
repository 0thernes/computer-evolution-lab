# ◈ Computer Evolution Lab (v2.0)

[![CI](https://github.com/0thernes/computer-evolution-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/0thernes/computer-evolution-lab/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2F0thernes%2Fcomputer-evolution-lab%2Fmain%2Fdocs%2Fbadges%2Fcoverage.json)](docs/badges/coverage.json)
[![License](https://img.shields.io/badge/license-Cosmogonic%20Non--Commercial-0f766e)](LICENSE)

> **17 operational historical, modern, and frontier computers + an 18-scene 4K HDR 3D interactive museum** — featuring a live dual-engine **RISC-V `RV32IM` + WebGL2 GPU Modern Mini PC**, real-time **X/Y/Z 3D Cross-Section Slicer**, **153 live hardware & software abstraction layer visualizers**, and a **real-time symphonic WebAudio score engine**.

---

## Users

**Who Computer Evolution Lab is for**:

- Computer architecture students, electrical engineers, and systems programmers inspecting real datapaths, caches, hazards, and hardware-software interfaces from mechanical relays to 5 nm chiplets.
- Graphics, shader, and simulation engineers exploring live CPU-to-GPU memory-mapped I/O (`RV32IM` → WebGL2 `GLSL ES 3.0`), quantum density matrices, spiking biological wetware, and nanophotonic interference meshes.
- Educators and curious explorers who want hands-on, editable, zero-install 3D computer models that genuinely compute on every frame.

**Supported Platforms & Hardware**:

- **Browsers**: Chrome `>= 120`, Edge `>= 120`, Firefox `>= 122`, Safari `>= 17.4` with WebGL2 and WebAudio enabled across Windows, macOS, Linux, iPadOS, and Android (`360px` responsive mobile layout up to `3840×2160` 4K UHD).
- **Offline `file://` & HTTP**: Runs directly by double-clicking [`computer-evolution-lab.html`](computer-evolution-lab.html) (zero server required) or via the built-in zero-dependency loopback server (`npm start`).
- **Help & Security**: Press `?` inside the lab for interactive controls, see [`docs/INDEX.md`](docs/INDEX.md) for architecture documentation, or consult [`.github/SECURITY.md`](.github/SECURITY.md) for private security disclosures.

---

## Install

Zero build step and zero npm runtime dependencies are required:

```bash
# Option A: Zero-install offline launch — double-click directly in Explorer / Finder:
computer-evolution-lab.html   # or index.html (10.2 KB modular entrypoint)

# Option B: Local HTTP dev server on http://127.0.0.1:4173 (Node.js >= 20):
node tools/serve.mjs
```

---

## Highlights & Engineering Architecture

### 1. Real-Time Operational Hardware — Zero Cosmetic Fakes

Every single machine in the museum executes genuine instructions, differential equations, quantum state vectors, reaction-diffusion PDEs, or physical circuits on every animation frame:

| ID         | Era   | Machine                               | Live Computational Engine                                                                                                                                                                                                                     |
| :--------- | :---- | :------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `turing`   | 1936  | **Alan Turing Tape Machine**          | Exact state-transition table (`(q, sym) -> (q', sym', L/R)`), unbounded tape, head stepper                                                                                                                                                    |
| `z1`       | 1938  | **Konrad Zuse Z1**                    | Mechanical 22-bit binary floating-point adder/multiplier & sliding-plate memory                                                                                                                                                               |
| `analog`   | 1947  | **REAC Electronic Analog Computer**   | RK4 continuous op-amp integrator/summer patchbay solving live ODEs on CRT                                                                                                                                                                     |
| `tube`     | 1949  | **EDSAC Vacuum-Tube Computer**        | 18-bit accumulator ISA + acoustic mercury delay-line tank circulation                                                                                                                                                                         |
| `pdp8`     | 1965  | **DEC PDP-8 Straight-8**              | 12-bit PDP-8 ISA (`AND`, `TAD`, `ISZ`, `DCA`, `JMS`, `JMP`, `IOT`, `OPR`) + magnetic core plane                                                                                                                                               |
| `altair`   | 1975  | **MITS Altair 8800**                  | Cycle-faithful Intel 8080 CPU + working front-panel toggle switches & bus LEDs                                                                                                                                                                |
| `m6502`    | 1975  | **MOS 6502 & MOnSter 6502**           | Switch-level transistor netlist (`visual6502`) + 3,218 discrete SMD MOSFET carrier                                                                                                                                                            |
| `home80`   | 1982  | **1980s Home Micro (C64-class)**      | MOS 6510 CPU + line-numbered BASIC interpreter + 40×25 character/color video                                                                                                                                                                  |
| `pc90`     | 1992  | **1990s 486 Multimedia Tower**        | FAT16 cluster filesystem, BIOS `INT 13h` C/H/S spinning platter seek simulator, DOS shell                                                                                                                                                     |
| `pc00`     | 2002  | **2000s GHz-War ATX Tower**           | Configurable pipeline depth + 2-bit branch predictor + superscalar stall analyzer                                                                                                                                                             |
| `pc10`     | 2013  | **2010s Multicore FinFET Tower**      | 4-core / 8-thread SMT + Linux Completely Fair Scheduler (`vruntime` red-black tree)                                                                                                                                                           |
| `pc20`     | 2020s | **Modern Mini-ITX Workstation**       | **Dual-Engine**: 32-bit **RISC-V `RV32IM` 5-stage CPU** (`L1I`/`L1D`/`L2` caches, NVMe SSD, Mini-OS shell, 3D RGB keyboard) + **WebGL2 GLSL ES 3.0 GPU** (`512×512` = 262,144 parallel pixels/frame) linked over **PCIe MMIO (`0x20000000`)** |
| `aibox`    | 2021  | **4-GPU AI Supercomputer**            | Live multi-GPU backpropagation + ring-all-reduce gradient sync across 4 SXM CoWoS GPUs                                                                                                                                                        |
| `bci`      | 2022  | **DishBrain Wet Biocomputer**         | 100 spiking Izhikevich neurons on a TiN multi-electrode array learning Pong via STDP                                                                                                                                                          |
| `quantum`  | 2022  | **Desktop NMR Quantum Computer**      | Complex state-vector + density-matrix decoherence simulator, Bloch vectors & FID spectrum                                                                                                                                                     |
| `photonic` | 2017+ | **Programmable Nanophotonic Mesh**    | Clements `4×4` unitary Mach–Zehnder interferometer waveguide matrix (`U·x` by light interference)                                                                                                                                             |
| `alife`    | 2006+ | **Wet Reaction-Diffusion & DNA Gate** | Gray–Scott PDE (`128×128`), Belousov–Zhabotinsky waves & Seelig 2006 DNA toehold `AND` kinetics                                                                                                                                               |

---

### 2. Deep-Dive: 2020s Dual-Engine Modern Mini PC (`pc20`)

Located in [`src/sim/riscv-modern-pc.js`](src/sim/riscv-modern-pc.js) and [`src/machines/machine-pc20.js`](src/machines/machine-pc20.js):

- **CPU (`RV32IM`)**: Two-pass RISC-V assembler (`.text`, `.data`, `.word`, `.asciz`, labels, pseudo-instructions) driving a 5-stage pipeline (`IF` → `ID` → `EX` → `MEM` → `WB`) with EX/MEM data forwarding, load-use hazard detection, and a 64-entry 2-bit saturating branch history table.
- **Memory & Storage**: 64 KB unified RAM, 4-way `L1I` (2 KB) & `L1D` (4 KB) caches, 8-way `L2` (16 KB) cache, and simulated NVMe Gen5 SSD flash blocks + DMA (`0x30000000`).
- **PCIe 5.0 CPU→GPU Co-Processor Bridge**: Writing 32-bit integers to `0x20000000..0x2000000C` from RISC-V assembly streams normalized `uniform vec4 uCPU` parameters directly into the live WebGL2 fragment shader every frame.
- **Interactive 3D Peripherals**: Click any of the 58 physical keycaps on the 3D 65% mechanical RGB keyboard to depress its switch, play a mechanical keystroke sound, and push real ASCII into the CPU's UART RX FIFO (`0x10000008`). Switch the 27" 4K IPS monitor between `Split: GPU + RV32 OS`, `Full GPU Shader`, and `Full RV32 OS`.

---

### 3. 4K HDR PBR Graphics & Studio Inspection Tools

- **16-Bit Float MSAA Pipeline** ([`src/graphics/studio-stage.js`](src/graphics/studio-stage.js)): `HalfFloatType` render targets with `4×` WebGL2 hardware MSAA, calibrated `ACESFilmicToneMapping` (`exposure: 0.96`), subtle high-threshold bloom, and balanced three-point studio softbox HDRI reflections.
- **Macro-Grade Procedural PBR Materials** ([`src/graphics/pbr-materials.js`](src/graphics/pbr-materials.js), [`src/graphics/kit-3d.js`](src/graphics/kit-3d.js)): `2048×2048` multi-layer FR-4 PCB copper/solder-mask/ENIG pad textures (`anisotropy = 16`), thin-film iridescent photolithographed silicon dies (`U.siliconDie`), authentic purple-brown alumina ceramic MOS 6502 package (`U.mosCeramic`), brushed/knurled metals, chamfered enclosures, and multi-piece 3D SMD resistors/MLCCs/SOT-23s/QFPs.
- **Real-Time 3D Cross-Section Slicer (`X` key / `✂ Slice`)**: Slice dynamically along the `X`, `Y`, or `Z` plane with live offset & flip controls; 3D raycasting automatically ignores clipped geometry so you can click right into internal dies and components.
- **153 Live Abstraction Layers (`[`, `]`, `\`)**: Step every machine through **5 Hardware levels** (_System → Modules/Boards → Chips/Devices → Circuit → Physics_) and **4 Software levels** (_Application → OS/Runtime → ISA → Bits & Signals_).

---

### 4. Symphonic & Hybrid WebAudio Score Engine

Implemented in [`src/audio/cinematic-score.js`](src/audio/cinematic-score.js):

- **Concert-Hall Impulse Response**: Multi-tap early reflections + exponentially HF-damped late stereo diffusion tail.
- **Physical & Orchestral Voices**: Stereo divisi bowed strings with cello/violin wooden body formants & delayed vibrato, stretched-harmonic felt grand piano, 32'–2' cathedral pipe organ with wind chiff, conical-bore French horns & low brass swells, 3-formant (`a`/`o`/`u`) choir, Vangelis CS-80 ribbon lead, Bessel-mode concert timpani, and pocket-watch escapement.
- **Composer Palette Selector**: Auto-follow each era or manually select _Hans Zimmer_, _James Horner_, _Terrence Malick_, _Oliver Stone_, or _Vangelis / Synth_, paired with 24 hardware acoustic SFX + 4 CC0 archival hardware recordings.

---

## Tests

Automated verification covers static symbol/DOM integrity, standalone Node `RV32IM` + simulator unit tests (94.6% simulator line coverage), full headless Chrome WebGL2 execution across all **17 machines** and **153 layer visualizers**, `X/Y/Z` cross-section slicing, orchestral WebAudio synthesis, and direct `file://` double-click loading:

```bash
# Run deterministic Node unit tests (RV32IM assembler, pipeline, caches, MMIO, wetware PDEs)
node --test tests/simulators.test.mjs

# Run exhaustive static symbol, PBR helper, SFX, and HTML ID audit
node tools/audit-exhaustive.mjs

# Run full headless WebGL2 17-machine + 153-layer + audio + file:// verification suite
npm test

# Render 4K UHD (3840x2160) & Macro visual audit PNGs + white-clipping report
npm run audit:4k
```

---

## Keyboard Shortcuts

| Key                              | Action                                                               |
| :------------------------------- | :------------------------------------------------------------------- |
| `Drag` / `Right-Drag` / `Scroll` | Orbit / Pan / 10× Macro Zoom                                         |
| `Click` / `Double-Click`         | Inspect 3D component telemetry / Fly camera to part                  |
| `C`                              | Toggle outer shell cutaway transparency                              |
| `X`                              | Toggle real-time **3D Cross-Section Slicer** (`X` / `Y` / `Z` plane) |
| `E`                              | Toggle exploded assembly view                                        |
| `1` / `2` / `3` / `4`            | Camera presets: `Iso` / `Front` / `Top` / `Macro`                    |
| `L` / `S` / `R` / `F`            | Labels / Auto-Spin / Reset Camera / Focus Selected Part              |
| `[` / `]` / `\`                  | Step abstraction layer down / up / switch `Hardware ↔ Software`      |
| `T` / `G` / `H`                  | Guided Layer Tour / Era Comparison Chart / Return to Hub Gallery     |
| `Q` / `M` / `?`                  | Cycle Render Quality / Mute Score & SFX / Help Modal                 |

---

## License

Copyright © 2026 **0thernes (0thernes LLC)** (`0_0@0thernes.art`). Source-available for non-commercial research, study, and play under the **Cosmogonic License — Non-Commercial Research & Play** in [`LICENSE`](LICENSE); all commercial rights reserved. Third-party open-source and CC0 audio credits are documented in [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
