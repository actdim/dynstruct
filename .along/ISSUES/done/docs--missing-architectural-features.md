---
protocol: along
slug: missing-architectural-features
type: docs
status: done
completed: 2026-09-27
priority: high
created: 2026-09-27
updated: 2026-09-27
agent: antigravity
tags: [docs, dynstruct, component-model, reactive, navigation]
milestone: v2.0.0
blocked_by: []
related: []
---

# Document Missing Architectural Features in Dynstruct

Document critical features that are implemented and tested in code but missing from the Knowledge Base and LLM context:
1. `ComponentStructExt`: Public vs Internal struct split to protect component props encapsulation.
2. `ComponentProp<T>` with `reactive: 'shallow' | false`: Granular reactivity control.
3. Form input helper `c.mapToEdit(path, exclude)` for HTML and MUI inputs.
4. Two-way data binding primitives: `bind`, `bindProp`, and `ValueConverter`.
5. Navigation and routing: `createNavigationRoute`, parameter compilation, and bus routing via `APP.NAV.GOTO`.
6. Complete `events` lifecycle (`onInit`, `onReady`, `onDestroy`, etc.) and the Zero-Hooks rule.
7. Hierarchical message scoping: `ComponentMsgFilter` (`FromAncestors`, `FromDescendants`).
8. Composition of child components via typed slots `c.children`.
9. Root application initialization with `ComponentContextProvider`.

## Verification
- Update `docs/topic--02-core-concepts.md`
- Update `docs/topic--03-architecture-and-wiring.md`
- Update `docs/topic--04-react-integration.md`
- Update `docs/topic--05-api-reference.md`
- Run `along kb-sync` to recompile `INDEX.md`, `llms.txt`, and `llms-full.txt`.
