var AA = new Set([
    "PRINT",
    "?",
    "IF",
    "THEN",
    "GOTO",
    "GOSUB",
    "RETURN",
    "FOR",
    "TO",
    "STEP",
    "NEXT",
    "END",
    "STOP",
    "REM",
    "POKE",
    "INPUT",
    "LET",
    "CLS",
    "DIM",
    "SYS",
    "AND",
    "OR",
    "NOT",
    "LIST",
    "SAVE",
    "LOAD",
    "RUN",
    "NEW",
    "CLR",
    "DATA",
    "READ",
    "RESTORE",
    "ON",
    "WAIT",
  ]),
  RA = new Set([
    "PEEK",
    "RND",
    "INT",
    "ABS",
    "SQR",
    "SIN",
    "COS",
    "TAN",
    "ATN",
    "EXP",
    "LOG",
    "SGN",
    "LEN",
    "CHR$",
    "ASC",
    "STR$",
    "VAL",
    "LEFT$",
    "RIGHT$",
    "MID$",
    "FRE",
    "POS",
  ]),
  si = class extends Error {};
function nb(i) {
  let e = [],
    t = 0;
  for (; t < i.length;) {
    let n = i[t];
    if (n === " ") {
      t++;
      continue;
    }
    if (n === '"') {
      let r = t + 1;
      for (; r < i.length && i[r] !== '"';) r++;
      (e.push({ k: "s", v: i.slice(t + 1, r) }), (t = r + 1));
      continue;
    }
    if (/[0-9.]/.test(n)) {
      let r = i.slice(t).match(/^(\d*\.?\d+(?:E[+-]?\d+)?|\d+\.)/i);
      (e.push({ k: "n", v: parseFloat(r[0]) }), (t += r[0].length));
      continue;
    }
    if (/[A-Za-z]/.test(n)) {
      let r = i.slice(t).match(/^[A-Za-z][A-Za-z0-9]*[$%]?/),
        o = r[0].toUpperCase();
      if (((t += r[0].length), o === "REM")) {
        (e.push({ k: "k", v: "REM" }), e.push({ k: "s", v: i.slice(t) }));
        break;
      }
      if (o === "DATA") {
        e.push({ k: "k", v: "DATA" });
        let a = i.slice(t),
          l = a.indexOf(":"),
          c = l < 0 ? a : a.slice(0, l);
        (e.push({
          k: "data",
          v: c.split(",").map((h) => h.trim().replace(/^"|"$/g, "")),
        }),
          (t += c.length));
        continue;
      }
      e.push({ k: AA.has(o) ? "k" : RA.has(o) ? "f" : "id", v: o });
      continue;
    }
    let s = i.substr(t, 2);
    if (s === "<>" || s === "<=" || s === ">=") {
      (e.push({ k: "o", v: s }), (t += 2));
      continue;
    }
    if (n === "?") {
      (e.push({ k: "k", v: "PRINT" }), t++);
      continue;
    }
    (e.push({ k: "o", v: n }), t++);
  }
  return e;
}
var v0 = {},
  M0 = class {
    constructor(e) {
      ((this.io = e),
        (this.lines = new Map()),
        (this.state = "ready"),
        (this.vars = {}),
        this.reset());
    }
    reset() {
      ((this.vars = {}),
        (this.arrays = {}),
        (this.forStack = []),
        (this.gosub = []),
        (this.data = []),
        (this.dataPtr = 0));
    }
    compile() {
      ((this.prog = [...this.lines.entries()]
        .sort((e, t) => e[0] - t[0])
        .map(([e, t]) => ({ n: e, src: t, t: nb(t) }))),
        (this.idx = new Map(this.prog.map((e, t) => [e.n, t]))));
    }
    enter(e) {
      if (((e = e.trim()), !e)) return;
      if (this.state === "input") return this.gotInput(e);
      let t = e.match(/^(\d+)\s*(.*)$/);
      if (t) {
        (t[2] ? this.lines.set(+t[1], t[2]) : this.lines.delete(+t[1]), this.compile());
        return;
      }
      (this.compile(),
        (this.direct = { n: -1, src: e, t: nb(e) }),
        (this.pos = { li: -1, ti: 0 }),
        (this.state = "running"),
        (this.errorLine = null));
    }
    run(e) {
      (this.compile(),
        this.reset(),
        (this.data = this.prog.flatMap((t) =>
          t.t.filter((n) => n.k === "data").flatMap((n) => n.v),
        )),
        (this.pos = { li: e != null ? (this.idx.get(e) ?? 0) : 0, ti: 0 }),
        (this.state = this.prog.length ? "running" : "ready"));
    }
    line() {
      return this.pos.li < 0 ? this.direct : this.prog[this.pos.li];
    }
    tick(e = 400) {
      let t = 0;
      for (; this.state === "running" && t++ < e;)
        try {
          this.stmt();
        } catch (n) {
          let s = this.line();
          (this.io.print(`
?${n instanceof si ? n.message : "SYNTAX"} ERROR${s && s.n >= 0 ? " IN " + s.n : ""}
`),
            (this.state = "ready"),
            this.io.ready && this.io.ready());
          return;
        }
      return (
        this.state === "done" &&
          ((this.state = "ready"), this.io.ready && this.io.ready()),
        t
      );
    }
    peek() {
      let e = this.line();
      return e && e.t[this.pos.ti];
    }
    next() {
      return this.line().t[this.pos.ti++];
    }
    is(e, t) {
      let n = this.peek();
      return n && n.k === e && (t === void 0 || n.v === t);
    }
    accept(e, t) {
      return this.is(e, t) ? (this.pos.ti++, !0) : !1;
    }
    expect(e, t) {
      if (!this.accept(e, t)) throw new si("SYNTAX");
    }
    endStmt() {
      return !this.peek() || this.is("o", ":");
    }
    advanceLine() {
      if (this.pos.li < 0) {
        this.state = "done";
        return;
      }
      (this.pos.li++,
        (this.pos.ti = 0),
        this.pos.li >= this.prog.length && (this.state = "done"));
    }
    jump(e) {
      let t = this.idx.get(e);
      if (t === void 0) throw new si("UNDEF'D STATEMENT");
      this.pos = { li: t, ti: 0 };
    }
    stmt() {
      let e = this.line();
      if (!e) {
        this.state = "done";
        return;
      }
      if (this.pos.ti >= e.t.length) {
        this.advanceLine();
        return;
      }
      if (this.accept("o", ":")) return;
      let t = this.next();
      if (t.k === "id") return (this.pos.ti--, this.assign(), this.finish());
      if (t.k !== "k") throw new si("SYNTAX");
      switch (t.v) {
        case "REM":
        case "DATA":
          this.pos.ti = e.t.length;
          return;
        case "LET":
          this.assign();
          break;
        case "PRINT": {
          let n = !0,
            s = "";
          for (; !this.endStmt();) {
            if (this.accept("o", ";")) {
              n = !1;
              continue;
            }
            if (this.accept("o", ",")) {
              ((s += "	"), (n = !1));
              continue;
            }
            let r = this.expr();
            ((s += typeof r == "number" ? sb(r) : r), (n = !0));
          }
          this.io.print(
            s +
              (n
                ? `
`
                : ""),
          );
          break;
        }
        case "IF": {
          let n = this.expr();
          if (this.accept("k", "THEN") || this.is("k", "GOTO")) {
            if (!n) {
              this.advanceLine();
              return;
            }
            if (this.is("n")) {
              this.jump(this.next().v);
              return;
            }
            if (this.accept("k", "GOTO")) {
              this.jump(this.num());
              return;
            }
            return;
          }
          throw new si("SYNTAX");
        }
        case "GOTO":
          this.jump(this.num());
          return;
        case "GOSUB": {
          let n = this.num();
          (this.gosub.push({ ...this.pos }), this.jump(n));
          return;
        }
        case "RETURN": {
          let n = this.gosub.pop();
          if (!n) throw new si("RETURN WITHOUT GOSUB");
          this.pos = n;
          break;
        }
        case "ON": {
          let n = Math.floor(this.expr()),
            s = this.next(),
            r = [];
          do r.push(this.num());
          while (this.accept("o", ","));
          if (n >= 1 && n <= r.length) {
            (s.v === "GOSUB" && this.gosub.push({ ...this.pos }), this.jump(r[n - 1]));
            return;
          }
          break;
        }
        case "FOR": {
          let n = this.next().v;
          this.expect("o", "=");
          let s = this.expr();
          this.expect("k", "TO");
          let r = this.expr(),
            o = 1;
          (this.accept("k", "STEP") && (o = this.expr()),
            (this.vars[n] = s),
            (this.forStack = this.forStack.filter((a) => a.name !== n)),
            this.forStack.push({ name: n, b: r, s: o, pos: { ...this.pos } }));
          break;
        }
        case "NEXT": {
          let n = this.is("id") ? this.next().v : null,
            s;
          for (; (s = this.forStack[this.forStack.length - 1]) && n && s.name !== n;)
            this.forStack.pop();
          if (!s) throw new si("NEXT WITHOUT FOR");
          ((this.vars[s.name] += s.s),
            (s.s >= 0 ? this.vars[s.name] <= s.b : this.vars[s.name] >= s.b)
              ? (this.pos = { ...s.pos })
              : this.forStack.pop());
          break;
        }
        case "END":
        case "STOP":
          this.state = "done";
          return;
        case "POKE": {
          let n = this.expr();
          this.expect("o", ",");
          let s = this.expr();
          this.io.poke(n & 65535, s & 255);
          break;
        }
        case "SYS": {
          let n = this.expr();
          (this.finish(),
            (this.state = "sys"),
            this.io.sys(n & 65535, () => {
              this.state === "sys" && (this.state = "running");
            }));
          return;
        }
        case "CLS":
          this.io.cls();
          break;
        case "WAIT": {
          this.expr();
          break;
        }
        case "INPUT": {
          let n = "? ";
          (this.is("s") && ((n = this.next().v + "? "), this.accept("o", ";")),
            (this.inputVars = []));
          do this.inputVars.push(this.next().v);
          while (this.accept("o", ","));
          (this.io.print(n), (this.state = "input"), this.finish());
          return;
        }
        case "DIM":
          do {
            let n = this.next().v;
            this.expect("o", "(");
            let s = this.expr();
            (this.expect("o", ")"),
              (this.arrays[n] = new Array(s + 1).fill(n.endsWith("$") ? "" : 0)));
          } while (this.accept("o", ","));
          break;
        case "READ":
          do {
            let n = this.next().v;
            if (this.dataPtr >= this.data.length) throw new si("OUT OF DATA");
            let s = this.data[this.dataPtr++];
            this.vars[n] = n.endsWith("$") ? s : parseFloat(s);
          } while (this.accept("o", ","));
          break;
        case "RESTORE":
          this.dataPtr = 0;
          break;
        case "RUN": {
          let n = this.is("n") ? this.next().v : null;
          this.run(n);
          return;
        }
        case "LIST": {
          this.compile();
          let n = 0,
            s = 1 / 0;
          this.is("n")
            ? ((n = this.next().v),
              (s = n),
              this.accept("o", "-") && (s = this.is("n") ? this.next().v : 1 / 0))
            : this.accept("o", "-") && (s = this.num());
          for (let r of this.prog)
            r.n >= n &&
              r.n <= s &&
              this.io.print(
                r.n +
                  " " +
                  r.src +
                  `
`,
              );
          break;
        }
        case "SAVE":
        case "LOAD": {
          let n = this.is("s") ? this.next().v.toUpperCase() : "";
          if ((this.accept("o", ",") && this.expr(), !n))
            throw new si("MISSING FILE NAME");
          if (((this.disk = this.disk || v0), t.v === "SAVE"))
            (this.io.print(
              `
SAVING "` +
                n +
                `"
`,
            ),
              (v0[n] = [...this.lines.entries()]));
          else {
            if (!v0[n])
              throw (
                this.io.print(
                  `
SEARCHING FOR ` +
                    n +
                    `
`,
                ),
                this.io.disk && this.io.disk("load", n),
                new si("FILE NOT FOUND")
              );
            (this.io.print(
              `
SEARCHING FOR ` +
                n +
                `
LOADING
`,
            ),
              (this.lines = new Map(v0[n])),
              this.compile());
          }
          this.io.disk && this.io.disk(t.v.toLowerCase(), n);
          break;
        }
        case "NEW":
          (this.lines.clear(), this.compile(), this.reset());
          break;
        case "CLR":
          this.reset();
          break;
        default:
          throw new si("SYNTAX");
      }
      this.finish();
    }
    finish() {
      if (
        !(this.state !== "running" && this.state !== "input" && this.state !== "sys") &&
        !this.endStmt()
      )
        throw new si("SYNTAX");
    }
    gotInput(e) {
      let t = e.split(",");
      (this.inputVars.forEach((n, s) => {
        let r = (t[s] ?? "").trim();
        this.vars[n] = n.endsWith("$") ? r : parseFloat(r) || 0;
      }),
        (this.state = "running"));
    }
    num() {
      let e = this.expr();
      if (typeof e != "number") throw new si("TYPE MISMATCH");
      return e;
    }
    assign() {
      let e = this.next().v,
        t = null;
      (this.accept("o", "(") && ((t = this.num()), this.expect("o", ")")),
        this.expect("o", "="));
      let n = this.expr();
      if ((typeof n == "string") !== e.endsWith("$")) throw new si("TYPE MISMATCH");
      let s = e.endsWith("%") ? Math.trunc(n) : n;
      if (t !== null) {
        let r =
          this.arrays[e] ||
          (this.arrays[e] = new Array(11).fill(e.endsWith("$") ? "" : 0));
        if (t < 0 || t >= r.length) throw new si("BAD SUBSCRIPT");
        r[Math.floor(t)] = s;
      } else this.vars[e] = s;
    }
    expr() {
      let e = this.andE();
      for (; this.accept("k", "OR");) {
        let t = this.andE();
        e = e | t;
      }
      return e;
    }
    andE() {
      let e = this.notE();
      for (; this.accept("k", "AND");) {
        let t = this.notE();
        e = e & t;
      }
      return e;
    }
    notE() {
      return this.accept("k", "NOT") ? ~this.notE() : this.rel();
    }
    rel() {
      let e = this.add();
      for (;;) {
        let t = this.peek();
        if (!t || t.k !== "o" || !["=", "<", ">", "<>", "<=", ">="].includes(t.v))
          return e;
        this.pos.ti++;
        let n = this.add();
        e = {
          "=": e === n,
          "<>": e !== n,
          "<": e < n,
          ">": e > n,
          "<=": e <= n,
          ">=": e >= n,
        }[t.v]
          ? -1
          : 0;
      }
    }
    add() {
      let e = this.mul();
      for (;;)
        if (this.accept("o", "+")) {
          let t = this.mul();
          if (typeof e != typeof t) throw new si("TYPE MISMATCH");
          e = e + t;
        } else if (this.accept("o", "-")) e = e - this.mul();
        else return e;
    }
    mul() {
      let e = this.pow();
      for (;;)
        if (this.accept("o", "*")) e = e * this.pow();
        else if (this.accept("o", "/")) {
          let t = this.pow();
          if (t === 0) throw new si("DIVISION BY ZERO");
          e = e / t;
        } else return e;
    }
    pow() {
      let e = this.unary();
      for (; this.accept("o", "^");) e = Math.pow(e, this.unary());
      return e;
    }
    unary() {
      return this.accept("o", "-")
        ? -this.unary()
        : this.accept("o", "+")
          ? this.unary()
          : this.atom();
    }
    atom() {
      let e = this.next();
      if (!e) throw new si("SYNTAX");
      if (e.k === "n" || e.k === "s") return e.v;
      if (e.k === "o" && e.v === "(") {
        let t = this.expr();
        return (this.expect("o", ")"), t);
      }
      if (e.k === "f") {
        this.expect("o", "(");
        let t = [this.expr()];
        for (; this.accept("o", ",");) t.push(this.expr());
        this.expect("o", ")");
        let [n, s, r] = t;
        switch (e.v) {
          case "PEEK":
            return this.io.peek(n & 65535);
          case "RND":
            return Math.random();
          case "INT":
            return Math.floor(n);
          case "ABS":
            return Math.abs(n);
          case "SQR":
            return Math.sqrt(n);
          case "SIN":
            return Math.sin(n);
          case "COS":
            return Math.cos(n);
          case "TAN":
            return Math.tan(n);
          case "ATN":
            return Math.atan(n);
          case "EXP":
            return Math.exp(n);
          case "LOG":
            return Math.log(n);
          case "SGN":
            return Math.sign(n);
          case "LEN":
            return n.length;
          case "CHR$":
            return String.fromCharCode(n);
          case "ASC":
            return n.charCodeAt(0) || 0;
          case "STR$":
            return sb(n);
          case "VAL":
            return parseFloat(n) || 0;
          case "LEFT$":
            return n.slice(0, s);
          case "RIGHT$":
            return n.slice(Math.max(0, n.length - s));
          case "MID$":
            return n.substr(s - 1, r ?? 255);
          case "FRE":
            return 38911;
          case "POS":
            return this.io.pos ? this.io.pos() : 0;
        }
      }
      if (e.k === "id") {
        if (e.v === "TI") return Math.floor(performance.now() * 0.06);
        if (this.accept("o", "(")) {
          let t = this.num();
          this.expect("o", ")");
          let n =
            this.arrays[e.v] ||
            (this.arrays[e.v] = new Array(11).fill(e.v.endsWith("$") ? "" : 0));
          if (t < 0 || t >= n.length) throw new si("BAD SUBSCRIPT");
          return n[Math.floor(t)];
        }
        return this.vars[e.v] ?? (e.v.endsWith("$") ? "" : 0);
      }
      throw new si("SYNTAX");
    }
  };
function sb(i) {
  if (Number.isInteger(i)) return (i >= 0 ? " " : "") + i + " ";
  let e = (+i.toPrecision(9)).toString();
  return (i >= 0 ? " " : "") + e + " ";
}
var Uc = [
    "#000000",
    "#ffffff",
    "#880000",
    "#aaffee",
    "#cc44cc",
    "#00cc55",
    "#0000aa",
    "#eeee77",
    "#dd8855",
    "#664400",
    "#ff7777",
    "#333333",
    "#777777",
    "#aaff66",
    "#0088ff",
    "#bbbbbb",
  ],
  Mn = 1024,
  Ws = 55296,
  Xs = 40,
  Qm = 25,
  S0 = {
    "Hello + colour cycle": `10 PRINT CHR$(147)
20 PRINT "**** 6502 HOME COMPUTER BASIC ****"
30 PRINT " 64K RAM SYSTEM  38911 BASIC BYTES FREE"
40 FOR I=1 TO 15
50 POKE 646,I : POKE 53280,I
60 PRINT "COLOUR";I;"  ";
70 NEXT I
80 PRINT : S=0
90 FOR I=1 TO 100 : S=S+I : NEXT
100 PRINT "SUM OF 1..100 =";S
110 POKE 53280,14 : POKE 646,14`,
    "10 PRINT maze (classic one-liner)": `10 PRINT CHR$(205.5+RND(1));
20 GOTO 10`,
    "Bouncing ball (POKE into video RAM)": `10 PRINT CHR$(147)
20 X=1:Y=1:DX=1:DY=1
30 P=1024+X+40*Y
40 POKE P,81:POKE 55296+X+40*Y,7
50 FOR D=1 TO 3:NEXT
60 POKE P,32
70 X=X+DX:Y=Y+DY
80 IF X<=0 OR X>=39 THEN DX=-DX
90 IF Y<=0 OR Y>=24 THEN DY=-DY
100 GOTO 30`,
    "Call 6502 machine code (SYS)": `10 PRINT CHR$(147);"BASIC IS ABOUT TO CALL 6502 CODE AT 49152"
20 FOR I=1 TO 500:NEXT
30 SYS 49152
40 PRINT "BACK IN BASIC. BORDER =";PEEK(53280) AND 15
50 PRINT "6502 WROTE";PEEK(49408);"TO 49408 (=2+3)"`,
    "Guess the number (INPUT)": `10 N=INT(RND(1)*100)+1:T=0
20 PRINT "I'M THINKING OF 1..100"
30 INPUT "YOUR GUESS";G
40 T=T+1
50 IF G<N THEN PRINT "HIGHER":GOTO 30
60 IF G>N THEN PRINT "LOWER":GOTO 30
70 PRINT "YES! IN";T;"TRIES"`,
  },
  jm = `; 6502 machine code, assembled to $C000 (49152). Call with SYS 49152
        * = $C000
        LDX #0
loop:   TXA
        STA $0400,X     ; screen RAM, pages $04-$06
        STA $0500,X
        STA $0600,X
        AND #$0F
        STA $D800,X     ; colour RAM
        STA $D900,X
        STA $DA00,X
        INX
        BNE loop
        CLC
        LDA #2
        ADC #3          ; 2 + 3 in the 6502 ALU
        STA $C100       ; = 49408
        INC $D020       ; VIC-II border colour + 1
        RTS             ; back to BASIC`;
function Jm() {
  let i = new Uint8Array(65536),
    e = !0,
    t = 0,
    n = 0,
    s = 0,
    r = "",
    o = {},
    a,
    l = null,
    c = null,
    h = { ram: 0, vic: 0, rom: 0 },
    d = (_, P) => {
      ((i[_] = P),
        (_ >= Mn && _ < Mn + 1e3) ||
        (_ >= Ws && _ < Ws + 1e3) ||
        _ === 53280 ||
        _ === 53281
          ? ((e = !0), h.vic++)
          : h.ram++);
    },
    u = new Sr((_) => i[_], d),
    f = {
      disk: () => hi("floppy", { min: 0.4 }),
      print: (_) => {
        for (let P of _) m(P.charCodeAt(0));
        h.rom++;
      },
      cls: () => x(),
      peek: (_) => i[_],
      poke: (_, P) => d(_, P),
      sys: (_, P) => {
        ((u.pc = _),
          (u.sp = 255),
          u.push(255),
          u.push(253),
          (u.brk = !1),
          (u.jammed = !1),
          (l = !0),
          (c = P),
          w.diag.pulse("basic", "cpu", "#a0e060"));
      },
      ready: () => {
        S(`
READY.
`);
      },
      pos: () => n,
    },
    p = new M0(f);
  function x() {
    for (let _ = 0; _ < 1e3; _++) ((i[Mn + _] = 32), (i[Ws + _] = i[646]));
    ((t = n = 0), (e = !0));
  }
  function g() {
    (i.copyWithin(Mn, Mn + Xs, Mn + 1e3), i.copyWithin(Ws, Ws + Xs, Ws + 1e3));
    for (let _ = 0; _ < Xs; _++) ((i[Mn + 960 + _] = 32), (i[Ws + 960 + _] = i[646]));
    t = Qm - 1;
  }
  function m(_) {
    if (_ === 147) {
      x();
      return;
    }
    if (_ === 10) {
      ((n = 0), t++, t >= Qm && g(), (e = !0));
      return;
    }
    if (_ === 9) {
      do m(32);
      while (n % 10);
      return;
    }
    if (_ === 20) {
      n > 0 && (n--, (i[Mn + t * Xs + n] = 32), (e = !0));
      return;
    }
    ((i[Mn + t * Xs + n] = _ & 255),
      (i[Ws + t * Xs + n] = i[646]),
      n++,
      (e = !0),
      n >= Xs && ((n = 0), t++, t >= Qm && g()));
  }
  let S = (_) => {
    for (let P of _) m(P.charCodeAt(0));
  };
  function b() {
    (i.fill(0),
      (i[53280] = 14),
      (i[53281] = 6),
      (i[646] = 14),
      x(),
      S(`
    **** 6502 HOME COMPUTER BASIC V2 ****

 64K RAM SYSTEM  38911 BASIC BYTES FREE

READY.
`));
  }
  function y(_) {
    if (_.key === "Escape") {
      (p.state !== "ready" &&
        ((p.state = "ready"),
        (l = null),
        S(`
BREAK
READY.
`)),
        _.preventDefault());
      return;
    }
    if (!(p.state === "running" || p.state === "sys")) {
      if ((w.diag.pulse("cia", "cpu", "#ffd166", 3), _.key === "Enter")) {
        let P = r;
        ((r = ""), m(10), E(P), _.preventDefault());
        return;
      }
      if (_.key === "Backspace") {
        (r && ((r = r.slice(0, -1)), m(20)), _.preventDefault());
        return;
      }
      if (_.key.length === 1) {
        let P = _.key.toUpperCase();
        ((r += P), m(P.charCodeAt(0)), _.preventDefault());
      }
    }
  }
  function E(_) {
    let P = p.state === "input";
    (p.enter(_),
      !P && p.state === "ready" && !/^\d/.test(_.trim()) && _.trim() && f.ready(),
      M());
  }
  function M() {
    !o.code ||
      document.activeElement === o.code ||
      (o.code.value = [...p.lines.entries()]
        .sort((_, P) => _[0] - P[0])
        .map(([_, P]) => _ + " " + P).join(`
`));
  }
  function T(_) {
    p.lines.clear();
    for (let P of _.split(`
`)) {
      let V = P.trim().match(/^(\d+)\s*(.*)$/);
      V && V[2] && p.lines.set(+V[1], V[2]);
    }
    p.compile();
  }
  function A(_) {
    let P = Er(_);
    if (
      ((o.aerr.textContent = P.errors.join(`
`)),
      P.errors.length)
    )
      return !1;
    for (let [V, k] of P.bytes) i[V] = k;
    return (
      (o.aerr.textContent = `assembled ${P.bytes.length} bytes at $${bt(P.bytes[0]?.[0] ?? 49152, 4)}`),
      !0
    );
  }
  let w = {
    id: "home80",
    era: "1980s",
    short: "Home computer",
    sim: { cpu: u, basic: p, mem: i },
    name: "8-bit Home Computer (Commodore 64-class: 6502 CPU, VIC video chip, BASIC in ROM)",
    blurb:
      "The 1982 Commodore 64 sold ~12 million units: a 1 MHz MOS 6510 (a 6502), 64 KB DRAM, a VIC-II video chip that reads screen RAM directly, the SID sound chip and Microsoft BASIC in ROM. Here a complete 6502 emulator (all 151 official opcodes, decimal mode, cycle counts, ~1 MHz) shares one 64 KB memory with a BASIC interpreter and a VIC-style video chip: POKE 1024,1 puts a character on screen, POKE 53280,2 turns the border red, SYS 49152 runs your 6502 code. Click the screen and type.",
    diagram: {
      nodes: [
        {
          id: "cpu",
          label: `6510 CPU
1 MHz`,
          x: 0.13,
          y: 0.25,
          w: 0.18,
          color: "#a0e060",
        },
        {
          id: "basic",
          label: `BASIC +
KERNAL ROM`,
          x: 0.13,
          y: 0.75,
          w: 0.2,
          color: "#ffd166",
        },
        {
          id: "ram",
          label: `64 KB DRAM
8×4164`,
          x: 0.43,
          y: 0.25,
          w: 0.2,
          color: "#58c4ff",
        },
        {
          id: "vic",
          label: `VIC-II
video`,
          x: 0.72,
          y: 0.25,
          w: 0.17,
          color: "#c08cff",
        },
        {
          id: "crt",
          label: "TV / monitor",
          x: 0.9,
          y: 0.75,
          w: 0.18,
          color: "#5fe08a",
        },
        {
          id: "cia",
          label: `CIA 6526
keyboard`,
          x: 0.43,
          y: 0.75,
          w: 0.2,
          color: "#ff8ab0",
        },
        {
          id: "colr",
          label: `Colour RAM
1K×4`,
          x: 0.68,
          y: 0.75,
          w: 0.17,
          color: "#ffb347",
        },
      ],
      edges: [
        ["cpu", "ram", "bus"],
        ["basic", "cpu"],
        ["cpu", "basic"],
        ["ram", "vic", "DMA"],
        ["cpu", "vic", "regs"],
        ["vic", "crt"],
        ["cia", "cpu"],
        ["colr", "vic"],
        ["cpu", "colr"],
      ],
    },
    build(_) {
      let P = U.plastic(9405036, 0.55),
        V = new Hn();
      (V.moveTo(-0.5, 0),
        V.lineTo(0.5, 0),
        V.lineTo(0.5, 0.14),
        V.lineTo(-0.5, 0.26),
        V.closePath());
      let k = new ya(V, {
        depth: 1.6,
        bevelEnabled: !0,
        bevelSize: 0.02,
        bevelThickness: 0.02,
        bevelSegments: 2,
      });
      (k.rotateY(-Math.PI / 2), k.translate(0.8, 0, 0));
      let L = new B(k, P);
      ((L.position.y = 0),
        _.add(L, {
          name: '"Breadbin" case',
          info: "Injection-moulded ABS case, brown-beige. The keyboard is a matrix of 64 keys scanned by a CIA chip. Use Cutaway to see the motherboard.",
          shell: !0,
          explode: [0, 0.5, 0],
        }));
      let z = new te(0.075, 0.03, 0.075),
        F = new ut(z, U.plastic(3878695, 0.5), 66),
        H = new je(),
        j = 0;
      for (let de = 0; de < 5; de++)
        for (let D = 0; D < (de === 4 ? 6 : 15) && !(j >= 66); D++) {
          let $ = 0.36 - de * 0.085;
          (H.position.set(
            de === 4
              ? -0.3 + D * 0.085 + (D > 2 ? 0.25 : 0)
              : -0.66 + D * 0.085 + de * 0.02,
            0.14 + (0.5 - $) * 0.12 + 0.035,
            $,
          ),
            H.scale.set(de === 4 && D === 2 ? 4 : 1, 1, 1),
            (H.rotation.x = 0.12),
            H.updateMatrix(),
            F.setMatrixAt(j++, H.matrix));
        }
      ((F.count = j),
        _.add(F, {
          name: "Keyboard (8×8 matrix)",
          info: "Full-travel mechanical keys in an 8×8 matrix. CIA #1 drives the columns and reads the rows 60 times a second in the KERNAL interrupt routine. In this lab: click the screen in the panel and type.",
        }));
      let K = new ut(z, U.plastic(13219984, 0.5), 4);
      for (let de = 0; de < 4; de++)
        (H.position.set(
          0.68,
          0.14 + (0.5 - (0.36 - de * 0.09)) * 0.12 + 0.035,
          0.36 - de * 0.09,
        ),
          (H.rotation.x = 0.12),
          H.scale.set(1.4, 1, 1),
          H.updateMatrix(),
          K.setMatrixAt(de, H.matrix));
      (_.add(K, {}),
        Nt(_, "commodore 64", 0.36, 0.042, [-0.45, 0.14 + 0.85 * 0.12 + 0.026, -0.36], {
          bg: "#231f1c",
          color: "#e8e0d0",
          rot: [-Math.PI / 2 + 0.12, 0, 0],
        }));
      const rainbowCols = [0xe03c28, 0xf08c20, 0xf4d028, 0x48b848, 0x2888d8];
      rainbowCols.forEach((rc, ri) => {
        let stripe = new B(new te(0.05, 0.004, 0.0075), U.plastic(rc, 0.35));
        stripe.rotation.x = 0.12;
        stripe.position.set(-0.23, 0.244 + ri * 0.001, -0.342 - ri * 0.008);
        _.root.add(stripe);
      });
      let c64Pwr = new B(new Mt(0.009, 14, 10), U.glow(0xff3322, 1.5));
      c64Pwr.position.set(0.68, 0.252, -0.35);
      _.root.add(c64Pwr);
      const c64Leg = Bt(2048, 512);
      const c64Ctx = c64Leg.ctx;
      c64Ctx.clearRect(0, 0, 2048, 512);
      c64Ctx.fillStyle = "#ece4d4";
      c64Ctx.font = '700 28px "JetBrains Mono", monospace';
      c64Ctx.textAlign = "center";
      c64Ctx.textBaseline = "middle";
      const c64Rows = [
        [
          "←",
          "1!",
          '2"',
          "3#",
          "4$",
          "5%",
          "6&",
          "7'",
          "8(",
          "9)",
          "0",
          "+",
          "-",
          "£",
          "CLR",
        ],
        ["CTRL", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "@", "*", "↑", "REST"],
        [
          "STOP",
          "A",
          "S",
          "D",
          "F",
          "G",
          "H",
          "J",
          "K",
          "L",
          ":",
          ";",
          "=",
          "RETURN",
          "",
        ],
        [
          "C=",
          "SHIFT",
          "Z",
          "X",
          "C",
          "V",
          "B",
          "N",
          "M",
          ",",
          ".",
          "/",
          "SHIFT",
          "CRSR",
          "",
        ],
      ];
      c64Rows.forEach((rArr, ri) => {
        rArr.forEach((lbl, ci) => {
          if (!lbl) return;
          c64Ctx.fillText(lbl, 72 + ci * 134, 68 + ri * 112);
        });
      });
      c64Leg.tex.needsUpdate = true;
      let c64LegMesh = new B(
        new mt(1.28, 0.34),
        new xt({ map: c64Leg.tex, transparent: true, depthWrite: false }),
      );
      c64LegMesh.rotation.x = -Math.PI / 2 + 0.12;
      c64LegMesh.position.set(-0.04, 0.215, 0.19);
      _.root.add(c64LegMesh);
      let ue = _.group([0, 0.03, -0.05], {
          name: "Motherboard",
          info: 'Two-layer green PCB with ~40 chips. Everything shares one 8-bit data bus: the VIC-II steals half of every clock cycle (and whole "bad lines") to fetch screen RAM, which is why the CPU runs at 0.985 MHz instead of 1.02.',
          explode: [0, -0.2, 0],
        }),
        Me = new B(new te(1.5, 0.015, 0.8), U.pcb(2059061));
      ue.add(Me);
      let ee = [
        [
          "MOS 6510 CPU",
          [-0.45, 0.2],
          [0.09, 0.26],
          "6502 core + a 6-bit I/O port used for memory banking (ROM in/out). 8-bit A/X/Y, 8-bit stack pointer at page 1, 16-bit address bus, ~3,500 transistors. ",
          () => `PC $${bt(u.pc, 4)} A $${bt(u.a)} X $${bt(u.x)} Y $${bt(u.y)} SP $${bt(u.sp)}
cycles ${u.cycles}`,
        ],
        [
          "VIC-II video chip (6569)",
          [0.05, 0.22],
          [0.1, 0.27],
          "Generates 40×25 text / 320×200 bitmap, 8 hardware sprites, smooth scroll and raster interrupts. Reads screen codes from $0400 and colour nybbles from $D800 every frame — the emulated chip does exactly that to paint the screen. Registers at $D000 (border $D020, background $D021).",
          () => `border ${i[53280] & 15}  background ${i[53281] & 15}
screen RAM $0400, colour RAM $D800`,
        ],
        [
          "SID 6581 sound chip",
          [0.3, 0.22],
          [0.09, 0.26],
          "3 oscillators (saw/triangle/pulse/noise), ADSR envelopes and an analog multimode filter: a real synthesizer on a chip.",
        ],
        [
          "BASIC ROM (8 KB)",
          [-0.15, -0.15],
          [0.07, 0.2],
          "Microsoft BASIC V2 at $A000–$BFFF. Here a JS interpreter plays this ROM's role; it reaches the hardware only via PEEK/POKE/SYS.",
        ],
        [
          "KERNAL ROM (8 KB)",
          [0, -0.15],
          [0.07, 0.2],
          "Operating system at $E000: screen editor, keyboard scan, serial bus (disk) and tape routines, reached through a jump table.",
        ],
        [
          "Character ROM (4 KB)",
          [0.15, -0.15],
          [0.07, 0.2],
          "8×8 pixel glyphs for 512 characters; the VIC-II looks up each screen code here.",
        ],
        [
          "CIA 6526 #1 / #2",
          [0.45, -0.1],
          [0.08, 0.24],
          "Complex Interface Adapters: keyboard & joystick ports, timers, time-of-day clock, serial bus.",
        ],
        [
          "PLA (memory map logic)",
          [-0.3, -0.15],
          [0.06, 0.16],
          "Programmable Logic Array decoding the 64 KB map: which of RAM/ROM/I/O answers each address.",
        ],
      ];
      for (let [de, [D, $], [Y, se], he, _e] of ee)
        _.chip(
          Y,
          se,
          [D, 0.01, $],
          {
            name: de,
            info: he,
            live: _e,
            text: de.split(" ")[0],
            explode: [0, 0.25, 0],
          },
          ue,
        );
      for (let de = 0; de < 8; de++)
        _.chip(
          0.05,
          0.12,
          [-0.6 + de * 0.07, 0.01, 0],
          de
            ? {}
            : {
                name: "DRAM 4164 ×8 (64 KB)",
                info: "64K×1-bit dynamic RAM chips, one per data bit. Each bit is a capacitor that leaks, so the VIC-II also performs refresh. Screen, BASIC program and variables all live here.",
                live: () =>
                  `bytes at $0400: ${Array.from(i.slice(Mn, Mn + 8), (D) => bt(D)).join(" ")}`,
              },
          ue,
        );
      let X = new B(new te(0.34, 0.04, 0.5), U.metal(12105912, 0.35));
      (X.position.set(0.18, 0.04, 0.12),
        (X.visible = !1),
        ue.add(X),
        _.box(0.2, 0.06, 0.04, U.metal(12303291), [0.55, 0.06, -0.47], {
          name: "Cartridge / user / A-V ports",
          info: "Expansion port exposes the full bus; the A/V port gives composite / chroma-luma video for the monitor.",
        }));
      let W = _.group([0, 0, -1.3], {
          name: "Colour monitor (1702-style CRT)",
          info: "Composite/S-video colour CRT. The image is the VIC-II's output rendered from the emulator's screen and colour RAM.",
          explode: [0, 0, -0.5],
        }),
        G = new B(chamferBox(1.2, 0.96, 0.88, 0.024, 2), U.plastic(9405036, 0.48));
      ((G.position.y = 0.5), (G.castShadow = !0), W.add(G));
      let rearYoke = new B(
        chamferBox(0.8, 0.64, 0.34, 0.024, 2),
        U.plastic(0x7c715e, 0.52),
      );
      rearYoke.position.set(0, 0.52, -0.56);
      let silverFace = new B(
        chamferBox(1.14, 0.9, 0.03, 0.014, 1),
        U.plastic(0x9a968c, 0.48),
      );
      silverFace.position.set(0, 0.5, 0.435);
      let le = new B(chamferBox(0.99, 0.73, 0.036, 0.012, 2), U.plastic(0x212429, 0.55));
      (le.position.set(0, 0.54, 0.452),
        W.add(rearYoke, silverFace, le),
        (a = Bt(1408, 928)));
      let pe = new B(new mt(0.92, 0.66), U.screen(a.tex, { crt: true }));
      (pe.position.set(0, 0.54, 0.472), W.add(pe));
      let crtGlass = new B(new mt(0.93, 0.67), U.glass(0xe2f2ff, 0.14));
      crtGlass.position.set(0, 0.54, 0.476);
      let ctrlDoor = new B(
        chamferBox(0.32, 0.065, 0.018, 0.004, 1),
        U.plastic(0x6e6453, 0.48),
      );
      ctrlDoor.position.set(0.34, 0.11, 0.454);
      let monLed = new B(new Mt(0.008, 12, 8), U.glow(0x4eff6b, 1.4));
      monLed.position.set(0.52, 0.11, 0.456);
      W.add(crtGlass, ctrlDoor, monLed);
      let Ee = _.group([1.15, 0, -0.2], {
          name: "1541 floppy drive",
          info: '5¼" single-sided 170 KB drive with its OWN 6502, 2 KB RAM and DOS in ROM — a computer itself, connected by a slow serial bus.',
          explode: [0.5, 0, 0],
        }),
        be = new B(chamferBox(0.5, 0.21, 0.8, 0.014, 2), U.plastic(13616293, 0.46));
      ((be.position.y = 0.105), (be.castShadow = !0), Ee.add(be));
      let face1541 = new B(
        chamferBox(0.47, 0.17, 0.025, 0.008, 1),
        U.plastic(0x3a332c, 0.5),
      );
      face1541.position.set(0, 0.105, 0.4);
      let re = new B(new te(0.34, 0.018, 0.024), U.plastic(0x141518, 0.6));
      re.position.set(0, 0.125, 0.412);
      let latch = new B(
        chamferBox(0.055, 0.026, 0.028, 0.004, 1),
        U.plastic(0x6e6252, 0.42),
      );
      latch.position.set(0, 0.155, 0.418);
      let ledPwr = new B(new te(0.018, 0.008, 0.01), U.glow(0x48ff68, 1.3));
      ledPwr.position.set(-0.18, 0.065, 0.415);
      let ledAct = new B(new te(0.018, 0.008, 0.01), U.glow(0xff3b2f, 0.35));
      ledAct.position.set(0.18, 0.065, 0.415);
      Ee.add(face1541, re, latch, ledPwr, ledAct);
      for (let vs = 0; vs < 6; vs++) {
        let vent = new B(new te(0.32, 0.006, 0.016), U.plastic(0x2a2622, 0.7));
        vent.position.set(0, 0.211, -0.12 - vs * 0.036);
        Ee.add(vent);
      }
      (Dt(
        _,
        [
          [0.75, 0.06, -0.45],
          [0.95, 0.03, -0.5],
          [1, 0.1, -0.55],
        ],
        0.012,
        2236962,
      ),
        Dt(
          _,
          [
            [0.4, 0.06, -0.48],
            [0.3, 0.03, -0.8],
            [0.2, 0.2, -1.2],
          ],
          0.012,
          2236962,
        ));
    },
    ui(_) {
      let P = q("canvas", {
        width: 704,
        height: 464,
        tabindex: 0,
        class: "plot",
        style: { cursor: "text", imageRendering: "pixelated" },
      });
      ((o.view = P),
        P.addEventListener("keydown", (k) => {
          (k.stopPropagation(), y(k));
        }),
        P.addEventListener("click", () => P.focus()));
      let V = Object.keys(S0);
      ((o.code = Ht(
        S0[V[0]],
        (k) => {
          T(k);
        },
        10,
      )),
        (o.asm = Ht(jm, () => {}, 10)),
        (o.aerr = q("div", { class: "small" })),
        (o.regs = q("div", { class: "regs" })),
        (o.stats = Pt([
          ["st", "BASIC state"],
          ["cy", "6502 cycles"],
          ["in", "6502 instr"],
          ["bd", "border"],
        ])),
        _.append(
          Ie(
            "Screen (click, then type BASIC · Esc = RUN/STOP)",
            P,
            q(
              "div",
              { class: "row" },
              Fe(
                "RUN",
                () => {
                  v("RUN");
                },
                "pri",
              ),
              Fe("LIST", () => v("LIST")),
              Fe("RUN/STOP", () => y({ key: "Escape", preventDefault() {} })),
              Fe("Reset", () => {
                ((p.state = "ready"), (l = null), b());
              }),
            ),
          ),
          Ie(
            "BASIC program (edits go straight into program memory)",
            q(
              "div",
              { class: "row" },
              "Load ",
              st(V, V[0], (k) => {
                ((o.code.value = S0[k]), T(S0[k]));
              }),
            ),
            o.code,
            q(
              "div",
              { class: "small" },
              "PRINT INPUT LET IF/THEN GOTO GOSUB/RETURN FOR/NEXT/STEP ON..GOTO DIM READ/DATA POKE SYS CLS END · PEEK RND INT ABS SQR SIN COS LEN CHR$ ASC STR$ VAL LEFT$ RIGHT$ MID$. Memory map: screen 1024–2023, colour 55296+, border 53280, background 53281, text colour 646.",
            ),
          ),
          Ie(
            "6502 assembler → RAM",
            o.asm,
            q(
              "div",
              { class: "row" },
              Fe("Assemble to $C000", () => A(o.asm.value)),
              Fe("Assemble + SYS 49152", () => {
                A(o.asm.value) && v("SYS 49152");
              }),
            ),
            o.aerr,
          ),
          Ie("6502 registers", o.regs),
          o.stats,
        ),
        b(),
        T(o.code.value),
        A(jm),
        M());
    },
    update(_) {
      if (l) {
        let P = u.cycles + Math.min(985248 * _, 12e4);
        for (; u.cycles < P;) {
          if (u.pc === 65534 || u.brk || u.jammed) {
            l = null;
            let V = c;
            ((c = null),
              u.jammed &&
                S(`
?CPU JAM
`),
              V && V());
            break;
          }
          u.step();
        }
        w.diag.pulse("cpu", "ram", "#58c4ff", 3);
      }
      (p.tick(l ? 0 : 300),
        h.vic && w.diag.pulse("cpu", "vic", "#c08cff", 3),
        h.rom && w.diag.pulse("basic", "cpu", "#ffd166", 3),
        Math.random() < 0.3 && w.diag.pulse("ram", "vic", "#c08cff", 2),
        w.diag.pulse("vic", "crt", "#5fe08a", 1.5),
        (h = { ram: 0, vic: 0, rom: 0 }),
        (e || Math.floor(performance.now() / 330) !== w._blink) &&
          ((w._blink = Math.floor(performance.now() / 330)), R(), (e = !1)),
        (o.regs.textContent = `PC $${bt(u.pc, 4)}  A $${bt(u.a)}  X $${bt(u.x)}  Y $${bt(u.y)}  SP $${bt(u.sp)}  P ${(u.p >>> 0).toString(2).padStart(8, "0")} (NV-BDIZC)
$C000: ${Array.from(i.slice(49152, 49168), (P) => bt(P)).join(" ")}`),
        o.stats.set("st", l ? "SYS (6502)" : p.state.toUpperCase()),
        o.stats.set("cy", u.cycles),
        o.stats.set("in", u.instr),
        o.stats.set("bd", i[53280] & 15));
    },
    enter() {
      setTimeout(() => o.view && o.view.focus({ preventScroll: !0 }), 50);
    },
  };
  function v(_) {
    p.state === "running" || l || ((r = ""), S(_), m(10), E(_));
  }
  function R() {
    let _ = a.ctx;
    (_.save(),
      _.scale(2, 2),
      (_.fillStyle = Uc[i[53280] & 15]),
      _.fillRect(0, 0, 704, 464),
      (_.fillStyle = Uc[i[53281] & 15]),
      _.fillRect(32, 32, 640, 400),
      (_.font = 'bold 16px "Courier New",monospace'),
      (_.textBaseline = "top"));
    for (let P = 0; P < 1e3; P++) {
      let V = i[Mn + P],
        k = 32 + (P % Xs) * 16,
        L = 32 + Math.floor(P / Xs) * 16,
        z = !1;
      V >= 128 && V !== 205 && V !== 206 && ((z = !0), (V -= 128));
      let F = Uc[i[Ws + P] & 15];
      if ((z && ((_.fillStyle = F), _.fillRect(k, L, 16, 16)), V === 32 && !z)) continue;
      let H =
        V < 32
          ? String.fromCharCode(64 + V)
          : V === 205
            ? "╲"
            : V === 206
              ? "╱"
              : String.fromCharCode(V);
      ((_.fillStyle = z ? Uc[i[53281] & 15] : F), _.fillText(H, k + 2, L + 1));
    }
    ((p.state === "ready" || p.state === "input") &&
      !l &&
      w._blink % 2 &&
      ((_.fillStyle = Uc[i[646] & 15]), _.fillRect(32 + n * 16, 32 + t * 16, 16, 16)),
      _.restore(),
      (a.tex.needsUpdate = !0),
      o.view && o.view.getContext("2d").drawImage(a.canvas, 0, 0, 704, 464));
  }
  return (
    (w.test = () => {
      let _ = i.slice(),
        P = t,
        V = n,
        k = s,
        L = new Map(p.lines),
        z = p.state === "running" ? "ready" : p.state;
      ((p.state = "ready"),
        (l = null),
        b(),
        T(`10 POKE 1024,65
20 S=0:FOR I=1 TO 10:S=S+I:NEXT
30 POKE 49500,S`),
        p.run());
      for (let j = 0; j < 50; j++) p.tick();
      (A(jm), (u.pc = 49152), (u.sp = 255), u.push(255), u.push(253));
      let F = 0;
      for (; u.pc !== 65534 && F++ < 1e5;) u.step();
      let H = {
        screen0: i[Mn],
        basic_sum_1_10: i[49500],
        m6502_2plus3: i[49408],
        ok: i[49500] === 55 && i[49408] === 5,
      };
      (i.set(_), (t = P), (n = V), (s = k), p.lines.clear());
      for (let [j, K] of L) p.lines.set(j, K);
      return (
        p.compile(),
        (p.state = z === "input" ? "ready" : z),
        (l = null),
        (e = !0),
        M(),
        H
      );
    }),
    w
  );
}
var gi = { C: 40, H: 4, S: 17, B: 512 },
  Vc = gi.C * gi.H * gi.S,
  e1 = 1,
  T0 = Math.ceil((Vc * 2) / 512),
  ab = e1 + T0,
  lb = 64,
  cb = (lb * 32) / 512,
  t1 = ab + cb,
  Zs = Vc - t1 + 2,
  i1 = 65535,
  rb = 3600,
  n1 = class {
    constructor() {
      ((this.data = new Uint8Array(Vc * 512)),
        (this.cyl = 0),
        (this.timeMs = 0),
        (this.reads = 0),
        (this.writes = 0),
        (this.log = []),
        (this.cache = new Map()),
        (this.cacheOn = !0),
        (this.cacheMax = 64),
        (this.hits = 0),
        (this.misses = 0));
    }
    chs(e) {
      return {
        c: Math.floor(e / (gi.H * gi.S)),
        h: Math.floor(e / gi.S) % gi.H,
        s: (e % gi.S) + 1,
      };
    }
    mech(e, t) {
      let { c: n } = this.chs(e),
        s = Math.abs(n - this.cyl),
        r = s ? 2 + 0.6 * Math.sqrt(s) * 3 : 0,
        o = 6e4 / rb / 2,
        a = 6e4 / rb / gi.S;
      ((this.timeMs += r + o + a),
        (this.cyl = n),
        this.log.push({ lba: e, c: n, w: t }),
        this.log.length > 400 && this.log.splice(0, 200));
    }
    read(e) {
      if (this.cacheOn && this.cache.has(e)) {
        this.hits++;
        let n = this.cache.get(e);
        return (this.cache.delete(e), this.cache.set(e, n), n.slice());
      }
      (this.misses++, this.reads++, this.mech(e, !1));
      let t = this.data.slice(e * 512, e * 512 + 512);
      return (
        this.cacheOn &&
          (this.cache.set(e, t.slice()),
          this.cache.size > this.cacheMax &&
            this.cache.delete(this.cache.keys().next().value)),
        t
      );
    }
    write(e, t) {
      (this.writes++,
        this.mech(e, !0),
        this.data.set(t.subarray(0, 512), e * 512),
        this.cacheOn &&
          (this.cache.delete(e),
          this.cache.set(e, t.slice(0, 512)),
          this.cache.size > this.cacheMax &&
            this.cache.delete(this.cache.keys().next().value)));
    }
  },
  Ys = new TextEncoder(),
  Fc = new TextDecoder(),
  E0 = (i, e) => i[e] | (i[e + 1] << 8),
  _A = (i, e) => (i[e] | (i[e + 1] << 8) | (i[e + 2] << 16) | (i[e + 3] << 24)) >>> 0,
  rn = (i, e, t) => {
    ((i[e] = t & 255), (i[e + 1] = (t >> 8) & 255));
  },
  ob = (i, e, t) => {
    (rn(i, e, t & 65535), rn(i, e + 2, t >>> 16));
  },
  s1 = class {
    constructor(e) {
      this.d = e;
    }
    format(e = "LAB_DISK") {
      let t = new Uint8Array(512);
      for (let s = 0; s < t1 + 8; s++) this.d.write(s, t);
      let n = new Uint8Array(512);
      (n.set([235, 60, 144]),
        n.set(Ys.encode("MSDOS5.0"), 3),
        rn(n, 11, 512),
        (n[13] = 1),
        rn(n, 14, 1),
        (n[16] = 1),
        rn(n, 17, lb),
        rn(n, 19, Vc),
        (n[21] = 248),
        rn(n, 22, T0),
        rn(n, 24, gi.S),
        rn(n, 26, gi.H),
        n.set(Ys.encode(e.padEnd(11).slice(0, 11)), 43),
        n.set(Ys.encode("FAT16   "), 54),
        (n[510] = 85),
        (n[511] = 170),
        this.d.write(0, n),
        (this.fat = new Uint16Array(Zs)),
        (this.fat[0] = 65528),
        (this.fat[1] = i1),
        this.flushFat());
    }
    mount() {
      let e = this.d.read(0);
      return e[510] !== 85
        ? !1
        : ((this.label = Fc.decode(e.slice(43, 54)).trim()), this.loadFat(), !0);
    }
    loadFat() {
      this.fat = new Uint16Array(Zs);
      for (let e = 0; e < T0; e++) {
        let t = this.d.read(e1 + e);
        for (let n = 0; n < 256; n++) {
          let s = e * 256 + n;
          s < Zs && (this.fat[s] = E0(t, n * 2));
        }
      }
    }
    flushFat(e) {
      for (let t = 0; t < T0; t++) {
        if (e && !e.has(t)) continue;
        let n = new Uint8Array(512);
        for (let s = 0; s < 256; s++) {
          let r = t * 256 + s;
          r < Zs && rn(n, s * 2, this.fat[r]);
        }
        this.d.write(e1 + t, n);
      }
    }
    setFat(e, t) {
      ((this.fat[e] = t),
        (this._dirty || (this._dirty = new Set())).add(Math.floor(e / 256)));
    }
    commit() {
      this._dirty && (this.flushFat(this._dirty), (this._dirty = null));
    }
    alloc() {
      for (let e = 2; e < Zs; e++) if (!this.fat[e]) return (this.setFat(e, i1), e);
      throw new Error("Insufficient disk space");
    }
    chain(e) {
      let t = [];
      for (; e >= 2 && e < 65520 && t.length < Zs;) (t.push(e), (e = this.fat[e]));
      return t;
    }
    freeChain(e) {
      for (let t of this.chain(e)) this.setFat(t, 0);
    }
    lba(e) {
      return t1 + e - 2;
    }
    dirSectors(e) {
      return e === 0
        ? Array.from({ length: cb }, (t, n) => ab + n)
        : this.chain(e).map((t) => this.lba(t));
    }
    entries(e) {
      let t = [];
      for (let n of this.dirSectors(e)) {
        let s = this.d.read(n);
        for (let r = 0; r < 16; r++) {
          let o = r * 32;
          if (s[o] === 0) return t;
          s[o] !== 229 &&
            t.push({
              name: Fc.decode(s.slice(o, o + 8)).trim(),
              ext: Fc.decode(s.slice(o + 8, o + 11)).trim(),
              attr: s[o + 11],
              cl: E0(s, o + 26),
              size: _A(s, o + 28),
              date: E0(s, o + 24),
              time: E0(s, o + 22),
              lba: n,
              off: o,
            });
        }
      }
      return t;
    }
    writeEntry(e, t) {
      let n = this.dirSectors(e);
      for (let o of n) {
        let a = this.d.read(o);
        for (let l = 0; l < 16; l++) {
          let c = l * 32;
          if (a[c] === 0 || a[c] === 229) {
            (this.fillEnt(a, c, t), this.d.write(o, a));
            return;
          }
        }
      }
      if (e === 0) throw new Error("Root directory full");
      let s = this.alloc();
      this.setFat(n.length ? this.chain(e).at(-1) : e, s);
      let r = new Uint8Array(512);
      (this.fillEnt(r, 0, t), this.d.write(this.lba(s), r));
    }
    fillEnt(e, t, n) {
      (e.fill(0, t, t + 32),
        e.set(Ys.encode(n.name.padEnd(8).slice(0, 8)), t),
        e.set(Ys.encode((n.ext || "").padEnd(3).slice(0, 3)), t + 8),
        (e[t + 11] = n.attr || 32));
      let s = new Date();
      (rn(
        e,
        t + 22,
        (s.getHours() << 11) | (s.getMinutes() << 5) | (s.getSeconds() >> 1),
      ),
        rn(
          e,
          t + 24,
          ((s.getFullYear() - 1980) << 9) | ((s.getMonth() + 1) << 5) | s.getDate(),
        ),
        rn(e, t + 26, n.cl || 0),
        ob(e, t + 28, n.size || 0));
    }
    updateEntry(e, t) {
      let n = this.d.read(e.lba);
      (t.del && (n[e.off] = 229),
        t.cl !== void 0 && rn(n, e.off + 26, t.cl),
        t.size !== void 0 && ob(n, e.off + 28, t.size),
        t.name !== void 0 &&
          (n.set(Ys.encode(t.name.padEnd(8).slice(0, 8)), e.off),
          n.set(Ys.encode((t.ext || "").padEnd(3).slice(0, 3)), e.off + 8)),
        this.d.write(e.lba, n));
    }
    readFile(e) {
      let t = new Uint8Array(e.size),
        n = 0;
      for (let s of this.chain(e.cl)) {
        if (n >= e.size) break;
        let r = this.d.read(this.lba(s));
        (t.set(r.subarray(0, Math.min(512, e.size - n)), n), (n += 512));
      }
      return t;
    }
    writeData(e) {
      if (!e.length) return 0;
      let t = 0,
        n = 0;
      for (let s = 0; s < e.length; s += 512) {
        let r = this.alloc();
        (n ? this.setFat(n, r) : (t = r), (n = r));
        let o = new Uint8Array(512);
        (o.set(e.subarray(s, s + 512)), this.d.write(this.lba(r), o));
      }
      return t;
    }
    freeClusters() {
      let e = 0;
      for (let t = 2; t < Zs; t++) this.fat[t] || e++;
      return e;
    }
  },
  $m = (i) => {
    let [e, t = ""] = i.toUpperCase().split(".");
    return { name: e.slice(0, 8), ext: t.slice(0, 3) };
  },
  w0 = (i) => i.name + (i.ext ? "." + i.ext : ""),
  Nc = class {
    constructor() {
      ((this.disk = new n1()),
        (this.fs = new s1(this.disk)),
        this.fs.format(),
        (this.cwd = []),
        (this.cwdCl = 0),
        (this.out = (e) => {}),
        this.install());
    }
    install() {
      let e = (t, n) => this.writeFile(t, Ys.encode(n));
      (this.mkdir("DOS"),
        this.mkdir("GAMES"),
        this.mkdir("WORK"),
        e(
          "AUTOEXEC.BAT",
          `@ECHO OFF\r
PROMPT $P$G\r
PATH C:\\DOS\r
SMARTDRV\r
ECHO Welcome to the 1990s PC. Type HELP.\r
`,
        ),
        e(
          "CONFIG.SYS",
          `DEVICE=C:\\DOS\\HIMEM.SYS\r
DOS=HIGH,UMB\r
FILES=30\r
BUFFERS=20\r
`,
        ),
        e(
          "README.TXT",
          `This disk is a real FAT16-style volume: boot sector, FAT, root directory\r
and cluster chains live in 2,720 simulated 512-byte sectors.\r
Every command below reads and writes those sectors; watch the HDD head seek.\r
Try: DIR, TREE, TYPE README.TXT, ECHO hello > NOTE.TXT, COPY, DEL, CHKDSK, DISKMAP\r
`,
        ),
        e("DOS\\HIMEM.SYS", "XMS driver placeholder ".repeat(60)),
        e("DOS\\EDIT.HLP", "MS-DOS Editor help. ".repeat(120)),
        e(
          "GAMES\\DOOM.TXT",
          `id Software, 1993. Needs a 386 with 4 MB RAM, VGA mode 13h (320x200x256).\r
`,
        ),
        e(
          "WORK\\BUDGET.CSV",
          `item,cost\r
486DX2-66 CPU,450\r
8MB SIMMs,320\r
540MB IDE HDD,299\r
VGA PCI card,189\r
`,
        ),
        e(
          "HELLO.BAT",
          `@ECHO OFF\r
ECHO Hello from a batch file!\r
VER\r
DIR WORK\r
`,
        ),
        this.fs.commit());
    }
    resolve(e) {
      e = (e || "").toUpperCase().replace(/\//g, "\\").replace(/^C:/, "");
      let t = this.cwdCl,
        n = [...this.cwd];
      e.startsWith("\\") && ((t = 0), (n = []), (e = e.slice(1)));
      let s = e.split("\\").filter(Boolean),
        r = s.pop();
      for (let o of s) {
        let a = this.step(t, n, o);
        if (!a) throw new Error("Invalid directory");
        [t, n] = a;
      }
      return { cl: t, stack: n, last: r };
    }
    step(e, t, n) {
      if (n === ".") return [e, t];
      if (n === "..") {
        if (!t.length) return [0, []];
        let r = t.slice(0, -1);
        return [r.length ? r.at(-1).cl : 0, r];
      }
      let s = this.fs.entries(e).find((r) => w0(r) === n && r.attr & 16);
      return s ? [s.cl, [...t, { name: n, cl: s.cl }]] : null;
    }
    find(e, t) {
      return this.fs
        .entries(e)
        .find((n) => w0(n) === t.toUpperCase() && n.name !== "." && n.name !== "..");
    }
    mkdir(e) {
      let { cl: t, last: n } = this.resolve(e);
      if (this.find(t, n)) throw new Error("Directory already exists");
      let s = this.fs.alloc(),
        r = new Uint8Array(512);
      (this.fs.fillEnt(r, 0, { name: ".", attr: 16, cl: s }),
        this.fs.fillEnt(r, 32, { name: "..", attr: 16, cl: t }),
        this.fs.d.write(this.fs.lba(s), r),
        this.fs.writeEntry(t, { ...$m(n), attr: 16, cl: s }),
        this.fs.commit());
    }
    writeFile(e, t, n = !1) {
      let { cl: s, last: r } = this.resolve(e),
        o = this.find(s, r);
      if (o && o.attr & 16) throw new Error("Access denied");
      if (o) {
        let a = n ? this.fs.readFile(o) : new Uint8Array(0),
          l = new Uint8Array(a.length + t.length);
        (l.set(a), l.set(t, a.length), this.fs.freeChain(o.cl));
        let c = this.fs.writeData(l);
        this.fs.updateEntry(o, { cl: c, size: l.length });
      } else {
        let a = this.fs.writeData(t);
        this.fs.writeEntry(s, { ...$m(r), cl: a, size: t.length });
      }
      this.fs.commit();
    }
    readFile(e) {
      let { cl: t, last: n } = this.resolve(e),
        s = this.find(t, n);
      if (!s || s.attr & 16) throw new Error("File not found");
      return this.fs.readFile(s);
    }
    prompt() {
      return "C:\\" + this.cwd.map((e) => e.name).join("\\") + ">";
    }
    exec(e, t = 0) {
      let n = (l) =>
        this.out(
          l +
            `
`,
        );
      if (((e = e.trim()), !e)) return;
      e[0] === "@" && (e = e.slice(1));
      let s = null,
        r = e.match(/^(.*?)\s*(>>?)\s*(\S+)$/);
      r &&
        /^ECHO|^DIR|^TYPE|^VER|^MEM|^TREE/i.test(r[1]) &&
        ((s = { app: r[2] === ">>", file: r[3] }), (e = r[1]));
      let o = "",
        a = this.out;
      s && (this.out = (l) => (o += l));
      try {
        let [l, ...c] = e.split(/\s+/),
          h = l.toUpperCase(),
          d = e.slice(l.length).trim();
        switch (h) {
          case "HELP":
            n(`DIR CD MD RD TYPE COPY DEL REN ECHO [>|>> file] CLS VER MEM VOL CHKDSK TREE DISKMAP
HEXDUMP file  SMARTDRV [ON|OFF]  DIAL [number]  FORMAT C: /Y  DATE  TIME  file.BAT`);
            break;
          case "DIAL":
          case "ATDT":
            (n(
              "ATDT " +
                (d || "555-0199") +
                `
CARRIER 14400
PROTOCOL: LAP-M
CONNECT 14400/V.42bis
(simulated handshake: no real line is dialled)`,
            ),
              this.onEvent && this.onEvent("modem"));
            break;
          case "VER":
            n(`
MS-DOS-compatible Version 6.22 (Computer Evolution Lab)
`);
            break;
          case "CLS":
            this.cls && this.cls();
            break;
          case "ECHO":
            !d || /^(ON|OFF)$/i.test(d)
              ? /OFF/i.test(d)
                ? (this.echo = !1)
                : /ON/i.test(d) && (this.echo = !0)
              : n(d);
            break;
          case "PROMPT":
          case "PATH":
          case "REM":
            break;
          case "DATE":
            n("Current date is " + new Date().toDateString());
            break;
          case "TIME":
            n("Current time is " + new Date().toLocaleTimeString());
            break;
          case "VOL":
            n(
              " Volume in drive C is " +
                (this.fs.label || "LAB_DISK") +
                `
 Volume Serial Number is 1994-0486`,
            );
            break;
          case "MEM":
            n(`
Memory Type      Total   Used    Free
Conventional      640K    83K    557K
Upper              91K    45K     46K
Extended (XMS)  7,168K   512K  6,656K

Largest executable program size 557K (570,368 bytes)`);
            break;
          case "DIR": {
            let { cl: u, stack: f, last: p } = this.resolve(d || "."),
              x = u,
              g = f;
            if (p) {
              let b = this.step(u, f, p);
              b && ([x, g] = b);
            }
            n(` Volume in drive C is LAB_DISK
 Directory of C:\\${g.map((b) => b.name).join("\\")}
`);
            let m = 0,
              S = 0;
            for (let b of this.fs.entries(x)) {
              let y = `${String((b.date >> 5) & 15).padStart(2, "0")}-${String(b.date & 31).padStart(2, "0")}-${String(((b.date >> 9) + 1980) % 100).padStart(2, "0")}`;
              (n(
                `${b.name.padEnd(8)} ${b.ext.padEnd(3)} ${b.attr & 16 ? "<DIR>     " : String(b.size).padStart(10)} ${y}`,
              ),
                m++,
                (S += b.size));
            }
            n(`${String(m).padStart(9)} file(s) ${String(S).padStart(10)} bytes
${String(this.fs.freeClusters() * 512).padStart(29)} bytes free`);
            break;
          }
          case "CD":
          case "CHDIR": {
            if (!d) {
              n(this.prompt().slice(0, -1));
              break;
            }
            let u = this.resolve(d + "\\."),
              f = this.step(u.cl, u.stack, ".");
            ((this.cwdCl = f[0]), (this.cwd = f[1]));
            break;
          }
          case "MD":
          case "MKDIR":
            this.mkdir(d);
            break;
          case "RD":
          case "RMDIR": {
            let { cl: u, last: f } = this.resolve(d),
              p = this.find(u, f);
            if (!p || !(p.attr & 16)) throw new Error("Invalid path");
            if (this.fs.entries(p.cl).some((x) => x.name !== "." && x.name !== ".."))
              throw new Error("Directory not empty");
            (this.fs.freeChain(p.cl),
              this.fs.updateEntry(p, { del: !0 }),
              this.fs.commit());
            break;
          }
          case "TYPE":
            n(Fc.decode(this.readFile(d)).replace(/\r/g, ""));
            break;
          case "HEXDUMP": {
            let u = this.readFile(d);
            for (let f = 0; f < Math.min(u.length, 256); f += 16)
              n(
                f.toString(16).padStart(4, "0") +
                  "  " +
                  Array.from(u.slice(f, f + 16), (p) => p.toString(16).padStart(2, "0"))
                    .join(" ")
                    .padEnd(48) +
                  " " +
                  Array.from(u.slice(f, f + 16), (p) =>
                    p >= 32 && p < 127 ? String.fromCharCode(p) : ".",
                  ).join(""),
              );
            break;
          }
          case "COPY": {
            let [u, f] = c;
            if (!f) throw new Error("Required parameter missing");
            let p = f;
            try {
              let x = this.resolve(f + "\\.");
              this.step(x.cl, x.stack, ".") && (p = f + "\\" + this.resolve(u).last);
            } catch {}
            (this.writeFile(p, this.readFile(u)), n("        1 file(s) copied"));
            break;
          }
          case "DEL":
          case "ERASE": {
            let { cl: u, last: f } = this.resolve(d),
              p = f.includes("*")
                ? this.fs
                    .entries(u)
                    .filter(
                      (x) =>
                        !(x.attr & 16) &&
                        new RegExp(
                          "^" + f.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$",
                        ).test(w0(x)),
                    )
                : [this.find(u, f)].filter(Boolean);
            if (!p.length) throw new Error("File not found");
            for (let x of p)
              (this.fs.freeChain(x.cl), this.fs.updateEntry(x, { del: !0 }));
            this.fs.commit();
            break;
          }
          case "REN":
          case "RENAME": {
            let [u, f] = c,
              { cl: p, last: x } = this.resolve(u),
              g = this.find(p, x);
            if (!g) throw new Error("File not found");
            this.fs.updateEntry(g, $m(f));
            break;
          }
          case "TREE": {
            let u = (f, p) => {
              for (let x of this.fs.entries(f))
                x.attr & 16 &&
                  x.name !== "." &&
                  x.name !== ".." &&
                  (n(p + "└───" + w0(x)), u(x.cl, p + "    "));
            };
            (n("C:\\" + this.cwd.map((f) => f.name).join("\\")), u(this.cwdCl, ""));
            break;
          }
          case "CHKDSK": {
            let u = 0,
              f = 0,
              p = new Set(),
              x = (S) => {
                for (let b of this.fs.entries(S)) {
                  if (b.name === "." || b.name === "..") continue;
                  let y = this.fs.chain(b.cl);
                  for (let E of y) (p.has(E) && f++, p.add(E));
                  ((u += y.length),
                    !(b.attr & 16) && Math.ceil(b.size / 512) !== y.length && f++,
                    b.attr & 16 && x(b.cl));
                }
              };
            x(0);
            let g = 0;
            for (let S = 2; S < Zs; S++) this.fs.fat[S] && g++;
            let m = g - u;
            n(`
Volume LAB_DISK
${String(Vc * 512).padStart(12)} bytes total disk space (${gi.C} cyl × ${gi.H} heads × ${gi.S} sectors)
${String(u * 512).padStart(12)} bytes in ${p.size} allocated clusters
${String(this.fs.freeClusters() * 512).padStart(12)} bytes available on disk
${f ? f + " cross-linked/size errors found" : "No errors found."}${
              m
                ? `
${m} lost clusters`
                : ""
            }`);
            break;
          }
          case "DISKMAP": {
            let u = "";
            for (let f = 2; f < Math.min(Zs, 642); f++)
              ((u += this.fs.fat[f] ? (this.fs.fat[f] === i1 ? "E" : "#") : "."),
                (f - 1) % 64 === 0 &&
                  (u += `
`));
            n(
              `Cluster map (# used, E end-of-chain, . free):
` + u,
            );
            break;
          }
          case "SMARTDRV": {
            /OFF/i.test(d)
              ? ((this.disk.cacheOn = !1),
                this.disk.cache.clear(),
                n("SMARTDRV disk cache disabled"))
              : ((this.disk.cacheOn = !0),
                n(
                  `SMARTDRV: ${this.disk.cacheMax}-sector LRU cache ON. hits ${this.disk.hits}, misses ${this.disk.misses}`,
                ));
            break;
          }
          case "FORMAT": {
            if (!/\/Y/i.test(d)) {
              n("WARNING: ALL DATA ON DRIVE C: WILL BE LOST! Re-run as FORMAT C: /Y");
              break;
            }
            (this.fs.format(),
              (this.cwd = []),
              (this.cwdCl = 0),
              n(
                "Format complete. " + this.fs.freeClusters() * 512 + " bytes available.",
              ));
            break;
          }
          default: {
            let u = h;
            u.includes(".") || (u += ".BAT");
            let f;
            try {
              f = this.readFile(u);
            } catch {
              n("Bad command or file name");
              break;
            }
            if (!u.endsWith(".BAT")) {
              n("Cannot execute " + u + " (only .BAT scripts in this lab)");
              break;
            }
            if (t > 4) break;
            let p = this.echo;
            this.echo = !0;
            for (let x of Fc.decode(f).split(/\r?\n/))
              x.trim() &&
                (this.echo && x[0] !== "@" && n(this.prompt() + x), this.exec(x, t + 1));
            this.echo = p;
          }
        }
      } catch (l) {
        n(l.message);
      } finally {
        if (s) {
          this.out = a;
          try {
            this.writeFile(
              s.file,
              Ys.encode(
                o.replace(
                  /\n/g,
                  `\r
`,
                ),
              ),
              s.app,
            );
          } catch (l) {
            n(l.message);
          }
        }
      }
    }
  };
var Oc = (i, e, t, n) => (i.position.set(e, t, n), i),
  r1 = 80,
  A0 = 25;
function o1() {
  let i = new Nc();
  i.onEvent = (v) => {
    v === "modem" && hi("modem", { min: 3 });
  };
  let e = Array.from({ length: A0 }, () => " ".repeat(r1).split("")),
    t = 0,
    n = 0,
    s = "",
    r = !0,
    o = {},
    a,
    l,
    c = 0,
    h = 0,
    d = [],
    u,
    f,
    p = [],
    x = 0,
    g = 0,
    m = [],
    S = 0;
  function b() {
    ((n = 0),
      t++,
      t >= A0 && (e.shift(), e.push(" ".repeat(r1).split("")), (t = A0 - 1)));
  }
  function y(v) {
    for (let R of v) {
      if (
        R ===
        `
`
      ) {
        b();
        continue;
      }
      R !== "\r" && ((e[t][n++] = R), n >= r1 && b());
    }
    r = !0;
  }
  ((i.out = (v) => {
    (y(v),
      A.diag.pulse("cpu", "pci", "#c9b07a", 3),
      A.diag.pulse("pci", "vga", "#c9b07a", 3));
  }),
    (i.cls = () => {
      for (let v of e) v.fill(" ");
      ((t = n = 0), (r = !0));
    }));
  let E = () => y(i.prompt());
  function M(v) {
    let R = i.disk.timeMs,
      _ = i.disk.reads + i.disk.writes;
    (v.trim() && (m.push(v), (S = m.length)),
      i.exec(v),
      (g = i.disk.timeMs - R),
      (A._ios = i.disk.reads + i.disk.writes - _),
      v.trim() && y(""),
      E());
  }
  function T(v) {
    if ((A.diag.pulse("kbd", "cpu", "#ffd166", 3), v.key === "Enter")) {
      let R = s;
      ((s = ""), b(), M(R));
    } else if (v.key === "Backspace")
      s && ((s = s.slice(0, -1)), n--, (e[t][n] = " "), (r = !0));
    else if (v.key === "ArrowUp" || v.key === "ArrowDown") {
      S = Math.max(0, Math.min(m.length, S + (v.key === "ArrowUp" ? -1 : 1)));
      for (let R = 0; R < s.length; R++) (n--, (e[t][n] = " "));
      ((s = m[S] || ""), y(s));
    } else if (v.key.length === 1) ((s += v.key), y(v.key));
    else return;
    v.preventDefault();
  }
  let A = {
    id: "pc90",
    era: "1990s",
    short: "486/Pentium PC",
    sim: i,
    name: "1990s IBM-compatible PC (486DX2-66, PCI + ISA, VGA, IDE hard disk, DOS)",
    blurb:
      "The beige box that put a PC on every desk. A 486DX2-66 with 8 KB on-chip cache and a 256 KB L2 SRAM cache, 8 MB of 72-pin SIMMs, the new PCI bus for VGA next to legacy ISA for sound, and an IDE hard disk with spinning platters. The DOS shell below is backed by a real FAT16-style filesystem whose boot sector, FAT, directories and cluster chains live in simulated 512-byte sectors of a CHS-addressed disk; every access is timed (seek + 3600 RPM rotational latency) and replayed by the 3D head actuator. Try SMARTDRV OFF, then DIR.",
    diagram: {
      nodes: [
        {
          id: "kbd",
          label: `Keyboard
8042`,
          x: 0.1,
          y: 0.2,
          w: 0.15,
          color: "#ffd166",
        },
        {
          id: "cpu",
          label: `486DX2-66
L1 8 KB`,
          x: 0.35,
          y: 0.2,
          w: 0.2,
          color: "#c9b07a",
        },
        {
          id: "l2",
          label: `L2 SRAM
256 KB`,
          x: 0.6,
          y: 0.2,
          w: 0.16,
          color: "#ff8ab0",
        },
        {
          id: "ram",
          label: `8 MB SIMM
FPM DRAM`,
          x: 0.85,
          y: 0.2,
          w: 0.18,
          color: "#58c4ff",
        },
        {
          id: "pci",
          label: "Chipset / PCI 33 MHz",
          x: 0.5,
          y: 0.52,
          w: 0.5,
          h: 0.13,
          color: "#e6edf3",
        },
        {
          id: "vga",
          label: `VGA card
→ CRT`,
          x: 0.15,
          y: 0.82,
          w: 0.18,
          color: "#5fe08a",
        },
        {
          id: "ide",
          label: "IDE ctrl",
          x: 0.45,
          y: 0.82,
          w: 0.15,
          color: "#ffb347",
        },
        {
          id: "hdd",
          label: `HDD 3600rpm
CHS 40/4/17`,
          x: 0.72,
          y: 0.82,
          w: 0.22,
          color: "#ff7a1a",
        },
        {
          id: "isa",
          label: `ISA: Sound
Blaster`,
          x: 0.92,
          y: 0.55,
          w: 0.15,
          color: "#c08cff",
        },
      ],
      edges: [
        ["kbd", "cpu"],
        ["cpu", "l2", "cache"],
        ["l2", "ram"],
        ["cpu", "pci", "FSB"],
        ["pci", "vga"],
        ["pci", "ide"],
        ["ide", "hdd"],
        ["hdd", "ide"],
        ["pci", "isa"],
      ],
    },
    build(v) {
      let R = U.plastic(14208950, 0.55);
      (v.box(1.6, 0.03, 1.5, R, [0, 0.47, 0], {
        name: "Case lid",
        info: "Beige powder-coated steel lid — the defining colour of 1990s computing (it yellowed as the bromine flame retardant aged in UV).",
        shell: !0,
        explode: [0, 0.6, 0],
      }),
        v.box(0.03, 0.45, 1.5, R, [-0.8, 0.24, 0], {
          name: "Case side",
          info: "",
          shell: !0,
          explode: [-0.4, 0, 0],
        }),
        v.box(0.03, 0.45, 1.5, R, [0.8, 0.24, 0], {
          name: "Case side",
          info: "",
          shell: !0,
          explode: [0.4, 0, 0],
        }),
        v.box(1.6, 0.03, 1.5, U.metal(10132122), [0, 0.015, 0], {}));
      let _ = v.group([0, 0.24, 0.76], {
          name: "Front bezel",
          info: 'Turbo button (it actually slowed the PC to 8 MHz-era speed for old games), power and HDD activity LEDs, 3.5" floppy slot.',
        }),
        P = new B(chamferBox(1.62, 0.48, 0.045, 0.012, 2), R);
      (_.add(P),
        (u = new B(new te(0.03, 0.015, 0.01), U.led(16752672))),
        u.position.set(-0.6, -0.1, 0.025),
        _.add(u),
        (f = new B(new te(0.03, 0.015, 0.01), U.led(3211072))),
        f.position.set(-0.66, -0.1, 0.025),
        (f.material.emissiveIntensity = 2),
        _.add(f));
      let V = new B(chamferBox(0.055, 0.032, 0.022, 0.004, 1), U.plastic(0xc2ba9e, 0.42));
      V.position.set(-0.5, -0.1, 0.028);
      let rstBtn = new B(
        chamferBox(0.038, 0.026, 0.02, 0.004, 1),
        U.plastic(0xa8a088, 0.45),
      );
      rstBtn.position.set(-0.42, -0.1, 0.026);
      let keyLock = new B(new ke(0.018, 0.018, 0.016, 20), U.steel());
      keyLock.rotation.x = Math.PI / 2;
      keyLock.position.set(-0.73, 0.02, 0.024);
      _.add(V, rstBtn, keyLock);
      Nt(
        v,
        "66",
        0.095,
        0.048,
        [-0.62, 0.02, 0.026],
        { bg: "#091a0d", color: "#3eff68", font: "bold 52px monospace" },
        _,
      );
      let k = new B(new te(0.3, 0.018, 0.02), U.plastic(0x1b1d20, 0.6));
      k.position.set(0.4, 0.12, 0.024);
      let fpyEj = new B(new te(0.036, 0.016, 0.022), U.plastic(0x888478, 0.45));
      fpyEj.position.set(0.51, 0.092, 0.028);
      let L = new B(chamferBox(0.46, 0.105, 0.024, 0.004, 1), U.plastic(13616813, 0.46));
      L.position.set(0.4, -0.05, 0.024);
      let cdTray = new B(new te(0.42, 0.036, 0.016), U.plastic(0xc8c1ae, 0.45));
      cdTray.position.set(0.4, -0.035, 0.032);
      let cdEj = new B(new te(0.032, 0.014, 0.016), U.plastic(0x55524a, 0.45));
      cdEj.position.set(0.56, -0.08, 0.032);
      let cdLed = new B(new Mt(0.005, 10, 8), U.glow(0x52ff68, 0.9));
      cdLed.position.set(0.24, -0.08, 0.034);
      _.add(k, fpyEj, L, cdTray, cdEj, cdLed);
      let z = v.group([-0.2, 0.04, -0.15], {
        name: "Baby-AT motherboard",
        info: "Socket 3 486 board with an Intel/SiS chipset bridging the 33 MHz CPU bus to PCI, and an ISA bridge for legacy 8 MHz cards. BIOS in EPROM, CMOS settings kept alive by a coin/barrel battery.",
        explode: [0, -0.15, 0],
      });
      z.add(new B(new te(1, 0.015, 1.1), U.pcb(2059061)));
      let F = v.group(
        [0.15, 0.01, -0.25],
        {
          name: "Intel 486DX2-66 CPU",
          info: '1.2 million transistors, 5-stage integer pipeline, on-chip FPU and 8 KB unified write-through L1 cache. "DX2" = clock doubling: core at 66 MHz, bus at 33 MHz — the first mainstream CPU running faster than its bus.',
          explode: [0, 0.4, 0],
        },
        z,
      );
      (F.add(Oc(new B(new te(0.2, 0.025, 0.2), U.ceramic()), 0, 0.015, 0)),
        vn(v, 0.18, 0.18, 0.04, [0, 0.03, 0], { fins: 9 }, F),
        ni(v, 0.07, [0, 0.11, 0], { rot: [-Math.PI / 2, 0, 0] }, F));
      for (let be = 0; be < 8; be++)
        v.chip(
          0.04,
          0.1,
          [0.4 + (be % 4) * 0.06, 0.01, -0.35 + Math.floor(be / 4) * 0.13],
          be
            ? {}
            : {
                name: "L2 cache SRAM (256 KB)",
                info: "Fast asynchronous SRAM DIPs: a 2nd-level cache between the CPU and slow DRAM (70 ns). Hit rates of ~90% made it the biggest single speed-up of the era.",
              },
          z,
        );
      for (let be = 0; be < 2; be++) {
        let re = ps(
          v,
          [-0.35 + be * 0.07, 0.01, -0.3],
          {
            name: be ? void 0 : "72-pin SIMMs (2 × 4 MB FPM DRAM)",
            info: "Fast-Page-Mode DRAM, 70 ns, 32-bit wide per SIMM. Holds DOS, programs and SMARTDRV's disk cache.",
            len: 0.5,
            h: 0.12,
            chips: 8,
          },
          z,
        );
        re.rotation.y = Math.PI / 2;
      }
      (v.chip(
        0.12,
        0.12,
        [-0.1, 0.01, 0.05],
        {
          name: "Chipset (system controller)",
          info: "Memory controller + cache controller + PCI host bridge: arbitrates CPU, cache, DRAM and bus-master DMA.",
        },
        z,
      ),
        v.chip(
          0.05,
          0.12,
          [-0.35, 0.01, 0.3],
          {
            name: "BIOS EPROM",
            info: "Power-On Self Test, setup, and INT 10h/13h/16h services DOS calls for video, disk and keyboard.",
            text: "BIOS",
          },
          z,
        ),
        v.cyl(
          0.02,
          0.02,
          0.07,
          U.plastic(3039432),
          [-0.42, 0.04, 0.42],
          {
            name: "CMOS battery (3.6 V NiCd)",
            info: "Keeps the real-time clock and BIOS setup alive. These barrel cells famously leaked and ate motherboards.",
            rot: [0, 0, Math.PI / 2],
          },
          z,
        ));
      for (let be = 0; be < 4; be++)
        v.box(
          0.04,
          0.03,
          0.55,
          U.plastic(1710618),
          [-0.35 + be * 0.1, 0.025, 0.25 + 0.05],
          be
            ? {}
            : {
                name: "ISA slots (16-bit, 8 MHz)",
                info: "Industry Standard Architecture: the original IBM PC/AT bus, ~8 MB/s. Sound cards, modems, NICs. Configured by hand with IRQ/DMA jumpers.",
              },
          z,
        );
      for (let be = 0; be < 3; be++)
        v.box(
          0.03,
          0.03,
          0.4,
          U.plastic(15790314),
          [0.1 + be * 0.1, 0.025, 0.33],
          be
            ? {}
            : {
                name: "PCI slots (32-bit, 33 MHz)",
                info: "Peripheral Component Interconnect (1993): 132 MB/s, plug-and-play configuration space, bus mastering. VGA moved here for Windows graphics.",
              },
          z,
        );
      let H = Gs(
        v,
        0.4,
        0.2,
        [0.1, 0.04, 0.33],
        {
          name: "PCI VGA card (S3 Trio64-class)",
          info: "Text mode 80×25 with a 9×16 font from the card ROM, or graphics up to 1024×768×256. A RAMDAC converts pixels to analog RGB for the CRT. The monitor shows this machine's live text buffer.",
          pcb: 2054794,
        },
        z,
      );
      ((H.rotation.y = Math.PI / 2),
        H.add(Oc(new B(new te(0.1, 0.1, 0.02), U.chip()), 0, 0.12, 0.015)));
      let j = Gs(
        v,
        0.5,
        0.18,
        [-0.35, 0.04, 0.3],
        {
          name: "Sound Blaster 16 (ISA)",
          info: "FM synthesis (Yamaha OPL3) + 16-bit DAC via ISA DMA. SET BLASTER=A220 I5 D1 H5.",
          pcb: 2059061,
        },
        z,
      );
      j.rotation.y = Math.PI / 2;
      let K = v.group([0.45, 0.06, 0.25], {
        name: "IDE hard disk (lid off)",
        info: `CHS geometry ${gi.C} cylinders × ${gi.H} heads × ${gi.S} sectors × 512 B (a scaled-down 1.4 MB volume). Magnetic platters spin at 3600 RPM; a voice-coil actuator swings the heads to a cylinder. Average access ≈ seek + half a rotation (8.3 ms). The arm here replays the emulator's actual sector accesses.`,
        live: () => `cylinder ${i.disk.cyl}  reads ${i.disk.reads}  writes ${i.disk.writes}
simulated disk time ${i.disk.timeMs.toFixed(0)} ms
cache ${i.disk.cacheOn ? "ON" : "OFF"} hits ${i.disk.hits} misses ${i.disk.misses}`,
        explode: [0.3, 0.4, 0],
      });
      K.add(Oc(new B(new te(0.4, 0.06, 0.58), U.alu()), 0, 0.03, 0));
      for (let be = 0; be < 2; be++) {
        let re = new B(new ke(0.17, 0.17, 0.008, 48), U.metal(14212582, 0.08));
        (re.position.set(0, 0.07 + be * 0.025, 0.08), K.add(re), d.push(re));
      }
      let ue = new B(new ke(0.03, 0.03, 0.06, 16), U.steel());
      (ue.position.set(0, 0.09, 0.08),
        K.add(ue),
        (l = new ft()),
        l.position.set(0.15, 0.1, -0.18),
        K.add(l));
      let Me = new B(new te(0.02, 0.01, 0.26), U.steel());
      ((Me.position.z = 0.13), l.add(Me));
      let ee = new B(new te(0.02, 0.012, 0.02), U.plastic(546));
      ((ee.position.z = 0.26), l.add(ee));
      let X = new B(new ke(0.04, 0.04, 0.02, 20), U.copper());
      (l.add(X),
        v.onFrame((be) => d.forEach((re) => (re.rotation.y += be * 25))),
        Dt(
          v,
          [
            [0.25, 0.08, 0],
            [0.3, 0.2, 0.05],
            [0.45, 0.13, -0.05],
          ],
          0.01,
          9079434,
        ),
        v.box(0.4, 0.1, 0.5, U.metal(1911), [0.42, 0.34, 0.45], {
          name: '3.5" 1.44 MB floppy drive',
          info: "80 tracks × 2 sides × 18 sectors × 512 B, 300 RPM. Read at ~45 KB/s.",
          explode: [0.3, 0.2, 0.3],
        }),
        v.box(0.42, 0.12, 0.6, U.metal(2184), [0.42, 0.34, -0.15], {
          name: "CD-ROM drive (4×)",
          info: "650 MB on a pressed polycarbonate disc read by a 780 nm laser at 600 KB/s, via IDE (ATAPI).",
          explode: [0.3, 0.25, 0],
        }));
      let W = v.group([-0.55, 0.04, 0.4], {
        name: "AT power supply (200 W)",
        info: "Switch-mode supply: +5 V (logic), +12 V (motors), −5/−12 V (ISA, RS-232). AT boards used the infamous P8/P9 connectors — black wires together!",
        explode: [-0.3, 0.2, 0.3],
      });
      (W.add(Oc(new B(new te(0.4, 0.35, 0.5), U.metal(10132122)), 0, 0.175, 0)),
        ni(v, 0.12, [0, 0.18, -0.26], {}, W));
      a = buildMonitor3D(v, [0, 0.485, -0.08], {
        crt: true,
        w: 0.88,
        h: 0.62,
        res: [1440, 800],
        color: 0xd8d1bd,
        name: '14" VGA CRT monitor',
        info: "640×400 text mode at 70 Hz, 31.5 kHz horizontal scan. The tube is a vacuum bottle with an electron gun and phosphor stripes behind a shadow mask.",
        explode: [0, 0.6, 0],
      });
      buildSculptedKeyboard(v, [-0.08, 0, 1.12], {
        w: 1.22,
        d: 0.42,
        h: 0.056,
        bodyColor: 0xd6cfc0,
        keyColor: 0xe4dfd2,
        modColor: 0xb7b09e,
        accentColor: 0xb7b09e,
        legendColor: "#22252a",
        name: "IBM Model M-style keyboard",
        info: "Buckling-spring keys; scan codes go to the 8042 keyboard controller → IRQ1 → BIOS INT 9. Click the screen in the panel and type commands.",
      });
      buildCoiledCable(
        v,
        [
          [-0.3, 0.04, 0.9],
          [-0.52, 0.03, 0.82],
          [-0.72, 0.08, -0.65],
        ],
        0.018,
        0.0055,
        20,
        0xc8c0ae,
        {
          name: "Coiled AT / PS2 Keyboard Cord",
          info: "5-pin DIN / 6-pin Mini-DIN synchronous serial clock+data cable to the motherboard 8042 controller.",
        },
      );
      buildMouse3D(v, [0.76, 0, 1.12], {
        retro: true,
        color: 0xd6cfc0,
        btnColor: 0xb7b09e,
        padColor: 0x164e63,
        name: "2-Button Serial Ball Mouse (COM1)",
        info: "Rubber steel-core ball turns X/Y slotted optical quadrature wheels; sends 3-byte packets at 1200 baud over RS-232 IRQ4.",
      });
    },
    ui(v) {
      let R = q("canvas", {
        width: 720,
        height: 400,
        tabindex: 0,
        class: "plot",
        style: { cursor: "text" },
      });
      ((o.view = R),
        R.addEventListener("keydown", (P) => {
          (P.stopPropagation(), T(P));
        }),
        R.addEventListener("click", () => R.focus()),
        (o.stats = Pt([
          ["cyl", "head cylinder"],
          ["io", "sector I/O (last cmd)"],
          ["ms", "disk time (last cmd)"],
          ["hit", "SMARTDRV hit rate"],
          ["free", "free space"],
        ])));
      let _ = [
        "DIR",
        "TREE",
        "TYPE README.TXT",
        "ECHO Hi from 1994 > HI.TXT",
        "COPY HI.TXT WORK",
        "HELLO",
        "CHKDSK",
        "DISKMAP",
        "SMARTDRV OFF",
        "SMARTDRV ON",
        "MEM",
        "HEXDUMP CONFIG.SYS",
      ];
      (v.append(
        Ie(
          "VGA text mode — click and type DOS commands (↑ history)",
          R,
          q(
            "div",
            { class: "pal" },
            ..._.map((P) =>
              Fe(P, () => {
                for (let V of P) ((s += V), y(V));
                (T({ key: "Enter", preventDefault() {} }), R.focus());
              }),
            ),
          ),
        ),
        Ie(
          "IDE disk",
          o.stats,
          q(
            "div",
            { class: "small" },
            "Disk timing model: seek 2 ms + 1.8·√Δcyl ms, plus half a rotation (8.3 ms) and one sector transfer at 3600 RPM. With SMARTDRV off every directory read hits the platters; with it on, repeated reads come from the RAM cache.",
          ),
        ),
      ),
        y(`Starting MS-DOS...

`),
        i.exec("AUTOEXEC"),
        y(`
`),
        E());
    },
    enter() {
      (A._booted ||
        setTimeout(() => {
          !A._booted &&
            hi("spinup", { m: "pc90" }) &&
            ((A._booted = 1), hi("post", { m: "pc90" }));
        }, 300),
        setTimeout(() => o.view && o.view.focus({ preventScroll: !0 }), 50));
    },
    update(v) {
      let R = i.disk.log;
      for (R.length < x && (x = 0); x < R.length; x++) p.push(R[x]);
      if (
        (p.length > 60 && p.splice(0, p.length - 60),
        (A._seekT = (A._seekT || 0) - v),
        p.length && A._seekT <= 0)
      ) {
        let P = p.shift();
        ((c = P.c),
          (A._seekT = 0.045),
          (u.material.emissiveIntensity = 3),
          A.diag.pulse("ide", "hdd", P.w ? "#ff5f5f" : "#ffb347", 5),
          A.diag.pulse("pci", "ide", "#ffb347", 5));
      } else
        p.length ||
          (u.material.emissiveIntensity = Math.max(
            0.05,
            u.material.emissiveIntensity - v * 10,
          ));
      ((h += (c - h) * Math.min(1, v * 25)),
        (l.rotation.y = -0.15 - (h / gi.C) * 0.75),
        (r || Math.floor(performance.now() / 400) !== A._bl) &&
          ((A._bl = Math.floor(performance.now() / 400)), w(), (r = !1)),
        o.stats.set("cyl", Math.round(h) + " / " + gi.C),
        o.stats.set("io", A._ios ?? 0),
        o.stats.set("ms", g.toFixed(1) + " ms"));
      let _ = i.disk;
      (o.stats.set(
        "hit",
        _.hits + _.misses ? Math.round((_.hits / (_.hits + _.misses)) * 100) + "%" : "–",
      ),
        o.stats.set("free", (i.fs.freeClusters() / 2).toFixed(0) + " KB"));
    },
  };
  function w() {
    let v = a.ctx;
    (v.save(),
      v.scale(2, 2),
      (v.fillStyle = "#040608"),
      v.fillRect(0, 0, 720, 400),
      (v.fillStyle = "#b8c0c8"),
      (v.font = 'bold 15px "Courier New",monospace'),
      (v.textBaseline = "top"));
    for (let R = 0; R < A0; R++) v.fillText(e[R].join(""), 0, R * 16);
    (A._bl % 2 && ((v.fillStyle = "#d8e0e8"), v.fillRect(n * 9, t * 16 + 13, 9, 2)),
      v.restore(),
      (a.tex.needsUpdate = !0),
      o.view && o.view.getContext("2d").drawImage(a.canvas, 0, 0, 720, 400));
  }
  return (
    (A.test = () => {
      let v = new Nc(),
        R = "";
      ((v.out = (P) => (R += P)),
        v.exec("ECHO 2+3=5 > T.TXT"),
        v.exec("COPY T.TXT WORK"),
        (R = ""),
        v.exec("TYPE WORK\\T.TXT"));
      let _ = R.trim();
      return (
        (R = ""),
        v.exec("CHKDSK"),
        {
          roundtrip: _,
          chkdsk_ok: /No errors/.test(R),
          sectors_written: v.disk.writes,
          ok: _ === "2+3=5" && /No errors/.test(R),
        }
      );
    }),
    A
  );
}
function Ya(i) {
  let e = [],
    t = {},
    n = [];
  i.split(
    `
`,
  ).forEach((o, a) => {
    let l = o.replace(/[#;].*/, "").trim();
    if (!l) return;
    let c = l.match(/^(\w+):\s*(.*)$/);
    if (c && ((t[c[1]] = e.length), (l = c[2].trim()), !l)) return;
    let [h, ...d] = l.split(/\s+/),
      u = d
        .join(" ")
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
    e.push({ op: h.toLowerCase(), args: u, line: a + 1, src: l });
  });
  let s = (o, a) => {
      let l = /^r(\d+)$/i.exec(o || "");
      return !l || +l[1] > 15 ? (n.push(`line ${a}: bad register "${o}"`), 0) : +l[1];
    },
    r = (o, a) =>
      /^-?(0x[0-9a-f]+|\d+)$/i.test(o)
        ? Number(o)
        : (n.push(`line ${a}: bad number "${o}"`), 0);
  for (let o of e) {
    let a = o.args,
      l = o.line;
    switch (o.op) {
      case "li":
        ((o.d = s(a[0], l)), (o.imm = r(a[1], l)));
        break;
      case "add":
      case "sub":
      case "mul":
      case "and":
      case "or":
      case "xor":
      case "slt":
      case "rem":
        ((o.d = s(a[0], l)), (o.s = s(a[1], l)), (o.t = s(a[2], l)));
        break;
      case "addi":
      case "shli":
      case "shri":
      case "andi":
      case "muli":
        ((o.d = s(a[0], l)), (o.s = s(a[1], l)), (o.imm = r(a[2], l)));
        break;
      case "ld":
      case "st": {
        o[o.op === "ld" ? "d" : "t"] = s(a[0], l);
        let c = /^(-?\w*)\((r\d+)\)$/i.exec(a[1] || "");
        if (!c) {
          n.push(`line ${l}: expected imm(rX)`);
          break;
        }
        ((o.imm = c[1] ? r(c[1], l) : 0), (o.s = s(c[2], l)));
        break;
      }
      case "beq":
      case "bne":
      case "blt":
      case "bge":
        ((o.s = s(a[0], l)), (o.t = s(a[1], l)), (o.target = a[2]));
        break;
      case "j":
        o.target = a[0];
        break;
      case "halt":
      case "nop":
        break;
      default:
        n.push(`line ${l}: unknown op "${o.op}"`);
    }
    o.target !== void 0 &&
      (o.target in t || n.push(`line ${l}: unknown label "${o.target}"`),
      (o.tpc = t[o.target]));
  }
  return { ins: e, labels: t, errors: n };
}
var R0 = class {
    constructor(e, t, n) {
      ((this.ways = t),
        (this.line = n),
        (this.sets = Math.max(1, Math.round((e * 1024) / n / t))),
        (this.tags = new Float64Array(this.sets * t).fill(-1)),
        (this.lru = new Uint32Array(this.sets * t)),
        (this.dirty = new Uint8Array(this.sets * t)),
        (this.t = 0),
        (this.hits = 0),
        (this.misses = 0),
        (this.flash = new Float32Array(this.sets * t)),
        (this.flashHit = new Uint8Array(this.sets * t)),
        (this.writebacks = 0));
    }
    access(e, t) {
      let n = Math.floor(e / this.line),
        s = n % this.sets,
        r = Math.floor(n / this.sets),
        o = s * this.ways;
      this.t++;
      for (let l = 0; l < this.ways; l++)
        if (this.tags[o + l] === r)
          return (
            (this.lru[o + l] = this.t),
            this.hits++,
            t && (this.dirty[o + l] = 1),
            (this.flash[o + l] = 1),
            (this.flashHit[o + l] = 1),
            !0
          );
      let a = 0;
      for (let l = 1; l < this.ways; l++) this.lru[o + l] < this.lru[o + a] && (a = l);
      return (
        this.dirty[o + a] && this.tags[o + a] >= 0 && this.writebacks++,
        (this.tags[o + a] = r),
        (this.lru[o + a] = this.t),
        (this.dirty[o + a] = t ? 1 : 0),
        this.misses++,
        (this.flash[o + a] = 1),
        (this.flashHit[o + a] = 0),
        !1
      );
    }
  },
  a1 = class {
    constructor(e, t = 10) {
      ((this.kind = e),
        (this.n = 1 << t),
        (this.mask = this.n - 1),
        (this.tab = new Uint8Array(this.n).fill(e === "1bit" ? 0 : 1)),
        (this.hist = 0),
        (this.hbits = t),
        (this.correct = 0),
        (this.total = 0));
    }
    predict(e, t) {
      switch (this.kind) {
        case "nottaken":
          return !1;
        case "btfn":
          return t <= e;
        case "1bit":
          return this.tab[e & this.mask] === 1;
        case "2bit":
          return this.tab[e & this.mask] >= 2;
        case "gshare":
          return this.tab[(e ^ this.hist) & this.mask] >= 2;
      }
    }
    update(e, t, n) {
      if ((this.total++, n === t && this.correct++, this.kind === "1bit"))
        this.tab[e & this.mask] = t ? 1 : 0;
      else if (this.kind === "2bit" || this.kind === "gshare") {
        let s = this.kind === "gshare" ? (e ^ this.hist) & this.mask : e & this.mask;
        this.tab[s] = t ? Math.min(3, this.tab[s] + 1) : Math.max(0, this.tab[s] - 1);
      }
      this.hist = ((this.hist << 1) | (t ? 1 : 0)) & this.mask;
    }
  },
  Ro = {
    "Pentium 4 Northwood 3.06 GHz": {
      ghz: 3.06,
      depth: 20,
      l1: [8, 4, 64],
      l1lat: 2,
      l2: [512, 8, 64],
      l2lat: 18,
      memNs: 115,
      pred: "gshare",
      note: "NetBurst: very deep pipeline for high clocks; memory through the northbridge (FSB 533).",
    },
    "Athlon 64 3200+ 2.2 GHz": {
      ghz: 2.2,
      depth: 12,
      l1: [64, 2, 64],
      l1lat: 3,
      l2: [1024, 16, 64],
      l2lat: 12,
      memNs: 60,
      pred: "gshare",
      note: "K8: shorter pipeline, big L1, and the memory controller moved onto the CPU die.",
    },
    "Pentium III 1 GHz (for contrast)": {
      ghz: 1,
      depth: 10,
      l1: [16, 4, 32],
      l1lat: 3,
      l2: [256, 8, 32],
      l2lat: 7,
      memNs: 120,
      pred: "2bit",
      note: "P6 core: 10-stage pipeline, 133 MHz SDRAM.",
    },
  },
  Ao = class {
    constructor(e) {
      this.configure(e);
    }
    configure(e) {
      this.cfg = { ...e };
      let t = this.cfg;
      ((this.L1 = new R0(...t.l1)),
        (this.L2 = new R0(...t.l2)),
        (this.bp = new a1(t.pred, t.bpBits || 10)),
        (this.memLat = Math.round(t.memNs * t.ghz)),
        (this.cycles = 0),
        (this.instr = 0),
        (this.stall = { branch: 0, mem: 0, hazard: 0 }),
        (this.recent = []),
        (this.events = []),
        (this.loads = 0),
        (this.stores = 0),
        (this.l2acc = 0),
        (this.memAcc = 0));
    }
    load(e) {
      ((this.prog = e), this.restart());
    }
    restart() {
      ((this.R = new Int32Array(16)),
        (this.mem = new Map()),
        (this.pc = 0),
        (this.lastLoad = -1),
        (this.lastLoadReg = -1),
        (this.done = !1),
        (this.runs = (this.runs || 0) + 1));
    }
    memAccess(e, t) {
      return this.L1.access(e, t)
        ? this.cfg.l1lat
        : (this.l2acc++,
          this.events.push("l2"),
          this.L2.access(e, t)
            ? this.cfg.l1lat + this.cfg.l2lat
            : (this.memAcc++,
              this.events.push("mem"),
              this.cfg.l1lat + this.cfg.l2lat + this.memLat));
    }
    step() {
      let e = this.prog.ins;
      if (this.pc >= e.length || this.pc < 0) return ((this.done = !0), null);
      let t = e[this.pc],
        n = this.R,
        s = this.cycles,
        r = 0,
        o = null,
        a = this.pc + 1,
        l = "",
        c = [t.s, t.t].filter((h) => h !== void 0);
      switch (
        (this.lastLoad === this.instr - 1 &&
          c.includes(this.lastLoadReg) &&
          this.lastLoadReg !== 0 &&
          ((r += this.cfg.l1lat - 1),
          (this.stall.hazard += this.cfg.l1lat - 1),
          (o = "hazard")),
        t.op)
      ) {
        case "li":
          n[t.d] = t.imm;
          break;
        case "add":
          n[t.d] = n[t.s] + n[t.t];
          break;
        case "sub":
          n[t.d] = n[t.s] - n[t.t];
          break;
        case "mul":
          ((n[t.d] = Math.imul(n[t.s], n[t.t])), (r += 3));
          break;
        case "and":
          n[t.d] = n[t.s] & n[t.t];
          break;
        case "or":
          n[t.d] = n[t.s] | n[t.t];
          break;
        case "xor":
          n[t.d] = n[t.s] ^ n[t.t];
          break;
        case "slt":
          n[t.d] = n[t.s] < n[t.t] ? 1 : 0;
          break;
        case "rem":
          ((n[t.d] = n[t.t] ? n[t.s] % n[t.t] : 0), (r += 20));
          break;
        case "addi":
          n[t.d] = n[t.s] + t.imm;
          break;
        case "shli":
          n[t.d] = n[t.s] << t.imm;
          break;
        case "shri":
          n[t.d] = n[t.s] >>> t.imm;
          break;
        case "andi":
          n[t.d] = n[t.s] & t.imm;
          break;
        case "muli":
          ((n[t.d] = Math.imul(n[t.s], t.imm)), (r += 3));
          break;
        case "ld": {
          let h = (n[t.s] + t.imm) >>> 0,
            d = this.memAccess(h, !1);
          if ((this.loads++, (n[t.d] = this.mem.get(h) || 0), d > this.cfg.l1lat)) {
            let u = d - this.cfg.l1lat;
            ((r += u),
              (this.stall.mem += u),
              (o = "mem"),
              (l = d > this.cfg.l1lat + this.cfg.l2lat ? "DRAM" : "L2"));
          }
          ((this.lastLoad = this.instr), (this.lastLoadReg = t.d), (this.lastAddr = h));
          break;
        }
        case "st": {
          let h = (n[t.s] + t.imm) >>> 0;
          (this.memAccess(h, !0),
            this.stores++,
            this.mem.set(h, n[t.t]),
            (this.lastAddr = h));
          break;
        }
        case "beq":
        case "bne":
        case "blt":
        case "bge":
        case "j": {
          let h =
            t.op === "j"
              ? !0
              : t.op === "beq"
                ? n[t.s] === n[t.t]
                : t.op === "bne"
                  ? n[t.s] !== n[t.t]
                  : t.op === "blt"
                    ? n[t.s] < n[t.t]
                    : n[t.s] >= n[t.t];
          if (t.op !== "j") {
            let d = this.bp.predict(this.pc, t.tpc);
            if ((this.bp.update(this.pc, h, d), d !== h)) {
              let u = this.cfg.depth - 1;
              ((r += u),
                (this.stall.branch += u),
                (o = "branch"),
                (l = "mispredict"),
                this.events.push("flush"));
            }
          }
          h && (a = t.tpc);
          break;
        }
        case "halt":
          this.done = !0;
          break;
      }
      return (
        (n[0] = 0),
        (this.cycles += 1 + r),
        this.instr++,
        this.recent.push({
          pc: this.pc,
          src: t.src,
          issue: s,
          stall: r,
          kind: o,
          note: l,
        }),
        this.recent.length > 16 && this.recent.shift(),
        (this.pc = a),
        t
      );
    }
    run(e) {
      for (let t = 0; t < e; t++) (this.done && this.restart(), this.step());
    }
    get ipc() {
      return this.cycles ? this.instr / this.cycles : 0;
    }
  },
  Ks = {
    "Sequential array sum (great locality)": `# sum = A[0] + A[1] + ... over N ints (4 bytes each)
li r1, 0          # i
li r2, 4096       # N
li r3, 0x100000   # &A[0]
li r4, 0          # sum
loop:
  shli r5, r1, 2      # offset = i*4
  add  r5, r5, r3
  ld   r6, 0(r5)      # A[i]   (16 ints share a 64-byte line)
  add  r4, r4, r6     # load-use: waits for L1
  addi r1, r1, 1
  blt  r1, r2, loop   # predictable loop branch
halt`,
    "Strided walk (column-major matrix)": `# walk a 512x512 int matrix by COLUMN: stride = 2048 bytes
# every access touches a new cache line -> L1 misses
li r1, 0          # row
li r2, 512
li r3, 0x400000   # &M[0][0]
li r7, 0          # column
li r4, 0
col:
  li r1, 0
row:
  shli r5, r1, 11     # row * 2048 bytes
  shli r8, r7, 2
  add  r5, r5, r8
  add  r5, r5, r3
  ld   r6, 0(r5)
  add  r4, r4, r6
  addi r1, r1, 1
  blt  r1, r2, row
  addi r7, r7, 1
  blt  r7, r2, col
halt`,
    "Pointer chasing / random access": `# pseudo-random addresses over 8 MB (LCG) -> misses all the way to DDR
li r1, 12345      # seed
li r2, 0
li r3, 20000
li r9, 0x7FFFC0   # mask: 8 MB, 64B-aligned
loop:
  muli r1, r1, 1103515245
  addi r1, r1, 12345
  and  r5, r1, r9
  ld   r6, 0(r5)
  add  r4, r4, r6
  addi r2, r2, 1
  blt  r2, r3, loop
halt`,
    "Unpredictable branches (random data)": `# if (rand & 1) taken else not: 50/50 branches defeat every predictor
li r1, 777
li r2, 0
li r3, 20000
loop:
  muli r1, r1, 1103515245
  addi r1, r1, 12345
  shri r5, r1, 16
  andi r5, r5, 1
  beq  r5, r0, skip      # coin-flip branch
  addi r4, r4, 1
skip:
  addi r2, r2, 1
  blt  r2, r3, loop
halt`,
    "Patterned branches (gshare learns T,T,N)": `# branch taken twice then not-taken: history-based predictors learn it
li r2, 0
li r3, 30000
li r6, 3
loop:
  rem  r5, r2, r6
  beq  r5, r0, skip      # pattern N,T,T? depends on i mod 3
  addi r4, r4, 1
skip:
  addi r2, r2, 1
  blt  r2, r3, loop
halt`,
  };
var Bc = (i, e, t, n) => (i.position.set(e, t, n), i);
function l1() {
  let i = Object.keys(Ro),
    e = { ...Ro[i[0]], bpBits: 10 },
    t = new Ao(e),
    n = Ya(Ks[Object.keys(Ks)[0]]);
  t.load(n);
  let s = 400,
    r = {},
    o = !0,
    a,
    l,
    c = [],
    h,
    d = {
      id: "pc00",
      era: "2000s",
      short: "Pentium 4 / Athlon 64",
      sim: t,
      name: "2000s PC: Pentium 4 vs Athlon 64 — pipelines, caches, branch prediction",
      blurb:
        "The gigahertz war. Intel's Pentium 4 used a 20-stage pipeline to hit 3 GHz; AMD's Athlon 64 used a shorter pipeline, a big L1 and an on-die memory controller. Clock speed alone does not decide speed: every cache miss and branch mispredict costs cycles. This is a working timing simulator: your workload program is executed for real, every load/store goes through set-associative LRU L1/L2 caches, every branch through a predictor, and stalls are counted. Edit the code or the microarchitecture and watch IPC and nanoseconds-per-instruction change.",
      diagram: {
        nodes: [
          {
            id: "fe",
            label: `Fetch/Decode
(trace cache)`,
            x: 0.12,
            y: 0.2,
            w: 0.2,
            color: "#7ab0ff",
          },
          {
            id: "bp",
            label: `Branch
predictor`,
            x: 0.12,
            y: 0.75,
            w: 0.18,
            color: "#c08cff",
          },
          {
            id: "ex",
            label: `Execute
ALU/AGU`,
            x: 0.37,
            y: 0.2,
            w: 0.17,
            color: "#ff7a1a",
          },
          {
            id: "l1",
            label: "L1 D-cache",
            x: 0.37,
            y: 0.75,
            w: 0.17,
            color: "#5fe08a",
          },
          {
            id: "l2",
            label: "L2 cache",
            x: 0.6,
            y: 0.75,
            w: 0.15,
            color: "#ffd166",
          },
          {
            id: "nb",
            label: `Northbridge
/ IMC`,
            x: 0.6,
            y: 0.2,
            w: 0.18,
            color: "#e6edf3",
          },
          {
            id: "ddr",
            label: `DDR-400
SDRAM`,
            x: 0.86,
            y: 0.2,
            w: 0.18,
            color: "#58c4ff",
          },
          {
            id: "agp",
            label: "AGP 8× GPU",
            x: 0.86,
            y: 0.75,
            w: 0.18,
            color: "#ff5f5f",
          },
        ],
        edges: [
          ["fe", "ex"],
          ["bp", "fe"],
          ["ex", "fe", "flush"],
          ["ex", "l1"],
          ["l1", "l2", "miss"],
          ["l2", "nb", "FSB"],
          ["nb", "ddr"],
          ["nb", "agp"],
        ],
      },
      build(b) {
        let y = U.metal(12633288, 0.35),
          E = U.plastic(1908514, 0.5);
        (b.box(0.03, 1.8, 1.8, U.glass(11195647, 0.18), [0.45, 0.9, 0], {
          name: "Side window panel",
          info: "Acrylic side window — the case-modding craze of the early 2000s (cold-cathode lights optional).",
          shell: !0,
          explode: [0.6, 0, 0],
        }),
          b.box(0.9, 1.8, 0.03, y, [0, 0.9, -0.9], {
            name: "Rear I/O & case",
            info: "ATX: PS/2, USB 2.0, serial, parallel, VGA on the GPU bracket.",
            shell: !0,
            explode: [0, 0, -0.4],
          }),
          b.box(0.9, 0.03, 1.8, y, [0, 1.8, 0], {
            name: "Top",
            info: "",
            shell: !0,
            explode: [0, 0.4, 0],
          }),
          b.box(0.03, 1.8, 1.8, y, [-0.45, 0.9, 0], {}),
          b.box(0.9, 0.03, 1.8, y, [0, 0.015, 0], {}),
          b.box(0.92, 1.82, 0.06, E, [0, 0.9, 0.92], {
            name: "Front bezel",
            info: "Optical drive bays, USB front ports, power/HDD LEDs.",
          }));
        let M = b.group([-0.42, 0.95, 0], {
          rot: [0, 0, -Math.PI / 2],
          name: "ATX motherboard",
          info: 'Northbridge ("memory controller hub") links CPU, RAM and AGP; southbridge handles IDE/SATA, USB, audio, PCI. Athlon 64 moved the memory controller into the CPU, cutting DRAM latency by ~40%.',
          explode: [-0.2, 0, 0],
        });
        M.add(Bc(new B(new te(1.5, 0.015, 1.3), U.pcb(2051983)), 0, 0, 0));
        let T = b.group(
          [-0.35, 0.01, -0.3],
          {
            name: "CPU + heatsink/fan",
            info: "Socket 478 / 754. The simulator models this core: configurable pipeline depth, L1/L2 geometry, branch predictor and memory latency.",
            live: () => `IPC ${t.ipc.toFixed(3)}  @ ${e.ghz} GHz → ${(t.ipc * e.ghz).toFixed(2)} G instr/s
pipeline ${e.depth} stages, mispredict penalty ${e.depth - 1} cycles`,
            explode: [0, 0.5, 0],
          },
          M,
        );
        (T.add(Bc(new B(new te(0.22, 0.03, 0.22), U.plastic(14735552)), 0, 0.015, 0)),
          T.add(Bc(new B(new te(0.12, 0.01, 0.12), U.metal(11580600, 0.2)), 0, 0.035, 0)),
          vn(
            b,
            0.34,
            0.3,
            0.16,
            [0, 0.04, 0],
            {
              fins: 18,
              name: "Heatsink",
              info: "Aluminium fins on a copper core; Prescott P4s dissipated ~100 W.",
            },
            T,
          ),
          (a = ni(b, 0.13, [0, 0.24, 0], { rot: [-Math.PI / 2, 0, 0], speed: 20 }, T)));
        let A = b.group(
          [-0, 0.01, -0.05],
          {
            name: "Northbridge (MCH)",
            info: "Memory Controller Hub: front-side bus (quad-pumped 533/800 MT/s on P4), dual-channel DDR controller, AGP port. Glows here on every DRAM access.",
          },
          M,
        );
        (A.add(Bc(new B(new te(0.12, 0.02, 0.12), U.chip()), 0, 0.01, 0)),
          vn(b, 0.12, 0.12, 0.05, [0, 0.02, 0], { fins: 8, base: U.alu() }, A),
          (l = new B(new te(0.13, 0.005, 0.13), U.led(5817599))),
          (l.position.y = 0.002),
          A.add(l),
          b.chip(
            0.1,
            0.1,
            [0.3, 0.01, 0.25],
            {
              name: "Southbridge (ICH5)",
              info: "I/O Controller Hub: 2× SATA 150, 2× IDE, 8× USB 2.0, AC'97 audio, PCI bus, LPC to the BIOS flash.",
            },
            M,
          ));
        for (let P = 0; P < 2; P++) {
          let V = ps(
            b,
            [0.1 + P * 0.08, 0.01, -0.35],
            {
              name: P ? void 0 : "DDR-400 DIMMs (dual channel)",
              info: "Double Data Rate SDRAM: transfers on both clock edges, 3.2 GB/s per channel. CAS latency ~2.5 cycles, but a full random access through the northbridge still costs ~100 ns — hundreds of CPU cycles.",
              len: 0.6,
              h: 0.14,
              chips: 8,
              double: !0,
              pcb: 1923626,
            },
            M,
          );
          ((V.rotation.y = Math.PI / 2), c.push(V));
        }
        b.box(
          0.5,
          0.03,
          0.04,
          U.plastic(7027226),
          [-0.05, 0.025, 0.12],
          {
            name: "AGP 8× slot",
            info: "Accelerated Graphics Port: a dedicated 66 MHz, 32-bit point-to-point port at 8 transfers/clock = 2.1 GB/s, with sideband addressing. Replaced by PCI Express ×16 in 2004.",
          },
          M,
        );
        for (let P = 0; P < 3; P++)
          b.box(
            0.45,
            0.03,
            0.03,
            U.plastic(15790314),
            [0, 0.025, 0.35 + P * 0.12],
            {},
            M,
          );
        let w = Gs(
          b,
          0.6,
          0.22,
          [-0.05, 0.04, 0.12],
          {
            name: "AGP graphics card (Radeon 9700-class)",
            info: "First fully DirectX 9 GPU (2002): 8 pixel pipelines, 4 vertex shaders, 128 MB DDR on a 256-bit bus, programmable floating-point shaders. ATI red PCB.",
            pcb: 11542046,
          },
          M,
        );
        ((h = ni(b, 0.06, [0.05, 0.13, 0.02], { speed: 30 }, w)),
          b.cyl(
            0.03,
            0.03,
            0.006,
            U.metal(13684944),
            [0.45, 0.01, -0.3],
            {
              name: "CMOS battery (CR2032)",
              info: "Lithium coin cell for the RTC/CMOS.",
            },
            M,
          ),
          b.box(0.42, 0.11, 0.7, U.plastic(1710618), [0.05, 1.5, 0.5], {
            name: "DVD-RW drive",
            info: "4.7 GB discs, 650 nm laser; ATAPI over IDE or SATA.",
            explode: [0.3, 0.2, 0.3],
          }));
        let v = b.box(0.4, 0.08, 0.55, U.alu(), [0.05, 0.55, 0.55], {
            name: "7200 RPM SATA hard disk",
            info: "Perpendicular recording arrived 2005; ~60 MB/s sequential but ~8.5 ms random access, i.e. ~25 million CPU cycles per seek.",
            explode: [0.3, 0, 0.3],
          }),
          R = b.group([0.05, 1.6, -0.6], {
            name: "ATX power supply (400 W)",
            info: '+12 V rail now feeds the CPU through a VRM (ATX12V "P4 connector", 2000) instead of +5 V.',
            explode: [0.3, 0.3, -0.3],
          });
        (R.add(Bc(new B(new te(0.6, 0.3, 0.55), U.metal(2763310)), 0, 0, 0)),
          ni(b, 0.1, [0, -0.16, 0], { rot: [Math.PI / 2, 0, 0] }, R),
          ni(b, 0.1, [-0.05, 1.1, -0.89], { name: "Rear exhaust fan" }));
        let _ = new Pn(0x5bb8ff, 3.4, 3.2, 1.4);
        (_.position.set(0.22, 1.15, 0.15), b.root.add(_));
        let ccfl = new B(new ke(0.01, 0.01, 1.45, 12), U.glow(0x4cb8ff, 2.2));
        ccfl.position.set(0.39, 0.9, 0.82);
        b.root.add(ccfl);
        let pwrBtn00 = new B(new ke(0.032, 0.032, 0.018, 24), U.metal(0xd8dde4, 0.25));
        pwrBtn00.rotation.x = Math.PI / 2;
        pwrBtn00.position.set(0, 1.05, 0.955);
        let pwrRing00 = new B(new Pi(0.036, 0.004, 10, 28), U.glow(0x38bdf8, 1.8));
        pwrRing00.position.set(0, 1.05, 0.956);
        b.root.add(pwrBtn00, pwrRing00);
        for (let bay = 0; bay < 3; bay++) {
          let bayPlate = new B(
            chamferBox(0.72, 0.12, 0.016, 0.004, 1),
            U.plastic(0x252a32, 0.48),
          );
          bayPlate.position.set(0, 1.62 - bay * 0.145, 0.952);
          b.root.add(bayPlate);
        }
        d._mon = buildMonitor3D(b, [0.84, 0, -0.78], {
          crt: false,
          w: 0.92,
          h: 0.69,
          res: [1024, 768],
          color: 0x262b34,
          rot: [0, 0.44, 0],
          name: '19" 5:4 Workstation LCD (1280×1024)',
          info: "Early-2000s dual-CCFL backlit TFT flat panel connected via DVI-D to the AGP Radeon 9700 card; displays live superscalar pipeline & cache telemetry.",
          live: () =>
            `IPC ${t.ipc.toFixed(3)} · L1 hit ${u(t.L1.hits, t.L1.hits + t.L1.misses)} · BP ${u(t.bp.correct, t.bp.total)}`,
        });
        buildSculptedKeyboard(b, [0.96, 0, -0.08], {
          w: 0.92,
          d: 0.34,
          h: 0.044,
          rot: [0, 0.44, 0],
          bodyColor: 0x9aa3af,
          keyColor: 0x232730,
          modColor: 0x191c23,
          accentColor: 0x2563eb,
          legendColor: "#e5eaf2",
          ledColor: 0x38bdf8,
          name: "USB / PS2 Workstation Keyboard",
          info: "Two-tone silver/black early-2000s tactile keyboard.",
        });
        buildMouse3D(b, [1.46, 0, -0.32], {
          rot: [0, 0.44, 0],
          color: 0x9aa3af,
          padColor: 0x17253b,
          rgb: 0xff2e44,
          name: "IntelliMouse Optical (USB)",
          info: "DSP optical surface correlation sensor at 6,000 frames/s — retired the mechanical mouse ball in 1999–2001.",
        });
        Dt(
          b,
          [
            [0.82, 0.42, -0.82],
            [0.44, 0.08, -0.92],
            [-0.08, 0.85, -0.92],
          ],
          0.011,
          0x22262e,
          { name: "DVI-D Digital Video Cable" },
        );
        (Dt(
          b,
          [
            [0, 1.45, -0.4],
            [-0.15, 1.2, -0.3],
            [-0.38, 1.25, -0.3],
          ],
          0.015,
          15124544,
        ),
          Dt(
            b,
            [
              [0.05, 0.6, 0.27],
              [-0.1, 0.5, 0.2],
              [-0.38, 0.6, 0.25],
            ],
            0.012,
            12726320,
          ));
      },
      ui(b) {
        ((r.cpu = st(i, i[0], (E) => {
          ((e = { ...Ro[E], bpBits: e.bpBits }), (r.note.textContent = e.note), f(), p());
        })),
          (r.note = q("div", { class: "small" }, e.note)),
          (r.sl = {
            depth: We("Pipeline stages", 5, 31, 1, e.depth, (E) => {
              ((e.depth = E), p());
            }),
            ghz: We("Clock (GHz)", 0.5, 4, 0.01, e.ghz, (E) => {
              ((e.ghz = E), p());
            }),
            l1s: We("L1D size (KB)", 2, 128, 1, e.l1[0], (E) => {
              ((e.l1 = [E, e.l1[1], e.l1[2]]), p());
            }),
            l1w: We("L1D ways", 1, 16, 1, e.l1[1], (E) => {
              ((e.l1 = [e.l1[0], E, e.l1[2]]), p());
            }),
            line: We("Line size (B)", 16, 256, 16, e.l1[2], (E) => {
              ((e.l1 = [e.l1[0], e.l1[1], E]), (e.l2 = [e.l2[0], e.l2[1], E]), p());
            }),
            l2s: We("L2 size (KB)", 64, 4096, 64, e.l2[0], (E) => {
              ((e.l2 = [E, e.l2[1], e.l2[2]]), p());
            }),
            mem: We("DRAM latency (ns)", 20, 200, 1, e.memNs, (E) => {
              ((e.memNs = E), p());
            }),
          }),
          (r.pred = st(
            [
              ["nottaken", "static not-taken"],
              ["btfn", "static backward-taken"],
              ["1bit", "1-bit table"],
              ["2bit", "2-bit saturating"],
              ["gshare", "gshare (global history)"],
            ],
            e.pred,
            (E) => {
              ((e.pred = E), p());
            },
          )));
        let y = Object.keys(Ks);
        ((r.code = Ht(Ks[y[0]], (E) => x(E), 12)),
          (r.err = q("div", { class: "err" })),
          (r.gantt = It(210)),
          (r.cache = It(120)),
          (r.bar = It(46)),
          (r.stats = Pt([
            ["ipc", "IPC"],
            ["ns", "ns / instr"],
            ["l1", "L1 hit rate"],
            ["l2", "L2 hit rate"],
            ["bp", "branch accuracy"],
            ["cyc", "cycles"],
            ["ins", "instructions"],
            ["ml", "DRAM latency"],
          ])),
          b.append(
            Ie(
              "Microarchitecture",
              q("div", { class: "row" }, "Preset ", r.cpu),
              r.note,
              ...Object.values(r.sl),
              q("div", { class: "row" }, "Branch predictor ", r.pred),
            ),
            Ie(
              "Workload (tiny RISC; executed for real)",
              q(
                "div",
                { class: "row" },
                "Load ",
                st(y, y[0], (E) => {
                  ((r.code.value = Ks[E]), x(Ks[E]));
                }),
              ),
              r.code,
              r.err,
              q(
                "div",
                { class: "small" },
                "li add sub mul rem and or xor slt addi muli shli shri andi · ld rd, imm(rs) · st rt, imm(rs) · beq/bne/blt/bge rs, rt, label · j label · halt · r0 = 0",
              ),
              q(
                "div",
                { class: "row" },
                Fe("Pause", (E) => {
                  ((o = !o), (E.target.textContent = o ? "Pause" : "Run"));
                }),
                Fe("Step 1", () => {
                  t.step();
                }),
                We("Instr / frame", 1, 5e3, 1, s, (E) => (s = E)),
              ),
            ),
            r.stats,
            Ie("Pipeline timeline (last 16 instructions; red = stall cycles)", r.gantt),
            Ie("Stall breakdown", r.bar),
            Ie("L1 D-cache sets × ways (green hit · red miss)", r.cache),
          ));
      },
      update(b) {
        o && t.run(s);
        let y = t.events,
          E = 0,
          M = 0,
          T = 0;
        for (let _ of y) _ === "l2" ? E++ : _ === "mem" ? M++ : T++;
        t.events = [];
        let A = d.diag;
        (A.pulse("fe", "ex", "#7ab0ff", 3),
          A.pulse("ex", "l1", "#5fe08a", 3),
          E && A.pulse("l1", "l2", "#ffd166", 3),
          M && (A.pulse("l2", "nb", "#e6edf3", 3), A.pulse("nb", "ddr", "#58c4ff", 3)),
          T && A.pulse("ex", "fe", "#ff5f5f", 3),
          Math.random() < 0.05 && A.pulse("nb", "agp", "#ff5f5f"),
          (l.material.emissiveIntensity = Math.min(
            3,
            l.material.emissiveIntensity * 0.85 + M * 0.3,
          )),
          (a.userData.speed = 10 + Math.min(30, t.ipc * 40)));
        let w = r.stats,
          v = t.L1,
          R = t.L2;
        (w.set("ipc", t.ipc.toFixed(3)),
          w.set("ns", (t.cycles / Math.max(1, t.instr) / e.ghz).toFixed(3)),
          w.set("l1", u(v.hits, v.hits + v.misses)),
          w.set("l2", u(R.hits, R.hits + R.misses)),
          w.set("bp", u(t.bp.correct, t.bp.total)),
          w.set("cyc", t.cycles.toLocaleString()),
          w.set("ins", t.instr.toLocaleString()),
          w.set("ml", t.memLat + " cyc"),
          g(),
          m(),
          S());
        if (d._mon && (d._monTick = ((d._monTick || 0) + 1) % 2) === 0) {
          let mc = d._mon.ctx;
          mc.fillStyle = "#080d16";
          mc.fillRect(0, 0, 1024, 768);
          mc.fillStyle = "#13294b";
          mc.fillRect(0, 0, 1024, 54);
          mc.fillStyle = "#7dd3fc";
          mc.font = '700 22px "JetBrains Mono", monospace';
          mc.fillText(
            `SUPERSCALAR PIPELINE PROFILER · ${e.ghz.toFixed(2)} GHz · ${e.depth} STAGES`,
            20,
            35,
          );
          mc.fillStyle = "#e2e8f0";
          mc.font = '600 19px "JetBrains Mono", monospace';
          const l1Rate =
            v.hits + v.misses
              ? ((v.hits / (v.hits + v.misses)) * 100).toFixed(1)
              : "100.0";
          const l2Rate =
            R.hits + R.misses
              ? ((R.hits / (R.hits + R.misses)) * 100).toFixed(1)
              : "100.0";
          const bpRate = t.bp.total
            ? ((t.bp.correct / t.bp.total) * 100).toFixed(1)
            : "100.0";
          mc.fillText(
            `IPC: ${t.ipc.toFixed(3)}   L1D HIT: ${l1Rate}%   L2 HIT: ${l2Rate}%   BP (${e.pred}): ${bpRate}%`,
            20,
            88,
          );
          // Draw live instruction pipeline waterfall from t.recent
          const rec = t.recent;
          if (rec.length) {
            const i0 = rec[0].issue;
            const iEnd =
              rec[rec.length - 1].issue + rec[rec.length - 1].stall + e.depth + 1;
            const x0 = 270;
            const cw = (1000 - x0) / Math.max(1, iEnd - i0);
            const rh = 34;
            const stageCols = [
              "#60a5fa",
              "#818cf8",
              "#c084fc",
              "#fb923c",
              "#34d399",
              "#facc15",
            ];
            rec.slice(0, 15).forEach((ins, idx) => {
              const ry = 114 + idx * rh;
              mc.fillStyle = ins.kind ? "#fca5a5" : "#94a3b8";
              mc.font = '600 16px "JetBrains Mono", monospace';
              mc.fillText(ins.src.slice(0, 22), 20, ry + 22);
              let sx = x0 + (ins.issue - i0) * cw;
              if (ins.stall) {
                mc.fillStyle = ins.kind === "branch" ? "#dc2626" : "#ea580c";
                mc.fillRect(sx, ry + 4, Math.max(2, ins.stall * cw), rh - 8);
                sx += ins.stall * cw;
              }
              for (let stg = 0; stg < e.depth; stg++) {
                mc.fillStyle = stageCols[Math.floor((stg / e.depth) * 6)];
                mc.fillRect(sx + stg * cw, ry + 6, Math.max(2, cw - 1), rh - 12);
              }
            });
          }
          // Bottom throughput gauge bar
          mc.fillStyle = "#111827";
          mc.fillRect(20, 650, 984, 92);
          mc.strokeStyle = "#1e3a5f";
          mc.lineWidth = 2;
          mc.strokeRect(20, 650, 984, 92);
          const bars = [
            ["IPC / 2.0", Math.min(1, t.ipc / 2), "#38bdf8"],
            ["L1D HIT", parseFloat(l1Rate) / 100, "#34d399"],
            ["BRANCH ACC", parseFloat(bpRate) / 100, "#c084fc"],
          ];
          bars.forEach(([lbl, frac, colStr], bi) => {
            const bx = 42 + bi * 320;
            mc.fillStyle = "#94a3b8";
            mc.font = '700 15px "JetBrains Mono", monospace';
            mc.fillText(`${lbl}: ${(frac * 100).toFixed(1)}%`, bx, 680);
            mc.fillStyle = "#1f2937";
            mc.fillRect(bx, 694, 280, 26);
            mc.fillStyle = colStr;
            mc.fillRect(bx, 694, 280 * Math.max(0.02, frac), 26);
          });
          d._mon.tex.needsUpdate = true;
        }
      },
    },
    u = (b, y) => (y ? ((b / y) * 100).toFixed(1) + "%" : "–");
  function f() {
    let b = r.sl;
    (b.depth.set(e.depth),
      b.ghz.set(e.ghz),
      b.l1s.set(e.l1[0]),
      b.l1w.set(e.l1[1]),
      b.line.set(e.l1[2]),
      b.l2s.set(e.l2[0]),
      b.mem.set(e.memNs),
      (r.pred.value = e.pred));
  }
  function p() {
    (t.configure(e), t.load(n));
  }
  function x(b) {
    let y = Ya(b);
    ((r.err.textContent = y.errors.join(`
`)),
      !y.errors.length && ((n = y), p()));
  }
  function g() {
    let b = r.gantt,
      y = yt(b),
      E = b.width,
      M = b.height;
    ((y.fillStyle = "#05080b"), y.fillRect(0, 0, E, M));
    let T = t.recent;
    if (!T.length) return;
    let A = T[0].issue,
      w = e.depth,
      v = T[T.length - 1].issue + T[T.length - 1].stall + w + 1,
      R = E * 0.3,
      _ = (E - R - 6) / Math.max(1, v - A),
      P = M / 16,
      V = ["#7ab0ff", "#7ab0ff", "#c08cff", "#ff7a1a", "#5fe08a", "#ffd166"];
    ((y.font = `${Math.round(P * 0.62)}px monospace`),
      (y.textBaseline = "middle"),
      T.forEach((k, L) => {
        let z = L * P;
        ((y.fillStyle = k.kind ? "#ff9b9b" : "#9fb0c4"),
          y.fillText(k.src.slice(0, 22), 4, z + P / 2));
        let F = R + (k.issue - A) * _;
        k.stall &&
          ((y.fillStyle =
            k.kind === "branch" ? "#a0303a" : k.kind === "mem" ? "#c0503a" : "#80503a"),
          y.fillRect(F, z + 2, k.stall * _, P - 4),
          (y.fillStyle = "#fff"),
          k.stall * _ > 40 &&
            y.fillText((k.note || k.kind) + " +" + k.stall, F + 3, z + P / 2),
          (F += k.stall * _));
        for (let H = 0; H < w; H++)
          ((y.fillStyle = V[Math.floor((H / w) * 6)]),
            y.fillRect(F + H * _, z + 3, Math.max(1, _ - 1), P - 6));
      }),
      (y.fillStyle = "#6f7f94"),
      y.fillText(
        `${w} stages: fetch ▮ decode ▮ rename ▮ execute ▮ memory ▮ retire`,
        R,
        M - P / 2,
      ));
  }
  function m() {
    let b = r.cache,
      y = yt(b),
      E = b.width,
      M = b.height;
    ((y.fillStyle = "#05080b"), y.fillRect(0, 0, E, M));
    let T = t.L1,
      A = Math.min(T.sets, 256),
      w = T.ways,
      v = Math.ceil(A / 4) || 1,
      R = Math.min(4, A),
      _ = E / v,
      P = M / (R * w);
    for (let V = 0; V < A; V++)
      for (let k = 0; k < w; k++) {
        let L = V * w + k,
          z = T.flash[L];
        T.flash[L] *= 0.85;
        let F = T.tags[L] >= 0;
        ((y.fillStyle =
          z > 0.05
            ? T.flashHit[L]
              ? `rgba(95,224,138,${0.3 + z * 0.7})`
              : `rgba(255,95,95,${0.3 + z * 0.7})`
            : F
              ? "#2a3a4c"
              : "#10161d"),
          y.fillRect(
            (V % v) * _ + 0.5,
            (Math.floor(V / v) * w + k) * P + 0.5,
            _ - 1,
            P - 1,
          ));
      }
    ((y.fillStyle = "#8b98a9"),
      (y.font = "11px monospace"),
      y.fillText(
        `${T.sets} sets × ${T.ways} ways × ${T.line} B${T.sets > 256 ? " (first 256 sets shown)" : ""}`,
        4,
        M - 4,
      ));
  }
  function S() {
    let b = r.bar,
      y = yt(b),
      E = b.width,
      M = b.height;
    ((y.fillStyle = "#05080b"), y.fillRect(0, 0, E, M));
    let T = Math.max(1, t.cycles),
      A = [
        ["useful", t.instr, "#5fe08a"],
        ["memory", t.stall.mem, "#ff7a1a"],
        ["branch", t.stall.branch, "#ff5f5f"],
        ["load-use", t.stall.hazard, "#c08cff"],
      ],
      w = 0;
    ((y.font = "11px sans-serif"), (y.textBaseline = "middle"));
    for (let [v, R, _] of A) {
      let P = (R / T) * E;
      ((y.fillStyle = _),
        y.fillRect(w, 4, P, M - 8),
        P > 60 &&
          ((y.fillStyle = "#06121c"),
          y.fillText(`${v} ${((R / T) * 100).toFixed(0)}%`, w + 4, M / 2)),
        (w += P));
    }
  }
  return (
    (d.test = () => {
      let b = new Ao(Ro["Athlon 64 3200+ 2.2 GHz"]);
      for (
        b.load(
          Ya(`li r1,0
li r2,100
li r4,0
l: addi r1,r1,1
add r4,r4,r1
blt r1,r2,l
halt`),
        );
        !b.done;
      )
        b.step();
      let y = new Ao(Ro["Pentium 4 Northwood 3.06 GHz"]);
      (y.load(Ya(Ks["Sequential array sum (great locality)"])), y.run(2e4));
      let E = new Ao(Ro["Pentium 4 Northwood 3.06 GHz"]);
      (E.load(Ya(Ks["Pointer chasing / random access"])), E.run(2e4));
      let M = y.L1.hits / (y.L1.hits + y.L1.misses),
        T = E.L1.hits / (E.L1.hits + E.L1.misses);
      return {
        sum_1_100: b.R[4],
        seq_L1_hit: +M.toFixed(3),
        random_L1_hit: +T.toFixed(3),
        seq_ipc: +y.ipc.toFixed(3),
        random_ipc: +E.ipc.toFixed(3),
        ok: b.R[4] === 5050 && M > 0.9 && T < 0.1,
      };
    }),
    (d.sim = t),
    (d.isRunning = () => o),
    d
  );
}
function _0(i) {
  let e = [],
    t = [];
  return (
    i
      .split(
        `
`,
      )
      .forEach((n, s) => {
        let r = n.replace(/#.*/, "").trim();
        if (!r) return;
        let o = r.split(/\s+/);
        if (o.length < 4) {
          t.push(`line ${s + 1}: need name arrive nice bursts...`);
          return;
        }
        let a = [];
        for (let l of o.slice(3)) {
          let c = /^([CI])(\d+(?:\.\d+)?)$/i.exec(l);
          if (!c) {
            t.push(`line ${s + 1}: bad burst "${l}" (use C30 / I10)`);
            return;
          }
          a.push({ k: c[1].toUpperCase(), t: +c[2] });
        }
        if (a[0].k !== "C") {
          t.push(`line ${s + 1}: first burst must be CPU`);
          return;
        }
        e.push({
          name: o[0],
          arrive: +o[1] || 0,
          nice: Math.max(-20, Math.min(19, +o[2] || 0)),
          bursts: a,
        });
      }),
    { tasks: e, errors: t }
  );
}
var zc = [
    "#ff6b6b",
    "#ffd166",
    "#5fe08a",
    "#58c4ff",
    "#c08cff",
    "#ff8ab0",
    "#62d0c0",
    "#ffb347",
    "#a0e060",
    "#8fe3ff",
  ],
  qc = class {
    constructor(e) {
      this.o = {
        cores: 4,
        smt: !0,
        policy: "cfs",
        quantum: 4,
        turbo: !0,
        ctxUs: 5,
        ...e,
      };
    }
    load(e) {
      ((this.t = 0),
        (this.switches = 0),
        (this.T = e.map((n, s) => ({
          ...n,
          id: s,
          color: zc[s % zc.length],
          bi: 0,
          rem: n.bursts[0].t,
          state: "new",
          vr: 0,
          w: 1024 / Math.pow(1.25, n.nice),
          wait: 0,
          firstRun: -1,
          done: -1,
          slice: 0,
          hw: -1,
          cpuMs: 0,
        }))));
      let t = this.o.cores * (this.o.smt ? 2 : 1);
      ((this.hw = Array.from({ length: t }, (n, s) => ({
        core: this.o.smt ? s >> 1 : s,
        task: null,
        busy: 0,
      }))),
        (this.gantt = this.hw.map(() => [])),
        (this.minVr = 0),
        (this.ioQ = 0),
        (this.events = []));
    }
    get finished() {
      return this.T.every((e) => e.state === "done");
    }
    speed(e) {
      let t = this.o,
        n = new Set(this.hw.filter((r) => r.task).map((r) => r.core)).size,
        s = 1;
      if (t.smt) {
        let r = this.hw.find((o) => o !== e && o.core === e.core);
        r && r.task && (s = 0.62);
      }
      return (
        t.turbo &&
          (s *=
            (3.5 + 0.4 * Math.max(0, (t.cores - n) / Math.max(1, t.cores - 1))) / 3.5),
        s
      );
    }
    pick(e) {
      let t = this.o.policy;
      return t === "fcfs" || t === "rr"
        ? e.sort((n, s) => n.readyAt - s.readyAt || n.id - s.id)[0]
        : t === "prio"
          ? e.sort((n, s) => n.nice - s.nice || n.readyAt - s.readyAt)[0]
          : e.sort((n, s) => n.vr - s.vr || n.id - s.id)[0];
    }
    tick() {
      let e = this.o,
        t = this.t;
      for (let s of this.T)
        s.state === "new" &&
          s.arrive <= t &&
          ((s.state = "ready"), (s.readyAt = t), (s.vr = Math.max(s.vr, this.minVr)));
      for (let s of this.T)
        s.state === "io" && ((s.rem -= 1), s.rem <= 0 && this.nextBurst(s));
      for (let s of this.hw) {
        let r = s.task;
        if (!r) continue;
        let o = this.T.filter((l) => l.state === "ready"),
          a = !1;
        (e.policy === "rr" && r.slice >= e.quantum && o.length && (a = !0),
          e.policy === "prio" && o.some((l) => l.nice < r.nice) && (a = !0),
          e.policy === "cfs" &&
            r.slice >=
              Math.max(
                0.75,
                ((e.quantum * r.w) / (r.w + o.reduce((l, c) => l + c.w, 0))) *
                  Math.max(1, o.length),
              ) &&
            o.some((l) => l.vr < r.vr) &&
            (a = !0),
          a && ((r.state = "ready"), (r.readyAt = t), (r.hw = -1), (s.task = null)));
      }
      for (let s of this.hw)
        if (!s.task) {
          let r = this.T.filter((a) => a.state === "ready");
          if (!r.length) break;
          let o = this.pick(r);
          ((o.state = "run"),
            (o.hw = this.hw.indexOf(s)),
            (o.slice = 0),
            (s.task = o),
            (s.switchCost = e.ctxUs / 1e3),
            this.switches++,
            o.firstRun < 0 && (o.firstRun = t),
            this.events.push(["dispatch", o.hw]));
        }
      for (let s = 0; s < this.hw.length; s++) {
        let r = this.hw[s],
          o = r.task;
        if (
          (this.gantt[s].push(o ? o.id : -1),
          this.gantt[s].length > 600 && this.gantt[s].shift(),
          !o)
        )
          continue;
        r.busy++;
        let a = this.speed(r) - (r.switchCost || 0);
        ((r.switchCost = 0),
          (o.rem -= a),
          (o.cpuMs += a),
          (o.slice += 1),
          (o.vr += 1024 / o.w),
          o.rem <= 1e-9 && ((r.task = null), (o.hw = -1), this.nextBurst(o)));
      }
      for (let s of this.T) s.state === "ready" && s.wait++;
      let n = this.T.filter((s) => s.state === "run" || s.state === "ready");
      (n.length && (this.minVr = Math.min(...n.map((s) => s.vr))), this.t++);
    }
    nextBurst(e) {
      if ((e.bi++, e.bi >= e.bursts.length)) {
        ((e.state = "done"), (e.done = this.t), this.events.push(["done", e.id]));
        return;
      }
      let t = e.bursts[e.bi];
      ((e.rem = t.t),
        t.k === "I"
          ? ((e.state = "io"), this.events.push(["io", e.id]))
          : ((e.state = "ready"), (e.readyAt = this.t)));
    }
    metrics() {
      let e = this.T.filter((s) => s.done >= 0),
        t = (s) => (e.length ? e.reduce((r, o) => r + s(o), 0) / e.length : 0),
        n = this.hw.reduce((s, r) => s + r.busy, 0);
      return {
        t: this.t,
        turnaround: t((s) => s.done - s.arrive),
        wait: t((s) => s.wait),
        response: t((s) => s.firstRun - s.arrive),
        util: this.t ? n / (this.t * this.hw.length) : 0,
        switches: this.switches,
        done: e.length,
      };
    }
  },
  Ka = {
    "Desktop mix (browser, game, compile, music)": `# name     arrive  nice  bursts (C = CPU ms, I = SSD I/O ms)
browser      0       0    C40 I10 C30 I10 C25 I8 C20
game         0      -5    C120 I5 C120 I5 C100
compile      5      10    C400
music        0     -10    C3 I12 C3 I12 C3 I12 C3 I12 C3 I12 C3
indexer     20      19    C60 I30 C60 I30 C60
antivirus   50      15    C80 I20 C80`,
    "Parallel render (8 equal threads)": `# embarrassingly parallel: compare 2, 4, 8 cores and SMT on/off
tile0 0 0 C200
tile1 0 0 C200
tile2 0 0 C200
tile3 0 0 C200
tile4 0 0 C200
tile5 0 0 C200
tile6 0 0 C200
tile7 0 0 C200`,
    "Interactive vs batch (why priorities matter)": `ui        0  -10  C2 I8 C2 I8 C2 I8 C2 I8 C2 I8 C2 I8 C2 I8
batch1    0   10  C300
batch2    0   10  C300
batch3    0   10  C300
batch4    0   10  C300
batch5    0   10  C300`,
  };
var _o = (i, e, t, n) => (i.position.set(e, t, n), i),
  CA =
    "onmessage = e => { const [a, b] = e.data; let n = 0; for (let i = Math.max(2, a); i < b; i++) { let p = true; for (let d = 2; d * d <= i; d++) if (i % d === 0) { p = false; break; } if (p) n++; } postMessage(n); };";
function c1() {
  let i = { cores: 4, smt: !0, policy: "cfs", quantum: 4, turbo: !0, ctxUs: 5 },
    e = new qc(i),
    t = Object.keys(Ka),
    n = _0(Ka[t[0]]).tasks;
  e.load(n);
  let s = 2,
    r = !0,
    o = {},
    a = [],
    l = [],
    c,
    h = {
      id: "pc10",
      era: "2010s",
      short: "Multi-core i7",
      sim: e,
      name: "2010s PC: quad-core Core i7 with Hyper-Threading, SSD, PCIe GPU",
      blurb:
        "Clock speeds stalled near 4 GHz (power wall), so CPUs went wide: 4 cores × 2 hardware threads sharing a ring bus and L3 cache, with turbo boost when few cores are busy. Speed now depends on the OS scheduler spreading threads across cores. This simulator runs your task set on hardware threads with SMT throughput sharing, turbo, SSD I/O and four scheduling policies (FCFS, Round-Robin, priority, Linux CFS). The die glows with whichever thread each core is running. There is also a real benchmark that spawns Web Workers on YOUR CPU cores.",
      diagram: {
        nodes: [
          {
            id: "os",
            label: `OS scheduler
run-queue`,
            x: 0.13,
            y: 0.5,
            w: 0.2,
            color: "#62d0c0",
          },
          {
            id: "c0",
            label: `Core 0
T0 T1`,
            x: 0.42,
            y: 0.16,
            w: 0.15,
            color: "#ff6b6b",
          },
          {
            id: "c1",
            label: `Core 1
T2 T3`,
            x: 0.42,
            y: 0.4,
            w: 0.15,
            color: "#ffd166",
          },
          {
            id: "c2",
            label: `Core 2
T4 T5`,
            x: 0.42,
            y: 0.63,
            w: 0.15,
            color: "#5fe08a",
          },
          {
            id: "c3",
            label: `Core 3+
…`,
            x: 0.42,
            y: 0.86,
            w: 0.15,
            color: "#58c4ff",
          },
          {
            id: "l3",
            label: `Ring bus
8 MB L3`,
            x: 0.68,
            y: 0.5,
            w: 0.17,
            color: "#c08cff",
          },
          {
            id: "ddr",
            label: "DDR3-1600",
            x: 0.9,
            y: 0.25,
            w: 0.16,
            color: "#58c4ff",
          },
          {
            id: "ssd",
            label: "SATA SSD",
            x: 0.9,
            y: 0.75,
            w: 0.16,
            color: "#ffb347",
          },
        ],
        edges: [
          ["os", "c0"],
          ["os", "c1"],
          ["os", "c2"],
          ["os", "c3"],
          ["c0", "l3"],
          ["c1", "l3"],
          ["c2", "l3"],
          ["c3", "l3"],
          ["l3", "ddr"],
          ["l3", "ssd"],
          ["ssd", "os"],
        ],
      },
      build(p) {
        let x = U.plastic(1316120, 0.45);
        (p.box(0.03, 1.7, 1.7, U.glass(8956620, 0.16), [0.42, 0.85, 0], {
          name: "Tempered-glass side panel",
          info: "Mid-tower ATX case.",
          shell: !0,
          explode: [0.6, 0, 0],
        }),
          p.box(0.84, 0.03, 1.7, x, [0, 1.7, 0], {
            name: "Top panel",
            info: "",
            shell: !0,
            explode: [0, 0.4, 0],
          }),
          p.box(0.03, 1.7, 1.7, x, [-0.42, 0.85, 0], {}),
          p.box(0.84, 0.03, 1.7, x, [0, 0.015, 0], {}),
          p.box(0.84, 1.7, 0.03, x, [0, 0.85, -0.85], {}),
          p.box(0.86, 1.72, 0.05, x, [0, 0.86, 0.87], {
            name: "Front panel",
            info: "Mesh front with intake fans, USB 3.0 ports.",
          }));
        let g = p.group(
          [-0.4, 1, -0.05],
          {
            rot: [0, 0, -Math.PI / 2],
            name: "Z87 motherboard (LGA1150)",
            info: "The northbridge is gone: memory controller, PCIe ×16 lanes and an iGPU are all on the CPU die. The chipset (PCH) handles SATA, USB 3.0 and audio over a DMI link.",
            explode: [-0.2, 0, 0],
          },
          p.root,
        );
        g.add(_o(new B(new te(1.2, 0.015, 1.15), U.pcb(1710620)), 0, 0, 0));
        let m = p.group(
          [-0.25, 0.01, -0.2],
          {
            name: "Core i7-4770K CPU",
            info: "22 nm Haswell: 4 cores, 8 threads, 3.5 GHz base / 3.9 GHz turbo, 8 MB shared L3 on a ring bus, integrated memory controller and GPU. Explode the view to lift the heatspreader and see each core light up with the thread it is running.",
            live: () =>
              e.hw.map(
                (w, v) => `T${v} (core ${w.core}): ${w.task ? w.task.name : "idle"}`,
              ).join(`
`),
            explode: [0, 0.15, 0],
          },
          g,
        );
        m.add(_o(new B(new te(0.2, 0.012, 0.2), U.pcb(2779706)), 0, 0.006, 0));
        let S = new ft();
        ((S.position.y = 0.014),
          m.add(S),
          S.add(_o(new B(new te(0.16, 0.004, 0.09), U.metal(5922666, 0.3)), 0, 0, 0)));
        for (let w = 0; w < 8; w++) {
          let v = new B(new te(0.03, 0.006, 0.026), U.led(5817599));
          (v.position.set(-0.06 + (w % 4) * 0.033, 0.003, w < 4 ? -0.025 : 0.025),
            S.add(v),
            a.push(v));
          for (let R = 0; R < 2; R++) {
            let _ = new B(new te(0.012, 0.008, 0.008), U.led(16777215));
            (_.position.set(
              v.position.x - 0.007 + R * 0.014,
              0.006,
              v.position.z + 0.011 * (w < 4 ? 1 : -1),
            ),
              S.add(_),
              l.push(_));
          }
        }
        let b = new B(new te(0.13, 0.005, 0.012), U.metal(9075290, 0.3));
        ((b.position.y = 0.003), S.add(b));
        let y = p.group(
          [-0.25, 0.04, -0.2],
          {
            name: "Heatspreader + tower cooler",
            info: "Nickel-plated copper IHS, thermal paste, then a tower cooler: 4 copper heat pipes (evaporating/condensing fluid) carry ~84 W to an aluminium fin stack cooled by a 120 mm fan.",
            explode: [0, 0.75, 0],
          },
          g,
        );
        y.add(_o(new B(new te(0.18, 0.015, 0.18), U.metal(13685976, 0.25)), 0, 0, 0));
        for (let w = 0; w < 4; w++) {
          let v = new B(new ke(0.008, 0.008, 0.4, 10), U.copper());
          (v.position.set(-0.06 + w * 0.04, 0.2, 0), y.add(v));
        }
        (vn(
          p,
          0.3,
          0.12,
          0.3,
          [0, 0.12, 0],
          { fins: 28, mat: U.darkAnodized(0x252d38), base: U.darkAnodized(0x202730) },
          y,
        ),
          ni(
            p,
            0.14,
            [0, 0.28, 0.08],
            { speed: 18, color: 1052688, blade: 13656080 },
            y,
          ));
        for (let w = 0; w < 2; w++) {
          let v = ps(
            p,
            [0.02 + w * 0.06, 0.01, -0.25],
            {
              name: w ? void 0 : "DDR3-1600 DIMMs (2 × 8 GB)",
              info: "Dual-channel DDR3, 25.6 GB/s total, ~60 ns latency; the on-die controller talks to them directly.",
              len: 0.55,
              h: 0.13,
              spreader: 11542560,
              chips: 8,
            },
            g,
          );
          v.rotation.y = Math.PI / 2;
        }
        p.box(
          0.55,
          0.03,
          0.04,
          U.plastic(2763306),
          [-0.15, 0.025, 0.12],
          {
            name: "PCIe 3.0 ×16 slot",
            info: "16 lanes × 8 GT/s with 128b/130b encoding ≈ 15.75 GB/s each way, straight from the CPU.",
          },
          g,
        );
        let E = Gs(
          p,
          0.75,
          0.25,
          [-0.15, 0.04, 0.12],
          {
            name: "PCIe graphics card (GTX 980-class)",
            info: "Maxwell GPU: 2,048 CUDA cores in 16 SMs, 4 GB GDDR5 at 224 GB/s, 165 W. Blower/axial cooler with heat pipes.",
            pcb: 1118481,
          },
          g,
        );
        (E.add(
          _o(new B(new te(0.75, 0.22, 0.06), U.plastic(2829617, 0.4)), 0, 0.15, 0.04),
        ),
          ni(p, 0.07, [0.15, 0.15, 0.08], { speed: 25 }, E),
          ni(p, 0.07, [-0.15, 0.15, 0.08], { speed: 25 }, E),
          p.chip(
            0.08,
            0.08,
            [0.3, 0.01, 0.35],
            {
              name: "Z87 PCH chipset",
              info: "Platform Controller Hub: 6× SATA 6 Gb/s, 6× USB 3.0, HD audio, connected to the CPU by DMI 2.0 (~2 GB/s).",
            },
            g,
          ));
        let M = p.group([0.05, 0.25, 0.55], {
          name: '2.5" SATA SSD',
          info: 'NAND flash + controller with a flash translation layer: no moving parts, ~0.1 ms random access (vs ~8 ms for a HDD) and ~550 MB/s — the single biggest "feel" upgrade of the decade. Here it services the I/O bursts of your tasks; the LED blinks on each request.',
          live: () =>
            "tasks in I/O: " +
            e.T.filter((w) => w.state === "io")
              .map((w) => w.name)
              .join(", "),
          explode: [0.3, 0, 0.3],
        });
        (M.add(_o(new B(new te(0.3, 0.03, 0.42), U.metal(3158582, 0.4)), 0, 0, 0)),
          (c = new B(new te(0.02, 0.01, 0.01), U.led(4235519))),
          c.position.set(0.1, 0.02, 0.21),
          M.add(c),
          p
            .group([0, 0.17, -0.45], {
              name: "PSU (650 W, 80 PLUS Gold)",
              info: "Bottom-mounted, >90 % efficient at 50 % load. Modern platforms draw most power from +12 V.",
              explode: [0.3, -0.1, -0.3],
            })
            .add(_o(new B(new te(0.7, 0.3, 0.6), U.plastic(1908258)), 0, 0, 0)),
          ni(p, 0.13, [0, 0.6, 0.83], {
            name: "Front intake fans",
            color: 1118481,
          }),
          ni(p, 0.13, [0, 1.2, 0.83], {}));
        let A = new Pn(0x7dd3fc, 3.2, 3.4, 1.4);
        (A.position.set(0.2, 1.05, 0.2), p.root.add(A));
        let warmFill = new Pn(0xff6b4a, 1.6, 2.5, 1.5);
        warmFill.position.set(0.15, 0.65, -0.15);
        p.root.add(warmFill);
        let ledBar10 = new B(new te(0.012, 1.48, 0.014), U.glow(0x38bdf8, 2.0));
        ledBar10.position.set(0.38, 0.88, 0.78);
        p.root.add(ledBar10);
        for (let fi = 0; fi < 2; fi++) {
          let ring = new B(new Pi(0.135, 0.006, 10, 32), U.glow(0xef4444, 1.5));
          ring.position.set(0, 0.6 + fi * 0.6, 0.898);
          p.root.add(ring);
        }
        h._mon = buildMonitor3D(p, [0.88, 0, -0.78], {
          crt: false,
          w: 1.18,
          h: 0.66,
          res: [1280, 720],
          color: 0x161a22,
          rot: [0, 0.44, 0],
          name: '27" 16:9 WQHD IPS Monitor',
          info: "2560×1440-class slim-bezel IPS panel over DisplayPort 1.2 from the GTX 980; renders live 4-core/8-thread SMP scheduler & ring-bus activity.",
          live: () => {
            const mt = e.metrics();
            return `SMP util ${(mt.util * 100).toFixed(0)}% · ${mt.switches} context switches`;
          },
        });
        buildSculptedKeyboard(p, [1.02, 0, -0.06], {
          w: 0.96,
          d: 0.35,
          h: 0.044,
          rot: [0, 0.44, 0],
          rgb: true,
          rgbColor: 0x38bdf8,
          bodyColor: 0x181c24,
          keyColor: 0x222732,
          modColor: 0x171b23,
          accentColor: 0xe11d48,
          legendColor: "#e2e8f0",
          ledColor: 0x38bdf8,
          name: "RGB Mechanical Gaming Keyboard",
          info: "Per-key RGB Cherry MX mechanical switch matrix over 1000 Hz USB HID polling.",
        });
        buildMouse3D(p, [1.54, 0, -0.32], {
          rot: [0, 0.44, 0],
          color: 0x1c212b,
          padColor: 0x111827,
          rgb: 0x38bdf8,
          name: "High-DPI Optical Gaming Mouse",
          info: "PixArt PMW3360 optical sensor at 1000 Hz USB report rate with PTFE skates.",
        });
        Dt(
          p,
          [
            [0.86, 0.42, -0.82],
            [0.44, 0.06, -0.9],
            [-0.12, 0.78, -0.87],
          ],
          0.011,
          0x1b1f28,
          { name: "DisplayPort 1.2 Cable" },
        );
        Dt(
          p,
          [
            [0.05, 0.3, -0.2],
            [-0.2, 0.6, -0.3],
            [-0.38, 0.8, -0.4],
          ],
          0.02,
          0x1e2430,
        );
        Dt(
          p,
          [
            [0.12, 0.28, -0.35],
            [0.24, 0.55, -0.05],
            [0.12, 0.84, 0.08],
          ],
          0.014,
          0xb91c1c,
          { name: "Sleeved 8-Pin PCIe GPU Power" },
        );
      },
      ui(p) {
        ((o.code = Ht(
          Ka[t[0]],
          (g) => {
            let m = _0(g);
            ((o.err.textContent = m.errors.join(`
`)),
              m.errors.length || ((n = m.tasks), d()));
          },
          8,
        )),
          (o.err = q("div", { class: "err" })),
          (o.gantt = It(200)),
          (o.table = q("div", { class: "regs" })),
          (o.stats = Pt([
            ["t", "time"],
            ["util", "CPU utilisation"],
            ["turn", "avg turnaround"],
            ["resp", "avg response"],
            ["sw", "context switches"],
            ["done", "finished"],
          ])));
        let x = () => d();
        ((o.bench = q(
          "div",
          { class: "regs" },
          `navigator.hardwareConcurrency = ${navigator.hardwareConcurrency || "?"} logical CPUs on this device`,
        )),
          p.append(
            Ie(
              "Hardware & OS policy",
              We("Physical cores", 1, 8, 1, i.cores, (g) => {
                ((i.cores = g), x());
              }),
              q(
                "div",
                { class: "row" },
                q(
                  "label",
                  {},
                  q("input", {
                    type: "checkbox",
                    checked: !0,
                    onchange: (g) => {
                      ((i.smt = g.target.checked), x());
                    },
                  }),
                  " Hyper-Threading (SMT, 0.62× each when siblings both busy)",
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
                    onchange: (g) => {
                      ((i.turbo = g.target.checked), x());
                    },
                  }),
                  " Turbo Boost (3.5 → 3.9 GHz when cores idle)",
                ),
              ),
              q(
                "div",
                { class: "row" },
                "Policy ",
                st(
                  [
                    ["cfs", "CFS (Linux, vruntime)"],
                    ["rr", "Round-Robin"],
                    ["prio", "Priority (nice, preemptive)"],
                    ["fcfs", "FCFS (no preemption)"],
                  ],
                  i.policy,
                  (g) => {
                    ((i.policy = g), x());
                  },
                ),
              ),
              We("Quantum (ms)", 1, 50, 1, i.quantum, (g) => {
                ((i.quantum = g), x());
              }),
              We("Context switch (µs)", 0, 500, 5, i.ctxUs, (g) => {
                ((i.ctxUs = g), x());
              }),
            ),
            Ie(
              "Tasks (edit live)",
              q(
                "div",
                { class: "row" },
                "Load ",
                st(t, t[0], (g) => {
                  ((o.code.value = Ka[g]), o.code.dispatchEvent(new Event("input")));
                }),
              ),
              o.code,
              o.err,
              q(
                "div",
                { class: "small" },
                "name  arrive-ms  nice(-20..19)  bursts: C<ms> = compute, I<ms> = SSD I/O.",
              ),
              q(
                "div",
                { class: "row" },
                Fe("Pause", (g) => {
                  ((r = !r), (g.target.textContent = r ? "Pause" : "Run"));
                }),
                Fe("Restart", x),
                We("ms / frame", 1, 20, 1, s, (g) => (s = g)),
              ),
            ),
            o.stats,
            Ie("Hardware-thread timeline (Gantt, last 300 ms)", o.gantt),
            Ie("Per-task", o.table),
            Ie(
              "Real parallel benchmark on your CPU (Web Workers)",
              q(
                "div",
                { class: "small" },
                "Counts primes below 3,000,000 split across 1, 2, 4 … N worker threads and times it. This is real multicore execution on your machine.",
              ),
              q(
                "div",
                { class: "row" },
                Fe("Run benchmark", () => f(), "pri"),
              ),
              o.bench,
            ),
          ));
      },
      update(p) {
        if (r)
          for (let S = 0; S < s; S++) {
            if (e.finished) {
              (h._hold || (h._hold = 60), --h._hold <= 0 && ((h._hold = 0), d()));
              break;
            }
            e.tick();
          }
        let x = h.diag;
        for (let [S, b] of e.events)
          (S === "dispatch" &&
            x.pulse(
              "os",
              "c" + Math.min(3, e.hw[b].core),
              zc[e.hw[b].task?.id % zc.length] || "#fff",
              3,
            ),
            S === "io" &&
              (x.pulse("l3", "ssd", "#ffb347", 3), (c.material.emissiveIntensity = 3)),
            S === "done" && x.pulse("ssd", "os", "#5fe08a", 2));
        ((e.events = []),
          (c.material.emissiveIntensity = Math.max(
            0.05,
            c.material.emissiveIntensity - p * 6,
          )),
          e.hw.forEach((S) => {
            S.task && x.activate("c" + Math.min(3, S.core), 0.7);
          }),
          a.forEach((S, b) => {
            S.visible = b < i.cores;
            let E = e.hw.filter((M) => M.core === b).find((M) => M.task)?.task;
            (S.material.emissive.set(E ? E.color : "#223344"),
              (S.material.emissiveIntensity = E ? 1.8 : 0.15));
          }),
          l.forEach((S, b) => {
            let y = b >> 1,
              E = b & 1;
            S.visible = y < i.cores && (i.smt || E === 0);
            let M = e.hw[i.smt ? y * 2 + E : y],
              T = M && M.task;
            (S.material.emissive.set(T ? T.color : "#111"),
              (S.material.emissiveIntensity = T ? 2.5 : 0.05));
          }));
        let g = e.metrics(),
          m = o.stats;
        (m.set("t", g.t + " ms"),
          m.set("util", (g.util * 100).toFixed(0) + "%"),
          m.set("turn", g.turnaround.toFixed(0) + " ms"),
          m.set("resp", g.response.toFixed(1) + " ms"),
          m.set("sw", g.switches),
          m.set("done", g.done + "/" + e.T.length),
          u(),
          (o.table.textContent =
            `task        state  nice  cpu-ms  wait  done
` +
            e.T.map(
              (S) =>
                `${S.name.padEnd(11)} ${S.state.padEnd(5)} ${String(S.nice).padStart(4)} ${S.cpuMs.toFixed(0).padStart(7)} ${String(S.wait).padStart(5)} ${S.done >= 0 ? S.done : ""}`,
            ).join(`
`)));
        if (h._mon && (h._monTick = ((h._monTick || 0) + 1) % 2) === 0) {
          let mc = h._mon.ctx;
          mc.fillStyle = "#070b12";
          mc.fillRect(0, 0, 1280, 720);
          mc.fillStyle = "#0f1e36";
          mc.fillRect(0, 0, 1280, 52);
          mc.fillStyle = "#38bdf8";
          mc.font = '700 21px "JetBrains Mono", monospace';
          mc.fillText(
            `CORE i7-4770K SMP MONITOR · ${i.cores}C / ${i.smt ? i.cores * 2 : i.cores}T · POLICY: ${i.policy.toUpperCase()}`,
            22,
            34,
          );
          mc.fillStyle = "#e2e8f0";
          mc.font = '600 18px "JetBrains Mono", monospace';
          mc.fillText(
            `UTIL: ${(g.util * 100).toFixed(0)}%   TIME: ${g.t} ms   CTX SWITCHES: ${g.switches}   DONE: ${g.done}/${e.T.length}`,
            22,
            84,
          );
          // Hardware thread Gantt timeline
          const nRows = Math.max(1, e.gantt.length);
          const rowH = Math.min(54, 410 / nRows);
          const gx0 = 130;
          const gw = (1248 - gx0) / 300;
          e.gantt.forEach((hist, hi2) => {
            const ry = 108 + hi2 * rowH;
            mc.fillStyle = "#111827";
            mc.fillRect(gx0, ry + 2, 1248 - gx0, rowH - 6);
            mc.fillStyle = "#94a3b8";
            mc.font = '700 16px "JetBrains Mono", monospace';
            mc.fillText(
              `C${e.hw[hi2].core}${i.smt ? "·T" + (hi2 & 1) : ""}`,
              22,
              ry + rowH * 0.62,
            );
            hist.slice(-300).forEach((tid, stepIdx) => {
              if (tid >= 0 && e.T[tid]) {
                mc.fillStyle = e.T[tid].color;
                mc.fillRect(gx0 + stepIdx * gw, ry + 3, Math.ceil(gw), rowH - 8);
              }
            });
          });
          // Per-core tile status strip at bottom
          for (let ci = 0; ci < i.cores; ci++) {
            const bx = 22 + ci * Math.min(154, 1236 / i.cores);
            const bw = Math.min(144, 1236 / i.cores - 10);
            const activeTask = e.hw.filter((hw) => hw.core === ci && hw.task)[0]?.task;
            mc.fillStyle = activeTask ? "rgba(56,189,248,0.16)" : "#0f172a";
            mc.fillRect(bx, 560, bw, 132);
            mc.strokeStyle = activeTask ? activeTask.color : "#1e293b";
            mc.lineWidth = 2.5;
            mc.strokeRect(bx, 560, bw, 132);
            mc.fillStyle = "#94a3b8";
            mc.font = '700 15px "JetBrains Mono", monospace';
            mc.fillText(`CORE ${ci}`, bx + 12, 588);
            mc.fillStyle = activeTask ? activeTask.color : "#475569";
            mc.font = '700 18px "JetBrains Mono", monospace';
            mc.fillText(
              activeTask ? activeTask.name.slice(0, 9) : "C6 IDLE",
              bx + 12,
              626,
            );
            mc.fillStyle = "#cbd5e1";
            mc.font = '600 13px "JetBrains Mono", monospace';
            mc.fillText(i.turbo && activeTask ? "3.90 GHz" : "3.50 GHz", bx + 12, 668);
          }
          h._mon.tex.needsUpdate = true;
        }
      },
    };
  function d() {
    ((e.o = { ...i }), e.load(n));
  }
  function u() {
    let p = o.gantt,
      x = yt(p),
      g = p.width,
      m = p.height;
    ((x.fillStyle = "#05080b"), x.fillRect(0, 0, g, m));
    let S = e.gantt.length,
      b = (m - 16) / S,
      y = 44,
      E = 300,
      M = (g - y) / E;
    ((x.font = `${Math.min(12, b * 0.7)}px monospace`),
      (x.textBaseline = "middle"),
      e.gantt.forEach((A, w) => {
        ((x.fillStyle = "#8b98a9"),
          x.fillText(`C${e.hw[w].core}${i.smt ? "." + (w & 1) : ""}`, 2, w * b + b / 2),
          A.slice(-E).forEach((R, _) => {
            R < 0 ||
              ((x.fillStyle = e.T[R].color),
              x.fillRect(y + _ * M, w * b + 1, Math.ceil(M), b - 2));
          }));
      }));
    let T = y;
    ((x.font = "11px sans-serif"),
      e.T.forEach((A) => {
        ((x.fillStyle = A.color),
          x.fillRect(T, m - 12, 8, 8),
          (x.fillStyle = "#ccc"),
          x.fillText(A.name, T + 10, m - 8),
          (T += x.measureText(A.name).width + 18));
      }));
  }
  async function f() {
    let x = Math.min(16, navigator.hardwareConcurrency || 4),
      g = URL.createObjectURL(new Blob([CA], { type: "text/javascript" })),
      m = [];
    o.bench.textContent = "running…";
    for (let S = 1; S <= x; S *= 2) {
      let b = performance.now(),
        y = Math.ceil(3e6 / (S * 8)),
        E = [];
      for (let w = 0; w < 3e6; w += y) E.push([w, Math.min(3e6, w + y)]);
      let M = Array.from({ length: S }, () => new Worker(g)),
        T = 0;
      await Promise.all(
        M.map(
          (w) =>
            new Promise((v) => {
              let R = () => {
                let _ = E.shift();
                if (!_) {
                  (w.terminate(), v());
                  return;
                }
                ((w.onmessage = (P) => {
                  ((T += P.data), R());
                }),
                  w.postMessage(_));
              };
              R();
            }),
        ),
      );
      let A = performance.now() - b;
      (m.push([S, A, T]),
        (o.bench.textContent = m.map(
          ([w, v, R]) =>
            `${String(w).padStart(2)} worker(s): ${v.toFixed(0).padStart(5)} ms  speed-up ×${(m[0][1] / v).toFixed(2)}  primes=${R}`,
        ).join(`
`)));
    }
    return ((h.benchResult = m), m);
  }
  return (
    (h.bench = f),
    (h.test = () => {
      let p = _0(Ka["Parallel render (8 equal threads)"]).tasks,
        x = (b) => {
          let y = new qc({ policy: "rr", turbo: !1, ...b });
          for (y.load(p); !y.finished && y.t < 1e5;) y.tick();
          return y.t;
        },
        g = x({ cores: 1, smt: !1 }),
        m = x({ cores: 4, smt: !1 }),
        S = x({ cores: 4, smt: !0 });
      return {
        makespan_1core: g,
        makespan_4core: m,
        makespan_4c8t: S,
        speedup_4core: +(g / m).toFixed(2),
        ok: Math.abs(g / m - 4) < 0.1 && S < m,
      };
    }),
    (h.sim = e),
    (h.isRunning = () => r),
    h
  );
}
