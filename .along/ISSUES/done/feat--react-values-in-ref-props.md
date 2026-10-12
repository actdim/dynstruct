---
protocol: along
protocol_version: "4.4.9"
slug: react-values-in-ref-props
type: feat
status: done
completed: 2026-10-11
priority: high
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
tags: [componentModel, react]
blocked_by: []
related: []
---

# React values allowed only in ref props; no auto-detection; DEV error otherwise

## Problem

The recursive auto-detection (`isReactNodeValue`) scanned every object prop on each read (every render) and write,
silently made whole objects non-reactive when one nested React value was found, decided reactivity once from the
contents at creation, and contradicted the documentation. Supersedes `bug--nested-react-nodes-proxy-prevention`.

## Changes

- `core.tsx`: auto-detection removed from annotation inference and the get/set traps; `findReactValuePath` +
  `assertNoReactValue` (DEV only) at model creation and on every assignment (top-level, nested, array items);
  opaque paths: `ref`, `false`, items of `'shallow'`. Controlled boundary writes are not checked (not stored).
- Consumers: dynstruct-mui `task--content-props-as-ref` (item/slot props as `ref`); webapp audited - no violations.
- ADR `react-values-in-ref-props`; docs (AGENTS.md, topic--02, topic--04 s.7), CHANGELOG (breaking).

## Tests

`tests/react/reactElementParams.test.tsx` "React values only in ref props": plain param / nested / assignment throw;
ref prop and shallow items keep values by reference with a debugger emulated; toReact props are not checked.

## Acceptance Criteria
- [x] No auto-detection, no scans on read
- [x] DEV error for React values in deep-reactive props
- [x] Consumers updated (dynstruct-mui), webapp audited
- [x] ADR, docs, CHANGELOG
- [x] Automated tests passing
