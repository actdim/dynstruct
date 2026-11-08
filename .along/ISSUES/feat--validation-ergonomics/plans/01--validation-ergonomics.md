# Execution plan: feat--validation-ergonomics (validation chain step 1 of 3)
Issue: `feat--validation-ergonomics` in dynstruct (`.along/ISSUES/`). Spec = issue file; this plan = order and exact
actions; where they differ this plan wins.

Chain: 1) this issue -> 2) dynstruct-mui `feat--field-validation-binding` -> release (monorepo-wide
`pnpm run version:sync`) -> 3) Mempart `task--forms-dynstruct-validation`.

Execution Mode: Role-Based (core engine change in `src/componentModel/core.tsx`, more than 3 files: contracts, core,
hooks, tests, story, docs). Roles: Implementer (steps 1-7), Reviewer (diff review against the REQ list and the
compatibility rules below), Tester (step 8).

## State checked in code (2026-11-08)
- `Validator<T>` (`src/componentModel/contracts.ts:206`): `{ onBlur?, onChange?, onSubmit?, validate(value) }`.
  `onSubmit` is never read.
- `ValidationResult` (`contracts.ts:201`): `{ isValid; message?: string }`. The `componentState` story validator returns
  `undefined` for a valid value; `mergeResults` already maps a falsy result to `{ isValid: true }`, but the type does not
  allow `undefined`.
- `ComponentPropState` (`contracts.ts:498`): `{ validation?, error? }`, created lazily in `mergeResults`
  (`core.tsx:230`) as an `observable` with an `error` getter.
- `ComponentState.isValid` (`contracts.ts:514`) is initialized to `true` in `createModel` (`core.tsx:400`) and never
  written by the framework; nobody in the monorepo reads or writes it (grep 2026-11-08: only a commented line in
  `_stories/componentModel/EffectDemo.tsx`).
- `validate()` (`core.tsx:215`) returns `Promise<void>`; `Component.validate` (`contracts.ts:489`) is typed
  `MaybePromise<void>`; wired in `react/hooks.tsx:596`.
- Field-change trigger: the model proxy setters call `validate(...)` without `await` when `validator.onChange` is set
  (`core.tsx:757` nested paths, `core.tsx:850` top-level). A throwing async validator becomes an unhandled rejection;
  two quick keystrokes can resolve out of order.
- `prop()` (`core.tsx:197`) defaults `validator.onChange = true` unless `onChange` is given.
- `mapToEdit` (`core.tsx:295`) onBlur calls `validate(...)` when `validator.onBlur` is set.
- Tests: `tests/react/validation-and-forms.test.tsx` (5 cases: path validate, mapToEdit blur, validate without
  onValidate, onValidate handlers, onChange trigger).
- Docs mention validation in `docs/topic--02-core-concepts.md` (~L419), `topic--04-react-integration.md` (~L102),
  `topic--05-api-reference.md` (~L92, L222, L232), `topic--domain-model.md` (~L76, claims "dirty flags" that do not
  exist yet). `AGENTS.md` has no validation section (only the story list line).

## Compatibility rules (binding)
- Additive only: `error` keeps its meaning (message of the last invalid result, regardless of touched). New consumers use
  `visibleError`. Existing tests pass unchanged.
- `c.validate()` return type widens from `MaybePromise<void>` to `Promise<boolean>`: source-compatible for callers.
- One-argument validators keep working (`ctx` is an extra argument).
- The only intended behavior change: `prop({ validator: { onSubmit: true, validate } })` no longer gets `onChange: true`
  by default (REQ-6). Recorded in `CHANGELOG.md`.

## Steps

### 1. Contracts (`src/componentModel/contracts.ts`) [agent]
```ts
export type ValidationMessage = string | (() => string);

export type ValidationResult = {
    isValid: boolean;
    message?: ValidationMessage;
    code?: string;                                   // optional machine code (server errors, i18n keys)
    params?: Readonly<Record<string, string | number>>;
};

export type ValidationTrigger = 'change' | 'blur' | 'submit' | 'manual' | 'external';

export type ValidationContext = {
    readonly path: string;
    readonly trigger: ValidationTrigger;
    readonly model: any;                             // typed access: use the closure `m` in the def
    readonly component: Component<any, any>;
};

export type Validator<T = any> = {
    onBlur?: boolean;
    onChange?: boolean;
    onSubmit?: boolean;
    validate: (value: T, ctx: ValidationContext) => MaybePromise<ValidationResult | undefined>;
};

export type ComponentPropState = {
    readonly validation?: ValidationResult;
    readonly error?: string | undefined;             // unchanged meaning
    readonly visibleError?: string | undefined;      // error when touched
    readonly touched: boolean;
    readonly validating: boolean;                    // an async validator is in flight
};
```
`Component` gains:
```ts
readonly validate: (path?: KeyPath<TStruct['props'], boolean>) => Promise<boolean>;
readonly touch: (path: KeyPath<TStruct['props'], boolean>) => Promise<void>;
readonly setValidation: (results: Partial<Record<KeyPath<TStruct['props'], boolean>, ValidationResult | undefined>>) => void;
readonly resetValidation: (path?: KeyPath<TStruct['props'], boolean>) => void;
```
`ComponentDef.events.onValidate` result type also accepts `undefined` values. `ValidationContext.model` stays `any` on
purpose: `prop<T>()` has no struct parameter; document that typed cross-field rules read the closure `m`, and `ctx` is
for reusable rule factories.

### 2. Core state and validation runner (`src/componentModel/core.tsx`) [agent]
- `ensurePropState(component, path)`: creates the observable record once with `validation: undefined`,
  `touched: false`, `validating: false`, computed `error` (resolves a function message: `typeof m === 'function' ? m() : m`)
  and computed `visibleError` (`touched ? error : undefined`). Replace the inline creation in `mergeResults`.
- Internal per-instance (not reactive) data in a `WeakMap<Component, ...>` next to `_eventsUpdaters`: per-path sequence
  counter, per-path `source: 'validator' | 'external'`.
- `runPathValidator(component, def, params, path, trigger)`:
  1. reads `def.props[path]` validator; returns `true` when none;
  2. increments the path sequence, sets `validating = true`;
  3. `await validator.validate(value, ctx)` inside `component.run(..., true)` so a throw goes to `onCatch`; on throw keep
     the previous result, set `validating = false`, return `false`;
  4. drops the result if a newer sequence started (REQ-9);
  5. stores via `mergeResults` with source `validator`; returns `result?.isValid !== false`.
- `validate(component, def, params, path?)` returns `Promise<boolean>`:
  - with `path`: `runPathValidator(..., 'manual')`;
  - without: marks every path that has a validator or an existing record as touched, runs `$events.onValidate` and
    `def.events.onValidate` (as today) and every prop validator with trigger `submit` (including `onSubmit`-only ones);
    returns `true` only if every stored record is valid after the run (records from `onValidate` and `setValidation`
    count).
- Field triggers in the two proxy setters (`core.tsx:757`, `:850`): before calling the validator, clear an `external`
  record for that path (REQ-10); call `runPathValidator(..., 'change')` and attach `.catch(() => {})`-free handling (the
  runner never rejects).
- `touch(path)`: sets `touched = true`; if `validator.onBlur` is set runs `runPathValidator(..., 'blur')`; else if the
  path has no result yet and `validator.onChange` is set runs it once so a blur on an untouched, never-edited required
  field shows its error.
- `setValidation(results)`: `mergeResults` with source `external`, `touched = true` for each path.
- `resetValidation(path?)`: bumps the sequence (drops in-flight results), clears `validation`, `touched`, `validating`
  for one path or all records.
- `isValid` (REQ-8): after every `mergeResults` / reset, set `component.model.$.isValid` to "no record invalid" inside
  `runInAction`. Keep the field writable (contract unchanged).
- `prop()` default (REQ-6): `onChange` defaults to `true` only when neither `onChange` nor `onSubmit` is specified.
- `mapToEdit` onBlur: call `touch(path)` instead of the direct `validate` (same effect plus touched).

### 3. Wiring (`src/componentModel/react/hooks.tsx`) [agent]
Add `touch`, `setValidation`, `resetValidation` next to `validate` / `mapToEdit` in the component object (~L596).

### 4. `bindField` (`src/componentModel/core.tsx`, exported) [agent]
```ts
export type FieldBindingOptions = { hint?: () => string | undefined };

export function bindField<TStruct extends ComponentStruct<any>, P extends KeyPath<TStruct['props'], boolean>>(
    getComponent: () => Component<TStruct, any>,
    path: P,
    options?: FieldBindingOptions,
): {
    value: Binding<KeyPathValue<TStruct['props'], P>>;
    error: Binding<boolean>;
    helperText: Binding<string | undefined>;
    onBlur: () => void;
};
```
- `value`: `bindProp(() => getComponent().model, path)`.
- `error`: `bind(() => Boolean(state()?.visibleError))`; `helperText`: `bind(() => state()?.visibleError ?? options?.hint?.())`
  where `state = () => getComponent().model.$.propState[path]`.
- `onBlur`: `() => void getComponent().touch(path)`.
- Lazy getter is mandatory: `c` is `undefined` while `def.children` is built (Anti-pattern 1). JSDoc says so.
- Use the existing key-path value type helper from `contracts.ts` / util (check the name used by `bindProp`).

### 5. Story (`src/_stories/componentModel/componentState/StateExample.tsx`) [agent]
Add a "Validation" section: two fields with `prop({ validator })` rendered through `mapToEdit` + `visibleError`,
a cross-field rule (confirm email equals email, using closure `m`), a lazy message `() => ...`, a button "Simulate server
error" -> `c.setValidation({ 'userInfo.email': { isValid: false, message: 'Email already registered' } })`, a "Reset"
button -> `c.resetValidation()`, a "Submit" button showing the `boolean` from `await c.validate()`. Keep the existing
sections untouched.

### 6. Docs [agent]
- `AGENTS.md`: new section "Forms and Validation" after "State and Reactivity Rules": declaring rules, triggers table
  (change/blur/submit/manual/external), `touched` / `visibleError`, `validate()` boolean, `setValidation` for server
  errors (clears on edit), `resetValidation` on dialog open, `bindField(() => c, path, { hint })` for UI-kit children,
  lazy messages for i18n. Update the story list line.
- `docs/topic--02-core-concepts.md`, `topic--04-react-integration.md`, `topic--05-api-reference.md`: same API.
- `docs/topic--domain-model.md`: replace "dirty flags" with the real `touched` / `validating` fields.
- `CHANGELOG.md`: Added (API list), Changed (`onSubmit` default, `$.isValid` now maintained).
- Run `/along-kb-sync` for `docs/INDEX.md` if headings changed.

### 7. Tests (`tests/react/validation-ergonomics.test.tsx`, new) [agent]
One case per item, using the harness style of `validation-and-forms.test.tsx`:
1. validator receives `ctx` with `path`, `trigger`, `model`; cross-field rule reads another prop;
2. `await c.validate()` -> `false` with one invalid field, `true` after fixing it;
3. `visibleError` empty after an onChange-invalid edit, set after `c.touch(path)`; `error` set in both;
4. `c.touch` on a never-edited required field shows the error;
5. `setValidation` sets `visibleError`; editing the field clears it; the next `validate()` does not resurrect it;
6. `resetValidation()` clears all; `resetValidation(path)` clears one;
7. lazy message: an observable source switched -> `error` text changes without revalidation;
8. `onSubmit`-only validator: not run on change or touch, run by `validate()`;
9. `$.isValid` follows results and reset;
10. out-of-order async: first call resolves after the second -> stored result is the second;
11. throwing validator -> `onCatch` called, no unhandled rejection (vitest fails on unhandled rejections), previous
    result kept;
12. `bindField`: spread into a minimal dynstruct child with `value/error/helperText/onBlur` props; child blur shows the
    error, `hint` shown when valid;
13. `validator` returning `undefined` counts as valid.

### 8. Verification [agent]
`/along-test` (vitest), then `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` in `src/packages/dynstruct`.
Storybook check of the new story section in the browser pane (blur, submit, server error, reset) with a screenshot.
`git diff --stat` review; `along graph-impact` for blast radius (consumers of `validate` / `ComponentPropState`).

### 9. Commit and wrap [agent after yes]
`/along-commit` bound to `feat--validation-ergonomics`; push only after the user's yes. No version bump here (unified
versioning: release goes through Mempart `pnpm run version:sync` after step 2 of the chain).
`along wrap validation-ergonomics --summary "..." --no-decisions` unless the Reviewer asks for an ADR on the
`visibleError` vs gated `error` choice.

## Out of scope
- Schema validators (zod/valibot adapters), async debounce options, array-item validation: separate issues if needed.
- Changing the meaning of `error` (rejected: breaks existing consumers).
