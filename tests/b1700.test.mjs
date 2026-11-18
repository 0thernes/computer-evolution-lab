// Burroughs B1700 micro-architecture tests. Expected values come from the B 1700 Systems
// Reference Manual (1057155, 1973) and the MIL manual (2212-5298) unless marked [LAB].
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT_DIR } from "../tools/serve.mjs";

function load() {
  const sb = {
    Math,
    BigInt,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Number,
    String,
    Object,
    Array,
    Set,
    Error,
    console,
  };
  sb.window = sb;
  vm.createContext(sb);
  const rel = "src/sim/b1700-sim.js";
  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, rel), "utf8"), sb, {
    filename: rel,
  });
  return sb;
}
const env = load();
const cpuWith = (mil) => {
  const p = new env.B1700Processor({ mainBytes: 4096, cmWords: 1024 });
  const { code, labels } = env.assembleB1700MIL(mil);
  code.forEach((w, i) => (p.cm[i] = w));
  return { p, labels };
};

test("bit-addressable memory reads and writes any field at any bit, both directions", () => {
  const m = new env.B1700BitMemory(16);
  m.write(3, 11, 0, 0b10110011101);
  assert.equal(m.read(3, 11, 0), 0b10110011101, "11-bit field at bit 3");
  assert.equal(m.read(3, 3, 0), 0b101, "leading 3 bits of the same field");
  assert.equal(m.bytes[0], 0b00010110, "bit 0 is the most significant bit of byte 0");
  m.write(40, 7, 1, 0x55); // negative direction: field ends at bit 39 [LAB interpretation]
  assert.equal(m.read(33, 7, 0), 0x55);
  m.write(61, 24, 0, 0xabcdef);
  assert.equal(m.read(61, 24, 0), 0xabcdef, "24-bit field straddling four bytes");
});

test("EXTRACT example from the MIL manual: EXTRACT 4 BITS FROM T(20) TO L", () => {
  const { p } = cpuWith("EXTRACT 4 BITS FROM T(20) TO L\nHALT");
  p.T = 0x0138e4;
  p.L = 0x1e39fc;
  p.run(10);
  assert.equal(p.L, 0x000004, "MIL manual: L after = 000004");
  assert.equal(p.T, 0x0138e4, "T is unchanged");
  assert.equal(p.cm[0] >>> 12, 0xb, "encodes as BNNN");
});

test("Register Move uses the Table 4-1 column/row matrix and right-justifies", () => {
  const { p } = cpuWith("MOVE X TO FL\nMOVE CP TO Y\nMOVE NULL TO X\nHALT");
  p.X = 0xabcdef;
  p.CP = 0x38;
  p.run(10);
  assert.equal(p.FL, 0xcdef, "24 -> 16-bit move truncates from the left");
  assert.equal(p.Y, 0x38, "moves from CP insert 16 leading zeros");
  assert.equal(p.X, 0);
  assert.equal(p.cm[0], 0x1000 | (0 << 8) | (2 << 6) | (2 << 4) | 10);
});

test("24-bit function box: binary, 4-bit decimal and 8-bit (EBCDIC) units under CPL", () => {
  const p = new env.B1700Processor({ mainBytes: 64 });
  p.X = 0x000fff;
  p.Y = 0x000001;
  p.CP = 0x18; // binary, CPL 24
  assert.equal(p.SUM, 0x001000);
  p.CPL = 12;
  assert.equal(p.SUM, 0x000, "carry beyond CPL bits is dropped");
  assert.equal(p.CYL, 1, "CYL is the carry out of the CPL-bit field");
  p.CP = 0x38; // CPU=01 4-bit decimal, CPL 24
  p.X = 0x000999;
  p.Y = 0x000001;
  assert.equal(p.SUM, 0x001000, "decimal carry between 4-bit units");
  p.X = 0x000100;
  p.Y = 0x000001;
  assert.equal(p.DIFF, 0x000099);
  p.X = 0x000001;
  p.Y = 0x000002;
  assert.equal(p.DIFF, 0x999999, "negative decimal difference in 10's complement");
  assert.equal(p.CYD, 1);
  p.CP = 0x78; // CPU=11 8-bit units
  p.X = 0xf1f2f9;
  p.Y = 0xf0f0f2;
  assert.equal(p.SUM, 0xf1f3f1, "zone bits are the inclusive OR, digits add decimally");
  p.CP = 0x08;
  p.X = 0xffffff;
  assert.equal(p.MSKX, 0xff, "MSKX keeps CPL bits");
  assert.equal(p.CMPX, 0x00);
});

test("4-bit condition registers BICN / XYCN / XYST / FLCN follow Table 2-1", () => {
  const p = new env.B1700Processor({ mainBytes: 64 });
  p.CP = 0x18;
  p.X = 5;
  p.Y = 9;
  assert.equal(p.XYCN & 0b0111, 0b010, "X<Y");
  assert.equal(p.XYST & 0b0011, 0b11, "X!=0 and Y!=0");
  p.FL = 10;
  p.padSet(0, 1, 10);
  assert.equal(p.FLCN, 0b1001, "FL=SFL and FL!=0");
  p.X = 0xffffff;
  p.Y = 1;
  assert.equal(p.BICN & 1, 1, "CYL out of 24-bit sum");
});

test("Four-bit manipulate, skip-when and bit-test branches", () => {
  const { p } = cpuWith(`
    SET TA TO 7
    INC TA BY 9 TEST   % 16 -> carry, skip next
    SET LB TO 1
    SKIP WHEN TA ALL 0000
    SET LC TO 3
    IF TA(0) FALSE THEN JUMP DONE
    SET LD TO 2
DONE: HALT`);
  p.run(20);
  assert.equal(p.get("TA"), 0, "7+9 mod 16");
  assert.equal(p.get("LB"), 0, "skipped on carry");
  assert.equal(p.get("LC"), 0, "SKIP WHEN ALL with mask 0000 skips (SRM note)");
  assert.equal(p.get("LD"), 0, "bit-test branch on false taken");
  assert.ok(p.halted);
});

test("READ/WRITE with FA/FL counting, CPL substitution and BR/LR protection", () => {
  const { p } = cpuWith(`
    MOVE 100 TO FA
    MOVE 48 TO FL
    WRITE 12 BITS FROM X INC FA DEC FL
    WRITE 12 BITS FROM Y INC FA DEC FL
    MOVE 100 TO FA
    READ 0 BITS TO T INC FA
    HALT`);
  p.X = 0xabc;
  p.Y = 0x123;
  p.CPL = 24;
  p.run(20);
  assert.equal(p.T, 0xabc123, "length 0 uses CPL (24)");
  assert.equal(p.FA, 124);
  assert.equal(p.FL, 24, "FL decremented by each field length");
  const q = cpuWith(
    "MOVE 8 TO BR\nMOVE 16 TO LR\nMOVE 40 TO FA\nWRITE 8 BITS FROM X\nHALT",
  ).p;
  q.X = 0xff;
  q.run(10);
  assert.equal(q.mem.read(40, 8), 0, "out-of-bounds write is inhibited");
  assert.equal(q.get("CD") & 1, 1, "CD bit 0 flags the write");
});

test("CALL pushes A x 16 on the 32-deep A stack; EXIT (MOVE TAS TO A) returns", () => {
  const { p, labels } = cpuWith(`
    CALL SUB
    SET TB TO 5
    HALT
SUB: SET TC TO 6
    EXIT`);
  p.run(10);
  assert.equal(p.get("TB"), 5);
  assert.equal(p.get("TC"), 6);
  assert.equal(p.astack[0], 1 * 16, "stored as a bit address");
  assert.equal(labels.SUB, 3);
});

test("micro-instructions above TOPM x 512 are fetched from main memory at (A x 16) + MBR", () => {
  const p = new env.B1700Processor({ mainBytes: 4096, cmWords: 1024 });
  const { code } = env.assembleB1700MIL("SET TA TO 9\nHALT");
  p.TOPM = 0;
  p.MBR = 800;
  code.forEach((w, i) => p.mem.write(800 + i * 16, 16, 0, w));
  p.run(5);
  assert.equal(p.get("TA"), 9);
  assert.equal(p.mmFetches, 2);
  assert.equal(p.cmFetches, 0);
});

test("SAM S-machine interpreter (microcode) runs S-programs to the right answers", () => {
  const s = new env.B1700System();
  const expect = {
    "Sum 1..10": [55],
    "Fibonacci, 11 terms": [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
    "Countdown 9..1": [9, 8, 7, 6, 5, 4, 3, 2, 1],
  };
  for (const [name, out] of Object.entries(expect)) {
    for (const decimal of [false, true]) {
      s.load(name, { decimal, inControlMemory: true });
      s.runToHalt();
      assert.ok(s.cpu.halted, `${name} halts`);
      assert.deepEqual(
        [...s.outputs()],
        out,
        `${name} (${decimal ? "decimal" : "binary"})`,
      );
    }
  }
  // the decimal S-machine really stores BCD: 55 is 0x55, the binary one stores 0x37
  s.load("Sum 1..10", { decimal: true });
  s.runToHalt();
  assert.equal(s.cpu.mem.read(env.B1700_LAYOUT.OUT, 24), 0x55);
  s.load("Sum 1..10", { decimal: false });
  s.runToHalt();
  assert.equal(s.cpu.mem.read(env.B1700_LAYOUT.OUT, 24), 0x37);
});

test("running the interpreter from main memory costs 4x per fetch (Auerbach 167 vs 667 ns)", () => {
  const s = new env.B1700System();
  s.load("Sum 1..10", { inControlMemory: true });
  s.runToHalt();
  const cm = s.cpu.ns;
  const micros = s.cpu.micros;
  s.load("Sum 1..10", { inControlMemory: false });
  s.runToHalt();
  assert.equal(s.cpu.micros, micros, "same micro-instruction count");
  assert.ok(
    s.cpu.ns > cm * 2.5,
    `main-memory run (${s.cpu.ns} ns) much slower than CM (${cm} ns)`,
  );
  assert.equal(s.cpu.cmFetches, 0);
});

test("OVERLAY (0002) copies FL bits from FA into control memory at L", () => {
  const p = new env.B1700Processor({ mainBytes: 4096, cmWords: 1024 });
  p.mem.write(1000, 16, 0, 0x3a5f);
  p.mem.write(1016, 16, 0, 0x0001);
  const { code } = env.assembleB1700MIL(
    "MOVE 1000 TO FA\nMOVE 32 TO FL\nMOVE 600 TO L\nOVERLAY\nHALT",
  );
  code.forEach((w, i) => (p.cm[i] = w));
  p.run(10);
  assert.equal(p.cm[600], 0x3a5f);
  assert.equal(p.cm[601], 0x0001);
  assert.equal(p.FL, 0);
});
