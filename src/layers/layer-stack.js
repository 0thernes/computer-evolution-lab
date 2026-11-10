var At = (i, e = 2) => (i >>> 0).toString(16).toUpperCase().padStart(e, "0"),
  ds = (i, e = 4) => (i >>> 0).toString(8).padStart(e, "0"),
  kn = (i, e = 14) => {
    let t = i._ui && i._ui.querySelector("textarea");
    return t
      ? t.value
          .split(
            `
`,
          )
          .slice(0, e).join(`
`)
      : "";
  },
  Un = (i) => (e) => (e.isRunning ? (e.isRunning() ? "RUNNING" : "STOPPED") : i || ""),
  _c = [
    "System",
    "Boards & modules",
    "Chips & devices",
    "Logic & circuits",
    "Physics & signals",
  ],
  Cc = ["Application / program", "OS / monitor", "ISA / microcode", "Bits & voltages"],
  By = [
    { cut: 0, exp: 0 },
    { cut: 1, exp: 0.25 },
    { cut: 1, exp: 0.5 },
    { cut: 1, exp: 0.55 },
    { cut: 1, exp: 0.7 },
  ],
  zy = [
    { cut: 0, exp: 0 },
    { cut: 1, exp: 0.15 },
    { cut: 1, exp: 0.35 },
    { cut: 1, exp: 0.5 },
  ],
  qy = {
    m6502: {
      hw: [
        {
          t: "Package level: a 40-pin ceramic DIP with a gold lid. Inside, a single NMOS die holds the whole CPU. MOS Technology sold it for $25 in 1975, which made home computers affordable. On the right is a MOnSter 6502-style board: the same circuit built from 3,218 discrete transistors and 1,019 resistors, with LEDs.",
          p: /DIP-40|MOnSter 6502-style|Magnified die|Clock & reset/i,
          viz: "spec",
        },
        {
          t: "Open the package: 40 gold bond wires connect the die's pads to the lead frame. The magnified die above it shows the floorplan. The decode PLA runs across the top, the random control logic sits in the middle, and the 8-bit datapath (registers, ALU, buses) runs along the bottom, ringed by power rails and pads.",
          p: /Silicon die in cavity|Bond wires|Gold-plated lid|DIP-40/i,
          viz: "die6502",
        },
        {
          t: "Functional blocks, after Hanson's 6502 block diagram. The decode ROM/PLA (130 terms) and random control logic drive the datapath: IR, PCL/PCH, A/X/Y/S, the ALU with decimal adjust, the P flags, the address-bus drivers, the input data latch and the data output register. Live: the blocks the current bus cycle uses.",
          p: /Functional-block|Metal layer|Indicator LEDs/i,
          viz: "blocks6502",
        },
        {
          t: "Gates: the 6502 has no CMOS. Each gate is an NMOS depletion-load circuit. A depletion transistor (always on) pulls the output up to VCC, and enhancement transistors pull it down. In series they make a NAND; in parallel they make a NOR. Whenever the output is low, current flows: about 0.5 W for the chip, burned even when idle. Live inputs: data bus bit 0 and address bit 0.",
          p: /Polysilicon|Diffusion|Discrete MOSFETs/i,
          viz: "nmosgate",
        },
        {
          t: "Transistor physics: wherever polysilicon crosses diffusion there is a self-aligned n-channel MOSFET in p-type silicon. A gate voltage above the threshold (≈1 V) pulls electrons into an inversion layer under the ~100 nm oxide, and the channel conducts. An ion implant gives the depletion loads a negative threshold, so they are always on. Live gate voltage: data bus bit 0.",
          p: /Diffusion|Buried|Polysilicon|Magnified die/i,
          viz: "nmosphys",
        },
      ],
      sw: [
        {
          t: "The program: your 6502 assembly, assembled to $0200. The reset vector at $FFFC/$FFFD points there.",
          p: /Magnified die|Functional-block/i,
          viz: "app",
        },
        {
          t: "There is no OS. After RES goes high, the chip spends 7 cycles reading the reset vector, then fetches the first opcode. On real machines a ROM monitor or BASIC lived at that vector (Apple II Monitor, Commodore KERNAL).",
          p: /Clock & reset|DIP-40/i,
          viz: "os",
        },
        {
          t: 'ISA: 56 instructions and 13 addressing modes, decoded by the PLA from (opcode, T-state). Live: the current instruction, its addressing mode and the bus cycle it is in, including the "dummy" reads that the cycle-accurate model reproduces.',
          p: /Functional-block|Polysilicon/i,
          viz: "isa",
        },
        {
          t: "Bits and voltages: each cycle has two phases. In φ1 the CPU puts the address on A0–A15 and sets R/W. In φ2 data moves on D0–D7. NMOS levels: about 0–0.8 V is a 0 and 2–5 V is a 1. Live: the last 14 cycles.",
          p: /Bond wires|Indicator LEDs|Metal layer/i,
          viz: "buscycle",
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.cur(),
          n = e.cpu,
          s = t.regs || {},
          r = (a, l = 2) => (a >>> 0).toString(16).toUpperCase().padStart(l, "0"),
          o = Fa[i._ir ?? 0];
        return {
          app: kn(i, 18),
          c: t,
          ir: i._ir,
          hist: e.hist,
          mode: e.mode,
          ga: t.ph === 2 ? t.d & 1 : 1,
          gb: t.a & 1,
          vg: t.ph !== 2 || t.d & 1 ? 4.6 : 0.3,
          os: `${Un()(i)} · ${e.mode === "net" ? "TRANSISTOR-LEVEL (visual6502 netlist)" : "cycle-accurate behavioural model"}
cycle ${t.cyc ?? 0} · φ${t.ph || 1}
reset vector $FFFC → $${r(n.mem[65533])}${r(n.mem[65532])}
A=${r(s.a)} X=${r(s.x)} Y=${r(s.y)} S=${r(s.s)} PC=${r(s.pc, 4)}`,
          isa: `IR = $${r(i._ir ?? 0)}  ${o ? o[0] + " (" + o[1] + ", " + o[2] + " cycles min)" : "?"}
bus: AB=$${r(t.a ?? 0, 4)} ${t.rw ? "READ " : "WRITE"} ${t.ph === 2 ? "DB=$" + r(t.d) : ""}${t.sync ? "  SYNC" : ""}
${t.note || ""}
blocks: ${t.blk || "—"}
P = NV-BDIZC ${(s.p >>> 0).toString(2).padStart(8, "0")}`,
        };
      },
    },
    photonic: {
      hw: [
        {
          t: "A silicon-photonic neural accelerator (after Shen et al. 2017 and the companies that followed, e.g. Lightmatter). A laser and fiber feed a chip of interferometers on a temperature-controlled carrier, with DACs, TIAs, ADCs and an FPGA around it. Behind it is a diffractive network exhibit (UCLA, Lin et al. 2018).",
          p: /Silicon-photonic chip|Laser|Control PCB|Diffractive layers/i,
          viz: "spec",
        },
        {
          t: "Modules: laser → splitter + input modulators (write x) → MZI mesh U₁ → nonlinearity → MZI mesh U₂ → Ge photodetectors → TIA/ADC → host, with a DAC array driving every heater. Light does the multiply; electronics only set the phases and read the results.",
          p: /Laser|Fiber array|Silicon-photonic chip|photodetectors|DAC|TIA|FPGA/i,
          viz: "modules",
        },
        {
          t: "Device: the Mach–Zehnder interferometer. A 50:50 coupler, two arms with a heater-controlled phase θ, and another 50:50 coupler. Interference turns θ into any split ratio, P_top = sin²(θ/2), and an outer heater φ sets the output phase. Live: each MZI of the mesh in turn.",
          p: /phase shifters|photodetectors|Silicon-photonic chip/i,
          viz: "mzi",
        },
        {
          t: 'Logic: the "circuit" is a matrix. N(N−1)/2 MZIs in a rectangular Clements mesh plus N output phases realise any N×N unitary U (Reck et al. 1994; Clements et al. 2016), and an SVD (U Σ V†) makes any matrix. Live: the intensity through the mesh and the realised |U|.',
          p: /Silicon-photonic chip|phase shifters|Diffractive|wave field/i,
          viz: "meshviz",
        },
        {
          t: "Physics: light confined in a 500 × 220 nm silicon wire (n = 3.48) in oxide (n = 1.44). A TiN heater changes the index by 1.8×10⁻⁴ per kelvin, and the phase shift is 2π·L·Δn/λ. Computation is coherent interference at 1550 nm, so the chip must be temperature-stabilised (TEC). Live: the ΔT the current θ needs.",
          p: /Silicon-photonic chip|phase shifters|TEC/i,
          viz: "waveguide",
        },
      ],
      sw: [
        {
          t: "The program: a target matrix (mesh mode), a trained network (classifier mode) or trained phase plates (D²NN).",
          p: /Silicon-photonic chip|Diffractive/i,
          viz: "app",
        },
        {
          t: "Control layer: there is no OS, just a calibration and control loop. It measures each heater's phase response, compensates thermal crosstalk, and in training mode perturbs a phase, measures the loss and updates (in-situ training).",
          p: /FPGA|DAC/i,
          viz: "os",
        },
        {
          t: "ISA: one instruction, y = U·x (a matrix–vector multiply), executed in the time light takes to cross the chip. Programming = writing 2N(N−1)/2 + N phases. Live: x, U and y.",
          p: /Silicon-photonic chip/i,
          viz: "isa",
        },
        {
          t: "Bits: the data is analog. Inputs are complex amplitudes (magnitude and phase), detectors measure only |y|², and ADCs quantise that (12-bit shown). Precision is limited by noise and calibration, typically to the equivalent of a few bits.",
          p: /photodetectors|TIA/i,
          viz: "phasor",
        },
      ],
      probe(i, e) {
        let t = i.sim,
          n = t.mode === "onn" ? t.onn.L1 : t.mesh,
          s = t.traces(),
          r = Math.floor(performance.now() / 1500) % n.mzis.length,
          o = n.unitary(),
          a =
            t.mode === "onn"
              ? Rc(t.D.X[0])
              : [0, 1, 2, 3].map((h) => ({ re: h === 0 ? 1 : 0, im: 0 })),
          l = n.apply(a),
          c = (h) =>
            `${h.re >= 0 ? " " : ""}${h.re.toFixed(2)}${h.im >= 0 ? "+" : "−"}${Math.abs(h.im).toFixed(2)}i`;
        return {
          th: n.mzis[r].th,
          k: r,
          trace: s.t1,
          mzis: n.mzis,
          U: o,
          flabel:
            t.mode === "mesh"
              ? `fidelity ${t.fid.toFixed(5)} to “${t.tName}”`
              : "mesh U₁ of the trained network",
          vin: a,
          vout: l,
          app:
            t.mode === "mesh"
              ? `MODE: programmable unitary
target: ${t.tName}
fidelity |Tr(U†T)|²/16 = ${t.fid.toFixed(6)}`
              : t.mode === "onn"
                ? `MODE: optical neural network
accuracy ${(t.onn.accuracy(t.D) * 100).toFixed(1)} % (chance 25 %)
2 meshes × (12 MZI phases + 4 output phases) = 32 parameters`
                : `MODE: diffractive network
3 layers × 64 phase pixels
accuracy ${(t.d2.accuracy() * 100).toFixed(0)} %`,
          os: `${Un()(i)}
heater DAC channels: ${2 * (n.mzis.length * 2 + 4)} · detectors: 4
TEC setpoint 25.000 °C ± 0.01 K
calibration: phase(V²) per heater, crosstalk matrix`,
          isa: `y = U · x
U =
${o.map((h) => h.map(c).join(" ")).join(`
`)}
x = [${a.map(c).join(",")}]
y = [${l.map(c).join(",")}]`,
        };
      },
    },
    alife: {
      hw: [
        {
          t: "A wet-computing bench. A petri dish of reaction–diffusion medium sits on a light table under a camera. Beside it, a microfluidic chip fed by syringe pumps runs DNA logic in droplets under blue excitation light, and a small dish nods to xenobots. Every result is read out optically.",
          p: /Petri dish|Microfluidic|Camera|Syringe|light table/i,
          viz: "spec",
        },
        {
          t: "Modules: syringe pumps (inputs), the microfluidic chip (droplet reactors), the medium (processor and memory in one), the light table and excitation LED (power and clock, in a sense), and the camera with image analysis (output).",
          p: /Petri|Microfluidic|Camera|Syringe|LED/i,
          viz: "modules",
        },
        {
          t: 'Devices: molecules. A DNA gate complex is an output strand held by two blocker strands. Input strands bind short exposed "toeholds" and displace the blockers by branch migration. Each step happens only if the right input sequence is present.',
          p: /Droplets|Microfluidic/i,
          viz: "dnagate",
        },
        {
          t: "Logic: the gate computes AND from kinetics alone. Fluorescence rises only when A and B are both present (Seelig et al. 2006 built AND, OR, NOT and cascades of up to 12 gates this way). Live: the simulated truth table after 3 hours.",
          p: /Reaction|Droplets|Microfluidic/i,
          viz: "dnakin",
        },
        {
          t: "Physics: reaction plus diffusion. Gray–Scott chemistry (U + 2V → 3V, V → P) with fast-diffusing substrate and slow autocatalyst gives Turing-type instabilities. Spots split like cells, stripes and coral grow, and nothing but local chemistry draws them. Live: a CPU twin with the same F and k, and a concentration slice.",
          p: /Reaction|Petri dish|light table/i,
          viz: "rdfield",
        },
      ],
      sw: [
        {
          t: "The program is the chemistry and the boundary conditions: feed/kill rates, the seed pattern, maze geometry and input strand concentrations.",
          p: /Reaction/i,
          viz: "app",
        },
        {
          t: "There is no OS. The experimenter (or a script driving pumps and camera) sets inputs, waits and images; image analysis turns colour into numbers.",
          p: /Camera|Syringe/i,
          viz: "os",
        },
        {
          t: '"Instruction set" = the reaction rules. Every point applies the same local rules in parallel, so the whole dish is one massively parallel computer.',
          p: /Reaction|Droplets/i,
          viz: "isa",
        },
        {
          t: "Bits: in an excitable (BZ-like) medium each cell is resting, excited or refractory. A wave of excitation is a travelling signal, collisions annihilate (wave logic), and arrival times encode distances. Live: the maze-solving wave.",
          p: /Reaction/i,
          viz: "bzca",
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.cpuGS;
        t && ((t.F = e.F), (t.k = e.K), t.step(12));
        let n = e.kin || [];
        return {
          gs: t,
          F: e.F,
          K: e.K,
          kin: n,
          ex: e.ex,
          mz: e.mz,
          app:
            e.mode === "gs"
              ? `MODE: Gray–Scott morphogenesis (GPU, 256²)
preset: ${e.preset}
F = ${e.F.toFixed(4)}  k = ${e.K.toFixed(4)}
steps: ${e.gsSteps}${e.gpuOK ? "" : "  (GPU unavailable)"}`
              : e.mode === "bz"
                ? `MODE: BZ wave maze solver
maze ${e.mz.W}×${e.mz.H} · wave t = ${e.ex ? e.ex.t : 0}`
                : `MODE: DNA AND gate
${n.map((s) => `A=${s.a} B=${s.b} → ${(s.frac * 100).toFixed(0)} %`).join(`
`)}`,
          os: `${Un()(i)}
light table ON · camera 30 fps
pumps: gate 2 µL/min, A ${n[3] ? "ON" : "—"}, B ${n[3] ? "ON" : "—"}
incubation: 25 °C`,
          isa: `U + 2V → 3V        (rate 1)
V → P              (rate F + k)
∅ → U              (feed F)
A + G → GI         k₁ = 5×10⁵ /M/s
B + GI → O         k₂ = 5×10⁵ /M/s
O + Rep → F*       k_r = 10⁶ /M/s
rest → excited → refractory → rest`,
        };
      },
    },
    turing: {
      hw: [
        {
          t: "Conceptual model, not a historical device. Turing (1936) defined the machine as mathematics: a finite control, a read/write head and an unbounded tape of squares. Nothing like this was built for the paper; the rendering shows its parts.",
          p: /tape|head|finite control|table|base/i,
          viz: "spec",
        },
        {
          t: "Modules: the tape (input, scratch memory and output in one), the head carriage, the finite control (state register + rule lookup) and the transition table, which IS the program. Turing's point: the control is finite, and all unbounded memory is on the tape.",
          p: /tape \(|head|finite control|transition table/i,
          viz: "modules",
        },
        {
          t: "Devices: a square holds exactly one symbol from a finite alphabet; the head sees exactly one square; the state register holds one of finitely many m-configurations; the halt lamp shows whether the machine stopped. Turing justified these limits by what a human clerk with pencil and paper can do.",
          p: /tape \(|head|state register|lamp|reel/i,
          viz: "tape",
          mode: "devices",
        },
        {
          t: "Logic: the finite control drawn as a state diagram. Each arrow is one rule (read → write, move); the lit arrow is the rule that just fired. A deterministic machine has at most one arrow per (state, symbol). Halting means reaching a state with no way out, and deciding that in general is the halting problem.",
          p: /state register|rule-lookup|transition table/i,
          viz: "tmstate",
        },
        {
          t: "Physics: deliberately none. Symbols are ideal marks, steps are discrete and noiseless, and the tape never runs out. Every real machine in this lab (plates, valves, transistors, spins) approximates this ideal with noise margins and finite memory. Physical Church–Turing thesis: no physical process computes beyond it.",
          p: /tape \(|reel/i,
          viz: "tape",
          mode: "ideal",
        },
      ],
      sw: [
        {
          t: "The program: the transition table. Edit it as text or in the grid; the tape holds the input.",
          p: /transition table/i,
          viz: "app",
        },
        {
          t: "No operating system: the operator writes the input on the tape and starts the machine in its initial state. Turing's universal machine U plays the role of an interpreter: given another machine's description on the tape, U carries out its steps.",
          p: /tape \(|state register/i,
          viz: "os",
        },
        {
          t: "ISA: there is just one kind of instruction, the quintuple (state, read) → (write, move, next state). Live: the instruction about to execute and the one just executed. Turing showed this is enough for any computation (Church–Turing thesis).",
          p: /rule-lookup|transition table/i,
          viz: "isa",
        },
        {
          t: "“Bits”: Turing encoded any whole machine as a string over A C D L R N ; and then as a single integer, its description number. Machines become data that another machine can read: the stored-program idea.",
          p: /tape \(/i,
          viz: "tmsd",
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.rule(),
          n = e.standardDescription();
        return {
          app: kn(i, 18),
          os: `${Un()(i)}${e.halted ? " · HALTED: " + e.reason : ""}
state ${e.state} · step ${e.steps} · head at ${e.head}
tape: ${e.str().slice(0, 60) || "(blank)"}
1s on tape: ${e.count("1")} · squares used ${e.maxX - e.minX + 1}`,
          isa: `next:  (${e.state}, ${e.read()}) → ${t ? `(${t.w}, ${t.mv}, ${t.nx})` : "no rule: machine stops"}
last:  ${e.last ? `(${e.last.from}, ${e.last.s}) → (${e.last.w}, ${e.last.mv}, ${e.last.nx})` : "—"}
rules ${e.p.rules.size} · states ${e.p.states.length} · alphabet {${e.p.symbols.join(" ")}}
writes ${e.writes} · moves ${e.moves}`,
          tm: e,
          sd: n,
          act: i.isRunning() ? 1 : 0.2,
        };
      },
    },
    z1: {
      hw: [
        {
          t: "Konrad Zuse's Z1 (1936–38), as rebuilt 1984–89: about 20,000 parts and about 1 tonne. The memory half (with the film reader) and the processor half (with keyboard and display) sit on one frame, synchronised by a shaft, all driven by one small electric motor.",
          p: /memory|processor|reader|table frame|motor/i,
          viz: "spec",
        },
        {
          t: "Modules: mechanical memory (3 banks × 8 layers, 64 words on the replica), punched-film reader, decoder/microsequencer, exponent unit, mantissa unit, decimal keyboard, decimal display, and the cycling units with the lever “underworld” below.",
          p: /memory|reader|processor|keyboard|display|cycling/i,
          viz: "modules",
        },
        {
          t: "Devices: no relays and no tubes. The elements are thin steel plates that slide between two positions (0/1), pins and rods coupling plates in different layers, and levers carrying the clock. Rojas estimates about 6,000 binary gates.",
          p: /bit plates|memory|lever|cycling|film/i,
          viz: "chip",
        },
        {
          t: "Logic: Zuse's “mechanical relay”: a control plate lets the actor plate's motion through (1) or not (0). Chained relays make AND, OR, NOT and XOR. Each gate turns the motion by 90°, so one cycle has four engagements: IV loads the operands, I forms partial sums, II the carries, III the result. Live: the top 8 mantissa bits (hidden 1 first) of R1 and R2.",
          p: /bit plates|processor/i,
          viz: "plates",
          mode: "logic",
        },
        {
          t: "Physics: computation is motion. Plates slide on each other with friction and play, and long chains of steel sheets bend under load. That limited the clock to a few hertz (4 Hz target, about 1 Hz on the replica) and is why the reconstruction is rarely operational.",
          p: /bit plates|lever|cycling/i,
          viz: "plates",
          mode: "physics",
        },
      ],
      sw: [
        {
          t: "The program: a straight sequence of instructions punched in film. There are no jumps and no conditionals, so loops need a film ring.",
          p: /film|reader/i,
          viz: "app",
        },
        {
          t: "No operating system: the operator loads the film, starts the motor, types numbers when Lu stops the machine, and reads results when Ld stops it.",
          p: /keyboard|display|motor/i,
          viz: "os",
        },
        {
          t: "ISA (8 instructions): Lu input, Ld output, Pr z load, Ps z store, Ls1 add, Ls2 subtract, Lm multiply, Li divide. Each one is a microprogram of 1–21 cycles: load and store take 1, add 5, subtract 6, multiply ≈20, divide 21. Square root (Lw) came only with the Z3.",
          p: /processor|reader/i,
          viz: "isa",
        },
        {
          t: "Bits: binary floating point, decades before IEEE 754. Sign + 7-bit two's-complement exponent + mantissa with an implied leading 1 (24 bits on the reconstruction per Rojas; older sources give 22 bits). Below: R1 as stored and the current film row.",
          p: /memory|film/i,
          viz: "z1word",
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.cur || e.prog[e.pc] || null,
          n = e.R1 && !e.R1.zero ? e.R1 : null,
          s = e.R2 && !e.R2.zero ? e.R2 : null,
          r = (a) => (a ? Math.floor(a.m / 2 ** (e.F - 7)) & 255 : 0),
          o = (a) =>
            a ? (a.zero ? "0 (!)" : (+a.value().toPrecision(6)).toString()) : "—";
        return {
          app: kn(i, 18),
          os: `${Un()(i)} · ${e.state}
film row ${e.pc}/${e.prog.length} · cycles ${e.cycles} (= ${e.cycles} s at 1 Hz)
keyboard queue: ${e.inq.join(", ") || "(empty: operator must type)"}
display: ${e.lastOut ? e.lastOut.text : "—"}`,
          isa: `${
            t
              ? `${t.src.padEnd(8)} code ${t.code.toString(2).padStart(8, "0")}  cycle ${e.cur ? e.cyc : 0}/${jn[t.op].cyc}
${jn[t.op].d}`
              : "end of film"
          }
R1 = ${o(e.R1)}   R2 = ${o(e.R2)}
instructions done ${e.done}${
            e.flag
              ? `
⚠ ` + e.flag
              : ""
          }`,
          w: n ? n.bits() : null,
          F: e.F,
          wlabel: `R1 = ${o(e.R1)}`,
          code: t ? t.code : null,
          op: t ? t.src : "",
          a: r(n),
          b: r(s),
          phase: (e.cycles % 4) / 4 + ((performance.now() / 1e3) % 1) / 4,
          act: i.isRunning() ? 1 : 0.2,
        };
      },
    },
    analog: {
      hw: [
        {
          t: "A cabinet of DC amplifiers, a patch bay, coefficient pots, an oscilloscope and an X-Y plotter. The whole machine is one physical model of the equation: every variable is a voltage that exists at all times.",
          p: /patch|plotter|oscillo|cabinet/i,
          viz: "spec",
        },
        {
          t: "Modules: the patch bay (the program), the amplifier bay (computing elements), the potentiometer panel (coefficients), and the regulated ±100 V reference supply. The reference voltage IS the unit of the machine: “1.0” means 100 V.",
          p: /patch|amplifier|potentiometer|supply/i,
          viz: "modules",
        },
        {
          t: "Devices: vacuum-tube DC amplifiers with very high open-loop gain, precision wire-wound potentiometers, and low-leakage integrating capacitors. A capacitor's leakage directly becomes integration error, so polystyrene/mica dielectrics were prized.",
          p: /amplifier|capacitor|potentiometer/i,
          viz: "chip",
        },
        {
          t: "Circuit: the inverting integrator. With feedback capacitor C and input resistor R, the op-amp holds its input at virtual ground, so the input current V/R charges C: Vout = −(1/RC)∫Vin dt. Two integrators in a loop plus a summer solve a second-order ODE. The trace below is your patch's first integrator, live.",
          p: /amplifier|capacitor/i,
          viz: "opamp",
        },
        {
          t: "Physics: thermionic emission. A heated cathode boils off electrons; a small grid voltage controls a large plate current. That is gain, and gain + feedback = precise arithmetic. The electron flow below is modulated by the live integrator voltage.",
          p: /amplifier/i,
          viz: "triode",
        },
      ],
      sw: [
        {
          t: "The program is the patch: which outputs are wired to which inputs, with which coefficients. Your text patch is compiled into that wiring.",
          p: /patch/i,
          viz: "app",
        },
        {
          t: "There is no operating system. The operator drives the machine through modes: RESET/IC (charge integrators to initial conditions), OPERATE (compute), HOLD (freeze all integrators to read values).",
          p: /patch|potentiometer/i,
          viz: "os",
        },
        {
          t: "No instruction set: the “ISA” is the catalogue of computing elements: integrator, summer, coefficient pot, multiplier, function generator. Below: the elements your patch compiles to and their live outputs.",
          p: /amplifier|potentiometer/i,
          viz: "isa",
        },
        {
          t: "No bits at all. Every quantity is a continuous voltage scaled to the ±100 V reference. Precision was ~0.1 % of full scale (≈10 bits), but the bandwidth was continuous: all elements compute simultaneously.",
          p: /oscillo|plotter/i,
          viz: "wave",
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.patch,
          n = t ? t.ints.map((o) => o.name) : [],
          s = t ? t.outs.map((o) => o.name) : [],
          r = n.length ? e.S[n[0]] : 0;
        return {
          app: kn(i),
          os: `mode: ${i.isRunning() ? "OPERATE" : "HOLD"}
machine time t = ${e.t.toFixed(3)} s
overloads: ${[...e.overload].join(", ") || "none"}`,
          isa: [
            ...n.map((o) => `INTEGRATOR  ${o.padEnd(8)} = ${(+e.S[o]).toFixed(4)}`),
            ...s.map((o) => `SUMMER/MUL  ${o.padEnd(8)} = ${(+e.S[o]).toFixed(4)}`),
            ...(t
              ? t.params.map(
                  (o) => `COEFF POT   ${o.name.padEnd(8)} = ${(+e.S[o.name]).toFixed(3)}`,
                )
              : []),
          ].join(`
`),
          volt: r,
          vname: n[0] || "—",
          vmax: 1.2,
          unit: "×100 V",
          act: Math.min(1, Math.abs(r)),
        };
      },
    },
    tube: {
      hw: [
        {
          t: "EDSAC-class: racks of valve chassis, a mercury delay-line store, an operator console with monitor CRTs, a paper-tape reader and a teleprinter. EDSAC (Cambridge, 1949) used ~3,000 valves and drew ~12 kW.",
          p: /rack|store|console|teleprinter|tape/i,
          viz: "spec",
        },
        {
          t: "Modules: plug-in valve chassis grouped into racks (control, arithmetic, store electronics), the temperature-controlled mercury tanks, and the power supply & distribution.",
          p: /rack|store|power/i,
          viz: "modules",
        },
        {
          t: "Devices: thermionic valves (vacuum tubes) used as switches, and mercury delay lines: a steel tube ~1.5 m long with quartz piezo crystals at each end turning electrical pulses into sound and back.",
          p: /store|rack/i,
          viz: "chip",
        },
        {
          t: "Circuit: a serial full adder. EDSAC was bit-serial: one adder processes one bit per clock pulse (2 µs at 500 kHz), least-significant bit first, the carry held over to the next pulse. Live inputs: the accumulator and the word being added.",
          p: /rack/i,
          viz: "adder",
          serial: !0,
        },
        {
          t: "Physics: memory is SOUND. Bits travel as ultrasonic pulses through mercury (~1,450 m/s), so a tank holds a train of words that comes round every ~1 ms. The CPU must wait for the word it wants to emerge: the minor-cycle wait shown in the sim.",
          p: /store/i,
          viz: "mercury",
        },
      ],
      sw: [
        {
          t: "The program: orders punched on paper tape and read in by the tape reader.",
          p: /tape/i,
          viz: "app",
        },
        {
          t: "Monitor: the “Initial Orders” (David Wheeler, 1949), a bootstrap wired into the machine that read the tape, converted letters and decimal addresses into binary orders and stored them: the first assembler/loader.",
          p: /tape|console/i,
          viz: "os",
        },
        {
          t: "ISA: single-address orders (A add, S subtract, H load multiplier, V multiply, T store & clear, U store, C collate, R/L shift, E/G conditional jumps, O print, Z stop). Live registers below.",
          p: /rack|console/i,
          viz: "isa",
        },
        {
          t: "Bits: words are trains of pulses on the delay line, one bit every 2 µs. The order being executed, shown as the pulse train it really was.",
          p: /store/i,
          viz: "bits",
          levels: ["no pulse", "pulse"],
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.mem[e.pc] || 0,
          n = vc(t);
        return {
          app: kn(i),
          os: `${Un()(i)}
orders executed: ${e.steps}
minor cycles: ${e.minor} (waited ${e.waited} on the delay line)
output so far: ${(e.out || []).join("").slice(-80)}`,
          isa: `SCR (PC)  ${String(e.pc).padStart(4)}
ACC       ${e.acc}
R (mult)  ${e.R}
ORDER     ${n.op} ${n.n}
WAIT      ${e.waited} minor cycles total`,
          word: { v: t, bits: 17, label: `order at ${e.pc}: ${n.op} ${n.n}` },
          a: e.acc & 65535,
          b: e.mem[n.n] & 65535,
          wbits: 17,
          act: e.phase ? e.phase() / 32 : 0,
        };
      },
    },
    pdp8: {
      hw: [
        {
          t: "PDP-8 (1965): a minicomputer for $18,000 drawing 780 W, with a front panel of lamps and switches and an ASR-33 Teletype.",
          p: /cabinet|panel|teletype|switch register|lamp/i,
          viz: "spec",
        },
        {
          t: "Modules: ~230 Flip-Chip logic cards plugged into a semi-automatically wire-wrapped backplane, the core memory stack, and the power supply.",
          p: /card cage|backplane|core|power/i,
          viz: "modules",
        },
        {
          t: "Devices: discrete transistors and diodes (diode-transistor logic): about 1,409 transistors and 10,148 diodes in the whole CPU. Memory: 4,096 × 12 tiny ferrite rings threaded by wires.",
          p: /card cage|core/i,
          viz: "chip",
        },
        {
          t: "Circuit: the 12-bit accumulator adder used by TAD (two's-complement add) with the Link as carry out. Each AC bit was a 2-transistor flip-flop surrounded by diode-capacitor-diode gates. Live: AC + the memory buffer.",
          p: /card cage|backplane/i,
          viz: "adder",
        },
        {
          t: "Physics: magnetic hysteresis. A core is magnetised clockwise (1) or counter-clockwise (0). Coincident-current selection: X and Y wires each carry HALF the switching current, so only the core at their crossing flips. Reading is destructive (the core is forced to 0 and the sense wire sees a pulse if it was 1), so every read is followed by a write-back. That is why the 1.5 µs cycle has read and write halves.",
          p: /core/i,
          viz: "core",
        },
      ],
      sw: [
        {
          t: "Program: PAL-8 assembly, assembled and deposited into core.",
          p: /panel|core/i,
          viz: "app",
        },
        {
          t: "No OS at power-up: you toggled the RIM loader in through the front-panel switches, which read the BIN loader from paper tape, which loaded the program. Later DEC shipped OS/8.",
          p: /switch|key|teletype/i,
          viz: "os",
        },
        {
          t: "ISA: 8 opcodes in 3 bits (AND TAD ISZ DCA JMS JMP IOT OPR), 1 indirect bit, 1 page bit and 7 address bits. OPR micro-instructions combine CLA, CMA, IAC, RAL… in one word. Live registers below.",
          p: /panel|card/i,
          viz: "isa",
        },
        {
          t: "Bits: 12-bit words. DEC Flip-Chip logic used ground and −3 V as its two levels. Live: the accumulator.",
          p: /lamp|panel/i,
          viz: "bits",
          levels: ["0 V", "−3 V"],
        },
      ],
      probe(i) {
        let e = i.sim;
        return {
          app: kn(i),
          os: `${Un()(i)}  ·  ${e.halted ? "HALTED" : ""}
instructions: ${e.instr}   memory cycles: ${e.cycles}
teletype: ${(e.tty || "").slice(-60)}`,
          isa: `PC ${ds(e.pc)}   AC ${ds(e.ac)}   L ${e.l}
IR ${ds(e.ir, 1)}   MA ${ds(e.ma)}   MB ${ds(e.mb)}
next: ${yc(e.mem[e.pc], e.pc)}`,
          word: { v: e.ac, bits: 12, label: "AC (octal " + ds(e.ac) + ")" },
          a: e.ac,
          b: e.mb,
          wbits: 12,
          coreBit: e.mb & 1,
          coreAddr: e.ma,
          act: 0.5,
        };
      },
    },
    altair: {
      hw: [
        {
          t: "Altair 8800 (1975): $439 as a kit or $621 assembled. A blue-and-white front panel of LEDs and toggle switches, 256 bytes of RAM as shipped, and a serial terminal on the 2SIO card.",
          p: /front panel|terminal|top cover|LED/i,
          viz: "spec",
        },
        {
          t: "Boards: the S-100 motherboard (a passive 100-pin bus backplane), the CPU card, RAM card(s), the 88-2SIO serial card, and a big linear power supply.",
          p: /S-100|supply|panel/i,
          viz: "modules",
        },
        {
          t: "Chips: Intel 8080 (≈6,000 NMOS transistors, 2 MHz), 2102 1-Kbit static RAMs, 74-series TTL bus drivers and latches, and an ACIA for serial I/O.",
          p: /S-100|LED/i,
          viz: "chip",
        },
        {
          t: "Circuit: the 8080's 8-bit ALU, an adder with carry and auxiliary carry (for DAA decimal adjust). Live: register A plus the operand on the data bus.",
          p: /S-100/i,
          viz: "adder",
        },
        {
          t: "Physics: the MOSFET. A positive gate voltage pulls electrons into a thin inversion channel under the gate oxide, connecting source to drain. NMOS chips like the 8080 are built from thousands of these switches. Channel conduction follows the live data-bus bit.",
          p: /S-100/i,
          viz: "mosfet",
          node: "6 µm NMOS",
        },
      ],
      sw: [
        {
          t: "Program: 8080 assembly, assembled into RAM. The classic was “Kill the Bit” played on the address LEDs.",
          p: /LED|panel/i,
          viz: "app",
        },
        {
          t: "No OS: you DEPOSIT bytes with the switches and press RUN. In 1975 Micro-Soft (Gates & Allen) shipped Altair BASIC, its first product; CP/M followed.",
          p: /control|panel/i,
          viz: "os",
        },
        {
          t: "ISA: Intel 8080: registers A B C D E H L, SP, PC, flags S Z AC P CY; memory via HL; IN/OUT ports. Live registers and the instruction about to execute.",
          p: /S-100/i,
          viz: "isa",
        },
        {
          t: "Bits: the 16-bit address bus and 8-bit data bus exactly as the front-panel LEDs show them, at TTL levels (0 V / +5 V; the 8080 itself also needed +12 V and −5 V supplies).",
          p: /LED/i,
          viz: "bits",
          levels: ["0 V", "+5 V"],
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.r,
          n = i.bus(),
          s = e.f;
        return {
          app: kn(i),
          os: `${Un()(i)}${e.halted ? " · HLT" : ""}
last bus cycle: ${n.t === "w" ? "WRITE" : "READ"} ${At(n.a, 4)}h = ${At(n.d)}h`,
          isa: `A ${At(t[7])}  B ${At(t[0])}  C ${At(t[1])}  D ${At(t[2])}  E ${At(t[3])}  H ${At(t[4])}  L ${At(t[5])}
SP ${At(e.sp, 4)}  PC ${At(e.pc, 4)}  flags S${(s >> 7) & 1} Z${(s >> 6) & 1} AC${(s >> 4) & 1} P${(s >> 2) & 1} CY${s & 1}
opcode at PC: ${At(e.mem[e.pc])}h ${At(e.mem[(e.pc + 1) & 65535])}h ${At(e.mem[(e.pc + 2) & 65535])}h`,
          word: {
            v: (n.a << 8) | n.d,
            bits: 24,
            label: `A15–A0 ${At(n.a, 4)}h · D7–D0 ${At(n.d)}h`,
            split: 16,
          },
          a: t[7],
          b: n.d,
          wbits: 8,
          gate: n.d & 1,
          act: 0.6,
        };
      },
    },
    home80: {
      hw: [
        {
          t: "Commodore 64-class (1982, $595): the brown “breadbin”, a 1702-style colour monitor and a 1541 floppy drive. ~12–17 million C64s were sold; it's the best-selling single computer model.",
          p: /breadbin|monitor|1541|keyboard/i,
          viz: "spec",
        },
        {
          t: "Boards: one motherboard carries everything: CPU, video, sound, I/O chips, 8 DRAMs, ROMs, and the cartridge/user/A-V ports.",
          p: /motherboard|DRAM|ports/i,
          viz: "modules",
        },
        {
          t: "Chips: MOS 6510 CPU (a 6502 + I/O port; the 6502 has about 3,510 transistors), VIC-II video, SID 6581 synthesiser, two CIA 6526 I/O chips, eight 4164 64-Kbit DRAMs, and BASIC/KERNAL/character ROMs.",
          p: /motherboard|DRAM/i,
          viz: "chip",
        },
        {
          t: "Circuit: the 6502 ALU adding A + operand + carry (ADC), with decimal-mode correction when the D flag is set. Live from the emulator.",
          p: /motherboard/i,
          viz: "adder",
        },
        {
          t: "Physics: the DRAM cell, one transistor and one tiny capacitor. A bit is a few hundred thousand electrons, and they leak away within milliseconds, so every row must be refreshed constantly (on the C64 the VIC-II does it). Reading discharges the cell and a sense amplifier restores it.",
          p: /DRAM/i,
          viz: "dram",
        },
      ],
      sw: [
        {
          t: "Program: Commodore BASIC V2, typed on the screen or edited in the panel. Also a 6502 assembly program you can SYS into.",
          p: /monitor|keyboard/i,
          viz: "app",
        },
        {
          t: "OS: the 8 KB KERNAL ROM (screen editor, keyboard scan, serial bus to the 1541) plus the 8 KB Microsoft BASIC ROM. No processes or protection: BASIC, your program and the screen all share one 64 KB address space.",
          p: /motherboard/i,
          viz: "os",
        },
        {
          t: "ISA: 6502: A, X, Y, stack pointer S (page 1), status P (N V B D I Z C), 16-bit PC; 56 instructions, 151 opcodes, 13 addressing modes. Live registers below.",
          p: /motherboard/i,
          viz: "isa",
        },
        {
          t: "Bits: the accumulator and the byte at screen RAM $0400 (what POKE 1024 changes), 5 V NMOS logic levels.",
          p: /DRAM|monitor/i,
          viz: "bits",
          levels: ["0 V", "+5 V"],
        },
      ],
      probe(i) {
        let { cpu: e, basic: t, mem: n } = i.sim,
          s = e.p;
        return {
          app: kn(i),
          os: `BASIC state: ${t.state}
program lines: ${t.lines.size}
border colour ($D020) ${n[53280] & 15}, background ($D021) ${n[53281] & 15}`,
          isa: `A ${At(e.a)}  X ${At(e.x)}  Y ${At(e.y)}  S ${At(e.sp)}  PC ${At(e.pc, 4)}
P  N${(s >> 7) & 1} V${(s >> 6) & 1} -  B${(s >> 4) & 1} D${(s >> 3) & 1} I${(s >> 2) & 1} Z${(s >> 1) & 1} C${s & 1}
opcode at PC: ${At(n[e.pc])} ${At(n[(e.pc + 1) & 65535])} ${At(n[(e.pc + 2) & 65535])}`,
          word: {
            v: (e.a << 8) | n[1024],
            bits: 16,
            label: `A = ${At(e.a)}  ·  $0400 = ${At(n[1024])}`,
            split: 8,
          },
          a: e.a,
          b: n[1024],
          wbits: 8,
          cell: n[1024] & 1,
          act: 0.5,
        };
      },
    },
    pc90: {
      hw: [
        {
          t: 'A 1990s IBM-compatible: a beige desktop case, a 14" VGA CRT and a clicky keyboard. A 486DX2-66 (1992) ran at 66 MHz inside, 33 MHz on the bus (clock doubling).',
          p: /case|monitor|keyboard|bezel/i,
          viz: "spec",
        },
        {
          t: "Boards: Baby-AT motherboard with ISA (16-bit, 8 MHz) and the new PCI (32-bit, 33 MHz, 133 MB/s) slots, a PCI VGA card, an ISA Sound Blaster, IDE hard disk, floppy and CD-ROM, and an AT PSU.",
          p: /motherboard|slot|card|disk|drive|power supply/i,
          viz: "modules",
        },
        {
          t: "Chips: the 486 (≈1.2 million transistors, 8 KB on-chip cache, built-in FPU), 256 KB L2 SRAM, the chipset, a BIOS EPROM, 72-pin SIMMs, and the VGA chip.",
          p: /486|SRAM|chipset|BIOS|CMOS/i,
          viz: "chip",
        },
        {
          t: "Circuit: CMOS logic. Every gate is a complementary pair: PMOS pulls the output up, NMOS pulls it down, and only one conducts at a time, so static power is nearly zero. Below: a live CMOS NAND driven by bits of the last disk byte.",
          p: /486|chipset/i,
          viz: "cmos",
        },
        {
          t: "Physics: magnetic recording. The HDD head flies nanometres above a platter spinning at 3,600 RPM and writes tiny magnetised domains; reading senses flux reversals. Access time = seek + rotational latency. Live: the head follows the simulator's real disk accesses.",
          p: /hard disk|IDE/i,
          viz: "disk",
        },
      ],
      sw: [
        {
          t: "Application: commands typed at the DOS prompt (DIR, TYPE, COPY, ECHO…).",
          p: /monitor|keyboard/i,
          viz: "app",
        },
        {
          t: "OS: MS-DOS-style COMMAND.COM over a FAT16-style filesystem: boot sector, two FATs, root directory, cluster chains. SMARTDRV caches sectors in RAM.",
          p: /hard disk|SIMM|486/i,
          viz: "os",
        },
        {
          t: "ISA level: x86 real mode. Honest note: this lab emulates the machine at the DOS/BIOS service level, not individual x86 instructions. Each file operation turns into BIOS INT 13h-style sector reads/writes addressed by cylinder/head/sector, listed live below.",
          p: /486|IDE|disk/i,
          viz: "isa",
        },
        {
          t: "Bits: the bytes of the boot sector as stored on the platter (0x55AA signature at the end), 5 V TTL/CMOS logic on the ISA bus.",
          p: /hard disk/i,
          viz: "bits",
          levels: ["0 V", "+5 V"],
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.disk,
          n = t.log
            .slice(-8)
            .map(
              (a) =>
                `${a.w ? "WRITE" : "READ "} LBA ${String(a.lba).padStart(4)}  C/H/S ${t.chs(a.lba).c}/${t.chs(a.lba).h}/${t.chs(a.lba).s + 1}`,
            ).join(`
`),
          s = t.data,
          r = t.log.length ? t.log[t.log.length - 1].lba : 0,
          o = t.data[r * 512] | 0;
        return {
          app: kn(i) || "type at the C:\\> prompt",
          os: `prompt: ${e.prompt()}
free clusters: ${e.fs.freeClusters()}
disk reads ${t.reads} · writes ${t.writes} · busy ${t.timeMs.toFixed(0)} ms
SMARTDRV ${t.cacheOn ? "ON" : "OFF"}`,
          isa:
            `INT 13h-style sector requests (most recent last):
` + (n || "(none yet)"),
          word: {
            v: (s[510] << 8) | s[511],
            bits: 16,
            label:
              "boot-sector signature bytes 510–511 = " + At(s[510]) + " " + At(s[511]),
            split: 8,
          },
          a: o & 1,
          b: (o >> 1) & 1,
          head: t.cyl / 40,
          act: 0.5,
        };
      },
    },
    pc00: {
      hw: [
        {
          t: "A 2000s ATX tower. The “gigahertz war”: Pentium 4 Northwood reached 3.06 GHz in 2002 (55 million transistors, 130 nm), while AMD's Athlon 64 (2003, 105.9 million) won on work per clock.",
          p: /side|bezel|top|rear/i,
          viz: "spec",
        },
        {
          t: "Boards: ATX motherboard with northbridge (memory + AGP) and southbridge (I/O), an AGP 8× graphics card, DDR DIMMs, SATA/PATA drives and a 400 W PSU.",
          p: /motherboard|AGP|bridge|drive|disk|power/i,
          viz: "modules",
        },
        {
          t: "Chips: the CPU die (pipeline, L1/L2 caches, branch predictor), northbridge, southbridge and DDR SDRAM chips. Athlon 64 moved the memory controller onto the CPU die, cutting DRAM latency.",
          p: /CPU|bridge|heatsink/i,
          viz: "chip",
        },
        {
          t: "Circuit: the pipeline. Latches between stages let a new instruction enter every cycle. Deeper pipelines (P4: 20 stages) allow higher clocks but cost more cycles on a branch mispredict. Live: instructions flowing through the stages of the current microarchitecture.",
          p: /CPU/i,
          viz: "pipeline",
        },
        {
          t: "Physics: switching power P ≈ α·C·V²·f. Each clock edge charges and discharges every switching gate's capacitance. Doubling f doubles power, and higher f needs higher V, so power grows roughly with f³. This “power wall” ended the GHz race around 3–4 GHz. Live: the selected clock.",
          p: /CPU|heatsink|fan/i,
          viz: "power",
        },
      ],
      sw: [
        {
          t: "Application: the workload program (a tiny RISC-like ISA, executed for real).",
          p: /CPU/i,
          viz: "app",
        },
        {
          t: "OS era: Windows XP (2001) and Linux 2.4/2.6. Hyper-Threading (P4, 2002) made one core appear as two logical CPUs to the OS scheduler.",
          p: /CPU|bridge/i,
          viz: "os",
        },
        {
          t: "ISA → micro-ops: x86 instructions are decoded into RISC-like µops; the P4 cached decoded µops in its trace cache. Live: recently retired instructions with their stall cycles and causes.",
          p: /CPU/i,
          viz: "isa",
        },
        {
          t: "Bits: a 32-bit architectural register, live. Core voltage was ~1.5 V for Northwood, much lower than the 5 V of the 486 era.",
          p: /CPU|DIMM|RAM/i,
          viz: "bits",
          levels: ["0 V", "~1.5 V"],
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.recent
            .slice(-8)
            .map(
              (n) =>
                `${String(n.pc).padStart(3)}  ${n.src.padEnd(22).slice(0, 22)} +${n.stall}${n.kind ? " " + n.kind : ""}${n.note ? " (" + n.note + ")" : ""}`,
            ).join(`
`);
        return {
          app: kn(i),
          os: `${Un()(i)}
${e.cfg.name || ""}  ${e.cfg.ghz} GHz, ${e.cfg.depth}-stage pipeline`,
          isa:
            `cycles ${e.cycles}  instr ${e.instr}  IPC ${e.ipc.toFixed(3)}
stalls: branch ${e.stall.branch} · memory ${e.stall.mem} · hazard ${e.stall.hazard}
` + t,
          word: {
            v: (e.R && e.R[1]) >>> 0,
            bits: 32,
            label: "register r1 = " + ((e.R && e.R[1]) | 0),
          },
          recent: e.recent,
          depth: e.cfg.depth,
          ghz: e.cfg.ghz,
          act: 0.6,
        };
      },
    },
    pc10: {
      hw: [
        {
          t: "A 2010s tempered-glass tower. Core i7-4770K (Haswell, 2013): 4 cores / 8 threads, 3.5 GHz (3.9 turbo), 84 W TDP, ~1.4 billion transistors on 22 nm, launch price $339.",
          p: /glass|panel|top|front/i,
          viz: "spec",
        },
        {
          t: "Boards: Z87 motherboard (LGA1150), a PCIe 3.0 ×16 graphics card, a SATA SSD, a semi-modular PSU and front intake fans.",
          p: /motherboard|PCIe|graphics|SSD|PSU|fan/i,
          viz: "modules",
        },
        {
          t: "Chips: one die with 4 cores, a ring bus, 8 MB shared L3, an integrated GPU and memory controller; the PCH chipset handles SATA/USB.",
          p: /CPU|PCH|cooler/i,
          viz: "chip",
        },
        {
          t: "Circuit: simultaneous multithreading. Each core keeps TWO architectural register sets and interleaves two threads' µops into one set of execution units. Throughput per thread drops but total throughput rises (~20–30 %). Live: which task each hardware thread is running.",
          p: /CPU/i,
          viz: "smt",
        },
        {
          t: "Physics: FinFET (Intel “Tri-Gate”, 22 nm, 2011). The channel is a vertical fin with the gate wrapped round three sides, so the gate controls it far better and leakage drops at low voltage.",
          p: /CPU/i,
          viz: "mosfet",
          fin: !0,
          node: "22 nm FinFET",
        },
      ],
      sw: [
        {
          t: "Application: the task set (browser, game, compile…) with CPU bursts and I/O waits.",
          p: /CPU|SSD/i,
          viz: "app",
        },
        {
          t: "OS: the scheduler is the real computer here. Linux CFS picks the task with the smallest virtual runtime (kept in a red-black tree), weighting by nice level. Live run state below.",
          p: /CPU/i,
          viz: "os",
        },
        {
          t: "ISA: x86-64 with SSE/AVX2. Each hardware thread is a full architectural x86-64 CPU to the OS: its own registers, its own instruction pointer.",
          p: /CPU/i,
          viz: "isa",
        },
        {
          t: "Bits: the scheduler clock in milliseconds as a 32-bit integer; core voltage ~1.0–1.2 V under turbo.",
          p: /CPU/i,
          viz: "bits",
          levels: ["0 V", "~1.1 V"],
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.hw || [],
          n = t.map(
            (s, r) =>
              `HW thread ${r} (core ${s.core}): ${s.task ? e.T[s.task.id ?? s.task]?.name || s.task.name || "task" : "idle"}`,
          ).join(`
`);
        return {
          app: kn(i),
          os:
            `${Un()(i)}  t = ${e.t} ms  context switches ${e.switches}
` +
            (e.T || []).map(
              (s) =>
                `${(s.name || "").padEnd(10)} ${s.state.padEnd(8)} vruntime ${(+s.vr || 0).toFixed(1)}`,
            ).join(`
`),
          isa: n,
          word: {
            v: e.t >>> 0,
            bits: 32,
            label: "scheduler time = " + e.t + " ms",
          },
          hw: t,
          tasks: e.T,
          act: 0.6,
        };
      },
    },
    pc20: {
      hw: [
        {
          t: 'A 2020s mini-ITX dual-engine workstation with a 27" 4K IPS monitor and 65% mechanical RGB keyboard. Reference parts: Ryzen 9 7950X (16 cores, 5 nm CCDs + 6 nm I/O die, running our live RV32IM 5-stage CPU + L1/L2 caches) and an RTX 4070-class GPU (AD104: 35.8B transistors, running your live WebGL2 GLSL shader across 262,144 pixels).',
          p: /glass|top|front|monitor|keyboard|mouse/i,
          viz: "spec",
        },
        {
          t: "Boards: 10-layer mini-ITX AM5 motherboard with 12-phase VRM, triple-slot graphics card, DDR5-6000 DIMMs, M.2 NVMe Gen5 SSD (holding Mini-OS files) and 850 W SFX-L PSU.",
          p: /motherboard|graphics|NVMe|SFX|DDR5/i,
          viz: "modules",
        },
        {
          t: "Chips: chiplets. Two 5 nm CCD silicon dies (16 cores glowing with RV32IM instruction heat) plus a 6 nm I/O die linked by Infinity Fabric, driving the AD104 GPU die (48 live SMs + GDDR6X) over PCIe 5.0 MMIO.",
          p: /CPU|graphics|cooler|NVMe/i,
          viz: "chip",
        },
        {
          t: "Circuit: SIMT + 5-stage CPU pipeline. While the CPU pipelines IF→ID→EX→MEM→WB with forwarding & branch prediction, the GPU executes warps of 32 threads in lock-step across all 262,144 pixels.",
          p: /graphics|CPU/i,
          viz: "simt",
        },
        {
          t: "Physics: 5 nm-class FinFETs switching at GHz rates. Gates are tens of atoms across, so quantum tunnelling leakage and power density (W/cm²) govern modern chiplet & cooling design.",
          p: /CPU|graphics|cooler/i,
          viz: "mosfet",
          fin: !0,
          node: "5 nm FinFET",
        },
      ],
      sw: [
        {
          t: "Application: your live GLSL ES 3.0 GPU shader + RV32IM co-processor driver streaming orbital uniforms over PCIe MMIO (0x20000000).",
          p: /monitor|graphics|CPU/i,
          viz: "app",
        },
        {
          t: "OS & Driver stack: Mini-OS shell on NVMe SSD + browser → WebGL2 → OS graphics driver scheduling command queues onto the GPU.",
          p: /graphics|motherboard|NVMe|monitor/i,
          viz: "os",
        },
        {
          t: "ISA: dual ISAs working together — RISC-V RV32IM machine words in the 5-stage CPU pipeline + native compiled GPU shader code (PTX/SASS/SPIR-V) on the graphics driver.",
          p: /graphics|CPU/i,
          viz: "isa",
        },
        {
          t: "Bits: one real RGBA8 pixel read back from the GPU framebuffer this frame (32 bits, 8 per channel) at ~1.05 V core logic.",
          p: /graphics|monitor/i,
          viz: "bits",
          levels: ["0 V", "~1.05 V"],
        },
      ],
      probe(i, e) {
        let t = i.sim,
          c = t.cpu,
          n = t.pixel(8320),
          s = "";
        try {
          let r = e.renderer.getContext(),
            o = r.getExtension("WEBGL_debug_renderer_info");
          s = o ? r.getParameter(o.UNMASKED_RENDERER_WEBGL) : r.getParameter(r.RENDERER);
        } catch {}
        return {
          app: kn(i),
          os: `GPU frames shaded: ${t.frame} (${(+t.frameMs || 0).toFixed(1)} ms) · GLSL: ${t.err ? "ERROR" : "OK"}
RV32IM Mini-OS: ${c ? `${c.stats.instret.toLocaleString()} instr · IPC ${c.ipc().toFixed(2)} · L1D ${(c.l1d.hitRate() * 100).toFixed(1)}% · NVMe ops ${c.stats.nvmeOps}` : ""}`,
          isa: `GPU driver: ${s} (${t.err ? t.err.slice(0, 120) : "native GPU code ✓"})
CPU RV32IM: ${c ? `PC=0x${At(c.pc, 4)} IF[${c.pipe.IF.text}] EX[${c.pipe.EX.text}] BP=${(c.bpAccuracy() * 100).toFixed(1)}%` : ""}`,
          word: {
            v: ((n[0] << 24) | (n[1] << 16) | (n[2] << 8) | n[3]) >>> 0,
            bits: 32,
            label: `pixel RGBA = ${n.join(", ")}`,
            split: 8,
          },
          frame: t.frame,
          act: 0.85,
        };
      },
    },
    aibox: {
      hw: [
        {
          t: "DGX Station A100 class (320 GB model, 2021: $149,000): a deskside box with 4 × A100 80 GB, a 64-core EPYC 7742, 512 GB DDR4, up to 1.5 kW from a wall outlet, 2.5 petaFLOPS of AI math. (The real one cools with a sealed refrigerant loop; shown here as a liquid loop.)",
          p: /grille|panel|top|LCD/i,
          viz: "spec",
        },
        {
          t: "Modules: the 4-GPU SXM baseboard, NVLink bridges, the host CPU board with DIMMs, NVMe SSDs, the cooling loop (pump, cold plates, radiator) and the PSUs.",
          p: /baseboard|NVLink|Host|NVMe|Coolant|Pump|Radiator|PSU/i,
          viz: "modules",
        },
        {
          t: "Chips: each A100 is one 54.2-billion-transistor 7 nm die on a silicon interposer next to its HBM2e stacks (CoWoS packaging), giving ~2 TB/s of memory bandwidth per GPU.",
          p: /GPU/i,
          viz: "chip",
        },
        {
          t: "Circuit: the tensor core, a hardware matrix multiply-accumulate array. D = A·B + C on small tiles every clock. Training is mostly these GEMMs. Below: a live tile of YOUR network's weights times an activation vector.",
          p: /GPU/i,
          viz: "mac",
        },
        {
          t: "Physics: heat. A 400 W GPU die of ~8 cm² dissipates ~50 W/cm², several times a stove plate, so the heat must be pulled straight off the die by liquid. Live: die temperature map following GPU utilisation.",
          p: /GPU|Coolant|Radiator/i,
          viz: "heat",
        },
      ],
      sw: [
        {
          t: "Application: a training job (dataset, network shape, optimiser) running live in this page.",
          p: /GPU/i,
          viz: "app",
        },
        {
          t: "OS/software stack: Linux + NVIDIA driver + CUDA + NCCL (collective communications) + a framework (PyTorch/JAX). Data-parallel training: each GPU holds a replica, gets a shard of the batch, and NCCL all-reduces the gradients over NVLink.",
          p: /GPU|NVLink|Host/i,
          viz: "os",
        },
        {
          t: "ISA level: GPU kernels. Each step launches forward GEMMs, backward GEMMs (≈2× forward), the ring all-reduce (reduce-scatter + all-gather), then the optimiser update. Live per-step counts below.",
          p: /GPU|NVLink/i,
          viz: "isa",
        },
        {
          t: "Bits: a live weight from your network as an IEEE-754 float32 (1 sign, 8 exponent, 23 mantissa bits). Tensor cores often use bfloat16, which keeps the 8 exponent bits but only 7 of mantissa.",
          p: /GPU/i,
          viz: "float",
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.model,
          n = t.P,
          s = e.o.batch,
          r = 6 * n * s,
          o = t.W[0][0];
        return {
          app: `dataset ${e.o.data}, layers ${t.sizes.join("→")}, act ${e.o.act}, ${e.o.opt}, lr ${e.o.lr}, batch ${s}, GPUs ${e.o.gpus}
step ${e.step}  loss ${(e.lossHist.at(-1) ?? 0).toFixed(4)}`,
          os: `${Un()(i)}
replicas: ${e.replicas.length}  in sync: ${e.inSync()}
last shard sizes: ${e.lastShards.join(", ")}`,
          isa: `per step: ~${r.toLocaleString()} FLOPs (≈6 × params × batch)
kernels: ${t.sizes.length - 1} forward GEMM + ${2 * (t.sizes.length - 1)} backward GEMM
all-reduce: ${e.sends.length} chunk transfers, ${(e.bytes / 1024).toFixed(1)} KB
optimizer: ${e.o.opt} over ${n} params`,
          f32: o,
          W: t.W[0],
          sizes: t.sizes,
          util: e.lastShards,
          act: 0.8,
        };
      },
    },
    bci: {
      hw: [
        {
          t: "A closed-loop wet-computing rig after Cortical Labs' DishBrain (Kagan et al., Neuron 2022: ~800,000 cultured neurons learned Pong) and FinalSpark's organoid Neuroplatform. Living tissue sits in an incubator on a multi-electrode array.",
          p: /incubator|bench|monitor/i,
          viz: "spec",
        },
        {
          t: "Modules: the MEA headstage (amplifiers + stimulators), the closed-loop FPGA/DAQ, perfusion pump and media reservoirs, and the game display.",
          p: /headstage|FPGA|pump|reservoir|tubing/i,
          viz: "modules",
        },
        {
          t: "Devices: the electrode array itself (TiN on glass) and the neurons: here 100 simulated Izhikevich cells: sensory, two motor populations and inhibitory interneurons.",
          p: /array|electrode|neuron|ring|medium/i,
          viz: "chip",
        },
        {
          t: "Circuit: a neuron as an electrical circuit. The membrane is a leaky capacitor; input current charges it; at threshold it fires a spike and resets. The Izhikevich model v′ = 0.04v² + 5v + 140 − u + I reproduces real spike shapes cheaply. Live: one motor neuron's membrane voltage.",
          p: /neuron/i,
          viz: "neuron",
        },
        {
          t: "Physics: ion channels. At rest the membrane sits near −65 mV (more K⁺ inside, Na⁺ outside). A spike opens Na⁺ channels (rush in, up to ≈+30 mV) then K⁺ channels (out, back down) in ~1–2 ms. Electrodes see this as a µV dip in the surrounding fluid.",
          p: /neuron|electrode/i,
          viz: "ion",
        },
      ],
      sw: [
        {
          t: "Application: Pong. The game runs in silicon; the culture is the player.",
          p: /monitor/i,
          viz: "app",
        },
        {
          t: "“OS”: the closed-loop control software: encoder (ball → stimulation), decoder (motor spikes → paddle), the feedback schedule, and the safety limits on stimulation.",
          p: /FPGA|headstage/i,
          viz: "os",
        },
        {
          t: "“ISA”: there are no instructions, only codes. Place code (which electrode) + rate code (how often) in; population spike counts out; reward-modulated STDP changes synapses. Live weights and feedback state below.",
          p: /electrode|neuron/i,
          viz: "isa",
        },
        {
          t: "Bits → spikes: every electrode is a binary event stream (spike / no spike per ms window). Live raster of the 8 sensory electrodes over the last 64 ms.",
          p: /electrode/i,
          viz: "raster",
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.iUp,
          n = 0,
          s = 2 * e.nM;
        for (let r = 0; r < e.nS; r++) {
          let o = Math.floor(r / 5),
            a = o >= 4 ? 1 : -1,
            l = 0,
            c = 0;
          for (let h = 0; h < e.nM; h++)
            ((l += e.W[r * s + h]), (c += e.W[r * s + e.nM + h]));
          n += (a * (l - c)) / e.nM;
        }
        return {
          app: `hits ${e.hits}  misses ${e.misses}  rally ${e.rally}
ball (${e.ball.x.toFixed(2)}, ${e.ball.y.toFixed(2)})  paddle ${e.pad.toFixed(2)}`,
          os: `${Un()(i)}  culture time ${(e.t / 1e3).toFixed(1)} s
feedback mode: ${e.o.feedback}  plasticity: ${e.o.learn ? "on" : "off"}
now: ${e.t < e.feedbackUntil ? e.feedbackKind + " feedback" : "game"}  dopamine-like signal ${e.dop.toFixed(2)}`,
          isa: `sensory bin (ball rel. to paddle): ${e.sensoryBin()}
motor window up ${e.win.up.toFixed(1)} vs down ${e.win.dn.toFixed(1)}
learned weight contrast ${(n / e.nS / e.wmax).toFixed(3)}  (0 = none)
hit rate (last 20) ${e.hitRate(20).toFixed(2)}`,
          v: e.v[t],
          u: e.u[t],
          t: e.t,
          raster: e.raster,
          nS: e.nS,
          act: 0.6,
        };
      },
    },
    quantum: {
      hw: [
        {
          t: "SpinQ Gemini Mini-class (2022): a 14 kg, 60 W desktop box with a touchscreen; 2 qubits; launch price ¥1,188,000 (≈$8,700). No cryogenics: liquid-state NMR at room temperature.",
          p: /housing|touch|panel/i,
          viz: "spec",
        },
        {
          t: "Modules: the permanent-magnet assembly with shims, the NMR probe (RF coil + sample), the spectrometer electronics (FPGA sequencer, DDS, RF amplifier, receiver) and the PSU.",
          p: /magnet|probe|spectrometer|power/i,
          viz: "modules",
        },
        {
          t: "Devices: an NdFeB magnet giving 0.65 T (spec sheet), a saddle-shaped RF coil around a 5 mm tube of dimethyl phosphite. Its ¹H and ³¹P nuclei are the two qubits, resonating at ~27 MHz and ~11 MHz in that field.",
          p: /pole|probe|shim|amplifier/i,
          viz: "chip",
        },
        {
          t: "Circuit (gate level): your circuit compiled to the machine's native operations: selective RF rotations on each nucleus and free evolution under the J-coupling (697 Hz for H–P) for 2-qubit gates.",
          p: /probe|spectrometer/i,
          viz: "qcircuit",
        },
        {
          t: "Physics: each nuclear spin precesses about B₀ at its Larmor frequency (γB₀). A resonant RF pulse tips it (nutation); its transverse part then induces a tiny voltage in the coil. Live: the qubits' Bloch vectors precessing.",
          p: /probe|pole/i,
          viz: "spins",
        },
      ],
      sw: [
        {
          t: "Application: the quantum circuit you built (grid or QASM).",
          p: /touch/i,
          viz: "app",
        },
        {
          t: "OS: Gemini Mini runs an Android-based touchscreen app (SpinQuasar-style) that compiles circuits to pulse sequences, runs them, and auto-calibrates the RF frequencies and pulse widths.",
          p: /touch|spectrometer/i,
          viz: "os",
        },
        {
          t: "“ISA”: native NMR operations: RF pulses (90° ≈ 50 µs here) and J-coupling delays (1/2J ≈ 0.72 ms). Live: the compiled pulse list and the total time against T₂ (>20 ms on Gemini Mini).",
          p: /spectrometer|amplifier/i,
          viz: "isa",
        },
        {
          t: "Signals: after a read pulse the spins induce a decaying sinusoid, the free-induction decay (FID). Its Fourier transform is the spectrum whose line amplitudes give the populations. Honest note: room-temperature NMR uses pseudo-pure ensemble states, so its “entanglement” is simulated by the ensemble, not genuinely present.",
          p: /probe/i,
          viz: "fid",
        },
      ],
      probe(i) {
        let e = i.sim,
          t = e.getState ? e.getState() : null,
          n = e.n,
          s = Da(n, e.ops),
          r = e.ops
            .filter((o) => o.g !== "M")
            .map((o) =>
              br(o.g) === 1
                ? `RF pulse ${o.g}${/^R/.test(o.g) ? "(" + Em(o.th) + ")" : ""} on ${Qn[n].nuclei[o.q[0]]}`
                : `J-evolution ${o.g} on ${o.q.map((a) => Qn[n].nuclei[a]).join("–")}`,
            )
            .slice(0, 12).join(`
`);
        return {
          app:
            `// user circuit: ${e.ops.length} gates on ${n} qubits (QASM-style)
` +
            (r0(e.ops) || "(empty: add gates in the grid)") +
            `
// ▶ Run compiles this to RF pulses + J-coupling delays
// pulse sequence ≈ ${(Da(n, e.ops) * 1e3).toFixed(2)} ms vs T₂ > 20 ms`,
          os: `molecule: ${Qn[n].name}
${n} qubits, ${e.ops.length} ops, depth ${e.ops.reduce((o, a) => Math.max(o, a.col + 1), 0)}
shots ${e.shots}, dephasing ${e.dephase}, readout error ${e.readout}`,
          isa: `${r || "(empty circuit)"}
total sequence ${(s * 1e3).toFixed(2)} ms vs T₂ > 20 ms → ${s < 0.02 ? "OK" : "decoheres"}`,
          state: t,
          n,
          ops: e.ops,
          step: e.step,
          act: 0.6,
        };
      },
    },
  },
  Lm = {
    m6502: (i) => {
      let e = i.sim.cur(),
        t = e.regs || {},
        n = (s, r = 2) => (s >>> 0).toString(16).toUpperCase().padStart(r, "0");
      return {
        pc: "$" + n(t.pc, 4),
        regs: `A${n(t.a)} X${n(t.x)} Y${n(t.y)}`,
        ab: "$" + n(e.a ?? 0, 4),
        db: e.ph === 2 ? "$" + n(e.d) : "--",
        ir: "$" + n(i._ir ?? 0),
        tim: "φ" + (e.ph || 1),
      };
    },
    photonic: (i) => {
      let e = i.sim;
      return {
        m1: e.mode === "mesh" ? "F=" + e.fid.toFixed(4) : "",
        pd: (e.out || []).map((t) => (t * 100).toFixed(0)).join("/"),
      };
    },
    alife: (i) => {
      let e = i.sim;
      return {
        dish:
          e.mode === "gs"
            ? `F ${e.F.toFixed(3)} k ${e.K.toFixed(3)}`
            : e.mode === "bz"
              ? `wave t=${e.ex ? e.ex.t : 0}`
              : "DNA AND",
        chip: e.kin && e.kin[3] ? `11→${(e.kin[3].frac * 100).toFixed(0)}%` : "",
      };
    },
    turing: (i) => ({
      st: "q=" + i.sim.state,
      head: "pos " + i.sim.head,
      tape: i.sim.steps + " steps",
    }),
    z1: (i) => ({
      dec: i.sim.cur
        ? i.sim.cur.src + " " + i.sim.cyc + "/" + jn[i.sim.cur.op].cyc
        : "row " + i.sim.pc,
      man: "R1 " + (i.sim.R1 && !i.sim.R1.zero ? +i.sim.R1.value().toPrecision(5) : "—"),
      clk: i.sim.cycles + " cyc",
    }),
    tube: (i) => ({
      acc: "Acc " + i.sim.acc,
      ctl: "SCR " + i.sim.pc,
      mem: "wait " + i.sim.waited,
    }),
    pdp8: (i) => ({
      pc: ds(i.sim.pc),
      ac: ds(i.sim.ac),
      mb: ds(i.sim.mb),
      ir: "IR " + ds(i.sim.ir, 1),
    }),
    altair: (i) => ({ cpu: "PC " + At(i.sim.pc, 4) + " A " + At(i.sim.r[7]) }),
    home80: (i) => ({ cpu: "PC " + At(i.sim.cpu.pc, 4) }),
    pc90: (i) => ({ hdd: "cyl " + i.sim.disk.cyl }),
    pc00: (i) => ({ fe: "IPC " + i.sim.ipc.toFixed(2) }),
    pc10: (i) => ({ os: "t " + i.sim.t + " ms" }),
    pc20: (i) => ({
      ccd: i.sim.cpu
        ? "PC " + At(i.sim.cpu.pc, 4) + " · IPC " + i.sim.cpu.ipc().toFixed(2)
        : "",
      iod: i.sim.cpu ? "L1D " + (i.sim.cpu.l1d.hitRate() * 100).toFixed(0) + "%" : "",
      nvme: i.sim.cpu ? i.sim.cpu.stats.nvmeOps + " DMA" : "",
      gpu: "frame " + i.sim.frame,
    }),
    aibox: (i) => ({
      cpu: "step " + i.sim.step,
      nv: (i.sim.bytes / 1024).toFixed(1) + " KB/step",
    }),
    bci: (i) => ({
      game: "hits " + i.sim.hits,
      cul: (i.sim.t / 1e3).toFixed(0) + " s",
    }),
    quantum: (i) => ({
      sw: i.sim.ops.length + " ops",
      cmp: (Da(i.sim.n, i.sim.ops) * 1e3).toFixed(2) + " ms",
    }),
    analog: (i) => {
      let e = i.sim.patch,
        t = {};
      return (
        e &&
          e.ints[0] &&
          (t.i1 = e.ints[0].name + "=" + (+i.sim.S[e.ints[0].name]).toFixed(2)),
        e &&
          e.ints[1] &&
          (t.i2 = e.ints[1].name + "=" + (+i.sim.S[e.ints[1].name]).toFixed(2)),
        t
      );
    },
  };
var dA = {
    metal: "rgba(128,128,192,0.55)",
    diff: "#FFFF00",
    gnd: "#4DFF4D",
    pwr: "#FF4D4D",
    poly: "#801AC0",
    buried: "#FF00FF",
    via: "#e6e6ff",
  },
  Bi = {
    pla: [0.08, 0.06, 0.92, 0.25],
    ir: [0.08, 0.27, 0.22, 0.35],
    timing: [0.23, 0.27, 0.38, 0.35],
    p: [0.62, 0.27, 0.78, 0.35],
    clk: [0.79, 0.27, 0.92, 0.35],
    rcl: [0.08, 0.37, 0.92, 0.55],
    ab: [0.06, 0.58, 0.15, 0.9],
    y: [0.16, 0.58, 0.23, 0.9],
    x: [0.24, 0.58, 0.31, 0.9],
    s: [0.32, 0.58, 0.4, 0.9],
    alu: [0.41, 0.58, 0.57, 0.9],
    a: [0.58, 0.58, 0.64, 0.9],
    pcl: [0.65, 0.58, 0.73, 0.9],
    pch: [0.74, 0.58, 0.81, 0.9],
    dl: [0.82, 0.58, 0.87, 0.9],
    dor: [0.88, 0.58, 0.94, 0.9],
  },
  Hy = {
    pla: "DECODE ROM (PLA)",
    ir: "IR",
    timing: "TIMING",
    p: "P FLAGS",
    clk: "CLOCK GEN",
    rcl: "RANDOM CONTROL LOGIC",
    ab: "ABL/ABH",
    y: "Y",
    x: "X",
    s: "S",
    alu: "ALU + DAA",
    a: "A",
    pcl: "PCL",
    pch: "PCH",
    dl: "DL",
    dor: "DOR",
  };
function uA(i) {
  let e = i >>> 0 || 1;
  return () => (
    (e ^= e << 13),
    (e >>>= 0),
    (e ^= e >> 17),
    (e ^= e << 5),
    (e >>>= 0),
    e / 4294967296
  );
}
var Pc = ["ab", "y", "x", "s", "alu", "a", "pcl", "pch", "dl", "dor"];
function Hs(i, e, t, n, { bg: s = null } = {}) {
  let r = uA(1975 + ["diff", "buried", "poly", "via", "metal"].indexOf(n) * 7);
  if (
    (s ? ((i.fillStyle = s), i.fillRect(0, 0, e, t)) : i.clearRect(0, 0, e, t),
    n === "all")
  ) {
    for (let f of ["diff", "buried", "poly", "via", "metal"]) Hs(i, e, t, f, {});
    return;
  }
  let o = (f) => f * e,
    a = (f) => f * t,
    l = dA;
  (i.save(), (i.lineCap = "butt"));
  let c = Bi.pla,
    h = 26,
    d = 130,
    u = [];
  for (let f = 0; f < 40; f++) {
    let p = Math.floor(f / 10),
      x = f % 10,
      g = 0.08 + x * 0.088;
    u.push(
      p === 0
        ? [g, 0.015]
        : p === 1
          ? [0.985, g]
          : p === 2
            ? [1 - g, 0.985]
            : [0.015, 1 - g],
    );
  }
  if (n === "diff") {
    for (let f = 0; f < d; f++) {
      let p = c[0] + ((f + 0.5) * (c[2] - c[0])) / d;
      ((i.fillStyle = l.diff),
        i.fillRect(o(p) - e * 0.0012, a(c[1]), e * 0.0024, a(c[3] - c[1])));
    }
    i.fillStyle = l.gnd;
    for (let f = 0; f <= h; f += 2)
      i.fillRect(o(c[0]), a(c[1] + (f * (c[3] - c[1])) / h) - 1, o(c[2] - c[0]), 2.2);
    for (let f of ["rcl", "ir", "timing", "p", "clk"]) {
      let [p, x, g, m] = Bi[f],
        S = Math.round((g - p) * (m - x) * 9e3);
      for (let b = 0; b < S; b++) {
        let y = p + r() * (g - p),
          E = x + r() * (m - x),
          M = 0.003 + r() * 0.012,
          T = 0.002 + r() * 0.006;
        ((i.fillStyle = r() < 0.72 ? l.diff : r() < 0.6 ? l.gnd : l.pwr),
          i.fillRect(o(y), a(E), o(M), a(T)));
      }
    }
    for (let f of Pc) {
      let [p, x, g, m] = Bi[f];
      for (let S = 0; S < 8; S++) {
        let b = x + ((S + 0.15) * (m - x)) / 8;
        for (let y = 0; y < 3; y++)
          ((i.fillStyle = y === 1 ? l.gnd : l.diff),
            i.fillRect(
              o(p + (y * 0.31 + 0.05) * (g - p)),
              a(b),
              o((g - p) * 0.24),
              a(((m - x) / 8) * 0.62),
            ));
      }
    }
    for (let [f, p] of u) ((i.fillStyle = l.pwr), i.fillRect(o(f) - 7, a(p) - 7, 14, 14));
  }
  if (n === "buried") {
    i.fillStyle = l.buried;
    for (let f = 0; f < 900; f++) {
      let p = ["rcl", "ir", "timing", "p", "clk", ...Pc],
        [x, g, m, S] = Bi[p[Math.floor(r() * p.length)]];
      i.fillRect(o(x + r() * (m - x)), a(g + r() * (S - g)), 3, 3);
    }
  }
  if (n === "poly") {
    ((i.strokeStyle = l.poly), (i.lineWidth = Math.max(1.4, t * 0.0016)));
    for (let f = 0; f < h; f++) {
      let p = c[1] + ((f + 0.5) * (c[3] - c[1])) / h;
      (i.beginPath(), i.moveTo(o(c[0]), a(p)), i.lineTo(o(c[2]), a(p)), i.stroke());
    }
    for (let f of ["rcl", "ir", "timing", "p", "clk"]) {
      let [p, x, g, m] = Bi[f],
        S = Math.round((g - p) * (m - x) * 3e3);
      for (let b = 0; b < S; b++) {
        let y = p + r() * (g - p),
          E = x + r() * (m - x);
        (i.beginPath(), i.moveTo(o(y), a(E)));
        for (let M = 0; M < 3; M++)
          (M % 2
            ? (E = Math.min(m, Math.max(x, E + (r() - 0.5) * 0.03)))
            : (y = Math.min(g, Math.max(p, y + (r() - 0.5) * 0.03))),
            i.lineTo(o(y), a(E)));
        i.stroke();
      }
    }
    for (let f of Pc) {
      let [p, x, g, m] = Bi[f];
      for (let S = 0; S < 4; S++) {
        let b = p + ((S + 0.5) * (g - p)) / 4;
        (i.beginPath(), i.moveTo(o(b), a(x - 0.02)), i.lineTo(o(b), a(m)), i.stroke());
      }
    }
  }
  if (n === "via") {
    i.fillStyle = l.via;
    for (let f = 0; f < h; f++)
      for (let p = 0; p < d; p++)
        if ((f * 131 + p * 71 + f * p * 7) % 11 < 3) {
          let g = c[0] + ((p + 0.5) * (c[2] - c[0])) / d,
            m = c[1] + ((f + 0.5) * (c[3] - c[1])) / h;
          i.fillRect(o(g) - 1.5, a(m) - 1.5, 3, 3);
        }
    for (let f = 0; f < 1400; f++) {
      let p = ["rcl", "ir", "timing", "p", "clk", ...Pc],
        [x, g, m, S] = Bi[p[Math.floor(r() * p.length)]];
      i.fillRect(o(x + r() * (m - x)) - 1.2, a(g + r() * (S - g)) - 1.2, 2.4, 2.4);
    }
  }
  if (n === "metal") {
    i.fillStyle = l.metal;
    let f = 0.035;
    (i.fillRect(o(f), a(f), o(1 - 2 * f), a(0.012)),
      i.fillRect(o(f), a(1 - f - 0.012), o(1 - 2 * f), a(0.012)),
      i.fillRect(o(f), a(f), o(0.012), a(1 - 2 * f)),
      i.fillRect(o(1 - f - 0.012), a(f), o(0.012), a(1 - 2 * f)));
    for (let p = 0; p < d; p += 2) {
      let x = c[0] + ((p + 0.5) * (c[2] - c[0])) / d;
      i.fillRect(o(x) - 1, a(c[1]), 2, a(Bi.rcl[3] - c[1]) * (0.6 + 0.4 * r()));
    }
    for (let p of Pc) {
      let [x, g, m, S] = Bi[p];
      for (let b = 0; b < 8; b++) {
        let y = g + ((b + 0.85) * (S - g)) / 8;
        i.fillRect(o(x), a(y) - 1.5, o(m - x), 3);
      }
    }
    for (let p = 0; p < 3; p++) {
      let x = Bi.ab[1] + ((p * 2.7 + 0.5) * (Bi.ab[3] - Bi.ab[1])) / 8;
      i.fillRect(o(0.06), a(x) - 2, o(0.88), 4);
    }
    for (let p = 0; p < 260; p++) {
      let [x, g, m, S] = Bi.rcl,
        b = g + r() * (S - g),
        y = x + r() * (m - x);
      i.fillRect(o(y), a(b), o(0.02 + r() * 0.15), 2);
    }
    for (let [p, x] of u) i.fillRect(o(p) - 11, a(x) - 11, 22, 22);
  }
  i.restore();
}
var fA = ["rgba(128,128,192,0.4)", "#FFFF00", "#FF00FF", "#4DFF4D", "#FF4D4D", "#801AC0"];
function u0(i, e, t, n, s = [1, 2, 3, 4, 5, 0], r = null, o = "#000") {
  o ? ((i.fillStyle = o), i.fillRect(0, 0, e, t)) : i.clearRect(0, 0, e, t);
  let a = e / 1e4,
    l = t / 1e4,
    c = 400;
  for (let h of s) {
    ((i.fillStyle = fA[h]), i.beginPath());
    for (let d of n)
      if (d[2] === h) {
        i.moveTo((d[3] + c) * a, t - d[4] * l);
        for (let u = 5; u < d.length; u += 2) i.lineTo((d[u] + c) * a, t - d[u + 1] * l);
        i.closePath();
      }
    i.fill();
  }
  if (r) {
    ((i.fillStyle = "rgba(255,255,255,0.55)"), i.beginPath());
    for (let h of n)
      if (!(!r[h[0]] || h[2] === 0)) {
        i.moveTo((h[3] + c) * a, t - h[4] * l);
        for (let d = 5; d < h.length; d += 2) i.lineTo((h[d] + c) * a, t - h[d + 1] * l);
        i.closePath();
      }
    i.fill();
  }
}
var Z = {
    bg: "#05080b",
    ink: "#e6edf3",
    dim: "#8b98a9",
    acc: "#58c4ff",
    acc2: "#ffb347",
    ok: "#5fe08a",
    bad: "#ff6b6b",
    vio: "#b58cff",
    pink: "#ff6bd6",
  },
  Ce = (i, e = "") => `${e} ${i}px ui-monospace,Menlo,Consolas,monospace`;
function pA(i, e, t, n, s, r, o = Z.ink, a = 40) {
  ((i.fillStyle = o),
    String(e || "")
      .split(
        `
`,
      )
      .slice(0, a)
      .forEach((c, h) => i.fillText(c, t, n + h * r, s - t - 4)));
}
var km = (i, e) =>
  Array.from({ length: e }, (t, n) => Math.floor(i / 2 ** (e - 1 - n)) % 2);
function bn(i, e, t, n, s, r, o, a = 5) {
  (i.beginPath(),
    i.roundRect ? i.roundRect(e, t, n, s, a) : i.rect(e, t, n, s),
    r && ((i.fillStyle = r), i.fill()),
    o && ((i.strokeStyle = o), i.stroke()));
}
var Gy = (i) => [1, 3, 5].map((e) => parseInt(i.slice(e, e + 2), 16)),
  Ic = {
    spec(i, e, t, n, s, r, o) {
      let a = Math.max(11, t / 16);
      ((i.font = Ce(a, "600")),
        (i.fillStyle = Z.acc2),
        i.fillText(o.name.slice(0, 70), 10, a + 6, e - 20),
        (i.font = Ce(a * 0.86)));
      let l = r.t.split(" "),
        c = "",
        h = a * 2.6;
      i.fillStyle = Z.ink;
      for (let d of l)
        (i.measureText(c + d).width > e - 24 &&
          (i.fillText(c, 10, h), (c = ""), (h += a * 1.25)),
          (c += d + " "));
      i.fillText(c, 10, h);
    },
    modules(i, e, t, n, s, r, o) {
      let a = Object.values(o.diag.nodes),
        l = Math.ceil(Math.sqrt((a.length * e) / t)),
        c = Math.ceil(a.length / l),
        h = e / l,
        d = t / c;
      a.forEach((u, f) => {
        let p = (f % l) * h + 6,
          x = Math.floor(f / l) * d + 6,
          g = h - 12,
          m = d - 12,
          S = u.act || 0,
          b = Gy(u.color || "#58c4ff");
        (bn(i, p, x, g, m, `rgba(${b},${0.12 + S * 0.5})`, u.color || Z.acc, 8),
          (i.fillStyle = Z.ink),
          (i.font = Ce(Math.max(10, Math.min(m / 4, 14)), "600")),
          u.label
            .split(
              `
`,
            )
            .forEach((y, E) => i.fillText(y, p + 8, x + 18 + E * 15, g - 12)),
          (i.fillStyle = b ? `rgba(${b},.9)` : Z.acc),
          i.fillRect(p + 8, x + m - 10, (g - 16) * Math.min(1, S + 0.03), 4),
          u.val &&
            ((i.fillStyle = Z.acc2),
            (i.font = Ce(11)),
            i.fillText(u.val, p + 8, x + m - 16, g - 12)));
      });
    },
    chip(i, e, t, n, s, r, o) {
      let a = Object.values(o.diag.nodes);
      ((i.fillStyle = "#2a2a2e"),
        i.fillRect(8, 8, e - 16, t - 16),
        (i.fillStyle = "#c9a45c"));
      for (let g = 0; g < 40; g++)
        (i.fillRect(8 + (g * (e - 16)) / 40, 8, 3, 5),
          i.fillRect(8 + (g * (e - 16)) / 40, t - 13, 3, 5));
      let l = 22,
        c = 22,
        h = e - 44,
        d = t - 44;
      ((i.fillStyle = "#3a3f4a"), i.fillRect(l, c, h, d));
      let u = l,
        f = a.length,
        p = 0,
        x = Math.ceil(f / 2);
      (a.forEach((g, m) => {
        let S = m < x ? 0 : 1,
          b = S ? m - x : m,
          y = S ? f - x : x,
          E = h / y,
          M = d / 2,
          T = l + b * E,
          A = c + S * M,
          w = Gy(g.color || "#58c4ff"),
          v = g.act || 0;
        ((i.fillStyle = `rgba(${w},${0.18 + 0.7 * v})`),
          i.fillRect(T + 3, A + 3, E - 6, M - 6),
          (i.strokeStyle = `rgba(${w},.9)`),
          i.strokeRect(T + 3, A + 3, E - 6, M - 6),
          i.save(),
          (i.globalAlpha = 0.25),
          (i.strokeStyle = "#000"));
        for (let R = A + 8; R < A + M - 6; R += 5)
          (i.beginPath(), i.moveTo(T + 6, R), i.lineTo(T + E - 6, R), i.stroke());
        (i.restore(),
          (i.fillStyle = Z.ink),
          (i.font = Ce(Math.max(9, Math.min(13, E / 9)), "600")),
          g.label
            .split(
              `
`,
            )
            .forEach((R, _) => i.fillText(R, T + 8, A + 18 + _ * 14, E - 14)));
      }),
        (i.fillStyle = Z.dim),
        (i.font = Ce(10)),
        i.fillText("floorplan sketch · blocks glow with live activity", 12, t - 2));
    },
    adder(i, e, t, n, s, r) {
      let o = Math.min(8, s.wbits || 8),
        a = (s.a >>> 0) & ((1 << o) - 1),
        l = (s.b >>> 0) & ((1 << o) - 1),
        c = (e - 30) / o,
        h = 0,
        d = [],
        u = [];
      for (let f = 0; f < o; f++) {
        let p = (a >> f) & 1,
          x = (l >> f) & 1,
          g = p ^ x ^ h,
          m = (p & x) | (h & (p ^ x));
        (d.push(g), u.push(h), (h = m));
      }
      i.font = Ce(12, "600");
      for (let f = 0; f < o; f++) {
        let p = e - 20 - (f + 1) * c,
          x = t * 0.32,
          g = (a >> f) & 1,
          m = (l >> f) & 1,
          S = r.serial ? Math.floor(n * 4) % o === f : !0;
        (bn(
          i,
          p + 4,
          x,
          c - 8,
          t * 0.36,
          S ? "#1f3b5c" : "#111820",
          S ? Z.acc : "#334",
          6,
        ),
          (i.fillStyle = Z.ink),
          i.fillText("FA", p + c / 2 - 9, x + t * 0.2),
          (i.fillStyle = g ? Z.ok : Z.dim),
          i.fillText("a" + g, p + 8, x - 22),
          (i.fillStyle = m ? Z.ok : Z.dim),
          i.fillText("b" + m, p + c - 30, x - 22),
          (i.strokeStyle = g ? Z.ok : "#334"),
          i.beginPath(),
          i.moveTo(p + 14, x - 16),
          i.lineTo(p + 14, x),
          i.stroke(),
          (i.strokeStyle = m ? Z.ok : "#334"),
          i.beginPath(),
          i.moveTo(p + c - 18, x - 16),
          i.lineTo(p + c - 18, x),
          i.stroke(),
          (i.fillStyle = d[f] ? Z.acc2 : Z.dim),
          i.fillText("s" + d[f], p + c / 2 - 10, x + t * 0.36 + 18),
          u[f] &&
            ((i.strokeStyle = Z.bad),
            (i.lineWidth = 2),
            i.beginPath(),
            i.moveTo(p + c + 2, x + t * 0.18),
            i.lineTo(p + c - 6, x + t * 0.18),
            i.stroke(),
            (i.lineWidth = 1)));
      }
      ((i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText(
          `${r.serial ? "serial: one full adder reused per bit-time (highlight)" : o + "-bit ripple-carry"} · a=${a} b=${l} sum=${(a + l) & ((1 << o) - 1)}${h ? " carry-out=1" : ""}`,
          8,
          t - 6,
          e - 12,
        ));
    },
    opamp(i, e, t, n, s) {
      let r = s.volt || 0;
      ((i.strokeStyle = Z.ink), (i.lineWidth = 2));
      let o = e * 0.5,
        a = t * 0.5;
      (i.beginPath(),
        i.moveTo(o - 40, a - 40),
        i.lineTo(o - 40, a + 40),
        i.lineTo(o + 40, a),
        i.closePath(),
        i.stroke(),
        (i.font = Ce(13, "600")),
        (i.fillStyle = Z.ink),
        i.fillText("−", o - 34, a - 12),
        i.fillText("+", o - 34, a + 22),
        i.beginPath(),
        i.moveTo(e * 0.08, a - 18),
        i.lineTo(o - 90, a - 18),
        i.stroke());
      for (let h = 0; h < 6; h++)
        (i.beginPath(),
          i.moveTo(o - 90 + h * 8, a - 18 + (h % 2 ? 6 : -6)),
          i.lineTo(o - 82 + h * 8, a - 18 + (h % 2 ? -6 : 6)),
          i.stroke());
      (i.beginPath(),
        i.moveTo(o - 42, a - 18),
        i.lineTo(o - 40, a - 18),
        i.stroke(),
        i.beginPath(),
        i.moveTo(o - 50, a - 18),
        i.lineTo(o - 50, a - 70),
        i.lineTo(o - 6, a - 70),
        i.moveTo(o + 6, a - 70),
        i.lineTo(o + 60, a - 70),
        i.lineTo(o + 60, a),
        i.lineTo(e * 0.92, a),
        i.stroke(),
        i.beginPath(),
        i.moveTo(o - 6, a - 82),
        i.lineTo(o - 6, a - 58),
        i.moveTo(o + 6, a - 82),
        i.lineTo(o + 6, a - 58),
        i.stroke(),
        (i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText("C", o - 4, a - 88),
        i.fillText("R", o - 72, a - 30),
        i.fillText("Vin", e * 0.08, a - 26),
        i.fillText("Vout = −(1/RC)∫Vin dt", o + 64, a - 8),
        i.beginPath(),
        i.moveTo(o - 40, a + 22),
        i.lineTo(o - 60, a + 22),
        i.lineTo(o - 60, a + 40),
        i.stroke(),
        i.fillText("⏚", o - 66, a + 54));
      let l = Math.max(-1, Math.min(1, r));
      ((i.fillStyle = l >= 0 ? Z.acc2 : Z.acc), i.fillRect(o - 10, a - 70 - 2, 3, 0));
      let c = 40 * l;
      (i.fillRect(e * 0.86, a - Math.max(0, c), 12, Math.abs(c)),
        (i.fillStyle = Z.ink),
        i.fillText(`${s.vname} = ${(r * 100).toFixed(1)} V`, e * 0.66, a + 30));
      for (let h = 0; h < 6; h++) {
        let d = (n * 1.5 + h / 6) % 1;
        ((i.fillStyle = "rgba(255,179,71,.8)"),
          i.beginPath(),
          i.arc(e * 0.08 + (o - 90 - e * 0.08) * d, a - 18, 2.5, 0, 7),
          i.fill());
      }
      i.lineWidth = 1;
    },
    triode(i, e, t, n, s) {
      let r = Math.max(-1, Math.min(1, s.volt || 0)),
        o = e / 2;
      ((i.strokeStyle = "#8899aa"),
        (i.lineWidth = 2),
        i.beginPath(),
        i.ellipse(o, t / 2, e * 0.22, t * 0.44, 0, 0, 7),
        i.stroke(),
        (i.fillStyle = "#ff8a2a"),
        (i.shadowColor = "#ff8a2a"),
        (i.shadowBlur = 14),
        i.fillRect(o - 40, t * 0.82, 80, 6),
        (i.shadowBlur = 0),
        (i.fillStyle = "#b0b8c0"),
        i.fillRect(o - 50, t * 0.12, 100, 8),
        (i.strokeStyle = "#6aa0d8"),
        i.setLineDash([4, 5]),
        i.beginPath(),
        i.moveTo(o - 55, t * 0.55),
        i.lineTo(o + 55, t * 0.55),
        i.stroke(),
        i.setLineDash([]));
      let a = 0.25 + (0.75 * (r + 1)) / 2,
        l = Math.round(40 * a);
      for (let c = 0; c < l; c++) {
        let h = (n * (0.6 + a) + c * 0.137) % 1,
          d = o - 38 + ((c * 37) % 76) + Math.sin(c + n * 3) * 3,
          u = t * 0.82 - h * (t * 0.7);
        ((i.fillStyle = Z.acc), i.beginPath(), i.arc(d, u, 2, 0, 7), i.fill());
      }
      ((i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText("plate (anode)", o + 56, t * 0.15),
        i.fillText("control grid", o + 58, t * 0.56),
        i.fillText("hot cathode", o + 44, t * 0.86),
        (i.fillStyle = Z.ink),
        i.fillText(
          `grid follows live ${s.vname || "signal"}: plate current ${(a * 100).toFixed(0)} %`,
          8,
          t - 6,
        ),
        (i.lineWidth = 1));
    },
    mercury(i, e, t, n, s) {
      let r = t * 0.45,
        o = 40,
        a = e - 40;
      ((i.fillStyle = "#5a6470"),
        i.fillRect(o, r - 18, a - o, 36),
        (i.fillStyle = "#c0c8d0"),
        i.fillRect(o + 2, r - 15, a - o - 4, 30));
      let l = km(s.word ? s.word.v : 0, 17),
        c = 0.12;
      for (let h = 0; h < 3; h++)
        l.forEach((d, u) => {
          let f = (n * c + (h * 17 + u) / 51) % 1,
            p = o + f * (a - o);
          d
            ? ((i.fillStyle = "rgba(88,196,255,.9)"),
              i.beginPath(),
              i.ellipse(p, r, 3, 13, 0, 0, 7),
              i.fill())
            : ((i.fillStyle = "rgba(0,0,0,.15)"), i.fillRect(p - 1, r - 2, 2, 4));
        });
      ((i.fillStyle = "#e0c080"),
        i.fillRect(o - 12, r - 20, 10, 40),
        i.fillRect(a + 2, r - 20, 10, 40),
        (i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText("quartz transmitter", 4, r + 34),
        i.fillText("quartz receiver → amplifier → back to start", a - 230, r + 34),
        (i.fillStyle = Z.ink),
        i.fillText(
          "sound pulses in mercury (~1,450 m/s): the word circulates; the CPU waits for it to arrive",
          8,
          t - 8,
          e - 12,
        ));
    },
    core(i, e, t, n, s) {
      let r = e * 0.28,
        o = t / 2,
        a = e * 0.2,
        l = t * 0.32;
      ((i.strokeStyle = "#334"),
        i.beginPath(),
        i.moveTo(r - a - 10, o),
        i.lineTo(r + a + 10, o),
        i.moveTo(r, o - l - 10),
        i.lineTo(r, o + l + 10),
        i.stroke(),
        (i.strokeStyle = Z.acc2),
        (i.lineWidth = 2),
        i.beginPath());
      for (let b = 0; b <= 60; b++) {
        let y = -1 + (2 * b) / 60,
          E = Math.tanh((y + 0.35) * 6);
        b ? i.lineTo(r + y * a, o - E * l) : i.moveTo(r + y * a, o - E * l);
      }
      (i.stroke(), i.beginPath());
      for (let b = 0; b <= 60; b++) {
        let y = -1 + (2 * b) / 60,
          E = Math.tanh((y - 0.35) * 6);
        b ? i.lineTo(r + y * a, o - E * l) : i.moveTo(r + y * a, o - E * l);
      }
      (i.stroke(), (i.lineWidth = 1));
      let c = (n * 0.5) % 1,
        h = s.coreBit,
        d = c < 0.5 ? -1 : 0.5 * (h ? 1 : 0) * 2 - 0,
        u = c < 0.5 ? [-0.95, -1] : h ? [0.95, 1] : [0, -0.98];
      ((i.fillStyle = Z.ok),
        i.beginPath(),
        i.arc(r + u[0] * a, o - u[1] * l, 6, 0, 7),
        i.fill(),
        (i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText("H (drive current)", r + a - 60, o + 16),
        i.fillText("B", r + 4, o - l - 4),
        i.fillText("½I alone cannot flip it", r - a, o + l + 22));
      let f = e * 0.6,
        p = t * 0.15,
        x = 6,
        g = Math.min(e * 0.36, t * 0.7) / x,
        m = (s.coreAddr || 0) % x,
        S = Math.floor((s.coreAddr || 0) / x) % x;
      for (let b = 0; b < x; b++)
        ((i.strokeStyle = b === m ? Z.bad : "#445"),
          (i.lineWidth = b === m ? 2 : 1),
          i.beginPath(),
          i.moveTo(f + b * g + g / 2, p - 6),
          i.lineTo(f + b * g + g / 2, p + x * g + 6),
          i.stroke(),
          (i.strokeStyle = b === S ? Z.bad : "#445"),
          (i.lineWidth = b === S ? 2 : 1),
          i.beginPath(),
          i.moveTo(f - 6, p + b * g + g / 2),
          i.lineTo(f + x * g + 6, p + b * g + g / 2),
          i.stroke());
      for (let b = 0; b < x; b++)
        for (let y = 0; y < x; y++) {
          let E = b === m && y === S;
          ((i.strokeStyle = E ? Z.ok : "#778"),
            (i.lineWidth = E ? 3 : 1.5),
            i.beginPath(),
            i.ellipse(
              f + b * g + g / 2,
              p + y * g + g / 2,
              g * 0.28,
              g * 0.18,
              Math.PI / 4,
              0,
              7,
            ),
            i.stroke());
        }
      ((i.lineWidth = 1),
        (i.fillStyle = Z.ink),
        i.fillText(
          `X+Y half-currents select one core (MA ${(s.coreAddr || 0).toString(8)}); read is destructive → write-back`,
          8,
          t - 6,
          e - 12,
        ));
    },
    mosfet(i, e, t, n, s, r) {
      let o = s.gate !== void 0 ? s.gate : Math.sin(n * 2) > 0 ? 1 : 0,
        a = t * 0.55,
        l = e * 0.12,
        c = e * 0.88;
      if (
        ((i.fillStyle = "#3a2c1c"),
        i.fillRect(l, a, c - l, t * 0.3),
        (i.fillStyle = "#5a4a8a"),
        i.fillRect(l, a, e * 0.22, 20),
        i.fillRect(c - e * 0.22, a, e * 0.22, 20),
        r.fin
          ? ((i.fillStyle = "#6a5a3a"),
            i.fillRect(e * 0.34, a - 34, e * 0.32, 34),
            (i.fillStyle = "rgba(200,170,90,.9)"),
            i.fillRect(e * 0.32, a - 48, e * 0.36, 12),
            i.fillRect(e * 0.32, a - 48, 10, 48),
            i.fillRect(e * 0.68 - 10, a - 48, 10, 48))
          : ((i.fillStyle = "#9ab"),
            i.fillRect(e * 0.34, a - 8, e * 0.32, 8),
            (i.fillStyle = "rgba(200,170,90,.9)"),
            i.fillRect(e * 0.34, a - 28, e * 0.32, 20)),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11, "600")),
        i.fillText("source", l + 6, a + 36),
        i.fillText("drain", c - 50, a + 36),
        i.fillText("gate " + (o ? "HIGH" : "LOW"), e * 0.43, a - (r.fin ? 54 : 34)),
        o)
      ) {
        ((i.fillStyle = "rgba(88,196,255,.35)"),
          i.fillRect(e * 0.34, a + (r.fin ? -30 : 0), e * 0.32, r.fin ? 26 : 8));
        for (let h = 0; h < 14; h++) {
          let d = (n * 0.8 + h / 14) % 1;
          ((i.fillStyle = Z.acc),
            i.beginPath(),
            i.arc(
              l + e * 0.1 + d * (c - l - e * 0.2),
              a + (r.fin ? -16 : 4) + Math.sin(h * 3) * 2,
              3,
              0,
              7,
            ),
            i.fill());
        }
      }
      ((i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText(
          `${r.node || ""}  ·  ${o ? "inversion channel formed: current flows" : "no channel: switch off"}${r.fin ? "  ·  gate wraps the fin on 3 sides" : ""}`,
          8,
          t - 6,
          e - 12,
        ));
    },
    dram(i, e, t, n, s) {
      let r = s.cell ?? 1,
        o = 2.5,
        a = (n % o) / o,
        l = r ? Math.exp(-a * 1.6) : 0.04,
        c = e * 0.35,
        h = t * 0.5;
      ((i.strokeStyle = Z.ink),
        (i.lineWidth = 2),
        i.beginPath(),
        i.moveTo(e * 0.08, h - 50),
        i.lineTo(e * 0.62, h - 50),
        i.stroke(),
        i.beginPath(),
        i.moveTo(c, h - 50),
        i.lineTo(c, h - 20),
        i.moveTo(c - 14, h - 20),
        i.lineTo(c + 14, h - 20),
        i.moveTo(c - 14, h - 12),
        i.lineTo(c + 14, h - 12),
        i.moveTo(c, h - 12),
        i.lineTo(c, h + 10),
        i.stroke(),
        (i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText("bit line", e * 0.08, h - 56),
        i.fillText("access transistor (word line)", c + 18, h - 14),
        (i.strokeStyle = Z.ink),
        i.beginPath(),
        i.moveTo(c - 22, h + 10),
        i.lineTo(c + 22, h + 10),
        i.moveTo(c - 22, h + 18),
        i.lineTo(c + 22, h + 18),
        i.moveTo(c, h + 18),
        i.lineTo(c, h + 34),
        i.stroke(),
        i.fillText("⏚", c - 5, h + 46),
        i.fillText("storage capacitor (~fF)", c + 26, h + 18));
      let d = Math.round(30 * l);
      for (let u = 0; u < d; u++)
        ((i.fillStyle = Z.acc),
          i.beginPath(),
          i.arc(c - 18 + ((u * 7) % 36), h + 6 - Math.floor(u / 6) * 4, 1.8, 0, 7),
          i.fill());
      ((i.fillStyle = "#1b2330"),
        i.fillRect(e * 0.68, t * 0.2, e * 0.25, t * 0.5),
        (i.fillStyle = l > 0.5 ? Z.ok : Z.bad),
        i.fillRect(e * 0.68, t * 0.7 - t * 0.5 * l, e * 0.25, t * 0.5 * l),
        (i.strokeStyle = Z.acc2),
        i.setLineDash([4, 4]),
        i.beginPath(),
        i.moveTo(e * 0.66, t * 0.45),
        i.lineTo(e * 0.95, t * 0.45),
        i.stroke(),
        i.setLineDash([]),
        (i.fillStyle = Z.ink),
        i.fillText(
          `stored bit ${r} · charge ${(l * 100).toFixed(0)} % · ${a > 0.95 ? "REFRESH!" : "leaking… refresh soon"}`,
          8,
          t - 6,
          e - 12,
        ),
        (i.lineWidth = 1));
    },
    cmos(i, e, t, n, s) {
      let r = s.a & 1,
        o = s.b & 1,
        a = r & o ? 0 : 1,
        l = e * 0.45;
      ((i.strokeStyle = Z.ink),
        (i.lineWidth = 2),
        (i.font = Ce(11, "600")),
        (i.fillStyle = Z.acc2),
        i.fillText("VDD", l - 12, 16),
        i.beginPath(),
        i.moveTo(l - 60, 22),
        i.lineTo(l + 60, 22),
        i.stroke());
      let c = (h, d, u, f, p) => {
        ((i.strokeStyle = f ? Z.ok : "#556"),
          i.strokeRect(h - 12, d - 14, 24, 28),
          u && (i.beginPath(), i.arc(h - 18, d, 4, 0, 7), i.stroke()),
          (i.fillStyle = f ? Z.ok : Z.dim),
          i.fillText(p + (f ? " on" : " off"), h + 16, d + 4));
      };
      (c(l - 40, 50, !0, !r, "P(a)"),
        c(l + 40, 50, !0, !o, "P(b)"),
        (i.strokeStyle = Z.ink),
        i.beginPath(),
        i.moveTo(l - 40, 22),
        i.lineTo(l - 40, 36),
        i.moveTo(l + 40, 22),
        i.lineTo(l + 40, 36),
        i.moveTo(l - 40, 64),
        i.lineTo(l - 40, 80),
        i.lineTo(l + 40, 80),
        i.lineTo(l + 40, 64),
        i.moveTo(l, 80),
        i.lineTo(l, 96),
        i.lineTo(e * 0.85, 96),
        i.stroke(),
        c(l, 110, !1, r, "N(a)"),
        c(l, 150, !1, o, "N(b)"),
        (i.strokeStyle = Z.ink),
        i.beginPath(),
        i.moveTo(l, 124),
        i.lineTo(l, 136),
        i.moveTo(l, 164),
        i.lineTo(l, 178),
        i.stroke(),
        (i.fillStyle = Z.dim),
        i.fillText("GND", l - 12, 192),
        (i.fillStyle = a ? Z.acc2 : Z.dim),
        (i.font = Ce(14, "700")),
        i.fillText("OUT = NAND(a,b) = " + a, e * 0.62, 90),
        (i.font = Ce(12)),
        (i.fillStyle = Z.ink),
        i.fillText(`inputs: a=${r} b=${o} (bits of the last disk byte)`, 8, t - 6),
        (i.lineWidth = 1));
    },
    disk(i, e, t, n, s) {
      let r = e * 0.4,
        o = t / 2,
        a = Math.min(e, t) * 0.42;
      ((i.fillStyle = "#9aa3ad"),
        i.beginPath(),
        i.arc(r, o, a, 0, 7),
        i.fill(),
        (i.fillStyle = "#5a6470"),
        i.beginPath(),
        i.arc(r, o, a * 0.18, 0, 7),
        i.fill());
      let l = n * 3.6;
      for (let h = 0; h < 10; h++) {
        let d = a * (0.25 + h * 0.072);
        for (let u = 0; u < 36; u++) {
          let f = l + (u * Math.PI) / 18,
            p = (u * 7 + h * 3) % 5 < 2;
          ((i.fillStyle = p ? "rgba(255,107,107,.75)" : "rgba(88,196,255,.75)"),
            i.fillRect(r + Math.cos(f) * d - 2, o + Math.sin(f) * d - 2, 4, 4));
        }
      }
      let c = a * (0.25 + (s.head || 0) * 0.72);
      ((i.strokeStyle = "#ddd"),
        (i.lineWidth = 5),
        i.beginPath(),
        i.moveTo(e * 0.92, t * 0.85),
        i.lineTo(r + c, o),
        i.stroke(),
        (i.fillStyle = Z.acc2),
        i.fillRect(r + c - 4, o - 4, 8, 8),
        (i.lineWidth = 1),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          "magnetised domains (N/S) · head at the live cylinder",
          8,
          t - 6,
          e - 12,
        ));
    },
    pipeline(i, e, t, n, s) {
      let r = Math.min(s.depth || 10, 24),
        o = (s.recent || []).slice(-8),
        a = (e - 20) / r,
        l = (t - 40) / 8;
      for (let h = 0; h < r; h++)
        ((i.fillStyle = h % 2 ? "#141b25" : "#0f151d"),
          i.fillRect(10 + h * a, 18, a, t - 40));
      ((i.fillStyle = Z.dim),
        (i.font = Ce(10)),
        i.fillText(`${r}-stage pipeline: time →`, 10, 12));
      let c = o.length ? o[o.length - 1].issue : 0;
      (o.forEach((h, d) => {
        let u = Math.round(c - h.issue),
          f = 10 + Math.max(0, r - 1 - u) * a * 0.9,
          p = 18 + d * l,
          x = h.kind === "branch" ? Z.bad : h.kind ? Z.acc2 : Z.ok;
        ((i.fillStyle = x),
          (i.globalAlpha = 0.8),
          i.fillRect(f, p + 2, a * Math.max(1, Math.min(r, 1 + h.stall)) * 0.9, l - 4),
          (i.globalAlpha = 1),
          (i.fillStyle = "#000"),
          (i.font = Ce(Math.min(11, l - 4))),
          i.fillText(h.src.slice(0, 14), f + 3, p + l - 6));
      }),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          "green: flowing · orange: cache stall · red: branch mispredict flush",
          8,
          t - 6,
          e - 12,
        ));
    },
    power(i, e, t, n, s) {
      let r = s.ghz || 3;
      ((i.strokeStyle = "#334"),
        i.beginPath(),
        i.moveTo(40, t - 30),
        i.lineTo(e - 10, t - 30),
        i.moveTo(40, 10),
        i.lineTo(40, t - 30),
        i.stroke());
      let o = (h) => 40 + (h / 5) * (e - 60),
        a = (h) => t - 30 - Math.min(1, h / 200) * (t - 50);
      ((i.strokeStyle = Z.acc2), (i.lineWidth = 2), i.beginPath());
      for (let h = 0; h <= 50; h++) {
        let d = (5 * h) / 50,
          u = 0.8 + 0.22 * d,
          f = 12 * u * u * d;
        h ? i.lineTo(o(d), a(f)) : i.moveTo(o(d), a(f));
      }
      (i.stroke(), (i.lineWidth = 1));
      let l = 0.8 + 0.22 * r,
        c = 12 * l * l * r;
      ((i.fillStyle = Z.bad),
        i.beginPath(),
        i.arc(o(r), a(c), 6, 0, 7),
        i.fill(),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          `${r} GHz → V≈${l.toFixed(2)} V → P≈${c.toFixed(0)} W (illustrative α·C·V²·f)`,
          50,
          22,
        ),
        (i.fillStyle = Z.dim),
        i.fillText("clock (GHz)", e - 90, t - 14),
        i.fillText("power", 2, 20));
      for (let h = 1; h <= 5; h++) i.fillText(h, o(h) - 3, t - 18);
    },
    smt(i, e, t, n, s) {
      let r = s.hw || [],
        o = s.tasks || [],
        a = Math.max(1, Math.ceil(r.length / 2)),
        l = (e - 20) / Math.min(a, 8);
      r.forEach((c, h) => {
        let d = c.core ?? h,
          u = r.filter((g, m) => m < h && g.core === d).length,
          f = 10 + d * l,
          p = 26 + (u * (t - 60)) / 2,
          x = c.task != null ? (typeof c.task == "object" ? c.task : o[c.task]) : null;
        (bn(
          i,
          f + 4,
          p,
          l - 8,
          (t - 70) / 2,
          x ? x.color || Z.acc : "#141b25",
          "#445",
          6,
        ),
          (i.fillStyle = x ? "#000" : Z.dim),
          (i.font = Ce(11, "600")),
          i.fillText(`T${h}: ${x ? x.name : "idle"}`, f + 10, p + 18, l - 16));
      });
      for (let c = 0; c < a; c++)
        ((i.strokeStyle = Z.acc),
          i.strokeRect(10 + c * l + 2, 22, l - 4, t - 54),
          (i.fillStyle = Z.acc),
          (i.font = Ce(11, "700")),
          i.fillText("core " + c, 10 + c * l + 8, 16));
      ((i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          "two hardware threads share each core's execution units",
          8,
          t - 6,
          e - 12,
        ));
    },
    simt(i, e, t, n, s) {
      let a = (e - 20) / 32,
        l = (t - 30) / 12,
        c = s.frame || Math.floor(n * 30);
      for (let h = 0; h < 12; h++)
        for (let d = 0; d < 32; d++) {
          let u = (h * 7 + c) % 12 < 4,
            f = (d + h + c) % 11 === 0;
          ((i.fillStyle = u
            ? f
              ? Z.acc2
              : `hsl(${(d * 11 + h * 30 + c * 3) % 360},80%,55%)`
            : "#141b25"),
            i.fillRect(10 + d * a, 10 + h * l, a - 1, l - 1));
        }
      ((i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          `frame ${c}: 12 warps × 32 lanes, same instruction per warp · orange = divergent lane`,
          8,
          t - 6,
          e - 12,
        ));
    },
    mac(i, e, t, n, s) {
      let r = s.W || [],
        o = s.sizes || [2, 4],
        a = Math.min(8, o[1] || 4),
        l = Math.min(2, o[0] || 2),
        c = 1e-6;
      for (let u of r) c = Math.max(c, Math.abs(u));
      let h = [Math.sin(n), Math.cos(n * 0.7)],
        d = Math.min((e - 160) / l, (t - 40) / a);
      i.font = Ce(11);
      for (let u = 0; u < a; u++) {
        let f = 0;
        for (let x = 0; x < l; x++) {
          let g = r[u * l + x] || 0;
          f += g * h[x];
          let m = Math.abs(g) / c;
          ((i.fillStyle =
            g >= 0
              ? `rgba(88,196,255,${0.15 + m * 0.85})`
              : `rgba(255,107,107,${0.15 + m * 0.85})`),
            i.fillRect(40 + x * d, 20 + u * d, d - 3, d - 3),
            (i.fillStyle = "#000"),
            i.fillText(g.toFixed(2), 44 + x * d, 20 + u * d + d / 2 + 4, d - 8));
        }
        let p = (n * 2 + u * 0.15) % 1;
        ((i.fillStyle = Z.acc2),
          i.beginPath(),
          i.arc(40 + p * l * d, 20 + u * d + d / 2, 3, 0, 7),
          i.fill(),
          (i.fillStyle = f >= 0 ? Z.ok : Z.bad),
          i.fillText("Σ " + f.toFixed(3), 50 + l * d, 20 + u * d + d / 2 + 4));
      }
      ((i.fillStyle = Z.dim),
        i.fillText(`x = [${h.map((u) => u.toFixed(2)).join(", ")}]`, 50 + l * d, 14),
        (i.fillStyle = Z.ink),
        i.fillText(
          "live layer-1 weights × input → multiply-accumulate",
          8,
          t - 6,
          e - 12,
        ));
    },
    heat(i, e, t, n, s) {
      let r = s.util || [],
        o = Math.max(
          1,
          r.reduce((l, c) => l + c, 0),
        ),
        a = (e - 30) / 4;
      for (let l = 0; l < 4; l++) {
        let c = (r[l] || 0) / (o / Math.max(1, r.length || 1)),
          h = 10 + l * (a + 3),
          d = 10,
          u = (a - 4) / d;
        for (let f = 0; f < d; f++)
          for (let p = 0; p < d; p++) {
            let x = Math.hypot(f - d / 2 + 0.5, p - d / 2 + 0.5) / (d / 2),
              g =
                35 +
                (r[l] ? 50 * c : 0) *
                  (1 - x * 0.6) *
                  (0.9 + 0.1 * Math.sin(n * 5 + f + p));
            ((i.fillStyle = `hsl(${240 - Math.min(240, (g - 30) * 4)},90%,50%)`),
              i.fillRect(h + f * u, 20 + p * u, u - 1, u - 1));
          }
        ((i.fillStyle = Z.ink),
          (i.font = Ce(11)),
          i.fillText(
            `GPU${l} ${r[l] ? "~" + Math.round(35 + 50 * c) + "°C" : "idle"}`,
            h,
            14,
          ));
      }
      ((i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          "~50 W/cm²: heat is pulled off each die by a cold plate",
          8,
          t - 6,
          e - 12,
        ));
    },
    neuron(i, e, t, n, s) {
      let r = this._vh || (this._vh = []);
      (r.push(s.v), r.length > 300 && r.shift());
      let o = (a) => t * 0.5 - ((a + 50) / 90) * t * 0.7;
      ((i.strokeStyle = "#334"),
        i.setLineDash([4, 4]),
        [
          [30, "peak +30 mV"],
          [-55, "threshold ≈ −55"],
          [-65, "rest −65 mV"],
        ].forEach(([a, l]) => {
          (i.beginPath(),
            i.moveTo(0, o(a)),
            i.lineTo(e, o(a)),
            i.stroke(),
            (i.fillStyle = Z.dim),
            (i.font = Ce(10)),
            i.fillText(l, e - 110, o(a) - 3));
        }),
        i.setLineDash([]),
        (i.strokeStyle = Z.pink),
        (i.lineWidth = 2),
        i.beginPath(),
        r.forEach((a, l) => {
          let c = (l / 300) * e;
          l ? i.lineTo(c, o(Math.min(30, a))) : i.moveTo(c, o(a));
        }),
        i.stroke(),
        (i.lineWidth = 1),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          `motor neuron #0: v = ${s.v.toFixed(1)} mV, u = ${s.u.toFixed(2)}`,
          8,
          t - 6,
          e - 12,
        ));
    },
    ion(i, e, t, n, s) {
      let r = s.v,
        o = r > -40,
        a = t * 0.42,
        l = t * 0.58;
      ((i.fillStyle = "#3a2f4a"),
        i.fillRect(0, a, e, l - a),
        (i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText("outside: high Na⁺", 8, 16),
        i.fillText("inside: high K⁺", 8, t - 22));
      for (let c = 0; c < 6; c++) {
        let h = e * (0.12 + c * 0.15),
          d = c % 2 === 0;
        ((i.fillStyle = d
          ? o
            ? Z.acc2
            : "#7a6040"
          : r > 0 || (o && c % 4 === 1)
            ? Z.ok
            : "#3f6a4a"),
          i.fillRect(h - 8, a - 4, 16, l - a + 8),
          (i.fillStyle = Z.ink),
          i.fillText(d ? "Na⁺" : "K⁺", h - 10, a - 8));
      }
      for (let c = 0; c < 30; c++) {
        let h = (c * 53 + n * 20) % e,
          d = c % 2,
          u = d ? l + 14 + ((c * 7) % (t * 0.3)) : 24 + ((c * 11) % (a - 30));
        ((i.fillStyle = d ? Z.ok : Z.acc2),
          i.beginPath(),
          i.arc(h, u, 2.5, 0, 7),
          i.fill());
      }
      if (o)
        for (let c = 0; c < 6; c++) {
          let h = (n * 3 + c / 6) % 1;
          ((i.fillStyle = Z.acc2),
            i.beginPath(),
            i.arc(e * (0.12 + (c % 3) * 0.3), a + h * (l - a + 20) - 10, 3, 0, 7),
            i.fill());
        }
      ((i.fillStyle = Z.ink),
        i.fillText(
          `membrane ${r.toFixed(1)} mV · ${o ? "SPIKE: Na⁺ channels open → depolarising" : "resting: channels mostly closed"}`,
          8,
          t - 6,
          e - 12,
        ));
    },
    qcircuit(i, e, t, n, s) {
      let r = s.n || 2,
        o = s.ops || [],
        a = Math.max(
          1,
          o.reduce((h, d) => Math.max(h, d.col + 1), 0),
        ),
        l = (t - 30) / r,
        c = (e - 60) / Math.max(a, 4);
      for (let h = 0; h < r; h++)
        ((i.strokeStyle = "#556"),
          i.beginPath(),
          i.moveTo(40, 14 + h * l + l / 2),
          i.lineTo(e - 10, 14 + h * l + l / 2),
          i.stroke(),
          (i.fillStyle = ["#58c4ff", "#ff9f43", "#5fe08a"][h]),
          (i.font = Ce(11, "600")),
          i.fillText(Qn[r].nuclei[h], 4, 18 + h * l + l / 2));
      (o.forEach((h) => {
        let d = 46 + h.col * c,
          u = s.step === 1 / 0 || h.col < s.step;
        if (((i.globalAlpha = u ? 1 : 0.35), br(h.g) === 1)) {
          let f = h.q[0],
            p = 14 + f * l + l / 2,
            x = Math.min(l * 0.7, 12 + (Math.abs(h.th || Math.PI / 2) / Math.PI) * 20);
          ((i.fillStyle = "#ff9f43"),
            i.fillRect(d, p - x / 2, c * 0.5, x),
            (i.fillStyle = "#000"),
            (i.font = Ce(10, "700")),
            i.fillText(h.g, d + 2, p + 4));
        } else {
          let f = Math.min(...h.q),
            p = Math.max(...h.q);
          ((i.fillStyle = "rgba(181,140,255,.4)"),
            i.fillRect(d, 14 + f * l + 4, c * 0.85, (p - f + 1) * l - 8),
            (i.fillStyle = Z.ink),
            (i.font = Ce(10)),
            i.fillText("J " + h.g, d + 3, 14 + f * l + 16));
        }
        i.globalAlpha = 1;
      }),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          "orange: selective RF pulse · violet: J-coupling evolution (2-qubit gate)",
          8,
          t - 6,
          e - 12,
        ));
    },
    spins(i, e, t, n, s) {
      let r = s.state,
        o = s.n || 2;
      if (!r) return;
      let a = e / o;
      for (let l = 0; l < o; l++) {
        let c = r.bloch(l),
          h = a * (l + 0.5),
          d = t * 0.5,
          u = Math.min(a * 0.35, t * 0.38);
        ((i.strokeStyle = "#334"),
          i.beginPath(),
          i.ellipse(h, d + u * 0.6, u, u * 0.3, 0, 0, 7),
          i.stroke(),
          i.beginPath(),
          i.moveTo(h, d + u),
          i.lineTo(h, d - u),
          i.stroke());
        let f = n * (2 + l),
          p = c.x * Math.cos(f) - c.y * Math.sin(f),
          x = c.x * Math.sin(f) + c.y * Math.cos(f),
          g = h + p * u,
          m = d + u * 0.6 - c.z * u * 0.9 + x * u * 0.3 - u * 0.6;
        ((i.strokeStyle = ["#58c4ff", "#ff9f43", "#5fe08a"][l]),
          (i.lineWidth = 3),
          i.beginPath(),
          i.moveTo(h, d),
          i.lineTo(g, m),
          i.stroke(),
          (i.lineWidth = 1),
          (i.fillStyle = i.strokeStyle),
          i.beginPath(),
          i.arc(g, m, 4, 0, 7),
          i.fill(),
          (i.fillStyle = Z.dim),
          (i.font = Ce(11)),
          i.fillText(
            `${Qn[o].nuclei[l]} · transverse ${Math.hypot(c.x, c.y).toFixed(2)} · z ${c.z.toFixed(2)}`,
            h - u,
            t - 8,
            a - 6,
          ),
          i.fillText("B₀ ↑", h + 4, d - u + 10));
      }
    },
    fid(i, e, t, n, s) {
      let r = s.state,
        o = s.n || 2;
      if (!r) return;
      let a = o0(o, r.probs()).flatMap((d, u) =>
          d.peaks.map((f) => ({ ...f, f: f.f + (u - (o - 1) / 2) * 900 })),
        ),
        l = t * 0.32;
      ((i.strokeStyle = Z.ok), i.beginPath());
      for (let d = 0; d <= 400; d++) {
        let u = (d / 400) * 0.05,
          f = 0;
        for (let x of a)
          f += x.a * Math.cos(2 * Math.PI * (x.f + 2e3) * u) * Math.exp(-u / 0.02);
        let p = 8 + (d / 400) * (e - 16);
        d ? i.lineTo(p, l - f * t * 0.12) : i.moveTo(p, l - f * t * 0.12);
      }
      (i.stroke(),
        (i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText("FID (time domain, decays with T₂*)", 8, 14),
        i.fillText(
          "FFT → spectrum (line sign/size = population differences)",
          8,
          t * 0.62,
        ));
      let c = t * 0.85;
      ((i.strokeStyle = "#334"),
        i.beginPath(),
        i.moveTo(8, c),
        i.lineTo(e - 8, c),
        i.stroke());
      let h = 1600;
      for (let d of a) {
        let u = e / 2 + (d.f / h) * (e * 0.45);
        ((i.strokeStyle = d.a >= 0 ? Z.acc : Z.bad),
          (i.lineWidth = 3),
          i.beginPath(),
          i.moveTo(u, c),
          i.lineTo(u, c - d.a * t * 0.18),
          i.stroke(),
          (i.lineWidth = 1));
      }
    },
    raster(i, e, t, n, s) {
      let r = s.raster || [],
        o = s.nS || 40,
        a = s.t,
        l = 64,
        c = (e - 50) / l,
        h = (t - 30) / 8,
        d = Array.from({ length: 8 }, () => new Uint8Array(l));
      for (let u = r.length - 1; u >= 0; u--) {
        let [f, p] = r[u];
        if (a - f >= l) break;
        p < o && (d[Math.floor(p / 5)][l - 1 - (a - 1 - f)] = 1);
      }
      i.font = Ce(10);
      for (let u = 0; u < 8; u++) {
        ((i.fillStyle = Z.dim), i.fillText("e" + u, 4, 20 + u * h));
        for (let f = 0; f < l; f++)
          ((i.fillStyle = d[u][f] ? Z.acc2 : "#141b25"),
            i.fillRect(40 + f * c, 10 + u * h, c - 1, h - 2));
      }
      ((i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          "1 = spike in that 1 ms bin (sensory electrodes), last 64 ms",
          8,
          t - 6,
          e - 12,
        ));
    },
    wave(i, e, t, n, s) {
      let r = this._wh || (this._wh = []);
      (r.push(s.volt || 0), r.length > 400 && r.shift());
      let o = t / 2,
        a = (t * 0.4) / (s.vmax || 1.2);
      ((i.strokeStyle = "#334"),
        i.beginPath(),
        i.moveTo(0, o),
        i.lineTo(e, o),
        i.stroke(),
        (i.strokeStyle = Z.acc2),
        (i.lineWidth = 2),
        i.beginPath(),
        r.forEach((l, c) => {
          let h = (c / 400) * e;
          c ? i.lineTo(h, o - l * a) : i.moveTo(h, o - l * a);
        }),
        i.stroke(),
        (i.lineWidth = 1),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          `${s.vname} = ${((s.volt || 0) * 100).toFixed(2)} V: a continuous voltage, no sampling, no bits`,
          8,
          t - 6,
          e - 12,
        ));
    },
    float(i, e, t, n, s) {
      let r = new Float32Array([s.f32 || 0]),
        o = new Uint32Array(r.buffer)[0],
        a = km(o, 32),
        l = (e - 20) / 32;
      a.forEach((u, f) => {
        let p = f === 0 ? Z.bad : f < 9 ? Z.acc2 : f < 16 ? Z.ok : "#3a7bd5";
        ((i.fillStyle = u ? p : "#141b25"),
          i.fillRect(10 + f * l, 30, l - 2, 40),
          (i.fillStyle = u ? "#000" : Z.dim),
          (i.font = Ce(Math.min(14, l), "700")),
          i.fillText(u, 10 + f * l + l / 2 - 4, 56));
      });
      let c = (o >>> 23) & 255,
        h = o & 8388607;
      ((i.fillStyle = Z.ink),
        (i.font = Ce(12)),
        i.fillText(
          `w = ${r[0].toPrecision(7)} = (−1)^${o >>> 31} × 1.${h.toString(2).padStart(23, "0").slice(0, 10)}…₂ × 2^(${c}−127)`,
          10,
          92,
          e - 20,
        ),
        (i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText(
          "red sign · orange exponent · green+blue mantissa · bf16 keeps only red+orange+green",
          10,
          112,
          e - 20,
        ));
      let d = new Uint32Array([o & 4294901760]);
      i.fillText("as bfloat16: " + new Float32Array(d.buffer)[0].toPrecision(4), 10, 130);
    },
    bits(i, e, t, n, s, r) {
      let o = s.word || { v: 0, bits: 8, label: "" },
        a = o.bits,
        l = km(o.v >>> 0, a),
        c = (e - 20) / a,
        h = r.levels || ["0", "1"];
      l.forEach((f, p) => {
        let x = o.split && p && p % o.split === 0;
        ((i.fillStyle = f ? Z.acc2 : "#141b25"),
          i.fillRect(10 + p * c + (x ? 2 : 0), 24, c - 2, 26),
          (i.fillStyle = f ? "#000" : Z.dim),
          (i.font = Ce(Math.min(13, c * 0.8), "700")),
          i.fillText(f, 10 + p * c + c / 2 - 4, 42));
      });
      let d = t * 0.78,
        u = t * 0.5;
      ((i.strokeStyle = Z.ok),
        (i.lineWidth = 2),
        i.beginPath(),
        l.forEach((f, p) => {
          let x = 10 + p * c,
            g = f ? u : d;
          (p ? i.lineTo(x, g) : i.moveTo(x, g), i.lineTo(x + c, g));
        }),
        i.stroke(),
        (i.lineWidth = 1),
        (i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText(h[1], e - 60, u - 4),
        i.fillText(h[0], e - 60, d + 14),
        (i.fillStyle = Z.ink),
        i.fillText(o.label, 10, 16, e - 20));
    },
    tape(i, e, t, n, s, r) {
      let o = s.tm;
      if (!o) return;
      let a = 15,
        l = (e - 20) / a,
        c = 34,
        h = Math.min(46, l * 1.1);
      for (let u = 0; u < a; u++) {
        let f = o.head - 7 + u,
          p = 10 + u * l,
          x = o.read(f),
          g = u === 7;
        (bn(i, p + 1, c, l - 2, h, g ? "#2a2414" : "#efe4c2", g ? Z.acc2 : "#9a8a60", 3),
          (i.fillStyle = g ? Z.acc2 : "#1a1208"),
          (i.font = Ce(Math.min(22, l * 0.6), "700")),
          (x !== o.p.blank || o.p.blank !== "_") &&
            i.fillText(x, p + l / 2 - 6, c + h / 2 + 7),
          (i.fillStyle = Z.dim),
          (i.font = Ce(9)),
          f % 5 === 0 && i.fillText(f, p + 3, c + h + 12));
      }
      let d = 10 + 7.5 * l;
      ((i.fillStyle = Z.acc2),
        i.beginPath(),
        i.moveTo(d, c - 4),
        i.lineTo(d - 9, c - 18),
        i.lineTo(d + 9, c - 18),
        i.fill(),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11, "600")),
        i.fillText("head", d + 12, c - 8),
        r.mode === "devices"
          ? (bn(i, e * 0.3, c + h + 24, e * 0.4, 40, "#0f1d2b", Z.acc, 6),
            (i.fillStyle = Z.acc),
            (i.font = Ce(13, "700")),
            i.fillText("state = " + o.state, e * 0.3 + 10, c + h + 50, e * 0.38),
            (i.strokeStyle = Z.acc),
            i.beginPath(),
            i.moveTo(d, c + h),
            i.lineTo(d, c + h + 24),
            i.stroke(),
            (i.fillStyle = Z.ink),
            (i.font = Ce(11)),
            i.fillText(
              "devices: square (holds 1 symbol) · head (reads/writes 1 square) · register (1 of " +
                o.p.states.length +
                " states) · table (" +
                o.p.rules.size +
                " rules)",
              8,
              t - 8,
              e - 12,
            ))
          : ((i.fillStyle = Z.ink),
            (i.font = Ce(11)),
            [
              "Idealised physics: symbols are perfect marks, never smudged or misread;",
              "each step is one discrete, noiseless event; the tape never runs out.",
              `steps ${o.steps} · squares visited ${o.maxX - o.minX + 1} · non-blank ${o.tape.size}${o.halted ? " · HALTED" : ""}`,
              "Real machines approximate this with noise margins (Z1 plates, valves, transistors).",
            ].forEach((f, p) => {
              ((i.fillStyle = p === 2 ? Z.acc2 : Z.ink),
                i.fillText(f, 8, c + h + 34 + p * 16, e - 12));
            })));
    },
    tmstate(i, e, t, n, s) {
      let r = s.tm;
      if (!r) return;
      let o = r.p,
        a = (g) => /^(H|HALT|halt|accept|reject|Y)$/.test(g),
        l = [...o.states],
        c = l.length,
        h = e / 2,
        d = t / 2 - 6,
        u = Math.min(e * 0.36, t * 0.36),
        f = Math.max(12, Math.min(22, 120 / c)),
        p = {};
      l.forEach((g, m) => {
        let S = -Math.PI / 2 + (m / c) * Math.PI * 2;
        p[g] = [h + Math.cos(S) * u, d + Math.sin(S) * u];
      });
      let x = new Map();
      for (let g of o.rules.values()) {
        let m = g.q + ">" + g.nx;
        (x.has(m) || x.set(m, []), x.get(m).push(g));
      }
      i.font = Ce(10);
      for (let [g, m] of x) {
        let S = m[0],
          b = p[S.q],
          y = p[S.nx];
        if (!b || !y) continue;
        let E = r.last && m.some((T) => T.q === r.last.from && T.s === r.last.s);
        ((i.strokeStyle = E ? Z.acc2 : "#556"), (i.lineWidth = E ? 2.5 : 1));
        let M = m.map((T) => `${T.s}→${T.w}${T.mv}`).join(" ");
        if (S.q === S.nx) {
          let T = Math.atan2(b[1] - d, b[0] - h),
            A = b[0] + Math.cos(T) * f * 1.6,
            w = b[1] + Math.sin(T) * f * 1.6;
          (i.beginPath(),
            i.arc(A, w, f * 0.75, 0, 7),
            i.stroke(),
            (i.fillStyle = E ? Z.acc2 : Z.dim),
            i.fillText(M, A - 20, w + (Math.sin(T) > 0 ? f * 1.5 : -f * 1.1), 120));
        } else {
          let T = y[0] - b[0],
            A = y[1] - b[1],
            w = Math.hypot(T, A) || 1,
            v = (-A / w) * 10,
            R = (T / w) * 10,
            _ = b[0] + (T / w) * f + v,
            P = b[1] + (A / w) * f + R,
            V = y[0] - (T / w) * f + v,
            k = y[1] - (A / w) * f + R;
          (i.beginPath(), i.moveTo(_, P), i.lineTo(V, k), i.stroke());
          let L = Math.atan2(k - P, V - _);
          (i.beginPath(),
            i.moveTo(V, k),
            i.lineTo(V - 8 * Math.cos(L - 0.4), k - 8 * Math.sin(L - 0.4)),
            i.lineTo(V - 8 * Math.cos(L + 0.4), k - 8 * Math.sin(L + 0.4)),
            i.closePath(),
            (i.fillStyle = i.strokeStyle),
            i.fill(),
            (i.fillStyle = E ? Z.acc2 : Z.dim),
            i.fillText(M, (_ + V) / 2 + v * 0.6 - 16, (P + k) / 2 + R * 0.6, 130));
        }
      }
      i.lineWidth = 1;
      for (let g of l) {
        let [m, S] = p[g],
          b = g === r.state;
        (i.beginPath(),
          i.arc(m, S, f, 0, 7),
          (i.fillStyle = b ? (r.halted ? Z.bad : Z.acc) : "#141b25"),
          i.fill(),
          (i.strokeStyle = a(g) ? Z.bad : g === o.start ? Z.ok : Z.acc),
          (i.lineWidth = a(g) ? 3 : 1.5),
          i.stroke(),
          a(g) && (i.beginPath(), i.arc(m, S, f - 4, 0, 7), i.stroke()),
          (i.lineWidth = 1),
          (i.fillStyle = b ? "#000" : Z.ink),
          (i.font = Ce(Math.min(13, f * 0.7), "700")),
          i.fillText(g.slice(0, 6), m - i.measureText(g.slice(0, 6)).width / 2, S + 4));
      }
      ((i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          `finite control as a state diagram · edge label read→write,move · green = start, double ring = halt · now: ${r.state}`,
          8,
          t - 6,
          e - 12,
        ));
    },
    tmsd(i, e, t, n, s) {
      let r = s.sd || { sd: "", dn: "" },
        o = {
          A: Z.acc,
          C: Z.ok,
          D: Z.acc2,
          L: Z.vio,
          R: Z.vio,
          N: Z.vio,
          ";": Z.bad,
        },
        a = 12,
        l = 8.2,
        c = Math.floor((e - 20) / l);
      ((i.font = Ce(a, "700")),
        (i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText(
          "standard description (Turing 1936 §5): D A…=state, D C…=symbol, L/R/N move, ; ends a rule",
          8,
          14,
          e - 12,
        ),
        (i.font = Ce(a, "700")));
      let h = r.sd.slice(0, c * 7);
      for (let f = 0; f < h.length; f++)
        ((i.fillStyle = o[h[f]] || Z.ink),
          i.fillText(h[f], 10 + (f % c) * l, 32 + Math.floor(f / c) * 15));
      let d = 145;
      ((i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText(
          "description number (A1 C2 D3 L4 R5 N6 ;7): the machine as one integer on U's tape",
          8,
          d,
          e - 12,
        ),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11)));
      let u = r.dn.slice(0, c * 3);
      for (let f = 0; f * c < u.length; f++)
        i.fillText(u.slice(f * c, (f + 1) * c), 10, d + 16 + f * 14);
    },
    plates(i, e, t, n, s, r) {
      let o = s.a >>> 0,
        a = s.b >>> 0,
        l = (((s.phase ?? n * 0.5) % 1) + 1) % 1,
        c = Math.floor(l * 4),
        h = Math.sin(l * Math.PI * 2);
      if (r.mode === "physics") {
        let E = o & 1,
          M = e * 0.5,
          T = t * 0.25,
          A = t * 0.48,
          w = t * 0.7,
          v = 26,
          R = (k, L, z, F, H) => {
            ((i.fillStyle = F),
              i.fillRect(k - z / 2, L - 6, z, 12),
              (i.fillStyle = Z.ink),
              (i.font = Ce(11)),
              i.fillText(H, k + z / 2 + 8, L + 4, e - k - z / 2 - 10));
          },
          _ = M + (E ? 18 : -18);
        R(_, T, e * 0.34, "#8d939b", `control plate (bit = ${E})`);
        let P = M + h * v;
        R(P, A, e * 0.34, "#c9a24a", "actor plate (the clock)");
        let V = M + (E ? h * v : 0);
        (R(
          V,
          w,
          e * 0.34,
          E ? "#ffb347" : "#5a5f66",
          E ? "actuated plate: follows" : "actuated plate: stays",
        ),
          (i.strokeStyle = Z.ink),
          (i.lineWidth = 4),
          i.beginPath(),
          i.moveTo(_ + (E ? h * v * 0 : 0), T - 10),
          i.lineTo(_, w + 10),
          i.stroke(),
          (i.lineWidth = 1),
          (i.fillStyle = Z.dim),
          (i.font = Ce(10)),
          i.fillText("rod (pin) through slots in all three plates", _ + 6, T + 22),
          (i.fillStyle = Z.ink),
          (i.font = Ce(11)),
          i.fillText(
            `engagement ${["IV", "I", "II", "III"][c]} of 4 · thin steel sheets sliding on each other: friction, play and bending,`,
            8,
            t - 20,
            e - 12,
          ),
          i.fillText(
            "not electronics, limit speed: the Berlin replica rarely ran reliably even at 1 Hz.",
            8,
            t - 6,
            e - 12,
          ));
        return;
      }
      let d = 8,
        u = (e - 20) / d,
        f = 0,
        p = [],
        x = [];
      for (let E = 0; E < d; E++) {
        let M = (o >> E) & 1,
          T = (a >> E) & 1;
        (p.push(M ^ T), x.push(M & T));
      }
      let g = (o + a) & 255,
        m = 150,
        S = (e - m - 10) / d,
        b = [6, 30, 58, 82, 110];
      ([
        ["IV", "a  (R1 bit)"],
        ["IV", "b  (R2 bit)"],
        ["I", "x = a XOR b"],
        ["II", "c = a AND b (carry)"],
        ["III", "s = sum"],
      ].forEach(([E, M], T) => {
        let A = c >= [0, 0, 1, 2, 3][T];
        ((i.font = Ce(11, "700")),
          (i.fillStyle = A ? Z.acc2 : Z.dim),
          i.fillText(E, 8, b[T] + 15),
          (i.font = Ce(10)),
          (i.fillStyle = A ? Z.ink : Z.dim),
          i.fillText(M, 34, b[T] + 15, m - 38));
      }),
        (i.font = Ce(11, "600")));
      for (let E = 0; E < d; E++) {
        let M = d - 1 - E,
          T = m + E * S,
          A = (o >> M) & 1,
          w = (a >> M) & 1,
          v = (_, P, V) => {
            (bn(
              i,
              T + 2,
              b[_],
              S - 4,
              20,
              V ? (P ? "#3a2e12" : "#1a2230") : "#11161d",
              V ? (P ? Z.acc2 : "#556") : "#2a3340",
              4,
            ),
              (i.fillStyle = P ? Z.acc2 : Z.dim),
              i.fillText(String(P), T + S / 2 - 3, b[_] + 14));
          };
        (v(0, A, !0),
          v(1, w, !0),
          v(2, p[M], c >= 1),
          v(3, x[M], c >= 2),
          v(4, (g >> M) & 1, c >= 3));
        let R = (_, P) => {
          ((i.strokeStyle = P ? Z.ok : "#556"),
            (i.lineWidth = 2),
            i.beginPath(),
            i.moveTo(T + S / 2 - 7, _),
            i.lineTo(T + S / 2 + 7, _ - (P ? 0 : 6)),
            i.stroke(),
            (i.lineWidth = 1));
        };
        (R(54, A !== w), R(106, c >= 3));
      }
      ((i.fillStyle = Z.dim),
        (i.font = Ce(10)),
        i.fillText(
          `top 8 mantissa bits (hidden 1 first) · a + b = ${o} + ${a} = ${g} (mod 256)`,
          m,
          144,
          e - m - 10,
        ),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          `engagement ${["IV", "I", "II", "III"][c]} of 4 · switch = Zuse's mechanical relay (closes when its control plate is 1)`,
          8,
          t - 6,
          e - 12,
        ));
    },
    z1word(i, e, t, n, s) {
      let r = s.w,
        o = s.F || 16,
        a = 8 + o,
        l = (e - 20) / a;
      ((i.fillStyle = Z.dim),
        (i.font = Ce(11)),
        i.fillText(s.wlabel || "R1", 10, 14, e - 20));
      let c = r
        ? [
            r.s,
            ...Array.from({ length: 7 }, (f, p) => (r.e7 >> (6 - p)) & 1),
            ...Array.from(
              { length: o },
              (f, p) => Math.floor(r.frac / 2 ** (o - 1 - p)) % 2,
            ),
          ]
        : Array(a).fill(0);
      (c.forEach((f, p) => {
        let x = p === 0 ? Z.bad : p < 8 ? Z.acc2 : Z.ok;
        ((i.fillStyle = f ? x : "#141b25"),
          i.fillRect(10 + p * l, 22, l - 2, 28),
          (i.fillStyle = f ? "#000" : Z.dim),
          (i.font = Ce(Math.min(13, l * 0.8), "700")),
          i.fillText(f, 10 + p * l + l / 2 - 4, 41));
      }),
        (i.font = Ce(10)),
        [
          [0, 1, Z.bad, "sign"],
          [1, 8, Z.acc2, "exponent: 7-bit two's complement"],
          [8, a, Z.ok, `fraction: ${o} bits, leading 1 implied`],
        ].forEach(([f, p, x, g], m) => {
          ((i.fillStyle = x),
            i.fillRect(10 + f * l, 53, (p - f) * l - 2, 2),
            i.fillText(
              g,
              m === 0 || m === 1 ? 10 : 10 + 8 * l,
              66 + (m === 1 ? 12 : 0),
              e - 20,
            ));
        }));
      let h = s.code;
      if (h != null) {
        ((i.fillStyle = Z.ink),
          (i.font = Ce(11)),
          i.fillText(`film row for ${s.op}: ${h.toString(2).padStart(8, "0")}`, 10, 100));
        for (let f = 0; f < 8; f++) {
          let p = (h >> (7 - f)) & 1;
          ((i.fillStyle = p ? "#000" : "#5a4a30"),
            i.beginPath(),
            i.arc(e * 0.55 + f * 18, 96, p ? 6 : 2, 0, 7),
            i.fill(),
            (i.strokeStyle = "#9a8a60"),
            i.stroke());
        }
      }
      let d = t * 0.62,
        u = t * 0.42 + 20;
      ((i.strokeStyle = Z.ok),
        (i.lineWidth = 2),
        i.beginPath(),
        c.forEach((f, p) => {
          let x = 10 + p * l,
            g = f ? u : d + 20;
          (p ? i.lineTo(x, g) : i.moveTo(x, g), i.lineTo(x + l, g));
        }),
        i.stroke(),
        (i.lineWidth = 1),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11)),
        i.fillText(
          "no voltages: a 1 is a plate pushed ≈ one step along, a 0 is a plate at rest",
          10,
          t - 6,
          e - 20,
        ));
    },
    die6502(i, e, t, n, s) {
      if (!this._die || this._die.width !== Math.round(t * 0.95)) {
        let c = document.createElement("canvas");
        ((c.width = Math.round(t * 0.95)),
          (c.height = Math.round(t * 0.95 * 1.08)),
          Hs(c.getContext("2d"), c.width, c.height, "all", { bg: "#120f18" }),
          (this._die = c));
      }
      let r = (t - 8) / this._die.height,
        o = this._die.width * r;
      i.drawImage(this._die, 6, 4, o, t - 8);
      let a = o + 18;
      ((i.font = Ce(11, "700")),
        (i.fillStyle = Z.acc2),
        i.fillText("DIE (schematic floorplan)", a, 16, e - a - 4));
      let l = [
        ["metal (Al)", "rgba(128,128,192,0.9)"],
        ["switched diffusion", "#FFFF00"],
        ["ground diffusion", "#4DFF4D"],
        ["VCC diffusion", "#FF4D4D"],
        ["polysilicon", "#801AC0"],
        ["buried contact", "#FF00FF"],
        ["contact / via", "#e6e6ff"],
      ];
      ((i.font = Ce(10)),
        l.forEach(([c, h], d) => {
          ((i.fillStyle = h),
            i.fillRect(a, 26 + d * 15, 12, 10),
            (i.fillStyle = Z.ink),
            i.fillText(c, a + 18, 35 + d * 15, e - a - 20));
        }),
        (i.fillStyle = Z.dim),
        i.fillText(
          `40 bond pads · ${s.mode === "net" ? "real layout loaded on the 3D die" : "real layout: transistor-level mode"}`,
          a,
          141,
          e - a - 4,
        ),
        i.fillText(
          `AB $${(s.c?.a ?? 0).toString(16).padStart(4, "0")}  ${s.c?.rw ? "read" : "write"}`,
          a,
          158,
          e - a - 4,
        ));
    },
    blocks6502(i, e, t, n, s) {
      let r = s.c || {},
        o = r.regs || {},
        a = new Set((r.blk || "").split(" ")),
        l = (h, d = 2) => (h >>> 0).toString(16).toUpperCase().padStart(d, "0"),
        c = [
          ["pla", "DECODE ROM (PLA)", 0.02, 0.02, 0.5, 0.17, 1],
          ["rcl", "RANDOM CONTROL LOGIC", 0.54, 0.02, 0.44, 0.17, 1],
          ["timing", "TIMING T0–T6", 0.02, 0.22, 0.22, 0.13, 1],
          ["ir", `IR ${l(s.ir ?? 0)}`, 0.26, 0.22, 0.2, 0.13, r.sync],
          ["clk", `CLOCK φ${r.ph || 1}`, 0.48, 0.22, 0.2, 0.13, 1],
          [
            "p",
            `P ${(o.p >>> 0).toString(2).padStart(8, "0")}`,
            0.7,
            0.22,
            0.28,
            0.13,
            a.has("p"),
          ],
          [
            "ab",
            `ABH·ABL
${l(r.a ?? 0, 4)}`,
            0.02,
            0.42,
            0.14,
            0.24,
            1,
          ],
          [
            "y",
            `Y
${l(o.y)}`,
            0.18,
            0.42,
            0.09,
            0.24,
            0,
          ],
          [
            "x",
            `X
${l(o.x)}`,
            0.29,
            0.42,
            0.09,
            0.24,
            0,
          ],
          [
            "s",
            `S
${l(o.s)}`,
            0.4,
            0.42,
            0.09,
            0.24,
            a.has("s"),
          ],
          [
            "alu",
            `ALU
+DAA`,
            0.51,
            0.42,
            0.12,
            0.24,
            a.has("alu"),
          ],
          [
            "a",
            `A
${l(o.a)}`,
            0.65,
            0.42,
            0.08,
            0.24,
            a.has("alu"),
          ],
          [
            "pcl",
            `PCL
${l(o.pc & 255)}`,
            0.75,
            0.42,
            0.1,
            0.24,
            a.has("pc") || a.has("pcl"),
          ],
          [
            "pch",
            `PCH
${l(o.pc >> 8)}`,
            0.87,
            0.42,
            0.11,
            0.24,
            a.has("pch"),
          ],
          [
            "dl",
            `DATA LATCH ${r.rw && r.ph === 2 ? l(r.d) : "--"}`,
            0.02,
            0.72,
            0.46,
            0.11,
            r.rw,
          ],
          ["dor", `DATA OUT ${r.rw ? "--" : l(r.d)}`, 0.52, 0.72, 0.46, 0.11, !r.rw],
        ];
      for (let [h, d, u, f, p, x, g] of c) {
        let m = g ? 0.6 + 0.4 * Math.sin(n * 6) : 0;
        (bn(
          i,
          u * e,
          f * t,
          p * e,
          x * t,
          g ? `rgba(255,179,71,${0.15 + 0.25 * m})` : "#101822",
          g ? Z.acc2 : "#2a3a4c",
          5,
        ),
          (i.fillStyle = g ? "#fff" : Z.ink),
          (i.font = Ce(Math.min(12, t / 18), "700")),
          d
            .split(
              `
`,
            )
            .forEach((S, b) => i.fillText(S, u * e + 5, f * t + 14 + b * 14, p * e - 8)));
      }
      ((i.strokeStyle = Z.acc), (i.lineWidth = 2));
      for (let h of [0.39, 0.69])
        (i.beginPath(), i.moveTo(0.02 * e, h * t), i.lineTo(0.98 * e, h * t), i.stroke());
      ((i.fillStyle = Z.dim),
        (i.font = Ce(10)),
        i.fillText("internal buses: DB · SB · ADL · ADH", 0.02 * e, 0.385 * t),
        i.fillText(`${r.note || ""}`, 0.02 * e, t - 8, e - 10));
    },
    nmosgate(i, e, t, n, s) {
      let r = s.ga ?? Math.floor(n) & 1,
        o = s.gb ?? Math.floor(n / 2) & 1,
        a = e / 2,
        l = (c, h) => {
          let d = h ? !(r && o) : !(r || o),
            u = c + a * 0.42,
            f = 22,
            p = t * 0.42;
          ((i.strokeStyle = Z.ink),
            (i.lineWidth = 1.5),
            (i.font = Ce(10)),
            (i.fillStyle = Z.bad),
            i.fillText("VCC", u - 12, 14),
            i.beginPath(),
            i.moveTo(u, f - 4),
            i.lineTo(u, f + 6),
            i.stroke(),
            bn(i, u - 9, f + 6, 18, 30, "#3a2a10", Z.acc2, 2),
            (i.fillStyle = Z.acc2),
            i.fillText("depletion load", u + 14, f + 22),
            i.fillText("(always on)", u + 14, f + 34),
            (i.strokeStyle = Z.ink),
            i.beginPath(),
            i.moveTo(u, f + 36),
            i.lineTo(u, p),
            i.stroke(),
            (i.fillStyle = d ? Z.ok : Z.dim),
            i.beginPath(),
            i.arc(u, p, 4, 0, 7),
            i.fill(),
            (i.font = Ce(11, "700")),
            i.fillText(`OUT=${d ? 1 : 0}`, u + 10, p + 4));
          let x = (m, S, b, y) => {
            (bn(i, m - 9, S, 18, 26, b ? "#1f3a22" : "#141b25", b ? Z.ok : "#556", 2),
              (i.fillStyle = b ? Z.ok : Z.dim),
              (i.font = Ce(10)),
              i.fillText(`${y}=${b ? 1 : 0}`, m - 44, S + 17));
          };
          (h
            ? (x(u, p + 12, r, "A"),
              (i.strokeStyle = Z.ink),
              i.beginPath(),
              i.moveTo(u, p),
              i.lineTo(u, p + 12),
              i.moveTo(u, p + 38),
              i.lineTo(u, p + 48),
              i.stroke(),
              x(u, p + 48, o, "B"),
              i.beginPath(),
              i.moveTo(u, p + 74),
              i.lineTo(u, t - 22),
              i.stroke())
            : (i.beginPath(),
              i.moveTo(u - 24, p + 8),
              i.lineTo(u + 24, p + 8),
              i.moveTo(u, p),
              i.lineTo(u, p + 8),
              i.stroke(),
              x(u - 24, p + 14, r, "A"),
              x(u + 34, p + 14, o, "B"),
              i.beginPath(),
              i.moveTo(u - 24, p + 40),
              i.lineTo(u - 24, t - 22),
              i.moveTo(u + 34, p + 40),
              i.lineTo(u + 34, t - 22),
              i.lineTo(u - 24, t - 22),
              i.moveTo(u + 24, p + 8),
              i.lineTo(u + 34, p + 14),
              i.stroke()),
            (i.fillStyle = Z.ok),
            i.fillText("GND", u - 12, t - 8));
          let g = !d;
          if (g) {
            i.fillStyle = Z.acc2;
            for (let m = 0; m < 4; m++) {
              let S = f + 10 + ((n * 60 + m * 25) % (t - f - 40));
              (i.beginPath(),
                i.arc(u + (h ? 0 : -24 * (S > p + 8)), S, 2.5, 0, 7),
                i.fill());
            }
          }
          ((i.fillStyle = Z.ink),
            (i.font = Ce(11, "700")),
            i.fillText(h ? "NMOS NAND" : "NMOS NOR", c + 6, (t * 0.42 - 30 > 40, 14)),
            (i.font = Ce(10)),
            (i.fillStyle = g ? Z.acc2 : Z.dim),
            i.fillText(
              g ? "static current flows (NMOS burns power when low)" : "no current path",
              c + 6,
              t - 34 + 0,
              a - 10,
            ));
        };
      (l(0, !0),
        l(a, !1),
        (i.strokeStyle = "#2a3a4c"),
        i.beginPath(),
        i.moveTo(a, 6),
        i.lineTo(a, t - 6),
        i.stroke());
    },
    nmosphys(i, e, t, n, s) {
      let r = s.vg ?? Math.sin(n * 1.3) * 2.5 + 2.5,
        o = 1,
        a = r > o,
        l = t * 0.38,
        c = 20,
        h = e * 0.62;
      ((i.fillStyle = "#4a3a5a"),
        i.fillRect(c, l, h - c, t - l - 16),
        (i.fillStyle = Z.ink),
        (i.font = Ce(10)),
        i.fillText("p-type substrate (boron, ~10¹⁵ cm⁻³)", c + 6, t - 22),
        (i.fillStyle = "#d8c84a"),
        i.fillRect(c + 10, l, (h - c) * 0.25, 22),
        i.fillRect(h - 10 - (h - c) * 0.25, l, (h - c) * 0.25, 22),
        (i.fillStyle = "#000"),
        i.fillText("n+ source", c + 14, l + 15),
        i.fillText("n+ drain", h - (h - c) * 0.25, l + 15));
      let d = c + 10 + (h - c) * 0.25,
        u = h - 10 - (h - c) * 0.25;
      if (
        ((i.fillStyle = "#9fd0ff"),
        i.fillRect(d, l - 6, u - d, 6),
        (i.fillStyle = "#801AC0"),
        i.fillRect(d, l - 28, u - d, 22),
        (i.fillStyle = "#fff"),
        i.fillText("poly gate", d + 4, l - 13),
        (i.fillStyle = Z.dim),
        i.fillText("SiO₂ ~100 nm", u + 4, l - 2),
        a)
      ) {
        let m = Math.min(1, (r - o) / 3);
        ((i.fillStyle = `rgba(88,196,255,${0.4 + 0.5 * m})`),
          i.fillRect(d, l, u - d, 3 + 5 * m),
          (i.fillStyle = Z.acc));
        for (let S = 0; S < 6; S++) {
          let b = d + ((n * 80 * m + (S * (u - d)) / 6) % (u - d));
          (i.beginPath(), i.arc(b, l + 3, 2, 0, 7), i.fill());
        }
      }
      ((i.fillStyle = Z.ink),
        (i.font = Ce(11, "700")),
        i.fillText(
          `Vgs = ${r.toFixed(2)} V  ${a ? "> Vt: inversion layer → channel ON" : "< Vt: no channel, OFF"}`,
          c,
          16,
          e - 10,
        ),
        (i.font = Ce(10)),
        (i.fillStyle = Z.dim),
        i.fillText(
          "depletion load: implanted channel, Vt ≈ −3 V (always on)",
          c,
          30,
          h - c + 40,
        ));
      let f = e * 0.67,
        p = e - f - 10,
        x = 44,
        g = t - 70;
      ((i.strokeStyle = "#334"),
        i.strokeRect(f, x, p, g),
        (i.strokeStyle = Z.acc2),
        (i.lineWidth = 2),
        i.beginPath());
      for (let m = 0; m <= 50; m++) {
        let S = (m / 50) * 5,
          b = S > o ? (S - o) ** 2 : 0,
          y = f + (S / 5) * p,
          E = x + g - (b / 16) * g;
        m ? i.lineTo(y, E) : i.moveTo(y, E);
      }
      (i.stroke(),
        (i.lineWidth = 1),
        (i.fillStyle = Z.ok),
        i.beginPath(),
        i.arc(f + (r / 5) * p, x + g - ((r > o ? (r - o) ** 2 : 0) / 16) * g, 4, 0, 7),
        i.fill(),
        (i.fillStyle = Z.dim),
        i.fillText("Id ∝ (Vgs−Vt)²   Vt≈1 V", f + 2, x + 12, p - 4),
        i.fillText("0 … 5 V", f + 2, x + g + 12));
    },
    buscycle(i, e, t, n, s) {
      let r = (s.hist || []).slice(-28),
        o = Math.max(r.length, 1),
        a = (e - 70) / o,
        l = [
          ["φ2", (h) => h.ph === 2],
          ["R/W", (h) => h.rw],
          ["SYNC", (h) => h.sync],
        ];
      ((i.font = Ce(10)),
        l.forEach(([h, d], u) => {
          let f = 14 + u * 24;
          ((i.fillStyle = Z.dim),
            i.fillText(h, 4, f + 10),
            (i.strokeStyle = [Z.acc, Z.ok, Z.acc2][u]),
            (i.lineWidth = 2),
            i.beginPath(),
            r.forEach((p, x) => {
              let g = d(p) ? 1 : 0,
                m = 60 + x * a,
                S = f + (g ? 0 : 14);
              (x ? i.lineTo(m, S) : i.moveTo(m, S), i.lineTo(m + a, S));
            }),
            i.stroke());
        }),
        (i.lineWidth = 1));
      let c = 86;
      ((i.fillStyle = Z.dim),
        i.fillText("AB", 4, c + 10),
        i.fillText("DB", 4, c + 34),
        r.forEach((h, d) => {
          let u = 60 + d * a;
          h.ph === 1
            ? (bn(i, u, c, a * 2 - 2, 16, "#101822", "#2a3a4c", 3),
              (i.fillStyle = Z.ink),
              i.fillText(
                (h.a >>> 0).toString(16).padStart(4, "0"),
                u + 2,
                c + 12,
                a * 2 - 4,
              ))
            : (bn(i, u, c + 24, a - 1, 16, h.rw ? "#0f2418" : "#2a1a0a", "#2a3a4c", 3),
              (i.fillStyle = h.rw ? Z.ok : Z.acc2),
              i.fillText(
                (h.d >>> 0).toString(16).padStart(2, "0"),
                u + 2,
                c + 36,
                a - 3,
              ));
        }),
        (i.fillStyle = Z.ink),
        i.fillText(
          "φ1: CPU drives address + R/W · φ2: memory (R) or CPU (W) drives the data bus · 5 V NMOS logic levels",
          4,
          t - 6,
          e - 8,
        ));
    },
    mzi(i, e, t, n, s) {
      let r = s.th ?? 1,
        o = s.k ?? 0,
        a = Math.sin(r / 2) ** 2,
        l = 1 - a,
        c = t * 0.32,
        h = t * 0.62,
        d = 16,
        u = e * 0.6,
        f = (E, M) => {
          ((i.strokeStyle = `rgba(255,${(120 + 100 * M) | 0},${(120 + 80 * M) | 0},${0.3 + 0.7 * M})`),
            (i.lineWidth = 2 + 5 * M),
            i.beginPath(),
            E.forEach(([T, A], w) => (w ? i.lineTo(T, A) : i.moveTo(T, A))),
            i.stroke());
        },
        p = d + (u - d) * 0.2,
        x = d + (u - d) * 0.35,
        g = d + (u - d) * 0.65,
        m = d + (u - d) * 0.8,
        S = (c + h) / 2;
      (f(
        [
          [d, c],
          [p, S - 3],
        ],
        1,
      ),
        f(
          [
            [d, h],
            [p, S + 3],
          ],
          0,
        ),
        f(
          [
            [p, S - 3],
            [x, c],
            [g, c],
            [m, S - 3],
          ],
          0.5,
        ),
        f(
          [
            [p, S + 3],
            [x, h],
            [g, h],
            [m, S + 3],
          ],
          0.5,
        ),
        f(
          [
            [m, S - 3],
            [u, c],
          ],
          a,
        ),
        f(
          [
            [m, S + 3],
            [u, h],
          ],
          l,
        ),
        (i.fillStyle = Z.acc2),
        i.fillRect(x + 6, c - 12, g - x - 12, 6),
        (i.fillStyle = Z.ink),
        (i.font = Ce(10)),
        i.fillText(`heater θ = ${(r / Math.PI).toFixed(2)}π`, x, c - 16),
        i.fillText("50:50 coupler", p - 30, S + 24),
        i.fillText("50:50", m - 14, S + 24),
        (i.font = Ce(11, "700")),
        (i.fillStyle = Z.ok),
        i.fillText(`top ${(a * 100).toFixed(0)} %`, u + 4, c + 4),
        i.fillText(`bottom ${(l * 100).toFixed(0)} %`, u + 4, h + 4));
      let b = e * 0.08,
        y = t - 34;
      ((i.strokeStyle = "#334"),
        i.strokeRect(b, y - 2, e * 0.84, 28),
        (i.strokeStyle = Z.acc),
        i.beginPath());
      for (let E = 0; E <= 60; E++) {
        let M = (E / 60) * 2 * Math.PI,
          T = b + (E / 60) * e * 0.84,
          A = y + 24 - Math.sin(M / 2) ** 2 * 24;
        E ? i.lineTo(T, A) : i.moveTo(T, A);
      }
      (i.stroke(),
        (i.fillStyle = Z.acc2),
        i.beginPath(),
        i.arc(
          b + ((((r % 6.2832) + 6.2832) % 6.2832) / 6.2832) * e * 0.84,
          y + 24 - a * 24,
          4,
          0,
          7,
        ),
        i.fill(),
        (i.fillStyle = Z.dim),
        (i.font = Ce(10)),
        i.fillText(
          `MZI ${o + 1}: P_top = sin²(θ/2) — interference turns a phase into a split ratio`,
          6,
          14,
          e - 10,
        ));
    },
    meshviz(i, e, t, n, s) {
      let r = s.trace || [],
        o = 4,
        a = r.length;
      if (!a) return;
      let l = (e * 0.62 - 20) / (a - 1),
        c = (d) => 20 + (d * (t - 40)) / (o - 1);
      for (let d = 0; d < a - 1; d++)
        for (let u = 0; u < o; u++) {
          let f = (r[d][u] + r[d + 1][u]) / 2;
          ((i.strokeStyle = `rgba(255,${(110 + 120 * f) | 0},${(110 + 90 * f) | 0},${0.25 + 0.75 * Math.min(1, f)})`),
            (i.lineWidth = 1.5 + 6 * Math.min(1, f)),
            i.beginPath(),
            i.moveTo(10 + d * l, c(u)),
            i.lineTo(10 + (d + 1) * l, c(u)),
            i.stroke());
        }
      for (let d of s.mzis || []) {
        let u = 10 + (d.col + 0.5) * l,
          f = (c(d.m) + c(d.m + 1)) / 2;
        (bn(i, u - 12, f - 10, 24, 20, "#1a2030", Z.acc2, 4),
          (i.fillStyle = Z.acc2),
          (i.font = Ce(9)),
          i.fillText((d.th / Math.PI).toFixed(1) + "π", u - 11, f + 4));
      }
      let h = s.U;
      if (h) {
        let d = e * 0.66,
          u = Math.min((e - d - 8) / 4, (t - 30) / 4);
        ((i.fillStyle = Z.dim),
          (i.font = Ce(10)),
          i.fillText("|U| (colour = phase)", d, 12));
        for (let f = 0; f < 4; f++)
          for (let p = 0; p < 4; p++) {
            let x = h[f][p],
              g = Math.hypot(x.re, x.im),
              m = Math.atan2(x.im, x.re);
            ((i.fillStyle = `hsl(${((m / Math.PI) * 180 + 360) % 360},80%,${8 + g * 55}%)`),
              i.fillRect(d + p * u, 18 + f * u, u - 2, u - 2));
          }
        ((i.fillStyle = Z.ink), i.fillText(s.flabel || "", d, t - 4, e - d - 4));
      }
    },
    waveguide(i, e, t, n, s) {
      let r = e * 0.3,
        o = t * 0.5,
        a = e * 0.22,
        l = t * 0.16;
      ((i.fillStyle = "#26324a"),
        i.fillRect(10, o + l / 2, e * 0.56, t - o - l / 2 - 10),
        (i.fillStyle = "#1b2333"),
        i.fillRect(10, 20, e * 0.56, o + l / 2 - 20));
      let c = i.createRadialGradient(r, o, 2, r, o, a * 0.8);
      (c.addColorStop(0, "rgba(255,90,60,0.95)"),
        c.addColorStop(0.5, "rgba(255,60,40,0.45)"),
        c.addColorStop(1, "rgba(255,40,40,0)"),
        (i.fillStyle = c),
        i.beginPath(),
        i.ellipse(r, o, a * 0.85, l * 1.6, 0, 0, 7),
        i.fill(),
        (i.strokeStyle = "#c8d0e0"),
        (i.lineWidth = 2),
        i.strokeRect(r - a / 2, o - l / 2, a, l),
        (i.lineWidth = 1),
        (i.fillStyle = Z.ink),
        (i.font = Ce(10)),
        i.fillText("Si core 500 × 220 nm, n = 3.48", r - a / 2, o - l / 2 - 6),
        i.fillText("SiO₂ cladding n = 1.44 (buried oxide)", 14, t - 14),
        (i.fillStyle = Z.acc2),
        i.fillRect(r - a / 2, 26, a, 8),
        i.fillText("TiN heater", r + a / 2 + 4, 34));
      let h = (((s.th ?? 1) % 6.2832) + 6.2832) % 6.2832,
        d = 1e-4,
        u = 18e-5,
        f = 155e-8,
        p = (h * f) / (2 * Math.PI * d * u),
        x = e * 0.6;
      [
        ["λ = 1550 nm, TE mode confined by Δn ≈ 2", Z.ink],
        ["thermo-optic: dn/dT ≈ 1.8×10⁻⁴ K⁻¹", Z.ink],
        ["Δφ = 2π·L·Δn/λ, heater L = 100 µm", Z.ink],
        [`θ = ${(h / Math.PI).toFixed(2)}π  →  ΔT ≈ ${p.toFixed(1)} K`, Z.acc2],
        ["π shift ≈ 43 K over 100 µm", Z.dim],
        ["light speed in Si: c/n_g ≈ c/4.2", Z.dim],
        ["a 4×4 multiply ≈ a few ps of flight", Z.ok],
      ].forEach(([g, m], S) => {
        ((i.fillStyle = m), i.fillText(g, x, 20 + S * 16, e - x - 4));
      });
    },
    phasor(i, e, t, n, s) {
      let r = s.vin || [],
        o = s.vout || [],
        a = Math.min(e / 9, t / 3.4);
      i.font = Ce(10);
      let l = (h, d, u) => {
        ((i.fillStyle = Z.dim),
          i.fillText(u, 6, d - a - 6),
          h.forEach((f, p) => {
            let x = 30 + a + p * (2 * a + 14),
              g = d;
            ((i.strokeStyle = "#2a3a4c"),
              i.beginPath(),
              i.arc(x, g, a, 0, 7),
              i.stroke(),
              (i.strokeStyle = Z.acc),
              (i.lineWidth = 2),
              i.beginPath(),
              i.moveTo(x, g),
              i.lineTo(x + f.re * a, g - f.im * a),
              i.stroke(),
              (i.lineWidth = 1));
            let m = f.re * f.re + f.im * f.im;
            ((i.fillStyle = Z.ok),
              i.fillText(`${(m * 100).toFixed(0)}%`, x - 10, g + a + 12));
          }));
      };
      (l(r, t * 0.3, "input amplitudes (complex phasors)"),
        l(o, t * 0.75, "output amplitudes → detector |y|² → 12-bit ADC"));
      let c = o.map((h) => Math.round((h.re * h.re + h.im * h.im) * 4095));
      ((i.fillStyle = Z.ink),
        i.fillText(
          "ADC: " + c.map((h) => h.toString().padStart(4)).join(" "),
          e * 0.62,
          t * 0.75 + 4,
          e * 0.38,
        ));
    },
    rdfield(i, e, t, n, s) {
      let r = s.gs;
      if (!r) return;
      let o = r.W,
        a = Math.min(t - 10, e * 0.45),
        l = i.createImageData(o, o);
      for (let p = 0; p < o * o; p++) {
        let x = Math.min(1, r.v[p] * 2.6);
        ((l.data[p * 4] = 10 + 220 * x ** 2),
          (l.data[p * 4 + 1] = 40 + 200 * x),
          (l.data[p * 4 + 2] = 70 + 150 * x),
          (l.data[p * 4 + 3] = 255));
      }
      (this._rdc || (this._rdc = document.createElement("canvas")),
        (this._rdc.width = o),
        (this._rdc.height = o),
        this._rdc.getContext("2d").putImageData(l, 0, 0),
        (i.imageSmoothingEnabled = !1),
        i.drawImage(this._rdc, 6, 5, a, a),
        (i.imageSmoothingEnabled = !0));
      let c = Math.floor(o / 2);
      ((i.strokeStyle = Z.acc2),
        i.beginPath(),
        i.moveTo(6, 5 + a / 2),
        i.lineTo(6 + a, 5 + a / 2),
        i.stroke());
      let h = a + 20,
        d = e - h - 8,
        u = 18,
        f = t * 0.5;
      for (let [p, x, g] of [
        [r.u, Z.acc, "U substrate"],
        [r.v, Z.ok, "V autocatalyst"],
      ]) {
        ((i.strokeStyle = x), (i.lineWidth = 2), i.beginPath());
        for (let m = 0; m < o; m++) {
          let S = p[c * o + m],
            b = h + (m / (o - 1)) * d,
            y = u + f - S * f;
          m ? i.lineTo(b, y) : i.moveTo(b, y);
        }
        i.stroke();
      }
      ((i.lineWidth = 1),
        (i.font = Ce(10)),
        (i.fillStyle = Z.acc),
        i.fillText("U", h, u - 4),
        (i.fillStyle = Z.ok),
        i.fillText("V   (slice through the CPU twin)", h + 14, u - 4, d),
        [
          ["∂U/∂t = Du∇²U − UV² + F(1−U)", Z.ink],
          ["∂V/∂t = Dv∇²V + UV² − (F+k)V", Z.ink],
          [`F = ${(s.F ?? 0).toFixed(4)}   k = ${(s.K ?? 0).toFixed(4)}`, Z.acc2],
          ["diffusion spreads; autocatalysis sharpens:", Z.dim],
          ["a Turing-type instability (Du > Dv)", Z.dim],
        ].forEach(([p, x], g) => {
          ((i.fillStyle = x), i.fillText(p, h, u + f + 16 + g * 14, d));
        }));
    },
    dnagate(i, e, t, n, s) {
      let r = Math.floor(n / 2) % 4,
        o = t * 0.45,
        a = 14,
        l = (c, h, d, u, f) => {
          ((i.fillStyle = u),
            i.fillRect(c, h, d, 8),
            (i.fillStyle = Z.ink),
            (i.font = Ce(9)),
            f && i.fillText(f, c + 2, h - 3));
        };
      (l(a, o + 12, e * 0.62, "#4a5a6a", "gate bottom strand (template)"),
        l(a + e * 0.02, o + 12 + 12, e * 0.06, Z.acc2, ""),
        (i.fillStyle = Z.acc2),
        i.fillText("t1", a + e * 0.02, o + 44),
        r < 1 && l(a + e * 0.08, o, e * 0.18, "#ff6b6b", "blocker 1"),
        r < 2 && l(a + e * 0.28, o, e * 0.18, "#ff9b6b", "blocker 2"),
        r < 3 && l(a + e * 0.48, o, e * 0.14, Z.ok, "output O"),
        r >= 1 &&
          l(
            a + e * 0.02,
            o - 2,
            e * 0.24,
            Z.acc,
            "input A (toehold t1 + branch migration)",
          ),
        r >= 2 &&
          l(a + e * 0.26, o - 18, e * 0.2, Z.vio, "input B (toehold t2 exposed by A)"),
        r >= 3 &&
          (l(e * 0.7, 30 + ((n * 10) % 20), e * 0.14, Z.ok, "free O"),
          (i.fillStyle = Z.ok),
          i.beginPath(),
          i.arc(e * 0.92, 40, 8 + 2 * Math.sin(n * 6), 0, 7),
          i.fill(),
          (i.fillStyle = Z.ink),
          i.fillText("reporter → fluorescence", e * 0.66, 64)),
        (i.fillStyle = Z.ink),
        (i.font = Ce(11, "700")),
        i.fillText(
          [
            "1. gate complex: output locked by two blockers",
            "2. A binds toehold t1, displaces blocker 1",
            "3. now B can bind t2, displaces blocker 2",
            "4. output released → opens reporter (AND = 1)",
          ][r],
          10,
          16,
          e - 20,
        ),
        (i.font = Ce(10)),
        (i.fillStyle = Z.dim),
        i.fillText(
          "domains = 6–20 nt; toeholds ~6 nt bind reversibly, branch migration does the rest. No enzymes, no electronics.",
          10,
          t - 8,
          e - 20,
        ));
    },
    dnakin(i, e, t, n, s) {
      let r = s.kin || [],
        o = ["#6a7a8a", "#58c4ff", "#ffb347", "#5fe08a"],
        a = (e * 0.3) / 4;
      r.forEach((h, d) => {
        let u = 14 + d * a,
          f = h.frac * (t - 50);
        (bn(i, u, t - 26 - f, a - 8, f, o[d], null, 3),
          (i.fillStyle = Z.ink),
          (i.font = Ce(10)),
          i.fillText(`${h.a}${h.b}`, u + 4, t - 12),
          i.fillText(`${(h.frac * 100).toFixed(0)}%`, u, t - 30 - f));
      });
      let l = e * 0.38,
        c = e - l - 10;
      (r.forEach((h, d) => {
        ((i.strokeStyle = o[d]),
          (i.lineWidth = 2),
          i.beginPath(),
          h.trace.forEach((u, f) => {
            let p = l + (f / (h.trace.length - 1)) * c,
              x = t - 24 - (u.F / 15e-8) * (t - 44);
            f ? i.lineTo(p, x) : i.moveTo(p, x);
          }),
          i.stroke());
      }),
        (i.lineWidth = 1),
        (i.fillStyle = Z.dim),
        (i.font = Ce(10)),
        i.fillText("A B → output   (AND truth table from kinetics)", 10, 14),
        i.fillText("fluorescence vs time, 0–3 h", l, t - 8));
    },
    bzca(i, e, t, n, s) {
      let r = s.ex,
        o = s.mz;
      if (!o) return;
      let a = Math.min(t - 10, e * 0.5),
        l = a / o.W;
      for (let h = 0; h < o.H; h++)
        for (let d = 0; d < o.W; d++) {
          let u = h * o.W + d,
            f = "#d9532b";
          if (o.g[u]) f = "#1b0f0c";
          else if (r) {
            let p = r.s[u];
            f =
              p === 1
                ? "#e0ecff"
                : p > 1
                  ? "#3d64c9"
                  : r.arr[u] >= 0
                    ? "#b8452a"
                    : "#d9532b";
          }
          ((i.fillStyle = f), i.fillRect(6 + d * l, 5 + h * l, l + 0.4, l + 0.4));
        }
      let c = a + 18;
      [
        ["state per cell (2 bits+):", Z.ink],
        ["0 rest (red, reduced ferroin)", "#d9532b"],
        ["1 excited (blue, oxidised)", "#e0ecff"],
        ["2…5 refractory", "#3d64c9"],
        ["wall", "#888"],
        [r ? `t = ${r.t}` : "no wave yet", Z.acc2],
        [r && r.reached ? "goal reached: path = arrival-time descent" : "", Z.ok],
      ].forEach(([h, d], u) => {
        ((i.fillStyle = d), (i.font = Ce(10)), i.fillText(h, c, 16 + u * 15, e - c - 4));
      });
    },
    text(i, e, t, n, s, r) {
      ((i.font = Ce(Math.max(10, Math.min(12, t / 12)))),
        pA(i, s, 10, 18, e, Math.max(12, Math.min(15, t / 11)), r));
    },
    app(i, e, t, n, s) {
      Ic.text(i, e, t, n, s.app || "(no program text)", "#d6e2ef");
    },
    os(i, e, t, n, s) {
      Ic.text(i, e, t, n, s.os || "", Z.ok);
    },
    isa(i, e, t, n, s) {
      Ic.text(i, e, t, n, s.isa || "", "#cfe");
    },
  },
  f0 = class i {
    constructor(e, t, n) {
      ((this.m = e),
        (this.ctx = t),
        (this.api = n),
        (this.data = qy[e.id]),
        (this.stack = "hw"),
        (this.idx = -1),
        (this.probe = null),
        (this.lastProbe = 0),
        (this.el = this.build()));
    }
    get list() {
      return this.stack === "hw" ? this.data.hw : this.data.sw;
    }
    names() {
      return this.stack === "hw" ? _c : Cc;
    }
    build() {
      return (
        (this.tabs = ["hw", "sw"].map((e) =>
          q(
            "button",
            {
              class: "btn",
              onclick: () => this.set(e, this.stack === e ? Math.max(0, this.idx) : 0),
            },
            e === "hw" ? "⚙ Hardware stack" : "⌨ Software stack",
          ),
        )),
        (this.ladder = q("div", { class: "ladder" })),
        (this.range = q("input", {
          type: "range",
          min: 0,
          max: 4,
          step: 1,
          value: 0,
          "aria-label": "abstraction depth",
          oninput: (e) => this.set(this.stack, +e.target.value),
        })),
        (this.desc = q("div", { class: "ldesc" })),
        (this.canvas = q("canvas", { class: "plot lviz" })),
        (this.chips = q("div", { class: "lchips" })),
        (this.off = q(
          "button",
          {
            class: "btn",
            title: "Leave layer view (restore normal 3D view)",
            onclick: () => this.set(this.stack, -1),
          },
          "× off",
        )),
        q(
          "div",
          { class: "box layers" },
          q(
            "div",
            { class: "sec-t" },
            "Abstraction layers: peel the machine level by level  ([ ] keys)",
          ),
          q("div", { class: "row" }, ...this.tabs, this.off),
          this.ladder,
          q(
            "div",
            { class: "ctl lrange" },
            q("span", {}, "depth"),
            this.range,
            q("span", { class: "v" }, ""),
          ),
          this.desc,
          this.canvas,
          this.chips,
        )
      );
    }
    set(e, t) {
      this.stack = e;
      let n = this.list;
      if (
        ((this.idx = Math.max(-1, Math.min(n.length - 1, t))),
        this.tabs.forEach((l, c) => l.classList.toggle("on", ["hw", "sw"][c] === e)),
        (this.range.max = n.length - 1),
        (this.range.value = Math.max(0, this.idx)),
        (this.ladder.innerHTML = ""),
        this.names().forEach((l, c) =>
          this.ladder.append(
            q(
              "button",
              {
                class: "rung" + (c === this.idx ? " on" : ""),
                onclick: () => this.set(e, c),
              },
              q("b", {}, String(c)),
              " ",
              l,
            ),
          ),
        ),
        (this.range.parentElement.querySelector(".v").textContent =
          this.idx < 0 ? "off" : this.idx),
        (this.canvas.style.display = this.idx < 0 ? "none" : ""),
        this.idx < 0)
      ) {
        ((this.desc.textContent =
          "Pick a level: the 3D model, highlights and the live visual follow it. Hardware goes from the whole system down to physics; software from the program down to bits and voltages."),
          (this.chips.innerHTML = ""),
          this.api.apply(null));
        return;
      }
      let s = n[this.idx];
      this.desc.innerHTML = `<b>${this.names()[this.idx]}.</b> ${s.t}`;
      let r = this.m.kit.parts.filter(
        (l) =>
          l.userData.part &&
          l.userData.part.name &&
          s.p &&
          s.p.test(l.userData.part.name) &&
          !(this.idx > 0 && l.userData.part.shell),
      );
      ((this.parts = r), (this.chips.innerHTML = ""));
      let o = new Set();
      for (let l of r) {
        let c = l.userData.part.name;
        o.has(c) ||
          (o.add(c),
          this.chips.append(
            q("button", { class: "chip", onclick: () => this.api.focus(l) }, c),
          ));
      }
      let a = (e === "hw" ? By : zy)[this.idx];
      (this.api.apply({
        cut: a.cut,
        exp: a.exp,
        parts: r,
        color: e === "hw" ? 16757575 : 11898111,
        fly: this.idx >= 2,
      }),
        Ic[s.viz] && this.draw(0, !0));
    }
    step(e) {
      this.set(
        this.stack,
        Math.max(0, Math.min(this.list.length - 1, (this.idx < 0 ? -1 : this.idx) + e)),
      );
    }
    draw(e, t) {
      if (this.idx < 0) return;
      let n = this.list[this.idx],
        s = performance.now();
      if (t || s - this.lastProbe > 120) {
        try {
          this.probe = this.data.probe(this.m, this.ctx);
        } catch (c) {
          ((this.probe = { app: "probe error: " + c.message }),
            console.warn("probe", this.m.id, c));
        }
        this.lastProbe = s;
      }
      let r = yt(this.canvas),
        o = this.canvas.width,
        a = this.canvas.height,
        l = Math.min(2, window.devicePixelRatio || 1);
      (r.setTransform(1, 0, 0, 1, 0, 0),
        (r.fillStyle = Z.bg),
        r.fillRect(0, 0, o, a),
        r.save(),
        r.scale(l, l));
      try {
        Ic[n.viz].call(this, r, o / l, a / l, e, this.probe || {}, n, this.m);
      } catch (c) {
        ((r.fillStyle = Z.bad),
          (r.font = Ce(12)),
          r.fillText("viz error: " + c.message, 10, 20),
          this._warned || (console.warn("viz", this.m.id, n.viz, c), (this._warned = 1)));
      }
      (r.restore(), (this.drawn = !0));
    }
    selfCheck() {
      let e = [];
      for (let t of ["hw", "sw"])
        (t === "hw" ? this.data.hw : this.data.sw).forEach((s, r) => {
          (this.set(t, r), this.draw(1, !0));
          let o = this.canvas.width,
            a = this.canvas.height,
            l = 0;
          try {
            let c = i._tc || (i._tc = document.createElement("canvas"));
            ((c.width = o), (c.height = a));
            let h = c.getContext("2d", { willReadFrequently: !0 });
            h.drawImage(this.canvas, 0, 0);
            let d = h.getImageData(0, 0, o, a).data;
            for (let u = 0; u < d.length; u += 64)
              d[u] + d[u + 1] + d[u + 2] > 120 && l++;
          } catch {}
          e.push({
            stack: t,
            i: r,
            viz: s.viz,
            parts: this.parts.length,
            lit: l,
          });
        });
      return (this.set("hw", -1), e);
    }
  };
var p0 = [
    {
      id: "turing",
      name: "Turing machine (abstract model)",
      year: 1936,
      clock: null,
      mem: null,
      tr: null,
      devices: "none (mathematical model)",
      power: null,
      price: null,
      note: "No physical figures: unbounded tape, discrete steps. Defines what is computable; every later machine computes the same class of functions.",
      src: "A. M. Turing, “On Computable Numbers…”, Proc. London Math. Soc. 2-42 (1936)",
    },
    {
      id: "z1",
      name: "Konrad Zuse Z1 (1989 reconstruction)",
      year: 1938,
      clock: 1,
      mem: 1536 / 8,
      tr: null,
      devices: "~20,000 parts; ~6,000 mechanical gates (est.)",
      power: null,
      price: null,
      note: "1 Hz on the replica (4 Hz design target); 64 × 24-bit words (original: 16 words); ~1 t; privately financed, no price; motor wattage undocumented.",
      src: "R. Rojas, arXiv:1406.1886 (2014); Deutsches Technikmuseum Berlin; Wikipedia “Z1 (computer)”",
    },
    {
      id: "analog",
      name: "Electronic analog computer (REAC-class)",
      year: 1947,
      clock: null,
      mem: null,
      tr: null,
      power: null,
      price: null,
      note: "Continuous, no clock and no stored bits; accuracy ≈0.1 % of the ±100 V reference.",
      src: "Reeves REAC; Korn & Korn, Electronic Analog Computers (1952)",
    },
    {
      id: "tube",
      name: "EDSAC (Cambridge)",
      year: 1949,
      clock: 5e5,
      mem: (512 * 18) / 8,
      tr: null,
      devices: "~3,000 valves",
      power: 12e3,
      price: null,
      note: "512 × 18-bit words in mercury delay lines; ~650 instructions/s.",
      src: "University of Cambridge Computer Lab; Wikipedia “EDSAC”",
    },
    {
      id: "pdp8",
      name: "DEC PDP-8",
      year: 1965,
      clock: 1 / 15e-7,
      mem: (4096 * 12) / 8,
      tr: 1409,
      devices: "1,409 transistors + 10,148 diodes",
      power: 780,
      price: 18e3,
      note: "1.5 µs core cycle (shown as cycle rate).",
      src: "Gordon Bell DEC timeline; D. W. Jones, “The DEC PDP-8 story”; pdp8.net",
    },
    {
      id: "altair",
      name: "MITS Altair 8800 (Intel 8080)",
      year: 1975,
      clock: 2e6,
      mem: 256,
      tr: 6e3,
      power: null,
      price: 439,
      note: "Kit $439, assembled $621; 256 bytes RAM as shipped.",
      src: "Computer History Museum; Popular Electronics Jan 1975; Intel 8080 datasheet",
    },
    {
      id: "home80",
      name: "Commodore 64 (MOS 6510)",
      year: 1982,
      clock: 1023e3,
      mem: 65536,
      tr: 3510,
      power: null,
      price: 595,
      note: "6502-core transistor count; NTSC clock.",
      src: "Commodore; Wikipedia “Commodore 64”, “MOS Technology 6502”",
    },
    {
      id: "pc90",
      name: "PC with Intel 486DX2-66",
      year: 1992,
      clock: 66e6,
      mem: 8 * 2 ** 20,
      tr: 12e5,
      power: null,
      price: null,
      note: "Memory = this scene's 8 MB configuration.",
      src: "Intel 486 documentation; Wikipedia “Intel 80486”",
    },
    {
      id: "pc00",
      name: "PC with Pentium 4 Northwood 3.06 GHz",
      year: 2002,
      clock: 306e7,
      mem: 512 * 2 ** 20,
      tr: 55e6,
      power: null,
      price: null,
      note: "Memory = a typical 512 MB configuration.",
      src: "Intel; Wikipedia “Pentium 4”",
    },
    {
      id: "pc10",
      name: "PC with Core i7-4770K (Haswell)",
      year: 2013,
      clock: 35e8,
      mem: 8 * 2 ** 30,
      tr: 14e8,
      power: 84,
      price: 339,
      note: "CPU TDP and price; 8 GB typical RAM.",
      src: "Intel ARK i7-4770K; Intel Haswell disclosures",
    },
    {
      id: "pc20",
      name: "PC with Ryzen 9 7950X + RTX 4070",
      year: 2022,
      clock: 57e8,
      mem: 32 * 2 ** 30,
      tr: 358e8,
      power: 170,
      price: 699,
      note: "Clock = CPU boost; transistors = AD104 GPU; power and price = CPU.",
      src: "AMD 7950X product page; NVIDIA Ada (AD104) whitepaper",
    },
    {
      id: "aibox",
      name: "NVIDIA DGX Station A100 320G",
      year: 2021,
      clock: 141e7,
      mem: 320 * 2 ** 30,
      tr: 4 * 542e8,
      power: 1500,
      price: 149e3,
      note: "4 × A100 80 GB (54.2 B transistors each); memory = GPU HBM2e.",
      src: "NVIDIA DGX Station A100 datasheet & user guide; Tom's Hardware (price)",
    },
    {
      id: "bci",
      name: "DishBrain neuron culture",
      year: 2022,
      clock: null,
      mem: null,
      tr: null,
      devices: "~800,000 neurons",
      power: null,
      price: null,
      note: "Biological: no clock or transistors; learned Pong in minutes.",
      src: "Kagan et al., Neuron 110 (2022) 3952",
    },
    {
      id: "quantum",
      name: "SpinQ Gemini Mini (NMR, 2 qubits)",
      year: 2022,
      clock: null,
      mem: null,
      tr: null,
      devices: "2 nuclear-spin qubits",
      power: 60,
      price: 8700,
      note: "Launch ¥1,188,000 ≈ $8,700; 0.65 T magnet; 14 kg.",
      src: "SpinQ Gemini Mini spec sheet; PC Gamer / Switch Science",
    },
    {
      id: "m6502",
      name: "MOS Technology 6502",
      year: 1975,
      clock: 1e6,
      mem: null,
      tr: 3510,
      devices: "3,510 transistors (visual6502 netlist), NMOS depletion-load",
      power: null,
      price: 25,
      note: "$25 at launch (Sept 1975) vs ~$150–$179 for the 6800/8080; the CPU of the Apple II, Commodore PET/64, Atari 2600/800 and NES (2A03).",
      src: 'Wikipedia "MOS Technology 6502"; visual6502.org (James, Silverman & Silverman)',
    },
    {
      id: "photonic",
      name: "MIT programmable nanophotonic processor",
      year: 2017,
      clock: null,
      mem: null,
      tr: null,
      devices: "56 programmable MZIs",
      power: null,
      price: null,
      note: "Vowel recognition 76.7% on-chip vs 91.7% on a 64-bit digital computer (Shen et al.).",
      src: "Shen et al., Nature Photonics 11 (2017) 441",
    },
    {
      id: "alife",
      name: "DNA strand-displacement AND gate",
      year: 2006,
      clock: null,
      mem: null,
      tr: null,
      devices: "Enzyme-free DNA gate complexes in solution",
      power: null,
      price: null,
      note: "Chemistry, not electronics: logic by toehold-mediated strand displacement, read out by fluorescence.",
      src: "Seelig, Soloveichik, Zhang & Winfree, Science 314 (2006) 1585",
    },
  ],
  Um = [
    ["clock", "Clock / cycle rate (Hz)"],
    ["mem", "Main memory (bytes)"],
    ["tr", "Transistors"],
    ["power", "Power (W)"],
    ["price", "Launch price (US$, nominal)"],
  ],
  Wy = (i, e) => {
    if (e == null) return "—";
    if (i === "price") return "$" + e.toLocaleString();
    if (i === "power") return e >= 1e3 ? e / 1e3 + " kW" : e + " W";
    let t =
        i === "clock"
          ? ["Hz", "kHz", "MHz", "GHz"]
          : i === "mem"
            ? ["B", "KB", "MB", "GB"]
            : ["", "K", "M", "B"],
      n = i === "mem" ? 1024 : 1e3,
      s = 0,
      r = e;
    for (; r >= n && s < t.length - 1;) ((r /= n), s++);
    return (
      (r >= 100 ? r.toFixed(0) : r >= 10 ? r.toFixed(1) : r.toFixed(2)).replace(
        /\.0+$/,
        "",
      ) +
      " " +
      t[s]
    );
  };
