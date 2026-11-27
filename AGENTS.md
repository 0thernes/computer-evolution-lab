# AGENTS.md

Canonical instructions for every coding agent working in `computer-evolution-lab` (`v6.0.0`).
`CLAUDE.md`, `GEMINI.md`, `.cursor/rules/build-standard.mdc`, and `llms.txt` point here. Edit this file, never the pointers.

## Project

- Name: `computer-evolution-lab`
- Purpose: Zero-build 4K HDR 3D interactive museum of 49 historical and frontier computers across 4 Grand Circles with working CPU emulators (6502, 8080, PDP-8, B1726, RV32IM) and an 11-rung hardware/software abstraction stack (`v6.0.0`).
- Owner: Alexander Stephen Donahue (Independent Researcher, 0thernes, Spokane, WA, USA; ORCID `0009-0006-8168-9648`)
- Manifest: `repo.yaml` (Build Standard for LLMs v1.2.0)
- Stack: Classic ES2024 browser JS (36 ordered scripts), Three.js r170 (MIT vendored bundle), WebGL2, WebAudio, Node.js `>= 26` tooling/tests, optional .NET WebView2 Windows desktop wrapper
- Layout:
  - `index.html` and byte-identical `computer-evolution-lab.html`: Entry pages
  - `src/`: Simulators (`src/sim/`), 3D machines (`src/machines/`), layer visualizers (`src/layers/`), audio (`src/audio/`), graphics (`src/graphics/`), core/app (`src/core/`, `src/app/`, `src/assets/`)
  - `tests/`: Automated Node test suite (`tests/*.test.mjs`)
  - `tools/`: Audits, CPU conformance runners (`dormann-6502.mjs`, `i8080-cpm.mjs`), `gen-audit-index.mjs`, local server, desktop packager
  - `docs/`: Architecture, ADRs (`0001`–`0006`), `AUDIT-INDEX.md`, `AUDIT-LOG.md`, `SUMMARY.md`, `GLOSSARY.md`
- Status: active (`v6.0.0`)

## Commands

- Local preview: `npm start` (`node tools/serve.mjs`)
- Format check: `npx --yes prettier@3.10.1 --check "**/*.{html,css,js,mjs,json,md,yml}"`
- ESLint correctness check: `npx --yes eslint@9.39.5 .`
- Static & symbol audit: `node tools/audit-exhaustive.mjs`
- Unit & docs-consistency tests: `node --test tests/*.test.mjs`
- 6502 Dormann conformance: `node tools/dormann-6502.mjs`
- 8080 CP/M diagnostics: `node tools/i8080-cpm.mjs`
- Modular HTML/JS & headless WebGL2 suite: `node tools/run-tests.mjs --ci-headless-optional`
- Regenerate tracked file index after adding/removing files: `node tools/gen-audit-index.mjs`

## Hard Rules (Build Standard v1.2.0)

- R1. Nothing may gate, block, or slow a commit or push. No branch protection, no required status checks, no commit/tag signing, no git hooks.
- R2. Commit and push straight to `main`. No pull requests and no feature branches.
- R3. CI is informational. CI reports results on every push. A red CI run is a finding to fix, never a barrier.
- R4. Banned tools and files: no Dependabot/Renovate auto-PRs, no PR templates, no CodeRabbit, no `.github/copilot-instructions.md`, no `FUNDING.yml` unless requested.
- R5. One-person lean, not corporate. Prefer plain text and single commands over ceremony.
- R6. Never fabricate. Every claim, number, and test result must come from a real run of the current code.
- R7. Classify every finding as exactly one of: `bug`, `error`, `issue`, `problem`, `concern`, `dilemma`, `conflict`, `gap`, `hole`, `blindspot`.
- R8. Precedence: owner's explicit instruction, then these hard rules, then Build Standard items, then ecosystem conventions.

## Scientific Honesty, Attribution & Privacy Rules

- **Real-vs-Metaphor:** Distinguish cycle-accurate / conformance-tested emulators (MOS 6502, Intel 8080, PDP-8, Burroughs B 1726, RV32IM) from pedagogical/conceptual models and family gate templates (see `LIMITATIONS.md` and `docs/AUDIT-LOG.md`).
- **ADR 0002 Score Attribution:** Never reference film or composer names in source or docs (enforced mechanically by `tests/docs-consistency.test.mjs`).
- **Privacy Firewall & Legal Hygiene:** Never commit private repository names, local user paths, secrets, or unformed LLC entity claims. Credit `Alexander Stephen Donahue (Independent Researcher, 0thernes, Spokane, WA, USA)`. Do not alter `LICENSE` without explicit owner instruction.

## Known Traps

- Adding or deleting tracked files requires staging them (`git add`) and regenerating `docs/AUDIT-INDEX.md` (`node tools/gen-audit-index.mjs`), otherwise `tests/audit-index.test.mjs` fails.
- CI runs `prettier@3.10.1 --check` over all `.html`, `.css`, `.js`, `.mjs`, `.json`, `.md`, and `.yml` files; always format modified Markdown/JSON/JS before pushing.
- `tests/version.test.mjs` expects unquoted `version: X.Y.Z` in `CITATION.cff` matching `VERSION`, `package.json`, `desktop/*.csproj`, and `CHANGELOG.md`.
- `index.html` and `computer-evolution-lab.html` must remain byte-identical.
