#!/usr/bin/env node
// Rebuilds vendor/three-bundle.js from the pinned three@0.170.0 npm package.
//   npm i --no-save three@0.170.0 esbuild@0.24.0 && node tools/build-vendor.mjs
// The output is committed so the app runs from a clone or file:// with no install step.
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await build({
  entryPoints: [path.join(root, "tools/vendor/three-entry.mjs")],
  outfile: path.join(root, "vendor/three-bundle.js"),
  bundle: true,
  format: "iife",
  minify: true,
  legalComments: "none",
  target: ["es2020"],
  banner: {
    js: "/* Three.js r170 + OrbitControls, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, ShaderPass, OutputPass, GTAOPass, SMAAPass, BokehPass, RGBELoader, RoundedBoxGeometry, BufferGeometryUtils. (c) 2010-2024 three.js authors, MIT License. Built by tools/build-vendor.mjs */",
  },
});
console.log("vendor/three-bundle.js rebuilt");
