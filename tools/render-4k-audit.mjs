import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startServer } from "./serve.mjs";
import { launchHeadlessSession } from "./cdp-harness.mjs";

const outDir = path.resolve(process.argv[2] || path.join(os.tmpdir(), "cel-4k-audit"));
fs.mkdirSync(outDir, { recursive: true });

const SHOTS = [
  { name: "01-hub-4k", id: "hub", preset: "iso" },
  { name: "02-turing-4k", id: "turing", preset: "iso" },
  { name: "03-z1-4k", id: "z1", preset: "iso" },
  { name: "04-analog-4k", id: "analog", preset: "iso" },
  { name: "05-tube-4k", id: "tube", preset: "iso" },
  { name: "06-pdp8-4k", id: "pdp8", preset: "iso" },
  { name: "07-altair-4k", id: "altair", preset: "iso" },
  { name: "08-home80-4k", id: "home80", preset: "iso" },
  { name: "09-pc90-4k", id: "pc90", preset: "iso" },
  { name: "10-pc00-4k", id: "pc00", preset: "iso", cutaway: true },
  { name: "11-pc10-4k", id: "pc10", preset: "iso", cutaway: true },
  { name: "12-pc20-iso-4k", id: "pc20", preset: "iso" },
  { name: "13-pc20-cutaway-macro", id: "pc20", preset: "macro", cutaway: true },
  {
    name: "14-pc20-sliced-x",
    id: "pc20",
    preset: "iso",
    slice: { axis: "x", offset: 0.08 },
  },
  { name: "15-aibox-cutaway-4k", id: "aibox", preset: "iso", cutaway: true },
  { name: "16-bci-4k", id: "bci", preset: "iso" },
  { name: "17-quantum-cutaway-4k", id: "quantum", preset: "iso", cutaway: true },
  { name: "18-m6502-4k", id: "m6502", preset: "iso" },
  { name: "19-photonic-4k", id: "photonic", preset: "iso" },
  { name: "20-alife-4k", id: "alife", preset: "iso" },
  { name: "21-s360-mainframe-4k", id: "s360", preset: "iso", cutaway: true },
  { name: "22-unix70-pdp11-4k", id: "unix70", preset: "iso", cutaway: true },
  { name: "23-sun90-sparccenter-4k", id: "sun90", preset: "iso", cutaway: true },
  { name: "24-cloud10-ocp-rack-4k", id: "cloud10", preset: "iso", cutaway: true },
  { name: "25-zmain20-telum-z16-4k", id: "zmain20", preset: "iso", cutaway: true },
  { name: "26-cray1-vector-4k", id: "cray1", preset: "iso" },
  { name: "27-cm2-hypercube-4k", id: "cm2", preset: "iso" },
  { name: "28-bgene-torus-4k", id: "bgene", preset: "iso", cutaway: true },
  { name: "29-exascale-frontier-4k", id: "exascale", preset: "iso", cutaway: true },
  { name: "30-gb200-nvl72-4k", id: "gb200", preset: "iso", cutaway: true },
  { name: "31-qtransmon-cryo-4k", id: "qtransmon", preset: "iso", cutaway: true },
  { name: "32-qatom-rydberg-4k", id: "qatom", preset: "iso" },
  { name: "33-qphotonic-mbqc-4k", id: "qphotonic", preset: "iso" },
  { name: "34-qtopo-majorana-4k", id: "qtopo", preset: "iso", cutaway: true },
  { name: "35-qomega-horizon-4k", id: "qomega", preset: "iso", cutaway: true },
  { name: "36-agc66-apollo-4k", id: "agc66", preset: "iso", cutaway: true },
  { name: "37-alto73-xerox-4k", id: "alto73", preset: "iso", cutaway: true },
  { name: "38-arm07-mobile-soc-4k", id: "arm07", preset: "iso", cutaway: true },
  { name: "39-vax78-vms-4k", id: "vax78", preset: "iso", cutaway: true },
  { name: "40-cdc6600-scoreboard-4k", id: "cdc6600", preset: "iso", cutaway: true },
  { name: "41-ascired97-mpp-4k", id: "ascired97", preset: "iso", cutaway: true },
  { name: "42-qion-trapped-ion-4k", id: "qion", preset: "iso", cutaway: true },
  { name: "43-qanneal-ising-4k", id: "qanneal", preset: "iso", cutaway: true },
  { name: "44-eniac46-plugboard-4k", id: "eniac46", preset: "iso", cutaway: true },
  { name: "45-lisp83-symbolics-4k", id: "lisp83", preset: "iso", cutaway: true },
  { name: "46-wse24-wafer-scale-4k", id: "wse24", preset: "iso", cutaway: true },
  { name: "47-tandem77-nonstop-4k", id: "tandem77", preset: "iso", cutaway: true },
  { name: "48-blade04-hypervisor-4k", id: "blade04", preset: "iso", cutaway: true },
  { name: "49-systolic82-vlsi-4k", id: "systolic82", preset: "iso", cutaway: true },
  { name: "50-fugaku20-sve-4k", id: "fugaku20", preset: "iso", cutaway: true },
  { name: "51-qspin-silicon-dot-4k", id: "qspin", preset: "iso", cutaway: true },
];

const srv = await startServer(0);
const session = await launchHeadlessSession({ width: 3840, height: 2160 });
const report = [];

try {
  await session.navigate(`${srv.url}/index.html?auto=0&q=high`);
  await session.waitForLabBoot(35000);

  const gpuName = await session.evalValue(`(() => {
    const gl = LAB.renderer.getContext();
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  })()`);
  console.log(`WebGL2 GPU Renderer: ${gpuName}\n`);

  // Capture 3 full 1920x1080 UI screenshots first (showing 3D viewport + right-hand inspector + toolbar)
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 150));

  for (const id of ["pc20", "eniac46", "wse24"]) {
    await session.evalValue(`(() => {
      LAB.select(${JSON.stringify(id)});
      for (let i = 0; i < 20; i++) {
        LAB.active.update(0.025, i * 0.025, { diagram: LAB.active.diag, openCard: () => {} });
        for (const a of LAB.active.kit.anims) a(0.025, i * 0.025);
      }
      if (${JSON.stringify(id)} === "eniac46" && LAB.active._layers) {
        LAB.active._layers.set("hw", 3);
        LAB.active._layers.setLens(1);
        LAB.active._layers.draw(1.0, true);
      }
      LAB.fx.render();
      return true;
    })()`);
    await new Promise((r) => setTimeout(r, 140));
    const shot = await session.send("Page.captureScreenshot", { format: "png" });
    const uiPath = path.join(outDir, `ui-${id}-1920x1080.png`);
    fs.writeFileSync(uiPath, Buffer.from(shot.data, "base64"));
    console.log(`  ✓ Full UI capture saved: ui-${id}-1920x1080.png`);
  }

  // Also capture 1920x1080 UI shot of Tab 5 (Roofline & 1/2 CV^2 Physics Lab) in the CS Atlas!
  await session.evalValue(`(() => {
    LAB.select("hub");
    LAB.openCompare();
    const btn = document.querySelector('.overlay button[data-tab="roofline"]');
    if (btn) btn.click();
    return true;
  })()`);
  await new Promise((r) => setTimeout(r, 180));
  {
    const shot = await session.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(
      path.join(outDir, "ui-atlas-roofline-1920x1080.png"),
      Buffer.from(shot.data, "base64"),
    );
    console.log("  ✓ Full UI capture saved: ui-atlas-roofline-1920x1080.png");
  }
  await session.evalValue(`(() => {
    document.querySelectorAll(".overlay").forEach((o) => o.remove());
    return true;
  })()`);

  // Switch #gl viewport to clean 3840x2160 full-bleed studio render mode for 4K hardware inspection
  await session.send("Emulation.setDeviceMetricsOverride", {
    width: 3840,
    height: 2160,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await session.evalValue(`(() => {
    LAB.setPaused(true);
    document.getElementById("top").style.display = "none";
    document.getElementById("panel").style.display = "none";
    document.getElementById("toolbar").style.display = "none";
    document.getElementById("hint").style.display = "none";
    document.getElementById("labels").style.display = "none";
    document.getElementById("app").style.cssText = "position:fixed;inset:0;display:block;";
    document.getElementById("view").style.cssText = "position:fixed;inset:0;width:3840px;height:2160px;";
    LAB.renderer.setPixelRatio(1);
    LAB.fx.comp.setPixelRatio(1);
    LAB.fx.setSize(3840, 2160);
    LAB.camera.aspect = 3840 / 2160;
    LAB.camera.updateProjectionMatrix();
    return true;
  })()`);
  await new Promise((r) => setTimeout(r, 150));

  for (const shot of SHOTS) {
    const t0 = Date.now();
    const metrics = await session.evalValue(
      `(() => {
        const s = ${JSON.stringify(shot)};
        LAB.select(s.id);
        LAB.slicer.enabled = false;
        LAB.setCutaway(!!s.cutaway, true);
        LAB.setExplode(s.explode || 0, true);
        if (s.id !== "hub" && LAB.active) {
          for (let i = 0; i < 24; i++) {
            LAB.active.update(0.025, i * 0.025, { diagram: LAB.active.diag, openCard: () => {} });
            for (const a of LAB.active.kit.anims) a(0.025, i * 0.025);
          }
          if (s.slice) {
            LAB.slicer.enabled = true;
            LAB.slicer.axis = s.slice.axis;
            LAB.slicer.offset = s.slice.offset;
            LAB.slicer.apply(LAB.active);
          } else {
            LAB.slicer.apply(LAB.active);
          }
        }
        LAB.setViewPreset(s.preset || "iso", true);
        LAB.fx.setSize(3840, 2160);
        LAB.camera.aspect = 3840 / 2160;
        LAB.camera.updateProjectionMatrix();
        LAB.fx.render();

        const glCanvas = document.getElementById("gl");
        const c = document.createElement("canvas");
        c.width = 320;
        c.height = 180;
        const ctx = c.getContext("2d");
        ctx.drawImage(glCanvas, 0, 0, 320, 180);
        const data = ctx.getImageData(0, 0, 320, 180).data;
        let sumL = 0, sumL2 = 0, clippedWhite = 0, nonDark = 0;
        const n = 320 * 180;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          sumL += l;
          sumL2 += l * l;
          if (r >= 253 && g >= 253 && b >= 253) clippedWhite++;
          if (l > 18) nonDark++;
        }
        const meanLum = +(sumL / n).toFixed(2);
        const stdLum = +Math.sqrt(Math.max(0, sumL2 / n - (sumL / n) ** 2)).toFixed(2);
        const pctWhiteClip = +((clippedWhite * 100) / n).toFixed(3);
        const pctNonDark = +((nonDark * 100) / n).toFixed(1);
        const dataUrl = glCanvas.toDataURL("image/png");
        window.__shotB64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
        return {
          meanLum,
          stdLum,
          pctWhiteClip,
          pctNonDark,
          b64Len: window.__shotB64.length,
        };
      })()`,
      60000,
    );

    const chunks = [];
    const step = 900000;
    for (let off = 0; off < metrics.b64Len; off += step) {
      const part = await session.evalValue(
        `window.__shotB64.slice(${off}, ${off + step})`,
        15000,
      );
      chunks.push(part);
    }
    await session.evalValue(`window.__shotB64 = ""`);
    const outPath = path.join(outDir, `${shot.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(chunks.join(""), "base64"));

    const entry = {
      name: shot.name,
      file: outPath,
      w: 3840,
      h: 2160,
      ms: Date.now() - t0,
      meanLum: metrics.meanLum,
      stdLum: metrics.stdLum,
      pctWhiteClip: metrics.pctWhiteClip,
      pctNonDark: metrics.pctNonDark,
    };
    report.push(entry);
    console.log(
      `  ✓ ${shot.name} (3840×2160 in ${entry.ms}ms) — meanLum=${entry.meanLum}, std=${entry.stdLum}, whiteClip=${entry.pctWhiteClip}%, lit=${entry.pctNonDark}%`,
    );
  }

  fs.writeFileSync(
    path.join(outDir, "audit-report.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(`\nAudit complete -> ${outDir}`);
} finally {
  await session.close();
  await srv.close();
}
