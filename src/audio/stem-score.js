// Sampled orchestral score (ported from v6 js/audio/music.js).
// 18 original cues rendered offline from the CC0 VSCO 2 Community Edition orchestra through CC0
// hall/church impulse responses (see CREDITS.md / SOUNDS.md). Each cue has three loop-aligned stems
// started sample-synchronously:
//   bed   - always on (harmony, bass, texture)
//   pulse - fades in while the machine is running (ostinati, arpeggios, percussion)
//   lead  - fades in under sustained activity (melody, brass, swells)
// The procedural OrchestralScoreEngine keeps playing until a cue has decoded, and takes over for
// good if stems can't load (file://, missing files, or no Opus decoder).

var STEM_CUES = {
  hub: {
    title: "Gallery of Minds",
    bpm: 76,
    key: "D major",
    mood: "lyrical strings and horns",
  },
  turing: {
    title: "Tape and Thought",
    bpm: 104,
    key: "A minor",
    mood: "pulsing low strings, ticking clocks, running piano",
  },
  z1: {
    title: "Sliding Plates",
    bpm: 96,
    key: "F minor",
    mood: "mechanical 3+3+2 spiccato, clockwork",
  },
  analog: {
    title: "Integrators",
    bpm: 112,
    key: "E minor",
    mood: "swirling spiccato, low brass, timpani",
  },
  tube: {
    title: "Three Thousand Valves",
    bpm: 120,
    key: "C minor",
    mood: "relentless pedal strings, heartbeat drums",
  },
  pdp8: {
    title: "Core Planes",
    bpm: 132,
    key: "B♭ major",
    mood: "counting piano in 3/4, flute and strings",
  },
  altair: {
    title: "Switches and Lamps",
    bpm: 80,
    key: "E♭ major",
    mood: "warm horns, harp, glockenspiel",
  },
  home80: {
    title: "Raster Lines",
    bpm: 120,
    key: "A minor",
    mood: "synth arpeggiator with orchestra",
  },
  pc90: {
    title: "Rain on Beige",
    bpm: 66,
    key: "F dorian",
    mood: "slow synth brass, bells, long reverb",
  },
  pc00: {
    title: "Deeper Pipeline",
    bpm: 60,
    key: "G minor",
    mood: "monumental low brass, Shepard-tone riser",
  },
  pc10: {
    title: "Four Cores",
    bpm: 72,
    key: "E minor",
    mood: "piano eighths, slow strings, brass at the turns",
  },
  pc20: {
    title: "Shader Cores",
    bpm: 132,
    key: "D minor",
    mood: "driving taiko, spiccato and brass stabs",
  },
  aibox: {
    title: "Gradient Descent",
    bpm: 100,
    key: "C♯ minor",
    mood: "music-box piano, pulse, blooming strings",
  },
  m6502: {
    title: "3,510 Transistors",
    bpm: 108,
    key: "B♭ major",
    mood: "heroic horn theme, timpani, cymbals",
  },
  quantum: {
    title: "Superposition",
    bpm: 70,
    key: "E minor",
    mood: "pipe-organ swells, ticking, church acoustics",
  },
  bci: {
    title: "Culture in a Dish",
    bpm: 60,
    key: "E major",
    mood: "sparse piano, string pads",
  },
  alife: {
    title: "Reaction-Diffusion",
    bpm: 56,
    key: "F lydian",
    mood: "lydian shimmer, harp, cello song",
  },
  photonic: {
    title: "Light Through Waveguides",
    bpm: 50,
    key: "D minor",
    mood: "breathing string clusters, flute air",
  },
};

// The repo has 48 machines; the 30 without their own cue borrow the closest one by era and timbre.
var STEM_CUE_FOR = {
  eniac46: "tube",
  cdc6600: "tube",
  agc66: "pdp8",
  s360: "pdp8",
  unix70: "pdp8",
  alto73: "altair",
  tandem77: "altair",
  lisp83: "home80",
  vax78: "home80",
  cray1: "home80",
  systolic82: "home80",
  sun90: "pc90",
  cm2: "pc90",
  ascired97: "pc90",
  blade04: "pc00",
  bgene: "pc00",
  arm07: "pc10",
  cloud10: "pc10",
  zmain20: "pc20",
  fugaku20: "pc20",
  exascale: "pc20",
  wse24: "aibox",
  gb200: "aibox",
  qion: "quantum",
  qanneal: "quantum",
  qatom: "quantum",
  qtransmon: "quantum",
  qspin: "quantum",
  qtopo: "quantum",
  qomega: "quantum",
  qphotonic: "photonic",
};

var STEM_NAMES = ["bed", "pulse", "lead"];
var STEM_GAIN = 0.62; // headroom into the controller's limiter chain

var StemScoreEngine = class {
  constructor(host, proc) {
    this.h = host;
    this.ac = host.ac;
    this.proc = proc; // procedural engine: plays until stems decode, and is the permanent fallback
    this.mode = CelAssets.canLoad() ? "loading" : "procedural";
    this.cache = new Map();
    this.cur = null;
    this.tok = null;
    this.failed = 0;
    this.level = { bed: 1, pulse: 0, lead: 0 };
    this.cueId = "hub";
    this.machineId = "hub";
  }

  static cueFor(machineId) {
    if (STEM_CUES[machineId]) return machineId;
    return STEM_CUE_FOR[machineId] || "hub";
  }

  get cueKey() {
    return this.mode === "stems" ? this.cueId : this.proc.cueKey;
  }
  get currentChordName() {
    if (this.mode !== "stems") return this.proc.currentChordName;
    const c = STEM_CUES[this.cueId];
    return `${c.key} · “${c.title}”`;
  }
  get currentBpm() {
    return this.mode === "stems" ? STEM_CUES[this.cueId].bpm : this.proc.currentBpm;
  }

  _load(cue) {
    if (this.cache.has(cue)) return this.cache.get(cue);
    const p = CelAssets.probeFullTier().then(() =>
      Promise.all(
        STEM_NAMES.map(async (k) => {
          const r = await fetch(CelAssets.stem(cue, k));
          if (!r.ok) throw new Error(`HTTP ${r.status} for ${cue}_${k}`);
          return this.ac.decodeAudioData(await r.arrayBuffer());
        }),
      ),
    );
    this.cache.set(cue, p);
    // bound RAM: a decoded cue is ~30-100 MB of float PCM
    while (this.cache.size > 2) this.cache.delete(this.cache.keys().next().value);
    p.catch(() => this.cache.delete(cue));
    return p;
  }

  play(machineId) {
    this.machineId = machineId;
    this.proc.play(machineId);
    const override = this.h.scoreOverride;
    // A manual mood palette is a procedural feature; "auto" uses the sampled cue.
    if (override && override !== "auto") {
      this._fadeOut();
      if (this.mode === "stems") this.mode = "loading";
      return;
    }
    if (this.mode === "procedural") return;
    const cue = StemScoreEngine.cueFor(machineId);
    if (this.cur && this.cur.cue === cue) return;
    const tok = (this.tok = {});
    this.cueId = cue;
    this._load(cue)
      .then((bufs) => {
        if (this.tok !== tok) return;
        this._fadeOut();
        const ac = this.ac;
        const t = ac.currentTime + 0.08;
        const g = this.h.gain(0, this.h.musicBus);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(STEM_GAIN, t + 2.2);
        const layers = STEM_NAMES.map((k, i) => {
          const s = ac.createBufferSource();
          const lg = this.h.gain(k === "bed" ? 1 : this.level[k], g);
          s.buffer = bufs[i];
          s.loop = true;
          s.loopStart = 0;
          s.loopEnd = bufs[i].duration;
          s.connect(lg);
          s.start(t, 0);
          return { k, s, g: lg };
        });
        this.cur = { cue, g, layers, t0: t, L: bufs[0].duration };
        this.mode = "stems"; // swap only after a successful decode
        this.h.stats.notes++;
        this.h.emit();
      })
      .catch((e) => {
        if (this.tok !== tok) return;
        this.failed++;
        const msg = String(e && e.name) + String(e && e.message);
        if (this.failed >= 2 || /decode|Encoding|format|HTTP 404/i.test(msg)) {
          this.mode = "procedural";
          this.h.stats.musicFallback = msg.slice(0, 120);
          this.h.emit();
        }
      });
  }

  _fadeOut() {
    const c = this.cur;
    if (!c) return;
    this.cur = null;
    const t = this.ac.currentTime;
    c.g.gain.cancelScheduledValues(t);
    c.g.gain.setValueAtTime(c.g.gain.value, t);
    c.g.gain.linearRampToValueAtTime(0, t + 2.4);
    setTimeout(() => {
      for (const l of c.layers) {
        try {
          l.s.stop();
          l.s.disconnect();
        } catch {}
      }
      try {
        c.g.disconnect();
      } catch {}
    }, 3000);
  }

  // act 0..1: idle = bed only, running = + pulse, sustained activity = + lead
  tick(act) {
    if (this.mode !== "stems") {
      this.proc.tick(act);
      return;
    }
    const want = {
      bed: 1,
      pulse: act > 0.08 ? Math.min(1, 0.55 + act) : 0,
      lead: act > 0.4 ? Math.min(1, (act - 0.4) * 2.5) : 0,
    };
    for (const k of STEM_NAMES) this.level[k] += (want[k] - this.level[k]) * 0.02;
    const c = this.cur;
    if (!c) return;
    const t = this.ac.currentTime;
    const muted = this.h.muted || this.h.vol.music <= 0.005;
    for (const l of c.layers)
      l.g.gain.setTargetAtTime(muted ? 0 : this.level[l.k], t, 0.25);
    this.h.stats.notes++;
  }

  get position() {
    const c = this.cur;
    return c ? (((this.ac.currentTime - c.t0) % c.L) + c.L) % c.L : 0;
  }
};
window.StemScoreEngine = StemScoreEngine;
