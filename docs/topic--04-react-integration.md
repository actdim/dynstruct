---
protocol: along
slug: 04-react-integration
title: React Integration & Service Patterns
type: topic
created: 2026-08-31
updated: 2026-09-10
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
// <Counter counter={5} />
```

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

## Navigation & Security Contracts

### Built-in Navigation (`AppNavStruct`)

Navigation requests can be issued over the message bus, decoupling page components from router implementations:

```typescript
c.msgBus.send({
    channel: 'APP.NAV.GOTO',
    payload: { path: '/profile/123' }
});
```

### Auth & Security Provider (`AuthInfo`)

Security status and user credentials flow through standardized security channels, providing automatic token refresh and permission checks across all connected components.

---

[← Back to 03. Architecture & Wiring](./topic--03-architecture-and-wiring.md) | [Next: 05. API Reference →](./topic--05-api-reference.md)
