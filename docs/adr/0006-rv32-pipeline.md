# ADR 0006: RV32IM pipeline model

- Status: accepted (v6.0.0)
- Date: 2026-11-13

## Context

v5 described the Modern Mini PC's CPU as a "5-stage pipeline", but `step()` executed one whole instruction per call and drew the pipeline stages as a picture. Cache misses cost no time.

## Decision

- `RV32_PIPELINE.step()` advances one clock. Each cycle evaluates WB → MEM → EX → ID → IF with real pipeline registers.
- **Hazards:**
  - Forwarding from EX/MEM (non-load) and MEM/WB, and a write-first register file.
  - A one-cycle load-use stall.
  - Branches resolve in EX, with a 2-cycle flush on a mispredict.
  - IF predecodes JAL and uses a 2-bit branch history table. JALR is predicted fall-through.
- **Memory:** an I-cache miss stalls IF and a D-cache miss freezes the pipe, using `RV32_TIMING` (L2 hit +8 cycles, DRAM +40 cycles). Those numbers are a modelled toy core, not a specific chip.
- **Reference model:** `stepISS()` is a plain instruction-set simulator. `tests/rv32-pipeline.test.mjs` runs 200 random programs and every preset on both models and requires identical architectural state. It also checks that turning off forwarding gives wrong results, that hazards cost cycles, and that illegal instructions and memory faults trap.
- **Assembler:** immediates and shift amounts are range-checked with `Line N:` errors, and `.word` accepts forward label references.

## Consequences

Cycle counts in the UI are now produced by the model rather than estimated. Measured CPI of the bundled presets: Sieve 1.21 (2,176 instructions, 2,635 cycles), Quicksort 1.40 (724 / 1,012), GPU driver loop 1.00 over 3 M cycles (cache-resident, well predicted). The test harness therefore steps in cycles, not instructions.
