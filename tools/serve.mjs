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

export function startServer(port = 4173, host = "127.0.0.1") {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsed = new URL(req.url || "/", `http://${host}`);
        let relPath = decodeURIComponent(parsed.pathname);
        if (relPath === "/") relPath = "/index.html";

        const safePath = path.resolve(ROOT_DIR, "." + relPath);
        if (!isInsideRoot(safePath)) {
          res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("403 Forbidden");
          return;
        }

        if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("404 Not Found");
          return;
        }

        if (req.method !== "GET" && req.method !== "HEAD") {
          res.writeHead(405, { Allow: "GET, HEAD" });
          res.end();
          return;
        }
        const ext = path.extname(safePath).toLowerCase();
        const mime = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, {
          "Content-Type": mime,
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff",
        });
        if (req.method === "HEAD") {
          res.end();
          return;
        }
        fs.createReadStream(safePath).pipe(res);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("500 Internal Server Error: " + err.message);
      }
    });

    server.once("error", reject);
    server.listen(port, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === "object" && addr ? addr.port : port;
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
