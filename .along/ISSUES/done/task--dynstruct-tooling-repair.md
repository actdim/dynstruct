---
protocol: along
protocol_version: "4.4.9"
slug: dynstruct-tooling-repair
type: task
status: done
completed: 2026-10-11
priority: medium
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
tags: [tooling]
blocked_by: []
related: []
---

# Repair broken eslint.config.mjs and drop --silent from the along test hook

## Problem

- `eslint.config.mjs` did not load: commit `3c37508` interleaved the previous object-style config (last valid in
  `4a10b8c`) with the unified array config (two `export default defineConfig(`, duplicate imports and keys).
  `pnpm lint` could not run at all.
- `.along/scripts/test.py` ran `npm test -- --silent`; `along test` reported "executed no tests" although all
  tests passed (summary suppressed; ANSI colors also broke the summary parsing).

## Changes

- `eslint.config.mjs`: one valid array config (the unified variant: global ignores, js block, ts/tsx block
  with typed parser, react/a11y/stylistic rules).
  - react-hooks: only `rules-of-hooks` / `exhaustive-deps` (as in the webapp config); the v6 `recommended`
    set adds React Compiler rules (refs, immutability, globals, purity) that contradict the component model.
  - `prefer-const` with `ignoreReadBeforeAssign: true` for the canonical `let c; let m;` pattern.
- `.along/scripts/test.py`: `npm test` without `--silent`, `NO_COLOR=1` / `FORCE_COLOR=0`.
- Lint warnings fixed in lines touched by this session (`core.tsx`, `hooks.tsx`, new tests); `toReact` inner
  component renamed to `ReactComponent` (rules-of-hooks).

## Result

- `npx eslint src tests`: 15 errors / 386 warnings, all pre-existing. Errors are only in `src/_stories`
  (jsx-a11y, react/no-unescaped-entities); warnings are mostly style (padding lines, type-imports, prefer-const).
- `along test`: PASS, node 6 + react 65 tests counted.

## Follow-ups (not done here)

- The same broken-merge `eslint.config.mjs` exists in the msgmesh, utico, dynstruct-mui and webmold submodules.
- Story lint errors in `src/_stories`.

## Acceptance Criteria
- [x] ESLint config loads and lints `src` / `tests`
- [x] No lint errors in files touched by this session
- [x] `along test` counts executed tests
- [x] Automated tests passing
