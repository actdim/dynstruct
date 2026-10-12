---
protocol: along
protocol_version: "4.4.7"
slug: react-values-and-ref-prop
type: docs
status: done
completed: 2026-10-10
priority: high
created: 2026-10-10
updated: 2026-10-10
agent: claude
tags: [docs, react, reactivity, changelog]
blocked_by: []
related: [bug--wrap-user-code-react-elements, feat--react-values-opaque-and-ref-props]
---

# Document React values handling and `reactive: 'ref'`

## Requirements

- REQ-1: CHANGELOG.md `[Unreleased]`: the debugger-attached rendering fix (`bug--wrap-user-code-react-elements`),
  React values passed through untouched and `reactive: 'ref'` (`feat--react-values-opaque-and-ref-props`).
- REQ-2: README.md Changelog: matching `Unreleased` entry.
- REQ-3: `docs/topic--05-api-reference.md`: `ComponentProp.reactive` includes `'ref'`.
- REQ-4: `docs/topic--04-react-integration.md`: section on React values in props (`children`, slots, component
  types), when to use `reactive: 'ref'`, and the symptom of the old bug.
