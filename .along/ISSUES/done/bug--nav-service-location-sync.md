---
protocol: along
protocol_version: "4.5.3"
slug: nav-service-location-sync
type: bug
status: done
completed: 2026-10-24
priority: high
created: 2026-10-24
updated: 2026-10-24
agent: claude-code
tags: [navigation]
milestone: v2.0.0
parent: bug--nav-service-location-sync
blocked_by: []
related: [feat--nav-service-dependencies]
---

# NavService publishes APP.NAV.CONTEXT.CHANGED on every location change

Child of the mempart issue `bug--nav-service-location-sync` (browser Back did nothing in the app).

`NavService` sent `APP.NAV.CONTEXT.CHANGED` only from `onLayoutReady`, i.e. once per mount, with the location captured
on the first render. It lives in the persistent root layout, so later navigations and popstate (browser Back/Forward)
were never published, and `APP.NAV.CONTEXT.GET` kept returning the first location. The `def` closures also kept the
first-render `navigate` (stale relative base outside data routers). Part of `feat--nav-service-dependencies`.

## Requirements
- REQ-1: NavService MUST publish `APP.NAV.CONTEXT.CHANGED` with the live location on every location change (push,
  replace, pop), once per change (StrictMode-safe), and keep `CONTEXT.GET` / `HISTORY.READ` current.
- REQ-2: GOTO handlers MUST use the live `navigate`; GOTO accepts `state` (passed to `navigate`).
- REQ-3: `getUrlBuilder` MUST skip `undefined` / `null` params instead of emitting `key=undefined`.

## Acceptance Criteria
- [x] Push, replace, `navigate(-1)` and an external router pop each publish the live context once
- [x] GOTO `state` reaches `location.state`; nullish params are not serialized
- [x] Automated tests passing (tests/react/nav-service-location-sync.test.tsx)
