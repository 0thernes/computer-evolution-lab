## What and why

<!-- One or two sentences: the change and the reason. Link the issue if there is one. -->

## Checks run locally

- [ ] `node --test tests/*.test.mjs`
- [ ] `node tools/dormann-6502.mjs` and `node tools/i8080-cpm.mjs` (if a CPU core changed)
- [ ] `node tools/audit-exhaustive.mjs`
- [ ] `node tools/run-tests.mjs` (headless; set `CEL_TIMEOUT_SCALE=2` on a slow machine)
- [ ] `npx prettier@3.10.1 --check "**/*.{html,css,js,mjs,json,md,yml}"`

## Sources

<!-- For any historical figure, date or specification you added or changed, cite the primary
or reference source (manual, datasheet, paper, TOP500 list, museum record). -->

- [ ] No composer or film names in score text (ADR 0002, `docs/adr/0002-score-attribution.md`)
- [ ] New third-party assets are CC0, public domain or permissively licensed, and listed in `CREDITS.md`
