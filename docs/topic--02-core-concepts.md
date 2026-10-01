---
protocol: along
slug: 02-core-concepts
title: Core Concepts
type: topic
created: 2026-08-31
updated: 2026-09-10
tags: [02-core-concepts]
---

# Core Concepts

[← Back to 01. Overview & Advantages](./topic--01-overview-and-advantages.md) | [Next: 03. Architecture & Wiring →](./topic--03-architecture-and-wiring.md)

---

## Component Structure

The first step in the `dynstruct` architectural pattern is defining the **component structure**. The base generic class `ComponentStruct` acts as a structural constructor - a scaffold that provides constraints, hints, and full IntelliSense to the developer when forming the base type contract. All derived component model APIs are built on top of this contract through TypeScript's type system.

**Crucially, component structures are pure type declarations** - they require no implementations (hook-constructors), only type information. This means you can define the entire application's component hierarchy at the type level before writing a single line of runtime code.

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
| `children` | Names and types of child components. Uses base structures of other components - **no implementations required, only type data**. |
| `msgScope` | Message bus channels this component works with. Sections: `subscribe`, `publish`, `provide`. Narrows the global bus scope to this component's responsibility zone. |
| `effects` | List of effect names available in this component. Implementations are defined in `ComponentDef`. |

### Public vs. Internal Contracts (`ComponentStructExt`)

In real-world applications, placing transient state (e.g. `isLoading`, `cache`, `expandedKeys`) directly into `props` of `ComponentStruct` pollutes the public component interface. Callers would be able to pass `<MyComponent isLoading={true} />` in JSX, violating encapsulation.

Use `ComponentStructExt` to cleanly separate the **Public Contract** (inputs accepted from parent and public message scope) from the **Internal Implementation Contract** (private state, internal actions, private effects):

```typescript
import {
    type ComponentStruct,
    type ComponentStructExt,
} from '@actdim/dynstruct/componentModel/contracts';

// 1. Public Contract: exported for parents and JSX callers
export type DriveTreeStruct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            selectedDriveId?: string;
            selectedPath?: string;
            onSelectNode?: (drive: VfsDrive, node: VfsNode) => void;
        };
        msgScope: {
            publish: AppMsgChannels<'API.VFS.GETDRIVES' | 'API.VFS.GETNODES'>;
        };
    }
>;

// 2. Internal Contract: private to component implementation
type InternalState = {
    props: {
        drives: VfsDrive[];
        loadingDrives: boolean;
        expandedKeys: Record<string, boolean>;
        nodesCache: Record<string, VfsNode[]>;
    };
    actions: {
        loadDrives: () => Promise<void>;
        toggleFolder: (drive: VfsDrive, path: string) => Promise<void>;
    };
};

// 3. Merged Struct: used inside the hook-constructor
type Struct = ComponentStructExt<DriveTreeStruct, InternalState>;
```

### Granular Reactivity Control (`reactive: 'shallow' | false`)

By default, Dynstruct properties are deeply reactive - the internal proxy recursively tracks all nested objects and array elements. For large collections, deep trees (like file system nodes), or heavy read-only payloads, deep proxying introduces unnecessary memory and CPU overhead.

Configure reactivity per property using `ComponentProp<T>`:

```typescript
import { type ComponentDef } from '@actdim/dynstruct/componentModel/contracts';

const def: ComponentDef<Struct> = {
    props: {
        // Deep reactive by default
        counter: 0,

        // 'shallow': container mutations (push, pop, filter) are tracked,
        // but items within nodesCache are NOT proxied deeply
        nodesCache: {
            initialValue: {},
            reactive: 'shallow',
        },

        // false: completely disable reactivity tracking for static configurations
        staticConfig: {
            initialValue: { bufferSize: 1024 },
            reactive: false,
        },
    },
};
```

### Data Binding Primitives (`bind`, `bindProp`, `ValueConverter`)

Dynstruct provides first-class reactive data binding primitives:

1. **`bind(get, set?, converter?)`**:
   Binds a property to an arbitrary reactive getter and optional setter.

```typescript
import { bind, type ValueConverter } from '@actdim/dynstruct/componentModel/core';

// Two-way binding between parent model and child input
const childInput = useTextField({
    value: bind(
        () => m.username,
        (val) => { m.username = val; }
    ),
});

// With ValueConverter: converts number model to string input and back
const stringToNumberConverter: ValueConverter<string, number> = {
    convert: (val: number) => String(val),
    convertBack: (str: string) => Number(str) || 0,
};

const scoreInput = useTextField({
    value: bind(
        () => m.score,
        (val) => { m.score = val; },
        stringToNumberConverter
    ),
});
```

2. **`bindProp(target, path)`**:
   Type-safe path-based binding to an object or component model:

```typescript
import { bindProp } from '@actdim/dynstruct/componentModel/core';

const nameInput = useTextField({
    value: bindProp(() => m, 'user.profile.name'),
});
```

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
    return c; // returned as Component<Struct> - ImplStruct stays private
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

Dynstruct eliminates manual `onChange` and `value` boilerplate using `c.mapToEdit()`:

```typescript
// Binds input value, onChange, onBlur directly to model property
<input type="email" {...c.mapToEdit('userInfo.email')} />

// With excluded handlers (e.g. if custom onBlur is needed)
<input type="text" {...c.mapToEdit('username', ['onBlur'])} />
```

`c.mapToEdit` automatically:
- Syncs the DOM input's `event.target.value` to the reactive model property.
- Triggers field validators configured in `ComponentProp.validator`.
- Updates `c.model.$.propState['userInfo.email']` with validation errors and status.
- Integrates seamlessly with Material UI / MUI components: `<TextField {...c.mapToEdit('username')} />`.

### Child Component Composition & Typed Slots (`c.children`)

When child components are declared in `Struct.children`, Dynstruct provides typed child accessors in two casing styles:

```typescript
type ParentStruct = ComponentStruct<AppMsgStruct, {
    children: {
        header: HeaderStruct;
        sidebar: SidebarStruct;
    };
}>;
```

Inside the parent hook-constructor and view:
- **Capitalized (`c.children.Header`, `c.children.Sidebar`)**: Directly renders the child component view slot in JSX:
  ```tsx
  view: () => (
      <div>
          <c.children.Header />
          <main>
              <c.children.Sidebar />
          </main>
      </div>
  )
  ```
- **Lowercase (`c.children.header`, `c.children.sidebar`)**: Provides programmatic access to the child component instance and its reactive model:
  ```typescript
  // Access child model directly from parent logic
  console.log(c.children.header.model.title);
  ```

---

## Component Events & Lifecycle (`events` vs. Hooks)

Dynstruct uses explicit lifecycle hooks declared in `def.events`. They replace built-in React lifecycle hooks (`useEffect`, `useLayoutEffect`, `useState`, `useReducer`) in typical components, so those are not needed there. Hooks are not banned, though: custom and third-party hooks are allowed as long as they respect the component model (see [Hooks Policy](./topic--04-react-integration.md)).

| Event Hook | Phase | Typical Use Case |
|---|---|---|
| `onInit` | Pre-mount | Setup synchronous defaults, validate initial params. |
| `onLayoutReady` | Layout ready | Measure DOM elements before browser paint. |
| `onReady` | Mounted | Trigger asynchronous data loading, subscribe to bus events. Replaces `useEffect(..., [])`. |
| `onLayoutDestroy` | Pre-unmount | Clean up layout observers, measurements. |
| `onDestroy` | Unmounted | Clean up non-bus resources (bus subscriptions in `c.msgBus` are auto-disposed). |
| `onCatch` | Error Boundary | Catch unhandled exceptions in component view or effects. |
| `onValidate` | Validation | Run component-wide multi-property validation. |

```typescript
const def: ComponentDef<Struct> = {
    events: {
        onReady: async (component) => {
            // Data loading on component mount
            await m.actions.loadInitialData();
        },
        onDestroy: (component) => {
            // Cleanup timers or external subscriptions
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
