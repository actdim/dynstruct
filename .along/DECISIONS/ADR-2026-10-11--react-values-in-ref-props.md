---
protocol: along
slug: react-values-in-ref-props
type: decision
title: "React values are stored only in ref props; no auto-detection, DEV error otherwise"
date: 2026-10-11
status: accepted
tags: [adr, architecture, decision, componentModel, react]
---

# ADR-2026-10-11--react-values-in-ref-props - React values are stored only in ref props; no auto-detection, DEV error otherwise

- Date: 2026-10-11
- Status: accepted
- Issue: `feat--react-values-in-ref-props` (supersedes `bug--nested-react-nodes-proxy-prevention`)

## Context

React objects (elements, portals, memo/forwardRef/lazy types, contexts) break when MobX converts or proxies them
(DEV-only `_debugTask.run` needs its receiver; visible only with a debugger attached). The previous fix detected
React values automatically: `isReactNodeValue` scanned every object prop recursively - in annotation inference and
in the model get/set traps - and silently switched a prop containing a React value anywhere inside to `ref`.
Consequences: a full recursive scan on every read of an object prop (every render), whole objects silently becoming
non-reactive because of one nested element, reactivity decided once at creation from the current contents, and
documentation that described the opposite behavior.

## Decision

- No auto-detection. React values are stored in the model only where values are stored as is:
  `prop({ reactive: 'ref' })` (anywhere inside), `reactive: false`, items of a `'shallow'` container.
- In DEV, storing a React value in a deep-reactive prop (default, plain param, assignment, nested) throws with the
  prop path and the fix. Production does not check (no scanning cost).
- Values read through bindings are not stored and not checked: `toReact` props (incl. `children`), factory-child
  JSX props, `bind` / `bindProp` (follows ADR `params-initial-value-semantics`).

## Consequences

- Breaking for code relying on auto-detection; mitigated by the params semantics: most React content arrives through
  bindings and needs nothing. Wrappers with item/slot props carrying React content declare `ref`
  (dynstruct-mui: List/Table/Tabs/ToggleButtonGroup/Menu items, TextField/Autocomplete `slotProps`); a webapp audit
  found no violations.
- `ref` item arrays are updated by replacing the array (in-place mutations are not tracked).
- Read/write paths of the model no longer scan values.
