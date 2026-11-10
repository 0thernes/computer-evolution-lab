# Changelog

All notable changes to **Computer Evolution Lab** are documented in this file.

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
  - Zero-dependency HTTP server (`tools/serve.mjs`), Chrome DevTools Protocol WebGL2 harness (`tools/cdp-harness.mjs`), full 17-machine + 153-layer + audio + `file://` test suite (`tools/run-tests.mjs`), Node unit tests (`tests/simulators.test.mjs`), exhaustive static symbol auditor (`tools/audit-exhaustive.mjs`), and 4K UHD pixel-clipping auditor (`tools/render-4k-audit.mjs`).

### Fixed

- Eliminated severe HDR white-clipping and emissive blowouts caused by the legacy `3.5×` global shader chunk multiplier and uncalibrated dielectric albedos (`> 0.92`).
- Fixed MOnSter 6502 rear easel support legs poking through the front face of the tilted carrier PCB (`z = -1.18, rot.x = 0.32`).
- Eliminated browser `window.on` global collision by isolating the application orchestrator inside a clean IIFE (`src/app/lab-main.js`).
