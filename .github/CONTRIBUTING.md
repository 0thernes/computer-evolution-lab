# Contributing to Computer Evolution Lab

Thank you for exploring **Computer Evolution Lab**! Every exhibit in this repository is bound by a strict engineering rule: **zero fake or purely cosmetic hardware** — every 3D machine must genuinely execute its era's computation in real time.

## Development Workflow

1. **Zero-Build Setup**:

   ```bash
   node tools/serve.mjs
   ```

   Open `http://127.0.0.1:4173/index.html` (and always verify direct `file://` double-click via `computer-evolution-lab.html` as well).

2. **Keep `index.html` and `computer-evolution-lab.html` Byte-Identical**:
   Both HTML entrypoints load the exact same modular `<script defer src="...">` list so double-clicking `computer-evolution-lab.html` offline behaves identically to HTTP hosting.

3. **Required Checks Before Any Commit**:

   ```bash
   node --test tests/simulators.test.mjs
   node tools/audit-exhaustive.mjs
   node tools/run-tests.mjs
   npx prettier --check "**/*.{html,css,js,mjs,json,md,yml}"
   ```

4. **Licensing**:
   Contributions are governed by the non-commercial research & play terms in `LICENSE` (`0thernes LLC`).
