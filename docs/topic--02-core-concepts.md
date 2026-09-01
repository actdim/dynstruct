---
protocol: along
protocol_version: "2.2.5"
slug: topic--02-core-concepts
title: Core Concepts
type: topic
created: 2026-08-31
updated: 2026-08-31
tags: [02-core-concepts]
---

# Core Concepts

[← Back to 01. Overview & Advantages](./topic--01-overview-and-advantages.md) | [Next: 03. Architecture & Wiring →](./topic--03-architecture-and-wiring.md)

---

## Component Structure

The first step in the `dynstruct` architectural pattern is defining the **component structure**. The base generic class `ComponentStruct` acts as a structural constructor — a scaffold that provides constraints, hints, and full IntelliSense to the developer when forming the base type contract. All derived component model APIs are built on top of this contract through TypeScript's type system.

**Crucially, component structures are pure type declarations** — they require no implementations (hook-constructors), only type information. This means you can define the entire application's component hierarchy at the type level before writing a single line of runtime code.

```typescript
type Struct = ComponentStruct<
    AppMsgStruct,
    // The message bus structure that will serve as the basis for the
    // component's msgBroker operation. This type maps to Struct["msg"].
    {
        props: {
            // Names and types of component properties that will be reactive
            // (including nested values) after the component is created.
            counter: number;
            message: string;
            items: Item[];
        };

        actions: {
            // Method signatures that perform operations on properties.
            // Action calls are optimized for batching reactive property
            // change application.
            increment: () => void;
            updateMessage: (text: string) => void;
        };

        children: {
            // Names and types of child components.
            // Types are base structures of other components. No implementations needed.
            header: HeaderStruct;
            footer: FooterStruct;
            todoList: TodoListStruct;
        };

        msgScope: {
            // Message bus channel names this component works with.
            subscribe: AppMsgChannels<'USER-UPDATED' | 'DATA-LOADED'>;
            publish: AppMsgChannels<'FORM-SUBMITTED'>;
            provide: AppMsgChannels<'GET-USER-DATA' | 'VALIDATE-INPUT'>;
        };

        // List of effect names that will be available in this component.
        effects: ['computeSummary', 'trackCounter'];
    }
>;
```

| Field | Description |
|---|---|
| `props` | Reactive property names and types. All declared properties (including nested values) become reactive after component creation. |
| `actions` | Method signatures that operate on props. Action calls are optimized for batching reactive property change application. |
| `children` | Names and types of child components. Uses base structures of other components — **no implementations required, only type data**. |
| `msgScope` | Message bus channels this component works with. Sections: `subscribe`, `publish`, `provide`. Narrows the global bus scope to this component's responsibility zone. |
| `effects` | List of effect names available in this component. Implementations are defined in `ComponentDef`. |

---

## Component Definition

The component implementation is created inside a **hook-constructor** function (`use<ComponentName>`) using the `ComponentDef<Struct>` type:

```typescript
const useMyComponent = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        regType: 'MyComponent',

        props: {
            counter: 0,
            message: 'Hello',
            items: [],
        },

        actions: {
            increment: () => { m.counter++; },
            updateMessage: (text) => { m.message = text; },
        },

        effects: {
            computeSummary: (component) => {
                m.message = `Total items: ${m.items.length}`;
                return () => { /* cleanup */ };
            },
            trackCounter: (component) => {
                if (m.counter > 100) m.message = 'Counter is high!';
            },
        },

        children: {
            header: useHeader({ title: bind(() => m.message) }),
            footer: useFooter({ year: 2025 }),
            todoList: useTodoList({
                items: bind(
                    () => m.items,
                    v => { m.items = v; }
                ),
            }),
        },

        events: {
            onInit: (component) => { console.log('Initialized'); },
            onChangeCounter: (value) => {
                if (value > 100) m.message = 'Counter is high!';
            },
        },

        msgBroker: {
            provide: {
                'GET-USER-DATA': {
                    in: {
                        callback: (msgIn, headers, component) => {
                            return { userId: '1', name: 'Alice', email: 'a@b.c' };
                        },
                    },
                },
            },
            subscribe: {
                'USER-UPDATED': {
                    in: {
                        callback: (msg, component) => {
                            console.log('User updated:', msg.payload);
                        },
                        componentFilter: ComponentMsgFilter.FromDescendants,
                    },
                },
            },
        },

        view: () => (
            <div>
                <h3>{m.message}</h3>
                <p>Counter: {m.counter}</p>
                <c.children.Header />
                <c.children.TodoList />
                <c.children.Footer />
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

---

## Implementation Extension (`ComponentStructExt`)

When a component's implementation grows complex, you can extend the component struct **inside the hook-constructor** using `ComponentStructExt`. The extended type is only visible within that function; callers receive `Component<Struct>` and see only the original public API:

```typescript
export const useComponentStateExample = (params: ComponentParams<Struct>): Component<Struct> => {
    type ImplStruct = ComponentStructExt<
        Struct,
        {
            props: {
                data: string[];
                userInfo: { email: string; avatarUrl: string };
            };
            children: {
                section1: React.FC;
                section2: React.FC;
            };
        }
    >;

    let c: Component<ImplStruct>;
    let m: ComponentModel<ImplStruct>;

    const def: ComponentDef<ImplStruct> = {
        props: {
            data: [],
            userInfo: prop({ initialValue: { email: '', avatarUrl: '' } }),
        },
        children: {
            section1: () => <details>...form JSX...</details>,
            section2: () => <details>...busy-state JSX...</details>,
        },
        view: () => (
            <div>
                <c.children.Section1 />
                <c.children.Section2 />
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c; // returned as Component<Struct> — ImplStruct stays private
};
```

---

## Instance Internals (`ComponentImpl`)

For non-reactive per-instance data (caches, locks, lazily-initialized resources) that must survive re-renders without triggering UI updates, use `ComponentImpl` and the `c._` slot:

```typescript
export const useStorageService = (params: ComponentParams<Struct>): Component<Struct> => {
    type Internals = { store?: PersistentStore; };

    let c: ComponentImpl<Struct, Internals>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        events: {
            onReady: async () => { c._.store = await PersistentStore.open(m.storeName); },
        },
    };

    c = useComponent(def, params, {} as Internals);
    m = c.model;
    return c;
};
```

---

## Component Identity (`id`, `regType`, `$key`)

Every component instance gets a unique runtime `c.id` generated by the framework. Apply it to the root DOM node for element tracking and testing:

```tsx
view: () => (
    <details id={c.id} open>
        ...
    </details>
)
```

| Param | Description |
|---|---|
| `regType` | Static component type identifier (e.g. `'UserCard'`). Auto-detected if omitted. |
| `$id` | Fully explicit ID override passed in `ComponentParams`. |
| `$key` | Domain key override (e.g. `$key="123"` produces ID `UserCard#123`). |

---

## Reactive Properties & Form Helpers

Properties declared in `def.props` are automatically reactive.

### Computed (Trackable) Properties
Use getters inside `def.props` to declare computed properties that automatically recalculate when their dependencies change:

```typescript
const def: ComponentDef<Struct> = {
    props: {
        firstName: 'John',
        lastName: 'Smith',
        get fullName() {
            return `${m.firstName} ${m.lastName}`.trim();
        },
    },
    view: () => <div>{m.fullName}</div>,
};
```

### Form Helpers: `validate()` and `mapToEdit()`
`c.mapToEdit('userInfo.email')` binds input elements directly to reactive model properties:

```tsx
<input type="email" {...c.mapToEdit('userInfo.email')} />
```

---

## Component Events & Error Handling

Component events handle lifecycle hooks (`onInit`, `onLayoutReady`, `onReady`, `onLayoutDestroy`, `onDestroy`), errors (`onCatch`), and property changes (`onChangeX`, `onChangingX`).

```typescript
const def: ComponentDef<Struct> = {
    events: {
        onReady: async (component) => {
            await loadInitialData();
        },
        onChangeEmail: (newValue) => {
            console.log('Email updated to:', newValue);
        },
        onCatch: (error, component) => {
            console.error('Component error:', error);
        },
    }
};
```

---

[← Back to 01. Overview & Advantages](./topic--01-overview-and-advantages.md) | [Next: 03. Architecture & Wiring →](./topic--03-architecture-and-wiring.md)
