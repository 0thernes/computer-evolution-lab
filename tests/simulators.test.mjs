import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT_DIR } from "../tools/serve.mjs";

function loadClassicScripts(relPaths) {
  const sandbox = {
    Math,
    BigInt,
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
    DataView,
    ArrayBuffer,
    Array,
    Map,
    Set,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    TypeError,
    RangeError,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    console,
    performance: { now: () => Date.now() },
    bt: (v, d = 2) => (v >>> 0).toString(16).toUpperCase().padStart(d, "0"),
    At: (v, d = 2) => (v >>> 0).toString(16).toUpperCase().padStart(d, "0"),
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const rel of relPaths) {
    const code = fs.readFileSync(path.join(ROOT_DIR, rel), "utf8");
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

test("RV32IM two-pass assembler encodes R/I/S/B/U/J + M-extension accurately", () => {
  const env = loadClassicScripts(["src/sim/riscv-modern-pc.js"]);
  const { assembleRV32 } = env;

  const prog = `
    .data
    vals: .word 6, 7, -3
    msg:  .asciz "OK"
    .text
      la s0, vals
      lw t0, 0(s0)
      lw t1, 4(s0)
      mul a0, t0, t1
      addi a1, zero, 42
      beq a0, a1, pass
      li a0, -1
      ebreak
    pass:
      div a2, a0, t0
      rem a3, a0, t1
      ebreak
  `;
  const compiled = assembleRV32(prog);
  assert.ok(compiled.words.length >= 9);
  assert.equal(compiled.dataBytes[8][0], 0x2008);
  assert.equal(compiled.dataBytes[8][1], 0xfd); // -3 little-endian byte 0 at 0x2008

  const sys = new env.RV32ModernSystem();
  sys.loadProgram(prog, false);
  // step() is one clock of the real pipeline; cold I-cache misses cost DRAM latency
  sys.runSteps(2000);
  assert.equal(sys.halted, true);
  assert.equal(sys.regs[10], 42); // a0 = 6 * 7 = 42
  assert.equal(sys.regs[12], 7); // a2 = 42 / 6 = 7
  assert.equal(sys.regs[13], 0); // a3 = 42 % 7 = 0
});

test("RV32IM 5-stage pipeline tracks load-use stalls, forwarding, branch predictor & L1/L2 caches", () => {
  const env = loadClassicScripts(["src/sim/riscv-modern-pc.js"]);
  const sys = new env.RV32ModernSystem();

  // Deliberate load-use hazard: lw t0, 0(sp) immediately followed by add t1, t0, t0
  const hazardSrc = `
    .text
      li sp, 0x4000
      li t2, 99
      sw t2, 0(sp)
      lw t0, 0(sp)
      add t1, t0, t0
      addi t3, t1, 2
      ebreak
  `;
  sys.loadProgram(hazardSrc, false);
  sys.runSteps(2000);
  assert.equal(sys.halted, true);
  assert.equal(sys.regs[6], 198); // t1 = 99 + 99
  assert.equal(sys.regs[28], 200); // t3 = 198 + 2
  assert.ok(sys.stats.loadStalls >= 1, "Should detect load-use stall after LW");
  assert.ok(sys.stats.forwards >= 1, "Should detect ALU EX->EX forwarding");

  // Quicksort stresses L1I, L1D, L2 caches & 2-bit branch history table
  sys.loadProgram(env.RV32_PROGRAMS["Quicksort & Cache Benchmark"], false);
  sys.runSteps(25000);
  assert.ok(sys.l1i.hitRate() > 0.85, "L1I hit rate should exceed 85%");
  assert.ok(sys.l1d.hits > 50, "L1D should record data hits");
  assert.ok(sys.bpAccuracy() > 0.65, "2-bit branch predictor should exceed 65% accuracy");
});

test("RV32IM NVMe DMA (0x30000000), PCIe GPU MMIO (0x20000000), UART Keyboard & Mini-OS Shell", () => {
  const env = loadClassicScripts(["src/sim/riscv-modern-pc.js"]);
  const sys = new env.RV32ModernSystem();

  // Write pattern to RAM 0x5000, DMA-write to NVMe sector 3, clear RAM, DMA-read back to 0x5200
  sys.writeMem(0x5000, 0xdeadbeef | 0, 4);
  sys.writeMem(0x30000000, 3, 4); // LBA 3
  sys.writeMem(0x30000004, 0x5000, 4);
  sys.writeMem(0x30000008, 2, 4); // NVMe WRITE
  sys.writeMem(0x30000004, 0x5200, 4);
  sys.writeMem(0x30000008, 1, 4); // NVMe READ
  assert.equal(sys.readMem(0x5200, 4, true), 0xdeadbeef | 0);
  assert.equal(sys.stats.nvmeOps, 2);

  // Interactive Keyboard Echo + GPU Tint program
  sys.loadProgram(env.RV32_PROGRAMS["Interactive Keyboard Echo + GPU Tint"], false);
  sys.runSteps(2000);
  sys.pushKey("Z");
  sys.runSteps(2000);
  assert.ok(sys.termOut.includes("Z"), "CPU should echo 3D keyboard char 'Z' to UART");
  assert.equal(sys.gpuRegs[1], "Z".charCodeAt(0));

  // Shell commands
  sys.execShell("ls");
  sys.execShell("cat /etc/sysinfo.txt");
  sys.execShell("gpu 2 512");
  assert.equal(sys.gpuRegs[2], 512);
  assert.ok(sys.termOut.includes("Zen-RV32IM Hybrid Workstation"));
});

test("Core historical & frontier simulators execute deterministically", () => {
  const env = loadClassicScripts(["src/sim/core-simulators.js"]);
  // PDP-8 12-bit assembler (vm) + Clements 4x4 Mach-Zehnder photonic mesh (wo)
  const pdp = env.vm("*200\nCLA IAC\nHLT");
  assert.equal(pdp.errors.length, 0);
  assert.equal(pdp.mem[0o200], 0o7201); // CLA IAC = 07201 octal

  const mesh = new env.wo(4);
  const out = mesh.apply([env.Tt(1, 0), env.Tt(0, 0), env.Tt(0, 0), env.Tt(0, 0)]);
  const totalPower = out.reduce((s, c) => s + c.re * c.re + c.im * c.im, 0);
  assert.ok(
    Math.abs(totalPower - 1) < 1e-9,
    "Unitary MZI mesh preserves optical power = 1.0",
  );
});

test("Circle II Mainframe & Server simulators (S/360, UNIX PDP-11/70, SPARC MESI+RAID5, Cloud Raft, Telum Z)", () => {
  const env = loadClassicScripts(["src/sim/enterprise-hpc-quantum-sims.js"]);

  // 1. IBM System/360 Model 50 (1964)
  const s360 = new env.S360System();
  for (let i = 0; i < 90 && !s360.psw.halted; i++) s360.step();
  assert.equal(s360.psw.halted, true, "S/360 payroll batch reaches SVC supervisor halt");
  assert.equal(s360.regs[2], 6 * 4850, "R2 gross sum = 6 * 4850");
  assert.equal(s360.regs[3], 6 * 970, "R3 withholding sum = 6 * 970");
  assert.equal(s360.mem[132], 6 * (4850 - 970), "NETOUT stored to memory word 132");
  assert.equal(
    s360.decAcc,
    125000 + 6 * 34750,
    "Packed-decimal AP accumulates exact cents",
  );
  assert.ok(s360.bcdHex().endsWith("C"), "Positive packed-decimal sign nibble is C");
  assert.ok(s360.ioOverlappedCycles > 0, "Autonomous CCW channel overlaps CPU execution");

  // 2. DEC PDP-11/70 & UNIX v6 (1973)
  const unix = new env.UnixPdp11System();
  const kPhys = unix.translateVirtual(0o020014, true);
  const uPhys = unix.translateVirtual(0o020014, false);
  assert.notEqual(
    kPhys,
    uPhys,
    "Kernel & User APRs map virtual page 1 to distinct 22-bit physical frames",
  );
  for (let i = 0; i < 25; i++) unix.step();
  assert.ok(unix.syscalls >= 2, "TRAP syscalls increment during UNIX time-sharing");
  const forkOut = unix.execCommand("fork");
  assert.ok(forkOut.includes("child PID"), "UNIX fork allocates child process");

  // 3. Sun SPARCcenter SMP MESI + RAID-5 (1993)
  const smp = new env.SmpMesiRaidServer();
  const r0 = smp.cpuAccess(0, 1, false);
  assert.equal(r0.state, "E", "First reader acquires Exclusive (E) MESI state");
  const r1 = smp.cpuAccess(1, 1, false);
  assert.equal(r1.state, "S", "Second reader transitions line to Shared (S)");
  assert.equal(smp.caches[0][1].state, "S", "Snooping demotes CPU0 from E to S");
  const w2 = smp.cpuAccess(2, 1, true, 777);
  assert.equal(w2.state, "M", "Writer acquires Modified (M) state");
  assert.equal(smp.caches[0][1].state, "I", "BusRdX invalidates CPU0 shared copy");
  assert.equal(smp.caches[1][1].state, "I", "BusRdX invalidates CPU1 shared copy");

  const origByte = smp.readRaidStripe(3, 2).value;
  smp.failDisk(2);
  const degRead = smp.readRaidStripe(3, 2);
  assert.equal(
    degRead.degraded,
    true,
    "Read from failed disk triggers degraded XOR reconstruction",
  );
  assert.equal(degRead.value, origByte, "RAID-5 XOR parity reconstructs exact lost byte");
  smp.disks[2].data[3] = 0xff ^ origByte;
  assert.equal(smp.rebuildRaid(), true, "RAID-5 hot-spare rebuild succeeds");
  assert.equal(smp.disks[2].data[3], origByte, "Rebuilt drive byte matches original");

  // 4. Warehouse-Scale Cloud Rack & Raft Consensus (2014)
  const raft = new env.CloudRaftCluster();
  assert.equal(raft.leaderId(), 0);
  raft.toggleNode(0); // kill leader 0 -> 4 alive >= 3 quorum -> automatic re-election!
  const newLeader = raft.leaderId();
  assert.ok(newLeader > 0, "Surviving 4-node quorum elects a new Raft leader");
  const propOk = raft.propose("SET /kv/epoch=42");
  assert.equal(propOk.ok, true, "Quorum commits replicated log entry");
  // Kill 2 more nodes -> only 2/5 alive -> quorum lost!
  const aliveIds = raft.nodes.filter((n) => n.alive).map((n) => n.id);
  raft.toggleNode(aliveIds[0]);
  raft.toggleNode(aliveIds[1]);
  const propFail = raft.propose("SET /kv/split=99");
  assert.equal(
    propFail.ok,
    false,
    "Minority partition refuses unsafe split-brain commit",
  );

  // 5. Telum Zero-Downtime Mainframe (2022)
  const zmain = new env.ModernMainframeZ();
  const bal0 = zmain.ledgerBalance;
  zmain.injectMemoryChannelFault(3);
  for (let i = 0; i < 20; i++) zmain.step();
  assert.equal(
    zmain.ledgerBalance,
    bal0,
    "Double-entry ACID ledger invariant holds strictly",
  );
  assert.equal(
    zmain.droppedTx,
    0,
    "Zero dropped transactions under single-channel RAIM fault",
  );
  assert.ok(zmain.raimRepairs > 0, "RAIM parity reconstructs faulted memory channel");
});

test("Circle III Supercomputer simulators (Cray-1, CM-2, Blue Gene, Frontier Exascale, Blackwell NVL72)", () => {
  const env = loadClassicScripts(["src/sim/enterprise-hpc-quantum-sims.js"]);

  // 6. Cray-1 Vector Supercomputer (1976)
  const cray = new env.Cray1VectorCpu();
  const res = cray.runKernelStep();
  assert.ok(
    res.chainedClocks < res.unchainedClocks,
    "Vector chaining beats unchained startup chime",
  );
  assert.ok(
    cray.speedupVsScalar > 15,
    "64-element chained vector pipeline exceeds 15x scalar speedup",
  );
  assert.ok(
    cray.mflops > 115 && cray.mflops < 160,
    "Single 64-elem chained FMUL+FADD chime achieves 116.4 MFLOPS of 160 MFLOPS peak at 80 MHz",
  );

  // 7. Connection Machine CM-2 (1987)
  const cm2 = new env.ConnectionMachineCM2();
  const scan = cm2.runParallelPrefixScan();
  let running = 0;
  for (let i = 0; i < 16; i++) {
    running += cm2.scanIn[i];
    assert.equal(
      scan[i],
      running,
      `Hillis-Steele parallel prefix scan exact at index ${i}`,
    );
  }
  assert.equal(
    cm2.routeHypercube(0b00000000, 0b10100101),
    4,
    "e-cube router traverses Hamming-distance hops",
  );
  cm2.step();
  assert.ok(cm2.activePop > 0);

  // 8. Blue Gene 3D-Torus MPI (2008)
  const bg = new env.BlueGeneTorusMpi();
  for (let i = 0; i < 10; i++) bg.step();
  assert.ok(
    bg.amdahlSpeedup(65536) < 50.1,
    "Amdahl 2% serial fraction caps strong-scaling below 50x",
  );
  assert.ok(
    bg.gustafsonSpeedup(65536) > 64000,
    "Gustafson weak-scaling scales linearly with 65,536 ranks",
  );

  // 9. Frontier Exascale Mixed-Precision HPL + Dragonfly (2022)
  const exa = new env.ExascaleDragonflySim();
  const hpl = exa.solveMixedPrecisionHPL();
  assert.ok(
    hpl.fp64Res < hpl.fp32Res * 1e-4,
    "FP64 iterative refinement improves FP32 LU residual by >4 orders",
  );
  assert.ok(
    hpl.fp64Res < 1e-11,
    "Refined mixed-precision HPL reaches IEEE FP64 machine precision",
  );

  // 10. Blackwell NVL72 MoE Rack (2025)
  const bw = new env.BlackwellAiRackSim();
  const initialLoss = bw.lossHistory[0];
  for (let i = 0; i < 80; i++) bw.step();
  assert.ok(bw.loss < initialLoss, "Trainable Top-2 MoE forward/backward decreases loss");
});

test("Circle IV Quantum Age simulators (Surface-Code Cryo, Rydberg Atom, Photonic MBQC, Majorana Braiding, Omega-Q Shor/Grover/H2)", () => {
  const env = loadClassicScripts(["src/sim/enterprise-hpc-quantum-sims.js"]);

  // 11. Superconducting 15 mK Surface-Code Chandelier (2024)
  const cryo = new env.CryoSurfaceCodeQuantum();
  cryo.tempMk = 15;
  cryo.codeDistance = 3;
  const pLogD3 = cryo.logicalErrorRatePerCycle();
  cryo.codeDistance = 5;
  const pLogD5 = cryo.logicalErrorRatePerCycle();
  assert.ok(
    pLogD5 < pLogD3,
    "Below threshold (15 mK), increasing surface-code distance d=3->5 suppresses logical error",
  );
  cryo.tempMk = 150;
  assert.ok(
    cryo.physicalErrorRate() > 0.02,
    "Thermal quasiparticles at 150 mK push physical error above threshold",
  );
  cryo.tempMk = 15;
  cryo.runCycle();
  assert.ok(
    Math.abs(cryo.re[0] * cryo.re[0] + cryo.re[31] * cryo.re[31] - 1) < 1e-9,
    "5-qubit GHZ state concentrates amplitude on |00000> and |11111>",
  );

  // 12. Neutral-Atom Rydberg Optical Tweezers (2023)
  const atom = new env.NeutralAtomTweezerSim();
  atom.atomSpacingUm = 3.6; // deep inside blockade radius (~7.6 um)
  const blk = atom.evolveRydbergPulse(atom.piPulseUs());
  assert.ok(
    blk.rrLeakage < 0.01,
    "Strong C6/R^6 Rydberg blockade suppresses doubly-excited |rr> state < 1%",
  );
  assert.ok(
    blk.bellProb > 0.98,
    "Collective sqrt(2)*Omega Rydberg pi-pulse prepares >98% symmetric |W> Bell state",
  );

  // 13. Measurement-Based Photonic Cluster State (2025)
  const mbqc = new env.PhotonicMbqcSim();
  const refBloch = mbqc.runTeleportationShot([0, 0, 0]).bloch;
  for (let mask = 1; mask < 8; mask++) {
    const branch = [mask & 1, (mask >> 1) & 1, (mask >> 2) & 1];
    const b = mbqc.runTeleportationShot(branch).bloch;
    const err = Math.hypot(b[0] - refBloch[0], b[1] - refBloch[1], b[2] - refBloch[2]);
    assert.ok(
      err < 1e-9,
      `Pauli feedforward yields deterministic teleported Bloch vector for branch ${branch}`,
    );
  }

  // 14. Topological Majorana Zero-Mode Braiding (2025+)
  const topo = new env.TopologicalMajoranaSim();
  topo.mu = 0.4; // |mu| < 2t -> topological phase!
  topo.computeKitaevSpectrum();
  const topoSplit = topo.zeroModeSplitting;
  topo.mu = 3.2; // |mu| > 2t -> trivial insulator phase!
  topo.computeKitaevSpectrum();
  const trivSplit = topo.zeroModeSplitting;
  assert.ok(
    topoSplit < 0.05 && trivSplit > 0.5,
    "Kitaev BdG spectrum exhibits zero-energy Majorana mode only for |mu| < 2t",
  );

  topo.resetBraid();
  topo.braid(1);
  topo.braid(2);
  const b12 = topo.bloch();
  topo.resetBraid();
  topo.braid(2);
  topo.braid(1);
  const b21 = topo.bloch();
  const nonAbelianDiff = Math.hypot(b12[0] - b21[0], b12[1] - b21[1], b12[2] - b21[2]);
  assert.ok(
    nonAbelianDiff > 0.5,
    "Ising anyon Majorana braids obey non-Abelian statistics: sigma_1 sigma_2 != sigma_2 sigma_1",
  );

  // 15. OMEGA-Q Singularity Core (2045+) — Exact Shor QFT, 256-state Grover & H2 Chemistry
  const omega = new env.OmegaSingularityCore();
  assert.deepEqual(
    Array.from(omega.runShor(15, 7).factors),
    [3, 5],
    "Shor QFT factors 15 = 3 x 5",
  );
  assert.deepEqual(
    Array.from(omega.runShor(21, 2).factors),
    [3, 7],
    "Shor QFT factors 21 = 3 x 7",
  );
  assert.deepEqual(
    Array.from(omega.runShor(33, 7).factors),
    [3, 11],
    "Shor QFT factors 33 = 3 x 11",
  );
  assert.deepEqual(
    Array.from(omega.runShor(35, 2).factors),
    [5, 7],
    "Shor QFT factors 35 = 5 x 7",
  );

  omega.setGroverTarget(201, true);
  assert.ok(
    omega.groverTargetProb > 0.94,
    "12 Grover O(sqrt(N)) iterations amplify marked state out of 256 to >94%",
  );
  // STO-3G full CI: R_e = 0.735 A (Szabo & Ostlund); experiment 0.741 A. Allow the
  // 0.006 A basis-set error plus 0.004 A margin, and pin the textbook energies.
  assert.ok(
    Math.abs(omega.h2EqAngstrom - 0.741) <= 0.01,
    `H2 R_e ${omega.h2EqAngstrom} A should be within STO-3G method error of 0.741 A`,
  );
  assert.ok(
    Math.abs(omega.h2MinEnergyHa - -1.1373) < 5e-4,
    "STO-3G FCI E_min = -1.1373 Ha",
  );
  const probe14 = omega.evalH2At(0.74);
  assert.ok(
    Math.abs(probe14.eHF - -1.1167) < 2e-3,
    "STO-3G HF energy near R_e = -1.1167 Ha",
  );
  // Shor with Q = 2^ceil(log2 N^2): every odd composite up to the stated limit factors
  for (const N of [143, 221, 253]) {
    const res = omega.runShor(N, 7);
    assert.equal(res.factors[0] * res.factors[1], N, `Shor factors N=${N}`);
    assert.ok(res.factors[0] > 1, `Shor finds a non-trivial factor of ${N}`);
  }
  assert.throws(() => omega.runShor(323, 7), /N <= 255/);
  omega.runShor(15, 7);
  const probeEq = omega.evalH2At(0.75);
  const probeStr = omega.evalH2At(2.2);
  assert.ok(
    probeEq.eGround < probeStr.eGround && probeStr.corrHa < probeEq.corrHa,
    "Stretched H2 bond exhibits stronger static electron correlation than equilibrium",
  );
});

test("v4.0 Watershed CS & Quantum Milestone Simulators (AGC 1202, Alto BitBLT, ARM DVFS/TBDR, VAX Belady, CDC 6600 Scoreboard, ASCI Red Wormhole, Yb+ Ion Trap, Ising Annealer)", () => {
  const env = loadClassicScripts(["src/sim/enterprise-hpc-quantum-sims.js"]);

  // 16. MIT Apollo Guidance Computer Block II & DSKY (1966)
  const agc = new env.ApolloAgcDsky();
  const alt0 = agc.altitudeFt;
  agc.triggerRadarOverload(true);
  assert.equal(
    agc.alarmCode,
    0o1202,
    "Rendezvous radar cycle-steal flood triggers octal 1202 Executive Overflow",
  );
  assert.ok(
    agc.bailoutRecoveries >= 1,
    "Margaret Hamilton priority executive executes BAILOUT recovery",
  );
  assert.ok(
    agc.coreSet.some((j) => j.name.includes("P64")),
    "High-priority P64 Lunar Descent guidance survives 1202 job shedding",
  );
  for (let i = 0; i < 6; i++) agc.step();
  assert.ok(
    agc.altitudeFt < alt0,
    "Lunar Module continues controlled powered descent during 1202 recovery",
  );
  agc.enterVerbNoun(35, 0);
  assert.equal(agc.r1, "+88888", "DSKY V35E lamp test lights all 5 digits + sign");

  // 17. Xerox PARC Alto Workstation (1973)
  const alto = new env.XeroxAltoSystem();
  const vramBefore = Uint8Array.from(alto.vram);
  const pat = new Uint8Array(16).fill(1);
  // Double XOR at exact same rectangle is involutive (restores original pixels!)
  alto.bitblt(pat, 4, 4, 20, 20, 8, 8, "XOR");
  assert.notDeepEqual(alto.vram, vramBefore, "First BitBLT XOR flips target pixels");
  alto.bitblt(pat, 4, 4, 20, 20, 8, 8, "XOR");
  assert.deepEqual(
    alto.vram,
    vramBefore,
    "Second BitBLT XOR restores exact underlying window bitmap",
  );
  for (let i = 0; i < 6; i++) alto.stepSmalltalkBytecode();
  assert.equal(alto.lastResult, 96, "Smalltalk bytecode stack VM evaluates 12 * 8 = 96");
  const coll = alto.transmitEthernetFrame(true);
  assert.equal(
    coll.collision,
    true,
    "3 Mbps CSMA/CD detects coax collision and schedules exponential backoff",
  );

  // 18. Mobile ARM RISC SoC (2007+)
  const arm = new env.MobileArmSoc();
  arm.workload = 0.8;
  arm.tbdrEnabled = true;
  arm.setGovernor("powersave");
  const pSave = arm.totalPowerW;
  arm.setGovernor("performance");
  const pPerf = arm.totalPowerW;
  assert.ok(
    pPerf > pSave * 2.5,
    "CMOS DVFS P = C*V^2*f scales power super-linearly from powersave to performance",
  );
  const bwTbdr = arm.dramBwGBs;
  arm.tbdrEnabled = false;
  arm.recomputeSoCTelemetry();
  assert.ok(
    arm.dramBwGBs > bwTbdr * 2.5,
    "Tile-Based Deferred Rendering saves >2.5x external LPDDR bandwidth vs Immediate-Mode",
  );

  // 19. DEC VAX-11/780 Virtual Memory & Belady's Anomaly + 4.2BSD TCP/IP (1978)
  const vax = new env.VaxVirtualMemorySystem();
  const fifo3 = vax.runBeladyBenchmark("FIFO", 3);
  const fifo4 = vax.runBeladyBenchmark("FIFO", 4);
  const lru3 = vax.runBeladyBenchmark("LRU", 3);
  const lru4 = vax.runBeladyBenchmark("LRU", 4);
  assert.equal(fifo3, 9, "Belady trace on 3 FIFO frames produces 9 page faults");
  assert.equal(
    fifo4,
    10,
    "Belady's Anomaly: 4 FIFO frames suffer MORE page faults (10 > 9) than 3 frames!",
  );
  assert.ok(
    lru4 < lru3,
    "Stack-property LRU never suffers Belady's Anomaly (8 < 10 faults)",
  );
  vax.cwnd = 8;
  vax.stepTcpRtt(true);
  assert.equal(
    vax.cwnd,
    4,
    "4.2BSD TCP multiplicative decrease halves cwnd on packet loss",
  );

  // 20. CDC 6600 Supercomputer — Thornton's Hardware Scoreboard (1964)
  const cdc = new env.Cdc6600Scoreboard();
  for (let i = 0; i < 80 && !cdc.isComplete(); i++) cdc.step();
  assert.equal(
    cdc.isComplete(),
    true,
    "Thornton Scoreboard retires all 6 CDC 6600 instructions",
  );
  assert.ok(cdc.rawStalls > 0, "Scoreboard enforces RAW operand-wait stalls via Qj/Qk");
  assert.ok(
    cdc.warStalls > 0,
    "Scoreboard enforces WAR write-result stalls on FADD X6 while FDIV reads old X6",
  );
  assert.ok(
    cdc.oooCompletions > 0,
    "Independent FSUB retires out-of-order ahead of 10-cycle FMUL / 29-cycle FDIV",
  );
  assert.equal(cdc.regs.X0, 20, "X0 = X2(5) * X4(4) = 20");
  assert.equal(cdc.regs.X5, 7, "X5 = X6(12) - X2(5) = 7");
  assert.equal(cdc.regs.X6, 12, "Final X6 = X5(7) + X2(5) = 12 after WAR hazard clears");

  // 21. Sandia / Intel ASCI Red 1.3-TFLOPS Wormhole MPP (1997)
  const asci = new env.AsciRedWormholeMpp();
  const lat = asci.compareLatencyCycles(10, 8);
  assert.equal(
    lat.wormholeCycles,
    18,
    "Wormhole cut-through latency is D + L = 18 cycles",
  );
  assert.equal(
    lat.storeForwardCycles,
    80,
    "Store-and-forward latency is D * L = 80 cycles",
  );
  for (let i = 0; i < 16; i++) asci.step();
  assert.ok(
    asci.packetsDelivered > 0 && asci.mpiHaloExchanges > 0,
    "ASCI Red delivers XY wormhole flits and steps MPI shock PDE",
  );

  // 22. Trapped-Ion 171Yb+ Linear Paul Trap & Mølmer-Sørensen Gate (1995/2024)
  const ion = new env.TrappedIonPaulQccd();
  assert.equal(
    ion.isTrapStable(),
    true,
    "Mathieu parameter q sits inside stable RF Paul confinement zone",
  );
  ion.resetState();
  const msProbs = ion.applyMolmerSorensen(0, 3, Math.PI / 2); // All-to-all Bell state on non-adjacent ions 0 & 3!
  assert.ok(
    Math.abs(msProbs[0] - 0.5) < 1e-9 && Math.abs(msProbs[0b1001] - 0.5) < 1e-9,
    "All-to-all Mølmer-Sørensen gate entangles non-adjacent ions 0 & 3 into (|0000> - i|1001>)/sqrt(2) with zero SWAPs",
  );

  // 23. Superconducting Flux-Qubit Adiabatic Quantum Annealer (2011/2023)
  const qann = new env.QuantumAnnealerIsing();
  const fast = qann.runComparison(0.8); // diabatic quench
  const slow = qann.runComparison(24.0); // adiabatic cotunneling through tall thin spin-glass barrier!
  assert.ok(
    slow.quantumProb > fast.quantumProb,
    "Longer adiabatic anneal suppresses Landau-Zener excitations",
  );
  assert.ok(
    slow.quantumProb > slow.classicalProb,
    `Quantum cotunneling (${slow.quantumProb}) outperforms trapped thermal SA (${slow.classicalProb}) across tall spin-glass barrier`,
  );
});

test("v5.0 Hard-Wired Operational Frontier Simulators (ENIAC, Symbolics LISP, Wafer-Scale WSE, Tandem NonStop, x86-64 Blade, Systolic Array, Fugaku SVE, 28Si Spin QPU)", () => {
  const env = loadClassicScripts(["src/sim/hardwired-frontier-sims.js"]);

  // 24. 1946 UPenn ENIAC Coaxial Plugboard & 10-Digit Ring Accumulator Engine
  const eniac = new env.EniacPlugboardEngine();
  for (let i = 0; i < 24; i++) eniac.step();
  assert.ok(
    eniac.acc[0].value > 0 && eniac.trajectory.length >= 12,
    "ENIAC ballistic differential integration advances shell downrange via Function Table A drag",
  );
  eniac.toggleCord("C4");
  assert.equal(eniac.cords[3].enabled, false, "Coax patch cord C4 unplugs cleanly");
  eniac.loadPreset("Hard-Wired 10-Digit Fibonacci Ring Cascade");
  for (let i = 0; i < 6; i++) eniac.step();
  assert.equal(
    eniac.acc[2].value,
    21,
    "ENIAC decade ring cascade computes exact Fibonacci F(9) = 21",
  );

  // 25. 1983 Symbolics 3600 / MIT CADR 36-Bit Hardware-Tagged LISP Machine
  const lisp = new env.SymbolicsLispMachine();
  assert.ok(
    lisp.lastOutput.includes("(+ (* X"),
    `Symbolic differentiator evaluates d/dx(x^2 + 5x): got ${lisp.lastOutput}`,
  );
  const mapOut = lisp.loadProgram(
    env.LISP_PROGRAMS["CDR-Coded List & Higher-Order Mapcar"],
  );
  assert.equal(mapOut, "225", "CDR-coded mapcar + reduce sum-of-odd-squares equals 225");
  assert.ok(lisp.cdrWordsSaved > 10, "2-bit CDR_NEXT/CDR_NIL compacts cons cells by 50%");
  const gcRes = lisp.collectGarbage();
  assert.ok(
    gcRes.gcCycles >= 1 && gcRes.liveWords > 0,
    "Cheney two-space ephemeral copying GC evacuates live tagged roots",
  );

  // 26. 2024 300mm Monolithic Wafer-Scale Dataflow & Spiking STDP Engine
  const wse = new env.WaferScaleDataflowEngine();
  for (let i = 0; i < 12; i++) wse.step();
  assert.ok(
    wse.waveletsRouted > 0 && wse.connectivityOk,
    "Wafer-scale wavelet fabric steps cleanly",
  );
  const defRes = wse.toggleDefect(4, 4);
  assert.equal(
    defRes.connectivityOk,
    true,
    "Redundant spare fabric core reroutes around lithographic reticle defect",
  );
  wse.setMode("spiking");
  for (let i = 0; i < 25; i++) wse.step();
  assert.ok(
    wse.spikesFired > 0 && wse.stdpUpdates > 0,
    "Asynchronous LIF neuromorphic mode fires spikes and updates STDP weights",
  );

  // 27. 1977 Tandem NonStop-16 Share-Nothing Process Pairs + Jim Gray WAL
  const tandem = new env.TandemNonStopCluster();
  for (let i = 0; i < 6; i++) tandem.step();
  assert.equal(
    tandem.totalLedgerDollars(),
    1000000,
    "Initial OLTP ledger invariant = $1,000,000",
  );
  const crash = tandem.injectInFlightCrash();
  assert.equal(
    crash.invariantOk,
    true,
    "Jim Gray WAL UNDO rollback + Process-Pair takeover preserves exact $1,000,000 ACID invariant",
  );
  assert.equal(
    tandem.processPairs[0].activeCpu,
    1,
    "Backup CPU 1 takes over $ATM-SW immediately",
  );

  // 28. 2004 Dual-Opteron x86-64 Hypervisor, ccNUMA & C10K epoll Blade Server
  const blade = new env.HypervisorNumaServer();
  const eptWalk = blade.translate2dAddress(0, 0x7f8812340);
  assert.equal(
    eptWalk.memRefs,
    24,
    "Cold 4x4 2D EPT walk performs 24 page-table references",
  );
  const tlbHit = blade.translate2dAddress(0, 0x7f8812340);
  assert.equal(tlbHit.tlbHit, true, "Subsequent VPID-tagged TLB lookup hits in 1 cycle");
  const reqEpoll = blade.c10kReqPerSec;
  blade.setIoMode("select");
  assert.ok(
    reqEpoll > blade.c10kReqPerSec * 7,
    "O(1) epoll readiness notification outperforms O(N) 10,000-FD select() scan by >7.5x",
  );

  // 29. 1982 Kung–Leiserson 2D VLSI Systolic Array
  const sysArr = new env.SystolicArrayEngine();
  const passOs = sysArr.runFullPass();
  assert.equal(
    passOs.verifiedExact,
    true,
    "Output-stationary 10-beat systolic wavefront matches exact C = A * B",
  );
  sysArr.setDataflowMode("weight_stationary");
  const passWs = sysArr.runFullPass();
  assert.equal(
    passWs.verifiedExact,
    true,
    "TPU-style weight-stationary systolic wavefront matches exact C = A * B",
  );

  // 30. 2020 RIKEN / Fujitsu Fugaku ARM SVE + HBM2 + 6D TofuD Supercomputer
  const fugaku = new env.FugakuSveTofuEngine();
  fugaku.setProblemLength(29); // 29 % 8 == 5 tail elements
  assert.equal(
    fugaku.activeSveLanes,
    5,
    "ARM SVE WHILELT P0.D predicate mask activates exact 5/8 tail lanes without scalar loop",
  );
  const res0 = fugaku.cgResidual;
  for (let i = 0; i < 8; i++) fugaku.step();
  assert.ok(
    fugaku.cgResidual < res0 * 0.05,
    "Sparse Conjugate Gradient (HPCG) converges residual by >20x",
  );

  // 31. 2024 Loss–DiVincenzo 28Si/SiGe Quantum-Dot Spin QPU
  const qspin = new env.SiliconSpinDotQpu();
  qspin.setSi29Ppm(50);
  const t2Purified = qspin.t2StarUs;
  qspin.setSi29Ppm(46700);
  assert.ok(
    t2Purified > qspin.t2StarUs * 15,
    "Isotopically purified 50 ppm 28Si boosts T2* spin coherence >15x over natural silicon",
  );
  qspin.setSi29Ppm(50);
  const bell = qspin.runBellPsbDemo();
  assert.ok(
    bell.bellFidelity > 0.99 && bell.psbSingletProb < 0.01,
    "Triplet Bell |Phi+> is Pauli-Spin-Blocked from tunneling into (0,2) singlet",
  );
  const sing = qspin.prepareSingletPair();
  assert.ok(
    sing.singletProb > 0.99,
    "Antisymmetric singlet |Psi-> achieves >99% Pauli-Spin-Blockade tunneling",
  );
});

test("Universal HardWiredNetlistSolver verifies exact Boolean & physical switching behavior across all hardware families", () => {
  const env = loadClassicScripts([
    "src/core/dom-ui.js",
    "src/sim/core-simulators.js",
    "src/sim/riscv-modern-pc.js",
    "src/sim/enterprise-hpc-quantum-sims.js",
    "src/sim/hardwired-frontier-sims.js",
    "src/layers/layer-stack.js",
    "src/layers/layers-expansion.js",
    "src/layers/hardwired-gate-engine.js",
  ]);

  assert.equal(typeof env.HardWiredNetlistSolver, "function");
  assert.equal(env._c.length, 6, "Hardware stack expanded to 6 rungs");
  assert.equal(env.Cc.length, 5, "Software stack expanded to 5 rungs");
  assert.equal(env.p0.length, 48, "Primary-source spec table covers all 48 machines");

  const all48Ids = env.p0.map((r) => r.id);
  const familiesSeen = new Set();
  for (const id of all48Ids) {
    assert.ok(env.qy[id], `Layer definition missing for ${id}`);
    assert.equal(env.qy[id].hw.length, 6, `${id} must have 6 HW rungs`);
    assert.equal(env.qy[id].sw.length, 5, `${id} must have 5 SW rungs`);

    const fam = env.HardWiredNetlistSolver.familyFor(id);
    familiesSeen.add(fam.key);
    // Exhaustively verify all 16 [A, B, CIN, MODE] pin states across classical & reversible quantum families
    for (let mask = 0; mask < 16; mask++) {
      const A = mask & 1;
      const B = (mask >> 1) & 1;
      const CIN = (mask >> 2) & 1;
      const MODE = (mask >> 3) & 1;
      const snap = env.HardWiredNetlistSolver.solve(id, [A, B, CIN, MODE]);
      const bEff = B ^ MODE;
      const expectedSum = A ^ bEff ^ CIN;
      const expectedCout = (A & bEff) | ((A ^ bEff) & CIN);
      assert.equal(snap.gates.length, 6, `${id} gate netlist has 6 topological gates`);
      assert.equal(snap.outputs.SUM, expectedSum, `${id} SUM mismatch for mask ${mask}`);
      assert.equal(
        snap.outputs.COUT,
        expectedCout,
        `${id} COUT mismatch for mask ${mask}`,
      );
      assert.ok(
        Number.isFinite(snap.critDelayPs) &&
          snap.critDelayPs > 0 &&
          Number.isFinite(snap.totalEnergyFj) &&
          (fam.key === "mech_plate"
            ? snap.totalEnergyFj === 0
            : snap.totalEnergyFj > 0) &&
          env.HardWiredNetlistSolver.formatDelay(snap.critDelayPs).length > 0,
        `${id} physical delay & switching energy are positive and finite`,
      );
    }
  }
  assert.equal(
    familiesSeen.size,
    8,
    `Expected 8 physical switching families to be represented across 48 machines, got ${familiesSeen.size}`,
  );
  // C9: every view is a labelled family template; Z1 is mechanical, not relay.
  assert.equal(env.HardWiredNetlistSolver.familyFor("z1").key, "mech_plate");
  assert.equal(env.HardWiredNetlistSolver.familyFor("pc20").template, true);
});
