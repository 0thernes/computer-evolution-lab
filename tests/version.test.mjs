// VERSION, package.json, the desktop csproj, CITATION.cff and the top CHANGELOG
// entry must agree (review finding C2).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "../tools/serve.mjs";

const read = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), "utf8");

test("version strings agree across the repo", () => {
  const v = read("VERSION").trim();
  assert.match(v, /^\d+\.\d+\.\d+$/);
  assert.equal(JSON.parse(read("package.json")).version, v, "package.json");
  const csproj = fs
    .readdirSync(path.join(ROOT_DIR, "desktop"))
    .find((f) => f.endsWith(".csproj"));
  assert.match(
    read(`desktop/${csproj}`),
    new RegExp(`<Version>${v}</Version>`),
    "csproj",
  );
  assert.match(read("CITATION.cff"), new RegExp(`^version: ${v}$`, "m"), "CITATION.cff");
  const firstRelease = read("CHANGELOG.md").match(/^## \[(\d+\.\d+\.\d+)\]/m);
  assert.equal(firstRelease && firstRelease[1], v, "CHANGELOG top release");
});
