---
protocol: along
slug: 03-[architecture](./topic--architecture.md)-and-wiring
title: Architecture & Wiring
type: topic
created: 2026-08-31
updated: 2026-09-10
tags: [03-architecture-and-wiring]
---

# Architecture & Wiring

[← Back to 02. Core Concepts](./topic--02-core-concepts.md) | [Next: 04. React Integration →](./topic--04-react-integration.md)

---

## Component Wiring

Wiring connects properties, actions, and child components together. `dynstruct` provides explicit mechanisms for data flow.

### 1. Direct Bindings (`bind` / `bindProp`)

Use `bind()` to pass reactive data from a parent component to a child component:

```typescript
// One-way reactive binding (parent -> child)
const child = useInput({
    value: bind(() => m.parentValue)
});

// Two-way reactive binding (parent <-> child)
const child = useInput({
    value: bind(
        () => m.parentValue,
        (newValue) => { m.parentValue = newValue; }
    )
});
```

### 2. Direct Model Mutation and `onChangeX` Handlers

Child components can trigger parent logic directly via property change handlers:

```typescript
events: {
    onChangeCounter: (newValue) => {
        // React to child or property changes
        console.log('Counter changed:', newValue);
    }
}
```

---

## Message Bus Communication

Components communicate over typed channels provided by `@actdim/msgmesh`. `@actdim/dynstruct` provides deep architectural integration with the message bus.

### Core Integration Principles

1. **Context-Driven Bus Distribution**:
   - In standard Dynstruct applications, `msgBus` is initialized at the application root via `<ComponentContextProvider value={{ msgBus }}>` (from `@actdim/dynstruct/componentModel/react/componentContext`). All descendant components receive `msgBus` automatically through the React component registry context.
   - Multiple context providers can be nested if isolated scopes are required, but in most cases a single unified or modular bus structure is optimal.
   - Because `@actdim/msgmesh` supports hierarchical dotted channel prefixes (`'API.USER.'`, `'APP.NAV.'`) and TypeScript provides powerful type composition (`ApiStruct & MsgStruct<LocalEvents> & BaseAppMsgStruct`), developers can distribute channel definitions across multiple modular files while maintaining unified compile-time type safety.
   - Therefore, without a specific architectural need, creating ad-hoc bus instances inside individual components or manually passing `msgBus` through props is unnecessary and adds boilerplate.

2. **Declarative Contracts (`msgScope` & `msgBroker`)**:
   - Declare communication channels on `ComponentStruct.msgScope` and register handlers in `ComponentDef.msgBroker`. Handlers are automatically bound on initialization and cleaned up on component unmount.
   - This keeps component inputs and outputs visible on the component struct at a glance rather than scattered in imperative hooks.

3. **Smart Component Proxy (`c.msgBus`)**:
   When sending messages or making requests imperatively inside actions, use `c.msgBus`. It wraps the underlying bus with essential framework conveniences:
   - **MobX Observable Unwrapping (`normalizePayload`)**: Payloads are automatically converted to plain structural copies before being placed on the bus, preventing reactive MobX proxies from leaking into message bus events.
   - **Automatic Lifecycle & Cancellation (`AbortSignal`)**: Subscriptions (`on`, `once`, `stream`) and pending `request()` / `provide()` calls are automatically linked to `component.abortSignal` and cleanly disposed of when the component unmounts.
   - **Provenance & Source Tracing**: Automatically populates `headers.sourceId = component.id`.
   - **Error Boundary & Pending State**: `c.msgBus.request(...)` runs within `component.run()`, tracking `component.model.$.pendingRequestCount` and routing unhandled rejections to `onCatch`.
   - **Hierarchical Scoping**: Handlers can use `componentFilter: ComponentMsgFilter.FromAncestors` or `ComponentMsgFilter.FromDescendants` to restrict message reception to the component subtree.

### Declaring `msgScope` and `msgBroker`

```typescript
type UserCardStruct = ComponentStruct<AppMsgStruct, {
    props: { userId: string };
    msgScope: {
        subscribe: AppMsgChannels<'USER.UPDATED'>;
        publish: AppMsgChannels<'USER.SELECTED'>;
        provide: AppMsgChannels<'GET.USER.DATA'>;
    };
}>;

const def: ComponentDef<UserCardStruct> = {
    props: { userId: params.userId },
    msgBroker: {
        subscribe: {
            'USER.UPDATED': {
                in: {
                    callback: (msg, component) => {
                        console.log('Received updated user:', msg.payload);
                    },
                },
            },
        },
        provide: {
            'GET.USER.DATA': {
                in: {
                    callback: (msgIn, msgOut, component) => {
                        return { id: m.userId, name: 'Alice' };
                    },
                },
            },
        },
    },
    actions: {
        selectUser: () => {
            // Imperative dispatch through component proxy
            c.msgBus.send({
                channel: 'USER.SELECTED',
                payload: { id: m.userId },
            });
        },
    },
};
```

### Architectural Comparison & Recommended Patterns

| Ad-Hoc / Imperative Pattern | Recommended Dynstruct Pattern | Key Advantage |
|---|---|---|
| Creating a local `createMsgBus()` inside a component | Rely on context injection from `<AppContextProvider>` | Unified monitoring, modular type composition, and reduced memory overhead |
| Passing `msgBus` down manually via component props | Access the smart proxy `c.msgBus` inside the component | Zero prop drilling, implicit availability at any tree depth |
| Calling `c.msgBus.on(...)` manually in `onReady` / `useEffect` | Declare subscriptions in `def.msgBroker.subscribe` | Clear component contracts, automatic lifecycle binding |
| Calling raw `msgBus` without unwrapping MobX observables | Use `c.msgBus` (automatically applies `normalizePayload`) | Prevents reactive proxy leaks across event subscribers |
| Manually unsubscribing in `onDestroy` | `c.msgBus` automatically cancels subscriptions on unmount | Zero leak risk via `component.abortSignal` |

---

## Parent-Child Relationships & Hierarchy Access

Parent components initialize child components in `def.children`:

```typescript
const useParent = (params: ComponentParams<ParentStruct>) => {
    let c: Component<ParentStruct>;

    const def: ComponentDef<ParentStruct> = {
        children: {
            child1: useChildComponent({ /* params */ }),
            child2: useChildComponent({ /* params */ }),
        },
        view: () => (
            <div>
                <c.children.Child1 />
                <c.children.Child2 />
            </div>
        ),
    };

    c = useComponent(def, params);
    return c;
};

// Hierarchy inspection methods (available after creation):
const parentId    = c.getParent();
const ancestors   = c.getChainUp();
const descendants = c.getChainDown();
```

---

## Effects

Effects are auto-tracking reactive functions that re-run automatically whenever any reactive property accessed inside them changes.

```typescript
type Struct = ComponentStruct<AppMsgStruct, {
    props: { count: number; title: string };
    effects: ['updateTitle'];
}>;

const def: ComponentDef<Struct> = {
    effects: {
        updateTitle: (component) => {
            // Automatically re-runs when m.count changes
            document.title = `Count: ${m.count}`;
            
            // Return optional cleanup function
            return () => { document.title = 'Original'; };
        }
    }
};
```

---

## Dynamic Content & Fragments

`dynstruct` embraces JSX natively:

### 1. Named JSX Fragments (`React.FC`)

Decompose large views into readable named JSX fragments:

```typescript
children: {
    sidebarFragment: () => <aside>Sidebar content</aside>
}
```

### 2. Factory Functions (Parameterized Dynamic Children)

Generate dynamic lists or items:

```typescript
children: {
    renderItem: (item: Item) => <li key={item.id}>{item.title}</li>
}
```

---

### Hierarchical Filtering (`ComponentMsgFilter`)

In complex component hierarchies (e.g. nested modal dialogs, tree view nodes, or sub-editors), components often need to process messages originating only from their own subtree or parent chain, rather than global broadcasts.

Use `componentFilter` in `msgBroker` subscriber and provider definitions:

```typescript
import { ComponentMsgFilter } from '@actdim/dynstruct/componentModel/contracts';

const def: ComponentDef<TreeFolderStruct> = {
    msgBroker: {
        subscribe: {
            'VFS.FOLDER.EXPAND': {
                in: {
                    // Only accept messages originating from child/descendant nodes
                    componentFilter: ComponentMsgFilter.FromDescendants,
                    callback: (msg, component) => {
                        console.log('Child folder requested expand:', msg.payload);
                    },
                },
            },
        },
        provide: {
            'UI.THEME.GET': {
                in: {
                    // Only provide theme values to descendants in this component subtree
                    componentFilter: ComponentMsgFilter.FromAncestors,
                    callback: (msg) => ({ theme: m.localTheme }),
                },
            },
        },
    },
};
```

---

## Declarative Routing & Navigation (`createNavigationRoute`, `APP.NAV.GOTO`)

Dynstruct decouples routing from React DOM hooks via `@actdim/dynstruct/appDomain/navigation`. Routes are defined as strongly typed structures, and navigation is performed through the `msgBus` rather than direct `useNavigate()` calls.

### 1. Defining Routes (`createNavigationRoute`)

Define routes using `createNavigationRoute` with parameterized types and path patterns (powered by `path-to-regexp`):

```typescript
import { type NavRoutes } from '@actdim/dynstruct/appDomain/commonContracts';
import { createNavigationRoute } from '@actdim/dynstruct/appDomain/navigation';
import { ExplorerPage } from './pages/explorer/ExplorerPage';
import { SignInPage } from './pages/auth/signIn/SignInPage';

export const appRoutes = {
    index: createNavigationRoute({
        pattern: '',
        element: <ExplorerPage />,
    }),
    explorer: createNavigationRoute({
        pattern: 'explorer',
        element: <ExplorerPage />,
    }),
    'auth/sign-in': createNavigationRoute<{
        callbackUrl?: string;
    }>({
        pattern: 'auth/sign-in',
        element: <SignInPage />,
    }),
} satisfies NavRoutes;

export type AppRoutes = typeof appRoutes;
```

Each navigation route provides:
- `.url(params?)`: Compiles path, query params, and hashes into a clean URL string.
- `.match(url)`: Matches a pathname and extracts strongly typed route parameters.
- `.element`: The associated component view element.

### 2. Navigating Over the Message Bus (`APP.NAV.GOTO`)

Application components initiate navigation via `c.msgBus.send({ channel: 'APP.NAV.GOTO', group: 'ex', payload: { route: '...' } })`. This keeps UI components completely decoupled from browser history and router implementations:

```typescript
// Navigate by route key and typed parameters (group: 'ex')
c.msgBus.send({
    channel: 'APP.NAV.GOTO',
    group: 'ex',
    payload: {
        route: 'auth/sign-in',
        params: { callbackUrl: window.location.href },
    },
});

// Navigate by raw path (group: 'in')
c.msgBus.send({
    channel: 'APP.NAV.GOTO',
    group: 'in',
    payload: {
        path: '/explorer',
    },
});
```

---

[← Back to 02. Core Concepts](./topic--02-core-concepts.md) | [Next: 04. React Integration →](./topic--04-react-integration.md)

