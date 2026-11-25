// Documentation claims that can be checked mechanically against the code (AUDIT-LOG pass 04).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "../tools/serve.mjs";

const read = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), "utf8");
const html = read("index.html");
const scriptCount = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].length;

test("documented classic-script count matches index.html", () => {
  assert.match(
    read("docs/ARCHITECTURE.md"),
    new RegExp(`loads ${scriptCount} classic deferred scripts`),
  );
  assert.match(
    read("docs/SUMMARY.md"),
    new RegExp(`into ${scriptCount} ordered classic JS scripts`),
  );
  assert.match(
    read("docs/INDEX.md"),
    new RegExp(`${scriptCount}-script dependency graph`),
  );
});

test("documented entry-page size matches index.html", () => {
  const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
  assert.match(read("docs/SUMMARY.md"), new RegExp(`\`${kb.replace(".", "\\.")} KB\``));
});

test("ADR index and docs index list every document", () => {
  const adrReadme = read("docs/adr/README.md");
  for (const f of fs.readdirSync(path.join(ROOT_DIR, "docs/adr"))) {
    if (f === "README.md" || !f.endsWith(".md")) continue;
    assert.ok(adrReadme.includes(`(${f})`), `docs/adr/README.md misses ${f}`);
  }
  const docsIndex = read("docs/INDEX.md");
  for (const f of fs.readdirSync(path.join(ROOT_DIR, "docs"))) {
    if (!f.endsWith(".md") || f === "INDEX.md") continue;
    assert.ok(docsIndex.includes(`(${f})`), `docs/INDEX.md misses ${f}`);
  }
});

test("circle rosters in ARCHITECTURE.md sum to 49 distinct machines", () => {
  const arch = read("docs/ARCHITECTURE.md");
  const ids = new Set();
  for (const m of arch.matchAll(
    /^- \*\*Circle [IV]+ [^\n]*?`(\d+)` machines\)\*\*:[^\n]*?\(([^)]*)\)\.?$/gm,
  )) {
    const list = [...m[2].matchAll(/`([a-z0-9]+)`/g)].map((x) => x[1]);
    assert.equal(list.length, Number(m[1]), `roster length for ${m[0].slice(0, 30)}`);
    for (const id of list) ids.add(id);
  }
  assert.equal(ids.size, 49);
});

test("no composer or film names outside the ADR that forbids them (ADR 0002)", () => {
  const banned =
    /\b(Zimmer|Horner|Nolan|Malick|Vangelis|Interstellar|Blade Runner|Philip Glass|Daft Punk|Trapanese|Ex Machina|Imitation Game|Oppenheimer|Dunkirk|Tron: Legacy)\b/;
  const allow = new Set([
    "docs/adr/0002-score-attribution.md",
    "docs/REVIEW-v5.md",
    "CHANGELOG.md",
    "tests/docs-consistency.test.mjs",
    "docs/AUDIT-LOG.md",
  ]);
  const walk = (dir) =>
    fs.readdirSync(path.join(ROOT_DIR, dir), { withFileTypes: true }).flatMap((e) => {
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (["node_modules", ".git", "vendor", "assets"].includes(e.name)) return [];
      return e.isDirectory()
        ? walk(rel)
        : /\.(md|js|mjs|html|py)$/.test(e.name)
          ? [rel]
          : [];
    });
  for (const rel of walk("")) {
    if (allow.has(rel)) continue;
    assert.doesNotMatch(read(rel), banned, rel);
  }
});
