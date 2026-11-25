import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, "..");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".wav": "audio/wav",
  ".opus": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".hdr": "application/octet-stream",
  ".md": "text/markdown; charset=utf-8",
};

/**
 * True only when `absPath` is ROOT_DIR itself or a descendant of it.
 * A bare `startsWith(ROOT_DIR)` check is not enough: a sibling folder such as
 * `<root>-secrets/` shares the string prefix (REVIEW-v5 B1).
 */
export function isInsideRoot(absPath, root = ROOT_DIR) {
  const rel = path.relative(root, absPath);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * Only same-machine names are accepted in the Host header. A web page cannot read this server
 * through DNS rebinding (attacker.example -> 127.0.0.1), because the browser still sends
 * `Host: attacker.example`. Mirrors the desktop wrapper's check (see .github/SECURITY.md).
 */
export function isAllowedHost(hostHeader, port) {
  if (typeof hostHeader !== "string") return false;
  const h = hostHeader.toLowerCase();
  return h === `127.0.0.1:${port}` || h === `localhost:${port}` || h === `[::1]:${port}`;
}

/** Dot-segments (`.git`, `.github`, `.env`, ...) are never served. */
export function hasHiddenSegment(relPath) {
  return relPath.split(/[\\/]+/).some((seg) => seg.startsWith("."));
}

function plain(res, code, text, extra = {}) {
  res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8", ...extra });
  res.end(text);
}

export function startServer(port = 4173, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    let boundPort = port;
    const server = http.createServer((req, res) => {
      try {
        if (req.method !== "GET" && req.method !== "HEAD") {
          plain(res, 405, "405 Method Not Allowed", { Allow: "GET, HEAD" });
          return;
        }
        if (!isAllowedHost(req.headers.host, boundPort)) {
          plain(res, 421, "421 Misdirected Request");
          return;
        }
        const parsed = new URL(req.url || "/", `http://${host}`);
        let relPath;
        try {
          relPath = decodeURIComponent(parsed.pathname);
        } catch {
          plain(res, 400, "400 Bad Request");
          return;
        }
        if (relPath === "/") relPath = "/index.html";
        if (relPath.includes("\0") || hasHiddenSegment(relPath)) {
          plain(res, 403, "403 Forbidden");
          return;
        }

        const safePath = path.resolve(ROOT_DIR, "." + relPath);
        if (!isInsideRoot(safePath)) {
          plain(res, 403, "403 Forbidden");
          return;
        }
        let stat;
        try {
          // Resolve symlinks too, so a link inside the repo cannot point outside it.
          if (!isInsideRoot(fs.realpathSync(safePath), fs.realpathSync(ROOT_DIR))) {
            plain(res, 403, "403 Forbidden");
            return;
          }
          stat = fs.statSync(safePath);
        } catch {
          stat = null;
        }
        if (!stat || !stat.isFile()) {
          plain(res, 404, "404 Not Found");
          return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const mime = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": mime,
          "Content-Length": stat.size,
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
        });
        if (req.method === "HEAD") {
          res.end();
          return;
        }
        const stream = fs.createReadStream(safePath);
        stream.on("error", () => res.destroy());
        stream.pipe(res);
      } catch {
        if (!res.headersSent) plain(res, 500, "500 Internal Server Error");
        else res.destroy();
      }
    });

    server.once("error", reject);
    server.listen(port, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === "object" && addr ? addr.port : port;
      boundPort = actualPort;
      resolve({
        server,
        url: `http://${host}:${actualPort}`,
        port: actualPort,
        close: () =>
          new Promise((r) => {
            server.closeAllConnections?.();
            server.close(() => r());
          }),
      });
    });
  });
}

// Run directly if invoked as CLI entrypoint
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const reqPort = Number(process.env.PORT || process.argv[2] || 4173);
  startServer(reqPort).then(({ url }) => {
    console.log(
      `\n◈ Computer Evolution Lab dev server running at:\n  ${url}/index.html\n  ${url}/computer-evolution-lab.html\n\nPress Ctrl+C to stop.`,
    );
  });
}
