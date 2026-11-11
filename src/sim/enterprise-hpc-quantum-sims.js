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
          .map((p) => `PID ${String(p.pid).padStart(2)}  ${p.state.padEnd(4)}  TIME ${p.cpu}  ${p.name}`)
          .join("\n");
      } else if (cmd.startsWith("ls")) {
        out = this.inodes
          .map((n) => `${String(n.ino).padStart(3)} ${n.mode} ${String(n.size).padStart(6)} ${n.path}`)
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
      const srcDrawer = (this.totalTx / batch) % 4 | 0;
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

      // Authentic Cray-1 cycle accounting (12.5 ns = 80 MHz clock):
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
                if ((dx & 1) && (x & 3) === 0) this.routeHypercube(nIdx, idx);
              }
            }
          }
          const alive = this.grid[idx];
          this.nextGrid[idx] = alive ? (nbrs === 2 || nbrs === 3 ? 1 : 0) : nbrs === 3 ? 1 : 0;
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
        this.groupLoads[g] = this.adaptiveRouting ? 0.52 + (rawLoad - 0.52) * 0.38 : rawLoad;
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
        this.shuttlePhase < 1 ? "STORAGE" : this.shuttlePhase < 2 ? "ENTANGLE" : "READOUT";
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
        const m = forcedOutcomes
          ? forcedOutcomes[k] & 1
          : (this.shots + k) & 1; // deterministic cycle over all 8 byproduct branches!
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

  // ============================================================================
  // 15. OMEGA-Q SINGULARITY HYPER-QUANTUM COMPUTER (2045+)
  //     Exact Shor QFT Factoring + Exact 256-State Grover + H2 Chemistry Solver
  // ============================================================================
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
      this.Q = 256; // 8-bit QFT period-register size
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
    runShor(N = 15, coprimeA = 7) {
      this.shorN = N;
      let a = coprimeA;
      if (gcdInt(a, N) !== 1) {
        for (const cand of [2, 4, 7, 8, 11, 13]) {
          if (cand < N && gcdInt(cand, N) === 1) {
            a = cand;
            break;
          }
        }
      }
      this.shorA = a;

      // Measure modular exponentiation register f(x) = a^x mod N (collapse to coset f(x) == f(0) = 1)
      const Q = this.Q;
      const reg = new Float64Array(Q);
      let count = 0;
      for (let x = 0; x < Q; x++) {
        if (modPowInt(a, x, N) === 1) {
          reg[x] = 1;
          count++;
        }
      }
      const norm = 1 / Math.sqrt(Math.max(1, count));
      for (let x = 0; x < Q; x++) reg[x] *= norm;

      // Exact Quantum Fourier Transform (QFT_256) on collapsed period register!
      this.qftProbs.fill(0);
      const invSqrtQ = 1 / Math.sqrt(Q);
      let peakK = 0;
      let peakP = 0;
      for (let k = 0; k < Q; k++) {
        let re = 0;
        let im = 0;
        for (let x = 0; x < Q; x++) {
          if (reg[x] === 0) continue;
          const ang = (2 * Math.PI * k * x) / Q;
          re += reg[x] * Math.cos(ang);
          im += reg[x] * Math.sin(ang);
        }
        const prob = (re * re + im * im) * (invSqrtQ * invSqrtQ);
        this.qftProbs[k] = prob;
        // Pick strongest non-zero harmonic peak where gcd(k, Q) reveals full period r!
        if (k > 0 && prob > peakP * 0.85 && peakK === 0) {
          peakP = prob;
          peakK = k;
        }
      }

      // Continued-fractions denominator extraction on k / Q to recover period r
      let period = 0;
      for (let k = 1; k < Q; k++) {
        if (this.qftProbs[k] < 0.02) continue;
        const rCand = this._continuedFractionOrder(k, Q, a, N);
        if (rCand > 0) {
          period = rCand;
          break;
        }
      }

      let p = 1;
      let q = N;
      if (period > 0 && period % 2 === 0) {
        const halfPow = modPowInt(a, period / 2, N);
        const f1 = gcdInt(halfPow - 1, N);
        const f2 = gcdInt(halfPow + 1, N);
        if (f1 > 1 && f1 < N) {
          p = f1;
          q = N / f1;
        } else if (f2 > 1 && f2 < N) {
          p = f2;
          q = N / f2;
        }
      }
      this.shorResult = { N, a, period, factors: [Math.min(p, q), Math.max(p, q)] };
      return this.shorResult;
    }

    _continuedFractionOrder(k, Q, a, N) {
      let num = k;
      let den = Q;
      let pPrev = 0,
        pCur = 1;
      let qPrev = 1,
        qCur = 0;
      for (let iter = 0; iter < 12 && den !== 0; iter++) {
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

    // 3. EXACT H2 MOLECULAR ELECTRONIC-STRUCTURE POTENTIAL ENERGY CURVE (2-Qubit Jordan-Wigner / Full-CI Subspace)
    computeH2DissociationCurve() {
      // Exact 1s Slater-orbital MO integrals + 2x2 {|sigma_g^2>, |sigma_u^2>} CI diagonalization across bond length R
      const points = [];
      let minE = 99;
      let eqR = 0.74;
      for (let i = 0; i < 28; i++) {
        const R = +(0.35 + i * 0.08).toFixed(2); // Angstroms (0.35 .. 2.51 A)
        const r = R / 0.52917721; // Bohr atomic units
        const S = Math.exp(-r) * (1 + r + (r * r) / 3);
        const Vaa = (1 / r) * (1 - (1 + r) * Math.exp(-2 * r));
        const Vab = Math.exp(-r) * (1 + r);
        const Jaa = 0.625; // exact <1s_A 1s_A | 1/r12 | 1s_A 1s_A> = 5/8 Ha
        const Jab =
          (1 / r) *
          (1 -
            Math.exp(-2 * r) *
              (1 + (11 / 8) * r + 0.75 * r * r + (1 / 6) * r * r * r));
        // Mulliken-corrected two-electron MO integrals (exact at both united-atom and R->inf limits!)
        const hgg = -0.5 - (Vaa + Vab) / (1 + S);
        const huu = -0.5 - (Vaa - Vab) / Math.max(1e-4, 1 - S);
        const Jgg = (Jaa + Jab) / (2 * (1 + S * S * 0.18));
        const Juu = (Jaa + Jab) / 2;
        const Kgu = (Jaa - Jab) / 2;
        const eNuc = 1 / r;

        const H00 = 2 * hgg + Jgg + eNuc; // Hartree-Fock |01> = |sigma_g^2>
        const H11 = 2 * huu + Juu + eNuc; // Doubly-excited |10> = |sigma_u^2>
        const avg = 0.5 * (H00 + H11);
        const halfGap = 0.5 * (H11 - H00);
        const split = Math.sqrt(halfGap * halfGap + Kgu * Kgu);
        const eGround = avg - split;
        const eExcited = avg + split;
        if (eGround < minE) {
          minE = eGround;
          eqR = R;
        }
        points.push({ R, eGround, eHF: H00, eExcited });
      }
      this.h2Curve = points;
      this.h2MinEnergyHa = minE;
      this.h2EqAngstrom = eqR;
      return points;
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
  };

  Object.assign(globalScope, exportsMap);
})(typeof window !== "undefined" ? window : globalThis);
