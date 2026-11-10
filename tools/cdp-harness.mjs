import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function findBrowserBinary() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

export async function launchHeadlessSession({
  width = 1920,
  height = 1080,
  extraArgs = [],
} = {}) {
  const bin = findBrowserBinary();
  if (!bin) {
    throw new Error("No Chrome/Edge/Chromium binary found for headless WebGL2 testing.");
  }

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "cel-cdp-"));
  const args = [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDir}`,
    `--window-size=${width},${height}`,
    "--enable-webgl",
    "--ignore-gpu-blocklist",
    ...(process.platform === "win32" ? ["--use-angle=d3d11"] : []),
    "--autoplay-policy=no-user-gesture-required",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-sync",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    ...extraArgs,
    "about:blank",
  ];

  const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });

  const browserWsUrl = await new Promise((resolve, reject) => {
    let stderrBuf = "";
    const timer = setTimeout(() => {
      reject(new Error("Timed out waiting for Chrome DevTools endpoint.\n" + stderrBuf));
    }, 15000);

    proc.stderr.on("data", (chunk) => {
      stderrBuf += chunk.toString("utf8");
      const m = stderrBuf.match(/DevTools listening on (ws:\/\/[^\r\n]+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1].trim());
      }
    });

    proc.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Browser exited early with code ${code}\n${stderrBuf}`));
    });
  });

  const parsedWs = new URL(browserWsUrl);
  const debugOrigin = `http://${parsedWs.host}`;

  let targets = [];
  for (let attempt = 0; attempt < 25; attempt++) {
    try {
      const resp = await fetch(`${debugOrigin}/json/list`);
      targets = await resp.json();
      const page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 120));
  }

  const pageTarget = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
  if (!pageTarget) {
    proc.kill();
    throw new Error("Could not find debuggable page target in headless browser.");
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve(), { once: true });
    ws.addEventListener("error", (err) => reject(err), { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  const consoleErrors = [];
  const pageExceptions = [];
  const logs = [];

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(typeof ev.data === "string" ? ev.data : ev.data.toString());
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
      else resolve(msg.result);
      return;
    }
    if (msg.method === "Runtime.consoleAPICalled") {
      const type = msg.params.type;
      const text = (msg.params.args || [])
        .map((a) => a.value ?? a.description ?? JSON.stringify(a))
        .join(" ");
      logs.push({ type, text });
      if (type === "error") consoleErrors.push(text);
    } else if (msg.method === "Runtime.exceptionThrown") {
      const d = msg.params.exceptionDetails;
      const desc =
        d?.exception?.description ||
        d?.text ||
        JSON.stringify(msg.params.exceptionDetails);
      pageExceptions.push(desc);
    } else if (msg.method === "Log.entryAdded") {
      const e = msg.params.entry;
      if (e && e.level === "error") {
        // Ignore harmless favicon 404s if any
        if (!String(e.url || "").endsWith("favicon.ico")) {
          consoleErrors.push(`[Log.${e.source}] ${e.text} (${e.url || ""})`);
        }
      }
    }
  });

  function rejectAllPending(reason) {
    for (const [, entry] of pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
    }
    pending.clear();
  }

  ws.addEventListener("close", (ev) => {
    rejectAllPending(
      `CDP WebSocket closed (code=${ev.code}, reason=${ev.reason || "none"})`,
    );
  });
  ws.addEventListener("error", () => {
    rejectAllPending("CDP WebSocket error");
  });

  function send(method, params = {}, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      if (ws.readyState !== WebSocket.OPEN) {
        reject(new Error(`Cannot send ${method}: CDP WebSocket is not open.`));
        return;
      }
      const id = nextId++;
      const timer = setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`CDP timeout (${timeoutMs}ms) waiting for ${method}`));
        }
      }, timeoutMs);
      pending.set(id, {
        timer,
        resolve: (res) => {
          clearTimeout(timer);
          resolve(res);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });

  async function navigate(url) {
    consoleErrors.length = 0;
    pageExceptions.length = 0;
    await send("Page.navigate", { url });
  }

  async function evalValue(expression, timeoutMs = 30000) {
    const res = await Promise.race([
      send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      }),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error(`Timeout evaluating expression`)), timeoutMs),
      ),
    ]);
    if (res.exceptionDetails) {
      const desc =
        res.exceptionDetails.exception?.description ||
        res.exceptionDetails.text ||
        "Evaluation error";
      throw new Error(desc);
    }
    return res.result ? res.result.value : undefined;
  }

  async function waitForLabBoot(timeoutMs = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const status = await evalValue(`({
        started: !!window.__labStarted,
        bootErr: document.querySelector("#boot.err pre")?.textContent || null
      })`);
      if (status?.bootErr) {
        throw new Error(`Boot screen reported failure: ${status.bootErr}`);
      }
      if (status?.started) return true;
      await new Promise((r) => setTimeout(r, 120));
    }
    throw new Error(
      `Timed out waiting for window.__labStarted. Exceptions: ${pageExceptions.join("; ")} | Errors: ${consoleErrors.join("; ")}`,
    );
  }

  async function close() {
    try {
      await send("Browser.close", {}, 1500);
    } catch {}
    try {
      ws.close();
    } catch {}
    try {
      proc.stdout?.destroy();
      proc.stderr?.destroy();
      proc.kill();
    } catch {}
    await new Promise((r) => setTimeout(r, 180));
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }

  return {
    bin,
    send,
    navigate,
    evalValue,
    waitForLabBoot,
    consoleErrors,
    pageExceptions,
    logs,
    close,
  };
}
