---
protocol: along
slug: stale-params-events
type: bug
status: done
completed: 2026-10-01
priority: medium
created: 2026-09-29
updated: 2026-10-01
agent: claude
tags: [react, toReact, events]
blocked_by: []
related: [bug--render-phase-props-sync]
milestone: v2.0.0-along-transition
---

# `params.$events` are frozen at the first render

`createComponent` (`src/componentModel/react/hooks.tsx`) wraps `params` once, inside `useLazyRef`. Every later render of a `toReact` component passes new `$events` callbacks, but lifecycle hooks, `onCatch` and model event handlers (`core.tsx`) keep calling the callbacks from the first render.

Additionally, `createModel` decides at creation time whether `onPropChanging` / `onPropChange` / `onGetX` are wired at all, so a handler supplied only on a later render is never called.

## Fix

- `createComponent` registers an internal updater; `useComponent` re-wraps and swaps `params.$events` on every commit (layout effect, before the props sync).
- `onPropChanging` / `onPropChange` wrappers are always installed and resolve handlers at call time.
- `onGetX` is resolved at read time instead of at model creation.

## Acceptance

- [x] `onChangeX` / `onPropChange` / `onGetX` passed only on a later render are called (`onInit` / `onReady` fire once, so a later value cannot apply to them).
- [x] Replaced callbacks (`onChangeX`, `onDestroy`) are used instead of the initial ones.
- Tests: `tests/react/strictmode-and-live-events.test.tsx` > `Live params.$events` (fail on the old code).
