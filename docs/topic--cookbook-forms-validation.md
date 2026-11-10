---
protocol: along
slug: cookbook-forms-validation
title: "Cookbook: Forms & Validation"
type: topic
created: 2026-11-10
updated: 2026-11-10
tags: [cookbook, forms, validation]
---

# Cookbook: Forms & Validation

Recipes for editable forms: field rules, error display, submit, server errors and reset.
Part of the [Cookbook](topic--cookbook.md). The examples assume the usual skeleton
(`let c` / `let m`, `useComponent`) and these imports:

```ts
import type { Component, ComponentDef, ComponentModel, ComponentParams, ComponentStruct } from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react/hooks';
import { prop, bindProp, bindField } from '@actdim/dynstruct/componentModel/core';
```

Rule of thumb: declare rules on the prop with `prop({ validator })`, never validate by hand in a
submit handler.

---

## 3.1 Bind a native input to a model prop (`mapToEdit`)

**Task.** I want an `<input>` / `<select>` that reads and writes `m.email` without writing
`value` / `onChange` / `onBlur` by hand.

```tsx
type Struct = ComponentStruct<AppMsgStruct, { props: { email: string; country: string } }>;

const def: ComponentDef<Struct> = {
    props: { email: '', country: 'us' },
    view: () => (
        <form id={c.id}>
            <input type="email" {...c.mapToEdit('email')} />
            <select {...c.mapToEdit<HTMLSelectElement>('country')}>
                <option value="us">US</option>
                <option value="de">DE</option>
            </select>
        </form>
    ),
};
```

**How it works.** `c.mapToEdit(path)` returns `value`, `onChange` and `onBlur` (plus disabled /
read-only state) for one model path. `onBlur` marks the path touched and runs its `onBlur` rule.
Nested paths work: `c.mapToEdit('userInfo.email')`.

**Gotchas.**
- The generic argument types the element: `mapToEdit<HTMLSelectElement>(...)`.
- The second argument excludes props you want to set yourself: `c.mapToEdit('email', ['onBlur'])`.

**See also.** [Core Concepts](topic--02-core-concepts.md);
story [`componentState/StateExample.tsx`](../src/_stories/componentModel/componentState/StateExample.tsx).

---

## 3.2 Add a field rule (required, format)

**Task.** I want `email` to be required and well-formed, checked when the user leaves the field.

```ts
props: {
    email: prop({
        initialValue: '',
        validator: {
            onBlur: true,
            validate: (v: string) =>
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? '')
                    ? undefined
                    : { isValid: false, message: 'Invalid email' },
        },
    }),
},
```

**How it works.** `validate(value, ctx)` returns `undefined` for valid or a
`ValidationResult` (`{ isValid, message?, code?, params? }`). The flags choose when it runs:

| Flag | Runs on |
|---|---|
| `onChange` (default unless `onSubmit` is the only flag) | every write to the path |
| `onBlur` | `c.touch(path)`, `mapToEdit` blur, `bindField` blur |
| `onSubmit` | full `c.validate()` only |
| none of the above, called by hand | `c.validate(path)` |

**Gotchas.**
- `message` may be a function: `message: () => t('emailInvalid')`. It is evaluated on read, so it
  follows a locale change.
- A rule on a nested path is declared with a dotted key: `'userInfo.email': prop({ validator })`.
- A throwing validator goes to `onCatch`, it does not crash the form.

**See also.** `Validator`, `ValidationResult` in [API Reference](topic--05-api-reference.md).

---

## 3.3 Show the error under the field

**Task.** I want a red message under the input, but only after the user has touched it.

```tsx
children: {
    emailRow: () => {
        const s = m.$.propState['email'] || {};
        return (
            <div>
                <input type="email" {...c.mapToEdit('email')} aria-invalid={!!s.visibleError} />
                {s.visibleError && <span role="alert">{s.visibleError}</span>}
            </div>
        );
    },
},
view: () => <form><c.children.EmailRow /></form>,
```

**How it works.** `m.$.propState[path]` holds the per-field state: `validation` (last result),
`error` (message regardless of touched), `visibleError` (message once touched), `touched`,
`validating` (an async rule is running).

**Gotchas.**
- Render `visibleError`, not `error`: `error` is set from the first keystroke.
- Use `|| {}`: the record exists only after the first validation of that path.
- Putting the row in a `React.FC` child keeps re-renders local to that row.

---

## 3.4 Use a UI-kit field (`bindField`)

**Task.** I use `@actdim/dynstruct-mui` (or another kit with `value` / `error` / `helperText` /
`onBlur` props) and want all four wired to one model path.

```tsx
import { useTextField, type TextFieldStruct } from '@actdim/dynstruct-mui';

type Struct = ComponentStruct<AppMsgStruct, {
    props: { name: string };
    children: { nameField: TextFieldStruct };
}>;

const def: ComponentDef<Struct> = {
    props: {
        name: prop({
            initialValue: '',
            validator: { onBlur: true, validate: (v: string) => (v.trim() ? undefined : { isValid: false, message: 'Required' }) },
        }),
    },
    children: {
        nameField: useTextField({
            label: 'Name',
            ...bindField(() => c, 'name', { hint: () => 'Shown while the value is valid' }),
        }),
    },
    view: () => <c.children.NameField />,
};
```

**How it works.** `bindField` returns `{ value, error, helperText, onBlur }`: `value` is a
two-way binding, `error` follows `touched && isValid === false`, `helperText` shows
`visibleError` or the hint, `onBlur` calls `c.touch(path)`.

**Gotchas.**
- Pass a lazy getter `() => c`. `c` is `undefined` while `def.children` is built, so
  `bindField(c, ...)` fails.

---

## 3.5 Validate everything before submit

**Task.** I want Submit to run all rules, show every error, and stop if anything is invalid.

```ts
actions: {
    submit: async () => {
        if (!(await c.validate())) {
            return; // every validated field is now touched, errors are visible
        }
        await c.msgBus.request({ channel: 'API.USERS.CREATE', payloadFn: (fn) => fn(toPlain({ name: m.name, email: m.email })) });
    },
},
```

**How it works.** `c.validate()` runs every prop rule plus `onValidate` and resolves to `boolean`.
It marks every validated path touched, so `visibleError` appears on all invalid fields at once.
`m.$.isValid` follows the results. `c.validate('email')` checks one path.

**Gotchas.**
- Put submit in `def.actions`: errors route to `onCatch` and writes are batched.
- Strip reactive proxies before handing data to an API client: `toPlain(...)` (the component bus
  proxy `c.msgBus` already does this for the payload).

---

## 3.6 Cross-field rules

**Task.** I want "Confirm email" to match "Email", or "End date" to be after "Start date".

Per-field rule that reads another field (from the story):

```ts
confirmEmail: prop({
    initialValue: '',
    validator: {
        onBlur: true,
        validate: (v: string) => (v === m.email ? undefined : { isValid: false, message: () => 'Emails do not match' }),
    },
}),
```

Form-level rule with `onValidate` (runs during `c.validate()`, returns results per path):

```ts
events: {
    onValidate: () => ({
        endDate: m.endDate >= m.startDate ? undefined : { isValid: false, message: 'End is before start' },
    }),
},
```

**How it works.** Inside a `def` read the typed closure `m`. In a reusable rule factory use
`ctx.model` (untyped) and `ctx.component`.

**Gotchas.**
- A per-field rule re-runs only when its own path changes. If the other field changes later, call
  `c.validate('confirmEmail')` from `onChangeEmail`, or rely on `onValidate` at submit.

---

## 3.7 Async rule (server check)

**Task.** I want to check that a user name is free while typing.

```ts
userName: prop({
    initialValue: '',
    validator: {
        onBlur: true,
        validate: async (v: string, ctx) => {
            const msg = await ctx.component.msgBus.request({ channel: 'API.USERS.ISNAMEFREE', payloadFn: (fn) => fn(v) });
            return msg.payload ? undefined : { isValid: false, message: 'Name is taken' };
        },
    },
}),
```

**How it works.** `validate` may return a promise. While it runs `propState[path].validating` is
`true`. An older async result never overwrites a newer one.

**Gotchas.**
- Prefer `onBlur` for server checks; `onChange` calls the server on every keystroke.
- Show a spinner from `propState[path].validating`.

---

## 3.8 Disable the submit button and show a busy state

**Task.** I want the button disabled while the form is invalid or a request is running.

```tsx
children: {
    submitButton: useButton({
        label: 'Save',
        onClick: () => m.submit(),
        disabled: bind(() => !m.$.isValid),
        loading: bind(() => m.$.pendingRequestCount > 0),
    }),
},
```

**How it works.** `m.$.pendingRequestCount` counts in-flight `c.msgBus.request(...)` calls of this
component. `m.$.isValid` follows the last validation results.

**Gotchas.**
- `m.$.isValid` starts `true` before any rule ran; if the button must start disabled, also check
  your own "required" values.

**See also.** [Services](topic--cookbook-services.md), recipe 6.5.

---

## 3.9 Put server errors into the form

**Task.** The server rejected the request (`409 NAME_CONFLICT`) and I want the error under the
field, cleared as soon as the user edits it.

```ts
import { HttpClientError } from '@actdim/dynstruct/net/httpClientError';

actions: {
    submit: async () => {
        if (!(await c.validate())) { return; }
        try {
            await c.msgBus.request({ channel: 'API.GROUPS.CREATE', payloadFn: (fn) => fn({ name: m.name }) });
        } catch (err) {
            if (err instanceof HttpClientError && err.code === 'NAME_CONFLICT') {
                c.setValidation({ name: { isValid: false, message: () => t('nameTaken'), code: err.code } });
                return;
            }
            throw err; // anything else goes to onCatch
        }
    },
},
```

**How it works.** `c.setValidation(results)` stores external results; each is marked touched (so
it is visible) and cleared when its path changes.

**Gotchas.**
- Build UI text from `err.code` and `err.params`, never from `err.message` (server English plus
  HTTP diagnostics).

---

## 3.10 Reset the form when a dialog opens

**Task.** My edit dialog is reused; on each open I want fresh values and no leftover errors.

```ts
events: {
    onChangeOpen: (open) => {
        if (open) {
            m.name = '';
            m.email = '';
            c.resetValidation();
        }
    },
},
```

**How it works.** `c.resetValidation()` clears results and touched state of the whole component;
`c.resetValidation('email')` clears one path.

**Gotchas.**
- `onChangeOpen` fires on writes through this component's model. If `open` is bound to a parent
  prop, react with an effect instead (see [Data Flow](topic--cookbook-data-flow.md), recipe 2.8).

---

## 3.11 Manual error map (when rules do not fit)

**Task.** The checks come from a wizard step or a third-party schema and I just want to show
messages.

```ts
// Run the schema yourself, then hand the results to the form
const issues = schema.safeParse(toPlain({ name: m.name, email: m.email }));
if (!issues.success) {
    const results = Object.fromEntries(
        issues.error.issues.map((i) => [i.path.join('.'), { isValid: false, message: i.message }]),
    );
    c.setValidation(results as Parameters<typeof c.setValidation>[0]); // keys are model paths
}
```

**How it works.** Everything still lands in `m.$.propState`, so the same error rendering
(recipes 3.3 and 3.4) works.

**Gotchas.**
- Prefer `prop({ validator })` for anything field-shaped: it re-runs automatically, the manual
  map does not.
