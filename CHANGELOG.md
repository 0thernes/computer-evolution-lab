# Changelog

All notable changes to **Computer Evolution Lab** are documented in this file.

## [3.0.0] - 2026-11-11

### Added

- **4-Circle Architectural Campus (`32` Operational Machines / `33` Live 3D Scenes)**:
  - Expanded the museum into 4 spatial Grand Circles connected by illuminated floor light-bridges, concentric plaza rings, raised **★ Capital Breakthrough** centerpieces, and 1-click `#plaza-nav` camera flights (`All 4 Circles`, `Circle I–IV`):
    1. **Circle I — Personal, Logic & Bio/Optical (`16` machines, ★ Capital: `1975` MOS 6502)**: `m6502`, `turing`, `z1`, `analog`, `tube`, `pdp8`, `altair`, `home80`, `pc90`, `pc00`, `pc10`, `pc20`, `aibox`, `bci`, `photonic`, `alife`.
    2. **Circle II — Mainframes & Enterprise Servers (`5` machines, ★ Capital: `1964` IBM System/360)**: `s360` (Model 50 ROS microcode, 8-bit byte, Packed-BCD ledger, autonomous `CCW` channels), `unix70` (DEC PDP-11/70 22-bit APR MMU, `fork`/`exec`/`pipe`, inodes & ARPANET), `sun90` (Sun SPARCcenter 4-CPU snooping `MESI` + 5-disk SCSI RAID-5 XOR recovery), `cloud10` (Open-Compute 48V rack + 5-node `Raft` consensus & Clos fabric), and `zmain20` (Telum z16 2 GB Virtual L3/L4 ring, 5-channel `RAIM` memory failover & `<1 ms` inline AI fraud ACID scoring).
    3. **Circle III — Supercomputers (`5` machines, ★ Capital: `1976` Cray-1 Vector)**: `cray1` (270° Freon C-cylinder, `V0–V7` 64-element vector registers & single-chime Vector Chaining), `cm2` (Thinking Machines 65,536-PE SIMD Cube-of-Cubes, Hillis–Steele parallel prefix scan & 12-D hypercube `e-cube` XOR router), `bgene` (IBM Blue Gene 3D periodic Torus stencil + hardware binary-tree `MPI_Allreduce` + Amdahl/Gustafson law), `exascale` (ORNL Frontier `1.194 ExaFLOPS` mixed-precision iterative-refinement HPL + 3-hop Slingshot Dragonfly UGAL routing), and `gb200` (Blackwell NVL72 72-GPU liquid-cooled AI rack + trainable Top-2 Mixture-of-Experts over `130 TB/s` copper NVLink5).
    4. **Circle IV — The Age of Quantum Computers (`6` machines, ★ Capital: `2045+` OMEGA-Q Horizon)**: `quantum` (SpinQ 2-qubit NMR), `qatom` (`⁸⁷Rb` Rydberg optical tweezers + RK4 `C₆/R⁶` blockade `CZ` gate & 2D AOD zone shuttling), `qtransmon` (`15 mK` `³He/⁴He` dilution chandelier + below-threshold `d=3/5` Rotated Surface Code QEC), `qphotonic` (room-temperature fusion photonic `|G₄⟩` cluster-state MBQC + `4 K` SNSPD Pauli feedforward), `qtopo` (Kitaev `16×16` BdG Majorana nanowire tetron + non-Abelian `σ₁, σ₂` braiding), and `qomega` (fault-tolerant `d=31` `qLDPC` horizon QPU executing exact `QFT₂₅₆` Shor factoring of `15, 21, 33, 35`, `256`-state Grover search, and exact `1s` Slater MO-CI `H₂` potential energy surface).
- **135 New Hardware & Software Abstraction Layers (`288` Total Across 32 Machines)**:
  - Added `src/layers/layers-expansion.js` with 10 custom Canvas2D domain visualizers (`s360ch`, `unixapr`, `mesiraid`, `raftquorum`, `craypipe`, `cm2cube`, `torus3d`, `surfcodesyn`, `majoranabdg`, `omegashor`) and 135 part-matched hardware/software layer probes.
- **3-Tab MIT / Stanford / Caltech CS Engineering Atlas (`src/app/compare-modal.js`)**:
  - Added Circle-filtered quantitative log plots, a chronological **Big-Drop Years vs. Quiet / Winter Bottleneck Years (`1936–2045+`)** breakdown, and a **Mainframe vs. Server vs. Supercomputer vs. Quantum** comparative systems matrix.
- **Expanded Symphonic Score & Hardware Acoustics**:
  - Added 15 new orchestral score profiles and edge-triggered hardware acoustic SFX bindings across all enterprise, supercomputing, and quantum machines.

## [2.0.0] - 2026-11-10

### Added

- **Modular Zero-Build Architecture**: Decomposed the legacy 1.44 MB nested monolithic HTML file into 17 clean classic JS modules (`vendor/`, `assets/`, `src/core/`, `src/graphics/`, `src/sim/`, `src/layers/`, `src/audio/`, `src/machines/`, `src/app/`), 1 studio CSS stylesheet (`styles/lab.css`), and identical 10.2 KB `index.html` / `computer-evolution-lab.html` entrypoints supporting both `file://` double-click and HTTP servers without ES-module CORS errors.
- **Dual-Engine 2020s Modern Mini PC (`pc20`)**:
  - Full two-pass 32-bit **RISC-V `RV32IM` assembler** and **5-stage pipelined CPU (`IF/ID/EX/MEM/WB`)** (`src/sim/riscv-modern-pc.js`) with EX/MEM data forwarding, load-use hazard stalls, 64-entry 2-bit dynamic branch predictor, 4/8-way set-associative `L1I`/`L1D`/`L2` LRU caches, simulated NVMe Gen5 SSD + DMA, and interactive Mini-OS shell.
  - **PCIe 5.0 CPU→GPU Co-Processor Bridge (`0x20000000`)**: Live memory-mapped register writes from RISC-V assembly stream `uniform vec4 uCPU` parameters directly into the **WebGL2 GLSL ES 3.0 GPU** (`512×512` = 262,144 parallel pixel invocations/frame) with 48 live SM readback tiles on the AD104 silicon die.
  - **Interactive 3D Peripherals**: 58-key clickable 65% mechanical RGB keyboard feeding ASCII keystrokes into UART MMIO (`0x10000008`), wireless mouse, and switchable 27" 16:9 4K IPS monitor (`Split: GPU + RV32 OS`, `Full GPU Shader`, `Full RV32 OS`).
- **4K HDR PBR Studio Graphics & Macro Detail Overhaul**:
  - 16-bit `HalfFloatType` + `4×` WebGL2 MSAA post-processing composer (`StudioFX`), calibrated `ACESFilmicToneMapping` (`exposure: 0.96`), subtle high-threshold bloom, balanced three-point studio softbox HDRI, and derivative-antialiased (`fwidth`) multi-scale metric floor.
  - Procedural `2048×2048` FR-4 multi-layer PCB textures (`anisotropy = 16`), thin-film iridescent photolithographed silicon dies (`U.siliconDie`), authentic purple-brown alumina ceramic DIP-40 MOS 6502 (`U.mosCeramic`), chamfered enclosures, multi-piece 3D SMD populator (`Dy`), scientific C-mount optical camera with knurled focus/iris rings, and 3 graduated lead-screw syringe pumps on `alife`.
  - Real-time **3D Cross-Section Slicer (`X/Y/Z` plane cutaway)** with clipping-aware 3D raycasting and camera view presets (`Iso`, `Front`, `Top`, `Macro`).
- **Symphonic & Hybrid WebAudio Score Engine (`src/audio/cinematic-score.js`)**:
  - Concert-hall multi-reflection convolution reverb, stereo divisi strings with body formants & delayed vibrato, stretched-harmonic felt grand piano, 32'–2' cathedral pipe organ with wind chiff, conical-bore French horns & low brass swells, 3-formant choir, CS-80 ribbon lead, Bessel-mode timpani, pocket-watch escapement, 18 original multi-bar cues, manual Composer Palette selector, and 24 hardware acoustic SFX.
- **Automated Verification & 4K Audit Tooling**:
  - Zero-dependency HTTP server (`tools/serve.mjs`), Chrome DevTools Protocol WebGL2 harness (`tools/cdp-harness.mjs`), full WebGL2 + `file://` test suite (`tools/run-tests.mjs`), Node unit tests (`tests/simulators.test.mjs`), exhaustive static symbol auditor (`tools/audit-exhaustive.mjs`), and 4K UHD pixel-clipping auditor (`tools/render-4k-audit.mjs`).

### Fixed

- Eliminated severe HDR white-clipping and emissive blowouts caused by the legacy `3.5×` global shader chunk multiplier and uncalibrated dielectric albedos (`> 0.92`).
- Fixed MOnSter 6502 rear easel support legs poking through the front face of the tilted carrier PCB (`z = -1.18, rot.x = 0.32`).
- Eliminated browser `window.on` global collision by isolating the application orchestrator inside a clean IIFE (`src/app/lab-main.js`).
