// CC0 PBR detail maps + HDRI image-based lighting (ported from v6 js/kit.js and js/main.js).
// Loaded only over http(s) (see src/assets/asset-locator.js). Every swap happens in the load
// callback, so a failed or blocked load leaves the procedural maps and RoomEnvironment in place.
// Sets: ambientCG Metal009 (brushed), Metal038 (steel), Plastic010 (plastic), Plastic013A (abs),
// Wood094 (wood), Concrete034 (concrete); HDRI: Poly Haven studio_small_09. All CC0, see CREDITS.md.

var CelPBR = (() => {
  const T = window.THREE;
  const loader = new T.TextureLoader();
  const texCache = new Map();
  let anisotropy = 8;

  function loadTex(name, srgb) {
    if (texCache.has(name)) return texCache.get(name);
    const p = new Promise((resolve, reject) => {
      loader.load(
        CelAssets.tex(name),
        (t) => {
          t.wrapS = t.wrapT = T.RepeatWrapping;
          t.anisotropy = anisotropy;
          if (srgb) t.colorSpace = T.SRGBColorSpace;
          resolve(t);
        },
        undefined,
        reject,
      );
    });
    p.catch(() => {});
    texCache.set(name, p);
    return p;
  }

  // Attach normal + roughness detail (and optional colour) from a texture set. `tile` is the
  // world-space size in metres of one texture repeat; celRefineUVs() applies it per mesh.
  function detail(m, set, ns, tile, withColor = false) {
    if (!CelAssets.canLoad() || !m || m.userData.celDetail) return m;
    m.userData.celDetail = set;
    m.userData.tile = tile; // world-scale UVs are applied at build time (maps are RepeatWrapping)
    const jobs = [loadTex(set + "_n"), loadTex(set + "_r")];
    if (withColor) jobs.push(loadTex(set + "_c", true));
    Promise.all(jobs)
      .then(([n, r, c]) => {
        m.normalMap = n;
        m.normalScale = new T.Vector2(ns, ns);
        m.roughnessMap = r;
        if (c) m.map = c;
        m.needsUpdate = true;
        CelPBR.loaded++;
      })
      .catch(() => {
        CelPBR.failed++;
      });
    return m;
  }

  // Box-projected UVs in world metres, so grain has the same physical size on every part.
  const uvCache = new Map();
  function worldUV(geo, tile) {
    const key = geo.uuid + "|" + tile;
    if (uvCache.has(key)) return uvCache.get(key);
    const g = geo.clone();
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const ax = Math.abs(nor.getX(i));
      const ay = Math.abs(nor.getY(i));
      const az = Math.abs(nor.getZ(i));
      let u;
      let v;
      if (ax >= ay && ax >= az) {
        u = pos.getZ(i);
        v = pos.getY(i);
      } else if (ay >= az) {
        u = pos.getX(i);
        v = pos.getZ(i);
      } else {
        u = pos.getX(i);
        v = pos.getY(i);
      }
      uv[i * 2] = u / tile;
      uv[i * 2 + 1] = v / tile;
    }
    g.setAttribute("uv", new T.BufferAttribute(uv, 2));
    uvCache.set(key, g);
    return g;
  }

  function refineUVs(root) {
    if (!root) return 0;
    let n = 0;
    root.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || !o.geometry)
        return;
      const tile = o.material && o.material.userData && o.material.userData.tile;
      if (!tile || !o.geometry.attributes.normal || o.userData.celUV === tile) return;
      o.geometry = worldUV(o.geometry, tile);
      o.userData.celUV = tile;
      n++;
    });
    return n;
  }

  // Wrap the procedural material factories (cached per key by gn(), so this runs once per material)
  const plan = {
    plastic: ["plastic", 0.35, 0.18],
    metal: ["brushed", 0.25, 0.22],
    gold: ["brushed", 0.08, 0.1],
    brass: ["brushed", 0.12, 0.12],
    copper: ["brushed", 0.12, 0.12],
    steel: ["steel", 0.35, 0.3],
    alu: ["brushed", 0.3, 0.2],
    darkAnodized: ["brushed", 0.2, 0.2],
    chip: ["abs", 0.5, 0.05],
    ceramic: ["abs", 0.2, 0.08],
    mosCeramic: ["abs", 0.2, 0.08],
    bakelite: ["abs", 0.25, 0.12],
    rubber: ["plastic", 0.6, 0.08],
  };
  function install() {
    if (!CelAssets.canLoad() || typeof U === "undefined") return;
    for (const [k, [set, ns, tile]] of Object.entries(plan)) {
      const orig = U[k];
      if (typeof orig !== "function") continue;
      U[k] = (...args) => detail(orig(...args), set, ns, tile);
    }
    const wood = U.wood;
    if (typeof wood === "function")
      U.wood = (...a) => detail(wood(...a), "wood", 0.6, 0.6, true);
  }

  // HDRI environment: swap in only once decoded and prefiltered
  function loadHDRI(renderer, scene, pmrem, onDone) {
    if (!CelAssets.canLoad() || !window.THREE_ADDONS.RGBELoader) return;
    CelAssets.probeFullTier().then(() => {
      new window.THREE_ADDONS.RGBELoader().load(
        CelAssets.hdri(),
        (hdr) => {
          hdr.mapping = T.EquirectangularReflectionMapping;
          const env = pmrem.fromEquirectangular(hdr).texture;
          hdr.dispose();
          const prev = scene.environment;
          scene.environment = env;
          scene.environmentIntensity = 0.78;
          if (scene.environmentRotation) scene.environmentRotation.y = 0.6;
          if (prev && prev.dispose) prev.dispose();
          CelPBR.hdri = true;
          if (onDone) onDone(true);
        },
        undefined,
        () => onDone && onDone(false),
      );
    });
  }

  return {
    detail,
    refineUVs,
    install,
    loadHDRI,
    setAnisotropy: (a) => (anisotropy = a),
    loaded: 0,
    failed: 0,
    hdri: false,
  };
})();
CelPBR.install();
window.CelPBR = CelPBR;
