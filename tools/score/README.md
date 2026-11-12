# Score build pipeline (offline, Python)

Renders the 18 sampled cues in `assets/music/` from CC0 sources. Ported from the
v6 prototype; film and composer references were removed (see
`docs/adr/0002-score-attribution.md`). The browser never runs this code.

Inputs (not in git; download them yourself):

- `CEL_VSCO`: a checkout of [VSCO-2-CE](https://github.com/sgossner/VSCO-2-CE) (CC0).
- `CEL_ASSET_SRC/fs/`: the CC0 impulse responses and SFX listed in `data/freesound_meta.json` and `CREDITS.md`.

Requirements: Python 3.11+, numpy, scipy, soundfile, matplotlib; ffmpeg with libopus.

```bash
CEL_VSCO=~/src/VSCO-2-CE CEL_ASSET_SRC=~/cel-src python3 tools/score/build.py        # all cues
CEL_VSCO=~/src/VSCO-2-CE CEL_ASSET_SRC=~/cel-src python3 tools/score/build.py hub    # one cue
```

Files: `insts.py` maps samples to verified pitches, `theory.py` handles chords and
voice leading, `arr.py` holds the part generators, `cues.py` the 18 compositions,
`build.py` renders 3 stems per cue (bed / pulse / lead) with convolution reverb,
loop folding and one linked mastering gain curve, and `check.py` verifies each
rendered stem's key by chroma analysis.

`tools/assets/` holds the matching texture (`make_textures.py`), SFX
(`make_sfx.py`) and HDRI (`hdr_half.py`) preparation scripts.
