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

// 1. Brushed Anodized / Machined Metal Bump & Roughness Maps
function brushedMetalMaps() {
  return gn("__tex_brushed", () => {
    const sz = 512;
    const bCan = document.createElement("canvas");
    const rCan = document.createElement("canvas");
    bCan.width = bCan.height = rCan.width = rCan.height = sz;
    const bCtx = bCan.getContext("2d");
    const rCtx = rCan.getContext("2d");
    const rng = seededRng(90210);

    bCtx.fillStyle = "#808080";
    bCtx.fillRect(0, 0, sz, sz);
    rCtx.fillStyle = "#969696";
    rCtx.fillRect(0, 0, sz, sz);

    for (let y = 0; y < sz; y++) {
      const base = 116 + Math.floor((rng() - 0.5) * 26);
      bCtx.fillStyle = `rgb(${base},${base},${base})`;
      bCtx.fillRect(0, y, sz, 1);

      const rBase = 138 + Math.floor((rng() - 0.5) * 32);
      rCtx.fillStyle = `rgb(${rBase},${rBase},${rBase})`;
      rCtx.fillRect(0, y, sz, 1);
    }

    for (let i = 0; i < 1800; i++) {
      const x = rng() * sz;
      const y = rng() * sz;
      const len = 30 + rng() * 180;
      const v = rng() < 0.5 ? 165 : 92;
      bCtx.strokeStyle = `rgba(${v},${v},${v},0.26)`;
      bCtx.lineWidth = 0.7 + rng() * 0.9;
      bCtx.beginPath();
      bCtx.moveTo(x, y);
      bCtx.lineTo(x + len, y + (rng() - 0.5) * 0.6);
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
      rough: makeCanvasTex(rCan, false, 3),
    };
  });
}

// 2. Fine EDM Molded Polymer / Ceramic Micro-Grain Bump
function microGrainMap() {
  return gn("__tex_grain", () => {
    const sz = 256;
    const can = document.createElement("canvas");
    can.width = can.height = sz;
    const ctx = can.getContext("2d");
    const img = ctx.createImageData(sz, sz);
    const d = img.data;
    const rng = seededRng(424242);
    for (let i = 0; i < d.length; i += 4) {
      const v = 114 + Math.floor(rng() * 28);
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return makeCanvasTex(can, false, 6);
  });
}

// 3. Diamond-Knurled Machined Metal Bump Map
function knurlBumpMap() {
  return gn("__tex_knurl", () => {
    const sz = 256;
    const can = document.createElement("canvas");
    can.width = can.height = sz;
    const ctx = can.getContext("2d");
    ctx.fillStyle = "#686868";
    ctx.fillRect(0, 0, sz, sz);
    ctx.strokeStyle = "rgba(235,235,235,0.65)";
    ctx.lineWidth = 2.2;
    const step = 16;
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
    return makeCanvasTex(can, false, 4);
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
    };
  });
}

// 5. High-Resolution Multi-Layer FR-4 PCB (Traces, Buses, Serpentine Delay Lines, ENIG Pads, Vias, Silkscreen)
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
  cCan.width = cCan.height = bCan.width = bCan.height = rCan.width = rCan.height = sz;

  const c = cCan.getContext("2d");
  const b = bCan.getContext("2d");
  const r = rCan.getContext("2d");
  const rng = seededRng(19756502);

  // Base neutral greyscale (tinted by material.color!) with FR-4 woven fiberglass texture
  c.fillStyle = "#98a09c";
  c.fillRect(0, 0, sz, sz);
  b.fillStyle = "#767676";
  b.fillRect(0, 0, sz, sz);
  r.fillStyle = "#949494"; // medium matte solder mask
  r.fillRect(0, 0, sz, sz);

  // Subtle FR-4 glass cloth cross-weave
  c.strokeStyle = "rgba(255,255,255,0.035)";
  b.strokeStyle = "rgba(145,145,145,0.18)";
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
  for (let ic = 0; ic < 75; ic++) {
    const ix = 40 + rng() * (sz - 140);
    const iy = 40 + rng() * (sz - 140);
    const iw = 26 + Math.floor(rng() * 48);
    const ih = 18 + Math.floor(rng() * 38);

    // White silkscreen outline + pin-1 dot
    c.strokeStyle = "rgba(236, 240, 242, 0.78)";
    c.lineWidth = 1.8;
    c.strokeRect(ix, iy, iw, ih);
    c.fillStyle = "rgba(236, 240, 242, 0.8)";
    c.beginPath();
    c.arc(ix + 5, iy + 5, 2.2, 0, Math.PI * 2);
    c.fill();

    // Gold ENIG SMD pads along two sides
    const pads = Math.max(4, Math.floor(iw / 6));
    for (let p = 0; p < pads; p++) {
      const px = ix + 3 + (p * (iw - 6)) / Math.max(1, pads - 1);
      c.fillStyle = "#e5c878";
      c.fillRect(px - 1.6, iy - 4.5, 3.2, 4);
      c.fillRect(px - 1.6, iy + ih + 0.5, 3.2, 4);

      r.fillStyle = "#343434"; // shiny gold pad!
      r.fillRect(px - 1.6, iy - 4.5, 3.2, 4);
      r.fillRect(px - 1.6, iy + ih + 0.5, 3.2, 4);

      b.fillStyle = "#d0d0d0";
      b.fillRect(px - 1.6, iy - 4.5, 3.2, 4);
      b.fillRect(px - 1.6, iy + ih + 0.5, 3.2, 4);
    }
  }

  // Plated through-hole gold/copper vias with dark drill centers
  for (let v = 0; v < 1600; v++) {
    const vx = rng() * sz;
    const vy = rng() * sz;
    const rad = 2.4 + rng() * 1.8;

    c.fillStyle = "#dfc373";
    c.beginPath();
    c.arc(vx, vy, rad, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#1b2220";
    c.beginPath();
    c.arc(vx, vy, rad * 0.46, 0, Math.PI * 2);
    c.fill();

    r.fillStyle = "#383838";
    r.beginPath();
    r.arc(vx, vy, rad, 0, Math.PI * 2);
    r.fill();

    b.fillStyle = "#d2d2d2";
    b.beginPath();
    b.arc(vx, vy, rad, 0, Math.PI * 2);
    b.fill();
    b.fillStyle = "#303030";
    b.beginPath();
    b.arc(vx, vy, rad * 0.45, 0, Math.PI * 2);
    b.fill();
  }

  // Crisp silkscreen component designators
  c.fillStyle = "rgba(235, 240, 242, 0.72)";
  c.font = "bold 11px monospace";
  const prefixes = ["U", "R", "C", "L", "Q", "J", "TP"];
  for (let lbl = 0; lbl < 110; lbl++) {
    const pr = prefixes[Math.floor(rng() * prefixes.length)];
    const num = 1 + Math.floor(rng() * 99);
    c.fillText(pr + num, 20 + rng() * (sz - 60), 20 + rng() * (sz - 30));
  }

  return {
    map: makeCanvasTex(cCan, true, 1),
    bump: makeCanvasTex(bCan, false, 1),
    rough: makeCanvasTex(rCan, false, 1),
  };
}

// 6. Photolithographed Silicon Wafer / Die Map (SRAM arrays, logic blocks, interconnect lanes)
function siliconDieMaps() {
  return gn("__tex_silicon_die", () => {
    const sz = 512;
    const can = document.createElement("canvas");
    const bCan = document.createElement("canvas");
    can.width = can.height = bCan.width = bCan.height = sz;
    const ctx = can.getContext("2d");
    const bCtx = bCan.getContext("2d");
    const rng = seededRng(202586);

    ctx.fillStyle = "#263042";
    ctx.fillRect(0, 0, sz, sz);
    bCtx.fillStyle = "#787878";
    bCtx.fillRect(0, 0, sz, sz);

    // Dense SRAM & compute macrocell blocks
    const hues = ["#3a5170", "#2f626e", "#4b3f6e", "#5d5238", "#2d4c63"];
    for (let by = 16; by < sz - 16; by += 48) {
      for (let bx = 16; bx < sz - 16; bx += 64) {
        ctx.fillStyle = hues[Math.floor(rng() * hues.length)];
        ctx.fillRect(bx + 2, by + 2, 58, 42);
        bCtx.fillStyle = "#9c9c9c";
        bCtx.fillRect(bx + 2, by + 2, 58, 42);

        // Micro-array sub-banks
        ctx.strokeStyle = "rgba(180, 225, 255, 0.25)";
        ctx.lineWidth = 1;
        for (let sx = bx + 6; sx < bx + 58; sx += 6) {
          ctx.beginPath();
          ctx.moveTo(sx, by + 4);
          ctx.lineTo(sx, by + 42);
          ctx.stroke();
        }
        for (let sy = by + 6; sy < by + 42; sy += 6) {
          ctx.beginPath();
          ctx.moveTo(bx + 4, sy);
          ctx.lineTo(bx + 58, sy);
          ctx.stroke();
        }
      }
    }

    // Gold perimeter bond-pad ring
    ctx.fillStyle = "#d9b45b";
    for (let i = 8; i < sz - 8; i += 10) {
      ctx.fillRect(i, 3, 5, 6);
      ctx.fillRect(i, sz - 9, 5, 6);
      ctx.fillRect(3, i, 6, 5);
      ctx.fillRect(sz - 9, i, 6, 5);
    }

    return {
      map: makeCanvasTex(can, true, 1),
      bump: makeCanvasTex(bCan, false, 1),
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
    gn(
      "pl_" + col + "_" + rough,
      () =>
        new Cn({
          color: calibrateDielectricColor(col, 0.79),
          roughness: rough,
          metalness: 0.0,
          clearcoat: rough < 0.4 ? 0.28 : 0.1,
          clearcoatRoughness: Math.min(0.65, rough * 0.9),
          bumpMap: microGrainMap(),
          bumpScale: 0.0014,
        }),
    ),

  metal: (col = 0xb8bcc2, rough = 0.32) =>
    gn("mt_" + col + "_" + rough, () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: calibrateDielectricColor(col, 0.88),
        roughness: rough,
        metalness: 0.88,
        bumpMap: bm.bump,
        bumpScale: 0.0022,
        roughnessMap: bm.rough,
        clearcoat: 0.08,
        clearcoatRoughness: 0.35,
      });
    }),

  knurl: (col = 0x383e47, rough = 0.36) =>
    gn(
      "knurl_" + col + "_" + rough,
      () =>
        new et({
          color: col,
          roughness: rough,
          metalness: 0.86,
          bumpMap: knurlBumpMap(),
          bumpScale: 0.006,
        }),
    ),

  knurled: (col = 0x383e47, rough = 0.36) => U.knurl(col, rough),

  gold: () =>
    gn("gold", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0xd8ad48,
        roughness: 0.22,
        metalness: 0.96,
        bumpMap: bm.bump,
        bumpScale: 0.001,
        clearcoat: 0.15,
        clearcoatRoughness: 0.18,
      });
    }),

  brass: () =>
    gn("brass", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0xc59b45,
        roughness: 0.28,
        metalness: 0.92,
        bumpMap: bm.bump,
        bumpScale: 0.0018,
      });
    }),

  copper: () =>
    gn("cu", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0xc87347,
        roughness: 0.25,
        metalness: 0.95,
        bumpMap: bm.bump,
        bumpScale: 0.0016,
      });
    }),

  steel: () =>
    gn("steel", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0x8f969e,
        roughness: 0.32,
        metalness: 0.88,
        bumpMap: bm.bump,
        bumpScale: 0.0024,
        roughnessMap: bm.rough,
      });
    }),

  alu: () =>
    gn("alu", () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: 0xc2c8cf,
        roughness: 0.28,
        metalness: 0.88,
        bumpMap: bm.bump,
        bumpScale: 0.002,
        roughnessMap: bm.rough,
      });
    }),

  darkAnodized: (col = 0x1a2029) =>
    gn("anod_" + col, () => {
      const bm = brushedMetalMaps();
      return new Cn({
        color: col,
        roughness: 0.34,
        metalness: 0.78,
        bumpMap: bm.bump,
        bumpScale: 0.0022,
        roughnessMap: bm.rough,
        clearcoat: 0.14,
        clearcoatRoughness: 0.38,
      });
    }),

  pcb: (col = 0x1b5e3a) =>
    gn("pcb_" + col, () => {
      jT();
      const mat = new Cn({
        color: col,
        roughness: 0.46,
        metalness: 0.14,
        map: xm.map,
        bumpMap: xm.bump,
        bumpScale: 0.0032,
        roughnessMap: xm.rough,
        clearcoat: 0.24,
        clearcoatRoughness: 0.36,
      });
      mat.userData.pcb = true;
      return mat;
    }),

  chip: () =>
    gn(
      "chip",
      () =>
        new Cn({
          color: 0x1c1e22,
          roughness: 0.42,
          metalness: 0.08,
          bumpMap: microGrainMap(),
          bumpScale: 0.0022,
          clearcoat: 0.12,
          clearcoatRoughness: 0.45,
        }),
    ),

  siliconDie: (tint = 0xffffff) =>
    gn("sidie_" + tint, () => {
      const sm = siliconDieMaps();
      return new Cn({
        color: tint,
        map: sm.map,
        bumpMap: sm.bump,
        bumpScale: 0.0018,
        roughness: 0.14,
        metalness: 0.72,
        iridescence: 0.92,
        iridescenceIOR: 1.55,
        iridescenceThicknessRange: [180, 540],
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
      });
    }),

  ceramic: () =>
    gn(
      "cer",
      () =>
        new Cn({
          color: 0xcbc3b2,
          roughness: 0.46,
          metalness: 0.02,
          bumpMap: microGrainMap(),
          bumpScale: 0.0025,
        }),
    ),

  mosCeramic: () =>
    gn(
      "mos_cer",
      () =>
        new Cn({
          color: 0x4c2d3b, // Authentic MOS 6502 purple-brown sintered alumina ceramic
          roughness: 0.4,
          metalness: 0.06,
          bumpMap: microGrainMap(),
          bumpScale: 0.0026,
          clearcoat: 0.14,
          clearcoatRoughness: 0.42,
        }),
    ),

  glass: (col = 0xcfe8ff, opacity = 0.22) =>
    gn(
      "gl_" + col + "_" + opacity,
      () =>
        new Cn({
          color: calibrateDielectricColor(col, 0.9),
          roughness: 0.05,
          metalness: 0.0,
          ior: 1.5,
          reflectivity: 0.9,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
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
        bumpMap: wm.bump,
        bumpScale: 0.0045,
        roughness: 0.52,
        metalness: 0.0,
        clearcoat: 0.28,
        clearcoatRoughness: 0.34,
      });
    }),

  bakelite: () =>
    gn(
      "bak",
      () =>
        new Cn({
          color: 0x2d1812,
          roughness: 0.34,
          metalness: 0.02,
          bumpMap: microGrainMap(),
          bumpScale: 0.0015,
          clearcoat: 0.68,
          clearcoatRoughness: 0.18,
        }),
    ),

  rubber: () =>
    gn(
      "rub",
      () =>
        new et({
          color: 0x16181c,
          roughness: 0.88,
          metalness: 0.0,
          bumpMap: microGrainMap(),
          bumpScale: 0.003,
        }),
    ),

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
