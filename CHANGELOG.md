# Changelog

All notable changes to **Computer Evolution Lab** are documented in this file.

## [Unreleased]

### Changed

- CI runs on the latest Node.js only (26.x; current LTS "Lithium" is 26.13.1). Node 20 was removed after its headless WebGL job hung for 25+ minutes on the v6.0.0 push. `engines.node` is now `>=26.0.0`.

## [6.0.0] - 2026-11-13

Ports the v6 prototype's graphics, sampled score and sound into the 48-machine lab, and fixes all 49 findings of the v5 review ([`docs/REVIEW-v5.md`](docs/REVIEW-v5.md)).

### Added

- **CC0 assets, standard tier in git** ([ADR 0001](docs/adr/0001-asset-hosting.md)):
  - ambientCG 1K PBR detail maps on the shared materials, with world-scale box UVs;
  - Poly Haven `studio_small_09` HDRI image-based lighting;
  - 18 sampled cues (3 stems each) rendered from VSCO 2 CE;
  - 8 recorded SFX.
    The optional full tier (2K maps, 2K HDRI, full-bitrate stems) ships as the release zip `cel-assets-full-v6.0.0.zip`. On `file://`, procedural materials and the synth score are used, and assets swap in only after a successful load.
- **Post-processing from v6:** GTAO, SMAA, threshold-selective bloom and close-up depth of field. three.js r170 is rebuilt from npm (`tools/build-vendor.mjs`). Ultra really supersamples past `devicePixelRatio`, capped at 3840×2160.
- **Displays and 6502 die:** CRT and LCD display shaders. The 6502 die gets a transistor-scale close-zoom LOD that draws the real visual6502 polygons in transistor mode.
- **Phones** ([ADR 0005](docs/adr/0005-mobile-tier-lazy-build.md)):
  - capability-based quality tier;
  - lazy scene building, with proxies in the hub, a build on enter and LRU geometry disposal;
  - progressive full-hub build on desktop;
  - 44 px touch targets, a collapsible toolbar, a landscape info drawer and touch hints.
- **Accessibility:** focus-visible styles, `prefers-reduced-motion`, a labelled `role="application"` canvas and an `aria-live` region.
- **Tests and CI:**
  - `tests/rv32-pipeline.test.mjs` diffs the pipeline against an ISS;
  - `tests/golden.test.mjs` checks against independent references;
  - `tests/security.test.mjs`, `tests/analog-patch.test.mjs` and `tests/version.test.mjs`;
  - `tools/dormann-6502.mjs` runs Klaus Dormann's functional test, fetched at CI time;
  - CI runs on a Node 20/22 matrix with SHA-pinned actions and a Prettier check;
  - CODEOWNERS, `.editorconfig` and `CITATION.cff`;
  - history model documented in `CONTRIBUTING.md`: plain commits on `main`, no PRs, branches or dependency bots.
- **Offline build pipeline:** `tools/score/` and `tools/assets/`.
- **Docs:** `CREDITS.md`, `SOUNDS.md` and ADRs 0001–0006.

### Changed

- **RV32IM** ([ADR 0006](docs/adr/0006-rv32-pipeline.md)): now a real cycle-stepped 5-stage pipeline, with forwarding, load-use stalls, EX branch resolution with flushes, BHT/JAL predecode, cache-miss penalties and traps. `step()` advances one clock.
- **H₂:** real STO-3G full CI, giving R_e 0.735 Å and E −1.1373 Ha. The fudge factor was removed, and the test now pins R_e to 0.741 ± 0.01 Å.
- **Shor:** uses Q = 2^⌈log₂N²⌉ with an exact FFT and base retry, and factors odd composites up to N = 255. Larger N throws a `RangeError`, and the UI states the limit.
- **Hub performance:** the default proxy hub at Low draws 66 calls and 31,022 triangles, against 14,616 calls and 16.1 M triangles in v5.
- **Score labels** ([ADR 0002](docs/adr/0002-score-attribution.md)): no composer or film names. The palettes are renamed to moods, and saved settings are migrated.
- **Honesty labels:**
  - gate bench and eye scope are "family template" (Z1 is mechanical, not relay);
  - the AGC is a "conceptual model";
  - the Cray-1 clock counts are a "timing model";
  - pc20's frame time is "CPU submit ms".
- **pc20 on touch devices:** the GPU target is 512² and pixels are read back every 6th frame.
- **License** ([ADR 0003](docs/adr/0003-license-wording.md)): "patent pending" removed, terms unchanged.
- **Versions:** VERSION, `package.json`, the csproj and `CITATION.cff` are all 6.0.0, and a test checks they agree.

### Fixed

- **Path traversal:** prefix-sibling traversal (`<root>-other/`) fixed in `tools/serve.mjs` and the desktop loopback server.
- **Desktop loopback server:**
  - accepts only `GET`/`HEAD` with a loopback `Host` and same-origin `Origin`;
  - DevTools only with `--devtools`.
- **Assembler:** immediate and shift range checks with per-line errors, and `.word` forward references.
- **Default tier:** a phone in landscape no longer gets the High tier.
- **Analog patch-panel compiler:** whitelists characters and own-property built-ins.
- **visual6502 netlist:** pinned to a commit and verified by SHA-256.
- **Content-Security-Policy:** added, and the inline boot script moved to `src/core/boot-guard.js`.
- **Rendering:** `preserveDrawingBuffer` turned off.
- **Audio:** the AudioContext is suspended in background tabs.
- **CI audio check:** now measures real SFX events and notes instead of a hard-coded 3.
- **Docs:**
  - `SECURITY.md` now covers 6.x and makes accurate network, CSP and server claims;
  - `THIRD-PARTY-NOTICES.md` lists the real SFX files and licenses.

### Removed

- Four committed SFX loops that nothing played.

### Deferred

- **I1 / I2 / I14:** de-minifying the bundle-derived sources and splitting them into per-machine ES modules. It is a large mechanical rewrite with a high regression risk, and the alias map is indexed in `docs/ALIASES.md`.
- **P5:** async PBO readback in pc20. Readback is less frequent but still synchronous.

## [2.1.1] - 2026-11-11

### Added

- Standalone Windows x64 single-file executable (`Computer-Evolution-Lab-win-x64.exe`) with all web assets embedded, a multi-instance-safe WebView2 profile and a Desktop/Start Menu installer.

## [5.0.0] - 2026-11-12

### Added

- **Hard-Wired Operational Overcharge — 48 Operational Computers (`49` Live 4K 3D Scenes · `528` Primary Rungs · `1,584` Interactive Sub-Lens Views)**:
  - **Circle I Hard-Wired, Symbolic & Wafer-Scale Milestones (`src/machines/machines-hardwired.js`, `src/sim/hardwired-frontier-sims.js`)**:
    - **`eniac46` (`1946` UPenn ENIAC Hard-Wired Plugboard & Decade Rings)**: 6 signed 10-digit vacuum-tube decade-ring accumulators (`100 kHz` 10-pulse addition cycle), interactive coaxial `CPP` & Digit Trunk patch cords, and 104-entry Function Table `G(Mach)` supersonic artillery drag integration (`dx/dt`, `dy/dt`, `dv_x/dt`, `dv_y/dt`), Fibonacci ring cascade, and finite-difference squares/cubes table.
    - **`lisp83` (`1983` Symbolics 3600 / MIT CADR Hardware-Tagged LISP Machine)**: 36-bit hardware-tagged word architecture (`2-bit CDR-code + 4-bit tag + 30-bit payload`), live S-expression parser & evaluator (`deriv` symbolic differentiation, `mapcar`/`reduce`, lexical closures), `50%` cons-cell compaction via `CDR-NEXT`/`CDR-NIL`, and Cheney two-space ephemeral copying garbage collection with `DTP-FORWARD` broken-heart pointers.
    - **`wse24` (`2024` 300 mm Monolithic Wafer-Scale Dataflow & Neuromorphic Engine)**: Full `300 mm` `U.wafer` EUV reticle-stitched processor (`84` reticles, `44 GB` 1-cycle on-wafer SRAM @ `21 PB/s`), dual-mode spatial **Wavelet Dataflow** and asynchronous **Leaky Integrate-and-Fire (`LIF`) + `STDP` Neuromorphic** execution, plus click-to-inject lithographic defect bypass via redundant spare-core fabric routing.
  - **Circle II Fault-Tolerant & Virtualization Milestones (`src/machines/machines-servers.js`)**:
    - **`tandem77` (`1977` Tandem NonStop-16 Share-Nothing Fault-Tolerant Cluster)**: 4 independent CPU modules, dual `Dynabus X/Y` backplanes, mirrored dual-ported RAID-1 disks, active/backup **Process Pairs** (`$ATM-SW`, `$LEDGER`, `$CLEAR`, `$AUDIT`), and Jim Gray **Write-Ahead Logging (`WAL`)** `UNDO`/`REDO` crash recovery preserving an exact `$1,000,000.00` ACID ledger invariant under live fault injection.
    - **`blade04` (`2004` Dual-Opteron x86-64 Hypervisor, `ccNUMA` & `C10K` Blade Server)**: 24-reference 2D Nested Page Table (`EPT`/`RVI`) walk (`gVA -> gPA -> hPA`) with VPID-tagged TLB caching, `VT-x`/`AMD-V` vs. trap-and-emulate `VM-Exit` comparison, `KSM` + balloon memory overcommit, HyperTransport `ccNUMA` locality, and `O(1)` `epoll` vs. `O(N)` `select()` across `10,000` concurrent sockets.
  - **Circle III Systolic & Predicated Vector-HBM Milestones (`src/machines/machines-super.js`)**:
    - **`systolic82` (`1982` Kung–Leiserson 2D VLSI Systolic Array)**: Cycle-accurate `4×4` skewed-wavefront `MAC` array supporting both `Output-Stationary` and TPU-style `Weight-Stationary` schedules, proving exact `C = A × B` matrix multiplication in `3N - 2 = 10` beats with `6×` boundary SRAM reuse.
    - **`fugaku20` (`2020` RIKEN / Fujitsu Fugaku A64FX & 6D TofuD Supercomputer)**: `512`-bit predicated ARM `SVE` (`WHILELT` `P0` predicate mask eliminating scalar tail loops), 4 Core Memory Groups (`1,024 GB/s` `HBM2`), `6D` TofuD torus link-fault detour routing, and live sparse **Conjugate Gradient (`HPCG`)** convergence.
  - **Circle IV 9th Physical Quantum Modality (`src/machines/machines-quantum-age.js`)**:
    - **`qspin` (`1998/2024` Loss–DiVincenzo `²⁸Si/SiGe` Quantum-Dot Spin QPU)**: `1.2 K` "hot-qubit" `300 mm` CMOS quantum-dot processor integrating exact 16-amplitude 4-spin statevector evolution, Heisenberg exchange `U_ex(θ)` (`√SWAP` & 3-pulse exact `CNOT`), `²⁹Si` nuclear-spin Overhauser `T₂*` isotopic purification sweep (`50 ppm` vs. `46,700 ppm`), and **Pauli Spin Blockade (`PSB`)** singlet-triplet charge-sensor readout.
- **11-Rung × 3-Sub-Lens Deep Layer Stack (`528` Primary Rungs · `1,584` Sub-Lens Views) & Universal Gate Netlist Solver**:
  - Expanded every machine from 9 to **11 primary rungs** (`6 Hardware` + `5 Software`) and added **3 interactive Sub-Layer Drill-Down Lenses** (`0: ◈ Rung View`, `1: ⚡ Gate Bench`, `2: 🔬 Signal Eye`) in `src/layers/layer-stack.js` and `src/layers/hardwired-gate-engine.js`.
  - Implemented `HardWiredNetlistSolver` across all **8 physical switching families** (`mech_relay_plate`, `thermionic_tube`, `bipolar_rtl_ttl_ecl`, `nmos_depletion`, `planar_cmos`, `finfet_gaa_wafer`, `bio_photonic_wet`, `quantum_reversible`) with clickable canvas input pins `[A, B, CIN, MODE]` and live CPU bus coupling, plus 8 new domain visualizers (`eniacring`, `lisptag`, `waferfabric`, `tandemwal`, `hypervisorept`, `systolicpe`, `fugakusve`, `spinqdot`).
- **3D Hardware Bus Wave-Packet Propagation (`BusPulse3D`), Wafer PBR & 5-Tab Roofline Atlas**:
  - Hooked `Ra.prototype.pulse` into `LAB.busPulses` (`src/app/lab-main.js`) so every architectural bus pulse launches real 3D emissive wave-packets along hardware traces between matched 3D sub-assemblies (and across the 4-Circle Hub light bridges).
  - Added `U.wafer` `300 mm` EUV reticle-stitched silicon PBR maps, BGA solder-ball fanout grids + optical fiducials on `2048×2048` PCBs, shielded ferrite VRM inductors & HC-49 quartz crystal cans (`Dy`), and an anti-aliased `ShaderMaterial` CAD laser-reticle millimeter grid on `CrossSectionSlicer`.
  - Added **Tab 5 (`📐 Roofline & ½CV² Physics Lab`)** and expanded **Tab 4 (`⚛️ 9 Quantum Eras & Modalities`)** in `src/app/compare-modal.js`.

## [4.0.0] - 2026-11-11

### Added

- **Complete 40-Machine MIT / Stanford / Caltech CS Watershed Lineup (`40` Operational Computers / `41` Live 4K 3D Scenes / `360` Layers)**:
  - **Circle I Milestones (`src/machines/machines-milestones.js`)**:
    - **`agc66` (`1966` Apollo Guidance Computer Block II + DSKY)**: First IC computer (`5,600` Fairchild flat-pack `NOR3` gates), woven copper core-rope ROM (`36,864` 15-bit words), Hal Laning priority-scheduled Executive (`P63`/`P64`/`P66` lunar descent guidance), and live **1202 Executive Overflow** shedding low-priority radar jobs without aborting guidance, paired with an interactive EL-green **DSKY (`VERB` / `NOUN` / `PRO` / `KEY REL`)**.
    - **`alto73` (`1973` Xerox PARC Alto Workstation)**: `170 ns` 8-task cooperative microcode processor (`MRT`, `DHT`, `CURT`, `DWT`, `ETHT`, `EMULATOR`), hardware **`BitBlt` rasterop** (`SRC`, `OR`, `XOR`, `NOT`) driving a `606×808` portrait CRT with overlapping Smalltalk/Bravo windows, 3-button optical-mechanical mouse, Diablo removable disk pack, and `3 Mbps` Metcalfe/Boggs Ethernet ALOHA CSMA/CD transceiver.
    - **`arm07` (`2007` Mobile ARM big.LITTLE Heterogeneous SoC)**: Dennard-breakdown mobile paradigm (`P = C·V²·f + V·I_leak` DVFS governor + Tj thermal throttling) scheduling interactive/AI/background tasks across **Performance (`P`)** and **Efficiency (`E`)** cores, **Tile-Based Deferred Rendering (`TBDR`)** on-chip SRAM GPU, systolic INT8 **NPU**, camera **ISP**, and **5G OFDM** baseband inside a cutaway glass/titanium handset with PoP LPDDR5X.
  - **Circle II Virtual-Memory Milestone (`src/machines/machines-servers.js`)**:
    - **`vax78` (`1978` DEC VAX-11/780 32-Bit Virtual-Memory Server)**: Canonical `1.0 MIPS` architectural baseline implementing a `4 GiB` virtual address space (`P0` user, `P1` stack, `S0` VMS system space), 2-way set-associative Translation Buffer (`TB` TLB), two-handed **Working-Set clock** page replacement + Modified/Free Page Lists (demonstrating zero-thrashing locality vs. naive FIFO), `K/E/S/U` 4-ring protection, and `SBI` + `UNIBUS` cabinet hardware.
  - **Circle III Out-of-Order & TeraFLOPS Milestones (`src/machines/machines-super.js`)**:
    - **`cdc6600` (`1964` CDC 6600 First Supercomputer — Seymour Cray & James Thornton)**: Plus-shaped `+` 4-wing glass/aluminum Freon-cooled chassis (`600,000` silicon transistors + dense cordwood backplane wiring) running a cycle-accurate **Thornton Scoreboard** (`Issue` → `ReadOps` → `Exec` → `WriteRes`) resolving `WAW`, `RAW`, and `WAR` hazards dynamically across **10 heterogeneous Functional Units** and **10 barrel-multithreaded Peripheral Processors (`PP0–PP9`)**.
    - **`ascired97` (`1997` Intel ASCI Red — First `>1 TeraFLOPS` Commodity MPP)**: Multi-cabinet x86 mesh (`9,298` Pentium Pro CPUs) simulating **dimension-ordered `X→Y` Wormhole Flit Routing** (`Head` / `Body` / `Tail` flits holding channel reservations under contention without store-and-forward full-packet buffering) + `MPI` halo-exchange / `Allreduce`.
  - **Circle IV Complete 8-Modality Quantum Lineup & Upgraded `OMEGA-Q` (`src/machines/machines-quantum-age.js`)**:
    - **`qion` (`1995+` Trapped-Ion Linear Paul & QCCD Quantum Computer)**: UHV octagon chamber, gold RF/DC blade electrodes suspending a glowing `¹⁷¹Yb⁺` crystal chain, all-to-all **Mølmer–Sørensen (`XX(χ)`)** bichromatic shared-phonon entangling gates, `369.5 nm` state-dependent fluorescence histogram (`|1⟩` bright vs. `|0⟩` dark), and **QCCD** ion shuttling + sympathetic cooling.
    - **`qanneal` (`2011+` Superconducting Flux-Qubit Quantum Annealer)**: Multi-stage magnetic-shielded `15 mK` cryostat and Pegasus/Chimera niobium flux-qubit processor integrating the exact `256×256` (`2⁸`) transverse-field **Ising Hamiltonian** (`H(s) = -A(s)∑σᵢˣ + B(s)[∑hᵢσᵢᶻ + ∑Jᵢⱼσᵢᶻσⱼᶻ]`) with live instantaneous ground/excited spectral gap `Δ₀₁(s)` and Max-Cut / Spin-Glass / Fraud QUBO presets.
    - **Upgraded `qomega` (`2045+` OMEGA-Q Fault-Tolerant Horizon QPU)**: Expanded 3D monolithic spire with 6-tier gold cryo-stages, **4-module Photonic QPU Interconnect Ring** (`1,550 nm` telecom entanglement links), **Cryo-CMOS Magic-State `|T⟩` Factory Bank**, interactive Grover target selector, and arbitrary `R(Å)` `H₂` bond-length sweep.
- **72 New Abstraction Layers (`360` Total) & 4-Tab CS Engineering Atlas**:
  - Added 8 custom Canvas2D domain visualizers (`agcdsky`, `altoblt`, `armdvfs`, `vaxtlb`, `cdcscore`, `wormhole`, `ionpaul`, `annealising`) and `72` part-matched HW/SW layers (`src/layers/layers-expansion.js`).
  - Added **Tab 4 (`⚛️ 8 Quantum Eras & Modalities`)** in `src/app/compare-modal.js` comparing all 8 physical quantum computing eras & architectures side-by-side.
- **Acoustic Concert-Hall Orchestral Film-Score Overhaul & Macro PBR Materials**:
  - Upgraded `src/audio/cinematic-score.js` with Contrabass-reinforced divisi string formants (`2.05 kHz` Bridge Hill + `-4.8 dB` harshness dip + staggered bow entries + horsehair air), spruce-soundboard bichord felt grand piano, dual-formant nonlinear French horns, expressive `soloCello`, elegiac `soloTrumpet`, `concertSnareRoll`, bespoke `Malick` & `Stone` cues, `Nolan` palette, `400 Hz` Apollo inverter hum, and `1.4 Hz` Pulse-Tube dilution cryocooler breath.
  - Added `512×512` procedural `U.perfMesh`, `U.cryoGold`, and `U.corePlane` PBR materials (`0.00%` HDR bloom white-clipping) and `15×` macro zoom (`minDistance = 0.16`).

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

[Unreleased]: https://github.com/0thernes/computer-evolution-lab/compare/v6.0.0...HEAD
[6.0.0]: https://github.com/0thernes/computer-evolution-lab/compare/v5.0.0...v6.0.0
[5.0.0]: https://github.com/0thernes/computer-evolution-lab/compare/v4.0.0...v5.0.0
[4.0.0]: https://github.com/0thernes/computer-evolution-lab/compare/v3.0.0...v4.0.0
[3.0.0]: https://github.com/0thernes/computer-evolution-lab/compare/v2.1.1...v3.0.0
[2.1.1]: https://github.com/0thernes/computer-evolution-lab/compare/de3196b...v2.1.1
[2.0.0]: https://github.com/0thernes/computer-evolution-lab/commit/de3196b
