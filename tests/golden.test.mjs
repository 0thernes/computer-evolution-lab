// Golden-value checks (review finding I4): each assertion compares a simulator
// against an independent reference computed here, not against its own output.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT_DIR } from "../tools/serve.mjs";

function load(rel) {
  const sb = { console, performance: { now: () => Date.now() } };
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, rel), "utf8"), sb, {
    filename: rel,
  });
  return sb;
}

const env = load("src/sim/enterprise-hpc-quantum-sims.js");

test("CM-2 Hillis-Steele scan equals a sequential prefix sum", () => {
  const cm = new env.ConnectionMachineCM2();
  let acc = 0;
  const ref = Array.from(cm.scanIn, (v) => (acc += v));
  assert.deepEqual(Array.from(cm.scanOut), ref);
});

test("CM-2 Life step matches an independent toroidal Life reference", () => {
  const cm = new env.ConnectionMachineCM2();
  let checked = 0;
  for (let s = 0; s < 40; s++) {
    const g = Array.from(cm.grid);
    const ref = g.map((alive, idx) => {
      const x = idx & 15,
        y = idx >> 4;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (dx || dy) n += g[((y + dy + 16) & 15) * 16 + ((x + dx + 16) & 15)];
      return alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
    });
    const pop = ref.reduce((a, b) => a + b, 0);
    cm.step();
    if (pop >= 18) {
      // below 18 the sim re-seeds by design
      assert.deepEqual(Array.from(cm.grid), ref, `generation ${s}`);
      checked++;
    }
  }
  assert.ok(checked > 0, "at least one generation compared");
});

test("Cray-1 kernel computes V4 = S1*V0 + V2 and the stated timing model", () => {
  const cr = new env.Cray1VectorCpu();
  for (const vl of [1, 17, 64]) {
    cr.VL = vl;
    const r = cr.runKernelStep();
    for (let i = 0; i < vl; i++) {
      assert.ok(Math.abs(cr.V[4][i] - (cr.alpha * cr.waveU[i] + cr.V[2][i])) < 1e-12);
    }
    assert.equal(r.chainedClocks, 24 + vl);
    assert.equal(r.unchainedClocks, 24 + 3 * vl);
    assert.equal(r.scalarClocks, 29 * vl);
  }
});

test("Shor factors odd composites up to N=255 and refuses above it", () => {
  const omega = new env.OmegaSingularityCore();
  for (const N of [
    15, 21, 33, 35, 39, 51, 55, 57, 65, 77, 85, 91, 143, 187, 209, 221, 247, 253,
  ]) {
    const r = omega.runShor(N, 2);
    const [p, q] = Array.from(r.factors);
    assert.equal(p * q, N, `N=${N}`);
    assert.ok(p > 1 && q > 1, `N=${N} non-trivial`);
  }
  assert.throws(() => omega.runShor(323, 2), { name: "RangeError" });
});
