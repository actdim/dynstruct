---
protocol: along
slug: child-composition-and-bindprop-priority
type: docs
status: done
completed: 2026-10-01
priority: high
created: 2026-09-30
updated: 2026-10-01
agent: claude
tags: [agents, composition, bindings, performance]
blocked_by: []
related: []
milestone: v2.0.0-along-transition
---

# Agent guidance: `children` composition and `bindProp` as the default binding

Agents rendered nested dynstruct components inline in `view` (`<Toast items={m.items} onDismiss={() => ...} />`, see the history of `src/apps/webapp/src/services/ToastService.tsx`) and wrote long `bind(get, set)` pairs for plain two-way bindings.

Execution Mode: Direct (docs only).

## Rules to document

1. Nested dynstruct components are declared in `def.children` via their hook-constructor and rendered as `<c.children.Name />`; a fragment without its own model is shortened to a `React.FC` child. Inline JSX with props/callbacks is kept for compatibility only. Rationale: the child is created once, bindings are lazy, the parent does not track the child's values, so no `useMemo` / `useCallback` is needed.
2. Binding priority: `bindProp(() => m, 'prop')` (two-way, nested paths supported) > `bind(() => expr)` (read-only / derived) > `bind(get, set[, converter])` only when the getter or setter needs specific logic.

## Targets

- [x] `src/packages/dynstruct/AGENTS.md` (+ `llms-full.txt`; `docs/public/llms-full.txt` re-copied from it, as CI `pages.yml` does)
- [x] `src/packages/dynstruct-mui/AGENTS.md` (+ `llms-full.txt`): new "Consuming Wrappers (priority)" section
- [x] root `AGENTS.md` (Project specifics), `src/apps/webapp/AGENTS.md`
