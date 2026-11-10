---
protocol: along
slug: cookbook-services
title: "Cookbook: Services & API Calls"
type: topic
created: 2026-11-10
updated: 2026-11-10
tags: [cookbook, services, api, http]
---

# Cookbook: Services & API Calls

Expose API clients and services on the bus and call them from components.
Part of the [Cookbook](topic--cookbook.md).

The idea: a service class is turned into typed bus channels by an adapter; components call
`c.msgBus.request(...)` and never import the HTTP client directly.

---

## 6.1 Expose a service class as bus channels (adapters)

**Task.** I have an API client class and want each method to be a typed channel.

```ts
import { ServiceProvider } from '@actdim/dynstruct/services/react/ServiceProvider';
import {
    type BaseServiceSuffix, getMsgChannelSelector, type MsgProviderAdapter,
    type ToMsgChannelPrefix, type ToMsgStruct,
} from '@actdim/msgmesh/adapters';

export class TodoApiClient {
    static readonly name = 'TodoApiClient' as const;
    readonly name = 'TodoApiClient' as const;
    getItems(ids: number[], names: string[]): Promise<Item[]> { /* ... */ }
}

type TodoApiPrefix = ToMsgChannelPrefix<typeof TodoApiClient.name, 'API', BaseServiceSuffix>; // 'API.TODO.'
type TodoApiMsgStruct = ToMsgStruct<TodoApiClient, TodoApiPrefix>; // 'API.TODO.GETITEMS', ...

export const services: Record<TodoApiPrefix, object> = { 'API.TODO.': new TodoApiClient() };

const adapters = Object.values(services).map(
    (service) => ({ service, channelSelector: getMsgChannelSelector(services) }) as MsgProviderAdapter,
);

export type AppMsgStruct = BaseAppMsgStruct & TodoApiMsgStruct;
export const ApiServiceProvider = () => ServiceProvider({ adapters });
```

Mount `<ApiServiceProvider />` once near the root (inside the bus context).

**How it works.** `ToMsgChannelPrefix` derives `API.TODO.` from the class name minus known
suffixes (`Client`, `Api`, `Service`, `Fetcher`, `Controller`, `Loader`, `Repository`) and
uppercases it; `ToMsgStruct` maps each method to a channel whose `in` is the
argument tuple and `out` is the awaited return type. `ServiceProvider` registers providers on
mount and removes them on unmount.

**Gotchas.**
- The third type argument of `ToMsgStruct` excludes methods that must not become channels
  (helpers, base-class members).
- The prefix needs a string literal type: pass `'TodoApiClient'` directly, or use a
  `static readonly name = '...' as const` (a plain `Class.name` is typed `string`).
- `ToMsgStruct`'s skip list affects types only; at runtime every method is registered.

**See also.** story [`serviceCall/ApiServiceProvider.ts`](../src/_stories/componentModel/serviceCall/ApiServiceProvider.ts).

---

## 6.2 Call a service method

**Task.** Call `getItems([1, 2], ['a', 'b'])` from a component.

```ts
// msgScope: { publish: AppMsgChannels<'API.TODO.GETITEMS'> }
actions: {
    load: async () => {
        const msg = await c.msgBus.request({
            channel: 'API.TODO.GETITEMS',
            payloadFn: (fn) => fn([1, 2], ['a', 'b']), // typed like the method
        });
        m.items = msg.payload;
    },
},
```

**How it works.** `payloadFn` gets a function with the method's signature and builds the argument
tuple, so arguments are type-checked by name and position. `payload: [[1, 2], ['a', 'b']]` is the
equivalent raw form.

**Gotchas.**
- Even a method with one argument takes a tuple in raw form: `payload: [arg]`.

**See also.** story [`ServiceCallExample.tsx`](../src/_stories/componentModel/serviceCall/ServiceCallExample.tsx).

---

## 6.3 Write an HTTP API client (`HttpClient`)

**Task.** A typed client for my REST API with auth headers handled for me.

```ts
import { HttpClient } from '@actdim/dynstruct/net/httpClient';

export class UsersApiClient extends HttpClient {
    static readonly name = 'UsersApiClient' as const;
    readonly name = 'UsersApiClient' as const;

    getUser(id: string): Promise<User> {
        return this.fetch({ url: `/api/users/${id}`, method: 'GET', useAuth: true });
    }
}

export const services = { 'API.USERS.': new UsersApiClient({ msgBus: appMsgBus }) };
```

**How it works.** `this.fetch` performs the request; `useAuth: true` asks `SecurityService` (over
`APP.SECURITY.AUTH.APPLY`) for the auth headers. Error statuses throw `HttpClientError`. Pending
requests are aborted when the client is disposed.

**Gotchas.**
- Show UI text from `err.code` / `err.params`, never `err.message` (see
  [Forms](topic--cookbook-forms-validation.md), recipe 3.9).
- Generated clients (NSwag, Orval, Kubb) plug in the same way: wrap or extend them so each method
  becomes a channel.

**See also.** story [`securityService/SecureApiClient.ts`](../src/_stories/componentModel/securityService/SecureApiClient.ts).

---

## 6.4 Load data when the component appears

**Task.** Fetch the list on mount.

```ts
events: {
    onReady: async () => { await m.load(); },
},
```

**How it works.** `onReady` maps to `useEffect` and is async-safe; a rejection goes to `onCatch`.
The request is cancelled if the component unmounts first.

---

## 6.5 Show a loading indicator

**Task.** Show a spinner while any request of this component is running.

```tsx
children: {
    spinner: () => (m.$.pendingRequestCount > 0 ? <progress /> : null),
},
```

**How it works.** Every `c.msgBus.request(...)` increments `m.$.pendingRequestCount` and
decrements it when settled. No manual `loading` flag needed for the common case.

**Gotchas.**
- Requests made with the raw bus (not `c.msgBus`) are not counted.

**See also.** story [`StateExample.tsx`](../src/_stories/componentModel/componentState/StateExample.tsx) (Busy State).

---

## 6.6 Search as you type (debounce + ignore stale responses)

**Task.** Reload results when the query changes, but not on every keystroke, and never show an older
response over a newer one.

```ts
let timer: ReturnType<typeof setTimeout> | null = null;
let seq = 0;

const def: ComponentDef<ImplStruct> = {
    props: { query: '', users: [] },
    actions: {
        search: async () => {
            const mySeq = ++seq;
            const msg = await c.msgBus.request({ channel: 'API.ADMIN.GETUSERS', payloadFn: (fn) => fn({ q: m.query }) });
            if (mySeq === seq) {
                m.users = msg.payload; // only the latest request writes
            }
        },
    },
    events: {
        onChangeQuery: () => {
            if (timer) { clearTimeout(timer); }
            timer = setTimeout(() => { timer = null; void m.search(); }, 300);
        },
        onDestroy: () => { if (timer) { clearTimeout(timer); } },
    },
};
```

**How it works.** The sequence number makes late responses harmless. For a cancelling variant pass
an `AbortController` signal in the request `options` and abort the previous one.

**See also.** webapp `features/admin/AdminUsersView.tsx`.

---

## 6.7 Implement a service as a component

**Task.** A UI-less service (toasts, theme, layout) that owns state and answers on the bus.

```tsx
type ToastServiceStruct = ComponentStruct<AppMsgStruct, {
    props: { items: Toast[] };
    msgScope: { provide: AppMsgChannels<'APP.NOTICE'> };
}>;

const useToastService = (params: ComponentParams<ToastServiceStruct>) => {
    let c: Component<ToastServiceStruct>;
    let m: ComponentModel<ToastServiceStruct>;
    const def: ComponentDef<ToastServiceStruct> = {
        props: { items: [] },
        msgBroker: {
            provide: {
                'APP.NOTICE': { in: { callback: (msg) => { m.items.push({ id: Date.now(), ...msg.payload }); } } },
            },
        },
        view: () => <ToastStack items={m.items} />,
    };
    c = useComponent(def, params);
    m = c.model;
    return c;
};
export const ToastService = toReact(useToastService);
```

Mount `<ToastService />` once near the root.

**How it works.** The provider lives exactly as long as the component; state stays in the model.
Built-in `NavService`, `SecurityService` and `StorageService` follow the same pattern.

**See also.** `src/services/react/StorageService.tsx`; webapp `services/ToastService.tsx`.

---

## 6.8 Persist small values (`StorageService`)

**Task.** Remember the last opened folder between sessions.

```ts
// root: <StorageService storeName="my-app" />

await c.msgBus.request({ channel: 'APP.STORE.SET', payload: { key: 'lastFolder', value: m.folderId } });

const msg = await c.msgBus.request({ channel: 'APP.STORE.GET', payload: { key: 'lastFolder' } });
m.folderId = msg.payload?.data?.value as string;
```

**How it works.** The response is a `StoreItem` (`{ metadata?, data? }`); the stored value is in
`data.value`. `useEncryption: true` encrypts the value. `APP.STORE.REMOVE` deletes a key.

**See also.** story [`storageService/StorageServiceExample.tsx`](../src/_stories/componentModel/storageService/StorageServiceExample.tsx).

---

## 6.9 Read app configuration

**Task.** Read the API base URL or feature flags at runtime.

```ts
const msg = await c.msgBus.request({ channel: 'APP.CONFIG.GET' });
m.apiBase = msg.payload.baseApiUrl;

msgBroker: {
    subscribe: { 'APP.CONFIG.CHANGED': { in: { callback: (msg) => { m.apiBase = msg.payload.baseApiUrl; } } } },
},
```

**How it works.** Some component near the root provides `APP.CONFIG.GET` and sends
`APP.CONFIG.CHANGED`; everybody else reads config through the bus.

**Gotchas.**
- `BaseAppDomainConfig` has `id`, `baseUrl`, `baseApiUrl`, `apis`, `security`; extend it for your
  own fields.
