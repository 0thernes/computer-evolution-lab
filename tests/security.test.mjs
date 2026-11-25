import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { isInsideRoot, startServer } from "../tools/serve.mjs";

test("isInsideRoot rejects prefix-sibling and parent paths (REVIEW-v5 B1)", () => {
  const root = path.resolve("/srv/lab");
  assert.equal(isInsideRoot(root, root), true);
  assert.equal(isInsideRoot(path.join(root, "index.html"), root), true);
  assert.equal(isInsideRoot(path.join(root, "a/b/c.js"), root), true);
  assert.equal(isInsideRoot(path.resolve("/srv/lab-secrets/x.txt"), root), false);
  assert.equal(isInsideRoot(path.resolve("/srv/x.txt"), root), false);
  assert.equal(isInsideRoot(path.resolve("/etc/passwd"), root), false);
});

test("dev server returns 403 for encoded sibling traversal and 405 for POST", async () => {
  const srv = await startServer(0);
  try {
    const base = srv.url;
    const http = await import("node:http");
    const get = (p, method = "GET") =>
      new Promise((resolve, reject) => {
        const req = http.request(base + p, { method }, (res) => {
          res.resume();
          resolve(res.statusCode);
        });
        req.on("error", reject);
        req.end();
      });
    assert.equal(await get("/..%2f..%2fetc%2fpasswd"), 403);
    assert.equal(await get("/..%2fcel-review-secret.txt"), 403);
    assert.equal(await get("/index.html"), 200);
    assert.equal(await get("/index.html", "POST"), 405);
  } finally {
    await srv.close();
  }
});

test("dev server rejects foreign Host (DNS rebinding), dot-paths and malformed escapes", async () => {
  const srv = await startServer(0);
  try {
    const net = await import("node:net");
    const raw = (line, host) =>
      new Promise((resolve, reject) => {
        const sock = net.connect(srv.port, "127.0.0.1", () => {
          sock.write(
            `GET ${line} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`,
          );
        });
        let buf = "";
        sock.on("data", (d) => (buf += d));
        sock.on("end", () => resolve(Number(buf.split(" ")[1])));
        sock.on("error", reject);
      });
    const local = `127.0.0.1:${srv.port}`;
    assert.equal(await raw("/index.html", local), 200);
    assert.equal(await raw("/index.html", `localhost:${srv.port}`), 200);
    assert.equal(await raw("/index.html", `evil.example:${srv.port}`), 421);
    assert.equal(await raw("/index.html", "127.0.0.1:1"), 421);
    assert.equal(await raw("/.git/config", local), 403);
    assert.equal(await raw("/.github/workflows/ci.yml", local), 403);
    assert.equal(await raw("/%E0%A4%A", local), 400);
    assert.equal(await raw("/src", local), 404);
    assert.equal(await raw("/no-such-file.js", local), 404);
  } finally {
    await srv.close();
  }
});

test("hidden-segment and host helpers", async () => {
  const { hasHiddenSegment, isAllowedHost } = await import("../tools/serve.mjs");
  assert.equal(hasHiddenSegment("/src/app/lab-main.js"), false);
  assert.equal(hasHiddenSegment("/.env"), true);
  assert.equal(hasHiddenSegment("/a/.git/HEAD"), true);
  assert.equal(isAllowedHost("LOCALHOST:80", 80), true);
  assert.equal(isAllowedHost(undefined, 80), false);
  assert.equal(isAllowedHost("127.0.0.1:80.evil", 80), false);
});
