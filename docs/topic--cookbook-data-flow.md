---
protocol: along
slug: cookbook-data-flow
title: "Cookbook: Data Flow & Bindings"
type: topic
created: 2026-11-10
updated: 2026-11-10
tags: [cookbook, bindings, data-flow]
---

# Cookbook: Data Flow & Bindings

How values move between a parent and its children, and how to react to changes.
Part of the [Cookbook](topic--cookbook.md).

```ts
import { bind, bindProp, fromExternalStore, toPlain } from '@actdim/dynstruct/componentModel/core';
```

Pick a binding in this order:

1. `bindProp(() => m, 'prop')` - two-way, typed by key path, nested paths allowed.
2. `bind(() => expr)` - read-only or derived value.
3. `bind(get, set[, converter])` - only when get or set needs its own logic.

---

## 2.1 Pass a value down (parent to child, read-only)

**Task.** The child shows a value the parent owns and must follow its changes.

```tsx
type Struct = ComponentStruct<AppMsgStruct, {
    props: { title: string };
    children: { header: HeaderStruct };
}>;

const def: ComponentDef<Struct> = {
    props: { title: 'Inbox' },
    children: {
        header: useHeader({ text: bind(() => m.title) }),
    },
    view: () => <c.children.Header />,
};
```

**How it works.** A binding is a live channel: the child reads `m.text` through the getter, so it
re-renders when `m.title` changes. The parent does not track the value and does not re-render.

**Gotchas.**
- Always a lazy getter: `() => m.title`. `m` is `undefined` while `def` is built, so
  `useHeader({ text: m.title })` throws.
- A plain value is an initial value only: `useHeader({ text: 'Inbox' })` is applied once.
- The child cannot write back through a read-only binding (DEV warning on write).

**See also.** [Core Concepts](topic--02-core-concepts.md), section on params semantics.

---

## 2.2 Two-way binding (`bindProp`)

**Task.** The child edits a value and the parent must see the edits.

```ts
children: {
    nameEdit: useTextField({ value: bindProp(() => m, 'name') }),
    cityEdit: useTextField({ value: bindProp(() => m, 'address.city') }), // nested path
},
```

**How it works.** The child's `value` reads and writes `m.name` directly; there is one source of
truth and no `onChange` callback.

**Gotchas.**
- Do not write `bind(() => m.name, (v) => { m.name = v; })`: same behavior, longer. Use `bind(get, set)`
  only when the setter does more (recipe 2.3).

**See also.** story [`EffectDemo.tsx`](../src/_stories/componentModel/EffectDemo.tsx).

---

## 2.3 Binding with extra logic in the setter

**Task.** Closing a dialog must also clear the draft.

```ts
children: {
    dialog: useDialog({
        open: bind(
            () => m.dialogOpen,
            (v) => {
                m.dialogOpen = v;
                if (!v) { m.draft = null; }
            },
        ),
    }),
},
```

**How it works.** `bind(get, set)` is the explicit form; use it when the getter computes something
or the setter has side effects or writes elsewhere.

---

## 2.4 Convert a value on the way (`ValueConverter`)

**Task.** The model stores cents, the input edits dollars.

```ts
import type { ValueConverter } from '@actdim/dynstruct/componentModel/contracts';

const centsToDollars: ValueConverter<number, number> = {
    convert: (cents) => cents / 100,               // source -> child
    convertBack: (dollars) => Math.round(dollars * 100), // child -> source
};

children: {
    priceEdit: useNumberField({ value: bind(() => m.priceCents, (v) => { m.priceCents = v; }, centsToDollars) }),
},
```

**How it works.** The child reads `convert(get())` and writes `set(convertBack(value))`.
For a one-off conversion an inline get/set pair also works (see the converter story).

**See also.** story [`ConverterDemo.tsx`](../src/_stories/componentModel/ConverterDemo.tsx).

---

## 2.5 Child tells the parent something (intent over the bus)

**Task.** A list item was clicked and the page must react. I do not want an `onSelect` callback
prop.

```tsx
// Child: publishes an intent
type ItemStruct = ComponentStruct<AppMsgStruct, {
    props: { id: string };
    msgScope: { publish: AppMsgChannels<'ITEM.SELECTED'> };
}>;
actions: {
    select: () => { c.msgBus.send({ channel: 'ITEM.SELECTED', payload: { id: m.id } }); },
},

// Parent: listens only to its own subtree
msgBroker: {
    subscribe: {
        'ITEM.SELECTED': {
            in: {
                callback: (msg) => { m.selectedId = msg.payload.id; },
                componentFilter: ComponentMsgFilter.FromDescendants,
            },
        },
    },
},
```

**How it works.** `FromDescendants` makes the parent receive only messages sent by components in
its own subtree, so two instances of the page do not hear each other.

**Gotchas.**
- Callback props (`onSelect*`, `onClose*`, `onChange*`) between components are an anti-pattern:
  two sources of truth and timing races. `on*` props are fine on primitive wrappers over DOM events
  (a button `onClick`).
- Add the channel to the struct's `msgScope` so the contract is visible on the type.

**See also.** [Messaging](topic--cookbook-messaging.md);
story [`TestContainer.tsx`](../src/_stories/componentModel/TestContainer.tsx).

---

## 2.6 Call a child's action or set its prop

**Task.** The parent must tell one specific child to do something (focus, reset, refresh).

```ts
actions: {
    resetFilters: () => { c.children.filters.model.reset(); },
},
events: {
    onChangeText: () => { c.children.preview.model.value = m.text; },
},
```

**How it works.** The lowercase key is the child instance: `c.children.filters.model` is its
reactive model with actions blended in.

**Gotchas.**
- Use this for commands to a direct child. For "keep in sync" use a binding instead (2.1, 2.2).
- Only full components have `.model`; `React.FC` children do not (see
  [Components](topic--cookbook-components.md), recipe 1.10).

---

## 2.7 React to my own prop change (`onChangeX`)

**Task.** When `email` changes I want to recompute something.

```ts
events: {
    onChangingAmount: (oldValue, newValue) => newValue >= 0, // return false to reject the write
    onChangeEmail: (value) => { m.userId = value ? makeId(value) : null; },
    onPropChange: (prop, value) => { console.debug('changed', prop, value); },
},
```

**How it works.** `onChanging<Prop>` runs before the write and can veto it; `onChange<Prop>` runs
after. `onPropChanging` / `onPropChange` are the generic forms. A React parent can pass the same
handlers via `$events`.

**Gotchas.**
- These fire on writes made through this component's model (its own code, `mapToEdit`, a child
  writing through a two-way binding). A bound prop whose source changes in the parent does not
  pass through this model's setter: use an effect (2.8).

---

## 2.8 Reload when inputs change (effect)

**Task.** When `query` or `page` changes (including changes that come in through bindings), reload
the list.

```ts
type Struct = ComponentStruct<AppMsgStruct, {
    props: { query: string; page: number; items: Item[] };
    effects: 'reload';
}>;

effects: {
    reload: () => {
        const key = `${m.query}|${m.page}`; // reading registers the dependencies
        void m.load(key);
    },
},
actions: {
    load: async (key: string) => { /* request, then write m.items */ },
},
```

**How it works.** An effect is auto-tracked: it re-runs whenever a value it read changes, whatever
the source. `c.effects.reload.pause()` / `.resume()` / `.stop()` control it.

**Gotchas.**
- Put the async work into an action so errors reach `onCatch`; guard against stale responses (see
  [Services](topic--cookbook-services.md), recipe 6.7).
- Do not use React `useEffect` in the hook-constructor for this: the host is not an observer, so it
  will not re-run on model changes.

**See also.** story [`EffectDemo.tsx`](../src/_stories/componentModel/EffectDemo.tsx).

---

## 2.9 Derived value (computed prop)

**Task.** `fullName` is always `firstName + lastName`.

```ts
// struct
props: { firstName: string; lastName: string; readonly fullName: string };

// def
props: {
    firstName: '',
    lastName: '',
    get fullName() {
        return `${m.firstName} ${m.lastName}`.trim(); // use m, not this
    },
},
```

**How it works.** A getter-only prop in `def.props` becomes a cached computed value. It also works
on nested object literals.

---

## 2.10 Read external state (`fromExternalStore`)

**Task.** I have a non-model store (i18n runtime, theme store, module-level service) and want views,
bindings or effects to re-run when it changes.

```ts
const readLocale = fromExternalStore(
    (onChange) => { i18n.on('languageChanged', onChange); return () => i18n.off('languageChanged', onChange); },
    () => i18n.language,
    'locale',
);

// anywhere tracked: view, bind getter, computed prop, effect
children: { label: useLabel({ text: bind(() => (readLocale() === 'de' ? 'Hallo' : 'Hello')) }) },
```

**How it works.** Same contract as React `useSyncExternalStore`; the reader subscribes only while
something observes it.

**Gotchas.**
- Never import MobX directly in app code; this is the supported bridge.

---

## 2.11 Hand model data to non-reactive code (`toPlain`)

**Task.** I pass model data to a REST client, a chart library or `postMessage`.

```ts
chart.setData(toPlain(m.points));
worker.postMessage(toPlain({ filters: m.filters }));
```

**How it works.** `toPlain` strips reactive proxies. Payloads sent through `c.msgBus` are already
unwrapped; call `toPlain` for everything else.
