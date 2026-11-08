# Execution plan: feat--validation-ergonomics (validation chain step 1 of 3)
Issue: `feat--validation-ergonomics` in dynstruct (`src/packages/dynstruct/.along/ISSUES/`). Spec = issue file; this
plan = order and exact actions; where they differ this plan wins.

Chain: 1) this issue -> 2) dynstruct-mui `feat--field-validation-binding` -> release (monorepo-wide
`pnpm run version:sync`) -> 3) Mempart `task--forms-dynstruct-validation`.

Execution Mode: Role-Based (core engine change, more than 3 files). Roles: Implementer (steps 1-7), Reviewer (step 9:
diff against the REQ list and the compatibility rules), Tester (step 8).

This plan is written to be executed without design decisions. Every open point was checked in code on 2026-11-08 and
the answer is written here. If reality differs from a "State" line below, apply the Stop rules.

## Stop rules (binding)
Stop, do not improvise, and report to the user with the exact output when:
- S1. A line under "State checked in code" no longer matches the file (renamed function, moved code, different shape).
- S2. An existing test in `tests/react/validation-and-forms.test.tsx` fails after your change. Never edit that file.
- S3. A type error needs `as any`, `@ts-ignore` or `@ts-expect-error` to pass.
- S4. `pnpm run test`, `typecheck`, `lint` or `build` is red at HEAD before you change anything (record the output; it
  is not yours to fix).
- S5. You want to change anything not listed in "Files to change".

## Commands (run from `src/packages/dynstruct`, never from inside `src/app-core`)
| Purpose | Command |
|---|---|
| all tests | `pnpm run test` (node + react configs) |
| react tests only | `pnpm run test:react` |
| one file | `npx vitest --config=vitest.react.config.ts --no-cache tests/react/validation-ergonomics.test.tsx` |
| types | `pnpm run typecheck` (`tsc -b tsconfig.json`) |
| lint | `pnpm run lint` |
| build (also produces `dist/` that dynstruct-mui and webapp consume) | `pnpm run build` |
| Storybook | `pnpm run storybook` (port 6006; long-running: start it in the background), story `dynstruct/Basics` -> `ComponentStateStory`, direct URL `http://localhost:6006/?path=/story/dynstruct-basics--component-state-story`. No agent-vendor config (ADR `no-agent-vendor-dev-tooling`). |

Step 0: run tests, typecheck, lint, build once before editing (S4).

## Files to change
- `src/componentModel/contracts.ts`
- `src/componentModel/core.tsx`
- `src/componentModel/react/hooks.tsx`
- `tests/react/validation-ergonomics.test.tsx` (new)
- `src/_stories/componentModel/componentState/StateExample.tsx`
- `AGENTS.md`, `docs/topic--02-core-concepts.md`, `docs/topic--04-react-integration.md`,
  `docs/topic--05-api-reference.md`, `docs/topic--domain-model.md`, `CHANGELOG.md`

## State checked in code (2026-11-08)
- `contracts.ts:201` `ValidationResult = { isValid: boolean; message?: string }`.
- `contracts.ts:206` `Validator<T = any> = { onBlur?; onChange?; onSubmit?; validate: (value: T) => MaybePromise<ValidationResult> }`.
- `contracts.ts:315` `onValidate?: (component) => MaybePromise<Partial<Record<KeyPath<...>, ValidationResult>>>`.
- `contracts.ts:489` `readonly validate: (path?) => MaybePromise<void>;` and `:490` `mapToEdit`.
- `contracts.ts:498` `ComponentPropState = { readonly validation?: ValidationResult; readonly error?: string | undefined }`.
- `contracts.ts:509-519` `ComponentState` has writable `isValid: boolean` and `readonly propState: Record<...>`.
- `core.tsx` imports already include `runInAction`, `observable`, `isComponentProp`, `getByKeyPath`, `KeyPathValue`,
  `Mutable`.
- `core.tsx:124` `bind(get, set?, converter?)` returns untyped `Binding`; `core.tsx:138` `bindProp(target, path)`
  returns untyped `Binding`.
- `core.tsx:197` `prop()` sets `validator.onChange = true` unless `onChange` is an own property.
- `core.tsx:215-293` `validate(component, def, params, path?)`: inner `mergeResults` creates records as
  `observable({ validation, get error() {...} })` and assigns `propState[path] = record` in `runInAction`. Order for a
  full run: `params.$events.onValidate`, then `def.events.onValidate`, then every prop validator. Keep this order.
- `core.tsx:295-339` `mapToEdit`; its `onBlur` calls `validate(...)` when `validator.onBlur`.
- `core.tsx:398-407` `createModel` creates `state` with `isValid: true`, `propState: {}`.
- `core.tsx:756-763` (nested proxy setter) and `core.tsx:849-857` (top-level setter): after `onPropChange`, call
  `validate(component, def, params, path)` without await when `prop.validator.onChange`.
- `react/hooks.tsx:273` `run(handler, silent = false)`: sync throw and async rejection both go to `onCatch` once, then
  rethrow unless `silent`. `react/hooks.tsx:596-601` component object has `validate` and `mapToEdit`.
- `tests/react/validation-and-forms.test.tsx`: 5 tests; one asserts `propState['username']` is `undefined` before any
  change, so records must stay lazy (created on first use, never in `createModel`).
- `$.isValid` is not read or written anywhere in the monorepo (grep 2026-11-08).

## Compatibility rules (binding)
- `error` keeps its meaning (message of the stored invalid result, regardless of touched). `visibleError` is new.
- Records are created lazily, as today.
- One-argument validators keep working; returning `undefined` means valid (already true at runtime, now typed).
- `validate()` return type widens to `Promise<boolean>`.
- Only intended behavior change: `prop({ validator: { onSubmit: true, validate } })` without `onChange` no longer gets
  `onChange: true`. `CHANGELOG.md` says so.

## Steps

### 1. Contracts (`src/componentModel/contracts.ts`) [agent]
Replace `ValidationResult`, `Validator`, `ComponentPropState` and extend `Component` exactly as follows (keep
surrounding code and comments):
```ts
/** A message, or a function evaluated on read (reactive: a translation call re-runs on locale change). */
export type ValidationMessage = string | (() => string);

export type ValidationResult = {
    isValid: boolean;
    message?: ValidationMessage;
    /** Optional machine code, e.g. a server error code. */
    code?: string;
    params?: Readonly<Record<string, string | number>>;
};

export type ValidationTrigger = 'change' | 'blur' | 'submit' | 'manual';

export type ValidationContext = {
    readonly path: string;
    readonly trigger: ValidationTrigger;
    /** Untyped model access for reusable rule factories; inside a def use the typed closure `m`. */
    readonly model: Readonly<Record<string, unknown>>;
    readonly component: Component<any, any>;
};

export type Validator<T = any> = {
    onBlur?: boolean;
    onChange?: boolean;
    onSubmit?: boolean;
    validate: (value: T, ctx: ValidationContext) => MaybePromise<ValidationResult | undefined>;
};
```
`onValidate` (`:315`): change the record value type to `ValidationResult | undefined`.
```ts
export type ComponentPropState = {
    readonly validation?: ValidationResult;
    /** Message of the stored invalid result (resolved if it is a function). */
    readonly error?: string | undefined;
    /** `error` once the field is touched (blur, `touch`, full `validate`, `setValidation`). */
    readonly visibleError?: string | undefined;
    readonly touched: boolean;
    /** A validator run for this path is in flight. */
    readonly validating: boolean;
};
```
In `Component` replace the `validate` line and add three members after it:
```ts
readonly validate: (path?: KeyPath<TStruct["props"], boolean>) => Promise<boolean>;
readonly touch: (path: KeyPath<TStruct["props"], boolean>) => Promise<void>;
readonly setValidation: (results: Partial<Record<KeyPath<TStruct["props"], boolean>, ValidationResult | undefined>>) => void;
readonly resetValidation: (path?: KeyPath<TStruct["props"], boolean>) => void;
```
Export the new types from wherever `ValidationResult` is exported today (check `src/index.ts` or the package entry; if
contracts are exported by path only, nothing to add).

### 2. Core (`src/componentModel/core.tsx`) [agent]
Add above `validate` (replacing the inner `mergeResults`). Use these bodies; adjust only imports and generic noise.
```ts
type PropStateRecord = Mutable<ComponentPropState>;
type ValidationSource = 'validator' | 'external';
type ValidationInternals = { seq: Map<string, number>; source: Map<string, ValidationSource> };

// Per-instance, non-reactive bookkeeping (sequence numbers drop stale async results; source marks server errors).
const _validationInternals = new WeakMap<object, ValidationInternals>();

function getValidationInternals(component: object): ValidationInternals {
    let data = _validationInternals.get(component);
    if (!data) {
        data = { seq: new Map(), source: new Map() };
        _validationInternals.set(component, data);
    }
    return data;
}

function nextSeq(data: ValidationInternals, path: string): number {
    const seq = (data.seq.get(path) ?? 0) + 1;
    data.seq.set(path, seq);
    return seq;
}

function getPropStates(component: Component<any, any>): Record<string, PropStateRecord> {
    return component.model.$.propState as Record<string, PropStateRecord>;
}

function ensurePropState(component: Component<any, any>, path: string): PropStateRecord {
    const propState = getPropStates(component);
    let record = propState[path];
    if (!record) {
        const created: PropStateRecord = observable({
            validation: undefined as ValidationResult | undefined,
            touched: false,
            validating: false,
            get error() {
                const v = (this as ComponentPropState).validation;
                if (!v || v.isValid) {
                    return undefined;
                }
                return typeof v.message === 'function' ? v.message() : v.message;
            },
            get visibleError() {
                const self = this as ComponentPropState;
                return self.touched ? self.error : undefined;
            },
        });
        runInAction(() => {
            propState[path] = created;
        });
        record = created;
    }
    return record;
}

function refreshIsValid(component: Component<any, any>): void {
    const records = Object.values(getPropStates(component));
    runInAction(() => {
        component.model.$.isValid = records.every((r) => r.validation?.isValid !== false);
    });
}

function storeResult(
    component: Component<any, any>,
    path: string,
    result: ValidationResult | undefined,
    source: ValidationSource,
    touch: boolean,
): void {
    const record = ensurePropState(component, path);
    getValidationInternals(component).source.set(path, source);
    runInAction(() => {
        record.validation = result ?? { isValid: true };
        if (touch) {
            record.touched = true;
        }
    });
    refreshIsValid(component);
}

async function runPathValidator(
    component: Component<any, any>,
    def: ComponentDef<any, any>,
    path: string,
    trigger: ValidationTrigger,
): Promise<boolean> {
    const prop = def.props?.[path];
    if (!isComponentProp(prop) || !prop.validator?.validate) {
        return true;
    }
    const validator = prop.validator;
    const data = getValidationInternals(component);
    const seq = nextSeq(data, path);
    const record = ensurePropState(component, path);
    runInAction(() => {
        record.validating = true;
    });
    const ctx: ValidationContext = {
        path,
        trigger,
        model: component.model as Readonly<Record<string, unknown>>,
        component,
    };
    let result: ValidationResult | undefined;
    try {
        // run(): a throw or rejection is reported to onCatch once and rethrown (silent = false); caught below.
        result = await component.run(
            () => Promise.resolve(validator.validate(getByKeyPath(component.model, path), ctx)),
            false,
        );
    } catch {
        if (data.seq.get(path) === seq) {
            runInAction(() => {
                record.validating = false;
            });
        }
        return record.validation?.isValid !== false;
    }
    if (data.seq.get(path) !== seq) {
        // A newer run (or a reset / setValidation) started meanwhile: drop this result.
        return result?.isValid !== false;
    }
    storeResult(component, path, result, 'validator', false);
    runInAction(() => {
        record.validating = false;
    });
    return result?.isValid !== false;
}

/** Field edit hook: clears a server (external) result for the path and runs an onChange validator. */
function onFieldChanged(component: Component<any, any>, def: ComponentDef<any, any>, path: string): void {
    const data = getValidationInternals(component);
    if (data.source.get(path) === 'external') {
        data.source.delete(path);
        const record = getPropStates(component)[path];
        if (record) {
            runInAction(() => {
                record.validation = undefined;
            });
            refreshIsValid(component);
        }
    }
    const prop = def.props?.[path];
    if (isComponentProp(prop) && prop.validator?.onChange) {
        void runPathValidator(component, def, path, 'change');
    }
}
```
Rewrite `validate` (keep its exported name and parameters, change the return type):
```ts
export async function validate<...same generics...>(component, def, params?, path?): Promise<boolean> {
    if (path) {
        return runPathValidator(component, def, path, 'manual');
    }
    const handlers = [params?.$events?.onValidate, def.events?.onValidate];
    for (const handler of handlers) {
        if (handler) {
            const results = (await Promise.resolve(handler(component))) ?? {};
            for (const [key, val] of Object.entries(results)) {
                storeResult(component, key, val as ValidationResult | undefined, 'validator', true);
            }
        }
    }
    if (def.props) {
        for (const [key, prop] of Object.entries(def.props)) {
            if (isComponentProp(prop) && prop.validator?.validate) {
                await runPathValidator(component, def, key, 'submit');
                runInAction(() => {
                    ensurePropState(component, key).touched = true;
                });
            }
        }
    }
    refreshIsValid(component);
    return Object.values(getPropStates(component)).every((r) => r.validation?.isValid !== false);
}
```
Add exported functions next to it:
```ts
export async function touch(component, def, path: string): Promise<void> {
    const record = ensurePropState(component, path);
    runInAction(() => {
        record.touched = true;
    });
    const prop = def.props?.[path];
    if (!isComponentProp(prop) || !prop.validator?.validate) {
        return;
    }
    // onBlur rules run on every blur; an onChange rule runs once if the field was never validated
    // (blur on an untouched empty required field must show its error).
    if (prop.validator.onBlur || (prop.validator.onChange && !record.validation)) {
        await runPathValidator(component, def, path, 'blur');
    }
}

export function setValidation(component, results: Record<string, ValidationResult | undefined>): void {
    const data = getValidationInternals(component);
    for (const [key, val] of Object.entries(results)) {
        nextSeq(data, key); // an in-flight validator must not overwrite the server result
        storeResult(component, key, val, 'external', true);
    }
}

export function resetValidation(component, path?: string): void {
    const data = getValidationInternals(component);
    const propState = getPropStates(component);
    const keys = path ? [path] : Object.keys(propState);
    runInAction(() => {
        for (const key of keys) {
            nextSeq(data, key);
            data.source.delete(key);
            const record = propState[key];
            if (record) {
                record.validation = undefined;
                record.touched = false;
                record.validating = false;
            }
        }
    });
    refreshIsValid(component);
}
```
Type the `component` / `def` parameters of `touch`, `setValidation`, `resetValidation` the same way `validate` is typed
(generics `TStruct`, `TMsgHeaders`), or as `Component<any, any>` / `ComponentDef<any, any>` like the helpers above.

Other edits in `core.tsx`:
- `prop()` (`:202-206`): default only when neither flag is given:
  ```ts
  if (prop.validator) {
      const own = Object.prototype.hasOwnProperty.call(prop.validator, 'onChange' satisfies keyof Validator);
      if (!own && !prop.validator.onSubmit) {
          prop.validator.onChange = true;
      }
  }
  ```
- `mapToEdit` onBlur (`:317-325`): body becomes `void touch(component, def, path);` (drop the `onBlur` check, `touch`
  does it).
- Both setters (`:756-763`, `:849-857`): replace the `if (isComponentProp(prop) && prop.validator && prop.validator.onChange) { validate(...) }`
  block with `onFieldChanged(component, def, fullPath)` (nested) / `onFieldChanged(component, def, key as string)`
  (top-level). Keep `const prop = ...` only if still used; otherwise remove that line.
- `bindField` (export, place after `bindProp`):
  ```ts
  export type FieldBindingOptions = {
      /** Helper text shown while there is no visible error. */
      hint?: () => string | undefined;
  };

  export type FieldBinding = {
      value: Binding;
      error: Binding;
      helperText: Binding;
      onBlur: () => void;
  };

  /**
   * Params for a UI-kit field child: value, error flag, helper text and blur handler of one model path.
   * Pass a lazy getter: `bindField(() => c, 'name')` - `c` is undefined while `def.children` is built.
   */
  export function bindField<TStruct extends ComponentStruct<any>, P extends KeyPath<TStruct['props'], boolean>>(
      getComponent: () => Component<TStruct, any>,
      path: P,
      options?: FieldBindingOptions,
  ): FieldBinding {
      const state = (): ComponentPropState | undefined =>
          getComponent().model.$.propState[path] as ComponentPropState | undefined;
      return {
          value: bindProp(() => getComponent().model as TStruct['props'], path),
          error: bind(() => Boolean(state()?.touched && state()?.validation?.isValid === false)),
          helperText: bind(() => state()?.visibleError ?? options?.hint?.()),
          onBlur: () => {
              void getComponent().touch(path);
          },
      };
  }
  ```
  `error` is based on `isValid`, not on the message, so a result without a message still marks the field.

### 3. Wiring (`src/componentModel/react/hooks.tsx`) [agent]
Import `touch`, `setValidation`, `resetValidation` from `../core` (same import as `validate`) and add after `validate`
in the component object (`:596`):
```ts
touch: (path) => touch(component, def, path),
setValidation: (results) => setValidation(component, results),
resetValidation: (path) => resetValidation(component, path),
```
If the names clash with locals in `hooks.tsx`, import them with aliases (`touch as touchProp`).

### 4. Tests (`tests/react/validation-ergonomics.test.tsx`, new) [agent]
Harness: copy imports and the `wrap()` helper from `validation-and-forms.test.tsx` (lines 1-26), add `bindField` to
the `@/componentModel/core` import. One component per test is fine. Complete example of the style (test 2):
```tsx
it('validate() resolves false while a field is invalid and true after fixing it', async () => {
    type S = ComponentStruct<TestMsgStruct, { props: { name: string } }>;
    let comp!: Component<S>;
    const useComp = (params?: ComponentParams<S>) => {
        const def: ComponentDef<S> = {
            regType: 'ValidateResultComp',
            props: {
                name: prop({
                    initialValue: '',
                    validator: { validate: (v: string) => (v ? undefined : { isValid: false, message: 'Required' }) },
                }),
            },
            view: () => <span />,
        };
        comp = useComponent(def, params);
        return comp;
    };
    const View = toReact(useComp);
    wrap(<View />);

    let ok = true;
    await act(async () => {
        ok = await comp.validate();
    });
    expect(ok).toBe(false);
    expect(comp.model.$.propState['name']?.visibleError).toBe('Required');
    expect(comp.model.$.isValid).toBe(false);

    await act(async () => {
        comp.model.name = 'Ann';
        ok = await comp.validate();
    });
    expect(ok).toBe(true);
    expect(comp.model.$.isValid).toBe(true);
});
```
Tests to write (name -> what to assert):
1. `passes ctx to validators` -> a `confirm` validator using `ctx.model.email` and `ctx.path === 'confirm'`,
   `ctx.trigger === 'manual'` for `comp.validate('confirm')`.
2. the example above.
3. `visibleError waits for touch` -> set an invalid value (onChange default) -> `error` set, `visibleError` undefined;
   `await comp.touch('name')` -> `visibleError` set.
4. `touch shows the error of a never-edited required field` -> no edit, `await comp.touch('name')` -> `visibleError`.
5. `setValidation shows a server error and an edit clears it` -> `comp.setValidation({ name: { isValid: false, message: 'Taken' } })`
   -> `visibleError === 'Taken'`; `comp.model.name = 'x'` -> `validation` is not the server one
   (`propState.name.validation?.message !== 'Taken'`).
6. `resetValidation clears one or all` -> two invalid touched fields; `resetValidation('a')` -> `a` clean, `b` still
   invalid; `resetValidation()` -> both clean, `isValid === true`.
7. `function message is resolved on read` -> message `() => texts.current` where `texts` is an object you mutate
   between reads; assert `error` before and after (no reactivity claim needed here; reactivity is covered by MobX).
8. `onSubmit-only validator runs only on validate()` -> spy validator; set value, `touch` -> not called;
   `validate()` -> called once.
9. `$.isValid follows results` -> covered by tests 2 and 6; add one assert after `setValidation`.
10. `stale async result is dropped` -> validator awaits a per-call deferred; trigger change twice
    (`'a'`, then `'ab'`); resolve the second (valid) first, then the first (invalid); final `validation.isValid === true`.
11. `throwing validator goes to onCatch` -> `events.onCatch: vi.fn()`; validator throws; `await comp.validate('name')`
    resolves (no rejection), `onCatch` called once.
12. `bindField drives a field child` -> a minimal child struct
    `{ props: { value: string; error: boolean; helperText?: string; onBlur?: () => void } }` whose view renders
    `<input data-testid="f" value={m.value} onChange={(e) => { m.value = e.target.value; }} onBlur={() => m.onBlur?.()} />`
    and `<span data-testid="h">{m.helperText}</span>`; parent declares it as
    `field: useChild({ ...bindField(() => c, 'name', { hint: () => 'Hint' }) })`; assert `h` shows `Hint`,
    `fireEvent.blur(f)` with empty value -> `h` shows `Required`, typing a value -> `Hint` again.
13. `undefined result is valid` -> validator returns `undefined` -> `validation.isValid === true`.
Run the file, then `pnpm run test`.

### 5. Story (`src/_stories/componentModel/componentState/StateExample.tsx`) [agent]
Add props `confirmEmail` (validator: equals closure `m.userInfo.email`, message `() => 'Emails do not match'`), a new
`React.FC` child `section3` titled "Validation API" (same `<details>` style as `section1`) with: confirm input via
`c.mapToEdit('confirmEmail')`, error text from `m.$.propState['confirmEmail']?.visibleError`, and three buttons:
"Submit" (shows `Valid` / `Invalid` from `await c.validate()` in a private prop), "Simulate server error"
(`c.setValidation({ 'userInfo.email': { isValid: false, message: 'Email already registered' } })`), "Reset"
(`c.resetValidation()`). Render it after `section1` in `view`. Change `section1` to show `visibleError` instead of
`error`. Do not touch other sections.

### 6. Docs [agent]
- `AGENTS.md`: add section `## Forms and Validation` after "State and Reactivity Rules" with: a `prop({ validator })`
  example; trigger table (onChange default / onBlur / onSubmit / manual `c.validate(path)`); `touched` and
  `visibleError` (show `visibleError`, not `error`); `await c.validate()` returns `boolean`; `c.setValidation` for server
  errors (cleared on edit); `c.resetValidation()` when a dialog opens; `bindField(() => c, 'path', { hint })` for UI-kit
  children (lazy getter, never `bindField(c, ...)`); cross-field rules read closure `m`; lazy messages for i18n.
  Update the `componentState/` line in "File and Story Conventions".
- `docs/topic--02-core-concepts.md` (~L419), `topic--04-react-integration.md` (~L102), `topic--05-api-reference.md`
  (~L92, L222, L232): document the new members with one example each.
- `docs/topic--domain-model.md` (~L76): replace "dirty flags" with `touched`, `validating`, `visibleError`.
- `CHANGELOG.md`: new "Unreleased" entry: Added (`bindField`, `touch`, `setValidation`, `resetValidation`,
  `visibleError`, `touched`, `validating`, validator `ctx`, function messages, `validate()` returns boolean); Changed
  (`onSubmit`-only validators no longer get `onChange`; `$.isValid` is maintained).
- ASCII only (no typographic quotes, dashes, arrows); fenced blocks carry a language.

### 7. Self-review [agent]
`git -C src/packages/dynstruct diff --stat` lists only "Files to change" (plus `.along/`). Grep that no call of the old
inner `mergeResults` remains.

### 8. Verification [agent]
1. `pnpm run test`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` (all green).
2. Start Storybook with the package script in the background: `pnpm run storybook --no-open` (pnpm passes a literal `--` through, which storybook rejects) (from
   `src/packages/dynstruct`); wait until `http://localhost:6006` answers.
3. Open the story URL from the Commands table in any browser you can drive. Check: type an invalid confirm
   value -> no error; click outside -> error; Submit -> `Invalid`; fix -> Submit -> `Valid`; Simulate server error ->
   email error shows; edit email -> it clears; Reset -> all clean. Screenshot after "Simulate server error".
4. `along graph-impact` on `core.tsx` and `contracts.ts`; list consumers in the wrap summary.

### 9. Review, commit, wrap [agent after yes]
Reviewer checks REQ-1..REQ-11 against the diff and the tests. `/along-commit` bound to `feat--validation-ergonomics`
inside `src/packages/dynstruct`; push only after the user's yes. No version change (unified versioning).
`along wrap validation-ergonomics --summary "..." --no-decisions`.

## Out of scope
Schema adapters (zod/valibot), debounce, array-item validation, changing the meaning of `error`.
