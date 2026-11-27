# Limitations, Threats to Validity, and Real-vs-Metaphor Boundary

## 1. Conformance-Tested Emulators vs. Pedagogical Models

`Computer Evolution Lab` mixes genuine instruction-level CPU emulators with pedagogical and conceptual simulations across its 49 exhibits:

- **Conformance-Tested / Spec-Checked Cores:** MOS 6502 (Klaus Dormann functional test), Intel 8080 (`TST8080`, `8080PRE`, `CPUTEST`), 5-stage RV32IM pipeline (checked against ISS in `tests/rv32-pipeline.test.mjs`), PDP-8 (`tests/pdp8.test.mjs`), and Burroughs B 1726 (`tests/b1700.test.mjs`).
- **Pedagogical / Conceptual Models:** Gate-bench views use family-level switching templates rather than full per-chip transistor netlists (except close-zoom visual6502 polygon overlays where documented); exhibits such as the Z1, Apollo Guidance Computer, Cray-1 timing model, wafer-scale/HPC architectures, and all 9 quantum modalities are educational classical JavaScript models running on standard CPUs/GPUs with zero physical quantum speedup and zero claim of biological life or sentience on the `alife`/`bci`/`aibox` exhibits.

## 2. Platform & Asset Constraints

- **Node Engine Version:** CI targets Node.js 26 (`package.json` `engines.node >= 26.0.0`); local environments running older Node 20/22 may differ on newer `node:test` or runtime behavior.
- **External Conformance Binaries:** GPL-3/classic 6502 and 8080 test ROM binaries are fetched dynamically with SHA-256 verification rather than vendored in-repo (`tools/dormann-6502.mjs`, `tools/i8080-cpm.mjs`); offline machines without a cached binary cannot run those two suites.
- **Desktop Wrapper Unsigned:** The optional Windows `.exe` wrapper is unsigned (documented in `docs/adr/0004-no-code-signing.md`).

## 3. Owner-Controlled Legal Record

- **Root `LICENSE` File:** The root `LICENSE` file (Cosmogonic License — Non-Commercial Research & Play) retains its original unformed-entity copyright holder line pending explicit owner decision. All live non-LICENSE metadata (`CITATION.cff`, `package.json`, `README.md`, `.github/*`, `docs/SUMMARY.md`) credits `Alexander Stephen Donahue (Independent Researcher, 0thernes, Spokane, WA, USA)` because no LLC entity has been formed.
- **AI-Assistance Disclosure:** Built by Alexander Stephen Donahue with substantial AI coding, documentation, and verification assistance under human direction; not a peer-reviewed publication.
