---
protocol: along
slug: 04-react-integration
title: React Integration & Service Patterns
type: topic
created: 2026-08-31
updated: 2026-10-10
tags: [04-react-integration]
---

# React Integration & Service Patterns

[← Back to 03. Architecture & Wiring](./topic--03-architecture-and-wiring.md) | [Next: 05. API Reference →](./topic--05-api-reference.md)

---

## React Integration Basics

`dynstruct` provides lightweight adapters to connect hook-constructors to React's component tree.

### 1. Root Application Initialization (`ComponentContextProvider`)

At the root of the React application, wrap the component tree with `ComponentContextProvider` (imported from `@actdim/dynstruct/componentModel/react/componentContext`). This registers the application-level `msgBus` and manages the component hierarchy registry:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ComponentContextProvider } from '@actdim/dynstruct/componentModel/react/componentContext';
import { createAppMsgBus } from '@/config/appConfig';
import App from './App';

const msgBus = createAppMsgBus();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ComponentContextProvider value={{ msgBus }}>
        <App />
    </ComponentContextProvider>
);
```

### 2. `useComponent`
Instantiates a `dynstruct` component inside a React hook-constructor:

```typescript
const useCounter = (params: ComponentParams<CounterStruct>) => {
    let c: Component<CounterStruct>;
    let m: ComponentModel<CounterStruct>;

    const def: ComponentDef<CounterStruct> = {
        props: { counter: 0 },
        view: () => <button onClick={() => m.counter++}>{m.counter}</button>
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

### 3. `toReact`
Converts a `dynstruct` hook-constructor into a standard React FC component:

```typescript
import { toReact } from '@actdim/dynstruct/componentModel/react';

export const Counter = toReact(useCounter);

// Now usable anywhere in standard React:
// <Counter />                       - counter is internal state (default 0)
// <Counter counter={n} $events={{ onChangeCounter: setN }} /> - counter is controlled by the React parent
```

Props passed to a `toReact` component stay live: they are read through bindings, not copied into the model
(see [Params: Initial Values vs Live Bindings](#8-params-initial-values-vs-live-bindings)). Use `toReact` exports at
the boundary with plain React code (router elements, root layout); inside a dynstruct component take the child via
its hook-constructor in `def.children`.

### 4. Hooks Policy (Dynstruct-First, Not a Ban)

React hooks are **not forbidden**. Dynstruct was built to cover the needs of typical components, so that you do not have to think about `useCallback` / `useMemo`, dependency arrays, stable inline callbacks, or which built-in hook fits a case best. For typical scenarios and typical components everything is already solved by reactive model props, lifecycle events, effects, actions, bindings, and MsgMesh - built-in hooks are simply not needed there (in the vast majority of cases).

- **Built-in hooks** (`useState`, `useEffect`, `useLayoutEffect`, `useReducer`, `useMemo`, `useCallback`, `useRef`): do not use them by default - use the Dynstruct replacement from the table below. Reach for one only in a non-typical case the component model does not cover, and leave a short comment explaining why.
- **Custom and third-party hooks** (your own `useXxx`, library hooks such as a media player state hook): allowed inside Dynstruct components. Just do not break the Dynstruct ideology: state the rest of the app depends on lives in the model (`props`), communication goes through bindings and MsgMesh, and the hook stays an implementation detail of the component.
- **React context**: usually unnecessary, because data flows down and up the hierarchy through bindings and MsgMesh. It is still allowed when a library or a service extension needs it (Dynstruct itself uses `useContext` in `ReactComponentContext`, and `ServiceProvider` uses `useEffect`).

Typical React patterns and their Dynstruct replacements:

| Standard React Pattern | Dynstruct Replacement | Rationale |
|---|---|---|
| `const [x, setX] = useState(0)` | `props: { x: 0 }` + `m.x = 1` | Automatically reactive, inspectable in hierarchy, serializable |
| `useEffect(() => { ... }, [])` | `events: { onReady: (c) => ... }` | Explicit lifecycle, lifecycle-scoped `AbortSignal`, zero stale closures |
| `useEffect(() => { ... }, [dep])` | `effects: { myEffect: (c) => ... }` | Automatic dependency tracking, pausable, zero manual dependency arrays |
| `useCallback(() => { ... })` | `actions: { myAction: () => ... }` | Stable action references with automatic batched state updates |
| `useMemo(() => fn(a), [a])` | Computed getter `get myVal() { return ... }` | Recomputed on demand via reactive proxy |
| `useRef(...)` | Component fields or `ComponentState` | Avoids hidden state outside the reactive model |

### 5. Form Input Integration (`c.mapToEdit`)

To connect standard inputs (HTML `<input>` or MUI `<TextField>`) without writing boilerplate `value` and `onChange` hooks, use `c.mapToEdit()`:

```tsx
// Binds directly to model property with automatic validator triggers
<input type="text" {...c.mapToEdit('username')} />

// Fully compatible with MUI / @actdim/dynstruct-mui:
```

### 6. Event Coordination & Component Composition Rules

When integrating Dynstruct components in React applications:
- **Zero Callback Props**: Strictly avoid passing callback props (`onSelect*`, `onNavigate*`, `onOpen*`, `onClose*`, `onChange*`) between components, features, or pages. Callback prop drilling creates dual sources of truth, timing races, and state desynchronization.
- **Pure Event-Driven MsgMesh Architecture**: All cross-component, cross-feature, navigation, and domain coordination MUST flow through typed MsgMesh channels (`c.msgBus.send`, `msgBroker.subscribe`).
- **Role Separation**: `props` are strictly for component configuration and data bindings (`bindProp`); `actions` are internal model mutators (atomic MobX transactions) for component-local state, NOT cross-component callbacks.
- **Children Declared in `def.children`**: Declare child components in `def.children` and render them as `<c.children.Name />`, rather than inline JSX `<Child onSelect={...} />`.
- **Persistent DOM Mounting**: Sibling views that listen to the message bus (e.g. Master-Detail panels, Explorer Content vs Media Viewer) should stay mounted in the DOM and toggle via CSS (`hidden` vs `flex` / `block`). Because unmounting triggers `releaseMount()` and drops all `msgBroker` subscriptions, persistent mounting ensures background views never miss messages and preserve scroll/input state. Alternatively, configure the relevant bus channels with `replayBufferSize: 1`.

### 7. React Values in Props (`children`, Slots, Component Types)

A dynstruct prop may hold React content, exactly like a React prop: an element (`icon={<SaveIcon />}`), a
`ReactNode` slot, a component type (`icon={SaveIcon}`, including `memo` / `forwardRef` types) or `children`.
For a `toReact` component, nested JSX is just the `children` prop, so `<AppShell><Outlet /></AppShell>` passes
`<Outlet />` to a `children` prop declared in the struct.

Rule: **React values are stored only in ref props.** A React object (a value with a `$$typeof` symbol: elements,
portals, `memo` / `forwardRef` / `lazy` types, contexts) must never be converted to an observable or proxied, so the
model keeps it only where values are stored as is:

- a prop declared `prop({ reactive: 'ref' })` - anywhere inside its value (objects, arrays) is fine;
- also `reactive: false` props and the items of a `reactive: 'shallow'` container.

Storing a React value anywhere else (a `def.props` default, a plain param, `m.x = <El />`, a nested `{ icon: <I /> }`
in a deep-reactive prop) throws in DEV: `[dynstruct] Prop 'x' of '...' holds a React value ... declare
prop({ reactive: 'ref' })`. There is no auto-detection; production builds do not check.

Values read through bindings are not stored in the model and need no declaration: props of a `toReact` component
(including `children` of `<Comp>...</Comp>`), JSX props of factory children, `bind` / `bindProp` values. React
objects are also never wrapped by the error-routing layer.

```tsx
import { prop } from '@actdim/dynstruct/componentModel/core';

type Struct = ComponentStruct<AppMsgStruct, {
    props: {
        title: string;
        children?: React.ReactNode;
        footer?: React.ReactNode;
    };
}>;

const def: ComponentDef<Struct> = {
    props: {
        title: '',
        children: prop({ reactive: 'ref' }),
        footer: prop({ reactive: 'ref' }),
    },
    view: () => (
        <section>
            <h2>{m.title}</h2>
            {m.children}
            <footer>{m.footer}</footer>
        </section>
    ),
};
```

Item arrays with React content (e.g. `items: [{ label, icon: <Icon /> }]`): declare the container prop
`prop({ initialValue: [], reactive: 'ref' })` - the whole value is stored by reference (replace the array or
object to update it; in-place mutations are not tracked).

Why the rule exists: a converted or proxied React value breaks rendering only when a debugger is attached
(VS Code integrated browser, DevTools open) with `Cannot read properties of undefined (reading 'mode')` in react-dom
`handleThrow`; the first, swallowed exception is `'run' called with illegal receiver` from the element's DEV-only
`_debugTask`. The DEV error makes the mistake visible immediately instead.

### 9. Vite Plugin: `regType` From the Source

`regType` (the component type used for ids and the registry) is derived at build time by the dynstruct Vite plugin
from the hook-constructor name - no hand-written `def.regType` needed:

```ts
// vite.config.ts (also storybook viteFinal, vitest config)
import { dynstructPlugin } from '@actdim/dynstruct/vite/plugin';

export default defineConfig({ plugins: [react(), dynstructPlugin()] });
```

`useStorageCard` -> `'StorageCard'`; a PascalCase function name is used as is; otherwise the module file name.
An explicit `def.regType` wins. Without the plugin: in DEV a best-effort label from the call stack (never throws),
in production `'component'`.

### 8. Params: Initial Values vs Live Bindings

`params` describe the input of a component **once, at creation**. The kind of value decides its semantics:

| Value in `params` | Semantics |
|---|---|
| plain value (`title: 'x'`, `open: false`) | **initial value**: applied to the model once, on top of the `def.props` default |
| binding (`bindProp(...)`, `bind(...)`) | **live channel**: the model reads (and, with a setter, writes) through it |
| `$events`, `$id`, `$key` | service keys: handlers (refreshed on every commit), identity, reset via a new `$key` |

Rules:

- A hook-constructor never reads `params.x`. It passes `params` whole to `useComponent(def, params)`; `def.props`
  holds defaults only and the framework applies params on top.
- Live input for a child comes from the model: `bindProp(() => m, 'prop')` or `bind(() => m...)`. The parent's own
  input is already in `m` (read through the parent's binding when it was given one).
- A plain param changed on a later render is **not** applied to an existing instance (DEV builds warn about it).
  Use a binding for live input, or a new `$key` to recreate the instance with new initial values.
- React boundary: props of a `toReact` component and JSX props of a factory child arrive on every React render, so
  dynstruct turns them into bindings - they stay live without being copied into the model. Such a prop is owned by
  the React parent (controlled): the component reads it, and a two-way flow goes through `$events.onChangeX`. A write
  to a controlled prop is not stored but fires `onChangeX`, like a controlled React input; `undefined` means "not
  controlled" - the `def.props` default applies and the component owns the prop.
- Factory child props are read-only. Passing them whole (`(p) => useCard(p)`) makes every value an initial value -
  bind each one instead.

```tsx
// BAD: a snapshot of this render's params, looks live but is not
props: { value: params.value ?? '' },
children: { drawer: useDrawer({ open: params.open }) },

// GOOD: defaults in def.props, live input from the model
props: { value: '', open: false },
children: { drawer: useDrawer({ open: bindProp(() => m, 'open') }) },
```

Factory child rendered with JSX props: read its params through a binding, an eager read is an initial value.

```tsx
// children: { card: (p: { item: Item }) => CardStruct }
card: (p) => useCard({
    item: bind(() => p.item), // GOOD: follows <c.children.Card item={x} />
    // item: p.item,          // BAD: initial value only
}),
```

### 10. External State in Views (`fromExternalStore`)

When a view, binding, or computed property needs to react to state that lives outside the component model (for example, an i18next runtime, theme store, or module-level service) without importing MobX into application code:

```typescript
import { fromExternalStore } from '@actdim/dynstruct/componentModel/core';

// Create a reactive reader for the external store
const readTheme = fromExternalStore(
    themeService.subscribe,
    themeService.getSnapshot,
    'theme',
);

// In a dynstruct component:
const useMyComponent = (params?: ComponentParams<MyStruct>) => {
    const def: ComponentDef<MyStruct> = {
        view: () => <div className={readTheme()}>Content</div>,
    };
    return useComponent(def, params);
};
```

Calling `readTheme()` inside an observer `view`, `bind(...)` getter, computed prop, or effect registers a dependency and triggers re-renders whenever the store notifies change. When unmounted or evaluated outside a reaction, it returns `getSnapshot()` without subscribing.

---

## Service Integration & Adapters

`dynstruct` integrates natively with the **service adapter** system from [`@actdim/msgmesh`](https://github.com/actdim/msgmesh). Adapters automatically register any service class (such as an API client) as a message bus provider - channel names, payload types, and return types are all derived from the service class at compile-time.

### 1. Define an API Client Class

```typescript
export type DataItem = { id: number; name: string };

export class TestApiClient {
    static readonly name = 'TestApiClient' as const;
    readonly name = 'TestApiClient' as const;

    getDataItems(param1: number[], param2: string[]): Promise<DataItem[]> {
        return fetch('/api/data').then(r => r.json());
    }
}
```

### 2. Set Up Service Provider

```typescript
import {
    BaseServiceSuffix, getMsgChannelSelector, MsgProviderAdapter,
    ToMsgChannelPrefix, ToMsgStruct,
} from '@actdim/msgmesh/adapters';
import { ServiceProvider } from '@actdim/dynstruct/services/react/ServiceProvider';

type ApiPrefix = 'API';
type TestApiChannelPrefix = ToMsgChannelPrefix<
    typeof TestApiClient.name, ApiPrefix, BaseServiceSuffix
>;
type ApiMsgStruct = ToMsgStruct<TestApiClient, TestApiChannelPrefix>;

const services: Record<TestApiChannelPrefix, any> = {
    'API.TEST.': new TestApiClient(),
};

const msgProviderAdapters = Object.entries(services).map(
    ([_, service]) => ({
        service,
        channelSelector: getMsgChannelSelector(services),
    }) as MsgProviderAdapter,
);

export const ApiServiceProvider = () => ServiceProvider({ adapters: msgProviderAdapters });
```

### 3. Consume Service in Component

```typescript
const useApiCallExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    async function loadData() {
        const msg = await c.msgBus.request({
            channel: 'API.TEST.GETDATAITEMS',
            payloadFn: (fn) => fn([1, 2], ['first', 'second']),
        });
        m.dataItems = msg.payload;
    }

    const def: ComponentDef<Struct> = {
        props: { dataItems: [] },
        events: {
            onReady: () => { loadData(); },
        },
        view: () => (
            <div>
                <button onClick={loadData}>Reload</button>
                <ul>
                    {m.dataItems.map((item) => (
                        <li key={item.id}>{item.name}</li>
                    ))}
                </ul>
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

---

## Server-Side Rendering (SSR) and Isomorphic Runtime Support

`@actdim/dynstruct` provides out-of-the-box support for isomorphic Node.js SSR environments (such as Astro, Next.js, and raw `react-dom/server` via `renderToString`).

### 1. Isomorphic Layout Effect

During server-side rendering, React does not execute layout effects and emits runtime warnings if `useLayoutEffect` is invoked. Dynstruct uses `useIsomorphicLayoutEffect` internally:
- In browser environments, it resolves to `useLayoutEffect` (synchronous layout updates).
- In Node.js / non-browser environments, it resolves to `useEffect` (dormant during `renderToString`), eliminating server warnings.

### 2. MobX Static Rendering

To prevent memory leaks across concurrent HTTP requests in Node.js, `enableStaticRendering(true)` from `mobx-react-lite` is automatically activated when `typeof window === 'undefined'`. Observer components render plain HTML without registering reactive tracking subscriptions.

`enableStaticRendering` is also exported from `@actdim/dynstruct/componentModel/react` for explicit test harness control.

### 3. Synchronous SSR State Contract

Server rendering via `renderToString` executes only the synchronous component constructor and render function. Mount effects (`onReady`, `onLayoutReady`), background effects (`effects`), and message bus subscriptions do not run on the server:
- Components intended for SSR must accept their initial server data synchronously through initial `params` (e.g. `<ArticleList items={serverLoadedItems} />`).
- Asynchronous data fetching inside `effects` or `onReady` remains dormant during SSR and activates only after client-side hydration.

### 4. Deterministic Component IDs and Hydration Safety

Sequential component IDs (`context.getNextId`) increment per component type. If conditional rendering diverges between server and client trees, sequential indices can shift, causing React Hydration Mismatch warnings:
- Provide explicit `$id` or `$key` params on SSR-rendered components (e.g. `<UserCard $key="profile-header" />`) for deterministic IDs across server and client.
- Alternatively, supply a custom deterministic generator via `<ComponentContextProvider value={{ getNextId: (type) => ... }}>`.

---

## Navigation & Security Contracts

### Built-in Navigation (`AppNavStruct`)

Navigation requests can be issued over the message bus, decoupling page components from router implementations:

```typescript
c.msgBus.send({
    channel: 'APP.NAV.GOTO',
    payload: { path: '/profile/123' }
});
```

`NavService` (`services/react/NavService`) is mounted once inside the router (root layout) and provides the
navigation channels:

- `APP.NAV.GOTO` - `in`: `{ url }`, `{ path, params }` (pattern + params) or `{ path: -1 }` (history back);
  `replace` and `state` (`location.state` of the new entry) are optional. `ex`: `{ route, params }` resolved through the
  `routes` passed to `NavService` (`toRouteHref`, leading `/`).
- `APP.NAV.CONTEXT.CHANGED` - published on every location change with the live `NavContext` (`location`,
  `searchParams`, `params`, `navType` PUSH / REPLACE / POP), including browser Back/Forward and navigations made by
  the router directly; once per change (StrictMode-safe).
- `APP.NAV.CONTEXT.GET` / `APP.NAV.HISTORY.READ` - the current / an earlier context (last 100 kept).

Pages that map the URL to state subscribe to `APP.NAV.CONTEXT.CHANGED` (and read `APP.NAV.CONTEXT.GET` on ready,
because they mount after the first publish). `getUrlBuilder` omits `undefined` / `null` params.

### Auth & Security Provider (`AuthInfo`)

Security status and user credentials flow through standardized security channels, providing automatic token refresh and permission checks across all connected components.

---

[← Back to 03. Architecture & Wiring](./topic--03-architecture-and-wiring.md) | [Next: 05. API Reference →](./topic--05-api-reference.md)
