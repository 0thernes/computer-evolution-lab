# ◈ Computer Evolution Lab (v6.0)

[![CI](https://github.com/0thernes/computer-evolution-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/0thernes/computer-evolution-lab/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/live%204K%20web%20lab-0thernes.github.io-0284c7)](https://0thernes.github.io/computer-evolution-lab/)
[![Windows x64 .exe](https://img.shields.io/badge/Windows%20x64-Standalone%20.exe-2563eb)](https://github.com/0thernes/computer-evolution-lab/releases/latest)
[![Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2F0thernes%2Fcomputer-evolution-lab%2Fmain%2Fdocs%2Fbadges%2Fcoverage.json)](docs/badges/coverage.json)
[![License](https://img.shields.io/badge/license-Cosmogonic%20Non--Commercial-0f766e)](LICENSE)
[![Version](https://img.shields.io/badge/version-6.0.0-7c3aed)](CHANGELOG.md)
[![Assets](https://img.shields.io/badge/assets-CC0%201.0-16a34a)](CREDITS.md)
[![6502](https://img.shields.io/badge/6502-Dormann%20functional%20test%20in%20CI-f59e0b)](tools/dormann-6502.mjs)

> **48 hard-wired operational computers across 4 Grand Circles + a 49-scene 4K HDR 3D interactive museum** — spanning **Personal, Hard-Wired & Wafer-Scale Foundations (`22`)**, **Mainframes & Enterprise Servers (`8`)**, **Supercomputers (`9`)**, and **The Age of Quantum Computers (`9` Physical Modalities)**, complete with a **5-Tab MIT/Stanford/Caltech CS Roofline & Physics Atlas**, live **RISC-V `RV32IM` + WebGL2 GPU Modern Mini PC**, **gate bench + eye-diagram scope driven by 8 switching-family templates (`528` primary rungs / `1,584` sub-lens views)**, **3D Hardware Bus Wave-Packet Propagation (`BusPulse3D`)**, **X/Y/Z CAD Laser-Reticle Cross-Section Slicer**, an **original orchestral score sampled from the CC0 VSCO 2 CE orchestra** (with a procedural WebAudio fallback), and **CC0 ambientCG PBR textures + Poly Haven HDRI lighting** with GTAO, SMAA, selective bloom and close-up depth of field.
>
> - **Launch Live in Browser (Zero Install)**: **[https://0thernes.github.io/computer-evolution-lab/](https://0thernes.github.io/computer-evolution-lab/)**
> - **Download Standalone Windows `.exe`**: **[GitHub Releases (`Computer Evolution Lab.exe`)](https://github.com/0thernes/computer-evolution-lab/releases/latest)**

---

## Users

**Who Computer Evolution Lab is for**:

- Computer science, electrical engineering, and systems students inspecting real datapaths, microcode, I/O channels, caches, coherence protocols, vector registers, 3D torus/Dragonfly interconnects, and quantum error correction from 1936 relays to fault-tolerant horizon QPUs.
- Graphics, shader, and simulation engineers exploring live CPU-to-GPU memory-mapped I/O (`RV32IM` → WebGL2 `GLSL ES 3.0`), Shor period finding (exact FFT, N ≤ 255), Kitaev Majorana BdG Hamiltonians, spiking biological wetware, and nanophotonic interference meshes.
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
# Option A (recommended): local server on http://127.0.0.1:4173 (Node.js >= 20), works offline.
# Loads the CC0 textures, HDRI, sampled score and recorded SFX.
node tools/serve.mjs

# Option B: double-click index.html (file://). Browsers block local asset loading there,
# so you get procedural materials, RoomEnvironment lighting and the synthesized score.
computer-evolution-lab.html   # or index.html

# Optional full asset tier (2K maps, 2K HDRI, full-bitrate stems, ~96 MB):
# download cel-assets-full-v6.0.0.zip from the v6.0.0 release and unzip it at the repo root.

# Option C: Native Windows x64 single-file executable (.NET 10 + WebView2):
npm run build:exe         # builds "Computer Evolution Lab.exe"
npm run install:desktop   # installs to Windows Desktop & Start Menu Programs
```

The `.exe` is not code-signed ([ADR 0004](docs/adr/0004-no-code-signing.md)), so SmartScreen will warn. Check the download against the SHA-256 in the release notes: `Get-FileHash .\Computer-Evolution-Lab-win-x64.exe -Algorithm SHA256`.

On phones the lab picks a lower quality tier from device capabilities, shows lightweight proxies in the hub and builds each machine when you open it ([ADR 0005](docs/adr/0005-mobile-tier-lazy-build.md)). Add `?hub=full` or `?q=high` to override.

## What is real and what is modelled

| Claim                  | Status                                                                                                         | How it's checked                      |
| :--------------------- | :------------------------------------------------------------------------------------------------------------- | :------------------------------------ |
| 6502 behavioural core  | Passes Klaus Dormann's 6502 functional test, decimal mode included                                             | `node tools/dormann-6502.mjs` (in CI) |
| 6502 transistor mode   | Real visual6502 netlist, fetched on request, pinned and SHA-256-verified                                       | in-app                                |
| RV32IM pipeline        | Cycle-stepped 5-stage pipeline; architectural state identical to an ISS on 200 random programs and all presets | `tests/rv32-pipeline.test.mjs`        |
| Shor                   | Exact state-vector simulation with FFT; odd composites up to N = 255, refuses above                            | `tests/golden.test.mjs`               |
| H₂                     | STO-3G exact integrals + 2×2 full CI; R_e 0.735 Å (basis-set error vs. 0.741 Å)                                | `tests/simulators.test.mjs`           |
| CM-2, Cray-1 kernels   | Compared with independent reference computations                                                               | `tests/golden.test.mjs`               |
| Cray-1 cycle counts    | Closed-form timing model, labelled in the UI                                                                   | —                                     |
| Apollo AGC             | Conceptual model (7-word rope, 4 opcodes, scripted 1202), labelled in the UI                                   | —                                     |
| Gate bench / eye scope | 8 switching-family templates, labelled in the UI                                                               | `tests/simulators.test.mjs`           |

Design decisions are recorded in [`docs/adr/`](docs/adr/).

---

## The 4 Grand Circles — 48 Hard-Wired Operational Machines

Each Grand Circle in the 3D Campus surrounds its **★ Capital Breakthrough Monument** on an illuminated central dais, with real-time 3D wave-packets (`BusPulse3D`) flying across active hardware buses:

### Circle I — Personal, Hard-Wired, Symbolic & Wafer-Scale Frontier (`22` Machines · ★ Capital: `1975` MOS 6502)

| ID         | Era   | Machine                                          | Live Computational Engine                                                                                                                                                                                                                        |
| :--------- | :---- | :----------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `m6502` ★  | 1975  | **MOS 6502 & MOnSter 6502 (★ Capital)**          | Switch-level transistor netlist (`visual6502`) + 3,218 discrete SMD MOSFET carrier                                                                                                                                                               |
| `turing`   | 1936  | **Alan Turing Tape Machine**                     | Exact state-transition table (`(q, sym) -> (q', sym', L/R)`), unbounded tape, head stepper                                                                                                                                                       |
| `z1`       | 1938  | **Konrad Zuse Z1**                               | Mechanical 22-bit binary floating-point adder/multiplier & sliding-plate memory                                                                                                                                                                  |
| `eniac46`  | 1946  | **ENIAC Hard-Wired Plugboard & Decade Rings**    | `6` signed 10-digit vacuum-tube decade-ring accumulators, coaxial `CPP`/Digit patch cords & Function Table `G(Mach)` ballistic shell integration                                                                                                 |
| `analog`   | 1947  | **REAC Electronic Analog Computer**              | RK4 continuous op-amp integrator/summer patchbay solving live ODEs on CRT                                                                                                                                                                        |
| `tube`     | 1949  | **EDSAC Vacuum-Tube Computer**                   | 18-bit accumulator ISA + acoustic mercury delay-line tank circulation                                                                                                                                                                            |
| `pdp8`     | 1965  | **DEC PDP-8 Straight-8**                         | 12-bit PDP-8 ISA (`AND`, `TAD`, `ISZ`, `DCA`, `JMS`, `JMP`, `IOT`, `OPR`) + magnetic core plane                                                                                                                                                  |
| `agc66`    | 1966  | **Apollo Guidance Computer (Block II)**          | First flat-pack IC computer (`5,600` NOR3 gates), priority-scheduled Executive (`P63`/`P64`/`P66` + `1202` overload recovery), DSKY & rope                                                                                                       |
| `alto73`   | 1973  | **Xerox PARC Alto Workstation**                  | `170 ns` 8-task cooperative microcode engine, hardware `BitBlt` rasterop (`606×808` portrait CRT), WIMP GUI, 3-button mouse & 3 Mbps Ethernet                                                                                                    |
| `altair`   | 1975  | **MITS Altair 8800**                             | Cycle-faithful Intel 8080 CPU + working front-panel toggle switches & bus LEDs                                                                                                                                                                   |
| `home80`   | 1982  | **1980s Home Micro (C64-class)**                 | MOS 6510 CPU + line-numbered BASIC interpreter + 40×25 character/color video                                                                                                                                                                     |
| `lisp83`   | 1983  | **Symbolics 3600 / MIT CADR LISP Machine**       | 36-bit hardware-tagged architecture (`2b CDR-code + 4b tag + 30b payload`), symbolic `deriv`/`mapcar` evaluator & Cheney two-space copying GC                                                                                                    |
| `pc90`     | 1992  | **1990s 486 Multimedia Tower**                   | FAT16 cluster filesystem, BIOS `INT 13h` C/H/S spinning platter seek simulator, DOS shell                                                                                                                                                        |
| `pc00`     | 2002  | **2000s GHz-War ATX Tower**                      | Configurable pipeline depth + 2-bit branch predictor + superscalar stall analyzer                                                                                                                                                                |
| `arm07`    | 2007  | **Mobile ARM big.LITTLE Heterogeneous SoC**      | `P = C·V²·f + V·I_leak` DVFS governor, heterogeneous P/E core scheduler, tile-based deferred GPU (`TBDR`), NPU, ISP & 5G baseband PoP SoC                                                                                                        |
| `pc10`     | 2013  | **2010s Multicore FinFET Tower**                 | 4-core / 8-thread SMT + Linux Completely Fair Scheduler (`vruntime` red-black tree)                                                                                                                                                              |
| `pc20`     | 2020s | **Modern Mini-ITX Workstation**                  | **Dual-Engine**: 32-bit **RISC-V `RV32IM` cycle-stepped 5-stage pipeline** (forwarding, load-use stalls, branch flushes, `L1I`/`L1D`/`L2` miss penalties; diffed against an ISS in CI), NVMe, Mini-OS + **WebGL2 GLSL ES 3.0 GPU** via PCIe MMIO |
| `aibox`    | 2021  | **4-GPU AI Deskside Supercomputer**              | Live multi-GPU backpropagation + ring-all-reduce gradient sync across 4 SXM CoWoS GPUs                                                                                                                                                           |
| `bci`      | 2022  | **DishBrain Wet Biocomputer**                    | 100 spiking Izhikevich neurons on a TiN multi-electrode array learning Pong via STDP                                                                                                                                                             |
| `wse24`    | 2024  | **300 mm Wafer-Scale Dataflow & Spiking Engine** | 84-reticle monolithic wafer (`44 GB` 1-cycle SRAM, `21 PB/s`), color-routed wavelet dataflow, LIF `STDP` spiking mode & spare-core defect bypass                                                                                                 |
| `alife`    | 2006+ | **Wet Reaction-Diffusion & DNA Gate**            | Gray–Scott PDE (`128×128`), Belousov–Zhabotinsky waves & Seelig 2006 DNA toehold `AND` kinetics                                                                                                                                                  |
| `photonic` | 2017+ | **Programmable Nanophotonic Mesh**               | Clements `4×4` unitary Mach–Zehnder interferometer waveguide matrix (`U·x` by light interference)                                                                                                                                                |

### Circle II — Mainframes & Enterprise Servers (`8` Machines · ★ Capital: `1964` IBM System/360)

| ID         | Era  | Machine                                           | Live Computational Engine                                                                                                                   |
| :--------- | :--- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `s360` ★   | 1964 | **IBM System/360 Model 50 (★ Capital)**           | 32-bit GPR + Packed-BCD `AP` decimal ledger, ROS microcode control store, storage keys & autonomous `CCW` Tape/Disk/1403 I/O Channels       |
| `unix70`   | 1973 | **DEC PDP-11/70 UNIX v6 & ARPANET Server**        | Kernel/User 22-bit APR MMU relocation, `fork`/`exec`/`pipe` process table, hierarchical inode FS, UNIX shell (`ps`, `ls \| wc`, `cat`)      |
| `tandem77` | 1977 | **Tandem NonStop-16 Fault-Tolerant Cluster**      | Share-nothing 4-CPU `Process Pairs`, dual `Dynabus X/Y`, mirrored RAID-1 & Jim Gray `WAL` `UNDO`/`REDO` preserving exact `$1,000,000` ACID  |
| `vax78`    | 1978 | **DEC VAX-11/780 32-Bit Virtual-Memory Server**   | Canonical `1.0 MIPS` CISC reference: `4 GiB` virtual space (`P0`/`P1`/`S0`), 2-way `TB` TLB, two-handed Working-Set clock & `K/E/S/U` rings |
| `sun90`    | 1993 | **Sun SPARCcenter RISC SMP & RAID-5 Server**      | 4-CPU snooping `MESI` (`M/E/S/I`) XDBus coherence FSM (`BusRd`, `BusRdX`, `BusUpgr`) + 5-disk SCSI RAID-5 live XOR parity reconstruction    |
| `blade04`  | 2004 | **Dual-Opteron x86-64 Hypervisor & ccNUMA Blade** | 24-access 2D Nested Page Table (`EPT`/`RVI`) walk + VPID TLB, `KSM` RAM deduplication, HyperTransport `ccNUMA` & `O(1)` `epoll` C10K engine |
| `cloud10`  | 2014 | **Open-Compute Cloud Rack & Raft Cluster**        | 5-node `Raft` consensus FSM (leader election, split-brain quorum halt, `AppendEntries` WAL) + 48V busbar & 25.6 Tbps Clos Leaf-Spine        |
| `zmain20`  | 2022 | **Telum z16 Zero-Downtime Enterprise Mainframe**  | 2 GB Virtual L3/L4 cache ring, 5-channel `RAIM` full-DIMM failover, `PR/SM` LPARs & inline `<1 ms` neural fraud scoring inside ACID TPS     |

### Circle III — Supercomputers (`9` Machines · ★ Capital: `1976` Cray-1 Vector)

| ID           | Era  | Machine                                       | Live Computational Engine                                                                                                                                                                                      |
| :----------- | :--- | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cray1` ★    | 1976 | **Cray-1 Vector Supercomputer (★ Capital)**   | 80 MHz 64-element vector registers (`V0–V7`), 7-stage `FMUL` + 6-stage `FADD` pipelines & toggleable single-chime **Vector Chaining** (kernel computed for real; clock counts from a closed-form timing model) |
| `cdc6600`    | 1964 | **CDC 6600 First Supercomputer (Thornton)**   | Cycle-accurate **Thornton Scoreboard** (`Issue`/`ReadOps`/`Exec`/`WriteRes`) resolving `WAW`, `RAW`, and `WAR` hazards across 10 FUs + 10 PPUs                                                                 |
| `systolic82` | 1982 | **Kung–Leiserson 2D VLSI Systolic Array**     | Cycle-accurate `4×4` skewed-wavefront `MAC` grid (`Output-Stationary` & TPU `Weight-Stationary`) verifying exact `C = A × B` in 10 beats                                                                       |
| `cm2`        | 1987 | **Thinking Machines Connection Machine CM-2** | 256-PE active slice of 65,536 1-bit SIMD PEs, `O(log₂ N)` Hillis–Steele parallel prefix scan & 12-D hypercube `e-cube` XOR packet router                                                                       |
| `ascired97`  | 1997 | **Intel ASCI Red First TeraFLOPS MPP**        | Commodity x86 "Attack of the Killer Micros" (`9,298` Pentium Pro CPUs): dimension-ordered `X→Y` **Wormhole Flit Router** (`H/B/T`) + `MPI`                                                                     |
| `bgene`      | 2008 | **IBM Blue Gene 3D Torus Supercomputer**      | `4×4×4` periodic 3D Torus Jacobi heat PDE (`±X, ±Y, ±Z` wrap) + hardware binary-tree `MPI_Allreduce` + live Amdahl vs. Gustafson law                                                                           |
| `fugaku20`   | 2020 | **RIKEN / Fujitsu Fugaku A64FX & 6D TofuD**   | `512`-bit predicated ARM `SVE` (`WHILELT` zero-remainder loops), `1 TB/s` 4-CMG `HBM2`, `6D` TofuD torus failover & sparse `HPCG` CG solver                                                                    |
| `exascale`   | 2022 | **Frontier 1.194-ExaFLOPS Supercomputer**     | Mixed-precision (`FP16` LU → `FP64` residual iterative refinement) HPL solver + 3-hop Slingshot Dragonfly UGAL adaptive optical routing                                                                        |
| `gb200`      | 2025 | **Blackwell NVL72 72-GPU AI Rack**            | Live trainable Top-2 Mixture-of-Experts (`MoE`) Transformer block (`FP8`/`FP4` backprop) + `130 TB/s` 5,000-wire copper NVLink5 spine                                                                          |

### Circle IV — The Age of Quantum Computers (`9` Machines · ★ Capital: `2045+` OMEGA-Q Horizon)

| ID          | Era   | Machine                                             | Live Computational Engine                                                                                                                                                                                    |
| :---------- | :---- | :-------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qomega` ★  | 2045+ | **OMEGA-Q Fault-Tolerant Horizon QPU (★ Capital)**  | `d=31` `qLDPC` 10,000-logical-qubit spire: exact Shor factoring for odd composites up to `N = 255` (`143`, `221`, `253` …), `256`-state Grover & STO-3G full-CI `H₂` curve (`R_e` 0.735 Å vs. 0.741 Å expt.) |
| `qion`      | 1995+ | **Trapped-Ion Linear Paul & QCCD Quantum Computer** | All-to-all `¹⁷¹Yb⁺` **Mølmer–Sørensen** (`XX(χ)`) shared-phonon entangler, `369.5 nm` state-dependent fluorescence & QCCD shuttle/cool                                                                       |
| `quantum`   | 1998+ | **Desktop SpinQ 2-Qubit NMR Quantum Computer**      | Liquid-state ensemble density-matrix `T₁/T₂` decoherence simulator, Bloch vectors & Free-Induction Decay (`FID`) spectrum                                                                                    |
| `qanneal`   | 2011+ | **Superconducting Flux-Qubit Quantum Annealer**     | Exact `2⁸×2⁸` (`256×256`) transverse-field **Ising Hamiltonian** solver (`H(s) = -A(s)∑σᵢˣ + B(s)[∑hᵢσᵢᶻ + ∑Jᵢⱼσᵢᶻσⱼᶻ]`) for Max-Cut                                                                         |
| `qatom`     | 2023  | **Neutral-Atom `⁸⁷Rb` Rydberg Optical Tweezers**    | RK4 integration of exact 4-state Rydberg blockade Hamiltonian (`C₆/R⁶` `CZ` gate) + 2D AOD physical zone shuttling                                                                                           |
| `qtransmon` | 2024  | **15 mK Dilution-Cryo & Surface-Code Transmon QPU** | 6-stage `³He/⁴He` cryostat (`15 mK`) + `d=3/5` Rotated Surface Code X/Z syndrome extraction, greedy decoder & `Λ = p_th/p` suppression                                                                       |
| `qspin`     | 2024  | **Loss–DiVincenzo `²⁸Si/SiGe` Spin-Qubit QPU**      | `1.2 K` hot-qubit `300 mm` CMOS QPU: exact 4-spin Heisenberg exchange `√SWAP`/`CNOT`, `²⁹Si` isotopic `T₂*` physics & Pauli Spin Blockade                                                                    |
| `qphotonic` | 2025  | **Fusion-Based Room-Temp Photonic Cluster QPU**     | Exact 16-amplitude 4-qubit linear cluster state (`\|G₄⟩`) + destructive `XY(α)` SNSPD measurements & nanosecond Pauli feedforward                                                                            |
| `qtopo`     | 2025  | **Topological Majorana Nanowire Braiding QPU**      | Exact `16×16` Bogoliubov–de Gennes (`BdG`) Kitaev chain solver (`\|μ\| < 2t` MZM localization) + non-Abelian `σ₁, σ₂` braid unitaries                                                                        |

---

## 11-Rung × 3-Sub-Lens Deep Layer Stack (`528` Primary Rungs · `1,584` Interactive Views)

Every single one of the **48 machines** exposes **11 primary hardware & software abstraction rungs** (`6 Hardware`: _Physical Substrate_, _Transistor & Gate Switch_, _Combinational & ALU_, _Clock, Bus & Interconnect_, _Memory & Storage Hierarchy_, _I/O, Peripherals & Chassis_; `5 Software`: _Microcode & Control Signals_, _ISA & Machine Code_, _Assembler, Compiler & ABI_, _Kernel, Scheduler & Runtime_, _Live Application & Telemetry_), and **every rung** can be drilled into across **3 live Sub-Layer Lenses** (`src/layers/layer-stack.js`, `src/layers/hardwired-gate-engine.js`):

1. **`◈ Rung View`**: Domain-specific architecture & telemetry visualizer matched to highlighted 3D hardware sub-assemblies.
2. **`⚡ Gate Bench` (`HardWiredNetlistSolver`)**: Interactive 6-gate full-adder / reversible Feynman–Toffoli netlist bench across 8 physical switching-family **templates** (mechanical sliding plates, thermionic vacuum triodes, bipolar RTL/TTL/ECL, depletion NMOS, planar CMOS, FinFET/GAA wafer-scale, bio/photonic wave-plates, and reversible quantum gates) — click input pins `[A, B, CIN, MODE]` directly on the canvas or couple live to the running CPU bus!
   These are family templates: every machine in a family shows the same generic adder slice with that family's voltages and delays. They are not each machine's own netlist. The only real per-machine netlist is the 6502's (visual6502, opt-in).
3. **`🔬 Signal Eye`**: Real-time multi-trace analog voltage rail (`V_OH` / `V_OL`), `RC` rise/fall slew, propagation delay `t_pd`, thermal jitter eye diagram, and dynamic `E_sw = ½ C V²` switching-energy scope.

---

## MIT / Stanford / Caltech CS Engineering Atlas (`G` / `📊 CS Atlas` — 5 Tabs)

Press `G` or click `📊 CS Atlas` in the top toolbar to open the **5-tab** comparative engineering reference ([`src/app/compare-modal.js`](src/app/compare-modal.js)):

1. **Quantitative Plot & Primary-Source Specs (48 Machines)**: Filter by Grand Circle (`All 48`, `Circle I`, `Circle II`, `Circle III`, `Circle IV`) and plot Transistor/Element Scale, Clock/Rate, Memory Capacity, Power Envelope, and System Price on calibrated logarithmic scales (with `—` preserved strictly where historical/speculative figures are undocumented).
2. **Big-Drop Years vs. Quiet / Winter Bottleneck Years (`1936–2045+`)**: Contrasts explosive single-year bursts (`1946` ENIAC, `1964` S/360 + CDC 6600, `1966` Apollo AGC, `1973` C/UNIX + Alto + Ethernet, `1975–78` Altair/6502/Cray-1/Tandem/VAX, `1982–83` Systolic VLSI + Symbolics LISP, `2004–07` x86-64 VT-x + Mobile ARM SoC, `2020–25` Fugaku SVE + Exascale + WSE-3 + NVL72 + `²⁸Si` Spin + QEC threshold) against physical & software bottleneck periods.
3. **Mainframe vs. Server vs. Supercomputer vs. Quantum Matrix**: Side-by-side systems engineering comparison across Optimization Target, Failure Philosophy, I/O vs. FLOPS Balance, Memory Hierarchy, Canonical Workloads, and Flagship Lab Machines.
4. **⚛️ 9 Quantum Eras & Modalities (`1995–2045+`)**: Compares all 9 physical quantum architectures side-by-side (`qion`, `quantum`, `qanneal`, `qatom`, `qtransmon`, `qspin`, `qphotonic`, `qtopo`, `qomega`) across Qubit Encoding, Operating Temperature, Entangling Physics, Connectivity, Error Regime, and Live Lab Simulation.
5. **📐 Roofline & `½CV²` Switching Physics Lab**: Interactive log-log **Williams–Waterman–Patterson Roofline Model** (`P = min(P_peak, I × BW_mem)`) with live Operational Intensity (`FLOP/Byte`) slider & kernel presets (`SpMV / HPCG`, `FFT`, `FlashAttention-2`, `FP64 DGEMM`, `FP8 TensorCore`), paired with a `10¹⁹×` switching-energy cascade down to the **Landauer thermodynamic limit (`k_B T ln 2 ≈ 2.87 zJ`)**.

---

## Tests

Automated verification covers static symbol/DOM integrity, standalone Node `RV32IM` + frontier/enterprise/HPC/quantum + universal netlist unit tests, full headless Chrome WebGL2 execution across all **48 machines** and **528 primary layer visualizers (`1,584` sub-lens views)**, `BusPulse3D` 3D wave-packets, `X/Y/Z` cross-section slicing, 7 mood palettes, and direct `file://` double-click loading:

```bash
# Unit tests: simulators, RV32 pipeline vs ISS, golden values, security, analog compiler, version sync
node --test tests/*.test.mjs

# Klaus Dormann 6502 functional test (downloads the GPL-3 binary at a pinned commit; not vendored)
node tools/dormann-6502.mjs

# Formatting
npx prettier@3.10.1 --check "**/*.{html,css,js,mjs,json,md,yml}"

# Run exhaustive static symbol, PBR helper, SFX, and HTML ID audit
node tools/audit-exhaustive.mjs

# Run full headless WebGL2 48-machine + 528-layer (1,584 sub-lens) + audio + file:// verification suite
npm test

# Render 51 4K UHD (3840x2160) & UI visual audit PNGs + white-clipping report
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

Copyright © 2026 **0thernes (0thernes LLC)** (`0_0@0thernes.art`). Source-available for non-commercial research, study, and play under the **Cosmogonic License — Non-Commercial Research & Play** in [`LICENSE`](LICENSE); all commercial rights reserved. Third-party code and CC0 media are credited in [`CREDITS.md`](CREDITS.md), [`SOUNDS.md`](SOUNDS.md) and [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
