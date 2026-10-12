---
protocol: along
slug: params-initial-value-semantics
type: decision
title: "Params semantics: plain params are initial values, live input only via bindings"
date: 2026-10-11
status: accepted
tags: [adr, architecture, decision, componentModel, params, bindings]
---

# ADR-2026-10-11--params-initial-value-semantics - Params semantics: plain params are initial values, live input only via bindings

- Date: 2026-10-11
- Status: accepted
- Issue: `debt--params-initial-value-semantics`

## Context

A dynstruct instance is created once (`useLazyRef`), but React calls the hook-constructor on every render
with new params. To keep `toReact` props live, `useComponent` copied changed params into the model after
every commit. That made every plain param co-owned by the parent and the component with no defined winner
("derived state from props"): internal edits were reset by unrelated parent re-renders (the value was
compared with the model, not the previous param), inline callbacks replaced on later renders bypassed error
routing, a parent could not re-send a value it sent before, creation and update filtered params differently
(`$events` / `$id` / `$key` were stored in the model), and examples (`props: { value: params.value ?? '' }`)
taught reading params inside the hook.

## Decision

- Params are applied once, at creation. Plain value = initial value (on top of the `def.props` default);
  binding = live channel; `$events` (refreshed on every commit), `$id`, `$key` = service keys, never stored
  in the model. A hook-constructor never reads `params.x`.
- Live input inside dynstruct goes through bindings (`bindProp` / `bind`) from the model.
- React boundary: `toReact` props and JSX props of factory children are kept in a per-instance observable
  map refreshed after each commit and exposed as read-only bindings (`toReact`) or a live props object
  (factory children). Such a prop is controlled by the React parent while defined; `undefined` falls back to
  the model value (default / component-owned), like React controlled vs uncontrolled inputs. Two-way flow:
  `$events.onChangeX`.
- Function values read through boundary bindings stay under error routing (wrapped, cached per function).
- DEV diagnostics replace the silent behavior: a primitive plain param changed after creation; a write to a
  prop bound read-only; a `toReact` prop first passed after creation.

## Consequences

- Breaking for code that relied on plain params being live inside dynstruct (e.g. `useChild({ open: params.open })`,
  factory child `useCard({ item: p.item })`): use `bindProp(() => m, 'open')` / `bind(() => p.item)`.
- A parent-driven change of a bound prop does not fire the component's `onChangeX` / `onPropChange`
  (consistent with `bindProp`); those fire for changes made by the component.
- A prop absent on the first `toReact` render is not bound later (DEV warning); pass it from the first render
  (`undefined` is fine) or recreate via `$key`.
- No more model writes from params on parent re-renders: fewer child re-renders with inline callbacks. A
  `toReact` View may still render twice when the parent re-renders with new props (once from the props, once from
  the observable map refresh after commit).
- A write to a controlled boundary prop is not stored; `onChangeX` / `onPropChange` still fire. `undefined` from the
  parent is indistinguishable from an omitted prop (both uncontrolled).
- Boundary props are raw references: an object prop is not cloned into an observable, so mutating `m.item.title`
  mutates the parent's object without reactivity - replace the value through the parent instead.
- Boundary props not declared in `def.props` live only in the bindings: `Object.keys(m)` / `toPlain(m)` do not list them.
- Factory child props are read-only; reads during render return the current render's props (no commit lag), and
  observers / effects re-run after the commit.
