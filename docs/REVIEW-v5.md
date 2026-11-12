# Computer Evolution Lab: Deep Code & Product Review

**Repo:** `github.com/0thernes/computer-evolution-lab` @ `b06d55a` (tag v5.0.0, pushed 2026-11-12 07:34 PST)
**Clone:** `/workspace/cel-review/` (read-only review; nothing committed or pushed)
**Baseline for comparison:** old box copy `/workspace/computer-evolution-lab/` (v6, `e81026d`, untouched)
**Review date:** Thu 2026-11-12 (times in US Pacific, PST)
**Evidence:** logs in `/workspace/cel-review-logs/`, screenshots in `/workspace/cel-review-shots/`, verification scripts in `/workspace/cel-review-tools/`

---

## 0. Headline verdict

The repo is a big, working **breadth** upgrade. It has 48 machines across 4 "Grand Circles" plus the hub (49 scenes). It loads cleanly: 0 console errors across all 49 scenes over HTTP and `file://`, and the repo's whole test suite passes. The core emulators really compute:

- The 6502 passes Klaus Dormann's full functional test in both CPU models.
- RV32IM matches an independent reference on 13,032 ALU/M operations.
- The PDP-8, the quantum state-vector and Grover are real.

It has five big weaknesses:

1. **Graphics and music went backwards from our v6.** There are no PBR texture sets, no HDRI, no GTAO/SMAA/DoF, and no sampled orchestra. The score is oscillator synthesis again.
2. **About 45% of the app code is de-minified bundle output** with 1–2-letter names.
3. **The hub is far too heavy for a phone**: 14,616 draw calls and 16.1 M triangles. All 48 machines are built at boot.
4. **Several claims are inflated.** The "5-stage pipeline" is an instruction-set simulator with telemetry. The "1,584 sub-lens views" come from 8 generic gate templates. The AGC is a toy model.
5. **Both loopback servers have a path-prefix traversal bug.** It is proven on `serve.mjs`.

**Counts (49 findings):**

| Category | Count | Highest severity  |
| -------- | ----- | ----------------- |
| bug      | 9     | Medium            |
| error    | 1     | Info (historical) |
| issue    | 14    | High              |
| problem  | 8     | High              |
| dilemma  | 7     | (needs decision)  |
| conflict | 10    | Medium            |

---

## 1. What changed versus our v6

### 1.1 History and lineage

- The GitHub repo has **its own 7-commit history** (2026-11-10 → 2026-11-12) and **shares no commits with v6**, which has no remote. Its first commit, `de3196b` "modular … v2.0", is 41,074 lines. That code is a **prettier-formatted de-minified bundle of a pre-v6 (v5-era) build**:
  - Minifier-style identifiers: `Sr`, `Xc`, `Ca`, `e0`, `Zl`, `Ni`.
  - The v5 feature set is present (RoomEnvironment lighting, Altair panel, DOS DIAL, BASIC SAVE).
  - v6 assets are absent: no `assets/tex`, `assets/hdri` or `assets/music` stems, no GTAO/SMAA/DoF, no VSCO samples.
- Commits after that:
  - `bf590b3`: "4K PBR" procedural materials.
  - `bc002dc` / `497c717`: Windows .exe built on .NET + WebView2.
  - `41f64d1` v3: 32 machines.
  - `96f76af` v4: 40 machines.
  - `b06d55a` v5: 48 machines, 11-rung × 3-lens layers, BusPulse3D, Roofline atlas.

### 1.2 Side by side

|                   | v6 (box)                                                                                   | Repo v5.0.0                                                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Machines / scenes | 17 / 18                                                                                    | 48 / 49                                                                                                                                                                                                                    |
| Code              | readable ES modules (`js/sim/*.js`, `js/machines/m*.js`), Vite-style package               | 26 classic `<script>` files, 822 top-level globals, no build step                                                                                                                                                          |
| Three.js          | r170 (npm)                                                                                 | r170 bundled (`vendor/three-bundle.js`, 725 KB) + minified-alias shim (`src/core/three-aliases.js`)                                                                                                                        |
| Lighting          | Poly Haven HDRI "Studio Small 09" (CC0)                                                    | procedural `RoomEnvironment`                                                                                                                                                                                               |
| Materials         | ambientCG CC0 PBR maps 512/1K/2K, RoundedBox bevels, lathe valves, 4K keycap legends       | procedural canvas textures (`src/graphics/pbr-materials.js`), mostly primitive boxes/cylinders                                                                                                                             |
| Post-processing   | GTAO + SMAA + selective bloom + close-up DoF                                               | HalfFloat MSAA + UnrealBloom + custom sharpen/vignette pass                                                                                                                                                                |
| Score             | 18 original cues rendered from VSCO 2 CE (CC0) samples + CC0 hall/church IRs, 3 stems each | 49 procedural WebAudio cues (25 `createOscillator` sites, 0 sample decodes), 7 "composer palettes"                                                                                                                         |
| SFX               | 12 CC0 recordings (Freesound/Wikimedia) + synthesis                                        | 4 embedded clips (bell, floppy, keys, modem) + 29 synthesized `hi()` voices                                                                                                                                                |
| Size              | ~310 MB working tree (135 MB assets)                                                       | 4.8 MB repo                                                                                                                                                                                                                |
| Extras            | none                                                                                       | RV32IM mini PC with WebGL2 GPU via MMIO, 31 new sims (mainframes, supercomputers, 9 quantum modalities), CS Atlas (5 tabs incl. Roofline), X/Y/Z slicer, BusPulse3D, gate bench / eye scope, Windows exe, CI, Pages deploy |

### 1.3 New architecture

```
index.html (= computer-evolution-lab.html, 10.7 KB; boot screen + 26 classic scripts, file:// safe)
 ├─ vendor/three-bundle.js           Three r170 + OrbitControls + RoomEnvironment + EffectComposer/Bloom/OutputPass
 ├─ src/core/three-aliases.js        THREE.* -> minifier aliases (Zl=WebGLRenderer, Ni=Scene, Ae=Color, …)
 ├─ src/core/dom-ui.js               tiny DOM builders (q(), st(), …)
 ├─ src/graphics/{pbr-materials,kit-3d,studio-stage}.js   U.* procedural materials, part kit, StudioFX tiers (low/medium/high/ultra)
 ├─ src/sim/core-simulators.js       (de-minified) PDP-8, EDSAC, quantum state-vector, Z1 FP, 6502 (Sr), photonic MZI, diffractive net …
 ├─ src/sim/riscv-modern-pc.js       RV32IM assembler + ISS + pipeline/caches telemetry + MMIO (UART/GPU/NVMe) + mini-OS shell
 ├─ src/sim/enterprise-hpc-quantum-sims.js   23 classes: S/360, PDP-11 UNIX, MESI+RAID5, Raft, Telum, Cray-1, CM-2, Blue Gene,
 │                                            Frontier HPL, NVL72 MoE, surface code, Rydberg, MBQC, Majorana, OMEGA-Q, AGC, Alto, ARM, VAX, CDC 6600, ASCI Red, ion trap, annealer
 ├─ src/sim/hardwired-frontier-sims.js        8 classes: ENIAC, Symbolics LISP, WSE, Tandem, hypervisor NUMA, systolic, Fugaku SVE, Si spin QPU
 ├─ src/layers/{layer-stack,layers-expansion,hardwired-gate-engine}.js   11 rungs × 3 lenses; 8 switching-family gate templates + eye scope
 ├─ src/app/compare-modal.js         CS Atlas (5 tabs incl. Roofline + ½CV² cascade)
 ├─ src/audio/cinematic-score.js     procedural orchestra + convolver reverb + limiter; 49 scene cues
 ├─ src/machines/*.js                9 files of machine factories (build(kit), update(), test(), layers)
 └─ src/app/lab-main.js              renderer, hub campus, camera rig, slicer, raycast inspector, frame loop, window.LAB test API
desktop/Program.cs                    WinForms + WebView2 shell, embedded TcpListener loopback server
tools/                                serve.mjs, run-tests.mjs (CDP harness), audit-exhaustive.mjs, render-4k-audit.mjs, build-desktop/icon
.github/workflows/ci.yml              audit + node --test + run-tests --ci-headless-optional (Node 22)
```

---

## 2. Build, run and tests (all run on the box, Linux, Node 24.22, Chrome at /usr/bin/google-chrome)

| Command                                                                                                                  | Result                                                                                                                                                             | Log                                                                 |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `node tools/audit-exhaustive.mjs`                                                                                        | **PASS**: 0 symbol/U.*/hi()/#id issues across 73,876 lines                                                                                                         | `cel-review-logs/audit.log`                                         |
| `node --test tests/simulators.test.mjs`                                                                                  | **PASS 10/10**                                                                                                                                                     | `cel-review-logs/unit.log`                                          |
| `node tools/run-tests.mjs --ci-headless-optional` (CI step)                                                              | **61 passed, 0 failed**. Headless Chrome did run here: 48 machines, 528 layer canvases, pc20 deep checks, audio, file:// with 22 machines                          | `cel-review-logs/ci.log`                                            |
| `npx prettier@3 --check …` (`npm run format:check`)                                                                      | **PASS**                                                                                                                                                           | `cel-review-logs/prettier.log`                                      |
| `node tools/serve.mjs 4199`                                                                                              | serves fine                                                                                                                                                        | n/a                                                                 |
| **My Playwright pass**: HTTP, `q=low`, 1280×720, render loop paused and one deterministic render per scene (state-based) | **49/49 scenes** selected, updated and rendered. **0 console errors/warnings, 0 page errors, 0 external network requests.** Boot 72.5 s (SwiftShader). Heap 148 MB | `cel-review-shots/desk-log.json`, `cel-review-logs/scenes-desk.log` |
| Playwright over **file://** (hub, pc20, m6502, qomega, eniac46)                                                          | **5/5**, 0 errors, boot 87 s                                                                                                                                       | `cel-review-shots/file-log.json`                                    |
| Playwright **High tier** 1920×1080 (cray1, pc20, m6502)                                                                  | 3/3, 0 errors, boot 134 s                                                                                                                                          | `cel-review-logs/scenes-high.log`                                   |
| Playwright **mobile** 412×915 and 915×412 @2.6 DPR (hub, pc20, m6502)                                                    | 0 errors; UX metrics in §4.3                                                                                                                                       | `cel-review-shots/mobile-log.json`                                  |
| GitHub Actions (API)                                                                                                     | last 3 CI runs **success** (b06d55a, 96f76af, 41f64d1); `bc002dc` failed (fixed in next commit)                                                                    | n/a                                                                 |
| **Not run**                                                                                                              | `npm run audit:4k`, `npm run build:exe` / `install:desktop` (need Windows/.NET), visual6502 transistor-netlist mode (opt-in network fetch), real Android device    | n/a                                                                 |

Note: my first harness waited on `requestAnimationFrame` and did not get even the hub rendered within 6 minutes under SwiftShader. That is itself evidence for P1. Pausing the loop and calling `LAB.fx.render()` once per scene fixed it.

---

## 3. Are the "really computing" claims true? (independent spot checks)

| Engine                                                                          | Method                                                                                                              | Verdict                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **6502 functional core** (`Sr`, core-simulators.js:1576)                        | Ran Klaus Dormann `6502_functional_test.bin` (downloaded to /tmp, not vendored)                                     | **REAL: PASS.** Trapped at $3469 (success) after 30,646,177 instructions / 96,241,367 cycles, decimal mode included                                                                                                                 |
| **6502 bus-cycle model** (`Xc`, machines-frontier.js:3345)                      | Same test, counting emitted bus cycles                                                                              | **REAL: PASS.** Same trap and same 96,241,367 bus cycles as the functional core's cycle count                                                                                                                                       |
| 6502 transistor-level (visual6502 netlist)                                      | not exercised (opt-in runtime fetch)                                                                                | **Not verified**                                                                                                                                                                                                                    |
| **RV32IM ISS** (riscv-modern-pc.js)                                             | Differential test: 18 R-type/M ops × 724 operand pairs (edge cases + LCG random) vs an independent BigInt reference | **REAL: 13,032/13,032 match**                                                                                                                                                                                                       |
| RV32I imm/U/load/store/branch/JAL/JALR                                          | 15 targeted checks (sign-extension lb/lh/lbu/lhu, sb/sh, srai/srli/slli, lui/auipc, all 6 branches, call/ret)       | **REAL: 15/15**                                                                                                                                                                                                                     |
| RV32 programs                                                                   | fib(30)=832040, 12!=479001600, gcd(1071,462)=21; repo presets (sieve, quicksort, GPU MMIO, keyboard echo)           | **REAL**                                                                                                                                                                                                                            |
| RV32 "5-stage pipeline, forwarding, caches"                                     | Code read: one instruction per `step()`; pipe regs are display shift registers; cache hits/misses never add cycles  | **TELEMETRY, not a pipeline model** (see C8)                                                                                                                                                                                        |
| RV32 → GPU                                                                      | 1024² ping-pong render target; uniforms come from MMIO writes at 0x20000000                                         | **REAL** (uniform coupling is genuine)                                                                                                                                                                                              |
| **PDP-8** (`Ca`)                                                                | Hand-assembled program: CLA CLL, TAD, CIA, ISZ loop, DCA, JMS / JMP I, RAL                                          | **REAL**: 13×11=143, RAL(13)=26                                                                                                                                                                                                     |
| **Quantum state-vector** (`e0`)                                                 | Reviewed gate matrices (H, X, Y, Z, S, T, RX, RY, RZ), measurement, Bloch vector signs                              | **REAL / correct**                                                                                                                                                                                                                  |
| **Grover** (OMEGA-Q)                                                            | 256 states, 12 iterations                                                                                           | **REAL**: P=0.99994704210327, matches analytic sin²(25·asin(1/16)) to 3e-15                                                                                                                                                         |
| **Shor** (OMEGA-Q)                                                              | Swept 36 odd semiprimes < 400                                                                                       | **REAL classical emulation** (DFT over a collapsed register + continued fractions). 30/36 factored; fails for N ≥ 143 because Q=256 < N². The UI only offers 15/21/33/35, which all work. Measurement is deterministic, not sampled |
| **H₂ chemistry** (OMEGA-Q)                                                      | Equilibrium bond from the model                                                                                     | **APPROXIMATE / WRONG**: 0.83 Å vs 0.741 Å experimental. 2-config analytic model with an ad-hoc `S*S*0.18` fudge (B6)                                                                                                               |
| **Cray-1**                                                                      | Code read                                                                                                           | Real vector math (1-D wave equation, FMUL+FADD); **timing is a closed-form formula**                                                                                                                                                |
| **AGC**                                                                         | Code read                                                                                                           | **TOY**: a 7-word rope program with 4 opcodes; the 1202 is scripted by filling the job queue to 8 (P8)                                                                                                                              |
| Systolic, MESI, RAID-5, Raft, CM-2 scan, Majorana BdG, MBQC, surface code, etc. | Repo unit tests only (10/10 pass)                                                                                   | **Plausibly real**; not independently re-derived in this pass                                                                                                                                                                       |
| "528 rungs / 1,584 sub-lens views"                                              | Code read (hardwired-gate-engine.js:7)                                                                              | **Templated**: 8 generic switching-family netlists mapped onto 48 machines (C9)                                                                                                                                                     |

---

## 4. Findings

Format: **ID [category · severity]** location. Then _what_, then **Fix**.

### 4.1 Bugs (9)

**B1 [bug · Medium]** `tools/serve.mjs:34`
_What:_ The path check is `safePath.startsWith(ROOT_DIR)` with no separator, so sibling directories that share the prefix can be read. **Proven:** `curl --path-as-is http://127.0.0.1:4199/..%2fcel-review-secret.txt` returned the contents of `/workspace/cel-review-secret.txt`, which sits outside the root. Loopback-only, so it's local exposure.
**Fix:** `const rel = path.relative(ROOT_DIR, safePath); if (rel.startsWith("..") || path.isAbsolute(rel)) 403;` or compare against `ROOT_DIR + path.sep`.

**B2 [bug · Medium]** `desktop/Program.cs:790-792, 851`
_What:_ The same prefix bug (`fullPath.StartsWith(_rootDir, OrdinalIgnoreCase)`), plus `Access-Control-Allow-Origin: *` and no Host-header check. While the .exe runs, any web page can scan loopback ports and read anything the server will serve (including prefix-sibling folders). It is also open to DNS rebinding.
**Fix:**

- Append `Path.DirectorySeparatorChar` to `_rootDir` before the check.
- Drop the ACAO header (same-origin WebView doesn't need it).
- Reject requests whose `Host` isn't `127.0.0.1:{port}`.
- Prefix all URLs with a random per-launch token, or use `CoreWebView2.SetVirtualHostNameToFolderMapping` and drop the TCP server entirely.

**B3 [bug · Medium]** `src/sim/riscv-modern-pc.js:82` (`encI`), `:372`, `:380`
_What:_ The assembler silently truncates out-of-range immediates.

- `addi a0,a0,5000` encodes as +904.
- `slli a0,a0,40` executes as a shift by 8.
- Users can edit assembly in the UI, so this gives wrong results with no error.
  **Fix:** Range-check I/S immediates (−2048..2047), B/J offsets (even, ±4 KiB / ±1 MiB) and shamt (0..31), and throw `Line N: immediate out of range`.

**B4 [bug · Low]** `src/sim/riscv-modern-pc.js:1069-1098` (no final `else` in `step()`), `:837-900`
_What:_

- Illegal or unsupported opcodes (verified: `0xFFFFFFFF`, `0x00000000`) execute as NOPs.
- Loads outside RAM return 0, and stores outside RAM are dropped silently.
- Misaligned word access succeeds, which is allowed by the spec but not reported.
  **Fix:** Halt with an "illegal instruction @pc" message (or a minimal `mcause`/`mepc` trap). Flag access faults in the UI.

**B5 [bug · Low]** `src/sim/riscv-modern-pc.js` (`.word` handling in pass 1, ~line 210; `parseImm` :55)
_What:_ `.word label` with a forward reference throws "undefined label".
**Fix:** Record data words as fixups and resolve them in pass 2.

**B6 [bug · Medium]** `src/sim/enterprise-hpc-quantum-sims.js:1958, 1997`; `tests/simulators.test.mjs:437`
_What:_ The H₂ curve minimum is **0.83 Å** (experimental 0.741 Å; STO-3G FCI about 0.735 Å). `Jgg` carries an unexplained `(1 + S*S*0.18)` fudge factor, and the test accepts 0.65–0.85 Å, which hides the error. The README/UI calls it "Jordan–Wigner H₂".
**Fix:** Use the standard STO-3G one- and two-electron integrals as a function of R (Szabo & Ostlund) in a 2×2 CI / 4-qubit JW Hamiltonian. Tighten the test to 0.735 ± 0.01 Å.

**B7 [bug · Low]** `src/graphics/studio-stage.js:29-34, 133`
_What:_ Ultra is labelled "Native 4K Supersampled", but `pr: 4` is clamped by `Math.min(next.pr, devicePixelRatio)`. On a 1× monitor, Ultra renders at 1× with no supersampling.
**Fix:** Allow `pr > dpr` for Ultra (with a max-drawing-buffer guard), or relabel it.

**B8 [bug · Medium]** `src/app/lab-main.js:2352`
_What:_ The default tier is `matchMedia("(max-width: 820px)") ? "medium" : "high"`. A phone in **landscape** (915 CSS px) gets **High**, which means DPR 2, 4× MSAA and a 4096² shadow map. Measured: landscape boot picked `high`, pixelRatio 2.
**Fix:** Detect class with `(pointer: coarse)`, `navigator.userAgentData?.mobile`, `deviceMemory` and a quick GPU benchmark. Default phones to Low/Medium.

**B9 [bug · Low]** `src/machines/machine-pc20.js:1552`
_What:_ `gpuFrameMs = performance.now() - t0` measures CPU command submission, not GPU time. It only looks right on frames that do a synchronous readback.
**Fix:** Use `EXT_disjoint_timer_query_webgl2` when available, or label it "CPU submit ms".

### 4.2 Errors (1)

**E1 [error · Info]** GitHub Actions run for `bc002dc` (2026-11-11 07:38 PST)
_What:_ CI failed on that commit. It was fixed in `497c717` ("green Ubuntu CI"), and every run since has passed.
**Fix:** None needed. Consider required status checks on `main` (branch is unprotected).

> I found **no current runtime, build or test errors**: 0 console errors, 0 page errors and 0 failed tests across everything run in §2.

### 4.3 Issues (14)

**I1 [issue · High]** `src/sim/core-simulators.js`, `src/layers/layer-stack.js`, `src/machines/machines-{early,pc,frontier}.js`, `src/core/three-aliases.js`
_What:_ About 45% of app code is **de-minified bundle output**. Share of declarations with names of 2 characters or fewer:

| File              | Short names / declarations | Comment lines |
| ----------------- | -------------------------- | ------------- |
| core-simulators   | 339/339                    | 3             |
| layer-stack       | 360/373                    | 2             |
| machines-frontier | 788/856                    | —             |
| machines-early    | 527/587                    | 0             |
| machines-pc       | 415/461                    | —             |

New code is written against minifier aliases (`new Zl(...)`, `new Ni()`, `Sa` in lab-main.js:29-40), so a Three.js upgrade or a code review is very hard.
**Fix:** Restore readable sources. The **original commented sources for the same engines exist in v6** (`/workspace/computer-evolution-lab/js/sim/*.js`, `js/machines/*.js`). Replace the aliases with `THREE.*` named imports and move to ES modules with an import map (still works offline if bundled into one file for `file://`).

**I2 [issue · Medium]** All 24 non-IIFE classic scripts
_What:_ 822 top-level globals on `window`. My acorn AST scan found **0 collisions** today, but one future short name could silently override another.
**Fix:** ES modules, or one namespace object per file.

**I3 [issue · Medium]** `tools/run-tests.mjs:376`
_What:_ The audio test reports `sfxPlayed: LAB.audio.stats.sfx ?? LAB.audio.stats.sfxPlayed ?? 3`. The `3` is a hard-coded fallback, so "sfxPlayed=3" in the CI log isn't measured. The score check only asserts `chord && bpm > 0`.
**Fix:** Count real `AudioBufferSourceNode.start` / `hi()` invocations and assert that the count goes up. Check `notesScheduled > 0` and that the AudioContext reaches `running`.

**I4 [issue · Medium]** `tools/run-tests.mjs:200-250`
_What:_ "Machine [x] … verified" only means `m.test()` returned ok, `_err` is unset, and each layer canvas has at least 1 lit pixel and matches at least 1 part. There are no golden values and no screenshot diff.
**Fix:** Per-machine golden assertions (e.g. the EDSAC squares table, S/360 NETOUT, a CM-2 scan) and perceptual screenshot diffs at Low tier.

**I5 [issue · Low]** `.github/workflows/ci.yml`
_What:_

- No `format:check` step.
- Single Node version.
- Actions pinned by tag, not SHA.
- No `dependabot.yml`.
- No required checks / branch protection.
- Headless run is "optional".
  **Fix:** Add a prettier step and a Node 20/22 matrix, pin actions by SHA, add dependabot for actions, protect `main`.

**I6 [issue · Low]** `src/machines/machines-frontier.js:3768`
_What:_ The visual6502 netlist is fetched from the unpinned `.../visual6502/master/`. It is parsed with `JSON.parse` (no eval, good), but upstream changes could break or alter it.
**Fix:** Pin to a commit SHA and verify a SHA-256 of each file.

**I7 [issue · Low]** `desktop/Program.cs:498`
_What:_ `AreDevToolsEnabled = true` is set in the release build.
**Fix:** Enable it only under `#if DEBUG` or a `--devtools` flag.

**I8 [issue · Low]** `src/machines/machines-early.js:1940-1965`
_What:_ The analog patch-panel compiler passes user text to `new Function`. Identifiers are whitelisted, but `[]()!+` pass through, so JSFuck-style payloads can run arbitrary JS. Today that's self-XSS only, since patches can't be loaded from a URL.
**Fix:** Tokenize and allow only numbers, operators, parentheses and whitelisted names. Reject `[ ] ! " ' \``.

**I9 [issue · Low]** `src/core/dom-ui.js:260`, `src/layers/layer-stack.js:4453`, `src/app/lab-main.js:1645`
_What:_ `innerHTML` sinks exist (fed with static data today), and there is no CSP.
**Fix:** Add `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src 'self' https://raw.githubusercontent.com; img-src 'self' data: blob:; media-src 'self' data: blob:">` and prefer `textContent`.

**I10 [issue · Low]** GitHub repo settings
_What:_ Checklist gaps:

- Topics are empty.
- License detected as NOASSERTION.
- No CITATION.cff (useful for an educational/research repo).
- No CODEOWNERS, PR template, `.editorconfig` or dependabot.
- README has no screenshot/GIF.
- Releases have no checksums/SBOM, and the exe is unsigned.
- Wiki is enabled but empty.
- `main` is unprotected.
  **Fix:** See the checklist in §5.

**I11 [issue · Low]** `CHANGELOG.md`
_What:_ No `[2.1.1]` entry, though the v2.1.1 release exists. No `[Unreleased]` section and no compare links.
**Fix:** Add the missing entry and Keep-a-Changelog compare links.

**I12 [issue · Low]** `src/audio/cinematic-score.js`, `src/app/lab-main.js`
_What:_ There is no `visibilitychange` handler, so the AudioContext stays running in a background tab, which drains phone battery.
**Fix:** Call `ac.suspend()` when hidden and `resume()` when visible, and pause the render loop.

**I13 [issue · Low]** `src/sim/enterprise-hpc-quantum-sims.js:1792`
_What:_ Shor uses `Q = 256`, which fails for N ≥ 143 (verified 30/36 semiprimes < 400). The UI hides this by offering only 15–35.
**Fix:** Pick `Q = 2^⌈2·log2 N⌉`, or document the limit. Optionally sample the measurement from `qftProbs` instead of always taking the f(x)=1 coset.

**I14 [issue · Low]** `src/machines/machines-frontier.js` (247 KB), `src/layers/layer-stack.js` (176 KB), `machines-early.js` (187 KB)
_What:_ These monoliths mix 6–8 machines each.
**Fix:** One machine per module (the v6 layout did this).

### 4.4 Problems (8)

**P1 [problem · High]** `src/app/lab-main.js:155-170` (all factories built at boot); hub scene
_What:_ Measured:

- Hub: **14,616 draw calls and 16.1 M triangles**.
- 4,598 geometries and 199 textures stay resident, because every machine is built eagerly and never disposed.
- Boot takes 70–134 s under SwiftShader.

That is well above typical mobile WebGL budgets (about 1–2k draw calls), and it is the main blocker for the Xiaomi 17T Pro goal.
**Fix:**

- Hub: render each machine once to an impostor/billboard texture, or use merged/instanced LOD proxies.
- Build a machine's full kit lazily on select and dispose it on leave.
- Show the hub before the other machines finish building (progressive boot).
- Use frustum and distance culling.

**P2 [problem · High]** Whole repo vs v6
_What:_ **Visual and audio regression from v6.**

- No CC0 PBR texture maps and no HDRI IBL (RoomEnvironment instead).
- No GTAO, SMAA or DoF. Many models are untextured primitive boxes and cylinders; see `desk-32-cray1.png` and `high-00-cray1.png`, where the Cray-1 also shows a CRT terminal inside the C, which the real machine didn't have.
- The score is oscillator synthesis again, which is exactly what Alex rejected in t9u ("Music sounds like shit"). v6 replaced it with 18 sampled VSCO 2 CE cues.
  **Fix:** Port the v6 asset pipeline (`assets/tex`, `assets/hdri`, `assets/music` stems + engine, CC0 SFX, `tools/score/`) and the v6 graphics M1/M2 work into the repo. Decide where the heavy assets live (D2).

**P3 [problem · Medium]** `styles/lab.css` (toolbar/chip rules), `@media (max-width: 880px)` at :1025
_What:_ On a 412×915 phone, **79–92 of 79–92 interactive elements are under 32 px** (29 px tall) against the 44–48 px touch guideline. There are 36–177 text elements under 12 px.
**Fix:** Add a `(pointer: coarse)` block with min-height 44 px, 14–16 px base text, and a larger hit area on chips.

**P4 [problem · Medium]** Layout in phone landscape (`mobile-landscape-*.png`)
_What:_ The toolbar covers about a third of the 3D view. The canvas is only 522×356 CSS px of 915×412. The hint says "scroll to zoom · click any part" on touch devices.
**Fix:** Collapse the toolbar into a FAB/bottom sheet on coarse pointers, make the side panel a drawer, and show touch-specific hints (pinch/two-finger pan).

**P5 [problem · Medium]** `src/machines/machine-pc20.js:213, 1547`
_What:_ pc20 always raymarches a fixed 1024² render target, whatever the tier, plus a **synchronous `readRenderTargetPixels` every 2nd frame**. That forces a GPU→CPU stall, which causes jank and heat on mobile.
**Fix:** Scale the RT to the tier (256/512/1024) and use async readback (PBO + `fenceSync` / `clientWaitSync`) every N frames.

**P6 [problem · Low]** `src/app/lab-main.js:31`
_What:_ `preserveDrawingBuffer: true` adds bandwidth every frame on tiled mobile GPUs.
**Fix:** Turn it off and capture screenshots inside the render callback, or toggle it only for 4K capture.

**P7 [problem · Medium]** `index.html`, `styles/lab.css`, `src/**`
_What:_ Accessibility:

- Only 7 `aria-*` attributes in the whole app.
- No `prefers-reduced-motion` (auto-spin, tours, pulses all keep running).
- No visible focus style for buttons or chips (only inputs/selects at lab.css:508, 556).
- The canvas has no role/label, and live sim values aren't announced.
  **Fix:** Add focus-visible styles, reduced-motion handling, `role="application"` with an `aria-label` on `#gl`, an `aria-live` region for sim readouts, and keyboard reachability for every part (there is already an inspector list to hook into).

**P8 [problem · Medium]** `src/sim/enterprise-hpc-quantum-sims.js:2044-2150` (AGC), `:871-905` (Cray-1 timing)
_What:_ Several "operational" machines are toy models or closed-form formulas dressed as emulators. The AGC is a 7-word rope with 4 opcodes and a scripted 1202. This conflicts with Alex's "NOT BULLSHIT … REAL FUNCTIONAL" goal.
**Fix:** Either implement the real thing (e.g. a Block II AGC instruction set running a small real routine such as the DSKY V35 lamp test or an executive scheduler with real core sets) or label them "conceptual model" in the UI.

### 4.5 Dilemmas (7) — need Alex's decision

**D1 [dilemma]** Merge strategy. The repo has breadth (48 machines, CI, exe) but de-minified code and procedural assets. v6 has depth (readable code, CC0 PBR/HDRI, sampled score) but only 17 machines.
**Options:**

- (a) Port v6 sources and assets into the repo. Recommended.
- (b) Keep the repo lean and procedural, and improve the synthesis.
- (c) Keep both as separate products.

**D2 [dilemma]** Asset weight vs zero-install. v6 assets are about 135 MB (116 MB music); the repo is 4.8 MB and served from GitHub Pages.
**Options:** Git LFS, attaching assets to Releases, lazy fetch with a procedural fallback, or 512 px / 18 kbps "lite" assets in-repo with full assets downloaded on demand.

**D3 [dilemma]** `src/audio/cinematic-score.js:2-3, 9-250, 257+` names composers ("Hans Zimmer · Cathedral Organ…") and films in the UI. Original procedural music isn't infringing, but naming living composers can read as endorsement.
**Options:** Keep, or soften to v6's "Original score inspired by the mood of <film>".

**D4 [dilemma]** Mobile target (Xiaomi 17T Pro) vs 4K desktop fidelity.
**Options:** One adaptive build with a real mobile tier, or a separate mobile entry (`mobile.html`) with lazy scenes and simplified hub impostors.

**D5 [dilemma]** `LICENSE` is the custom "Cosmogonic" non-commercial license. GitHub shows NOASSERTION, and the license itself says it intends to match PolyForm Noncommercial 1.0.0.
**Options:** Adopt PolyForm NC verbatim (SPDX `PolyForm-Noncommercial-1.0.0`, auto-detected), or keep the custom text. Also confirm that the "Patent pending" statement is accurate before keeping it.

**D6 [dilemma]** The Windows exe is unsigned, so SmartScreen will warn users.
**Options:** Buy a code-signing certificate (or use Azure Trusted Signing), or document the warning and ship SHA-256 checksums.

**D7 [dilemma]** visual6502 data is CC BY-NC-SA, fetched at runtime. That's fine under a non-commercial license, but it blocks any future commercial use and contradicts "zero network calls".
**Options:** Keep it opt-in with clear disclosure, or drop the transistor mode.

### 4.6 Conflicts (10)

**C1 [conflict · Medium]** GitHub "About" description
_What:_ It says "17 operational … computers + 18-scene" while README, package.json and the boot screen say **48 / 49**.
**Fix:** Update the About text (needs Alex; not done in this pass).

**C2 [conflict · Medium]** `VERSION`
_What:_ It says `2.0.0`, while `package.json` says 5.0.0 and the tag is v5.0.0. No tool reads VERSION.
**Fix:** Set it to 5.0.0 and have the build read it, or delete the file.

**C3 [conflict · Medium]** `.github/SECURITY.md:7-8`
_What:_ Supported versions are `2.0.x` only, so by its own policy 5.0.0 is unsupported.
**Fix:** Change to `5.x: Yes; < 5: No`.

**C4 [conflict · Low]** `.github/SECURITY.md:12` vs `machines-frontier.js:3768/3790`
_What:_ SECURITY.md claims "zero external network calls", but the code fetches the netlist from raw.githubusercontent.com on request.
**Fix:** Say "no network calls except the opt-in visual6502 netlist fetch".

**C5 [conflict · Medium]** `.github/SECURITY.md:13` vs B1
_What:_ SECURITY.md claims serve.mjs "enforces path.resolve root prefix checks against directory traversal", but the check can be bypassed.
**Fix:** Fix B1, then keep the claim.

**C6 [conflict · Medium]** `THIRD-PARTY-NOTICES.md:37-40` vs `assets/audio/sfx-clips.js`
_What:_ The notices credit bell, keys, floppy and **hdd**. The bundle actually contains bell, floppy, keys and **modem** (decoded: 1.1 s, 4.7 s, 3.3 s, 9.6 s MP3). hdd is absent and modem is uncredited. Titles and authors don't match the source files. v6 CREDITS gives the real ones: _stubb "Typewriter ding", AlepouTheFox "Floppy drive sounds", Raymangold22 "Typing – Model F/M", PDSounds "Dial up connection (short)", all CC0 on Wikimedia Commons.
**Fix:** Replace with the exact v6 rows (title, author, license, URL).

**C7 [conflict · Low]** `THIRD-PARTY-NOTICES.md` §3 vs `machines-frontier.js:3770`
_What:_ The notices say the netlist is "inspired by" visual6502 docs, but the code downloads and executes on the CC BY-NC-SA 3.0 netlist and uses MIT-licensed node names. The in-app string has this right; the notices file doesn't.
**Fix:** Copy the in-app attribution (CC BY-NC-SA 3.0, runtime-fetched, not redistributed; node names MIT) into the notices.

**C8 [conflict · Medium]** README, `machine-pc20.js:281` blurb vs `riscv-modern-pc.js:902-1125`
_What:_ The claim is a "5-stage pipelined CPU with data forwarding … set-associative caches". The implementation is a functional ISS: one instruction retires per `step()`, pipe registers are a display shift-register, and forwarding detection is approximate. Cache hits and misses never change cycles (only branches, jumps and load-use add cycles). IPC/L1 figures are therefore illustrative.
**Fix:** Either model it (a cycle-stepped 5-stage pipe with hazard unit, plus a miss penalty such as L1 4 / L2 12 / DRAM 80 cycles) or reword it as "ISS with pipeline/cache telemetry".

**C9 [conflict · Medium]** README/package "528 primary rungs / 1,584 interactive sub-lens views … universal transistor/gate solver" vs `src/layers/hardwired-gate-engine.js:7-140`
_What:_ The gate bench and eye scope come from **8 generic switching-family templates** (relay, tube, bipolar, NMOS, CMOS, FinFET, bio-photonic, reversible) mapped onto 48 machines. For example, pc20's "netlist" is a generic CMOS mirror adder, not that machine's logic. The Z1 is filed under "relay … +24 V", but it was purely mechanical. The counts are true combinatorially but overstate per-machine fidelity.
**Fix:** Reword, or add per-machine netlist fragments (6502 from visual6502; 8080 ALU; PDP-8 adder from the DEC module schematics).

**C10 [conflict · Low]** `THIRD-PARTY-NOTICES.md` §3 last bullet
_What:_ It says "All 18 musical cues", but `cinematic-score.js` defines 49 scene cues.
**Fix:** Update the count.

---

## 5. Professional GitHub checklist (28 items)

| #   | Item                                        | Status                                                        |
| --- | ------------------------------------------- | ------------------------------------------------------------- |
| 1   | README with purpose, install, usage         | ✅ (very long, marketing-heavy)                               |
| 2   | README screenshots/GIF                      | ❌                                                            |
| 3   | CI badge                                    | ✅ (passing)                                                  |
| 4   | Other badges (license, release, Pages)      | ✅ (coverage badge is a self-written JSON, not real coverage) |
| 5   | LICENSE file                                | ✅ custom (GitHub: NOASSERTION), see D5                       |
| 6   | THIRD-PARTY notices / credits               | ⚠️ present but inaccurate (C6, C7, C10)                       |
| 7   | CHANGELOG                                   | ⚠️ missing 2.1.1 and compare links (I11)                      |
| 8   | Semantic version consistency                | ❌ VERSION 2.0.0 vs 5.0.0 (C2)                                |
| 9   | Tags                                        | ✅ v2.1.1–v5.0.0                                              |
| 10  | Releases with notes                         | ✅ 4 releases                                                 |
| 11  | Release checksums/SBOM/signing              | ❌ (D6)                                                       |
| 12  | CI on push/PR                               | ✅                                                            |
| 13  | CI passing on main                          | ✅                                                            |
| 14  | CI lint/format step                         | ❌ (I5)                                                       |
| 15  | Tests in repo                               | ✅ unit + headless                                            |
| 16  | Meaningful assertions                       | ⚠️ (I3, I4)                                                   |
| 17  | SECURITY.md                                 | ⚠️ stale (C3, C4, C5)                                         |
| 18  | CODE_OF_CONDUCT                             | ✅                                                            |
| 19  | CONTRIBUTING                                | ✅                                                            |
| 20  | Issue templates                             | ✅ bug + feature                                              |
| 21  | PR template                                 | ❌                                                            |
| 22  | CODEOWNERS                                  | ❌                                                            |
| 23  | Dependabot / pinned actions                 | ❌                                                            |
| 24  | Branch protection                           | ❌                                                            |
| 25  | Topics                                      | ❌ empty                                                      |
| 26  | Accurate About description                  | ❌ (C1)                                                       |
| 27  | Homepage / Pages live                       | ✅ HTTP 200                                                   |
| 28  | .editorconfig / .gitattributes / .gitignore | ⚠️ gitattributes + gitignore ✅, editorconfig ❌              |

**Score: 14 ✅, 5 ⚠️, 9 ❌.** Of the ❌ items, #2, #21, #22, #23, #25 and #28 are each about 10 minutes of work. #26 needs Alex.

---

## 6. Recommended order of work

1. Fix B1/B2 (traversal), C2/C3/C6/C7/C10 (docs and attribution), and C1 (About; Alex).
2. Decide D1/D2/D4. Then restore readable sources (I1) and port v6 graphics and sampled score (P2).
3. Mobile pass for the Xiaomi 17T Pro: P1 hub impostors + lazy build, B8 tier detection, P3/P4 touch layout, P5/P6 GPU stalls, I12 visibility handling.
4. Fidelity honesty pass: C8 (pipeline), C9 (netlists), P8 (AGC), B6 (H₂), B3–B5 (assembler).
5. Harden tests: I3/I4 golden values, add the Klaus Dormann 6502 test and the RV32 differential test from `/workspace/cel-review-tools/` to CI (the test binary is GPL-3; fetch it at CI time, don't vendor it).

## 7. Reproduce

```bash
cd /workspace/cel-review && node tools/serve.mjs 4199 &
node /workspace/cel-review-tools/rv32-verify.mjs          # RV32IM differential + program checks
node /workspace/cel-review-tools/k6502.mjs                # Klaus Dormann on Sr (needs /tmp/6502_functional_test.bin)
node /workspace/cel-review-tools/k6502xc.mjs              # Klaus Dormann on Xc bus-cycle model
node /workspace/cel-review-tools/pdp8.mjs ; node /workspace/cel-review-tools/q.mjs
node /workspace/cel-review-tools/scenes.mjs "http://127.0.0.1:4199/index.html?q=low&auto=0" /workspace/cel-review-shots desk
node /workspace/cel-review-tools/mobile.mjs
node /workspace/cel-review-tools/dupes2.mjs               # global-collision AST scan
```
