// Runs Klaus Dormann's 6502 functional test (incl. decimal mode) on the lab's
// behavioural 6502 core. The test binary is GPL-3.0, so it is NOT vendored:
// it is fetched from a pinned upstream commit at run time, verified by
// SHA-256 and cached in .cache/ (git-ignored).
// Usage: node tools/dormann-6502.mjs [path/to/6502_functional_test.bin]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { ROOT_DIR } from "./serve.mjs";

const COMMIT = "fe99e5616243a1bdbceaf5907390ce4443de7db0";
const URL = `https://raw.githubusercontent.com/Klaus2m5/6502_65C02_functional_tests/${COMMIT}/bin_files/6502_functional_test.bin`;
const SHA256 = "fa12bfc761e6f9057e4cc01a665a7b800ff01ae91f598af1e39a1201d01953fd";
const SUCCESS_PC = 0x3469;

async function getBinary() {
  const arg = process.argv[2];
  const cache = path.join(ROOT_DIR, ".cache", "6502_functional_test.bin");
  let buf = null;
  if (arg) buf = fs.readFileSync(arg);
  else if (fs.existsSync(cache)) buf = fs.readFileSync(cache);
  else {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`fetch ${URL}: HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(cache), { recursive: true });
    fs.writeFileSync(cache, buf);
  }
  const got = crypto.createHash("sha256").update(buf).digest("hex");
  if (got !== SHA256) throw new Error(`SHA-256 mismatch: ${got}`);
  return new Uint8Array(buf);
}

const mem = await getBinary();
const sb = {
  console,
  performance: { now: () => Date.now() },
  bt: (v, d = 2) => (v >>> 0).toString(16).toUpperCase().padStart(d, "0"),
  At: (v, d = 2) => (v >>> 0).toString(16).toUpperCase().padStart(d, "0"),
};
sb.window = sb;
sb.globalThis = sb;
vm.createContext(sb);
vm.runInContext(
  fs.readFileSync(path.join(ROOT_DIR, "src/sim/core-simulators.js"), "utf8"),
  sb,
);
vm.runInContext("globalThis.__Cpu6502 = Sr;", sb); // Sr = behavioural 6502 core (see three-aliases/I1 note)
const cpu = new sb.__Cpu6502(
  (a) => mem[a & 0xffff],
  (a, v) => {
    mem[a & 0xffff] = v & 0xff;
  },
);
cpu.pc = 0x400;
const t0 = Date.now();
let n = 0;
for (; n < 200_000_000; n++) {
  const pc = cpu.pc;
  cpu.step();
  if (cpu.pc === pc) {
    const ok = pc === SUCCESS_PC;
    console.log(
      `Dormann 6502 functional test: trap at $${pc.toString(16)} after ${n + 1} instructions, ${cpu.cycles} cycles, ${Date.now() - t0} ms => ${ok ? "PASS" : "FAIL"}`,
    );
    process.exit(ok ? 0 : 1);
  }
  if (cpu.jammed) {
    console.log(`Dormann: CPU jammed at $${pc.toString(16)} => FAIL`);
    process.exit(1);
  }
}
console.log("Dormann: no trap within 200M instructions => FAIL");
process.exit(1);
