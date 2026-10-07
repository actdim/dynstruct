---
protocol: along
slug: strictmode-lifecycle
type: bug
status: done
completed: 2026-10-01
priority: medium
created: 2026-09-29
updated: 2026-10-01
agent: claude
tags: [react, strictmode, lifecycle, msgmesh]
blocked_by: []
related: [bug--stale-params-events]
milestone: v2.0.0
---

# Components break under React StrictMode effect re-mount

StrictMode simulates unmount/remount of effects. In `src/componentModel/react/hooks.tsx`:

- `useComponent`'s layout-effect cleanup disposes the component (aborts its only `AbortController`) and sets `ref.current = null`, so after the simulated remount the component keeps an aborted `abortSignal` (msgBroker subscriptions and bus requests are dead) and the next render creates a brand-new instance (new `View` type, subtree remount, state loss).
- `registerMsgBroker` (`core.tsx`) mutates `component.msgBroker` params in place, so every re-registration wraps callbacks/filters again.

## Fix

- Per-mount `AbortController` created in `OrigView`'s passive effect and aborted in its cleanup (after `onDestroy`); `Symbol.dispose` aborts the current one.
- `useComponent` cleanup no longer drops the instance.
- `registerMsgBroker` builds new param objects instead of mutating the definition.

## Found while fixing: remount on the second render

`ErrorBoundary` (`src/componentModel/react/errorBoundary.tsx`) returned `id ? <div id={id}>{content}</div> : content`. `component.id` is assigned during the first render of `OrigView` (below the boundary), so the first render had no wrapper and the second one had it: the tree shape changed and React remounted the view - full `onDestroy` / `unregister` / `onReady` cycle on the first re-render of every component with an error boundary (the default). The healthy state now renders children without a wrapper (matches the documented contract: the framework does not apply `id` to the DOM); only the fallback keeps `<div id>`.

## Acceptance

- [x] Under `<React.StrictMode>` a msgBroker subscriber receives each message exactly once, and the instance is not re-created.
- [x] After unmount the subscriber no longer receives messages.
- [x] Re-renders do not restart the lifecycle (`onReady` once, no `onDestroy` before unmount).
- Tests: `tests/react/strictmode-and-live-events.test.tsx` (fail on the old code).
