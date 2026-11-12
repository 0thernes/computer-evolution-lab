// 4-Tab MIT / Stanford / Caltech CS Engineering Atlas & Quantitative Era Comparator
function Dc(selectMachine) {
  const overlay = q("div", {
    class: "overlay",
    onclick: (ev) => {
      if (ev.target === overlay) overlay.remove();
    },
  });

  const WING_META = {
    all: { label: "All 40 Machines", color: "#58c4ff" },
    personal: { label: "Circle I · Personal & Bio/Optical (19)", color: "#ffb347" },
    servers: { label: "Circle II · Mainframes & Servers (6)", color: "#38bdf8" },
    super: { label: "Circle III · Supercomputers (7)", color: "#f97316" },
    quantum: { label: "Circle IV · Quantum Age (8)", color: "#c084fc" },
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
        "Von Neumann Stored-Program Architecture, Op-Amps & The Point-Contact Transistor",
      body: "1945: EDVAC First Draft formalizes stored-program execution. 1947: Bell Labs (Bardeen, Brattain, Shockley) demonstrates the germanium transistor AND Ragazzini/Reeves pioneer electronic operational-amplifier analog computers. 1949: Cambridge EDSAC runs the first practical stored-program subroutine library in mercury delay lines.",
      ids: ["analog", "tube"],
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
        "Altair 8800 · $25 MOS 6502 · Cray-1 Vector Supercomputer · DEC VAX-11/780 32-Bit Virtual Memory",
      body: "Four revolutions detonated back-to-back: Jan 1975 MITS Altair 8800 launches personal kits; Sept 1975 Chuck Peddle's team ships the 3,510-transistor MOS 6502 for $25; 1976 Seymour Cray delivers Cray-1 #1 (80 MHz, vector registers V0–V7 & chaining); Oct 1977/78 DEC ships VAX-11/780, expanding virtual memory from 16-bit to 32-bit (4 GB) and hosting Berkeley 4.2BSD UNIX + TCP/IP.",
      ids: ["altair", "m6502", "cray1", "vax78"],
    },
    {
      years: "1982–1987",
      kind: "drop",
      badge: "🔥 HOME & MASSIVELY PARALLEL",
      title: "Commodore 64 / IBM PC Clones + Connection Machine CM-2 (65,536 SIMD PEs)",
      body: "1982–85 democratized sprites, SID synth audio, and PC clones in tens of millions of homes, while in 1987 Danny Hillis & Richard Feynman at Thinking Machines built the iconic LED-lit CM-2 hypercube (65,536 1-bit SIMD processors + e-cube XOR router), pioneering data-parallel prefix scans (*Lisp / C*) that prefigured modern GPU warps.",
      ids: ["home80", "cm2"],
    },
    {
      years: "1988–1992",
      kind: "quiet",
      badge: "🧊 2ND AI WINTER",
      title: "The Second AI Winter & Collapse of Specialized Symbolic / Vector Hardware",
      body: "Expert systems & Lisp machines collapsed as commodity CMOS RISC/x86 microprocessors ('Attack of the Killer Micros', Brooks & Hennessy/Patterson) doubled performance every 18 months. Specialized vector/SIMD vendors went bankrupt or consolidated, paving the way for shared-memory RISC SMP servers and wormhole-routed MPI clusters.",
      ids: ["cm2", "sun90", "ascired97"],
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
      badge: "🧊 PHYSICS WALL",
      title: "Breakdown of Dennard Scaling & The 4 GHz Pentium 4 Thermal Wall",
      body: "For 30 years Dennard scaling (1974) kept power density constant as transistors shrank. Around 90 nm (2003–2004), subthreshold & gate-oxide quantum tunneling leakage exploded; deeply pipelined single-core clock races hit ~3.8 GHz thermal walls (cancelling 10 GHz plans) and forced the industry into Multicore CPUs, Mobile ARM DVFS, and low-wattage Petascale tori (Blue Gene).",
      ids: ["pc00", "pc10", "arm07", "bgene"],
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
      badge: "🧊 NISQ PLATEAU",
      title: "The Pre-QEC NISQ Decoherence Bottleneck & Chiplet Packaging Pivot",
      body: "Monolithic reticle limits (~858 mm²) forced multi-die 2.5D CoWoS + HBM packaging (DGX A100), while 50–100-qubit Noisy Intermediate-Scale Quantum (NISQ) processors hit exponential circuit-depth decay because physical 2-qubit gate errors (~0.5–1%) still sat near or above the surface-code threshold without logical error suppression.",
      ids: ["aibox", "quantum"],
    },
    {
      years: "2022–2025",
      kind: "drop",
      badge: "🔥 EXASCALE, AI RACKS & QEC RUBICON",
      title:
        "Frontier 1.194 ExaFLOPS · Telum z16 · DishBrain · Below-Threshold QEC · Blackwell NVL72",
      body: "A historic multi-domain surge: ORNL Frontier breaks Exascale (2022); IBM z16 embeds 1 ms AI fraud scoring on zero-downtime RAIM mainframes (2022); DishBrain biological neurons learn Pong (2022); Harvard/QuEra shuttle 48 logical neutral-atom qubits (2023/24); Google's 15 mK superconducting surface code demonstrates exponential below-threshold error suppression (2024); Microsoft/academic labs probe Majorana tetrons & fusion photonics (2025); NVIDIA GB200 NVL72 fuses 72 GPUs over a 130 TB/s copper NVLink spine (2025).",
      ids: [
        "pc20",
        "zmain20",
        "bci",
        "exascale",
        "qatom",
        "qtransmon",
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
      "agc66 · alto73 · ★ m6502 · altair · home80 · pc90 · pc00 · arm07 · pc10 · pc20 · aibox",
      "★ s360 · zmain20",
      "unix70 · vax78 · sun90 · cloud10",
      "cdc6600 · ★ cray1 · cm2 · ascired97 · bgene · exascale · gb200",
      "qion · quantum · qanneal · qatom · qtransmon · qphotonic · qtopo · ★ qomega",
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

  // ---- TAB 4: All 8 Quantum Eras & Physical Modalities Compared (Circle IV Deep Dive) ----
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
      "There is NO single 'Quantum Computer' — just as early classical computing competed across relays, mercury delay lines, vacuum tubes, and silicon ICs, Circle IV models all 8 historic, contemporary, and horizon quantum computing modalities side-by-side.",
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

  // ---- Tab Switcher ----
  const panes = {
    quant: quantPane,
    timeline: timelinePane,
    matrix: matrixPane,
    qmod: qmodPane,
  };
  const tabDefs = [
    ["quant", "📊 Quantitative Plot & Specs (40)"],
    ["timeline", "⚡ Big-Drop Years vs. Quiet / Winter Years"],
    ["matrix", "🏛️ Mainframe vs. Server vs. Supercomputer vs. Quantum"],
    ["qmod", "⚛️ 8 Quantum Eras & Modalities"],
  ];
  const tabBody = q("div", {}, quantPane);
  const tabButtons = tabDefs.map(([k, label]) =>
    q(
      "button",
      {
        class: "btn" + (k === activeTab ? " pri" : ""),
        onclick: () => {
          activeTab = k;
          tabButtons.forEach((b, idx) =>
            b.classList.toggle("pri", tabDefs[idx][0] === k),
          );
          tabBody.innerHTML = "";
          tabBody.append(panes[k]);
          if (k === "quant") requestAnimationFrame(drawPlot);
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
        "Computer Science & Engineering Atlas — 4 Circles · 40 Operational Machines",
      ),
      q("div", { class: "row", style: { marginBottom: "8px" } }, ...tabButtons),
      tabBody,
    ),
  );
  document.body.append(overlay);
  requestAnimationFrame(drawPlot);
  return overlay;
}
