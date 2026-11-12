// Entry point for vendor/three-bundle.js (built by tools/build-vendor.mjs).
// Exposes Three.js r170 as window.THREE and the add-ons the lab uses as window.THREE_ADDONS so
// the classic <script> app keeps working from file:// without a module loader.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { CopyShader } from "three/addons/shaders/CopyShader.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

window.THREE = THREE;
window.THREE_ADDONS = {
  OrbitControls,
  RoomEnvironment,
  EffectComposer,
  RenderPass,
  UnrealBloomPass,
  ShaderPass,
  OutputPass,
  CopyShader,
  Pass,
  FullScreenQuad,
  GTAOPass,
  SMAAPass,
  BokehPass,
  RGBELoader,
  RoundedBoxGeometry,
  BufferGeometryUtils,
};
