// Ported from computer-evolution-lab v6 js/sim/diedetail.js (same author, MIT).
// Classic script: exposes window.CelDieDetail = { drawDieDetail, drawRealDetail, FLOOR, LAYER_COLORS }.
(function (root) {
  "use strict";
  const LAYER_COLORS = {
    metal: "rgba(128,128,192,0.55)",
    diff: "#FFFF00",
    gnd: "#4DFF4D",
    pwr: "#FF4D4D",
    poly: "#801AC0",
    buried: "#FF00FF",
    via: "#e6e6ff",
  };
  const FLOOR = {
    // [x0, y0, x1, y1] in die fractions, y down
    pla: [0.08, 0.06, 0.92, 0.25],
    ir: [0.08, 0.27, 0.22, 0.35],
    timing: [0.23, 0.27, 0.38, 0.35],
    p: [0.62, 0.27, 0.78, 0.35],
    clk: [0.79, 0.27, 0.92, 0.35],
    rcl: [0.08, 0.37, 0.92, 0.55],
    ab: [0.06, 0.58, 0.15, 0.9],
    y: [0.16, 0.58, 0.23, 0.9],
    x: [0.24, 0.58, 0.31, 0.9],
    s: [0.32, 0.58, 0.4, 0.9],
    alu: [0.41, 0.58, 0.57, 0.9],
    a: [0.58, 0.58, 0.64, 0.9],
    pcl: [0.65, 0.58, 0.73, 0.9],
    pch: [0.74, 0.58, 0.81, 0.9],
    dl: [0.82, 0.58, 0.87, 0.9],
    dor: [0.88, 0.58, 0.94, 0.9],
  };
  const C = LAYER_COLORS;
  // Close-zoom level of detail for the magnified 6502 die. drawDieDetail() paints the die region [u0,u1]×[v0,v1] (die fractions,
  // y down) into a square canvas at transistor scale, on a λ grid (6502: ~3 µm λ, die ≈ 1300 λ wide), using NMOS layout idioms that
  // match each floorplan block: the decode PLA is a programmed grid of poly-over-diffusion gates, the datapath is 8 repeated bit-slice
  // cells under horizontal metal buses, random logic is irregular gates with depletion pull-ups (buried contacts). Colours follow the
  // visual6502 convention. It is a deterministic schematic (the same place always draws the same cells), not the real masks; with the
  // netlist loaded, drawRealDetail() draws the REAL polygons at the same scale instead.
  const L = 1 / 1300; // one λ in die fractions
  const DATAPATH = ["ab", "y", "x", "s", "alu", "a", "pcl", "pch", "dl", "dor"],
    RANDOM = ["rcl", "ir", "timing", "p", "clk"];
  const hash = (a, b, c = 0) => {
    let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  function blockAt(x, y) {
    for (const [k, [x0, y0, x1, y1]] of Object.entries(FLOOR))
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return k;
    return null;
  }
  function drawDieDetail(g, S, u0, v0, u1, v1) {
    const sx = S / (u1 - u0),
      sy = S / (v1 - v0),
      X = (u) => (u - u0) * sx,
      Y = (v) => (v - v0) * sy,
      lam = L * sx;
    g.save();
    g.fillStyle = "#2a2236";
    g.fillRect(0, 0, S, S);
    // substrate grain (field oxide colour variation)
    for (let i = 0; i < 900; i++) {
      const a = hash(i, 7),
        b = hash(i, 9);
      g.fillStyle = `rgba(${(60 + 40 * hash(i, 3)) | 0},${(50 + 30 * hash(i, 4)) | 0},${(80 + 40 * hash(i, 5)) | 0},0.05)`;
      g.fillRect(a * S, b * S, lam * 6, lam * 6);
    }
    const R = (u, v, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(X(u), Y(v), w * sx, h * sy);
    };
    const layers = { diff: [], poly: [], buried: [], cut: [], metal: [] };
    const add = (k, u, v, w, h, col) => layers[k].push([u, v, w, h, col]);
    // ---- PLA: ~130 product-term columns × 26 input rows; a transistor where a poly row crosses a diffusion column (programmed bits)
    {
      const [x0, y0, x1, y1] = FLOOR.pla,
        cols = 130,
        rows = 26,
        pc = (x1 - x0) / cols,
        pr = (y1 - y0) / rows;
      const c0 = Math.max(0, Math.floor((u0 - x0) / pc) - 1),
        c1 = Math.min(cols - 1, Math.ceil((u1 - x0) / pc) + 1),
        r0 = Math.max(0, Math.floor((v0 - y0) / pr) - 1),
        r1 = Math.min(rows - 1, Math.ceil((v1 - y0) / pr) + 1);
      if (c1 >= c0 && r1 >= r0)
        for (let c = c0; c <= c1; c++) {
          const cx = x0 + (c + 0.5) * pc;
          add("diff", cx - 1.6 * L, y0, 3.2 * L, y1 - y0, C.diff);
          if (c % 2 === 0)
            add(
              "metal",
              cx - 2.2 * L,
              y0 - 6 * L,
              4.4 * L,
              y1 - y0 + 12 * L,
              "rgba(150,150,205,0.55)",
            );
          for (let r = r0; r <= r1; r++) {
            const ry = y0 + (r + 0.5) * pr;
            if (c === c0) add("poly", x0, ry - 1 * L, x1 - x0, 2 * L, C.poly);
            if (r % 2 === 0)
              add(
                "diff",
                cx - 1.6 * L,
                ry - 0.5 * pr + 0.4 * L,
                pc * 0.85,
                1.6 * L,
                C.gnd,
              ); // ground strap to the source side
            if (hash(c, r, 1) < 0.34)
              add("poly", cx - 2.6 * L, ry - 1.6 * L, 5.2 * L, 3.2 * L, C.poly); // programmed gate: widened poly over the column
            if ((c + r) % 6 === 0)
              add("cut", cx - 1 * L, ry + 0.3 * pr - 1 * L, 2 * L, 2 * L, null);
          }
        }
    }
    // ---- datapath: 8 bit-slices per register; per slice: storage cell (2 cross-coupled inverters), pass transistors to the buses
    for (const k of DATAPATH) {
      const [x0, y0, x1, y1] = FLOOR[k];
      if (x1 < u0 || x0 > u1 || y1 < v0 || y0 > v1) continue;
      const bh = (y1 - y0) / 8,
        w = x1 - x0;
      for (let b = 0; b < 8; b++) {
        const yb = y0 + b * bh;
        for (let i = 0; i < 3; i++) {
          const yy = yb + (0.12 + i * 0.12) * bh;
          add("metal", x0 - 2 * L, yy, w + 4 * L, 3.4 * L, "rgba(150,150,205,0.55)");
        } // DB / SB / ADL buses
        add("metal", x0, yb + 0.86 * bh, w, 4 * L, "rgba(150,150,205,0.6)"); // GND rail
        add("metal", x0, yb + 0.02 * bh, w, 3 * L, "rgba(170,150,150,0.6)"); // VCC rail
        const nc = Math.max(2, Math.round(w / (14 * L)));
        for (let c = 0; c < nc; c++) {
          const cx = x0 + ((c + 0.5) * w) / nc,
            hc = hash(DATAPATH.indexOf(k), b, c);
          add("diff", cx - 3 * L, yb + 0.48 * bh, 6 * L, 0.32 * bh, C.diff);
          add("diff", cx - 3 * L, yb + 0.8 * bh, 6 * L, 2.5 * L, C.gnd);
          add("poly", cx - 5 * L, yb + 0.6 * bh, 10 * L, 2 * L, C.poly); // inverter gate
          add("buried", cx + 1 * L, yb + 0.43 * bh, 3 * L, 3 * L, C.buried);
          add("poly", cx + 1.5 * L, yb + 0.1 * bh, 2 * L, 0.36 * bh, C.poly); // depletion pull-up
          add(
            "cut",
            cx - 1 * L,
            yb + (0.12 + (c % 3) * 0.12) * bh + 0.5 * L,
            2.2 * L,
            2.2 * L,
            null,
          ); // bus contact
          if (hc < 0.6) add("diff", cx + 3 * L, yb + 0.25 * bh, 4 * L, 0.22 * bh, C.diff);
        }
        for (let c = 0; c < 4; c++)
          add("poly", x0 + ((c + 0.5) * w) / 4 - 1 * L, yb, 2 * L, bh, C.poly);
      }
    } // control lines from the random logic, through every bit
    // ---- random control logic: irregular gates (series/parallel transistors), pull-ups, metal straps
    const g0 = Math.floor(u0 / (16 * L)) - 1,
      g1 = Math.ceil(u1 / (16 * L)) + 1,
      h0 = Math.floor(v0 / (16 * L)) - 1,
      h1 = Math.ceil(v1 / (16 * L)) + 1;
    for (let i = g0; i <= g1; i++)
      for (let j = h0; j <= h1; j++) {
        const cu = (i + 0.5) * 16 * L,
          cv = (j + 0.5) * 16 * L,
          k = blockAt(cu, cv);
        if (!RANDOM.includes(k)) continue;
        const r = (n) => hash(i, j, n),
          n = 1 + ((r(1) * 3) | 0),
          vert = r(2) < 0.5,
          col = r(3) < 0.75 ? C.diff : r(3) < 0.9 ? C.gnd : C.pwr;
        if (vert) add("diff", cu - 2 * L, cv - 7 * L, 4 * L, 14 * L, col);
        else add("diff", cu - 7 * L, cv - 2 * L, 14 * L, 4 * L, col);
        for (let t = 0; t < n; t++) {
          const o = (t - (n - 1) / 2) * 4.5 * L;
          if (vert)
            add(
              "poly",
              cu - 4 * L,
              cv + o - 1 * L,
              8 * L + r(10 + t) * 6 * L,
              2 * L,
              C.poly,
            );
          else
            add(
              "poly",
              cu + o - 1 * L,
              cv - 4 * L,
              2 * L,
              8 * L + r(10 + t) * 6 * L,
              C.poly,
            );
        }
        if (r(4) < 0.5) {
          add("buried", cu + 2 * L, cv + 2 * L, 3 * L, 3 * L, C.buried);
          add("poly", cu + 3 * L, cv + 3 * L, 2 * L, 6 * L + r(5) * 8 * L, C.poly);
        }
        if (r(6) < 0.55)
          add(
            "cut",
            cu - 1.1 * L + (vert ? 0 : 5 * L),
            cv - 1.1 * L + (vert ? 5 * L : 0),
            2.2 * L,
            2.2 * L,
            null,
          );
        if (r(7) < 0.35)
          add(
            "metal",
            cu - 8 * L,
            cv + 5 * L,
            16 * L + r(8) * 30 * L,
            3.4 * L,
            "rgba(150,150,205,0.5)",
          );
        if (r(9) < 0.2)
          add(
            "metal",
            cu + 5 * L,
            cv - 8 * L,
            3.4 * L,
            16 * L + r(11) * 30 * L,
            "rgba(150,150,205,0.5)",
          );
      }
    // ---- power ring and bond pads around the edge
    for (const [u, v, w, h] of [
      [0.035, 0.035, 0.93, 0.012],
      [0.035, 0.953, 0.93, 0.012],
      [0.035, 0.035, 0.012, 0.93],
      [0.953, 0.035, 0.012, 0.93],
    ])
      add("metal", u, v, w, h, "rgba(150,150,205,0.6)");
    for (let i = 0; i < 40; i++) {
      const side = Math.floor(i / 10),
        k = i % 10,
        t = 0.08 + k * 0.088,
        [pu, pv] =
          side === 0
            ? [t, 0.015]
            : side === 1
              ? [0.985, t]
              : side === 2
                ? [1 - t, 0.985]
                : [0.015, 1 - t];
      add("metal", pu - 0.011, pv - 0.011, 0.022, 0.022, "rgba(175,175,215,0.85)");
      add("metal", pu - 0.008, pv - 0.008, 0.016, 0.016, "rgba(215,215,235,0.9)");
    }
    // paint in fabrication order; gate overlaps darken (poly over diffusion = a transistor channel)
    for (const k of ["diff", "buried", "poly", "cut", "metal"])
      for (const [u, v, w, h, col] of layers[k]) {
        if (u + w < u0 || u > u1 || v + h < v0 || v > v1) continue;
        if (k === "cut") {
          R(u, v, w, h, "#0b0b10");
          g.strokeStyle = "#e6e6ff";
          g.lineWidth = Math.max(1, 0.35 * lam);
          g.beginPath();
          g.moveTo(X(u), Y(v));
          g.lineTo(X(u + w), Y(v + h));
          g.moveTo(X(u + w), Y(v));
          g.lineTo(X(u), Y(v + h));
          g.stroke();
          g.strokeRect(X(u), Y(v), w * sx, h * sy);
          continue;
        }
        R(u, v, w, h, col);
        if (k === "poly" && lam > 3) {
          g.strokeStyle = "rgba(40,0,70,0.55)";
          g.lineWidth = Math.max(1, 0.25 * lam);
          g.strokeRect(X(u), Y(v), w * sx, h * sy);
        }
        if (k === "metal" && lam > 3) {
          g.strokeStyle = "rgba(230,230,255,0.35)";
          g.lineWidth = Math.max(1, 0.2 * lam);
          g.strokeRect(X(u), Y(v), w * sx, h * sy);
        }
      }
    // scale bar (shows the real size: 1 die fraction = 3.9 mm)
    const um = 10 / 3900,
      bar = um * 10 * sx;
    if (bar > 20 && bar < S * 0.5) {
      g.fillStyle = "#fff";
      g.fillRect(S * 0.05, S * 0.94, bar, Math.max(2, S * 0.004));
      g.font = `${(S * 0.022) | 0}px ui-monospace,monospace`;
      g.fillText("100 µm", S * 0.05, S * 0.93);
    } else if (um * sx > 20) {
      g.fillStyle = "#fff";
      g.fillRect(S * 0.05, S * 0.94, um * sx, Math.max(2, S * 0.004));
      g.font = `${(S * 0.022) | 0}px ui-monospace,monospace`;
      g.fillText("10 µm", S * 0.05, S * 0.93);
    }
    g.restore();
  }
  // real masks (visual6502 segdefs) drawn at patch scale: the same transform as drawReal(), but only the polygons in view
  const REAL_COL = [
    "rgba(128,128,192,0.45)",
    "#FFFF00",
    "#FF00FF",
    "#4DFF4D",
    "#FF4D4D",
    "#801AC0",
  ];
  function drawRealDetail(g, S, u0, v0, u1, v1, segdefs, state) {
    const sx = S / (u1 - u0),
      sy = S / (v1 - v0),
      ox = 400;
    g.fillStyle = "#000";
    g.fillRect(0, 0, S, S);
    const U = (x) => ((x + ox) / 10000 - u0) * sx,
      V = (y) => ((10000 - y) / 10000 - v0) * sy;
    for (const Lr of [1, 2, 3, 4, 5, 0]) {
      g.fillStyle = REAL_COL[Lr];
      g.beginPath();
      let any = false;
      for (const s of segdefs) {
        if (s[2] !== Lr) continue;
        const x = U(s[3]),
          y = V(s[4]);
        if (x < -S || x > 2 * S || y < -S || y > 2 * S) continue;
        any = true;
        g.moveTo(x, y);
        for (let i = 5; i < s.length; i += 2) g.lineTo(U(s[i]), V(s[i + 1]));
        g.closePath();
      }
      if (any) g.fill();
    }
    if (state) {
      g.fillStyle = "rgba(255,255,255,0.5)";
      g.beginPath();
      for (const s of segdefs) {
        if (!state[s[0]] || s[2] === 0) continue;
        const x = U(s[3]),
          y = V(s[4]);
        if (x < -S || x > 2 * S || y < -S || y > 2 * S) continue;
        g.moveTo(x, y);
        for (let i = 5; i < s.length; i += 2) g.lineTo(U(s[i]), V(s[i + 1]));
        g.closePath();
      }
      g.fill();
    }
  }

  root.CelDieDetail = { drawDieDetail, drawRealDetail, FLOOR, LAYER_COLORS };
})(typeof window !== "undefined" ? window : globalThis);
