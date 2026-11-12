// Hard-Wired, Symbolic, Fault-Tolerant, Systolic, Wafer-Scale & Silicon-Spin Engines (v5.0.0):
//   Circle I   (Personal & Frontier) : EniacPlugboardEngine (1946), SymbolicsLispMachine (1983), WaferScaleDataflowEngine (2024)
//   Circle II  (Mainframes & Servers): TandemNonStopCluster (1977), HypervisorNumaServer (2004)
//   Circle III (Supercomputers)      : SystolicArrayEngine (1982), FugakuSveTofuEngine (2020)
//   Circle IV  (Age of Quantum)      : SiliconSpinDotQpu (1998/2024)

(function (globalScope) {
  "use strict";

  // ============================================================================
  // 1. ENIAC HARD-WIRED PLUGBOARD & DECADE RING ENGINE (1946, UPenn Moore School)
  //    6x 10-Digit Signed Vacuum-Tube Ring Accumulators + Function Table + CPP Trunks
  // ============================================================================
  const ENIAC_PRESETS = {
    "Ballistic Trajectory Differential Integrator": {
      mode: "ballistic",
      desc: "Integrates supersonic artillery shell (x, y, vx, vy) with Mach drag lookup G(v) from Function Table A over 11-wire Digit Trunks.",
      cords: [
        {
          id: "CPP-1",
          from: "MP:STEP1",
          to: "FT-A:ARG",
          trunk: "P1",
          enabled: true,
          label: "Pulse FT-A Mach Drag G(v)",
        },
        {
          id: "TRK-A",
          from: "ACC3:vx",
          to: "ACC1:x",
          trunk: "D1",
          enabled: true,
          label: "x += vx * dt (Trunk D1)",
        },
        {
          id: "TRK-B",
          from: "ACC4:vy",
          to: "ACC2:y",
          trunk: "D2",
          enabled: true,
          label: "y += vy * dt (Trunk D2)",
        },
        {
          id: "TRK-C",
          from: "FT-A:DRAG",
          to: "ACC3:vx",
          trunk: "D3",
          enabled: true,
          label: "vx -= G(v)*vx*dt (Drag)",
        },
        {
          id: "TRK-D",
          from: "CONST:GRAV",
          to: "ACC4:vy",
          trunk: "D4",
          enabled: true,
          label: "vy -= (g + G(v)*vy)*dt",
        },
      ],
    },
    "Hard-Wired 10-Digit Fibonacci Ring Cascade": {
      mode: "fibonacci",
      desc: "Pure 100 kHz pulse-train addition cascade: ACC3 <- ACC1 + ACC2, shifting 10-stage vacuum-tube decade rings without stored code.",
      cords: [
        {
          id: "CPP-1",
          from: "MP:LOOP",
          to: "ACC1:TX",
          trunk: "P1",
          enabled: true,
          label: "Transmit ACC1 (A)",
        },
        {
          id: "TRK-A",
          from: "ACC1:A",
          to: "ACC3:RX1",
          trunk: "D1",
          enabled: true,
          label: "ACC3 += ACC1",
        },
        {
          id: "TRK-B",
          from: "ACC2:A",
          to: "ACC3:RX2",
          trunk: "D2",
          enabled: true,
          label: "ACC3 += ACC2",
        },
        {
          id: "TRK-C",
          from: "ACC2:S",
          to: "ACC1:CLR+RX",
          trunk: "D3",
          enabled: true,
          label: "Shift ACC1 <- ACC2",
        },
        {
          id: "TRK-D",
          from: "ACC3:S",
          to: "ACC2:CLR+RX",
          trunk: "D4",
          enabled: true,
          label: "Shift ACC2 <- ACC3",
        },
      ],
    },
    "Finite-Difference Squares & Cubes Table": {
      mode: "squares",
      desc: "Computes n, n^2, and n^3 purely via constant 2nd/3rd finite differences across Accumulators 1..5 at 5,000 additions/sec.",
      cords: [
        {
          id: "CPP-1",
          from: "CONST:+1",
          to: "ACC1:n",
          trunk: "P1",
          enabled: true,
          label: "Increment n += 1",
        },
        {
          id: "TRK-A",
          from: "ACC4:d1",
          to: "ACC2:n^2",
          trunk: "D1",
          enabled: true,
          label: "n^2 += (2n + 1)",
        },
        {
          id: "TRK-B",
          from: "CONST:+2",
          to: "ACC4:d1",
          trunk: "D2",
          enabled: true,
          label: "d1 += 2 (2nd diff)",
        },
        {
          id: "TRK-C",
          from: "ACC5:d3",
          to: "ACC3:n^3",
          trunk: "D3",
          enabled: true,
          label: "n^3 += 3n^2 + 3n + 1",
        },
        {
          id: "TRK-D",
          from: "ACC1:n",
          to: "PUNCH:CARD",
          trunk: "D4",
          enabled: true,
          label: "Punch IBM 80-col Card",
        },
      ],
    },
  };

  class EniacPlugboardEngine {
    constructor() {
      this.presetNames = Object.keys(ENIAC_PRESETS);
      // 6x 10-digit signed accumulators (ACC1..ACC6)
      // Each accumulator tracks integer value, PM sign ('+'/'-'), and 10 ring positions [0..9]
      this.acc = Array.from({ length: 6 }, (_, i) => ({
        id: `ACC${i + 1}`,
        role: ["X-Range", "Y-Alt", "Vx", "Vy", "Drag-G", "Time-t"][i],
        value: 0,
        sign: "+",
        digits: new Uint8Array(10),
        carryMask: 0,
      }));
      // Function Table A: 104-entry ballistic drag resistance G(Mach * 30)
      this.funcTable = new Float64Array(104);
      for (let k = 0; k < 104; k++) {
        const mach = k / 25;
        // Transonic wave-drag rise near Mach 1.0 (authentic exterior ballistics curve!)
        const wave =
          mach > 0.82 ? 0.0028 * Math.exp(-Math.pow((mach - 1.08) / 0.32, 2)) : 0;
        this.funcTable[k] = +(0.00045 + 0.00022 * mach + wave).toFixed(6);
      }
      this.elevationDeg = 42;
      this.muzzleVelMps = 720;
      this.trajectory = [];
      this.masterStep = 0;
      this.additionCycles = 0;
      this.tubePulses = 0;
      this.powerKw = 150.0;
      this.lastCard = "";
      this.loadPreset("Ballistic Trajectory Differential Integrator");
    }

    _syncAccDigits(idx, rawVal) {
      const a = this.acc[idx];
      const clamped = Math.max(-9999999999, Math.min(9999999999, Math.round(rawVal)));
      const prevDigits = Uint8Array.from(a.digits);
      a.value = clamped;
      a.sign = clamped < 0 ? "-" : "+";
      let mag = Math.abs(clamped);
      let carry = 0;
      for (let d = 0; d < 10; d++) {
        const dig = mag % 10;
        if (dig < prevDigits[d]) carry |= 1 << d;
        a.digits[d] = dig;
        mag = Math.floor(mag / 10);
      }
      a.carryMask = carry;
    }

    setElevationDeg(deg) {
      this.elevationDeg = Math.max(12, Math.min(78, Number(deg) || 42));
      if (this.mode === "ballistic") this._resetBallisticState();
    }

    toggleCord(indexOrId) {
      let c = typeof indexOrId === "number" ? this.cords[indexOrId] : null;
      if (!c && typeof indexOrId === "string") {
        c = this.cords.find((item) => item.id === indexOrId || item.trunk === indexOrId);
        const m = !c && indexOrId.match(/^C(\d+)$/i);
        if (m) {
          c = this.cords[parseInt(m[1], 10) - 1] || null;
        }
      }
      if (!c) return false;
      c.enabled = !c.enabled;
      return c.enabled;
    }

    _resetBallisticState() {
      const rad = (this.elevationDeg * Math.PI) / 180;
      this.bx = 0;
      this.by = 0;
      this.bvx = this.muzzleVelMps * Math.cos(rad);
      this.bvy = this.muzzleVelMps * Math.sin(rad);
      this.bt = 0;
      this.maxApexM = 0;
      this.impactRangeM = 0;
      this.trajectory = [{ x: 0, y: 0, t: 0 }];
      this._syncAccDigits(0, 0);
      this._syncAccDigits(1, 0);
      this._syncAccDigits(2, this.bvx * 100);
      this._syncAccDigits(3, this.bvy * 100);
      this._syncAccDigits(
        4,
        this.funcTable[Math.min(103, Math.round((this.muzzleVelMps / 340) * 25))] * 1e7,
      );
      this._syncAccDigits(5, 0);
    }

    loadPreset(name) {
      const spec = ENIAC_PRESETS[name] || ENIAC_PRESETS[this.presetNames[0]];
      this.presetName = name in ENIAC_PRESETS ? name : this.presetNames[0];
      this.mode = spec.mode;
      this.desc = spec.desc;
      this.cords = spec.cords.map((c) => ({ ...c }));
      this.masterStep = 0;
      this.additionCycles = 0;
      this.tubePulses = 0;

      if (this.mode === "ballistic") {
        this.acc[0].role = "X (cm)";
        this.acc[1].role = "Y (cm)";
        this.acc[2].role = "Vx (cm/s)";
        this.acc[3].role = "Vy (cm/s)";
        this.acc[4].role = "Drag G*1e7";
        this.acc[5].role = "Time (cs)";
        this._resetBallisticState();
      } else if (this.mode === "fibonacci") {
        const roles = ["Fib(k-2)", "Fib(k-1)", "Fib(k)", "Index k", "Golden*1e6", "Sum"];
        roles.forEach((r, i) => (this.acc[i].role = r));
        this._syncAccDigits(0, 1);
        this._syncAccDigits(1, 1);
        this._syncAccDigits(2, 2);
        this._syncAccDigits(3, 3);
        this._syncAccDigits(4, 1618033);
        this._syncAccDigits(5, 4);
        this.trajectory = [
          { x: 1, y: 1, t: 1 },
          { x: 2, y: 1, t: 2 },
          { x: 3, y: 2, t: 3 },
        ];
      } else {
        const roles = ["n", "n^2", "n^3", "Diff1(2n+1)", "Diff3", "PunchCnt"];
        roles.forEach((r, i) => (this.acc[i].role = r));
        this._syncAccDigits(0, 1);
        this._syncAccDigits(1, 1);
        this._syncAccDigits(2, 1);
        this._syncAccDigits(3, 3);
        this._syncAccDigits(4, 7);
        this._syncAccDigits(5, 1);
        this.trajectory = [{ x: 1, y: 1, t: 1 }];
      }
      this.lastCard = `${this.acc[0].value} | ${this.acc[1].value} | ${this.acc[2].value}`;
    }

    formatAccumulator(idx) {
      const a = this.acc[idx];
      if (!a) return "+0000000000";
      let s = a.sign;
      for (let d = 9; d >= 0; d--) s += String(a.digits[d]);
      return s;
    }

    step() {
      this.masterStep++;
      const activeCords = this.cords.filter((c) => c.enabled).length;
      this.additionCycles += Math.max(1, activeCords);
      // 10 pulse-times per addition cycle at 100 kHz across 6 accumulators
      this.tubePulses += Math.max(1, activeCords) * 10 * 6;

      const c0 = this.cords[0]?.enabled !== false;
      const c1 = this.cords[1]?.enabled !== false;
      const c2 = this.cords[2]?.enabled !== false;
      const c3 = this.cords[3]?.enabled !== false;
      const c4 = this.cords[4]?.enabled !== false;

      if (this.mode === "ballistic") {
        if (this.by < 0 && this.bt > 0.2) {
          this._resetBallisticState();
        }
        const dt = 0.35; // seconds per integration frame
        const speed = Math.hypot(this.bvx, this.bvy);
        const mach = speed / 340.29;
        const ftIdx = Math.min(103, Math.max(0, Math.round(mach * 25)));
        const dragCoeff = c0 ? this.funcTable[ftIdx] : 0;

        if (c1) this.bx += this.bvx * dt;
        if (c2) this.by += this.bvy * dt;
        if (c3) this.bvx -= dragCoeff * speed * this.bvx * dt;
        if (c4) this.bvy -= (9.80665 + dragCoeff * speed * this.bvy) * dt;
        this.bt += dt;

        if (this.by > this.maxApexM) this.maxApexM = this.by;
        if (this.by <= 0 && this.bt > 0.4) {
          this.by = 0;
          this.impactRangeM = this.bx;
        }

        this._syncAccDigits(0, this.bx * 100);
        this._syncAccDigits(1, Math.max(0, this.by) * 100);
        this._syncAccDigits(2, this.bvx * 100);
        this._syncAccDigits(3, this.bvy * 100);
        this._syncAccDigits(4, dragCoeff * 1e7);
        this._syncAccDigits(5, this.bt * 100);

        this.trajectory.push({
          x: +this.bx.toFixed(1),
          y: +Math.max(0, this.by).toFixed(1),
          t: +this.bt.toFixed(2),
        });
        if (this.trajectory.length > 180) this.trajectory.shift();
        this.lastCard = `t=${this.bt.toFixed(1)}s X=${this.bx.toFixed(0)}m Y=${Math.max(0, this.by).toFixed(0)}m M=${mach.toFixed(2)}`;
      } else if (this.mode === "fibonacci") {
        let a = this.acc[0].value;
        let b = this.acc[1].value;
        let k = this.acc[3].value + 1;
        if (b > 2971215073) {
          // Recycle before 10-digit decimal wraparound
          a = 1;
          b = 1;
          k = 3;
          this._syncAccDigits(5, 2);
        }
        const next = (c1 ? a : 0) + (c2 ? b : 0);
        if (c3) this._syncAccDigits(0, b);
        if (c4) this._syncAccDigits(1, next);
        this._syncAccDigits(2, next);
        this._syncAccDigits(3, k);
        const ratio = b > 0 ? Math.round((next / b) * 1e6) : 1618033;
        this._syncAccDigits(4, ratio);
        this._syncAccDigits(5, this.acc[5].value + next);
        this.trajectory.push({ x: k, y: next, t: k });
        if (this.trajectory.length > 48) this.trajectory.shift();
        this.lastCard = `F(${k}) = ${next} | phi = ${(ratio / 1e6).toFixed(6)}`;
      } else {
        let n = this.acc[0].value;
        if (n >= 950) {
          this.loadPreset("Finite-Difference Squares & Cubes Table");
          n = 1;
        }
        const sq = this.acc[1].value;
        const d1 = this.acc[3].value;
        const nextN = c0 ? n + 1 : n;
        const nextSq = c1 ? sq + d1 : sq;
        const nextD1 = c2 ? d1 + 2 : d1;
        const nextCube = c3 ? nextN * nextN * nextN : this.acc[2].value;
        this._syncAccDigits(0, nextN);
        this._syncAccDigits(1, nextSq);
        this._syncAccDigits(2, nextCube);
        this._syncAccDigits(3, nextD1);
        this._syncAccDigits(4, 6 * nextN + 6);
        if (c4) this._syncAccDigits(5, this.acc[5].value + 1);
        this.trajectory.push({ x: nextN, y: nextSq, t: nextN });
        if (this.trajectory.length > 64) this.trajectory.shift();
        this.lastCard = `n=${nextN}  n^2=${nextSq}  n^3=${nextCube}`;
      }

      return {
        step: this.masterStep,
        acc1: this.acc[0].value,
        acc2: this.acc[1].value,
        acc3: this.acc[2].value,
        card: this.lastCard,
      };
    }
  }

  // ============================================================================
  // 2. MIT CADR / SYMBOLICS 3600 HARDWARE-TAGGED LISP MACHINE (1983)
  //    36-Bit Tagged Words (2b CDR-Code + 4b Tag + 30b Payload) + Ephemeral GC
  // ============================================================================
  const CDR_NORMAL = 0;
  const CDR_NEXT = 1;
  const CDR_NIL = 2;

  const DTP_NIL = 0;
  const DTP_FIXNUM = 1;
  const DTP_SYMBOL = 2;
  const DTP_CONS = 3;
  const DTP_CLOSURE = 4;
  const DTP_FORWARD = 5;

  const LISP_PROGRAMS = {
    "Symbolic Differentiation (deriv)": `; Symbolic Differentiation on 36-bit Hardware-Tagged Cons Cells
(defun deriv (e v)
  (cond ((atom e) (if (eq e v) 1 0))
        ((eq (car e) '+)
         (list '+ (deriv (car (cdr e)) v) (deriv (car (cdr (cdr e))) v)))
        ((eq (car e) '*)
         (list '+
           (list '* (car (cdr e)) (deriv (car (cdr (cdr e))) v))
           (list '* (deriv (car (cdr e)) v) (car (cdr (cdr e))))))))
(deriv '(* x (+ x 5)) 'x)`,
    "CDR-Coded List & Higher-Order Mapcar": `; Hardware CDR-Coding packs (2 4 6 8 10) into 5 contiguous 36-bit words!
(let ((xs (list 2 4 6 8 10)))
  (reduce '+ (mapcar (lambda (n) (+ (* n n) 1)) xs)))`,
    "Recursive Factorial & Closure Counter": `; Lexical Closure + Hardware Fixnum Tag-Checked Recursion
(defun fact (n)
  (if (< n 2) 1 (* n (fact (- n 1)))))
(let ((acc 0))
  (+ (fact 6) 30))`,
  };

  class SymbolicsLispMachine {
    constructor() {
      this.programNames = Object.keys(LISP_PROGRAMS);
      this.heapHalf = 512;
      // Each heap slot stores { cdrCode, tag, payload, gen } representing a 36-bit word
      this.heap = Array.from({ length: this.heapHalf * 2 }, () => ({
        cdrCode: CDR_NORMAL,
        tag: DTP_NIL,
        payload: 0,
        gen: 0,
      }));
      this.fromBase = 0;
      this.toBase = this.heapHalf;
      this.freePtr = 0;

      this.symbols = ["NIL", "T"];
      this.symMap = new Map([
        ["NIL", 0],
        ["T", 1],
      ]);
      this.closures = [];
      this.globalEnv = new Map();

      this.tagChecks = 0;
      this.cdrWordsSaved = 0;
      this.consAllocated = 0;
      this.gcCycles = 0;
      this.lastReclaimed = 0;
      this.liveWords = 0;
      this.lastOutput = "NIL";
      this.lastResultWord = this._nilWord();
      this.traceLog = [];
      this.evalStepCounter = 0;

      this.loadProgram(LISP_PROGRAMS["Symbolic Differentiation (deriv)"]);
    }

    _nilWord() {
      return { cdrCode: CDR_NIL, tag: DTP_NIL, payload: 0 };
    }
    _fixWord(n) {
      return {
        cdrCode: CDR_NORMAL,
        tag: DTP_FIXNUM,
        payload: (Number(n) | 0) & 0x3fffffff,
        signed: Number(n) | 0,
      };
    }
    _symWord(name) {
      const up = String(name).toUpperCase();
      if (up === "NIL") return this._nilWord();
      if (!this.symMap.has(up)) {
        this.symMap.set(up, this.symbols.length);
        this.symbols.push(up);
      }
      return { cdrCode: CDR_NORMAL, tag: DTP_SYMBOL, payload: this.symMap.get(up) };
    }

    encodeWord36Hex(w) {
      if (!w) return "0x000000000";
      // 36-bit word: [35:34]=cdrCode, [33:30]=tag, [29:0]=payload
      const hi6 = ((w.cdrCode & 0x3) << 4) | (w.tag & 0xf);
      const lo30 = ((w.signed !== undefined ? w.signed : w.payload) >>> 0) & 0x3fffffff;
      const big = (BigInt(hi6) << 30n) | BigInt(lo30);
      return "0x" + big.toString(16).toUpperCase().padStart(9, "0");
    }

    _allocCells(count) {
      if (this.freePtr + count > this.fromBase + this.heapHalf) {
        this.collectGarbage();
        if (this.freePtr + count > this.fromBase + this.heapHalf) {
          this.freePtr = this.fromBase;
        }
      }
      const addr = this.freePtr;
      this.freePtr += count;
      this.consAllocated += count;
      return addr;
    }

    // Standard 2-word CONS cell (CDR_NORMAL at addr, explicit CDR word at addr+1)
    cons(carW, cdrW) {
      if (cdrW.tag === DTP_NIL) {
        // Hardware CDR_NIL optimization: 1 single 36-bit word instead of 2!
        const addr = this._allocCells(1);
        this.heap[addr] = {
          cdrCode: CDR_NIL,
          tag: carW.tag,
          payload: carW.payload,
          signed: carW.signed,
          gen: 0,
        };
        this.cdrWordsSaved++;
        return { cdrCode: CDR_NORMAL, tag: DTP_CONS, payload: addr };
      }
      const addr = this._allocCells(2);
      this.heap[addr] = {
        cdrCode: CDR_NORMAL,
        tag: carW.tag,
        payload: carW.payload,
        signed: carW.signed,
        gen: 0,
      };
      this.heap[addr + 1] = {
        cdrCode: CDR_NIL,
        tag: cdrW.tag,
        payload: cdrW.payload,
        signed: cdrW.signed,
        gen: 0,
      };
      return { cdrCode: CDR_NORMAL, tag: DTP_CONS, payload: addr };
    }

    // Contiguous CDR-Coded vector list: N elements stored in N words (50% memory reduction!)
    allocCdrCodedList(words) {
      if (!words.length) return this._nilWord();
      const n = words.length;
      const base = this._allocCells(n);
      for (let i = 0; i < n; i++) {
        const w = words[i];
        this.heap[base + i] = {
          cdrCode: i === n - 1 ? CDR_NIL : CDR_NEXT,
          tag: w.tag,
          payload: w.payload,
          signed: w.signed,
          gen: 0,
        };
      }
      this.cdrWordsSaved += n;
      return { cdrCode: CDR_NORMAL, tag: DTP_CONS, payload: base };
    }

    car(w) {
      this.tagChecks++;
      if (!w || w.tag === DTP_NIL) return this._nilWord();
      if (w.tag !== DTP_CONS)
        throw new Error(`Hardware Tag Trap: CAR on non-CONS tag=${w.tag}`);
      const cell = this.heap[w.payload];
      return {
        cdrCode: CDR_NORMAL,
        tag: cell.tag,
        payload: cell.payload,
        signed: cell.signed,
      };
    }

    cdr(w) {
      this.tagChecks++;
      if (!w || w.tag === DTP_NIL) return this._nilWord();
      if (w.tag !== DTP_CONS)
        throw new Error(`Hardware Tag Trap: CDR on non-CONS tag=${w.tag}`);
      const cell = this.heap[w.payload];
      if (cell.cdrCode === CDR_NIL) return this._nilWord();
      if (cell.cdrCode === CDR_NEXT) {
        return { cdrCode: CDR_NORMAL, tag: DTP_CONS, payload: w.payload + 1 };
      }
      const nextWord = this.heap[w.payload + 1];
      return {
        cdrCode: CDR_NORMAL,
        tag: nextWord.tag,
        payload: nextWord.payload,
        signed: nextWord.signed,
      };
    }

    _listToArray(w) {
      const out = [];
      let cur = w;
      let guard = 0;
      while (cur && cur.tag === DTP_CONS && guard++ < 256) {
        out.push(this.car(cur));
        cur = this.cdr(cur);
      }
      return out;
    }

    tokenize(src) {
      const noComments = String(src).replace(/;[^\r\n]*/g, "");
      const tokens = [];
      const re = /\s*('|\(|\)|[^\s()']+)/g;
      let m;
      while ((m = re.exec(noComments)) !== null) {
        tokens.push(m[1]);
      }
      return tokens;
    }

    parseTokens(tokens) {
      let pos = 0;
      const readExpr = () => {
        if (pos >= tokens.length) return this._nilWord();
        const tok = tokens[pos++];
        if (tok === "'") {
          const quoted = readExpr();
          return this.allocCdrCodedList([this._symWord("QUOTE"), quoted]);
        }
        if (tok === "(") {
          const items = [];
          while (pos < tokens.length && tokens[pos] !== ")") {
            items.push(readExpr());
          }
          if (tokens[pos] === ")") pos++;
          return this.allocCdrCodedList(items);
        }
        if (tok === ")") return this._nilWord();
        if (/^[+-]?\d+$/.test(tok)) return this._fixWord(parseInt(tok, 10));
        return this._symWord(tok);
      };
      const exprs = [];
      while (pos < tokens.length) exprs.push(readExpr());
      return exprs;
    }

    printWord(w, depth = 0) {
      if (!w || w.tag === DTP_NIL) return "NIL";
      if (depth > 16) return "...";
      if (w.tag === DTP_FIXNUM) {
        const v = w.signed !== undefined ? w.signed : w.payload;
        return String(v);
      }
      if (w.tag === DTP_SYMBOL) return this.symbols[w.payload] || "SYM";
      if (w.tag === DTP_CLOSURE) return `#<DTP-CLOSURE ${w.payload}>`;
      if (w.tag === DTP_CONS) {
        const parts = [];
        let cur = w;
        let guard = 0;
        while (cur && cur.tag === DTP_CONS && guard++ < 32) {
          parts.push(this.printWord(this.car(cur), depth + 1));
          cur = this.cdr(cur);
        }
        if (cur && cur.tag !== DTP_NIL) {
          return `(${parts.join(" ")} . ${this.printWord(cur, depth + 1)})`;
        }
        return `(${parts.join(" ")})`;
      }
      return "NIL";
    }

    _isTruthy(w) {
      return Boolean(w && w.tag !== DTP_NIL);
    }

    _fixVal(w) {
      this.tagChecks++;
      if (!w || w.tag !== DTP_FIXNUM) throw new Error("Hardware Fixnum Tag Trap");
      return w.signed !== undefined ? w.signed : w.payload;
    }

    evalExpr(expr, env, depth = 0) {
      if (depth > 96) throw new Error("PDL Stack Overflow");
      this.tagChecks++;
      if (
        !expr ||
        expr.tag === DTP_NIL ||
        expr.tag === DTP_FIXNUM ||
        expr.tag === DTP_CLOSURE
      ) {
        return expr || this._nilWord();
      }
      if (expr.tag === DTP_SYMBOL) {
        const name = this.symbols[expr.payload];
        if (name === "NIL") return this._nilWord();
        if (name === "T") return this._symWord("T");
        for (let e = env; e; e = e.parent) {
          if (e.bindings.has(name)) return e.bindings.get(name);
        }
        if (this.globalEnv.has(name)) return this.globalEnv.get(name);
        throw new Error(`Unbound symbol ${name}`);
      }

      const items = this._listToArray(expr);
      if (!items.length) return this._nilWord();
      const head = items[0];
      const args = items.slice(1);

      if (head.tag === DTP_SYMBOL) {
        const op = this.symbols[head.payload];
        if (op === "QUOTE") return args[0] || this._nilWord();
        if (op === "IF") {
          const cond = this.evalExpr(args[0], env, depth + 1);
          return this._isTruthy(cond)
            ? this.evalExpr(args[1], env, depth + 1)
            : this.evalExpr(args[2], env, depth + 1);
        }
        if (op === "COND") {
          for (const clause of args) {
            const pair = this._listToArray(clause);
            if (!pair.length) continue;
            const test = this.evalExpr(pair[0], env, depth + 1);
            if (this._isTruthy(test)) {
              let res = test;
              for (let i = 1; i < pair.length; i++) {
                res = this.evalExpr(pair[i], env, depth + 1);
              }
              return res;
            }
          }
          return this._nilWord();
        }
        if (op === "LET") {
          const bindList = this._listToArray(args[0]);
          const childEnv = { parent: env, bindings: new Map() };
          for (const b of bindList) {
            const kv = this._listToArray(b);
            if (kv[0] && kv[0].tag === DTP_SYMBOL) {
              childEnv.bindings.set(
                this.symbols[kv[0].payload],
                this.evalExpr(kv[1], env, depth + 1),
              );
            }
          }
          let res = this._nilWord();
          for (let i = 1; i < args.length; i++) {
            res = this.evalExpr(args[i], childEnv, depth + 1);
          }
          return res;
        }
        if (op === "LAMBDA") {
          const params = this._listToArray(args[0]).map((p) => this.symbols[p.payload]);
          const body = args.slice(1);
          const cid = this.closures.length;
          this.closures.push({ params, body, env });
          return { cdrCode: CDR_NORMAL, tag: DTP_CLOSURE, payload: cid };
        }
        if (op === "DEFUN") {
          const fnName = this.symbols[args[0].payload];
          const params = this._listToArray(args[1]).map((p) => this.symbols[p.payload]);
          const body = args.slice(2);
          const cid = this.closures.length;
          this.closures.push({ params, body, env, name: fnName });
          const cw = { cdrCode: CDR_NORMAL, tag: DTP_CLOSURE, payload: cid };
          this.globalEnv.set(fnName, cw);
          return args[0];
        }
      }

      const fnVal =
        head.tag === DTP_SYMBOL &&
        !this.globalEnv.has(this.symbols[head.payload]) &&
        this._isBuiltin(this.symbols[head.payload])
          ? head
          : this.evalExpr(head, env, depth + 1);
      const evalArgs = args.map((a) => this.evalExpr(a, env, depth + 1));
      return this._applyFn(fnVal, evalArgs, depth + 1);
    }

    _isBuiltin(op) {
      return [
        "CAR",
        "CDR",
        "CONS",
        "LIST",
        "ATOM",
        "NULL",
        "CONSP",
        "EQ",
        "=",
        "<",
        ">",
        "+",
        "-",
        "*",
        "1+",
        "1-",
        "MAPCAR",
        "REDUCE",
      ].includes(op);
    }

    _applyFn(fnVal, evalArgs, depth) {
      if (fnVal.tag === DTP_SYMBOL) {
        const op = this.symbols[fnVal.payload];
        if (op === "CAR") return this.car(evalArgs[0]);
        if (op === "CDR") return this.cdr(evalArgs[0]);
        if (op === "CONS")
          return this.cons(
            evalArgs[0] || this._nilWord(),
            evalArgs[1] || this._nilWord(),
          );
        if (op === "LIST") return this.allocCdrCodedList(evalArgs);
        if (op === "ATOM")
          return !evalArgs[0] || evalArgs[0].tag !== DTP_CONS
            ? this._symWord("T")
            : this._nilWord();
        if (op === "NULL")
          return !evalArgs[0] || evalArgs[0].tag === DTP_NIL
            ? this._symWord("T")
            : this._nilWord();
        if (op === "CONSP")
          return evalArgs[0] && evalArgs[0].tag === DTP_CONS
            ? this._symWord("T")
            : this._nilWord();
        if (op === "EQ") {
          const a = evalArgs[0] || this._nilWord();
          const b = evalArgs[1] || this._nilWord();
          const same =
            a.tag === b.tag &&
            (a.tag === DTP_FIXNUM
              ? this._fixVal(a) === this._fixVal(b)
              : a.payload === b.payload);
          return same ? this._symWord("T") : this._nilWord();
        }
        if (op === "=")
          return this._fixVal(evalArgs[0]) === this._fixVal(evalArgs[1])
            ? this._symWord("T")
            : this._nilWord();
        if (op === "<")
          return this._fixVal(evalArgs[0]) < this._fixVal(evalArgs[1])
            ? this._symWord("T")
            : this._nilWord();
        if (op === ">")
          return this._fixVal(evalArgs[0]) > this._fixVal(evalArgs[1])
            ? this._symWord("T")
            : this._nilWord();
        if (op === "+") {
          let sum = 0;
          for (const a of evalArgs) sum += this._fixVal(a);
          return this._fixWord(sum);
        }
        if (op === "-") {
          if (evalArgs.length === 1) return this._fixWord(-this._fixVal(evalArgs[0]));
          let acc = this._fixVal(evalArgs[0]);
          for (let i = 1; i < evalArgs.length; i++) acc -= this._fixVal(evalArgs[i]);
          return this._fixWord(acc);
        }
        if (op === "*") {
          let prod = 1;
          for (const a of evalArgs) prod *= this._fixVal(a);
          return this._fixWord(prod);
        }
        if (op === "1+") return this._fixWord(this._fixVal(evalArgs[0]) + 1);
        if (op === "1-") return this._fixWord(this._fixVal(evalArgs[0]) - 1);
        if (op === "MAPCAR") {
          const fn = evalArgs[0];
          const xs = this._listToArray(evalArgs[1]);
          const mapped = xs.map((item) => this._applyFn(fn, [item], depth + 1));
          return this.allocCdrCodedList(mapped);
        }
        if (op === "REDUCE") {
          const fn = evalArgs[0];
          const xs = this._listToArray(evalArgs[1]);
          if (!xs.length) return this._fixWord(0);
          let acc = xs[0];
          for (let i = 1; i < xs.length; i++) {
            acc = this._applyFn(fn, [acc, xs[i]], depth + 1);
          }
          return acc;
        }
      }
      if (fnVal.tag === DTP_CLOSURE) {
        const clos = this.closures[fnVal.payload];
        const callEnv = { parent: clos.env, bindings: new Map() };
        clos.params.forEach((p, idx) => {
          callEnv.bindings.set(p, evalArgs[idx] || this._nilWord());
        });
        let res = this._nilWord();
        for (const bodyExpr of clos.body) {
          res = this.evalExpr(bodyExpr, callEnv, depth + 1);
        }
        return res;
      }
      throw new Error(`Invalid function call on tag=${fnVal.tag}`);
    }

    // Hardware Cheney Two-Space Copying Garbage Collector with Forwarding Pointers!
    collectGarbage() {
      const usedBefore = this.freePtr - this.fromBase;
      const oldToBase = this.toBase;
      let allocTo = oldToBase;

      const copyGraph = (w) => {
        if (!w || w.tag !== DTP_CONS) return w;
        const srcAddr = w.payload;
        if (srcAddr < this.fromBase || srcAddr >= this.fromBase + this.heapHalf) return w;
        const cell = this.heap[srcAddr];
        if (cell.tag === DTP_FORWARD) {
          return { cdrCode: CDR_NORMAL, tag: DTP_CONS, payload: cell.payload };
        }
        // Gather entire CDR-coded chain starting at srcAddr and re-pack compactly in ToSpace!
        const items = this._listToArray(w);
        if (!items.length) return this._nilWord();
        const dstBase = allocTo;
        allocTo += items.length;
        // Install DTP_FORWARD broken-heart forwarding pointer
        this.heap[srcAddr] = {
          cdrCode: CDR_NORMAL,
          tag: DTP_FORWARD,
          payload: dstBase,
          gen: 1,
        };
        for (let i = 0; i < items.length; i++) {
          const copiedCar = copyGraph(items[i]);
          this.heap[dstBase + i] = {
            cdrCode: i === items.length - 1 ? CDR_NIL : CDR_NEXT,
            tag: copiedCar.tag,
            payload: copiedCar.payload,
            signed: copiedCar.signed,
            gen: 1,
          };
        }
        return { cdrCode: CDR_NORMAL, tag: DTP_CONS, payload: dstBase };
      };

      this.lastResultWord = copyGraph(this.lastResultWord);
      for (const [k, v] of this.globalEnv.entries()) {
        this.globalEnv.set(k, copyGraph(v));
      }
      for (const c of this.closures) {
        c.body = c.body.map((b) => copyGraph(b));
      }

      const oldFrom = this.fromBase;
      this.fromBase = oldToBase;
      this.toBase = oldFrom;
      this.liveWords = allocTo - this.fromBase;
      this.freePtr = allocTo;
      this.lastReclaimed = Math.max(0, usedBefore - this.liveWords);
      this.gcCycles++;
      return {
        gcCycles: this.gcCycles,
        liveWords: this.liveWords,
        reclaimedWords: this.lastReclaimed,
      };
    }

    loadProgram(src) {
      this.src = String(src);
      this.fromBase = 0;
      this.toBase = this.heapHalf;
      this.freePtr = 0;
      this.closures = [];
      this.globalEnv.clear();
      this.tagChecks = 0;
      this.cdrWordsSaved = 0;
      this.consAllocated = 0;
      try {
        const toks = this.tokenize(this.src);
        const exprs = this.parseTokens(toks);
        let res = this._nilWord();
        for (const ex of exprs) {
          res = this.evalExpr(ex, null, 0);
        }
        this.lastResultWord = res;
        this.lastOutput = this.printWord(res);
        this.liveWords = this.freePtr - this.fromBase;
        this.traceLog.unshift(`${this.encodeWord36Hex(res)} => ${this.lastOutput}`);
        if (this.traceLog.length > 8) this.traceLog.pop();
      } catch (err) {
        this.lastOutput = `TRAP: ${err.message}`;
      }
      return this.lastOutput;
    }

    step() {
      this.evalStepCounter++;
      // Allocate ephemeral cons cells & periodically trigger ephemeral copying GC
      const k = (this.evalStepCounter % 9) + 1;
      const sample = this.allocCdrCodedList([this._fixWord(k), this._fixWord(k * k)]);
      const sq = this.car(this.cdr(sample));
      if (this.freePtr - this.fromBase > this.heapHalf * 0.65) {
        this.collectGarbage();
      } else {
        this.liveWords = this.freePtr - this.fromBase;
      }
      return {
        output: this.lastOutput,
        wordHex: this.encodeWord36Hex(this.lastResultWord),
        sampleSq: sq.signed,
        tagChecks: this.tagChecks,
        cdrSaved: this.cdrWordsSaved,
        gcCycles: this.gcCycles,
      };
    }
  }

  // ============================================================================
  // 3. 300 MM MONOLITHIC WAFER-SCALE DATAFLOW & NEUROMORPHIC ENGINE (2024, wse24)
  //    84 Stitched Reticles, 44 GB Single-Cycle SRAM, Wavelet + LIF STDP + Defect Bypass
  // ============================================================================
  class WaferScaleDataflowEngine {
    constructor() {
      this.gridN = 10; // 10x10 representative spatial tile fabric across 84 stitched reticles
      this.mode = "wavelet"; // "wavelet" | "spiking"
      this.sramBandwidthPBs = 21.0; // 21 Petabytes/sec on-wafer SRAM bandwidth
      this.reticleCount = 84;
      this.totalPhysicalCores = 900000;
      this.clockCycles = 0;
      this.waveletsRouted = 0;
      this.spikesFired = 0;
      this.stdpUpdates = 0;
      this.spareReroutes = 0;

      this.tiles = Array.from({ length: this.gridN * this.gridN }, (_, idx) => {
        const r = Math.floor(idx / this.gridN);
        const c = idx % this.gridN;
        return {
          r,
          c,
          reticleId: Math.floor(r / 3) * 4 + Math.floor(c / 3),
          act: 0,
          prevAct: 0,
          vm: 0.15 * ((idx * 7) % 5),
          weight: 0.45 + 0.04 * ((r + c) % 5),
          spike: 0,
          lastSpikeTick: -20,
          defective: false,
          spareActive: false,
          hops: 1,
        };
      });
      // Inject 2 realistic cleanroom particle defects pre-repaired by redundant spare-core fabric!
      this.toggleDefect(2, 6);
      this.toggleDefect(7, 3);
      // Seed initial wavefront packet in NW corner
      this.tiles[11].act = 1.0;
      this.tiles[12].act = 0.75;
    }

    setMode(mode) {
      this.mode = mode === "spiking" ? "spiking" : "wavelet";
      return this.mode;
    }

    toggleDefect(r, c) {
      if (r < 0 || r >= this.gridN || c < 0 || c >= this.gridN) return null;
      const t = this.tiles[r * this.gridN + c];
      t.defective = !t.defective;
      t.spareActive = t.defective; // Hardware redundant spare core & detour mux engages automatically!
      this._recomputeFabricRouting();
      return {
        defective: t.defective,
        defectCount: this.defectCount,
        connectivityOk: this.connectivityOk,
      };
    }

    _recomputeFabricRouting() {
      let defects = 0;
      for (const t of this.tiles) {
        if (t.defective) {
          defects++;
          t.hops = 2; // 1 extra bypass mux hop around defective tile
        } else {
          t.hops = 1;
        }
      }
      this.defectCount = defects;
      this.yieldPct = +(
        ((this.tiles.length - defects) / this.tiles.length) *
        100
      ).toFixed(1);
      // Spare-row fabric maintains 100% logical mesh reachability
      this.connectivityOk = defects < this.tiles.length - 4;
    }

    injectWavefrontPulse(r = 4, c = 4) {
      const idx = Math.max(0, Math.min(99, r * this.gridN + c));
      this.tiles[idx].act = 1.0;
      this.tiles[idx].vm = 1.05;
    }

    step() {
      this.clockCycles++;
      const n = this.gridN;

      if (this.mode === "wavelet") {
        const nextAct = new Float32Array(n * n);
        // Periodic boundary excitation representing streaming token embeddings
        const srcIdx = ((this.clockCycles * 3) % n) * n;
        this.tiles[srcIdx].act = 0.95;

        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const i = r * n + c;
            const tile = this.tiles[i];
            let acc = 0;
            let cnt = 0;
            const dirs = [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ];
            for (const [dr, dc] of dirs) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
                const nb = this.tiles[nr * n + nc];
                // If neighbor is defective, hardware spare-core fabric bypass routes around it seamlessly!
                if (nb.defective) this.spareReroutes++;
                acc += nb.act * nb.weight;
                cnt++;
                this.waveletsRouted++;
              }
            }
            const driven =
              (acc / Math.max(1, cnt)) * 1.12 +
              0.18 * Math.sin(this.clockCycles * 0.25 + (r + c) * 0.5);
            nextAct[i] = Math.max(0, Math.min(1, driven));
          }
        }
        for (let i = 0; i < n * n; i++) {
          this.tiles[i].prevAct = this.tiles[i].act;
          this.tiles[i].act = nextAct[i];
          this.tiles[i].spike = nextAct[i] > 0.72 ? 1 : 0;
        }
      } else {
        // Neuromorphic Event-Driven Leaky Integrate-and-Fire (LIF) + STDP Learning
        const leak = 0.86;
        const vThresh = 0.88;
        const newSpikes = new Uint8Array(n * n);

        // Sensory thalamic input spike train on West edge
        for (let r = 0; r < n; r += 2) {
          const driveRow = (r + (this.clockCycles % 2)) % n;
          this.tiles[driveRow * n].vm += 0.92;
        }

        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const i = r * n + c;
            const t = this.tiles[i];
            let synCurrent = 0;
            if (c > 0 && this.tiles[r * n + (c - 1)].spike) synCurrent += t.weight * 0.58;
            if (r > 0 && this.tiles[(r - 1) * n + c].spike) synCurrent += t.weight * 0.36;
            if (r + 1 < n && this.tiles[(r + 1) * n + c].spike)
              synCurrent += t.weight * 0.28;

            t.vm = t.vm * leak + synCurrent;
            if (t.vm >= vThresh) {
              newSpikes[i] = 1;
              t.vm = 0.05; // Refractory reset
              this.spikesFired++;
              // Spike-Timing-Dependent Plasticity (STDP): causal pre->post potentiates synapse!
              if (c > 0) {
                const pre = this.tiles[r * n + (c - 1)];
                const dtTicks = this.clockCycles - pre.lastSpikeTick;
                if (dtTicks >= 0 && dtTicks <= 4) {
                  t.weight = Math.min(0.95, t.weight + 0.018 * Math.exp(-dtTicks / 2.5));
                  this.stdpUpdates++;
                }
              }
              t.lastSpikeTick = this.clockCycles;
            }
          }
        }
        for (let i = 0; i < n * n; i++) {
          this.tiles[i].spike = newSpikes[i];
          this.tiles[i].act = newSpikes[i] ? 1.0 : this.tiles[i].vm;
        }
      }

      // Compute dynamic power: spiking mode saves ~65% power on silent tiles!
      let activeCount = 0;
      for (const t of this.tiles) if (t.act > 0.35 || t.spike) activeCount++;
      this.activeFraction = +(activeCount / this.tiles.length).toFixed(2);
      this.powerKw =
        this.mode === "spiking"
          ? +(6.5 + 11.5 * this.activeFraction).toFixed(1)
          : +(15.4 + 7.6 * this.activeFraction).toFixed(1);

      return {
        cycles: this.clockCycles,
        mode: this.mode,
        wavelets: this.waveletsRouted,
        spikes: this.spikesFired,
        connectivityOk: this.connectivityOk,
      };
    }
  }

  // ============================================================================
  // 4. TANDEM NONSTOP-16 SHARE-NOTHING FAULT-TOLERANT CLUSTER (1977, tandem77)
  //    Process Pairs + Dual Dynabus X/Y + Mirrored RAID-1 + Jim Gray WAL ACID
  // ============================================================================
  class TandemNonStopCluster {
    constructor() {
      this.cpus = Array.from({ length: 4 }, (_, i) => ({
        id: i,
        name: `CPU ${i}`,
        online: true,
        heartbeats: 0,
        loadPct: 38 + i * 6,
      }));
      this.dynabus = { X: true, Y: true, msgsX: 0, msgsY: 0 };
      this.disks = [
        { id: 0, name: "Disk Vol $DATA-A (Primary)", online: true, lsn: 0 },
        { id: 1, name: "Disk Vol $DATA-B (Mirror)", online: true, lsn: 0 },
      ];
      // 4 Critical NonStop Process Pairs (Primary + passive checkpointed Backup on neighbor CPU)
      this.processPairs = [
        {
          svc: "$ATM-SW",
          primaryCpu: 0,
          backupCpu: 1,
          activeCpu: 0,
          checkpoints: 0,
          failovers: 0,
        },
        {
          svc: "$LEDGER",
          primaryCpu: 1,
          backupCpu: 2,
          activeCpu: 1,
          checkpoints: 0,
          failovers: 0,
        },
        {
          svc: "$CLEAR",
          primaryCpu: 2,
          backupCpu: 3,
          activeCpu: 2,
          checkpoints: 0,
          failovers: 0,
        },
        {
          svc: "$AUDIT",
          primaryCpu: 3,
          backupCpu: 0,
          activeCpu: 3,
          checkpoints: 0,
          failovers: 0,
        },
      ];
      // 8 ACID Bank Accounts @ $125,000 each = exact $1,000,000 invariant!
      this.initialTotalCents = 8 * 12500000;
      this.accounts = new Int32Array(8).fill(12500000);
      this.wal = [];
      this.lsn = 1000;
      this.committedTx = 0;
      this.rolledBackTx = 0;
      this.invariantOk = true;
      this.availabilityPct = 99.999;
    }

    totalLedgerDollars() {
      let sum = 0;
      for (let i = 0; i < this.accounts.length; i++) sum += this.accounts[i];
      return +(sum / 100).toFixed(2);
    }

    _rebalanceProcessPairs() {
      for (const pp of this.processPairs) {
        const curOnline = this.cpus[pp.activeCpu]?.online;
        if (!curOnline) {
          // Instant <1-heartbeat takeover by Backup CPU (or any surviving online CPU)
          if (this.cpus[pp.backupCpu]?.online) {
            pp.activeCpu = pp.backupCpu;
          } else if (this.cpus[pp.primaryCpu]?.online) {
            pp.activeCpu = pp.primaryCpu;
          } else {
            const surv = this.cpus.find((c) => c.online);
            if (surv) pp.activeCpu = surv.id;
          }
          pp.failovers++;
        } else if (pp.activeCpu !== pp.primaryCpu && this.cpus[pp.primaryCpu]?.online) {
          // Re-integrate repaired Primary after checkpoint resync
          pp.activeCpu = pp.primaryCpu;
          pp.checkpoints++;
        }
      }
    }

    toggleCpuFault(cpuIdx) {
      const c = this.cpus[cpuIdx];
      if (!c) return false;
      // Ensure at least 1 CPU stays alive unless user explicitly tests cluster survival
      const onlineCount = this.cpus.filter((x) => x.online).length;
      if (c.online && onlineCount <= 1) return true;
      c.online = !c.online;
      c.loadPct = c.online ? 44 : 0;
      this._rebalanceProcessPairs();
      return c.online;
    }

    toggleBusFault(busName) {
      const k = busName === "Y" ? "Y" : "X";
      const other = k === "X" ? "Y" : "X";
      if (this.dynabus[k] && !this.dynabus[other]) return true; // Keep at least 1 Dynabus rail up
      this.dynabus[k] = !this.dynabus[k];
      return this.dynabus[k];
    }

    toggleDiskFault(diskIdx) {
      const d = this.disks[diskIdx];
      if (!d) return false;
      const other = this.disks[1 - diskIdx];
      if (d.online && !other.online) return true;
      d.online = !d.online;
      return d.online;
    }

    // Simulates a mid-flight CPU crash AFTER debiting source account, proving WAL UNDO rollback + Backup replay!
    injectInFlightCrash() {
      const src = 0;
      const dst = 3;
      const amountCents = 250000; // $2,500.00
      const crashLsn = ++this.lsn;
      const prevSrc = this.accounts[src];
      // Mutate dirty page mid-flight, then crash Primary CPU 0 BEFORE COMMIT record!
      this.accounts[src] -= amountCents;
      this.wal.unshift({
        lsn: crashLsn,
        state: "ABORT->UNDO",
        from: src,
        to: dst,
        dollars: amountCents / 100,
      });
      // Backup process on CPU 1 detects missing COMMIT, runs Jim Gray WAL UNDO, restores exact balance, and re-executes cleanly!
      this.accounts[src] = prevSrc;
      this.rolledBackTx++;
      if (this.cpus[0].online && this.cpus.filter((c) => c.online).length > 1) {
        this.cpus[0].online = false;
        this._rebalanceProcessPairs();
      }
      let sum = 0;
      for (let i = 0; i < this.accounts.length; i++) sum += this.accounts[i];
      this.invariantOk = sum === this.initialTotalCents;
      return { rolledBackLsn: crashLsn, invariantOk: this.invariantOk };
    }

    step() {
      // Heartbeats across active Dynabus rails
      for (const c of this.cpus) {
        if (c.online) c.heartbeats++;
      }
      for (const pp of this.processPairs) {
        if (this.dynabus.X) this.dynabus.msgsX++;
        if (this.dynabus.Y) this.dynabus.msgsY++;
        pp.checkpoints++;
      }

      // Execute atomic ACID transfer via TMF (Transaction Monitoring Facility) + WAL
      const from = this.committedTx % 8;
      const to = (from + 3) % 8;
      const cents = 45000 + ((this.committedTx * 13700) % 90000);
      const txLsn = ++this.lsn;

      if (
        this.accounts[from] >= cents &&
        (this.disks[0].online || this.disks[1].online)
      ) {
        // 1. Write-Ahead Log record flushed to surviving mirrored disk(s) FIRST
        if (this.disks[0].online) this.disks[0].lsn = txLsn;
        if (this.disks[1].online) this.disks[1].lsn = txLsn;
        // 2. Apply atomic debit + credit
        this.accounts[from] -= cents;
        this.accounts[to] += cents;
        this.committedTx++;
        this.wal.unshift({
          lsn: txLsn,
          state: "COMMIT",
          from,
          to,
          dollars: +(cents / 100).toFixed(2),
        });
        if (this.wal.length > 10) this.wal.pop();
      }

      let sum = 0;
      for (let i = 0; i < this.accounts.length; i++) sum += this.accounts[i];
      this.invariantOk = sum === this.initialTotalCents;
      return {
        lsn: this.lsn,
        committedTx: this.committedTx,
        rolledBackTx: this.rolledBackTx,
        totalDollars: this.totalLedgerDollars(),
        invariantOk: this.invariantOk,
      };
    }
  }

  // ============================================================================
  // 5. DUAL-OPTERON x86-64 HYPERVISOR, ccNUMA & C10K BLADE SERVER (2004, blade04)
  //    2D Nested Page Tables (EPT/RVI) vs Trap-and-Emulate + KSM + O(1) epoll
  // ============================================================================
  class HypervisorNumaServer {
    constructor() {
      this.vmmMode = "ept_vtx"; // "ept_vtx" | "trap_emulate"
      this.ioMode = "epoll"; // "epoll" | "select"
      this.numaBalancing = true;
      this.totalHostRamMB = 16384; // 16 GB Dual-Channel Registered ECC DDR
      this.connections = 10000; // C10K concurrent TCP connections!
      this.activeSockets = 64;

      this.nodes = [
        {
          id: 0,
          name: "Socket 0 (Opteron 250)",
          cores: [0, 1, 2, 3],
          localHits: 0,
          remoteHops: 0,
          ramUsedMB: 5800,
        },
        {
          id: 1,
          name: "Socket 1 (Opteron 250)",
          cores: [4, 5, 6, 7],
          localHits: 0,
          remoteHops: 0,
          ramUsedMB: 5400,
        },
      ];
      this.vms = [
        {
          id: 0,
          name: "VM0: Nginx-Edge",
          vcpus: 2,
          homeNode: 0,
          runNode: 0,
          allocMB: 4096,
          workingMB: 2900,
          vpid: 0x11,
        },
        {
          id: 1,
          name: "VM1: Postgres-OLTP",
          vcpus: 2,
          homeNode: 0,
          runNode: 0,
          allocMB: 8192,
          workingMB: 6200,
          vpid: 0x22,
        },
        {
          id: 2,
          name: "VM2: Memcached",
          vcpus: 2,
          homeNode: 1,
          runNode: 1,
          allocMB: 6144,
          workingMB: 4300,
          vpid: 0x33,
        },
        {
          id: 3,
          name: "VM3: JBoss-App",
          vcpus: 2,
          homeNode: 1,
          runNode: 0,
          allocMB: 6144,
          workingMB: 4100,
          vpid: 0x44,
        },
      ];
      // 2D Nested Page Table cache (VPID -> gVPN -> hPFN)
      this.nestedTlb = new Map();
      this.tlbHits = 0;
      this.tlb2dWalks = 0;
      this.vmExits = 0;
      this.ksmSavedMB = 3120;
      this.balloonReclaimedMB = 1840;
      this.ticks = 0;
      this.step();
    }

    setVmmMode(mode) {
      this.vmmMode = mode === "trap_emulate" ? "trap_emulate" : "ept_vtx";
      this.step();
      return this.vmmMode;
    }

    setIoMode(mode) {
      this.ioMode = mode === "select" ? "select" : "epoll";
      this.step();
      return this.ioMode;
    }

    // Genuine 2D Nested Page Table translation: gVA -> (4-level Guest PT) -> gPA -> (4-level Host EPT/RVI) -> hPA
    translate2dAddress(vmId, gVa) {
      const vm = this.vms[vmId % this.vms.length];
      const gVpn = (gVa >>> 12) & 0xfffff;
      const key = `${vm.vpid}:${gVpn}`;
      if (this.nestedTlb.has(key)) {
        this.tlbHits++;
        return {
          hPa: (this.nestedTlb.get(key) << 12) | (gVa & 0xfff),
          memRefs: 1,
          tlbHit: true,
        };
      }
      // Cold 2D walk: (4 guest levels * (4 host EPT levels + 1)) + 4 final host EPT = up to 24 page-table memory accesses!
      this.tlb2dWalks++;
      const hPfn =
        ((vm.vpid * 4099 + gVpn * 131) & 0x3ffff) + (vm.homeNode ? 0x40000 : 0x10000);
      this.nestedTlb.set(key, hPfn);
      if (this.nestedTlb.size > 128) {
        const firstKey = this.nestedTlb.keys().next().value;
        this.nestedTlb.delete(firstKey);
      }
      if (this.vmmMode === "trap_emulate") {
        // Shadow page table fault forces expensive #PF VM-Exit!
        this.vmExits += 4;
      }
      return { hPa: (hPfn << 12) | (gVa & 0xfff), memRefs: 24, tlbHit: false };
    }

    step() {
      this.ticks++;
      // Optional automatic NUMA scheduler affinity alignment
      if (this.numaBalancing) {
        this.vms[3].runNode = this.vms[3].homeNode;
      } else {
        this.vms[3].runNode = 0; // Cross-socket remote HT hop!
      }

      // Perform representative guest virtual memory translations
      for (let i = 0; i < 4; i++) {
        const addr = ((this.ticks + i * 7) % 24) * 4096 + 0x180;
        this.translate2dAddress(i, addr);
        const vm = this.vms[i];
        if (vm.runNode === vm.homeNode) {
          this.nodes[vm.runNode].localHits += 12;
        } else {
          this.nodes[vm.runNode].remoteHops += 12;
        }
      }

      if (this.vmmMode === "trap_emulate") {
        this.vmExits += 28; // Privileged CR3/invlpg/ring-compression traps
        this.avgExitCycles = 1840;
      } else {
        this.vmExits += 3; // Hardware VT-x / AMD-V + RVI handles page faults in guest!
        this.avgExitCycles = 190;
      }

      const logicalAllocatedMB = this.vms.reduce((s, v) => s + v.allocMB, 0); // 24,576 MB
      const rawWorkingMB = this.vms.reduce((s, v) => s + v.workingMB, 0);
      this.ksmSavedMB = 2950 + ((this.ticks * 37) % 420);
      this.effectiveHostRamMB = Math.max(
        4096,
        rawWorkingMB - this.ksmSavedMB - this.balloonReclaimedMB,
      );
      this.overcommitRatio = +(logicalAllocatedMB / this.totalHostRamMB).toFixed(2);

      const localTot = this.nodes[0].localHits + this.nodes[1].localHits;
      const remTot = this.nodes[0].remoteHops + this.nodes[1].remoteHops;
      const remoteFrac = remTot / Math.max(1, localTot + remTot);
      this.avgMemLatencyNs = +(65 * (1 - remoteFrac) + 112 * remoteFrac).toFixed(1);

      // C10K Network Event Loop: O(1) epoll readiness vs O(N) linear descriptor scan
      this.descriptorScansPerTick =
        this.ioMode === "epoll" ? this.activeSockets : this.connections;
      const vmmFactor = this.vmmMode === "ept_vtx" ? 1.0 : 0.56;
      this.c10kReqPerSec = Math.round(
        (this.ioMode === "epoll" ? 148000 : 19400) * vmmFactor,
      );

      return {
        vmmMode: this.vmmMode,
        ioMode: this.ioMode,
        c10kReqPerSec: this.c10kReqPerSec,
        avgMemLatencyNs: this.avgMemLatencyNs,
        overcommitRatio: this.overcommitRatio,
      };
    }
  }

  // ============================================================================
  // 6. KUNG-LEISERSON 2D VLSI SYSTOLIC ARRAY (1982, systolic82)
  //    Cycle-Accurate 4x4 Skewed-Wavefront MAC Grid Computing Exact C = A x B
  // ============================================================================
  const SYSTOLIC_PRESETS = {
    "Discrete Cosine / Edge Convolution": {
      A: [
        [2, 1, 0, -1],
        [1, 3, 1, 0],
        [0, 1, 2, 1],
        [-1, 0, 1, 2],
      ],
      B: [
        [1, 2, 1, 0],
        [0, 1, 2, 1],
        [2, 0, 1, 2],
        [1, 1, 0, 3],
      ],
    },
    "Identity & Permutation Verification": {
      A: [
        [4, 7, 2, 9],
        [1, 5, 8, 3],
        [6, 0, 4, 2],
        [3, 9, 1, 7],
      ],
      B: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ],
    },
    "Homogeneous 3D Transform Matrix": {
      A: [
        [2, 0, 0, 3],
        [0, 2, 0, 5],
        [0, 0, 2, -1],
        [0, 0, 0, 1],
      ],
      B: [
        [1, 0, 1, 2],
        [0, 1, 0, 4],
        [-1, 0, 1, 1],
        [0, 0, 0, 1],
      ],
    },
  };

  class SystolicArrayEngine {
    constructor() {
      this.N = 4;
      this.presetNames = Object.keys(SYSTOLIC_PRESETS);
      this.dataflowMode = "output_stationary"; // "output_stationary" | "weight_stationary"
      this.pes = Array.from({ length: 16 }, (_, idx) => ({
        r: Math.floor(idx / 4),
        c: idx % 4,
        aIn: 0,
        bIn: 0,
        weight: 0,
        acc: 0,
        active: false,
      }));
      this.totalMacs = 0;
      this.sramReads = 0;
      this.loadPreset(this.presetNames[0]);
    }

    setDataflowMode(mode) {
      this.dataflowMode =
        mode === "weight_stationary" ? "weight_stationary" : "output_stationary";
      this.resetWavefront();
      return this.dataflowMode;
    }

    loadPreset(name) {
      const p = SYSTOLIC_PRESETS[name] || SYSTOLIC_PRESETS[this.presetNames[0]];
      this.presetName = name in SYSTOLIC_PRESETS ? name : this.presetNames[0];
      this.A = p.A.map((row) => row.slice());
      this.B = p.B.map((row) => row.slice());
      // Exact reference matrix product expectedC = A * B
      this.expectedC = Array.from({ length: 4 }, (_, i) =>
        Array.from({ length: 4 }, (__, j) => {
          let s = 0;
          for (let k = 0; k < 4; k++) s += this.A[i][k] * this.B[k][j];
          return s;
        }),
      );
      this.resetWavefront();
    }

    resetWavefront() {
      this.cycle = 0;
      this.completedPasses = 0;
      this.verifiedExact = false;
      this.outC = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
      for (const pe of this.pes) {
        pe.aIn = 0;
        pe.bIn = 0;
        pe.acc = 0;
        pe.active = false;
        pe.weight = this.B[pe.r][pe.c];
      }
    }

    // Runs a complete 10-beat wavefront pass cleanly and verifies C == A * B
    runFullPass() {
      this.resetWavefront();
      while (this.cycle < 10) {
        this.step();
      }
      return { outC: this.outC, verifiedExact: this.verifiedExact };
    }

    step() {
      // Total wavefront beats for 4x4 skewed systolic array = 3*N - 2 = 10 cycles (t = 0..9)
      if (this.cycle >= 10) {
        this.resetWavefront();
      }
      const t = this.cycle;

      if (this.dataflowMode === "output_stationary") {
        // At beat t, PE(i, j) receives A[i][k] & B[k][j] where k = t - i - j (diagonal wavefront i + j + k = t!)
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            const pe = this.pes[i * 4 + j];
            const k = t - i - j;
            if (k >= 0 && k < 4) {
              pe.aIn = this.A[i][k];
              pe.bIn = this.B[k][j];
              pe.acc += pe.aIn * pe.bIn;
              pe.active = true;
              this.outC[i][j] = pe.acc;
              this.totalMacs++;
              if (j === 0) this.sramReads++;
              if (i === 0) this.sramReads++;
            } else {
              pe.aIn = 0;
              pe.bIn = 0;
              pe.active = false;
            }
          }
        }
      } else {
        // Weight-Stationary (TPU v1 style): PE(k, j) holds stationary B[k][j]; row A[m][k] flows East, partial sum flows South!
        for (let k = 0; k < 4; k++) {
          for (let j = 0; j < 4; j++) {
            const pe = this.pes[k * 4 + j];
            const m = t - k - j; // output row index m in 0..3
            if (m >= 0 && m < 4) {
              pe.aIn = this.A[m][k];
              pe.bIn = pe.weight;
              const prod = pe.aIn * pe.weight;
              this.outC[m][j] += prod;
              pe.acc = this.outC[m][j];
              pe.active = true;
              this.totalMacs++;
              if (j === 0) this.sramReads++;
            } else {
              pe.aIn = 0;
              pe.active = false;
            }
          }
        }
      }

      this.cycle++;
      if (this.cycle === 10) {
        let exact = true;
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            if (this.outC[i][j] !== this.expectedC[i][j]) exact = false;
          }
        }
        this.verifiedExact = exact;
        this.completedPasses++;
      }

      // Naive register-starved core needs 3*N^3 = 192 memory accesses vs 2*N^2 = 32 boundary SRAM reads!
      this.reuseFactor = 6.0;
      return {
        cycle: this.cycle,
        verifiedExact: this.verifiedExact,
        totalMacs: this.totalMacs,
        out00: this.outC[0][0],
      };
    }
  }

  // ============================================================================
  // 7. RIKEN / FUJITSU FUGAKU A64FX SVE & 6D TOFUD SUPERCOMPUTER (2020, fugaku20)
  //    512-Bit Predicated ARM SVE + 4x HBM2 CMGs (1 TB/s) + 6D TofuD + HPCG CG
  // ============================================================================
  class FugakuSveTofuEngine {
    constructor() {
      this.vecLengthBits = 512; // 8x FP64 lanes per SVE vector register Z0..Z31
      this.lanes = 8;
      this.problemLen = 29; // Non-multiple-of-8 length proving SVE WHILELT tail predication!
      this.workload = "hpcg"; // "hpcg" (Sparse Conjugate Gradient) | "hpl" (Dense FP64 LU)
      this.predicateMask = new Uint8Array(8).fill(1);
      this.zVecOut = new Float64Array(8);

      // 4 Core Memory Groups (CMG 0..3): 12 compute + 1 OS assistant core + HBM2 stack (256 GB/s each = 1,024 GB/s)
      this.cmgs = Array.from({ length: 4 }, (_, i) => ({
        id: i,
        computeCores: 12,
        assistantCore: 1,
        hbmBwGBs: 256,
        utilPct: 84,
      }));
      // 6D TofuD Torus Coordinate (X, Y, Z, A in {0,1}, B in {0,1,2}, C in {0,1})
      this.srcCoord = [2, 1, 3, 0, 1, 0];
      this.dstCoord = [7, 4, 6, 1, 2, 1];
      this.tofuDims = [12, 8, 8, 2, 3, 2];
      this.linkFault = false;

      // Live 8-point Sparse SPD system A*x = b solved via Conjugate Gradient (HPCG benchmark!)
      this._initConjugateGradient();
      this._computeTofuRoute();
      this.step();
    }

    _initConjugateGradient() {
      const n = 8;
      this.cgX = new Float64Array(n);
      this.cgB = Float64Array.from([4, 2, 3, 5, 2, 4, 3, 5]);
      // Tridiagonal SPD stencil matrix: diag = 4, off-diag = -1
      const applyA = (v) => {
        const y = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          y[i] = 4 * v[i] - (i > 0 ? v[i - 1] : 0) - (i + 1 < n ? v[i + 1] : 0);
        }
        return y;
      };
      this._applyA = applyA;
      const ax = applyA(this.cgX);
      this.cgR = new Float64Array(n);
      this.cgP = new Float64Array(n);
      let rr = 0;
      for (let i = 0; i < n; i++) {
        this.cgR[i] = this.cgB[i] - ax[i];
        this.cgP[i] = this.cgR[i];
        rr += this.cgR[i] * this.cgR[i];
      }
      this.cgResidual = Math.sqrt(rr);
      this.cgIter = 0;
    }

    setWorkload(w) {
      this.workload = w === "hpl" ? "hpl" : "hpcg";
      this.step();
      return this.workload;
    }

    setProblemLength(len) {
      this.problemLen = Math.max(9, Math.min(64, Number(len) || 29));
      this._updateSveMask();
    }

    _updateSveMask() {
      const tailOffset = Math.floor((this.problemLen - 1) / this.lanes) * this.lanes;
      let activeLanes = 0;
      for (let l = 0; l < this.lanes; l++) {
        const idx = tailOffset + l;
        const pred = idx < this.problemLen ? 1 : 0; // Hardware P0 predicate bit!
        this.predicateMask[l] = pred;
        if (pred) {
          this.zVecOut[l] = +(1.25 * (idx + 1) + 0.5).toFixed(2);
          activeLanes++;
        } else {
          this.zVecOut[l] = 0; // Masked off safely without fault or scalar remainder loop!
        }
      }
      this.activeSveLanes = activeLanes;
    }

    toggleTofuFault() {
      this.linkFault = !this.linkFault;
      this._computeTofuRoute();
      return this.linkFault;
    }

    _computeTofuRoute() {
      let hops = 0;
      this.axisDeltas = [];
      for (let d = 0; d < 6; d++) {
        const L = this.tofuDims[d];
        const diff = Math.abs(this.dstCoord[d] - this.srcCoord[d]);
        const torusDist = Math.min(diff, L - diff);
        this.axisDeltas.push(torusDist);
        hops += torusDist;
      }
      // 6D TofuD routes around a failed link via orthogonal B/C plane detour (+2 hops, zero deadlock!)
      this.tofuHops = this.linkFault ? hops + 2 : hops;
      this.activeRails = this.linkFault ? 5 : 6;
    }

    step() {
      // 1. Predicated ARM SVE WHILELT strip-mine step over problemLen
      this._updateSveMask();

      // 2. Advance 1 real Conjugate Gradient iteration on sparse tridiagonal matrix
      if (this.cgIter >= 10) {
        this._initConjugateGradient();
      }
      const Ap = this._applyA(this.cgP);
      let rrOld = 0;
      let pAp = 0;
      for (let i = 0; i < 8; i++) {
        rrOld += this.cgR[i] * this.cgR[i];
        pAp += this.cgP[i] * Ap[i];
      }
      if (pAp > 1e-12) {
        const alpha = rrOld / pAp;
        let rrNew = 0;
        for (let i = 0; i < 8; i++) {
          this.cgX[i] += alpha * this.cgP[i];
          this.cgR[i] -= alpha * Ap[i];
          rrNew += this.cgR[i] * this.cgR[i];
        }
        const beta = rrNew / Math.max(1e-15, rrOld);
        for (let i = 0; i < 8; i++) {
          this.cgP[i] = this.cgR[i] + beta * this.cgP[i];
        }
        this.cgResidual = Math.sqrt(rrNew);
        this.cgIter++;
      }

      if (this.workload === "hpcg") {
        this.achievedHbmGBs = 842; // 82.2% of 1,024 GB/s HBM2 Stream Triad / HPCG ceiling!
        this.systemPetaflops = 16.0; // World #1 HPCG (16.0 PFLOPS sparse!)
        this.arithmeticIntensity = 0.22; // FLOP/Byte (memory-bandwidth bound)
      } else {
        this.achievedHbmGBs = 490;
        this.systemPetaflops = 442.0; // World #1 TOP500 HPL (442 PFLOPS FP64!)
        this.arithmeticIntensity = 12.8; // Compute-bound DGEMM
      }
      this._computeTofuRoute();

      return {
        cgIter: this.cgIter,
        cgResidual: this.cgResidual,
        activeSveLanes: this.activeSveLanes,
        tofuHops: this.tofuHops,
        systemPetaflops: this.systemPetaflops,
      };
    }
  }

  // ============================================================================
  // 8. LOSS-DIVINCENZO 28Si/SiGe QUANTUM-DOT SPIN QPU (1998/2024, qspin)
  //    Exact 4-Spin Statevector + Heisenberg Exchange sqrt(SWAP)/CNOT + PSB Readout
  // ============================================================================
  class SiliconSpinDotQpu {
    constructor() {
      this.nQubits = 4;
      this.dim = 1 << this.nQubits; // 16 complex statevector amplitudes
      this.re = new Float64Array(this.dim);
      this.im = new Float64Array(this.dim);
      this.si29Ppm = 50; // Isotopically purified 28Si (50 ppm residual 29Si nuclear spins vs 46,700 ppm natural Si)
      this.cryoTempK = 1.2; // "Hot-qubit" 1.2 K pumped-4He cryo-CMOS stage!
      this.gateLog = [];
      this.shots = 0;
      this.resetState();
      this.runBellPsbDemo();
    }

    resetState() {
      this.re.fill(0);
      this.im.fill(0);
      this.re[0] = 1.0; // |0000> = |up, up, up, up>
      this.gateLog = [];
      this._updateMetrics();
    }

    setSi29Ppm(ppm) {
      this.si29Ppm = Math.max(50, Math.min(47000, Number(ppm) || 50));
      this._updateMetrics();
      return { t2StarUs: this.t2StarUs, twoQubitFidelity: this.twoQubitFidelity };
    }

    // Apply exact single-spin 2x2 unitary [[u00, u01], [u10, u11]] via EDSR cobalt micromagnet
    _apply1Q(q, u00r, u00i, u01r, u01i, u10r, u10i, u11r, u11i) {
      const bit = 1 << q;
      for (let i = 0; i < this.dim; i++) {
        if ((i & bit) !== 0) continue;
        const j = i | bit;
        const r0 = this.re[i];
        const m0 = this.im[i];
        const r1 = this.re[j];
        const m1 = this.im[j];

        this.re[i] = u00r * r0 - u00i * m0 + (u01r * r1 - u01i * m1);
        this.im[i] = u00r * m0 + u00i * r0 + (u01r * m1 + u01i * r1);
        this.re[j] = u10r * r0 - u10i * m0 + (u11r * r1 - u11i * m1);
        this.im[j] = u10r * m0 + u10i * r0 + (u11r * m1 + u11i * r1);
      }
    }

    applyRx(q, theta, record = true) {
      const c = Math.cos(theta / 2);
      const s = Math.sin(theta / 2);
      this._apply1Q(q, c, 0, 0, -s, 0, -s, c, 0);
      if (record) this.gateLog.push(`EDSR Rx(${q}, ${(theta / Math.PI).toFixed(2)}pi)`);
      this._updateMetrics();
    }

    applyRy(q, theta, record = true) {
      const c = Math.cos(theta / 2);
      const s = Math.sin(theta / 2);
      this._apply1Q(q, c, 0, -s, 0, s, 0, c, 0);
      if (record) this.gateLog.push(`EDSR Ry(${q}, ${(theta / Math.PI).toFixed(2)}pi)`);
      this._updateMetrics();
    }

    applyRz(q, theta, record = true) {
      const c = Math.cos(theta / 2);
      const s = Math.sin(theta / 2);
      this._apply1Q(q, c, -s, 0, 0, 0, 0, c, s);
      if (record) this.gateLog.push(`Zeeman Rz(${q}, ${(theta / Math.PI).toFixed(2)}pi)`);
      this._updateMetrics();
    }

    applyHadamard(q) {
      const inv = Math.SQRT1_2;
      this._apply1Q(q, inv, 0, inv, 0, inv, 0, -inv, 0);
      this.gateLog.push(`EDSR H(Q${q})`);
      this._updateMetrics();
    }

    // Exact Loss-DiVincenzo Heisenberg Exchange Gate: U_ex(theta) = exp(-i * (theta/4) * (XX + YY + ZZ))
    // Up to global phase exp(-i*theta/4): |00>->|00>, |11>->|11>, and on {|01>, |10>}:
    //   exp(i*theta/2) * [[cos(theta/2), -i*sin(theta/2)], [-i*sin(theta/2), cos(theta/2)]]
    // At theta = pi/2, this is exact sqrt(SWAP)! At theta = pi, this is exact SWAP!
    applyExchange(qA, qB, theta = Math.PI / 2, label = "sqrt(SWAP)") {
      if (qA === qB) return;
      const bA = 1 << qA;
      const bB = 1 << qB;
      const half = theta / 2;
      // Include exact exp(i*half) factor relative to |00>, |11>:
      // diag = exp(i*half)*cos(half) = cos^2(half) + i*sin(half)cos(half)
      // off  = exp(i*half)*(-i*sin(half)) = sin^2(half) - i*sin(half)cos(half)
      const ch = Math.cos(half);
      const sh = Math.sin(half);
      const dRe = ch * ch;
      const dIm = sh * ch;
      const oRe = sh * sh;
      const oIm = -sh * ch;

      for (let idx = 0; idx < this.dim; idx++) {
        // Process each {|...0...1...>, |...1...0...>} pair once
        if ((idx & bA) === 0 && (idx & bB) !== 0) {
          const mate = (idx | bA) & ~bB;
          const r1 = this.re[idx];
          const i1 = this.im[idx];
          const r2 = this.re[mate];
          const i2 = this.im[mate];

          this.re[idx] = dRe * r1 - dIm * i1 + (oRe * r2 - oIm * i2);
          this.im[idx] = dRe * i1 + dIm * r1 + (oRe * i2 + oIm * r2);
          this.re[mate] = oRe * r1 - oIm * i1 + (dRe * r2 - dIm * i2);
          this.im[mate] = oRe * i1 + oIm * r1 + (dRe * i2 + dIm * r2);
        }
      }
      if (label) this.gateLog.push(`J-Gate ${label}(Q${qA},Q${qB})`);
      this._updateMetrics();
    }

    // Exact Loss-DiVincenzo (1998, Phys. Rev. A 57, 120) CNOT synthesis from Heisenberg exchange pulses!
    // Sequence: H(tgt) -> U_ex(pi/2) -> Rz(ctrl, pi) -> U_ex(3*pi/2) -> Rz(ctrl, -pi/2) & Rz(tgt, pi/2) -> U_ex(pi) -> H(tgt)
    // Yields exact -i * CNOT(ctrl -> tgt) to machine precision!
    applyCnotViaExchange(ctrl, tgt) {
      const inv = Math.SQRT1_2;
      this._apply1Q(tgt, inv, 0, inv, 0, inv, 0, -inv, 0);
      this.applyExchange(ctrl, tgt, 0.5 * Math.PI, null);
      this.applyRz(ctrl, Math.PI, false);
      this.applyExchange(ctrl, tgt, 1.5 * Math.PI, null);
      this.applyRz(ctrl, -0.5 * Math.PI, false);
      this.applyRz(tgt, 0.5 * Math.PI, false);
      this.applyExchange(ctrl, tgt, Math.PI, null);
      this._apply1Q(tgt, inv, 0, inv, 0, inv, 0, -inv, 0);
      this.gateLog.push(`Exchange-CNOT(Q${ctrl}->Q${tgt})`);
      this._updateMetrics();
    }

    // Prepare Singlet |Psi-> = (|01> - |10>)/sqrt(2) to demonstrate Pauli Spin Blockade (PSB) 100% tunneling!
    prepareSingletPair() {
      this.resetState();
      this.applyRx(0, Math.PI, false); // |1> on Q0
      this.applyRx(1, Math.PI, false); // |1> on Q1 -> |1100>
      this.applyHadamard(0); // (|0> - |1>)/sqrt(2) x |1>
      this.applyCnotViaExchange(0, 1); // (|01> - |10>)/sqrt(2) exact Singlet |Psi->!
      this.gateLog = ["Init |Psi-> Singlet via EDSR + Exchange-CNOT"];
      this._updateMetrics();
      return { singletProb: this.psbSingletProb };
    }

    // Prepare Bell |Phi+> = (|00> + |11>)/sqrt(2) + 4-spin GHZ option
    runBellPsbDemo() {
      this.resetState();
      this.applyHadamard(0);
      this.applyCnotViaExchange(0, 1);
      this._updateMetrics();
      return { bellFidelity: this.bellPhiPlusProb, psbSingletProb: this.psbSingletProb };
    }

    runFourSpinGhz() {
      this.resetState();
      this.applyHadamard(0);
      this.applyCnotViaExchange(0, 1);
      this.applyCnotViaExchange(1, 2);
      this.applyCnotViaExchange(2, 3);
      this._updateMetrics();
      return { ghzCoherence: +(this.probs[0] + this.probs[15]).toFixed(4) };
    }

    _updateMetrics() {
      // Isotopic 29Si nuclear-spin Overhauser hyperfine bath physics:
      // Natural Si (46,700 ppm 29Si) gives T2* ~ 1.2 us; purified 50 ppm 28Si gives T2* ~ 36.5 us!
      this.t2StarUs = +(258 / Math.sqrt(this.si29Ppm)).toFixed(2);
      this.t2HahnMs = +(1.8 * Math.sqrt(800 / this.si29Ppm)).toFixed(2);
      const tGateUs = 0.025; // 25 ns exchange gate
      const dephaseLoss = Math.pow(tGateUs / this.t2StarUs, 2) * 45;
      this.twoQubitFidelity = +Math.max(
        0.85,
        Math.min(0.9988, 0.9988 - dephaseLoss),
      ).toFixed(4);

      this.probs = new Float64Array(this.dim);
      for (let i = 0; i < this.dim; i++) {
        this.probs[i] = this.re[i] * this.re[i] + this.im[i] * this.im[i];
      }

      // Pauli Spin Blockade (PSB) readout on adjacent dots (Q0, Q1):
      // Singlet |S> = (|01> - |10>)/sqrt(2) tunnels into (0,2) charge state; Triplets T+, T-, T0 are Pauli-blocked!
      let singletProb = 0;
      let bellProb = 0;
      for (let rest = 0; rest < 4; rest++) {
        const base = rest << 2;
        const i00 = base | 0;
        const i10 = base | 1; // Q0=1, Q1=0
        const i01 = base | 2; // Q0=0, Q1=1
        const i11 = base | 3;
        // |( <01| - <10| ) / sqrt(2) |psi>|^2
        const sRe = (this.re[i01] - this.re[i10]) * Math.SQRT1_2;
        const sIm = (this.im[i01] - this.im[i10]) * Math.SQRT1_2;
        singletProb += sRe * sRe + sIm * sIm;

        // |( <00| + <11| ) / sqrt(2) |psi>|^2
        const bRe = (this.re[i00] + this.re[i11]) * Math.SQRT1_2;
        const bIm = (this.im[i00] + this.im[i11]) * Math.SQRT1_2;
        bellProb += bRe * bRe + bIm * bIm;
      }
      this.psbSingletProb = +Math.min(1, singletProb).toFixed(4);
      this.psbBlockedTripletProb = +Math.max(0, 1 - this.psbSingletProb).toFixed(4);
      this.bellPhiPlusProb = +Math.min(1, bellProb * this.twoQubitFidelity).toFixed(4);

      // Compute reduced 1-qubit Bloch vectors <sigma_x, sigma_y, sigma_z> for each spin dot Q0..Q3
      this.bloch = Array.from({ length: 4 }, (_, q) => {
        const bit = 1 << q;
        let bx = 0;
        let by = 0;
        let bz = 0;
        for (let i = 0; i < this.dim; i++) {
          const p = this.probs[i];
          bz += (i & bit) === 0 ? p : -p;
          if ((i & bit) === 0) {
            const j = i | bit;
            bx += 2 * (this.re[i] * this.re[j] + this.im[i] * this.im[j]);
            by += 2 * (this.re[i] * this.im[j] - this.im[i] * this.re[j]);
          }
        }
        return { x: +bx.toFixed(3), y: +by.toFixed(3), z: +bz.toFixed(3) };
      });
    }

    step() {
      this.shots++;
      this._updateMetrics();
      return {
        shots: this.shots,
        t2StarUs: this.t2StarUs,
        twoQubitFidelity: this.twoQubitFidelity,
        psbSingletProb: this.psbSingletProb,
        bellPhiPlusProb: this.bellPhiPlusProb,
      };
    }
  }

  const exportsMap = {
    ENIAC_PRESETS,
    EniacPlugboardEngine,
    LISP_PROGRAMS,
    SymbolicsLispMachine,
    WaferScaleDataflowEngine,
    TandemNonStopCluster,
    HypervisorNumaServer,
    SYSTOLIC_PRESETS,
    SystolicArrayEngine,
    FugakuSveTofuEngine,
    SiliconSpinDotQpu,
  };

  Object.assign(globalScope, exportsMap);
})(typeof window !== "undefined" ? window : globalThis);
