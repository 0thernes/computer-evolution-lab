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
  sys.runSteps(64);
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
  sys.runSteps(32);
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
  sys.runSteps(40);
  sys.pushKey("Z");
  sys.runSteps(40);
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
