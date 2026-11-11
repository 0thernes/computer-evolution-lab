// Abstraction Layer Stacks (15 × 9 = 135 Hardware/Software Layers), Live Domain Visualizers (Ic.*),
// and Documented Historical / Engineering Reference Specifications (p0) for Circles II, III & IV.

(() => {
  // Upgrade Wy formatter to cleanly handle Multi-TB Memory, MW Supercomputer Power & Trillion-Transistor Rack Scales
  const prevWy = typeof Wy === "function" ? Wy : null;
  if (prevWy) {
    Wy = (metric, val) => {
      if (val == null) return "—";
      if (metric === "price") return "$" + val.toLocaleString();
      if (metric === "power") {
        if (val >= 1e6) return +(val / 1e6).toFixed(2) + " MW";
        if (val >= 1e3) return +(val / 1e3).toFixed(1) + " kW";
        return val + " W";
      }
      const units =
        metric === "clock"
          ? ["Hz", "kHz", "MHz", "GHz"]
          : metric === "mem"
            ? ["B", "KB", "MB", "GB", "TB", "PB"]
            : ["", "K", "M", "B", "T"];
      const base = metric === "mem" ? 1024 : 1e3;
      let idx = 0;
      let v = val;
      while (v >= base && idx < units.length - 1) {
        v /= base;
        idx++;
      }
      const num = (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(
        /\.0+$/,
        "",
      );
      return num + " " + units[idx];
    };
  }

  // ---- Custom Live Engineering Visualizers Registered on Ic ----
  Object.assign(Ic, {
    sigwave(c, w, h, t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = Z.acc2;
      c.fillText(p.sigTitle || "Physical Signal & Timing Trace", 10, 16, w - 20);
      const rows = p.lanes || [
        ["CLK", 1, "#58c4ff"],
        ["DATA", (p.bits || 0x5a) & 0xff, "#ffb347"],
        ["VALID", 0xf3, "#5fe08a"],
      ];
      const rh = Math.max(22, (h - 36) / rows.length);
      rows.forEach(([lbl, mask, col], rIdx) => {
        const y0 = 26 + rIdx * rh;
        c.fillStyle = Z.dim;
        c.font = Ce(10, "600");
        c.fillText(lbl, 8, y0 + rh * 0.55);
        c.strokeStyle = col;
        c.lineWidth = 2;
        c.beginPath();
        const xStart = 76;
        const stepW = (w - xStart - 12) / 16;
        for (let k = 0; k < 16; k++) {
          const bit =
            lbl === "CLK"
              ? k % 2
              : ((mask >>> (k % 8)) ^ ((Math.floor(t * 3) + rIdx) & 1)) & 1;
          const x = xStart + k * stepW;
          const y = bit ? y0 + 4 : y0 + rh - 8;
          if (k === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
          c.lineTo(x + stepW, y);
        }
        c.stroke();
      });
    },

    s360ros(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = Z.acc2;
      c.fillText(
        `Capacitor ROS Micro-Store · Addr 0x${bt(p.ros || 0x42, 3)} (${p.phase || "IFETCH"})`,
        10,
        16,
        w - 20,
      );
      const cols = 18,
        rows = 5;
      const cw = (w - 24) / cols;
      const ch = (h - 46) / rows;
      const seed = (p.ros || 0x42) * 2654435761;
      for (let r = 0; r < rows; r++) {
        for (let k = 0; k < cols; k++) {
          const bit = ((seed >>> ((r * cols + k) % 24)) + r + k) & 1;
          bn(
            c,
            12 + k * cw + 1,
            26 + r * ch + 1,
            cw - 3,
            ch - 3,
            bit ? "rgba(255,179,71,0.75)" : "#121a24",
            bit ? "#ffb347" : "#263445",
            2,
          );
        }
      }
      c.fillStyle = Z.ok;
      c.font = Ce(10);
      c.fillText(`Packed BCD: ${p.bcd || "0125000C"} · Overlapped CCW Cycles: ${p.ovlp || 0}`, 10, h - 6, w - 20);
    },

    unixapr(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = Z.acc;
      c.fillText(`PDP-11/70 16-Bit VA -> 22-Bit PA APR Relocation (${p.mode || "USER"})`, 10, 16, w - 20);
      const boxes = [
        ["16b Virtual", `0${ds(p.va || 0o20014, 6)}`, "#ff6bd6"],
        ["APR Page Base", "+ Block << 6", "#ffb347"],
        ["22b Physical", `0${ds(p.pa || 0o220014, 8)}`, "#5fe08a"],
      ];
      const bw = (w - 36) / 3;
      boxes.forEach(([title, val, col], idx) => {
        const bx = 10 + idx * (bw + 8);
        bn(c, bx, 30, bw, h - 62, "#0d1622", col, 6);
        c.fillStyle = col;
        c.font = Ce(10, "600");
        c.fillText(title, bx + 8, 50, bw - 14);
        c.fillStyle = Z.ink;
        c.font = Ce(12, "700");
        c.fillText(val, bx + 8, 76, bw - 14);
      });
      c.fillStyle = Z.dim;
      c.font = Ce(10);
      c.fillText(`Active Pipe Buffer: ${p.pipe || 0} B · Syscalls: ${p.sys || 0}`, 10, h - 8, w - 20);
    },

    mesiraid(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = "#c08cff";
      c.fillText(`SMP MESI Snooping Matrix + 5-Disk RAID-5 XOR`, 10, 16, w - 20);
      const colMap = { M: "#ef4444", E: "#f59e0b", S: "#10b981", I: "#334155" };
      const states = p.mesi || ["E", "I", "S", "M"];
      const cw = (w - 28) / 4;
      states.forEach((st, idx) => {
        const bx = 10 + idx * (cw + 2);
        bn(c, bx, 26, cw - 4, 46, colMap[st] || "#334155", "#e2e8f0", 5);
        c.fillStyle = "#fff";
        c.font = Ce(12, "700");
        c.fillText(`CPU${idx}:${st}`, bx + 8, 54, cw - 12);
      });
      const disks = p.disks || [0x12, 0x34, 0x56, 0x78, 0x00];
      const dw = (w - 28) / 5;
      disks.forEach((val, d) => {
        const dx = 10 + d * (dw + 2);
        const fail = p.failedDisk === d;
        bn(c, dx, 84, dw - 4, h - 102, fail ? "#450a0a" : "#0f1e2e", fail ? "#ef4444" : "#38bdf8", 4);
        c.fillStyle = fail ? "#fca5a5" : "#bae6fd";
        c.font = Ce(10, "600");
        c.fillText(`D${d}${d === 4 ? "(P)" : ""}`, dx + 6, 102);
        c.fillText(fail ? "XOR!" : `0x${bt(val, 2)}`, dx + 6, 120);
      });
    },

    raftlog(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = Z.acc;
      c.fillText(
        `5-Node Raft Consensus · Leader=${p.leader >= 0 ? "N" + p.leader : "NONE"} · Committed=${p.ops || 0}`,
        10,
        16,
        w - 20,
      );
      const nodes = p.nodes || [];
      const nw = (w - 28) / 5;
      nodes.forEach((n, i) => {
        const nx = 10 + i * (nw + 2);
        const col = !n.alive ? "#ef4444" : n.role === "LEADER" ? "#fbbf24" : "#38bdf8";
        bn(c, nx, 28, nw - 4, h - 54, "#0d1624", col, 6);
        c.fillStyle = col;
        c.font = Ce(11, "700");
        c.fillText(`N${i}`, nx + 8, 48);
        c.fillStyle = Z.ink;
        c.font = Ce(9);
        c.fillText(!n.alive ? "OFFLINE" : n.role.slice(0, 6), nx + 6, 66, nw - 10);
        c.fillText(`T${n.term} C${n.commitIndex}`, nx + 6, 84, nw - 10);
      });
      c.fillStyle = Z.ok;
      c.font = Ce(10);
      c.fillText("Quorum Rule: |V_vote| >= 3/5 and |V_append| >= 3/5 prevents split-brain", 10, h - 8, w - 20);
    },

    crayvec(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = "#ff6b6b";
      c.fillText(
        `Cray-1 64-Elem Vector Chaining · ${p.mflops || "116.4"} MFLOPS (×${p.spd || "21.1"} vs scalar)`,
        10,
        16,
        w - 20,
      );
      const vec = p.v4 || [];
      c.strokeStyle = "#34d399";
      c.lineWidth = 2.2;
      c.beginPath();
      for (let i = 0; i < vec.length; i++) {
        const px = 12 + (i / Math.max(1, vec.length - 1)) * (w - 24);
        const py = h * 0.56 - Math.max(-h * 0.3, Math.min(h * 0.3, vec[i] * 22));
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
      c.fillStyle = Z.acc2;
      c.font = Ce(10);
      c.fillText(`Chained: ${p.chained || 88} clks  |  Unchained: ${p.unchained || 216} clks`, 10, h - 8, w - 20);
    },

    cm2hyper(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = "#ef4444";
      c.fillText(`CM-2 256-PE SIMD Matrix & 8-Dim e-Cube XOR Loads`, 10, 16, w - 20);
      const grid = p.grid || [];
      const cell = Math.min((h - 34) / 16, (w * 0.46) / 16);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          c.fillStyle = grid[y * 16 + x] ? "#ef4444" : "#1e1620";
          c.fillRect(12 + x * cell, 24 + y * cell, Math.max(2, cell - 1), Math.max(2, cell - 1));
        }
      }
      const loads = p.dimLoads || [];
      const rx = 24 + 16 * cell;
      loads.forEach((ld, d) => {
        const ry = 26 + d * ((h - 34) / 8);
        c.fillStyle = Z.dim;
        c.font = Ce(9);
        c.fillText(`D${d}`, rx, ry + 10);
        c.fillStyle = "#f59e0b";
        c.fillRect(rx + 22, ry + 2, Math.min(w - rx - 32, ld * 3 + 4), 9);
      });
    },

    qecsurf(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = Z.acc;
      c.fillText(
        `Rotated Surface Code (d=${p.d || 5}) · T=${p.temp || 15} mK · ε_L=${(p.pLog || 1e-4).toExponential(1)}`,
        10,
        16,
        w - 20,
      );
      const d = p.d || 5;
      const cell = Math.min((h - 36) / d, (w * 0.5) / d);
      const errs = p.errs || [];
      for (let r = 0; r < d; r++) {
        for (let col = 0; col < d; col++) {
          const e = errs[r * d + col] || 0;
          const cx = 22 + col * cell;
          const cy = 32 + r * cell;
          c.beginPath();
          c.arc(cx, cy, Math.max(4, cell * 0.28), 0, Math.PI * 2);
          c.fillStyle = e === 1 ? "#ef4444" : e === 2 ? "#c084fc" : "#38bdf8";
          c.fill();
        }
      }
      c.fillStyle = Z.ok;
      c.font = Ce(10);
      c.fillText(`5Q GHZ Fidelity: ${((p.fid || 0.98) * 100).toFixed(1)}%`, w * 0.52, 56, w * 0.45);
      c.fillStyle = Z.acc2;
      c.fillText(`p_phys = ${((p.pPhys || 0.003) * 100).toFixed(2)}%`, w * 0.52, 80, w * 0.45);
      c.fillStyle = Z.ink;
      c.fillText(p.pPhys < 0.01 ? "Below ~1% QEC Threshold ✓" : "Thermal Quasiparticle Poison!", w * 0.52, 104, w * 0.45);
    },

    majoranabdg(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = "#fde047";
      c.fillText(
        `16×16 Kitaev BdG Spectrum · μ=${(p.mu ?? 0.45).toFixed(2)}t · ΔE₀=${(p.split ?? 0).toFixed(4)}`,
        10,
        16,
        w - 20,
      );
      const spec = p.spec || [];
      const midY = h * 0.56;
      c.strokeStyle = "#334155";
      c.beginPath();
      c.moveTo(12, midY);
      c.lineTo(w - 12, midY);
      c.stroke();
      spec.forEach((ev, idx) => {
        const px = 18 + (idx / Math.max(1, spec.length - 1)) * (w - 36);
        const py = midY - Math.max(-h * 0.34, Math.min(h * 0.34, ev * 24));
        c.beginPath();
        c.arc(px, py, idx === 7 || idx === 8 ? 5 : 3.5, 0, Math.PI * 2);
        c.fillStyle = idx === 7 || idx === 8 ? "#fde047" : "#38bdf8";
        c.fill();
      });
      c.fillStyle = Z.ok;
      c.font = Ce(10);
      c.fillText(`Braid Word: ${p.word || "I"}  (Non-Abelian σ₁σ₂ ≠ σ₂σ₁)`, 12, h - 6, w - 24);
    },

    omegaqft(c, w, h, _t, p) {
      c.font = Ce(11, "600");
      c.fillStyle = "#fde047";
      c.fillText(
        `OMEGA-Q (${(p.mode || "shor").toUpperCase()}) · Shor ${p.shorText || "15 = 3 × 5"} · Grover ${(p.groverP * 100 || 96).toFixed(1)}%`,
        10,
        16,
        w - 20,
      );
      const arr = p.bars || [];
      const maxV = Math.max(0.01, ...arr);
      const bw = (w - 24) / Math.max(1, arr.length);
      arr.forEach((v, idx) => {
        const bh = (v / maxV) * (h - 46);
        c.fillStyle = v > maxV * 0.35 ? "#fde047" : "#38bdf8";
        c.fillRect(12 + idx * bw, h - 20 - bh, Math.max(1.5, bw - 0.5), Math.max(2, bh));
      });
      c.fillStyle = Z.ok;
      c.font = Ce(10);
      c.fillText(`qLDPC d=${p.d || 31} · Logical Error ε_L = ${(p.err || 1e-32).toExponential(1)}`, 12, h - 5, w - 24);
    },
  });

  // ---- Register 15 × 9 = 135 Hardware & Software Abstraction Layers on qy ----
  Object.assign(qy, {
    s360: {
      hw: [
        {
          t: "System level: the IBM System/360 Model 50 (1964) unified scientific binary and commercial decimal computing into one compatible family, coupling the 2050 CPU with autonomous 2401 9-track tape drives, 2311 removable disk packs, and a 1403 chain line printer.",
          p: /CPU Frame|Tape Drive|Disk Storage|Chain Printer|Console/i,
          viz: "spec",
        },
        {
          t: "Boards & channels: swing-out gates carry Solid Logic Technology (SLT) cards while dedicated Selector and Multiplexor I/O Channels fetch Channel Command Words (CCWs) directly from core memory without stalling CPU arithmetic.",
          p: /SLT Hybrid|Capacitor ROS|Core Storage|Bus-and-Tag/i,
          viz: "modules",
        },
        {
          t: "Modules & microstore: 0.5-inch SLT alumina ceramic hybrid substrates sit alongside the 2,816-word Capacitor Read-Only Storage (ROS) plane that micro-interprets the S/360 instruction set across 90 control lines.",
          p: /SLT Hybrid|Capacitor ROS/i,
          viz: "s360ros",
        },
        {
          t: "Logic & arithmetic: 32-bit binary ALU plus hardware Packed-Decimal (BCD) adder (AP/SP) with 4-bit Storage Protection Keys guarding multiprogrammed OS/360 job regions.",
          p: /Core Storage|Model 50 Roller|Hexadecimal/i,
          viz: "adder",
        },
        {
          t: "Physics & signals: ferrite core rings flip magnetization at 2.0 µs cycle time while pneumatic vacuum columns buffer 800-BPI 9-track ferric-oxide magnetic tape loops.",
          p: /Core Storage|Tape Reel|Vacuum Column|Disk Pack/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Application: enterprise payroll & ledger batch processing mixing 32-bit binary registers (LA, L, AR, SR) with exact Packed-Decimal cents (AP) and overlapped SIO channel transfers.",
          p: /Model 50 Roller|Green-Bar/i,
          viz: "app",
        },
        {
          t: "Operating System: OS/360 Supervisor handles SVC interrupts, storage-key protection, and Job Control Language (JCL) spooling across tape, disk, and line printer.",
          p: /Model 50 Roller|Selectric|Green-Bar/i,
          viz: "os",
        },
        {
          t: "ISA & Microcode: 8-bit byte addressing, 16×32-bit GPRs, 64-bit Program Status Word (PSW), RR/RX/SS instruction formats, and autonomous CCW channel programs.",
          p: /Capacitor ROS|SLT Hybrid/i,
          viz: "isa",
        },
        {
          t: "Bits & EBCDIC / BCD encoding: two decimal digits per 8-bit byte plus a 4-bit sign nibble (C = +, D = -) eliminate binary floating-point rounding in banking.",
          p: /Core Storage|Bus-and-Tag/i,
          viz: "s360ros",
        },
      ],
      probe(m) {
        const s = m.sim;
        return {
          ros: s.rosAddr,
          phase: s.rosPhase,
          bcd: s.bcdHex(),
          ovlp: s.ioOverlappedCycles,
          wbits: 8,
          a: s.regs[2] & 0xff,
          b: s.regs[3] & 0xff,
          sigTitle: "S/360 Bus & Tag Handshake + 2.0 µs Core Sense",
          bits: s.rosAddr & 0xff,
          app: kn(m, 16) || s.src,
          os: `${Un()(m)} · OS/360 Primary Control Program\nPSW PC=0x${bt(s.psw.pc * 4, 4)} CC=${s.psw.cc} KEY=${s.psw.key}\nOverlapped CPU‖I/O Cycles: ${s.ioOverlappedCycles}\nLast Log: ${s.log[s.log.length - 1] || ""}`,
          isa: `INST: ${s.lastInst || "—"}\nROS Micro-Addr: 0x${bt(s.rosAddr, 3)} (${s.rosPhase})\nR1=${s.regs[1]} R2(Gross)=${s.regs[2]} R3(Tax)=${s.regs[3]} R4(Net)=${s.regs[4]}\nBCD Accumulator: ${s.bcdHex()} ($${(s.decAcc / 100).toFixed(2)})`,
        };
      },
    },

    unix70: {
      hw: [
        {
          t: "System level: the DEC PDP-11/70 cabinet, MASSBUS RP04 88 MB moving-head disk pack, VT100 serial CRT terminal, and BBN ARPANET Host-IMP packet interface.",
          p: /PDP-11\/70|RP04|VT100|ARPANET/i,
          viz: "spec",
        },
        {
          t: "Boards & buses: hex-height KB11-C processor boards plug into a dual-bus hierarchy — asynchronous memory-mapped UNIBUS for character I/O and high-speed 32-bit MASSBUS for DMA disk transfers.",
          p: /KB11-C|UNIBUS|ARPANET/i,
          viz: "modules",
        },
        {
          t: "MMU & cache: 16 Kernel and User Active Page Registers (APRs) relocate 16-bit virtual addresses (64 KB) across 22-bit physical core/cache memory (up to 4 MB).",
          p: /KB11-C|22-Bit Physical/i,
          viz: "unixapr",
        },
        {
          t: "Logic & console: Schottky TTL 16-bit orthogonal ALU driven by octal-grouped front-panel switches and blinkenlights.",
          p: /Programmer Console|22-Bit|16-Bit|Octal Console/i,
          viz: "adder",
        },
        {
          t: "Physics & signals: RS-232 current-loop / ±12V 9600-baud serial UART frames to the VT100 P31 green-phosphor CRT and magnetic oxide flux reversals on the RP04 disk pack.",
          p: /RP04 Oxide|VT100 Green|ARPANET/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Application & Shell: Thompson/Bourne shell pipelines (cat /usr/sys/ken/slp.c | wc -l) composing small single-purpose C programs over anonymous kernel pipes.",
          p: /VT100 Green|VT100 Detached/i,
          viz: "app",
        },
        {
          t: "UNIX v6 Kernel: ~9,000 lines of portable C implementing preemptive time-sharing (swtch), sys_fork(), sys_pipe(), hierarchical disk inodes, and unified /dev device files.",
          p: /KB11-C|RP04|VT100/i,
          viz: "os",
        },
        {
          t: "PDP-11 Orthogonal ISA: 8 general registers (R0–R5, SP, PC), auto-increment/decrement addressing ((Rn)+, -(Rn) that inspired C's *p++), and TRAP/EMT supervisor calls.",
          p: /KB11-C|16-Bit Data/i,
          viz: "isa",
        },
        {
          t: "Bits & MMU descriptors: octal word fields ([15:12] op, [11:6] src, [5:0] dst) and 22-bit APR physical frame relocation.",
          p: /22-Bit Physical|Octal Console/i,
          viz: "unixapr",
        },
      ],
      probe(m) {
        const s = m.sim;
        const p = s.procs[s.curIdx];
        return {
          mode: s.psw.mode,
          va: s.regs[7],
          pa: s.addrLights,
          pipe: s.pipeBytes,
          sys: s.syscalls,
          wbits: 8,
          a: s.regs[0] & 0xff,
          b: s.regs[1] & 0xff,
          sigTitle: "UNIBUS Master/Slave Strobes & 9600-Baud RS-232",
          bits: s.dataLights & 0xff,
          app: s.termLines.join("\n"),
          os: `UNIX Sixth Edition Kernel (${s.psw.mode} mode)\nActive PID ${p.pid} (${p.name}) · State=${p.state}\nTRAP Syscalls=${s.syscalls} · Context Switches=${s.ctxSwitches}\nPipe Ring=${s.pipeBytes} B · ARPANET IMP=${s.arpanetPkts} pkts`,
          isa: `PC(R7)=0${ds(s.regs[7], 6)}  SP(R6)=0${ds(s.regs[6], 6)}\nR0=0${ds(s.regs[0], 6)}  R1=0${ds(s.regs[1], 6)}  NZVC=${s.psw.n}${s.psw.z}${s.psw.v}${s.psw.c}\n22-bit APR Physical Bus = 0${ds(s.addrLights, 8)}`,
        };
      },
    },

    sun90: {
      hw: [
        {
          t: "System level: a 1993 Sun SPARCcenter symmetric multiprocessor (SMP) cabinet with 4 SuperSPARC RISC CPU modules, packet-switched XDBus backplane, and 5 hot-swap SCSI RAID-5 drives.",
          p: /SPARCcenter|RAID-5 Drive|Trinitron/i,
          viz: "spec",
        },
        {
          t: "Boards & snooping bus: 4 CPU/cache boards snoop every BusRd and BusRdX transaction across the shared centerplane while Differential Fast/Wide SCSI channels stream striped blocks.",
          p: /XDBus|SuperSPARC SMP|RAID-5 Drive/i,
          viz: "modules",
        },
        {
          t: "MESI Coherence & RAID-5 XOR: per-CPU L2 tags transition atomically across Modified, Exclusive, Shared, and Invalid while parity blocks P = D0 ⊕ D1 ⊕ D2 ⊕ D3 protect against disk loss.",
          p: /SuperSPARC SMP|Gold Ceramic|MESI Coherence|RAID-5 Drive/i,
          viz: "mesiraid",
        },
        {
          t: "Logic & parity circuits: register-windowed SPARC V8 ALU alongside dedicated 8-way XOR parity reconstruction trees.",
          p: /Gold Ceramic|ECC SIMM/i,
          viz: "adder",
        },
        {
          t: "Physics & signals: GTL+ terminated centerplane clock edges and magnetoresistive read-head signals over 7,200 RPM SCSI platters.",
          p: /XDBus|RAID-5 Drive/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Application: multi-threaded Solaris HTTP/1.0 web daemon and relational SQL engine serving concurrent client sockets across all 4 RISC cores.",
          p: /Trinitron|Type-5 Keyboard/i,
          viz: "app",
        },
        {
          t: "Solaris Symmetric Multiprocessing Kernel: fine-grained kernel mutexes, kernel threads mapped across CPUs, and transparent degraded-mode RAID-5 volume management.",
          p: /SuperSPARC SMP|RAID-5 Drive/i,
          viz: "os",
        },
        {
          t: "SPARC V8 RISC ISA: fixed 32-bit load/store instructions, sliding 32-register windows (%i0..%i7, %l0..%l7, %o0..%o7), and atomic SWAP/LDSTUB spinlocks.",
          p: /Gold Ceramic|XDBus/i,
          viz: "isa",
        },
        {
          t: "Coherence & XOR state bits: 2-bit MESI tag state per cache line plus rotated 8-bit Galois/XOR parity stripes.",
          p: /MESI Coherence|RAID Drive/i,
          viz: "mesiraid",
        },
      ],
      probe(m) {
        const s = m.sim;
        const fIdx = s.disks.findIndex((d) => d.failed);
        return {
          mesi: s.caches.map((c) => c[0].state),
          disks: s.disks.map((d) => d.data[0]),
          failedDisk: fIdx,
          wbits: 8,
          a: s.disks[0].data[0],
          b: s.disks[1].data[0],
          sigTitle: "XDBus Split-Transaction Snooping & SCSI Differential Bus",
          bits: s.disks[4].data[0],
          app: `Solaris httpd + RDBMS Worker Pool\nRequests Served: ${s.stats.httpReqs}\nRecent Snooping Bus Trace:\n` + s.busTransactions.slice(-6).join("\n"),
          os: `SunOS 5 / Solaris Symmetric Multiprocessing\n4 CPUs online · Snoops=${s.stats.snoops} · Invalidations=${s.stats.invalidations}\nRAID-5 Volume: ${fIdx >= 0 ? "DEGRADED (Disk " + fIdx + " reconstructed via XOR)" : "OPTIMAL (5/5 drives)"}\nXOR Degraded Reads=${s.stats.degradedReads}`,
          isa: `SPARC V8 32-bit RISC + Hardware Snooping Coherence\nLast Bus Op: ${s.lastBus}\nLine 0 States: ` + s.caches.map((c, i) => `CPU${i}=${c[0].state}(${c[0].val})`).join("  "),
        };
      },
    },

    cloud10: {
      hw: [
        {
          t: "Warehouse-scale rack: a 42U Open-Compute cloud rack integrating 25.6 Tbps Clos Leaf-Spine optical switches, 8 dual-socket Xeon compute sleds, and a blind-mate 48V DC busbar.",
          p: /Clos Spine|Leaf Switch|Compute Sled|Worker Sled|48V DC/i,
          viz: "spec",
        },
        {
          t: "Fabric & sleds: non-blocking ECMP optical fibers connect every 1U compute blade to Top-of-Rack QSFP-DD switches with uniform east-west latency.",
          p: /Leaf Switch|Optical Fiber|Compute Sled/i,
          viz: "modules",
        },
        {
          t: "Distributed consensus plane: 5 independent server sleds (N0..N4) maintain replicated state via Raft quorum elections and NVMe write-ahead logs.",
          p: /Raft Consensus Compute Sled|Raft Role Lightbar/i,
          viz: "raftlog",
        },
        {
          t: "Server-blade silicon: dual Xeon sockets (vn), ECC DDR4 channels (ps), and hardware CRC32C / AES-NI engines.",
          p: /Xeon Heatsink|DDR4 ECC/i,
          viz: "chip",
        },
        {
          t: "Physics & signals: 400GBASE-DR4 PAM4 1310 nm silicon-photonics laser modulation over single-mode fiber plus 48V DC busbar power delivery.",
          p: /Optical Fiber|48V DC/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Cloud control plane: replicated key-value configuration store (Chubby / etcd) backing microservice discovery and pod scheduling.",
          p: /NOC Cluster|Worker Sled/i,
          viz: "app",
        },
        {
          t: "Cluster OS (Borg / Kubernetes): Linux cgroups + namespaces bin-pack containers onto healthy blades and reschedule around failed nodes.",
          p: /Compute Sled|Worker Sled/i,
          viz: "os",
        },
        {
          t: "Raft Consensus Protocol (Ongaro & Ousterhout 2014): RequestVote & AppendEntries RPCs guarantee linearizable safety whenever >= 3/5 nodes are reachable.",
          p: /Raft Consensus Compute Sled|Leaf Switch/i,
          viz: "isa",
        },
        {
          t: "Wire frames & WAL commits: gRPC/HTTP2 protobuf packets over RoCEv2 / TCP and fsynced NVMe log segments.",
          p: /Optical Fiber|Raft Role Lightbar/i,
          viz: "raftlog",
        },
      ],
      probe(m) {
        const s = m.sim;
        const lid = s.leaderId();
        return {
          leader: lid,
          ops: s.committedOps,
          nodes: s.nodes,
          sigTitle: "400GbE PAM4 Optical Lanes & 48V Busbar Telemetry",
          bits: (s.committedOps * 37) & 0xff,
          app: `Replicated Raft WAL Log (${s.committedOps} committed):\n` + s.log.slice(-8).map((e) => `  [T${e.term}] ${e.cmd}`).join("\n"),
          os: `Cluster Scheduler + Linux cgroups\nAlive Nodes: ${s.nodes.filter((n) => n.alive).length}/5 · Elections=${s.elections}\nActive Pods=${s.nodes.filter((n) => n.alive).reduce((a, n) => a + n.pods, 0)}`,
          isa: `Raft State Machine: Leader=${lid >= 0 ? "N" + lid : "NONE (Quorum Halted)"}\nRecent RPCs:\n` + s.rpcs.slice(0, 5).map((r) => `  N${r.from} -> N${r.to}: ${r.type}`).join("\n"),
        };
      },
    },

    zmain20: {
      hw: [
        {
          t: "System level: a dual-frame Telum-class enterprise mainframe engineered for Seven-Nines (99.99999%, <3.2 seconds/year) continuous availability across banking and airline clearing.",
          p: /Mainframe Monolith|Processor Drawer|RAIM|HSM I\/O|HMC/i,
          viz: "spec",
        },
        {
          t: "CPC drawers & Virtual L4 ring: 4 Central Processor Complex drawers link eight 7nm dual-chip modules over a 320 GB/s ring that pools 256 MB L2s into a 2 GB Virtual L4 cache.",
          p: /Processor Drawer|Virtual L3\/L4|Coldplate/i,
          viz: "modules",
        },
        {
          t: "Telum chip & inline AI: superscalar 5.2 GHz cores with lockstep error checking share an on-chip low-latency matrix-math AI accelerator for real-time fraud scoring.",
          p: /Coldplate|Processor Drawer/i,
          viz: "chip",
        },
        {
          t: "RAIM memory & Crypto HSMs: 5-channel Redundant Array of Independent Memory (4 data + 1 XOR parity DIMM channel) survives complete DIMM/channel failures with zero dropped transactions.",
          p: /RAIM|Crypto Express/i,
          viz: "adder",
        },
        {
          t: "Physics & signals: high-frequency 5.2 GHz SOI/FinFET clock distribution under brazed copper coldplates and quantum-safe lattice cryptography inside FIPS 140-3 Level 4 HSMs.",
          p: /Coldplate|Virtual L3\/L4|Crypto Express/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Application: 316,000+ ACID double-entry financial transactions/sec with <1 ms inline neural fraud inference before commit.",
          p: /Hardware Management Console/i,
          viz: "app",
        },
        {
          t: "PR/SM Firmware Hypervisor (LPARs): bare-metal Start Interpretive Execution (SIE) isolates z/OS CICS banking and Linux workloads with zero cross-tenant jitter.",
          p: /Processor Drawer|Hardware Management Console/i,
          viz: "os",
        },
        {
          t: "64-bit z/Architecture CISC + Neural Assist (NNPA): backward-compatible to 1964 S/360 user binaries while adding SIMD decimal and NNPA tensor instructions.",
          p: /Coldplate|Crypto Express/i,
          viz: "isa",
        },
        {
          t: "RAIM Reed-Solomon / XOR channel symbols & lockstep instruction compare bits.",
          p: /RAIM Channel/i,
          viz: "sigwave",
        },
      ],
      probe(m) {
        const s = m.sim;
        return {
          wbits: 8,
          a: (s.totalTx >>> 4) & 0xff,
          b: s.raimRepairs & 0xff,
          sigTitle: "5.2 GHz Telum Ring Bus & 5-Channel RAIM ECC",
          bits: Math.round(s.lastFraudScore * 255),
          app: `Double-Entry ACID Stream: ${s.totalTx.toLocaleString()} TX (Dropped: ${s.droppedTx})\nInvariant Ledger Balance: $${(s.ledgerBalance / 100).toLocaleString()}.00\nInline AI Fraud Score: ${(s.lastFraudScore * 100).toFixed(1)}% (Flagged=${s.fraudFlagged})`,
          os: `PR/SM Hardware LPAR Hypervisor:\n` + s.lpars.map((l) => `  ${l.name}: ${l.weight}% weight -> ${l.tps.toLocaleString()} TPS`).join("\n"),
          isa: `z/Architecture + NNPA On-Chip AI Assist\nRAIM Channels: ${s.raimChannels.map((ok, i) => `CH${i}:${ok ? "OK" : "XOR-REPAIR"}`).join(" ")}\nZero-Downtime Channel Repairs: ${s.raimRepairs}`,
        };
      },
    },

    cray1: {
      hw: [
        {
          t: "System level: Seymour Cray's 1976 Cray-1 — a 5.5-ton, 80 MHz (12.5 ns) vector supercomputer bent into a 270° C-cylinder over a circular Freon-cooled power-supply bench.",
          p: /C-Cylinder|Wedge Column|Padded Power|Operator Station/i,
          viz: "spec",
        },
        {
          t: "12 wedge columns & speed-of-light chords: arranging 1,662 PCB modules in a tight C keeps every backplane twisted-pair wire under 4 feet (~4.1 ns flight time).",
          p: /Wedge Column|Twisted-Pair Chord/i,
          viz: "modules",
        },
        {
          t: "Vector register files & segmented pipelines: eight 64-element × 64-bit Vector Registers (V0–V7) feed independent 7-stage FMUL and 6-stage FADD functional units.",
          p: /ECL Sub-Nanosecond|Vector Chime/i,
          viz: "crayvec",
        },
        {
          t: "Sub-nanosecond ECL gates: differential Emitter-Coupled Logic (Fairchild 100K / 5-gate & 4-gate SSI ICs) avoids transistor saturation so gates switch in < 0.7 ns.",
          p: /ECL Sub-Nanosecond/i,
          viz: "adder",
        },
        {
          t: "Thermal & propagation physics: 115 kW of continuous ECL current conducts laterally through aluminium-copper plates into vertical Freon-12 coldbars.",
          p: /Freon-12 Copper|Twisted-Pair Chord/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Application: vectorized Courant 1D hyperbolic wave PDE & DAXPY (Y = αX + Y) hydrodynamics kernel.",
          p: /Vector Chime/i,
          viz: "app",
        },
        {
          t: "Cray Operating System (COS) & CFT Vectorizing Fortran Compiler: detects loop-carried dependencies to emit strip-mined 64-element vector instructions.",
          p: /Operator Console|Vector Chime/i,
          viz: "os",
        },
        {
          t: "Register-to-Register Vector ISA & Chaining: V3 <- S1 * V0 streams element-by-element directly into V4 <- V3 + V2 within a single chime (88 clocks vs 216 unchained!).",
          p: /ECL Sub-Nanosecond|Vector Chime/i,
          viz: "isa",
        },
        {
          t: "64-bit Cray floating-point words & 80 MHz differential twisted-pair waveforms.",
          p: /Twisted-Pair Chord|ECL Sub-Nanosecond/i,
          viz: "crayvec",
        },
      ],
      probe(m) {
        const s = m.sim;
        return {
          v4: Array.from(s.V[4].slice(0, s.VL)),
          mflops: s.mflops.toFixed(1),
          spd: s.speedupVsScalar.toFixed(1),
          chained: s.chainedClocks,
          unchained: s.unchainedClocks,
          wbits: 8,
          a: Math.abs(Math.round(s.V[3][16] * 50)) & 0xff,
          b: Math.abs(Math.round(s.V[2][16] * 50)) & 0xff,
          sigTitle: "80 MHz (12.5 ns) Differential ECL Twisted-Pair Chime",
          bits: s.VL,
          app: `CFT Vectorized Courant Wave + DAXPY Kernel (VL=${s.VL})\n  V0 <- Mem[waveU[0..VL-1]]   (11 clk startup)\n  V3 <- S1(${s.alpha.toFixed(2)}) * V0          (7 clk FMUL)\n  V4 <- V3 + V2               (6 clk FADD ${s.chaining ? "CHAINED!" : "unchained"})`,
          os: `Cray Operating System (COS) Batch Stream\nSustained Throughput: ${s.mflops.toFixed(1)} MFLOPS (160 MFLOPS peak)\nSpeedup vs Scalar Loop: ×${s.speedupVsScalar.toFixed(1)}`,
          isa: `Chained Clocks: ${s.chainedClocks}  |  Unchained: ${s.unchainedClocks}  |  Scalar: ${s.scalarClocks}\nV4[0..3] = [${Array.from(s.V[4].slice(0, 4)).map((v) => v.toFixed(3)).join(", ")}]`,
        };
      },
    },

    cm2: {
      hw: [
        {
          t: "System level: Danny Hillis's Thinking Machines CM-2 (1987) — 8 black hypercube subcubes shimmering with crimson PE status LEDs and driven by a *Lisp / C* front-end workstation.",
          p: /Cube-of-Cubes|Subcube Octant|Front-End/i,
          viz: "spec",
        },
        {
          t: "Subcubes & router backplane: 4,096 custom VLSI chips (16 1-bit processors + 1 router node per chip = 65,536 PEs) wired as a 12-dimensional binary hypercube.",
          p: /Subcube Octant|PCB Blade|Hypercube Router/i,
          viz: "modules",
        },
        {
          t: "SIMD PE array & Feynman's e-cube router: every chip routes arbitrary point-to-point messages by flipping mismatched address bits (src ⊕ dst) dimension by dimension.",
          p: /PCB Blade|LED Matrix|Hypercube Router/i,
          viz: "cm2hyper",
        },
        {
          t: "1-bit ALU + Weitek FPUs: bit-serial full adders compute arbitrary-width arithmetic in lockstep, paired with 2,048 Weitek 3132 floating-point accelerators.",
          p: /PCB Blade|LED Matrix/i,
          viz: "adder",
        },
        {
          t: "Physics & signals: synchronous 7 MHz broadcast microinstruction clock and 4,096 diagnostic GaAsP red LEDs.",
          p: /LED Matrix|Hypercube Router/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Data-parallel *Lisp & C* programs: 2D torus cellular automata and Hillis–Steele O(log₂ N) parallel prefix scan (+-scan).",
          p: /Front-End Display|LED Matrix/i,
          viz: "app",
        },
        {
          t: "Paris Parallel Instruction Set & Virtual Processor (VP) ratioing: time-multiplexes each physical PE to emulate millions of virtual data-parallel elements.",
          p: /Front-End|Hypercube Router/i,
          viz: "os",
        },
        {
          t: "SIMD Broadcast Micro-Sequencer: one instruction fetch drives 65,536 simultaneous data operations masked by local 1-bit context flags.",
          p: /PCB Blade|Hypercube Router/i,
          viz: "isa",
        },
        {
          t: "Hypercube XOR routing flits & bit-serial PE flag streams.",
          p: /LED Matrix|Hypercube Router/i,
          viz: "cm2hyper",
        },
      ],
      probe(m) {
        const s = m.sim;
        return {
          grid: s.grid,
          dimLoads: Array.from(s.dimLoads),
          wbits: 8,
          a: s.scanIn[3],
          b: s.scanOut[3],
          sigTitle: "7 MHz SIMD Broadcast Bus & 12-D Hypercube Flits",
          bits: s.activePop || 128,
          app: `*Lisp Data-Parallel Kernel (Step ${s.steps})\nHillis–Steele O(log₂ N) Prefix Scan:\n  IN : [${Array.from(s.scanIn.slice(0, 8)).join(", ")}...]\n  OUT: [${Array.from(s.scanOut.slice(0, 8)).join(", ")}...]`,
          os: `CM-2 Paris Runtime · Active PEs: ${s.activePop || 128}/256\nTotal e-Cube XOR Packets Routed: ${s.routedPackets.toLocaleString()}`,
          isa: `Broadcast SIMD Lockstep + Conditional Context Flag\ne-Cube Dimension Loads: [${Array.from(s.dimLoads).join(", ")}]`,
        };
      },
    },

    bgene: {
      hw: [
        {
          t: "System level: IBM Blue Gene petascale cabinets tilted for diagonal laminar cooling, uniting massive counts of low-wattage SoCs over a 3D Torus and hardware collective tree.",
          p: /Sloped Cabinet|Torus Wraparound|Allreduce Tree|Console/i,
          viz: "spec",
        },
        {
          t: "Node cards & 5 networks: 32 quad-core compute ASICs per card link directly into the ±X, ±Y, ±Z 3D Torus, global MPI_Allreduce binary tree, and global sub-microsecond barrier.",
          p: /Compute Node Card|Torus Wraparound|Allreduce Tree/i,
          viz: "modules",
        },
        {
          t: "System-on-Chip integration: quad PowerPC 450 cores, dual Double-Hummer SIMD FPUs, L3 eDRAM, and DMA torus routers on a single low-power die.",
          p: /Compute Node Card/i,
          viz: "chip",
        },
        {
          t: "In-network collective ALU: integer/FP reduction units embedded inside the binary-tree switches sum global residuals in < 2.5 µs.",
          p: /Allreduce Tree|Compute Node Card/i,
          viz: "adder",
        },
        {
          t: "Power-density physics: running 850 MHz cores (P ∝ C V² f) achieves 5×–10× higher GFLOPS/Watt than high-voltage gigahertz server CPUs.",
          p: /Compute Node Card|Torus Wraparound/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Application: 3D periodic Poisson / thermal diffusion stencil PDE across 64 MPI ranks (±X, ±Y, ±Z halo exchanges).",
          p: /Blue Gene MPI/i,
          viz: "app",
        },
        {
          t: "Compute Node Kernel (CNK): ultra-lightweight deterministic OS eliminating daemon interrupts (OS jitter) so 65,536+ ranks hit MPI_Allreduce barriers in lockstep.",
          p: /Compute Node Card|Blue Gene MPI/i,
          viz: "os",
        },
        {
          t: "MPI Domain Decomposition + Amdahl vs. Gustafson Scaling: S_Amdahl(P) = 1/(f + (1-f)/P) vs S_Gustafson(P) = f + P(1-f).",
          p: /Torus Wraparound|Allreduce Tree/i,
          viz: "isa",
        },
        {
          t: "Torus cut-through packet flits & IEEE-754 double-precision stencil words.",
          p: /Torus Wraparound/i,
          viz: "sigwave",
        },
      ],
      probe(m) {
        const s = m.sim;
        return {
          wbits: 8,
          a: s.iters & 0xff,
          b: Math.round(s.residual * 10) & 0xff,
          sigTitle: "850 MHz Torus Cut-Through Links & Global Barrier",
          bits: s.allreduceCalls & 0xff,
          app: `3D Periodic Torus Heat/Poisson Stencil (Iter ${s.iters})\nL2 Residual = ${s.residual.toFixed(5)}\nHalo Exchanges = ${s.haloMessages.toLocaleString()} msgs`,
          os: `Deterministic Compute Node Kernel (Zero OS Jitter)\nHardware Tree MPI_Allreduce Calls = ${s.allreduceCalls}`,
          isa: `Serial Fraction f = ${(s.serialFrac * 100).toFixed(1)}% @ P=65,536 cores:\n  Amdahl Strong Speedup    = ×${s.amdahlSpeedup(65536).toFixed(1)}\n  Gustafson Scaled Speedup = ×${Math.round(s.gustafsonSpeedup(65536)).toLocaleString()}`,
        };
      },
    },

    exascale: {
      hw: [
        {
          t: "Exascale system: ORNL Frontier-class liquid-cooled cabinet (1.194 × 10¹⁸ FP64 ops/s across 74 racks), warm-water CDU, and 200GbE Slingshot Dragonfly optical fabric.",
          p: /Compute Cabinet|Coolant Distribution|Telemetry Display/i,
          viz: "spec",
        },
        {
          t: "Dense blades & Rosetta Dragonfly switches: 4 multi-die HBM2e GPUs per node attach directly to 4 NICs (GPUDirect RDMA) with at most 3 optical hops across the entire machine.",
          p: /Exascale Blade|Slingshot Rosetta/i,
          viz: "modules",
        },
        {
          t: "2.5D CoWoS / Elevated-Fanout GPU + HBM stacks: compute chiplets sit micrometers from high-bandwidth memory stacks under skived copper coldplates.",
          p: /Exascale Blade|Coldplate Block/i,
          viz: "chip",
        },
        {
          t: "Matrix Core mixed-precision units: fast FP32/FP16 LU panel factorization refined iteratively in IEEE FP64 hardware.",
          p: /Coldplate Block/i,
          viz: "adder",
        },
        {
          t: "Thermodynamics & optics: 32 °C warm-water cooling captures > 90% of heat into copper coldplates (62.7 GFLOPS/W) while UGAL optical links balance Dragonfly traffic.",
          p: /Supply Manifold|Return Manifold|Slingshot Rosetta/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Application: Exascale High-Performance Linpack (HPL) / HPL-AI solver converging to 10⁻¹⁴ IEEE FP64 residual.",
          p: /Telemetry Display/i,
          viz: "app",
        },
        {
          t: "Slingshot UGAL Adaptive Routing & Slurm Topology Scheduler: senses per-group optical queue congestion to detour packets over 2-hop non-minimal Valiant paths.",
          p: /Slingshot Rosetta|Telemetry Display/i,
          viz: "os",
        },
        {
          t: "HIP / ROCm GPU Kernels + GPUDirect Asynchronous RDMA.",
          p: /Exascale Blade|Coldplate Block/i,
          viz: "isa",
        },
        {
          t: "IEEE-754 FP64 mantissa refinement & 200GbE PAM4 optical frames.",
          p: /Slingshot Rosetta|Supply Manifold/i,
          viz: "sigwave",
        },
      ],
      probe(m) {
        const s = m.sim;
        return {
          wbits: 8,
          a: Math.round(s.outletTempC) & 0xff,
          b: Math.round(s.gflopsPerWatt) & 0xff,
          sigTitle: "200GbE Slingshot Optical Lanes & CDU Thermal Loop",
          bits: s.luSteps & 0xff,
          app: `Mixed-Precision LU + FP64 Iterative Refinement (Step ${s.luSteps})\n  FP32 Initial ||Ax - b||₂ = ${s.fp32Residual.toExponential(2)}\n  FP64 Refined ||Ax - b||₂ = ${s.hplResidual.toExponential(2)}`,
          os: `Slingshot Dragonfly Fabric: ${s.adaptiveRouting ? "UGAL Adaptive Routing" : "Minimal Static Routing"}\nCoolant Loop: ${s.inletTempC.toFixed(1)} °C -> ${s.outletTempC.toFixed(1)} °C (${s.powerMW} MW)`,
          isa: `Sustained Rate: ${s.exaflops} ExaFLOPS (${s.gflopsPerWatt.toFixed(1)} GFLOPS/W)\n8-Group Loads: [${Array.from(s.groupLoads).map((v) => Math.round(v * 100) + "%").join(", ")}]`,
        };
      },
    },

    gb200: {
      hw: [
        {
          t: "Rack-scale AI supercomputer: the 120 kW liquid-cooled Blackwell GB200 NVL72 rack fusing 36 Grace CPUs, 72 dual-die GPUs, and 9 NVLink Switch trays into one coherent accelerator.",
          p: /NVL72|Compute Tray|NVLink-5|Copper NVLink Spine/i,
          viz: "spec",
        },
        {
          t: "Compute trays, switch trays & 5,000-wire copper spine: blind-mate twinax copper cartridges deliver 130 TB/s all-to-all NVLink5 bandwidth across all 72 GPUs without optical-retimer power burn.",
          p: /Compute Tray|NVLink-5|Copper NVLink Spine/i,
          viz: "modules",
        },
        {
          t: "Dual-reticle Blackwell package: two reticle-sized dies linked by a 10 TB/s silicon bridge (NV-HBI) so software sees one unified 208-billion-transistor GPU with 8 HBM3e stacks.",
          p: /Compute Tray/i,
          viz: "chip",
        },
        {
          t: "2nd-Gen Transformer Engine: dynamic microscaling (MXFP8 / NVFP4) tensor cores plus in-switch SHARP reductions.",
          p: /Compute Tray|NVLink-5/i,
          viz: "adder",
        },
        {
          t: "224 Gbps SerDes & direct-to-chip liquid cooling: differential twinax copper skin-effect equalization and stainless coolant manifolds.",
          p: /Copper NVLink Spine|Coolant/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Application: live gradient-descent training of a Top-2 Sparse Mixture-of-Experts (MoE) frontier model.",
          p: /NVLink Console/i,
          viz: "app",
        },
        {
          t: "3D Parallelism Runtime (TP × EP × PP): Tensor Parallelism inside trays, Expert Parallel All-to-All over the 130 TB/s NVLink5 spine, and Pipeline Parallelism across racks.",
          p: /NVLink-5|Copper NVLink Spine/i,
          viz: "os",
        },
        {
          t: "Warp-Group Asynchronous Tensor MMA (WGMMA / TMEM) & Microscaling Block Formats (MXFP8 / NVFP4).",
          p: /Compute Tray/i,
          viz: "isa",
        },
        {
          t: "4-bit / 8-bit microscaled tensor mantissas + shared block exponents.",
          p: /Copper NVLink Spine|NVLink-5/i,
          viz: "sigwave",
        },
      ],
      probe(m) {
        const s = m.sim;
        return {
          wbits: 8,
          a: s.steps & 0xff,
          b: Math.round(s.loss * 200) & 0xff,
          sigTitle: "224G SerDes Twinax NVLink5 & 120 kW Coolant Loop",
          bits: s.precision === "FP4" ? 0x0f : 0xff,
          app: `Live Top-2 Sparse MoE Training (Step ${s.steps})\nCurrent Loss: ${s.loss.toFixed(5)}\nActive Top-2 Experts: E${s.lastTopExperts[0]} & E${s.lastTopExperts[1]}`,
          os: `NVL72 Unified 30 TB Coherent Memory Domain\n130 TB/s All-to-All Dispatch Counts: [${Array.from(s.expertCounts).join(", ")}]`,
          isa: `Transformer Engine Precision: ${s.precision} (${s.precision === "FP4" ? "1,440" : "720"} PFLOPS rack peak)`,
        };
      },
    },

    qtransmon: {
      hw: [
        {
          t: "Cryogenic system: a 6-stage gold-plated OFHC copper ³He/⁴He dilution refrigerator cooling a flip-chip superconducting transmon processor down to 15 millikelvin.",
          p: /Cryostat Gantry|Plate|Mixing Chamber|Transmon|Console/i,
          viz: "spec",
        },
        {
          t: "Thermal cascade & microwave chain: 50 K -> 4 K (cryogenic HEMT amplifiers) -> 800 mK Still -> 100 mK Cold -> 15 mK Mixing Chamber linked by coiled superconducting NbTi coax.",
          p: /Plate|NbTi Superconducting|Mixing Chamber/i,
          viz: "modules",
        },
        {
          t: "Rotated Surface-Code QPU chip: data transmons interleaved with X- and Z-measure ancilla qubits and tunable couplers on a sapphire/silicon flip-chip.",
          p: /Transmon|Silicon Die/i,
          viz: "qecsurf",
        },
        {
          t: "Dispersive resonator readout & syndrome parity checks: λ/4 coplanar waveguide resonators measure ZZZZ and XXXX stabilizer eigenvalues non-destructively.",
          p: /Transmon|NbTi Superconducting/i,
          viz: "qecsurf",
        },
        {
          t: "Josephson junction physics: nonlinear Al/AlOx/Al tunnel inductance creates anharmonic |0⟩ <-> |1⟩ spacing (~5 GHz), shielded from thermal Cooper-pair quasiparticles at 15 mK.",
          p: /Silicon Die|Mixing Chamber/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Quantum circuit & logical memory: 5-qubit GHZ entanglement statevector protected by a d=3 / d=5 Rotated Surface Code.",
          p: /Telemetry Console/i,
          viz: "app",
        },
        {
          t: "Real-Time Minimum-Weight Perfect Matching (MWPM) QEC Decoder: pairs stabilizer defects in < 1 µs per cycle on room-temperature FPGAs.",
          p: /FPGA QEC Control|Telemetry Console/i,
          viz: "os",
        },
        {
          t: "Shaped Microwave Pulse ISA: DRAG Gaussian XY pulses (20 ns), flux-tunable CZ adiabatic gates, and Pauli-frame tracking.",
          p: /NbTi Superconducting|Silicon Die/i,
          viz: "isa",
        },
        {
          t: "IQ quadrature readout trajectories & stabilizer syndrome bitstreams.",
          p: /Silicon Die|Telemetry Console/i,
          viz: "qecsurf",
        },
      ],
      probe(m) {
        const s = m.sim;
        return {
          d: s.codeDistance,
          temp: s.tempMk,
          pPhys: s.physicalErrorRate(),
          pLog: s.logicalErrorRatePerCycle(),
          errs: Array.from(s.dataErrors),
          fid: s.ghzFidelity,
          sigTitle: "4.8 GHz Shaped DRAG Microwave Envelope & IQ Readout",
          bits: s.cycles & 0xff,
          app: `5-Qubit GHZ + d=${s.codeDistance} Rotated Surface Code (Round ${s.cycles})\nP(|00000⟩)=${(s.re[0] ** 2).toFixed(3)}  P(|11111⟩)=${(s.re[31] ** 2).toFixed(3)}\nGHZ Fidelity=${(s.ghzFidelity * 100).toFixed(1)}%`,
          os: `Real-Time FPGA Syndrome Decoder (<1 µs latency)\nCorrected Rounds: ${s.correctedShots} · Logical Failures: ${s.logicalErrors}`,
          isa: `Mixing Chamber T = ${s.tempMk} mK\np_phys = ${(s.physicalErrorRate() * 100).toFixed(2)}% (Threshold ~1.00%)\nε_logical/cycle = ${s.logicalErrorRatePerCycle().toExponential(2)}`,
        };
      },
    },

    qatom: {
      hw: [
        {
          t: "Neutral-atom platform: optical breadboard, octagonal 10⁻¹¹ Torr fused-silica UHV cell, Anti-Helmholtz MOT coils, high-NA microscope objective, and AOD/SLM laser beams.",
          p: /Optical Breadboard|UHV Science Cell|MOT Magnetic|Objective|Console/i,
          viz: "spec",
        },
        {
          t: "Zoned optical architecture: SLM static traps hold storage registers while crossed 2D AOD deflectors physically shuttle entangled ⁸⁷Rb atoms into the 480 nm Rydberg gate zone.",
          p: /AOD|Laser Head|Beam|UHV Science Cell/i,
          viz: "modules",
        },
        {
          t: "Defect-free atomic register: identical neutral ⁸⁷Rb atoms — zero fabrication variance, zero cryogenic wiring bottleneck.",
          p: /Atom Qubit|Objective/i,
          viz: "chip",
        },
        {
          t: "Rydberg CZ blockade gate: when R < R_b, van der Waals V(R) = C₆/R⁶ shifts the doubly-excited |rr⟩ state far out of resonance, driving a collective √2 Ω entangling gate.",
          p: /Atom Qubit|Rydberg Beam/i,
          viz: "adder",
        },
        {
          t: "Atomic physics: hyperfine clock states (6.835 GHz, T₂ > 1 s) excited to giant n=70S Rydberg orbitals inside 20 µK laser-cooled vacuum.",
          p: /Atom Qubit|MOT Magnetic|Beam/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Quantum algorithm: zoned neutral-atom Bell/GHZ preparation via coherent AOD transport and global Rydberg π-pulses.",
          p: /Zone Shuttling Console/i,
          viz: "app",
        },
        {
          t: "Atom Rearrangement & AOD Trajectory Compiler: computes jerk-minimized RF frequency chirps to shuttle qubit arrays without motional heating.",
          p: /AOD|Zone Shuttling Console/i,
          viz: "os",
        },
        {
          t: "Zoned Neutral-Atom Gate Set: global Rydberg CZ on any-to-any shuttled pairs + local Raman hyperfine rotations.",
          p: /Rydberg Beam|Atom Qubit/i,
          viz: "isa",
        },
        {
          t: "EMCCD single-atom 780 nm fluorescence photon counts & blockade populations.",
          p: /Objective|Atom Qubit/i,
          viz: "sigwave",
        },
      ],
      probe(m) {
        const s = m.sim;
        return {
          wbits: 8,
          a: Math.round(s.bellProb * 100),
          b: Math.round(s.rrLeakage * 100),
          sigTitle: "AOD Chirped RF Tone + Two-Photon 780nm/480nm Rydberg Pulse",
          bits: Math.round(s.atomSpacingUm * 10),
          app: `2-Atom Rydberg Blockade Schrödinger Solver (Zone: ${s.zone})\n|gg⟩=${(s.pop[0] * 100).toFixed(1)}%  |gr⟩+|rg⟩=${(s.bellProb * 100).toFixed(1)}%  |rr⟩=${(s.rrLeakage * 100).toFixed(2)}%`,
          os: `AOD Coherent Shuttling Scheduler\nSpacing R = ${s.atomSpacingUm.toFixed(1)} µm  (Blockade Radius R_b = ${s.blockadeRadiusUm().toFixed(2)} µm)`,
          isa: `Blockade Shift V(R)/2π = ${s.blockadeShiftMHz().toFixed(1)} MHz\nCollective √2·Ω π-pulse = ${(s.piPulseUs() * 1000).toFixed(1)} ns`,
        };
      },
    },

    qphotonic: {
      hw: [
        {
          t: "Photonic MBQC system: room-temperature Si₃N₄ + TFLN photonic wafers, telecom 1550 nm optical fiber time-bin delay spools, and a compact 4 K SNSPD single-photon detector pod.",
          p: /Photonic Module|Fiber Delay Spool|SNSPD|Console/i,
          viz: "spec",
        },
        {
          t: "Wafer-to-fiber fusion network: squeezed micro-ring photon sources interfere on 50:50 beamsplitters and enter silica delay loops awaiting adaptive electro-optic feedforward.",
          p: /Photonic Module|Fiber Delay Spool|Single Photon/i,
          viz: "modules",
        },
        {
          t: "300mm CMOS-foundry Si₃N₄ + TFLN PIC: ultra-low-loss silicon-nitride waveguides monolithically integrated with Pockels-effect lithium-niobate phase shifters.",
          p: /Photonic Integrated Circuit|Micro-Ring/i,
          viz: "chip",
        },
        {
          t: "Type-II Fusion Gates & Pauli Feedforward: destructive projective measurements on entangled cluster nodes teleport unitary gates onto surviving photons.",
          p: /Micro-Ring|Single Photon|SNSPD/i,
          viz: "adder",
        },
        {
          t: "Quantum optics: 1550 nm telecom dual-rail / GKP squeezed wavepackets detected with >99% efficiency when a single photon breaks superconductivity in a 4 K NbN nanowire.",
          p: /Single Photon|SNSPD/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "One-Way Quantum Computation (Raussendorf & Briegel 2001): arbitrary single-qubit unitary Rz(γ)Rx(β)Rz(α) executed purely by adaptive measurements on cluster state |G⟩.",
          p: /Feedforward Console/i,
          viz: "app",
        },
        {
          t: "Sub-Nanosecond Feedforward Controller: flips downstream measurement sign φ'_k = (-1)^{s_{k-1}} φ_k while the target photon is still in its fiber delay spool!",
          p: /Fiber Delay Spool|Feedforward Console/i,
          viz: "os",
        },
        {
          t: "MBQC Measurement Calculus & Pauli Byproduct Frame X^{s₀⊕s₂} Z^{s₁}.",
          p: /Photonic Integrated Circuit|SNSPD/i,
          viz: "isa",
        },
        {
          t: "SNSPD picosecond click timestamps & Pockels modulator half-wave voltages V_π.",
          p: /SNSPD|Single Photon/i,
          viz: "sigwave",
        },
      ],
      probe(m) {
        const s = m.sim;
        const [bx, by, bz] = s.outputBloch;
        return {
          wbits: 8,
          a: s.outcomes[0] * 4 + s.outcomes[1] * 2 + s.outcomes[2],
          b: s.shots & 0xff,
          sigTitle: "1550 nm Time-Bin Photons & 4K SNSPD Nanosecond Feedforward",
          bits: (s.outcomes[0] << 2) | (s.outcomes[1] << 1) | s.outcomes[2],
          app: `4-Node Cluster State |G⟩ Gate Teleportation (Shot ${s.shots})\nAngles (α,β,γ) = (${s.angles.map((a) => a.toFixed(2)).join(", ")})\nTeleported Bloch r = [${bx.toFixed(3)}, ${by.toFixed(3)}, ${bz.toFixed(3)}]`,
          os: `TFLN Electro-Optic Feedforward:\nSNSPD Clicks s = (${s.outcomes.join(", ")}) -> Byproduct X^${s.outcomes[0] ^ s.outcomes[2]} Z^${s.outcomes[1]}`,
          isa: `Purity |r| = ${Math.hypot(bx, by, bz).toFixed(6)} (100% outcome-invariant across all 8 branches!)`,
        };
      },
    },

    qtopo: {
      hw: [
        {
          t: "Topological system: cryogenic gold puck, 1.2 T axial Zeeman solenoid, InAs/Al topological superconductor tetron die, and 3D spacetime Majorana worldline braid trajectories.",
          p: /Cold-Finger Puck|Zeeman Solenoid|Tetron Die|Worldline/i,
          viz: "spec",
        },
        {
          t: "Tetron nanowire architecture: two parallel InAs/Al topological segments bridged by a superconducting spine host 4 unpaired Majorana Zero Modes (γ₁, γ₂, γ₃, γ₄).",
          p: /Nanowire|Tetron Spine|Majorana Zero Mode/i,
          viz: "modules",
        },
        {
          t: "16×16 Kitaev BdG Quasiparticle Spectrum: exact Jacobi diagonalization reveals zero-energy edge modes (E = 0) pinned inside the bulk gap whenever |μ| < 2t.",
          p: /Tetron Die|Majorana Zero Mode/i,
          viz: "majoranabdg",
        },
        {
          t: "Non-Abelian Ising Anyon Braiding & Measurement-Only Interferometry: exchanging γ₁ ↔ γ₂ (σ₁) and γ₂ ↔ γ₃ (σ₂) applies exact non-commuting unitary matrices.",
          p: /Worldline|Majorana Zero Mode/i,
          viz: "majoranabdg",
        },
        {
          t: "Condensed-matter physics: strong Rashba spin-orbit coupling + axial Zeeman splitting + proximity s-wave pairing synthesize topological p_x + i p_y-like superconductivity.",
          p: /Zeeman Solenoid|Nanowire/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Topologically protected Clifford braid sequence operating inside the degenerate even-fermion-parity ground-state manifold {|0_L⟩, |1_L⟩}.",
          p: /Braid Group Console/i,
          viz: "app",
        },
        {
          t: "Topological Phase Tuner & Parity-Readout Compiler: maintains |μ| < 2t inside the topological diamond and translates Clifford circuits into projective iγ_j γ_k parity measurements.",
          p: /Braid Group Console|Tetron Die/i,
          viz: "os",
        },
        {
          t: "Artin Braid Group Generators: U(σ₁) = exp(-iπ/4 Z), U(σ₂) = exp(-iπ/4 X) with U(σ₁)U(σ₂) ≠ U(σ₂)U(σ₁).",
          p: /Worldline|Majorana Zero Mode/i,
          viz: "isa",
        },
        {
          t: "Quantum-dot dispersive capacitance shift ΔC reading joint fermion parity iγ₁γ₂ = ±1.",
          p: /Majorana Zero Mode|Tetron Die/i,
          viz: "majoranabdg",
        },
      ],
      probe(m) {
        const s = m.sim;
        const bl = s.bloch();
        return {
          mu: s.mu,
          split: s.zeroModeSplitting,
          spec: s.spectrum,
          word: s.braidWord.join("·") || "I",
          sigTitle: "Dispersive Quantum-Dot Fermion-Parity RF Reflectometry",
          bits: s.braidWord.length & 0xff,
          app: `Kitaev Nanowire Tetron · Phase: ${s.isTopologicalPhase() ? "TOPOLOGICAL (|μ|<2t)" : "TRIVIAL (|μ|>2t)"}\nZero-Mode Splitting ΔE₀ = ${s.zeroModeSplitting.toFixed(5)}\nBraid Word: ${s.braidWord.join(" ") || "|0_L⟩"}`,
          os: `Hardware Error Protection: Local noise commutes with non-local parity iγ₁γ₂\nLogical Bloch Vector = [${bl.map((v) => v.toFixed(3)).join(", ")}]`,
          isa: `Ising Anyon Braid Generators:\n  σ₁ = diag(e^{-iπ/4}, e^{+iπ/4})\n  σ₂ = (I - iX)/√2   [Non-Abelian: σ₁σ₂ ≠ σ₂σ₁]`,
        };
      },
    },

    qomega: {
      hw: [
        {
          t: "Horizon system: OMEGA-Q — a speculative fault-tolerant hyper-quantum architecture combining 8 modular qLDPC logical vaults, photonic Bell routers, and a levitating icosahedral switch core.",
          p: /Cryo-Photonic Cathedral|Logical QEC Vault|Switch Core|Holo-Display/i,
          viz: "spec",
        },
        {
          t: "Modular vault network: 8 peripheral logical QEC & magic-state distillation towers link into the central resonator via radial sapphire quantum-teleportation waveguides.",
          p: /Logical QEC Vault|Teleportation Waveguide|Sub-Cooler/i,
          viz: "modules",
        },
        {
          t: "Icosahedral optical-superconducting switch & d=31 qLDPC vaults: high-rate quantum Low-Density Parity-Check codes achieve 10× lower physical-qubit overhead than planar surface codes.",
          p: /Icosahedral|Gimbal Ring|Logical QEC Vault/i,
          viz: "omegaqft",
        },
        {
          t: "Fault-tolerant universal gate fabric: transversal Clifford operations paired with 15-to-1 magic-state distillation factories injecting < 10⁻³⁰-error |T⟩ states.",
          p: /Icosahedral|Teleportation Waveguide/i,
          viz: "omegaqft",
        },
        {
          t: "Cryo-photonic physics: 1.8 K superfluid Helium-II cooling + heralded telecom Bell-pair interference bridging stationary topological memories and flying photons.",
          p: /Sub-Cooler|Gimbal Ring|Teleportation Waveguide/i,
          viz: "sigwave",
        },
      ],
      sw: [
        {
          t: "Exact Quantum Algorithms running live: Shor's QFT₂₅₆ Integer Factoring (N=15,21,33,35), 256-state Grover O(√N) Search, and Full-CI H₂ Quantum Chemistry.",
          p: /Holo-Display/i,
          viz: "app",
        },
        {
          t: "Fault-Tolerant Lattice-Surgery & qLDPC Logical Operating System: compiles million-Toffoli quantum circuits into logicalBell-pair teleportation schedules.",
          p: /Logical QEC Vault|Holo-Display/i,
          viz: "os",
        },
        {
          t: "Logical Clifford+T ISA, Quantum Fourier Transform (QFT), Phase Estimation (QPE), and Grover Diffusion 2|s⟩⟨s| - I.",
          p: /Icosahedral|Holo-Display/i,
          viz: "isa",
        },
        {
          t: "Exact QFT₂₅₆ constructive-interference harmonics & Grover amplitude bars.",
          p: /Icosahedral|Gimbal Ring/i,
          viz: "omegaqft",
        },
      ],
      probe(m) {
        const s = m.sim;
        const sr = s.shorResult;
        const bars =
          s.mode === "grover"
            ? Array.from(s.groverAmp.slice(0, 64), (a) => a * a)
            : Array.from(s.qftProbs.slice(0, 64));
        return {
          mode: s.mode,
          shorText: `${sr.N}=${sr.factors[0]}×${sr.factors[1]}`,
          groverP: s.groverTargetProb,
          d: s.codeDistance,
          err: s.logicalErrorRate(),
          bars,
          sigTitle: "Heralded Optical Bell-Pair Teleportation & qLDPC Syndromes",
          bits: s.groverTarget & 0xff,
          app: `Active Quantum Engine: ${s.mode.toUpperCase()}\n• Shor QFT_256: N=${sr.N}, a=${sr.a} -> period r=${sr.period} -> ${sr.factors[0]} × ${sr.factors[1]}\n• Grover 256-State: Iter ${s.groverIter}/12 -> P(|${s.groverTarget}⟩) = ${(s.groverTargetProb * 100).toFixed(2)}%\n• H₂ Full-CI Curve: R_eq = ${s.h2EqAngstrom} Å, E₀ = ${s.h2MinEnergyHa.toFixed(4)} Ha`,
          os: `Speculative Fault-Tolerant Horizon OS (qLDPC d=${s.codeDistance})\nLogical Error Rate per Cycle: ε_L = ${s.logicalErrorRate().toExponential(2)}`,
          isa: `Clifford + Distilled |T⟩ Universal Logical Gate Set\nQFT_256 + Continued Fractions + Jordan–Wigner Fermion Mapping`,
        };
      },
    },
  });

  // ---- Live 2D Architecture Diagram Node-Value Pollers (Lm) for All 15 New Machines ----
  Object.assign(Lm, {
    s360: (m) => ({
      ros: "0x" + bt(m.sim.rosAddr, 3),
      cpu: "$" + (m.sim.decAcc / 100).toFixed(0),
      chan: m.sim.ioOverlappedCycles + " ovlp",
      prn: (m.sim.printerLines.length || 0) + " ln",
    }),
    unix70: (m) => ({
      cpu: m.sim.psw.mode + " PID " + m.sim.procs[m.sim.curIdx].pid,
      mmu: "0" + ds(m.sim.addrLights, 8),
      uni: m.sim.syscalls + " TRAP",
      imp: m.sim.arpanetPkts + " pkts",
    }),
    sun90: (m) => ({
      c0: "L0:" + m.sim.caches[0][0].state,
      bus: m.sim.stats.snoops + " snoop",
      raid: m.sim.disks.some((d) => d.failed) ? "XOR DEG" : "5/5 OK",
      net: m.sim.stats.httpReqs + " req",
    }),
    cloud10: (m) => ({
      lead: m.sim.leaderId() >= 0 ? "Leader N" + m.sim.leaderId() : "NO QUORUM",
      foll: m.sim.nodes.filter((n) => n.alive).length + "/5 up",
      nvme: m.sim.committedOps + " WAL",
      bus48: "48.0 V",
    }),
    zmain20: (m) => ({
      pu: m.sim.totalTx.toLocaleString() + " TX",
      ai: (m.sim.lastFraudScore * 100).toFixed(0) + "% risk",
      raim: m.sim.raimRepairs + " ECC",
      lpar: "4 LPARs",
    }),
    cray1: (m) => ({
      v0: "VL " + m.sim.VL,
      fmul: m.sim.mflops.toFixed(0) + " MF/s",
      fadd: m.sim.chaining ? "CHAINED" : "SERIAL",
    }),
    cm2: (m) => ({
      seq: "step " + m.sim.steps,
      pe: (m.sim.activePop || 0) + "/256",
      hyp: m.sim.routedPackets + " flits",
    }),
    bgene: (m) => ({
      soc: "iter " + m.sim.iters,
      torus: m.sim.haloMessages + " halo",
      tree: "res " + m.sim.residual.toFixed(3),
    }),
    exascale: (m) => ({
      gpu: m.sim.exaflops + " EF/s",
      dfly: m.sim.adaptiveRouting ? "UGAL" : "MIN",
      cdu: m.sim.outletTempC.toFixed(1) + " °C",
    }),
    gb200: (m) => ({
      nvl: "loss " + m.sim.loss.toFixed(3),
      spine: "130 TB/s",
      top9: m.sim.precision,
    }),
    qtransmon: (m) => ({
      qpu: m.sim.tempMk + " mK · d=" + m.sim.codeDistance,
      syn: "F=" + (m.sim.ghzFidelity * 100).toFixed(0) + "%",
      dec: m.sim.correctedShots + " QEC",
    }),
    qatom: (m) => ({
      uhv: m.sim.zone,
      ryd: "R=" + m.sim.atomSpacingUm.toFixed(1) + "µm",
      cmos: "Bell " + (m.sim.bellProb * 100).toFixed(0) + "%",
    }),
    qphotonic: (m) => ({
      fib: "shot " + m.sim.shots,
      snspd: "s=" + m.sim.outcomes.join(""),
      out: "|r|=" + Math.hypot(...m.sim.outputBloch).toFixed(2),
    }),
    qtopo: (m) => ({
      nw: "μ=" + m.sim.mu.toFixed(2),
      mzm: "ΔE=" + m.sim.zeroModeSplitting.toFixed(3),
      brd: m.sim.braidWord.slice(-2).join("·") || "I",
    }),
    qomega: (m) => ({
      core: m.sim.mode.toUpperCase(),
      qldpc: "d=" + m.sim.codeDistance,
      alg:
        m.sim.mode === "shor"
          ? `${m.sim.shorResult.N}=${m.sim.shorResult.factors[0]}×${m.sim.shorResult.factors[1]}`
          : m.sim.mode === "grover"
            ? `P=${(m.sim.groverTargetProb * 100).toFixed(0)}%`
            : `${m.sim.h2MinEnergyHa.toFixed(3)} Ha`,
    }),
  });

  // Tag existing p0 rows with Circle wing for 4-Circle Atlas filtering
  for (const row of p0) {
    if (!row.wing) {
      row.wing = row.id === "quantum" ? "quantum" : "personal";
    }
  }

  // ---- Append Documented Engineering Reference Rows to p0 for Compare Modal ----
  p0.push(
    {
      id: "s360",
      wing: "servers",
      name: "IBM System/360 Model 50",
      year: 1964,
      clock: 2e6,
      mem: 262144,
      tr: null,
      devices: "SLT hybrid ceramic modules + 2,816-word capacitor ROS",
      power: 8300,
      price: 1.2e6,
      note: "500 ns internal microcycle (2.0 µs 32-bit core cycle); 64–512 KB core; standardized the 8-bit byte & CCW I/O channels.",
      src: "IBM System/360 Model 50 Functional Characteristics (A22-6898); Pugh, Johnson & Palmer (MIT Press, 1991)",
    },
    {
      id: "unix70",
      wing: "servers",
      name: "DEC PDP-11/70 (UNIX v6 Server)",
      year: 1973,
      clock: 3.33e6,
      mem: 512 * 1024,
      tr: null,
      devices: "Schottky TTL MSI hex boards + 2 KB bipolar parity cache",
      power: 2800,
      price: 54600,
      note: "UNIX rewritten in C (1973) on PDP-11; 11/70 expanded APR MMU to 22-bit physical RAM (up to 4 MB) + MASSBUS.",
      src: "DEC PDP-11/70 Processor Handbook (1975); Ritchie & Thompson, CACM 17(7) (1974)",
    },
    {
      id: "sun90",
      wing: "servers",
      name: "Sun SPARCcenter 2000 (4× SuperSPARC SMP)",
      year: 1993,
      clock: 50e6,
      mem: 512 * 2 ** 20,
      tr: 4 * 3.1e6,
      power: 1800,
      price: 95000,
      note: "Up to 20 SuperSPARC CPUs on dual packet-switched XDBus snooping buses + Fast/Wide SCSI RAID.",
      src: "Sun Microsystems SPARCcenter 2000 Architecture Manual (1993); TI SuperSPARC datasheet",
    },
    {
      id: "cloud10",
      wing: "servers",
      name: "Open-Compute Warehouse Cloud Rack (Xeon v3)",
      year: 2014,
      clock: 2.6e9,
      mem: 2048 * 2 ** 30,
      tr: 16 * 3.84e9,
      power: 12000,
      price: null,
      note: "8× dual-socket Xeon E5-2600 v3 sleds shown; 48V DC busbar + Clos Leaf-Spine fabric + 5-node Raft quorum.",
      src: "Barroso, Clidaras & Hölzle, The Datacenter as a Computer (3rd ed.); Ongaro & Ousterhout, USENIX ATC 2014",
    },
    {
      id: "zmain20",
      wing: "servers",
      name: "IBM z16 (Telum 4-Drawer Enterprise Mainframe)",
      year: 2022,
      clock: 5.2e9,
      mem: 40 * 2 ** 40,
      tr: 32 * 22.5e9,
      power: 23500,
      price: null,
      note: "32 Telum 7nm chips (22.5 B transistors each); 2 GB virtual L4 per drawer; RAIM memory; inline 1 ms AI fraud scoring.",
      src: "IBM z16 Technical Introduction (SG24-8950, 2022); Hot Chips 33 Telum disclosure",
    },
    {
      id: "cray1",
      wing: "super",
      name: "Cray-1 Vector Supercomputer",
      year: 1976,
      clock: 80e6,
      mem: 8 * 2 ** 20,
      tr: 2.5e6,
      devices: "~200,000 ECL SSI ICs (~2.5 M transistors)",
      power: 115000,
      price: 8.86e6,
      note: "12.5 ns clock (160 MFLOPS peak); 1M 64-bit words SRAM; Freon-cooled 270° C-frame; introduced vector registers & chaining.",
      src: "R. M. Russell, “The CRAY-1 Computer System”, CACM 21(1) (1978); Computer History Museum",
    },
    {
      id: "cm2",
      wing: "super",
      name: "Thinking Machines Connection Machine CM-2",
      year: 1987,
      clock: 7e6,
      mem: 512 * 2 ** 20,
      tr: null,
      devices: "65,536 1-bit SIMD PEs + 2,048 Weitek FPUs (12-D hypercube)",
      power: 28000,
      price: 5e6,
      note: "2.5–28 GFLOPS peak; Danny Hillis & Richard Feynman's e-cube XOR router; 4,096 status LEDs.",
      src: "W. D. Hillis, The Connection Machine (MIT Press, 1985); Thinking Machines CM-2 Technical Summary (1987)",
    },
    {
      id: "bgene",
      wing: "super",
      name: "IBM Blue Gene/P (1-Rack 1,024-Node Reference)",
      year: 2008,
      clock: 850e6,
      mem: 4 * 2 ** 40,
      tr: 1024 * 205e6,
      power: 32000,
      price: 1.3e6,
      note: "Figures per 4,096-core rack (13.9 TFLOPS/rack; 72+ racks = Petascale); 3D torus + hardware MPI_Allreduce tree.",
      src: "IBM Journal of R&D Vol. 52 No. 1/2 (2008), “Overview of the IBM Blue Gene/P project”",
    },
    {
      id: "exascale",
      wing: "super",
      name: "ORNL Frontier Exascale Supercomputer",
      year: 2022,
      clock: 1.7e9,
      mem: 9.2 * 2 ** 40,
      tr: 37632 * 58.2e9,
      power: 21.1e6,
      price: 600e6,
      note: "First verified Exascale computer (1.194 ExaFLOPS HPL); 9,408 nodes, 37,632 MI250X GPUs, 9.2 PB HBM2e+DDR4 (shown capped in TB scale), 32 °C water.",
      src: "Atchley et al., “Frontier: Exploring Exascale”, SC23 (2023); TOP500 June 2022",
    },
    {
      id: "gb200",
      wing: "super",
      name: "NVIDIA GB200 NVL72 AI Supercomputer Rack",
      year: 2025,
      clock: 2.0e9,
      mem: 30 * 2 ** 40,
      tr: 72 * 208e9,
      power: 120000,
      price: null,
      note: "36 Grace CPUs + 72 dual-die Blackwell GPUs (208 B transistors each = ~15 T GPU transistors/rack); 130 TB/s copper NVLink5.",
      src: "NVIDIA Blackwell Architecture Technical Brief (2024/2025)",
    },
    {
      id: "qtransmon",
      wing: "quantum",
      name: "Superconducting 15 mK Surface-Code QPU (Willow-class)",
      year: 2024,
      clock: null,
      mem: null,
      tr: null,
      devices: "105 superconducting transmon qubits @ 15 mK",
      power: 15000,
      price: null,
      note: "Demonstrated below-threshold quantum error correction (d=3->5->7 suppresses logical error by Λ=2.14 per step); power = pulse-tube cryostat.",
      src: "Google Quantum AI, “Quantum error correction below the surface code threshold”, Nature 638 (2024/2025)",
    },
    {
      id: "qatom",
      wing: "quantum",
      name: "Neutral-Atom 87Rb Rydberg Optical-Tweezer QPU",
      year: 2023,
      clock: null,
      mem: null,
      tr: null,
      devices: "280 physical 87Rb atoms (48 logical qubits) in UHV tweezers",
      power: 5000,
      price: null,
      note: "Coherent 2D AOD atom shuttling across Storage, Entangle (C6/R^6 Rydberg blockade), and Readout zones at room-temperature UHV.",
      src: "Bluvstein et al. (Harvard / MIT / QuEra), Nature 626 (2024) 58",
    },
    {
      id: "qphotonic",
      wing: "quantum",
      name: "Measurement-Based Fusion Photonic QPU",
      year: 2025,
      clock: null,
      mem: null,
      tr: null,
      devices: "Si3N4 + BaTiO3/TFLN photonic wafers + 4 K SNSPDs",
      power: null,
      price: null,
      note: "300mm semiconductor-foundry photonic chips + optical fiber delay loops + nanosecond Pauli feedforward.",
      src: "Bartolucci et al. (PsiQuantum), NatureComms (2023); Alexander et al., Nature (2025); Raussendorf & Briegel (2001)",
    },
    {
      id: "qtopo",
      wing: "quantum",
      name: "Topological Majorana Nanowire Tetron (InAs/Al)",
      year: 2025,
      clock: null,
      mem: null,
      tr: null,
      devices: "InAs/Al hybrid topological superconductor nanowires (MZM tetron)",
      power: null,
      price: null,
      note: "Hardware parity protection via non-Abelian Majorana Zero Modes (|μ| < 2t) & quantum-dot interferometric readout.",
      src: "Kitaev, Physics-Uspekhi 44 (2001); Microsoft Azure Quantum, Nature 638 (Feb 2025)",
    },
    {
      id: "qomega",
      wing: "quantum",
      name: "OMEGA-Q Fault-Tolerant Horizon Architecture (Speculative)",
      year: 2045,
      clock: null,
      mem: null,
      tr: null,
      devices: "Speculative modular qLDPC + photonic-interconnect logical vaults",
      power: null,
      price: null,
      note: "Speculative horizon architecture (no fabricated figures claimed); executes exact live Shor QFT_256, 256-state Grover & H2 Full-CI math.",
      src: "Shor, SIAM J. Comput. 26 (1997); Grover, STOC (1996); Bravyi et al. (high-rate qLDPC), Nature 627 (2024)",
    },
  );
})();
