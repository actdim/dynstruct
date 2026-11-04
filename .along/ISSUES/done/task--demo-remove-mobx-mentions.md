---
protocol: along
protocol_version: "4.6.0"
slug: demo-remove-mobx-mentions
type: task
status: done
completed: 2026-11-04
priority: high
created: 2026-11-04
updated: 2026-11-04
agent: antigravity
tags: [demo, cleanup]
milestone: v2.0.0
blocked_by: []
related: []
plan_status: approved
---

# Remove MobX mentions and direct dependencies from demo

Dynstruct abstracts away underlying reactivity mechanics. Mentions of MobX in demo UI copy, snippets, descriptions, and package dependencies expose implementation details unnecessarily and distract from Dynstruct contract architecture.

## Requirements
- REQ-1: Dynstruct demo UI and data files MUST NOT contain any mention of MobX.
- REQ-2: Demo dependencies MUST NOT depend directly on mobx or mobx-react-lite unless strictly required by external tooling.
- REQ-3: Demo Playwright e2e tests MUST pass with updated text labels.

## Acceptance Criteria
- [x] All MobX references in `src/packages/dynstruct/demo` source files, HTML/Astro pages, and sample data replaced with Dynstruct reactive model terminology.
- [x] Dependencies `mobx` and `mobx-react-lite` removed from `demo/package.json`.
- [x] Demo e2e test suite passing.
