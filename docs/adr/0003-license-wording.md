# ADR 0003: License wording

- Status: accepted (v6.0.0)
- Date: 2026-11-13

## Context

`LICENSE` is the custom "Cosmogonic" non-commercial license. GitHub detects it as `NOASSERTION`. It said "Patent pending" and that inventions in the work "may be the subject of pending patent applications". Nothing in the repository (no application number, filing date or notice) supports that statement.

## Decision

- Keep the Cosmogonic license and its terms unchanged: non-commercial use, attribution, all commercial rights reserved.
- Remove "Patent pending" and the pending-application sentence. Section 3 now says only that no patent rights are granted beyond those needed for the permitted non-commercial uses.
- Don't switch to PolyForm Noncommercial 1.0.0 for now. GitHub will keep showing `NOASSERTION`.

## Consequences

If a patent application is filed later, the owner can add the notice back with its application number.
