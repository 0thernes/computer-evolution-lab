import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const desktopProj = path.join(rootDir, "desktop", "ComputerEvolutionLab.csproj");
const publishDir = path.join(rootDir, "desktop", "bin", "publish");
const builtExe = path.join(publishDir, "Computer Evolution Lab.exe");
const rootExe = path.join(rootDir, "Computer Evolution Lab.exe");

console.log("[1/3] Publishing single-file Windows x64 executable...");
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
console.log(`  ✓ Built ${rootExe} (${sizeKb} KB)`);

if (process.argv.includes("--install")) {
  console.log("[2/3] Installing executable to Desktop & Start Menu...");
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
      `$p = Start-Process -FilePath '${desktopExe.replace(/'/g, "''")}' -ArgumentList '--install-shortcuts' -Wait -PassThru; exit $p.ExitCode`,
    ],
    { stdio: "inherit" },
  );
  console.log("  ✓ Start Menu shortcut installed (AppUserModelID stamped)");

  console.log("[3/3] Verifying standalone Desktop executable (--smoke-test)...");
  execFileSync(
    "pwsh",
    [
      "-NoProfile",
      "-Command",
      `$p = Start-Process -FilePath '${desktopExe.replace(/'/g, "''")}' -ArgumentList '--smoke-test' -Wait -PassThru; exit $p.ExitCode`,
    ],
    { stdio: "inherit" },
  );
  console.log("  ✓ Desktop executable smoke test passed!");
}
