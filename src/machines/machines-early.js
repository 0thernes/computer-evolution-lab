var vA = new Set(["H", "HALT", "halt", "accept", "reject", "Y", "N!"]);
function Bm(i) {
  let e = new Map(),
    t = [],
    n = [],
    s = new Set(),
    r = null,
    o = "_",
    a = "",
    l = 0,
    c = new Set(["accept", "Y"]);
  i.split(
    `
`,
  ).forEach((h, d) => {
    let u = h.replace(/#.*/, "").trim();
    if (!u) return;
    let f = u.match(/^(start|blank|tape|head|accept)\s*:\s*(.*)$/i);
    if (f) {
      let E = f[1].toLowerCase(),
        M = f[2].trim();
      E === "start"
        ? (r = M)
        : E === "blank"
          ? (o = M[0] || "_")
          : E === "tape"
            ? (a = M)
            : E === "head"
              ? (l = parseInt(M) || 0)
              : (c = new Set(M.split(/[\s,]+/)));
      return;
    }
    let p = u.match(/^(\S+)\s+(\S)\s*(?:->|→|,)\s*(\S)\s*,?\s*([LRNlrnS])\s*,?\s*(\S+)$/);
    if (!p) {
      t.push(`line ${d + 1}: expected "state symbol -> write move next", got "${u}"`);
      return;
    }
    let [, x, g, m, S, b] = p,
      y = x + "\0" + g;
    (e.has(y) &&
      t.push(
        `line ${d + 1}: duplicate rule for (${x}, ${g}) — a deterministic TM has one`,
      ),
      e.set(y, {
        q: x,
        s: g,
        w: m,
        mv: S.toUpperCase() === "S" ? "N" : S.toUpperCase(),
        nx: b,
        ln: d,
      }),
      n.includes(x) || n.push(x),
      s.add(g),
      s.add(m));
  });
  for (let h of e.values()) !n.includes(h.nx) && !qa(h.nx) && n.push(h.nx);
  (r || (r = n[0] || "A"), s.add(o));
  for (let h of a) s.add(h === " " ? o : h);
  return {
    rules: e,
    errors: t,
    states: n,
    symbols: [...s].sort((h, d) => (h === o) - (d === o) || h.localeCompare(d)),
    start: r,
    blank: o,
    tape: a,
    head: l,
    accept: c,
  };
}
var qa = (i) => vA.has(i);
function jy(i) {
  let e = [`start: ${i.start}`, `blank: ${i.blank}`];
  (i.tape && e.push(`tape: ${i.tape}`), i.head && e.push(`head: ${i.head}`));
  for (let t of i.states)
    for (let n of i.symbols) {
      let s = i.rules.get(t + "\0" + n);
      s && e.push(`${t} ${n} -> ${s.w} ${s.mv} ${s.nx}`);
    }
  return e.join(`
`);
}
var Ha = class {
    constructor(e) {
      this.load(e);
    }
    load(e) {
      ((this.p = typeof e == "string" ? Bm(e) : e), this.reset());
    }
    reset(e) {
      let t = this.p;
      this.tape = new Map();
      let n = e ?? t.tape;
      ([...n].forEach((s, r) => {
        s !== t.blank && s !== " " && this.tape.set(r, s);
      }),
        (this.head = t.head || 0),
        (this.state = t.start),
        (this.steps = 0),
        (this.halted = !1),
        (this.reason = ""),
        (this.last = null),
        (this.writes = 0),
        (this.moves = 0),
        (this.minX = 0),
        (this.maxX = Math.max(0, n.length - 1)),
        (this.trail = []));
    }
    read(e = this.head) {
      return this.tape.get(e) ?? this.p.blank;
    }
    rule() {
      return this.p.rules.get(this.state + "\0" + this.read());
    }
    step() {
      if (this.halted) return !1;
      if (qa(this.state)) return ((this.halted = !0), (this.reason = "halt state"), !1);
      let e = this.rule();
      if (!e)
        return (
          (this.halted = !0),
          (this.reason = `no rule for (${this.state}, ${this.read()}) → machine stops`),
          !1
        );
      let t = this.read();
      return (
        e.w === this.p.blank
          ? this.tape.delete(this.head)
          : this.tape.set(this.head, e.w),
        e.w !== t && this.writes++,
        (this.last = { ...e, at: this.head, from: this.state }),
        (this.head += e.mv === "L" ? -1 : e.mv === "R" ? 1 : 0),
        e.mv !== "N" && this.moves++,
        (this.minX = Math.min(this.minX, this.head)),
        (this.maxX = Math.max(this.maxX, this.head)),
        (this.state = e.nx),
        this.steps++,
        this.trail.push(this.head),
        this.trail.length > 200 && this.trail.shift(),
        qa(this.state) &&
          ((this.halted = !0), (this.reason = "entered halt state " + this.state)),
        !0
      );
    }
    run(e = 1e6) {
      let t = 0;
      for (; !this.halted && t < e;) (this.step(), t++);
      return t;
    }
    count(e = "1") {
      let t = 0;
      for (let n of this.tape.values()) n === e && t++;
      return t;
    }
    str() {
      let e = [...this.tape.keys()];
      if (!e.length) return "";
      let t = Math.min(...e),
        n = Math.max(...e),
        s = "";
      for (let r = t; r <= n; r++) s += this.read(r);
      return s;
    }
    accepted() {
      return this.p.accept.has(this.state);
    }
    standardDescription() {
      let e = this.p,
        t = [e.start, ...e.states.filter((c) => c !== e.start)],
        n = [e.blank, ...e.symbols.filter((c) => c !== e.blank)],
        s = (c) =>
          qa(c) ? "D" + "A".repeat(t.length + 1) : "D" + "A".repeat(t.indexOf(c) + 1),
        r = (c) => "D" + "C".repeat(Math.max(0, n.indexOf(c))),
        o = [];
      for (let c of e.rules.values()) o.push(s(c.q) + r(c.s) + r(c.w) + c.mv + s(c.nx));
      let a = o.join(";") + ";",
        l = a.replace(
          /[ACDLRN;]/g,
          (c) => ({ A: 1, C: 2, D: 3, L: 4, R: 5, N: 6, ";": 7 })[c],
        );
      return { sd: a, dn: l };
    }
  },
  To = {
    "Binary increment (1011 → 1100)": `# Adds 1 to a binary number. Head starts on the leftmost digit.
start: right
blank: _
tape: 1011
right 0 -> 0 R right
right 1 -> 1 R right
right _ -> _ L carry
carry 1 -> 0 L carry
carry 0 -> 1 N H
carry _ -> 1 N H`,
    "Unary addition (111+11 → 11111)": `# Unary: n is n ones. Replace '+' by 1, then erase the last 1.
start: q0
blank: _
tape: 111+11
q0 1 -> 1 R q0
q0 + -> 1 R q1
q1 1 -> 1 R q1
q1 _ -> _ L q2
q2 1 -> _ N H`,
    "Palindrome checker (a/b)": `# Erase the first symbol, remember it, check the last one matches, repeat.
# Halts in 'accept' (palindrome) or 'reject'.
start: q0
blank: _
tape: abba
q0 a -> _ R ra
q0 b -> _ R rb
q0 _ -> _ N accept
ra a -> a R ra
ra b -> b R ra
ra _ -> _ L ca
rb a -> a R rb
rb b -> b R rb
rb _ -> _ L cb
ca a -> _ L back
ca b -> b N reject
ca _ -> _ N accept
cb b -> _ L back
cb a -> a N reject
cb _ -> _ N accept
back a -> a L back
back b -> b L back
back _ -> _ R q0`,
    "Busy beaver, 3 states (Σ(3) = 6)": `# Lin & Radó (1965) 3-state, 2-symbol busy beaver from a blank (all-0) tape.
# The halting transition counts as a step.
start: A
blank: 0
A 0 -> 1 R B
A 1 -> 1 R H
B 0 -> 0 R C
B 1 -> 1 R B
C 0 -> 1 L C
C 1 -> 1 L A`,
    "Busy beaver, 2 states (Σ(2) = 4, S(2) = 6)": `start: A
blank: 0
A 0 -> 1 R B
A 1 -> 1 L B
B 0 -> 1 L A
B 1 -> 1 R H`,
    "Turing's first example (1936): 0 1 0 1 …": `# From 'On Computable Numbers' §3: m-configurations b, c, e, f.
# Prints 0 _ 1 _ 0 _ 1 … on alternate squares forever (never halts: a "circle-free" machine).
start: b
blank: _
b _ -> 0 R c
c _ -> _ R e
e _ -> 1 R f
f _ -> _ R b`,
    "Wolfram's (2,3) machine (universality demo, runs forever)": `# Proved universal by Alex Smith (2007, published 2020) in a weak sense:
# it needs an infinite non-periodic initial tape and never halts. Here: blank tape demo.
start: A
blank: 0
A 0 -> 1 R B
A 1 -> 2 L A
A 2 -> 1 L A
B 0 -> 2 L A
B 1 -> 2 R B
B 2 -> 0 R A`,
  };
function zm() {
  let i = Object.keys(To),
    e = To[i[0]],
    t = new Ha(e),
    n = !1,
    s = 4,
    r = 0,
    o = {},
    a,
    l,
    c,
    h,
    d,
    u,
    f = 0,
    p = 0,
    x = [],
    g = {
      id: "turing",
      era: "1936",
      short: "Turing machine (concept)",
      sim: t,
      name: "Turing machine — Alan Turing, “On Computable Numbers” (1936)",
      blurb:
        "Before any electronic computer existed, the 24-year-old Alan Turing defined what computing IS: a finite control in one of finitely many states (“m-configurations”) reads one symbol on an unbounded tape, then writes a symbol, moves one square left or right, and changes state, all by looking up a finite table. He showed that one universal machine can imitate any other given its description on the tape (the idea of the stored-program computer), and that no machine can decide whether an arbitrary machine halts (the halting problem). Church–Turing thesis: anything effectively computable can be computed by such a machine. This is a CONCEPTUAL physical rendering, not a historical device, running a real Turing-machine interpreter: edit the table as text or in the grid, set the tape, step or run.",
      diagram: {
        nodes: [
          {
            id: "tape",
            label: `Tape
(unbounded)`,
            x: 0.15,
            y: 0.78,
            w: 0.24,
            color: "#e8d9a8",
          },
          {
            id: "head",
            label: `Read/write
head`,
            x: 0.45,
            y: 0.78,
            w: 0.2,
            color: "#ffb347",
          },
          {
            id: "st",
            label: `State register
(m-configuration)`,
            x: 0.45,
            y: 0.3,
            w: 0.26,
            color: "#58c4ff",
          },
          {
            id: "tab",
            label: `Transition table
(the program)`,
            x: 0.82,
            y: 0.3,
            w: 0.26,
            color: "#b58cff",
          },
          {
            id: "act",
            label: `Action
write · move · next`,
            x: 0.82,
            y: 0.78,
            w: 0.24,
            color: "#5fe08a",
          },
        ],
        edges: [
          ["tape", "head", "read"],
          ["head", "st", "symbol"],
          ["st", "tab", "(q,s)"],
          ["tab", "act"],
          ["act", "head", "write/move"],
          ["act", "st", "next q"],
          ["head", "tape", "write"],
        ],
      },
      build(w) {
        let v = U.wood(),
          R = U.metal(13214282, 0.3),
          _ = U.plastic(1909031, 0.5),
          P = U.plastic(15655876, 0.6),
          br = U.brass(0xd4a84f, 0.28);
        (w.box(3.2, 0.08, 1.3, v, [0, 0.04, 0], {
          name: "Base (conceptual model)",
          info: "A display base for an abstract machine. Turing's 1936 machine has no physical form: it is a mathematical definition. Everything here is a visual metaphor for its parts.",
        }),
          w.box(3.23, 0.018, 1.33, br, [0, 0.082, 0], {}),
          Nt(
            w,
            "CONCEPTUAL MODEL · not a historical device · A. M. Turing, Proc. London Math. Soc. 1936",
            2.2,
            0.07,
            [0, 0.092, 0.6],
            { bg: "#2a1a0e", color: "#f4d58a", rot: [-Math.PI / 2, 0, 0] },
          ),
          w.box(3, 0.03, 0.06, R, [0, 0.12, 0.2], {}),
          w.box(3, 0.03, 0.06, R, [0, 0.12, -0.02], {}));
        for (let rx of [-1.25, -0.6, 0.6, 1.25]) {
          w.box(0.035, 0.04, 0.28, br, [rx, 0.1, 0.09], {});
        }
        a = Bt(2048, 128);
        let V = new B(
          new mt(2.7, (2.7 * 128) / 2048),
          new et({ map: a.tex, roughness: 0.72 }),
        );
        ((V.rotation.x = -Math.PI / 2),
          V.position.set(0, 0.14, 0.09),
          w.add(V, {
            name: "Tape (unbounded, divided into squares)",
            info: "Turing: the machine is “supplied with a tape … divided into sections (called squares) each capable of bearing a symbol”. It is unbounded (not infinite at any moment: only finitely many squares are ever non-blank) and serves as input, working memory and output. Here the tape slides so the scanned square stays under the head.",
            live: () =>
              `head at square ${t.head} · non-blank squares ${t.tape.size} · visited ${t.minX}…${t.maxX}`,
            explode: [0, -0.05, 0.35],
          }));
        for (let X of [-1, 1]) {
          let W = w.group([X * 1.5, 0.22, 0.09], {
              name:
                X < 0 ? "Tape reel ← (unbounded left)" : "Tape reel → (unbounded right)",
              info: "Stands for the endless tape. A real TM never runs out of tape: whenever the head moves past the end, a fresh blank square is there. This is what makes it more powerful than any machine with a fixed memory.",
              explode: [X * 0.4, 0, 0],
            }),
            spinGrp = new ft(),
            G = new B(new ke(0.155, 0.155, 0.18, 36), P);
          G.rotation.x = Math.PI / 2;
          spinGrp.add(G);
          for (let fz of [-0.096, 0.096]) {
            let rim = new B(new Pi(0.185, 0.01, 10, 40), br);
            rim.position.z = fz;
            spinGrp.add(rim);
            for (let sp = 0; sp < 6; sp++) {
              let spoke = new B(new te(0.35, 0.016, 0.006), br);
              spoke.rotation.z = (sp * Math.PI) / 6;
              spoke.position.z = fz;
              spinGrp.add(spoke);
            }
          }
          W.add(spinGrp);
          let le = new B(new ke(0.046, 0.046, 0.23, 24), R);
          ((le.rotation.x = Math.PI / 2), W.add(le), (W.userData.spin = spinGrp));
          let capNut = new B(new ke(0.032, 0.032, 0.025, 20), U.knurl(0xd4a84f, 0.3));
          capNut.rotation.x = Math.PI / 2;
          capNut.position.z = 0.122;
          W.add(capNut);
          let stanchion = new B(new te(0.05, 0.16, 0.05), br);
          stanchion.position.set(0, -0.07, -0.11);
          W.add(stanchion);
          Nt(
            w,
            "∞",
            0.12,
            0.12,
            [0, 0, 0.14],
            { bg: null, color: "#f4d58a", font: "bold 96px serif" },
            W,
          );
        }
        d = w.group([0, 0.14, 0.09], {
          name: "Read/write head (scanner)",
          info: "Scans exactly one square: it reads the symbol, can erase it or print a new one, and moves the tape one square left or right per step. Turing modelled it on a human “computer” with pencil and paper who can only attend to a bounded amount at once.",
          live: () =>
            `reads “${t.read()}”${t.last ? ` · last: wrote ${t.last.w}, moved ${t.last.mv}` : ""}`,
          explode: [0, 0.45, 0],
        });
        let k = new B(chamferBox(0.2, 0.22, 0.34, 0.012, 2), R);
        (k.position.set(0, 0.19, -0.05), (k.castShadow = !0), d.add(k));
        let topCap = new B(chamferBox(0.22, 0.022, 0.36, 0.005, 1), br);
        (topCap.position.set(0, 0.31, -0.05), d.add(topCap));
        for (let sx of [-0.055, 0.055]) {
          let coil = new B(new ke(0.036, 0.036, 0.09, 24), U.copper());
          coil.position.set(sx, 0.16, 0.04);
          let flangeT = new B(new ke(0.044, 0.044, 0.008, 24), br);
          flangeT.position.set(sx, 0.205, 0.04);
          let flangeB = new B(new ke(0.044, 0.044, 0.008, 24), br);
          flangeB.position.set(sx, 0.115, 0.04);
          d.add(coil, flangeT, flangeB);
        }
        let lensRing = new B(new Pi(0.052, 0.007, 10, 28), br);
        lensRing.rotation.x = Math.PI / 2;
        lensRing.position.set(0, 0.072, 0);
        let magLens = new B(new ke(0.048, 0.048, 0.01, 28), U.glass(0xe6f5ff, 0.22));
        magLens.position.set(0, 0.072, 0);
        d.add(lensRing, magLens);
        let L = new B(new pn(0.032, 0.065, 24), _);
        ((L.rotation.x = Math.PI),
          L.position.set(0, 0.042, 0),
          d.add(L),
          (h = new B(new te(0.1, 0.012, 0.1), U.glow(16757575, 0.2))),
          h.position.set(0, 0.012, 0),
          d.add(h));
        let z = new B(new te(0.11, 0.004, 0.13), U.glow(5817599, 0.6));
        (z.position.set(0, 0.004, 0), d.add(z));
        let F = w.group([0, 0.08, -0.34], {
          name: "Finite control",
          info: "The “brain” of the machine has only finitely many states. Everything unbounded lives on the tape. Each step it combines (current state, scanned symbol), looks up the one matching rule, and performs it. This finiteness is the heart of Turing's analysis.",
          explode: [0, 0, -0.3],
        });
        let vitrine = w.group([0, 0.33, -0.34], {
          name: "Control housing (glass)",
          info: "A transparent cover: use Cutaway or the layer stack to look inside the finite control.",
          shell: !0,
          explode: [0, 0.5, -0.2],
        });
        vitrine.add(new B(new te(1, 0.5, 0.42), U.glass(13625599, 0.2)));
        for (let vx of [-0.5, 0.5])
          for (let vz of [-0.21, 0.21]) {
            let post = new B(new te(0.018, 0.51, 0.018), br);
            post.position.set(vx, 0, vz);
            vitrine.add(post);
          }
        for (let vz of [-0.21, 0.21]) {
          let bar = new B(new te(1.02, 0.018, 0.018), br);
          bar.position.set(0, 0.25, vz);
          vitrine.add(bar);
        }
        l = Bt(1024, 384);
        let H = new B(chamferBox(0.45, 0.18, 0.04, 0.006, 1), _);
        (H.position.set(-0.24, 0.2, 0), F.add(H));
        let j = new B(new mt(0.42, 0.155), U.screen(l.tex));
        (j.position.set(-0.24, 0.2, 0.022),
          F.add(j),
          w.part(j, {
            name: "State register (m-configuration)",
            info: "Holds the current state, one of a finite set (Turing called them m-configurations: q₁, q₂, …). Together with the scanned symbol it forms the machine's complete “configuration” for the next step.",
            live: () =>
              `state ${t.state}${t.halted ? " (halted: " + t.reason + ")" : ""}`,
          }),
          (g._meter = buildAnalogMeter(
            w,
            [-0.02, 0.37, 0.01],
            {
              r: 0.062,
              chrome: true,
              unit: "STEP",
              name: "Step impulse galvanometer",
              info: "Moving-coil indicator deflecting with live state-transition pulse rate.",
              live: () => `${t.steps} steps executed`,
            },
            F,
          )),
          (x = []));
        let K = new ft();
        (K.position.set(0.24, 0.2, 0), F.add(K));
        for (let X = 0; X < 6; X++)
          for (let W = 0; W < 4; W++) {
            let G = new B(new te(0.07, 0.035, 0.03), U.glow(10124287, 0.05));
            (G.position.set(-0.13 + W * 0.085, 0.09 - X * 0.036, 0), K.add(G), x.push(G));
          }
        (w.part(K, {
          name: "Rule-lookup matrix",
          info: "One cell per (state, symbol) pair: the cell that lights is the single applicable rule. A deterministic TM has at most one rule per pair; if none exists the machine stops.",
          live: () =>
            t.last
              ? `fired: ${t.last.from} ${t.last.s} → ${t.last.w} ${t.last.mv} ${t.last.nx}`
              : "no rule fired yet",
        }),
          (u = new B(new Mt(0.035, 16, 12), U.glow(16728128, 0.1))),
          u.position.set(-0.45, 0.36, 0),
          F.add(u),
          w.part(u, {
            name: "Halt lamp",
            info: "Lights when the machine reaches a halting state (or finds no applicable rule). Whether it will ever light, for an arbitrary table and tape, is the halting problem: Turing proved no machine can decide it in general.",
            live: () => (t.halted ? "HALTED" : "running or ready"),
          }),
          Dt(
            w,
            [
              [0, 0.4, 0.02],
              [0, 0.55, -0.15],
              [0, 0.4, -0.3],
            ],
            0.012,
            7031322,
          ),
          (c = Bt(2048, 1280)));
        let ue = w.group([0, 0.08, -0.6], {
            name: "Transition table (the program)",
            info: "The machine's entire program: a finite table of quintuples (state, read) → (write, move, next state). Turing wrote it as columns of m-configuration, symbol, operations, final m-configuration. Edit it in the panel: as text or in the grid.",
            live: () =>
              `${t.p.rules.size} rules · ${t.p.states.length} states · ${t.p.symbols.length} symbols`,
            explode: [0, 0.2, -0.5],
          }),
          Me = new B(chamferBox(1.52, 0.97, 0.042, 0.008, 2), v);
        (Me.position.set(0, 0.56, 0), (Me.castShadow = !0), ue.add(Me));
        let trimFrame = new B(new te(1.46, 0.91, 0.044), br);
        (trimFrame.position.set(0, 0.56, 0), ue.add(trimFrame));
        let ee = new B(new mt(1.42, 0.88), U.screen(c.tex));
        (ee.position.set(0, 0.56, 0.024), ue.add(ee));
        for (let X of [-1, 1]) {
          let W = new B(chamferBox(0.055, 0.12, 0.22, 0.006, 1), br);
          (W.position.set(X * 0.65, 0.05, 0), ue.add(W));
        }
        ((g._reels = w.parts.filter((X) => X.userData.spin)), T(!0));
      },
      ui(w) {
        ((o.code = Ht(
          e,
          (v) => {
            y(v, !1);
          },
          12,
        )),
          (o.err = q("div", { class: "err" })),
          (o.grid = q("div", { style: { overflowX: "auto" } })),
          (o.tapeIn = q("input", {
            type: "text",
            value: t.p.tape,
            style: { width: "140px" },
            onkeydown: (v) => {
              (v.stopPropagation(), v.key === "Enter" && b());
            },
          })),
          (o.run = Fe(
            "▶ Run",
            () => {
              ((n = !n), t.halted && (n = !1));
            },
            "pri",
          )),
          (o.stats = Pt([
            ["st", "state"],
            ["n", "steps"],
            ["hd", "head"],
            ["ones", "1s on tape"],
            ["w", "writes"],
            ["ok", "status"],
          ])),
          (o.view = q("pre", { class: "term", style: { color: "#ffe6a8" } })),
          (o.sd = q("div", {
            class: "small",
            style: { wordBreak: "break-all" },
          })),
          w.append(
            Ie(
              "Transition table · text (state symbol -> write move next; H = halt)",
              q(
                "div",
                { class: "row" },
                "Preset ",
                st(i, i[0], (v) => {
                  ((o.code.value = To[v]), y(To[v], !0));
                }),
              ),
              o.code,
              o.err,
              q(
                "div",
                { class: "small" },
                "Directives: start: q · blank: _ · tape: 1011 · head: 0. Moves: L, R, N (stay). Halt states: H, halt, accept, reject. Any single character is a symbol.",
              ),
            ),
            Ie(
              "Transition table · grid (edit a cell like “1RB”, blank cell = no rule)",
              o.grid,
            ),
            Ie(
              "Tape & control",
              q(
                "div",
                { class: "row" },
                "Input tape ",
                o.tapeIn,
                Fe("Set tape & reset", b),
              ),
              q(
                "div",
                { class: "row" },
                o.run,
                Fe("Step", () => {
                  ((n = !1), S());
                }),
                Fe("Reset", () => {
                  ((n = !1), t.reset(o.tapeIn.value), T(!0));
                }),
              ),
              We(
                "Speed",
                -0.3,
                3.5,
                0.01,
                Math.log10(s),
                (v) => (s = 10 ** v),
                (v) => (10 ** v).toFixed(10 ** v < 10 ? 1 : 0) + " steps/s",
              ),
              o.view,
              o.stats,
            ),
            Ie(
              "Turing's standard description of this machine (§5)",
              o.sd,
              q(
                "div",
                { class: "small" },
                "Turing encoded any machine as a string over A C D L R N ;  (state qᵢ = D followed by i A's, symbol Sⱼ = D followed by j C's, S₀ = blank), then as a “description number” (A=1 C=2 D=3 L=4 R=5 N=6 ;=7). A universal machine U, given this number on its tape, imitates the machine. That is the stored-program idea, 9 years before EDVAC. (The halt state, which Turing's circle-free machines did not use, is encoded here as one extra state.)",
              ),
            ),
            Ie(
              "Why it matters",
              q("div", {
                class: "small",
                html: "<b>Church–Turing thesis:</b> every effectively calculable function is computable by a Turing machine (equivalently by Church's λ-calculus, 1936). Every machine in this lab, from the Z1 to the quantum computer, computes exactly the same class of functions; they differ in speed and memory, not in what is computable (quantum machines can be faster for some problems, not more capable).<br><b>Halting problem:</b> Turing proved that no machine can decide, for every machine and input, whether it halts. The busy beaver preset makes this concrete: Σ(n), the most 1s an n-state machine can leave before halting, grows faster than any computable function. Σ(3) = 6 and S(3) = 21 were proved by Lin & Radó (1965); S(5) = 47,176,870 was settled in 2024.<br><b>Universality:</b> Turing's 1936 universal machine was large; Minsky found a 7-state 4-symbol universal machine (1962). Wolfram's 2-state 3-symbol machine (preset) was shown universal by Alex Smith (2007) in a weaker sense: it needs an infinite non-periodic initial tape.",
              }),
            ),
          ),
          y(e, !0));
      },
      update(w) {
        if (n && !t.halted) {
          r += w * s;
          let _ = Math.min(Math.floor(r), 2e4);
          if (((r -= _), _ > 0)) {
            for (; _-- > 0 && !t.halted;) t.step();
            m();
          }
          t.halted && (n = !1);
        }
        ((p = Math.max(0, p - w * 3)),
          (h.material.emissiveIntensity = 0.2 + 2.5 * p),
          (u.material.emissiveIntensity = t.halted ? 2.5 : 0.08));
        let v = t.head,
          R = 1 - Math.exp(-w * (s > 30 ? 40 : 9));
        ((f += (v - f) * R), Math.abs(v - f) > 30 && (f = v));
        for (let _ of g._reels || []) _.userData.spin.rotation.z = -f * 0.35;
        g._meter &&
          g._meter.userData.setVal(
            t.halted ? 0.05 : Math.min(1, 0.12 + p * 0.72 + (n ? 0.16 : 0)),
          );
        T(!1);
      },
    };
  function m() {
    let w = g.diag;
    (w.pulse("tape", "head", "#e8d9a8", 2),
      w.pulse("head", "st", "#ffb347", 2),
      w.pulse("st", "tab", "#58c4ff", 2),
      w.pulse("tab", "act", "#b58cff", 2),
      w.pulse("act", "head", "#5fe08a", 2),
      (p = 1));
  }
  function S() {
    (t.step() && m(), T(!0));
  }
  function b() {
    ((n = !1), t.reset(o.tapeIn.value), T(!0));
  }
  function y(w, v) {
    let R = Bm(w);
    ((o.err.textContent = R.errors.join(`
`)),
      !R.errors.length &&
        ((e = w),
        (n = !1),
        t.load(R),
        v && o.tapeIn
          ? (o.tapeIn.value = R.tape)
          : t.reset(o.tapeIn ? o.tapeIn.value : R.tape),
        E(),
        T(!0)));
  }
  function E() {
    let w = t.p,
      v = q("table", { class: "mem" });
    v.append(
      q(
        "tr",
        {},
        q("td", {}, "state \\ read"),
        ...w.symbols.map((R) =>
          q("td", { style: { color: "#ffb347" } }, R === w.blank ? R + " (blank)" : R),
        ),
      ),
    );
    for (let R of w.states.filter((_) => !qa(_)))
      v.append(
        q(
          "tr",
          {},
          q("td", { style: { color: "#58c4ff" } }, R),
          ...w.symbols.map((_) => {
            let P = w.rules.get(R + "\0" + _),
              V = q("input", {
                type: "text",
                value: P ? P.w + P.mv + P.nx : "",
                "data-k": R + "\0" + _,
                style: { width: "62px", font: "11px ui-monospace,monospace" },
                onkeydown: (k) => k.stopPropagation(),
                onchange: (k) => M(R, _, k.target.value.trim()),
              });
            return q("td", {}, V);
          }),
        ),
      );
    ((o.grid.innerHTML = ""), o.grid.append(v));
  }
  function M(w, v, R) {
    let _ = t.p,
      P = w + "\0" + v;
    if (!R) _.rules.delete(P);
    else {
      let k = R.match(/^(\S)\s*([LRN])\s*(\S+)$/i);
      if (!k) {
        o.err.textContent = `grid (${w}, ${v}): write like 1RB = write 1, move R, go to B`;
        return;
      }
      _.rules.set(P, { q: w, s: v, w: k[1], mv: k[2].toUpperCase(), nx: k[3] });
    }
    let V = jy({ ..._, tape: o.tapeIn.value });
    ((o.code.value = V), y(V, !1));
  }
  function T(w) {
    if (!a) return;
    let v = a.ctx,
      R = 2048,
      _ = 128,
      P = 80,
      V = f - Math.floor(f),
      k = Math.floor(f);
    ((v.fillStyle = "#efe4c2"),
      v.fillRect(0, 0, R, _),
      (v.font = 'bold 62px "Courier New",monospace'),
      (v.textAlign = "center"),
      (v.textBaseline = "middle"));
    for (let H = -14; H <= 14; H++) {
      let j = k + H,
        K = R / 2 + (H - V) * P;
      ((v.strokeStyle = "#9a8a60"),
        (v.lineWidth = 3),
        v.strokeRect(K - P / 2, 8, P, _ - 16));
      let ue = t.read(j);
      (ue !== t.p.blank
        ? ((v.fillStyle = "#1a1208"), v.fillText(ue, K, _ / 2 + 2))
        : ((v.fillStyle = "rgba(80,60,30,.25)"),
          v.fillText(t.p.blank === "_" ? "" : ue, K, _ / 2 + 2)),
        j === 0 && ((v.fillStyle = "#b5651d"), v.fillRect(K - 6, _ - 14, 12, 8)));
    }
    let L = v.createLinearGradient(0, 0, R, 0);
    (L.addColorStop(0, "rgba(239,228,194,1)"),
      L.addColorStop(0.12, "rgba(239,228,194,0)"),
      L.addColorStop(0.88, "rgba(239,228,194,0)"),
      L.addColorStop(1, "rgba(239,228,194,1)"),
      (v.fillStyle = L),
      v.fillRect(0, 0, R, _),
      (v.strokeStyle = "#1f6feb"),
      (v.lineWidth = 6),
      v.strokeRect(R / 2 - P / 2 - 2, 4, P + 4, _ - 8),
      (a.tex.needsUpdate = !0));
    let z = l.ctx;
    (z.save(),
      z.scale(2, 2),
      (z.fillStyle = "#081018"),
      z.fillRect(0, 0, 512, 192),
      (z.fillStyle = "#7fd1ff"),
      (z.font = "24px ui-monospace,monospace"),
      (z.textAlign = "left"),
      z.fillText("STATE (m-configuration)", 16, 34),
      (z.font = "bold 84px ui-monospace,monospace"),
      (z.fillStyle = t.halted ? "#ff6b6b" : "#ffd166"),
      z.fillText(String(t.state).slice(0, 9), 16, 130),
      (z.font = "22px ui-monospace,monospace"),
      (z.fillStyle = "#9fb3c8"),
      z.fillText(`step ${t.steps}   reads “${t.read()}”`, 16, 176),
      z.restore(),
      (l.tex.needsUpdate = !0),
      x.forEach((H) => (H.material.emissiveIntensity = 0.05)));
    let F = t.rule();
    if (t.last) {
      let H = t.p,
        j = H.states.indexOf(t.last.from),
        K = H.symbols.indexOf(t.last.s),
        ue = x[(j % 6) * 4 + (K % 4)];
      ue && (ue.material.emissiveIntensity = 2.5);
    }
    if (((w || Math.random() < 0.25) && A(F), o.view)) {
      let H = "";
      for (let K = t.head - 16; K <= t.head + 16; K++) H += t.read(K);
      o.view.textContent =
        H +
        `
` +
        " ".repeat(16) +
        "^ head (square " +
        t.head +
        `)
` +
        (t.last
          ? `last rule: ${t.last.from} ${t.last.s} -> ${t.last.w} ${t.last.mv} ${t.last.nx}`
          : "no step yet") +
        (t.halted
          ? `
HALTED: ${t.reason}  ·  tape = ${t.str() || "(blank)"}`
          : "");
      let j = o.stats;
      if (
        (j.set("st", t.state),
        j.set("n", t.steps),
        j.set("hd", t.head),
        j.set("ones", t.count("1")),
        j.set("w", t.writes),
        j.set(
          "ok",
          t.halted
            ? t.accepted()
              ? "accepted"
              : t.state === "reject"
                ? "rejected"
                : "halted"
            : n
              ? "running"
              : "ready",
        ),
        (o.run.textContent = n ? "❚❚ Pause" : "▶ Run"),
        w)
      ) {
        let K = t.standardDescription();
        o.sd.textContent =
          "S.D. = " +
          K.sd.slice(0, 400) +
          (K.sd.length > 400 ? "…" : "") +
          `
D.N. = ` +
          K.dn.slice(0, 300) +
          (K.dn.length > 300 ? "…" : "");
      }
      o.grid
        .querySelectorAll("input")
        .forEach(
          (K) =>
            (K.style.outline =
              F && K.dataset.k === t.state + "\0" + t.read() ? "2px solid #ffb347" : ""),
        );
    }
  }
  function A(w) {
    let v = c.ctx,
      R = 1024,
      _ = 640,
      P = t.p;
    (v.save(),
      v.scale(2, 2),
      (v.fillStyle = "#f3ead2"),
      v.fillRect(0, 0, R, _),
      (v.strokeStyle = "#b59b6d"),
      (v.lineWidth = 3),
      v.strokeRect(10, 10, R - 20, _ - 20),
      (v.fillStyle = "#3a2a10"),
      (v.font = "bold 30px Georgia,serif"),
      (v.textAlign = "left"),
      v.fillText("Transition table  (state, read) → (write, move, next)", 24, 44));
    let V = [...P.rules.values()],
      k = Math.min(V.length, 16),
      L = (_ - 80) / Math.max(8, k);
    ((v.font = `${Math.min(30, L * 0.75)}px "Courier New",monospace`),
      V.slice(0, 16).forEach((z, F) => {
        let H = 70 + F * L;
        (w &&
          z.q === t.state &&
          z.s === t.read() &&
          ((v.fillStyle = "rgba(255,179,71,.55)"), v.fillRect(16, H, R - 32, L)),
          (v.fillStyle = "#1a1208"),
          v.fillText(
            `${z.q.padEnd(6)} ${z.s}   →   ${z.w}   ${z.mv}   ${z.nx}`,
            28,
            H + L * 0.75,
          ));
      }),
      V.length > 16 &&
        ((v.fillStyle = "#6a5a3a"), v.fillText(`… ${V.length - 16} more`, 28, _ - 12)),
      v.restore(),
      (c.tex.needsUpdate = !0));
  }
  return (
    (g.test = () => {
      let w = (z, F) => {
          let H = new Ha(To[z]);
          return (F !== void 0 && H.reset(F), H.run(1e5), H);
        },
        v = w("Binary increment (1011 → 1100)"),
        R = w("Unary addition (111+11 → 11111)"),
        _ = w("Busy beaver, 3 states (Σ(3) = 6)"),
        P = w("Busy beaver, 2 states (Σ(2) = 4, S(2) = 6)"),
        V = ["abba", "aba", "abab", "ab"].map(
          (z) => w("Palindrome checker (a/b)", z).state,
        ),
        k = new Ha(To["Turing's first example (1936): 0 1 0 1 …"]);
      k.run(40);
      let L = {
        increment_1011: v.str(),
        unary_111_plus_11: R.str(),
        busy_beaver3_ones: _.count("1"),
        busy_beaver3_steps: _.steps,
        busy_beaver2: [P.count("1"), P.steps],
        palindromes: V.join(","),
        turing_example: k.str().slice(0, 9),
      };
      return (
        (L.ok =
          L.increment_1011 === "1100" &&
          L.unary_111_plus_11 === "11111" &&
          L.busy_beaver3_ones === 6 &&
          L.busy_beaver3_steps === 14 &&
          P.count("1") === 4 &&
          P.steps === 6 &&
          L.palindromes === "accept,accept,reject,reject" &&
          L.turing_example === "0_1_0_1_0"),
        L
      );
    }),
    (g.isRunning = () => n),
    g
  );
}
function qm() {
  let i = Object.keys(vr),
    e = new Ua({ F: 16, words: 64 });
  ((e.pauseOnOut = !1), e.load(vr[i[0]]));
  let t = !1,
    n = 1,
    s = 0,
    r = {},
    o,
    a,
    l,
    c,
    h,
    d,
    u,
    f,
    p,
    x = !0,
    g = new Map(),
    m = Rm[i[0]],
    S = new je(),
    b = new Ae(),
    y = {
      id: "z1",
      era: "1938",
      short: "Konrad Zuse Z1",
      sim: e,
      name: "Konrad Zuse Z1 (1936–38): mechanical binary floating-point computer",
      blurb:
        "Built by Konrad Zuse in his parents' Berlin living room from about 20,000 parts, mostly thin steel plates he and friends cut by hand, the Z1 was the first freely programmable computer to use binary arithmetic and binary floating point. A bit is the position of a sliding plate; pins and rods pass motion between plates to form AND, OR, NOT and XOR. Programs came from punched 35 mm film (8 holes per instruction); numbers went in through a 4-digit decimal keyboard and came out on a decimal display. Memory and processor were separate units. There was no branching, and no way to represent zero. The original was destroyed in a 1943 air raid; Zuse rebuilt it in 1984–89 for the Deutsches Technikmuseum Berlin. This is a cycle-level simulator of its instruction set (Lu Ld Pr Ps Ls1 Ls2 Lm Li) and number format, after Raúl Rojas's analysis of the blueprints.",
      diagram: {
        nodes: [
          {
            id: "tape",
            label: `Punched film
reader (8 bit)`,
            x: 0.13,
            y: 0.2,
            w: 0.22,
            color: "#c9a45c",
          },
          {
            id: "dec",
            label: `Decoder +
microsequencer`,
            x: 0.45,
            y: 0.2,
            w: 0.24,
            color: "#ff9f43",
          },
          {
            id: "mem",
            label: `Memory
64 × 24 bit`,
            x: 0.13,
            y: 0.62,
            w: 0.22,
            color: "#58c4ff",
          },
          {
            id: "exp",
            label: `Exponent unit
(7-bit 2's comp.)`,
            x: 0.45,
            y: 0.62,
            w: 0.24,
            color: "#5fe08a",
          },
          {
            id: "man",
            label: `Mantissa unit
(20-bit ALU)`,
            x: 0.78,
            y: 0.62,
            w: 0.24,
            color: "#b58cff",
          },
          {
            id: "in",
            label: `Decimal
keyboard`,
            x: 0.78,
            y: 0.2,
            w: 0.2,
            color: "#e6edf3",
          },
          {
            id: "out",
            label: `Decimal
display`,
            x: 0.78,
            y: 0.9,
            w: 0.2,
            color: "#ffd166",
          },
          {
            id: "clk",
            label: `Cycling unit
+ motor (≈1 Hz)`,
            x: 0.3,
            y: 0.9,
            w: 0.24,
            color: "#8b98a9",
          },
        ],
        edges: [
          ["tape", "dec"],
          ["dec", "mem", "addr"],
          ["mem", "exp", "load"],
          ["exp", "man"],
          ["man", "mem", "store"],
          ["in", "man"],
          ["man", "out"],
          ["clk", "exp"],
          ["clk", "mem"],
          ["dec", "exp", "µ-ops"],
        ],
      },
      build(L) {
        let z = U.metal(11120051, 0.42),
          F = U.metal(4935509, 0.5),
          H = U.wood(),
          j = U.metal(13214282, 0.32);
        L.box(3, 0.05, 1.3, H, [0, 0.5, 0], {
          name: "Table frame",
          info: "The reconstruction sits on a frame; above the top are the computing layers, below it the synchronisation levers. The 1989 replica weighs about 1 tonne.",
        });
        for (let [he, _e] of [
          [-1.42, -0.6],
          [1.42, -0.6],
          [-1.42, 0.6],
          [1.42, 0.6],
        ])
          L.box(0.06, 0.5, 0.06, H, [he, 0.25, _e], {});
        (L.box(2.9, 0.03, 1.2, F, [0, 0.08, 0], {}),
          (d = new ut(new te(0.012, 0.32, 0.03), z, 96)),
          d.position.set(0, 0.28, 0));
        for (let he = 0; he < 96; he++)
          (S.position.set(-1.3 + (he % 48) * 0.055, 0, he < 48 ? -0.25 : 0.2),
            S.rotation.set(0, 0, 0),
            S.updateMatrix(),
            d.setMatrixAt(he, S.matrix));
        L.add(d, {
          name: "Lever “underworld” (clock distribution)",
          info: "Below the computing layers, rows of levers carry the four movements of every cycle to all parts of the machine. Rojas calls this the Z1 “underworld”: only visible from below. Imperfect synchronisation here is a main reason the replica rarely ran reliably.",
          explode: [0, -0.25, 0],
        });
        let z1Case = L.group([0, 0.98, 0], {
          name: "Display case (acrylic)",
          info: "A museum-style cover. Use Cutaway or the layers to look at the plates.",
          shell: !0,
          explode: [0, 0.9, 0],
        });
        z1Case.add(new B(new te(3, 0.9, 1.3), U.glass(14675967, 0.14)));
        let mullMat = U.darkAnodized(0x23272e);
        for (let mx of [-1.5, 1.5])
          for (let mz of [-0.65, 0.65]) {
            let post = new B(new te(0.022, 0.91, 0.022), mullMat);
            post.position.set(mx, 0, mz);
            z1Case.add(post);
          }
        for (let mz of [-0.65, 0.65]) {
          let topRail = new B(new te(3.02, 0.022, 0.022), mullMat);
          topRail.position.set(0, 0.45, mz);
          z1Case.add(topRail);
        }
        for (let mx of [-1.5, 1.5]) {
          let sideRail = new B(new te(0.022, 0.022, 1.32), mullMat);
          sideRail.position.set(mx, 0.45, 0);
          z1Case.add(sideRail);
        }
        let K = L.group([-0.75, 0.53, -0.05], {
          name: "Mechanical memory (3 banks × 8 layers = 64 words)",
          info: "Zuse's patented sliding-pin memory: each layer stores eight 8-bit words, each bank has 8 layers. Bank 1 holds the sign and 7-bit exponent, banks 2–3 the 16 stored mantissa bits: 24 bits per word on the reconstruction (the 1938 original had 16 words). A pin's position is the bit; the pins on the front show the live contents.",
          live: () =>
            `${e.mem.filter(Boolean).length} words in use · last access ${e.memAct >= 0 ? "word " + e.memAct : "—"}`,
          explode: [-0.35, 0, 0],
        });
        h = new ut(new ke(0.0035, 0.0035, 0.02, 6), U.metal(16777215, 0.3), 1536);
        for (let he = 0; he < 3; he++) {
          let _e = -0.36 + he * 0.36;
          for (let Q = 0; Q < 8; Q++) {
            let C = new B(new te(0.33, 0.006, 0.42), z);
            (C.position.set(_e, 0.04 + Q * 0.035, 0), (C.castShadow = !0), K.add(C));
          }
          for (let Q of [-0.15, 0.15])
            for (let C of [-0.19, 0.19]) {
              let I = new B(new ke(0.008, 0.008, 0.3, 8), F);
              (I.position.set(_e + Q, 0.15, C), K.add(I));
            }
        }
        ((h.rotation.x = Math.PI / 2),
          h.position.set(0, 0, 0.215),
          K.add(h),
          (y._memU = K),
          (o = Bt(512, 2048)));
        let ue = L.group([-1.3, 0.53, 0.38], {
            name: "Punched-film tape reader",
            info: "Programs were punched into discarded 35 mm cinema film, one 8-hole row per instruction (2-bit opcode + 6-bit address for loads and stores). The reader feeds one row per instruction. There are no jumps, so the program is one straight sequence (a loop needs the film glued into a ring).",
            live: () =>
              `row ${e.pc} of ${e.prog.length}${e.cur ? " · " + e.cur.src : ""}`,
            explode: [-0.3, 0, 0.3],
          }),
          Me = new B(chamferBox(0.22, 0.18, 0.16, 0.008, 2), F);
        ((Me.position.y = 0.09), (Me.castShadow = !0), ue.add(Me));
        let gatePlate = new B(new te(0.11, 0.08, 0.018), U.brass());
        gatePlate.position.set(0, 0.3, 0.072);
        ue.add(gatePlate);
        for (let pinI = 0; pinI < 8; pinI++) {
          let feeler = new B(new ke(0.0022, 0.0022, 0.028, 8), j);
          feeler.rotation.x = Math.PI / 2;
          feeler.position.set(-0.0245 + pinI * 0.007, 0.3, 0.094);
          ue.add(feeler);
        }
        let ee = new B(
          new mt(0.07, 0.56),
          new et({ map: o.tex, transparent: !0, roughness: 0.4, side: fi }),
        );
        (ee.position.set(0, 0.3, 0.085), ue.add(ee));
        for (let he of [0.04, 0.58]) {
          let _e = new B(new ke(0.06, 0.06, 0.03, 28), U.metal(7829367, 0.35));
          ((_e.rotation.x = Math.PI / 2), _e.position.set(0, he, 0.085), ue.add(_e));
          for (let rz of [-0.017, 0.017]) {
            let sprRing = new B(new ke(0.066, 0.066, 0.004, 24), U.brass());
            sprRing.rotation.x = Math.PI / 2;
            sprRing.position.set(0, he, 0.085 + rz);
            ue.add(sprRing);
          }
        }
        L.part(ee, {
          name: "35 mm program film",
          info: "Each row: 8 hole positions. Pr z = 11zzzzzz, Ps z = 10zzzzzz, and the arithmetic/IO codes 01xxx000 (the Z3 code table, which shares the Z1's scheme). The lit row is the instruction being executed.",
          live: () =>
            e.cur ? `${e.cur.src} = ${e.cur.code.toString(2).padStart(8, "0")}` : "idle",
        });
        let X = L.group([0.55, 0.53, -0.05], {
          name: "Processor (exponent + mantissa units, 12 layers)",
          info: "The arithmetic half of the machine: two adders that run continuously, an exponent unit (7-bit two's complement) and a mantissa unit (20 bits internally: 2 extra bits above and 2 guard bits below the 16 stored). Each microinstruction selects one of 12 layers of mechanical gates. Plates slide when an operation is running.",
          live: () => `R1 ${E(e.R1)} · R2 ${E(e.R2)}`,
          explode: [0.35, 0, 0],
        });
        ((c = new ut(new te(0.022, 0.006, 0.36), z, 336)), X.add(c));
        for (let [he, _e, Q] of [
          [-0.33, 0.24, "EXP"],
          [0.12, 0.56, "MANTISSA"],
        ]) {
          for (let C of [-_e / 2 - 0.02, _e / 2 + 0.02])
            for (let I of [-0.19, 0.19]) {
              let J = new B(new ke(0.008, 0.008, 0.46, 8), F);
              (J.position.set(he + C, 0.23, I), X.add(J));
            }
          Nt(L, Q, 0.2, 0.04, [he, 0.5, 0.2], { bg: "#2a2a2a", color: "#e8d9a8" }, X);
        }
        (L.part(c, {
          name: "Bit plates (sliding steel sheets)",
          info: "Each thin plate is one bit: shifted = 1, home = 0. Rods through holes couple plates of different layers; the movement passes only when the controlling plate is in the 1 position: Zuse's “mechanical relay”. Every gate turns the motion by 90°, so after four gates the motion is back in its original direction, which is why each cycle has four engagements (N, E, S, W).",
          live: () =>
            `engagement ${["IV (load)", "I (partial sums)", "II (carries)", "III (result)"][Math.floor(s * 4) % 4]}`,
        }),
          (u = L.group([-0.12, 0.62, 0.42], {
            name: "Cycling unit",
            info: "A rotating cam unit splits every clock cycle into four movements in four directions, the four “engagements”. Memory and processor each have one, coupled by a shaft. Zuse aimed for 4 Hz; the Berlin reconstruction has never run faster than about 1 Hz.",
            live: () => `cycle ${e.cycles} · engagement ${Math.floor(s * 4) % 4}`,
            explode: [0, 0.2, 0.3],
          })));
        let W = new B(new ke(0.09, 0.09, 0.05, 32), j);
        ((W.rotation.x = Math.PI / 2), u.add(W), (f = new ft()), u.add(f));
        for (let he = 0; he < 4; he++) {
          let _e = new B(new te(0.16, 0.018, 0.02), z);
          _e.position.x = 0.08;
          let Q = new ft();
          ((Q.rotation.z = (he * Math.PI) / 2),
            Q.add(_e),
            (_e.position.z = 0.035),
            f.add(Q));
        }
        let G = new B(new ke(0.012, 0.012, 1.9, 10), z);
        ((G.rotation.z = Math.PI / 2),
          G.position.set(0.25, 0.55, 0.42),
          L.add(G, {
            name: "Synchronising shaft",
            info: "Couples the cycling units of the memory half and the processor half. Rojas: the two halves could even be run separately for debugging.",
          }));
        let le = L.group([1.3, 0.53, 0.38], {
            name: "Electric motor & hand crank",
            info: "The only electrical part: a small motor (Wikipedia: from a vacuum cleaner) turns the cycling units; a hand crank allows single cycles for debugging.",
            explode: [0.35, 0, 0.2],
          }),
          motorMat = U.darkAnodized(0x282d35),
          pe = new B(new ke(0.072, 0.072, 0.19, 28), motorMat);
        ((pe.rotation.z = Math.PI / 2),
          (pe.position.y = 0.095),
          (pe.castShadow = !0),
          le.add(pe));
        for (let fin = 0; fin < 8; fin++) {
          let rib = new B(new te(0.15, 0.156, 0.005), motorMat);
          rib.rotation.x = (fin * Math.PI) / 8;
          rib.position.y = 0.095;
          le.add(rib);
        }
        let jBox = new B(chamferBox(0.06, 0.04, 0.05, 0.004, 1), F);
        jBox.position.set(-0.02, 0.175, 0);
        let cradle = new B(chamferBox(0.18, 0.024, 0.14, 0.004, 1), F);
        cradle.position.set(0, 0.012, 0);
        let beltCoupler = new B(new ke(0.028, 0.028, 0.09, 20), U.brass());
        beltCoupler.rotation.z = Math.PI / 2;
        beltCoupler.position.set(-0.12, 0.095, 0);
        le.add(jBox, cradle, beltCoupler);
        ((p = new ft()), p.position.set(0.12, 0.095, 0), le.add(p));
        let flywheel = new B(new ke(0.095, 0.095, 0.018, 32), U.brass());
        flywheel.rotation.z = Math.PI / 2;
        flywheel.position.x = -0.012;
        p.add(flywheel);
        let Ee = new B(new te(0.02, 0.14, 0.02), j);
        ((Ee.position.y = 0.07), p.add(Ee));
        let be = new B(new ke(0.016, 0.016, 0.065, 14), H);
        ((be.rotation.x = Math.PI / 2),
          be.position.set(0, 0.14, 0.035),
          p.add(be),
          (l = Bt(1024, 512)),
          (a = Bt(1024, 400)));
        let re = L.group([0.8, 0.53, 0.5], {
            name: "Decimal input keyboard",
            info: "Lu stops the machine: the operator sets four decimal digits, the decimal exponent with a lever, and the sign, then restarts it. The Z1 converts by repeated ×10 in its own floating-point unit (Rojas, Fig. 18).",
            live: () =>
              e.state === "input"
                ? "WAITING FOR OPERATOR INPUT"
                : e.lastIn
                  ? `last entry ${e.lastIn.digits} × 10^${e.lastIn.exp}`
                  : "idle",
            explode: [0.2, 0, 0.35],
          }),
          de = new B(new te(0.5, 0.06, 0.2), F);
        ((de.position.y = 0.03), re.add(de));
        let D = new B(new mt(0.48, 0.19), U.screen(l.tex));
        ((D.rotation.x = -Math.PI / 2), (D.position.y = 0.062), re.add(D));
        let $ = L.group([0.15, 0.53, 0.52], {
            name: "Decimal output display",
            info: "Ld stops the machine and shows the result register as four decimal digits with a decimal exponent, converted back by repeated ×10 (Rojas, Fig. 19). On the Z1 it is a mechanical indicator panel (the later Z3 used lamps).",
            live: () => (e.lastOut ? e.lastOut.text : "nothing shown yet"),
            explode: [0, 0.15, 0.35],
          }),
          Y = new B(new te(0.46, 0.2, 0.05), F);
        ((Y.position.y = 0.1), (Y.rotation.x = -0.4), $.add(Y));
        let se = new B(new mt(0.44, 0.17), U.screen(a.tex));
        (se.position.set(0, 0.11, 0.028),
          (se.rotation.x = -0.4),
          $.add(se),
          Nt(
            L,
            "Z1 · Konrad Zuse · Berlin 1936–38 · reconstruction 1989",
            1.2,
            0.06,
            [0, 0.526, 0.62],
            { bg: "#1c1c1c", color: "#e8d9a8", rot: [-Math.PI / 2, 0, 0] },
          ),
          (x = !0),
          _(0));
      },
      onPick(L) {
        if (
          L.userData.part &&
          /keyboard/.test(L.userData.part.name) &&
          e.state === "input" &&
          r.inNum
        )
          return (r.inNum.focus(), !1);
      },
      ui(L) {
        ((r.code = Ht(vr[i[0]], (K) => T(K), 12)),
          (r.err = q("div", { class: "err" })),
          (r.q = q("input", {
            type: "text",
            value: m,
            style: { width: "160px" },
            onkeydown: (K) => K.stopPropagation(),
            onchange: (K) => {
              m = K.target.value;
            },
          })),
          (r.inNum = q("input", {
            type: "number",
            step: "any",
            style: { width: "110px" },
            onkeydown: (K) => {
              (K.stopPropagation(), K.key === "Enter" && v());
            },
          })),
          (r.inRow = q(
            "div",
            { class: "row" },
            "Operator entry ",
            r.inNum,
            Fe("Enter (continue)", v, "pri"),
            q(
              "span",
              { class: "small" },
              "rounded to 4 significant digits like the real keyboard",
            ),
          )),
          (r.run = Fe(
            "▶ Run",
            () => {
              if (e.state === "output") {
                (e.resume(), (t = !0));
                return;
              }
              (e.halted && A(), (t = !t));
            },
            "pri",
          )),
          (r.stats = Pt([
            ["pc", "film row"],
            ["op", "instruction"],
            ["cy", "cycle"],
            ["tot", "cycles total"],
            ["t", "machine time @1 Hz"],
            ["st", "status"],
          ])),
          (r.regs = q("pre", { class: "term", style: { color: "#e8d9a8" } })),
          (r.out = q("pre", {
            class: "term",
            style: { color: "#ffd166", maxHeight: "90px" },
          })),
          (r.mem = q("pre", {
            class: "term",
            style: { color: "#9fd0ff", maxHeight: "140px" },
          })),
          (r.flag = q("div", { class: "err" })));
        let z = st(
            [
              [
                16,
                "24-bit word: sign + 7 exp + 16 fraction (Rojas, reconstruction blueprints)",
              ],
              [
                14,
                "22-bit word: sign + 7 exp + 14 fraction (figure in older literature)",
              ],
            ],
            16,
            (K) => {
              (e.setFormat(+K), A(), (x = !0));
            },
          ),
          F = st(
            [
              [64, "64 words (1989 reconstruction)"],
              [16, "16 words (1938 original)"],
            ],
            64,
            (K) => {
              ((e.words = +K),
                (e.mem = Array(e.words).fill(null)),
                T(r.code.value),
                (x = !0));
            },
          ),
          H = q("input", {
            type: "checkbox",
            onchange: (K) => {
              ((e.z3 = K.target.checked), T(r.code.value));
            },
          }),
          j = q("input", {
            type: "checkbox",
            onchange: (K) => {
              e.pauseOnOut = K.target.checked;
            },
          });
        (L.append(
          Ie(
            "Program on punched film (one instruction per row)",
            q(
              "div",
              { class: "row" },
              "Preset ",
              st(i, i[0], (K) => {
                ((r.code.value = vr[K]), (r.q.value = m = Rm[K]), T(vr[K]));
              }),
            ),
            r.code,
            r.err,
            q("div", {
              class: "small",
              html:
                Object.entries(jn)
                  .map(
                    ([K, ue]) =>
                      `<b>${K}${K === "Pr" || K === "Ps" ? " z" : ""}</b> ${ue.d}`,
                  )
                  .join("<br>") +
                "<br>Registers: the first load goes to R1, the second to R2; an operation leaves its result in R1. No jumps or conditionals: the Z1 just runs the film.",
            }),
          ),
          Ie(
            "Operator",
            q(
              "div",
              { class: "row" },
              "Keyboard queue ",
              r.q,
              q("span", { class: "small" }, "values typed in at each Lu, in order"),
            ),
            r.inRow,
            q(
              "div",
              { class: "row" },
              r.run,
              Fe("Cycle", () => {
                ((t = !1), R());
              }),
              Fe("Instruction", () => {
                t = !1;
                let K = e.pc,
                  ue = 0;
                for (; e.pc === K && ue++ < 50 && R(););
              }),
              Fe("Reset", A),
            ),
            We(
              "Clock",
              -0.6,
              3,
              0.01,
              0,
              (K) => (n = 10 ** K),
              (K) => {
                let ue = 10 ** K;
                return (
                  (ue < 10 ? ue.toFixed(2) : ue.toFixed(0)) +
                  " Hz" +
                  (Math.abs(ue - 1) < 0.05
                    ? " (replica)"
                    : Math.abs(ue - 4) < 0.2
                      ? " (Zuse's target)"
                      : "")
                );
              },
            ),
            q(
              "div",
              { class: "row" },
              q("label", {}, j, " stop at every Ld (like the real machine)"),
              q("label", {}, H, " Z3 extension (allow Lw √)"),
            ),
            q("div", { class: "row" }, "Word ", z),
            q("div", { class: "row" }, "Memory ", F),
            r.stats,
            r.flag,
          ),
          Ie(
            "Registers (sign | exponent | fraction, hidden leading 1 not stored)",
            r.regs,
          ),
          Ie("Decimal display log", r.out),
          Ie("Memory (words in use)", r.mem),
        ),
          T(r.code.value));
      },
      update(L) {
        if (t) {
          s += L * n;
          let z = Math.min(Math.floor(s), 5e3);
          for (s -= z; z-- > 0;)
            if (!R(!0)) {
              (e.state !== "input" && (t = !1), (s = 0));
              break;
            }
        }
        _(L);
      },
    },
    E = (L) => (L ? (L.zero ? "0 (!)" : (+L.value().toPrecision(6)).toString()) : "—");
  function M(L) {
    if (!L) return "(empty)";
    let z = L.bits();
    return `${z.s} | ${z.e7.toString(2).padStart(7, "0")} | ${z.frac.toString(2).padStart(z.F, "0")}`;
  }
  function T(L) {
    let z = e.load(L);
    (r.err &&
      (r.err.textContent = z.errors.join(`
`)),
      !z.errors.length && A());
  }
  function A() {
    ((t = !1), e.reset(), (e.inq = []), (e.flag = ""), w(), (x = !0), (s = 0));
  }
  function w() {
    e.inq = (r.q ? r.q.value : m)
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number)
      .filter((L) => isFinite(L));
  }
  function v() {
    let L = parseFloat(r.inNum.value);
    isFinite(L) &&
      (e.provide(L), (r.inNum.value = ""), y.diag.pulse("in", "man", "#ffffff", 3));
  }
  function R(L) {
    if (e.state === "output")
      if (!L) e.resume();
      else return !1;
    let z = e.done,
      F = e.cycle(),
      H = y.diag,
      j = e.cur || e.prog[e.pc - 1];
    return (
      e.memAct >= 0 && (g.set(e.memAct, 1), (x = !0)),
      j &&
        (H.pulse("clk", "exp", "#8b98a9", 1),
        (e.cyc === 1 || !e.cur) && H.pulse("tape", "dec", "#c9a45c", 2),
        /Pr/.test(j.op) && H.pulse("mem", "exp", "#58c4ff", 2),
        /Ps/.test(j.op) && H.pulse("man", "mem", "#58c4ff", 2),
        /L[smi]/.test(j.op) &&
          (H.pulse("dec", "exp", "#ff9f43", 2), H.pulse("exp", "man", "#5fe08a", 2)),
        j.op === "Ld" && e.done > z && H.pulse("man", "out", "#ffd166", 4)),
      e.done > z && e.prog[e.pc - 1] && e.prog[e.pc - 1].op === "Ps" && (x = !0),
      F || e.state === "output"
    );
  }
  function _(L) {
    if (!o) return;
    let z = performance.now() / 1e3,
      F = t || e.cur,
      H = (e.cycles + s) % 1,
      j = Math.floor(H * 4),
      K = e.cur ? e.cur.op : "",
      ue = e.R1 && !e.R1.zero ? e.R1 : null,
      Me = e.R2 && !e.R2.zero ? e.R2 : null,
      ee = 0;
    for (let X = 0; X < 12; X++)
      for (let W = 0; W < 28; W++) {
        let G = W < 8,
          le = G ? -0.33 - 0.105 + W * 0.03 : 0.12 - 0.27 + (W - 8) * 0.0285,
          pe = 0;
        if (G)
          pe = ((ue ? (((ue.e % 128) + 128) % 128) | (ue.s << 7) : 0) >> (7 - W)) & 1;
        else {
          let re = X % 2 && Me ? Me : ue;
          pe = re ? Math.floor((re.m * 4) / 2 ** (19 - (W - 8))) % 2 : 0;
        }
        let Ee = /L[smiw]/.test(K) && X === (e.cyc + j) % 12,
          be = pe * 0.012 + (Ee ? 0.012 * Math.sin(H * Math.PI * 2) : 0);
        (S.position.set(le, 0.03 + X * 0.038, be * (X % 2 ? 1 : -1)),
          S.rotation.set(0, 0, 0),
          S.updateMatrix(),
          c.setMatrixAt(ee, S.matrix),
          c.setColorAt(
            ee,
            b.set(Ee ? (pe ? 16762219 : 10466248) : pe ? 14206608 : 10133672),
          ),
          ee++);
      }
    ((c.instanceMatrix.needsUpdate = !0), (c.instanceColor.needsUpdate = !0));
    for (let X = 0; X < 96; X++)
      (S.position.set(
        -1.3 + (X % 48) * 0.055,
        F ? 0.012 * Math.sin((H + X / 4) * Math.PI * 2) : 0,
        X < 48 ? -0.25 : 0.2,
      ),
        S.rotation.set(0, 0, F ? 0.08 * Math.sin((H + (X % 4) / 4) * Math.PI * 2) : 0),
        S.updateMatrix(),
        d.setMatrixAt(X, S.matrix));
    ((d.instanceMatrix.needsUpdate = !0),
      (f.rotation.z = -(e.cycles + s) * Math.PI * 2),
      (p.rotation.x = -(e.cycles + s) * Math.PI * 2));
    for (let [X, W] of g) {
      let G = W - L * 1.2;
      (G <= 0 ? g.delete(X) : g.set(X, G), (x = !0));
    }
    if ((x && (P(), (x = !1)), (Math.random() < 0.3 || !L) && (V(), k(z)), r.regs)) {
      let X = e.cur,
        W = r.stats;
      (W.set("pc", `${e.pc}/${e.prog.length}`),
        W.set("op", X ? X.src : "—"),
        W.set("cy", X ? `${e.cyc}/${jn[X.op].cyc}` : "—"),
        W.set("tot", e.cycles),
        W.set("t", e.cycles + " s"),
        W.set(
          "st",
          e.state === "input"
            ? "WAIT: input"
            : e.state === "output"
              ? "WAIT: output"
              : e.halted
                ? "end of film"
                : t
                  ? "running"
                  : "stopped",
        ),
        (r.run.textContent = t ? "❚❚ Stop" : "▶ Run"),
        (r.inRow.style.outline = e.state === "input" ? "2px solid #ffb347" : ""),
        (r.flag.textContent = e.flag ? "⚠ " + e.flag : ""));
      let G = `R1 = ${E(e.R1).padEnd(12)} ${M(e.R1)}
R2 = ${E(e.R2).padEnd(12)} ${M(e.R2)}`;
      r.regs.textContent !== G && (r.regs.textContent = G);
      let le =
        e.out.map((Ee, be) => `#${be + 1}  ${Am(Ee).text}   (= ${E(Ee)})`).join(`
`) || "(no Ld yet)";
      r.out.textContent !== le && (r.out.textContent = le);
      let pe =
        e.mem
          .map((Ee, be) =>
            Ee ? `word ${String(be).padStart(2)}: ${E(Ee).padEnd(11)} ${M(Ee)}` : null,
          )
          .filter(Boolean).join(`
`) || "(empty)";
      r.mem.textContent !== pe && (r.mem.textContent = pe);
    }
  }
  function P() {
    let L = 0,
      z = e.F;
    for (let F = 0; F < 3; F++)
      for (let H = 0; H < 8; H++)
        for (let j = 0; j < 64; j++) {
          let K = H * 8 + Math.floor(j / 8),
            ue = 7 - (j % 8),
            Me = K < e.words ? e.mem[K] : null,
            ee = 0;
          if (Me) {
            let W = Me.bits();
            if (F === 0) ee = (((W.s << 7) | W.e7) >> ue) & 1;
            else {
              let G = F === 1 ? 8 + ue : ue;
              ee = G < z ? Math.floor(W.frac / 2 ** G) % 2 : 0;
            }
          }
          let X = g.get(K) || 0;
          (S.position.set(
            -0.36 + F * 0.36 - 0.155 + j * 0.005,
            ee ? 0.012 : 0,
            -(0.04 + H * 0.035),
          ),
            S.rotation.set(0, 0, 0),
            S.updateMatrix(),
            h.setMatrixAt(L, S.matrix),
            h.setColorAt(
              L,
              b.set(K >= e.words ? 3355443 : X > 0 ? 16757575 : ee ? 14267482 : 3948872),
            ),
            L++);
        }
    ((h.instanceMatrix.needsUpdate = !0), (h.instanceColor.needsUpdate = !0));
  }
  function V() {
    let L = o.ctx,
      z = 256,
      F = 1024,
      H = 48;
    (L.save(),
      L.scale(2, 2),
      L.clearRect(0, 0, z, F),
      (L.fillStyle = "rgba(120,96,60,.85)"),
      L.fillRect(0, 0, z, F));
    for (let K = 8; K < F; K += 32)
      ((L.fillStyle = "#111"), L.fillRect(8, K, 18, 14), L.fillRect(z - 26, K, 18, 14));
    let j = F / 2;
    for (let K = -10; K <= 10; K++) {
      let ue = e.pc + K,
        Me = j + K * H;
      if (ue < 0 || ue >= e.prog.length) continue;
      let ee = e.prog[ue];
      K === 0 &&
        ((L.fillStyle = "rgba(255,200,80,.55)"), L.fillRect(30, Me - H / 2, z - 60, H));
      for (let X = 0; X < 8; X++) {
        let W = (ee.code >> (7 - X)) & 1;
        ((L.fillStyle = W ? "#0a0a0a" : "rgba(60,45,25,.35)"),
          L.beginPath(),
          L.arc(46 + X * 23, Me, W ? 8 : 3, 0, 7),
          L.fill());
      }
    }
    (L.restore(), (o.tex.needsUpdate = !0));
  }
  function k(L) {
    let z = a.ctx;
    (z.save(),
      z.scale(2, 2),
      (z.fillStyle = "#14110c"),
      z.fillRect(0, 0, 512, 200),
      (z.fillStyle = "#9a8a60"),
      (z.font = "22px ui-monospace,monospace"),
      z.fillText("OUTPUT (Ld)", 16, 30));
    let F = e.lastOut;
    ((z.font = 'bold 72px "Courier New",monospace'),
      (z.fillStyle = "#ffd166"),
      z.fillText(
        F
          ? (F.neg ? "−" : " ") +
              (F.digits || "----").padEnd(4, "0").slice(0, 4).split("").join(" ")
          : " - - - -",
        16,
        120,
      ),
      (z.font = "30px ui-monospace,monospace"),
      z.fillText(F ? `× 10^${F.exp - 3}` : "", 330, 120),
      (z.font = "20px ui-monospace,monospace"),
      (z.fillStyle = "#9a8a60"),
      z.fillText(F ? F.text : "waiting for Ld", 16, 176),
      z.restore(),
      (a.tex.needsUpdate = !0),
      (z = l.ctx),
      z.save(),
      z.scale(2, 2),
      (z.fillStyle = "#1b1b1b"),
      z.fillRect(0, 0, 512, 256));
    let H = e.lastIn ? e.lastIn.digits : "0000";
    ((z.font = "22px ui-monospace,monospace"),
      (z.fillStyle =
        e.state === "input" && Math.floor(L * 2) % 2 ? "#ffb347" : "#9a8a60"),
      z.fillText(e.state === "input" ? "Lu: ENTER A NUMBER" : "INPUT (Lu)", 16, 30));
    for (let j = 0; j < 4; j++) {
      for (let K = 0; K < 10; K++)
        ((z.fillStyle = String(K) === H[j] ? "#ffd166" : "#3a3a3a"),
          z.fillRect(24 + j * 70, 50 + K * 19, 50, 15));
      ((z.fillStyle = "#e8d9a8"),
        (z.font = "bold 26px ui-monospace,monospace"),
        z.fillText(H[j], 40 + j * 70, 250));
    }
    ((z.fillStyle = "#9a8a60"),
      (z.font = "20px ui-monospace,monospace"),
      z.fillText("exp lever", 320, 70),
      (z.fillStyle = "#ffd166"),
      (z.font = "bold 40px ui-monospace,monospace"),
      z.fillText(e.lastIn ? String(e.lastIn.exp) : "0", 340, 120),
      (z.font = "20px ui-monospace,monospace"),
      (z.fillStyle = "#9a8a60"),
      z.fillText("sign " + (e.lastIn && e.lastIn.sign ? "−" : "+"), 320, 170),
      z.restore(),
      (l.tex.needsUpdate = !0));
  }
  return (
    (y.test = () => {
      let L = {},
        z = !0;
      for (let F of [16, 14]) {
        let H = (be) => Zt.from(be, F),
          j = 2 ** -F,
          K = (be, re) => Math.abs(be - re) / Math.abs(re),
          ue = [
            [1.5, 2.25],
            [3.1416, 2.7183],
            [10, -3.5],
          ],
          Me = [
            [3, 7],
            [1.1, 1.1],
            [-2.5, 0.4],
          ],
          ee = Math.max(
            ...ue.map(([be, re]) =>
              K(ka(H(be), H(re)).value(), H(be).value() + H(re).value()),
            ),
          ),
          X = Math.max(
            ...Me.map(([be, re]) =>
              K(Sc(H(be), H(re)).value(), H(be).value() * H(re).value()),
            ),
          ),
          W = K(a0(H(1), H(3)).value(), 1 / 3),
          G = new Ua({ F });
        (G.load(vr["(a + b) × c"]), (G.inq = [2, 3, 4]), G.run());
        let le = G.out[0] ? G.out[0].value() : null,
          pe = new Ua({ F });
        (pe.load(vr["Polynomial x² − 2x + 3"]), (pe.inq = [5, 2, 3]), pe.run());
        let Ee = F === 16 ? "w24" : "w22";
        ((L[Ee] = {
          add_1p5_2p25: ka(H(1.5), H(2.25)).value(),
          add_err_ulp: +(ee / j).toFixed(3),
          mul_3x7: Sc(H(3), H(7)).value(),
          mul_err_ulp: +(X / j).toFixed(3),
          div_err_ulp: +(W / j).toFixed(3),
          prog_a_plus_b_times_c: le,
          poly_x5: pe.out[0] && pe.out[0].value(),
          cycles: G.cycles,
        }),
          (z =
            z &&
            L[Ee].add_1p5_2p25 === 3.75 &&
            ee < j &&
            L[Ee].mul_3x7 === 21 &&
            X < j &&
            W < 2 * j &&
            le === 20 &&
            L[Ee].poly_x5 === 18));
      }
      return (
        (L.lw_rejected_on_z1 = Tm("Lw").errors.length === 1),
        (L.zero_flagged = !!ka(Zt.from(2, 16), Zt.from(2, 16), !0).flag),
        (L.ok = z && L.lw_rejected_on_z1 && L.zero_flagged),
        L
      );
    }),
    (y.isRunning = () => t),
    y
  );
}
var Gm = {
    sin: Math.sin,
    cos: Math.cos,
    exp: Math.exp,
    abs: Math.abs,
    sqrt: Math.sqrt,
    min: Math.min,
    max: Math.max,
    sign: Math.sign,
    tanh: Math.tanh,
    atan: Math.atan,
    log: Math.log,
    pi: Math.PI,
    sq: (i) => i * i,
    step: (i) => (i >= 0 ? 1 : 0),
    limit: (i, e, t) => Math.max(e, Math.min(t, i)),
  },
  Hm = 100;
function MA(i) {
  let e = [],
    t = [],
    n = [],
    s = [],
    r = [],
    o = null,
    a = 20;
  i.split(
    `
`,
  ).forEach((u, f) => {
    let p = u.replace(/#.*/, "").trim();
    if (!p) return;
    let x;
    (x = p.match(
      /^param\s+([a-zA-Z_]\w*)\s*=\s*(-?[\d.e+-]+)(?:\s+(-?[\d.]+)\s*\.\.\s*(-?[\d.]+))?$/,
    ))
      ? e.push({
          name: x[1],
          value: +x[2],
          min: x[3] != null ? +x[3] : Math.min(0, +x[2] * 2),
          max: x[4] != null ? +x[4] : Math.max(1, +x[2] * 2),
        })
      : (x = p.match(/^int\s+([a-zA-Z_]\w*)\s*\((.*)\)\s*=\s*(.+)$/))
        ? t.push({ name: x[1], init: x[2], expr: x[3], line: f + 1 })
        : (x = p.match(/^out\s+([a-zA-Z_]\w*)\s*=\s*(.+)$/))
          ? n.push({ name: x[1], expr: x[2], line: f + 1 })
          : (x = p.match(/^plot\s+(.+)$/))
            ? s.push(...x[1].split(/[\s,]+/).filter(Boolean))
            : (x = p.match(/^phase\s+(\w+)[\s,]+(\w+)$/))
              ? (o = [x[1], x[2]])
              : (x = p.match(/^time\s+([\d.]+)$/))
                ? (a = +x[1])
                : r.push(`line ${f + 1}: cannot parse "${p}"`);
  });
  let l = new Set([
      "t",
      ...e.map((u) => u.name),
      ...t.map((u) => u.name),
      ...n.map((u) => u.name),
    ]),
    // Expression whitelist (REVIEW-v5 I8): only numbers, names, arithmetic/comparison operators,
    // parentheses, commas and ?: may reach new Function. Anything else ([ ] ! " ' ` ; { } = .member
    // access) is rejected, so JSFuck-style payloads can't be compiled.
    c = (u, f) => {
      const rest = String(u).replace(
        /[A-Za-z_]\w*|\d+(?:\.\d*)?(?:e[-+]?\d+)?|\.\d+(?:e[-+]?\d+)?|\*\*|<=|>=|==|!=|&&|\|\||[-+*/%(),?:<>\s]/g,
        "",
      );
      if (rest) {
        r.push(`line ${f}: illegal character(s) ${JSON.stringify(rest.slice(0, 8))}`);
        return "0";
      }
      return cNames(u, f);
    },
    cNames = (u, f) =>
      u.replace(/[a-zA-Z_]\w*/g, (p) =>
        l.has(p)
          ? `S.${p}`
          : Object.prototype.hasOwnProperty.call(Gm, p)
            ? `F.${p}`
            : /^e\d*$/.test(p)
              ? p
              : (r.push(`line ${f}: unknown name "${p}"`), "0"),
      ),
    h = null,
    d = null;
  try {
    let u = [
      ...n.map((f) => `S.${f.name}=${c(f.expr, f.line)};`),
      ...t.map((f, p) => `D[${p}]=${c(f.expr, f.line)};`),
    ].join(`
`);
    ((h = new Function("S", "F", "D", u)),
      (d = new Function(
        "S",
        "F",
        t.map((f) => `S.${f.name}=${c(f.init || "0", f.line)};`).join(`
`),
      )));
  } catch (u) {
    r.push("syntax: " + u.message);
  }
  return (
    s.length || s.push(...t.map((u) => u.name).slice(0, 3)),
    {
      params: e,
      ints: t,
      outs: n,
      plots: s,
      phase: o,
      tmax: a,
      errors: r,
      deriv: h,
      initF: d,
      names: [...l],
    }
  );
}
var kc = class {
    constructor() {
      ((this.dt = 0.002),
        (this.overload = new Set()),
        (this.patch = null),
        (this.S = {}),
        (this.paramValues = {}));
    }
    load(e) {
      let t = MA(e);
      if (t.errors.length) return t.errors;
      for (let n of t.params)
        (this.paramValues[n.name] === void 0 ||
          this.patch?.params.find((s) => s.name === n.name)?.value !== n.value) &&
          (this.paramValues[n.name] = n.value);
      return ((this.patch = t), this.reset(), []);
    }
    reset() {
      let e = this.patch;
      ((this.t = 0), (this.S = { t: 0 }), this.overload.clear(), (this.history = []));
      for (let t of e.params) this.S[t.name] = this.paramValues[t.name];
      for (let t of e.outs) this.S[t.name] = 0;
      (e.initF(this.S, Gm),
        (this.y = e.ints.map((t) => this.S[t.name])),
        (this.D = new Float64Array(e.ints.length)),
        this.evalAt(this.y, 0),
        this.record());
    }
    setParam(e, t) {
      ((this.paramValues[e] = t), (this.S[e] = t));
    }
    evalAt(e, t) {
      let n = this.patch,
        s = this.S;
      return (
        (s.t = t),
        n.ints.forEach((r, o) => (s[r.name] = e[o])),
        n.deriv(s, Gm, this.D),
        Array.from(this.D)
      );
    }
    step() {
      let e = this.dt,
        t = this.y,
        n = this.t,
        s = this.evalAt(t, n),
        r = this.evalAt(
          t.map((l, c) => l + (e / 2) * s[c]),
          n + e / 2,
        ),
        o = this.evalAt(
          t.map((l, c) => l + (e / 2) * r[c]),
          n + e / 2,
        ),
        a = this.evalAt(
          t.map((l, c) => l + e * o[c]),
          n + e,
        );
      ((this.y = t.map((l, c) => {
        let h = l + (e / 6) * (s[c] + 2 * r[c] + 2 * o[c] + a[c]);
        return (
          (!isFinite(h) || Math.abs(h) > Hm) &&
            (this.overload.add(this.patch.ints[c].name),
            (h = Math.max(-Hm, Math.min(Hm, isFinite(h) ? h : 0)))),
          h
        );
      })),
        (this.t += e),
        this.evalAt(this.y, this.t));
    }
    run(e) {
      let t = Math.round(e / this.dt);
      for (let n = 0; n < t; n++) (this.step(), n % 5 === 0 && this.record());
    }
    record() {
      let e = { t: this.t };
      for (let t of this.patch.plots) e[t] = this.S[t];
      if (this.patch.phase) for (let t of this.patch.phase) e[t] = this.S[t];
      (this.history.push(e), this.history.length > 6e3 && this.history.shift());
    }
    value(e) {
      return this.S[e];
    }
  },
  Ga = {
    "Damped spring (mass-spring-damper)": `# Mass-spring-damper:  m·x'' + c·x' + k·x = F·sin(w·t)
# Two integrators in a loop, the classic analog-computer patch.
param m = 1    0.1..5     # mass         (coefficient pot)
param c = 0.4  0..4       # damping
param k = 4    0..40      # spring stiffness
param F = 0    0..10      # drive amplitude
param w = 2    0.1..8     # drive frequency (rad/s)
out a    = (F*sin(w*t) - c*v - k*x) / m   # summing amplifier
int v(0) = a      # integrator #1: acceleration -> velocity
int x(1) = v      # integrator #2: velocity -> displacement
plot x v
phase x v
time 20`,
    "Van der Pol oscillator (tube oscillator!)": `# Van der Pol: x'' - mu(1-x^2)x' + x = 0  (models a triode oscillator)
param mu = 1.5 0..6
out a = mu*(1 - x*x)*v - x     # needs a servo multiplier for x*x*v
int v(0) = a
int x(0.5) = v
plot x v
phase x v
time 30`,
    "Lorenz attractor (chaos)": `# Lorenz 1963 (first found on a digital machine, classic on analog ones)
param sigma = 10 0..20
param rho = 28 0..50
param beta = 2.667 0..5
int x(1) = sigma*(y - x)
int y(1) = x*(rho - z) - y
int z(1) = x*y - beta*z
plot x z
phase x z
time 40`,
    "Predator-prey (Lotka–Volterra)": `# Rabbits r and foxes f
param a = 1.1 0..3
param b = 0.4 0..1
param d = 0.4 0..1
param g = 0.1 0..1
int r(10) = a*r - b*r*f
int f(10) = g*r*f - d*f
plot r f
phase r f
time 50`,
    "Ballistic shell with drag (1940s firing table)": `# The WWII job: projectile trajectories for firing tables
param v0 = 30 5..60
param ang = 45 5..85
param drag = 0.02 0..0.2
out sp = sqrt(vx*vx + vy*vy)
int vx(v0*cos(ang*pi/180)) = -drag*sp*vx
int vy(v0*sin(ang*pi/180)) = -9.81 - drag*sp*vy
int px(0) = vx
int py(0) = vy * step(py + 0.001)
plot py vx
phase px py
time 7`,
  };
function Wm() {
  let i = new kc(),
    e = !0,
    t = 1,
    n = null,
    s = {},
    r = [],
    o = [],
    a,
    l,
    c,
    h,
    d = {},
    u = ["#5fe08a", "#ffd166", "#58c4ff", "#ff6b6b"],
    f = {
      id: "analog",
      era: "1940s",
      short: "Analog computer",
      sim: i,
      name: "Electronic Analog Computer (REAC / M9-director lineage)",
      blurb:
        "Before digital, engineers computed with voltages. Vacuum-tube DC amplifiers wired as integrators and summers, scaled by coefficient potentiometers, are patched together so their voltages obey the same differential equation as the physical system. The machine does not step through instructions: it IS the equation, solved continuously and in parallel. Edit the patch below; it is compiled into the amplifier network and solved live (RK4 stands in for the continuous electronics).",
      diagram: {
        nodes: [
          {
            id: "pot",
            label: `Coefficient
pots`,
            x: 0.12,
            y: 0.25,
            w: 0.18,
            color: "#ffd166",
          },
          {
            id: "sum",
            label: `Summing
amp Σ`,
            x: 0.36,
            y: 0.25,
            w: 0.17,
            color: "#ffb347",
          },
          {
            id: "i1",
            label: `Integrator 1
∫ (−1/RC)`,
            x: 0.6,
            y: 0.25,
            w: 0.2,
            color: "#ff7a1a",
          },
          {
            id: "i2",
            label: `Integrator 2
∫ (−1/RC)`,
            x: 0.6,
            y: 0.72,
            w: 0.2,
            color: "#ff7a1a",
          },
          {
            id: "crt",
            label: `CRT +
X-Y plotter`,
            x: 0.87,
            y: 0.72,
            w: 0.2,
            color: "#5fe08a",
          },
          {
            id: "ps",
            label: `±100 V ref
supply`,
            x: 0.14,
            y: 0.72,
            w: 0.2,
            color: "#8b98a9",
          },
          {
            id: "fb",
            label: `patch cords
(feedback)`,
            x: 0.36,
            y: 0.72,
            w: 0.18,
            color: "#c08cff",
          },
        ],
        edges: [
          ["pot", "sum", "k·x"],
          ["sum", "i1", "x''"],
          ["i1", "i2", "x'"],
          ["i2", "crt", "x"],
          ["i2", "fb"],
          ["fb", "sum"],
          ["i1", "sum"],
          ["ps", "pot"],
          ["i1", "crt"],
        ],
      },
      build(M) {
        let T = U.plastic(7107692, 0.75),
          A = U.plastic(2830124, 0.6);
        (M.box(0.04, 1.6, 0.7, T, [-1.2, 0.8, 0], {
          name: "Cabinet side panel",
          info: "Steel relay-rack cabinet with grey crackle enamel. Holds about a dozen tube amplifier chassis, the patch bay and power supplies. Cutaway hides it.",
          shell: !0,
          explode: [-0.6, 0, 0],
        }),
          M.box(0.04, 1.6, 0.7, T, [1.2, 0.8, 0], {
            name: "Cabinet side panel",
            info: "Steel relay-rack side panel.",
            shell: !0,
            explode: [0.6, 0, 0],
          }),
          M.box(2.44, 0.04, 0.7, T, [0, 1.6, 0], {
            name: "Cabinet top",
            info: "Top cover with louvres: ~40 tubes × ~5 W of filament + plate power had to escape by convection.",
            shell: !0,
            explode: [0, 0.5, 0],
          }),
          M.box(2.36, 1.56, 0.03, T, [0, 0.8, -0.34], {
            name: "Rear panel",
            info: "Rear access panel.",
            shell: !0,
            explode: [0, 0, -0.5],
          }),
          M.box(2.36, 0.7, 0.03, T, [0, 0.42, 0.34], {
            name: "Amplifier bay door",
            info: "Ventilated door over the DC-amplifier bay. Toggle Cutaway to look inside at the operational amplifiers.",
            shell: !0,
            explode: [0, 0, 0.6],
          }),
          M.box(2.4, 0.06, 0.7, A, [0, 0.03, 0], {}));
        let w = M.box(2.2, 0.6, 0.04, U.plastic(1973790, 0.5), [0, 1.22, 0.33], {
            name: "Patch bay",
            info: `The "program": hundreds of jacks wired to every amplifier input/output, pot and function generator. Patch cords define the equation's topology — reprogramming meant re-plugging. Your text patch below plays this role; each "int" or "out" line is one amplifier in the loop.`,
          }),
          v = new ke(0.014, 0.014, 0.02, 10);
        v.rotateX(Math.PI / 2);
        let R = new ut(v, U.metal(13680784, 0.3), 108),
          _ = new je(),
          P = 0;
        for (let X = 0; X < 6; X++)
          for (let W = 0; W < 18; W++)
            (_.position.set(-1.02 + W * 0.12, -0.24 + X * 0.096, 0.03),
              _.updateMatrix(),
              R.setMatrixAt(P++, _.matrix));
        w.add(R);
        let V = (X, W) => [-1.02 + X * 0.12, 1.22 - 0.24 + W * 0.096, 0.37],
          k = (X, W, G) => {
            let le = V(...X),
              pe = V(...W);
            Dt(
              M,
              [le, [(le[0] + pe[0]) / 2, Math.min(le[1], pe[1]) - 0.12, 0.47], pe],
              0.008,
              G,
              {},
            );
          };
        (k([1, 1], [5, 3], 12597547),
          k([5, 2], [9, 4], 1118481),
          k([9, 1], [13, 3], 15844367),
          k([13, 2], [2, 4], 3049182),
          k([10, 0], [16, 2], 12597547),
          k([3, 5], [11, 5], 2600544),
          Nt(M, "ELECTRONIC ANALOG COMPUTER", 1, 0.07, [0, 1.56, 0.36], {
            bg: "#1e1e1e",
            color: "#e8dcb5",
          }));
        for (let X = 0; X < 8; X++) {
          let W = Om(M, [-0.88 + X * 0.25, 0.85, 0.35], {
            r: 0.045,
            name: "Coefficient potentiometer " + (X + 1),
            info: 'Precision 10-turn wire-wound potentiometer ("helipot"). Multiplies a voltage by a constant 0…1 — this is how coefficients like k/m or c/m enter the equation. Linked to the param sliders: turning a slider turns this dial.',
            live: () => {
              let G = i.patch?.params[X];
              return G
                ? `${G.name} = ${i.paramValues[G.name].toFixed(3)}`
                : "(unpatched)";
            },
          });
          (o.push(W),
            Nt(M, "P" + (X + 1), 0.06, 0.03, [-0.88 + X * 0.25, 0.92, 0.352], {
              bg: null,
              color: "#eee",
            }));
        }
        for (let X = 0; X < 6; X++) {
          let W = -0.95 + X * 0.38,
            G = M.group([W, 0.12, 0], {
              name: "DC operational amplifier #" + (X + 1),
              info: "High-gain (~10⁴–10⁵) direct-coupled vacuum-tube amplifier with a drift-reducing chopper. With a capacitor in feedback it integrates (Vout = −1/RC ∫Vin dt); with resistors it sums and scales (Vout = −Σ Rf/Ri·Vi). Output range ±100 V; exceeding it lights the overload neon.",
              explode: [0, 0, 0.25 + (X % 2) * 0.15],
              live: () => {
                let re = r[X].block;
                return re
                  ? `${re.kind} "${re.name}" = ${(i.value(re.name) || 0).toFixed(4)} V-units${i.overload.has(re.name) ? "  ⚠ OVERLOAD" : ""}`
                  : "idle (not patched)";
              },
            }),
            le = new B(new te(0.32, 0.05, 0.5), U.steel());
          ((le.position.y = 0.05), G.add(le));
          let pe = [];
          for (let re = 0; re < 3; re++) {
            let de = Lc(
              M,
              [-0.09 + re * 0.09, 0.075, -0.08 + (re % 2) * 0.14],
              { scale: 0.9 },
              G,
            );
            pe.push(de);
          }
          let Ee = new B(new ke(0.035, 0.035, 0.12, 16), U.metal(10134186));
          (Ee.position.set(0.1, 0.14, 0.17), G.add(Ee));
          let be = new B(new Mt(0.02, 12, 8), U.led(16728096));
          (be.position.set(0, 0.11, 0.24),
            G.add(be),
            r.push({ ch: G, tubes: pe, neon: be, block: null }));
        }
        M.box(0.5, 0.08, 0.1, U.metal(9071931, 0.4), [0.9, 0.78, 0.3], {
          name: "Integrating capacitor bank",
          info: `Low-leakage polystyrene / mica capacitors (≈1 µF) for the integrator feedback paths. Leakage is the analog computer's enemy: it makes integrators "forget". Relays switch them between RESET (load initial condition), OPERATE (integrate) and HOLD (freeze).`,
        });
        let L = M.group([0.9, 0.06, -0.15], {
            name: "Regulated ±300 V / ±100 V reference supply",
            info: 'Power transformer, 5U4 rectifier tubes and oil-filled filter capacitors. A precision ±100 V reference defines machine units: every variable is scaled so that 100 V = its maximum expected value ("magnitude scaling").',
            explode: [0.3, 0, -0.4],
          }),
          z = new B(new te(0.22, 0.2, 0.16), U.metal(3815994, 0.6));
        ((z.position.y = 0.1), L.add(z));
        let F = new B(new ke(0.075, 0.075, 0.17, 20), U.copper());
        ((F.rotation.z = Math.PI / 2), (F.position.y = 0.1), L.add(F));
        for (let X = 0; X < 2; X++) Lc(M, [-0.2 - X * 0.12, 0, 0.05], { scale: 1.3 }, L);
        for (let X = 0; X < 3; X++) {
          let W = new B(new ke(0.04, 0.04, 0.16, 16), U.alu());
          (W.position.set(0.2, 0.08, -0.08 + X * 0.09), L.add(W));
        }
        let H = M.group([-0.6, 1.62, 0.02], {
            name: "Cathode-ray oscilloscope",
            info: 'Displays amplifier outputs vs time in "repetitive operation": the machine solves the problem over and over so a stable picture appears. Green P1 phosphor. The trace here is drawn from the live solution.',
            explode: [0, 0.4, 0.2],
          }),
          scopeBodyMat = U.metal(0x3f4c56, 0.42),
          scopeFaceMat = U.plastic(0xc8c5ba, 0.45),
          j = new B(chamferBox(0.64, 0.48, 0.6, 0.02, 2), scopeBodyMat);
        ((j.position.y = 0.24), (j.castShadow = !0), H.add(j));
        let facePlate = new B(chamferBox(0.6, 0.44, 0.016, 0.012, 1), scopeFaceMat);
        facePlate.position.set(0, 0.24, 0.298);
        let crtHood = new B(
          chamferBox(0.41, 0.36, 0.042, 0.016, 2),
          U.darkAnodized(0x1b2026),
        );
        crtHood.position.set(-0.07, 0.26, 0.312);
        let handleBar = new B(new ke(0.01, 0.01, 0.36, 16), U.steel());
        handleBar.rotation.z = Math.PI / 2;
        handleBar.position.set(0, 0.515, 0.12);
        H.add(facePlate, crtHood, handleBar);
        for (let hx of [-0.18, 0.18]) {
          let hPost = new B(new ke(0.009, 0.009, 0.04, 12), U.steel());
          hPost.position.set(hx, 0.495, 0.12);
          H.add(hPost);
        }
        a = zi(M, 0.37, 0.315, [-0.07, 0.26, 0.334], [800, 680], {}, H);
        let scopeGlass = new B(new mt(0.375, 0.32), U.glass(0xd8f5e3, 0.16));
        scopeGlass.position.set(-0.07, 0.26, 0.337);
        H.add(scopeGlass);
        for (let X = 0; X < 3; X++) {
          Om(M, [0.21, 0.13 + X * 0.115, 0.31], { r: 0.024 }, H);
          let bnc = new B(new ke(0.011, 0.011, 0.026, 16), U.steel());
          bnc.rotation.x = Math.PI / 2;
          bnc.position.set(0.145, 0.075, 0.312);
          if (X < 2) {
            bnc.position.x = 0.16 + X * 0.06;
            H.add(bnc);
          }
        }
        let meterPod = M.group([0.52, 1.62, 0.16], {
          name: "Reference & channel voltmeters (±100 V)",
          info: "Moving-coil center-zero galvanometers monitoring the first three patched operational amplifier channels in real time.",
          explode: [0, 0.4, 0.2],
        });
        let podBox = new B(chamferBox(0.76, 0.28, 0.22, 0.014, 2), scopeBodyMat);
        podBox.position.y = 0.14;
        podBox.castShadow = !0;
        meterPod.add(podBox);
        f._meters = [];
        for (let mi = 0; mi < 3; mi++) {
          f._meters.push(
            buildAnalogMeter(
              M,
              [-0.24 + mi * 0.24, 0.145, 0.092],
              {
                r: 0.082,
                unit: "CH " + (mi + 1),
                initial: 0.5,
                name: "Channel " + (mi + 1) + " voltmeter",
                info: "Moving-coil panel meter tracking live ±100 V amplifier output.",
              },
              meterPod,
            ),
          );
        }
        let K = M.group([1.75, 0, 0.1], {
            name: "X-Y plotter (pen recorder)",
            info: "Servo-driven pen draws one amplifier output against another — e.g. displacement vs velocity (a phase portrait) or a shell's x vs y trajectory, the output that filled WWII firing tables. Paper is redrawn live.",
            explode: [0.5, 0, 0],
          }),
          ue = new te(0.045, 0.8, 0.045);
        for (let [X, W] of [
          [-0.35, -0.3],
          [0.35, -0.3],
          [-0.35, 0.3],
          [0.35, 0.3],
        ]) {
          let G = new B(ue, U.wood());
          (G.position.set(X, 0.4, W), (G.castShadow = !0), K.add(G));
        }
        let Me = new B(chamferBox(0.82, 0.042, 0.72, 0.008, 2), U.wood());
        ((Me.position.y = 0.82), (Me.castShadow = !0), K.add(Me));
        let ee = new B(chamferBox(0.72, 0.06, 0.62, 0.008, 2), U.metal(0x3a434a, 0.45));
        ((ee.position.y = 0.87), (ee.castShadow = !0), K.add(ee));
        for (let rx of [-0.335, 0.335]) {
          let zRail = new B(new ke(0.008, 0.008, 0.58, 16), U.steel());
          zRail.rotation.x = Math.PI / 2;
          zRail.position.set(rx, 0.915, 0);
          K.add(zRail);
        }
        let servoY = new B(new ke(0.032, 0.032, 0.09, 20), U.darkAnodized(0x22262c));
        servoY.position.set(-0.335, 0.93, -0.28);
        K.add(servoY);
        ((l = zi(
          M,
          0.6,
          0.5,
          [0, 0.902, 0],
          [960, 800],
          { rot: [-Math.PI / 2, 0, 0] },
          K,
        )),
          (h = new B(chamferBox(0.68, 0.024, 0.032, 0.004, 1), U.alu())),
          (h.position.y = 0.932),
          (h.castShadow = !0),
          K.add(h),
          (c = new ft()),
          (c.position.y = 0.932),
          K.add(c));
        let penCarr = new B(chamferBox(0.046, 0.038, 0.048, 0.005, 1), U.brass());
        penCarr.position.y = 0.008;
        let penNib = new B(new pn(0.012, 0.048, 16), U.plastic(12597547, 0.35));
        penNib.rotation.x = Math.PI;
        penNib.position.y = -0.012;
        c.add(penCarr, penNib);
        (Dt(
          M,
          [
            [1.2, 0.5, 0.2],
            [1.4, 0.3, 0.3],
            [1.65, 0.85, 0.2],
          ],
          0.012,
          2236962,
        ),
          (l.ctx.fillStyle = "#f4efe0"),
          l.ctx.fillRect(0, 0, 960, 800));
      },
      ui(M) {
        ((d.err = q("div", { class: "err" })),
          (d.params = q("div")),
          (d.plot = It(150)),
          (d.phase = It(170)),
          (d.stats = Pt([
            ["t", "machine time"],
            ["ol", "overloads"],
            ["v0", "var 1"],
            ["v1", "var 2"],
          ])));
        let T = Object.keys(Ga);
        d.code = Ht(Ga[T[0]], (w) => p(w), 14);
        let A = Fe("HOLD", () => {
          ((e = !e),
            hi("relays", { n: 10 }),
            (A.textContent = e ? "HOLD" : "OPERATE"),
            A.classList.toggle("on", !e));
        });
        (M.append(
          Ie(
            "Patch program (live-compiled into the amplifier network)",
            q(
              "div",
              { class: "row" },
              "Preset ",
              st(T, T[0], (w) => {
                ((d.code.value = Ga[w]), p(Ga[w]));
              }),
            ),
            d.code,
            d.err,
            q(
              "div",
              { class: "small" },
              "Syntax: param name = value min..max · out name = expr (summer/multiplier) · int name(init) = d/dt expression (integrator) · plot a b · phase x y · time T. Functions: sin cos exp sqrt abs tanh sq step limit; t = time.",
            ),
          ),
          Ie(
            "Coefficient potentiometers",
            d.params,
            q(
              "div",
              { class: "row" },
              A,
              Fe("RESET (initial conditions)", () => {
                (i.reset(), g(), hi("relays", { n: 14 }));
              }),
              We(
                "Time scale",
                0.1,
                5,
                0.1,
                1,
                (w) => (t = w),
                (w) => w + "×",
              ),
            ),
          ),
          Ie("Oscilloscope (vs time)", d.plot),
          Ie("X-Y plotter (phase portrait)", d.phase),
          d.stats,
        ),
          p(d.code.value));
      },
      update(M) {
        if (n || !i.patch) return;
        e &&
          (i.run(M * t),
          i.t > i.patch.tmax && (i.reset(), g(), hi("relays", { n: 12, m: "analog" })));
        let T = i.patch;
        for (let w of [...T.plots, ...(T.phase || [])]) {
          let v = i.value(w),
            R = s[w] || (s[w] = { lo: -1e-6, hi: 1e-6 });
          ((R.lo = Math.min(R.lo, v)), (R.hi = Math.max(R.hi, v)));
        }
        (r.forEach((w) => {
          let v = w.block,
            R = v ? i.value(v.name) : 0,
            _ = v && s[v.name],
            P = v
              ? Math.min(
                  1,
                  Math.abs(R) /
                    Math.max(1e-6, _ ? Math.max(Math.abs(_.lo), Math.abs(_.hi)) : 1),
                )
              : 0;
          for (let V of w.tubes)
            V.userData.filament.material.emissiveIntensity = v ? 0.9 + 0.8 * P : 0.35;
          (w.neon.material.emissive.set(i.overload.has(v?.name) ? 16719904 : 16751152),
            (w.neon.material.emissiveIntensity = v ? 0.1 + 2.5 * P : 0.02));
        }),
          f._meters &&
            f._meters.forEach((mtr, mi) => {
              let blk = r[mi]?.block;
              if (!blk) {
                mtr.userData.setVal(0.5);
                return;
              }
              let val = i.value(blk.name) || 0,
                rng = s[blk.name],
                span = Math.max(
                  1e-6,
                  rng ? Math.max(Math.abs(rng.lo), Math.abs(rng.hi)) : 1,
                );
              mtr.userData.setVal(0.5 + 0.46 * Math.max(-1, Math.min(1, val / span)));
            }),
          T.params.forEach((w, v) => {
            o[v] &&
              (o[v].userData.pivot.rotation.z =
                -((i.paramValues[w.name] - w.min) / (w.max - w.min || 1)) *
                  Math.PI *
                  1.6 +
                0.8 * Math.PI);
          }));
        let A = f.diag;
        if (e && Math.random() < 0.5) {
          let w = A.edges[Math.floor(Math.random() * A.edges.length)];
          A.pulse(w.a, w.b, "#ff9a30", 2.5);
        }
        (b(),
          S(),
          E(),
          d.stats.set("t", i.t.toFixed(2) + " s"),
          d.stats.set("ol", i.overload.size ? [...i.overload].join(",") : "none"),
          T.plots
            .slice(0, 2)
            .forEach((w, v) => d.stats.set("v" + v, w + "=" + i.value(w).toFixed(3))));
      },
    };
  function p(M) {
    let T = i.load(M);
    if (
      ((n = T.length ? T : null),
      (d.err.textContent = n
        ? n.join(`
`)
        : ""),
      n)
    )
      return;
    ((s = {}), g(), (d.params.innerHTML = ""));
    for (let w of i.patch.params)
      d.params.append(
        We(
          w.name,
          w.min,
          w.max,
          (w.max - w.min) / 200,
          i.paramValues[w.name],
          (v) => i.setParam(w.name, v),
          (v) => (+v).toFixed(3),
        ),
      );
    let A = [
      ...i.patch.outs.map((w) => ({ kind: "summer", name: w.name })),
      ...i.patch.ints.map((w) => ({ kind: "integrator", name: w.name })),
    ];
    r.forEach((w, v) => (w.block = A[v] || null));
  }
  let x = null;
  function g() {
    if (!l) return;
    let M = l.ctx;
    ((M.fillStyle = "#f4efe0"),
      M.fillRect(0, 0, 960, 800),
      (M.strokeStyle = "#dce6f0"),
      (M.lineWidth = 1));
    for (let T = 0; T <= 960; T += 16)
      (M.beginPath(), M.moveTo(T, 0), M.lineTo(T, 800), M.stroke());
    for (let T = 0; T <= 800; T += 16)
      (M.beginPath(), M.moveTo(0, T), M.lineTo(960, T), M.stroke());
    ((M.strokeStyle = "#b4c8de"), (M.lineWidth = 2));
    for (let T = 0; T <= 960; T += 80)
      (M.beginPath(), M.moveTo(T, 0), M.lineTo(T, 800), M.stroke());
    for (let T = 0; T <= 800; T += 80)
      (M.beginPath(), M.moveTo(0, T), M.lineTo(960, T), M.stroke());
    ((x = null), (l.tex.needsUpdate = !0));
  }
  let m = (M, T) => {
    let A = s[M];
    if (!A) return 0.5;
    let w = Math.max(1e-9, A.hi - A.lo);
    return (T - A.lo) / w;
  };
  function S() {
    let M = i.patch;
    if (!M.phase) return;
    let [T, A] = M.phase,
      w = 40 + m(T, i.value(T)) * 880,
      v = 760 - m(A, i.value(A)) * 720,
      R = l.ctx;
    ((R.strokeStyle = "#1b3fa0"),
      (R.lineWidth = 3.2),
      x && (R.beginPath(), R.moveTo(...x), R.lineTo(w, v), R.stroke()),
      (x = [w, v]),
      (l.tex.needsUpdate = !0),
      c.position.set(-0.3 + (w / 960) * 0.6, 0.932, -0.25 + (v / 800) * 0.5),
      (h.position.z = c.position.z));
  }
  function b() {
    let M = a.ctx,
      T = 800,
      A = 680;
    ((M.fillStyle = "rgba(4,14,8,0.35)"),
      M.fillRect(0, 0, T, A),
      (M.strokeStyle = "rgba(90,255,140,0.16)"),
      (M.lineWidth = 1.5));
    for (let w = 1; w < 10; w++)
      (M.beginPath(), M.moveTo(w * 80, 0), M.lineTo(w * 80, A), M.stroke());
    for (let w = 1; w < 8; w++)
      (M.beginPath(), M.moveTo(0, w * 85), M.lineTo(T, w * 85), M.stroke());
    (y(M, T, A, ["#7dff9c", "#c8ffb0", "#5fe0d0"], 3.5), (a.tex.needsUpdate = !0));
  }
  function y(M, T, A, w, v = 2) {
    let R = i.history,
      _ = i.patch;
    if (R.length < 2) return;
    let P = _.tmax;
    _.plots.forEach((V, k) => {
      let L = s[V];
      if (!L) return;
      let z = Math.max(Math.abs(L.lo), Math.abs(L.hi), 1e-6);
      ((M.strokeStyle = w[k % w.length]),
        (M.lineWidth = v),
        M.beginPath(),
        R.forEach((F, H) => {
          let j = (F.t / P) * T,
            K = A / 2 - (F[V] / z) * A * 0.45;
          H ? M.lineTo(j, K) : M.moveTo(j, K);
        }),
        M.stroke());
    });
  }
  function E() {
    let M = yt(d.plot),
      T = d.plot.width,
      A = d.plot.height;
    ((M.fillStyle = "#05080b"),
      M.fillRect(0, 0, T, A),
      (M.strokeStyle = "#1c2a20"),
      M.beginPath(),
      M.moveTo(0, A / 2),
      M.lineTo(T, A / 2),
      M.stroke(),
      y(M, T, A, u, 1.5),
      (M.font = "12px monospace"),
      i.patch.plots.forEach((_, P) => {
        ((M.fillStyle = u[P % 4]), M.fillText(_, 8 + P * 50, 14));
      }));
    let w = i.patch;
    if (!w.phase) return;
    let [v, R] = w.phase;
    ((M = yt(d.phase)),
      (T = d.phase.width),
      (A = d.phase.height),
      (M.fillStyle = "#05080b"),
      M.fillRect(0, 0, T, A),
      (M.strokeStyle = "#58c4ff"),
      (M.lineWidth = 1.5),
      M.beginPath(),
      i.history.forEach((_, P) => {
        let V = 10 + m(v, _[v]) * (T - 20),
          k = A - 10 - m(R, _[R]) * (A - 20);
        P ? M.lineTo(V, k) : M.moveTo(V, k);
      }),
      M.stroke(),
      (M.fillStyle = "#8b98a9"),
      (M.font = "12px monospace"),
      M.fillText(`${R} vs ${v}`, 8, 14));
  }
  return (
    (f.test = () => {
      let M = new kc();
      return (
        M.load(Ga["Damped spring (mass-spring-damper)"]),
        M.setParam("c", 0),
        M.reset(),
        M.run(Math.PI),
        {
          x_at_pi: M.value("x"),
          expected: 1,
          ok: Math.abs(M.value("x") - 1) < 0.001,
        }
      );
    }),
    (f.sim = i),
    (f.isRunning = () => e),
    f
  );
}
function Xm() {
  let i = new Ia(),
    e = !1,
    t = 25,
    n = 0,
    s = "",
    r = {},
    o = [],
    a,
    l,
    c = [],
    h = {},
    d = {
      id: "tube",
      era: "1950s",
      short: "Vacuum-tube giant",
      sim: i,
      name: "Vacuum-Tube Stored-Program Computer (EDSAC-class, mercury delay-line store)",
      blurb:
        "The first practical stored-program computers (EDSAC 1949, UNIVAC I 1951) were rooms of ~3,000 valves. Bits travel serially as sound pulses through 1.5 m tubes of mercury: memory is a loop of acoustic waves, so the CPU must WAIT for a word to come round. This emulator runs EDSAC-style letter orders on 17-bit words in two 32-word tanks and counts every minor cycle spent waiting for the delay line.",
      diagram: {
        nodes: [
          {
            id: "tape",
            label: `Paper-tape
reader`,
            x: 0.1,
            y: 0.22,
            w: 0.16,
            color: "#c9b07a",
          },
          {
            id: "ctl",
            label: `Control
SCR / order`,
            x: 0.38,
            y: 0.22,
            w: 0.2,
            color: "#ffb347",
          },
          {
            id: "mem",
            label: `Mercury store
2×32 words`,
            x: 0.38,
            y: 0.75,
            w: 0.24,
            color: "#8fe3ff",
          },
          {
            id: "acc",
            label: `Accumulator
(35-bit)`,
            x: 0.7,
            y: 0.22,
            w: 0.2,
            color: "#ff7a1a",
          },
          {
            id: "mul",
            label: `Multiplier
reg R`,
            x: 0.7,
            y: 0.75,
            w: 0.18,
            color: "#ff5f5f",
          },
          {
            id: "tty",
            label: `Tele-
printer`,
            x: 0.92,
            y: 0.5,
            w: 0.13,
            color: "#5fe08a",
          },
        ],
        edges: [
          ["tape", "mem", "initial orders"],
          ["mem", "ctl", "fetch"],
          ["ctl", "acc"],
          ["mem", "acc"],
          ["acc", "mem"],
          ["mem", "mul"],
          ["mul", "acc"],
          ["mem", "tty"],
          ["acc", "ctl"],
        ],
      },
      build(b) {
        let y = U.plastic(4082261, 0.6),
          E = (H, j, K, ue, Me) => {
            let ee = b.group([j, 0, -0.6], {
                name: K,
                info: ue,
                live: () => u(H),
                explode: [0, 0, -0.6],
              }),
              X = U.plastic(2830648);
            for (let [de, D, $, Y, se, he] of [
              [0.9, 2.1, 0.03, 0, 1.05, -0.21],
              [0.04, 2.1, 0.45, -0.43, 1.05, 0],
              [0.04, 2.1, 0.45, 0.43, 1.05, 0],
              [0.9, 0.05, 0.45, 0, 2.08, 0],
              [0.9, 0.12, 0.45, 0, 0.06, 0],
            ]) {
              let _e = new B(new te(de, D, $), X);
              (_e.position.set(Y, se, he), (_e.castShadow = !0), ee.add(_e));
            }
            let W = new et({
                color: 14281983,
                transparent: !0,
                opacity: 0.3,
                roughness: 0.1,
                depthWrite: !1,
              }),
              G = new et({
                color: 1118481,
                emissive: Me,
                emissiveIntensity: 0.8,
              }),
              le = 66,
              pe = new ut(new ke(0.028, 0.03, 0.13, 10), W, le),
              Ee = new ut(new ke(0.007, 0.007, 0.08, 5), G, le),
              be = new je(),
              re = 0;
            for (let de = 0; de < 6; de++) {
              let D = new B(new te(0.84, 0.02, 0.4), U.steel());
              (D.position.set(0, 0.25 + de * 0.32, 0.03), ee.add(D));
              for (let $ = 0; $ < 11; $++)
                (be.position.set(-0.375 + $ * 0.075, 0.33 + de * 0.32, 0.12),
                  be.updateMatrix(),
                  pe.setMatrixAt(re, be.matrix),
                  Ee.setMatrixAt(re++, be.matrix));
            }
            (ee.add(pe, Ee),
              (r[H] = {
                fil: G,
                act: 0,
                meter: buildAnalogMeter(
                  b,
                  [0, 1.97, 0.22],
                  {
                    r: 0.062,
                    unit: H === "ctl" ? "CTL mA" : H === "acc" ? "ALU mA" : "REG mA",
                    initial: 0.32,
                    name: K.split(" (")[0] + " anode meter",
                    info: "Moving-coil milliammeter monitoring +250 V HT valve anode draw on this rack.",
                  },
                  ee,
                ),
              }),
              Nt(b, K.split(" (")[0].toUpperCase(), 0.8, 0.07, [j, 2.15, -0.37], {
                bg: "#222",
                color: "#ffd9a0",
              }));
          };
        (E(
          "ctl",
          -1,
          "Control rack (sequence control, order decoding)",
          "Valve flip-flops hold the Sequence Control Register (program counter) and the current order; diode/valve gating decodes the 5-bit function letter and steers pulses. Glow tracks control activity.",
          16742938,
        ),
          E(
            "acc",
            0,
            "Arithmetic rack (accumulator & multiplier)",
            "Serial arithmetic: one full adder processes one bit per 2 µs clock pulse (500 kHz), least-significant bit first, while the accumulator itself is a short mercury/valve recirculating register. Multiplication takes many word-times.",
            16751152,
          ),
          E(
            "mem",
            1,
            "Store electronics (delay-line amplifiers & regenerators)",
            'Each tank needs a valve amplifier, pulse re-shaper and re-timing gate to regenerate the attenuated acoustic pulses every pass — memory is "refreshed" continuously, like DRAM today.',
            16756800,
          ));
        let M = b.group([0, 0, 0.55], {
            name: 'Mercury delay-line store ("the coffin")',
            info: "Two 1.5 m steel tubes of mercury at a thermostatted 40 °C. A quartz crystal at one end turns electrical pulses into ultrasound (~13.5 MHz carrier); they travel at 1450 m/s, arrive ~1.1 ms later at the far crystal, get amplified and fed back in. 32 words × 17 bits circulate in each tank. The moving dots are the actual bits of the emulator's memory.",
            live: () => `tank phase: word ${i.phase()} at transducer
minor cycles waited: ${i.waited}`,
            explode: [0, 0.3, 0.6],
          }),
          T = new B(new te(2.2, 0.3, 0.5), U.plastic(6113846, 0.8));
        ((T.position.y = 0.6),
          M.add(T),
          b.box(2.2, 0.06, 0.5, U.plastic(6113846, 0.8), [0, 0.78, 0.55], {
            name: "Insulated lid (thermostatic enclosure)",
            info: "Sound speed in mercury changes ~0.03 %/°C — enough to slip bits out of step with the clock, so the tanks live in a heated, insulated box.",
            shell: !0,
            explode: [0, 0.5, 0],
          }));
        for (let H = 0; H < 2; H++) {
          let j = -0.1 + H * 0.2,
            K = new B(new ke(0.045, 0.045, 2, 20, 1, !0), U.glass(12568268, 0.35));
          ((K.rotation.z = Math.PI / 2), K.position.set(0, 0.68, j), M.add(K));
          let ue = new B(new ke(0.03, 0.03, 1.98, 16), U.metal(14672872, 0.08));
          ((ue.rotation.z = Math.PI / 2), ue.position.set(0, 0.68, j), M.add(ue));
          for (let ee of [-1, 1]) {
            let X = new B(new ke(0.06, 0.06, 0.06, 16), U.ceramic());
            ((X.rotation.z = Math.PI / 2), X.position.set(ee * 1.03, 0.68, j), M.add(X));
          }
          let Me = new ut(new Mt(0.009, 6, 4), new xt({ color: 8382719 }), Dn * yn);
          (Me.position.set(0, 0.68, j + 0), M.add(Me), o.push(Me));
        }
        let A = b.group([-1.7, 0, 0.6], {
            name: "Operator console & monitor CRT",
            info: 'Monitor tubes displayed the contents of a chosen tank as a 32-row dot pattern (wide dot = 1) plus the accumulator and multiplier registers — the "front panel" of the valve era. Engineers literally read binary off a CRT.',
            explode: [-0.5, 0, 0.3],
          }),
          w = new B(chamferBox(0.82, 0.78, 0.62, 0.014, 2), U.metal(0x3a4046, 0.48));
        ((w.position.y = 0.39), (w.castShadow = !0), A.add(w));
        let deskTop = new B(chamferBox(0.86, 0.036, 0.68, 0.008, 2), U.wood());
        deskTop.position.set(0, 0.795, 0.02);
        deskTop.castShadow = !0;
        A.add(deskTop);
        let v = new B(chamferBox(0.62, 0.56, 0.46, 0.02, 2), U.metal(0x2f353b, 0.45));
        (v.position.set(0, 1.09, -0.05), (v.castShadow = !0), A.add(v));
        let crtBezel = new B(
          chamferBox(0.51, 0.45, 0.036, 0.014, 2),
          U.darkAnodized(0x181c20),
        );
        crtBezel.position.set(0, 1.1, 0.175);
        A.add(crtBezel);
        a = zi(b, 0.46, 0.4, [0, 1.1, 0.195], [768, 672], {}, A);
        let crtLens = new B(new mt(0.465, 0.405), U.glass(0xd8f5e0, 0.16));
        crtLens.position.set(0, 1.1, 0.199);
        A.add(crtLens);
        for (let H = 0; H < 5; H++) {
          let j = new B(
            new ke(0.022, 0.022, 0.03, 16),
            U.knurl([0xb03028, 0x26292e, 0xd8a030, 0xd4d0c8, 0x2d6b8e][H], 0.38),
          );
          (j.position.set(-0.24 + H * 0.12, 0.825, 0.16), A.add(j));
          let sw = Ba(b, [-0.24 + H * 0.12, 0.818, 0.27], { scale: 0.85 }, A);
          sw.rotation.x = 0.2;
        }
        let R = b.group([1.75, 0, 0.6], {
            name: "Teleprinter (Creed 7B)",
            info: "5-hole tape teleprinter used for output at ~6 characters/s; an O order prints from the store. Paper here shows the real program output.",
            explode: [0.5, 0, 0.3],
          }),
          _ = new B(chamferBox(0.6, 0.75, 0.5, 0.014, 2), U.metal(0x2f3638, 0.5));
        ((_.position.y = 0.375), (_.castShadow = !0), R.add(_));
        let P = new B(chamferBox(0.56, 0.2, 0.42, 0.018, 2), U.metal(0x4d5654, 0.45));
        (P.position.set(0, 0.85, -0.04), (P.castShadow = !0), R.add(P));
        let platen = new B(new ke(0.032, 0.032, 0.42, 24), U.rubber(0x1c1d20));
        platen.rotation.z = Math.PI / 2;
        platen.position.set(0, 0.965, -0.05);
        let platenKnob = new B(new ke(0.042, 0.042, 0.025, 20), U.bakelite());
        platenKnob.rotation.z = Math.PI / 2;
        platenKnob.position.set(0.23, 0.965, -0.05);
        R.add(platen, platenKnob);
        buildSculptedKeyboard(
          b,
          [0, 0.76, 0.18],
          {
            w: 0.46,
            d: 0.17,
            h: 0.032,
            tilt: 0.16,
            leds: false,
            bodyColor: 0x3b4240,
            keyColor: 0x1e2124,
            modColor: 0x2c3136,
            legendColor: "#eae4d3",
            rows: [
              ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
              ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
              ["A", "S", "D", "F", "G", "H", "J", "K", "L", "CR"],
              ["FIGS", "Z", "X", "C", "V", "B", "N", "M", "LTRS"],
              ["SPACE"],
            ],
            name: "Creed 7B Baudot keyboard",
            info: "5-unit ITA2 Baudot mechanical keybank with LETTERS / FIGURES shift.",
          },
          R,
        );
        l = zi(b, 0.35, 0.32, [0, 1.13, -0.09], [512, 472], { rot: [-0.25, 0, 0] }, R);
        let V = b.group([1.75, 1, -0.2], {
            name: "Paper-tape reader",
            info: `Photo-electric/mechanical 5-hole tape reader. EDSAC's "initial orders" (a bootstrap ROM wired on uniselectors) assembled the punched program into the store as it was read — the first assembler/loader.`,
            explode: [0.6, 0.3, 0],
          }),
          k = new B(new te(0.4, 0.2, 0.3), U.plastic(7035456));
        V.add(k);
        let L = new B(new ke(0.12, 0.12, 0.03, 24), U.plastic(14208928));
        ((L.rotation.x = Math.PI / 2),
          L.position.set(0, 0.18, 0),
          V.add(L),
          b.onFrame((H) => (L.rotation.z += e ? H * 2 : 0)));
        let z = b.group([-1.95, 0, -0.6], {
            name: "Power supply & distribution",
            info: "~12 kW for ~3,000 valves: heater (filament) power alone was several kW. Valve failure — not logic — set reliability; heaters were brought up slowly to reduce thermal shock.",
            explode: [-0.4, 0, -0.3],
          }),
          F = new B(new te(0.5, 1.6, 0.45), U.plastic(2830648));
        ((F.position.y = 0.8), z.add(F));
        for (let H = 0; H < 3; H++) Lc(b, [-0.12 + H * 0.12, 1.6, 0], { scale: 1.6 }, z);
        (Dt(
          b,
          [
            [-1.7, 0.05, 0.3],
            [-1.2, 0.04, 0.2],
            [-1, 0.2, -0.4],
          ],
          0.03,
          1710618,
        ),
          Dt(
            b,
            [
              [1, 0.2, -0.4],
              [1.2, 0.05, 0.1],
              [1.1, 0.6, 0.45],
            ],
            0.03,
            1710618,
          ));
      },
      ui(b) {
        let y = Object.keys(bo);
        ((h.code = Ht(bo[y[0]], (M) => p(M), 14)),
          (h.err = q("div", { class: "err" })),
          (h.regs = q("div", { class: "regs" })),
          (h.tty = q("pre", { class: "term" })),
          (h.stats = Pt([
            ["st", "orders run"],
            ["mc", "minor cycles"],
            ["w", "waiting on tank"],
            ["tm", "machine time"],
          ])),
          (h.mem = q("div", { class: "regs", style: { maxHeight: "160px" } })));
        let E = Fe(
          "Run",
          () => {
            ((e = !e), (E.textContent = e ? "Stop" : "Run"));
          },
          "pri",
        );
        (b.append(
          Ie(
            "Program (letter orders; reassembled + reloaded live)",
            q(
              "div",
              { class: "row" },
              "Load ",
              st(y, y[0], (M) => {
                ((h.code.value = bo[M]), p(bo[M]));
              }),
            ),
            h.code,
            h.err,
            q("div", {
              class: "small",
              html:
                Object.entries(Uy)
                  .map(([M, T]) => `<b>${M}</b> ${T}`)
                  .join(" · ") +
                '<br>Word = 5-bit order | 11-bit address. Labels end with ":". DATA n stores a number.',
            }),
          ),
          Ie(
            "Control",
            q(
              "div",
              { class: "row" },
              E,
              Fe("Single order", () => {
                ((e = !1), (E.textContent = "Run"), x());
              }),
              Fe("Clear & restart", () => {
                (i.restart(), (c = []));
              }),
            ),
            We("Orders / second", 1, 2e3, 1, t, (M) => (t = M)),
            q(
              "div",
              { class: "small" },
              "Real EDSAC averaged ~650 orders/s; the delay line limited it more than the valves.",
            ),
          ),
          Ie("Registers (monitor CRT)", h.regs),
          Ie("Store (2 mercury tanks)", h.mem),
          Ie("Teleprinter output", h.tty),
          h.stats,
        ),
          p(h.code.value));
      },
      update(b) {
        if (e && !s) {
          n += b * t;
          let M = Math.min(4e3, Math.floor(n));
          for (n -= M; M-- > 0 && !i.halted;) x(M < 3);
          i.halted && (e = !1);
        }
        for (let M in r) {
          let T = r[M];
          ((T.act = Math.max(0, T.act - b * 2)),
            (T.fil.emissiveIntensity = 0.7 + T.act * 1.6 + Math.random() * 0.05),
            T.meter && T.meter.userData.setVal(0.32 + T.act * 0.58));
        }
        let y = new je(),
          E = i.minor + (e ? n % 1 : 0);
        (o.forEach((M, T) => {
          let A = 0;
          for (let w = 0; w < Dn; w++) {
            let v = i.mem[T * Dn + w];
            for (let R = 0; R < yn; R++) {
              let _ = (w * yn + R - (E % Dn) * yn + Dn * yn * 4) % (Dn * yn),
                P = (v >> R) & 1;
              (y.position.set(-0.98 + (_ / (Dn * yn)) * 1.96, 0, 0),
                y.scale.setScalar(P ? 1 : 1e-4),
                y.updateMatrix(),
                M.setMatrixAt(A++, y.matrix));
            }
          }
          M.instanceMatrix.needsUpdate = !0;
        }),
          g(),
          m(),
          S());
      },
    };
  function u(b) {
    return b === "ctl"
      ? `SCR (PC) = ${i.pc}
order = ${f(i.mem[i.pc])}`
      : b === "acc"
        ? `Acc = ${i.acc}
R = ${i.R}`
        : `tank 0/1 regenerating, phase ${i.phase()}`;
  }
  let f = (b) => {
    let y = vc(b);
    return `${y.op} ${y.n}`;
  };
  function p(b) {
    let y = $u(b);
    ((s = y.errors.join(`
`)),
      (h.err.textContent = s),
      !s && (i.reset(y.mem), (c = []), (d._labels = y.labels)));
  }
  function x(b = !0) {
    let y = i.step();
    if (y) {
      ((r.ctl.act = 1), b && d.diag.pulse("mem", "ctl", "#ffd166", 3));
      for (let [E, M] of y.flow)
        (b && d.diag.pulse(E, M, "#ff9a30", 3),
          (E === "acc" || M === "acc" || M === "mul") && (r.acc.act = 1),
          (r.mem.act = 1));
      y.op === "O" && c.push(String(i.out[i.out.length - 1]));
    }
  }
  function g() {
    let b = a.ctx;
    (b.save(),
      b.scale(2, 2),
      (b.fillStyle = "#031208"),
      b.fillRect(0, 0, 384, 336),
      (b.fillStyle = "#7dff9c"),
      (b.font = "bold 13px monospace"),
      b.fillText("TANK 0 (0..31)", 8, 14),
      b.fillText("TANK 1 (32..63)", 200, 14));
    for (let y = 0; y < 2; y++)
      for (let E = 0; E < 32; E++) {
        let M = i.mem[y * 32 + E];
        for (let T = yn - 1; T >= 0; T--) {
          let A = (M >> T) & 1,
            w = 8 + y * 192 + (yn - 1 - T) * 10,
            v = 22 + E * 8.5;
          ((b.fillStyle = y * 32 + E === i.pc ? "#ffe680" : "#7dff9c"),
            b.fillRect(w, v, A ? 8 : 2, 3.2));
        }
      }
    (b.restore(), (a.tex.needsUpdate = !0));
  }
  function m() {
    let b = l.ctx;
    (b.save(),
      b.scale(2, 2),
      (b.fillStyle = "#f2ecd8"),
      b.fillRect(0, 0, 256, 236),
      (b.fillStyle = "#c8bea2"));
    for (let py = 8; py < 236; py += 16) {
      (b.beginPath(), b.arc(8, py, 2.5, 0, Math.PI * 2), b.fill());
      (b.beginPath(), b.arc(248, py, 2.5, 0, Math.PI * 2), b.fill());
    }
    ((b.fillStyle = "#6b5d45"),
      (b.font = "bold 10px monospace"),
      b.fillText("CAMBRIDGE MATH LAB · CREED 7B", 20, 14),
      (b.fillStyle = "#1c1e24"),
      (b.font = "bold 16px monospace"),
      (c.length
        ? c.slice(-11)
        : ["[INITIAL ORDERS LOADED]", `SCR=${i.pc} ACC=${i.acc}`]
      ).forEach((y, E) => b.fillText(y, 20, 34 + E * 18)),
      b.restore(),
      (l.tex.needsUpdate = !0));
  }
  function S() {
    h.regs.textContent = `SCR (PC) ${String(i.pc).padStart(2)}   order  ${f(i.mem[i.pc]).padEnd(6)}  ${i.halted ? "STOPPED (Z)" : e ? "RUNNING" : "READY"}
Acc  ${i.acc}
R    ${i.R}
last ${i.last ? i.last.op + " " + i.last.n : "-"}`;
    let b = "",
      y = d._labels || {},
      E = Object.fromEntries(Object.entries(y).map(([T, A]) => [A, T]));
    for (let T = 0; T < qs; T++) {
      let A = i.mem[T];
      (!A && !E[T] && T !== i.pc) ||
        (b += `${T === i.pc ? "▶" : " "}${String(T).padStart(2)} ${(E[T] || "").padEnd(6)} ${A.toString(2).padStart(17, "0")}  ${f(A).padEnd(6)} = ${i.signed(T)}
`);
    }
    h.mem.textContent !== b && (h.mem.textContent = b);
    let M = c.join(`
`);
    (h.tty.textContent !== M && (h.tty.textContent = M),
      h.stats.set("st", i.steps),
      h.stats.set("mc", i.minor),
      h.stats.set("w", i.minor ? Math.round((i.waited / i.minor) * 100) + "%" : "–"),
      h.stats.set("tm", ((i.minor * Fy) / 1e3).toFixed(1) + " ms"));
  }
  return (
    (d.test = () => {
      let b = $u(bo["Add two numbers"]),
        y = new Ia();
      for (y.reset(b.mem); !y.halted;) y.step();
      let E = new Ia();
      for (E.reset($u(bo["Factorial (self-checking)"]).mem); !E.halted;) E.step();
      return {
        add_2_3: y.out[0],
        fact7: E.out[0],
        ok: y.out[0] === 5 && E.out[0] === 5040,
      };
    }),
    (d.isRunning = () => e),
    d
  );
}
function Zm() {
  let i = new Ca(),
    e = !1,
    t = 2e3,
    n = 1,
    s = 0,
    r = "",
    o = {},
    a = [],
    l = {},
    c,
    h,
    d = null,
    u = {
      id: "pdp8",
      era: "1960s",
      short: "Transistor minicomputer",
      sim: i,
      name: "DEC PDP-8 Minicomputer (transistor logic + magnetic-core memory)",
      blurb:
        "The 1965 PDP-8 put a whole computer in a cabinet for $18,000 and created the minicomputer. Discrete-transistor Flip-Chip modules implement a 12-bit CPU with just 8 instructions; 4,096 words live in magnetic-core memory (one ferrite ring per bit, magnetised clockwise = 1). This is a cycle-counted emulator of the real PDP-8 instruction set with a PAL assembler and a working front panel: toggle the switch register, DEPOSIT, LOAD ADD, single-step.",
      diagram: {
        nodes: [
          {
            id: "panel",
            label: `Front panel
switch reg`,
            x: 0.1,
            y: 0.2,
            w: 0.17,
            color: "#e8a33a",
          },
          { id: "pc", label: "PC", x: 0.33, y: 0.2, w: 0.1, color: "#58c4ff" },
          {
            id: "mb",
            label: "MA / MB",
            x: 0.55,
            y: 0.2,
            w: 0.14,
            color: "#58c4ff",
          },
          {
            id: "core",
            label: `Core memory
4K × 12`,
            x: 0.83,
            y: 0.2,
            w: 0.2,
            color: "#d08a3c",
          },
          {
            id: "ir",
            label: `IR + decode
(major states)`,
            x: 0.33,
            y: 0.75,
            w: 0.2,
            color: "#c08cff",
          },
          {
            id: "ac",
            label: `AC + L
12-bit adder`,
            x: 0.6,
            y: 0.75,
            w: 0.18,
            color: "#ff7a1a",
          },
          {
            id: "tty",
            label: `ASR-33
Teletype`,
            x: 0.86,
            y: 0.75,
            w: 0.16,
            color: "#5fe08a",
          },
        ],
        edges: [
          ["panel", "pc"],
          ["pc", "mb", "addr"],
          ["mb", "core", "r/w"],
          ["core", "mb"],
          ["mb", "ir"],
          ["mb", "ac", "data"],
          ["ac", "mb"],
          ["ac", "tty", "IOT"],
          ["ir", "pc"],
        ],
      },
      build(y) {
        let E = U.plastic(3090982, 0.6);
        (y.box(0.04, 1.5, 0.8, E, [-0.62, 0.75, 0], {
          name: "Cabinet side",
          info: 'Standard 19" DEC cabinet.',
          shell: !0,
          explode: [-0.5, 0, 0],
        }),
          y.box(0.04, 1.5, 0.8, E, [0.62, 0.75, 0], {
            name: "Cabinet side",
            info: 'Standard 19" DEC cabinet.',
            shell: !0,
            explode: [0.5, 0, 0],
          }),
          y.box(1.28, 0.04, 0.8, E, [0, 1.5, 0], {
            name: "Cabinet top",
            info: "Top cover.",
            shell: !0,
            explode: [0, 0.5, 0],
          }),
          y.box(1.2, 1.45, 0.03, E, [0, 0.74, -0.39], {
            name: "Rear door",
            info: "Rear door — behind it, the wire-wrapped backplane.",
            shell: !0,
            explode: [0, 0, -0.5],
          }),
          y.box(1.2, 0.7, 0.03, E, [0, 0.36, 0.39], {
            name: "Lower front door",
            info: "Covers the logic card cage and power supply. Use Cutaway.",
            shell: !0,
            explode: [0, 0, 0.5],
          }));
        let M = y.group([0, 1.12, 0.4], {
            name: "Programmer's console (front panel)",
            info: 'Incandescent lamps show every major register live; 12 switches form the Switch Register (SR). To load a program by hand: set an address on SR → LOAD ADD; set each word → DEPOSIT (auto-increments). This is how bootloaders were "toggled in". Click the 3D switches to toggle them.',
          }),
          T = new B(chamferBox(1.18, 0.6, 0.032, 0.006, 1), U.plastic(3875862, 0.4));
        M.add(T);
        for (let sx of [-0.595, 0.595]) {
          let trim = new B(new te(0.024, 0.61, 0.042), U.alu());
          trim.position.x = sx;
          M.add(trim);
        }
        Nt(
          y,
          "digital · PROGRAMMED DATA PROCESSOR-8",
          0.74,
          0.036,
          [0.06, 0.275, 0.018],
          { bg: "#23140b", color: "#f6dfba" },
          M,
        );
        let A = [
          ["PC", 0.22],
          ["MA", 0.14],
          ["MB", 0.06],
          ["AC", -0.02],
        ];
        for (let [W, G] of A)
          ((l[W] = fs(
            y,
            12,
            [0.05, G, 0.02],
            0.06,
            16760928,
            {
              name: W + " lamps",
              info: {
                PC: "Program Counter: address of the next instruction.",
                MA: "Memory Address register: address currently presented to core.",
                MB: "Memory Buffer: word just read from / about to be written to core.",
                AC: "Accumulator: the only general register. All arithmetic flows through it.",
              }[W],
              live: () =>
                W +
                " = " +
                Kn(W === "PC" ? i.pc : W === "MA" ? i.ma : W === "MB" ? i.mb : i.ac) +
                " (octal)",
            },
            M,
          )),
            Nt(y, W, 0.07, 0.035, [-0.48, G, 0.018], { bg: null, color: "#f3d9b0" }, M));
        ((l.L = fs(
          y,
          1,
          [-0.36, -0.02, 0.02],
          0.06,
          16760928,
          {
            name: "Link",
            info: "Link bit: 13th bit, complemented by carry out of TAD; rotates through RAL/RAR.",
          },
          M,
        )),
          (l.IR = fs(
            y,
            3,
            [-0.38, 0.22, 0.02],
            0.05,
            16760928,
            {
              name: "Instruction Register",
              info: "3-bit opcode: 0 AND 1 TAD 2 ISZ 3 DCA 4 JMS 5 JMP 6 IOT 7 OPR.",
            },
            M,
          )),
          (l.RUN = fs(
            y,
            1,
            [-0.38, 0.12, 0.02],
            0.05,
            16744512,
            {
              name: "RUN lamp",
              info: "Lit while the timing chain runs instructions.",
            },
            M,
          )));
        for (let W = 0; W < 12; W++) {
          let G = Ba(
            y,
            [0.05 + (W - 5.5) * 0.06, -0.14, 0.02],
            {
              name: "Switch register bit " + (11 - W),
              info: "Click to toggle. Bit 0 is the MSB in DEC numbering (leftmost).",
              mat: U.plastic(Math.floor(W / 3) % 2 ? 15246138 : 13785116, 0.4),
            },
            M,
          );
          ((G.userData.srBit = 11 - W), (G.rotation.x = -Math.PI / 2), a.push(G));
        }
        ["START", "LOAD ADD", "DEP", "EXAM", "CONT", "STOP", "SING STEP"].forEach(
          (W, G) => {
            let le = Ba(
              y,
              [-0.5 + G * 0.075, -0.24, 0.02],
              {
                name: "Key: " + W,
                info: "Momentary console key. Click it to operate.",
                mat: U.plastic(15921126),
              },
              M,
            );
            ((le.userData.key = W), (le.rotation.x = -Math.PI / 2));
          },
        );
        let v = y.group([-0.15, 0.08, 0.05], {
            name: "Logic card cage (Flip-Chip modules)",
            info: "Each plug-in Flip-Chip module holds a few discrete germanium/silicon transistors, diodes and resistors forming gates and flip-flops. A PDP-8 used ~1,400 transistors and ~10,000 diodes in total — no microprocessor, the CPU is these boards.",
            explode: [0, 0, 0.55],
          }),
          R = new B(new te(0.78, 0.04, 0.6), U.alu());
        v.add(R);
        let _ = new te(0.012, 0.22, 0.2),
          P = new te(0.014, 0.05, 0.03),
          V = new ut(_, U.pcb(2059061), 48),
          k = new ut(P, U.plastic(15921906), 48),
          L = new je();
        for (let W = 0; W < 2; W++)
          for (let G = 0; G < 24; G++)
            (L.position.set(-0.36 + G * 0.031, 0.14, -0.15 + W * 0.29),
              L.updateMatrix(),
              V.setMatrixAt(W * 24 + G, L.matrix),
              (L.position.y = 0.27),
              (L.position.z += 0.08),
              L.updateMatrix(),
              k.setMatrixAt(W * 24 + G, L.matrix));
        (v.add(V, k),
          y.box(0.78, 0.3, 0.02, U.pcb(7035450), [-0.15, 0.25, -0.3], {
            name: "Wire-wrapped backplane",
            info: `Thousands of point-to-point wire-wrap connections between module connector pins: the computer's "netlist" in wire. Wire-wrap gave gas-tight joints without solder and made engineering changes easy.`,
            explode: [0, 0, -0.4],
          }));
        let z = y.group([0.36, 0.18, 0.05], {
            name: "Magnetic-core memory stack (12 planes)",
            info: 'Each tiny ferrite toroid stores 1 bit by its direction of magnetisation. X and Y wires each carry half the switching current, so only the core at their intersection flips (coincident-current selection). Reading is destructive: a sense wire sees a pulse if the core flipped, and the inhibit wire is used to rewrite it — the "read-restore" cycle, 1.5 µs. Shown: 12 bit-planes × 64 words around the PC; bright = 1.',
            live: () => `showing words ${Kn(i.pc & 4032)}–${Kn((i.pc & 4032) + 63)}
core cycles: ${i.cycles}  (${((i.cycles * 1.5) / 1e3).toFixed(2)} ms machine time)`,
            explode: [0.45, 0.2, 0.3],
          }),
          F = new Pi(0.009, 0.0035, 6, 12);
        c = new ut(F, new et({ roughness: 0.5, metalness: 0.1 }), 768);
        for (let W = 0; W < 12; W++) {
          let G = new B(new te(0.22, 0.004, 0.22), U.pcb(5917226));
          ((G.position.y = W * 0.035), z.add(G));
          for (let le = 0; le < 64; le++)
            (L.position.set(
              -0.084 + (le % 8) * 0.024,
              W * 0.035 + 0.008,
              -0.084 + Math.floor(le / 8) * 0.024,
            ),
              L.rotation.set(Math.PI / 2, 0, ((le % 2) * Math.PI) / 2 + Math.PI / 4),
              L.updateMatrix(),
              c.setMatrixAt(W * 64 + le, L.matrix),
              c.setColorAt(W * 64 + le, new Ae(2759957)));
        }
        z.add(c);
        let H = U.copper();
        for (let W = 0; W < 8; W++)
          for (let G of [0, 1]) {
            let le = new B(new ke(0.0012, 0.0012, 0.42, 3), H);
            (G && (le.rotation.x = Math.PI / 2),
              le.position.set(
                G ? -0.084 + W * 0.024 : 0,
                0.2,
                G ? 0 : -0.084 + W * 0.024,
              ),
              G || ((le.rotation.z = 0), (le.position.x = -0.084 + W * 0.024)),
              z.add(le));
          }
        let j = y.group([0.3, 0.06, -0.2], {
            name: "Power supply",
            info: "Linear supply: transformer, rectifiers and large electrolytics producing −15 V / +10 V logic rails and the high-current core drive supplies (core current must be temperature-compensated).",
            explode: [0.4, 0, -0.3],
          }),
          K = new B(new te(0.2, 0.16, 0.16), U.metal(4473924, 0.5));
        ((K.position.y = 0.08), j.add(K));
        for (let W = 0; W < 3; W++) {
          let G = new B(new ke(0.035, 0.035, 0.14, 16), U.alu());
          (G.position.set(0.16, 0.07, -0.06 + W * 0.06), j.add(G));
        }
        ni(y, 0.08, [0, 0.1, -0.37], { rot: [0, 0, 0] });
        let ue = y.group([1.15, 0, 0.15], {
            name: "Teletype ASR-33",
            info: "10 characters/second, 7-bit ASCII (1963 standard) over a 20 mA current loop. Keyboard, printer, paper-tape punch and reader in one. The printer output here comes from TLS instructions the emulator executes.",
            explode: [0.5, 0, 0],
          }),
          Me = new B(chamferBox(0.5, 0.7, 0.44, 0.014, 2), U.plastic(11117719, 0.48));
        ((Me.position.y = 0.35), (Me.castShadow = !0), ue.add(Me));
        let ee = new B(chamferBox(0.58, 0.22, 0.48, 0.02, 2), U.plastic(13157298, 0.44));
        (ee.position.set(0, 0.81, -0.02), (ee.castShadow = !0), ue.add(ee));
        let shield = new B(
          chamferBox(0.42, 0.09, 0.22, 0.01, 1),
          U.glass(0xd8e0e8, 0.26),
        );
        shield.position.set(0.02, 0.945, -0.03);
        let platen = new B(new ke(0.03, 0.03, 0.39, 24), U.rubber(0x1e2024));
        platen.rotation.z = Math.PI / 2;
        platen.position.set(0.02, 0.94, -0.09);
        let rKnob = new B(new ke(0.024, 0.026, 0.026, 18), U.knurl(0x2a2c30, 0.38));
        rKnob.rotation.x = Math.PI / 2;
        rKnob.position.set(0.22, 0.84, 0.23);
        let tapeUnit = new B(
          chamferBox(0.11, 0.16, 0.34, 0.01, 2),
          U.plastic(0xbab4a2, 0.46),
        );
        tapeUnit.position.set(-0.33, 0.83, -0.01);
        let yellowReel = new B(
          new ke(0.085, 0.085, 0.026, 28),
          U.plastic(0xe5bf42, 0.42),
        );
        yellowReel.rotation.z = Math.PI / 2;
        yellowReel.position.set(-0.34, 0.94, -0.08);
        ue.add(shield, platen, rKnob, tapeUnit, yellowReel);
        buildSculptedKeyboard(
          y,
          [0.02, 0.895, 0.165],
          {
            w: 0.42,
            d: 0.17,
            h: 0.032,
            tilt: 0.18,
            leds: false,
            bodyColor: 0xc4beb0,
            keyColor: 0x35373b,
            modColor: 0x26282b,
            legendColor: "#f2eee2",
            rows: [
              ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ":", "-"],
              ["ESC", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "LF"],
              ["CTRL", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "CR"],
              ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "RUB"],
              ["HERE", "SPACE", "BRK"],
            ],
            name: "ASR-33 ASCII keyboard",
            info: "Upper-case 7-bit ASCII mechanical keyboard driving the 20 mA serial current loop.",
          },
          ue,
        );
        ((h = zi(
          y,
          0.34,
          0.3,
          [0.02, 1.12, -0.12],
          [680, 600],
          { rot: [-0.2, 0, 0] },
          ue,
        )),
          Dt(
            y,
            [
              [0.6, 0.2, 0.1],
              [0.8, 0.05, 0.2],
              [1, 0.3, 0.15],
            ],
            0.01,
            2236962,
          ));
      },
      onPick(y) {
        let E = y.userData;
        if (E.srBit !== void 0) return ((i.sr ^= 1 << E.srBit), g(), !1);
        if (E.key) return (x(E.key), !1);
      },
      ui(y) {
        let E = Object.keys(Pa);
        ((o.code = Ht(Pa[E[0]], (T) => m(T), 13)),
          (o.err = q("div", { class: "err" })),
          (o.sr = q("div", { class: "row" })),
          (o.srBtns = []));
        for (let T = 11; T >= 0; T--) {
          let A = q(
            "button",
            {
              class: "btn",
              style: {
                width: "26px",
                padding: "4px 0",
                background: Math.floor((11 - T) / 3) % 2 ? "#7a5520" : "#6a3010",
              },
              onclick: () => {
                ((i.sr ^= 1 << T), g());
              },
            },
            "0",
          );
          ((o.srBtns[T] = A),
            o.sr.append(A),
            T % 3 === 0 && T && o.sr.append(q("span", { style: { width: "6px" } })));
        }
        ((o.srv = q("span", { class: "okc" })),
          (o.regs = q("div", { class: "regs" })),
          (o.mem = q("div", { class: "regs", style: { maxHeight: "170px" } })),
          (o.tty = q("pre", { class: "term" })),
          (o.kin = q("input", {
            type: "text",
            placeholder: "type → keyboard buffer (KSF/KRB)",
            style: { width: "100%" },
            onkeydown: (T) => {
              if ((T.stopPropagation(), T.key === "Enter")) {
                for (let A of o.kin.value + "\r") i.kbd.push(A.charCodeAt(0));
                o.kin.value = "";
              }
            },
          })),
          (o.stats = Pt([
            ["ins", "instructions"],
            ["cy", "core cycles"],
            ["tm", "machine time"],
            ["ips", "real speed"],
          ])));
        let M = Fe(
          "RUN",
          () => {
            e ? p() : ((i.halted = !1), (e = !0));
          },
          "pri",
        );
        ((o.runB = M),
          y.append(
            Ie(
              "PAL-8 assembly (octal; assembled and deposited into core on every edit)",
              q(
                "div",
                { class: "row" },
                "Load ",
                st(E, E[0], (T) => {
                  ((o.code.value = Pa[T]), m(Pa[T]));
                }),
              ),
              o.code,
              o.err,
              q(
                "div",
                { class: "small" },
                'MRI: AND TAD ISZ DCA JMS JMP [I] addr · OPR: CLA CLL CMA CML IAC RAL RAR RTL RTR BSW SMA SZA SNL SPA SNA SZL SKP OSR HLT · IOT: TLS TSF KSF KRB · "X = char · ";" separates statements · LABEL, · *origin · / comment',
              ),
            ),
            Ie(
              "Front panel",
              q("div", { class: "small" }, "Switch register (SR):"),
              o.sr,
              q("div", {}, "SR = ", o.srv),
              q(
                "div",
                { class: "row" },
                M,
                ...["LOAD ADD", "DEP", "EXAM", "SING STEP", "STOP"].map((T) =>
                  Fe(T, () => x(T)),
                ),
              ),
              We(
                "Instructions/s",
                0,
                5.5,
                0.01,
                Math.log10(t),
                (T) => (t = Math.round(10 ** T)),
                (T) => Math.round(10 ** T) + (10 ** T > 2e5 ? " (≈ real 8/I)" : ""),
              ),
              q(
                "div",
                { class: "row" },
                We(
                  "Step size",
                  0,
                  12,
                  1,
                  0,
                  (T) => (n = 2 ** T),
                  (T) => 2 ** T + " instr.",
                ),
                Fe("Step N", () => {
                  (p(), (i.halted = !1));
                  for (let T = 0; T < n && !i.halted; T++) f(n - T <= 4);
                  u.diag.pulse("panel", "pc", "#e8a33a");
                }),
              ),
            ),
            Ie("Registers", o.regs),
            Ie("Core memory around PC", o.mem),
            Ie("Teletype", o.tty, o.kin),
            o.stats,
          ),
          m(o.code.value),
          g());
      },
      update(y) {
        let E = 0;
        if (e) {
          ((s += y * t), (E = Math.min(2e5, Math.floor(s))), (s -= E));
          for (let A = 0; A < E && !i.halted; A++) f(E - A < 4);
          i.halted && p();
        }
        (o.stats.set("ips", e ? Math.round(E / Math.max(y, 0.001)) + "/s" : "—"),
          Ki(l.PC, i.pc),
          Ki(l.MA, i.ma),
          Ki(l.MB, i.mb),
          Ki(l.AC, i.ac),
          Ki(l.L, i.l),
          Ki(l.IR, i.ir),
          Ki(l.RUN, e ? 1 : 0));
        let M = i.pc & 4032,
          T = new Ae();
        for (let A = 0; A < 64; A++) {
          let w = M + A,
            v = i.mem[w],
            R = i.touch[w];
          i.touch[w] *= 0.85;
          for (let _ = 0; _ < 12; _++)
            (T.set((v >> _) & 1 ? 14719562 : 2759957),
              R > 0.05 && T.lerp(new Ae(6349055), R * 0.8),
              c.setColorAt(_ * 64 + A, T));
        }
        ((c.instanceColor.needsUpdate = !0), S(), b());
      },
    };
  function f(y) {
    let E = i.step();
    if (!E || ((d = E), !y)) return;
    let M = u.diag;
    (M.pulse("pc", "mb", "#58c4ff", 4),
      M.pulse("core", "mb", "#d08a3c", 4),
      M.pulse("mb", "ir", "#c08cff", 4),
      E.op <= 3 && !E.store && M.pulse("mb", "ac", "#ff9a30", 4),
      E.store && M.pulse("ac", "mb", "#ff9a30", 4),
      E.op === 6 && M.pulse("ac", "tty", "#5fe08a", 4),
      E.jump && M.pulse("ir", "pc", "#c08cff", 4));
  }
  function p() {
    e = !1;
  }
  function x(y) {
    let E = u.diag;
    (E.pulse("panel", "pc", "#e8a33a"),
      y === "START"
        ? ((i.ac = 0), (i.l = 0), (i.halted = !1), (e = !0))
        : y === "CONT"
          ? ((i.halted = !1), (e = !0))
          : y === "STOP"
            ? p()
            : y === "LOAD ADD"
              ? i.loadAdd()
              : y === "DEP"
                ? (i.deposit(), E.pulse("mb", "core", "#d08a3c"))
                : y === "EXAM"
                  ? (i.examine(), E.pulse("core", "mb", "#d08a3c"))
                  : y === "SING STEP" && (p(), (i.halted = !1), f(!0)));
  }
  function g() {
    for (let y = 0; y < 12; y++) {
      let E = (i.sr >> y) & 1;
      ((o.srBtns[y].textContent = E),
        (o.srBtns[y].style.outline = E ? "2px solid #ffc060" : ""));
    }
    (a.forEach((y) => za(y, (i.sr >> y.userData.srBit) & 1)),
      (o.srv.textContent = Kn(i.sr) + " octal"));
  }
  function m(y) {
    let E = vm(y);
    ((r = E.errors.join(`
`)),
      (o.err.textContent = r),
      !r && (p(), i.load(E), (u._asm = E)));
  }
  function S() {
    let y = h.ctx;
    (y.save(),
      y.scale(2, 2),
      (y.fillStyle = "#f5efcf"),
      y.fillRect(0, 0, 340, 300),
      (y.fillStyle = "#cfc39b"));
    for (let py = 10; py < 300; py += 18) {
      (y.beginPath(), y.arc(8, py, 3, 0, Math.PI * 2), y.fill());
      (y.beginPath(), y.arc(332, py, 3, 0, Math.PI * 2), y.fill());
    }
    ((y.fillStyle = "#6e6242"),
      (y.font = "bold 11px monospace"),
      y.fillText("TELETYPE MODEL 33 ASR · 110 BAUD", 18, 16),
      (y.fillStyle = "#1c1a24"),
      (y.font = "bold 17px monospace"));
    let ttyLines = i.tty.trim()
      ? i.tty.split("\n").slice(-12)
      : [
          "*200",
          `PC=${Kn(i.pc)} AC=${Kn(i.ac)} SR=${Kn(i.sr)}`,
          "READY (LOAD 'HELLO' FOR TLS)",
        ];
    (ttyLines.forEach((M, T) => y.fillText(M.slice(-26), 18, 38 + T * 21)),
      y.restore(),
      (h.tex.needsUpdate = !0));
  }
  function b() {
    o.regs.textContent = `PC ${Kn(i.pc)}  MA ${Kn(i.ma)}  MB ${Kn(i.mb)}
AC ${Kn(i.ac)}  L ${i.l}   (AC = ${i.ac} decimal, ${i.ac & 2048 ? i.ac - 4096 : i.ac} signed)
IR ${i.ir} ${["AND", "TAD", "ISZ", "DCA", "JMS", "JMP", "IOT", "OPR"][i.ir]}   ${e ? "RUN" : i.halted ? "HALTED" : "STOPPED"}
next: ${yc(i.mem[i.pc], i.pc)}`;
    let y = "",
      E = u._asm
        ? Object.fromEntries(Object.entries(u._asm.labels).map(([M, T]) => [T, M]))
        : {};
    for (let M = Math.max(0, i.pc - 6); M < i.pc + 10; M++)
      y += `${M === i.pc ? "▶" : " "}${Kn(M)} ${Kn(i.mem[M])} ${(E[M] || "").padEnd(6)} ${yc(i.mem[M], M)}
`;
    (o.mem.textContent !== y && (o.mem.textContent = y),
      o.tty.textContent !== i.tty &&
        ((o.tty.textContent = i.tty), (o.tty.scrollTop = 1e9)),
      o.stats.set("ins", i.instr),
      o.stats.set("cy", i.cycles),
      o.stats.set("tm", ((i.cycles * 1.5) / 1e3).toFixed(2) + " ms"),
      (o.runB.textContent = e ? "STOP" : "RUN"));
  }
  return (
    (u.test = () => {
      let y = {};
      for (let [M, T] of [
        ["add", "Add two numbers"],
        ["mul", "Multiply by repeated addition (ISZ loop)"],
        ["hello", "Hello on the Teletype"],
      ]) {
        let A = new Ca();
        for (A.load(vm(Pa[T])); !A.halted;) A.step();
        y[M] = M === "hello" ? A.tty.trim() : A.ac;
      }
      let E = new Ca();
      ((E.sr = 192), E.loadAdd());
      for (let M of [3585, 3585, 3842]) ((E.sr = M), E.deposit());
      for (E.sr = 192, E.loadAdd(); !E.halted;) E.step();
      return (
        (y.toggled_in = E.ac),
        (y.ok =
          y.add === 5 &&
          y.mul === 78 &&
          y.hello === "HELLO PDP-8!" &&
          y.toggled_in === 2),
        y
      );
    }),
    (u.isRunning = () => e),
    u
  );
}
var tb = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  let e = 0,
    t = i;
  for (; t;) ((e ^= t & 1), (t >>= 1));
  tb[i] = e ? 0 : 1;
}
var Ym = 128,
  x0 = 64,
  Qi = 16,
  y0 = 4,
  Qt = 1,
  ib = new Uint8Array(256).fill(4);
(() => {
  let i = (e, t) => (ib[e] = t);
  for (let e = 64; e < 128; e++) i(e, (e & 7) === 6 || ((e >> 3) & 7) === 6 ? 7 : 5);
  i(118, 7);
  for (let e = 128; e < 192; e++) i(e, (e & 7) === 6 ? 7 : 4);
  for (let e = 0; e < 8; e++)
    (i((e << 3) | 6, e === 6 ? 10 : 7),
      i((e << 3) | 4, e === 6 ? 10 : 5),
      i((e << 3) | 5, e === 6 ? 10 : 5),
      i(198 | (e << 3), 7),
      i(194 | (e << 3), 10),
      i(196 | (e << 3), 11),
      i(192 | (e << 3), 5),
      i(199 | (e << 3), 11));
  for (let e = 0; e < 4; e++)
    (i((e << 4) | 1, 10),
      i((e << 4) | 9, 10),
      i((e << 4) | 3, 5),
      i((e << 4) | 11, 5),
      i(197 | (e << 4), 11),
      i(193 | (e << 4), 10));
  [
    [58, 13],
    [50, 13],
    [42, 16],
    [34, 16],
    [10, 7],
    [26, 7],
    [2, 7],
    [18, 7],
    [195, 10],
    [205, 17],
    [201, 10],
    [233, 5],
    [249, 5],
    [227, 18],
    [211, 10],
    [219, 10],
  ].forEach(([e, t]) => i(e, t));
})();
var Xa = class {
    constructor(e) {
      ((this.bus = e), (this.mem = new Uint8Array(65536)), this.reset());
    }
    reset() {
      ((this.r = new Uint8Array(8)),
        (this.f = 2),
        (this.sp = 0),
        (this.pc = 0),
        (this.halted = !1),
        (this.inte = !1),
        (this.cycles = 0),
        (this.instr = 0));
    }
    rd(e) {
      e &= 65535;
      let t = this.mem[e];
      return (this.bus && this.bus(e, t, "r"), t);
    }
    wr(e, t) {
      ((e &= 65535), (this.mem[e] = t & 255), this.bus && this.bus(e, t & 255, "w"));
    }
    get A() {
      return this.r[7];
    }
    set A(e) {
      this.r[7] = e;
    }
    hl() {
      return (this.r[4] << 8) | this.r[5];
    }
    getR(e) {
      return e === 6 ? this.rd(this.hl()) : this.r[e];
    }
    setR(e, t) {
      e === 6 ? this.wr(this.hl(), t) : (this.r[e] = t & 255);
    }
    rp(e) {
      return e === 3 ? this.sp : (this.r[e * 2] << 8) | this.r[e * 2 + 1];
    }
    setRp(e, t) {
      ((t &= 65535),
        e === 3
          ? (this.sp = t)
          : ((this.r[e * 2] = t >> 8), (this.r[e * 2 + 1] = t & 255)));
    }
    imm8() {
      let e = this.rd(this.pc);
      return ((this.pc = (this.pc + 1) & 65535), e);
    }
    imm16() {
      let e = this.imm8();
      return (this.imm8() << 8) | e;
    }
    push(e) {
      ((this.sp = (this.sp - 1) & 65535),
        this.wr(this.sp, e >> 8),
        (this.sp = (this.sp - 1) & 65535),
        this.wr(this.sp, e & 255));
    }
    pop() {
      let e = this.rd(this.sp);
      this.sp = (this.sp + 1) & 65535;
      let t = this.rd(this.sp);
      return ((this.sp = (this.sp + 1) & 65535), (t << 8) | e);
    }
    szp(e) {
      this.f = (this.f & ~(Ym | x0 | y0)) | (e & 128) | (e ? 0 : x0) | (tb[e] ? y0 : 0);
    }
    cond(e) {
      let t = this.f;
      return [
        !(t & x0),
        !!(t & x0),
        !(t & Qt),
        !!(t & Qt),
        !(t & y0),
        !!(t & y0),
        !(t & Ym),
        !!(t & Ym),
      ][e];
    }
    alu(e, t) {
      let n = this.A,
        s = this.f & Qt,
        r;
      switch (e) {
        case 0:
        case 1: {
          let o = e === 1 ? s : 0;
          ((r = n + t + o),
            (this.f =
              (this.f & ~(Qi | Qt)) |
              ((n & 15) + (t & 15) + o > 15 ? Qi : 0) |
              (r > 255 ? Qt : 0)),
            (r &= 255),
            (this.A = r));
          break;
        }
        case 2:
        case 3:
        case 7: {
          let o = e === 3 ? s : 0;
          ((r = n - t - o),
            (this.f =
              (this.f & ~(Qi | Qt)) |
              ((n & 15) + (~t & 15) + (1 - o) > 15 ? Qi : 0) |
              (r < 0 ? Qt : 0)),
            (r &= 255),
            e !== 7 && (this.A = r));
          break;
        }
        case 4:
          ((r = n & t),
            (this.f = (this.f & ~(Qi | Qt)) | ((n | t) & 8 ? Qi : 0)),
            (this.A = r));
          break;
        case 5:
          ((r = n ^ t), (this.f &= ~(Qi | Qt)), (this.A = r));
          break;
        case 6:
          ((r = n | t), (this.f &= ~(Qi | Qt)), (this.A = r));
          break;
      }
      this.szp(r);
    }
    step() {
      if (this.halted) return ((this.cycles += 4), "hlt");
      let e = this.pc,
        t = this.imm8();
      this.instr++;
      let n = ib[t];
      if (t >= 64 && t < 128)
        t === 118 ? (this.halted = !0) : this.setR((t >> 3) & 7, this.getR(t & 7));
      else if (t >= 128 && t < 192) this.alu((t >> 3) & 7, this.getR(t & 7));
      else if ((t & 199) === 198) this.alu((t >> 3) & 7, this.imm8());
      else if ((t & 199) === 6) this.setR((t >> 3) & 7, this.imm8());
      else if ((t & 199) === 4) {
        let s = (t >> 3) & 7,
          r = (this.getR(s) + 1) & 255;
        (this.setR(s, r),
          this.szp(r),
          (this.f = (this.f & ~Qi) | ((r & 15) === 0 ? Qi : 0)));
      } else if ((t & 199) === 5) {
        let s = (t >> 3) & 7,
          r = (this.getR(s) - 1) & 255;
        (this.setR(s, r),
          this.szp(r),
          (this.f = (this.f & ~Qi) | ((r & 15) !== 15 ? Qi : 0)));
      } else if ((t & 207) === 1) this.setRp((t >> 4) & 3, this.imm16());
      else if ((t & 207) === 9) {
        let s = this.hl() + this.rp((t >> 4) & 3);
        ((this.f = (this.f & ~Qt) | (s > 65535 ? Qt : 0)), this.setRp(2, s));
      } else if ((t & 207) === 3) this.setRp((t >> 4) & 3, this.rp((t >> 4) & 3) + 1);
      else if ((t & 207) === 11) this.setRp((t >> 4) & 3, this.rp((t >> 4) & 3) - 1);
      else if ((t & 199) === 194) {
        let s = this.imm16();
        this.cond((t >> 3) & 7) && (this.pc = s);
      } else if ((t & 199) === 196) {
        let s = this.imm16();
        this.cond((t >> 3) & 7) && (this.push(this.pc), (this.pc = s), (n = 17));
      } else if ((t & 199) === 192)
        this.cond((t >> 3) & 7) && ((this.pc = this.pop()), (n = 11));
      else if ((t & 199) === 199) (this.push(this.pc), (this.pc = t & 56));
      else if ((t & 207) === 197) {
        let s = (t >> 4) & 3;
        this.push(s === 3 ? (this.A << 8) | (this.f & 215) | 2 : this.rp(s));
      } else if ((t & 207) === 193) {
        let s = (t >> 4) & 3,
          r = this.pop();
        s === 3 ? ((this.A = r >> 8), (this.f = (r & 215) | 2)) : this.setRp(s, r);
      } else
        switch (t) {
          case 2:
            this.wr(this.rp(0), this.A);
            break;
          case 18:
            this.wr(this.rp(1), this.A);
            break;
          case 10:
            this.A = this.rd(this.rp(0));
            break;
          case 26:
            this.A = this.rd(this.rp(1));
            break;
          case 34: {
            let s = this.imm16();
            (this.wr(s, this.r[5]), this.wr(s + 1, this.r[4]));
            break;
          }
          case 42: {
            let s = this.imm16();
            ((this.r[5] = this.rd(s)), (this.r[4] = this.rd(s + 1)));
            break;
          }
          case 50:
            this.wr(this.imm16(), this.A);
            break;
          case 58:
            this.A = this.rd(this.imm16());
            break;
          case 7: {
            let s = this.A,
              r = s >> 7;
            ((this.A = ((s << 1) | r) & 255), (this.f = (this.f & ~Qt) | r));
            break;
          }
          case 15: {
            let s = this.A,
              r = s & 1;
            ((this.A = (s >> 1) | (r << 7)), (this.f = (this.f & ~Qt) | r));
            break;
          }
          case 23: {
            let s = this.A,
              r = s >> 7;
            ((this.A = ((s << 1) | (this.f & Qt)) & 255), (this.f = (this.f & ~Qt) | r));
            break;
          }
          case 31: {
            let s = this.A,
              r = s & 1;
            ((this.A = (s >> 1) | ((this.f & Qt) << 7)), (this.f = (this.f & ~Qt) | r));
            break;
          }
          case 39: {
            let s = this.A,
              r = 0,
              o = this.f & Qt;
            (((s & 15) > 9 || this.f & Qi) && (r = 6),
              (s >> 4 > 9 || o || (s >> 4 >= 9 && (s & 15) > 9)) && ((r |= 96), (o = 1)));
            let a = (s + r) & 255;
            ((this.f =
              (this.f & ~(Qi | Qt)) | ((s & 15) + (r & 15) > 15 ? Qi : 0) | (o ? Qt : 0)),
              (this.A = a),
              this.szp(a));
            break;
          }
          case 47:
            this.A = ~this.A & 255;
            break;
          case 55:
            this.f |= Qt;
            break;
          case 63:
            this.f ^= Qt;
            break;
          case 195:
            this.pc = this.imm16();
            break;
          case 205: {
            let s = this.imm16();
            (this.push(this.pc), (this.pc = s));
            break;
          }
          case 201:
            this.pc = this.pop();
            break;
          case 233:
            this.pc = this.hl();
            break;
          case 249:
            this.sp = this.hl();
            break;
          case 227: {
            let s = this.pop();
            (this.push(this.hl()), this.setRp(2, s));
            break;
          }
          case 235: {
            let s = this.rp(1);
            (this.setRp(1, this.hl()), this.setRp(2, s));
            break;
          }
          case 211: {
            let s = this.imm8();
            this.out && this.out(s, this.A);
            break;
          }
          case 219: {
            let s = this.imm8();
            this.A = (this.inp ? this.inp(s) : 255) & 255;
            break;
          }
          case 243:
            this.inte = !1;
            break;
          case 251:
            this.inte = !0;
            break;
          default:
            break;
        }
      return ((this.cycles += n), t);
    }
  },
  SA = { B: 0, C: 1, D: 2, E: 3, H: 4, L: 5, M: 6, A: 7 },
  EA = { B: 0, D: 1, H: 2, SP: 3, PSW: 3 },
  Jy = ["ADD", "ADC", "SUB", "SBB", "ANA", "XRA", "ORA", "CMP"],
  $y = ["ADI", "ACI", "SUI", "SBI", "ANI", "XRI", "ORI", "CPI"],
  Wa = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"],
  eb = {
    NOP: 0,
    RLC: 7,
    RRC: 15,
    RAL: 23,
    RAR: 31,
    DAA: 39,
    CMA: 47,
    STC: 55,
    CMC: 63,
    HLT: 118,
    RET: 201,
    PCHL: 233,
    SPHL: 249,
    XTHL: 227,
    XCHG: 235,
    DI: 243,
    EI: 251,
  };
function b0(i) {
  let e = {},
    t = [],
    n = new Uint8Array(65536),
    s = [],
    r = null,
    o = i.split(`
`);
  for (let a of [1, 2]) {
    let l = 0,
      c = (h, d) => {
        h = h.trim();
        let u = 0,
          f = 1,
          p = h
            .split(/([+-])/)
            .map((x) => x.trim())
            .filter((x) => x !== "");
        for (let x of p) {
          if (x === "+") {
            f = 1;
            continue;
          }
          if (x === "-") {
            f = -1;
            continue;
          }
          let g,
            m = x.toUpperCase();
          (/^'.'$/.test(x)
            ? (g = x.charCodeAt(1))
            : /^[0-9][0-9A-F]*H$/.test(m)
              ? (g = parseInt(m.slice(0, -1), 16))
              : /^0X[0-9A-F]+$/.test(m)
                ? (g = parseInt(m.slice(2), 16))
                : /^\$[0-9A-F]+$/.test(m)
                  ? (g = parseInt(m.slice(1), 16))
                  : /^[01]+B$/.test(m)
                    ? (g = parseInt(m.slice(0, -1), 2))
                    : /^\d+D?$/.test(m)
                      ? (g = parseInt(m, 10))
                      : m === "$"
                        ? (g = l)
                        : m in e
                          ? (g = e[m])
                          : (a === 2 && t.push(`line ${d}: undefined "${x}"`), (g = 0)),
            (u += f * g),
            (f = 1));
        }
        return u;
      };
    o.forEach((h, d) => {
      let u = d + 1,
        f = h.replace(/;(?=(?:[^']*'[^']*')*[^']*$).*/, "").trim();
      if (!f) return;
      let p = f.match(/^([A-Za-z_?@][\w?@]*):\s*(.*)$/),
        x = null;
      p && ((x = p[1].toUpperCase()), (f = p[2].trim()));
      let g = f.match(/^([A-Za-z_]\w*)\s+EQU\s+(.+)$/i);
      if (g) {
        e[g[1].toUpperCase()] = c(g[2], u) & 65535;
        return;
      }
      if ((x && a === 1 && (e[x] = l), !f)) return;
      let m = f.match(/^(\w+)\s*(.*)$/),
        S = m[1].toUpperCase(),
        b = wA(m[2]),
        y = [],
        E = (A) => {
          let w = SA[(A || "").toUpperCase()];
          return (w === void 0 && t.push(`line ${u}: bad register "${A}"`), w | 0);
        },
        M = (A) => {
          let w = EA[(A || "").toUpperCase()];
          return (w === void 0 && t.push(`line ${u}: bad register pair "${A}"`), w | 0);
        },
        T = (A) => y.push(A & 255, (A >> 8) & 255);
      if (S === "ORG") {
        ((l = c(b[0], u) & 65535), r === null && (r = l));
        return;
      } else if (S === "DB")
        for (let A of b)
          if (/^'.*'$/.test(A) && A.length > 3)
            for (let w of A.slice(1, -1)) y.push(w.charCodeAt(0));
          else y.push(c(A, u) & 255);
      else if (S === "DW") b.forEach((A) => T(c(A, u)));
      else if (S === "DS") {
        l += c(b[0], u);
        return;
      } else {
        if (S === "END") return;
        if (S in eb) y.push(eb[S]);
        else if (S === "MOV") y.push(64 | (E(b[0]) << 3) | E(b[1]));
        else if (S === "MVI") y.push(6 | (E(b[0]) << 3), c(b[1], u) & 255);
        else if (S === "LXI") (y.push(1 | (M(b[0]) << 4)), T(c(b[1], u)));
        else if (S === "DAD" || S === "INX" || S === "DCX")
          y.push({ DAD: 9, INX: 3, DCX: 11 }[S] | (M(b[0]) << 4));
        else if (S === "PUSH" || S === "POP")
          y.push((S === "PUSH" ? 197 : 193) | (M(b[0]) << 4));
        else if (S === "INR" || S === "DCR")
          y.push((S === "INR" ? 4 : 5) | (E(b[0]) << 3));
        else if (S === "LDAX" || S === "STAX")
          y.push((S === "LDAX" ? 10 : 2) | (M(b[0]) << 4));
        else if (Jy.includes(S)) y.push(128 | (Jy.indexOf(S) << 3) | E(b[0]));
        else if ($y.includes(S)) y.push(198 | ($y.indexOf(S) << 3), c(b[0], u) & 255);
        else if (["LDA", "STA", "LHLD", "SHLD", "JMP", "CALL"].includes(S))
          (y.push({ LDA: 58, STA: 50, LHLD: 42, SHLD: 34, JMP: 195, CALL: 205 }[S]),
            T(c(b[0], u)));
        else if (S[0] === "J" && Wa.includes(S.slice(1)))
          (y.push(194 | (Wa.indexOf(S.slice(1)) << 3)), T(c(b[0], u)));
        else if (S[0] === "C" && Wa.includes(S.slice(1)))
          (y.push(196 | (Wa.indexOf(S.slice(1)) << 3)), T(c(b[0], u)));
        else if (S[0] === "R" && Wa.includes(S.slice(1)))
          y.push(192 | (Wa.indexOf(S.slice(1)) << 3));
        else if (S === "RST") y.push(199 | ((c(b[0], u) & 7) << 3));
        else if (S === "IN" || S === "OUT")
          y.push(S === "IN" ? 219 : 211, c(b[0], u) & 255);
        else {
          t.push(`line ${u}: unknown mnemonic "${m[1]}"`);
          return;
        }
      }
      (a === 2 &&
        (y.forEach((A, w) => (n[(l + w) & 65535] = A)),
        s.push({ ln: u, addr: l, bytes: y, src: h.trim() })),
        (l += y.length));
    });
  }
  return { mem: n, labels: e, errors: t, listing: s, start: r ?? 0 };
}
function wA(i) {
  let e = [],
    t = "",
    n = !1;
  for (let s of i)
    (s === "'" && (n = !n), s === "," && !n ? (e.push(t.trim()), (t = "")) : (t += s));
  return (t.trim() && e.push(t.trim()), e);
}
var Za = {
  "Kill the Bit (1975 game — use sense switches A8–A15)": `; KILL THE BIT by Dean McDaniel, 1975.
; A lit bit races across the HIGH ADDRESS lamps (A15-A8).
; Flip the matching sense switch (A8-A15) at the right moment to kill it.
; Miss, and you ADD a bit instead!
        ORG  0
        LXI  H,0          ; HL = 0, inner delay counter
        MVI  D,080H       ; D = the moving bit (shown on A15-A8 during LDAX D)
        LXI  B,0EH        ; speed: bigger = faster
BEG:    LDAX D            ; these reads put DE on the address bus,
        LDAX D            ; so the bit glows on the address lamps
        LDAX D
        LDAX D
        DAD  B            ; HL += BC, carry when it wraps
        JNC  BEG
        IN   0FFH         ; read the sense switches (A15-A8)
        XRA  D            ; toggle bits that match
        RRC               ; rotate the pattern right
        MOV  D,A
        JMP  BEG`,
  "Add two numbers (result on lamps + memory)": `; 2 + 3 -> RESULT, then halt. Examine 0100H to see 05 on the DATA lamps.
        ORG  0
        LDA  X
        MOV  B,A
        LDA  Y
        ADD  B           ; A = X + Y, flags set
        STA  RESULT
        HLT
        ORG  0100H
RESULT: DB   0
X:      DB   2
Y:      DB   3`,
  "Hello via 88-2SIO serial card": `; print a string to the terminal through the 88-2SIO (status 10H, data 11H)
        ORG  0
        LXI  SP,0400H
        LXI  H,MSG
NEXT:   MOV  A,M
        ORA  A           ; zero terminator?
        JZ   DONE
        CALL PUTC
        INX  H
        JMP  NEXT
DONE:   HLT
PUTC:   PUSH PSW
WAIT:   IN   10H         ; 2SIO status
        ANI  02H         ; TDRE: transmitter empty?
        JZ   WAIT
        POP  PSW
        OUT  11H         ; send byte
        RET
MSG:    DB   'HELLO FROM THE ALTAIR 8800!',13,10,0`,
  "Echo + decimal counter (subroutines, stack, DAA)": `; counts 00..99 in BCD with DAA and prints each value, then echoes keys
        ORG  0
        LXI  SP,0400H
        MVI  C,0         ; BCD counter
LOOP:   MOV  A,C
        CALL PHEX
        MVI  A,' '
        CALL PUTC
        MOV  A,C
        ADI  1
        DAA              ; decimal adjust: 09+1 -> 10
        MOV  C,A
        CPI  20H         ; stop at 20 (BCD)
        JNZ  LOOP
ECHO:   IN   10H
        ANI  01H         ; RDRF: key waiting?
        JZ   ECHO
        IN   11H
        CALL PUTC
        JMP  ECHO
PHEX:   PUSH PSW
        RRC
        RRC
        RRC
        RRC
        CALL NIB
        POP  PSW
NIB:    ANI  0FH
        ADI  '0'
        CPI  '9'+1
        JC   PUTC
        ADI  7
PUTC:   PUSH PSW
W:      IN   10H
        ANI  02H
        JZ   W
        POP  PSW
        OUT  11H
        RET`,
};
function TA() {
  let t = document.createElement("canvas");
  ((t.width = 2048), (t.height = 626));
  let n = t.getContext("2d"),
    s = (c) => ((c + 0.85) / 1.7) * 2048,
    r = (c) => ((0.26 - c) / 0.52) * 626;
  ((n.fillStyle = "#1c2c4a"),
    n.fillRect(0, 0, 2048, 626),
    (n.fillStyle = "#20345a"),
    n.fillRect(0, r(0.25), 2048, r(-0.13) - r(0.25)),
    (n.fillStyle = "#e9eef8"),
    (n.strokeStyle = "#e9eef8"),
    (n.textAlign = "center"),
    (n.lineWidth = 3));
  let o = (c, h, d, u = 20) => {
    ((n.font = `bold ${u}px Arial`), n.fillText(c, s(h), r(d)));
  };
  (["INTE", "PROT", "MEMR", "INP", "M1", "OUT", "HLTA", "STACK", "WO", "INT"].forEach(
    (c, h) => o(c, -0.745 + h * 0.05, 0.205, 15),
  ),
    o("STATUS", -0.52, 0.235, 18));
  for (let c = 0; c < 8; c++) o("D" + (7 - c), 0.2325 + c * 0.065, 0.205);
  (o("DATA", 0.46, 0.235, 18), o("WAIT", -0.55, 0.075, 15), o("HLDA", -0.49, 0.075, 15));
  for (let c = 0; c < 16; c++)
    (o("A" + (15 - c), -0.2875 + c * 0.065, 0.075, 17),
      o(String(15 - c), -0.2875 + c * 0.065, -0.104, 15));
  o("ADDRESS", 0.2, 0.105, 18);
  let a = (c, h) => {
    let d = s(-0.2875 + c * 0.065 - 0.026),
      u = s(-0.2875 + h * 0.065 + 0.026),
      f = r(-0.112);
    (n.beginPath(),
      n.moveTo(d, f - 8),
      n.lineTo(d, f),
      n.lineTo(u, f),
      n.lineTo(u, f - 8),
      n.stroke());
  };
  (a(0, 0),
    a(1, 3),
    a(4, 6),
    a(7, 9),
    a(10, 12),
    a(13, 15),
    (n.font = "bold 16px Arial"),
    n.fillText("SENSE SW.  ← A15–A8 →", s(-0.06), r(-0.033) - 46),
    n.fillText("DATA  ← A7–A0 →", s(0.46), r(-0.033) - 46),
    [
      "STOP",
      "RUN",
      "SGL STEP",
      "EXAMINE",
      "EXAM NEXT",
      "DEPOSIT",
      "DEP NEXT",
      "RESET",
    ].forEach((c, h) => o(c, -0.42 + h * 0.09, -0.176, 13)),
    o("OFF  ON", -0.76, -0.095, 15));
  let l = new Wn(t);
  return ((l.colorSpace = Ot), (l.anisotropy = 8), l);
}
function Km() {
  let i = new Float64Array(16),
    e = new Float64Array(8),
    t = 0,
    n = 0,
    s = 0,
    r = "r",
    o = 0,
    a = new Xa((v, R, _) => {
      ((n = v), (s = R), (r = _), t++);
      for (let P = 0; P < 16; P++) (v >> P) & 1 && i[P]++;
      for (let P = 0; P < 8; P++) (R >> P) & 1 && e[P]++;
    }),
    l = 0,
    c = !1,
    h = 1,
    d = 2e6,
    u = "",
    f = "",
    p = [],
    x = {},
    g = {},
    m = [],
    S = {},
    b;
  ((a.out = (v, R) => {
    if (((o = 1), v === 17)) {
      if (R === 13) return;
      (R === 8 ? (f = f.slice(0, -1)) : (f += String.fromCharCode(R)),
        f.length > 4e3 && (f = f.slice(-3e3)),
        y.diag.pulse("bus", "sio", "#5fe08a", 3),
        y.diag.pulse("sio", "term", "#5fe08a", 3));
    }
  }),
    (a.inp = (v) => (
      (o = 1),
      v === 255
        ? (y.diag.pulse("panel", "bus", "#ff5f5f", 3), l >> 8)
        : v === 16
          ? (p.length ? 1 : 0) | 2
          : v === 17
            ? (p.shift() ?? 0)
            : 255
    )));
  let y = {
    id: "altair",
    era: "1970s",
    short: "First personal computer",
    sim: a,
    name: "MITS Altair 8800 (Intel 8080, S-100 bus)",
    blurb:
      'The January 1975 Popular Electronics cover machine that launched the personal-computer industry (and Microsoft). A $439 kit: an Intel 8080 CPU card, 256 bytes of RAM, and a front panel of switches and LEDs you programmed in binary. This is a full 8080 instruction-set emulator with real cycle timing at 2 MHz, an 8080 assembler, the S-100 front panel (EXAMINE/DEPOSIT/RUN/STEP), sense switches on port FFh and an 88-2SIO serial card driving a terminal. Try "Kill the Bit".',
    diagram: {
      nodes: [
        {
          id: "cpu",
          label: `Intel 8080
2 MHz, 8-bit`,
          x: 0.14,
          y: 0.22,
          w: 0.2,
          color: "#ff5f5f",
        },
        {
          id: "bus",
          label: "S-100 bus  (16 addr · 8+8 data · status)",
          x: 0.5,
          y: 0.5,
          w: 0.9,
          h: 0.13,
          color: "#ffd166",
        },
        {
          id: "ram",
          label: `RAM card
2102 SRAM`,
          x: 0.42,
          y: 0.84,
          w: 0.18,
          color: "#58c4ff",
        },
        {
          id: "panel",
          label: `Front panel
LEDs+switches`,
          x: 0.14,
          y: 0.84,
          w: 0.22,
          color: "#c08cff",
        },
        {
          id: "sio",
          label: `88-2SIO
ACIA 6850`,
          x: 0.7,
          y: 0.84,
          w: 0.17,
          color: "#5fe08a",
        },
        {
          id: "term",
          label: "Terminal",
          x: 0.88,
          y: 0.22,
          w: 0.16,
          color: "#5fe08a",
        },
        {
          id: "ps",
          label: `Linear PSU
+8/±16 V`,
          x: 0.5,
          y: 0.17,
          w: 0.18,
          color: "#8b98a9",
        },
      ],
      edges: [
        ["cpu", "bus"],
        ["bus", "ram"],
        ["ram", "bus"],
        ["bus", "panel"],
        ["panel", "bus"],
        ["bus", "sio"],
        ["sio", "term"],
        ["ps", "bus"],
      ],
    },
    build(v) {
      let R = U.plastic(2776460, 0.45),
        _ = U.metal(7311270, 0.45);
      (v.box(1.7, 0.04, 1.5, U.metal(8885408, 0.5), [0, 0.02, 0], {}),
        v.box(1.72, 0.03, 1.52, _, [0, 0.54, 0], {
          name: "Top cover",
          info: "Folded aluminium cover. Inside it is mostly empty space — room for up to 18 S-100 cards. Use Cutaway.",
          shell: !0,
          explode: [0, 0.6, 0],
        }),
        v.box(0.03, 0.52, 1.5, _, [-0.85, 0.28, 0], {
          name: "Side",
          info: "Case side.",
          shell: !0,
          explode: [-0.4, 0, 0],
        }),
        v.box(0.03, 0.52, 1.5, _, [0.85, 0.28, 0], {
          name: "Side",
          info: "Case side.",
          shell: !0,
          explode: [0.4, 0, 0],
        }),
        v.box(1.7, 0.52, 0.03, _, [0, 0.28, -0.75], {
          name: "Rear panel",
          info: "Rear panel with power switch and fuse.",
          shell: !0,
          explode: [0, 0, -0.4],
        }));
      let P = v.group([0, 0.28, 0.76], {
          name: "Front panel",
          info: 'Lights and switches wired straight onto the S-100 bus. 16 address switches (A15–A0, also the data switches D7–D0 and the "sense switches" A15–A8 read by IN 0FFh). LED brightness here is a real duty cycle: the fraction of bus cycles each line was high during the frame — exactly why the bit in Kill the Bit glows.',
        }),
        V = new B(new te(1.7, 0.52, 0.02), [
          U.plastic(1846346, 0.35),
          U.plastic(1846346, 0.35),
          U.plastic(1846346, 0.35),
          U.plastic(1846346, 0.35),
          new et({ map: TA(), roughness: 0.42, metalness: 0.05 }),
          U.plastic(1846346, 0.35),
        ]);
      P.add(V);
      {
        let W = v.box(
          0.07,
          0.045,
          0.025,
          U.plastic(1118481, 0.5),
          [-0.76, -0.13, 0.02],
          {
            name: "Power rocker (ON / OFF)",
            info: "Mains switch for the linear supply: a big transformer and filter capacitors give unregulated +8 V and ±16 V to every card, each card regulates locally (7805s on heatsinks).",
          },
          P,
        );
        W.rotation.x = 0.18;
      }
      let k = new B(new te(1.7, 0.08, 0.022), U.plastic(5210037, 0.35));
      ((k.position.y = -0.22),
        P.add(k),
        Nt(
          v,
          "ALTAIR 8800",
          0.42,
          0.06,
          [-0.6, -0.22, 0.013],
          { bg: null, color: "#ffffff", font: "italic bold 48px Arial" },
          P,
        ),
        Nt(
          v,
          "MITS · COMPUTER",
          0.3,
          0.04,
          [0.6, -0.22, 0.013],
          { bg: null, color: "#dde8ff" },
          P,
        ),
        (g.status = fs(
          v,
          10,
          [-0.52, 0.17, 0.012],
          0.05,
          16722458,
          {
            r: 0.017,
            bezel: !0,
            name: "Status LEDs",
            info: "INTE PROT MEMR INP M1 OUT HLTA STACK WO INT — the 8080 status byte latched by the 8224/8228 at the start of every machine cycle.",
            live: () =>
              `MEMR ${r === "r" ? 1 : 0}  WO ${r === "w" ? 0 : 1}  HLTA ${a.halted ? 1 : 0}  INTE ${a.inte ? 1 : 0}`,
          },
          P,
        )),
        (g.addr = fs(
          v,
          16,
          [0.2, 0.04, 0.012],
          0.065,
          16722458,
          {
            r: 0.019,
            bezel: !0,
            name: "Address LEDs A15–A0",
            info: "Show the address bus. During a run they blur into duty-cycle brightness; when stopped they show the examined address (= PC).",
            live: () => "last address " + bt(n, 4) + "h",
          },
          P,
        )),
        (g.data = fs(
          v,
          8,
          [0.46, 0.17, 0.012],
          0.065,
          16722458,
          {
            r: 0.019,
            bezel: !0,
            name: "Data LEDs D7–D0",
            info: "Show the data bus (byte read from or written to memory).",
            live: () => "last data " + bt(s) + "h",
          },
          P,
        )),
        (g.wait = fs(
          v,
          2,
          [-0.52, 0.04, 0.012],
          0.06,
          16722458,
          {
            r: 0.017,
            bezel: !0,
            name: "WAIT / HLDA",
            info: "WAIT lit when the CPU is stopped by the front panel; HLDA = hold acknowledge (DMA).",
          },
          P,
        )));
      for (let W = 0; W < 16; W++) {
        let G = Ba(
          v,
          [0.2 + (7.5 - W) * 0.065, -0.07, 0.012],
          {
            name: `Switch A${W}${W >= 8 ? " (sense SW " + W + ")" : " / D" + W}`,
            info: "Click to toggle. Up = 1.",
            mat: U.plastic(15132390, 0.4),
          },
          P,
        );
        ((G.rotation.x = -Math.PI / 2), (G.userData.bit = W), m.push(G));
      }
      [
        "STOP",
        "RUN",
        "SINGLE STEP",
        "EXAMINE",
        "EXAMINE NEXT",
        "DEPOSIT",
        "DEPOSIT NEXT",
        "RESET",
      ].forEach((W, G) => {
        let le = Ba(
          v,
          [-0.42 + G * 0.09, -0.15, 0.012],
          {
            name: "Control: " + W,
            info: "Momentary front-panel control switch. Click to operate.",
            mat: U.plastic(9417952, 0.4),
          },
          P,
        );
        ((le.rotation.x = -Math.PI / 2), (le.userData.key = W), (S[W] = le));
      });
      let L = v.group([0, 0.05, -0.1], {
          name: "S-100 motherboard (backplane)",
          info: '100-pin edge connectors, all wired in parallel: 16 address lines, separate 8-bit data-in and data-out buses, status and control lines, plus unregulated +8 V and ±16 V — each card has its own regulators. The "S-100" bus became the first industry-standard microcomputer bus (IEEE-696).',
          explode: [0, -0.15, 0],
        }),
        z = new B(new te(1.2, 0.02, 0.6), U.pcb(2783808));
      L.add(z);
      for (let W = 0; W < 8; W++) {
        let G = new B(new te(0.03, 0.04, 0.56), U.plastic(2236962));
        (G.position.set(-0.5 + W * 0.12, 0.03, 0), L.add(G));
      }
      let F = (W, G, le, pe, Ee) => {
        let be = Gs(v, 0.5, 0.26, [-0.5 + W * 0.12, 0.07, -0.1], {
          name: G,
          info: le,
          live: Ee,
          explode: [0, 0.55, 0],
        });
        return (
          (be.rotation.y = Math.PI / 2),
          pe.forEach(([re, de, D, $, Y]) => {
            let se = new B(new te(D, $, 0.012), U.plastic(Y || 1776413, 0.4));
            (se.position.set(re, de + 0.03, 0.012), be.add(se));
          }),
          be
        );
      };
      (F(
        0,
        "CPU card — Intel 8080A",
        "6,000-transistor NMOS CPU, 2 MHz two-phase clock from an 8224 generator; 8228 system controller derives bus status. Registers: A, flags, BC, DE, HL, SP, PC. 72 instructions, ~0.29 MIPS. The emulator runs it cycle-counted.",
        [
          [0, 0.14, 0.24, 0.06, 2763310],
          [-0.16, 0.06, 0.06, 0.04],
          [0.16, 0.06, 0.08, 0.04],
          [0.04, 0.05, 0.03, 0.02, 12632256],
        ],
        () => `PC ${bt(a.pc, 4)}  SP ${bt(a.sp, 4)}  A ${bt(a.A)}
cycles ${a.cycles}`,
      ),
        F(
          1,
          "RAM card (2102 static RAM)",
          "1-kilobit × 1 static RAM chips (2102), 8 per kilobyte. Static: no refresh needed, each bit a 6-transistor flip-flop. The emulator gives this machine 64 KB.",
          Array.from({ length: 16 }, (W, G) => [
            -0.18 + (G % 8) * 0.05,
            0.05 + Math.floor(G / 8) * 0.08,
            0.035,
            0.05,
          ]),
        ),
        F(
          2,
          "88-2SIO serial card",
          "Two Motorola 6850 ACIAs: parallel-to-serial UARTs. Status port 10h (bit0 RDRF receive full, bit1 TDRE transmit empty), data port 11h. RS-232 levels to the terminal.",
          [
            [-0.08, 0.08, 0.12, 0.05],
            [0.1, 0.08, 0.12, 0.05],
            [0, 0.18, 0.06, 0.03],
          ],
        ),
        F(
          3,
          "Front-panel interface card",
          "Buffers the bus onto the LEDs and lets the switches jam instructions onto the data-in bus (EXAMINE works by forcing a JMP addr into the CPU!).",
          [
            [-0.1, 0.1, 0.05, 0.04],
            [0, 0.1, 0.05, 0.04],
            [0.1, 0.1, 0.05, 0.04],
          ],
        ),
        Dt(
          v,
          [
            [-0.14, 0.2, -0.1],
            [-0.1, 0.35, 0.5],
            [0, 0.3, 0.74],
          ],
          0.012,
          10132122,
        ));
      let H = v.group([0.5, 0.04, -0.45], {
          name: "Linear power supply",
          info: "Massive transformer + bridge rectifiers + a big filter capacitor deliver UNREGULATED +8 V and ±16 V to the bus; each card regulates locally with 7805s on heatsinks. Fully loaded Altairs drew ~8 A at 8 V.",
          explode: [0.4, 0, -0.3],
        }),
        j = new B(new te(0.3, 0.24, 0.22), U.metal(3947580, 0.5));
      ((j.position.y = 0.12), H.add(j));
      let K = new B(new ke(0.1, 0.1, 0.22, 20), U.copper());
      ((K.rotation.z = Math.PI / 2), (K.position.y = 0.13), H.add(K));
      let ue = new B(new ke(0.07, 0.07, 0.22, 20), U.metal(2771616, 0.3));
      (ue.position.set(-0.3, 0.11, 0.05), H.add(ue));
      let Me = v.group([1.48, 0, 0.08], {
        name: "Video terminal (ADM-3A style)",
        info: "Dumb terminal: 80×24 characters at 9600 baud over RS-232. Every byte the program OUTs to port 11h appears here. Type into the terminal box in the panel to send bytes back (RDRF).",
        explode: [0.5, 0, 0],
      });
      let admBase = new B(
        chamferBox(0.76, 0.1, 0.68, 0.016, 2),
        U.plastic(0xd8d0be, 0.45),
      );
      admBase.position.set(0, 0.05, 0.06);
      admBase.castShadow = !0;
      Me.add(admBase);
      b = buildMonitor3D(
        v,
        [0, 0.095, -0.06],
        {
          crt: true,
          stand: false,
          w: 0.58,
          h: 0.43,
          res: [1024, 744],
          color: 0xd8d0be,
          name: "ADM-3A P31 CRT Display",
          info: "12-inch monochrome green-phosphor cathode-ray tube driven by UART 80×24 character generator ROM.",
        },
        Me,
      );
      buildSculptedKeyboard(
        v,
        [0, 0.065, 0.36],
        {
          w: 0.68,
          d: 0.24,
          h: 0.042,
          tilt: 0.11,
          leds: false,
          bodyColor: 0xd8d0be,
          keyColor: 0x3b3530,
          modColor: 0x26221e,
          accentColor: 0x9e3b24,
          legendColor: "#f2ece0",
          name: "ADM-3A Integrated Keyboard",
          info: "59-key mechanical ASCII keyboard (home-row arrows HJKL inspired vi!).",
        },
        Me,
      );
      buildCoiledCable(
        v,
        [
          [0.85, 0.12, -0.35],
          [1.08, 0.04, -0.25],
          [1.26, 0.08, -0.12],
        ],
        0.016,
        0.0055,
        16,
        0x26282e,
        {
          name: "RS-232 Serial Cable (DB-25)",
          info: "Carries ±12 V EIA RS-232-C TXD/RXD serial bitstreams at 9600 baud between the 88-2SIO card and the ADM-3A terminal.",
        },
      );
    },
    onPick(v) {
      let R = v.userData;
      if (R.bit !== void 0) return ((l ^= 1 << R.bit), M(), !1);
      if (R.key) return (E(R.key), !1);
    },
    ui(v) {
      let R = Object.keys(Za);
      ((x.code = Ht(Za[R[0]], (_) => T(_), 14)),
        (x.err = q("div", { class: "err" })),
        (x.sw = q("div", { class: "row" })),
        (x.swB = []));
      for (let _ = 15; _ >= 0; _--) {
        let P = q(
          "button",
          {
            class: "btn",
            style: { width: "22px", padding: "4px 0" },
            title: "A" + _,
            onclick: () => {
              ((l ^= 1 << _), M());
            },
          },
          "0",
        );
        ((x.swB[_] = P),
          x.sw.append(P),
          _ === 8 && x.sw.append(q("span", { style: { width: "8px" } })));
      }
      ((x.swv = q("span", { class: "okc" })),
        (x.regs = q("div", { class: "regs" })),
        (x.mem = q("div", { class: "regs", style: { maxHeight: "150px" } })),
        (x.term = q("pre", { class: "term" })),
        (x.kin = q("input", {
          type: "text",
          placeholder: "type here → 2SIO receive (Enter sends CR)",
          style: { width: "100%" },
          onkeydown: (_) => {
            if ((_.stopPropagation(), _.key === "Enter")) {
              for (let P of x.kin.value) p.push(P.charCodeAt(0));
              (p.push(13), (x.kin.value = ""));
            }
          },
        })),
        (x.stats = Pt([
          ["ins", "instructions"],
          ["cy", "T-states"],
          ["mhz", "effective clock"],
          ["tm", "8080 time"],
        ])),
        (x.runB = Fe("RUN", () => E(c ? "STOP" : "RUN"), "pri")),
        v.append(
          Ie(
            "8080 assembly (assembled into RAM on each edit)",
            q(
              "div",
              { class: "row" },
              "Load ",
              st(R, R[0], (_) => {
                ((x.code.value = Za[_]), T(Za[_]));
              }),
            ),
            x.code,
            x.err,
            q(
              "div",
              { class: "small" },
              "Full 8080 set: MOV MVI LXI LDA STA LDAX STAX LHLD SHLD XCHG ADD ADC SUB SBB ANA XRA ORA CMP (+I forms) INR DCR INX DCX DAD DAA RLC RRC RAL RAR CMA STC CMC JMP/Jcc CALL/Ccc RET/Rcc RST PUSH POP XTHL SPHL PCHL IN OUT EI DI HLT. Directives ORG DB DW DS EQU. Hex = 0FFh.",
            ),
          ),
          Ie(
            "Front panel",
            q(
              "div",
              { class: "small" },
              "Address / data switches A15…A0 (A15–A8 are the sense switches):",
            ),
            x.sw,
            q("div", {}, "switches = ", x.swv),
            q(
              "div",
              { class: "row" },
              x.runB,
              ...[
                "SINGLE STEP",
                "EXAMINE",
                "EXAMINE NEXT",
                "DEPOSIT",
                "DEPOSIT NEXT",
                "RESET",
              ].map((_) => Fe(_, () => E(_))),
            ),
            We(
              "Clock",
              0,
              6.3,
              0.01,
              Math.log10(d),
              (_) => (d = 10 ** _),
              (_) => {
                let P = 10 ** _;
                return P >= 1e6
                  ? (P / 1e6).toFixed(2) + " MHz"
                  : P >= 1e3
                    ? (P / 1e3).toFixed(1) + " kHz"
                    : P.toFixed(0) + " Hz";
              },
            ),
            q(
              "div",
              { class: "row" },
              We(
                "Step size",
                0,
                12,
                1,
                0,
                (_) => (h = 2 ** _),
                (_) => 2 ** _ + " instr.",
              ),
              Fe("Step N", () => {
                ((c = !1), (a.halted = !1));
                for (let _ = 0; _ < h && !a.halted; _++) a.step();
                y.diag.pulse("cpu", "bus", "#ff5f5f");
              }),
            ),
          ),
          Ie("8080 registers", x.regs),
          Ie("Memory (hex)", x.mem),
          Ie("Terminal (88-2SIO port 11h)", x.term, x.kin),
          x.stats,
        ),
        T(x.code.value),
        M());
    },
    update(v) {
      (i.fill(0), e.fill(0), (t = 0));
      let R = 0;
      if (c) {
        let _ = a.cycles + Math.min(d * v, 4e5),
          P = a.cycles;
        for (; a.cycles < _ && !a.halted;) a.step();
        ((R = a.cycles - P),
          a.halted && (c = !1),
          Math.random() < 0.6 &&
            (y.diag.pulse("cpu", "bus", "#ff5f5f", 3),
            y.diag.pulse("bus", "ram", "#58c4ff", 3)));
      }
      (t
        ? (Ki(
            g.addr,
            0,
            16,
            Array.from(i, (_) => Math.pow(_ / t, 0.6)),
          ),
          Ki(
            g.data,
            0,
            8,
            Array.from(e, (_) => Math.pow(_ / t, 0.6)),
          ))
        : (Ki(g.addr, a.pc), Ki(g.data, a.mem[a.pc])),
        Ki(
          g.status,
          (r === "r" ? 4 : 0) |
            (a.halted ? 8 : 0) |
            (a.inte ? 512 : 0) |
            (r !== "w" ? 2 : 0) |
            (o ? 16 : 0) |
            (32 * (c ? 1 : 0)),
        ),
        Ki(g.wait, c ? 0 : 2),
        (o = 0),
        x.stats.set("mhz", c ? (R / v / 1e6).toFixed(3) + " MHz" : "stopped"),
        A(),
        w());
    },
  };
  function E(v) {
    let R = y.diag;
    (R.pulse("panel", "bus", "#c08cff", 3),
      v === "RUN"
        ? ((a.halted = !1), (c = !0))
        : v === "STOP"
          ? (c = !1)
          : v === "SINGLE STEP"
            ? ((c = !1),
              (a.halted = !1),
              i.fill(0),
              a.step(),
              R.pulse("cpu", "bus", "#ff5f5f"))
            : v === "EXAMINE"
              ? ((a.pc = l & 65535), (n = a.pc), (s = a.mem[a.pc]))
              : v === "EXAMINE NEXT"
                ? ((a.pc = (a.pc + 1) & 65535), (n = a.pc))
                : v === "DEPOSIT"
                  ? ((a.mem[a.pc] = l & 255), R.pulse("bus", "ram", "#58c4ff"))
                  : v === "DEPOSIT NEXT"
                    ? ((a.pc = (a.pc + 1) & 65535),
                      (a.mem[a.pc] = l & 255),
                      R.pulse("bus", "ram", "#58c4ff"))
                    : v === "RESET" && ((a.pc = 0), (a.halted = !1)));
    let _ = S[v];
    _ && (za(_, 1), setTimeout(() => za(_, 0), 180));
  }
  function M() {
    for (let v = 0; v < 16; v++) {
      let R = (l >> v) & 1;
      ((x.swB[v].textContent = R),
        (x.swB[v].style.outline = R ? "2px solid #ff2a1a" : ""));
    }
    (m.forEach((v) => za(v, (l >> v.userData.bit) & 1)),
      (x.swv.textContent = bt(l, 4) + "h  (sense " + bt(l >> 8) + "h)"));
  }
  function T(v) {
    let R = b0(v);
    ((u = R.errors.join(`
`)),
      (x.err.textContent = u),
      !u &&
        ((c = !1),
        a.reset(),
        a.mem.set(R.mem),
        (a.pc = R.start),
        (f = ""),
        (y._asm = R)));
  }
  function A() {
    let v = b.ctx;
    (v.save(),
      v.scale(2, 2),
      (v.fillStyle = "#061109"),
      v.fillRect(0, 0, 512, 372),
      (v.fillStyle = "rgba(74,246,134,0.09)"),
      v.fillRect(0, 0, 512, 26),
      (v.fillStyle = "#4af686"),
      (v.font = "bold 13px monospace"),
      v.fillText("LEAR SIEGLER ADM-3A · MITS 88-2SIO 9600 8N1", 10, 17),
      (v.strokeStyle = "rgba(74,246,134,0.28)"),
      (v.lineWidth = 1),
      v.beginPath(),
      v.moveTo(0, 26),
      v.lineTo(512, 26),
      v.stroke(),
      (v.fillStyle = "#8dffb0"),
      (v.font = "bold 16px monospace"));
    let R = f.trim()
      ? f.split("\n").slice(-14)
      : [
          "MITS ALTAIR 8800 S-100 BUS MONITOR",
          `CPU: INTEL 8080A @ 2.000 MHz (${c ? "RUNNING" : a.halted ? "HALTED" : "STOPPED"})`,
          `PC=${bt(a.pc, 4)}h  SP=${bt(a.sp, 4)}h  A=${bt(a.r[7])}h  BC=${bt(a.r[0])}${bt(a.r[1])}h`,
          `DE=${bt(a.r[2])}${bt(a.r[3])}h  HL=${bt(a.r[4])}${bt(a.r[5])}h  SW=${bt(l, 4)}h`,
          `MEM[${bt(a.pc, 4)}h] = ${bt(a.mem[a.pc])}h   CYCLES = ${a.cycles}`,
          "",
          "2SIO PORT 10h/11h READY FOR SERIAL I/O:",
          "> Select 'Hello via 88-2SIO' or 'Echo' preset",
        ];
    (R.forEach((_, P) => v.fillText(_.slice(-44), 10, 48 + P * 21)),
      Math.floor(performance.now() / 500) % 2 &&
        v.fillRect(
          10 + Math.min(44, (R[R.length - 1] || "").length) * 9.6,
          34 + (R.length - 1) * 21,
          10,
          17,
        ),
      (v.fillStyle = "rgba(0,0,0,0.18)"));
    for (let sy = 0; sy < 372; sy += 3) v.fillRect(0, sy, 512, 1);
    (v.restore(), (b.tex.needsUpdate = !0));
  }
  function w() {
    let v = a.r,
      R = a.f;
    x.regs.textContent = `A ${bt(v[7])}  B ${bt(v[0])} C ${bt(v[1])}  D ${bt(v[2])} E ${bt(v[3])}  H ${bt(v[4])} L ${bt(v[5])}
SP ${bt(a.sp, 4)}  PC ${bt(a.pc, 4)}  flags S${(R >> 7) & 1} Z${(R >> 6) & 1} AC${(R >> 4) & 1} P${(R >> 2) & 1} CY${R & 1}  ${c ? "RUN" : a.halted ? "HLT" : "STOPPED"}`;
    let _ = "",
      P = a.pc & 65520;
    for (let V = -1; V < 6; V++) {
      let k = (P + V * 16) & 65535;
      _ += bt(k, 4) + ": ";
      for (let L = 0; L < 16; L++)
        _ += (((k + L) & 65535) === a.pc ? "[" : " ") + bt(a.mem[(k + L) & 65535]);
      _ += `
`;
    }
    (x.mem.textContent !== _ && (x.mem.textContent = _),
      x.term.textContent !== f && ((x.term.textContent = f), (x.term.scrollTop = 1e9)),
      x.stats.set("ins", a.instr),
      x.stats.set("cy", a.cycles),
      x.stats.set("tm", (a.cycles / 2e3).toFixed(1) + " ms"),
      (x.runB.textContent = c ? "STOP" : "RUN"));
  }
  return (
    (y.test = () => {
      let v = (k, L) => {
          let z = b0(Za[k]),
            F = new Xa();
          F.mem.set(z.mem);
          let H = "";
          ((F.out = (K, ue) => {
            K === 17 && (H += String.fromCharCode(ue));
          }),
            (F.inp = (K) => (K === 16 ? 2 : 0)));
          let j = 0;
          for (; !F.halted && j++ < 2e5;) F.step();
          return { c: F, o: H };
        },
        R = v("Add two numbers (result on lamps + memory)"),
        _ = v("Hello via 88-2SIO serial card"),
        P = b0(`MVI A,15H
ADI 27H
DAA
HLT`),
        V = new Xa();
      for (V.mem.set(P.mem); !V.halted;) V.step();
      return {
        add_2_3: R.c.mem[256],
        hello: _.o.trim(),
        bcd_15_plus_27: V.A.toString(16),
        ok: R.c.mem[256] === 5 && _.o.startsWith("HELLO FROM THE ALTAIR") && V.A === 66,
      };
    }),
    (y.isRunning = () => c),
    (y.bus = () => ({ a: n, d: s, t: r })),
    y
  );
}
