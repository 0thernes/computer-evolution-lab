// Correctness-only lint gate (no style rules: Prettier owns formatting). The bundle-derived classic
// scripts share globals across files, so no-undef/no-unused-vars are covered by
// tools/audit-exhaustive.mjs instead. Run: npx --yes eslint@9.39.5 .
const correctness = {
  "array-callback-return": "off",
  "for-direction": "error",
  "getter-return": "error",
  "no-async-promise-executor": "error",
  "no-compare-neg-zero": "error",
  "no-const-assign": "error",
  "no-constant-binary-expression": "error",
  "no-dupe-class-members": "error",
  "no-dupe-else-if": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-empty-character-class": "error",
  "no-func-assign": "error",
  "no-import-assign": "error",
  "no-invalid-regexp": "error",
  "no-loss-of-precision": "error",
  "no-misleading-character-class": "error",
  "no-redeclare": "error",
  "no-self-assign": "error",
  "no-self-compare": "error",
  "no-setter-return": "error",
  "no-shadow-restricted-names": "error",
  "no-sparse-arrays": "error",
  "no-unreachable": "error",
  "no-unsafe-finally": "error",
  "no-unsafe-negation": "error",
  "no-unsafe-optional-chaining": "error",
  "no-useless-backreference": "error",
  "use-isnan": "error",
  "valid-typeof": "error",
};

export default [
  { ignores: ["vendor/**", "node_modules/**", "desktop/bin/**", "desktop/obj/**"] },
  {
    files: ["**/*.js"],
    languageOptions: { ecmaVersion: 2024, sourceType: "script" },
    rules: correctness,
  },
  {
    files: ["**/*.mjs"],
    languageOptions: { ecmaVersion: 2024, sourceType: "module" },
    rules: correctness,
  },
];
