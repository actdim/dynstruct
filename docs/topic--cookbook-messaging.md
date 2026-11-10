---
protocol: along
slug: cookbook-messaging
title: "Cookbook: Messaging (MsgMesh)"
type: topic
created: 2026-11-10
updated: 2026-11-10
tags: [cookbook, messaging, msgmesh, bus]
---

# Cookbook: Messaging (MsgMesh)

Typed message bus recipes: declare channels, send, subscribe, request/response, scoping.
Part of the [Cookbook](topic--cookbook.md).

Two shapes of channel:
- **event**: only `in` (`send` + subscribers);
- **request/response**: `in` and `out` (`request` + one provider).

Reference channels by their string value (`'APP.NAV.GOTO'`), not by exported `$...` constants.

---

## 5.1 Declare the app's bus (custom message struct)

**Task.** I want my own typed channels next to the built-in `APP.*` ones.

```ts
import type { MsgBus, MsgStruct } from '@actdim/msgmesh/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import type { KeysOf } from '@actdim/utico/typeCore';
import type { BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';
import type { ComponentMsgHeaders } from '@actdim/dynstruct/componentModel/contracts';

export type TodoItem = { id: number; name: string };

export type AppMsgStruct = BaseAppMsgStruct<AppRoutes> & MsgStruct<{
    'TODO.ADD': { in: TodoItem; out: void };   // event (subscribers react to in or out)
    'TODO.LIST': { in: void; out: TodoItem[] }; // request/response
    'TODO.CLEAR': { in: void };                 // pure event
}>;

export type AppMsgChannels<T extends keyof AppMsgStruct | Array<keyof AppMsgStruct>> = KeysOf<AppMsgStruct, T>;
export type AppMsgHeaders = ComponentMsgHeaders;
export type AppMsgBus = MsgBus<AppMsgStruct, AppMsgHeaders>;

export const appMsgBus = createMsgBus<AppMsgStruct, AppMsgHeaders>({
    '*': { mandatoryProvider: true }, // a request with no provider fails instead of hanging
});
```

**How it works.** `BaseAppMsgStruct` brings the standard `APP.*` channels (nav, store, config,
error, notice). Channel structs can live in several files and be combined with `&`; dotted
prefixes (`API.USERS.`, `TODO.`) keep them apart.

**Gotchas.**
- Use the same struct type in `ComponentStruct<AppMsgStruct, ...>` so `c.msgBus` is typed.

**See also.** story [`CustomMsgStruct.ts`](../src/_stories/componentModel/customMsgStruct/CustomMsgStruct.ts),
[`bootstrap.ts`](../src/_stories/componentModel/bootstrap.ts).

---

## 5.2 Declare what a component uses (`msgScope`)

**Task.** I want the component's bus contract visible on its type.

```ts
type TodoListStruct = ComponentStruct<AppMsgStruct, {
    props: { list: TodoItem[] };
    msgScope: {
        publish: AppMsgChannels<'TODO.LIST'>;                 // send / request
        subscribe: AppMsgChannels<'TODO.ADD' | 'TODO.CLEAR'>; // on / msgBroker.subscribe
        // provide: AppMsgChannels<'...'>;                    // msgBroker.provide
    };
}>;
```

**How it works.** `msgScope` narrows `c.msgBus` and `def.msgBroker` to the declared channels, so a
wrong channel name or payload is a compile error.

---

## 5.3 Send an event

**Task.** Tell everybody that an item was added.

```ts
actions: {
    add: () => {
        c.msgBus.send({ channel: 'TODO.ADD', payload: toPlain(m.item) });
    },
},
```

**How it works.** `send` publishes to the `in` group (the default group). The component proxy
unwraps reactive proxies, sets `headers.sourceId = c.id`, and ties the call to the component
lifetime.

---

## 5.4 Subscribe declaratively (`msgBroker.subscribe`)

**Task.** Refresh my list when an item is added or the list is cleared.

```ts
msgBroker: {
    subscribe: {
        'TODO.ADD': { out: { callback: async () => { await m.refresh(); } } },
        'TODO.CLEAR': { in: { callback: () => { m.list = []; } } },
    },
},
```

**How it works.** Handlers are registered on mount and removed on unmount. The key under the
channel is the group: `in` receives the event itself; `out` receives the provider's response, that
is, "after it was handled".

**Gotchas.**
- Subscribe to `out` when you need the state after the provider ran (the story re-reads the list on
  `out` of `ADD-TODO-ITEM`).
- Errors in subscriber callbacks go to `onCatch` and are re-thrown to an awaiting sender.

**See also.** story [`TodoList.tsx`](../src/_stories/componentModel/customMsgStruct/TodoList.tsx).

---

## 5.5 Request / provide (RPC over the bus)

**Task.** One component owns the todo list; others ask it for the list.

```ts
// provider
msgBroker: {
    provide: {
        'TODO.LIST': { in: { callback: () => toPlain(m.items) } },
    },
},

// consumer
actions: {
    refresh: async () => {
        const msg = await c.msgBus.request({ channel: 'TODO.LIST' });
        m.list = msg.payload;
    },
},
```

**How it works.** `request` sends to `in` and resolves with the provider's `out` message. Through
`c.msgBus` the request counts in `m.$.pendingRequestCount`, routes rejections to `onCatch`, and is
cancelled when the component unmounts.

**Gotchas.**
- The response is a message: read `msg.payload`.
- Pass `options: { timeout: 10000 }` for slow providers.

---

## 5.6 Parent and child talk only inside their subtree

**Task.** Two instances of the same container must not hear each other's children.

```ts
msgBroker: {
    subscribe: {
        'TEST-EVENT': {
            in: { callback: (msg) => { m.text = msg.payload; }, componentFilter: ComponentMsgFilter.FromDescendants },
        },
    },
    provide: {
        'LOCAL-EVENT': {
            in: { callback: (msgIn) => `Hi ${msgIn.payload} from ${c.id}`, componentFilter: ComponentMsgFilter.FromDescendants },
        },
    },
},
```

**How it works.** `FromDescendants` accepts messages only from components below this one;
`FromAncestors` only from components above. The filter uses `headers.sourceId`, which `c.msgBus`
sets automatically.

**See also.** story [`TestContainer.tsx`](../src/_stories/componentModel/TestContainer.tsx),
[`TestChild.tsx`](../src/_stories/componentModel/TestChild.tsx).

---

## 5.7 Custom headers

**Task.** Attach a priority (or correlation id) to messages.

```ts
export type CustomMsgHeaders = ComponentMsgHeaders & { priority: number };

let c: Component<Struct, CustomMsgHeaders>;
const def: ComponentDef<Struct, CustomMsgHeaders> = { /* ... */ };

c.msgBus.send({ channel: 'TODO.ADD', payload: m.item, headers: { priority: m.priority } });
// receiver: msg.headers.priority
```

**See also.** story [`TodoEdit.tsx`](../src/_stories/componentModel/customMsgStruct/TodoEdit.tsx).

---

## 5.8 Late subscribers get the last value (replay)

**Task.** A component mounted later must still see the current selection.

```ts
export const appMsgBus = createMsgBus<AppMsgStruct, AppMsgHeaders>({
    'APP.SELECTION.CHANGED': { replayBufferSize: 1, replayWindowTime: Infinity },
});
```

**How it works.** The channel keeps the last N messages and delivers them to new subscribers.

**See also.** msgmesh docs, "Advanced Patterns" (message replay).

---

## 5.9 Topics: one channel, many streams

**Task.** Many file viewers listen on one channel, each only for its own file.

```ts
c.msgBus.send({ channel: 'FILE.CHANGED', topic: `file.${fileId}`, payload: info });

msgBroker: {
    subscribe: {
        'FILE.CHANGED': { in: { topic: `file.${fileId}`, callback: (msg) => { m.info = msg.payload; } } },
    },
},
```

**How it works.** The topic is part of the message address; subscribers filter on it (wildcards
follow the msgmesh rules; `'/.*/'` matches every topic).

---

## 5.10 Show a global notice (toast)

**Task.** Show "Saved" from anywhere.

```ts
c.msgBus.send({ channel: 'APP.NOTICE', payload: { text: 'Saved', severity: 'success' } });
```

**How it works.** `APP.NOTICE` is a standard channel; a toast service mounted at the root provides
it (in mempart: `services/ToastService.tsx`).

---

## 5.11 Use the bus from plain React code

**Task.** A plain React component (not dynstruct) must listen to a channel.

```tsx
import { useComponentContext } from '@actdim/dynstruct/componentModel/react/componentContext';

function Clock() {
    const { msgBus } = useComponentContext();
    const [tick, setTick] = React.useState(0);
    React.useEffect(() => {
        const ac = new AbortController();
        msgBus.on({ channel: 'APP.TICK', callback: () => setTick((t) => t + 1), options: { abortSignal: ac.signal } });
        return () => ac.abort(); // the raw bus has no automatic cleanup
    }, [msgBus]);
    return <span>{tick}</span>;
}
```

**Gotchas.**
- Only `c.msgBus` (the component proxy) cancels subscriptions on unmount. With the raw bus always
  pass an `abortSignal` and abort it.

---

## 5.12 Use the bus outside React

**Task.** A module-level service (worker bridge, websocket) publishes to the app.

```ts
socket.onmessage = (e) => {
    appMsgBus.send({ channel: 'APP.NOTICE', payload: { text: e.data } });
};

const shutdown = new AbortController();
appMsgBus.provide({ channel: 'TODO.LIST', callback: () => store.items, options: { abortSignal: shutdown.signal } });
```

**How it works.** The bus is a plain object; anything that imports it can send, subscribe or
provide.
