---
protocol: along
slug: cookbook-composition
title: "Cookbook: Composition, Lists & Dialogs"
type: topic
created: 2026-11-10
updated: 2026-11-10
tags: [cookbook, composition, children]
---

# Cookbook: Composition, Lists & Dialogs

How to build a screen out of children: fragments, lists, conditional parts, dialogs and slots.
Part of the [Cookbook](topic--cookbook.md). What `children` means is explained in
[Components](topic--cookbook-components.md), recipe 1.10.

The priority rule: **every nested dynstruct component is declared in `def.children`** and rendered
as `<c.children.Name />`. Do not render dynstruct components inline in `view` with props
(`<Button label={m.title} onClick={...} />`): the parent then tracks every prop expression and
re-renders on each change.

---

## 4.1 Split a view into sections (`React.FC` children)

**Task.** My view is long; I want named sections that re-render on their own.

```tsx
type Struct = ComponentStruct<AppMsgStruct, {
    props: { items: string[]; filter: string };
    children: { toolbar: React.FC; list: React.FC };
}>;

const def: ComponentDef<Struct> = {
    props: { items: [], filter: '' },
    children: {
        toolbar: () => <input {...c.mapToEdit('filter')} />,
        list: () => (
            <ul>
                {m.items.filter((x) => x.includes(m.filter)).map((x) => <li key={x}>{x}</li>)}
            </ul>
        ),
    },
    view: () => (
        <section id={c.id}>
            <c.children.Toolbar />
            <c.children.List />
        </section>
    ),
};
```

**How it works.** A `React.FC` child is a lightweight observer fragment without its own model. It
reads `m` and re-renders only when what it read changes.

**Gotchas.**
- Only the Capitalized JSX name exists for fragments (`<c.children.List />`); there is no
  `c.children.list.model`.

**See also.** story [`StateExample.tsx`](../src/_stories/componentModel/componentState/StateExample.tsx).

---

## 4.2 Use a child component

**Task.** I want a reusable component (button, text field, card) inside mine.

```tsx
import { useButton, type ButtonStruct } from '@actdim/dynstruct-mui';

type Struct = ComponentStruct<AppMsgStruct, {
    props: { title: string };
    actions: { save: () => Promise<void> };
    children: { saveButton: ButtonStruct };
}>;

const def: ComponentDef<Struct> = {
    props: { title: 'Save' },
    actions: { save: async () => { /* ... */ } },
    children: {
        saveButton: useButton({ label: bind(() => m.title), onClick: () => m.save() }),
    },
    view: () => <c.children.SaveButton />,
};
```

**How it works.** The child is created once with the parent; its bindings are lazy, so only the
child re-renders when `m.title` changes. No `useMemo` / `useCallback` needed.

**Gotchas.**
- Declare the child's struct in `children` of your struct; that is the dependency contract.
- The same view must not be mounted twice (`<c.children.X />` in two places): it shares id,
  effects and abort controller. Declare a second child for a second place.

---

## 4.3 Render a list of child components

**Task.** I have `m.items` and want one card component per item.

```tsx
type Struct = ComponentStruct<AppMsgStruct, {
    props: { items: Item[] };
    children: { card: (p: { item: Item }) => CardStruct };
}>;

const def: ComponentDef<Struct> = {
    props: { items: [] },
    children: {
        card: (p) => useCard({ item: bind(() => p.item), $key: p.item.id }),
    },
    view: () => (
        <div>
            {m.items.map((item) => <c.children.Card key={item.id} item={item} />)}
        </div>
    ),
};
```

**How it works.** A function child is a factory: each `<c.children.Card />` element creates its own
instance and receives the JSX props as live, read-only values (`p`).

**Gotchas.**
- Bind each value: `bind(() => p.item)`. Passing `p` whole (`useCard(p)`) or `{ item: p.item }`
  is an initial snapshot only (DEV warning).
- Use a stable React `key`; `$key` additionally gives a predictable component id
  (`card#<id>`).

**See also.** test `tests/react/params-semantics.test.tsx` ("Factory children receive live JSX
props"); webapp `features/profile/UserStoragesList.tsx`.

---

## 4.4 Show a child conditionally

**Task.** Show a spinner while loading, an empty state when there is no data.

```tsx
children: {
    spinner: useCircularProgress({ size: 32 }),
    emptyState: () => <p>No items yet</p>,
},
view: () => (
    <div>
        {m.loading && <c.children.Spinner />}
        {!m.loading && m.items.length === 0 && <c.children.EmptyState />}
    </div>
),
```

**How it works.** The child instance exists for the parent's lifetime; the condition only decides
whether its view is mounted.

**Gotchas.**
- Keep the condition in `view` (or in a fragment child); do not create children conditionally in
  `def.children`: hook-constructors follow the rules of React hooks.

---

## 4.5 Parent-controlled dialog

**Task.** A dialog opens when something is selected and closes back into the parent state.

```tsx
children: {
    deleteDialog: useDialog({
        open: bind(() => Boolean(m.toDelete)),
        onClose: () => { m.toDelete = null; },
        title: 'Delete item?',
        content: () => <p>{m.toDelete?.name} will be removed.</p>,
        actions: () => (
            <>
                <c.children.CancelButton />
                <c.children.ConfirmButton />
            </>
        ),
    }),
    cancelButton: useButton({ label: 'Cancel', onClick: () => { m.toDelete = null; } }),
    confirmButton: useButton({ label: 'Delete', color: 'error', onClick: () => m.confirmDelete() }),
},
view: () => (
    <>
        {/* ... list ... */}
        <c.children.DeleteDialog />
    </>
),
```

**How it works.** The open state is derived from the model (`toDelete`), so there is no separate
`open` flag to keep in sync. `content` and `actions` are `React.FC` slots of the dialog.

**See also.** webapp `features/profile/UserStoragesList.tsx`.

---

## 4.6 Global dialog opened over the bus

**Task.** Many places in the app open the same dialog (intake, report, add storage).

```tsx
// anywhere
c.msgBus.send({ channel: 'APP.STORAGE.ADD_DIALOG_OPEN' });

// the dialog host, mounted once near the root
msgBroker: {
    subscribe: {
        'APP.STORAGE.ADD_DIALOG_OPEN': {
            in: { callback: () => { m.open = true; c.resetValidation(); } },
        },
    },
},
```

**How it works.** The dialog owns its state; callers only express the intent. No prop drilling and
no callback props.

**See also.** [Messaging](topic--cookbook-messaging.md); webapp `features/intake/IntakeDialog.tsx`.

---

## 4.7 Pass content into a child's slot

**Task.** My card takes a header and a footer from the caller.

```tsx
// Card: declares the slots
type CardStruct = ComponentStruct<AppMsgStruct, {
    props: { header?: React.FC; footer: React.ReactNode };
}>;
props: {
    header: undefined,
    footer: prop({ initialValue: null, reactive: 'ref' }), // React element: ref prop
},
view: () => (
    <article>
        {m.header && <m.header />}
        <div>...</div>
        <footer>{m.footer}</footer>
    </article>
),

// Caller
children: {
    card: useCard({ header: () => <h3>{m.title}</h3>, footer: <small>v1</small> }),
},
```

**How it works.** A function slot (`React.FC`) is rendered as a component and stays reactive to the
caller's model. A React element stored in the model must live in a `reactive: 'ref'` prop.

**Gotchas.**
- A React element in a deep-reactive prop throws in DEV: `... holds a React value ... declare
  prop({ reactive: 'ref' })`.
- To render another dynstruct child inside the slot, pass a fragment:
  `header: () => <c.children.Title />`.

---

## 4.8 Render arbitrary content with a model (`useDynamicContent`)

**Task.** I need a small child that renders data with a function I pass in.

```tsx
import { useDynamicContent } from '@actdim/dynstruct/componentModel/DynamicContent';

children: {
    stats: useDynamicContent<Stats>({
        data: bind(() => m.stats),
        render: (props, cc) => <span>{cc.model.data.count} items</span>,
    }),
},
```

**How it works.** `DynamicContent` is a generic component with `data` and `render` props; useful
for one-off fragments that need their own instance (id, error boundary).

---

## 4.9 Large arrays: control reactivity

**Task.** I store thousands of rows and only replace or push them.

```ts
props: {
    rows: prop({ initialValue: [], reactive: 'shallow' }), // push/pop tracked, items not proxied
    chartData: prop({ initialValue: [], reactive: 'ref' }), // only reassignment tracked
    config: prop({ initialValue: { debug: false }, reactive: false }), // not tracked at all
},
```

**How it works.** `'shallow'` keeps the container reactive but items plain; `'ref'` stores by
reference and tracks only reassignment (replace the array to update); `false` turns tracking off.

**Gotchas.**
- With `'shallow'` or `'ref'`, editing an item property in place is not seen; replace the item or
  the array.

---

## 4.10 Use the MUI kit (`@actdim/dynstruct-mui`)

**Task.** I want ready-made inputs, buttons and dialogs that follow the same rules.

```ts
import { useButton, useTextField, useDialog, type ButtonStruct } from '@actdim/dynstruct-mui';
```

**How it works.** Each kit component is a dynstruct hook-constructor (`useXxx`) with a `XxxStruct`
type, used as a child exactly like recipe 4.2. `toReact` exports (`Button`, `TextField`) are only
for the boundary with plain React code.
