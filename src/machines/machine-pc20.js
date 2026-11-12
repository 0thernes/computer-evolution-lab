// Modern-Day Mini PC (2020s): Dual-Engine Live Simulation
// 1) Real WebGL2 GLSL ES 3.0 Fragment & Ping-Pong Compute GPU (1,048,576 parallel threads/frame + 48 SM readback)
// 2) Real 32-bit RISC-V (RV32IM) 5-Stage Pipelined CPU + L1I/L1D/L2 Cache + NVMe SSD + Mini-OS + PCIe MMIO Bridge

var C0 = {
    "CPU + GPU Hybrid Synth (RV32IM MMIO)": {
      compute: !1,
      src: `// Driven LIVE by the RV32IM CPU over PCIe MMIO (0x20000000 -> uniform vec4 uCPU)!
// Edit the RISC-V assembly or run 'gpu 0 380' in Mini-OS to steer the 3D PBR Cyber-Crystal.
float sdOcta(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}
float sdBoxFrame(vec3 p, vec3 b, float e) {
  p = abs(p) - b;
  vec3 q = abs(p + e) - e;
  return min(min(
    length(max(vec3(p.x, q.y, q.z), 0.0)) + min(max(p.x, max(q.y, q.z)), 0.0),
    length(max(vec3(q.x, p.y, q.z), 0.0)) + min(max(q.x, max(p.y, q.z)), 0.0)),
    length(max(vec3(q.x, q.y, p.z), 0.0)) + min(max(q.x, max(q.y, p.z)), 0.0));
}
vec2 mapMat(vec3 p) {
  float floorD = p.y + 1.05;
  float morph = clamp(uCPU.x * 0.5, 0.15, 1.35);
  float twist = (uCPU.y - 1.0) * 0.9 + sin(iTime * 0.65) * 0.35;
  float c = cos(twist * p.y), s = sin(twist * p.y);
  vec3 q = vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
  float ca = cos(iTime * 0.45), sa = sin(iTime * 0.45);
  vec3 qr = vec3(ca * q.x + sa * q.y, -sa * q.x + ca * q.y, q.z);
  float core = mix(length(qr) - 0.62, sdOcta(qr, 0.88), 0.52 * morph);
  core -= 0.025 * sin(12.0 * qr.x) * sin(12.0 * qr.y) * sin(12.0 * qr.z);
  float frame = sdBoxFrame(q, vec3(0.84), 0.042) - 0.008;
  float ringR = length(vec2(length(p.xz) - 1.18, p.y - 0.12 * sin(iTime * 1.2 + atan(p.z, p.x) * 3.0))) - 0.045;
  float obj = min(min(core, frame), ringR);
  float id = (core < frame && core < ringR) ? 1.0 : (frame < ringR ? 2.0 : 3.0);
  return (floorD < obj) ? vec2(floorD, 0.0) : vec2(obj, id);
}
float map(vec3 p) { return mapMat(p).x; }
vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0012, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}
float calcSoftShadow(vec3 ro, vec3 rd) {
  float res = 1.0, t = 0.03;
  for (int i = 0; i < 24; i++) {
    float h = map(ro + rd * t);
    res = min(res, 10.0 * h / t);
    t += clamp(h, 0.02, 0.22);
    if (res < 0.002 || t > 5.0) break;
  }
  return clamp(res, 0.0, 1.0);
}
float calcAO(vec3 p, vec3 n) {
  float occ = 0.0, sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.02 + 0.09 * float(i);
    occ += (h - map(p + h * n)) * sca;
    sca *= 0.72;
  }
  return clamp(1.0 - 2.4 * occ, 0.0, 1.0);
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  float camA = iTime * 0.42 + (iMouse.x / iResolution.x - 0.5) * 3.14;
  vec3 ro = vec3(sin(camA) * 2.85, 0.62 + sin(iTime * 0.3) * 0.22, cos(camA) * 2.85);
  vec3 ta = vec3(0.0, -0.08, 0.0);
  vec3 ww = normalize(ta - ro);
  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
  vec3 vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.55 * ww);

  vec3 sky = vec3(0.02, 0.035, 0.065) + 0.16 * pow(max(rd.y, 0.0), 1.4);
  vec3 col = sky;
  float t = 0.0;
  vec2 hit = vec2(-1.0);
  for (int i = 0; i < 92; i++) {
    vec3 p = ro + rd * t;
    vec2 h = mapMat(p);
    if (h.x < 0.0012) { hit = vec2(t, h.y); break; }
    t += h.x;
    if (t > 12.0) break;
  }
  if (hit.x > 0.0) {
    vec3 p = ro + rd * hit.x;
    vec3 n = calcNormal(p);
    float ao = calcAO(p, n);
    vec3 l1 = normalize(vec3(0.68, 0.86, 0.48));
    vec3 l2 = normalize(vec3(-0.65, 0.35, -0.62));
    float sh = calcSoftShadow(p + n * 0.003, l1);
    float dif1 = max(dot(n, l1), 0.0) * sh;
    float dif2 = max(dot(n, l2), 0.0);
    vec3 hal = normalize(l1 - rd);
    float fre = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);
    float spe = pow(max(dot(n, hal), 0.0), 48.0) * sh;
    vec3 base;
    if (hit.y < 0.5) {
      float rad = length(p.xz);
      float grid = max(smoothstep(0.96, 1.0, cos(p.x * 6.2831)), smoothstep(0.96, 1.0, cos(p.z * 6.2831)));
      float rings = smoothstep(0.97, 1.0, cos(rad * 12.566 - iTime * 2.0));
      base = vec3(0.04, 0.055, 0.08) + grid * vec3(0.05, 0.11, 0.18) + rings * vec3(0.18, 0.45, 0.75) * exp(-rad * 0.45);
    } else if (hit.y < 1.5) {
      base = 0.52 + 0.48 * cos(vec3(0.1, 1.8, 3.6) + uCPU.x * 1.9 + uCPU.z * 1.5 + dot(n, rd) * 3.2);
    } else if (hit.y < 2.5) {
      base = vec3(0.76, 0.56, 0.28);
    } else {
      base = vec3(0.22, 0.78, 1.0);
    }
    col = base * (0.12 * ao + 0.88 * dif1 + 0.22 * dif2 * ao)
        + vec3(0.95, 0.92, 0.88) * spe * 0.85
        + vec3(0.28, 0.72, 1.0) * fre * 0.55 * ao;
    col = mix(col, sky, 1.0 - exp(-0.018 * hit.x * hit.x));
  }
  fragColor = vec4(pow(max(col, 0.0), vec3(0.4545)), 1.0);
}`,
    },
    "Plasma (per-pixel trig)": {
      compute: !1,
      src: `// Every pixel of the 512×512 target runs this function in parallel on the GPU.
// Uniforms: iTime, iResolution, iMouse, iFrame, iPrev (previous frame), uCPU (RV32IM MMIO)
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  float t = iTime * 0.8 + uCPU.x * 0.35;
  float v = sin(uv.x * 10.0 + t) + sin(uv.y * 12.0 - t * 1.3)
          + sin((uv.x + uv.y) * 9.0 + t * 0.7) + sin(length(uv - 0.5) * 18.0 - t * 2.0);
  vec3 col = 0.5 + 0.5 * cos(v + vec3(0.0, 2.1, 4.2) + uCPU.y * 0.4);
  fragColor = vec4(col, 1.0);
}`,
    },
    "Mandelbrot (iterated complex maths)": {
      compute: !1,
      src: `// z = z^2 + c, up to 200 iterations per pixel. Drag on the preview to move the centre.
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  float zoom = pow(1.6, mod(iTime * 0.6, 22.0));
  vec2 centre = vec2(-0.743643887, 0.131825904) + (iMouse.xy / iResolution.xy - 0.5) * (iMouse.z > 0.0 ? 0.25 / zoom : 0.0);
  vec2 c = centre + uv * 3.0 / zoom, z = vec2(0.0);
  float i;
  for (i = 0.0; i < 200.0; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    if (dot(z, z) > 16.0) break;
  }
  float s = i < 200.0 ? i - log2(log2(dot(z, z))) + 4.0 : 0.0;
  vec3 col = i < 200.0 ? 0.5 + 0.5 * cos(3.0 + s * 0.15 + vec3(0.0, 0.6, 1.0)) : vec3(0.0);
  fragColor = vec4(col, 1.0);
}`,
    },
    "Ray-marched scene (SDF + lighting)": {
      compute: !1,
      src: `// Sphere-tracing signed distance fields: a tiny real-time path the RT cores' ancestors took.
float map(vec3 p) {
  float s = length(p - vec3(sin(iTime) * 0.8, 0.0, 0.0)) - 0.6;
  float b = length(max(abs(p - vec3(-0.9, -0.2, 0.6)) - vec3(0.35), 0.0)) - 0.05;
  float g = p.y + 0.6;
  return min(min(s, b), g);
}
vec3 normal(vec3 p) { vec2 e = vec2(0.001, 0.0); return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx))); }
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
  vec3 ro = vec3(0.0, 0.3, 3.0), rd = normalize(vec3(uv, -1.5));
  float t = 0.0; vec3 col = vec3(0.05, 0.07, 0.12) + uv.y * 0.2;
  for (int i = 0; i < 96; i++) {
    vec3 p = ro + rd * t; float d = map(p);
    if (d < 0.001) { vec3 n = normal(p); vec3 l = normalize(vec3(0.6, 0.8, 0.4));
      float dif = max(dot(n, l), 0.0); float sh = 1.0; float k = 0.02;
      for (int j = 0; j < 32; j++) { float h = map(p + l * k); sh = min(sh, 12.0 * h / k); k += clamp(h, 0.02, 0.2); if (h < 0.0005) break; }
      vec3 base = p.y < -0.59 ? vec3(0.6) * (0.5 + 0.5 * mod(floor(p.x * 2.0) + floor(p.z * 2.0), 2.0)) : 0.5 + 0.5 * cos(vec3(0, 2, 4) + p.x * 2.0);
      col = base * (0.15 + 0.85 * dif * clamp(sh, 0.0, 1.0)); break; }
    t += d; if (t > 20.0) break;
  }
  fragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`,
    },
    "Game of Life (GPU compute, ping-pong)": {
      compute: !0,
      src: `// Each pixel = one cell. Reads the previous frame (iPrev), writes the next generation.
// 262,144 cells updated in parallel every frame. Click the preview to draw live cells.
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 px = 1.0 / iResolution.xy, uv = fragCoord * px;
  if (iFrame < 2) { float r = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453); fragColor = vec4(vec3(step(0.7, r)), 1.0); return; }
  float n = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) if (x != 0 || y != 0) n += texture(iPrev, fract(uv + vec2(x, y) * px)).r;
  float alive = texture(iPrev, uv).r;
  float next = (n == 3.0 || (alive > 0.5 && n == 2.0)) ? 1.0 : 0.0;
  if (iMouse.z > 0.0 && length(fragCoord - iMouse.xy) < 6.0) next = 1.0;
  vec3 tint = vec3(0.35, 1.0, 0.55) * next + texture(iPrev, uv).gba * 0.0;
  fragColor = vec4(next, tint.g * next, 0.6 * next, 1.0);
}`,
    },
    "Reaction-diffusion (Gray-Scott chemistry)": {
      compute: !0,
      src: `// Two chemicals U,V diffuse and react: dU = Du∇²U - UV² + F(1-U), dV = Dv∇²V + UV² - (F+k)V
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 px = 1.0 / iResolution.xy, uv = fragCoord * px;
  if (iFrame < 2) { float seed = length(fragCoord - iResolution.xy * 0.5) < 20.0 || fract(sin(dot(floor(fragCoord / 16.0), vec2(7.1, 3.7))) * 951.3) > 0.97 ? 1.0 : 0.0; fragColor = vec4(1.0, seed, 0.0, 1.0); return; }
  vec2 c = texture(iPrev, uv).rg, lap = -c;
  lap += 0.2 * (texture(iPrev, uv + vec2(px.x, 0)).rg + texture(iPrev, uv - vec2(px.x, 0)).rg + texture(iPrev, uv + vec2(0, px.y)).rg + texture(iPrev, uv - vec2(0, px.y)).rg);
  lap += 0.05 * (texture(iPrev, uv + px).rg + texture(iPrev, uv - px).rg + texture(iPrev, uv + vec2(px.x, -px.y)).rg + texture(iPrev, uv - vec2(px.x, -px.y)).rg);
  float F = 0.037, k = 0.06, uvv = c.r * c.g * c.g;
  vec2 n = c + vec2(1.0 * lap.r - uvv + F * (1.0 - c.r), 0.5 * lap.g + uvv - (F + k) * c.g);
  if (iMouse.z > 0.0 && length(fragCoord - iMouse.xy) < 8.0) n.g = 1.0;
  fragColor = vec4(clamp(n, 0.0, 1.0), 0.0, 1.0);
}`,
    },
  },
  hb = `uniform sampler2D tex; uniform int mode; in vec2 vUv; out vec4 outColor;
void main(){ vec4 c = texture(tex, vUv); if (mode == 1) { float v = c.g; outColor = vec4(0.5 + 0.5 * cos(6.0 * v + vec3(0.0, 1.0, 2.5) + 2.0) * step(0.05, v) + vec3(0.02, 0.02, 0.06), 1.0); } else outColor = vec4(c.rgb, 1.0); }`;

var Qs = (i, e, t, n) => (i.position.set(e, t, n), i),
  // GPU render-target size scales with the device (REVIEW-v5 P5): 512² on touch devices, 1024² else
  PC20_TOUCH =
    typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches,
  xi = PC20_TOUCH ? 512 : 1024,
  Mi = xi / 2,
  // synchronous readback stalls the GPU pipeline; do it less often on phones
  PC20_READBACK_EVERY = PC20_TOUCH ? 6 : 2,
  h1 =
    "in vec3 position; in vec2 uv; out vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
  Hc = `precision highp float; precision highp sampler2D;
uniform float iTime; uniform vec3 iResolution; uniform vec4 iMouse; uniform int iFrame; uniform sampler2D iPrev; uniform vec4 uCPU;
out vec4 outColor;
`,
  P0 = `
void main() { vec4 c = vec4(0.0); mainImage(c, gl_FragCoord.xy); outColor = c; }`;

function d1() {
  let shaderNames = Object.keys(C0),
    curShader = C0[shaderNames[0]],
    lastErr = "",
    uiRefs = {},
    frameIdx = 0,
    mouseVec = new gt(),
    smMeshes = [],
    ccdCoreMeshes = [],
    ddrLedMeshes = [],
    nvmeLedMesh = null,
    keyEntries = [],
    keyMeshMap = new Map(),
    gpuFrameMs = 0,
    fpsSmooth = 60,
    rtA,
    rtB,
    gpuQuadScene,
    orthoCam,
    gpuMat,
    dispMat,
    dispScene,
    rtDisplay,
    monitorMesh,
    readbackBuf = new Uint8Array(Mi * Mi * 4),
    rtReadback,
    glRenderer,
    gpuPreviewCanvas = document.createElement("canvas"),
    gpuPreviewCtx = gpuPreviewCanvas.getContext("2d"),
    gpuImgData = null,
    monSurface,
    monMode = "split", // "split" | "gpu" | "os"
    cpu = new RV32ModernSystem(),
    cpuRunning = !0,
    cpuSpeed = 2400, // instructions per second
    cpuAcc = 0,
    uiSyncTimer = 0,
    rgbPhase = 0,
    uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new N(xi, xi, 1) },
      iMouse: { value: mouseVec },
      iFrame: { value: 0 },
      iPrev: { value: null },
      uCPU: { value: new gt(0.7, 0.38, 0.86, 0) },
    };

  gpuPreviewCanvas.width = Mi;
  gpuPreviewCanvas.height = Mi;

  const v = {
    id: "pc20",
    era: "2020s",
    short: "Modern mini PC ★",
    sim: { uniforms },
    name: "Modern-Day Mini PC (2020s): RV32IM 5-stage CPU + L1/L2 cache + NVMe OS + WebGL2 GPU",
    blurb:
      "A fully operational dual-engine modern workstation in a 12-litre Mini-ITX chassis. On the motherboard, a 32-bit RISC-V (RV32IM) 5-stage pipelined CPU (IF/ID/EX/MEM/WB) with data forwarding, 2-bit branch prediction, set-associative L1I/L1D/L2 caches, and a virtual NVMe Gen4 SSD executes real assembled machine code and runs an interactive Mini-OS shell — streaming live orbital uniforms over PCIe MMIO (0x20000000) into a real WebGL2 GLSL ES 3.0 GPU shader executing across 1,048,576 pixels in parallel every frame. Click the 3D RGB mechanical keyboard, edit the RISC-V assembly or GLSL shader, or run commands in the Mini-OS terminal.",
    diagram: {
      nodes: [
        {
          id: "ccd",
          label: `CPU: 2× CCD\n(RV32IM · 16c)`,
          x: 0.15,
          y: 0.2,
          w: 0.24,
          color: "#ff8a50",
        },
        {
          id: "iod",
          label: `I/O die · L2\nDDR5 · PCIe 5`,
          x: 0.15,
          y: 0.72,
          w: 0.23,
          color: "#c9b07a",
        },
        {
          id: "ddr",
          label: "DDR5-6000",
          x: 0.42,
          y: 0.88,
          w: 0.17,
          color: "#58c4ff",
        },
        {
          id: "nvme",
          label: `NVMe SSD\nPCIe 5 ×4`,
          x: 0.42,
          y: 0.5,
          w: 0.18,
          color: "#ffb347",
        },
        {
          id: "gpu",
          label: `GPU: 48 SMs × GLSL\n(1.05M threads)`,
          x: 0.7,
          y: 0.2,
          w: 0.31,
          color: "#76b900",
        },
        {
          id: "vram",
          label: "GDDR6X",
          x: 0.7,
          y: 0.72,
          w: 0.15,
          color: "#5fe08a",
        },
        {
          id: "disp",
          label: `4K Display\nDP 2.1`,
          x: 0.92,
          y: 0.72,
          w: 0.14,
          color: "#e6edf3",
        },
      ],
      edges: [
        ["ccd", "iod", "Infinity Fabric"],
        ["iod", "ddr"],
        ["iod", "nvme"],
        ["iod", "gpu", "PCIe 5 ×16 MMIO"],
        ["gpu", "vram"],
        ["vram", "gpu"],
        ["gpu", "disp"],
      ],
    },

    isRunning: () => !0,

    build(k, L, z) {
      glRenderer = z.renderer;
      const rtOpts = {
        type: Oi,
        minFilter: Kt,
        magFilter: Kt,
        wrapS: os,
        wrapT: os,
        depthBuffer: !1,
      };
      rtA = new kt(xi, xi, rtOpts);
      rtB = new kt(xi, xi, rtOpts);
      rtDisplay = new kt(xi, xi, { depthBuffer: !1, colorSpace: Ot });
      rtReadback = new kt(Mi, Mi, { depthBuffer: !1 });
      orthoCam = new An(-1, 1, 1, -1, 0, 1);

      const quadGeo = new mt(2, 2);
      gpuMat = new nn({
        glslVersion: Gn,
        uniforms,
        vertexShader: h1,
        fragmentShader: Hc + curShader.src + P0,
      });
      gpuQuadScene = new Ni();
      gpuQuadScene.add(new B(quadGeo, gpuMat));

      dispMat = new nn({
        glslVersion: Gn,
        uniforms: { tex: { value: null }, mode: { value: 0 } },
        vertexShader: h1,
        fragmentShader: "precision highp float;\n" + hb,
      });
      dispScene = new Ni();
      dispScene.add(new B(quadGeo, dispMat));

      // ---- 1. CNC Anodized Mini-ITX SFF Chassis ----
      const chassisMat = U.metal(0x28303c, 0.34);
      const darkTrimMat = U.metal(0x161b23, 0.42);
      const accentTrim = U.copper();

      // Tempered glass side panel with dark ceramic frit border + thumbscrews
      const glassPanel = k.group([0.33, 0.41, 0], {
        name: "Glass side panel",
        info: "4 mmflush-mounted tempered borosilicate glass side panel on tool-less ball studs (~12-litre SFF chassis). Toggle Cutaway (C) or Explode to inspect the motherboard, chiplets, and GPU.",
        shell: !0,
        explode: [0.55, 0, 0],
      });
      const glassPane = new B(
        chamferBox(0.022, 0.75, 1.02, 0.004),
        U.glass(0x9fb8cc, 0.16),
      );
      glassPanel.add(glassPane);
      for (const [sy, sz] of [
        [0.33, 0.46],
        [0.33, -0.46],
        [-0.33, 0.46],
        [-0.33, -0.46],
      ]) {
        const screw = new B(new ke(0.014, 0.014, 0.018, 16), U.knurled(0x222832));
        screw.rotation.z = Math.PI / 2;
        screw.position.set(0.014, sy, sz);
        glassPanel.add(screw);
      }

      // Top CNC ventilated exhaust mesh
      const topPanel = k.group([0, 0.8, 0], {
        name: "Top mesh",
        info: "CNC-machined anodized aluminium exhaust panel with stadium airflow slots and copper pull-tab.",
        shell: !0,
        explode: [0, 0.44, 0],
      });
      topPanel.add(new B(chamferBox(0.68, 0.026, 1.04, 0.006), chassisMat));
      for (let i = -8; i <= 8; i++) {
        const vent = new B(new te(0.44, 0.028, 0.022), U.plastic(0x0b0f15, 0.75));
        vent.position.set(0, 0.002, i * 0.048);
        topPanel.add(vent);
      }

      // Structural spine, floor, rear I/O plate, CNC rubber+brass feet
      k.box(0.026, 0.78, 1.04, chassisMat, [-0.33, 0.41, 0], {
        shell: !0,
        explode: [-0.45, 0, 0],
      });
      k.box(0.68, 0.028, 1.04, darkTrimMat, [0, 0.02, 0], {});
      k.box(0.68, 0.78, 0.026, darkTrimMat, [0, 0.41, -0.51], {});
      for (const [fx, fz] of [
        [-0.27, -0.43],
        [0.27, -0.43],
        [-0.27, 0.43],
        [0.27, 0.43],
      ]) {
        k.cyl(0.042, 0.046, 0.018, accentTrim, [fx, 0.009, fz], { seg: 24 });
      }

      // Front anodized facade with USB4 Type-C, USB-A, audio jack, and illuminated power ring
      const frontGroup = k.group([0, 0.41, 0.515], {
        name: "Front panel",
        info: "Brushed slate aluminium front bezel: USB4 40 Gb/s Type-C, USB 3.2 Type-A, 3.5 mm TRRS combo jack, and illuminated power switch.",
        shell: !0,
        explode: [0, 0, 0.42],
      });
      frontGroup.add(new B(chamferBox(0.68, 0.78, 0.028, 0.008), chassisMat));
      frontGroup.add(Qs(new B(new te(0.008, 0.7, 0.03), accentTrim), -0.28, 0, 0.002));
      const pwrRing = new B(new Pi(0.022, 0.004, 12, 32), U.led(0x58c4ff, 1.4));
      pwrRing.position.set(0.22, 0.28, 0.016);
      frontGroup.add(pwrRing);
      frontGroup.add(Qs(new B(new te(0.032, 0.01, 0.012), U.steel()), 0.22, 0.19, 0.015));
      frontGroup.add(
        Qs(
          new B(new te(0.048, 0.018, 0.012), U.plastic(0x1b68c4, 0.4)),
          0.22,
          0.14,
          0.015,
        ),
      );

      // ---- 2. Mini-ITX AM5 10-Layer Motherboard ----
      const mobo = k.group([-0.29, 0.53, -0.1], {
        rot: [0, 0, -Math.PI / 2],
        name: "Mini-ITX AM5 motherboard (17 × 17 cm)",
        info: "10-layer low-loss FR-4 PCB: LGA1718 socket, 12+2 phase 105 A SPS VRM with finned aluminium heatsink, 2× DDR5-6000 DIMM slots, steel-reinforced PCIe 5.0 ×16 slot, PCIe 5.0 M.2 NVMe slot, 2.5 GbE + Wi-Fi 7.",
        live: () =>
          `RV32IM bus: DDR5 bursts ${cpu.stats.dramReads} · PCIe MMIO writes ${cpu.stats.mmioGpuWrites} · NVMe DMA ${cpu.stats.nvmeOps}`,
        explode: [-0.24, 0, 0],
      });
      mobo.add(Qs(new B(chamferBox(0.54, 0.014, 0.54, 0.003), U.pcb(0x101822)), 0, 0, 0));

      // 12+2 phase VRM ferrite chokes + DrMOS stages + dual heatpipe-linked VRM heatsinks
      for (let i = 0; i < 9; i++) {
        const choke = new B(
          chamferBox(0.024, 0.018, 0.024, 0.003),
          U.metal(0x3a404a, 0.45),
        );
        choke.position.set(-0.18, 0.015, -0.18 + i * 0.034);
        mobo.add(choke);
      }
      const vrmSink = new B(
        chamferBox(0.068, 0.052, 0.34, 0.004),
        U.darkAnodized(0x1f2630),
      );
      vrmSink.position.set(-0.225, 0.031, -0.04);
      mobo.add(vrmSink);
      // Secondary top SoC VRM heatsink + sintered copper heatpipe bridge
      const topVrmSink = new B(
        chamferBox(0.22, 0.044, 0.054, 0.004),
        U.darkAnodized(0x1f2630),
      );
      topVrmSink.position.set(-0.08, 0.028, -0.225);
      mobo.add(topVrmSink);
      Dt(
        k,
        [
          [-0.225, 0.046, 0.08],
          [-0.225, 0.048, -0.225],
          [-0.02, 0.044, -0.225],
        ],
        0.0042,
        0xc97448,
        { mat: U.copper() },
        mobo,
      );
      // B650E/X670I PCH chipset heatsink + CR2032 CMOS lithium battery + solid polymer caps
      mobo.add(
        Qs(
          new B(chamferBox(0.095, 0.02, 0.085, 0.003), U.darkAnodized(0x262e3a)),
          0.145,
          0.016,
          0.135,
        ),
      );
      mobo.add(
        Qs(
          new B(new ke(0.021, 0.021, 0.006, 20), U.plastic(0x151920, 0.5)),
          -0.21,
          0.01,
          0.19,
        ),
      );
      mobo.add(Qs(new B(new ke(0.017, 0.017, 0.005, 20), U.steel()), -0.21, 0.014, 0.19));
      for (let c = 0; c < 5; c++) {
        mobo.add(
          Qs(
            new B(new ke(0.0065, 0.0065, 0.014, 14), U.alu()),
            -0.145,
            0.014,
            -0.15 + c * 0.055,
          ),
        );
      }
      // Rear I/O EMI shield tower + dual gold Wi-Fi 7 SMA antenna jacks
      mobo.add(
        Qs(
          new B(chamferBox(0.052, 0.068, 0.16, 0.003), U.metal(0x2b3340, 0.34)),
          -0.238,
          0.04,
          0.16,
        ),
      );
      for (const wz of [0.12, 0.16]) {
        const sma = new B(new ke(0.005, 0.005, 0.018, 12), U.gold());
        sma.rotation.z = Math.PI / 2;
        sma.position.set(-0.272, 0.036, wz);
        mobo.add(sma);
      }

      // Steel-reinforced PCIe 5.0 x16 slot along bottom edge of ITX board
      mobo.add(
        Qs(new B(chamferBox(0.36, 0.022, 0.026, 0.002), U.steel()), 0.02, 0.016, 0.22),
      );
      // 24-pin ATX header + USB-C front header
      mobo.add(
        Qs(
          new B(new te(0.026, 0.026, 0.13), U.plastic(0x14181f, 0.5)),
          0.235,
          0.018,
          -0.06,
        ),
      );
      mobo.add(Qs(new B(new te(0.018, 0.02, 0.036), U.steel()), 0.235, 0.016, 0.06));

      // ---- 3. Delidded Chiplet CPU (2× CCD + I/O Die on Silicon + SMD Substrate) ----
      const cpuGroup = k.group(
        [-0.055, 0.01, -0.05],
        {
          name: "Chiplet CPU (Ryzen 7950X-class)",
          info: "Hybrid chiplet package: two 5 nm Core Complex Dies (16 cores total, glowing live with RV32IM instruction execution heat) + one 6 nm central I/O die (L2/memory controller + PCIe 5.0 root complex) on an organic substrate ringed by gold SMD decoupling capacitors.",
          live: () =>
            `PC 0x${bt(cpu.pc, 4)} · ${cpu.stats.instret.toLocaleString()} instr · IPC ${cpu.ipc().toFixed(2)} · BP ${(cpu.bpAccuracy() * 100).toFixed(1)}% · L1D ${(cpu.l1d.hitRate() * 100).toFixed(1)}%`,
          explode: [0, 0.16, 0],
        },
        mobo,
      );
      // AM5 socket retention frame
      cpuGroup.add(
        Qs(new B(chamferBox(0.145, 0.006, 0.145, 0.002), U.steel()), 0, 0.002, 0),
      );
      // Organic green-teal package substrate
      cpuGroup.add(
        Qs(new B(chamferBox(0.125, 0.009, 0.125, 0.002), U.pcb(0x1d4d3e)), 0, 0.007, 0),
      );
      // Perimeter gold SMD capacitor array
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        const cap = new B(new te(0.008, 0.004, 0.005), U.gold());
        cap.position.set(Math.cos(ang) * 0.052, 0.013, Math.sin(ang) * 0.052);
        cap.rotation.y = -ang;
        cpuGroup.add(cap);
      }

      // Two 5 nm CCD Silicon Dies + 16 individually lit execution cores
      ccdCoreMeshes = [];
      for (const [cx, cz] of [
        [-0.028, -0.024],
        [-0.028, 0.024],
      ]) {
        const ccdDie = Qs(
          new B(chamferBox(0.044, 0.005, 0.036, 0.001), U.siliconDie(0x1c2c42)),
          cx,
          0.013,
          cz,
        );
        cpuGroup.add(ccdDie);
        for (let cIdx = 0; cIdx < 8; cIdx++) {
          const coreLed = new B(new te(0.0082, 0.0028, 0.013), U.led(0xff8a3d, 0.45));
          coreLed.position.set(
            cx - 0.015 + (cIdx % 4) * 0.01,
            0.0165,
            cz - 0.008 + Math.floor(cIdx / 4) * 0.016,
          );
          cpuGroup.add(coreLed);
          ccdCoreMeshes.push(coreLed);
        }
      }
      // 6 nm I/O Die
      cpuGroup.add(
        Qs(
          new B(chamferBox(0.036, 0.0055, 0.074, 0.001), U.siliconDie(0x28364a)),
          0.026,
          0.013,
          0,
        ),
      );

      // ---- 4. Nickel-Copper Heatpipe Low-Profile Cooler ----
      const cooler = k.group(
        [-0.055, 0.034, -0.05],
        {
          name: "Low-profile cooler",
          info: "Octopus-cut AM5 nickel-plated copper IHS + 4× 6 mm sintered copper heatpipes + 24-fin aluminium stack + 9-blade PWM fan. Explode lifts the cooler & IHS straight off the chiplets.",
          explode: [0, 0.52, 0],
        },
        mobo,
      );
      cooler.add(
        Qs(
          new B(chamferBox(0.126, 0.011, 0.126, 0.003), U.metal(0xd5dce4, 0.22)),
          0,
          0,
          0,
        ),
      );
      vn(k, 0.21, 0.21, 0.062, [0, 0.009, 0], { fins: 24, base: U.copper() }, cooler);
      ni(
        k,
        0.102,
        [0, 0.102, 0],
        { rot: [-Math.PI / 2, 0, 0], speed: 18, blade: 0x202733 },
        cooler,
      );

      // ---- 5. Dual DDR5-6000 DIMMs with Live Activity Lightbars ----
      ddrLedMeshes = [];
      for (let idx = 0; idx < 2; idx++) {
        const dimm = ps(
          k,
          [0.135 + idx * 0.044, 0.01, -0.05],
          {
            name: idx ? void 0 : "DDR5-6000 (2 × 32 GB)",
            info: "Dual-channel DDR5-6000 (two independent 32-bit subchannels + on-DIMM PMIC + on-die ECC per stick, ~96 GB/s). Top lightbars flash on L2 cache misses -> DRAM bursts.",
            len: 0.34,
            h: 0.084,
            spreader: 0x2d3542,
            chips: 8,
            explode: [0, 0.22 + idx * 0.06, 0],
          },
          mobo,
        );
        dimm.rotation.y = Math.PI / 2;
        const bar = new B(new te(0.33, 0.009, 0.018), U.led(0x58c4ff, 0.45));
        bar.position.set(0, 0.092, 0);
        dimm.add(bar);
        ddrLedMeshes.push(bar);
      }

      // ---- 6. M.2 2280 NVMe Gen5 SSD with Controller Die, NAND, & Activity LED ----
      const nvme = k.group(
        [-0.055, 0.014, 0.135],
        {
          name: "M.2 NVMe SSD (PCIe 5.0 ×4)",
          info: "2280 M.2 NVMe SSD: 8-channel controller silicon die, DRAM cache, and 232-layer 3D TLC NAND flash packages (~12.4 GB/s sequential, 64K-deep submission/completion queues). Holds the Mini-OS files and RV32IM demo binaries!",
          live: () =>
            `${Object.keys(cpu.nvmeFiles).length} files mounted · ${cpu.stats.nvmeOps} NVMe DMA ops`,
          explode: [0, 0.24, 0.14],
        },
        mobo,
      );
      nvme.add(
        Qs(new B(chamferBox(0.225, 0.007, 0.058, 0.002), U.pcb(0x111923)), 0, 0, 0),
      );
      // Gold M-key edge connector
      nvme.add(Qs(new B(new te(0.014, 0.008, 0.052), U.gold()), -0.108, 0.001, 0));
      // Controller silicon die + 2 NAND flash packages
      nvme.add(
        Qs(new B(new te(0.032, 0.005, 0.032), U.siliconDie(0x223448)), -0.068, 0.006, 0),
      );
      for (const nx of [-0.005, 0.062]) {
        nvme.add(Qs(new B(new te(0.052, 0.006, 0.042), U.chip()), nx, 0.006, 0));
      }
      nvmeLedMesh = Qs(
        new B(new Mt(0.0045, 10, 8), U.led(0xffb347, 0.35)),
        0.102,
        0.007,
        0.018,
      );
      nvme.add(nvmeLedMesh);

      // ---- 7. RTX 4070-Class Graphics Card with Photolithographed Die + 48 Live SMs ----
      const gpuCard = k.group([0.03, 0.31, 0.05], {
        name: "Graphics card (RTX 4070-class)",
        info: "AD104-class GPU (35.8B transistors, 46–48 SMs, 12 GB GDDR6X, 12VHPWR). Each of the 48 Streaming Multiprocessor tiles on the exposed silicon die glows with the live luminance of the screen region it just shaded on your real WebGL2 GPU, while receiving uCPU uniforms from the RV32IM CPU over PCIe MMIO!",
        live: () =>
          `${xi}×${xi} = ${(xi * xi).toLocaleString()} shader threads/frame · frame ${frameIdx}\n~${fpsSmooth.toFixed(0)} fps · uCPU = [${uniforms.uCPU.value.x.toFixed(2)}, ${uniforms.uCPU.value.y.toFixed(2)}, ${uniforms.uCPU.value.z.toFixed(2)}]`,
        explode: [0.14, 0, 0.46],
      });
      // Finned shroud + anodized flow-through backplate + PCIe gold edge + rear DP/HDMI bracket
      gpuCard.add(new B(chamferBox(0.062, 0.142, 0.74, 0.006), U.darkAnodized(0x252c37)));
      const gpuPcb = new B(chamferBox(0.012, 0.128, 0.64, 0.002), U.pcb(0x0d1520));
      gpuPcb.position.x = -0.04;
      gpuCard.add(gpuPcb);
      // Gold PCIe 5.0 x16 edge connector + recessed 16-pin 12VHPWR header + stainless rear I/O bracket
      gpuCard.add(Qs(new B(new te(0.008, 0.014, 0.28), U.gold()), -0.04, 0.068, -0.06));
      gpuCard.add(
        Qs(
          new B(chamferBox(0.022, 0.016, 0.038, 0.002), U.plastic(0x141820, 0.45)),
          -0.028,
          0.072,
          0.02,
        ),
      );
      gpuCard.add(
        Qs(
          new B(chamferBox(0.082, 0.158, 0.008, 0.002), U.steel()),
          -0.005,
          0.004,
          -0.372,
        ),
      );
      // Exposed aluminium fin stack along top & rear flow-through window
      for (let fn = 0; fn < 18; fn++) {
        gpuCard.add(
          Qs(new B(new te(0.048, 0.128, 0.003), U.alu()), 0, 0, 0.22 + fn * 0.008),
        );
      }
      // Copper heatpipes along top edge of GPU
      for (let hp = 0; hp < 3; hp++) {
        const pipe = new B(new ke(0.0045, 0.0045, 0.66, 12), U.copper());
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(-0.012 + hp * 0.011, 0.073, 0);
        gpuCard.add(pipe);
      }
      // Dual axial fans
      ni(
        k,
        0.05,
        [0.033, 0, 0.19],
        { rot: [0, Math.PI / 2, 0], speed: 22, blade: 0x1a2029 },
        gpuCard,
      );
      ni(
        k,
        0.05,
        [0.033, 0, -0.14],
        { rot: [0, Math.PI / 2, 0], speed: 22, blade: 0x1a2029 },
        gpuCard,
      );
      // Exposed AD104 Silicon Die + 48 Streaming Multiprocessors + 6 GDDR6X chips
      const gpuDieHolder = new ft();
      gpuDieHolder.position.set(-0.05, 0, 0.02);
      gpuDieHolder.rotation.z = Math.PI / 2;
      gpuCard.add(gpuDieHolder);
      gpuDieHolder.add(
        Qs(
          new B(chamferBox(0.096, 0.004, 0.096, 0.001), U.siliconDie(0x18283a)),
          0,
          0,
          0,
        ),
      );
      smMeshes = [];
      for (let i = 0; i < 48; i++) {
        const sm = new B(new te(0.0092, 0.0035, 0.0092), U.led(0x6be000, 0.25));
        sm.position.set(
          -0.04 + (i % 8) * 0.0114,
          0.0028,
          -0.034 + Math.floor(i / 8) * 0.0114,
        );
        gpuDieHolder.add(sm);
        smMeshes.push(sm);
      }
      for (let i = 0; i < 6; i++) {
        const vramChip = new B(new te(0.005, 0.016, 0.016), U.chip());
        vramChip.position.set(
          -0.048,
          i % 2 ? 0.038 : -0.038,
          -0.05 + Math.floor(i / 2) * 0.05,
        );
        gpuCard.add(vramChip);
      }

      // ---- 8. SFX-L 850W Platinum Power Supply + Braided Cables ----
      const psu = k.group([0.11, 0.13, -0.31], {
        name: "SFX power supply (850 W)",
        info: "80 PLUS Platinum SFX-L modular power supply with native 16-pin 12VHPWR (600 W) + braided ATX 24-pin cables and zero-RPM fluid-dynamic fan.",
        explode: [0.34, -0.08, -0.32],
      });
      psu.add(new B(chamferBox(0.31, 0.21, 0.26, 0.006), U.darkAnodized(0x1b2028)));
      // 92mm zero-RPM fluid-dynamic PSU intake fan + chrome wire grille + modular headers + AC C14 inlet
      ni(
        k,
        0.084,
        [0, 0.106, 0],
        { rot: [-Math.PI / 2, 0, 0], speed: 10, blade: 0x161b22 },
        psu,
      );
      for (const r of [0.036, 0.06, 0.082]) {
        const gRing = new B(new Pi(r, 0.0022, 8, 28), U.steel());
        gRing.rotation.x = Math.PI / 2;
        gRing.position.set(0, 0.109, 0);
        psu.add(gRing);
      }
      for (let mh = 0; mh < 4; mh++) {
        psu.add(
          Qs(
            new B(chamferBox(0.052, 0.032, 0.014, 0.002), U.plastic(0x10141b, 0.5)),
            -0.095 + mh * 0.064,
            0.035,
            0.132,
          ),
        );
      }
      psu.add(
        Qs(
          new B(chamferBox(0.068, 0.046, 0.012, 0.002), U.plastic(0x0e1218, 0.55)),
          -0.06,
          -0.02,
          -0.132,
        ),
      );
      psu.add(
        Qs(
          new B(new te(0.028, 0.038, 0.014), U.plastic(0xb52b2b, 0.42)),
          0.04,
          -0.02,
          -0.132,
        ),
      );
      // Braided 12VHPWR & 24-pin ATX cables + black cable combs
      Dt(
        k,
        [
          [0.08, 0.23, -0.22],
          [0.06, 0.36, -0.08],
          [0.03, 0.38, 0.06],
        ],
        0.009,
        0x202834,
      );
      Dt(
        k,
        [
          [-0.04, 0.22, -0.26],
          [-0.18, 0.28, -0.2],
          [-0.26, 0.32, -0.14],
        ],
        0.011,
        0x2b3646,
      );

      // Subtle internal chassis ambient RGB wash (well below HDR clipping)
      const caseLight = new Pn(0x58c4ff, 0.85, 1.8, 1.6);
      caseLight.position.set(0.12, 0.56, 0.16);
      k.root.add(caseLight);
      k.onFrame((dt, elapsed) => {
        caseLight.color.setHSL((elapsed * 0.04) % 1, 0.72, 0.56);
      });

      // ---- 9. 27" 16:9 4K IPS Monitor on Articulated VESA Stand (Switchable GPU / Split / OS) ----
      monSurface = Bt(2048, 1152);
      const monGroup = k.group([0, 0, -1.04], {
        name: '27" 4K 165 Hz IPS monitor (click bezel LED to switch view)',
        info: "DisplayPort 2.1 widescreen reference monitor displaying BOTH your live WebGL2 GPU shader (1,048,576 threads/frame) and the live RV32IM CPU pipeline + Mini-OS terminal at 2048×1152 retina clarity! Click the bottom-right bezel button (or use the panel selector) to toggle Split / Full GPU / Full OS.",
        live: () => `Display mode: ${monMode.toUpperCase()} · 2048×1152 live composite`,
        explode: [0, 0, -0.42],
      });
      // Sculpted V-wing cast aluminium VESA base + angled column with copper cable-routing ring
      for (const sgn of [-1, 1]) {
        const wing = new B(chamferBox(0.28, 0.016, 0.052, 0.005), U.alu());
        wing.position.set(sgn * 0.12, 0.008, 0.02);
        wing.rotation.y = sgn * -0.42;
        monGroup.add(wing);
      }
      monGroup.add(
        Qs(new B(chamferBox(0.16, 0.02, 0.16, 0.005), U.alu()), 0, 0.01, -0.06),
      );
      const standNeck = new B(chamferBox(0.062, 0.58, 0.038, 0.006), U.alu());
      standNeck.position.set(0, 0.3, -0.075);
      standNeck.rotation.x = 0.06;
      monGroup.add(standNeck);
      const cableRing = new B(new Pi(0.022, 0.0045, 12, 28), U.copper());
      cableRing.position.set(0, 0.18, -0.068);
      monGroup.add(cableRing);
      // Ultrathin CNC dark-anodized bezel housing + rear VESA spine + brushed chin bar
      const monBezel = new B(
        chamferBox(1.52, 0.88, 0.028, 0.008),
        U.darkAnodized(0x12161e),
      );
      monBezel.position.set(0, 0.76, -0.016);
      monGroup.add(monBezel);
      monGroup.add(
        Qs(
          new B(chamferBox(0.68, 0.42, 0.024, 0.008), U.darkAnodized(0x181e28)),
          0,
          0.76,
          -0.036,
        ),
      );
      monGroup.add(
        Qs(
          new B(chamferBox(1.52, 0.022, 0.03, 0.003), U.darkAnodized(0x262e3a)),
          0,
          0.33,
          -0.014,
        ),
      );
      // Active 2048×1152 IPS LCD panel + anti-reflective optical clearcoat glass
      monitorMesh = new B(
        new mt(1.47, 0.826),
        new xt({ map: monSurface.tex, toneMapped: !1 }),
      );
      monitorMesh.position.set(0, 0.768, 0.001);
      monGroup.add(monitorMesh);
      const monGlass = new B(new mt(1.48, 0.834), U.glass(0xd8ecff, 0.04));
      monGlass.material.envMapIntensity = 0.45;
      monGlass.position.set(0, 0.768, 0.003);
      monGlass.raycast = () => {};
      monGroup.add(monGlass);
      // Monitor power/mode LED button (click to cycle Split / GPU / OS!)
      const monBtn = new B(new te(0.042, 0.012, 0.014), U.led(0x5fe08a, 1.1));
      monBtn.position.set(0.66, 0.33, 0.006);
      monBtn.userData.isMonSwitch = !0;
      monGroup.add(monBtn);

      // Braided DisplayPort 2.1 cable with anodized connector shells from GPU rear I/O to monitor
      Dt(
        k,
        [
          [0.03, 0.3, -0.52],
          [0.02, 0.05, -0.76],
          [0, 0.38, -1.08],
        ],
        0.0085,
        0x141820,
      );

      // Stitched charcoal microfiber desk mat beneath keyboard & wireless mouse
      const deskMat = k.group([0.1, 0.004, 0.86], {
        name: "Microfiber desk mat",
        info: "4 mm stitched-edge low-friction Cordura desk mat supporting the 65% mechanical keyboard and 4000 Hz optical mouse.",
        explode: [0, -0.04, 0.28],
      });
      deskMat.add(new B(chamferBox(1.48, 0.008, 0.42, 0.003), U.rubber()));
      deskMat.add(
        Qs(
          new B(chamferBox(1.486, 0.005, 0.426, 0.003), U.plastic(0xc85a32, 0.65)),
          0,
          -0.001,
          0,
        ),
      );

      // ---- 10. Interactive 65% CNC RGB Mechanical Keyboard + Wireless Mouse ----
      const kbdGroup = k.group([-0.08, 0.022, 0.86], {
        name: "Mechanical keyboard (click any keycap in 3D!)",
        info: "CNC-milled 65% gasket-mount hot-swap mechanical keyboard with dye-sub PBT legends, knurled brass rotary encoder, custom GX16 aviator coiled cable, and per-key RGB LEDs. Clicking any keycap in 3D depresses the switch, flashes its RGB LED, plays a real key switch transient, and sends that ASCII keycode straight into the RV32IM CPU's UART/Keyboard FIFO (0x10000008)!",
        live: () =>
          `Last key: ${cpu.lastKeyCode ? `'${String.fromCharCode(cpu.lastKeyCode)}' (0x${bt(cpu.lastKeyCode, 2)})` : "none"} · RX FIFO ${cpu.keyFifo.length} B`,
        explode: [0, 0, 0.28],
      });
      // Angled CNC aluminium keyboard case + brass front weight + knurled brass volume knob
      const kbdBody = new B(
        chamferBox(0.84, 0.03, 0.295, 0.006),
        U.darkAnodized(0x202632),
      );
      kbdBody.rotation.x = 0.075;
      kbdGroup.add(kbdBody);
      const brassStrip = new B(chamferBox(0.8, 0.008, 0.014, 0.002), U.brass());
      brassStrip.position.set(0, 0.008, 0.146);
      kbdGroup.add(brassStrip);
      const volKnob = new B(new ke(0.019, 0.019, 0.018, 24), U.knurl(0xc69c46, 0.28));
      volKnob.position.set(0.382, 0.029, -0.104);
      volKnob.rotation.x = 0.075;
      kbdGroup.add(volKnob);

      // Build 5 rows of individually pickable 3D keycaps + high-DPI dye-sub legends + RGB switch LEDs
      const rows = [
        ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "\b"],
        ["\t", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "\n"],
        ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
        [" "],
      ];
      const keyLabels = {
        "`": "ESC",
        "-": "- _",
        "=": "= +",
        "\b": "BKSP",
        "\t": "TAB",
        "[": "[ {",
        "]": "] }",
        "\\": "\\ |",
        ";": "; :",
        "'": "' \"",
        "\n": "ENTER ↵",
        ",": ", <",
        ".": ". >",
        "/": "/ ?",
        " ": "RV32IM // WORKSTATION",
      };
      const kbdAtlas = Bt(2048, 512);
      const kCtx = kbdAtlas.ctx;
      kCtx.clearRect(0, 0, 2048, 512);
      kCtx.textAlign = "center";
      kCtx.textBaseline = "middle";
      const cellW = 2048 / 16;
      const cellH = 512 / 5;
      rows.forEach((row, rIdx) => {
        row.forEach((ch, cIdx) => {
          const span = ch === " " ? 6 : ch === "\n" || ch === "\b" || ch === "\t" ? 2 : 1;
          const colSlot = ch === " " ? 5 : cIdx;
          const cx = (colSlot + span * 0.5) * cellW;
          const cy = (rIdx + 0.5) * cellH;
          const lbl = keyLabels[ch] || ch.toUpperCase();
          kCtx.fillStyle =
            ch === "\n" || ch === "`" || ch === " " ? "#fff7ee" : "#dce7f5";
          kCtx.font =
            lbl.length > 3
              ? "bold 24px ui-monospace, Menlo, Consolas, monospace"
              : "bold 36px ui-monospace, Menlo, Consolas, monospace";
          kCtx.fillText(lbl, cx, cy);
        });
      });
      kbdAtlas.tex.needsUpdate = !0;
      const legendMat = new xt({
        map: kbdAtlas.tex,
        transparent: !0,
        depthWrite: !1,
        toneMapped: !1,
      });
      const makeLegendTop = (wTop, rIdx, colSlot, span) => {
        const g = new mt(wTop, 0.032);
        const uv = g.attributes.uv;
        const u0 = colSlot / 16;
        const u1 = (colSlot + span) / 16;
        const v1 = 1 - rIdx / 5;
        const v0 = 1 - (rIdx + 1) / 5;
        uv.setXY(0, u0, v1);
        uv.setXY(1, u1, v1);
        uv.setXY(2, u0, v0);
        uv.setXY(3, u1, v0);
        uv.needsUpdate = !0;
        const m = new B(g, legendMat);
        m.rotation.x = -Math.PI / 2;
        m.position.y = 0.0074;
        m.raycast = () => {};
        return m;
      };

      const capGeo = chamferBox(0.044, 0.014, 0.044, 0.003);
      const spaceGeo = chamferBox(0.32, 0.014, 0.044, 0.003);
      const wideGeo = chamferBox(0.082, 0.014, 0.044, 0.003);
      const darkCapMat = U.plastic(0x252c38, 0.44);
      const accentCapMat = U.plastic(0xc85a32, 0.42);

      keyEntries = [];
      keyMeshMap.clear();
      rows.forEach((row, rIdx) => {
        const zOff = -0.102 + rIdx * 0.051;
        const yBase = 0.023 - rIdx * 0.0038;
        if (rIdx === 4) {
          const ledMat = U.led(0x58c4ff, 0.55);
          const cap = new B(spaceGeo, accentCapMat);
          cap.position.set(0, yBase, zOff);
          cap.rotation.x = 0.075;
          cap.add(makeLegendTop(0.28, 4, 5, 6));
          const under = new B(new te(0.3, 0.004, 0.036), ledMat);
          under.position.set(0, yBase - 0.007, zOff);
          kbdGroup.add(under);
          kbdGroup.add(cap);
          const entry = {
            ch: " ",
            cap,
            under,
            y0: yBase,
            press: 0,
            idx: keyEntries.length,
          };
          keyEntries.push(entry);
          keyMeshMap.set(cap, entry);
          return;
        }
        row.forEach((ch, cIdx) => {
          const isWide = ch === "\n" || ch === "\b" || ch === "\t";
          const xOff =
            -0.365 +
            (rIdx === 2 ? 0.035 : rIdx === 3 ? 0.075 : 0) +
            cIdx * 0.054 +
            (isWide && cIdx > 0 ? 0.016 : 0);
          const ledMat = U.led(0x58c4ff, 0.5);
          const cap = new B(
            isWide ? wideGeo : capGeo,
            ch === "\n" || ch === "`" ? accentCapMat : darkCapMat,
          );
          cap.position.set(xOff, yBase, zOff);
          cap.rotation.x = 0.075;
          cap.add(makeLegendTop(isWide ? 0.07 : 0.036, rIdx, cIdx, isWide ? 2 : 1));
          const under = new B(new te(isWide ? 0.072 : 0.036, 0.004, 0.036), ledMat);
          under.position.set(xOff, yBase - 0.007, zOff);
          kbdGroup.add(under);
          kbdGroup.add(cap);
          const entry = { ch, cap, under, y0: yBase, press: 0, idx: keyEntries.length };
          keyEntries.push(entry);
          keyMeshMap.set(cap, entry);
        });
      });

      // Custom braided USB-C coiled cable + chrome GX16 5-pin aviator detachment barrel
      buildCoiledCable(
        k,
        [
          [-0.29, 0.022, 0.7],
          [-0.21, 0.022, 0.65],
          [-0.1, 0.022, 0.64],
        ],
        0.016,
        0.0045,
        20,
        0xc85a32,
      );
      const gx16 = new B(new ke(0.009, 0.009, 0.044, 18), U.knurl(0xbac1c9, 0.25));
      gx16.rotation.z = Math.PI / 2;
      gx16.position.set(-0.072, 0.022, 0.64);
      k.root.add(gx16);
      Dt(
        k,
        [
          [-0.05, 0.022, 0.64],
          [-0.02, 0.018, 0.57],
          [0.02, 0.024, 0.51],
        ],
        0.0045,
        0x222832,
      );

      // Sculpted ergonomic ultralight wireless mouse beside keyboard
      const mouseGroup = k.group([0.48, 0.012, 0.86], {
        name: "Ultralight wireless mouse (4000 Hz)",
        info: "54 g magnesium-composite optical mouse with PixArt PAW3395 26K CPI sensor, optical microswitches, side thumb buttons, and virgin PTFE glide skates.",
        explode: [0.18, 0, 0.28],
      });
      const mouseShell = new B(new Mt(0.068, 28, 20), U.plastic(0x222834, 0.38));
      mouseShell.scale.set(0.78, 0.48, 1.38);
      mouseShell.position.y = 0.018;
      mouseGroup.add(mouseShell);
      // Split M1/M2 trigger seam + DPI LED + side thumb buttons + PTFE skates
      mouseGroup.add(
        Qs(
          new B(new te(0.0025, 0.012, 0.072), U.plastic(0x0d1016, 0.7)),
          0,
          0.044,
          -0.042,
        ),
      );
      for (const tz of [-0.01, 0.022]) {
        mouseGroup.add(
          Qs(
            new B(chamferBox(0.006, 0.008, 0.024, 0.002), U.plastic(0xc85a32, 0.4)),
            -0.051,
            0.028,
            tz,
          ),
        );
      }
      mouseGroup.add(
        Qs(new B(new Mt(0.0035, 10, 8), U.led(0x5fe08a, 0.8)), 0, 0.048, -0.008),
      );
      const wheel = new B(new ke(0.012, 0.012, 0.009, 20), U.knurl(0x2c3442, 0.4));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(0, 0.044, -0.036);
      mouseGroup.add(wheel);
      const wheelRing = new B(new Pi(0.0122, 0.0018, 8, 24), U.led(0x58c4ff, 0.95));
      wheelRing.rotation.y = Math.PI / 2;
      wheelRing.position.set(0, 0.044, -0.036);
      mouseGroup.add(wheelRing);

      drawMonitorComposite();
    },

    onPick(part, hit) {
      if (hit && hit.object) {
        if (hit.object.userData && hit.object.userData.isMonSwitch) {
          const order = ["split", "gpu", "os"];
          monMode = order[(order.indexOf(monMode) + 1) % order.length];
          if (uiRefs.monSel) uiRefs.monSel.value = monMode;
          hi("switch", { on: !0, v: 0.65 });
          drawMonitorComposite();
          return !0;
        }
        const keyEntry = keyMeshMap.get(hit.object);
        if (keyEntry) {
          keyEntry.press = 1;
          cpu.pushKey(keyEntry.ch);
          hi("key", { f: 1100 + (keyEntry.idx % 12) * 55, v: 0.7 });
          syncCpuUi();
          return !0;
        }
      }
      return !1;
    },

    ui(k) {
      // Tab / View Mode switcher
      const gpuWrap = q("div");
      const cpuWrap = q("div");
      let viewTab = "both";

      const updateTabVis = () => {
        gpuWrap.style.display = viewTab === "cpu" ? "none" : "";
        cpuWrap.style.display = viewTab === "gpu" ? "none" : "";
        tabBtns.forEach(([id, btn]) => btn.classList.toggle("on", id === viewTab));
      };
      const tabBtns = [
        [
          "both",
          Fe("⚡ Dual Engine (GPU + CPU)", () => ((viewTab = "both"), updateTabVis())),
        ],
        ["cpu", Fe("🖥 RV32IM CPU & Mini-OS", () => ((viewTab = "cpu"), updateTabVis()))],
        ["gpu", Fe("🎨 WebGL2 GPU Shader", () => ((viewTab = "gpu"), updateTabVis()))],
      ];

      uiRefs.monSel = st(
        [
          ["split", "Split: GPU + RV32 OS"],
          ["gpu", "Full GPU Shader"],
          ["os", "Full RV32 OS & Pipeline"],
        ].map((x) => x[0]),
        monMode,
        (val) => {
          monMode = val;
          drawMonitorComposite();
        },
      );
      // Friendly labels on monitor select options
      [
        ["split", "3D Monitor: Split (GPU + OS)"],
        ["gpu", "3D Monitor: Full GPU Shader"],
        ["os", "3D Monitor: Full RV32 OS"],
      ].forEach(([val, text], idx) => {
        if (uiRefs.monSel.options[idx]) uiRefs.monSel.options[idx].textContent = text;
      });

      // ---- GPU Shader Section (kept first so layer-stack kn() reads GLSL cleanly) ----
      uiRefs.code = Ht(curShader.src, (src) => compileAndApplyShader(src), 13, 420);
      uiRefs.err = q("div", { class: "err" });
      uiRefs.view = q("canvas", {
        width: Mi,
        height: Mi,
        class: "plot",
        style: {
          width: "100%",
          maxWidth: "340px",
          aspectRatio: "1",
          imageRendering: "auto",
          cursor: "crosshair",
        },
      });
      const updateMouse = (ev, down) => {
        const rect = uiRefs.view.getBoundingClientRect();
        mouseVec.x = ((ev.clientX - rect.left) / Math.max(1, rect.width)) * xi;
        mouseVec.y = (1 - (ev.clientY - rect.top) / Math.max(1, rect.height)) * xi;
        if (down !== void 0) mouseVec.z = down ? 1 : 0;
      };
      uiRefs.view.addEventListener("pointerdown", (ev) => updateMouse(ev, !0));
      uiRefs.view.addEventListener("pointermove", (ev) => updateMouse(ev));
      window.addEventListener("pointerup", () => (mouseVec.z = 0));

      uiRefs.gpuStats = Pt([
        ["inv", "threads/frame"],
        ["fps", "frames/s"],
        ["mp", "Mpixel/s"],
        ["ucpu", "PCIe uCPU.xyz"],
      ]);

      gpuWrap.append(
        Ie(
          "WebGL2 GPU Program (GLSL ES 3.0 — compiled live by your GPU driver)",
          q(
            "div",
            { class: "row" },
            "Preset ",
            st(shaderNames, shaderNames[0], (name) => {
              curShader = C0[name];
              uiRefs.code.value = curShader.src;
              compileAndApplyShader(curShader.src, !0);
            }),
            Fe("Restart (iFrame=0)", () => {
              frameIdx = 0;
            }),
          ),
          uiRefs.code,
          uiRefs.err,
          q(
            "div",
            { class: "small" },
            "Uniforms: iTime, iResolution, iMouse, iFrame, iPrev, plus uCPU (vec4 streamed live over PCIe MMIO 0x20000000 from the RV32IM CPU!).",
          ),
        ),
        Ie("GPU Output Preview (drag/click to interact)", uiRefs.view, uiRefs.gpuStats),
      );

      // ---- RV32IM CPU, 5-Stage Pipeline, Cache & Mini-OS Shell Section ----
      const progNames = Object.keys(RV32_PROGRAMS);
      uiRefs.asm = Ht(
        cpu.currentAsm,
        (asmText) => {
          try {
            cpu.loadProgram(asmText, !0);
            uiRefs.asmErr.textContent = "";
            syncCpuUi();
          } catch (err) {
            uiRefs.asmErr.textContent = String(err.message || err);
          }
        },
        12,
        450,
      );
      uiRefs.asmErr = q("div", { class: "err" });
      uiRefs.runBtn = Fe(
        "⏸ Pause CPU",
        () => {
          cpuRunning = !cpuRunning;
          uiRefs.runBtn.textContent = cpuRunning ? "⏸ Pause CPU" : "▶ Run CPU";
          uiRefs.runBtn.classList.toggle("on", cpuRunning);
        },
        "pri on",
      );

      uiRefs.cpuStats = Pt([
        ["pc", "PC"],
        ["ipc", "IPC"],
        ["l1d", "L1D Hit"],
        ["bp", "Branch Pred"],
        ["fwd", "Forwards/Stalls"],
        ["mmio", "GPU MMIO"],
      ]);
      uiRefs.pipeView = q("pre", {
        class: "regs",
        style: { fontSize: "11px", margin: "4px 0" },
      });
      uiRefs.term = q("pre", {
        class: "term",
        style: { minHeight: "115px", maxHeight: "180px" },
      });
      const cmdInput = q("input", {
        type: "text",
        placeholder:
          "Mini-OS shell: help, ls, run primes, run sort, pipe, cache, gpu 0 420…",
        style: { flex: "1", minWidth: "180px" },
      });
      const runShellCmd = () => {
        const val = cmdInput.value;
        if (!val.trim()) return;
        cmdInput.value = "";
        cpu.execShell(val);
        hi("key", { f: 1320, v: 0.55 });
        syncCpuUi();
      };
      cmdInput.addEventListener("keydown", (ev) => {
        ev.stopPropagation();
        if (ev.key === "Enter") runShellCmd();
      });

      cpuWrap.append(
        Ie(
          "Mini-OS Terminal & Interactive Shell (NVMe Gen4 SSD + UART 0x10000000)",
          uiRefs.term,
          q(
            "div",
            { class: "row" },
            cmdInput,
            Fe("Run cmd", runShellCmd, "pri"),
            Fe("help", () => (cpu.execShell("help"), syncCpuUi())),
            Fe("primes", () => (cpu.execShell("run primes"), syncCpuUi())),
            Fe("bench", () => (cpu.execShell("bench"), syncCpuUi())),
          ),
        ),
        Ie(
          "RV32IM 5-Stage Pipeline (IF→ID→EX→MEM→WB) & Set-Associative Caches",
          q(
            "div",
            { class: "row" },
            uiRefs.runBtn,
            Fe("Step 1 instr", () => {
              cpuRunning = !1;
              uiRefs.runBtn.textContent = "▶ Run CPU";
              uiRefs.runBtn.classList.remove("on");
              if (cpu.halted) cpu.resetState(!0);
              cpu.step();
              hi("clock", { ph: !0, min: 0.02, m: "pc20" });
              syncCpuUi();
            }),
            Fe("Reset CPU", () => {
              cpu.loadProgram(uiRefs.asm.value, !1);
              syncCpuUi();
            }),
          ),
          We(
            "CPU clock",
            10,
            50000,
            10,
            cpuSpeed,
            (val) => (cpuSpeed = +val),
            (val) => (val >= 1000 ? (val / 1000).toFixed(1) + " kIPS" : val + " IPS"),
          ),
          uiRefs.cpuStats,
          uiRefs.pipeView,
        ),
        Ie(
          "RISC-V (RV32IM) Live Assembler — edits assemble & load into RAM",
          q(
            "div",
            { class: "row" },
            "NVMe Program ",
            st(progNames, progNames[0], (pName) => {
              const src = RV32_PROGRAMS[pName];
              uiRefs.asm.value = src;
              uiRefs.asmErr.textContent = "";
              cpu.loadProgram(src, !1);
              cpuRunning = !0;
              uiRefs.runBtn.textContent = "⏸ Pause CPU";
              uiRefs.runBtn.classList.add("on");
              syncCpuUi();
            }),
          ),
          uiRefs.asm,
          uiRefs.asmErr,
        ),
      );

      k.append(
        Ie(
          "Workstation View & 3D Display Routing",
          q("div", { class: "row" }, ...tabBtns.map((x) => x[1]), uiRefs.monSel),
        ),
        gpuWrap,
        cpuWrap,
      );

      cpu.execShell("cat /etc/sysinfo.txt");
      updateTabVis();
      syncCpuUi();
    },

    update(dt, elapsed) {
      // 1. Step RV32IM Pipelined CPU & decay thermal/bus activity
      if (cpuRunning && !cpu.halted) {
        cpuAcc += dt * cpuSpeed;
        const nSteps = Math.min(4000, Math.floor(cpuAcc));
        if (nSteps > 0) {
          cpuAcc -= nSteps;
          cpu.runSteps(nSteps);
        }
      }
      cpu.decayHeat(dt);

      // Forward CPU PCIe MMIO registers (0x20000000..0x2000000C) to WebGL2 GPU uniform uCPU!
      const [ux, uy, uz, uw] = cpu.gpuUniformVec4();
      uniforms.uCPU.value.set(ux, uy, uz, uw);

      // Animate 16 CCD core LEDs, DDR5 lightbars, NVMe activity LED, and 3D RGB keyboard
      ccdCoreMeshes.forEach((mesh, idx) => {
        mesh.material.emissiveIntensity =
          0.18 + 1.85 * cpu.coreHeat[idx] + 0.08 * Math.sin(elapsed * 4 + idx);
      });
      ddrLedMeshes.forEach((bar, idx) => {
        bar.material.emissiveIntensity =
          0.25 + 1.6 * cpu.busPulses.ddr + 0.12 * Math.sin(elapsed * 3 + idx);
      });
      if (nvmeLedMesh) {
        nvmeLedMesh.material.emissiveIntensity = 0.2 + 2.2 * cpu.busPulses.nvme;
      }

      rgbPhase += dt * 0.45;
      for (let i = 0; i < keyEntries.length; i++) {
        const ke = keyEntries[i];
        if (ke.press > 0.001) {
          ke.press = Math.max(0, ke.press - dt * 7.5);
          ke.cap.position.y = ke.y0 - ke.press * 0.0075;
        }
        const hue = (rgbPhase + ke.idx * 0.018) % 1;
        ke.under.material.emissive.setHSL(hue, 0.85, 0.52);
        ke.under.material.emissiveIntensity = 0.35 + ke.press * 2.1;
      }

      // 2. Execute Real WebGL2 GPU Shader Pass (262,144 parallel threads)
      uniforms.iTime.value += dt;
      uniforms.iFrame.value = frameIdx;
      const prevRT = curShader.compute && frameIdx % 2 ? rtA : rtB;
      const nextRT = curShader.compute && frameIdx % 2 ? rtB : rtA;
      uniforms.iPrev.value = prevRT.texture;

      const t0 = performance.now();
      glRenderer.setRenderTarget(nextRT);
      glRenderer.render(gpuQuadScene, orthoCam);
      if (curShader.compute) {
        for (let step = 0; step < 2; step++) {
          frameIdx++;
          uniforms.iFrame.value = frameIdx;
          const pRT = frameIdx % 2 ? rtA : rtB;
          const nRT = frameIdx % 2 ? rtB : rtA;
          uniforms.iPrev.value = pRT.texture;
          glRenderer.setRenderTarget(nRT);
          glRenderer.render(gpuQuadScene, orthoCam);
        }
      }
      const outRT = curShader.compute ? (frameIdx % 2 ? rtB : rtA) : nextRT;
      dispMat.uniforms.tex.value = outRT.texture;
      dispMat.uniforms.mode.value = /Gray-Scott/.test(curShader.src) ? 1 : 0;
      glRenderer.setRenderTarget(rtDisplay);
      glRenderer.render(dispScene, orthoCam);
      glRenderer.setRenderTarget(rtReadback);
      glRenderer.render(dispScene, orthoCam);
      if (frameIdx % PC20_READBACK_EVERY === 0) {
        glRenderer.readRenderTargetPixels(rtReadback, 0, 0, Mi, Mi, readbackBuf);
        updateReadbackAndSMs();
        drawMonitorComposite();
      }
      glRenderer.setRenderTarget(null);
      // CPU-side command submission time (plus the readback stall on readback frames). WebGL has no
      // portable GPU timer in all browsers, so this is labelled as CPU submit time (REVIEW-v5 B9).
      gpuFrameMs = performance.now() - t0;
      frameIdx++;
      fpsSmooth = fpsSmooth * 0.9 + (1 / Math.max(dt, 0.001)) * 0.1;

      // 3. Pulse 2D Architecture Diagram & Update Telemetry UI
      const diag = v.diag;
      if (diag) {
        if (!cpu.halted && cpuRunning) diag.pulse("ccd", "iod", "#ff8a50", 2.8);
        if (cpu.busPulses.pcie > 0.1 || frameIdx % 4 === 0)
          diag.pulse("iod", "gpu", "#ffd166", 3.1);
        if (cpu.busPulses.ddr > 0.1) diag.pulse("iod", "ddr", "#58c4ff", 2.6);
        if (cpu.busPulses.nvme > 0.1) diag.pulse("iod", "nvme", "#ffb347", 2.4);
        diag.pulse("gpu", "vram", "#5fe08a", 3);
        diag.pulse("gpu", "disp", "#e6edf3", 3);
        diag.activate("gpu", 1);
        if (!cpu.halted && cpuRunning) diag.activate("ccd", 0.85);
      }

      if (uiRefs.gpuStats) {
        const mult = curShader.compute ? 3 : 1;
        uiRefs.gpuStats.set("inv", (xi * xi * mult).toLocaleString());
        uiRefs.gpuStats.set("fps", fpsSmooth.toFixed(0));
        uiRefs.gpuStats.set("mp", ((xi * xi * mult * fpsSmooth) / 1e6).toFixed(1));
        uiRefs.gpuStats.set(
          "ucpu",
          `${ux.toFixed(2)}, ${uy.toFixed(2)}, ${uz.toFixed(2)}`,
        );
      }

      uiSyncTimer += dt;
      if (uiSyncTimer > 0.12) {
        uiSyncTimer = 0;
        syncCpuUi();
      }
    },
  };

  function syncCpuUi() {
    if (!uiRefs.cpuStats) return;
    uiRefs.cpuStats.set("pc", `0x${bt(cpu.pc, 4)}${cpu.halted ? " (HALT)" : ""}`);
    uiRefs.cpuStats.set("ipc", cpu.ipc().toFixed(2));
    uiRefs.cpuStats.set("l1d", (cpu.l1d.hitRate() * 100).toFixed(1) + "%");
    uiRefs.cpuStats.set("bp", (cpu.bpAccuracy() * 100).toFixed(1) + "%");
    uiRefs.cpuStats.set("fwd", `${cpu.stats.forwards} / ${cpu.stats.loadStalls}`);
    uiRefs.cpuStats.set("mmio", String(cpu.stats.mmioGpuWrites));

    const p = cpu.pipe;
    const regRow = [1, 2, 5, 6, 8, 9, 10, 17]
      .map((rIdx) => `${ABI_NAMES[rIdx]}=0x${bt(cpu.regs[rIdx], 8)}`)
      .join("  ");
    uiRefs.pipeView.textContent =
      `IF : [0x${bt(p.IF.pc, 4)}] ${p.IF.text}    | ID : [0x${bt(p.ID.pc, 4)}] ${p.ID.text}\n` +
      `EX : [0x${bt(p.EX.pc, 4)}] ${p.EX.text}    | MEM: [0x${bt(p.MEM.pc, 4)}] ${p.MEM.text} -> WB: [0x${bt(p.WB.pc, 4)}]\n` +
      `${regRow}`;

    if (uiRefs.term && uiRefs.term._last !== cpu.termOut) {
      uiRefs.term._last = cpu.termOut;
      uiRefs.term.textContent = cpu.termOut || "(Mini-OS ready — type 'help')";
      uiRefs.term.scrollTop = uiRefs.term.scrollHeight;
    }
  }

  function updateReadbackAndSMs() {
    gpuImgData || (gpuImgData = gpuPreviewCtx.createImageData(Mi, Mi));
    for (let row = 0; row < Mi; row++) {
      gpuImgData.data.set(
        readbackBuf.subarray((Mi - 1 - row) * Mi * 4, (Mi - row) * Mi * 4),
        row * Mi * 4,
      );
    }
    gpuPreviewCtx.putImageData(gpuImgData, 0, 0);
    if (uiRefs.view) {
      const vctx = uiRefs.view.getContext("2d");
      vctx.drawImage(gpuPreviewCanvas, 0, 0);
    }

    for (let sm = 0; sm < smMeshes.length; sm++) {
      const gx = sm % 8;
      const gy = Math.floor(sm / 8);
      let lum = 0;
      for (let sy = 0; sy < 8; sy++) {
        for (let sx = 0; sx < 8; sx++) {
          const px = Math.floor(((gx + sx / 8) * Mi) / 8);
          const idx = (Math.floor(((gy + sy / 8) * Mi) / 6) * Mi + px) * 4;
          lum += readbackBuf[idx] + readbackBuf[idx + 1] + readbackBuf[idx + 2];
        }
      }
      smMeshes[sm].material.emissiveIntensity = 0.12 + (2.1 * lum) / (64 * 765);
    }
  }

  function drawMonitorComposite() {
    if (!monSurface) return;
    const ctx = monSurface.ctx;
    const W = 1024;
    const H = 576;
    ctx.save();
    ctx.scale(2, 2);
    ctx.fillStyle = "#060a10";
    ctx.fillRect(0, 0, W, H);

    // Top workstation status bar
    ctx.fillStyle = "#0e1622";
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = "#58c4ff";
    ctx.font = "bold 14px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText("◈ ZEN-RV32IM // AD104 WORKSTATION OS", 14, 20);
    ctx.fillStyle = "#9fb3c8";
    ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText(
      `IPC ${cpu.ipc().toFixed(2)} · L1D ${(cpu.l1d.hitRate() * 100).toFixed(0)}% · GPU ${fpsSmooth.toFixed(0)} FPS · MODE: ${monMode.toUpperCase()}`,
      W - 430,
      20,
    );

    if (monMode === "gpu") {
      ctx.drawImage(gpuPreviewCanvas, 0, 30, W, H - 30);
      ctx.restore();
      monSurface.tex.needsUpdate = !0;
      return;
    }

    let termX = 16;
    let termW = W - 32;
    if (monMode === "split") {
      // Left pane: crisp 546x546 GPU viewport (1092x1092 physical pixels!)
      ctx.drawImage(gpuPreviewCanvas, 0, 30, 546, 546);
      ctx.strokeStyle = "#263548";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 31, 545, 544);
      ctx.fillStyle = "rgba(7, 11, 18, 0.78)";
      ctx.fillRect(10, H - 34, 332, 24);
      ctx.fillStyle = "#76e058";
      ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
      ctx.fillText(
        `WebGL2 ${xi}×${xi} · frame ${frameIdx} · uCPU.x=${uniforms.uCPU.value.x.toFixed(2)}`,
        18,
        H - 18,
      );
      termX = 560;
      termW = W - 572;
    }

    // Right / Full OS Pane: Live 5-Stage Pipeline + Cache Bars + Terminal Output
    ctx.fillStyle = "#0a1018";
    ctx.fillRect(termX, 38, termW, 152);
    ctx.strokeStyle = "#223042";
    ctx.strokeRect(termX, 38, termW, 152);

    ctx.fillStyle = "#ffb347";
    ctx.font = "bold 13px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText(
      `RV32IM 5-STAGE PIPELINE · PC 0x${bt(cpu.pc, 4)} · ${cpu.stats.instret.toLocaleString()} INSTR`,
      termX + 10,
      58,
    );

    const stages = ["IF", "ID", "EX", "MEM", "WB"];
    const boxW = Math.floor((termW - 28) / 5);
    stages.forEach((stName, idx) => {
      const bx = termX + 10 + idx * boxW;
      const stg = cpu.pipe[stName];
      ctx.fillStyle = stg.valid ? "#152538" : "#10161f";
      ctx.fillRect(bx, 68, boxW - 6, 52);
      ctx.strokeStyle = stg.valid ? "#58c4ff" : "#283342";
      ctx.strokeRect(bx, 68, boxW - 6, 52);
      ctx.fillStyle = "#58c4ff";
      ctx.font = "bold 12px ui-monospace, monospace";
      ctx.fillText(stName, bx + 6, 84);
      ctx.fillStyle = "#e6edf3";
      ctx.font = "10px ui-monospace, monospace";
      ctx.fillText(`0x${bt(stg.pc, 4)}`, bx + 6, 99);
      ctx.fillStyle = "#9fb3c8";
      ctx.fillText(String(stg.text || "").slice(0, 12), bx + 6, 113);
    });

    // Cache hit bars
    [
      ["L1I", cpu.l1i.hitRate(), "#58c4ff"],
      ["L1D", cpu.l1d.hitRate(), "#5fe08a"],
      ["L2", cpu.l2.hitRate(), "#ffb347"],
    ].forEach(([lbl, rate, col], idx) => {
      const cw = Math.floor((termW - 28) / 3);
      const cx = termX + 10 + idx * cw;
      ctx.fillStyle = "#141d29";
      ctx.fillRect(cx, 132, cw - 8, 12);
      ctx.fillStyle = col;
      ctx.fillRect(cx, 132, Math.max(2, (cw - 8) * rate), 12);
      ctx.fillStyle = "#d9e5f2";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`${lbl} ${(rate * 100).toFixed(0)}%`, cx + 4, 158);
    });

    // Console window
    ctx.fillStyle = "#05080d";
    ctx.fillRect(termX, 198, termW, H - 208);
    ctx.strokeStyle = "#1f2c3d";
    ctx.strokeRect(termX, 198, termW, H - 208);
    ctx.fillStyle = "#7dff9c";
    ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
    const maxChars = Math.max(28, Math.floor((termW - 20) / 7.3));
    const rawLines = (cpu.termOut || "$ _").split("\n");
    const wrapped = [];
    for (const ln of rawLines) {
      if (ln.length <= maxChars) wrapped.push(ln);
      else {
        for (let p = 0; p < ln.length; p += maxChars) {
          wrapped.push(ln.slice(p, p + maxChars));
        }
      }
    }
    const visible = wrapped.slice(-20);
    visible.forEach((ln, idx) => {
      ctx.fillText(ln, termX + 10, 220 + idx * 17);
    });

    ctx.restore();
    monSurface.tex.needsUpdate = !0;
  }

  function checkShaderSyntax(src) {
    const gl = glRenderer.getContext();
    const sh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(sh, "#version 300 es\n" + Hc + src + P0);
    gl.compileShader(sh);
    const log = gl.getShaderParameter(sh, gl.COMPILE_STATUS)
      ? ""
      : gl.getShaderInfoLog(sh) || "GLSL compile error";
    gl.deleteShader(sh);
    return log.replace(
      /ERROR: 0:(\d+)/g,
      (_, lineStr) => "ERROR line " + (+lineStr - Hc.split("\n").length),
    );
  }

  function compileAndApplyShader(src, resetFrame) {
    const err = checkShaderSyntax(src);
    lastErr = err;
    if (uiRefs.err) uiRefs.err.textContent = err;
    if (err) return !1;
    if (!resetFrame) curShader = { ...curShader, src };
    gpuMat.fragmentShader = Hc + src + P0;
    gpuMat.needsUpdate = !0;
    if (resetFrame || curShader.compute) frameIdx = 0;
    return !0;
  }

  v.test = () => {
    // 1. Real WebGL2 GPU Shader Compilation & 4,096-Pixel Readback Test
    const testGlsl =
      "void mainImage(out vec4 o, in vec2 f){ float v = mod(floor(f.x) * floor(f.y), 251.0); o = vec4(v / 255.0, 0.0, 0.0, 1.0); }";
    const err = checkShaderSyntax(testGlsl);
    if (err) return { ok: !1, err };
    const mat = new nn({
      glslVersion: Gn,
      uniforms,
      vertexShader: h1,
      fragmentShader: Hc + testGlsl + P0,
    });
    const sc = new Ni();
    sc.add(new B(new mt(2, 2), mat));
    const rt = new kt(64, 64, { depthBuffer: !1 });
    glRenderer.setRenderTarget(rt);
    glRenderer.render(sc, orthoCam);
    const buf = new Uint8Array(4096 * 4);
    glRenderer.readRenderTargetPixels(rt, 0, 0, 64, 64, buf);
    glRenderer.setRenderTarget(null);
    rt.dispose();
    mat.dispose();
    let mismatches = 0;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        if (Math.abs(buf[(y * 64 + x) * 4] - ((x * y) % 251)) > 1) mismatches++;
      }
    }
    const syntaxErrDetected = !!checkShaderSyntax(
      "void mainImage(out vec4 o, in vec2 f){ o = vec4(1.0) }",
    );

    // 2. Real RV32IM 5-Stage CPU + Cache + Assembler + MMIO Verification
    const testCpu = new RV32ModernSystem();
    testCpu.loadProgram(RV32_PROGRAMS["Sieve of Eratosthenes (Primes)"]);
    testCpu.runSteps(25000);
    const primesOk =
      testCpu.halted &&
      testCpu.termOut.includes("2 3 5 7 11 13") &&
      testCpu.termOut.includes("113") &&
      testCpu.l1d.hitRate() > 0.85;

    testCpu.loadProgram(RV32_PROGRAMS["Quicksort & Cache Benchmark"]);
    testCpu.runSteps(25000);
    const sortOk =
      testCpu.halted &&
      testCpu.termOut.includes("Sorted: 3 7 11 14 28 33 41 56 67 75 89 92");

    testCpu.execShell("gpu 0 512");
    const mmioOk = testCpu.gpuRegs[0] === 512;

    return {
      pixels_checked: 4096,
      mismatches,
      compile_error_detected: syntaxErrDetected,
      rv32_primes_ok: primesOk,
      rv32_quicksort_ok: sortOk,
      rv32_mmio_ok: mmioOk,
      rv32_ipc: +testCpu.ipc().toFixed(3),
      ok: mismatches === 0 && syntaxErrDetected && primesOk && sortOk && mmioOk,
    };
  };

  v.sim = {
    uniforms,
    cpu,
    get frame() {
      return frameIdx;
    },
    get shader() {
      return curShader;
    },
    get err() {
      return lastErr;
    },
    // CPU submit + readback time, not GPU execution time (see comment at the assignment)
    get frameMs() {
      return gpuFrameMs;
    },
    get cpuSubmitMs() {
      return gpuFrameMs;
    },
    pixel(k = 0) {
      return [
        readbackBuf[k * 4],
        readbackBuf[k * 4 + 1],
        readbackBuf[k * 4 + 2],
        readbackBuf[k * 4 + 3],
      ];
    },
    get sms() {
      return smMeshes.length;
    },
  };

  return v;
}
