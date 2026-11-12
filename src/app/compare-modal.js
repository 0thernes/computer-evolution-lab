// 5-Tab MIT / Stanford / Caltech CS Engineering Atlas, Roofline Lab & Quantitative Era Comparator
function Dc(selectMachine) {
  const overlay = q("div", {
    class: "overlay",
    onclick: (ev) => {
      if (ev.target === overlay) overlay.remove();
    },
  });

  const WING_META = {
    all: { label: "All 48 Machines", color: "#58c4ff" },
    personal: { label: "Circle I · Personal & Bio/Wafer (22)", color: "#ffb347" },
    servers: { label: "Circle II · Mainframes & Servers (8)", color: "#38bdf8" },
    super: { label: "Circle III · Supercomputers (9)", color: "#f97316" },
    quantum: { label: "Circle IV · Quantum Age (9)", color: "#c084fc" },
  };
  const CAPITALS = new Set(["m6502", "s360", "cray1", "qomega"]);

  let activeTab = "quant";
  let metric = "tr";
  let wingFilter = "all";

  const openAndClose = (id) => {
    overlay.remove();
    if (selectMachine) selectMachine(id);
  };

  // ---- TAB 1: Quantitative Log-Scale Plot & Primary-Source Table ----
  const plotCanvas = q("canvas", { class: "plot", style: { height: "310px" } });
  const tableWrap = q("div", { class: "ctable" });

  const getFilteredRows = () =>
    [...p0]
      .filter((r) => wingFilter === "all" || (r.wing || "personal") === wingFilter)
      .sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));

  const drawPlot = () => {
    if (activeTab !== "quant") return;
    const rect = plotCanvas.getBoundingClientRect();
    if (rect.width < 20) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    plotCanvas.width = Math.round(rect.width * dpr);
    plotCanvas.height = Math.round(rect.height * dpr);
    const ctx = plotCanvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    ctx.fillStyle = "#05080d";
    ctx.fillRect(0, 0, W, H);

    const rows = getFilteredRows();
    const posVals = rows.map((r) => r[metric]).filter((v) => v > 0);
    const logMin = posVals.length ? Math.floor(Math.log10(Math.min(...posVals))) : 0;
    const logMax = posVals.length ? Math.ceil(Math.log10(Math.max(...posVals))) : 1;
    const colW = (W - 72) / Math.max(1, rows.length);

    ctx.strokeStyle = "#1d293a";
    ctx.fillStyle = "#8b98a9";
    ctx.font = "10px ui-monospace, monospace";
    const stepExp = Math.max(1, Math.ceil((logMax - logMin) / 8));
    for (let e = logMin; e <= logMax; e += stepExp) {
      const y = H - 54 - ((e - logMin) / Math.max(1, logMax - logMin)) * (H - 82);
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(W - 8, y);
      ctx.stroke();
      ctx.fillText("10^" + e, 6, y + 3);
    }

    rows.forEach((row, idx) => {
      const val = row[metric];
      const bx = 64 + idx * colW;
      const isCap = CAPITALS.has(row.id);
      const wCol = (WING_META[row.wing || "personal"] || WING_META.personal).color;

      ctx.save();
      ctx.translate(bx + colW * 0.5, H - 6);
      ctx.rotate(-0.68);
      ctx.fillStyle = isCap ? "#fde047" : "#cfd8e3";
      ctx.font =
        (isCap ? "700 " : "") +
        (rows.length > 22 ? "9px" : "10px") +
        " ui-monospace, monospace";
      ctx.fillText((isCap ? "★" : "") + row.year + " " + row.id, 0, 0);
      ctx.restore();

      if (!(val > 0)) {
        ctx.fillStyle = "#48566a";
        ctx.fillText("—", bx + colW * 0.5 - 3, H - 60);
        return;
      }
      const y =
        H - 54 - ((Math.log10(val) - logMin) / Math.max(1, logMax - logMin)) * (H - 82);
      const grad = ctx.createLinearGradient(0, y, 0, H - 54);
      grad.addColorStop(0, isCap ? "#fde047" : wCol);
      grad.addColorStop(1, "#1e3a5f");
      ctx.fillStyle = grad;
      const barPad = Math.max(1.5, Math.min(4, colW * 0.16));
      ctx.fillRect(bx + barPad, y, Math.max(3, colW - barPad * 2), H - 54 - y);
      if (rows.length <= 18 || idx % 2 === 0 || isCap) {
        ctx.fillStyle = isCap ? "#fde047" : "#eef4fb";
        ctx.font = "9.5px ui-monospace, monospace";
        ctx.fillText(
          Wy(metric, val),
          bx + 1,
          Math.max(11, y - 4),
          Math.max(26, colW + 8),
        );
      }
    });
  };

  const renderTable = () => {
    tableWrap.innerHTML = "";
    const rows = getFilteredRows();
    tableWrap.append(
      q(
        "table",
        {},
        q(
          "tr",
          {},
          ...[
            "Year",
            "Circle",
            "Reference machine",
            ...Um.map((m) => m[1].split(" (")[0]),
            "Engineering notes · primary source",
          ].map((h) => q("th", {}, h)),
        ),
        ...rows.map((r) => {
          const wKey = r.wing || "personal";
          const wCol = (WING_META[wKey] || WING_META.personal).color;
          const isCap = CAPITALS.has(r.id);
          return q(
            "tr",
            {
              onclick: () => openAndClose(r.id),
              title: `Click to open ${r.name} in 3D`,
            },
            q("td", { style: { whiteSpace: "nowrap" } }, String(r.year)),
            q(
              "td",
              {},
              q(
                "span",
                {
                  class: "atlas-pill",
                  style: { borderColor: wCol, color: wCol },
                },
                wKey === "personal"
                  ? "I · Personal/Bio"
                  : wKey === "servers"
                    ? "II · Mainframe/Srv"
                    : wKey === "super"
                      ? "III · Supercomp"
                      : "IV · Quantum",
              ),
            ),
            q("td", {}, q("b", {}, (isCap ? "★ " : "") + r.name)),
            ...Um.map(([k]) =>
              q(
                "td",
                { style: { whiteSpace: "nowrap" } },
                k === "tr" && r.devices && r.tr == null ? r.devices : Wy(k, r[k]),
              ),
            ),
            q("td", { class: "small" }, r.note + " · " + r.src),
          );
        }),
      ),
    );
  };

  const metricSelect = q(
    "select",
    {
      onchange: (ev) => {
        metric = ev.target.value;
        drawPlot();
      },
    },
    ...Um.map(([k, label]) => q("option", { value: k, selected: k === metric }, label)),
  );

  const wingBtns = Object.entries(WING_META).map(([key, cfg]) =>
    q(
      "button",
      {
        class: "btn" + (key === wingFilter ? " on" : ""),
        onclick: () => {
          wingFilter = key;
          wingBtns.forEach((b, idx) =>
            b.classList.toggle("on", Object.keys(WING_META)[idx] === key),
          );
          renderTable();
          drawPlot();
        },
      },
      cfg.label,
    ),
  );

  const quantPane = q(
    "div",
    {},
    q(
      "p",
      { class: "small" },
      "Documented figures for the real historical/reference machine each 3D simulator models (log scale). “—” strictly marks not-applicable or undocumented figures — never fabricated or guessed. ★ denotes each Circle's central Capital Breakthrough monument. Click any row to jump directly into that 3D computer.",
    ),
    q(
      "div",
      { class: "row" },
      ...wingBtns,
      q("span", { style: { marginLeft: "auto" } }, "Metric "),
      metricSelect,
    ),
    plotCanvas,
    tableWrap,
  );

  // ---- TAB 2: Year-by-Year Watershed "Big Drops" vs. Quiet / Bottleneck / Winter Years ----
  const CHRONOLOGY = [
    {
      years: "1936–1938",
      kind: "drop",
      badge: "🔥 FOUNDATIONAL DROP",
      title: "Computability Theory & Binary Mechanical Floating-Point",
      body: "1936: Alan Turing defines the universal tape machine (proving the undecidability of the Halting Problem alongside Alonzo Church's λ-calculus). 1937: Claude Shannon's MIT master's thesis maps Boolean algebra onto switching relays. 1938: Konrad Zuse completes the mechanical binary floating-point Z1 in Berlin.",
      ids: ["turing", "z1"],
    },
    {
      years: "1945–1949",
      kind: "drop",
      badge: "🔥 BIG DROP CLUSTER",
      title:
        "ENIAC Electronic Speed (1946) · Stored-Program Architecture · Op-Amps & The Transistor",
      body: "1945–46: Mauchly, Eckert & ENIAC's six women programmers unleash 100 kHz electronic plugboard speed (5,000 additions/s across 17,468 vacuum tubes) while the EDVAC Draft formalizes stored-program execution. 1947: Bell Labs demonstrates the germanium transistor AND Ragazzini/Reeves pioneer op-amp analog computers. 1949: Cambridge EDSAC runs the first stored-program subroutine library.",
      ids: ["eniac46", "analog", "tube"],
    },
    {
      years: "1951–1957",
      kind: "quiet",
      badge: "🧊 BOTTLENECK ERA",
      title: "The 'Tyranny of Numbers' & Discrete Soldering Wall",
      body: "Why early-1950s machines hit a ceiling: vacuum tubes burned kilowatts with hours-long MTBF, and even discrete transistors required tens of thousands of hand-soldered joints (Bell Labs VP Jack Morton's 'Tyranny of Numbers'). Computing waited on materials physics until Jack Kilby (1958) and Robert Noyce (1959) invented the planar monolithic Integrated Circuit.",
      ids: ["tube"],
    },
    {
      years: "1964–1966",
      kind: "drop",
      badge: "🔥 SINGLE-YEAR MEGA-DROP",
      title:
        "1964: IBM System/360 + CDC 6600 Scoreboard + PDP-8 Mini + MIT Apollo Guidance IC Computer",
      body: "1964–66 is arguably the densest architectural burst in history: (1) IBM bets $5B on System/360 — standardizing the 8-bit byte, microcode compatibility, and CCW I/O channels; (2) Seymour Cray & James Thornton ship CDC 6600, the first supercomputer (10 functional units + out-of-order Scoreboard + 10 Barrel PPs); (3) DEC ships the $18,500 PDP-8 minicomputer (1965); (4) MIT Instrumentation Lab builds the Block II Apollo Guidance Computer (1966) out of 5,600 monolithic RTL NOR ICs, driving silicon chip prices down >95%.",
      ids: ["s360", "cdc6600", "pdp8", "agc66"],
    },
    {
      years: "1967–1970",
      kind: "quiet",
      badge: "🧊 SOFTWARE CRISIS",
      title:
        "The NATO Software Engineering Crisis & Apollo 11's Priority Executive Rescue (1969)",
      body: "Hardware throughput exploded faster than humans could write reliable assembly: OS/360 slipped years (~5,000 person-years, inspiring Fred Brooks's The Mythical Man-Month). In July 1969, Margaret Hamilton & Hal Laning's priority-preemptive Executive saved the Apollo 11 Lunar Landing during 1202/1201 radar overloads — coining 'Software Engineering' — while Thompson & Ritchie created UNIX at Bell Labs.",
      ids: ["agc66", "s360", "unix70"],
    },
    {
      years: "1973",
      kind: "drop",
      badge: "🔥 1973 SYSTEM DROP",
      title: "Xerox PARC Alto GUI + BitBLT + 3 Mbps Ethernet + Portable C UNIX Kernel",
      body: "1973 forged modern interactive & networked computing in 12 months: Xerox PARC booted the Alto personal workstation (606×808 portrait bitmapped GUI, 3-button mouse, Dan Ingalls's BitBLT rasterops, Smalltalk OOP, and Bob Metcalfe's CSMA/CD Ethernet), while Ritchie & Thompson rewrote UNIX in portable C on the PDP-11.",
      ids: ["alto73", "unix70"],
    },
    {
      years: "1975–1978",
      kind: "drop",
      badge: "🔥 THE 36-MONTH EXPLOSION",
      title:
        "Altair 8800 · $25 MOS 6502 · Cray-1 Vector · Tandem NonStop ACID · DEC VAX-11/780 32-Bit VM",
      body: "Five revolutions detonated back-to-back: Jan 1975 MITS Altair 8800 launches personal kits; Sept 1975 Chuck Peddle's team ships the 3,510-transistor MOS 6502 for $25; 1976 Seymour Cray delivers Cray-1 #1 (80 MHz, vector chaining); 1977 Treybig & Jim Gray ship Tandem NonStop share-nothing Process Pairs + Write-Ahead Logging for zero-downtime OLTP; 1977/78 DEC ships VAX-11/780 32-bit virtual memory.",
      ids: ["altair", "m6502", "cray1", "tandem77", "vax78"],
    },
    {
      years: "1982–1987",
      kind: "drop",
      badge: "🔥 VLSI, SYMBOLIC & SIMD",
      title:
        "Kung–Leiserson Systolic Array (1982) · Symbolics 3600 Tagged LISP (1983) · C64/PC · CM-2 (1987)",
      body: "1982: Kung & Leiserson formulate 2D VLSI Systolic Arrays (zero-fetch O(N)-reuse MAC wavefronts, the direct ancestor of Google TPUs & Tensor Cores) while home computers sweep millions of desks. 1983: Symbolics 3600 puts 36-bit hardware tags, CDR-coding & ephemeral GC on every word. 1987: Danny Hillis & Richard Feynman light up the 65,536-PE Connection Machine CM-2 hypercube.",
      ids: ["systolic82", "home80", "lisp83", "cm2"],
    },
    {
      years: "1988–1992",
      kind: "quiet",
      badge: "🧊 2ND AI WINTER",
      title: "The Second AI Winter & Collapse of Specialized Symbolic / Vector Hardware",
      body: "Expert systems & 36-bit Lisp machines collapsed as commodity CMOS RISC/x86 microprocessors ('Attack of the Killer Micros', Brooks & Hennessy/Patterson) doubled performance every 18 months. Specialized symbolic/SIMD vendors went bankrupt or consolidated, paving the way for shared-memory RISC SMP servers and wormhole-routed MPI clusters.",
      ids: ["lisp83", "cm2", "sun90", "ascired97"],
    },
    {
      years: "1993–1998",
      kind: "drop",
      badge: "🔥 WEB, TERAFLOPS & QUANTUM GATES",
      title:
        "SPARC SMP + RAID-5 (1993) · Cirac–Zoller Ion Trap (1995) · ASCI Red 1st TeraFLOPS (1997) · NMR QPU (1998)",
      body: "The 1990s detonated three frontiers simultaneously: enterprise web SMP servers (Sun SPARCcenter MESI snooping + RAID-5), Sandia/Intel ASCI Red smashing 1.338 TeraFLOPS across 9,298 Pentium Pros on an XY wormhole mesh (1997), and the first physical quantum logic gates in trapped atomic ions (Cirac–Zoller / Monroe–Wineland, 1995) and liquid-state NMR (1998).",
      ids: ["sun90", "pc90", "qion", "ascired97", "quantum"],
    },
    {
      years: "2002–2005",
      kind: "quiet",
      badge: "🧊 PHYSICS WALL & PIVOT",
      title:
        "Breakdown of Dennard Scaling (4 GHz Wall) -> Multicore, x86-64 Hypervisor Blades & C10K epoll",
      body: "Around 90 nm (2003–2004), subthreshold & gate-oxide leakage killed 10 GHz single-core plans and forced four architectural pivots at once: Dual-Opteron x86-64 ccNUMA + hardware-assisted VMware/Xen virtualization + Linux O(1) epoll C10K servers (2004), Multicore desktops, Mobile ARM DVFS, and cool low-wattage Petascale tori (Blue Gene).",
      ids: ["pc00", "blade04", "pc10", "arm07", "bgene"],
    },
    {
      years: "2006–2011",
      kind: "drop",
      badge: "🔥 MOBILE ARM, CLOUD, PETASCALE & ANNEALING",
      title:
        "Mobile ARM Multi-Touch SoC (2007) · DNA Logic (2006) · Petascale Blue Gene (2008) · Quantum Annealing (2011)",
      body: "Computing simultaneously shrank into every pocket and scaled to millions of cores: Apple/ARM shipped capacitive multi-touch pocket computers with DVFS & TBDR GPUs (2007, >250B ARM chips since); Seelig & Winfree demonstrated DNA strand logic (2006); Blue Gene/Roadrunner crossed Petascale (2008); and 15 mK superconducting RF-SQUID quantum annealers debuted commercially (2011).",
      ids: ["arm07", "alife", "bgene", "qanneal"],
    },
    {
      years: "2012–2017",
      kind: "drop",
      badge: "🔥 DEEP LEARNING & WSC DROP",
      title:
        "AlexNet (2012) · Raft & Kubernetes Warehouse Cloud (2014) · Transformers & Photonics (2017)",
      body: "GPUs ignited deep learning (2012); warehouse-scale datacenters standardized Clos Leaf-Spine optics, 48V busbars, and Raft/Paxos quorum state machines (2014); 2017 delivered both Vaswani's Transformer attention architecture and MIT's Shen et al. coherent nanophotonic MZI matrix processor.",
      ids: ["pc10", "cloud10", "photonic"],
    },
    {
      years: "2018–2021",
      kind: "quiet",
      badge: "🧊 RETICLE & NISQ PIVOT",
      title:
        "Reticle Wall -> CoWoS + HBM2 (RIKEN Fugaku A64FX, 2020) & Pre-QEC NISQ Plateau",
      body: "Monolithic ~858 mm² reticle limits forced 2.5D CoWoS + HBM packaging: RIKEN/Fujitsu Fugaku (2020) fused 512-bit ARM SVE with 1 TB/s on-package HBM2 and 6D TofuD to sweep all 4 global HPC crowns, while DGX A100 scaled AI chiplets and 50–100Q NISQ processors awaited below-threshold QEC.",
      ids: ["fugaku20", "aibox", "quantum"],
    },
    {
      years: "2022–2025",
      kind: "drop",
      badge: "🔥 EXASCALE, WAFER-SCALE & QEC",
      title:
        "Frontier Exascale · 300mm Wafer-Scale WSE-3 · ²⁸Si Spin-Dot & Below-Threshold QEC · Blackwell NVL72",
      body: "A historic multi-domain surge: ORNL Frontier breaks Exascale (2022); IBM z16 embeds 1 ms AI fraud scoring (2022); DishBrain biological neurons learn Pong (2022); Cerebras stitches 4 trillion transistors across a full 300 mm wafer with 44 GB 1-cycle SRAM (2024); 300 mm CMOS foundries fabricate 1.2 K ²⁸Si spin-dot qubits while neutral-atom & 15 mK transmon surface codes cross below-threshold QEC (2024); Majorana tetrons, fusion photonics & NVIDIA GB200 NVL72 debut (2025).",
      ids: [
        "pc20",
        "zmain20",
        "bci",
        "exascale",
        "wse24",
        "qatom",
        "qtransmon",
        "qspin",
        "qphotonic",
        "qtopo",
        "gb200",
      ],
    },
    {
      years: "2035–2045+",
      kind: "drop",
      badge: "🌌 FAULT-TOLERANT HORIZON",
      title: "Fault-Tolerant Modular Logical Quantum Supercomputing (OMEGA-Q Horizon)",
      body: "When high-rate qLDPC / topological logical vaults, magic-state distillation factories, and optical Bell-pair interconnects scale to thousands of error-corrected logical qubits (<10^-15 logical error), intractable BQP problems — Shor integer period-finding, ab-initio FeMoCo nitrogenase / catalyst Hamiltonians, and quantum many-body dynamics — become exact routine computations alongside classical exascale hosts.",
      ids: ["qomega"],
    },
  ];

  const timelinePane = q(
    "div",
    { class: "atlas-scroll" },
    q(
      "p",
      { class: "small" },
      "Decade summaries hide how technology actually moves: computing alternates between explosive single-year 'Big Drops' (like 1964, 1973, 1975–77, 1993, 2022–25) and apparent 'Quiet / Winter' bottlenecks where a physical or software wall (soldering reliability, OS complexity, Dennard leakage, NISQ decoherence) forces a brand-new architectural paradigm.",
    ),
    ...CHRONOLOGY.map((item) =>
      q(
        "div",
        { class: "atlas-card " + (item.kind === "quiet" ? "quiet" : "drop") },
        q(
          "div",
          { class: "row" },
          q("span", { class: "atlas-yr" }, item.years),
          q(
            "span",
            { class: "atlas-badge " + (item.kind === "quiet" ? "quiet" : "drop") },
            item.badge,
          ),
          q("b", {}, item.title),
        ),
        q(
          "div",
          { class: "small", style: { margin: "5px 0 7px", color: "#d5e0ec" } },
          item.body,
        ),
        q(
          "div",
          { class: "row" },
          ...item.ids.map((id) =>
            q(
              "button",
              { class: "chip", onclick: () => openAndClose(id) },
              (CAPITALS.has(id) ? "★ " : "↗ ") + id,
            ),
          ),
        ),
      ),
    ),
  );

  // ---- TAB 3: MIT / Stanford / Caltech Architecture Matrix ----
  const ARCH_ROWS = [
    [
      "Primary Engineering Goal",
      "Single-user interactive latency (<16 ms frame time), ergonomics & low $/device",
      "Zero-downtime ACID transaction integrity (99.99999% uptime = <3.2 s/yr) & massive deterministic I/O",
      "Horizontal throughput/$ across millions of independent stateless/sharded network requests",
      "Maximum tightly-coupled FLOPS & bisection bandwidth on ONE giant coupled physical/AI state",
      "Coherent Hilbert-space interference (2^n amplitudes) for structured BQP problems intractable classically",
    ],
    [
      "Are They the Same Thing?",
      "NO — optimizes single-thread boost + local GPU scanout",
      "NO — NOT a supercomputer! Optimizes I/O channels, decimal/ACID locks & hardware fault masking, not raw FLOPS",
      "NO — treats individual blades as cattle that WILL fail daily; reliability lives in Raft/Paxos software",
      "NO — sacrifices multi-tenant isolation so 10,000+ nodes step one PDE / LLM gradient in microsecond lockstep",
      "NO — NOT a faster general CPU! Cannot replace classical I/O or O(N) streaming; acts as a BQP co-processor",
    ],
    [
      "Memory & I/O Hierarchy",
      "64–128b DDR5 + PCIe NVMe + local GDDR/VRAM",
      "2 GB Virtual L4 ring + 5-channel RAIM ECC RAM + hundreds of dedicated FICON DMA optical channels",
      "NUMA DDR4/5 per sled + 100–400G Clos Leaf-Spine Ethernet + distributed NVMe object/WAL stores",
      "On-package HBM2e/HBM3e (TB/s/chip) + 3D Torus / Dragonfly RDMA / 130 TB/s NVLink5 copper spine",
      "No classical RAM (no-cloning theorem!): state lives in 15 mK transmons, 87Rb tweezers, photons, or Majorana parity",
    ],
    [
      "Fault-Tolerance & Error Model",
      "Consumer ECC optional; OS kernel panic / process restart on uncorrectable bit flip",
      "Dual lockstep CPU execution + transparent RAIM DIMM channel XOR recovery + live hot-swap drawers",
      "Hardware fails constantly; Kubernetes reschedules pods & Raft/Paxos replicates commits across >=3/5 racks",
      "Periodic global MPI state checkpoints streamed to parallel NVMe filesystems; Dragonfly routes around dead links",
      "Continuous non-destructive stabilizer syndromes (ZZZZ / XXXX) decoded in <1 µs via MWPM / qLDPC without measuring |ψ_L⟩",
    ],
    [
      "Parallelism Paradigm",
      "4–16 superscalar OoO cores + local SIMT GPU shaders",
      "Many concurrent I/O channel programs + hardware LPAR partitioning across thousands of short ACID txns",
      "Request-level / shard-level embarrassingly parallel microservices (MapReduce, RPCs)",
      "Vector chaining (Cray-1), 65,536-PE SIMD (CM-2), 3D Torus MPI (Blue Gene/Frontier), TP×EP×PP tensor collectives (NVL72)",
      "Quantum superposition + entanglement + constructive/destructive phase interference (QFT, Grover diffusion, Trotterization)",
    ],
    [
      "Canonical Workloads",
      "Compilers, CAD, browsers, real-time 3D graphics, local dev",
      "Global credit-card clearing, core banking ledgers, airline reservation ACID databases",
      "Web search, cloud APIs, distributed SQL/KV (Spanner/etcd), video & SaaS fleets",
      "Climate/fusion Navier–Stokes PDEs, nuclear stockpile HPL, trillion-parameter MoE LLM training",
      "Shor RSA/ECC period-finding, ab-initio quantum chemistry (H2, FeMoCo catalysis), Hubbard/materials simulation",
    ],
    [
      "Live 3D Machines in Lab",
      "eniac46 · agc66 · alto73 · ★ m6502 · altair · home80 · lisp83 · pc90 · pc00 · arm07 · pc10 · pc20 · aibox · wse24",
      "★ s360 · tandem77 · zmain20",
      "unix70 · vax78 · sun90 · blade04 · cloud10",
      "cdc6600 · ★ cray1 · systolic82 · cm2 · ascired97 · bgene · fugaku20 · exascale · gb200",
      "qion · quantum · qanneal · qatom · qtransmon · qspin · qphotonic · qtopo · ★ qomega",
    ],
  ];

  const matrixPane = q(
    "div",
    { class: "atlas-scroll" },
    q(
      "p",
      { class: "small" },
      "A core MIT 6.004 / Stanford CS149 / Caltech CS184 systems insight: 'Mainframes, Servers, Supercomputers, and Quantum Computers' are NOT marketing sizes of the same box — each was invented to conquer a fundamentally different physical bottleneck (I/O & zero-downtime ACID vs. scale-out request elasticity vs. coupled bisection bandwidth vs. exponential Hilbert-space interference).",
    ),
    q(
      "div",
      { class: "ctable" },
      q(
        "table",
        {},
        q(
          "tr",
          {},
          q("th", {}, "Architectural Dimension"),
          q("th", { style: { color: "#ffb347" } }, "I · Personal / Workstation"),
          q("th", { style: { color: "#38bdf8" } }, "II-A · Enterprise Mainframe"),
          q("th", { style: { color: "#60a5fa" } }, "II-B · Scale-Out Cloud Server"),
          q("th", { style: { color: "#f97316" } }, "III · Supercomputer (HPC / AI)"),
          q("th", { style: { color: "#c084fc" } }, "IV · Quantum Computer (QPU)"),
        ),
        ...ARCH_ROWS.map((cols, rIdx) =>
          q(
            "tr",
            {},
            q("td", {}, q("b", {}, cols[0])),
            ...cols.slice(1).map((txt) =>
              rIdx === ARCH_ROWS.length - 1
                ? q(
                    "td",
                    {},
                    ...txt.split(" · ").map((tok) => {
                      const cleanId = tok.replace("★ ", "").trim();
                      return q(
                        "button",
                        {
                          class: "chip",
                          style: { margin: "2px" },
                          onclick: () => openAndClose(cleanId),
                        },
                        tok,
                      );
                    }),
                  )
                : q("td", { class: "small", style: { color: "#d5e0ec" } }, txt),
            ),
          ),
        ),
      ),
    ),
  );

  // ---- TAB 4: All 9 Quantum Eras & Physical Modalities Compared (Circle IV Deep Dive) ----
  const QMOD_ROWS = [
    [
      "qion",
      "1995 / 2024",
      "Trapped Atomic Ions (¹⁷¹Yb⁺ Linear Paul / QCCD)",
      "Room-temp / 4 K UHV (10⁻¹¹ Torr)",
      "All-to-All Coulomb phonon bus; Mølmer–Sørensen XX(θ)",
      "T₂ > 10–60 s; >99.8% 2Q fidelity; slower µs–ms shuttling/gates",
      "Universal Gate-Model QEC (Steane / Color / Surface codes)",
    ],
    [
      "quantum",
      "1998",
      "Liquid-State Ensemble NMR (¹³C/¹H Chloroform)",
      "300 K Room Temp (High-field Tesla magnet)",
      "J-coupling scalar spin-spin evolution + RF pulses",
      "T₂ ~ seconds; pseudo-pure thermal ensemble vanishes as N/2^N > ~12 qubits",
      "Historical 1st Deutsch–Jozsa, Grover & 7-qubit Shor (N=15) demos",
    ],
    [
      "qanneal",
      "2011 / 2023",
      "Adiabatic Superconducting RF-SQUID Flux Annealer",
      "15 mK Dilution Cryostat (Mu-metal shielded)",
      "Pegasus / Zephyr coupler graph; H(s) = -A(s)∑X + B(s)H_Ising",
      "5,000+ physical flux spins; non-universal (Ising / QUBO optimization only)",
      "Quantum cotunneling across tall, thin NP-hard spin-glass barriers",
    ],
    [
      "qatom",
      "2023 / 2024",
      "Neutral-Atom ⁸⁷Rb Optical Tweezers (AOD/SLM)",
      "Room-temp UHV Chamber + µK Laser Cooling",
      "Dynamic 2D AOD shuttling + Van der Waals C₆/R⁶ Rydberg CZ blockade",
      "T₂ > 1 s; parallel transversal gates across 48+ logical qubits",
      "Zoned Storage ↔ Entangle ↔ Readout reconfigurable QEC",
    ],
    [
      "qtransmon",
      "2024",
      "Superconducting Transmon Surface-Code QPU (Willow-class)",
      "15 mK ³He/⁴He Dilution Refrigerator",
      "2D nearest-neighbor tunable couplers; fast ~20–40 ns CZ/iSWAP gates",
      "T₁/T₂ ~ 70–100 µs; ultra-fast MHz stabilizer cycle rate!",
      "1st Below-Threshold Rotated Surface Code (d=3->5->7 halves ε_L by Λ=2.14)",
    ],
    [
      "qspin",
      "2024",
      "²⁸Si/SiGe Foundry CMOS Quantum-Dot Spin QPU (Loss–DiVincenzo)",
      "1.2 K Pumped-⁴He ('Hot-Qubit' + Cryo-CMOS)",
      "50 nm gate pitch; Heisenberg J(V) S₁·S₂ √SWAP/CNOT + Co micromagnet EDSR",
      "1,000,000× denser than transmons; T₂* ~ 36 µs (50 ppm ²⁸Si), Echo ~28 ms",
      "Pauli Spin Blockade (PSB) RF-SET singlet-triplet readout on 300mm CMOS wafers",
    ],
    [
      "qphotonic",
      "2025",
      "Measurement-Based Fusion Photonic QPU (MBQC)",
      "300 K Si₃N₄/BaTiO₃ Waveguides + 4 K SNSPDs",
      "Type-II Bell fusion + optical fiber delay loops (no stationary qubits)",
      "Zero thermal decoherence in flight; photon loss is primary erasure channel",
      "3D Raussendorf fault-tolerant cluster lattice + ns Pauli feedforward",
    ],
    [
      "qtopo",
      "2025",
      "Topological InAs/Al Majorana Nanowire Tetron",
      "~20 mK + ~1.5 T Axial Magnetic Field",
      "Non-local fermion parity iγ₁γ₂ (|μ| < 2t Kitaev phase) + QD interferometry",
      "Intrinsic hardware protection against local charge/phase noise",
      "Non-Abelian Ising anyon braiding (σ₁σ₂ ≠ σ₂σ₁) + measurement-only Floquet QEC",
    ],
    [
      "qomega",
      "2045+ ★",
      "OMEGA-Q Fault-Tolerant Horizon Super-QPU (Speculative)",
      "1.8 K Superfluid He-II + Room-Temp Optical Links",
      "Modular high-rate qLDPC vaults + photonic Bell routers + 15-to-1 |T⟩ factories",
      "Logical error ε_L < 10⁻³⁰ over millions of logical Clifford+T cycles",
      "Exact Utility-Scale BQP: Shor RSA/ECC, Grover, FeMoCo / H₂ Full-CI Chemistry",
    ],
  ];

  const qmodPane = q(
    "div",
    { class: "atlas-scroll" },
    q(
      "p",
      { class: "small" },
      "There is NO single 'Quantum Computer' — just as early classical computing competed across relays, mercury delay lines, vacuum tubes, and silicon ICs, Circle IV models all 9 historic, contemporary, and horizon quantum computing modalities side-by-side.",
    ),
    q(
      "div",
      { class: "ctable" },
      q(
        "table",
        {},
        q(
          "tr",
          {},
          q("th", {}, "3D Lab"),
          q("th", {}, "Era"),
          q("th", { style: { color: "#c084fc" } }, "Physical Modality"),
          q("th", {}, "Environment"),
          q("th", {}, "Connectivity & Native Gate"),
          q("th", {}, "Coherence / Scaling Tradeoff"),
          q("th", {}, "Error / Algorithmic Regime"),
        ),
        ...QMOD_ROWS.map(([id, era, mod, env, gate, trade, reg]) =>
          q(
            "tr",
            { onclick: () => openAndClose(id), title: `Open ${id} in 3D` },
            q(
              "td",
              {},
              q(
                "button",
                { class: "chip", onclick: () => openAndClose(id) },
                (CAPITALS.has(id) ? "★ " : "↗ ") + id,
              ),
            ),
            q("td", { style: { whiteSpace: "nowrap" } }, era),
            q("td", {}, q("b", {}, mod)),
            q("td", { class: "small" }, env),
            q("td", { class: "small" }, gate),
            q("td", { class: "small" }, trade),
            q("td", { class: "small" }, reg),
          ),
        ),
      ),
    ),
  );

  // ---- TAB 5: Interactive Williams–Waterman–Patterson Roofline & Switching-Physics Lab ----
  const ROOFLINE_ARCHS = [
    {
      id: "cray1",
      label: "1976 ★ Cray-1 Vector (80 MHz)",
      peakGflops: 0.16,
      bwGBs: 2.56,
      color: "#fbbf24",
      on: true,
    },
    {
      id: "blade04",
      label: "2004 Dual-Opteron Blade (x86-64)",
      peakGflops: 9.6,
      bwGBs: 12.8,
      color: "#60a5fa",
      on: true,
    },
    {
      id: "fugaku20",
      label: "2020 Fugaku A64FX Node (SVE+HBM2)",
      peakGflops: 3379,
      bwGBs: 1024,
      color: "#f87171",
      on: true,
    },
    {
      id: "exascale",
      label: "2022 Frontier Node (4× MI250X HBM2e)",
      peakGflops: 191000,
      bwGBs: 13107,
      color: "#f97316",
      on: true,
    },
    {
      id: "wse24",
      label: "2024 Wafer-Scale WSE-3 (44GB On-Wafer SRAM!)",
      peakGflops: 125000000,
      bwGBs: 21000000,
      color: "#34d399",
      on: true,
    },
    {
      id: "gb200",
      label: "2025 Blackwell GB200 NVL72 (FP4/HBM3e)",
      peakGflops: 1440000000,
      bwGBs: 576000,
      color: "#c084fc",
      on: true,
    },
  ];

  const SWITCH_ERAS = [
    { id: "relay", label: "1941 Z3 Relay", fJ: 2e13, col: "#d97706" },
    { id: "eniac46", label: "1946 ENIAC Tube", fJ: 1.5e11, col: "#f59e0b" },
    { id: "agc66", label: "1966 Apollo RTL IC", fJ: 80000, col: "#fbbf24" },
    { id: "m6502", label: "1975 ★ NMOS 6502", fJ: 5000, col: "#fde047" },
    { id: "blade04", label: "2004 90nm CMOS", fJ: 8, col: "#38bdf8" },
    { id: "gb200", label: "2025 4NP FinFET", fJ: 0.35, col: "#c084fc" },
    { id: "photonic", label: "2017 MZI Photonic", fJ: 0.002, col: "#34d399" },
    { id: "qomega", label: "300K Landauer kTln2", fJ: 0.00000287, col: "#f472b6" },
  ];

  let opIntensity = 2.0; // FLOP / Byte
  const roofCanvas = q("canvas", { class: "plot", style: { height: "350px" } });
  const roofReadout = q("div", { class: "ctable" });

  const fmtPerf = (gflops) => {
    if (gflops >= 1e6) return (gflops / 1e6).toFixed(2) + " EFLOP/s";
    if (gflops >= 1e3) return (gflops / 1e3).toFixed(2) + " TFLOP/s";
    if (gflops >= 1) return gflops.toFixed(2) + " GFLOP/s";
    return (gflops * 1e3).toFixed(1) + " MFLOP/s";
  };

  const drawRoofline = () => {
    if (activeTab !== "roofline") return;
    const rect = roofCanvas.getBoundingClientRect();
    if (rect.width < 20) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    roofCanvas.width = Math.round(rect.width * dpr);
    roofCanvas.height = Math.round(rect.height * dpr);
    const ctx = roofCanvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    ctx.fillStyle = "#05080e";
    ctx.fillRect(0, 0, W, H);

    // Split canvas: Left 58% = Log-Log Roofline Model; Right 40% = 10^19x Switching-Energy Wall
    const rX0 = 56;
    const rW = Math.max(180, W * 0.56 - 68);
    const rY0 = 28;
    const rH = H - 64;
    const aiMinLog = -1.5; // ~0.03 FLOP/B
    const aiMaxLog = 3.6; // ~4000 FLOP/B
    const pfMinLog = -2; // 0.01 GFLOP/s
    const pfMaxLog = 9.5; // ~3 EFLOP/s

    const mapX = (ai) => rX0 + ((Math.log10(ai) - aiMinLog) / (aiMaxLog - aiMinLog)) * rW;
    const mapY = (gf) =>
      rY0 +
      rH -
      ((Math.log10(Math.max(1e-3, gf)) - pfMinLog) / (pfMaxLog - pfMinLog)) * rH;

    // Gridlines
    ctx.strokeStyle = "#182436";
    ctx.lineWidth = 1;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillStyle = "#8ca0b8";
    for (let lx = -1; lx <= 3; lx++) {
      const gx = mapX(Math.pow(10, lx));
      ctx.beginPath();
      ctx.moveTo(gx, rY0);
      ctx.lineTo(gx, rY0 + rH);
      ctx.stroke();
      ctx.fillText(lx >= 0 ? String(Math.pow(10, lx)) : "0.1", gx - 10, rY0 + rH + 15);
    }
    for (let ly = -2; ly <= 9; ly += 2) {
      const gy = mapY(Math.pow(10, ly));
      ctx.beginPath();
      ctx.moveTo(rX0, gy);
      ctx.lineTo(rX0 + rW, gy);
      ctx.stroke();
      ctx.fillText("10^" + ly, 6, gy + 3);
    }
    ctx.fillStyle = "#cfe2f7";
    ctx.font = "700 11px ui-monospace, monospace";
    ctx.fillText(
      "ROOFLINE: ATTAINABLE GFLOP/s vs ARITHMETIC INTENSITY (FLOP/B)",
      rX0,
      16,
    );
    ctx.fillStyle = "#8ca0b8";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(
      "Operational Intensity (FLOP / Byte DRAM or SRAM)",
      rX0 + rW * 0.22,
      H - 8,
    );

    // Roofline curves: P = min(Peak, BW * AI)
    for (const arch of ROOFLINE_ARCHS) {
      if (!arch.on) continue;
      const ridgeAi = arch.peakGflops / arch.bwGBs;
      const ai0 = Math.pow(10, aiMinLog);
      const ai1 = Math.pow(10, aiMaxLog);
      ctx.strokeStyle = arch.color;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(mapX(ai0), mapY(Math.min(arch.peakGflops, arch.bwGBs * ai0)));
      if (ridgeAi > ai0 && ridgeAi < ai1) {
        ctx.lineTo(mapX(ridgeAi), mapY(arch.peakGflops));
      }
      ctx.lineTo(mapX(ai1), mapY(Math.min(arch.peakGflops, arch.bwGBs * ai1)));
      ctx.stroke();

      // Ridge point diamond + operating point dot
      if (ridgeAi > ai0 && ridgeAi < ai1) {
        const rx = mapX(ridgeAi);
        const ry = mapY(arch.peakGflops);
        ctx.fillStyle = arch.color;
        ctx.fillRect(rx - 3, ry - 3, 6, 6);
      }
      const curPerf = Math.min(arch.peakGflops, arch.bwGBs * opIntensity);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(mapX(opIntensity), mapY(curPerf), 3.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Active Operational Intensity cursor line
    const curX = mapX(opIntensity);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(curX, rY0);
    ctx.lineTo(curX, rY0 + rH);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#fde047";
    ctx.font = "700 10.5px ui-monospace, monospace";
    ctx.fillText(`AI=${opIntensity} FLOP/B`, Math.min(rX0 + rW - 86, curX + 5), rY0 + 13);

    // Right Pane: Physical Gate Switching Energy E_sw = 1/2 C V^2 -> Landauer Floor (log10 fJ)
    const sX0 = rX0 + rW + 32;
    const sW = Math.max(120, W - sX0 - 16);
    ctx.fillStyle = "#cfe2f7";
    ctx.font = "700 11px ui-monospace, monospace";
    ctx.fillText("SWITCHING ENERGY ½CV² → LANDAUER FLOOR (log₁₀ fJ)", sX0, 16);

    const minLogFj = -6; // 10^-6 fJ = 10^-21 J (zJ)
    const maxLogFj = 14; // 10^14 fJ = 100 mJ
    const rowH = rH / SWITCH_ERAS.length;
    SWITCH_ERAS.forEach((er, idx) => {
      const sy = rY0 + idx * rowH + 4;
      const frac = (Math.log10(er.fJ) - minLogFj) / (maxLogFj - minLogFj);
      const bw = Math.max(4, frac * (sW - 118));
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "600 10px ui-monospace, monospace";
      ctx.fillText(er.label, sX0, sy + 12);
      ctx.fillStyle = "#141e2e";
      ctx.fillRect(sX0 + 116, sy + 2, Math.max(10, sW - 120), Math.max(10, rowH - 10));
      ctx.fillStyle = er.col;
      ctx.fillRect(sX0 + 116, sy + 2, bw, Math.max(10, rowH - 10));
    });

    // Update live numeric Roofline table underneath
    roofReadout.innerHTML = "";
    roofReadout.append(
      q(
        "table",
        {},
        q(
          "tr",
          {},
          q("th", {}, "Architecture (Click to Open)"),
          q("th", {}, "Peak Compute"),
          q("th", {}, "Mem / Fabric BW"),
          q("th", {}, "Ridge Point (Peak/BW)"),
          q("th", {}, `Attainable @ AI=${opIntensity}`),
          q("th", {}, "Hardware Bottleneck Regime"),
        ),
        ...ROOFLINE_ARCHS.map((a) => {
          const ridge = a.peakGflops / a.bwGBs;
          const att = Math.min(a.peakGflops, a.bwGBs * opIntensity);
          const memBound = opIntensity < ridge * 0.99;
          return q(
            "tr",
            {
              onclick: () => openAndClose(a.id),
              style: { opacity: a.on ? "1" : "0.45" },
            },
            q("td", {}, q("b", { style: { color: a.color } }, "↗ " + a.label)),
            q("td", {}, fmtPerf(a.peakGflops)),
            q(
              "td",
              {},
              a.bwGBs >= 1e6
                ? (a.bwGBs / 1e6).toFixed(1) + " PB/s (SRAM)"
                : a.bwGBs >= 1e3
                  ? (a.bwGBs / 1e3).toFixed(2) + " TB/s"
                  : a.bwGBs.toFixed(2) + " GB/s",
            ),
            q("td", {}, ridge.toFixed(2) + " FLOP/B"),
            q("td", {}, q("b", {}, fmtPerf(att))),
            q(
              "td",
              {
                style: {
                  color: memBound ? "#fbbf24" : "#34d399",
                  fontWeight: "700",
                },
              },
              memBound
                ? `MEMORY-WALL BOUND (${((att / a.peakGflops) * 100).toFixed(1)}% of Peak)`
                : "COMPUTE-BOUND (100% Roof Ceiling ✓)",
            ),
          );
        }),
      ),
    );
  };

  const aiReadoutSpan = q("b", { style: { color: "#fde047" } }, "2.00 FLOP/Byte");
  const aiRange = q("input", {
    type: "range",
    min: "-1.3",
    max: "2.7",
    step: "0.02",
    value: String(Math.log10(opIntensity)),
    style: { width: "210px" },
    oninput: (ev) => {
      opIntensity = Number(Math.pow(10, +ev.target.value).toFixed(2));
      aiReadoutSpan.textContent = `${opIntensity} FLOP/Byte`;
      drawRoofline();
    },
  });

  const setAiPreset = (val) => {
    opIntensity = val;
    aiRange.value = String(Math.log10(val));
    aiReadoutSpan.textContent = `${val} FLOP/Byte`;
    drawRoofline();
  };

  const rooflinePane = q(
    "div",
    { class: "atlas-scroll" },
    q(
      "p",
      { class: "small" },
      "Williams–Waterman–Patterson Roofline Model (UC Berkeley) + Landauer Switching Physics: slide Operational Arithmetic Intensity (FLOPs per Byte moved) to watch why sparse PDEs & LLM token decoding hit the Memory Wall — and why RIKEN Fugaku (on-package HBM2) and Cerebras WSE-3 (21 PB/s on-wafer SRAM, Ridge = 5.95 FLOP/B vs 2,500 FLOP/B!) shift the slanted bandwidth roof upward by orders of magnitude.",
    ),
    q(
      "div",
      { class: "row" },
      q("span", { class: "small" }, "Operational Intensity:"),
      aiRange,
      aiReadoutSpan,
      q(
        "button",
        { class: "chip", onclick: () => setAiPreset(0.25) },
        "Sparse HPCG (0.25)",
      ),
      q(
        "button",
        { class: "chip", onclick: () => setAiPreset(1.6) },
        "LLM Decode / Stencil (1.6)",
      ),
      q("button", { class: "chip", onclick: () => setAiPreset(32) }, "FP64 DGEMM (32)"),
      q(
        "button",
        { class: "chip", onclick: () => setAiPreset(280) },
        "FP8 Systolic / Tensor (280)",
      ),
    ),
    roofCanvas,
    roofReadout,
  );

  // ---- Tab Switcher ----
  const panes = {
    quant: quantPane,
    timeline: timelinePane,
    matrix: matrixPane,
    qmod: qmodPane,
    roofline: rooflinePane,
  };
  const tabDefs = [
    ["quant", "📊 Quantitative Plot & Specs (48)"],
    ["timeline", "⚡ Big-Drop vs. Quiet / Winter Years"],
    ["matrix", "🏛️ Mainframe vs. Server vs. Super vs. Quantum"],
    ["qmod", "⚛️ 9 Quantum Modalities"],
    ["roofline", "📐 Roofline & ½CV² Physics Lab"],
  ];
  const tabBody = q("div", {}, quantPane);
  const tabButtons = tabDefs.map(([k, label]) =>
    q(
      "button",
      {
        "data-tab": k,
        class: "btn" + (k === activeTab ? " pri" : ""),
        onclick: () => {
          activeTab = k;
          tabButtons.forEach((b, idx) =>
            b.classList.toggle("pri", tabDefs[idx][0] === k),
          );
          tabBody.innerHTML = "";
          tabBody.append(panes[k]);
          if (k === "quant") requestAnimationFrame(drawPlot);
          if (k === "roofline") requestAnimationFrame(drawRoofline);
        },
      },
      label,
    ),
  );

  renderTable();

  overlay.append(
    q(
      "div",
      { class: "modal wide" },
      q("button", { class: "mx", onclick: () => overlay.remove() }, "×"),
      q(
        "h2",
        {},
        "Computer Science & Engineering Atlas — 4 Circles · 48 Hard-Wired Operational Machines",
      ),
      q("div", { class: "row", style: { marginBottom: "8px" } }, ...tabButtons),
      tabBody,
    ),
  );
  document.body.append(overlay);
  requestAnimationFrame(drawPlot);
  return overlay;
}
