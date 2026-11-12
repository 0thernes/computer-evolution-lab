// Circle III — Supercomputers: Vector Chaining, Massively Parallel SIMD Hypercubes, 3D-Torus MPI, Exascale & Rack-Scale AI
//   cray1    (1976) ★ CAPITAL: Cray-1 Vector Supercomputer (80 MHz, 270° C-cylinder, V0..V7 & Vector Chaining)
//   cm2      (1987)          : Thinking Machines Connection Machine CM-2 (65,536-PE SIMD + e-cube Hypercube Router)
//   bgene    (2008)          : IBM Blue Gene Petascale 3D-Torus MPI Supercomputer (Stencil PDE + Amdahl vs Gustafson)
//   exascale (2022)          : Frontier-Class 1.194 ExaFLOPS Supercomputer (Mixed-Precision HPL + Slingshot Dragonfly)
//   gb200    (2025)          : Blackwell NVL72 72-GPU Liquid-Cooled AI Supercomputer (130 TB/s NVLink + Trainable MoE)

function makeMachineCray1() {
  const sim = new Cray1VectorCpu();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let statsUi = null;

  function drawCrayScope() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#050d0a";
    c.fillRect(0, 0, W, H);

    c.fillStyle = "#991b1b";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#fef2f2";
    c.font = '700 21px "JetBrains Mono", monospace';
    c.fillText(
      `CRAY-1S VECTOR SUPERCOMPUTER · 80 MHz (12.5 ns) · VL=${sim.VL} · ${sim.chaining ? "CHAINING ON" : "UNCHAINED"} · ${sim.mflops.toFixed(1)} MFLOPS`,
      26,
      46,
    );

    // Top: Live 64-element Vector Registers V0 (Wave), V3 (S1*V0), V4 (V3+V2)
    c.fillStyle = "#091612";
    c.fillRect(20, 80, W - 40, 356);
    c.strokeStyle = "#10b981";
    c.lineWidth = 2;
    c.strokeRect(20, 80, W - 40, 356);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      `64-ELEMENT × 64-BIT VECTOR REGISTERS: V3 <- S1(${sim.alpha.toFixed(2)}) * V0   |   V4 <- V3 + V2`,
      36,
      108,
    );

    const plotSeries = [
      [sim.V[0], "#38bdf8", "V0 (Load)"],
      [sim.V[3], "#fbbf24", "V3 (FMul)"],
      [sim.V[4], "#34d399", "V4 (Chained FAdd)"],
    ];
    const midY = 268;
    c.strokeStyle = "#1e3a2f";
    c.beginPath();
    c.moveTo(36, midY);
    c.lineTo(W - 36, midY);
    c.stroke();

    plotSeries.forEach(([vec, col, lbl], sIdx) => {
      c.strokeStyle = col;
      c.lineWidth = 3;
      c.beginPath();
      for (let i = 0; i < sim.VL; i++) {
        const px = 42 + (i / 63) * (W - 84);
        const py = midY - Math.max(-135, Math.min(135, vec[i] * 48));
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
      c.fillStyle = col;
      c.font = '700 14px "JetBrains Mono", monospace';
      c.fillText(`■ ${lbl}`, 42 + sIdx * 240, 418);
    });

    // Bottom: Exact Cycle Chime Waterfall (Scalar vs Unchained vs Chained)
    c.fillStyle = "#091612";
    c.fillRect(20, 454, W - 40, 290);
    c.strokeStyle = "#f59e0b";
    c.strokeRect(20, 454, W - 40, 290);
    c.fillStyle = "#fde68a";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      `PIPELINE CHIME TIMING COMPARISON (SPEEDUP vs SCALAR = ×${sim.speedupVsScalar.toFixed(1)})`,
      36,
      484,
    );

    const maxClk = Math.max(220, sim.unchainedClocks + 20);
    const bars = [
      ["SCALAR LOOP (29 clk/elem)", sim.scalarClocks, "#ef4444"],
      ["VECTOR UNCHAINED (3 chimes)", sim.unchainedClocks, "#f59e0b"],
      ["VECTOR CHAINED (1 chime!)", sim.chainedClocks, "#10b981"],
    ];
    bars.forEach(([lbl, clks, col], idx) => {
      const by = 516 + idx * 70;
      c.fillStyle = "#e2e8f0";
      c.font = '700 15px "JetBrains Mono", monospace';
      c.fillText(
        `${lbl}: ${clks} clocks (${((clks * 12.5) / 1000).toFixed(2)} µs)`,
        36,
        by,
      );
      c.fillStyle = "#1e293b";
      c.fillRect(36, by + 10, W - 76, 30);
      const frac = Math.min(1, clks / maxClk);
      c.fillStyle = col;
      c.fillRect(36, by + 10, (W - 76) * frac, 30);
    });
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "cray1",
    era: "1976",
    short: "Cray-1 Vector ★",
    name: "Cray-1 Vector Supercomputer",
    group: "super",
    capital: true,
    view0: 0.42,
    blurb:
      "Capital monument of supercomputing (Seymour Cray, 1976): bent into a 270° C-cylinder so no backplane wire exceeds 4 feet (beating speed-of-light propagation delay at 80 MHz = 12.5 ns), Freon-cooled through vertical copper coldbars beneath a padded bench, and introducing 64-element Vector Registers (V0–V7) with hardware Vector Chaining.",
    diagram: {
      nodes: [
        { id: "mem", label: "1MW Bipolar SRAM", x: 0.16, y: 0.48, color: "#58c4ff" },
        { id: "v0", label: "V0..V7 (64×64b)", x: 0.44, y: 0.24, color: "#ff5f5f" },
        { id: "sreg", label: "Scalar S0..S7", x: 0.44, y: 0.74, color: "#ffb347" },
        { id: "fmul", label: "7-Stg Vec FMUL", x: 0.72, y: 0.24, color: "#f472b6" },
        { id: "fadd", label: "6-Stg Vec FADD", x: 0.86, y: 0.58, color: "#5fe08a" },
      ],
      edges: [
        ["mem", "v0", "80M/s"],
        ["v0", "fmul", "Stream"],
        ["sreg", "fmul", "S1"],
        ["fmul", "fadd", "Chained!"],
        ["fadd", "v0", "V4"],
      ],
    },
    build(kit) {
      // Dark circular machine-room floor pad
      kit.cyl(1.95, 2.0, 0.06, U.darkAnodized(0x161b24), [0, 0.03, 0], {
        name: "Freon-Plenum Floor Pad",
        info: "Raised supercomputer floor carrying dual Freon R-12 refrigerant lines and 400 Hz motor-generator power feeds.",
      });

      // 1. AUTHENTIC 12-COLUMN 270° C-SHAPED CRAY-1 TOWER + PADDED BENCH
      const cTower = kit.group([-0.22, 0.06, 0], {
        name: "270° C-Cylinder Vector Tower",
        info: "Twelve 22.5° wedge columns arranged in a 270° C-shape around a tight central wiring court so the longest backplane wire is under 4 feet (~4.1 ns flight time).",
      });

      const nCols = 12;
      const startAng = -Math.PI * 0.75;
      const spanAng = Math.PI * 1.5; // 270 degrees open in front-right!
      for (let i = 0; i < nCols; i++) {
        const ang = startAng + ((i + 0.5) / nCols) * spanAng;
        const rMid = 0.76;
        const cx = Math.cos(ang) * rMid;
        const cz = Math.sin(ang) * rMid;
        const isRed = i % 2 === 0;

        // Outer crimson / brushed-gold-aluminum wedge skins (shell: true for cutaway!)
        const colGrp = kit.group(
          [cx, 0, cz],
          {
            rot: [0, -ang, 0],
            name: `Cray-1 Wedge Column ${i + 1}`,
            info: "Houses 144 high-density 5-gate/4-gate ECL printed circuit modules clamped directly against vertical Freon-cooled copper coldbars.",
            explode: [Math.cos(ang) * 0.38, 0.12, Math.sin(ang) * 0.38],
          },
          cTower,
        );
        kit.box(
          0.26,
          1.78,
          0.32,
          isRed ? U.plastic(0xc52228, 0.34) : U.metal(0xd4b46a, 0.32),
          [0.06, 0.89, 0],
          {
            shell: true,
            name: isRed
              ? "Cray Crimson Wedge Panel"
              : "Anodized Gold-Aluminum Wedge Panel",
          },
          colGrp,
        );

        // Internal Copper Freon Coldbar + Stacked Horizontal ECL Logic Boards
        kit.box(
          0.03,
          1.66,
          0.28,
          U.copper(),
          [-0.02, 0.86, 0],
          {
            name: "Freon-12 Copper Thermal Coldbar",
            info: "Conducts 115 kW of Emitter-Coupled Logic (ECL) heat out of module edges to keep silicon junctions at 54 °C.",
          },
          colGrp,
        );
        for (let b = 0; b < 8; b++) {
          kit.box(
            0.22,
            0.016,
            0.24,
            U.pcb(0x165b38),
            [0.02, 0.24 + b * 0.19, 0],
            {
              name: "ECL Sub-Nanosecond Vector Module",
            },
            colGrp,
          );
        }

        // Iconic Circular Padded Naugahyde Bench Cushion around outside of column!
        const benchR = 1.08;
        const bx = Math.cos(ang) * benchR;
        const bz = Math.sin(ang) * benchR;
        const bench = kit.group(
          [bx, 0, bz],
          {
            rot: [0, -ang, 0],
            name: "Padded Power-Supply Bench",
            info: "Iconic circular upholstered seat concealing 36 low-voltage DC power supplies and Freon distribution manifolds.",
            explode: [Math.cos(ang) * 0.22, -0.05, Math.sin(ang) * 0.22],
          },
          cTower,
        );
        kit.box(0.32, 0.38, 0.38, U.darkAnodized(0x22262f), [0, 0.19, 0], {}, bench);
        kit.box(
          0.35,
          0.085,
          0.41,
          U.plastic(isRed ? 0xb91c1c : 0xe5dec9, 0.48),
          [0, 0.42, 0],
          { bevel: 0.02 },
          bench,
        );
      }

      // Inner Speed-of-Light Twisted-Pair Chord Tangle across the inner C-cavity!
      for (let w = 0; w < 18; w++) {
        const a0 = startAng + ((w * 3) % nCols) * (spanAng / nCols) + 0.1;
        const a1 = startAng + ((w * 7 + 5) % nCols) * (spanAng / nCols) + 0.1;
        const y0 = 0.28 + (w % 6) * 0.24;
        const y1 = 0.34 + ((w + 3) % 6) * 0.23;
        kit.tube(
          [
            [Math.cos(a0) * 0.56, y0, Math.sin(a0) * 0.56],
            [
              Math.cos((a0 + a1) * 0.5) * 0.24,
              (y0 + y1) * 0.5,
              Math.sin((a0 + a1) * 0.5) * 0.24,
            ],
            [Math.cos(a1) * 0.56, y1, Math.sin(a1) * 0.56],
          ],
          0.008,
          U.plastic(w % 2 ? 0x38bdf8 : 0xfbbf24, 0.45),
          {
            name: "Matched-Impedance Twisted-Pair Chord",
            info: "70 miles of cut-to-exact-picosecond twisted-pair transmission lines across the inner hollow cylinder.",
          },
          cTower,
        );
      }

      // 2. OPERATOR VECTOR CONSOLE DESK (Front-Right of C opening)
      const desk = kit.group([1.08, 0.06, 0.58], {
        rot: [0, 0.04, 0],
        name: "Cray-1 Vector Operator Station",
        info: "Dual-screen vector maintenance & job-control console displaying live V0–V7 waveforms and chime utilization.",
      });
      kit.box(1.06, 0.64, 0.72, U.metal(0x252b36, 0.48), [0, 0.32, 0], {}, desk);
      mon = buildMonitor3D(
        kit,
        [0, 0.64, -0.04],
        {
          w: 0.78,
          h: 0.58,
          crt: true,
          color: 0xd4cec0,
          name: "Vector Chime & Register CRT",
          info: "Live oscilloscope view of 64-element vector registers V0, V3, V4 and hardware Vector Chaining speedup.",
          live: () =>
            `${sim.mflops.toFixed(1)} MFLOPS · ×${sim.speedupVsScalar.toFixed(1)} vs scalar`,
          explode: [0, 0.28, 0],
        },
        desk,
      );
      buildSculptedKeyboard(
        kit,
        [0, 0.65, 0.26],
        { w: 0.5, d: 0.19, name: "Operator Console Keyboard" },
        desk,
      );

      drawCrayScope();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("mflops", `${sim.mflops.toFixed(1)} MFLOPS`);
        statsUi.set("spd", `×${sim.speedupVsScalar.toFixed(1)} vs scalar`);
        statsUi.set("chain", `${sim.chainedClocks} clks (1 chime)`);
        statsUi.set("unchain", `${sim.unchainedClocks} clks (3 chimes)`);
        statsUi.set("scalar", `${sim.scalarClocks} clks`);
        statsUi.set("vl", `${sim.VL} × 64-bit FP`);
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      const chainBtn = Fe(
        sim.chaining ? "Chaining: ON (1 Chime)" : "Chaining: OFF (3 Chimes)",
        () => {
          sim.chaining = !sim.chaining;
          chainBtn.textContent = sim.chaining
            ? "Chaining: ON (1 Chime)"
            : "Chaining: OFF (3 Chimes)";
          sim.runKernelStep();
          hi("switch", { min: 0.04 });
          drawCrayScope();
          syncStats();
        },
        "pri",
      );

      statsUi = Pt([
        ["mflops", "Sustained Rate"],
        ["spd", "Vector Speedup"],
        ["chain", "Chained Clocks"],
        ["unchain", "Unchained Clks"],
        ["scalar", "Scalar Loop"],
        ["vl", "Vector Length"],
      ]);

      el.append(
        Ie(
          "Cray-1 Vector Registers (V0–V7) & Hardware Chaining",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step Chime", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.runKernelStep();
              drawCrayScope();
              syncStats();
            }),
            chainBtn,
          ),
          We(
            "Vector Length (VL)",
            8,
            64,
            4,
            sim.VL,
            (v) => {
              sim.VL = v;
              sim.runKernelStep();
              drawCrayScope();
              syncStats();
            },
            (v) => `${v} elems`,
          ),
          We(
            "Scalar S1 (DAXPY α)",
            0.5,
            3.5,
            0.1,
            sim.alpha,
            (v) => {
              sim.alpha = v;
              sim.runKernelStep();
              drawCrayScope();
              syncStats();
            },
            (v) => v.toFixed(2),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 7;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.runKernelStep();
          if (ctx.diagram) {
            ctx.diagram.pulse("mem", "v0", "#58c4ff");
            ctx.diagram.pulse("v0", "fmul", "#f472b6");
            if (sim.chaining) ctx.diagram.pulse("fmul", "fadd", "#5fe08a");
          }
          drawCrayScope();
          if (machine._syncStats) machine._syncStats();
        }
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const c = new Cray1VectorCpu();
      const r = c.runKernelStep();
      return {
        ok: r.chainedClocks < r.unchainedClocks && c.speedupVsScalar > 15,
        mflops: +c.mflops.toFixed(1),
      };
    },
  };
  return machine;
}

function makeMachineCm2() {
  const sim = new ConnectionMachineCM2();
  let running = true;
  let stepAcc = 0;
  let ledFaces = [];
  let mon = null;
  let statsUi = null;

  function drawLedMatrixFaces() {
    for (let f = 0; f < ledFaces.length; f++) {
      const surf = ledFaces[f];
      const c = surf.ctx;
      c.fillStyle = "#080305";
      c.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = ((y + f * 3) & 15) * 16 + x;
          const on = sim.grid[idx];
          const px = 20 + x * 30;
          const py = 20 + y * 30;
          c.fillStyle = on ? "#ff1e2d" : "#2a080d";
          c.fillRect(px, py, 20, 14);
          if (on) {
            c.fillStyle = "#ff9ca3";
            c.fillRect(px + 4, py + 3, 12, 6);
          }
        }
      }
      surf.tex.needsUpdate = true;
    }
  }

  function drawCm2FrontEnd() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#09080c";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#991b1b";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#ffffff";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `THINKING MACHINES CM-2 · 65,536-PE SIMD HYPERCUBE · *LISP / C* FRONT-END (STEP ${sim.steps})`,
      26,
      46,
    );

    // Left: 16x16 SIMD PE Grid
    c.fillStyle = "#120f18";
    c.fillRect(20, 82, 456, 456);
    c.strokeStyle = "#ef4444";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 456, 456);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const on = sim.grid[y * 16 + x];
        c.fillStyle = on ? "#ef4444" : "#1f1926";
        c.fillRect(36 + x * 26.5, 98 + y * 26.5, 23, 23);
      }
    }

    // Right: Feynman/Hillis 8-Dim e-Cube Hypercube Router Load
    c.fillStyle = "#120f18";
    c.fillRect(496, 82, 508, 456);
    c.strokeStyle = "#f59e0b";
    c.strokeRect(496, 82, 508, 456);
    c.fillStyle = "#fde68a";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("12-DIM / 8-DIM HYPERCUBE e-CUBE XOR ROUTER", 514, 112);
    for (let d = 0; d < 8; d++) {
      const ly = 142 + d * 46;
      const load = sim.dimLoads[d];
      c.fillStyle = "#cbd5e1";
      c.font = '600 14px "JetBrains Mono", monospace';
      c.fillText(`DIM ${d} (XOR bit ${1 << d})`, 514, ly + 18);
      c.fillStyle = "#27272a";
      c.fillRect(700, ly, 230, 24);
      c.fillStyle = "#ef4444";
      c.fillRect(700, ly, Math.min(230, load * 5.5), 24);
      c.fillStyle = "#fca5a5";
      c.fillText(`${load}`, 940, ly + 18);
    }

    // Bottom: Hillis-Steele O(log2 N) Parallel Prefix Scan Result
    c.fillStyle = "#120f18";
    c.fillRect(20, 556, W - 40, 188);
    c.strokeStyle = "#38bdf8";
    c.strokeRect(20, 556, W - 40, 188);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "HILLIS–STEELE O(log₂ N) DATA-PARALLEL PREFIX SCAN (+-REDUCE / SCAN PRIMITIVE)",
      36,
      586,
    );
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillStyle = "#94a3b8";
    c.fillText(
      "IN : " +
        Array.from(sim.scanIn)
          .map((v) => String(v).padStart(3))
          .join(" "),
      36,
      632,
    );
    c.fillStyle = "#34d399";
    c.fillText(
      "OUT: " +
        Array.from(sim.scanOut)
          .map((v) => String(v).padStart(3))
          .join(" "),
      36,
      676,
    );
    c.fillStyle = "#fbbf24";
    c.fillText(
      `Total Hypercube Packets Routed: ${sim.routedPackets.toLocaleString()} · Active PEs: ${sim.activePop || 128}/256`,
      36,
      720,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "cm2",
    era: "1987",
    short: "CM-2 Hypercube",
    name: "Thinking Machines Connection Machine CM-2",
    group: "super",
    view0: 0.52,
    blurb:
      "MIT AI Lab spinout by Danny Hillis (with Richard Feynman designing the hypercube router and Tamiko Thiel sculpting the iconic Cube-of-8-Cubes): 65,536 1-bit SIMD processors execute broadcast *Lisp / C* instructions in lockstep while crimson status LEDs shimmer across its smoked-acrylic faces.",
    diagram: {
      nodes: [
        { id: "fe", label: "Symbolics / VAX FE", x: 0.16, y: 0.5, color: "#38bdf8" },
        { id: "seq", label: "Micro-Sequencer", x: 0.4, y: 0.5, color: "#ffb347" },
        { id: "pe", label: "65,536 1-Bit PEs", x: 0.68, y: 0.24, color: "#ff2e3d" },
        { id: "fpu", label: "Weitek FPUs", x: 0.68, y: 0.78, color: "#5fe08a" },
        { id: "hyp", label: "12-D XOR Router", x: 0.9, y: 0.5, color: "#f472b6" },
      ],
      edges: [
        ["fe", "seq", "*Lisp"],
        ["seq", "pe", "SIMD uInst"],
        ["pe", "fpu", "Slice"],
        ["pe", "hyp", "e-Cube"],
        ["hyp", "pe", "XOR Hop"],
      ],
    },
    build(kit) {
      ledFaces = [];
      // 1. ICONIC 2x2x2 CUBE-OF-CUBES BLACK MONOLITH (1.5 m^3)
      const cubeRoot = kit.group([-0.46, 0, 0], {
        name: "CM-2 Cube-of-Cubes Monolith",
        info: "Eight subcubes separated by illuminated cross-aisles; houses 4,096 custom chips (16 1-bit PEs + hypercube router node per chip = 65,536 processors).",
      });
      kit.box(
        1.56,
        0.1,
        1.56,
        U.darkAnodized(0x111318),
        [0, 0.05, 0],
        {
          name: "Air-Plenum Base Skirt",
        },
        cubeRoot,
      );

      let faceCount = 0;
      for (const sx of [-1, 1]) {
        for (const sy of [0, 1]) {
          for (const sz of [-1, 1]) {
            const sub = kit.group(
              [sx * 0.36, 0.44 + sy * 0.68, sz * 0.36],
              {
                name: `Hypercube Subcube Octant (${sx > 0 ? "+X" : "-X"},${sy ? "+Y" : "-Y"},${sz > 0 ? "+Z" : "-Z"})`,
                info: "Contains 8,192 1-bit SIMD processing elements, Weitek floating-point accelerators, and dimension-order hypercube router planes.",
                explode: [sx * 0.28, (sy - 0.3) * 0.28, sz * 0.28],
              },
              cubeRoot,
            );
            kit.box(
              0.62,
              0.6,
              0.62,
              U.darkAnodized(0x121317),
              [0, 0, 0],
              {
                shell: true,
                name: "Smoked Lexan Subcube Housing",
              },
              sub,
            );
            // Internal vertical PCB blades visible in cutaway!
            for (let b = 0; b < 5; b++) {
              kit.box(
                0.52,
                0.5,
                0.014,
                U.pcb(0x184e35),
                [0, 0, -0.2 + b * 0.1],
                {
                  name: "CM-2 16-PE + Router PCB Blade",
                },
                sub,
              );
            }
            // Live Crimson LED Matrix Planes on front/side exterior of the monolith!
            if (sz > 0) {
              const surf = zi(
                kit,
                0.52,
                0.5,
                [0, 0, 0.314],
                [512, 512],
                {
                  name: "Crimson Diagnostic PE LED Matrix",
                  info: "Iconic 4,096 red LEDs shimmering in real time with each PE's 1-bit flag register.",
                },
                sub,
              );
              ledFaces.push(surf);
              faceCount++;
            }
          }
        }
      }

      // Glowing crimson central cross-aisle spine inside the monolith
      kit.box(
        0.06,
        1.32,
        1.38,
        U.glow(0xdc2626, 0.85),
        [0, 0.78, 0],
        {
          name: "Central Hypercube Router Backplane",
          info: "12-dimensional packet-switched hypercube crossbar routing messages via Feynman's XOR dimension-order algorithm.",
        },
        cubeRoot,
      );

      // 2. SYMBOLICS / VAX FRONT-END HOST CONSOLE (Right)
      const host = kit.group([0.92, 0, 0.14], {
        rot: [0, 0.04, 0],
        name: "Symbolics / VAX Front-End Host",
        info: "Compiles *Lisp and C* parallel programs and streams SIMD microinstructions to the CM-2 sequencer.",
      });
      kit.box(1.04, 0.64, 0.72, U.darkAnodized(0x1f2430), [0, 0.32, 0], {}, host);
      mon = buildMonitor3D(
        kit,
        [0, 0.64, -0.04],
        {
          w: 0.82,
          h: 0.6,
          crt: true,
          color: 0xd5cfc2,
          name: "*Lisp / C* Parallel Front-End Display",
          explode: [0, 0.26, 0],
        },
        host,
      );
      buildSculptedKeyboard(
        kit,
        [0, 0.65, 0.25],
        { w: 0.48, d: 0.18, name: "Symbolics Lisp Keyboard" },
        host,
      );

      drawLedMatrixFaces();
      drawCm2FrontEnd();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("pop", `${sim.activePop || 128} / 256 active`);
        statsUi.set("steps", `${sim.steps} SIMD broadcasts`);
        statsUi.set("pkts", `${sim.routedPackets.toLocaleString()} XOR hops`);
        statsUi.set("scan", `${sim.scanOut[15]} (4 log₂ steps)`);
        statsUi.set("arch", "65,536 1-bit PEs");
        statsUi.set("topo", "12-Dim Hypercube");
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
        ["pop", "Active SIMD PEs"],
        ["steps", "Lockstep Cycles"],
        ["pkts", "Hypercube Hops"],
        ["scan", "Prefix Scan [15]"],
        ["arch", "Full Machine"],
        ["topo", "Interconnect"],
      ]);

      el.append(
        Ie(
          "CM-2 Data-Parallel SIMD & Hypercube Router",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step SIMD", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.step();
              drawLedMatrixFaces();
              drawCm2FrontEnd();
              syncStats();
            }),
            Fe(
              "Run Hillis–Steele Scan",
              () => {
                for (let i = 0; i < 16; i++)
                  sim.scanIn[i] = ((sim.steps + i * 3) % 9) + 1;
                sim.runParallelPrefixScan();
                if (ctx.diagram) ctx.diagram.pulse("pe", "hyp", "#f472b6");
                hi("tick", { f: 980, v: 0.08, min: 0.04 });
                drawCm2FrontEnd();
                syncStats();
              },
              "pri",
            ),
            Fe("Re-Seed Grid", () => {
              sim.seedPattern();
              drawLedMatrixFaces();
              drawCm2FrontEnd();
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
        stepAcc += dt * 6;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("fe", "seq", "#38bdf8");
            ctx.diagram.pulse("seq", "pe", "#ff2e3d");
            ctx.diagram.pulse("pe", "hyp", "#f472b6");
          }
          drawLedMatrixFaces();
          drawCm2FrontEnd();
          if (machine._syncStats) machine._syncStats();
        }
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const cm = new ConnectionMachineCM2();
      const out = cm.runParallelPrefixScan();
      const sum = cm.scanIn.reduce((a, b) => a + b, 0);
      return {
        ok: out[15] === sum && cm.routeHypercube(0, 0b1011) === 3,
        scan15: out[15],
      };
    },
  };
  return machine;
}

function makeMachineBgene() {
  const sim = new BlueGeneTorusMpi();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let statsUi = null;

  function drawBgeneMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060c18";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#1d4ed8";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#ffffff";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `IBM BLUE GENE/P · 3D-TORUS MPI STENCIL + HARDWARE ALLREDUCE (ITER ${sim.iters} · RES=${sim.residual.toFixed(3)})`,
      26,
      46,
    );

    // Left: 12x12 Slice of 3D Periodic Torus Heat/Poisson Field
    c.fillStyle = "#0c1629";
    c.fillRect(20, 82, 460, 460);
    c.strokeStyle = "#3b82f6";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 460, 460);
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const val = sim.field[1 * 144 + y * 12 + x];
        const norm = Math.max(0, Math.min(1, (val + 5) / 45));
        const r = Math.round(30 + 225 * norm);
        const g = Math.round(80 + 130 * Math.sin(norm * Math.PI));
        const b = Math.round(230 * (1 - norm * 0.7));
        c.fillStyle = `rgb(${r},${g},${b})`;
        c.fillRect(36 + x * 35.5, 98 + y * 35.5, 32, 32);
      }
    }

    // Right: Amdahl Strong-Scaling vs Gustafson Weak-Scaling Curves up to 65,536 Ranks!
    c.fillStyle = "#0c1629";
    c.fillRect(500, 82, 504, 460);
    c.strokeStyle = "#38bdf8";
    c.strokeRect(500, 82, 504, 460);
    c.fillStyle = "#93c5fd";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      `AMDAHL vs GUSTAFSON SCALING (Serial f = ${(sim.serialFrac * 100).toFixed(1)}%)`,
      518,
      112,
    );

    const ranks = [1, 4, 16, 64, 256, 1024, 4096, 16384, 65536];
    ranks.forEach((P, idx) => {
      const y = 148 + idx * 42;
      const amd = sim.amdahlSpeedup(P);
      const gus = sim.gustafsonSpeedup(P);
      c.fillStyle = "#cbd5e1";
      c.font = '600 13px "JetBrains Mono", monospace';
      c.fillText(`P=${String(P).padStart(5)}`, 518, y + 16);
      // Log-scaled bars (10^0 .. 10^5)
      const wAmd = (Math.log10(Math.max(1, amd)) / 5) * 180;
      const wGus = (Math.log10(Math.max(1, gus)) / 5) * 180;
      c.fillStyle = "#f59e0b";
      c.fillRect(610, y + 2, Math.max(4, wAmd), 10);
      c.fillStyle = "#10b981";
      c.fillRect(610, y + 14, Math.max(4, wGus), 10);
      c.fillStyle = "#fde68a";
      c.fillText(`A:${amd.toFixed(1)}× G:${Math.round(gus)}×`, 800, y + 16);
    });

    // Bottom MPI Collective Summary
    c.fillStyle = "#0c1629";
    c.fillRect(20, 560, W - 40, 182);
    c.strokeStyle = "#10b981";
    c.strokeRect(20, 560, W - 40, 182);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "5-NETWORK PETASCALE ARCHITECTURE: 3D TORUS + COLLECTIVE BINARY TREE",
      36,
      592,
    );
    c.fillStyle = "#e2e8f0";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      `±X/±Y/±Z Torus Halo Exchanges: ${sim.haloMessages.toLocaleString()} msgs   |   Hardware Tree MPI_Allreduce: ${sim.allreduceCalls} (< 2.5 µs latency)`,
      36,
      638,
    );
    c.fillStyle = "#93c5fd";
    c.fillText(
      `At 65,536 cores: Amdahl Strong Speedup = ×${sim.amdahlSpeedup(65536).toFixed(1)}  vs  Gustafson Scaled Speedup = ×${Math.round(sim.gustafsonSpeedup(65536)).toLocaleString()}`,
      36,
      686,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "bgene",
    era: "2008",
    short: "Blue Gene Torus",
    name: "IBM Blue Gene Petascale 3D-Torus MPI Supercomputer",
    group: "super",
    view0: 0.38,
    blurb:
      "Conceived to fold proteins at the petascale by trading hot gigahertz clocks for tens of thousands of cool, low-power embedded SoCs wired into a 3D Periodic Torus (±X, ±Y, ±Z nearest-neighbor stencil halos) plus a dedicated hardware binary tree computing global MPI_Allreduce across 72+ racks in microseconds.",
    diagram: {
      nodes: [
        { id: "soc", label: "Low-Power Quad SoCs", x: 0.2, y: 0.28, color: "#60a5fa" },
        { id: "torus", label: "3D ±X±Y±Z Torus", x: 0.54, y: 0.24, color: "#38bdf8" },
        { id: "tree", label: "HW Allreduce Tree", x: 0.54, y: 0.68, color: "#34d399" },
        { id: "bar", label: "Global Barrier Net", x: 0.2, y: 0.72, color: "#fbbf24" },
        { id: "io", label: "10GbE Parallel FS", x: 0.86, y: 0.48, color: "#c08cff" },
      ],
      edges: [
        ["soc", "torus", "6-Nbr Halo"],
        ["torus", "soc", "Wrap"],
        ["soc", "tree", "FP Sum"],
        ["soc", "bar", "Sync"],
        ["tree", "io", "Checkpoint"],
      ],
    },
    build(kit) {
      // 3 Iconic Sloped-Front Dark-Sapphire Blue Gene Racks!
      for (let r = 0; r < 3; r++) {
        const rx = -1.05 + r * 0.72;
        const rack = kit.group([rx, 0, -0.08], {
          name: `Blue Gene/P Sloped Cabinet ${r + 1}`,
          info: "Signature angled sapphire-blue cabinet engineered for side-to-top diagonal laminar cooling across 32 node cards (1,024 cores per rack).",
          explode: [(r - 1) * 0.34, 0, 0],
        });
        // Main vertical body + iconic angled front prism shroud (shell: true)
        kit.box(
          0.62,
          1.96,
          0.86,
          U.darkAnodized(0x102347),
          [0, 0.98, 0],
          {
            shell: true,
            name: "Sapphire Laminar-Airflow Cabinet Shell",
          },
          rack,
        );
        kit.box(
          0.6,
          1.88,
          0.14,
          U.plastic(0x1d4ed8, 0.36),
          [0, 0.96, 0.44],
          {
            rot: [-0.11, 0, 0],
            shell: true,
            name: "Angled Blue Gene Front Baffle",
          },
          rack,
        );

        // Internal 2x16 Node Cards + Compute ASICs visible in cutaway
        for (let nc = 0; nc < 8; nc++) {
          const card = kit.box(
            0.5,
            0.02,
            0.68,
            U.pcb(0x154c38),
            [0, 0.3 + nc * 0.2, -0.02],
            {
              name: "32-Chip Compute Node Card",
              info: "Packs 32 PowerPC 450 quad-core SoCs with integrated DDR controllers and 5-network routers.",
            },
            rack,
          );
          for (let ch = 0; ch < 4; ch++) {
            kit.box(0.08, 0.025, 0.08, U.alu(), [-0.16 + ch * 0.11, 0.02, 0.1], {}, card);
          }
        }
      }

      // 3-Axis Periodic Torus Wraparound Optical Cables (±X cyan, ±Y emerald, ±Z amber)
      kit.tube(
        [
          [-1.25, 1.88, 0.1],
          [-0.33, 2.16, 0.1],
          [0.58, 1.88, 0.1],
        ],
        0.016,
        U.glow(0x38bdf8, 1.2),
        {
          name: "X-Axis Periodic Torus Wraparound Link",
          info: "Connects the +X boundary rack directly back to -X with zero switch hops.",
        },
      );
      kit.tube(
        [
          [-1.05, 0.25, -0.54],
          [-1.05, 1.05, -0.72],
          [-1.05, 1.85, -0.54],
        ],
        0.015,
        U.glow(0x34d399, 1.2),
        {
          name: "Y-Axis Periodic Torus Wraparound Link",
          info: "Wraps vertical midplane columns into a boundary-free torus.",
        },
      );
      kit.tube(
        [
          [-1.05, 2.02, -0.25],
          [-0.33, 2.24, -0.25],
          [0.39, 2.02, -0.25],
        ],
        0.015,
        U.glow(0xfbbf24, 1.25),
        {
          name: "Global Hardware MPI_Allreduce Tree Trunk",
          info: "Dedicated ALU-in-network binary tree performing floating-point reductions in <2.5 microseconds.",
        },
      );

      // Operator Console (Right)
      mon = buildMonitor3D(kit, [1.22, 0.62, 0.14], {
        w: 0.88,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "Blue Gene MPI & Scaling Console",
        explode: [0.35, 0, 0],
      });
      kit.box(0.98, 0.62, 0.54, U.darkAnodized(0x162033), [1.22, 0.31, 0.14], {
        rot: [0, 0.04, 0],
        name: "Service Node Console Pedestal",
      });

      drawBgeneMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("res", sim.residual.toFixed(4));
        statsUi.set("halo", `${sim.haloMessages.toLocaleString()} msgs`);
        statsUi.set("red", `${sim.allreduceCalls} tree ops`);
        statsUi.set("amd", `×${sim.amdahlSpeedup(65536).toFixed(1)} (64K cores)`);
        statsUi.set(
          "gus",
          `×${Math.round(sim.gustafsonSpeedup(65536)).toLocaleString()}`,
        );
        statsUi.set("topo", "4×4×4 3D Torus");
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
        ["res", "L2 PDE Residual"],
        ["halo", "Torus Halo Msgs"],
        ["red", "MPI_Allreduce"],
        ["amd", "Amdahl Speedup"],
        ["gus", "Gustafson Scaled"],
        ["topo", "Rank Topology"],
      ]);

      el.append(
        Ie(
          "3D-Torus MPI Stencil & Amdahl vs. Gustafson Scaling",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step Stencil", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.step();
              drawBgeneMonitor();
              syncStats();
            }),
            Fe(
              "Inject Heat Pulse",
              () => {
                sim.injectHeatPulse();
                if (ctx.diagram) ctx.diagram.pulse("soc", "torus", "#38bdf8");
                hi("coil", { v: 0.5, min: 0.08 });
                drawBgeneMonitor();
                syncStats();
              },
              "pri",
            ),
          ),
          We(
            "Serial Fraction (f)",
            0.002,
            0.1,
            0.002,
            sim.serialFrac,
            (v) => {
              sim.serialFrac = v;
              drawBgeneMonitor();
              syncStats();
            },
            (v) => `${(v * 100).toFixed(1)}%`,
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 6;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("soc", "torus", "#38bdf8");
            ctx.diagram.pulse("soc", "tree", "#34d399");
          }
          drawBgeneMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const b = new BlueGeneTorusMpi();
      b.step();
      return {
        ok: b.amdahlSpeedup(65536) < 51 && b.gustafsonSpeedup(65536) > 60000,
        residual: +b.residual.toFixed(4),
      };
    },
  };
  return machine;
}

function makeMachineExascale() {
  const sim = new ExascaleDragonflySim();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let statsUi = null;

  function drawExaMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060b12";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#0f766e";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#ffffff";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `FRONTIER EXASCALE · 1.194 ExaFLOPS (10^18 FP64/s) · ${sim.gflopsPerWatt.toFixed(1)} GFLOPS/W · ${sim.outletTempC.toFixed(1)}°C WATER`,
      26,
      46,
    );

    // Left: Mixed-Precision HPL Residual Drop (FP32 LU -> FP64 Iterative Refinement)
    c.fillStyle = "#0d1624";
    c.fillRect(20, 82, 480, 420);
    c.strokeStyle = "#14b8a6";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 480, 420);
    c.fillStyle = "#5eead4";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("MIXED-PRECISION HPL-AI LU REFINEMENT", 38, 112);

    const logFp32 = Math.max(-16, Math.log10(Math.max(1e-16, sim.fp32Residual)));
    const logFp64 = Math.max(-16, Math.log10(Math.max(1e-16, sim.hplResidual)));
    const stages = [
      ["RHS ||b||₂ Initial", 0.6, "#94a3b8"],
      [`FP32 Tensor LU (${sim.fp32Residual.toExponential(1)})`, logFp32, "#f59e0b"],
      [`FP64 Refined (${sim.hplResidual.toExponential(1)})`, logFp64, "#10b981"],
    ];
    stages.forEach(([lbl, lg, col], idx) => {
      const sy = 156 + idx * 104;
      c.fillStyle = "#e2e8f0";
      c.font = '700 14px "JetBrains Mono", monospace';
      c.fillText(lbl, 38, sy);
      c.fillStyle = "#1e293b";
      c.fillRect(38, sy + 14, 430, 34);
      const norm = Math.max(0.05, (lg + 16) / 17);
      c.fillStyle = col;
      c.fillRect(38, sy + 14, 430 * norm, 34);
    });

    // Right: 8-Group HPE Slingshot Dragonfly Optical Ring (UGAL Adaptive vs Minimal)
    c.fillStyle = "#0d1624";
    c.fillRect(520, 82, 484, 420);
    c.strokeStyle = "#38bdf8";
    c.strokeRect(520, 82, 484, 420);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      `SLINGSHOT DRAGONFLY 8-GROUP (${sim.adaptiveRouting ? "UGAL ADAPTIVE" : "MINIMAL HOTSPOT"})`,
      536,
      112,
    );
    const cx = 762,
      cy = 308,
      rad = 138;
    const gPts = Array.from({ length: 8 }, (_, g) => {
      const a = (g / 8) * Math.PI * 2 - Math.PI / 2;
      return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
    });
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        c.strokeStyle = "rgba(56, 189, 248, 0.25)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(gPts[i][0], gPts[i][1]);
        c.lineTo(gPts[j][0], gPts[j][1]);
        c.stroke();
      }
    }
    gPts.forEach(([gx, gy], g) => {
      const ld = sim.groupLoads[g];
      c.beginPath();
      c.arc(gx, gy, 28, 0, Math.PI * 2);
      c.fillStyle = ld > 0.78 ? "#991b1b" : "#0f766e";
      c.fill();
      c.strokeStyle = ld > 0.78 ? "#fca5a5" : "#5eead4";
      c.lineWidth = 3;
      c.stroke();
      c.fillStyle = "#ffffff";
      c.font = '700 13px "JetBrains Mono", monospace';
      c.fillText(`G${g}`, gx - 10, gy - 3);
      c.fillText(`${Math.round(ld * 100)}%`, gx - 14, gy + 14);
    });

    // Bottom Warm-Water Cooling & Power Telemetry
    c.fillStyle = "#0d1624";
    c.fillRect(20, 522, W - 40, 222);
    c.strokeStyle = "#f59e0b";
    c.strokeRect(20, 522, W - 40, 222);
    c.fillStyle = "#fcd34d";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("WARM-WATER DIRECT LIQUID COOLING (CDU) & GREEN500 TELEMETRY", 38, 554);
    c.fillStyle = "#e2e8f0";
    c.font = '600 16px "JetBrains Mono", monospace';
    c.fillText(
      `Supply Manifold: ${sim.inletTempC.toFixed(1)} °C  ->  Copper Coldplates (9,408 Nodes / 37,632 GPUs)  ->  Return: ${sim.outletTempC.toFixed(1)} °C`,
      38,
      604,
    );
    c.fillStyle = "#5eead4";
    c.fillText(
      `Facility Power: ${sim.powerMW} MW (vs ~150 MW air-cooled!)  |  Sustained HPL: 1.194 × 10^18 FP64 ops/sec`,
      38,
      656,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "exascale",
    era: "2022",
    short: "Frontier 1.2 EF",
    name: "Frontier-Class Liquid-Cooled Exascale Supercomputer",
    group: "super",
    view0: 0.36,
    blurb:
      "Humanity's first verified ExaFLOPS computer (ORNL Frontier, May 2022 — 1.194 × 10¹⁸ FP64 ops/s across 74 Olympus racks and 37,632 multi-die GPUs): combines warm-water (32 °C) copper coldplates, 3-hop HPE Slingshot Dragonfly UGAL adaptive optical routing, and mixed-precision iterative refinement.",
    diagram: {
      nodes: [
        { id: "cpu", label: "64c Host CPU", x: 0.18, y: 0.28, color: "#60a5fa" },
        { id: "gpu", label: "4× HBM2e GCDs", x: 0.48, y: 0.24, color: "#14b8a6" },
        { id: "nic", label: "4× 200G Slingshot", x: 0.82, y: 0.28, color: "#38bdf8" },
        { id: "dfly", label: "Dragonfly Optical", x: 0.82, y: 0.72, color: "#c08cff" },
        { id: "cdu", label: "32°C Water CDU", x: 0.32, y: 0.76, color: "#fbbf24" },
      ],
      edges: [
        ["cpu", "gpu", "xGMI"],
        ["gpu", "nic", "GPUDirect"],
        ["nic", "dfly", "UGAL 3-Hop"],
        ["cdu", "gpu", "Coldplate"],
      ],
    },
    build(kit) {
      // 1. OLYMPUS EXASCALE LIQUID-COOLED COMPUTE CABINET + CDU UNIT
      const cab = kit.group([-0.55, 0, 0], {
        name: "Exascale Liquid-Cooled Compute Cabinet",
        info: "3.5-ton high-density rack packing 64 liquid-cooled blades (256 multi-die GPUs = ~17 PetaFLOPS per rack) and 32 Slingshot Rosetta switches.",
      });
      kit.box(
        1.12,
        2.2,
        1.08,
        U.darkAnodized(0x121923),
        [0, 1.1, 0],
        {
          shell: true,
          name: "Olympus High-Density Rack Enclosure",
          explode: [-0.45, 0.2, 0],
        },
        cab,
      );
      // Teal geometric accent trim
      kit.box(
        0.05,
        2.08,
        0.04,
        U.glow(0x14b8a6, 1.3),
        [-0.52, 1.1, 0.54],
        { shell: true },
        cab,
      );
      kit.box(
        0.05,
        2.08,
        0.04,
        U.glow(0x14b8a6, 1.3),
        [0.52, 1.1, 0.54],
        { shell: true },
        cab,
      );

      // 8 Blade Chassis Sub-Enclosures with Copper Coldplates & HBMChiplets
      for (let b = 0; b < 8; b++) {
        const by = 0.26 + b * 0.23;
        const blade = kit.group(
          [0, by, 0],
          {
            name: `4-GPU Liquid-Cooled Exascale Blade ${b + 1}`,
            info: "1× 64-core CPU + 4× Multi-Die HBM2e GPUs connected by coherent Infinity Fabric and cooled by micro-skived copper water blocks.",
            explode: [0, 0, 0.44],
          },
          cab,
        );
        kit.box(0.94, 0.15, 0.9, U.metal(0x222b38, 0.42), [0, 0, 0], {}, blade);
        kit.box(0.86, 0.016, 0.8, U.pcb(0x134e4a), [0, -0.02, 0], {}, blade);
        for (let g = 0; g < 4; g++) {
          kit.box(
            0.16,
            0.045,
            0.18,
            U.copper(),
            [-0.27 + g * 0.18, 0.02, 0.06],
            {
              name: "GPU HBM Coldplate Block",
            },
            blade,
          );
        }
      }

      // Vertical Blue Supply (32°C) & Warm-Amber Return (41.4°C) Stainless Coolant Manifolds!
      kit.cyl(
        0.036,
        0.036,
        2.02,
        U.plastic(0x0284c7, 0.28),
        [-0.44, 1.1, 0.46],
        {
          name: "32 °C Warm-Water Supply Manifold",
          info: "Delivers 32 °C treated water through dripless blind-mate quick disconnects, eliminating energy-hungry chillers.",
          explode: [-0.35, 0, 0.35],
        },
        cab,
      );
      kit.cyl(
        0.036,
        0.036,
        2.02,
        U.plastic(0xd97706, 0.28),
        [0.44, 1.1, 0.46],
        {
          name: "41.4 °C Heated Return Manifold",
          info: "Carries 350+ kW of captured rack heat out to cooling towers.",
          explode: [0.35, 0, 0.35],
        },
        cab,
      );

      // Rear Slingshot Dragonfly Optical Switch Cartridge
      kit.box(
        0.86,
        0.46,
        0.18,
        U.metal(0x1e3a5f, 0.35),
        [0, 1.15, -0.46],
        {
          name: "HPE Slingshot Rosetta 64-Port Switch",
          info: "25.6 Tbps Dragonfly router limiting any node-to-node communication across 9,408 nodes to at most 3 optical hops.",
          explode: [0, 0, -0.45],
        },
        cab,
      );

      // Side Coolant Distribution Unit (CDU) + Console Monitor (Right)
      const cdu = kit.group([0.48, 0, -0.15], {
        name: "Coolant Distribution Unit (CDU)",
        info: "Stainless plate-and-frame liquid-to-liquid heat exchanger and variable-frequency redundant pumps.",
        explode: [0.3, 0, -0.25],
      });
      kit.box(0.56, 1.72, 0.78, U.steel(), [0, 0.86, 0], {}, cdu);

      mon = buildMonitor3D(kit, [0.95, 0.64, 0.34], {
        w: 0.88,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "Frontier HPL & Dragonfly Telemetry Display",
        explode: [0.36, 0, 0.2],
      });
      kit.box(0.98, 0.64, 0.52, U.darkAnodized(0x151e29), [0.95, 0.32, 0.34], {
        rot: [0, 0.04, 0],
      });

      drawExaMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("ef", `${sim.exaflops} ExaFLOPS`);
        statsUi.set("fp32", sim.fp32Residual.toExponential(2));
        statsUi.set("fp64", sim.hplResidual.toExponential(2));
        statsUi.set("route", sim.adaptiveRouting ? "UGAL Adaptive" : "Minimal (Hot)");
        statsUi.set(
          "temp",
          `${sim.inletTempC.toFixed(1)} -> ${sim.outletTempC.toFixed(1)} °C`,
        );
        statsUi.set("eff", `${sim.gflopsPerWatt.toFixed(1)} GFLOPS/W`);
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      const ugalBtn = Fe(
        sim.adaptiveRouting ? "UGAL Adaptive: ON" : "UGAL Adaptive: OFF",
        () => {
          sim.adaptiveRouting = !sim.adaptiveRouting;
          ugalBtn.textContent = sim.adaptiveRouting
            ? "UGAL Adaptive: ON"
            : "UGAL Adaptive: OFF";
          sim.solveMixedPrecisionHPL();
          drawExaMonitor();
          syncStats();
        },
        "pri",
      );

      statsUi = Pt([
        ["ef", "Sustained HPL"],
        ["fp32", "FP32 LU Residual"],
        ["fp64", "FP64 Refined Res"],
        ["route", "Dragonfly Mode"],
        ["temp", "Coolant ΔT"],
        ["eff", "Green500 Eff"],
      ]);

      el.append(
        Ie(
          "Mixed-Precision Exascale HPL & Slingshot Dragonfly",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step HPL Solve", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.solveMixedPrecisionHPL();
              drawExaMonitor();
              syncStats();
            }),
            ugalBtn,
          ),
          We(
            "Warm-Water Inlet Temp",
            22,
            40,
            1,
            sim.inletTempC,
            (v) => {
              sim.inletTempC = v;
              sim.solveMixedPrecisionHPL();
              drawExaMonitor();
              syncStats();
            },
            (v) => `${v} °C`,
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 3.2;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("cpu", "gpu", "#14b8a6");
            ctx.diagram.pulse("gpu", "nic", "#38bdf8");
            ctx.diagram.pulse("nic", "dfly", "#c08cff");
          }
          drawExaMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const e = new ExascaleDragonflySim();
      const r = e.solveMixedPrecisionHPL();
      return { ok: r.fp64Res < 1e-11 && r.fp64Res < r.fp32Res, fp64Res: r.fp64Res };
    },
  };
  return machine;
}

function makeMachineGb200() {
  const sim = new BlackwellAiRackSim();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let switchGlows = [];
  let statsUi = null;

  function drawBlackwellMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#070a09";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#3f6212";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#f7fee7";
    c.font = '700 20px "JetBrains Mono", monospace';
    const pflops = sim.precision === "FP4" ? 1440 : 720;
    c.fillText(
      `BLACKWELL GB200 NVL72 · 72 GPUs / 130 TB/s NVLINK · ${sim.precision} (${pflops} PFLOPS) · LOSS=${sim.loss.toFixed(4)}`,
      26,
      46,
    );

    // Left: Live Gradient-Descent Training Loss Curve
    c.fillStyle = "#0e1512";
    c.fillRect(20, 82, 520, 380);
    c.strokeStyle = "#84cc16";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 520, 380);
    c.fillStyle = "#bef264";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("LIVE TOP-2 SPARSE MoE TRAINING LOSS (STEP " + sim.steps + ")", 38, 112);

    if (sim.lossHistory.length > 1) {
      c.strokeStyle = "#84cc16";
      c.lineWidth = 3.5;
      c.beginPath();
      sim.lossHistory.forEach((lv, idx) => {
        const px = 40 + (idx / Math.max(1, sim.lossHistory.length - 1)) * 480;
        const py = 430 - Math.min(290, lv * 260);
        if (idx === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      });
      c.stroke();
    }

    // Right: 4-Expert All-to-All NVLink Dispatch Utilization
    c.fillStyle = "#0e1512";
    c.fillRect(560, 82, 444, 380);
    c.strokeStyle = "#22c55e";
    c.strokeRect(560, 82, 444, 380);
    c.fillStyle = "#86efac";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("NVLINK ALL-TO-ALL MoE DISPATCH", 578, 112);
    const maxCnt = Math.max(1, ...sim.expertCounts);
    for (let e = 0; e < 4; e++) {
      const ey = 148 + e * 72;
      const isTop = sim.lastTopExperts && sim.lastTopExperts.includes(e);
      c.fillStyle = isTop ? "#bef264" : "#94a3b8";
      c.font = '700 15px "JetBrains Mono", monospace';
      c.fillText(
        `EXPERT ${e} (GPUs ${e * 18}..${e * 18 + 17}) ${isTop ? "★ ACTIVE" : ""}`,
        578,
        ey,
      );
      c.fillStyle = "#1e293b";
      c.fillRect(578, ey + 10, 396, 28);
      c.fillStyle = isTop ? "#84cc16" : "#3b82f6";
      c.fillRect(578, ey + 10, 396 * (sim.expertCounts[e] / maxCnt), 28);
    }

    // Bottom: Rack-Scale Co-Design Summary
    c.fillStyle = "#0e1512";
    c.fillRect(20, 482, W - 40, 260);
    c.strokeStyle = "#eab308";
    c.strokeRect(20, 482, W - 40, 260);
    c.fillStyle = "#fde047";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "CO-PACKAGED RACK ARCHITECTURE: 36 GRACE CPUs + 72 BLACKWELL GPUs + 9 NVLINK SWITCHES",
      38,
      514,
    );
    c.fillStyle = "#e2e8f0";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      "• Rear Blind-Mate Copper Spine: 5,184 twinax differential pairs = 130 TB/s all-to-all (saves ~20 kW vs optical retimers!)",
      38,
      562,
    );
    c.fillText(
      "• Unified 30 TB Coherent HBM3e + LPDDR5X Memory Domain · 120 kW Direct-to-Chip Liquid Cooling",
      38,
      606,
    );
    c.fillStyle = "#bef264";
    c.fillText(
      `• Parallelism: TP=8 (Intra-Tray) × EP=4 (NVLink All-to-All) × PP=2  |  Transformer Engine: ${sim.precision}`,
      38,
      652,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "gb200",
    era: "2025",
    short: "Blackwell NVL72",
    name: "Blackwell NVL72 72-GPU Rack-Scale AI Supercomputer",
    group: "super",
    view0: 0.38,
    blurb:
      "When a single chip hits the reticle limit, the entire 120 kW liquid-cooled rack becomes one giant GPU: 18 compute trays (36 Grace CPUs + 72 dual-die Blackwell GPUs) blind-mate into a 5,000-wire copper NVLink spine (130 TB/s all-to-all) through 9 central NVLink Switch trays to train trillion-parameter Mixture-of-Experts models in FP8/FP4.",
    diagram: {
      nodes: [
        { id: "top9", label: "Top 9 GPU Trays", x: 0.22, y: 0.2, color: "#84cc16" },
        { id: "nvl", label: "9× NVLink Switches", x: 0.52, y: 0.48, color: "#eab308" },
        { id: "bot9", label: "Bot 9 GPU Trays", x: 0.22, y: 0.78, color: "#84cc16" },
        { id: "spine", label: "5,000-Wire Cu Spine", x: 0.84, y: 0.48, color: "#f97316" },
        { id: "ib", label: "800G InfiniBand", x: 0.84, y: 0.82, color: "#38bdf8" },
      ],
      edges: [
        ["top9", "nvl", "1.8TB/s/GPU"],
        ["bot9", "nvl", "1.8TB/s/GPU"],
        ["nvl", "spine", "130 TB/s"],
        ["spine", "nvl", "All-to-All"],
        ["nvl", "ib", "Scale-Out"],
      ],
    },
    build(kit) {
      switchGlows = [];
      // 1. 120 kW NVL72 RACK-SCALE LIQUID-COOLED MONOLITH
      const rack = kit.group([-0.48, 0, 0], {
        name: "GB200 NVL72 120 kW Rack",
        info: "48U Open-Rack v3 liquid-cooled AI supercomputer acting as a single 72-GPU coherent memory domain with 1.44 ExaFLOPS of FP4 tensor compute.",
      });
      kit.box(
        0.96,
        2.28,
        1.12,
        U.darkAnodized(0x111418),
        [0, 1.14, 0],
        {
          shell: true,
          name: "NVL72 Titanium-Black Rack Shell",
          explode: [-0.46, 0.2, 0],
        },
        rack,
      );

      // Bottom 9 Compute Trays + Middle 9 NVLink Switch Trays + Top 9 Compute Trays!
      for (let i = 0; i < 9; i++) {
        // Bottom compute bank
        const by = 0.22 + i * 0.068;
        kit.box(
          0.84,
          0.052,
          0.92,
          U.metal(0x232a34, 0.38),
          [0, by, 0.02],
          {
            name: `GB200 Compute Tray B${i + 1} (2 Grace + 4 Blackwell)`,
            info: "1U liquid-cooled tray carrying two 72-core Grace CPUs and four dual-reticle 208B-transistor Blackwell GPUs with 8 stacks of HBM3e each.",
            explode: [0, 0, 0.42],
          },
          rack,
        );
        // Top compute bank
        const ty = 1.46 + i * 0.068;
        kit.box(
          0.84,
          0.052,
          0.92,
          U.metal(0x232a34, 0.38),
          [0, ty, 0.02],
          {
            name: `GB200 Compute Tray T${i + 1} (2 Grace + 4 Blackwell)`,
            info: "1U liquid-cooled GB200 superchip tray blind-mated to the rear copper NVLink cartridge and coolant manifolds.",
            explode: [0, 0, 0.42],
          },
          rack,
        );
      }

      // Central 9 NVLink5 Switch Trays (The green/gold glowing heart of the rack!)
      for (let s = 0; s < 9; s++) {
        const sy = 0.86 + s * 0.062;
        const sw = kit.box(
          0.84,
          0.048,
          0.92,
          U.darkAnodized(0x1e2c18),
          [0, sy, 0.03],
          {
            name: `NVLink-5 14.4 TB/s Switch Tray ${s + 1}`,
            info: "Non-blocking NVLink crossbar ASIC with in-network SHARP FP8/FP4 reduction engines enabling 130 TB/s all-to-all MoE token dispatch.",
            explode: [0, 0, 0.52],
          },
          rack,
        );
        const gBar = kit.box(
          0.76,
          0.018,
          0.02,
          U.glow(0x84cc16, 1.45),
          [0, 0, 0.465],
          {},
          sw,
        );
        switchGlows.push(gBar);
      }

      // Iconic Rear 5,000-Coax Blind-Mate Copper NVLink Cartridge!
      const spine = kit.group(
        [0, 1.14, -0.48],
        {
          name: "5,000-Cable Blind-Mate Copper NVLink Spine",
          info: "Over 2 miles of ultra-low-loss twinax copper cables sealed inside rigid rear cartridges: carries 130 TB/s across 72 GPUs while saving ~20 kW per rack vs optical transceivers!",
          explode: [0, 0, -0.52],
        },
        rack,
      );
      kit.box(0.78, 1.94, 0.12, U.copper(), [0, 0, 0], {}, spine);
      for (let c = 0; c < 12; c++) {
        kit.cyl(0.012, 0.012, 1.88, U.gold(), [-0.33 + c * 0.06, 0, 0.065], {}, spine);
      }

      // Chrome Liquid-Cooling Manifolds along front-sides
      kit.cyl(
        0.028,
        0.028,
        2.08,
        U.steel(),
        [-0.42, 1.12, 0.48],
        {
          name: "Direct-to-Chip Coolant Supply Manifold",
        },
        rack,
      );
      kit.cyl(
        0.028,
        0.028,
        2.08,
        U.copper(),
        [0.42, 1.12, 0.48],
        {
          name: "Heated Coolant Return Manifold",
        },
        rack,
      );

      // 2. AI MEGACLUSTER CONSOLE (Right)
      mon = buildMonitor3D(kit, [0.84, 0.64, 0.12], {
        w: 0.9,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "MoE Frontier Training & NVLink Console",
        explode: [0.36, 0, 0],
      });
      kit.box(1.0, 0.64, 0.54, U.darkAnodized(0x161c18), [0.84, 0.32, 0.12], {
        rot: [0, 0.04, 0],
      });

      drawBlackwellMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("loss", sim.loss.toFixed(5));
        statsUi.set(
          "prec",
          sim.precision === "FP4" ? "NVFP4 (1,440 PF)" : "MXFP8 (720 PF)",
        );
        statsUi.set(
          "top2",
          sim.lastTopExperts
            ? `E${sim.lastTopExperts[0]} + E${sim.lastTopExperts[1]}`
            : "E0 + E1",
        );
        statsUi.set("nvl", "130.0 TB/s Cu");
        statsUi.set("hbm", "30 TB Unified");
        statsUi.set("pwr", "120 kW Liquid");
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      const precBtn = Fe(
        `Precision: ${sim.precision}`,
        () => {
          sim.precision = sim.precision === "FP8" ? "FP4" : "FP8";
          precBtn.textContent = `Precision: ${sim.precision}`;
          sim.step();
          drawBlackwellMonitor();
          syncStats();
        },
        "pri",
      );

      statsUi = Pt([
        ["loss", "MoE Train Loss"],
        ["prec", "Tensor Engine"],
        ["top2", "Active Top-2"],
        ["nvl", "NVLink5 Spine"],
        ["hbm", "Rack Memory"],
        ["pwr", "Thermal Envelope"],
      ]);

      el.append(
        Ie(
          "Trainable Top-2 Mixture-of-Experts over 130 TB/s NVLink",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step Grad Update", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.step();
              drawBlackwellMonitor();
              syncStats();
            }),
            precBtn,
            Fe("Reset Weights", () => {
              for (let i = 0; i < 16; i++) {
                sim.routerW[i] = Math.sin(i * 2.1 + sim.steps) * 0.6;
                sim.expertW[i] = Math.cos(i * 1.4 + sim.steps) * 0.6;
              }
              sim.loss = 0.95;
              sim.lossHistory = [0.95];
              drawBlackwellMonitor();
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
        stepAcc += dt * 7;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("top9", "nvl", "#84cc16");
            ctx.diagram.pulse("nvl", "spine", "#f97316");
            ctx.diagram.pulse("bot9", "nvl", "#84cc16");
          }
          drawBlackwellMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      switchGlows.forEach((g, idx) => {
        g.material.emissiveIntensity = 0.8 + 0.7 * Math.abs(Math.sin(t * 5 + idx * 0.6));
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const b = new BlackwellAiRackSim();
      const l0 = b.lossHistory[0];
      for (let i = 0; i < 60; i++) b.step();
      return { ok: b.loss < l0, loss: +b.loss.toFixed(4) };
    },
  };
  return machine;
}

function makeMachineCdc6600() {
  const sim = new Cdc6600Scoreboard();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let dd60Left = null;
  let dd60Right = null;
  let unitBars = [];
  let statsUi = null;

  function drawDd60RoundScopes() {
    if (!dd60Left || !dd60Right) return;
    for (const [surf, isRight] of [
      [dd60Left, false],
      [dd60Right, true],
    ]) {
      const c = surf.ctx;
      c.fillStyle = "#03140b";
      c.fillRect(0, 0, 256, 256);
      c.strokeStyle = "#22c55e";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(128, 128, 118, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "#4ade80";
      c.font = '700 14px "JetBrains Mono", monospace';
      if (!isRight) {
        c.fillText("CDC DD60 · X-REGS", 44, 52);
        ["X0", "X2", "X5", "X6", "X7"].forEach((rk, i) => {
          c.fillText(`${rk} = ${Number(sim.regs[rk]).toFixed(2)}`, 52, 86 + i * 28);
        });
      } else {
        c.fillText(`BARREL PP#${sim.ppSlot} · 100ns`, 38, 52);
        c.fillText(`CLK   = ${sim.clock}`, 52, 92);
        c.fillText(`RAW   = ${sim.rawStalls}`, 52, 122);
        c.fillText(`WAR   = ${sim.warStalls}`, 52, 152);
        c.fillText(`OoO   = ${sim.oooCompletions}`, 52, 182);
      }
      surf.tex.needsUpdate = true;
    }
  }

  function drawCdcMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060b12";
    c.fillRect(0, 0, W, H);

    c.fillStyle = "#14532d";
    c.fillRect(16, 14, W - 32, 52);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `1964 CDC 6600 SUPERCOMPUTER · THORNTON SCOREBOARD · MINOR CYCLE #${sim.clock} (10 MHz / 3 MFLOPS)`,
      26,
      47,
    );

    // Top Table: Instruction Scoreboard Stages (Issue | ReadOps | ExecDone | WriteResult)
    c.fillStyle = "#0b1422";
    c.fillRect(20, 80, W - 40, 268);
    c.strokeStyle = "#4ade80";
    c.lineWidth = 2;
    c.strokeRect(20, 80, W - 40, 268);
    c.fillStyle = "#86efac";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText(
      "INSTRUCTION STATUS      UNIT            ISSUE   READ_OPS   EXEC_DONE   WRITE_RES",
      36,
      108,
    );

    sim.instTable.forEach((row, idx) => {
      const ry = 122 + idx * 35;
      const inFlight = row.issue !== null && row.writeRes === null;
      c.fillStyle = inFlight ? "rgba(74, 222, 128, 0.18)" : "#0f172a";
      c.fillRect(32, ry, W - 64, 29);
      c.fillStyle = row.writeRes !== null ? "#34d399" : inFlight ? "#fde047" : "#94a3b8";
      c.font = '600 14px "JetBrains Mono", monospace';
      const fmt = (v) => (v === null ? "  —" : String(v).padStart(3, " "));
      c.fillText(
        `${row.asm.padEnd(23)} ${(row.unitName || "—").padEnd(15)}  ${fmt(row.issue)}      ${fmt(row.readOps)}        ${fmt(row.execDone)}         ${fmt(row.writeRes)}`,
        40,
        ry + 20,
      );
    });

    // Bottom-Left: 10 Parallel Functional Units Reservation Status (Fi, Fj, Fk, Qj, Qk, Rj, Rk)
    c.fillStyle = "#0b1422";
    c.fillRect(20, 364, 580, 380);
    c.strokeStyle = "#38bdf8";
    c.strokeRect(20, 364, 580, 380);
    c.fillStyle = "#7dd3fc";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText("10 PARALLEL FUNCTIONAL UNITS (Busy | Fi <- Fj,Fk | Rj,Rk)", 36, 392);

    sim.units.forEach((u, idx) => {
      const uy = 406 + idx * 32;
      c.fillStyle = u.busy ? "rgba(56, 189, 248, 0.22)" : "#0f172a";
      c.fillRect(32, uy, 554, 26);
      c.fillStyle = u.busy ? "#fde047" : "#64748b";
      c.font = '600 13px "JetBrains Mono", monospace';
      c.fillText(
        `${u.name.padEnd(14)} ${u.busy ? `BUSY(${u.rem}c)` : "IDLE    "}  Fi=${(u.fi || "-").padEnd(3)} Fj=${(u.fj || "-").padEnd(3)} Fk=${(u.fk || "-").padEnd(3)} Rj=${u.rj ? "Y" : "N"} Rk=${u.rk ? "Y" : "N"}`,
        40,
        uy + 18,
      );
    });

    // Bottom-Right: Hazard Telemetry & Barrel Peripheral Processors
    c.fillStyle = "#0b1422";
    c.fillRect(616, 364, 388, 380);
    c.strokeStyle = "#fbbf24";
    c.strokeRect(616, 364, 388, 380);
    c.fillStyle = "#fde047";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText("DYNAMIC OoO HAZARD TELEMETRY", 632, 392);

    c.fillStyle = "#e2e8f0";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(`RAW Stalls (Qj/Qk wait):  ${sim.rawStalls}`, 632, 434);
    c.fillStyle = "#f97316";
    c.fillText(`WAR Stalls (Write hold):  ${sim.warStalls}`, 632, 468);
    c.fillStyle = "#c08cff";
    c.fillText(`WAW Stalls (Issue hold):  ${sim.wawStalls}`, 632, 502);
    c.fillStyle = "#34d399";
    c.fillText(`Out-of-Order Retirements: ${sim.oooCompletions}`, 632, 536);

    c.fillStyle = "#94a3b8";
    c.font = '600 13.5px "JetBrains Mono", monospace';
    c.fillText("• Load/Store RISC-like ISA (12 yrs pre-RISC!)", 632, 588);
    c.fillText("• Freon-12 cooled cordwood Si modules", 632, 616);
    c.fillText("• 10 Barrel-Threaded I/O PPs (1st FGMT GPU", 632, 644);
    c.fillText("  ancestor!) offload ALL OS & I/O from CPU.", 632, 670);
    c.fillStyle = "#fde047";
    c.fillText("• Prompted IBM CEO T.J. Watson Jr.'s famous", 632, 704);
    c.fillText("  '34 people + janitor' memo!", 632, 728);

    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "cdc6600",
    era: "1964",
    short: "CDC 6600 Scoreboard",
    name: "Control Data CDC 6600 Supercomputer (Thornton Scoreboard)",
    group: "super",
    view0: 0.42,
    blurb:
      "The first true supercomputer (Seymour Cray & James Thornton, 1964 — 3× faster than IBM Stretch): introduced a Freon-cooled '+'-shaped mainframe, Load/Store RISC-like 60-bit architecture, 10 parallel functional units dynamically scheduled out-of-order by Thornton's Hardware Scoreboard (RAW/WAR/WAW hazard tracking), and 10 barrel-threaded Peripheral Processors.",
    diagram: {
      nodes: [
        { id: "cmem", label: "128K 60b Core Banks", x: 0.16, y: 0.26, color: "#f97316" },
        {
          id: "regs",
          label: "X0–X7 / A0–A7 / B0–B7",
          x: 0.48,
          y: 0.26,
          color: "#38bdf8",
        },
        { id: "scb", label: "Thornton Scoreboard", x: 0.52, y: 0.72, color: "#fde047" },
        { id: "fu10", label: "10 Functional Units", x: 0.84, y: 0.32, color: "#4ade80" },
        { id: "pp10", label: "10 Barrel I/O PPs", x: 0.18, y: 0.78, color: "#c08cff" },
      ],
      edges: [
        ["cmem", "regs", "Stunt Box"],
        ["regs", "fu10", "Rj & Rk"],
        ["scb", "fu10", "Issue/WAR"],
        ["pp10", "cmem", "DMA Slot"],
      ],
    },
    build(kit) {
      unitBars = [];
      dd60Left = Bt(256, 256);
      dd60Right = Bt(256, 256);

      // 1. ICONIC PLUS-SHAPED (+) 4-WING WALNUT, BRUSHED-ALU & FREON MAINFRAME (Left)
      const cross = kit.group([-0.62, 0, -0.04], {
        name: "CDC 6600 Plus-Shaped (+) 4-Wing Mainframe",
        info: "Seymour Cray folded four cabinets into a compact '+' cross with walnut end-panels to minimize backplane wire lengths for the 100 ns (10 MHz) clock.",
      });
      // Central spine + 4 orthogonal wings (0, 90, 180, 270 deg)
      kit.cyl(
        0.24,
        0.24,
        1.46,
        U.darkAnodized(0x1b222c),
        [0, 0.73, 0],
        {
          name: "Central Coaxial Backplane & Freon Compressor Column",
        },
        cross,
      );

      for (let w = 0; w < 4; w++) {
        const ang = (w * Math.PI) / 2 + Math.PI / 4;
        const wing = kit.group(
          [Math.cos(ang) * 0.42, 0, Math.sin(ang) * 0.42],
          {
            rot: [0, -ang, 0],
            name: `CDC 6600 Logic & Core Wing #${w + 1}`,
            info:
              w === 0
                ? "Houses James Thornton's Hardware Scoreboard & Instruction Stack."
                : w === 1
                  ? "Houses the 10 parallel 60-bit Functional Units (2× FMUL, FADD, FDIV, Shift, Bool, Branch, LongAdd, 2× Inc)."
                  : "Houses 32-bank interleaved 60-bit Ferrite Core Memory ('Stunt Box' bank conflict hopper) & 10 Barrel PPs.",
            explode: [Math.cos(ang) * 0.28, 0, Math.sin(ang) * 0.28],
          },
          cross,
        );
        // Smoked glass & brushed aluminum outer doors (shell: true!) + American Walnut end panel!
        kit.box(
          0.56,
          1.42,
          0.26,
          U.glass(0xdbeafe, 0.22),
          [0, 0.71, 0],
          {
            shell: true,
            name: `Smoked-Glass Hinged Wing Door ${w + 1}`,
          },
          wing,
        );
        kit.box(
          0.05,
          1.42,
          0.28,
          U.wood(),
          [0.29, 0.71, 0],
          {
            name: "Mid-Century American Walnut End Panel",
          },
          wing,
        );

        // Internal Freon-12 Copper Coldplates + Cordwood Modules + Core Plane!
        kit.cyl(
          0.016,
          0.016,
          1.28,
          U.copper(),
          [-0.2, 0.71, 0.08],
          {
            name: "Freon-12 Refrigerant Cooling Manifold",
          },
          wing,
        );
        for (let m = 0; m < 5; m++) {
          const my = 0.26 + m * 0.23;
          kit.box(
            0.44,
            0.16,
            0.18,
            w >= 2 ? U.corePlane() : U.pcb(0x1f4e3d),
            [0, my, 0],
            {
              name:
                w < 2
                  ? `Cordwood Silicon Transistor Functional Unit Bay ${w * 5 + m + 1}`
                  : `60-Bit Interleaved Ferrite Core Memory Bank ${m + 1}`,
            },
            wing,
          );
          if (w < 2) {
            const bar = kit.box(
              0.38,
              0.02,
              0.02,
              U.glow(0x4ade80, 1.2),
              [0, my, 0.1],
              {},
              wing,
            );
            unitBars.push(bar);
          }
        }
      }

      // 2. ICONIC CDC DD60 TWIN-ROUND-CRT OPERATOR CONSOLE DESK (Center-Front)
      const dd60 = kit.group([0.08, 0, 0.42], {
        rot: [0, -0.25, 0],
        name: "CDC DD60 Dual Circular Vector-CRT Operator Console",
        info: "World-famous twin round vector-stroke cathode-ray tubes driven directly by one of the 10 Barrel Peripheral Processors.",
        explode: [0, 0, 0.34],
      });
      kit.box(0.68, 0.42, 0.42, U.wood(), [0, 0.21, 0], {}, dd60);
      for (const [dx, surf] of [
        [-0.16, dd60Left],
        [0.16, dd60Right],
      ]) {
        kit.cyl(
          0.135,
          0.135,
          0.12,
          U.alu(),
          [dx, 0.56, -0.04],
          {
            rot: [Math.PI / 2 - 0.18, 0, 0],
            name: "Circular Vector-Stroke Cathode-Ray Bezel",
          },
          dd60,
        );
        kit.mesh(
          new mt(0.21, 0.21),
          U.screen(surf.tex),
          [dx, 0.56, 0.025],
          {
            rot: [-0.18, 0, 0],
          },
          dd60,
        );
      }
      buildSculptedKeyboard(kit, [0, 0.435, 0.11], {
        w: 0.36,
        d: 0.13,
        bodyColor: 0x262d36,
        name: "DD60 Operator Keyboard",
      });

      // 3. RIGHT THORNTON SCOREBOARD CONSOLE (facing +Z!)
      mon = buildMonitor3D(kit, [0.88, 0.64, 0.06], {
        w: 0.96,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "James Thornton Hardware Scoreboard & Hazard Monitor",
        explode: [0.36, 0, 0],
      });
      kit.box(1.04, 0.64, 0.54, U.darkAnodized(0x111923), [0.88, 0.32, 0.06], {
        rot: [0, 0.04, 0],
      });

      drawDd60RoundScopes();
      drawCdcMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        const busyCnt = sim.units.filter((u) => u.busy).length;
        statsUi.set("clk", `Cycle #${sim.clock} (100 ns)`);
        statsUi.set("fu", `${busyCnt} / 10 Active`);
        statsUi.set("raw", `${sim.rawStalls} Cycles`);
        statsUi.set("war", `${sim.warStalls} Cycles (X6 Hold)`);
        statsUi.set("ooo", `${sim.oooCompletions} Out-of-Order`);
        statsUi.set("pp", `PP#${sim.ppSlot} / 10 Barrel`);
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
        ["clk", "10 MHz Minor Clk"],
        ["fu", "Functional Units"],
        ["raw", "RAW Stalls (Qj/Qk)"],
        ["war", "WAR Stalls (Write)"],
        ["ooo", "OoO Completions"],
        ["pp", "Peripheral Barrel"],
      ]);

      el.append(
        Ie(
          "James Thornton's Hardware Scoreboard (Cycle-Accurate OoO)",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe(
              "Step 1 Minor Cycle (100 ns)",
              () => {
                running = false;
                runBtn.textContent = "▶ Run";
                sim.step();
                hi("tick", { f: 980, min: 0.03 });
                if (ctx.diagram) ctx.diagram.pulse("scb", "fu10", "#fde047");
                drawDd60RoundScopes();
                drawCdcMonitor();
                syncStats();
              },
              "pri",
            ),
            Fe("Reset Scoreboard Trace", () => {
              sim.reset();
              drawDd60RoundScopes();
              drawCdcMonitor();
              syncStats();
            }),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, _t, ctx) {
      if (running) {
        stepAcc += dt * 3.2;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("cmem", "regs", "#f97316");
            ctx.diagram.pulse("scb", "fu10", "#fde047");
            ctx.diagram.pulse("pp10", "cmem", "#c08cff");
          }
          drawDd60RoundScopes();
          drawCdcMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      unitBars.forEach((bar, idx) => {
        const u = sim.units[idx];
        bar.material.emissiveIntensity = u && u.busy ? 1.8 : 0.12;
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const c = new Cdc6600Scoreboard();
      for (let i = 0; i < 80 && !c.isComplete(); i++) c.step();
      return {
        ok: c.isComplete() && c.rawStalls > 0 && c.warStalls > 0 && c.regs.X6 === 12,
        warStalls: c.warStalls,
      };
    },
  };
  return machine;
}

function makeMachineAsciRed97() {
  const sim = new AsciRedWormholeMpp();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let flitOrbs = [];
  let statsUi = null;

  function drawAsciMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#08070c";
    c.fillRect(0, 0, W, H);

    c.fillStyle = "#7f1d1d";
    c.fillRect(16, 14, W - 32, 52);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `1997 SANDIA/INTEL ASCI RED · 1st 1.34-TFLOPS SUPERCOMPUTER · 9,298 PENTIUM PROs · XY WORMHOLE`,
      24,
      47,
    );

    // Left: 6x6 2D Mesh Dimension-Order (XY) Wormhole Flit Router
    c.fillStyle = "#0e121e";
    c.fillRect(20, 82, 488, 412);
    c.strokeStyle = "#ef4444";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 488, 412);
    c.fillStyle = "#fca5a5";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText("2D MESH XY WORMHOLE CUT-THROUGH FLIT ROUTER", 36, 110);

    const ox = 64,
      oy = 148,
      sp = 72;
    c.strokeStyle = "#334155";
    c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(ox + i * sp, oy);
      c.lineTo(ox + i * sp, oy + 5 * sp);
      c.moveTo(ox, oy + i * sp);
      c.lineTo(ox + 5 * sp, oy + i * sp);
      c.stroke();
    }

    // Active snaking wormhole flit trains (Head->Body->Tail)!
    for (const f of sim.flows) {
      c.strokeStyle = f.stalled ? "#fde047" : f.color;
      c.lineWidth = 6;
      c.beginPath();
      const start = Math.max(0, f.headIdx - f.length + 1);
      for (let k = start; k <= f.headIdx; k++) {
        const [nx, ny] = f.path[k];
        const px = ox + nx * sp;
        const py = oy + ny * sp;
        if (k === start) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
    }

    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        c.fillStyle = "#1e293b";
        c.beginPath();
        c.arc(ox + x * sp, oy + y * sp, 10, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "#94a3b8";
        c.lineWidth = 1.5;
        c.stroke();
      }
    }

    // Right: Distributed MPI 2D Shock-Wave Hydrodynamics Field (CTH / Shock Physics!)
    c.fillStyle = "#0e121e";
    c.fillRect(524, 82, 480, 412);
    c.strokeStyle = "#38bdf8";
    c.strokeRect(524, 82, 480, 412);
    c.fillStyle = "#7dd3fc";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText("MPI DOMAIN-DECOMPOSED SHOCK HYDRODYNAMICS", 540, 110);

    const N = sim.gridN;
    const cell = 352 / N;
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const v = sim.uCur[y * N + x];
        const r = Math.min(255, Math.max(14, Math.round(35 + Math.max(0, v) * 210)));
        const b = Math.min(255, Math.max(24, Math.round(55 + Math.max(0, -v) * 210)));
        const g = Math.min(220, Math.round(25 + Math.abs(v) * 95));
        c.fillStyle = `rgb(${r},${g},${b})`;
        c.fillRect(588 + x * cell, 126 + y * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
    // Draw 6x6 MPI Subdomain Ghost-Boundary Grid!
    c.strokeStyle = "rgba(255,255,255,0.22)";
    c.lineWidth = 1;
    for (let d = 1; d < 6; d++) {
      const p = d * (352 / 6);
      c.beginPath();
      c.moveTo(588 + p, 126);
      c.lineTo(588 + p, 478);
      c.moveTo(588, 126 + p);
      c.lineTo(940, 126 + p);
      c.stroke();
    }

    // Bottom: Wormhole vs Store-and-Forward Math & "Attack of the Killer Micros"
    const cmp = sim.compareLatencyCycles(10, sim.flitsPerPacket);
    c.fillStyle = "#0e121e";
    c.fillRect(20, 512, W - 40, 232);
    c.strokeStyle = "#fbbf24";
    c.strokeRect(20, 512, W - 40, 232);
    c.fillStyle = "#fde047";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      `10-HOP LATENCY: WORMHOLE (D+L = ${cmp.wormholeCycles} cyc) vs STORE-&-FORWARD (D×L = ${cmp.storeForwardCycles} cyc) => ${cmp.speedup}× FASTER!`,
      36,
      544,
    );
    c.fillStyle = "#cbd5e1";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      "• Historic Rubicon (June 1997): 1st computer on Earth >1.0 TeraFLOPS (1.338 TFLOPS LINPACK; #1 TOP500 for 3.5 years).",
      36,
      584,
    );
    c.fillText(
      "• 'Attack of the Killer Micros': 9,298 commodity off-the-shelf 200 MHz Intel Pentium Pro x86 CPUs dethroned custom vector ECL!",
      36,
      622,
    );
    c.fillText(
      `• Lightweight OS 'Cougar' on compute nodes + 800 MB/s bidirectional XY wormhole routers · Halo Exchanges: ${sim.mpiHaloExchanges}`,
      36,
      660,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "ascired97",
    era: "1997",
    short: "ASCI Red 1.3 TFLOPS",
    name: "Sandia / Intel ASCI Red 1.3-TeraFLOPS Wormhole MPP",
    group: "super",
    view0: 0.36,
    blurb:
      "First supercomputer in history to break the 1.0 TeraFLOPS barrier (1.338 TFLOPS HPL, Sandia National Labs, 1997): proved the 'Attack of the Killer Micros' by uniting 9,298 commodity Intel Pentium Pro x86 processors across a 38×32×2 Dimension-Order Wormhole-Routed Mesh running distributed MPI shock-wave physics.",
    diagram: {
      nodes: [
        { id: "ppro", label: "9,298 Pentium Pros", x: 0.18, y: 0.26, color: "#ef4444" },
        { id: "mrc", label: "XY Wormhole Router", x: 0.52, y: 0.28, color: "#fbbf24" },
        { id: "flit", label: "Head/Body/Tail Flits", x: 0.84, y: 0.28, color: "#38bdf8" },
        { id: "coug", label: "Cougar Light-OS", x: 0.22, y: 0.78, color: "#34d399" },
        { id: "mpi", label: "MPI Halo Shock PDE", x: 0.78, y: 0.78, color: "#f97316" },
      ],
      edges: [
        ["ppro", "mrc", "800 MB/s"],
        ["mrc", "flit", "Cut-Through"],
        ["coug", "mpi", "Zero-Jitter"],
        ["flit", "mpi", "Ghost Cells"],
      ],
    },
    build(kit) {
      flitOrbs = [];
      // 1. MULTI-CABINET CRIMSON & OBSIDIAN ASCI RED ROW (Left)
      const row = kit.group([-0.54, 0, 0], {
        name: "ASCI Red Compute & Wormhole Mesh Cabinet Row",
        info: "Scale section of ASCI Red's 104 crimson-and-black cabinets housing dual-Pentium-Pro compute blades and the 800 MB/s Mesh Routing Chip (MRC) backplane.",
      });

      for (let cabIdx = 0; cabIdx < 4; cabIdx++) {
        const cx = -0.48 + cabIdx * 0.32;
        const cab = kit.group(
          [cx, 0, 0],
          {
            name: `ASCI Red Cabinet #${cabIdx + 1} (${cabIdx < 3 ? "Compute K-Node" : "Disk/Service Node"})`,
            explode: [(cabIdx - 1.5) * 0.16, 0, 0],
          },
          row,
        );

        kit.box(
          0.3,
          1.72,
          0.78,
          U.darkAnodized(0x14171f),
          [0, 0.86, 0],
          {
            shell: true,
            name: `ASCI Red Obsidian Rack Frame ${cabIdx + 1}`,
          },
          cab,
        );

        // Signature Sandia Crimson Perforated Honeycomb Door!
        kit.box(
          0.28,
          1.62,
          0.03,
          U.perfMesh(0x881b1b),
          [0, 0.86, 0.39],
          {
            shell: true,
            name: `Crimson Perforated Airflow Grille Door ${cabIdx + 1}`,
            explode: [0, 0, 0.42],
          },
          cab,
        );

        // Internal Dual-Pentium-Pro Compute Blades (Gold ceramic PGA sockets!)
        for (let bl = 0; bl < 6; bl++) {
          const by = 0.24 + bl * 0.24;
          const blade = kit.box(
            0.23,
            0.16,
            0.62,
            U.pcb(0x1b5e3a),
            [0, by, 0],
            {
              name: `Dual 200 MHz Intel Pentium Pro Compute Blade ${cabIdx * 6 + bl + 1}`,
              info: "Carries two Pentium Pro processors (each integrating CPU + 256 KB L2 cache in one dual-cavity ceramic MCP) plus Intel Mesh Routing Chip (MRC) interface.",
            },
            cab,
          );
          kit.box(0.06, 0.02, 0.08, U.gold(), [-0.05, 0.09, 0.14], {}, blade);
          kit.box(0.06, 0.02, 0.08, U.gold(), [0.05, 0.09, 0.14], {}, blade);
        }
      }

      // Rear 2D XY Wormhole Mesh Backplane Grid + Racing Flit Pulses!
      const meshPlane = kit.group(
        [0, 0.92, -0.42],
        {
          name: "Dimension-Order (XY) Wormhole Interconnect Backplane",
          info: "Deadlock-free X-then-Y cut-through flit routing fabric delivering 51.2 GB/s cross-section bisection bandwidth.",
          explode: [0, 0, -0.38],
        },
        row,
      );
      for (let gx = 0; gx < 4; gx++) {
        kit.cyl(0.008, 0.008, 1.32, U.copper(), [-0.48 + gx * 0.32, 0, 0], {}, meshPlane);
      }
      for (let gy = 0; gy < 4; gy++) {
        kit.cyl(
          0.008,
          0.008,
          1.02,
          U.gold(),
          [0, -0.45 + gy * 0.3, 0],
          {
            rot: [0, 0, Math.PI / 2],
          },
          meshPlane,
        );
      }
      for (let f = 0; f < 6; f++) {
        const orb = kit.sphere(
          0.022,
          U.glow(f % 2 ? 0x38bdf8 : 0xf97316, 2.0),
          [0, 0, -0.02],
          {
            name: `Wormhole Packet Flit #${f + 1}`,
          },
          meshPlane,
        );
        flitOrbs.push(orb);
      }

      // 2. RIGHT TERAFLOPS MPI & WORMHOLE CONSOLE (facing +Z!)
      mon = buildMonitor3D(kit, [0.84, 0.64, 0.1], {
        w: 0.96,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "ASCI Red XY Wormhole Flit & MPI Shock Console",
        explode: [0.36, 0, 0],
      });
      kit.box(1.04, 0.64, 0.54, U.darkAnodized(0x181218), [0.84, 0.32, 0.1], {
        rot: [0, 0.04, 0],
      });

      drawAsciMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        const cmp = sim.compareLatencyCycles(10, sim.flitsPerPacket);
        statsUi.set("hpl", "1.338 TeraFLOPS #1");
        statsUi.set("cpus", "9,298 Pentium Pro");
        statsUi.set("lat", `${cmp.wormholeCycles} cyc vs ${cmp.storeForwardCycles} S&F`);
        statsUi.set("deliv", `${sim.packetsDelivered} Wormholes`);
        statsUi.set("stall", `${sim.contentionStalls} Link Holds`);
        statsUi.set("halo", `${sim.mpiHaloExchanges.toLocaleString()} MPI`);
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
        ["hpl", "LINPACK Record"],
        ["cpus", "Killer Micros"],
        ["lat", "10-Hop Cut-Thru"],
        ["deliv", "Packets Routed"],
        ["stall", "Backpressure"],
        ["halo", "Ghost-Cell Sync"],
      ]);

      el.append(
        Ie(
          "XY Dimension-Order Wormhole Flit Router & MPI Shock Physics",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe(
              "Inject Corner-to-Corner Wormhole",
              () => {
                sim.injectFlow(0, 0, 5, 5);
                sim.injectFlow(0, 0, 5, 3); // shared X-row contention!
                if (ctx.diagram) ctx.diagram.pulse("mrc", "flit", "#38bdf8");
                hi("tick", { f: 1450, min: 0.04 });
                drawAsciMonitor();
                syncStats();
              },
              "pri",
            ),
            Fe("Detonate Shock Impulse", () => {
              sim.triggerShockPulse(9, 9);
              if (ctx.diagram) ctx.diagram.pulse("flit", "mpi", "#f97316");
              hi("clack", { min: 0.05 });
              drawAsciMonitor();
              syncStats();
            }),
          ),
          We(
            "Packet Length L (Flits per Wormhole)",
            4,
            16,
            2,
            sim.flitsPerPacket,
            (v) => {
              sim.flitsPerPacket = v;
              drawAsciMonitor();
              syncStats();
            },
            (v) => `${v} flits`,
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 4.5;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("ppro", "mrc", "#ef4444");
            ctx.diagram.pulse("mrc", "flit", "#38bdf8");
            ctx.diagram.pulse("flit", "mpi", "#f97316");
          }
          drawAsciMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      flitOrbs.forEach((orb, idx) => {
        const u = ((t * 1.4 + idx * 0.17) % 1) * 2;
        if (u < 1) {
          orb.position.set(-0.48 + u * 0.96, -0.45 + (idx % 4) * 0.3, -0.02);
        } else {
          orb.position.set(0.48, -0.45 + (u - 1) * 0.9, -0.02);
        }
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const a = new AsciRedWormholeMpp();
      const c = a.compareLatencyCycles(8, 8);
      for (let i = 0; i < 12; i++) a.step();
      return { ok: c.wormholeCycles < c.storeForwardCycles && a.packetsDelivered > 0 };
    },
  };
  return machine;
}
