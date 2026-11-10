function PA(i, e = 400, t = 0.1, n = 1) {
  let s = n,
    r = () => (s = (s * 16807) % 2147483647) / 2147483647,
    o = () => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()),
    a = [],
    l = [],
    c = 2;
  for (let h = 0; h < e; h++) {
    let d, u, f;
    if (i === "xor") ((d = r() * 2 - 1), (u = r() * 2 - 1), (f = d > 0 != u > 0 ? 1 : 0));
    else if (i === "circles") {
      f = h % 2;
      let p = f ? 0.35 : 0.8,
        x = r() * 6.283;
      ((d = p * Math.cos(x)), (u = p * Math.sin(x)));
    } else if (i === "moons") {
      f = h % 2;
      let p = r() * Math.PI;
      ((d = f ? 1 - Math.cos(p) - 0.5 : Math.cos(p) - 0.5),
        (u = f ? 0.5 - Math.sin(p) + 0.25 : Math.sin(p) - 0.25),
        (d *= 0.8),
        (u *= 0.8));
    } else {
      ((c = 3), (f = h % 3));
      let p = (h / e) * 0.9 + 0.05,
        x = f * 2.094 + p * 5.5;
      ((d = p * Math.cos(x)), (u = p * Math.sin(x)));
    }
    (a.push([d + o() * t * 0.3, u + o() * t * 0.3]), l.push(f));
  }
  return { X: a, Y: l, classes: c };
}
var db = {
    tanh: [Math.tanh, (i) => 1 - i * i],
    relu: [(i) => (i > 0 ? i : 0), (i) => (i > 0 ? 1 : 0)],
    sigmoid: [(i) => 1 / (1 + Math.exp(-i)), (i) => i * (1 - i)],
    gelu: [
      (i) => 0.5 * i * (1 + Math.tanh(0.7978845608 * (i + 0.044715 * i * i * i))),
      null,
    ],
  },
  u1 = class i {
    constructor(e, t = "tanh", n = 7) {
      ((this.sizes = e), (this.act = t));
      let s = n,
        r = () => (s = (s * 16807) % 2147483647) / 2147483647 - 0.5;
      ((this.W = []), (this.b = []), (this.P = 0));
      for (let o = 0; o < e.length - 1; o++) {
        let a = e[o],
          l = e[o + 1],
          c = Math.sqrt((t === "relu" ? 6 : 3) / a);
        (this.W.push(Float64Array.from({ length: l * a }, () => r() * 2 * c)),
          this.b.push(new Float64Array(l)),
          (this.P += l * a + l));
      }
    }
    params() {
      return [...this.W, ...this.b];
    }
    clone() {
      let e = Object.create(i.prototype);
      return (
        (e.sizes = this.sizes),
        (e.act = this.act),
        (e.P = this.P),
        (e.W = this.W.map((t) => t.slice())),
        (e.b = this.b.map((t) => t.slice())),
        e
      );
    }
    forward(e) {
      let t = [Float64Array.from(e)],
        n = this.W.length,
        s = db[this.act][0];
      for (let r = 0; r < n; r++) {
        let o = this.sizes[r],
          a = this.sizes[r + 1],
          l = this.W[r],
          c = t[r],
          h = new Float64Array(a);
        for (let d = 0; d < a; d++) {
          let u = this.b[r][d];
          for (let f = 0; f < o; f++) u += l[d * o + f] * c[f];
          h[d] = u;
        }
        if (r < n - 1) for (let d = 0; d < a; d++) h[d] = s(h[d]);
        else {
          let d = -1 / 0;
          for (let f of h) d = Math.max(d, f);
          let u = 0;
          for (let f = 0; f < a; f++) ((h[f] = Math.exp(h[f] - d)), (u += h[f]));
          for (let f = 0; f < a; f++) h[f] /= u;
        }
        t.push(h);
      }
      return t;
    }
    grad(e, t, n) {
      let s = this.W.length,
        r = new Float64Array(this.P),
        o = 0,
        a = 0,
        l = db[this.act][1],
        c = [],
        h = [],
        d = 0;
      for (let u = 0; u < s; u++) (c.push(d), (d += this.W[u].length));
      for (let u = 0; u < s; u++) (h.push(d), (d += this.b[u].length));
      for (let u of n) {
        let f = this.forward(e[u]),
          p = f[s];
        o -= Math.log(p[t[u]] + 1e-12);
        let x = 0;
        for (let m = 1; m < p.length; m++) p[m] > p[x] && (x = m);
        x === t[u] && a++;
        let g = Float64Array.from(p);
        g[t[u]] -= 1;
        for (let m = s - 1; m >= 0; m--) {
          let S = this.sizes[m],
            b = this.sizes[m + 1],
            y = f[m],
            E = this.W[m];
          for (let M = 0; M < b; M++) {
            r[h[m] + M] += g[M];
            for (let T = 0; T < S; T++) r[c[m] + M * S + T] += g[M] * y[T];
          }
          if (m > 0) {
            let M = new Float64Array(S);
            for (let T = 0; T < S; T++) {
              let A = 0;
              for (let v = 0; v < b; v++) A += E[v * S + T] * g[v];
              let w = y[T];
              M[T] = A * (l ? l(w) : IA(w));
            }
            g = M;
          }
        }
      }
      return { g: r, loss: o, correct: a };
    }
    flat() {
      let e = new Float64Array(this.P),
        t = 0;
      for (let n of this.params()) (e.set(n, t), (t += n.length));
      return e;
    }
    apply(e) {
      let t = 0;
      for (let n of this.params()) {
        for (let s = 0; s < n.length; s++) n[s] += e[t + s];
        t += n.length;
      }
    }
    predict(e) {
      let t = this.forward(e).at(-1),
        n = 0;
      for (let s = 1; s < t.length; s++) t[s] > t[n] && (n = s);
      return { c: n, p: t };
    }
  };
function IA(i) {
  return i > 0 ? 1 : 0.1;
}
function DA(i, e) {
  let t = i.length,
    n = i[0].length;
  if (t === 1) return i;
  let s = Array.from({ length: t + 1 }, (o, a) => Math.round((a * n) / t)),
    r = 0;
  for (let o = 0; o < t - 1; o++)
    for (let a = 0; a < t; a++) {
      let l = (a - o + t) % t,
        c = (a + 1) % t;
      for (let h = s[l]; h < s[l + 1]; h++) i[c][h] += i[a][h];
      ((r += (s[l + 1] - s[l]) * 4), e && e(a, c, "rs"));
    }
  for (let o = 0; o < t - 1; o++)
    for (let a = 0; a < t; a++) {
      let l = (a + 1 - o + t) % t,
        c = (a + 1) % t;
      for (let h = s[l]; h < s[l + 1]; h++) i[c][h] = i[a][h];
      ((r += (s[l + 1] - s[l]) * 4), e && e(a, c, "ag"));
    }
  return ((i.bytes = r), i);
}
var Gc = class {
  constructor(e) {
    ((this.o = {
      hidden: [16, 16],
      act: "tanh",
      lr: 0.03,
      batch: 64,
      gpus: 4,
      opt: "adam",
      l2: 1e-4,
      data: "spiral",
      noise: 0.15,
      ...e,
    }),
      this.reset());
  }
  reset() {
    let e = this.o;
    ((this.D = PA(e.data, 480, e.noise)),
      (this.sizes = [2, ...e.hidden, this.D.classes]),
      (this.replicas = Array.from({ length: e.gpus }, () => null)));
    let t = new u1(this.sizes, e.act);
    ((this.replicas = this.replicas.map(() => t.clone())),
      (this.m = new Float64Array(t.P)),
      (this.v = new Float64Array(t.P)),
      (this.t = 0),
      (this.step = 0),
      (this.lossHist = []),
      (this.accHist = []),
      (this.sends = []),
      (this.lastShards = []),
      (this.bytes = 0),
      (this.order = [...this.D.X.keys()]),
      (this.cursor = 0));
  }
  get model() {
    return this.replicas[0];
  }
  nextBatch() {
    let e = Math.min(this.o.batch, this.order.length),
      t = [];
    for (let n = 0; n < e; n++) {
      if (this.cursor >= this.order.length) {
        this.cursor = 0;
        for (let s = this.order.length - 1; s > 0; s--) {
          let r = Math.floor(Math.random() * (s + 1));
          [this.order[s], this.order[r]] = [this.order[r], this.order[s]];
        }
      }
      t.push(this.order[this.cursor++]);
    }
    return t;
  }
  trainStep() {
    let e = this.o,
      t = this.replicas.length,
      n = this.nextBatch(),
      s = n.length,
      r = Array.from({ length: t }, (f, p) => n.filter((x, g) => g % t === p));
    this.lastShards = r.map((f) => f.length);
    let o = 0,
      a = 0,
      l = r.map((f, p) => {
        let x = this.replicas[p].grad(this.D.X, this.D.Y, f);
        return ((o += x.loss), (a += x.correct), x.g);
      });
    ((this.sends = []),
      DA(l, (f, p, x) => this.sends.push([f, p, x])),
      (this.bytes = l.bytes || 0));
    let c = l[0],
      h = c.length,
      d = this.replicas[0].flat();
    this.t++;
    let u = new Float64Array(h);
    for (let f = 0; f < h; f++) {
      let p = c[f] / s + e.l2 * d[f];
      if (e.opt === "adam") {
        ((this.m[f] = 0.9 * this.m[f] + 0.1 * p),
          (this.v[f] = 0.999 * this.v[f] + 0.001 * p * p));
        let x = this.m[f] / (1 - 0.9 ** this.t),
          g = this.v[f] / (1 - 0.999 ** this.t);
        u[f] = (-e.lr * x) / (Math.sqrt(g) + 1e-8);
      } else ((this.m[f] = 0.9 * this.m[f] - e.lr * p), (u[f] = this.m[f]));
    }
    for (let f of this.replicas) f.apply(u);
    return (
      this.step++,
      this.lossHist.push(o / s),
      this.lossHist.length > 600 && this.lossHist.shift(),
      { loss: o / s, acc: a / s }
    );
  }
  accuracy() {
    let e = 0,
      t = this.model;
    for (let n = 0; n < this.D.X.length; n++)
      t.predict(this.D.X[n]).c === this.D.Y[n] && e++;
    return e / this.D.X.length;
  }
  inSync() {
    let e = this.replicas[0].flat();
    return this.replicas.every((t) => {
      let n = t.flat();
      for (let s = 0; s < e.length; s++) if (e[s] !== n[s]) return !1;
      return !0;
    });
  }
};
var qi = (i, e, t, n) => (i.position.set(e, t, n), i),
  f1 = ["#ff6b6b", "#58c4ff", "#5fe08a"];
function p1() {
  let i = new Gc({}),
    e = 4,
    t = !0,
    n = {},
    s = [],
    r = [],
    o = [],
    a,
    l = [0, 0, 0, 0],
    c = 0,
    h = {
      id: "aibox",
      era: "$100K",
      short: "AI home supercomputer",
      sim: i,
      name: "$100,000 AI Home Supercomputer (4 datacenter GPUs, HBM, NVLink, liquid cooling)",
      blurb:
        "A deskside AI workstation of the DGX-Station class (~$100–150K): four datacenter GPUs, each with 80 GB of HBM stacked right beside the die, joined in an NVLink ring so they can average gradients at hundreds of GB/s, all on a water loop because 4 × 400 W cannot be air-cooled under a desk. Below, a real neural network trains live in your browser, data-parallel exactly like on this box: each minibatch is split across the GPUs, each computes back-prop gradients on its shard, a ring all-reduce (reduce-scatter + all-gather) sums them over NVLink, and every replica applies the identical Adam/SGD update. Edit layers, activation, learning rate, batch, number of GPUs, dataset.",
      diagram: {
        nodes: [
          {
            id: "cpu",
            label: `Host CPU
64-core + DRAM`,
            x: 0.12,
            y: 0.5,
            w: 0.19,
            color: "#c9b07a",
          },
          {
            id: "g0",
            label: `GPU 0
+80 GB HBM`,
            x: 0.45,
            y: 0.18,
            w: 0.17,
            color: "#76b900",
          },
          {
            id: "g1",
            label: `GPU 1
+80 GB HBM`,
            x: 0.8,
            y: 0.18,
            w: 0.17,
            color: "#76b900",
          },
          {
            id: "g2",
            label: `GPU 2
+80 GB HBM`,
            x: 0.8,
            y: 0.82,
            w: 0.17,
            color: "#76b900",
          },
          {
            id: "g3",
            label: `GPU 3
+80 GB HBM`,
            x: 0.45,
            y: 0.82,
            w: 0.17,
            color: "#76b900",
          },
          {
            id: "nv",
            label: `NVLink ring
all-reduce`,
            x: 0.625,
            y: 0.5,
            w: 0.2,
            color: "#ffd166",
          },
        ],
        edges: [
          ["cpu", "g0", "PCIe"],
          ["cpu", "g3"],
          ["g0", "g1", "NVLink"],
          ["g1", "g2"],
          ["g2", "g3"],
          ["g3", "g0"],
          ["nv", "g0"],
          ["nv", "g2"],
        ],
      },
      build(g) {
        let m = U.metal(13149792, 0.35),
          S = U.metal(2500652, 0.45);
        (g.box(0.03, 1.3, 1.1, S, [0.32, 0.65, 0], {
          name: "Side panel",
          info: "Deskside chassis, ~1.5 kW at full load, quiet enough for an office thanks to the liquid loop.",
          shell: !0,
          explode: [0.6, 0, 0],
        }),
          g.box(0.03, 1.3, 1.1, S, [-0.32, 0.65, 0], {
            name: "Side panel",
            info: "",
            shell: !0,
            explode: [-0.6, 0, 0],
          }),
          g.box(0.66, 0.03, 1.1, S, [0, 1.3, 0], {
            name: "Top",
            info: "",
            shell: !0,
            explode: [0, 0.4, 0],
          }),
          g.box(0.66, 0.03, 1.1, S, [0, 0.015, 0], {}));
        let b = g.group([0, 0.65, 0.56], {
          name: "Champagne-gold front grille",
          info: "Perforated metal intake: cool air in through the front, across the radiator, out the back.",
        });
        b.add(qi(new B(new te(0.66, 1.3, 0.03), m), 0, 0, 0));
        let y = new ut(
            new ke(0.008, 0.008, 0.032, 6).rotateX(Math.PI / 2),
            U.plastic(1118481),
            880,
          ),
          E = new je(),
          M = 0;
        for (let k = 0; k < 40; k++)
          for (let L = 0; L < 22; L++)
            (E.position.set(
              -0.29 + L * 0.0275 + (k % 2) * 0.013,
              -0.55 + k * 0.025,
              0.002,
            ),
              E.updateMatrix(),
              y.setMatrixAt(M++, E.matrix));
        (b.add(y),
          [b.children[0], y].forEach((k) => {
            ((k.material = k.material.clone()),
              (k.material.userData.shell = !0),
              (k.userData.shellMesh = !0));
          }),
          b.userData.explode.set(0, 0, 0.5),
          (a = zi(
            g,
            0.22,
            0.1,
            [0, 0.52, 0.02],
            [320, 140],
            {
              name: "Front status LCD",
              info: "Shows the live training loss and accuracy.",
            },
            b,
          )));
        let T = g.group([0, 0.62, -0.02], {
          name: "GPU baseboard (4× SXM)",
          info: "GPUs mount as SXM modules (no PCIe card form factor) so each can take 400–700 W and expose all NVLink lanes. Host talks to them over PCIe 4/5 through switches.",
          explode: [0, 0.25, 0],
        });
        T.add(qi(new B(new te(0.58, 0.015, 0.8), U.pcb(997922)), 0, 0, 0));
        let A = [
          [-0.14, -0.2],
          [0.14, -0.2],
          [0.14, 0.2],
          [-0.14, 0.2],
        ];
        A.forEach(([k, L], z) => {
          let F = g.group(
            [k, 0.01, L],
            {
              name: `GPU ${z} (H100/A100-class SXM)`,
              info: "One ~800 mm² die: 132 SMs, 528 tensor cores doing 4×4 matrix FMAs in FP16/BF16/FP8 (~1,000 TFLOPS dense), 50 MB L2. Around it: 5–6 HBM stacks — DRAM dies stacked with through-silicon vias on a silicon interposer, 5,120-bit bus, ~3 TB/s. Glow = this GPU's share of the current step (forward, backward, all-reduce).",
              live: () => `shard size ${i.lastShards[z] ?? 0} samples
replica params ${i.model.P}  in sync: ${i.inSync()}`,
              explode: [k * 1.2, 0.2, L * 0.8],
            },
            T,
          );
          F.add(qi(new B(new te(0.22, 0.012, 0.3), U.pcb(1452572)), 0, 0.006, 0));
          F.add(
            qi(
              new B(chamferBox(0.14, 0.004, 0.16, 0.001), U.siliconDie(0x1b2a3c)),
              0,
              0.013,
              0,
            ),
          );
          let H = new B(chamferBox(0.072, 0.008, 0.072, 0.0015), U.led(7780608, 0.55));
          ((H.position.y = 0.017), F.add(H));
          let j = [];
          for (let ue = 0; ue < 6; ue++) {
            let Me = new B(new te(0.018, 0.01, 0.026), U.led(5817599));
            (Me.position.set(
              (ue % 2 ? 1 : -1) * 0.05,
              0.016,
              -0.03 + Math.floor(ue / 2) * 0.03,
            ),
              F.add(Me),
              j.push(Me));
          }
          let K = new B(new te(0.16, 0.02, 0.18), U.copper());
          ((K.position.y = 0.04),
            F.add(K),
            (K.userData.cold = !0),
            s.push({ g: F, die: H, hbm: j, cp: K }));
        });
        for (let k = 0; k < 4; k++) {
          let L = A[k],
            z = A[(k + 1) % 4],
            F = [(L[0] + z[0]) / 2, 0.06, (L[1] + z[1]) / 2],
            H = Math.hypot(L[0] - z[0], L[1] - z[1]) - 0.2,
            j = new B(
              new te(
                Math.abs(L[0] - z[0]) > 0.01 ? H : 0.03,
                0.01,
                Math.abs(L[1] - z[1]) > 0.01 ? H : 0.03,
              ),
              U.led(16765286),
            );
          (j.position.set(...F), T.add(j), r.push(j));
        }
        g.part(r[0], {
          name: "NVLink bridges",
          info: "NVLink 4: 18 links × 25 GB/s each way ≈ 900 GB/s per GPU, ~7× PCIe 5.0. Ring all-reduce sends 2(G−1)/G of the gradient over each link per step; NCCL pipelines it in chunks. They light up when the simulator's all-reduce actually moves gradient chunks.",
        });
        let w = [
            [-0.14, 0.68, -0.2],
            [-0.14, 0.85, -0.1],
            [0.14, 0.85, -0.2],
            [0.14, 0.68, -0.2],
            [0.14, 0.85, 0.15],
            [0.14, 0.68, 0.2],
            [-0.14, 0.85, 0.25],
            [-0.14, 0.68, 0.2],
            [-0.1, 1.05, -0.4],
            [0.1, 1.15, -0.45],
          ],
          v = g.tube(
            w,
            0.012,
            new et({
              color: 1073312,
              emissive: 1736959,
              emissiveIntensity: 0.4,
              roughness: 0.2,
              transparent: !0,
              opacity: 0.85,
            }),
            {
              name: "Coolant loop",
              info: "Water/glycol pumped through micro-fin copper cold plates on each GPU and the CPU, then through the radiator. Water carries ~3,500× more heat per volume than air.",
              seg: 120,
            },
          );
        o.push(v);
        let R = g.group([-0.18, 1, -0.42], {
          name: "Pump + reservoir",
          info: "DDC-style pump moves ~1 L/min; reservoir catches air bubbles.",
          explode: [-0.2, 0.2, -0.2],
        });
        R.add(qi(new B(new ke(0.05, 0.05, 0.22, 20), U.glass(10079487, 0.35)), 0, 0, 0));
        let _ = new B(new ke(0.044, 0.044, 0.18, 20), U.glow(1736959, 0.8));
        ((_.position.y = -0.01), R.add(_), o.push(_));
        let P = g.group([0.05, 1.18, -0.3], {
          name: "Radiator (360 mm) + 3 fans",
          info: "Copper/aluminium fin radiator dumping ~1.5 kW into the room.",
          explode: [0, 0.4, -0.2],
        });
        P.add(qi(new B(new te(0.5, 0.05, 0.4), U.alu()), 0, 0, 0));
        for (let k = 0; k < 3; k++)
          ni(
            g,
            0.07,
            [-0.17 + k * 0.17, -0.05, 0],
            { rot: [Math.PI / 2, 0, 0], speed: 14 },
            P,
          );
        {
          let k = new ut(new te(0.002, 0.044, 0.38), U.alu(), 120);
          for (let L = 0; L < 120; L++)
            (E.position.set(-0.24 + L * 0.004, 0, 0),
              E.rotation.set(0, 0, 0),
              E.updateMatrix(),
              k.setMatrixAt(L, E.matrix));
          P.add(k);
          for (let L = 0; L < 2; L++)
            P.add(
              qi(
                new B(new te(0.03, 0.055, 0.41), U.metal(2764083, 0.4)),
                L ? 0.265 : -0.265,
                0,
                0,
              ),
            );
        }
        {
          let k = g.group([0.17, 0.06, 0.28], {
            name: "Refrigerant compressor (rotary, on rubber grommets)",
            info: "NVIDIA describes DGX Station A100 cooling as a maintenance-free, refrigerant-based system. Modelled as a vapour-compression chiller: this rotary compressor squeezes refrigerant vapour (hot, high pressure) into the condenser up top; it speeds up with GPU heat load. Exact plumbing is not public, so the layout is generic but physically correct.",
            live: () =>
              `load ${((l.reduce((H, j) => H + j, 0) / 4) * 100).toFixed(0)} % · compressor ${t ? "on" : "idle"}`,
          });
          (k.add(
            qi(new B(new ke(0.06, 0.06, 0.16, 24), U.metal(1381914, 0.35)), 0, 0.1, 0),
          ),
            k.add(
              qi(
                new B(new Mt(0.06, 24, 12, 0, 6.283, 0, 1.57), U.metal(1381914, 0.35)),
                0,
                0.18,
                0,
              ),
            ));
          for (let H = 0; H < 3; H++) {
            let j = H * 2.094;
            k.add(
              qi(
                new B(new ke(0.012, 0.012, 0.02, 10), U.plastic(2236962, 0.9)),
                Math.cos(j) * 0.06,
                0.01,
                Math.sin(j) * 0.06,
              ),
            );
          }
          k.add(qi(new B(new te(0.05, 0.04, 0.03), U.plastic(3355443)), 0.07, 0.12, 0));
          let L = g.group([-0.2, 0.86, -0.42], {
            name: "Expansion valve (thermostatic)",
            info: "Throttles the high-pressure liquid refrigerant: it flashes to a cold low-pressure mix (~5 °C) that boils in the evaporator, soaking up the GPUs' heat.",
          });
          (L.add(
            qi(
              new B(new te(0.035, 0.035, 0.03), U.brass ? U.brass() : U.gold()),
              0,
              0,
              0,
            ),
          ),
            L.add(qi(new B(new ke(0.012, 0.012, 0.03, 10), U.gold()), 0, 0.03, 0)));
          let z = g.group([0.18, 0.86, -0.42], {
            name: "Evaporator plate heat exchanger",
            info: "Brazed stainless plates: boiling refrigerant on one side chills the pumped water/glycol loop on the other, which then flows over the GPU cold plates.",
          });
          z.add(qi(new B(new te(0.06, 0.16, 0.05), U.steel()), 0, 0, 0));
          for (let H = 0; H < 8; H++)
            z.add(
              qi(
                new B(new te(0.062, 0.003, 0.052), U.metal(9080726, 0.3)),
                0,
                -0.07 + H * 0.02,
                0,
              ),
            );
          let F = [
            [0.17, 0.26, 0.28],
            [0.26, 0.5, 0.2],
            [0.26, 1.1, -0.1],
            [0.2, 1.18, -0.3],
          ];
          (g.tube(F, 0.007, U.copper(), {
            name: "Refrigerant lines (copper)",
            info: "Hot gas from the compressor to the condenser; liquid line back through the expansion valve; suction line from the evaporator to the compressor.",
          }),
            g.tube(
              [
                [-0.2, 1.18, -0.3],
                [-0.24, 1.05, -0.42],
                [-0.2, 0.88, -0.42],
              ],
              0.006,
              U.copper(),
              {},
            ),
            g.tube(
              [
                [-0.18, 0.86, -0.42],
                [0.15, 0.86, -0.42],
              ],
              0.006,
              U.copper(),
              {},
            ),
            g.tube(
              [
                [0.18, 0.78, -0.42],
                [0.26, 0.5, 0],
                [0.17, 0.2, 0.28],
              ],
              0.008,
              U.copper(),
              {},
            ));
        }
        {
          let k = new _n(w.map((K) => new N(...K))),
            L = 70,
            z = new ut(new Mt(0.008, 8, 6), new xt({ toneMapped: !1 }), L),
            F = Array.from({ length: L }, (K, ue) => ue / L),
            H = new Ae();
          for (let K = 0; K < L; K++) z.setColorAt(K, H.setRGB(0.3, 0.6, 2));
          g.add(z, {});
          let j = 0;
          g.anims.push((K) => {
            let ue = t ? l.reduce((Me, ee) => Me + ee, 0) / 4 : 0;
            j += K * (0.04 + 0.18 * ue);
            for (let Me = 0; Me < L; Me++) {
              let ee = (F[Me] + j) % 1;
              (E.position.copy(k.getPointAt(ee)),
                E.rotation.set(0, 0, 0),
                E.scale.setScalar(1),
                E.updateMatrix(),
                z.setMatrixAt(Me, E.matrix));
              let X = Math.min(1, ee * 1.25) * (0.3 + 0.7 * ue);
              z.setColorAt(
                Me,
                H.setRGB(0.3 + 2.6 * X, 0.7 + 0.6 * (1 - X) * 0.5, 2.2 * (1 - X) + 0.2),
              );
            }
            ((z.instanceMatrix.needsUpdate = !0), (z.instanceColor.needsUpdate = !0));
          });
        }
        let V = g.group([0, 0.22, -0.1], {
          name: "Host: 64-core EPYC/Threadripper + 512 GB DDR",
          info: "Feeds the GPUs: data loading, augmentation, tokenisation, checkpointing. In the simulator it shuffles the dataset and scatters minibatch shards to the GPUs every step.",
          explode: [0, -0.1, 0.3],
        });
        (V.add(qi(new B(new te(0.58, 0.015, 0.6), U.pcb(1710618)), 0, 0, 0)),
          V.add(qi(new B(new te(0.1, 0.02, 0.12), U.metal(12633288, 0.3)), 0, 0.02, 0)),
          vn(g, 0.12, 0.14, 0.05, [0, 0.03, 0], { fins: 10, base: U.copper() }, V));
        for (let k = 0; k < 8; k++) {
          let L = ps(
            g,
            [(k < 4 ? -0.17 : 0.11) + (k % 4) * 0.02, 0.01, 0],
            { len: 0.3, h: 0.06, chips: 6 },
            V,
          );
          L.rotation.y = Math.PI / 2;
        }
        for (let k = 0; k < 3; k++)
          g.box(
            0.08,
            0.02,
            0.12,
            U.metal(3816e3),
            [-0.18 + k * 0.1, 0.1, 0.42],
            k
              ? {}
              : {
                  name: "U.2 NVMe SSDs (3 × 7.68 TB)",
                  info: "Dataset cache. GPUDirect Storage can DMA from NVMe straight into GPU memory, bypassing the CPU.",
                },
          );
        for (let k = 0; k < 2; k++)
          g.box(
            0.25,
            0.08,
            0.35,
            U.metal(7829367),
            [-0.14 + k * 0.28, 0.06, -0.33],
            k
              ? {}
              : {
                  name: "2 × 1600 W PSUs",
                  info: "Redundant titanium-efficiency supplies on a standard 15–20 A outlet.",
                },
          );
      },
      ui(g) {
        ((n.board = It(260)),
          (n.loss = It(110)),
          (n.net = It(150)),
          (n.gpu = It(70)),
          (n.stats = Pt([
            ["step", "steps"],
            ["loss", "loss"],
            ["acc", "accuracy (all data)"],
            ["p", "parameters"],
            ["ar", "all-reduce bytes/step"],
            ["sync", "replicas in sync"],
          ])));
        let m = i.o,
          S = () => i.reset();
        ((n.hid = q("input", {
          type: "text",
          value: m.hidden.join(","),
          style: { width: "120px" },
          onkeydown: (b) => b.stopPropagation(),
          onchange: (b) => {
            let y = b.target.value
              .split(/[,\s]+/)
              .map(Number)
              .filter((E) => E > 0 && E <= 64);
            y.length && y.length <= 5 && ((m.hidden = y), S());
          },
        })),
          g.append(
            Ie(
              "Model & training (live)",
              q(
                "div",
                { class: "row" },
                "Dataset ",
                st(
                  [
                    ["spiral", "3-arm spiral"],
                    ["xor", "XOR"],
                    ["circles", "circles"],
                    ["moons", "two moons"],
                  ],
                  m.data,
                  (b) => {
                    ((m.data = b), S());
                  },
                ),
                " Hidden layers ",
                n.hid,
              ),
              q(
                "div",
                { class: "row" },
                "Activation ",
                st(["tanh", "relu", "sigmoid"], m.act, (b) => {
                  ((m.act = b), S());
                }),
                " Optimizer ",
                st(
                  [
                    ["adam", "Adam"],
                    ["sgd", "SGD + momentum"],
                  ],
                  m.opt,
                  (b) => {
                    m.opt = b;
                  },
                ),
              ),
              We(
                "Learning rate",
                -4,
                0,
                0.01,
                Math.log10(m.lr),
                (b) => (m.lr = 10 ** b),
                (b) => (10 ** b).toPrecision(2),
              ),
              We("Batch size", 4, 256, 4, m.batch, (b) => (m.batch = b)),
              We("GPUs (data-parallel)", 1, 4, 1, m.gpus, (b) => {
                ((m.gpus = b), S());
              }),
              We("L2 weight decay", 0, 0.01, 1e-4, m.l2, (b) => (m.l2 = b)),
              We("Label noise", 0, 0.6, 0.01, m.noise, (b) => {
                ((m.noise = b), S());
              }),
              q(
                "div",
                { class: "row" },
                Fe("Pause", (b) => {
                  ((t = !t), (b.target.textContent = t ? "Pause" : "Train"));
                }),
                Fe("Re-initialise", S),
                We("Steps / frame", 1, 30, 1, e, (b) => (e = b)),
              ),
            ),
            n.stats,
            Ie(
              "Decision boundary (the network's live prediction over the plane)",
              n.board,
            ),
            Ie("Training loss", n.loss),
            Ie("Network (line = weight, colour = sign)", n.net),
            Ie("GPU utilisation & NVLink traffic this step", n.gpu),
          ));
      },
      update(g) {
        let m = null;
        if (t) for (let E = 0; E < e; E++) m = i.trainStep();
        let S = i.replicas.length,
          b = h.diag;
        if (m) {
          for (let M = 0; M < S; M++)
            (b.pulse("cpu", "g" + Math.min(3, M), "#c9b07a", 3),
              (l[M] = Math.min(1, (i.lastShards[M] || 0) / Math.max(1, i.o.batch / S))));
          for (let M = S; M < 4; M++) l[M] = 0;
          let E = new Set();
          for (let [M, T] of i.sends) {
            let A = M + "-" + T;
            E.has(A) || (E.add(A), b.pulse("g" + M, "g" + T, "#ffd166", 3));
          }
        }
        (s.forEach((E, M) => {
          let T = t && M < S ? l[M] : 0;
          ((E.die.material.emissiveIntensity =
            0.1 + 2.2 * T * (0.7 + 0.3 * Math.random())),
            E.hbm.forEach(
              (A) => (A.material.emissiveIntensity = 0.05 + 1.6 * T * Math.random()),
            ));
        }),
          r.forEach((E, M) => {
            let T =
              t && S > 1 && (M < S - 1 || (S === 4 && M === 3) || (S > 1 && M === S - 1));
            E.material.emissiveIntensity = T ? 0.6 + 1.8 * Math.random() : 0.03;
          }),
          o.forEach(
            (E) =>
              (E.material.emissiveIntensity =
                0.4 + 0.25 * Math.sin(performance.now() / 300)),
          ),
          (i.step % 10 === 0 || !t) && (c = i.accuracy()));
        let y = n.stats;
        (y.set("step", i.step),
          y.set("loss", (i.lossHist.at(-1) ?? 0).toFixed(4)),
          y.set("acc", (c * 100).toFixed(1) + "%"),
          y.set("p", i.model.P),
          y.set("ar", i.bytes ? (i.bytes / 1024).toFixed(1) + " KB" : "n/a (1 GPU)"),
          y.set("sync", i.inSync() ? "yes ✓" : "NO"),
          (h._f = (h._f || 0) + 1) % 2 === 0 && d(),
          u(),
          h._f % 6 === 0 && f(),
          p(S),
          x());
      },
    };
  function d() {
    let g = n.board,
      m = yt(g),
      S = g.width,
      b = g.height,
      y = 56,
      E = S / y,
      M = b / y,
      T = i.model;
    for (let A = 0; A < y; A++)
      for (let w = 0; w < y; w++) {
        let v = ((A + 0.5) / y) * 2 - 1,
          R = 1 - ((w + 0.5) / y) * 2,
          { p: _ } = T.predict([v, R]),
          P = 0,
          V = 0,
          k = 0;
        (_.forEach((L, z) => {
          let F = f1[z];
          ((P += L * parseInt(F.slice(1, 3), 16)),
            (V += L * parseInt(F.slice(3, 5), 16)),
            (k += L * parseInt(F.slice(5, 7), 16)));
        }),
          (m.fillStyle = `rgb(${(P * 0.45) | 0},${(V * 0.45) | 0},${(k * 0.45) | 0})`),
          m.fillRect(A * E, w * M, E + 1, M + 1));
      }
    i.D.X.forEach((A, w) => {
      ((m.fillStyle = f1[i.D.Y[w]]),
        (m.strokeStyle = "#000"),
        m.beginPath(),
        m.arc(((A[0] + 1) / 2) * S, ((1 - A[1]) / 2) * b, Math.max(2.5, S / 140), 0, 7),
        m.fill(),
        m.stroke());
    });
  }
  function u() {
    let g = n.loss,
      m = yt(g),
      S = g.width,
      b = g.height;
    ((m.fillStyle = "#05080b"), m.fillRect(0, 0, S, b));
    let y = i.lossHist;
    if (y.length < 2) return;
    let E = Math.max(...y, 0.01);
    ((m.strokeStyle = "#ffd166"),
      (m.lineWidth = 2),
      m.beginPath(),
      y.forEach((M, T) => {
        let A = (T / (y.length - 1)) * S,
          w = b - 6 - (M / E) * (b - 12);
        T ? m.lineTo(A, w) : m.moveTo(A, w);
      }),
      m.stroke(),
      (m.fillStyle = "#8b98a9"),
      (m.font = "11px monospace"),
      m.fillText("max " + E.toFixed(3), 4, 12));
  }
  function f() {
    let g = n.net,
      m = yt(g),
      S = g.width,
      b = g.height;
    ((m.fillStyle = "#05080b"), m.fillRect(0, 0, S, b));
    let y = i.model,
      E = y.sizes,
      M = (A) => 20 + (A / (E.length - 1)) * (S - 40),
      T = (A, w) => b / 2 + (w - (E[A] - 1) / 2) * Math.min(14, (b - 16) / E[A]);
    for (let A = 0; A < E.length - 1; A++) {
      let w = 1e-6;
      for (let v of y.W[A]) w = Math.max(w, Math.abs(v));
      for (let v = 0; v < E[A + 1]; v++)
        for (let R = 0; R < E[A]; R++) {
          let _ = y.W[A][v * E[A] + R];
          ((m.strokeStyle =
            _ > 0
              ? `rgba(88,196,255,${Math.abs(_) / w})`
              : `rgba(255,107,107,${Math.abs(_) / w})`),
            (m.lineWidth = 0.5 + (Math.abs(_) / w) * 1.5),
            m.beginPath(),
            m.moveTo(M(A), T(A, R)),
            m.lineTo(M(A + 1), T(A + 1, v)),
            m.stroke());
        }
    }
    E.forEach((A, w) => {
      for (let v = 0; v < A; v++)
        ((m.fillStyle = w === 0 ? "#ffd166" : w === E.length - 1 ? f1[v] : "#e6edf3"),
          m.beginPath(),
          m.arc(M(w), T(w, v), 4, 0, 7),
          m.fill());
    });
  }
  function p(g) {
    let m = n.gpu,
      S = yt(m),
      b = m.width,
      y = m.height;
    ((S.fillStyle = "#05080b"), S.fillRect(0, 0, b, y));
    for (let E = 0; E < 4; E++) {
      let M = 8 + (E * (b - 16)) / 4,
        T = (b - 16) / 4 - 8;
      ((S.fillStyle = "#1b2330"),
        S.fillRect(M, 8, T, y - 30),
        (S.fillStyle = E < g ? "#76b900" : "#333"));
      let A = E < g && t ? l[E] : 0;
      (S.fillRect(M, 8 + (y - 30) * (1 - A), T, (y - 30) * A),
        (S.fillStyle = "#ccc"),
        (S.font = "11px monospace"),
        S.fillText(
          `GPU${E} ${E < g ? (i.lastShards[E] || 0) + " smp" : "off"}`,
          M,
          y - 8,
        ));
    }
  }
  function x() {
    let g = a.ctx;
    ((g.fillStyle = "#001a10"),
      g.fillRect(0, 0, 320, 140),
      (g.fillStyle = "#76ff9a"),
      (g.font = "bold 26px monospace"),
      g.fillText("STEP " + i.step, 12, 38),
      g.fillText("LOSS " + (i.lossHist.at(-1) ?? 0).toFixed(3), 12, 78),
      g.fillText("ACC  " + (c * 100).toFixed(1) + "%", 12, 118),
      (a.tex.needsUpdate = !0));
  }
  return (
    (h.test = () => {
      let g = new Gc({ data: "xor", gpus: 4, hidden: [8], lr: 0.05 });
      for (let S = 0; S < 800; S++) g.trainStep();
      let m = g.accuracy();
      return {
        xor_accuracy: +m.toFixed(3),
        final_loss: +g.lossHist.at(-1).toFixed(4),
        replicas_in_sync: g.inSync(),
        ok: m > 0.93 && g.inSync(),
      };
    }),
    (h.isRunning = () => t),
    h
  );
}
function LA(i = 7) {
  let e = i >>> 0 || 1;
  return () => (e = (e * 1664525 + 1013904223) >>> 0) / 4294967296;
}
var Wc = class {
  constructor(e = {}) {
    ((this.o = {
      amp: 14,
      fmin: 4,
      fmax: 40,
      lr: 1,
      noise: 3.5,
      feedback: "predictable",
      learn: !0,
      paddle: 0.12,
      speed: 0.0016,
      gain: 0.012,
      seed: 3,
      explore: 2,
      ...e,
    }),
      this.reset());
  }
  reset() {
    let e = this.o,
      t = (this.r = LA(e.seed));
    ((this.t = 0), (this.nS = 40), (this.nM = 20), (this.nI = 20));
    let n = (this.N = this.nS + 2 * this.nM + this.nI);
    ((this.iUp = this.nS),
      (this.iDn = this.nS + this.nM),
      (this.iIn = this.nS + 2 * this.nM),
      (this.v = new Float64Array(n).fill(-65)),
      (this.u = new Float64Array(n)),
      (this.a = new Float64Array(n)),
      (this.b = new Float64Array(n)),
      (this.c = new Float64Array(n)),
      (this.d = new Float64Array(n)),
      (this.type = new Uint8Array(n)));
    for (let r = 0; r < n; r++) {
      let o = r >= this.iIn,
        a = t();
      ((this.type[r] = r < this.nS ? 0 : r < this.iDn ? 1 : r < this.iIn ? 2 : 3),
        o
          ? ((this.a[r] = 0.02 + 0.08 * a),
            (this.b[r] = 0.25 - 0.05 * a),
            (this.c[r] = -65),
            (this.d[r] = 2))
          : ((this.a[r] = 0.02),
            (this.b[r] = 0.2),
            (this.c[r] = -65 + 15 * a * a),
            (this.d[r] = 8 - 6 * a * a)),
        (this.u[r] = this.b[r] * this.v[r]));
    }
    let s = 2 * this.nM;
    ((this.W = new Float64Array(this.nS * s)),
      (this.E = new Float64Array(this.nS * s)),
      (this.wmax = 12));
    for (let r = 0; r < this.W.length; r++) this.W[r] = this.wmax * (0.35 + 0.3 * t());
    ((this.wTot = this.wmax * 0.5 * this.nS),
      (this.rBar = -0.5),
      (this.xPre = new Float64Array(this.nS)),
      (this.yPost = new Float64Array(s)),
      (this.fired = new Uint8Array(n)),
      (this.lastSpike = new Float64Array(n).fill(-1e9)),
      (this.count = new Uint32Array(n)),
      (this.raster = []),
      (this.stimLog = []),
      (this.ball = { x: 0.6, y: 0.5, vx: -1, vy: 0.6 }),
      (this.pad = 0.5),
      (this.win = { up: 0, dn: 0 }),
      (this.hits = 0),
      (this.misses = 0),
      (this.rally = 0),
      (this.hist = []),
      (this.feedbackUntil = 0),
      (this.feedbackKind = null),
      (this.nextStim = new Float64Array(8)),
      (this.manual = []),
      (this.electrodeAct = new Float64Array(64)),
      (this.dop = 0),
      (this.events = []),
      (this.zU = 0),
      (this.zD = 0));
  }
  electrodeOf(e) {
    let t = this.type[e];
    if (t === 0) return 24 + Math.floor(e / 5);
    if (t === 1) {
      let s = e - this.iUp;
      return (s % 2) * 8 + ((s >> 1) % 8);
    }
    if (t === 2) {
      let s = e - this.iDn;
      return (6 + (s % 2)) * 8 + ((s >> 1) % 8);
    }
    let n = e - this.iIn;
    return (4 + (n % 2)) * 8 + ((n >> 1) % 8);
  }
  stimulate(e, t = this.o.amp * 1.5, n = 2) {
    this.manual.push({ e, amp: t, until: this.t + n });
  }
  sensoryBin() {
    let e = (this.ball.y - this.pad) / 1;
    return Math.max(0, Math.min(7, Math.floor((e + 0.5) * 8)));
  }
  step() {
    let e = this.o,
      t = this.r,
      n = this.N,
      s = new Float64Array(n),
      r = this.t;
    for (let m = 0; m < n; m++)
      s[m] = e.noise * (this.type[m] === 3 ? 0.8 : 1) * (t() + t() + t() - 1.5) * 2;
    let o = r < this.feedbackUntil;
    if (o) {
      if (this.feedbackKind === "predictable") {
        if (r % 10 === 0) for (let m = 0; m < this.nS; m++) s[m] += e.amp * 1.5;
      } else if (this.feedbackKind === "random") {
        for (let m = 0; m < 8; m++)
          if (t() < 0.005) for (let S = 0; S < 5; S++) s[m * 5 + S] += e.amp * 2;
      }
    } else {
      let m = this.sensoryBin(),
        S = e.fmin + (e.fmax - e.fmin) * (1 - this.ball.x);
      if (r >= this.nextStim[m]) {
        this.nextStim[m] = r + 1e3 / S;
        for (let b = 0; b < 5; b++) s[m * 5 + b] += e.amp * 2;
        this.stimLog.push([r, m * 1]);
      }
    }
    for (let m of this.manual)
      if (r < m.until)
        for (let S = 0; S < n; S++) this.electrodeOf(S) === m.e && (s[S] += m.amp);
    this.manual = this.manual.filter((m) => r < m.until);
    let a = 2 * this.nM,
      l = this.fired;
    for (let m = 0; m < this.nS; m++)
      if (l[m]) for (let S = 0; S < a; S++) s[this.iUp + S] += this.W[m * a + S];
    let c = 0,
      h = 0;
    for (let m = 0; m < this.nM; m++) ((c += l[this.iUp + m]), (h += l[this.iDn + m]));
    for (let m = this.iIn; m < n; m++) s[m] += 2.5 * (c + h);
    let d = 0;
    for (let m = this.iIn; m < n; m++) d += l[m];
    for (let m = 0; m < a; m++) s[this.iUp + m] -= 1.6 * d;
    let u = Math.exp(-1 / 150),
      f = e.explore * Math.sqrt(1 - u * u) * 1.7;
    ((this.zU = this.zU * u + f * (t() + t() + t() - 1.5)),
      (this.zD = this.zD * u + f * (t() + t() + t() - 1.5)));
    for (let m = 0; m < this.nM; m++)
      ((s[this.iUp + m] += this.zU - 3 * h), (s[this.iDn + m] += this.zD - 3 * c));
    for (let m = 0; m < n; m++) {
      let S = this.v[m],
        b = this.u[m];
      ((S += 0.5 * (0.04 * S * S + 5 * S + 140 - b + s[m])),
        (S += 0.5 * (0.04 * S * S + 5 * S + 140 - b + s[m])),
        (this.v[m] = S),
        (this.u[m] += this.a[m] * (this.b[m] * S - b)));
    }
    for (let m = 0; m < n; m++)
      this.v[m] >= 30
        ? ((this.v[m] = this.c[m]),
          (this.u[m] += this.d[m]),
          (l[m] = 1),
          this.count[m]++,
          (this.lastSpike[m] = r),
          this.raster.push([r, m]),
          (this.electrodeAct[this.electrodeOf(m)] += 1))
        : (l[m] = 0);
    let p = Math.exp(-1 / 20),
      x = Math.exp(-1 / 1e3);
    for (let m = 0; m < this.nS; m++) this.xPre[m] = this.xPre[m] * p + l[m];
    for (let m = 0; m < a; m++) this.yPost[m] = this.yPost[m] * p + l[this.iUp + m];
    for (let m = 0; m < this.E.length; m++) this.E[m] *= x;
    if (!o) {
      for (let m = 0; m < a; m++)
        if (l[this.iUp + m])
          for (let S = 0; S < this.nS; S++) this.E[S * a + m] += this.xPre[S];
      for (let m = 0; m < this.nS; m++)
        if (l[m]) for (let S = 0; S < a; S++) this.E[m * a + S] -= 0.6 * this.yPost[S];
    }
    if (((this.dop *= Math.exp(-1 / 200)), e.learn && Math.abs(this.dop) > 0.001)) {
      let m = 0.002 * e.lr * this.dop;
      for (let S = 0; S < this.W.length; S++) {
        let b = this.W[S] + m * this.E[S];
        this.W[S] = b < 0 ? 0 : b > this.wmax ? this.wmax : b;
      }
      r % 20 === 0 && this.scale();
    }
    let g = Math.exp(-1 / 20);
    ((this.win.up = this.win.up * g + c),
      (this.win.dn = this.win.dn * g + h),
      (this.pad += e.gain * (this.win.up - this.win.dn) * 0.05),
      (this.pad = Math.max(e.paddle, Math.min(1 - e.paddle, this.pad))));
    for (let m = 0; m < 64; m++) this.electrodeAct[m] *= 0.97;
    if (!o) {
      let m = this.ball;
      if (
        ((m.x += m.vx * e.speed),
        (m.y += m.vy * e.speed),
        m.y < 0 && ((m.y = -m.y), (m.vy *= -1)),
        m.y > 1 && ((m.y = 2 - m.y), (m.vy *= -1)),
        m.x > 1 && ((m.x = 2 - m.x), (m.vx *= -1)),
        m.x < 0)
      ) {
        let S = Math.abs(m.y - this.pad) <= e.paddle;
        this.outcome(S);
      }
    }
    (this.raster.length > 6e3 && this.raster.splice(0, 2e3),
      this.stimLog.length > 2e3 && this.stimLog.splice(0, 1e3),
      this.t++);
  }
  outcome(e) {
    let t = this.o,
      n = this.ball;
    (this.events.push({ t: this.t, hit: e }),
      this.events.length > 200 && this.events.shift(),
      e
        ? (this.hits++,
          this.rally++,
          (n.x = -n.x),
          (n.vx = Math.abs(n.vx)),
          (n.vy += (n.y - this.pad) * 3 + (this.r() - 0.5) * 0.4),
          (n.vy = Math.max(-1.4, Math.min(1.4, n.vy))))
        : (this.misses++,
          (this.rally = 0),
          (n.x = 0.6 + 0.3 * this.r()),
          (n.y = this.r()),
          (n.vx = -1),
          (n.vy = (this.r() - 0.5) * 2)),
      this.hist.push(e ? 1 : 0));
    let s = t.feedback;
    if (s === "predictable") {
      ((this.feedbackKind = e ? "predictable" : "random"),
        (this.feedbackUntil = this.t + (e ? 100 : 500)));
      let r = e ? 1 : -1;
      ((this.dop = r - this.rBar), (this.rBar += 0.05 * (r - this.rBar)));
    } else
      s === "silent"
        ? ((this.feedbackKind = null), (this.feedbackUntil = this.t), (this.dop = 0))
        : ((this.feedbackKind = "random"),
          (this.feedbackUntil = this.t + 300),
          (this.dop = 0));
  }
  scale() {
    let e = 2 * this.nM;
    for (let t = 0; t < e; t++) {
      let n = 0;
      for (let r = 0; r < this.nS; r++) n += this.W[r * e + t];
      let s = this.wTot / Math.max(1e-9, n);
      for (let r = 0; r < this.nS; r++)
        this.W[r * e + t] = Math.min(this.wmax, this.W[r * e + t] * s);
    }
  }
  hitRate(e = 30) {
    let t = this.hist.slice(-e);
    return t.length ? t.reduce((n, s) => n + s, 0) / t.length : 0;
  }
  runMs(e) {
    for (let t = 0; t < e; t++) this.step();
  }
};
var Co = (i, e, t, n) => (i.position.set(e, t, n), i),
  ub = [new Ae(16765286), new Ae(5817599), new Ae(16739286), new Ae(16732240)],
  UA = ["#ffd166", "#58c4ff", "#ff6bd6", "#ff5050"];
function g1() {
  let i = null,
    e = null,
    t = new Wc(),
    n = 40,
    s = !0,
    r = {},
    o,
    a,
    l,
    c = [],
    h = 0.055,
    d = -3.5 * h,
    u = (y) => [d + (y % 8) * h, d + Math.floor(y / 8) * h],
    f = [],
    p = {
      id: "bci",
      era: "BCI",
      short: "Wet / biological computer",
      sim: t,
      name: 'BCI "wet computer": living neurons on a multi-electrode array playing Pong',
      blurb:
        'Biological computing (Cortical Labs DishBrain, FinalSpark Neuroplatform, organoid intelligence): a culture of real neurons grows on a CMOS/glass multi-electrode array that can both record their spikes and stimulate them. Here 100 spiking neurons are simulated with the Izhikevich model (regular-spiking excitatory and fast-spiking inhibitory cells), sitting on an 8×8 MEA. Ball position relative to the paddle is place-coded onto 8 sensory electrodes, distance is rate-coded at 4–40 Hz; spikes in the "up" and "down" motor regions move the paddle. After a hit, predictable synchronous stimulation; after a miss, unpredictable noise. That feedback modulates spike-timing-dependent plasticity, so the culture learns to play better than chance. Click electrodes to stimulate them yourself.',
      diagram: {
        nodes: [
          {
            id: "game",
            label: `Pong game
(silicon)`,
            x: 0.12,
            y: 0.2,
            w: 0.18,
            color: "#e6edf3",
          },
          {
            id: "enc",
            label: `Encoder
place + rate code`,
            x: 0.42,
            y: 0.2,
            w: 0.2,
            color: "#ffd166",
          },
          {
            id: "sens",
            label: `Sensory
electrodes (8)`,
            x: 0.78,
            y: 0.2,
            w: 0.2,
            color: "#ffd166",
          },
          {
            id: "cul",
            label: `Neuron culture
Izhikevich + STDP`,
            x: 0.78,
            y: 0.55,
            w: 0.22,
            color: "#ff6bd6",
          },
          {
            id: "mot",
            label: `Motor regions
up / down`,
            x: 0.45,
            y: 0.82,
            w: 0.2,
            color: "#58c4ff",
          },
          {
            id: "dec",
            label: `Decoder
spike counts`,
            x: 0.13,
            y: 0.6,
            w: 0.18,
            color: "#58c4ff",
          },
          {
            id: "fb",
            label: `Feedback
predictable / noise`,
            x: 0.45,
            y: 0.5,
            w: 0.2,
            color: "#5fe08a",
          },
        ],
        edges: [
          ["game", "enc"],
          ["enc", "sens"],
          ["sens", "cul"],
          ["cul", "mot"],
          ["mot", "dec"],
          ["dec", "game"],
          ["game", "fb"],
          ["fb", "sens"],
        ],
      },
      build(y) {
        y.box(1.5, 0.06, 1, U.metal(14212578, 0.4), [0, 0.03, 0], {
          name: "Anti-vibration bench",
          info: "",
        });
        let E = y.box(0.9, 0.7, 0.8, U.glass(13625599, 0.12), [-0.2, 0.41, 0], {
          name: "Incubator chamber (37 °C, 5 % CO₂, humidified)",
          info: "Neurons only survive at body temperature with CO₂-buffered pH and high humidity. FinalSpark keeps organoids alive for 100+ days this way.",
          shell: !0,
          explode: [0, 0.6, 0],
        });
        (y.box(0.92, 0.02, 0.82, U.metal(12568012), [-0.2, 0.77, 0], {
          shell: !0,
          name: "Incubator lid",
          info: "",
          explode: [0, 0.8, 0],
        }),
          y
            .group([-0.2, 0.06, 0], {
              name: "MEA amplifier / stimulator headstage",
              info: "64-channel low-noise amplifiers (~2 µV rms), 20–30 kHz sampling ADCs and current-controlled stimulators. Recording sees spikes as ~50–200 µV dips; stimulation is biphasic pulses of tens of µA (amplitude slider).",
              explode: [0, -0.05, 0.3],
            })
            .add(Co(new B(new te(0.6, 0.1, 0.55), U.metal(3817544, 0.4)), 0, 0.05, 0)));
        let T = y.group([-0.2, 0.17, 0], {
          name: "Multi-electrode array (8×8, TiN on glass)",
          info: "64 titanium-nitride electrodes, 30 µm diameter at 200 µm pitch on glass, gold tracks to contact pads at the edge. Each electrode records and stimulates the neurons right above it.",
          explode: [0, 0.15, 0],
        });
        T.add(new B(new te(0.5, 0.012, 0.5), U.glass(15267071, 0.55)));
        let A = new ut(new te(0.03, 0.004, 0.012), U.gold(), 64),
          w = new je(),
          v = 0;
        for (let F = 0; F < 4; F++)
          for (let H = 0; H < 16; H++) {
            let j = -0.21 + H * 0.028,
              [K, ue] =
                F === 0
                  ? [j, -0.23]
                  : F === 1
                    ? [j, 0.23]
                    : F === 2
                      ? [-0.23, j]
                      : [0.23, j];
            (w.position.set(K, 0.008, ue),
              (w.rotation.y = F >= 2 ? 0 : Math.PI / 2),
              w.updateMatrix(),
              A.setMatrixAt(v++, w.matrix));
          }
        (T.add(A),
          (o = new ut(
            new ke(0.012, 0.012, 0.006, 14),
            new et({ color: 16777215, roughness: 0.4, metalness: 0.3 }),
            64,
          )));
        for (let F = 0; F < 64; F++) {
          let [H, j] = u(F);
          (w.position.set(H, 0.009, j),
            w.rotation.set(0, 0, 0),
            w.updateMatrix(),
            o.setMatrixAt(F, w.matrix),
            o.setColorAt(F, new Ae(3158064)));
        }
        (y.add(
          o,
          {
            name: "Electrode (click to stimulate)",
            info: 'Click an electrode: a strong stimulation burst is delivered to the neurons above it — watch them fire in the raster. Row 4 (yellow) = sensory input, top two rows = "up" motor region, bottom two rows = "down" region, rows 5–6 = inhibitory interneurons.',
            live: () => "last clicked: " + (p._lastE ?? "–"),
          },
          T,
        ),
          y.cyl(
            0.2,
            0.2,
            0.14,
            U.glass(16777215, 0.25),
            [0, 0.08, 0],
            {
              open: !0,
              seg: 40,
              name: "Culture ring",
              info: "Glass ring holding ~1 mL of medium over the electrodes.",
            },
            T,
          ),
          y.cyl(
            0.195,
            0.195,
            0.1,
            new Cn({
              color: 16744346,
              transparent: !0,
              opacity: 0.22,
              roughness: 0.1,
              depthWrite: !1,
            }),
            [0, 0.057, 0],
            {
              seg: 40,
              name: "Culture medium (Neurobasal + B27, phenol red)",
              info: "Nutrients, glucose, growth factors. Phenol red indicator: pink at pH 7.4, yellow if acidic (cells stressed), purple if alkaline.",
            },
            T,
          ));
        let R = new co(0.0105, 1);
        a = new ut(
          R,
          new et({
            color: 16777215,
            emissive: 16777215,
            emissiveIntensity: 0,
            roughness: 0.5,
          }),
          t.N,
        );
        let _ = Math.random;
        for (let F = 0; F < t.N; F++) {
          let [H, j] = u(t.electrodeOf(F)),
            K = [H + (_() - 0.5) * 0.04, 0.02 + _() * 0.02, j + (_() - 0.5) * 0.04];
          (f.push(K),
            w.position.set(...K),
            w.updateMatrix(),
            a.setMatrixAt(F, w.matrix),
            a.setColorAt(F, ub[t.type[F]].clone().multiplyScalar(0.25)));
        }
        y.add(
          a,
          {
            name: "Neurons (simulated cortical culture)",
            info: "Each dot is one Izhikevich neuron: v′ = 0.04v² + 5v + 140 − u + I, u′ = a(bv − u), with a reset when v ≥ 30 mV. Yellow = sensory, blue = up-motor, magenta = down-motor, red = fast-spiking inhibitory. They flash when they spike. Real cultures have ~800,000 neurons; this is a 100-neuron model.",
            live: () =>
              `t = ${(t.t / 1e3).toFixed(1)} s, spikes so far ${t.count.reduce((F, H) => F + H, 0)}`,
          },
          T,
        );
        let P = [];
        for (let F = 0; F < 160; F++) {
          let H = f[Math.floor(_() * t.nS)],
            j = f[t.nS + Math.floor(_() * (t.N - t.nS))];
          P.push(new N(...H), new N((H[0] + j[0]) / 2, 0.05, (H[2] + j[2]) / 2));
        }
        let V = new it().setFromPoints(P);
        T.add(new Yi(V, new ei({ color: 16761040, transparent: !0, opacity: 0.25 })));
        {
          let F = [];
          for (let H of f)
            for (let j = 0; j < 3; j++) {
              let K = _() * 6.283,
                ue = 0.012 + _() * 0.02,
                Me = H[0],
                ee = H[1],
                X = H[2];
              for (let W = 0; W < 3; W++) {
                let G = Me + (Math.cos(K + (_() - 0.5)) * ue) / 3,
                  le = X + (Math.sin(K + (_() - 0.5)) * ue) / 3,
                  pe = Math.max(0.012, ee - 0.004);
                (F.push(new N(Me, ee, X), new N(G, pe, le)),
                  (Me = G),
                  (ee = pe),
                  (X = le));
              }
            }
          T.add(
            new Yi(
              new it().setFromPoints(F),
              new ei({ color: 16766690, transparent: !0, opacity: 0.35 }),
            ),
          );
        }
        {
          let F = y.group([0.5, 0.48, 0.22], {
            name: "Magnified neuron (~2,000×, neuron #0 of the simulation)",
            info: "One cortical neuron enlarged: a ~15 µm soma, dendrites studded with spines (where synapses land), and a single axon ending in a growth cone. It sits on a 30 µm TiN electrode, which picks up its ~100 µV extracellular spike. It flashes exactly when simulated neuron #0 fires.",
            live: () =>
              `last spike ${(t.t - t.lastSpike[0]).toFixed(0)} ms ago · ${t.count[0]} spikes so far`,
          });
          i = new Cn({
            color: 16754880,
            roughness: 0.45,
            sheen: 1,
            sheenColor: new Ae(16769258),
            emissive: 16735626,
            emissiveIntensity: 0.05,
            transmission: 0.15,
            thickness: 0.05,
          });
          let H = new B(new Mt(0.035, 24, 18), i);
          (H.scale.set(1, 0.8, 1), F.add(H));
          let j = new B(
            new Mt(0.015, 16, 12),
            new et({ color: 9058918, roughness: 0.6 }),
          );
          F.add(j);
          let K = [],
            ue = (pe, Ee, be, re, de) => {
              let D = [pe.clone()],
                $ = pe.clone(),
                Y = Ee.clone();
              for (let he = 0; he < 4; he++)
                (Y.add(
                  new N(_() - 0.5, (_() - 0.5) * 0.6, _() - 0.5).multiplyScalar(0.5),
                ).normalize(),
                  ($ = $.clone().addScaledVector(Y, be / 4)),
                  D.push($));
              let se = new B(new Zn(new _n(D), 12, re, 6), i);
              F.add(se);
              for (let he = 0; he < 10; he++) K.push(new _n(D).getPoint(_()));
              if (de > 0)
                for (let he = 0; he < 2; he++)
                  ue(
                    $,
                    Y.clone().add(new N(_() - 0.5, _() - 0.5, _() - 0.5)),
                    be * 0.7,
                    re * 0.65,
                    de - 1,
                  );
            };
          for (let pe = 0; pe < 5; pe++) {
            let Ee = (pe / 5) * 6.283 + _() * 0.5;
            ue(
              new N(Math.cos(Ee) * 0.03, 0.01, Math.sin(Ee) * 0.03),
              new N(Math.cos(Ee), 0.35 + _() * 0.3, Math.sin(Ee)),
              0.09,
              0.006,
              2,
            );
          }
          let Me = [new N(0, -0.02, 0)];
          for (let pe = 1; pe <= 8; pe++)
            Me.push(
              new N(
                Math.sin(pe * 0.7) * 0.03 - pe * 0.02,
                -0.025 - pe * 0.004,
                pe * 0.018,
              ),
            );
          F.add(new B(new Zn(new _n(Me), 40, 0.0035, 6), i));
          let ee = new B(new pn(0.012, 0.02, 7), i);
          (ee.position.copy(Me[Me.length - 1]), (ee.rotation.z = 1.4), F.add(ee));
          let X = new ut(new Mt(0.0035, 6, 4), i, K.length);
          (K.forEach((pe, Ee) => {
            (w.position
              .copy(pe)
              .add(new N(_() - 0.5, _() - 0.5, _() - 0.5).multiplyScalar(0.012)),
              w.rotation.set(0, 0, 0),
              w.updateMatrix(),
              X.setMatrixAt(Ee, w.matrix));
          }),
            F.add(X));
          let W = new B(
            new ke(0.07, 0.07, 0.006, 32),
            new et({ color: 2829104, roughness: 0.35, metalness: 0.6 }),
          );
          ((W.position.y = -0.065), F.add(W));
          let G = new B(new te(0.2, 0.004, 0.02), U.gold());
          (G.position.set(0.13, -0.066, 0), F.add(G));
          let le = new B(new ke(0.008, 0.008, 0.36, 8), U.glass(16777215, 0.3));
          ((le.position.y = -0.25), F.add(le));
        }
        {
          let F = y.group([0.18, 0.06, 0.33], {
            name: "Brain organoid well (Brainoware-style, Cai et al. 2023)",
            info: "A ~3 mm 3-D brain organoid grown from stem cells, sitting on its own high-density MEA. Organoids have layered, folded tissue and spontaneous network bursts; Cai et al. used one as a physical reservoir computer for speech recognition. Here it glows with the culture's total firing rate.",
          });
          F.add(
            Co(new B(new te(0.16, 0.012, 0.16), U.glass(15267071, 0.55)), 0, 0.006, 0),
          );
          let H = new B(new ke(0.06, 0.06, 0.06, 32, 1, !0), U.glass(16777215, 0.25));
          ((H.position.y = 0.04), F.add(H));
          let j = new co(0.035, 5),
            K = j.attributes.position,
            ue = new N(),
            Me = [];
          for (let X = 0; X < K.count; X++) {
            ue.fromBufferAttribute(K, X);
            let W =
                Math.sin(ue.x * 260) *
                Math.sin(ue.y * 230 + 1) *
                Math.sin(ue.z * 250 + 2),
              G = Math.sin(ue.x * 90 + ue.z * 70),
              le = 1 + 0.12 * W + 0.06 * G;
            (ue.multiplyScalar(le), K.setXYZ(X, ue.x, ue.y * 0.85, ue.z));
            let pe = 0.75 + 0.25 * W;
            Me.push(1, 0.62 * pe + 0.2, 0.7 * pe + 0.15);
          }
          (j.setAttribute("color", new Ge(Me, 3)),
            j.computeVertexNormals(),
            (e = new Cn({
              vertexColors: !0,
              roughness: 0.55,
              sheen: 1,
              sheenColor: new Ae(16765148),
              emissive: 16731514,
              emissiveIntensity: 0.03,
              transmission: 0.1,
              thickness: 0.04,
            })));
          let ee = new B(j, e);
          ((ee.position.y = 0.045), F.add(ee));
        }
        let k = y.group([0.5, 0.06, -0.25], {
          name: "Microfluidic perfusion pump",
          info: "Slowly replaces medium (µL/min) so the culture is fed and waste removed without disturbing the cells.",
          explode: [0.3, 0, -0.2],
        });
        k.add(Co(new B(new te(0.22, 0.14, 0.18), U.plastic(15132390)), 0, 0.07, 0));
        let L = new B(new ke(0.05, 0.05, 0.03, 20), U.steel());
        ((L.rotation.x = Math.PI / 2),
          L.position.set(0, 0.08, 0.1),
          k.add(L),
          (p._rot = L));
        for (let F = 0; F < 2; F++) {
          let H = y.group(
            [0.45 + F * 0.14, 0.06, 0.25],
            F ? {} : { name: "Media reservoirs (fresh / waste)", info: "" },
          );
          (H.add(
            Co(new B(new ke(0.05, 0.05, 0.2, 20), U.glass(16777215, 0.3)), 0, 0.1, 0),
          ),
            H.add(
              Co(
                new B(
                  new ke(0.046, 0.046, 0.13, 20),
                  new et({
                    color: F ? 15910509 : 16740239,
                    transparent: !0,
                    opacity: 0.8,
                  }),
                ),
                0,
                0.07,
                0,
              ),
            ));
        }
        (y.tube(
          [
            [0.45, 0.25, 0.25],
            [0.3, 0.45, 0.1],
            [-0.05, 0.4, 0.05],
            [-0.15, 0.27, 0.02],
          ],
          0.006,
          U.glass(16765148, 0.6),
          { name: "Inlet tubing", info: "" },
        ),
          y.tube(
            [
              [0.59, 0.25, 0.25],
              [0.35, 0.5, -0.05],
              [-0.05, 0.42, -0.05],
              [-0.25, 0.27, -0.03],
            ],
            0.006,
            U.glass(16770720, 0.6),
            {},
          ));
        let z = y.group([0.5, 0.06, 0], {
          name: "Closed-loop FPGA / DAQ",
          info: "Runs the loop in < 5 ms: detects spikes, decodes motor activity, updates the game, and drives the stimulation pattern for the next frame.",
          explode: [0.3, 0, 0],
        });
        (z.add(Co(new B(new te(0.26, 0.03, 0.18), U.pcb()), 0, 0.02, 0)),
          z.add(Co(new B(new te(0.06, 0.012, 0.06), U.chip()), 0, 0.04, 0)),
          Dt(
            y,
            [
              [0.37, 0.08, 0],
              [0.2, 0.12, 0.1],
              [0.1, 0.09, 0.05],
            ],
            0.012,
            7829367,
            { name: "Stim/record cable", info: "" },
          ),
          (l = zi(y, 0.5, 0.36, [0.45, 0.62, -0.47], [320, 240], {
            name: "Game monitor",
            info: "The Pong the culture is playing (also in the panel).",
          })),
          y.box(0.54, 0.4, 0.03, U.plastic(1710618), [0.45, 0.62, -0.49], {}),
          y.box(0.04, 0.32, 0.04, U.plastic(1710618), [0.45, 0.24, -0.49], {}));
      },
      onPick(y, E) {
        return (
          y === o &&
            E &&
            E.instanceId != null &&
            ((p._lastE = E.instanceId), t.stimulate(E.instanceId, t.o.amp * 2, 20)),
          !1
        );
      },
      ui(y) {
        ((r.pong = It(200)),
          (r.ras = It(150)),
          (r.mea = It(170)),
          (r.hr = It(90)),
          (r.st = Pt([
            ["t", "culture time"],
            ["hits", "hits"],
            ["miss", "misses"],
            ["hr", "hit rate (last 20)"],
            ["rally", "rally"],
            ["fr", "mean firing rate"],
            ["fb", "feedback now"],
            ["w", "weight up–down contrast"],
          ])),
          (r.mea.style.cursor = "pointer"),
          r.mea.addEventListener("click", (M) => {
            let T = r.mea.getBoundingClientRect(),
              A = Math.min(T.width, T.height),
              w = ((M.clientX - T.left - (T.width - A) / 2) / A) * 8,
              v = ((M.clientY - T.top - (T.height - A) / 2) / A) * 8;
            if (w >= 0 && w < 8 && v >= 0 && v < 8) {
              let R = Math.floor(v) * 8 + Math.floor(w);
              ((p._lastE = R), t.stimulate(R, t.o.amp * 2, 20));
            }
          }));
        let E = t.o;
        y.append(
          Ie(
            "Closed loop (live)",
            q(
              "div",
              { class: "row" },
              "Feedback ",
              st(
                [
                  ["predictable", "predictable on hit / noise on miss (DishBrain)"],
                  ["noise", "noise always (no information)"],
                  ["silent", "no feedback"],
                ],
                E.feedback,
                (M) => (E.feedback = M),
              ),
            ),
            q(
              "div",
              { class: "row" },
              q(
                "label",
                {},
                q("input", {
                  type: "checkbox",
                  checked: !0,
                  onchange: (M) => (E.learn = M.target.checked),
                }),
                " plasticity (reward-modulated STDP)",
              ),
            ),
            We("Stim amplitude", 0, 30, 0.5, E.amp, (M) => (E.amp = M)),
            We("Max stim rate (Hz)", 5, 100, 1, E.fmax, (M) => (E.fmax = M)),
            We("Min stim rate (Hz)", 1, 20, 1, E.fmin, (M) => (E.fmin = M)),
            We("Learning rate", 0, 4, 0.05, E.lr, (M) => (E.lr = M)),
            We("Membrane noise", 0, 10, 0.1, E.noise, (M) => (E.noise = M)),
            We("Spontaneous drive", 0, 6, 0.1, E.explore, (M) => (E.explore = M)),
            We(
              "Ball speed",
              0.5,
              3,
              0.1,
              E.speed / 0.0016,
              (M) => (E.speed = 0.0016 * M),
            ),
            We("Paddle half-size", 0.05, 0.3, 0.01, E.paddle, (M) => (E.paddle = M)),
            We("Sim speed (ms culture time / frame)", 1, 200, 1, n, (M) => (n = M)),
            q(
              "div",
              { class: "row" },
              Fe("Pause", (M) => {
                ((s = !s), (M.target.textContent = s ? "Pause" : "Run"));
              }),
              Fe("Fast-forward 60 s", () => t.runMs(6e4)),
              Fe("New culture", () => {
                ((t.o.seed = (Math.random() * 1e6) | 0),
                  t.reset(),
                  (c = []),
                  (p._lr = 0));
              }),
            ),
          ),
          r.st,
          Ie("Pong (what the culture is controlling)", r.pong),
          Ie("Spike raster, last 1 s (rows = neurons, colour = population)", r.ras),
          Ie("MEA activity heatmap — click an electrode to stimulate", r.mea),
          Ie("Hit rate over culture time (chance ≈ 0.25)", r.hr),
        );
      },
      update() {
        for (
          s && t.runMs(n), t.t < (p._lr || 0) && (p._lr = 0);
          t.t - (p._lr || 0) > 5e3;
        )
          ((p._lr = (p._lr || 0) + 5e3),
            c.push(t.hitRate(20)),
            c.length > 400 && c.shift());
        let y = p.diag;
        (s &&
          Math.random() < 0.3 &&
          (y.pulse("game", "enc", "#e6edf3", 2),
          y.pulse("enc", "sens", "#ffd166", 2),
          y.pulse("sens", "cul", "#ffd166", 2),
          y.pulse("cul", "mot", "#58c4ff", 2),
          y.pulse("mot", "dec", "#58c4ff", 2),
          y.pulse("dec", "game", "#58c4ff", 2)),
          t.t < t.feedbackUntil &&
            (y.pulse("game", "fb", "#5fe08a", 3),
            y.pulse(
              "fb",
              "sens",
              t.feedbackKind === "predictable" ? "#5fe08a" : "#ff5050",
              3,
            )));
        let E = new Ae();
        for (let w = 0; w < t.N; w++) {
          let v = t.t - t.lastSpike[w],
            R = v < 40 ? 1 - v / 40 : 0;
          (E.copy(ub[t.type[w]]).multiplyScalar(0.2 + 3 * R), a.setColorAt(w, E));
        }
        if (((a.instanceColor.needsUpdate = !0), i)) {
          let w = t.t - t.lastSpike[0];
          i.emissiveIntensity = 0.05 + (w < 60 ? 1.6 * (1 - w / 60) : 0);
        }
        if (e) {
          let w = 0;
          for (let v = 0; v < t.N; v++) t.t - t.lastSpike[v] < 30 && w++;
          e.emissiveIntensity += (0.03 + (3 * w) / t.N - e.emissiveIntensity) * 0.3;
        }
        a.material.emissiveIntensity = 0;
        for (let w = 0; w < 64; w++) {
          let v = Math.min(1, t.electrodeAct[w] / 3),
            R = w >> 3,
            _ =
              R === 3
                ? 16765286
                : R < 2
                  ? 5817599
                  : R > 5
                    ? 16739286
                    : R > 3
                      ? 16732240
                      : 8947848;
          (E.set(3158064).lerp(new Ae(_), v),
            p._lastE === w && t.manual.length && E.set(16777215),
            o.setColorAt(w, E));
        }
        ((o.instanceColor.needsUpdate = !0),
          p._rot && (p._rot.rotation.y += 0.05),
          g(r.pong),
          g(l.canvas, l.ctx),
          (l.tex.needsUpdate = !0),
          m(),
          S(),
          b());
        let M = r.st,
          T = t.hist.length;
        (M.set("t", (t.t / 1e3).toFixed(1) + " s"),
          M.set("hits", t.hits),
          M.set("miss", t.misses),
          M.set("hr", t.hitRate(20).toFixed(2)),
          M.set("rally", t.rally));
        let A = t.count.reduce((w, v) => w + v, 0);
        (M.set("fr", (A / t.N / Math.max(0.001, t.t / 1e3)).toFixed(1) + " Hz"),
          M.set("fb", t.t < t.feedbackUntil ? t.feedbackKind : "—"),
          M.set("w", x().toFixed(2)));
      },
    };
  function x() {
    let y = 2 * t.nM,
      E = 0;
    for (let M = 0; M < t.nS; M++) {
      let T = Math.floor(M / 5),
        A = T >= 8 / 2 ? 1 : -1,
        w = 0,
        v = 0;
      for (let R = 0; R < t.nM; R++)
        ((w += t.W[M * y + R]), (v += t.W[M * y + t.nM + R]));
      E += (A * (w - v)) / t.nM;
    }
    return E / t.nS / t.wmax;
  }
  function g(y, E) {
    let M = E || yt(y),
      T = y.width,
      A = y.height;
    ((M.fillStyle =
      t.t < t.feedbackUntil
        ? t.feedbackKind === "predictable"
          ? "#0b2a14"
          : "#2a0b0b"
        : "#05080b"),
      M.fillRect(0, 0, T, A),
      (M.strokeStyle = "#334"),
      M.setLineDash([6, 6]),
      M.beginPath(),
      M.moveTo(T / 2, 0),
      M.lineTo(T / 2, A),
      M.stroke(),
      M.setLineDash([]),
      (M.fillStyle = "#e6edf3"));
    let w = t.o.paddle * 2 * A;
    (M.fillRect(16, (1 - t.pad) * A - w / 2, 8, w),
      M.beginPath(),
      M.arc(24 + t.ball.x * (T - 30), (1 - t.ball.y) * A, Math.max(4, T / 70), 0, 7),
      M.fill(),
      M.fillRect(T - 4, 0, 4, A),
      (M.fillStyle = "#8b98a9"),
      (M.font = Math.round(A / 14) + "px monospace"),
      M.fillText(`hits ${t.hits}  misses ${t.misses}  rally ${t.rally}`, 22, A / 12));
  }
  function m() {
    let y = r.ras,
      E = yt(y),
      M = y.width,
      T = y.height;
    ((E.fillStyle = "#05080b"), E.fillRect(0, 0, M, T));
    let A = t.t - 1e3;
    for (let [w, v] of t.raster)
      w >= A &&
        ((E.fillStyle = UA[t.type[v]]),
        E.fillRect(
          ((w - A) / 1e3) * M,
          (v / t.N) * T,
          Math.max(1.5, M / 500),
          Math.max(1, T / t.N),
        ));
    E.fillStyle = "rgba(255,209,102,.35)";
    for (let [w, v] of t.stimLog)
      w >= A && E.fillRect(((w - A) / 1e3) * M, ((v * 5) / t.N) * T, 2, (5 / t.N) * T);
  }
  function S() {
    let y = r.mea,
      E = yt(y),
      M = y.width,
      T = y.height,
      A = Math.min(M, T),
      w = (M - A) / 2,
      v = A / 8;
    ((E.fillStyle = "#05080b"), E.fillRect(0, 0, M, T));
    for (let R = 0; R < 64; R++) {
      let _ = Math.min(1, t.electrodeAct[R] / 3),
        P = w + (R % 8) * v,
        V = (R >> 3) * v;
      ((E.fillStyle = `hsl(${280 - 240 * _},90%,${8 + 50 * _}%)`),
        E.fillRect(P + 2, V + 2, v - 4, v - 4));
    }
    ((E.fillStyle = "#ccc"),
      (E.font = Math.round(v / 4) + "px monospace"),
      E.fillText("UP", w + 3, v * 0.3),
      E.fillText("SENSORY", w + 3, v * 3.3),
      E.fillText("INHIB", w + 3, v * 4.3),
      E.fillText("DOWN", w + 3, v * 6.3));
  }
  function b() {
    let y = r.hr,
      E = yt(y),
      M = y.width,
      T = y.height;
    ((E.fillStyle = "#05080b"),
      E.fillRect(0, 0, M, T),
      (E.strokeStyle = "#444"),
      E.beginPath(),
      E.moveTo(0, T * 0.75),
      E.lineTo(M, T * 0.75),
      E.stroke(),
      !(c.length < 2) &&
        ((E.strokeStyle = "#5fe08a"),
        (E.lineWidth = 2),
        E.beginPath(),
        c.forEach((A, w) => {
          let v = (w / (c.length - 1)) * M,
            R = T - A * T;
          w ? E.lineTo(v, R) : E.moveTo(v, R);
        }),
        E.stroke()));
  }
  return (
    (p.test = () => {
      let y = (T, A) => {
          let w = new Wc({ seed: 3, feedback: T, learn: A });
          w.runMs(4e5);
          let v = w.hist.slice(-Math.floor(w.hist.length / 2));
          return v.reduce((R, _) => R + _, 0) / v.length;
        },
        E = y("predictable", !0),
        M = y("silent", !1);
      return {
        hit_rate_learning: +E.toFixed(3),
        hit_rate_no_feedback: +M.toFixed(3),
        ok: E > M + 0.1,
      };
    }),
    (p.isRunning = () => s),
    p
  );
}
var wr = (i, e, t, n) => (i.position.set(e, t, n), i),
  ms = ["#58c4ff", "#ff9f43", "#5fe08a"],
  x1 = {
    CNOT: ["●", "⊕"],
    CZ: ["●", "●"],
    SWAP: ["×", "×"],
    CCX: ["●", "●", "⊕"],
  },
  Tr = 14;
function y1() {
  let i = {
      n: 2,
      ops: [],
      errs: [],
      step: 1 / 0,
      tool: "H",
      th: Math.PI / 2,
      pending: [],
      shots: 1024,
      dephase: 0,
      readout: 0,
      counts: null,
      playing: -1,
      playT: 0,
    },
    e = {},
    t = [],
    n = [],
    s,
    r,
    o = null,
    a = {
      id: "quantum",
      era: "Quantum",
      short: "Mini NMR quantum computer",
      sim: i,
      name: "Desktop NMR quantum computer (SpinQ Gemini/Triangulum-style, 2–3 qubits)",
      blurb:
        "SpinQ's desktop machines are liquid-state NMR quantum computers. The qubits are nuclear spins in one molecule (¹H and ³¹P in dimethyl phosphite for 2 qubits, three ¹⁹F in trifluoroiodoethylene for 3), sitting in a ~0.65 T permanent magnet (SpinQ Gemini spec) at room temperature. Single-qubit gates are resonant RF pulses at each nucleus's Larmor frequency; two-qubit gates use the J-coupling between the spins, letting them evolve for 1/(2J). The readout is the NMR spectrum: each line's sign and size gives a population difference. This panel runs an exact state-vector simulator: build a circuit in the grid or as QASM text, step through it, watch the Bloch spheres, exact probabilities, sampled shots and the predicted NMR spectrum.",
      diagram: {
        nodes: [
          {
            id: "sw",
            label: `Circuit
(grid / QASM)`,
            x: 0.1,
            y: 0.18,
            w: 0.17,
            color: "#e6edf3",
          },
          {
            id: "cmp",
            label: `Pulse compiler
RF + J-delays`,
            x: 0.38,
            y: 0.18,
            w: 0.2,
            color: "#b58cff",
          },
          {
            id: "dds",
            label: `FPGA + DDS
pulse generator`,
            x: 0.68,
            y: 0.18,
            w: 0.2,
            color: "#b58cff",
          },
          {
            id: "amp",
            label: "RF power amp",
            x: 0.9,
            y: 0.5,
            w: 0.16,
            color: "#ff9f43",
          },
          {
            id: "coil",
            label: `RF coil +
sample in B₀`,
            x: 0.66,
            y: 0.82,
            w: 0.2,
            color: "#ff6b6b",
          },
          {
            id: "adc",
            label: `Preamp + ADC
(FID signal)`,
            x: 0.38,
            y: 0.82,
            w: 0.2,
            color: "#5fe08a",
          },
          {
            id: "fft",
            label: `FFT → spectrum
→ probabilities`,
            x: 0.11,
            y: 0.6,
            w: 0.2,
            color: "#5fe08a",
          },
        ],
        edges: [
          ["sw", "cmp"],
          ["cmp", "dds"],
          ["dds", "amp"],
          ["amp", "coil"],
          ["coil", "adc"],
          ["adc", "fft"],
          ["fft", "sw"],
        ],
      },
      build(y) {
        let E = U.plastic(15922423);
        (y.box(1, 0.04, 0.66, E, [0, 0.02, 0], {}),
          y.box(1, 0.56, 0.03, E, [0, 0.3, -0.32], {
            name: "Housing",
            info: "Gemini Mini is about the size of a desktop printer (~14 kg) and runs from a normal outlet: no cryogenics, because the qubits are nuclear spins in a liquid at room temperature.",
            shell: !0,
            explode: [0, 0, -0.4],
          }),
          y.box(0.03, 0.56, 0.66, E, [0.49, 0.3, 0], {
            shell: !0,
            name: "Housing",
            info: "",
            explode: [0.4, 0, 0],
          }),
          y.box(0.03, 0.56, 0.66, E, [-0.49, 0.3, 0], {
            shell: !0,
            name: "Housing",
            info: "",
            explode: [-0.4, 0, 0],
          }),
          y.box(1, 0.03, 0.5, E, [0, 0.58, -0.08], {
            shell: !0,
            name: "Housing",
            info: "",
            explode: [0, 0.4, 0],
          }),
          y.box(0.6, 0.3, 0.03, U.plastic(3832789), [-0.18, 0.2, 0.33], {
            shell: !0,
            name: "Front panel",
            info: "",
            explode: [0, 0, 0.4],
          }));
        let M = y.group([0.2, 0.47, 0.25], {
          name: "Touchscreen (results)",
          info: "Shows the measured probabilities, like the built-in SpinQuasar software.",
          rot: [-0.6, 0, 0],
          explode: [0, 0.2, 0.3],
        });
        (M.add(new B(new te(0.5, 0.3, 0.02), U.plastic(1118481))),
          (r = zi(y, 0.46, 0.27, [0, 0, 0.011], [384, 224], {}, M)));
        let T = y.group([-0.18, 0.06, -0.02], {
            name: "Permanent magnet assembly (B₀ ≈ 0.65 T)",
            info: "Two NdFeB magnets on an iron yoke make a vertical static field B₀. ¹H then precesses at ~42.6 MHz/T, ³¹P at ~17.2 MHz/T. Field homogeneity of ~1 ppm across the sample is needed to resolve the J-split lines.",
            explode: [0, 0, 0],
          }),
          A = U.metal(4869975, 0.5);
        T.add(
          wr(new B(new te(0.4, 0.05, 0.3), A), 0, 0.025, 0),
          wr(new B(new te(0.4, 0.05, 0.3), A), 0, 0.445, 0),
          wr(new B(new te(0.06, 0.47, 0.3), A), -0.17, 0.235, 0),
        );
        for (let [_, P] of [
          [0.1, "S"],
          [0.37, "N"],
        ]) {
          let V = y.cyl(
            0.1,
            0.1,
            0.1,
            U.metal(13225169, 0.25),
            [0.03, _, 0],
            {
              seg: 40,
              name: "NdFeB pole piece (" + P + ")",
              info: "Neodymium-iron-boron, nickel plated. Temperature-stabilised at ~32 °C because NdFeB loses ~0.1 %/K, which would shift every frequency.",
              explode: [0, _ < 0.2 ? -0.12 : 0.12, 0],
            },
            T,
          );
        }
        for (let _ of [0.158, 0.312])
          y.torus(
            0.085,
            0.006,
            U.copper(),
            [0.03, _, 0],
            {
              rot: [Math.PI / 2, 0, 0],
              name: "Shim coils",
              info: "Small electromagnet coils that cancel field gradients (shimming) so all molecules in the tube see the same B₀.",
            },
            T,
          );
        let w = y.group(
          [0.03, 0.235, 0],
          {
            name: "NMR probe: RF saddle coil + sample",
            info: "The same coil transmits the RF pulses (gates) and picks up the tiny precessing magnetisation afterwards (free induction decay, µV).",
            live: () =>
              o
                ? "Bloch vectors: " +
                  [...Array(i.n).keys()]
                    .map((_) => {
                      let P = o.bloch(_);
                      return `q${_}(${P.x.toFixed(2)},${P.y.toFixed(2)},${P.z.toFixed(2)})`;
                    })
                    .join(" ")
                : "",
            explode: [0.35, 0, 0.25],
          },
          T,
        );
        s = new et({
          color: 12088115,
          metalness: 0.9,
          roughness: 0.3,
          emissive: 16742938,
          emissiveIntensity: 0,
        });
        for (let _ of [1, -1]) {
          let P = new B(new Pi(0.032, 0.003, 6, 24, Math.PI * 0.6), s);
          (P.rotation.set(Math.PI / 2, 0, _ > 0 ? 0.2 * Math.PI : 1.2 * Math.PI),
            (P.position.y = 0.04),
            w.add(P));
          let V = P.clone();
          ((V.position.y = -0.04), w.add(V));
          for (let k of [0.2 * Math.PI, 0.8 * Math.PI]) {
            let L = new B(new ke(0.003, 0.003, 0.08, 6), s),
              z = _ > 0 ? k : k + Math.PI;
            (L.position.set(Math.cos(z) * 0.032, 0, -Math.sin(z) * 0.032), w.add(L));
          }
        }
        (w.add(
          wr(new B(new ke(0.012, 0.012, 0.32, 20), U.glass(16777215, 0.35)), 0, 0.1, 0),
        ),
          w.add(
            wr(
              new B(
                new ke(0.0105, 0.0105, 0.1, 20),
                new et({ color: 14676991, transparent: !0, opacity: 0.6 }),
              ),
              0,
              0,
              0,
            ),
          ),
          w.add(
            wr(new B(new ke(0.013, 0.013, 0.025, 20), U.plastic(2250188)), 0, 0.27, 0),
          ));
        for (let _ = 0; _ < 3; _++) {
          let P = new ft();
          P.position.set(0, -0.03 + _ * 0.03, 0);
          let V = new et({
              color: ms[_],
              emissive: ms[_],
              emissiveIntensity: 0.8,
            }),
            k = new B(new ke(0.002, 0.002, 0.03, 6), V);
          k.position.y = 0.015;
          let L = new B(new pn(0.006, 0.012, 8), V);
          L.position.y = 0.034;
          let z = new ft();
          (z.add(k, L), P.add(z), w.add(P), n.push({ g: P, a: z }));
        }
        let v = y.group([0.25, 0.06, -0.12], {
            name: "Spectrometer electronics",
            info: "FPGA sequencer + direct digital synthesisers make phase-coherent RF at each Larmor frequency; a ~100 W RF amplifier drives the coil; a low-noise preamp and 16-bit ADC digitise the FID; an embedded PC FFTs it into a spectrum.",
            explode: [0.35, 0.05, 0],
          }),
          R = (_, P, V) => {
            let k = wr(new B(new te(0.34, 0.012, 0.34), U.pcb(V)), 0, _, 0);
            v.add(k);
            for (let L = 0; L < 4; L++)
              v.add(
                wr(
                  new B(new te(0.05, 0.01, 0.05), U.chip()),
                  -0.1 + (L % 2) * 0.15,
                  _ + 0.011,
                  -0.08 + (L >> 1) * 0.14,
                ),
              );
            return k;
          };
        (R(0.02, "FPGA", 1927738),
          R(0.12, "RF", 1324638),
          R(0.22, "PC", 3808604),
          vn(
            y,
            0.14,
            0.12,
            0.05,
            [0.08, 0.13, 0.08],
            {
              name: "RF power amplifier",
              info: "Pulses of tens of watts for a few µs: a π/2 pulse is modelled as ~50 µs here (soft, selective pulses on desktop NMR).",
            },
            v,
          ),
          y.box(0.18, 0.1, 0.2, U.metal(8947848), [0.3, 0.11, 0.2], {
            name: "Power supply",
            info: "",
          }));
        for (let _ = 0; _ < 3; _++) {
          let P = y.group([-0.35 + _ * 0.35, 0.95, 0.05], {
            name: `Bloch sphere q${_}`,
            info: "Reduced density matrix of this qubit as a vector (x, y, z) = (2Re ρ₀₁, −2Im ρ₀₁, ρ₀₀ − ρ₁₁). North pole = |0⟩, south = |1⟩, equator = superpositions. A vector shorter than 1 means the qubit is entangled with the others.",
            live: () => {
              if (!o || _ >= i.n) return "inactive";
              let H = o.bloch(_);
              return `x=${H.x.toFixed(3)} y=${H.y.toFixed(3)} z=${H.z.toFixed(3)}  |r|=${Math.hypot(H.x, H.y, H.z).toFixed(3)}`;
            },
          });
          P.add(
            new B(
              new Mt(0.14, 32, 16),
              new Cn({
                color: 10406399,
                transparent: !0,
                opacity: 0.12,
                roughness: 0.1,
                depthWrite: !1,
              }),
            ),
          );
          let V = new B(new Pi(0.14, 0.002, 4, 48), U.glow(6719658, 0.6));
          ((V.rotation.x = Math.PI / 2), P.add(V));
          for (let [H, j] of [
            [[1, 0, 0], 16739179],
            [[0, 1, 0], 6283402],
            [[0, 0, 1], 5817599],
          ]) {
            let K = new Rn(
              new it().setFromPoints([
                new N(...H).multiplyScalar(-0.16),
                new N(...H).multiplyScalar(0.16),
              ]),
              new ei({ color: j }),
            );
            P.add(K);
          }
          let k = new et({
              color: ms[_],
              emissive: ms[_],
              emissiveIntensity: 0.9,
            }),
            L = new ft(),
            z = new B(new ke(0.006, 0.006, 1, 8), k),
            F = new B(new pn(0.016, 0.035, 12), k);
          (L.add(z, F), P.add(L), t.push({ g: P, arrow: L, sh: z, hd: F }));
        }
      },
      ui(y) {
        ((e.err = q("div", { class: "err" })),
          (e.grid = q("div", { class: "qgrid" })),
          (e.amp = q("pre", { class: "term" })),
          (e.bl = It(150)),
          (e.hist = It(150)),
          (e.nmr = It(140)),
          (e.pulse = It(70)),
          (e.st = Pt([
            ["n", "qubits"],
            ["mol", "molecule"],
            ["g", "gates"],
            ["d", "depth"],
            ["pt", "pulse sequence"],
            ["ok", "T₂ budget (spec T₂ > 20 ms)"],
          ])),
          (e.code = Ht(
            "",
            (M) => {
              let T = Mo(M, i.n);
              ((i.ops = T.ops), (i.errs = T.errs), h(!1));
            },
            9,
          )));
        let E = [...t0.filter((M) => M !== "I"), ...i0, ...n0, "M", "erase"];
        ((e.pal = q(
          "div",
          { class: "pal" },
          ...E.map((M) => {
            let T = Fe(M === "erase" ? "⌫ erase" : M, () => {
              ((i.tool = M),
                (i.pending = []),
                e.pal
                  .querySelectorAll(".btn")
                  .forEach((A) => A.classList.toggle("on", A === T)),
                f());
            });
            return (M === i.tool && T.classList.add("on"), T);
          }),
        )),
          (e.nsel = st(
            [
              [1, "1 qubit"],
              [2, "2 qubits (¹H, ³¹P)"],
              [3, "3 qubits (3 × ¹⁹F)"],
            ],
            i.n,
            (M) => {
              ((i.n = +M),
                (i.ops = i.ops.filter((T) => T.q.every((A) => A < i.n))),
                h(!0));
            },
          )),
          (e.preset = st(["— presets —", ...Object.keys(So)], "", (M) => c(M))),
          (e.stepS = We(
            "Step through circuit (columns)",
            0,
            Tr,
            1,
            Tr,
            (M) => {
              ((i.step = M >= Tr ? 1 / 0 : M), h(!1, !0));
            },
            (M) => (M >= Tr ? "all" : M),
          )),
          y.append(
            Ie(
              "Circuit",
              q("div", { class: "row" }, e.nsel, e.preset),
              e.pal,
              We(
                "Rotation angle for RX/RY/RZ (°)",
                -360,
                360,
                15,
                90,
                (M) => (i.th = (M * Math.PI) / 180),
              ),
              e.grid,
              q(
                "div",
                { class: "row" },
                Fe("▶ Run on device (animate pulses)", () => {
                  ((i.playing = 0), (i.playT = 0));
                }),
                Fe("Clear", () => {
                  ((i.ops = []), h(!0));
                }),
                Fe("Re-sample shots", () => d()),
              ),
              e.stepS,
            ),
            Ie(
              "QASM-style program (edit live: h, x, y, z, s, sdg, t, tdg, rx(θ), ry(θ), rz(θ), cx, cz, swap, ccx, measure)",
              e.code,
              e.err,
            ),
            e.st,
            Ie("Bloch spheres (reduced single-qubit states)", e.bl),
            Ie(
              "Probabilities: exact (bars) vs sampled shots (dots)",
              e.hist,
              q(
                "div",
                { class: "row" },
                "Shots ",
                st([100, 1024, 4096, 16384], i.shots, (M) => {
                  ((i.shots = +M), d());
                }),
              ),
              We("Dephasing per gate (T₂ noise)", 0, 0.3, 0.005, 0, (M) => {
                ((i.dephase = M), d());
              }),
              We("Readout error", 0, 0.2, 0.005, 0, (M) => {
                ((i.readout = M), d());
              }),
            ),
            Ie("State vector amplitudes", e.amp),
            Ie(
              "Predicted NMR spectrum after read-out pulse (per nucleus, Hz from carrier)",
              e.nmr,
            ),
            Ie("Compiled RF pulse sequence", e.pulse),
          ),
          c(Object.keys(So)[0]));
      },
      update(y, E) {
        if (i.playing >= 0) {
          if (((i.playT += y), i.playT > 0.6)) {
            ((i.playT = 0), i.playing++);
            let A = l();
            (i.playing > A
              ? ((i.playing = -1), (i.step = 1 / 0), e.stepS.set(Tr))
              : ((i.step = i.playing), e.stepS.set(i.playing)),
              h(!1, !0));
          }
          let T = a.diag;
          (Math.random() < 0.4 &&
            (T.pulse("sw", "cmp", "#b58cff", 3),
            T.pulse("cmp", "dds", "#b58cff", 3),
            T.pulse("dds", "amp", "#ff9f43", 3),
            T.pulse("amp", "coil", "#ff6b6b", 3)),
            (s.emissiveIntensity = 1.5 + Math.sin(E * 40)));
        } else
          ((s.emissiveIntensity *= 0.9),
            Math.random() < 0.08 &&
              (a.diag.pulse("coil", "adc", "#5fe08a", 2),
              a.diag.pulse("adc", "fft", "#5fe08a", 2),
              a.diag.pulse("fft", "sw", "#5fe08a", 2)));
        if (!o) return;
        let M = new N(0, 1, 0);
        for (let T = 0; T < 3; T++) {
          let A = t[T],
            w = n[T],
            v = T < i.n;
          if (((A.g.visible = v), (w.g.visible = v), !v)) continue;
          let R = o.bloch(T),
            _ = new N(R.x, R.z, -R.y),
            P = _.length() * 0.14;
          (P > 1e-4 && A.arrow.quaternion.setFromUnitVectors(M, _.clone().normalize()),
            (A.sh.scale.y = Math.max(0.001, P)),
            (A.sh.position.y = P / 2),
            (A.hd.position.y = P),
            (A.hd.visible = P > 0.01));
          let V = E * (2.5 + T * 0.7),
            k = new N(
              R.x * Math.cos(V) - R.y * Math.sin(V),
              R.z,
              -(R.x * Math.sin(V) + R.y * Math.cos(V)),
            );
          (k.length() > 1e-4 && w.a.quaternion.setFromUnitVectors(M, k.normalize()),
            w.a.scale.setScalar(Math.max(0.15, Math.hypot(R.x, R.y, R.z))));
        }
      },
    };
  function l() {
    return i.ops.reduce((y, E) => Math.max(y, E.col + 1), 0);
  }
  function c(y) {
    if (!So[y]) return;
    let [E, M] = So[y];
    ((i.n = E), (e.nsel.value = E));
    let T = Mo(M, E);
    ((i.ops = T.ops),
      (i.errs = T.errs),
      (i.step = 1 / 0),
      e.stepS.set(Tr),
      h(!1),
      (e.code.value = M));
  }
  function h(y = !0, E = !1) {
    (y && (e.code.value = r0(i.ops)),
      (e.err.textContent = i.errs.join(`
`)),
      (o = vo(i.n, i.ops, i.step)),
      !E || !i.counts ? d() : p());
  }
  function d() {
    let y = i.step === 1 / 0 ? i.ops : i.ops.filter((E) => E.col < i.step);
    ((i.counts = Sm(i.n, y, i.shots, {
      dephase: i.dephase,
      readout: i.readout,
    })),
      p());
  }
  function u(y, E) {
    let M = i.tool,
      T = (w) =>
        w.col === E &&
        (w.q.includes(y) ||
          (w.q.length > 1 && y > Math.min(...w.q) && y < Math.max(...w.q)));
    if (M === "erase") {
      ((i.ops = i.ops.filter((w) => !T(w))), (i.pending = []), h());
      return;
    }
    let A = M === "M" ? 1 : br(M);
    if (A === 1)
      ((i.ops = i.ops.filter((w) => !T(w))),
        i.ops.push({ g: M, q: [y], th: /^R/.test(M) ? i.th : 0, col: E }),
        (i.pending = []));
    else if (
      (i.pending.length && i.pending[0].col !== E && (i.pending = []),
      i.pending.some((w) => w.q === y) || i.pending.push({ q: y, col: E }),
      i.pending.length === A)
    ) {
      let w = i.pending.map((_) => _.q),
        v = Math.min(...w),
        R = Math.max(...w);
      ((i.ops = i.ops.filter(
        (_) =>
          !(
            (_.col === E && _.q.some((P) => P >= v && P <= R)) ||
            (_.col === E &&
              _.q.length > 1 &&
              Math.min(..._.q) <= R &&
              Math.max(..._.q) >= v)
          ),
      )),
        i.ops.push({ g: M, q: w, th: 0, col: E }),
        (i.pending = []));
    } else {
      f();
      return;
    }
    (i.ops.sort((w, v) => w.col - v.col), (i.errs = []), h());
  }
  function f() {
    let y = e.grid;
    ((y.innerHTML = ""),
      (y.style.gridTemplateColumns = `34px repeat(${Tr}, minmax(22px, 1fr))`));
    for (let E = 0; E < i.n; E++) {
      y.append(q("div", { class: "lab", style: { color: ms[E] } }, "q" + E));
      for (let M = 0; M < Tr; M++) {
        let T = "─",
          A = "cell";
        for (let v of i.ops)
          if (v.col === M) {
            let R = v.q.indexOf(E);
            R >= 0
              ? ((T = x1[v.g]
                  ? x1[v.g][R]
                  : v.g === "M"
                    ? "📏"
                    : /^R/.test(v.g)
                      ? v.g[1] + "·" + Math.round((v.th * 180) / Math.PI)
                      : v.g),
                (A = "cell " + (x1[v.g] ? "c" : "g")))
              : v.q.length > 1 &&
                E > Math.min(...v.q) &&
                E < Math.max(...v.q) &&
                ((T = "│"), (A = "cell c"));
          }
        i.pending.some((v) => v.q === E && v.col === M) && ((T = "?"), (A = "cell c"));
        let w = q(
          "div",
          { class: A, title: `q${E}, column ${M}`, onclick: () => u(E, M) },
          T,
        );
        (i.step !== 1 / 0 && M >= i.step && (w.style.opacity = 0.35), y.append(w));
      }
    }
  }
  function p() {
    f();
    let y = i.n,
      E = o.probs(),
      M = Qn[y],
      T = `basis   amplitude            prob    phase
`;
    for (let v = 0; v < E.length; v++) {
      let R = o.re[v],
        _ = o.im[v];
      T += `|${s0(v, y)}⟩  ${(R >= 0 ? " " : "") + R.toFixed(4)} ${_ >= 0 ? "+" : "-"} ${Math.abs(_).toFixed(4)}i   ${E[v].toFixed(4)}  ${E[v] > 1e-9 ? ((Math.atan2(_, R) * 180) / Math.PI).toFixed(0) + "°" : ""}
`;
    }
    e.amp.textContent = T;
    let A = Da(y, i.ops),
      w = e.st;
    (w.set("n", y),
      w.set("mol", M.name),
      w.set("g", i.ops.length),
      w.set("d", l()),
      w.set("pt", (A * 1e3).toFixed(2) + " ms"),
      w.set(
        "ok",
        A < 0.005
          ? "fine ✓"
          : A < 0.02
            ? "tight (near T₂)"
            : "exceeds T₂ – signal decays ✗",
      ),
      x(),
      g(E),
      m(E),
      S(),
      b(E));
  }
  function x() {
    let y = e.bl,
      E = yt(y),
      M = y.width,
      T = y.height;
    ((E.fillStyle = "#05080b"), E.fillRect(0, 0, M, T));
    let A = i.n,
      w = Math.min(T * 0.38, (M / A) * 0.36);
    for (let v = 0; v < A; v++) {
      let R = (M / A) * (v + 0.5),
        _ = T / 2,
        P = o.bloch(v);
      ((E.strokeStyle = "#334"),
        (E.lineWidth = 1),
        E.beginPath(),
        E.arc(R, _, w, 0, 7),
        E.stroke(),
        E.beginPath(),
        E.ellipse(R, _, w, w * 0.3, 0, 0, 7),
        E.stroke());
      let V = (z, F, H) => [R + w * (F * 0.95 - z * 0.35), _ - w * (H - z * 0.22)];
      ((E.fillStyle = "#8b98a9"),
        (E.font = Math.round(w / 5) + "px monospace"),
        E.fillText("|0⟩", R - 8, _ - w - 4),
        E.fillText("|1⟩", R - 8, _ + w + 14));
      let [k, L] = V(P.x, P.y, P.z);
      ((E.strokeStyle = ms[v]),
        (E.lineWidth = 3),
        E.beginPath(),
        E.moveTo(R, _),
        E.lineTo(k, L),
        E.stroke(),
        (E.fillStyle = ms[v]),
        E.beginPath(),
        E.arc(k, L, 4, 0, 7),
        E.fill(),
        E.fillText(`q${v} |r|=${Math.hypot(P.x, P.y, P.z).toFixed(2)}`, R - w, T - 4));
    }
  }
  function g(y) {
    let E = e.hist,
      M = yt(E),
      T = E.width,
      A = E.height;
    ((M.fillStyle = "#05080b"), M.fillRect(0, 0, T, A));
    let w = y.length,
      v = T / w,
      R = i.counts.reduce((_, P) => _ + P, 0) || 1;
    for (let _ = 0; _ < w; _++) {
      let P = _ * v;
      ((M.fillStyle = "#3a7bd5"),
        M.fillRect(P + v * 0.15, A - 18 - y[_] * (A - 30), v * 0.7, y[_] * (A - 30)));
      let V = i.counts[_] / R;
      ((M.fillStyle = "#ffd166"),
        M.beginPath(),
        M.arc(P + v / 2, A - 18 - V * (A - 30), 4, 0, 7),
        M.fill(),
        (M.fillStyle = "#ccc"),
        (M.font = "11px monospace"),
        (M.textAlign = "center"),
        M.fillText("|" + s0(_, i.n) + "⟩", P + v / 2, A - 4),
        (y[_] > 0.005 || V > 0.005) &&
          M.fillText(
            y[_].toFixed(2) + " / " + V.toFixed(2),
            P + v / 2,
            Math.max(12, A - 22 - Math.max(y[_], V) * (A - 30)),
          ),
        (M.textAlign = "left"));
    }
  }
  function m(y) {
    let E = e.nmr,
      M = yt(E),
      T = E.width,
      A = E.height;
    ((M.fillStyle = "#05080b"), M.fillRect(0, 0, T, A));
    let w = o0(i.n, y),
      v = i.n,
      R = T / v;
    w.forEach((_, P) => {
      let V = P * R,
        k = A / 2;
      ((M.strokeStyle = "#223"),
        M.beginPath(),
        M.moveTo(V, k),
        M.lineTo(V + R, k),
        M.stroke());
      let L = Math.max(150, ..._.peaks.map((z) => Math.abs(z.f))) * 1.4;
      ((M.strokeStyle = ms[P]), (M.lineWidth = 1.5), M.beginPath());
      for (let z = 0; z <= 200; z++) {
        let F = -L + (2 * L * z) / 200,
          H = 0;
        for (let ue of _.peaks) H += ue.a / (1 + ((F - ue.f) / (L * 0.03)) ** 2);
        let j = V + 6 + ((R - 12) * z) / 200,
          K = k - H * (A * 0.38);
        z ? M.lineTo(j, K) : M.moveTo(j, K);
      }
      (M.stroke(),
        (M.fillStyle = ms[P]),
        (M.font = "11px sans-serif"),
        M.fillText(_.nucleus + " (q" + P + ")", V + 6, 12));
    });
  }
  function S() {
    let y = e.pulse,
      E = yt(y),
      M = y.width,
      T = y.height;
    ((E.fillStyle = "#05080b"), E.fillRect(0, 0, M, T));
    let A = i.n,
      w = T / A,
      v = Math.max(1, l()),
      R = M / v;
    for (let _ = 0; _ < A; _++) {
      let P = _ * w + w / 2;
      ((E.strokeStyle = "#333"),
        E.beginPath(),
        E.moveTo(0, P),
        E.lineTo(M, P),
        E.stroke());
    }
    for (let _ of i.ops) {
      let P = _.col * R;
      if (_.g !== "M")
        if (_.q.length === 1) {
          let V = _.q[0],
            k = w * 0.7 * Math.min(1, Math.abs(_.th || Math.PI / 2) / Math.PI + 0.3);
          ((E.fillStyle = ms[V]),
            E.fillRect(P + R * 0.3, V * w + w / 2 - k / 2, R * 0.4, k));
        } else {
          E.fillStyle = "rgba(181,140,255,.35)";
          let V = Math.min(..._.q),
            k = Math.max(..._.q);
          (E.fillRect(P + 2, V * w + 2, R - 4, (k - V + 1) * w - 4),
            (E.fillStyle = "#ddd"),
            (E.font = "10px monospace"),
            E.fillText("J-delay", P + 4, V * w + 12));
        }
    }
    i.playing >= 0 &&
      ((E.fillStyle = "rgba(255,255,255,.15)"), E.fillRect(i.playing * R, 0, R, T));
  }
  function b(y) {
    let E = r.ctx,
      M = 384,
      T = 224;
    ((E.fillStyle = "#0d1b2a"),
      E.fillRect(0, 0, M, T),
      (E.fillStyle = "#9ec9ff"),
      (E.font = "bold 18px sans-serif"),
      E.fillText(
        "SpinQ-style  •  " + i.n + " qubits  •  " + i.ops.length + " gates",
        10,
        24,
      ));
    let A = y.length,
      w = (M - 20) / A;
    for (let v = 0; v < A; v++)
      ((E.fillStyle = "#3a9bff"),
        E.fillRect(10 + v * w + 3, T - 30 - y[v] * 150, w - 6, y[v] * 150),
        (E.fillStyle = "#fff"),
        (E.font = "13px monospace"),
        E.fillText(s0(v, i.n), 10 + v * w + 4, T - 12));
    r.tex.needsUpdate = !0;
  }
  return (
    (a.test = () => {
      let y = Mo("h q0; cx q0,q1;", 2).ops,
        E = vo(2, y).probs(),
        M = Sm(2, y, 4e3),
        T = vo(2, Mo(So["Grover search, 2 qubits (finds |11>)"][1], 2).ops).probs(),
        A = vo(3, Mo(So["Teleportation (deferred measurement)"][1], 3).ops).bloch(2),
        w = vo(1, Mo("ry(pi/3) q0; rz(pi/4) q0;", 1).ops).bloch(0),
        v = {
          bell_exact: [...E].map((R) => +R.toFixed(3)),
          bell_shots_4000: [...M],
          grover_p11: +T[3].toFixed(6),
          teleport_fidelity_err: +Math.hypot(
            A.x - w.x,
            A.y - w.y,
            A.z - w.z,
          ).toExponential(2),
        };
      return (
        (v.ok =
          Math.abs(E[0] - 0.5) < 1e-9 &&
          Math.abs(E[3] - 0.5) < 1e-9 &&
          M[1] + M[2] === 0 &&
          Math.abs(M[0] / 4e3 - 0.5) < 0.04 &&
          T[3] > 0.999999 &&
          v.teleport_fidelity_err < 1e-9),
        v
      );
    }),
    (i.getState = () => o),
    a
  );
}
var gs = 1,
  I0 = 2,
  D0 = 4,
  fb = 8,
  L0 = 64,
  b1 = 128,
  FA = new Set([
    "ADC",
    "SBC",
    "AND",
    "ORA",
    "EOR",
    "CMP",
    "CPX",
    "CPY",
    "BIT",
    "ASL",
    "LSR",
    "ROL",
    "ROR",
    "INC",
    "DEC",
    "INX",
    "INY",
    "DEX",
    "DEY",
  ]),
  Xc = class extends Sr {
    constructor(e) {
      let t = e || new Uint8Array(65536);
      (super(
        (n) => t[n],
        (n, s) => {
          t[n] = s;
        },
      ),
        (this.mem = t),
        (this.bus = []),
        (this.trace = []),
        (this.keepTrace = 0),
        (this.mn = ""),
        (this.mode = ""),
        (this.op = 0),
        (this.opPC = 0));
    }
    snap() {
      return {
        a: this.a,
        x: this.x,
        y: this.y,
        s: this.sp,
        p: this.p,
        pc: this.pc,
      };
    }
    R(e, t, n) {
      e &= 65535;
      let s = this.mem[e];
      return (
        this.bus.push({
          a: e,
          d: s,
          rw: 1,
          sync: 0,
          note: t,
          blk: n,
          regs: this.snap(),
        }),
        s
      );
    }
    W(e, t, n, s) {
      ((e &= 65535),
        (t &= 255),
        (this.mem[e] = t),
        this.onWrite && this.onWrite(e, t),
        this.bus.push({
          a: e,
          d: t,
          rw: 0,
          sync: 0,
          note: n,
          blk: s,
          regs: this.snap(),
        }));
    }
    fetch(e) {
      let t = this.R(this.pc, e, "pc ab dl");
      return ((this.pc = (this.pc + 1) & 65535), t);
    }
    reset() {
      ((this.bus = []),
        this.R(this.pc, "reset: internal", "timing"),
        this.R(this.pc, "reset: internal", "timing"));
      for (let n = 0; n < 3; n++)
        (this.R(256 | this.sp, "reset: suppressed push (read)", "s ab"),
          (this.sp = (this.sp - 1) & 255));
      this.p |= D0;
      let e = this.R(65532, "reset vector low", "ab dl pcl"),
        t = this.R(65533, "reset vector high", "ab dl pch");
      return (
        (this.pc = (t << 8) | e),
        this.finish("RESET"),
        (this.cycles = 0),
        (this.instr = 0),
        this.bus
      );
    }
    finish(e) {
      let t = this.snap();
      for (let n of this.bus) n.regs || (n.regs = t);
      if (this.keepTrace) {
        for (let n of this.bus) this.trace.push(n);
        this.trace.length > this.keepTrace &&
          this.trace.splice(0, this.trace.length - this.keepTrace);
      }
      this.cycles += this.bus.length;
    }
    ea(e, t) {
      let n, s, r, o, a;
      switch (e) {
        case "zp":
          return this.fetch("fetch zero-page address");
        case "zpx":
        case "zpy":
          return (
            (r = this.fetch("fetch zero-page base")),
            this.R(r, "dummy read while adding index", "ab alu"),
            (r + (e === "zpx" ? this.x : this.y)) & 255
          );
        case "abs":
          return (
            (n = this.fetch("fetch address low")),
            (s = this.fetch("fetch address high")),
            (s << 8) | n
          );
        case "abx":
        case "aby":
          return (
            (n = this.fetch("fetch address low")),
            (s = this.fetch("fetch address high")),
            (o = n + (e === "abx" ? this.x : this.y)),
            (t !== "R" || o > 255) &&
              this.R(
                (s << 8) | (o & 255),
                o > 255
                  ? "dummy read: page crossed, fixing high byte"
                  : "dummy read (write/RMW always takes the fix-up cycle)",
                "ab alu",
              ),
            ((s << 8) + o) & 65535
          );
        case "izx":
          return (
            (a = this.fetch("fetch zero-page pointer")),
            this.R(a, "dummy read while adding X", "ab alu"),
            (a = (a + this.x) & 255),
            (n = this.R(a, "read pointer low", "ab dl")),
            (s = this.R((a + 1) & 255, "read pointer high", "ab dl")),
            (s << 8) | n
          );
        case "izy":
          return (
            (a = this.fetch("fetch zero-page pointer")),
            (n = this.R(a, "read pointer low", "ab dl")),
            (s = this.R((a + 1) & 255, "read pointer high", "ab dl")),
            (o = n + this.y),
            (t !== "R" || o > 255) &&
              this.R((s << 8) | (o & 255), "dummy read: fixing high byte", "ab alu"),
            ((s << 8) + o) & 65535
          );
      }
    }
    step() {
      ((this.bus = []), (this.opPC = this.pc));
      let e = this.R(this.pc, "fetch opcode (SYNC)", "pc ab dl ir pla");
      ((this.bus[0].sync = 1), (this.op = e));
      let t = Fa[e];
      if (!t) return ((this.jammed = !0), this.finish("JAM"), !1);
      ((this.pc = (this.pc + 1) & 65535), this.instr++);
      let [n, s] = t;
      ((this.mn = n), (this.mode = s));
      let r = 256,
        o = (h) => {
          let d =
            s === "imm"
              ? this.fetch("fetch immediate operand")
              : this.R(this.ea(s, "R"), "read operand", "ab dl alu");
          h(d);
        },
        a = (h) => {
          this.W(this.ea(s, "W"), h, "write register to memory", "ab dor db");
        },
        l = (h) => {
          if (s === "acc") {
            (this.R(this.pc, "dummy read (accumulator op)", "alu a"),
              (this.a = this.nz(h(this.a))));
            return;
          }
          let d = this.ea(s, "M"),
            u = this.R(d, "read operand", "ab dl");
          (this.W(d, u, "dummy write of the unmodified value (NMOS RMW)", "ab dor alu"),
            this.W(d, this.nz(h(u)), "write modified value", "ab dor alu"));
        },
        c = (h) => {
          (this.R(this.pc, "dummy read of next byte", "pla"), h());
        };
      switch (n) {
        case "LDA":
          o((h) => (this.a = this.nz(h)));
          break;
        case "LDX":
          o((h) => (this.x = this.nz(h)));
          break;
        case "LDY":
          o((h) => (this.y = this.nz(h)));
          break;
        case "STA":
          a(this.a);
          break;
        case "STX":
          a(this.x);
          break;
        case "STY":
          a(this.y);
          break;
        case "ADC":
          o((h) => this.adc(h));
          break;
        case "SBC":
          o((h) => this.sbc(h));
          break;
        case "AND":
          o((h) => (this.a = this.nz(this.a & h)));
          break;
        case "ORA":
          o((h) => (this.a = this.nz(this.a | h)));
          break;
        case "EOR":
          o((h) => (this.a = this.nz(this.a ^ h)));
          break;
        case "CMP":
          o((h) => this.cmp(this.a, h));
          break;
        case "CPX":
          o((h) => this.cmp(this.x, h));
          break;
        case "CPY":
          o((h) => this.cmp(this.y, h));
          break;
        case "BIT":
          o((h) => {
            this.p = (this.p & ~(b1 | L0 | I0)) | (h & 192) | (h & this.a ? 0 : I0);
          });
          break;
        case "ASL":
          l((h) => ((this.p = (this.p & ~gs) | (h >> 7)), (h << 1) & 255));
          break;
        case "LSR":
          l((h) => ((this.p = (this.p & ~gs) | (h & 1)), h >> 1));
          break;
        case "ROL":
          l((h) => {
            let d = this.p & gs;
            return ((this.p = (this.p & ~gs) | (h >> 7)), ((h << 1) | d) & 255);
          });
          break;
        case "ROR":
          l((h) => {
            let d = this.p & gs;
            return ((this.p = (this.p & ~gs) | (h & 1)), (h >> 1) | (d << 7));
          });
          break;
        case "INC":
          l((h) => (h + 1) & 255);
          break;
        case "DEC":
          l((h) => (h - 1) & 255);
          break;
        case "INX":
          c(() => (this.x = this.nz((this.x + 1) & 255)));
          break;
        case "INY":
          c(() => (this.y = this.nz((this.y + 1) & 255)));
          break;
        case "DEX":
          c(() => (this.x = this.nz((this.x - 1) & 255)));
          break;
        case "DEY":
          c(() => (this.y = this.nz((this.y - 1) & 255)));
          break;
        case "TAX":
          c(() => (this.x = this.nz(this.a)));
          break;
        case "TAY":
          c(() => (this.y = this.nz(this.a)));
          break;
        case "TXA":
          c(() => (this.a = this.nz(this.x)));
          break;
        case "TYA":
          c(() => (this.a = this.nz(this.y)));
          break;
        case "TSX":
          c(() => (this.x = this.nz(this.sp)));
          break;
        case "TXS":
          c(() => (this.sp = this.x));
          break;
        case "CLC":
          c(() => (this.p &= ~gs));
          break;
        case "SEC":
          c(() => (this.p |= gs));
          break;
        case "CLI":
          c(() => (this.p &= ~D0));
          break;
        case "SEI":
          c(() => (this.p |= D0));
          break;
        case "CLV":
          c(() => (this.p &= ~L0));
          break;
        case "CLD":
          c(() => (this.p &= ~fb));
          break;
        case "SED":
          c(() => (this.p |= fb));
          break;
        case "NOP":
          c(() => 0);
          break;
        case "PHA":
        case "PHP":
          (this.R(this.pc, "dummy read", "pla"),
            this.W(r | this.sp, n === "PHA" ? this.a : this.p | 48, "push", "s ab dor"),
            (this.sp = (this.sp - 1) & 255));
          break;
        case "PLA":
        case "PLP": {
          (this.R(this.pc, "dummy read", "pla"),
            this.R(r | this.sp, "dummy stack read (S+1 computed)", "s ab"),
            (this.sp = (this.sp + 1) & 255));
          let h = this.R(r | this.sp, "pull", "s ab dl");
          n === "PLA" ? (this.a = this.nz(h)) : (this.p = (h & -17) | 32);
          break;
        }
        case "JMP":
          if (s === "abs") {
            let h = this.fetch("fetch target low"),
              d = this.R(this.pc, "fetch target high", "pc ab dl");
            this.pc = (d << 8) | h;
          } else {
            let h = this.fetch("fetch pointer low"),
              d = this.fetch("fetch pointer high"),
              u = (d << 8) | h,
              f = this.R(u, "read target low", "ab dl"),
              p = this.R(
                (u & 65280) | ((u + 1) & 255),
                "read target high (page-wrap bug)",
                "ab dl",
              );
            this.pc = (p << 8) | f;
          }
          break;
        case "JSR": {
          let h = this.fetch("fetch target low");
          (this.R(r | this.sp, "dummy stack read", "s ab"),
            this.W(r | this.sp, this.pc >> 8, "push PCH", "s ab dor pch"),
            (this.sp = (this.sp - 1) & 255),
            this.W(r | this.sp, this.pc & 255, "push PCL", "s ab dor pcl"),
            (this.sp = (this.sp - 1) & 255));
          let d = this.R(this.pc, "fetch target high", "pc ab dl");
          this.pc = (d << 8) | h;
          break;
        }
        case "RTS": {
          (this.R(this.pc, "dummy read", "pla"),
            this.R(r | this.sp, "dummy stack read", "s ab"),
            (this.sp = (this.sp + 1) & 255));
          let h = this.R(r | this.sp, "pull PCL", "s ab dl pcl");
          this.sp = (this.sp + 1) & 255;
          let d = this.R(r | this.sp, "pull PCH", "s ab dl pch");
          ((this.pc = (d << 8) | h),
            this.R(this.pc, "dummy read, increment PC", "pc ab"),
            (this.pc = (this.pc + 1) & 65535));
          break;
        }
        case "RTI": {
          (this.R(this.pc, "dummy read", "pla"),
            this.R(r | this.sp, "dummy stack read", "s ab"),
            (this.sp = (this.sp + 1) & 255),
            (this.p = (this.R(r | this.sp, "pull P", "s ab dl p") & -17) | 32),
            (this.sp = (this.sp + 1) & 255));
          let h = this.R(r | this.sp, "pull PCL", "s ab dl pcl");
          this.sp = (this.sp + 1) & 255;
          let d = this.R(r | this.sp, "pull PCH", "s ab dl pch");
          this.pc = (d << 8) | h;
          break;
        }
        case "BRK": {
          (this.fetch("fetch padding byte"),
            this.W(r | this.sp, this.pc >> 8, "push PCH", "s ab dor"),
            (this.sp = (this.sp - 1) & 255),
            this.W(r | this.sp, this.pc & 255, "push PCL", "s ab dor"),
            (this.sp = (this.sp - 1) & 255),
            this.W(r | this.sp, this.p | 48, "push P (B set)", "s ab dor p"),
            (this.sp = (this.sp - 1) & 255),
            (this.p |= D0));
          let h = this.R(65534, "IRQ/BRK vector low", "ab dl pcl"),
            d = this.R(65535, "IRQ/BRK vector high", "ab dl pch");
          ((this.pc = (d << 8) | h), (this.brk = !0));
          break;
        }
        default: {
          let h = this.fetch("fetch branch offset");
          if (
            {
              BPL: !(this.p & b1),
              BMI: !!(this.p & b1),
              BVC: !(this.p & L0),
              BVS: !!(this.p & L0),
              BCC: !(this.p & gs),
              BCS: !!(this.p & gs),
              BNE: !(this.p & I0),
              BEQ: !!(this.p & I0),
            }[n]
          ) {
            let u = (this.pc + (h < 128 ? h : h - 256)) & 65535;
            (this.R(this.pc, "branch taken: dummy read, add offset to PCL", "alu pcl"),
              (u ^ this.pc) & 65280 &&
                this.R(
                  (this.pc & 65280) | (u & 255),
                  "page crossed: dummy read, fix PCH",
                  "alu pch",
                ),
              (this.pc = u));
          }
        }
      }
      if (FA.has(n))
        for (let h of this.bus.slice(1)) /fetch/.test(h.note) || (h.blk += " alu");
      return (this.finish(n), !0);
    }
    load(e, t) {
      for (let [n, s] of e) this.mem[n] = s;
      ((this.mem[65532] = t & 255), (this.mem[65533] = t >> 8));
    }
  };
var NA = "https://raw.githubusercontent.com/trebonian/visual6502/master/",
  mb =
    "Netlist & layout: visual6502.org (Greg James, Brian Silverman, Barry Silverman), CC BY-NC-SA 3.0 — fetched at run time, not redistributed. Node names: MIT (Silverman, Silverman, Spittles, Boessenkool).";
function pb(i, e) {
  let t = i.indexOf("["),
    n = i.lastIndexOf("]"),
    s = i
      .slice(t, n + 1)
      .replace(/\/\/[^\n]*/g, "")
      .replace(/'/g, '"')
      .replace(/,\s*\]/g, "]");
  return JSON.parse(s);
}
function VA(i) {
  let e = i.indexOf("{"),
    t = i.lastIndexOf("}"),
    n = {};
  for (let s of i.slice(e + 1, t).split(`
`)) {
    let r = s.replace(/\/\/.*/, "").match(/^\s*"?([\w#'-]+)"?\s*:\s*(\d+)/);
    r && (n[r[1]] = +r[2]);
  }
  return n;
}
async function gb(i = NA, e = fetch) {
  let t = async (o) => {
      let a = await e(i + o);
      if (!a.ok) throw new Error(o + ": HTTP " + a.status);
      return a.text();
    },
    [n, s, r] = await Promise.all([
      t("segdefs.js"),
      t("transdefs.js"),
      t("nodenames.js"),
    ]);
  return { segdefs: pb(n), transdefs: pb(s), nodenames: VA(r) };
}
var k0 = class {
  constructor(e) {
    let { segdefs: t, transdefs: n, nodenames: s } = e;
    ((this.names = s), (this.segdefs = t));
    let r = 0;
    for (let d of t) r = Math.max(r, d[0]);
    for (let d of n) r = Math.max(r, d[1], d[2], d[3]);
    let o = r + 1;
    ((this.nn = o),
      (this.state = new Uint8Array(o)),
      (this.pullup = new Uint8Array(o)),
      (this.pulldown = new Uint8Array(o)),
      (this.used = new Uint8Array(o)));
    for (let d of t) ((this.used[d[0]] = 1), d[1] === "+" && (this.pullup[d[0]] = 1));
    ((this.gnd = s.vss), (this.pwr = s.vcc));
    let a = n.length;
    ((this.tg = new Int32Array(a)),
      (this.t1 = new Int32Array(a)),
      (this.t2 = new Int32Array(a)),
      (this.ton = new Uint8Array(a)));
    let l = Array.from({ length: o }, () => []),
      c = Array.from({ length: o }, () => []);
    (n.forEach((d, u) => {
      let f = d[1],
        p = d[2],
        x = d[3];
      (p === this.gnd && ((p = x), (x = this.gnd)),
        p === this.pwr && ((p = x), (x = this.pwr)),
        (this.tg[u] = f),
        (this.t1[u] = p),
        (this.t2[u] = x),
        l[f].push(u),
        c[p].push(u),
        c[x].push(u),
        (this.used[f] = this.used[p] = this.used[x] = 1));
    }),
      (this.gates = l.map((d) => Int32Array.from(d))),
      (this.cc = c.map((d) => Int32Array.from(d))),
      (this.T = a),
      (this.mem = new Uint8Array(65536)),
      (this.halfCycles = 0),
      (this.recalcs = 0),
      (this.inList = new Uint8Array(o)),
      (this.inGroup = new Uint8Array(o)),
      (this.nodeChanges = new Uint32Array(o)));
    let h = (d) => s[d];
    ((this.ab = [...Array(16)].map((d, u) => h("ab" + u))),
      (this.db = [...Array(8)].map((d, u) => h("db" + u))),
      (this.reg = (d) => [...Array(8)].map((u, f) => h(d + f))));
  }
  isHigh(e) {
    return !!this.state[typeof e == "number" ? e : this.names[e]];
  }
  bits(e) {
    let t = 0;
    return (
      e.forEach((n, s) => {
        this.state[n] && (t |= 1 << s);
      }),
      t
    );
  }
  read(e) {
    return this.bits(this.reg(e));
  }
  get A() {
    return this.read("a");
  }
  get X() {
    return this.read("x");
  }
  get Y() {
    return this.read("y");
  }
  get S() {
    return this.read("s");
  }
  get PC() {
    return this.read("pcl") | (this.read("pch") << 8);
  }
  get AB() {
    return this.bits(this.ab);
  }
  get DB() {
    return this.bits(this.db);
  }
  get P() {
    let e = ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7"].map((t) => this.names[t]);
    return this.bits(e.map((t) => t ?? 0));
  }
  get IR() {
    let e = [...Array(8)].map((t, n) => this.names["notir" + n]);
    return this.bits(e) ^ 255;
  }
  get RW() {
    return this.isHigh("rw");
  }
  get SYNC() {
    return this.isHigh("sync");
  }
  get CLK() {
    return this.isHigh("clk0");
  }
  recalcList(e) {
    let t = e;
    for (let n = 0; n < 100 && t.length; n++) {
      let s = [];
      this._next = s;
      for (let r of t) this.recalcNode(r);
      for (let r of s) this.inList[r] = 0;
      t = s;
    }
  }
  recalcNode(e) {
    if (e === this.gnd || e === this.pwr) return;
    this.recalcs++;
    let t = [];
    this.addToGroup(e, t);
    let n;
    if (this.inGroup[this.gnd]) n = 0;
    else if (this.inGroup[this.pwr]) n = 1;
    else {
      n = 0;
      for (let s of t) {
        if (this.pullup[s]) {
          n = 1;
          break;
        }
        if (this.pulldown[s]) {
          n = 0;
          break;
        }
        if (this.state[s]) {
          n = 1;
          break;
        }
      }
    }
    for (let s of t) this.inGroup[s] = 0;
    ((this.inGroup[this.gnd] = 0), (this.inGroup[this.pwr] = 0));
    for (let s of t)
      if (this.state[s] !== n) {
        ((this.state[s] = n), this.nodeChanges[s]++);
        for (let r of this.gates[s])
          n
            ? this.ton[r] || ((this.ton[r] = 1), this.add(this.t1[r]))
            : this.ton[r] &&
              ((this.ton[r] = 0), this.add(this.t1[r]), this.add(this.t2[r]));
      }
  }
  add(e) {
    e === this.gnd ||
      e === this.pwr ||
      this.inList[e] ||
      ((this.inList[e] = 1), this._next.push(e));
  }
  addToGroup(e, t) {
    let n = [e];
    for (; n.length;) {
      let s = n.pop();
      if (
        !this.inGroup[s] &&
        ((this.inGroup[s] = 1), !(s === this.gnd || s === this.pwr))
      ) {
        t.push(s);
        for (let r of this.cc[s]) {
          if (!this.ton[r]) continue;
          let o = this.t1[r] === s ? this.t2[r] : this.t1[r];
          this.inGroup[o] || n.push(o);
        }
      }
    }
  }
  set(e, t) {
    let n = this.names[e];
    ((this.pullup[n] = t ? 1 : 0),
      (this.pulldown[n] = t ? 0 : 1),
      (this._next = []),
      this.recalcList([n]));
  }
  writeDB(e) {
    let t = [];
    for (let n = 0; n < 8; n++) {
      let s = this.db[n];
      (e & 1
        ? ((this.pulldown[s] = 0), (this.pullup[s] = 1))
        : ((this.pulldown[s] = 1), (this.pullup[s] = 0)),
        t.push(s),
        (e >>= 1));
    }
    this.recalcList(t);
  }
  init() {
    (this.state.fill(0), this.ton.fill(0), (this.state[this.pwr] = 1));
    for (let [t, n] of [
      ["res", 0],
      ["clk0", 0],
      ["rdy", 1],
      ["so", 0],
      ["irq", 1],
      ["nmi", 1],
    ]) {
      let s = this.names[t];
      ((this.pullup[s] = n), (this.pulldown[s] = 1 - n));
    }
    let e = [];
    for (let t = 0; t < this.nn; t++)
      this.used[t] && t !== this.gnd && t !== this.pwr && e.push(t);
    this.recalcList(e);
    for (let t = 0; t < 8; t++) (this.set("clk0", 1), this.set("clk0", 0));
    this.set("res", 1);
    for (let t = 0; t < 18; t++) this.halfStep();
    ((this.halfCycles = 0), (this.cyc = 0), (this.log = []));
  }
  halfStep() {
    if (this.isHigh("clk0")) {
      if ((this.set("clk0", 0), this.isHigh("rw"))) {
        let e = this.AB,
          t = this.mem[e];
        this.writeDB(t);
      }
    } else if ((this.set("clk0", 1), !this.isHigh("rw"))) {
      let e = this.AB,
        t = this.DB;
      ((this.mem[e] = t), (this._w = t), this.onWrite && this.onWrite(e, t));
    }
    this.halfCycles++;
  }
  cycle() {
    this.halfStep();
    let e = { a: this.AB, rw: this.RW ? 1 : 0, sync: this.SYNC ? 1 : 0 };
    return (this.halfStep(), (e.d = e.rw ? this.mem[e.a] : this._w), e);
  }
};
var Ar = {
    "Self-test: 2 + 3": `; the classic first program
        LDA #$02
        CLC
        ADC #$03     ; A = 5
        STA $10
halt:   JMP halt`,
    "Count down loop": `        LDX #$05
loop:   DEX
        STX $11
        BNE loop     ; branch taken: 3 cycles, not taken: 2
halt:   JMP halt`,
    "Decimal mode (BCD) 19 + 28": `        SED          ; decimal mode: the ALU's decimal-adjust logic
        CLC
        LDA #$19
        ADC #$28     ; A = $47 (BCD 47)
        STA $12
        CLD
halt:   JMP halt`,
    "Fibonacci in zero page": `        LDA #$01
        STA $20
        STA $21
        LDX #$00
loop:   LDA $20,X
        CLC
        ADC $21,X
        STA $22,X
        INX
        CPX #$0B
        BNE loop     ; $20.. = 1 1 2 3 5 8 13 21 34 55 89 144 233
halt:   JMP halt`,
    "Stack, JSR/RTS, page-cross": `        LDX #$FF
        TXS
        LDY #$10
        JSR sub
        LDA $02F8,Y  ; crosses a page: extra dummy read
        STA $13
halt:   JMP halt
sub:    PHA
        INY
        PLA
        RTS`,
  },
  v1 = Object.keys(Ar),
  xb = [
    ["A", "a", 8],
    ["X", "x", 8],
    ["Y", "y", 8],
    ["S", "s", 8],
    ["P", "p", 8],
    ["PCL", "pcl", 8],
    ["PCH", "pch", 8],
    ["IR", "ir", 8],
    ["DB", "db", 8],
    ["AB", "ab", 16],
    ["ALU", "alu", 8],
    ["DL", "idl", 8],
    ["DOR", "dor", 8],
    ["SB", "sb", 8],
    ["ADL", "adl", 8],
    ["ADH", "adh", 8],
  ];
function M1() {
  let i,
    e,
    t = Ar[v1[0]],
    n = !1,
    s = 4,
    r = 0,
    o = 0,
    a = 0,
    l = [],
    c = [],
    h = {},
    d = "beh",
    u = null,
    f = null,
    p = !1,
    x = "",
    g,
    m,
    S = {},
    b,
    y,
    E,
    M,
    T = [],
    A = new Float32Array(0),
    w,
    v,
    R = !1,
    _ = {},
    P = 0,
    V = [],
    k = {
      id: "m6502",
      era: "1975",
      short: "MOS 6502 microprocessor",
      group: "center",
      name: "MOS Technology 6502 — the $25 microprocessor (1975)",
      blurb:
        "Designed by Chuck Peddle, Bill Mensch and the MOS Technology team and launched in September 1975 at $25 (a Motorola 6800 or Intel 8080 cost about $175–360), the 6502 put a whole CPU on one NMOS die: 3,510 transistors in the visual6502 netlist, drawn by hand on rubylith. It powered the Apple II, Commodore PET/VIC-20/64, Atari 2600/800, BBC Micro and NES, and with it the personal-computer revolution. Open the package, peel the die layer by layer, light the MOnSter 6502 board, and run real code cycle by cycle: by default on a cycle-accurate behavioural model, or on the actual transistor netlist (fetched from visual6502 on request).",
      diagram: {
        nodes: [
          {
            id: "clk",
            label: `Clock gen
φ1 φ2`,
            x: 0.08,
            y: 0.15,
            w: 0.13,
            color: "#9fb3c8",
          },
          {
            id: "tim",
            label: `Timing
T0–T6`,
            x: 0.24,
            y: 0.15,
            w: 0.13,
            color: "#ffb347",
          },
          { id: "ir", label: "IR", x: 0.4, y: 0.15, w: 0.1, color: "#ffb347" },
          {
            id: "pla",
            label: `Decode ROM
(PLA)`,
            x: 0.57,
            y: 0.15,
            w: 0.17,
            color: "#c08cff",
          },
          {
            id: "rcl",
            label: `Random
control`,
            x: 0.79,
            y: 0.15,
            w: 0.14,
            color: "#c08cff",
          },
          {
            id: "pc",
            label: "PCL · PCH",
            x: 0.1,
            y: 0.55,
            w: 0.15,
            color: "#58c4ff",
          },
          {
            id: "regs",
            label: "A X Y S",
            x: 0.33,
            y: 0.55,
            w: 0.15,
            color: "#5fe08a",
          },
          {
            id: "alu",
            label: "ALU + DAA",
            x: 0.55,
            y: 0.55,
            w: 0.16,
            color: "#ff7a1a",
          },
          {
            id: "p",
            label: "P flags",
            x: 0.78,
            y: 0.55,
            w: 0.13,
            color: "#ff5f5f",
          },
          {
            id: "ab",
            label: `Address bus
A0–A15`,
            x: 0.2,
            y: 0.88,
            w: 0.22,
            color: "#8fe3ff",
          },
          {
            id: "db",
            label: `Data bus D0–D7
DL · DOR`,
            x: 0.65,
            y: 0.88,
            w: 0.25,
            color: "#ffe08a",
          },
        ],
        edges: [
          ["clk", "tim"],
          ["tim", "pla"],
          ["ir", "pla"],
          ["pla", "rcl"],
          ["rcl", "alu", "ctl"],
          ["pc", "ab"],
          ["regs", "alu"],
          ["alu", "regs"],
          ["alu", "p"],
          ["db", "ir", "opcode"],
          ["db", "alu"],
          ["regs", "db"],
          ["regs", "ab"],
        ],
      },
      build(D) {
        let $ = U.mosCeramic(),
          Y = U.gold(),
          se = U.plastic(1382171, 0.6);
        D.box(5.6, 0.06, 3.2, U.metal(0x1b212b, 0.55), [0.3, 0.03, 0], {
          name: "Display base",
          info: "Stand for the exhibit: a purple-ceramic/gold MOS 6502 DIP-40 on the left with a 450× magnified silicon die above it, and a MOnSter 6502 discrete-transistor replica on the right.",
        });
        // Carrier PCB + machined IC socket under the DIP-40
        D.box(2.7, 0.025, 1.02, U.pcb(0x134a2c), [-1.5, 0.072, 1.05], {});
        D.box(2.46, 0.045, 0.78, U.plastic(0x181c22, 0.52), [-1.5, 0.105, 1.05], {});
        let he = D.group([-1.5, 0.09, 1.05], {
            name: "DIP-40 package (ceramic, gold lid)",
            info: "Authentic MOS Technology 40-pin purple-brown alumina ceramic dual-in-line package (0.6 in row spacing, 0.1 in pitch) with brazed gold Kovar lid. Pins: A0–A15 address, D0–D7 data, R/W, φ0 clock in, φ1/φ2 out, RDY, IRQ, NMI, RES, SYNC, SO, VCC, 2×VSS. Explode or click 'Open/close lid' to inspect the cavity.",
          }),
          _e = new B(chamferBox(2.36, 0.085, 0.68, 0.012), $);
        ((_e.position.y = 0.125), (_e.castShadow = !0), he.add(_e));
        let _eTop = new B(chamferBox(2.34, 0.075, 0.66, 0.012), $);
        ((_eTop.position.y = 0.205), (_eTop.castShadow = !0), he.add(_eTop));
        // Gold brazed seal ring + Pin-1 semicircular index mark
        let sealRing = new B(chamferBox(0.66, 0.012, 0.52, 0.003), Y);
        ((sealRing.position.y = 0.244), he.add(sealRing));
        let pin1Notch = new B(new ke(0.085, 0.085, 0.082, 20), Y);
        (pin1Notch.position.set(-1.15, 0.206, 0), he.add(pin1Notch));
        let Q = new B(new te(0.52, 0.022, 0.42), U.plastic(0x151118, 0.45));
        ((Q.position.y = 0.246),
          he.add(Q),
          (v = Bt(512, 560)),
          Hs(v.ctx, 512, 560, "all", { bg: "#14121c" }),
          (v.tex.needsUpdate = !0));
        let C = new B(
          new mt(0.22, 0.24),
          new et({
            map: v.tex,
            roughness: 0.24,
            metalness: 0.52,
            emissive: 16777215,
            emissiveMap: v.tex,
            emissiveIntensity: 0.08,
          }),
        );
        ((C.rotation.x = -Math.PI / 2),
          (C.position.y = 0.259),
          he.add(C),
          D.part(C, {
            name: "Silicon die in cavity (bond wires to the lead frame)",
            info: "The ~4 × 4.3 mm NMOS die sits in the gold-plated die-attach cavity; 40 bond pads around its perimeter are stitch-bonded by 25 µm gold wires to the internal Kovar/gold lead-frame fingers.",
          }));
        let I = new ft();
        he.add(I);
        let J = U.gold(),
          pinMetal = U.metal(0xd8dde4, 0.22);
        for (let Pe = 0; Pe < 40; Pe++) {
          let ge = Pe < 20 ? -1 : 1,
            Te = Pe % 20,
            Ue = -0.95 + Te * 0.1,
            De = Ue * 0.33,
            tt = ge * 0.17,
            St = new B(new te(0.018, 0.004, 0.06), Y);
          (St.position.set(De * 1.1, 0.257, tt * 1.25), I.add(St));
          let di = [(Te / 19 - 0.5) * 0.18, 0.26, ge * 0.1],
            Et = new oo(
              new N(...di),
              new N((di[0] + De * 1.1) / 2, 0.3, (di[2] + tt * 1.25) / 2),
              new N(De * 1.1, 0.259, tt * 1.25),
            );
          I.add(new B(new Zn(Et, 8, 0.0025, 4, !1), J));
          // Stepped DIP shoulder + narrow pin leg
          let shldr = new B(new te(0.056, 0.055, 0.026), pinMetal);
          (shldr.position.set(Ue, 0.145, ge * 0.352), he.add(shldr));
          let ji = new B(new te(0.026, 0.13, 0.018), pinMetal);
          (ji.position.set(Ue, 0.058, ge * 0.358), he.add(ji));
        }
        D.part(I, {
          name: "Bond wires & lead frame",
          info: "40 gold bond wires (≈25 µm) stitch-bonded from the die pads to the lead-frame fingers. Pin 1 = VSS, pin 40 = RES; the pads sit around the die edge in the same order.",
        });
        let ie = D.group([-1.5, 0.34, 1.05], {
          name: "Gold-plated lid",
          info: "Brazed gold-plated Kovar lid hermetically sealing the NMOS die cavity. Lift it (Explode / “Open/close lid”) to inspect the silicon die and 40 gold bond wires.",
          explode: [0, 0.6, 0.35],
        });
        ((g = new B(chamferBox(0.62, 0.022, 0.48, 0.004), Y)),
          (g.castShadow = !0),
          ie.add(g),
          Nt(D, "MOS  MPS 6502  4575", 0.78, 0.11, [-2.12, 0.335, 1.05], {
            bg: null,
            color: "#e6c36a",
            rot: [-Math.PI / 2, 0, 0],
          }));
        let fe = 1.9,
          ne = 2.06,
          we = 0.55,
          ve = -0.5;
        D.box(
          0.08,
          we - 0.02,
          0.08,
          U.metal(9278363, 0.35),
          [-1.5, 0.06 + (we - 0.06) / 2, ve - ne * 0.47],
          {},
        );
        let Re = D.box(fe, 0.032, ne, U.siliconDie(0x1f2836), [-1.5, we, ve], {
          name: "Magnified die (≈450×): p-type silicon substrate",
          info: "The die blown up ≈450×. Bottom: lightly doped p-type silicon substrate. Above it, in fabrication order: diffusion (n+ regions), buried contacts, polysilicon, contact cuts / vias, metal. Each layer was one rubylith mask, cut by hand at 100–200× and photo-reduced.",
        });
        ([
          [
            "diff",
            "Diffusion layer (n+ doped silicon)",
            "n+ regions doped into the substrate: transistor sources/drains and short wires. Yellow = switched nodes, green = ground-connected, red = VCC-connected (visual6502 colour convention).",
          ],
          [
            "buried",
            "Buried contacts (poly-to-diffusion)",
            "Where polysilicon touches diffusion directly, under the gate oxide level: a density trick of 1970s NMOS that saved metal.",
          ],
          [
            "poly",
            "Polysilicon layer (gates & wires)",
            "Polycrystalline silicon: where it crosses diffusion it forms a transistor gate (self-aligned silicon gate). In the PLA, poly rows are the instruction/timing inputs.",
          ],
          [
            "via",
            "Contact cuts / vias",
            "Holes through the oxide that connect metal to diffusion or poly. In the decode PLA, the pattern of transistors = the ROM bits.",
          ],
          [
            "metal",
            "Metal layer (aluminium)",
            "The single aluminium layer: VCC and GND rails around the edge, bond pads, long buses across the datapath, and PLA output lines.",
          ],
        ].forEach(([Pe, ge, Te], Ue) => {
          let De = Bt(1024, 1110);
          (Hs(De.ctx, 1024, 1110, Pe), (De.tex.needsUpdate = !0));
          let tt = new xt({
              map: De.tex,
              transparent: !0,
              depthWrite: !1,
              side: fi,
              toneMapped: !1,
              opacity: Pe === "metal" ? 0.85 : 1,
            }),
            St = new B(new mt(fe, ne), tt);
          ((St.rotation.x = -Math.PI / 2),
            St.position.set(-1.5, we + 0.02 + Ue * 0.012, ve),
            (St.renderOrder = 2 + Ue),
            D.add(St, {
              name: ge,
              info: Te,
              explode: [0, 0.16 + Ue * 0.24, 0],
            }),
            (S[Pe] = { mesh: St, tex: De, mat: tt }));
        }),
          (b = Bt(1024, 1110)),
          (y = new B(
            new mt(fe, ne),
            new xt({
              map: b.tex,
              transparent: !0,
              depthWrite: !1,
              toneMapped: !1,
            }),
          )),
          (y.rotation.x = -Math.PI / 2),
          y.position.set(-1.5, we + 0.09, ve),
          (y.renderOrder = 9),
          D.add(y, {
            name: "Functional-block overlay (Hanson block diagram)",
            info: "Outlines of the functional blocks (after Donald F. Hanson's 6502 block diagram, 1995): decode ROM/PLA, random control logic, timing, IR, clock generator, PC low/high, ALU with decimal adjust, A/X/Y/S/P, address-bus drivers, input data latch and data output register. Blocks light up when the current bus cycle uses them.",
            explode: [0, 1.5, 0],
          }),
          (w = D.group([1.5, 0.06, 0.35], {
            name: "MOnSter 6502-style discrete board",
            info: "After the MOnSter 6502 by Eric Schlaepfer & Evil Mad Scientist Laboratories (2016–17): a working 6502 made of discrete parts on a 12 × 15 in, 4-layer board, 4,769 components: 3,218 enhancement MOSFETs and 1,019 resistors standing in for the depletion-mode pull-ups, plus 313 indicator LEDs (rev 2). It runs at up to ≈50 kHz, about 1/20 of the chip. This model is a stylised tribute, not its exact artwork.",
          })));
        let Se = new ft();
        (Se.position.set(0, 0, 0), (Se.rotation.x = -0.95), w.add(Se));
        // Rear easel struts hinged behind the tilted PCB (hinge z=-1.29 < board z=-1.22, foot z=-1.78 on plinth)
        for (let Pe of [-1, 1]) {
          let ge = new B(chamferBox(0.055, 0.98, 0.055, 0.008), U.metal(0x3a424e, 0.36));
          (ge.position.set(Pe * 0.92, 0.442, -1.532), (ge.rotation.x = 0.525), w.add(ge));
          let foot = new B(new ke(0.055, 0.065, 0.025, 16), U.plastic(0x14181f, 0.7));
          (foot.position.set(Pe * 0.92, 0.012, -1.78), w.add(foot));
        }
        ((E = Bt(1024, 1280)), de());
        let Ve = 2.4,
          Ke = 3,
          $e = new B(new te(Ve, Ke, 0.03), [
            se,
            se,
            se,
            se,
            new et({ map: E.tex, roughness: 0.55, metalness: 0.1 }),
            se,
          ]);
        ($e.position.set(0, Ke / 2 + 0.05, 0),
          Se.add($e),
          D.part($e, {
            name: "MOnSter board: layout-style silkscreen & traces",
            info: "Like the real board, the traces and silkscreen echo the chip's own floorplan, so you can see where the PLA, random logic and datapath are.",
          }));
        let ze = 1600,
          at = new ut(new te(0.022, 0.018, 0.008), U.plastic(1118481, 0.4), ze),
          Oe = new je(),
          rt = 7,
          oe = () => ((rt = (rt * 16807) % 2147483647), rt / 2147483647);
        for (let Pe = 0; Pe < ze; Pe++)
          (Oe.position.set(
            (oe() - 0.5) * (Ve - 0.2),
            0.05 + 0.1 + oe() * (Ke - 0.2),
            0.02,
          ),
            Oe.rotation.set(0, 0, oe() < 0.5 ? 0 : Math.PI / 2),
            Oe.updateMatrix(),
            at.setMatrixAt(Pe, Oe.matrix));
        (Se.add(at),
          D.part(at, {
            name: "Discrete MOSFETs (SOT-23, 3,218 on the real board)",
            info: "Each tiny package is one enhancement-mode n-channel MOSFET standing in for one transistor on the die (2N7002-class); on the real board some are in quad arrays. Pull-ups are resistors instead of depletion transistors.",
          }),
          (T = []),
          xb.forEach(([Pe, ge, Te], Ue) => {
            for (let De = 0; De < Te; De++)
              T.push({
                lab: Pe,
                key: ge,
                b: De,
                x: -0.95 + (Ue % 4) * 0.62 + (Te > 8 ? De % 8 : De) * 0.06,
                y: 0.35 + Math.floor(Ue / 4) * 0.3 + (Te > 8 && De >= 8 ? 0.08 : 0),
              });
          }));
        for (let Pe = 0; Pe < 313 - T.length; Pe++)
          T.push({
            lab: "control",
            key: "ctl",
            b: Pe,
            x: -1.05 + (Pe % 36) * 0.06,
            y: 1.75 + Math.floor(Pe / 36) * 0.13,
          });
        ((M = new ut(
          new Mt(0.017, 8, 6),
          new xt({ color: 16777215, toneMapped: !1 }),
          T.length,
        )),
          (A = new Float32Array(T.length)),
          T.forEach((Pe, ge) => {
            (Oe.position.set(Pe.x, 0.05 + Pe.y, 0.025),
              Oe.rotation.set(0, 0, 0),
              Oe.updateMatrix(),
              M.setMatrixAt(ge, Oe.matrix),
              M.setColorAt(ge, new Ae(0.15, 0.02, 0.02)));
          }),
          Se.add(M),
          D.part(M, {
            name: "Indicator LEDs (313, red)",
            info: "Registers A, X, Y, S, P, PCL, PCH, IR; data bus, address bus, ALU output, input latch DL, output register DOR and the internal SB/ADL/ADH buses light per bit (1 = lit). The remaining LEDs show control lines: they are driven by real node states only in transistor-level mode.",
            live: () =>
              d === "net"
                ? "transistor-level: every LED = a real netlist node"
                : "behavioural: register/bus LEDs live; control-line LEDs need transistor-level mode",
          }),
          Nt(
            D,
            "MOnSter-style 6502 · discrete NMOS logic",
            1.7,
            0.13,
            [0, 0.12, 0.012],
            { bg: "#101010", color: "#e0d0a0" },
            Se,
          ),
          D.box(0.5, 0.05, 0.18, se, [1.5, 0.085, 1.05], {
            name: "Clock & reset controller",
            info: 'Drives φ0 (the MOnSter needs ≤50 kHz; the chip ran at 1 MHz, later 2–3 MHz), RES and the memory emulation over a ribbon cable (the real board uses a 40-pin "ICR" connector to a host).',
          }),
          (k._tg = at),
          F(!0));
      },
      ui(D) {
        ((h.code = Ht(
          t,
          ($) => {
            ((t = $), L());
          },
          11,
        )),
          (h.err = q("div", { class: "err" })),
          (h.run = Fe(
            "▶ Run",
            () => {
              n = !n;
            },
            "pri",
          )),
          (h.regs = Pt([
            ["A", "A"],
            ["X", "X"],
            ["Y", "Y"],
            ["S", "S"],
            ["P", "P  NV-BDIZC"],
            ["PC", "PC"],
            ["IR", "IR"],
            ["cyc", "cycle"],
            ["ph", "phase"],
          ])),
          (h.busv = q("pre", {
            class: "term",
            style: { fontSize: "11px", maxHeight: "190px", overflow: "auto" },
          })),
          (h.note = q("div", { class: "small" })),
          (h.mem = q("pre", { class: "term", style: { fontSize: "11px" } })),
          (h.mode = q("div", { class: "small" })),
          (h.netBtn = Fe("⚡ Transistor-level: fetch visual6502 netlist", X)),
          (h.layerChecks = q(
            "div",
            { class: "row" },
            ...["diff", "buried", "poly", "via", "metal"].map(($) => {
              let Y = q("input", {
                type: "checkbox",
                checked: !0,
                onchange: (se) => {
                  S[$].mesh.visible = se.target.checked;
                },
              });
              return q("label", { class: "small" }, Y, " " + $);
            }),
            q(
              "label",
              { class: "small" },
              q("input", {
                type: "checkbox",
                checked: !0,
                onchange: ($) => {
                  y.visible = $.target.checked;
                },
              }),
              " blocks",
            ),
          )),
          D.append(
            Ie(
              "Program (6502 assembly, loaded at $0200; reset vector → $0200)",
              q(
                "div",
                { class: "row" },
                "Preset ",
                st(v1, v1[0], ($) => {
                  ((t = Ar[$]), (h.code.value = t), L());
                }),
              ),
              h.code,
              h.err,
            ),
            Ie(
              "Clock",
              q(
                "div",
                { class: "row" },
                h.run,
                Fe("½ step", () => {
                  ((n = !1), H(), le(!0));
                }),
                Fe("Cycle", () => {
                  ((n = !1), H(), H(), le(!0));
                }),
                Fe("Instruction", () => {
                  ((n = !1), ue(), le(!0));
                }),
                Fe("Reset", () => {
                  ((n = !1), F(), le(!0));
                }),
              ),
              We(
                "Clock",
                -0.5,
                6,
                0.01,
                Math.log10(s),
                ($) => (s = 10 ** $),
                ($) => {
                  let Y = 10 ** $;
                  return Y >= 1e6
                    ? (Y / 1e6).toFixed(2) + " MHz"
                    : Y >= 1e3
                      ? (Y / 1e3).toFixed(1) + " kHz"
                      : Y.toFixed(Y < 10 ? 2 : 0) + " Hz";
                },
              ),
              q(
                "div",
                { class: "small" },
                "Real chip: 1 MHz (6502A/B: 2/3 MHz). MOnSter 6502: ≈50 kHz max. Transistor-level mode in this browser: a few kHz.",
              ),
              h.regs,
              h.note,
            ),
            Ie(
              "Bus (each line = one half-cycle: φ1 drives the address, φ2 carries data)",
              h.busv,
            ),
            Ie(
              "Simulation level",
              q(
                "div",
                { class: "small" },
                "Default: a cycle-accurate behavioural model written for this lab (every documented dummy read/write; verified bus-cycle-identical to the visual6502 netlist on a 400-cycle test covering all addressing modes, BCD, BRK/RTI). Optional: the real 3,510-transistor netlist, solved switch by switch in your browser.",
              ),
              h.netBtn,
              h.mode,
              q("div", { class: "small" }, mb),
            ),
            Ie(
              "Die view",
              h.layerChecks,
              q(
                "div",
                { class: "row" },
                Fe("Open/close lid", () => {
                  k._lidOpen = !k._lidOpen;
                }),
                Fe("🔍 Die layers", () => k._fly && k._fly("die")),
                Fe("🔴 MOnSter board", () => k._fly && k._fly("board")),
              ),
              q(
                "div",
                { class: "small" },
                "Explode (toolbar) peels the five mask layers apart and lifts the lid. Procedural artwork in visual6502 colours; after loading the netlist the magnified die shows the REAL layout with live node states.",
              ),
            ),
            Ie("Memory $0000–$002F and $0200…", h.mem),
          ),
          L(),
          le(!0));
      },
      update(D) {
        if (n) {
          r += D * s * 2;
          let se = Math.min(Math.floor(r), d === "net" ? 400 : 2e5);
          if (((r -= se), d === "net")) {
            let he = performance.now();
            for (; se-- > 0 && performance.now() - he < 25;) H();
            r = Math.min(r, 4);
          } else for (; se-- > 0;) H();
        }
        let $ = k._lidOpen ? 1 : 0;
        ((k._lid = (k._lid || 0) + ($ - (k._lid || 0)) * Math.min(1, D * 4)),
          g &&
            (g.position.set(0, k._lid * 0.35, k._lid * 0.3),
            (g.rotation.x = -k._lid * 1.2)));
        let Y = performance.now();
        Y - P > (n ? 120 : 60) && ((P = Y), le(!1));
      },
    };
  function L() {
    ((e = Er(t, 512)),
      h.err &&
        (h.err.textContent = e.errors.join(`
`)),
      e.errors.length || F());
  }
  function z(D) {
    D.fill(0);
    for (let [$, Y] of e.bytes) D[$] = Y;
    ((D[65532] = 0), (D[65533] = 2), (D[65534] = 0), (D[65535] = 2));
  }
  function F(D) {
    (e || (e = Er(t, 512)),
      (i = new Xc()),
      z(i.mem),
      (i.sp = 0),
      (l = i.reset()),
      (c = []),
      (a = l.length - 1),
      (o = 1),
      (i.cycles = 0),
      d === "net" && u && (z(u.mem), u.init()));
  }
  function H() {
    (j(), K());
  }
  function j() {
    if (d === "net" && u) {
      u.halfStep();
      let D = {
        a: u.AB,
        d: u.DB,
        rw: u.RW ? 1 : 0,
        sync: u.SYNC ? 1 : 0,
        ph: u.CLK ? 2 : 1,
        note: u.SYNC ? "SYNC (opcode fetch)" : u.RW ? "read" : "write",
        blk: "",
        regs: { a: u.A, x: u.X, y: u.Y, s: u.S, p: u.P, pc: u.PC },
      };
      Me(D);
      return;
    }
    if (o === 0) {
      ((o = 1), Me({ ...l[a], ph: 2 }));
      return;
    }
    (a++,
      a >= l.length && (i.step(), (l = i.bus), (a = 0)),
      (o = 0),
      Me({ ...l[a], ph: 1 }));
  }
  function K() {
    let D = c[c.length - 1];
    D && hi("clock", { ph: D.ph === 2, w: D.rw === 0, min: 0.018, m: "m6502" });
  }
  function ue() {
    if (d === "net" && u) {
      let $ = 0;
      do (H(), $++);
      while ($ < 40 && !(u.SYNC && !u.CLK));
      return;
    }
    let D = i.instr;
    do H();
    while (!(a === l.length - 1 && o === 1) && i.instr <= D + 1);
  }
  function Me(D) {
    ((D.cyc = (c.length ? c[c.length - 1].cyc : 0) + (D.ph === 1 ? 1 : 0)),
      c.push(D),
      c.length > 400 && c.splice(0, c.length - 400));
    let $ = k.diag;
    $ &&
      Math.random() < 0.4 &&
      (D.sync
        ? $.pulse("db", "ir", "#ffb347", 2)
        : /alu/.test(D.blk)
          ? $.pulse("regs", "alu", "#ff7a1a", 2)
          : $.pulse("pc", "ab", "#58c4ff", 2));
  }
  let ee = () =>
    c[c.length - 1] || {
      a: 0,
      d: 0,
      rw: 1,
      ph: 1,
      regs: i ? i.snap() : { a: 0, x: 0, y: 0, s: 0, p: 0, pc: 0 },
      note: "reset",
      blk: "",
    };
  async function X() {
    if (d === "net") {
      ((d = "beh"),
        F(),
        (h.netBtn.textContent = "⚡ Transistor-level: fetch visual6502 netlist"),
        (h.mode.textContent = "Behavioural (cycle-accurate) model."),
        be());
      return;
    }
    if (!p) {
      ((p = !0),
        (h.mode.textContent =
          "Downloading segdefs.js, transdefs.js, nodenames.js from github.com/trebonian/visual6502 …"));
      try {
        ((f = f || (await gb())),
          (u = new k0(f)),
          (d = "net"),
          (n = !1),
          F(),
          (c = []),
          (h.mode.textContent = `Transistor level: ${f.transdefs.length} transistors, ${f.segdefs.length} layout polygons, ${u.nn} nodes. Each half-cycle re-solves every changed node group.`),
          (h.netBtn.textContent = "↩ Back to behavioural model"),
          (R = !1),
          be(),
          W());
      } catch (D) {
        ((x = String(D.message || D)),
          (h.mode.textContent =
            "Could not fetch the netlist (offline?): " +
            x +
            ". The behavioural model keeps running."));
      }
      ((p = !1), le(!0));
    }
  }
  function W() {
    let D = /^(a|x|y|s|p|pcl|pch|ir|notir|db|ab|alu|notalu|idl|dor|sb|adl|adh|dasb)\d$/;
    V = Object.entries(f.nodenames)
      .filter(([$]) => !D.test($) && !/^(vcc|vss)$/.test($))
      .map(([, $]) => $);
  }
  function G(D, $, Y) {
    let se = Y.regs || {};
    switch (D) {
      case "a":
        return (se.a >> $) & 1;
      case "x":
        return (se.x >> $) & 1;
      case "y":
        return (se.y >> $) & 1;
      case "s":
        return (se.s >> $) & 1;
      case "p":
        return (se.p >> $) & 1;
      case "pcl":
        return (se.pc >> $) & 1;
      case "pch":
        return (se.pc >> (8 + $)) & 1;
      case "ir":
        return ((k._ir ?? 0) >> $) & 1;
      case "db":
        return Y.ph === 2 ? (Y.d >> $) & 1 : 1;
      case "ab":
        return (Y.a >> $) & 1;
      case "alu":
        return /alu/.test(Y.blk) ? (se.a >> $) & 1 : 0;
      case "idl":
        return Y.rw && Y.ph === 2 ? (Y.d >> $) & 1 : 0;
      case "dor":
        return Y.rw ? 0 : (Y.d >> $) & 1;
      default:
        return 0;
    }
  }
  function le(D) {
    if (!i) return;
    let $ = ee();
    if (($.sync && $.ph === 2 ? (k._ir = $.d) : d === "net" && u && (k._ir = u.IR), M)) {
      let _e = new Ae();
      (T.forEach((Q, C) => {
        let I;
        if (d === "net" && u)
          if (Q.key === "ctl") I = u.state[V[Q.b % Math.max(1, V.length)]] || 0;
          else {
            let ie = Q.key === "ir" ? "notir" : Q.key,
              fe = f.nodenames[ie + Q.b];
            I = fe !== void 0 ? u.state[fe] ^ (Q.key === "ir" ? 1 : 0) : G(Q.key, Q.b, $);
          }
        else I = Q.key === "ctl" ? 0 : G(Q.key, Q.b, $);
        A[C] += ((I ? 1 : 0) - A[C]) * 0.6;
        let J = A[C];
        (_e.setRGB(0.12 + J * 4, 0.02 + J * 0.5, 0.02 + J * 0.25), M.setColorAt(C, _e));
      }),
        (M.instanceColor.needsUpdate = !0));
    }
    if ((Ee($), d === "net" && f && (D || Math.random() < 0.3) && re(), !h.regs)) return;
    let Y = $.regs || {},
      se = h.regs,
      he = (_e, Q = 2) => "$" + (_e >>> 0).toString(16).toUpperCase().padStart(Q, "0");
    if (
      (se.set("A", he(Y.a)),
      se.set("X", he(Y.x)),
      se.set("Y", he(Y.y)),
      se.set("S", he(Y.s)),
      se.set("P", (Y.p >>> 0).toString(2).padStart(8, "0")),
      se.set("PC", he(Y.pc, 4)),
      se.set("IR", he(k._ir ?? 0) + " " + (Fa[k._ir] || ["?"])[0]),
      se.set("cyc", $.cyc ?? 0),
      se.set("ph", $.ph === 1 ? "φ1 (address)" : "φ2 (data)"),
      (h.note.textContent =
        (d === "net" ? "[netlist] " : "") +
        ($.note || "") +
        ($.blk ? "  · blocks: " + $.blk : "")),
      D || n === !1 || Math.random() < 0.25)
    ) {
      h.busv.textContent = c
        .slice(-24)
        .map(
          (C) =>
            `${String(C.cyc).padStart(5)} φ${C.ph}  AB=${(C.a >>> 0).toString(16).toUpperCase().padStart(4, "0")}  ${C.ph === 2 ? "DB=" + (C.d >>> 0).toString(16).toUpperCase().padStart(2, "0") : "DB=--"}  ${C.rw ? "R" : "W"}${C.sync ? " SYNC" : "     "}  ${C.note || ""}`,
        ).join(`
`);
      let _e = d === "net" && u ? u.mem : i.mem,
        Q = "";
      for (let C = 0; C < 3; C++) {
        Q += he(C * 16, 4) + ": ";
        for (let I = 0; I < 16; I++)
          Q += _e[C * 16 + I].toString(16).padStart(2, "0") + " ";
        Q += `
`;
      }
      Q += "$0200: ";
      for (let C = 0; C < 16; C++) Q += _e[512 + C].toString(16).padStart(2, "0") + " ";
      h.mem.textContent = Q;
    }
  }
  function pe(D) {
    let $ = new Set((D.blk || "").split(" ").filter(Boolean));
    return (
      $.add("clk"),
      $.add("timing"),
      $.add("rcl"),
      $.add("pla"),
      D.sync && $.add("ir"),
      D.ph === 2 && D.rw && $.add("dl"),
      D.rw || $.add("dor"),
      $.add("ab"),
      $
    );
  }
  function Ee(D) {
    if (!b) return;
    let $ = b.ctx,
      Y = 1024,
      se = 1110;
    $.clearRect(0, 0, Y, se);
    let he = pe(D),
      _e = performance.now() / 1e3;
    for (let [I, [J, ie, fe, ne]] of Object.entries(Bi)) {
      let we = he.has(I);
      _[I] = (_[I] || 0) * 0.7 + (we ? 0.3 : 0);
      let ve = _[I];
      (($.fillStyle = `rgba(255,${(180 - ve * 60) | 0},${(70 + (1 - ve) * 80) | 0},${0.04 + ve * 0.26})`),
        $.fillRect(J * Y, ie * se, (fe - J) * Y, (ne - ie) * se),
        ($.strokeStyle = ve > 0.2 ? "#ffd27a" : "rgba(255,255,255,0.55)"),
        ($.lineWidth = 3),
        $.strokeRect(J * Y, ie * se, (fe - J) * Y, (ne - ie) * se),
        ($.fillStyle = "#fff"),
        ($.font = `bold ${I === "pla" || I === "rcl" ? 34 : 20}px ui-monospace,monospace`),
        ($.textAlign = "center"),
        $.fillText(Hy[I], ((J + fe) / 2) * Y, ie * se + 30, (fe - J) * Y - 6));
    }
    let Q = D.regs || {},
      C = {
        a: Q.a,
        x: Q.x,
        y: Q.y,
        s: Q.s,
        pcl: Q.pc & 255,
        pch: Q.pc >> 8,
        dl: D.rw && D.ph === 2 ? D.d : 0,
        dor: D.rw ? 0 : D.d,
        ab: D.a & 255,
      };
    for (let [I, J] of Object.entries(C)) {
      let [ie, fe, ne, we] = Bi[I];
      for (let ve = 0; ve < 8; ve++) {
        let Re = (J >> (7 - ve)) & 1;
        (($.fillStyle = Re ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.25)"),
          $.fillRect(
            ie * Y + 8,
            (fe + 0.035 + (ve * (we - fe - 0.04)) / 8) * se,
            (ne - ie) * Y - 16,
            ((we - fe - 0.04) / 8) * se * 0.6,
          ));
      }
    }
    b.tex.needsUpdate = !0;
  }
  function be() {
    for (let [D, $] of Object.entries(S)) {
      let Y = $.tex.ctx;
      if (d === "net" && f) {
        let se = { diff: [1, 2, 3, 4], poly: [5], metal: [0] };
        se[D]
          ? u0(Y, 1024, 1110, f.segdefs, se[D], null, null)
          : Y.clearRect(0, 0, 1024, 1110);
      } else Hs(Y, 1024, 1110, D);
      $.tex.tex.needsUpdate = !0;
    }
    (d === "net" && f
      ? u0(v.ctx, 512, 560, f.segdefs, [1, 2, 3, 4, 5, 0], null, "#000")
      : Hs(v.ctx, 512, 560, "all", { bg: "#14121c" }),
      (v.tex.needsUpdate = !0));
  }
  function re() {
    let D = S.metal;
    if (!D || !u) return;
    let $ = D.tex.ctx;
    (u0($, 1024, 1110, f.segdefs, [0], u.state, null), (D.tex.tex.needsUpdate = !0));
  }
  function de() {
    let D = E.ctx,
      $ = 1024,
      Y = 1280;
    ((D.fillStyle = "#0b0d0c"),
      D.fillRect(0, 0, $, Y),
      (D.globalAlpha = 0.5),
      Hs(D, $, Y, "all"),
      (D.globalAlpha = 1),
      (D.fillStyle = "#d8d0b0"),
      (D.font = "bold 40px ui-monospace,monospace"),
      (D.textAlign = "left"),
      D.fillText("MOnSter-style 6502", 40, 60),
      (D.font = "22px ui-monospace,monospace"),
      D.fillText("discrete NMOS · resistor pull-ups · LED = node state", 40, 92),
      xb.forEach(([se], he) => {
        ((D.fillStyle = "#f0e6c8"), (D.font = "bold 20px ui-monospace,monospace"));
        let _e = $ * (0.5 + (-0.95 + (he % 4) * 0.62 - 0.03) / 2.4),
          Q = Y * (1 - (0.05 + 0.35 + Math.floor(he / 4) * 0.3 + 0.05) / 3);
        D.fillText(se, _e, Q);
      }),
      D.fillText(
        "CONTROL LINES (transistor-level mode)",
        $ * (0.5 + -1.05 / 2.4),
        Y * (1 - (0.05 + 1.75 + 0.11) / 3),
      ),
      (E.tex.needsUpdate = !0));
  }
  return (
    (k.enter = (D) => {
      ((k._ctx = D),
        (k._fly = ($) => {
          let Y = window.LAB;
          if (!Y) return;
          let se = $ === "board" ? [w] : [S.metal.mesh],
            he =
              $ === "board"
                ? new N(0, 0.81, 0.58)
                    .applyQuaternion(w.getWorldQuaternion(new ai()))
                    .add(new N(0, 0.25, 0))
                : null;
          Y.flyToObjects(se, he);
        }));
    }),
    (k.sim = {
      get cpu() {
        return i;
      },
      get hist() {
        return c;
      },
      get mode() {
        return d;
      },
      get net() {
        return u;
      },
      cur: ee,
      half: H,
      layerPlanes: () => S,
    }),
    (k.isRunning = () => n),
    (k.test = () => {
      let D = (fe, ne = 60) => {
          let we = Er(fe, 512),
            ve = new Xc();
          for (let [He, Se] of we.bytes) ve.mem[He] = Se;
          ((ve.mem[65532] = 0), (ve.mem[65533] = 2), ve.reset());
          let Re = [];
          for (
            let He = 0;
            He < ne &&
            !(
              !ve.step() || (Re.push(ve.bus.length), ve.mn === "JMP" && ve.pc === ve.opPC)
            );
            He++
          );
          return { c: ve, cyc: Re };
        },
        $ = D(Ar["Self-test: 2 + 3"]),
        Y = D(Ar["Decimal mode (BCD) 19 + 28"]),
        se = D(Ar["Fibonacci in zero page"], 400),
        he = D(Ar["Stack, JSR/RTS, page-cross"]),
        _e = Er(Ar["Fibonacci in zero page"], 512),
        Q = new Uint8Array(65536);
      for (let [fe, ne] of _e.bytes) Q[fe] = ne;
      let C = new Sr(
        (fe) => Q[fe],
        (fe, ne) => {
          Q[fe] = ne;
        },
      );
      C.pc = 512;
      let I = 0;
      for (let fe = 0; fe < 400; fe++) {
        let ne = C.pc;
        if ((C.step(), C.pc === ne)) break;
      }
      I = C.cycles;
      let J = se.cyc.reduce((fe, ne) => fe + ne, 0),
        ie = {
          lda2_clc_adc3: $.c.a,
          cycles_2plus3: $.cyc.slice(0, 4),
          bcd_19_plus_28: "$" + Y.c.a.toString(16),
          fib_233: se.c.mem[44],
          page_cross_cycles_lda_absy: he.cyc[8],
          zp_matches_reference: [...Array(13)].every(
            (fe, ne) => se.c.mem[32 + ne] === Q[32 + ne],
          ),
          cycles_vs_reference: [J, I],
        };
      return (
        (ie.ok =
          ie.lda2_clc_adc3 === 5 &&
          ie.cycles_2plus3.join() === "2,2,2,3" &&
          ie.bcd_19_plus_28 === "$47" &&
          ie.fib_233 === 233 &&
          ie.page_cross_cycles_lda_absy === 5 &&
          ie.zp_matches_reference &&
          J === I),
        ie
      );
    }),
    k
  );
}
function S1() {
  let e = "mesh",
    t = "DFT (optical Fourier transform)",
    n = Ac[t](4),
    s = new wo(4),
    r = 0,
    o = 0,
    a = new Tc(4),
    l = Dm(),
    c = !1,
    h = [],
    d = [],
    u = new Na(),
    f = !1,
    p = 0,
    x = [],
    g,
    m,
    S,
    b = [],
    y,
    E = {},
    M = 0,
    T = 0,
    A,
    w = [],
    v,
    R = 0;
  {
    let X = Jn(5);
    a.params = a.params.map(() => X() * 2 * Math.PI);
    let W = Jn(2);
    u.phi.forEach((G) => G.forEach((le, pe) => (G[pe] = W() * 6.28)));
  }
  let _ = {
    id: "photonic",
    era: "NOW",
    short: "Photonic neural chip",
    group: "center",
    name: "Optical neural computing: silicon-photonic MZI mesh & diffractive network",
    blurb:
      "Light instead of electrons for the matrix multiplications at the heart of neural networks. A laser's light is split into waveguides, encoded with the input vector, and interfered in a mesh of Mach–Zehnder interferometers whose heater-tuned phases implement any unitary matrix (Reck 1994; Clements 2016). The multiply happens as the light flies through, in picoseconds and with almost no energy per operation; photodetectors read |amplitude|². Shen et al. (MIT, Nature Photonics 2017) ran vowel recognition on a 56-MZI chip; Lightmatter and others build commercial photonic accelerators and interconnects; UCLA's diffractive networks (Lin et al., Science 2018) compute with 3D-printed phase layers. Here every photon path is a real complex-amplitude simulation: program the mesh to a target matrix, train a 4-class classifier in situ, or train a diffractive network.",
    diagram: {
      nodes: [
        {
          id: "laser",
          label: `Laser
1550 nm`,
          x: 0.08,
          y: 0.3,
          w: 0.13,
          color: "#ff5f5f",
        },
        {
          id: "mod",
          label: `Input
modulators`,
          x: 0.25,
          y: 0.3,
          w: 0.14,
          color: "#ffb347",
        },
        {
          id: "m1",
          label: `MZI mesh 1
(unitary U₁)`,
          x: 0.44,
          y: 0.3,
          w: 0.16,
          color: "#58c4ff",
        },
        {
          id: "nl",
          label: `Nonlinearity
(sat. absorber)`,
          x: 0.63,
          y: 0.3,
          w: 0.15,
          color: "#c08cff",
        },
        {
          id: "m2",
          label: `MZI mesh 2
(U₂)`,
          x: 0.8,
          y: 0.3,
          w: 0.13,
          color: "#58c4ff",
        },
        {
          id: "pd",
          label: `Ge photo-
detectors`,
          x: 0.8,
          y: 0.78,
          w: 0.15,
          color: "#5fe08a",
        },
        {
          id: "adc",
          label: "TIA + ADC",
          x: 0.58,
          y: 0.78,
          w: 0.13,
          color: "#9fb3c8",
        },
        {
          id: "host",
          label: `Host: training
loop`,
          x: 0.36,
          y: 0.78,
          w: 0.16,
          color: "#9fb3c8",
        },
        {
          id: "dac",
          label: `DACs →
heaters`,
          x: 0.14,
          y: 0.78,
          w: 0.14,
          color: "#ffe08a",
        },
      ],
      edges: [
        ["laser", "mod", "CW light"],
        ["mod", "m1", "x"],
        ["m1", "nl"],
        ["nl", "m2"],
        ["m2", "pd", "|y|²"],
        ["pd", "adc"],
        ["adc", "host"],
        ["host", "dac", "θ, φ"],
        ["dac", "m1"],
        ["dac", "mod"],
      ],
    },
    build(X) {
      let W = U.pcb(1255754),
        G = U.plastic(3814736, 0.25),
        le = U.gold();
      (X.box(5.2, 0.08, 3, W, [0, 0.04, 0], {
        name: "Control PCB (DACs, TIAs, ADCs, FPGA)",
        info: "Electronics around the photonic chip: one DAC channel per heater (here 2 × (12 MZI phases + 4 output phases) + 4 modulators), transimpedance amplifiers and ADCs for the photodiodes, and an FPGA/host link for the training loop.",
      }),
        X.box(2.7, 0.12, 1.5, U.ceramic(), [0, 0.14, 0.2], {
          name: "Thermo-electric cooler (TEC)",
          info: "Keeps the whole chip at a fixed temperature: silicon's refractive index changes by ≈1.8×10⁻⁴ per kelvin, so ambient drift would detune every interferometer.",
        }),
        (g = Bt(1024, 512)));
      let pe = new B(new te(2.5, 0.06, 1.25), [
        G,
        G,
        new et({
          map: g.tex,
          roughness: 0.25,
          metalness: 0.3,
          emissive: 16777215,
          emissiveMap: g.tex,
          emissiveIntensity: 0.9,
        }),
        G,
        G,
        G,
      ]);
      (pe.position.set(0, 0.23, 0.2),
        X.add(pe, {
          name: "Silicon-photonic chip: waveguide mesh",
          info: "220 nm silicon-on-insulator waveguides (≈500 nm wide) guide 1550 nm light by total internal reflection. The top view shows the light intensity flowing through two 4×4 Clements meshes: 6 MZIs each, arranged in 4 columns, then the photodetectors.",
          live: () =>
            e === "mesh"
              ? `fidelity to target ${r.toFixed(5)}`
              : e === "onn"
                ? `classifier accuracy ${(a.accuracy(l) * 100).toFixed(1)} %`
                : "diffractive mode (see the plates)",
        }));
      let Ee = s.mzis.length * 2 * 2;
      m = new ut(
        new te(0.07, 0.008, 0.025),
        new xt({ color: 16777215, toneMapped: !1 }),
        Ee,
      );
      let be = new je();
      S = [];
      for (let Y = 0; Y < 2; Y++)
        s.mzis.forEach((se, he) => {
          for (let _e = 0; _e < 2; _e++) {
            let [Q, C] = P(Y, se.col, se.m, _e);
            (be.position.set((Q - 0.5) * 2.5, 0.264, 0.2 + (C - 0.5) * 1.25),
              be.updateMatrix(),
              m.setMatrixAt(S.length, be.matrix),
              m.setColorAt(S.length, new Ae(0.3, 0.2, 0.05)),
              S.push({ L: Y, k: he, j: _e }));
          }
        });
      X.add(m, {
        name: "Thermo-optic phase shifters (TiN heaters)",
        info: "A resistive heater above each waveguide arm warms it by a few tens of kelvin; Δn ≈ 1.8×10⁻⁴/K × ΔT changes the optical phase by 2π·L·Δn/λ. The inner heater (θ) sets an MZI's split ratio, the outer one (φ) its output phase. Glow ∝ heater power. Each draws ~10–30 mW for a π shift in typical foundry designs.",
      });
      for (let Y = 0; Y < 4; Y++) {
        let se = new B(new te(0.08, 0.02, 0.1), U.glow(6283402, 0.05));
        (se.position.set(1.16, 0.27, 0.2 + (0.2 + Y * 0.2 - 0.5) * 1.25),
          X.add(se, {
            name: Y ? void 0 : "Germanium photodetectors (×4)",
            info: "Ge-on-Si photodiodes absorb 1550 nm light and produce a current ∝ optical power |y|². Square-law detection discards phase: the only nonlinearity that comes for free.",
          }),
          b.push(se));
      }
      let re = X.box(0.22, 0.12, 0.7, U.glass(13625599, 0.5), [-1.38, 0.27, 0.2], {
          name: "Fiber array (V-groove, edge coupling)",
          info: "A glass block holding fibres at 127 µm pitch, aligned and glued to the chip edge; spot-size converters taper the waveguides to match the ~10 µm fibre mode.",
        }),
        de = X.box(0.7, 0.28, 0.45, U.metal(10134445, 0.35), [-2, 0.22, -0.9], {
          name: "Laser source (1550 nm DFB, butterfly package)",
          info: "A narrow-linewidth continuous-wave laser. All channels must be mutually coherent (one laser, split on chip) so that the interference in the mesh is stable.",
        });
      ((y = new B(new Mt(0.035, 12, 8), U.glow(16724016, 2))),
        y.position.set(-1.62, 0.25, -0.9),
        X.add(y, {}),
        Dt(
          X,
          [
            [-1.62, 0.25, -0.9],
            [-1.45, 0.3, -0.6],
            [-1.6, 0.3, -0.2],
            [-1.5, 0.3, 0.2],
          ],
          0.02,
          16765952,
          {
            name: "Single-mode fibre (yellow jacket)",
            info: "Carries the laser light to the chip; on chip it is split into 4 paths, each with an MZ modulator that writes one input value as an amplitude.",
          },
        ),
        X.box(0.5, 0.06, 0.5, U.chip(), [1.65, 0.11, 0.9], {
          name: "TIA + ADC array",
          info: "Transimpedance amplifiers turn photocurrents into voltages; ADCs digitise them for the host.",
        }),
        X.box(0.6, 0.06, 0.6, U.chip(), [-0.4, 0.11, -1.05], {
          name: "Heater DAC array",
          info: "Multi-channel DACs drive the heater currents. Programming a matrix = writing a list of phases.",
        }),
        X.box(0.7, 0.06, 0.7, U.chip(), [0.6, 0.11, -1.05], {
          name: "FPGA / host interface",
          info: "Runs the calibration and the in-situ training loop: perturb a phase, measure the detectors, update.",
        }));
      for (let Y = 0; Y < 14; Y++) {
        let se = -1.1 + Y * 0.17;
        X.tube(
          [
            [se, 0.262, -0.42],
            [se, 0.36, -0.55],
            [se, 0.09, -0.7],
          ],
          0.006,
          le,
          {},
        );
      }
      let D = X.group([0, 0.08, -1], {});
      A = [];
      for (let Y = 0; Y < 3; Y++) {
        let se = Bt(256, 256);
        A.push(se);
        let he = new B(new te(0.02, 0.62, 0.62), [
          new et({ map: se.tex, roughness: 0.6 }),
          new et({ map: se.tex, roughness: 0.6 }),
          U.plastic(14538956),
          U.plastic(14538956),
          U.plastic(14538956),
          U.plastic(14538956),
        ]);
        (he.position.set(1.7 + Y * 0.3, 0.55, -1),
          X.add(he, {
            name: Y ? void 0 : "Diffractive layers (3D-printed phase plates)",
            info: "D²NN after Lin et al., Science 361, 1004 (2018): each pixel of a 3D-printed plate delays the wave by its thickness (here 64 phase pixels in 1-D). Trained phase patterns route each input pattern's light to its own detector region. Their THz version used 0.4 THz (λ ≈ 0.75 mm); the same physics works for visible light at nanometre scale.",
          }),
          w.push(he));
      }
      v = Bt(512, 128);
      let $ = new B(
        new mt(1.4, 0.62),
        new xt({
          map: v.tex,
          transparent: !0,
          toneMapped: !1,
          side: fi,
          depthWrite: !1,
        }),
      );
      ($.position.set(2, 0.55, -1),
        X.add($, {
          name: "Simulated wave field in the D²NN (intensity)",
          info: "Intensity of the wave as it propagates (left → right) through the three trained layers to the four detector regions; Rayleigh–Sommerfeld diffraction between layers.",
        }),
        X.box(0.12, 0.2, 0.2, U.metal(12106946), [1.38, 0.55, -1], {
          name: "THz source & input mask",
          info: "Illuminates the input pattern (one of four bar codes).",
        }),
        X.box(0.04, 0.62, 0.62, U.plastic(2105376), [2.72, 0.55, -1], {
          name: "Detector plane (4 regions)",
          info: "The class is the region that receives the most energy.",
        }));
      for (let Y of [-1.3, -0.7])
        X.box(1.5, 0.03, 0.03, U.metal(9278363), [2.05, 0.24, Y], {});
      (Nt(
        X,
        "SIMULATED · after Shen et al. 2017 (MZI mesh) and Lin et al. 2018 (diffractive)",
        2.4,
        0.1,
        [0, 0.081, 1.35],
        { bg: "#0d1520", color: "#8fe3ff", rot: [-Math.PI / 2, 0, 0] },
      ),
        V(),
        j(0),
        K());
    },
    ui(X) {
      ((E.mode = st(
        [
          "Programmable mesh (unitary)",
          "Optical neural network (classifier)",
          "Diffractive network (D²NN)",
        ],
        "Programmable mesh (unitary)",
        (G) => {
          ((e = G.startsWith("Prog") ? "mesh" : G.startsWith("Opt") ? "onn" : "d2"), z());
        },
      )),
        (E.fid = q("div", { class: "small" })),
        (E.mat = It(150)),
        (E.ph = q("div")),
        (E.out = q("pre", { class: "term", style: { fontSize: "11px" } })),
        (E.tsel = st(Object.keys(Ac), t, (G) => {
          ((t = G), (n = Ac[G](4)), V());
        })),
        (E.port = st(["1", "2", "3", "4"], "1", (G) => {
          o = +G - 1;
        })));
      let W = [];
      (s.mzis.forEach((G, le) => {
        (W.push(
          We(
            `MZI ${le + 1} θ`,
            0,
            6.2832,
            0.001,
            G.th,
            (pe) => {
              ((G.th = pe), (r = Va(n, s.unitary())));
            },
            (pe) => (pe / Math.PI).toFixed(3) + "π",
          ),
        ),
          W.push(
            We(
              `MZI ${le + 1} φ`,
              0,
              6.2832,
              0.001,
              G.ph,
              (pe) => {
                ((G.ph = pe), (r = Va(n, s.unitary())));
              },
              (pe) => (pe / Math.PI).toFixed(3) + "π",
            ),
          ));
      }),
        s.out.forEach((G, le) =>
          W.push(
            We(
              `out φ${le + 1}`,
              0,
              6.2832,
              0.001,
              s.out[le],
              (pe) => {
                ((s.out[le] = pe), (r = Va(n, s.unitary())));
              },
              (pe) => (pe / Math.PI).toFixed(3) + "π",
            ),
          ),
        ),
        (E.sliders = W),
        E.ph.append(...W),
        (E.boxMesh = Ie(
          "Programmable 4×4 mesh: edit the heaters, or program a target",
          q(
            "div",
            { class: "row" },
            "Target ",
            E.tsel,
            Fe("⚙ Program mesh to target", V, "pri"),
            Fe("Scramble", () => {
              let G = Jn(Date.now() & 65535);
              ((s.params = s.params.map(() => G() * 6.28)),
                k(),
                (r = Va(n, s.unitary())));
            }),
          ),
          E.fid,
          q("div", { class: "row" }, "Light into port ", E.port),
          E.mat,
          q(
            "details",
            {},
            q("summary", {}, "12 MZI phases (θ split, φ phase) + 4 output phases"),
            E.ph,
          ),
        )),
        (E.acc = q("div", { class: "small" })),
        (E.plot = It(120)),
        (E.run = Fe(
          "▶ Train in situ",
          () => {
            c = !c;
          },
          "pri",
        )),
        (E.boxOnn = Ie(
          "Optical neural network: 4 features → mesh U₁ → saturable absorber → mesh U₂ → 4 detectors",
          q(
            "div",
            { class: "row" },
            E.run,
            Fe("Re-initialise", () => {
              let G = Jn(Date.now() & 65535);
              ((a.params = a.params.map(() => G() * 6.28)),
                (a._adam = null),
                (h = []),
                (d = []));
            }),
          ),
          q(
            "label",
            { class: "small" },
            q("input", {
              type: "checkbox",
              checked: !0,
              onchange: (G) => {
                a.nonlin = G.target.checked;
              },
            }),
            " optical nonlinearity between the meshes (Shen et al. simulated it in software too)",
          ),
          E.acc,
          E.plot,
          q(
            "div",
            { class: "small" },
            "Data: 120 samples of 4 classes with 4 features (a stand-in for Shen et al.'s 4 vowels × 4 log-area-ratio features; they reported 76.7 % on chip vs 91.7 % on a digital computer). Training perturbs each phase, measures the loss change (as heaters + detectors would), and takes an Adam step.",
          ),
        )),
        (E.d2acc = q("div", { class: "small" })),
        (E.d2plot = It(110)),
        (E.d2run = Fe(
          "▶ Train D²NN",
          () => {
            f = !f;
          },
          "pri",
        )),
        (E.boxD2 = Ie(
          "Diffractive network: 3 phase layers × 64 pixels, 4 input patterns → 4 detector regions",
          q(
            "div",
            { class: "row" },
            E.d2run,
            Fe("Re-initialise", () => {
              let G = Jn(Date.now() & 65535);
              (u.phi.forEach((le) => le.forEach((pe, Ee) => (le[Ee] = G() * 6.28))),
                (x = []),
                K());
            }),
            "Input ",
            st(["pattern 0", "pattern 1", "pattern 2", "pattern 3"], "pattern 0", (G) => {
              ((p = +G.slice(-1)), K());
            }),
          ),
          E.d2acc,
          E.d2plot,
          q(
            "div",
            { class: "small" },
            "Gradient by back-propagating the optical field (adjoint method). Lin et al. trained 5 layers × 200×200 pixels in a computer, 3D-printed them, and classified handwritten digits with the physical plates at 0.4 THz.",
          ),
        )),
        X.append(
          Ie("Mode", E.mode),
          E.boxMesh,
          E.boxOnn,
          E.boxD2,
          Ie("Detector readout", E.out),
        ),
        z(),
        k());
    },
    update(X, W) {
      if (((T += X), (c || f) && hi("heater", { min: 0.11, m: "photonic" }), c)) {
        let le = a.train(l, 1);
        (d.push(le), h.push(a.accuracy(l)), d.length > 300 && (d.shift(), h.shift()));
      }
      if (f) {
        let le = u.train(2, 0.4);
        (x.push(le), x.length > 300 && x.shift(), K());
      }
      Math.floor(T * 1.5) !== M &&
        ((M = Math.floor(T * 1.5)),
        hi("photon", { f: [1, 1.25, 1.5, 2][M % 4], m: "photonic", min: 0.3 }));
      let G = performance.now();
      (G - R > 90 && ((R = G), j(T), Me()),
        (y.material.emissiveIntensity = 2 + 0.3 * Math.sin(T * 20)));
    },
  };
  function P(X, W, G, le) {
    let pe = X ? 0.53 : 0.12,
      Ee = X ? 0.86 : 0.45,
      be = (Ee - pe) / 4;
    return [pe + (W + (le ? 0.85 : 0.5)) * be, 0.2 + (G + 0.5) * 0.2 + -0.05];
  }
  function V() {
    ((r = s.fit(n)), k());
  }
  function k() {
    if (!E.sliders) return;
    let X = [];
    (s.mzis.forEach((W) => X.push(W.th, W.ph)),
      X.push(...s.out),
      E.sliders.forEach((W, G) => {
        let le = W.querySelector("input");
        ((le.value = ((X[G] % 6.2832) + 6.2832) % 6.2832),
          (W.querySelector(".v").textContent = (le.value / Math.PI).toFixed(3) + "π"));
      }));
  }
  function L() {}
  function z() {
    E.boxMesh &&
      ((E.boxMesh.style.display = e === "mesh" ? "" : "none"),
      (E.boxOnn.style.display = e === "onn" ? "" : "none"),
      (E.boxD2.style.display = e === "d2" ? "" : "none"));
  }
  function F() {
    return e === "onn"
      ? Rc(l.X[M % l.X.length])
      : Array.from({ length: 4 }, (X, W) => Tt(W === o ? 1 : 0));
  }
  function H() {
    let X = [],
      W = [],
      G;
    if (e === "onn") G = a.forward(l.X[M % l.X.length], X, W);
    else {
      G = s.apply(F(), X).map(Ln);
      for (let pe = 0; pe <= 4; pe++) W.push(G);
    }
    return { t1: X, t2: W, out: G };
  }
  function j(X) {
    if (!g) return;
    let W = g.ctx,
      G = 1024,
      le = 512;
    ((W.fillStyle = "#16121f"), W.fillRect(0, 0, G, le));
    let { t1: pe, t2: Ee, out: be } = H(),
      re = (Y) => (0.2 + Y * 0.2) * le,
      de = (Y, se, he, _e, Q) => {
        if (
          ((W.strokeStyle = `rgba(${(80 + 175 * Math.min(1, Q)) | 0},${(40 + 60 * Math.min(1, Q)) | 0},${(60 + 40 * Math.min(1, Q)) | 0},1)`),
          (W.lineWidth = 2 + 5 * Math.sqrt(Math.min(1, Q))),
          W.beginPath(),
          W.moveTo(Y, he),
          W.bezierCurveTo((Y + se) / 2, he, (Y + se) / 2, _e, se, _e),
          W.stroke(),
          Q > 0.02)
        ) {
          W.fillStyle = `rgba(255,${(200 + 55 * Math.min(1, Q)) | 0},200,${Math.min(1, Q)})`;
          for (let C = 0; C < 3; C++) {
            let I = (X * 0.9 + C / 3 + (Y / G) * 3) % 1,
              J = Y + (se - Y) * I,
              ie = he + (_e - he) * (I * I * (3 - 2 * I));
            (W.beginPath(), W.arc(J, ie, 2 + 3 * Math.min(1, Q), 0, 7), W.fill());
          }
        }
      },
      D = e === "onn" ? F().map(Ln) : pe[0];
    for (let Y = 0; Y < 4; Y++)
      (de(0 * G, 0.05 * G, le * 0.5, re(Y), 0.25),
        de(0.05 * G, 0.12 * G, re(Y), re(Y), D[Y]),
        (W.fillStyle = "#c9a24a"),
        W.fillRect(0.07 * G, re(Y) - 12, 0.03 * G, 6));
    let $ = (Y, se, he, _e, Q) => {
      let C = (_e - he) / 4;
      for (let I = 0; I < 4; I++) {
        let J = se[I],
          ie = se[I + 1],
          fe = new Set();
        for (let ne of s.mzis)
          if (ne.col === I) {
            (fe.add(ne.m), fe.add(ne.m + 1));
            let we = he + I * C,
              ve = we + C,
              Re = re(ne.m),
              He = re(ne.m + 1),
              Se = (Re + He) / 2,
              Ve = (J[ne.m] + J[ne.m + 1]) / 2,
              Ke = (ie[ne.m] + ie[ne.m + 1]) / 2;
            (de(we, we + C * 0.25, Re, Se - 4, J[ne.m] * Q),
              de(we, we + C * 0.25, He, Se + 4, J[ne.m + 1] * Q),
              de(we + C * 0.25, we + C * 0.35, Se - 4, Re + 18, Ve * Q),
              de(we + C * 0.25, we + C * 0.35, Se + 4, He - 18, Ve * Q),
              de(we + C * 0.35, we + C * 0.6, Re + 18, Re + 18, Ve * Q),
              de(we + C * 0.35, we + C * 0.6, He - 18, He - 18, Ve * Q),
              de(we + C * 0.6, we + C * 0.72, Re + 18, Se - 4, Ke * Q),
              de(we + C * 0.6, we + C * 0.72, He - 18, Se + 4, Ke * Q),
              de(we + C * 0.72, ve, Se - 4, Re, ie[ne.m] * Q),
              de(we + C * 0.72, ve, Se + 4, He, ie[ne.m + 1] * Q),
              (W.strokeStyle = "#d4a537"),
              (W.lineWidth = 3),
              W.strokeRect(we + C * 0.4, Re + 10, C * 0.16, 4),
              W.strokeRect(we + C * 0.78, Re - 10, C * 0.14, 4));
          }
        for (let ne = 0; ne < 4; ne++)
          fe.has(ne) || de(he + I * C, he + (I + 1) * C, re(ne), re(ne), J[ne] * Q);
      }
    };
    $(0, pe, 0.12 * G, 0.45 * G, 1);
    for (let Y = 0; Y < 4; Y++)
      (de(0.45 * G, 0.53 * G, re(Y), re(Y), e === "onn" ? Ee[0][Y] : pe[4][Y]),
        (W.fillStyle = e === "onn" && a.nonlin ? "#8a5cc0" : "#3a3050"),
        W.fillRect(0.48 * G, re(Y) - 8, 0.02 * G, 16));
    $(1, Ee, 0.53 * G, 0.86 * G, e === "onn" ? 1 : 0.35);
    for (let Y = 0; Y < 4; Y++)
      (de(0.86 * G, 0.96 * G, re(Y), re(Y), be[Y]),
        (W.fillStyle = `rgb(${(40 + 200 * Math.min(1, be[Y])) | 0},${(120 + 135 * Math.min(1, be[Y])) | 0},90)`),
        W.fillRect(0.955 * G, re(Y) - 14, 0.03 * G, 28));
    if (
      ((W.fillStyle = "#8fa3c0"),
      (W.font = "bold 22px ui-monospace,monospace"),
      W.fillText("MESH 1 (U₁)", 0.2 * G, 28),
      W.fillText(e === "onn" ? "MESH 2 (U₂)" : "MESH 2 (bypassed)", 0.6 * G, 28),
      W.fillText("NL", 0.475 * G, le - 18),
      W.fillText("PD", 0.955 * G, le - 18),
      (g.tex.needsUpdate = !0),
      b.forEach(
        (Y, se) => (Y.material.emissiveIntensity = 0.05 + 3 * Math.min(1, be[se])),
      ),
      m)
    ) {
      let Y = new Ae();
      (S.forEach((se, he) => {
        let _e = (se.L ? (e === "onn" ? a.L2 : s) : e === "onn" ? a.L1 : s).mzis[se.k],
          C = ((((se.j ? _e.ph : _e.th) % 6.2832) + 6.2832) % 6.2832) / 6.2832,
          I = se.L && e !== "onn" ? 0.2 : 1;
        (Y.setRGB((0.25 + 3.2 * C) * I, (0.08 + 1.1 * C * C) * I, 0.03),
          m.setColorAt(he, Y));
      }),
        (m.instanceColor.needsUpdate = !0));
    }
    _._out = be;
  }
  function K() {
    if (!A) return;
    A.forEach((de, D) => {
      let $ = de.ctx;
      for (let Y = 0; Y < 64; Y++) {
        let se = (((u.phi[D][Y] % 6.2832) + 6.2832) % 6.2832) / 6.2832;
        (($.fillStyle = `rgb(${(200 + 50 * se) | 0},${(190 + 50 * se) | 0},${(170 + 60 * se) | 0})`),
          $.fillRect(0, Y * 4, 256, 4),
          ($.fillStyle = `rgba(0,0,0,${0.5 * (1 - se)})`),
          $.fillRect(0, Y * 4, 256, 4));
      }
      de.tex.needsUpdate = !0;
    });
    let X = v.ctx,
      W = 512,
      G = 128;
    X.clearRect(0, 0, W, G);
    let le = {},
      pe = u.forward(ue(p), le),
      Ee = [...le.a, pe],
      be = Ee.length,
      re = 1e-9;
    (Ee.forEach((de) => de.forEach((D) => (re = Math.max(re, Ln(D))))),
      Ee.forEach((de, D) => {
        for (let $ = 0; $ < 64; $++) {
          let Y = Math.sqrt(Ln(de[$]) / re);
          ((X.fillStyle = `rgba(${(120 + 135 * Y) | 0},${(60 + 150 * Y) | 0},255,${Y})`),
            X.fillRect((D * W) / be, G - (($ + 1) * G) / 64, W / be - 2, G / 64 + 0.5));
        }
      }),
      (v.tex.needsUpdate = !0),
      (_._d2E = u.energies(pe)));
  }
  let ue = (X) => Na.pattern(X, u.N);
  function Me() {
    if (!E.out) return;
    let X = _._out || [0, 0, 0, 0];
    if (
      ((E.out.textContent =
        e === "d2"
          ? "D²NN detector energies: " +
            (_._d2E || []).map((W) => W.toExponential(2)).join("  ")
          : X.map(
              (W, G) =>
                `PD${G + 1}: ${"█".repeat(Math.round(W * 30)).padEnd(30, "·")} ${(W * 100).toFixed(1)} %`,
            ).join(`
`) +
            (e === "onn"
              ? `
sample ${M % l.X.length}: true class ${l.Y[M % l.X.length]}, predicted ${X.indexOf(Math.max(...X))}`
              : "")),
      e === "mesh")
    ) {
      E.fid.textContent = `Fidelity |Tr(U†_target·U)|²/N² = ${r.toFixed(6)}  (1 = exact up to a global phase)`;
      let W = yt(E.mat),
        G = E.mat.width,
        le = E.mat.height;
      (W.setTransform(1, 0, 0, 1, 0, 0),
        (W.fillStyle = "#0b1118"),
        W.fillRect(0, 0, G, le));
      let pe = s.unitary(),
        Ee = Math.min(G / 2 - 30, le - 30) / 4;
      [
        [n, "target |U|"],
        [pe, "mesh |U|"],
      ].forEach(([be, re], de) => {
        let D = 10 + de * (G / 2);
        ((W.fillStyle = "#9fb3c8"),
          (W.font = "12px ui-monospace,monospace"),
          W.fillText(re, D, 14));
        for (let $ = 0; $ < 4; $++)
          for (let Y = 0; Y < 4; Y++) {
            let se = be[$][Y],
              he = Math.sqrt(Ln(se)),
              _e = Math.atan2(se.im, se.re);
            ((W.fillStyle = `hsl(${((_e / Math.PI) * 180 + 360) % 360},80%,${10 + he * 55}%)`),
              W.fillRect(D + Y * Ee, 22 + $ * Ee, Ee - 2, Ee - 2));
          }
      });
    }
    if (e === "onn") {
      let W = a.accuracy(l);
      ((E.acc.textContent = `accuracy ${(W * 100).toFixed(1)} %  (chance 25 %) · loss ${(d.at(-1) ?? a.loss(l)).toFixed(3)} · ${d.length} steps`),
        ee(E.plot, [
          [h, "#5fe08a", 1],
          [d.map((G) => G / 2.5), "#ffb347", 1],
        ]),
        (E.run.textContent = c ? "❚❚ Pause" : "▶ Train in situ"));
    }
    e === "d2" &&
      ((E.d2acc.textContent = `accuracy on the 4 patterns: ${(u.accuracy() * 100).toFixed(0)} % · loss ${(x.at(-1) ?? 0).toFixed(3)}`),
      ee(E.d2plot, [[x.map((W) => W / 3), "#ffb347", 1]]),
      (E.d2run.textContent = f ? "❚❚ Pause" : "▶ Train D²NN"));
  }
  function ee(X, W) {
    let G = yt(X),
      le = X.width,
      pe = X.height;
    (G.setTransform(1, 0, 0, 1, 0, 0),
      (G.fillStyle = "#0b1118"),
      G.fillRect(0, 0, le, pe));
    for (let [Ee, be] of W)
      Ee.length &&
        ((G.strokeStyle = be),
        (G.lineWidth = 2),
        G.beginPath(),
        Ee.forEach((re, de) => {
          let D = (de / Math.max(1, Ee.length - 1)) * le,
            $ = pe - Math.min(1, Math.max(0, re)) * (pe - 6) - 3;
          de ? G.lineTo(D, $) : G.moveTo(D, $);
        }),
        G.stroke());
  }
  return (
    (_.sim = {
      get mesh() {
        return s;
      },
      get onn() {
        return a;
      },
      get d2() {
        return u;
      },
      get mode() {
        return e;
      },
      get fid() {
        return r;
      },
      get target() {
        return n;
      },
      get tName() {
        return t;
      },
      traces: H,
      get out() {
        return _._out;
      },
      D: l,
    }),
    (_.isRunning = () => c || f || !0),
    (_.test = () => {
      let X = new wo(4),
        W = {};
      for (let D of [
        "DFT (optical Fourier transform)",
        "Hadamard H⊗H",
        "Swap neighbours (cross state)",
      ])
        W["fidelity_" + D.split(" ")[0]] = +X.fit(Ac[D](4)).toFixed(6);
      let G = X.unitary(),
        le = 0;
      for (let D = 0; D < 4; D++)
        for (let $ = 0; $ < 4; $++) {
          let Y = 0,
            se = 0;
          for (let he = 0; he < 4; he++)
            ((Y += G[he][D].re * G[he][$].re + G[he][D].im * G[he][$].im),
              (se += G[he][D].re * G[he][$].im - G[he][D].im * G[he][$].re));
          le = Math.max(le, Math.abs(Y - (D === $ ? 1 : 0)) + Math.abs(se));
        }
      W.unitarity_err = +le.toExponential(2);
      let pe = new Tc(4),
        Ee = Jn(5);
      pe.params = pe.params.map(() => Ee() * 6.28);
      let be = Dm();
      for (let D = 0; D < 60; D++) pe.train(be, 1);
      W.onn_accuracy = +pe.accuracy(be).toFixed(3);
      let re = new Na(),
        de = Jn(2);
      re.phi.forEach((D) => D.forEach(($, Y) => (D[Y] = de() * 6.28)));
      for (let D = 0; D < 40; D++) re.train(1, 0.5);
      return (
        (W.d2nn_accuracy = re.accuracy()),
        (W.ok =
          Object.entries(W)
            .filter(([D]) => D.startsWith("fidelity"))
            .every(([, D]) => D > 0.999) &&
          le < 1e-9 &&
          W.onn_accuracy > 0.5 &&
          W.d2nn_accuracy > 0.25),
        W
      );
    }),
    _
  );
}
var U0 = {
    "Coral growth": [0.0545, 0.062],
    "Mitosis (self-replicating spots)": [0.0367, 0.0649],
    "Fingerprints / labyrinth": [0.037, 0.06],
    "Solitons (moving spots)": [0.03, 0.062],
    Worms: [0.078, 0.061],
    "Spiral chaos": [0.014, 0.045],
    "Holes / bubbles": [0.039, 0.058],
  },
  Zc = class {
    constructor(e = 96, t = 96, n = 0.0545, s = 0.062, r = 0.2097, o = 0.105) {
      (Object.assign(this, { W: e, H: t, F: n, k: s, Du: r, Dv: o }),
        (this.u = new Float32Array(e * t).fill(1)),
        (this.v = new Float32Array(e * t)),
        (this.t = 0));
    }
    seed(e, t, n = 4, s = Math.random) {
      for (let r = -n; r <= n; r++)
        for (let o = -n; o <= n; o++) {
          let a = ((t + r + this.H) % this.H) * this.W + ((e + o + this.W) % this.W);
          ((this.u[a] = 0.5), (this.v[a] = 0.25 + 0.02 * s()));
        }
    }
    step(e = 1) {
      let { W: t, H: n, F: s, k: r, Du: o, Dv: a } = this;
      for (let l = 0; l < e; l++) {
        let c = this.u,
          h = this.v,
          d = new Float32Array(t * n),
          u = new Float32Array(t * n);
        for (let f = 0; f < n; f++) {
          let p = ((f - 1 + n) % n) * t,
            x = f * t,
            g = ((f + 1) % n) * t;
          for (let m = 0; m < t; m++) {
            let S = (m - 1 + t) % t,
              b = (m + 1) % t,
              y = x + m,
              E =
                0.2 * (c[x + S] + c[x + b] + c[p + m] + c[g + m]) +
                0.05 * (c[p + S] + c[p + b] + c[g + S] + c[g + b]) -
                c[y],
              M =
                0.2 * (h[x + S] + h[x + b] + h[p + m] + h[g + m]) +
                0.05 * (h[p + S] + h[p + b] + h[g + S] + h[g + b]) -
                h[y],
              T = c[y] * h[y] * h[y];
            ((d[y] = c[y] + (o * 4 * E - T + s * (1 - c[y]))),
              (u[y] = h[y] + (a * 4 * M + T - (s + r) * h[y])));
          }
        }
        ((this.u = d), (this.v = u), this.t++);
      }
    }
    stats() {
      let e = 0,
        t = 0,
        n = 0;
      for (let s of this.v) ((e = Math.max(e, s)), s > 0.2 && t++, (n += s));
      return { maxV: e, area: t / this.v.length, meanV: n / this.v.length };
    }
  };
function E1(i = 10, e = 10, t = 5) {
  let n = t >>> 0 || 1,
    s = () => (
      (n ^= n << 13),
      (n >>>= 0),
      (n ^= n >> 17),
      (n ^= n << 5),
      (n >>>= 0),
      n / 4294967296
    ),
    r = i * 2 + 1,
    o = e * 2 + 1,
    a = new Uint8Array(r * o).fill(1),
    l = [[0, 0]],
    c = new Uint8Array(i * e);
  for (c[0] = 1, a[r + 1] = 0; l.length;) {
    let [h, d] = l[l.length - 1],
      u = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]
        .map(([x, g]) => [h + x, d + g])
        .filter(([x, g]) => x >= 0 && g >= 0 && x < i && g < e && !c[g * i + x]);
    if (!u.length) {
      l.pop();
      continue;
    }
    let [f, p] = u[Math.floor(s() * u.length)];
    ((c[p * i + f] = 1),
      (a[(2 * p + 1) * r + 2 * f + 1] = 0),
      (a[(d + p + 1) * r + h + f + 1] = 0),
      l.push([f, p]));
  }
  for (let h = 0; h < (i * e) / 6; h++) {
    let d = 1 + Math.floor(s() * (r - 2)),
      u = 1 + Math.floor(s() * (o - 2));
    (d + u) % 2 === 1 && (a[u * r + d] = 0);
  }
  return { W: r, H: o, g: a, start: [1, 1], goal: [r - 2, o - 2] };
}
function w1(i) {
  let { W: e, H: t, g: n, start: s } = i,
    r = new Int32Array(e * t).fill(-1),
    o = [s[1] * e + s[0]];
  r[o[0]] = 0;
  for (let a = 0; a < o.length; a++) {
    let l = o[a],
      c = l % e,
      h = (l / e) | 0;
    for (let d of [l - 1, l + 1, l - e, l + e]) {
      let u = d % e,
        f = (d / e) | 0;
      d < 0 ||
        d >= e * t ||
        Math.abs(u - c) + Math.abs(f - h) !== 1 ||
        n[d] ||
        r[d] >= 0 ||
        ((r[d] = r[l] + 1), o.push(d));
    }
  }
  return r;
}
var Po = class {
    constructor(e, t = 5) {
      ((this.mz = e), (this.R = t));
      let n = e.W * e.H;
      ((this.s = new Uint8Array(n)),
        (this.arr = new Int32Array(n).fill(-1)),
        (this.t = 0),
        this.fire(e.start));
    }
    fire([e, t]) {
      let n = t * this.mz.W + e;
      !this.mz.g[n] &&
        this.s[n] === 0 &&
        ((this.s[n] = 1), this.arr[n] < 0 && (this.arr[n] = this.t));
    }
    step() {
      let { W: e, H: t, g: n } = this.mz,
        s = this.s,
        r = new Uint8Array(s.length);
      this.t++;
      for (let o = 0; o < t; o++)
        for (let a = 0; a < e; a++) {
          let l = o * e + a;
          if (n[l]) continue;
          let c = s[l];
          c === 0
            ? ((a > 0 && s[l - 1] === 1) ||
                (a < e - 1 && s[l + 1] === 1) ||
                (o > 0 && s[l - e] === 1) ||
                (o < t - 1 && s[l + e] === 1)) &&
              ((r[l] = 1), this.arr[l] < 0 && (this.arr[l] = this.t))
            : (r[l] = c >= this.R ? 0 : c + 1);
        }
      this.s = r;
    }
    get reached() {
      let [e, t] = this.mz.goal;
      return this.arr[t * this.mz.W + e] >= 0;
    }
    path() {
      let { W: e } = this.mz,
        [t, n] = this.mz.goal,
        s = n * e + t;
      if (this.arr[s] < 0) return null;
      let r = [s];
      for (; this.arr[s] > 0;) {
        let o = -1;
        for (let a of [s - 1, s + 1, s - e, s + e])
          if (
            a >= 0 &&
            a < this.arr.length &&
            this.arr[a] >= 0 &&
            this.arr[a] === this.arr[s] - 1 &&
            Math.abs((a % e) - (s % e)) + Math.abs(((a / e) | 0) - ((s / e) | 0)) === 1
          ) {
            o = a;
            break;
          }
        if (o < 0) break;
        ((s = o), r.push(s));
      }
      return r.reverse();
    }
  },
  OA = { k1: 5e5, k2: 5e5, kr: 1e6, leak: 2e-6 };
function BA(
  i,
  e,
  { G0: t = 1e-7, Rep0: n = 15e-8, hours: s = 3, dt: r = 2, k: o = OA } = {},
) {
  let a = i,
    l = e,
    c = t,
    h = 0,
    d = 0,
    u = n,
    f = 0,
    p = [],
    x = s * 3600,
    g = (S) => {
      let [b, y, E, M, T, A] = S,
        w = o.k1 * b * E,
        v = o.k2 * y * M,
        R = o.kr * T * A,
        _ = o.leak * E;
      return [-w, -v, -w - _, w - v, v + _ - R, -R, R];
    },
    m = [a, l, c, h, d, u, f];
  for (let S = 0; S <= x; S += r) {
    S % 60 === 0 && p.push({ t: S, F: m[6], O: m[4], GI: m[3] });
    let b = g(m),
      y = m.map((v, R) => v + (b[R] * r) / 2),
      E = g(y),
      M = m.map((v, R) => v + (E[R] * r) / 2),
      T = g(M),
      A = m.map((v, R) => v + T[R] * r),
      w = g(A);
    m = m.map((v, R) => Math.max(0, v + (r / 6) * (b[R] + 2 * E[R] + 2 * T[R] + w[R])));
  }
  return { F: m[6], frac: m[6] / n, trace: p };
}
function F0(i = 12e-8, e) {
  return [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ].map(([t, n]) => ({ a: t, b: n, ...BA(t * i, n * i, e) }));
}
var Si = 256,
  T1 =
    "in vec3 position; in vec2 uv; out vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }",
  zA = `precision highp float; uniform sampler2D prev; uniform vec2 res; uniform float F, K, Du, Dv; uniform vec3 brush; uniform int mapMode; in vec2 vUv; out vec4 o;
void main(){ vec2 p = 1.0 / res; vec2 c = texture(prev, vUv).xy;
  vec2 l = 0.2 * (texture(prev, vUv + vec2(p.x, 0.)).xy + texture(prev, vUv - vec2(p.x, 0.)).xy + texture(prev, vUv + vec2(0., p.y)).xy + texture(prev, vUv - vec2(0., p.y)).xy)
         + 0.05 * (texture(prev, vUv + p).xy + texture(prev, vUv - p).xy + texture(prev, vUv + vec2(p.x, -p.y)).xy + texture(prev, vUv + vec2(-p.x, p.y)).xy) - c;
  float f = F, k = K; if (mapMode == 1) { f = mix(0.01, 0.09, vUv.y); k = mix(0.045, 0.07, vUv.x); }
  float u = c.x, v = c.y, r = u * v * v; u += Du * 4.0 * l.x - r + f * (1.0 - u); v += Dv * 4.0 * l.y + r - (f + k) * v;
  if (brush.z > 0.0 && distance(vUv, brush.xy) < brush.z) { u = 0.5; v = 0.25; }
  if (distance(vUv, vec2(0.5)) > 0.49) { u = 1.0; v = 0.0; }
  o = vec4(clamp(u, 0., 1.), clamp(v, 0., 1.), 0., 1.); }`,
  qA =
    "precision highp float; uniform sampler2D src; in vec2 vUv; out vec4 o; void main(){ o = texture(src, vUv); }",
  HA = `precision highp float; uniform sampler2D tex; uniform vec2 res; uniform vec3 c0, c1, c2, c3; uniform float gain; in vec2 vUv; out vec4 o;
void main(){ vec2 p = 1.0 / res; float v = texture(tex, vUv).y, u = texture(tex, vUv).x; float vx = texture(tex, vUv + vec2(p.x, 0.)).y - texture(tex, vUv - vec2(p.x, 0.)).y, vy = texture(tex, vUv + vec2(0., p.y)).y - texture(tex, vUv - vec2(0., p.y)).y;
  float t = clamp(v * 2.6 * gain, 0., 1.); vec3 col = t < 0.33 ? mix(c0, c1, t / 0.33) : t < 0.66 ? mix(c1, c2, (t - 0.33) / 0.33) : mix(c2, c3, (t - 0.66) / 0.34);
  float shade = clamp(0.75 + 6.0 * (vx * 0.6 - vy * 0.8), 0.35, 1.5); col *= shade; col += c3 * pow(t, 6.0) * 0.6;
  float d = distance(vUv, vec2(0.5)); col *= smoothstep(0.5, 0.47, d); o = vec4(col, 1.0); }`,
  yb = {
    Bioluminescent: ["#02060d", "#073b4c", "#06d6a0", "#e8fff6"],
    "Ink & paper": ["#efe6d2", "#b8a98a", "#3b3027", "#0b0806"],
    "Coral reef": ["#1b0b1e", "#7a1f3d", "#ff7a5c", "#ffe3c2"],
    Nebula: ["#05010f", "#3a0ca3", "#f72585", "#fff1a8"],
    "Ferroin (BZ red/blue)": ["#a3261c", "#d9532b", "#3d64c9", "#e0ecff"],
  };
function A1() {
  let i = Object.keys(U0),
    e = i[0],
    [t, n] = U0[e],
    s = 10,
    r = 0,
    o = "Bioluminescent",
    a = 1,
    l = !0,
    c = "gs",
    h,
    d,
    u,
    f,
    p,
    x,
    g,
    m,
    S,
    b,
    y,
    E = new N(0, 0, 0),
    M = 0,
    T = 0,
    A,
    w,
    v,
    R = {},
    _,
    P,
    V,
    k = 0,
    L = 12,
    z = 0,
    F,
    H = [],
    j = null,
    K,
    ue = [],
    Me = !0,
    ee = 0,
    X = {
      id: "alife",
      era: "NOW",
      short: "Wet artificial life",
      group: "center",
      name: "Wet artificial life: reaction–diffusion, chemical-wave and DNA computing",
      blurb: `Computation without circuits. In a petri dish two chemicals that react and diffuse (Turing's 1952 morphogenesis idea; Gray–Scott model, Pearson 1993) grow spots, stripes, coral and self-replicating "cells" from nothing but local rules. Excitable Belousov–Zhabotinsky media carry chemical waves that solve mazes (Steinbock, Tóth & Showalter 1995) and form logic gates; DNA strands displace one another to compute AND/OR in a test tube (Seelig et al. 2006); xenobots (Kriegman et al. 2020) are living frog-cell machines designed by evolutionary algorithms. Here the dish is a live GPU simulation you can paint into and retune, the maze is solved by an excitable-medium wave, and the microfluidic chip runs a strand-displacement AND gate in droplets.`,
      diagram: {
        nodes: [
          {
            id: "pump",
            label: `Syringe
pumps`,
            x: 0.08,
            y: 0.25,
            w: 0.13,
            color: "#9fb3c8",
          },
          {
            id: "chip",
            label: `Microfluidic chip
(droplets: DNA gate)`,
            x: 0.32,
            y: 0.25,
            w: 0.22,
            color: "#58c4ff",
          },
          {
            id: "dish",
            label: `Dish: reaction–
diffusion medium`,
            x: 0.62,
            y: 0.25,
            w: 0.2,
            color: "#06d6a0",
          },
          {
            id: "light",
            label: `LED light table
+ blue excitation`,
            x: 0.62,
            y: 0.75,
            w: 0.2,
            color: "#ffe08a",
          },
          {
            id: "cam",
            label: `Camera
(optical readout)`,
            x: 0.88,
            y: 0.5,
            w: 0.16,
            color: "#ffb347",
          },
          {
            id: "host",
            label: `Analysis
(image → result)`,
            x: 0.32,
            y: 0.75,
            w: 0.2,
            color: "#c08cff",
          },
        ],
        edges: [
          ["pump", "chip", "flow"],
          ["chip", "cam", "fluorescence"],
          ["light", "dish"],
          ["dish", "cam", "pattern"],
          ["cam", "host"],
          ["host", "pump", "control"],
        ],
      },
      build(Q, C, I) {
        h = I.renderer;
        try {
          W();
        } catch (Oe) {
          ((Me = !1), console.warn("alife GPU init failed, CPU fallback", Oe));
        }
        let J = U.metal(0x7c8694, 0.34),
          ie = U.metal(0x1c222b, 0.38);
        Q.box(5, 0.07, 3, U.metal(0x161d26, 0.48), [0, 0.035, 0], {
          name: "Optical breadboard",
          info: "Anodized honeycomb optical bench for the wet computers: vibration-isolated steel & aluminium deck where chemical & DNA logic are read out optically.",
        });
        // Anodized bezel + calibrated opal diffuser backlight (prevents HDR white clipping)
        Q.box(1.98, 0.065, 1.98, U.metal(0x232a35, 0.38), [-0.9, 0.102, 0.1], {});
        let fe = Q.box(1.84, 0.075, 1.84, U.glow(0xb4d0e0, 0.18), [-0.9, 0.11, 0.1], {
            name: "LED light table (backlight)",
            info: "Calibrated uniform opal-glass transilluminator: patterns in the Petri dish are imaged by transmitted light without saturating the scientific camera sensor.",
          }),
          ne = Q.group([-0.9, 0.15, 0.1], {
            name: "Petri dish (90 mm glass)",
            info: "A thin layer of gel or solution: the medium IS the computer. Each point reacts with its neighbours only through diffusion; patterns emerge from local rules.",
          }),
          we = new B(new ke(0.82, 0.82, 0.1, 64, 1, !0), U.glass(14677247, 0.28));
        ((we.position.y = 0.05), ne.add(we));
        let ve = new B(new ke(0.82, 0.82, 0.01, 64), U.glass(14677247, 0.22));
        (ne.add(ve),
          (A = new xt({
            map: f ? f.texture : null,
            color: 16777215,
            toneMapped: !1,
          })),
          (v = new B(new Xn(0.8, 96), A)),
          (v.rotation.x = -Math.PI / 2),
          (v.position.y = 0.03),
          ne.add(v),
          Q.part(v, {
            name: "Reaction–diffusion medium (click to paint)",
            info: "Two species U (substrate, fed in) and V (autocatalyst): U + 2V → 3V, V → inert. Feed F replenishes U, kill k removes V. Different (F, k) give spots, stripes, coral, mitosis or chaos (Pearson's classes). Click the dish to drop V; in maze mode, click to start a wave.",
            live: () =>
              c === "gs"
                ? `F = ${t.toFixed(4)}, k = ${n.toFixed(4)}, ${ee} steps`
                : `wave step ${V ? V.t : 0}`,
          }),
          Q.cyl(0.84, 0.84, 0.015, U.glass(15267583, 0.16), [-0.9, 0.27, 0.1], {
            name: "Dish lid",
            info: "Keeps the medium from drying and from contamination.",
            shell: !0,
            explode: [0, 0.7, 0],
            seg: 64,
          }),
          // T-slot gantry column + gusset + horizontal optical rail
          Q.box(0.075, 1.56, 0.075, J, [-0.9, 0.85, -0.95], {}),
          Q.box(0.075, 0.075, 1.12, J, [-0.9, 1.6, -0.42], {}),
          Q.box(0.14, 0.14, 0.14, U.metal(0x252d38, 0.4), [-0.9, 1.58, -0.95], {}));
        // Scientific C-Mount Machine-Vision Camera with Cooling Fins + Knurled Macro Objective
        let Re = Q.group([-0.9, 1.44, 0.1], {
            name: "Camera (optical readout)",
            info: "Scientific cooled sCMOS machine-vision camera with C-mount macro telecentric objective: images the Petri dish and PDMS microfluidic chip, turning spatial concentration & fluorescence into digital waveforms.",
          }),
          He = new B(chamferBox(0.28, 0.22, 0.28, 0.014), U.darkAnodized(0x232b36));
        Re.add(He);
        for (let fin = -3; fin <= 3; fin++) {
          let fMesh = new B(new te(0.26, 0.016, 0.018), U.metal(0x56657a, 0.3));
          (fMesh.position.set(0, 0.118, fin * 0.034), Re.add(fMesh));
        }
        let camLed = new B(new Mt(0.012, 10, 8), U.glow(0x38ef7d, 1.4));
        (camLed.position.set(0.11, 0.07, 0.142), Re.add(camLed));
        // Brass C-mount collar + dual knurled focus/iris rings + coated fluorite front element
        let cMount = new B(new ke(0.095, 0.095, 0.024, 32), U.brass());
        ((cMount.position.y = -0.12), Re.add(cMount));
        let Se = new B(new ke(0.105, 0.11, 0.085, 32), U.knurled(0x414d5e, 0.32));
        ((Se.position.y = -0.175), Re.add(Se));
        let irisRing = new B(new ke(0.098, 0.102, 0.065, 32), U.knurled(0x556478, 0.3));
        ((irisRing.position.y = -0.25), Re.add(irisRing));
        let frontHood = new B(new ke(0.092, 0.106, 0.045, 32), ie);
        ((frontHood.position.y = -0.305), Re.add(frontHood));
        let objLens = new B(new ke(0.078, 0.078, 0.012, 32), U.glass(0x58b8ff, 0.42));
        ((objLens.position.y = -0.322), Re.add(objLens));
        Dt(
          Q,
          [
            [-0.9, 1.56, 0.1],
            [-0.9, 1.66, -0.45],
            [-0.9, 0.9, -0.99],
          ],
          0.01,
          0x1e2632,
        );
        ((K = Bt(1024, 512)), Y());
        let Ve = new B(new te(1.6, 0.08, 0.8), [
          U.glass(15398655, 0.45),
          U.glass(15398655, 0.45),
          new et({
            map: K.tex,
            transparent: !0,
            opacity: 0.92,
            roughness: 0.1,
          }),
          U.glass(15398655, 0.45),
          U.glass(15398655, 0.45),
          U.glass(15398655, 0.45),
        ]);
        (Ve.position.set(1.2, 0.13, 0.55),
          Q.add(Ve, {
            name: "Microfluidic chip (PDMS on glass): DNA AND gate in droplets",
            info: "Four channels mix gate complex with inputs A and B (00, 01, 10, 11) and pinch the stream into picolitre droplets at a T-junction; each droplet is a tiny test tube. Downstream = later in time: the droplet's fluorescence shows the gate output developing. Only the A AND B channel lights up.",
          }),
          (F = new ut(
            new Mt(0.022, 10, 8),
            new xt({ color: 16777215, toneMapped: !1 }),
            72,
          )),
          (H = []));
        for (let Oe = 0; Oe < 4; Oe++)
          for (let rt = 0; rt < 18; rt++) H.push({ c: Oe, s: rt / 18 });
        Q.add(F, {
          name: "Droplets (picolitre reactors)",
          info: "Each droplet carries ~100 nM gate complex, reporter, and the inputs. Green = fluorescence from the reporter, i.e. released output strand. Brightness is computed from the strand-displacement kinetics at that droplet's age.",
        });
        let Ke = Q.box(0.25, 0.12, 0.2, U.glow(4029439, 0.75), [1.2, 0.95, 0.55], {
          name: "Blue excitation LED + emission filter",
          info: "470 nm narrowband LED excites the FAM reporter fluorophore; a 515 nm dichroic long-pass filter passes only green emission to the camera.",
        });
        Q.box(0.05, 0.85, 0.05, J, [1.2, 0.5, 0.25], {});
        // 3 Precision Lead-Screw Laboratory Syringe Pumps (Gate, Input A, Input B)
        for (let Oe = 0; Oe < 3; Oe++) {
          let rt = -0.55 - Oe * 0.34,
            reagentCol = [0x38b6ff, 0xffaa3b, 0x38e08c][Oe],
            pumpGrp = Q.group([1.08, 0.07, rt], {
              name: Oe ? void 0 : "Syringe pumps (gate, input A, input B)",
              info: "Precision micro-stepping lead-screw syringe pumps (µL/min): NEMA-17 stepper drives a brass nut along twin stainless linear rails, pushing a borosilicate Luer-lok glass syringe loaded with DNA gate complex (cyan), input strand A (amber) and input strand B (emerald).",
            });
          // Anodized slate pump chassis + end blocks
          pumpGrp.add(
            Qs(
              new B(chamferBox(0.96, 0.07, 0.24, 0.008), U.metal(0x283240, 0.36)),
              0,
              0.035,
              0,
            ),
          );
          pumpGrp.add(
            Qs(
              new B(chamferBox(0.06, 0.16, 0.22, 0.006), U.metal(0x374252, 0.34)),
              0.42,
              0.11,
              0,
            ),
          );
          // Rear NEMA-17 stepper motor housing
          pumpGrp.add(
            Qs(
              new B(chamferBox(0.16, 0.16, 0.18, 0.008), U.metal(0x181d25, 0.42)),
              -0.39,
              0.115,
              0,
            ),
          );
          // Twin stainless linear guide rods + central brass lead screw
          for (let rz of [-0.075, 0.075]) {
            let rod = new B(new ke(0.008, 0.008, 0.72, 12), U.steel());
            ((rod.rotation.z = Math.PI / 2),
              rod.position.set(0.02, 0.11, rz),
              pumpGrp.add(rod));
          }
          let leadScrew = new B(new ke(0.011, 0.011, 0.72, 16), U.brass());
          ((leadScrew.rotation.z = Math.PI / 2),
            leadScrew.position.set(0.02, 0.145, 0),
            pumpGrp.add(leadScrew));
          // Translating pusher carriage
          pumpGrp.add(
            Qs(
              new B(chamferBox(0.055, 0.19, 0.2, 0.005), U.alu()),
              -0.18 + Oe * 0.04,
              0.14,
              0,
            ),
          );
          // Clear borosilicate graduated syringe barrel + colored DNA reagent + plunger + Luer hub
          let barrel = new B(new ke(0.046, 0.046, 0.52, 24), U.glass(0xdff2ff, 0.26));
          ((barrel.rotation.z = Math.PI / 2),
            barrel.position.set(0.16, 0.225, 0),
            pumpGrp.add(barrel));
          let liquid = new B(new ke(0.038, 0.038, 0.32, 20), U.glow(reagentCol, 0.25));
          ((liquid.rotation.z = Math.PI / 2),
            liquid.position.set(0.24, 0.225, 0),
            pumpGrp.add(liquid));
          let stopper = new B(new ke(0.04, 0.04, 0.028, 20), U.plastic(0x14181e, 0.65));
          ((stopper.rotation.z = Math.PI / 2),
            stopper.position.set(0.065, 0.225, 0),
            pumpGrp.add(stopper));
          let plungerRod = new B(new ke(0.012, 0.012, 0.26, 12), U.alu());
          ((plungerRod.rotation.z = Math.PI / 2),
            plungerRod.position.set(-0.06, 0.225, 0),
            pumpGrp.add(plungerRod));
          let luerHub = new B(new ke(0.016, 0.024, 0.05, 16), U.steel());
          ((luerHub.rotation.z = Math.PI / 2),
            luerHub.position.set(0.445, 0.225, 0),
            pumpGrp.add(luerHub));
          Dt(
            Q,
            [
              [1.55, 0.295, rt],
              [1.75, 0.26, rt * 0.5],
              [1.85, 0.2, 0.4],
              [1.95, 0.15, 0.5],
            ],
            0.01,
            reagentCol,
          );
        }
        let $e = Q.group([-0.9, 0.08, -1.05], {
            name: "Xenobot dish (nod)",
            info: 'Xenobots: millimetre-sized living machines assembled from frog (Xenopus laevis) skin and heart cells into shapes found by an evolutionary algorithm in simulation (Kriegman, Blackiston, Levin & Bongard, PNAS 2020); some can gather loose cells into new xenobots ("kinematic self-replication", PNAS 2021). Shown here as moving blobs only; not simulated.',
          }),
          ze = new B(new ke(0.42, 0.42, 0.06, 48, 1, !0), U.glass(14677247, 0.3));
        ((ze.position.y = 0.03), $e.add(ze));
        let at = new B(new Xn(0.41, 48), U.plastic(2768186, 0.2));
        ((at.rotation.x = -Math.PI / 2), (at.position.y = 0.01), $e.add(at));
        for (let Oe = 0; Oe < 4; Oe++) {
          let rt = new B(
            new Mt(0.05, 16, 12),
            U.plastic([14263180, 13208436, 14726302, 13735554][Oe], 0.7),
          );
          (rt.scale.set(1, 0.7, 1.15),
            rt.position.set(Math.cos(Oe * 1.6) * 0.2, 0.05, Math.sin(Oe * 1.6) * 0.2),
            $e.add(rt),
            ue.push({ b: rt, a: Oe * 1.6, v: 0.15 + Oe * 0.03 }));
        }
        if (
          (Nt(
            Q,
            "WET A-LIFE · Gray–Scott (GPU) · BZ waves · DNA strand displacement · for 0thernes",
            2.6,
            0.1,
            [0, 0.071, 1.38],
            { bg: "#081410", color: "#9ff0d0", rot: [-Math.PI / 2, 0, 0] },
          ),
          (w = Bt(512, 512)),
          D(5),
          (_ = new Zc(64, 64, t, n)),
          _.seed(32, 32, 5, () => 0.5),
          _.step(300),
          (j = F0()),
          Y(),
          Me)
        ) {
          for (let Oe = 0; Oe < 120; Oe++) le(5);
          pe();
        }
        X._dropT = 0;
      },
      ui(Q) {
        ((R.mode = st(
          [
            "Gray–Scott morphogenesis (GPU)",
            "BZ chemical-wave maze solver",
            "DNA strand-displacement AND gate",
          ],
          "Gray–Scott morphogenesis (GPU)",
          (C) => {
            ((c = C.startsWith("Gray") ? "gs" : C.startsWith("BZ") ? "bz" : "dna"),
              re(),
              de());
          },
        )),
          (R.F = We(
            "feed F",
            0.005,
            0.1,
            1e-4,
            t,
            (C) => {
              t = C;
            },
            (C) => (+C).toFixed(4),
          )),
          (R.K = We(
            "kill k",
            0.04,
            0.075,
            1e-4,
            n,
            (C) => {
              n = C;
            },
            (C) => (+C).toFixed(4),
          )),
          (R.boxGS = Ie(
            "Reaction–diffusion (U + 2V → 3V): edit feed/kill, paint by clicking the dish",
            q(
              "div",
              { class: "row" },
              "Preset ",
              st(i, e, (C) => {
                ((e = C), ([t, n] = U0[C]), be());
              }),
              Fe("Reseed", () => G()),
              Fe("Clear", () => G(!0)),
            ),
            R.F,
            R.K,
            We("speed (steps/frame)", 1, 40, 1, s, (C) => (s = C)),
            q(
              "div",
              { class: "row" },
              "Palette ",
              st(Object.keys(yb), o, (C) => {
                ((o = C), Ee());
              }),
              We("glow", 0.4, 2, 0.01, a, (C) => {
                ((a = C), m && (m.uniforms.gain.value = C));
              }),
            ),
            q(
              "label",
              { class: "small" },
              q("input", {
                type: "checkbox",
                onchange: (C) => {
                  r = C.target.checked ? 1 : 0;
                },
              }),
              " Pearson parameter map: F rises bottom→top, k left→right (the whole zoo at once)",
            ),
            q(
              "div",
              { class: "small" },
              "Du = 0.2097, Dv = 0.105 (grid units, Δt = 1), 9-point Laplacian, 256×256 cells, circular dish boundary. Patterns are not drawn: they emerge.",
            ),
          )),
          (R.bzInfo = q("div", { class: "small" })),
          (R.boxBZ = Ie(
            "Excitable medium (Greenberg–Hastings model of a BZ reaction) solving a maze",
            q(
              "div",
              { class: "row" },
              Fe("New maze", () => D(Date.now() & 65535)),
              Fe("Launch wave", () => {
                ((V = new Po(P)), (k = 0));
              }),
              We("steps/s", 1, 60, 1, L, (C) => (L = C)),
            ),
            R.bzInfo,
            q(
              "div",
              { class: "small" },
              "Rest → excited (if a neighbour is excited) → refractory → rest. The wave front reaches every cell at its shortest-path distance; tracing back down the arrival times from the goal gives the shortest route (Steinbock et al. 1995 did this in a real BZ maze, read out by camera). Click the dish to fire a wave anywhere.",
            ),
          )),
          (R.dplot = It(150)),
          (R.dinfo = q("pre", { class: "term", style: { fontSize: "11px" } })),
          (R.conc = We("input strands", 20, 200, 1, 120, (C) => {
            ((j = F0(C * 1e-9)), Y());
          })),
          (R.boxDNA = Ie(
            "DNA strand-displacement AND gate (Seelig et al. 2006), mass-action kinetics",
            R.conc,
            R.dplot,
            R.dinfo,
            q(
              "div",
              { class: "small" },
              "Gate G = output strand held by two blockers. A binds G's toehold and strips blocker 1 (A + G → GI), exposing a second toehold; B then strips blocker 2 and frees the output (B + GI → O); O opens a reporter (O + R → F, fluorescent). k ≈ 5×10⁵ M⁻¹s⁻¹ (6-nt toeholds), 100 nM gate, small leak. 3 hours simulated.",
            ),
          )),
          Q.append(Ie("Mode", R.mode), R.boxGS, R.boxBZ, R.boxDNA),
          re(),
          he());
      },
      update(Q) {
        if ((c === "gs" && l && Me && (le(s), pe()), c === "bz" && V)) {
          z += Q * L;
          let C = Math.min(Math.floor(z), 30);
          for (z -= C; C-- > 0;) V.step();
          $();
        }
        (M > 0 && ((M -= Q), M <= 0 && (E.z = 0)), se(Q), Math.random() < 0.2 && _e());
      },
      idle(Q) {
        (Me && c === "gs" && h && (le(2), Math.random() < 0.5 && pe()), se(Q));
      },
      onPick(Q, C) {
        if (Q === v && C && C.uv) {
          if (c === "bz") {
            let J = 440.32 / P.W,
              ie = 512 * 0.07,
              fe = Math.floor((C.uv.x * 512 - ie) / J),
              ne = Math.floor(((1 - C.uv.y) * 512 - ie) / J);
            if (fe < 0 || ne < 0 || fe >= P.W || ne >= P.H) return !0;
            (V || (V = new Po(P)), V.fire([fe, ne]));
          } else (E.set(C.uv.x, C.uv.y, 0.025), (M = 0.15));
          return !0;
        }
        return !1;
      },
    };
  function W() {
    let Q = {
      type: Oi,
      minFilter: Kt,
      magFilter: Kt,
      wrapS: Zi,
      wrapT: Zi,
      depthBuffer: !1,
    };
    ((d = new kt(Si, Si, Q)),
      (u = new kt(Si, Si, Q)),
      (f = new kt(Si * 2, Si * 2, {
        depthBuffer: !1,
        minFilter: $t,
        magFilter: $t,
        colorSpace: Ot,
      })),
      (p = new An(-1, 1, 1, -1, 0, 1)));
    let C = new mt(2, 2);
    ((x = new nn({
      glslVersion: Gn,
      vertexShader: T1,
      fragmentShader: zA,
      uniforms: {
        prev: { value: null },
        res: { value: new ye(Si, Si) },
        F: { value: t },
        K: { value: n },
        Du: { value: 0.2097 },
        Dv: { value: 0.105 },
        brush: { value: E },
        mapMode: { value: 0 },
      },
    })),
      (g = new Ni()),
      g.add(new B(C, x)),
      (m = new nn({
        glslVersion: Gn,
        vertexShader: T1,
        fragmentShader: HA,
        uniforms: {
          tex: { value: null },
          res: { value: new ye(Si, Si) },
          c0: { value: new Ae() },
          c1: { value: new Ae() },
          c2: { value: new Ae() },
          c3: { value: new Ae() },
          gain: { value: a },
        },
      })),
      (S = new Ni()),
      S.add(new B(C, m)),
      (b = new nn({
        glslVersion: Gn,
        vertexShader: T1,
        fragmentShader: qA,
        uniforms: { src: { value: null } },
      })),
      (y = new Ni()),
      y.add(new B(C, b)),
      Ee(),
      G());
  }
  function G(Q) {
    if (!h || !d) return;
    let C = new Float32Array(Si * Si * 4),
      I = 12345,
      J = () => (I = (I * 16807) % 2147483647) / 2147483647;
    for (let fe = 0; fe < Si * Si; fe++) ((C[fe * 4] = 1), (C[fe * 4 + 3] = 1));
    if (!Q)
      for (let fe = 0; fe < 36; fe++) {
        let ne = Si * (0.18 + J() * 0.64),
          we = Si * (0.18 + J() * 0.64),
          ve = 3 + J() * 6;
        for (let Re = -ve; Re <= ve; Re++)
          for (let He = -ve; He <= ve; He++) {
            if (He * He + Re * Re > ve * ve) continue;
            let Se = (Math.round(we + Re) * Si + Math.round(ne + He)) * 4;
            Se < 0 || Se >= C.length || ((C[Se] = 0.5), (C[Se + 1] = 0.25 + J() * 0.02));
          }
      }
    let ie = new tn(C, Si, Si, _i, Fi);
    ((ie.needsUpdate = !0),
      (b.uniforms.src.value = ie),
      h.setRenderTarget(d),
      h.render(y, p),
      h.setRenderTarget(null),
      ie.dispose(),
      (T = 0),
      (ee = 0));
  }
  function le(Q) {
    if (!d) return;
    let C = h.getRenderTarget();
    ((x.uniforms.F.value = t), (x.uniforms.K.value = n), (x.uniforms.mapMode.value = r));
    for (let I = 0; I < Q; I++) {
      let J = T % 2 ? u : d,
        ie = T % 2 ? d : u;
      ((x.uniforms.prev.value = J.texture),
        h.setRenderTarget(ie),
        h.render(g, p),
        T++,
        ee++);
    }
    h.setRenderTarget(C);
  }
  function pe() {
    if (!d) return;
    let Q = h.getRenderTarget();
    ((m.uniforms.tex.value = (T % 2 ? u : d).texture),
      h.setRenderTarget(f),
      h.render(S, p),
      h.setRenderTarget(Q));
  }
  function Ee() {
    m && yb[o].forEach((Q, C) => m.uniforms["c" + C].value.set(Q));
  }
  function be() {
    if (R.F)
      for (let [Q, C] of [
        [R.F, t],
        [R.K, n],
      ])
        ((Q.querySelector("input").value = C),
          (Q.querySelector(".v").textContent = C.toFixed(4)));
  }
  function re() {
    R.boxGS &&
      ((R.boxGS.style.display = c === "gs" ? "" : "none"),
      (R.boxBZ.style.display = c === "bz" ? "" : "none"),
      (R.boxDNA.style.display = c === "dna" ? "" : "none"));
  }
  function de() {
    (c === "bz"
      ? ((A.map = w.tex), V || (V = new Po(P)), $())
      : (A.map = f ? f.texture : w.tex),
      (A.needsUpdate = !0));
  }
  function D(Q) {
    ((P = E1(12, 12, Q)), (X._bfs = w1(P)), (V = null), w && $());
  }
  function $() {
    let Q = w.ctx,
      C = 512;
    ((Q.fillStyle = "#5a1a12"), Q.fillRect(0, 0, C, C));
    let I = (C * 0.86) / P.W,
      J = C * 0.07,
      ie = V ? V.s : null;
    for (let ne = 0; ne < P.H; ne++)
      for (let we = 0; we < P.W; we++) {
        let ve = ne * P.W + we;
        if (P.g[ve]) Q.fillStyle = "#1b0f0c";
        else {
          let Re = ie ? ie[ve] : 0;
          Q.fillStyle =
            Re === 1
              ? "#e0ecff"
              : Re > 1
                ? `rgb(${60 + Re * 8},${90 + Re * 10},${200 - Re * 12})`
                : V && V.arr[ve] >= 0
                  ? "#c8452a"
                  : "#d9532b";
        }
        Q.fillRect(J + we * I, J + ne * I, I + 0.5, I + 0.5);
      }
    let fe = V && V.reached ? V.path() : null;
    fe &&
      ((Q.strokeStyle = "#fff6c0"),
      (Q.lineWidth = I * 0.35),
      Q.beginPath(),
      fe.forEach((ne, we) => {
        let ve = J + ((ne % P.W) + 0.5) * I,
          Re = J + (Math.floor(ne / P.W) + 0.5) * I;
        we ? Q.lineTo(ve, Re) : Q.moveTo(ve, Re);
      }),
      Q.stroke());
    for (let [ne, we] of [
      [P.start, "#5fe08a"],
      [P.goal, "#ffb347"],
    ])
      ((Q.fillStyle = we),
        Q.beginPath(),
        Q.arc(J + (ne[0] + 0.5) * I, J + (ne[1] + 0.5) * I, I * 0.5, 0, 7),
        Q.fill());
    ((w.tex.needsUpdate = !0), (X._path = fe));
  }
  function Y() {
    if (!K) return;
    let Q = K.ctx,
      C = 1024,
      I = 512;
    (Q.clearRect(0, 0, C, I),
      (Q.fillStyle = "rgba(220,235,245,0.25)"),
      Q.fillRect(0, 0, C, I));
    for (let J = 0; J < 4; J++) {
      let ie = I * (0.16 + J * 0.22);
      ((Q.strokeStyle = "rgba(120,170,210,0.9)"),
        (Q.lineWidth = 9),
        Q.beginPath(),
        Q.moveTo(20, ie - 30),
        Q.lineTo(110, ie),
        Q.moveTo(20, ie + 30),
        Q.lineTo(110, ie),
        Q.moveTo(110, ie),
        Q.lineTo(C - 30, ie),
        Q.stroke(),
        (Q.fillStyle = "#dfefff"),
        (Q.font = "bold 26px ui-monospace,monospace"),
        Q.fillText(`A=${J >> 1} B=${J & 1}`, 130, ie - 16),
        j &&
          ((Q.fillStyle = "#5fe08a"),
          Q.fillText(`out ${(j[J].frac * 100).toFixed(0)}%`, C - 170, ie - 16)));
    }
    ((Q.fillStyle = "#9fb3c8"),
      (Q.font = "20px ui-monospace,monospace"),
      Q.fillText(
        "T-junction droplet makers → time along channel (0 → 3 h) → fluorescence",
        20,
        I - 12,
      ),
      (K.tex.needsUpdate = !0));
  }
  function se(Q) {
    if (
      ((X._dropT = (X._dropT || 0) + Q * 0.06),
      Math.floor(X._dropT * 160) !== X._pumpS &&
        ((X._pumpS = Math.floor(X._dropT * 160)), hi("pump", { min: 0.05, m: "alife" })),
      F)
    ) {
      let C = new je(),
        I = new Ae(),
        J = 0;
      (H.forEach((ie, fe) => {
        let ne = (ie.s + X._dropT) % 1;
        (ie.ls !== void 0 &&
          ne < ie.ls &&
          !J &&
          ((J = 1), hi("drip", { f: 700 + ie.c * 900, min: 0.09, m: "alife" })),
          (ie.ls = ne));
        let we = 1.2 - 0.7 + ne * 1.45,
          ve = 0.55 - 0.4 + (0.16 + ie.c * 0.22) * 0.8;
        (C.position.set(we, 0.18, ve), C.updateMatrix(), F.setMatrixAt(fe, C.matrix));
        let Re = j ? j[ie.c].trace : null,
          He = Re ? Re[Math.min(Re.length - 1, Math.floor(ne * Re.length))].F / 15e-8 : 0;
        (I.setRGB(0.25 + 0.2 * He, 0.35 + 3.2 * He, 0.45 + 0.6 * He),
          F.setColorAt(fe, I));
      }),
        (F.instanceMatrix.needsUpdate = !0),
        (F.instanceColor.needsUpdate = !0));
    }
    for (let C of ue) {
      C.a += Q * C.v * (0.6 + 0.4 * Math.sin(X._dropT * 40 + C.v * 9));
      let I = 0.2 + 0.08 * Math.sin(C.a * 1.7);
      (C.b.position.set(Math.cos(C.a) * I, 0.05, Math.sin(C.a) * I),
        (C.b.rotation.y = -C.a));
    }
  }
  function he() {
    if (!R.dplot || !j) return;
    let Q = yt(R.dplot),
      C = R.dplot.width,
      I = R.dplot.height;
    (Q.setTransform(1, 0, 0, 1, 0, 0), (Q.fillStyle = "#0b1118"), Q.fillRect(0, 0, C, I));
    let J = ["#6a7a8a", "#58c4ff", "#ffb347", "#5fe08a"];
    (j.forEach((ie, fe) => {
      ((Q.strokeStyle = J[fe]),
        (Q.lineWidth = 2),
        Q.beginPath(),
        ie.trace.forEach((ne, we) => {
          let ve = 30 + (we / (ie.trace.length - 1)) * (C - 40),
            Re = I - 20 - (ne.F / 15e-8) * (I - 30);
          we ? Q.lineTo(ve, Re) : Q.moveTo(ve, Re);
        }),
        Q.stroke(),
        (Q.fillStyle = J[fe]),
        (Q.font = "11px ui-monospace,monospace"),
        Q.fillText(`A=${ie.a} B=${ie.b}`, C - 80, 14 + fe * 13));
    }),
      (Q.fillStyle = "#9fb3c8"),
      Q.fillText("fluorescence F / reporter vs time (0–3 h)", 30, I - 5),
      (R.dinfo.textContent =
        `truth table (reporter opened after 3 h):
` +
        j.map(
          (ie) =>
            ` A=${ie.a} B=${ie.b} → ${(ie.frac * 100).toFixed(1).padStart(5)} %  ${ie.frac > 0.3 ? "1" : "0"}`,
        ).join(`
`)));
  }
  function _e() {
    if (R.bzInfo) {
      if (c === "bz") {
        let Q = X._bfs[P.goal[1] * P.W + P.goal[0]];
        R.bzInfo.textContent = V
          ? V.reached
            ? `wave reached the goal at step ${V.arr[P.goal[1] * P.W + P.goal[0]]}; traced path length ${X._path ? X._path.length - 1 : "?"} (BFS shortest = ${Q})`
            : `wave step ${V.t} …`
          : "Launch a wave.";
      }
      c === "dna" && he();
    }
  }
  return (
    (X.sim = {
      get mode() {
        return c;
      },
      get F() {
        return t;
      },
      get K() {
        return n;
      },
      get cpuGS() {
        return _;
      },
      get ex() {
        return V;
      },
      get mz() {
        return P;
      },
      get kin() {
        return j;
      },
      get gsSteps() {
        return ee;
      },
      get gpuOK() {
        return Me;
      },
      get preset() {
        return e;
      },
    }),
    (X.isRunning = () => l),
    (X.test = () => {
      let C = F0().map((Se) => +Se.frac.toFixed(3)),
        I = E1(10, 10, 5),
        J = w1(I),
        ie = new Po(I),
        fe = 0;
      for (; !ie.reached && fe < 3e3;) (ie.step(), fe++);
      let ne = ie.path(),
        we = new Zc(48, 48, 0.0545, 0.062);
      we.seed(24, 24, 4, () => 0.5);
      let ve = we.stats().area;
      we.step(1500);
      let Re = we.stats(),
        He = {
          dna_and_00_01_10_11: C,
          maze_wave_path: ne ? ne.length - 1 : -1,
          maze_bfs: J[I.goal[1] * I.W + I.goal[0]],
          gs_coral_grew: [+ve.toFixed(3), +Re.area.toFixed(3)],
          gs_bounded: Re.maxV < 1,
          gpu: Me,
        };
      return (
        (He.ok =
          C[3] > 0.5 &&
          C.slice(0, 3).every((Se) => Se < 0.1) &&
          He.maze_wave_path === He.maze_bfs &&
          Re.area > ve * 2 &&
          He.gs_bounded),
        He
      );
    }),
    X
  );
}
