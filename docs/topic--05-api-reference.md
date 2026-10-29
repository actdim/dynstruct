---
protocol: along
slug: 05-api-reference
title: API Reference & Development Guide
type: topic
created: 2026-08-31
updated: 2026-10-10
tags: [05-api-reference, api, contracts]
---

# API Reference & Development Guide

[← Back to 04. React Integration](./topic--04-react-integration.md) | [Back to Main README](../README.md)

---

## Core Types Reference

### `ComponentStruct<TMsgStruct, TStructDef>`
Base generic type defining component structural contracts (pure type declaration, no implementation):

```typescript
type ComponentStruct<
    TMsgStruct extends BaseAppMsgStruct = BaseAppMsgStruct,
    TStructDef extends ComponentStructBase<TMsgStruct> = ComponentStructBase<TMsgStruct>,
> = TStructDef & {
    msg: TMsgStruct;
};

// Shape of TStructDef:
type ComponentStructBase<TMsgStruct> = {
    props?: Record<string, any>;
    actions?: Record<string, Function>;
    effects?: string[] | string;
    children?: Record<string, ComponentStruct<any> | Function>;
    msgScope?: {
        subscribe?: keyof TMsgStruct;
        publish?: keyof TMsgStruct;
        provide?: keyof TMsgStruct;
    };
};
```

### `ComponentStructExt<TStruct, TInternalStruct>`
Combines a **public** `ComponentStruct` contract with an **internal** implementation contract, keeping caller JSX props clean:

```typescript
type ComponentStructExt<
    TStruct extends ComponentStruct<any> = ComponentStruct<any>,
    TInternalStruct extends Skip<ComponentStructBase<TStruct['msg']>, 'msgScope'> = ...
> = {
    props?: TStruct['props'] & TInternalStruct['props'];
    actions?: TStruct['actions'] & TInternalStruct['actions'];
    effects?: TStruct['effects'] | TInternalStruct['effects'];
    children?: TStruct['children'] & TInternalStruct['children'];
    msgScope: TStruct['msgScope'];
    msg: TStruct['msg'];
};
```

### `ComponentMsgFilter`
Enum for scoping message delivery within the component tree hierarchy:

```typescript
export enum ComponentMsgFilter {
    None = 0,
    FromAncestors = 1 << 0,   // Only receive messages from ancestor components
    FromDescendants = 1 << 1, // Only receive messages from descendant/child components
}
```

Configured via `componentFilter` in `msgBroker.provide` or `msgBroker.subscribe` definitions:
```typescript
msgBroker: {
    subscribe: {
        'MY.CHANNEL': {
            in: {
                componentFilter: ComponentMsgFilter.FromDescendants,
                callback: (msg) => { ... },
            },
        },
    },
}
```

### `ComponentProp<T>`
Configuration object for fine-grained property behavior and reactivity:

```typescript
type ComponentProp<T = any> = {
    readonly initialValue?: T;
    readonly validator?: Validator<T>;
    isDisabled?: boolean;
    isReadOnly?: boolean;
    /** Controls reactivity of this prop:
     * - `true` (default): fully reactive, proxy tracks all depths
     * - `false`: not reactive at all (zero proxy overhead)
     * - `'shallow'`: container is reactive (array mutations tracked), items are not proxied
     * - `'ref'`: reassignment is tracked, the value is stored by reference and never converted or proxied
     */
    readonly reactive?: true | false | 'shallow' | 'ref';
};
```

Declare it with `prop(...)` (`import { prop } from '@actdim/dynstruct/componentModel/core'`); a plain object literal
in `def.props` is treated as the prop value, not as a `ComponentProp`. `'ref'` is meant for React content slots
(`ReactNode`, component types) and third-party objects; a top-level `'ref'` prop without `initialValue` starts as
`undefined`. React objects present at creation are stored by reference even without it (see
[React Integration](./topic--04-react-integration.md)).

### Data Binding Primitives: `bind`, `bindProp`, `ValueConverter`

```typescript
// 1. Functional two-way binding
function bind<T, TFrom = any>(
    get: () => T,
    set?: (value: T) => void,
    converter?: ValueConverter<T, TFrom>
): Binding<T, TFrom>;

// 2. Property path binding
function bindProp<T extends object, P extends KeyPath<T, boolean>>(
    target: () => T,
    path: P
): Binding;

// 3. Bidirectional Value Converter
type ValueConverter<TTo, TFrom> = {
    convert: (value: TFrom) => TTo;
    convertBack: (value: TTo) => TFrom;
};
```

### External State Tracking: `fromExternalStore`

```typescript
function fromExternalStore<T>(
    subscribe: (onChange: () => void) => () => void,
    getSnapshot: () => T,
    name?: string,
): () => T;
```

Makes external (non-model) state trackable without importing MobX: calling the returned reader inside an observer view, binding getter, computed prop, or effect re-runs it when the store calls `onChange`. Same contract as React `useSyncExternalStore`. Subscribes only while observed (0 listeners when unmounted or outside reactions).

Example with a module-level service:
```typescript
import { fromExternalStore } from '@actdim/dynstruct/componentModel/core';
import { authService } from './authService';

const readCurrentUser = fromExternalStore(
    authService.subscribe,
    authService.getCurrentUser,
    'currentUser',
);

// In a dynstruct view or binding:
view: () => <div>Hello, {readCurrentUser()?.name}</div>
```

### Declarative Routing: `createNavigationRoute`

```typescript
function createNavigationRoute<TParams extends NavRouteParams = NavRouteParams>(options: {
    pattern: string;
    element: any;
    defaultParams?: TParams;
}): NavRoute<TParams>;
```

### `ComponentEvents<TStruct>`
Explicit component lifecycle hooks and property change interceptors:

| Hook | Type Signature | Trigger Phase |
|---|---|---|
| `onInit` | `(c: Component) => void \| Promise<void>` | Pre-mount phase. Initialize state before first render. |
| `onLayoutReady` | `(c: Component) => void \| Promise<void>` | Synchronously after DOM mutations, before paint. |
| `onReady` | `(c: Component) => void \| Promise<void>` | Mounted. Primary place for initial async data loading. |
| `onLayoutDestroy` | `(c: Component) => void \| Promise<void>` | Pre-unmount. Cleanup layout-related observers. |
| `onDestroy` | `(c: Component) => void \| Promise<void>` | Unmounted. Cleanup non-bus resources. |
| `onCatch` | `(err: unknown, c: Component) => void` | Error boundary hook for view or effect errors. |
| `onValidate` | `(c: Component) => Promise<ValidationResult>` | Component-wide form validation handler. |
| `onPropChanging` | `(prop, oldVal, newVal) => boolean` | Global guard: returning `false` aborts property update. |
| `onPropChange` | `(prop, val) => void` | Global post-change notification. |
| `onChanging<Prop>` | `(oldVal, newVal) => boolean` | Property-specific guard: returning `false` aborts update. |
| `onChange<Prop>` | `(newVal) => void` | Property-specific change notification. |
| `onGet<Prop>` | `() => PropType` | Custom getter interceptor. |

### `ComponentDef<TStruct, TMsgHeaders>`
Implementation definition passed to `useComponent`:

```typescript
type ComponentDef<
    TStruct extends ComponentStruct<any>,
    TMsgHeaders extends ComponentMsgHeaders = ComponentMsgHeaders,
> = {
    regType?: string;
    props?: ComponentProps<TStruct['props']>;
    actions?: TStruct['actions'];
    effects?: Record<TStruct['effects'][number], (c: Component<TStruct, TMsgHeaders>) => void | (() => void)>;
    children?: ComponentDefChildren<TStruct['children']>;
    events?: ComponentEvents<TStruct, TMsgHeaders>;
    msgBroker?: ComponentMsgBroker<TStruct, TMsgHeaders>;
    msgBus?: MsgBus<TStruct['msg'], TMsgHeaders>;
    view?: (props: ComponentViewProps, c?: Component<TStruct, TMsgHeaders>) => unknown;
    fallbackView?: (props: ComponentViewProps, c?: Component<TStruct, TMsgHeaders>) => unknown;
    useErrorBoundary?: boolean;
};
```

### `Component<TStruct, TMsgHeaders>`
Instance interface returned by `useComponent`:

- **Identity & Tree**:
  - `c.id`: Runtime unique identifier.
  - `c.key`: Component key.
  - `c.regType`: Registered type name.
  - `c.parentId`: Parent component ID.
  - `c.getParent()`, `c.getChildren()`, `c.getChainUp()`, `c.getChainDown()`, `c.getNodeMap()`, `c.getHierarchyId()`: Tree navigation methods.
- **Model & State**:
  - `c.model`: Reactive model instance (access props and actions directly, e.g. `c.model.counter`).
  - `c.model.$`: Component runtime state (`isDisabled`, `isReadOnly`, `isVisible`, `isValid`, `pendingRequestCount`, `errors`, `propState`).
- **Communication & Lifecycle**:
  - `c.msgBus`: Lifecycle-scoped message bus wrapper (auto-unwraps MobX observables, manages `abortSignal`, sets `headers.sourceId`).
  - `c.msgBroker`: Message broker configuration.
  - `c.abortSignal`: Lifecycle `AbortSignal` triggered on unmount. It is per-mount: a new signal is created each time the view mounts (including the React StrictMode simulated re-mount), and it is `null` before the first mount.
- **Params**: applied once, at creation - a plain value is an initial value, a binding is a live channel; `$events` / `$id` / `$key` are service keys and are not stored in the model (see [Params: Initial Values vs Live Bindings](./topic--04-react-integration.md#8-params-initial-values-vs-live-bindings)). `$events` passed via `ComponentParams` (e.g. through `toReact`) are refreshed on every commit - handlers supplied or replaced on later renders are used, including `onPropChanging` / `onPropChange` / `onGetX`.
  - `c.effects`: Effect controllers with `.pause()`, `.resume()`, and `.stop()`.
- **Rendering & Forms**:
  - `c.View`: React component view slot (`<c.View />`).
  - `c.children`: Child component view slots.
  - `c.validate(propPath?)`: Run property validators.
  - `c.mapToEdit(propPath?, exclude?)`: Generate two-way form input bindings (`value`, `onChange`, `onBlur`).
  - `c.run(handler, silent)`: Executes async handlers within component error and pending request tracking.
  - `c[Symbol.dispose]()`: Manual disposal cleanup.

---

## Networking and API Clients

### `HttpClient`

`HttpClient` is the base class for typed API service clients:
- `fetch<T>(options: IRequestOptions): Promise<T>`: Performs HTTP request with error handling and optional auth.
- Injects auth headers when `useAuth: true`.
- Automatically disposes pending requests on unmount.

### `HttpClientError<TDetails>`

Error thrown on HTTP failure statuses (4xx/5xx):
- `status?: number`: HTTP status code.
- `name: string`: Identifier name (e.g. `HTTP_STATUS_400`).
- `message: string`: Diagnostic message for logging and debugging.
- `details?: TDetails`: Parsed response body (object or string).
- `code?: string`: Server machine error code (`details.errorCode`).
- `params?: Readonly<Record<string, string | number>>`: Structured interpolation parameters from `details.params`.
- `cause?: TDetails`: Populated with response details.

> [!IMPORTANT]
> **UI Error Localization Rule**: Client user-facing error text must always be derived from `code` (and formatted using `params`), never from `message`. `message` contains server English diagnostic text.

---

## Storybook Integration

`dynstruct` components can be documented and tested visually using Storybook.

Run Storybook locally:

```bash
pnpm run storybook
```

Build Storybook static site:

```bash
pnpm run build-storybook
```

Example Storybook story:

```typescript
import { Meta, StoryObj } from '@storybook/react';
import { Counter } from './Counter';

const meta: Meta<typeof Counter> = {
    title: 'ComponentModel/Counter',
    component: Counter,
};
export default meta;

export const Default: StoryObj<typeof Counter> = {
    args: {
        counter: 10,
    },
};
```

---

## Development & Testing

### Running Unit Tests

Run all Vitest tests (Node.js suite, then React suite):

```bash
pnpm run test
```

Watch mode (Node.js suite):

```bash
pnpm run test:w
```

Single suite: Node.js (`test:node`) or React environment (`test:react`):

```bash
pnpm run test:node
pnpm run test:react
```

### Type Checking & Linting

```bash
pnpm run typecheck
pnpm run lint
```

---

## License

MIT License. See `LICENSE` for details.

---

[← Back to 04. React Integration](./topic--04-react-integration.md) | [Back to Main README](../README.md)
