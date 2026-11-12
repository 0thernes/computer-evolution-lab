// Procedural 4K/2K PBR Materials, Micro-Surface Normal/Bump/Roughness Maps, & Cross-Section Slicer Support

var gm = new Map();
function gn(key, factory) {
  if (!gm.has(key)) gm.set(key, factory());
  return gm.get(key);
}

function seededRng(seed) {
  let s = seed >>> 0 || 1337;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Physically plausible albedo calibration: prevents pure-1.0 white dielectric blowouts under studio HDR
function calibrateDielectricColor(colInt, maxLuma = 0.8) {
  const c = new Ae(colInt);
  const luma = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  if (luma > maxLuma && luma > 1e-4) {
    const scale = (maxLuma + (luma - maxLuma) * 0.22) / luma;
    c.multiplyScalar(scale);
  }
  return c;
}

function makeCanvasTex(canvas, isColor = true, repeat = 1) {
  const tex = new Wn(canvas);
  if (isColor) tex.colorSpace = Ot;
  tex.wrapS = tex.wrapT = os;
  tex.anisotropy = 16;
  if (repeat !== 1) tex.repeat.set(repeat, repeat);
  tex.needsUpdate = true;
  return tex;
}

// Fast analytical 3x3 Sobel heightfield -> Tangent-Space RGB NormalMap converter
function heightCanvasToNormalTex(hCanvas, strength = 2.2, repeat = 1) {
  const w = hCanvas.width;
  const h = hCanvas.height;
  const src = hCanvas.getContext("2d").getImageData(0, 0, w, h).data;
  const nCan = document.createElement("canvas");
  nCan.width = w;
  nCan.height = h;
  const nCtx = nCan.getContext("2d");
  const outImg = nCtx.createImageData(w, h);
  const dst = outImg.data;
  const wm = w - 1;
  const hm = h - 1;
  const H = (x, y) => src[((y & hm) * w + (x & wm)) << 2] / 255;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = H(x - 1, y - 1);
      const t = H(x, y - 1);
      const tr = H(x + 1, y - 1);
      const l = H(x - 1, y);
      const r = H(x + 1, y);
      const bl = H(x - 1, y + 1);
      const b = H(x, y + 1);
      const br = H(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const idx = (y * w + x) << 2;
      dst[idx] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
      dst[idx + 1] = Math.round((-dy * inv * 0.5 + 0.5) * 255);
      dst[idx + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      dst[idx + 3] = 255;
    }
  }
  nCtx.putImageData(outImg, 0, 0);
  return makeCanvasTex(nCan, false, repeat);
}

// 1. 1024x1024 Brushed Anodized / Machined Metal Normal & Roughness Maps
function brushedMetalMaps() {
  return gn("__tex_brushed", () => {
    const sz = 1024;
    const bCan = document.createElement("canvas");
    const rCan = document.createElement("canvas");
    bCan.width = bCan.height = rCan.width = rCan.height = sz;
    const bCtx = bCan.getContext("2d");
    const rCtx = rCan.getContext("2d");
    const rng = seededRng(90210);

    bCtx.fillStyle = "#808080";
    bCtx.fillRect(0, 0, sz, sz);
    rCtx.fillStyle = "#a2a2a2";
    rCtx.fillRect(0, 0, sz, sz);

    for (let y = 0; y < sz; y++) {
      const base = 118 + Math.floor((rng() - 0.5) * 24);
      bCtx.fillStyle = `rgb(${base},${base},${base})`;
      bCtx.fillRect(0, y, sz, 1);

      const rBase = 148 + Math.floor((rng() - 0.5) * 30);
      rCtx.fillStyle = `rgb(${rBase},${rBase},${rBase})`;
      rCtx.fillRect(0, y, sz, 1);
    }

    for (let i = 0; i < 4200; i++) {
      const x = rng() * sz;
      const y = rng() * sz;
      const len = 45 + rng() * 280;
      const v = rng() < 0.5 ? 168 : 90;
      bCtx.strokeStyle = `rgba(${v},${v},${v},0.28)`;
      bCtx.lineWidth = 0.7 + rng() * 0.9;
      bCtx.beginPath();
      bCtx.moveTo(x, y);
      bCtx.lineTo(x + len, y + (rng() - 0.5) * 0.5);
      bCtx.stroke();
      if (x + len > sz) {
        bCtx.beginPath();
        bCtx.moveTo(x - sz, y);
        bCtx.lineTo(x - sz + len, y);
        bCtx.stroke();
      }
    }

    return {
      bump: makeCanvasTex(bCan, false, 3),
      normal: heightCanvasToNormalTex(bCan, 1.65, 3),
      rough: makeCanvasTex(rCan, false, 3),
    };
  });
}

// 2. 512x512 Fine EDM Molded ABS Polymer / Powder-Coat Micro-Grain Normal & Bump
function microGrainMap() {
  return gn("__tex_grain", () => {
    const sz = 512;
    const can = document.createElement("canvas");
    can.width = can.height = sz;
    const ctx = can.getContext("2d");
    const img = ctx.createImageData(sz, sz);
    const d = img.data;
    const rng = seededRng(424242);
    for (let i = 0; i < d.length; i += 4) {
      const v = 110 + Math.floor(rng() * 36);
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // Soften slightly for realistic molded ABS / wrinkle bead texture
    ctx.globalAlpha = 0.35;
    for (let k = 0; k < 1400; k++) {
      const gv = rng() < 0.5 ? 165 : 88;
      ctx.fillStyle = `rgb(${gv},${gv},${gv})`;
      ctx.beginPath();
      ctx.arc(rng() * sz, rng() * sz, 1.1 + rng() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const bump = makeCanvasTex(can, false, 6);
    bump.userData.normal = heightCanvasToNormalTex(can, 1.35, 6);
    return bump;
  });
}

// 3. Diamond-Knurled Machined Metal Normal + Bump Map
function knurlBumpMap() {
  return gn("__tex_knurl", () => {
    const sz = 512;
    const can = document.createElement("canvas");
    can.width = can.height = sz;
    const ctx = can.getContext("2d");
    ctx.fillStyle = "#585858";
    ctx.fillRect(0, 0, sz, sz);
    ctx.strokeStyle = "rgba(242,242,242,0.75)";
    ctx.lineWidth = 3.2;
    const step = 24;
    for (let k = -sz; k < sz * 2; k += step) {
      ctx.beginPath();
      ctx.moveTo(k, 0);
      ctx.lineTo(k + sz, sz);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(k + sz, 0);
      ctx.lineTo(k, sz);
      ctx.stroke();
    }
    const bump = makeCanvasTex(can, false, 4);
    bump.userData.normal = heightCanvasToNormalTex(can, 2.8, 4);
    return bump;
  });
}

// 4. Quarter-Sawn Walnut / Oak Wood Grain + Pores
function woodMaps() {
  return gn("__tex_wood", () => {
    const sz = 1024;
    const cCan = document.createElement("canvas");
    const bCan = document.createElement("canvas");
    cCan.width = cCan.height = bCan.width = bCan.height = sz;
    const cCtx = cCan.getContext("2d");
    const bCtx = bCan.getContext("2d");
    const img = cCtx.createImageData(sz, sz);
    const bImg = bCtx.createImageData(sz, sz);
    const cd = img.data;
    const bd = bImg.data;
    const rng = seededRng(7717);

    for (let y = 0; y < sz; y++) {
      for (let x = 0; x < sz; x++) {
        const nx = x / sz;
        const ny = y / sz;
        const warp =
          Math.sin(nx * Math.PI * 2) * 0.06 +
          Math.sin(ny * Math.PI * 4) * 0.035 +
          Math.sin((nx + ny) * Math.PI * 6) * 0.015;
        const rings = Math.sin((ny * 22 + warp * 18) * Math.PI * 2);
        const fine = Math.sin((ny * 140 + nx * 8) * Math.PI * 2) * 0.15;
        const k = 0.5 + 0.36 * rings + fine + (rng() - 0.5) * 0.05;
        const idx = (y * sz + x) * 4;
        cd[idx] = Math.max(35, Math.min(220, Math.round(92 + k * 74)));
        cd[idx + 1] = Math.max(22, Math.min(175, Math.round(54 + k * 50)));
        cd[idx + 2] = Math.max(12, Math.min(125, Math.round(28 + k * 30)));
        cd[idx + 3] = 255;

        const bv = Math.max(60, Math.min(210, Math.round(118 + rings * 28 + fine * 40)));
        bd[idx] = bd[idx + 1] = bd[idx + 2] = bv;
        bd[idx + 3] = 255;
      }
    }
    cCtx.putImageData(img, 0, 0);
    bCtx.putImageData(bImg, 0, 0);

    // Open wood pores
    cCtx.strokeStyle = "rgba(32, 16, 8, 0.28)";
    bCtx.strokeStyle = "rgba(45, 45, 45, 0.45)";
    for (let i = 0; i < 900; i++) {
      const px = rng() * sz;
      const py = rng() * sz;
      const plen = 8 + rng() * 34;
      cCtx.lineWidth = bCtx.lineWidth = 0.8 + rng() * 0.9;
      cCtx.beginPath();
      cCtx.moveTo(px, py);
      cCtx.lineTo(px + plen, py + (rng() - 0.5) * 1.5);
      cCtx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(px, py);
      bCtx.lineTo(px + plen, py + (rng() - 0.5) * 1.5);
      bCtx.stroke();
    }

    return {
      map: makeCanvasTex(cCan, true, 2),
      bump: makeCanvasTex(bCan, false, 2),
      normal: heightCanvasToNormalTex(bCan, 2.1, 2),
    };
  });
}

// 5. High-Resolution Multi-Layer FR-4 PCB (Shared 2K Normal/Roughness/Metalness + Per-Mask True Gold/Silkscreen Albedo)
var xm = null;
function jT() {
  if (xm) return xm.map;
  xm = buildPcbMaps();
  return xm.map;
}

function buildPcbMaps() {
  const sz = 2048;
  const cCan = document.createElement("canvas");
  const bCan = document.createElement("canvas");
  const rCan = document.createElement("canvas");
  const mCan = document.createElement("canvas");
  const oCan = document.createElement("canvas"); // untinted gold pads + vias + white silkscreen overlay!
  cCan.width =
    cCan.height =
    bCan.width =
    bCan.height =
    rCan.width =
    rCan.height =
    mCan.width =
    mCan.height =
    oCan.width =
    oCan.height =
      sz;

  const c = cCan.getContext("2d");
  const b = bCan.getContext("2d");
  const r = rCan.getContext("2d");
  const m = mCan.getContext("2d");
  const o = oCan.getContext("2d");
  const rng = seededRng(19756502);

  // Base neutral greyscale (for jT() callers) + dielectric solder mask metalness (0.04)
  c.fillStyle = "#98a09c";
  c.fillRect(0, 0, sz, sz);
  b.fillStyle = "#767676";
  b.fillRect(0, 0, sz, sz);
  r.fillStyle = "#969696"; // satin solder mask
  r.fillRect(0, 0, sz, sz);
  m.fillStyle = "#0c0c0c"; // non-metallic solder mask
  m.fillRect(0, 0, sz, sz);

  // Subtle FR-4 glass cloth cross-weave
  c.strokeStyle = "rgba(255,255,255,0.04)";
  b.strokeStyle = "rgba(150,150,150,0.20)";
  c.lineWidth = b.lineWidth = 2;
  for (let p = 0; p < sz; p += 16) {
    c.beginPath();
    c.moveTo(p, 0);
    c.lineTo(p, sz);
    c.moveTo(0, p);
    c.lineTo(sz, p);
    c.stroke();

    b.beginPath();
    b.moveTo(p, 0);
    b.lineTo(p, sz);
    b.moveTo(0, p);
    b.lineTo(sz, p);
    b.stroke();
  }

  c.lineCap = b.lineCap = r.lineCap = "round";
  c.lineJoin = b.lineJoin = r.lineJoin = "round";

  // Parallel multi-lane Manhattan 45-degree copper buses (lighter beneath solder mask + raised relief)
  for (let bus = 0; bus < 42; bus++) {
    const lanes = 4 + Math.floor(rng() * 6);
    const pitch = 6.5;
    let x0 = rng() * sz;
    let y0 = rng() * sz;
    const horiz = rng() < 0.5;
    const seg1 = 120 + rng() * 260;
    const diag = (rng() < 0.5 ? 1 : -1) * (40 + rng() * 90);
    const seg2 = 90 + rng() * 220;

    for (let ln = 0; ln < lanes; ln++) {
      const off = ln * pitch;
      const sx = horiz ? x0 : x0 + off;
      const sy = horiz ? y0 + off : y0;

      const drawBusPath = (ctx) => {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        if (horiz) {
          ctx.lineTo(sx + seg1, sy);
          ctx.lineTo(sx + seg1 + Math.abs(diag), sy + diag);
          ctx.lineTo(sx + seg1 + Math.abs(diag) + seg2, sy + diag);
        } else {
          ctx.lineTo(sx, sy + seg1);
          ctx.lineTo(sx + diag, sy + seg1 + Math.abs(diag));
          ctx.lineTo(sx + diag, sy + seg1 + Math.abs(diag) + seg2);
        }
        ctx.stroke();
      };

      c.strokeStyle = "#bcc7c1";
      c.lineWidth = 2.6;
      drawBusPath(c);

      b.strokeStyle = "#b4b4b4";
      b.lineWidth = 3.0;
      drawBusPath(b);

      r.strokeStyle = "#747474";
      r.lineWidth = 2.8;
      drawBusPath(r);
    }
  }

  // Serpentine high-speed DDR/PCIe length-matching traces
  for (let s = 0; s < 18; s++) {
    let sx = rng() * (sz - 240) + 60;
    let sy = rng() * (sz - 240) + 60;
    const amp = 12 + rng() * 14;
    const waves = 6 + Math.floor(rng() * 8);
    for (const [ctx, col, lw] of [
      [c, "#c7d2cc", 2.4],
      [b, "#bcbcbc", 2.8],
      [r, "#6d6d6d", 2.4],
    ]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      let cx = sx;
      for (let w = 0; w < waves; w++) {
        const dir = w % 2 === 0 ? 1 : -1;
        ctx.lineTo(cx + 6, sy + dir * amp);
        ctx.lineTo(cx + 14, sy + dir * amp);
        ctx.lineTo(cx + 20, sy);
        cx += 20;
      }
      ctx.stroke();
    }
  }

  // Individual point-to-point copper traces
  for (let t = 0; t < 680; t++) {
    let tx = rng() * sz;
    let ty = rng() * sz;
    const power = rng() < 0.1;
    const lw = power ? 5.5 : 2.1 + rng() * 1.3;
    const pts = [[tx, ty]];
    for (let k = 0; k < 3; k++) {
      const len = 24 + rng() * 130;
      const ang = (Math.floor(rng() * 8) * Math.PI) / 4;
      tx += Math.cos(ang) * len;
      ty += Math.sin(ang) * len;
      pts.push([tx, ty]);
    }
    for (const [ctx, col] of [
      [c, power ? "#ced8d3" : "#b5c0ba"],
      [b, "#b2b2b2"],
      [r, "#767676"],
    ]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.stroke();
    }
  }

  // QFP / SOIC SMD ENIG gold pad footprints + silkscreen outlines
  for (let ic = 0; ic < 82; ic++) {
    const ix = 40 + rng() * (sz - 140);
    const iy = 40 + rng() * (sz - 140);
    const iw = 26 + Math.floor(rng() * 48);
    const ih = 18 + Math.floor(rng() * 38);

    // Untinted bright white silkscreen outline + pin-1 dot
    for (const ctx of [c, o]) {
      ctx.strokeStyle = "rgba(240, 245, 248, 0.86)";
      ctx.lineWidth = 1.9;
      ctx.strokeRect(ix, iy, iw, ih);
      ctx.fillStyle = "rgba(240, 245, 248, 0.88)";
      ctx.beginPath();
      ctx.arc(ix + 5, iy + 5, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gold ENIG SMD pads along two sides (true metallic gold on mCan + oCan!)
    const pads = Math.max(4, Math.floor(iw / 6));
    for (let p = 0; p < pads; p++) {
      const px = ix + 3 + (p * (iw - 6)) / Math.max(1, pads - 1);
      for (const ctx of [c, o]) {
        ctx.fillStyle = "#e8c468";
        ctx.fillRect(px - 1.6, iy - 4.5, 3.2, 4);
        ctx.fillRect(px - 1.6, iy + ih + 0.5, 3.2, 4);
      }

      r.fillStyle = "#2b2b2b"; // specular gold pad
      r.fillRect(px - 1.6, iy - 4.5, 3.2, 4);
      r.fillRect(px - 1.6, iy + ih + 0.5, 3.2, 4);

      m.fillStyle = "#f4f4f4"; // 0.96 metalness on gold pads!
      m.fillRect(px - 1.6, iy - 4.5, 3.2, 4);
      m.fillRect(px - 1.6, iy + ih + 0.5, 3.2, 4);

      b.fillStyle = "#d8d8d8";
      b.fillRect(px - 1.6, iy - 4.5, 3.2, 4);
      b.fillRect(px - 1.6, iy + ih + 0.5, 3.2, 4);
    }
  }

  // Plated through-hole 24k ENIG gold vias with dark drill centers
  for (let v = 0; v < 1750; v++) {
    const vx = rng() * sz;
    const vy = rng() * sz;
    const rad = 2.4 + rng() * 1.9;

    for (const ctx of [c, o]) {
      ctx.fillStyle = "#e6c164";
      ctx.beginPath();
      ctx.arc(vx, vy, rad, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#121618";
      ctx.beginPath();
      ctx.arc(vx, vy, rad * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    r.fillStyle = "#303030";
    r.beginPath();
    r.arc(vx, vy, rad, 0, Math.PI * 2);
    r.fill();

    m.fillStyle = "#f2f2f2";
    m.beginPath();
    m.arc(vx, vy, rad, 0, Math.PI * 2);
    m.fill();
    m.fillStyle = "#080808";
    m.beginPath();
    m.arc(vx, vy, rad * 0.45, 0, Math.PI * 2);
    m.fill();

    b.fillStyle = "#dadada";
    b.beginPath();
    b.arc(vx, vy, rad, 0, Math.PI * 2);
    b.fill();
    b.fillStyle = "#262626";
    b.beginPath();
    b.arc(vx, vy, rad * 0.45, 0, Math.PI * 2);
    b.fill();
  }

  // Crisp silkscreen component designators
  c.fillStyle = o.fillStyle = "rgba(242, 246, 250, 0.82)";
  c.font = o.font = "bold 11px monospace";
  const prefixes = ["U", "R", "C", "L", "Q", "J", "TP", "FB", "Y"];
  for (let lbl = 0; lbl < 140; lbl++) {
    const pr = prefixes[Math.floor(rng() * prefixes.length)];
    const num = 1 + Math.floor(rng() * 99);
    const lx = 20 + rng() * (sz - 60);
    const ly = 20 + rng() * (sz - 30);
    c.fillText(pr + num, lx, ly);
    o.fillText(pr + num, lx, ly);
  }

  return {
    baseCan: cCan,
    overlayCan: oCan,
    map: makeCanvasTex(cCan, true, 1),
    bump: makeCanvasTex(bCan, false, 1),
    normal: heightCanvasToNormalTex(bCan, 2.35, 1),
    rough: makeCanvasTex(rCan, false, 1),
    metal: makeCanvasTex(mCan, false, 1),
  };
}

function buildTintedPcbAlbedo(colInt) {
  jT();
  const sz = xm.baseCan.width;
  const can = document.createElement("canvas");
  can.width = can.height = sz;
  const ctx = can.getContext("2d");
  // Multiply grayscale copper/FR4 relief by the authentic solder-mask color
  ctx.drawImage(xm.baseCan, 0, 0);
  const maskCol = calibrateDielectricColor(colInt, 0.78);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "#" + maskCol.getHexString();
  ctx.fillRect(0, 0, sz, sz);
  // Subtle copper-under-mask highlight lift so traces remain readable even on black motherboards!
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.08;
  ctx.drawImage(xm.baseCan, 0, 0);
  // Stamp untinted 24k ENIG gold pads, vias & crisp white silkscreen on top!
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1.0;
  ctx.drawImage(xm.overlayCan, 0, 0);
  return makeCanvasTex(can, true, 1);
}

// 6. 2048x2048 Photolithographed Silicon Wafer / Die Map (SRAM arrays, ALU carry chains, clock H-tree, bond pads)
function siliconDieMaps() {
  return gn("__tex_silicon_die", () => {
    const sz = 2048;
    const can = document.createElement("canvas");
    const bCan = document.createElement("canvas");
    can.width = can.height = bCan.width = bCan.height = sz;
    const ctx = can.getContext("2d");
    const bCtx = bCan.getContext("2d");
    const rng = seededRng(202586);

    ctx.fillStyle = "#1d2738";
    ctx.fillRect(0, 0, sz, sz);
    bCtx.fillStyle = "#727272";
    bCtx.fillRect(0, 0, sz, sz);

    // Dense SRAM & compute macrocell blocks
    const hues = ["#355278", "#2b6875", "#513f78", "#6b5936", "#29546e", "#3d6b56"];
    for (let by = 56; by < sz - 56; by += 152) {
      for (let bx = 56; bx < sz - 56; bx += 196) {
        const bw = 178;
        const bh = 134;
        ctx.fillStyle = hues[Math.floor(rng() * hues.length)];
        ctx.fillRect(bx + 4, by + 4, bw, bh);
        bCtx.fillStyle = "#a4a4a4";
        bCtx.fillRect(bx + 4, by + 4, bw, bh);

        // Sub-bank bitlines & wordlines
        ctx.strokeStyle = "rgba(185, 232, 255, 0.30)";
        bCtx.strokeStyle = "rgba(205, 205, 205, 0.45)";
        ctx.lineWidth = bCtx.lineWidth = 1.6;
        for (let sx = bx + 12; sx < bx + bw; sx += 10) {
          ctx.beginPath();
          ctx.moveTo(sx, by + 8);
          ctx.lineTo(sx, by + bh);
          ctx.stroke();
          bCtx.beginPath();
          bCtx.moveTo(sx, by + 8);
          bCtx.lineTo(sx, by + bh);
          bCtx.stroke();
        }
        for (let sy = by + 12; sy < by + bh; sy += 12) {
          ctx.beginPath();
          ctx.moveTo(bx + 8, sy);
          ctx.lineTo(bx + bw, sy);
          ctx.stroke();
        }
      }
    }

    // Copper global interconnect bus highways & clock spine
    ctx.strokeStyle = "rgba(232, 182, 104, 0.58)";
    bCtx.strokeStyle = "#d4d4d4";
    ctx.lineWidth = bCtx.lineWidth = 5;
    for (const mid of [sz * 0.25, sz * 0.5, sz * 0.75]) {
      ctx.beginPath();
      ctx.moveTo(44, mid);
      ctx.lineTo(sz - 44, mid);
      ctx.moveTo(mid, 44);
      ctx.lineTo(mid, sz - 44);
      ctx.stroke();
      bCtx.beginPath();
      bCtx.moveTo(44, mid);
      ctx.lineTo(sz - 44, mid);
      bCtx.moveTo(mid, 44);
      bCtx.lineTo(mid, sz - 44);
      bCtx.stroke();
    }

    // Gold perimeter bond-pad ring + lithography alignment crosses
    ctx.fillStyle = "#e8c266";
    bCtx.fillStyle = "#ececec";
    for (let i = 28; i < sz - 28; i += 32) {
      ctx.fillRect(i, 10, 18, 22);
      ctx.fillRect(i, sz - 32, 18, 22);
      ctx.fillRect(10, i, 22, 18);
      ctx.fillRect(sz - 32, i, 22, 18);
      bCtx.fillRect(i, 10, 18, 22);
      bCtx.fillRect(i, sz - 32, 18, 22);
      bCtx.fillRect(10, i, 22, 18);
      bCtx.fillRect(sz - 32, i, 22, 18);
    }

    return {
      map: makeCanvasTex(can, true, 1),
      bump: makeCanvasTex(bCan, false, 1),
      normal: heightCanvasToNormalTex(bCan, 2.0, 1),
    };
  });
}

// 7. 512x512 Staggered Honeycomb Perforated Server / Supercomputer Door Grille Maps
function perfMeshMaps() {
  return gn("__tex_perf_mesh", () => {
    const sz = 512;
    const cCan = document.createElement("canvas");
    const bCan = document.createElement("canvas");
    const rCan = document.createElement("canvas");
    cCan.width = cCan.height = bCan.width = bCan.height = rCan.width = rCan.height = sz;
    const cCtx = cCan.getContext("2d");
    const bCtx = bCan.getContext("2d");
    const rCtx = rCan.getContext("2d");

    cCtx.fillStyle = "#e6ebf2";
    cCtx.fillRect(0, 0, sz, sz);
    bCtx.fillStyle = "#dcdcdc";
    bCtx.fillRect(0, 0, sz, sz);
    rCtx.fillStyle = "#767676";
    rCtx.fillRect(0, 0, sz, sz);

    const stepX = 16;
    const stepY = 16;
    for (let row = 0; row < sz / stepY; row++) {
      const xOff = (row & 1) * (stepX * 0.5);
      const cy = row * stepY + stepY * 0.5;
      for (let col = -1; col <= sz / stepX; col++) {
        const cx = col * stepX + xOff;
        // Bevel rim
        bCtx.fillStyle = "#989898";
        bCtx.beginPath();
        bCtx.arc(cx, cy, 5.4, 0, Math.PI * 2);
        bCtx.fill();
        // Deep dark aperture hole
        cCtx.fillStyle = "#161b24";
        cCtx.beginPath();
        cCtx.arc(cx, cy, 4.4, 0, Math.PI * 2);
        cCtx.fill();
        bCtx.fillStyle = "#181818";
        bCtx.beginPath();
        bCtx.arc(cx, cy, 4.3, 0, Math.PI * 2);
        bCtx.fill();
        rCtx.fillStyle = "#dadada";
        rCtx.beginPath();
        rCtx.arc(cx, cy, 4.3, 0, Math.PI * 2);
        rCtx.fill();
      }
    }
    return {
      map: makeCanvasTex(cCan, true, 4),
      normal: heightCanvasToNormalTex(bCan, 2.4, 4),
      rough: makeCanvasTex(rCan, false, 4),
    };
  });
}

// 8. 512x512 Aerospace / Cryogenic Crinkled Gold Kapton MLI Foil Maps
function cryoGoldMaps() {
  return gn("__tex_cryo_gold", () => {
    const sz = 512;
    const bCan = document.createElement("canvas");
    const rCan = document.createElement("canvas");
    bCan.width = bCan.height = rCan.width = rCan.height = sz;
    const bCtx = bCan.getContext("2d");
    const rCtx = rCan.getContext("2d");
    const rng = seededRng(19690720);

    bCtx.fillStyle = "#808080";
    bCtx.fillRect(0, 0, sz, sz);
    rCtx.fillStyle = "#525252";
    rCtx.fillRect(0, 0, sz, sz);

    // Crinkled faceted Kapton foil polygons + crease ridges
    for (let i = 0; i < 420; i++) {
      const x = rng() * sz;
      const y = rng() * sz;
      const rad = 18 + rng() * 44;
      const shade = Math.floor(72 + rng() * 115);
      const grad = bCtx.createLinearGradient(x - rad, y - rad, x + rad, y + rad);
      grad.addColorStop(0, `rgb(${shade},${shade},${shade})`);
      grad.addColorStop(1, `rgb(${210 - shade},${210 - shade},${210 - shade})`);
      bCtx.fillStyle = grad;
      bCtx.beginPath();
      const sides = 4 + Math.floor(rng() * 3);
      for (let s = 0; s < sides; s++) {
        const ang = (s / sides) * Math.PI * 2 + rng() * 0.5;
        const px = x + Math.cos(ang) * rad;
        const py = y + Math.sin(ang) * rad;
        if (s === 0) bCtx.moveTo(px, py);
        else bCtx.lineTo(px, py);
      }
      bCtx.closePath();
      bCtx.fill();

      const rVal = Math.floor(55 + rng() * 45);
      rCtx.strokeStyle = `rgba(${rVal},${rVal},${rVal},0.55)`;
      rCtx.lineWidth = 1.4;
      rCtx.stroke();
    }
    return {
      normal: heightCanvasToNormalTex(bCan, 1.85, 2),
      rough: makeCanvasTex(rCan, false, 2),
    };
  });
}

// 9. 512x512 Woven Copper Magnet-Wire & Toroidal Ferrite Core / Rope Memory Plane
function corePlaneMaps() {
  return gn("__tex_core_plane", () => {
    const sz = 512;
    const cCan = document.createElement("canvas");
    const bCan = document.createElement("canvas");
    cCan.width = cCan.height = bCan.width = bCan.height = sz;
    const cCtx = cCan.getContext("2d");
    const bCtx = bCan.getContext("2d");

    cCtx.fillStyle = "#18211b";
    cCtx.fillRect(0, 0, sz, sz);
    bCtx.fillStyle = "#484848";
    bCtx.fillRect(0, 0, sz, sz);

    const step = 32;
    // X & Y copper drive wires
    cCtx.strokeStyle = "#cf7c48";
    bCtx.strokeStyle = "#9e9e9e";
    cCtx.lineWidth = bCtx.lineWidth = 3.2;
    for (let p = step / 2; p < sz; p += step) {
      cCtx.beginPath();
      cCtx.moveTo(0, p);
      cCtx.lineTo(sz, p);
      cCtx.moveTo(p, 0);
      cCtx.lineTo(p, sz);
      cCtx.stroke();

      bCtx.beginPath();
      bCtx.moveTo(0, p);
      bCtx.lineTo(sz, p);
      bCtx.moveTo(p, 0);
      bCtx.lineTo(p, sz);
      bCtx.stroke();
    }

    // Diagonal gold/enamel sense wire threading alternating cores!
    cCtx.strokeStyle = "#e5b45b";
    cCtx.lineWidth = 2.0;
    for (let d = -sz; d < sz * 2; d += step * 2) {
      cCtx.beginPath();
      cCtx.moveTo(d, 0);
      cCtx.lineTo(d + sz, sz);
      cCtx.stroke();
    }

    // Sintered manganese-zinc ferrite toroid rings at every X/Y intersection!
    for (let y = step / 2; y < sz; y += step) {
      for (let x = step / 2; x < sz; x += step) {
        cCtx.strokeStyle = "#2b2f36";
        cCtx.lineWidth = 4.6;
        cCtx.beginPath();
        cCtx.arc(x, y, 6.8, 0, Math.PI * 2);
        cCtx.stroke();

        bCtx.strokeStyle = "#ececec";
        bCtx.lineWidth = 4.6;
        bCtx.beginPath();
        bCtx.arc(x, y, 6.8, 0, Math.PI * 2);
        bCtx.stroke();
      }
    }

    return {
      map: makeCanvasTex(cCan, true, 3),
      normal: heightCanvasToNormalTex(bCan, 2.2, 3),
    };
  });
}

var In = (col, rough = 0.55, metal = 0, extra = {}) =>
  new et({
    color: metal > 0.4 ? col : calibrateDielectricColor(col, 0.8),
    roughness: rough,
    metalness: metal,
    ...extra,
  });

var U = {
  _clipPlanes: null,

  plastic: (col, rough = 0.48) =>
    gn("pl_" + col + "_" + rough, () => {
      const gmTex = microGrainMap();
      return new Cn({
        color: calibrateDielectricColor(col, 0.78),
        roughness: rough,
        metalness: 0.0,
        clearcoat: rough < 0.4 ? 0.26 : 0.09,
        clearcoatRoughness: Math.min(0.68, rough * 0.92),
        normalMap: gmTex.userData.normal,
        normalScale: new ye(0.18, 0.18),
      });
    }),

  metal: (col = 0xb8bcc2, rough = 0.35) =>
    gn("mt_" + col + "_" + rough, () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: calibrateDielectricColor(col, 0.84),
        roughness: Math.max(0.24, rough),
        metalness: 0.84,
        envMapIntensity: 0.88,
        normalMap: bm.normal,
        normalScale: new ye(0.22, 0.22),
        roughnessMap: bm.rough,
      });
    }),

  knurl: (col = 0x383e47, rough = 0.36) =>
    gn("knurl_" + col + "_" + rough, () => {
      const km = knurlBumpMap();
      return new Cn({
        color: col,
        roughness: rough,
        metalness: 0.86,
        normalMap: km.userData.normal,
        normalScale: new ye(0.55, 0.55),
      });
    }),

  knurled: (col = 0x383e47, rough = 0.36) => U.knurl(col, rough),

  gold: () =>
    gn("gold", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0xdcad48,
        roughness: 0.22,
        metalness: 0.96,
        normalMap: bm.normal,
        normalScale: new ye(0.14, 0.14),
        clearcoat: 0.16,
        clearcoatRoughness: 0.18,
      });
    }),

  brass: () =>
    gn("brass", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0xc69c46,
        roughness: 0.28,
        metalness: 0.92,
        normalMap: bm.normal,
        normalScale: new ye(0.2, 0.2),
      });
    }),

  copper: () =>
    gn("cu", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0xc97448,
        roughness: 0.26,
        metalness: 0.95,
        normalMap: bm.normal,
        normalScale: new ye(0.2, 0.2),
      });
    }),

  steel: () =>
    gn("steel", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0x8f97a0,
        roughness: 0.34,
        metalness: 0.88,
        normalMap: bm.normal,
        normalScale: new ye(0.26, 0.26),
        roughnessMap: bm.rough,
      });
    }),

  alu: () =>
    gn("alu", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0xbac1c9,
        roughness: 0.34,
        metalness: 0.87,
        normalMap: bm.normal,
        normalScale: new ye(0.25, 0.25),
        roughnessMap: bm.rough,
      });
    }),

  darkAnodized: (col = 0x1a2029) =>
    gn("anod_" + col, () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: col,
        roughness: 0.46,
        metalness: 0.52,
        envMapIntensity: 0.76,
        normalMap: bm.normal,
        normalScale: new ye(0.22, 0.22),
        roughnessMap: bm.rough,
      });
    }),

  pcb: (col = 0x1b5e3a) =>
    gn("pcb_" + col, () => {
      jT();
      const mat = new Cn({
        color: 0xffffff, // Solder-mask hue baked into albedo so 24k gold ENIG pads & white silkscreen stay untinted!
        roughness: 0.52,
        metalness: 1.0, // Driven per-pixel by xm.metal (0.04 on mask, 0.96 on gold pads & vias!)
        map: buildTintedPcbAlbedo(col),
        normalMap: xm.normal,
        normalScale: new ye(0.38, 0.38),
        roughnessMap: xm.rough,
        metalnessMap: xm.metal,
        clearcoat: 0.28,
        clearcoatRoughness: 0.32,
      });
      mat.userData.pcb = true;
      return mat;
    }),

  chip: () =>
    gn("chip", () => {
      const gmTex = microGrainMap();
      return new Cn({
        color: 0x1b1d22,
        roughness: 0.42,
        metalness: 0.08,
        normalMap: gmTex.userData.normal,
        normalScale: new ye(0.24, 0.24),
        clearcoat: 0.12,
        clearcoatRoughness: 0.45,
      });
    }),

  siliconDie: (tint = 0xffffff) =>
    gn("sidie_" + tint, () => {
      const sm = siliconDieMaps();
      return new Cn({
        color: tint,
        map: sm.map,
        normalMap: sm.normal,
        normalScale: new ye(0.32, 0.32),
        roughness: 0.14,
        metalness: 0.76,
        iridescence: 0.94,
        iridescenceIOR: 1.72,
        iridescenceThicknessRange: [150, 620],
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });
    }),

  ceramic: () =>
    gn("cer", () => {
      const gmTex = microGrainMap();
      return new Cn({
        color: 0xcbc3b2,
        roughness: 0.46,
        metalness: 0.02,
        normalMap: gmTex.userData.normal,
        normalScale: new ye(0.22, 0.22),
      });
    }),

  mosCeramic: () =>
    gn("mos_cer", () => {
      const gmTex = microGrainMap();
      return new Cn({
        color: 0x4c2d3b, // Authentic MOS 6502 purple-brown sintered alumina ceramic
        roughness: 0.4,
        metalness: 0.06,
        normalMap: gmTex.userData.normal,
        normalScale: new ye(0.24, 0.24),
        clearcoat: 0.16,
        clearcoatRoughness: 0.4,
      });
    }),

  glass: (col = 0xcfe8ff, opacity = 0.22) =>
    gn(
      "gl_" + col + "_" + opacity,
      () =>
        new Cn({
          color: calibrateDielectricColor(col, 0.9),
          roughness: 0.04,
          metalness: 0.0,
          ior: 1.52,
          reflectivity: 0.92,
          clearcoat: 1.0,
          clearcoatRoughness: 0.03,
          transparent: true,
          opacity: Math.max(0.14, Math.min(0.88, opacity)),
          depthWrite: false,
          side: fi,
        }),
    ),

  wood: () =>
    gn("wood", () => {
      const wm = woodMaps();
      return new Cn({
        color: 0xd8b490,
        map: wm.map,
        normalMap: wm.normal,
        normalScale: new ye(0.36, 0.36),
        roughness: 0.5,
        metalness: 0.0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.32,
      });
    }),

  bakelite: () =>
    gn("bak", () => {
      const gmTex = microGrainMap();
      return new Cn({
        color: 0x2d1812,
        roughness: 0.32,
        metalness: 0.02,
        normalMap: gmTex.userData.normal,
        normalScale: new ye(0.14, 0.14),
        clearcoat: 0.72,
        clearcoatRoughness: 0.16,
      });
    }),

  rubber: () =>
    gn("rub", () => {
      const gmTex = microGrainMap();
      return new et({
        color: 0x16181c,
        roughness: 0.88,
        metalness: 0.0,
        normalMap: gmTex.userData.normal,
        normalScale: new ye(0.32, 0.32),
      });
    }),

  perfMesh: (col = 0x1a2230) =>
    gn("perf_" + col, () => {
      const pm = perfMeshMaps();
      return new Cn({
        color: calibrateDielectricColor(col, 0.84),
        map: pm.map,
        normalMap: pm.normal,
        normalScale: new ye(0.55, 0.55),
        roughnessMap: pm.rough,
        roughness: 0.44,
        metalness: 0.78,
        envMapIntensity: 0.82,
      });
    }),

  cryoGold: () =>
    gn("cryo_gold", () => {
      const cg = cryoGoldMaps();
      return new Cn({
        color: 0xe3b144,
        roughness: 0.24,
        metalness: 0.96,
        normalMap: cg.normal,
        normalScale: new ye(0.46, 0.46),
        roughnessMap: cg.rough,
        clearcoat: 0.28,
        clearcoatRoughness: 0.22,
        envMapIntensity: 0.94,
      });
    }),

  corePlane: () =>
    gn("core_plane", () => {
      const cp = corePlaneMaps();
      return new Cn({
        color: 0xffffff,
        map: cp.map,
        normalMap: cp.normal,
        normalScale: new ye(0.48, 0.48),
        roughness: 0.38,
        metalness: 0.65,
        clearcoat: 0.18,
        clearcoatRoughness: 0.35,
      });
    }),

  glow: (col, intensity = 1) =>
    new et({
      color: new Ae(col).multiplyScalar(0.18),
      emissive: col,
      emissiveIntensity: intensity * 1.15,
      roughness: 0.32,
      metalness: 0.05,
    }),

  led: (col) =>
    new Cn({
      color: new Ae(col).multiplyScalar(0.24),
      emissive: col,
      emissiveIntensity: 0.08,
      roughness: 0.2,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1,
    }),

  screen: (tex) =>
    new xt({
      map: tex,
      toneMapped: false,
    }),
};
