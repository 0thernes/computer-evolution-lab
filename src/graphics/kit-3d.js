// Precision 3D Hardware Builder Kit: Chamfered RoundedBoxes, SMD Populator, & Macro Sub-Assemblies

var _chamferCache = new Map();

// Smoothly beveled RoundedBox BufferGeometry with clean planar UVs (so PCB & wood maps never distort)
function chamferBox(w, h, d, radius, segs = 3) {
  const minDim = Math.min(w, h, d);
  const r =
    radius !== undefined
      ? Math.min(radius, minDim * 0.45)
      : Math.min(0.016, Math.max(0.0006, minDim * 0.085));
  const key = `${w.toFixed(4)}_${h.toFixed(4)}_${d.toFixed(4)}_${r.toFixed(4)}_${segs}`;
  if (_chamferCache.has(key)) return _chamferCache.get(key);

  // Start from subdivided BoxGeometry and spherically relax corners outside inner core box
  const s = Math.max(2, segs * 2 + 1);
  const geo = new te(w, h, d, s, s, s);
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const uv = geo.attributes.uv;

  const hx = Math.max(0, w * 0.5 - r);
  const hy = Math.max(0, h * 0.5 - r);
  const hz = Math.max(0, d * 0.5 - r);
  const v = new N();
  const c = new N();
  const n = new N();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Remap grid positions to concentrate vertices near the edges for crisp bevels
    const mapAxis = (val, half, inner) => {
      if (half <= 1e-6) return 0;
      const u = val / half; // -1..1
      const au = Math.abs(u);
      const sgn = u < 0 ? -1 : 1;
      if (r <= 1e-6) return val;
      if (au < 0.55) {
        return sgn * (au / 0.55) * inner;
      }
      const t = (au - 0.55) / 0.45;
      return sgn * (inner + t * r);
    };
    const rx = mapAxis(v.x, w * 0.5, hx);
    const ry = mapAxis(v.y, h * 0.5, hy);
    const rz = mapAxis(v.z, d * 0.5, hz);

    c.set(
      Math.max(-hx, Math.min(hx, rx)),
      Math.max(-hy, Math.min(hy, ry)),
      Math.max(-hz, Math.min(hz, rz)),
    );
    n.set(rx - c.x, ry - c.y, rz - c.z);
    const len = n.length();
    if (len > 1e-6 && r > 1e-6) {
      n.divideScalar(len);
      pos.setXYZ(i, c.x + n.x * r, c.y + n.y * r, c.z + n.z * r);
      nrm.setXYZ(i, n.x, n.y, n.z);
    } else {
      pos.setXYZ(i, rx, ry, rz);
    }

    // Box-planar UVs proportional to world scale for crisp textures
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const fnx = Math.abs(nrm.getX(i));
    const fny = Math.abs(nrm.getY(i));
    const fnz = Math.abs(nrm.getZ(i));
    if (fny >= fnx && fny >= fnz) {
      uv.setXY(i, px / Math.max(0.05, w) + 0.5, pz / Math.max(0.05, d) + 0.5);
    } else if (fnx >= fnz) {
      uv.setXY(i, pz / Math.max(0.05, d) + 0.5, py / Math.max(0.05, h) + 0.5);
    } else {
      uv.setXY(i, px / Math.max(0.05, w) + 0.5, py / Math.max(0.05, h) + 0.5);
    }
  }

  geo.computeTangents();
  const tan = geo.attributes.tangent;
  if (tan) {
    for (let i = 0; i < tan.count; i++) {
      const tx = tan.getX(i),
        ty = tan.getY(i),
        tz = tan.getZ(i);
      if (
        !Number.isFinite(tx) ||
        !Number.isFinite(ty) ||
        !Number.isFinite(tz) ||
        tx * tx + ty * ty + tz * tz < 1e-6
      ) {
        const nx = nrm.getX(i),
          ny = nrm.getY(i),
          nz = nrm.getZ(i);
        // Orthonormal fallback tangent perpendicular to vertex normal
        if (Math.abs(ny) < 0.9) {
          const inv = 1 / Math.hypot(nz, nx);
          tan.setXYZW(i, nz * inv, 0, -nx * inv, 1);
        } else {
          tan.setXYZW(i, 1, 0, 0, 1);
        }
      }
    }
  }
  geo.parameters = { width: w, height: h, depth: d };
  geo.userData.boxDims = [w, h, d];
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  if (_chamferCache.size < 900) _chamferCache.set(key, geo);
  return geo;
}

// Automatic high-detail SMD & Polymer Capacitor PCB Populator
function Dy(pcbMesh, seed = 1) {
  const geo = pcbMesh.geometry;
  if (!geo || pcbMesh.userData.populated) return 0;
  const p = geo.parameters;
  if (!p || p.width === undefined || p.height === undefined || p.depth === undefined) {
    return 0;
  }
  const dims = [p.width, p.height, p.depth];
  const thinAxis = dims.indexOf(Math.min(...dims));
  const [axA, axB] = [0, 1, 2].filter((k) => k !== thinAxis);
  const lenA = dims[axA];
  const lenB = dims[axB];
  const thick = dims[thinAxis];
  if (lenA * lenB < 0.004 || thick > 0.055) return 0;
  pcbMesh.userData.populated = true;

  let s = (seed * 9301 + 49297) % 233280 || 7;
  const rng = () => (s = (s * 16807) % 2147483647) / 2147483647;

  const count = Math.min(320, Math.floor(lenA * lenB * 2900));
  const col = new Ae();
  const dummy = new je();

  // Body instances (SMD resistors, MLCC tan caps, SOT-23/QFN micro-packages, ferrite inductors)
  const smdGeo = chamferBox(1, 1, 1, 0.12, 1);
  const smdMat = new Cn({
    roughness: 0.38,
    metalness: 0.25,
    clearcoat: 0.15,
  });
  const smdInst = new ut(smdGeo, smdMat, count);
  // Solder end-cap terminations for realistic SMD look on close zoom
  const capInst = new ut(new te(1.06, 0.96, 0.96), U.metal(0xd8dde4, 0.22), count);

  const palette = [
    0x181a1e, // Precision black resistor / QFN
    0x1d2026,
    0x9b7648, // X7R MLCC ceramic capacitor (tan)
    0xb58b57, // C0G MLCC capacitor
    0x2c3540, // Ferrite power inductor
    0x1f4d3a, // Sense resistor
    0xc9b896, // High-Q RF capacitor
  ];

  for (let idx = 0; idx < count; idx++) {
    const pos = [0, 0, 0];
    const scl = [0, 0, 0];
    pos[axA] = (rng() - 0.5) * lenA * 0.92;
    pos[axB] = (rng() - 0.5) * lenB * 0.92;
    const isIC = rng() < 0.11;
    pos[thinAxis] = thick * 0.5 + (isIC ? 0.0028 : 0.0014);
    scl[axA] = isIC ? 0.013 : 0.0042 + rng() * 0.0034;
    scl[axB] = isIC ? 0.0095 : 0.0022 + rng() * 0.002;
    scl[thinAxis] = isIC ? 0.0052 : 0.0026;
    const rotSwap = rng() < 0.5;
    if (rotSwap) [scl[axA], scl[axB]] = [scl[axB], scl[axA]];

    dummy.position.set(...pos);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(...scl);
    dummy.updateMatrix();
    smdInst.setMatrixAt(idx, dummy.matrix);
    smdInst.setColorAt(
      idx,
      col.set(isIC ? 0x17191d : palette[Math.floor(rng() * palette.length)]),
    );

    // Metallic solder terminals at ends of 2-terminal passives
    const capScl = [...scl];
    capScl[axA] *= isIC ? 0.82 : 1.18;
    capScl[axB] *= isIC ? 0.82 : 0.88;
    capScl[thinAxis] *= 0.78;
    dummy.scale.set(...capScl);
    dummy.updateMatrix();
    capInst.setMatrixAt(idx, dummy.matrix);
  }
  smdInst.castShadow = false;
  smdInst.receiveShadow = true;
  capInst.castShadow = false;
  pcbMesh.add(smdInst, capInst);

  // Solid aluminum polymer / electrolytic capacitors with silver top cans
  const nCaps = Math.min(10, Math.floor(lenA * lenB * 46));
  if (nCaps > 0 && thinAxis === 1) {
    const bodyInst = new ut(
      new ke(1, 1, 1, 24),
      new Cn({ color: 0x1b2b44, roughness: 0.3, metalness: 0.45, clearcoat: 0.4 }),
      nCaps,
    );
    const topInst = new ut(new ke(0.94, 0.94, 0.08, 24), U.alu(), nCaps);
    for (let k = 0; k < nCaps; k++) {
      const rad = 0.0075 + rng() * 0.0055;
      const ht = 0.018 + rng() * 0.018;
      const cx = (-0.5 + 0.06 + (k / Math.max(1, nCaps - 1)) * 0.88) * lenA;
      const cz = (rng() < 0.5 ? -1 : 1) * lenB * 0.42;
      const cy = thick * 0.5 + ht * 0.5;
      dummy.position.set(cx, cy, cz);
      dummy.scale.set(rad, ht, rad);
      dummy.updateMatrix();
      bodyInst.setMatrixAt(k, dummy.matrix);

      dummy.position.set(cx, thick * 0.5 + ht + 0.0005, cz);
      dummy.scale.set(rad, 0.012, rad);
      dummy.updateMatrix();
      topInst.setMatrixAt(k, dummy.matrix);
    }
    bodyInst.castShadow = true;
    pcbMesh.add(bodyInst, topInst);
  }

  // Shielded ferrite VRM power inductors + HC-49 brushed quartz crystal oscillator can on larger horizontal PCBs
  const nVrm = Math.min(6, Math.floor(lenA * lenB * 18));
  if (nVrm >= 2 && thinAxis === 1) {
    const vrmInst = new ut(chamferBox(1, 1, 1, 0.08, 1), U.darkAnodized(0x232932), nVrm);
    for (let v = 0; v < nVrm; v++) {
      const vx = (-0.36 + (v / Math.max(1, nVrm - 1)) * 0.72) * lenA;
      const vz = lenB * 0.33;
      dummy.position.set(vx, thick * 0.5 + 0.0055, vz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.015, 0.011, 0.015);
      dummy.updateMatrix();
      vrmInst.setMatrixAt(v, dummy.matrix);
    }
    vrmInst.castShadow = true;
    const xtal = new B(chamferBox(0.018, 0.007, 0.008, 0.0018, 1), U.steel());
    xtal.position.set(-lenA * 0.38, thick * 0.5 + 0.0035, -lenB * 0.31);
    pcbMesh.add(vrmInst, xtal);
  }
  return count;
}

function Bt(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const tex = new Wn(canvas);
  tex.colorSpace = Ot;
  tex.anisotropy = 16;
  return { canvas, ctx: canvas.getContext("2d"), tex };
}

var Hu = class Kit3D {
  constructor(root) {
    this.root = root;
    this.parts = [];
    this.anims = [];
  }

  part(obj, meta = {}) {
    if (meta.name) {
      obj.userData.part = {
        name: meta.name,
        info: meta.info || "",
        live: meta.live || null,
        shell: !!meta.shell,
        label: meta.label !== false,
      };
    }
    if (meta.shell) {
      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = Array.isArray(child.material)
            ? child.material.map((m) => {
                const mc = m.clone();
                mc.userData.shell = true;
                return mc;
              })
            : child.material.clone();
          if (!Array.isArray(child.material)) child.material.userData.shell = true;
          child.userData.shellMesh = true;
        }
      });
    }
    obj.userData.base = obj.position.clone();
    obj.userData.explode = new N(...(meta.explode || [0, 0, 0]));
    if (meta.name || meta.explode) this.parts.push(obj);
    return obj;
  }

  add(obj, meta = {}, parent) {
    (parent || this.root).add(obj);
    return this.part(obj, meta);
  }

  mesh(geo, mat, pos = [0, 0, 0], meta = {}, parent) {
    const m = new B(geo, mat);
    m.position.set(...pos);
    if (meta && meta.rot) m.rotation.set(...meta.rot);
    m.castShadow = !meta || meta.cast !== false;
    m.receiveShadow = true;
    return this.add(m, meta || {}, parent);
  }

  box(w, h, d, mat, pos, meta = {}, parent) {
    const geo =
      meta && meta.sharp
        ? new te(w, h, d)
        : chamferBox(w, h, d, meta ? meta.bevel : undefined, 2);
    return this.mesh(geo, mat, pos, meta, parent);
  }

  cyl(rTop, rBot, h, mat, pos, meta = {}, parent) {
    return this.mesh(
      new ke(rTop, rBot, h, meta.seg || 36, 1, !!meta.open),
      mat,
      pos,
      meta,
      parent,
    );
  }

  sphere(r, mat, pos, meta = {}, parent) {
    const seg = meta.seg || 32;
    return this.mesh(
      new Mt(r, seg, Math.max(16, Math.round(seg * 0.65))),
      mat,
      pos,
      meta,
      parent,
    );
  }

  torus(r, tube, mat, pos, meta = {}, parent) {
    return this.mesh(
      new Pi(r, tube, meta.rs || 14, meta.ts || 40, meta.arc || Math.PI * 2),
      mat,
      pos,
      meta,
      parent,
    );
  }

  group(pos = [0, 0, 0], meta = {}, parent) {
    const g = new ft();
    g.position.set(...pos);
    if (meta && meta.rot) g.rotation.set(...meta.rot);
    return this.add(g, meta || {}, parent);
  }

  tube(points, radius, mat, meta = {}, parent) {
    const curve = new _n(points.map((pt) => new N(...pt)));
    return this.mesh(
      new Zn(curve, meta.seg || 64, radius, meta.radSeg || 12, false),
      mat,
      [0, 0, 0],
      meta,
      parent,
    );
  }

  chip(w, d, pos, meta = {}, parent) {
    const grp = this.group(pos, meta, parent);
    const bodyMat = meta.mat || U.chip();
    const body = new B(chamferBox(w, 0.056, d, 0.005, 2), bodyMat);
    body.position.y = 0.042;
    body.castShadow = true;
    body.receiveShadow = true;
    grp.add(body);

    // Pin-1 orientation dimple & end-notch
    const notch = new B(
      new ke(Math.min(0.018, w * 0.08), Math.min(0.018, w * 0.08), 0.004, 20),
      U.metal(0x3a3f47, 0.5),
    );
    notch.position.set(-w * 0.34, 0.071, -d * 0.32);
    grp.add(notch);

    // Bent shoulder + vertical DIP/SOIC tinned leads
    const nPins = Math.max(2, Math.round(d / 0.075));
    const shoulderGeo = new te(0.022, 0.008, 0.02);
    const legGeo = new te(0.007, 0.036, 0.014);
    const pinMat = U.metal(0xd8dde4, 0.22);
    for (let i = 0; i < nPins; i++) {
      const pz = -d * 0.5 + ((i + 0.5) * d) / nPins;
      for (const side of [-1, 1]) {
        const sh = new B(shoulderGeo, pinMat);
        sh.position.set(side * (w * 0.5 + 0.009), 0.036, pz);
        const leg = new B(legGeo, pinMat);
        leg.position.set(side * (w * 0.5 + 0.018), 0.018, pz);
        grp.add(sh, leg);
      }
    }

    if (meta.text) {
      const label = ym(meta.text, w * 0.88, d * 0.54, meta.textColor || "#d6dce5");
      label.position.y = 0.0715;
      label.rotation.x = -Math.PI / 2;
      grp.add(label);
    }
    return grp;
  }

  onFrame(fn) {
    this.anims.push(fn);
  }
};

function ym(
  text,
  w,
  h,
  fg = "#fff",
  bg = null,
  fontSpec = '600 52px "JetBrains Mono", "Inter", Arial, sans-serif',
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = Math.max(64, Math.round((1024 * h) / Math.max(1e-4, w)));
  const ctx = canvas.getContext("2d");
  if (bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const match = fontSpec.match(/(\d+)px/);
  let px = match ? parseInt(match[1], 10) * 2 : 96;
  const lines = String(text).split("\n");
  px = Math.min(px, (canvas.height / lines.length) * 0.78);
  const setFont = (sz) => fontSpec.replace(/\d+px/, Math.round(sz) + "px");
  ctx.font = setFont(px);
  while (lines.some((ln) => ctx.measureText(ln).width > canvas.width * 0.92) && px > 14) {
    px -= 3;
    ctx.font = setFont(px);
  }
  lines.forEach((ln, idx) => {
    ctx.fillText(
      ln,
      canvas.width * 0.5,
      canvas.height * 0.5 + (idx - (lines.length - 1) * 0.5) * px * 1.12,
    );
  });
  const tex = new Wn(canvas);
  tex.colorSpace = Ot;
  tex.anisotropy = 16;
  return new B(new mt(w, h), new xt({ map: tex, transparent: !bg, depthWrite: !!bg }));
}

// High-Detail Thermionic Octal Vacuum Tube (Internal Anode Cage, Control Grid, Mica Discs, Getter Flash, Pins)
function Lc(kit, pos, opts = {}, parent) {
  const s = opts.scale || 1;
  const grp = kit.group(
    pos,
    {
      name: opts.name,
      info: opts.info,
      live: opts.live,
      explode: opts.explode,
    },
    parent,
  );

  // Octal Bakelite base + lower chrome indexing ring + 8 pins
  const base = new B(new ke(0.061 * s, 0.066 * s, 0.052 * s, 32), U.bakelite());
  base.position.y = 0.026 * s;
  grp.add(base);

  const collar = new B(new ke(0.0625 * s, 0.0625 * s, 0.008 * s, 32), U.brass());
  collar.position.y = 0.05 * s;
  grp.add(collar);

  const pinGeo = new ke(0.0035 * s, 0.003 * s, 0.018 * s, 10);
  const pinMat = U.metal(0xd5dbe3, 0.25);
  for (let p = 0; p < 8; p++) {
    const a = (p / 8) * Math.PI * 2;
    const pin = new B(pinGeo, pinMat);
    pin.position.set(Math.cos(a) * 0.038 * s, -0.006 * s, Math.sin(a) * 0.038 * s);
    grp.add(pin);
  }

  // Internal glass pinch stem + support rods + top/bottom mica spacers
  const stem = new B(
    new ke(0.016 * s, 0.024 * s, 0.045 * s, 20),
    U.glass(0xdaf0ff, 0.34),
  );
  stem.position.y = 0.072 * s;
  grp.add(stem);

  const micaGeo = new ke(0.043 * s, 0.043 * s, 0.003 * s, 24);
  const micaBot = new B(micaGeo, U.ceramic());
  micaBot.position.y = 0.095 * s;
  const micaTop = new B(micaGeo, U.ceramic());
  micaTop.position.y = 0.232 * s;
  grp.add(micaBot, micaTop);

  for (const sx of [-1, 1]) {
    const rod = new B(new ke(0.0025 * s, 0.0025 * s, 0.16 * s, 8), U.steel());
    rod.position.set(sx * 0.034 * s, 0.165 * s, 0);
    grp.add(rod);
  }

  // Carbonized nickel anode plate box + copper control-grid helix
  const anode = new B(
    chamferBox(0.056 * s, 0.122 * s, 0.034 * s, 0.004 * s, 2),
    U.metal(0x3f454e, 0.52),
  );
  anode.position.y = 0.163 * s;
  grp.add(anode);

  const grid = new B(new ke(0.016 * s, 0.016 * s, 0.115 * s, 18, 1, true), U.copper());
  grid.position.y = 0.163 * s;
  grp.add(grid);

  // Heated cathode filament (animated via userData.filament!)
  const filament = new B(
    new ke(0.0075 * s, 0.0075 * s, 0.132 * s, 12),
    U.glow(0xff6b1a, 1.15),
  );
  filament.position.set(0, 0.163 * s, 0.02 * s);
  grp.add(filament);
  grp.userData.filament = filament;

  // Borosilicate glass envelope + dome + evacuation tip + mirror barium getter flash
  const glassMat = U.glass(0xd8eeff, 0.24);
  const bulb = new B(new ke(0.051 * s, 0.055 * s, 0.22 * s, 36, 1, true), glassMat);
  bulb.position.y = 0.162 * s;
  grp.add(bulb);

  const dome = new B(new Mt(0.051 * s, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
  dome.position.y = 0.272 * s;
  grp.add(dome);

  const pip = new B(new pn(0.009 * s, 0.022 * s, 16), glassMat);
  pip.position.y = 0.33 * s;
  grp.add(pip);

  const getter = new B(
    new Mt(0.048 * s, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.34),
    U.metal(0xc8cfd8, 0.12),
  );
  getter.position.y = 0.271 * s;
  grp.add(getter);

  return grp;
}

// Knurled Skirted Bakelite Instrument Knob
function Om(kit, pos, opts = {}, parent) {
  const r0 = opts.r || 0.05;
  const grp = kit.group(
    pos,
    { name: opts.name, info: opts.info, live: opts.live },
    parent,
  );
  const skirt = new B(new ke(r0 * 1.14, r0 * 1.2, 0.012, 32), U.metal(0xcfd5dd, 0.3));
  skirt.rotation.x = Math.PI / 2;
  skirt.position.z = 0.006;
  grp.add(skirt);

  const body = new B(
    new ke(r0 * 0.96, r0 * 1.06, 0.036, 32),
    opts.mat || U.knurl(0x231a16, 0.38),
  );
  body.rotation.x = Math.PI / 2;
  body.position.z = 0.024;
  grp.add(body);

  const cap = new B(new ke(r0 * 0.52, r0 * 0.52, 0.005, 24), U.brass());
  cap.rotation.x = Math.PI / 2;
  cap.position.z = 0.043;
  grp.add(cap);

  const ptr = new B(
    chamferBox(0.008, r0 * 0.82, 0.01, 0.002, 1),
    U.plastic(0xdcd8ce, 0.35),
  );
  ptr.position.set(0, r0 * 0.4, 0.043);
  const pivot = new ft();
  pivot.add(ptr);
  grp.add(pivot);
  grp.userData.pivot = pivot;
  return grp;
}

// Precision Chrome Bat-Handle Toggle Switch with Hex Collar Nut
function Ba(kit, pos, opts = {}, parent) {
  const grp = kit.group(
    pos,
    opts.name ? { name: opts.name, info: opts.info } : {},
    parent,
  );
  const washer = new B(new ke(0.021, 0.021, 0.004, 24), U.steel());
  washer.rotation.x = Math.PI / 2;
  washer.position.z = 0.002;
  const hexNut = new B(new ke(0.017, 0.017, 0.01, 6), U.metal(0xd5dbe2, 0.25));
  hexNut.rotation.x = Math.PI / 2;
  hexNut.position.z = 0.007;
  grp.add(washer, hexNut);

  const bat = new B(
    new ke(0.0045, 0.0095, 0.068, 16),
    opts.mat || U.metal(0xe2e6ec, 0.16),
  );
  bat.position.y = 0.034;
  const tip = new B(new Mt(0.0095, 16, 12), opts.mat || U.metal(0xe2e6ec, 0.16));
  tip.position.y = 0.068;
  const lever = new ft();
  lever.add(bat, tip);
  lever.rotation.x = 0.5;
  grp.add(lever);
  grp.userData.lever = lever;
  return grp;
}

var za = (sw, state) => {
  sw.userData.lever.rotation.x = state ? -0.5 : 0.5;
};

// Panel LED Bank with Chrome Collar Bezels
function fs(kit, count, pos, spacing, color, opts = {}, parent) {
  const grp = kit.group(
    pos,
    { name: opts.name, info: opts.info, live: opts.live },
    parent,
  );
  const leds = [];
  const r = opts.r || 0.014;
  const domeGeo = new Mt(r, 20, 14);
  const bezelGeo = new Pi(r * 1.22, r * (opts.bezel ? 0.28 : 0.18), 10, 24);
  const bezelMat = U.metal(0xb8c0ca, 0.26);
  for (let i = 0; i < count; i++) {
    const lens = new B(domeGeo, U.led(color));
    lens.position.x = (i - (count - 1) * 0.5) * spacing;
    lens.scale.z = 0.68;
    grp.add(lens);
    leds.unshift(lens);
    const bz = new B(bezelGeo, bezelMat);
    bz.position.copy(lens.position);
    grp.add(bz);
  }
  grp.userData.leds = leds;
  return grp;
}

function Ki(bank, bitmask, _unused, arrayVals) {
  const leds = bank.userData.leds;
  for (let i = 0; i < leds.length; i++) {
    const v = arrayVals ? arrayVals[i] : (bitmask >> i) & 1;
    leds[i].material.emissiveIntensity = 0.06 + v * 1.85;
  }
}

function zi(kit, w, h, pos, res = [512, 384], opts = {}, parent) {
  const surf = Bt(res[0], res[1]);
  const mesh = new B(
    new mt(w, h),
    U.screen(surf.tex, { crt: !!opts.crt, lcd: !!opts.lcd }),
  );
  mesh.position.set(...pos);
  if (opts.rot) mesh.rotation.set(...opts.rot);
  kit.add(mesh, { name: opts.name, info: opts.info, live: opts.live }, parent);
  return { mesh, ...surf };
}

// Sculpted PWM Axial Cooling Fan with Venturi Bore, Stator Struts & Corner Screws
function ni(kit, radius, pos, opts = {}, parent) {
  const grp = kit.group(
    pos,
    {
      name: opts.name || "Axial PWM Fan",
      info:
        opts.info ||
        "Brushless 4-pin PWM axial fan with swept acoustic blades: forces convective airflow across finned heatsinks.",
      rot: opts.rot,
    },
    parent,
  );
  const frameMat = U.plastic(opts.color || 0x1e2229, 0.46);
  const outer = radius * 2.18;
  // 4 frame walls forming square housing around circular bore
  const barT = radius * 0.2;
  for (const [fx, fy, fw, fh] of [
    [0, outer * 0.5 - barT * 0.5, outer, barT],
    [0, -outer * 0.5 + barT * 0.5, outer, barT],
    [-outer * 0.5 + barT * 0.5, 0, barT, outer - barT * 2],
    [outer * 0.5 - barT * 0.5, 0, barT, outer - barT * 2],
  ]) {
    const wall = new B(chamferBox(fw, fh, 0.052, 0.006, 2), frameMat);
    wall.position.set(fx, fy, 0);
    grp.add(wall);
  }
  const bore = new B(new ke(radius * 1.02, radius * 1.02, 0.054, 36, 1, true), frameMat);
  bore.rotation.x = Math.PI / 2;
  grp.add(bore);

  // 4 stainless corner mounting screws
  const screwGeo = new ke(radius * 0.065, radius * 0.065, 0.058, 12);
  const screwMat = U.steel();
  const cOff = outer * 0.41;
  for (const [sx, sy] of [
    [-cOff, -cOff],
    [cOff, -cOff],
    [cOff, cOff],
    [-cOff, cOff],
  ]) {
    const sc = new B(screwGeo, screwMat);
    sc.rotation.x = Math.PI / 2;
    sc.position.set(sx, sy, 0);
    grp.add(sc);
  }

  const rotor = new ft();
  rotor.position.z = 0.008;
  grp.add(rotor);

  const bladeGeo = chamferBox(radius * 0.78, radius * 0.26, 0.007, 0.002, 1);
  const bladeMat = U.plastic(opts.blade || 0x2c333f, 0.36);
  const nBlades = 9;
  for (let b = 0; b < nBlades; b++) {
    const blade = new B(bladeGeo, bladeMat);
    blade.position.set(radius * 0.52, radius * 0.04, 0);
    blade.rotation.set(0.54, 0.08, -0.14);
    const arm = new ft();
    arm.rotation.z = (b / nBlades) * Math.PI * 2;
    arm.add(blade);
    rotor.add(arm);
  }

  const hub = new B(
    new ke(radius * 0.31, radius * 0.31, 0.038, 28),
    U.plastic(0x14171c, 0.35),
  );
  hub.rotation.x = Math.PI / 2;
  rotor.add(hub);

  const badge = new B(
    new ke(radius * 0.18, radius * 0.18, 0.041, 24),
    U.metal(0xbcc4cf, 0.2),
  );
  badge.rotation.x = Math.PI / 2;
  rotor.add(badge);

  grp.userData.rotor = rotor;
  grp.userData.speed = opts.speed || 12;
  kit.onFrame((dt) => {
    rotor.rotation.z -= dt * grp.userData.speed;
  });
  return grp;
}

// Finned Heatsink with Copper Coldplate & Heatpipe Tips
function vn(kit, w, d, finH, pos, opts = {}, parent) {
  const grp = kit.group(
    pos,
    {
      name: opts.name || "Heatsink",
      info:
        opts.info ||
        "Stamped aluminium fin array brazed to a copper coldplate for high-surface-area convective cooling.",
      explode: opts.explode,
    },
    parent,
  );
  const base = new B(chamferBox(w, 0.026, d, 0.003, 2), opts.base || U.copper());
  base.position.y = 0.013;
  grp.add(base);

  const nFins = opts.fins || 16;
  const finGeo = chamferBox(Math.min(0.006, (w / nFins) * 0.42), finH, d, 0.001, 1);
  const finMat = opts.mat || U.alu();
  for (let i = 0; i < nFins; i++) {
    const fin = new B(finGeo, finMat);
    fin.position.set(-w * 0.5 + ((i + 0.5) * w) / nFins, 0.026 + finH * 0.5, 0);
    grp.add(fin);
  }

  if (finH > 0.08 && w > 0.16) {
    const nPipes = Math.min(4, Math.max(2, Math.floor(w / 0.07)));
    const pipeGeo = new ke(0.0055, 0.0055, finH + 0.032, 14);
    for (let p = 0; p < nPipes; p++) {
      const pipe = new B(pipeGeo, U.copper());
      pipe.position.set(
        -w * 0.32 + (p * w * 0.64) / Math.max(1, nPipes - 1),
        0.02 + finH * 0.5,
        0,
      );
      grp.add(pipe);
    }
  }
  return grp;
}

// High-Detail Memory DIMM with Gold Edge Fingers, Key Notch, BGA Chips & Anodized Spreader
function ps(kit, pos, opts = {}, parent) {
  const grp = kit.group(
    pos,
    {
      name: opts.name || "DRAM DIMM",
      info: opts.info,
      explode: opts.explode,
      live: opts.live,
    },
    parent,
  );
  const len = opts.len || 1.3;
  const h = opts.h || 0.3;
  const pcb = new B(chamferBox(len, h, 0.012, 0.002, 2), U.pcb(opts.pcb || 0x162b1f));
  pcb.position.y = h * 0.5;
  grp.add(pcb);

  // Gold edge-connector strips (split by keying notch)
  const leftEdge = new B(new te(len * 0.46, 0.028, 0.0145), U.gold());
  leftEdge.position.set(-len * 0.24, 0.015, 0);
  const rightEdge = new B(new te(len * 0.42, 0.028, 0.0145), U.gold());
  rightEdge.position.set(len * 0.26, 0.015, 0);
  grp.add(leftEdge, rightEdge);

  const nChips = opts.chips || 8;
  const pitch = len / (nChips + 1);
  const chipGeo = chamferBox(pitch * 0.74, h * 0.44, 0.011, 0.002, 1);
  for (let i = 0; i < nChips; i++) {
    for (const side of opts.double ? [-1, 1] : [1]) {
      const ic = new B(chipGeo, U.chip());
      ic.position.set(
        -len * 0.5 + ((i + 1) * len) / (nChips + 1),
        h * 0.55,
        side * 0.0115,
      );
      grp.add(ic);
    }
  }

  if (opts.spreader) {
    const sp = new B(
      chamferBox(len * 1.01, h * 0.92, 0.036, 0.004, 2),
      U.metal(opts.spreader, 0.3),
    );
    sp.position.y = h * 0.58;
    grp.add(sp);
  }
  return grp;
}

// Expansion / Graphics Card with Gold Edge Connector, Backplate & Machined I/O Bracket
function Gs(kit, len, h, pos, opts = {}, parent) {
  const grp = kit.group(
    pos,
    {
      name: opts.name,
      info: opts.info,
      explode: opts.explode,
      live: opts.live,
    },
    parent,
  );
  const pcb = new B(chamferBox(len, h, 0.014, 0.002, 2), U.pcb(opts.pcb || 0x1b5e3a));
  pcb.position.y = h * 0.5 + 0.03;
  grp.add(pcb);

  const fingers = new B(new te(len * 0.56, 0.038, 0.016), U.gold());
  fingers.position.set(-len * 0.06, 0.019, 0);
  grp.add(fingers);

  const bracket = new B(chamferBox(0.012, h * 1.24, 0.13, 0.002, 2), U.steel());
  bracket.position.set(-len * 0.5, h * 0.62 + 0.025, 0.045);
  const tab = new B(chamferBox(0.05, 0.01, 0.13, 0.002, 1), U.steel());
  tab.position.set(-len * 0.5 + 0.02, h * 1.24 + 0.025, 0.045);
  grp.add(bracket, tab);

  return grp;
}

function Dt(kit, points, radius, col, opts = {}, parent) {
  return kit.tube(points, radius, U.plastic(col, 0.5), opts, parent);
}

function Nt(kit, text, w, h, pos, opts = {}, parent) {
  const plane = ym(
    text,
    w,
    h,
    opts.color || "#222",
    opts.bg === undefined ? "#cfc8b6" : opts.bg,
    opts.font || '600 48px "JetBrains Mono", Arial, sans-serif',
  );
  plane.position.set(...pos);
  if (opts.rot) plane.rotation.set(...opts.rot);
  (parent || kit.root).add(plane);
  return plane;
}

// True 3D Helical Coiled Cable (telephone / PS2 / RS-232 / aviator keyboard coil)
function buildCoiledCable(
  kit,
  points,
  coilR = 0.018,
  wireR = 0.0055,
  turns = 18,
  col = 0x26282e,
  opts = {},
  parent,
) {
  const spine = new _n(points.map((p) => new N(...p)));
  const samples = Math.max(48, turns * 12);
  const frames = spine.computeFrenetFrames(samples, false);
  const helixPts = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = spine.getPointAt(t);
    // Smooth lead-in / lead-out straight ends with central helix coil
    const env =
      Math.sin(Math.min(1, t * 7) * Math.PI * 0.5) *
      Math.sin(Math.min(1, (1 - t) * 7) * Math.PI * 0.5);
    const ang = t * turns * Math.PI * 2;
    const nrm = frames.normals[i];
    const bin = frames.binormals[i];
    helixPts.push(
      new N(
        pt.x + (nrm.x * Math.cos(ang) + bin.x * Math.sin(ang)) * coilR * env,
        pt.y + (nrm.y * Math.cos(ang) + bin.y * Math.sin(ang)) * coilR * env,
        pt.z + (nrm.z * Math.cos(ang) + bin.z * Math.sin(ang)) * coilR * env,
      ),
    );
  }
  const curve = new _n(helixPts);
  const mat = opts.mat || U.plastic(col, 0.44);
  return kit.mesh(
    new Zn(curve, Math.min(260, samples * 2), wireR, 8, false),
    mat,
    [0, 0, 0],
    opts,
    parent,
  );
}

// Instanced 3D Sculpted Mechanical / Vintage Keyboard with High-DPI Keycap Legends
function buildSculptedKeyboard(kit, pos, opts = {}, parent) {
  const w = opts.w || 1.18;
  const d = opts.d || 0.42;
  const h = opts.h || 0.055;
  const grp = kit.group(
    pos,
    {
      name: opts.name || "Mechanical Keyboard",
      info:
        opts.info ||
        "Full-travel tactile switch matrix keyboard: row/column scan controller converts physical keystrokes into serial scan codes.",
      rot: opts.rot,
      explode: opts.explode,
      live: opts.live,
    },
    parent,
  );

  const tilt = opts.tilt !== undefined ? opts.tilt : 0.085;
  const deck = new ft();
  deck.rotation.x = tilt;
  grp.add(deck);

  // Sculpted chamfered wedge chassis + recessed switch plate
  const chassisMat = U.plastic(opts.bodyColor ?? 0xd2cbb8, 0.46);
  const base = new B(chamferBox(w, h, d, 0.012, 2), chassisMat);
  base.position.y = h * 0.5;
  base.castShadow = true;
  base.receiveShadow = true;
  deck.add(base);

  const wellW = w * 0.92;
  const wellD = d * 0.78;
  const plate = new B(
    new te(wellW, 0.008, wellD),
    U.darkAnodized(opts.plateColor ?? 0x1e2228),
  );
  plate.position.set(0, h + 0.001, d * 0.03);
  deck.add(plate);

  if (opts.rgb) {
    const glow = new B(
      new te(wellW * 0.98, 0.006, wellD * 0.95),
      U.glow(opts.rgbColor ?? 0x38bdf8, 0.9),
    );
    glow.position.set(0, h + 0.004, d * 0.03);
    deck.add(glow);
    grp.userData.rgbMesh = glow;
  }

  // Build 5-row sculpted keycap layout (instanced for single-draw-call speed!)
  const rows = opts.rows || [
    ["ESC", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "BKSP"],
    ["TAB", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
    ["CAPS", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "ENTER"],
    ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "SHIFT"],
    ["CTRL", "WIN", "ALT", "SPACE", "ALT", "FN", "CTRL"],
  ];
  const widths = {
    BKSP: 1.8,
    TAB: 1.4,
    "\\": 1.4,
    CAPS: 1.65,
    ENTER: 2.05,
    SHIFT: 2.35,
    CTRL: 1.35,
    WIN: 1.2,
    ALT: 1.25,
    FN: 1.2,
    SPACE: 6.1,
  };

  const keySpecs = [];
  const nRows = rows.length;
  const rowStep = wellD / nRows;
  for (let r = 0; r < nRows; r++) {
    const row = rows[r];
    const totalU = row.reduce((acc, k) => acc + (widths[k] || 1), 0);
    let curU = 0;
    for (let c = 0; c < row.length; c++) {
      const lbl = row[c];
      const u = widths[lbl] || 1;
      const kw = (u / totalU) * wellW * 0.96;
      const cx = -wellW * 0.5 + ((curU + u * 0.5) / totalU) * wellW;
      const cz = d * 0.03 - wellD * 0.5 + (r + 0.5) * rowStep;
      keySpecs.push({ lbl, cx, cz, kw, kd: rowStep * 0.84, r, u });
      curU += u;
    }
  }

  const capGeo = chamferBox(1, 1, 1, 0.16, 1);
  const capMat = new Cn({
    roughness: 0.42,
    metalness: 0.02,
    clearcoat: 0.14,
  });
  const inst = new ut(capGeo, capMat, keySpecs.length);
  const dummy = new je();
  const col = new Ae();
  const alphaCol = opts.keyColor ?? 0xdcd6c6;
  const modCol = opts.modColor ?? 0xb8b1a0;
  const accentCol = opts.accentColor ?? modCol;

  const legSurf = Bt(2048, 640);
  const lctx = legSurf.ctx;
  lctx.clearRect(0, 0, 2048, 640);
  lctx.textAlign = "center";
  lctx.textBaseline = "middle";
  const fgCol = opts.legendColor || "#22262c";
  const accentFg = opts.accentLegendColor || "#ffffff";

  keySpecs.forEach((ks, i) => {
    const kh = 0.021 + (nRows - 1 - ks.r) * 0.0014; // OEM sculpted row profile!
    dummy.position.set(ks.cx, h + kh * 0.5 + 0.003, ks.cz);
    dummy.scale.set(ks.kw, kh, ks.kd);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);

    const isAccent = ks.lbl === "ESC" || ks.lbl === "ENTER";
    const isMod = ks.u > 1.05 && ks.lbl !== "SPACE";
    col.set(isAccent ? accentCol : isMod ? modCol : alphaCol);
    inst.setColorAt(i, col);

    // Stamp crisp high-DPI key legend onto top overlay plane
    const ux = (ks.cx + wellW * 0.5) / wellW;
    const uz = (ks.cz - (d * 0.03 - wellD * 0.5)) / wellD;
    lctx.fillStyle = isAccent ? accentFg : fgCol;
    lctx.font =
      ks.lbl.length > 2
        ? '700 22px "JetBrains Mono", monospace'
        : '700 30px "JetBrains Mono", monospace';
    if (ks.lbl !== "SPACE") {
      lctx.fillText(ks.lbl, ux * 2048, uz * 640);
    }
  });
  inst.castShadow = true;
  inst.receiveShadow = true;
  deck.add(inst);
  legSurf.tex.needsUpdate = true;

  const legPlane = new B(
    new mt(wellW, wellD),
    new xt({ map: legSurf.tex, transparent: true, depthWrite: false }),
  );
  legPlane.rotation.x = -Math.PI / 2;
  legPlane.position.set(0, h + 0.0285, d * 0.03);
  deck.add(legPlane);

  // Lock status LEDs (CAPS / NUM / SCRL) in top-right bezel
  if (opts.leds !== false) {
    for (let li = 0; li < 3; li++) {
      const led = new B(
        new Mt(0.0055, 12, 8),
        U.glow(opts.ledColor ?? 0x52ff7a, li === 0 ? 1.15 : 0.18),
      );
      led.position.set(w * 0.38 + li * 0.028, h + 0.004, -d * 0.41);
      deck.add(led);
    }
  }

  return grp;
}

// Sculpted 3D Mouse (Retro 2-Button Ball Mouse OR Ergonomic Optical/Gaming Mouse + Optional Pad)
function buildMouse3D(kit, pos, opts = {}, parent) {
  const grp = kit.group(
    pos,
    {
      name: opts.name || "Pointing Mouse",
      info:
        opts.info ||
        "Two-axis quadrature / optical displacement sensor with microswitch buttons.",
      rot: opts.rot,
      explode: opts.explode,
    },
    parent,
  );

  if (opts.pad !== false) {
    const pad = new B(
      chamferBox(0.28, 0.006, 0.24, 0.003, 1),
      U.plastic(opts.padColor ?? 0x1c2838, 0.78),
    );
    pad.position.y = 0.003;
    pad.receiveShadow = true;
    grp.add(pad);
  }

  const mw = opts.w || 0.082;
  const md = opts.d || 0.135;
  const mh = opts.h || 0.042;
  const y0 = opts.pad !== false ? 0.006 : 0;
  const bodyMat = U.plastic(opts.color ?? 0xd2cbb8, opts.rough ?? 0.4);

  if (opts.retro) {
    // Classic 1980s/1990s wedged two-button serial mouse
    const body = new B(chamferBox(mw, mh * 0.85, md, 0.012, 2), bodyMat);
    body.position.set(0, y0 + mh * 0.42, 0);
    body.castShadow = true;
    grp.add(body);
    for (const sx of [-1, 1]) {
      const btn = new B(
        chamferBox(mw * 0.43, 0.007, md * 0.36, 0.002, 1),
        U.plastic(opts.btnColor ?? 0xbab29e, 0.45),
      );
      btn.position.set(sx * mw * 0.235, y0 + mh * 0.86, -md * 0.27);
      grp.add(btn);
    }
  } else {
    // Sculpted ergonomic modern dome shell + scroll wheel + RGB accent
    const dome = new B(new Mt(0.5, 28, 18), bodyMat);
    dome.scale.set(mw, mh * 1.45, md);
    dome.position.set(0, y0 + mh * 0.25, 0);
    dome.castShadow = true;
    grp.add(dome);

    const wheel = new B(new ke(0.011, 0.011, 0.009, 20), U.knurl(0x282e38, 0.35));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, y0 + mh * 0.92, -md * 0.26);
    grp.add(wheel);

    if (opts.rgb) {
      const strip = new B(new te(mw * 0.72, 0.005, md * 0.82), U.glow(opts.rgb, 0.95));
      strip.position.set(0, y0 + 0.006, 0);
      grp.add(strip);
    }
  }
  return grp;
}

// Moving-Coil Analog Panel Meter (Bakelite/Chrome Bezel, Printed Scale Arc, Glass Lens & Live Needle)
function buildAnalogMeter(kit, pos, opts = {}, parent) {
  const r = opts.r || 0.075;
  const grp = kit.group(
    pos,
    {
      name: opts.name || "Analog Panel Meter",
      info:
        opts.info ||
        "D'Arsonval moving-coil galvanometer: coil torque proportional to current deflects the pointer across a calibrated scale.",
      rot: opts.rot,
      live: opts.live,
    },
    parent,
  );

  // Bezel flange
  const bezel = new B(
    new ke(r * 1.08, r * 1.12, 0.022, 36),
    opts.chrome ? U.metal(0xd0d6de, 0.22) : U.bakelite(),
  );
  bezel.rotation.x = Math.PI / 2;
  bezel.position.z = 0.011;
  grp.add(bezel);

  // Printed calibrated dial face
  const dial = Bt(512, 512);
  const c = dial.ctx;
  c.fillStyle = opts.dark ? "#151920" : "#f2ecdc";
  c.beginPath();
  c.arc(256, 256, 248, 0, Math.PI * 2);
  c.fill();

  const fg = opts.dark ? "#e5ecf5" : "#1c1f24";
  c.strokeStyle = fg;
  c.lineWidth = 4;
  c.beginPath();
  c.arc(256, 320, 195, Math.PI * 1.2, Math.PI * 1.8);
  c.stroke();

  // Red overload zone
  c.strokeStyle = "#d93829";
  c.lineWidth = 8;
  c.beginPath();
  c.arc(256, 320, 195, Math.PI * 1.68, Math.PI * 1.8);
  c.stroke();

  for (let i = 0; i <= 20; i++) {
    const a = Math.PI * (1.2 + (i / 20) * 0.6);
    const r0 = i % 5 === 0 ? 168 : 180;
    c.strokeStyle = i >= 16 ? "#d93829" : fg;
    c.lineWidth = i % 5 === 0 ? 4 : 2;
    c.beginPath();
    c.moveTo(256 + Math.cos(a) * r0, 320 + Math.sin(a) * r0);
    c.lineTo(256 + Math.cos(a) * 195, 320 + Math.sin(a) * 195);
    c.stroke();
  }
  c.fillStyle = fg;
  c.font = '700 34px "JetBrains Mono", monospace';
  c.textAlign = "center";
  c.fillText(opts.unit || "VOLTS", 256, 232);
  dial.tex.needsUpdate = true;

  const face = new B(new Xn(r * 0.96, 36), new xt({ map: dial.tex }));
  face.position.z = 0.023;
  grp.add(face);

  // Pivoting red/black pointer needle
  const pivot = new ft();
  pivot.position.set(0, -r * 0.25, 0.026);
  const needle = new B(new te(r * 0.032, r * 0.78, 0.003), U.plastic(0xd62828, 0.35));
  needle.position.y = r * 0.38;
  pivot.add(needle);
  const hub = new B(new ke(r * 0.09, r * 0.09, 0.008, 18), U.brass());
  hub.rotation.x = Math.PI / 2;
  pivot.add(hub);
  grp.add(pivot);

  // Protective clearcoat glass cover
  const lens = new B(new Xn(r * 0.98, 36), U.glass(0xeaf6ff, 0.18));
  lens.position.z = 0.029;
  grp.add(lens);

  grp.userData.setVal = (v01) => {
    const clamped = Math.max(0, Math.min(1, v01));
    pivot.rotation.z = (0.5 - clamped) * 1.05;
  };
  grp.userData.setVal(opts.initial ?? 0.35);
  return grp;
}

// Authentic 3D CRT or Slim-Bezel Studio LCD/OLED Monitor with Live High-DPI Canvas
function buildMonitor3D(kit, pos, opts = {}, parent) {
  const sw = opts.w || 0.95;
  const sh = opts.h || 0.72;
  const res = opts.res || [1024, 768];
  const grp = kit.group(
    pos,
    {
      name: opts.name || (opts.crt ? "CRT Video Monitor" : "Flat-Panel Display"),
      info:
        opts.info ||
        (opts.crt
          ? "Raster-scan cathode-ray tube display: electron beam swept by horizontal/vertical deflection coils excites P4/P22 phosphor."
          : "High-DPI active-matrix IPS/OLED display driven by digital frame-buffer scanout."),
      rot: opts.rot,
      explode: opts.explode,
      live: opts.live,
    },
    parent,
  );

  const surf = Bt(res[0], res[1]);

  if (opts.crt) {
    const bodyCol = opts.color ?? 0xd4ccb8;
    const caseMat = U.plastic(bodyCol, 0.46);
    const bezelW = sw * 1.22;
    const bezelH = sh * 1.24;
    const frontD = opts.depth || sw * 0.56;

    // Swivel pedestal base + neck
    if (opts.stand !== false) {
      const foot = new B(
        chamferBox(bezelW * 0.62, 0.036, frontD * 0.68, 0.008, 2),
        caseMat,
      );
      foot.position.y = 0.018;
      const neck = new B(new ke(bezelW * 0.18, bezelW * 0.22, 0.085, 28), caseMat);
      neck.position.y = 0.065;
      grp.add(foot, neck);
    }
    const yBase = opts.stand !== false ? 0.1 : 0;

    // Front CRT cabinet + tapered rear electron-gun yoke housing
    const cab = new B(chamferBox(bezelW, bezelH, frontD * 0.58, 0.022, 2), caseMat);
    cab.position.set(0, yBase + bezelH * 0.5, 0);
    cab.castShadow = true;
    grp.add(cab);

    const rear = new B(
      chamferBox(bezelW * 0.72, bezelH * 0.72, frontD * 0.52, 0.026, 2),
      caseMat,
    );
    rear.position.set(0, yBase + bezelH * 0.48, -frontD * 0.46);
    rear.castShadow = true;
    grp.add(rear);

    // Side ventilation louver slots
    const slotMat = U.plastic(0x282623, 0.7);
    for (let s = 0; s < 6; s++) {
      const sl = new B(new te(bezelW * 0.5, 0.008, 0.016), slotMat);
      sl.position.set(0, yBase + bezelH - 0.002, -0.04 - s * 0.036);
      grp.add(sl);
    }

    // Recessed dark CRT inner mask + live phosphor canvas + subtle clearcoat glass sheen
    const zFace = frontD * 0.29;
    const mask = new B(
      chamferBox(sw * 1.06, sh * 1.06, 0.012, 0.005, 2),
      U.plastic(0x1d2026, 0.58),
    );
    mask.position.set(0, yBase + bezelH * 0.52, zFace + 0.002);
    grp.add(mask);

    const scrMesh = new B(new mt(sw, sh), U.screen(surf.tex, { crt: true }));
    scrMesh.position.set(0, yBase + bezelH * 0.52, zFace + 0.01);
    grp.add(scrMesh);

    const glass = new B(new mt(sw * 1.01, sh * 1.01), U.glass(0xdff2ff, 0.05));
    glass.material.envMapIntensity = 0.5;
    glass.position.set(0, yBase + bezelH * 0.52, zFace + 0.0125);
    glass.raycast = () => {};
    grp.add(glass);

    // Power LED + rotary brightness/contrast dials along lower chin
    const pwrLed = new B(new Mt(0.008, 14, 10), U.glow(0x4eff6b, 1.35));
    pwrLed.position.set(sw * 0.42, yBase + bezelH * 0.075, zFace + 0.006);
    grp.add(pwrLed);
    for (let k = 0; k < 3; k++) {
      const kn = new B(new ke(0.011, 0.011, 0.016, 16), U.plastic(0x3a3833, 0.45));
      kn.rotation.x = Math.PI / 2;
      kn.position.set(sw * 0.18 + k * 0.045, yBase + bezelH * 0.075, zFace + 0.006);
      grp.add(kn);
    }

    return { group: grp, mesh: scrMesh, ...surf };
  }

  // Modern Slim-Bezel LCD / OLED Studio Monitor
  const standMat = U.metal(0x8e96a2, 0.42);
  const bezelMat = U.darkAnodized(opts.color ?? 0x171b22);
  const standH = opts.standH ?? sh * 0.32;

  if (opts.stand !== false) {
    const base = new B(chamferBox(sw * 0.38, 0.016, 0.24, 0.004, 2), standMat);
    base.position.y = 0.008;
    base.castShadow = true;
    const pillar = new B(
      chamferBox(0.065, standH + sh * 0.45, 0.032, 0.005, 2),
      standMat,
    );
    pillar.position.set(0, (standH + sh * 0.45) * 0.5, -0.055);
    pillar.castShadow = true;
    grp.add(base, pillar);
  }

  const panelY = (opts.stand !== false ? standH : 0) + sh * 0.52;
  const frame = new B(chamferBox(sw + 0.036, sh + 0.046, 0.032, 0.006, 2), bezelMat);
  frame.position.set(0, panelY, 0);
  frame.castShadow = true;
  grp.add(frame);

  const chin = new B(new te(sw + 0.034, 0.022, 0.034), U.darkAnodized(0x252d38));
  chin.position.set(0, panelY - sh * 0.5 - 0.011, 0.001);
  grp.add(chin);

  const scrMesh = new B(new mt(sw, sh), U.screen(surf.tex, { lcd: true }));
  scrMesh.position.set(0, panelY + 0.004, 0.0175);
  grp.add(scrMesh);

  const pwrLed = new B(new Mt(0.0045, 12, 8), U.glow(0x38bdf8, 1.3));
  pwrLed.position.set(sw * 0.46, panelY - sh * 0.5 - 0.011, 0.019);
  grp.add(pwrLed);

  return { group: grp, mesh: scrMesh, ...surf };
}
