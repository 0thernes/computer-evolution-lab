import test from "node:test";
import { execFileSync } from "node:child_process";
import { ROOT_DIR } from "../tools/serve.mjs";

test("audit index covers current tracked file counts and purposes", () => {
  execFileSync(process.execPath, ["tools/gen-audit-index.mjs", "--check"], {
    cwd: ROOT_DIR,
    stdio: "pipe",
  });
});
