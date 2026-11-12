# ADR 0001: Asset hosting

- Status: accepted (v6.0.0)
- Date: 2026-11-13

## Context

v6 of the prototype used about 135 MB of CC0 media (2K textures, 2K HDRI, 116 MB of score stems). The repository was 4.8 MB, is served from GitHub Pages, opens straight from a clone over `file://`, and is embedded into a single-file Windows `.exe`. Requirements: works from a fresh clone, works offline, works on GitHub Pages, keeps the clone small enough to be practical, and every file is CC0, public domain or permissively licensed.

Browsers block WebGL texture uploads from `file://` images and block `fetch()` of local files, so no external asset can load when `index.html` is double-clicked.

## Decision

Two tiers plus a fallback.

1. **Standard tier, committed to git (about 17.5 MB):**
   - `assets/tex/1k/`: 14 ambientCG 1K maps (CC0).
   - `assets/hdri/studio_1k.hdr`: Poly Haven `studio_small_09` at 1K (CC0).
   - `assets/music/lite/`: 18 cues × 3 stems (bed, pulse, lead) as Opus, rendered from VSCO 2 CE (CC0).
   - `assets/audio/*.mp3`: 8 CC0 recorded SFX.
     This tier is what GitHub Pages serves and what `node tools/serve.mjs` serves from a clone, offline.
2. **Full tier, release asset `cel-assets-full-v6.0.0.zip` (about 96 MB):** 2K maps, the 2K HDRI and full-bitrate stems under `assets/full/`, plus an `assets/tier.json` with `"tier": "full"`. Unzip it at the repo root; `assets/full/` is git-ignored. `git checkout assets/tier.json` and deleting `assets/full/` returns to the standard tier.
3. **`file://` fallback:** procedural PBR materials, `RoomEnvironment` lighting and the live WebAudio score. Every external asset is swapped in only after it has loaded and decoded, so a missing file never leaves a black material or silence.

`src/assets/asset-locator.js` (`CelAssets`) reads `assets/tier.json` once and builds every path.

## Rejected options

- **Git LFS:** GitHub Pages serves LFS pointer files rather than the content, LFS bandwidth is metered, and a plain `git clone` without `git-lfs` installed gets pointers.
- **Fetching the full tier from the GitHub release at run time:** release downloads don't send CORS headers, so the browser can't read them.
- **Committing the full tier:** about 96 MB more in every clone, forever in history.
- **Embedding assets as base64 in JS (the v5 approach for 5 SFX):** about 33% larger, parsed on every load, and impossible to swap per tier.

## Consequences

- The clone grows from 4.8 MB to about 21 MB of `.git`.
- The `.exe` embeds the standard tier.
- Opening `index.html` directly gives the procedural look and synth score. The README says so and recommends `npm start`.
