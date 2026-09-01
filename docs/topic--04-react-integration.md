---
protocol: along
protocol_version: "2.2.5"
slug: topic--04-react-integration
title: React Integration & Service Patterns
type: topic
created: 2026-08-31
updated: 2026-08-31
tags: [04-react-integration]
---

# React Integration & Service Patterns

[← Back to 03. Architecture & Wiring](./topic--03-architecture-and-wiring.md) | [Next: 05. API Reference →](./topic--05-api-reference.md)

---

## React Integration Basics

`dynstruct` provides lightweight adapters to connect hook-constructors to React's component tree.

### 1. `useComponent`
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

### 2. `toReact`
Converts a `dynstruct` hook-constructor into a standard React FC component:

```typescript
import { toReact } from '@actdim/dynstruct/componentModel/react';

export const Counter = toReact(useCounter);

// Now usable anywhere in standard React:
// <Counter counter={5} />
```

---

## Service Integration & Adapters

`dynstruct` integrates natively with the **service adapter** system from [`@actdim/msgmesh`](https://github.com/actdim/msgmesh). Adapters automatically register any service class (such as an API client) as a message bus provider — channel names, payload types, and return types are all derived from the service class at compile-time.

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
