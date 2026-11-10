var ju = {
    AND: 0,
    TAD: 512,
    ISZ: 1024,
    DCA: 1536,
    JMS: 2048,
    JMP: 2560,
    IOT: 3072,
    OPR: 3584,
    NOP: 3584,
    IAC: 3585,
    BSW: 3586,
    RAL: 3588,
    RTL: 3590,
    RAR: 3592,
    RTR: 3594,
    CML: 3600,
    CMA: 3616,
    CIA: 3617,
    CLL: 3648,
    STL: 3664,
    CLA: 3712,
    GLK: 3716,
    STA: 3744,
    HLT: 3842,
    OSR: 3844,
    SKP: 3848,
    SNL: 3856,
    SZL: 3864,
    SZA: 3872,
    SNA: 3880,
    SMA: 3904,
    SPA: 3912,
    LAS: 3972,
    ION: 3073,
    IOF: 3074,
    KSF: 3097,
    KCC: 3098,
    KRS: 3100,
    KRB: 3102,
    TSF: 3105,
    TCF: 3106,
    TPC: 3108,
    TLS: 3110,
    I: 256,
    Z: 0,
  },
  iA = new Set(["AND", "TAD", "ISZ", "DCA", "JMS", "JMP"]);
function vm(i) {
  let e = {},
    t = [],
    n = new Uint16Array(4096),
    s = new Set(),
    r = 128,
    o = !1,
    a = [];
  i.split(
    `
`,
  ).forEach((c, h) => {
    let d = c
      .replace(/"\//g, '"')
      .replace(/\/.*$/, "")
      .replace(/" /g, '"')
      .replace(/";/g, '"');
    for (let u of d.split(";")) ((u = u.trim()), u && a.push({ s: u, line: h + 1 }));
  });
  let l = (c, h, d, u) => {
    let f = 0,
      p = "|",
      x = c.match(/"[\s\S]|[A-Za-z_][\w]*|\d+|[.+\-]|\S/g) || [];
    for (let g of x) {
      if (g === "+" || g === "-") {
        p = g;
        continue;
      }
      let m;
      if (g[0] === '"') m = ({ "": 32, "": 47, "": 59 }[g[1]] || g.charCodeAt(1)) | 128;
      else if (/^\d+$/.test(g))
        (/[89]/.test(g) && t.push(`line ${d}: "${g}" is not octal`),
          (m = parseInt(g, 8)));
      else if (g === ".") m = h;
      else {
        let S = g.toUpperCase();
        S in e
          ? (m = e[S])
          : S in ju
            ? (m = ju[S])
            : (u === 2 && t.push(`line ${d}: undefined symbol ${g}`), (m = 0));
      }
      ((f = p === "+" ? f + m : p === "-" ? f - m : f | m), (p = "|"));
    }
    return f & 4095;
  };
  for (let c of [1, 2]) {
    let h = 128;
    for (let d of a) {
      let u = d.s;
      if (u[0] === "*") {
        ((h = l(u.slice(1), h, d.line, c)), o || ((r = h), (o = !0)));
        continue;
      }
      if (u === "$") break;
      let f = u.match(/^([A-Za-z_]\w*),\s*(.*)$/);
      if (!(f && (c === 1 && (e[f[1].toUpperCase()] = h), (u = f[2].trim()), !u))) {
        if (c === 2) {
          let p = u.split(/\s+/),
            x = p[0].toUpperCase(),
            g;
          if (iA.has(x)) {
            let m = 0,
              S = p.slice(1);
            S[0] && S[0].toUpperCase() === "I" && ((m = 256), (S = S.slice(1)));
            let b = l(S.join(" ") || "0", h, d.line, 2),
              y;
            ((b & 3968) === 0
              ? (y = b & 127)
              : (b & 3968) === (h & 3968)
                ? (y = 128 | (b & 127))
                : (t.push(
                    `line ${d.line}: ${u} — target ${b.toString(8)} not on page 0 or current page`,
                  ),
                  (y = 0)),
              (g = ju[x] | m | y));
          } else g = l(u, h, d.line, 2);
          (s.has(h) &&
            t.push(`line ${d.line}: location ${h.toString(8)} assembled twice`),
            s.add(h),
            (n[h] = g));
        }
        h = (h + 1) & 4095;
      }
    }
  }
  return { mem: n, labels: e, errors: t, start: r, used: s };
}
function yc(i, e) {
  let t = i >> 9;
  if (t < 6) {
    let n = ["AND", "TAD", "ISZ", "DCA", "JMS", "JMP"][t],
      s = (i & 128 ? e & 3968 : 0) | (i & 127);
    return `${n}${i & 256 ? " I" : ""} ${s.toString(8).padStart(4, "0")}`;
  }
  if (t === 6) {
    let n = Object.entries(ju).find(([s, r]) => r === i && s.length === 3);
    return n ? n[0] : "IOT " + (i & 511).toString(8);
  }
  if (!(i & 256)) {
    let n = [];
    (i & 128 && n.push("CLA"),
      i & 64 && n.push("CLL"),
      i & 32 && n.push("CMA"),
      i & 16 && n.push("CML"),
      i & 1 && n.push("IAC"));
    let s = i & 14;
    return (
      s === 8 && n.push("RAR"),
      s === 10 && n.push("RTR"),
      s === 4 && n.push("RAL"),
      s === 6 && n.push("RTL"),
      s === 2 && n.push("BSW"),
      n.join(" ") || "NOP"
    );
  }
  if (!(i & 1)) {
    let n = [],
      s = i & 8;
    return (
      i & 64 && n.push(s ? "SPA" : "SMA"),
      i & 32 && n.push(s ? "SNA" : "SZA"),
      i & 16 && n.push(s ? "SZL" : "SNL"),
      s && !(i & 112) && n.push("SKP"),
      i & 128 && n.push("CLA"),
      i & 4 && n.push("OSR"),
      i & 2 && n.push("HLT"),
      n.join(" ") || "NOP"
    );
  }
  return "EAE " + i.toString(8);
}
var Ca = class {
    constructor() {
      ((this.mem = new Uint16Array(4096)),
        (this.ac = 0),
        (this.l = 0),
        (this.pc = 128),
        (this.ma = 0),
        (this.mb = 0),
        (this.ir = 0),
        (this.sr = 0),
        (this.run = !1),
        (this.halted = !1),
        (this.cycles = 0),
        (this.instr = 0),
        (this.tty = ""),
        (this.ttyFlag = !0),
        (this.kbd = []),
        (this.kbdFlag = !1),
        (this.kbdBuf = 0),
        (this.touch = new Float32Array(4096)),
        (this.onAccess = null));
    }
    read(e) {
      return (
        (this.ma = e),
        (this.mb = this.mem[e]),
        this.cycles++,
        (this.touch[e] = 1),
        this.onAccess && this.onAccess("r", e),
        this.mb
      );
    }
    write(e, t) {
      ((this.ma = e),
        (this.mb = t & 4095),
        (this.mem[e] = this.mb),
        this.cycles++,
        (this.touch[e] = 1),
        this.onAccess && this.onAccess("w", e));
    }
    ea(e, t) {
      let n = (e & 128 ? t & 3968 : 0) | (e & 127);
      return (
        e & 256 &&
          (n >= 8 && n <= 15 && this.write(n, this.read(n) + 1), (n = this.read(n))),
        n
      );
    }
    step() {
      if (this.halted) return null;
      let e = this.pc,
        t = this.read(e);
      ((this.ir = t >> 9), (this.pc = (e + 1) & 4095), this.instr++);
      let n = t >> 9,
        s = { loc: e, w: t, op: n };
      switch (n) {
        case 0: {
          let r = this.ea(t, e);
          ((this.ac &= this.read(r)), (s.mem = r));
          break;
        }
        case 1: {
          let r = this.ea(t, e),
            o = this.ac + this.read(r);
          (o > 4095 && (this.l ^= 1), (this.ac = o & 4095), (s.mem = r));
          break;
        }
        case 2: {
          let r = this.ea(t, e),
            o = (this.read(r) + 1) & 4095;
          (this.write(r, o), o || (this.pc = (this.pc + 1) & 4095), (s.mem = r));
          break;
        }
        case 3: {
          let r = this.ea(t, e);
          (this.write(r, this.ac), (this.ac = 0), (s.mem = r), (s.store = !0));
          break;
        }
        case 4: {
          let r = this.ea(t, e);
          (this.write(r, this.pc), (this.pc = (r + 1) & 4095), (s.jump = !0));
          break;
        }
        case 5: {
          let r = this.ea(t, e);
          ((this.pc = r), (s.jump = !0));
          break;
        }
        case 6:
          this.iot(t, s);
          break;
        case 7:
          this.opr(t);
          break;
      }
      return s;
    }
    iot(e, t) {
      let n = (e >> 3) & 63,
        s = e & 7;
      if (((t.io = n), n === 4)) {
        if (
          (s & 1 && this.ttyFlag && (this.pc = (this.pc + 1) & 4095),
          s & 2 && (this.ttyFlag = !1),
          s & 4)
        ) {
          let r = this.ac & 127;
          (r === 13 ||
            (this.tty +=
              r === 10
                ? `
`
                : String.fromCharCode(r)),
            (this.ttyFlag = !0),
            (t.print = r));
        }
      } else
        n === 3 &&
          (!this.kbdFlag &&
            this.kbd.length &&
            ((this.kbdBuf = this.kbd.shift() | 128), (this.kbdFlag = !0)),
          s & 1 && this.kbdFlag && (this.pc = (this.pc + 1) & 4095),
          s & 2 && ((this.ac = 0), (this.kbdFlag = !1)),
          s & 4 && (this.ac |= this.kbdBuf));
    }
    opr(e) {
      if (e & 256) {
        if (!(e & 1)) {
          let t = !1,
            n = (this.ac & 2048) !== 0,
            s = this.ac === 0,
            r = this.l === 1;
          (e & 8
            ? ((t = !0),
              e & 64 && (t = t && !n),
              e & 32 && (t = t && !s),
              e & 16 && (t = t && !r))
            : (e & 64 && (t = t || n), e & 32 && (t = t || s), e & 16 && (t = t || r)),
            t && (this.pc = (this.pc + 1) & 4095),
            e & 128 && (this.ac = 0),
            e & 4 && (this.ac |= this.sr),
            e & 2 && ((this.halted = !0), (this.run = !1)));
        }
      } else {
        if (
          (e & 128 && (this.ac = 0),
          e & 64 && (this.l = 0),
          e & 32 && (this.ac ^= 4095),
          e & 16 && (this.l ^= 1),
          e & 1)
        ) {
          let r = this.ac + 1;
          (r > 4095 && (this.l ^= 1), (this.ac = r & 4095));
        }
        let t = e & 14,
          n = () => {
            let r = (this.ac << 1) | this.l;
            ((this.l = (r >> 12) & 1), (this.ac = r & 4095));
          },
          s = () => {
            let r = (this.l << 12) | this.ac;
            ((this.l = r & 1), (this.ac = r >> 1));
          };
        t === 4
          ? n()
          : t === 6
            ? (n(), n())
            : t === 8
              ? s()
              : t === 10
                ? (s(), s())
                : t === 2 && (this.ac = ((this.ac & 63) << 6) | (this.ac >> 6));
      }
    }
    loadAdd() {
      this.pc = this.sr;
    }
    deposit() {
      (this.write(this.pc, this.sr), (this.pc = (this.pc + 1) & 4095));
    }
    examine() {
      (this.read(this.pc), (this.pc = (this.pc + 1) & 4095));
    }
    load(e) {
      (this.mem.set(e.mem),
        (this.pc = e.start),
        (this.ac = 0),
        (this.l = 0),
        (this.halted = !1),
        (this.tty = ""),
        (this.cycles = 0),
        (this.instr = 0),
        (this.ttyFlag = !0));
    }
  },
  Pa = {
    "Add two numbers": `/ C = A + B  (octal!)  2 + 3 = 5
*200
START,  CLA CLL     / clear AC and link
        TAD A       / AC = A
        TAD B       / AC = A + B
        DCA C       / store, clear AC
        TAD C       / show the sum in the AC lights
        HLT
A,      2
B,      3
C,      0`,
    "Hello on the Teletype": `/ print a string with an auto-index register
*200
START,  CLA CLL
        TAD PTR     / pointer to MSG-1
        DCA 10      / locations 10-17 auto-increment on indirect use
LOOP,   TAD I 10    / fetch next character
        SNA         / zero byte = end of string
        JMP DONE
        TLS         / load teleprinter & print
        TSF         / wait for the printer flag
        JMP .-1
        CLA
        JMP LOOP
DONE,   HLT
        JMP START
PTR,    MSG-1
MSG,    "H;"E;"L;"L;"O;" ;"P;"D;"P;"-;"8;"!;15;12;0`,
    "Multiply by repeated addition (ISZ loop)": `/ P = X * Y using ISZ as loop counter
*200
        CLA CLL
        TAD Y
        CIA         / two's complement: -Y
        DCA CNT
LOOP,   TAD X
        ISZ CNT     / count up to zero, skip when done
        JMP LOOP
        DCA P
        TAD P
        HLT
X,      15          / 13 decimal
Y,      6
CNT,    0
P,      0           / 13*6 = 78 = 0116 octal`,
    "Switch register echo (toggle the panel switches!)": `/ continuously copy the 12 front-panel switches into the AC
*200
LOOP,   CLA
        OSR         / OR switch register into AC
        RAL         / rotate left once through the link (watch the lights)
        RAR
        JMP LOOP`,
    "Light show (rotate a bit)": `*200
        CLA CLL IAC   / AC = 1
LOOP,   RAL           / rotate AC+link left
        ISZ DLY       / small delay loop
        JMP .-1
        JMP LOOP
DLY,    0`,
  };
var Mm = ["X", "A", "S", "H", "V", "N", "T", "U", "C", "R", "L", "E", "G", "O", "Z"],
  Uy = {
    A: "Acc += M[n]",
    S: "Acc -= M[n]",
    H: "R = M[n]  (multiplier register)",
    V: "Acc += M[n] × R",
    N: "Acc -= M[n] × R",
    T: "M[n] = Acc, then clear Acc",
    U: "M[n] = Acc (no clear)",
    C: "Acc += M[n] AND R (collate)",
    R: "shift Acc right n places",
    L: "shift Acc left n places",
    E: "if Acc ≥ 0 jump to n",
    G: "if Acc < 0 jump to n",
    O: "teleprint M[n]",
    Z: "stop, ring bell",
    X: "no operation",
  },
  qs = 64,
  Dn = 32,
  yn = 17,
  bc = (1 << yn) - 1,
  Fy = 36,
  Ju = (i) => (i & (1 << (yn - 1)) ? (i & bc) - (1 << yn) : i & bc),
  nA = (i, e) => ((Mm.indexOf(i) & 31) << 11) | (e & 2047),
  vc = (i) => ({ op: Mm[(i >>> 11) & 31] || "?", n: i & 2047 });
function $u(i) {
  let e = i.split(`
`),
    t = {},
    n = [],
    s = [],
    r = 0;
  e.forEach((l, c) => {
    let h = l.replace(/;.*/, "").trim();
    if (!h) return;
    let d = h.match(/^([a-zA-Z_]\w*):\s*(.*)$/);
    if (d && ((t[d[1]] = r), (h = d[2].trim()), !h)) return;
    let u = h.match(/^ORG\s+(\d+)$/i);
    if (u) {
      r = +u[1];
      return;
    }
    (n.push({ addr: r, s: h, line: c + 1 }), r++);
  });
  let o = new Array(qs).fill(0),
    a = (l, c) =>
      /^-?\d+$/.test(l)
        ? +l
        : l in t
          ? t[l]
          : (s.push(`line ${c}: unknown label "${l}"`), 0);
  for (let l of n) {
    if (l.addr >= qs) {
      s.push(`line ${l.line}: out of store (max ${qs} words)`);
      continue;
    }
    let c = l.s.split(/\s+/),
      h = c[0].toUpperCase();
    h === "DATA"
      ? (o[l.addr] = a(c[1] || "0", l.line) & bc)
      : Mm.includes(h)
        ? (o[l.addr] = nA(h, c[1] ? a(c[1], l.line) : 0))
        : s.push(`line ${l.line}: unknown order "${c[0]}"`);
  }
  return { mem: o, labels: t, errors: s };
}
var Ia = class {
    constructor() {
      this.reset(new Array(qs).fill(0));
    }
    reset(e) {
      ((this.mem = Uint32Array.from(e || this.mem)),
        (this.image = Uint32Array.from(this.mem)),
        (this.acc = 0),
        (this.R = 0),
        (this.pc = 0),
        (this.halted = !1),
        (this.out = []),
        (this.minor = 0),
        (this.waited = 0),
        (this.steps = 0),
        (this.last = null));
    }
    restart() {
      this.reset(this.image);
    }
    phase() {
      return this.minor % Dn;
    }
    access(e) {
      let t = ((e % Dn) - this.phase() + Dn) % Dn;
      ((this.minor += t + 1), (this.waited += t));
    }
    read(e) {
      return (this.access(e), this.mem[e % qs]);
    }
    write(e, t) {
      (this.access(e), (this.mem[e % qs] = t & bc));
    }
    step() {
      if (this.halted) return null;
      let e = this.pc,
        t = this.read(e),
        { op: n, n: s } = vc(t),
        r = e + 1,
        o = { pc: e, op: n, n: s, flow: [] },
        a = () => Ju(this.read(s));
      switch (n) {
        case "A":
          ((this.acc += a()), o.flow.push(["mem", "acc"]));
          break;
        case "S":
          ((this.acc -= a()), o.flow.push(["mem", "acc"]));
          break;
        case "H":
          ((this.R = a()), o.flow.push(["mem", "mul"]));
          break;
        case "V":
          ((this.acc += a() * this.R), o.flow.push(["mem", "mul"], ["mul", "acc"]));
          break;
        case "N":
          ((this.acc -= a() * this.R), o.flow.push(["mem", "mul"], ["mul", "acc"]));
          break;
        case "T":
          (this.write(s, this.acc), (this.acc = 0), o.flow.push(["acc", "mem"]));
          break;
        case "U":
          (this.write(s, this.acc), o.flow.push(["acc", "mem"]));
          break;
        case "C":
          ((this.acc += Ju(this.read(s) & (this.R & bc))), o.flow.push(["mem", "acc"]));
          break;
        case "R":
          ((this.acc = Math.trunc(this.acc / 2 ** s)), (this.minor += s));
          break;
        case "L":
          ((this.acc = this.acc * 2 ** s), (this.minor += s));
          break;
        case "E":
          (this.acc >= 0 && (r = s), o.flow.push(["acc", "ctl"]));
          break;
        case "G":
          (this.acc < 0 && (r = s), o.flow.push(["acc", "ctl"]));
          break;
        case "O":
          (this.out.push(Ju(this.read(s))), o.flow.push(["mem", "tty"]));
          break;
        case "Z":
          this.halted = !0;
          break;
        case "X":
          break;
        default:
          ((this.halted = !0), (o.bad = !0));
      }
      let l = 2 ** 34;
      return (
        (this.acc >= l || this.acc < -l) &&
          (this.acc = ((((this.acc + l) % (2 * l)) + 2 * l) % (2 * l)) - l),
        (this.pc = r % qs),
        this.steps++,
        (this.last = o),
        o
      );
    }
    signed(e) {
      return Ju(this.mem[e]);
    }
  },
  bo = {
    "Fibonacci (teleprinter)": `; Fibonacci numbers on a mercury delay-line machine
; orders: A S H V N T U C R L E G O Z  (see table below)
loop:  A  a       ; Acc = a
       A  b       ; Acc = a + b
       T  c       ; c = a + b ; Acc cleared
       O  a       ; teleprint a
       A  b
       T  a       ; a = b
       A  c
       T  b       ; b = c
       A  b
       S  limit   ; Acc = b - limit
       G  cont    ; still below limit? continue
       Z          ; stop
cont:  T  tmp     ; clear Acc
       E  loop    ; Acc = 0 >= 0: jump back
a:     DATA 0
b:     DATA 1
c:     DATA 0
tmp:   DATA 0
limit: DATA 2000`,
    "Add two numbers": `; z = x + y
       A  x
       A  y
       T  z
       O  z
       Z
x:     DATA 2
y:     DATA 3
z:     DATA 0`,
    "Squares table (multiplier)": `; print n^2 for n = 1..12 using the multiplier register
loop:  H  n       ; R = n
       V  n       ; Acc += n * R
       T  sq
       O  sq
       A  n
       A  one
       U  n       ; n = n + 1  (U keeps Acc)
       S  stop
       G  next
       Z
next:  T  tmp
       E  loop
n:     DATA 1
one:   DATA 1
sq:    DATA 0
stop:  DATA 13
tmp:   DATA 0`,
    "Factorial (self-checking)": `; f = n! for n = 7
loop:  H  f
       V  n       ; Acc = f*n
       T  f
       A  n
       S  one
       U  n
       S  one     ; n-1 < 0 ? (n reached 0)
       G  done
       T  tmp
       E  loop
done:  O  f
       Z
n:     DATA 7
f:     DATA 1
one:   DATA 1
tmp:   DATA 0`,
  };
var t0 = ["H", "X", "Y", "Z", "S", "Sdg", "T", "Tdg", "RX", "RY", "RZ", "I"],
  i0 = ["CNOT", "CZ", "SWAP"],
  n0 = ["CCX"],
  yr = Math.SQRT1_2;
function Mc(i, e = 0) {
  let t = Math.cos(e / 2),
    n = Math.sin(e / 2);
  switch (i) {
    case "H":
      return [yr, 0, yr, 0, yr, 0, -yr, 0];
    case "X":
      return [0, 0, 1, 0, 1, 0, 0, 0];
    case "Y":
      return [0, 0, 0, -1, 0, 1, 0, 0];
    case "Z":
      return [1, 0, 0, 0, 0, 0, -1, 0];
    case "S":
      return [1, 0, 0, 0, 0, 0, 0, 1];
    case "Sdg":
      return [1, 0, 0, 0, 0, 0, 0, -1];
    case "T":
      return [1, 0, 0, 0, 0, 0, yr, yr];
    case "Tdg":
      return [1, 0, 0, 0, 0, 0, yr, -yr];
    case "RX":
      return [t, 0, 0, -n, 0, -n, t, 0];
    case "RY":
      return [t, 0, -n, 0, n, 0, t, 0];
    case "RZ":
      return [t, -n, 0, 0, 0, 0, t, n];
    case "I":
      return [1, 0, 0, 0, 0, 0, 1, 0];
  }
  throw new Error("unknown gate " + i);
}
var e0 = class i {
  constructor(e) {
    ((this.n = e),
      (this.N = 1 << e),
      (this.re = new Float64Array(this.N)),
      (this.im = new Float64Array(this.N)),
      (this.re[0] = 1));
  }
  clone() {
    let e = new i(this.n);
    return (e.re.set(this.re), e.im.set(this.im), e);
  }
  bit(e) {
    return 1 << (this.n - 1 - e);
  }
  apply1(e, t, n = []) {
    let s = this.bit(t),
      r = 0;
    for (let l of n) r |= this.bit(l);
    let { re: o, im: a } = this;
    for (let l = 0; l < this.N; l++) {
      if (l & s || (l & r) !== r) continue;
      let c = l | s,
        h = o[l],
        d = a[l],
        u = o[c],
        f = a[c];
      ((o[l] = e[0] * h - e[1] * d + e[2] * u - e[3] * f),
        (a[l] = e[0] * d + e[1] * h + e[2] * f + e[3] * u),
        (o[c] = e[4] * h - e[5] * d + e[6] * u - e[7] * f),
        (a[c] = e[4] * d + e[5] * h + e[6] * f + e[7] * u));
    }
  }
  swap(e, t) {
    let n = this.bit(e),
      s = this.bit(t);
    for (let r = 0; r < this.N; r++)
      if (r & n && !(r & s)) {
        let o = (r & ~n) | s;
        (([this.re[r], this.re[o]] = [this.re[o], this.re[r]]),
          ([this.im[r], this.im[o]] = [this.im[o], this.im[r]]));
      }
  }
  probs() {
    let e = new Float64Array(this.N);
    for (let t = 0; t < this.N; t++) e[t] = this.re[t] ** 2 + this.im[t] ** 2;
    return e;
  }
  measure(e, t) {
    let n = this.bit(e),
      s = 0;
    for (let a = 0; a < this.N; a++) a & n && (s += this.re[a] ** 2 + this.im[a] ** 2);
    let r = t < s ? 1 : 0,
      o = Math.sqrt(r ? s : 1 - s) || 1;
    for (let a = 0; a < this.N; a++)
      !!(a & n) != !!r
        ? ((this.re[a] = 0), (this.im[a] = 0))
        : ((this.re[a] /= o), (this.im[a] /= o));
    return r;
  }
  bloch(e) {
    let t = this.bit(e),
      n = 0,
      s = 0,
      r = 0,
      o = 0;
    for (let a = 0; a < this.N; a++) {
      if (a & t) continue;
      let l = a | t;
      ((n += this.re[a] ** 2 + this.im[a] ** 2),
        (s += this.re[l] ** 2 + this.im[l] ** 2),
        (r += this.re[a] * this.re[l] + this.im[a] * this.im[l]),
        (o += this.im[a] * this.re[l] - this.re[a] * this.im[l]));
    }
    return {
      x: 2 * r,
      y: -2 * o,
      z: n - s,
      rho: [
        [n, [r, o]],
        [[r, -o], s],
      ],
    };
  }
};
function Vy(i, e) {
  let t = e.g,
    n = e.q;
  if (t0.includes(t)) i.apply1(Mc(t, e.th || 0), n[0]);
  else if (t === "CNOT") i.apply1(Mc("X"), n[1], [n[0]]);
  else if (t === "CZ") i.apply1(Mc("Z"), n[1], [n[0]]);
  else if (t === "SWAP") i.swap(n[0], n[1]);
  else if (t === "CCX") i.apply1(Mc("X"), n[2], [n[0], n[1]]);
  else if (t !== "M") throw new Error("unknown op " + t);
}
function br(i) {
  return i0.includes(i) ? 2 : n0.includes(i) ? 3 : 1;
}
function vo(i, e, t = 1 / 0) {
  let n = new e0(i);
  for (let s of e) {
    if (s.col >= t) break;
    s.g !== "M" && Vy(n, s);
  }
  return n;
}
function Sm(i, e, t = 1024, n = {}, s = Math.random) {
  let r = new Uint32Array(1 << i),
    o = e.some((c) => c.g === "M"),
    a = n.dephase || 0,
    l = n.readout || 0;
  if (!o && !a) {
    let c = vo(i, e).probs(),
      h = [],
      d = 0;
    for (let u of c) h.push((d += u));
    for (let u = 0; u < t; u++) {
      let f = s() * d,
        p = 0;
      for (; p < h.length - 1 && f >= h[p];) p++;
      r[Ny(p, i, l, s)]++;
    }
    return r;
  }
  for (let c = 0; c < t; c++) {
    let h = new e0(i);
    for (let u of e) {
      if (u.g === "M") {
        h.measure(u.q[0], s());
        continue;
      }
      if ((Vy(h, u), a)) for (let f of u.q) s() < a && h.apply1(Mc("Z"), f);
    }
    let d = 0;
    for (let u = 0; u < i; u++) d |= h.measure(u, s()) ? h.bit(u) : 0;
    r[Ny(d, i, l, s)]++;
  }
  return r;
}
function Ny(i, e, t, n) {
  if (!t) return i;
  for (let s = 0; s < e; s++) n() < t && (i ^= 1 << s);
  return i;
}
var s0 = (i, e) => i.toString(2).padStart(e, "0"),
  sA = {
    cx: "CNOT",
    cnot: "CNOT",
    cz: "CZ",
    swap: "SWAP",
    ccx: "CCX",
    toffoli: "CCX",
    sdg: "Sdg",
    tdg: "Tdg",
    measure: "M",
    m: "M",
  };
function rA(i) {
  let e = i.replace(/pi/gi, "Math.PI");
  if (!/^[\d\s.+\-*/()Math.PI]*$/.test(e)) throw new Error("bad angle " + i);
  return Function("return (" + e + ")")();
}
function Mo(i, e) {
  let t = [],
    n = [],
    s = new Array(e).fill(-1);
  return (
    i.split(/[;\n]/).forEach((r, o) => {
      let a = r.replace(/\/\/.*|#.*/, "").trim();
      if (!a || /^(OPENQASM|include|qreg|creg)/i.test(a)) return;
      let l = a.match(/^([a-zA-Z]+)\s*(?:\(([^)]*)\))?\s*(.*)$/);
      if (!l) {
        n.push(`line ${o + 1}: cannot parse "${a}"`);
        return;
      }
      let c = l[1].toLowerCase();
      c = sA[c] || c.toUpperCase();
      let h = (l[3].match(/\d+/g) || []).map(Number);
      if (c === "M" && !h.length) for (let g = 0; g < e; g++) h.push(g);
      if (!(t0.includes(c) || i0.includes(c) || n0.includes(c) || c === "M")) {
        n.push(`line ${o + 1}: unknown gate ${l[1]}`);
        return;
      }
      if (h.some((g) => g >= e)) {
        n.push(`line ${o + 1}: qubit out of range (n=${e})`);
        return;
      }
      if (c === "M") {
        for (let g of h) {
          let m = s[g] + 1;
          (t.push({ g: c, q: [g], col: m }), (s[g] = m));
        }
        return;
      }
      let d = br(c);
      if (h.length !== d || new Set(h).size !== d) {
        n.push(`line ${o + 1}: ${c} needs ${d} distinct qubit(s)`);
        return;
      }
      let u = 0;
      if (/^R[XYZ]$/.test(c))
        try {
          u = rA(l[2] || "0");
        } catch (g) {
          n.push(`line ${o + 1}: ${g.message}`);
          return;
        }
      let f = Math.min(...h),
        p = Math.max(...h),
        x = 0;
      for (let g = f; g <= p; g++) x = Math.max(x, s[g] + 1);
      for (let g = f; g <= p; g++) s[g] = x;
      t.push({ g: c, q: h, th: u, col: x });
    }),
    t.sort((r, o) => r.col - o.col),
    { ops: t, errs: n }
  );
}
function Em(i) {
  let e = i / Math.PI;
  for (let t of [1, 2, 3, 4, 6, 8]) {
    let n = e * t;
    if (Math.abs(n - Math.round(n)) < 1e-9) {
      let s = Math.round(n);
      return s === 0
        ? "0"
        : (s === 1 ? "" : s === -1 ? "-" : s + "*") + "pi" + (t > 1 ? "/" + t : "");
    }
  }
  return i.toFixed(4);
}
function r0(i) {
  return (
    [...i]
      .sort((e, t) => e.col - t.col)
      .map(
        (e) =>
          (({
            CNOT: "cx",
            CZ: "cz",
            SWAP: "swap",
            CCX: "ccx",
            M: "measure",
            Sdg: "sdg",
            Tdg: "tdg",
          })[e.g] || e.g.toLowerCase()) +
          (/^R/.test(e.g) ? `(${Em(e.th)})` : "") +
          " " +
          e.q.map((n) => "q" + n).join(","),
      ).join(`;
`) + (i.length ? ";" : "")
  );
}
var So = {
    "Bell state (|00>+|11>)/√2": [
      2,
      `h q0;
cx q0,q1;`,
    ],
    "GHZ state (3 qubits)": [
      3,
      `h q0;
cx q0,q1;
cx q1,q2;`,
    ],
    "Superposition (H on all)": [3, "h q0; h q1; h q2;"],
    "Deutsch–Jozsa (balanced f)": [
      2,
      `x q1;
h q0; h q1;
cx q0,q1;
h q0;`,
    ],
    "Grover search, 2 qubits (finds |11>)": [
      2,
      `h q0; h q1;
cz q0,q1;
h q0; h q1;
x q0; x q1;
cz q0,q1;
x q0; x q1;
h q0; h q1;`,
    ],
    "Teleportation (deferred measurement)": [
      3,
      `// q0 = state to send
ry(pi/3) q0;
rz(pi/4) q0;
// Bell pair q1,q2
h q1;
cx q1,q2;
// Bell measurement basis
cx q0,q1;
h q0;
// corrections (quantum-controlled)
cx q1,q2;
cz q0,q2;`,
    ],
    "Phase kickback": [
      2,
      `x q1;
h q0; h q1;
cx q0,q1;
h q0; h q1;`,
    ],
    "Toffoli: 1 AND 1 = 1": [
      3,
      `x q0; x q1;
ccx q0,q1,q2;`,
    ],
    "Rabi rotation (edit the angle)": [1, "rx(pi/3) q0;"],
  },
  Qn = {
    2: {
      name: "Dimethyl phosphite (¹H–³¹P)",
      nuclei: ["¹H", "³¹P"],
      J: { "0-1": 697 },
    },
    3: {
      name: "Trifluoroiodoethylene (3 × ¹⁹F)",
      nuclei: ["¹⁹F₁", "¹⁹F₂", "¹⁹F₃"],
      J: { "0-1": 69.7, "0-2": 47.6, "1-2": -128.3 },
    },
    1: { name: "Water / single spin (¹H)", nuclei: ["¹H"], J: {} },
  };
function o0(i, e) {
  let t = Qn[i],
    n = [];
  for (let s = 0; s < i; s++) {
    let r = [],
      o = [...Array(i).keys()].filter((a) => a !== s);
    for (let a = 0; a < 1 << o.length; a++) {
      let l = 0,
        c = 0,
        h = 0;
      o.forEach((d, u) => {
        let f = (a >> (o.length - 1 - u)) & 1,
          p = t.J[Math.min(s, d) + "-" + Math.max(s, d)] || 0;
        l += p * (f ? -0.5 : 0.5);
      });
      for (let d = 0; d < 1 << i; d++) {
        let u = !0;
        (o.forEach((f, p) => {
          let x = (a >> (o.length - 1 - p)) & 1;
          ((d >> (i - 1 - f)) & 1) !== x && (u = !1);
        }),
          u && ((d >> (i - 1 - s)) & 1 ? (h += e[d]) : (c += e[d])));
      }
      r.push({ f: l, a: c - h, cfg: a });
    }
    n.push({ nucleus: t.nuclei[s], peaks: r });
  }
  return n;
}
function Da(i, e) {
  let t = Qn[i],
    n = 0;
  for (let s of e)
    if (s.g !== "M")
      if (br(s.g) === 1)
        n += 5e-5 * Math.max(0.5, Math.abs(s.th || Math.PI / 2) / (Math.PI / 2));
      else {
        let r = 1e9;
        for (let o = 0; o < s.q.length; o++)
          for (let a = o + 1; a < s.q.length; a++)
            r = Math.min(
              r,
              Math.abs(
                t.J[Math.min(s.q[o], s.q[a]) + "-" + Math.max(s.q[o], s.q[a])] || 50,
              ),
            );
        n += (s.g === "SWAP" ? 3 : s.g === "CCX" ? 6 : 1) / (2 * r) + 1e-4;
      }
  return n;
}
var Zt = class i {
  constructor(e, t, n, s, r = "") {
    ((this.s = e), (this.e = t), (this.m = n), (this.F = s), (this.flag = r));
  }
  get zero() {
    return this.m === 0;
  }
  value() {
    return this.zero ? 0 : (((this.s ? -1 : 1) * this.m) / 2 ** this.F) * 2 ** this.e;
  }
  bits() {
    let e = this.zero ? 64 : ((this.e % 128) + 128) % 128,
      t = this.zero ? 0 : this.m - 2 ** this.F;
    return { s: this.s, e7: e, frac: t, F: this.F };
  }
  static zero(e, t = "zero") {
    return new i(0, 0, 0, e, t);
  }
  static from(e, t) {
    if (!isFinite(e)) throw new Error("not a number");
    if (e === 0) return i.zero(t, "zero (not representable on the Z1)");
    let n = e < 0 ? 1 : 0,
      s = Math.abs(e),
      r = Math.floor(Math.log2(s)),
      o = Math.round((s / 2 ** r) * 2 ** t);
    return (
      o >= 2 ** (t + 1) && ((o >>= 1), r++),
      o < 2 ** t && ((o <<= 1), r--),
      Oy(new i(n, r, o, t))
    );
  }
};
function Oy(i) {
  return (
    i.zero ||
      (i.e > 63 && ((i.flag = "exponent overflow"), (i.e = 63)),
      i.e < -64 && ((i.flag = "exponent underflow"), (i.e = -64))),
    i
  );
}
function La(i, e, t, n, s = "") {
  if (t === 0) return Zt.zero(n, "zero result: the Z1 could not represent 0");
  let r = 2 ** (n + 2);
  for (; t >= 2 * r;) ((t = Math.floor(t / 2)), e++);
  for (; t < r;) ((t *= 2), e--);
  return Oy(new Zt(i, e, Math.floor(t / 2 ** 2), n, s));
}
function ka(i, e, t = !1) {
  let n = i.F,
    s = t ? 1 - e.s : e.s;
  if (i.zero)
    return e.zero
      ? Zt.zero(n, "zero result: the Z1 could not represent 0")
      : new Zt(s, e.e, e.m, n);
  if (e.zero) return new Zt(i.s, i.e, i.m, n);
  let [r, o, a, l] = i.e >= e.e ? [i, i.s, e, s] : [e, s, i, i.s],
    c = r.e - a.e,
    h = r.m * 2 ** 2,
    d = Math.floor((a.m * 2 ** 2) / 2 ** c);
  if (o === l) return La(o, r.e, h + d, n);
  let u = h - d;
  return u >= 0 ? La(o, r.e, u, n) : La(l, r.e, -u, n);
}
function Sc(i, e, t) {
  let n = i.F;
  if (i.zero || e.zero) return Zt.zero(n, "zero operand: the Z1 could not represent 0");
  let s = i.m * 2 ** 2,
    r = 0;
  for (let o = 0; o <= n; o++) {
    let a = Math.floor(e.m / 2 ** o) % 2;
    (a && (r += s), t && t.push({ i: o, bit: a, acc: r }), (r = Math.floor(r / 2)));
  }
  return La(i.s ^ e.s, i.e + e.e + 1, r, n);
}
function a0(i, e) {
  let t = i.F;
  if (e.zero) return Zt.zero(t, "division by zero");
  if (i.zero) return Zt.zero(t, "zero operand");
  let n = i.m,
    s = 0,
    r = t + 2 + 1;
  for (let o = 0; o < r + 1; o++)
    ((s *= 2), n >= e.m && ((n -= e.m), (s += 1)), (n *= 2));
  return La(i.s ^ e.s, i.e - e.e - 1, s, t);
}
function oA(i) {
  let e = i.F;
  if (i.zero) return Zt.zero(e, "zero operand");
  if (i.s) return Zt.zero(e, "square root of a negative number");
  let t = i.m,
    n = i.e;
  n % 2 && ((t *= 2), (n -= 1));
  let s = BigInt(t) * (1n << BigInt(e + 4)),
    r = 0n,
    o = 1n << 80n,
    a = s;
  for (; o > a;) o >>= 2n;
  for (; o;) (a >= r + o ? ((a -= r + o), (r = (r >> 1n) + o)) : (r >>= 1n), (o >>= 2n));
  return La(0, n / 2, Number(r), e);
}
var jn = {
  Lu: {
    code: 112,
    cyc: 9,
    d: "read the decimal keyboard (4 digits + exponent lever + sign) into a register; the machine stops for the operator",
  },
  Ld: {
    code: 120,
    cyc: 9,
    d: "show register R1 on the decimal display; the machine stops until restarted",
  },
  Pr: {
    code: 192,
    cyc: 1,
    d: "load memory word z into R1 (or R2 if R1 is full)",
  },
  Ps: { code: 128, cyc: 1, d: "store R1 into memory word z" },
  Ls1: {
    code: 96,
    cyc: 5,
    d: "R1 := R1 + R2 (5 cycles: align exponents, add mantissas, normalise)",
  },
  Ls2: { code: 104, cyc: 6, d: "R1 := R1 − R2 (6 cycles)" },
  Lm: {
    code: 72,
    cyc: 20,
    d: "R1 := R1 × R2 (exponent add + 17 shift-and-add cycles + normalise ≈ 20 cycles)",
  },
  Li: { code: 80, cyc: 21, d: "R1 := R1 ÷ R2 (21 cycles)" },
  Lw: {
    code: 88,
    cyc: 20,
    d: "R1 := √R1 — Z3 only: the Z1 could not extract square roots",
    z3: !0,
  },
};
function Tm(i, { words: e = 64, z3: t = !1 } = {}) {
  let n = [],
    s = [];
  return (
    i
      .split(
        `
`,
      )
      .forEach((r, o) => {
        let a = r.replace(/[;#].*/, "").trim();
        if (!a) return;
        let l = a.match(/^([A-Za-z]+\d?)\s*(\d+)?$/),
          c = l && Object.keys(jn).find((u) => u.toLowerCase() === l[1].toLowerCase());
        if (!c) {
          s.push(
            `line ${o + 1}: unknown instruction "${a}" (Lu Ld Pr z Ps z Ls1 Ls2 Lm Li${t ? " Lw" : ""})`,
          );
          return;
        }
        if (jn[c].z3 && !t) {
          s.push(
            `line ${o + 1}: Lw (square root) is a Z3 instruction — the Z1 could not extract roots. Tick "Z3 extension" to allow it.`,
          );
          return;
        }
        let h = c === "Pr" || c === "Ps",
          d = l[2] !== void 0 ? +l[2] : null;
        if (h && (d === null || d >= e)) {
          s.push(`line ${o + 1}: ${c} needs an address 0…${e - 1}`);
          return;
        }
        if (!h && d !== null) {
          s.push(`line ${o + 1}: ${c} takes no address`);
          return;
        }
        n.push({ op: c, z: d, code: jn[c].code | (h ? d : 0), ln: o, src: a });
      }),
    { prog: n, errors: s }
  );
}
function aA(i, e) {
  if (i === 0)
    return {
      fp: Zt.zero(e, "zero (not representable on the Z1)"),
      digits: "0000",
      exp: 0,
      sign: 0,
    };
  let t = i < 0 ? 1 : 0,
    n = Math.abs(i),
    s = Math.floor(Math.log10(n)) - 3,
    r = Math.round(n / 10 ** s);
  r >= 1e4 && ((r = Math.round(r / 10)), s++);
  let o = Zt.from(r, e);
  o.s = t;
  let a = Zt.from(10, e);
  for (let l = 0; l < Math.abs(s); l++) o = s > 0 ? Sc(o, a) : a0(o, a);
  return { fp: o, digits: String(r).padStart(4, "0"), exp: s, sign: t };
}
function Am(i) {
  let e = i.value();
  if (e === 0 || i.zero) return { text: "0 (exception)", digits: "----", exp: 0 };
  let t = Math.floor(Math.log10(Math.abs(e))),
    n = Math.round(Math.abs(e) / 10 ** (t - 3));
  return {
    text: `${e < 0 ? "−" : ""}${String(n).replace(/^(\d)/, "$1.")} × 10^${t}`,
    digits: String(n),
    exp: t,
    neg: e < 0,
  };
}
var Ua = class {
    constructor(e = {}) {
      ((this.F = e.F ?? 16),
        (this.words = e.words ?? 64),
        (this.z3 = !!e.z3),
        (this.mem = Array(this.words).fill(null)),
        (this.prog = []),
        this.reset());
    }
    setFormat(e) {
      ((this.F = e),
        (this.mem = this.mem.map((t) => t && Zt.from(t.value() || 0, e))),
        (this.R1 = this.R2 = null));
    }
    load(e) {
      let t = Tm(e, { words: this.words, z3: this.z3 });
      return (
        (this.errors = t.errors),
        t.errors.length || ((this.prog = t.prog), this.reset()),
        t
      );
    }
    reset() {
      ((this.pc = 0),
        (this.R1 = null),
        (this.R2 = null),
        (this.cycles = 0),
        (this.cyc = 0),
        (this.state = "run"),
        (this.out = []),
        (this.inq = this.inq || []),
        (this.flag = ""),
        (this.done = 0),
        (this.cur = null),
        (this.lastLoad = 0),
        (this.trace = []),
        (this.memAct = -1));
    }
    get halted() {
      return this.pc >= this.prog.length && !this.cur;
    }
    cycle() {
      if (this.state === "input" || this.state === "output") return !1;
      if (!this.cur) {
        if (this.pc >= this.prog.length) return ((this.state = "end of tape"), !1);
        ((this.cur = this.prog[this.pc]), (this.cyc = 0), (this.state = "run"));
      }
      (this.cyc++, this.cycles++);
      let e = this.cur;
      return this.cyc < jn[e.op].cyc
        ? !0
        : (this.exec(e),
          this.state === "input" ? !1 : ((this.cur = null), this.pc++, this.done++, !0));
    }
    put(e) {
      this.R1 ? (this.R2 = e) : (this.R1 = e);
    }
    exec(e) {
      let t = this.F;
      switch (((this.memAct = -1), e.op)) {
        case "Lu": {
          if (!this.inq.length) {
            ((this.state = "input"), this.cyc--, this.cycles--);
            return;
          }
          let n = this.inq.shift(),
            s = aA(n, t);
          ((this.lastIn = s), this.put(s.fp));
          break;
        }
        case "Ld": {
          let n = this.R1;
          (n && (this.out.push(n), (this.lastOut = Am(n))),
            this.pauseOnOut && (this.state = "output"));
          break;
        }
        case "Pr": {
          (this.put(
            this.mem[e.z]
              ? new Zt(
                  this.mem[e.z].s,
                  this.mem[e.z].e,
                  this.mem[e.z].m,
                  t,
                  this.mem[e.z].flag,
                )
              : Zt.zero(t, "empty memory word"),
          ),
            (this.memAct = e.z));
          break;
        }
        case "Ps": {
          ((this.mem[e.z] = this.R1), (this.R1 = null), (this.memAct = e.z));
          break;
        }
        default: {
          let n = this.R1 || Zt.zero(t, "R1 empty"),
            s = this.R2 || Zt.zero(t, "R2 empty"),
            r =
              e.op === "Ls1"
                ? ka(n, s)
                : e.op === "Ls2"
                  ? ka(n, s, !0)
                  : e.op === "Lm"
                    ? Sc(n, s)
                    : e.op === "Li"
                      ? a0(n, s)
                      : oA(n);
          ((this.R1 = r),
            (this.R2 = null),
            r.flag && (this.flag = `${e.src}: ${r.flag}`));
        }
      }
      this.state !== "output" && (this.state = "run");
    }
    provide(e) {
      (this.inq.push(e), this.state === "input" && (this.state = "run"));
    }
    resume() {
      this.state === "output" && (this.state = "run");
    }
    run(e = 1e5) {
      let t = 0;
      for (; t++ < e && this.cycle(););
      return t;
    }
  },
  vr = {
    "(a + b) × c": `; input a, b, c on the decimal keyboard; output (a+b)·c
Lu      ; a → R1
Ps 1    ; store a in word 1
Lu      ; b
Ps 2
Lu      ; c
Ps 3
Pr 1    ; R1 = a
Pr 2    ; R2 = b
Ls1     ; R1 = a + b
Ps 4
Pr 4
Pr 3
Lm      ; R1 = (a+b)·c
Ld      ; show on the decimal display`,
    "Circle area π·r²": `; input r, then π (3.142 on the 4-digit keyboard)
Lu
Ps 0
Pr 0
Pr 0
Lm      ; r²
Ps 1
Lu      ; π
Pr 1
Lm      ; π·r²   (Lu put π in R1, Pr 1 put r² in R2)
Ld`,
    "Mean of three numbers": `Lu
Ps 1
Lu
Ps 2
Lu
Ps 3
Pr 1
Pr 2
Ls1
Ps 4
Pr 4
Pr 3
Ls1
Ps 4
Lu      ; enter 3
Ps 5
Pr 4
Pr 5
Li      ; (a+b+c)/3
Ld`,
    "Polynomial x² − 2x + 3": `Lu      ; x
Ps 1
Pr 1
Pr 1
Lm      ; x²
Ps 2
Lu      ; enter 2
Pr 1
Lm      ; 2x
Ps 3
Pr 2
Pr 3
Ls2     ; x² − 2x
Ps 4
Lu      ; enter 3
Ps 5
Pr 4
Pr 5
Ls1
Ld`,
  },
  Rm = {
    "(a + b) × c": "2, 3, 4",
    "Circle area π·r²": "2, 3.142",
    "Mean of three numbers": "4, 7, 10, 3",
    "Polynomial x² − 2x + 3": "5, 2, 3",
  };
var h0 = {},
  ti = (i, e) =>
    e.split(" ").forEach((t) => {
      let [n, s, r] = t.split(":");
      h0[parseInt(n, 16)] = [i, s, +r];
    }),
  Eo = (i) =>
    `${i[0]}:imm:2 ${i[1]}:zp:3 ${i[2]}:zpx:4 ${i[3]}:abs:4 ${i[4]}:abx:4 ${i[5]}:aby:4 ${i[6]}:izx:6 ${i[7]}:izy:5`;
ti("ADC", Eo(["69", "65", "75", "6D", "7D", "79", "61", "71"]));
ti("AND", Eo(["29", "25", "35", "2D", "3D", "39", "21", "31"]));
ti("CMP", Eo(["C9", "C5", "D5", "CD", "DD", "D9", "C1", "D1"]));
ti("EOR", Eo(["49", "45", "55", "4D", "5D", "59", "41", "51"]));
ti("LDA", Eo(["A9", "A5", "B5", "AD", "BD", "B9", "A1", "B1"]));
ti("ORA", Eo(["09", "05", "15", "0D", "1D", "19", "01", "11"]));
ti("SBC", Eo(["E9", "E5", "F5", "ED", "FD", "F9", "E1", "F1"]));
ti("STA", "85:zp:3 95:zpx:4 8D:abs:4 9D:abx:5 99:aby:5 81:izx:6 91:izy:6");
for (let [i, e] of [
  ["ASL", 0],
  ["ROL", 32],
  ["LSR", 64],
  ["ROR", 96],
])
  ti(
    i,
    `${(e + 10).toString(16)}:acc:2 ${(e + 6).toString(16)}:zp:5 ${(e + 22).toString(16)}:zpx:6 ${(e + 14).toString(16)}:abs:6 ${(e + 30).toString(16)}:abx:7`,
  );
ti("DEC", "C6:zp:5 D6:zpx:6 CE:abs:6 DE:abx:7");
ti("INC", "E6:zp:5 F6:zpx:6 EE:abs:6 FE:abx:7");
ti("BIT", "24:zp:3 2C:abs:4");
ti("CPX", "E0:imm:2 E4:zp:3 EC:abs:4");
ti("CPY", "C0:imm:2 C4:zp:3 CC:abs:4");
ti("LDX", "A2:imm:2 A6:zp:3 B6:zpy:4 AE:abs:4 BE:aby:4");
ti("LDY", "A0:imm:2 A4:zp:3 B4:zpx:4 AC:abs:4 BC:abx:4");
ti("STX", "86:zp:3 96:zpy:4 8E:abs:4");
ti("STY", "84:zp:3 94:zpx:4 8C:abs:4");
ti("JMP", "4C:abs:3 6C:ind:5");
ti("JSR", "20:abs:6");
for (let [i, e] of [
  ["BPL", "10"],
  ["BMI", "30"],
  ["BVC", "50"],
  ["BVS", "70"],
  ["BCC", "90"],
  ["BCS", "B0"],
  ["BNE", "D0"],
  ["BEQ", "F0"],
])
  ti(i, e + ":rel:2");
for (let [i, e, t] of [
  ["BRK", "00", 7],
  ["RTI", "40", 6],
  ["RTS", "60", 6],
  ["PHP", "08", 3],
  ["PLP", "28", 4],
  ["PHA", "48", 3],
  ["PLA", "68", 4],
  ["CLC", "18", 2],
  ["SEC", "38", 2],
  ["CLI", "58", 2],
  ["SEI", "78", 2],
  ["CLV", "B8", 2],
  ["CLD", "D8", 2],
  ["SED", "F8", 2],
  ["DEY", "88", 2],
  ["DEX", "CA", 2],
  ["INY", "C8", 2],
  ["INX", "E8", 2],
  ["TAX", "AA", 2],
  ["TXA", "8A", 2],
  ["TAY", "A8", 2],
  ["TYA", "98", 2],
  ["TSX", "BA", 2],
  ["TXS", "9A", 2],
  ["NOP", "EA", 2],
])
  ti(i, `${e}:imp:${t}`);
var Fa = h0,
  mi = 1,
  Mr = 2,
  _m = 4,
  l0 = 8,
  c0 = 16,
  hs = 64,
  Ec = 128,
  Sr = class {
    constructor(e, t) {
      ((this.read = e),
        (this.write = t),
        (this.a = 0),
        (this.x = 0),
        (this.y = 0),
        (this.sp = 255),
        (this.p = 36),
        (this.pc = 0),
        (this.cycles = 0),
        (this.instr = 0),
        (this.jammed = !1));
    }
    rd16(e) {
      return this.read(e) | (this.read((e + 1) & 65535) << 8);
    }
    push(e) {
      (this.write(256 | this.sp, e & 255), (this.sp = (this.sp - 1) & 255));
    }
    pull() {
      return ((this.sp = (this.sp + 1) & 255), this.read(256 | this.sp));
    }
    nz(e) {
      return ((this.p = (this.p & ~(Ec | Mr)) | (e & 128) | (e ? 0 : Mr)), e);
    }
    addr(e) {
      let t = this.pc,
        n,
        s;
      switch (e) {
        case "imm":
          return ((this.pc = (t + 1) & 65535), t);
        case "zp":
          return ((this.pc = (t + 1) & 65535), this.read(t));
        case "zpx":
          return ((this.pc = (t + 1) & 65535), (this.read(t) + this.x) & 255);
        case "zpy":
          return ((this.pc = (t + 1) & 65535), (this.read(t) + this.y) & 255);
        case "abs":
          return ((this.pc = (t + 2) & 65535), this.rd16(t));
        case "abx":
          return (
            (this.pc = (t + 2) & 65535),
            (s = this.rd16(t)),
            (n = (s + this.x) & 65535),
            (n ^ s) & 65280 && (this.extra = 1),
            n
          );
        case "aby":
          return (
            (this.pc = (t + 2) & 65535),
            (s = this.rd16(t)),
            (n = (s + this.y) & 65535),
            (n ^ s) & 65280 && (this.extra = 1),
            n
          );
        case "izx": {
          this.pc = (t + 1) & 65535;
          let r = (this.read(t) + this.x) & 255;
          return this.read(r) | (this.read((r + 1) & 255) << 8);
        }
        case "izy": {
          this.pc = (t + 1) & 65535;
          let r = this.read(t);
          return (
            (s = this.read(r) | (this.read((r + 1) & 255) << 8)),
            (n = (s + this.y) & 65535),
            (n ^ s) & 65280 && (this.extra = 1),
            n
          );
        }
        case "ind": {
          this.pc = (t + 2) & 65535;
          let r = this.rd16(t);
          return this.read(r) | (this.read((r & 65280) | ((r + 1) & 255)) << 8);
        }
        case "rel": {
          this.pc = (t + 1) & 65535;
          let r = this.read(t);
          return (this.pc + (r < 128 ? r : r - 256)) & 65535;
        }
      }
    }
    adc(e) {
      let t = this.p & mi;
      if (this.p & l0) {
        let s = (this.a & 15) + (e & 15) + t,
          r = (this.a >> 4) + (e >> 4);
        s > 9 && ((s += 6), r++);
        let o = (this.a + e + t) & 255;
        ((this.p =
          (this.p & ~(Mr | hs | Ec | mi)) |
          (o ? 0 : Mr) |
          (~(this.a ^ e) & (this.a ^ (r << 4)) & 128 ? hs : 0) |
          ((r << 4) & 128)),
          r > 9 && (r += 6),
          r > 15 && (this.p |= mi),
          (this.a = ((r << 4) | (s & 15)) & 255));
        return;
      }
      let n = this.a + e + t;
      ((this.p =
        (this.p & ~(mi | hs)) |
        (n > 255 ? mi : 0) |
        (~(this.a ^ e) & (this.a ^ n) & 128 ? hs : 0)),
        (this.a = this.nz(n & 255)));
    }
    sbc(e) {
      if (this.p & l0) {
        let t = this.p & mi ? 0 : 1,
          n = (this.a & 15) - (e & 15) - t,
          s = (this.a >> 4) - (e >> 4);
        (n < 0 && ((n -= 6), s--), s < 0 && (s -= 6));
        let r = this.a - e - t;
        ((this.p =
          (this.p & ~(mi | hs)) |
          (r >= 0 ? mi : 0) |
          ((this.a ^ e) & (this.a ^ r) & 128 ? hs : 0)),
          this.nz(r & 255),
          (this.a = ((s << 4) | (n & 15)) & 255));
        return;
      }
      this.adc(e ^ 255);
    }
    cmp(e, t) {
      let n = e - t;
      ((this.p = (this.p & ~mi) | (n >= 0 ? mi : 0)), this.nz(n & 255));
    }
    step() {
      let e = this.read(this.pc),
        t = h0[e];
      if (!t) return ((this.jammed = !0), !1);
      ((this.pc = (this.pc + 1) & 65535), (this.extra = 0), this.instr++);
      let [n, s, r] = t,
        o = s === "imp" || s === "acc" ? 0 : this.addr(s),
        a = r,
        l = (c) => {
          s === "acc"
            ? (this.a = this.nz(c(this.a)))
            : this.write(o, this.nz(c(this.read(o))));
        };
      switch (n) {
        case "LDA":
          ((this.a = this.nz(this.read(o))), (a += this.extra));
          break;
        case "LDX":
          ((this.x = this.nz(this.read(o))), (a += this.extra));
          break;
        case "LDY":
          ((this.y = this.nz(this.read(o))), (a += this.extra));
          break;
        case "STA":
          this.write(o, this.a);
          break;
        case "STX":
          this.write(o, this.x);
          break;
        case "STY":
          this.write(o, this.y);
          break;
        case "ADC":
          (this.adc(this.read(o)), (a += this.extra));
          break;
        case "SBC":
          (this.sbc(this.read(o)), (a += this.extra));
          break;
        case "AND":
          ((this.a = this.nz(this.a & this.read(o))), (a += this.extra));
          break;
        case "ORA":
          ((this.a = this.nz(this.a | this.read(o))), (a += this.extra));
          break;
        case "EOR":
          ((this.a = this.nz(this.a ^ this.read(o))), (a += this.extra));
          break;
        case "CMP":
          (this.cmp(this.a, this.read(o)), (a += this.extra));
          break;
        case "CPX":
          this.cmp(this.x, this.read(o));
          break;
        case "CPY":
          this.cmp(this.y, this.read(o));
          break;
        case "BIT": {
          let c = this.read(o);
          this.p = (this.p & ~(Ec | hs | Mr)) | (c & 192) | (c & this.a ? 0 : Mr);
          break;
        }
        case "ASL":
          l((c) => ((this.p = (this.p & ~mi) | (c >> 7)), (c << 1) & 255));
          break;
        case "LSR":
          l((c) => ((this.p = (this.p & ~mi) | (c & 1)), c >> 1));
          break;
        case "ROL":
          l((c) => {
            let h = this.p & mi;
            return ((this.p = (this.p & ~mi) | (c >> 7)), ((c << 1) | h) & 255);
          });
          break;
        case "ROR":
          l((c) => {
            let h = this.p & mi;
            return ((this.p = (this.p & ~mi) | (c & 1)), (c >> 1) | (h << 7));
          });
          break;
        case "INC":
          this.write(o, this.nz((this.read(o) + 1) & 255));
          break;
        case "DEC":
          this.write(o, this.nz((this.read(o) - 1) & 255));
          break;
        case "INX":
          this.x = this.nz((this.x + 1) & 255);
          break;
        case "INY":
          this.y = this.nz((this.y + 1) & 255);
          break;
        case "DEX":
          this.x = this.nz((this.x - 1) & 255);
          break;
        case "DEY":
          this.y = this.nz((this.y - 1) & 255);
          break;
        case "TAX":
          this.x = this.nz(this.a);
          break;
        case "TAY":
          this.y = this.nz(this.a);
          break;
        case "TXA":
          this.a = this.nz(this.x);
          break;
        case "TYA":
          this.a = this.nz(this.y);
          break;
        case "TSX":
          this.x = this.nz(this.sp);
          break;
        case "TXS":
          this.sp = this.x;
          break;
        case "PHA":
          this.push(this.a);
          break;
        case "PLA":
          this.a = this.nz(this.pull());
          break;
        case "PHP":
          this.push(this.p | c0 | 32);
          break;
        case "PLP":
          this.p = (this.pull() & ~c0) | 32;
          break;
        case "CLC":
          this.p &= ~mi;
          break;
        case "SEC":
          this.p |= mi;
          break;
        case "CLI":
          this.p &= ~_m;
          break;
        case "SEI":
          this.p |= _m;
          break;
        case "CLV":
          this.p &= ~hs;
          break;
        case "CLD":
          this.p &= ~l0;
          break;
        case "SED":
          this.p |= l0;
          break;
        case "JMP":
          this.pc = o;
          break;
        case "JSR": {
          let c = (this.pc - 1) & 65535;
          (this.push(c >> 8), this.push(c), (this.pc = o));
          break;
        }
        case "RTS": {
          let c = this.pull(),
            h = this.pull();
          this.pc = (((h << 8) | c) + 1) & 65535;
          break;
        }
        case "RTI": {
          this.p = (this.pull() & ~c0) | 32;
          let c = this.pull(),
            h = this.pull();
          this.pc = (h << 8) | c;
          break;
        }
        case "BRK": {
          let c = (this.pc + 1) & 65535;
          (this.push(c >> 8),
            this.push(c),
            this.push(this.p | c0 | 32),
            (this.p |= _m),
            (this.pc = this.rd16(65534)),
            (this.brk = !0));
          break;
        }
        case "NOP":
          break;
        default:
          ({
            BPL: !(this.p & Ec),
            BMI: !!(this.p & Ec),
            BVC: !(this.p & hs),
            BVS: !!(this.p & hs),
            BCC: !(this.p & mi),
            BCS: !!(this.p & mi),
            BNE: !(this.p & Mr),
            BEQ: !!(this.p & Mr),
          })[n] && ((a += 1 + ((o ^ this.pc) & 65280 ? 1 : 0)), (this.pc = o));
      }
      return ((this.cycles += a), !0);
    }
  },
  wc = {};
for (let [i, [e, t]] of Object.entries(h0)) (wc[e] || (wc[e] = {}))[t] = +i;
function Er(i, e = 49152) {
  let t = {},
    n = [],
    s = [],
    r = e;
  for (let o of [1, 2]) {
    let a = e;
    s.length = 0;
    let l = (c, h) => {
      let d = 0,
        u = 1;
      for (let f of c
        .split(/([+-])/)
        .map((p) => p.trim())
        .filter(Boolean)) {
        if (f === "+") {
          u = 1;
          continue;
        }
        if (f === "-") {
          u = -1;
          continue;
        }
        let p = 0;
        f[0] === "<"
          ? ((p = 1), (f = f.slice(1)))
          : f[0] === ">" && ((p = 2), (f = f.slice(1)));
        let x,
          g = f.toUpperCase();
        (/^\$[0-9A-F]+$/.test(g)
          ? (x = parseInt(g.slice(1), 16))
          : /^%[01]+$/.test(g)
            ? (x = parseInt(g.slice(1), 2))
            : /^\d+$/.test(g)
              ? (x = +g)
              : /^'.'?$/.test(f)
                ? (x = f.charCodeAt(1))
                : g === "*"
                  ? (x = a)
                  : g in t
                    ? (x = t[g])
                    : (o === 2 && n.push(`line ${h}: undefined "${f}"`),
                      (x = o === 1 ? 65535 : 0)),
          p === 1 && (x &= 255),
          p === 2 && (x = (x >> 8) & 255),
          (d += u * x),
          (u = 1));
      }
      return d;
    };
    i.split(
      `
`,
    ).forEach((c, h) => {
      let d = h + 1,
        u = c.replace(/;.*/, "").trim();
      if (!u) return;
      {
        let y = u.match(/^\*\s*=\s*(.+)$/);
        if (y) {
          a = l(y[1], d);
          return;
        }
      }
      let f = u.match(/^([A-Za-z_]\w*):?\s*(.*)$/);
      if (f && !wc[f[1].toUpperCase()] && !/^\.|^ORG$/i.test(f[1])) {
        let y = f[2].match(/^=\s*(.+)$/);
        if (y) {
          t[f[1].toUpperCase()] = l(y[1], d);
          return;
        }
        if ((o === 1 && (t[f[1].toUpperCase()] = a), (u = f[2].trim()), !u)) return;
      }
      f = u.match(/^(\.?\w+)\s*(.*)$/);
      let p = f[1].toUpperCase(),
        x = f[2].trim();
      if (p === "*" || p === "ORG" || p === ".ORG") {
        a = l(x, d);
        return;
      }
      if (p === ".BYTE" || p === ".DB" || p === "DB") {
        for (let y of x.split(",")) {
          let E = y.trim();
          if (/^".*"$/.test(E))
            for (let M of E.slice(1, -1)) s.push([a++, M.charCodeAt(0)]);
          else s.push([a++, l(E, d) & 255]);
        }
        return;
      }
      if (p === ".WORD" || p === "DW") {
        for (let y of x.split(",")) {
          let E = l(y.trim(), d);
          s.push([a++, E & 255], [a++, (E >> 8) & 255]);
        }
        return;
      }
      let g = wc[p];
      if (!g) {
        n.push(`line ${d}: unknown mnemonic "${f[1]}"`);
        return;
      }
      let m,
        S = 0,
        b;
      if (!x) m = g.imp !== void 0 ? "imp" : "acc";
      else if (/^A$/i.test(x) && g.acc !== void 0) m = "acc";
      else if (x[0] === "#") ((m = "imm"), (S = l(x.slice(1), d)));
      else if ((b = x.match(/^\((.+),\s*X\)$/i))) ((m = "izx"), (S = l(b[1], d)));
      else if ((b = x.match(/^\((.+)\),\s*Y$/i))) ((m = "izy"), (S = l(b[1], d)));
      else if ((b = x.match(/^\((.+)\)$/))) ((m = "ind"), (S = l(b[1], d)));
      else if ((b = x.match(/^(.+),\s*([XY])$/i))) {
        S = l(b[1], d);
        let y = b[2].toUpperCase();
        m =
          S < 256 && g["zp" + y.toLowerCase()] !== void 0
            ? "zp" + y.toLowerCase()
            : "ab" + y.toLowerCase();
      } else
        ((S = l(x, d)),
          (m = g.rel !== void 0 ? "rel" : S < 256 && g.zp !== void 0 ? "zp" : "abs"));
      if (g[m] === void 0) {
        n.push(`line ${d}: ${p} has no ${m} mode`);
        return;
      }
      if ((s.push([a++, g[m]]), m === "rel")) {
        let y = S - (a + 1);
        (o === 2 && (y < -128 || y > 127) && n.push(`line ${d}: branch out of range`),
          s.push([a++, y & 255]));
      } else
        ["imm", "zp", "zpx", "zpy", "izx", "izy"].includes(m)
          ? s.push([a++, S & 255])
          : m !== "imp" && m !== "acc" && s.push([a++, S & 255], [a++, (S >> 8) & 255]);
    });
  }
  return { bytes: s.slice(), labels: t, errors: n, start: r };
}
var Tt = (i, e = 0) => ({ re: i, im: e }),
  Pm = (i, e) => ({
    re: i.re * e.re - i.im * e.im,
    im: i.re * e.im + i.im * e.re,
  }),
  Ln = (i) => i.re * i.re + i.im * i.im,
  d0 = Math.SQRT1_2;
function Jn(i = 1) {
  let e = i >>> 0 || 1;
  return () => (
    (e ^= e << 13),
    (e >>>= 0),
    (e ^= e >> 17),
    (e ^= e << 5),
    (e >>>= 0),
    e / 4294967296
  );
}
function Im(i) {
  let e = 0,
    t = 0;
  for (; !e;) e = i();
  return ((t = i()), Math.sqrt(-2 * Math.log(e)) * Math.cos(2 * Math.PI * t));
}
var lA = (i) =>
  Array.from({ length: i }, (e, t) =>
    Array.from({ length: i }, (n, s) => Tt(t === s ? 1 : 0)),
  );
function Cm(i, e) {
  let t = i.length,
    n = e[0].length,
    s = e.length;
  return Array.from({ length: t }, (r, o) =>
    Array.from({ length: n }, (a, l) => {
      let c = 0,
        h = 0;
      for (let d = 0; d < s; d++) {
        let u = i[o][d],
          f = e[d][l];
        ((c += u.re * f.re - u.im * f.im), (h += u.re * f.im + u.im * f.re));
      }
      return { re: c, im: h };
    }),
  );
}
function Va(i, e) {
  let t = i.length,
    n = 0,
    s = 0;
  for (let r = 0; r < t; r++)
    for (let o = 0; o < t; o++) {
      let a = i[r][o],
        l = e[r][o];
      ((n += a.re * l.re + a.im * l.im), (s += a.re * l.im - a.im * l.re));
    }
  return (n * n + s * s) / (t * t);
}
function cA(i, e) {
  let t = Array.from({ length: i }, () =>
      Array.from({ length: i }, () => Tt(Im(e), Im(e))),
    ),
    n = [];
  for (let s = 0; s < i; s++) {
    let r = t.map((a) => ({ ...a[s] }));
    for (let a of n) {
      let l = 0,
        c = 0;
      for (let h = 0; h < i; h++)
        ((l += a[h].re * r[h].re + a[h].im * r[h].im),
          (c += a[h].re * r[h].im - a[h].im * r[h].re));
      for (let h = 0; h < i; h++)
        ((r[h].re -= l * a[h].re - c * a[h].im), (r[h].im -= l * a[h].im + c * a[h].re));
    }
    let o = Math.sqrt(r.reduce((a, l) => a + Ln(l), 0));
    ((r = r.map((a) => Tt(a.re / o, a.im / o))), n.push(r));
  }
  return Array.from({ length: i }, (s, r) =>
    Array.from({ length: i }, (o, a) => n[a][r]),
  );
}
var Ac = {
    "Identity (bar state)": (i) => lA(i),
    "Swap neighbours (cross state)": (i) =>
      Array.from({ length: i }, (e, t) =>
        Array.from({ length: i }, (n, s) => Tt(s === (t ^ 1) && (t ^ 1) < i ? 1 : 0)),
      ),
    "Reverse order": (i) =>
      Array.from({ length: i }, (e, t) =>
        Array.from({ length: i }, (n, s) => Tt(t + s === i - 1 ? 1 : 0)),
      ),
    "DFT (optical Fourier transform)": (i) =>
      Array.from({ length: i }, (e, t) =>
        Array.from({ length: i }, (n, s) =>
          Tt(
            Math.cos((-2 * Math.PI * t * s) / i) / Math.sqrt(i),
            Math.sin((-2 * Math.PI * t * s) / i) / Math.sqrt(i),
          ),
        ),
      ),
    "Hadamard H⊗H": (i) => {
      let e = [
        [1, 1],
        [1, -1],
      ];
      return Array.from({ length: i }, (t, n) =>
        Array.from({ length: i }, (s, r) => {
          let o = 1;
          for (let a = 0; 1 << a < i; a++) o *= e[(n >> a) & 1][(r >> a) & 1];
          return Tt(o / Math.sqrt(i));
        }),
      );
    },
    "Random (Haar) unitary": (i, e = 7) => cA(i, Jn(e)),
  },
  wo = class i {
    constructor(e = 4) {
      ((this.n = e), (this.mzis = []));
      for (let t = 0; t < e; t++)
        for (let n = t % 2; n + 1 < e; n += 2)
          this.mzis.push({ col: t, m: n, th: Math.PI / 2, ph: 0 });
      ((this.out = new Array(e).fill(0)), (this.cols = e));
    }
    get params() {
      let e = [];
      for (let t of this.mzis) e.push(t.th, t.ph);
      return e.concat(this.out);
    }
    set params(e) {
      let t = 0;
      for (let n of this.mzis) ((n.th = e[t++]), (n.ph = e[t++]));
      for (let n = 0; n < this.n; n++) this.out[n] = e[t++];
    }
    static mzi(e, t) {
      let n = (r) => Tt(Math.cos(r), Math.sin(r)),
        s = [
          [Tt(d0), Tt(0, d0)],
          [Tt(0, d0), Tt(d0)],
        ];
      return Cm(
        Cm(
          Cm(s, [
            [n(e), Tt(0)],
            [Tt(0), Tt(1)],
          ]),
          s,
        ),
        [
          [n(t), Tt(0)],
          [Tt(0), Tt(1)],
        ],
      );
    }
    apply(e, t) {
      let n = e.map((s) => ({ ...s }));
      t && t.push(n.map(Ln));
      for (let s = 0; s < this.cols; s++) {
        for (let r of this.mzis)
          if (r.col === s) {
            let o = r.T || i.mzi(r.th, r.ph),
              a = n[r.m],
              l = n[r.m + 1];
            ((n[r.m] = {
              re:
                o[0][0].re * a.re -
                o[0][0].im * a.im +
                o[0][1].re * l.re -
                o[0][1].im * l.im,
              im:
                o[0][0].re * a.im +
                o[0][0].im * a.re +
                o[0][1].re * l.im +
                o[0][1].im * l.re,
            }),
              (n[r.m + 1] = {
                re:
                  o[1][0].re * a.re -
                  o[1][0].im * a.im +
                  o[1][1].re * l.re -
                  o[1][1].im * l.im,
                im:
                  o[1][0].re * a.im +
                  o[1][0].im * a.re +
                  o[1][1].re * l.im +
                  o[1][1].im * l.re,
              }));
          }
        t && t.push(n.map(Ln));
      }
      return (
        (n = n.map((s, r) => Pm(s, Tt(Math.cos(this.out[r]), Math.sin(this.out[r]))))),
        n
      );
    }
    cache() {
      for (let e of this.mzis) e.T = i.mzi(e.th, e.ph);
    }
    uncache() {
      for (let e of this.mzis) delete e.T;
    }
    unitary() {
      this.cache();
      let e = this.n,
        t = [];
      for (let n = 0; n < e; n++)
        t.push(this.apply(Array.from({ length: e }, (s, r) => Tt(r === n ? 1 : 0))));
      return (this.uncache(), Array.from({ length: e }, (n, s) => t.map((r) => r[s])));
    }
    fit(e, { iters: t = 400, restarts: n = 4, seed: s = 3, tol: r = 1e-6 } = {}) {
      let o = Jn(s),
        a = null,
        l = -1;
      for (let c = 0; c < n && l < 1 - r; c++) {
        let h = this.params.map((g, m) => (c === 0 && m < 0 ? 0 : o() * 2 * Math.PI)),
          d = h.map(() => 0),
          u = h.map(() => 0),
          f = 0.08,
          p = (g) => ((this.params = g), 1 - Va(e, this.unitary())),
          x = p(h);
        for (let g = 1; g <= t && x > r; g++) {
          let m = h.map((S, b) => {
            let y = h.slice();
            return ((y[b] += 1e-5), (p(y) - x) / 1e-5);
          });
          for (let S = 0; S < h.length; S++)
            ((d[S] = 0.9 * d[S] + 0.1 * m[S]),
              (u[S] = 0.999 * u[S] + 0.001 * m[S] * m[S]),
              (h[S] -=
                (f * (d[S] / (1 - 0.9 ** g))) /
                (Math.sqrt(u[S] / (1 - 0.999 ** g)) + 1e-9)));
          (g % 150 === 0 && (f *= 0.5), (x = p(h)));
        }
        1 - x > l && ((l = 1 - x), (a = h.slice()));
      }
      return ((this.params = a), l);
    }
  };
function Dm(i = 4, e = 30, t = 11) {
  let n = Jn(t),
    s = Array.from({ length: 4 }, () => Array.from({ length: i }, () => n() * 2 - 1)),
    r = [],
    o = [];
  for (let a = 0; a < 4; a++)
    for (let l = 0; l < e; l++) (r.push(s[a].map((c) => c + Im(n) * 0.22)), o.push(a));
  return { X: r, Y: o, centers: s };
}
function Rc(i) {
  let e = i.map((n) => n + 1.2),
    t = Math.sqrt(e.reduce((n, s) => n + s * s, 0)) || 1;
  return e.map((n) => Tt(n / t));
}
var hA = (i, e = 1.6) => {
    let t = Math.sqrt(Ln(i)),
      n = Math.tanh(e * t) / (e * t || 1);
    return Tt(i.re * n, i.im * n);
  },
  Tc = class {
    constructor(e = 4) {
      ((this.n = e),
        (this.L1 = new wo(e)),
        (this.L2 = new wo(e)),
        (this.nonlin = !0),
        (this.scale = 12));
    }
    get params() {
      return this.L1.params.concat(this.L2.params);
    }
    set params(e) {
      let t = this.L1.params.length;
      ((this.L1.params = e.slice(0, t)), (this.L2.params = e.slice(t)));
    }
    forward(e, t, n) {
      let s = this.L1.apply(Rc(e), t);
      return (
        this.nonlin && (s = s.map((r) => hA(r))),
        (s = this.L2.apply(s, n)),
        s.map(Ln)
      );
    }
    predict(e) {
      let t = this.forward(e),
        n = 0;
      for (let s = 1; s < t.length; s++) t[s] > t[n] && (n = s);
      return n;
    }
    accuracy(e) {
      (this.L1.cache(), this.L2.cache());
      let t = 0;
      return (
        e.X.forEach((n, s) => {
          this.predict(n) === e.Y[s] && t++;
        }),
        this.L1.uncache(),
        this.L2.uncache(),
        t / e.X.length
      );
    }
    loss(e) {
      (this.L1.cache(), this.L2.cache());
      let t = 0;
      return (
        e.X.forEach((n, s) => {
          let r = this.forward(n).map((l) => l * this.scale),
            o = Math.max(...r),
            a = r.reduce((l, c) => l + Math.exp(c - o), 0);
          t -= r[e.Y[s]] - o - Math.log(a);
        }),
        this.L1.uncache(),
        this.L2.uncache(),
        t / e.X.length
      );
    }
    train(
      e,
      t = 1,
      n = 0.15,
      s = this._adam || (this._adam = { m: null, v: null, t: 0 }),
    ) {
      let r = 0;
      for (let o = 0; o < t; o++) {
        let a = this.params;
        r = this.loss(e);
        let l = a.map((c, h) => {
          let d = a.slice();
          return ((d[h] += 1e-4), (this.params = d), (this.loss(e) - r) / 1e-4);
        });
        (s.m || (s.m = a.map(() => 0)), s.v || (s.v = a.map(() => 0)), s.t++);
        for (let c = 0; c < a.length; c++)
          ((s.m[c] = 0.9 * s.m[c] + 0.1 * l[c]),
            (s.v[c] = 0.999 * s.v[c] + 0.001 * l[c] * l[c]),
            (a[c] -=
              (n * (s.m[c] / (1 - 0.9 ** s.t))) /
              (Math.sqrt(s.v[c] / (1 - 0.999 ** s.t)) + 1e-8)));
        this.params = a;
      }
      return r;
    }
  },
  Na = class i {
    constructor({
      N: e = 64,
      layers: t = 3,
      dx: n = 4e-4,
      z: s = 0.03,
      lambda: r = 75e-5,
    } = {}) {
      Object.assign(this, { N: e, nl: t, dx: n, z: s, lambda: r });
      let o = (2 * Math.PI) / r;
      this.H = [];
      for (let a = 0; a < e; a++) {
        let l = [];
        for (let c = 0; c < e; c++) {
          let h = (a - c) * n,
            d = Math.sqrt(h * h + s * s),
            u = ((s / (d * d)) * n) / Math.sqrt(r);
          l.push(
            Tt(u * Math.cos(o * d - Math.PI / 4), u * Math.sin(o * d - Math.PI / 4)),
          );
        }
        this.H.push(l);
      }
      ((this.phi = Array.from({ length: t }, () => new Float64Array(e))),
        (this.det = [0, 1, 2, 3].map((a) => [
          Math.round(e * (0.14 + a * 0.22)),
          Math.round(e * (0.14 + a * 0.22)) + 5,
        ])));
    }
    prop(e) {
      let t = this.N,
        n = new Array(t);
      for (let s = 0; s < t; s++) {
        let r = 0,
          o = 0,
          a = this.H[s];
        for (let l = 0; l < t; l++)
          ((r += a[l].re * e[l].re - a[l].im * e[l].im),
            (o += a[l].re * e[l].im + a[l].im * e[l].re));
        n[s] = { re: r, im: o };
      }
      return n;
    }
    propT(e) {
      let t = this.N,
        n = new Array(t);
      for (let s = 0; s < t; s++) {
        let r = 0,
          o = 0;
        for (let a = 0; a < t; a++) {
          let l = this.H[a][s];
          ((r += l.re * e[a].re + l.im * e[a].im),
            (o += l.re * e[a].im - l.im * e[a].re));
        }
        n[s] = { re: r, im: o };
      }
      return n;
    }
    forward(e, t) {
      let n = [e],
        s = e;
      for (let o = 0; o < this.nl; o++)
        ((s = this.prop(s).map((l, c) =>
          Pm(l, Tt(Math.cos(this.phi[o][c]), Math.sin(this.phi[o][c]))),
        )),
          n.push(s));
      let r = this.prop(s);
      return (t && (t.a = n), r);
    }
    energies(e) {
      return this.det.map(([t, n]) => {
        let s = 0;
        for (let r = t; r < n; r++) s += Ln(e[r]);
        return s;
      });
    }
    static pattern(e, t = 64) {
      let n = Array.from({ length: t }, () => Tt(0)),
        s = [
          [0.3, 0.38],
          [0.45, 0.55],
          [0.62, 0.7],
          [0.3, 0.38, 0.62, 0.7],
        ][e];
      for (let r = 0; r < s.length; r += 2)
        for (let o = Math.round(s[r] * t); o < Math.round(s[r + 1] * t); o++)
          n[o] = Tt(1);
      return n;
    }
    lossGrad(e, t, n = 8) {
      let s = {},
        r = this.forward(e, s),
        o = this.energies(r),
        a = o.reduce((b, y) => b + y, 0) + 1e-12,
        l = o.map((b) => (n * b) / a),
        c = Math.max(...l),
        h = l.map((b) => Math.exp(b - c)),
        d = h.reduce((b, y) => b + y, 0),
        u = h.map((b) => b / d),
        f = -Math.log(u[t] + 1e-12),
        p = u.map((b, y) => b - (y === t ? 1 : 0)),
        x = o.map(
          (b, y) => n * (p[y] / a - p.reduce((E, M, T) => E + M * o[T], 0) / (a * a)),
        ),
        g = r.map(() => Tt(0));
      this.det.forEach(([b, y], E) => {
        for (let M = b; M < y; M++) g[M] = Tt(x[E] * r[M].re, x[E] * r[M].im);
      });
      let m = this.phi.map(() => new Float64Array(this.N)),
        S = this.propT(g);
      for (let b = this.nl - 1; b >= 0; b--) {
        let y = s.a[b + 1];
        for (let M = 0; M < this.N; M++)
          m[b][M] = -2 * (S[M].re * y[M].im - S[M].im * y[M].re);
        let E = S.map((M, T) =>
          Pm(M, Tt(Math.cos(this.phi[b][T]), -Math.sin(this.phi[b][T]))),
        );
        S = this.propT(E);
      }
      return { L: f, grads: m, E: o };
    }
    train(e = 1, t = 0.3) {
      let n = 0;
      for (let s = 0; s < e; s++) {
        n = 0;
        let r = this.phi.map(() => new Float64Array(this.N));
        for (let o = 0; o < 4; o++) {
          let a = this.lossGrad(i.pattern(o, this.N), o);
          ((n += a.L / 4),
            a.grads.forEach((l, c) => l.forEach((h, d) => (r[c][d] += h))));
        }
        this.phi.forEach((o, a) => o.forEach((l, c) => (o[c] -= t * r[a][c])));
      }
      return n;
    }
    accuracy() {
      let e = 0;
      for (let t = 0; t < 4; t++) {
        let n = this.energies(this.forward(i.pattern(t, this.N)));
        n.indexOf(Math.max(...n)) === t && e++;
      }
      return e / 4;
    }
  };
