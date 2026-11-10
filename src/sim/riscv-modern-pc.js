// Complete 32-bit RISC-V (RV32IM) 5-Stage Pipelined CPU + Set-Associative L1/L2 Cache
// + 2-Bit Branch Predictor + NVMe Block Storage + Mini-OS Shell + PCIe GPU MMIO Bridge

var ABI_NAMES = [
  "zero",
  "ra",
  "sp",
  "gp",
  "tp",
  "t0",
  "t1",
  "t2",
  "s0",
  "s1",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "a7",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "t3",
  "t4",
  "t5",
  "t6",
];

var REG_MAP = (() => {
  const m = { fp: 8 };
  ABI_NAMES.forEach((name, idx) => {
    m[name] = idx;
    m["x" + idx] = idx;
  });
  return m;
})();

function parseReg(tok) {
  if (!tok) throw new Error("Missing register operand");
  const clean = tok.trim().toLowerCase();
  if (clean in REG_MAP) return REG_MAP[clean];
  throw new Error(`Unknown RISC-V register '${tok}'`);
}

function parseImm(tok, labels, pc = 0, relative = false) {
  if (tok == null) throw new Error("Missing immediate");
  const s = tok.trim();
  if (s in labels) {
    return relative ? labels[s] - pc : labels[s];
  }
  if (/^'.'$/.test(s)) return s.charCodeAt(1);
  if (/^-?0x[0-9a-f]+$/i.test(s)) {
    const neg = s.startsWith("-");
    const v = parseInt(neg ? s.slice(1) : s, 16);
    return neg ? -v : v;
  }
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  throw new Error(`Invalid immediate or undefined label '${s}'`);
}

function encR(op, f3, f7, rd, rs1, rs2) {
  return (
    (((f7 & 0x7f) << 25) |
      ((rs2 & 0x1f) << 20) |
      ((rs1 & 0x1f) << 15) |
      ((f3 & 7) << 12) |
      ((rd & 0x1f) << 7) |
      (op & 0x7f)) >>>
    0
  );
}
function encI(op, f3, rd, rs1, imm) {
  return (
    (((imm & 0xfff) << 20) |
      ((rs1 & 0x1f) << 15) |
      ((f3 & 7) << 12) |
      ((rd & 0x1f) << 7) |
      (op & 0x7f)) >>>
    0
  );
}
function encS(op, f3, rs1, rs2, imm) {
  const lo = imm & 0x1f;
  const hi = (imm >> 5) & 0x7f;
  return (
    ((hi << 25) |
      ((rs2 & 0x1f) << 20) |
      ((rs1 & 0x1f) << 15) |
      ((f3 & 7) << 12) |
      (lo << 7) |
      (op & 0x7f)) >>>
    0
  );
}
function encB(op, f3, rs1, rs2, off) {
  const b12 = (off >> 12) & 1;
  const b11 = (off >> 11) & 1;
  const b10_5 = (off >> 5) & 0x3f;
  const b4_1 = (off >> 1) & 0xf;
  return (
    ((b12 << 31) |
      (b10_5 << 25) |
      ((rs2 & 0x1f) << 20) |
      ((rs1 & 0x1f) << 15) |
      ((f3 & 7) << 12) |
      (b4_1 << 8) |
      (b11 << 7) |
      (op & 0x7f)) >>>
    0
  );
}
function encU(op, rd, imm20) {
  return (((imm20 & 0xfffff) << 12) | ((rd & 0x1f) << 7) | (op & 0x7f)) >>> 0;
}
function encJ(op, rd, off) {
  const b20 = (off >> 20) & 1;
  const b10_1 = (off >> 1) & 0x3ff;
  const b11 = (off >> 11) & 1;
  const b19_12 = (off >> 12) & 0xff;
  return (
    ((b20 << 31) |
      (b10_1 << 21) |
      (b11 << 20) |
      (b19_12 << 12) |
      ((rd & 0x1f) << 7) |
      (op & 0x7f)) >>>
    0
  );
}

// Two-pass RV32IM Assembler with .text / .data / .word / .asciz and rich pseudo-instructions
function assembleRV32(source) {
  const rawLines = String(source).split(/\r?\n/);
  const items = [];
  const labels = {};
  let section = "text";
  let textPC = 0;
  let dataPC = 0x2000;
  const dataBytes = [];

  const emitDataByte = (b) => {
    dataBytes.push([dataPC++, b & 0xff]);
  };
  const alignData4 = () => {
    while (dataPC & 3) emitDataByte(0);
  };

  for (let lnIdx = 0; lnIdx < rawLines.length; lnIdx++) {
    let line = rawLines[lnIdx];
    // Strip # or ; comments outside string quotes
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"' && line[i - 1] !== "\\") inQuote = !inQuote;
      if (!inQuote && (line[i] === "#" || line[i] === ";")) {
        line = line.slice(0, i);
        break;
      }
    }
    line = line.trim();
    if (!line) continue;

    while (/^[A-Za-z_.$][\w.$]*:/.test(line)) {
      const colon = line.indexOf(":");
      const lbl = line.slice(0, colon).trim();
      labels[lbl] = section === "text" ? textPC : dataPC;
      line = line.slice(colon + 1).trim();
    }
    if (!line) continue;

    if (line.startsWith(".")) {
      const mDir = line.match(/^(\.\w+)\s*(.*)$/);
      const dir = mDir ? mDir[1].toLowerCase() : line.toLowerCase();
      const rest = mDir ? mDir[2].trim() : "";
      if (dir === ".text") {
        section = "text";
        continue;
      }
      if (dir === ".data") {
        section = "data";
        continue;
      }
      if (dir === ".align") {
        alignData4();
        continue;
      }
      if (dir === ".asciz" || dir === ".string") {
        const strMatch = rest.match(/^"((?:[^"\\]|\\.)*)"$/);
        const raw = strMatch ? strMatch[1] : rest.replace(/^"|"$/g, "");
        const unescaped = raw
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\0/g, "\0")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
        for (let i = 0; i < unescaped.length; i++) {
          emitDataByte(unescaped.charCodeAt(i));
        }
        emitDataByte(0);
        alignData4();
        continue;
      }
      if (dir === ".word") {
        alignData4();
        const parts = rest
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const p of parts) {
          const val = parseImm(p, labels, 0, false);
          emitDataByte(val & 0xff);
          emitDataByte((val >>> 8) & 0xff);
          emitDataByte((val >>> 16) & 0xff);
          emitDataByte((val >>> 24) & 0xff);
        }
        continue;
      }
      continue;
    }

    const sp = line.search(/\s/);
    const op = (sp < 0 ? line : line.slice(0, sp)).toLowerCase();
    const argStr = sp < 0 ? "" : line.slice(sp + 1).trim();
    const args = argStr
      ? argStr
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean)
      : [];

    // Expand multi-word pseudo-instructions (li 32-bit, la, call) cleanly
    if (op === "li") {
      items.push({ pc: textPC, op: "__li_hi", args, lineNo: lnIdx + 1, src: line });
      textPC += 4;
      items.push({ pc: textPC, op: "__li_lo", args, lineNo: lnIdx + 1, src: "" });
      textPC += 4;
    } else if (op === "la") {
      items.push({ pc: textPC, op: "__la_hi", args, lineNo: lnIdx + 1, src: line });
      textPC += 4;
      items.push({ pc: textPC, op: "__la_lo", args, lineNo: lnIdx + 1, src: "" });
      textPC += 4;
    } else if (op === "call") {
      items.push({
        pc: textPC,
        op: "jal",
        args: ["ra", args[0]],
        lineNo: lnIdx + 1,
        src: line,
      });
      textPC += 4;
    } else {
      items.push({ pc: textPC, op, args, lineNo: lnIdx + 1, src: line });
      textPC += 4;
    }
  }

  const R_OPS = {
    add: [0, 0x00],
    sub: [0, 0x20],
    sll: [1, 0x00],
    slt: [2, 0x00],
    sltu: [3, 0x00],
    xor: [4, 0x00],
    srl: [5, 0x00],
    sra: [5, 0x20],
    or: [6, 0x00],
    and: [7, 0x00],
    mul: [0, 0x01],
    mulh: [1, 0x01],
    mulhsu: [2, 0x01],
    mulhu: [3, 0x01],
    div: [4, 0x01],
    divu: [5, 0x01],
    rem: [6, 0x01],
    remu: [7, 0x01],
  };
  const I_OPS = {
    addi: 0,
    slti: 2,
    sltiu: 3,
    xori: 4,
    ori: 6,
    andi: 7,
  };
  const LOAD_OPS = { lb: 0, lh: 1, lw: 2, lbu: 4, lhu: 5 };
  const STORE_OPS = { sb: 0, sh: 1, sw: 2 };
  const BR_OPS = { beq: 0, bne: 1, blt: 4, bge: 5, bltu: 6, bgeu: 7 };

  const words = new Uint32Array(items.length);
  const disasm = new Map();

  const splitHiLo = (val32) => {
    const v = val32 | 0;
    const lo = (v << 20) >> 20; // sign-extended 12-bit
    const hi = ((v - lo) >>> 12) & 0xfffff;
    return [hi, lo];
  };

  const parseMemArg = (str) => {
    const m = str.match(/^(.+?)\(\s*([A-Za-z0-9]+)\s*\)$/);
    if (!m) throw new Error(`Expected offset(reg), got '${str}'`);
    return [m[1].trim(), parseReg(m[2])];
  };

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const { pc, op, args } = it;
    let w = 0x00000013; // NOP

    if (op === "__li_hi" || op === "__la_hi") {
      const rd = parseReg(args[0]);
      const val = parseImm(args[1], labels, 0, false);
      const [hi] = splitHiLo(val);
      w = hi !== 0 ? encU(0x37, rd, hi) : encI(0x13, 0, 0, 0, 0);
      disasm.set(pc, it.src || `li ${ABI_NAMES[rd]}, ${val}`);
    } else if (op === "__li_lo" || op === "__la_lo") {
      const rd = parseReg(args[0]);
      const val = parseImm(args[1], labels, 0, false);
      const [hi, lo] = splitHiLo(val);
      w = encI(0x13, 0, rd, hi !== 0 ? rd : 0, lo);
      disasm.set(pc, `addi ${ABI_NAMES[rd]}, ${ABI_NAMES[hi !== 0 ? rd : 0]}, ${lo}`);
    } else if (op === "nop") {
      w = encI(0x13, 0, 0, 0, 0);
    } else if (op === "mv") {
      w = encI(0x13, 0, parseReg(args[0]), parseReg(args[1]), 0);
    } else if (op === "not") {
      w = encI(0x13, 4, parseReg(args[0]), parseReg(args[1]), -1);
    } else if (op === "neg") {
      w = encR(0x33, 0, 0x20, parseReg(args[0]), 0, parseReg(args[1]));
    } else if (op === "seqz") {
      w = encI(0x13, 3, parseReg(args[0]), parseReg(args[1]), 1);
    } else if (op === "snez") {
      w = encR(0x33, 3, 0, parseReg(args[0]), 0, parseReg(args[1]));
    } else if (op === "j") {
      w = encJ(0x6f, 0, parseImm(args[0], labels, pc, true));
    } else if (op === "jr") {
      w = encI(0x67, 0, 0, parseReg(args[0]), 0);
    } else if (op === "ret") {
      w = encI(0x67, 0, 0, 1, 0);
    } else if (op === "beqz") {
      w = encB(0x63, 0, parseReg(args[0]), 0, parseImm(args[1], labels, pc, true));
    } else if (op === "bnez") {
      w = encB(0x63, 1, parseReg(args[0]), 0, parseImm(args[1], labels, pc, true));
    } else if (op === "ble") {
      w = encB(
        0x63,
        5,
        parseReg(args[1]),
        parseReg(args[0]),
        parseImm(args[2], labels, pc, true),
      );
    } else if (op === "bgt") {
      w = encB(
        0x63,
        4,
        parseReg(args[1]),
        parseReg(args[0]),
        parseImm(args[2], labels, pc, true),
      );
    } else if (op in R_OPS) {
      const [f3, f7] = R_OPS[op];
      w = encR(0x33, f3, f7, parseReg(args[0]), parseReg(args[1]), parseReg(args[2]));
    } else if (op in I_OPS) {
      w = encI(
        0x13,
        I_OPS[op],
        parseReg(args[0]),
        parseReg(args[1]),
        parseImm(args[2], labels, pc),
      );
    } else if (op === "slli" || op === "srli" || op === "srai") {
      const shamt = parseImm(args[2], labels, pc) & 0x1f;
      const f3 = op === "slli" ? 1 : 5;
      const imm = op === "srai" ? (0x20 << 5) | shamt : shamt;
      w = encI(0x13, f3, parseReg(args[0]), parseReg(args[1]), imm);
    } else if (op === "lui") {
      w = encU(0x37, parseReg(args[0]), parseImm(args[1], labels, pc));
    } else if (op === "auipc") {
      w = encU(0x17, parseReg(args[0]), parseImm(args[1], labels, pc));
    } else if (op in LOAD_OPS) {
      const rd = parseReg(args[0]);
      const [offTok, rs1] = parseMemArg(args[1]);
      w = encI(0x03, LOAD_OPS[op], rd, rs1, parseImm(offTok, labels, pc));
    } else if (op in STORE_OPS) {
      const rs2 = parseReg(args[0]);
      const [offTok, rs1] = parseMemArg(args[1]);
      w = encS(0x23, STORE_OPS[op], rs1, rs2, parseImm(offTok, labels, pc));
    } else if (op in BR_OPS) {
      w = encB(
        0x63,
        BR_OPS[op],
        parseReg(args[0]),
        parseReg(args[1]),
        parseImm(args[2], labels, pc, true),
      );
    } else if (op === "jal") {
      if (args.length === 1) {
        w = encJ(0x6f, 1, parseImm(args[0], labels, pc, true));
      } else {
        w = encJ(0x6f, parseReg(args[0]), parseImm(args[1], labels, pc, true));
      }
    } else if (op === "jalr") {
      if (args.length === 1) {
        w = encI(0x67, 0, 1, parseReg(args[0]), 0);
      } else if (args.length === 2 && args[1].includes("(")) {
        const [offTok, rs1] = parseMemArg(args[1]);
        w = encI(0x67, 0, parseReg(args[0]), rs1, parseImm(offTok, labels, pc));
      } else {
        w = encI(
          0x67,
          0,
          parseReg(args[0]),
          parseReg(args[1]),
          args[2] ? parseImm(args[2], labels, pc) : 0,
        );
      }
    } else if (op === "ecall") {
      w = 0x00000073;
    } else if (op === "ebreak" || op === "halt") {
      w = 0x00100073;
    } else {
      throw new Error(`Line ${it.lineNo}: unknown instruction '${op}'`);
    }

    words[i] = w >>> 0;
    if (!disasm.has(pc)) disasm.set(pc, it.src || `${op} ${args.join(", ")}`);
  }

  return { words, dataBytes, labels, disasm, codeBytes: words.length * 4 };
}

// Set-Associative LRU Hardware Cache Simulator
var SetAssocCache = class {
  constructor(sizeBytes = 4096, ways = 4, lineBytes = 64) {
    this.sizeBytes = sizeBytes;
    this.ways = ways;
    this.lineBytes = lineBytes;
    this.numSets = Math.max(1, Math.floor(sizeBytes / (ways * lineBytes)));
    this.reset();
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.tick = 0;
    this.sets = Array.from({ length: this.numSets }, () =>
      Array.from({ length: this.ways }, () => ({
        valid: false,
        tag: -1,
        lru: 0,
        dirty: false,
      })),
    );
  }

  access(addr, isWrite = false) {
    this.tick++;
    const lineAddr = (addr >>> 0) >>> Math.round(Math.log2(this.lineBytes));
    const setIdx = lineAddr % this.numSets;
    const tag = Math.floor(lineAddr / this.numSets);
    const set = this.sets[setIdx];

    for (let w = 0; w < this.ways; w++) {
      if (set[w].valid && set[w].tag === tag) {
        set[w].lru = this.tick;
        if (isWrite) set[w].dirty = true;
        this.hits++;
        return true;
      }
    }

    this.misses++;
    let victim = 0;
    for (let w = 1; w < this.ways; w++) {
      if (!set[w].valid) {
        victim = w;
        break;
      }
      if (set[w].lru < set[victim].lru) victim = w;
    }
    set[victim] = { valid: true, tag, lru: this.tick, dirty: isWrite };
    return false;
  }

  hitRate() {
    const tot = this.hits + this.misses;
    return tot ? this.hits / tot : 1;
  }
};

// Built-in RISC-V RV32IM Programs Stored on Simulated NVMe SSD
var RV32_PROGRAMS = {
  "GPU Co-Processor Driver (MMIO)": `# Drives the live WebGL2 GPU shader over PCIe MMIO (0x20000000..0x2000000C)!
# Computes smooth triangle-wave orbital parameters on RV32IM & streams to VRAM.
.data
banner: .asciz "[RV32IM] PCIe 5.0 GPU MMIO driver online -> streaming uCPU uniforms\\n"

.text
  la a0, banner
  li a7, 4
  ecall

  li s0, 0x20000000   # GPU MMIO base register
  li s1, 0            # phase counter
  li s2, 4            # step delta
  li s3, 512          # upper bound

loop:
  add s1, s1, s2
  blt s1, s3, check_low
  neg s2, s2
check_low:
  bge s1, zero, send_gpu
  neg s2, s2

send_gpu:
  sw s1, 0(s0)        # uCPU.x = orbital modulation (0..512 -> 0..2.0)
  sub t0, s3, s1
  sw t0, 4(s0)        # uCPU.y = complementary phase
  mul t1, s1, t0
  srli t1, t1, 9
  sw t1, 8(s0)        # uCPU.z = nonlinear product harmonic
  addi t2, t2, 1
  sw t2, 12(s0)       # uCPU.w = CPU frame heartbeat
  j loop
`,

  "Sieve of Eratosthenes (Primes)": `# Computes prime numbers < 120 in L1D cache & prints them to the OS console
.data
hdr: .asciz "Primes < 120: "
spc: .asciz " "
nl:  .asciz "\\nDone.\\n"

.text
  la a0, hdr
  li a7, 4
  ecall

  li s0, 0x3000       # sieve byte array base in RAM
  li s1, 120          # limit N
  li t0, 0
clear_loop:
  add t1, s0, t0
  sb zero, 0(t1)
  addi t0, t0, 1
  blt t0, s1, clear_loop

  li s2, 2            # candidate p = 2
outer:
  mul t0, s2, s2
  bge t0, s1, print_all
  add t1, s0, s2
  lbu t2, 0(t1)
  bnez t2, next_p
mark:
  add t3, s0, t0
  li t4, 1
  sb t4, 0(t3)
  add t0, t0, s2
  blt t0, s1, mark
next_p:
  addi s2, s2, 1
  j outer

print_all:
  li s2, 2
ploop:
  add t1, s0, s2
  lbu t2, 0(t1)
  bnez t2, pskip
  mv a0, s2
  li a7, 1
  ecall
  la a0, spc
  li a7, 4
  ecall
pskip:
  addi s2, s2, 1
  blt s2, s1, ploop

  la a0, nl
  li a7, 4
  ecall
  ebreak
`,

  "Quicksort & Cache Benchmark": `# Sorts 12 32-bit integers in-place + reports RV32IM hardware multiply checksum
.data
msg0: .asciz "Sorting 12 words in L1D: "
msg1: .asciz "\\nSorted: "
spc:  .asciz " "
done: .asciz "\\nChecksum = "
nl:   .asciz "\\n"
arr:  .word 89, 14, 67, 3, 92, 41, 28, 75, 11, 56, 33, 7

.text
  la a0, msg0
  li a7, 4
  ecall

  la s0, arr
  li s1, 12           # N = 12

  # Insertion/comb hybrid pass stressing branch predictor & forwarding
  li t0, 1
iloop:
  bge t0, s1, sorted
  slli t1, t0, 2
  add t2, s0, t1
  lw t3, 0(t2)        # key = arr[i]
  addi t4, t0, -1     # j = i - 1
jloop:
  blt t4, zero, place
  slli t5, t4, 2
  add t6, s0, t5
  lw a2, 0(t6)
  ble a2, t3, place
  sw a2, 4(t6)
  addi t4, t4, -1
  j jloop
place:
  addi t5, t4, 1
  slli t5, t5, 2
  add t6, s0, t5
  sw t3, 0(t6)
  addi t0, t0, 1
  j iloop

sorted:
  la a0, msg1
  li a7, 4
  ecall

  li t0, 0
  li s2, 0            # weighted checksum
out_loop:
  slli t1, t0, 2
  add t2, s0, t1
  lw a0, 0(t2)
  addi t3, t0, 1
  mul t4, a0, t3
  add s2, s2, t4
  li a7, 1
  ecall
  la a0, spc
  li a7, 4
  ecall
  addi t0, t0, 1
  blt t0, s1, out_loop

  la a0, done
  li a7, 4
  ecall
  mv a0, s2
  li a7, 1
  ecall
  la a0, nl
  li a7, 4
  ecall
  ebreak
`,

  "Interactive Keyboard Echo + GPU Tint": `# Reads real keystrokes from the 3D RGB keyboard / terminal (0x10000008)
# Echoes ASCII + shifts the live 3D GPU shader palette on every key press!
.data
prompt: .asciz "Type on 3D keyboard or terminal input -> CPU echoes & shifts GPU color!\\n> "

.text
  la a0, prompt
  li a7, 4
  ecall

  li s0, 0x10000000   # UART / Keyboard MMIO
  li s1, 0x20000000   # GPU MMIO
  li s2, 64

poll_key:
  addi s2, s2, 1
  andi t3, s2, 511
  sw t3, 12(s1)       # subtle heartbeat to GPU
  lw t0, 8(s0)        # RX_READY?
  beqz t0, poll_key

  lw t1, 12(s0)       # pop ASCII keycode
  sw t1, 0(s0)        # echo char to terminal
  slli t2, t1, 2
  sw t2, 0(s1)        # modulate GPU uCPU.x with keycode!
  sw t1, 4(s1)        # modulate GPU uCPU.y
  j poll_key
`,
};

var RV32ModernSystem = class {
  constructor() {
    this.ramBytes = 65536; // 64 KB unified low RAM
    this.ram = new Uint8Array(this.ramBytes);
    this.ramView = new DataView(this.ram.buffer);
    this.regs = new Int32Array(32);

    this.l1i = new SetAssocCache(2048, 4, 64);
    this.l1d = new SetAssocCache(4096, 4, 64);
    this.l2 = new SetAssocCache(16384, 8, 64);

    // 64-entry 2-bit saturating branch history table (0=SN, 1=WN, 2=WT, 3=ST)
    this.bht = new Uint8Array(64);

    // Virtual NVMe SSD filesystem + 32 x 256B raw flash blocks
    this.nvmeFiles = {
      "/demos/gpu_driver.s": RV32_PROGRAMS["GPU Co-Processor Driver (MMIO)"],
      "/demos/primes.s": RV32_PROGRAMS["Sieve of Eratosthenes (Primes)"],
      "/demos/quicksort.s": RV32_PROGRAMS["Quicksort & Cache Benchmark"],
      "/demos/kbd_echo.s": RV32_PROGRAMS["Interactive Keyboard Echo + GPU Tint"],
      "/etc/sysinfo.txt":
        "Zen-RV32IM Hybrid Workstation · 5-Stage Pipeline · L1I/L1D/L2 Cache · PCIe 5.0 WebGL2 GPU · NVMe Gen4\n",
    };
    this.nvmeBlocks = new Uint8Array(32 * 256);
    this._seedNvmeBlocks();

    // Live MMIO state
    this.gpuRegs = new Int32Array([180, 96, 220, 0, 0, 0, 0, 0]);
    this.keyFifo = [];
    this.termOut = "";
    this.disasm = new Map();
    this.coreHeat = new Float32Array(16);
    this.busPulses = { ddr: 0, pcie: 0, nvme: 0, io: 0 };
    this.lastKeyCode = 0;

    this.loadProgram(RV32_PROGRAMS["GPU Co-Processor Driver (MMIO)"]);
  }

  _seedNvmeBlocks() {
    const text = Object.entries(this.nvmeFiles)
      .map(([k, v]) => `=== ${k} ===\n${v}`)
      .join("\n");
    for (let i = 0; i < Math.min(text.length, this.nvmeBlocks.length); i++) {
      this.nvmeBlocks[i] = text.charCodeAt(i) & 0xff;
    }
  }

  resetState(keepTerm = false) {
    this.regs.fill(0);
    this.regs[2] = 0xfff0; // stack pointer sp
    this.pc = 0;
    this.halted = false;
    this.bht.fill(2);
    this.l1i.reset();
    this.l1d.reset();
    this.l2.reset();
    if (!keepTerm) this.termOut = "";

    const emptyStage = () => ({ valid: false, pc: 0, inst: 0x13, text: "bubble" });
    this.pipe = {
      IF: emptyStage(),
      ID: emptyStage(),
      EX: emptyStage(),
      MEM: emptyStage(),
      WB: emptyStage(),
    };
    this._prevLoadRd = 0;

    this.stats = {
      cycles: 0,
      instret: 0,
      forwards: 0,
      loadStalls: 0,
      bpHits: 0,
      bpMisses: 0,
      dramReads: 0,
      mmioGpuWrites: 0,
      nvmeOps: 0,
    };
  }

  loadProgram(asmSource, keepTerm = false) {
    const compiled = assembleRV32(asmSource);
    this.ram.fill(0);
    this.resetState(keepTerm);
    this.disasm = compiled.disasm;
    this.currentAsm = asmSource;

    for (let i = 0; i < compiled.words.length; i++) {
      this.ramView.setUint32(i * 4, compiled.words[i], true);
    }
    for (const [addr, byteVal] of compiled.dataBytes) {
      if (addr >= 0 && addr < this.ramBytes) this.ram[addr] = byteVal;
    }
    this.pipe.IF = {
      valid: true,
      pc: 0,
      inst: this.ramView.getUint32(0, true),
      text: this.disasm.get(0) || "0x00000013",
    };
    return compiled;
  }

  pushKey(ch) {
    const code = typeof ch === "number" ? ch : String(ch).charCodeAt(0);
    if (this.keyFifo.length < 64) this.keyFifo.push(code & 0xff);
    this.lastKeyCode = code & 0xff;
    this.busPulses.io = 1;
  }

  appendConsole(str) {
    this.termOut += str;
    if (this.termOut.length > 3600) {
      this.termOut = this.termOut.slice(this.termOut.length - 3000);
    }
  }

  _cacheFetchInst(addr) {
    if (!this.l1i.access(addr, false)) {
      if (!this.l2.access(addr, false)) {
        this.stats.dramReads++;
        this.busPulses.ddr = 1;
      }
    }
  }

  _cacheData(addr, isWrite) {
    if (!this.l1d.access(addr, isWrite)) {
      if (!this.l2.access(addr, isWrite)) {
        this.stats.dramReads++;
        this.busPulses.ddr = 1;
      }
    }
  }

  readMem(addr, bytes = 4, signed = true) {
    const a = addr >>> 0;
    if (a >= 0x10000000 && a < 0x10000020) {
      this.busPulses.io = 1;
      const off = a - 0x10000000;
      if (off === 8) return this.keyFifo.length > 0 ? 1 : 0;
      if (off === 12) return this.keyFifo.length > 0 ? this.keyFifo.shift() : 0;
      return 0;
    }
    if (a >= 0x20000000 && a < 0x20000020) {
      const idx = (a - 0x20000000) >>> 2;
      return this.gpuRegs[idx & 7] | 0;
    }
    if (a >= 0x30000000 && a < 0x30000010) {
      return this.stats.nvmeOps | 0;
    }
    this._cacheData(a, false);
    if (a + bytes > this.ramBytes) return 0;
    if (bytes === 1) return signed ? this.ramView.getInt8(a) : this.ramView.getUint8(a);
    if (bytes === 2)
      return signed ? this.ramView.getInt16(a, true) : this.ramView.getUint16(a, true);
    return this.ramView.getInt32(a, true);
  }

  writeMem(addr, val, bytes = 4) {
    const a = addr >>> 0;
    if (a >= 0x10000000 && a < 0x10000020) {
      this.busPulses.io = 1;
      const off = a - 0x10000000;
      if (off === 0) this.appendConsole(String.fromCharCode(val & 0xff));
      else if (off === 4) this.appendConsole(String(val | 0));
      return;
    }
    if (a >= 0x20000000 && a < 0x20000020) {
      const idx = (a - 0x20000000) >>> 2;
      this.gpuRegs[idx & 7] = val | 0;
      this.stats.mmioGpuWrites++;
      this.busPulses.pcie = 1;
      return;
    }
    if (a >= 0x30000000 && a < 0x30000020) {
      // NVMe DMA block read/write: 0x30000000 = sector, 0x30000004 = ramAddr, 0x30000008 = cmd (1=read, 2=write)
      const off = a - 0x30000000;
      if (off === 0) this._nvmeLba = (val >>> 0) % 32;
      else if (off === 4) this._nvmeDst = val >>> 0;
      else if (off === 8) {
        const lba = (this._nvmeLba || 0) * 256;
        const dst = this._nvmeDst || 0x4000;
        for (let i = 0; i < 256 && dst + i < this.ramBytes; i++) {
          if (val === 1) this.ram[dst + i] = this.nvmeBlocks[lba + i];
          else if (val === 2) this.nvmeBlocks[lba + i] = this.ram[dst + i];
        }
        this.stats.nvmeOps++;
        this.busPulses.nvme = 1;
      }
      return;
    }
    this._cacheData(a, true);
    if (a + bytes > this.ramBytes) return;
    if (bytes === 1) this.ramView.setUint8(a, val & 0xff);
    else if (bytes === 2) this.ramView.setUint16(a, val & 0xffff, true);
    else this.ramView.setInt32(a, val | 0, true);
  }

  // Execute one architectural instruction while advancing the 5-stage pipeline telemetry, hazards, & caches
  step() {
    if (this.halted) return false;
    const pc = this.pc >>> 0;
    if (pc >= this.ramBytes) {
      this.halted = true;
      return false;
    }

    this._cacheFetchInst(pc);
    const inst = this.ramView.getUint32(pc, true);
    const opcode = inst & 0x7f;
    const rd = (inst >>> 7) & 0x1f;
    const f3 = (inst >>> 12) & 7;
    const rs1 = (inst >>> 15) & 0x1f;
    const rs2 = (inst >>> 20) & 0x1f;
    const f7 = (inst >>> 25) & 0x7f;

    // Advance pipeline shift registers
    this.pipe.WB = this.pipe.MEM;
    this.pipe.MEM = this.pipe.EX;
    this.pipe.EX = this.pipe.ID;
    this.pipe.ID = this.pipe.IF;

    // Detect EX/MEM & MEM/WB forwarding or 1-cycle load-use hazard stall (true RV32I operand decode)
    const usesRs1 =
      opcode === 0x33 ||
      opcode === 0x13 ||
      opcode === 0x03 ||
      opcode === 0x23 ||
      opcode === 0x63 ||
      opcode === 0x67;
    const usesRs2 = opcode === 0x33 || opcode === 0x23 || opcode === 0x63;
    const exRd = this.pipe.EX && this.pipe.EX.rd;
    const memRd = this.pipe.MEM && this.pipe.MEM.rd;
    const hitEx = exRd && ((usesRs1 && exRd === rs1) || (usesRs2 && exRd === rs2));
    const hitMem = memRd && ((usesRs1 && memRd === rs1) || (usesRs2 && memRd === rs2));
    if (hitEx) {
      if (this._prevLoadRd === exRd) {
        this.stats.loadStalls++;
        this.stats.cycles++;
      }
      this.stats.forwards++;
    } else if (hitMem) {
      this.stats.forwards++;
    }
    this._prevLoadRd = 0;

    let nextPC = (pc + 4) >>> 0;
    const r = this.regs;
    const v1 = r[rs1] | 0;
    const v2 = r[rs2] | 0;
    let writeRd = 0;
    let writeVal = 0;

    if (opcode === 0x37) {
      // LUI
      writeRd = rd;
      writeVal = inst & 0xfffff000;
    } else if (opcode === 0x17) {
      // AUIPC
      writeRd = rd;
      writeVal = (pc + (inst & 0xfffff000)) | 0;
    } else if (opcode === 0x6f) {
      // JAL
      const b20 = (inst >> 31) & 1;
      const b10_1 = (inst >>> 21) & 0x3ff;
      const b11 = (inst >>> 20) & 1;
      const b19_12 = (inst >>> 12) & 0xff;
      const raw = (b20 << 20) | (b19_12 << 12) | (b11 << 11) | (b10_1 << 1);
      const off = (raw << 11) >> 11;
      writeRd = rd;
      writeVal = nextPC | 0;
      nextPC = (pc + off) >>> 0;
      this.stats.cycles++; // control transfer fetch bubble
    } else if (opcode === 0x67) {
      // JALR
      const imm = inst >> 20;
      writeRd = rd;
      writeVal = nextPC | 0;
      nextPC = ((v1 + imm) & ~1) >>> 0;
      this.stats.cycles++;
    } else if (opcode === 0x63) {
      // BRANCH + 2-bit dynamic predictor
      const b12 = (inst >>> 31) & 1;
      const b11 = (inst >>> 7) & 1;
      const b10_5 = (inst >>> 25) & 0x3f;
      const b4_1 = (inst >>> 8) & 0xf;
      const raw = (b12 << 12) | (b11 << 11) | (b10_5 << 5) | (b4_1 << 1);
      const off = (raw << 19) >> 19;

      let taken = false;
      if (f3 === 0) taken = v1 === v2;
      else if (f3 === 1) taken = v1 !== v2;
      else if (f3 === 4) taken = v1 < v2;
      else if (f3 === 5) taken = v1 >= v2;
      else if (f3 === 6) taken = v1 >>> 0 < v2 >>> 0;
      else if (f3 === 7) taken = v1 >>> 0 >= v2 >>> 0;

      const bIdx = (pc >>> 2) & 63;
      const state = this.bht[bIdx];
      const predTaken = state >= 2;
      if (predTaken === taken) {
        this.stats.bpHits++;
      } else {
        this.stats.bpMisses++;
        this.stats.cycles += 2; // 2-cycle branch mispredict flush penalty
      }
      this.bht[bIdx] = taken ? Math.min(3, state + 1) : Math.max(0, state - 1);
      if (taken) nextPC = (pc + off) >>> 0;
    } else if (opcode === 0x03) {
      // LOAD
      const imm = inst >> 20;
      const addr = (v1 + imm) >>> 0;
      writeRd = rd;
      this._prevLoadRd = rd;
      if (f3 === 0) writeVal = this.readMem(addr, 1, true);
      else if (f3 === 1) writeVal = this.readMem(addr, 2, true);
      else if (f3 === 2) writeVal = this.readMem(addr, 4, true);
      else if (f3 === 4) writeVal = this.readMem(addr, 1, false);
      else if (f3 === 5) writeVal = this.readMem(addr, 2, false);
    } else if (opcode === 0x23) {
      // STORE
      const raw = (((inst >>> 25) & 0x7f) << 5) | ((inst >>> 7) & 0x1f);
      const imm = (raw << 20) >> 20;
      const addr = (v1 + imm) >>> 0;
      if (f3 === 0) this.writeMem(addr, v2, 1);
      else if (f3 === 1) this.writeMem(addr, v2, 2);
      else if (f3 === 2) this.writeMem(addr, v2, 4);
    } else if (opcode === 0x13) {
      // OP-IMM
      const imm = inst >> 20;
      const shamt = (inst >>> 20) & 0x1f;
      writeRd = rd;
      if (f3 === 0) writeVal = (v1 + imm) | 0;
      else if (f3 === 2) writeVal = v1 < imm ? 1 : 0;
      else if (f3 === 3) writeVal = v1 >>> 0 < imm >>> 0 ? 1 : 0;
      else if (f3 === 4) writeVal = v1 ^ imm;
      else if (f3 === 6) writeVal = v1 | imm;
      else if (f3 === 7) writeVal = v1 & imm;
      else if (f3 === 1) writeVal = v1 << shamt;
      else if (f3 === 5) writeVal = f7 & 0x20 ? v1 >> shamt : (v1 >>> shamt) | 0;
    } else if (opcode === 0x33) {
      // OP (RV32I + RV32M)
      writeRd = rd;
      if (f7 === 0x01) {
        if (f3 === 0) writeVal = Math.imul(v1, v2);
        else if (f3 === 1) writeVal = Number((BigInt(v1) * BigInt(v2)) >> 32n) | 0;
        else if (f3 === 2) writeVal = Number((BigInt(v1) * BigInt(v2 >>> 0)) >> 32n) | 0;
        else if (f3 === 3)
          writeVal = Number((BigInt(v1 >>> 0) * BigInt(v2 >>> 0)) >> 32n) | 0;
        else if (f3 === 4)
          writeVal = v2 === 0 ? -1 : v1 === -2147483648 && v2 === -1 ? v1 : (v1 / v2) | 0;
        else if (f3 === 5) writeVal = v2 === 0 ? -1 : ((v1 >>> 0) / (v2 >>> 0)) | 0;
        else if (f3 === 6)
          writeVal = v2 === 0 ? v1 : v1 === -2147483648 && v2 === -1 ? 0 : v1 % v2;
        else if (f3 === 7) writeVal = v2 === 0 ? v1 : ((v1 >>> 0) % (v2 >>> 0)) | 0;
      } else {
        if (f3 === 0) writeVal = f7 & 0x20 ? (v1 - v2) | 0 : (v1 + v2) | 0;
        else if (f3 === 1) writeVal = v1 << (v2 & 31);
        else if (f3 === 2) writeVal = v1 < v2 ? 1 : 0;
        else if (f3 === 3) writeVal = v1 >>> 0 < v2 >>> 0 ? 1 : 0;
        else if (f3 === 4) writeVal = v1 ^ v2;
        else if (f3 === 5)
          writeVal = f7 & 0x20 ? v1 >> (v2 & 31) : (v1 >>> (v2 & 31)) | 0;
        else if (f3 === 6) writeVal = v1 | v2;
        else if (f3 === 7) writeVal = v1 & v2;
      }
    } else if (opcode === 0x73) {
      // SYSTEM: ECALL / EBREAK
      const sysImm = inst >>> 20;
      if (sysImm === 1) {
        this.halted = true;
      } else {
        // RISC-V RARS/Linux mini-OS syscalls via a7 (x17) & a0 (x10)
        const call = r[17] | 0;
        const arg0 = r[10] | 0;
        if (call === 1) {
          this.appendConsole(String(arg0));
        } else if (call === 4) {
          let p = arg0 >>> 0;
          let guard = 0;
          let out = "";
          while (p < this.ramBytes && guard++ < 512) {
            const ch = this.ram[p++];
            if (ch === 0) break;
            out += String.fromCharCode(ch);
          }
          this.appendConsole(out);
        } else if (call === 11) {
          this.appendConsole(String.fromCharCode(arg0 & 0xff));
        } else if (call === 30) {
          r[10] = this.stats.cycles | 0;
        } else if (call === 10) {
          this.halted = true;
        }
      }
    }

    if (writeRd !== 0) {
      r[writeRd] = writeVal | 0;
    }
    r[0] = 0;

    this.pc = nextPC;
    this.stats.instret++;
    this.stats.cycles++;

    // Distribute thread/core activity across the 16 Zen CCD cores based on PC/SP/task hash
    const activeCore = ((pc >>> 2) + (this.stats.instret >>> 5)) & 15;
    this.coreHeat[activeCore] = Math.min(1, this.coreHeat[activeCore] + 0.35);

    const nextWord = nextPC < this.ramBytes ? this.ramView.getUint32(nextPC, true) : 0x13;
    this.pipe.IF = {
      valid: !this.halted,
      pc: nextPC,
      inst: nextWord,
      rd: (nextWord >>> 7) & 0x1f,
      text: this.disasm.get(nextPC) || `0x${bt(nextWord, 8)}`,
    };
    this.pipe.ID.rd = rd;
    return !this.halted;
  }

  runSteps(n) {
    let executed = 0;
    for (let i = 0; i < n; i++) {
      if (!this.step()) break;
      executed++;
    }
    return executed;
  }

  decayHeat(dt) {
    const k = Math.exp(-dt * 4.5);
    for (let i = 0; i < 16; i++) this.coreHeat[i] *= k;
    for (const key of Object.keys(this.busPulses)) {
      this.busPulses[key] *= Math.exp(-dt * 5.5);
    }
  }

  ipc() {
    return this.stats.cycles ? this.stats.instret / this.stats.cycles : 1;
  }

  bpAccuracy() {
    const tot = this.stats.bpHits + this.stats.bpMisses;
    return tot ? this.stats.bpHits / tot : 1;
  }

  gpuUniformVec4() {
    return [
      this.gpuRegs[0] / 256,
      this.gpuRegs[1] / 256,
      this.gpuRegs[2] / 256,
      this.gpuRegs[3] / 256,
    ];
  }

  // Interactive Mini-OS Shell Command Interpreter
  execShell(cmdLine) {
    const trimmed = String(cmdLine).trim();
    if (!trimmed) return "";
    this.appendConsole(`$ ${trimmed}\n`);
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "help") {
      this.appendConsole(
        "Mini-OS Commands:\n" +
          "  ls                 - list NVMe Gen4 SSD files\n" +
          "  cat <path>         - read file from NVMe SSD\n" +
          "  run <driver|primes|sort|echo> - load & execute RV32IM binary\n" +
          "  regs               - inspect 32 RISC-V integer registers\n" +
          "  pipe               - inspect 5-stage IF/ID/EX/MEM/WB pipeline\n" +
          "  cache              - inspect L1I / L1D / L2 cache telemetry\n" +
          "  gpu <0..3> <int>   - write PCIe GPU MMIO register (0x20000000+4*i)\n" +
          "  peek <addr>        - read 32-bit word from RAM/MMIO\n" +
          "  poke <addr> <val>  - write 32-bit word to RAM/MMIO\n" +
          "  bench              - run 4,000-cycle RV32IM micro-benchmark\n" +
          "  clear              - clear console buffer\n",
      );
    } else if (cmd === "clear") {
      this.termOut = "";
    } else if (cmd === "ls") {
      this.busPulses.nvme = 1;
      this.stats.nvmeOps++;
      for (const [path, content] of Object.entries(this.nvmeFiles)) {
        this.appendConsole(
          `  ${path.padEnd(22)} ${String(content.length).padStart(5)} B\n`,
        );
      }
    } else if (cmd === "cat") {
      const target = parts[1] || "/etc/sysinfo.txt";
      this.busPulses.nvme = 1;
      this.stats.nvmeOps++;
      if (this.nvmeFiles[target]) {
        this.appendConsole(this.nvmeFiles[target] + "\n");
      } else {
        this.appendConsole(`cat: '${target}' not found (try 'ls')\n`);
      }
    } else if (cmd === "run") {
      const key = (parts[1] || "driver").toLowerCase();
      this.busPulses.nvme = 1;
      this.stats.nvmeOps++;
      const match = key.includes("prime")
        ? RV32_PROGRAMS["Sieve of Eratosthenes (Primes)"]
        : key.includes("sort")
          ? RV32_PROGRAMS["Quicksort & Cache Benchmark"]
          : key.includes("echo") || key.includes("kbd")
            ? RV32_PROGRAMS["Interactive Keyboard Echo + GPU Tint"]
            : RV32_PROGRAMS["GPU Co-Processor Driver (MMIO)"];
      this.loadProgram(match, true);
      if (!key.includes("driver") && !key.includes("echo")) {
        this.runSteps(20000);
      }
    } else if (cmd === "regs") {
      let line = "";
      for (let i = 0; i < 16; i++) {
        line += `${ABI_NAMES[i].padEnd(4)}=0x${bt(this.regs[i], 8)} `;
        if (i % 4 === 3) {
          this.appendConsole(line + "\n");
          line = "";
        }
      }
    } else if (cmd === "pipe") {
      for (const stg of ["IF", "ID", "EX", "MEM", "WB"]) {
        const s = this.pipe[stg];
        this.appendConsole(`  [${stg.padEnd(3)}] PC=0x${bt(s.pc, 4)}  ${s.text}\n`);
      }
      this.appendConsole(
        `  IPC=${this.ipc().toFixed(3)} · Forwards=${this.stats.forwards} · Stalls=${this.stats.loadStalls} · BP=${(this.bpAccuracy() * 100).toFixed(1)}%\n`,
      );
    } else if (cmd === "cache") {
      this.appendConsole(
        `  L1I: ${(this.l1i.hitRate() * 100).toFixed(1)}% (${this.l1i.hits}H/${this.l1i.misses}M)\n` +
          `  L1D: ${(this.l1d.hitRate() * 100).toFixed(1)}% (${this.l1d.hits}H/${this.l1d.misses}M)\n` +
          `  L2 : ${(this.l2.hitRate() * 100).toFixed(1)}% · DDR5 bursts=${this.stats.dramReads}\n`,
      );
    } else if (cmd === "gpu") {
      const idx = Math.max(0, Math.min(3, parseInt(parts[1] || "0", 10) || 0));
      const val = parseInt(parts[2] || "256", 10) || 0;
      this.writeMem(0x20000000 + idx * 4, val, 4);
      this.appendConsole(
        `MMIO [0x${bt(0x20000000 + idx * 4, 8)}] <= ${val} (uCPU[${idx}] = ${(val / 256).toFixed(3)})\n`,
      );
    } else if (cmd === "peek") {
      const addr = parseImm(parts[1] || "0", {});
      const val = this.readMem(addr, 4, true);
      this.appendConsole(`[0x${bt(addr, 8)}] = 0x${bt(val, 8)} (${val})\n`);
    } else if (cmd === "poke") {
      const addr = parseImm(parts[1] || "0x20000000", {});
      const val = parseImm(parts[2] || "0", {});
      this.writeMem(addr, val, 4);
      this.appendConsole(`Wrote 0x${bt(val, 8)} -> [0x${bt(addr, 8)}]\n`);
    } else if (cmd === "bench") {
      this.loadProgram(RV32_PROGRAMS["Quicksort & Cache Benchmark"], true);
      this.runSteps(20000);
      this.appendConsole(
        `Benchmark: ${this.stats.instret} instr in ${this.stats.cycles} cyc (IPC ${this.ipc().toFixed(3)}, L1D ${(this.l1d.hitRate() * 100).toFixed(1)}%)\n`,
      );
    } else {
      // Forward raw characters into keyboard RX FIFO for running interactive programs!
      for (const ch of trimmed + "\n") this.pushKey(ch);
    }
    return this.termOut;
  }
};
