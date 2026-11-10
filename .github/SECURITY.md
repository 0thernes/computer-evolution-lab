# Security Policy

## Supported Versions

| Version   | Supported                                                |
| :-------- | :------------------------------------------------------- |
| `2.0.x`   | Yes                                                      |
| `< 2.0.0` | No (legacy monolithic HTML superseded by modular v2.0.0) |

## Architecture & Threat Surface

- **Client-Side Sandbox**: Computer Evolution Lab runs 100% locally inside the browser's JavaScript, WebGL2, and WebAudio sandboxes with zero external network calls, zero telemetry beacons, and zero server-side state.
- **Local Dev Server (`tools/serve.mjs`)**: Binds exclusively to loopback (`127.0.0.1`) and enforces `path.resolve` root prefix checks against directory traversal.

## Reporting a Vulnerability

Please **do not** open public issues for suspected security vulnerabilities (such as DOM XSS in user-supplied assembly/shader labels or path traversal in dev scripts). Report security findings privately to **0thernes LLC** at `0_0@0thernes.art` with a minimal reproduction, affected file/line, and impact summary.
