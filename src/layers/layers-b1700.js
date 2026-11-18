// Burroughs B1700 (B 1726): abstraction-ladder rungs, live visualisers, diagram pollers and the
// compare-table row. Loaded after layers-expansion.js and before hardwired-gate-engine.js, so the
// gate engine adds the shared logic-family template rung (hw[4]) and the eye-diagram rung (sw last).
// Sources: B 1700 Systems Reference Manual 1057155 (SRM), MIL manual 2212-5298, B 1726 brochure
// 1059219 (1972), Auerbach B1700 report (1974), Datapro 70C-112-04 (1972/1973).
(() => {
  const hex = (v, n = 6) => (v >>> 0).toString(16).toUpperCase().padStart(n, "0");

  Object.assign(Ic, {
    // bit-addressed S-memory: the field FA/FL just touched, and the next S-op at S-PC
    b17bits(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = Z.acc2;
      c.fillText(
        `S-memory, addressed to the bit · last field ${p.fieldAddr ?? "—"}+${p.fieldLen ?? 0} bits`,
        10,
        16,
        w - 20,
      );
      const bits = p.memBits || [];
      const cols = 64;
      const rows = Math.max(1, Math.ceil(bits.length / cols));
      const cw = (w - 20) / cols;
      const ch = Math.min(14, (h - 50) / rows);
      bits.forEach((b, i) => {
        const x = 10 + (i % cols) * cw;
        const y = 26 + Math.floor(i / cols) * ch;
        const a = p.memBase + i;
        let col = b ? "#cbd5e1" : "#141b25";
        if (a >= p.spc && a < p.spc + 4) col = b ? "#fde047" : "#5b4a12";
        else if (p.fieldAddr != null && a >= p.fieldAddr && a < p.fieldAddr + p.fieldLen)
          col = b ? "#34d399" : "#0b4d3a";
        c.fillStyle = col;
        c.fillRect(x, y, Math.max(1, cw - 1), Math.max(1, ch - 2));
      });
      c.fillStyle = Z.dim;
      c.font = Ce(10);
      c.fillText(
        "yellow: 4-bit S-opcode at S-PC · green: last READ/WRITE field (0–24 bits, either direction)",
        10,
        h - 6,
        w - 20,
      );
    },
    // 24-bit function box: X, Y and the unit-dependent SUM / DIFF, CPL masking
    b17fbox(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = Z.acc2;
      c.fillText(
        `24-bit function box · CPU=${p.unit} (${["binary", "4-bit decimal", "8-bit", "reserved"][p.unit]}) · CPL=${p.cpl}`,
        10,
        16,
        w - 20,
      );
      const rows = [
        ["X", p.x, "#60a5fa"],
        ["Y", p.y, "#a78bfa"],
        ["SUM", p.sum, "#34d399"],
        ["DIFF", p.diff, "#f472b6"],
      ];
      const cw = (w - 70) / 24;
      const rh = Math.min(26, (h - 50) / 4);
      rows.forEach(([n, v, col], r) => {
        const y = 26 + r * rh;
        c.fillStyle = Z.dim;
        c.font = Ce(10, "600");
        c.fillText(n, 8, y + rh * 0.65);
        for (let b = 0; b < 24; b++) {
          const bit = (v >>> (23 - b)) & 1;
          const inField = 23 - b < p.cpl;
          c.fillStyle = bit ? col : inField ? "#1b2533" : "#0c1118";
          c.fillRect(50 + b * cw, y, cw - 1.5, rh - 5);
        }
      });
      c.fillStyle = Z.ok;
      c.font = Ce(10);
      c.fillText(
        `BICN ${p.bicn.toString(2).padStart(4, "0")} (LSUY CYF CYD CYL) · XYCN ${p.xycn.toString(2).padStart(4, "0")} (MSBX X=Y X<Y X>Y)`,
        10,
        h - 6,
        w - 20,
      );
    },
    // the micro-instruction stream: 16-bit M register decoded, and where it was fetched from
    b17micro(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = Z.acc2;
      c.fillText(
        `M register ${hex(p.m, 4)} · fetched from ${p.fromCM ? "control memory (167 ns)" : "main memory (667 ns)"}`,
        10,
        16,
        w - 20,
      );
      const cw = (w - 20) / 16;
      for (let b = 0; b < 16; b++) {
        const bit = (p.m >>> (15 - b)) & 1;
        c.fillStyle = bit ? (b < 4 ? "#fbbf24" : "#7dd3fc") : "#141b25";
        c.fillRect(10 + b * cw, 26, cw - 2, 22);
        c.fillStyle = bit ? "#000" : Z.dim;
        c.font = Ce(10, "600");
        c.fillText(String(bit), 10 + b * cw + cw / 2 - 3, 41);
      }
      c.font = Ce(11);
      (p.recent || []).slice(-Math.floor((h - 70) / 15)).forEach((ln, i, arr) => {
        c.fillStyle = i === arr.length - 1 ? "#fde68a" : Z.ink;
        c.fillText(ln, 10, 66 + i * 15, w - 20);
      });
    },
  });

  const probe = (m) => {
    const sys = m.sim;
    const cpu = sys.cpu;
    const last = cpu.mem.last;
    const spc = cpu.padGet(1, 0);
    const memBase = B1700_LAYOUT.SPROG;
    const memBits = [];
    for (let i = 0; i < 512; i++) memBits.push(cpu.mem.getBit(memBase + i));
    const recent = [];
    if (!sys.interp._byAddr) {
      sys.interp._byAddr = {};
      for (const row of sys.interp.listing || [])
        sys.interp._byAddr[row.addr] = row.text.trim();
    }
    const listing = sys.interp._byAddr;
    for (
      let a = Math.max(0, cpu.lastAddr - 4);
      a <= cpu.lastAddr + 3 && a < sys.interp.code.length;
      a++
    ) {
      const row = listing[a];
      recent.push(
        `${a === cpu.lastAddr ? "▶" : " "} ${String(a).padStart(4)}  ${hex(sys.interp.code[a], 4)}  ${row || disassembleB1700(sys.interp.code[a], sys.interp.code[a + 1] || 0)}`,
      );
    }
    return {
      memBits,
      memBase,
      spc,
      fieldAddr: last ? last.addr : null,
      fieldLen: last ? last.len : 0,
      unit: cpu.CPU,
      cpl: cpu.CPL,
      x: cpu.X,
      y: cpu.Y,
      sum: cpu.SUM,
      diff: cpu.DIFF,
      bicn: cpu.BICN,
      xycn: cpu.XYCN,
      m: cpu.M,
      fromCM: cpu.lastFromCM,
      recent,
      wbits: 8,
      a: cpu.X & 0xff,
      b: cpu.Y & 0xff,
      bits: cpu.M & 0xff,
      sigTitle: "B 1726 micro-cycle: M fetch, function box, S-memory field",
      app: `SAM S-program "${sys.programName}" (lab-defined S-language)\n\n${(sys.programs[sys.programName] || "").trim()}\n\nOUT: ${sys.outputs().join(" ")}`,
      os: `No MCP is emulated. The real B1700 MCP (Master Control Program) loads one interpreter per language and switches S-machines on a context switch; here a single interpreter is overlaid into control memory at load time.\nInterpreter in ${sys.inControlMemory ? "control memory (TOPM>0)" : "main memory (TOPM=0)"} · ${cpu.cmFetches} CM / ${cpu.mmFetches} MM fetches`,
      isa: `S-machine: SAM, ${sys.decimal ? "4-bit DECIMAL" : "binary"} arithmetic, ${sys.width}-bit operands\nLast S-op: ${sys.lastSop || "—"} · S-ops ${sys.sOps}\nACC=${sys.acc()} · micro-instructions ${cpu.micros}\nM=${hex(cpu.M, 4)} ${cpu.lastText}`,
    };
  };

  Object.assign(qy, {
    b1700: {
      hw: [
        {
          t: "System level: the B 1726 is one cabinet (158.7 × 66 × 148.5 cm, 642.8 kg) holding power, I/O controls, memory and processor, plus an operator table carrying the 9340 console printer. Disk cartridge, 96-column card and line printer peripherals sat alongside (brochure 1059219, June 1972).",
          p: /Central Processor Cabinet|Operator Table|Disk Cartridge|Card Reader|Console Printer/i,
          viz: "spec",
        },
        {
          t: "Boards & memories: integrated-circuit logic cards; read/write control memory of 2,048 or 4,096 bytes (167 ns per 2 bytes); MOS main memory of 24,576 to 98,304 bytes (667 ns per 3 bytes), addressable to the single bit (brochure; Auerbach 1974).",
          p: /Logic Cards|Control Memory|MOS Main Memory|Card Cage/i,
          viz: "modules",
        },
        {
          t: "Field-isolation memory: one READ/WRITE micro-instruction moves a field of 0–24 bits starting at any bit address FA, forwards or backwards, and can count FA and FL by the length (SRM section 3). No byte or word alignment exists for the S-machine.",
          p: /MOS Main Memory|Emulator State Display/i,
          viz: "b17bits",
        },
        {
          t: "Function box: the 24-bit unit forms SUM, DIFF, logical results and comparisons of X and Y at once, in binary, 4-bit decimal or 8-bit mode as CPU says, masked to the CPL bit width, which a micro-instruction can change every cycle (SRM 4-28 ff.).",
          p: /Logic Cards|Card Cage|Console Control Panel/i,
          viz: "b17fbox",
        },
        {
          t: "Physics & signals: 6 million cycles per second on the B 1726 (brochure). A micro-instruction from control memory costs 167 ns of fetch; from main memory, at bit address A×16+MBR, 667 ns, which is why OVERLAY moves hot microcode into control memory.",
          p: /Control Memory|Register Display Lights|Console Control Panel/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Application: an S-program in SAM, a small lab-defined S-language (not a Burroughs language), runs on a microcoded interpreter: sum, Fibonacci and countdown programs, with the output mirrored on the console printer paper.",
          p: /Console Printer|Emulator State Display/i,
          viz: "app",
        },
        {
          t: "Operating system: on the real B1700 the MCP gave each language (SDL, COBOL, FORTRAN, RPG, BASIC) its own interpreter and swapped them in and out of control memory. No MCP is emulated here.",
          p: /Console Printer|Cassette Reader|Disk Cartridge/i,
          viz: "os",
        },
        {
          t: "S-machine ISA: SAM uses 4-bit opcodes and operands whose width comes from a 5-bit header, decoded by READ with CPL set from scratchpad. The same S-program runs in binary or 4-bit decimal arithmetic by changing one CP value.",
          p: /Emulator State Display|MOS Main Memory/i,
          viz: "isa",
        },
        {
          t: "Microcode: 16-bit micro-instructions (MIL), register moves through the 4×16 select matrix, 4-bit manipulates, bit tests, skips, READ/WRITE, EXTRACT, CALL/EXIT on a 32-deep A stack. The 24 console lamps show any register picked by the COLUMN/ROW switches.",
          p: /Register Display Lights|Console Control Panel|Logic Cards/i,
          viz: "b17micro",
        },
      ],
      probe,
    },
  });

  Object.assign(Lm, {
    b1700: (m) => {
      const cpu = m.sim.cpu;
      return {
        cm: `${cpu.cmFetches} fetch`,
        seq: `A=${cpu.lastAddr}`,
        astk: `${cpu.asp} deep`,
        mreg: hex(cpu.M, 4),
        fb24: `SUM ${hex(cpu.SUM)}`,
        fb4: `CPL ${cpu.CPL}`,
        pad: `ACC ${m.sim.acc()}`,
        fu: `FA ${cpu.FA}`,
        smem: `${cpu.mem.bitsMoved} bits`,
        cons: m.sim.lastSop || "—",
      };
    },
  });

  p0.push({
    id: "b1700",
    wing: "servers",
    name: "Burroughs B 1726 (B1700 series)",
    year: 1972,
    clock: 6e6,
    mem: 24576,
    tr: null,
    devices: "IC logic; bipolar control memory; MOS main memory addressable to the bit",
    power: null,
    price: null,
    note: "No fixed instruction set: 16-bit microcode interprets one S-machine per language. Bit-addressable memory with 0–24-bit fields; variable-width 24-bit function box. Rented for $1,500–$12,500 a month (Datapro, B1700 series range).",
    src: "B 1700 Systems Reference Manual 1057155; B 1726 brochure 1059219 (1972); Auerbach (1974); Datapro 70C-112-04; Wilner, AFIPS FJCC 1972",
  });
})();
