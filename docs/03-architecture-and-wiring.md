# Architecture & Wiring

[← Back to 02. Core Concepts](./02-core-concepts.md) | [Next: 04. React Integration →](./04-react-integration.md)

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

Components communicate over typed channels provided by `@actdim/msgmesh`.

### Declaring `msgScope` and `msgBroker`

```typescript
type UserCardStruct = ComponentStruct<AppMsgStruct, {
    msgScope: {
        subscribe: AppMsgChannels<'USER.UPDATED'>;
        publish: AppMsgChannels<'USER.SELECTED'>;
        provide: AppMsgChannels<'GET.USER.DATA'>;
    };
}>;

const def: ComponentDef<UserCardStruct> = {
    msgBroker: {
        subscribe: {
            'USER.UPDATED': {
                in: {
                    callback: (msg, component) => {
                        console.log('Received updated user:', msg.payload);
                    }
                }
            }
        },
        provide: {
            'GET.USER.DATA': {
                in: {
                    callback: (msgIn, headers, component) => {
                        return { id: '123', name: 'Alice' };
                    }
                }
            }
        }
    }
};
```

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

## Message Channels (`CommonAppMsgStruct`, `BaseSecurityMsgStruct`)

Built-in domain channel contracts simplify common application communication:

- **`CommonAppMsgStruct`**: Navigation (`APP.NAV.GOTO`), notifications (`APP.NOTIFY`), theme toggles.
- **`BaseSecurityMsgStruct`**: Auth tokens, login events, permission updates.

---

[← Back to 02. Core Concepts](./02-core-concepts.md) | [Next: 04. React Integration →](./04-react-integration.md)

