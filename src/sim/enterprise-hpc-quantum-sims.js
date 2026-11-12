// Operational Computational Engines for Circles II, III & IV:
//   Circle II  (Mainframes & Servers): S360System, UnixPdp11System, SmpMesiRaidServer, CloudRaftCluster, ModernMainframeZ
//   Circle III (Supercomputers)      : Cray1VectorCpu, ConnectionMachineCM2, BlueGeneTorusMpi, ExascaleDragonflySim, BlackwellAiRackSim
//   Circle IV  (Age of Quantum)      : CryoSurfaceCodeQuantum, NeutralAtomTweezerSim, PhotonicMbqcSim, TopologicalMajoranaSim, OmegaSingularityCore

(function (globalScope) {
  "use strict";

  // ============================================================================
  // 1. IBM SYSTEM/360 MODEL 50 (1964) — 32-Bit GPRs, ROS Microcode & CCW Channels
  // ============================================================================
  const S360_PROGRAMS = {
    "Packed-Decimal Payroll & Channel Tape I/O": `* IBM System/360 Enterprise Batch Ledger + Autonomous Channel I/O
* R1=Record Count, R2=Gross Sum, R3=Tax Sum, R4=Net Sum
      LA    R1,6
      LA    R2,0
      LA    R3,0
      SIO   0x180        * Start autonomous 2401 Tape Channel Read!
LOOP  L     R5,GROSS
      L     R6,RATE
      AR    R2,R5        * Gross += Record Gross
      AR    R3,R6        * Tax   += Withholding
      LR    R4,R2
      SR    R4,R3        * Net   = Gross - Tax
      AP    DECACC,DECPAY * Packed-Decimal BCD accumulate
      SIO   0x00E        * Non-blocking 1403 Line-Printer Channel!
      S     R1,ONE
      BNE   LOOP
      ST    R4,NETOUT
      SVC   0            * Supervisor Call -> OS/360 Job Done`,
    "Binary Search & Storage-Key Trap Check": `* S/360 32-bit Register Arithmetic & Condition-Code Branching
      LA    R1,8
      LA    R2,100
      LA    R3,37
STEP  AR    R2,R3
      CR    R2,LIMIT
      BH    DONE
      S     R1,ONE
      BNE   STEP
DONE  ST    R2,NETOUT
      SIO   0x190        * Flush audit block to 2311 Disk Pack
      SVC   1`,
  };

  class S360System {
    constructor() {
      this.regs = new Int32Array(16);
      this.mem = new Int32Array(256);
      this.storageKeys = new Uint8Array(16); // 4-bit storage protection keys per 16-word page
      this.psw = { pc: 0, cc: 0, key: 1, problemState: false, halted: false };
      this.decAcc = 125000; // cents ($1,250.00 BCD)
      this.decPay = 34750; // cents ($347.50 BCD)
      this.channels = {
        0x180: { name: "2401 Tape", busy: 0, records: 0, bytes: 0, reelAng: 0 },
        0x190: { name: "2311 Disk", busy: 0, records: 0, bytes: 0, cyl: 14 },
        0x00e: { name: "1403 Printer", busy: 0, records: 0, bytes: 0, lines: [] },
      };
      this.rosAddr = 0x010;
      this.rosPhase = "IFETCH";
      this.cycles = 0;
      this.instCount = 0;
      this.ioOverlappedCycles = 0;
      this.program = [];
      this.labels = {};
      this.log = [];
      this.loadProgram(S360_PROGRAMS["Packed-Decimal Payroll & Channel Tape I/O"]);
    }

    loadProgram(src) {
      this.src = src;
      this.regs.fill(0);
      this.mem.fill(0);
      // Seed named memory constants at word offsets 128+
      this.symMem = {
        GROSS: 128,
        RATE: 129,
        ONE: 130,
        LIMIT: 131,
        NETOUT: 132,
        DECACC: 133,
        DECPAY: 134,
      };
      this.mem[128] = 4850;
      this.mem[129] = 970;
      this.mem[130] = 1;
      this.mem[131] = 320;
      this.decAcc = 125000;
      this.decPay = 34750;

      const lines = String(src).split(/\r?\n/);
      const insts = [];
      const labels = {};
      for (const raw of lines) {
        const clean = raw.replace(/\*.*$/, "").trim();
        if (!clean) continue;
        const toks = clean.split(/\s+/);
        let idx = 0;
        const knownOps = new Set([
          "LA",
          "L",
          "ST",
          "A",
          "S",
          "AR",
          "SR",
          "LR",
          "CR",
          "BC",
          "BNE",
          "BE",
          "BH",
          "BL",
          "B",
          "AP",
          "SIO",
          "SVC",
        ]);
        if (!knownOps.has(toks[0].toUpperCase())) {
          labels[toks[0].toUpperCase()] = insts.length;
          idx = 1;
        }
        if (idx >= toks.length) continue;
        const op = toks[idx].toUpperCase();
        const rest = toks.slice(idx + 1).join("");
        const args = rest ? rest.split(",").map((s) => s.trim()) : [];
        insts.push({ op, args, text: clean });
      }
      this.program = insts;
      this.labels = labels;
      this.psw = { pc: 0, cc: 0, key: 1, problemState: false, halted: false };
      this.cycles = 0;
      this.instCount = 0;
      this.ioOverlappedCycles = 0;
      for (const ch of Object.values(this.channels)) {
        ch.busy = 0;
      }
      this.log = ["IPL 0180 -> OS/360 Primary Control Program ready"];
    }

    _reg(tok) {
      if (!tok) return 0;
      const m = String(tok)
        .toUpperCase()
        .match(/^R?(\d+)$/);
      return m ? Math.max(0, Math.min(15, parseInt(m[1], 10))) : 0;
    }

    _addr(tok) {
      if (!tok) return 0;
      const up = String(tok).toUpperCase();
      if (this.symMem[up] !== undefined) return this.symMem[up];
      if (this.labels[up] !== undefined) return this.labels[up];
      return parseInt(up, 0) || 0;
    }

    _setCC(val) {
      this.psw.cc = val === 0 ? 0 : val < 0 ? 1 : 2;
    }

    step() {
      // Advance autonomous I/O channels concurrently with CPU!
      let anyBusy = false;
      for (const [devHex, ch] of Object.entries(this.channels)) {
        if (ch.busy > 0) {
          anyBusy = true;
          ch.busy--;
          ch.bytes += 80;
          if (Number(devHex) === 0x180) ch.reelAng += 0.48;
          if (Number(devHex) === 0x190) ch.cyl = (ch.cyl + 3) % 200;
          if (ch.busy === 0) {
            ch.records++;
            if (Number(devHex) === 0x00e) {
              const line = `PAY REC#${ch.records} GROSS=$${this.regs[2]} TAX=$${this.regs[3]} BCD=$${(this.decAcc / 100).toFixed(2)}`;
              ch.lines.push(line);
              if (ch.lines.length > 8) ch.lines.shift();
            }
          }
        }
      }

      if (this.psw.halted || this.psw.pc >= this.program.length) {
        if (this.program.length > 0) {
          // Loop batch stream continuously for live hardware demo once channels drain
          if (!anyBusy) {
            this.psw.pc = 0;
            this.psw.halted = false;
          } else {
            this.cycles++;
            this.ioOverlappedCycles++;
            return { op: "WAIT-IO", ros: 0x1f0 };
          }
        } else {
          return null;
        }
      }

      const ins = this.program[this.psw.pc++];
      this.instCount++;
      this.cycles += 3;
      if (anyBusy) this.ioOverlappedCycles += 3;

      const { op, args } = ins;
      this.lastInst = ins.text;
      switch (op) {
        case "LA": {
          const r = this._reg(args[0]);
          this.regs[r] = this._addr(args[1]);
          this.rosAddr = 0x042;
          this.rosPhase = "RX-AGEN";
          break;
        }
        case "L": {
          const r = this._reg(args[0]);
          const a = this._addr(args[1]) & 255;
          this.regs[r] = this.mem[a];
          this.rosAddr = 0x088;
          this.rosPhase = "MEM-READ";
          break;
        }
        case "ST": {
          const r = this._reg(args[0]);
          const a = this._addr(args[1]) & 255;
          this.mem[a] = this.regs[r];
          this.rosAddr = 0x094;
          this.rosPhase = "MEM-WRITE";
          break;
        }
        case "LR": {
          const r1 = this._reg(args[0]);
          const r2 = this._reg(args[1]);
          this.regs[r1] = this.regs[r2];
          this.rosAddr = 0x030;
          this.rosPhase = "RR-XFER";
          break;
        }
        case "AR": {
          const r1 = this._reg(args[0]);
          const r2 = this._reg(args[1]);
          this.regs[r1] = (this.regs[r1] + this.regs[r2]) | 0;
          this._setCC(this.regs[r1]);
          this.rosAddr = 0x051;
          this.rosPhase = "ALU-ADD";
          break;
        }
        case "SR": {
          const r1 = this._reg(args[0]);
          const r2 = this._reg(args[1]);
          this.regs[r1] = (this.regs[r1] - this.regs[r2]) | 0;
          this._setCC(this.regs[r1]);
          this.rosAddr = 0x055;
          this.rosPhase = "ALU-SUB";
          break;
        }
        case "A": {
          const r1 = this._reg(args[0]);
          const a = this._addr(args[1]) & 255;
          this.regs[r1] = (this.regs[r1] + this.mem[a]) | 0;
          this._setCC(this.regs[r1]);
          this.rosAddr = 0x062;
          this.rosPhase = "RX-ADD";
          break;
        }
        case "S": {
          const r1 = this._reg(args[0]);
          const a = this._addr(args[1]) & 255;
          this.regs[r1] = (this.regs[r1] - this.mem[a]) | 0;
          this._setCC(this.regs[r1]);
          this.rosAddr = 0x066;
          this.rosPhase = "RX-SUB";
          break;
        }
        case "CR": {
          const r1 = this._reg(args[0]);
          const a =
            this.symMem[String(args[1]).toUpperCase()] !== undefined
              ? this.mem[this._addr(args[1])]
              : this.regs[this._reg(args[1])];
          this._setCC(this.regs[r1] - a);
          this.rosAddr = 0x070;
          this.rosPhase = "CMP-CC";
          break;
        }
        case "AP": {
          this.decAcc += this.decPay;
          this._setCC(this.decAcc);
          this.cycles += 4;
          this.rosAddr = 0x120;
          this.rosPhase = "BCD-DECIMAL";
          break;
        }
        case "BNE": {
          if (this.psw.cc !== 0) this.psw.pc = this._addr(args[0]);
          this.rosAddr = 0x0a4;
          this.rosPhase = "BRANCH-CC";
          break;
        }
        case "BE": {
          if (this.psw.cc === 0) this.psw.pc = this._addr(args[0]);
          this.rosAddr = 0x0a4;
          this.rosPhase = "BRANCH-CC";
          break;
        }
        case "BH": {
          if (this.psw.cc === 2) this.psw.pc = this._addr(args[0]);
          this.rosAddr = 0x0a6;
          this.rosPhase = "BRANCH-CC";
          break;
        }
        case "BL": {
          if (this.psw.cc === 1) this.psw.pc = this._addr(args[0]);
          this.rosAddr = 0x0a8;
          this.rosPhase = "BRANCH-CC";
          break;
        }
        case "B": {
          this.psw.pc = this._addr(args[0]);
          this.rosAddr = 0x0a0;
          this.rosPhase = "BRANCH";
          break;
        }
        case "SIO": {
          const dev = parseInt(args[0], 0) || 0x180;
          const ch = this.channels[dev] || this.channels[0x180];
          ch.busy = 4;
          this.psw.cc = 0; // Channel accepted CCW!
          this.rosAddr = 0x180;
          this.rosPhase = "CHAN-CCW";
          break;
        }
        case "SVC": {
          const code = parseInt(args[0], 10) || 0;
          this.log.push(
            `SVC ${code}: Job step complete · Net=$${this.mem[132]} · BCD=$${(this.decAcc / 100).toFixed(2)}`,
          );
          if (this.log.length > 8) this.log.shift();
          this.psw.halted = true;
          this.rosAddr = 0x1e0;
          this.rosPhase = "SVC-SUPV";
          break;
        }
      }
      return { op, ros: this.rosAddr, cc: this.psw.cc };
    }

    bcdHex() {
      const digits = Math.abs(this.decAcc).toString().padStart(7, "0");
      return digits + (this.decAcc >= 0 ? "C" : "D");
    }
  }

  // ============================================================================
  // 2. DEC PDP-11/70 & UNIX V6 SERVER (1973) — 16-Bit ISA, APR MMU, Pipes & Inodes
  // ============================================================================
  class UnixPdp11System {
    constructor() {
      this.regs = new Uint16Array(8); // R0..R5, R6=SP, R7=PC
      this.psw = { mode: "USER", n: 0, z: 0, v: 0, c: 0, ipl: 0 };
      this.aprKernel = [0o0000, 0o0200, 0o0400, 0o0600, 0o1000, 0o1200, 0o1400, 0o7600];
      this.aprUser = [0o2000, 0o2200, 0o2400, 0o2600, 0o3000, 0o3200, 0o3400, 0o3600];
      this.procs = [
        { pid: 0, ppid: 0, name: "swapper", state: "RUN", pri: 0, cpu: 12 },
        { pid: 1, ppid: 0, name: "/etc/init", state: "SLP", pri: 24, cpu: 8 },
        { pid: 14, ppid: 1, name: "-sh", state: "RUN", pri: 28, cpu: 31 },
        { pid: 22, ppid: 14, name: "cat /etc/motd", state: "PIPE", pri: 30, cpu: 19 },
        { pid: 23, ppid: 14, name: "wc -l", state: "RUN", pri: 30, cpu: 16 },
        { pid: 29, ppid: 1, name: "ncpd (ARPA)", state: "NET", pri: 20, cpu: 25 },
      ];
      this.inodes = [
        { ino: 2, mode: "drwxr-xr-x", size: 512, path: "/" },
        { ino: 18, mode: "-rwxr-xr-x", size: 8192, path: "/unix" },
        { ino: 41, mode: "-rwxr-xr-x", size: 4620, path: "/bin/sh" },
        { ino: 52, mode: "-rwxr-xr-x", size: 11264, path: "/bin/cc" },
        { ino: 77, mode: "-rw-r--r--", size: 618, path: "/usr/sys/ken/slp.c" },
        { ino: 93, mode: "-rw-r--r--", size: 240, path: "/etc/passwd" },
      ];
      this.pipeBuf = [];
      this.pipeBytes = 0;
      this.syscalls = 0;
      this.ctxSwitches = 0;
      this.arpanetPkts = 0;
      this.curIdx = 2;
      this.addrLights = 0o177560;
      this.dataLights = 0o012700;
      this.termLines = [
        "UNIX Sixth Edition (Bell Labs / PDP-11/70 · 256 KW Core + UNIBUS)",
        "login: ken",
        "# cat /usr/sys/ken/slp.c | wc -l",
        "      48",
        "# ",
      ];
    }

    translateVirtual(vaddr, isKernel = false) {
      const page = (vaddr >>> 13) & 7;
      const offset = vaddr & 0x1fff;
      const baseBlock = (isKernel ? this.aprKernel : this.aprUser)[page];
      return ((baseBlock << 6) + offset) & 0x3fffff; // 22-bit PDP-11/70 physical address!
    }

    step() {
      // Execute a cycle of PDP-11 user/kernel activity
      const p = this.procs[this.curIdx];
      p.cpu++;
      const vpc = (0o010000 + ((p.cpu * 2) & 0x0fff)) & 0xffff;
      this.regs[7] = vpc;
      this.regs[6] = 0o177700;
      this.regs[0] = (this.regs[0] + 17) & 0xffff;
      this.regs[1] = (p.pid * 257 + p.cpu) & 0xffff;
      this.psw.z = (this.regs[0] & 7) === 0 ? 1 : 0;
      this.psw.n = (this.regs[0] & 0x8000) !== 0 ? 1 : 0;

      // Periodic UNIX TRAP syscall (sys_write / sys_pipe / clock tick)
      let event = "INST";
      if (p.cpu % 5 === 0) {
        this.psw.mode = "KERNEL";
        this.syscalls++;
        this.pipeBuf.push((0x41 + (this.syscalls % 26)) & 0x7f);
        if (this.pipeBuf.length > 16) this.pipeBuf.shift();
        this.pipeBytes += 64;
        event = "TRAP";
      } else {
        this.psw.mode = "USER";
      }

      if (p.cpu % 9 === 0) {
        this.curIdx = (this.curIdx + 1) % this.procs.length;
        this.ctxSwitches++;
        event = "SWTCH";
      }

      if (this.syscalls % 4 === 0 && event === "TRAP") {
        this.arpanetPkts++;
      }

      this.addrLights = this.translateVirtual(vpc, this.psw.mode === "KERNEL");
      this.dataLights = ((this.regs[0] << 2) ^ this.regs[1]) & 0xffff;
      return { event, proc: this.procs[this.curIdx], paddr: this.addrLights };
    }

    execCommand(cmdRaw) {
      const cmd = String(cmdRaw || "").trim();
      if (!cmd) return "";
      let out = "";
      if (cmd === "ps") {
        out = this.procs
          .map(
            (p) =>
              `PID ${String(p.pid).padStart(2)}  ${p.state.padEnd(4)}  TIME ${p.cpu}  ${p.name}`,
          )
          .join("\n");
      } else if (cmd.startsWith("ls")) {
        out = this.inodes
          .map(
            (n) =>
              `${String(n.ino).padStart(3)} ${n.mode} ${String(n.size).padStart(6)} ${n.path}`,
          )
          .join("\n");
      } else if (cmd === "fork") {
        const nextPid = 30 + this.procs.length * 3;
        this.procs.push({
          pid: nextPid,
          ppid: 14,
          name: "a.out (child)",
          state: "RUN",
          pri: 31,
          cpu: 1,
        });
        if (this.procs.length > 9) this.procs.splice(3, 1);
        this.syscalls++;
        out = `sys_fork() -> child PID ${nextPid} (COW APR descriptors cloned)`;
      } else if (cmd.includes("|")) {
        this.pipeBytes += 512;
        this.syscalls += 3;
        out = `pipe fd[3->4] streamed 512 B · total=${this.pipeBytes} B`;
      } else if (cmd === "uname" || cmd === "help") {
        out = "Commands: ps | ls -i | fork | cat /etc/passwd | wc | uname";
      } else {
        this.syscalls++;
        out = `exec("${cmd}") -> exit(0) [syscalls=${this.syscalls}]`;
      }
      this.termLines.push("# " + cmd, ...out.split("\n"));
      while (this.termLines.length > 12) this.termLines.shift();
      return out;
    }
  }

  // ============================================================================
  // 3. SUN SPARCCENTER SMP + MESI CACHE COHERENCE + RAID-5 SERVER (1993)
  // ============================================================================
  class SmpMesiRaidServer {
    constructor() {
      this.numCpus = 4;
      // Each CPU caches 4 shared cache lines (addresses 0..3), states: I, S, E, M
      this.caches = Array.from({ length: 4 }, () =>
        Array.from({ length: 4 }, (_, addr) => ({
          addr,
          state: "I",
          val: (addr + 1) * 10,
        })),
      );
      this.mem = new Int32Array([10, 20, 30, 40]);
      // 5-disk RAID-5 array: 8 stripes of 4 data bytes + 1 XOR parity byte
      this.disks = Array.from({ length: 5 }, (_, d) => ({
        id: d,
        failed: false,
        rebuilding: false,
        iops: 0,
        data: new Uint8Array(8),
      }));
      this._initRaidStripes();
      this.busTransactions = [];
      this.stats = {
        hits: 0,
        misses: 0,
        snoops: 0,
        invalidations: 0,
        httpReqs: 0,
        degradedReads: 0,
      };
      this.lastBus = "IDLE";
      this.tick = 0;
    }

    _initRaidStripes() {
      for (let s = 0; s < 8; s++) {
        const parityDisk = s % 5;
        let xorVal = 0;
        for (let d = 0; d < 5; d++) {
          if (d === parityDisk) continue;
          const v = ((s * 37 + d * 53 + 19) & 0xff) >>> 0;
          this.disks[d].data[s] = v;
          xorVal ^= v;
        }
        this.disks[parityDisk].data[s] = xorVal;
      }
    }

    cpuAccess(cpuId, addr, isWrite, writeVal = null) {
      const c = this.caches[cpuId][addr];
      let busOp = "HIT";
      if (!isWrite) {
        if (c.state !== "I") {
          this.stats.hits++;
        } else {
          this.stats.misses++;
          busOp = "BusRd";
          let sharedFound = false;
          let suppliedVal = this.mem[addr];
          for (let other = 0; other < this.numCpus; other++) {
            if (other === cpuId) continue;
            const oc = this.caches[other][addr];
            if (oc.state !== "I") {
              sharedFound = true;
              this.stats.snoops++;
              suppliedVal = oc.val;
              if (oc.state === "M") {
                this.mem[addr] = oc.val; // dirty flush intervention!
              }
              oc.state = "S";
            }
          }
          c.val = suppliedVal;
          c.state = sharedFound ? "S" : "E";
        }
      } else {
        const nextVal = writeVal !== null ? writeVal : c.val + 1;
        if (c.state === "M") {
          this.stats.hits++;
          c.val = nextVal;
        } else if (c.state === "E") {
          this.stats.hits++;
          c.state = "M";
          c.val = nextVal;
        } else {
          if (c.state === "I") this.stats.misses++;
          else this.stats.hits++;
          busOp = c.state === "S" ? "BusUpgr" : "BusRdX";
          for (let other = 0; other < this.numCpus; other++) {
            if (other === cpuId) continue;
            const oc = this.caches[other][addr];
            if (oc.state !== "I") {
              this.stats.snoops++;
              this.stats.invalidations++;
              if (oc.state === "M") this.mem[addr] = oc.val;
              oc.state = "I";
            }
          }
          c.val = nextVal;
          c.state = "M";
        }
      }
      this.lastBus = `CPU${cpuId} ${isWrite ? "WR" : "RD"}[L${addr}] -> ${busOp} (${c.state})`;
      this.busTransactions.push(this.lastBus);
      if (this.busTransactions.length > 10) this.busTransactions.shift();
      return { state: c.state, val: c.val, busOp };
    }

    failDisk(diskIdx) {
      for (let d = 0; d < 5; d++) {
        this.disks[d].failed = d === diskIdx ? !this.disks[d].failed : false;
      }
    }

    rebuildRaid() {
      const broken = this.disks.findIndex((d) => d.failed);
      if (broken < 0) return false;
      for (let s = 0; s < 8; s++) {
        let xorRec = 0;
        for (let d = 0; d < 5; d++) {
          if (d !== broken) xorRec ^= this.disks[d].data[s];
        }
        this.disks[broken].data[s] = xorRec;
      }
      this.disks[broken].failed = false;
      return true;
    }

    readRaidStripe(stripeIdx, targetDisk) {
      const s = stripeIdx & 7;
      const d = targetDisk % 5;
      if (!this.disks[d].failed) {
        this.disks[d].iops++;
        return { value: this.disks[d].data[s], degraded: false };
      }
      // Reconstruct missing disk byte via live RAID-5 XOR across surviving 4 drives!
      let xorVal = 0;
      for (let k = 0; k < 5; k++) {
        if (k === d) continue;
        this.disks[k].iops++;
        xorVal ^= this.disks[k].data[s];
      }
      this.stats.degradedReads++;
      return { value: xorVal, degraded: true };
    }

    step() {
      this.tick++;
      const cpu = this.tick % 4;
      const addr = (this.tick * 3 + cpu) % 4;
      const isWrite = this.tick % 3 === 0;
      const ca = this.cpuAccess(cpu, addr, isWrite, this.mem[addr] + this.tick);
      const raid = this.readRaidStripe(this.tick % 8, (this.tick + 1) % 5);
      this.stats.httpReqs += 4;
      return { cpu, addr, ca, raid };
    }
  }

  // ============================================================================
  // 4. WAREHOUSE-SCALE CLOUD RACK & RAFT CONSENSUS CLUSTER (2014)
  // ============================================================================
  class CloudRaftCluster {
    constructor() {
      this.nodes = Array.from({ length: 5 }, (_, id) => ({
        id,
        role: id === 0 ? "LEADER" : "FOLLOWER",
        term: 1,
        votedFor: 0,
        alive: true,
        commitIndex: 2,
        logLen: 2,
        cpuUtil: 0.42 + id * 0.07,
        pods: 6 + (id % 3) * 2,
      }));
      this.log = [
        { term: 1, cmd: "PUT /cfg/shard0=n0" },
        { term: 1, cmd: "PUT /dns/api=10.4.0.12" },
      ];
      this.rpcs = [];
      this.tick = 0;
      this.elections = 1;
      this.committedOps = 2;
    }

    leaderId() {
      const l = this.nodes.find((n) => n.alive && n.role === "LEADER");
      return l ? l.id : -1;
    }

    toggleNode(id) {
      const n = this.nodes[id];
      if (!n) return;
      n.alive = !n.alive;
      if (!n.alive && n.role === "LEADER") {
        n.role = "FOLLOWER";
      }
      const aliveCount = this.nodes.filter((x) => x.alive).length;
      if (aliveCount >= 3 && this.leaderId() < 0) {
        this.triggerElection();
      }
    }

    triggerElection() {
      const candidates = this.nodes.filter((n) => n.alive);
      if (candidates.length < 3) return -1; // No quorum!
      const cand = candidates[this.elections % candidates.length];
      const nextTerm = Math.max(...this.nodes.map((n) => n.term)) + 1;
      cand.term = nextTerm;
      cand.role = "CANDIDATE";
      cand.votedFor = cand.id;
      let votes = 1;
      this.rpcs = [];
      for (const peer of this.nodes) {
        if (peer.id === cand.id || !peer.alive) continue;
        if (peer.term < nextTerm) {
          peer.term = nextTerm;
          peer.role = "FOLLOWER";
          peer.votedFor = cand.id;
          votes++;
          this.rpcs.push({ from: cand.id, to: peer.id, type: "RequestVote✓" });
        }
      }
      if (votes >= 3) {
        cand.role = "LEADER";
        this.elections++;
        return cand.id;
      }
      return -1;
    }

    propose(cmdText) {
      let lid = this.leaderId();
      if (lid < 0) {
        lid = this.triggerElection();
        if (lid < 0) return { ok: false, reason: "NO_QUORUM" };
      }
      const leader = this.nodes[lid];
      const entry = {
        term: leader.term,
        cmd: cmdText || `SET kv:${this.committedOps + 1}=${(this.tick * 17) & 0xff}`,
      };
      this.log.push(entry);
      if (this.log.length > 12) this.log.shift();
      leader.logLen++;
      let acks = 1;
      this.rpcs = [];
      for (const peer of this.nodes) {
        if (peer.id === lid || !peer.alive) continue;
        peer.term = leader.term;
        peer.role = "FOLLOWER";
        peer.logLen = leader.logLen;
        acks++;
        this.rpcs.push({ from: lid, to: peer.id, type: "AppendEntries" });
      }
      if (acks >= 3) {
        this.committedOps++;
        for (const peer of this.nodes) {
          if (peer.alive) peer.commitIndex = this.committedOps;
        }
        return { ok: true, leader: lid, term: leader.term, acks };
      }
      return { ok: false, reason: "QUORUM_LOST" };
    }

    step() {
      this.tick++;
      for (const n of this.nodes) {
        n.cpuUtil = n.alive
          ? 0.35 + 0.45 * Math.abs(Math.sin(this.tick * 0.19 + n.id * 1.1))
          : 0.0;
      }
      if (this.tick % 3 === 0) {
        return this.propose();
      }
      const lid = this.leaderId();
      if (lid >= 0) {
        this.rpcs = this.nodes
          .filter((n) => n.alive && n.id !== lid)
          .map((n) => ({ from: lid, to: n.id, type: "Heartbeat" }));
      }
      return { ok: lid >= 0, leader: lid };
    }
  }

  // ============================================================================
  // 5. TELUM-CLASS ZERO-DOWNTIME ENTERPRISE MAINFRAME (2022)
  // ============================================================================
  class ModernMainframeZ {
    constructor() {
      this.drawers = Array.from({ length: 4 }, (_, d) => ({
        id: d,
        l3HitRate: 0.942,
        l4VirtualHits: 0,
        clockGhz: 5.2,
        spareActive: false,
      }));
      this.raimChannels = [true, true, true, true, true]; // 4 data + 1 parity channel
      this.lpars = [
        { name: "CORE-BANK-PROD", weight: 45, tps: 142000 },
        { name: "CARD-FRAUD-AI", weight: 25, tps: 98000 },
        { name: "AIRLINE-RESV", weight: 20, tps: 54000 },
        { name: "LINUX-KVM-SVC", weight: 10, tps: 22000 },
      ];
      this.totalTx = 0;
      this.fraudFlagged = 0;
      this.droppedTx = 0;
      this.raimRepairs = 0;
      this.lastFraudScore = 0.04;
      this.ledgerBalance = 100000000; // $1,000,000.00 balanced double-entry invariant
    }

    injectMemoryChannelFault(chIdx = 2) {
      const idx = chIdx % 5;
      // Keep at most 1 channel faulted to demonstrate single-channel RAIM zero-downtime recovery
      this.raimChannels = [true, true, true, true, true];
      this.raimChannels[idx] = false;
      this.drawers[idx % 4].spareActive = true;
    }

    healAll() {
      this.raimChannels = [true, true, true, true, true];
      for (const d of this.drawers) d.spareActive = false;
    }

    step() {
      // Execute atomic double-entry ACID batch + inline neural fraud scoring (sigmoid dot-product)
      const batch = 240;
      this.totalTx += batch;
      const x0 = Math.sin(this.totalTx * 0.013);
      const x1 = Math.cos(this.totalTx * 0.007);
      const x2 = ((this.totalTx * 31) % 100) / 100;
      // On-chip AI Telum matrix-vector + logistic activation
      const z = 2.6 * Math.abs(x0) + 1.9 * x2 - 3.1 + (x1 > 0.85 ? 2.2 : 0);
      const prob = 1 / (1 + Math.exp(-z));
      this.lastFraudScore = prob;
      if (prob > 0.72) this.fraudFlagged++;

      // Double-entry invariant: debit A, credit B -> net ledger sum strictly invariant!
      const delta = 1250;
      this.ledgerBalance = this.ledgerBalance - delta + delta;

      // Virtual L4 ring coherency probes across the 4 processor drawers
      const srcDrawer = ((this.totalTx / batch) % 4) | 0;
      this.drawers[(srcDrawer + 1) % 4].l4VirtualHits += 7;

      if (this.raimChannels.some((ok) => !ok)) {
        this.raimRepairs += 4;
      }
      return { totalTx: this.totalTx, fraudProb: prob, dropped: this.droppedTx };
    }
  }

  // ============================================================================
  // 6. CRAY-1 VECTOR SUPERCOMPUTER (1976) — 80 MHz, V0..V7 & Vector Chaining
  // ============================================================================
  class Cray1VectorCpu {
    constructor() {
      this.N = 64;
      this.V = Array.from({ length: 8 }, () => new Float64Array(64));
      this.S = new Float64Array(8);
      this.A = new Int32Array(8);
      this.VL = 64;
      this.chaining = true;
      this.alpha = 2.15;
      this.waveU = new Float64Array(64);
      this.wavePrev = new Float64Array(64);
      for (let i = 0; i < 64; i++) {
        const x = (i - 32) / 9;
        this.waveU[i] = Math.exp(-x * x);
        this.wavePrev[i] = Math.exp(-(x - 0.08) * (x - 0.08));
        this.V[1][i] = this.waveU[i];
        this.V[2][i] = Math.sin((i / 64) * Math.PI * 2);
      }
      this.S[1] = this.alpha;
      this.scalarClocks = 0;
      this.unchainedClocks = 0;
      this.chainedClocks = 0;
      this.stepCount = 0;
      this.runKernelStep();
    }

    // Executes: V0 <- Mem[x];  V3 <- S1 * V1 (FMUL);  V4 <- V3 + V2 (FADD chained!)
    runKernelStep() {
      const vl = Math.max(1, Math.min(64, this.VL));
      this.S[1] = this.alpha;

      // Advance live 1D Courant wave equation in V1/V2/V4
      const next = new Float64Array(64);
      for (let i = 1; i < 63; i++) {
        next[i] =
          2 * this.waveU[i] -
          this.wavePrev[i] +
          0.18 * (this.waveU[i - 1] - 2 * this.waveU[i] + this.waveU[i + 1]);
      }
      this.wavePrev.set(this.waveU);
      this.waveU.set(next);

      for (let i = 0; i < vl; i++) {
        this.V[0][i] = this.waveU[i];
        this.V[3][i] = this.S[1] * this.V[0][i]; // Vector Multiply functional unit (7-stage)
        this.V[4][i] = this.V[3][i] + this.V[2][i]; // Vector Add functional unit (6-stage)
      }

      // Closed-form Cray-1 timing MODEL (review P8), not a cycle simulation (12.5 ns = 80 MHz):
      //   Scalar loop (Load 11 + FMul 7 + FAdd 6 + Branch 5 = 29 clks/elem)
      this.scalarClocks = vl * 29;
      //   Unchained vector: Startup/Load (11 + vl) + Startup/FMul (7 + vl) + Startup/FAdd (6 + vl)
      this.unchainedClocks = 11 + vl + (7 + vl) + (6 + vl);
      //   Chained vector: V0 load streams into FMul at clk 12, FMul streams into FAdd at clk 20 -> single chime!
      this.chainedClocks = 11 + 7 + 6 + vl;
      this.stepCount++;

      const activeClks = this.chaining ? this.chainedClocks : this.unchainedClocks;
      // 2 FLOPs per element (mul + add) at 80 MHz
      this.mflops = ((2 * vl) / activeClks) * 80;
      this.speedupVsScalar = this.scalarClocks / activeClks;
      return {
        vl,
        mflops: this.mflops,
        chainedClocks: this.chainedClocks,
        unchainedClocks: this.unchainedClocks,
        scalarClocks: this.scalarClocks,
      };
    }
  }

  // ============================================================================
  // 7. CONNECTION MACHINE CM-2 (1987) — 256-PE SIMD + Hypercube e-Cube Router
  // ============================================================================
  class ConnectionMachineCM2 {
    constructor() {
      this.W = 16;
      this.H = 16;
      this.N = 256; // 2^8 = 8-dimensional hypercube!
      this.grid = new Uint8Array(256);
      this.nextGrid = new Uint8Array(256);
      this.scanIn = new Int32Array(16);
      this.scanOut = new Int32Array(16);
      this.dimLoads = new Uint16Array(8); // traffic across each of the 8 hypercube dimensions
      this.mode = "life"; // "life" | "scan"
      this.steps = 0;
      this.routedPackets = 0;
      this.seedPattern();
    }

    seedPattern() {
      for (let i = 0; i < 256; i++) {
        this.grid[i] = ((i * 73 + 19) % 7 < 3 ? 1 : 0) ^ ((i >>> 3) & 1);
      }
      for (let i = 0; i < 16; i++) this.scanIn[i] = (i % 5) + 1;
      this.runParallelPrefixScan();
    }

    // Hillis-Steele O(log2 N) SIMD data-parallel prefix sum!
    runParallelPrefixScan() {
      let cur = Int32Array.from(this.scanIn);
      for (let d = 0; d < 4; d++) {
        const stride = 1 << d;
        const nxt = Int32Array.from(cur);
        for (let i = stride; i < 16; i++) {
          nxt[i] = cur[i] + cur[i - stride];
          this.routeHypercube(i - stride, i);
        }
        cur = nxt;
      }
      this.scanOut.set(cur);
      return this.scanOut;
    }

    // Exact Feynman/Hillis e-cube XOR dimension-order hypercube routing
    routeHypercube(src, dst) {
      let diff = (src ^ dst) & 0xff;
      let hops = 0;
      for (let dim = 0; dim < 8; dim++) {
        if (diff & (1 << dim)) {
          this.dimLoads[dim]++;
          hops++;
        }
      }
      this.routedPackets++;
      return hops;
    }

    step() {
      this.dimLoads.fill(0);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = y * 16 + x;
          let nbrs = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = (x + dx + 16) & 15;
              const ny = (y + dy + 16) & 15;
              const nIdx = ny * 16 + nx;
              if (this.grid[nIdx]) {
                nbrs++;
                if (dx & 1 && (x & 3) === 0) this.routeHypercube(nIdx, idx);
              }
            }
          }
          const alive = this.grid[idx];
          this.nextGrid[idx] = alive
            ? nbrs === 2 || nbrs === 3
              ? 1
              : 0
            : nbrs === 3
              ? 1
              : 0;
        }
      }
      // Re-inject glider pulse if population gets too sparse
      let pop = 0;
      for (let i = 0; i < 256; i++) pop += this.nextGrid[i];
      if (pop < 18) {
        this.seedPattern();
      } else {
        this.grid.set(this.nextGrid);
      }
      this.steps++;
      this.activePop = pop;
      return { pop, steps: this.steps, dimLoads: this.dimLoads };
    }
  }

  // ============================================================================
  // 8. BLUE GENE 3D-TORUS MPI PETASCALE SUPERCOMPUTER (2008)
  // ============================================================================
  class BlueGeneTorusMpi {
    constructor() {
      this.N = 12; // 12x12x4 3D periodic torus field mapped onto 4x4x4 = 64 MPI ranks
      this.field = new Float64Array(12 * 12 * 4);
      this.next = new Float64Array(12 * 12 * 4);
      this.iters = 0;
      this.haloMessages = 0;
      this.allreduceCalls = 0;
      this.residual = 1.0;
      this.serialFrac = 0.02; // 2% serial fraction for Amdahl vs Gustafson analysis
      this.injectHeatPulse();
    }

    injectHeatPulse() {
      for (let z = 0; z < 4; z++) {
        for (let y = 0; y < 12; y++) {
          for (let x = 0; x < 12; x++) {
            const dx = x - 5.5;
            const dy = y - 5.5;
            const dz = z - 1.5;
            this.field[z * 144 + y * 12 + x] =
              Math.exp(-(dx * dx + dy * dy + dz * dz) / 4.5) * 100;
          }
        }
      }
      this.residual = 12.5;
    }

    step() {
      let diffSq = 0;
      const alpha = 0.14;
      for (let z = 0; z < 4; z++) {
        const zp = ((z + 1) & 3) * 144;
        const zm = ((z + 3) & 3) * 144;
        const zc = z * 144;
        for (let y = 0; y < 12; y++) {
          const yp = ((y + 1) % 12) * 12;
          const ym = ((y + 11) % 12) * 12;
          const yc = y * 12;
          for (let x = 0; x < 12; x++) {
            const xp = (x + 1) % 12;
            const xm = (x + 11) % 12;
            const idx = zc + yc + x;
            const u = this.field[idx];
            const lap =
              this.field[zc + yc + xp] +
              this.field[zc + yc + xm] +
              this.field[zc + yp + x] +
              this.field[zc + ym + x] +
              this.field[zp + yc + x] +
              this.field[zm + yc + x] -
              6 * u;
            // Source forcing keeps standing eigenmode alive after decay
            const src =
              x === 3 && y === 3 && z === 1 ? 4.5 * Math.sin(this.iters * 0.12) : 0;
            const un = u + alpha * lap + src * 0.05;
            this.next[idx] = un;
            diffSq += (un - u) * (un - u);
          }
        }
      }
      this.field.set(this.next);
      this.iters++;
      this.haloMessages += 64 * 6; // ±X, ±Y, ±Z torus neighbor exchanges across 64 ranks
      this.allreduceCalls++;
      this.residual = Math.sqrt(diffSq / this.field.length);
      return { residual: this.residual, iters: this.iters };
    }

    amdahlSpeedup(P = 65536) {
      return 1 / (this.serialFrac + (1 - this.serialFrac) / P);
    }

    gustafsonSpeedup(P = 65536) {
      return this.serialFrac + P * (1 - this.serialFrac);
    }
  }

  // ============================================================================
  // 9. FRONTIER-CLASS EXASCALE SUPERCOMPUTER (2022) — Mixed-Precision HPL + Dragonfly
  // ============================================================================
  class ExascaleDragonflySim {
    constructor() {
      this.n = 8;
      this.adaptiveRouting = true;
      this.inletTempC = 32.0;
      this.outletTempC = 41.4;
      this.powerMW = 21.1;
      this.exaflops = 1.194;
      this.groupLoads = new Float32Array(8);
      this.hplResidual = 1e-14;
      this.luSteps = 0;
      this.solveMixedPrecisionHPL();
    }

    // Real 8x8 diagonally-dominant linear system solved via FP32 LU + FP64 Iterative Refinement!
    solveMixedPrecisionHPL() {
      const n = this.n;
      const A = new Float64Array(n * n);
      const b = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        let rowSum = 0;
        for (let j = 0; j < n; j++) {
          const v = Math.sin((i + 1) * 1.7 + (j + 1) * 0.9 + this.luSteps * 0.1);
          A[i * n + j] = v;
          rowSum += Math.abs(v);
        }
        A[i * n + i] = rowSum + 2.5;
        b[i] = Math.cos(i * 0.8 + this.luSteps * 0.05) * 4;
      }

      // Low-precision (Float32 quantized) LU factorization
      const LU = Float32Array.from(A);
      for (let k = 0; k < n; k++) {
        for (let i = k + 1; i < n; i++) {
          LU[i * n + k] = Math.fround(LU[i * n + k] / LU[k * n + k]);
          for (let j = k + 1; j < n; j++) {
            LU[i * n + j] = Math.fround(LU[i * n + j] - LU[i * n + k] * LU[k * n + j]);
          }
        }
      }

      const luSolve = (rhs) => {
        const y = new Float64Array(n);
        const x = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          let s = rhs[i];
          for (let j = 0; j < i; j++) s -= LU[i * n + j] * y[j];
          y[i] = s;
        }
        for (let i = n - 1; i >= 0; i--) {
          let s = y[i];
          for (let j = i + 1; j < n; j++) s -= LU[i * n + j] * x[j];
          x[i] = s / LU[i * n + i];
        }
        return x;
      };

      // Initial FP32 solution x0, followed by 2 steps of FP64 iterative refinement!
      let x = luSolve(b);
      this.fp32Residual = this._normResidual(A, x, b, n);
      for (let ref = 0; ref < 2; ref++) {
        const r = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          let ax = 0;
          for (let j = 0; j < n; j++) ax += A[i * n + j] * x[j];
          r[i] = b[i] - ax;
        }
        const dx = luSolve(r);
        for (let i = 0; i < n; i++) x[i] += dx[i];
      }
      this.hplResidual = this._normResidual(A, x, b, n);
      this.luSteps++;

      // Update Slingshot Dragonfly 8-group optical congestion
      for (let g = 0; g < 8; g++) {
        const rawLoad = 0.45 + 0.48 * Math.abs(Math.sin(this.luSteps * 0.35 + g * 0.9));
        // UGAL adaptive routing spreads hot optical-link spikes via 2-hop indirect Valiant paths!
        this.groupLoads[g] = this.adaptiveRouting
          ? 0.52 + (rawLoad - 0.52) * 0.38
          : rawLoad;
      }
      this.outletTempC = this.inletTempC + 8.6 + (this.adaptiveRouting ? 0.8 : 1.9);
      this.gflopsPerWatt = (this.exaflops * 1e9) / (this.powerMW * 1e6);
      return { fp32Res: this.fp32Residual, fp64Res: this.hplResidual };
    }

    _normResidual(A, x, b, n) {
      let s = 0;
      for (let i = 0; i < n; i++) {
        let ax = 0;
        for (let j = 0; j < n; j++) ax += A[i * n + j] * x[j];
        const d = b[i] - ax;
        s += d * d;
      }
      return Math.sqrt(s);
    }

    step() {
      return this.solveMixedPrecisionHPL();
    }
  }

  // ============================================================================
  // 10. BLACKWELL NVL72 RACK-SCALE AI SUPERCOMPUTER (2025) — TP/PP/EP MoE Engine
  // ============================================================================
  class BlackwellAiRackSim {
    constructor() {
      this.precision = "FP8"; // "FP8" | "FP4"
      this.numExperts = 4;
      // Real trainable 4-expert Router + Expert weights on a 4D token embedding task!
      this.routerW = new Float64Array(4 * 4);
      this.expertW = new Float64Array(4 * 4);
      for (let i = 0; i < 16; i++) {
        this.routerW[i] = Math.sin(i * 1.3 + 0.4) * 0.45;
        this.expertW[i] = Math.cos(i * 0.9 + 0.2) * 0.5;
      }
      this.expertCounts = new Uint32Array(4);
      this.lossHistory = [];
      this.steps = 0;
      this.loss = 1.0;
      this.nvlinkTBps = 130.0;
      this.tflops = 1440; // PFLOPS FP4 rack aggregate
      for (let i = 0; i < 12; i++) this.step();
    }

    _quantize(v) {
      // Dynamic block microscaling quantization (MXFP8 vs NVFP4)
      const levels = this.precision === "FP4" ? 7 : 127;
      return Math.round(v * levels) / levels;
    }

    step() {
      const lr = 0.06;
      const x = [
        Math.sin(this.steps * 0.37),
        Math.cos(this.steps * 0.37),
        Math.sin(this.steps * 0.74),
        1.0,
      ];
      const target = 0.65 * x[0] - 0.45 * x[1] + 0.3 * x[2];

      // 1. Router logits + Softmax over 4 MoE experts
      const logits = new Float64Array(4);
      let maxL = -1e9;
      for (let e = 0; e < 4; e++) {
        let s = 0;
        for (let d = 0; d < 4; d++) s += this._quantize(this.routerW[e * 4 + d]) * x[d];
        logits[e] = s;
        if (s > maxL) maxL = s;
      }
      const probs = new Float64Array(4);
      let sumExp = 0;
      for (let e = 0; e < 4; e++) {
        probs[e] = Math.exp(logits[e] - maxL);
        sumExp += probs[e];
      }
      for (let e = 0; e < 4; e++) probs[e] /= sumExp;

      // 2. Top-2 Sparse Expert Dispatch over NVLink All-to-All
      const order = [0, 1, 2, 3].sort((a, b) => probs[b] - probs[a]);
      const top = [order[0], order[1]];
      const gateSum = probs[top[0]] + probs[top[1]] || 1;
      const g0 = probs[top[0]] / gateSum;
      const g1 = probs[top[1]] / gateSum;
      this.expertCounts[top[0]]++;
      this.expertCounts[top[1]]++;

      const expertOut = [0, 0, 0, 0];
      for (const e of top) {
        let y = 0;
        for (let d = 0; d < 4; d++) y += this._quantize(this.expertW[e * 4 + d]) * x[d];
        expertOut[e] = Math.tanh(y);
      }

      const pred = g0 * expertOut[top[0]] + g1 * expertOut[top[1]];
      const err = pred - target;
      this.loss = 0.85 * this.loss + 0.15 * (err * err);
      this.lossHistory.push(this.loss);
      if (this.lossHistory.length > 48) this.lossHistory.shift();

      // 3. Backprop gradient update across active experts & router
      for (const [e, g] of [
        [top[0], g0],
        [top[1], g1],
      ]) {
        const dtanh = 1 - expertOut[e] * expertOut[e];
        for (let d = 0; d < 4; d++) {
          this.expertW[e * 4 + d] -= lr * err * g * dtanh * x[d];
          this.routerW[e * 4 + d] -= lr * 0.25 * err * expertOut[e] * x[d];
        }
      }

      this.steps++;
      this.lastTopExperts = top;
      return { loss: this.loss, topExperts: top };
    }
  }

  // ============================================================================
  // 11. SUPERCONDUCTING 15 mK DILUTION-CRYO & SURFACE-CODE QUANTUM (2024)
  // ============================================================================
  class CryoSurfaceCodeQuantum {
    constructor() {
      this.tempMk = 15; // 15 millikelvin mixing chamber!
      this.codeDistance = 5; // d=3 or d=5 rotated surface code
      this.nQubits = 5;
      this.re = new Float64Array(32);
      this.im = new Float64Array(32);
      // 4x4 data-qubit error lattice + stabilizer syndromes for d=3/5 visualization
      this.dataErrors = new Uint8Array(25); // 0=I, 1=X, 2=Z, 3=Y
      this.xSyndromes = new Uint8Array(12);
      this.zSyndromes = new Uint8Array(12);
      this.cycles = 0;
      this.logicalErrors = 0;
      this.correctedShots = 0;
      this.runCycle();
    }

    physicalErrorRate() {
      // Below ~35 mK transmons sit well below the ~1% surface-code threshold;
      // above ~80 mK thermal Cooper-pair breaking quasiparticles poison T1/T2!
      const base = 0.0028;
      const qp = 0.038 / (1 + Math.exp(-(this.tempMk - 85) / 16));
      return Math.min(0.25, base + qp);
    }

    logicalErrorRatePerCycle() {
      const p = this.physicalErrorRate();
      const pTh = 0.01; // ~1.0% surface code threshold
      const lambda = pTh / Math.max(1e-5, p);
      return 0.03 * Math.pow(1 / lambda, (this.codeDistance + 1) / 2);
    }

    _resetState() {
      this.re.fill(0);
      this.im.fill(0);
      this.re[0] = 1;
    }

    _hadamard(q) {
      const inv = Math.SQRT1_2;
      const bit = 1 << q;
      for (let i = 0; i < 32; i++) {
        if ((i & bit) === 0) {
          const j = i | bit;
          const r0 = this.re[i],
            m0 = this.im[i];
          const r1 = this.re[j],
            m1 = this.im[j];
          this.re[i] = (r0 + r1) * inv;
          this.im[i] = (m0 + m1) * inv;
          this.re[j] = (r0 - r1) * inv;
          this.im[j] = (m0 - m1) * inv;
        }
      }
    }

    _cnot(ctrl, targ) {
      const cb = 1 << ctrl;
      const tb = 1 << targ;
      for (let i = 0; i < 32; i++) {
        if ((i & cb) !== 0 && (i & tb) === 0) {
          const j = i | tb;
          const tr = this.re[i],
            ti = this.im[i];
          this.re[i] = this.re[j];
          this.im[i] = this.im[j];
          this.re[j] = tr;
          this.im[j] = ti;
        }
      }
    }

    runCycle() {
      // 1. Prepare 5-qubit GHZ entangled state (|00000> + |11111>)/sqrt(2)
      this._resetState();
      this._hadamard(0);
      for (let q = 0; q < 4; q++) this._cnot(q, q + 1);

      // 2. Deterministic pseudo-random thermal Pauli errors on d×d data patch + syndrome extraction
      const d = this.codeDistance;
      const p = this.physicalErrorRate();
      this.dataErrors.fill(0);
      let weightX = 0;
      for (let k = 0; k < d * d; k++) {
        const u = Math.abs(Math.sin((this.cycles + 1) * 12.9898 + k * 78.233)) % 1;
        if (u < p * 2.5) {
          this.dataErrors[k] = (k + this.cycles) % 2 === 0 ? 1 : 2;
          if (this.dataErrors[k] === 1) weightX++;
        }
      }

      // Compute plaquette parity checks (Z-stabilizers detect X-flips; X-stabilizers detect Z-flips)
      this.zSyndromes.fill(0);
      this.xSyndromes.fill(0);
      let idx = 0;
      for (let r = 0; r < d - 1 && idx < 12; r++) {
        for (let c = 0; c < d - 1 && idx < 12; c++) {
          const q0 = r * d + c;
          const q1 = r * d + c + 1;
          const q2 = (r + 1) * d + c;
          const q3 = (r + 1) * d + c + 1;
          this.zSyndromes[idx] =
            ((this.dataErrors[q0] & 1) ^
              (this.dataErrors[q1] & 1) ^
              (this.dataErrors[q2] & 1) ^
              (this.dataErrors[q3] & 1)) &
            1;
          this.xSyndromes[idx] =
            (((this.dataErrors[q0] >> 1) & 1) ^
              ((this.dataErrors[q1] >> 1) & 1) ^
              ((this.dataErrors[q2] >> 1) & 1) ^
              ((this.dataErrors[q3] >> 1) & 1)) &
            1;
          idx++;
        }
      }

      const maxCorrectable = Math.floor((d - 1) / 2);
      if (weightX > maxCorrectable) this.logicalErrors++;
      else this.correctedShots++;

      this.cycles++;
      this.ghzFidelity = Math.max(0.1, 1 - p * 4.2);
      return {
        pPhys: p,
        pLog: this.logicalErrorRatePerCycle(),
        fidelity: this.ghzFidelity,
      };
    }

    step() {
      return this.runCycle();
    }
  }

  // ============================================================================
  // 12. NEUTRAL-ATOM RYDBERG OPTICAL TWEEZER QUANTUM PROCESSOR (2023)
  // ============================================================================
  class NeutralAtomTweezerSim {
    constructor() {
      this.atomSpacingUm = 3.8; // micrometers (inside ~8 um Rydberg blockade radius!)
      this.rabiMHz = 4.2; // Omega / 2pi
      this.detuningMHz = 0.0;
      this.C6 = 862690; // 87Rb 70S_1/2 C6 coefficient (MHz * um^6)
      this.zone = "ENTANGLE"; // "STORAGE" | "ENTANGLE" | "READOUT"
      this.shuttlePhase = 0;
      // 2-atom basis: |gg>=0, |gr>=1, |rg>=2, |rr>=3
      this.pop = new Float64Array([1, 0, 0, 0]);
      this.timeUs = 0;
      this.evolveRydbergPulse(0.35);
    }

    blockadeShiftMHz() {
      return this.C6 / Math.pow(Math.max(1.8, this.atomSpacingUm), 6);
    }

    blockadeRadiusUm() {
      return Math.pow(this.C6 / Math.max(0.2, this.rabiMHz), 1 / 6);
    }

    // Collective sqrt(2)-enhanced Rydberg blockade pi-pulse duration (us): |gg> -> (|gr> + |rg>)/sqrt(2)
    piPulseUs() {
      return 1 / (2 * Math.SQRT2 * Math.max(0.2, this.rabiMHz));
    }

    // Exact Schrödinger integration of 2-atom Rydberg Blockade Hamiltonian!
    evolveRydbergPulse(durationUs = this.piPulseUs()) {
      const omega = this.rabiMHz * Math.PI * 2 * 0.5; // Omega/2
      const delta = this.detuningMHz * Math.PI * 2;
      const V = Math.min(250, this.blockadeShiftMHz()) * Math.PI * 2;
      const maxFreq = Math.max(omega * 4, Math.abs(V - 2 * delta), 20);
      const steps = Math.min(2400, Math.max(96, Math.ceil(maxFreq * durationUs * 3.5)));
      const dt = durationUs / steps;

      let re = [1, 0, 0, 0];
      let im = [0, 0, 0, 0];

      const deriv = (r, m) => {
        // H |psi>:
        // <gg|H = omega*(gr + rg)
        // <gr|H = omega*(gg + rr) - delta*gr
        // <rg|H = omega*(gg + rr) - delta*rg
        // <rr|H = omega*(gr + rg) + (V - 2*delta)*rr
        // d/dt (r + i m) = -i H (r + i m) => dr = H*m, dm = -H*r
        const Hr = [
          omega * (r[1] + r[2]),
          omega * (r[0] + r[3]) - delta * r[1],
          omega * (r[0] + r[3]) - delta * r[2],
          omega * (r[1] + r[2]) + (V - 2 * delta) * r[3],
        ];
        const Hm = [
          omega * (m[1] + m[2]),
          omega * (m[0] + m[3]) - delta * m[1],
          omega * (m[0] + m[3]) - delta * m[2],
          omega * (m[1] + m[2]) + (V - 2 * delta) * m[3],
        ];
        return { dr: Hm, dm: Hr.map((v) => -v) };
      };

      for (let s = 0; s < steps; s++) {
        const k1 = deriv(re, im);
        const r2 = re.map((v, i) => v + 0.5 * dt * k1.dr[i]);
        const m2 = im.map((v, i) => v + 0.5 * dt * k1.dm[i]);
        const k2 = deriv(r2, m2);
        const r3 = re.map((v, i) => v + 0.5 * dt * k2.dr[i]);
        const m3 = im.map((v, i) => v + 0.5 * dt * k2.dm[i]);
        const k3 = deriv(r3, m3);
        const r4 = re.map((v, i) => v + dt * k3.dr[i]);
        const m4 = im.map((v, i) => v + dt * k3.dm[i]);
        const k4 = deriv(r4, m4);
        for (let i = 0; i < 4; i++) {
          re[i] += (dt / 6) * (k1.dr[i] + 2 * k2.dr[i] + 2 * k3.dr[i] + k4.dr[i]);
          im[i] += (dt / 6) * (k1.dm[i] + 2 * k2.dm[i] + 2 * k3.dm[i] + k4.dm[i]);
        }
      }

      let norm = 0;
      for (let i = 0; i < 4; i++) {
        this.pop[i] = re[i] * re[i] + im[i] * im[i];
        norm += this.pop[i];
      }
      if (norm > 0) {
        for (let i = 0; i < 4; i++) this.pop[i] /= norm;
      }
      // Singlet/symmetric |W> = (|gr> + |rg>)/sqrt(2) entanglement probability & doubly-excited |rr> leakage!
      this.bellProb = this.pop[1] + this.pop[2];
      this.rrLeakage = this.pop[3];
      return { bellProb: this.bellProb, rrLeakage: this.rrLeakage };
    }

    step(dt = 0.016) {
      this.shuttlePhase = (this.shuttlePhase + dt * 0.85) % 3;
      this.zone =
        this.shuttlePhase < 1
          ? "STORAGE"
          : this.shuttlePhase < 2
            ? "ENTANGLE"
            : "READOUT";
      this.timeUs = 0.12 + 0.45 * Math.abs(Math.sin(this.shuttlePhase * Math.PI));
      return this.evolveRydbergPulse(this.timeUs);
    }
  }

  // ============================================================================
  // 13. MEASUREMENT-BASED PHOTONIC CLUSTER-STATE QUANTUM COMPUTER (2025)
  // ============================================================================
  class PhotonicMbqcSim {
    constructor() {
      // 4-node linear cluster state |G> teleporting an arbitrary single-qubit rotation Rz(gamma) Rx(beta) Rz(alpha) |+>
      this.angles = [0.65, 1.05, -0.45]; // adaptive measurement bases alpha, beta, gamma
      this.outcomes = [0, 0, 0];
      this.outputBloch = [1, 0, 0];
      this.shots = 0;
      this.squeezingDb = 11.8;
      this.runTeleportationShot();
    }

    // Exact 4-qubit cluster state |G> = CZ_23 CZ_12 CZ_01 |++++> + projective XY measurements + Pauli feedforward!
    runTeleportationShot(forcedOutcomes = null) {
      const re = new Float64Array(16).fill(0.25); // |++++> = (1/sqrt(16)) sum |x>
      const im = new Float64Array(16).fill(0);

      // Apply CZ on (0,1), (1,2), (2,3): flips sign when both adjacent bits are 1
      for (let mask = 0; mask < 16; mask++) {
        let neg = 0;
        if ((mask & 0b0011) === 0b0011) neg ^= 1;
        if ((mask & 0b0110) === 0b0110) neg ^= 1;
        if ((mask & 0b1100) === 0b1100) neg ^= 1;
        if (neg) re[mask] = -re[mask];
      }

      // Measure qubits 0, 1, 2 sequentially in XY-plane basis |+_phi> = (|0> + e^{i phi}|1>)/sqrt(2)
      // with Raussendorf-Briegel adaptive sign feedforward: phi'_k = (-1)^{s_{k-1}} * angles[k]
      const s = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        const sign = k === 0 ? 1 : s[k - 1] ? -1 : 1;
        const phi = sign * this.angles[k];
        const m = forcedOutcomes ? forcedOutcomes[k] & 1 : (this.shots + k) & 1; // deterministic cycle over all 8 byproduct branches!
        s[k] = m;

        // Project qubit k onto <m_phi| = (<0| + (-1)^m e^{-i phi} <1|) / sqrt(2)
        const c = Math.cos(-phi) * (m ? -1 : 1);
        const sn = Math.sin(-phi) * (m ? -1 : 1);
        const bit = 1 << k;
        for (let idx = 0; idx < 16; idx++) {
          if ((idx & bit) === 0) {
            const j = idx | bit;
            // amp = amp0 + e^{-i phi}*(-1)^m * amp1
            const nr = re[idx] + (c * re[j] - sn * im[j]);
            const ni = im[idx] + (c * im[j] + sn * re[j]);
            re[idx] = nr;
            im[idx] = ni;
            re[j] = 0;
            im[j] = 0;
          }
        }
      }

      // Surviving unmeasured amplitude lives on qubit 3 (indices 0 and 8)!
      let a0r = re[0],
        a0i = im[0];
      let a1r = re[8],
        a1i = im[8];
      const norm = Math.hypot(a0r, a0i, a1r, a1i) || 1;
      a0r /= norm;
      a0i /= norm;
      a1r /= norm;
      a1i /= norm;

      // Apply exact Pauli byproduct feedforward X^{s0 ^ s2} Z^{s1} on output photon 3!
      if (s[1]) {
        a1r = -a1r;
        a1i = -a1i;
      }
      if (s[0] ^ s[2]) {
        [a0r, a1r] = [a1r, a0r];
        [a0i, a1i] = [a1i, a0i];
      }

      // Bloch vector of corrected output photon (must be 100% invariant across all 8 measurement outcomes s!)
      const bx = 2 * (a0r * a1r + a0i * a1i);
      const by = 2 * (a0r * a1i - a0i * a1r);
      const bz = a0r * a0r + a0i * a0i - (a1r * a1r + a1i * a1i);
      this.outcomes = s;
      this.outputBloch = [bx, by, bz];
      this.shots++;
      return { outcomes: s, bloch: this.outputBloch };
    }

    step() {
      return this.runTeleportationShot();
    }
  }

  // ============================================================================
  // 14. TOPOLOGICAL MAJORANA ZERO-MODE BRAIDING PROCESSOR (2025+)
  // ============================================================================
  class TopologicalMajoranaSim {
    constructor() {
      this.L = 8; // 8-site Kitaev p-wave superconducting nanowire -> 16x16 BdG matrix
      this.mu = 0.45; // chemical potential (topological when |mu| < 2*t = 2.0!)
      this.tHop = 1.0;
      this.delta = 0.85;
      // Logical qubit in even-parity 4-Majorana subspace {|0_L>, |1_L>}
      this.qRe = [1, 0];
      this.qIm = [0, 0];
      this.braidWord = [];
      this.spectrum = [];
      this.computeKitaevSpectrum();
    }

    isTopologicalPhase() {
      return Math.abs(this.mu) < 2 * Math.abs(this.tHop);
    }

    // Exact Jacobi eigenvalue solver on the 2L x 2L Bogoliubov-de Gennes Kitaev Chain Hamiltonian!
    computeKitaevSpectrum() {
      const L = this.L;
      const dim = 2 * L;
      const H = new Float64Array(dim * dim);
      // Basis: [c_0..c_{L-1}, c†_0..c†_{L-1}]
      for (let j = 0; j < L; j++) {
        H[j * dim + j] = -this.mu * 0.5;
        H[(j + L) * dim + (j + L)] = this.mu * 0.5;
        if (j + 1 < L) {
          // Hopping -t
          H[j * dim + (j + 1)] = -this.tHop * 0.5;
          H[(j + 1) * dim + j] = -this.tHop * 0.5;
          H[(j + L) * dim + (j + 1 + L)] = this.tHop * 0.5;
          H[(j + 1 + L) * dim + (j + L)] = this.tHop * 0.5;
          // p-wave pairing Delta (antisymmetric!)
          H[j * dim + (j + 1 + L)] = this.delta * 0.5;
          H[(j + 1) * dim + (j + L)] = -this.delta * 0.5;
          H[(j + 1 + L) * dim + j] = this.delta * 0.5;
          H[(j + L) * dim + (j + 1)] = -this.delta * 0.5;
        }
      }

      // Classical Jacobi sweeps on symmetric real BdG matrix
      for (let sweep = 0; sweep < 28; sweep++) {
        for (let p = 0; p < dim; p++) {
          for (let q = p + 1; q < dim; q++) {
            const apq = H[p * dim + q];
            if (Math.abs(apq) < 1e-11) continue;
            const app = H[p * dim + p];
            const aqq = H[q * dim + q];
            const tau = (aqq - app) / (2 * apq);
            const t =
              tau >= 0
                ? 1 / (tau + Math.sqrt(1 + tau * tau))
                : -1 / (-tau + Math.sqrt(1 + tau * tau));
            const c = 1 / Math.sqrt(1 + t * t);
            const s = t * c;
            H[p * dim + p] = app - t * apq;
            H[q * dim + q] = aqq + t * apq;
            H[p * dim + q] = H[q * dim + p] = 0;
            for (let r = 0; r < dim; r++) {
              if (r === p || r === q) continue;
              const arp = H[r * dim + p];
              const arq = H[r * dim + q];
              H[r * dim + p] = H[p * dim + r] = c * arp - s * arq;
              H[r * dim + q] = H[q * dim + r] = s * arp + c * arq;
            }
          }
        }
      }
      const evals = [];
      for (let i = 0; i < dim; i++) evals.push(H[i * dim + i]);
      evals.sort((a, b) => a - b);
      this.spectrum = evals;
      // Lowest positive excitation energy (approaches 0 exponentially in topological phase!)
      this.zeroModeSplitting = Math.min(...evals.map((e) => Math.abs(e)));
      return evals;
    }

    // Exact non-Abelian Ising Anyon braid generators on 4 Majoranas (gamma_1..gamma_4):
    //   sigma_1 = exp(-i * pi/4 * Z) = diag(e^{-i pi/4}, e^{+i pi/4})
    //   sigma_2 = exp(-i * pi/4 * X) = (I - i X) / sqrt(2)
    // Notice sigma_1 * sigma_2 != sigma_2 * sigma_1 (genuine non-Abelian statistics!)
    braid(genIdx) {
      const inv = Math.SQRT1_2;
      const [r0, r1] = this.qRe;
      const [i0, i1] = this.qIm;
      if (genIdx === 1) {
        // multiply |0> by (1 - i)/sqrt(2), |1> by (1 + i)/sqrt(2)
        this.qRe = [(r0 + i0) * inv, (r1 - i1) * inv];
        this.qIm = [(i0 - r0) * inv, (i1 + r1) * inv];
        this.braidWord.push("σ₁");
      } else {
        // (I - i X)/sqrt(2): |0> -> (|0> - i|1>)/sqrt(2), |1> -> (-i|0> + |1>)/sqrt(2)
        this.qRe = [(r0 + i1) * inv, (r1 + i0) * inv];
        this.qIm = [(i0 - r1) * inv, (i1 - r0) * inv];
        this.braidWord.push("σ₂");
      }
      if (this.braidWord.length > 14) this.braidWord.shift();
      return this.bloch();
    }

    resetBraid() {
      this.qRe = [1, 0];
      this.qIm = [0, 0];
      this.braidWord = [];
    }

    bloch() {
      const [a0r, a1r] = this.qRe;
      const [a0i, a1i] = this.qIm;
      return [
        2 * (a0r * a1r + a0i * a1i),
        2 * (a0r * a1i - a0i * a1r),
        a0r * a0r + a0i * a0i - (a1r * a1r + a1i * a1i),
      ];
    }

    step() {
      this.braid(this.braidWord.length % 3 === 0 ? 1 : 2);
      return { splitting: this.zeroModeSplitting, bloch: this.bloch() };
    }
  }

  // ---- STO-3G minimal-basis H2: exact Gaussian integrals + 2x2 full CI (REVIEW-v5 B6) ----
  // Szabo & Ostlund, "Modern Quantum Chemistry" §3.5: H 1s STO-3G (zeta = 1.24).
  const H2_STO3G_ALPHA = [3.42525091, 0.62391373, 0.1688554];
  const H2_STO3G_COEF = [0.15432897, 0.53532814, 0.44463454];
  const BOHR_PER_ANGSTROM = 1 / 0.529177210903;

  function h2Erf(x) {
    // erf via its Taylor series (|x| < 3) or asymptotic complement; |error| < 1e-12 on [0, 6]
    if (x < 3) {
      let sum = x;
      let term = x;
      for (let n = 1; n < 80; n++) {
        term *= (-x * x) / n;
        const add = term / (2 * n + 1);
        sum += add;
        if (Math.abs(add) < 1e-17) break;
      }
      return (2 / Math.sqrt(Math.PI)) * sum;
    }
    // continued fraction for erfc
    let f = 0;
    for (let n = 60; n >= 1; n--) f = n / 2 / (x + f);
    return 1 - Math.exp(-x * x) / Math.sqrt(Math.PI) / (x + f);
  }
  function h2F0(t) {
    if (t < 1e-10) return 1 - t / 3;
    const st = Math.sqrt(t);
    return 0.5 * Math.sqrt(Math.PI / t) * h2Erf(st);
  }

  // Returns the 2-configuration CI energies (Hartree) at bond length R (Angstrom).
  function h2Sto3gEnergies(Rang) {
    const R = Rang * BOHR_PER_ANGSTROM;
    const centres = [0, R]; // nuclei on the z axis
    const prims = (c) =>
      H2_STO3G_ALPHA.map((a, k) => ({
        a,
        c: H2_STO3G_COEF[k] * Math.pow((2 * a) / Math.PI, 0.75),
        z: c,
      }));
    const basis = centres.map(prims);
    const S = [[0, 0], [0, 0]];
    const Hc = [[0, 0], [0, 0]];
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++)
        for (const p of basis[i])
          for (const q of basis[j]) {
            const g = p.a + q.a;
            const ab2 = (p.z - q.z) ** 2;
            const pre = Math.exp((-p.a * q.a * ab2) / g);
            const ovl = Math.pow(Math.PI / g, 1.5) * pre;
            const Pz = (p.a * p.z + q.a * q.z) / g;
            let v = 0;
            for (const C of centres) v += ((-2 * Math.PI) / g) * pre * h2F0(g * (Pz - C) ** 2);
            const kin = ((p.a * q.a) / g) * (3 - (2 * p.a * q.a * ab2) / g) * ovl;
            S[i][j] += p.c * q.c * ovl;
            Hc[i][j] += p.c * q.c * (kin + v);
          }
    const eri = (i, j, k, l) => {
      let s = 0;
      for (const p of basis[i])
        for (const q of basis[j])
          for (const r of basis[k])
            for (const t of basis[l]) {
              const g1 = p.a + q.a;
              const g2 = r.a + t.a;
              const P = (p.a * p.z + q.a * q.z) / g1;
              const Q = (r.a * r.z + t.a * t.z) / g2;
              const val =
                ((2 * Math.pow(Math.PI, 2.5)) / (g1 * g2 * Math.sqrt(g1 + g2))) *
                Math.exp((-p.a * q.a * (p.z - q.z) ** 2) / g1 - (r.a * t.a * (r.z - t.z) ** 2) / g2) *
                h2F0(((g1 * g2) / (g1 + g2)) * (P - Q) ** 2);
              s += p.c * q.c * r.c * t.c * val;
            }
      return s;
    };
    // symmetry-adapted MOs: g = (A+B)/sqrt(2(1+S)), u = (A-B)/sqrt(2(1-S))
    const s12 = S[0][1];
    const cg = [1 / Math.sqrt(2 * (1 + s12)), 1 / Math.sqrt(2 * (1 + s12))];
    const cu = [1 / Math.sqrt(2 * (1 - s12)), -1 / Math.sqrt(2 * (1 - s12))];
    const ao = [];
    for (let i = 0; i < 2; i++) {
      ao[i] = [];
      for (let j = 0; j < 2; j++) {
        ao[i][j] = [];
        for (let k = 0; k < 2; k++) {
          ao[i][j][k] = [];
          for (let l = 0; l < 2; l++) ao[i][j][k][l] = eri(i, j, k, l);
        }
      }
    }
    const h1 = (c1, c2) => {
      let s = 0;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) s += c1[i] * c2[j] * Hc[i][j];
      return s;
    };
    const g2e = (a, b, c, d) => {
      let s = 0;
      for (let i = 0; i < 2; i++)
        for (let j = 0; j < 2; j++)
          for (let k = 0; k < 2; k++)
            for (let l = 0; l < 2; l++) s += a[i] * b[j] * c[k] * d[l] * ao[i][j][k][l];
      return s;
    };
    const hgg = h1(cg, cg);
    const huu = h1(cu, cu);
    const Jgg = g2e(cg, cg, cg, cg);
    const Juu = g2e(cu, cu, cu, cu);
    const Kgu = g2e(cg, cu, cg, cu);
    const eNuc = 1 / R;
    const H00 = 2 * hgg + Jgg + eNuc; // |sigma_g^2> (Hartree-Fock)
    const H11 = 2 * huu + Juu + eNuc; // |sigma_u^2> (double excitation)
    const avg = 0.5 * (H00 + H11);
    const halfGap = 0.5 * (H11 - H00);
    const split = Math.sqrt(halfGap * halfGap + Kgu * Kgu);
    return { eGround: avg - split, eHF: H00, eExcited: avg + split, Kgu, halfGap };
  }

  // ============================================================================
  // 15. OMEGA-Q SINGULARITY HYPER-QUANTUM COMPUTER (2045+)
  //     Exact Shor QFT Factoring + Exact 256-State Grover + H2 Chemistry Solver
  // ============================================================================
  const SHOR_MAX_N = 255;
  function isPrimeInt(n) {
    if (n < 2) return false;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
    return true;
  }
  // iterative radix-2 Cooley-Tukey FFT (length must be a power of two)
  function fftInPlace(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        [re[i], re[j]] = [re[j], re[i]];
        [im[i], im[j]] = [im[j], im[i]];
      }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (2 * Math.PI) / len;
      const wr = Math.cos(ang);
      const wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1;
        let ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ur = re[i + k];
          const ui = im[i + k];
          const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
          const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ur + vr;
          im[i + k] = ui + vi;
          re[i + k + len / 2] = ur - vr;
          im[i + k + len / 2] = ui - vi;
          const t = cr * wr - ci * wi;
          ci = cr * wi + ci * wr;
          cr = t;
        }
      }
    }
  }
  function gcdInt(a, b) {
    a = Math.abs(a | 0);
    b = Math.abs(b | 0);
    while (b !== 0) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a;
  }

  function modPowInt(base, exp, mod) {
    let res = 1;
    let b = base % mod;
    let e = exp;
    while (e > 0) {
      if (e & 1) res = (res * b) % mod;
      b = (b * b) % mod;
      e >>= 1;
    }
    return res;
  }

  class OmegaSingularityCore {
    constructor() {
      this.mode = "shor"; // "shor" | "grover" | "chem"
      this.shorN = 15;
      this.shorA = 7;
      this.Q = 256; // period-register size; runShor resizes it to 2^ceil(log2 N^2)
      this.qftProbs = new Float64Array(256);
      this.groverTarget = 173;
      this.groverAmp = new Float64Array(256);
      this.groverIter = 0;
      this.h2Curve = [];
      this.codeDistance = 31; // Fault-tolerant logical protection distance
      this.runShor(15, 7);
      this.resetGrover(173);
      this.computeH2DissociationCurve();
    }

    // 1. EXACT SHOR'S QUANTUM FACTORING ALGORITHM (Modular Exp + Exact 256-pt QFT + Continued Fractions!)
    // Shor's algorithm, simulated exactly (REVIEW-v5 B7). The period register uses
    // Q = 2^ceil(log2 N^2) amplitudes (the textbook size that guarantees continued fractions
    // recover r), up to Q = 65536, so N is limited to 3..255. The QFT is an exact radix-2 FFT of
    // the post-measurement register; measurement outcomes are tried in descending probability
    // order, and a different base a is tried when the period is odd or gives trivial factors,
    // exactly as the classical post-processing of real Shor does.
    runShor(N = 15, coprimeA = 7) {
      N = Math.round(+N);
      if (!(N >= 3 && N <= SHOR_MAX_N)) {
        throw new RangeError(`Shor simulator supports 3 <= N <= ${SHOR_MAX_N} (got ${N})`);
      }
      this.shorN = N;
      const Q = 1 << Math.ceil(Math.log2(N * N));
      this.Q = Q;
      const note = (msg, p, q, a = 0, period = 0) => {
        this.shorResult = { N, a, period, factors: [Math.min(p, q), Math.max(p, q)], note: msg, Q };
        this.shorA = a;
        return this.shorResult;
      };
      if (N % 2 === 0) return note("even N: factor 2 found classically", 2, N / 2);
      if (isPrimeInt(N)) return note("N is prime: no non-trivial factors", 1, N);
      for (let b = 2; b * b <= N; b++) {
        let v = b * b;
        while (v < N) v *= b;
        if (v === N) return note("prime power: factored classically", b, N / b);
      }
      const bases = [coprimeA];
      for (let c = 2; c < N && bases.length < 24; c++) if (c !== coprimeA) bases.push(c);
      for (const a of bases) {
        if (a < 2 || a >= N) continue;
        const g = gcdInt(a, N);
        if (g !== 1) continue; // a lucky gcd would factor N classically; keep the quantum path
        const res = this._shorAttempt(N, a, Q);
        if (res) return note("quantum period finding", res[0], res[1], a, res[2]);
      }
      return note("no base produced a usable period", 1, N);
    }

    _shorAttempt(N, a, Q) {
      // |x>|a^x mod N>, measure the second register in the outcome f(0) = 1: keeps x = 0, r, 2r, ...
      const re = new Float64Array(Q);
      const im = new Float64Array(Q);
      let count = 0;
      for (let x = 0; x < Q; x++) {
        if (modPowInt(a, x, N) === 1) {
          re[x] = 1;
          count++;
        }
      }
      const norm = 1 / Math.sqrt(Math.max(1, count));
      for (let x = 0; x < Q; x++) re[x] *= norm;
      fftInPlace(re, im); // unnormalised DFT; QFT amplitude = DFT / sqrt(Q)
      const probs = new Float64Array(Q);
      for (let k = 0; k < Q; k++) probs[k] = (re[k] * re[k] + im[k] * im[k]) / Q;
      this.qftProbsFull = probs;
      // 256-bin max-pooled view for the visualiser
      this.qftProbs.fill(0);
      const bin = Q / 256;
      for (let k = 0; k < Q; k++) {
        const b = Math.min(255, Math.floor(k / Math.max(1, bin)));
        if (probs[k] > this.qftProbs[b]) this.qftProbs[b] = probs[k];
      }
      const order = Array.from(probs.keys())
        .filter((k) => k > 0 && probs[k] > 1e-6)
        .sort((x, y) => probs[y] - probs[x])
        .slice(0, 64);
      for (const k of order) {
        const r = this._continuedFractionOrder(k, Q, a, N);
        if (r > 0 && r % 2 === 0) {
          const half = modPowInt(a, r / 2, N);
          if (half === N - 1) return null; // a^(r/2) = -1 mod N: trivial, try another base
          const f = gcdInt(half - 1, N);
          if (f > 1 && f < N) return [f, N / f, r];
          const f2 = gcdInt(half + 1, N);
          if (f2 > 1 && f2 < N) return [f2, N / f2, r];
        } else if (r > 0) {
          return null; // odd period: try another base
        }
      }
      return null;
    }

    _continuedFractionOrder(k, Q, a, N) {
      let num = k;
      let den = Q;
      let pPrev = 0,
        pCur = 1;
      let qPrev = 1,
        qCur = 0;
      for (let iter = 0; iter < 40 && den !== 0; iter++) {
        const quot = Math.floor(num / den);
        const rem = num % den;
        const pNext = quot * pCur + pPrev;
        const qNext = quot * qCur + qPrev;
        if (qNext > 0 && qNext <= N) {
          for (const mult of [1, 2, 3, 4]) {
            const r = qNext * mult;
            if (r <= N && modPowInt(a, r, N) === 1) return r;
          }
        }
        pPrev = pCur;
        pCur = pNext;
        qPrev = qCur;
        qCur = qNext;
        num = den;
        den = rem;
      }
      return 0;
    }

    // 2. EXACT GROVER AMPLITUDE AMPLIFICATION OVER 256 LOGICAL BASIS STATES
    resetGrover(target = 173) {
      this.groverTarget = target & 255;
      this.groverAmp.fill(1 / 16); // 1/sqrt(256)
      this.groverIter = 0;
      this.groverTargetProb = 1 / 256;
    }

    stepGrover() {
      if (this.groverIter >= 12) {
        this.resetGrover((this.groverTarget + 53) & 255);
      }
      // Oracle phase flip: |w> -> -|w>
      this.groverAmp[this.groverTarget] = -this.groverAmp[this.groverTarget];
      // Grover diffusion: 2|s><s| - I -> a_i <- 2*mean - a_i
      let sum = 0;
      for (let i = 0; i < 256; i++) sum += this.groverAmp[i];
      const twoMean = (2 * sum) / 256;
      for (let i = 0; i < 256; i++) {
        this.groverAmp[i] = twoMean - this.groverAmp[i];
      }
      this.groverIter++;
      const amp = this.groverAmp[this.groverTarget];
      this.groverTargetProb = amp * amp;
      return { iter: this.groverIter, prob: this.groverTargetProb };
    }

    // 3. H2 POTENTIAL ENERGY CURVE: STO-3G minimal basis, exact Gaussian integrals, 2x2 full CI
    //    in the {|sigma_g^2>, |sigma_u^2>} space (equivalent to the 2-qubit Jordan-Wigner problem).
    //    No empirical correction factors. STO-3G FCI gives R_e ~ 0.735 A vs 0.741 A experiment;
    //    that ~0.006 A gap is the basis-set (method) error and is reported as such in the UI.
    computeH2DissociationCurve() {
      const points = [];
      for (let i = 0; i < 28; i++) {
        const R = +(0.35 + i * 0.08).toFixed(2); // Angstroms (0.35 .. 2.51 A)
        const e = h2Sto3gEnergies(R);
        points.push({ R, eGround: e.eGround, eHF: e.eHF, eExcited: e.eExcited });
      }
      // refine the minimum by golden-section search on the exact curve
      let a = 0.5;
      let b = 1.0;
      const g = (Math.sqrt(5) - 1) / 2;
      for (let k = 0; k < 60; k++) {
        const c = b - g * (b - a);
        const d = a + g * (b - a);
        if (h2Sto3gEnergies(c).eGround < h2Sto3gEnergies(d).eGround) b = d;
        else a = c;
      }
      const eqR = (a + b) / 2;
      this.h2Curve = points;
      this.h2EqAngstrom = +eqR.toFixed(4);
      this.h2MinEnergyHa = h2Sto3gEnergies(eqR).eGround;
      this.h2Method = "STO-3G full CI (2 electrons, 2 orbitals)";
      if (this.h2SelectedR === undefined) this.h2SelectedR = +eqR.toFixed(2);
      this.evalH2At(this.h2SelectedR);
      return points;
    }

    evalH2At(R = 0.75) {
      const clampedR = Math.max(0.35, Math.min(2.55, +R));
      this.h2SelectedR = +clampedR.toFixed(2);
      const e = h2Sto3gEnergies(this.h2SelectedR);
      const corrHa = e.eGround - e.eHF;
      const thetaUcc = -0.5 * Math.atan2(e.Kgu, e.halfGap);
      this.h2Probe = {
        R: this.h2SelectedR,
        eGround: e.eGround,
        eHF: e.eHF,
        eExcited: e.eExcited,
        corrHa,
        thetaUcc,
      };
      return this.h2Probe;
    }

    setGroverTarget(target = 173, runOptimal = false) {
      this.resetGrover(target & 255);
      if (runOptimal) {
        for (let i = 0; i < 12; i++) this.stepGrover();
      }
      return this.groverTarget;
    }

    logicalErrorRate() {
      // p_phys = 1e-4 inside topological-photonic cryo-cell, p_th = 1e-2 -> Lambda = 100
      const lambda = 100;
      return 0.01 * Math.pow(1 / lambda, (this.codeDistance + 1) / 2);
    }

    step() {
      return this.stepGrover();
    }
  }

  // ============================================================================
  // 16. MIT APOLLO GUIDANCE COMPUTER BLOCK II & DSKY (1966)
  //     15-bit 1's-Complement RTL NOR CPU + Core Rope ROM + 1202 Executive Recovery
  //     CONCEPTUAL MODEL (review P8): a 7-word rope with 4 opcodes; the 1202 is
  //     produced by filling the 8-slot job queue. Not a Block II ISA emulator.
  // ============================================================================
  class ApolloAgcDsky {
    constructor() {
      // 15-bit 1's-complement registers: A (accumulator), L (lower), Q (return), Z (PC)
      this.A = 0;
      this.L = 0;
      this.Q = 0o4012;
      this.Z = 0o4000;
      this.erasable = new Uint16Array(2048);
      this.fixedBank = new Uint16Array(1024);
      this.prog = 64; // Major Mode P64 (Lunar Module Approach Phase)
      this.verb = 16; // Monitor decimal
      this.noun = 68; // Landing radar range / time / velocity
      this.r1 = "+01420"; // Slant range (0.01 NM) / Altitude ft
      this.r2 = "-00046"; // Altitude rate (-46.0 fps)
      this.r3 = "+00118"; // Forward velocity (118.0 fps)
      this.compActy = true;
      this.progAlarm = false;
      this.keyRel = false;
      this.oprErr = false;
      this.tempLit = false;
      this.alarmCode = 0;
      this.alarmCount = 0;
      this.bailoutRecoveries = 0;
      this.radarBuzz = false; // Rendezvous radar SLEW cycle-steal flood!
      this.altitudeFt = 2450;
      this.vertVelFps = -44.0;
      this.horizVelFps = 68.0;
      this.throttlePct = 56;
      this.cycle = 0;
      // Margaret Hamilton's 8-slot Priority-Scheduled Core Set Executive Queue
      this.coreSet = [
        { name: "SERVICER (IMU+Accel)", prio: 30, bank: 0o32 },
        { name: "P64 GUIDANCE+THROTTLE", prio: 28, bank: 0o33 },
        { name: "DAPRCS ATTITUDE JET", prio: 26, bank: 0o24 },
        { name: "DSKYN68 DISPLAY MON", prio: 14, bank: 0o15 },
      ];
      this._initRopeRom();
      this._refreshDskyRegisters();
    }

    _onesAdd15(x, y) {
      const a = x & 0x7fff;
      const b = y & 0x7fff;
      let s = a + b;
      if (s > 0x7fff) s = (s & 0x7fff) + 1; // 1's-complement end-around carry!
      return s & 0x7fff;
    }

    _fmtSigned5(val) {
      const v = Math.round(val);
      const sign = v < 0 ? "-" : "+";
      const mag = Math.min(99999, Math.abs(v));
      return sign + String(mag).padStart(5, "0");
    }

    _initRopeRom() {
      // Populate fixed-memory core-rope words (3-bit opcode + 12-bit address)
      // 3=CA (Clear & Add), 6=AD (1's-complement Add), 5=TS (Transfer to Storage), 0=TC (Transfer Control)
      const progWords = [
        (3 << 12) | 0o010, // CA E010 (altitude)
        (6 << 12) | 0o011, // AD E011 (delta-h)
        (5 << 12) | 0o010, // TS E010
        (3 << 12) | 0o012, // CA E012 (throttle cmd)
        (6 << 12) | 0o013, // AD E013 (PID trim)
        (5 << 12) | 0o012, // TS E012
        (0 << 12) | 0o000, // TC 4000 (loop)
      ];
      for (let i = 0; i < progWords.length; i++) this.fixedBank[i] = progWords[i];
      this.erasable[0o010] = 2450;
      this.erasable[0o011] = 0x7fff ^ 3; // -3 in 15-bit 1's complement!
      this.erasable[0o012] = 560;
      this.erasable[0o013] = 2;
    }

    triggerRadarOverload(enable = true) {
      this.radarBuzz = !!enable;
      if (this.radarBuzz) {
        // Flood Core Set with low-priority Rendezvous Radar jobs until 8/8 overflow!
        while (this.coreSet.length < 8) {
          this.coreSet.push({
            name: `RR SLEW DUPLICATE #${this.coreSet.length}`,
            prio: 9,
            bank: 0o21,
          });
        }
        this._handleExecutiveJobRequest({ name: "RR LGC SLEW IRQ", prio: 9, bank: 0o21 });
      } else {
        this.progAlarm = false;
        this.coreSet = this.coreSet.filter((j) => j.prio >= 12);
      }
      this._refreshDskyRegisters();
    }

    _handleExecutiveJobRequest(job) {
      if (this.coreSet.length >= 8) {
        // Famous 1202 Executive Overflow! Bailout sheds low-priority tasks & preserves P64 guidance!
        this.progAlarm = true;
        this.alarmCode = 0o1202; // octal 1202!
        this.alarmCount++;
        this.bailoutRecoveries++;
        this.coreSet = this.coreSet
          .filter((j) => j.prio >= 20)
          .sort((a, b) => b.prio - a.prio);
        this.coreSet.push({ name: "DSKYN68 DISPLAY MON", prio: 14, bank: 0o15 });
        return { alarm: 0o1202, shedLowPrio: true };
      }
      this.coreSet.push(job);
      this.coreSet.sort((a, b) => b.prio - a.prio);
      return { alarm: 0, shedLowPrio: false };
    }

    clearAlarm() {
      this.progAlarm = false;
      this.oprErr = false;
      this.keyRel = false;
      this._refreshDskyRegisters();
    }

    enterVerbNoun(verb, noun) {
      const v = Number(verb);
      const n = Number(noun);
      if (isNaN(v) || isNaN(n) || v < 0 || v > 99 || n < 0 || n > 99) {
        this.oprErr = true;
        return false;
      }
      this.oprErr = false;
      if (v === 37) {
        // V37E xxE = Major Mode change (P63 Braking, P64 Approach, P66 Manual ROD, P00 Idle)
        if ([0, 63, 64, 66].includes(n)) {
          this.prog = n;
          if (n === 63 && this.altitudeFt < 800) {
            this.altitudeFt = 6400;
            this.vertVelFps = -92;
            this.horizVelFps = 185;
          } else if (n === 64 && this.altitudeFt < 120) {
            this.altitudeFt = 2200;
            this.vertVelFps = -42;
            this.horizVelFps = 64;
          }
          this.verb = 16;
          this.noun = 68;
        } else {
          this.oprErr = true;
        }
      } else {
        this.verb = v;
        this.noun = n;
      }
      this._refreshDskyRegisters();
      return !this.oprErr;
    }

    _refreshDskyRegisters() {
      if (this.verb === 35) {
        // V35E Lamp Test!
        this.r1 = "+88888";
        this.r2 = "+88888";
        this.r3 = "+88888";
        return;
      }
      if (this.verb === 9 || (this.verb === 5 && this.noun === 9)) {
        // Alarm code octal display (01202)
        const octStr = this.alarmCode
          ? this.alarmCode.toString(8).padStart(5, "0")
          : "00000";
        this.r1 = "+" + octStr;
        this.r2 = "+" + String(this.alarmCount).padStart(5, "0");
        this.r3 = "+" + String(this.bailoutRecoveries).padStart(5, "0");
        return;
      }
      if (this.noun === 62) {
        const vTot = Math.hypot(this.vertVelFps, this.horizVelFps);
        this.r1 = this._fmtSigned5(vTot * 10);
        this.r2 = this._fmtSigned5(this.vertVelFps * 10);
        this.r3 = this._fmtSigned5(this.throttlePct * 10);
        return;
      }
      if (this.noun === 43) {
        // Lat / Lon / Alt (Sea of Tranquility 0.674° N, 23.473° E)
        this.r1 = "+00067";
        this.r2 = "+02347";
        this.r3 = this._fmtSigned5(this.altitudeFt);
        return;
      }
      // Default N68: Landing radar altitude (ft), vertical velocity (0.1 fps), horizontal velocity (0.1 fps)
      this.r1 = this._fmtSigned5(this.altitudeFt);
      this.r2 = this._fmtSigned5(this.vertVelFps * 10);
      this.r3 = this._fmtSigned5(this.horizVelFps * 10);
    }

    step() {
      this.cycle++;
      // Execute 15-bit 1's-complement AGC instruction from Fixed Core Rope ROM!
      const pcIdx = (this.Z - 0o4000) & 0x3ff;
      const inst = this.fixedBank[pcIdx % 7];
      const op = (inst >>> 12) & 0x7;
      const addr = inst & 0x7ff;
      if (op === 3) {
        this.A = this.erasable[addr] & 0x7fff;
        this.Z++;
      } else if (op === 6) {
        this.A = this._onesAdd15(this.A, this.erasable[addr]);
        this.Z++;
      } else if (op === 5) {
        this.erasable[addr] = this.A & 0x7fff;
        this.Z++;
      } else {
        this.Z = 0o4000 + (addr & 0x3ff);
      }

      // If Rendezvous Radar SLEW buzz is active, periodically inject low-prio steal jobs -> 1202 recovery!
      if (this.radarBuzz && this.cycle % 3 === 0) {
        this._handleExecutiveJobRequest({
          name: `RR SLEW IRQ #${this.cycle % 9}`,
          prio: 9,
          bank: 0o21,
        });
      }

      // Real-time Lunar Descent guidance control loop (P63/P64/P66) — NEVER dropped during 1202!
      if (this.prog !== 0) {
        if (this.altitudeFt > 0) {
          const targetRate = -Math.max(2.5, Math.min(85, this.altitudeFt * 0.018 + 2.2));
          const err = targetRate - this.vertVelFps;
          this.throttlePct = Math.round(Math.max(12, Math.min(94, 52 + err * 2.4)));
          const lunarGrav = -5.32; // ft/s^2
          const thrustAcc = (this.throttlePct / 52) * 5.38;
          const dt = 0.25;
          this.vertVelFps = Math.max(
            -110,
            Math.min(-1.5, this.vertVelFps + (lunarGrav + thrustAcc) * dt),
          );
          this.horizVelFps = Math.max(0, this.horizVelFps * 0.985);
          this.altitudeFt = Math.max(0, this.altitudeFt + this.vertVelFps * dt);
        } else {
          // Tranquility Base touchdown — recycle approach profile for continuous live demo
          this.altitudeFt = 2450;
          this.vertVelFps = -44;
          this.horizVelFps = 68;
        }
      } else {
        this.throttlePct = 0;
      }

      this.compActy = this.cycle % 4 !== 0;
      this._refreshDskyRegisters();
      return {
        zOctal: this.Z.toString(8),
        aOctal: this.A.toString(8).padStart(5, "0"),
        alarm: this.alarmCode,
        alt: this.altitudeFt,
      };
    }
  }

  // ============================================================================
  // 17. XEROX PARC ALTO WORKSTATION (1973)
  //     Real 16-Op BitBLT Rasterop Engine + Smalltalk Stack VM + 3 Mbps CSMA/CD
  // ============================================================================
  class XeroxAltoSystem {
    constructor() {
      this.fbW = 160;
      this.fbH = 128; // High-DPI 1-bit portrait CRT window buffer (black ink on white paper!)
      this.vram = new Uint8Array(this.fbW * this.fbH); // 1 = dark ink pixel, 0 = white phosphor paper
      this.rasterOp = "XOR"; // "SRC" | "OR" | "XOR" | "AND" | "INVERT"
      this.bitbltOps = 0;
      this.mouseX = 86;
      this.mouseY = 62;
      // Overlapping GUI Windows (Alan Kay / Dan Ingalls Smalltalk-76 desktop!)
      this.windows = [
        { title: "SystemBrowser", x: 8, y: 10, w: 94, h: 62, z: 1 },
        { title: "BitBLT Canvas", x: 52, y: 46, w: 98, h: 68, z: 2 },
      ];
      // Smalltalk-76 Bytecode Stack Machine
      this.stStack = [];
      this.stPc = 0;
      this.stBytecodes = [
        { op: "PUSH_RCVR", arg: "box", hex: 0x70 },
        { op: "PUSH_CONST", arg: 12, hex: 0x21 },
        { op: "PUSH_CONST", arg: 8, hex: 0x22 },
        { op: "SEND_MSG", arg: "area:", hex: 0xb2 },
        { op: "SEND_MSG", arg: "bitbltXor", hex: 0xd4 },
        { op: "RETURN_TOP", arg: null, hex: 0x7c },
      ];
      this.lastResult = 96;
      // 3 Mbps Experimental Ethernet (CSMA/CD + Truncated Binary Exponential Backoff!)
      this.ethPackets = 0;
      this.ethCollisions = 0;
      this.backoffAttempt = 0;
      this.backoffSlots = 0;
      this.composeDesktop();
    }

    // Genuine Dan Ingalls Bit-Boundary Block Transfer (BitBLT) 2D Boolean RasterOp!
    bitblt(srcBits, sw, sh, dx, dy, w, h, mode = this.rasterOp) {
      let touched = 0;
      for (let r = 0; r < h; r++) {
        const py = dy + r;
        if (py < 0 || py >= this.fbH) continue;
        for (let c = 0; c < w; c++) {
          const px = dx + c;
          if (px < 0 || px >= this.fbW) continue;
          const sBit = srcBits
            ? srcBits[(r % sh) * sw + (c % sw)] & 1
            : ((r >> 2) ^ (c >> 2)) & 1;
          const idx = py * this.fbW + px;
          const dBit = this.vram[idx] & 1;
          let out = dBit;
          if (mode === "SRC") out = sBit;
          else if (mode === "OR") out = sBit | dBit;
          else if (mode === "XOR") out = sBit ^ dBit;
          else if (mode === "AND") out = sBit & dBit;
          else if (mode === "INVERT") out = dBit ^ 1;
          else if (mode === "CLEAR") out = 0;
          else if (mode === "SET") out = 1;
          this.vram[idx] = out;
          touched++;
        }
      }
      this.bitbltOps++;
      return touched;
    }

    composeDesktop() {
      // Classic Alto 50% halftone stipple desktop background via BitBLT!
      for (let y = 0; y < this.fbH; y++) {
        for (let x = 0; x < this.fbW; x++) {
          this.vram[y * this.fbW + x] = (x + y) % 2 === 0 && y % 4 === 0 ? 1 : 0;
        }
      }
      // Top menu bar
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < this.fbW; x++) this.vram[y * this.fbW + x] = y === 6 ? 1 : 0;
      }

      const sorted = [...this.windows].sort((a, b) => a.z - b.z);
      for (const win of sorted) {
        // Drop shadow + white window interior + 1px black frame + inverted title bar
        this.bitblt(null, 1, 1, win.x + 2, win.y + 2, win.w, win.h, "SET");
        this.bitblt(null, 1, 1, win.x, win.y, win.w, win.h, "CLEAR");
        for (let x = win.x; x < win.x + win.w; x++) {
          if (x >= 0 && x < this.fbW) {
            this.vram[win.y * this.fbW + x] = 1;
            this.vram[(win.y + win.h - 1) * this.fbW + x] = 1;
          }
        }
        for (let y = win.y; y < win.y + win.h; y++) {
          if (y >= 0 && y < this.fbH) {
            this.vram[y * this.fbW + win.x] = 1;
            this.vram[y * this.fbW + (win.x + win.w - 1)] = 1;
          }
        }
        this.bitblt(null, 1, 1, win.x + 1, win.y + 1, win.w - 2, 9, "SET");
      }

      // Stamp active rasterOp pattern inside top window!
      const topWin = sorted[sorted.length - 1];
      const pat = new Uint8Array(64);
      for (let i = 0; i < 64; i++) {
        const rx = (i % 8) - 3.5;
        const ry = Math.floor(i / 8) - 3.5;
        pat[i] = rx * rx + ry * ry <= 11 ? 1 : 0;
      }
      this.bitblt(
        pat,
        8,
        8,
        topWin.x + 10,
        topWin.y + 16,
        topWin.w - 20,
        topWin.h - 24,
        this.rasterOp,
      );

      // XOR cursor arrow at (mouseX, mouseY) — how Alto drew flicker-free cursors without hardware sprites!
      const cur = [
        [1, 0, 0, 0, 0],
        [1, 1, 0, 0, 0],
        [1, 1, 1, 0, 0],
        [1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 0, 0],
        [1, 0, 1, 1, 0],
      ];
      const flatCur = new Uint8Array(35);
      cur.forEach((row, r) => row.forEach((b, c) => (flatCur[r * 5 + c] = b)));
      this.bitblt(flatCur, 5, 7, this.mouseX, this.mouseY, 5, 7, "XOR");
    }

    bringWindowFront(idx = 0) {
      const target = this.windows[idx % this.windows.length];
      const maxZ = Math.max(...this.windows.map((w) => w.z));
      target.z = maxZ + 1;
      this.composeDesktop();
    }

    stepSmalltalkBytecode() {
      const bc = this.stBytecodes[this.stPc % this.stBytecodes.length];
      if (bc.op === "PUSH_RCVR") this.stStack = ["BitRect"];
      else if (bc.op === "PUSH_CONST") this.stStack.push(bc.arg);
      else if (bc.op === "SEND_MSG" && bc.arg === "area:") {
        const h = this.stStack.pop() || 8;
        const w = this.stStack.pop() || 12;
        this.lastResult = w * h;
        this.stStack.push(this.lastResult);
      } else if (bc.op === "SEND_MSG" && bc.arg === "bitbltXor") {
        this.mouseX = 48 + ((this.mouseX + 11) % 82);
        this.mouseY = 34 + ((this.mouseY + 7) % 64);
        this.composeDesktop();
      } else if (bc.op === "RETURN_TOP") {
        this.lastResult = this.stStack[this.stStack.length - 1] ?? this.lastResult;
      }
      this.stPc = (this.stPc + 1) % this.stBytecodes.length;
      return bc;
    }

    // 3 Mbps Experimental Ethernet CSMA/CD with Truncated Binary Exponential Backoff
    transmitEthernetFrame(forceCollision = false) {
      const busyContention =
        forceCollision || (this.ethPackets + this.ethCollisions) % 5 === 3;
      if (busyContention) {
        this.ethCollisions++;
        this.backoffAttempt = Math.min(10, this.backoffAttempt + 1);
        const maxSlots = 1 << this.backoffAttempt; // 2^k slot times (51.2 us nominal)
        // Deterministic pseudo-random backoff slot in [1, maxSlots - 1]
        this.backoffSlots =
          1 + ((this.ethCollisions * 7 + 3) % Math.max(1, maxSlots - 1));
        return {
          ok: false,
          collision: true,
          attempt: this.backoffAttempt,
          backoffSlots: this.backoffSlots,
        };
      }
      this.ethPackets++;
      this.backoffAttempt = 0;
      this.backoffSlots = 0;
      return { ok: true, collision: false, attempt: 0, backoffSlots: 0 };
    }

    step() {
      const bc = this.stepSmalltalkBytecode();
      const eth = this.transmitEthernetFrame(false);
      return { bc, eth, bitbltOps: this.bitbltOps };
    }
  }

  // ============================================================================
  // 18. MOBILE ARM RISC SoC & MULTI-TOUCH POCKET COMPUTER (2007+)
  //     big.LITTLE OoO/In-Order Scheduler + CMOS DVFS (C*V^2*f) + TBDR GPU + Touch
  // ============================================================================
  class MobileArmSoc {
    constructor() {
      this.governor = "schedutil"; // "powersave" | "schedutil" | "performance"
      this.workload = 0.58; // 0..1 UI + physics + neural camera load
      this.tbdrEnabled = true; // Tile-Based Deferred Rendering vs Immediate-Mode DRAM!
      // 2x Performance Out-of-Order ARM cores + 4x Efficiency In-Order ARM cores
      this.bigFreqGHz = 2.4;
      this.bigVolt = 0.92;
      this.litFreqGHz = 1.2;
      this.litVolt = 0.64;
      this.activeBig = 1;
      this.activeLit = 4;
      this.dieTempC = 36.5;
      this.batteryPct = 88.0;
      // 12 x 8 Mutual-Capacitance Multi-Touch Grid (Delta-C femtofarads)
      this.touchCols = 12;
      this.touchRows = 8;
      this.touchGrid = new Float32Array(12 * 8);
      this.fingers = [
        { x: 3.4, y: 3.8, active: true },
        { x: 8.2, y: 4.4, active: true },
      ];
      this.pinchZoom = 1.0;
      this.recomputeSoCTelemetry();
      this.scanCapacitiveTouch();
    }

    setGovernor(mode) {
      this.governor = mode;
      this.recomputeSoCTelemetry();
    }

    // Exact CMOS Dynamic + Subthreshold Leakage Power & Energy-Per-Instruction!
    recomputeSoCTelemetry() {
      const w = Math.max(0.05, Math.min(1.0, this.workload));
      if (this.governor === "powersave") {
        this.activeBig = 0;
        this.activeLit = Math.max(1, Math.ceil(w * 4));
        this.bigFreqGHz = 0.8;
        this.bigVolt = 0.65;
        this.litFreqGHz = +(0.6 + 0.8 * w).toFixed(2);
        this.litVolt = +(0.56 + 0.12 * w).toFixed(3);
      } else if (this.governor === "performance") {
        this.activeBig = 2;
        this.activeLit = 4;
        this.bigFreqGHz = 3.2;
        this.bigVolt = 1.08;
        this.litFreqGHz = 2.0;
        this.litVolt = 0.78;
      } else {
        // Heterogeneous big.LITTLE schedutil energy-aware placement!
        this.activeBig = w > 0.72 ? 2 : w > 0.38 ? 1 : 0;
        this.activeLit = 4;
        this.bigFreqGHz = this.activeBig ? +(1.4 + 1.7 * w).toFixed(2) : 0.0;
        this.bigVolt = this.activeBig ? +(0.72 + 0.32 * w).toFixed(3) : 0.55;
        this.litFreqGHz = +(0.75 + 1.1 * w).toFixed(2);
        this.litVolt = +(0.58 + 0.16 * w).toFixed(3);
      }

      // P_dyn = N * C_eff * V^2 * f (Watts)
      const cBig = 0.95; // nF effective switched capacitance per wide OoO core
      const cLit = 0.22; // nF effective switched capacitance per narrow in-order core
      const pBigDynW =
        this.activeBig * cBig * this.bigVolt * this.bigVolt * this.bigFreqGHz;
      const pLitDynW =
        this.activeLit * cLit * this.litVolt * this.litVolt * this.litFreqGHz;

      // Subthreshold leakage doubles roughly every ~25 C
      const leakThermal = Math.exp((this.dieTempC - 30) / 34);
      const pLeakW = (0.045 + 0.06 * this.activeBig * this.bigVolt) * leakThermal;

      // Tile-Based Deferred Rendering (TBDR) keeps depth/color in 32x32 on-chip SRAM tiles!
      // Immediate-Mode desktop GPUs read/write external LPDDR5X on every overdrawn fragment (~3.8x DRAM power!)
      const overdraw = 3.2;
      this.dramBwGBs = this.tbdrEnabled
        ? +(4.8 * (0.4 + 0.6 * w)).toFixed(2)
        : +(4.8 * overdraw * (0.4 + 0.6 * w)).toFixed(2);
      const pGpuMemW = this.dramBwGBs * 0.055 + 0.28 * w;

      this.totalPowerW = +(pBigDynW + pLitDynW + pLeakW + pGpuMemW).toFixed(3);
      // Throughput in Billion Instructions Per Second (BIPS): OoO IPC=2.9, LITTLE IPC=1.25
      this.bips = +(
        this.activeBig * this.bigFreqGHz * 2.9 +
        this.activeLit * this.litFreqGHz * 1.25
      ).toFixed(2);
      // Energy efficiency: picojoules per instruction (pJ / inst) = (W / BIPS) * 1000
      this.pjPerInst = +((this.totalPowerW / Math.max(0.1, this.bips)) * 1000).toFixed(1);
      return {
        powerW: this.totalPowerW,
        bips: this.bips,
        pjPerInst: this.pjPerInst,
        dramBwGBs: this.dramBwGBs,
      };
    }

    scanCapacitiveTouch() {
      this.touchGrid.fill(0);
      for (const f of this.fingers) {
        if (!f.active) continue;
        for (let r = 0; r < this.touchRows; r++) {
          for (let c = 0; c < this.touchCols; c++) {
            const d2 = (c - f.x) * (c - f.x) + (r - f.y) * (r - f.y);
            this.touchGrid[r * this.touchCols + c] += Math.exp(-d2 / 1.65);
          }
        }
      }
      const dx = this.fingers[1].x - this.fingers[0].x;
      const dy = this.fingers[1].y - this.fingers[0].y;
      this.pinchZoom = +(Math.hypot(dx, dy) / 4.8).toFixed(2);
      return this.pinchZoom;
    }

    setPinchSpread(spread = 4.8) {
      const half = Math.max(1.0, Math.min(5.2, spread * 0.5));
      this.fingers[0].x = 5.5 - half;
      this.fingers[1].x = 5.5 + half;
      return this.scanCapacitiveTouch();
    }

    step(dt = 0.016) {
      const targetTemp = 29 + this.totalPowerW * 3.8;
      this.dieTempC += (targetTemp - this.dieTempC) * Math.min(1, dt * 1.5);
      // Subtle animated multi-touch pinch breathing
      const t = (this._ph = (this._ph || 0) + dt * 1.6);
      this.fingers[0].y = 3.5 + Math.sin(t) * 0.8;
      this.fingers[1].y = 3.5 - Math.sin(t) * 0.8;
      this.scanCapacitiveTouch();
      this.recomputeSoCTelemetry();
      return { powerW: this.totalPowerW, bips: this.bips, pj: this.pjPerInst };
    }
  }

  // ============================================================================
  // 19. DEC VAX-11/780 VIRTUAL MEMORY & 4.2BSD TCP/IP SERVER (1978)
  //     32-bit P0/P1/S0 Demand Paging + TLB + FIFO/Clock/LRU (Belady's Anomaly!)
  // ============================================================================
  class VaxVirtualMemorySystem {
    constructor() {
      this.policy = "CLOCK"; // "FIFO" | "CLOCK" | "LRU"
      this.numFrames = 3; // 3 or 4 physical frames (famous Belady's Anomaly pair!)
      // Canonical Belady's Anomaly virtual page reference trace:
      // FIFO faults = 9 on 3 frames, 10 on 4 frames! LRU faults = 10 on 3 frames, 8 on 4 frames!
      this.beladyTrace = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
      this.traceIdx = 0;
      this.tlbSize = 4;
      this.resetVm();
      // 4.2BSD UNIX TCP/IP Reno/Tahoe Congestion Control (SYN -> Slow Start -> AIMD!)
      this.tcpState = "ESTABLISHED";
      this.cwnd = 4;
      this.ssthresh = 16;
      this.rttMs = 28;
      this.tcpSeq = 1024;
      this.tcpLosses = 0;
      this.cwndHistory = [1, 2, 4];
    }

    resetVm() {
      this.frames = []; // { vpn, useBit, lastUsed, loadOrder }
      this.tlb = []; // { vpn, pfn }
      this.clockHand = 0;
      this.accessCount = 0;
      this.pageFaults = 0;
      this.tlbHits = 0;
      this.lastAccess = null;
    }

    // Access a 32-bit VAX virtual address (bits 31..30 = region P0/P1/S0, 512-byte pages => 9-bit offset!)
    accessVirtualPage(vpn, region = 0) {
      this.accessCount++;
      const vaddr = ((region & 3) << 30) | ((vpn & 0x1fffff) << 9) | 0x0a4;

      // 1. Probe Associative Translation Buffer (TB / TLB)
      const tlbEntry = this.tlb.find((e) => e.vpn === vpn);
      if (tlbEntry) {
        this.tlbHits++;
        const fr = this.frames[tlbEntry.pfn];
        if (fr) {
          fr.useBit = 1;
          fr.lastUsed = this.accessCount;
        }
        this.lastAccess = {
          vaddr: vaddr >>> 0,
          vpn,
          pfn: tlbEntry.pfn,
          tlbHit: true,
          pageFault: false,
          evicted: null,
        };
        return this.lastAccess;
      }

      // 2. Hardware 2-Level Page Table Walk (P0BR / P0LR in System Space S0)
      const pfnExisting = this.frames.findIndex((f) => f && f.vpn === vpn);
      if (pfnExisting >= 0) {
        const fr = this.frames[pfnExisting];
        fr.useBit = 1;
        fr.lastUsed = this.accessCount;
        this._insertTlb(vpn, pfnExisting);
        this.lastAccess = {
          vaddr: vaddr >>> 0,
          vpn,
          pfn: pfnExisting,
          tlbHit: false,
          pageFault: false,
          evicted: null,
        };
        return this.lastAccess;
      }

      // 3. Demand-Paging Fault! Select free frame or victim via FIFO / CLOCK / LRU
      this.pageFaults++;
      let targetPfn = -1;
      let evictedVpn = null;

      if (this.frames.length < this.numFrames) {
        targetPfn = this.frames.length;
        this.frames.push({
          vpn,
          useBit: 1,
          lastUsed: this.accessCount,
          loadOrder: this.accessCount,
        });
      } else if (this.policy === "FIFO") {
        let oldestIdx = 0;
        for (let i = 1; i < this.frames.length; i++) {
          if (this.frames[i].loadOrder < this.frames[oldestIdx].loadOrder) oldestIdx = i;
        }
        targetPfn = oldestIdx;
        evictedVpn = this.frames[targetPfn].vpn;
        this.frames[targetPfn] = {
          vpn,
          useBit: 1,
          lastUsed: this.accessCount,
          loadOrder: this.accessCount,
        };
      } else if (this.policy === "LRU") {
        let lruIdx = 0;
        for (let i = 1; i < this.frames.length; i++) {
          if (this.frames[i].lastUsed < this.frames[lruIdx].lastUsed) lruIdx = i;
        }
        targetPfn = lruIdx;
        evictedVpn = this.frames[targetPfn].vpn;
        this.frames[targetPfn] = {
          vpn,
          useBit: 1,
          lastUsed: this.accessCount,
          loadOrder: this.accessCount,
        };
      } else {
        // VAX/BSD Second-Chance CLOCK replacement!
        for (let guard = 0; guard <= this.frames.length * 2; guard++) {
          const idx = this.clockHand % this.frames.length;
          this.clockHand = (this.clockHand + 1) % this.frames.length;
          if (this.frames[idx].useBit === 0) {
            targetPfn = idx;
            break;
          }
          this.frames[idx].useBit = 0;
        }
        if (targetPfn < 0) targetPfn = 0;
        evictedVpn = this.frames[targetPfn].vpn;
        this.frames[targetPfn] = {
          vpn,
          useBit: 1,
          lastUsed: this.accessCount,
          loadOrder: this.accessCount,
        };
      }

      if (evictedVpn !== null) {
        this.tlb = this.tlb.filter((e) => e.vpn !== evictedVpn);
      }
      this._insertTlb(vpn, targetPfn);
      this.lastAccess = {
        vaddr: vaddr >>> 0,
        vpn,
        pfn: targetPfn,
        tlbHit: false,
        pageFault: true,
        evicted: evictedVpn,
      };
      return this.lastAccess;
    }

    _insertTlb(vpn, pfn) {
      this.tlb = this.tlb.filter((e) => e.vpn !== vpn);
      this.tlb.push({ vpn, pfn });
      if (this.tlb.length > this.tlbSize) this.tlb.shift();
    }

    // Run full Belady trace cleanly for quantitative comparison!
    runBeladyBenchmark(policy = this.policy, frames = this.numFrames) {
      const savedPol = this.policy;
      const savedFr = this.numFrames;
      this.policy = policy;
      this.numFrames = frames;
      this.resetVm();
      for (const vpn of this.beladyTrace) this.accessVirtualPage(vpn, 0);
      const faults = this.pageFaults;
      this.policy = savedPol;
      this.numFrames = savedFr;
      this.resetVm();
      return faults;
    }

    // 4.2BSD TCP/IP Sliding-Window Congestion Control (Slow Start + AIMD)
    stepTcpRtt(packetDrop = false) {
      if (packetDrop) {
        this.tcpLosses++;
        this.ssthresh = Math.max(2, Math.floor(this.cwnd / 2));
        this.cwnd = this.ssthresh; // Fast Recovery / Multiplicative Decrease!
      } else if (this.cwnd < this.ssthresh) {
        this.cwnd = Math.min(32, this.cwnd * 2); // Exponential Slow Start
      } else {
        this.cwnd = Math.min(32, this.cwnd + 1); // Linear Additive Increase
      }
      this.tcpSeq += this.cwnd * 512;
      this.cwndHistory.push(this.cwnd);
      if (this.cwndHistory.length > 24) this.cwndHistory.shift();
      return { cwnd: this.cwnd, ssthresh: this.ssthresh, seq: this.tcpSeq };
    }

    step() {
      const vpn = this.beladyTrace[this.traceIdx % this.beladyTrace.length];
      this.traceIdx++;
      const vmRes = this.accessVirtualPage(vpn, vpn >= 4 ? 1 : 0);
      const drop = this.traceIdx % 11 === 0;
      const tcpRes = this.stepTcpRtt(drop);
      return { vm: vmRes, tcp: tcpRes };
    }
  }

  // ============================================================================
  // 20. CDC 6600 SUPERCOMPUTER — JAMES THORNTON'S SCOREBOARD (1964)
  //     10 Parallel Functional Units + Out-of-Order Dynamic Hazard Scheduling
  // ============================================================================
  class Cdc6600Scoreboard {
    constructor() {
      // 10 Authentic CDC 6600 Functional Units & latencies (100 ns minor cycles)
      this.unitDefs = [
        { name: "Increment 1", kind: "LD", lat: 3 },
        { name: "Increment 2", kind: "LD", lat: 3 },
        { name: "FP Multiply 1", kind: "FMUL", lat: 10 },
        { name: "FP Multiply 2", kind: "FMUL", lat: 10 },
        { name: "FP Add", kind: "FADD", lat: 4 },
        { name: "FP Divide", kind: "FDIV", lat: 29 },
        { name: "Long Add", kind: "IADD", lat: 3 },
        { name: "Boolean", kind: "BOOL", lat: 3 },
        { name: "Shift", kind: "SHFT", lat: 4 },
        { name: "Branch", kind: "BR", lat: 5 },
      ];
      // Canonical Hennessy & Patterson / Thornton CDC 6600 hazard benchmark!
      // Exercises RAW (FMUL waits on LD X2), WAR (FADD X6 waits for FDIV to read old X6!), and OoO completion!
      this.defaultProgram = [
        { op: "LD", kind: "LD", fi: "X6", fj: null, fk: "A1", asm: "SA1 B1+34  (LD X6)" },
        { op: "LD", kind: "LD", fi: "X2", fj: null, fk: "A2", asm: "SA2 B1+45  (LD X2)" },
        { op: "FMUL", kind: "FMUL", fi: "X0", fj: "X2", fk: "X4", asm: "FX0 X2*X4" },
        { op: "FSUB", kind: "FADD", fi: "X5", fj: "X6", fk: "X2", asm: "FX5 X6-X2" },
        { op: "FDIV", kind: "FDIV", fi: "X7", fj: "X0", fk: "X6", asm: "FX7 X0/X6" },
        {
          op: "FADD",
          kind: "FADD",
          fi: "X6",
          fj: "X5",
          fk: "X2",
          asm: "FX6 X5+X2  (WAR on X6!)",
        },
      ];
      this.ppSlot = 0; // 10 barrel-threaded Peripheral Processors PP0..PP9!
      this.reset();
    }

    reset() {
      this.clock = 0;
      this.issuePtr = 0;
      this.rawStalls = 0;
      this.warStalls = 0;
      this.wawStalls = 0;
      this.oooCompletions = 0;
      this.regs = {
        X0: 0,
        X1: 1.5,
        X2: 3.0,
        X3: 2.0,
        X4: 4.0,
        X5: 0,
        X6: 9.0,
        X7: 0,
        A1: 12.0,
        A2: 5.0,
      };
      this.regStatus = {}; // reg -> unitIndex or null
      this.units = this.unitDefs.map((d, idx) => ({
        idx,
        name: d.name,
        kind: d.kind,
        lat: d.lat,
        busy: false,
        op: "",
        fi: null,
        fj: null,
        fk: null,
        qj: null,
        qk: null,
        rj: false,
        rk: false,
        rem: 0,
        instIdx: -1,
      }));
      this.instTable = this.defaultProgram.map((ins, i) => ({
        ...ins,
        idx: i,
        issue: null,
        readOps: null,
        execDone: null,
        writeRes: null,
        unitName: "",
      }));
    }

    isComplete() {
      return this.instTable.every((r) => r.writeRes !== null);
    }

    step() {
      if (this.isComplete()) this.reset();
      this.clock++;
      this.ppSlot = (this.ppSlot + 1) % 10; // Barrel-processor rotation across PP0..PP9

      // Snapshot start-of-cycle state so stage transitions obey non-overlapping minor-cycle latch timing!
      const c = this.clock;
      const writeQueue = [];
      const readCompletedUnits = [];

      // 1. WRITE RESULT check: Exec complete (execDone < c) AND no WAR hazard!
      //    WAR condition: no other busy unit still has (Fj==Fi && Rj==true) or (Fk==Fi && Rk==true)
      for (const u of this.units) {
        if (!u.busy) continue;
        const row = this.instTable[u.instIdx];
        if (row.execDone !== null && row.execDone < c && row.writeRes === null) {
          const warBlocked = this.units.some(
            (other) =>
              other.busy &&
              other.idx !== u.idx &&
              ((other.fj === u.fi && other.rj) || (other.fk === u.fi && other.rk)),
          );
          if (warBlocked) {
            this.warStalls++;
          } else {
            writeQueue.push(u);
          }
        }
      }

      // 2. EXECUTE countdown for units that already read operands on a prior cycle
      for (const u of this.units) {
        if (!u.busy) continue;
        const row = this.instTable[u.instIdx];
        if (row.readOps !== null && row.readOps < c && row.execDone === null) {
          u.rem--;
          if (u.rem <= 0) {
            row.execDone = c;
            // Compute actual 60-bit floating-point result!
            const vj = u.fj ? this.regs[u.fj] || 0 : 0;
            const vk = u.fk ? this.regs[u.fk] || 0 : 0;
            u._resVal =
              u.op === "LD"
                ? vk
                : u.op === "FMUL"
                  ? vj * vk
                  : u.op === "FSUB"
                    ? vj - vk
                    : u.op === "FDIV"
                      ? vk !== 0
                        ? +(vj / vk).toFixed(4)
                        : 0
                      : vj + vk;
          }
        }
      }

      // 3. READ OPERANDS check: issued on prior cycle AND Rj && Rk both ready!
      for (const u of this.units) {
        if (!u.busy) continue;
        const row = this.instTable[u.instIdx];
        if (row.issue !== null && row.issue < c && row.readOps === null) {
          if (u.rj && u.rk) {
            row.readOps = c;
            readCompletedUnits.push(u);
          } else {
            this.rawStalls++;
          }
        }
      }

      // 4. ISSUE check: in-order issue if matching Functional Unit is free AND no WAW (regStatus[Fi] == null)!
      if (this.issuePtr < this.instTable.length) {
        const nextRow = this.instTable[this.issuePtr];
        const freeUnit = this.units.find((u) => u.kind === nextRow.kind && !u.busy);
        const wawBusy = this.regStatus[nextRow.fi] != null;
        if (wawBusy) {
          this.wawStalls++;
        } else if (freeUnit) {
          freeUnit.busy = true;
          freeUnit.op = nextRow.op;
          freeUnit.fi = nextRow.fi;
          freeUnit.fj = nextRow.fj;
          freeUnit.fk = nextRow.fk;
          const qj = nextRow.fj ? (this.regStatus[nextRow.fj] ?? null) : null;
          const qk = nextRow.fk ? (this.regStatus[nextRow.fk] ?? null) : null;
          freeUnit.qj = qj;
          freeUnit.qk = qk;
          freeUnit.rj = qj === null;
          freeUnit.rk = qk === null;
          freeUnit.rem = freeUnit.lat;
          freeUnit.instIdx = nextRow.idx;
          this.regStatus[nextRow.fi] = freeUnit.idx;
          nextRow.issue = c;
          nextRow.unitName = freeUnit.name;
          this.issuePtr++;
        }
      }

      // Commit operand read clears (Rj/Rk <- false once read completes)
      for (const u of readCompletedUnits) {
        u.rj = false;
        u.rk = false;
      }

      // Commit WRITE RESULT broadcasts to waiting Qj/Qk reservation stations!
      for (const u of writeQueue) {
        const row = this.instTable[u.instIdx];
        row.writeRes = c;
        if (this.instTable.some((prev) => prev.idx < row.idx && prev.writeRes === null)) {
          this.oooCompletions++;
        }
        this.regs[u.fi] = u._resVal ?? this.regs[u.fi];
        for (const w of this.units) {
          if (!w.busy) continue;
          if (w.qj === u.idx) {
            w.qj = null;
            w.rj = true;
          }
          if (w.qk === u.idx) {
            w.qk = null;
            w.rk = true;
          }
        }
        if (this.regStatus[u.fi] === u.idx) this.regStatus[u.fi] = null;
        u.busy = false;
      }

      return {
        clock: this.clock,
        rawStalls: this.rawStalls,
        warStalls: this.warStalls,
        wawStalls: this.wawStalls,
        oooCompletions: this.oooCompletions,
      };
    }
  }

  // ============================================================================
  // 21. SANDIA / INTEL ASCI RED 1.3-TFLOPS MPP (1997)
  //     2D Mesh Dimension-Order (XY) Wormhole Flit Router + MPI Shock-Wave PDE
  // ============================================================================
  class AsciRedWormholeMpp {
    constructor() {
      this.meshW = 6;
      this.meshH = 6; // 36 visible compute/service tiles representing 9,298 Pentium Pro CPUs!
      this.routerNs = 25; // per-hop router pipeline latency (ns)
      this.flitsPerPacket = 8; // 1 Head + 6 Body + 1 Tail flit
      this.linkBwFlitsPerCycle = 1;
      this.flows = [];
      this.packetsDelivered = 0;
      this.contentionStalls = 0;
      // 2D MPI Shock-Wave Pressure Field across the 6x6 distributed memory subdomains
      this.gridN = 18;
      this.uCur = new Float32Array(18 * 18);
      this.uPrev = new Float32Array(18 * 18);
      this.mpiHaloExchanges = 0;
      this.triggerShockPulse(9, 9);
      this.injectFlow(0, 0, 5, 5);
      this.injectFlow(0, 2, 5, 2);
    }

    // Dimension-Order XY deterministic deadlock-free path on 2D mesh!
    computeXYPath(sx, sy, dx, dy) {
      const path = [[sx, sy]];
      let x = sx;
      let y = sy;
      while (x !== dx) {
        x += dx > x ? 1 : -1;
        path.push([x, y]);
      }
      while (y !== dy) {
        y += dy > y ? 1 : -1;
        path.push([x, y]);
      }
      return path;
    }

    // Compare Wormhole Cut-Through Latency vs Classical Store-and-Forward!
    compareLatencyCycles(hops = 8, flits = this.flitsPerPacket) {
      // Wormhole: head flit pipelines 1 hop/cycle, body/tail follow immediately -> D + L
      const wormholeCycles = hops + flits;
      // Store-and-Forward: entire L-flit packet buffered at every hop -> D * L
      const storeForwardCycles = hops * flits;
      return {
        hops,
        wormholeCycles,
        storeForwardCycles,
        speedup: +(storeForwardCycles / Math.max(1, wormholeCycles)).toFixed(2),
      };
    }

    injectFlow(sx, sy, dx, dy) {
      const path = this.computeXYPath(sx, sy, dx, dy);
      this.flows.push({
        path,
        headIdx: 0,
        length: 4, // 4 flits visible snaking across mesh links
        stalled: false,
        color: this.flows.length % 2 === 0 ? "#38bdf8" : "#f97316",
      });
      if (this.flows.length > 5) this.flows.shift();
      return path;
    }

    triggerShockPulse(cx = 9, cy = 9) {
      const N = this.gridN;
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          const amp = 1.6 * Math.exp(-d2 / 4.5);
          this.uCur[y * N + x] = amp;
          this.uPrev[y * N + x] = amp * 0.92;
        }
      }
    }

    step() {
      // 1. Advance wormhole flit trains with link-exclusivity contention detection!
      const occupiedLinks = new Set();
      const surviving = [];
      for (const f of this.flows) {
        if (f.headIdx < f.path.length - 1) {
          const [ax, ay] = f.path[f.headIdx];
          const [bx, by] = f.path[f.headIdx + 1];
          const edgeKey = `${ax},${ay}->${bx},${by}`;
          if (occupiedLinks.has(edgeKey)) {
            f.stalled = true;
            this.contentionStalls++;
          } else {
            f.stalled = false;
            occupiedLinks.add(edgeKey);
            f.headIdx++;
          }
          surviving.push(f);
        } else if (f.length > 1) {
          f.length--;
          surviving.push(f);
        } else {
          this.packetsDelivered++;
        }
      }
      this.flows = surviving;
      if (this.flows.length < 2) {
        const r = this.packetsDelivered % 6;
        this.injectFlow(0, r, 5, (r + 3) % 6);
        this.injectFlow(1, r, 5, r); // deliberate shared X-axis row to exercise wormhole contention!
      }

      // 2. Step 2D MPI Shock-Wave Acoustic PDE across 36 domain-decomposed subdomains
      const N = this.gridN;
      const next = new Float32Array(N * N);
      const c2 = 0.22;
      for (let y = 1; y < N - 1; y++) {
        for (let x = 1; x < N - 1; x++) {
          const i = y * N + x;
          const lap =
            this.uCur[i - 1] +
            this.uCur[i + 1] +
            this.uCur[i - N] +
            this.uCur[i + N] -
            4 * this.uCur[i];
          next[i] = (2 * this.uCur[i] - this.uPrev[i] + c2 * lap) * 0.992;
        }
      }
      this.uPrev = this.uCur;
      this.uCur = next;
      this.mpiHaloExchanges += 36 * 4;

      // Re-ignite shockwave periodically so field stays lively
      let energy = 0;
      for (let i = 0; i < next.length; i++) energy += next[i] * next[i];
      if (energy < 0.08) this.triggerShockPulse(5 + (this.packetsDelivered % 8), 9);

      return {
        delivered: this.packetsDelivered,
        stalls: this.contentionStalls,
        halos: this.mpiHaloExchanges,
      };
    }
  }

  // ============================================================================
  // 22. TRAPPED-ION 171Yb+ LINEAR RF PAUL TRAP & QCCD QPU (1995 / 2024)
  //     Cirac-Zoller / Mølmer-Sørensen All-to-All Phonon-Bus Entangling Gates
  // ============================================================================
  class TrappedIonPaulQccd {
    constructor() {
      this.nQubits = 4; // 16-state exact complex state vector for 4 levitated 171Yb+ ions
      this.re = new Float64Array(16);
      this.im = new Float64Array(16);
      this.rfFreqMHz = 36.5; // Radial RF Paul drive Omega_RF / 2pi
      this.rfVolt = 240; // Peak RF electrode voltage (V)
      this.axialFreqMHz = 1.45; // Collective center-of-mass axial phonon mode omega_z / 2pi
      this.meanPhonons = 0.02; // Sideband-cooled near |n=0> motional ground state!
      this.gateLog = [];
      this.resetState();
      // Prepare an all-to-all Mølmer-Sørensen Bell pair between NON-ADJACENT ions 0 and 3!
      this.applyMolmerSorensen(0, 3, Math.PI / 2);
    }

    resetState() {
      this.re.fill(0);
      this.im.fill(0);
      this.re[0] = 1.0; // |0000> hyperfine clock state |F=0, m_F=0>
      this.gateLog = [];
    }

    // Mathieu RF Paul Trap radial stability parameter q = 2 e V_RF / (m r0^2 Omega_RF^2)
    // Stable secular confinement requires 0 < q < 0.908 (typically q ~ 0.22 - 0.35)!
    mathieuQ() {
      const qVal = (0.28 * (this.rfVolt / 240)) / Math.pow(this.rfFreqMHz / 36.5, 2);
      return +qVal.toFixed(3);
    }

    isTrapStable() {
      const qVal = this.mathieuQ();
      return qVal > 0.04 && qVal < 0.908;
    }

    // Single-ion stimulated Raman rotation Rx(theta) on ion q
    applyRx(q, theta) {
      const c = Math.cos(theta / 2);
      const s = Math.sin(theta / 2); // -i sin(theta/2) X
      const bit = 1 << q;
      for (let idx = 0; idx < 16; idx++) {
        if ((idx & bit) === 0) {
          const j = idx | bit;
          const r0 = this.re[idx],
            i0 = this.im[idx];
          const r1 = this.re[j],
            i1 = this.im[j];
          // |0'> = c|0> - i s|1>; |1'> = -i s|0> + c|1>
          this.re[idx] = c * r0 + s * i1;
          this.im[idx] = c * i0 - s * r1;
          this.re[j] = s * i0 + c * r1;
          this.im[j] = -s * r0 + c * i1;
        }
      }
      this.gateLog.push(`Rx(${q},${(theta / Math.PI).toFixed(2)}π)`);
      if (this.gateLog.length > 8) this.gateLog.shift();
    }

    // Exact All-to-All Mølmer-Sørensen Bichromatic Phonon-Bus Gate:
    //   U_MS(i, j, theta) = exp(-i * (theta / 2) * X_i X_j) = cos(theta/2) I - i sin(theta/2) X_i X_j
    // Couples ANY two ions (i, j) directly via shared axial phonon mode — ZERO SWAP gates required!
    applyMolmerSorensen(i, j, theta = Math.PI / 2) {
      if (i === j) return this.probabilities();
      const c = Math.cos(theta / 2);
      const s = Math.sin(theta / 2);
      const mask = (1 << i) | (1 << j);
      const visited = new Uint8Array(16);
      for (let a = 0; a < 16; a++) {
        if (visited[a]) continue;
        const b = a ^ mask;
        visited[a] = 1;
        visited[b] = 1;
        const ra = this.re[a],
          ia = this.im[a];
        const rb = this.re[b],
          ib = this.im[b];
        //psi_a' = c*psi_a - i*s*psi_b => re = c*ra + s*ib, im = c*ia - s*rb
        this.re[a] = c * ra + s * ib;
        this.im[a] = c * ia - s * rb;
        this.re[b] = c * rb + s * ia;
        this.im[b] = c * ib - s * ra;
      }
      this.gateLog.push(`MS(${i},${j})`);
      if (this.gateLog.length > 8) this.gateLog.shift();
      return this.probabilities();
    }

    probabilities() {
      const p = new Float64Array(16);
      for (let i = 0; i < 16; i++)
        p[i] = this.re[i] * this.re[i] + this.im[i] * this.im[i];
      return p;
    }

    // Marginal bright-state |1> fluorescence probability per 171Yb+ ion under 369.5 nm laser!
    ionBrightProbabilities() {
      const bright = [0, 0, 0, 0];
      const probs = this.probabilities();
      for (let idx = 0; idx < 16; idx++) {
        for (let q = 0; q < 4; q++) {
          if ((idx >>> q) & 1) bright[q] += probs[idx];
        }
      }
      return bright;
    }

    twoQubitGateFidelity() {
      // Fidelity degrades gently if mean axial phonon number n_bar rises above ground state
      return Math.max(0.85, +(0.9992 - 0.018 * this.meanPhonons).toFixed(5));
    }

    step() {
      // Cycle through a 4-ion GHZ-like all-to-all MS entangling sequence
      const k = (this._stepIdx = ((this._stepIdx || 0) + 1) % 4);
      if (k === 0) {
        this.resetState();
        this.applyMolmerSorensen(0, 3, Math.PI / 2);
      } else if (k === 1) {
        this.applyMolmerSorensen(0, 1, Math.PI / 2);
      } else if (k === 2) {
        this.applyMolmerSorensen(1, 2, Math.PI / 2);
      } else {
        this.applyRx(2, Math.PI / 4);
      }
      return { probs: this.probabilities(), bright: this.ionBrightProbabilities() };
    }
  }

  // ============================================================================
  // 23. SUPERCONDUCTING FLUX-QUBIT ADIABATIC QUANTUM ANNEALER (2011 / 2023)
  //     Exact Transverse-Field Ising Spin Glass H(s) Tunneling vs Thermal SA
  // ============================================================================
  class QuantumAnnealerIsing {
    constructor() {
      this.nSpins = 6; // 2^6 = 64 spin configurations for exact instantaneous spectrum & RK4 Schrödinger tunneling!
      this.preset = "tunnel"; // "tunnel" (tall thin barrier!) | "maxcut" (frustrated ring)
      this.annealTimeUs = 18.0; // Longer T_anneal -> higher adiabatic ground-state probability (Landau-Zener!)
      this.thermalTemp = 0.32;
      this.s = 0.0;
      this.h = new Float64Array(6);
      this.J = [];
      this.diagEnergies = new Float64Array(64);
      this.spectrumCurve = []; // { s, e0, e1, gap }
      this.loadInstance("tunnel");
    }

    loadInstance(kind = "tunnel") {
      this.preset = kind;
      this.h.fill(0);
      this.J = [];
      if (kind === "maxcut") {
        // Antiferromagnetic frustrated ring + chord (Max-Cut QUBO benchmark!)
        const edges = [
          [0, 1, 1.0],
          [1, 2, 1.0],
          [2, 3, 1.0],
          [3, 4, 1.0],
          [4, 5, 1.0],
          [5, 0, 1.0],
          [0, 3, 0.75],
          [1, 4, -0.6],
        ];
        this.J = edges;
        this.h[0] = -0.25; // break Z2 degeneracy cleanly
      } else {
        // Canonical D-Wave / Boixo et al. Tall-Thin Spin-Glass Tunneling Barrier!
        // Ferromagnetic core (0..5) biased so all-+1 is a FALSE local minimum, all--1 is TRUE global minimum,
        // separated by a tall Hamming-distance-6 energy barrier that traps classical thermal annealing!
        for (let i = 0; i < 6; i++) {
          this.J.push([i, (i + 1) % 6, -1.15]);
          if (i < 3) this.J.push([i, i + 3, -0.65]);
          this.h[i] = 0.22; // global ground state is all sigma_z = -1 (bit = 1 -> mask 63)!
        }
      }
      this._buildDiagonalIsingEnergies();
      this._computeGapCurve();
      this.runComparison(this.annealTimeUs);
    }

    _buildDiagonalIsingEnergies() {
      let bestE = Infinity;
      let bestMask = 0;
      for (let mask = 0; mask < 64; mask++) {
        // Convention: bit=0 -> sigma_z = +1 (spin UP), bit=1 -> sigma_z = -1 (spin DOWN)
        let e = 0;
        for (let i = 0; i < 6; i++) {
          const sz = (mask >>> i) & 1 ? -1 : 1;
          e += this.h[i] * sz;
        }
        for (const [i, j, Jij] of this.J) {
          const szi = (mask >>> i) & 1 ? -1 : 1;
          const szj = (mask >>> j) & 1 ? -1 : 1;
          e += Jij * szi * szj;
        }
        this.diagEnergies[mask] = e;
        if (e < bestE) {
          bestE = e;
          bestMask = mask;
        }
      }
      // Penalty spike on intermediate Hamming weight 2..4 in "tunnel" mode (tall, narrow barrier!)
      if (this.preset === "tunnel") {
        for (let mask = 0; mask < 64; mask++) {
          let ones = 0;
          for (let b = 0; b < 6; b++) ones += (mask >>> b) & 1;
          if (ones >= 2 && ones <= 4) this.diagEnergies[mask] += 2.6;
        }
        bestE = Infinity;
        for (let mask = 0; mask < 64; mask++) {
          if (this.diagEnergies[mask] < bestE) {
            bestE = this.diagEnergies[mask];
            bestMask = mask;
          }
        }
      }
      this.groundEnergy = bestE;
      this.groundMask = bestMask;
    }

    // Compute exact instantaneous ground & 1st-excited gap Delta(s) across s in [0, 1] via Lanczos/power-deflation
    _computeGapCurve() {
      this.spectrumCurve = [];
      let minGap = Infinity;
      for (let k = 0; k <= 16; k++) {
        const s = +(k / 16).toFixed(3);
        const A = (1 - s) * 1.4;
        const B = s * 1.0;
        // H(s) = -A sum X_i + B diagEnergies -> off-diagonal entries are non-positive (-A), so Perron-Frobenius guarantees ground state is real & positive!
        // Shift I*shift - H(s) so largest eigenvalue corresponds to E_0(s)!
        const shift = 18.0;
        const applyShifted = (vec) => {
          const out = new Float64Array(64);
          for (let m = 0; m < 64; m++) {
            let acc = (shift - B * this.diagEnergies[m]) * vec[m];
            for (let b = 0; b < 6; b++) acc += A * vec[m ^ (1 << b)];
            out[m] = acc;
          }
          return out;
        };

        // Ground eigenvector v0 via power iteration
        let v0 = new Float64Array(64).fill(1 / 8);
        for (let it = 0; it < 36; it++) {
          const w = applyShifted(v0);
          let nrm = 0;
          for (let m = 0; m < 64; m++) nrm += w[m] * w[m];
          nrm = Math.sqrt(nrm) || 1;
          for (let m = 0; m < 64; m++) v0[m] = w[m] / nrm;
        }
        const hv0 = applyShifted(v0);
        let lam0 = 0;
        for (let m = 0; m < 64; m++) lam0 += v0[m] * hv0[m];
        const e0 = shift - lam0;

        // First-excited eigenvector v1 via orthogonalized power iteration!
        let v1 = new Float64Array(64);
        for (let m = 0; m < 64; m++) v1[m] = m < 32 ? 0.125 : -0.125;
        for (let it = 0; it < 44; it++) {
          const w = applyShifted(v1);
          let dot = 0;
          for (let m = 0; m < 64; m++) dot += w[m] * v0[m];
          let nrm = 0;
          for (let m = 0; m < 64; m++) {
            w[m] -= dot * v0[m];
            nrm += w[m] * w[m];
          }
          nrm = Math.sqrt(nrm) || 1;
          for (let m = 0; m < 64; m++) v1[m] = w[m] / nrm;
        }
        const hv1 = applyShifted(v1);
        let lam1 = 0;
        for (let m = 0; m < 64; m++) lam1 += v1[m] * hv1[m];
        const e1 = Math.max(e0, shift - lam1);
        const gap = Math.max(0.01, e1 - e0);
        if (gap < minGap) minGap = gap;
        this.spectrumCurve.push({ s, e0, e1, gap });
      }
      this.minGapGHz = +minGap.toFixed(3);
      return this.spectrumCurve;
    }

    // Exact RK4 Real-Time Schrödinger Integration of 6-Qubit Transverse-Field Ising Anneal vs Classical SA!
    runComparison(annealTimeUs = this.annealTimeUs) {
      this.annealTimeUs = Math.max(0.5, Math.min(40, annealTimeUs));
      const T = this.annealTimeUs;
      const steps = Math.max(60, Math.min(480, Math.round(T * 14)));
      const dt = T / steps;

      // Initial ground state of -sum X_i is uniform superposition |++++++> = 1/8
      let re = new Float64Array(64).fill(0.125);
      let im = new Float64Array(64).fill(0);

      const deriv = (r, m, sVal) => {
        const A = (1 - sVal) * 1.4;
        const B = sVal * 1.0;
        const dr = new Float64Array(64);
        const dm = new Float64Array(64);
        for (let idx = 0; idx < 64; idx++) {
          let hr = B * this.diagEnergies[idx] * r[idx];
          let hm = B * this.diagEnergies[idx] * m[idx];
          for (let b = 0; b < 6; b++) {
            const j = idx ^ (1 << b);
            hr -= A * r[j];
            hm -= A * m[j];
          }
          // d/dt (r + i m) = -i H (r + i m) => dr = H*m, dm = -H*r
          dr[idx] = hm;
          dm[idx] = -hr;
        }
        return { dr, dm };
      };

      for (let st = 0; st < steps; st++) {
        const s0 = st / steps;
        const sMid = (st + 0.5) / steps;
        const s1 = (st + 1) / steps;
        const k1 = deriv(re, im, s0);
        const r2 = new Float64Array(64),
          m2 = new Float64Array(64);
        for (let i = 0; i < 64; i++) {
          r2[i] = re[i] + 0.5 * dt * k1.dr[i];
          m2[i] = im[i] + 0.5 * dt * k1.dm[i];
        }
        const k2 = deriv(r2, m2, sMid);
        const r3 = new Float64Array(64),
          m3 = new Float64Array(64);
        for (let i = 0; i < 64; i++) {
          r3[i] = re[i] + 0.5 * dt * k2.dr[i];
          m3[i] = im[i] + 0.5 * dt * k2.dm[i];
        }
        const k3 = deriv(r3, m3, sMid);
        const r4 = new Float64Array(64),
          m4 = new Float64Array(64);
        for (let i = 0; i < 64; i++) {
          r4[i] = re[i] + dt * k3.dr[i];
          m4[i] = im[i] + dt * k3.dm[i];
        }
        const k4 = deriv(r4, m4, s1);
        for (let i = 0; i < 64; i++) {
          re[i] += (dt / 6) * (k1.dr[i] + 2 * k2.dr[i] + 2 * k3.dr[i] + k4.dr[i]);
          im[i] += (dt / 6) * (k1.dm[i] + 2 * k2.dm[i] + 2 * k3.dm[i] + k4.dm[i]);
        }
      }

      this.finalProbs = new Float64Array(64);
      let norm = 0;
      for (let i = 0; i < 64; i++) {
        this.finalProbs[i] = re[i] * re[i] + im[i] * im[i];
        norm += this.finalProbs[i];
      }
      if (norm > 0) {
        for (let i = 0; i < 64; i++) this.finalProbs[i] /= norm;
      }

      // Sum probability on all degenerate ground states within 1e-6 of groundEnergy
      let qGroundProb = 0;
      for (let i = 0; i < 64; i++) {
        if (Math.abs(this.diagEnergies[i] - this.groundEnergy) < 1e-5) {
          qGroundProb += this.finalProbs[i];
        }
      }
      this.quantumSuccessProb = +qGroundProb.toFixed(4);

      // Classical Thermal Simulated Annealing (exact master-equation Markov chain over single-spin flips from false-well / uniform start!)
      let saDist = new Float64Array(64).fill(1 / 64);
      const saSweeps = 28;
      for (let sw = 0; sw < saSweeps; sw++) {
        const temp = Math.max(
          0.08,
          1.4 * Math.pow(1 - sw / saSweeps, 1.8) * this.thermalTemp * 3,
        );
        const nextDist = new Float64Array(64);
        for (let m = 0; m < 64; m++) {
          let stay = 1.0;
          for (let b = 0; b < 6; b++) {
            const nb = m ^ (1 << b);
            const dE = this.diagEnergies[nb] - this.diagEnergies[m];
            const pAccept = dE <= 0 ? 1 / 6 : Math.exp(-dE / temp) / 6;
            nextDist[nb] += saDist[m] * pAccept;
            stay -= pAccept;
          }
          nextDist[m] += saDist[m] * Math.max(0, stay);
        }
        saDist = nextDist;
      }
      let cGroundProb = 0;
      for (let i = 0; i < 64; i++) {
        if (Math.abs(this.diagEnergies[i] - this.groundEnergy) < 1e-5) {
          cGroundProb += saDist[i];
        }
      }
      this.classicalSuccessProb = +cGroundProb.toFixed(4);
      this.s = 1.0;
      return {
        quantumProb: this.quantumSuccessProb,
        classicalProb: this.classicalSuccessProb,
        minGap: this.minGapGHz,
      };
    }

    step(dt = 0.016) {
      this.s = (this.s + dt * 0.45) % 1.0;
      return {
        s: this.s,
        quantumProb: this.quantumSuccessProb,
        classicalProb: this.classicalSuccessProb,
      };
    }
  }

  const exportsMap = {
    S360_PROGRAMS,
    S360System,
    UnixPdp11System,
    SmpMesiRaidServer,
    CloudRaftCluster,
    ModernMainframeZ,
    Cray1VectorCpu,
    ConnectionMachineCM2,
    BlueGeneTorusMpi,
    ExascaleDragonflySim,
    BlackwellAiRackSim,
    CryoSurfaceCodeQuantum,
    NeutralAtomTweezerSim,
    PhotonicMbqcSim,
    TopologicalMajoranaSim,
    OmegaSingularityCore,
    ApolloAgcDsky,
    XeroxAltoSystem,
    MobileArmSoc,
    VaxVirtualMemorySystem,
    Cdc6600Scoreboard,
    AsciRedWormholeMpp,
    TrappedIonPaulQccd,
    QuantumAnnealerIsing,
  };

  Object.assign(globalScope, exportsMap);
})(typeof window !== "undefined" ? window : globalThis);
