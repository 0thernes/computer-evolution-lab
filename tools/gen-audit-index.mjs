// Generates docs/AUDIT-INDEX.md: a table of contents of every tracked file with its line count
// (or byte size for binaries), layer and one-line purpose. The purpose comes from the file's own
// header comment / first heading, or from PURPOSE below when the file has none.
//   node tools/gen-audit-index.mjs          # rewrite docs/AUDIT-INDEX.md
//   node tools/gen-audit-index.mjs --check  # exit 1 if the committed index is stale (used by tests)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "AUDIT-INDEX.md");

const PURPOSE = {
  "src/sim/core-simulators.js":
    "Classic simulator cores and numeric helpers (PDP-8, Altair, Zuse, quantum/NMR and frontier models)",
  "src/machines/machines-early.js":
    "Early-machine exhibits: Turing, Z1, analog, tube, PDP-8 and Altair",
  "src/machines/machines-frontier.js":
    "Frontier exhibits: AI box, BCI, quantum, 6502, photonic and artificial life",
  "src/machines/machines-pc.js": "Home/PC exhibits: home80, pc90, pc00, pc10",
  "src/layers/layer-stack.js":
    "Interactive abstraction-rung inspector and per-machine layer adapters",
  "styles/lab.css": "Responsive lab layout, controls, typography and motion styling",
  "tools/assets/make_textures.py":
    "Build PBR textures from CC0 ambientCG source archives",
  "tools/audit-exhaustive.mjs":
    "Static cross-file symbol, material, SFX and HTML reference checks",
  "tools/build-desktop.mjs": "Package runtime files into Windows desktop wrapper",
  "tools/build-icon.mjs": "Render and encode multi-resolution Windows icon",
  "tools/cdp-harness.mjs":
    "Chrome discovery, lifecycle, CDP transport and browser evaluation helpers",
  "tools/render-4k-audit.mjs": "Render scene screenshots and metrics at 4K",
  "tools/run-tests.mjs":
    "Static, RV32, headless WebGL2, scene and audio regression gates",
  "tools/score/check.py": "Score chroma and audio signal diagnostics",
  "tests/security.test.mjs": "Local server path confinement regressions",
  "tests/simulators.test.mjs": "Simulator behavioral and numeric regressions",
  "vendor/three-bundle.js":
    "Three.js r170 and add-ons bundle (MIT, see THIRD-PARTY-NOTICES.md)",
  ".editorconfig": "Editor whitespace/charset defaults",
  ".gitattributes": "Line-ending normalisation (LF) and binary file markers",
  ".gitignore": "Untracked build output, node_modules, release tier",
  ".nojekyll": "Disables Jekyll on GitHub Pages so files are served verbatim",
  ".prettierignore": "Files excluded from Prettier (vendor bundle, audio)",
  ".prettierrc.json": "Prettier style configuration",
  ".github/CODEOWNERS": "Default code owner",
  ".github/workflows/ci.yml":
    "CI: Prettier, static audit, unit tests, Dormann 6502, headless WebGL2 suite",
  ".cursor/rules/build-standard.mdc":
    "Cursor alwaysApply rule pointing to canonical AGENTS.md",
  "CITATION.cff": "Citation File Format metadata for academic citation",
  "CLAUDE.md": "Claude Code pointer to canonical AGENTS.md",
  "GEMINI.md": "Gemini CLI and Antigravity pointer to canonical AGENTS.md",
  "llms.txt": "Build Standard v1.2.0 machine-readable documentation index",
  "repo.yaml": "Build Standard v1.2.0 repository compliance manifest",
  LICENSE: "Project license (non-commercial research & play)",
  VERSION: "Single source of truth for the release version",
  "package.json": "npm scripts and Node engine requirement (no runtime dependencies)",
  "index.html":
    "Entry page (identical to computer-evolution-lab.html); CSP, boot screen, script order",
  "computer-evolution-lab.html":
    "Double-click entry page; must stay byte-identical to index.html",
  "assets/tier.json": "Asset tier manifest read by src/assets/asset-locator.js",
  "assets/hdri/studio_1k.hdr":
    "1K Radiance HDRI for image-based lighting (CC0, see CREDITS.md)",
  "assets/icon/computer-evolution-lab.ico":
    "Windows/desktop icon (built by tools/build-icon.mjs)",
  "desktop/ComputerEvolutionLab.csproj":
    "Windows desktop wrapper project (WebView2, .NET)",
  "desktop/Program.cs":
    "Windows desktop wrapper: loopback server, Host/Origin checks, WebView2 host",
  "docs/badges/coverage.json": "Shields.io endpoint badge data",
  "tools/serve.mjs":
    "Local static server bound to 127.0.0.1 with root-confined path resolution",
  "tools/score/data/freesound_meta.json":
    "Source metadata for the impulse responses used by the score renderer",
};

function layerOf(f) {
  if (f.startsWith(".github/workflows/")) return "CI";
  if (f.startsWith(".github/")) return "docs";
  if (f.startsWith("src/app/")) return "app";
  if (f.startsWith("src/core/")) return "app";
  if (f.startsWith("src/assets/")) return "app";
  if (f.startsWith("src/sim/")) return "sim cores";
  if (f.startsWith("src/machines/")) return "machines";
  if (f.startsWith("src/layers/")) return "layers";
  if (
    f.startsWith("src/audio/") ||
    f.startsWith("assets/audio/") ||
    f.startsWith("assets/music/")
  )
    return "audio";
  if (f.startsWith("src/graphics/") || f.startsWith("styles/")) return "graphics";
  if (f.startsWith("tests/")) return "tests";
  if (f.startsWith("tools/")) return "tools";
  if (f.startsWith("desktop/")) return "desktop";
  if (f.startsWith("docs/screenshots/") || f.startsWith("assets/")) return "assets";
  if (f.startsWith("vendor/")) return "vendor";
  if (f.endsWith(".md") || f === "CITATION.cff" || f === "LICENSE") return "docs";
  if (f.endsWith(".html")) return "app";
  return "config";
}

const BIN = /\.(mp3|ogg|jpg|jpeg|png|hdr|ico|wav)$/i;

function purposeOf(f, text) {
  if (PURPOSE[f]) return PURPOSE[f];
  if (f.startsWith("assets/music/")) {
    const n = path.basename(f, ".ogg");
    return `Sampled score stem \`${n}\` (CC0 VSCO 2 CE render, see SOUNDS.md)`;
  }
  if (f.startsWith("assets/audio/") && f.endsWith(".mp3"))
    return `CC0 hardware SFX recording \`${path.basename(f)}\` (see CREDITS.md)`;
  if (f.startsWith("assets/tex/"))
    return `CC0 PBR map \`${path.basename(f)}\` (see CREDITS.md)`;
  if (f.startsWith("docs/screenshots/")) return "README screenshot";
  if (BIN.test(f)) return "Binary asset";
  const lines = text.split("\n").slice(0, 12);
  for (const raw of lines) {
    const l = raw.trim();
    let m;
    if ((m = l.match(/^#{1,3}\s+(.+)/)) && f.endsWith(".md")) return m[1];
    if ((m = l.match(/^\/\/\s*(.+)/))) return m[1];
    if ((m = l.match(/^"""(.+?)(""")?$/))) return m[1];
    if ((m = l.match(/^name:\s*(.+)/)) && f.endsWith(".yml"))
      return m[1].replace(/"/g, "");
  }
  return "(no header comment — see file)";
}

function clean(s) {
  return s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim().slice(0, 150);
}

export function buildIndex() {
  const files = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter((f) => f !== "docs/AUDIT-INDEX.md")
    .sort();
  const groups = new Map();
  let totalLines = 0;
  for (const f of files) {
    const abs = path.join(ROOT, f);
    if (!fs.existsSync(abs)) continue;
    const buf = fs.readFileSync(abs);
    const bin = BIN.test(f);
    const text = bin ? "" : buf.toString("utf8");
    const lines = bin
      ? 0
      : text.length
        ? text.split("\n").length - (text.endsWith("\n") ? 1 : 0)
        : 0;
    totalLines += lines;
    const layer = layerOf(f);
    if (!groups.has(layer)) groups.set(layer, []);
    groups.get(layer).push({
      f,
      size: bin ? `${(buf.length / 1024).toFixed(1)} KB` : String(lines),
      purpose: clean(purposeOf(f, text)),
    });
  }
  const order = [
    "app",
    "sim cores",
    "machines",
    "layers",
    "graphics",
    "audio",
    "tools",
    "tests",
    "CI",
    "docs",
    "assets",
    "vendor",
    "desktop",
    "config",
  ];
  const out = [];
  out.push("# Audit index and table of contents");
  out.push("");
  out.push(
    "Generated by `node tools/gen-audit-index.mjs` from `git ls-files`; `tests/audit-index.test.mjs` fails when it is stale. " +
      "Line counts are text lines; binaries show size. The pass-by-pass findings are in [`AUDIT-LOG.md`](AUDIT-LOG.md).",
  );
  out.push("");
  out.push(
    `Indexed files (excluding this generated index): **${files.length}** · text lines: **${totalLines.toLocaleString("en-US")}**`,
  );
  out.push("");
  out.push("## Contents");
  out.push("");
  for (const l of order)
    if (groups.has(l))
      out.push(`- [${l}](#${l.replace(/\s+/g, "-")}) (${groups.get(l).length} files)`);
  for (const l of order) {
    if (!groups.has(l)) continue;
    out.push("");
    out.push(`## ${l}`);
    out.push("");
    out.push("| File | Lines / size | Purpose |");
    out.push("| :--- | ---: | :--- |");
    for (const r of groups.get(l)) out.push(`| \`${r.f}\` | ${r.size} | ${r.purpose} |`);
  }
  out.push("");
  return out.join("\n");
}

if (import.meta.url === pathToHref(process.argv[1])) {
  const md = buildIndex();
  if (process.argv.includes("--check")) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (normalise(cur) !== normalise(md)) {
      console.error("docs/AUDIT-INDEX.md is stale: run node tools/gen-audit-index.mjs");
      process.exit(1);
    }
    console.log("docs/AUDIT-INDEX.md is current");
  } else {
    fs.writeFileSync(OUT, md);
    console.log(`wrote ${path.relative(ROOT, OUT)}`);
  }
}

function pathToHref(p) {
  return p ? pathToFileURL(path.resolve(p)).href : "";
}

// Ignore only table padding/separator width introduced by Prettier. Content and counts stay strict.
function normalise(md) {
  return md
    .split("\n")
    .map((line) =>
      line.startsWith("|")
        ? line
            .split("|")
            .map((cell) => (/^\s*:?-+:?\s*$/.test(cell) ? "---" : cell.trim()))
            .join("|")
        : line,
    )
    .join("\n");
}
