---
protocol: along
protocol_version: "4.4.9"
slug: error-dedup-singleton-errors
type: bug
status: done
completed: 2026-10-11
priority: medium
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
tags: [componentModel, errors]
blocked_by: []
related: []
---

# run() error dedup suppresses the same error object forever

## Problem

`run` (`src/componentModel/react/hooks.tsx`) dedups error reports through the module-global
`_lastDispatchedError` so a rethrow through nested runs (action -> action, effect -> action) is reported once.
In non-silent mode (actions, msgBroker) it was never reset: the same error object thrown again later - a singleton
error, a cached rejected promise, a reused AbortError - was never routed to `onCatch` / `$ERROR` again, in any
component.

## Change

Run nesting depth counter: a `run` entered at depth 0 starts a new propagation chain and resets the marker.
Nested synchronous rethrows report once; the same object in a new chain reports again. No timing heuristics.
Known edge: an async nested action that rejects after another depth-0 run started in between may be reported
twice (double report instead of a lost one).

Error-wrapping patterns (documented in the anti-patterns section, `docs--dynstruct-anti-patterns`): functions in
`def.actions` are wrapped automatically; closure helpers next to the component wrap their body in `c.run(...)`;
inline JSX handlers are not recommended.

## Tests

`tests/react/error-dedup.test.tsx`: same error object from two separate action calls -> 2 reports;
action -> action rethrow -> 1 report.

## Acceptance Criteria
- [x] Same error object reported again in a new chain
- [x] Nested rethrow reported once
- [x] Automated tests passing
