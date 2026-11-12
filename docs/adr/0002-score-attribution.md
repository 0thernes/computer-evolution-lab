# ADR 0002: Score attribution

- Status: accepted (v6.0.0)
- Date: 2026-11-13

## Context

v5 labelled its procedural music with living composers' names and film titles (for example "Hans Zimmer · Cathedral Organ"), and the v6 prototype labelled cues "inspired by the mood of <film>". Naming a living composer or a film next to original music suggests an endorsement or a soundalike, and gains nothing.

## Decision

- No living composer, and no film, is named anywhere in the app, the score data or the build tools.
- Cues are described by plain musical traits: tempo, key, orchestration, texture. The UI label is "Original score · in the mood of epic/hybrid orchestral".
- The palette selector uses mood names: `epic`, `noble`, `clockwork`, `suspended`, `elegiac`, `slowbuild`, `synthnoir`. Saved settings that hold an old composer key are migrated (`SCORE_THEME_MIGRATION` in `src/audio/cinematic-score.js`).
- The offline build pipeline (`tools/score/`) carries a `mood` field instead of the v6 `film` field.
- Melodies and progressions stay original. Nothing is quoted or transcribed.

## Consequences

Old screenshots and the v5 release notes still show the old labels. That history is not rewritten.
