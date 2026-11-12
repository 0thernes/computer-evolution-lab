# ADR 0004: No code signing for the Windows executable

- Status: accepted (v6.0.0)
- Date: 2026-11-13

## Context

`Computer-Evolution-Lab-win-x64.exe` is unsigned, so Windows SmartScreen shows "Windows protected your PC" on first run. Signing needs an OV/EV certificate or Azure Trusted Signing, which means a paid account, identity validation and a secret in CI.

## Decision

- Ship the `.exe` unsigned.
- Publish a SHA-256 checksum next to every release binary and zip, and say in the README how to check it (`Get-FileHash .\Computer-Evolution-Lab-win-x64.exe -Algorithm SHA256`).
- The browser version (GitHub Pages or `npm start`) remains the recommended way to run the lab.

## Consequences

Users see the SmartScreen warning and have to choose "More info → Run anyway". Revisit if the project gets a signing identity.
