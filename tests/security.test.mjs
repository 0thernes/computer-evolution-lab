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
