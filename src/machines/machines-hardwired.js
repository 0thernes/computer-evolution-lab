// Circle I — Hard-Wired, Symbolic & Wafer-Scale Architectural Milestones (v5.0.0):
//   eniac46 (1946)          : UPenn ENIAC Electronic Numerical Integrator & Computer (Hard-wired coax plugboards + 10-digit vacuum-tube decade rings)
//   lisp83  (1983)          : Symbolics 3600 / MIT CADR LISP Machine (36-bit hardware-tagged words, CDR-coding compaction & ephemeral copying GC)
//   wse24   (2024) [center] : 300 mm Monolithic Wafer-Scale Dataflow & Neuromorphic Engine (84 stitched reticles, 44 GB SRAM, LIF STDP + spare bypass)

function makeMachineEniac46() {
  const sim = new EniacPlugboardEngine();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let ringNeonMeshes = [];
  let cordMeshes = [];
  let tubeFilaments = [];
  let dragDial = null;
  let statsUi = null;

  function drawEniacScope() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060b09";
    c.fillRect(0, 0, W, H);

    // Header banner
    c.fillStyle = "#1f2937";
    c.fillRect(16, 14, W - 32, 52);
    c.fillStyle = "#f59e0b";
    c.fillRect(16, 14, 248, 52);
    c.fillStyle = "#0b0f14";
    c.font = '800 20px "JetBrains Mono", monospace';
    c.fillText("1946 UPENN ENIAC", 28, 47);
    c.fillStyle = "#fde68a";
    c.font = '700 17px "JetBrains Mono", monospace';
    c.fillText(
      `100 kHz RING PULSE · STEP #${sim.masterStep} · ADD CYCLES=${sim.additionCycles} · 17,468 TUBES`,
      278,
      46,
    );

    // Left: Live P1 Green Ballistic / Sequence Oscilloscope Plot
    c.fillStyle = "#04140d";
    c.fillRect(20, 82, 540, 396);
    c.strokeStyle = "#22c55e";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 540, 396);
    // Subtle oscilloscope graticule
    c.strokeStyle = "rgba(34, 197, 94, 0.16)";
    c.lineWidth = 1;
    for (let gx = 74; gx < 560; gx += 54) {
      c.beginPath();
      c.moveTo(gx, 82);
      c.lineTo(gx, 478);
      c.stroke();
    }
    for (let gy = 132; gy < 478; gy += 50) {
      c.beginPath();
      c.moveTo(20, gy);
      c.lineTo(560, gy);
      c.stroke();
    }

    c.fillStyle = "#86efac";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText(
      sim.mode === "ballistic"
        ? `BALLISTIC TRAJECTORY (Elev=${sim.elevationDeg} deg, V0=${sim.muzzleVelMps} m/s)`
        : `RING CASCADE TRACE (${sim.presetName.slice(0, 34)})`,
      34,
      110,
    );

    const pts = sim.trajectory;
    if (pts.length > 1) {
      let maxX = 1;
      let maxY = 1;
      for (const p of pts) {
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      if (sim.mode === "ballistic") {
        maxX = Math.max(maxX, 16000);
        maxY = Math.max(maxY, 7500);
      }
      c.strokeStyle = "#4ade80";
      c.lineWidth = 3.2;
      c.beginPath();
      pts.forEach((p, idx) => {
        const px = 42 + (p.x / maxX) * 494;
        const py = 452 - (p.y / maxY) * 314;
        if (idx === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      });
      c.stroke();

      const head = pts[pts.length - 1];
      const hx = 42 + (head.x / maxX) * 494;
      const hy = 452 - (head.y / maxY) * 314;
      c.fillStyle = "#fde047";
      c.beginPath();
      c.arc(hx, hy, 6, 0, Math.PI * 2);
      c.fill();
    }

    // Right: 6x 10-Digit Signed Decade Ring Counter Accumulators
    c.fillStyle = "#0d131c";
    c.fillRect(576, 82, 428, 396);
    c.strokeStyle = "#f59e0b";
    c.lineWidth = 2;
    c.strokeRect(576, 82, 428, 396);
    c.fillStyle = "#fcd34d";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText("6x 10-DIGIT DECADE RING ACCUMULATORS", 592, 110);

    sim.acc.forEach((a, idx) => {
      const ay = 126 + idx * 56;
      c.fillStyle = "#161f2e";
      c.fillRect(590, ay, 400, 46);
      c.fillStyle = "#94a3b8";
      c.font = '600 13px "JetBrains Mono", monospace';
      c.fillText(`${a.id} [${a.role}]`, 600, ay + 18);
      c.fillStyle = "#fbbf24";
      c.font = '700 18px "JetBrains Mono", monospace';
      c.fillText(sim.formatAccumulator(idx), 788, ay + 30);
      // Carry indicator dots
      for (let d = 0; d < 10; d++) {
        const lit = (a.carryMask >>> (9 - d)) & 1;
        c.fillStyle = lit ? "#ef4444" : "#334155";
        c.fillRect(600 + d * 14, ay + 28, 9, 9);
      }
    });

    // Bottom: Active Coaxial CPP & Digit Trunk Patchboard Routing Matrix
    c.fillStyle = "#0d131c";
    c.fillRect(20, 494, W - 40, 254);
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.strokeRect(20, 494, W - 40, 254);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "HARD-WIRED COAXIAL PLUGBOARD TRUNKS (CPP CONTROL & 11-WIRE DIGIT BUSES)",
      36,
      524,
    );

    sim.cords.forEach((cord, idx) => {
      const cy = 542 + idx * 34;
      c.fillStyle = cord.enabled ? "rgba(56, 189, 248, 0.16)" : "rgba(127, 29, 29, 0.22)";
      c.fillRect(36, cy, W - 72, 28);
      c.fillStyle = cord.enabled ? "#34d399" : "#f87171";
      c.font = '700 14px "JetBrains Mono", monospace';
      c.fillText(
        `${cord.enabled ? "[PATCHED]" : "[UNPLUG ]"} ${cord.id.padEnd(6)} ${cord.from.padEnd(11)} ---> ${cord.to.padEnd(12)} (${cord.trunk}) · ${cord.label}`,
        48,
        cy + 19,
      );
    });
    c.fillStyle = "#fde047";
    c.font = '700 14px "JetBrains Mono", monospace';
    c.fillText(`IBM 80-COL CARD PUNCH OUTPUT: ${sim.lastCard}`, 36, 732);

    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "eniac46",
    era: "1946",
    short: "ENIAC Plugboard",
    name: "UPenn ENIAC (Hard-Wired Vacuum-Tube Digital Integrator)",
    view0: 0.42,
    blurb:
      "Completed by J. Presper Eckert, John Mauchly, and the six ENIAC Women Programmers (Jean Jennings Bartik, Betty Holberton, Marlyn Meltzer, Kathleen Antonelli, Ruth Teitelbaum, Frances Spence) at UPenn: the first Turing-complete electronic general-purpose digital computer used 17,468 vacuum tubes, 20 signed 10-digit decade ring-counter accumulators, resistor-matrix Function Tables, and coaxial CPP/Digit plugboards computing supersonic artillery trajectories 1,000× faster than electromechanical analyzers.",
    diagram: {
      nodes: [
        { id: "mp", label: "Master Programmer", x: 0.18, y: 0.22, color: "#f59e0b" },
        { id: "fta", label: "Function Table A", x: 0.5, y: 0.18, color: "#38bdf8" },
        { id: "acc", label: "Decade Ring ACC1–6", x: 0.5, y: 0.54, color: "#fbbf24" },
        { id: "bus", label: "Coax CPP/Digit Trunks", x: 0.22, y: 0.82, color: "#34d399" },
        { id: "io", label: "IBM Card Punch/Scope", x: 0.82, y: 0.72, color: "#c08cff" },
      ],
      edges: [
        ["mp", "fta", "CPP Pulse"],
        ["fta", "acc", "Mach Drag G(v)"],
        ["bus", "acc", "11-Wire Trunk"],
        ["acc", "io", "80-Col Punch"],
      ],
    },
    build(kit) {
      ringNeonMeshes = [];
      cordMeshes = [];
      tubeFilaments = [];

      // 1. U-SHAPED MOORE SCHOOL ACCUMULATOR BAY (3 Tall Black Wrinkle-Steel Panels)
      const bay = kit.group([-0.32, 0, -0.14], {
        name: "ENIAC U-Bay Decade-Ring Accumulator Racks",
        info: "Heavy rolled-steel cabinets housing 6SN7 twin-triode 10-stage decade ring counters, PM sign flip-flops, neon digit matrices, and lower coaxial program trays.",
      });

      // Top forced-air ventilation header duct (shell: true so Cutaway exposes internal vacuum tubes!)
      kit.box(
        2.16,
        0.18,
        0.56,
        U.darkAnodized(0x1f242c),
        [0, 1.98, 0],
        {
          shell: true,
          name: "24 kW Forced-Air Blower Header Duct",
          info: "Extracts 150 kW of thermionic cathode and plate heat from the 40 panel bays.",
          explode: [0, 0.38, 0],
        },
        bay,
      );

      for (let p = 0; p < 3; p++) {
        const px = -0.68 + p * 0.68;
        const cab = kit.group(
          [px, 0, 0],
          {
            name: `Accumulator Cabinet Bay #${p + 1} (ACC${p * 2 + 1} & ACC${p * 2 + 2})`,
            info: "Each accumulator stores a signed 10-digit decimal integer in ten 10-stage 6SN7 flip-flop rings pulsing at 100 kHz (200 microseconds per 10-digit addition).",
            live: () =>
              `ACC${p * 2 + 1}=${sim.formatAccumulator(p * 2)} · ACC${p * 2 + 2}=${sim.formatAccumulator(p * 2 + 1)}`,
          },
          bay,
        );
        // Cabinet frame + removable rear maintenance shroud (shell: true)
        kit.box(0.64, 1.88, 0.44, U.darkAnodized(0x181c22), [0, 0.94, -0.02], {}, cab);
        kit.box(
          0.62,
          1.82,
          0.06,
          U.perfMesh(0x202630),
          [0, 0.94, -0.25],
          {
            shell: true,
            name: `Rear Perforated Tube Inspection Door #${p + 1}`,
            explode: [0, 0, -0.45],
          },
          cab,
        );

        // Upper translucent decade neon lamp window: 10 columns x 5 rows of glowing neon bulbs!
        const bezel = kit.box(
          0.56,
          0.46,
          0.03,
          U.metal(0x2c323c, 0.42),
          [0, 1.54, 0.21],
          {
            name: `Decade Neon Readout Matrix (ACC${p * 2 + 1})`,
            info: "NE-2 neon glow lamps wired directly to each stage of the 10-tube decimal ring counters.",
            explode: [0, 0.14, 0.28],
          },
          cab,
        );
        const colBulbs = [];
        for (let col = 0; col < 10; col++) {
          const bulbsInCol = [];
          for (let row = 0; row < 5; row++) {
            const bulb = kit.sphere(
              0.0085,
              U.led(0xff8c24),
              [-0.225 + col * 0.05, -0.15 + row * 0.075, 0.02],
              {},
              bezel,
            );
            bulbsInCol.push(bulb);
          }
          colBulbs.push(bulbsInCol);
        }
        ringNeonMeshes.push(colBulbs);

        // Middle Repeat-Count & Operation Rotary Switches (Clear/Add/Subtract A, S)
        for (let k = 0; k < 4; k++) {
          Om(
            kit,
            [-0.2 + k * 0.13, 1.12, 0.21],
            {
              r: 0.036,
              name: `Program Repeat & Clear-Correct Switch #${k + 1}`,
              info: "Selects Receive (α..ε) or Transmit (A, S) mode and repeat count (1..9) on receipt of a CPP pulse.",
            },
            cab,
          );
          Ba(kit, [-0.2 + k * 0.13, 0.98, 0.21], {}, cab);
        }

        // Exposed Interior Thermionic Vacuum Tube Shelf (visible on cutaway / rear orbit!)
        const shelf = kit.box(
          0.54,
          0.02,
          0.32,
          U.steel(),
          [0, 0.56, -0.02],
          {
            name: `6SN7/6L6 Octal Vacuum-Tube Plug-In Chassis #${p + 1}`,
            explode: [0, 0, -0.28],
          },
          cab,
        );
        for (let tx = 0; tx < 4; tx++) {
          for (let tz = 0; tz < 2; tz++) {
            const tube = Lc(
              kit,
              [-0.18 + tx * 0.12, 0.01, -0.08 + tz * 0.14],
              { scale: 0.56 },
              shelf,
            );
            if (tube.userData.filament) tubeFilaments.push(tube.userData.filament);
          }
        }
      }

      // Horizontal 11-Wire Digit Trunk & CPP Coaxial Bus Trays + Patch Cords across front of all 3 bays!
      const tray = kit.box(
        2.06,
        0.14,
        0.09,
        U.metal(0x303640, 0.36),
        [0, 0.72, 0.24],
        {
          name: "Hard-Wired CPP & 11-Wire Digit Trunk Coaxial Tray",
          info: "Carries 100 kHz digit pulse trains (ten 1P pulses + sign + carry) and Central Programming Pulses (CPP) between accumulators.",
          explode: [0, -0.14, 0.36],
        },
        bay,
      );
      for (let j = 0; j < 18; j++) {
        kit.cyl(
          0.011,
          0.011,
          0.026,
          U.brass(),
          [-0.92 + j * 0.108, 0, 0.05],
          { rot: [Math.PI / 2, 0, 0] },
          tray,
        );
      }

      const cordColors = [0xd97706, 0x0284c7, 0x16a34a, 0xdc2626, 0x9333ea];
      const cordSpans = [
        [
          [-0.92, 0.74, 0.29],
          [-0.45, 0.5, 0.42],
          [0.05, 0.74, 0.29],
        ],
        [
          [-0.7, 0.7, 0.29],
          [-0.12, 0.44, 0.45],
          [0.48, 0.7, 0.29],
        ],
        [
          [-0.36, 0.74, 0.29],
          [0.24, 0.52, 0.43],
          [0.82, 0.74, 0.29],
        ],
        [
          [-0.84, 0.68, 0.29],
          [0.0, 0.38, 0.48],
          [0.92, 0.68, 0.29],
        ],
        [
          [0.12, 0.72, 0.29],
          [0.52, 0.48, 0.44],
          [0.94, 0.72, 0.29],
        ],
      ];
      cordSpans.forEach((pts, idx) => {
        const cord = kit.tube(
          pts,
          0.011,
          U.plastic(cordColors[idx], 0.42),
          {
            name: `Coaxial Program/Digit Patch Cord ${sim.cords[idx]?.id || idx + 1}`,
            info: sim.cords[idx]?.label || "Coaxial hard-wired trunk jumper.",
            explode: [0, -0.18, 0.46],
          },
          bay,
        );
        cordMeshes.push(cord);
      });

      // 2. PORTABLE FUNCTION TABLE A MATRIX STAND (Front-Left)
      const ftStand = kit.group([-1.18, 0, 0.58], {
        rot: [0, 0.38, 0],
        name: "Portable Function Table A (104-Entry Resistor ROM)",
        info: "Hand-set 104x12 rotary switch matrix storing empirical supersonic ballistic drag G(v) values read out in 1 addition time.",
        explode: [-0.42, 0, 0.32],
      });
      kit.box(0.58, 1.32, 0.08, U.darkAnodized(0x20252d), [0, 0.76, 0], {}, ftStand);
      kit.box(0.58, 0.06, 0.42, U.steel(), [0, 0.03, 0], {}, ftStand);
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          kit.cyl(
            0.013,
            0.015,
            0.022,
            U.bakelite(),
            [-0.2 + c * 0.08, 0.46 + r * 0.13, 0.05],
            { rot: [Math.PI / 2, 0, 0] },
            ftStand,
          );
        }
      }
      dragDial = buildAnalogMeter(
        kit,
        [0, 1.28, 0.05],
        { r: 0.08, unit: "MACH G(v)", initial: 0.45 },
        ftStand,
      );

      // 3. BALLISTIC OSCILLOSCOPE & IBM CARD CONSOLE (Right)
      mon = buildMonitor3D(kit, [1.14, 0.58, 0.24], {
        crt: true,
        w: 0.88,
        h: 0.66,
        color: 0x343942,
        rot: [0, -0.34, 0],
        name: "Aberdeen Ballistic Oscilloscope & Accumulator Readout",
        explode: [0.42, 0, 0.22],
      });
      kit.box(1.06, 0.58, 0.66, U.metal(0x2a2f38, 0.48), [1.14, 0.29, 0.24], {
        rot: [0, -0.34, 0],
        name: "IBM 80-Column Summary Card Punch Unit",
        info: "Punches computed range/altitude firing tables onto standard 80-column Hollerith cards at 100 cards/minute.",
      });

      drawEniacScope();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("mode", sim.presetName.split(" ")[0]);
        statsUi.set("acc1", `${sim.acc[0].role}: ${sim.acc[0].value}`);
        statsUi.set("acc2", `${sim.acc[1].role}: ${sim.acc[1].value}`);
        statsUi.set("acc3", `${sim.acc[2].role}: ${sim.acc[2].value}`);
        statsUi.set("add", `${sim.additionCycles} cycles (5k/s)`);
        statsUi.set("pwr", `${sim.powerKw.toFixed(0)} kW · 17,468 tubes`);
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      const cordBtns = sim.cords.map((c, idx) => {
        const b = Fe(
          `${c.enabled ? "🔌" : "❌"} ${c.id}`,
          () => {
            const on = sim.toggleCord(idx);
            b.textContent = `${on ? "🔌" : "❌"} ${sim.cords[idx].id}`;
            hi("toggle");
            if (cordMeshes[idx]) cordMeshes[idx].visible = on;
            drawEniacScope();
            syncStats();
          },
          c.enabled ? "pri" : "",
        );
        return b;
      });

      statsUi = Pt([
        ["mode", "Plugboard Setup"],
        ["acc1", "Accumulator 1"],
        ["acc2", "Accumulator 2"],
        ["acc3", "Accumulator 3"],
        ["add", "100 kHz Ring"],
        ["pwr", "Thermionic Load"],
      ]);

      el.append(
        Ie(
          "ENIAC Coaxial Plugboard & 10-Digit Ring Accumulators",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step 200 µs Add", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.step();
              hi("clock", { min: 0.04 });
              if (ctx.diagram) {
                ctx.diagram.pulse("mp", "fta", "#f59e0b");
                ctx.diagram.pulse("fta", "acc", "#38bdf8");
                ctx.diagram.pulse("acc", "io", "#c08cff");
              }
              drawEniacScope();
              syncStats();
            }),
          ),
          q(
            "div",
            { class: "row" },
            st(
              sim.presetNames.map((n) => [n, n]),
              sim.presetName,
              (val) => {
                sim.loadPreset(val);
                cordBtns.forEach((btn, i) => {
                  btn.textContent = `${sim.cords[i].enabled ? "🔌" : "❌"} ${sim.cords[i].id}`;
                  if (cordMeshes[i]) cordMeshes[i].visible = sim.cords[i].enabled;
                });
                hi("switch");
                drawEniacScope();
                syncStats();
              },
            ),
          ),
          We(
            "Artillery Gun Elevation Angle (Ballistic Mode)",
            15,
            75,
            1,
            sim.elevationDeg,
            (v) => {
              sim.setElevationDeg(v);
              drawEniacScope();
              syncStats();
            },
            (v) => `${v}°`,
          ),
          q("div", { class: "row" }, ...cordBtns),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 7.5;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("mp", "fta", "#f59e0b");
            ctx.diagram.pulse("bus", "acc", "#34d399");
            if (sim.masterStep % 2 === 0) ctx.diagram.pulse("acc", "io", "#c08cff");
          }
          drawEniacScope();
          if (machine._syncStats) machine._syncStats();
        }
      }
      // Update 3D neon decade matrices from actual ring digits!
      ringNeonMeshes.forEach((colBulbs, bayIdx) => {
        const accObj = sim.acc[bayIdx * 2];
        if (!accObj) return;
        for (let col = 0; col < 10; col++) {
          const dig = accObj.digits[9 - col];
          const activeRow = Math.floor(dig / 2);
          for (let row = 0; row < 5; row++) {
            colBulbs[col][row].material.emissiveIntensity =
              row === activeRow ? 2.1 : 0.07;
          }
        }
      });
      tubeFilaments.forEach((f, idx) => {
        f.material.emissiveIntensity = 0.95 + 0.25 * Math.sin(t * 9 + idx);
      });
      if (dragDial && dragDial.userData.setVal) {
        dragDial.userData.setVal(Math.min(1, (sim.acc[4]?.value || 0) / 35000));
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const e = new EniacPlugboardEngine();
      for (let i = 0; i < 20; i++) e.step();
      const ballisticOk = e.acc[0].value > 0 && e.trajectory.length > 10;
      e.loadPreset("Hard-Wired 10-Digit Fibonacci Ring Cascade");
      for (let i = 0; i < 6; i++) e.step();
      return {
        ok: ballisticOk && e.acc[2].value === 21,
        fib9: e.acc[2].value,
      };
    },
  };
  return machine;
}

// ============================================================================
// SYMBOLICS 3600 / MIT CADR HARDWARE-TAGGED LISP MACHINE (1983, lisp83)
// ============================================================================
function makeMachineLisp83() {
  const sim = new SymbolicsLispMachine();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let tagLeds = [];
  let statsUi = null;

  function drawGeneraConsole() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 896,
      H = 1024; // Tall portrait high-DPI bitmap display!
    // Authentic crisp white-paper Genera Dynamic Windows look with dark framing so 0% HDR clip!
    c.fillStyle = "#0b111c";
    c.fillRect(0, 0, W, H);

    // Genera Title Bar
    c.fillStyle = "#1e3a8a";
    c.fillRect(16, 14, W - 32, 54);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(`SYMBOLICS GENERA 7.2 · 36-BIT TAGGED LISP · GC#${sim.gcCycles}`, 28, 48);

    // Top Pane: Zmacs / Lisp Listener Window
    c.fillStyle = "#111927";
    c.fillRect(20, 84, W - 40, 356);
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.strokeRect(20, 84, W - 40, 356);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("DYNAMIC LISP LISTENER (HARDWARE TAG-CHECKED EVAL)", 36, 114);

    const srcLines = String(sim.src).split(/\r?\n/).slice(0, 8);
    c.fillStyle = "#cbd5e1";
    c.font = '500 14px "JetBrains Mono", monospace';
    srcLines.forEach((ln, idx) => {
      c.fillText(ln.slice(0, 68), 36, 146 + idx * 24);
    });
    c.fillStyle = "#fde047";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(`=> ${String(sim.lastOutput).slice(0, 62)}`, 36, 366);
    c.fillStyle = "#34d399";
    c.font = '600 14px "JetBrains Mono", monospace';
    c.fillText(
      `36-Bit Result Word: ${sim.encodeWord36Hex(sim.lastResultWord)}  [TagChecks=${sim.tagChecks}]`,
      36,
      404,
    );

    // Middle Pane: 36-Bit Hardware Word Bit-Field Anatomy ([35:34] CDR | [33:30] DTP | [29:0] Ptr/Fixnum)
    c.fillStyle = "#111927";
    c.fillRect(20, 456, W - 40, 224);
    c.strokeStyle = "#f59e0b";
    c.strokeRect(20, 456, W - 40, 224);
    c.fillStyle = "#fcd34d";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("36-BIT HARDWARE WORD ANATOMY & PARALLEL CDR-CODING", 36, 486);

    // Draw the 3 bitfields proportionally
    const fields = [
      { x: 38, w: 120, col: "#c084fc", title: "[35:34] CDR", sub: "0=NORM 1=NEXT 2=NIL" },
      {
        x: 166,
        w: 180,
        col: "#fbbf24",
        title: "[33:30] DTP TAG",
        sub: "CONS/FIX/SYM/CLOS",
      },
      {
        x: 354,
        w: 500,
        col: "#38bdf8",
        title: "[29:0] 30-BIT PAYLOAD",
        sub: "Signed Fixnum or Heap VMA",
      },
    ];
    fields.forEach((f) => {
      c.fillStyle = "rgba(15, 23, 42, 0.9)";
      c.fillRect(f.x, 504, f.w, 82);
      c.strokeStyle = f.col;
      c.lineWidth = 2.5;
      c.strokeRect(f.x, 504, f.w, 82);
      c.fillStyle = f.col;
      c.font = '700 15px "JetBrains Mono", monospace';
      c.fillText(f.title, f.x + 12, 534);
      c.fillStyle = "#e2e8f0";
      c.font = '500 12.5px "JetBrains Mono", monospace';
      c.fillText(f.sub, f.x + 12, 564);
    });
    c.fillStyle = "#a7f3d0";
    c.font = '600 14px "JetBrains Mono", monospace';
    c.fillText(
      `CDR-Coding Saved: ${sim.cdrWordsSaved} 36-bit words (50% list compaction via CDR_NEXT/CDR_NIL!)`,
      38,
      622,
    );
    c.fillStyle = "#94a3b8";
    c.fillText(
      "ALU + Tag Comparator run in parallel in 1 microcycle; mismatch traps to microcode!",
      38,
      654,
    );

    // Bottom Pane: Live FromSpace / ToSpace Ephemeral Cheney Copying GC Map
    c.fillStyle = "#111927";
    c.fillRect(20, 696, W - 40, 304);
    c.strokeStyle = "#34d399";
    c.lineWidth = 2;
    c.strokeRect(20, 696, W - 40, 304);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      `EPHEMERAL TWO-SPACE COPYING GC (Live=${sim.liveWords}w · Reclaimed=${sim.lastReclaimed}w)`,
      36,
      726,
    );

    // Visualize first 64 heap words of active FromSpace color-coded by CDR-code & tag
    for (let i = 0; i < 64; i++) {
      const cell = sim.heap[sim.fromBase + i];
      const gx = 38 + (i % 16) * 51;
      const gy = 746 + Math.floor(i / 16) * 44;
      const allocated = i < sim.freePtr - sim.fromBase;
      c.fillStyle = !allocated
        ? "#1e293b"
        : cell.cdrCode === 1
          ? "#7c3aed"
          : cell.cdrCode === 2
            ? "#0284c7"
            : "#d97706";
      c.fillRect(gx, gy, 45, 36);
      c.fillStyle = "#f8fafc";
      c.font = '700 11px "JetBrains Mono", monospace';
      c.fillText(allocated ? `T${cell.tag}C${cell.cdrCode}` : "FREE", gx + 5, gy + 22);
    }
    c.fillStyle = "#cbd5e1";
    c.font = '600 13px "JetBrains Mono", monospace';
    c.fillText(
      "Legend: [Purple]=CDR_NEXT  [Cyan]=CDR_NIL  [Amber]=CDR_NORMAL  [Slate]=Free Nursery",
      38,
      952,
    );
    c.fillStyle = "#fde047";
    c.fillText(
      "Space-Cadet Modifiers: [CTRL] [META] [SUPER] [HYPER] [GREEK] [TOP] -> 8,000+ Chords",
      38,
      980,
    );

    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "lisp83",
    era: "1983",
    short: "Symbolics 3600 LISP",
    name: "Symbolics 3600 / MIT CADR Hardware-Tagged LISP Machine",
    view0: 0.36,
    blurb:
      "Born in the MIT AI Lab (Richard Greenblatt, Tom Knight, David Moon) and commercialized as the Symbolics 3600: instead of stripping types at compile time like von Neumann C/FORTRAN CPUs, every 36-bit memory word carried a hardware data-type tag checked in parallel with ALU execution, 2-bit CDR-coding halved linked-list memory footprint, and hardware write-barriers drove real-time Ephemeral Garbage Collection.",
    diagram: {
      nodes: [
        { id: "kbd", label: "Space-Cadet Kbd", x: 0.16, y: 0.76, color: "#fbbf24" },
        { id: "wcs", label: "112b Microcode WCS", x: 0.22, y: 0.24, color: "#c08cff" },
        { id: "alu", label: "36b ALU + Tag Trap", x: 0.52, y: 0.36, color: "#38bdf8" },
        { id: "heap", label: "CDR-Coded Heap + GC", x: 0.54, y: 0.78, color: "#34d399" },
        { id: "disp", label: "Genera Bitmap CRT", x: 0.84, y: 0.48, color: "#f97316" },
      ],
      edges: [
        ["kbd", "alu", "S-Expr"],
        ["wcs", "alu", "Micro-Op"],
        ["alu", "heap", "CAR/CDR/CONS"],
        ["alu", "disp", "BitBLT"],
      ],
    },
    build(kit) {
      tagLeds = [];

      // 1. FLOOR-STANDING SYMBOLICS 3600 PROCESSOR CABINET (Left, Cutaway Backplane!)
      const proc = kit.group([-0.74, 0, -0.08], {
        name: "Symbolics 3600 36-Bit Tagged Processor Cabinet",
        info: "Houses the L-Bus 36-bit ECC memory boards, 4K×112-bit Writable Control Store (WCS), hardware PDL stack buffer, and ephemeral GC page-tag map.",
      });
      kit.box(
        0.72,
        1.34,
        0.84,
        U.plastic(0xd6d0c2, 0.46),
        [0, 0.67, 0],
        {
          shell: true,
          name: "Sculpted Cream Acoustic Processor Enclosure",
          explode: [-0.46, 0.14, 0],
        },
        proc,
      );
      // Charcoal front accent stripe + status LEDs
      const stripe = kit.box(
        0.68,
        0.14,
        0.03,
        U.darkAnodized(0x1f242d),
        [0, 1.14, 0.42],
        {
          name: "3600 Front Diagnostic & GC Activity Panel",
        },
        proc,
      );
      for (let i = 0; i < 6; i++) {
        const led = kit.sphere(
          0.011,
          U.led(i < 2 ? 0x38bdf8 : i < 4 ? 0xfbbf24 : 0x34d399),
          [-0.22 + i * 0.085, 0, 0.02],
          {},
          stripe,
        );
        tagLeds.push(led);
      }

      // Internal L-Bus Cage + 4 Vertical Logic Boards exposed on cutaway!
      const cage = kit.box(0.58, 0.86, 0.68, U.steel(), [0, 0.56, -0.02], {}, proc);
      const boardNames = [
        "36-Bit Parallel Tag-Check & Fixnum ALU Board",
        "CDR-Coding & Hardware PDL Stack-Buffer Board",
        "Ephemeral GC Write-Barrier & PHT MMU Board",
        "112-Bit Writable Control Store (WCS) & Chaosnet/Ethernet Board",
      ];
      boardNames.forEach((bName, bIdx) => {
        const bx = -0.18 + bIdx * 0.12;
        const brd = kit.box(
          0.018,
          0.74,
          0.58,
          U.pcb(bIdx % 2 === 0 ? 0x185c37 : 0x1b4d6e),
          [bx, 0, 0],
          {
            name: bName,
            info: "High-density Schottky TTL / ECL logic card with gold L-Bus backplane fingers.",
            explode: [0, 0.24 + bIdx * 0.06, 0.28],
          },
          cage,
        );
        kit.box(0.022, 0.05, 0.52, U.gold(), [0, -0.36, 0], {}, brd);
      });

      // 2. WORKSTATION DESK, PORTRAIT GENERA BITMAP CRT, SPACE-CADET KEYBOARD & 3-BUTTON MOUSE (Right)
      const desk = kit.group([0.46, 0, 0.08], {
        name: "Symbolics Genera Lisp Console & Space-Cadet Desk",
      });
      kit.box(
        1.38,
        0.045,
        0.92,
        U.wood(),
        [0, 0.52, 0],
        { name: "Oak Console Worksurface" },
        desk,
      );
      for (const [lx, lz] of [
        [-0.62, -0.38],
        [0.62, -0.38],
        [-0.62, 0.38],
        [0.62, 0.38],
      ]) {
        kit.box(0.05, 0.52, 0.05, U.darkAnodized(0x222730), [lx, 0.26, lz], {}, desk);
      }

      mon = buildMonitor3D(
        kit,
        [-0.04, 0.54, -0.14],
        {
          crt: true,
          w: 0.64,
          h: 0.76,
          res: [896, 1024],
          color: 0xd8d2c4,
          name: "Portrait 1124×800 Genera Dynamic-Windows Bitmap CRT",
          info: "High-DPI bitmapped display where every Lisp object printed to the screen remains a live, clickable presentation object.",
          explode: [0, 0.28, -0.18],
        },
        desk,
      );

      // Iconic Space-Cadet Keyboard (Control / Meta / Super / Hyper / Greek / Top)
      buildSculptedKeyboard(
        kit,
        [-0.08, 0.545, 0.27],
        {
          w: 0.78,
          d: 0.26,
          color: 0xd8d2c4,
          keyColor: 0x3b4252,
          accentColor: 0x2563eb,
          name: "MIT / Symbolics 'Space-Cadet' Chord Keyboard",
          info: "Features dedicated Shift, Top, Greek, Control, Meta, Super, and Hyper keys on both sides — inspiring Emacs keybindings and Unicode math input.",
          explode: [0, 0.14, 0.32],
        },
        desk,
      );
      buildCoiledCable(
        kit,
        [
          [-0.08, 0.56, 0.13],
          [-0.22, 0.56, 0.04],
          [-0.36, 0.56, -0.08],
        ],
        0.015,
        0.0045,
        14,
        0x2b2f38,
        {},
        desk,
      );

      // 3-Button Optical Mouse on optical grid pad
      kit.box(
        0.22,
        0.006,
        0.24,
        U.metal(0x64748b, 0.25),
        [0.46, 0.546, 0.26],
        {
          name: "Optical Grid Mousepad",
        },
        desk,
      );
      const mouse = kit.box(
        0.085,
        0.032,
        0.125,
        U.plastic(0xd8d2c4, 0.42),
        [0.46, 0.565, 0.26],
        {
          name: "3-Button Symbolics Optical Mouse (Left / Middle / Right)",
          info: "Context-sensitive mouse whose 3 buttons dynamically update the bottom 'Who-Line' documentation bar as the cursor crosses Lisp presentations.",
        },
        desk,
      );
      for (let b = 0; b < 3; b++) {
        kit.box(
          0.022,
          0.008,
          0.038,
          U.darkAnodized(0x28303d),
          [-0.026 + b * 0.026, 0.016, -0.036],
          {},
          mouse,
        );
      }

      drawGeneraConsole();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("word", sim.encodeWord36Hex(sim.lastResultWord));
        statsUi.set("out", String(sim.lastOutput).slice(0, 28));
        statsUi.set("tags", `${sim.tagChecks} parallel checks`);
        statsUi.set("cdr", `${sim.cdrWordsSaved} words saved`);
        statsUi.set("heap", `${sim.liveWords} live / ${sim.heapHalf} nursery`);
        statsUi.set("gc", `${sim.gcCycles} Cheney flips (${sim.lastReclaimed}w freed)`);
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      const editor = Ht(
        sim.src,
        (newCode) => {
          sim.loadProgram(newCode);
          hi("key");
          if (ctx.diagram) {
            ctx.diagram.pulse("kbd", "alu", "#fbbf24");
            ctx.diagram.pulse("alu", "heap", "#34d399");
            ctx.diagram.pulse("alu", "disp", "#f97316");
          }
          drawGeneraConsole();
          syncStats();
        },
        7,
      );

      statsUi = Pt([
        ["word", "36-Bit Result"],
        ["out", "S-Expr Value"],
        ["tags", "HW Tag Guard"],
        ["cdr", "CDR-Code Gain"],
        ["heap", "FromSpace Heap"],
        ["gc", "Ephemeral GC"],
      ]);

      el.append(
        Ie(
          "36-Bit Hardware-Tagged LISP Evaluator & Ephemeral GC",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe(
              "⚡ Eval S-Expr",
              () => {
                sim.loadProgram(editor.value);
                hi("tty");
                if (ctx.diagram) ctx.diagram.pulse("kbd", "alu", "#fbbf24");
                drawGeneraConsole();
                syncStats();
              },
              "pri",
            ),
            Fe("♻ Trigger Cheney GC", () => {
              sim.collectGarbage();
              hi("switch");
              if (ctx.diagram) ctx.diagram.pulse("alu", "heap", "#34d399");
              drawGeneraConsole();
              syncStats();
            }),
          ),
          q(
            "div",
            { class: "row" },
            st(
              sim.programNames.map((n) => [n, n]),
              sim.programNames[0],
              (name) => {
                const code = LISP_PROGRAMS[name];
                editor.value = code;
                sim.loadProgram(code);
                hi("key");
                drawGeneraConsole();
                syncStats();
              },
            ),
          ),
          editor,
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 3.0;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("wcs", "alu", "#c08cff");
            ctx.diagram.pulse("alu", "heap", "#34d399");
            if (sim.evalStepCounter % 2 === 0)
              ctx.diagram.pulse("alu", "disp", "#f97316");
          }
          drawGeneraConsole();
          if (machine._syncStats) machine._syncStats();
        }
      }
      tagLeds.forEach((led, idx) => {
        led.material.emissiveIntensity =
          0.25 + 1.4 * Math.abs(Math.sin(t * 5 + idx * 0.9));
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const l = new SymbolicsLispMachine();
      const dOut = l.lastOutput;
      const mOut = l.loadProgram(LISP_PROGRAMS["CDR-Coded List & Higher-Order Mapcar"]);
      const gc = l.collectGarbage();
      return {
        ok:
          dOut.includes("(+ (* X") &&
          mOut === "225" &&
          gc.gcCycles >= 1 &&
          l.cdrWordsSaved > 5,
        mapcar: mOut,
      };
    },
  };
  return machine;
}

// ============================================================================
// 300 MM MONOLITHIC WAFER-SCALE DATAFLOW & NEUROMORPHIC ENGINE (2024, wse24)
// ============================================================================
function makeMachineWse24() {
  const sim = new WaferScaleDataflowEngine();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let tileMeshes = [];
  let statsUi = null;

  function drawWseMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060a12";
    c.fillRect(0, 0, W, H);

    c.fillStyle = sim.mode === "wavelet" ? "#0e4f6e" : "#4c1d95";
    c.fillRect(16, 14, W - 32, 52);
    c.fillStyle = "#f8fafc";
    c.font = '700 19px "JetBrains Mono", monospace';
    c.fillText(
      `300mm WAFER-SCALE ENGINE · 84 STITCHED RETICLES · 44 GB SRAM (21 PB/s) · MODE=${sim.mode.toUpperCase()}`,
      26,
      47,
    );

    // Left: 10x10 Spatial Reticle-Stitched Core Heatmap + Defect Spare-Core Detour Links
    c.fillStyle = "#0b1322";
    c.fillRect(20, 82, 500, 500);
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 500, 500);
    c.fillStyle = "#7dd3fc";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText("RETICLE-STITCHED SPATIAL TILE MESH + REDUNDANT BYPASS", 34, 110);

    const cellP = 43;
    const ox = 46;
    const oy = 128;
    for (let r = 0; r < sim.gridN; r++) {
      for (let col = 0; col < sim.gridN; col++) {
        const t = sim.tiles[r * sim.gridN + col];
        const px = ox + col * cellP;
        const py = oy + r * cellP;
        if (t.defective) {
          c.fillStyle = "#450a0a";
          c.fillRect(px, py, cellP - 4, cellP - 4);
          c.strokeStyle = "#fbbf24";
          c.lineWidth = 2.5;
          c.strokeRect(px + 1, py + 1, cellP - 6, cellP - 6);
          c.fillStyle = "#fde047";
          c.font = '700 11px "JetBrains Mono", monospace';
          c.fillText("BYP", px + 8, py + 24);
        } else {
          const v = Math.max(0, Math.min(1, t.act));
          const rr =
            sim.mode === "spiking" ? Math.round(60 + 190 * v) : Math.round(20 + 60 * v);
          const gg =
            sim.mode === "spiking" ? Math.round(40 + 180 * v) : Math.round(90 + 155 * v);
          const bb = Math.round(140 + 115 * v);
          c.fillStyle = `rgb(${rr},${gg},${bb})`;
          c.fillRect(px, py, cellP - 4, cellP - 4);
          if (t.spike) {
            c.strokeStyle = "#fde047";
            c.lineWidth = 2;
            c.strokeRect(px, py, cellP - 4, cellP - 4);
          }
        }
      }
    }
    // Draw copper reticle stitch scribe lines every 3 tiles
    c.strokeStyle = "rgba(251, 191, 36, 0.55)";
    c.setLineDash([6, 4]);
    c.lineWidth = 2;
    for (const k of [3, 6, 9]) {
      c.beginPath();
      c.moveTo(ox + k * cellP - 2, oy);
      c.lineTo(ox + k * cellP - 2, oy + 10 * cellP);
      c.moveTo(ox, oy + k * cellP - 2);
      c.lineTo(ox + 10 * cellP, oy + k * cellP - 2);
      c.stroke();
    }
    c.setLineDash([]);

    // Right: Architectural Physics vs Multi-GPU Cluster Comparison
    c.fillStyle = "#0b1322";
    c.fillRect(536, 82, 468, 500);
    c.strokeStyle = "#f59e0b";
    c.lineWidth = 2;
    c.strokeRect(536, 82, 468, 500);
    c.fillStyle = "#fcd34d";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("WHY MONOLITHIC WAFER-SCALE BEATS SERDES", 554, 112);

    const metrics = [
      ["Wafer Silicon Area", "46,225 mm² (57× largest GPU)"],
      ["Compute Cores", "900,000 Sparse/Wavelet Cores"],
      ["On-Wafer SRAM", "44 GB @ 1-Cycle Local Access"],
      ["Memory Bandwidth", "21.0 PB/s (7,000× HBM3e GPU!)"],
      ["Fabric Wavelets", `${sim.waveletsRouted.toLocaleString()} routed`],
      ["LIF Spikes / STDP", `${sim.spikesFired} spikes · ${sim.stdpUpdates} Δw`],
      ["Wafer Defect Yield", `${sim.yieldPct}% (${sim.defectCount} bypassed)`],
      ["Mesh Reachability", sim.connectivityOk ? "100% CONNECTED ✓" : "DEGRADED"],
      [
        "Dynamic Power",
        `${sim.powerKw} kW (${(sim.activeFraction * 100).toFixed(0)}% active)`,
      ],
    ];
    metrics.forEach(([k, v], i) => {
      const my = 148 + i * 44;
      c.fillStyle = "#94a3b8";
      c.font = '600 14px "JetBrains Mono", monospace';
      c.fillText(k, 554, my);
      c.fillStyle = "#e2e8f0";
      c.font = '700 14.5px "JetBrains Mono", monospace';
      c.fillText(v, 554, my + 20);
    });

    // Bottom Explanation Strip
    c.fillStyle = "#0b1322";
    c.fillRect(20, 598, W - 40, 150);
    c.strokeStyle = "#34d399";
    c.strokeRect(20, 598, W - 40, 150);
    c.fillStyle = "#6ee7b7";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText(
      "LITHOGRAPHY STITCHING + CTE THERMAL INTERPOSER + SPARE-CORE FABRIC",
      36,
      628,
    );
    c.fillStyle = "#cbd5e1";
    c.font = '500 14px "JetBrains Mono", monospace';
    c.fillText(
      "• Traditional dicing saws a 300mm wafer into ~60 chips, then spends 40% energy driving SERDES wires.",
      36,
      660,
    );
    c.fillText(
      "• Reticle stitching bridges copper wires across exposure boundaries; redundant spare rows route around",
      36,
      690,
    );
    c.fillText(
      "  inevitable silicon dust defects in 1 extra mux hop so whole-wafer yield approaches 100%.",
      36,
      718,
    );

    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "wse24",
    era: "2024",
    short: "Wafer-Scale Engine",
    name: "300 mm Monolithic Wafer-Scale Dataflow & Neuromorphic Engine",
    group: "center",
    view0: -0.24,
    blurb:
      "After Gene Amdahl's 1980 Trilogy Systems failed on wafer yield and differential thermal expansion, modern Wafer-Scale Engines (Cerebras WSE-3 / BrainScaleS-2) solved both: EUV reticle-stitched copper bridges unite 84 dies (900,000 cores + 44 GB 1-cycle SRAM at 21 PB/s) on one uncut 300 mm wafer, hardware spare-core routers bypass silicon defects, and perpendicular water-cooled interposers absorb CTE stress.",
    diagram: {
      nodes: [
        { id: "pwr", label: "20kA Pogo VRM Plane", x: 0.16, y: 0.28, color: "#f59e0b" },
        {
          id: "wafer",
          label: "84-Reticle 300mm Wafer",
          x: 0.5,
          y: 0.48,
          color: "#38bdf8",
        },
        { id: "sram", label: "44GB 1-Cycle SRAM", x: 0.5, y: 0.16, color: "#34d399" },
        {
          id: "spare",
          label: "Spare-Core Defect Mux",
          x: 0.5,
          y: 0.84,
          color: "#fbbf24",
        },
        {
          id: "cold",
          label: "Copper Coldplate Loop",
          x: 0.84,
          y: 0.48,
          color: "#c08cff",
        },
      ],
      edges: [
        ["pwr", "wafer", "0.8V Vertical"],
        ["sram", "wafer", "21 PB/s"],
        ["spare", "wafer", "1-Hop Detour"],
        ["wafer", "cold", "23 kW Manifold"],
      ],
    },
    build(kit) {
      tileMeshes = [];

      // 1. VERTICAL WATER-COOLED WAFER-SCALE ENGINE MODULE (Left-Center)
      const mod = kit.group([-0.46, 0, 0], {
        name: "15U Wafer-Scale Engine Compute Block",
        info: "Houses the uncut 300 mm silicon wafer clamped between a flexible CTE-absorbing gold pogo-pin interposer, front VRM array, and rear brazed copper liquid coldplate.",
      });
      // Open-front milled anodized CS-3 bay frame + crystal-clear front inspection shield (shell: true!)
      kit.box(1.24, 1.56, 0.14, U.darkAnodized(0x141923), [0, 0.78, -0.28], {}, mod);
      kit.box(1.26, 0.08, 0.56, U.darkAnodized(0x1c2536), [0, 1.54, -0.07], {}, mod);
      kit.box(1.26, 0.08, 0.56, U.darkAnodized(0x1c2536), [0, 0.04, -0.07], {}, mod);
      kit.box(0.07, 1.44, 0.54, U.darkAnodized(0x182030), [-0.59, 0.79, -0.07], {}, mod);
      kit.box(0.07, 1.44, 0.54, U.darkAnodized(0x182030), [0.59, 0.79, -0.07], {}, mod);
      kit.box(
        1.14,
        1.42,
        0.025,
        U.glass(0xdbeafe, 0.09),
        [0, 0.79, 0.21],
        {
          shell: true,
          name: "Front VRM & Optical I/O Containment Shroud",
          explode: [0, 0, 0.48],
        },
        mod,
      );

      // Rear Solid Brazed Copper Liquid Coldplate + Supply/Return Coolant Manifolds
      const cold = kit.box(
        1.04,
        1.08,
        0.07,
        U.copper(),
        [0, 0.8, -0.18],
        {
          name: "Micro-Channel Brazed Copper Coldplate",
          info: "Extracts up to 23 kW directly across the 46,225 mm² silicon wafer backside while maintaining <2 °C thermal gradient.",
          explode: [0, 0, -0.38],
        },
        mod,
      );
      kit.cyl(0.036, 0.036, 0.48, U.steel(), [-0.36, 0.72, -0.06], {}, cold);
      kit.cyl(0.036, 0.036, 0.48, U.copper(), [0.36, 0.72, -0.06], {}, cold);

      // THE UNCUT 300 MM SILICON WAFER + 215x215mm SQUARE RETICLE-STITCHED COMPUTE MATRIX!
      const waferAssembly = kit.group(
        [0, 0.8, 0.04],
        {
          name: "Uncut 300 mm Reticle-Stitched Silicon Wafer (84 Dies / 900k Cores)",
          info: "World's largest integrated circuit: 4 trillion transistors and 44 GB of distributed single-cycle SRAM stitched across 84 photolithography reticles.",
          live: () =>
            `Mode=${sim.mode} · Yield=${sim.yieldPct}% (${sim.defectCount} bypassed) · BW=21 PB/s`,
          explode: [0, 0, 0.22],
        },
        mod,
      );
      // Circular 300 mm silicon wafer carrier disc
      kit.cyl(
        0.5,
        0.5,
        0.016,
        U.wafer(0xdbeafe),
        [0, 0, 0],
        { rot: [Math.PI / 2, 0, 0], seg: 64 },
        waferAssembly,
      );
      // Gold CTE-compliant perimeter clamp ring
      kit.torus(
        0.505,
        0.016,
        U.gold(),
        [0, 0, 0.004],
        { ts: 64, name: "Compliant Gold Pogo-Pin CTE Interposer Ring" },
        waferAssembly,
      );

      // Interactive 10x10 spatial compute/spiking tile array across the inscribed square wafer die!
      const span = 0.64;
      const pitch = span / 10;
      for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
          const tileMesh = kit.box(
            pitch * 0.82,
            pitch * 0.82,
            0.014,
            U.led(0x38bdf8),
            [-span * 0.5 + (c + 0.5) * pitch, span * 0.5 - (r + 0.5) * pitch, 0.014],
            {
              sharp: true,
              name: `Wafer Reticle Tile (${r}, ${c})`,
              live: () => {
                const t = sim.tiles[r * 10 + c];
                return t.defective
                  ? `Tile (${r},${c}): PARTICLE DEFECT -> Bypassed via Spare Row ✓`
                  : `Tile (${r},${c}): Act=${t.act.toFixed(2)} · Weight=${t.weight.toFixed(2)}`;
              },
            },
            waferAssembly,
          );
          tileMeshes.push(tileMesh);
        }
      }

      // 2. PANORAMIC WAFER TELEMETRY MONITOR (Right)
      mon = buildMonitor3D(kit, [0.98, 0.62, 0.16], {
        w: 0.96,
        h: 0.72,
        rot: [0, -0.32, 0],
        name: "Wafer-Scale Wavelet & Spiking STDP Fabric Analyzer",
        explode: [0.38, 0, 0.18],
      });
      kit.box(1.04, 0.62, 0.52, U.darkAnodized(0x111724), [0.98, 0.31, 0.16], {
        rot: [0, -0.32, 0],
      });

      drawWseMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set(
          "mode",
          sim.mode === "wavelet" ? "Spatial Wavelet GEMM" : "LIF + STDP Spiking",
        );
        statsUi.set("sram", "44 GB · 21.0 PB/s (1-cycle)");
        statsUi.set("wav", `${sim.waveletsRouted.toLocaleString()} wavelets`);
        statsUi.set("spk", `${sim.spikesFired} spikes · ${sim.stdpUpdates} STDP Δw`);
        statsUi.set("yld", `${sim.yieldPct}% (${sim.defectCount} spare-bypassed)`);
        statsUi.set("pwr", `${sim.powerKw} kW liquid-cooled`);
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
        ["mode", "Fabric Engine"],
        ["sram", "On-Wafer SRAM"],
        ["wav", "Routed Packets"],
        ["spk", "Neuromorphic"],
        ["yld", "Wafer DefectMux"],
        ["pwr", "Thermal Draw"],
      ]);

      el.append(
        Ie(
          "300 mm Wafer-Scale Wavelet Dataflow, LIF STDP & Defect Bypass",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe(
              "Wavelet Dataflow",
              () => {
                sim.setMode("wavelet");
                hi("clock");
                if (ctx.diagram) ctx.diagram.pulse("sram", "wafer", "#38bdf8");
                drawWseMonitor();
                syncStats();
              },
              "pri",
            ),
            Fe(
              "LIF + STDP Spiking",
              () => {
                sim.setMode("spiking");
                hi("spike");
                if (ctx.diagram) ctx.diagram.pulse("pwr", "wafer", "#c08cff");
                drawWseMonitor();
                syncStats();
              },
              "pri",
            ),
          ),
          q(
            "div",
            { class: "row" },
            Fe("⚡ Inject Center Wavefront", () => {
              sim.injectWavefrontPulse(4, 4);
              hi("stim");
              drawWseMonitor();
              syncStats();
            }),
            Fe("🛠 Inject / Repair Wafer Defect", () => {
              const r = (sim.defectCount * 3 + 1) % 10;
              const c = (sim.defectCount * 7 + 4) % 10;
              sim.toggleDefect(r, c);
              hi("switch");
              if (ctx.diagram) ctx.diagram.pulse("spare", "wafer", "#fbbf24");
              drawWseMonitor();
              syncStats();
            }),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 6.0;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("sram", "wafer", "#34d399");
            ctx.diagram.pulse("pwr", "wafer", "#f59e0b");
            if (sim.clockCycles % 2 === 0) ctx.diagram.pulse("wafer", "cold", "#c08cff");
          }
          drawWseMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      tileMeshes.forEach((m, idx) => {
        const tile = sim.tiles[idx];
        if (!tile) return;
        if (tile.defective) {
          m.material.color.setHex(0x451a03);
          m.material.emissive.setHex(0xfbbf24);
          m.material.emissiveIntensity = 1.35 + 0.35 * Math.sin(t * 7 + idx);
        } else if (sim.mode === "spiking") {
          m.material.color.setHex(0x1e1b4b);
          m.material.emissive.setHex(tile.spike ? 0xf472b6 : 0x818cf8);
          m.material.emissiveIntensity = 0.08 + tile.act * 1.65;
        } else {
          m.material.color.setHex(0x0c2d48);
          m.material.emissive.setHex(0x38bdf8);
          m.material.emissiveIntensity = 0.08 + tile.act * 1.55;
        }
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const w = new WaferScaleDataflowEngine();
      for (let i = 0; i < 6; i++) w.step();
      w.setMode("spiking");
      for (let i = 0; i < 8; i++) w.step();
      w.toggleDefect(5, 5);
      return {
        ok: w.waveletsRouted > 100 && w.spikesFired > 0 && w.connectivityOk === true,
        spikes: w.spikesFired,
      };
    },
  };
  return machine;
}
