// Circle II — Mainframes & Servers: Enterprise I/O, UNIX/TCP-IP, SMP Coherence, Cloud Consensus & Zero-Downtime RAS
//   s360    (1964) ★ CAPITAL: IBM System/360 Model 50 Mainframe (8-bit byte, ROS microcode, autonomous CCW channels, BCD)
//   unix70  (1973)          : DEC PDP-11/70 & Bell Labs UNIX v6 / C / ARPANET Server (APR MMU, fork/pipe, inodes)
//   sun90   (1993)          : Sun SPARCcenter SMP + MESI Snooping Cache Coherence + 5-Disk RAID-5 Server
//   cloud10 (2014)          : Warehouse-Scale Open-Compute Cloud Rack & 5-Node Raft Consensus Cluster
//   zmain20 (2022)          : Telum-Class Zero-Downtime Enterprise Mainframe (Virtual L4 ring, RAIM, inline AI ACID)

function makeMachineS360() {
  const sim = new S360System();
  let running = true;
  let stepAcc = 0;
  let panelSurf = null;
  let printSurf = null;
  let tapeReels = [];
  let diskArm = null;
  let diskPlatters = null;
  let dials = [];
  let statsUi = null;

  function drawConsolePanel() {
    if (!panelSurf) return;
    const c = panelSurf.ctx;
    const W = 1024,
      H = 512;
    c.fillStyle = "#12151b";
    c.fillRect(0, 0, W, H);

    // Header bar in classic IBM System/360 brushed aluminum & scarlet accent
    c.fillStyle = "#c8ccd4";
    c.fillRect(16, 14, W - 32, 48);
    c.fillStyle = "#b8292f";
    c.fillRect(16, 14, 220, 48);
    c.fillStyle = "#ffffff";
    c.font = '700 22px "JetBrains Mono", monospace';
    c.fillText("IBM SYSTEM/360", 28, 45);
    c.fillStyle = "#18202c";
    c.fillText(
      `MODEL 50 · ROS 0x${bt(sim.rosAddr, 3)} (${sim.rosPhase}) · PSW CC=${sim.psw.cc} KEY=${sim.psw.key}`,
      252,
      45,
    );

    // 32-bit Roller/Incandescent Lamp Matrix (ROS Micro-word + Current Instruction + Addr/Data)
    const rows = [
      ["ROS MICROWORD", (sim.rosAddr * 0x108421) >>> 0],
      ["STORAGE ADDR ", (sim.psw.pc * 4 + 0x1000) >>> 0],
      ["MEMORY BUS   ", sim.regs[2] >>> 0],
      ["ALU / BCD BUS", sim.decAcc >>> 0],
    ];
    rows.forEach(([label, bits], rIdx) => {
      const y = 92 + rIdx * 48;
      c.fillStyle = "#94a3b8";
      c.font = '600 14px "JetBrains Mono", monospace';
      c.fillText(label, 24, y + 8);
      for (let b = 0; b < 32; b++) {
        const on = (bits >>> (31 - b)) & 1;
        const x = 188 + b * 25 + Math.floor(b / 8) * 8;
        c.beginPath();
        c.arc(x, y + 3, 7.5, 0, Math.PI * 2);
        c.fillStyle = on ? "#ffbe42" : "#28231a";
        c.fill();
        if (on) {
          c.strokeStyle = "rgba(255,210,110,0.55)";
          c.lineWidth = 2;
          c.stroke();
        }
      }
    });

    // 16 x 32-bit General Purpose Registers (R0..R7) & Channel Status
    c.fillStyle = "#0b0e13";
    c.fillRect(20, 286, 610, 206);
    c.strokeStyle = "#2b6cb0";
    c.lineWidth = 2;
    c.strokeRect(20, 286, 610, 206);
    c.fillStyle = "#63b3ed";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText(
      "32-BIT GENERAL REGISTERS (GPR R0–R7) & PACKED-DECIMAL ACCUMULATOR",
      34,
      312,
    );
    c.font = '600 15px "JetBrains Mono", monospace';
    for (let r = 0; r < 8; r++) {
      const col = r % 2;
      const row = r >> 1;
      const gx = 36 + col * 290;
      const gy = 342 + row * 32;
      c.fillStyle = "#cbd5e1";
      c.fillText(`R${r}: 0x${bt(sim.regs[r] >>> 0, 8)} (${sim.regs[r]})`, gx, gy);
    }
    c.fillStyle = "#fbbf24";
    c.fillText(
      `PACKED BCD: ${sim.bcdHex()}  ($${(sim.decAcc / 100).toFixed(2)})  INST: ${sim.lastInst || "IDLE"}`,
      36,
      476,
    );

    // Autonomous I/O Channel Status Box (0x180 Tape, 0x190 Disk, 0x00E Printer)
    c.fillStyle = "#0b0e13";
    c.fillRect(646, 286, 358, 206);
    c.strokeStyle = "#b8292f";
    c.strokeRect(646, 286, 358, 206);
    c.fillStyle = "#fca5a5";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText("SELECTOR & MULTIPLEXOR CHANNELS", 662, 312);
    const chEntries = [
      [0x180, "CH1 0x180 2401 TAPE"],
      [0x190, "CH2 0x190 2311 DISK"],
      [0x00e, "MPX 0x00E 1403 PRNT"],
    ];
    chEntries.forEach(([id, title], idx) => {
      const ch = sim.channels[id];
      const cy = 346 + idx * 46;
      c.fillStyle = ch.busy > 0 ? "#34d399" : "#94a3b8";
      c.font = '700 14px "JetBrains Mono", monospace';
      c.fillText(`${title}: ${ch.busy > 0 ? "ACTIVE CCW" : "READY     "}`, 662, cy);
      c.fillStyle = "#cbd5e1";
      c.font = '500 13px "JetBrains Mono", monospace';
      c.fillText(`Recs=${ch.records} · Bytes=${ch.bytes}`, 662, cy + 19);
    });
    panelSurf.tex.needsUpdate = true;
  }

  function drawLinePrinter() {
    if (!printSurf) return;
    const c = printSurf.ctx;
    c.fillStyle = "#eef5e6";
    c.fillRect(0, 0, 512, 384);
    // Classic green-bar fanfold tractor-feed stripes
    for (let y = 0; y < 384; y += 32) {
      if ((y / 32) % 2 === 0) {
        c.fillStyle = "#d5ecd0";
        c.fillRect(0, y, 512, 16);
      }
    }
    c.fillStyle = "#1a202c";
    c.font = '700 15px "JetBrains Mono", monospace';
    c.fillText("IBM 1403 CHAIN PRINTER · OS/360 SYSOUT=A", 18, 24);
    const lines = sim.channels[0x00e].lines;
    c.font = '600 13px "JetBrains Mono", monospace';
    lines.slice(-8).forEach((ln, idx) => {
      c.fillText(ln.slice(0, 44), 18, 58 + idx * 36);
    });
    printSurf.tex.needsUpdate = true;
  }

  const machine = {
    id: "s360",
    era: "1964",
    short: "IBM S/360 ★",
    name: "IBM System/360 Model 50 Mainframe",
    group: "servers",
    capital: true,
    view0: 0.35,
    blurb:
      "Capital breakthrough of enterprise computing (April 7, 1964): Gene Amdahl, Fred Brooks, and Gerrit Blaauw standardized the 8-bit byte, 32-bit general registers, microcoded ISA family compatibility across models, storage protection keys, and autonomous I/O Channel processors executing Channel Command Words (CCWs) concurrently with the CPU.",
    diagram: {
      nodes: [
        { id: "ros", label: "ROS Microcode", x: 0.16, y: 0.22, color: "#ffb347" },
        { id: "cpu", label: "32b ALU + BCD", x: 0.44, y: 0.22, color: "#ff5f5f" },
        { id: "core", label: "Core + Keys", x: 0.44, y: 0.56, color: "#58c4ff" },
        { id: "chan", label: "CCW Channels", x: 0.75, y: 0.38, color: "#5fe08a" },
        { id: "tape", label: "2401 Tape", x: 0.18, y: 0.82, color: "#7ab0ff" },
        { id: "disk", label: "2311 Disk", x: 0.54, y: 0.84, color: "#c08cff" },
        { id: "prn", label: "1403 Printer", x: 0.86, y: 0.82, color: "#ffd166" },
      ],
      edges: [
        ["ros", "cpu", "uWord"],
        ["cpu", "core", "32b"],
        ["cpu", "chan", "SIO"],
        ["chan", "core", "DMA"],
        ["chan", "tape", "0x180"],
        ["chan", "disk", "0x190"],
        ["chan", "prn", "0x00E"],
      ],
    },
    build(kit) {
      tapeReels = [];
      dials = [];
      // Raised computer-room floor plinth
      kit.box(4.4, 0.09, 2.55, U.metal(0x1f2530, 0.55), [0, 0.045, 0], {
        name: "Raised Computer-Room Plinth",
        info: "Perforated raised plenum floor carrying chilled airflow and thick grey bus-and-tag I/O channel cables between the 2050 CPU and peripherals.",
      });

      // 1. CENTRAL IBM 2050 CPU & OPERATOR CONSOLE
      const cpuGrp = kit.group([0, 0.09, -0.18], {
        name: "IBM 2050 CPU Frame",
        info: "Central Processing Unit housing Solid Logic Technology (SLT) hybrid ceramic modules, 2,816-word Capacitor Read-Only Storage (ROS), and magnetic core memory.",
      });
      // Outer scarlet/horizon-blue/charcoal doors (shell: true for cutaway!)
      kit.box(
        1.92,
        1.68,
        0.78,
        U.metal(0x252a34, 0.42),
        [0, 0.84, 0],
        {
          name: "System/360 Outer Enclosure",
          info: " Eliot Noyes industrial-design steel frame in charcoal and scarlet red; cutaway reveals the SLT logic gates, ROS microcode planes, and magnetic core stack.",
          shell: true,
          explode: [0, 0.35, -0.55],
        },
        cpuGrp,
      );
      kit.box(
        0.56,
        1.54,
        0.8,
        U.plastic(0xb8292f, 0.38),
        [-0.64, 0.84, 0],
        {
          name: "Scarlet System Accent Panel",
          info: "Signature IBM System/360 scarlet industrial-design door panel.",
          shell: true,
          explode: [-0.45, 0.2, 0.45],
        },
        cpuGrp,
      );

      // Internal SLT Swing-Out Gate Backplanes + Capacitor ROS + Core Memory Stack
      for (let g = 0; g < 3; g++) {
        const pcb = kit.box(
          0.52,
          1.18,
          0.024,
          U.pcb(0x1e5631),
          [-0.54 + g * 0.54, 0.88, -0.12],
          {
            name: `SLT Hybrid Logic Gate ${g + 1}`,
            info: "IBM Solid Logic Technology (SLT) 0.5-inch alumina ceramic hybrid modules with flip-chip silicon transistors and screen-printed silver-palladium resistors.",
            explode: [(g - 1) * 0.35, 0.28, 0],
          },
          cpuGrp,
        );
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 3; c++) {
            kit.box(
              0.085,
              0.085,
              0.018,
              U.ceramic(0xe8e2d5),
              [-0.16 + c * 0.16, -0.38 + r * 0.24, 0.02],
              {},
              pcb,
            );
          }
        }
      }
      kit.box(
        0.78,
        0.44,
        0.28,
        U.copper(),
        [0.38, 0.42, 0.14],
        {
          name: "Capacitor ROS Microcode Store",
          info: "2,816-word × 90-bit Read-Only Storage (ROS): etched Mylar capacitor planes store microinstructions so Models 30 through 75 share one identical S/360 ISA.",
          live: () => `ROS 0x${bt(sim.rosAddr, 3)} · ${sim.rosPhase}`,
          explode: [0.4, -0.1, 0.35],
        },
        cpuGrp,
      );
      kit.box(
        0.72,
        0.46,
        0.32,
        U.darkAnodized(0x19212c),
        [-0.42, 0.42, 0.14],
        {
          name: "Magnetic Core Storage & Keys",
          info: "256 KB ferrite core storage with 2.0 µs cycle time and 4-bit hardware Storage Protection Keys per 2 KB block for multiprogramming isolation.",
          live: () => `Key=${sim.psw.key} · Net=$${sim.mem[132]}`,
          explode: [-0.4, -0.1, 0.35],
        },
        cpuGrp,
      );

      // Sloped Operator Console + Lamp Matrix + 4 Hex Rotary Dials + 1052 Console Keyboard
      panelSurf = zi(
        kit,
        1.24,
        0.62,
        [0.24, 1.16, 0.43],
        [1024, 512],
        {
          rot: [-0.14, 0, 0],
          name: "Model 50 Roller & Lamp Console",
          info: "Incandescent lamp display of the 64-bit Program Status Word (PSW), ROS microcode address, 32-bit data paths, and selector/multiplexor I/O channels.",
          live: () => `PSW PC=${sim.psw.pc} CC=${sim.psw.cc} BCD=${sim.bcdHex()}`,
        },
        cpuGrp,
      );
      for (let d = 0; d < 4; d++) {
        const knob = Om(
          kit,
          [-0.22 + d * 0.16, 0.76, 0.41],
          {
            r: 0.042,
            name: "Hexadecimal Address Selector Dial",
            info: "16-position rotary hexadecimal switch for manual storage inspection and Initial Program Load (IPL) device selection.",
          },
          cpuGrp,
        );
        dials.push(knob);
      }
      // Emergency Pull Switch
      kit.cyl(
        0.026,
        0.022,
        0.055,
        U.plastic(0xd92626, 0.3),
        [0.76, 0.78, 0.42],
        {
          rot: [Math.PI / 2, 0, 0],
          name: "Emergency Pull Switch",
          info: "Iconic scarlet Emergency Pull knob on every System/360 operator panel.",
        },
        cpuGrp,
      );

      // Desk shelf + IBM 1052 Console Printer-Keyboard
      kit.box(
        1.18,
        0.045,
        0.52,
        U.plastic(0xdad4c6, 0.45),
        [0.18, 0.66, 0.68],
        {
          name: "Operator Console Desk",
          info: "Laminated operator console table supporting the IBM 1052 Selectric console typewriter.",
        },
        cpuGrp,
      );
      buildSculptedKeyboard(
        kit,
        [0.18, 0.685, 0.72],
        {
          w: 0.52,
          d: 0.22,
          bodyColor: 0x3b4252,
          keyColor: 0xe5e0d3,
          name: "IBM 1052 Console Selectric",
          info: "Golf-ball Selectric operator console used by OS/360 operators to reply to mount requests and inspect job logs.",
        },
        cpuGrp,
      );

      // 2. DUAL IBM 2401 9-TRACK VACUUM-COLUMN MAGNETIC TAPE DRIVES (Left)
      for (let tIdx = 0; tIdx < 2; tIdx++) {
        const tx = -1.62 + tIdx * 0.56;
        const tGrp = kit.group([tx, 0.09, -0.08], {
          name: `IBM 2401 9-Track Tape Drive ${tIdx + 1}`,
          info: "800 BPI 9-track magnetic tape unit (8 bits + 1 parity = 1 S/360 byte per frame!) with pneumatic vacuum columns decoupling high-inertia reels from fast start/stop capstans.",
          live: () =>
            `CH 0x180 · Recs=${sim.channels[0x180].records} · Bytes=${sim.channels[0x180].bytes}`,
          explode: [-0.45, 0, 0],
        });
        kit.box(
          0.5,
          1.62,
          0.64,
          U.plastic(0x2b6cb0, 0.42),
          [0, 0.81, 0],
          {
            shell: true,
            name: "2401 Horizon-Blue Tape Cabinet",
            info: "Steel 2401 tape cabinet finished in IBM Horizon Blue.",
          },
          tGrp,
        );
        kit.box(
          0.44,
          0.62,
          0.02,
          U.glass(0xdaf0ff, 0.26),
          [0, 1.22, 0.33],
          {
            shell: true,
            name: "Tape Transport Glass Window",
            info: "Dust-sealed viewing window over the supply and take-up 10.5-inch magnetic tape reels.",
          },
          tGrp,
        );
        // Supply & Take-up reels
        for (const rx of [-0.11, 0.11]) {
          const reel = kit.cyl(
            0.095,
            0.095,
            0.026,
            rx < 0 ? U.alu() : U.plastic(0xb8292f, 0.35),
            [rx, 1.24, 0.31],
            {
              rot: [Math.PI / 2, 0, 0],
              name: "10.5-inch 9-Track Tape Reel",
              info: "Half-inch ferric-oxide magnetic tape reel spinning during autonomous Selector Channel CCW transfers.",
            },
            tGrp,
          );
          tapeReels.push(reel);
        }
        // Dual vertical vacuum columns
        for (const vx of [-0.12, 0.12]) {
          kit.box(
            0.085,
            0.58,
            0.04,
            U.glass(0x90cdf4, 0.32),
            [vx, 0.56, 0.31],
            {
              name: "Pneumatic Vacuum Column",
              info: "Low-pressure vacuum column buffers a slack loop of magnetic tape so capstans accelerate tape in milliseconds without snapping it.",
            },
            tGrp,
          );
        }
      }

      // 3. IBM 2311 DISK STORAGE DRIVE & IBM 1403 CHAIN PRINTER (Right)
      const diskGrp = kit.group([1.36, 0.09, -0.05], {
        name: "IBM 2311 Disk Storage Drive",
        info: "Removable IBM 1316 Disk Pack (6 platters, 10 recording surfaces, 7.25 MB capacity) with hydraulic comb-type voice-coil head actuator.",
        live: () =>
          `CH 0x190 · Cyl=${sim.channels[0x190].cyl} · Recs=${sim.channels[0x190].records}`,
        explode: [0.42, 0, -0.15],
      });
      kit.box(0.62, 0.96, 0.66, U.plastic(0xd8d2c5, 0.45), [0, 0.48, 0], {}, diskGrp);
      diskPlatters = kit.cyl(
        0.19,
        0.19,
        0.14,
        U.copper(),
        [0, 1.05, 0],
        {
          name: "IBM 1316 Removable Disk Pack",
          info: "Six 14-inch iron-oxide coated aluminum platters spinning at 2,400 RPM.",
        },
        diskGrp,
      );
      diskArm = kit.box(
        0.18,
        0.028,
        0.04,
        U.steel(),
        [0.14, 1.06, 0.08],
        {
          name: "Comb Access Actuator Arm",
          info: "Moves all 10 read/write heads simultaneously across 200 concentric cylinders.",
        },
        diskGrp,
      );
      kit.cyl(
        0.24,
        0.25,
        0.22,
        U.glass(0xdff3ff, 0.28),
        [0, 1.07, 0],
        {
          shell: true,
          name: "1316 Acrylic Dust Cover",
          info: "Clear protective cover locking onto the top-loading 1316 disk spindle.",
        },
        diskGrp,
      );

      // IBM 1403 Chain Line Printer
      const prnGrp = kit.group([1.56, 0.09, 0.72], {
        name: "IBM 1403 Model N1 Chain Printer",
        info: "1,100 line-per-minute impact printer using a horizontally revolving type chain and 132 magnetically actuated hammers.",
        live: () => `MPX 0x00E · Lines=${sim.channels[0x00e].records}`,
        explode: [0.5, 0, 0.35],
      });
      kit.box(0.74, 0.92, 0.56, U.plastic(0x2b6cb0, 0.44), [0, 0.46, 0], {}, prnGrp);
      printSurf = zi(
        kit,
        0.56,
        0.38,
        [0, 1.05, 0.02],
        [512, 384],
        {
          rot: [-0.65, 0, 0],
          name: "1403 Green-Bar Fanfold Output",
          info: "Live 132-column continuous tractor-feed printout produced via Multiplexor Channel 0x00E.",
        },
        prnGrp,
      );

      // Bus-and-Tag grey channel trunk cables linking CPU to Tape & Disk
      Dt(
        kit,
        [
          [-0.6, 0.14, -0.25],
          [-1.35, 0.13, -0.22],
        ],
        0.024,
        0x64748b,
        {
          name: "Bus-and-Tag Channel Cable",
          info: "Heavy multi-coax copper Bus (data) and Tag (handshake) cable protocol standardized by S/360 and used in data centers for 35 years.",
        },
      );
      Dt(
        kit,
        [
          [0.7, 0.14, -0.2],
          [1.36, 0.13, -0.1],
        ],
        0.024,
        0x64748b,
        {},
      );

      drawConsolePanel();
      drawLinePrinter();
    },

    ui(el, ctx) {
      const progNames = Object.keys(S360_PROGRAMS);
      let editor = null;
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("pc", `0x${bt(sim.psw.pc * 4, 4)} (CC=${sim.psw.cc})`);
        statsUi.set("ros", `0x${bt(sim.rosAddr, 3)} ${sim.rosPhase}`);
        statsUi.set("bcd", `$${(sim.decAcc / 100).toFixed(2)} (${sim.bcdHex()})`);
        statsUi.set("r2r4", `Gross=$${sim.regs[2]} Net=$${sim.regs[4]}`);
        statsUi.set("ovlp", `${sim.ioOverlappedCycles} cyc`);
        statsUi.set(
          "io",
          `T:${sim.channels[0x180].records} D:${sim.channels[0x190].records} P:${sim.channels[0x00e].records}`,
        );
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      statsUi = Pt([
        ["pc", "PSW Addr / CC"],
        ["ros", "ROS Microcode"],
        ["bcd", "Packed BCD"],
        ["r2r4", "GPR Payroll"],
        ["ovlp", "CPU‖I/O Overlap"],
        ["io", "Channel Recs"],
      ]);

      editor = Ht(
        sim.src,
        (txt) => {
          sim.loadProgram(txt);
          drawConsolePanel();
          drawLinePrinter();
          syncStats();
        },
        10,
      );

      el.append(
        Ie(
          "System/360 Console & Autonomous Channel I/O",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step Inst", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.step();
              hi("clack", { min: 0.04 });
              drawConsolePanel();
              drawLinePrinter();
              syncStats();
            }),
            st(
              progNames.map((k) => [k, k]),
              progNames[0],
              (k) => {
                editor.value = S360_PROGRAMS[k];
                sim.loadProgram(S360_PROGRAMS[k]);
                drawConsolePanel();
                drawLinePrinter();
                syncStats();
              },
            ),
          ),
          q(
            "div",
            { class: "row" },
            Fe("SIO 0x180 Tape", () => {
              sim.channels[0x180].busy = 6;
              if (ctx.diagram) ctx.diagram.pulse("chan", "tape", "#7ab0ff");
              hi("tape", { min: 0.08 });
            }),
            Fe("SIO 0x190 Disk", () => {
              sim.channels[0x190].busy = 5;
              if (ctx.diagram) ctx.diagram.pulse("chan", "disk", "#c08cff");
              hi("seek", { d: 0.4, min: 0.08 });
            }),
            Fe("SIO 0x00E Print", () => {
              sim.channels[0x00e].busy = 3;
              if (ctx.diagram) ctx.diagram.pulse("chan", "prn", "#ffd166");
              hi("tty", { min: 0.08 });
            }),
          ),
          statsUi,
        ),
        Ie("S/360 Assembler (LA, L, ST, AR, SR, AP, CR, BNE, SIO, SVC)", editor),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (diskPlatters) diskPlatters.rotation.y += dt * 18;
      if (running) {
        stepAcc += dt * 7.5;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          const ev = sim.step();
          if (ev && ctx.diagram) {
            ctx.diagram.pulse("ros", "cpu", "#ffb347");
            if (ev.op === "L" || ev.op === "ST")
              ctx.diagram.pulse("cpu", "core", "#58c4ff");
            if (ev.op === "SIO") ctx.diagram.pulse("cpu", "chan", "#5fe08a");
          }
          if (sim.channels[0x180].busy > 0 && ctx.diagram) {
            ctx.diagram.pulse("chan", "tape", "#7ab0ff");
          }
          if (sim.channels[0x190].busy > 0 && ctx.diagram) {
            ctx.diagram.pulse("chan", "disk", "#c08cff");
          }
          if (sim.channels[0x00e].busy > 0 && ctx.diagram) {
            ctx.diagram.pulse("chan", "prn", "#ffd166");
          }
          drawConsolePanel();
          drawLinePrinter();
          if (machine._syncStats) machine._syncStats();
        }
      }
      tapeReels.forEach((r, idx) => {
        r.rotation.y = sim.channels[0x180].reelAng * (idx % 2 ? -1 : 1);
      });
      if (diskArm) {
        diskArm.position.x = 0.11 + (sim.channels[0x190].cyl / 200) * 0.06;
      }
      dials.forEach((d, i) => {
        if (d.userData.pivot) {
          d.userData.pivot.rotation.z = (((sim.rosAddr >> (i * 2)) & 3) - 1.5) * 0.55;
        }
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const probe = new S360System();
      for (let i = 0; i < 90 && !probe.psw.halted; i++) probe.step();
      return {
        ok: probe.psw.halted && probe.regs[2] === 29100 && probe.ioOverlappedCycles > 0,
        net: probe.mem[132],
        bcd: probe.bcdHex(),
      };
    },
  };
  return machine;
}

function makeMachineUnix70() {
  const sim = new UnixPdp11System();
  let running = true;
  let stepAcc = 0;
  let vtMon = null;
  let addrBank = null;
  let dataBank = null;
  let toggles = [];
  let rpPlatter = null;
  let statsUi = null;

  function drawVt100() {
    if (!vtMon) return;
    const c = vtMon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#061109";
    c.fillRect(0, 0, W, H);
    // Subtle P31 green phosphor scanlines
    c.fillStyle = "rgba(52, 255, 120, 0.04)";
    for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);

    c.fillStyle = "#4ade80";
    c.font = '700 22px "JetBrains Mono", monospace';
    c.fillText("DEC VT100 · BELL LABS UNIX V6 · /dev/tty0 (9600 BAUD)", 28, 42);
    c.strokeStyle = "#166534";
    c.lineWidth = 2;
    c.strokeRect(20, 58, W - 40, 410);

    c.font = '600 19px "JetBrains Mono", monospace';
    sim.termLines.slice(-11).forEach((ln, idx) => {
      c.fillStyle = ln.startsWith("#") ? "#86efac" : "#34d399";
      c.fillText(ln.slice(0, 68), 36, 94 + idx * 33);
    });

    // Bottom Kernel/User APR MMU & Process Scheduler Inspector
    c.fillStyle = "#071a10";
    c.fillRect(20, 486, W - 40, 256);
    c.strokeRect(20, 486, W - 40, 256);
    c.fillStyle = "#a7f3d0";
    c.font = '700 17px "JetBrains Mono", monospace';
    c.fillText(
      `MMU MODE: ${sim.psw.mode}  |  22-BIT PHYS: 0${Kn(sim.addrLights, 8)}  |  SYSCALLS: ${sim.syscalls}  |  PIPE: ${sim.pipeBytes} B`,
      34,
      516,
    );
    c.font = '600 15px "JetBrains Mono", monospace';
    sim.procs.slice(0, 6).forEach((p, idx) => {
      const py = 552 + idx * 30;
      const active = idx === sim.curIdx;
      c.fillStyle = active ? "#fef08a" : "#4ade80";
      c.fillText(
        `${active ? "▶" : " "} PID ${String(p.pid).padStart(2)}  PPID ${String(p.ppid).padStart(2)}  ${p.state.padEnd(4)}  CPU ${String(p.cpu).padStart(4)}  ${p.name}`,
        36,
        py,
      );
    });
    vtMon.tex.needsUpdate = true;
  }

  const machine = {
    id: "unix70",
    era: "1973",
    short: "PDP-11 / UNIX",
    name: "DEC PDP-11/70 · UNIX v6, C & ARPANET Server",
    group: "servers",
    view0: 0.32,
    blurb:
      "Where modern operating systems, C, and network daemons were born: Ken Thompson and Dennis Ritchie rewrote UNIX in portable C on the 16-bit DEC PDP-11 (1973), unifying processes (fork/exec), streams & pipes (|), hierarchical inodes (everything-is-a-file), Kernel/User MMU Active Page Registers, and ARPANET IMP packet sockets.",
    diagram: {
      nodes: [
        { id: "cpu", label: "KB11-C 16b CPU", x: 0.2, y: 0.24, color: "#ff6bd6" },
        { id: "mmu", label: "APR 22b MMU", x: 0.52, y: 0.24, color: "#ffb347" },
        { id: "core", label: "Core + Cache", x: 0.82, y: 0.24, color: "#58c4ff" },
        { id: "uni", label: "UNIBUS / TRAP", x: 0.42, y: 0.56, color: "#5fe08a" },
        { id: "rp04", label: "RP04 Inodes", x: 0.16, y: 0.84, color: "#c08cff" },
        { id: "vt", label: "VT100 Shell", x: 0.52, y: 0.84, color: "#4ade80" },
        { id: "imp", label: "ARPANET IMP", x: 0.84, y: 0.84, color: "#38bdf8" },
      ],
      edges: [
        ["cpu", "mmu", "16b VA"],
        ["mmu", "core", "22b PA"],
        ["cpu", "uni", "TRAP"],
        ["uni", "rp04", "MASSBUS"],
        ["uni", "vt", "DZ11"],
        ["uni", "imp", "NCP"],
      ],
    },
    build(kit) {
      toggles = [];
      kit.box(3.8, 0.08, 2.2, U.metal(0x1d232d, 0.55), [0, 0.04, 0], {
        name: "Machine-Room Floor Deck",
        info: "Antistatic machine-room tile floor supporting the PDP-11/70 cabinet, RP04 disk drive, and VT100 terminal desk.",
      });

      // 1. DEC PDP-11/70 H960 CABINET (Left-Center)
      const cab = kit.group([-0.72, 0.08, -0.12], {
        name: "DEC PDP-11/70 H960 Cabinet",
        info: "Top-of-the-line 16-bit PDP-11 server featuring 2 KB bipolar parity cache, 22-bit physical addressing (up to 4 MB), UNIBUS, and high-speed 32-bit MASSBUS.",
      });
      kit.box(
        0.96,
        1.82,
        0.84,
        U.metal(0x232730, 0.44),
        [0, 0.91, 0],
        {
          shell: true,
          name: "H960 Steel Rack Enclosure",
          info: "19-inch DEC rack enclosure; cutaway exposes the KB11-C CPU hex boards, UNIBUS backplane, and core memory modules.",
          explode: [0, 0.35, -0.5],
        },
        cab,
      );

      // Internal KB11-C Hex PCB Modules + UNIBUS Backplane
      for (let b = 0; b < 6; b++) {
        Gs(
          kit,
          0.62,
          0.34,
          [0, 0.48 + b * 0.16, -0.06],
          {
            pcb: b < 3 ? 0x1b5e3a : 0x234e70,
            name:
              b < 3
                ? `KB11-C CPU & MMU Hex Board ${b + 1}`
                : `UNIBUS / MASSBUS Controller ${b - 2}`,
            info:
              b < 3
                ? "Schottky TTL hex-height module implementing the 8 general registers (R0–R7), PSW, and 16 Kernel/User Active Page Registers (APRs)."
                : "Asynchronous master/slave UNIBUS peripheral & MASSBUS DMA controller card.",
            explode: [-0.42, (b - 2.5) * 0.08, 0],
          },
          cab,
        );
      }

      // Iconic Burgundy/Plum & Cream PDP-11/70 Front Console Bezel
      const bezel = kit.group(
        [0, 1.32, 0.43],
        {
          name: "PDP-11/70 Programmer Console",
          info: "Iconic plum/magenta and lavender-grey octal blinkenlight console displaying 22-bit physical addresses, 16-bit data/register contents, and Kernel/Super/User MMU state.",
          explode: [0, 0.1, 0.42],
        },
        cab,
      );
      kit.box(0.88, 0.42, 0.06, U.plastic(0xd8d2c5, 0.42), [0, 0, 0], {}, bezel);
      kit.box(0.84, 0.16, 0.065, U.plastic(0x7c1d46, 0.36), [0, 0.09, 0.004], {}, bezel);
      Nt(
        kit,
        "digital · pdp 11/70",
        0.44,
        0.048,
        [-0.18, 0.15, 0.04],
        { color: "#f8fafc", bg: "#7c1d46" },
        bezel,
      );

      addrBank = fs(
        kit,
        22,
        [0, 0.08, 0.042],
        0.033,
        0xff3b3b,
        {
          r: 0.009,
          name: "22-Bit Physical Address Blinkenlights",
          info: "Displays the live 22-bit physical address output by the Kernel/User APR Memory Management Unit.",
          live: () => `PA = 0${Kn(sim.addrLights, 8)} (${sim.psw.mode})`,
        },
        bezel,
      );
      dataBank = fs(
        kit,
        16,
        [-0.09, 0.02, 0.042],
        0.034,
        0xffa62b,
        {
          r: 0.009,
          name: "16-Bit Data Paths Register Lamps",
          info: "Displays the active 16-bit PDP-11 word across UNIBUS / ALU paths.",
          live: () => `DATA = 0${Kn(sim.dataLights, 6)}`,
        },
        bezel,
      );

      // 18 Octal-Grouped Bat/Paddle Switches
      for (let s = 0; s < 18; s++) {
        const isMagenta = Math.floor(s / 3) % 2 === 0;
        const sw = Ba(
          kit,
          [-0.36 + s * 0.041, -0.14, 0.034],
          {
            mat: U.plastic(isMagenta ? 0x9d2256 : 0xa37acc, 0.35),
            name: "Octal Console Switch",
            info: "Grouped in octal triads (3 bits per octal digit) matching PDP-11 instruction encoding.",
          },
          bezel,
        );
        toggles.push(sw);
      }
      Om(
        kit,
        [0.34, 0.02, 0.04],
        { r: 0.032, name: "Register Display Selector Knob" },
        bezel,
      );

      // 2. DEC RP04 MOVING-HEAD DISK PACK DRIVE (Far Left)
      const rpGrp = kit.group([-1.52, 0.08, 0.05], {
        name: "DEC RP04 88 MB Disk Pack Drive",
        info: "MASSBUS high-speed removable disk pack holding the UNIX v6 root superblock, inode table, /usr/sys C kernel source, and swap space.",
        live: () => `${sim.inodes.length} active root inodes · MASSBUS DMA`,
        explode: [-0.45, 0, 0.15],
      });
      kit.box(0.58, 0.94, 0.64, U.plastic(0xd8d2c5, 0.46), [0, 0.47, 0], {}, rpGrp);
      rpPlatter = kit.cyl(
        0.18,
        0.18,
        0.11,
        U.copper(),
        [0, 1.0, 0],
        {
          name: "RP04 Oxide Disk Pack",
          info: "3,600 RPM disk pack storing 512-byte UNIX blocks indexed by 13-pointer inode structures.",
        },
        rpGrp,
      );
      kit.cyl(
        0.22,
        0.23,
        0.16,
        U.glass(0xdaf0ff, 0.28),
        [0, 1.02, 0],
        {
          shell: true,
          name: "RP04 Top Window Shroud",
        },
        rpGrp,
      );

      // 3. VT100 VIDEO TERMINAL DESK + BBN ARPANET IMP INTERFACE (Right)
      const desk = kit.group([0.68, 0.08, 0.1], {
        name: "Operator Terminal & ARPANET Station",
        info: "Interactive RS-232 serial UNIX shell terminal plus BBN Interface Message Processor (IMP) host trunk.",
      });
      kit.box(
        1.52,
        0.68,
        0.86,
        U.wood(),
        [0, 0.34, 0],
        {
          name: "Bell Labs Terminal Desk",
          info: "Oak laboratory bench holding the DEC VT100 CRT terminal and detached keyboard.",
        },
        desk,
      );
      vtMon = buildMonitor3D(
        kit,
        [-0.12, 0.68, -0.06],
        {
          w: 0.72,
          h: 0.54,
          crt: true,
          color: 0xd6cfc0,
          name: "DEC VT100 Green-Phosphor CRT",
          info: "ANSI X3.64 serial video terminal connected to PDP-11 DZ11 multiplexer at 9600 baud.",
          live: () => `PID ${sim.procs[sim.curIdx].pid} (${sim.procs[sim.curIdx].name})`,
          explode: [0, 0.3, 0],
        },
        desk,
      );
      buildSculptedKeyboard(
        kit,
        [-0.12, 0.69, 0.28],
        {
          w: 0.56,
          d: 0.21,
          bodyColor: 0xd6cfc0,
          keyColor: 0x32363e,
          legendColor: "#f8fafc",
          name: "VT100 Detached Keyboard",
          info: "Microprocessor-scanned serial keyboard with audible keyclick.",
        },
        desk,
      );
      // ARPANET Host-IMP Modem Box
      kit.box(
        0.38,
        0.44,
        0.48,
        U.metal(0x2b3a4a, 0.42),
        [0.52, 0.9, -0.08],
        {
          name: "ARPANET Host-IMP Interface",
          info: "1822 Host-to-IMP full-duplex packet interface connecting UNIX daemons (ncpd / early TCP-IP) to the 50 kbps ARPANET backbone.",
          live: () => `ARPANET pkts=${sim.arpanetPkts}`,
          explode: [0.35, 0.2, 0],
        },
        desk,
      );

      drawVt100();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("mode", `${sim.psw.mode} · PC=0${Kn(sim.regs[7], 6)}`);
        statsUi.set("phys", `0${Kn(sim.addrLights, 8)}`);
        statsUi.set(
          "proc",
          `PID ${sim.procs[sim.curIdx].pid} ${sim.procs[sim.curIdx].name}`,
        );
        statsUi.set("sys", `${sim.syscalls} traps / ${sim.ctxSwitches} swtch`);
        statsUi.set("pipe", `${sim.pipeBytes} B`);
        statsUi.set("arpa", `${sim.arpanetPkts} pkts`);
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      statsUi = Pt([
        ["mode", "MMU Mode / PC"],
        ["phys", "22-Bit Phys Addr"],
        ["proc", "Running Process"],
        ["sys", "TRAPs & Switches"],
        ["pipe", "UNIX Pipe I/O"],
        ["arpa", "ARPANET IMP"],
      ]);

      const cmdInput = q("input", {
        type: "text",
        value: "cat /usr/sys/ken/slp.c | wc -l",
        style: {
          flex: "1",
          background: "#0b121b",
          color: "#86efac",
          border: "1px solid #233246",
          borderRadius: "6px",
          padding: "5px 8px",
          fontFamily: '"JetBrains Mono", monospace',
        },
      });
      const execCmd = (str) => {
        sim.execCommand(str);
        if (ctx.diagram) {
          ctx.diagram.pulse("vt", "uni", "#4ade80");
          ctx.diagram.pulse("uni", "rp04", "#c08cff");
        }
        hi("key", { ibm: "F", min: 0.04 });
        drawVt100();
        syncStats();
      };

      el.append(
        Ie(
          "UNIX Sixth Edition Shell, APR MMU & Pipes",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step TRAP/Inst", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.step();
              hi("toggle", { min: 0.04 });
              drawVt100();
              syncStats();
            }),
            Fe("ps", () => execCmd("ps")),
            Fe("ls -i", () => execCmd("ls -i")),
            Fe("fork()", () => execCmd("fork")),
            Fe("pipe |", () => execCmd("cat /etc/passwd | wc")),
          ),
          q(
            "div",
            { class: "row" },
            cmdInput,
            Fe("Run #", () => execCmd(cmdInput.value), "pri"),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (rpPlatter) rpPlatter.rotation.y += dt * 22;
      if (running) {
        stepAcc += dt * 8;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          const ev = sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("cpu", "mmu", "#ff6bd6");
            ctx.diagram.pulse("mmu", "core", "#58c4ff");
            if (ev.event === "TRAP") {
              ctx.diagram.pulse("cpu", "uni", "#5fe08a");
              ctx.diagram.pulse("uni", "vt", "#4ade80");
            }
            if (ev.event === "SWTCH") {
              ctx.diagram.pulse("uni", "rp04", "#c08cff");
              ctx.diagram.pulse("uni", "imp", "#38bdf8");
            }
          }
          drawVt100();
          if (machine._syncStats) machine._syncStats();
        }
      }
      if (addrBank) Ki(addrBank, sim.addrLights);
      if (dataBank) Ki(dataBank, sim.dataLights);
      toggles.forEach((sw, i) => za(sw, (sim.addrLights >> i) & 1));
    },

    isRunning: () => running,
    sim,
    test() {
      const u = new UnixPdp11System();
      u.step();
      const out = u.execCommand("fork");
      return {
        ok:
          u.translateVirtual(0o020000, true) !== u.translateVirtual(0o020000, false) &&
          out.includes("child PID"),
        syscalls: u.syscalls,
      };
    },
  };
  return machine;
}

function makeMachineSun90() {
  const sim = new SmpMesiRaidServer();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let cpuLeds = [];
  let diskLeds = [];
  let statsUi = null;

  const mesiColor = { M: "#ef4444", E: "#f59e0b", S: "#10b981", I: "#475569" };
  const mesiHex = { M: 0xff3b3b, E: 0xffb347, S: 0x34d399, I: 0x263040 };

  function drawSunConsole() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#0b0f19";
    c.fillRect(0, 0, W, H);

    c.fillStyle = "#4c1d95";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#f8fafc";
    c.font = '700 21px "JetBrains Mono", monospace';
    c.fillText(
      `SUN SPARCCENTER 2000 · SOLARIS SMP + MESI SNOOPING BUS + RAID-5  (${sim.lastBus})`,
      28,
      46,
    );

    // 4-CPU x 4-Cache-Line MESI State Matrix
    c.fillStyle = "#111827";
    c.fillRect(20, 82, W - 40, 320);
    c.strokeStyle = "#6d28d9";
    c.lineWidth = 2;
    c.strokeRect(20, 82, W - 40, 320);
    c.fillStyle = "#c4b5fd";
    c.font = '700 17px "JetBrains Mono", monospace';
    c.fillText(
      "HARDWARE SNOOPING CACHE COHERENCE MATRIX (M=Modified, E=Exclusive, S=Shared, I=Invalid)",
      34,
      112,
    );

    for (let cpu = 0; cpu < 4; cpu++) {
      const cx = 36 + cpu * 240;
      c.fillStyle = "#1e293b";
      c.fillRect(cx, 130, 224, 254);
      c.fillStyle = "#e2e8f0";
      c.font = '700 16px "JetBrains Mono", monospace';
      c.fillText(`SuperSPARC CPU #${cpu}`, cx + 14, 158);
      for (let line = 0; line < 4; line++) {
        const entry = sim.caches[cpu][line];
        const ly = 176 + line * 48;
        c.fillStyle = mesiColor[entry.state];
        c.fillRect(cx + 12, ly, 42, 36);
        c.fillStyle = "#ffffff";
        c.font = '700 18px "JetBrains Mono", monospace';
        c.fillText(entry.state, cx + 26, ly + 25);
        c.fillStyle = "#cbd5e1";
        c.font = '600 14px "JetBrains Mono", monospace';
        c.fillText(`L${line}: val=${entry.val}`, cx + 64, ly + 24);
      }
    }

    // 5-Disk Hot-Swap SCSI RAID-5 XOR Parity Matrix
    c.fillStyle = "#111827";
    c.fillRect(20, 420, W - 40, 324);
    c.strokeStyle = "#0ea5e9";
    c.strokeRect(20, 420, W - 40, 324);
    c.fillStyle = "#7dd3fc";
    c.font = '700 17px "JetBrains Mono", monospace';
    c.fillText(
      `5-DISK SCSI RAID-5 ROTATED XOR PARITY ARRAY · Degraded XOR Reconstructs=${sim.stats.degradedReads}`,
      34,
      450,
    );

    for (let d = 0; d < 5; d++) {
      const disk = sim.disks[d];
      const dx = 36 + d * 192;
      c.fillStyle = disk.failed ? "#450a0a" : "#0f172a";
      c.fillRect(dx, 468, 176, 256);
      c.strokeStyle = disk.failed ? "#ef4444" : "#334155";
      c.strokeRect(dx, 468, 176, 256);
      c.fillStyle = disk.failed ? "#fca5a5" : "#34d399";
      c.font = '700 15px "JetBrains Mono", monospace';
      c.fillText(`SCSI DISK ${d} ${disk.failed ? "[FAULT!]" : "[ONLINE]"}`, dx + 10, 494);
      c.font = '600 13px "JetBrains Mono", monospace';
      for (let s = 0; s < 6; s++) {
        const isParity = s % 5 === d;
        c.fillStyle = disk.failed ? "#f87171" : isParity ? "#fbbf24" : "#cbd5e1";
        c.fillText(
          `S${s}: 0x${bt(disk.data[s], 2)} ${isParity ? "(P)" : "   "}`,
          dx + 14,
          524 + s * 28,
        );
      }
      c.fillStyle = "#94a3b8";
      c.fillText(`IOPS: ${disk.iops}`, dx + 14, 708);
    }
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "sun90",
    era: "1993",
    short: "SPARC SMP + RAID",
    name: "Sun SPARCcenter RISC SMP + MESI & RAID-5 Server",
    group: "servers",
    view0: 0.36,
    blurb:
      "The 1990s client-server & early World Wide Web backbone (1993): symmetric multiprocessing (SMP) RISC CPUs share uniform memory via a snooping MESI cache-coherence bus while hot-swappable SCSI RAID-5 arrays distribute block stripes and XOR parity so any failed disk is reconstructed on the fly with zero data loss.",
    diagram: {
      nodes: [
        { id: "c0", label: "SPARC CPU 0..1", x: 0.2, y: 0.2, color: "#c08cff" },
        { id: "c1", label: "SPARC CPU 2..3", x: 0.2, y: 0.52, color: "#a78bfa" },
        { id: "bus", label: "XDBus MESI Snoop", x: 0.52, y: 0.36, color: "#ffb347" },
        { id: "ram", label: "ECC DRAM", x: 0.84, y: 0.22, color: "#58c4ff" },
        { id: "raid", label: "5-Disk RAID-5 XOR", x: 0.54, y: 0.82, color: "#5fe08a" },
        { id: "net", label: "TCP/HTTP Daemon", x: 0.86, y: 0.72, color: "#38bdf8" },
      ],
      edges: [
        ["c0", "bus", "BusRd/Upgr"],
        ["c1", "bus", "Snoop"],
        ["bus", "ram", "64b ECC"],
        ["bus", "raid", "Fast SCSI"],
        ["bus", "net", "100BaseTX"],
      ],
    },
    build(kit) {
      cpuLeds = [];
      diskLeds = [];

      // 1. SUN SPARCCENTER TOWER CABINET IN SUN IRIS-PURPLE / SLATE
      const srv = kit.group([-0.52, 0, 0], {
        name: "Sun SPARCcenter 2000 Enterprise Cabinet",
        info: "Symmetric Multiprocessor (SMP) RISC server cabinet finished in Sun Microsystems iris-purple and dark slate.",
      });
      kit.box(
        1.16,
        1.66,
        0.98,
        U.plastic(0x3f395e, 0.44),
        [0, 0.83, 0],
        {
          shell: true,
          name: "Sun Iris-Purple Chassis Shell",
          info: "Cutaway reveals the central packet-switched XDBus backplane, 4 SuperSPARC CPU/cache boards, and 5 hot-swap SCSI RAID-5 bays.",
          explode: [-0.45, 0.25, 0],
        },
        srv,
      );
      Nt(
        kit,
        "Sun · SPARCcenter SMP",
        0.62,
        0.06,
        [0, 1.52, 0.5],
        { color: "#e9d5ff", bg: "#2e2849" },
        srv,
      );

      // Centerplane PCB + 4 SuperSPARC MBus/XDBus CPU Boards + Gold Heatspreaders + MESI LEDs
      kit.box(
        0.03,
        1.32,
        0.78,
        U.pcb(0x164e35),
        [-0.34, 0.88, 0],
        {
          name: "Packet-Switched XDBus Snooping Backplane",
          info: "High-bandwidth split-transaction snooping bus broadcasting BusRd, BusRdX, and BusUpgr coherence transactions across all SMP caches.",
        },
        srv,
      );

      for (let cpu = 0; cpu < 4; cpu++) {
        const y = 0.82 + cpu * 0.19;
        const board = Gs(
          kit,
          0.66,
          0.12,
          [0.02, y, -0.06],
          {
            pcb: 0x1d4d38,
            name: `SuperSPARC SMP CPU Module #${cpu}`,
            info: `32-bit SPARC V8 superscalar RISC processor with 1 MB external L2 cache participating in hardware MESI snooping coherence.`,
            live: () =>
              `CPU${cpu} lines: ` +
              sim.caches[cpu].map((c, i) => `L${i}=${c.state}`).join(" "),
            explode: [0.42, (cpu - 1.5) * 0.08, 0],
          },
          srv,
        );
        vn(
          kit,
          0.18,
          0.16,
          0.045,
          [0.06, 0.08, 0.02],
          {
            mat: U.gold(),
            name: "Gold Ceramic PGA Heatspreader",
            info: "Brazed gold-lid ceramic Pin Grid Array package cooling the SuperSPARC RISC die.",
          },
          board,
        );
        ps(
          kit,
          [-0.14, 0.04, 0.03],
          { len: 0.24, h: 0.07, name: "ECC SIMM Bank" },
          board,
        );
        const led = kit.sphere(
          0.018,
          U.glow(0x34d399, 1.3),
          [0.32, y + 0.06, 0.44],
          {
            name: `CPU #${cpu} MESI Coherence Lamp`,
            info: "Glows crimson (Modified), amber (Exclusive), emerald (Shared), or dim slate (Invalid).",
          },
          srv,
        );
        cpuLeds.push(led);
      }

      // 5 Hot-Swap Fast/Wide SCSI RAID-5 Drive Caddies across lower front
      for (let d = 0; d < 5; d++) {
        const dx = -0.4 + d * 0.2;
        const caddy = kit.group(
          [dx, 0.34, 0.34],
          {
            name: `Hot-Swap SCSI RAID-5 Drive ${d}`,
            info: "7,200 RPM Fast/Wide Differential SCSI hard drive storing striped data blocks and rotated XOR parity (D0 ⊕ D1 ⊕ D2 ⊕ D3 = P).",
            live: () =>
              `Disk ${d}: ${sim.disks[d].failed ? "FAILED (XOR degraded)" : "ONLINE"} · IOPS=${sim.disks[d].iops}`,
            explode: [0, -0.1, 0.42],
          },
          srv,
        );
        kit.box(0.17, 0.34, 0.28, U.darkAnodized(0x222733), [0, 0, 0], {}, caddy);
        kit.cyl(
          0.065,
          0.065,
          0.02,
          U.alu(),
          [0, 0.03, -0.02],
          { rot: [0, 0, Math.PI / 2] },
          caddy,
        );
        const dLed = kit.sphere(
          0.014,
          U.glow(0x34d399, 1.4),
          [0, 0.13, 0.148],
          {
            name: `RAID Drive ${d} Status LED`,
          },
          caddy,
        );
        diskLeds.push(dLed);
      }

      ni(kit, 0.13, [0, 1.36, -0.46], { name: "Redundant Server Blower" }, srv);

      // 2. SUN WORKSTATION OPERATOR CONSOLE (Right)
      const desk = kit.group([0.82, 0, 0.06], {
        name: "Sun Solaris Administration Console",
        info: "Graphical X11 / OpenWindows administration console monitoring SMP cache snooping and Veritas/Solstice DiskSuite RAID-5 status.",
      });
      kit.box(1.16, 0.66, 0.78, U.metal(0x282f3c, 0.5), [0, 0.33, 0], {}, desk);
      mon = buildMonitor3D(
        kit,
        [0, 0.66, -0.05],
        {
          w: 0.76,
          h: 0.56,
          crt: true,
          color: 0xd5d0c5,
          name: "Sun GDM-20D10 20-inch Trinitron CRT",
          info: "Live visualization of the 4-CPU MESI cache-line matrix and 5-disk SCSI RAID-5 XOR stripes.",
          explode: [0, 0.28, 0],
        },
        desk,
      );
      buildSculptedKeyboard(
        kit,
        [-0.08, 0.67, 0.26],
        { w: 0.48, d: 0.18, name: "Sun Type-5 Keyboard" },
        desk,
      );
      buildMouse3D(
        kit,
        [0.34, 0.67, 0.26],
        { retro: true, name: "Sun Optical 3-Button Mouse" },
        desk,
      );

      drawSunConsole();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        const total = sim.stats.hits + sim.stats.misses || 1;
        statsUi.set("bus", sim.lastBus);
        statsUi.set("hit", `${((sim.stats.hits / total) * 100).toFixed(1)}%`);
        statsUi.set(
          "snoop",
          `${sim.stats.snoops} snoops / ${sim.stats.invalidations} inv`,
        );
        const failedIdx = sim.disks.findIndex((d) => d.failed);
        statsUi.set(
          "raid",
          failedIdx >= 0 ? `DEGRADED (Disk ${failedIdx} XOR)` : "OPTIMAL (5/5)",
        );
        statsUi.set("xor", `${sim.stats.degradedReads} parity reads`);
        statsUi.set("http", `${sim.stats.httpReqs} reqs`);
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      statsUi = Pt([
        ["bus", "Last XDBus Op"],
        ["hit", "SMP Cache Hit"],
        ["snoop", "Snoops / Invals"],
        ["raid", "RAID-5 Array"],
        ["xor", "XOR Reconstructs"],
        ["http", "HTTP/SQL Reqs"],
      ]);

      el.append(
        Ie(
          "MESI Snooping Coherence & RAID-5 Fault Tolerance",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step Bus", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.step();
              drawSunConsole();
              syncStats();
            }),
            Fe("CPU0 Read L0", () => {
              sim.cpuAccess(0, 0, false);
              if (ctx.diagram) ctx.diagram.pulse("c0", "bus", "#c08cff");
              drawSunConsole();
              syncStats();
            }),
            Fe("CPU2 Write L0", () => {
              sim.cpuAccess(2, 0, true);
              if (ctx.diagram) ctx.diagram.pulse("c1", "bus", "#ef4444");
              drawSunConsole();
              syncStats();
            }),
          ),
          q(
            "div",
            { class: "row" },
            ...[0, 1, 2, 3, 4].map((d) =>
              Fe(`Fail Disk ${d}`, () => {
                sim.failDisk(d);
                hi("seek", { d: 0.8, min: 0.05 });
                drawSunConsole();
                syncStats();
              }),
            ),
            Fe(
              "Rebuild XOR",
              () => {
                sim.rebuildRaid();
                if (ctx.diagram) ctx.diagram.pulse("bus", "raid", "#5fe08a");
                hi("spinup", { min: 0.1 });
                drawSunConsole();
                syncStats();
              },
              "pri",
            ),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 4.5;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          const ev = sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse(ev.cpu < 2 ? "c0" : "c1", "bus", "#ffb347");
            ctx.diagram.pulse("bus", "raid", ev.raid.degraded ? "#ef4444" : "#5fe08a");
            if (sim.tick % 2 === 0) ctx.diagram.pulse("bus", "net", "#38bdf8");
          }
          drawSunConsole();
          if (machine._syncStats) machine._syncStats();
        }
      }
      cpuLeds.forEach((led, cpu) => {
        const st0 = sim.caches[cpu][0].state;
        led.material.color.setHex(mesiHex[st0]);
        led.material.emissive.setHex(mesiHex[st0]);
      });
      diskLeds.forEach((led, d) => {
        const failed = sim.disks[d].failed;
        const col = failed ? 0xff3b3b : 0x34d399;
        led.material.color.setHex(col);
        led.material.emissive.setHex(col);
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const s = new SmpMesiRaidServer();
      s.cpuAccess(0, 2, false);
      s.cpuAccess(1, 2, true, 99);
      const b0 = s.readRaidStripe(1, 3).value;
      s.failDisk(3);
      const b1 = s.readRaidStripe(1, 3);
      return {
        ok: s.caches[0][2].state === "I" && b1.degraded && b1.value === b0,
        recovered: b1.value,
      };
    },
  };
  return machine;
}

function makeMachineCloud10() {
  const sim = new CloudRaftCluster();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let sledBars = [];
  let statsUi = null;

  function drawCloudMonitor() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#070b14";
    c.fillRect(0, 0, W, H);

    const lid = sim.leaderId();
    const aliveCnt = sim.nodes.filter((n) => n.alive).length;
    c.fillStyle = aliveCnt >= 3 ? "#0c4a6e" : "#7f1d1d";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `HYPERSCALE RACK · RAFT CONSENSUS (${aliveCnt}/5 ALIVE · ${lid >= 0 ? "LEADER=N" + lid : "NO QUORUM!"}) · OPS=${sim.committedOps}`,
      28,
      46,
    );

    // Pentagon Raft Cluster Topology on Left
    const cx = 290,
      cy = 295,
      rad = 155;
    const pts = sim.nodes.map((_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
    });
    // RPC edges
    for (const rpc of sim.rpcs) {
      const [x0, y0] = pts[rpc.from];
      const [x1, y1] = pts[rpc.to];
      c.strokeStyle = rpc.type.includes("Vote") ? "#fbbf24" : "#38bdf8";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
    }
    sim.nodes.forEach((n, i) => {
      const [nx, ny] = pts[i];
      c.beginPath();
      c.arc(nx, ny, 44, 0, Math.PI * 2);
      c.fillStyle = !n.alive ? "#450a0a" : n.role === "LEADER" ? "#78350f" : "#0f172a";
      c.fill();
      c.lineWidth = 4;
      c.strokeStyle = !n.alive ? "#ef4444" : n.role === "LEADER" ? "#fbbf24" : "#38bdf8";
      c.stroke();
      c.fillStyle = "#ffffff";
      c.font = '700 16px "JetBrains Mono", monospace';
      c.fillText(`N${n.id}`, nx - 12, ny - 6);
      c.font = '600 12px "JetBrains Mono", monospace';
      c.fillStyle = !n.alive ? "#fca5a5" : "#bae6fd";
      c.fillText(!n.alive ? "DEAD" : n.role.slice(0, 6), nx - 22, ny + 13);
      c.fillText(`T${n.term} C${n.commitIndex}`, nx - 22, ny + 29);
    });

    // Replicated Raft State-Machine Log & Pod Telemetry on Right
    c.fillStyle = "#0f172a";
    c.fillRect(540, 84, 464, 410);
    c.strokeStyle = "#1e3a5f";
    c.lineWidth = 2;
    c.strokeRect(540, 84, 464, 410);
    c.fillStyle = "#38bdf8";
    c.font = '700 17px "JetBrains Mono", monospace';
    c.fillText("REPLICATED RAFT WAL LOG (QUORUM >= 3/5)", 558, 114);
    c.font = '600 15px "JetBrains Mono", monospace';
    sim.log.slice(-10).forEach((entry, idx) => {
      c.fillStyle = "#cbd5e1";
      c.fillText(`[Term ${entry.term}] ${entry.cmd}`, 558, 150 + idx * 32);
    });

    // Container CPU utilization bars along bottom
    c.fillStyle = "#0f172a";
    c.fillRect(20, 516, W - 40, 228);
    c.strokeRect(20, 516, W - 40, 228);
    c.fillStyle = "#34d399";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("OPEN-COMPUTE BLADE TELEMETRY & KUBERNETES POD SCHEDULER", 36, 546);
    sim.nodes.forEach((n, i) => {
      const bx = 36 + i * 192;
      c.fillStyle = "#94a3b8";
      c.font = '700 14px "JetBrains Mono", monospace';
      c.fillText(`BLADE N${i} (${n.pods} pods)`, bx, 582);
      c.fillStyle = "#1e293b";
      c.fillRect(bx, 598, 166, 26);
      c.fillStyle = n.alive ? "#38bdf8" : "#ef4444";
      c.fillRect(bx, 598, 166 * (n.alive ? n.cpuUtil : 1), 26);
      c.fillStyle = "#e2e8f0";
      c.fillText(n.alive ? `CPU ${(n.cpuUtil * 100).toFixed(0)}%` : "OFFLINE", bx, 652);
    });
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "cloud10",
    era: "2014",
    short: "Cloud Rack & Raft",
    name: "Warehouse-Scale Cloud Rack & Raft Consensus Cluster",
    group: "servers",
    view0: 0.34,
    blurb:
      "Barroso & Hölzle's 'The Datacenter as a Computer': commodity 1U dual-socket Xeon sleds powered by a shared 48V DC copper busbar and interconnected by non-blocking Clos Leaf-Spine 400GbE optics run container schedulers (Borg/Kubernetes) and Raft consensus so state survives node crashes without split-brain.",
    diagram: {
      nodes: [
        { id: "spine", label: "400G Clos Spine", x: 0.5, y: 0.14, color: "#38bdf8" },
        { id: "leaf", label: "ToR Optical Leaf", x: 0.5, y: 0.38, color: "#58c4ff" },
        { id: "lead", label: "Raft Leader Sled", x: 0.2, y: 0.68, color: "#fbbf24" },
        { id: "foll", label: "Quorum Followers", x: 0.52, y: 0.68, color: "#5fe08a" },
        { id: "nvme", label: "Replicated WAL", x: 0.84, y: 0.68, color: "#c08cff" },
        { id: "bus48", label: "48V DC Busbar", x: 0.5, y: 0.9, color: "#ff7a1a" },
      ],
      edges: [
        ["spine", "leaf", "ECMP"],
        ["leaf", "lead", "gRPC"],
        ["lead", "foll", "AppendEntries"],
        ["foll", "nvme", "fsync"],
        ["bus48", "lead", "48V"],
        ["bus48", "foll", "48V"],
      ],
    },
    build(kit) {
      sledBars = [];
      // 1. 42U OPEN-COMPUTE HYPERSCALE RACK (Left-Center)
      const rack = kit.group([-0.48, 0, 0], {
        name: "42U Open-Compute Hyperscale Rack",
        info: "21-inch Open Rack standard chassis with front cold-aisle serviceability, blind-mate 48V DC rear busbar, and top-of-rack optical Clos switching.",
      });
      // Outer perforated side shrouds (shell: true for cutaway!)
      kit.box(
        0.98,
        2.18,
        1.04,
        U.darkAnodized(0x161b24),
        [0, 1.09, 0],
        {
          shell: true,
          name: "Perforated Rack Containment Panels",
          info: "Cold-aisle / hot-aisle steel rack panels; cutaway exposes the 8 server sleds, QSFP-DD fiber harnesses, and rear 48V copper busbar.",
          explode: [-0.45, 0.2, 0],
        },
        rack,
      );
      // 4 structural corner posts
      for (const [px, pz] of [
        [-0.44, -0.46],
        [0.44, -0.46],
        [-0.44, 0.46],
        [0.44, 0.46],
      ]) {
        kit.box(0.05, 2.16, 0.05, U.steel(), [px, 1.08, pz], {}, rack);
      }
      // Rear 48V DC Solid Copper Busbar
      kit.box(
        0.08,
        2.02,
        0.035,
        U.copper(),
        [0, 1.05, -0.46],
        {
          name: "48V DC Blind-Mate Copper Busbar",
          info: "Delivers 98%-efficient rectified 48V DC power directly to every compute sled without per-server AC cords.",
          explode: [0, 0, -0.45],
        },
        rack,
      );

      // 2x Top-of-Rack Leaf & Spine Optical Switches at top of rack
      for (let sw = 0; sw < 2; sw++) {
        const sy = 1.92 + sw * 0.12;
        const swBox = kit.box(
          0.84,
          0.09,
          0.86,
          U.metal(0x1f3a52, 0.35),
          [0, sy, 0],
          {
            name:
              sw === 1
                ? "400GbE Clos Spine Optical Switch"
                : "Top-of-Rack (ToR) QSFP-DD Leaf Switch",
            info: "25.6 Tbps merchant-silicon packet switch with 32× 400GbE QSFP-DD optical transceivers providing non-blocking Equal-Cost Multi-Path (ECMP) fabric.",
            explode: [0, 0.32 + sw * 0.12, 0],
          },
          rack,
        );
        for (let p = 0; p < 8; p++) {
          kit.box(
            0.06,
            0.03,
            0.04,
            U.glow(0x38bdf8, 1.2),
            [-0.32 + p * 0.09, 0, 0.43],
            {},
            swBox,
          );
        }
      }

      // 8 Compute Sleds (Bottom 5 = Raft Nodes 0..4, Top 3 = Stateless Worker Pods)
      for (let s = 0; s < 8; s++) {
        const sy = 0.24 + s * 0.19;
        const sled = kit.group(
          [0, sy, 0],
          {
            name:
              s < 5
                ? `Raft Consensus Compute Sled N${s}`
                : `Container Worker Sled W${s - 5}`,
            info:
              s < 5
                ? `Dual-socket Xeon blade storing replicated etcd/Raft consensus state on NVMe; currently ${sim.nodes[s].role}.`
                : "Stateless microservice container blade scheduled via Borg/Kubernetes bin-packing.",
            live:
              s < 5
                ? () =>
                    `Node N${s}: ${sim.nodes[s].alive ? sim.nodes[s].role : "PARTITIONED"} · Term=${sim.nodes[s].term} · Commit=${sim.nodes[s].commitIndex}`
                : () => "Stateless Pod Pool · 400GbE RoCEv2",
            explode: [0, 0, 0.42],
          },
          rack,
        );
        kit.box(0.84, 0.13, 0.88, U.metal(0x28303d, 0.44), [0, 0, 0], {}, sled);
        kit.box(0.76, 0.014, 0.72, U.pcb(0x174e36), [0, 0.02, -0.02], {}, sled);
        vn(
          kit,
          0.18,
          0.18,
          0.06,
          [-0.18, 0.03, -0.04],
          { name: "Socket-0 Xeon Heatsink" },
          sled,
        );
        vn(
          kit,
          0.18,
          0.18,
          0.06,
          [0.18, 0.03, -0.04],
          { name: "Socket-1 Xeon Heatsink" },
          sled,
        );
        ps(
          kit,
          [0, 0.03, -0.04],
          { len: 0.14, h: 0.055, name: "DDR4 ECC DIMM Channel" },
          sled,
        );
        ni(kit, 0.045, [-0.24, 0.02, 0.34], {}, sled);
        ni(kit, 0.045, [0.24, 0.02, 0.34], {}, sled);

        const bar = kit.box(
          0.74,
          0.026,
          0.02,
          U.glow(s === 0 ? 0xfbbf24 : 0x38bdf8, 1.35),
          [0, 0.03, 0.445],
          { name: s < 5 ? `Node N${s} Raft Role Lightbar` : "Worker Health Lightbar" },
          sled,
        );
        if (s < 5) sledBars.push(bar);

        // Sweeping cyan optical fiber from ToR switch to each sled
        kit.tube(
          [
            [-0.32 + s * 0.09, 1.9, 0.48],
            [-0.38, (1.9 + sy) * 0.5, 0.54],
            [-0.35, sy, 0.45],
          ],
          0.006,
          U.glow(0x38bdf8, 0.9),
          {
            name: "Single-Mode Optical Fiber Jumper",
            info: "400GBASE-DR4 silicon-photonics optical fiber linking compute sleds to the ToR Leaf switch.",
          },
          rack,
        );
      }

      // 2. NOC TELEMETRY CONSOLE MONITOR (Right)
      mon = buildMonitor3D(kit, [0.76, 0.62, 0.08], {
        w: 0.88,
        h: 0.64,
        name: "NOC Cluster & Raft Consensus Display",
        info: "Real-time Datacenter Site-Reliability Engineering (SRE) view of the 5-node Raft state machine and blade utilization.",
        explode: [0.35, 0, 0],
      });
      kit.box(1.04, 0.62, 0.56, U.darkAnodized(0x1b222d), [0.76, 0.31, 0.08], {
        name: "NOC Crash-Cart Pedestal",
      });

      drawCloudMonitor();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        const lid = sim.leaderId();
        const alive = sim.nodes.filter((n) => n.alive).length;
        statsUi.set("lead", lid >= 0 ? `Node N${lid}` : "NONE (HALTED)");
        statsUi.set("quorum", `${alive}/5 (${alive >= 3 ? "QUORUM OK" : "SPLIT/HALT"})`);
        statsUi.set("term", `Term ${Math.max(...sim.nodes.map((n) => n.term))}`);
        statsUi.set("ops", `${sim.committedOps} committed`);
        statsUi.set("elec", `${sim.elections} elections`);
        statsUi.set("fabric", "25.6 Tbps Clos");
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      statsUi = Pt([
        ["lead", "Raft Leader"],
        ["quorum", "Cluster Quorum"],
        ["term", "Current Term"],
        ["ops", "Committed WAL"],
        ["elec", "Leader Elections"],
        ["fabric", "Leaf-Spine"],
      ]);

      el.append(
        Ie(
          "5-Node Raft Distributed Consensus & Fault Injection",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe(
              "Propose KV Write",
              () => {
                const res = sim.propose();
                if (ctx.diagram) {
                  ctx.diagram.pulse("leaf", "lead", "#fbbf24");
                  if (res.ok) ctx.diagram.pulse("lead", "foll", "#5fe08a");
                }
                hi("tick", { f: res.ok ? 1100 : 320, v: 0.08, min: 0.04 });
                drawCloudMonitor();
                syncStats();
              },
              "pri",
            ),
            Fe("Force Election", () => {
              sim.triggerElection();
              if (ctx.diagram) ctx.diagram.pulse("lead", "foll", "#fbbf24");
              drawCloudMonitor();
              syncStats();
            }),
          ),
          q(
            "div",
            { class: "row" },
            ...[0, 1, 2, 3, 4].map((id) =>
              Fe(`Kill/Heal N${id}`, () => {
                sim.toggleNode(id);
                hi("switch", { min: 0.04 });
                drawCloudMonitor();
                syncStats();
              }),
            ),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (running) {
        stepAcc += dt * 2.6;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          const res = sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("spine", "leaf", "#38bdf8");
            if (res.ok) {
              ctx.diagram.pulse("lead", "foll", "#5fe08a");
              ctx.diagram.pulse("foll", "nvme", "#c08cff");
            }
          }
          drawCloudMonitor();
          if (machine._syncStats) machine._syncStats();
        }
      }
      sledBars.forEach((bar, i) => {
        const n = sim.nodes[i];
        const col = !n.alive ? 0xff3b3b : n.role === "LEADER" ? 0xfbbf24 : 0x38bdf8;
        bar.material.color.setHex(col);
        bar.material.emissive.setHex(col);
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const c = new CloudRaftCluster();
      c.toggleNode(0);
      const r = c.propose("PUT /k=1");
      return { ok: r.ok && c.leaderId() > 0, leader: c.leaderId() };
    },
  };
  return machine;
}

function makeMachineZmain20() {
  const sim = new ModernMainframeZ();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let raimLeds = [];
  let ringMesh = null;
  let statsUi = null;

  function drawZConsole() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060911";
    c.fillRect(0, 0, W, H);

    c.fillStyle = "#1e3a8a";
    c.fillRect(16, 14, W - 32, 50);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    c.fillText(
      `TELUM Z16 ENTERPRISE MAINFRAME · 99.99999% RAS · TX=${sim.totalTx.toLocaleString()} · DROPPED=${sim.droppedTx}`,
      28,
      46,
    );

    // 4 Processor Drawers & Virtual L3/L4 Cache Ring
    c.fillStyle = "#0f172a";
    c.fillRect(20, 82, 600, 330);
    c.strokeStyle = "#3b82f6";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 600, 330);
    c.fillStyle = "#93c5fd";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("4-DRAWER 5.2 GHz TELUM TOPOLOGY & 2 GB VIRTUAL L4 CACHE RING", 34, 110);
    sim.drawers.forEach((d, idx) => {
      const dx = 36 + (idx % 2) * 284;
      const dy = 130 + Math.floor(idx / 2) * 132;
      c.fillStyle = "#172554";
      c.fillRect(dx, dy, 268, 116);
      c.strokeStyle = d.spareActive ? "#fbbf24" : "#38bdf8";
      c.strokeRect(dx, dy, 268, 116);
      c.fillStyle = "#ffffff";
      c.font = '700 15px "JetBrains Mono", monospace';
      c.fillText(`DRAWER ${d.id} · ${d.clockGhz} GHz`, dx + 12, dy + 28);
      c.fillStyle = "#bae6fd";
      c.font = '600 13px "JetBrains Mono", monospace';
      c.fillText(`Virtual L3/L4 Hits: ${d.l4VirtualHits}`, dx + 12, dy + 56);
      c.fillStyle = d.spareActive ? "#fde047" : "#34d399";
      c.fillText(
        d.spareActive ? "SPARE PU + RAIM ACTIVE" : "LOCKSTEP ECC HEALTHY",
        dx + 12,
        dy + 86,
      );
    });

    // RAIM 5-Channel Memory Array Status (Right)
    c.fillStyle = "#0f172a";
    c.fillRect(636, 82, 368, 330);
    c.strokeStyle = "#10b981";
    c.strokeRect(636, 82, 368, 330);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("RAIM MEMORY FAULT ISOLATION", 652, 110);
    sim.raimChannels.forEach((ok, idx) => {
      const ry = 136 + idx * 46;
      c.fillStyle = ok ? "#064e3b" : "#7f1d1d";
      c.fillRect(652, ry, 336, 36);
      c.fillStyle = ok ? "#34d399" : "#fca5a5";
      c.font = '700 14px "JetBrains Mono", monospace';
      c.fillText(
        `CH ${idx} ${idx === 4 ? "(PARITY)" : "(DATA)  "}: ${ok ? "ONLINE" : "ISOLATED -> XOR REPAIRED"}`,
        664,
        ry + 23,
      );
    });
    c.fillStyle = "#fbbf24";
    c.fillText(`Zero-Downtime Repairs: ${sim.raimRepairs}`, 652, 390);

    // PR/SM LPAR Partitions + Inline On-Chip AI Fraud Scoring + Double-Entry Ledger
    c.fillStyle = "#0f172a";
    c.fillRect(20, 430, W - 40, 312);
    c.strokeStyle = "#6366f1";
    c.strokeRect(20, 430, W - 40, 312);
    c.fillStyle = "#c7d2fe";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      `PR/SM HARDWARE LPARs · INLINE AI FRAUD SCORE=${(sim.lastFraudScore * 100).toFixed(1)}% (Flagged=${sim.fraudFlagged}) · LEDGER=$${(sim.ledgerBalance / 100).toLocaleString()}.00`,
      34,
      460,
    );
    sim.lpars.forEach((lp, i) => {
      const ly = 488 + i * 56;
      c.fillStyle = "#e2e8f0";
      c.font = '700 15px "JetBrains Mono", monospace';
      c.fillText(`${lp.name.padEnd(16)} (${lp.weight}% cap)`, 36, ly + 22);
      c.fillStyle = "#1e293b";
      c.fillRect(320, ly + 4, 460, 28);
      c.fillStyle = "#3b82f6";
      c.fillRect(320, ly + 4, 460 * (lp.weight / 50), 28);
      c.fillStyle = "#93c5fd";
      c.fillText(`${lp.tps.toLocaleString()} ACID TPS`, 800, ly + 23);
    });
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "zmain20",
    era: "2022",
    short: "Telum Z Mainframe",
    name: "Telum-Class Zero-Downtime Enterprise Mainframe",
    group: "servers",
    view0: 0.34,
    blurb:
      "Why global banks, clearinghouses, and airlines still run modern mainframes: 5.2 GHz Telum dual-chip modules pool 256 MB semi-private L2s into a 2 GB Virtual L3/L4 cache ring, isolate full DIMM channel failures via RAIM (Redundant Array of Independent Memory), and score every credit-card swipe on an on-chip AI accelerator in <1 ms inside the ACID transaction.",
    diagram: {
      nodes: [
        { id: "pu", label: "5.2GHz Telum PUs", x: 0.2, y: 0.22, color: "#60a5fa" },
        { id: "vl4", label: "2GB Virtual L4 Ring", x: 0.52, y: 0.22, color: "#38bdf8" },
        { id: "ai", label: "On-Chip AI Fraud", x: 0.84, y: 0.22, color: "#f472b6" },
        { id: "raim", label: "5-Ch RAIM Memory", x: 0.24, y: 0.62, color: "#34d399" },
        { id: "lpar", label: "PR/SM LPAR Hyperv", x: 0.56, y: 0.62, color: "#a78bfa" },
        { id: "ficon", label: "FICON + Crypto HSM", x: 0.84, y: 0.76, color: "#fbbf24" },
      ],
      edges: [
        ["pu", "vl4", "320 GB/s"],
        ["pu", "ai", "1ms Infer"],
        ["vl4", "raim", "RAIM ECC"],
        ["pu", "lpar", "SIE"],
        ["lpar", "ficon", "TLS/AES"],
      ],
    },
    build(kit) {
      raimLeds = [];
      // 1. DUAL-FRAME OBSIDIAN-TITANIUM Z16-STYLE MONOLITH
      const frame = kit.group([-0.48, 0, 0], {
        name: "Dual-Frame Enterprise Mainframe Monolith",
        info: "19-inch dual-frame seismic-rated enterprise cabinet with obsidian lattice doors, sapphire status blades, N+N bulk power, and closed-loop cooling.",
      });
      kit.box(
        1.26,
        2.16,
        1.06,
        U.darkAnodized(0x11151d),
        [0, 1.08, 0],
        {
          shell: true,
          name: "Obsidian Lattice Acoustic Doors",
          info: "Precision-machined matte-black triangular-lattice doors; cutaway reveals the 4 Telum CPC drawers, Virtual-L4 interconnect ring, RAIM memory, and FICON/Crypto I/O.",
          explode: [-0.48, 0.2, 0.35],
        },
        frame,
      );

      // Iconic glowing sapphire vertical geometric light bars on front doors
      for (const lx of [-0.56, 0.0, 0.56]) {
        kit.box(
          0.022,
          1.96,
          0.025,
          U.glow(0x2563eb, 1.45),
          [lx, 1.08, 0.54],
          {
            shell: true,
            name: "Sapphire System Health Light Blade",
          },
          frame,
        );
      }

      // 4 Central Processor Complex (CPC) Drawers + Copper Coldplates + Virtual L4 Ring
      for (let d = 0; d < 4; d++) {
        const dy = 0.86 + d * 0.22;
        const drw = kit.group(
          [0, dy, 0],
          {
            name: `Telum CPC Processor Drawer ${d}`,
            info: "Contains 4 dual-chip Telum modules (32 5.2 GHz cores + dedicated on-chip matrix AI accelerator + 1 GB unified L2/Virtual-L3/L4 cache per drawer).",
            live: () =>
              `Drawer ${d}: ${sim.drawers[d].clockGhz} GHz · vL4 Hits=${sim.drawers[d].l4VirtualHits}`,
            explode: [0.42, (d - 1.5) * 0.08, 0],
          },
          frame,
        );
        kit.box(1.08, 0.16, 0.88, U.metal(0x242c3a, 0.4), [0, 0, 0], {}, drw);
        kit.box(0.96, 0.016, 0.76, U.pcb(0x143d59), [0, -0.02, 0], {}, drw);
        for (const cx of [-0.26, 0.26]) {
          vn(
            kit,
            0.26,
            0.24,
            0.075,
            [cx, 0.01, 0],
            {
              base: U.copper(),
              mat: U.copper(),
              name: "Telum Dual-Chip Brazed Copper Coldplate",
              info: "High-mass copper heatsink cooling the 7nm 22.5-billion-transistor Telum dual-chip package.",
            },
            drw,
          );
        }
      }

      // Luminous Virtual L4 Ring Interconnect linking all 4 CPC drawers
      ringMesh = kit.torus(
        0.32,
        0.018,
        U.glow(0x38bdf8, 1.4),
        [0, 1.19, 0.36],
        {
          name: "2 GB Virtual L3/L4 Coherent Ring Bus",
          info: "320 GB/s bidirectional ring pooling victim lines across idle L2 caches on every chip into a massive 2 GB virtual L4 cache.",
          explode: [0, 0, 0.45],
        },
        frame,
      );

      // 5-Channel RAIM Memory Drawer below CPC drawers
      const raimGrp = kit.group(
        [0, 0.56, 0],
        {
          name: "5-Channel RAIM Fault-Tolerant Memory Drawer",
          info: "Redundant Array of Independent Memory (RAIM): stripes cache lines across 4 independent DDR5 channels + 1 dedicated XOR parity channel to survive entire DIMM or memory-controller failures.",
          live: () => `RAIM Repairs=${sim.raimRepairs} · Zero Dropped TX`,
          explode: [-0.42, -0.1, 0.25],
        },
        frame,
      );
      kit.box(1.08, 0.2, 0.86, U.darkAnodized(0x1c2330), [0, 0, 0], {}, raimGrp);
      for (let ch = 0; ch < 5; ch++) {
        const rx = -0.36 + ch * 0.18;
        ps(
          kit,
          [rx, -0.02, 0.05],
          { len: 0.14, h: 0.1, spreader: 0x3b82f6, name: `RAIM Channel ${ch} DIMMs` },
          raimGrp,
        );
        const led = kit.sphere(
          0.016,
          U.glow(0x34d399, 1.4),
          [rx, 0.06, 0.44],
          {
            name: `RAIM Channel ${ch} Health LED`,
          },
          raimGrp,
        );
        raimLeds.push(led);
      }

      // PCIe Gen4 FICON Storage & Crypto Express8S Tamper-Responding HSM Drawer at bottom
      const ioGrp = kit.group(
        [0, 0.26, 0],
        {
          name: "PCIe FICON & Crypto Express HSM I/O Drawer",
          info: "FIPS 140-3 Level 4 tamper-responding Hardware Security Modules (quantum-safe CRYSTALS-Kyber/Dilithium + AES) and 32 Gbps FICON SAN channels.",
          explode: [0, -0.22, 0.35],
        },
        frame,
      );
      kit.box(1.08, 0.28, 0.88, U.metal(0x202734, 0.45), [0, 0, 0], {}, ioGrp);
      for (let c = 0; c < 6; c++) {
        Gs(
          kit,
          0.12,
          0.18,
          [-0.38 + c * 0.15, -0.08, 0.1],
          { pcb: 0x1d4d38, name: "Crypto Express8S / FICON Card" },
          ioGrp,
        );
      }

      // 2. ENTERPRISE HMC OPERATIONS CONSOLE (Right)
      mon = buildMonitor3D(kit, [0.84, 0.64, 0.08], {
        w: 0.9,
        h: 0.64,
        name: "Hardware Management Console (HMC)",
        info: "Displays PR/SM LPAR partitions, 316K+ ACID TPS, inline Telum AI fraud inference, and RAIM memory channel health.",
        explode: [0.36, 0, 0],
      });
      kit.box(1.06, 0.64, 0.56, U.darkAnodized(0x161c26), [0.84, 0.32, 0.08], {
        name: "HMC Operator Console Stand",
      });

      drawZConsole();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        statsUi.set("tx", `${sim.totalTx.toLocaleString()} (Dropped: ${sim.droppedTx})`);
        statsUi.set("ledger", `$${(sim.ledgerBalance / 100).toLocaleString()}.00`);
        statsUi.set(
          "fraud",
          `${(sim.lastFraudScore * 100).toFixed(1)}% (${sim.fraudFlagged} flagged)`,
        );
        const badIdx = sim.raimChannels.findIndex((ok) => !ok);
        statsUi.set(
          "raim",
          badIdx >= 0
            ? `CH${badIdx} FAULT -> REPAIRED (${sim.raimRepairs})`
            : "5/5 OPTIMAL",
        );
        statsUi.set(
          "vl4",
          `${sim.drawers.reduce((s, d) => s + d.l4VirtualHits, 0)} hits`,
        );
        statsUi.set("ras", "99.99999% (7 Nines)");
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      statsUi = Pt([
        ["tx", "ACID Transactions"],
        ["ledger", "Balanced Ledger"],
        ["fraud", "Inline AI Fraud"],
        ["raim", "RAIM Memory"],
        ["vl4", "Virtual L4 Ring"],
        ["ras", "Availability"],
      ]);

      el.append(
        Ie(
          "Zero-Downtime RAS, RAIM Fault Recovery & Inline AI",
          q(
            "div",
            { class: "row" },
            runBtn,
            Fe("Step ACID Batch", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.step();
              drawZConsole();
              syncStats();
            }),
            Fe(
              "Inject RAIM Channel Fault",
              () => {
                const nextCh = (sim.raimChannels.findIndex((ok) => !ok) + 1) % 5;
                sim.injectMemoryChannelFault(nextCh);
                if (ctx.diagram) ctx.diagram.pulse("vl4", "raim", "#ef4444");
                hi("coil", { v: 0.6, min: 0.08 });
                drawZConsole();
                syncStats();
              },
              "pri",
            ),
            Fe("Heal All Channels", () => {
              sim.healAll();
              drawZConsole();
              syncStats();
            }),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (ringMesh) ringMesh.rotation.z = t * 0.9;
      if (running) {
        stepAcc += dt * 5;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          const ev = sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("pu", "vl4", "#38bdf8");
            ctx.diagram.pulse("pu", "ai", ev.fraudProb > 0.72 ? "#ef4444" : "#f472b6");
            ctx.diagram.pulse("vl4", "raim", "#34d399");
            if (sim.totalTx % 480 === 0) ctx.diagram.pulse("lpar", "ficon", "#fbbf24");
          }
          drawZConsole();
          if (machine._syncStats) machine._syncStats();
        }
      }
      raimLeds.forEach((led, i) => {
        const col = sim.raimChannels[i] ? 0x34d399 : 0xfbbf24;
        led.material.color.setHex(col);
        led.material.emissive.setHex(col);
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const z = new ModernMainframeZ();
      z.injectMemoryChannelFault(1);
      z.step();
      return {
        ok: z.droppedTx === 0 && z.raimRepairs > 0 && z.ledgerBalance === 100000000,
        repairs: z.raimRepairs,
      };
    },
  };
  return machine;
}

function makeMachineVax78() {
  const sim = new VaxVirtualMemorySystem();
  let running = true;
  let stepAcc = 0;
  let mon = null;
  let rpDiskMesh = null;
  let sbiLeds = [];
  let statsUi = null;

  function drawVaxConsole() {
    if (!mon) return;
    const c = mon.ctx;
    const W = 1024,
      H = 768;
    c.fillStyle = "#060b14";
    c.fillRect(0, 0, W, H);

    c.fillStyle = "#0c4a6e";
    c.fillRect(16, 14, W - 32, 52);
    c.fillStyle = "#f8fafc";
    c.font = '700 20px "JetBrains Mono", monospace';
    const la = sim.lastAccess || {
      vaddr: 0x000002a4,
      vpn: 1,
      pfn: 0,
      tlbHit: false,
      pageFault: true,
    };
    c.fillText(
      `DEC VAX-11/780 (1.0 MIPS) + 4.2BSD UNIX · POLICY=${sim.policy} (${sim.numFrames} FRAMES) · FAULTS=${sim.pageFaults}`,
      26,
      47,
    );

    // Left: 32-Bit P0/P1/S0 Virtual Memory, Associative TB (TLB) & Belady's Anomaly!
    c.fillStyle = "#0b1422";
    c.fillRect(20, 82, 512, 410);
    c.strokeStyle = "#38bdf8";
    c.lineWidth = 2;
    c.strokeRect(20, 82, 512, 410);
    c.fillStyle = "#7dd3fc";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("VAX 32-BIT DEMAND PAGING & ASSOCIATIVE TLB", 36, 112);

    c.fillStyle = "#e2e8f0";
    c.font = '600 14px "JetBrains Mono", monospace';
    c.fillText(
      `VA 0x${la.vaddr.toString(16).toUpperCase().padStart(8, "0")} -> VPN ${la.vpn} -> PFN ${la.pfn} [${la.tlbHit ? "TLB HIT ✓" : la.pageFault ? "PAGE FAULT!" : "PT WALK"}]`,
      36,
      144,
    );

    // Physical Page Frames Table
    for (let f = 0; f < 4; f++) {
      const activeSlot = f < sim.numFrames;
      const fr = sim.frames[f];
      const fy = 166 + f * 48;
      c.fillStyle = !activeSlot
        ? "#090d14"
        : fr && fr.vpn === la.vpn
          ? "rgba(56, 189, 248, 0.28)"
          : "#111c2d";
      c.fillRect(36, fy, 478, 40);
      c.strokeStyle = activeSlot ? "#38bdf8" : "#1e293b";
      c.strokeRect(36, fy, 478, 40);
      c.fillStyle = activeSlot ? "#f8fafc" : "#475569";
      c.font = '600 14px "JetBrains Mono", monospace';
      c.fillText(
        !activeSlot
          ? `PFN ${f}: <DISABLED IN 3-FRAME BELADY MODE>`
          : fr
            ? `PFN ${f}: VPN=${fr.vpn}  UseBit=${fr.useBit}  LastRef=#${fr.lastUsed}`
            : `PFN ${f}: <FREE PHYSICAL FRAME>`,
        48,
        fy + 25,
      );
    }

    // Live Belady's Anomaly Proof Box!
    c.fillStyle = "#172554";
    c.fillRect(36, 374, 478, 102);
    c.strokeStyle = "#fbbf24";
    c.strokeRect(36, 374, 478, 102);
    c.fillStyle = "#fde047";
    c.font = '700 14px "JetBrains Mono", monospace';
    c.fillText("BELADY'S ANOMALY BENCHMARK [1,2,3,4,1,2,5,1,2,3,4,5]:", 48, 398);
    c.fillStyle = "#e2e8f0";
    c.font = '600 14px "JetBrains Mono", monospace';
    c.fillText(
      "• FIFO: 3 Frames = 9 Faults  vs  4 Frames = 10 Faults! (WORSE!)",
      48,
      426,
    );
    c.fillStyle = "#34d399";
    c.fillText(
      "• LRU : 3 Frames = 10 Faults vs  4 Frames = 8 Faults  (Monotonic)",
      48,
      454,
    );

    // Right: 4.2BSD UNIX TCP/IP Sliding-Window AIMD Congestion Sawtooth!
    c.fillStyle = "#0b1422";
    c.fillRect(548, 82, 456, 410);
    c.strokeStyle = "#34d399";
    c.strokeRect(548, 82, 456, 410);
    c.fillStyle = "#6ee7b7";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText("4.2BSD TCP/IP SOCKETS & AIMD SAWTOOTH", 564, 112);

    c.fillStyle = "#cbd5e1";
    c.font = '600 14px "JetBrains Mono", monospace';
    c.fillText(
      `cwnd = ${sim.cwnd} MSS · ssthresh = ${sim.ssthresh} · Seq = ${sim.tcpSeq}`,
      564,
      144,
    );

    // Plot cwnd sawtooth history
    c.fillStyle = "#08101c";
    c.fillRect(564, 166, 422, 230);
    c.strokeStyle = "rgba(251, 191, 36, 0.55)";
    c.setLineDash([5, 5]);
    const thY = 386 - (sim.ssthresh / 32) * 200;
    c.beginPath();
    c.moveTo(564, thY);
    c.lineTo(986, thY);
    c.stroke();
    c.setLineDash([]);

    c.strokeStyle = "#34d399";
    c.lineWidth = 3;
    c.beginPath();
    sim.cwndHistory.forEach((wVal, idx) => {
      const px = 574 + (idx / Math.max(1, sim.cwndHistory.length - 1)) * 402;
      const py = 386 - (wVal / 32) * 200;
      if (idx === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    });
    c.stroke();

    c.fillStyle = "#fde047";
    c.font = '600 13px "JetBrains Mono", monospace';
    c.fillText("Dashed = ssthresh · Green = TCP cwnd (Slow Start + AIMD)", 564, 424);
    c.fillStyle = "#94a3b8";
    c.fillText(`3-Way SYN/SYN-ACK/ACK · Losses: ${sim.tcpLosses}`, 564, 454);

    // Bottom Historical Impact
    c.fillStyle = "#0b1422";
    c.fillRect(20, 510, W - 40, 232);
    c.strokeStyle = "#fbbf24";
    c.strokeRect(20, 510, W - 40, 232);
    c.fillStyle = "#fde047";
    c.font = '700 16px "JetBrains Mono", monospace';
    c.fillText(
      "THE CANONICAL 1.0 MIPS BENCHMARK, TEXTBOOK VIRTUAL MEMORY & BIRTHPLACE OF BSD INTERNET",
      36,
      542,
    );
    c.fillStyle = "#cbd5e1";
    c.font = '600 15px "JetBrains Mono", monospace';
    c.fillText(
      "• Extended PDP-11 from 16-bit (64 KB) to 32-bit (4 GB Virtual Address Space: P0 user, P1 stack, S0 kernel).",
      36,
      582,
    );
    c.fillText(
      "• UC Berkeley's Bill Joy built 3BSD/4.2BSD UNIX on the VAX-11/780: virtual memory paging, sockets(), & DARPA TCP/IP!",
      36,
      620,
    );
    c.fillText(
      "• Orthogonal 304-instruction CISC ISA + 6.1 KB Writable Control Store inspired the Stanford/Berkeley RISC debate.",
      36,
      658,
    );
    mon.tex.needsUpdate = true;
  }

  const machine = {
    id: "vax78",
    era: "1978",
    short: "DEC VAX-11/780",
    name: "DEC VAX-11/780 Virtual-Memory & 4.2BSD TCP/IP Server",
    group: "servers",
    view0: 0.38,
    blurb:
      "The canonical 1.0-MIPS 32-bit superminicomputer and birthplace of the modern Internet stack (4.2BSD UNIX sockets & TCP/IP): introduced a 4 GB P0/P1/S0 virtual address space, hardware 2-level page tables with associative Translation Buffer (TLB), Demand Paging (demonstrating Belady's Anomaly live!), and Synchronous Backplane Interconnect (SBI).",
    diagram: {
      nodes: [
        { id: "cpu", label: "74S TTL VAX CPU", x: 0.18, y: 0.26, color: "#38bdf8" },
        { id: "tlb", label: "TB / 2-Lvl Page Tbl", x: 0.52, y: 0.26, color: "#fbbf24" },
        { id: "sbi", label: "13.3 MB/s Sync SBI", x: 0.52, y: 0.62, color: "#60a5fa" },
        { id: "rp06", label: "RP06 Swap Disk Pack", x: 0.18, y: 0.8, color: "#f97316" },
        { id: "tcp", label: "4.2BSD TCP/IP AIMD", x: 0.86, y: 0.62, color: "#34d399" },
      ],
      edges: [
        ["cpu", "tlb", "32b VA->PFN"],
        ["tlb", "sbi", "MS780 ECC"],
        ["sbi", "rp06", "Demand Page"],
        ["sbi", "tcp", "BSD Sockets"],
      ],
    },
    build(kit) {
      sbiLeds = [];
      // 1. DEC VAX-11/780 CREAM & CORNFLOWER-BLUE MAIN CABINET (Left)
      const cab = kit.group([-0.62, 0, 0], {
        name: "DEC VAX-11/780 CPU & SBI Cabinet",
        info: "5-MHz Schottky TTL 32-bit superminicomputer cabinet housing the 29-slot Synchronous Backplane Interconnect (SBI) card cage, FP780 accelerator, and LSI-11 console.",
      });
      kit.box(
        0.92,
        1.56,
        0.78,
        U.plastic(0xdad4c6, 0.45),
        [0, 0.78, 0],
        {
          shell: true,
          name: "VAX-11/780 Cream Sheet-Metal Enclosure",
          explode: [-0.36, 0, 0],
        },
        cab,
      );

      // Cornflower-blue DEC accent fascia + Perforated Airflow Plenum Door!
      kit.box(
        0.88,
        0.22,
        0.04,
        U.plastic(0x2563eb, 0.42),
        [0, 1.4, 0.39],
        {
          name: "Digital VAX-11/780 Cornflower-Blue Nameplate Fascia",
        },
        cab,
      );
      kit.box(
        0.86,
        1.18,
        0.03,
        U.perfMesh(0x2b3442),
        [0, 0.66, 0.39],
        {
          shell: true,
          name: "Perforated Honeycomb Blower Intake Door",
          explode: [0, 0, 0.42],
        },
        cab,
      );

      // Internal 29-Slot SBI Card Cage (Schottky TTL CPU, Associative TB/TLB, FP780, MS780 ECC RAM!)
      const cage = kit.group(
        [0, 0.84, 0],
        {
          name: "29-Slot Synchronous Backplane Interconnect (SBI) Card Cage",
          info: "32-bit synchronous pended bus transferring 13.3 MB/s between the KA780 CPU, Translation Buffer, FP780 floating-point accelerator, and MS780 ECC MOS memory.",
          live: () => `Faults=${sim.pageFaults} · TLB Hits=${sim.tlbHits}`,
          explode: [0, 0.22, 0.28],
        },
        cab,
      );
      for (let b = 0; b < 12; b++) {
        const bx = -0.36 + b * 0.065;
        kit.box(
          0.022,
          0.56,
          0.54,
          U.pcb(b < 4 ? 0x1e5638 : 0x1c3d5a),
          [bx, 0, 0],
          {
            name:
              b === 0
                ? "KA780 Microcoded 32-Bit CISC CPU & WCS Board"
                : b === 1
                  ? "Hardware Associative Translation Buffer (TLB) Card"
                  : b < 5
                    ? `FP780 Floating-Point Accelerator Board ${b - 1}`
                    : `MS780 64K-MOS ECC Main Memory Array ${b - 4}`,
          },
          cage,
        );
        const led = kit.sphere(0.01, U.led(0xfbbf24), [bx, 0.29, 0.275], {}, cage);
        sbiLeds.push(led);
      }

      // Adjacent DEC RP06 Top-Loading Swap Disk Pack Drive!
      const rp06 = kit.group([0.1, 0, -0.04], {
        name: "DEC RP06 176 MB MASSBUS Swap & Filesystem Disk Drive",
        info: "Stores 4.2BSD UNIX root/usr partitions and services demand-paged virtual memory page faults via MASSBUS DMA.",
        explode: [0.18, 0, -0.32],
      });
      kit.box(
        0.46,
        0.96,
        0.62,
        U.plastic(0xd8d1c3, 0.46),
        [0, 0.48, 0],
        {
          shell: true,
          name: "RP06 Washing-Machine Disk Cabinet",
        },
        rp06,
      );
      kit.cyl(
        0.18,
        0.18,
        0.08,
        U.glass(0x93c5fd, 0.28),
        [0, 0.99, 0],
        {
          shell: true,
          name: "RP06 Top-Load Smoked Acrylic Cover",
        },
        rp06,
      );
      rpDiskMesh = kit.cyl(
        0.16,
        0.16,
        0.05,
        U.copper(),
        [0, 0.96, 0],
        {
          name: "3,600 RPM Multi-Platter Oxide Disk Pack",
        },
        rp06,
      );

      // 2. RIGHT CONSOLE MONITOR (facing +Z!)
      mon = buildMonitor3D(kit, [0.86, 0.64, 0.12], {
        w: 0.94,
        h: 0.64,
        rot: [0, 0.04, 0],
        name: "VAX Virtual Memory, Belady's Anomaly & 4.2BSD TCP Console",
        explode: [0.36, 0, 0],
      });
      kit.box(1.02, 0.64, 0.54, U.darkAnodized(0x111a26), [0.86, 0.32, 0.12], {
        rot: [0, 0.04, 0],
      });

      drawVaxConsole();
    },

    ui(el, ctx) {
      const syncStats = () => {
        if (!statsUi) return;
        const hitPct = sim.accessCount
          ? ((sim.tlbHits / sim.accessCount) * 100).toFixed(1)
          : "0.0";
        statsUi.set("pol", `${sim.policy} (${sim.numFrames} Frames)`);
        statsUi.set("flt", `${sim.pageFaults} / ${sim.accessCount} Refs`);
        statsUi.set("tlb", `${hitPct}% Hit Rate`);
        statsUi.set("bel", "FIFO: 9 (3f) -> 10 (4f)!");
        statsUi.set("cwnd", `${sim.cwnd} MSS (th=${sim.ssthresh})`);
        statsUi.set("mips", "1.00 VAX MIPS Ref");
      };

      const runBtn = Fe(
        running ? "⏸ Pause" : "▶ Run",
        () => {
          running = !running;
          runBtn.textContent = running ? "⏸ Pause" : "▶ Run";
        },
        "pri",
      );

      const frameBtn = Fe(
        `Frames: ${sim.numFrames} Physical`,
        () => {
          sim.numFrames = sim.numFrames === 3 ? 4 : 3;
          frameBtn.textContent = `Frames: ${sim.numFrames} Physical`;
          sim.resetVm();
          for (const vpn of sim.beladyTrace) sim.accessVirtualPage(vpn, 0);
          if (ctx.diagram) ctx.diagram.pulse("sbi", "rp06", "#f97316");
          drawVaxConsole();
          syncStats();
        },
        "pri",
      );

      statsUi = Pt([
        ["pol", "Page Policy"],
        ["flt", "Demand Faults"],
        ["tlb", "Assoc. TB/TLB"],
        ["bel", "Belady Anomaly"],
        ["cwnd", "BSD TCP cwnd"],
        ["mips", "ISA Speed Ref"],
      ]);

      el.append(
        Ie(
          "32-Bit Demand Paging, Belady's Anomaly & 4.2BSD TCP/IP AIMD",
          q(
            "div",
            { class: "row" },
            runBtn,
            frameBtn,
            Fe("Run Full Belady Trace", () => {
              running = false;
              runBtn.textContent = "▶ Run";
              sim.resetVm();
              for (const vpn of sim.beladyTrace) sim.accessVirtualPage(vpn, 0);
              hi("seek", { d: 0.6, min: 0.04 });
              drawVaxConsole();
              syncStats();
            }),
            Fe("Inject TCP Loss", () => {
              sim.stepTcpRtt(true);
              if (ctx.diagram) ctx.diagram.pulse("sbi", "tcp", "#ef4444");
              drawVaxConsole();
              syncStats();
            }),
          ),
          q(
            "div",
            { class: "row" },
            st(
              [
                ["CLOCK", "Replacement: VAX/BSD Second-Chance CLOCK"],
                ["FIFO", "Replacement: FIFO Queue (Exhibits Belady's Anomaly!)"],
                ["LRU", "Replacement: True Stack LRU (Anomaly-Free)"],
              ],
              sim.policy,
              (val) => {
                sim.policy = val;
                sim.resetVm();
                for (const vpn of sim.beladyTrace) sim.accessVirtualPage(vpn, 0);
                drawVaxConsole();
                syncStats();
              },
            ),
          ),
          statsUi,
        ),
      );
      machine._syncStats = syncStats;
      syncStats();
    },

    update(dt, t, ctx) {
      if (rpDiskMesh) rpDiskMesh.rotation.y += dt * 22;
      if (running) {
        stepAcc += dt * 2.4;
        while (stepAcc >= 1) {
          stepAcc -= 1;
          const res = sim.step();
          if (ctx.diagram) {
            ctx.diagram.pulse("cpu", "tlb", "#38bdf8");
            if (res.vm.pageFault) ctx.diagram.pulse("sbi", "rp06", "#f97316");
            ctx.diagram.pulse("sbi", "tcp", "#34d399");
          }
          drawVaxConsole();
          if (machine._syncStats) machine._syncStats();
        }
      }
      sbiLeds.forEach((led, idx) => {
        led.material.emissiveIntensity =
          ((sim.accessCount + idx) % 4 === 0 ? 1.4 : 0.12) + 0.2 * Math.sin(t * 6 + idx);
      });
    },

    isRunning: () => running,
    sim,
    test() {
      const v = new VaxVirtualMemorySystem();
      const f3 = v.runBeladyBenchmark("FIFO", 3);
      const f4 = v.runBeladyBenchmark("FIFO", 4);
      const l3 = v.runBeladyBenchmark("LRU", 3);
      const l4 = v.runBeladyBenchmark("LRU", 4);
      return { ok: f4 > f3 && l4 < l3, fifo3: f3, fifo4: f4 };
    },
  };
  return machine;
}
