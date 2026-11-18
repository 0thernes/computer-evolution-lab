// Burroughs B1700 (1972) — user-microprogrammable, bit-addressable S-machine host.
//
// Primary source for everything marked [SRM]: Burroughs "B 1700 Systems Reference Manual",
// form 1057155, revision of 1973-01 with PCN 1057155-001 (9/8/72) and -002 (9/28/73),
// bitsavers.org/pdf/burroughs/SmallSystems/B1000/B1700/1057155_B1700_System_Reference_Manual_197301.pdf
// Section 3 (B 1726 processor) and Section 4 (micro-instructions). MIL statement spellings
// follow "MIL Micro Implementation Language" (Burroughs 2212-5298). Timing figures marked
// [Auerbach] come from the Auerbach report on the B 1700 (July 1974): control memory 167 ns per
// 2 bytes, main memory 667 ns per 3 bytes. Anything marked [LAB] is this lab's own
// interpretation or invention and is labelled as such in the UI and in docs/B1700.md.
(function (globalScope) {
  "use strict";

  const M24 = 0xffffff;
  const mask = (n) => (n >= 24 ? M24 : n <= 0 ? 0 : (1 << n) - 1);

  // ---------------------------------------------------------------------------
  // Bit-addressable main memory (S-memory). [SRM 1-14] addresses are 24-bit bit
  // addresses; any field of 0..24 bits can be read or written at any bit, in either
  // direction, with "equal memory speed on all bit locations" (Wilner 1972).
  // Bit 0 of a byte is its most significant bit (Burroughs numbers bits from the left).
  // ---------------------------------------------------------------------------
  class BitMemory {
    constructor(bytes) {
      this.bytes = new Uint8Array(bytes);
      this.sizeBits = bytes * 8;
      this.reads = 0;
      this.writes = 0;
      this.bitsMoved = 0;
      this.last = null; // {addr, len, write} for the bit-map view
    }
    wrap(a) {
      a %= this.sizeBits;
      return a < 0 ? a + this.sizeBits : a;
    }
    getBit(a) {
      a = this.wrap(a);
      return (this.bytes[a >>> 3] >> (7 - (a & 7))) & 1;
    }
    setBit(a, v) {
      a = this.wrap(a);
      const m = 1 << (7 - (a & 7));
      if (v) this.bytes[a >>> 3] |= m;
      else this.bytes[a >>> 3] &= ~m;
    }
    // dir = 0: field starts at addr and runs to addr+len-1.
    // dir = 1 [LAB interpretation of "field direction negative"]: field ends at addr-1.
    fieldStart(addr, len, dir) {
      return dir ? addr - len : addr;
    }
    read(addr, len, dir = 0) {
      const s = this.fieldStart(addr, len, dir);
      let v = 0;
      for (let i = 0; i < len; i++) v = ((v << 1) | this.getBit(s + i)) >>> 0;
      this.reads++;
      this.bitsMoved += len;
      this.last = { addr: this.wrap(s), len, write: false };
      return v & mask(len);
    }
    write(addr, len, dir, value) {
      const s = this.fieldStart(addr, len, dir);
      for (let i = 0; i < len; i++) this.setBit(s + i, (value >>> (len - 1 - i)) & 1);
      this.writes++;
      this.bitsMoved += len;
      this.last = { addr: this.wrap(s), len, write: true };
    }
  }

  // Register select matrix, Table 4-1 [SRM 4-1]: REG[col][row].
  const REG = [
    [
      "TA",
      "TB",
      "TC",
      "TD",
      "TE",
      "TF",
      "CA",
      "CB",
      "LA",
      "LB",
      "LC",
      "LD",
      "LE",
      "LF",
      "CC",
      "CD",
    ],
    [
      "FU",
      "FT",
      "FLC",
      "FLD",
      "FLE",
      "FLF",
      "BICN",
      "FLCN",
      "TOPM",
      null,
      null,
      null,
      "XYCN",
      "XYST",
      "INCN",
      "CPU",
    ],
    [
      "X",
      "Y",
      "T",
      "L",
      "A",
      "M",
      "BR",
      "LR",
      "FA",
      "FB",
      "FL",
      "TAS",
      "CP",
      "MSM",
      "READ",
      "WRIT",
    ],
    [
      "SUM",
      "CMPX",
      "CMPY",
      "XANY",
      "XEOY",
      "MSKX",
      "MSKY",
      "XORY",
      "DIFF",
      "MAXS",
      "MAXM",
      "U",
      "MBR",
      "DATA",
      "CMND",
      "NULL",
    ],
  ];
  const REG_POS = {};
  REG.forEach((col, c) =>
    col.forEach((name, r) => {
      if (name) REG_POS[name] = { row: r, col: c };
    }),
  );
  const SOURCE_ONLY = new Set([
    "BICN",
    "FLCN",
    "XYCN",
    "XYST",
    "INCN",
    "SUM",
    "CMPX",
    "CMPY",
    "XANY",
    "XEOY",
    "MSKX",
    "MSKY",
    "XORY",
    "DIFF",
    "MAXS",
    "MAXM",
    "U",
    "NULL",
  ]);
  const GP4 = ["X", "Y", "T", "L"]; // 2-bit register field of 7NNN / BNNN / 02NN [SRM 4-9]

  // ---------------------------------------------------------------------------
  // B 1726 processor [SRM section 3].
  // ---------------------------------------------------------------------------
  class B1700Processor {
    constructor(opts = {}) {
      this.mainBytes = opts.mainBytes || 24576; // smallest B 1726 main memory, 24K bytes [Auerbach]
      this.cmWords = opts.cmWords || 2048; // 1024 or 2048 16-bit words [SRM 1-9]
      this.mem = new BitMemory(this.mainBytes);
      this.cm = new Uint16Array(this.cmWords);
      this.reset();
    }
    reset() {
      this.X = 0;
      this.Y = 0;
      this.T = 0;
      this.L = 0;
      this.FA = 0;
      this.FB = 0; // FB = FU(4) FT(4) FL(16)
      this.C = 0x000018; // CA CB CC CD | CYF CPU CPL ; CPL=24 binary
      this.A = 0; // 14-bit micro-instruction word address [SRM 3-2]
      this.M = 0; // current micro-instruction
      this.mOr = 0; // pending Bit-OR into next micro-instruction (M as destination)
      this.BR = 0;
      this.LR = this.mem.sizeBits;
      this.MBR = 0;
      this.TOPM = this.cmWords / 512; // "TOPM x 512" = first micro-instruction outside CM [SRM 3-2]
      this.astack = new Uint32Array(32); // 32-deep A stack on the B 1726 [SRM 3-4]
      this.asp = 0;
      this.pad = new Uint32Array(32); // 16 x 48-bit scratchpad words, S00A..S15B [SRM 3-7]
      this.halted = false;
      this.cycles = 0;
      this.ns = 0;
      this.micros = 0;
      this.cmFetches = 0;
      this.mmFetches = 0;
      this.lastText = "";
      this.lastAddr = 0;
      this.lastFromCM = true;
      this.opCounts = {};
      this.trace = [];
      this.U = 0;
      this.DATA = 0;
      this.CMND = 0;
      this.INCN = 0;
      this.consoleReg = 0;
    }

    // ---- C register sub-fields [SRM 3-9..3-11] ----
    get CP() {
      return this.C & 0xff;
    }
    set CP(v) {
      this.C = (this.C & 0xffff00) | (v & 0xff);
    }
    get CYF() {
      return (this.C >> 7) & 1;
    }
    set CYF(v) {
      this.C = (this.C & ~0x80) | ((v & 1) << 7);
    }
    get CPU() {
      return (this.C >> 5) & 3;
    }
    set CPU(v) {
      this.C = (this.C & ~0x60) | ((v & 3) << 5);
    }
    get CPL() {
      return this.C & 31;
    }
    set CPL(v) {
      this.C = (this.C & ~31) | (v & 31);
    }
    get FL() {
      return this.FB & 0xffff;
    }
    set FL(v) {
      this.FB = (this.FB & 0xff0000) | (v & 0xffff);
    }
    get FU() {
      return (this.FB >> 20) & 15;
    }
    get FT() {
      return (this.FB >> 16) & 15;
    }
    get SFL() {
      return this.pad[1] & 0xffff;
    } // right 16 bits of S00B
    get SFU() {
      return (this.pad[1] >> 20) & 15;
    }
    get len() {
      return Math.min(24, this.CPL);
    }

    // ---- 24-bit function box [SRM 3-12..3-16]: results exist continuously ----
    unitAdd(x, y, cin, sub) {
      const cpu = this.CPU;
      const n = this.len;
      if (cpu === 0) {
        const m = mask(n);
        const r = sub ? (x & m) + (~y & m) + (cin ? 0 : 1) : (x & m) + (y & m) + cin;
        return { v: r & m, c: n ? (r >>> n) & 1 : 0 };
      }
      if (cpu === 2) return { v: 0, c: 0, undef: true }; // CPU=10 undefined [SRM]
      const unit = cpu === 1 ? 4 : 8;
      let carry = cin;
      let out = 0;
      for (let u = 0; u < Math.floor(n / unit); u++) {
        const sh = u * unit;
        const a = (x >>> sh) & 15;
        const b = (y >>> sh) & 15;
        let d = sub ? a - b - carry : a + b + carry;
        if (sub) {
          carry = d < 0 ? 1 : 0;
          if (d < 0) d += 10;
        } else {
          carry = d > 9 ? 1 : 0;
          if (d > 9) d -= 10;
        }
        let unitVal = d & 15;
        if (unit === 8) unitVal |= ((x >>> sh) | (y >>> sh)) & 0xf0; // zone = inclusive OR [SRM 3-14]
        out |= unitVal << sh;
      }
      return { v: out >>> 0, c: carry };
    }
    get SUM() {
      return this.unitAdd(this.X, this.Y, this.CYF, false).v;
    }
    get CYL() {
      return this.unitAdd(this.X, this.Y, this.CYF, false).c;
    }
    get DIFF() {
      if (this.CPU === 0) {
        const m = mask(this.len);
        return (this.X - this.Y - this.CYF) & m;
      }
      return this.unitAdd(this.X, this.Y, this.CYF, true).v;
    }
    // CYD is generated from all 24 bits of X and Y, not controlled by CPL [SRM 3-14]
    get CYD() {
      return this.X - this.Y - this.CYF < 0 ? 1 : 0;
    }
    get CMPX() {
      return ~this.X & mask(this.len);
    }
    get CMPY() {
      return ~this.Y & mask(this.len);
    }
    get XANY() {
      return this.X & this.Y & mask(this.len);
    }
    get XEOY() {
      return (this.X ^ this.Y) & mask(this.len);
    }
    get XORY() {
      return (this.X | this.Y) & mask(this.len);
    }
    get MSKX() {
      return this.X & mask(this.len);
    }
    get MSKY() {
      return this.Y & mask(this.len);
    }
    lsu(v) {
      if (this.CPU === 0) return v & 1;
      if (this.CPU === 2) return 0;
      return (v & 15) === 9 ? 1 : 0;
    }
    get BICN() {
      return (this.lsu(this.Y) << 3) | (this.CYF << 2) | (this.CYD << 1) | this.CYL;
    }
    get XYCN() {
      const msbx = this.CPL ? (this.X >>> (this.len - 1)) & 1 : 0; // bit CPL points to
      return (
        (msbx << 3) |
        ((this.X === this.Y) << 2) |
        ((this.X < this.Y) << 1) |
        (this.X > this.Y ? 1 : 0)
      );
    }
    get INT() {
      const cc = (this.C >> 12) & 15;
      const cd = (this.C >> 8) & 15;
      return this.INCN & 0b1010 || cc & 0b0111 || cd & 0b1001 ? 1 : 0;
    }
    get XYST() {
      return (
        (this.lsu(this.X) << 3) |
        (this.INT << 2) |
        ((this.Y !== 0) << 1) |
        (this.X !== 0 ? 1 : 0)
      );
    }
    get FLCN() {
      const fl = this.FL;
      const sfl = this.SFL;
      return (
        ((fl === sfl) << 3) | ((fl > sfl) << 2) | ((fl < sfl) << 1) | (fl !== 0 ? 1 : 0)
      );
    }

    // ---- register file access by name ----
    nib(v, i) {
      return (v >>> (20 - 4 * i)) & 15;
    }
    setNib(v, i, n) {
      const sh = 20 - 4 * i;
      return ((v & ~(15 << sh)) | ((n & 15) << sh)) & M24;
    }
    get(name) {
      switch (name) {
        case "X":
        case "Y":
        case "T":
        case "L":
        case "FA":
        case "FB":
        case "BR":
        case "LR":
        case "MBR":
        case "U":
        case "DATA":
          return this[name] >>> 0;
        case "A":
          return (this.A << 4) & M24; // [LAB] A seen as a bit address, like TAS
        case "M":
          return this.M;
        case "FL":
          return this.FL;
        case "CP":
          return this.CP;
        case "TAS": {
          this.asp = (this.asp + 31) & 31; // pop [SRM 3-4]: data not destroyed on removal
          return this.astack[this.asp];
        }
        case "TOPM":
          return this.TOPM;
        case "MAXS":
          return this.mem.sizeBits & M24;
        case "MAXM":
          return (this.cmWords * 16) & M24;
        case "NULL":
          return 0;
        case "READ":
        case "WRIT":
          return this.consoleReg;
        case "MSM":
        case "CMND":
        case "CPU":
          return 0;
        case "SUM":
          return this.SUM;
        case "DIFF":
          return this.DIFF;
        case "CMPX":
          return this.CMPX;
        case "CMPY":
          return this.CMPY;
        case "XANY":
          return this.XANY;
        case "XEOY":
          return this.XEOY;
        case "XORY":
          return this.XORY;
        case "MSKX":
          return this.MSKX;
        case "MSKY":
          return this.MSKY;
        case "BICN":
          return this.BICN;
        case "XYCN":
          return this.XYCN;
        case "XYST":
          return this.XYST;
        case "FLCN":
          return this.FLCN;
        case "INCN":
          return this.INCN;
        case "FU":
          return this.FU;
        case "FT":
          return this.FT;
        case "CA":
          return (this.C >> 20) & 15;
        case "CB":
          return (this.C >> 16) & 15;
        case "CC":
          return (this.C >> 12) & 15;
        case "CD":
          return (this.C >> 8) & 15;
      }
      if (/^T[A-F]$/.test(name)) return this.nib(this.T, name.charCodeAt(1) - 65);
      if (/^L[A-F]$/.test(name)) return this.nib(this.L, name.charCodeAt(1) - 65);
      if (/^FL[C-F]$/.test(name))
        return (this.FL >>> (12 - 4 * (name.charCodeAt(2) - 67))) & 15;
      throw new Error("B1700: unknown source register " + name);
    }
    set(name, v) {
      v >>>= 0;
      switch (name) {
        case "X":
        case "Y":
        case "T":
        case "L":
        case "FA":
        case "BR":
        case "LR":
        case "MBR":
          this[name] = v & M24;
          return;
        case "FB":
          this.FB = v & M24;
          return;
        case "FL":
          this.FL = v;
          return;
        case "A":
          this.A = (v >>> 4) & 0x3fff;
          return; // [LAB] bit address -> word address
        case "M":
          this.mOr |= v & 0xffff;
          return; // Bit-OR into the NEXT micro [SRM 4-2]
        case "CP":
          this.CP = v;
          return; // only the low 8 bits are used [SRM 3-10]
        case "CPU":
          this.CPU = v;
          return;
        case "TAS":
          this.astack[this.asp] = v & M24;
          this.asp = (this.asp + 1) & 31; // wraps after 32 entries [SRM 3-4]
          return;
        case "TOPM":
          this.TOPM = v & 15;
          return;
        case "FU":
          this.FB = (this.FB & ~0xf00000) | ((v & 15) << 20);
          return;
        case "FT":
          this.FB = (this.FB & ~0x0f0000) | ((v & 15) << 16);
          return;
        case "CA":
          this.C = (this.C & ~0xf00000) | ((v & 15) << 20);
          return;
        case "CB":
          this.C = (this.C & ~0x0f0000) | ((v & 15) << 16);
          return;
        case "CC":
          this.C = (this.C & ~0x00f000) | ((v & 15) << 12);
          return;
        case "CD":
          this.C = (this.C & ~0x000f00) | ((v & 15) << 8);
          return;
        case "DATA":
          this.DATA = v & M24;
          return;
        case "CMND":
          this.CMND = v & M24;
          return;
        case "READ":
        case "WRIT":
          this.consoleReg = v & M24;
          return;
        case "NULL":
        case "MSM":
          return;
      }
      if (/^T[A-F]$/.test(name)) {
        this.T = this.setNib(this.T, name.charCodeAt(1) - 65, v);
        return;
      }
      if (/^L[A-F]$/.test(name)) {
        this.L = this.setNib(this.L, name.charCodeAt(1) - 65, v);
        return;
      }
      if (/^FL[C-F]$/.test(name)) {
        const sh = 12 - 4 * (name.charCodeAt(2) - 67);
        this.FL = (this.FL & ~(15 << sh)) | ((v & 15) << sh);
        return;
      }
      throw new Error("B1700: register " + name + " is not a destination");
    }
    // side-effect-free read for the console lamps (TAS would pop on a real move)
    peek(name) {
      if (name === "TAS") return this.astack[(this.asp + 31) & 31];
      if (
        name === "READ" ||
        name === "WRIT" ||
        name === "DATA" ||
        name === "CMND" ||
        name === "NULL"
      )
        return 0;
      return this.get(name);
    }
    reg(row, col) {
      const n = REG[col][row];
      if (!n) throw new Error(`B1700: reserved register row ${row} col ${col}`);
      return n;
    }
    padGet(n, half) {
      return this.pad[n * 2 + half];
    }
    padSet(n, half, v) {
      this.pad[n * 2 + half] = v & M24;
    }

    // ---- memory protection on FA against BR/LR, flagged in CD [SRM 3-9] ----
    checkBounds(write) {
      const out = this.FA < this.BR || this.FA >= this.LR;
      if (!out) return true;
      const cd = (this.C >> 8) & 15;
      if (write) {
        this.C |= 0x100; // CD bit 0
        return (cd & 4) !== 0; // override bit
      }
      this.C |= 0x200; // CD bit 1: read is never inhibited
      return true;
    }
    countFAFL(variant, n) {
      const fa = [0, 1, 0, 1, -1, -1, 0, -1][variant];
      const fl = [0, 0, 1, -1, 1, 0, -1, -1][variant];
      this.FA = (this.FA + fa * n) & M24; // FA wraps silently [SRM 4-18A]
      if (fl > 0) this.FL = (this.FL + n) & 0xffff;
      else if (fl < 0) this.FL = Math.max(0, this.FL - n); // FL underflow is clamped to zero
    }

    fetch() {
      const fromCM = this.A < this.TOPM * 512;
      let w;
      if (fromCM) {
        w = this.cm[this.A];
        this.cmFetches++;
        this.ns += 167; // [Auerbach] control memory 167 ns per 2 bytes
      } else {
        const bit = this.A * 16 + this.MBR; // (A x 16) + MBR [SRM 3-2]
        if (bit >= this.mem.sizeBits) this.C |= 0x200;
        w = this.mem.read(bit, 16, 0);
        this.mem.reads--; // instruction fetches are counted separately
        this.mmFetches++;
        this.ns += 667; // [Auerbach] main memory 667 ns per 3 bytes
      }
      this.lastAddr = this.A;
      this.lastFromCM = fromCM;
      this.A = (this.A + 1) & 0x3fff;
      return w;
    }

    step() {
      if (this.halted) return null;
      let m = this.fetch() | this.mOr;
      this.mOr = 0;
      this.M = m;
      this.micros++;
      this.cycles++;
      const text = this.execute(m);
      this.lastText = text;
      this.opCounts[text.split(" ")[0]] = (this.opCounts[text.split(" ")[0]] || 0) + 1;
      return { m, text, addr: this.lastAddr, fromCM: this.lastFromCM };
    }

    run(maxMicros = 100000) {
      let n = 0;
      while (!this.halted && n < maxMicros) {
        this.step();
        n++;
      }
      return n;
    }

    execute(m) {
      const op = m >>> 12;
      const n11_8 = (m >>> 8) & 15;
      switch (op) {
        case 0x1: {
          // Register Move 1NNN [SRM 4-2]
          const src = this.reg(n11_8, (m >>> 6) & 3);
          const dst = this.reg(m & 15, (m >>> 4) & 3);
          const v = this.get(src);
          this.set(dst, v);
          return `MOVE ${src} TO ${dst}`;
        }
        case 0x2: {
          // Scratchpad Move 2NNN [SRM 4-3]
          const r = this.reg(n11_8, (m >>> 6) & 3);
          const from = (m >>> 5) & 1;
          const half = (m >>> 4) & 1;
          const w = m & 15;
          const pn = `S${String(w).padStart(2, "0")}${half ? "B" : "A"}`;
          if (from) {
            this.set(r, this.padGet(w, half));
            return `MOVE ${pn} TO ${r}`;
          }
          this.padSet(w, half, this.get(r));
          return `MOVE ${r} TO ${pn}`;
        }
        case 0x3: {
          // Four-Bit Manipulate 3NNN [SRM 4-4]
          const r = this.reg(n11_8, (m >>> 7) & 1);
          const v = (m >>> 4) & 7;
          const lit = m & 15;
          const cur = this.get(r);
          let res;
          let skip = false;
          switch (v) {
            case 0:
              res = lit;
              break;
            case 1:
              res = cur & lit;
              break;
            case 2:
              res = cur | lit;
              break;
            case 3:
              res = cur ^ lit;
              break;
            case 4:
              res = cur + lit;
              break;
            case 5:
              res = cur - lit;
              break;
            case 6:
              res = cur + lit;
              skip = res > 15;
              break;
            case 7:
              res = cur - lit;
              skip = res < 0;
              break;
          }
          this.set(r, res & 15);
          if (skip) this.A = (this.A + 1) & 0x3fff;
          const names = ["SET", "AND", "OR", "EOR", "INC", "DEC", "INC", "DEC"];
          return `${names[v]} ${r} ${v === 0 ? "TO" : v < 4 ? "WITH" : "BY"} ${lit}${v >= 6 ? " TEST" : ""}`;
        }
        case 0x4:
        case 0x5: {
          // Bit Test/Branch on False (4) / True (5) [SRM 4-6]
          const r = this.reg(n11_8, (m >>> 7) & 1);
          const bit = (m >>> 5) & 3;
          const neg = (m >>> 4) & 1;
          const mag = m & 15;
          const val = (this.get(r) >>> bit) & 1;
          const want = op === 0x5 ? 1 : 0;
          if (val === want) this.A = (this.A + (neg ? -mag : mag)) & 0x3fff;
          return `IF ${r}(${bit}) ${op === 5 ? "TRUE" : "FALSE"} JUMP ${neg ? "-" : "+"}${mag}`;
        }
        case 0x6: {
          // Skip When 6NNN [SRM 4-7]
          const r = this.reg(n11_8, (m >>> 7) & 1);
          const v = (m >>> 4) & 7;
          const mk = m & 15;
          const cur = this.get(r);
          const sel = cur & mk;
          let cond;
          switch (v & 3) {
            case 0:
              cond = mk !== 0 && sel !== 0;
              break;
            case 1:
              cond = mk === 0 ? true : sel === mk;
              break;
            case 2:
              cond = cur === mk;
              break;
            case 3:
              cond = mk === 0 ? true : sel === mk;
              break;
          }
          if (v === 5 || v === 7) cond = mk === 0 ? false : cond; // NOTE on mask 0000 [SRM 4-8]
          if ((v & 3) === 3 && sel === mk && mk) this.set(r, cur & ~mk);
          const skip = v < 4 ? cond : !cond;
          if (skip) this.A = (this.A + 1) & 0x3fff;
          return `SKIP WHEN ${r} ${["ANY", "ALL", "EQL", "ALL CLEAR"][v & 3]}${v >= 4 ? " NOT" : ""} ${mk.toString(2).padStart(4, "0")}`;
        }
        case 0x7: {
          // Read/Write Memory 7NNN [SRM 4-9]
          const toMem = (m >>> 11) & 1;
          const variant = (m >>> 8) & 7;
          const r = GP4[(m >>> 6) & 3];
          const dir = (m >>> 5) & 1;
          let n = m & 31;
          if (n === 0) n = this.CPL; // CPL substituted for a zero length
          const ln = Math.min(24, n);
          this.ns += 667;
          if (toMem) {
            if (this.checkBounds(true)) this.mem.write(this.FA, ln, dir, this[r]);
          } else {
            this.checkBounds(false);
            this[r] = this.mem.read(this.FA, ln, dir);
          }
          this.countFAFL(variant, ln);
          const cnt = [
            "",
            " INC FA",
            " INC FL",
            " INC FA DEC FL",
            " DEC FA INC FL",
            " DEC FA",
            " DEC FL",
            " DEC FA DEC FL",
          ][variant];
          return `${toMem ? "WRITE" : "READ"} ${m & 31} BITS ${toMem ? "FROM" : "TO"} ${r}${dir ? " REVERSE" : ""}${cnt}`;
        }
        case 0x8: {
          // Move 8-bit Literal 8NNN, column 2 assumed [SRM 4-10]
          const r = this.reg(n11_8, 2);
          this.set(r, m & 0xff);
          return `MOVE ${m & 0xff} TO ${r}`;
        }
        case 0x9: {
          // Move 24-bit Literal 9NNN (+ next 16 bits) [SRM 4-10]
          const r = this.reg(n11_8, 2);
          const lo = this.fetch();
          const v = ((m & 0xff) << 16) | lo;
          this.set(r, v);
          return `MOVE ${v} TO ${r}`;
        }
        case 0xa: {
          // Shift or Rotate T Left ANNN [SRM 4-11]
          const r = this.reg(n11_8, (m >>> 6) & 3);
          const rot = (m >>> 5) & 1;
          let c = m & 31;
          if (c === 0) c = this.CPL;
          c %= 24;
          const t = this.T;
          const v = rot ? ((t << c) | (t >>> (24 - c))) & M24 : (t << c) & M24;
          this.set(r, c === 0 ? t : v);
          return `${rot ? "ROTATE" : "SHIFT"} T LEFT BY ${m & 31} BITS TO ${r}`;
        }
        case 0xb: {
          // Extract from T BNNN [SRM 4-12]
          let p = (m >>> 7) & 31; // right bit pointer = rotate count
          const r = GP4[(m >>> 5) & 3];
          const w = m & 31;
          if (p === 0) p = this.CPL;
          p %= 24; // a rotate of 24 is equivalent to zero
          const t = this.T;
          const rotd = p ? ((t << p) | (t >>> (24 - p))) & M24 : t;
          this[r] = rotd & mask(w);
          const start = (((m >>> 7) & 31) - w + 24) % 24;
          return `EXTRACT ${w} BITS FROM T(${start}) TO ${r}`;
        }
        case 0xc:
        case 0xd: {
          // Branch Forward/Backward [SRM 4-13]
          const d = m & 0xfff;
          this.A = (this.A + (op === 0xc ? d : -d)) & 0x3fff;
          return `JUMP ${op === 0xc ? "+" : "-"}${d}`;
        }
        case 0xe:
        case 0xf: {
          // Call Forward/Reverse: push A x 16 [SRM 4-14A]
          this.set("TAS", (this.A << 4) & M24);
          const d = m & 0xfff;
          this.A = (this.A + (op === 0xe ? d : -d)) & 0x3fff;
          return `CALL ${op === 0xe ? "+" : "-"}${d}`;
        }
        case 0x0:
          return this.executeMinor(m);
      }
      return "?";
    }

    executeMinor(m) {
      const hi = (m >>> 8) & 15;
      const lo8 = m & 0xff;
      switch (hi) {
        case 0x2: {
          // Swap Memory 02NN [SRM 4-15]
          const r = GP4[(m >>> 6) & 3];
          const dir = (m >>> 5) & 1;
          let n = m & 31;
          if (n === 0) n = this.CPL;
          const ln = Math.min(24, n);
          const old = this.mem.read(this.FA, ln, dir);
          if (this.checkBounds(true)) this.mem.write(this.FA, ln, dir, this[r]);
          this[r] = old;
          this.ns += 1334;
          return `SWAP ${m & 31} BITS WITH ${r}`;
        }
        case 0x3: {
          // Clear Registers 03NN: bit7..0 = L T Y X FA FL FU CP [SRM 4-16]
          const names = ["CP", "FU", "FL", "FA", "X", "Y", "T", "L"];
          const hit = [];
          for (let b = 0; b < 8; b++) {
            if ((lo8 >>> b) & 1) {
              hit.push(names[b]);
              if (names[b] === "FU") this.set("FU", 0);
              else this.set(names[b], 0);
            }
          }
          return `CLEAR ${hit.join(" ")}`;
        }
        case 0x4: {
          // Shift/Rotate X or Y 04NN [SRM 4-17]
          const rot = (m >>> 7) & 1;
          const right = (m >>> 6) & 1;
          const r = (m >>> 5) & 1 ? "Y" : "X";
          let c = m & 31;
          if (c === 0) c = [1, 4, 0, 8][this.CPU];
          c %= 24;
          const v = this[r];
          let o;
          if (rot)
            o = right
              ? ((v >>> c) | (v << (24 - c))) & M24
              : ((v << c) | (v >>> (24 - c))) & M24;
          else o = right ? v >>> c : (v << c) & M24;
          this[r] = c ? o : v;
          return `${rot ? "ROTATE" : "SHIFT"} ${r} ${right ? "RIGHT" : "LEFT"} BY ${m & 31} BITS`;
        }
        case 0x5: {
          // Shift/Rotate X and Y 05NN — [LAB] count in bits 5..0 (MIL "ROTATE XY RIGHT BY 40 BITS")
          const rot = (m >>> 7) & 1;
          const right = (m >>> 6) & 1;
          let c = m & 63;
          if (c === 0) c = [1, 4, 0, 8][this.CPU];
          c %= 48;
          let v = (BigInt(this.X) << 24n) | BigInt(this.Y);
          const W = (1n << 48n) - 1n;
          const C = BigInt(c);
          if (rot)
            v = right
              ? ((v >> C) | (v << (48n - C))) & W
              : ((v << C) | (v >> (48n - C))) & W;
          else v = right ? v >> C : (v << C) & W;
          this.X = Number(v >> 24n) & M24;
          this.Y = Number(v & 0xffffffn);
          return `${rot ? "ROTATE" : "SHIFT"} XY ${right ? "RIGHT" : "LEFT"} BY ${m & 63} BITS`;
        }
        case 0x6: {
          // Count FA/FL 06NN [SRM 4-18A]
          const v = (m >>> 5) & 7;
          let n = m & 31;
          if (n === 0) n = this.CPL;
          this.countFAFL(v, n);
          return `COUNT${["", " FA UP", " FL UP", " FA UP AND FL DOWN", " FA DOWN AND FL UP", " FA DOWN", " FL DOWN", " FA AND FL DOWN"][v]} BY ${m & 31}`;
        }
        case 0x7: {
          // Exchange Doublepad Word 07NN [SRM 4-19]
          const s = (m >>> 4) & 15;
          const d = m & 15;
          const hFA = this.FA,
            hFB = this.FB;
          this.FA = this.pad[s * 2];
          this.FB = this.pad[s * 2 + 1];
          this.pad[d * 2] = hFA;
          this.pad[d * 2 + 1] = hFB;
          return `EXCHANGE DOUBLEPAD S${s} TO F, F TO S${d}`;
        }
        case 0x8: {
          // Scratchpad Relate FA 08NN [SRM 4-19]
          const sub = (m >>> 4) & 1;
          const w = m & 15;
          this.FA = (this.FA + (sub ? -1 : 1) * this.pad[w * 2]) & M24;
          return `${sub ? "SUBTRACT" : "ADD"} S${String(w).padStart(2, "0")}A ${sub ? "FROM" : "TO"} FA`;
        }
        case 0x9: // Monitor 09NN [SRM 4-20]: level to the backplane only
          return `MONITOR ${lo8}`;
        case 0x0:
          return this.executeTiny(m);
      }
      throw new Error(
        `B1700: reserved micro-instruction ${m.toString(16).padStart(4, "0")}`,
      );
    }

    executeTiny(m) {
      const k = (m >>> 4) & 15;
      const n = m & 15;
      switch (k) {
        case 0:
          switch (n) {
            case 0:
              return "NOP";
            case 1:
              this.halted = true;
              return "HALT";
            case 2: {
              // Overlay Control Memory 0002 [SRM 4-24]
              this.set("TAS", (this.A << 4) & M24); // a. A is moved to TAS
              let cmA = this.L & 0x3fff; // b. L is moved to A (CM word address)
              while (this.FL > 0 && cmA < this.cmWords) {
                this.cm[cmA++] = this.mem.read(this.FA, 16, 0);
                this.FL = Math.max(0, this.FL - 16);
                this.FA = (this.FA + 16) & M24;
                this.ns += 667;
              }
              this.A = this.get("TAS") >>> 4; // [LAB] resume after the overlay
              return "OVERLAY";
            }
            case 3: {
              // Normalize X 0003 [SRM 4-24]
              const p = Math.max(1, this.len) - 1;
              while (this.FL > 0 && !((this.X >>> p) & 1)) {
                this.X = (this.X << 1) & M24;
                this.FL = this.FL - 1;
              }
              return "NORMALIZE X";
            }
          }
          break;
        case 2: // Cassette Control 002N [SRM 4-20]: no cassette is modelled
          return `CASSETTE ${["START", "STOP", "STOP IF X NEQ Y"][n & 7] || "RESERVED"}`;
        case 3: {
          // Bias 003N [SRM 4-21]
          const v = n & 7;
          const test = (n >>> 3) & 1;
          const unit = v === 2 || v === 3 ? this.SFU : this.FU;
          this.CPU = unit === 4 ? 1 : unit === 8 ? 3 : 0;
          const fl = this.FL,
            sfl = this.SFL,
            cpl = this.CPL;
          const choices = [
            [unit],
            [24, fl],
            [24, sfl],
            [24, fl, sfl],
            [cpl],
            [24, cpl, fl],
            [cpl],
            [cpl],
          ][v];
          this.CPL = Math.min(...choices);
          if (test && this.CPL !== 0) this.A = (this.A + 1) & 0x3fff;
          return `BIAS ${["BY UNIT", "BY F", "BY SF", "BY F AND SF", "BY CP", "BY F AND CP", "BY CP", "BY CP"][v]}${test ? " TEST" : ""}`;
        }
        case 4: // Store F into Doublepad 004N
          this.pad[n * 2] = this.FA;
          this.pad[n * 2 + 1] = this.FB;
          return `STORE F INTO DOUBLEPAD S${n}`;
        case 5: // Load F from Doublepad 005N
          this.FA = this.pad[n * 2];
          this.FB = this.pad[n * 2 + 1];
          return `LOAD F FROM DOUBLEPAD S${n}`;
        case 6: {
          // Set CYF 006N [SRM 4-23]
          if (n === 1) this.CYF = 0;
          else if (n === 2) this.CYF = 1;
          else if (n === 4) this.CYF = this.CYL;
          else if (n === 8) this.CYF = this.CYD;
          return `CARRY ${{ 1: "0", 2: "1", 4: "SUM", 8: "DIFFERENCE" }[n] || "?"}`;
        }
      }
      throw new Error(
        `B1700: reserved micro-instruction ${m.toString(16).padStart(4, "0")}`,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // MIL-subset micro-assembler. Statement spellings follow the MIL manual; the
  // assembler is the lab's own (Burroughs' MIL compiler is not reproduced).
  // ---------------------------------------------------------------------------
  function padRef(tok) {
    const mm = /^S(\d{1,2})([AB])$/.exec(tok);
    return mm ? { w: +mm[1], half: mm[2] === "B" ? 1 : 0 } : null;
  }
  function assembleMIL(src) {
    const lines = src.split("\n").map((l) => l.replace(/%.*$/, "").trim());
    const stmts = [];
    const labels = {};
    let pc = 0;
    // pass 1: sizes
    for (const raw of lines) {
      if (!raw) continue;
      let line = raw;
      const lm = /^([A-Z][A-Z0-9.$]*):\s*(.*)$/.exec(line);
      if (lm) {
        labels[lm[1]] = pc;
        line = lm[2];
        if (!line) continue;
      }
      const words = sizeOf(line);
      stmts.push({ line, pc, src: raw });
      pc += words;
    }
    const code = [];
    const listing = [];
    for (const s of stmts) {
      const ws = encode(s.line, s.pc, labels);
      listing.push({ addr: s.pc, words: ws, text: s.line });
      code.push(...ws);
    }
    return { code: Uint16Array.from(code), labels, listing };
  }
  function sizeOf(line) {
    const mm = /^MOVE\s+(@?[A-Z0-9.$]+)\s+TO\s+(\S+)$/.exec(line);
    if (mm && (mm[1][0] === "@" || /^\d+$/.test(mm[1]))) {
      if (mm[1][0] === "@" || +mm[1] > 255) return 2;
    }
    return 1;
  }
  const isNum = (t) => /^\d+$/.test(t);
  function encode(line, pc, labels) {
    const T = line.split(/\s+/);
    const err = (msg) => {
      throw new Error(`MIL: ${msg} in "${line}"`);
    };
    const pos = (name) => REG_POS[name] || err(`unknown register ${name}`);
    const label = (name) =>
      name in labels ? labels[name] : err(`undefined label ${name}`);
    const gp = (name) => {
      const i = GP4.indexOf(name);
      if (i < 0) err(`${name} must be X, Y, T or L`);
      return i;
    };
    const countVariant = (rest) => {
      const s = rest
        .join(" ")
        .replace(/\bAND\b/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const table = {
        "": 0,
        "INC FA": 1,
        "INC FL": 2,
        "INC FA DEC FL": 3,
        "DEC FA INC FL": 4,
        "DEC FA": 5,
        "DEC FL": 6,
        "DEC FA DEC FL": 7,
      };
      if (!(s in table)) err(`bad FA/FL count "${s}"`);
      return table[s];
    };
    switch (T[0]) {
      case "NOP":
        return [0x0000];
      case "HALT":
        return [0x0001];
      case "OVERLAY":
        return [0x0002];
      case "NORMALIZE":
        return [0x0003];
      case "EXIT":
        return [0x1000 | (11 << 8) | (2 << 6) | (2 << 4) | 4]; // MOVE TAS TO A
      case "MONITOR":
        return [0x0900 | (+T[1] & 0xff)];
      case "CARRY":
        return [0x0060 | { 0: 1, 1: 2, SUM: 4, DIFFERENCE: 8 }[T[1]]];
      case "STORE":
        return [0x0040 | +T[4].replace("S", "")]; // STORE F INTO DOUBLEPAD Sn
      case "LOAD":
        return [0x0050 | +T[4].replace("S", "")];
      case "BIAS": {
        const s = T.slice(1).join(" ").replace(" TEST", "");
        const v = {
          "BY UNIT": 0,
          "BY F": 1,
          "BY SF": 2,
          "BY F AND SF": 3,
          "BY CP": 4,
          "BY F AND CP": 5,
        }[s];
        if (v === undefined) err("bad BIAS");
        return [0x0030 | v | (/TEST$/.test(line) ? 8 : 0)];
      }
      case "CLEAR": {
        const names = ["CP", "FU", "FL", "FA", "X", "Y", "T", "L"];
        let b = 0;
        for (const t of T.slice(1)) {
          const i = names.indexOf(t);
          if (i < 0) err(`CLEAR cannot address ${t}`);
          b |= 1 << i;
        }
        return [0x0300 | b];
      }
      case "JUMP":
      case "GO":
      case "CALL": {
        const target = label(T[T.length - 1]);
        const d = target - (pc + 1);
        if (Math.abs(d) > 4095) err("displacement too large");
        const base =
          T[0] === "CALL" ? (d >= 0 ? 0xe000 : 0xf000) : d >= 0 ? 0xc000 : 0xd000;
        return [base | Math.abs(d)];
      }
      case "IF": {
        // IF reg(bit) [TRUE|FALSE] THEN JUMP label  (forward, <= 15 words)
        const mm =
          /^IF\s+([A-Z]+)\((\d)\)\s*(TRUE|FALSE)?\s+THEN\s+(?:JUMP|GO TO)\s+(\S+)$/.exec(
            line,
          );
        if (!mm) err("bad IF");
        const p = pos(mm[1]);
        if (p.col > 1) err("bit test needs a 4-bit register");
        const d = label(mm[4]) - (pc + 1);
        if (d < 0 || d > 15) err("bit-test branch must be forward and <= 15 words");
        return [
          ((mm[3] === "FALSE" ? 4 : 5) << 12) |
            (p.row << 8) |
            (p.col << 7) |
            (+mm[2] << 5) |
            d,
        ];
      }
      case "SKIP": {
        // SKIP WHEN reg ANY|ALL|EQL|ALLCLR [NOT] mask
        const mm =
          /^SKIP WHEN\s+([A-Z]+)\s+(ANY|ALL|EQL|ALLCLR)(\s+NOT)?\s+([01]{4})$/.exec(line);
        if (!mm) err("bad SKIP");
        const p = pos(mm[1]);
        const v = { ANY: 0, ALL: 1, EQL: 2, ALLCLR: 3 }[mm[2]] | (mm[3] ? 4 : 0);
        return [0x6000 | (p.row << 8) | (p.col << 7) | (v << 4) | parseInt(mm[4], 2)];
      }
      case "SET":
      case "AND":
      case "OR":
      case "EOR":
      case "INC":
      case "DEC": {
        const p = pos(T[1]);
        if (p.col > 1) err("4-bit manipulate needs a 4-bit register");
        const lit = +T[3];
        let v = { SET: 0, AND: 1, OR: 2, EOR: 3, INC: 4, DEC: 5 }[T[0]];
        if (T[4] === "TEST") v += 2;
        return [0x3000 | (p.row << 8) | (p.col << 7) | (v << 4) | (lit & 15)];
      }
      case "READ":
      case "WRITE": {
        // READ n BITS TO r [REVERSE] [INC FA ...] / WRITE n BITS FROM r ...
        const n = +T[1];
        const r = gp(T[4]);
        let rest = T.slice(5);
        let dir = 0;
        if (rest[0] === "REVERSE") {
          dir = 1;
          rest = rest.slice(1);
        }
        return [
          0x7000 |
            ((T[0] === "WRITE") << 11) |
            (countVariant(rest) << 8) |
            (r << 6) |
            (dir << 5) |
            (n & 31),
        ];
      }
      case "SWAP": // SWAP n BITS WITH r
        return [0x0200 | (gp(T[4]) << 6) | (+T[1] & 31)];
      case "COUNT": {
        // COUNT FA UP BY n | COUNT FL DOWN BY n | COUNT FA UP AND FL DOWN BY n ...
        const s = T.slice(1, -2).join(" ");
        const v = {
          "FA UP": 1,
          "FL UP": 2,
          "FA UP AND FL DOWN": 3,
          "FA DOWN AND FL UP": 4,
          "FA DOWN": 5,
          "FL DOWN": 6,
          "FA AND FL DOWN": 7,
        }[s];
        if (!v) err("bad COUNT");
        return [0x0600 | (v << 5) | (+T[T.length - 1] & 31)];
      }
      case "SHIFT":
      case "ROTATE": {
        const rot = T[0] === "ROTATE" ? 1 : 0;
        const n = +T[4];
        if (T[1] === "T") {
          // SHIFT T LEFT BY n BITS TO r
          const p = pos(T[7] || "T");
          return [0xa000 | (p.row << 8) | (p.col << 6) | (rot << 5) | (n & 31)];
        }
        const right = T[2] === "RIGHT" ? 1 : 0;
        if (T[1] === "XY") return [0x0500 | (rot << 7) | (right << 6) | (n & 63)];
        return [0x0400 | (rot << 7) | (right << 6) | ((T[1] === "Y") << 5) | (n & 31)];
      }
      case "EXTRACT": {
        // EXTRACT w BITS FROM T(s) TO r
        const mm = /^EXTRACT\s+(\d+)\s+BITS\s+FROM\s+T\((\d+)\)\s+TO\s+([XYTL])$/.exec(
          line,
        );
        if (!mm) err("bad EXTRACT");
        const w = +mm[1];
        const p = (+mm[2] + w) % 24;
        return [0xb000 | (p << 7) | (gp(mm[3]) << 5) | w];
      }
      case "ADD":
      case "SUBTRACT": {
        // ADD S03A TO FA / SUBTRACT S03A FROM FA
        const pr = padRef(T[1]);
        if (!pr || pr.half) err("Scratchpad Relate uses an A (left) word");
        return [0x0800 | ((T[0] === "SUBTRACT") << 4) | pr.w];
      }
      case "MOVE": {
        const src = T[1];
        const dst = T[3];
        if (T[2] !== "TO") err("bad MOVE");
        if (src[0] === "@" || isNum(src)) {
          const v = src[0] === "@" ? label(src.slice(1)) * 16 : +src; // @label = bit address
          const p = pos(dst);
          if (p.col !== 2) err("literal moves need a column-2 register");
          if (src[0] !== "@" && v <= 255) return [0x8000 | (p.row << 8) | v];
          return [0x9000 | (p.row << 8) | ((v >>> 16) & 0xff), v & 0xffff];
        }
        const ps = padRef(src);
        const pd = padRef(dst);
        if (ps) {
          const p = pos(dst);
          return [
            0x2000 | (p.row << 8) | (p.col << 6) | (1 << 5) | (ps.half << 4) | ps.w,
          ];
        }
        if (pd) {
          const p = pos(src);
          return [0x2000 | (p.row << 8) | (p.col << 6) | (pd.half << 4) | pd.w];
        }
        const a = pos(src);
        const b = pos(dst);
        if (SOURCE_ONLY.has(dst)) err(`${dst} is source-only`);
        return [0x1000 | (a.row << 8) | (a.col << 6) | (b.col << 4) | b.row];
      }
    }
    err("unknown statement");
  }

  // ---------------------------------------------------------------------------
  // [LAB] "SAM": a small S-language invented for this lab to demonstrate the B1700
  // method (an interpreter per language, in microcode, reading variable-width
  // S-instruction fields from bit-addressed memory). It is NOT a Burroughs S-language.
  // Encoding: 4-bit opcode, then (for ops with an operand) one w-bit operand, where w
  // is the 5-bit header of the S-program. Variables are 16-bit fields.
  //   0 HALT  1 LIT v  2 LOAD a  3 STORE a  4 ADD a  5 SUB a  6 JNZ t  7 OUT  8 JMP t
  // ---------------------------------------------------------------------------
  const SAM_OPS = {
    HALT: 0,
    LIT: 1,
    LOAD: 2,
    STORE: 3,
    ADD: 4,
    SUB: 5,
    JNZ: 6,
    OUT: 7,
    JMP: 8,
  };
  const SAM_HAS_OPERAND = new Set(["LIT", "LOAD", "STORE", "ADD", "SUB", "JNZ", "JMP"]);
  const toBcd = (n) => parseInt(String(n), 16);

  function assembleSAM(src, { width = 8, decimal = false } = {}) {
    const lines = src
      .split("\n")
      .map((l) => l.replace(/;.*$/, "").trim())
      .filter(Boolean);
    const labels = {};
    let bit = 5; // after the 5-bit width header
    const items = [];
    for (let line of lines) {
      const lm = /^([A-Z][A-Z0-9_]*):\s*(.*)$/.exec(line);
      if (lm) {
        labels[lm[1]] = bit;
        line = lm[2];
        if (!line) continue;
      }
      const [op, arg] = line.split(/\s+/);
      if (!(op in SAM_OPS)) throw new Error(`SAM: unknown op ${op}`);
      items.push({ op, arg, bit });
      bit += 4 + (SAM_HAS_OPERAND.has(op) ? width : 0);
    }
    const bits = [];
    const push = (v, n) => {
      for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1);
    };
    push(width, 5);
    const maxv = 2 ** width - 1;
    for (const it of items) {
      push(SAM_OPS[it.op], 4);
      if (SAM_HAS_OPERAND.has(it.op)) {
        let v = it.arg in labels ? labels[it.arg] : +it.arg;
        if (it.op === "LIT" && decimal) v = toBcd(v);
        if (!Number.isFinite(v) || v < 0 || v > maxv)
          throw new Error(`SAM: operand ${it.arg} does not fit ${width} bits`);
        push(v, width);
      }
    }
    return { bits, labels, lengthBits: bits.length, items };
  }

  const SAM_PROGRAMS = {
    "Sum 1..10": `
      LIT 0
      STORE 0      ; sum
      LIT 10
      STORE 1      ; i
      LIT 1
      STORE 2      ; constant one
LOOP: LOAD 0
      ADD 1
      STORE 0
      LOAD 1
      SUB 2
      STORE 1
      JNZ LOOP
      LOAD 0
      OUT
      HALT`,
    "Fibonacci, 11 terms": `
      LIT 0
      STORE 0      ; a
      LIT 1
      STORE 1      ; b
      LIT 11
      STORE 2      ; terms to print
      LIT 1
      STORE 3      ; one
LOOP: LOAD 1
      OUT
      LOAD 0
      ADD 1
      STORE 4      ; t = a + b
      LOAD 1
      STORE 0
      LOAD 4
      STORE 1
      LOAD 2
      SUB 3
      STORE 2
      JNZ LOOP
      HALT`,
    "Countdown 9..1": `
      LIT 9
      STORE 0
      LIT 1
      STORE 1
LOOP: LOAD 0
      OUT
      SUB 1
      STORE 0
      JNZ LOOP
      HALT`,
  };

  // The SAM interpreter in MIL. Scratchpad map [LAB]:
  //   S01A S-program counter (bit address)   S02A variable base   S02B output pointer
  //   S03A S-program base                    S04A CP for operand fetch (CPL = width)
  //   S05A CP of this S-machine's arithmetic (binary 0x18 or 4-bit decimal 0x38)
  //   S06A accumulator
  const SAM_INTERPRETER_MIL = `
% SAM S-machine interpreter (lab-defined S-language), written in MIL.
INIT:    MOVE 24 TO CP              % CYF=0 CPU=00 (binary) CPL=24
FETCH:   MOVE S01A TO FA            % FA <- S-program counter
         READ 4 BITS TO T INC FA    % 4-bit S-op, right-justified
         MOVE FA TO S01A
         SHIFT T LEFT BY 5 BITS TO X % op x 32 bits = 2 micro words per entry
         MOVE @TABLE TO Y
         MOVE SUM TO A              % computed GO TO through the dispatch table
TABLE:   JUMP OPHALT
         NOP
         JUMP OPLIT
         NOP
         JUMP OPLOAD
         NOP
         JUMP OPSTORE
         NOP
         JUMP OPADD
         NOP
         JUMP OPSUB
         NOP
         JUMP OPJNZ
         NOP
         JUMP OPOUT
         NOP
         JUMP OPJMP
         NOP
OPHALT:  HALT
OPLIT:   CALL GETOP
         MOVE X TO S06A
         JUMP FETCH
OPLOAD:  CALL GETOP
         CALL VADDR
         READ 16 BITS TO X
         MOVE X TO S06A
         JUMP FETCH
OPSTORE: CALL GETOP
         CALL VADDR
         MOVE S06A TO X
         WRITE 16 BITS FROM X
         JUMP FETCH
OPADD:   CALL GETOP
         CALL VADDR
         READ 16 BITS TO Y
         MOVE S06A TO X
         MOVE S05A TO CP            % this S-machine's data unit (binary or decimal)
         MOVE SUM TO S06A
         MOVE 24 TO CP
         JUMP FETCH
OPSUB:   CALL GETOP
         CALL VADDR
         READ 16 BITS TO Y
         MOVE S06A TO X
         MOVE S05A TO CP
         MOVE DIFF TO S06A
         MOVE 24 TO CP
         JUMP FETCH
OPJNZ:   CALL GETOP
         MOVE X TO T
         MOVE S06A TO X
         IF XYST(0) TRUE THEN JUMP TAKEN
         JUMP FETCH
TAKEN:   MOVE T TO Y
         MOVE S03A TO X
         MOVE SUM TO S01A
         JUMP FETCH
OPJMP:   CALL GETOP
         MOVE X TO Y
         MOVE S03A TO X
         MOVE SUM TO S01A
         JUMP FETCH
OPOUT:   MOVE S02B TO FA
         MOVE S06A TO X
         WRITE 24 BITS FROM X INC FA
         MOVE FA TO S02B
         JUMP FETCH
GETOP:   MOVE S01A TO FA
         MOVE S04A TO CP            % CPL = operand width w
         READ 0 BITS TO X INC FA    % length 0 means "use CPL"
         MOVE FA TO S01A
         MOVE 24 TO CP
         EXIT
VADDR:   MOVE X TO T
         SHIFT T LEFT BY 4 BITS TO Y % variable index x 16 bits
         MOVE S02A TO X
         MOVE SUM TO FA
         EXIT
`;

  // Memory map [LAB] (bit addresses in main memory)
  const LAYOUT = { MICRO: 0, SPROG: 16384, DATA: 24576, OUT: 28672, OUT_SLOTS: 16 };

  class B1700System {
    constructor() {
      this.cpu = new B1700Processor();
      this.interp = assembleMIL(SAM_INTERPRETER_MIL);
      this.programs = SAM_PROGRAMS;
      this.programName = "Sum 1..10";
      this.decimal = false;
      this.inControlMemory = true;
      this.width = 8;
      this.load();
    }
    load(name = this.programName, opts = {}) {
      this.programName = name;
      if (opts.decimal !== undefined) this.decimal = opts.decimal;
      if (opts.inControlMemory !== undefined) this.inControlMemory = opts.inControlMemory;
      const p = this.cpu;
      p.reset();
      p.mem.bytes.fill(0);
      p.cm.fill(0);
      // micro-code lives in main memory at MBR; the overlay copies it into control memory
      this.interp.code.forEach((w, i) => p.mem.write(LAYOUT.MICRO + i * 16, 16, 0, w));
      p.mem.reads = p.mem.writes = p.mem.bitsMoved = 0;
      if (this.inControlMemory) {
        this.interp.code.forEach((w, i) => (p.cm[i] = w)); // equivalent of OVERLAY at load time
      } else {
        p.TOPM = 0; // every micro-instruction comes from main memory
      }
      p.MBR = LAYOUT.MICRO;
      const sam = assembleSAM(this.programs[name], {
        width: this.width,
        decimal: this.decimal,
      });
      this.sam = sam;
      sam.bits.forEach((b, i) => p.mem.setBit(LAYOUT.SPROG + i, b));
      p.padSet(1, 0, LAYOUT.SPROG + 5); // S-PC past the header
      p.padSet(2, 0, LAYOUT.DATA);
      p.padSet(2, 1, LAYOUT.OUT);
      p.padSet(3, 0, LAYOUT.SPROG);
      p.padSet(4, 0, this.width); // CPU=00, CPL=w
      p.padSet(5, 0, this.decimal ? 0x38 : 0x18);
      p.A = this.interp.labels.INIT;
      this.sOps = 0;
      this.lastSop = "";
    }
    // decode the S-instruction at the current S-PC (for display only)
    peekSop() {
      const p = this.cpu;
      const pc = p.padGet(1, 0);
      const op =
        p.mem.getBit(pc) * 8 +
        p.mem.getBit(pc + 1) * 4 +
        p.mem.getBit(pc + 2) * 2 +
        p.mem.getBit(pc + 3);
      const name = Object.keys(SAM_OPS).find((k) => SAM_OPS[k] === op) || "?";
      let arg = "";
      if (SAM_HAS_OPERAND.has(name)) {
        let v = 0;
        for (let i = 0; i < this.width; i++) v = v * 2 + p.mem.getBit(pc + 4 + i);
        arg = " " + v;
      }
      return { pc: pc - LAYOUT.SPROG, text: name + arg };
    }
    step() {
      const p = this.cpu;
      if (p.A === this.interp.labels.FETCH) {
        this.sOps++;
        this.lastSop = this.peekSop().text;
      }
      return p.step();
    }
    runToHalt(max = 200000) {
      let n = 0;
      while (!this.cpu.halted && n < max) {
        this.step();
        n++;
      }
      return n;
    }
    outputs() {
      const p = this.cpu;
      const end = p.padGet(2, 1);
      const out = [];
      for (let a = LAYOUT.OUT; a < end && out.length < 64; a += 24) {
        const v = p.mem.read(a, 24, 0);
        p.mem.reads--;
        out.push(this.decimal ? Number(v.toString(16)) : v);
      }
      return out;
    }
    acc() {
      const v = this.cpu.padGet(6, 0);
      return this.decimal ? Number(v.toString(16)) : v;
    }
  }

  // ---- disassembler for M-register display ----
  function disassemble(word, next = 0) {
    const p = new B1700Processor({ mainBytes: 64, cmWords: 512 });
    p.cm[0] = next; // literal tail for 9NNN
    try {
      p.A = 0;
      return p.execute(word);
    } catch (e) {
      return "RESERVED";
    }
  }

  Object.assign(globalScope, {
    B1700BitMemory: BitMemory,
    B1700Processor,
    B1700System,
    B1700_REG: REG,
    B1700_SAM_PROGRAMS: SAM_PROGRAMS,
    B1700_SAM_INTERPRETER_MIL: SAM_INTERPRETER_MIL,
    B1700_LAYOUT: LAYOUT,
    assembleB1700MIL: assembleMIL,
    assembleB1700SAM: assembleSAM,
    disassembleB1700: disassemble,
  });
})(typeof window !== "undefined" ? window : globalThis);
