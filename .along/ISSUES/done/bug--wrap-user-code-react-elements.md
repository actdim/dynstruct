---
protocol: along
protocol_version: "4.4.7"
slug: wrap-user-code-react-elements
type: bug
status: done
completed: 2026-10-09
priority: critical
created: 2026-10-09
updated: 2026-10-09
agent: claude
tags: [react, error-handling, devtools]
blocked_by: []
related: [debt--safe-user-code-execution]
---

# wrapUserCode descends into React elements and breaks rendering when a debugger is attached

## Symptom

The webapp fails to render in the VS Code integrated browser (and in any Chromium with DevTools/CDP attached):
`TypeError: Cannot read properties of undefined (reading 'mode') at handleThrow` (react-dom 19.2).

## Root cause

`useComponent` -> `createComponent` wraps `params` with `wrapUserCode(params, true)`. `wrapUserCode`
recurses into every plain object, including React elements passed as params (e.g. `children`).
In React DEV each element carries `_debugTask` (`console.createTask(...)`); with a debugger attached its
prototype is plain, so its native `run` method gets replaced by a wrapper that calls it without a receiver:
`Error: 'run' called with illegal receiver`. React then loses its work-in-progress fiber and reports the
secondary `reading 'mode'` error.

## Fix

- REQ-1: `wrapUserCode` must return React elements (`React.isValidElement`) unchanged.
- REQ-2: the component model stores React elements (and arrays of them) by reference: props holding them
  get `observable.ref`, and the model / deep proxies never proxy or convert them (`core.tsx`).
- Regression tests: `tests/react/reactElementParams.test.tsx` (emulates an attached debugger via `console.createTask`).

## Trigger

The webapp `AppShell` (added in the root repo's v1.8.1, 2026-10-07) stores `children` (`<Outlet />`) in its model.
The underlying framework gap predates v1.8.0.

## Verification

- dynstruct `npm test`: all suites pass; `npm run typecheck` clean; `dist` rebuilt.
- Webapp in Yandex 26.8 (Chromium 150) with a CDP debugger attached: renders, no exceptions.
- Note: an already running Vite dev server may keep serving the stale `hooks.es.js` from its transform cache; restart it.
