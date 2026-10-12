---
protocol: along
protocol_version: "4.4.7"
slug: react-values-opaque-and-ref-props
type: feat
status: done
completed: 2026-10-09
priority: high
created: 2026-10-09
updated: 2026-10-09
agent: claude
tags: [react, reactivity, props]
blocked_by: []
related: [bug--wrap-user-code-react-elements]
---

# React values pass through dynstruct untouched; `reactive: 'ref'` props

Follow-up to `bug--wrap-user-code-react-elements`. React itself passes props by reference and never
transforms them; dynstruct must do the same for React objects, whatever prop name carries them (`children`,
`icon`, ...).

## Requirements

- REQ-1: any React object (`$$typeof` symbol: elements, portals, `memo` / `forwardRef` / `lazy` types,
  contexts) is opaque: `wrapUserCode` does not descend into it, the model stores it by reference
  (no MobX conversion, no deep proxy). Replaces the narrower `isValidElement` check.
- REQ-2: `prop({ reactive: 'ref' })` - the prop is tracked on reassignment, its value is stored by reference
  and never converted or proxied. Covers slots that start `undefined` and receive React content later.
- REQ-3: tests for portals, `memo` / `forwardRef` types, late-assigned elements with `reactive: 'ref'`.
- REQ-4: document `reactive: 'ref'` in AGENTS.md (State and Reactivity Rules) and the `ComponentProp` JSDoc.

## Outcome

- `isReactObject` (`util.ts`) replaces `isValidElement` in `wrapUserCode` and the model.
- `reactive: 'ref'` maps to `observable.ref`; a top-level ref prop without `initialValue` is created as
  `undefined` so MobX applies the annotation (keys added later get the default deep enhancer).
- Tests: `tests/react/reactElementParams.test.tsx` (portal, memo/forwardRef types, late ref assignment).
- Docs: AGENTS.md, `docs/topic--02-core-concepts.md` (also fixed its example: prop definitions need `prop(...)`).
- Decided against routing `children` to the view in `toReact`: `children` stays a regular prop, as in React.
