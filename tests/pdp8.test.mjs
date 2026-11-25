// PDP-8 core conformance against DEC's documented instruction semantics (Small Computer
// Handbook, 1967 ed.; "Introduction to Programming", PDP-8 Handbook Series): link carry, current
// page and page-zero addressing, auto-index 0010-0017, JMS linkage, ISZ skip, Group 1 event order
// (CLA/CLL -> CMA/CML -> IAC -> rotate) and Group 2 OR/AND skip sense. AUDIT-LOG pass 12.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT_DIR } from "../tools/serve.mjs";

const sb = {
  Math,
  Uint16Array,
  Float32Array,
  Array,
  Map,
  Set,
  Object,
  String,
  Number,
  console,
};
sb.window = sb;
vm.createContext(sb);
vm.runInContext(
  fs.readFileSync(path.join(ROOT_DIR, "src/sim/core-simulators.js"), "utf8"),
  sb,
);
const PDP8 = sb.Ca;

function run(words, { start = 0o200, ac = 0, l = 0, mem = {}, maxSteps = 100 } = {}) {
  const m = new PDP8();
  words.forEach((w, i) => (m.mem[start + i] = w));
  for (const [a, v] of Object.entries(mem)) m.mem[Number(a)] = v;
  m.pc = start;
  m.ac = ac;
  m.l = l;
  for (let i = 0; i < maxSteps && !m.halted; i++) m.step();
  assert.ok(m.halted, "program halted");
  return m;
}
const HLT = 0o7402;

test("TAD complements the link on carry out of bit 0", () => {
  const m = run([0o1210, HLT], { ac: 0o7777, mem: { 0o210: 1 } });
  assert.equal(m.ac, 0);
  assert.equal(m.l, 1);
});

test("CIA negates (two's complement) and CLA CMA IAC complements the link", () => {
  assert.equal(run([0o7041, HLT], { ac: 5 }).ac, 0o7773);
  const m = run([0o7241 | 0o100, HLT], { ac: 0o1234, l: 0 }); // CLA CLL CMA IAC
  assert.equal(m.ac, 0);
  assert.equal(m.l, 1, "CLL happens before IAC's carry complements L");
});

test("current-page and page-zero addressing", () => {
  // At 0377: TAD 0050 (page zero) and at 0400: TAD 0450 (current page bit set).
  const m = run([0o7300, 0o1050, 0o1250, HLT], {
    start: 0o376,
    mem: { 0o50: 3, 0o450: 4 },
  });
  assert.equal(m.ac, 7);
});

test("auto-index register 0010 pre-increments on indirect reference", () => {
  const m = run([0o3410, HLT], { ac: 0o42, mem: { 0o10: 0o377 } }); // DCA I 10
  assert.equal(m.mem[0o10], 0o400);
  assert.equal(m.mem[0o400], 0o42);
  assert.equal(m.ac, 0, "DCA clears AC");
});

test("JMS stores the return address and continues at EA+1; JMP I returns", () => {
  // 0200 JMS 0210 ; 0201 HLT ; 0210 (link) ; 0211 IAC ; 0212 JMP I 0210
  const m = run([0o4210, HLT], { mem: { 0o211: 0o7001, 0o212: 0o5610 } });
  assert.equal(m.mem[0o210], 0o201);
  assert.equal(m.ac, 1);
  assert.equal(m.pc, 0o202);
});

test("ISZ increments and skips on zero", () => {
  const m = run([0o2210, HLT, 0o7001, HLT], { mem: { 0o210: 0o7777 } });
  assert.equal(m.mem[0o210], 0);
  assert.equal(m.ac, 1, "skipped the first HLT and ran IAC");
  assert.equal(m.pc, 0o204);
});

test("rotates go through the link", () => {
  let m = run([0o7004, HLT], { ac: 0o4000, l: 1 }); // RAL
  assert.deepEqual([m.ac, m.l], [0o0001, 1]);
  m = run([0o7012, HLT], { ac: 0o0003, l: 0 }); // RTR
  assert.deepEqual([m.ac, m.l], [0o4000, 1]);
});

test("Group 2 skips: OR sense (SMA SZA), AND sense (SPA SNA), SZL, SKP", () => {
  const skipped = (word, ac, l = 0) => run([word, HLT, HLT], { ac, l }).pc === 0o203;
  assert.equal(skipped(0o7540, 0), true, "SMA SZA, AC=0");
  assert.equal(skipped(0o7540, 0o0001), false, "SMA SZA, AC=1");
  assert.equal(skipped(0o7550, 0), false, "SPA SNA, AC=0");
  assert.equal(skipped(0o7550, 0o0001), true, "SPA SNA, AC=1");
  assert.equal(skipped(0o7430, 0, 0), true, "SZL, L=0");
  assert.equal(skipped(0o7420, 0, 0), false, "SNL, L=0");
  assert.equal(skipped(0o7410, 0o4000), true, "SKP");
});

test("assembler encodes DEC mnemonics to the documented octal words", () => {
  const prog = sb.vm("*200\nTAD I 10\nDCA 50\nCLA CLL\nSZA SNL\nJMS 210\nHLT");
  assert.equal(prog.errors.length, 0, JSON.stringify(prog.errors));
  assert.deepEqual(
    [...prog.mem.slice(0o200, 0o206)].map((w) => w.toString(8)),
    ["1410", "3050", "7300", "7460", "4210", "7402"],
  );
});
