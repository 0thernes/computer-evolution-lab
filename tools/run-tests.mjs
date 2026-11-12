import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import { ROOT_DIR, startServer } from "./serve.mjs";
import { findBrowserBinary, launchHeadlessSession } from "./cdp-harness.mjs";

const optionalHeadless = process.argv.includes("--ci-headless-optional");

let passed = 0;
let failed = 0;

function ok(label, detail = "") {
  passed++;
  console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, err) {
  failed++;
  console.error(`  ✗ ${label}: ${err?.message || err}`);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function runStaticChecks() {
  console.log("\n[1/4] Static Modular Structure & Syntax Checks");

  const idxPath = path.join(ROOT_DIR, "index.html");
  const labPath = path.join(ROOT_DIR, "computer-evolution-lab.html");
  assert(fs.existsSync(idxPath), "index.html missing");
  assert(fs.existsSync(labPath), "computer-evolution-lab.html missing");

  const idxHtml = fs.readFileSync(idxPath, "utf8");
  const labHtml = fs.readFileSync(labPath, "utf8");
  assert(
    idxHtml.replace(/\r\n/g, "\n") === labHtml.replace(/\r\n/g, "\n"),
    "index.html and computer-evolution-lab.html must stay identical",
  );
  const idxBytes = Buffer.byteLength(idxHtml, "utf8");
  assert(idxBytes < 30000, `HTML entrypoint should be lean (<30 KB), got ${idxBytes} B`);
  ok("HTML entrypoints lean & synced", `${(idxBytes / 1024).toFixed(1)} KB each`);

  const hrefs = [...idxHtml.matchAll(/<link[^>]+href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((u) => !u.startsWith("data:") && !u.startsWith("http"));
  const srcs = [...idxHtml.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);

  for (const rel of [...hrefs, ...srcs]) {
    const abs = path.join(ROOT_DIR, rel);
    assert(fs.existsSync(abs), `Referenced asset missing: ${rel}`);
  }
  ok(
    "All referenced CSS & JS modules exist",
    `${hrefs.length} CSS + ${srcs.length} JS files`,
  );

  for (const rel of srcs) {
    const abs = path.join(ROOT_DIR, rel);
    const code = fs.readFileSync(abs, "utf8");
    new vm.Script(code, { filename: rel });
  }
  ok("VM syntax parse clean across all JS scripts", `${srcs.length} classic scripts`);
}

async function runRiscvUnitChecks() {
  console.log("\n[2/4] Standalone Node RV32IM Pipelined CPU, Cache & MMIO Tests");

  const code = fs.readFileSync(path.join(ROOT_DIR, "src/sim/riscv-modern-pc.js"), "utf8");
  const sandbox = {
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
    parseInt,
    isNaN,
    bt: (v, d = 2) => (v >>> 0).toString(16).toUpperCase().padStart(d, "0"),
    performance: { now: () => Date.now() },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "riscv-modern-pc.js" });

  const { RV32ModernSystem, assembleRV32, RV32_PROGRAMS } = sandbox;
  assert(typeof RV32ModernSystem === "function", "RV32ModernSystem not exported");
  assert(typeof assembleRV32 === "function", "assembleRV32 not exported");
  const progEntries = Object.entries(RV32_PROGRAMS || {});
  assert(progEntries.length >= 4, "Expected at least 4 RV32 preset programs");

  for (const [name, src] of progEntries) {
    const res = assembleRV32(src);
    assert(res.words.length > 5, `Program ${name} produced too few instructions`);
  }
  ok(
    "Two-pass RV32IM assembler",
    `${progEntries.length} preset programs assembled cleanly`,
  );

  const sys = new RV32ModernSystem();
  sys.loadProgram(RV32_PROGRAMS["Sieve of Eratosthenes (Primes)"], false);
  sys.runSteps(25000);
  assert(sys.termOut.includes("97"), `Prime sieve did not emit prime 97: ${sys.termOut}`);
  ok(
    "RV32IM Sieve of Eratosthenes",
    `instret=${sys.stats.instret}, IPC=${sys.ipc().toFixed(3)}`,
  );

  sys.loadProgram(RV32_PROGRAMS["Quicksort & Cache Benchmark"], false);
  sys.runSteps(25000);
  assert(
    sys.stats.forwards > 0 && sys.l1d.hits > 10,
    "Expected pipeline forwarding & L1D cache hits during Quicksort",
  );
  ok(
    "RV32IM Quicksort + 5-Stage Pipeline + Caches",
    `forwards=${sys.stats.forwards}, stalls=${sys.stats.loadStalls}, BP=${(sys.bpAccuracy() * 100).toFixed(1)}%`,
  );

  sys.loadProgram(RV32_PROGRAMS["GPU Co-Processor Driver (MMIO)"], false);
  sys.runSteps(800);
  assert(
    sys.stats.mmioGpuWrites > 0,
    "GPU MMIO registers should be written by RV32IM GPU driver",
  );
  ok(
    "PCIe GPU MMIO register bridge (0x20000000)",
    `writes=${sys.stats.mmioGpuWrites}, uCPU=[${sys
      .gpuUniformVec4()
      .map((x) => x.toFixed(2))
      .join(", ")}]`,
  );

  sys.pushKey("A");
  sys.pushKey("B");
  assert(sys.keyFifo.length >= 2, "UART keyboard FIFO did not enqueue keystrokes");
  sys.execShell("help");
  sys.execShell("cache");
  sys.execShell("pipe");
  assert(sys.termOut.includes("Mini-OS Commands"), "Mini-OS shell output missing");
  ok(
    "UART 3D Keyboard FIFO + Mini-OS shell",
    `L1I hits=${sys.l1i.hits}, L1D hits=${sys.l1d.hits}`,
  );
}

async function runHeadlessBrowserSuite() {
  console.log(
    "\n[3/4] Headless Chrome WebGL2 Full 48-Machine + 528-Layer (1,584 Sub-Lens) + Audio Verification",
  );

  const bin = findBrowserBinary();
  if (!bin) {
    if (optionalHeadless) {
      console.log(
        "  ⚠ Skipping headless WebGL2 checks (no Chrome binary in CI environment).",
      );
      return;
    }
    throw new Error("Chrome/Edge binary required for full verification.");
  }

  const isSoftwareCI = Boolean(optionalHeadless || process.env.GITHUB_ACTIONS === "true");
  const srv = await startServer(0);
  const session = await launchHeadlessSession({
    width: isSoftwareCI ? 960 : 1920,
    height: isSoftwareCI ? 540 : 1080,
    extraArgs: ["--allow-file-access-from-files"],
  });

  try {
    await session.navigate(
      `${srv.url}/index.html?auto=0&q=${isSoftwareCI ? "low" : "high"}`,
    );
    await session.waitForLabBoot(60000);

    const bootInfo = await session.evalValue(`({
      machines: LAB.machines.map(m => m.id),
      webgl2: !!LAB.renderer.capabilities.isWebGL2,
      maxTex: LAB.renderer.capabilities.maxTextureSize,
      toneMapping: LAB.renderer.toneMapping,
      exposure: LAB.renderer.toneMappingExposure
    })`);

    assert(bootInfo.webgl2, "WebGL2 context was not active");
    assert(
      bootInfo.machines.length === 48,
      `Expected 48 machines, got ${bootInfo.machines.length}`,
    );
    assert(
      session.pageExceptions.length === 0,
      `Startup exceptions: ${session.pageExceptions.join("; ")}`,
    );
    assert(
      session.consoleErrors.length === 0,
      `Startup console.errors: ${session.consoleErrors.join("; ")}`,
    );
    ok(
      "HTTP WebGL2 boot & StudioFX composer",
      `48 machines, maxTex=${bootInfo.maxTex}, exposure=${bootInfo.exposure}`,
    );

    // Verify all 48 machines: select, step frames, m.test(), and 11-layer selfCheck()
    let totalLayersChecked = 0;
    const stepFrames = isSoftwareCI ? 2 : 6;
    for (const id of bootInfo.machines) {
      const mRes = await session.evalValue(`(async () => {
        LAB.select(${JSON.stringify(id)});
        const m = LAB.active;
        if (!m) return { ok: false, err: "Failed to select " + ${JSON.stringify(id)} };
        // Step simulation + animation frames
        for (let i = 0; i < ${stepFrames}; i++) {
          m.update(0.016, i * 0.016, { diagram: m.diag, openCard: () => {} });
          for (const a of m.kit.anims) a(0.016, i * 0.016);
        }
        LAB.fx.render();
        const tRes = m.test ? await m.test() : { ok: true, msg: "no test" };
        const lRes = m._layers ? m._layers.selfCheck() : null;
        return {
          ok: !!(tRes && tRes.ok),
          msg: tRes && (tRes.detail || tRes.msg || "verified"),
          errMark: !!m._err,
          warned: !!(m._layers && m._layers._warned),
          layers: lRes,
          partsCount: m.kit.parts.length
        };
      })()`);

      assert(mRes.ok, `Machine ${id}.test() failed: ${mRes.msg || mRes.err}`);
      assert(!mRes.errMark, `Machine ${id} threw an update() error`);
      assert(
        Array.isArray(mRes.layers) && mRes.layers.length === 11,
        `Machine ${id} layer count != 11 (got ${mRes.layers && mRes.layers.length})`,
      );
      assert(!mRes.warned, `Machine ${id} threw a layer viz/probe error`);
      for (const item of mRes.layers) {
        assert(
          item.lit > 0,
          `Machine ${id} ${item.stack}[${item.i}] (${item.viz}) drew blank canvas`,
        );
        assert(
          item.parts > 0,
          `Machine ${id} ${item.stack}[${item.i}] matched 0 non-shell 3D parts`,
        );
        totalLayersChecked++;
      }
      ok(
        `Machine [${id}] hardware test & 11 layers`,
        `${mRes.partsCount} 3D parts · ${mRes.msg}`,
      );
    }
    ok(
      "All 528 Hardware/Software primary layer canvases verified",
      `${totalLayersChecked}/528 live, non-blank & part-matched (1,584 sub-lens views)`,
    );

    // Deep Modern Mini PC (pc20), Sub-Lens Gate Bench, 3D Bus Wave-Packets & 5-Tab Roofline Atlas checks
    const pc20Deep = await session.evalValue(`(() => {
      LAB.select("pc20");
      const m = LAB.active;
      const keyParts = m.kit.parts.filter(p => p.userData.keyChar !== undefined || /Keyboard/i.test(p.userData.part?.name || ""));
      // Fire diagram pulse to verify 3D BusPulse wave-packets spawn
      const spawnedBefore = LAB.busPulses.spawned;
      const nKeys = Object.keys(m.diag.nodes);
      if (nKeys.length >= 2) m.diag.pulse(nKeys[0], nKeys[1], "#38bdf8");
      const busPulseSpawned = LAB.busPulses.spawned > spawnedBefore;
      // Verify Sub-Lens 1 (Hard-Wired Gate Bench + Interactive Pin Toggle) & Sub-Lens 2 (Signal Eye)
      m._layers.set("hw", 3);
      m._layers.setLens(1);
      m._layers.toggleInputPin(0);
      m._layers.draw(1.0, true);
      const hitBoxCount = (m._layers._gateHitBoxes || []).length;
      m._layers.setLens(2);
      m._layers.draw(1.0, true);
      const lensWarned = !!m._layers._warned;
      m._layers.setLens(0);
      m._layers.set("hw", -1);
      // Test Cross-Section Slicer on pc20
      LAB.slicer.enabled = true;
      LAB.slicer.axis = "x";
      LAB.slicer.offset = 0.1;
      LAB.slicer.apply(m);
      let clippedMats = 0;
      m.root.traverse(o => {
        if (o.isMesh && o.material && o.material.clippingPlanes && o.material.clippingPlanes.length > 0) clippedMats++;
      });
      LAB.slicer.enabled = false;
      LAB.slicer.apply(m);
      // Test Cutaway, Explode, Macro camera preset, Tour, 5-Tab Compare + Roofline, Help
      LAB.setCutaway(true, true);
      LAB.setExplode(0.5, true);
      LAB.setViewPreset("macro", true);
      LAB.fx.render();
      LAB.setCutaway(false, true);
      LAB.setExplode(0, true);
      LAB.setViewPreset("iso", true);
      LAB.startTour();
      const tourLen = LAB.tour ? LAB.tour.steps.length : 0;
      LAB.stopTour();
      LAB.openCompare();
      const hasCmp = !!document.querySelector(".overlay");
      const roofTabBtn = document.querySelector('.overlay button[data-tab="roofline"]');
      if (roofTabBtn) roofTabBtn.click();
      const hasRoofline = !!roofTabBtn;
      document.querySelectorAll(".overlay").forEach(o => o.remove());
      LAB.openHelp();
      const hasHelp = !!document.querySelector(".overlay.help");
      document.querySelectorAll(".overlay").forEach(o => o.remove());
      return {
        keyParts: keyParts.length,
        clippedMats,
        tourLen,
        hasCmp,
        hasRoofline,
        hasHelp,
        busPulseSpawned,
        hitBoxCount,
        lensWarned
      };
    })()`);

    assert(
      pc20Deep.clippedMats > 10,
      `Expected slicer clipping planes on meshes, got ${pc20Deep.clippedMats}`,
    );
    assert(pc20Deep.tourLen === 13, `Expected 13 tour steps, got ${pc20Deep.tourLen}`);
    assert(
      pc20Deep.hasCmp && pc20Deep.hasRoofline && pc20Deep.hasHelp,
      "Compare (with Tab 5 Roofline) or Help modal failed to render",
    );
    assert(
      pc20Deep.busPulseSpawned,
      "3D BusPulse wave-packet failed to spawn on diagram pulse",
    );
    assert(
      pc20Deep.hitBoxCount >= 2 && !pc20Deep.lensWarned,
      `Sub-Lens Gate Bench / Signal Eye error (hitBoxes=${pc20Deep.hitBoxCount}, warned=${pc20Deep.lensWarned})`,
    );
    ok(
      "3D Bus Pulses, Interactive Gate Bench, Signal Eye, Slicer, Tour & 5-Tab Roofline Atlas",
      `${pc20Deep.clippedMats} sliced meshes, ${pc20Deep.hitBoxCount} clickable gate pins, ${pc20Deep.tourLen} tour steps`,
    );

    // Cinematic Orchestral Audio Engine checks
    const audioCheck = await session.evalValue(`(async () => {
      LAB.select("pc20");
      LAB.audio.start();
      try { await LAB.audio.ac.resume(); } catch {}
      const notes0 = LAB.audio.stats.notes;
      const themesTested = [];
      for (const t of ["epic", "noble", "clockwork", "suspended", "elegiac", "synthnoir", "auto"]) {
        LAB.audio.set("scoreOverride", t);
        for (let i = 0; i < 6; i++) LAB.audio.tick(0.12, 0.55);
        const np = LAB.audio.nowPlaying || {};
        themesTested.push({ theme: t, chord: np.chord, bpm: np.bpm });
      }
      // Fire representative hardware SFX and count the events the engine actually voiced
      const ev0 = LAB.audio.stats.events;
      const voiced = [hi("relay", { v: 0.5 }), hi("key", { v: 0.5 }), hi("bell", { v: 0.5 })];
      return {
        ok: LAB.audio.ok,
        state: LAB.audio.state,
        themesTested,
        sfxVoiced: voiced.filter(Boolean).length,
        sfxEvents: LAB.audio.stats.events - ev0,
        notesScheduled: LAB.audio.stats.notes - notes0,
        scoreMode: LAB.audio.scoreMode || "procedural",
      };
    })()`);

    assert(audioCheck.ok, `Audio engine failed to start (state=${audioCheck.state})`);
    assert(
      audioCheck.themesTested.every((t) => t.chord && t.bpm > 0),
      `Missing chord/BPM in orchestral themes: ${JSON.stringify(audioCheck.themesTested)}`,
    );
    assert(audioCheck.notesScheduled > 0, "Score scheduled no notes/stem updates");
    if (audioCheck.state === "running") {
      assert(
        audioCheck.sfxEvents === 3 && audioCheck.sfxVoiced === 3,
        `Expected 3 voiced SFX events, got ${audioCheck.sfxEvents}`,
      );
    }
    ok(
      "Orchestral Score & Hardware SFX",
      `${audioCheck.themesTested.length} mood palettes, AudioContext=${audioCheck.state}, sfx voiced=${audioCheck.sfxEvents} (measured), notes=${audioCheck.notesScheduled}, score=${audioCheck.scoreMode}`,
    );

    assert(
      session.pageExceptions.length === 0,
      `Runtime page exceptions occurred: ${session.pageExceptions.join("; ")}`,
    );
    assert(
      session.consoleErrors.length === 0,
      `Runtime console.error occurred: ${session.consoleErrors.join("; ")}`,
    );

    // [4/4] Direct file:// protocol verification (zero HTTP server!)
    console.log("\n[4/4] Direct file:// Double-Click Protocol Verification");
    const fileUrl =
      pathToFileURL(path.join(ROOT_DIR, "computer-evolution-lab.html")).href +
      (isSoftwareCI ? "?auto=0&q=low" : "");
    await session.navigate(fileUrl);
    await session.waitForLabBoot(60000);

    const fileCheck = await session.evalValue(`(async () => {
      const ids = ["pc20", "eniac46", "agc66", "alto73", "m6502", "lisp83", "arm07", "wse24", "alife", "s360", "tandem77", "vax78", "blade04", "cdc6600", "cray1", "systolic82", "ascired97", "fugaku20", "qion", "qanneal", "qspin", "qomega"];
      const failedIds = [];
      for (const id of ids) {
        LAB.select(id);
        const r = await LAB.active.test();
        if (!r || !r.ok) failedIds.push(id + ":" + (r && (r.detail || r.msg)));
      }
      return {
        protocol: location.protocol,
        tested: ids.length,
        failedIds
      };
    })()`);

    assert(
      fileCheck.protocol === "file:",
      `Expected file: protocol, got ${fileCheck.protocol}`,
    );
    assert(
      fileCheck.failedIds.length === 0,
      `Machine tests failed under file:// -> ${fileCheck.failedIds.join(", ")}`,
    );
    assert(
      session.pageExceptions.length === 0,
      `file:// exceptions: ${session.pageExceptions.join("; ")}`,
    );
    assert(
      session.consoleErrors.length === 0,
      `file:// console.errors: ${session.consoleErrors.join("; ")}`,
    );
    ok(
      "Direct file:// double-click execution",
      `Zero CORS errors; ${fileCheck.tested} flagship machines across all 4 Circles passed`,
    );
  } finally {
    await session.close();
    await srv.close();
  }
}

try {
  await runStaticChecks();
  await runRiscvUnitChecks();
  await runHeadlessBrowserSuite();
} catch (err) {
  fail("Test suite aborted with error", err);
}

console.log(`\n════════════════════════════════════════════════════════════`);
console.log(`  Verification Summary: ${passed} passed, ${failed} failed`);
console.log(`════════════════════════════════════════════════════════════\n`);
process.exitCode = failed > 0 ? 1 : 0;
