---
protocol: along
slug: cookbook-components
title: "Cookbook: Component Basics"
type: topic
created: 2026-11-10
updated: 2026-11-10
tags: [cookbook, components, children]
---

# Cookbook: Component Basics

Defining, configuring and mounting components, plus the two meanings of `children`.
Part of the [Cookbook](topic--cookbook.md).

---

## 1.1 Define a component

**Task.** I want a new component with state, an action and a view.

```tsx
import type { Component, ComponentDef, ComponentModel, ComponentParams, ComponentStruct } from '@actdim/dynstruct/componentModel/contracts';
import { toReact, useComponent } from '@actdim/dynstruct/componentModel/react/hooks';

type CounterStruct = ComponentStruct<AppMsgStruct, {
    props: { count: number; step: number };
    actions: { increment: () => void };
}>;

export const useCounter = (params: ComponentParams<CounterStruct>): Component<CounterStruct> => {
    let c: Component<CounterStruct>;
    let m: ComponentModel<CounterStruct>;

    const def: ComponentDef<CounterStruct> = {
        props: { count: 0, step: 1 },
        actions: {
            increment: () => { m.count += m.step; },
        },
        view: () => (
            <button id={c.id} onClick={() => m.increment()}>
                {m.count}
            </button>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export type { CounterStruct };
export const Counter = toReact(useCounter);
```

**How it works.** The struct is the public contract; `def` is the implementation. `c` is the
instance, `m = c.model` is its reactive model with actions blended in (`m.increment()`, there is no
`c.actions`). `view` is an observer: it re-renders when what it read changes.

**Gotchas.**
- `c` and `m` are assigned after `useComponent` returns: anything in `def` that runs while `def`
  is built must read them lazily (`() => m.x`).
- The framework does not put `c.id` on the DOM; do it yourself if you need it.
- Inline JSX handlers with logic are discouraged; call an action.

**See also.** [Core Concepts](topic--02-core-concepts.md);
story [`SimpleComponent.tsx`](../src/_stories/componentModel/SimpleComponent.tsx).

---

## 1.2 Keep internals private (`ComponentStructExt`)

**Task.** My component needs extra state, fragments and helper actions that callers must not see.

```tsx
export const useProfile = (params: ComponentParams<ProfileStruct>): Component<ProfileStruct> => {
    type ImplStruct = ComponentStructExt<ProfileStruct, {
        props: { loading: boolean };
        actions: { load: () => Promise<void> };
        children: { header: React.FC };
    }>;

    let c: Component<ImplStruct>;
    let m: ComponentModel<ImplStruct>;

    const def: ComponentDef<ImplStruct> = { /* ... */ };

    c = useComponent(def, params);
    m = c.model;
    return c; // callers see Component<ProfileStruct>
};
```

**How it works.** `ComponentStructExt<Public, Private>` extends the struct inside the
hook-constructor only. Return type `Component<PublicStruct>` hides the rest.

**Gotchas.**
- For non-reactive per-instance data (cache, lock) use `ComponentImpl<Struct, Internals>` and pass
  the internals as the third argument of `useComponent`; access them via `c._`.

**See also.** story [`StateExample.tsx`](../src/_stories/componentModel/componentState/StateExample.tsx);
`src/services/react/StorageService.tsx`.

---

## 1.3 Defaults vs params

**Task.** I want a default value that the caller can override.

```tsx
// def: defaults only
props: { step: 1, label: 'Count' },

// caller (plain React boundary)
<Counter step={5} />

// caller (another dynstruct component)
children: { counter: useCounter({ step: 5 }) },                        // initial value
children: { counter: useCounter({ step: bindProp(() => m, 'step') }) }, // live
```

**How it works.** A plain param is an **initial value** applied once on top of the default. A
binding is a **live channel**. Props passed through `toReact` (JSX) are turned into bindings by the
framework, so they stay live and are owned by the React parent.

**Gotchas.**
- Never read `params.x` in the hook-constructor (`props: { step: params.step ?? 1 }`): it is a
  snapshot that looks live.
- A plain param changed on a later render is not applied (DEV warning). Use a binding, or a new
  `$key` to recreate the instance.

---

## 1.4 Computed (derived) prop

**Task.** `total` is always `price * qty`.

```ts
// struct: props: { price: number; qty: number; readonly total: number }
props: {
    price: 0,
    qty: 1,
    get total() { return m.price * m.qty; },
},
```

**How it works.** A getter-only prop becomes a cached computed value. Mark it `readonly` in the
struct and use `m`, not `this`.

---

## 1.5 Lifecycle: load data, clean up

**Task.** Load data when the component appears; release a resource when it goes away.

```ts
events: {
    onInit: () => { /* sync setup, no DOM */ },
    onReady: async () => { await m.load(); },        // like useEffect, async-safe
    onLayoutReady: () => { /* DOM is available, sync */ },
    onDestroy: () => { socket.close(); },
},
```

**How it works.** `onInit` runs once on creation; `onLayoutReady` / `onLayoutDestroy` map to
`useLayoutEffect`; `onReady` / `onDestroy` map to `useEffect`. Errors in all of them go to
`onCatch`.

**Gotchas.**
- Subscriptions and requests made through `c.msgBus` are cancelled on unmount automatically; no
  cleanup needed for them.

---

## 1.6 Mount a component and give it an id

**Task.** Render a dynstruct component from plain React code (router element, root layout) with a
stable id.

```tsx
<Route path="/counter" element={<Counter $id="main-counter" step={2} />} />
<UserCard $key={user.id} />  // id: "userCard#<user.id>"
```

**How it works.** `toReact(useX)` makes a React component. Id priority: `$id` as is, else
`<regType>#<$key>`, else `<regType>#<n>`. `regType` is derived from the hook name by the dynstruct
Vite plugin (`useUserCard` -> `UserCard`).

**Gotchas.**
- Render `toReact` components only at the boundary with plain React. Inside a dynstruct component
  declare the hook in `children` ([Composition](topic--cookbook-composition.md), recipe 4.2).
- `$id`, `$key` and `$events` are service params; they are never stored in the model.

---

## 1.7 Provide the message bus at the app root

**Task.** Every component needs `c.msgBus`; I want one bus for the whole app.

```tsx
import { createMsgBus } from '@actdim/msgmesh/core';
import { ComponentContextProvider } from '@actdim/dynstruct/componentModel/react/componentContext';

export const appMsgBus = createMsgBus<AppMsgStruct, AppMsgHeaders>();

export function App() {
    return (
        <ComponentContextProvider value={{ msgBus: appMsgBus }}>
            <NavService routes={appRoutes} />
            <StorageService storeName="my-app" />
            {/* <SecurityService />: see the Auth & Navigation recipes for its configuration */}
            <AppRoutes />
        </ComponentContextProvider>
    );
}
```

**How it works.** Components get the bus from React context; nobody passes it through props.
Service components (`NavService`, `SecurityService`, `StorageService`, `ServiceProvider`) are
mounted once near the root and provide their channels to everybody below.

**Gotchas.**
- `NavService` uses React Router: mount it inside the router (for example in the root layout
  route), as the mempart webapp does.

**See also.** [Messaging](topic--cookbook-messaging.md), recipe 5.1;
story [`bootstrap.ts`](../src/_stories/componentModel/bootstrap.ts);
webapp `components/layout/MainLayout.tsx`.

---

## 1.8 Choose a reactivity mode

**Task.** A prop holds a big array, a config object or a React element.

```ts
props: {
    rows: prop({ initialValue: [], reactive: 'shallow' }),   // container tracked, items plain
    icon: prop({ initialValue: null, reactive: 'ref' }),     // reassignment tracked, stored by reference
    config: prop({ initialValue: { debug: false }, reactive: false }), // not tracked
},
```

**How it works.** Default is deep reactive. See
[Composition](topic--cookbook-composition.md), recipe 4.9, for when to pick which.

---

## 1.9 React content in props

**Task.** My component takes an icon (`ReactNode`) or a render function from the caller.

```ts
// struct: props: { icon?: React.ReactNode; renderEmpty?: React.FC }
props: {
    icon: prop({ initialValue: null, reactive: 'ref' }),
    renderEmpty: undefined,
},
view: () => (
    <div>
        {m.icon}
        {m.items.length === 0 && m.renderEmpty && <m.renderEmpty />}
    </div>
),
```

**How it works.** React values (elements, portals, `memo` / `lazy` types, contexts) must be stored
in `reactive: 'ref'` props. Functions are plain values and need nothing special.

**Gotchas.**
- In DEV a React value in a deep-reactive prop throws: `[dynstruct] Prop 'x' ... holds a React
  value ...`. Production does not check.
- Values that come through bindings (`toReact` props, factory child props) are not stored and not
  checked.

---

## 1.10 Two kinds of `children`

**Task.** I see `children` in two places and want to know which is which.

| | dynstruct `children` | React `children` |
|---|---|---|
| Where declared | `ComponentStruct.children` + `def.children` | JSX body: `<Panel>...</Panel>` |
| What it holds | child components and fragments **owned** by this component | content the **caller** passes in |
| How to read | `c.children.name` (instance), `<c.children.Name />` (view) | `props.children` in `view: (props) => ...` |
| Lifetime | created once with the parent | new on every caller render |

```tsx
type PanelStruct = ComponentStruct<AppMsgStruct, {
    props: { title: string };
    children: { closeButton: ButtonStruct; footer: React.FC }; // dynstruct children
}>;

const def: ComponentDef<PanelStruct> = {
    props: { title: '' },
    children: {
        closeButton: useButton({ label: 'Close', onClick: () => m.close() }),
        footer: () => <small>{m.title}</small>,
    },
    view: (props) => (
        <section>
            <h2>{m.title}</h2>
            {props.children /* React children from the caller */}
            <c.children.Footer />
            <c.children.CloseButton />
        </section>
    ),
};

// caller
<Panel title="Details">
    <p>Any React content</p>
</Panel>
```

**How it works.**
- **dynstruct children** are the component's own parts. For a full component child the lowercase
  key is the instance (`c.children.closeButton.model`, `.effects`, `.id`) and the Capitalized key
  is its view for JSX (`<c.children.CloseButton />`). For `React.FC` and factory children only the
  Capitalized key exists.
- **React children** are `ComponentViewProps.children`: whatever is nested in the JSX tag, passed
  to `view` as `props.children`. This works for `toReact` components and for
  `<c.children.Panel>...</c.children.Panel>` alike.

**Gotchas.**
- Why not flat access (`c.closeButton`)? Keeping children in their own namespace avoids name
  clashes with props and actions, and keeps the reactive model (`m`) separate from component
  instances, which are not reactive values.
- Destructure when the view uses many children: `const { Header, List, Footer } = c.children;`
  inside `view`.
- A component without `view` renders its React children as is.

**See also.** `ComponentChildren`, `ComponentViewProps` in [API Reference](topic--05-api-reference.md).
