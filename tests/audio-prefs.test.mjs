// Stored audio preferences are untrusted input (AUDIT-LOG pass 06).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ROOT_DIR } from "../tools/serve.mjs";

function loadAudio(stored) {
  const store = new Map(stored === undefined ? [] : [["cel-audio-v2", stored]]);
  const ctx = {
    console,
    Math,
    document: { hidden: false, addEventListener() {} },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  const code = fs.readFileSync(
    path.join(ROOT_DIR, "src/audio/cinematic-score.js"),
    "utf8",
  );
  vm.runInContext(
    `${code}\n;globalThis.__Ctl = Nm; globalThis.__themes = SCORE_THEMES;`,
    ctx,
  );
  return { ctl: new ctx.__Ctl(), themes: ctx.__themes.map((r) => r[0]), store };
}

test("corrupt or hostile stored prefs fall back to safe defaults", () => {
  const { ctl } = loadAudio(
    JSON.stringify({
      vol: { master: "loud", music: 7, sfx: null, constructor: 1, __proto__: { x: 1 } },
      muted: "yes",
      scoreOverride: "constructor",
    }),
  );
  assert.equal(ctl.vol.master, 0.85, "non-numeric volume ignored");
  assert.equal(ctl.vol.music, 1, "out-of-range volume clamped");
  assert.equal(ctl.vol.sfx, 0.85, "null ignored");
  assert.deepEqual(Object.keys(ctl.vol).sort(), ["master", "music", "sfx"]);
  assert.equal(ctl.muted, false);
  assert.equal(ctl.scoreOverride, "auto", "unknown palette rejected");
});

test("unparseable stored prefs are ignored", () => {
  const { ctl } = loadAudio("{not json");
  assert.equal(ctl.scoreOverride, "auto");
  assert.equal(ctl.vol.master, 0.85);
});

test("v5 composer-named palettes migrate to mood palettes", () => {
  const { ctl, themes } = loadAudio(JSON.stringify({ scoreOverride: "zimmer" }));
  assert.equal(ctl.scoreOverride, "epic");
  assert.ok(themes.includes("epic"));
});

test("set() rejects NaN volumes and unknown palettes", () => {
  const { ctl } = loadAudio();
  ctl.set("music", "abc");
  assert.equal(ctl.vol.music, 0.58);
  ctl.set("toString", 0.5);
  assert.equal(typeof ctl.vol.toString, "function");
  ctl.set("scoreOverride", "__proto__");
  assert.equal(ctl.scoreOverride, "auto");
  ctl.set("scoreOverride", "slowbuild");
  assert.equal(ctl.scoreOverride, "slowbuild");
});
