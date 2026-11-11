// Circle IV — The Age of Quantum Computers: Physical Substrates, Fault-Tolerant QEC & The OMEGA-Q Horizon
//   qtransmon (2024)          : 15 mK Superconducting Dilution-Cryo Chandelier & Rotated Surface-Code QEC
//   qatom     (2023)          : Neutral-Atom 87Rb Rydberg Optical-Tweezer Array (Shuttling Zones + C6/R^6 Blockade)
//   qphotonic (2025)          : Measurement-Based Fusion Photonic Cluster-State Processor (Pauli Feedforward)
//   qtopo     (2025+)         : Topological Majorana Zero-Mode Nanowire Processor (16x16 Kitaev BdG + Non-Abelian Braids)
//   qomega    (2045+) ★ CAPITAL: OMEGA-Q Singularity Fault-Tolerant Hyper-Quantum Core (Exact Shor QFT, Grover 256 & H2 CI)

function makeMachineQtransmon() {
  const sim = new CryoSurfaceCodeQuantum();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let dieGlow = null;
  let statsUi = null;

  function drawCryoMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#050912";
    c.fillRect(0, 0, W, H);
    const pPhys = sim.physicalErrorRate();
    const pLog = sim.logicalErrorRatePerCycle();
    const below = pPhys < 0.01;
    c.fillStyle = below ? "#1e3a8a" : "#7f1d1d";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `15 mK TRANSMON SURFACE CODE (d=${sim.codeDistance}) · T=${sim.tempMk} mK · p_phys=${(pPhys * 100).toFixed(2)}% ${below ? "(BELOW THRESHOLD ✓)" : "(QUASIPARTICLE POISON!)"}`,
      26,
      46,
    );

    // Left: Rotated Surface-Code Data Qubits + X/Z Stabilizer Syndrome Plaquettes
    c.fillStyle = "#0c1424";
    c.fillRect(20, 82, 470, 460);
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 470, 460);
    c.fillStyle = "#bae6fd";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(`ROTATED SURFACE CODE PATCH (d=${sim.codeDistance})`, 38, 112);

    const d = sim.codeDistance;
    const pitch = d === 5 ? 74 : 112;
    const ox = d === 5 ? 92 : 132;
    const oy = d === 5 ? 172 : 206;

    // Draw stabilizer plaquettes first
    let sIdx = 0;
    for (let r = 0; r < d - 1 && sIdx < 12; r++) {
      for (let col = 0; col < d - 1 && sIdx < 12; col++) {
        const px = ox + col * pitch;
        const py = oy + r * pitch;
        const zTrig = sim.zSyndromes[sIdx];
        const xTrig = sim.xSyndromes[sIdx];
        c.fillStyle = zTrig
          ? "rgba(251, 191, 36, 0.45)"
          : xTrig
            ? "rgba(244, 114, 182, 0.45)"
            : (r + col) % 2 === 0
              ? "rgba(30, 64, 175, 0.28)"
              : "rgba(15, 118, 110, 0.28)";
        c.fillRect(px, py, pitch, pitch);
        c.strokeStyle = "#334155";
        c.strokeRect(px, py, pitch, pitch);
        sIdx++;
      }
    }
    // Draw data qubits on vertices
    for (let r = 0; r < d; r++) {
      for (let col = 0; col < d; col++) {
        const q = r * d + col;
        const err = sim.dataErrors[q];
        const qx = ox + col * pitch;
        const qy = oy + r * pitch;
        c.beginPath();
        c.arc(qx, qy, 16, 0, Math.PI * 2);
        c.fillStyle = err === 1 ? "#ef4444" : err === 2 ? "#a855f7" : "#0ea5e9";
        c.fill();
        c.fillStyle = "#ffffff";
        c.font = '700 13px "JetBrains Mono", monospace';
        c.fillText(err === 1 ? "X" : err === 2 ? "Z" : "I", qx - 5, qy + 5);
      }
    }

    // Right: 5-Qubit GHZ Entangled Statevector + Logical Suppression Scaling
    c.fillStyle = "#0c1424";
    c.fillRect(510, 82, 494, 460);
    c.strokeStyle = "#eab308";
    c.strokeRect(510, 82, 494, 460);
    c.fillStyle = "#fde047";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("BELOW-THRESHOLD QEC SUPPRESSION (Λ = p_th / p)", 528, 112);

    [3, 5, 7, 9].forEach((dist, idx) => {
      const lambda = 0.01 / Math.max(1e-5, pPhys);
      const rate = Math.min(0.5, 0.03 * Math.pow(1 / lambda, (dist + 1) / 2));
      const by = 152 + idx * 72;
      c.fillStyle = dist === sim.codeDistance ? "#fde047" : "#cbd5e1";
      c.font = '700 14px "JetBrains Mono", monospace';
      c.fillText(`Distance d=${dist} (${2 * dist * dist - 1} phys qubits): ε_L = ${rate.toExponential(2)}`, 528, by);
      c.fillStyle = "#1e293b";
      c.fillRect(528, by + 10, 450, 24);
      const barW = Math.max(8, Math.min(450, ((Math.log10(rate) + 8) / 8) * 450));
      c.fillStyle = below ? "#38bdf8" : "#ef4444";
      c.fillRect(528, by + 10, barW, 24);
    });

    c.fillStyle = "#93c5fd";
    c.font = '600 14px "JetBrains Mono", monospace';
    const p00 = sim.re[0] * sim.re[0];
    const p11 = sim.re[31] * sim.re[31];
    c.fillText(
      `5Q GHZ State: P(|00000⟩)=${p00.toFixed(3)} · P(|11111⟩)=${p11.toFixed(3)} · Fid=${(sim.ghzFidelity * 100).toFixed(1)}%`,
      528,
      498,
    );

    // Bottom: Cryostat Thermal Stage Telemetry
    c.fillStyle = "#0c1424";
    c.fillRect(20, 560, W - 40, 182);
    c.strokeStyle = "#34d399";
    c.strokeRect(20, 560, W - 40, 182);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("³He / ⁴He DILUTION REFRIGERATOR STAGE CASCADE", 38, 592);
    c.fillStyle = "#e2e8f0";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      `300 K Vacuum Flange -> 50 K PT1 -> 4 K PT2 (HEMT Amps) -> 800 mK Still -> 100 mK Cold -> ${sim.tempMk} mK Mixing Chamber`,
      38,
      640,
    );
    c.fillStyle = "#fde68a";
    c.fillText(
      `Corrected Syndrome Cycles: ${sim.correctedShots}   |   Unrecoverable Logical Flips: ${sim.logicalErrors}`,
      38,
      688,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "qtransmon",
    era: "2024",
    short: "15mK Transmon QEC",
    name: "Superconducting 15 mK Dilution-Cryo & Surface-Code Quantum Computer",
    group: "quantum",
    view0: 0.35,
    blurb:
      "Willow/Heron-era superconducting quantum architecture: a 6-stage gold-plated copper ³He/⁴He dilution refrigerator cools nonlinear Al/AlOx/Al Josephson-junction transmon qubits to 15 millikelvin (colder than deep interstellar space) so physical two-qubit gate errors drop below the ~1% Rotated Surface-Code threshold.",
    diagram: {
      nodes: [
        { id: "awg", label: "300K FPGA / AWG", x: 0.18, y: 0.22, color: "#38bdf8" },
        { id: "att", label: "4K Coax + HEMT", x: 0.5, y: 0.22, color: "#fbbf24" },
        { id: "qpu", label: "15mK Transmon QPU", x: 0.82, y: 0.36, color: "#f472b6" },
        { id: "syn", label: "X/Z Stabilizers", x: 0.52, y: 0.72, color: "#34d399" },
        { id: "dec", label: "MWPM Decoder", x: 0.18, y: 0.72, color: "#c08cff" },
      ],
      edges: [
        ["awg", "att", "4–8 GHz"],
        ["att", "qpu", "-60 dB"],
        ["qpu", "syn", "Dispersive"],
        ["syn", "dec", "Syndrome"],
        ["dec", "awg", "Pauli Frame"],
      ],
    },
    build(kit) {
      // 1. OVERHEAD GANTRY + GOLDEN 6-STAGE DILUTION CHANDELIER
      const gantry = kit.group([-0.42, 0, 0], {
        name: "Vibration-Isolated Cryostat Gantry",
        info: "Rigid structural gantry suspending the ³He/⁴He dilution refrigerator and outer vacuum vessel above the laboratory floor.",
      });
      for (const [px, pz] of [
        [-0.64, -0.56],
        [0.64, -0.56],
        [-0.64, 0.56],
        [0.64, 0.56],
      ]) {
        kit.cyl(0.036, 0.042, 2.38, U.darkAnodized(0x1c2432), [px, 1.19, pz], {}, gantry);
      }
      kit.box(1.48, 0.09, 1.32, U.metal(0x283244, 0.38), [0, 2.36, 0], {
        name: "300 K Room-Temperature Top Vacuum Flange",
        info: "Hermetic microwave feedthrough manifold where room-temperature AWG control pulses enter the vacuum space.",
      }, gantry);

      // Outer Vacuum Can (OVC) — shell: true so it glows softly & disappears cleanly on Cutaway!
      kit.cyl(0.56, 0.56, 2.02, U.glass(0xcfe8ff, 0.18), [0, 1.28, 0], {
        shell: true,
        name: "Outer Vacuum Can (OVC) & Radiation Shield",
        info: "High-vacuum containment vessel preventing convective heat load onto the millikelvin stages; toggle Cutaway (C) for unobstructed chandelier view.",
        explode: [-0.55, 0, 0],
      }, gantry);

      // 6 Gold-Plated OFHC Copper Thermal Plates descending from 2.22 m down to 0.58 m!
      const stages = [
        [2.18, 0.48, "50 K Pulse-Tube Stage 1 Plate"],
        [1.84, 0.44, "4 K Pulse-Tube Stage 2 & HEMT Plate"],
        [1.48, 0.39, "800 mK ³He Still Plate"],
        [1.14, 0.34, "100 mK Heat-Exchanger Cold Plate"],
        [0.8, 0.29, "15 mK Mixing-Chamber QPU Plate"],
      ];
      stages.forEach(([sy, rad, label], idx) => {
        kit.cyl(rad, rad, 0.026, U.gold(), [0, sy, 0], {
          name: label,
          info: "Gold-plated oxygen-free high-conductivity (OFHC) copper flange thermalizing microwave attenuators, IR filters, and superconducting NbTi coax.",
          live: () => (idx === 4 ? `Mixing Chamber = ${sim.tempMk} mK` : "Thermalized"),
          explode: [0, (2 - idx) * 0.08, 0],
        }, gantry);

        // Brass support tie-rods & coiled NbTi coaxial microwave lines between stages
        const nextY = idx < stages.length - 1 ? stages[idx + 1][0] : 0.52;
        const rodR = rad * 0.78;
        for (let r = 0; r < 6; r++) {
          const a = (r / 6) * Math.PI * 2;
          kit.cyl(
            0.008,
            0.008,
            sy - nextY,
            U.brass(),
            [Math.cos(a) * rodR, (sy + nextY) * 0.5, Math.sin(a) * rodR],
            {},
            gantry,
          );
        }
        for (let c = 0; c < 4; c++) {
          const a = (c / 4) * Math.PI * 2 + idx * 0.4;
          const cr = rad * 0.56;
          buildCoiledCable(
            kit,
            [
              [Math.cos(a) * cr, sy - 0.015, Math.sin(a) * cr],
              [Math.cos(a + 0.25) * (cr * 0.92), (sy + nextY) * 0.5, Math.sin(a + 0.25) * (cr * 0.92)],
              [Math.cos(a) * (cr * 0.85), nextY + 0.015, Math.sin(a) * (cr * 0.85)],
            ],
            0.016,
            0.004,
            10,
            idx < 2 ? 0xd97706 : 0x94a3b8,
            {
              name: "NbTi Superconducting Microwave Coax Loop",
              info: "Coiled niobium-titanium coaxial transmission line blocking thermal conduction while carrying 4–8 GHz XY/Z qubit control pulses with zero electrical resistance.",
            },
            gantry,
          );
        }
      });

      // Central ³He/⁴He Mixing Chamber Can + Bottom Flip-Chip Transmon QPU Package
      kit.cyl(0.085, 0.085, 0.22, U.gold(), [0, 0.66, 0], {
        name: "³He/⁴He Dilution Mixing Chamber",
        info: "Endothermic phase separation of helium-3 into superfluid helium-4 absorbs heat down to 10–15 millikelvin.",
      }, gantry);

      const qpuPkg = kit.group([0, 0.44, 0], {
        name: "Flip-Chip Transmon Surface-Code QPU",
        info: "Sapphire/silicon flip-chip assembly holding 105 superconducting transmon qubits, tunable couplers, and λ/4 readout resonators inside a Cryoperm magnetic shield.",
        live: () => `d=${sim.codeDistance} · p_phys=${(sim.physicalErrorRate() * 100).toFixed(2)}%`,
        explode: [0, -0.22, 0.25],
      }, gantry);
      kit.cyl(0.16, 0.16, 0.18, U.darkAnodized(0x1f2937), [0, 0.04, 0], {
        shell: true,
        name: "Cryoperm Mu-Metal Magnetic Shield",
      }, qpuPkg);
      kit.box(0.18, 0.016, 0.18, U.gold(), [0, 0, 0], {}, qpuPkg);
      dieGlow = kit.box(0.12, 0.012, 0.12, U.siliconDie(), [0, -0.012, 0], {
        name: "Josephson-Junction Transmon Silicon Die",
      }, qpuPkg);

      // 2. ROOM-TEMPERATURE FPGA / QEC DECODER RACK & CONSOLE (Right)
      mon = buildMonitor3D(kit, [0.84, 0.64, 0.14], {
        w: 0.9,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "Surface-Code Syndrome & Cryo Telemetry Console",
        explode: [0.35, 0, 0],
      });
      kit.box(0.98, 0.64, 0.56, U.darkAnodized(0x141b26), [0.84, 0.32, 0.14], {
        rot: [0, 0.04, 0],
        name: "Ultra-Low-Latency FPGA QEC Control Rack",
        info: "Generates 4–8 GHz shaped DRAG microwave pulses and decodes surface-code stabilizer syndromes in <1 µs per round.",
      });

      drawCryoMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        const pP = sim.physicalErrorRate();
        const pL = sim.logicalErrorRatePerCycle();
        statsUi.set("temp", `${sim.tempMk} mK`);
        statsUi.set("pphys", `${(pP * 100).toFixed(2)}% (${pP < 0.01 ? "< 1% Thresh" : "POISONED"})`);
        statsUi.set("plog", pL.toExponential(2));
        statsUi.set("dist", `d=${sim.codeDistance} (${2 * sim.codeDistance ** 2 - 1}Q)`);
        statsUi.set("ghz", `${(sim.ghzFidelity * 100).toFixed(1)}%`);
        statsUi.set("shots", `${sim.correctedShots} ok / ${sim.logicalErrors} logical err`);
      };

      const runBtn = Fe(running ? "⏸ Pause" : "▶ Run", () => {
        running = !running;
        runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
      }, "pri");

      const distBtn = Fe(`Code Distance: d=${sim.codeDistance}`, () => {
        sim.codeDistance = sim.codeDistance === 5 ? 3 : 5;
        distBtn.textContent = `Code Distance: d=${sim.codeDistance}`;
        sim.runCycle();
        drawCryoMonitor();
        syncStats();
      }, "pri");

      statsUi = Pt([
        ["temp", "Mixing Chamber"],
        ["pphys", "Physical Error"],
        ["plog", "Logical Error/Cyc"],
        ["dist", "Surface Code"],
        ["ghz", "5Q GHZ Fidelity"],
        ["shots", "QEC Decoder"],
      ]);

      el.append(
        Ie(
          "15 mK Dilution Cryostat & Below-Threshold Surface Code",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step QEC Round", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.runCycle();
              hi("rf", { min: 0.06 });
              drawCryoMonitor();
              syncStats();
            }),
            distBtn,
          ),
          We(
            "Mixing-Chamber Temp (mK)",
            10,
            180,
            5,
            sim.tempMk,
            (v) => {
              sim.tempMk = v;
              sim.runCycle();
              drawCryoMonitor();
              syncStats();
            },
            (v) => `${v} mK`,
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 3.5;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.runCycle();
          if (ctx.diagram) {
            ctx.diagram.pulse("awg", "att", "#38bdf8");
            ctx.diagram.pulse("att", "qpu", "#f472b6");
            ctx.diagram.pulse("qpu", "syn", "#34d399");
            ctx.diagram.pulse("syn", "dec", "#c08cff");
          }
          drawCryoMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      if (dieGlow && dieGlow.material && dieGlow.material.emissive) {
        dieGlow.material.emissiveIntensity = 0.25 + 0.2 * Math.sin(t * 4);
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const q = new CryoSurfaceCodeQuantum();
      q.tempMk = 15;
      q.codeDistance = 5;
      q.runCycle();
      return {
        ok: q.logicalErrorRatePerCycle() < q.physicalErrorRate(),
        pLog: q.logicalErrorRatePerCycle(),
      };
    },
  };
  return machine;
}

function makeMachineQatom() {
  const sim = new NeutralAtomTweezerSim();
  let running = true;
  let mon = null;
  let atomMeshes = [];
  let rydbergBeam = null;
  let statsUi = null;

  function drawAtomMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#080612";
    c.fillRect(0, 0, W, H);
    const V = sim.blockadeShiftMHz();
    const Rb = sim.blockadeRadiusUm();
    const blockaded = sim.atomSpacingUm < Rb;
    c.fillStyle = blockaded ? "#581c87" : "#7c2d12";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `⁸⁷Rb RYDBERG TWEEZER ARRAY · ZONE=${sim.zone} · R=${sim.atomSpacingUm.toFixed(1)} µm (R_b=${Rb.toFixed(1)} µm) · V/2π=${V.toFixed(1)} MHz`,
      24,
      46,
    );

    // Left: 2-Atom Basis Populations |gg>, |gr>, |rg>, |rr>
    c.fillStyle = "#120d24";
    c.fillRect(20, 82, 480, 420);
    c.strokeStyle = "#a855f7";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 480, 420);
    c.fillStyle = "#e9d5ff";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("2-ATOM RYDBERG HILBERT SPACE POPULATIONS", 38, 112);

    const labels = [
      ["|gg⟩ Ground Pair", sim.pop[0], "#38bdf8"],
      ["|gr⟩ Single Exc.", sim.pop[1], "#c084fc"],
      ["|rg⟩ Single Exc.", sim.pop[2], "#c084fc"],
      ["|rr⟩ Blockaded!", sim.pop[3], "#ef4444"],
    ];
    labels.forEach(([lbl, prob, col], idx) => {
      const by = 152 + idx * 78;
      c.fillStyle = "#e2e8f0";
      c.font = '700 15px "JetBrains Mono", monospace';
      c.fillText(`${lbl}: ${(prob * 100).toFixed(1)}%`, 38, by);
      c.fillStyle = "#1e1b4b";
      c.fillRect(38, by + 10, 430, 28);
      c.fillStyle = col;
      c.fillRect(38, by + 10, 430 * Math.max(0.01, prob), 28);
    });

    // Right: Van der Waals V(R) = C6 / R^6 Blockade Potential Curve
    c.fillStyle = "#120d24";
    c.fillRect(520, 82, 484, 420);
    c.strokeStyle = "#f43f5e";
    c.strokeRect(520, 82, 484, 420);
    c.fillStyle = "#fda4af";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("VAN DER WAALS C₆ / R⁶ DIPOLE BLOCKADE CURVE", 538, 112);

    c.strokeStyle = "#f43f5e";
    c.lineWidth = 3.5;
    c.beginPath();
    for (let i = 0; i <= 60; i++) {
      const rUm = 2.5 + (i / 60) * 7.5;
      const vShift = sim.C6 / Math.pow(rUm, 6);
      const px = 544 + (i / 60) * 436;
      const py = 468 - Math.min(320, Math.log10(Math.max(0.1, vShift) * 10) * 82);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.stroke();
    // Marker for current R
    const curX = 544 + ((sim.atomSpacingUm - 2.5) / 7.5) * 436;
    c.strokeStyle = "#fde047";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(curX, 134);
    c.lineTo(curX, 474);
    c.stroke();
    c.fillStyle = "#fde047";
    c.fillText(`R=${sim.atomSpacingUm.toFixed(1)} µm`, Math.min(890, curX + 6), 160);

    // Bottom: Coherent AOD Atom Shuttling Architecture (Bluvstein / Lukin Harvard-QuEra)
    c.fillStyle = "#120d24";
    c.fillRect(20, 522, W - 40, 222);
    c.strokeStyle = "#38bdf8";
    c.strokeRect(20, 522, W - 40, 222);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("ZONED RECONFIGURABLE OPTICAL-TWEEZER ARCHITECTURE (STORAGE ↔ ENTANGLE ↔ READOUT)", 38, 554);
    ["STORAGE", "ENTANGLE", "READOUT"].forEach((zName, idx) => {
      const zx = 48 + idx * 318;
      const active = sim.zone === zName;
      c.fillStyle = active ? "#4c1d95" : "#1e1b4b";
      c.fillRect(zx, 580, 286, 136);
      c.strokeStyle = active ? "#fde047" : "#475569";
      c.strokeRect(zx, 580, 286, 136);
      c.fillStyle = active ? "#fde047" : "#cbd5e1";
      c.font = '700 18px "JetBrains Mono", monospace';
      c.fillText(`${active ? "▶ " : ""}${zName} ZONE`, zx + 18, 622);
      c.fillStyle = "#94a3b8";
      c.font = '600 13px "JetBrains Mono", monospace';
      c.fillText(
        idx === 0
          ? "Hyperfine clock coherence >1s"
          : idx === 1
            ? "480nm+780nm CZ Rydberg Gate"
            : "Fluorescence CMOS readout",
        zx + 18,
        668,
      );
    });
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "qatom",
    era: "2023",
    short: "Rydberg Tweezers",
    name: "Neutral-Atom ⁸⁷Rb Rydberg Optical-Tweezer Quantum Processor",
    group: "quantum",
    view0: 0.38,
    blurb:
      "Room-temperature ultra-high-vacuum quantum computing (Harvard / MIT / QuEra / Pasqal): crossed 2D Acousto-Optic Deflectors (AODs) trap individual ⁸⁷Rb atoms in focused laser tweezers, physically shuttle entangled logical qubits across Storage, Entangle, and Readout zones for any-to-any connectivity, and execute parallel CZ gates via C₆/R⁶ Rydberg dipole blockade.",
    diagram: {
      nodes: [
        { id: "slm", label: "SLM Static Traps", x: 0.18, y: 0.24, color: "#f43f5e" },
        { id: "aod", label: "2D AOD Shuttler", x: 0.18, y: 0.72, color: "#fbbf24" },
        { id: "uhv", label: "87Rb UHV Glass Cell", x: 0.54, y: 0.48, color: "#c084fc" },
        { id: "ryd", label: "480nm Rydberg UV", x: 0.84, y: 0.24, color: "#38bdf8" },
        { id: "cmos", label: "EMCCD Readout", x: 0.84, y: 0.74, color: "#34d399" },
      ],
      edges: [
        ["slm", "uhv", "815nm"],
        ["aod", "uhv", "RF Chirp"],
        ["ryd", "uhv", "C6/R^6 CZ"],
        ["uhv", "cmos", "780nm Photons"],
      ],
    },
    build(kit) {
      atomMeshes = [];
      // 1. HONEYCOMB STAINLESS OPTICAL TABLE + UHV GLASS CELL + MOT COILS
      const table = kit.group([-0.42, 0, 0], {
        name: "Pneumatic Optical Breadboard Table",
        info: "Damped stainless-steel optical table isolating sub-micrometer optical tweezers from floor vibrations.",
      });
      for (const [lx, lz] of [
        [-0.75, -0.52],
        [0.75, -0.52],
        [-0.75, 0.52],
        [0.75, 0.52],
      ]) {
        kit.cyl(0.06, 0.065, 0.74, U.darkAnodized(0x1f2530), [lx, 0.37, lz], {}, table);
      }
      kit.box(1.76, 0.12, 1.26, U.steel(), [0, 0.78, 0], {
        name: "M6 Tapped Optical Breadboard",
      }, table);

      // Octagonal Fused-Silica UHV Science Cell in center + Anti-Helmholtz Copper MOT Coils
      const cellGrp = kit.group([0, 1.12, 0], {
        name: "Octagonal Fused-Silica UHV Science Cell",
        info: "10⁻¹¹ Torr ultra-high-vacuum quartz cell coated against stray reflections; individual rubidium-87 atoms levitate in vacuum at the center.",
        explode: [0, 0.28, 0],
      }, table);
      kit.cyl(0.24, 0.24, 0.16, U.glass(0xdbeafe, 0.26), [0, 0, 0], {
        shell: true,
        name: "Anti-Reflection Quartz Vacuum Window",
      }, cellGrp);
      // Top & Bottom Copper Anti-Helmholtz MOT Coils
      kit.torus(0.22, 0.032, U.copper(), [0, 0.12, 0], {
        rot: [Math.PI / 2, 0, 0],
        name: "Upper Anti-Helmholtz MOT Magnetic Coil",
        info: "Generates a quadrupole magnetic field gradient that, together with 6 Doppler cooling beams, cools ⁸⁷Rb vapor to ~20 µK.",
      }, cellGrp);
      kit.torus(0.22, 0.032, U.copper(), [0, -0.12, 0], {
        rot: [Math.PI / 2, 0, 0],
        name: "Lower Anti-Helmholtz MOT Magnetic Coil",
      }, cellGrp);

      // High-NA Microscope Objective above the UHV cell
      kit.cyl(0.085, 0.11, 0.24, U.brass(), [0, 1.44, 0], {
        name: "0.65-NA Tweezer & Fluorescence Objective",
        info: "Projects diffraction-limited ~1 µm optical tweezer spots into the UHV cell and collects single-atom 780 nm fluorescence photons.",
        explode: [0, 0.45, 0],
      }, table);

      // 16 Glowing Levitating 87Rb Atoms inside the UHV cell!
      for (let a = 0; a < 16; a++) {
        const row = Math.floor(a / 4) - 1.5;
        const col = (a % 4) - 1.5;
        const atom = kit.sphere(
          0.014,
          U.glow(a % 2 === 0 ? 0xf43f5e : 0x38bdf8, 1.8),
          [col * 0.045, 0, row * 0.045],
          {
            name: `Trapped ⁸⁷Rb Atom Qubit #${a}`,
            info: "Single neutral Rubidium-87 atom encoding |0⟩ and |1⟩ in clock hyperfine ground states and excited to n=70S Rydberg orbitals for two-qubit CZ gates.",
          },
          cellGrp,
        );
        atom.userData.gridPos = [col, row];
        atomMeshes.push(atom);
      }

      // 2D AOD & SLM Laser Modules + Glowing Ruby (780nm) & Blue (480nm) Beams across Optical Table!
      kit.box(0.24, 0.16, 0.18, U.darkAnodized(0x1e293b), [-0.66, 0.92, 0], {
        name: "2D Crossed Acousto-Optic Deflector (AOD)",
        info: "Driven by chirped RF waveforms to steer rows and columns of optical tweezers and shuttle entangled atoms coherently across zones.",
      }, table);
      kit.box(0.22, 0.16, 0.2, U.darkAnodized(0x1e293b), [0.66, 0.92, 0], {
        name: "480 nm Rydberg Excitation Laser Head",
        info: "Frequency-stabilized blue laser driving the two-photon Rydberg transition for parallel C₆/R⁶ blockade entangling gates.",
      }, table);
      // Glowing laser beams intersecting inside the UHV cell!
      kit.cyl(0.008, 0.008, 1.24, U.glow(0xf43f5e, 1.5), [-0.02, 1.12, 0], {
        rot: [0, 0, Math.PI / 2],
        name: "815 nm Optical-Tweezer Beam Path",
      }, table);
      rydbergBeam = kit.cyl(0.009, 0.009, 1.24, U.glow(0x38bdf8, 1.7), [0.02, 1.12, 0], {
        rot: [Math.PI / 2, 0, Math.PI / 4],
        name: "480 nm Counter-Propagating Rydberg Beam",
      }, table);

      // 2. OPERATOR CONTROL CONSOLE (Right)
      mon = buildMonitor3D(kit, [0.96, 0.64, 0.14], {
        w: 0.9,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "Rydberg Blockade & Zone Shuttling Console",
        explode: [0.36, 0, 0],
      });
      kit.box(1.0, 0.64, 0.54, U.darkAnodized(0x171426), [0.96, 0.32, 0.14], {
        rot: [0, 0.04, 0],
      });

      drawAtomMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("zone", sim.zone);
        statsUi.set("shift", `${sim.blockadeShiftMHz().toFixed(1)} MHz`);
        statsUi.set("rb", `${sim.blockadeRadiusUm().toFixed(2)} µm`);
        statsUi.set("bell", `${(sim.bellProb * 100).toFixed(1)}%`);
        statsUi.set("leak", `${(sim.rrLeakage * 100).toFixed(2)}%`);
        statsUi.set("tpi", `${(sim.piPulseUs() * 1000).toFixed(1)} ns`);
      };

      const runBtn = Fe(running ? "⏸ Pause" : "▶ Run", () => {
        running = !running;
        runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
      }, "pri");

      statsUi = Pt([
        ["zone", "Active AOD Zone"],
        ["shift", "Blockade V/2π"],
        ["rb", "Blockade Radius"],
        ["bell", "Symmetric |W⟩"],
        ["leak", "|rr⟩ Leakage"],
        ["tpi", "√2 Collective π"],
      ]);

      el.append(
        Ie(
          "Rydberg C₆/R⁶ Dipole Blockade & Coherent Atom Shuttling",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe(
              "Fire Collective π-Pulse",
              () => {
                running = false;
                runBtn.textContent = "▶ Run";
                sim.zone = "ENTANGLE";
                sim.evolveRydbergPulse(sim.piPulseUs());
                if (ctx.diagram) ctx.diagram.pulse("ryd", "uhv", "#38bdf8");
                hi("photon", { min: 0.05 });
                drawAtomMonitor();
                syncStats();
              },
              "pri",
            ),
          ),
          We(
            "Inter-Atom Spacing R (µm)",
            2.6,
            9.6,
            0.2,
            sim.atomSpacingUm,
            (v) => {
              sim.atomSpacingUm = v;
              sim.evolveRydbergPulse(sim.piPulseUs());
              drawAtomMonitor();
              syncStats();
            },
            (v) => `${v.toFixed(1)} µm`,
          ),
          We(
            "Rydberg Rabi Ω/2π (MHz)",
            1.0,
            10.0,
            0.2,
            sim.rabiMHz,
            (v) => {
              sim.rabiMHz = v;
              sim.evolveRydbergPulse(sim.piPulseUs());
              drawAtomMonitor();
              syncStats();
            },
            (v) => `${v.toFixed(1)} MHz`,
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        sim.step(dt);
        if (Math.floor((t + dt) * 3) > Math.floor(t * 3)) {
          if (ctx.diagram) {
            ctx.diagram.pulse("aod", "uhv", "#fbbf24");
            if (sim.zone === "ENTANGLE") ctx.diagram.pulse("ryd", "uhv", "#38bdf8");
            if (sim.zone === "READOUT") ctx.diagram.pulse("uhv", "cmos", "#34d399");
          }
          drawAtomMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      // Physically shuttle the 16 levitating 87Rb atoms across Storage / Entangle / Readout zones!
      const zoneShiftX = Math.sin(sim.shuttlePhase * ((Math.PI * 2) / 3)) * 0.055;
      const spacingScale = 0.01 + (sim.atomSpacingUm / 10) * 0.038;
      atomMeshes.forEach((m) => {
        const [col, row] = m.userData.gridPos;
        m.position.x = zoneShiftX + col * spacingScale;
        m.position.z = row * spacingScale;
      });
      if (rydbergBeam) {
        rydbergBeam.material.emissiveIntensity = sim.zone === "ENTANGLE" ? 2.1 : 0.45;
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const a = new NeutralAtomTweezerSim();
      a.atomSpacingUm = 3.6;
      const r = a.evolveRydbergPulse(a.piPulseUs());
      return { ok: r.bellProb > 0.98 && r.rrLeakage < 0.01, bellProb: +r.bellProb.toFixed(4) };
    },
  };
  return machine;
}

function makeMachineQphotonic() {
  const sim = new PhotonicMbqcSim();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let pulseSpheres = [];
  let statsUi = null;

  function drawPhotonicMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060a14";
    c.fillRect(0, 0, W, H);
    c.fillStyle = "#be185d";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#ffffff";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `PHOTONIC MBQC CLUSTER-STATE TELEPORTATION · BRANCH s=(${sim.outcomes.join(",")}) · SQUEEZING=${sim.squeezingDb} dB`,
      24,
      46,
    );

    // Top: 4-Node Linear Cluster State |G> + Adaptive Feedforward Diagram
    c.fillStyle = "#0f172a";
    c.fillRect(20, 82, W - 40, 290);
    c.strokeStyle = "#ec4899";
    c.lineWidth = 2;
    c.strokeRect(20, 82, W - 40, 290);
    c.fillStyle = "#fbcfe8";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "ONE-WAY CLUSTER STATE |G⟩ = CZ₂₃ CZ₁₂ CZ₀₁ |++++⟩  +  TFLN ELECTRO-OPTIC FEEDFORWARD",
      36,
      112,
    );

    for (let k = 0; k < 4; k++) {
      const nx = 140 + k * 245;
      const ny = 225;
      if (k < 3) {
        c.strokeStyle = "#f472b6";
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(nx + 52, ny);
        c.lineTo(nx + 193, ny);
        c.stroke();
      }
      c.beginPath();
      c.arc(nx, ny, 52, 0, Math.PI * 2);
      c.fillStyle = k < 3 ? "#500724" : "#064e3b";
      c.fill();
      c.strokeStyle = k < 3 ? "#f472b6" : "#34d399";
      c.lineWidth = 3.5;
      c.stroke();
      c.fillStyle = "#ffffff";
      c.font = '700 16px "JetBrains Mono", monospace';
      c.fillText(k < 3 ? `Mode Q${k}` : "OUT Q3", nx - 34, ny - 10);
      c.font = '600 13px "JetBrains Mono", monospace';
      if (k < 3) {
        c.fillStyle = "#fde047";
        c.fillText(`m_${k} = ${sim.outcomes[k]}`, nx - 28, ny + 14);
        c.fillStyle = "#f9a8d4";
        c.fillText(`φ=${sim.angles[k].toFixed(2)}`, nx - 28, ny + 32);
      } else {
        const xPow = sim.outcomes[0] ^ sim.outcomes[2];
        const zPow = sim.outcomes[1];
        c.fillStyle = "#6ee7b7";
        c.fillText(`X^${xPow} Z^${zPow} |ψ⟩`, nx - 38, ny + 18);
      }
    }

    // Bottom: Teleported Output Bloch Vector (100% invariant across all 8 random SNSPD click outcomes!)
    c.fillStyle = "#0f172a";
    c.fillRect(20, 392, W - 40, 350);
    c.strokeStyle = "#34d399";
    c.strokeRect(20, 392, W - 40, 350);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "FEEDFORWARD-CORRECTED OUTPUT PHOTON BLOCH VECTOR (INVARIANT ACROSS ALL 8 OUTCOMES!)",
      36,
      422,
    );

    const [bx, by, bz] = sim.outputBloch;
    const comps = [
      ["⟨X⟩ Bloch Component", bx, "#38bdf8"],
      ["⟨Y⟩ Bloch Component", by, "#f472b6"],
      ["⟨Z⟩ Bloch Component", bz, "#34d399"],
    ];
    comps.forEach(([lbl, val, col], idx) => {
      const ry = 468 + idx * 78;
      c.fillStyle = "#e2e8f0";
      c.font = '700 15px "JetBrains Mono", monospace';
      c.fillText(`${lbl}: ${val >= 0 ? "+" : ""}${val.toFixed(4)}`, 36, ry);
      c.fillStyle = "#1e293b";
      c.fillRect(340, ry - 18, 620, 28);
      const mid = 340 + 310;
      c.fillStyle = col;
      if (val >= 0) c.fillRect(mid, ry - 18, 310 * val, 28);
      else c.fillRect(mid + 310 * val, ry - 18, -310 * val, 28);
    });
    c.fillStyle = "#fde68a";
    c.fillText(
      `Purity |r| = ${Math.hypot(bx, by, bz).toFixed(6)}  (Exact Unitary Gate Teleportation via Destructive Photon Measurement)`,
      36,
      716,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "qphotonic",
    era: "2025",
    short: "Fusion Photonic QC",
    name: "Measurement-Based Fusion Photonic Quantum Computer",
    group: "quantum",
    view0: 0.36,
    blurb:
      "PsiQuantum / Xanadu measurement-based photonic paradigm: silicon-nitride (Si₃N₄) micro-rings generate resource states stitched by beamsplitter fusion gates and optical fiber delay loops (all at room temperature!), while 4 K Superconducting Nanowire Single-Photon Detectors (SNSPDs) drive nanosecond TFLN electro-optic Pauli feedforward.",
    diagram: {
      nodes: [
        { id: "src", label: "Si3N4 Ring Sources", x: 0.16, y: 0.28, color: "#f472b6" },
        { id: "fib", label: "Fiber Time-Bin Loop", x: 0.48, y: 0.22, color: "#38bdf8" },
        { id: "eom", label: "TFLN Phase Feedfwd", x: 0.48, y: 0.72, color: "#fbbf24" },
        { id: "snspd", label: "4K SNSPD Detectors", x: 0.84, y: 0.28, color: "#34d399" },
        { id: "out", label: "Teleported Photon", x: 0.84, y: 0.72, color: "#c08cff" },
      ],
      edges: [
        ["src", "fib", "1550nm"],
        ["fib", "eom", "Cluster |G>"],
        ["eom", "snspd", "XY Basis"],
        ["snspd", "eom", "s_k Click"],
        ["eom", "out", "X^a Z^b"],
      ],
    },
    build(kit) {
      pulseSpheres = [];
      const bench = kit.group([-0.42, 0, 0], {
        name: "Photonic Quantum Interconnect Chassis",
        info: "Combines room-temperature 300 mm CMOS-foundry silicon-nitride photonic wafers, low-loss optical fiber delay banks, and a compact 4 K SNSPD detector pod.",
      });
      kit.box(1.68, 0.74, 1.18, U.darkAnodized(0x141923), [0, 0.37, 0], {
        name: "Photonic Rack Base & Laser Pump Bay",
      }, bench);

      // Silicon-Nitride (Si3N4) + Thin-Film Lithium Niobate (TFLN) Photonic Wafer Carrier
      const pic = kit.group([-0.28, 0.78, 0.06], {
        name: "Si₃N₄ + TFLN Integrated Photonic Module",
        info: "Ultra-low-loss silicon-nitride waveguides (<0.05 dB/cm) paired with >50 GHz thin-film lithium-niobate Pockels electro-optic phase modulators.",
        explode: [-0.25, 0.28, 0.15],
      }, bench);
      kit.box(0.76, 0.04, 0.68, U.gold(), [0, 0, 0], {}, pic);
      kit.box(0.62, 0.018, 0.54, U.siliconDie(), [0, 0.028, 0], {
        name: "300mm-Foundry Photonic Integrated Circuit Die",
      }, pic);
      for (let r = 0; r < 4; r++) {
        kit.torus(0.045, 0.006, U.glow(0xf472b6, 1.5), [-0.18 + r * 0.12, 0.04, -0.1], {
          rot: [Math.PI / 2, 0, 0],
          name: "Squeezed-Photon Micro-Ring Resonator",
        }, pic);
      }

      // Coiled Optical Fiber Delay Spools (3D Lattice Time-Multiplexing!) + Racing Photon Pulses
      for (let sp = 0; sp < 3; sp++) {
        const sx = -0.45 + sp * 0.32;
        const spool = kit.group([sx, 0.92, -0.32], {
          name: `Telecom 1550 nm Optical Fiber Delay Spool ${sp + 1}`,
          info: "Stores flying photonic qubits in ultra-low-loss silica fiber while waiting for upstream SNSPD click outcomes and classical FPGA feedforward.",
          explode: [0, 0.36, -0.32],
        }, bench);
        kit.cyl(0.11, 0.11, 0.14, U.alu(), [0, 0, 0], {}, spool);
        for (let t = 0; t < 5; t++) {
          kit.torus(0.125, 0.007, U.glow(0x38bdf8, 1.15), [0, -0.05 + t * 0.025, 0], {
            rot: [Math.PI / 2, 0, 0],
          }, spool);
        }
        const ph = kit.sphere(0.018, U.glow(0xf472b6, 2.2), [0.125, 0, 0], {
          name: "Flying Telecom-Band Single Photon",
        }, spool);
        pulseSpheres.push(ph);
      }

      // Compact 4 Kelvin Gifford-McMahon SNSPD Cryopod (Right side of optical bench — NO 15mK dilution fridge needed!)
      const pod = kit.group([0.52, 0.74, 0.02], {
        name: "4 K SNSPD Single-Photon Detector Cryopod",
        info: "Closed-cycle 4 Kelvin cryocooler housing >99%-efficiency Superconducting Nanowire Single-Photon Detectors (WSi / NbN nanowires) with <15 ps timing jitter.",
        explode: [0.32, 0.28, 0],
      }, bench);
      kit.cyl(0.24, 0.25, 0.62, U.gold(), [0, 0.31, 0], {
        shell: true,
        name: "4 K Gold Radiation Shield",
      }, pod);
      kit.cyl(0.14, 0.14, 0.38, U.copper(), [0, 0.24, 0], {
        name: "4 K Coldhead & SNSPD Detector Array",
      }, pod);

      // Console Monitor (Right)
      mon = buildMonitor3D(kit, [0.96, 0.64, 0.16], {
        w: 0.9,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "MBQC Cluster-State & Feedforward Console",
        explode: [0.36, 0, 0],
      });
      kit.box(1.0, 0.64, 0.54, U.darkAnodized(0x191224), [0.96, 0.32, 0.16], {
        rot: [0, 0.04, 0],
      });

      drawPhotonicMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        const [bx, by, bz] = sim.outputBloch;
        statsUi.set("branch", `(${sim.outcomes.join(", ")})`);
        statsUi.set(
          "pauli",
          `X^${sim.outcomes[0] ^ sim.outcomes[2]} Z^${sim.outcomes[1]}`,
        );
        statsUi.set("bloch", `[${bx.toFixed(2)}, ${by.toFixed(2)}, ${bz.toFixed(2)}]`);
        statsUi.set("pur", Math.hypot(bx, by, bz).toFixed(5));
        statsUi.set("sqz", `${sim.squeezingDb} dB`);
        statsUi.set("cryo", "4.0 K (SNSPD only)");
      };

      const runBtn = Fe(running ? "⏸ Pause" : "▶ Run", () => {
        running = !running;
        runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
      }, "pri");

      statsUi = Pt([
        ["branch", "SNSPD Outcomes"],
        ["pauli", "Pauli Feedforward"],
        ["bloch", "Output Bloch r"],
        ["pur", "Teleported Purity"],
        ["sqz", "Source Squeezing"],
        ["cryo", "Detector Temp"],
      ]);

      el.append(
        Ie(
          "One-Way Cluster State |G⟩ & Pauli Feedforward Teleportation",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Next Random Shot", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.runTeleportationShot();
              hi("photon", { min: 0.04 });
              drawPhotonicMonitor();
              syncStats();
            }),
            st(
              Array.from({ length: 8 }, (_, m) => {
                const bits = `${m & 1}${(m >> 1) & 1}${(m >> 2) & 1}`;
                return [String(m), `Force SNSPD Clicks s=${bits}`];
              }),
              "0",
              (val) => {
                const m = Number(val);
                sim.runTeleportationShot([m & 1, (m >> 1) & 1, (m >> 2) & 1]);
                drawPhotonicMonitor();
                syncStats();
              },
            ),
          ),
          We(
            "Measurement Basis α (rad)",
            -3.1,
            3.1,
            0.1,
            sim.angles[0],
            (v) => {
              sim.angles[0] = v;
              sim.runTeleportationShot(sim.outcomes);
              drawPhotonicMonitor();
              syncStats();
            },
            (v) => `${v.toFixed(2)} rad`,
          ),
          We(
            "Measurement Basis β (rad)",
            -3.1,
            3.1,
            0.1,
            sim.angles[1],
            (v) => {
              sim.angles[1] = v;
              sim.runTeleportationShot(sim.outcomes);
              drawPhotonicMonitor();
              syncStats();
            },
            (v) => `${v.toFixed(2)} rad`,
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 2.5;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("src", "fib", "#f472b6");
            ctx.diagram.pulse("fib", "eom", "#38bdf8");
            ctx.diagram.pulse("eom", "snspd", "#34d399");
            ctx.diagram.pulse("eom", "out", "#c08cff");
          }
          drawPhotonicMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      pulseSpheres.forEach((p, idx) => {
        const ang = t * 6 + idx * 2.1;
        p.position.set(Math.cos(ang) * 0.125, 0, Math.sin(ang) * 0.125);
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const p = new PhotonicMbqcSim();
      const b0 = p.runTeleportationShot([0, 0, 0]).bloch;
      const b7 = p.runTeleportationShot([1, 1, 1]).bloch;
      const diff = Math.hypot(b0[0] - b7[0], b0[1] - b7[1], b0[2] - b7[2]);
      return { ok: diff < 1e-9, purity: +Math.hypot(...b0).toFixed(4) };
    },
  };
  return machine;
}

function makeMachineQtopo() {
  const sim = new TopologicalMajoranaSim();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let mzmOrbs = [];
  let statsUi = null;

  function drawTopoMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#050a10";
    c.fillRect(0, 0, W, H);
    const isTopo = sim.isTopologicalPhase();
    c.fillStyle = isTopo ? "#065f46" : "#7f1d1d";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `TOPOLOGICAL MAJORANA TETRON · μ=${sim.mu.toFixed(2)}t (${isTopo ? "|μ| < 2t TOPOLOGICAL PHASE ✓" : "|μ| > 2t TRIVIAL INSULATOR"}) · ΔE₀=${sim.zeroModeSplitting.toFixed(4)}`,
      22,
      46,
    );

    // Left: Exact 16-Eigenvalue Bogoliubov-de Gennes Kitaev Spectrum!
    c.fillStyle = "#0b1520";
    c.fillRect(20, 82, 500, 430);
    c.strokeStyle = "#10b981";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 500, 430);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("16×16 KITAEV BdG QUASIPARTICLE SPECTRUM E_n", 38, 112);

    const zeroY = 305;
    c.strokeStyle = "rgba(250, 204, 21, 0.45)";
    c.setLineDash([6, 6]);
    c.beginPath();
    c.moveTo(38, zeroY);
    c.lineTo(502, zeroY);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = "#fde047";
    c.font = '600 13px "JetBrains Mono", monospace';
    c.fillText("E = 0 (Majorana Zero Mode Manifold)", 40, zeroY - 10);

    sim.spectrum.forEach((ev, idx) => {
      const px = 52 + (idx / 15) * 436;
      const py = zeroY - Math.max(-165, Math.min(165, ev * 58));
      const isZeroMode = idx === 7 || idx === 8;
      c.beginPath();
      c.arc(px, py, isZeroMode ? 9 : 6, 0, Math.PI * 2);
      c.fillStyle = isZeroMode && isTopo ? "#fde047" : "#38bdf8";
      c.fill();
    });

    // Right: Non-Abelian Ising Anyon Braid Word & Logical Bloch Vector
    c.fillStyle = "#0b1520";
    c.fillRect(540, 82, 464, 430);
    c.strokeStyle = "#eab308";
    c.strokeRect(540, 82, 464, 430);
    c.fillStyle = "#fef08a";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("NON-ABELIAN ISING ANYON BRAID GROUP", 558, 112);
    c.fillStyle = "#cbd5e1";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      "Word: " + (sim.braidWord.length ? sim.braidWord.join(" · ") : "|0_L⟩ (Identity)"),
      558,
      154,
    );
    c.fillStyle = "#94a3b8";
    c.font = '600 13px "JetBrains Mono", monospace';
    c.fillText("U(σ₁) = exp(-iπ/4 Z)   U(σ₂) = exp(-iπ/4 X)", 558, 188);
    c.fillStyle = "#f472b6";
    c.fillText("Notice: U(σ₁)U(σ₂) ≠ U(σ₂)U(σ₁) (Non-Abelian!)", 558, 214);

    const bl = sim.bloch();
    ["⟨X_L⟩", "⟨Y_L⟩", "⟨Z_L⟩"].forEach((lbl, i) => {
      const by = 264 + i * 72;
      c.fillStyle = "#e2e8f0";
      c.font = '700 15px "JetBrains Mono", monospace';
      c.fillText(`${lbl} = ${bl[i] >= 0 ? "+" : ""}${bl[i].toFixed(3)}`, 558, by);
      c.fillStyle = "#1e293b";
      c.fillRect(710, by - 16, 270, 24);
      const mid = 710 + 135;
      c.fillStyle = i === 0 ? "#38bdf8" : i === 1 ? "#f472b6" : "#34d399";
      if (bl[i] >= 0) c.fillRect(mid, by - 16, 135 * bl[i], 24);
      else c.fillRect(mid + 135 * bl[i], by - 16, -135 * bl[i], 24);
    });

    // Bottom Explanation
    c.fillStyle = "#0b1520";
    c.fillRect(20, 530, W - 40, 212);
    c.strokeStyle = "#38bdf8";
    c.strokeRect(20, 530, W - 40, 212);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("TOPOLOGICAL HARDWARE PROTECTION: INAS/AL HYBRID TETRON & FERMION PARITY", 38, 562);
    c.fillStyle = "#e2e8f0";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      "• Unpaired Majorana operators γ₁, γ₂, γ₃, γ₄ localize at opposite ends of p-wave superconducting nanowires.",
      38,
      610,
    );
    c.fillText(
      "• Local electromagnetic noise cannot measure iγ₁γ₂ non-locally -> gates depend ONLY on spacetime knot topology!",
      38,
      654,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "qtopo",
    era: "2025+",
    short: "Majorana Braiding",
    name: "Topological Majorana Zero-Mode Non-Abelian Quantum Processor",
    group: "quantum",
    view0: 0.4,
    blurb:
      "Kitaev's hardware-protected quantum computing paradigm (Microsoft Majorana 1 / Delft-Station Q InAs/Al tetrons): tuning chemical potential |μ| < 2t under an axial magnetic field drives hybrid semiconductor-superconductor nanowires into a topological phase hosting unpaired Majorana Zero Modes (γ₁..γ₄) whose non-Abelian spacetime braids (σ₁σ₂ ≠ σ₂σ₁) execute topologically protected Clifford gates.",
    diagram: {
      nodes: [
        { id: "vec", label: "B_∥ Zeeman Coil", x: 0.18, y: 0.24, color: "#38bdf8" },
        { id: "nw", label: "InAs/Al Tetron Wires", x: 0.5, y: 0.3, color: "#fbbf24" },
        { id: "mzm", label: "4× Majorana γ₁..γ₄", x: 0.84, y: 0.28, color: "#fde047" },
        { id: "qd", label: "Quantum-Dot Parity", x: 0.5, y: 0.76, color: "#34d399" },
        { id: "brd", label: "Non-Abelian Braid", x: 0.84, y: 0.76, color: "#f472b6" },
      ],
      edges: [
        ["vec", "nw", "|μ|<2t"],
        ["nw", "mzm", "E = 0"],
        ["mzm", "qd", "iγ₁γ₂"],
        ["qd", "brd", "σ₁, σ₂"],
      ],
    },
    build(kit) {
      mzmOrbs = [];
      const stage = kit.group([-0.42, 0, 0], {
        name: "Cryogenic Topological Chip Carrier & Braid Sculpture",
        info: "Gold-plated cryogenic cold-finger puck holding the InAs/Al topological superconductor die, vector solenoid, and 3D spacetime Majorana worldline braid visualization.",
      });
      kit.cyl(0.78, 0.84, 0.22, U.gold(), [0, 0.11, 0], {
        name: "Gold-Plated Millikelvin Cold-Finger Puck",
      }, stage);
      // Superconducting axial Zeeman solenoid ring
      kit.torus(0.68, 0.045, U.copper(), [0, 0.34, 0], {
        rot: [Math.PI / 2, 0, 0],
        name: "1.2 Tesla Superconducting Zeeman Solenoid",
        info: "Applies an in-plane magnetic field along the InAs nanowire spin-orbit axis to open the topological p-wave gap.",
      }, stage);

      // Sapphire / Silicon Die + 2 Parallel InAs/Al Nanowires + Superconducting Bridge (Tetron!)
      kit.box(0.88, 0.04, 0.72, U.siliconDie(), [0, 0.25, 0], {
        name: "InAs / Epitaxial-Al Topological Tetron Die",
      }, stage);

      const mzmCoords = [
        [-0.32, 0.3, -0.16],
        [0.32, 0.3, -0.16],
        [-0.32, 0.3, 0.16],
        [0.32, 0.3, 0.16],
      ];
      for (const wz of [-0.16, 0.16]) {
        kit.cyl(0.022, 0.022, 0.68, U.alu(), [0, 0.3, wz], {
          rot: [0, 0, Math.PI / 2],
          name: "InAs/Al Hybrid Topological Nanowire",
          info: "Indium-arsenide semiconductor nanowire with 7 nm epitaxial aluminum shell inducing proximity p-wave superconductivity.",
        }, stage);
      }
      kit.box(0.05, 0.03, 0.38, U.gold(), [0, 0.31, 0], {
        name: "Coherent Superconducting Tetron Spine",
      }, stage);

      // 4 Glowing Golden Majorana Zero-Mode Bound States at the 4 wire endpoints!
      mzmCoords.forEach((pos, idx) => {
        const orb = kit.sphere(0.042, U.glow(0xfde047, 2.2), pos, {
          name: `Majorana Zero Mode γ_${idx + 1}`,
          info: "Zero-energy self-conjugate quasiparticle (γ = γ†) exponentially localized at the topological nanowire boundary when |μ| < 2t.",
          live: () => `|μ|=${sim.mu.toFixed(2)}t · ΔE₀=${sim.zeroModeSplitting.toFixed(4)}`,
        }, stage);
        mzmOrbs.push(orb);
      });

      // Sculptural 3D Spacetime Worldline Braid Tubes rising above γ1..γ4 (σ1 & σ2 Helical Knots!)
      const buildHelixPts = (xA, zA, xB, zB, turns, phaseOff) => {
        const pts = [];
        const cx = (xA + xB) * 0.5;
        const cz = (zA + zB) * 0.5;
        const rx = (xB - xA) * 0.5;
        const rz = (zB - zA) * 0.5 || 0.09;
        for (let i = 0; i <= 32; i++) {
          const u = i / 32;
          const ang = u * Math.PI * turns + phaseOff;
          pts.push([
            cx + Math.cos(ang) * (Math.abs(rx) || 0.09),
            0.34 + u * 1.28,
            cz + Math.sin(ang) * (Math.abs(rz) || 0.09),
          ]);
        }
        return pts;
      };

      kit.tube(
        buildHelixPts(-0.32, -0.16, 0.32, -0.16, 2, 0),
        0.014,
        U.glow(0xfbbf24, 1.5),
        {
          name: "Spacetime Braid Worldline σ₁ (γ₁ ↔ γ₂)",
          info: "Worldline trajectory exchanging Majoranas γ₁ and γ₂ in (2+1)D spacetime: applies exact non-Abelian phase gate exp(-iπ/4 Z).",
          explode: [0, 0.35, -0.2],
        },
        stage,
      );
      kit.tube(
        buildHelixPts(-0.32, -0.16, 0.32, -0.16, 2, Math.PI),
        0.014,
        U.glow(0x38bdf8, 1.5),
        {},
        stage,
      );
      kit.tube(
        buildHelixPts(0.32, -0.16, -0.32, 0.16, 2, 0.5),
        0.014,
        U.glow(0xf472b6, 1.5),
        {
          name: "Spacetime Braid Worldline σ₂ (γ₂ ↔ γ₃)",
          info: "Cross-wire worldline braid exchanging γ₂ and γ₃: applies non-commuting rotation exp(-iπ/4 X) so σ₁σ₂ ≠ σ₂σ₁!",
          explode: [0, 0.35, 0.2],
        },
        stage,
      );

      // Protective Cryo Dome (shell: true)
      kit.cyl(0.76, 0.76, 1.65, U.glass(0xdbeafe, 0.16), [0, 0.96, 0], {
        shell: true,
        name: "Topological Spacetime Display Dome",
      }, stage);

      // Console Monitor (Right)
      mon = buildMonitor3D(kit, [0.95, 0.64, 0.14], {
        w: 0.9,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "Kitaev BdG Spectrum & Braid Group Console",
        explode: [0.36, 0, 0],
      });
      kit.box(1.0, 0.64, 0.54, U.darkAnodized(0x111c24), [0.95, 0.32, 0.14], {
        rot: [0, 0.04, 0],
      });

      drawTopoMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        const bl = sim.bloch();
        statsUi.set("phase", sim.isTopologicalPhase() ? "TOPOLOGICAL (|μ|<2t)" : "TRIVIAL (|μ|>2t)");
        statsUi.set("split", sim.zeroModeSplitting.toFixed(5));
        statsUi.set("word", sim.braidWord.slice(-5).join("") || "I");
        statsUi.set("bloch", `[${bl[0].toFixed(2)}, ${bl[1].toFixed(2)}, ${bl[2].toFixed(2)}]`);
        statsUi.set("dim", "16×16 Exact BdG");
        statsUi.set("stat", "Ising Non-Abelian");
      };

      const runBtn = Fe(running ? "⏸ Pause" : "▶ Run", () => {
        running = !running;
        runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
      }, "pri");

      statsUi = Pt([
        ["phase", "Quantum Phase"],
        ["split", "MZM Zero Splitting"],
        ["word", "Braid Word"],
        ["bloch", "Logical Bloch"],
        ["dim", "Hamiltonian"],
        ["stat", "Anyon Statistics"],
      ]);

      el.append(
        Ie(
          "Kitaev BdG Phase Transition & Non-Abelian Braiding",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe(
              "Braid σ₁ (Z-rot)",
              () => {
                running = false;
                runBtn.textContent = "▶ Run";
                sim.braid(1);
                if (ctx.diagram) ctx.diagram.pulse("mzm", "brd", "#fbbf24");
                hi("rf", { min: 0.05 });
                drawTopoMonitor();
                syncStats();
              },
              "pri",
            ),
            Fe(
              "Braid σ₂ (X-rot)",
              () => {
                running = false;
                runBtn.textContent = "▶ Run";
                sim.braid(2);
                if (ctx.diagram) ctx.diagram.pulse("mzm", "brd", "#f472b6");
                hi("rf", { min: 0.05 });
                drawTopoMonitor();
                syncStats();
              },
              "pri",
            ),
            Fe("Reset |0_L⟩", () => {
              sim.resetBraid();
              drawTopoMonitor();
              syncStats();
            }),
          ),
          We(
            "Chemical Potential μ / t (Transition at 2.0)",
            0.0,
            3.4,
            0.1,
            sim.mu,
            (v) => {
              sim.mu = v;
              sim.computeKitaevSpectrum();
              drawTopoMonitor();
              syncStats();
            },
            (v) => `${v.toFixed(2)} t`,
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 1.8;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("vec", "nw", "#38bdf8");
            ctx.diagram.pulse("nw", "mzm", "#fde047");
            ctx.diagram.pulse("mzm", "brd", "#f472b6");
          }
          drawTopoMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      const isTopo = sim.isTopologicalPhase();
      mzmOrbs.forEach((orb, idx) => {
        orb.material.emissiveIntensity = isTopo
          ? 1.8 + 0.6 * Math.sin(t * 4 + idx)
          : 0.12;
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const tSim = new TopologicalMajoranaSim();
      tSim.mu = 0.4;
      tSim.computeKitaevSpectrum();
      const sTopo = tSim.zeroModeSplitting;
      tSim.mu = 3.0;
      tSim.computeKitaevSpectrum();
      return { ok: sTopo < 0.05 && tSim.zeroModeSplitting > 0.5, sTopo: +sTopo.toFixed(5) };
    },
  };
  return machine;
}

function makeMachineQomega() {
  const sim = new OmegaSingularityCore();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let icosaCore = null;
  let gimbalRings = [];
  let statsUi = null;

  function drawOmegaHolo() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1280,
      H = 768;
    c.fillStyle = "#040711";
    c.fillRect(0, 0, W, H);

    // Golden/Cyan Header Banner
    c.fillStyle = "#1e1b4b";
    c.fillRect(18, 14, W - 36, 54);
    c.strokeStyle = "#fbbf24";
    c.lineWidth = 2;
    c.strokeRect(18, 14, W - 36, 54);
    c.fillStyle = "#fde047";
    c.font = '700 22px "JetBrains Mono", monospace';
    c.fillText(
      `OMEGA-Q FAULT-TOLERANT HYPER-QUANTUM CORE · d=${sim.codeDistance} (ε_L=${sim.logicalErrorRate().toExponential(1)}) · MODE: ${sim.mode.toUpperCase()}`,
      34,
      49,
    );

    if (sim.mode === "shor") {
      const sr = sim.shorResult;
      c.fillStyle = "#0b1224";
      c.fillRect(22, 86, W - 44, 440);
      c.strokeStyle = "#38bdf8";
      c.strokeRect(22, 86, W - 44, 440);
      c.fillStyle = "#7dd3fc";
      c.font = '700 19px "JetBrains Mono", monospace';
      c.fillText(
        `EXACT SHOR QUANTUM FACTORING: f(x) = ${sr.a}^x mod ${sr.N}  ->  QFT_256 INTERFERENCE SPECTRUM`,
        42,
        122,
      );
      const maxP = Math.max(0.01, ...sim.qftProbs);
      for (let k = 0; k < 256; k++) {
        const p = sim.qftProbs[k];
        const bh = (p / maxP) * 320;
        const bx = 46 + (k / 256) * (W - 92);
        c.fillStyle = p > maxP * 0.25 ? "#fde047" : "#38bdf8";
        c.fillRect(bx, 488 - bh, Math.max(2.5, (W - 92) / 256 - 1), bh);
      }
      c.fillStyle = "#34d399";
      c.font = '700 24px "JetBrains Mono", monospace';
      c.fillText(
        `CONTINUED-FRACTION PERIOD r = ${sr.period}   ==>   gcd(${sr.a}^(${sr.period}/2) ± 1, ${sr.N}) = ${sr.factors[0]} × ${sr.factors[1]}`,
        42,
        588,
      );
    } else if (sim.mode === "grover") {
      c.fillStyle = "#0b1224";
      c.fillRect(22, 86, W - 44, 440);
      c.strokeStyle = "#f472b6";
      c.strokeRect(22, 86, W - 44, 440);
      c.fillStyle = "#f9a8d4";
      c.font = '700 19px "JetBrains Mono", monospace';
      c.fillText(
        `EXACT 256-STATE GROVER AMPLITUDE AMPLIFICATION · ORACLE TARGET |${sim.groverTarget}⟩ · ITERATION ${sim.groverIter}/12`,
        42,
        122,
      );
      for (let s = 0; s < 256; s++) {
        const p = sim.groverAmp[s] * sim.groverAmp[s];
        const bh = Math.min(330, p * 330);
        const bx = 46 + (s / 256) * (W - 92);
        c.fillStyle = s === sim.groverTarget ? "#fde047" : "#ec4899";
        c.fillRect(bx, 492 - Math.max(3, bh), Math.max(2.5, (W - 92) / 256 - 1), Math.max(3, bh));
      }
      c.fillStyle = "#fde047";
      c.font = '700 24px "JetBrains Mono", monospace';
      c.fillText(
        `TARGET PROBABILITY P(|${sim.groverTarget}⟩) = ${(sim.groverTargetProb * 100).toFixed(2)}%  (O(√N) = 12 Oracle Calls vs 128 Classical!)`,
        42,
        588,
      );
    } else {
      // Exact H2 Molecular Dissociation Potential Energy Surface
      c.fillStyle = "#0b1224";
      c.fillRect(22, 86, W - 44, 440);
      c.strokeStyle = "#34d399";
      c.strokeRect(22, 86, W - 44, 440);
      c.fillStyle = "#6ee7b7";
      c.font = '700 19px "JetBrains Mono", monospace';
      c.fillText(
        `JORDAN–WIGNER H₂ ELECTRONIC STRUCTURE · EQUILIBRIUM R_eq = ${sim.h2EqAngstrom.toFixed(2)} Å · E₀ = ${sim.h2MinEnergyHa.toFixed(4)} Ha`,
        42,
        122,
      );

      const mapX = (R) => 70 + ((R - 0.35) / 2.16) * (W - 140);
      const mapY = (E) => 470 - ((E - -1.25) / 1.45) * 310;

      const drawCurve = (key, col, width) => {
        c.strokeStyle = col;
        c.lineWidth = width;
        c.beginPath();
        sim.h2Curve.forEach((pt, idx) => {
          const px = mapX(pt.R);
          const py = Math.max(135, Math.min(505, mapY(pt[key])));
          if (idx === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        });
        c.stroke();
      };
      drawCurve("eExcited", "#f472b6", 2.5);
      drawCurve("eHF", "#fbbf24", 2.5);
      drawCurve("eGround", "#34d399", 4);

      c.fillStyle = "#34d399";
      c.font = '700 18px "JetBrains Mono", monospace';
      c.fillText("■ Exact Full-CI Singlet Ground State   ■ Hartree-Fock |σ_g²⟩   ■ Doubly-Excited |σ_u²⟩", 42, 588);
    }

    // Honest Horizon Engineering Banner at Bottom
    c.fillStyle = "#0f172a";
    c.fillRect(22, 622, W - 44, 122);
    c.strokeStyle = "#fbbf24";
    c.strokeRect(22, 622, W - 44, 122);
    c.fillStyle = "#fde68a";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "SPECULATIVE FAULT-TOLERANT HORIZON ARCHITECTURE · 100% REAL QUANTUM LINEAR ALGEBRA",
      42,
      654,
    );
    c.fillStyle = "#cbd5e1";
    c.font = '500 15px "JetBrains Mono", monospace';
    c.fillText(
      "Combines topological Majorana parity protection, optical qLDPC teleportation interconnects, and magic-state factories.",
      42,
      686,
    );
    c.fillText(
      "Every QFT peak, continued-fraction factor, 256-state Grover amplitude, and H₂ CI eigenvalue above is computed live.",
      42,
      714,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "qomega",
    era: "2045+",
    short: "OMEGA-Q Singularity ★",
    name: "OMEGA-Q Fault-Tolerant Hyper-Quantum Horizon Computer",
    group: "quantum",
    capital: true,
    view0: 0.44,
    blurb:
      "Capital monument of the Quantum Age (Speculative Fault-Tolerant Horizon Architecture): unifies topological Majorana logical vaults, room-temperature photonic entanglement routers, and d=31 quantum Low-Density Parity-Check (qLDPC) error suppression (ε_L ≈ 10⁻³⁴) — running genuine live Shor QFT₂₅₆ factoring, 256-state Grover search, and H₂ quantum chemistry.",
    diagram: {
      nodes: [
        { id: "core", label: "Icosahedral QPU Core", x: 0.5, y: 0.44, color: "#fde047" },
        { id: "qldpc", label: "d=31 qLDPC Vaults", x: 0.18, y: 0.24, color: "#38bdf8" },
        { id: "magic", label: "T-Gate Magic Factory", x: 0.82, y: 0.24, color: "#f472b6" },
        { id: "tele", label: "Optical Bell Router", x: 0.18, y: 0.78, color: "#34d399" },
        { id: "alg", label: "Shor / Grover / H2", x: 0.82, y: 0.78, color: "#c08cff" },
      ],
      edges: [
        ["qldpc", "core", "Logical |ψ_L⟩"],
        ["magic", "core", "|T⟩ Inject"],
        ["tele", "core", "Bell Pairs"],
        ["core", "alg", "QFT / Oracle"],
      ],
    },
    build(kit) {
      gimbalRings = [];
      // 1. STEPPED OBSIDIAN, BRUSHED-GOLD & SAPPHIRE CATHEDRAL DAIS
      const cathedral = kit.group([-0.38, 0, 0], {
        name: "OMEGA-Q Cryo-Photonic Cathedral",
        info: "Speculative fault-tolerant modular hyper-quantum architecture linking 8 topological logical-qubit vaults around a levitating optical-resonator entanglement core.",
      });
      kit.cyl(1.38, 1.48, 0.1, U.darkAnodized(0x0d121c), [0, 0.05, 0], {
        name: "Diamagnetic Isolation Plinth",
      }, cathedral);
      kit.torus(1.18, 0.065, U.copper(), [0, 0.16, 0], {
        rot: [Math.PI / 2, 0, 0],
        name: "1.8 K Superfluid Helium-II Toroidal Sub-Cooler",
        info: "Zero-viscosity superfluid helium ring providing isothermal cryogenic cooling to all 8 peripheral logical QEC vaults.",
      }, cathedral);

      // 8 Octagonal Logical qLDPC Vault Towers + Radial Sapphire Optical Waveguides
      for (let v = 0; v < 8; v++) {
        const ang = (v / 8) * Math.PI * 2;
        const vr = 0.98;
        const vx = Math.cos(ang) * vr;
        const vz = Math.sin(ang) * vr;
        const vault = kit.group(
          [vx, 0.12, vz],
          {
            rot: [0, -ang, 0],
            name: `Modular Logical QEC Vault #${v + 1}`,
            info: "Houses high-rate quantum LDPC logical memory patches and T-gate magic-state distillation factories interconnected optically.",
            explode: [Math.cos(ang) * 0.42, 0, Math.sin(ang) * 0.42],
          },
          cathedral,
        );
        kit.box(0.24, 1.62, 0.24, U.darkAnodized(0x131926), [0, 0.81, 0], {
          shell: true,
          name: "Obsidian Shielded Vault Pillar",
        }, vault);
        kit.box(0.04, 1.48, 0.04, U.glow(v % 2 ? 0x38bdf8 : 0xfbbf24, 1.5), [-0.11, 0.81, 0], {}, vault);

        // Radial sapphire quantum-teleportation waveguide shooting into the central core!
        kit.tube(
          [
            [vx * 0.86, 1.18, vz * 0.86],
            [vx * 0.34, 1.18, vz * 0.34],
          ],
          0.014,
          U.glow(v % 2 ? 0x38bdf8 : 0xf472b6, 1.6),
          {
            name: "Photonic Bell-Pair Teleportation Waveguide",
            info: "Heralded optical entanglement link performing fault-tolerant lattice-surgery CNOTs between remote logical vaults.",
          },
          cathedral,
        );
      }

      // Outer Faceted Sapphire Containment Cylinder + Gold Crown Ring (shell: true!)
      kit.cyl(1.06, 1.06, 1.72, U.glass(0xbae6fd, 0.14), [0, 0.98, 0], {
        shell: true,
        name: "Sapphire Electromagnetic & IR Containment Shield",
        explode: [0, 0.45, 0],
      }, cathedral);
      kit.torus(1.04, 0.04, U.gold(), [0, 1.88, 0], {
        rot: [Math.PI / 2, 0, 0],
        shell: true,
        name: "Upper Gold Resonator Crown",
      }, cathedral);

      // LEVITATING ICOSAHEDRAL FLUX CORE + 3 COUNTER-ROTATING GOLDEN/CYAN GIMBAL RINGS!
      const coreHub = kit.group([0, 1.18, 0], {
        name: "Levitating Icosahedral Entanglement Switch Core",
        info: "20-faceted superconducting-photonic router switching heralded Bell states across 10,000+ logical qubits with sub-nanosecond latency.",
        live: () => `Mode=${sim.mode.toUpperCase()} · d=${sim.codeDistance} · ε_L=${sim.logicalErrorRate().toExponential(1)}`,
        explode: [0, 0.38, 0],
      }, cathedral);

      icosaCore = kit.mesh(new co(0.24, 1), U.gold(), [0, 0, 0], {
        name: "Golden Icosahedral Topological-Photonic Core",
      }, coreHub);
      kit.mesh(new co(0.17, 0), U.glow(0x38bdf8, 2.4), [0, 0, 0], {}, coreHub);

      const ringSpecs = [
        [0.36, 0.016, U.gold()],
        [0.46, 0.014, U.glow(0x38bdf8, 1.7)],
        [0.56, 0.012, U.glow(0xf472b6, 1.5)],
      ];
      ringSpecs.forEach(([r, tube, mat], idx) => {
        const ring = kit.torus(r, tube, mat, [0, 0, 0], {
          name: `Optical Cavity Gimbal Ring ${idx + 1}`,
        }, coreHub);
        gimbalRings.push(ring);
      });

      // 2. PANORAMIC HOLOGRAPHIC COMMAND CONSOLE (Right)
      mon = buildMonitor3D(kit, [1.14, 0.66, 0.22], {
        w: 1.04,
        h: 0.64,
        res: [1280, 768],
        rot: [0, 0.04, 0],
        name: "OMEGA-Q Shor / Grover / Quantum-Chemistry Holo-Display",
        explode: [0.42, 0, 0.15],
      });
      kit.box(1.12, 0.66, 0.54, U.darkAnodized(0x0f1524), [1.14, 0.33, 0.22], {
        rot: [0, 0.04, 0],
      });

      drawOmegaHolo();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        const sr = sim.shorResult;
        statsUi.set("mode", sim.mode.toUpperCase());
        statsUi.set("shor", `${sr.N} = ${sr.factors[0]} × ${sr.factors[1]} (r=${sr.period})`);
        statsUi.set("grov", `P(|${sim.groverTarget}⟩)=${(sim.groverTargetProb * 100).toFixed(1)}%`);
        statsUi.set("chem", `${sim.h2MinEnergyHa.toFixed(4)} Ha @ ${sim.h2EqAngstrom} Å`);
        statsUi.set("dist", `d = ${sim.codeDistance} qLDPC`);
        statsUi.set("err", sim.logicalErrorRate().toExponential(2));
      };

      const runBtn = Fe(running ? "⏸ Pause" : "▶ Run", () => {
        running = !running;
        runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
      }, "pri");

      statsUi = Pt([
        ["mode", "Active Engine"],
        ["shor", "Shor QFT_256"],
        ["grov", "Grover 256-State"],
        ["chem", "H₂ Full-CI Min"],
        ["dist", "Code Distance"],
        ["err", "Logical Error ε_L"],
      ]);

      el.append(
        Ie(
          "OMEGA-Q Fault-Tolerant Quantum Algorithms (100% Live Math)",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe(
              "Shor Factoring",
              () => {
                sim.mode = "shor";
                if (ctx.diagram) ctx.diagram.pulse("core", "alg", "#fde047");
                drawOmegaHolo();
                syncStats();
              },
              "pri",
            ),
            Fe(
              "Grover 256 Search",
              () => {
                sim.mode = "grover";
                sim.resetGrover(sim.groverTarget);
                if (ctx.diagram) ctx.diagram.pulse("core", "alg", "#f472b6");
                drawOmegaHolo();
                syncStats();
              },
              "pri",
            ),
            Fe(
              "H₂ Chemistry PES",
              () => {
                sim.mode = "chem";
                sim.computeH2DissociationCurve();
                if (ctx.diagram) ctx.diagram.pulse("core", "alg", "#34d399");
                drawOmegaHolo();
                syncStats();
              },
              "pri",
            ),
          ),
          q(
            "div",
            { class: "row" },
            st(
              [
                ["15", "Shor Semiprime N = 15 (3 × 5)"],
                ["21", "Shor Semiprime N = 21 (3 × 7)"],
                ["33", "Shor Semiprime N = 33 (3 × 11)"],
                ["35", "Shor Semiprime N = 35 (5 × 7)"],
              ],
              "15",
              (val) => {
                sim.mode = "shor";
                sim.runShor(Number(val), 7);
                hi("photon", { min: 0.05 });
                drawOmegaHolo();
                syncStats();
              },
            ),
          ),
          We(
            "qLDPC Logical Code Distance (d)",
            7,
            31,
            2,
            sim.codeDistance,
            (v) => {
              sim.codeDistance = v;
              drawOmegaHolo();
              syncStats();
            },
            (v) => `d = ${v}`,
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      // Counter-rotate the levitating icosahedral core & 3 optical gimbal rings!
      if (icosaCore) {
        icosaCore.rotation.y = t * 0.85;
        icosaCore.rotation.x = Math.sin(t * 0.6) * 0.35;
        icosaCore.position.y = Math.sin(t * 2.1) * 0.035;
      }
      gimbalRings.forEach((ring, idx) => {
        ring.rotation.x = t * (0.7 + idx * 0.35) * (idx % 2 ? -1 : 1);
        ring.rotation.y = t * (0.55 + idx * 0.25);
      });

      if (running) {
        stepAcc += dt * 2.4;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          if (sim.mode === "grover") sim.stepGrover();
          if (ctx.diagram) {
            ctx.diagram.pulse("qldpc", "core", "#38bdf8");
            ctx.diagram.pulse("magic", "core", "#f472b6");
            ctx.diagram.pulse("tele", "core", "#34d399");
            ctx.diagram.pulse("core", "alg", "#fde047");
          }
          drawOmegaHolo();
          if (machine._syncStats) machine._syncStats();
        }
      }
    },

    isRunning: () => running,
    sim,
    test() {
      const o = new OmegaSingularityCore();
      const s15 = o.runShor(15, 7);
      const s35 = o.runShor(35, 2);
      o.resetGrover(88);
      for (let i = 0; i < 12; i++) o.stepGrover();
      return {
        ok:
          s15.factors[0] === 3 &&
          s15.factors[1] === 5 &&
          s35.factors[0] === 5 &&
          s35.factors[1] === 7 &&
          o.groverTargetProb > 0.94,
        factors35: s35.factors,
      };
    },
  };
  return machine;
}
