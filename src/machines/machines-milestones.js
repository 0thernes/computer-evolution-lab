// Watershed Circle I Architecture Milestones:
//   - agc66  (1966 MIT Apollo Guidance Computer Block II & DSKY — 1st Monolithic IC Computer & 1202 Executive)
//   - alto73 (1973 Xerox PARC Alto Workstation — Bitmapped GUI, BitBLT RasterOp, Smalltalk VM & 3 Mbps Ethernet)
//   - arm07  (2007 Mobile ARM RISC SoC & Multi-Touch Pocket Computer — big.LITTLE, CMOS DVFS, TBDR & Capacitive Touch)

function makeMachineAgc66() {
  const sim = new ApolloAgcDsky();
  let running = true;
  let stepAcc = 0;
  let dskySurf = null;
  let mon = null;
  let alarmMesh = null;
  let compActyMesh = null;
  let statsUi = null;

  function drawDskyPanel() {
    if (!dskySurf) return;
    const c = dskySurf.ctx;
    const W = 512,
      H = 512;
    c.fillStyle = "#161b22";
    c.fillRect(0, 0, W, H);

    // Outer anodized grey bezel
    c.strokeStyle = "#525b66";
    c.lineWidth = 8;
    c.strokeRect(8, 8, W - 16, H - 16);

    // Left panel: Caution & Status Annunciator Lamps (2 columns x 5 rows)
    c.fillStyle = "#0e1217";
    c.fillRect(22, 26, 206, 360);
    c.strokeStyle = "#3b434e";
    c.lineWidth = 3;
    c.strokeRect(22, 26, 206, 360);

    const lamps = [
      ["UPLINK", sim.cycle % 7 === 0, "#e2e8f0"],
      ["TEMP", sim.tempLit, "#fbbf24"],
      ["NO ATT", false, "#e2e8f0"],
      ["GIMBAL LOCK", false, "#fbbf24"],
      ["STBY", sim.prog === 0, "#e2e8f0"],
      ["PROG", sim.progAlarm, "#f59e0b"],
      ["KEY REL", sim.keyRel, "#e2e8f0"],
      ["RESTART", sim.progAlarm, "#f59e0b"],
      ["OPR ERR", sim.oprErr, "#e2e8f0"],
      ["TRACKER", sim.radarBuzz, "#fbbf24"],
    ];
    lamps.forEach(([lbl, lit, col], idx) => {
      const colIdx = idx % 2;
      const rowIdx = Math.floor(idx / 2);
      const lx = 32 + colIdx * 96;
      const ly = 38 + rowIdx * 68;
      c.fillStyle = lit ? col : "#232a34";
      c.fillRect(lx, ly, 88, 56);
      c.fillStyle = lit ? "#090d12" : "#64748b";
      c.font = '700 13px "JetBrains Mono", monospace';
      c.textAlign = "center";
      c.fillText(lbl, lx + 44, ly + 33);
    });

    // Right panel: Electroluminescent 250V Green 7-Segment AGC Readout!
    c.fillStyle = "#04140a";
    c.fillRect(242, 26, 248, 360);
    c.strokeStyle = "#15803d";
    c.lineWidth = 3;
    c.strokeRect(242, 26, 248, 360);

    // COMP ACTY + PROG
    c.fillStyle = sim.compActy ? "#4ade80" : "#0b2916";
    c.fillRect(256, 40, 88, 58);
    c.fillStyle = sim.compActy ? "#031208" : "#1e462b";
    c.font = '700 13px "JetBrains Mono", monospace';
    c.fillText("COMP", 300, 64);
    c.fillText("ACTY", 300, 83);

    c.fillStyle = "#86efac";
    c.font = '700 14px "JetBrains Mono", monospace';
    c.fillText("PROG", 426, 50);
    c.fillStyle = "#4ade80";
    c.font = '700 38px "JetBrains Mono", monospace';
    c.fillText(String(sim.prog).padStart(2, "0"), 426, 92);

    // VERB & NOUN
    c.fillStyle = "#86efac";
    c.font = '700 14px "JetBrains Mono", monospace';
    c.fillText("VERB", 300, 124);
    c.fillText("NOUN", 426, 124);
    c.fillStyle = "#4ade80";
    c.font = '700 38px "JetBrains Mono", monospace';
    c.fillText(String(sim.verb).padStart(2, "0"), 300, 166);
    c.fillText(String(sim.noun).padStart(2, "0"), 426, 166);

    // 3 Signed 5-Digit Electroluminescent Data Registers (R1, R2, R3)
    [sim.r1, sim.r2, sim.r3].forEach((regStr, idx) => {
      const ry = 224 + idx * 58;
      c.strokeStyle = "#14532d";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(254, ry - 38);
      c.lineTo(478, ry - 38);
      c.stroke();
      c.fillStyle = "#4ade80";
      c.font = '700 40px "JetBrains Mono", monospace';
      c.fillText(regStr, 366, ry);
    });
    c.textAlign = "left";

    // Bottom Legend Plate
    c.fillStyle = "#cbd5e1";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText(
      sim.progAlarm
        ? "ALARM 01202 · EXECUTIVE BAILOUT SHEDDING RADAR!"
        : `MIT BLOCK II AGC · P${String(sim.prog).padStart(2, "0")} LUNAR DESCENT`,
      24,
      432,
    );
    c.fillStyle = "#94a3b8";
    c.font = '600 13px "JetBrains Mono", monospace';
    c.fillText("Click any 3D DSKY key below or use Verb/Noun controls ->", 24, 468);

    dskySurf.tex.needsUpdate = true;
  }

  function drawAgcMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060b12";
    c.fillRect(0, 0, W, H);

    c.fillStyle = sim.progAlarm ? "#78350f" : "#064e3b";
    c.fillRect(16, 14, W - 32, 52);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `MIT APOLLO GUIDANCE COMPUTER BLOCK II · Z=0${sim.Z.toString(8)} · A=${sim.A.toString(8).padStart(5, "0")} · ${sim.progAlarm ? "1202 EXEC OVERFLOW RECOVERY!" : "NOMINAL P" + sim.prog}`,
      28,
      47,
    );

    // Left: Margaret Hamilton's 8-Slot Priority Executive Core Set Queue
    c.fillStyle = "#0b1422";
    c.fillRect(20, 82, 500, 410);
    c.strokeStyle = sim.progAlarm ? "#f59e0b" : "#34d399";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 500, 410);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("PRIORITY EXECUTIVE CORE SET (8 SLOTS) · CONCEPTUAL MODEL", 36, 112);

    for (let slot = 0; slot < 8; slot++) {
      const job = sim.coreSet[slot];
      const sy = 132 + slot * 42;
      c.fillStyle = job
        ? job.prio >= 20
          ? "rgba(16, 185, 129, 0.22)"
          : "rgba(245, 158, 11, 0.24)"
        : "#0f172a";
      c.fillRect(34, sy, 472, 34);
      c.strokeStyle = job ? (job.prio >= 20 ? "#10b981" : "#f59e0b") : "#1e293b";
      c.strokeRect(34, sy, 472, 34);
      c.fillStyle = job ? "#f8fafc" : "#475569";
      c.font = '600 14px "JetBrains Mono", monospace';
      c.fillText(
        job
          ? `SLOT ${slot}: [PRIO ${job.prio}] ${job.name} (FB 0${job.bank.toString(8)})`
          : `SLOT ${slot}: <FREE CORE-SET VACANCY>`,
        46,
        sy + 22,
      );
    }

    // Right: Lunar Module P64 Powered Descent Profile & Throttle
    c.fillStyle = "#0b1422";
    c.fillRect(538, 82, 466, 410);
    c.strokeStyle = "#38bdf8";
    c.strokeRect(538, 82, 466, 410);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("EAGLE LM POWERED DESCENT GUIDANCE (SEA OF TRANQUILITY)", 552, 112);

    // Lunar horizon + descent curve
    c.fillStyle = "#1e293b";
    c.fillRect(558, 430, 426, 36);
    c.fillStyle = "#94a3b8";
    c.font = '600 12px "JetBrains Mono", monospace';
    c.fillText("LUNAR REGOLITH · TRANQUILITY BASE (0.67°N, 23.47°E)", 572, 453);

    c.strokeStyle = "#38bdf8";
    c.setLineDash([5, 5]);
    c.beginPath();
    c.moveTo(575, 155);
    c.quadraticCurveTo(780, 250, 945, 428);
    c.stroke();
    c.setLineDash([]);

    const progFrac = 1 - Math.min(1, sim.altitudeFt / 2600);
    const lx = 575 + progFrac * 370;
    const ly = 428 - (1 - progFrac) * 265;
    // DPS Rocket Plume + LM icon
    c.fillStyle = "#fbbf24";
    c.beginPath();
    c.moveTo(lx, ly + 8);
    c.lineTo(lx - 8, ly + 12 + sim.throttlePct * 0.28);
    c.lineTo(lx + 8, ly + 12 + sim.throttlePct * 0.28);
    c.closePath();
    c.fill();
    c.fillStyle = "#fde047";
    c.fillRect(lx - 11, ly - 10, 22, 18);

    c.fillStyle = "#e2e8f0";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(`ALTITUDE:     ${sim.altitudeFt.toFixed(0)} ft`, 562, 336);
    c.fillText(`DESCENT RATE: ${sim.vertVelFps.toFixed(1)} ft/s`, 562, 366);
    c.fillText(`DPS THROTTLE: ${sim.throttlePct}%`, 562, 396);

    // Bottom: Woven Copper Core Rope ROM & 5,600 RTL NOR Flat-Pack IC Architecture
    c.fillStyle = "#0b1422";
    c.fillRect(20, 510, W - 40, 234);
    c.strokeStyle = "#fbbf24";
    c.strokeRect(20, 510, W - 40, 234);
    c.fillStyle = "#fde047";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "FIRST MONOLITHIC IC COMPUTER: 5,600 FAIRCHILD 3-INPUT RTL NOR GATES + CORE ROPE ROM",
      36,
      542,
    );
    c.fillStyle = "#cbd5e1";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      `• Fixed Core Rope ROM: 36,864 16-bit words (15-bit 1's-comp + odd parity) hand-woven through ferrite cores.`,
      36,
      582,
    );
    c.fillText(
      `• Erasable Ferrite RAM: 2,048 words · Clock: 2.048 MHz crystal (11.7 µs Memory Cycle Time) · Power: 55 W.`,
      36,
      618,
    );
    c.fillStyle = sim.progAlarm ? "#fbbf24" : "#34d399";
    c.fillText(
      `• 1202 Executive Bailout Recoveries: ${sim.bailoutRecoveries} (low-prio Rendezvous Radar shed; P64 throttle uninterrupted!).`,
      36,
      658,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "agc66",
    era: "1966",
    short: "Apollo AGC + DSKY",
    name: "MIT Apollo Guidance Computer (Block II) & DSKY",
    view0: 0.36,
    blurb:
      "First computer built from monolithic Integrated Circuits (5,600 identical Fairchild 3-input RTL NOR flat-packs, consuming 60% of US IC output in 1963): features hand-woven copper Core Rope ROM (36K words), 2K erasable ferrite RAM, clickable electroluminescent DSKY Verb/Noun interface, and Margaret Hamilton's priority-scheduled real-time executive that survived Apollo 11's 1202 Executive Overflow. Simulation: CONCEPTUAL MODEL. A 7-word rope program with 4 opcodes and a scripted 1202 (the job queue is filled to 8); not a Block II instruction-set emulator.",
    diagram: {
      nodes: [
        { id: "dsky", label: "DSKY Verb/Noun", x: 0.16, y: 0.24, color: "#4ade80" },
        { id: "nor", label: "5,600 RTL NOR CPU", x: 0.5, y: 0.32, color: "#fbbf24" },
        { id: "rope", label: "36K Core Rope ROM", x: 0.84, y: 0.22, color: "#f97316" },
        { id: "eram", label: "2K Erasable Core", x: 0.84, y: 0.76, color: "#38bdf8" },
        { id: "exec", label: "Priority Exec (1202)", x: 0.2, y: 0.78, color: "#34d399" },
      ],
      edges: [
        ["dsky", "nor", "PINBALL"],
        ["rope", "nor", "15b+Par"],
        ["nor", "eram", "11.7 µs"],
        ["exec", "nor", "PRIO 30"],
      ],
    },
    build(kit) {
      dskySurf = Bt(512, 512);

      // 1. MIT INSTRUMENTATION LAB BLOCK II AGC GOLDEN FLIGHT CHASSIS (Left)
      const agcTray = kit.group([-0.68, 0, -0.06], {
        name: "Block II Apollo Guidance Computer Chassis",
        info: "Hermetically sealed beryllium-magnesium flight computer tray housing Tray A (24 cordwood RTL NOR logic modules) and Tray B (6 woven Core Rope ROM modules + 2K erasable ferrite stack).",
      });
      kit.box(
        0.86,
        0.14,
        0.68,
        U.alu(),
        [0, 0.07, 0],
        {
          name: "Beryllium-Magnesium Coldplate Base",
        },
        agcTray,
      );

      // Golden Kapton / anodized aerospace flight cover (shell: true -> Cutaway reveals Tray A & Tray B!)
      kit.box(
        0.84,
        0.28,
        0.66,
        U.cryoGold(),
        [0, 0.28, 0],
        {
          shell: true,
          name: "Gold Thermal-Control AGC Flight Cover",
          info: "Sealed gold aerospace enclosure protecting the wire-wrap backplane and flat-pack logic modules in the Lunar Module Lower Equipment Bay.",
          explode: [0, 0.42, 0],
        },
        agcTray,
      );

      // Tray A: 12 visible Cordwood Logic Sticks (5,600 Fairchild Micrologic 3-input RTL NOR flat-packs!)
      for (let m = 0; m < 12; m++) {
        const mx = -0.34 + (m % 6) * 0.11;
        const mz = m < 6 ? -0.14 : 0.14;
        const stick = kit.box(
          0.082,
          0.19,
          0.22,
          U.pcb(0x1f4f38),
          [mx, 0.24, mz],
          {
            name: `RTL NOR Flat-Pack Logic Module A${m + 1}`,
            info: "Contains 120 dual 3-input Resistor-Transistor Logic (RTL) monolithic silicon NOR flat-pack ICs interconnected via nickel ribbon welding.",
            live: () => `Z=0${sim.Z.toString(8)} · A=0${sim.A.toString(8)}`,
            explode: [0, 0.22 + (m % 3) * 0.04, mz * 0.6],
          },
          agcTray,
        );
        kit.box(0.05, 0.02, 0.16, U.gold(), [0, 0.1, 0], {}, stick);
      }

      // Tray B: 6 Woven Copper Core Rope Fixed-Memory Modules + Erasable Ferrite Stack (U.corePlane()!)
      const ropeBay = kit.group(
        [0.28, 0.24, 0],
        {
          name: "36K-Word Woven Core Rope ROM & 2K Erasable Core",
          info: "High-density read-only 'LOL memory' where copper sense wires are physically woven through (binary 1) or around (binary 0) nickel-iron cores — immune to radiation and power glitches.",
          live: () => `Bank FB=033 · Cycle=${sim.cycle}`,
          explode: [0.28, 0.26, 0],
        },
        agcTray,
      );
      for (let r = 0; r < 4; r++) {
        kit.box(
          0.18,
          0.18,
          0.11,
          U.corePlane(),
          [0, 0, -0.19 + r * 0.125],
          {
            name: `Woven Copper Core Rope ROM Bank ${r + 1}`,
            info: "Stores permanent Luminary / Colossus flight software woven by skilled textile workers at Raytheon Waltham.",
          },
          ropeBay,
        );
      }

      // Twin 70-pin circular gold aerospace connectors on front flange
      for (const cz of [-0.18, 0.18]) {
        kit.cyl(
          0.055,
          0.055,
          0.07,
          U.gold(),
          [-0.45, 0.22, cz],
          {
            rot: [0, 0, Math.PI / 2],
            name: "Malco Umbilical Flight Connector",
          },
          agcTray,
        );
      }

      // 2. INTERACTIVE BLOCK II DSKY (DISPLAY & KEYBOARD) ON TILTED COCKPIT PEDESTAL (Center-Front)
      const dskyGrp = kit.group([-0.06, 0.02, 0.34], {
        rot: [-0.36, 0.16, 0],
        name: "Block II DSKY (Display & Keyboard Unit)",
        info: "Astronaut interface running the 'Pinball Game Buttons and Lights' interpreter: enter 2-digit VERB (action) and 2-digit NOUN (target data) in decimal; click any 3D key below!",
        live: () => `P${sim.prog} · V${sim.verb} N${sim.noun} · R1=${sim.r1}`,
        explode: [0, 0.18, 0.36],
      });
      kit.box(0.46, 0.56, 0.14, U.metal(0x4b535e, 0.42), [0, 0.3, 0], {}, dskyGrp);

      // Live Electroluminescent Screen Mesh on upper DSKY face
      kit.mesh(
        new mt(0.4, 0.34),
        U.screen(dskySurf.tex),
        [0, 0.39, 0.073],
        {
          name: "250V Electroluminescent 7-Segment Display & Caution Matrix",
          info: "Hermetically sealed green electroluminescent segments driven by 145 miniature latching relays inside the DSKY.",
        },
        dskyGrp,
      );

      // Physical glowing 1202 PROG alarm jewel & COMP ACTY indicator
      alarmMesh = kit.box(
        0.06,
        0.028,
        0.012,
        U.led(0xf59e0b),
        [-0.055, 0.42, 0.076],
        {
          name: "1202 PROG Executive Alarm Lamp",
          info: "Illuminates amber on octal alarm 01202 (Executive Overflow — no vacant Core Set slots due to Rendezvous Radar cycle stealing).",
        },
        dskyGrp,
      );
      compActyMesh = kit.box(
        0.055,
        0.032,
        0.012,
        U.led(0x4ade80),
        [0.055, 0.5, 0.076],
        {
          name: "COMP ACTY Lamp",
        },
        dskyGrp,
      );

      // 19 Sculpted Clickable 3D DSKY Pushbuttons!
      const keyDefs = [
        ["VERB", -0.16, 0.17],
        ["NOUN", -0.16, 0.11],
        ["+", -0.095, 0.18],
        ["-", -0.095, 0.13],
        ["0", -0.095, 0.08],
        ["7", -0.03, 0.18],
        ["4", -0.03, 0.13],
        ["1", -0.03, 0.08],
        ["8", 0.035, 0.18],
        ["5", 0.035, 0.13],
        ["2", 0.035, 0.08],
        ["9", 0.1, 0.18],
        ["6", 0.1, 0.13],
        ["3", 0.1, 0.08],
        ["CLR", 0.165, 0.19],
        ["PRO", 0.165, 0.145],
        ["KREL", 0.165, 0.1],
        ["ENTR", 0.165, 0.055],
        ["RSET", -0.16, 0.055],
      ];
      for (const [kLbl, kx, ky] of keyDefs) {
        const btn = kit.box(
          0.052,
          0.038,
          0.026,
          U.plastic(0x222831, 0.38),
          [kx, ky, 0.078],
          {
            name: `DSKY Key [${kLbl}]`,
            info: `Click in 3D to press DSKY pushbutton ${kLbl}. RSET clears active 1202 PROG alarms; PRO proceeds P64 landing guidance.`,
          },
          dskyGrp,
        );
        btn.userData.dskyKey = kLbl;
      }

      // 3. TELEMETRY & PRIORITY EXECUTIVE MONITOR (Right — facing +Z!)
      mon = buildMonitor3D(kit, [0.78, 0.64, 0.08], {
        w: 0.92,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "MIT Luminary Executive & Lunar Descent Telemetry Console",
        explode: [0.36, 0, 0],
      });
      kit.box(1.0, 0.64, 0.54, U.darkAnodized(0x141b24), [0.78, 0.32, 0.08], {
        rot: [0, 0.04, 0],
      });

      drawDskyPanel();
      drawAgcMonitor();
    },

    onPick(part) {
      const k = part.userData && part.userData.dskyKey;
      if (!k) return false;
      hi("toggle", { min: 0.03 });
      if (k === "RSET" || k === "KREL" || k === "CLR") {
        sim.clearAlarm();
      } else if (k === "VERB") {
        sim.enterVerbNoun(sim.verb === 16 ? 6 : 16, sim.noun);
      } else if (k === "NOUN") {
        sim.enterVerbNoun(sim.verb, sim.noun === 68 ? 62 : 68);
      } else if (k === "PRO" || k === "ENTR") {
        sim.step();
      } else if (/^[0-9]$/.test(k)) {
        const d = Number(k);
        sim.enterVerbNoun(16, d === 9 ? 1 : d === 4 ? 43 : d === 6 ? 62 : 68);
      }
      drawDskyPanel();
      drawAgcMonitor();
      if (machine._syncStats) machine._syncStats();
      return true;
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set(
          "prog",
          `P${String(sim.prog).padStart(2, "0")} / V${sim.verb}N${sim.noun}`,
        );
        statsUi.set("alt", `${sim.altitudeFt.toFixed(0)} ft`);
        statsUi.set("vel", `${sim.vertVelFps.toFixed(1)} fps (${sim.throttlePct}%)`);
        statsUi.set("z", `0${sim.Z.toString(8)} (15b+P)`);
        statsUi.set("alarm", sim.progAlarm ? "01202 OVERFLOW!" : "00000 NOMINAL");
        statsUi.set("bail", `${sim.bailoutRecoveries} Recoveries`);
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      const radarBtn = Fe(
        "⚡ Trigger 1202 Radar Overload",
        () => {
          sim.triggerRadarOverload(!sim.radarBuzz);
          radarBtn.textContent = sim.radarBuzz
            ? "✅ Stop Radar SLEW Flood"
            : "⚡ Trigger 1202 Radar Overload";
          hi("bell", { min: 0.08 });
          if (ctx.diagram) ctx.diagram.pulse("exec", "nor", "#f59e0b");
          drawDskyPanel();
          drawAgcMonitor();
          syncStats();
        },
        "pri",
      );

      statsUi = Pt([
        ["prog", "DSKY Mode"],
        ["alt", "LM Altitude"],
        ["vel", "Descent / DPS"],
        ["z", "Rope PC (Octal)"],
        ["alarm", "Executive Status"],
        ["bail", "1202 Bailouts"],
      ]);

      el.append(
        Ie(
          "DSKY Pinball Verb/Noun & Apollo 11 '1202' Executive Recovery",
          q(
            "div",
            { class: "row" },
            runBtn,
            radarBtn,
            Fe("RSET Clear Alarm", () => {
              sim.clearAlarm();
              hi("toggle", { min: 0.04 });
              drawDskyPanel();
              drawAgcMonitor();
              syncStats();
            }),
          ),
          q(
            "div",
            { class: "row" },
            st(
              [
                ["16,68", "V16 N68 · Monitor Landing Alt / Rate / Vel"],
                ["06,62", "V06 N62 · Total Velocity & DPS Throttle"],
                ["16,43", "V16 N43 · Tranquility Lat / Lon / Altitude"],
                ["09,01", "V09 N01 · Display Octal Alarm Code (01202)"],
                ["35,00", "V35 N00 · DSKY Full 88888 Lamp Test"],
                ["37,63", "V37E 63E · Major Mode P63 Braking Phase"],
                ["37,64", "V37E 64E · Major Mode P64 Approach Phase"],
              ],
              "16,68",
              (val) => {
                const [v, n] = val.split(",").map(Number);
                sim.enterVerbNoun(v, n);
                hi("toggle", { min: 0.04 });
                if (ctx.diagram) ctx.diagram.pulse("dsky", "nor", "#4ade80");
                drawDskyPanel();
                drawAgcMonitor();
                syncStats();
              },
            ),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 4.0;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("rope", "nor", "#f97316");
            ctx.diagram.pulse("nor", "eram", "#38bdf8");
            ctx.diagram.pulse("exec", "nor", sim.progAlarm ? "#f59e0b" : "#34d399");
          }
          drawDskyPanel();
          drawAgcMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      if (alarmMesh) {
        alarmMesh.material.emissiveIntensity = sim.progAlarm
          ? 1.4 + 0.8 * Math.sin(t * 10)
          : 0.04;
      }
      if (compActyMesh) {
        compActyMesh.material.emissiveIntensity = sim.compActy ? 1.35 : 0.08;
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const a = new ApolloAgcDsky();
      a.triggerRadarOverload(true);
      a.step();
      return {
        ok:
          a.alarmCode === 0o1202 &&
          a.bailoutRecoveries >= 1 &&
          a.coreSet.some((j) => j.prio >= 28),
        alarmOctal: a.alarmCode.toString(8),
      };
    },
  };
  return machine;
}

function makeMachineAlto73() {
  const sim = new XeroxAltoSystem();
  let running = true;
  let stepAcc = 0;
  let portraitMon = null;
  let diagMon = null;
  let platterMesh = null;
  let statsUi = null;

  function drawPortraitCrt() {
    if (!portraitMon) return;
    const c = portraitMon.ctx;
    const W = 640,
      H = 832;
    // Authentic Alto P4 white-paper phosphor background!
    c.fillStyle = "#eef2f6";
    c.fillRect(0, 0, W, H);

    const sx = W / sim.fbW;
    const sy = (H - 48) / sim.fbH;
    c.fillStyle = "#11161d";
    for (let y = 0; y < sim.fbH; y++) {
      for (let x = 0; x < sim.fbW; x++) {
        if (sim.vram[y * sim.fbW + x]) {
          c.fillRect(x * sx, y * sy, Math.ceil(sx), Math.ceil(sy));
        }
      }
    }

    // Crisp Smalltalk window titles overlaid at native resolution
    c.fillStyle = "#0f172a";
    c.fillRect(0, H - 48, W, 48);
    c.fillStyle = "#38bdf8";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      `XEROX PARC ALTO · 606×808 PORTRAIT BITMAP · BitBLT=${sim.rasterOp} (#${sim.bitbltOps})`,
      14,
      H - 18,
    );
    portraitMon.tex.needsUpdate = true;
  }

  function drawAltoDiagMonitor() {
    if (!diagMon) return;
    const c = diagMon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060b12";
    c.fillRect(0, 0, W, H);

    c.fillStyle = "#1e3a8a";
    c.fillRect(16, 14, W - 32, 52);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `XEROX ALTO (1973) · SMALLTALK BYTECODE VM + 16-OP BitBLT + 3 Mbps CSMA/CD ETHERNET`,
      28,
      47,
    );

    // Left: Smalltalk-76 Bytecode Stack Machine
    c.fillStyle = "#0b1422";
    c.fillRect(20, 82, 488, 390);
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 488, 390);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("SMALLTALK-76 OBJECT-ORIENTED BYTECODE VM", 36, 112);

    sim.stBytecodes.forEach((bc, idx) => {
      const active = idx === sim.stPc;
      const by = 136 + idx * 44;
      c.fillStyle = active ? "rgba(56, 189, 248, 0.26)" : "#0f172a";
      c.fillRect(36, by, 456, 36);
      c.fillStyle = active ? "#fde047" : "#cbd5e1";
      c.font = '600 15px "JetBrains Mono", monospace';
      c.fillText(
        `${active ? "▶" : " "} 0x${bc.hex.toString(16).toUpperCase()}  ${bc.op.padEnd(12)} ${bc.arg !== null ? bc.arg : ""}`,
        48,
        by + 24,
      );
    });
    c.fillStyle = "#34d399";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      `Eval Stack: [${sim.stStack.join(", ")}]  ->  Msg Result = ${sim.lastResult}`,
      36,
      438,
    );

    // Right: Metcalfe & Boggs 3 Mbps CSMA/CD Ethernet & Exponential Backoff
    c.fillStyle = "#0b1422";
    c.fillRect(526, 82, 478, 390);
    c.strokeStyle = "#fbbf24";
    c.strokeRect(526, 82, 478, 390);
    c.fillStyle = "#fde047";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("3.0 Mbps ETHERNET COAX (CSMA/CD BACKOFF)", 542, 112);

    // Yellow Thicknet coax bus + Vampire tap transceivers
    c.fillStyle = "#eab308";
    c.fillRect(548, 178, 434, 12);
    for (let st = 0; st < 4; st++) {
      const tx = 582 + st * 112;
      c.fillStyle = "#334155";
      c.fillRect(tx - 14, 162, 28, 44);
      c.fillStyle = sim.backoffAttempt > 0 && st < 2 ? "#ef4444" : "#38bdf8";
      c.fillRect(tx - 24, 224, 48, 34);
      c.fillStyle = "#090d14";
      c.font = '700 12px "JetBrains Mono", monospace';
      c.fillText(`ALTO#${st + 1}`, tx - 21, 245);
    }

    c.fillStyle = "#e2e8f0";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(`Frames Delivered:    ${sim.ethPackets}`, 548, 308);
    c.fillText(`Coax Collisions:     ${sim.ethCollisions}`, 548, 340);
    c.fillStyle = sim.backoffAttempt > 0 ? "#f87171" : "#34d399";
    c.fillText(
      sim.backoffAttempt > 0
        ? `JAM! Backoff k∈[0,${(1 << sim.backoffAttempt) - 1}] -> wait ${sim.backoffSlots} slots`
        : `Carrier Sense Clear -> 2.94 Mbps Manchester TX`,
      548,
      382,
    );

    // Bottom: Dan Ingalls BitBLT & Microcoded Tasking Architecture
    c.fillStyle = "#0b1422";
    c.fillRect(20, 492, W - 40, 250);
    c.strokeStyle = "#34d399";
    c.strokeRect(20, 492, W - 40, 250);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "WHY XEROX PARC 1973 CHANGED EVERYTHING: WIMP GUI, WYSIWYG, OOP & LOCAL AREA NETWORKS",
      36,
      526,
    );
    c.fillStyle = "#cbd5e1";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      "• BitBLT (Dan Ingalls): 1 microcoded primitive unifies overlapping windows, proportional fonts, scroll & XOR cursors.",
      36,
      570,
    );
    c.fillText(
      "• Zero-Overhead Cooperative Microtasks: 16 hardware task PCs share one 74181 ALU between CRT refresh, disk & Ethernet!",
      36,
      610,
    );
    c.fillText(
      "• Directly inspired Steve Jobs's 1979 PARC visit (Lisa / Macintosh), Windows, X11, PostScript & IEEE 802.3 Ethernet.",
      36,
      650,
    );
    diagMon.tex.needsUpdate = true;
  }

  const machine = {
    id: "alto73",
    era: "1973",
    short: "Xerox PARC Alto",
    name: "Xerox PARC Alto Personal GUI Workstation",
    view0: 0.34,
    blurb:
      "The 1973 Xerox PARC time-machine from the future (Chuck Thacker, Butler Lampson, Alan Kay, Dan Ingalls, Bob Metcalfe): introduced the portrait 606×808 bitmapped WIMP GUI, 3-button mouse, overlapping windows via microcoded BitBLT rasterops, Smalltalk object-oriented bytecode, and 3 Mbps CSMA/CD Ethernet.",
    diagram: {
      nodes: [
        { id: "mse", label: "3-Btn Mouse + Keyset", x: 0.16, y: 0.24, color: "#fbbf24" },
        { id: "alu", label: "74181 16-Task uCPU", x: 0.5, y: 0.32, color: "#38bdf8" },
        { id: "blt", label: "BitBLT 606×808 VRAM", x: 0.84, y: 0.24, color: "#f8fafc" },
        { id: "dsk", label: "Diablo 2.5MB Pack", x: 0.2, y: 0.78, color: "#f97316" },
        { id: "eth", label: "3 Mbps CSMA/CD Coax", x: 0.82, y: 0.78, color: "#eab308" },
      ],
      edges: [
        ["mse", "alu", "XY + Chord"],
        ["alu", "blt", "RasterOp"],
        ["dsk", "alu", "Microtask"],
        ["alu", "eth", "2.94 Mbps"],
      ],
    },
    build(kit) {
      // 1. UNDER-DESK XEROX ALTO CABINET WITH REMOVABLE DIABLO MODEL 31 DISK PACK (Left)
      const cab = kit.group([-0.78, 0, 0], {
        name: "Xerox Alto Processor & Diablo Disk Pedestal",
        info: "Desk-height cream/charcoal cabinet housing 74181 bit-slice microcode cards, 128 KB MOS RAM, and a removable 14-inch 2.5 MB Diablo Model 31 disk cartridge.",
      });
      kit.box(
        0.58,
        0.82,
        0.74,
        U.plastic(0xd8d1c2, 0.45),
        [0, 0.41, 0],
        {
          shell: true,
          name: "Xerox Alto Cream Side Enclosure",
          explode: [-0.34, 0, 0],
        },
        cab,
      );
      kit.box(
        0.54,
        0.78,
        0.04,
        U.darkAnodized(0x1f252e),
        [0, 0.41, 0.36],
        {
          name: "Alto Front Diablo Cartridge Slot Bezel",
        },
        cab,
      );

      // Internal Diablo Model 31 14-inch Spinning Oxide Disk Cartridge!
      const diablo = kit.group(
        [0, 0.62, 0.02],
        {
          name: "Diablo Model 31 2.5 MB Removable Disk Cartridge",
          info: "Single 14-inch aluminum oxide platter spinning at 1,500 RPM storing the Alto OS, Bravo WYSIWYG editor, and Smalltalk image.",
          explode: [0, 0.3, 0.28],
        },
        cab,
      );
      platterMesh = kit.cyl(
        0.22,
        0.22,
        0.018,
        U.copper(),
        [0, 0, 0],
        {
          name: "14-Inch Iron-Oxide Magnetic Platter",
        },
        diablo,
      );
      kit.cyl(0.05, 0.05, 0.03, U.alu(), [0, 0.015, 0], {}, diablo);

      // Internal 74181 Microcoded Bit-Slice CPU + 128 KB VRAM/RAM Boards
      for (let b = 0; b < 4; b++) {
        kit.box(
          0.42,
          0.36,
          0.018,
          U.pcb(0x1b5e3a),
          [0, 0.26, -0.22 + b * 0.13],
          {
            name:
              b === 0
                ? "TI 74181 16-Bit Microcoded BitBLT Processor Card"
                : `Alto 128 KB MOS Display/Main RAM Card ${b}`,
            info: "Executes up to 16 cooperative hardware microtasks with zero context-switch overhead every 170 ns microinstruction.",
            explode: [-0.24, 0.08 * b, 0],
          },
          cab,
        );
      }

      // Yellow 3 Mbps Thicknet Ethernet Coax + Vampire Tap behind cabinet!
      kit.tube(
        [
          [-1.08, 0.12, -0.34],
          [-0.45, 0.12, -0.34],
          [0.25, 0.12, -0.34],
        ],
        0.016,
        U.plastic(0xeab308, 0.36),
        {
          name: "3 Mbps Experimental Ethernet Thick Coax & Vampire Tap",
          info: "Bob Metcalfe & David Boggs's shared coaxial 'Ether' using CSMA/CD collision detection and binary exponential backoff.",
        },
      );

      // 2. DESK + ICONIC PORTRAIT 606x808 WHITE-PHOSPHOR CRT + KEYBOARD + 5-KEY CHORD KEYSET + 3-BUTTON MOUSE (Center)
      const desk = kit.group([0.02, 0, 0.08], {
        name: "Alto Portrait Workstation Desk",
      });
      kit.box(0.84, 0.04, 0.68, U.wood(), [0, 0.44, 0], {}, desk);
      kit.box(0.78, 0.43, 0.56, U.darkAnodized(0x1b212a), [0, 0.215, 0], {}, desk);

      // Tall Portrait 606x808 CRT Monitor (distinctive vertical page proportion!)
      portraitMon = buildMonitor3D(kit, [0, 0.46, -0.06], {
        w: 0.48,
        h: 0.66,
        res: [640, 832],
        bezelMat: U.plastic(0xd5cec0, 0.46),
        name: "Portrait 606×808 Bitmapped P4 White-Phosphor CRT",
        info: "Full-page 8.5×11 inch portrait bitmap consuming half of Alto's main RAM (~50 KB) refreshed directly by a dedicated display microtask.",
        explode: [0, 0.3, 0],
      });

      // Sculpted Alto Keyboard + 5-Key Engelbart Chorded Keyset (Left) + 3-Button Alto Mouse (Right)
      buildSculptedKeyboard(kit, [0.0, 0.465, 0.2], {
        w: 0.4,
        d: 0.15,
        bodyColor: 0xd4cdc0,
        name: "Alto Detached Mechanical Keyboard",
      });
      const keyset = kit.box(
        0.11,
        0.026,
        0.13,
        U.plastic(0x2b313a, 0.42),
        [-0.29, 0.47, 0.2],
        {
          name: "5-Finger Chorded Keyset",
          info: "Inherited from Doug Engelbart's NLS oN-Line System: lets the left hand enter commands while the right hand steers the 3-button mouse.",
        },
        desk,
      );
      for (let p = 0; p < 5; p++) {
        kit.box(
          0.015,
          0.012,
          0.065,
          U.plastic(0xe2e8f0, 0.35),
          [-0.036 + p * 0.018, 0.016, 0.01],
          {},
          keyset,
        );
      }

      const mouse = kit.box(
        0.068,
        0.028,
        0.105,
        U.plastic(0xd8d1c2, 0.4),
        [0.29, 0.47, 0.21],
        {
          name: "3-Button Xerox PARC Alto Mouse (Red / Yellow / Blue)",
          info: "Three vertical/side-by-side microswitch buttons mapped to Smalltalk select, menu, and window frame commands; click in 3D to cycle windows!",
        },
        desk,
      );
      mouse.userData.altoMouse = true;
      for (let mb = 0; mb < 3; mb++) {
        kit.box(
          0.017,
          0.008,
          0.032,
          U.plastic(0x1f2937, 0.35),
          [-0.02 + mb * 0.02, 0.016, -0.028],
          {},
          mouse,
        );
      }

      // 3. SMALLTALK VM & ETHERNET ANALYZER MONITOR (Right — facing +Z!)
      diagMon = buildMonitor3D(kit, [0.98, 0.64, 0.08], {
        w: 0.9,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "Smalltalk-76 Bytecode & 3 Mbps Ethernet Analyzer",
        explode: [0.36, 0, 0],
      });
      kit.box(0.98, 0.64, 0.52, U.darkAnodized(0x131a24), [0.98, 0.32, 0.08], {
        rot: [0, 0.04, 0],
      });

      drawPortraitCrt();
      drawAltoDiagMonitor();
    },

    onPick(part) {
      if (part.userData && part.userData.altoMouse) {
        sim.bringWindowFront(sim.windows[0].z < sim.windows[1].z ? 0 : 1);
        hi("clack", { min: 0.04 });
        drawPortraitCrt();
        drawAltoDiagMonitor();
        return true;
      }
      return false;
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("rop", `${sim.rasterOp} (${sim.bitbltOps} ops)`);
        statsUi.set("st", `PC=${sim.stPc} -> ${sim.lastResult}`);
        statsUi.set("win", `${sim.windows.length} Overlapping`);
        statsUi.set("eth", `${sim.ethPackets} TX / ${sim.ethCollisions} Coll`);
        statsUi.set(
          "boff",
          sim.backoffAttempt
            ? `2^${sim.backoffAttempt} (${sim.backoffSlots} slots)`
            : "0 (Clear)",
        );
        statsUi.set("dsk", "2.5 MB @ 1500 RPM");
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
        ["rop", "BitBLT RasterOp"],
        ["st", "Smalltalk Stack"],
        ["win", "WIMP Desktop"],
        ["eth", "3 Mbps Ethernet"],
        ["boff", "CSMA/CD Backoff"],
        ["dsk", "Diablo Cartridge"],
      ]);

      el.append(
        Ie(
          "BitBLT RasterOp Compositor, Smalltalk VM & 3 Mbps Ethernet",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe(
              "Swap Window Z-Order",
              () => {
                sim.bringWindowFront(sim.windows[0].z < sim.windows[1].z ? 0 : 1);
                hi("clack", { min: 0.04 });
                if (ctx.diagram) ctx.diagram.pulse("alu", "blt", "#f8fafc");
                drawPortraitCrt();
                syncStats();
              },
              "pri",
            ),
            Fe("Inject Coax Collision", () => {
              sim.transmitEthernetFrame(true);
              hi("tick", { f: 1200, min: 0.04 });
              if (ctx.diagram) ctx.diagram.pulse("alu", "eth", "#ef4444");
              drawAltoDiagMonitor();
              syncStats();
            }),
          ),
          q(
            "div",
            { class: "row" },
            st(
              [
                ["XOR", "BitBLT Mode: S XOR D (Reversible Cursor/Highlight)"],
                ["SRC", "BitBLT Mode: S (Opaque Source Copy)"],
                ["OR", "BitBLT Mode: S OR D (Transparent Ink Paint)"],
                ["AND", "BitBLT Mode: S AND D (Clip Masking)"],
                ["INVERT", "BitBLT Mode: NOT D (Selection Invert)"],
              ],
              sim.rasterOp,
              (val) => {
                sim.rasterOp = val;
                sim.composeDesktop();
                drawPortraitCrt();
                syncStats();
              },
            ),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, _t, ctx) {
      if (platterMesh) platterMesh.rotation.y += dt * 16;
      if (running) {
        stepAcc += dt * 2.2;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("mse", "alu", "#fbbf24");
            ctx.diagram.pulse("alu", "blt", "#38bdf8");
            ctx.diagram.pulse("alu", "eth", "#eab308");
          }
          drawPortraitCrt();
          drawAltoDiagMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const x = new XeroxAltoSystem();
      const before = Uint8Array.from(x.vram);
      const mask = new Uint8Array(16).fill(1);
      x.bitblt(mask, 4, 4, 12, 12, 8, 8, "XOR");
      x.bitblt(mask, 4, 4, 12, 12, 8, 8, "XOR");
      let same = true;
      for (let i = 0; i < before.length; i++) {
        if (before[i] !== x.vram[i]) {
          same = false;
          break;
        }
      }
      return { ok: same && x.bitbltOps > 2, bitbltOps: x.bitbltOps };
    },
  };
  return machine;
}

function makeMachineArm07() {
  const sim = new MobileArmSoc();
  let running = true;
  let stepAcc = 0;
  let phoneSurf = null;
  let mon = null;
  let touchRings = [];
  let statsUi = null;

  function drawPhoneOled() {
    if (!phoneSurf) return;
    const c = phoneSurf.ctx;
    const W = 512,
      H = 896;
    c.fillStyle = "#070d19";
    c.fillRect(0, 0, W, H);

    // Status bar
    c.fillStyle = "#94a3b8";
    c.font = '700 18px "JetBrains Mono", monospace';
    c.fillText(`ARM RISC SoC · ${sim.governor.toUpperCase()}`, 26, 38);
    c.fillStyle = "#34d399";
    c.fillText(`${sim.totalPowerW.toFixed(2)}W`, W - 110, 38);

    // Mutual-Capacitance 12x8 Multi-Touch Delta-C Heatmap + Pinch-Zoom Geometry!
    const gx = 28,
      gy = 64,
      gw = W - 56,
      gh = 440;
    c.fillStyle = "#0c1628";
    c.fillRect(gx, gy, gw, gh);
    const cw = gw / sim.touchCols;
    const ch = gh / sim.touchRows;
    for (let r = 0; r < sim.touchRows; r++) {
      for (let col = 0; col < sim.touchCols; col++) {
        const dc = Math.min(1, sim.touchGrid[r * sim.touchCols + col]);
        c.fillStyle =
          dc > 0.15
            ? `rgba(56, 189, 248, ${(0.18 + dc * 0.78).toFixed(2)})`
            : "rgba(30, 41, 59, 0.38)";
        c.fillRect(gx + col * cw + 2, gy + r * ch + 2, cw - 4, ch - 4);
      }
    }

    // Pinch-zoomed vector card rendered by TBDR Tile GPU!
    const cx = W * 0.5;
    const cy = gy + gh * 0.5;
    const rad = 68 * sim.pinchZoom;
    c.strokeStyle = "#fde047";
    c.lineWidth = 4;
    c.beginPath();
    c.arc(cx, cy, rad, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = "#f8fafc";
    c.font = '700 18px "JetBrains Mono", monospace';
    c.textAlign = "center";
    c.fillText(`Multi-Touch Pinch ${sim.pinchZoom.toFixed(2)}×`, cx, cy + 6);
    c.textAlign = "left";

    // Bottom SoC Core Activity Cards
    c.fillStyle = "#0f1c32";
    c.fillRect(28, 530, W - 56, 330);
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.strokeRect(28, 530, W - 56, 330);
    c.fillStyle = "#7dd3fc";
    c.font = '700 19px "JetBrains Mono", monospace';
    c.fillText(`big.LITTLE + TBDR TILE GPU`, 46, 568);
    c.fillStyle = "#e2e8f0";
    c.font = '600 17px "JetBrains Mono", monospace';
    c.fillText(
      `Perf OoO Cores: ${sim.activeBig}/2 @ ${sim.bigFreqGHz} GHz (${sim.bigVolt}V)`,
      46,
      614,
    );
    c.fillText(
      `Eff In-Order:   ${sim.activeLit}/4 @ ${sim.litFreqGHz} GHz (${sim.litVolt}V)`,
      46,
      652,
    );
    c.fillText(`Throughput:     ${sim.bips} BIPS (${sim.pjPerInst} pJ/inst)`, 46, 690);
    c.fillStyle = sim.tbdrEnabled ? "#34d399" : "#f87171";
    c.fillText(
      `GPU Mode:       ${sim.tbdrEnabled ? "TBDR On-Chip SRAM" : "Immediate DRAM"}`,
      46,
      732,
    );
    c.fillText(`LPDDR Traffic:  ${sim.dramBwGBs} GB/s`, 46, 770);
    c.fillStyle = "#fbbf24";
    c.fillText(`Die Thermal:    ${sim.dieTempC.toFixed(1)} °C`, 46, 812);

    phoneSurf.tex.needsUpdate = true;
  }

  function drawArmMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060b12";
    c.fillRect(0, 0, W, H);

    c.fillStyle = "#0f3b5c";
    c.fillRect(16, 14, W - 32, 52);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `MOBILE ARM RISC SoC · P = C·V²·f + P_leak = ${sim.totalPowerW.toFixed(2)} W · ${sim.pjPerInst} pJ/INST · ${sim.bips} BIPS`,
      28,
      47,
    );

    // Left: big.LITTLE Heterogeneous Core Cluster & CMOS V^2*f Power Breakdown
    c.fillStyle = "#0b1422";
    c.fillRect(20, 82, 492, 400);
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 492, 400);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("HETEROGENEOUS ARM big.LITTLE CLUSTER", 36, 112);

    for (let i = 0; i < 6; i++) {
      const isBig = i < 2;
      const active = isBig ? i < sim.activeBig : i - 2 < sim.activeLit;
      const bx = 38 + (i % 3) * 150;
      const by = 136 + Math.floor(i / 3) * 126;
      c.fillStyle = active
        ? isBig
          ? "rgba(249, 115, 22, 0.28)"
          : "rgba(52, 211, 153, 0.25)"
        : "#0f172a";
      c.fillRect(bx, by, 136, 108);
      c.strokeStyle = active ? (isBig ? "#f97316" : "#34d399") : "#334155";
      c.strokeRect(bx, by, 136, 108);
      c.fillStyle = "#f8fafc";
      c.font = '700 14px "JetBrains Mono", monospace';
      c.fillText(isBig ? `PERF OoO #${i}` : `EFF #${i - 2}`, bx + 12, by + 28);
      c.fillStyle = active ? "#fde047" : "#64748b";
      c.font = '600 13px "JetBrains Mono", monospace';
      c.fillText(
        active ? `${isBig ? sim.bigFreqGHz : sim.litFreqGHz} GHz` : "POWER-GATED",
        bx + 12,
        by + 56,
      );
      c.fillText(
        active ? `${isBig ? sim.bigVolt : sim.litVolt} V` : "0.00 V (0 mW)",
        bx + 12,
        by + 82,
      );
    }
    c.fillStyle = "#cbd5e1";
    c.font = '600 14px "JetBrains Mono", monospace';
    c.fillText(
      `Fixed-length 32-bit ARM RISC decode saves ~40% frontend area/power vs x86!`,
      36,
      442,
    );

    // Right: Tile-Based Deferred Rendering (TBDR) vs Immediate-Mode DRAM Bandwidth
    c.fillStyle = "#0b1422";
    c.fillRect(530, 82, 474, 400);
    c.strokeStyle = "#34d399";
    c.strokeRect(530, 82, 474, 400);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("TBDR ON-CHIP TILE GPU vs DESKTOP IMR", 548, 112);

    const bwCur = sim.dramBwGBs;
    const bwOther = sim.tbdrEnabled
      ? +(bwCur * 3.2).toFixed(1)
      : +(bwCur / 3.2).toFixed(1);
    const tbdrVal = sim.tbdrEnabled ? bwCur : bwOther;
    const imrVal = sim.tbdrEnabled ? bwOther : bwCur;

    c.fillStyle = "#e2e8f0";
    c.font = '600 14px "JetBrains Mono", monospace';
    c.fillText(`TBDR (On-Chip 32×32 SRAM Tile HSR): ${tbdrVal} GB/s`, 548, 168);
    c.fillStyle = "#34d399";
    c.fillRect(548, 182, Math.min(420, tbdrVal * 24), 32);

    c.fillStyle = "#e2e8f0";
    c.fillText(`Immediate-Mode (Off-Chip DRAM Z-Buf): ${imrVal} GB/s`, 548, 256);
    c.fillStyle = "#f97316";
    c.fillRect(548, 270, Math.min(420, imrVal * 24), 32);

    c.fillStyle = "#cbd5e1";
    c.font = '600 14px "JetBrains Mono", monospace';
    c.fillText("Moving 1 bit off-chip to LPDDR costs ~100× more", 548, 356);
    c.fillText("energy than an on-die 64-bit FMA! TBDR resolves", 548, 382);
    c.fillText("depth & blending inside fast on-die SRAM first.", 548, 408);

    // Bottom Summary
    c.fillStyle = "#0b1422";
    c.fillRect(20, 502, W - 40, 240);
    c.strokeStyle = "#fbbf24";
    c.strokeRect(20, 502, W - 40, 240);
    c.fillStyle = "#fde047";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "THE >250 BILLION CHIP REVOLUTION: SYSTEM-ON-CHIP (SoC) HETEROGENEOUS INTEGRATION",
      36,
      536,
    );
    c.fillStyle = "#cbd5e1";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      "• Acorn RISC Machine (Sophie Wilson & Steve Furber, 1985) -> Apple/ARM pocket supercomputers in a 3–5 W passive envelope.",
      36,
      580,
    );
    c.fillText(
      "• Integrates CPU + TBDR GPU + Neural NPU + ISP + Baseband + PoP Unified LPDDR + Mutual-Capacitance ITO Multi-Touch.",
      36,
      620,
    );
    c.fillText(
      "• Scaled up directly from phones to laptop/datacenter silicon (Apple M-series, AWS Graviton, NVIDIA Grace).",
      36,
      660,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "arm07",
    era: "2007",
    short: "Mobile ARM SoC",
    name: "Mobile ARM RISC SoC & Capacitive Multi-Touch Computer",
    view0: 0.18,
    blurb:
      "The 2007+ pocket computing revolution (>250 billion ARM chips shipped): packs heterogeneous big.LITTLE RISC cores, CMOS Dynamic Voltage & Frequency Scaling (P = C·V²·f), Tile-Based Deferred Rendering (TBDR) GPU SRAM tiles, Package-on-Package unified memory, Li-Ion power management, and mutual-capacitance multi-touch into a 4-watt fanless slab.",
    diagram: {
      nodes: [
        { id: "ito", label: "ITO ΔC Multi-Touch", x: 0.16, y: 0.24, color: "#38bdf8" },
        { id: "big", label: "ARM big.LITTLE CPU", x: 0.5, y: 0.26, color: "#f97316" },
        { id: "tbdr", label: "TBDR Tile SRAM GPU", x: 0.84, y: 0.26, color: "#34d399" },
        { id: "pop", label: "Unified PoP LPDDR", x: 0.5, y: 0.78, color: "#c08cff" },
        { id: "pmic", label: "DVFS PMIC + Li-Ion", x: 0.18, y: 0.78, color: "#fbbf24" },
      ],
      edges: [
        ["ito", "big", "120Hz ΔC"],
        ["pmic", "big", "C·V²·f"],
        ["big", "pop", "Zero-Copy"],
        ["tbdr", "pop", "3.2× Less BW"],
      ],
    },
    build(kit) {
      touchRings = [];
      phoneSurf = Bt(512, 896);

      // 1. MACHINED UNIBODY SMARTPHONE / POCKET COMPUTER CUTAWAY ON TILTED INSPECTION STAND (Left)
      const slab = kit.group([-0.72, 0.06, 0.16], {
        rot: [-0.26, 0.2, 0],
        name: "Machined Titanium/Aluminum Unibody Pocket Computer",
        info: "Fanless passive-cooled mobile computer dissipating 1–5 Watts through its CNC-milled chassis frame and graphite heat spreaders.",
      });
      kit.box(
        0.58,
        1.06,
        0.065,
        U.metal(0x647080, 0.28),
        [0, 0.56, 0],
        {
          name: "CNC Anodized Unibody Frame & RF Antenna Bands",
        },
        slab,
      );

      // Pouch Lithium-Ion High-Density Battery Cell (occupies ~60% of internal volume!)
      kit.box(
        0.32,
        0.58,
        0.036,
        U.darkAnodized(0x161b24),
        [-0.08, 0.5, 0.008],
        {
          name: "High-Density Lithium-Ion Pouch Battery (14.8 Wh)",
          info: "Delivers 3.85 V nominal DC to the multi-phase buck PMIC; dictates the strict picojoule-per-instruction mobile architecture budget.",
          live: () =>
            `Draw=${sim.totalPowerW.toFixed(2)}W · T=${sim.dieTempC.toFixed(1)}°C`,
          explode: [-0.26, 0, -0.16],
        },
        slab,
      );

      // Multi-Layer L-Shaped HDI Logic Board + Delidded ARM big.LITTLE SoC Die!
      const hdi = kit.box(
        0.18,
        0.68,
        0.018,
        U.pcb(0x141d2b),
        [0.16, 0.56, 0.012],
        {
          name: "12-Layer Any-Layer Laser-Via HDI Logic Board",
          info: "Ultra-dense substrate packing the ARM SoC, PMIC, NVMe flash, RF transceiver, and MEMS IMU into a fraction of a credit card.",
          explode: [0.22, 0, -0.08],
        },
        slab,
      );

      kit.box(
        0.12,
        0.12,
        0.014,
        U.siliconDie(0xffe4b5),
        [0.16, 0.62, 0.028],
        {
          name: "ARM big.LITTLE RISC System-on-Chip + PoP LPDDR Die",
          info: "Monolithic SoC combining wide Out-of-Order Performance cores, narrow In-Order Efficiency cores, TBDR Tile GPU, Neural Engine, and unified PoP DRAM.",
          live: () => `${sim.bips} BIPS · ${sim.pjPerInst} pJ/inst`,
          explode: [0.28, 0.08, 0.14],
        },
        slab,
      );

      // Taptic Linear Resonant Actuator + Multi-Element Camera Module
      kit.box(
        0.16,
        0.075,
        0.028,
        U.steel(),
        [-0.08, 0.15, 0.012],
        {
          name: "Linear Resonant Haptic Actuator (LRA)",
          info: "Electromagnetic spring-mass voice coil generating crisp sub-millisecond tactile clicks.",
        },
        slab,
      );
      kit.cyl(
        0.055,
        0.055,
        0.036,
        U.darkAnodized(0x0f172a),
        [0.15, 0.92, -0.026],
        {
          rot: [Math.PI / 2, 0, 0],
          name: "Sapphire Computational-Photography CMOS Camera Module",
        },
        slab,
      );

      // Tempered Mutual-Capacitance ITO Multi-Touch OLED Display Assembly (shell: true -> Cutaway reveals battery + SoC!)
      const glassGrp = kit.group(
        [0, 0.56, 0.042],
        {
          shell: true,
          name: "Indium-Tin-Oxide (ITO) Mutual-Capacitance Multi-Touch OLED Glass",
          info: "Transparent row/column diamond ITO electrodes measure femtofarad mutual-capacitance drops (ΔC) at every X×Y intersection to track 10 simultaneous fingers.",
          explode: [0, 0, 0.34],
        },
        slab,
      );
      kit.box(
        0.54,
        1.0,
        0.012,
        U.glass(0xdbeafe, 0.2),
        [0, 0, 0],
        { shell: true },
        glassGrp,
      );
      kit.mesh(
        new mt(0.5, 0.92),
        U.screen(phoneSurf.tex),
        [0, 0, 0.008],
        {
          shell: true,
        },
        glassGrp,
      );

      // 2 Glowing Capacitive Finger Contact Telemetry Halos on screen surface
      for (let f = 0; f < 2; f++) {
        const tr = kit.torus(
          0.036,
          0.005,
          U.glow(0x38bdf8, 1.8),
          [0, 0, 0.015],
          {
            name: `Capacitive Touch Centroid #${f + 1}`,
          },
          glassGrp,
        );
        touchRings.push(tr);
      }

      // 2. RIGHT TELEMETRY CONSOLE (facing +Z!)
      mon = buildMonitor3D(kit, [0.58, 0.64, -0.06], {
        w: 0.96,
        h: 0.64,
        rot: [0, -0.08, 0],
        name: "ARM big.LITTLE DVFS & TBDR Bandwidth Analyzer",
        explode: [0.36, 0, 0],
      });
      kit.box(1.04, 0.64, 0.54, U.darkAnodized(0x111926), [0.58, 0.32, -0.06], {
        rot: [0, -0.08, 0],
      });

      drawPhoneOled();
      drawArmMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("gov", sim.governor.toUpperCase());
        statsUi.set(
          "pwr",
          `${sim.totalPowerW.toFixed(2)} W (${sim.dieTempC.toFixed(1)}°C)`,
        );
        statsUi.set("epi", `${sim.pjPerInst} pJ / inst`);
        statsUi.set("bips", `${sim.bips} BIPS`);
        statsUi.set("bw", `${sim.dramBwGBs} GB/s (${sim.tbdrEnabled ? "TBDR" : "IMR"})`);
        statsUi.set("pinch", `${sim.pinchZoom.toFixed(2)}× (2 Fingers)`);
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      const tbdrBtn = Fe(
        "GPU: TBDR Tile SRAM ✓",
        () => {
          sim.tbdrEnabled = !sim.tbdrEnabled;
          tbdrBtn.textContent = sim.tbdrEnabled
            ? "GPU: TBDR Tile SRAM ✓"
            : "GPU: Desktop Immediate DRAM";
          sim.recomputeSoCTelemetry();
          if (ctx.diagram)
            ctx.diagram.pulse("tbdr", "pop", sim.tbdrEnabled ? "#34d399" : "#ef4444");
          drawPhoneOled();
          drawArmMonitor();
          syncStats();
        },
        "pri",
      );

      statsUi = Pt([
        ["gov", "DVFS Governor"],
        ["pwr", "SoC Power (C·V²·f)"],
        ["epi", "Energy / Instr"],
        ["bips", "ARM Throughput"],
        ["bw", "LPDDR Bandwidth"],
        ["pinch", "ITO Multi-Touch"],
      ]);

      el.append(
        Ie(
          "ARM big.LITTLE Scheduler, CMOS DVFS (P = C·V²·f) & TBDR Tile GPU",
          q(
            "div",
            { class: "row" },
            runBtn,
            tbdrBtn,
            st(
              [
                ["schedutil", "Governor: Energy-Aware big.LITTLE (schedutil)"],
                ["powersave", "Governor: LITTLE Efficiency Cores Only (powersave)"],
                ["performance", "Governor: Max All-Core Boost (performance)"],
              ],
              sim.governor,
              (val) => {
                sim.setGovernor(val);
                if (ctx.diagram) ctx.diagram.pulse("pmic", "big", "#fbbf24");
                drawPhoneOled();
                drawArmMonitor();
                syncStats();
              },
            ),
          ),
          We(
            "Interactive Workload Intensity",
            0.1,
            1.0,
            0.05,
            sim.workload,
            (v) => {
              sim.workload = v;
              sim.recomputeSoCTelemetry();
              drawPhoneOled();
              drawArmMonitor();
              syncStats();
            },
            (v) => `${Math.round(v * 100)}%`,
          ),
          We(
            "2-Finger Capacitive Pinch Spread",
            2.2,
            9.6,
            0.2,
            4.8,
            (v) => {
              sim.setPinchSpread(v);
              if (ctx.diagram) ctx.diagram.pulse("ito", "big", "#38bdf8");
              drawPhoneOled();
              syncStats();
            },
            (v) => `${sim.pinchZoom.toFixed(2)}×`,
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, _t, ctx) {
      if (running) {
        stepAcc += dt * 3.0;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step(0.12);
          if (ctx.diagram) {
            ctx.diagram.pulse("ito", "big", "#38bdf8");
            ctx.diagram.pulse("pmic", "big", "#fbbf24");
            ctx.diagram.pulse("tbdr", "pop", "#34d399");
          }
          drawPhoneOled();
          drawArmMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      touchRings.forEach((tr, idx) => {
        const f = sim.fingers[idx];
        tr.position.x = (f.x / 11 - 0.5) * 0.42;
        tr.position.y = 0.22 - (f.y / 7 - 0.5) * 0.36;
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const m = new MobileArmSoc();
      m.setGovernor("powersave");
      const pLo = m.totalPowerW;
      m.setGovernor("performance");
      return { ok: m.totalPowerW > pLo * 2 && m.bips > 5, bips: m.bips };
    },
  };
  return machine;
}
