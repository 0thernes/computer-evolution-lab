// Main 3D Studio Application Orchestrator, Camera Rig, Cross-Section Slicer, Raycast Inspector, & Render Loop
(() => {
  const $ = (sel) => document.querySelector(sel);
  const queryParams = new URLSearchParams(location.search);
  const canvas = $("#gl");

  // Verify WebGL availability up front with clear user-facing diagnostics
  if (
    !(() => {
      try {
        const probe = document.createElement("canvas");
        return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
      } catch {
        return false;
      }
    })()
  ) {
    if (window.__labFail) {
      window.__labFail(
        "WebGL is not available",
        "This browser or viewer cannot create a WebGL context (it may be disabled, blocked by policy, or the GPU driver is blacklisted).\nTry another browser, enable hardware acceleration, or update the graphics driver.",
      );
    }
    throw new Error("WebGL unavailable");
  }

  // ---- 1. Calibrated 4K HDR WebGL2 Renderer & Studio Lighting ----
  const renderer = new Zl({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.toneMapping = Sa; // ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.96; // Calibrated to preserve ceramic, glass & LED color saturation
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = wu; // PCFSoftShadowMap

  const scene = new Ni();
  scene.background = new Ae(0x090d14);
  scene.fog = new pa(0x090d14, 24, 62);

  const pmrem = new so(renderer);
  scene.environment = pmrem.fromScene(buildStudioEnvironmentScene(), 0.032).texture;
  scene.environmentIntensity = 0.68;

  const camera = new oi(40, 1, 0.01, 400);
  const controls = new zu(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.autoRotateSpeed = 1.15;

  // Balanced 3-point studio lighting + sky/ground fill
  scene.add(new ba(0xcfe4ff, 0x1e2634, 0.46));

  const keyLight = new ur(0xfff5e8, 1.42);
  keyLight.position.set(6.5, 10.5, 7.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.radius = 3.5;
  Object.assign(keyLight.shadow.camera, {
    left: -8.5,
    right: 8.5,
    top: 8.5,
    bottom: -8.5,
    near: 1,
    far: 42,
  });
  keyLight.shadow.bias = -0.00035;
  keyLight.shadow.normalBias = 0.018;
  scene.add(keyLight);

  const rimLight = new ur(0x88ccff, 0.52);
  rimLight.position.set(-6.5, 4.5, -5.5);
  scene.add(rimLight);

  const fillLight = new ur(0xffcc99, 0.36);
  fillLight.position.set(-2.5, 6.0, -9.0);
  scene.add(fillLight);

  // Multi-scale derivative-antialiased metric laboratory floor
  const studioFloor = createMetricStudioFloor();
  scene.add(studioFloor.group);

  // 16-bit HalfFloat MSAA post-processing composer + real-time 3D Cross-Section Slicer
  const fx = new Qu(renderer, scene, camera, keyLight);
  const slicer = new CrossSectionSlicer(renderer, scene);

  // ---- 2. Instantiate All 17 Functional Machines ----
  const factories = [zm, qm, Wm, Xm, Zm, Km, Jm, o1, l1, c1, d1, p1, M1, y1, g1, S1, A1];
  const frontierSet = new Set(["m6502", "quantum", "bci", "photonic", "alife"]);
  const machines = [];
  const diagCanvas = $("#diag");

  const sharedCtx = {
    THREE: Xt,
    renderer,
    scene,
    camera,
    controls,
    $,
    diagram: null,
    toast,
  };

  for (const makeMachine of factories) {
    const m = makeMachine();
    if (frontierSet.has(m.id)) m.group = "center";
    const holder = new ft();
    const root = new ft();
    holder.add(root);
    const kit = new Hu(root);
    m.kit = kit;
    m.holder = holder;
    m.root = root;

    try {
      m.build(kit, Xt, sharedCtx);
    } catch (err) {
      console.error("Machine build failed:", m.id, err);
    }

    // Populate high-detail multi-piece SMD components on every marked PCB mesh
    {
      let pcbIdx = 1;
      const pcbMeshes = [];
      root.traverse((obj) => {
        if (
          obj.isMesh &&
          !obj.isInstancedMesh &&
          obj.material &&
          obj.material.userData &&
          obj.material.userData.pcb
        ) {
          pcbMeshes.push(obj);
        }
      });
      for (const pcbMesh of pcbMeshes) {
        Dy(pcbMesh, pcbIdx++ * 31 + machines.length);
      }
    }

    if (m.view0 === undefined) {
      m.view0 = { pc00: 0.6, pc10: 0.6, pc20: 0.58 }[m.id] || 0;
    }

    const bounds = new li().setFromObject(root);
    const size = bounds.getSize(new N());
    const center = bounds.getCenter(new N());
    root.position.set(-center.x, -bounds.min.y, -center.z);
    m.size = size;
    m.focusScale = 4 / Math.max(size.x, size.y, size.z);
    m.diag = new Ra(m.diagram.nodes, m.diagram.edges);
    scene.add(holder);
    machines.push(m);
  }

  slicer.attachToMachines(machines);

  const byId = Object.fromEntries(machines.map((m) => [m.id, m]));

  // Wire 2D architecture diagram pulses to authentic hardware acoustic SFX
  Ra.hook = (diag, fromId, toId) => {
    if (!activeMachine || diag !== activeMachine.diag || !Ut.ok) return;
    const sfxSpec = Qy(activeMachine.id, fromId, toId);
    if (sfxSpec) hi(sfxSpec[0], sfxSpec[1]);
  };

  const historyRing = machines.filter((m) => m.group !== "center");
  const frontierCircle = machines.filter((m) => m.group === "center");

  // ---- 3. Hub Gallery Pedestal & Concentric Light Rings ----
  const hubStage = new ft();
  scene.add(hubStage);
  {
    const dais = new B(
      new ke(2.15, 2.35, 0.085, 72),
      new et({
        color: 0x18202c,
        roughness: 0.36,
        metalness: 0.68,
        emissive: 0xff8a30,
        emissiveIntensity: 0.04,
      }),
    );
    dais.position.y = 0.042;
    dais.receiveShadow = true;
    hubStage.add(dais);

    const coreRim = new B(
      new Pi(2.24, 0.03, 12, 120),
      new et({ color: 0x1a140a, emissive: 0xffa638, emissiveIntensity: 0.72 }),
    );
    coreRim.rotation.x = Math.PI / 2;
    coreRim.position.y = 0.09;
    hubStage.add(coreRim);

    const innerRing = new B(
      new Pi(4.6, 0.018, 8, 144),
      new et({ color: 0x081822, emissive: 0x58c4ff, emissiveIntensity: 0.52 }),
    );
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.02;
    hubStage.add(innerRing);

    const outerRing = new B(
      new Pi(9.5, 0.015, 8, 192),
      new et({ color: 0x101824, emissive: 0x7aa2d4, emissiveIntensity: 0.28 }),
    );
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = 0.02;
    hubStage.add(outerRing);
    hubStage.userData.rim = coreRim;
  }

  // ---- 4. Era Timeline Navigation Bar ----
  const timelineEl = $("#timeline");
  const makeTimelineBtn = (item) =>
    q(
      "button",
      {
        "data-id": item.id,
        class: item.group === "center" ? "ctr" : "",
        onclick: () => selectMachine(item.id),
      },
      q("span", { class: "y" }, item.era),
      item.short,
    );

  timelineEl.append(
    makeTimelineBtn({
      id: "hub",
      era: "HUB",
      short: `All ${machines.length + 1} · Gallery`,
    }),
    q("span", { class: "tl-sep" }, "RING · history"),
    ...historyRing.map(makeTimelineBtn),
    q("span", { class: "tl-sep ctr" }, "CENTER · frontier"),
    ...frontierCircle.map(makeTimelineBtn),
  );

  // ---- 5. Selection, Camera Flight, Cutaway, Explode & Slicer State ----
  let activeMachine = null;
  let cutawayOn = false;
  let explodeTarget = 0;
  let labelsOn = false;
  let cutawayCur = 0;
  let explodeCur = 0;
  let camTween = null;

  const raycaster = new va();
  const pointerNdc = new ye();

  const selectedBoxHelper = new xo(undefined, 0x58c4ff);
  selectedBoxHelper.visible = false;
  scene.add(selectedBoxHelper);

  const hoverBoxHelper = new xo(undefined, 0xffb347);
  hoverBoxHelper.visible = false;
  scene.add(hoverBoxHelper);

  let layerHelpers = [];
  let highlightedParts = [];
  let selectedPart = null;
  let hoveredObj = null;

  function layoutHubGallery() {
    hubStage.visible = true;
    historyRing.forEach((m, idx) => {
      const ang = (idx / historyRing.length) * Math.PI * 2 - Math.PI / 2;
      const sc = 2.3 / Math.max(m.size.x, m.size.y, m.size.z);
      m.holder.visible = true;
      m.holder.scale.setScalar(sc);
      m.holder.position.set(Math.cos(ang) * 9.5, 0, Math.sin(ang) * 9.5);
      m.holder.rotation.y = -ang - Math.PI / 2;
    });

    const orbitFrontier = frontierCircle.filter((m) => m.id !== "m6502");
    orbitFrontier.forEach((m, idx) => {
      const ang = (idx / orbitFrontier.length) * Math.PI * 2 + Math.PI / 4;
      const sc = 2.0 / Math.max(m.size.x, m.size.y, m.size.z);
      m.holder.visible = true;
      m.holder.scale.setScalar(sc);
      m.holder.position.set(Math.cos(ang) * 4.6, 0, Math.sin(ang) * 4.6);
      m.holder.rotation.y = -ang - Math.PI / 2;
    });

    const core6502 = byId.m6502;
    if (core6502) {
      core6502.holder.visible = true;
      core6502.holder.scale.setScalar(
        3.4 / Math.max(core6502.size.x, core6502.size.y, core6502.size.z),
      );
      core6502.holder.position.set(0, 0.08, 0);
      core6502.holder.rotation.y = 0;
    }
  }

  function computeMachineHomePose(m, preset = "iso") {
    const sc = m.focusScale;
    const scaled = m.size.clone().multiplyScalar(sc);
    const dist = Math.max(scaled.x, scaled.y * 1.3, scaled.z) * 1.52 + 1.45;
    const target = new N(0, scaled.y * 0.45, 0);
    const yaw = m.view0 || 0;
    let offset;
    if (preset === "front") {
      offset = new N(0, dist * 0.24, dist * 1.02).applyAxisAngle(new N(0, 1, 0), yaw);
    } else if (preset === "top") {
      offset = new N(0.01, dist * 1.18, dist * 0.14).applyAxisAngle(new N(0, 1, 0), yaw);
    } else if (preset === "macro") {
      offset = new N(dist * 0.22, dist * 0.2, dist * 0.34).applyAxisAngle(
        new N(0, 1, 0),
        yaw,
      );
    } else {
      offset = new N(dist * 0.55, dist * 0.42, dist * 0.85).applyAxisAngle(
        new N(0, 1, 0),
        yaw,
      );
    }
    return { pos: target.clone().add(offset), target };
  }

  function setViewPreset(preset = "iso", instant = false) {
    if (!activeMachine) {
      if (preset === "top") {
        flyCamera(new N(0, 28, 0.5), new N(0, 0, 0), instant ? 0 : 0.75);
      } else {
        flyCamera(new N(0, 21, 17.5), new N(0, 0, 0.6), instant ? 0 : 0.75);
      }
      return;
    }
    controls.minDistance = 0.22; // Allow deep 10× macro zoom inspection!
    controls.maxDistance = 42;
    const pose = computeMachineHomePose(activeMachine, preset);
    flyCamera(pose.pos, pose.target, instant ? 0 : 0.75);
  }

  function flyCamera(pos, target, dur = 0.85) {
    if (!dur) {
      camera.position.copy(pos);
      controls.target.copy(target);
      controls.update();
      camTween = null;
      return;
    }
    camTween = {
      p0: camera.position.clone(),
      t0: controls.target.clone(),
      p1: pos.clone(),
      t1: target.clone(),
      k: 0,
      dur,
    };
  }

  controls.addEventListener("start", () => {
    camTween = null;
  });

  function flyToObjects(objs, explicitDir) {
    if (!objs.length) return;
    const box = new li();
    objs.forEach((o) => box.expandByObject(o));
    if (box.isEmpty()) return;
    const center = box.getCenter(new N());
    const radius = Math.max(0.28, box.getSize(new N()).length() * 0.5);
    const curDir = camera.position.clone().sub(controls.target).normalize();
    const dist = Math.max(1.6, (radius / Math.sin(wa.degToRad(camera.fov / 2))) * 1.48);
    const up = new N(0, 1, 0);
    const probeRay = new va();
    let bestDir = curDir;

    if (explicitDir) {
      bestDir = explicitDir.clone().normalize();
    } else if (activeMachine) {
      for (const deg of [0, 45, -45, 90, -90, 135, -135, 180]) {
        const cand = curDir.clone().applyAxisAngle(up, wa.degToRad(deg));
        probeRay.set(center, cand);
        probeRay.far = dist;
        const blocked = probeRay
          .intersectObject(activeMachine.holder, true)
          .some((hit) => {
            const obj = hit.object;
            if (obj.userData.keep || !obj.isMesh) return false;
            for (let p = obj; p; p = p.parent) if (!p.visible) return false;
            if (cutawayOn && obj.userData.shellMesh) return false;
            const mat = obj.material;
            return !(mat && mat.transparent && mat.opacity < 0.5);
          });
        if (!blocked) {
          bestDir = cand;
          break;
        }
      }
    }
    flyCamera(center.clone().add(bestDir.multiplyScalar(dist)), center, 0.85);
  }

  function selectMachine(id) {
    if (activeMachine && activeMachine.leave) activeMachine.leave();
    stopTour();
    closePartCard();
    hoveredObj = null;
    hoverBoxHelper.visible = false;
    highlightParts([]);

    document.querySelectorAll("#timeline button").forEach((btn) => {
      const isOn = btn.dataset.id === id;
      btn.classList.toggle("on", isOn);
      if (isOn) btn.scrollIntoView({ inline: "center", block: "nearest" });
    });

    const muiEl = $("#mui");
    muiEl.innerHTML = "";
    const layersEl = $("#layers");
    layersEl.innerHTML = "";

    if (id === "hub") {
      activeMachine = null;
      layoutHubGallery();
      cutawayOn = false;
      explodeTarget = 0;
      slicer.apply(null);
      syncToolbar();
      Ut.setMachine("hub");
      syncAudioUi();
      controls.minDistance = 1.2;
      controls.maxDistance = 62;
      flyCamera(new N(0, 21, 17.5), new N(0, 0, 0.6), 0);
      $("#p-era").textContent = "Gallery";
      $("#p-title").textContent = "Computer Evolution Lab";
      (($("#p-blurb").textContent =
        `${machines.length} operational computers + this gallery = ${machines.length + 1} live 3D scenes. The outer chronological ring spans 1936–2020s from Turing's tape machine and Zuse's mechanical Z1 through vacuum tubes, core-memory minicomputers, home microcomputers, and our dual-engine RISC-V + WebGL2 Modern Mini PC to the 4-GPU AI supercomputer. The inner frontier circle surrounds the MOS 6502 with NMR quantum spin computing, living DishBrain biological neurons, nanophotonic interference meshes, and wet reaction-diffusion / DNA logic. Every machine genuinely computes in real time.`),
        buildHubDiagram());
      muiEl.append(buildHubCards());
      rebuildLabels();
      history.replaceState(null, "", location.search + "#hub");
      return;
    }

    const m = byId[id];
    if (!m) return;

    activeMachine = m;
    Ut.setMachine(id);
    syncAudioUi();
    for (const item of machines) item.holder.visible = item === m;
    hubStage.visible = false;

    m.holder.position.set(0, 0, 0);
    m.holder.rotation.set(0, 0, 0);
    m.holder.scale.setScalar(m.focusScale);
    setViewPreset("iso", true);

    $("#p-era").textContent = `${m.era} · ${m.short}`;
    $("#p-title").textContent = m.name;
    $("#p-blurb").textContent = m.blurb;
    sharedCtx.diagram = m.diag;

    if (!m._ui) {
      m._ui = q("div");
      try {
        m.ui(m._ui, sharedCtx);
      } catch (err) {
        console.error("UI init failed:", m.id, err);
        m._ui.append(q("div", { class: "err" }, String(err)));
      }
    }
    if (!m._layers) {
      try {
        m._layers = new f0(m, sharedCtx, layerBridge);
        m._layers.set("hw", -1);
      } catch (err) {
        console.error("Layers init failed:", m.id, err);
      }
    }

    if (m._layers) layersEl.append(m._layers.el);
    muiEl.append(m._ui);
    if (m.enter) m.enter(sharedCtx);

    cutawayOn = false;
    explodeTarget = 0;
    slicer.apply(activeMachine);
    syncToolbar();
    rebuildLabels();
    history.replaceState(null, "", location.search + "#" + id);
  }

  const layerBridge = {
    apply(spec) {
      if (!spec) {
        highlightParts([]);
        return;
      }
      cutawayOn = !!spec.cut;
      explodeTarget = spec.exp;
      syncToolbar();
      highlightParts(spec.parts, spec.color);
      if (spec.fly && spec.parts.length) flyToObjects(spec.parts);
      else if (activeMachine) setViewPreset("iso");
    },
    focus(part) {
      flyToObjects([part]);
      openPartCard(part);
    },
  };

  function highlightParts(parts, hexColor = 0xffb347) {
    for (const prev of highlightedParts) {
      prev.traverse((o) => {
        o.userData.keep = false;
      });
    }
    for (const next of parts) {
      next.traverse((o) => {
        o.userData.keep = true;
      });
    }
    highlightedParts = parts;
    layerHelpers.forEach((h) => (h.visible = false));
    applyCutawayOpacity(cutawayCur);

    parts.slice(0, 40).forEach((part, idx) => {
      let helper = layerHelpers[idx];
      if (!helper) {
        helper = new xo(undefined, hexColor);
        helper.material.transparent = true;
        helper.material.depthTest = false;
        helper.renderOrder = 5;
        scene.add(helper);
        layerHelpers[idx] = helper;
      }
      helper.material.color.set(hexColor);
      helper.setFromObject(part);
      helper.visible = true;
      helper.userData.p = part;
    });
    rebuildLabels();
  }

  let hubDiagram;
  function buildHubDiagram() {
    const palette = [
      "#e8d9a8",
      "#c9a45c",
      "#ffb347",
      "#ff7a1a",
      "#58c4ff",
      "#ff5f5f",
      "#a0e060",
      "#c9b07a",
      "#7ab0ff",
      "#62d0c0",
      "#c08cff",
      "#76b900",
    ];
    const rowCols = Math.ceil(historyRing.length / 2);
    const nodes = historyRing.map((m, idx) => ({
      id: m.id,
      label: m.era,
      x: 0.06 + (idx % rowCols) * (0.88 / (rowCols - 1)),
      y: idx < rowCols ? 0.14 : 0.42,
      w: 0.118,
      h: 0.17,
      color: palette[idx % palette.length],
    }));

    const ctrColors = {
      m6502: "#ffb347",
      quantum: "#8fe3ff",
      bci: "#ff8ab0",
      photonic: "#ff5f5f",
      alife: "#06d6a0",
    };
    const ctrX = [0.14, 0.32, 0.5, 0.68, 0.86];
    const orderedCtr = ["quantum", "bci", "m6502", "photonic", "alife"].filter(
      (id) => byId[id],
    );
    orderedCtr.forEach((id, idx) =>
      nodes.push({
        id,
        label:
          (id === "m6502" ? "★ " : "") + byId[id].short.split(" ").slice(0, 2).join(" "),
        x: ctrX[idx],
        y: id === "m6502" ? 0.8 : 0.82,
        w: id === "m6502" ? 0.2 : 0.16,
        h: id === "m6502" ? 0.24 : 0.18,
        color: ctrColors[id],
      }),
    );

    const edges = historyRing.slice(1).map((m, idx) => [historyRing[idx].id, m.id]);
    for (const id of orderedCtr) {
      if (id !== "m6502") edges.push(["m6502", id]);
    }
    edges.push([historyRing[historyRing.length - 1].id, "m6502"]);
    hubDiagram = new Ra(nodes, edges);
    hubDiagram._edges = edges;
    sharedCtx.diagram = hubDiagram;
  }

  function buildHubCards() {
    const wrap = q(
      "div",
      {},
      q(
        "div",
        { class: "row" },
        q(
          "button",
          { class: "btn pri", onclick: () => Dc(selectMachine) },
          "📊 Compare the eras (G)",
        ),
        q(
          "button",
          { class: "btn", onclick: () => selectMachine("pc20") },
          "★ Open 2020s Mini PC",
        ),
        q("button", { class: "btn", onclick: openHelp }, "❔ Shortcuts (?)"),
      ),
    );
    const makeCard = (m) =>
      q(
        "div",
        {
          class: "box hubcard" + (m.id === "m6502" || m.id === "pc20" ? " core" : ""),
          onclick: () => selectMachine(m.id),
        },
        q(
          "div",
          {
            class: "sec-t",
            style: { color: m.group === "center" ? "#8fe3ff" : "#ffb347" },
          },
          `${m.era} · ${m.short}`,
        ),
        q("b", {}, m.name),
        q("div", { class: "small" }, m.blurb),
      );

    wrap.append(
      q("div", { class: "sec-t" }, "CENTER · the frontier (inner circle)"),
      ...frontierCircle.map(makeCard),
      q("div", { class: "sec-t" }, "RING · the history (outer ring, chronological)"),
      ...historyRing.map(makeCard),
    );
    return wrap;
  }

  function applyCutawayOpacity(amount) {
    for (const m of machines) {
      m.root.traverse((obj) => {
        if (!(obj.isMesh && obj.userData.shellMesh && obj.material)) return;
        if (!obj.userData._ownShellMat) {
          obj.material = Array.isArray(obj.material)
            ? obj.material.map((mt) => mt.clone())
            : obj.material.clone();
          obj.userData._ownShellMat = true;
        }
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        const amt = activeMachine === m && !obj.userData.keep ? amount : 0;
        for (const mat of mats) {
          if (mat.userData.o0 === undefined) {
            mat.userData.o0 = {
              t: mat.transparent,
              o: mat.opacity,
              d: mat.depthWrite,
            };
          }
          const needTrans = amt > 0.001 ? true : mat.userData.o0.t;
          if (mat.transparent !== needTrans) {
            mat.transparent = needTrans;
            mat.needsUpdate = true;
          }
          mat.opacity = mat.userData.o0.o + (0.1 - mat.userData.o0.o) * amt;
          mat.depthWrite = amt > 0.001 ? false : mat.userData.o0.d;
        }
        obj.castShadow = amt < 0.5;
      });
    }
  }

  function applyExplodeOffsets(amount) {
    for (const m of machines) {
      const amt = activeMachine === m ? amount : 0;
      for (const part of m.kit.parts) {
        part.position
          .copy(part.userData.base)
          .addScaledVector(part.userData.explode, amt);
      }
    }
    if (slicer.enabled && activeMachine) slicer.apply(activeMachine);
  }

  // ---- 6. Toolbar, Cross-Section Slicer & Camera Presets ----
  const sliceCtl = $("#slice-ctl");
  const sliceAxisSel = $("#tb-slice-axis");
  const sliceOffRange = $("#tb-slice-off");
  const sliceFlipBtn = $("#tb-slice-flip");

  function syncToolbar() {
    $("#tb-cut").classList.toggle("on", cutawayOn);
    $("#tb-exp").value = explodeTarget;
    $("#tb-lab").classList.toggle("on", labelsOn);
    $("#tb-spin").classList.toggle("on", controls.autoRotate);
    const sliceBtn = $("#tb-slice");
    if (sliceBtn) sliceBtn.classList.toggle("on", slicer.enabled);
    if (sliceCtl) sliceCtl.hidden = !slicer.enabled;
    if (sliceAxisSel) sliceAxisSel.value = slicer.axis;
    if (sliceOffRange) sliceOffRange.value = slicer.offset;
    if (sliceFlipBtn) sliceFlipBtn.classList.toggle("on", slicer.flip);
  }

  $("#tb-cut").onclick = () => {
    cutawayOn = !cutawayOn;
    syncToolbar();
    rebuildLabels();
  };
  $("#tb-exp").oninput = (ev) => {
    explodeTarget = +ev.target.value;
  };
  $("#tb-lab").onclick = () => {
    labelsOn = !labelsOn;
    syncToolbar();
    rebuildLabels();
  };
  $("#tb-spin").onclick = () => {
    controls.autoRotate = !controls.autoRotate;
    syncToolbar();
  };
  $("#tb-reset").onclick = () =>
    activeMachine ? setViewPreset("iso") : selectMachine("hub");
  $("#tb-tour").onclick = () => (tourState ? stopTour() : startTour());
  $("#tb-cmp").onclick = () => Dc(selectMachine);
  $("#tb-help").onclick = () => openHelp();

  // Cross-section slicer controls
  if ($("#tb-slice")) {
    $("#tb-slice").onclick = () => {
      if (!activeMachine) selectMachine("pc20");
      slicer.enabled = !slicer.enabled;
      slicer.apply(activeMachine);
      syncToolbar();
      toast(
        slicer.enabled
          ? `3D Cross-Section Slicer ON (${slicer.axis.toUpperCase()} plane)`
          : "3D Cross-Section Slicer OFF",
      );
    };
  }
  if (sliceAxisSel) {
    sliceAxisSel.onchange = (ev) => {
      slicer.axis = ev.target.value;
      slicer.apply(activeMachine);
    };
  }
  if (sliceOffRange) {
    sliceOffRange.oninput = (ev) => {
      slicer.offset = +ev.target.value;
      slicer.apply(activeMachine);
    };
  }
  if (sliceFlipBtn) {
    sliceFlipBtn.onclick = () => {
      slicer.flip = !slicer.flip;
      slicer.apply(activeMachine);
      syncToolbar();
    };
  }

  // Camera view preset buttons (Iso / Front / Top / Macro)
  document.querySelectorAll("[data-cam]").forEach((btn) => {
    btn.onclick = () => setViewPreset(btn.dataset.cam);
  });

  // Quality selector
  const qualitySel = $("#tb-q");
  for (const [k, cfg] of Object.entries(zs)) {
    qualitySel.append(q("option", { value: k }, cfg.label));
  }
  qualitySel.append(q("option", { value: "auto" }, "Auto (adaptive)"));
  qualitySel.onchange = () => {
    if (qualitySel.value === "auto") {
      fx.auto = true;
      fx.set("high", "auto");
    } else {
      fx.auto = false;
      fx.set(qualitySel.value, "manual");
    }
  };
  fx.onChange = (lvl, reason) => {
    qualitySel.value = fx.auto ? "auto" : lvl;
    if (reason && reason.startsWith("auto:")) {
      toast(`Quality lowered to ${lvl} (${reason.slice(6)})`);
    }
    window.__quality = lvl;
  };

  // ---- 7. Projected 3D Part & Hub Labels ----
  let activeLabels = [];
  function rebuildLabels() {
    const container = $("#labels");
    container.innerHTML = "";
    activeLabels = [];

    if (!activeMachine) {
      for (const m of machines) {
        const el = q(
          "div",
          { class: "lbl hub", onclick: () => selectMachine(m.id) },
          `${m.era} ${m.short}`,
        );
        container.append(el);
        activeLabels.push({
          el,
          obj: m.holder,
          off: new N(0, m.size.y * 1.05, 0),
          hub: true,
        });
      }
      return;
    }

    const candidates = labelsOn ? activeMachine.kit.parts : highlightedParts;
    const seen = new Set();
    for (const part of candidates) {
      const meta = part.userData.part;
      if (!meta || !meta.label || (meta.shell && cutawayOn) || seen.has(meta.name))
        continue;
      seen.add(meta.name);
      const worldCenter = new li().setFromObject(part).getCenter(new N());
      const el = q(
        "div",
        {
          class: "lbl" + (labelsOn ? "" : " hi"),
          onclick: () => layerBridge.focus(part),
        },
        meta.name,
      );
      container.append(el);
      activeLabels.push({
        el,
        obj: part,
        local: part.worldToLocal(worldCenter.clone()),
      });
    }
  }

  const projVec = new N();
  function updateLabelPositions() {
    const rect = canvas.getBoundingClientRect();
    const placed = [];
    for (const item of activeLabels) {
      if (item.hub) {
        projVec
          .copy(item.obj.position)
          .add(item.off.clone().multiplyScalar(item.obj.scale.x));
      } else {
        projVec.copy(item.local).applyMatrix4(item.obj.matrixWorld);
      }
      projVec.project(camera);
      const onScreen =
        projVec.z < 1 && Math.abs(projVec.x) < 1.05 && Math.abs(projVec.y) < 1.05;
      let sx = ((projVec.x + 1) / 2) * rect.width;
      let sy = ((1 - projVec.y) / 2) * rect.height;
      if (onScreen) {
        for (let iter = 0; iter < 6; iter++) {
          const overlap = placed.find(
            (p) => Math.abs(p[0] - sx) < 92 && Math.abs(p[1] - sy) < 18,
          );
          if (!overlap) break;
          sy = overlap[1] + 19;
        }
        placed.push([sx, sy]);
      }
      item.el.style.display = onScreen ? "" : "none";
      if (onScreen) {
        item.el.style.left = sx + "px";
        item.el.style.top = sy + "px";
      }
    }
  }

  // ---- 8. Raycasting, Part Inspection Card & Hover Tooltip ----
  function pickAtEvent(ev) {
    const rect = canvas.getBoundingClientRect();
    pointerNdc.set(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointerNdc, camera);
    const roots = activeMachine ? [activeMachine.holder] : machines.map((m) => m.holder);
    const hits = raycaster.intersectObjects(roots, true);

    for (const hit of hits) {
      // Respect active cross-section clipping plane when picking!
      if (
        slicer.enabled &&
        activeMachine &&
        slicer.plane.distanceToPoint(hit.point) < 0
      ) {
        continue;
      }
      const obj = hit.object;
      let vis = true;
      for (let p = obj; p; p = p.parent) {
        if (!p.visible) {
          vis = false;
          break;
        }
      }
      if (!vis || (cutawayCur > 0.5 && obj.userData.shellMesh)) continue;

      let partNode = null;
      let machNode = null;
      for (let p = obj; p; p = p.parent) {
        if (
          !partNode &&
          p.userData.part &&
          !(cutawayCur > 0.5 && p.userData.part.shell)
        ) {
          partNode = p;
        }
        const foundMach = machines.find((m) => m.holder === p);
        if (foundMach) {
          machNode = foundMach;
          break;
        }
      }
      if (!activeMachine) return { mach: machNode };
      if (partNode) return { part: partNode, hit };
    }
    return null;
  }

  let downPos = null;
  canvas.addEventListener("pointerdown", (ev) => {
    downPos = [ev.clientX, ev.clientY];
  });
  canvas.addEventListener("pointerup", (ev) => {
    if (!downPos || Math.hypot(ev.clientX - downPos[0], ev.clientY - downPos[1]) > 5)
      return;
    const picked = pickAtEvent(ev);
    if (!picked) {
      closePartCard();
      return;
    }
    if (picked.mach) {
      selectMachine(picked.mach.id);
      return;
    }
    if (!(
      activeMachine &&
      activeMachine.onPick &&
      activeMachine.onPick(picked.part, picked.hit, sharedCtx)
    )) {
      openPartCard(picked.part);
      if (ev.detail >= 2) flyToObjects([picked.part]);
    }
  });
  canvas.addEventListener("dblclick", (ev) => {
    const picked = pickAtEvent(ev);
    if (picked && picked.part) flyToObjects([picked.part]);
  });

  let lastHoverMs = 0;
  const tipEl = $("#tip");
  canvas.addEventListener("pointermove", (ev) => {
    const now = performance.now();
    if (now - lastHoverMs < 45) return;
    lastHoverMs = now;
    const picked = pickAtEvent(ev);
    const targetObj = picked && (picked.part || picked.mach?.holder);
    if (targetObj !== hoveredObj) {
      hoveredObj = targetObj;
      hoverBoxHelper.visible = !!targetObj;
      if (targetObj) hoverBoxHelper.setFromObject(targetObj);
      canvas.style.cursor = targetObj ? "pointer" : "";
    }
    if (targetObj) {
      const rect = canvas.getBoundingClientRect();
      tipEl.hidden = false;
      tipEl.textContent = picked.part
        ? picked.part.userData.part.name
        : `${picked.mach.era} · ${picked.mach.name}`;
      tipEl.style.left = ev.clientX - rect.left + 14 + "px";
      tipEl.style.top = ev.clientY - rect.top + 12 + "px";
    } else {
      tipEl.hidden = true;
    }
  });
  canvas.addEventListener("pointerleave", () => {
    tipEl.hidden = true;
  });

  function renderPartLayerChips(part) {
    if (!activeMachine || !activeMachine.kit) return "";
    const data = activeMachine._layers && activeMachine._layers.data;
    if (!data) return "";
    const name = part.userData.part.name;
    const chips = [];
    data.hw.forEach((l, idx) => {
      if (l.p && l.p.test(name)) {
        chips.push(
          `<button class="chip" data-s="hw" data-i="${idx}">⚙ ${_c[idx]}</button>`,
        );
      }
    });
    data.sw.forEach((l, idx) => {
      if (l.p && l.p.test(name)) {
        chips.push(
          `<button class="chip sw" data-s="sw" data-i="${idx}">⌨ ${Cc[idx]}</button>`,
        );
      }
    });
    return chips.length
      ? `<div class="ltags"><span class="small">Appears in layers:</span> ${chips.join(" ")}</div>`
      : "";
  }

  function openPartCard(part) {
    selectedPart = part;
    const meta = part.userData.part;
    const card = $("#card");
    card.hidden = false;
    card.querySelector("h3").textContent = meta.name;
    card.querySelector(".body").innerHTML =
      (meta.info || '<span class="small">Structural assembly component.</span>') +
      (meta.live ? '<div class="live"></div>' : "") +
      renderPartLayerChips(part);
    card
      .querySelectorAll(".ltags .chip")
      .forEach(
        (btn) =>
          (btn.onclick = () => activeMachine._layers.set(btn.dataset.s, +btn.dataset.i)),
      );
    selectedBoxHelper.setFromObject(part);
    selectedBoxHelper.visible = true;
  }

  function closePartCard() {
    $("#card").hidden = true;
    selectedPart = null;
    selectedBoxHelper.visible = false;
  }

  $("#card-x").onclick = closePartCard;
  sharedCtx.openCard = openPartCard;

  // ---- 9. Guided Layer Tour ----
  let tourState = null;
  function startTour() {
    if (!activeMachine) selectMachine("pc20");
    const m = activeMachine;
    const steps = [];
    steps.push({
      title: m.name,
      text: m.blurb,
      run: () => {
        m._layers.set("hw", -1);
        setViewPreset("iso");
      },
    });
    _c.forEach((name, idx) =>
      steps.push({
        title: `Hardware ${idx}: ${name}`,
        text: m._layers.data.hw[idx].t,
        run: () => m._layers.set("hw", idx),
      }),
    );
    Cc.forEach((name, idx) =>
      steps.push({
        title: `Software ${idx}: ${name}`,
        text: m._layers.data.sw[idx].t,
        run: () => m._layers.set("sw", idx),
      }),
    );
    steps.push({
      title: "Interactive Lab Mode",
      text: "Edit the live code, toggle the 3D Cross-Section Slicer (X), or zoom in 10× to inspect every silicon die and component.",
      run: () => {
        m._layers.set("hw", -1);
        setViewPreset("iso");
      },
    });
    tourState = { steps, i: 0, t: 0, m };
    $("#tb-tour").classList.add("on");
    applyTourStep();
  }

  function applyTourStep() {
    const step = tourState.steps[tourState.i];
    step.run();
    const box = $("#tourbox");
    box.hidden = false;
    box.querySelector(".tt").textContent =
      `${tourState.i + 1}/${tourState.steps.length} · ${step.title}`;
    box.querySelector(".tx").textContent = step.text;
    tourState.t = 0;
    const layers = activeMachine && activeMachine._layers;
    if (layers) layers.el.scrollIntoView({ block: "nearest" });
  }

  function stepTour(delta) {
    if (!tourState) return;
    tourState.i += delta;
    if (tourState.i < 0) tourState.i = 0;
    if (tourState.i >= tourState.steps.length) {
      stopTour();
      return;
    }
    applyTourStep();
  }

  function stopTour() {
    if (!tourState) return;
    tourState = null;
    $("#tourbox").hidden = true;
    $("#tb-tour").classList.remove("on");
  }

  $("#tour-prev").onclick = () => stepTour(-1);
  $("#tour-next").onclick = () => stepTour(1);
  $("#tour-stop").onclick = stopTour;
  $("#tour-pause").onclick = (ev) => {
    if (!tourState) return;
    tourState.paused = !tourState.paused;
    ev.target.textContent = tourState.paused ? "▶" : "❚❚";
  };

  // ---- 10. Cinematic Orchestral Audio UI & Score Selector ----
  for (const evName of ["pointerdown", "keydown", "touchstart"]) {
    window.addEventListener(
      evName,
      () => {
        if (!Ut.ac || Ut.ac.state !== "running") {
          Ut.start();
          syncAudioUi();
        }
      },
      { capture: true, passive: true },
    );
  }

  const audioBtn = $("#tb-audio");
  const audioPop = $("#audiopop");

  function syncAudioUi() {
    if (!audioBtn) return;
    document.querySelectorAll("#audiopop input[data-k]").forEach((inp) => {
      inp.checked = !!Ut[inp.dataset.k];
    });
    const themeSel = $("#ap-theme");
    if (themeSel) themeSel.value = Ut.scoreOverride || "auto";
    audioBtn.textContent = Ut.muted ? "🔇" : "🔊";
    audioBtn.classList.toggle("on", !Ut.muted && Ut.ok);

    const trackEl = $("#ap-track");
    if (trackEl) {
      const mId = activeMachine ? activeMachine.id : "hub";
      const info = us[mId] || us.hub;
      const np = Ut.nowPlaying;
      trackEl.textContent =
        `♪ ${Yy(mId)} — ${info.mood}` +
        (np && np.chord ? ` · [${np.chord} · ${np.bpm} BPM]` : "");
    }
    const stateEl = $("#ap-state");
    if (stateEl) {
      stateEl.textContent = Ut.ok
        ? `Concert Hall Engine ${Ut.state}` + (Ut.muted ? " · muted" : "")
        : Ut.stats.blocked
          ? "Audio unavailable: " + Ut.stats.blocked
          : "Starts automatically on your first click or key press.";
    }
  }

  function buildAudioPopover() {
    const makeSlider = (key, label) =>
      q(
        "label",
        { class: "aprow" },
        q("span", {}, label),
        q("input", {
          type: "range",
          min: 0,
          max: 1,
          step: 0.01,
          value: Ut.vol[key],
          "aria-label": label + " volume",
          oninput: (ev) => Ut.set(key, ev.target.value),
        }),
      );
    const makeCheck = (key, label) => {
      const inp = q("input", {
        type: "checkbox",
        "data-k": key,
        onchange: (ev) => {
          Ut.set(key, ev.target.checked);
          syncAudioUi();
        },
      });
      inp.checked = !!Ut[key];
      return q("label", { class: "aprow" }, inp, " " + label);
    };

    const scoreSelect = q(
      "select",
      {
        id: "ap-theme",
        style: { width: "100%", margin: "4px 0 6px" },
        onchange: (ev) => {
          Ut.start();
          Ut.set("scoreOverride", ev.target.value);
          syncAudioUi();
        },
      },
      ...SCORE_THEMES.map(([val, title]) =>
        q("option", { value: val, selected: Ut.scoreOverride === val }, title),
      ),
    );

    audioPop.append(
      q("div", { class: "sec-t" }, "Orchestral Score & Hardware Acoustics"),
      q("div", { id: "ap-track", class: "small" }),
      q("div", { id: "ap-state", class: "small dim" }),
      q(
        "div",
        { class: "sec-t", style: { marginTop: "6px" } },
        "Composer / Score Palette",
      ),
      scoreSelect,
      makeSlider("master", "Master"),
      makeSlider("music", "Score"),
      makeSlider("sfx", "HW SFX"),
      makeCheck("muted", "Mute (M)"),
      makeCheck("boost", "Concert Boost (+8 dB soft-limited)"),
      q(
        "div",
        { class: "row" },
        q(
          "button",
          {
            class: "btn",
            onclick: () => {
              Ut.start();
              hi("relay", { v: 0.8 });
            },
          },
          "Test relay",
        ),
        q("button", { class: "btn", onclick: openSoundCredits }, "Sound credits"),
      ),
    );
  }

  function openSoundCredits() {
    if ($(".overlay.credits")) return;
    const ov = q("div", {
      class: "overlay credits",
      onclick: (ev) => {
        if (ev.target === ov) ov.remove();
      },
    });
    ov.append(
      q(
        "div",
        { class: "modal" },
        q("button", { class: "mx", onclick: () => ov.remove() }, "×"),
        q("h2", {}, "Orchestral Score & Hardware Sound Credits"),
        q("p", { class: "small" }, "Archival hardware recordings (Public Domain / CC0):"),
        q(
          "ul",
          { class: "small" },
          ...g0.real.map((r) =>
            q(
              "li",
              {},
              q("b", {}, r.use),
              ": ",
              r.title,
              " by ",
              r.author,
              " · ",
              r.license,
              " · ",
              q("a", { href: r.url, target: "_blank", rel: "noopener" }, "source"),
            ),
          ),
        ),
        q(
          "p",
          { class: "small" },
          `Real-time WebAudio physical & symphonic synthesis (${g0.synth.length} engines): ` +
            g0.synth.join("; ") +
            ".",
        ),
        q(
          "p",
          { class: "small" },
          "Music: every score is an ORIGINAL multi-bar composition voiced live in real time, inspired by the orchestral craft of Hans Zimmer, James Horner, Christopher Nolan's collaborations, Terrence Malick's symphonic palette, Oliver Stone, and Vangelis. No copyrighted melodies or recordings are used.",
        ),
      ),
    );
    document.body.append(ov);
  }

  if (audioBtn) {
    buildAudioPopover();
    audioBtn.onclick = (ev) => {
      ev.stopPropagation();
      Ut.start();
      audioPop.hidden = !audioPop.hidden;
      syncAudioUi();
    };
    document.addEventListener("pointerdown", (ev) => {
      if (!audioPop.hidden && !audioPop.contains(ev.target) && ev.target !== audioBtn) {
        audioPop.hidden = true;
      }
    });
  }
  Ut.onChange(syncAudioUi);

  // ---- 11. True 4K UHD (3840×2160) Snapshot Renderer ----
  function render4k(w = 3840, h = 2160, mime = "image/png", quality) {
    const maxTex = renderer.capabilities.maxTextureSize || 4096;
    const scale = Math.min(1, maxTex / Math.max(w, h));
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);

    const prevPr = renderer.getPixelRatio();
    const prevW = fx.w;
    const prevH = fx.h;
    const prevAspect = camera.aspect;

    renderer.setPixelRatio(1);
    fx.comp.setPixelRatio(1);
    fx.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fx.render();

    const dataUrl = canvas.toDataURL(mime, quality);

    renderer.setPixelRatio(prevPr);
    fx.comp.setPixelRatio(prevPr);
    fx.setSize(prevW, prevH);
    camera.aspect = prevAspect;
    camera.updateProjectionMatrix();
    fx.render();

    return { url: dataUrl, w, h };
  }

  const btn4k = $("#tb-4k");
  if (btn4k) {
    btn4k.onclick = () => {
      toast("Rendering 3840×2160 4K HDR PNG…");
      setTimeout(() => {
        try {
          const maxTex = renderer.capabilities.maxTextureSize || 4096;
          const scale = Math.min(1, maxTex / 3840);
          const w = Math.floor(3840 * scale);
          const h = Math.floor(2160 * scale);
          const prevPr = renderer.getPixelRatio();
          const prevW = fx.w;
          const prevH = fx.h;
          const prevAspect = camera.aspect;

          renderer.setPixelRatio(1);
          fx.comp.setPixelRatio(1);
          fx.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          fx.render();

          const stage = document.createElement("canvas");
          stage.width = w;
          stage.height = h;
          stage.getContext("2d").drawImage(canvas, 0, 0);

          renderer.setPixelRatio(prevPr);
          fx.comp.setPixelRatio(prevPr);
          fx.setSize(prevW, prevH);
          camera.aspect = prevAspect;
          camera.updateProjectionMatrix();
          fx.render();

          const mId = activeMachine ? activeMachine.id : "hub";
          stage.toBlob((blob) => {
            if (!blob) return;
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = `computer-evolution-lab-${mId}-${w}x${h}.png`;
            document.body.append(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
            toast(`Saved ${w}×${h} PNG`);
          }, "image/png");
        } catch (err) {
          toast("4K render failed: " + err.message);
        }
      }, 30);
    };
  }

  // ---- 12. Help Modal & Keyboard Shortcuts ----
  const shortcuts = [
    ["?", "Open this help & shortcut guide"],
    ["C", "Toggle shell cutaway transparency"],
    ["X", "Toggle real-time 3D Cross-Section Slicer plane"],
    ["E", "Toggle exploded assembly view"],
    ["1 / 2 / 3 / 4", "Camera presets: Isometric / Front / Top / Macro Zoom"],
    ["L", "Show all 3D part labels"],
    ["S", "Toggle turntable auto-spin"],
    ["R", "Reset camera view"],
    ["F", "Fly camera to selected part"],
    ["T", "Guided hardware/software layer tour"],
    ["G", "Compare eras (transistors, clock, memory, power)"],
    ["Q", "Cycle render quality (Low → Ultra 4K MSAA)"],
    ["M", "Mute / unmute orchestral score & hardware SFX"],
    ["[ / ]", "Step abstraction layer down / up"],
    ["\\", "Switch Hardware ↔ Software layer stack"],
    ["← / →", "Previous / next era machine"],
    ["H", "Return to the 18-scene Hub Gallery"],
    ["Esc", "Close part card / modal / tour"],
  ];

  function openHelp() {
    if ($(".overlay.help")) return;
    const ov = q("div", {
      class: "overlay help",
      onclick: (ev) => {
        if (ev.target === ov) ov.remove();
      },
    });
    ov.append(
      q(
        "div",
        { class: "modal" },
        q("button", { class: "mx", onclick: () => ov.remove() }, "×"),
        q("h2", {}, "How to Explore the Computer Evolution Lab"),
        q(
          "p",
          { class: "small" },
          "Every machine in this lab is a genuine, live-executing computer simulation — never a static animation. Drag to orbit, scroll to zoom right down to micron-scale silicon dies and SMD resistors, right-drag to pan, click any component to inspect live telemetry, or use the X/Y/Z Cross-Section Slicer to cut straight through any chassis.",
        ),
        q(
          "table",
          { class: "keys" },
          ...shortcuts.map(([k, desc]) =>
            q("tr", {}, q("td", {}, q("kbd", {}, k)), q("td", {}, desc)),
          ),
        ),
        q(
          "p",
          { class: "small" },
          `Active pipeline: ${zs[fx.level].label}${fx.auto ? " (adaptive)" : ""}.`,
        ),
      ),
    );
    document.body.append(ov);
  }

  document.addEventListener("keydown", (ev) => {
    const t = ev.target;
    if (
      (t &&
        t.closest &&
        t.closest("input,textarea,select,[contenteditable],[tabindex]") &&
        t !== document.body) ||
      ev.ctrlKey ||
      ev.metaKey ||
      ev.altKey
    ) {
      return;
    }
    const key = ev.key;
    const order = ["hub", ...machines.map((m) => m.id)];
    const curId = activeMachine ? activeMachine.id : "hub";
    const action =
      {
        "?": openHelp,
        F1: openHelp,
        c: () => $("#tb-cut").click(),
        x: () => $("#tb-slice") && $("#tb-slice").click(),
        e: () => {
          explodeTarget = explodeTarget > 0.05 ? 0 : 0.6;
          syncToolbar();
        },
        1: () => setViewPreset("iso"),
        2: () => setViewPreset("front"),
        3: () => setViewPreset("top"),
        4: () => setViewPreset("macro"),
        l: () => $("#tb-lab").click(),
        s: () => $("#tb-spin").click(),
        r: () => $("#tb-reset").click(),
        f: () => {
          if (selectedPart) flyToObjects([selectedPart]);
        },
        t: () => $("#tb-tour").click(),
        g: () => Dc(selectMachine),
        h: () => selectMachine("hub"),
        Home: () => selectMachine("hub"),
        m: () => {
          Ut.start();
          const muted = Ut.toggleMute();
          toast(muted ? "Sound muted (M)" : "Sound on (M)");
        },
        q: () => {
          const levels = ["low", "medium", "high", "ultra"];
          fx.auto = false;
          fx.set(levels[(levels.indexOf(fx.level) + 1) % levels.length], "manual");
          toast("Quality: " + zs[fx.level].label);
        },
        "[": () => activeMachine?._layers?.step(-1),
        "]": () => activeMachine?._layers?.step(1),
        "\\": () => {
          if (activeMachine?._layers) {
            const l = activeMachine._layers;
            l.set(l.stack === "hw" ? "sw" : "hw", Math.max(0, l.idx));
          }
        },
        ArrowRight: () => selectMachine(order[(order.indexOf(curId) + 1) % order.length]),
        ArrowLeft: () =>
          selectMachine(order[(order.indexOf(curId) - 1 + order.length) % order.length]),
        Escape: () => {
          const ov = document.querySelector(".overlay");
          if (ov) ov.remove();
          else if (tourState) stopTour();
          else closePartCard();
        },
      }[key.length === 1 ? key.toLowerCase() : key] || (key === "?" ? openHelp : null);

    if (action) {
      ev.preventDefault();
      action();
    }
  });

  // ---- 13. Responsive Viewport & Master 60 FPS Simulation Loop ----
  function handleResize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    fx.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(handleResize).observe(canvas.parentElement);
  handleResize();

  const clock = new fr();
  let elapsedTotal = 0;
  let loopPaused = false;
  let fpsWindowStart = performance.now();
  let fpsFrames = 0;
  let diagPollTimer = 0;
  let audioUiTimer = 0;
  window.__fps = 0;

  const easeInOutCubic = (x) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  function frameLoop() {
    if (loopPaused) {
      clock.getDelta();
      requestAnimationFrame(frameLoop);
      return;
    }
    const dt = Math.min(0.05, clock.getDelta());
    elapsedTotal += dt;
    fpsFrames++;

    {
      const now = performance.now();
      if (now - fpsWindowStart > 1000) {
        window.__fps = (fpsFrames * 1000) / (now - fpsWindowStart);
        fx.sample(window.__fps);
        fpsWindowStart = now;
        fpsFrames = 0;
      }
    }

    if (camTween) {
      camTween.k = Math.min(1, camTween.k + dt / camTween.dur);
      const u = easeInOutCubic(camTween.k);
      camera.position.lerpVectors(camTween.p0, camTween.p1, u);
      controls.target.lerpVectors(camTween.t0, camTween.t1, u);
      if (camTween.k >= 1) camTween = null;
    }
    controls.update();

    const smooth = 1 - Math.exp(-dt * 7.5);
    const targetCut = cutawayOn ? 1 : 0;
    if (Math.abs(cutawayCur - targetCut) > 0.002) {
      cutawayCur += (targetCut - cutawayCur) * smooth;
      if (Math.abs(cutawayCur - targetCut) < 0.004) cutawayCur = targetCut;
      applyCutawayOpacity(cutawayCur);
    }
    if (Math.abs(explodeCur - explodeTarget) > 0.001) {
      explodeCur += (explodeTarget - explodeCur) * smooth;
      if (Math.abs(explodeCur - explodeTarget) < 0.002) explodeCur = explodeTarget;
      applyExplodeOffsets(explodeCur);
      for (const h of layerHelpers) {
        if (h.visible) h.setFromObject(h.userData.p);
      }
    }

    if (activeMachine) {
      try {
        activeMachine.update(dt, elapsedTotal, sharedCtx);
      } catch (err) {
        if (!activeMachine._err) {
          console.error("Update error in", activeMachine.id, err);
          activeMachine._err = 1;
        }
      }
      for (const anim of activeMachine.kit.anims) anim(dt, elapsedTotal);
      if (activeMachine._layers) activeMachine._layers.draw(elapsedTotal);

      diagPollTimer += dt;
      if (diagPollTimer > 0.22 && Lm[activeMachine.id]) {
        diagPollTimer = 0;
        try {
          const vals = Lm[activeMachine.id](activeMachine);
          for (const [nodeId, text] of Object.entries(vals)) {
            if (activeMachine.diag.nodes[nodeId]) {
              activeMachine.diag.nodes[nodeId].val = text;
            }
          }
        } catch {}
      }

      if (tourState && !tourState.paused) {
        tourState.t += dt;
        if (tourState.t > 9) stepTour(1);
      }
    } else {
      for (const m of machines) {
        m.holder.rotation.y += dt * 0.14;
        if (m.idle) m.idle(dt, elapsedTotal);
        for (const anim of m.kit.anims) anim(dt, elapsedTotal);
      }
    }

    if (selectedPart) {
      selectedBoxHelper.setFromObject(selectedPart);
      const meta = selectedPart.userData.part;
      if (meta.live) {
        const liveEl = $("#card .live");
        if (liveEl) {
          const txt = meta.live();
          if (liveEl.textContent !== txt) liveEl.textContent = txt;
        }
      }
    }
    if (hoveredObj && hoverBoxHelper.visible) {
      hoverBoxHelper.setFromObject(hoveredObj);
    }

    const pulseAlpha = 0.55 + 0.45 * Math.sin(elapsedTotal * 4);
    for (const h of layerHelpers) {
      if (h.visible) h.material.opacity = pulseAlpha;
    }

    const activeDiag = sharedCtx.diagram;
    if (activeDiag) {
      const dctx = yt(diagCanvas);
      activeDiag.draw(dctx, diagCanvas.width, diagCanvas.height, dt);
    }
    if (!activeMachine && hubDiagram && hubDiagram._edges && Math.random() < dt * 3) {
      const edge =
        hubDiagram._edges[Math.floor(Math.random() * hubDiagram._edges.length)];
      hubDiagram.pulse(edge[0], edge[1], edge[0] === "m6502" ? "#8fe3ff" : "#ffb347");
    }
    if (!activeMachine && hubStage.userData.rim) {
      hubStage.userData.rim.material.emissiveIntensity =
        0.65 + 0.25 * Math.sin(elapsedTotal * 2);
    }

    try {
      Ut.tick(
        dt,
        activeMachine
          ? activeMachine.isRunning
            ? activeMachine.isRunning()
              ? 0.55
              : 0.08
            : 0.32
          : 0.18,
      );
      audioUiTimer += dt;
      if (audioUiTimer > 0.8 && audioPop && !audioPop.hidden) {
        audioUiTimer = 0;
        syncAudioUi();
      }
    } catch {}

    fx.render();
    updateLabelPositions();
    requestAnimationFrame(frameLoop);
  }

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2600);
  }

  $("#p-blurb").addEventListener("click", (ev) =>
    ev.currentTarget.classList.toggle("open"),
  );

  // Initialize quality level
  {
    const qParam = queryParams.get("q");
    fx.auto = queryParams.get("auto") !== "0" && !qParam;
    fx.set(
      zs[qParam] ? qParam : matchMedia("(max-width: 820px)").matches ? "medium" : "high",
      "init",
    );
  }

  // Expose full programmatic inspection & test harness API on window.LAB
  window.LAB = {
    audio: Ut,
    render4k,
    machines,
    byId,
    select: selectMachine,
    get active() {
      return activeMachine;
    },
    scene,
    camera,
    controls,
    renderer,
    fx,
    slicer,
    flyToObjects,
    flyCamera,
    setViewPreset,
    setCutaway(on, instant = false) {
      cutawayOn = !!on;
      if (instant) {
        cutawayCur = cutawayOn ? 1 : 0;
        applyCutawayOpacity(cutawayCur);
      }
      syncToolbar();
      rebuildLabels();
    },
    setExplode(amt, instant = false) {
      explodeTarget = Math.max(0, Math.min(1, +amt || 0));
      if (instant) {
        explodeCur = explodeTarget;
        applyExplodeOffsets(explodeCur);
      }
      syncToolbar();
    },
    setPaused(on) {
      loopPaused = !!on;
    },
    startTour,
    stopTour,
    get tour() {
      return tourState;
    },
    openCompare: () => Dc(selectMachine),
    openHelp,
    get cut() {
      return cutawayCur;
    },
    get exp() {
      return explodeCur;
    },
  };

  window.__labStarted = true;
  {
    const bootEl = $("#boot");
    if (bootEl) bootEl.remove();
  }

  const initialHash = location.hash.slice(1);
  selectMachine(
    initialHash && (byId[initialHash] || initialHash === "hub") ? initialHash : "hub",
  );
  requestAnimationFrame(frameLoop);
})();
