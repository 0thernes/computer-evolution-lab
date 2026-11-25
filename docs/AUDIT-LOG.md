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

### 04 — Documentation accuracy against code

- Compared README, `docs/ARCHITECTURE.md`, `docs/SUMMARY.md`, `docs/INDEX.md`, the glossary and the ADR index with `index.html`, `studio-stage.js`, `lab-main.js`, `run-tests.mjs` and `render-4k-audit.mjs`.
- H009 (conflict, fixed): ARCHITECTURE, SUMMARY and INDEX said 26 classic scripts; `index.html` loads 36.
- H010 (conflict, fixed): ARCHITECTURE §4 described bloom `threshold 0.90 / strength 0.22`, SMAA as an MSAA fallback, a fixed 2048 shadow map and a non-existent `calibrateDielectricColor()`. Rewritten from code: bloom `0.42 / 0.4 / 1.2`, SMAA on Medium+, tier shadow maps 512–4096, plus a tier table.
- H011 (bug, fixed): the `pbr-materials.js` row in ARCHITECTURE's module table had an unescaped `|` inside code, which split the row into an extra column.
- H012 (conflict, fixed): README said the 4K audit renders 51 PNGs; the shot list has 52 scene renders (49 machines + hub + two extra `pc20` views) plus 3 UI captures at 1920×1080.
- H013 (conflict, fixed): SUMMARY claimed "`0.00%` white clipping across 51 4K audit renders". No current measurement backs the number, so the claim now points at the report the tool produces.
- H014 (issue, fixed): `docs/INDEX.md` did not list `B1700.md`, ADR 0007, the audit documents or `CITATION.cff`.
- H015 (issue, fixed): no mechanical check that these documented counts track the code. Added `tests/docs-consistency.test.mjs` (script count, entry-page size, ADR/docs index completeness, circle rosters = 49 distinct ids, ADR 0002 name ban).

### 05 — Score attribution (ADR 0002) and audio test coverage

- H016 (conflict, fixed): SUMMARY advertised the score with six composer names, the exact practice ADR 0002 forbids.
- H017 (conflict, fixed): `src/audio/cinematic-score.js` still carried 49 unused `film:` fields naming films, film-named cue keys (`interstellar`, `oppenheimer`, `inception`, `tron`, `blade`, `matrix`, `exmachina`, `annihilation`, `imitation`, `mind`, `glass`) and comments naming composers ("Daft Punk / Joseph Trapanese", "Philip Glass"). Removed the dead fields; renamed the cues to their mood names (`epic`, `clockwork`, `slowbuild`, `gridarp`, `synthnoir`, `hybridpulse`, `crystalline`, `organic`, `intimate`, `noble`, `shimmer`), which also removes the five alias assignments. Saved v5 preferences still migrate through `SCORE_THEME_MIGRATION`.
- H018 (issue, fixed): the headless audio check iterated a hand-written list of 7 palettes and skipped `slowbuild`. It now iterates `SCORE_THEMES` (all 8).

### 06 — Security (input handling, local servers, integrity pins)

- Reviewed every `innerHTML`/`html:` sink (16): all take author-written strings, none take URL, storage or network data. Re-verified the three visual6502 SHA-256 pins against the pinned commit (all match) and the Dormann pin (test passes).
- H019 (bug, fixed): `?q=constructor` passed `zs[qParam]` (inherited `Object.prototype` key), so `StudioFX.set()` accepted `Object` as a tier and set a `NaN` pixel ratio. `#constructor` likewise selected `Object` as a machine. All three lookups now use `Object.hasOwn`.
- H020 (bug, fixed): stored audio prefs were merged blindly (`Object.assign(this.vol, saved.vol)`); a non-numeric volume reaches `AudioParam.setTargetAtTime`, which throws on non-finite values, and an unknown palette such as `constructor` resolved to `Object` as a cue. Load and `set()` now validate keys, finiteness, range and palette names; procedural cue/machine lookups use own properties.
- H021 (issue, fixed): `tools/serve.mjs` had no Host check (DNS rebinding could read any repo file, `.git/` included, through a victim's browser), served dot-paths, followed symlinks out of the root, crashed on read-stream errors and answered malformed `%` escapes with 500 plus the exception text. Added the Host allow-list (421), dot-segment refusal, realpath confinement, 400 for bad escapes, stream error handling and `Content-Length`.
- H022 (issue, fixed): the desktop wrapper also served dot-segments when rooted at a repo checkout. Added the same refusal (`Program.cs`; see pass 07 for the compile check).
- H023 (bug, fixed): `tools/dormann-6502.mjs` cached the download before verifying it, so one corrupt download failed every later run until `.cache/` was cleared by hand. It now verifies first and deletes a bad cache entry.
- H024 (dilemma, accepted): `visual6502Verify` skips the hash when `crypto.subtle` is unavailable (insecure contexts). The commit pin still fixes the content, and refusing would disable the feature on plain-http LAN hosting. Recorded rather than changed.

## Findings register

| ID   | Class    | Status   | Evidence / disposition                                              |
| :--- | :------- | :------- | :------------------------------------------------------------------ |
| H001 | issue    | fixed    | Generated tracked-file index and drift check                        |
| H002 | conflict | fixed    | Removed the global `ai` alias                                       |
| H003 | issue    | fixed    | ESLint correctness gate added                                       |
| H004 | issue    | fixed    | Actions bumped to v7.0.1 / v7.1.0 by verified SHA                   |
| H005 | issue    | fixed    | `persist-credentials: false`                                        |
| H006 | issue    | fixed    | Timeout and concurrency                                             |
| H007 | issue    | fixed    | `workflow_dispatch`                                                 |
| H008 | dilemma  | accepted | Version- but not integrity-pinned npx tools                         |
| H009 | conflict | fixed    | Script count 26 → 36 in three docs                                  |
| H010 | conflict | fixed    | ARCHITECTURE §4 rewritten from code                                 |
| H011 | bug      | fixed    | Escaped table pipe                                                  |
| H012 | conflict | fixed    | 4K audit PNG count                                                  |
| H013 | conflict | fixed    | Unbacked 0.00 % clipping claim removed                              |
| H014 | issue    | fixed    | Docs index completed                                                |
| H015 | issue    | fixed    | `tests/docs-consistency.test.mjs`                                   |
| H016 | conflict | fixed    | Composer names removed from SUMMARY                                 |
| H017 | conflict | fixed    | Film/composer names removed from score engine                       |
| H018 | issue    | fixed    | Audio check covers all 8 palettes                                   |
| H019 | bug      | fixed    | Own-property lookups for `?q=`, `#hash`, `selectMachine`            |
| H020 | bug      | fixed    | Stored audio prefs validated; tests in `tests/audio-prefs.test.mjs` |
| H021 | issue    | fixed    | Dev server Host check, dot-paths, symlinks, errors                  |
| H022 | issue    | fixed    | Desktop server refuses dot-segments                                 |
| H023 | bug      | fixed    | Dormann cache verified before write                                 |
| H024 | dilemma  | accepted | visual6502 hash check fails open without SubtleCrypto               |
