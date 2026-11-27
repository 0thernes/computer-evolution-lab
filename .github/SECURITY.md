# Security Policy

## Supported Versions

| Version   | Supported |
| :-------- | :-------- |
| `6.x`     | Yes       |
| `< 6.0.0` | No        |

## Architecture & Threat Surface

- **Client-side only.** The lab runs inside the browser's JavaScript, WebGL2 and WebAudio sandboxes. There is no telemetry and no server-side state.
- **Network calls.** None by default. Two exceptions, both same-origin or opt-in:
  - When served over http(s), the page loads its own assets (`assets/tier.json`, textures, HDRI, music stems, SFX) from the same origin.
  - The optional transistor-level 6502 mode downloads the visual6502 netlist from `raw.githubusercontent.com`, pinned to commit `d8ecc129` and verified by SHA-256 before use. It only runs when you press the button.
- **Content-Security-Policy.** `index.html` ships a CSP meta tag: scripts from `'self'` only (no inline scripts), `connect-src` limited to `'self'` and `raw.githubusercontent.com`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`. `'unsafe-eval'` remains because the analog patch-panel compiler builds a `Function` from a whitelisted expression grammar (see `tests/analog-patch.test.mjs`).
- **Local dev server (`tools/serve.mjs`).** Binds to `127.0.0.1` and answers only `GET`/`HEAD`. Requests whose `Host` is not `127.0.0.1:<port>`, `localhost:<port>` or `[::1]:<port>` get `421` (DNS-rebinding protection). Paths are resolved, symlinks included, and must lie inside the repo root, including the prefix-sibling case (`<root>-other/`); dot-segments such as `.git/` are never served, and malformed escapes get `400`. Covered by `tests/security.test.mjs`.
- **Windows desktop app.** The embedded server listens on the loopback interface only, accepts only `GET`/`HEAD`, and rejects requests whose `Host` is not `127.0.0.1:<port>`/`localhost:<port>` or whose `Origin` is foreign (DNS-rebinding and cross-site protection). Path resolution uses the same root check with a trailing separator, and dot-segments (`.git`, `.env`) are refused. DevTools are off unless started with `--devtools`.
- **Stored preferences.** The only persisted state is the audio preference object in `localStorage` (`cel-audio-v2`). It is treated as untrusted on load: unknown keys are dropped, volumes must be finite numbers (clamped to 0–1) and the score palette must be a known one (`tests/audio-prefs.test.mjs`).
- **URL parameters.** `?q=`, `?hub=`, `?auto=` and the `#machine` hash are matched against own-property allow-lists, so values such as `constructor` or `__proto__` fall back to defaults.
- **Code signing.** The `.exe` is **not** code-signed (see `docs/adr/0004-no-code-signing.md`), so Windows SmartScreen will warn. Verify downloads against the SHA-256 checksums published with each release.

## Reporting a Vulnerability

Please **do not** open public issues for suspected security vulnerabilities. Report them privately to **Alexander Stephen Donahue (Independent Researcher, 0thernes, Spokane, WA, USA)** at `0_0@0thernes.art` with a minimal reproduction, the affected file and line, and the impact.
