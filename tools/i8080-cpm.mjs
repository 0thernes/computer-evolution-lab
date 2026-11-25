// Runs classic CP/M 8080 CPU test programs on the lab's Intel 8080 core (Altair 8800 exhibit,
// class Xa in src/machines/machines-early.js) under a minimal BDOS shim (functions 2 and 9).
// The binaries are NOT vendored: they are fetched from a pinned commit of superzazu/8080 (MIT
// repository; the programs themselves are 1980s diagnostics by Microcosm Associates, Ian
// Bartholomew & Frank Cringles, and SuperSoft Associates), verified by SHA-256 and cached in
// .cache/ (git-ignored).
// Usage: node tools/i8080-cpm.mjs [--exm]   (--exm adds the hours-long 8080EXM exerciser)
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { ROOT_DIR } from "./serve.mjs";

const COMMIT = "274ffd700b81baabea99b0963bc1260b67132185";
const BASE = `https://raw.githubusercontent.com/superzazu/8080/${COMMIT}/cpu_tests/`;
// ref = [instructions, cycles] published by the upstream emulator's README at COMMIT. Upstream
// stops on an injected OUT (10 states) at 0000h; this shim stops on HLT (7 states), so our cycle
// total is exactly 3 lower when every instruction's timing matches.
const STOP_DELTA = 3;
const TESTS = [
  {
    file: "TST8080.COM",
    sha256: "9561c6fb6c99efe3de00eb77e4044fd102151058b39ac2d7bce10483838a08e7",
    pass: /CPU IS OPERATIONAL/,
    ref: [651, 4924],
  },
  {
    file: "8080PRE.COM",
    sha256: "18eb3c79cba42c0718f160be6a1853cb64cdce7aa47d65780189a57bdd98c4e0",
    pass: /Preliminary tests complete/,
    ref: [1061, 7817],
  },
  {
    file: "CPUTEST.COM",
    sha256: "e61a9a75348c774486c2207080ea4effbf6c2367fdace31b0731081a4144030b",
    pass: /CPU TESTS OK/,
    ref: [33971311, 255653383],
  },
];
if (process.argv.includes("--exm"))
  TESTS.push({
    file: "8080EXM.COM",
    sha256: "6e3286e11bb1a8f47b8ee1280b4a067be813193363e3223c99b0d21912f44aeb",
    pass: /Tests complete/,
    fail: /ERROR/,
    ref: [2919050698, 23803381171],
  });

async function getBinary({ file, sha256 }) {
  const cache = path.join(ROOT_DIR, ".cache", "i8080", file);
  let buf;
  if (fs.existsSync(cache)) buf = fs.readFileSync(cache);
  else {
    const res = await fetch(BASE + file);
    if (!res.ok) throw new Error(`fetch ${file}: HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  }
  const got = crypto.createHash("sha256").update(buf).digest("hex");
  if (got !== sha256) {
    if (fs.existsSync(cache)) fs.rmSync(cache);
    throw new Error(`${file}: SHA-256 mismatch ${got}`);
  }
  if (!fs.existsSync(cache)) {
    fs.mkdirSync(path.dirname(cache), { recursive: true });
    fs.writeFileSync(cache, buf);
  }
  return buf;
}

// Load only the 8080 core: from its parity table (`var tb`) to the end of `var Xa = class`.
// machines-early.js as a whole needs three.js and a DOM, which this headless check avoids.
const src = fs.readFileSync(
  path.join(ROOT_DIR, "src/machines/machines-early.js"),
  "utf8",
);
const start = src.indexOf("var tb = new Uint8Array(256);");
const classAt = src.indexOf("var Xa = class {", start);
const end = src.indexOf("\n  },\n  SA = {", classAt);
if (start < 0 || classAt < 0 || end < 0) throw new Error("8080 core markers not found");
const sb = {};
vm.createContext(sb);
vm.runInContext(`${src.slice(start, end)}\n  };\nglobalThis.__Cpu8080 = Xa;`, sb, {
  filename: "machines-early.js#8080-core",
});

function runCom(bin, maxInstr = 40e9) {
  const cpu = new sb.__Cpu8080(null);
  cpu.mem.set(bin, 0x100);
  cpu.mem[0x0000] = 0x76; // warm boot (JMP 0) -> HLT ends the run
  cpu.mem[0x0005] = 0xc3; // BDOS entry: JMP 0F000h; (6,7) also gives programs the top of TPA
  cpu.mem[0x0006] = 0x00;
  cpu.mem[0x0007] = 0xf0;
  cpu.mem[0xf000] = 0xc9; // RET
  cpu.pc = 0x100;
  let out = "";
  let n = 0;
  for (; n < maxInstr && !cpu.halted; n++) {
    if (cpu.pc === 0x0005) {
      const fn = cpu.r[1]; // C
      if (fn === 2)
        out += String.fromCharCode(cpu.r[3]); // E
      else if (fn === 9) {
        for (
          let a = (cpu.r[2] << 8) | cpu.r[3];
          cpu.mem[a] !== 0x24;
          a = (a + 1) & 0xffff
        )
          out += String.fromCharCode(cpu.mem[a]);
      }
    }
    cpu.step();
  }
  return { out, n, cycles: cpu.cycles, halted: cpu.halted };
}

let failed = 0;
for (const t of TESTS) {
  const bin = await getBinary(t);
  const t0 = Date.now();
  const r = runCom(bin);
  const exact = r.n === t.ref[0] && r.cycles === t.ref[1] - STOP_DELTA;
  const ok = r.halted && exact && t.pass.test(r.out) && !(t.fail && t.fail.test(r.out));
  if (!ok) failed++;
  console.log(
    `${t.file}: ${r.n} instructions, ${r.cycles} cycles, ${Date.now() - t0} ms, ${exact ? "matches" : "DIFFERS FROM"} reference count => ${ok ? "PASS" : "FAIL"}`,
  );
  if (!ok || process.env.CEL_VERBOSE) console.log(r.out.replace(/\r/g, "").trim());
}
process.exit(failed ? 1 : 0);
