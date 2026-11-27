# Replication Protocol (`REPLICATION.md`)

Clean-clone instructions to independently verify `Computer Evolution Lab` (`v6.0.0`).

## 1. Prerequisites

- Node.js `>= 22` (CI runs Node.js `26` per `.github/workflows/ci.yml`; zero runtime npm dependencies).
- Internet access only if running the dynamic SHA-256-verified Dormann 6502 and 8080 CP/M binary fetchers or `npx` Prettier/ESLint.
- Optional Chrome/Edge binary for full headless WebGL2 CDP rendering checks (`tools/run-tests.mjs`).

## 2. Clean-Clone Verification Steps

```bash
git clone https://github.com/0thernes/computer-evolution-lab.git
cd computer-evolution-lab
npx --yes prettier@3.10.1 --check "**/*.{html,css,js,mjs,json,md,yml}"
npx --yes eslint@9.39.5 .
node tools/audit-exhaustive.mjs
node --test tests/*.test.mjs
node tools/dormann-6502.mjs
node tools/i8080-cpm.mjs
node tools/run-tests.mjs --ci-headless-optional
```

To explore interactively in a browser:

```bash
npm start
```

Open the printed loopback URL (or open `index.html` directly via `file://`).

## 3. Replication Log

| Date       | Replicator                                    | Environment         | Scope Verified                                                                                                                                                                                                                                 | Result |
| ---------- | --------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2026-11-27 | Alexander Stephen Donahue (AI-assisted audit) | Windows 11, Node.js | `audit-exhaustive.mjs`, `tests/*.test.mjs` (11 test files including `audit-index`, `docs-consistency`, `version`, `simulators`, `rv32-pipeline`, `pdp8`, `b1700`, `golden`, `security`), Prettier format check, ESLint, privacy scan (0 leaks) | PASS   |
