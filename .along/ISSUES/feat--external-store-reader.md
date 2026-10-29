---
protocol: along
protocol_version: "4.5.4"
slug: external-store-reader
type: feat
status: in-progress
priority: high
created: 2026-10-28
updated: 2026-10-29
agent: claude-code
tags: [reactivity, i18n]
milestone: v2.0.0
parent: bug--locale-switch-no-rerender
blocked_by: []
related: []
plan_status: approved
---

# fromExternalStore: track external (non-model) state in observer views and bindings

## Problem

Component views are MobX `observer`s and binding getters are evaluated on model reads, so they re-run only when an
observable they read changes. State that lives outside the component model (an i18next runtime, a module-level
service snapshot) is invisible to them: a view or `bind(() => ...)` that reads it never updates.

App and library code must not import MobX directly (dynstruct AGENTS.md, "importing or using MobX directly"), so they
have no supported way to make such state trackable. The webapp locale switch (umbrella
`bug--locale-switch-no-rerender`) needs exactly this for `t()` in `@actdim/ui-core`.

## Requirements

- REQ-1: `@actdim/dynstruct/componentModel/core` MUST export
  `fromExternalStore<T>(subscribe: (onChange: () => void) => () => void, getSnapshot: () => T, name?: string): () => T`,
  the same contract as React `useSyncExternalStore`.
- REQ-2: Calling the returned reader inside an observer view, a binding getter, a computed prop or an effect MUST make
  that reaction re-run when the store calls `onChange`.
- REQ-3: The reader MUST subscribe to the store only while at least one reaction observes it, and unsubscribe when the
  last one stops (no leaked listeners after unmount).
- REQ-4: Called outside a reaction, the reader MUST return `getSnapshot()` without subscribing.
- REQ-5: Public API and agent docs MUST describe it as the supported way to read external state in views.

## Acceptance Criteria
- [ ] `fromExternalStore` exported from `componentModel/core` with JSDoc
- [ ] Tests: view re-renders on store change; `bind(() => read())` child prop updates; listener removed on unmount; no subscription outside a reaction
- [ ] `docs/topic--05-api-reference.md`, `docs/topic--04-react-integration.md` and the AGENTS.md dev guide updated
- [ ] Package version bumped (minor) and synced via `pnpm run version:sync`
- [ ] Automated tests passing
