// Analog patch-panel compiler: expression whitelist (REVIEW-v5 I8).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT_DIR } from "../tools/serve.mjs";

function loadCompiler() {
  const src = fs.readFileSync(path.join(ROOT_DIR, "src/machines/machines-early.js"), "utf8");
  const a = src.indexOf("var Gm = {");
  const b = src.indexOf("function MA(i) {");
  const end = src.indexOf("\n}\n", b) + 2;
  assert.ok(a > 0 && b > a && end > b, "compiler source located");
  const sb = { Math, Object, Set, String, JSON, Number };
  vm.createContext(sb);
  vm.runInContext(src.slice(a, end) + "\nthis.MA = MA;", sb);
  return sb.MA;
}

test("valid patches compile and integrate", () => {
  const MA = loadCompiler();
  const p = MA("param k = 2 0..5\nint x(1) = -k*x\nout y = x*2 + sin(t)\nplot x y\ntime 5");
  assert.equal(p.errors.length, 0, p.errors.join("; "));
  const S = { k: 2, x: 1, t: 0 };
  p.initF(S, {}, []);
  const D = [];
  p.deriv(S, { sin: Math.sin, cos: Math.cos }, D);
  assert.equal(D[0], -2);
  assert.ok(Math.abs(S.y - 2) < 1e-12);
});

test("JSFuck-style and member-access payloads are rejected before new Function", () => {
  const MA = loadCompiler();
  for (const bad of [
    "int x(0) = []+!![]",
    'int x(0) = "a"',
    "int x(0) = x.constructor",
    "int x(0) = constructor(1)",
    "int x(0) = x; globalThis",
    "int x(0) = `x`",
    "int x(0) = {}",
  ]) {
    const p = MA(bad);
    assert.ok(p.errors.length > 0, `should reject: ${bad}`);
  }
});

test("prototype names are not treated as built-in functions", () => {
  const MA = loadCompiler();
  const p = MA("int x(0) = toString + hasOwnProperty");
  assert.ok(p.errors.some((e) => /unknown name/.test(e)));
});
