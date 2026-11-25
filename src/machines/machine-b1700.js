// Circle II — Burroughs B 1726 (B1700 series, announced 7 June 1972).
// Scene proportions: central processor cabinet 158.7 x 66 x 148.5 cm and operator table
// 67.9 x 132 x 61 cm from the B 1726 brochure (Burroughs form 1059219, 6-72). Console controls
// and indicators from the B 1700 Systems Reference Manual (1057155) section 1. Peripheral sizes
// and the console legend layout are estimated from Burroughs catalogue photographs
// (bitsavers .../B1700/pictures) and are labelled as estimates in their part cards.
// The micro-machine itself is src/sim/b1700-sim.js.

function makeMachineB1700() {
  const sys = new B1700System();
  const cpu = sys.cpu;
  let running = true;
  let mode = "RUN"; // console MODE switch: STEP / RUN / TAPE [SRM 1-10]
  let microsPerSec = 2400;
  let acc = 0;
  let haltTimer = 0;
  let selCol = 2; // register COLUMN select (rotary, 4 positions)
  let selRow = 0; // register ROW select (rotary, 16 positions) -> X
  let dataSwitches = 0; // 24 data entry toggles
  let lamps = [];
  let lampLevel = new Float32Array(24);
  let indicator = {};
  let toggles = [];
  let knobs = {};
  let panelSurf = null;
  let instSurf = null; // TD 800 CRT phosphor canvas
  let tdLamps = [];
  let crtTimer = 0;
  let paperSurf = null;
  let cassetteHubs = [];
  let diskPlatters = [];
  let statsUi = null;
  let editor = null;
  let lastEv = null;
  const recent = [];

  const selName = () => B1700_REG[selCol][selRow] || "—";
  const hex6 = (v) => (v >>> 0).toString(16).toUpperCase().padStart(6, "0");

  // ---------------- canvas skins (self-made, drawn at build time) ----------------
  function drawPanelSkin() {
    if (!panelSurf) return;
    const c = panelSurf.ctx;
    const W = 1024,
      H = 560;
    // satin black anodised faceplate with faint brushed grain
    c.fillStyle = "#15171b";
    c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 2) {
      c.fillStyle = `rgba(255,255,255,${0.012 + 0.01 * Math.sin(y * 0.7)})`;
      c.fillRect(0, y, W, 1);
    }
    // Burroughs nameplate strip (left) and model mark (right)
    c.fillStyle = "#d9d4c7";
    c.fillRect(24, 18, 210, 34);
    c.fillStyle = "#1b1b1b";
    c.font = '700 26px Georgia, "Times New Roman", serif';
    c.fillText("Burroughs", 44, 45);
    c.fillStyle = "#cfd3da";
    c.font = "600 30px Helvetica, Arial, sans-serif";
    c.fillText("B 1700", 852, 46);
    // register display legend: bit groups of 4 (TA..TF style), bit weights
    c.font = "600 15px Helvetica, Arial, sans-serif";
    c.fillStyle = "#e7e2d4";
    for (let g = 0; g < 6; g++) {
      const x0 = 120 + g * 128;
      c.strokeStyle = "rgba(231,226,212,0.55)";
      c.lineWidth = 2;
      c.strokeRect(x0 - 4, 76, 120, 70);
      c.fillText(["A", "B", "C", "D", "E", "F"][g], x0 + 50, 70);
      ["8", "4", "2", "1"].forEach((w, i) => c.fillText(w, x0 + 10 + i * 29, 162));
    }
    c.fillText("REGISTER DISPLAY", 120, 186);
    // indicators (SRM: POWER, RUN, STATE, BOT, PARITY)
    c.font = "600 14px Helvetica, Arial, sans-serif";
    ["POWER", "RUN", "STATE", "BOT", "PARITY"].forEach((t, i) => {
      c.fillText(t, 26, 238 + i * 32);
    });
    c.font = "600 15px Helvetica, Arial, sans-serif";
    c.fillText("DATA ENTRY", 120, 304);
    c.font = "600 13px Helvetica, Arial, sans-serif";
    c.textAlign = "center";
    // rotary switches, INT toggle, pushbuttons (SRM 1-10/1-11)
    [
      ["COLUMN", 200],
      ["ROW", 290],
      ["MODE", 380],
      ["INT", 462],
    ].forEach(([t, u]) => c.fillText(t, u, 540));
    c.fillText("0 1 2 3", 200, 432);
    c.fillText("0 … F", 290, 432);
    c.fillText("STEP RUN TAPE", 380, 432);
    ["CLEAR", "HALT", "LOAD", "START", "INC-A", "RD/WRT"].forEach((t, i) =>
      c.fillText(t, 548 + i * 60, 528),
    );
    c.fillText("REWIND", 712, 432);
    c.fillText("ON/OFF", 784, 432);
    c.fillText("CASSETTE", 900, 316);
    c.textAlign = "left";
    panelSurf.tex.needsUpdate = true;
  }

  // TD 800 console display: 24 lines x 80 characters (Datapro 70C-112-04). The canvas is a
  // 960 x 576 character grid (12 x 24 px cells). Each redraw only partly erases the previous
  // frame, so changing characters leave a short phosphor afterglow.
  function drawInstrument() {
    if (!instSurf) return;
    const c = instSurf.ctx;
    const W = 960,
      H = 576,
      CW = 12,
      LH = 24;
    c.fillStyle = "rgba(2,7,3,0.62)";
    c.fillRect(0, 0, W, H);
    c.font = '700 19px "Courier New", Courier, monospace';
    c.textBaseline = "top";
    const rows = [];
    const put = (t, hi) => rows.push([String(t).slice(0, 80), hi]);
    const spc = cpu.padGet(1, 0);
    const base = B1700_LAYOUT.SPROG;
    put("B 1726  CONSOLE DISPLAY      LAB VIEW OF THE EMULATOR (NOT AN MCP SCREEN)", 1);
    put(
      `PROGRAM ${sys.programName.toUpperCase().padEnd(22)} ${sys.decimal ? "DECIMAL" : "BINARY "} S-MACHINE   ${cpu.halted ? "HALTED " : running ? "RUNNING" : "STOPPED"}`,
    );
    put("-".repeat(80));
    let bits = "",
      mark = "";
    for (let b = 0; b < 64; b++) {
      const a = spc - 16 + b;
      bits += a >= base ? cpu.mem.getBit(a) : " ";
      mark += a === spc ? "^" : " ";
    }
    put(`S-MEM ${String(spc - 16).padStart(5)} ${bits}`);
    put(`S-PC  ${String(spc - base).padStart(5)} ${mark}`, 1);
    const src = cpu.lastFromCM
      ? "CONTROL MEMORY"
      : `MAIN MEMORY BIT ${cpu.lastAddr * 16 + cpu.MBR}`;
    put(
      `A ${String(cpu.lastAddr).padStart(4)}  M ${cpu.M.toString(16).toUpperCase().padStart(4, "0")}  FROM ${src}`,
      1,
    );
    const rec = recent.slice(-6);
    while (rec.length < 6) rec.unshift("");
    rec.forEach((t, i) => put(`  ${t}`.slice(0, 60), i === 5));
    const r1 = [
      ["X", cpu.X],
      ["Y", cpu.Y],
      ["T", cpu.T],
      ["L", cpu.L],
    ];
    const r2 = [
      ["FA", cpu.FA],
      ["FB", cpu.FB],
      ["SUM", cpu.SUM],
      ["DIFF", cpu.DIFF],
    ];
    put(r1.map(([n, v]) => `${n.padEnd(4)} ${hex6(v)}`).join("   "));
    put(r2.map(([n, v]) => `${n.padEnd(4)} ${hex6(v)}`).join("   "));
    put(
      `CP ${cpu.CP.toString(2).padStart(8, "0")} CYF ${cpu.CYF} CPU ${cpu.CPU} CPL ${String(cpu.CPL).padStart(2)}  BICN ${cpu.BICN.toString(2).padStart(4, "0")} XYCN ${cpu.XYCN.toString(2).padStart(4, "0")} XYST ${cpu.XYST.toString(2).padStart(4, "0")}`,
    );
    put("SCRATCHPAD  S01A S-PC  S02A VARS  S02B OUT  S03A BASE  S04A WIDTH  S06A ACC");
    for (let r = 0; r < 2; r++)
      put(
        [0, 1, 2, 3]
          .map((k) => {
            const w = r * 4 + k;
            return `S${String(w).padStart(2, "0")} ${hex6(cpu.padGet(w, 0))}:${hex6(cpu.padGet(w, 1))}`;
          })
          .join("  "),
      );
    put("-".repeat(80));
    put(`S-OP ${sys.lastSop || "-"}   ACC ${sys.acc()}`, 1);
    put(`OUT ${sys.outputs().join(" ")}`);
    put(
      `${cpu.micros} MICROS  ${sys.sOps} S-OPS  EST ${(cpu.ns / 1000).toFixed(1)} US ON A B 1726 (AUERBACH 1974)`,
    );
    rows.slice(0, 24).forEach(([t, hi], i) => {
      c.fillStyle = hi ? "#d8ffd8" : "#7dff9a";
      c.fillText(t, 6, 4 + i * LH, 80 * CW);
    });
    // block cursor after the last line, blinking
    if (((performance.now() / 530) | 0) % 2 === 0) {
      c.fillStyle = "#7dff9a";
      c.fillRect(6, 4 + Math.min(rows.length, 23) * LH, CW - 2, LH - 6);
    }
    c.textBaseline = "alphabetic";
    instSurf.tex.needsUpdate = true;
  }

  function drawPaper() {
    if (!paperSurf) return;
    const c = paperSurf.ctx;
    c.fillStyle = "#f3efe2";
    c.fillRect(0, 0, 512, 256);
    c.fillStyle = "#3b3b3b";
    c.font = '600 20px "Courier New", monospace';
    c.fillText(`SAM ${sys.programName.toUpperCase()}`, 14, 30, 484);
    const out = sys.outputs();
    const lines = [];
    for (let i = 0; i < out.length; i += 6)
      lines.push(
        out
          .slice(i, i + 6)
          .map((v) => String(v).padStart(4))
          .join(" "),
      );
    lines.slice(-6).forEach((ln, i) => c.fillText(ln, 14, 66 + i * 30, 484));
    c.fillStyle = "#8b8b8b";
    c.font = '500 13px "Courier New", monospace';
    c.fillText("lab mirror of the S-machine OUT buffer", 14, 244);
    paperSurf.tex.needsUpdate = true;
  }

  function syncLamps(dt) {
    const v = cpu.peek(selName());
    // incandescent thermal lag (illustrative time constant, not a measured figure)
    const k = Math.min(1, dt / 0.045);
    for (let i = 0; i < 24; i++) {
      const on = (v >>> i) & 1;
      lampLevel[i] += (on - lampLevel[i]) * k;
      if (lamps[i]) lamps[i].material.emissiveIntensity = 0.04 + lampLevel[i] * 2.4;
    }
    const set = (n, on) => {
      if (indicator[n]) indicator[n].material.emissiveIntensity = on ? 2.2 : 0.05;
    };
    set("POWER", true);
    set("RUN", running && !cpu.halted && mode !== "STEP");
    set("STATE", ((cpu.C >> 15) & 1) === 1); // CC bit 3: console STATE lamp, software controlled
    set("BOT", false);
    set("PARITY", false);
  }

  function microStep(ctx) {
    const ev = sys.step();
    if (!ev) return null;
    lastEv = ev;
    recent.push(`${String(ev.addr).padStart(4)} ${ev.fromCM ? "CM" : "MM"} ${ev.text}`);
    if (recent.length > 24) recent.shift();
    if (ctx && ctx.diagram) {
      ctx.diagram.pulse(
        ev.fromCM ? "cm" : "smem",
        "mreg",
        ev.fromCM ? "#fbbf24" : "#f472b6",
      );
      const op = ev.m >>> 12;
      if (op === 7) ctx.diagram.pulse("fu", "smem", "#34d399");
      else if (op === 2 || (ev.m & 0xff00) === 0x0700)
        ctx.diagram.pulse("pad", "fu", "#86efac");
      else if (op === 3 || op === 4 || op === 5 || op === 6)
        ctx.diagram.pulse("mreg", "fb4", "#a78bfa");
      else if (op === 0xe || op === 0xf || ev.text === "MOVE TAS TO A")
        ctx.diagram.pulse("seq", "astk", "#38bdf8");
      else ctx.diagram.pulse("mreg", "fb24", "#60a5fa");
    }
    return ev;
  }

  const machine = {
    id: "b1700",
    era: "1972",
    short: "B1700",
    name: "Burroughs B 1726 (B1700 series) Microprogrammable System",
    group: "servers",
    view0: -0.18,
    blurb:
      "Announced 7 June 1972 (Datapro), designed under Wayne T. Wilner at Burroughs' Santa Barbara plant in Goleta: a 'soft' machine with no fixed instruction set. 16-bit micro-instructions drive a 24-bit datapath whose ALU width (CPL) and unit (binary, 4-bit or 8-bit decimal) change clock by clock, over memory addressable to the bit. Each language gets its own S-machine, interpreted in microcode. Here a real micro-instruction emulator runs a microcoded interpreter for a small lab-defined S-language.",
    diagram: {
      nodes: [
        { id: "cm", label: "Control Mem", x: 0.13, y: 0.2, color: "#fbbf24" },
        { id: "seq", label: "A · TOPM · MBR", x: 0.13, y: 0.5, color: "#38bdf8" },
        { id: "astk", label: "A stack ×32", x: 0.13, y: 0.82, color: "#7dd3fc" },
        { id: "mreg", label: "M register", x: 0.42, y: 0.2, color: "#fde047" },
        { id: "fb24", label: "24-bit Fn Box", x: 0.66, y: 0.2, color: "#60a5fa" },
        { id: "fb4", label: "4-bit Fn Box", x: 0.42, y: 0.52, color: "#a78bfa" },
        { id: "pad", label: "Scratchpad", x: 0.66, y: 0.52, color: "#86efac" },
        { id: "fu", label: "F: FA·FL", x: 0.88, y: 0.4, color: "#34d399" },
        { id: "smem", label: "S-memory (bit)", x: 0.6, y: 0.84, color: "#f472b6" },
        { id: "cons", label: "Console", x: 0.88, y: 0.84, color: "#e2e8f0" },
      ],
      edges: [
        ["cm", "mreg", "16b"],
        ["smem", "mreg", "A×16+MBR"],
        ["seq", "astk", "CALL/EXIT"],
        ["mreg", "fb24", "XY"],
        ["mreg", "fb4", "4b"],
        ["pad", "fu", "48b"],
        ["fu", "smem", "FA,len"],
        ["cons", "fb24", "24 lamps"],
      ],
    },
    build(kit) {
      lamps = [];
      toggles = [];
      indicator = {};
      cassetteHubs = [];
      diskPlatters = [];
      tdLamps = [];
      knobs = {};
      // Colours matched to the colour photograph on the B 1726 brochure (1059219, June 1972):
      // cream front faces, dark walnut-grain sides and tops, white floor tiles with dark joints.
      const white = U.plastic(0xe6dfcc, 0.4);
      const walnut = U.wood().clone();
      walnut.color.set(0x5b3c2a);
      walnut.roughness = 0.55;
      const charcoal = U.metal(0x2a2c31, 0.5);
      const floorSurf = Bt(512, 512);
      {
        const c = floorSurf.ctx;
        c.fillStyle = "#e9e7e1";
        c.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 4; j++) {
            c.fillStyle = `rgba(0,0,0,${0.015 + ((i * 7 + j * 3) % 5) * 0.006})`;
            c.fillRect(i * 128 + 3, j * 128 + 3, 122, 122);
          }
        c.strokeStyle = "#4a4a4a";
        c.lineWidth = 3;
        for (let k = 0; k <= 512; k += 128) {
          c.beginPath();
          c.moveTo(k, 0);
          c.lineTo(k, 512);
          c.moveTo(0, k);
          c.lineTo(512, k);
          c.stroke();
        }
        floorSurf.tex.wrapS = floorSurf.tex.wrapT = os;
        floorSurf.tex.repeat.set(3.9 / 2.44, 2.9 / 2.44); // 61 cm raised-floor tiles
      }
      const floorMat = new Cn({
        map: floorSurf.tex,
        roughness: 0.38,
        clearcoat: 0.4,
        clearcoatRoughness: 0.3,
      });

      // Floor: raised computer-room floor as in the brochure photograph (tile size: standard 61 cm, estimate)
      kit.box(3.9, 0.03, 2.9, floorMat, [0.25, 0.015, 0.2], {
        name: "Raised Floor Tiles",
        info: "White raised-floor tiles with dark joints, as in the B 1726 brochure photograph (tile size is the common 61 cm, an estimate). Peripheral cables run under the raised floor, so none show in the room (brochure photograph).",
        sharp: true,
      });

      // 1. CENTRAL PROCESSOR CABINET — 158.7 x 66 x 148.5 cm (brochure 1059219)
      const cab = kit.group([-0.75, 0.03, -0.35], {
        name: "B 1726 Central Processor Cabinet",
        info: "One cabinet holds power supply, I/O controls, memory and processor logic (brochure 1059219). 62.5 in high, 26 in wide, 58.5 in deep, 1,419 lb.",
        live: () =>
          `${mode} · A=${cpu.A} · ${cpu.halted ? "HALTED" : running ? "RUNNING" : "STOPPED"}`,
      });
      const CH = 1.587,
        CW = 0.66,
        CD = 1.485;
      kit.box(
        CW,
        CH,
        CD,
        walnut,
        [0, CH / 2, 0],
        {
          name: "Cabinet Side Panels",
          info: "Dark side panels running the 148.5 cm depth of the cabinet (finish matched to catalogue photographs).",
          shell: true,
          explode: [-0.45, 0, 0],
        },
        cab,
      );
      // front face stays opaque in cutaway so the console is always readable; sides and top cut away
      kit.box(
        CW + 0.01,
        CH,
        0.03,
        white,
        [0, CH / 2, CD / 2 + 0.01],
        {
          name: "Front Panel (cream)",
          info: "Cream front face carrying the console control panel and the cassette reader (brochure colour photograph).",
        },
        cab,
      );
      // Console control panel, inset in the front face inside a light grey bezel
      kit.box(
        0.6,
        0.345,
        0.014,
        U.plastic(0xb9b4a8, 0.38),
        [0, 1.27, CD / 2 + 0.02],
        {},
        cab,
      );
      panelSurf = zi(
        kit,
        0.56,
        0.306,
        [0, 1.27, CD / 2 + 0.028],
        [1024, 560],
        {
          name: "Console Control Panel",
          info: "SRM 1057155 section 1: 24 register display lights, POWER/RUN/STATE/BOT/PARITY indicators, 24 data entry switches, CLEAR, HALT, LOAD, START, INC-A and READ/WRITE pushbuttons, INT toggle, register COLUMN and ROW select switches, MODE switch (STEP/RUN/TAPE). Legend placement approximated from photographs.",
          live: () => `${selName()} = ${hex6(cpu.peek(selName()))}`,
        },
        cab,
      );
      const face = CD / 2 + 0.031;
      const px = (u) => -0.28 + (u / 1024) * 0.56;
      const py = (v) => 1.27 + 0.153 - (v / 560) * 0.306;
      // 24 register display lamps: grouped by 4 like the white lens blocks in photo M B1700-56
      for (let i = 0; i < 24; i++) {
        const g = Math.floor((23 - i) / 4);
        const k = (23 - i) % 4;
        const u = 120 + g * 128 + 14 + k * 29;
        const lamp = kit.sphere(
          0.0062,
          b17LampMaterial(0xffd9a0),
          [px(u), py(112), face],
          {
            seg: 12,
            name: i === 0 ? "Register Display Lights (24)" : undefined,
            info: "Show the register picked by the COLUMN/ROW select switches, live from the emulator. Warm incandescent colour; glow lag is illustrative.",
            live: () => `${selName()} = ${hex6(cpu.peek(selName()))}`,
          },
          cab,
        );
        lamp.scale.z = 0.6;
        lamps[i] = lamp;
      }
      ["POWER", "RUN", "STATE", "BOT", "PARITY"].forEach((n, i) => {
        indicator[n] = kit.sphere(
          0.0055,
          b17LampMaterial(
            n === "PARITY" ? 0xff5a4a : n === "POWER" ? 0xfff0d2 : 0xffc46b,
          ),
          [px(110), py(233 + i * 32), face],
          {
            seg: 12,
            name: `${n} Indicator`,
            info: {
              POWER: "Power on/off indicator.",
              RUN: "Processor in execute (RUN) state.",
              STATE: "Software-controlled lamp (CC register bit 3).",
              BOT: "Cassette at beginning of tape. The cassette is not emulated.",
              PARITY:
                "Unrecoverable cassette parity error. The cassette is not emulated.",
            }[n],
          },
          cab,
        );
      });
      // 24 data entry toggle switches
      for (let i = 0; i < 24; i++) {
        const g = Math.floor((23 - i) / 4);
        const k = (23 - i) % 4;
        const u = 120 + g * 128 + 14 + k * 29;
        const sw = Ba(
          kit,
          [px(u), py(272), face - 0.004],
          i === 0
            ? {
                name: "Data Entry Switches (24)",
                info: "Set a 24-bit value; LOAD writes it into the selected register (SRM).",
              }
            : {},
          cab,
        );
        sw.scale.setScalar(0.34);
        sw.userData.b17 = { kind: "data", bit: i };
        sw.traverse((o) => (o.userData.b17 = sw.userData.b17));
        za(sw, 0);
        toggles[i] = sw;
      }
      // pushbuttons
      ["CLEAR", "HALT", "LOAD", "START", "INC-A", "RW"].forEach((n, i) => {
        const b = kit.box(
          0.026,
          0.02,
          0.012,
          U.plastic(n === "HALT" ? 0xc8382f : n === "START" ? 0x2f8f4e : 0xe8e3d6, 0.35),
          [px(548 + i * 60), py(486), face],
          {
            name: `${n === "RW" ? "READ/WRITE" : n} Pushbutton`,
            info: {
              CLEAR:
                "Clears processor registers (on the B 1726 a wider set than on the B 1712/1714).",
              HALT: "Halts at the end of the current micro-instruction.",
              LOAD: "Enters the data switches into the selected register.",
              START: "STEP: execute one micro-instruction. RUN: run continuously.",
              "INC-A":
                "Increments A when reading or writing control memory from the console.",
              RW: "Console read/write of memory (needs MSM selected; not emulated here).",
            }[n],
          },
          cab,
        );
        b.userData.b17 = { kind: "button", name: n };
        b.traverse((o) => (o.userData.b17 = b.userData.b17));
      });
      const intSw = Ba(
        kit,
        [px(462), py(486), face - 0.004],
        {
          name: "INT Toggle",
          info: "Console interrupt: sets CC bit 0 so software can come to an orderly stop.",
        },
        cab,
      );
      intSw.scale.setScalar(0.4);
      intSw.traverse((o) => (o.userData.b17 = { kind: "int" }));
      // rotary switches
      const knob = (key, u, v, r, name, info) => {
        const k = Om(
          kit,
          [px(u), py(v), face - 0.012],
          {
            r,
            name,
            info,
            live: () =>
              `${selName()} (col ${selCol}, row ${selRow.toString(16).toUpperCase()})`,
          },
          cab,
        );
        k.traverse((o) => (o.userData.b17 = { kind: "knob", key }));
        knobs[key] = k;
      };
      knob(
        "col",
        200,
        476,
        0.015,
        "Register COLUMN Select",
        "4-position rotary switch choosing column 0-3 of the register matrix (SRM table 1-3). Click to turn.",
      );
      knob(
        "row",
        290,
        476,
        0.017,
        "Register ROW Select",
        "Rotary switch choosing row 0-F of the register matrix. Click to turn.",
      );
      knob(
        "mode",
        380,
        476,
        0.015,
        "MODE Switch",
        "STEP / RUN / TAPE. TAPE (cassette loading) is not emulated. Click to turn.",
      );
      // cassette reader (standard on the B 1726 per brochure)
      const cas = kit.group(
        [px(900), py(400), face - 0.004],
        {
          name: "Cassette Reader",
          info: "Standard on the B 1726 (brochure): loads confidence routines and microcode in TAPE mode. Shown, not emulated.",
        },
        cab,
      );
      kit.box(0.11, 0.07, 0.012, U.plastic(0x101114, 0.3), [0, 0, 0], {}, cas);
      kit.box(0.096, 0.058, 0.004, U.glass(0x9fb3c8, 0.35), [0, 0, 0.008], {}, cas);
      for (const sx of [-0.022, 0.022]) {
        const hub = kit.cyl(
          0.011,
          0.011,
          0.004,
          U.plastic(0xf2f2f2, 0.3),
          [sx, 0, 0.006],
          { rot: [Math.PI / 2, 0, 0], seg: 16 },
          cas,
        );
        cassetteHubs.push(hub);
      }
      const rew = kit.box(
        0.022,
        0.016,
        0.01,
        U.plastic(0xe8e3d6, 0.35),
        [px(712), py(395), face],
        {
          name: "CASSETTE REWIND Pushbutton",
          info: "Rewinds the tape cassette to BOT (SRM). Cassette not emulated.",
        },
        cab,
      );
      rew.userData.b17 = { kind: "button", name: "REWIND" };
      const casSw = Ba(
        kit,
        [px(784), py(400), face - 0.004],
        {
          name: "CASSETTE ON/OFF Toggle",
          info: "Power to the tape cassette unit (SRM). Cassette not emulated.",
        },
        cab,
      );
      casSw.scale.setScalar(0.34);
      // Cabinet interior (cutaway): logic card cage, control memory, MOS main memory, power supply
      const cage = kit.group(
        [0, 0.86, 0.05],
        {
          name: "Processor Logic Card Cage",
          info: "Integrated-circuit logic cards. Wikipedia (citing Fairchild CTL) says early B1000 machines used Complementary Transistor Logic; the board count and layout here are illustrative.",
          live: () =>
            `M=${cpu.M.toString(16).toUpperCase().padStart(4, "0")} ${cpu.lastText}`,
          explode: [0, 0.35, 0],
        },
        cab,
      );
      const chipGeo = new te(0.018, 0.004, 0.009);
      const chipMat = U.plastic(0x1b1b1d, 0.4);
      // plain glass-epoxy cards with through-hole DIP packages (no U.pcb: that adds modern SMD parts)
      const cardMat = U.plastic(0x2c5a3c, 0.55);
      const nBoards = 14;
      for (let b = 0; b < nBoards; b++) {
        const pcb = kit.box(
          0.012,
          0.32,
          0.5,
          cardMat,
          [-0.27 + b * 0.04, 0, 0],
          b === 0
            ? {
                name: "Logic Cards",
                info: "Plug-in IC cards in the processor card cage (layout illustrative).",
              }
            : {},
          cage,
        );
        const inst = new ut(chipGeo, chipMat, 24);
        const m4 = new nt();
        let n = 0;
        for (let r = 0; r < 6; r++)
          for (let cc = 0; cc < 4; cc++) {
            m4.makeRotationZ(Math.PI / 2);
            m4.setPosition(0.008, -0.12 + r * 0.048, -0.18 + cc * 0.12);
            inst.setMatrixAt(n++, m4);
          }
        pcb.add(inst);
      }
      kit.box(
        0.5,
        0.16,
        0.36,
        U.darkAnodized(0x25303d),
        [0, 0.42, -0.35],
        {
          name: "Control Memory (bipolar, 4096 bytes)",
          info: "Integrated-circuit read/write control memory, 2048 or 4096 bytes; 167 ns for a two-byte read or write (brochure 1059219). Micro-instructions below TOPM x 512 are fetched here (SRM).",
          live: () => `${cpu.cmFetches} CM fetches · TOPM=${cpu.TOPM}`,
          explode: [0, 0.2, -0.3],
        },
        cab,
      );
      kit.box(
        0.5,
        0.22,
        0.42,
        U.darkAnodized(0x1d2a22),
        [0, 0.42, 0.25],
        {
          name: "MOS Main Memory (S-memory), 24,576 bytes",
          info: "MOS/LSI main memory, addressable to the bit, 667 ns per 24 bits (brochure). Field length 0-24 bits per access in either direction (SRM).",
          live: () =>
            `${cpu.mem.reads} reads · ${cpu.mem.writes} writes · ${cpu.mem.bitsMoved} bits`,
          explode: [0, 0.2, 0.3],
        },
        cab,
      );
      kit.box(
        0.5,
        0.3,
        0.5,
        charcoal,
        [0, 0.18, -0.25],
        {
          name: "Power Supply",
          info: "Power supply housed in the processor cabinet (brochure). Internals not modelled.",
          explode: [0, -0.1, -0.3],
        },
        cab,
      );

      // 2. OPERATOR TABLE — 67.9 x 132 x 61 cm (brochure)
      const table = kit.group([-0.45, 0.03, 0.95], {
        name: "Operator Table",
        info: "Operator table, 26.75 in high, 52 in wide, 24 in deep (brochure 1059219). Walnut top and pedestal on a dark frame, as in the brochure colour photograph.",
      });
      kit.box(1.32, 0.03, 0.61, walnut, [0, 0.664, 0], {}, table);
      kit.box(0.5, 0.5, 0.56, walnut, [0.36, 0.4, 0], {}, table);
      kit.box(0.04, 0.62, 0.04, charcoal, [-0.6, 0.33, 0], {}, table);
      kit.box(0.05, 0.02, 0.55, charcoal, [-0.6, 0.01, 0], {}, table);
      kit.box(0.05, 0.02, 0.55, charcoal, [0.6, 0.01, 0], {}, table);
      // 9340 console printer (SPO), 10 cps (SRM peripheral table)
      const spo = kit.group(
        [-0.05, 0.68, 0.02],
        {
          name: "9340 Console Printer / Keyboard (SPO)",
          info: "Console printer, 10 characters per second (SRM peripheral table). Required by the MCP for operator communication (brochure).",
        },
        table,
      );
      kit.box(0.5, 0.11, 0.36, U.plastic(0x2a2b2f, 0.4), [0, 0.055, 0], {}, spo);
      kit.box(0.46, 0.02, 0.1, U.plastic(0x4a4033, 0.45), [0, 0.12, -0.08], {}, spo);
      buildSculptedKeyboard(
        kit,
        [-0.03, 0.112, 0.08],
        {
          w: 0.34,
          d: 0.13,
          bodyColor: 0x2a2b2f,
          keyColor: 0xd9d3c3,
          name: "SPO Keyboard",
          info: "Operator keyboard of the console printer. Typewriter layout; the key arrangement is an estimate.",
          rows: B17_PERIOD_KEY_ROWS,
          leds: false, // the kit's green lock-status LEDs are a modern PC feature
        },
        spo,
      );
      for (let i = 0; i < 4; i++) {
        kit.box(
          0.032,
          0.012,
          0.032,
          U.plastic(0xe9e5da, 0.35),
          [0.19 + (i % 2) * 0.04, 0.115, 0.04 + Math.floor(i / 2) * 0.04],
          {},
          spo,
        );
      }
      paperSurf = zi(
        kit,
        0.36,
        0.18,
        [0, 0.24, -0.1],
        [512, 256],
        {
          rot: [-0.25, 0, 0],
          name: "Console Printer Paper",
          info: "Shows the S-machine's OUT buffer. A lab mirror: the SAM interpreter writes to main memory, it does not drive the 9340.",
        },
        spo,
      );

      // 3. 9480-2 dual disk cartridge subsystem (SRM table 1-2: 4.6 MB, dual). Two stacked drives,
      // cream fronts and walnut casing as in catalogue photo M B1700-7 and the brochure; size estimated.
      const dsk = kit.group([0.55, 0.03, -0.75], {
        name: "9480-2 Disk Cartridge Subsystem (dual)",
        info: "Dual disk cartridge storage, 4.6 MB (SRM 1057155 table 1-2). Look from catalogue photo M B1700-7; dimensions estimated; not emulated.",
      });
      kit.box(
        0.6,
        1.08,
        0.7,
        walnut,
        [0, 0.56, 0],
        { shell: true, explode: [0, 0, -0.35] },
        dsk,
      );
      for (let d = 0; d < 2; d++) {
        const y0 = 0.33 + d * 0.46;
        kit.box(0.54, 0.4, 0.02, white, [0, y0, 0.355], {}, dsk);
        kit.box(
          0.46,
          0.08,
          0.012,
          U.plastic(0x1e1b18, 0.3),
          [0, y0 + 0.1, 0.368],
          {},
          dsk,
        );
        kit.box(0.2, 0.014, 0.02, U.alu(), [0, y0 - 0.06, 0.372], {}, dsk);
        const plat = kit.cyl(
          0.18,
          0.18,
          0.012,
          U.metal(0x8c939b, 0.42),
          [0, y0, 0],
          {
            seg: 40,
            name: d ? undefined : "Disk Cartridge Platters",
            info: "Disk cartridges (rotation is illustrative).",
          },
          dsk,
        );
        diskPlatters.push(plat);
      }
      for (const [cx, cz] of [
        [-0.25, -0.3],
        [0.25, -0.3],
        [-0.25, 0.3],
        [0.25, 0.3],
      ])
        kit.cyl(
          0.025,
          0.025,
          0.03,
          charcoal,
          [cx, 0.015, cz],
          { rot: [0, 0, Math.PI / 2], seg: 12 },
          dsk,
        );

      // 4. 9419-1 96-column data recorder on its desk (SRM table 1-2; catalogue photo M B1700-40)
      const rdr = kit.group([1.45, 0.03, -0.45], {
        name: "9419-1 96-Column Card Data Recorder",
        info: "96-column card reader/punch/data recorder, 300/60 cards per minute (SRM table 1-2). On a desk as in catalogue photo M B1700-40; proportions estimated; not emulated.",
      });
      kit.box(1.0, 0.03, 0.6, walnut, [0, 0.72, 0], {}, rdr);
      for (const x of [-0.44, 0.44]) {
        kit.box(0.04, 0.7, 0.04, charcoal, [x, 0.36, 0], {}, rdr);
        kit.box(0.05, 0.02, 0.56, charcoal, [x, 0.01, 0], {}, rdr);
      }
      kit.box(0.62, 0.16, 0.42, white, [0, 0.815, 0], {}, rdr);
      kit.box(0.5, 0.05, 0.3, U.plastic(0x23201d, 0.35), [0, 0.92, -0.02], {}, rdr);
      kit.box(
        0.1,
        0.035,
        0.05,
        U.plastic(0xd9cfb3, 0.6),
        [-0.16, 0.96, 0],
        {
          name: "96-Column Cards",
          info: "96-column cards: smaller than 80-column cards, punched with round holes in three tiers.",
        },
        rdr,
      );

      // 5. 9348-32 TD 800 CONSOLE DISPLAY — optional on all B 1700 systems from June 1976
      // (Datapro 70C-112-04, Aug 1976): 1,920 characters, 24 lines x 80, cable-connected up to 50 ft.
      // Form follows Figure 1-2 of the TD 700/800 Equipment Reference Manual (1068699, July 1973):
      // a deep dark hood with top vents, a light bezel around a 71.3 sq in viewing area, and a
      // keyboard either attached in front or separate. All dimensions are estimates.
      const tdTable = kit.group([1.55, 0.03, 0.5], {
        rot: [0, -0.6, 0],
        name: "Terminal Table",
        info: "Table for the console display, styled like the operator table (walnut top, dark frame). Size is an estimate.",
      });
      kit.box(0.9, 0.03, 0.6, walnut, [0, 0.664, 0], {}, tdTable);
      for (const x of [-0.4, 0.4]) {
        kit.box(0.04, 0.62, 0.04, charcoal, [x, 0.33, 0], {}, tdTable);
        kit.box(0.05, 0.02, 0.55, charcoal, [x, 0.01, 0], {}, tdTable);
      }
      const td = kit.group(
        [0, 0.68, -0.06],
        {
          name: "9348-32 TD 800 Console Display (optional, from 1976)",
          info: "Optional CRT console display announced June 1976 for all B 1700 systems (Datapro 70C-112-04, Aug 1976): 24 lines of 80 characters, 5 x 7 dot matrix (TD 700/800 manual 1068699). Not in the 1972 brochure room, whose only console is the 9340 printer. On screen: live emulator state, which is lab content (a real unit showed the MCP job mix and log).",
          live: () => `${sys.lastSop || "—"} · ACC ${sys.acc()}`,
        },
        tdTable,
      );
      const tdBody = U.plastic(0x3a3631, 0.5);
      const tdBezel = U.plastic(0xc9c4b8, 0.38);
      const addMesh = (geo, mat, pos, rot) => {
        const m = new B(geo, mat);
        m.position.set(...pos);
        if (rot) m.rotation.set(...rot);
        m.castShadow = true;
        m.receiveShadow = true;
        td.add(m);
        return m;
      };
      // plinth, front hood, tapered rear housing for the tube neck and yoke
      addMesh(chamferBox(0.4, 0.04, 0.42, 0.012, 2), tdBody, [0, 0.02, -0.02]);
      addMesh(chamferBox(0.42, 0.33, 0.22, 0.035, 3), tdBody, [0, 0.205, 0.02]);
      const neck = addMesh(
        new ke(0.12, 0.24, 0.24, 4, 1),
        tdBody,
        [0, 0.2, -0.2],
        [Math.PI / 2, Math.PI / 4, 0],
      );
      neck.scale.set(1, 1, 0.82);
      // top vent slots, two banks as in Figure 1-2
      const slatMat = U.plastic(0x15130f, 0.6);
      for (const sx of [-0.1, 0.1])
        for (let i = 0; i < 4; i++)
          kit.box(0.13, 0.004, 0.008, slatMat, [sx, 0.372, 0.03 + i * 0.022], {}, td);
      // light bezel around the tube face
      const fz = 0.173;
      kit.box(0.37, 0.03, 0.07, tdBezel, [0, 0.358 - 0.03, fz - 0.029], {}, td);
      kit.box(0.37, 0.03, 0.07, tdBezel, [0, 0.082, fz - 0.029], {}, td);
      kit.box(0.034, 0.246, 0.07, tdBezel, [-0.168, 0.205, fz - 0.029], {}, td);
      kit.box(0.034, 0.246, 0.07, tdBezel, [0.168, 0.205, fz - 0.029], {}, td);
      kit.box(
        0.31,
        0.225,
        0.01,
        U.plastic(0x0b0b0a, 0.7),
        [0, 0.205, fz - 0.024],
        {},
        td,
      );
      // curved tube face: spherical cap (radius 0.9 m, estimate) carrying the phosphor canvas
      const tubeGeo = new mt(0.29, 0.212, 18, 14);
      {
        const pa = tubeGeo.attributes.position;
        const R = 0.9;
        const edge = Math.sqrt(R * R - 0.145 * 0.145 - 0.106 * 0.106);
        for (let i = 0; i < pa.count; i++) {
          const x = pa.getX(i),
            y = pa.getY(i);
          pa.setZ(i, Math.sqrt(R * R - x * x - y * y) - edge);
        }
        tubeGeo.computeVertexNormals();
      }
      const surf = Bt(960, 576);
      const tube = new B(tubeGeo, b17PhosphorMaterial(surf.tex));
      tube.position.set(0, 0.205, fz - 0.016);
      kit.add(
        tube,
        {
          name: "TD 800 CRT Screen",
          info: "Curved glass face of the cathode-ray tube. Phosphor glow, raster lines, bloom and a short afterglow are drawn by a self-made shader. Phosphor colour is not given in the sources; green is an assumption. Text: 24 x 80 characters (Datapro), here the live emulator state.",
          live: () => `${cpu.micros} micros · ${sys.sOps} S-ops`,
        },
        td,
      );
      instSurf = { ...surf, mesh: tube };
      const glassMat = new Cn({
        color: 0x000000,
        roughness: 0.06,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      });
      const glass = new B(tubeGeo, glassMat);
      glass.position.set(0, 0.205, fz - 0.013);
      td.add(glass);
      // brightness control (manual 1068699 feature list) and the attached keyboard
      kit.cyl(
        0.011,
        0.011,
        0.012,
        U.plastic(0x1a1816, 0.4),
        [0.15, 0.05, 0.175],
        {
          rot: [Math.PI / 2, 0, 0],
          seg: 16,
          name: "Brightness Control",
          info: "Screen brightness knob (TD 700/800 manual feature list). Position estimated.",
        },
        td,
      );
      addMesh(chamferBox(0.42, 0.045, 0.2, 0.01, 2), tdBody, [0, 0.0225, 0.29]);
      buildSculptedKeyboard(
        kit,
        [0, 0.04, 0.3],
        {
          w: 0.38,
          d: 0.15,
          h: 0.012,
          tilt: 0.06,
          bodyColor: 0x3a3631,
          plateColor: 0x24211d,
          keyColor: 0xe6e0cf,
          rows: B17_PERIOD_KEY_ROWS,
          leds: false, // the kit's green lock-status LEDs are a modern PC feature
          name: "TD 800 Keyboard",
          info: "Typewriter-style keyboard with a transmit (XMT) key, attached in front of the screen as in Figure 1-2 of manual 1068699 (it could also be a separate module on a 6 ft cable).",
        },
        td,
      );
      // four page indicator lamps on the keyboard (manual 1068699), incandescent
      for (let i = 0; i < 4; i++)
        tdLamps.push(
          kit.sphere(
            0.004,
            b17LampMaterial(0xffc46b),
            [-0.17 + i * 0.016, 0.05, 0.215],
            i === 0
              ? {
                  seg: 8,
                  name: "Page Lamps (4)",
                  info: "Four keyboard lamps show which display page is on screen (TD 700/800 manual).",
                }
              : { seg: 8 },
            td,
          ),
        );

      drawPanelSkin();
      drawInstrument();
      drawPaper();
      syncLamps(1);
    },

    onPick(part, hit) {
      let t = null;
      for (let o = hit && hit.object; o && !t; o = o.parent)
        if (o.userData && o.userData.b17) t = o.userData.b17;
      if (!t && part && part.userData) t = part.userData.b17 || null;
      if (!t) return false;
      if (t.kind === "data") {
        dataSwitches ^= 1 << t.bit;
        za(toggles[t.bit], (dataSwitches >>> t.bit) & 1);
        hi("toggle", { min: 0.03 });
      } else if (t.kind === "int") {
        cpu.C |= 1 << 12; // CC bit 0: console interrupt
        hi("toggle", { min: 0.03 });
      } else if (t.kind === "knob") {
        if (t.key === "col") {
          selCol = (selCol + 1) & 3;
          if (!B1700_REG[selCol][selRow]) selRow = 0;
        } else if (t.key === "row") {
          do selRow = (selRow + 1) & 15;
          while (!B1700_REG[selCol][selRow]);
        } else {
          mode = mode === "STEP" ? "RUN" : mode === "RUN" ? "TAPE" : "STEP";
        }
        const kk = knobs[t.key];
        if (kk && kk.userData.pivot)
          kk.userData.pivot.rotation.z =
            -(t.key === "col"
              ? selCol
              : t.key === "row"
                ? selRow
                : ["STEP", "RUN", "TAPE"].indexOf(mode)) * 0.35;
        hi("switch", { min: 0.03 });
      } else if (t.kind === "button") {
        hi("clack", { min: 0.03 });
        if (t.name === "HALT") running = false;
        else if (t.name === "START") {
          if (mode === "STEP") {
            running = false;
            microStep(null);
          } else if (mode === "RUN") running = true;
        } else if (t.name === "CLEAR") {
          sys.load();
          running = false;
        } else if (t.name === "LOAD") {
          try {
            cpu.set(selName(), dataSwitches);
          } catch (e) {
            /* source-only registers ignore LOAD */
          }
        } else if (t.name === "INC-A") cpu.A = (cpu.A + 1) & 0x3fff;
      }
      drawInstrument();
      if (machine._syncStats) machine._syncStats();
      return true;
    },

    ui(el, ctx) {
      const progNames = Object.keys(B1700_SAM_PROGRAMS);
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set(
          "a",
          `${cpu.lastAddr} (${cpu.lastFromCM ? "control mem" : "main mem"})`,
        );
        statsUi.set(
          "m",
          `${cpu.M.toString(16).toUpperCase().padStart(4, "0")} ${cpu.lastText}`,
        );
        statsUi.set(
          "sop",
          `${sys.lastSop || "—"} @ bit ${cpu.padGet(1, 0) - B1700_LAYOUT.SPROG}`,
        );
        statsUi.set(
          "acc",
          `${sys.acc()} (${sys.decimal ? "BCD " : "bin "}${cpu.padGet(6, 0).toString(16).toUpperCase()})`,
        );
        statsUi.set("out", sys.outputs().join(" ") || "—");
        statsUi.set(
          "f",
          `FA=${cpu.FA} FL=${cpu.FL} CP=${cpu.CP.toString(2).padStart(8, "0")}`,
        );
        statsUi.set(
          "cnt",
          `${cpu.micros} µops · ${sys.sOps} S-ops · ≈${(cpu.ns / 1000).toFixed(1)} µs`,
        );
        statsUi.set("sel", `${selName()} = ${hex6(cpu.peek(selName()))}`);
      };
      const reload = () => {
        sys.load(sys.programName);
        haltTimer = 0;
        recent.length = 0;
        if (editor) editor.value = B1700_SAM_PROGRAMS[sys.programName];
        drawInstrument();
        drawPaper();
        syncStats();
      };
      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );
      statsUi = Pt([
        ["a", "A (micro addr)"],
        ["m", "M register"],
        ["sop", "S-op / S-PC"],
        ["acc", "Accumulator"],
        ["out", "OUT buffer"],
        ["f", "F reg / CP"],
        ["cnt", "Counts / time"],
        ["sel", "Console lamps"],
      ]);
      editor = Ht(
        B1700_SAM_PROGRAMS[sys.programName],
        (txt) => {
          try {
            assembleB1700SAM(txt, { width: sys.width, decimal: sys.decimal });
            B1700_SAM_PROGRAMS["(edited)"] = txt;
            sys.load("(edited)");
            recent.length = 0;
            drawInstrument();
            drawPaper();
            syncStats();
          } catch (e) {
            if (ctx && ctx.toast) ctx.toast(String(e.message || e));
          }
        },
        9,
      );
      const regOpts = [];
      B1700_REG.forEach((col, c) =>
        col.forEach(
          (n, r) =>
            n &&
            regOpts.push([
              `${c}:${r}`,
              `${n} (col ${c}, row ${r.toString(16).toUpperCase()})`,
            ]),
        ),
      );
      el.append(
        Ie(
          "B 1726 console & micro-machine",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step µ", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              microStep(ctx);
              hi("tick", { min: 0.03 });
              drawInstrument();
              syncStats();
            }),
            Fe("Step S-op", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              let n = 0;
              do microStep(ctx);
              while (!cpu.halted && cpu.A !== sys.interp.labels.FETCH && ++n < 200);
              drawInstrument();
              drawPaper();
              syncStats();
            }),
            Fe("↺ Reset", reload),
          ),
          q(
            "div",
            { class: "row" },
            st(
              progNames.map((k) => [k, k]),
              sys.programName,
              (k) => {
                sys.programName = k;
                reload();
              },
            ),
            st(
              [
                ["bin", "Binary S-machine (CPU=00)"],
                ["dec", "4-bit decimal S-machine (CPU=01)"],
              ],
              sys.decimal ? "dec" : "bin",
              (v) => {
                sys.decimal = v === "dec";
                reload();
              },
            ),
            st(
              [
                ["cm", "Interpreter in control memory"],
                ["mm", "Interpreter in main memory (TOPM=0)"],
              ],
              sys.inControlMemory ? "cm" : "mm",
              (v) => {
                sys.inControlMemory = v === "cm";
                reload();
              },
            ),
          ),
          q(
            "div",
            { class: "row" },
            st(
              [
                ["240", "240 µops/s"],
                ["2400", "2,400 µops/s"],
                ["24000", "24,000 µops/s"],
              ],
              String(microsPerSec),
              (v) => (microsPerSec = +v),
            ),
            st(regOpts, `${selCol}:${selRow}`, (v) => {
              const [c, r] = v.split(":").map(Number);
              selCol = c;
              selRow = r;
              syncStats();
            }),
            Fe("📜 Dossier & sources", () => openB1700Dossier()),
          ),
          statsUi,
        ),
        Ie("SAM S-program (lab-defined S-language; edit to re-assemble)", editor),
        Ie(
          "Interpreter microcode (MIL subset, read-only)",
          q(
            "pre",
            { class: "small", style: "max-height:180px;overflow:auto;white-space:pre" },
            B1700_SAM_INTERPRETER_MIL.trim(),
          ),
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      diskPlatters.forEach((p) => (p.rotation.y += dt * 9));
      if (mode === "TAPE") cassetteHubs.forEach((h) => (h.rotation.y += dt * 6));
      if (running && mode === "RUN") {
        if (cpu.halted) {
          haltTimer += dt;
          if (haltTimer > 2.5) {
            haltTimer = 0;
            sys.load(sys.programName);
            recent.length = 0;
          }
        } else {
          acc += dt * microsPerSec;
          let n = Math.min(4000, Math.floor(acc));
          acc -= n;
          let pulses = 0;
          while (n-- > 0 && !cpu.halted) {
            microStep(pulses++ < 2 ? ctx : null);
          }
          if (cpu.halted) {
            hi("tty", { min: 0.2 });
            drawPaper();
          }
        }
        if (machine._syncStats && ((t * 8) | 0) % 2 === 0) machine._syncStats();
      }
      // CRT text at about 15 Hz (also lets stale characters fade as afterglow)
      crtTimer += dt;
      if (crtTimer > 0.066) {
        crtTimer = 0;
        drawInstrument();
      }
      syncLamps(dt);
      if (instSurf && instSurf.mesh) {
        const q = typeof window !== "undefined" ? window.__quality : null;
        instSurf.mesh.material.userData.uQ.value = q === "low" ? 0 : 1;
      }
      tdLamps.forEach((l, i) => (l.material.emissiveIntensity = i === 0 ? 2.0 : 0.05));
    },

    isRunning: () => running,
    sim: sys,
    test() {
      const probe = new B1700System();
      const expect = {
        "Sum 1..10": "55",
        "Fibonacci, 11 terms": "1,1,2,3,5,8,13,21,34,55,89",
        "Countdown 9..1": "9,8,7,6,5,4,3,2,1",
      };
      const bad = [];
      for (const [name, out] of Object.entries(expect)) {
        for (const decimal of [false, true]) {
          probe.load(name, { decimal, inControlMemory: !decimal });
          probe.runToHalt(50000);
          if (!probe.cpu.halted || probe.outputs().join(",") !== out)
            bad.push(`${name}/${decimal ? "dec" : "bin"}`);
        }
      }
      // MIL manual example: EXTRACT 4 BITS FROM T(20) TO L
      const p = new B1700Processor({ mainBytes: 64, cmWords: 512 });
      assembleB1700MIL("EXTRACT 4 BITS FROM T(20) TO L\nHALT").code.forEach(
        (w, i) => (p.cm[i] = w),
      );
      p.T = 0x0138e4;
      p.run(4);
      if (p.L !== 4) bad.push("EXTRACT");
      return {
        ok: bad.length === 0,
        detail: bad.length
          ? "failed: " + bad.join(" ")
          : "SAM sum=55, fib, countdown ✓ binary+decimal, CM+MM; MIL EXTRACT ✓",
      };
    },
  };
  return machine;
}

// In-app dossier overlay (content in src/machines/b1700-dossier.js)
function openB1700Dossier() {
  if (document.querySelector(".overlay.b1700")) return;
  const D = window.B1700_DOSSIER || { sections: [] };
  const ov = q("div", {
    class: "overlay b1700",
    onclick: (ev) => {
      if (ev.target === ov) ov.remove();
    },
  });
  const link = (l) =>
    q("a", { href: l.url, target: "_blank", rel: "noopener" }, l.label || l.url);
  ov.append(
    q(
      "div",
      { class: "modal" },
      q(
        "button",
        { class: "mx", onclick: () => ov.remove(), "aria-label": "Close" },
        "×",
      ),
      q("h2", {}, D.title || "Burroughs B1700 dossier"),
      q("p", { class: "small" }, D.note || ""),
      ...D.sections.map((s) =>
        q(
          "section",
          {},
          q("h3", {}, s.h),
          q(
            "ul",
            { class: "small" },
            ...s.items.map((it) =>
              q("li", {}, it.text, ...(it.links || []).flatMap((l) => [" · ", link(l)])),
            ),
          ),
        ),
      ),
    ),
  );
  document.body.append(ov);
}

// Incandescent console lamp: physical material plus a small shader patch that makes the lens
// brightest at its centre and dim at the rim (a frosted lens over a filament). Self-made.
function b17LampMaterial(col) {
  const m = new Cn({
    color: new Ae(col).multiplyScalar(0.22),
    emissive: col,
    emissiveIntensity: 0.05,
    roughness: 0.35,
    clearcoat: 0.9,
    clearcoatRoughness: 0.15,
  });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n  float b17f = abs(dot(normalize(normal), normalize(vViewPosition)));\n  totalEmissiveRadiance *= mix(0.22, 1.75, pow(b17f, 2.5));",
    );
  };
  m.customProgramCacheKey = () => "b17lamp";
  return m;
}

// Typewriter-era key rows (no ESC, Windows or Fn keys). Shared by the 9340 SPO and the TD 800.
const B17_PERIOD_KEY_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "BKSP"],
  ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "@", "["],
  ["CAPS", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", ":", "ENTER"],
  ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "SHIFT"],
  ["PAGE", "SPACE", "XMT"],
];

// Monochrome CRT phosphor on curved glass. Self-made: slight barrel warp, raster lines, a soft
// halo around lit dots, unlit-phosphor grey and edge falloff. No aperture grille (a monochrome
// tube has none). The quality tier sets the uniform uQ: "low" drops the halo and raster lines.
function b17PhosphorMaterial(tex) {
  const m = new xt({ map: tex, toneMapped: false });
  m.userData.uQ = { value: 1 };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uQ = m.userData.uQ;
    sh.fragmentShader =
      "uniform float uQ;\n" +
      sh.fragmentShader.replace(
        "#include <map_fragment>",
        `
      vec2 cc = vMapUv * 2.0 - 1.0; cc *= 1.0 + 0.025 * dot(cc, cc); vec2 uv = cc * 0.5 + 0.5;
      float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
      vec3 base = texture2D(map, uv).rgb;
      vec3 halo = vec3(0.0);
      if (uQ > 0.5) {
        halo = (texture2D(map, uv + vec2(0.003, 0.0)).rgb + texture2D(map, uv - vec2(0.003, 0.0)).rgb
          + texture2D(map, uv + vec2(0.0, 0.005)).rgb + texture2D(map, uv - vec2(0.0, 0.005)).rgb) * 0.25;
      }
      float scan = mix(1.0, 0.68 + 0.32 * pow(abs(sin(uv.y * 288.0 * 3.14159)), 0.5), step(0.5, uQ));
      float vig = mix(1.0, smoothstep(1.9, 0.75, length(cc * vec2(0.8, 0.9))), 0.55);
      vec3 col = (base * 1.3 + halo * vec3(0.35, 0.8, 0.45)) * scan * vig * inside + vec3(0.022, 0.026, 0.022);
      vec4 sampledDiffuseColor = vec4(col, 1.0);
      diffuseColor *= sampledDiffuseColor;`,
      );
  };
  m.customProgramCacheKey = () => "b17phosphor";
  return m;
}
