---
protocol: along
protocol_version: "4.4.9"
slug: component-model-dev-guards
type: bug
status: done
completed: 2026-10-11
priority: low
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
tags: [componentModel]
blocked_by: []
related: []
---

# DEV guards: double-mounted View, plain param for a computed prop

## Problems

- A plain param for a computed (getter-only) prop crashed the creation:
  `TypeError: Cannot set property full of #<Object> which has only a getter`.
- One instance's `View` rendered in two places at once shares the id, registry entry, effects and abort controller;
  the first unmount tears them down for both - silently.

## Changes

- `createModel` (`core.tsx`): params for computed props are ignored with a DEV warning.
- `OrigView` (`hooks.tsx`): mounted-views counter; DEV warning when the same view is mounted more than once at the
  same time (StrictMode remount sequence is unaffected: cleanup runs before the second mount).

## Tests

`tests/react/dev-guards.test.tsx`.

## Acceptance Criteria
- [x] Computed-prop param ignored with a warning, no crash
- [x] Double mount warns in DEV
- [x] Automated tests passing
