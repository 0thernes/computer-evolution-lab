# ADR 0007: Burroughs B1700 emulation scope

- Status: accepted
- Date: 2026-11-18

## Context

The B1700 had no fixed instruction set: each language ran on its own S-machine, interpreted by microcode. A faithful lab entry therefore needs the micro-machine, not a programmer-visible ISA. The SRM documents the B 1726 micro-instructions in detail. It does not document the Burroughs S-languages at a level we could reproduce, and no B1700 microcode image is available to us under a licence we could bundle.

## Decision

- Emulate the **B 1726 micro-machine** from the B 1700 Systems Reference Manual (1057155) and the MIL manual (2212-5298): bit-addressable memory, the register select matrix, both function boxes, scratchpad, A stack, every documented micro-instruction, and micro-instruction fetch from control memory or main memory.
- Write the demonstration **interpreter in MIL**, assembled by a MIL-subset assembler in `src/sim/b1700-sim.js`, and run it on the emulator. It interprets **SAM**, a small S-language defined by this lab. SAM is labelled as lab-defined everywhere it appears.
- Where the SRM is ambiguous, choose one reading, mark it `[LAB]` in the source and list it in `docs/B1700.md`.
- Cassette, MCP, I/O devices and cycle-exact timing are out of scope. Timing is a cost counter using the Auerbach figures.
- The scene's lab-instrument screen is labelled as not part of the B1700.

## Consequences

Every micro-instruction the interpreter executes comes from the manual, and the MIL manual's own `EXTRACT` example is a unit test. The S-language is not historical, so the app can't claim to run Burroughs COBOL or SDL; the dossier links their specifications instead.
