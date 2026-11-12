// Universal Hard-Wired Gate-Level Netlist Engine, Signal-Integrity Eye Scope & 11-Rung Layer Expansion (v5.0.0)
// Expands all 48 machines × 11 primary rungs = 528 primary layers (and × 3 interactive sub-lenses = 1,584 live views).
//
// HONESTY NOTE (review finding C9): the gate bench and eye scope are driven by
// 9 generic switching-family TEMPLATES below, not per-machine netlists. Every
// machine in a family shows the same 6-gate adder slice with that family's
// voltages and delays. The only real per-machine netlist in the lab is the
// MOS 6502 die (visual6502 data, fetched at runtime). The UI labels these
// views "family template".

(function (globalScope) {
  "use strict";

  const TEMPLATE_NOTE = "family template, not this machine's own netlist";

  const SWITCH_FAMILIES = {
    mech_plate: {
      title: "Mechanical Sliding-Plate Logic Template (no electrical switching)",
      device: "Slotted Sheet-Metal Plates & Pins (Z1-style binary mechanical gate)",
      vLow: "Pin at rest (0)",
      vHigh: "Pin displaced (1)",
      vddVolts: 0,
      gateDelayPs: 250000000000, // ~0.25 s per Z1 machine cycle phase (1 Hz clock, 4 phases)
      switchEnergyFj: 0, // mechanical work, not electrical; not modelled
      eyeJitterPct: 20,
    },
    mech_relay_plate: {
      title: "Mechanical Sliding-Plate / Relay Contact Netlist",
      device: "Series/Shunt Relay Armature & Slotted Brass Linkage",
      vLow: "OPEN (0 V)",
      vHigh: "CLOSED (+24 V)",
      vddVolts: 24.0,
      gateDelayPs: 22000000000, // 22 ms mechanical armature travel
      switchEnergyFj: 120000000000, // 0.12 mJ solenoid pull-in
      eyeJitterPct: 18,
    },
    thermionic_tube: {
      title: "6SN7 Twin-Triode / Pentode Pulse Gate Netlist",
      device: "Thermionic Vacuum Triode Grid-Cutoff Inverter & Ring Gate",
      vLow: "-14 V (Cutoff)",
      vHigh: "+220 V (B+ Plate)",
      vddVolts: 220.0,
      gateDelayPs: 2400000, // 2.4 us decade ring stage
      switchEnergyFj: 450000000, // 450 nJ plate load swing
      eyeJitterPct: 14,
    },
    bipolar_rtl_ttl_ecl: {
      title: "Bipolar RTL NOR / Schottky 74S TTL / Differential ECL Netlist",
      device: "NPN Multi-Emitter / Current-Steering Long-Tailed Pair",
      vLow: "0.2 V (Sat)",
      vHigh: "3.6 V (TTL/RTL)",
      vddVolts: 5.0,
      gateDelayPs: 1800, // 1.8 ns Schottky / ECL gate
      switchEnergyFj: 9500, // 9.5 pJ
      eyeJitterPct: 9,
    },
    nmos_depletion: {
      title: "5 µm Depletion-Load NMOS Pass-Transistor Carry Netlist",
      device: "Polysilicon-Gate Enhancement/Depletion nMOS + Manchester Carry",
      vLow: "0.3 V (VSS)",
      vHigh: "4.8 V (VDD)",
      vddVolts: 5.0,
      gateDelayPs: 8500, // 8.5 ns NMOS stage
      switchEnergyFj: 3200, // 3.2 pJ
      eyeJitterPct: 11,
    },
    planar_cmos: {
      title: "Complementary pMOS/nMOS Mirror Full-Adder & Latch Netlist",
      device: "28-Transistor Static CMOS Mirror Adder (Zero Static I_DC)",
      vLow: "0.00 V (VSS)",
      vHigh: "1.20 V (VDD)",
      vddVolts: 1.2,
      gateDelayPs: 65, // 65 ps deep-submicron CMOS
      switchEnergyFj: 18, // 18 fJ (1/2 C V^2)
      eyeJitterPct: 7,
    },
    finfet_gaa_wafer: {
      title: "3nm–7nm FinFET / GAA Nanosheet FMA & Wavelet Router Netlist",
      device: "High-k Metal-Gate Tri-Gate FinFET / Stitched SRAM Pass-Mux",
      vLow: "0.00 V",
      vHigh: "0.72 V (DVFS)",
      vddVolts: 0.72,
      gateDelayPs: 11, // 11 ps FO4 FinFET delay
      switchEnergyFj: 0.42, // 0.42 fJ per gate transition!
      eyeJitterPct: 5,
    },
    bio_photonic_wet: {
      title: "Mach–Zehnder Optical Interferometer / Ion-Channel Threshold Netlist",
      device: "1550 nm LiNbO3 MZI cos²(Δφ/2) Coupler & Na⁺/K⁺ Conductance Gate",
      vLow: "Destructive (0 mW)",
      vHigh: "Constructive (P_opt)",
      vddVolts: 0.85,
      gateDelayPs: 8, // 8 ps time-of-flight optical gate
      switchEnergyFj: 0.25,
      eyeJitterPct: 6,
    },
    quantum_reversible: {
      title: "Reversible Unitary CNOT / Toffoli CCNOT Quantum Gate Netlist",
      device:
        "Bijective Unitary |a, b, c⟩ -> |a, b, c ⊕ (a·b)⟩ (det U = 1, Zero Landauer Erase!)",
      vLow: "|0⟩ (+Z Eigen)",
      vHigh: "|1⟩ (-Z Eigen)",
      vddVolts: 0.002,
      gateDelayPs: 25000, // 25 ns coherent exchange / microwave pulse
      switchEnergyFj: 0.001,
      eyeJitterPct: 4,
    },
  };

  const MACHINE_FAMILY_MAP = {
    turing: "mech_plate",
    z1: "mech_plate",
    analog: "thermionic_tube",
    tube: "thermionic_tube",
    eniac46: "thermionic_tube",
    pdp8: "bipolar_rtl_ttl_ecl",
    s360: "bipolar_rtl_ttl_ecl",
    cdc6600: "bipolar_rtl_ttl_ecl",
    agc66: "bipolar_rtl_ttl_ecl",
    unix70: "bipolar_rtl_ttl_ecl",
    alto73: "bipolar_rtl_ttl_ecl",
    cray1: "bipolar_rtl_ttl_ecl",
    tandem77: "bipolar_rtl_ttl_ecl",
    vax78: "bipolar_rtl_ttl_ecl",
    lisp83: "bipolar_rtl_ttl_ecl",
    altair: "nmos_depletion",
    m6502: "nmos_depletion",
    home80: "nmos_depletion",
    systolic82: "nmos_depletion",
    cm2: "planar_cmos",
    pc90: "planar_cmos",
    sun90: "planar_cmos",
    ascired97: "planar_cmos",
    pc00: "planar_cmos",
    blade04: "planar_cmos",
    arm07: "planar_cmos",
    bgene: "planar_cmos",
    pc10: "planar_cmos",
    cloud10: "planar_cmos",
    fugaku20: "finfet_gaa_wafer",
    pc20: "finfet_gaa_wafer",
    zmain20: "finfet_gaa_wafer",
    exascale: "finfet_gaa_wafer",
    aibox: "finfet_gaa_wafer",
    wse24: "finfet_gaa_wafer",
    gb200: "finfet_gaa_wafer",
    bci: "bio_photonic_wet",
    alife: "bio_photonic_wet",
    photonic: "bio_photonic_wet",
    quantum: "quantum_reversible",
    qion: "quantum_reversible",
    qanneal: "quantum_reversible",
    qatom: "quantum_reversible",
    qtransmon: "quantum_reversible",
    qspin: "quantum_reversible",
    qphotonic: "quantum_reversible",
    qtopo: "quantum_reversible",
    qomega: "quantum_reversible",
  };

  class HardWiredNetlistSolver {
    static familyFor(machineId) {
      const key = MACHINE_FAMILY_MAP[machineId] || "planar_cmos";
      return { key, template: true, templateNote: TEMPLATE_NOTE, ...SWITCH_FAMILIES[key] };
    }

    // Evaluates a genuine 6-gate topological DAG on 4 input pins [A, B, CIN, SUB_OR_TOFF]
    // Classical mode: Add/Subtract ALU Slice (B_eff = B ^ MODE, SUM = A ^ B_eff ^ CIN, COUT = (A & B_eff) | (CIN & (A ^ B_eff)))
    // Quantum reversible mode: Feynman CNOT + Toffoli CCNOT reversible adder slice preserving ancilla!
    static solve(machineId, pins = [1, 0, 1, 0]) {
      const fam = HardWiredNetlistSolver.familyFor(machineId);
      const A = pins[0] ? 1 : 0;
      const B = pins[1] ? 1 : 0;
      const CIN = pins[2] ? 1 : 0;
      const MODE = pins[3] ? 1 : 0;
      const isQuantum = fam.key === "quantum_reversible";

      // Gate 1: Mode-controlled B inverter / Controlled-NOT pre-stage
      const g1_beff = B ^ MODE;
      // Gate 2: Half-adder Propagate P = A XOR B_eff (Feynman CNOT1)
      const g2_prop = A ^ g1_beff;
      // Gate 3: Half-adder Generate G = A AND B_eff (Toffoli CCNOT1)
      const g3_gen = A & g1_beff;
      // Gate 4: Full-adder SUM = P XOR CIN (Feynman CNOT2)
      const g4_sum = g2_prop ^ CIN;
      // Gate 5: Carry Propagate Hit = P AND CIN (Toffoli CCNOT2)
      const g5_pcin = g2_prop & CIN;
      // Gate 6: Carry-Out Majority COUT = G OR (P AND CIN) (in reversible Peres/Toffoli: G XOR (P AND CIN) == G OR (P AND CIN) since G and P are mutually exclusive!)
      const g6_cout = isQuantum ? g3_gen ^ g5_pcin : g3_gen | g5_pcin;

      const gates = [
        {
          id: "G1",
          type: isQuantum ? "CNOT" : "XOR",
          label: isQuantum ? "CNOT(M,B)" : "B⊕MODE",
          inA: B,
          inB: MODE,
          out: g1_beff,
          stage: 1,
        },
        {
          id: "G2",
          type: isQuantum ? "CNOT" : "XOR",
          label: "P = A⊕B'",
          inA: A,
          inB: g1_beff,
          out: g2_prop,
          stage: 2,
        },
        {
          id: "G3",
          type: isQuantum ? "TOFF" : "AND",
          label: "G = A·B'",
          inA: A,
          inB: g1_beff,
          out: g3_gen,
          stage: 2,
        },
        {
          id: "G4",
          type: isQuantum ? "CNOT" : "XOR",
          label: "SUM = P⊕Cin",
          inA: g2_prop,
          inB: CIN,
          out: g4_sum,
          stage: 3,
        },
        {
          id: "G5",
          type: isQuantum ? "TOFF" : "AND",
          label: "K = P·Cin",
          inA: g2_prop,
          inB: CIN,
          out: g5_pcin,
          stage: 3,
        },
        {
          id: "G6",
          type: isQuantum ? "CNOT" : "OR",
          label: "Cout = G+K",
          inA: g3_gen,
          inB: g5_pcin,
          out: g6_cout,
          stage: 4,
        },
      ];

      const activeHighGates = gates.filter((g) => g.out === 1).length;
      const critDelayPs = fam.gateDelayPs * 4; // 4-stage critical path G1 -> G2 -> G5 -> G6
      const totalEnergyFj = +(fam.switchEnergyFj * (2 + activeHighGates)).toFixed(3);

      // Full 8-row truth table for current MODE
      const truthTable = [];
      for (let idx = 0; idx < 8; idx++) {
        const ta = (idx >>> 2) & 1;
        const tb = (idx >>> 1) & 1;
        const tc = idx & 1;
        const tbe = tb ^ MODE;
        const tp = ta ^ tbe;
        const tsum = tp ^ tc;
        const tcout = (ta & tbe) | (tp & tc);
        truthTable.push({
          a: ta,
          b: tb,
          cin: tc,
          sum: tsum,
          cout: tcout,
          active: ta === A && tb === B && tc === CIN,
        });
      }

      return {
        family: fam,
        inputs: { A, B, CIN, MODE },
        outputs: { SUM: g4_sum, COUT: g6_cout, PROP: g2_prop, GEN: g3_gen },
        gates,
        critDelayPs,
        totalEnergyFj,
        truthTable,
      };
    }

    static formatDelay(ps) {
      if (ps >= 1e9) return (ps / 1e9).toFixed(1) + " ms";
      if (ps >= 1e6) return (ps / 1e6).toFixed(2) + " µs";
      if (ps >= 1e3) return (ps / 1e3).toFixed(2) + " ns";
      return ps.toFixed(0) + " ps";
    }

    static extractLiveBits(machine, probe = {}) {
      if (typeof probe.bits === "number") return probe.bits >>> 0;
      const s = machine && machine.sim;
      if (!s) return 0x5a;
      if (typeof s.pc === "number")
        return ((s.pc & 0xff) ^ ((s.a || s.ac || 0) << 2)) >>> 0;
      if (typeof s.clock === "number") return s.clock >>> 0;
      if (typeof s.clockCycles === "number") return s.clockCycles >>> 0;
      if (typeof s.cycle === "number") return s.cycle >>> 0;
      if (typeof s.ticks === "number") return s.ticks >>> 0;
      if (typeof s.shots === "number") return (s.shots * 5 + 3) >>> 0;
      if (typeof s.masterStep === "number") return (s.masterStep * 3) >>> 0;
      if (typeof s.lsn === "number") return s.lsn >>> 0;
      return 0xa5;
    }
  }

  // Browser-side registration of Ic visualizers, 11-rung qy upgrade, Lm pollers, and p0 specs
  if (typeof Ic !== "undefined" && typeof qy !== "undefined") {
    Object.assign(Ic, {
      // 1. UNIVERSAL INTERACTIVE HARD-WIRED GATE BENCH (CLICK INPUTS DIRECTLY ON CANVAS!)
      hardwiredgate(c, w, h, _t, p, _spec, m) {
        const liveMask = HardWiredNetlistSolver.extractLiveBits(m, p) & 0xf;
        const pins =
          this && Array.isArray(this.manualPins)
            ? this.manualPins
            : [
                liveMask & 1,
                (liveMask >>> 1) & 1,
                (liveMask >>> 2) & 1,
                (liveMask >>> 3) & 1,
              ];
        const res = HardWiredNetlistSolver.solve(m ? m.id : "pc20", pins);
        const fam = res.family;

        // Title bar
        c.font = Ce(10.5, "700");
        c.fillStyle = Z.acc2;
        c.fillText(`⚡ ${fam.title} · family template  [Click A/B/Cin/M]`, 8, 14, w - 16);

        const hitBoxes = [];
        const pinLabels = [
          ["A", res.inputs.A],
          ["B", res.inputs.B],
          ["Cin", res.inputs.CIN],
          [fam.key === "quantum_reversible" ? "Anc" : "Sub", res.inputs.MODE],
        ];
        const leftW = Math.max(195, Math.floor(w * 0.68));
        const topY = 22;
        const usableH = Math.max(110, h - 44);
        const pinSpacing = usableH / 4;

        // Draw 4 clickable input terminal pads on left
        const pinCoords = [];
        pinLabels.forEach(([lbl, bit], idx) => {
          const py = topY + idx * pinSpacing + 4;
          const bh = Math.min(24, pinSpacing - 4);
          const bw = 46;
          hitBoxes.push({ pin: idx, x: 6, y: py, w: bw, h: bh, liveMask });
          c.fillStyle = bit ? "rgba(52, 211, 153, 0.28)" : "rgba(30, 41, 59, 0.9)";
          c.fillRect(6, py, bw, bh);
          c.strokeStyle = bit ? "#34d399" : "#64748b";
          c.lineWidth = 1.6;
          c.strokeRect(6, py, bw, bh);
          c.fillStyle = bit ? "#fde047" : "#cbd5e1";
          c.font = Ce(10, "700");
          c.fillText(`${lbl}=${bit}`, 11, py + bh * 0.68);
          pinCoords.push([6 + bw, py + bh * 0.5]);
        });
        if (this) this._gateHitBoxes = hitBoxes;

        // Gate box positions across 3 columns inside schematic region
        const gx1 = 68;
        const gx2 = Math.floor(leftW * 0.44);
        const gx3 = Math.floor(leftW * 0.72);
        const gw = 44;
        const gh = 20;

        const gPos = {
          G1: [gx1, pinCoords[1][1] + 8],
          G2: [gx2, pinCoords[0][1] + 8],
          G3: [gx2, pinCoords[1][1] + 16],
          G4: [gx3, pinCoords[0][1] + 12],
          G5: [gx3, pinCoords[2][1] - 4],
          G6: [gx3 + 6, pinCoords[3][1] - 4],
        };

        const wire = (x0, y0, x1, y1, hiBit) => {
          c.strokeStyle = hiBit ? "#34d399" : "#334155";
          c.lineWidth = hiBit ? 2.2 : 1.3;
          c.beginPath();
          const mx = (x0 + x1) * 0.5;
          c.moveTo(x0, y0);
          c.lineTo(mx, y0);
          c.lineTo(mx, y1);
          c.lineTo(x1, y1);
          c.stroke();
        };

        // Draw hard-wired signal nets!
        wire(pinCoords[1][0], pinCoords[1][1], gPos.G1[0], gPos.G1[1] - 4, res.inputs.B);
        wire(
          pinCoords[3][0],
          pinCoords[3][1],
          gPos.G1[0],
          gPos.G1[1] + 4,
          res.inputs.MODE,
        );
        wire(pinCoords[0][0], pinCoords[0][1], gPos.G2[0], gPos.G2[1] - 4, res.inputs.A);
        wire(gPos.G1[0] + gw, gPos.G1[1], gPos.G2[0], gPos.G2[1] + 4, res.gates[0].out);
        wire(pinCoords[0][0], pinCoords[0][1], gPos.G3[0], gPos.G3[1] - 4, res.inputs.A);
        wire(gPos.G1[0] + gw, gPos.G1[1], gPos.G3[0], gPos.G3[1] + 4, res.gates[0].out);
        wire(gPos.G2[0] + gw, gPos.G2[1], gPos.G4[0], gPos.G4[1] - 4, res.gates[1].out);
        wire(
          pinCoords[2][0],
          pinCoords[2][1],
          gPos.G4[0],
          gPos.G4[1] + 4,
          res.inputs.CIN,
        );
        wire(gPos.G2[0] + gw, gPos.G2[1], gPos.G5[0], gPos.G5[1] - 4, res.gates[1].out);
        wire(
          pinCoords[2][0],
          pinCoords[2][1],
          gPos.G5[0],
          gPos.G5[1] + 4,
          res.inputs.CIN,
        );
        wire(gPos.G3[0] + gw, gPos.G3[1], gPos.G6[0], gPos.G6[1] - 4, res.gates[2].out);
        wire(gPos.G5[0] + gw, gPos.G5[1], gPos.G6[0], gPos.G6[1] + 4, res.gates[4].out);

        // Draw the 6 physical gate cells
        for (const g of res.gates) {
          const [cx, cy] = gPos[g.id];
          c.fillStyle = g.out ? "rgba(14, 116, 144, 0.85)" : "rgba(15, 23, 42, 0.94)";
          c.fillRect(cx, cy - gh * 0.5, gw, gh);
          c.strokeStyle = g.out ? "#38bdf8" : "#475569";
          c.lineWidth = 1.5;
          c.strokeRect(cx, cy - gh * 0.5, gw, gh);
          c.fillStyle = g.out ? "#fde047" : "#94a3b8";
          c.font = Ce(9, "700");
          c.fillText(`${g.type}:${g.out}`, cx + 4, cy + 3.5);
        }

        // Right-side Truth Table & Output LEDs
        const tx = leftW + 10;
        const tw = Math.max(78, w - tx - 6);
        c.fillStyle = "rgba(15, 23, 42, 0.85)";
        c.fillRect(tx, topY, tw, usableH);
        c.strokeStyle = "#334155";
        c.lineWidth = 1;
        c.strokeRect(tx, topY, tw, usableH);
        c.fillStyle = "#7dd3fc";
        c.font = Ce(9, "700");
        c.fillText(
          `SUM=${res.outputs.SUM} Cout=${res.outputs.COUT}`,
          tx + 5,
          topY + 12,
          tw - 8,
        );

        const rowH = Math.max(10, (usableH - 18) / 8);
        res.truthTable.forEach((row, rIdx) => {
          const ry = topY + 16 + rIdx * rowH;
          if (row.active) {
            c.fillStyle = "rgba(251, 191, 36, 0.25)";
            c.fillRect(tx + 2, ry, tw - 4, rowH);
          }
          c.fillStyle = row.active ? "#fde047" : "#94a3b8";
          c.font = Ce(8.5, row.active ? "700" : "500");
          c.fillText(
            `${row.a}${row.b}${row.cin} -> ${row.cout}${row.sum}`,
            tx + 6,
            ry + rowH * 0.78,
            tw - 10,
          );
        });

        // Footer physical telemetry bar (propagation delay, node voltages & switching energy!)
        c.fillStyle = Z.dim;
        c.font = Ce(9.5, "600");
        c.fillText(
          `${fam.device.slice(0, 42)} · t_crit=${HardWiredNetlistSolver.formatDelay(res.critDelayPs)} · E_sw=${res.totalEnergyFj} fJ · Hi=${fam.vHigh}`,
          8,
          h - 5,
          w - 16,
        );
      },

      // 2. UNIVERSAL HIGH-SPEED EYE DIAGRAM & 32-BIT HARDWARE BIT-PLANE ANALYZER
      sigeye(c, w, h, t, p, _spec, m) {
        const fam = HardWiredNetlistSolver.familyFor(m ? m.id : "pc20");
        const bits32 = HardWiredNetlistSolver.extractLiveBits(m, p);

        c.font = Ce(10.5, "700");
        c.fillStyle = Z.acc2;
        c.fillText(
          `🔬 Signal Eye & Bit-Plane · ${p.sigTitle || fam.title.slice(0, 38)}`,
          8,
          14,
          w - 16,
        );

        // Left Half: Multi-UI Superimposed High-Speed Transmission Eye Diagram!
        const eyeX = 10;
        const eyeY = 24;
        const eyeW = Math.floor(w * 0.54);
        const eyeH = Math.max(76, h - 46);
        c.fillStyle = "rgba(7, 13, 24, 0.92)";
        c.fillRect(eyeX, eyeY, eyeW, eyeH);
        c.strokeStyle = "#1e3a5f";
        c.lineWidth = 1.2;
        c.strokeRect(eyeX, eyeY, eyeW, eyeH);

        // Decision threshold & UI sampling strobe crosshairs
        const midY = eyeY + eyeH * 0.5;
        const midX = eyeX + eyeW * 0.5;
        c.strokeStyle = "rgba(148, 163, 184, 0.25)";
        c.setLineDash([3, 3]);
        c.beginPath();
        c.moveTo(eyeX, midY);
        c.lineTo(eyeX + eyeW, midY);
        c.moveTo(midX, eyeY);
        c.lineTo(midX, eyeY + eyeH);
        c.stroke();
        c.setLineDash([]);

        // Draw hexagonal setup/hold eye-mask keep-out diamond in center!
        const maskW = eyeW * 0.24;
        const maskH = eyeH * 0.26;
        c.fillStyle = "rgba(244, 63, 94, 0.14)";
        c.strokeStyle = "rgba(251, 113, 133, 0.65)";
        c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(midX - maskW, midY);
        c.lineTo(midX, midY - maskH);
        c.lineTo(midX + maskW, midY);
        c.lineTo(midX, midY + maskH);
        c.closePath();
        c.fill();
        c.stroke();

        // Superimpose 12 transitions (0->0, 0->1, 1->0, 1->1 across 2 UI) with physical slew & jitter
        const jitterAmp = (fam.eyeJitterPct / 100) * eyeH * 0.28;
        const hiY = eyeY + eyeH * 0.16;
        const loY = eyeY + eyeH * 0.84;
        for (let tr = 0; tr < 12; tr++) {
          const bPrev = (tr + (bits32 & 3)) & 1;
          const bCur = ((tr >> 1) + ((bits32 >> 2) & 3)) & 1;
          const bNext = ((tr >> 2) + ((bits32 >> 4) & 3)) & 1;
          const phaseJit = Math.sin(tr * 2.3 + t * 2.5) * (fam.eyeJitterPct * 0.004);
          c.strokeStyle =
            tr % 2 === 0 ? "rgba(56, 189, 248, 0.52)" : "rgba(52, 211, 153, 0.46)";
          c.lineWidth = 1.5;
          c.beginPath();
          const steps = 28;
          for (let s = 0; s <= steps; s++) {
            const u = s / steps; // 0..1 across 1.4 UI
            const x = eyeX + u * eyeW;
            // Smooth tanh edge transitions at u = 0.22 and u = 0.78
            const s1 = 0.5 + 0.5 * Math.tanh((u + phaseJit - 0.2) / 0.09);
            const s2 = 0.5 + 0.5 * Math.tanh((u + phaseJit - 0.8) / 0.09);
            const level = bPrev * (1 - s1) + bCur * (s1 - s2) + bNext * s2;
            const noise = Math.cos(u * 14 + tr * 1.7 + t * 3) * jitterAmp * 0.45;
            const y = loY - level * (loY - hiY) + noise;
            if (s === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.stroke();
        }

        // Right Half: Live 32-Bit Hardware State Bit-Plane Matrix (4x8)
        const bx0 = eyeX + eyeW + 10;
        const bwTot = Math.max(70, w - bx0 - 8);
        c.fillStyle = "#93c5fd";
        c.font = Ce(9.5, "700");
        c.fillText(
          `32b Bus 0x${(bits32 >>> 0).toString(16).toUpperCase().padStart(8, "0")}`,
          bx0,
          eyeY + 10,
          bwTot,
        );

        const cellW = Math.max(8, (bwTot - 4) / 8);
        const cellH = Math.max(12, (eyeH - 18) / 4);
        for (let r = 0; r < 4; r++) {
          for (let col = 0; col < 8; col++) {
            const bitIdx = 31 - (r * 8 + col);
            const bit = (bits32 >>> bitIdx) & 1;
            const cx = bx0 + col * cellW;
            const cy = eyeY + 16 + r * cellH;
            c.fillStyle = bit ? "#0284c7" : "#1e293b";
            c.fillRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
            c.fillStyle = bit ? "#fde047" : "#64748b";
            c.font = Ce(8.5, "700");
            c.fillText(String(bit), cx + cellW * 0.3, cy + cellH * 0.72);
          }
        }

        c.fillStyle = Z.dim;
        c.font = Ce(9.5, "600");
        c.fillText(
          `Eye Opening=${100 - fam.eyeJitterPct}% · V_swing=${fam.vLow}..${fam.vHigh} · FO4=${HardWiredNetlistSolver.formatDelay(fam.gateDelayPs)}`,
          8,
          h - 5,
          w - 16,
        );
      },

      // 3. Custom Domain Visualizers for the 8 New v5.0.0 Machines
      eniacring(c, w, h, _t, p) {
        c.font = Ce(11, "700");
        c.fillStyle = Z.acc2;
        c.fillText(
          `ENIAC 10-Stage Vacuum-Tube Decade Ring · ${p.card || ""}`,
          10,
          16,
          w - 20,
        );
        const digits = p.digits || [0, 4, 5, 5, 0, 1, 0, 0, 0, 0];
        const cw = (w - 24) / 10;
        const ch = Math.max(10, (h - 36) / 10);
        for (let d = 0; d < 10; d++) {
          const activeVal = digits[9 - d] || 0;
          for (let v = 0; v < 10; v++) {
            const x = 12 + d * cw;
            const y = 24 + (9 - v) * ch;
            const lit = v === activeVal;
            c.fillStyle = lit ? "#f59e0b" : "#1e293b";
            c.fillRect(x + 2, y + 1, cw - 4, ch - 2);
          }
        }
      },

      lisptag36(c, w, h, _t, p) {
        c.font = Ce(11, "700");
        c.fillStyle = Z.acc2;
        c.fillText(
          `Symbolics 36-Bit Word ${p.wordHex || "0x000000000"} · CDR Saved=${p.cdrSaved || 0}w`,
          10,
          16,
          w - 20,
        );
        const segs = [
          ["[35:34] CDR", 0.18, "#c084fc"],
          ["[33:30] DTP TAG", 0.24, "#fbbf24"],
          ["[29:0] 30b PAYLOAD / VMA", 0.58, "#38bdf8"],
        ];
        let x = 10;
        const tot = w - 20;
        for (const [lbl, frac, col] of segs) {
          const sw = tot * frac - 4;
          c.fillStyle = "rgba(15, 23, 42, 0.9)";
          c.fillRect(x, 28, sw, 42);
          c.strokeStyle = col;
          c.lineWidth = 2;
          c.strokeRect(x, 28, sw, 42);
          c.fillStyle = col;
          c.font = Ce(10, "700");
          c.fillText(lbl, x + 6, 53, sw - 10);
          x += tot * frac;
        }
        c.fillStyle = "#6ee7b7";
        c.font = Ce(10.5, "600");
        c.fillText(`Eval => ${String(p.out || "NIL").slice(0, 56)}`, 10, 94, w - 20);
        c.fillStyle = Z.dim;
        c.fillText(
          `Cheney Copying GC Cycles=${p.gc || 0} · Parallel Tag Checks=${p.tags || 0}`,
          10,
          116,
          w - 20,
        );
      },

      wsestitch(c, w, h, _t, p) {
        c.font = Ce(11, "700");
        c.fillStyle = Z.acc2;
        c.fillText(
          `300mm Reticle-Stitched Fabric · Yield=${p.yieldPct || 98}% · 21 PB/s SRAM`,
          10,
          16,
          w - 20,
        );
        const tiles = p.tiles || [];
        const cw = (w - 24) / 10;
        const ch = (h - 34) / 10;
        for (let r = 0; r < 10; r++) {
          for (let col = 0; col < 10; col++) {
            const tl = tiles[r * 10 + col] || { act: 0.4, defective: false };
            c.fillStyle = tl.defective
              ? "#fbbf24"
              : `rgba(56, 189, 248, ${(0.18 + tl.act * 0.8).toFixed(2)})`;
            c.fillRect(12 + col * cw + 1, 24 + r * ch + 1, cw - 2, ch - 2);
          }
        }
      },

      tandemwal(c, w, h, _t, p) {
        c.font = Ce(11, "700");
        c.fillStyle = Z.acc2;
        c.fillText(
          `NonStop Process Pairs & WAL · Total=$${(p.total || 1000000).toLocaleString()}`,
          10,
          16,
          w - 20,
        );
        const pairs = p.pairs || [];
        pairs.forEach((pp, i) => {
          const y = 28 + i * 24;
          c.fillStyle =
            pp.activeCpu === pp.primaryCpu
              ? "rgba(52,211,153,0.2)"
              : "rgba(251,191,36,0.25)";
          c.fillRect(10, y, w - 20, 20);
          c.fillStyle = "#f8fafc";
          c.font = Ce(10, "600");
          c.fillText(
            `${pp.svc}: Active=CPU${pp.activeCpu} (Backup=CPU${pp.backupCpu}) · Ckpt=${pp.checkpoints}`,
            16,
            y + 14,
            w - 32,
          );
        });
      },

      bladeept(c, w, h, _t, p) {
        c.font = Ce(11, "700");
        c.fillStyle = Z.acc2;
        c.fillText(
          `2D Nested Page Walk (gVA->gPA->hPA) & C10K ${String(p.io || "EPOLL").toUpperCase()}`,
          10,
          16,
          w - 20,
        );
        const stages = ["Guest VA", "4-Lvl gPT", "Guest PA", "4-Lvl EPT", "Host PA"];
        const sw = (w - 24) / stages.length;
        stages.forEach((stLbl, i) => {
          const x = 12 + i * sw;
          c.fillStyle = i % 2 === 0 ? "#0f172a" : "#1e3a8a";
          c.fillRect(x + 2, 28, sw - 6, 36);
          c.strokeStyle = "#38bdf8";
          c.strokeRect(x + 2, 28, sw - 6, 36);
          c.fillStyle = "#f8fafc";
          c.font = Ce(9.5, "700");
          c.fillText(stLbl, x + 6, 50, sw - 12);
        });
        c.fillStyle = "#34d399";
        c.font = Ce(10.5, "600");
        c.fillText(
          `C10K=${(p.rps || 148000).toLocaleString()} req/s · ccNUMA=${p.lat || 65} ns · Overcommit=${p.over || 1.5}×`,
          12,
          92,
          w - 24,
        );
      },

      systolicpe(c, w, h, _t, p) {
        c.font = Ce(11, "700");
        c.fillStyle = Z.acc2;
        c.fillText(
          `4×4 Systolic Wavefront Beat t=${p.cycle || 1}/10 · Reuse=6.0×`,
          10,
          16,
          w - 20,
        );
        const pes = p.pes || [];
        const cw = (w - 24) / 4;
        const ch = Math.max(18, (h - 34) / 4);
        for (let r = 0; r < 4; r++) {
          for (let col = 0; col < 4; col++) {
            const pe = pes[r * 4 + col] || { active: false, acc: 0 };
            const x = 12 + col * cw;
            const y = 24 + r * ch;
            c.fillStyle = pe.active ? "rgba(251, 191, 36, 0.28)" : "#0f172a";
            c.fillRect(x + 2, y + 2, cw - 4, ch - 4);
            c.strokeStyle = pe.active ? "#fde047" : "#334155";
            c.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
            c.fillStyle = "#f8fafc";
            c.font = Ce(9.5, "700");
            c.fillText(`C=${pe.acc}`, x + 6, y + ch * 0.65);
          }
        }
      },

      fugakusve(c, w, h, _t, p) {
        c.font = Ce(11, "700");
        c.fillStyle = Z.acc2;
        c.fillText(
          `A64FX 512b SVE Predicate P0 & HPCG ||r||=${(p.res || 1e-3).toExponential(2)}`,
          10,
          16,
          w - 20,
        );
        const mask = p.mask || [1, 1, 1, 1, 1, 0, 0, 0];
        const lw = (w - 24) / 8;
        mask.forEach((on, i) => {
          const x = 12 + i * lw;
          c.fillStyle = on ? "rgba(52, 211, 153, 0.28)" : "#1e293b";
          c.fillRect(x + 2, 28, lw - 4, 42);
          c.strokeStyle = on ? "#34d399" : "#475569";
          c.strokeRect(x + 2, 28, lw - 4, 42);
          c.fillStyle = on ? "#fde047" : "#64748b";
          c.font = Ce(9.5, "700");
          c.fillText(`P${i}:${on}`, x + 5, 53);
        });
        c.fillStyle = "#7dd3fc";
        c.font = Ce(10.5, "600");
        c.fillText(
          `6D TofuD Torus Hops=${p.hops || 14} · HBM2=${p.bw || 842} GB/s`,
          12,
          96,
          w - 24,
        );
      },

      qspinpsb(c, w, h, _t, p) {
        c.font = Ce(11, "700");
        c.fillStyle = Z.acc2;
        c.fillText(
          `²⁸Si Spin-Dot QPU · T2*=${p.t2 || 36.5} µs · F_2Q=${((p.fid || 0.998) * 100).toFixed(2)}%`,
          10,
          16,
          w - 20,
        );
        const bloch = p.bloch || [
          { x: 0, z: 0 },
          { x: 0, z: 0 },
          { x: 0, z: 1 },
          { x: 0, z: 1 },
        ];
        const step = (w - 24) / 4;
        bloch.forEach((b, q) => {
          const cx = 12 + step * (q + 0.5);
          const cy = 58;
          c.strokeStyle = "#38bdf8";
          c.lineWidth = 1.6;
          c.beginPath();
          c.arc(cx, cy, 22, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = "#fde047";
          c.lineWidth = 2.5;
          c.beginPath();
          c.moveTo(cx, cy);
          c.lineTo(cx + b.x * 19, cy - b.z * 19);
          c.stroke();
        });
        c.fillStyle = "#34d399";
        c.font = Ce(10, "700");
        c.fillText(
          `Pauli Spin Blockade Singlet=${((p.singlet || 0) * 100).toFixed(1)}% · Bell=${((p.bell || 0) * 100).toFixed(1)}%`,
          12,
          106,
          w - 24,
        );
      },
    });

    // 4. Register Full 11-Rung (6 HW + 5 SW) Layer Definitions for the 8 New Machines
    const newLayers = {
      eniac46: {
        hw: [
          {
            t: "System level: 40 U-shaped black wrinkle-steel panels weighing 27 tons across 1,800 sq ft at UPenn's Moore School, dissipating 150 kW.",
            p: /Accumulator|Function Table|Oscilloscope|Punch|Blower/i,
            viz: "spec",
          },
          {
            t: "Modular functional units: 20 signed 10-digit Accumulators, Master Programmer loop stepper, 3 portable Function Tables, High-Speed Multiplier, and IBM Card I/O.",
            p: /Accumulator|Function Table|Punch/i,
            viz: "modules",
          },
          {
            t: "Plug-in octal vacuum-tube chassis: 17,468 thermionic tubes (6SN7 twin triodes, 6L6 beam tetrodes, 6SA7 gating pentodes) + 70,000 resistors & 1,500 relays.",
            p: /Vacuum-Tube|Neon Readout|Accumulator/i,
            viz: "eniacring",
          },
          {
            t: "10-stage decimal ring counter flip-flops & PM sign/carry circuits: each decimal digit is held by exactly 1 conducting flip-flop out of 10 in a closed ring.",
            p: /Neon Readout|Repeat|Coaxial/i,
            viz: "eniacring",
          },
          {
            t: "Hard-wired 6SN7 cathode-coupled pulse coincidence gates & coaxial CPP/Digit trunk jumpers: toggle input pins to inspect live plate/grid switching!",
            p: /Coaxial|Vacuum-Tube|Neon Readout/i,
            viz: "hardwiredgate",
          },
          {
            t: "100 kHz 10-pulse-time cycle (10P, 1P, 2P, 2'P, 4P, CPP) & +220 V B+ plate swing signal integrity.",
            p: /Coaxial|Oscilloscope|Vacuum-Tube/i,
            viz: "sigeye",
          },
        ],
        sw: [
          {
            t: "Application: supersonic exterior-ballistics differential equations (dx=vx·dt, dvx=-G(v)·vx·dt) & 10-digit number-theory cascades.",
            p: /Oscilloscope|Function Table|Punch/i,
            viz: "app",
          },
          {
            t: "Master Programmer 6-decade electronic stepper: sequences subroutine loops and conditional branch trunks without any OS or stored memory.",
            p: /Repeat|Coaxial|Accumulator/i,
            viz: "os",
          },
          {
            t: "Plugboard patch topology: programming ENIAC meant physically wiring Central Programming Pulses (CPP) and 11-wire Digit Trunks across bays.",
            p: /Coaxial|Repeat|Function Table/i,
            viz: "isa",
          },
          {
            t: "10-digit signed BCD ring states & carry-flip-flop propagation masks.",
            p: /Neon Readout|Oscilloscope/i,
            viz: "eniacring",
          },
          {
            t: "200-microsecond addition timing diagram & 100 kHz pulse eye aperture.",
            p: /Coaxial|Oscilloscope/i,
            viz: "sigeye",
          },
        ],
        probe(m) {
          const s = m.sim;
          return {
            digits: Array.from(s.acc[0].digits),
            card: s.lastCard,
            sigTitle: "100 kHz CPP & 10-Pulse Decade Ring Bus",
            bits: Math.abs(s.acc[0].value) & 0xffffffff,
            app: `Preset: ${s.presetName}\nACC1 (${s.acc[0].role}) = ${s.formatAccumulator(0)}\nACC2 (${s.acc[1].role}) = ${s.formatAccumulator(1)} · Card: ${s.lastCard}`,
            os: `Master Programmer Step #${s.masterStep} · Addition Cycles=${s.additionCycles}\nActive Coaxial Trunks=${s.cords.filter((c) => c.enabled).length}/${s.cords.length}`,
            isa: s.cords
              .map(
                (c) =>
                  `${c.enabled ? "[ON] " : "[OFF]"} ${c.id}: ${c.from} -> ${c.to} (${c.trunk})`,
              )
              .join("\n"),
          };
        },
      },

      lisp83: {
        hw: [
          {
            t: "System level: Symbolics 3600 floor-standing tagged processor, portrait 1124×800 bitmap display, Space-Cadet chord keyboard, and 3-button optical mouse.",
            p: /Symbolics 3600|Portrait|Space-Cadet|Mouse/i,
            viz: "spec",
          },
          {
            t: "L-Bus 36-bit backplane & Schottky TTL/ECL logic boards: dedicated boards for parallel Tag-ALU, CDR-coding/PDL stack buffer, Ephemeral GC map, and 112b WCS.",
            p: /Tag-Check|CDR-Coding|Ephemeral GC|Writable Control/i,
            viz: "modules",
          },
          {
            t: "Parallel 36-bit ALU + Hardware Data-Type Tag Comparator: checks DTP_FIXNUM / DTP_CONS simultaneously with arithmetic in one single microcycle!",
            p: /Tag-Check|CDR-Coding|Diagnostic/i,
            viz: "lisptag36",
          },
          {
            t: "Hardware Ephemeral GC Write-Barrier & Page Hash Table (PHT) MMU tracking old->young intergenerational pointers in hardware.",
            p: /Ephemeral GC|CDR-Coding/i,
            viz: "lisptag36",
          },
          {
            t: "Hard-wired Schottky TTL tag-trap & carry-lookahead gate netlist: click inputs to probe live bipolar logic levels!",
            p: /Tag-Check|Writable Control/i,
            viz: "hardwiredgate",
          },
          {
            t: "L-Bus 36-bit synchronous timing, tag-check strobe, and TTL eye diagram.",
            p: /Tag-Check|Portrait|Diagnostic/i,
            viz: "sigeye",
          },
        ],
        sw: [
          {
            t: "Application: Genera Dynamic Windows Lisp Listener — symbolic calculus differentiation (deriv), higher-order mapcar/reduce, and closures.",
            p: /Portrait|Space-Cadet|Mouse/i,
            viz: "app",
          },
          {
            t: "Single-address-space Lisp OS (Genera) & Incremental Ephemeral Cheney Copying Garbage Collector.",
            p: /Ephemeral GC|Portrait/i,
            viz: "os",
          },
          {
            t: "Stack-oriented Lisp Bytecode & 4K×112-bit Writable Control Store (WCS) microcode executing CAR, CDR, CONS, and generic dispatch.",
            p: /Writable Control|CDR-Coding/i,
            viz: "isa",
          },
          {
            t: "36-bit word bit-field layout: [35:34] 2-bit CDR-Code (CDR_NEXT/CDR_NIL 50% list compaction) + [33:30] 4-bit DTP Tag + [29:0] 30-bit Payload.",
            p: /Tag-Check|CDR-Coding/i,
            viz: "lisptag36",
          },
          {
            t: "Microcycle timing & 36-bit tagged word bit-plane scope.",
            p: /Tag-Check|Portrait/i,
            viz: "sigeye",
          },
        ],
        probe(m) {
          const s = m.sim;
          const hex = s.encodeWord36Hex(s.lastResultWord);
          return {
            wordHex: hex,
            cdrSaved: s.cdrWordsSaved,
            out: s.lastOutput,
            gc: s.gcCycles,
            tags: s.tagChecks,
            sigTitle: "L-Bus 36-Bit Tagged Memory & Microcycle Clock",
            bits: (s.lastResultWord.payload ^ (s.tagChecks << 8)) >>> 0,
            app: `Result => ${s.lastOutput}\n36-Bit Word: ${hex}\nCDR-Coding Words Saved=${s.cdrWordsSaved} (50% list compaction!)`,
            os: `Symbolics Genera Single-Address-Space Lisp OS\nEphemeral Cheney GC Flips=${s.gcCycles} · Live=${s.liveWords}w · Reclaimed=${s.lastReclaimed}w`,
            isa: `Parallel Hardware Tag Checks=${s.tagChecks} (Zero software type-tag shift/mask tax!)\n[35:34]=CDR_CODE · [33:30]=DTP_TAG · [29:0]=30b Fixnum/VMA`,
          };
        },
      },

      wse24: {
        hw: [
          {
            t: "System level: 15U water-cooled Wafer-Scale Engine block uniting 84 EUV reticles (900,000 cores + 44 GB 1-cycle SRAM) on one uncut 300 mm silicon wafer.",
            p: /Wafer-Scale|Uncut 300 mm|Coldplate|Analyzer/i,
            viz: "spec",
          },
          {
            t: "CTE-compliant gold pogo-pin power delivery interposer + rear micro-channel copper coldplate delivering & extracting up to 23 kW perpendicular to the wafer.",
            p: /Coldplate|Pogo-Pin|Uncut 300 mm/i,
            viz: "modules",
          },
          {
            t: "EUV reticle-stitched copper scribe bridges & redundant spare-core bypass muxes healing cleanroom particle defects with 100% mesh reachability.",
            p: /Uncut 300 mm|Wafer Reticle Tile|Pogo-Pin/i,
            viz: "wsestitch",
          },
          {
            t: "Single-cycle local SRAM banks + color-tagged asynchronous wavelet routers & LIF/STDP neuromorphic accumulators.",
            p: /Wafer Reticle Tile|Uncut 300 mm/i,
            viz: "wsestitch",
          },
          {
            t: "Hard-wired 5nm FinFET wavelet-mux & spare-row detour gate netlist: click pins to test sub-nanosecond switching!",
            p: /Wafer Reticle Tile|Uncut 300 mm/i,
            viz: "hardwiredgate",
          },
          {
            t: "0.72 V inter-reticle copper stitch wave propagation & 21 PB/s SRAM eye aperture.",
            p: /Uncut 300 mm|Analyzer/i,
            viz: "sigeye",
          },
        ],
        sw: [
          {
            t: "Application: spatial pipeline LLM/PDE wavelet GEMM & event-driven Leaky Integrate-and-Fire (LIF) + STDP spiking neural networks.",
            p: /Analyzer|Uncut 300 mm/i,
            viz: "app",
          },
          {
            t: "Whole-wafer spatial graph placer & defect-aware fabric routing compiler mapping layers to physical reticle coordinates.",
            p: /Uncut 300 mm|Wafer Reticle Tile/i,
            viz: "os",
          },
          {
            t: "Dataflow Triggered ISA: instructions fire directly on arrival of color-tagged wavelets — zero shared memory cache-coherency traffic!",
            p: /Wafer Reticle Tile|Analyzer/i,
            viz: "isa",
          },
          {
            t: "Live 10×10 spatial activation / membrane-potential heatmap & defect detour state.",
            p: /Wafer Reticle Tile|Analyzer/i,
            viz: "wsestitch",
          },
          {
            t: "Inter-reticle stitched link eye diagram & active core bit-plane.",
            p: /Uncut 300 mm|Analyzer/i,
            viz: "sigeye",
          },
        ],
        probe(m) {
          const s = m.sim;
          return {
            tiles: s.tiles,
            yieldPct: s.yieldPct,
            sigTitle: "0.72V Reticle-Stitched Copper Wavelet Link",
            bits: (s.waveletsRouted ^ (s.spikesFired << 4)) >>> 0,
            app: `Mode: ${s.mode.toUpperCase()} · Routed Wavelets=${s.waveletsRouted.toLocaleString()}\nLIF Spikes=${s.spikesFired} · Hebbian STDP Δw=${s.stdpUpdates}\nOn-Wafer SRAM: 44 GB @ 21.0 PB/s (Zero off-wafer SERDES wall!)`,
            os: `Defect-Tolerant Fabric Compiler · Wafer Yield=${s.yieldPct}% (${s.defectCount} bypassed)\nMesh Connectivity=${s.connectivityOk ? "100% REACHABLE" : "PARTITIONED"} · Power=${s.powerKw} kW`,
            isa: `Asynchronous Color-Tagged Wavelet Dataflow + 1-Hop Spare-Row Detour Mux\nSpare Bypass Reroutes=${s.spareReroutes}`,
          };
        },
      },

      tandem77: {
        hw: [
          {
            t: "System level: Tandem NonStop-16 dual-bay modular cabinet engineered with zero single points of failure for 24×7 global OLTP banking.",
            p: /Tandem NonStop|Dynabus|CPU Module|Disk Vol|6530/i,
            viz: "spec",
          },
          {
            t: "Share-nothing hot-swappable CPU blades (each with private RAM & isolated DC power) + dual independent Dynabus X/Y backplanes + dual-ported RAID-1 mirrors.",
            p: /CPU Module|Dynabus|Disk Vol/i,
            viz: "modules",
          },
          {
            t: "Dual Dynabus X & Y packet-switched interprocessor controllers & dual-channel mirrored disk controllers.",
            p: /Dynabus|CPU Module|Disk Vol/i,
            viz: "tandemwal",
          },
          {
            t: "Hardware heartbeat watchdog timers & ECC memory isolation preventing fault propagation across CPUs.",
            p: /CPU Module|Dynabus/i,
            viz: "tandemwal",
          },
          {
            t: "Hard-wired Schottky TTL bus-arbiter & dual-rail voter gate netlist: click inputs to test logic!",
            p: /CPU Module|Dynabus/i,
            viz: "hardwiredgate",
          },
          {
            t: "Dynabus X/Y differential packet strobe & mirrored I/O eye diagram.",
            p: /Dynabus|6530/i,
            viz: "sigeye",
          },
        ],
        sw: [
          {
            t: "Application: 8-account ACID ATM & clearinghouse ledger conserving exact $1,000,000.00 across arbitrary CPU/bus/disk crashes.",
            p: /6530|Disk Vol/i,
            viz: "app",
          },
          {
            t: "Guardian message-passing OS & NonStop Process Pairs (Primary + passive checkpointed Backup taking over in <1 heartbeat).",
            p: /CPU Module|6530/i,
            viz: "os",
          },
          {
            t: "Jim Gray's Transaction Monitoring Facility (TMF): Write-Ahead Logging (WAL LSN) flushing UNDO/REDO records before in-place page updates.",
            p: /Disk Vol|6530/i,
            viz: "isa",
          },
          {
            t: "Live Process-Pair active/backup matrix & mirrored LSN states.",
            p: /CPU Module|Disk Vol|6530/i,
            viz: "tandemwal",
          },
          {
            t: "Dynabus heartbeat timing & WAL LSN bit-plane scope.",
            p: /Dynabus|6530/i,
            viz: "sigeye",
          },
        ],
        probe(m) {
          const s = m.sim;
          return {
            total: s.totalLedgerDollars(),
            pairs: s.processPairs,
            sigTitle: "13 MB/s Dual Dynabus X/Y Differential Clock",
            bits: (s.lsn ^ (s.committedTx << 8)) >>> 0,
            app: `ACID Bank Ledger Total = $${s.totalLedgerDollars().toLocaleString()} (${s.invariantOk ? "INVARIANT EXACT ✓" : "VIOLATION"})\nCommitted Tx=${s.committedTx} · Mid-Crash WAL Rollbacks=${s.rolledBackTx}`,
            os: `Guardian OS Share-Nothing Process Pairs · Online CPUs=${s.cpus.filter((c) => c.online).length}/4\nDynabus X=${s.dynabus.X ? "UP" : "CUT"} (${s.dynabus.msgsX}) · Dynabus Y=${s.dynabus.Y ? "UP" : "CUT"} (${s.dynabus.msgsY})`,
            isa: `Jim Gray Write-Ahead Log (WAL): LSN #${s.lsn}\nMirrored Volumes: A=${s.disks[0].online ? "SYNC" : "DOWN"} · B=${s.disks[1].online ? "SYNC" : "DOWN"}`,
          };
        },
      },

      blade04: {
        hw: [
          {
            t: "System level: 7U modular datacenter blade enclosure with extracted 1U Dual-Socket AMD Opteron 250 x86-64 compute blade & NOC display.",
            p: /Blade|Opteron|DIMM|Telemetry/i,
            viz: "spec",
          },
          {
            t: "Dual-socket ccNUMA motherboard: each Opteron integrates its own DDR memory controller on-die (65 ns local) and links sockets via 6.4 GB/s coherent HyperTransport (112 ns remote).",
            p: /Opteron|DIMM|Extracted/i,
            viz: "modules",
          },
          {
            t: "x86-64 64-bit long-mode core + hardware virtualization extensions (AMD-V / Intel VT-x) + tagged 2D Nested Page Table walker (RVI / EPT).",
            p: /Opteron|Extracted/i,
            viz: "bladeept",
          },
          {
            t: "ccNUMA snoop filter, Registered ECC DDR syndrome logic, and zero-copy scatter-gather Gigabit NIC DMA engines.",
            p: /Opteron|DIMM/i,
            viz: "bladeept",
          },
          {
            t: "Hard-wired 90nm SOI CMOS 64-bit AGU & page-walker gate netlist: click pins to probe live gates!",
            p: /Opteron|Extracted/i,
            viz: "hardwiredgate",
          },
          {
            t: "HyperTransport differential LVDS link eye diagram & 64-bit address bit-plane.",
            p: /Opteron|Telemetry/i,
            viz: "sigeye",
          },
        ],
        sw: [
          {
            t: "Application: 4 isolated multi-tenant guest VMs (Nginx C10K edge, Postgres OLTP, Memcached, JBoss) consolidated onto one physical blade.",
            p: /Blade|Telemetry/i,
            viz: "app",
          },
          {
            t: "Type-1 Hypervisor + Kernel Samepage Merging (KSM) content deduplication + Virtio Balloon overcommit + Linux 2.6 O(1) epoll event loop.",
            p: /Extracted|Telemetry/i,
            viz: "os",
          },
          {
            t: "Hardware VMX Root/Non-Root rings & 2D Nested Page Tables (gVA -> gPA -> hPA: 1-cycle VPID TLB hit vs 24-reference cold 2D walk).",
            p: /Opteron|Telemetry/i,
            viz: "isa",
          },
          {
            t: "Live 2D page-table translation pipeline & C10K epoll vs select readiness scaling.",
            p: /Opteron|Telemetry/i,
            viz: "bladeept",
          },
          {
            t: "HyperTransport / DDR eye diagram & guest VPID bit-plane scope.",
            p: /Opteron|Telemetry/i,
            viz: "sigeye",
          },
        ],
        probe(m) {
          const s = m.sim;
          return {
            io: s.ioMode,
            rps: s.c10kReqPerSec,
            lat: s.avgMemLatencyNs,
            over: s.overcommitRatio,
            sigTitle: "1.0 GHz HyperTransport LVDS & DDR-400 Strobe",
            bits: (s.c10kReqPerSec ^ (s.vmExits << 4)) >>> 0,
            app: `C10K Concurrency (10,000 TCP Sockets): ${s.c10kReqPerSec.toLocaleString()} HTTP req/s via ${s.ioMode.toUpperCase()}\n4 Consolidated Guest VMs · ${s.overcommitRatio}× Logical RAM Overcommit`,
            os: `VMM=${s.vmmMode === "ept_vtx" ? "AMD-V/VT-x + 2D EPT" : "Trap-and-Emulate Shadow PTs"} · VM-Exits=${s.vmExits} (~${s.avgExitCycles} cyc)\nKSM Dedup Saved=${s.ksmSavedMB} MB · ccNUMA Avg Latency=${s.avgMemLatencyNs} ns`,
            isa: `2D Nested Page Walk (4×4+8 = 24 mem refs cold): VPID TLB Hits=${s.tlbHits}, Walks=${s.tlb2dWalks}\nFD Scans/Tick=${s.descriptorScansPerTick} (${s.ioMode === "epoll" ? "O(k) Ready Ring" : "O(N) Bitmask"})`,
          };
        },
      },

      systolic82: {
        hw: [
          {
            t: "System level: Kung–Leiserson / CMU Warp VMEbus VLSI Systolic Array accelerator board with open-lid 4×4 PE ceramic PGA package & analyzer console.",
            p: /Systolic|PGA|FIFO|Analyzer/i,
            viz: "spec",
          },
          {
            t: "Board architecture: West row-skew SRAM FIFOs and North column-skew SRAM FIFOs feed a 2D array of identical Processing Elements with zero global broadcast buses.",
            p: /Systolic|FIFO|PGA/i,
            viz: "modules",
          },
          {
            t: "Pin-Grid-Array VLSI die floorplan: 16 identical hard-wired Multiply-Accumulate (MAC) cells wired strictly to East and South nearest neighbors.",
            p: /PGA|Processing Element/i,
            viz: "systolicpe",
          },
          {
            t: "Single-cycle systolic PE datapath: latches (a_in, b_in), computes acc += a_in * b_in, and forwards a_out->East, b_out->South on every clock edge.",
            p: /Processing Element|FIFO/i,
            viz: "systolicpe",
          },
          {
            t: "Hard-wired NMOS/CMOS Booth-multiplier & carry-save adder gate netlist: click inputs to toggle bits!",
            p: /Processing Element|PGA/i,
            viz: "hardwiredgate",
          },
          {
            t: "Global systolic two-phase non-overlapping clock (φ1/φ2) & nearest-neighbor wire eye diagram.",
            p: /Processing Element|Analyzer/i,
            viz: "sigeye",
          },
        ],
        sw: [
          {
            t: "Application: exact 4×4 dense matrix multiplication C = A × B, 2D image convolution, and homogeneous 3D geometry transforms.",
            p: /Analyzer|Systolic/i,
            viz: "app",
          },
          {
            t: "Host DMA wavefront scheduler: skews row i by i beats and column j by j beats so A[i,k] and B[k,j] collide in PE[i,j] at beat t = i + j + k.",
            p: /FIFO|Analyzer/i,
            viz: "os",
          },
          {
            t: "Zero-Instruction Spatial Dataflow: eliminates instruction fetch/decode and achieves 6.0× (O(N)) SRAM bandwidth reuse — direct ancestor of Google TPUs!",
            p: /Processing Element|Analyzer/i,
            viz: "isa",
          },
          {
            t: "Cycle-accurate 4×4 PE accumulator lattice & diagonal wavefront state.",
            p: /Processing Element|Analyzer/i,
            viz: "systolicpe",
          },
          {
            t: "Systolic beat timing & PE accumulator bit-plane scope.",
            p: /Processing Element|Analyzer/i,
            viz: "sigeye",
          },
        ],
        probe(m) {
          const s = m.sim;
          return {
            cycle: s.cycle,
            pes: s.pes,
            sigTitle: "Two-Phase Non-Overlapping VLSI Systolic Clock (φ1/φ2)",
            bits: ((s.totalMacs & 0xffff) ^ ((s.outC[0][0] & 0xff) << 16)) >>> 0,
            app: `Preset: ${s.presetName} (${s.dataflowMode})\nWavefront Beat t=${s.cycle}/10 · Exact C == A×B Verified: ${s.verifiedExact ? "YES ✓" : "IN FLIGHT"}\nRow 0 Output: [${s.outC[0].join(", ")}]`,
            os: `Skewed Boundary DMA FIFOs · Total Hard-Wired MACs=${s.totalMacs}\nOff-Chip Bandwidth Reuse = ${s.reuseFactor.toFixed(1)}× (32 SRAM reads -> 64 MACs)`,
            isa: `Pure Spatial Dataflow: 0 Instruction Fetches / Cycle!\nOutput-Stationary vs TPU-Style Weight-Stationary Toggleable Live`,
          };
        },
      },

      fugaku20: {
        hw: [
          {
            t: "System level: RIKEN/Fujitsu Fugaku water-cooled supercomputer rack (442 PFLOPS FP64 HPL, 16 PFLOPS sparse HPCG) + magnified 7nm A64FX CoWoS package.",
            p: /Fugaku|A64FX|HBM2|Console/i,
            viz: "spec",
          },
          {
            t: "CoWoS silicon interposer module: 4 Core Memory Groups (12 compute + 1 OS assistant core each) directly coupled to 4× HBM2 stacks at 1,024 GB/s!",
            p: /A64FX|CoWoS|HBM2/i,
            viz: "modules",
          },
          {
            t: "Dual 512-bit ARM SVE (Scalable Vector Extension) FMA pipelines per core + hardware P0..P15 per-lane predicate registers.",
            p: /A64FX|SVE|HBM2/i,
            viz: "fugakusve",
          },
          {
            t: "On-die 6D TofuD torus network interface (10× 28 Gbps ports across X, Y, Z, A, B, C coordinates) + hardware barrier blades.",
            p: /Coldplate|A64FX|Console/i,
            viz: "fugakusve",
          },
          {
            t: "Hard-wired 7nm FinFET predicated FMA & TofuD crossbar gate netlist: click inputs to toggle pins!",
            p: /A64FX|CoWoS/i,
            viz: "hardwiredgate",
          },
          {
            t: "28 Gbps TofuD SERDES & 2.0 Gbps HBM2 wide-I/O eye diagram.",
            p: /HBM2|Console/i,
            viz: "sigeye",
          },
        ],
        sw: [
          {
            t: "Application: iterative Sparse Conjugate-Gradient PDE solver (HPCG #1 worldwide) & dense FP64 LINPACK (TOP500 #1).",
            p: /Console|A64FX/i,
            viz: "app",
          },
          {
            t: "McKernel / Linux OS-Jitter Isolation: 4 dedicated Assistant Cores handle all I/O interrupts and MPI progress so 48 compute cores run tickless!",
            p: /A64FX|Coldplate/i,
            viz: "os",
          },
          {
            t: "ARMv8.2-A + Vector-Length-Agnostic (VLA) SVE ISA: WHILELT P0.D eliminates scalar remainder loops for arbitrary array lengths N.",
            p: /A64FX|Console/i,
            viz: "isa",
          },
          {
            t: "Live 8-lane FP64 SVE predicate mask, HBM2 Roofline utilization, and 6D TofuD torus hop breakdown.",
            p: /A64FX|HBM2|Console/i,
            viz: "fugakusve",
          },
          {
            t: "HBM2 / TofuD signal eye & predicated SVE lane bit-plane.",
            p: /HBM2|Console/i,
            viz: "sigeye",
          },
        ],
        probe(m) {
          const s = m.sim;
          let maskBits = 0;
          for (let i = 0; i < 8; i++) if (s.predicateMask[i]) maskBits |= 1 << i;
          return {
            mask: Array.from(s.predicateMask),
            res: s.cgResidual,
            hops: s.tofuHops,
            bw: s.achievedHbmGBs,
            sigTitle: "28 Gbps 6D TofuD SERDES & HBM2 Interposer Bus",
            bits: ((s.cgIter << 8) | maskBits) >>> 0,
            app: `Workload: ${s.workload.toUpperCase()} (${s.systemPetaflops} PFLOPS) · AI=${s.arithmeticIntensity} FLOP/B\nSparse CG Iter #${s.cgIter} · Residual ||r||_2 = ${s.cgResidual.toExponential(3)}`,
            os: `48 Compute + 4 OS Assistant Cores (Zero OS Jitter) · 4× HBM2 CMGs=${s.achievedHbmGBs}/1,024 GB/s\n6D TofuD Torus Route: ${s.tofuHops} hops (${s.activeRails}/6 rails)`,
            isa: `ARM SVE 512-bit WHILELT P0.D (N=${s.problemLen} -> ${s.activeSveLanes}/8 tail lanes active)\nP0 = [${Array.from(s.predicateMask).join(", ")}]`,
          };
        },
      },

      qspin: {
        hw: [
          {
            t: "System level: 1.2 K 'Hot-Qubit' pumped-⁴He stage holding a 300 mm EUV CMOS ²⁸Si/SiGe spin-qubit wafer, Cryo-CMOS ASIC, and statevector console.",
            p: /Hot-Qubit|300 mm EUV|Heterostructure|Cryo-CMOS|Analyzer/i,
            viz: "spec",
          },
          {
            t: "1.2 K Cold-Plate & Co-Packaged Cryo-CMOS Control ASIC: 100× higher cooling budget than 15 mK mK-fridges lets sub-ns CMOS pulse generators sit beside the QPU.",
            p: /Cold-Plate|Cryo-CMOS|300 mm EUV/i,
            viz: "modules",
          },
          {
            t: "Isotopically purified ²⁸Si/SiGe strained quantum well (~50 nm gate pitch): plunger gates P0..P3 trap single electrons while J01..J23 barriers control exchange.",
            p: /Heterostructure|Quantum Well|Plunger Gate|Exchange Barrier/i,
            viz: "qspinpsb",
          },
          {
            t: "On-chip Cobalt Micromagnet (sloshing-field EDSR) & RF-SET Singlet-Triplet Pauli Spin Blockade charge sensor.",
            p: /Cobalt Micromagnet|RF Single-Electron|Confined Electron/i,
            viz: "qspinpsb",
          },
          {
            t: "Reversible Quantum Unitary CNOT / Toffoli Exchange Gate Bench: click qubits/ancillas to test lossless bijective logic!",
            p: /Exchange Barrier|Confined Electron|Plunger Gate/i,
            viz: "hardwiredgate",
          },
          {
            t: "Sub-nanosecond J(V) barrier voltage pulse & GHz EDSR Larmor eye diagram.",
            p: /Cobalt Micromagnet|Cryo-CMOS|Analyzer/i,
            viz: "sigeye",
          },
        ],
        sw: [
          {
            t: "Application: Bell |Φ+⟩ entanglement, Pauli-Spin-Blockade |Ψ-⟩ Singlet readout verification, and 4-spin GHZ state preparation.",
            p: /Confined Electron|Analyzer/i,
            viz: "app",
          },
          {
            t: "1.2 K Cryo-CMOS Pulse Sequencer & Isotopic ²⁹Si Overhauser Dynamical-Decoupling (Hahn-Echo) Calibrator.",
            p: /Cryo-CMOS|Analyzer/i,
            viz: "os",
          },
          {
            t: "Loss–DiVincenzo Native Gate Set: EDSR R_{x,y}(θ) + Heisenberg Exchange U_ex(θ) = exp(-i θ S₁·S₂) synthesizing √SWAP and exact CNOT.",
            p: /Exchange Barrier|Cobalt Micromagnet|Analyzer/i,
            viz: "isa",
          },
          {
            t: "Exact 16-amplitude 4-spin statevector, reduced Bloch vectors ⟨σ_x, σ_y, σ_z⟩, and PSB singlet tunneling fraction.",
            p: /Confined Electron|RF Single-Electron|Analyzer/i,
            viz: "qspinpsb",
          },
          {
            t: "J-gate exchange pulse timing & spin state bit-plane scope.",
            p: /Exchange Barrier|Analyzer/i,
            viz: "sigeye",
          },
        ],
        probe(m) {
          const s = m.sim;
          return {
            t2: s.t2StarUs,
            fid: s.twoQubitFidelity,
            bloch: s.bloch,
            singlet: s.psbSingletProb,
            bell: s.bellPhiPlusProb,
            sigTitle: "1.2 K Cryo-CMOS J-Barrier Pulse & EDSR Drive",
            bits: (Math.round(s.bellPhiPlusProb * 255) | (s.shots << 8)) >>> 0,
            app: `4-Spin ²⁸Si/SiGe Quantum Well (²⁹Si=${s.si29Ppm} ppm @ 1.2 K)\nBell |Φ+⟩ Fidelity=${(s.bellPhiPlusProb * 100).toFixed(2)}% · PSB Singlet=${(s.psbSingletProb * 100).toFixed(1)}%`,
            os: `Inhomogeneous T2* = ${s.t2StarUs} µs · Hahn-Echo T2 = ${s.t2HahnMs} ms\n2-Qubit Exchange Fidelity = ${(s.twoQubitFidelity * 100).toFixed(2)}%`,
            isa: `Loss–DiVincenzo Exchange: U_ex(π/2) = √SWAP -> Exact CNOT Synthesis\nLast Pulse: ${s.gateLog[s.gateLog.length - 1] || "Init |0000⟩"}`,
          };
        },
      },
    };

    Object.assign(qy, newLayers);

    // 5. Auto-Upgrade All Existing 40 Machines from (5 HW + 4 SW = 9) -> (6 HW + 5 SW = 11 Rungs)!
    for (const [id, entry] of Object.entries(qy)) {
      if (!entry || !Array.isArray(entry.hw) || !Array.isArray(entry.sw)) continue;
      const fam = HardWiredNetlistSolver.familyFor(id);

      if (entry.hw.length === 5) {
        // Build guaranteed non-shell matching regex by combining existing inner rungs hw[1..3]
        const hwSources = entry.hw
          .slice(1, 4)
          .map((r) => (r && r.p ? r.p.source : ""))
          .filter(Boolean);
        const combinedHwRe = hwSources.length
          ? new RegExp(hwSources.join("|"), "i")
          : /./i;
        entry.hw.splice(4, 0, {
          t: `Gate-level FAMILY TEMPLATE (${fam.title}): a generic 6-gate ${fam.device} adder/control slice shared by every machine in this switching family (${TEMPLATE_NOTE}). Click A, B, Cin, Mode on the canvas to evaluate it.`,
          p: combinedHwRe,
          viz: "hardwiredgate",
        });
      }

      if (entry.sw.length === 4) {
        const swSources = entry.sw
          .slice(1, 4)
          .map((r) => (r && r.p ? r.p.source : ""))
          .filter(Boolean);
        const combinedSwRe = swSources.length
          ? new RegExp(swSources.join("|"), "i")
          : /./i;
        entry.sw.push({
          t: `Cycle-level signal-integrity eye diagram & 32-bit hardware state bit-plane (${fam.vLow} ↔ ${fam.vHigh}, FO4 delay ${HardWiredNetlistSolver.formatDelay(fam.gateDelayPs)}).`,
          p: combinedSwRe,
          viz: "sigeye",
        });
      }
    }

    // 6. Register Live 2D Diagram Node Pollers (Lm) for the 8 New Machines
    if (typeof Lm !== "undefined") {
      Object.assign(Lm, {
        eniac46: (m) => ({
          mp: "step " + m.sim.masterStep,
          fta: "G=" + m.sim.acc[4].value,
          acc: m.sim.formatAccumulator(0).slice(0, 7),
          bus: m.sim.cords.filter((c) => c.enabled).length + "/5 cords",
          io: m.sim.additionCycles + " adds",
        }),
        lisp83: (m) => ({
          wcs: m.sim.tagChecks + " tags",
          alu: m.sim.encodeWord36Hex(m.sim.lastResultWord).slice(0, 8),
          heap: "CDR -" + m.sim.cdrWordsSaved + "w",
          disp: "GC#" + m.sim.gcCycles,
        }),
        wse24: (m) => ({
          pwr: m.sim.powerKw + " kW",
          wafer: m.sim.mode.toUpperCase(),
          sram: "21 PB/s",
          spare: m.sim.yieldPct + "% yld",
        }),
        tandem77: (m) => ({
          cpu01: m.sim.cpus.filter((c) => c.online).length + "/4 UP",
          busx: (m.sim.dynabus.X ? "X" : "-") + "/" + (m.sim.dynabus.Y ? "Y" : "-"),
          raid1: "LSN " + m.sim.lsn,
          wal: m.sim.committedTx + " TX",
        }),
        blade04: (m) => ({
          n0: m.sim.avgMemLatencyNs + " ns",
          ht: sOr(m.sim.numaBalancing ? "PINNED" : "REMOTE"),
          ept: m.sim.vmmMode === "ept_vtx" ? "2D EPT" : "SHADOW",
          epoll: Math.round(m.sim.c10kReqPerSec / 1000) + "k rps",
        }),
        systolic82: (m) => ({
          west: "t=" + m.sim.cycle + "/10",
          grid: m.sim.totalMacs + " MAC",
          out: m.sim.verifiedExact ? "C=A×B ✓" : "FLOW",
        }),
        fugaku20: (m) => ({
          sve: m.sim.activeSveLanes + "/8 SVE",
          hbm: m.sim.achievedHbmGBs + " GB/s",
          tofu: m.sim.tofuHops + " hops",
        }),
        qspin: (m) => ({
          cmos: "1.2 K",
          dots: "T2* " + m.sim.t2StarUs + "µs",
          jgate: "F=" + (m.sim.twoQubitFidelity * 100).toFixed(1) + "%",
          psb: "S=" + (m.sim.psbSingletProb * 100).toFixed(0) + "%",
        }),
      });
    }

    function sOr(v) {
      return v;
    }

    // 7. Append Primary-Source Engineering Reference Rows to p0 for All 8 New Machines
    if (typeof p0 !== "undefined" && Array.isArray(p0)) {
      p0.push(
        {
          id: "eniac46",
          wing: "personal",
          name: "UPenn ENIAC (Electronic Numerical Integrator & Computer)",
          year: 1946,
          clock: 100e3,
          mem: 200,
          tr: null,
          devices: "17,468 vacuum tubes + 70,000 resistors + 1,500 relays",
          power: 150000,
          price: 487000,
          note: "First electronic general-purpose digital computer; 20× 10-digit signed ring accumulators (5,000 adds/s); programmed via coax plugboards.",
          src: "Goldstine & Goldstine, MTAC (1946); Burks, Proc. IRE 35 (1947); Bartik, Pioneer Programmer (2013)",
        },
        {
          id: "lisp83",
          wing: "personal",
          name: "Symbolics 3600 Hardware-Tagged LISP Machine",
          year: 1983,
          clock: 5e6,
          mem: 2304 * 1024,
          tr: null,
          devices: "Schottky TTL/ECL 36-bit tagged datapath + 4K×112b WCS",
          power: 1100,
          price: 78500,
          note: "36-bit words (2b CDR-code + 4b tag + 30b VMA/fixnum); parallel tag traps + hardware ephemeral GC write barriers; Space-Cadet keyboard.",
          src: "D. A. Moon, “Architecture of the Symbolics 3600”, ISCA 12 (1985); Greenblatt et al., MIT AI Memo 444",
        },
        {
          id: "wse24",
          wing: "personal",
          name: "300 mm Wafer-Scale Engine (WSE-3 Reference)",
          year: 2024,
          clock: 1.1e9,
          mem: 44 * 2 ** 30,
          tr: 4e12,
          power: 23000,
          price: null,
          note: "46,225 mm² monolithic 5nm silicon wafer uniting 84 EUV reticles, 900,000 sparse/dataflow cores, and 44 GB 1-cycle SRAM at 21 PB/s.",
          src: "Lauterbach, “The Path to Successful Wafer-Scale Integration”, IEEE Micro 41(6) (2021); Cerebras WSE-3 Architecture Brief (2024)",
        },
        {
          id: "tandem77",
          wing: "servers",
          name: "Tandem NonStop-16 Fault-Tolerant Cluster (4-CPU Reference)",
          year: 1977,
          clock: 10e6,
          mem: 2 * 2 ** 20,
          tr: null,
          devices: "4× share-nothing Schottky TTL CPU blades + dual Dynabus X/Y",
          power: 3400,
          price: 165000,
          note: "Share-nothing Process Pairs + dual Dynabus + mirrored RAID-1 + Jim Gray's TMF Write-Ahead Log (WAL) for Five-Nines OLTP.",
          src: "Bartlett, “A NonStop Kernel”, SOSP (1981); Gray, “Why Do Computers Stop and What Can Be Done About It?” (Tandem TR 85.7)",
        },
        {
          id: "blade04",
          wing: "servers",
          name: "Dual-Opteron 250 x86-64 Hypervisor & C10K Blade",
          year: 2004,
          clock: 2.4e9,
          mem: 16 * 2 ** 30,
          tr: 2 * 105.9e6,
          power: 260,
          price: 4800,
          note: "AMD64 64-bit extensions + integrated DDR IMC + coherent HyperTransport ccNUMA + hardware VMM nested paging + Linux 2.6 O(1) epoll.",
          src: "Keltcher et al., “The AMD Opteron Processor for Multiprocessor Servers”, IEEE Micro (2003); Adams & Agesen, ASPLOS (2006); Kegel, C10K",
        },
        {
          id: "systolic82",
          wing: "super",
          name: "Kung–Leiserson 2D VLSI Systolic Array (CMU Warp Lineage)",
          year: 1982,
          clock: 10e6,
          mem: 64 * 1024,
          tr: 120000,
          power: 180,
          price: null,
          note: "Hard-wired 2D nearest-neighbor MAC wavefront grid achieving O(N) memory reuse with zero instruction fetch — direct ancestor of Google TPUs.",
          src: "H. T. Kung, “Why Systolic Architectures?”, IEEE Computer 15(1) (1982); Annaratone et al., “The Warp Computer”, IEEE Trans. Comput. (1987)",
        },
        {
          id: "fugaku20",
          wing: "super",
          name: "RIKEN / Fujitsu Fugaku Supercomputer (442 PFLOPS Full System)",
          year: 2020,
          clock: 2.2e9,
          mem: 4.85 * 2 ** 50,
          tr: 158976 * 8.786e9,
          power: 29.9e6,
          price: 1e9,
          note: "158,976 A64FX 7nm nodes (48+4 ARM SVE 512b cores + 32 GB HBM2 @ 1 TB/s each); swept #1 TOP500, HPCG, HPL-AI & Graph500 simultaneously.",
          src: "Sato et al., “Co-Design for A64FX Manycore Processor and Fugaku”, SC20 (2020); TOP500 June 2020",
        },
        {
          id: "qspin",
          wing: "quantum",
          name: "²⁸Si/SiGe Foundry CMOS Quantum-Dot Spin QPU (Tunnel Falls / Diraq)",
          year: 2024,
          clock: null,
          mem: null,
          tr: null,
          devices:
            "Isotopically purified ²⁸Si/SiGe quantum-dot spins @ 1.2 K (~50 nm pitch)",
          power: 1200,
          price: null,
          note: "Loss–DiVincenzo electron-spin qubits on 300mm EUV CMOS lines; cobalt-micromagnet EDSR, Heisenberg exchange √SWAP/CNOT & Pauli Spin Blockade.",
          src: "Loss & DiVincenzo, PRA 57 (1998) 120; Xue et al., Nature 601 (2022); Neyens et al. (Intel 300mm Tunnel Falls), Nature 629 (2024)",
        },
      );
    }
  }

  Object.assign(globalScope, {
    SWITCH_FAMILIES,
    TEMPLATE_NOTE,
    MACHINE_FAMILY_MAP,
    HardWiredNetlistSolver,
  });
})(typeof window !== "undefined" ? window : globalThis);
