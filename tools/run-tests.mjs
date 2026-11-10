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
    "\n[3/4] Headless Chrome WebGL2 Full 17-Machine + 153-Layer + Audio Verification",
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

  const srv = await startServer(0);
  const session = await launchHeadlessSession({
    width: 1920,
    height: 1080,
    extraArgs: ["--allow-file-access-from-files"],
  });

  try {
    await session.navigate(`${srv.url}/index.html?auto=0&q=high`);
    await session.waitForLabBoot(25000);

    const bootInfo = await session.evalValue(`({
      machines: LAB.machines.map(m => m.id),
      webgl2: !!LAB.renderer.capabilities.isWebGL2,
      maxTex: LAB.renderer.capabilities.maxTextureSize,
      toneMapping: LAB.renderer.toneMapping,
      exposure: LAB.renderer.toneMappingExposure
    })`);

    assert(bootInfo.webgl2, "WebGL2 context was not active");
    assert(
      bootInfo.machines.length === 17,
      `Expected 17 machines, got ${bootInfo.machines.length}`,
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
      `17 machines, maxTex=${bootInfo.maxTex}, exposure=${bootInfo.exposure}`,
    );

    // Verify all 17 machines: select, step frames, m.test(), and 9-layer selfCheck()
    let totalLayersChecked = 0;
    for (const id of bootInfo.machines) {
      const mRes = await session.evalValue(`(async () => {
        LAB.select(${JSON.stringify(id)});
        const m = LAB.active;
        if (!m) return { ok: false, err: "Failed to select " + ${JSON.stringify(id)} };
        // Step several simulation + animation frames
        for (let i = 0; i < 6; i++) {
          m.update(0.016, i * 0.016, { diagram: m.diag, openCard: () => {} });
          for (const a of m.kit.anims) a(0.016, i * 0.016);
        }
        LAB.fx.render();
        const tRes = m.test ? await m.test() : { ok: true, msg: "no test" };
        const lRes = m._layers ? m._layers.selfCheck() : null;
        return {
          ok: !!(tRes && tRes.ok),
          msg: tRes && tRes.msg,
          errMark: !!m._err,
          warned: !!(m._layers && m._layers._warned),
          layers: lRes,
          partsCount: m.kit.parts.length
        };
      })()`);

      assert(mRes.ok, `Machine ${id}.test() failed: ${mRes.msg || mRes.err}`);
      assert(!mRes.errMark, `Machine ${id} threw an update() error`);
      assert(
        Array.isArray(mRes.layers) && mRes.layers.length === 9,
        `Machine ${id} layer count != 9`,
      );
      assert(!mRes.warned, `Machine ${id} threw a layer viz/probe error`);
      for (const item of mRes.layers) {
        assert(
          item.lit > 0,
          `Machine ${id} ${item.stack}[${item.i}] (${item.viz}) drew blank canvas`,
        );
        totalLayersChecked++;
      }
      ok(
        `Machine [${id}] hardware test & 9 layers`,
        `${mRes.partsCount} 3D parts · ${mRes.msg}`,
      );
    }
    ok(
      "All 153 Hardware/Software layer canvases verified",
      `${totalLayersChecked}/153 live & non-blank`,
    );

    // Deep Modern Mini PC (pc20) interactive checks
    const pc20Deep = await session.evalValue(`(() => {
      LAB.select("pc20");
      const m = LAB.active;
      const cpu = m.cpu || m.rv || (m._cpu);
      // Test interactive 3D keyboard keycap metadata & onPick
      const keyParts = m.kit.parts.filter(p => p.userData.keyChar !== undefined || /Keyboard/i.test(p.userData.part?.name || ""));
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
      // Test Cutaway, Explode, Macro camera preset, Tour, Compare, Help
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
      document.querySelectorAll(".overlay").forEach(o => o.remove());
      LAB.openHelp();
      const hasHelp = !!document.querySelector(".overlay.help");
      document.querySelectorAll(".overlay").forEach(o => o.remove());
      return { keyParts: keyParts.length, clippedMats, tourLen, hasCmp, hasHelp };
    })()`);

    assert(
      pc20Deep.clippedMats > 10,
      `Expected slicer clipping planes on meshes, got ${pc20Deep.clippedMats}`,
    );
    assert(pc20Deep.tourLen === 11, `Expected 11 tour steps, got ${pc20Deep.tourLen}`);
    assert(pc20Deep.hasCmp && pc20Deep.hasHelp, "Compare or Help modal failed to render");
    ok(
      "3D Cross-Section Slicer, Cutaway, Explode, Tour & Modals",
      `${pc20Deep.clippedMats} meshes sliced cleanly, ${pc20Deep.tourLen} tour steps`,
    );

    // Cinematic Orchestral Audio Engine checks
    const audioCheck = await session.evalValue(`(() => {
      LAB.select("pc20");
      LAB.audio.start();
      const themesTested = [];
      for (const t of ["zimmer", "horner", "malick", "stone", "vangelis", "auto"]) {
        LAB.audio.set("scoreOverride", t);
        for (let i = 0; i < 6; i++) LAB.audio.tick(0.12, 0.55);
        themesTested.push({ theme: t, chord: LAB.audio.nowPlaying.chord, bpm: LAB.audio.nowPlaying.bpm });
      }
      // Fire representative hardware SFX
      if (typeof hi === "function") {
        hi("relay", { v: 0.5 });
        hi("key", { v: 0.5 });
        hi("bell", { v: 0.5 });
      }
      return {
        ok: LAB.audio.ok,
        state: LAB.audio.state,
        themesTested,
        sfxPlayed: LAB.audio.stats.sfxPlayed,
        notesScheduled: LAB.audio.stats.notes
      };
    })()`);

    assert(audioCheck.ok, `Audio engine failed to start (state=${audioCheck.state})`);
    assert(
      audioCheck.themesTested.every((t) => t.chord && t.bpm > 0),
      `Missing chord/BPM in orchestral themes: ${JSON.stringify(audioCheck.themesTested)}`,
    );
    ok(
      "Cinematic Orchestral Score & Hardware SFX",
      `${audioCheck.themesTested.length} composer palettes verified, sfxPlayed=${audioCheck.sfxPlayed}`,
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
    const fileUrl = pathToFileURL(
      path.join(ROOT_DIR, "computer-evolution-lab.html"),
    ).href;
    await session.navigate(fileUrl);
    await session.waitForLabBoot(25000);

    const fileCheck = await session.evalValue(`(async () => {
      LAB.select("pc20");
      const pcRes = await LAB.active.test();
      LAB.select("m6502");
      const mosRes = await LAB.active.test();
      LAB.select("alife");
      const alifeRes = await LAB.active.test();
      return {
        protocol: location.protocol,
        pcOk: pcRes.ok,
        mosOk: mosRes.ok,
        alifeOk: alifeRes.ok
      };
    })()`);

    assert(
      fileCheck.protocol === "file:",
      `Expected file: protocol, got ${fileCheck.protocol}`,
    );
    assert(
      fileCheck.pcOk && fileCheck.mosOk && fileCheck.alifeOk,
      "Machine tests failed under file://",
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
      "Zero CORS errors; pc20, m6502 & alife tests passed",
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
