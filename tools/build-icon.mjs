import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchHeadlessSession } from "./cdp-harness.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outIco = path.join(rootDir, "assets", "icon", "computer-evolution-lab.ico");
const previewPng = process.argv[2] || "";

fs.mkdirSync(path.dirname(outIco), { recursive: true });

const SIZES = [256, 128, 64, 48, 32, 16];

function packIco(entries) {
  // ICONDIR (6 bytes) + N * ICONDIRENTRY (16 bytes) + PNG payloads
  const headerSize = 6 + entries.length * 16;
  const totalSize = headerSize + entries.reduce((sum, e) => sum + e.png.length, 0);
  const buf = Buffer.alloc(totalSize);

  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // Type = 1 (ICO)
  buf.writeUInt16LE(entries.length, 4); // Count

  let offset = headerSize;
  entries.forEach((entry, idx) => {
    const base = 6 + idx * 16;
    buf.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 0); // Width (0 = 256)
    buf.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 1); // Height (0 = 256)
    buf.writeUInt8(0, base + 2); // Color palette
    buf.writeUInt8(0, base + 3); // Reserved
    buf.writeUInt16LE(1, base + 4); // Color planes
    buf.writeUInt16LE(32, base + 6); // Bits per pixel (32-bit RGBA)
    buf.writeUInt32LE(entry.png.length, base + 8); // Size of PNG data
    buf.writeUInt32LE(offset, base + 12); // Offset of PNG data
    entry.png.copy(buf, offset);
    offset += entry.png.length;
  });

  return buf;
}

const session = await launchHeadlessSession({ width: 512, height: 512 });
try {
  await session.navigate("about:blank");
  const b64List = await session.evalValue(`(async () => {
    const sizes = ${JSON.stringify(SIZES)};
    function drawMasterIcon(sz) {
      const c = document.createElement('canvas');
      c.width = sz;
      c.height = sz;
      const g = c.getContext('2d');
      g.save();
      g.scale(sz / 256, sz / 256);

      // Helper for rounded squircle
      const rrect = (x, y, w, h, r) => {
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
      };

      // 1. Anodized dark titanium squircle chassis
      const pad = 12;
      const box = 256 - pad * 2;
      const bgGrad = g.createLinearGradient(16, 12, 240, 244);
      bgGrad.addColorStop(0, '#182232');
      bgGrad.addColorStop(0.5, '#0b1019');
      bgGrad.addColorStop(1, '#06090f');
      rrect(pad, pad, box, box, 48);
      g.fillStyle = bgGrad;
      g.fill();

      // Subtle rim chamfer highlight
      const rimGrad = g.createLinearGradient(12, 12, 244, 244);
      rimGrad.addColorStop(0, 'rgba(125, 211, 252, 0.72)');
      rimGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.22)');
      rimGrad.addColorStop(1, 'rgba(245, 158, 11, 0.58)');
      g.lineWidth = sz <= 24 ? 6 : 3.5;
      g.strokeStyle = rimGrad;
      g.stroke();

      // 2. 24k ENIG Gold QFN/PGA perimeter pins on all 4 sides
      const pinCount = sz <= 24 ? 5 : 9;
      for (let i = 0; i < pinCount; i++) {
        const t = 58 + (i * (140)) / (pinCount - 1);
        const gold = g.createLinearGradient(0, 0, 256, 256);
        gold.addColorStop(0, '#fde68a');
        gold.addColorStop(0.5, '#eab308');
        gold.addColorStop(1, '#b45309');
        g.fillStyle = gold;
        const pw = sz <= 24 ? 10 : 7;
        const pl = 18;
        // Top & bottom pins
        g.fillRect(t - pw / 2, 24, pw, pl);
        g.fillRect(t - pw / 2, 256 - 24 - pl, pw, pl);
        // Left & right pins
        g.fillRect(24, t - pw / 2, pl, pw);
        g.fillRect(256 - 24 - pl, t - pw / 2, pl, pw);
      }

      // 3. Printed circuit traces radiating from silicon package to pins
      if (sz >= 32) {
        g.strokeStyle = 'rgba(56, 189, 248, 0.36)';
        g.lineWidth = 2.2;
        for (let i = 0; i < pinCount; i++) {
          const t = 58 + (i * 140) / (pinCount - 1);
          const inner = 78 + (i * 100) / (pinCount - 1);
          g.beginPath();
          g.moveTo(t, 42); g.lineTo(inner, 66);
          g.moveTo(t, 214); g.lineTo(inner, 190);
          g.moveTo(42, t); g.lineTo(66, inner);
          g.moveTo(214, t); g.lineTo(190, inner);
          g.stroke();
        }
      }

      // 4. Inner ceramic/silicon package substrate
      rrect(56, 56, 144, 144, 22);
      const subGrad = g.createLinearGradient(56, 56, 200, 200);
      subGrad.addColorStop(0, '#132033');
      subGrad.addColorStop(1, '#090e17');
      g.fillStyle = subGrad;
      g.fill();
      g.lineWidth = 2.5;
      g.strokeStyle = 'rgba(234, 179, 8, 0.65)';
      g.stroke();

      // 5. Iridescent photolithographed silicon die + radiant Cyber-Crystal diamond core
      const glow = g.createRadialGradient(128, 128, 6, 128, 128, 76);
      glow.addColorStop(0, 'rgba(186, 230, 253, 0.95)');
      glow.addColorStop(0.32, 'rgba(56, 189, 248, 0.65)');
      glow.addColorStop(0.68, 'rgba(168, 85, 247, 0.28)');
      glow.addColorStop(1, 'rgba(14, 165, 233, 0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(128, 128, 76, 0, Math.PI * 2);
      g.fill();

      // Faceted 3D diamond prism (matching Lab ◈ emblem)
      const dR = sz <= 24 ? 54 : 48;
      g.beginPath();
      g.moveTo(128, 128 - dR);
      g.lineTo(128 + dR, 128);
      g.lineTo(128, 128 + dR);
      g.lineTo(128 - dR, 128);
      g.closePath();
      const dGrad = g.createLinearGradient(128 - dR, 128 - dR, 128 + dR, 128 + dR);
      dGrad.addColorStop(0, '#e0f2fe');
      dGrad.addColorStop(0.38, '#38bdf8');
      dGrad.addColorStop(0.72, '#818cf8');
      dGrad.addColorStop(1, '#f59e0b');
      g.fillStyle = dGrad;
      g.fill();
      g.lineWidth = sz <= 24 ? 5 : 3;
      g.strokeStyle = '#f8fafc';
      g.stroke();

      // Inner crystal facets
      g.beginPath();
      g.moveTo(128, 128 - dR); g.lineTo(128, 128 + dR);
      g.moveTo(128 - dR, 128); g.lineTo(128 + dR, 128);
      g.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      g.lineWidth = 1.8;
      g.stroke();

      // Bright center core node
      g.beginPath();
      g.arc(128, 128, sz <= 24 ? 10 : 8, 0, Math.PI * 2);
      g.fillStyle = '#ffffff';
      g.fill();

      g.restore();
      return c.toDataURL('image/png').split(',')[1];
    }

    return sizes.map((sz) => ({ size: sz, b64: drawMasterIcon(sz) }));
  })()`);

  const entries = b64List.map((item) => ({
    size: item.size,
    png: Buffer.from(item.b64, "base64"),
  }));

  const icoBuf = packIco(entries);
  fs.writeFileSync(outIco, icoBuf);
  if (previewPng) {
    fs.mkdirSync(path.dirname(previewPng), { recursive: true });
    fs.writeFileSync(previewPng, entries[0].png);
  }
  console.log(
    `Built ${outIco} (${(icoBuf.length / 1024).toFixed(1)} KB, sizes: ${SIZES.join(", ")}px)`,
  );
} finally {
  await session.close();
}
