import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const desktopProj = path.join(rootDir, "desktop", "ComputerEvolutionLab.csproj");
const objDir = path.join(rootDir, "desktop", "obj");
const embeddedZipPath = path.join(objDir, "lab-assets.zip");
const publishDir = path.join(rootDir, "desktop", "bin", "publish");
const builtExe = path.join(publishDir, "Computer Evolution Lab.exe");
const rootExe = path.join(rootDir, "Computer Evolution Lab.exe");

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function collectRuntimeFiles() {
  const entries = [];
  const topFiles = ["index.html", "computer-evolution-lab.html"];
  const dirs = ["styles", "vendor", "assets", "src"];

  for (const f of topFiles) {
    const abs = path.join(rootDir, f);
    if (fs.existsSync(abs)) {
      entries.push({ rel: f, abs });
    }
  }

  function walk(dirRel) {
    const absDir = path.join(rootDir, dirRel);
    if (!fs.existsSync(absDir)) return;
    for (const item of fs.readdirSync(absDir, { withFileTypes: true })) {
      const childRel = `${dirRel}/${item.name}`;
      if (item.isDirectory()) {
        walk(childRel);
      } else if (item.isFile()) {
        entries.push({ rel: childRel, abs: path.join(rootDir, childRel) });
      }
    }
  }

  for (const d of dirs) walk(d);
  return entries;
}

function writeZipArchive(outPath, files) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const f of files) {
    const raw = fs.readFileSync(f.abs);
    const compressed = zlib.deflateRawSync(raw, { level: 9 });
    const useDeflate = compressed.length < raw.length;
    const payload = useDeflate ? compressed : raw;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(raw);
    const nameBytes = Buffer.from(f.rel.replace(/\\/g, "/"), "utf8");

    const localHdr = Buffer.alloc(30);
    localHdr.writeUInt32LE(0x04034b50, 0);
    localHdr.writeUInt16LE(20, 4);
    localHdr.writeUInt16LE(0x0800, 6); // UTF-8 filename flag
    localHdr.writeUInt16LE(method, 8);
    localHdr.writeUInt16LE(0, 10);
    localHdr.writeUInt16LE(0x5421, 12);
    localHdr.writeUInt32LE(crc, 14);
    localHdr.writeUInt32LE(payload.length, 18);
    localHdr.writeUInt32LE(raw.length, 22);
    localHdr.writeUInt16LE(nameBytes.length, 26);
    localHdr.writeUInt16LE(0, 28);

    localChunks.push(localHdr, nameBytes, payload);

    const centralHdr = Buffer.alloc(46);
    centralHdr.writeUInt32LE(0x02014b50, 0);
    centralHdr.writeUInt16LE(20, 4);
    centralHdr.writeUInt16LE(20, 6);
    centralHdr.writeUInt16LE(0x0800, 8);
    centralHdr.writeUInt16LE(method, 10);
    centralHdr.writeUInt16LE(0, 12);
    centralHdr.writeUInt16LE(0x5421, 14);
    centralHdr.writeUInt32LE(crc, 16);
    centralHdr.writeUInt32LE(payload.length, 20);
    centralHdr.writeUInt32LE(raw.length, 24);
    centralHdr.writeUInt16LE(nameBytes.length, 28);
    centralHdr.writeUInt16LE(0, 30);
    centralHdr.writeUInt16LE(0, 32);
    centralHdr.writeUInt16LE(0, 34);
    centralHdr.writeUInt16LE(0, 36);
    centralHdr.writeUInt32LE(0, 38);
    centralHdr.writeUInt32LE(offset, 42);

    centralChunks.push(centralHdr, nameBytes);
    offset += localHdr.length + nameBytes.length + payload.length;
  }

  const centralBuf = Buffer.concat(centralChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.concat([...localChunks, centralBuf, eocd]));
}

console.log("[1/4] Packing self-contained web assets into embedded archive...");
const runtimeFiles = collectRuntimeFiles();
writeZipArchive(embeddedZipPath, runtimeFiles);
const zipKb = (fs.statSync(embeddedZipPath).size / 1024).toFixed(1);
console.log(`  ✓ Packed ${runtimeFiles.length} runtime assets (${zipKb} KB compressed)`);

console.log("[2/4] Publishing single-file Windows x64 executable...");
execFileSync(
  "dotnet",
  [
    "publish",
    desktopProj,
    "-c",
    "Release",
    "-r",
    "win-x64",
    "-p:PublishSingleFile=true",
    "-p:SelfContained=false",
    "-o",
    publishDir,
  ],
  { stdio: "inherit" },
);

if (!fs.existsSync(builtExe)) {
  throw new Error(`Expected executable not found at ${builtExe}`);
}

fs.copyFileSync(builtExe, rootExe);
const sizeKb = (fs.statSync(rootExe).size / 1024).toFixed(1);
console.log(`  ✓ Built ${rootExe} (${sizeKb} KB standalone single-file .exe)`);

if (process.argv.includes("--install")) {
  console.log("[3/4] Installing executable to Desktop & Start Menu...");
  execFileSync(
    "pwsh",
    [
      "-NoProfile",
      "-Command",
      "Get-Process -Name 'Computer Evolution Lab' -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Milliseconds 300",
    ],
    { stdio: "inherit" },
  );

  const desktopDir = execFileSync(
    "pwsh",
    ["-NoProfile", "-Command", "[Environment]::GetFolderPath('Desktop')"],
    { encoding: "utf8" },
  ).trim();
  const desktopExe = path.join(desktopDir, "Computer Evolution Lab.exe");
  fs.copyFileSync(rootExe, desktopExe);
  console.log(`  ✓ Desktop executable -> ${desktopExe}`);

  execFileSync(
    "pwsh",
    [
      "-NoProfile",
      "-Command",
      `$p = Start-Process -FilePath '${desktopExe.replace(/'/g, "''")}' -WorkingDirectory '${desktopDir.replace(/'/g, "''")}' -ArgumentList '--install-shortcuts' -Wait -PassThru; exit $p.ExitCode`,
    ],
    { stdio: "inherit" },
  );
  console.log("  ✓ Start Menu shortcut installed (AppUserModelID stamped)");

  console.log(
    "[4/4] Verifying standalone Desktop executable (HTTP + live WebView2 + WebGL2)...",
  );
  const uiReport = path.join(os.tmpdir(), "cel-ui-verify.txt");
  const uiPng = path.join(os.tmpdir(), "cel-ui-verify.png");
  if (fs.existsSync(uiReport)) fs.unlinkSync(uiReport);
  if (fs.existsSync(uiPng)) fs.unlinkSync(uiPng);

  execFileSync(
    "pwsh",
    [
      "-NoProfile",
      "-Command",
      `$p = Start-Process -FilePath '${desktopExe.replace(/'/g, "''")}' -WorkingDirectory $env:TEMP -ArgumentList '--smoke-test' -Wait -PassThru; if ($p.ExitCode -ne 0) { exit $p.ExitCode }`,
    ],
    { stdio: "inherit" },
  );
  console.log(
    "  ✓ Smoke report:\n" +
      fs.readFileSync(path.join(os.tmpdir(), "cel-exe-smoke.txt"), "utf8").trim(),
  );

  execFileSync(
    "pwsh",
    [
      "-NoProfile",
      "-Command",
      `$p = Start-Process -FilePath '${desktopExe.replace(/'/g, "''")}' -WorkingDirectory $env:TEMP -ArgumentList @('--verify-ui', '${uiReport.replace(/'/g, "''")}', '${uiPng.replace(/'/g, "''")}') -Wait -PassThru; exit $p.ExitCode`,
    ],
    { stdio: "inherit" },
  );
  const reportText = fs.readFileSync(uiReport, "utf8").trim();
  if (!reportText.startsWith("VERIFY_UI_OK")) {
    throw new Error(`UI verification failed:\n${reportText}`);
  }
  const pngSizeKb = (fs.statSync(uiPng).size / 1024).toFixed(1);
  console.log(
    `  ✓ Live WebView2 + WebGL2 UI verification passed! Screenshot: ${uiPng} (${pngSizeKb} KB)`,
  );
  console.log("  " + reportText.replace(/\n/g, "\n  "));
}
