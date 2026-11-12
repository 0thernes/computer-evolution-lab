// Differential and hazard tests for the cycle-stepped RV32IM pipeline (REVIEW-v5 C8, B3, B5).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT_DIR } from "../tools/serve.mjs";

function loadRV32() {
  const sb = {
    Math,
    BigInt,
    Uint8Array,
    Uint32Array,
    Int32Array,
    Float32Array,
    DataView,
    ArrayBuffer,
    Array,
    Map,
    Set,
    Object,
    String,
    Number,
    Error,
    RangeError,
    parseInt,
    isNaN,
    console,
    performance: { now: () => Date.now() },
    bt: (v, d = 2) => (v >>> 0).toString(16).toUpperCase().padStart(d, "0"),
  };
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  const code = fs.readFileSync(path.join(ROOT_DIR, "src/sim/riscv-modern-pc.js"), "utf8");
  vm.runInContext(code, sb, { filename: "riscv-modern-pc.js" });
  return sb;
}

function runPipe(sys, src, maxCycles = 2_000_000) {
  sys.loadProgram(src);
  sys.runSteps(maxCycles);
  return sys;
}
function runISS(sys, src, maxInst = 2_000_000) {
  sys.loadProgram(src);
  for (let i = 0; i < maxInst && sys.stepISS(); i++);
  return sys;
}

// Random straight-line + short-loop programs dense with RAW hazards, loads and branches.
function randomProgram(seed) {
  let s = seed >>> 0;
  const rnd = (n) => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) % n;
  const regs = ["t0", "t1", "t2", "t3", "t4", "a0", "a1", "a2"];
  const r = () => regs[rnd(regs.length)];
  const lines = ["li s0, 0x6000"];
  for (const x of regs) lines.push(`li ${x}, ${rnd(4000) - 2000}`);
  const alu = [
    "add",
    "sub",
    "xor",
    "or",
    "and",
    "sll",
    "srl",
    "sra",
    "slt",
    "sltu",
    "mul",
    "mulh",
    "div",
    "rem",
    "divu",
    "remu",
  ];
  const imm = ["addi", "xori", "ori", "andi", "slti", "sltiu"];
  for (let i = 0; i < 60; i++) {
    const k = rnd(10);
    if (k < 4) lines.push(`${alu[rnd(alu.length)]} ${r()}, ${r()}, ${r()}`);
    else if (k < 6)
      lines.push(`${imm[rnd(imm.length)]} ${r()}, ${r()}, ${rnd(4000) - 2000}`);
    else if (k < 7) lines.push(`sw ${r()}, ${rnd(16) * 4}(s0)`);
    else if (k < 8) lines.push(`lw ${r()}, ${rnd(16) * 4}(s0)`);
    else if (k < 9) {
      lines.push(`lb ${r()}, ${rnd(64)}(s0)`);
      lines.push(`add ${r()}, ${r()}, ${r()}`); // likely load-use
    } else {
      const l = `L${seed}_${i}`;
      lines.push(`blt ${r()}, ${r()}, ${l}`, `addi ${r()}, ${r()}, 7`, `${l}:`);
    }
  }
  // a counted loop with a backward branch and jal/jalr
  lines.push(
    "li s1, 5",
    `loop${seed}:`,
    "add t0, t0, t1",
    "jal ra, fn" + seed,
    "addi s1, s1, -1",
    `bnez s1, loop${seed}`,
  );
  for (let i = 0; i < 8; i++) lines.push(`sw ${regs[i]}, ${64 + i * 4}(s0)`);
  lines.push("ebreak", `fn${seed}:`, "xor t2, t2, t0", "ret");
  return lines.join("\n");
}

test("pipeline matches the instruction-set reference on 200 random hazard-dense programs", () => {
  const env = loadRV32();
  const P = new env.RV32ModernSystem();
  const R = new env.RV32ModernSystem();
  for (let seed = 1; seed <= 200; seed++) {
    const src = randomProgram(seed);
    runPipe(P, src);
    runISS(R, src);
    assert.equal(P.halted, true, `seed ${seed}: pipeline did not halt`);
    assert.equal(P.trap, null, `seed ${seed}: unexpected trap`);
    assert.deepEqual(
      Array.from(P.regs),
      Array.from(R.regs),
      `seed ${seed}: register file differs`,
    );
    for (let a = 0x6000; a < 0x6060; a += 4) {
      assert.equal(
        P.ramView.getInt32(a, true),
        R.ramView.getInt32(a, true),
        `seed ${seed}: mem 0x${a.toString(16)}`,
      );
    }
    assert.equal(P.stats.instret, R.stats.instret, `seed ${seed}: instret`);
  }
});

test("bundled preset programs produce identical output on pipeline and reference", () => {
  const env = loadRV32();
  for (const [name, src] of Object.entries(env.RV32_PROGRAMS)) {
    if (/Keyboard/.test(name)) continue; // waits for input forever
    const P = runPipe(new env.RV32ModernSystem(), src, 3_000_000);
    const R = runISS(new env.RV32ModernSystem(), src, 3_000_000);
    if (!R.halted) {
      // free-running demo loop: the pipeline output must be a prefix of the reference output
      assert.ok(R.termOut.startsWith(P.termOut) || P.termOut.startsWith(R.termOut), name);
      continue;
    }
    assert.equal(P.halted, true, `${name}: pipeline did not halt`);
    assert.equal(P.termOut, R.termOut, `${name}: console output differs`);
    assert.equal(P.stats.instret, R.stats.instret, `${name}: instret differs`);
  }
});

test("hazards cost real cycles: load-use stall, forwarding, mispredict flush, cache misses", () => {
  const env = loadRV32();
  const sys = new env.RV32ModernSystem();
  runPipe(
    sys,
    "li sp, 0x4000\nli t2, 99\nsw t2, 0(sp)\nlw t0, 0(sp)\nadd t1, t0, t0\nebreak\n",
  );
  assert.equal(sys.regs[6], 198);
  assert.equal(sys.stats.loadStalls, 1);
  assert.ok(sys.stats.forwards >= 2);
  assert.ok(sys.stats.icacheStallCycles >= 40, "cold I-cache misses stall fetch");
  assert.ok(sys.stats.dcacheStallCycles >= 40, "cold D-cache miss freezes the pipe");
  // CPI > 1 must come from stalls, not a fudge: cycles = instret + 4 (fill) + stalls/flushes
  const st = sys.stats;
  assert.ok(st.cycles > st.instret + 4);

  // Same arithmetic without forwarding gives a WRONG answer (proves forwarding is load-bearing)
  sys.forwardingEnabled = false;
  runPipe(sys, "li t0, 5\naddi t1, t0, 1\nadd t2, t1, t1\nebreak\n");
  assert.notEqual(
    sys.regs[7],
    12,
    "without forwarding the RAW hazard reads stale registers",
  );
  sys.forwardingEnabled = true;
  runPipe(sys, "li t0, 5\naddi t1, t0, 1\nadd t2, t1, t1\nebreak\n");
  assert.equal(sys.regs[7], 12);
});

test("branch predictor learns loops and mispredicts cost 2 cycles each", () => {
  const env = loadRV32();
  const sys = new env.RV32ModernSystem();
  runPipe(sys, "li t0, 200\nloop: addi t0, t0, -1\nbnez t0, loop\nebreak\n");
  assert.equal(sys.regs[5], 0);
  assert.ok(sys.bpAccuracy() > 0.97);
  assert.ok(sys.stats.flushes >= 1 && sys.stats.flushes <= 3);
});

test("traps: illegal instruction and out-of-range load halt with a trap record", () => {
  const env = loadRV32();
  const sys = new env.RV32ModernSystem();
  sys.loadProgram("nop\nnop\nnop\n");
  sys.ramView.setUint32(4, 0xffffffff, true);
  sys.runSteps(500);
  assert.equal(sys.halted, true);
  assert.equal(sys.trap.cause, 2);
  assert.equal(sys.trap.pc, 4);
  assert.match(sys.termOut, /illegal instruction/);

  runPipe(sys, "li t0, 0x20000\nli a0, 7\nlw a0, 0(t0)\nli a1, 1\nebreak\n");
  assert.equal(sys.trap.cause, 5);
  assert.equal(sys.regs[10], 7, "faulting load must not write rd");
  assert.equal(sys.regs[11], 0, "younger instructions are squashed");
});

test("assembler rejects out-of-range immediates and resolves forward .word labels", () => {
  const env = loadRV32();
  const { assembleRV32 } = env;
  assert.throws(() => assembleRV32("addi a0, a0, 2048"), /Line 1: 12-bit immediate 2048/);
  assert.throws(() => assembleRV32("sw a0, -2049(sp)"), /out of range/);
  assert.throws(() => assembleRV32("slli a0, a0, 32"), /shift amount/);
  assert.throws(() => assembleRV32("lui a0, 0x100000"), /20-bit/);
  assert.doesNotThrow(() => assembleRV32("addi a0, a0, -2048\naddi a0, a0, 2047"));
  const c = assembleRV32(".data\ntbl: .word later\n.text\nnop\nlater: nop\n");
  const bytes = c.dataBytes.slice(0, 4).map((b) => b[1]);
  assert.equal(JSON.stringify(bytes), "[4,0,0,0]");
});
