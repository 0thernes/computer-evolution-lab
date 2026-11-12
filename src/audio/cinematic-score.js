// Procedural orchestral score engine (fallback when the sampled stem score in stem-score.js can't
// load, e.g. from file://) + hardware SFX. All music is original; cues are described only by mood
// ("in the mood of epic/hybrid orchestral"), never by composer (see docs/adr/0002-score-attribution.md).

var Xy = window.LAB_SFX_CLIPS || {};

var us = {
  hub: {
    film: "The Thin Red Line & Interstellar",
    style: "gallery",
    mood: "elegiac divisi strings, felt piano & cathedral organ",
  },
  turing: {
    film: "The Imitation Game",
    style: "imitation",
    mood: "intimate felt piano ostinato & solo cello",
  },
  z1: {
    film: "The Imitation Game & Hugo",
    style: "imitation",
    mood: "clockwork piano arpeggios & warm chamber strings",
  },
  analog: {
    film: "Oppenheimer",
    style: "oppenheimer",
    mood: "propulsive spiccato strings, timpani & brass swells",
  },
  tube: {
    film: "Oppenheimer & Dunkirk",
    style: "oppenheimer",
    mood: "clockwork tension, contrabasses & noble horns",
  },
  pdp8: {
    film: "A Beautiful Mind",
    style: "mind",
    mood: "kaleidoscopic piano triplets & luminous wordless choir",
  },
  altair: {
    film: "Apollo 13 & A Beautiful Mind",
    style: "mind",
    mood: "noble French horns, celesta & soaring strings",
  },
  home80: {
    film: "Tron: Legacy",
    style: "tron",
    mood: "orchestral strings over precision analog arpeggiator",
  },
  pc90: {
    film: "Blade Runner",
    style: "blade",
    mood: "CS-80 brass ribbon lead, rain bells & deep symphonic pad",
  },
  pc00: {
    film: "Inception",
    style: "inception",
    mood: "Time-style slow building cello/horn ostinato & low brass",
  },
  pc10: {
    film: "Inception & The Social Network",
    style: "inception",
    mood: "driving ostinato, pocket-watch pulse & cathedral brass",
  },
  pc20: {
    film: "Blade Runner 2049 & Dunkirk",
    style: "matrix",
    mood: "hybrid orchestral pulse, CS-80 sub-bass & soaring strings",
  },
  aibox: {
    film: "Ex Machina & Interstellar",
    style: "exmachina",
    mood: "crystalline harmonic piano, choir & deep pedal organ",
  },
  quantum: {
    film: "Interstellar",
    style: "interstellar",
    mood: "majestic cathedral pipe organ, breathing arpeggios & strings",
  },
  bci: {
    film: "The Thin Red Line & Arrival",
    style: "annihilation",
    mood: "luminous suspended divisi strings & human formant choir",
  },
  alife: {
    film: "The Tree of Life & Annihilation",
    style: "annihilation",
    mood: "cathedral suspensions, glass harmonics & warm celli",
  },
  photonic: {
    film: "Arrival & Solaris",
    style: "glass",
    mood: "shimmering Philip Glass-style harmonic waves & choir",
  },
  m6502: {
    film: "Apollo 13 & Tron: Legacy",
    style: "chiphero",
    mood: "heroic French horns, orchestral strings & pure pulse voice",
  },
  s360: {
    film: "Apollo 13 & Oppenheimer",
    style: "oppenheimer",
    mood: "propulsive spiccato strings, noble horns & mainframe timpani",
  },
  unix70: {
    film: "A Beautiful Mind & All the President's Men",
    style: "mind",
    mood: "flowing piano triplets, warm horns & Bell Labs choir",
  },
  sun90: {
    film: "Blade Runner & Heat",
    style: "blade",
    mood: "CS-80 brass ribbon, celesta bells & nocturnal strings",
  },
  cloud10: {
    film: "Inception & The Social Network",
    style: "inception",
    mood: "driving cello ostinato, cathedral brass & optical pulse",
  },
  zmain20: {
    film: "Blade Runner 2049 & Tenet",
    style: "matrix",
    mood: "hybrid orchestral ostinato, low brass swells & precision pulse",
  },
  cray1: {
    film: "Apollo 13 & Tron: Legacy",
    style: "chiphero",
    mood: "soaring French horns, concert timpani & 80 MHz vector pulse",
  },
  cm2: {
    film: "Tron: Legacy & Contact",
    style: "tron",
    mood: "symphonic strings over 65,536-PE hypercube arpeggiator",
  },
  bgene: {
    film: "The Thin Red Line & Inception",
    style: "inception",
    mood: "cathedral brass build & synchronous torus ostinato",
  },
  exascale: {
    film: "Oppenheimer & Interstellar",
    style: "matrix",
    mood: "titan low brass, spiccato strings & exascale timpani",
  },
  gb200: {
    film: "Ex Machina & Blade Runner 2049",
    style: "exmachina",
    mood: "crystalline harmonic piano, organ pedal & neural choir",
  },
  qtransmon: {
    film: "Interstellar",
    style: "interstellar",
    mood: "15 mK cathedral pipe organ, felt piano & breathing strings",
  },
  qatom: {
    film: "Arrival & A Beautiful Mind",
    style: "glass",
    mood: "shimmering optical-tweezer harmonic waves & celesta",
  },
  qphotonic: {
    film: "Solaris & Arrival",
    style: "glass",
    mood: "luminous 1550 nm glass harmonics, choir & triplet piano",
  },
  qtopo: {
    film: "The Tree of Life & Annihilation",
    style: "suspended",
    mood: "suspended Majorana divisi strings, organ & formant choir",
  },
  qomega: {
    film: "Interstellar & 2001: A Space Odyssey",
    style: "epic",
    mood: "grand cathedral organ, solo cello, French horns & horizon choir",
  },
  agc66: {
    film: "Apollo 13 & First Man",
    style: "noble",
    mood: "noble mission brass, solo trumpet, luminous choir & felt piano",
  },
  alto73: {
    film: "The Imitation Game & Steve Jobs",
    style: "imitation",
    mood: "intimate felt piano arpeggios, solo cello & chamber strings",
  },
  arm07: {
    film: "Ex Machina & Her",
    style: "exmachina",
    mood: "warm felt grand piano, glass harmonics & intimate strings",
  },
  vax78: {
    film: "JFK & All the President's Men",
    style: "elegiac",
    mood: "elegiac adagio strings, noble solo brass & concert snare",
  },
  cdc6600: {
    film: "Oppenheimer & Hidden Figures",
    style: "clockwork",
    mood: "clockwork spiccato strings, Freon-era horns & concert timpani",
  },
  ascired97: {
    film: "Crimson Tide & Inception",
    style: "inception",
    mood: "driving cello ostinato, TeraFLOPS low brass & cathedral horns",
  },
  qion: {
    film: "Arrival & Contact",
    style: "glass",
    mood: "crystalline trapped-ion harmonic waves, celesta & choir",
  },
  qanneal: {
    film: "Interstellar & Sunshine",
    style: "suspended",
    mood: "15 mK cathedral pedal organ, suspended strings & solo cello",
  },
  eniac46: {
    film: "Oppenheimer & The Imitation Game",
    style: "oppenheimer",
    mood: "100 kHz clockwork spiccato strings, contrabasses & brass",
  },
  lisp83: {
    film: "A Beautiful Mind & Tron: Legacy",
    style: "mind",
    mood: "recursive felt piano triplets, celesta & wordless choir",
  },
  wse24: {
    film: "Ex Machina & Blade Runner 2049",
    style: "exmachina",
    mood: "crystalline harmonic piano, organ pedal & wafer-scale pulse",
  },
  tandem77: {
    film: "All the President's Men & JFK",
    style: "elegiac",
    mood: "elegiac adagio strings, noble solo trumpet & steady snare",
  },
  blade04: {
    film: "The Social Network & Inception",
    style: "inception",
    mood: "driving ostinato, pocket-watch pulse & datacenter brass",
  },
  systolic82: {
    film: "Tron: Legacy & Apollo 13",
    style: "chiphero",
    mood: "rhythmic systolic arpeggiator, French horns & strings",
  },
  fugaku20: {
    film: "Inception & Oppenheimer",
    style: "matrix",
    mood: "titan low brass, spiccato strings & concert timpani",
  },
  qspin: {
    film: "Arrival & Interstellar",
    style: "glass",
    mood: "crystalline silicon-spin harmonic waves, choir & organ",
  },
};

var SCORE_THEMES = [
  ["auto", "Auto · era-matched original score"],
  ["epic", "Epic hybrid orchestral · cathedral organ, solo cello and ostinato"],
  ["noble", "Noble orchestral · horns, choir and kaleidoscope piano"],
  ["clockwork", "Clockwork hybrid · spiccato strings and brass"],
  ["suspended", "Suspended · cathedral strings and 32' organ"],
  ["elegiac", "Elegiac · adagio strings, trumpet and snare"],
  ["slowbuild", "Slow-build · cello and brass crescendo"],
  ["synthnoir", "Synth-noir · CS-80-style brass and rain bells"],
];
// localStorage values saved by v5 used composer names; map them to the mood palettes
var SCORE_THEME_MIGRATION = {
  zimmer: "epic",
  horner: "noble",
  nolan: "clockwork",
  malick: "suspended",
  stone: "elegiac",
  inception: "slowbuild",
  vangelis: "synthnoir",
};

var Yy = (id) => {
  const entry = us[id] || us.hub;
  return entry.mood
    ? "Original score · in the mood of epic/hybrid orchestral"
    : "Original orchestral gallery score";
};

var ii = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
var Fm = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// Hand-voiced cinematic cues: every chord has [bass, tenor, alto, soprano, colorTone] + composed melody
var CINEMATIC_CUES = {
  // Gallery: luminous elegy (D minor -> Bbmaj9 -> Fmaj7 -> Csus4/A)
  gallery: {
    bpm: 64,
    subdiv: 4, // 16th-note grid, 16 steps/bar
    barsPerChord: 2,
    chords: [
      {
        name: "Dm(add9)",
        bass: 38,
        notes: [50, 57, 62, 64, 69],
        mel: [69, null, 72, 69, 65, null, 64, null],
      },
      {
        name: "Bbmaj9",
        bass: 34,
        notes: [46, 53, 58, 62, 69],
        mel: [65, null, 69, 74, 72, null, 69, null],
      },
      {
        name: "Fmaj7/A",
        bass: 33,
        notes: [45, 53, 60, 64, 69],
        mel: [72, null, 69, 65, 67, null, 64, null],
      },
      {
        name: "Csus4 → A7",
        bass: 36,
        notes: [48, 55, 60, 65, 67],
        mel: [67, null, 65, 64, 62, null, 64, null],
      },
      {
        name: "Gm9",
        bass: 31,
        notes: [43, 50, 58, 62, 69],
        mel: [69, null, 74, 72, 69, null, 65, null],
      },
      {
        name: "Dm/F",
        bass: 29,
        notes: [41, 50, 57, 62, 65],
        mel: [65, null, 64, 62, 60, null, 57, null],
      },
      {
        name: "Ebmaj7(#11)",
        bass: 39,
        notes: [51, 58, 62, 67, 69],
        mel: [67, null, 69, 70, 69, null, 67, null],
      },
      {
        name: "Asus4 → A",
        bass: 33,
        notes: [45, 52, 57, 64, 69],
        mel: [69, null, 65, 64, 61, null, null, null],
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      const totalSteps = 32; // 2 bars of 16
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * totalSteps * 1.04, 0.22 + 0.12 * act);
        eng.cathedralOrgan(
          [chord.bass, chord.notes[0], chord.notes[2]],
          stepDur * totalSteps,
          0.1 + 0.08 * act,
        );
        if (act > 0.18) {
          eng.frenchHorns(
            [chord.notes[0], chord.notes[1], chord.notes[3]],
            stepDur * 26,
            0.12 + 0.12 * act,
          );
        }
      }
      if (stepInChord === 16) {
        eng.luminousChoir(
          [chord.notes[2], chord.notes[3], chord.notes[4]],
          stepDur * 16,
          0.09 + 0.08 * act,
        );
      }
      if (stepInChord === 8 && act > 0.14) {
        eng.soloCello(chord.notes[2], stepDur * 22, 0.19 + 0.09 * act);
      }
      if (stepInChord % 4 === 0) {
        const mIdx = Math.floor(stepInChord / 4);
        const mNote = chord.mel[mIdx];
        if (mNote != null) {
          eng.concertPiano(mNote + 12, stepDur * 6.5, 0.19 + 0.09 * act, -0.12);
        }
        // Gentle accompanying left-hand fifth
        if (stepInChord % 8 === 0) {
          eng.concertPiano(chord.notes[0], stepDur * 8, 0.14, -0.22);
        }
      }
    },
  },

  // Epic organ-and-strings palette: Am -> Fmaj7/A -> C/G -> G6(add11)
  interstellar: {
    bpm: 96,
    subdiv: 4,
    barsPerChord: 1,
    chords: [
      {
        name: "Am9",
        bass: 33,
        notes: [45, 52, 60, 64, 71],
        arp: [64, 71, 72, 71, 64, 71, 72, 71],
        top: 76,
      },
      {
        name: "Fmaj7(#11)/A",
        bass: 33,
        notes: [45, 53, 60, 64, 71],
        arp: [64, 71, 72, 71, 64, 71, 74, 72],
        top: 76,
      },
      {
        name: "C(add9)/G",
        bass: 31,
        notes: [43, 52, 60, 64, 74],
        arp: [64, 72, 74, 72, 64, 72, 76, 74],
        top: 79,
      },
      {
        name: "G6(sus4)",
        bass: 31,
        notes: [43, 50, 59, 64, 72],
        arp: [62, 71, 72, 71, 62, 71, 74, 71],
        top: 74,
      },
      {
        name: "Dm9",
        bass: 26,
        notes: [38, 50, 57, 64, 65],
        arp: [64, 69, 72, 69, 64, 69, 74, 72],
        top: 77,
      },
      {
        name: "Am/E",
        bass: 28,
        notes: [40, 52, 57, 64, 72],
        arp: [64, 71, 72, 71, 64, 71, 76, 72],
        top: 76,
      },
      {
        name: "Fmaj9",
        bass: 29,
        notes: [41, 53, 57, 64, 69],
        arp: [64, 69, 72, 69, 64, 69, 76, 74],
        top: 81,
      },
      {
        name: "Esus4 → E",
        bass: 28,
        notes: [40, 52, 59, 64, 69],
        arp: [64, 69, 71, 69, 64, 68, 71, 68],
        top: 76,
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.cathedralOrgan(
          [chord.bass, chord.notes[0], chord.notes[2], chord.notes[3]],
          stepDur * 16.4,
          0.24 + 0.14 * act,
        );
        eng.divisiStrings(chord.notes, stepDur * 16.5, 0.16 + 0.14 * act);
        if (act > 0.35) {
          eng.frenchHorns(
            [chord.notes[0], chord.notes[2], chord.top - 12],
            stepDur * 15,
            0.14 + 0.12 * act,
          );
        }
      }
      // Breathing 8th-note organ & felt-piano ostinato
      if (stepInChord % 2 === 0) {
        const idx = (stepInChord / 2) % 8;
        const n = chord.arp[idx];
        const pulseVel = (idx % 2 === 0 ? 0.18 : 0.12) * (0.85 + 0.35 * act);
        eng.cathedralOrgan([n], stepDur * 2.1, pulseVel * 0.85);
        eng.concertPiano(n, stepDur * 3.0, pulseVel, ((idx % 4) - 1.5) * 0.1);
      }
      if (stepInChord === 0 && act > 0.12) {
        eng.soloCello(chord.notes[2], stepDur * 15.2, 0.18 + 0.11 * act);
      }
      if (stepInChord === 8 && act > 0.2) {
        eng.concertPiano(chord.top, stepDur * 8, 0.2 + 0.08 * act, 0.18);
      }
      // Subtle pocket-watch tick
      if (stepInChord % 4 === 0) {
        eng.pocketWatchTick(stepInChord % 8 === 0, 0.09 + 0.06 * act);
      }
    },
  },

  // Intimate piano and solo strings (C minor -> Abmaj7 -> Fm9 -> G7sus4)
  imitation: {
    bpm: 100,
    subdiv: 4,
    barsPerChord: 1,
    chords: [
      {
        name: "Cm9",
        bass: 36,
        notes: [48, 55, 63, 67, 74],
        arp: [60, 63, 67, 74, 67, 63, 67, 72],
        mel: 79,
      },
      {
        name: "Abmaj9",
        bass: 32,
        notes: [44, 51, 60, 63, 70],
        arp: [60, 63, 68, 70, 68, 63, 68, 72],
        mel: 75,
      },
      {
        name: "Eb(add9)/G",
        bass: 31,
        notes: [43, 51, 58, 63, 67],
        arp: [58, 63, 67, 70, 67, 63, 67, 74],
        mel: 74,
      },
      {
        name: "Fm9",
        bass: 29,
        notes: [41, 48, 56, 63, 67],
        arp: [56, 60, 65, 67, 65, 60, 65, 68],
        mel: 72,
      },
      {
        name: "Cm/Eb",
        bass: 39,
        notes: [51, 55, 60, 67, 74],
        arp: [60, 63, 67, 74, 67, 63, 67, 75],
        mel: 79,
      },
      {
        name: "Dm7b5/Ab",
        bass: 32,
        notes: [44, 50, 60, 65, 68],
        arp: [60, 62, 65, 68, 65, 62, 65, 72],
        mel: 77,
      },
      {
        name: "Gsus4",
        bass: 31,
        notes: [43, 50, 60, 65, 67],
        arp: [55, 60, 62, 67, 62, 60, 62, 65],
        mel: 74,
      },
      {
        name: "G7(b9)",
        bass: 31,
        notes: [43, 50, 59, 65, 68],
        arp: [55, 59, 62, 68, 65, 62, 59, 62],
        mel: 71,
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes.slice(0, 4), stepDur * 16.5, 0.15 + 0.12 * act);
        eng.concertPiano(chord.bass + 12, stepDur * 14, 0.22, -0.25);
      }
      if (stepInChord % 2 === 0) {
        const idx = (stepInChord / 2) % 8;
        eng.concertPiano(
          chord.arp[idx],
          stepDur * 2.8,
          (idx === 0 || idx === 3 ? 0.2 : 0.13) * (0.85 + 0.3 * act),
          0.08,
        );
      }
      if (stepInChord === 4 && act > 0.15) {
        eng.divisiStrings([chord.mel], stepDur * 11, 0.14 + 0.1 * act);
      }
    },
  },

  // Clockwork palette: propulsive spiccato tension
  oppenheimer: {
    bpm: 132,
    subdiv: 4,
    barsPerChord: 1,
    chords: [
      {
        name: "Gm(add b6)",
        bass: 31,
        notes: [43, 50, 58, 62, 63],
        pulse: [55, 58, 62, 58, 63, 58],
        horn: 67,
      },
      {
        name: "Ebmaj7/G",
        bass: 31,
        notes: [43, 51, 58, 63, 67],
        pulse: [55, 58, 63, 58, 67, 63],
        horn: 70,
      },
      {
        name: "Cm9/G",
        bass: 31,
        notes: [43, 48, 55, 63, 67],
        pulse: [55, 60, 63, 60, 67, 63],
        horn: 72,
      },
      {
        name: "D7sus4 → D7",
        bass: 26,
        notes: [38, 50, 57, 62, 66],
        pulse: [54, 57, 62, 57, 66, 62],
        horn: 69,
      },
      {
        name: "Em(add9)",
        bass: 28,
        notes: [40, 47, 55, 64, 66],
        pulse: [52, 55, 59, 55, 64, 59],
        horn: 71,
      },
      {
        name: "Cmaj7(#11)",
        bass: 36,
        notes: [48, 55, 59, 66, 71],
        pulse: [55, 59, 64, 59, 66, 64],
        horn: 74,
      },
      {
        name: "Am9",
        bass: 33,
        notes: [45, 52, 60, 64, 71],
        pulse: [57, 60, 64, 60, 71, 64],
        horn: 76,
      },
      {
        name: "B7sus4 → B7",
        bass: 35,
        notes: [47, 54, 59, 63, 69],
        pulse: [54, 59, 63, 59, 66, 63],
        horn: 71,
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(
          [chord.bass, chord.notes[0], chord.notes[2]],
          stepDur * 16.2,
          0.2 + 0.14 * act,
        );
        eng.frenchHorns(
          [chord.notes[1], chord.notes[2], chord.horn],
          stepDur * 14.5,
          0.14 + 0.15 * act,
        );
        eng.concertTimpani(chord.bass, 0.28 + 0.2 * act);
      }
      if (stepInChord === 12 && act > 0.3) {
        eng.concertTimpani(chord.bass + 7, 0.18 + 0.14 * act);
      }
      // Polyrhythmic 3+3+2 spiccato string pulse
      const accent = [1, 0, 0, 1, 0, 0, 1, 0][stepInChord % 8];
      if (stepInChord % 2 === 0 || act > 0.35) {
        const pNote = chord.pulse[stepInChord % chord.pulse.length];
        eng.spiccatoStrings(
          pNote + (stepInChord >= 8 && act > 0.45 ? 12 : 0),
          stepDur * 1.15,
          (accent ? 0.21 : 0.11) * (0.8 + 0.4 * act),
        );
      }
      if (stepInChord % 4 === 0) {
        eng.pocketWatchTick(stepInChord % 8 === 0, 0.12 + 0.08 * act);
      }
    },
  },

  // Noble palette: flowing piano figures, luminous choir and horns
  mind: {
    bpm: 88,
    subdiv: 3, // 12 steps/bar (flowing compound 12/8 triplet feel!)
    barsPerChord: 1,
    chords: [
      {
        name: "Ebmaj9",
        bass: 39,
        notes: [51, 58, 63, 67, 74],
        trip: [63, 67, 70, 74, 70, 67],
        horn: 75,
      },
      {
        name: "Cm11",
        bass: 36,
        notes: [48, 55, 63, 67, 74],
        trip: [60, 63, 67, 74, 67, 63],
        horn: 74,
      },
      {
        name: "Abmaj7(#11)",
        bass: 32,
        notes: [44, 51, 60, 67, 74],
        trip: [60, 63, 68, 74, 68, 63],
        horn: 72,
      },
      {
        name: "Bbsus4 → Bb",
        bass: 34,
        notes: [46, 53, 58, 63, 70],
        trip: [58, 63, 65, 70, 65, 62],
        horn: 70,
      },
      {
        name: "Fm9",
        bass: 29,
        notes: [41, 48, 56, 63, 67],
        trip: [56, 60, 65, 67, 65, 60],
        horn: 68,
      },
      {
        name: "Eb/G",
        bass: 31,
        notes: [43, 51, 58, 63, 70],
        trip: [58, 63, 67, 70, 67, 63],
        horn: 75,
      },
      {
        name: "Dbmaj9",
        bass: 37,
        notes: [49, 56, 60, 65, 68],
        trip: [60, 65, 68, 72, 68, 65],
        horn: 77,
      },
      {
        name: "Bbsus4",
        bass: 34,
        notes: [46, 53, 58, 63, 65],
        trip: [58, 63, 65, 70, 65, 63],
        horn: 74,
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.luminousChoir(
          [chord.notes[1], chord.notes[2], chord.notes[3], chord.notes[4]],
          stepDur * 12.6,
          0.16 + 0.12 * act,
        );
        eng.divisiStrings(chord.notes.slice(0, 4), stepDur * 12.6, 0.16 + 0.1 * act);
        eng.concertPiano(chord.bass + 12, stepDur * 11, 0.21, -0.22);
        if (act > 0.25) {
          eng.frenchHorns(
            [chord.notes[0], chord.notes[2], chord.horn - 12],
            stepDur * 11.5,
            0.15 + 0.12 * act,
          );
        }
      }
      // Flowing triplet piano figures
      const n = chord.trip[stepInChord % 6];
      eng.concertPiano(
        n + (stepInChord >= 6 ? 12 : 0),
        stepDur * 3.4,
        (stepInChord % 3 === 0 ? 0.19 : 0.12) * (0.85 + 0.3 * act),
        ((stepInChord % 6) - 2.5) * 0.08,
      );
      if (stepInChord === 6 && act > 0.2) {
        eng.celestaBell(chord.horn, stepDur * 6, 0.09 + 0.06 * act);
        eng.soloTrumpet(chord.horn - 12, stepDur * 6.2, 0.15 + 0.1 * act);
      }
    },
  },

  // Slow-build palette: Em -> G/D -> Bm7 -> Cmaj7 crescendo
  inception: {
    bpm: 72,
    subdiv: 4,
    barsPerChord: 1,
    chords: [
      { name: "Am9", bass: 33, notes: [45, 52, 60, 64, 71], lead: [64, 69, 71, 72] },
      { name: "Em7/B", bass: 35, notes: [47, 55, 59, 64, 71], lead: [71, 67, 64, 67] },
      { name: "G(add9)", bass: 31, notes: [43, 50, 59, 62, 69], lead: [67, 71, 74, 71] },
      { name: "D(add4)", bass: 26, notes: [38, 50, 57, 62, 66], lead: [66, 67, 69, 66] },
      {
        name: "Fmaj7(#11)",
        bass: 29,
        notes: [41, 48, 57, 64, 71],
        lead: [64, 69, 72, 76],
      },
      { name: "Cmaj9", bass: 36, notes: [48, 55, 60, 64, 74], lead: [74, 72, 67, 64] },
      { name: "Dm9", bass: 26, notes: [38, 45, 53, 62, 64], lead: [62, 65, 69, 65] },
      {
        name: "Esus4 → E",
        bass: 28,
        notes: [40, 47, 56, 64, 69],
        lead: [64, 69, 68, 64],
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * 16.6, 0.22 + 0.14 * act);
        eng.lowBrassSwell(chord.bass, stepDur * 15.5, 0.22 + 0.18 * act);
        eng.frenchHorns(
          [chord.notes[0], chord.notes[2], chord.notes[3]],
          stepDur * 15.5,
          0.16 + 0.14 * act,
        );
        eng.concertPiano(chord.bass + 12, stepDur * 14, 0.24, -0.2);
      }
      if (stepInChord % 4 === 0) {
        const q = Math.floor(stepInChord / 4);
        eng.concertPiano(chord.lead[q], stepDur * 5.2, 0.2 + 0.08 * act, 0.12);
        // Electric-cello / spiccato pulse
        eng.spiccatoStrings(chord.notes[0], stepDur * 2.2, 0.14 + 0.12 * act);
      }
      if (stepInChord % 2 === 0 && act > 0.35) {
        eng.spiccatoStrings(
          chord.notes[1 + (stepInChord % 2)],
          stepDur * 1.4,
          0.1 + 0.1 * act,
        );
      }
    },
  },

  // Daft Punk / Joseph Trapanese "Tron: Legacy" symphonic strings + precision arpeggiator
  tron: {
    bpm: 110,
    subdiv: 4,
    barsPerChord: 1,
    chords: [
      {
        name: "Dm",
        bass: 26,
        notes: [38, 50, 57, 62, 65],
        arp: [50, 57, 62, 65, 69, 65, 62, 57],
      },
      {
        name: "Bb(add9)",
        bass: 34,
        notes: [46, 53, 58, 62, 65],
        arp: [46, 53, 58, 62, 65, 62, 58, 53],
      },
      {
        name: "Gm7",
        bass: 31,
        notes: [43, 50, 58, 62, 65],
        arp: [50, 55, 58, 62, 67, 62, 58, 55],
      },
      {
        name: "Asus4 → A",
        bass: 33,
        notes: [45, 52, 57, 64, 69],
        arp: [45, 52, 57, 64, 69, 64, 61, 57],
      },
      {
        name: "Fmaj7",
        bass: 29,
        notes: [41, 48, 57, 60, 64],
        arp: [48, 53, 57, 60, 64, 60, 57, 53],
      },
      {
        name: "C/E",
        bass: 28,
        notes: [40, 48, 55, 60, 67],
        arp: [48, 55, 60, 64, 67, 64, 60, 55],
      },
      {
        name: "Bb6",
        bass: 34,
        notes: [46, 53, 58, 62, 67],
        arp: [46, 53, 58, 62, 67, 62, 58, 53],
      },
      {
        name: "C(add9)",
        bass: 36,
        notes: [48, 55, 60, 64, 67],
        arp: [48, 55, 60, 64, 74, 67, 64, 60],
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * 16.4, 0.2 + 0.12 * act);
        eng.lowBrassSwell(chord.bass, stepDur * 15, 0.18 + 0.14 * act);
      }
      const n = chord.arp[stepInChord % 8];
      eng.analogArp(
        n + (stepInChord >= 8 ? 12 : 0),
        stepDur * 1.6,
        (stepInChord % 4 === 0 ? 0.2 : 0.13) * (0.85 + 0.3 * act),
      );
      if (stepInChord === 8 && act > 0.25) {
        eng.frenchHorns(
          [chord.notes[1], chord.notes[3], chord.notes[4]],
          stepDur * 8,
          0.15 + 0.1 * act,
        );
      }
    },
  },

  // Synth-noir palette: CS-80-style symphonic brass and bells
  blade: {
    bpm: 62,
    subdiv: 4,
    barsPerChord: 2,
    chords: [
      { name: "C#m9", bass: 25, notes: [37, 44, 52, 59, 63], cs80: [63, 68, 71, 68] },
      {
        name: "Amaj7(#11)",
        bass: 33,
        notes: [45, 52, 56, 63, 68],
        cs80: [64, 68, 73, 71],
      },
      { name: "F#m11", bass: 30, notes: [42, 49, 57, 64, 68], cs80: [66, 68, 64, 61] },
      {
        name: "G#7sus4 → G#",
        bass: 32,
        notes: [44, 51, 56, 61, 66],
        cs80: [61, 63, 60, 56],
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * 32.5, 0.2 + 0.12 * act);
        eng.lowBrassSwell(chord.bass, stepDur * 30, 0.22 + 0.12 * act);
        eng.luminousChoir(
          [chord.notes[2], chord.notes[3], chord.notes[4]],
          stepDur * 30,
          0.11 + 0.08 * act,
        );
      }
      if (stepInChord % 8 === 0) {
        const idx = Math.floor(stepInChord / 8) % 4;
        eng.cs80Ribbon(chord.cs80[idx], stepDur * 8.5, 0.2 + 0.1 * act);
      }
      if (stepInChord % 6 === 2) {
        eng.celestaBell(chord.notes[3] + 12, stepDur * 7, 0.08 + 0.05 * act);
      }
    },
  },

  // Modern Workstation / 2049 / Dunkirk hybrid orchestral engine
  matrix: {
    bpm: 108,
    subdiv: 4,
    barsPerChord: 1,
    chords: [
      {
        name: "Em9",
        bass: 28,
        notes: [40, 47, 55, 64, 66],
        ost: [52, 59, 64, 66, 67, 66, 64, 59],
        horn: 71,
      },
      {
        name: "Cmaj9",
        bass: 36,
        notes: [48, 55, 59, 64, 67],
        ost: [52, 59, 64, 67, 71, 67, 64, 59],
        horn: 74,
      },
      {
        name: "Am11",
        bass: 33,
        notes: [45, 52, 60, 64, 67],
        ost: [52, 60, 64, 67, 72, 67, 64, 60],
        horn: 76,
      },
      {
        name: "Bsus4 → Bm7",
        bass: 35,
        notes: [47, 54, 59, 64, 66],
        ost: [54, 59, 64, 66, 71, 66, 62, 59],
        horn: 74,
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * 16.4, 0.2 + 0.14 * act);
        eng.lowBrassSwell(chord.bass, stepDur * 15.5, 0.22 + 0.16 * act);
        eng.frenchHorns(
          [chord.notes[1], chord.notes[3], chord.horn],
          stepDur * 15,
          0.16 + 0.12 * act,
        );
      }
      if (stepInChord % 2 === 0) {
        const idx = (stepInChord / 2) % 8;
        eng.spiccatoStrings(chord.ost[idx], stepDur * 1.5, 0.16 + 0.1 * act);
        eng.concertPiano(chord.ost[idx] + 12, stepDur * 2.4, 0.12 + 0.08 * act, 0.15);
      }
      if (stepInChord === 0 || stepInChord === 10) {
        eng.concertTimpani(chord.bass, 0.22 + 0.16 * act);
      }
    },
  },

  // Ex Machina / Interstellar crystalline ambient symphony
  exmachina: {
    bpm: 76,
    subdiv: 4,
    barsPerChord: 2,
    chords: [
      {
        name: "Fmaj9(#11)",
        bass: 29,
        notes: [41, 48, 57, 64, 71],
        bell: [72, 76, 79, 71],
      },
      { name: "Dm11", bass: 26, notes: [38, 45, 55, 62, 69], bell: [69, 74, 76, 72] },
      { name: "Bbmaj9", bass: 34, notes: [46, 53, 58, 65, 69], bell: [69, 72, 74, 69] },
      { name: "C6/9", bass: 36, notes: [48, 55, 60, 64, 69], bell: [67, 69, 72, 76] },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.cathedralOrgan(
          [chord.bass, chord.notes[0], chord.notes[2]],
          stepDur * 32,
          0.14 + 0.1 * act,
        );
        eng.divisiStrings(chord.notes, stepDur * 32, 0.18 + 0.1 * act);
        eng.luminousChoir(
          [chord.notes[2], chord.notes[3], chord.notes[4]],
          stepDur * 30,
          0.13 + 0.08 * act,
        );
      }
      if (stepInChord % 4 === 0) {
        const idx = Math.floor(stepInChord / 4) % 4;
        eng.concertPiano(chord.bell[idx], stepDur * 6, 0.18 + 0.06 * act, -0.1);
        if (idx % 2 === 1) {
          eng.celestaBell(chord.bell[idx] + 12, stepDur * 8, 0.09 + 0.05 * act);
        }
      }
    },
  },

  // Organic palette: luminous choir and suspended strings
  annihilation: {
    bpm: 58,
    subdiv: 4,
    barsPerChord: 2,
    chords: [
      { name: "Dmaj9", bass: 26, notes: [38, 45, 54, 61, 64], vox: [66, 69, 73] },
      { name: "Bm11", bass: 35, notes: [47, 54, 59, 62, 66], vox: [64, 66, 71] },
      { name: "Gmaj7(#11)", bass: 31, notes: [43, 50, 59, 66, 69], vox: [66, 71, 73] },
      { name: "Asus4", bass: 33, notes: [45, 52, 57, 62, 69], vox: [64, 69, 74] },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * 33, 0.21 + 0.1 * act);
        eng.luminousChoir(chord.vox, stepDur * 31, 0.18 + 0.1 * act);
        eng.cathedralOrgan([chord.bass, chord.notes[0]], stepDur * 32, 0.12 + 0.06 * act);
      }
      if (stepInChord === 8 || stepInChord === 20) {
        eng.concertPiano(
          chord.vox[stepInChord === 8 ? 2 : 1],
          stepDur * 9,
          0.16 + 0.06 * act,
          0.14,
        );
      }
    },
  },

  // Philip Glass / Arrival shimmering harmonic waves
  glass: {
    bpm: 104,
    subdiv: 3, // 12 steps triplet wave!
    barsPerChord: 1,
    chords: [
      {
        name: "Fm(add9)",
        bass: 29,
        notes: [41, 48, 56, 63, 67],
        wave: [60, 63, 67, 68, 67, 63],
      },
      {
        name: "Dbmaj9",
        bass: 37,
        notes: [49, 56, 60, 65, 68],
        wave: [60, 65, 68, 72, 68, 65],
      },
      {
        name: "Ab(add9)/C",
        bass: 36,
        notes: [48, 56, 63, 68, 70],
        wave: [60, 63, 68, 70, 68, 63],
      },
      {
        name: "Eb6/Bb",
        bass: 34,
        notes: [46, 55, 58, 63, 67],
        wave: [58, 63, 67, 70, 67, 63],
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * 12.6, 0.18 + 0.1 * act);
        eng.luminousChoir(
          [chord.notes[2], chord.notes[3], chord.notes[4]],
          stepDur * 12.4,
          0.13 + 0.08 * act,
        );
      }
      const n = chord.wave[stepInChord % 6];
      eng.concertPiano(n + 12, stepDur * 2.8, 0.16 + 0.06 * act, -0.1);
      if (stepInChord % 3 === 0) {
        eng.celestaBell(n + 12, stepDur * 4, 0.08 + 0.05 * act);
      }
    },
  },

  // MOS 6502 Heroic Orchestral + Pure Silicon Pulse Hybrid (C minor -> Ab -> Eb -> Bb)
  chiphero: {
    bpm: 112,
    subdiv: 4,
    barsPerChord: 1,
    chords: [
      {
        name: "Cm9",
        bass: 36,
        notes: [48, 55, 63, 67, 74],
        arp: [60, 63, 67, 72, 74, 72, 67, 63],
        hero: 79,
      },
      {
        name: "Abmaj7",
        bass: 32,
        notes: [44, 51, 60, 63, 67],
        arp: [56, 60, 63, 68, 72, 68, 63, 60],
        hero: 75,
      },
      {
        name: "Ebmaj9",
        bass: 39,
        notes: [51, 58, 63, 67, 74],
        arp: [58, 63, 67, 70, 74, 70, 67, 63],
        hero: 74,
      },
      {
        name: "Bb6",
        bass: 34,
        notes: [46, 53, 58, 62, 67],
        arp: [58, 62, 65, 67, 70, 67, 65, 62],
        hero: 70,
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * 16.4, 0.2 + 0.12 * act);
        eng.frenchHorns(
          [chord.notes[0], chord.notes[2], chord.hero - 12],
          stepDur * 15,
          0.18 + 0.12 * act,
        );
        eng.concertTimpani(chord.bass, 0.2 + 0.12 * act);
      }
      if (stepInChord % 2 === 0) {
        const idx = (stepInChord / 2) % 8;
        eng.analogArp(chord.arp[idx] + 12, stepDur * 1.8, 0.12 + 0.08 * act);
      }
      if (stepInChord === 0 || stepInChord === 8) {
        eng.concertPiano(chord.hero, stepDur * 6, 0.18 + 0.08 * act, 0.15);
      }
    },
  },

  // Suspended palette: 32' cathedral organ, suspended diatonic strings and singing solo cello
  suspended: {
    bpm: 56,
    subdiv: 4,
    barsPerChord: 2,
    chords: [
      {
        name: "Dm(add9)",
        bass: 26,
        notes: [38, 45, 53, 62, 64],
        cello: 57,
        vox: [65, 69, 74],
      },
      {
        name: "Bbmaj7(#11)",
        bass: 34,
        notes: [46, 53, 57, 62, 69],
        cello: 58,
        vox: [65, 69, 72],
      },
      {
        name: "Fmaj9/A",
        bass: 33,
        notes: [45, 53, 60, 64, 67],
        cello: 60,
        vox: [65, 72, 76],
      },
      {
        name: "Csus4 → C",
        bass: 36,
        notes: [48, 55, 60, 65, 67],
        cello: 62,
        vox: [67, 72, 74],
      },
      {
        name: "Gm11",
        bass: 31,
        notes: [43, 50, 58, 62, 65],
        cello: 58,
        vox: [65, 69, 74],
      },
      {
        name: "Asus4 → A",
        bass: 33,
        notes: [45, 52, 57, 64, 69],
        cello: 57,
        vox: [64, 69, 73],
      },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * 33.2, 0.24 + 0.12 * act);
        eng.cathedralOrgan(
          [chord.bass, chord.notes[0], chord.notes[2]],
          stepDur * 32.5,
          0.16 + 0.1 * act,
        );
        eng.soloCello(chord.cello, stepDur * 28, 0.22 + 0.1 * act);
      }
      if (stepInChord === 12) {
        eng.luminousChoir(chord.vox, stepDur * 20, 0.14 + 0.1 * act);
        if (act > 0.22) {
          eng.frenchHorns(
            [chord.notes[0], chord.notes[2], chord.notes[3]],
            stepDur * 18,
            0.15 + 0.12 * act,
          );
        }
      }
      if (stepInChord === 6 || stepInChord === 22) {
        eng.concertPiano(
          chord.vox[stepInChord === 6 ? 1 : 2],
          stepDur * 10,
          0.16 + 0.06 * act,
          0.12,
        );
      }
    },
  },

  // Elegiac palette: climbing adagio strings, solo trumpet and distant concert snare
  elegiac: {
    bpm: 60,
    subdiv: 4,
    barsPerChord: 2,
    chords: [
      { name: "Bm(add9)", bass: 35, notes: [47, 54, 59, 62, 66], trp: [66, 71, 73, 74] },
      { name: "Gmaj9", bass: 31, notes: [43, 50, 59, 62, 69], trp: [71, 74, 78, 76] },
      { name: "Em11", bass: 28, notes: [40, 47, 55, 62, 67], trp: [74, 71, 67, 69] },
      {
        name: "F#7sus4 → F#",
        bass: 30,
        notes: [42, 49, 54, 61, 66],
        trp: [66, 67, 66, 64],
      },
      { name: "Dmaj9/F#", bass: 30, notes: [42, 50, 57, 62, 69], trp: [69, 74, 76, 78] },
      { name: "Em7/G", bass: 31, notes: [43, 52, 59, 64, 71], trp: [76, 74, 71, 67] },
      { name: "Asus4", bass: 33, notes: [45, 52, 57, 62, 69], trp: [69, 71, 74, 73] },
      { name: "Bm/F#", bass: 30, notes: [42, 47, 54, 62, 66], trp: [71, 69, 66, 62] },
    ],
    render(eng, stepInChord, chord, stepDur, act) {
      if (stepInChord === 0) {
        eng.divisiStrings(chord.notes, stepDur * 33.4, 0.25 + 0.13 * act);
        eng.frenchHorns(
          [chord.notes[0], chord.notes[1], chord.notes[3]],
          stepDur * 30,
          0.16 + 0.12 * act,
        );
        eng.soloCello(chord.notes[1], stepDur * 28, 0.18 + 0.08 * act);
      }
      if (stepInChord % 8 === 0) {
        const idx = Math.floor(stepInChord / 8) % 4;
        eng.soloTrumpet(chord.trp[idx], stepDur * 8.4, 0.19 + 0.1 * act);
      }
      if (stepInChord === 0 || stepInChord === 16) {
        eng.concertSnareRoll(stepDur * 7.5, 0.065 + 0.055 * act);
      }
      if (stepInChord === 16 && act > 0.25) {
        eng.concertTimpani(chord.bass, 0.18 + 0.12 * act);
      }
    },
  },
};

// Mood-palette aliases so both UI SCORE_THEMES and automated tests resolve directly
CINEMATIC_CUES.epic = CINEMATIC_CUES.interstellar;
CINEMATIC_CUES.noble = CINEMATIC_CUES.mind;
CINEMATIC_CUES.clockwork = CINEMATIC_CUES.oppenheimer;
CINEMATIC_CUES.synthnoir = CINEMATIC_CUES.blade;
CINEMATIC_CUES.slowbuild = CINEMATIC_CUES.inception;

var OrchestralScoreEngine = class {
  constructor(host) {
    this.h = host;
    this.ac = host.ac;
    this.cueKey = "gallery";
    this.chordIdx = 0;
    this.stepInChord = 0;
    this.nextNoteTime = 0;
    this.currentChordName = "Dm(add9)";
    this.currentBpm = 64;

    // Orchestral seating & body resonance chain
    this.dryBus = this.ac.createGain();
    this.dryBus.gain.value = 0.86;
    this.dryBus.connect(host.musicBus);

    // Warm concert-hall send
    this.hallSend = this.ac.createGain();
    this.hallSend.gain.value = 0.56;
    this.hallSend.connect(host.verbIn);

    // Subtle stereo chorus / ensemble widening bus for divisi strings & choir
    this.ensIn = this.ac.createGain();
    const dL = this.ac.createDelay(0.06);
    const dR = this.ac.createDelay(0.06);
    dL.delayTime.value = 0.017;
    dR.delayTime.value = 0.023;
    const lfoL = this.ac.createOscillator();
    const lfoR = this.ac.createOscillator();
    lfoL.frequency.value = 0.42;
    lfoR.frequency.value = 0.51;
    const gL = host.gain(0.0028);
    const gR = host.gain(0.0031);
    lfoL.connect(gL);
    gL.connect(dL.delayTime);
    lfoR.connect(gR);
    gR.connect(dR.delayTime);
    lfoL.start();
    lfoR.start();

    const merge = this.ac.createChannelMerger(2);
    this.ensIn.connect(dL);
    this.ensIn.connect(dR);
    dL.connect(merge, 0, 0);
    dR.connect(merge, 0, 1);
    const ensOut = host.gain(0.4, this.dryBus);
    merge.connect(ensOut);
    merge.connect(this.hallSend);

    // Precomputed warm nonlinear brass saturation curve (soft acoustic harmonic bloom)
    this.brassCurve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = i / 511.5 - 1;
      this.brassCurve[i] = Math.tanh(1.42 * x) / Math.tanh(1.42);
    }
  }

  _pan(panVal, destA, sendGain = 0.5) {
    const out = this.ac.createGain();
    if (this.ac.createStereoPanner) {
      const p = this.ac.createStereoPanner();
      p.pan.value = Fm(panVal || 0, -0.9, 0.9);
      out.connect(p);
      p.connect(destA || this.dryBus);
      if (sendGain > 0) {
        const sg = this.h.gain(sendGain, this.hallSend);
        p.connect(sg);
      }
    } else {
      out.connect(destA || this.dryBus);
      if (sendGain > 0) {
        const sg = this.h.gain(sendGain, this.hallSend);
        out.connect(sg);
      }
    }
    return out;
  }

  play(machineId) {
    const override = this.h.scoreOverride;
    const meta = us[machineId] || us.hub;
    const nextStyle =
      override && override !== "auto" && CINEMATIC_CUES[override]
        ? override
        : meta.style || "gallery";
    if (nextStyle !== this.cueKey) {
      this.cueKey = nextStyle;
      this.chordIdx = 0;
      this.stepInChord = 0;
      this.nextNoteTime = this.ac.currentTime + 0.05;
    }
  }

  tick(act) {
    if (this.h.muted || this.h.vol.music <= 0.005) return;
    const cue = CINEMATIC_CUES[this.cueKey] || CINEMATIC_CUES.gallery;
    this.currentBpm = cue.bpm;
    const beatDur = 60 / cue.bpm;
    const stepDur = beatDur / cue.subdiv;
    const stepsPerBar = cue.subdiv * 4;
    const stepsPerChord = stepsPerBar * (cue.barsPerChord || 1);

    const now = this.ac.currentTime;
    if (this.nextNoteTime < now - 0.15) this.nextNoteTime = now + 0.02;

    let guard = 0;
    while (this.nextNoteTime < now + 0.14 && guard++ < 8) {
      const chord = cue.chords[this.chordIdx % cue.chords.length];
      this.currentChordName = chord.name;
      this._t = this.nextNoteTime;
      cue.render(this, this.stepInChord, chord, stepDur, Fm(act, 0, 1));
      this.h.stats.notes++;

      this.stepInChord++;
      if (this.stepInChord >= stepsPerChord) {
        this.stepInChord = 0;
        this.chordIdx = (this.chordIdx + 1) % cue.chords.length;
      }
      this.nextNoteTime += stepDur;
    }
  }

  // 1. Divisi Orchestral Strings (Violins I/II L, Violas C, Celli/Contrabass R, Stradivari/Cello wood corpus + Bridge Hill + rosin harshness notch + staggered bow entry)
  divisiStrings(midiList, dur, vel = 0.2) {
    const tBase = this._t;
    const ac = this.ac;
    const pans = [0.28, 0.11, -0.07, -0.25, -0.38];
    const fullVoicing =
      midiList.length >= 3 && midiList[0] >= 36
        ? [midiList[0] - 12, ...midiList]
        : midiList;

    fullVoicing.forEach((midi, idx) => {
      const t = tBase + idx * 0.015; // Natural desk-by-desk bow entry stagger
      const f = ii(midi);
      const panOut = this._pan(pans[idx % pans.length], this.dryBus, 0.72);
      panOut.connect(this.ensIn);

      // Multi-stage acoustic corpus: wood resonance + 2.1 kHz Bridge Hill + 3.85 kHz harshness dip + warm lowpass
      const bodyPeak = this.h.filt("peaking", midi < 52 ? 215 : 460, 1.35);
      bodyPeak.gain.value = 4.0;
      const bridgeHill = this.h.filt("peaking", 2050, 1.5);
      bridgeHill.gain.value = 2.4;
      const rosinDip = this.h.filt("peaking", 3850, 2.2);
      rosinDip.gain.value = -4.8;
      const lpf = this.h.filt("lowpass", Math.min(3900, f * (3.4 + vel * 5.0)), 0.65);
      const envG = this.h.gain(0.0001, panOut);
      bodyPeak.connect(bridgeHill);
      bridgeHill.connect(rosinDip);
      rosinDip.connect(lpf);
      lpf.connect(envG);

      const atk = Math.min(0.52, dur * 0.3);
      const isSub = idx === 0 && fullVoicing.length > midiList.length;
      const peak =
        ((isSub ? 0.72 : 1.0) * (vel * 0.132)) /
        Math.sqrt(Math.max(1, fullVoicing.length * 0.68));
      envG.gain.setValueAtTime(0.0001, t);
      envG.gain.linearRampToValueAtTime(peak, t + atk);
      envG.gain.setValueAtTime(peak * 0.9, t + Math.max(atk + 0.03, dur * 0.74));
      envG.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.55);

      // Subtle horsehair-on-string breath during bow engagement
      if (!isSub && idx < 2) {
        const bowAir = this.h.filt("bandpass", 1900, 2.4, envG);
        const bg = this.h.gain(0.0001, bowAir);
        bg.gain.setValueAtTime(0.0001, t);
        bg.gain.linearRampToValueAtTime(peak * 0.14, t + Math.min(0.18, atk));
        bg.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.45, dur * 0.5));
        this.h.noiseSrc(t, Math.min(0.5, dur * 0.5), bg, 0.95);
      }

      // Delayed expressive human vibrato (5.1–5.7 Hz)
      const vib = ac.createOscillator();
      const vibG = this.h.gain(0);
      vib.frequency.value = 5.05 + (idx % 4) * 0.22;
      vibG.gain.setValueAtTime(0, t);
      vibG.gain.linearRampToValueAtTime(f * 0.0044, t + Math.min(0.7, dur * 0.45));
      vib.connect(vibG);
      vib.start(t);
      vib.stop(t + dur + 0.6);

      for (const det of isSub ? [-3.5, 3.5] : [-6.2, 0, 6.5]) {
        const osc = ac.createOscillator();
        osc.type = isSub || (det === 0 && midi < 50) ? "triangle" : "sawtooth";
        osc.frequency.setValueAtTime(f, t);
        osc.detune.value = det;
        vibG.connect(osc.frequency);
        osc.connect(bodyPeak);
        osc.start(t);
        osc.stop(t + dur + 0.6);
        this.h.stats.voices++;
      }
    });
  }

  // 2. Spiccato / Short Bowed Chamber Strings (motoric ostinato)
  spiccatoStrings(midi, dur, vel = 0.18) {
    const t = this._t;
    const f = ii(midi);
    const panOut = this._pan(((midi % 5) - 2) * 0.12, this.dryBus, 0.45);
    const lpf = this.h.filt("lowpass", Math.min(3600, f * 4.8), 1.1, panOut);
    const envG = this.h.gain(0.0001, lpf);

    // Subtle rosin bow hair scratch on attack
    const bowF = this.h.filt("bandpass", 2200, 1.8, envG);
    const bowG = this.h.gain(vel * 0.16, bowF);
    this.h.noiseSrc(t, 0.022, bowG, 1.1);

    envG.gain.setValueAtTime(0.0001, t);
    envG.gain.linearRampToValueAtTime(vel * 0.19, t + 0.014);
    envG.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.09, dur * 1.15));

    for (const det of [-4.5, 4.5]) {
      const o = this.ac.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f, t);
      o.detune.value = det;
      o.connect(envG);
      o.start(t);
      o.stop(t + dur * 1.2 + 0.05);
      this.h.stats.voices++;
    }
  }

  // 3. Concert Felt-to-Bright Grand Piano (Spruce soundboard body + stretched harmonics + humanized micro-timing)
  concertPiano(midi, dur, vel = 0.2, pan = 0) {
    const t = this._t + ((midi * 7) % 5) * 0.0018; // Subtle human finger micro-timing
    const f = ii(midi);
    const panOut = this._pan(pan, this.dryBus, 0.56);
    const board = this.h.filt("peaking", 195, 1.2, panOut);
    board.gain.value = 2.8;
    const lpf = this.h.filt("lowpass", Math.min(5200, f * (2.2 + vel * 8.5)), 0.7, board);
    lpf.frequency.setValueAtTime(Math.min(5600, f * (3.1 + vel * 9.5)), t);
    lpf.frequency.exponentialRampToValueAtTime(
      Math.max(240, f * 1.55),
      t + Math.max(0.28, dur * 0.92),
    );

    const envG = this.h.gain(0.0001, lpf);
    const peak = vel * 0.24;
    envG.gain.setValueAtTime(0.0001, t);
    envG.gain.linearRampToValueAtTime(peak, t + 0.007);
    envG.gain.exponentialRampToValueAtTime(peak * 0.38, t + Math.min(0.36, dur * 0.38));
    envG.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.42, dur * 1.32));

    // Stretched piano string partials + unison Bichord/Trichord warmth
    const partials = [
      [1, 0.72, "triangle", -1.2],
      [1, 0.52, "sine", 1.4],
      [2, 0.38, "sine", 0],
      [3, 0.15, "sine", 0],
      [4, 0.06, "sine", 0],
    ];
    for (const [n, amp, type, det] of partials) {
      const fn = f * n * Math.sqrt(1 + 0.00035 * n * n);
      if (fn > 9200) continue;
      const pg = this.h.gain(amp, envG);
      const o = this.ac.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(fn, t);
      if (det) o.detune.value = det;
      o.connect(pg);
      o.start(t);
      o.stop(t + dur * 1.35 + 0.08);
      this.h.stats.voices++;
    }

    // Soft felt hammer & wooden keybed transient
    const knock = this.h.filt("bandpass", 310 + (midi - 48) * 5, 1.6, panOut);
    const kg = this.h.gain(0.0001, knock);
    kg.gain.setValueAtTime(vel * 0.045, t);
    kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
    this.h.noiseSrc(t, 0.022, kg, 0.75);
  }

  // 4. Cathedral Pipe Organ (32'/16'/8'/4'/2-2/3'/2' stops + wind chiff)
  cathedralOrgan(midiList, dur, vel = 0.2) {
    const t = this._t;
    const stops = [
      [0.5, 0.38, "sine"], // 16' Sub-Bourdon
      [1.0, 0.55, "triangle"], // 8' Open Diapason
      [1.0018, 0.34, "sine"], // 8' Voix Céleste warmth
      [2.0, 0.26, "sine"], // 4' Principal Octave
      [2.9966, 0.11, "sine"], // 2-2/3' Nazard fifth
      [4.0, 0.09, "sine"], // 2' Fifteenth
    ];
    midiList.forEach((midi, idx) => {
      const f = ii(midi);
      const panOut = this._pan(
        (idx - (midiList.length - 1) * 0.5) * 0.14,
        this.dryBus,
        0.78,
      );
      const lpf = this.h.filt("lowpass", Math.min(4800, f * 6.5), 0.6, panOut);
      const envG = this.h.gain(0.0001, lpf);
      const peak = (vel * 0.13) / Math.sqrt(Math.max(1, midiList.length * 0.6));

      envG.gain.setValueAtTime(0.0001, t);
      envG.gain.linearRampToValueAtTime(peak, t + 0.065);
      envG.gain.setValueAtTime(peak * 0.94, t + Math.max(0.08, dur - 0.08));
      envG.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);

      // Gentle pipe-mouth wind chiff
      const chiff = this.h.filt("bandpass", Math.min(3500, f * 3), 4.5, panOut);
      const cg = this.h.gain(0.0001, chiff);
      cg.gain.setValueAtTime(peak * 0.22, t);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
      this.h.noiseSrc(t, 0.05, cg, 1.0);

      for (const [mult, amp, wave] of stops) {
        if (f * mult > 8500 || f * mult < 24) continue;
        const sg = this.h.gain(amp, envG);
        const o = this.ac.createOscillator();
        o.type = wave;
        o.frequency.setValueAtTime(f * mult, t);
        o.connect(sg);
        o.start(t);
        o.stop(t + dur + 0.4);
        this.h.stats.voices++;
      }
    });
  }

  // 5. Noble French Horns & Low Brass Swells (Conical-bore dual bell formants + warm nonlinear brass bloom)
  frenchHorns(midiList, dur, vel = 0.18) {
    const tBase = this._t;
    midiList.forEach((midi, idx) => {
      const t = tBase + idx * 0.012;
      const f = ii(midi);
      const panOut = this._pan(-0.28 + idx * 0.14, this.dryBus, 0.76);
      const bellChest = this.h.filt("peaking", 355, 1.3, panOut);
      bellChest.gain.value = 3.2;
      const bellCore = this.h.filt("peaking", 760, 1.5, bellChest);
      bellCore.gain.value = 2.6;
      const shaper = this.ac.createWaveShaper();
      shaper.curve = this.brassCurve;
      shaper.connect(bellCore);
      const lpf = this.h.filt("lowpass", 280, 1.05, shaper);
      const swellPeakT = t + Math.min(0.68, dur * 0.38);
      lpf.frequency.setValueAtTime(Math.max(190, f * 1.35), t);
      lpf.frequency.exponentialRampToValueAtTime(
        Math.min(2100, f * (4.0 + vel * 5.8)),
        swellPeakT,
      );
      lpf.frequency.exponentialRampToValueAtTime(Math.max(230, f * 1.75), t + dur + 0.28);

      const envG = this.h.gain(0.0001, lpf);
      const peak = (vel * 0.145) / Math.sqrt(Math.max(1, midiList.length * 0.65));
      envG.gain.setValueAtTime(0.0001, t);
      envG.gain.linearRampToValueAtTime(peak, swellPeakT);
      envG.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.36);

      for (const [det, wave] of [
        [-3.8, "sawtooth"],
        [3.8, "sawtooth"],
        [0, "triangle"],
      ]) {
        const o = this.ac.createOscillator();
        o.type = wave;
        o.frequency.setValueAtTime(f * 0.996, t);
        o.frequency.exponentialRampToValueAtTime(f, t + 0.045); // subtle horn lip attack
        o.detune.value = det;
        o.connect(envG);
        o.start(t);
        o.stop(t + dur + 0.42);
        this.h.stats.voices++;
      }
    });
  }

  lowBrassSwell(midi, dur, vel = 0.22) {
    this.frenchHorns([midi, midi + 12], dur, vel * 0.95);
  }

  // 5b. Expressive Singing Solo Cello (lyrical voice: 215 Hz chest + 690 Hz A-string bridge + vibrato)
  soloCello(midi, dur, vel = 0.2) {
    const t = this._t + 0.01;
    const f = ii(midi);
    const panOut = this._pan(-0.18, this.dryBus, 0.76);
    panOut.connect(this.ensIn);

    const chest = this.h.filt("peaking", 215, 1.4, panOut);
    chest.gain.value = 4.5;
    const nasal = this.h.filt("peaking", 690, 1.8, chest);
    nasal.gain.value = 3.2;
    const lpf = this.h.filt("lowpass", Math.min(2800, f * 5.8), 0.75, nasal);
    const envG = this.h.gain(0.0001, lpf);

    const atk = Math.min(0.42, dur * 0.25);
    const peak = vel * 0.145;
    envG.gain.setValueAtTime(0.0001, t);
    envG.gain.linearRampToValueAtTime(peak, t + atk);
    envG.gain.setValueAtTime(peak * 0.88, t + Math.max(atk + 0.04, dur * 0.76));
    envG.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.45);

    const vib = this.ac.createOscillator();
    const vibG = this.h.gain(0);
    vib.frequency.value = 5.45;
    vibG.gain.setValueAtTime(0, t);
    vibG.gain.linearRampToValueAtTime(f * 0.0056, t + Math.min(0.55, dur * 0.4));
    vib.connect(vibG);
    vib.start(t);
    vib.stop(t + dur + 0.5);

    for (const [det, wave] of [
      [-2.5, "sawtooth"],
      [2.5, "triangle"],
    ]) {
      const o = this.ac.createOscillator();
      o.type = wave;
      o.frequency.setValueAtTime(f * 0.994, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.09); // expressive finger slide
      o.detune.value = det;
      vibG.connect(o.frequency);
      o.connect(envG);
      o.start(t);
      o.stop(t + dur + 0.5);
      this.h.stats.voices++;
    }
  }

  // 5c. Noble Elegiac Solo Trumpet (warm brass lead)
  soloTrumpet(midi, dur, vel = 0.18) {
    const t = this._t + 0.008;
    const f = ii(midi);
    const panOut = this._pan(-0.08, this.dryBus, 0.84);
    const f1 = this.h.filt("peaking", 920, 1.6, panOut);
    f1.gain.value = 3.4;
    const f2 = this.h.filt("peaking", 1820, 1.8, f1);
    f2.gain.value = 2.0;
    const shaper = this.ac.createWaveShaper();
    shaper.curve = this.brassCurve;
    shaper.connect(f2);
    const lpf = this.h.filt("lowpass", Math.min(2900, f * 4.8), 0.9, shaper);
    lpf.frequency.setValueAtTime(f * 1.6, t);
    lpf.frequency.exponentialRampToValueAtTime(
      Math.min(3100, f * 5.2),
      t + Math.min(0.28, dur * 0.35),
    );
    lpf.frequency.exponentialRampToValueAtTime(f * 2.1, t + dur + 0.25);

    const envG = this.h.gain(0.0001, lpf);
    const peak = vel * 0.13;
    envG.gain.setValueAtTime(0.0001, t);
    envG.gain.linearRampToValueAtTime(peak, t + 0.085);
    envG.gain.setValueAtTime(peak * 0.86, t + Math.max(0.12, dur * 0.72));
    envG.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);

    const vib = this.ac.createOscillator();
    const vibG = this.h.gain(0);
    vib.frequency.value = 5.3;
    vibG.gain.setValueAtTime(0, t);
    vibG.gain.linearRampToValueAtTime(f * 0.0038, t + Math.min(0.45, dur * 0.45));
    vib.connect(vibG);
    vib.start(t);
    vib.stop(t + dur + 0.4);

    for (const [det, wave] of [
      [-2.2, "sawtooth"],
      [2.2, "triangle"],
    ]) {
      const o = this.ac.createOscillator();
      o.type = wave;
      o.frequency.setValueAtTime(f * 0.995, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      o.detune.value = det;
      vibG.connect(o.frequency);
      o.connect(envG);
      o.start(t);
      o.stop(t + dur + 0.4);
      this.h.stats.voices++;
    }
  }

  // 5d. Soft Distant Concert Snare Roll (ceremonial pulse)
  concertSnareRoll(dur, vel = 0.08) {
    const t = this._t;
    const panOut = this._pan(0.22, this.dryBus, 0.68);
    const bp = this.h.filt("bandpass", 1450, 1.3, panOut);
    const hp = this.h.filt("highpass", 420, 0.7, bp);
    const envG = this.h.gain(0.0001, hp);
    envG.gain.setValueAtTime(0.0001, t);
    envG.gain.linearRampToValueAtTime(vel * 0.14, t + dur * 0.55);
    envG.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.18);
    this.h.noiseSrc(t, dur + 0.2, envG, 0.92);
  }

  // 6. Luminous Wordless Choir (3-Formant Vowel Filter Bank: "Ahh -> Ohh")
  luminousChoir(midiList, dur, vel = 0.15) {
    const t = this._t;
    // Soprano/Alto vowel formants (Hz, Q, gain)
    const formants = [
      [680, 4.5, 1.0],
      [1150, 5.5, 0.62],
      [2520, 6.5, 0.26],
    ];
    const sum = this.ac.createGain();
    const panOut = this._pan(0.05, this.dryBus, 0.82);
    sum.connect(panOut);
    sum.connect(this.ensIn);

    const formantBus = this.ac.createGain();
    for (const [fc, qVal, fg] of formants) {
      const bp = this.h.filt("bandpass", fc, qVal);
      bp.frequency.setValueAtTime(fc, t);
      bp.frequency.linearRampToValueAtTime(fc * 0.82, t + dur * 0.8); // gentle morph Ahh -> Ohh
      const g = this.h.gain(fg, sum);
      formantBus.connect(bp);
      bp.connect(g);
    }

    const envG = this.h.gain(0.0001, formantBus);
    const peak = (vel * 0.24) / Math.sqrt(Math.max(1, midiList.length * 0.7));
    envG.gain.setValueAtTime(0.0001, t);
    envG.gain.linearRampToValueAtTime(peak, t + Math.min(0.75, dur * 0.35));
    envG.gain.setValueAtTime(peak * 0.88, t + dur * 0.75);
    envG.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);

    midiList.forEach((midi, idx) => {
      const f = ii(midi);
      const vib = this.ac.createOscillator();
      const vibG = this.h.gain(f * 0.0045);
      vib.frequency.value = 5.4 + idx * 0.2;
      vib.connect(vibG);
      vib.start(t);
      vib.stop(t + dur + 0.55);

      for (const det of [-6, 6]) {
        const o = this.ac.createOscillator();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(f, t);
        o.detune.value = det;
        vibG.connect(o.frequency);
        o.connect(envG);
        o.start(t);
        o.stop(t + dur + 0.55);
        this.h.stats.voices++;
      }
    });
  }

  // 7. CS-80-style Expressive Analog Ribbon Lead
  cs80Ribbon(midi, dur, vel = 0.2) {
    const t = this._t;
    const f = ii(midi);
    const panOut = this._pan(0.12, this.dryBus, 0.78);
    const lpf = this.h.filt("lowpass", f * 1.5, 2.2, panOut);
    lpf.frequency.setValueAtTime(f * 1.4, t);
    lpf.frequency.exponentialRampToValueAtTime(Math.min(4800, f * 7.5), t + dur * 0.36);
    lpf.frequency.exponentialRampToValueAtTime(f * 1.8, t + dur + 0.3);

    const envG = this.h.gain(0.0001, lpf);
    envG.gain.setValueAtTime(0.0001, t);
    envG.gain.linearRampToValueAtTime(vel * 0.16, t + 0.18);
    envG.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);

    for (const det of [-7, 7]) {
      const o = this.ac.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f * 0.992, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.12); // subtle ribbon glide!
      o.detune.value = det;
      o.connect(envG);
      o.start(t);
      o.stop(t + dur + 0.4);
      this.h.stats.voices++;
    }
  }

  // 8. Analog Precision Arpeggiator & Celesta Harmonic Bell
  analogArp(midi, dur, vel = 0.15) {
    const t = this._t;
    const f = ii(midi);
    const panOut = this._pan(((midi % 7) - 3) * 0.09, this.dryBus, 0.48);
    const lpf = this.h.filt("lowpass", Math.min(4400, f * 5.5), 1.8, panOut);
    lpf.frequency.setValueAtTime(Math.min(5200, f * 6.5), t);
    lpf.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.4), t + dur);

    const envG = this.h.gain(0.0001, lpf);
    envG.gain.setValueAtTime(0.0001, t);
    envG.gain.linearRampToValueAtTime(vel * 0.16, t + 0.008);
    envG.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);

    const o1 = this.ac.createOscillator();
    const o2 = this.ac.createOscillator();
    o1.type = "sawtooth";
    o2.type = "square";
    o1.frequency.setValueAtTime(f, t);
    o2.frequency.setValueAtTime(f, t);
    o2.detune.value = 5;
    const g2 = this.h.gain(0.35, envG);
    o1.connect(envG);
    o2.connect(g2);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.1);
    o2.stop(t + dur + 0.1);
    this.h.stats.voices += 2;
  }

  celestaBell(midi, dur, vel = 0.1) {
    const t = this._t;
    const f = ii(midi);
    const panOut = this._pan(0.24, this.dryBus, 0.72);
    const envG = this.h.gain(0.0001, panOut);
    envG.gain.setValueAtTime(0.0001, t);
    envG.gain.linearRampToValueAtTime(vel * 0.14, t + 0.004);
    envG.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.5, dur));

    for (const [ratio, amp] of [
      [1, 1],
      [2, 0.25],
      [4.01, 0.09],
    ]) {
      if (f * ratio > 9500) continue;
      const g = this.h.gain(amp, envG);
      const o = this.ac.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f * ratio, t);
      o.connect(g);
      o.start(t);
      o.stop(t + Math.max(0.55, dur + 0.05));
      this.h.stats.voices++;
    }
  }

  // 9. Pocket-Watch Escapement & Bessel-Mode Concert Timpani
  pocketWatchTick(isDownbeat, vel = 0.1) {
    const t = this._t;
    const panOut = this._pan(isDownbeat ? -0.18 : 0.18, this.dryBus, 0.22);
    const bp = this.h.filt("bandpass", isDownbeat ? 3400 : 4300, 5.5, panOut);
    const g = this.h.gain(0.0001, bp);
    g.gain.setValueAtTime(vel * 0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.016);
    this.h.noiseSrc(t, 0.02, g, 1.3);
  }

  concertTimpani(midi, vel = 0.25) {
    const t = this._t;
    const f = ii(midi < 42 ? midi + 12 : midi);
    const panOut = this._pan(-0.15, this.dryBus, 0.65);
    // Circular membrane Bessel modes (1.00, 1.504, 1.742)
    for (const [mode, amp, dec] of [
      [1.0, 1.0, 1.35],
      [1.504, 0.36, 0.85],
      [1.742, 0.18, 0.55],
    ]) {
      const g = this.h.gain(0.0001, panOut);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vel * 0.22 * amp, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      const o = this.ac.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f * mode * 1.09, t);
      o.frequency.exponentialRampToValueAtTime(f * mode, t + 0.055);
      o.connect(g);
      o.start(t);
      o.stop(t + dec + 0.05);
      this.h.stats.voices++;
    }
  }
};

var Ky = "cel-audio-v2";

var Nm = class LabAudioController {
  constructor() {
    this.ok = false;
    this.ac = null;
    this.machine = "hub";
    this.scoreOverride = "auto";
    this.act = 0;
    this.evRate = 0;
    this.vol = { master: 0.85, music: 0.58, sfx: 0.85 };
    this.muted = false;
    this.boost = true;
    this.stats = {
      events: 0,
      voices: 0,
      notes: 0,
      samples: 0,
      blocked: "",
      by: {},
    };
    this.last = {};
    this.buf = {};
    this.amb = null;
    this.listeners = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(Ky) || "{}");
      if (saved.vol) Object.assign(this.vol, saved.vol);
      if (typeof saved.muted === "boolean") this.muted = saved.muted;
      if (typeof saved.boost === "boolean") this.boost = saved.boost;
      if (saved.scoreOverride) {
        this.scoreOverride =
          SCORE_THEME_MIGRATION[saved.scoreOverride] || saved.scoreOverride;
      }
    } catch {}
  }

  save() {
    try {
      localStorage.setItem(
        Ky,
        JSON.stringify({
          vol: this.vol,
          muted: this.muted,
          boost: this.boost,
          scoreOverride: this.scoreOverride,
        }),
      );
    } catch {}
  }

  onChange(fn) {
    this.listeners.add(fn);
  }

  emit() {
    for (const fn of this.listeners) {
      try {
        fn(this);
      } catch {}
    }
  }

  get state() {
    return this.ac ? this.ac.state : this.stats.blocked ? "unavailable" : "not started";
  }

  get track() {
    return us[this.machine] || us.hub;
  }

  get scoreMode() {
    return this.music && this.music.mode ? this.music.mode : "procedural";
  }

  get nowPlaying() {
    if (!this.music) return null;
    return {
      style: this.music.cueKey,
      chord: this.music.currentChordName,
      bpm: this.music.currentBpm,
    };
  }

  start() {
    if (this.ac) {
      if (this.ac.state === "suspended") this.ac.resume().catch(() => {});
      return this.ok;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        this.stats.blocked = "WebAudio not available";
        this.emit();
        return false;
      }
      const ac = (this.ac = new AC({ latencyHint: "interactive" }));
      this.out = ac.createGain();
      this.pre = ac.createGain();
      this.lim = ac.createDynamicsCompressor();
      Object.entries({
        threshold: -9,
        knee: 6,
        ratio: 14,
        attack: 0.004,
        release: 0.22,
      }).forEach(([k, v]) => {
        this.lim[k].value = v;
      });
      this.clip = ac.createWaveShaper();
      const curve = new Float32Array(2048);
      for (let i = 0; i < 2048; i++) {
        const x = i / 1023.5 - 1;
        curve[i] = Math.tanh(1.12 * x) / Math.tanh(1.12);
      }
      this.clip.curve = curve;

      this.pre.connect(this.lim);
      this.lim.connect(this.clip);
      this.clip.connect(this.out);
      this.out.connect(ac.destination);

      this.sfxBus = ac.createGain();
      this.musicBus = ac.createGain();
      this.ambBus = ac.createGain();
      this.sfxBus.connect(this.pre);
      this.musicBus.connect(this.pre);
      this.ambBus.connect(this.sfxBus);

      this.noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      {
        const ch = this.noise.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      }

      // True warm scoring-stage concert hall impulse (early wooden reflections + HF-damped diffuse tail!)
      this.verb = ac.createConvolver();
      this.verb.buffer = this.hallImpulse(3.4, 2.6, true);
      this.verbIn = ac.createGain();
      this.verbIn.gain.value = 0.9;
      this.verbIn.connect(this.verb);
      this.verb.connect(this.musicBus);

      // Tight studio room IR for mechanical hardware SFX
      this.room = ac.createConvolver();
      this.room.buffer = this.hallImpulse(0.42, 4.2, false);
      this.roomIn = ac.createGain();
      this.roomIn.connect(this.room);
      this.room.connect(this.sfxBus);

      this.procMusic = new OrchestralScoreEngine(this);
      this.music =
        typeof StemScoreEngine === "function"
          ? new StemScoreEngine(this, this.procMusic)
          : this.procMusic;
      this.applyVol();
      this.ok = true;

      for (const [name, b64] of Object.entries(Xy)) {
        if (!b64 || b64.startsWith("__SFX")) continue;
        try {
          const bin = atob(b64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          ac.decodeAudioData(bytes.buffer)
            .then((audioBuf) => {
              this.buf[name] = audioBuf;
              if (name === "keys") this.keyGrains = this.grains(audioBuf, 0.2);
            })
            .catch(() => {});
        } catch {}
      }

      // CC0 recorded SFX (assets/audio/*.mp3, credited in SOUNDS.md). http(s) only; from file://
      // the synthesized versions are used.
      if (typeof CelAssets !== "undefined" && CelAssets.canLoad()) {
        for (const name of [
          "relay",
          "toggle",
          "ttyhit",
          "seek",
          "bell",
          "floppy",
          "keys",
          "modem",
        ]) {
          fetch(CelAssets.sfx(name))
            .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
            .then((ab) => ac.decodeAudioData(ab))
            .then((audioBuf) => {
              this.buf[name] = audioBuf;
              if (name === "keys") this.keyGrains = this.grains(audioBuf, 0.2);
            })
            .catch(() => {});
        }
      }

      this.setMachine(this.machine, true);
      this.emit();
      return true;
    } catch (err) {
      this.stats.blocked = String((err && err.message) || err);
      this.ac = null;
      this.ok = false;
      this.emit();
      return false;
    }
  }

  // Synthesize a warm, natural wooden concert-hall IR with early reflections and air-damped highs (zero white-noise hiss!)
  hallImpulse(seconds, decayPower, withEarly) {
    const sr = this.ac.sampleRate;
    const len = Math.floor(sr * seconds);
    const buf = this.ac.createBuffer(2, len, sr);
    const earlyMs = [14, 21, 29, 38, 49, 63, 77];

    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      let lp1 = 0;
      let lp2 = 0;
      let hp = 0;
      let s = (ch + 1) * 987654321;
      const rng = () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return (s / 4294967296) * 2 - 1;
      };

      if (withEarly) {
        earlyMs.forEach((ms, idx) => {
          const idxSamp = Math.floor(((ms + ch * 3.2) / 1000) * sr);
          if (idxSamp < len) {
            data[idxSamp] += (idx % 2 === 0 ? 1 : -1) * (0.28 * Math.pow(0.84, idx));
          }
        });
      }

      for (let i = 0; i < len; i++) {
        const u = i / len;
        const env = Math.pow(1 - u, decayPower) * Math.min(1, i / (sr * 0.012));
        // Progressive air absorption: cutoff drops smoothly from ~4.5 kHz down to ~600 Hz
        const fc = 600 + 3900 * Math.pow(1 - u, 1.6);
        const alpha = Math.min(0.75, (2 * Math.PI * fc) / sr);
        const raw = rng() * env;
        lp1 += alpha * (raw - lp1);
        lp2 += alpha * (lp1 - lp2);
        // Remove sub-35Hz DC rumble
        hp += 0.004 * (lp2 - hp);
        data[i] += (lp2 - hp) * 0.85;
      }
    }
    return buf;
  }

  grains(audioBuf, stepSec) {
    const ch = audioBuf.getChannelData(0);
    const sr = audioBuf.sampleRate;
    const nSlices = Math.floor(audioBuf.duration / stepSec);
    const out = [];
    for (let i = 0; i < nSlices; i++) {
      const i0 = Math.floor(i * stepSec * sr);
      let k = i0;
      while (k < i0 + stepSec * sr && Math.abs(ch[k]) < 0.06) k++;
      if (k < i0 + stepSec * sr) out.push(Math.max(0, k / sr - 0.003));
    }
    return out;
  }

  applyVol() {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    const master = this.muted ? 0 : this.vol.master;
    this.out.gain.setTargetAtTime(master * (this.boost ? 1 : 0.65), t, 0.03);
    this.pre.gain.setTargetAtTime(this.boost ? 2.4 : 1.0, t, 0.03);
    this.musicBus.gain.setTargetAtTime(this.vol.music, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.vol.sfx, t, 0.05);
  }

  set(key, val) {
    if (key in this.vol) {
      this.vol[key] = Fm(+val, 0, 1);
    } else if (key === "muted" || key === "boost") {
      this[key] = !!val;
    } else if (key === "scoreOverride") {
      this.scoreOverride = String(val);
      if (this.music) this.music.play(this.machine);
    }
    this.applyVol();
    this.save();
    this.emit();
  }

  toggleMute() {
    this.set("muted", !this.muted);
    return this.muted;
  }

  setMachine(id, force) {
    if (id === this.machine && !force) return;
    this.machine = id;
    this.act = 0;
    this.evRate = 0;
    if (!this.ac) {
      this.emit();
      return;
    }
    const t = this.ac.currentTime;
    if (this.amb) {
      const prev = this.amb;
      prev.g.gain.cancelScheduledValues(t);
      prev.g.gain.setTargetAtTime(0, t, 0.35);
      setTimeout(() => {
        try {
          prev.stop();
        } catch {}
      }, 2400);
    }
    this.amb = this.makeAmbience(id);
    this.music.play(id);
    this.emit();
  }

  ev(name, opts = {}) {
    if (!this.ok || this.ac.state !== "running" || (opts.m && opts.m !== this.machine)) {
      return false;
    }
    const now = this.ac.currentTime;
    const minGap = opts.min ?? 0.03;
    if (this.last[name] !== undefined && now - this.last[name] < minGap) {
      return false;
    }
    this.last[name] = now;
    const fn = Vm[name];
    if (!fn) return false;
    this.stats.events++;
    this.stats.by[name] = (this.stats.by[name] || 0) + 1;
    this.evRate += 1;
    try {
      fn(this, now + 0.005, opts);
    } catch {}
    return true;
  }

  tick(dt, simAct) {
    if (!this.ok) return;
    this.evRate *= Math.exp(-dt * 1.5);
    const targetAct = Fm(Math.max(simAct || 0, Math.min(1, this.evRate / 25)), 0, 1);
    this.act += (targetAct - this.act) * Math.min(1, dt * 1.2);
    if (this.amb && this.amb.update) {
      try {
        this.amb.update(this.act, dt);
      } catch {}
    }
    this.music.tick(this.act);
  }

  env(param, t, atk, dec, peak, end = 0) {
    param.cancelScheduledValues(t);
    param.setValueAtTime(1e-4, t);
    param.linearRampToValueAtTime(peak, t + atk);
    param.setTargetAtTime(end, t + atk, dec / 4);
  }

  gain(val = 1, dest) {
    const g = this.ac.createGain();
    g.gain.value = val;
    if (dest) g.connect(dest);
    return g;
  }

  filt(type, freq, qVal = 1, dest) {
    const f = this.ac.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = qVal;
    if (dest) f.connect(dest);
    return f;
  }

  noiseSrc(t, dur, dest, rate = 1) {
    const src = this.ac.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = rate;
    src.connect(dest);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
    this.stats.voices++;
    return src;
  }

  osc(type, freq, t, dur, dest) {
    const o = this.ac.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
    this.stats.voices++;
    return o;
  }

  burst(
    t,
    {
      f = 2000,
      q: qVal = 1,
      type = "bandpass",
      dur = 0.02,
      peak = 0.5,
      a = 0.0008,
      dest = this.sfxBus,
      room = 0.22,
    } = {},
  ) {
    const g = this.gain(0, dest);
    const flt = this.filt(type, f, qVal, g);
    if (room) {
      const rg = this.gain(room, this.roomIn);
      g.connect(rg);
    }
    this.env(g.gain, t, a, dur, peak);
    this.noiseSrc(t, dur * 2.5, flt);
    return g;
  }

  thump(
    t,
    { f0 = 160, f1 = 60, dur = 0.06, peak = 0.6, type = "sine", dest = this.sfxBus } = {},
  ) {
    const g = this.gain(0, dest);
    this.osc(type, f0, t, dur * 3, g).frequency.exponentialRampToValueAtTime(
      Math.max(20, f1),
      t + dur,
    );
    this.env(g.gain, t, 0.002, dur, peak);
    return g;
  }

  ring(t, { f = 1200, dur = 0.2, peak = 0.2, type = "sine", dest = this.sfxBus } = {}) {
    const g = this.gain(0, dest);
    const o = this.osc(type, f, t, dur * 3, g);
    this.env(g.gain, t, 0.001, dur, peak);
    return o;
  }

  // Play a short random grain of a recorded clip; returns false if the clip isn't loaded
  sampleGrain(name, t, dur, peak, randomOffset = true) {
    const b = this.buf[name];
    if (!b) return false;
    const off = randomOffset ? Math.random() * Math.max(0, b.duration - dur - 0.02) : 0;
    return !!this.play(name, t, { off, dur, peak, rate: 0.94 + Math.random() * 0.12 });
  }

  play(clipName, t, { off = 0, dur, rate = 1, peak = 1, dest = this.sfxBus } = {}) {
    const buf = this.buf[clipName];
    if (!buf) return false;
    const src = this.ac.createBufferSource();
    const g = this.gain(peak, dest);
    src.buffer = buf;
    src.playbackRate.value = rate;
    src.connect(g);
    if (dur) {
      // short fade-out so cut grains don't click
      const fade = Math.min(0.012, dur * 0.25);
      g.gain.setValueAtTime(peak, t + dur - fade);
      g.gain.linearRampToValueAtTime(0, t + dur);
    }
    src.start(t, off, dur);
    this.stats.samples++;
    this.stats.voices++;
    return true;
  }

  makeAmbience(id) {
    const ac = this.ac;
    const out = this.gain(0, this.ambBus);
    const nodes = [];
    const now = ac.currentTime;
    out.gain.setTargetAtTime(0.65, now, 0.6); // calibrated subtle hardware room tone

    const track = (n) => (nodes.push(n), n);
    const hum = (f0, amp, harms = [1, 0.45, 0.25]) => {
      const g = this.gain(amp, out);
      harms.forEach((h, idx) => {
        const o = track(ac.createOscillator());
        o.frequency.value = f0 * (idx + 1);
        const hg = this.gain(h, g);
        o.connect(hg);
        o.start();
      });
      return g;
    };
    const fan = (amp, blades = 7) => {
      const src = track(ac.createBufferSource());
      src.buffer = this.noise;
      src.loop = true;
      const bp = this.filt("bandpass", 360, 0.7);
      const lp = this.filt("lowpass", 1400, 0.5);
      const fg = this.gain(amp * 0.75, out);
      src.connect(bp);
      bp.connect(lp);
      lp.connect(fg);
      src.start();
      const tone = track(ac.createOscillator());
      tone.frequency.value = 95;
      const tg = this.gain(amp * 0.14, out);
      tone.connect(tg);
      tone.start();
      return {
        set: (rpm) => {
          const t = ac.currentTime;
          bp.frequency.setTargetAtTime(140 + rpm * 0.22, t, 0.4);
          lp.frequency.setTargetAtTime(520 + rpm * 0.75, t, 0.4);
          tone.frequency.setTargetAtTime((rpm / 60) * blades, t, 0.4);
          fg.gain.setTargetAtTime(amp * 0.65 * (0.25 + rpm / 3200), t, 0.4);
          tg.gain.setTargetAtTime(amp * 0.08 * (0.2 + rpm / 3200), t, 0.4);
        },
      };
    };
    const whine = (f0, amp) => {
      const o = track(ac.createOscillator());
      o.frequency.value = f0;
      const g = this.gain(0, out);
      o.connect(g);
      o.start();
      return {
        set: (k) => {
          g.gain.setTargetAtTime(amp * 0.65 * k, ac.currentTime, 0.12);
          o.frequency.setTargetAtTime(f0 * (0.92 + 0.2 * k), ac.currentTime, 0.2);
        },
      };
    };
    const flow = (amp, fc = 650) => {
      const src = track(ac.createBufferSource());
      src.buffer = this.noise;
      src.loop = true;
      src.playbackRate.value = 0.5;
      const bp = this.filt("bandpass", fc, 1.5);
      const g = this.gain(amp * 0.75, out);
      src.connect(bp);
      bp.connect(g);
      src.start();
      const lfo = track(ac.createOscillator());
      lfo.frequency.value = 0.65;
      const lg = this.gain(fc * 0.35);
      lfo.connect(lg);
      lg.connect(bp.frequency);
      lfo.start();
      return g;
    };

    let updater = null;
    switch (id) {
      case "z1": {
        const g = hum(50, 0, [1, 0.5, 0.3]);
        updater = (k) => g.gain.setTargetAtTime(0.035 * k, ac.currentTime, 0.3);
        break;
      }
      case "analog": {
        hum(60, 0.02);
        const w = whine(420, 0.015);
        updater = (k) => w.set(k);
        break;
      }
      case "tube": {
        hum(50, 0.032, [1, 0.6, 0.3]);
        fan(0.06, 4).set(850);
        break;
      }
      case "pdp8": {
        hum(60, 0.018);
        fan(0.09, 5).set(1500);
        break;
      }
      case "altair": {
        hum(60, 0.015);
        fan(0.08, 5).set(1400);
        break;
      }
      case "home80": {
        hum(50, 0.01);
        break;
      }
      case "pc90": {
        fan(0.09, 7).set(1700);
        const h = hum(90, 0.018, [1, 0.35, 0.15]);
        updater = (k) => h.gain.setTargetAtTime(0.015 + 0.008 * k, ac.currentTime, 0.3);
        break;
      }
      case "pc00":
      case "pc10": {
        const f = fan(0.1, 7);
        updater = (k) => f.set(850 + 1400 * k);
        break;
      }
      case "pc20": {
        const f = fan(0.11, 9);
        updater = (k) => f.set(650 + 2100 * k);
        break;
      }
      case "aibox": {
        const h = hum(48, 0.024, [1, 0.45, 0.25]);
        const fl = flow(0.04, 620);
        const fn = fan(0.1, 7);
        updater = (k) => {
          fn.set(950 + 1600 * k);
          fl.gain.setTargetAtTime(0.025 + 0.035 * k, ac.currentTime, 0.4);
          h.gain.setTargetAtTime(0.02 + 0.015 * k, ac.currentTime, 0.4);
        };
        break;
      }
      case "quantum":
        hum(50, 0.01);
        fan(0.045, 7).set(1100);
        break;
      case "bci":
        fan(0.04, 5).set(950);
        break;
      case "photonic":
        fan(0.04, 7).set(850);
        break;
      case "alife":
        fan(0.03, 5).set(680);
        break;
      case "agc66":
        hum(400, 0.008, [1, 0.35]); // 400 Hz Apollo spacecraft inverter hum!
        break;
      case "alto73":
        hum(60, 0.012);
        fan(0.075, 5).set(1500); // Diablo Model 31 1500 RPM spindle + blower
        break;
      case "arm07":
        break; // True silent fanless 4-watt mobile slab!
      case "s360":
      case "unix70":
      case "vax78":
      case "sun90":
        hum(60, 0.018);
        fan(0.085, 6).set(1550);
        break;
      case "cloud10":
      case "zmain20": {
        const fn = fan(0.095, 7);
        updater = (k) => fn.set(1100 + 1300 * k);
        break;
      }
      case "cdc6600":
      case "cray1":
        hum(60, 0.024, [1, 0.5, 0.2]); // Freon-12 compressor + 400 Hz motor-generator
        flow(0.032, 520);
        break;
      case "cm2":
      case "ascired97":
      case "bgene":
        fan(0.09, 7).set(1650);
        break;
      case "exascale":
      case "gb200":
        flow(0.045, 580);
        fan(0.085, 9).set(1450);
        break;
      case "qtransmon":
      case "qanneal": {
        // Authentic ~1.4 Hz Pulse-Tube Dilution Cryocooler helium valve breath!
        const ptSrc = track(ac.createBufferSource());
        ptSrc.buffer = this.noise;
        ptSrc.loop = true;
        const ptBp = this.filt("bandpass", 440, 2.2);
        const ptG = this.gain(0.012, out);
        ptSrc.connect(ptBp);
        ptBp.connect(ptG);
        ptSrc.start();
        const ptLfo = track(ac.createOscillator());
        ptLfo.frequency.value = 1.4;
        const ptDepth = this.gain(0.011);
        ptLfo.connect(ptDepth);
        ptDepth.connect(ptG.gain);
        ptLfo.start();
        break;
      }
      case "qion":
      case "qatom":
      case "qphotonic":
      case "qtopo":
      case "qomega":
        hum(60, 0.008);
        fan(0.032, 7).set(780);
        break;
      default:
        break;
    }

    return {
      g: out,
      stop: () => {
        nodes.forEach((n) => {
          try {
            n.stop();
          } catch {}
        });
        out.disconnect();
      },
      update: (act, dt) => updater && updater(act, dt),
    };
  }
};

var Vm = {
  relays(a, t, o) {
    const n = o.n ?? 8;
    for (let i = 0; i < n; i++) {
      Vm.relay(a, t + i * 0.0035 + Math.random() * 0.012, {
        v: 0.35 + Math.random() * 0.3,
      });
    }
  },
  relay(a, t, o) {
    const v = o.v ?? 0.5;
    if (a.sampleGrain("relay", t, 0.12, v * 1.3)) return;
    a.burst(t, { f: 3800, q: 1.2, dur: 0.006, peak: v });
    a.burst(t + 0.0025, { f: 2400, q: 3, dur: 0.004, peak: v * 0.4 });
    a.thump(t, { f0: 420, f1: 180, dur: 0.012, peak: v * 0.35 });
  },
  plate(a, t, o) {
    const v = o.v ?? 0.5;
    a.burst(t, { f: 900, q: 0.8, dur: 0.035, peak: v * 0.35, a: 0.01 });
    a.burst(t + 0.03, { f: 3200, q: 2, dur: 0.005, peak: v * 0.6 });
    a.thump(t + 0.03, { f0: 260, f1: 110, dur: 0.02, peak: v * 0.3 });
  },
  tick(a, t, o) {
    a.ring(t, { f: o.f ?? 1800, dur: 0.012, peak: o.v ?? 0.16, type: "triangle" });
  },
  merc(a, t) {
    a.ring(t, { f: 4200 + Math.random() * 400, dur: 0.006, peak: 0.07 });
  },
  clack(a, t) {
    a.burst(t, { f: 1500, q: 1, dur: 0.01, peak: 0.65 });
    a.thump(t, { f0: 300, f1: 90, dur: 0.03, peak: 0.55 });
    a.burst(t + 0.045, { f: 2600, q: 2, dur: 0.006, peak: 0.35 });
  },
  toggle(a, t) {
    if (a.sampleGrain("toggle", t, 0.25, 0.8, false)) return;
    a.burst(t, { f: 4200, q: 2, dur: 0.005, peak: 0.55 });
    a.ring(t, { f: 2900, dur: 0.05, peak: 0.045 });
    a.thump(t, { f0: 500, f1: 200, dur: 0.012, peak: 0.28 });
  },
  switch(a, t) {
    Vm.toggle(a, t);
  },
  tty(a, t, o) {
    if (!o.nl && a.sampleGrain("ttyhit", t, 0.1, 0.8)) return;
    a.thump(t, { f0: 210, f1: 120, dur: 0.03, peak: 0.5, type: "triangle" });
    a.burst(t, { f: 1300, q: 1.5, dur: 0.018, peak: 0.55 });
    a.burst(t + 0.02, { f: 600, q: 2, dur: 0.02, peak: 0.28 });
    if (o.nl) {
      a.burst(t + 0.05, { f: 400, q: 0.7, dur: 0.12, peak: 0.22, a: 0.03 });
    }
  },
  bell(a, t) {
    a.play("bell", t, { peak: 0.6 }) || a.ring(t, { f: 2200, dur: 0.6, peak: 0.2 });
  },
  key(a, t, o) {
    const gr = a.keyGrains;
    if (gr && gr.length) {
      const mid = (gr.length / 2) | 0;
      const pool = o.ibm === "M" ? gr.slice(mid) : gr.slice(0, mid);
      const off = pool[Math.floor(Math.random() * pool.length)];
      a.play("keys", t, {
        off,
        dur: 0.11,
        peak: 0.85,
        rate: 0.96 + Math.random() * 0.08,
      });
    } else {
      a.burst(t, { f: 3000, q: 1, dur: 0.008, peak: 0.45 });
      a.thump(t, { f0: 250, f1: 120, dur: 0.02, peak: 0.28 });
    }
  },
  floppy(a, t) {
    const b = a.buf.floppy;
    if (b) {
      const off = Math.random() * Math.max(0.1, b.duration - 0.6);
      a.play("floppy", t, { off, dur: 0.55, peak: 0.85 });
    } else {
      for (let i = 0; i < 8; i++) {
        a.burst(t + i * 0.006, { f: 900 + i * 40, q: 4, dur: 0.004, peak: 0.28 });
      }
    }
  },
  modem(a, t) {
    a.play("modem", t, { peak: 0.55 }) || a.ring(t, { f: 2100, dur: 1.5, peak: 0.1 });
  },
  post(a, t) {
    const g = a.gain(0, a.sfxBus);
    const o = a.osc("square", 988, t, 0.25, g);
    a.env(g.gain, t, 0.002, 0.8, 0.11, 0.11);
    g.gain.setValueAtTime(0.11, t + 0.18);
    g.gain.linearRampToValueAtTime(0, t + 0.2);
    return o;
  },
  seek(a, t, o) {
    const d = Fm(o.d ?? 0.5, 0, 1);
    if (a.sampleGrain("seek", t, 0.08, 0.45 + 0.35 * d)) return;
    a.thump(t, { f0: 180 + 120 * d, f1: 70, dur: 0.01 + 0.012 * d, peak: 0.5 });
    a.burst(t + 0.004, { f: 1800, q: 1.5, dur: 0.008, peak: 0.22 + 0.18 * d });
    if (o.w) a.burst(t + 0.02, { f: 5200, q: 2, dur: 0.01, peak: 0.1 });
  },
  spinup(a, t) {
    const g = a.gain(0, a.sfxBus);
    const o = a.osc("sawtooth", 8, t, 3.2, g);
    const fl = a.filt("lowpass", 600);
    o.disconnect();
    o.connect(fl);
    fl.connect(g);
    o.frequency.exponentialRampToValueAtTime(90, t + 2.8);
    a.env(g.gain, t, 0.5, 2.5, 0.07, 0);
  },
  coil(a, t, o) {
    a.ring(t, { f: 6800 + 4200 * (o.v ?? 0.5), dur: 0.025, peak: 0.014 });
  },
  gurgle(a, t) {
    for (let i = 0; i < 3; i++) {
      const g = a.gain(0, a.sfxBus);
      a.osc("sine", 300, t + i * 0.04, 0.08, g).frequency.exponentialRampToValueAtTime(
        700 + Math.random() * 300,
        t + i * 0.04 + 0.05,
      );
      a.env(g.gain, t + i * 0.04, 0.005, 0.05, 0.05);
    }
  },
  rf(a, t) {
    a.burst(t, { f: 6000, q: 0.7, dur: 0.004, peak: 0.3 });
    const g = a.gain(0, a.sfxBus);
    const o = a.osc("square", 1600, t, 0.06, g);
    const fl = a.filt("lowpass", 2500);
    o.disconnect();
    o.connect(fl);
    fl.connect(g);
    a.env(g.gain, t, 0.002, 0.03, 0.06);
  },
  fid(a, t, o) {
    const f = o.f ?? 520;
    const T2 = o.T2 ?? 0.6;
    const g = a.gain(0, a.sfxBus);
    a.osc("sine", f, t, T2 * 3, g);
    a.env(g.gain, t, 0.005, T2, 0.11);
    return a.osc("sine", f * 1.0109, t, T2 * 3, g);
  },
  stim(a, t) {
    a.burst(t, { f: 5000, q: 0.5, dur: 0.0015, peak: 0.4, room: 0 });
    a.burst(t + 0.0012, { f: 3500, q: 0.5, dur: 0.0015, peak: 0.26, room: 0 });
  },
  spike(a, t, o) {
    a.burst(t, {
      f: 1800 + 1500 * Math.random(),
      q: 2,
      dur: 0.0025,
      peak: o.v ?? 0.22,
      room: 0,
    });
  },
  heater(a, t) {
    a.burst(t, { f: 7000, q: 3, dur: 0.002, peak: 0.1, room: 0 });
  },
  photon(a, t, o) {
    a.ring(t, { f: (o.f ?? 1) * 2637, dur: 0.15, peak: 0.03 });
  },
  drip(a, t, o) {
    const g = a.gain(0, a.sfxBus);
    const f = o.f ?? 900 + Math.random() * 500;
    a.osc("sine", f * 0.6, t, 0.12, g).frequency.exponentialRampToValueAtTime(
      f * 1.6,
      t + 0.04,
    );
    a.env(g.gain, t, 0.002, 0.05, 0.2);
    const rg = a.gain(0.4, a.roomIn);
    g.connect(rg);
  },
  pump(a, t) {
    a.ring(t, { f: 640, dur: 0.01, peak: 0.035, type: "triangle" });
  },
  clock(a, t, o) {
    a.ring(t, {
      f: o.ph ? 2400 : 1600,
      dur: 0.008,
      peak: 0.1,
      type: "triangle",
    });
    if (o.w) a.burst(t + 0.002, { f: 5000, q: 2, dur: 0.004, peak: 0.1 });
  },
  tape(a, t, o) {
    a.burst(t, { f: 1100, q: 1.5, dur: 0.02, peak: 0.32, a: 0.004 });
    a.thump(t, { f0: 330, f1: 150, dur: 0.02, peak: 0.28 });
    if (o.w) {
      a.burst(t + 0.03, {
        f: 4500,
        q: 0.8,
        dur: 0.05,
        peak: 0.1,
        type: "highpass",
        a: 0.01,
      });
    }
  },
};

var yA = Object.keys(Vm),
  Ut = new Nm();
Ut.names = yA;

// Suspend the AudioContext while the tab is hidden (saves phone battery, REVIEW-v5 I12) and
// resume it on return if it was running before.
document.addEventListener("visibilitychange", () => {
  const ac = Ut.ac;
  if (!ac) return;
  if (document.hidden) {
    Ut._resumeOnShow = ac.state === "running";
    if (Ut._resumeOnShow) ac.suspend().catch(() => {});
  } else if (Ut._resumeOnShow) {
    Ut._resumeOnShow = false;
    ac.resume().catch(() => {});
  }
  Ut.emit();
});

var hi = (name, opts) => Ut.ev(name, opts);
var Oa = Math.random,
  bA = {
    turing: { "tape>head": ["tape", { min: 0.07 }] },
    z1: {
      "clk>exp": ["plate", { min: 0.05 }],
      "tape>dec": ["tape", { min: 0.12 }],
      "man>mem": ["plate", { v: 0.7, min: 0.08 }],
      "in>man": ["clack", {}],
    },
    tube: {
      "mem>ctl": () => ["tick", { f: 700 + Oa() * 1400, v: 0.12, min: 0.03 }],
      "acc>mem": ["merc", { min: 0.05 }],
    },
    pdp8: {
      "pc>mb": () => ["tick", { f: 500 + Oa() * 900, v: 0.05, min: 0.03 }],
      "ac>tty": ["tty", { min: 0.09 }],
      "panel>pc": ["clack", {}],
    },
    altair: {
      "cpu>bus": () => ["tick", { f: 400 + Oa() * 900, v: 0.05, min: 0.03 }],
      "panel>bus": ["toggle", { min: 0.05 }],
      "sio>term": ["tty", { min: 0.09 }],
    },
    home80: { "cia>cpu": ["key", { ibm: "F", min: 0.04 }] },
    pc90: {
      "kbd>cpu": ["key", { ibm: "M", min: 0.04 }],
      "ide>hdd": () => ["seek", { d: Oa(), min: 0.03 }],
    },
    pc00: { "fe>ex": ["coil", { v: 0.4, min: 0.12 }] },
    pc10: (a, b) => (a === "os" && b[0] === "c" ? ["coil", { v: 0.6, min: 0.12 }] : null),
    pc20: {
      "gpu>vram": ["coil", { v: 0.7, min: 0.14 }],
      "cpu>ddr": ["tick", { f: 1400, v: 0.06, min: 0.08 }],
      "cpu>nvme": () => ["seek", { d: 0.25, min: 0.1 }],
    },
    aibox: (a) =>
      a === "cpu"
        ? ["gurgle", { min: 1.4 }]
        : a[0] === "g"
          ? ["coil", { v: 0.8, min: 0.2 }]
          : null,
    quantum: {
      "dds>amp": ["rf", { min: 0.08 }],
      "coil>adc": () => ["fid", { f: 420 + Oa() * 240, T2: 0.5, min: 0.25 }],
    },
    bci: {
      "fb>sens": ["stim", { min: 0.03 }],
      "enc>sens": ["stim", { min: 0.03 }],
      "cul>mot": () => ["spike", { v: 0.15 + Oa() * 0.2, min: 0.015 }],
    },
    s360: {
      "ros>cpu": () => ["tick", { f: 520 + Oa() * 680, v: 0.05, min: 0.05 }],
      "chan>tape": ["tape", { min: 0.12 }],
      "chan>disk": () => ["seek", { d: 0.4 + Oa() * 0.5, min: 0.09 }],
      "chan>prn": ["clack", { min: 0.09 }],
    },
    unix70: {
      "uni>vt": ["tty", { min: 0.08 }],
      "uni>rp04": () => ["seek", { d: 0.35 + Oa() * 0.45, min: 0.09 }],
      "cpu>mmu": () => ["tick", { f: 650 + Oa() * 500, v: 0.04, min: 0.06 }],
    },
    sun90: {
      "c0>bus": () => ["tick", { f: 1100, v: 0.05, min: 0.08 }],
      "bus>raid": () => ["seek", { d: 0.3 + Oa() * 0.4, min: 0.08 }],
    },
    cloud10: {
      "lead>foll": () => ["tick", { f: 1500, v: 0.05, min: 0.09 }],
      "foll>nvme": ["coil", { v: 0.55, min: 0.14 }],
    },
    zmain20: {
      "pu>ai": ["coil", { v: 0.65, min: 0.14 }],
      "lpar>ficon": () => ["tick", { f: 1750, v: 0.05, min: 0.1 }],
    },
    cray1: {
      "fmul>fadd": ["coil", { v: 0.65, min: 0.12 }],
      "mem>v0": () => ["tick", { f: 1350, v: 0.05, min: 0.08 }],
    },
    cm2: {
      "pe>hyp": () => ["tick", { f: 920 + Oa() * 600, v: 0.05, min: 0.07 }],
    },
    bgene: {
      "soc>tree": ["coil", { v: 0.5, min: 0.14 }],
      "soc>torus": () => ["tick", { f: 1200, v: 0.04, min: 0.08 }],
    },
    exascale: {
      "cdu>gpu": ["gurgle", { min: 1.4 }],
      "nic>dfly": ["coil", { v: 0.72, min: 0.16 }],
    },
    gb200: {
      "nvl>spine": ["coil", { v: 0.82, min: 0.16 }],
      "top9>nvl": ["gurgle", { min: 1.6 }],
    },
    qtransmon: {
      "awg>att": ["rf", { min: 0.1 }],
      "syn>dec": () => ["photon", { f: 0.85 + Oa() * 0.3, min: 0.12 }],
    },
    qatom: {
      "aod>uhv": ["rf", { min: 0.1 }],
      "uhv>cmos": () => ["photon", { f: 1.0 + Oa() * 0.35, min: 0.12 }],
    },
    qphotonic: {
      "src>fib": () => ["photon", { f: 1.15, min: 0.1 }],
      "snspd>eom": ["stim", { min: 0.08 }],
    },
    qtopo: {
      "mzm>qd": ["rf", { min: 0.12 }],
      "qd>brd": () => ["photon", { f: 0.75 + Oa() * 0.25, min: 0.14 }],
    },
    qomega: {
      "tele>core": () => ["photon", { f: 1.25 + Oa() * 0.35, min: 0.12 }],
      "core>alg": ["rf", { min: 0.12 }],
    },
    agc66: {
      "dsky>nor": ["relay", { v: 0.45, min: 0.06 }],
      "rope>nor": () => ["tick", { f: 1024, v: 0.045, min: 0.07 }],
      "exec>nor": ["bell", { min: 0.6 }],
    },
    alto73: {
      "mse>alu": ["toggle", { min: 0.06 }],
      "dsk>alu": () => ["seek", { d: 0.3 + Oa() * 0.4, min: 0.09 }],
      "alu>eth": () => ["tick", { f: 1470, v: 0.04, min: 0.08 }],
    },
    arm07: {
      "ito>big": () => ["tick", { f: 1900, v: 0.035, min: 0.09 }],
      "pmic>big": ["coil", { v: 0.35, min: 0.14 }],
    },
    vax78: {
      "tlb>sbi": () => ["tick", { f: 980, v: 0.045, min: 0.08 }],
      "sbi>rp06": () => ["seek", { d: 0.35 + Oa() * 0.45, min: 0.09 }],
    },
    cdc6600: {
      "scb>fu10": () => ["tick", { f: 1250 + Oa() * 400, v: 0.05, min: 0.07 }],
      "pp10>cmem": ["coil", { v: 0.45, min: 0.14 }],
    },
    ascired97: {
      "mrc>flit": () => ["tick", { f: 1620, v: 0.045, min: 0.08 }],
      "flit>mpi": ["coil", { v: 0.6, min: 0.14 }],
    },
    qion: {
      "ms>ions": () => ["photon", { f: 1.1 + Oa() * 0.25, min: 0.1 }],
      "ions>pmt": ["stim", { min: 0.1 }],
    },
    qanneal: {
      "tun>squid": ["rf", { min: 0.12 }],
      "gap>gs": () => ["photon", { f: 0.72 + Oa() * 0.25, min: 0.14 }],
    },
    eniac46: {
      "mp>fta": () => ["tick", { f: 880 + Oa() * 620, v: 0.05, min: 0.05 }],
      "bus>acc": ["merc", { min: 0.08 }],
      "acc>io": ["clack", { min: 0.12 }],
    },
    lisp83: {
      "wcs>alu": () => ["tick", { f: 1180, v: 0.04, min: 0.08 }],
      "kbd>alu": ["key", { ibm: "F", min: 0.05 }],
    },
    wse24: {
      "sram>wafer": ["coil", { v: 0.65, min: 0.14 }],
      "wafer>cold": ["gurgle", { min: 1.5 }],
    },
    tandem77: {
      "cpu01>busx": () => ["tick", { f: 960, v: 0.045, min: 0.08 }],
      "busx>raid1": () => ["seek", { d: 0.3 + Oa() * 0.4, min: 0.1 }],
    },
    blade04: {
      "n0>ht": () => ["tick", { f: 1580, v: 0.04, min: 0.09 }],
      "ept>epoll": ["coil", { v: 0.5, min: 0.14 }],
    },
    systolic82: {
      "west>grid": () => ["clock", { ph: Oa() > 0.5, min: 0.08 }],
      "grid>out": ["tick", { f: 1420, v: 0.05, min: 0.12 }],
    },
    fugaku20: {
      "hbm>sve": ["coil", { v: 0.72, min: 0.15 }],
      "sve>tofu": () => ["tick", { f: 1720, v: 0.045, min: 0.09 }],
    },
    qspin: {
      "edsr>dots": ["rf", { min: 0.11 }],
      "dots>psb": () => ["photon", { f: 1.05 + Oa() * 0.28, min: 0.12 }],
    },
  };

function Qy(machineId, fromNode, toNode) {
  const map = bA[machineId];
  if (!map) return null;
  const entry =
    typeof map === "function" ? map(fromNode, toNode) : map[fromNode + ">" + toNode];
  return typeof entry === "function" ? entry() : entry;
}

var g0 = {
  real: [
    {
      use: "Relay armature clacks (Z1, analog, relay and tube machines)",
      title: "relay1.wav",
      author: "Mihacappy (Freesound)",
      license: "CC0 1.0",
      url: "https://freesound.org/people/Mihacappy/sounds/876593/",
    },
    {
      use: "Relay armature clacks",
      title: "Relay 3",
      author: "JoontheFloof (Freesound)",
      license: "CC0 1.0",
      url: "https://freesound.org/people/JoontheFloof/sounds/740253/",
    },
    {
      use: "Relay armature clacks",
      title: "Relay and loud click",
      author: "bassmosphere (Freesound)",
      license: "CC0 1.0",
      url: "https://freesound.org/people/bassmosphere/sounds/384701/",
    },
    {
      use: "Toggle snaps (Altair) and paddle clacks (PDP-8)",
      title: "toggle switch 1",
      author: "TheTechTinkerer (Freesound)",
      license: "CC0 1.0",
      url: "https://freesound.org/people/TheTechTinkerer/sounds/795663/",
    },
    {
      use: "Toggle snaps",
      title: "Toggle Switch",
      author: "pillwave (Freesound)",
      license: "CC0 1.0",
      url: "https://freesound.org/people/pillwave/sounds/423957/",
    },
    {
      use: "Teletype print-hammer strikes (ASR-33)",
      title: "R20-17-Teletype Machine.wav",
      author: "craigsmith (Freesound)",
      license: "CC0 1.0",
      url: "https://freesound.org/people/craigsmith/sounds/483336/",
    },
    {
      use: "Hard-disk voice-coil seek clicks",
      title: "computer hard drive access fan click.wav",
      author: "martian (Freesound)",
      license: "CC0 1.0",
      url: "https://freesound.org/people/martian/sounds/570733/",
    },
    {
      use: "Modem (90s PC, DIAL command)",
      title: "Dial up connection (short)",
      author: "PDSounds (pdsounds.org)",
      license: "CC0 1.0",
      url: "https://commons.wikimedia.org/wiki/File:Dial_up_connection_(short).oga",
    },
    {
      use: "Floppy seek/read (1541 drive, SAVE/LOAD)",
      title: "Floppy drive sounds",
      author: "AlepouTheFox",
      license: "CC0 1.0",
      url: "https://commons.wikimedia.org/wiki/File:Floppy_drive_sounds.ogg",
    },
    {
      use: "80s key clicks (home computer)",
      title: "Typing - Model F 122 1984",
      author: "Raymangold22",
      license: "CC0 1.0",
      url: "https://commons.wikimedia.org/wiki/File:Typing_-_Model_F_122_1984.ogg",
    },
    {
      use: "90s & modern mechanical key clicks",
      title: "Typing - Model M 1986",
      author: "Raymangold22",
      license: "CC0 1.0",
      url: "https://commons.wikimedia.org/wiki/File:Typing_-_Model_M_1986.ogg",
    },
    {
      use: "Teletype bell",
      title: "Typewriter ding (near, mono)",
      author: "_stubb",
      license: "CC0 1.0",
      url: "https://commons.wikimedia.org/wiki/File:406243_stubb_typewriter-ding-near-mono.wav",
    },
  ],
  synth: [
    "concert-hall multi-reflection convolution reverb (HF air-damped)",
    "divisi orchestral strings with Stradivari/cello wood corpus, 2.1 kHz Bridge Hill & staggered bow entry",
    "expressive solo cello & noble elegiac solo trumpet with warm nonlinear brass bloom",
    "stretched-harmonic spruce-soundboard felt-to-bright grand piano",
    "32'/16'/8'/4'/2-2/3' cathedral pipe organ with wind chiff",
    "conical-bore dual-formant French horns & distant concert snare roll",
    "3-formant vowel-morphing luminous choir",
    "CS-80-style ribbon synthesizer",
    "Bessel-mode concert timpani & pocket-watch escapement",
    "1.4 Hz pulse-tube dilution cryocooler helium breath & 400 Hz Apollo inverter tone",
    "relay armature + Z1 sliding plates + mercury delay-line ticks",
    "ASR-33 Teletype hammer, HDD voice-coil seek, NMR FID & wet spike pops",
  ],
};
