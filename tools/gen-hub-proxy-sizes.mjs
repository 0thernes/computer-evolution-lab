import { chromium } from "playwright-core";
import fs from "node:fs";
// Dev tool: boots the lab with ?hub=full (every machine built) and writes src/app/hub-proxy-sizes.js.
// Needs playwright-core and Chrome: npm i --no-save playwright-core; CHROME=/path/to/chrome
const browser = await chromium.launch({
  executablePath: process.env.CHROME || "/usr/bin/google-chrome",
  headless: true,
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await (
  await browser.newContext({ viewport: { width: 800, height: 600 } })
).newPage();
await page.goto(process.argv[2], { waitUntil: "load", timeout: 120000 });
await page.waitForFunction(() => window.__labStarted === true && window.LAB, null, {
  timeout: 300000,
});
await page.evaluate(() => LAB.setPaused(true));
const data = await page.evaluate(() => {
  const out = {};
  for (const m of LAB.machines) {
    if (LAB.ensureBuilt) LAB.ensureBuilt(m);
    if (!m.size) continue;
    out[m.id] = [+m.size.x.toFixed(4), +m.size.y.toFixed(4), +m.size.z.toFixed(4)];
  }
  return out;
});
const body = Object.entries(data)
  .map(([k, v]) => `  ${k}: [${v.join(", ")}],`)
  .join("\n");
const head = fs.readFileSync(process.argv[3], "utf8").split("var CEL_HUB_PROXY_SIZES")[0];
fs.writeFileSync(
  process.argv[3],
  `${head}var CEL_HUB_PROXY_SIZES = {\n${body}\n};\nwindow.CEL_HUB_PROXY_SIZES = CEL_HUB_PROXY_SIZES;\n`,
);
console.log(Object.keys(data).length, "machines");
await browser.close();
