# Hardening audit log

Baseline: `5b621240c8c98322641367d13dc22db7d2f10caa`, verified clean on main.
Audit date: 2026-11-24 (PST). Environment: Linux, Node 26.13.1 (official archive SHA-256 checked).

## Scope and honesty

Target: up to 200 meaningful cross-cutting passes, not 200 repetitions of a test.
The generated [index](AUDIT-INDEX.md) inventories tracked content, not proof that every
line has been independently understood. Binary assets are inventoried by byte size,
not meaningless newline counts. Each pass below names its actual evidence and limits.
No finite audit establishes absence of all defects; historical/physical models are
educational approximations unless independently validated. Findings have exactly one
class: bug, error, issue, problem, dilemma, or conflict. Tags do not add classes.

## Passes

### 01 — Inventory and baseline gates

- Indexed all tracked files by layer, purpose, text lines/binary size; generated from git.
- Baseline: 38/38 unit tests, static symbol audit, Prettier pass on Node 26.13.1.
- H001 (issue, fixed): no comprehensive tracked-file audit index; add generator and drift check.
- The existing entry HTML is already lean (315 lines), not a single minified application.

### 02 — Syntax and correctness lint

- Ran ESLint 9.39.5 with 30 correctness-only rules over `src/`, `tools/`, `tests/`, and `assets/audio/sfx-clips.js` (vendor excluded); classic-script syntax is also parsed by `tools/run-tests.mjs`.
- H002 (conflict, fixed): `src/core/three-aliases.js` declared a global `var ai`, a name Chromium has used for an experimental built-in. Its only use (`machines-frontier.js`) now calls `THREE.Quaternion` directly; `docs/ALIASES.md` regenerated (421 aliases).
- H003 (issue, fixed): no lint gate in CI. Added a zero-dependency `eslint.config.mjs` and a pinned CI step.

### 03 — CI robustness and supply chain

- Verified the latest releases through the GitHub API on 2026-11-24: `actions/checkout` v7.0.1 → `3d3c42e5aac5ba805825da76410c181273ba90b1`, `actions/setup-node` v7.1.0 → `949feb2413d6458794dcd2491c4babbbce0c15c1` (both tags resolve directly to these commits; both run on `node24`).
- H004 (issue, fixed): pinned actions were v4.2.2 / v4.4.0 (Node 20 runtimes; GitHub forced them onto Node 24). Bumped by SHA.
- H005 (issue, fixed): checkout persisted the job token in `.git/config` although no step pushes. Now `persist-credentials: false`.
- H006 (issue, fixed): no job timeout or concurrency group, so a hung headless browser could hold a runner for 6 h and superseded pushes kept running. Added `timeout-minutes: 30` (recent runs take ≈5 min) and `cancel-in-progress`.
- H007 (issue, fixed): no manual re-run trigger; added `workflow_dispatch`.
- H008 (dilemma, accepted): `npx --yes prettier@3.10.1` / `eslint@9.39.5` are version-pinned but not integrity-pinned. A lockfile would add a `node_modules` install to a zero-dependency repo; kept as-is and recorded.

## Findings register

| ID   | Class    | Status   | Evidence / disposition                            |
| :--- | :------- | :------- | :------------------------------------------------ |
| H001 | issue    | fixed    | Generated tracked-file index and drift check      |
| H002 | conflict | fixed    | Removed the global `ai` alias                     |
| H003 | issue    | fixed    | ESLint correctness gate added                     |
| H004 | issue    | fixed    | Actions bumped to v7.0.1 / v7.1.0 by verified SHA |
| H005 | issue    | fixed    | `persist-credentials: false`                      |
| H006 | issue    | fixed    | Timeout and concurrency                           |
| H007 | issue    | fixed    | `workflow_dispatch`                               |
| H008 | dilemma  | accepted | Version- but not integrity-pinned npx tools       |
