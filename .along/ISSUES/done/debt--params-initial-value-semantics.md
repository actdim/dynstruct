---
protocol: along
protocol_version: "4.4.9"
slug: params-initial-value-semantics
type: debt
status: done
completed: 2026-10-11
priority: high
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
tags: [componentModel, params, bindings, docs]
blocked_by: []
related: []
---

# Params semantics: plain = initial value, live input only via bindings; drop params->model sync

## Background

`useComponent` re-applies incoming params to the model after every commit
(`src/componentModel/react/hooks.tsx`, the `useLayoutEffect` "Sync incoming params" loop). It exists
for `toReact`: React re-renders the wrapper with new props while the instance and its model are
created once (test: `tests/react/reactivity-and-props.test.tsx`, "syncs changed props into the
model without render-phase updates").

The sync copies input into state, so a model prop gets two owners (parent via params, component via
`m.x = ...`) with no defined winner - the "derived state from props" anti-pattern. Observed defects:

1. Comparison is against the current model value, not the previous param: any unrelated parent
   re-render resets internal state (typed text lost).
2. Function params are wrapped by `wrapUserCode` at creation, but the sync writes the raw function of
   the current render: after the first re-render an inline callback bypasses `run` / `onCatch` /
   `$ERROR`. New arrow identity every render also means a model write and a child re-render every
   parent render.
3. Creation and update filter params differently: `createModel` copies every param key into the
   model (including `$events`, `$id`, `$key` and keys absent from `def.props`), the sync only
   `def.props` keys; `m.$events` goes stale after `updateEvents`.

Even with a previous-value comparison the model stays wrong: a parent cannot re-send a value it sent
before (reset does not work), identity is compared instead of value, and the update lands one render
late from a layout effect.

Docs reinforce the confusion: the Quick Template in `AGENTS.md` uses
`props: { value: params.value ?? '' }` (redundant at best; with a binding param it stores the Binding
object as the prop default), mirrored in `docs/public/llms-full.txt`.

## Target semantics

- `params` is never read inside a hook-constructor; it is passed whole to `useComponent(def, params)`.
- `def.props` holds defaults only; the framework applies params on top:
  plain value = initial value, binding = live channel, `$events` / `$id` / `$key` = service keys
  (never stored in the model).
- Live input for children comes from `m` via `bindProp` / `bind`.
- React boundary (`toReact`, factory children rendered with JSX props): incoming React props are
  converted to bindings over a per-instance observable box, so props stay live without copying.
- Reset of seeded state: change `$key` (remount).

## Plan (stages)

1. Docs: fix Quick Template, add the params invariant and BAD/GOOD pairs to `AGENTS.md`, regenerate
   `llms-full.txt` / `llms.txt` as applicable.
2. DEV diagnostic: replace the sync write with a DEV warning when a plain param changes after
   creation (compared with the previous param) - used to find call sites relying on live plain params.
3. `toReact` and `ChildViewFC` pass React props as bindings; remove the sync loop; stop copying
   service keys into the model; keep function params wrapped.
4. Tests: plain param change does not overwrite the model; toReact prop stays live; parent can reset
   to a previously sent value; callback errors route to `onCatch` after re-renders; `$events` not in model.
5. ADR for the params semantics change (public contract).

## Acceptance Criteria
- [x] Quick Template and params invariant documented; no `params.x` reads in examples
- [x] DEV warning for plain params changed after creation
- [x] `toReact` / factory children keep React props live via bindings; sync loop removed
- [x] Service keys (`$events`, `$id`, `$key`) not stored in the model
- [x] Regression tests for defects 1-3 and reset-to-previous-value (`tests/react/params-semantics.test.tsx`)
- [x] ADR recorded (`ADR-2026-10-11--params-initial-value-semantics`)
- [x] Automated tests passing (node 6, react 65; typecheck, build). Lint not run: `eslint.config.mjs` is broken in HEAD (separate task).

## Outcome
- Review (subagent) findings fixed here: DEV check compares a value snapshot (factory children passing the same
  live props object), boundary reads return the current render's props (no commit lag for fragments / factory
  children), a write to a controlled boundary prop is not stored but fires `onChangeX`, factory child props are
  read-only.
- Consumer finding for the webapp: `PublicationsView.tsx` passes factory props whole
  (`usePublicationCardItem(cardParams)`) - to be fixed in the root issue.

## Related
- Root issue `debt--webapp-params-semantics-and-lint` (consumer migration + lint), blocked by this one.
