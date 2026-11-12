import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "./serve.mjs";

const issues = [];
const notes = [];

function walkAll(dir, rel = "") {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  if (entries.length === 0 && rel) {
    issues.push(`Empty directory found: ${rel}`);
  }
  const files = [];
  for (const e of entries) {
    if (
      e.name === "node_modules" ||
      e.name === ".git" ||
      (rel === "desktop" && (e.name === "bin" || e.name === "obj"))
    )
      continue;
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...walkAll(full, childRel));
    } else {
      files.push({ rel: childRel, full });
    }
  }
  return files;
}

const allFiles = walkAll(ROOT_DIR);
let totalLines = 0;

const jsContents = new Map();
for (const f of allFiles) {
  if (/\.(ico|png|jpg|jpeg|webp|exe|dll|pdb|woff2|wasm|zip)$/i.test(f.rel)) continue;
  const txt = fs.readFileSync(f.full, "utf8");
  const lines = txt.split(/\r?\n/);
  totalLines += lines.length;
  if (f.rel.endsWith(".js") || f.rel.endsWith(".mjs")) {
    jsContents.set(f.rel, { txt, lines });
  }
  // Scan for leftover placeholders or TODO/FIXME outside vendor/ and audit script itself
  if (!f.rel.startsWith("vendor/") && f.rel !== "tools/audit-exhaustive.mjs") {
    lines.forEach((line, idx) => {
      if (/\{\{[A-Z0-9_.-]+\}\}/.test(line)) {
        issues.push(`${f.rel}:${idx + 1}: Leftover template placeholder: ${line.trim()}`);
      }
      if (/\b(TODO|FIXME|XXX|HACK)\b/.test(line) && !f.rel.endsWith(".md")) {
        notes.push(`${f.rel}:${idx + 1}: Marker found: ${line.trim().slice(0, 90)}`);
      }
    });
  }
}

// 1. Verify every U.<method> call against src/graphics/pbr-materials.js
const pbrTxt = jsContents.get("src/graphics/pbr-materials.js")?.txt || "";
const uBlock = pbrTxt.slice(pbrTxt.indexOf("var U = {"));
const definedUMethods = new Set(
  [...uBlock.matchAll(/^\s{2}([A-Za-z0-9_]+)\s*:/gm)].map((m) => m[1]),
);
for (const [rel, { lines }] of jsContents) {
  if (rel.startsWith("vendor/") || rel.startsWith("tools/") || rel.startsWith("tests/"))
    continue;
  lines.forEach((line, idx) => {
    const clean = line.replace(/\/\/.*$/, "").replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""');
    for (const m of clean.matchAll(/\bU\.([A-Za-z0-9_]+)\b/g)) {
      const prop = m[1];
      if (!definedUMethods.has(prop)) {
        issues.push(`${rel}:${idx + 1}: Unknown PBR material helper U.${prop}`);
      }
    }
  });
}

// 2. Verify every hi("<sfx>") call against Vm in src/audio/cinematic-score.js
const audioTxt = jsContents.get("src/audio/cinematic-score.js")?.txt || "";
const vmStart = audioTxt.indexOf("var Vm = {");
const vmBlock = vmStart >= 0 ? audioTxt.slice(vmStart) : "";
const definedSfx = new Set(
  [...vmBlock.matchAll(/^\s{2}([A-Za-z0-9_]+)\s*\(/gm)].map((m) => m[1]),
);
for (const [rel, { lines }] of jsContents) {
  if (rel.startsWith("vendor/") || rel.startsWith("tools/") || rel.startsWith("tests/"))
    continue;
  lines.forEach((line, idx) => {
    for (const m of line.matchAll(/\bhi\(\s*["']([A-Za-z0-9_]+)["']/g)) {
      const sfx = m[1];
      if (!definedSfx.has(sfx)) {
        issues.push(`${rel}:${idx + 1}: Unknown SFX name hi("${sfx}")`);
      }
    }
  });
}

// 3. Collect all defined top-level symbols & class/constructor identifiers across src/
const browserBuiltins = new Set([
  "Object",
  "Array",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "Promise",
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "RegExp",
  "Date",
  "Number",
  "String",
  "Boolean",
  "Function",
  "Uint8Array",
  "Uint8ClampedArray",
  "Uint16Array",
  "Uint32Array",
  "Int8Array",
  "Int16Array",
  "Int32Array",
  "Float32Array",
  "Float64Array",
  "ArrayBuffer",
  "DataView",
  "Image",
  "Audio",
  "Blob",
  "URL",
  "URLSearchParams",
  "ResizeObserver",
  "MutationObserver",
  "IntersectionObserver",
  "AudioContext",
  "webkitAudioContext",
  "OfflineAudioContext",
  "WebSocket",
  "Worker",
  "TextEncoder",
  "TextDecoder",
  "Event",
  "CustomEvent",
  "PointerEvent",
  "KeyboardEvent",
  "MouseEvent",
  "Option",
  "FileReader",
  "DOMParser",
]);

const definedConstructors = new Set([...browserBuiltins]);
for (const [rel, { txt }] of jsContents) {
  if (rel.startsWith("vendor/") || rel.startsWith("tools/")) continue;
  for (const m of txt.matchAll(/\b(?:class|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g)) {
    definedConstructors.add(m[1]);
  }
  for (const m of txt.matchAll(
    /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:THREE[A-Za-z0-9_.]*|window\.[A-Za-z0-9_.]*|class\b|function\b|\([^)]*\)\s*=>)/g,
  )) {
    definedConstructors.add(m[1]);
  }
}

for (const [rel, { lines }] of jsContents) {
  if (rel.startsWith("vendor/") || rel.startsWith("tools/") || rel.startsWith("tests/"))
    continue;
  lines.forEach((line, idx) => {
    // Strip single-line comments and string literals roughly for constructor scan
    const clean = line.replace(/\/\/.*$/, "").replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""');
    for (const m of clean.matchAll(/\bnew\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)) {
      const ctor = m[1];
      // Ignore single-letter minified local params like `new i(...)` or `new e(...)`
      if (ctor.length === 1 && ctor === ctor.toLowerCase()) continue;
      if (!definedConstructors.has(ctor)) {
        issues.push(
          `${rel}:${idx + 1}: Potentially undefined constructor 'new ${ctor}(...)'`,
        );
      }
    }
    for (const m of clean.matchAll(/(?<!\.)\b(build[A-Z][A-Za-z0-9_]*)\s*\(/g)) {
      const fn = m[1];
      if (!definedConstructors.has(fn)) {
        issues.push(`${rel}:${idx + 1}: Undefined global builder '${fn}(...)'`);
      }
    }
  });
}

// 4. Verify HTML #ids queried in lab-main.js exist in index.html
const htmlTxt = fs.readFileSync(path.join(ROOT_DIR, "index.html"), "utf8");
const htmlIds = new Set([...htmlTxt.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
const mainLines = jsContents.get("src/app/lab-main.js")?.lines || [];
const dynamicModalIds = new Set(["ap-theme", "ap-track", "ap-state"]);
mainLines.forEach((line, idx) => {
  for (const m of line.matchAll(/\$\(\s*["']#([A-Za-z0-9_-]+)["']\s*\)/g)) {
    const id = m[1];
    if (!htmlIds.has(id) && !dynamicModalIds.has(id)) {
      issues.push(
        `src/app/lab-main.js:${idx + 1}: Selector $("#${id}") missing from index.html`,
      );
    }
  }
});

console.log(
  `Scanned ${allFiles.length} files (${totalLines.toLocaleString()} total lines) in ${ROOT_DIR}`,
);
console.log(
  `  Defined U.* materials (${definedUMethods.size}): ${[...definedUMethods].join(", ")}`,
);
console.log(`  Defined hi() SFX (${definedSfx.size}): ${[...definedSfx].join(", ")}`);
console.log(`  Defined constructors/aliases: ${definedConstructors.size}`);

if (notes.length) {
  console.log(`\nNotes (${notes.length}):`);
  for (const n of notes) console.log(`  • ${n}`);
}
if (issues.length) {
  console.log(`\nISSUES FOUND (${issues.length}):`);
  for (const i of issues) console.log(`  ✗ ${i}`);
  process.exitCode = 1;
} else {
  console.log(
    `\n✓ ZERO static symbol, U.*, hi(), HTML #id, or directory issues across all ${totalLines.toLocaleString()} lines!`,
  );
}
