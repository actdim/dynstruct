---
protocol: along
slug: render-phase-props-sync
type: bug
status: done
completed: 2026-10-01
priority: high
created: 2026-09-29
updated: 2026-10-01
agent: claude
tags: [react, mobx, toReact]
blocked_by: []
related: []
milestone: v2.0.0-along-transition
---

# Props-to-model sync mutates MobX observables during render

`useComponent` (`src/componentModel/react/hooks.tsx`) synced incoming `params` into `c.model` directly in the render body. With `toReact`, this mutates observables while the wrapper renders, synchronously triggering `observer` reactions (e.g. the component's own `OrigView`) and React's "Cannot update a component while rendering a different component" warning. Render-phase side effects are also unsafe under concurrent rendering (discarded renders still mutate the model).

## Fix

- Move the sync into a dependency-less `useLayoutEffect` (runs after every commit, before paint).
- Trade-off: on a prop change the view renders once with the previous model value, then re-renders synchronously before paint.

## Acceptance

- [x] No render-phase observable mutation in `useComponent`.
- [x] Test (`tests/react/reactivity-and-props.test.tsx` > `toReact props sync`, fails on the old code): re-rendering a `toReact` component with a changed prop updates the model and emits no React render-phase update warning.
