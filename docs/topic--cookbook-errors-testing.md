---
protocol: along
slug: cookbook-errors-testing
title: "Cookbook: Errors & Testing"
type: topic
created: 2026-11-10
updated: 2026-11-10
tags: [cookbook, errors, testing]
---

# Cookbook: Errors & Testing

Where errors go, how to show them, and how to test components with a real bus.
Part of the [Cookbook](topic--cookbook.md).

---

## 8.1 Know where an error goes

**Task.** I want to know which errors reach `onCatch` and which reach the caller.

| Thrown in | `onCatch` | Re-thrown to the caller |
|---|---|---|
| `onInit`, `onReady`, `onLayoutReady`, `onDestroy`, `onLayoutDestroy` | yes | no |
| effects (`def.effects`) | yes | no |
| `onChangingX`, `onChangeX`, `onGetX`, `onPropChange(ing)` | yes | no |
| binding get / set | yes | no |
| actions (`def.actions`) | yes | yes |
| `msgBroker` subscriber / provider callbacks | yes | yes |
| `c.msgBus.request(...)` rejection | yes | yes |
| `c.run(fn)` / `c.run(fn, true)` | yes | yes / no |
| a plain helper function or inline JSX handler | no | yes |

**How it works.** Every routed error is also pushed to `m.$.errors` and sent on `APP.ERROR`
(topic `$SYSTEM_TOPIC`) with the component as `source`.

**See also.** [Core Concepts](topic--02-core-concepts.md), error handling.

---

## 8.2 Handle errors in one place (`onCatch`)

**Task.** Any failure of this component should show a message and a retry button.

```tsx
const def: ComponentDef<ImplStruct> = {
    props: { status: 'idle', errorText: '' },
    useErrorBoundary: false, // only async errors expected here
    actions: {
        load: async () => {
            m.status = 'loading';
            m.items = (await c.msgBus.request({ channel: 'API.ITEMS.GETALL', payload: [] })).payload;
            m.status = 'idle';
        },
    },
    events: {
        onReady: () => m.load(),
        onCatch: (err) => {
            m.status = 'error';
            m.errorText = err instanceof HttpClientError && err.code ? t(`errors.${err.code}`) : t('errors.generic');
        },
    },
    view: () =>
        m.status === 'error' ? (
            <p role="alert">
                {m.errorText} <button onClick={() => c.run(() => m.load(), true)}>Retry</button>
            </p>
        ) : (
            <ItemList items={m.items} />
        ),
};
```

**How it works.** Actions route errors to `onCatch` automatically. `c.run(fn, true)` wraps an
inline handler so its error also lands in `onCatch` and is not re-thrown.

**Gotchas.**
- A plain helper next to `def` (`const reload = async () => {...}`) is not wrapped: put it in
  `def.actions` or wrap its body in `c.run(...)`.
- Build UI text from `err.code`, not `err.message`.

**See also.** story [`ErrorBoundaryDemo.tsx`](../src/_stories/componentModel/ErrorBoundaryDemo.tsx).

---

## 8.3 Show a fallback when `view` throws

**Task.** A broken component should show a placeholder instead of breaking the page.

```tsx
const def: ComponentDef<Struct> = {
    useErrorBoundary: true, // default
    fallbackView: () => <div role="alert">This widget failed to render.</div>,
    view: () => { /* may throw */ },
};
```

**How it works.** With `useErrorBoundary` (default `true`) the view is wrapped in an error
boundary; a render error goes to `onCatch` and `fallbackView` (or a standard fallback) is shown.

---

## 8.4 Show a global error overlay

**Task.** Collect every error in the app into one panel or toast.

```ts
msgBroker: {
    subscribe: {
        'APP.ERROR': {
            in: { topic: '/.*/', callback: (msg) => { m.errors = [...m.errors, msg.payload]; } },
        },
    },
},
```

**How it works.** Components send `APP.ERROR` with the system topic; `topic: '/.*/'` (a regex)
receives every topic. Bus-level failures go to `MSGBUS.ERROR`.

**Gotchas.**
- Without the topic filter the subscriber does not receive these messages: topics match exactly by
  default.

**See also.** story [`ErrorOverlay.tsx`](../src/_stories/componentModel/ErrorOverlay.tsx),
[`bootstrap.ts`](../src/_stories/componentModel/bootstrap.ts).

---

## 8.5 Read a component's errors

**Task.** Show a small error badge on a component.

```tsx
children: {
    badge: () => (m.$.errors.length ? <span title={String(m.$.errors.at(-1))}>!</span> : null),
},
```

**How it works.** `m.$.errors` is the list of errors routed for this component.

---

## 8.6 Test a component with a real bus and fake services

**Task.** Unit-test a component that calls an API over the bus, without HTTP.

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { createMsgBus } from '@actdim/msgmesh/core';
import { ComponentContextProvider } from '@actdim/dynstruct/componentModel/react/componentContext';

it('shows loaded items', async () => {
    const msgBus = createMsgBus<AppMsgStruct>();
    const ac = new AbortController();
    msgBus.provide({
        channel: 'API.ITEMS.GETALL',
        callback: () => [{ id: 1, name: 'First' }],
        options: { abortSignal: ac.signal },
    });

    render(
        <ComponentContextProvider value={{ msgBus }}>
            <ItemsView />
        </ComponentContextProvider>,
    );

    await waitFor(() => expect(screen.getByText('First')).toBeInTheDocument());
    ac.abort();
});
```

**How it works.** The component only knows channels, so a fake provider on a real bus replaces the
API client. A new bus per test keeps tests independent.

**Gotchas.**
- Bus delivery is asynchronous: use `waitFor` / `findBy*`, not synchronous assertions.
- Assert messages a component sends by subscribing in the test: `msgBus.on({ channel: 'ITEM.SELECTED', callback: spy })`.
- Add the dynstruct Vite plugin to the Vitest config to get readable component ids.

**See also.** `tests/react/services.test.tsx`, `tests/react/msgbroker-and-communication.test.tsx`.

---

## 8.7 Test a service adapter without React

**Task.** Check that my API client methods are reachable through the bus.

```ts
import { registerAdapters } from '@actdim/msgmesh/adapters';

const msgBus = createMsgBus<AppMsgStruct>();
registerAdapters(msgBus, adapters);
const msg = await msgBus.request({ channel: 'API.TODO.GETITEMS', payloadFn: (fn) => fn([1], ['a']) });
expect(msg.payload).toEqual([{ id: 1, name: 'a' }]);
```

---

## 8.8 Drive a component from a test (actions and model)

**Task.** Change state or call an action directly in a test.

```tsx
let instance: Component<CounterStruct> | undefined;
const Host = toReact((p: ComponentParams<CounterStruct>) => (instance = useCounter(p)));

render(<ComponentContextProvider value={{ msgBus }}><Host /></ComponentContextProvider>);
act(() => { instance!.model.increment(); });
expect(screen.getByRole('button')).toHaveTextContent('1');
```

**How it works.** The component instance is a plain object: tests can read `model`, call actions,
or check `model.$.propState` after `await instance.validate()`.

**See also.** `tests/react/params-semantics.test.tsx`, `tests/react/validation-and-forms.test.tsx`.
