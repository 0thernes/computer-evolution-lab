# ◈ Computer Evolution Lab (v4.0)

[![CI](https://github.com/0thernes/computer-evolution-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/0thernes/computer-evolution-lab/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/live%204K%20web%20lab-0thernes.github.io-0284c7)](https://0thernes.github.io/computer-evolution-lab/)
[![Windows x64 .exe](https://img.shields.io/badge/Windows%20x64-Standalone%20.exe-2563eb)](https://github.com/0thernes/computer-evolution-lab/releases/latest)
[![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2F0thernes%2Fcomputer-evolution-lab%2Fmain%2Fdocs%2Fbadges%2Fcoverage.json)](docs/badges/coverage.json)
[![License](https://img.shields.io/badge/license-Cosmogonic%20Non--Commercial-0f766e)](LICENSE)

> **40 operational computers across 4 Grand Circles + a 41-scene 4K HDR 3D interactive museum** — spanning **Personal & Logic Foundations**, **Mainframes & Enterprise Servers**, **Supercomputers**, and **The Age of Quantum Computers**, complete with a **4-Tab MIT/Stanford/Caltech CS Architecture Atlas**, live **RISC-V `RV32IM` + WebGL2 GPU Modern Mini PC**, **X/Y/Z 3D Cross-Section Slicer**, **360 live hardware & software abstraction layer visualizers**, and an **acoustic concert-hall orchestral WebAudio film-score engine**.
>
> - **Launch Live in Browser (Zero Install)**: **[https://0thernes.github.io/computer-evolution-lab/](https://0thernes.github.io/computer-evolution-lab/)**
> - **Download Standalone Windows `.exe`**: **[GitHub Releases (`Computer Evolution Lab.exe`)](https://github.com/0thernes/computer-evolution-lab/releases/latest)**

---

## Users

**Who Computer Evolution Lab is for**:

- Computer science, electrical engineering, and systems students inspecting real datapaths, microcode, I/O channels, caches, coherence protocols, vector registers, 3D torus/Dragonfly interconnects, and quantum error correction from 1936 relays to fault-tolerant horizon QPUs.
- Graphics, shader, and simulation engineers exploring live CPU-to-GPU memory-mapped I/O (`RV32IM` → WebGL2 `GLSL ES 3.0`), Shor `QFT₂₅₆` period finding, Kitaev Majorana BdG Hamiltonians, spiking biological wetware, and nanophotonic interference meshes.
- Educators and curious explorers who want hands-on, editable, zero-install 3D computer models that genuinely compute on every frame.

**Supported Platforms & Hardware**:

- **Browsers**: Chrome `>= 120`, Edge `>= 120`, Firefox `>= 122`, Safari `>= 17.4` with WebGL2 and WebAudio enabled across Windows, macOS, Linux, iPadOS, and Android (`360px` responsive mobile layout up to `3840×2160` 4K UHD).
- **Native Windows Desktop App**: Standalone single-file x64 executable (`Computer Evolution Lab.exe` in [`desktop/`](desktop/)) with Per-Monitor V2 High-DPI support, Windows 11 Immersive Dark Mode titlebar, embedded loopback server, and hardware-accelerated Edge WebView2 (`F11` / `Alt+Enter` fullscreen).
- **Offline `file://` & HTTP**: Runs directly by double-clicking [`computer-evolution-lab.html`](computer-evolution-lab.html) (zero server required) or via the built-in zero-dependency loopback server (`npm start`).
- **Help & Security**: Press `?` inside the lab for interactive controls, press `G` (or click `📊 CS Atlas`) for the comparative CS Architecture Atlas, see [`docs/INDEX.md`](docs/INDEX.md) for architecture documentation, or consult [`.github/SECURITY.md`](.github/SECURITY.md) for private security disclosures.

---

## Install

Zero build step and zero npm runtime dependencies are required:

```bash
# Option A: Zero-install offline launch — double-click directly in Explorer / Finder:
computer-evolution-lab.html   # or index.html (10.4 KB modular entrypoint)

# Option B: Local HTTP dev server on http://127.0.0.1:4173 (Node.js >= 20):
node tools/serve.mjs

# Option C: Native Windows x64 single-file executable (.NET 10 + WebView2):
npm run build:exe         # builds "Computer Evolution Lab.exe"
npm run install:desktop   # installs to Windows Desktop & Start Menu Programs
```

---

## The 4 Grand Circles — 40 Operational Machines

Each Grand Circle in the 3D Campus surrounds its **★ Capital Breakthrough Monument** on an illuminated central dais:

### Circle I — Personal, Logic & Bio/Optical Frontier (`19` Machines · ★ Capital: `1975` MOS 6502)

| ID         | Era   | Machine                                     | Live Computational Engine                                                                                                                     |
| :--------- | :---- | :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `m6502` ★  | 1975  | **MOS 6502 & MOnSter 6502 (★ Capital)**     | Switch-level transistor netlist (`visual6502`) + 3,218 discrete SMD MOSFET carrier                                                            |
| `turing`   | 1936  | **Alan Turing Tape Machine**                | Exact state-transition table (`(q, sym) -> (q', sym', L/R)`), unbounded tape, head stepper                                                    |
| `z1`       | 1938  | **Konrad Zuse Z1**                          | Mechanical 22-bit binary floating-point adder/multiplier & sliding-plate memory                                                               |
| `analog`   | 1947  | **REAC Electronic Analog Computer**         | RK4 continuous op-amp integrator/summer patchbay solving live ODEs on CRT                                                                     |
| `tube`     | 1949  | **EDSAC Vacuum-Tube Computer**              | 18-bit accumulator ISA + acoustic mercury delay-line tank circulation                                                                         |
| `pdp8`     | 1965  | **DEC PDP-8 Straight-8**                    | 12-bit PDP-8 ISA (`AND`, `TAD`, `ISZ`, `DCA`, `JMS`, `JMP`, `IOT`, `OPR`) + magnetic core plane                                               |
| `agc66`    | 1966  | **Apollo Guidance Computer (Block II)**     | First flat-pack IC computer (`5,600` NOR3 gates), priority-scheduled Executive (`P63`/`P64`/`P66` + `1202` overload recovery), DSKY & rope    |
| `alto73`   | 1973  | **Xerox PARC Alto Workstation**             | `170 ns` 8-task cooperative microcode engine, hardware `BitBlt` rasterop (`606×808` portrait CRT), WIMP GUI, 3-button mouse & 3 Mbps Ethernet |
| `altair`   | 1975  | **MITS Altair 8800**                        | Cycle-faithful Intel 8080 CPU + working front-panel toggle switches & bus LEDs                                                                |
| `home80`   | 1982  | **1980s Home Micro (C64-class)**            | MOS 6510 CPU + line-numbered BASIC interpreter + 40×25 character/color video                                                                  |
| `pc90`     | 1992  | **1990s 486 Multimedia Tower**              | FAT16 cluster filesystem, BIOS `INT 13h` C/H/S spinning platter seek simulator, DOS shell                                                     |
| `pc00`     | 2002  | **2000s GHz-War ATX Tower**                 | Configurable pipeline depth + 2-bit branch predictor + superscalar stall analyzer                                                             |
| `arm07`    | 2007  | **Mobile ARM big.LITTLE Heterogeneous SoC** | `P = C·V²·f + V·I_leak` DVFS governor, heterogeneous P/E core scheduler, tile-based deferred GPU (`TBDR`), NPU, ISP & 5G baseband PoP SoC     |
| `pc10`     | 2013  | **2010s Multicore FinFET Tower**            | 4-core / 8-thread SMT + Linux Completely Fair Scheduler (`vruntime` red-black tree)                                                           |
| `pc20`     | 2020s | **Modern Mini-ITX Workstation**             | **Dual-Engine**: 32-bit **RISC-V `RV32IM` 5-stage CPU** (`L1I`/`L1D`/`L2` caches, NVMe, Mini-OS) + **WebGL2 GLSL ES 3.0 GPU** via PCIe MMIO   |
| `aibox`    | 2021  | **4-GPU AI Deskside Supercomputer**         | Live multi-GPU backpropagation + ring-all-reduce gradient sync across 4 SXM CoWoS GPUs                                                        |
| `bci`      | 2022  | **DishBrain Wet Biocomputer**               | 100 spiking Izhikevich neurons on a TiN multi-electrode array learning Pong via STDP                                                          |
| `alife`    | 2006+ | **Wet Reaction-Diffusion & DNA Gate**       | Gray–Scott PDE (`128×128`), Belousov–Zhabotinsky waves & Seelig 2006 DNA toehold `AND` kinetics                                               |
| `photonic` | 2017+ | **Programmable Nanophotonic Mesh**          | Clements `4×4` unitary Mach–Zehnder interferometer waveguide matrix (`U·x` by light interference)                                             |

### Circle II — Mainframes & Enterprise Servers (`6` Machines · ★ Capital: `1964` IBM System/360)

| ID        | Era  | Machine                                          | Live Computational Engine                                                                                                                   |
| :-------- | :--- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `s360` ★  | 1964 | **IBM System/360 Model 50 (★ Capital)**          | 32-bit GPR + Packed-BCD `AP` decimal ledger, ROS microcode control store, storage keys & autonomous `CCW` Tape/Disk/1403 I/O Channels       |
| `unix70`  | 1973 | **DEC PDP-11/70 UNIX v6 & ARPANET Server**       | Kernel/User 22-bit APR MMU relocation, `fork`/`exec`/`pipe` process table, hierarchical inode FS, UNIX shell (`ps`, `ls \| wc`, `cat`)      |
| `vax78`   | 1978 | **DEC VAX-11/780 32-Bit Virtual-Memory Server**  | Canonical `1.0 MIPS` CISC reference: `4 GiB` virtual space (`P0`/`P1`/`S0`), 2-way `TB` TLB, two-handed Working-Set clock & `K/E/S/U` rings |
| `sun90`   | 1993 | **Sun SPARCcenter RISC SMP & RAID-5 Server**     | 4-CPU snooping `MESI` (`M/E/S/I`) XDBus coherence FSM (`BusRd`, `BusRdX`, `BusUpgr`) + 5-disk SCSI RAID-5 live XOR parity reconstruction    |
| `cloud10` | 2014 | **Open-Compute Cloud Rack & Raft Cluster**       | 5-node `Raft` consensus FSM (leader election, split-brain quorum halt, `AppendEntries` WAL) + 48V busbar & 25.6 Tbps Clos Leaf-Spine        |
| `zmain20` | 2022 | **Telum z16 Zero-Downtime Enterprise Mainframe** | 2 GB Virtual L3/L4 cache ring, 5-channel `RAIM` full-DIMM failover, `PR/SM` LPARs & inline `<1 ms` neural fraud scoring inside ACID TPS     |

### Circle III — Supercomputers (`7` Machines · ★ Capital: `1976` Cray-1 Vector)

| ID          | Era  | Machine                                       | Live Computational Engine                                                                                                                      |
| :---------- | :--- | :-------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `cray1` ★   | 1976 | **Cray-1 Vector Supercomputer (★ Capital)**   | 80 MHz 64-element vector registers (`V0–V7`), 7-stage `FMUL` + 6-stage `FADD` pipelines & toggleable single-chime **Vector Chaining**          |
| `cdc6600`   | 1964 | **CDC 6600 First Supercomputer (Thornton)**   | Cycle-accurate **Thornton Scoreboard** (`Issue`/`ReadOps`/`Exec`/`WriteRes`) resolving `WAW`, `RAW`, and `WAR` hazards across 10 FUs + 10 PPUs |
| `cm2`       | 1987 | **Thinking Machines Connection Machine CM-2** | 256-PE active slice of 65,536 1-bit SIMD PEs, `O(log₂ N)` Hillis–Steele parallel prefix scan & 12-D hypercube `e-cube` XOR packet router       |
| `ascired97` | 1997 | **Intel ASCI Red First TeraFLOPS MPP**        | Commodity x86 "Attack of the Killer Micros" (`9,298` Pentium Pro CPUs): dimension-ordered `X→Y` **Wormhole Flit Router** (`H/B/T`) + `MPI`     |
| `bgene`     | 2008 | **IBM Blue Gene 3D Torus Supercomputer**      | `4×4×4` periodic 3D Torus Jacobi heat PDE (`±X, ±Y, ±Z` wrap) + hardware binary-tree `MPI_Allreduce` + live Amdahl vs. Gustafson law           |
| `exascale`  | 2022 | **Frontier 1.194-ExaFLOPS Supercomputer**     | Mixed-precision (`FP16` LU → `FP64` residual iterative refinement) HPL solver + 3-hop Slingshot Dragonfly UGAL adaptive optical routing        |
| `gb200`     | 2025 | **Blackwell NVL72 72-GPU AI Rack**            | Live trainable Top-2 Mixture-of-Experts (`MoE`) Transformer block (`FP8`/`FP4` backprop) + `130 TB/s` 5,000-wire copper NVLink5 spine          |

### Circle IV — The Age of Quantum Computers (`8` Machines · ★ Capital: `2045+` OMEGA-Q Horizon)

| ID          | Era   | Machine                                             | Live Computational Engine                                                                                                                   |
| :---------- | :---- | :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `qomega` ★  | 2045+ | **OMEGA-Q Fault-Tolerant Horizon QPU (★ Capital)**  | `d=31` `qLDPC` 10,000-logical-qubit spire: exact `QFT₂₅₆` Shor factoring (`15, 21, 33, 35`), `256`-state Grover & exact `1s` MO-CI `H₂` PES |
| `qion`      | 1995+ | **Trapped-Ion Linear Paul & QCCD Quantum Computer** | All-to-all `¹⁷¹Yb⁺` **Mølmer–Sørensen** (`XX(χ)`) shared-phonon entangler, `369.5 nm` state-dependent fluorescence & QCCD shuttle/cool      |
| `quantum`   | 1998+ | **Desktop SpinQ 2-Qubit NMR Quantum Computer**      | Liquid-state ensemble density-matrix `T₁/T₂` decoherence simulator, Bloch vectors & Free-Induction Decay (`FID`) spectrum                   |
| `qanneal`   | 2011+ | **Superconducting Flux-Qubit Quantum Annealer**     | Exact `2⁸×2⁸` (`256×256`) transverse-field **Ising Hamiltonian** solver (`H(s) = -A(s)∑σᵢˣ + B(s)[∑hᵢσᵢᶻ + ∑Jᵢⱼσᵢᶻσⱼᶻ]`) for Max-Cut        |
| `qatom`     | 2023  | **Neutral-Atom `⁸⁷Rb` Rydberg Optical Tweezers**    | RK4 integration of exact 4-state Rydberg blockade Hamiltonian (`C₆/R⁶` `CZ` gate) + 2D AOD physical zone shuttling                          |
| `qtransmon` | 2024  | **15 mK Dilution-Cryo & Surface-Code Transmon QPU** | 6-stage `³He/⁴He` cryostat (`15 mK`) + `d=3/5` Rotated Surface Code X/Z syndrome extraction, greedy decoder & `Λ = p_th/p` suppression      |
| `qphotonic` | 2025  | **Fusion-Based Room-Temp Photonic Cluster QPU**     | Exact 16-amplitude 4-qubit linear cluster state (`\|G₄⟩`) + destructive `XY(α)` SNSPD measurements & nanosecond Pauli feedforward           |
| `qtopo`     | 2025  | **Topological Majorana Nanowire Braiding QPU**      | Exact `16×16` Bogoliubov–de Gennes (`BdG`) Kitaev chain solver (`\|μ\| < 2t` MZM localization) + non-Abelian `σ₁, σ₂` braid unitaries       |

---

## MIT / Stanford / Caltech CS Engineering Atlas (`G` / `📊 CS Atlas`)

Press `G` or click `📊 CS Atlas` in the top toolbar to open the **4-tab** comparative engineering reference ([`src/app/compare-modal.js`](src/app/compare-modal.js)):

1. **Quantitative Plot & Primary-Source Specs (40 Machines)**: Filter by Grand Circle (`All 40`, `Circle I`, `Circle II`, `Circle III`, `Circle IV`) and plot Transistor/Element Scale, Clock/Rate, Memory Capacity, Power Envelope, and System Price on calibrated logarithmic scales (with `—` preserved strictly where historical/speculative figures are undocumented).
2. **Big-Drop Years vs. Quiet / Winter Bottleneck Years (`1936–2045+`)**: Contrasts explosive single-year bursts (`1964` S/360 + CDC 6600, `1966` Apollo AGC, `1973` C/UNIX + Alto + Ethernet, `1975–78` Altair/6502/Cray-1/VAX, `1993–97` SPARC SMP + Cirac–Zoller + ASCI Red, `2007` Mobile ARM SoC, `2022–25` Exascale + NVL72 + QEC threshold) against physical & software bottleneck periods (_1951–57 Tyranny of Numbers_, _1966–70 NATO Software Crisis_, _1988–92 2nd AI Winter_, _2002–05 Dennard Breakdown_, _2018–21 NISQ Plateau_).
3. **Mainframe vs. Server vs. Supercomputer vs. Quantum Matrix**: Side-by-side systems engineering comparison across Optimization Target, Failure Philosophy, I/O vs. FLOPS Balance, Memory Hierarchy, Canonical Workloads, and Flagship Lab Machines.
4. **⚛️ 8 Quantum Eras & Modalities (`1995–2045+`)**: Compares all 8 physical quantum architectures side-by-side (`qion`, `quantum`, `qanneal`, `qatom`, `qtransmon`, `qphotonic`, `qtopo`, `qomega`) across Qubit Encoding, Operating Temperature, Entangling Physics, Connectivity, Error Regime, and Live Lab Simulation.

---

## Tests

Automated verification covers static symbol/DOM integrity, standalone Node `RV32IM` + enterprise/HPC/quantum unit tests, full headless Chrome WebGL2 execution across all **40 machines** and **360 layer visualizers**, `X/Y/Z` cross-section slicing, 7 orchestral composer palettes, and direct `file://` double-click loading:

```bash
# Run deterministic Node unit tests (AGC, Alto, ARM DVFS, VAX VM, CDC 6600 Scoreboard, ASCI Red Wormhole, Trapped-Ion, Ising Annealer, S/360, MESI/RAID, Raft, Cray-1, CM-2, Torus, QEC, Rydberg, MBQC, Kitaev, Shor/Grover/H2)
node --test tests/simulators.test.mjs

# Run exhaustive static symbol, PBR helper, SFX, and HTML ID audit
node tools/audit-exhaustive.mjs

# Run full headless WebGL2 40-machine + 360-layer + audio + file:// verification suite
npm test

# Render 4K UHD (3840x2160) & Macro visual audit PNGs + white-clipping report
npm run audit:4k
```

---

## Keyboard Shortcuts

| Key                              | Action                                                                 |
| :------------------------------- | :--------------------------------------------------------------------- |
| `Drag` / `Right-Drag` / `Scroll` | Orbit / Pan / 15× Macro Zoom                                           |
| `Click` / `Double-Click`         | Inspect 3D component telemetry / Fly camera to part                    |
| `C`                              | Toggle outer shell cutaway transparency                                |
| `X`                              | Toggle real-time **3D Cross-Section Slicer** (`X` / `Y` / `Z` plane)   |
| `E`                              | Toggle exploded assembly view                                          |
| `1` / `2` / `3` / `4`            | Camera presets: `Iso` / `Front` / `Top` / `Macro`                      |
| `L` / `S` / `R` / `F`            | Labels / Auto-Spin / Reset Camera / Focus Selected Part                |
| `[` / `]` / `\`                  | Step abstraction layer down / up / switch `Hardware ↔ Software`        |
| `T` / `G` / `H`                  | Guided Layer Tour / **CS Architecture Atlas** / Return to 4-Circle Hub |
| `Q` / `M` / `?`                  | Cycle Render Quality / Mute Score & SFX / Help Modal                   |
| `F11` / `Alt+Enter`              | Toggle borderless 4K fullscreen (Windows Desktop `.exe`)               |

---

## License

Copyright © 2026 **0thernes (0thernes LLC)** (`0_0@0thernes.art`). Source-available for non-commercial research, study, and play under the **Cosmogonic License — Non-Commercial Research & Play** in [`LICENSE`](LICENSE); all commercial rights reserved. Third-party open-source and CC0 audio credits are documented in [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
