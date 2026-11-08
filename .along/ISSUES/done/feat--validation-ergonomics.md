---
protocol: along
protocol_version: "4.6.1"
slug: validation-ergonomics
type: feat
status: done
completed: 2026-11-08
priority: medium
created: 2026-11-08
updated: 2026-11-08
agent: claude
tags: [validation, forms]
blocked_by: []
related: []
plan_status: approved
---

# Validation ergonomics: result, context, reset, server errors, touched, lazy messages, bindField

## Problem

The core already has field validation (`prop({ validator })`, `c.validate(path?)`, `m.$.propState`, `c.mapToEdit`), but no consumer app uses it: Mempart `webapp` validates every dialog by hand (`if (!m.name.trim()) m.errorMessage = ...`). The reason is not the UI kit alone; the core API is inconvenient for real forms:

- `validate()` in `src/componentModel/core.tsx` returns `Promise<void>`: callers scan `m.$.propState` themselves to learn whether the form is valid.
- `Validator.validate(value)` (`src/componentModel/contracts.ts`) sees only its own value: no cross-field rules ("`vfsPath` is required when `contentType === 'mixed'`", "passwords match").
- No public way to clear results (a reopened dialog keeps old errors) or to put external results into `propState` (server 400/422 such as "slug already taken"); `mergeResults` is internal.
- `prop()` defaults `validator.onChange` to `true` and there is no `touched` state, so an error appears on the first keystroke.
- `ValidationResult.message` is a plain string captured at validation time: it stays in the old language after a locale switch.
- `Validator.onSubmit` is declared but never read.
- `mapToEdit` returns DOM event handlers (`ChangeEvent`/`FocusEvent`) and cannot feed dynstruct UI-kit children (`@actdim/dynstruct-mui` `useTextField` takes `onChange(value: string)`); there is no binding-shaped helper. Note: a helper taking `c` directly (`bindField(c, 'name')`) cannot work inside `def.children` because `c` is still `undefined` there - it must take a lazy getter.

Field-change validation already works through bindings (the model setter calls `validate`), so a child writing through `bindProp(() => m, 'name')` triggers it today; what is missing is the API above.

Consumers: `@actdim/dynstruct-mui` (`feat--field-validation-binding` in its repo) and Mempart webapp (`task--forms-dynstruct-validation` in the Mempart root).

## Requirements
- REQ-1: `Validator.validate` MUST receive a second argument `ctx` with `{ model, path, component }`; existing one-argument validators MUST keep working unchanged.
- REQ-2: `c.validate(path?)` MUST resolve to `boolean` (`true` when every evaluated result is valid).
- REQ-3: The component MUST expose `c.setValidation(results)` that merges `Partial<Record<path, ValidationResult>>` into `m.$.propState` (for server-side errors), and `c.resetValidation(path?)` that clears results and touched state for one path or the whole component.
- REQ-4: `ComponentPropState` MUST carry `touched` (set by `c.touch(path)`, by blur through `mapToEdit`/`bindField`, and by a full `c.validate()`) and a computed `visibleError` (`error` only when `touched`). `error` MUST keep its current meaning so existing consumers do not change behavior.
- REQ-5: `ValidationResult.message` MUST accept `string | (() => string)`; the `error` getter MUST resolve a function lazily so a reactive translation source (ui-core `t()` tracks `trackI18n`, or any `fromExternalStore` reader) re-renders the message on locale change.
- REQ-6: `prop({ validator: { onSubmit: true } })` without an explicit `onChange` MUST NOT default `onChange` to `true`; a full `c.validate()` MUST run it; field triggers MUST NOT.
- REQ-7: `@actdim/dynstruct/componentModel/core` MUST export `bindField(getComponent, path, options?)` returning UI-kit-agnostic params `{ value, error, helperText, onBlur }`: bindings for the first three (`helperText` falls back to `options.hint` when there is no visible error), a plain `onBlur` that calls `c.touch(path)`.
- REQ-8: `m.$.isValid` MUST reflect the stored results (today it is initialized to `true` and never updated).
- REQ-9: An older async result for a path MUST NOT overwrite a newer one (per-path sequence); a throwing validator MUST be routed to `onCatch` without leaving an unhandled rejection.
- REQ-10: A result stored by `setValidation` MUST be cleared when that path's value changes, so a server error ("slug taken") disappears once the user edits the field.
- REQ-11: The `componentState` story MUST demonstrate the new API (cross-field rule, server error via `setValidation`, reset on reopen), and `AGENTS.md` / docs MUST describe the validation workflow.

## Acceptance Criteria
- [x] REQ-1..REQ-10 covered by tests (`tests/react/validation-and-forms.test.tsx` and a new `tests/react/validation-ergonomics.test.tsx`: 13 tests)
- [x] Existing validation tests pass without edits (the change is additive)
- [x] `componentState` story updated (REQ-11); checked in the browser via `pnpm run storybook`
- [x] `CHANGELOG.md` entry
- [x] Detailed plan: `plans/01--validation-ergonomics.md` in this issue's folder
- [x] `AGENTS.md` validation section and the relevant `docs/topic--*.md` updated
- [x] `pnpm run typecheck`, `pnpm run test`, `pnpm run lint`, `pnpm run build` green (lint: 0 errors, no new warnings)
- [x] Released only through the monorepo-wide `pnpm run version:sync` in Mempart (no isolated bump): no version change made here; the release itself is pending with the chain
