// 4K HDR 16-bit MSAA Post-Processing, Calibrated Studio Environment, Metric Shader Floor, & 3D Cross-Section Slicer

var zs = {
  low: {
    pr: 1,
    shadows: false,
    smap: 512,
    bloom: false,
    samples: 0,
    label: "Low (fast)",
  },
  medium: {
    pr: 1.25,
    shadows: true,
    smap: 1024,
    bloom: true,
    samples: 2,
    label: "Medium (HDR + 2× MSAA)",
  },
  high: {
    pr: 2,
    shadows: true,
    smap: 4096,
    bloom: true,
    samples: 4,
    label: "High (HDR + 4× MSAA + 4K shadows)",
  },
  ultra: {
    pr: 4,
    shadows: true,
    smap: 4096,
    bloom: true,
    samples: 4,
    label: "Ultra (Native 4K Supersampled + 4× MSAA)",
  },
};

var Qu = class StudioFX {
  constructor(renderer, scene, camera, sunLight) {
    this.r = renderer;
    this.scene = scene;
    this.camera = camera;
    this.sun = sunLight;
    this.level = "high";
    this.auto = true;
    this.hist = [];
    this.onChange = null;
    this.w = 1;
    this.h = 1;

    const isGL2 = !!(renderer.capabilities && renderer.capabilities.isWebGL2);
    const maxSamples = isGL2 ? Math.min(4, renderer.capabilities.maxSamples || 4) : 0;
    this.maxSamples = maxSamples;

    const rt = new kt(512, 512, {
      type: Oi, // THREE.HalfFloatType (16-bit linear HDR — zero 8-bit white clipping)
      samples: maxSamples,
    });
    rt.texture.name = "StudioFX.HDR_MSAA";

    this.comp = new Zu(renderer, rt);
    this.renderPass = new Yu(scene, camera);
    this.comp.addPass(this.renderPass);

    // Subtle optical halation only on genuine HDR emitters (> 1.16 linear radiance)
    this.bloom = new _a(new ye(512, 512), 0.22, 0.38, 1.16);
    this.comp.addPass(this.bloom);
    this.outputPass = new Ku();
    this.comp.addPass(this.outputPass);

    // Contrast-Adaptive 4K Optical Acutance + Cinema Lens Vignette (zero haloing!)
    this.lensPass = new Wu({
      uniforms: {
        tDiffuse: { value: null },
        uTexel: { value: new ye(1 / 1920, 1 / 1080) },
        uSharpness: { value: 0.34 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 uTexel;
        uniform float uSharpness;
        varying vec2 vUv;

        void main() {
          vec4 c = texture2D(tDiffuse, vUv);
          vec3 n = texture2D(tDiffuse, vUv + vec2(0.0, uTexel.y)).rgb;
          vec3 s = texture2D(tDiffuse, vUv - vec2(0.0, uTexel.y)).rgb;
          vec3 e = texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.0)).rgb;
          vec3 w = texture2D(tDiffuse, vUv - vec2(uTexel.x, 0.0)).rgb;

          vec3 mn = min(c.rgb, min(min(n, s), min(e, w)));
          vec3 mx = max(c.rgb, max(max(n, s), max(e, w)));
          vec3 blur = 0.25 * (n + s + e + w);
          vec3 sharp = clamp(c.rgb + (c.rgb - blur) * uSharpness, mn - 0.015, mx + 0.015);

          // Subtle studio lens corner falloff
          vec2 d = vUv - 0.5;
          float vig = 1.0 - dot(d, d) * 0.16;
          gl_FragColor = vec4(sharp * vig, c.a);
        }
      `,
    });
    this.comp.addPass(this.lensPass);
  }

  _applySamples(samples) {
    const targetSamples = Math.min(this.maxSamples, samples || 0);
    if (this.comp.renderTarget1 && this.comp.renderTarget1.samples !== targetSamples) {
      const nextRT = new kt(
        Math.max(1, Math.round(this.w * this.comp._pixelRatio)),
        Math.max(1, Math.round(this.h * this.comp._pixelRatio)),
        {
          type: Oi,
          samples: targetSamples,
        },
      );
      this.comp.reset(nextRT);
    }
  }

  set(level, reason) {
    if (!zs[level]) return;
    const prev = zs[this.level];
    const next = zs[level];
    this.level = level;
    const dpr = Math.min(next.pr, window.devicePixelRatio || 1);
    this.r.setPixelRatio(dpr);
    this.comp.setPixelRatio(dpr);
    this._applySamples(next.samples);

    if (this.r.shadowMap.enabled !== next.shadows || prev.smap !== next.smap) {
      this.r.shadowMap.enabled = next.shadows;
      this.sun.shadow.mapSize.set(next.smap, next.smap);
      if (this.sun.shadow.map) {
        this.sun.shadow.map.dispose();
        this.sun.shadow.map = null;
      }
      this.scene.traverse((obj) => {
        if (obj.material) {
          (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => {
            m.needsUpdate = true;
          });
        }
      });
    }
    this.setSize(this.w, this.h);
    this.hist = [];
    if (this.onChange) this.onChange(level, reason);
  }

  setSize(w, h) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.r.setSize(this.w, this.h, false);
    this.comp.setSize(this.w, this.h);
    if (this.lensPass) {
      const pr = this.comp._pixelRatio || 1;
      this.lensPass.uniforms.uTexel.value.set(
        1 / Math.max(1, this.w * pr),
        1 / Math.max(1, this.h * pr),
      );
    }
  }

  render() {
    if (zs[this.level].bloom) {
      this.comp.render();
    } else {
      this.r.render(this.scene, this.camera);
    }
  }

  sample(fps) {
    if (!this.auto) return;
    this.hist.push(fps);
    if (this.hist.length > 4) this.hist.shift();
    if (this.hist.length >= 3 && this.hist.every((f) => f < 22)) {
      const order = ["low", "medium", "high", "ultra"];
      const idx = order.indexOf(this.level);
      if (idx > 0) this.set(order[idx - 1], `auto: ${fps.toFixed(0)} fps`);
    }
  }
};

// Balanced Studio HDRI Softbox Rig (crisp specular highlights without whitewashing dielectrics)
function buildStudioEnvironmentScene() {
  const envScene = new Ni();
  const shellGeo = new Mt(26, 32, 20);
  const shellMat = new et({
    color: 0x0c121b,
    roughness: 0.9,
    metalness: 0.0,
    side: Ci,
  });
  envScene.add(new B(shellGeo, shellMat));

  const addPanel = (w, h, pos, rot, hex, intensity) => {
    const m = new B(
      new mt(w, h),
      new xt({
        color: new Ae(hex).multiplyScalar(intensity),
        side: fi,
        toneMapped: false,
      }),
    );
    m.position.set(...pos);
    m.rotation.set(...rot);
    envScene.add(m);
  };

  // Overhead diffused studio softbox
  addPanel(11, 5.5, [0, 14, 1], [Math.PI / 2, 0, 0], 0xfff8ee, 2.8);
  // Warm key softbox (front-right)
  addPanel(7, 5, [11, 6.5, 9], [-0.35, -0.75, 0], 0xffe8c8, 2.4);
  // Cool technical cyan rim strip (left)
  addPanel(2.2, 9, [-13, 5, 2], [0, Math.PI / 2, 0], 0x7fd4ff, 2.3);
  // Subtle amber kicker (back-right)
  addPanel(2.4, 8, [12, 4.5, -8], [0, -Math.PI * 0.65, 0], 0xffb86b, 1.7);
  // Soft front fill bounce
  addPanel(12, 2.2, [0, 3, 15], [0, Math.PI, 0], 0xdcebff, 1.15);

  // Subtle dark studio floor bounce block
  const floorBounce = new B(new Xn(20, 32), new et({ color: 0x121924, roughness: 0.8 }));
  floorBounce.rotation.x = -Math.PI / 2;
  floorBounce.position.y = -3;
  envScene.add(floorBounce);

  return envScene;
}

// Multi-Scale Anti-Aliased Metric Laboratory Floor (1m, 20cm, and 2cm macro vernier grid)
function createMetricStudioFloor() {
  const group = new ft();

  // Shadow-receiving PBR anodized dark slate stage disc
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(512, 512, 24, 512, 512, 512);
  grad.addColorStop(0, "#1c2533");
  grad.addColorStop(0.48, "#111823");
  grad.addColorStop(1, "#080c12");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  const floorTex = new Wn(canvas);
  floorTex.colorSpace = Ot;

  const baseDisc = new B(
    new Xn(92, 112),
    new et({
      map: floorTex,
      roughness: 0.78,
      metalness: 0.14,
      envMapIntensity: 0.4,
    }),
  );
  baseDisc.rotation.x = -Math.PI / 2;
  baseDisc.receiveShadow = true;
  group.add(baseDisc);

  // Derivative-antialiased shader reticle overlay (zero moiré, crisp 4K zoom ticks!)
  const gridMat = new ci({
    transparent: true,
    depthWrite: false,
    extensions: { derivatives: true },
    uniforms: {
      uColorMajor: { value: new Ae(0x3a587a) },
      uColorMinor: { value: new Ae(0x23364c) },
      uColorMicro: { value: new Ae(0x3e7ca6) },
    },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec3 vWorld;
      uniform vec3 uColorMajor;
      uniform vec3 uColorMinor;
      uniform vec3 uColorMicro;

      float gridLine(vec2 coord, float scale, float width) {
        vec2 p = coord / scale;
        vec2 g = abs(fract(p - 0.5) - 0.5) / max(fwidth(p), vec2(1e-5));
        float d = min(g.x, g.y);
        return 1.0 - smoothstep(width * 0.5, width * 1.5, d);
      }

      void main() {
        vec2 xz = vWorld.xz;
        float dist = length(xz);
        float radialFade = 1.0 - smoothstep(14.0, 44.0, dist);
        if (radialFade <= 0.002) discard;

        float fw = length(fwidth(xz));
        float gMajor = gridLine(xz, 1.0, 1.15);
        float gMinor = gridLine(xz, 0.25, 0.95) * (1.0 - smoothstep(0.015, 0.05, fw));
        float gMicro = gridLine(xz, 0.05, 0.85) * (1.0 - smoothstep(0.0025, 0.009, fw));

        vec3 col = uColorMinor * (gMinor * 0.42) + uColorMajor * (gMajor * 0.72) + uColorMicro * (gMicro * 0.48);
        float alpha = clamp(gMajor * 0.42 + gMinor * 0.22 + gMicro * 0.26, 0.0, 0.65) * radialFade;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const gridMesh = new B(new mt(92, 92), gridMat);
  gridMesh.rotation.x = -Math.PI / 2;
  gridMesh.position.y = 0.0018;
  gridMesh.renderOrder = 1;
  group.add(gridMesh);

  return { group, baseDisc, gridMesh };
}

// Real-Time Interactive 3D Cross-Section Slicer (X / Y / Z Plane Cutaway)
var CrossSectionSlicer = class {
  constructor(renderer, scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.enabled = false;
    this.axis = "x"; // 'x' | 'y' | 'z'
    this.offset = 0.15; // normalized -1..1 across active machine bounds
    this.flip = false;
    this.plane = new wn(new N(-1, 0, 0), 0.2);

    // Anti-aliased CAD laser-reticle slice guide plane
    this.guide = new ft();
    this.guide.visible = false;
    this.guideUniforms = {
      uAspect: { value: new ye(1, 1) },
    };
    const fill = new B(
      new mt(1, 1),
      new ci({
        transparent: true,
        depthWrite: false,
        side: fi,
        uniforms: this.guideUniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform vec2 uAspect;
          void main() {
            vec2 p = (vUv - 0.5) * uAspect;
            vec2 edge = abs(vUv - 0.5);
            float rim = smoothstep(0.492, 0.499, max(edge.x, edge.y));
            vec2 g = abs(fract(p * 8.0 - 0.5) - 0.5) / max(fwidth(p * 8.0), vec2(1e-4));
            float tick = 1.0 - smoothstep(0.35, 1.25, min(g.x, g.y));
            float crossH = 1.0 - smoothstep(0.0015, 0.0045, min(abs(vUv.x - 0.5), abs(vUv.y - 0.5)));
            float alpha = clamp(0.045 + rim * 0.55 + tick * 0.14 + crossH * 0.18, 0.0, 0.68);
            vec3 col = mix(vec3(0.14, 0.52, 0.78), vec3(0.32, 0.76, 0.96), clamp(rim + tick * 0.5, 0.0, 1.0));
            gl_FragColor = vec4(col, alpha);
          }
        `,
      }),
    );
    const borderPts = [
      new N(-0.5, -0.5, 0),
      new N(0.5, -0.5, 0),
      new N(0.5, 0.5, 0),
      new N(-0.5, 0.5, 0),
      new N(-0.5, -0.5, 0),
    ];
    const rim = new Rn(
      new it().setFromPoints(borderPts),
      new ei({
        color: 0x58c4ff,
        transparent: true,
        opacity: 0.68,
      }),
    );
    this.guide.add(fill, rim);
    this.guide.userData.keep = true;
    scene.add(this.guide);
  }

  attachToMachines(machines) {
    this.machines = machines;
  }

  apply(activeMachine) {
    this.renderer.localClippingEnabled = this.enabled;
    const planes = this.enabled ? [this.plane] : null;

    if (this.machines) {
      // Pass 1: clear clipping planes across all machines first (since PBR materials are cached/shared)
      for (const m of this.machines) {
        if (this.enabled && m === activeMachine) continue;
        m.holder.traverse((obj) => {
          if (!obj.isMesh || !obj.material) return;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (mat.clippingPlanes !== null) {
              mat.clippingPlanes = null;
              if (mat.userData._origSide !== undefined) {
                mat.side = mat.userData._origSide;
              }
              mat.needsUpdate = true;
            }
          }
        });
      }
      // Pass 2: apply active clipping plane to activeMachine last so shared cached materials are never overwritten
      if (this.enabled && activeMachine) {
        activeMachine.holder.traverse((obj) => {
          if (!obj.isMesh || !obj.material) return;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (mat.userData._origSide === undefined) {
              mat.userData._origSide = mat.side;
            }
            if (mat.clippingPlanes !== planes || mat.side !== fi) {
              mat.clippingPlanes = planes;
              mat.clipShadows = true;
              mat.side = fi;
              mat.needsUpdate = true;
            }
          }
        });
      }
    }

    if (!this.enabled || !activeMachine) {
      this.guide.visible = false;
      return;
    }

    const box = new li().setFromObject(activeMachine.holder);
    if (box.isEmpty()) {
      this.guide.visible = false;
      return;
    }
    const center = box.getCenter(new N());
    const size = box.getSize(new N());
    const sgn = this.flip ? 1 : -1;

    if (this.axis === "x") {
      const px = center.x + this.offset * size.x * 0.52;
      this.plane.normal.set(sgn, 0, 0);
      this.plane.constant = -sgn * px;
      this.guide.position.set(px, center.y, center.z);
      this.guide.rotation.set(0, Math.PI / 2, 0);
      this.guide.scale.set(size.z * 1.08, size.y * 1.08, 1);
    } else if (this.axis === "y") {
      const py = Math.max(0.01, center.y + this.offset * size.y * 0.52);
      this.plane.normal.set(0, sgn, 0);
      this.plane.constant = -sgn * py;
      this.guide.position.set(center.x, py, center.z);
      this.guide.rotation.set(Math.PI / 2, 0, 0);
      this.guide.scale.set(size.x * 1.08, size.z * 1.08, 1);
    } else {
      const pz = center.z + this.offset * size.z * 0.52;
      this.plane.normal.set(0, 0, sgn);
      this.plane.constant = -sgn * pz;
      this.guide.position.set(center.x, center.y, pz);
      this.guide.rotation.set(0, 0, 0);
      this.guide.scale.set(size.x * 1.08, size.y * 1.08, 1);
    }
    if (this.guideUniforms) {
      this.guideUniforms.uAspect.value.set(this.guide.scale.x, this.guide.scale.y);
    }
    this.guide.visible = true;
  }
};
