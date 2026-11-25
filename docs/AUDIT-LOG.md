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

### 07 — Performance, memory and listener lifetime

- Reviewed `ensureBuilt`/`touchGPU` (lazy build and LRU geometry release), every `window`/`document` listener and every `requestAnimationFrame`/timer outside the main loop.
- The LRU branch that skips the active machine looked like a leak but is unreachable (the active machine is always pushed last), so it was left unchanged.
- H025 (bug, fixed): `machine-pc20.js` `ui()` added a `window` `pointerup` listener on every visit to the Modern PC; each one kept its closure alive. Replaced with pointer capture on the GPU canvas (`pointerup`, `pointercancel`, `lostpointercapture`).
- H026 (issue, deferred): the proxy-mode LRU frees geometry only; textures and materials of left machines stay resident. Disposing shared `U.*` textures would force re-uploads for visible machines and needs a measured device test (ADR 0005), so it is out of scope for a text-only pass.
- Toolchain note: compile-checking `desktop/Program.cs` needs the .NET 10 SDK with Windows targeting. Installing it on the audit box filled the shared disk (see pass 08 note), so the C# change in H022 is reviewed but not compiled here; CI does not build the desktop app either (H027).
- H027 (issue, deferred): no CI job compiles `desktop/`. A `windows-latest` job would need ≈ 1 min plus the WebView2 restore; deferred to keep CI on one runner until the maintainer decides.

### 08 — Accessibility (WCAG 2.2) and UI counts

- Checked focus styles, reduced motion (CSS and the hub auto-spin honour it), live region, accessible names, toggle state, dialogs, and text contrast of every CSS `color:` against the panel colours (all ≥ 4.5:1 except dark-on-light active buttons, which are ≥ 7:1 against their own fill).
- H028 (bug, fixed): the Atlas filter read "Circle II · Mainframes & Servers (8)" after the B1700 joined (9 rows). Filter labels now count the spec rows.
- H029 (issue, fixed): the three overlays (Atlas, Help, Sound credits) had no dialog role, name or focus handling; keyboard focus stayed behind the overlay. New `asModalDialog()` sets `role="dialog"`, `aria-modal`, a name, moves focus in, keeps Tab inside, and restores focus on every close path.
- H030 (issue, fixed): toggle buttons (Cutaway, Slice, Labels, Spin, Flip) showed state only by colour; they now carry `aria-pressed`. The active timeline machine gets `aria-current`.
- H031 (issue, fixed): icon-only tour buttons (◀ ❚❚ ▶) had no accessible names; the pause button's name now follows its state. The audio button's name tracks mute.
- H032 (conflict, fixed): the audio button's tooltip still said "composer theme" (ADR 0002); now "mood palette".
- H033 (bug, fixed): pressing `G` twice stacked two Atlas overlays.
- H034 (issue, fixed): the Atlas plot drew its "no data" dash at 2.7:1 contrast; raised to 6.8:1.

### 09 — Historical and numeric claims (sampled against primary or reference sources)

Scope: the 49-row README roster (years, names) and the claims most often repeated in code and docs. Not every sentence in 85 k lines was checked; unchecked text is not claimed to be verified.

- Confirmed: Landauer `k_B T ln 2` at 300 K = 2.87 zJ; 6502 introduced Sept 1975 at $25 with 3,510 transistors; Cray-1 80 MHz (1976); VAX-11/780 (announced 1977, shipped 1978); ASCI Red first TFLOPS (1997); DishBrain (2022); Frontier 9,408 nodes / 37,632 MI250X. MOnSter 6502 figures match monster6502.com (3,218 enhancement MOSFETs, 1,019 resistors, 4,769 parts, 313 LEDs, ≈50 kHz).
- H035 (error, fixed): README called the MOnSter carrier "3,218 discrete SMD MOSFET"; the board has 2,588 discrete + 630 in quad arrays. README and the 6502 package-level layer text corrected.
- H036 (error, fixed): Frontier was described as reaching "1.194 × 10¹⁸ FP64 ops/s in May 2022". TOP500: 1.102 EF (June 2022), 1.194 EF (June 2023, after tuning). Corrected in `machines-super.js`, `layers-expansion.js`, README.
- H037 (error, fixed): the Tandem exhibit said it was "Designed by Jimmy Treybig, Mike Green, and Jim Gray" and dated 1977. Tandem was founded in 1974 by Treybig, Green, Katzman and Loustaunou; the first Tandem/16 shipped to Citibank in May 1976 (Datapro 1979 report; Wikipedia); Gray joined in 1980 and TMF logging came in the early 1980s. Era, blurb, spec-row year, Atlas text, glossary, SUMMARY and README corrected; the internal id `tandem77` is kept for saved links.
- H038 (issue, fixed): "mirrored RAID-1" in Tandem text used a term coined in 1987 for a 1976 design; now "mirrored disks".

### 10 — Licensing and attribution

- Re-checked every external asset licence on its source page on 2026-11-24: 9 Freesound recordings (all CC0 1.0), 5 Wikimedia Commons files (all CC0), 6 ambientCG material ids (pages resolve; ambientCG is CC0), the Poly Haven HDRI (author Sergej Majboroda, CC0). The visual6502 netlist (CC BY-NC-SA) and Dormann binary (GPL-3) are fetched at run/CI time only, never vendored. Literature citations in `THIRD-PARTY-NOTICES.md` checked for volume/page (Kagan 2022, Izhikevich 2003, Clements 2016, Shen 2017, Seelig 2006).
- H039 (issue, fixed): `CREDITS.md` did not state the provenance of the icon and README screenshots, and omitted ESLint among build-time tools.
- H040 (problem, fixed): the README "coverage" badge reports exhibits verified by the headless suite, not code coverage, but was labelled "coverage". Relabelled "headless-verified exhibits".

### 11 — Tests and the headless harness under load

- Full headless suite on the audit box under load average 12–14: 62 passed, 0 failed (≈3.5 min), before the pass 10–11 changes.
- Node's built-in coverage over `tests/*.test.mjs` only measures files loaded as modules (`tools/serve.mjs` 88 % lines, `gen-audit-index.mjs` 97 %); the classic browser scripts run through `vm` are not counted. H041 (issue, deferred): no line-coverage figure exists for `src/`; measuring it needs V8 coverage through CDP in the headless run, which is new tooling.
- H042 (bug, fixed): `evalValue()` raced `send()` against a second `setTimeout` that was never cleared, so each of the hundreds of evaluations left a live 90 s timer; with `process.exitCode` (not `exit`) the runner could linger up to 90 s after printing its summary.
- H043 (problem, fixed): all harness timeouts were fixed constants (15 s for the DevTools endpoint, 60 s boot, 90 s per call). On an overloaded host Chrome start-up alone can exceed 15 s, which matches the earlier "aborted on unrelated scenes" reports. Added `CEL_TIMEOUT_SCALE` (≥ 1) applied to every harness timeout.
- H044 (issue, fixed): accessibility had no regression test. The headless suite now checks dialog role/name, focus entering and returning, single Atlas overlay, `aria-pressed`, no unnamed visible buttons, and the data-derived Circle II count.

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
| H025 | bug      | fixed    | pc20 window listener per visit                                      |
| H026 | issue    | deferred | LRU frees geometry but not textures                                 |
| H027 | issue    | deferred | No CI compile of `desktop/`                                         |
| H028 | bug      | fixed    | Atlas Circle II count 8 → computed                                  |
| H029 | issue    | fixed    | Modal dialog semantics and focus                                    |
| H030 | issue    | fixed    | `aria-pressed`, `aria-current`                                      |
| H031 | issue    | fixed    | Accessible names for icon buttons                                   |
| H032 | conflict | fixed    | "composer theme" tooltip                                            |
| H033 | bug      | fixed    | Duplicate Atlas overlay                                             |
| H034 | issue    | fixed    | Plot "no data" contrast                                             |
| H035 | error    | fixed    | MOnSter transistor breakdown                                        |
| H036 | error    | fixed    | Frontier HPL dates                                                  |
| H037 | error    | fixed    | Tandem founders and first-ship date                                 |
| H038 | issue    | fixed    | Anachronistic "RAID-1"                                              |
| H039 | issue    | fixed    | Icon/screenshot provenance, ESLint credit                           |
| H040 | problem  | fixed    | Badge relabelled                                                    |
| H041 | issue    | deferred | No line coverage for `src/` classic scripts                         |
| H042 | bug      | fixed    | Uncleared 90 s timer per CDP evaluation                             |
| H043 | problem  | fixed    | `CEL_TIMEOUT_SCALE` for loaded hosts                                |
| H044 | issue    | fixed    | Headless a11y contract test                                         |
