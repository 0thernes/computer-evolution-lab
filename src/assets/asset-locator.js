// Asset locator (see docs/adr/0001-asset-hosting.md).
// Standard tier ships in the repo under assets/ (1K CC0 PBR maps, 1K HDRI, 18 sampled score cues
// at "lite" bitrate, CC0 SFX). An optional full tier (2K maps, 2K HDRI, full-bitrate stems) can be
// unzipped from the v6.0.0 release asset into assets/full/; it is used when assets/tier.json
// says tier=full (the release zip overwrites that file). From file:// browsers block WebGL texture uploads and fetch() of local files, so the lab
// keeps its procedural materials, RoomEnvironment lighting and live procedural score instead.
var CelAssets = (() => {
  const isFile = location.protocol === "file:";
  const state = { tier: "standard", probed: false, isFile };
  let probe = null;

  function probeFullTier() {
    if (probe) return probe;
    if (isFile || typeof fetch !== "function") {
      probe = Promise.resolve(state);
      state.probed = true;
      return probe;
    }
    probe = fetch("assets/tier.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (m && m.tier === "full") state.tier = "full";
      })
      .catch(() => {})
      .then(() => {
        state.probed = true;
        return state;
      });
    return probe;
  }

  const paths = {
    standard: { tex: "assets/tex/1k/", hdri: "assets/hdri/studio_1k.hdr", music: "assets/music/lite/" },
    full: { tex: "assets/full/tex/2k/", hdri: "assets/full/hdri/studio_2k.hdr", music: "assets/full/music/" },
  };

  return {
    state,
    probeFullTier,
    // External assets only work over http(s); file:// keeps the procedural fallbacks.
    canLoad: () => !isFile && typeof fetch === "function",
    tex: (name) => paths[state.tier].tex + name + ".jpg",
    hdri: () => paths[state.tier].hdri,
    stem: (cue, stem) => `${paths[state.tier].music}${cue}_${stem}.ogg`,
    sfx: (name) => `assets/audio/${name}.mp3`,
  };
})();
window.CelAssets = CelAssets;
