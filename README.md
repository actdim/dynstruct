# @actdim/dynstruct

Build scalable applications with dynamic structured components, explicit wiring, and decoupled message flow. Keep architecture clean and modular.

[![npm version](https://img.shields.io/npm/v/@actdim/dynstruct.svg)](https://www.npmjs.com/package/@actdim/dynstruct)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Getting Started (React)](#getting-started-react)
- [Core Concepts](#core-concepts)
  - [Component Structure](#component-structure)
  - [Component Definition](#component-definition)
  - [Reactive Properties](#reactive-properties)
  - [Component Events](#component-events)
    - [Lifecycle Events](#lifecycle-events)
    - [Error Handling](#error-handling)
    - [Property Change Events](#global-property-change-events)
  - [Effects](#effects)
  - [Dynamic Content](#dynamic-content)
  - [Component Wiring](#component-wiring)
  - [Message Bus Communication](#message-bus-communication)
  - [Parent-Child Relationships](#parent-child-relationships)
- [More Examples (React)](#more-examples-react)
  - [Service Integration](#service-integration-api-calls)
  - [Navigation](#navigation)
  - [Authentication & Security](#authentication--security)
- [Key Advantages](#key-advantages-react-examples)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Storybook Examples](#storybook-examples)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Overview

**@actdim/dynstruct** is a TypeScript-based component system and architectural framework for building large-scale, modular applications. It provides a structure-first, declarative approach to component design with:

- **Type-safe component model** with explicit dependency wiring
- **Decoupled messaging architecture** using a message bus for inter-component communication
- **Component lifecycle management** with proper initialization and cleanup
- **Automatic reactive state** - properties become reactive after component creation
- **Type-safe component events** - automatic event handlers for lifecycle and property changes with full IntelliSense
- **Built-in service integration** via adapter pattern
- **Parent-child component relationships** with message routing

### Framework Support

**Currently Supported:**
- ✅ **React** (with MobX for reactivity)

**Planned Support:**
- 🚧 **SolidJS** - In development
- 🚧 **Vue.js** - Planned

The architectural core is framework-agnostic, allowing the same component structures and patterns to work across different UI frameworks.

## Features

✨ **Structure-First Design** - Define components with explicit props, actions, children, and message channels

🔒 **Full Type Safety** - TypeScript generics throughout for compile-time verification

📡 **Message Bus Communication** - Decoupled component interaction via publish/subscribe pattern

⚡ **Reactive by Default** - Properties automatically trigger UI updates when changed

🔌 **Service Adapters** - Clean integration of backend services with message bus

🧩 **Modular Architecture** - Clear component hierarchies with parent-child relationships

🔄 **Lifecycle Management** - Proper initialization, layout, ready states, and cleanup

⚡ **Component Events** - Automatic type-safe event handlers for lifecycle and property changes

🎯 **Navigation & Routing** - Built-in navigation contracts with React Router integration

🔐 **Security Provider** - Authentication and authorization support

> Already familiar with React and MobX and wondering why dynstruct? → [See Key Advantages](#key-advantages-react-examples)

## Quick Start

Try @actdim/dynstruct instantly in your browser without any installation:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/~/github.com/actdim/dynstruct?file=src/_stories/componentModel/EffectDemo.tsx)

Once the project loads, run Storybook to see live examples:

```bash
pnpm run storybook
```

The core pattern is **structure-first composition**: parent component structures explicitly reference child component structures. All dependencies are visible at the type level — before writing a single line of runtime code. See [Core Concepts](#core-concepts) for the full picture.

## Installation

```bash
npm install @actdim/dynstruct
```

### Peer Dependencies

This package requires the following peer dependencies:
For message bus functionality, install [@actdim/msgmesh](https://www.npmjs.com/package/@actdim/msgmesh).

```bash
npm install react react-dom mobx mobx-react-lite mobx-utils \
  @actdim/msgmesh @actdim/utico react-router react-router-dom \
  rxjs uuid path-to-regexp jwt-decode http-status
```

Or with pnpm:

```bash
pnpm add @actdim/dynstruct @actdim/msgmesh @actdim/utico \
  react react-dom mobx mobx-react-lite mobx-utils \
  react-router react-router-dom rxjs uuid path-to-regexp \
  jwt-decode http-status
```

## Getting Started (React)

> **Note:** All examples below are for the **React** implementation. SolidJS and Vue.js versions will have similar structure with framework-specific adapters.

### 1. Define Child Components

First, create simple child components (Button and Input):

```typescript
// React implementation
import { ComponentStruct, ComponentDef, ComponentParams, Component, ComponentModel } from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react';
import { AppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';

// Button component structure
type ButtonStruct = ComponentStruct<AppMsgStruct, {
    props: {
        label: string;
        onClick: () => void;
    };
}>;

// Button hook-constructor
const useButton = (params: ComponentParams<ButtonStruct>) => {
    let c: Component<ButtonStruct>;
    let m: ComponentModel<ButtonStruct>;

    const def: ComponentDef<ButtonStruct> = {
        props: {
            label: 'Click',
            onClick: () => {},
        },
        view: () => (
            <button onClick={m.onClick}>{m.label}</button>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

// Input component structure
type InputStruct = ComponentStruct<AppMsgStruct, {
    props: {
        value: string;
        onChange: (v: string) => void;
    };
}>;

// Input hook-constructor
const useInput = (params: ComponentParams<InputStruct>) => {
    let c: Component<InputStruct>;
    let m: ComponentModel<InputStruct>;

    const def: ComponentDef<InputStruct> = {
        props: {
            value: '',
            onChange: (_: string) => {},
        },
        view: () => (
            <input
                value={m.value}
                onChange={(e) => m.onChange(e.target.value)}
            />
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

### 2. Define Parent Component with Children

The parent component structure **references child structures** - this makes dependencies explicit:

```typescript
// React implementation
// Parent component structure with children
type CounterPanelStruct = ComponentStruct<AppMsgStruct, {
    props: {
        counter: number;
        message: string;
    };
    children: {
        incrementBtn: ButtonStruct;    // References child structure
        resetBtn: ButtonStruct;        // References child structure
        messageInput: InputStruct;     // References child structure
    };
}>;

// Parent hook-constructor
const useCounterPanel = (params: ComponentParams<CounterPanelStruct>) => {
    let c: Component<CounterPanelStruct>;
    let m: ComponentModel<CounterPanelStruct>;

    const def: ComponentDef<CounterPanelStruct> = {
        props: {
            counter: 0,
            message: 'Hello',
        },
        // Component events with full IntelliSense support!
        events: {
            // Automatically typed event for 'message' property
            onChangeMessage: (oldValue, newValue) => {
                console.log(`Message changed from "${oldValue}" to "${newValue}"`);
                // You can also update other properties or sync with children
            },

            // Event for 'counter' property
            onChangeCounter: (oldValue, newValue) => {
                if (newValue > 10) {
                    m.message = 'Counter is getting high!';
                }
            }
        },
        // Children are created at runtime via their hook-constructors
        children: {
            incrementBtn: useButton({
                label: 'Increment',
                onClick: () => { m.counter++; }
            }),
            resetBtn: useButton({
                label: 'Reset',
                onClick: () => { m.counter = 0; }
            }),
            messageInput: useInput({
                value: bind(() => m.message, v => { m.message = v; })
            })
        },
        view: () => (
            <div>
                <h3>{m.message}</h3>
                <p>Counter: {m.counter}</p>
                <c.children.IncrementBtn />
                <c.children.ResetBtn />
                <c.children.MessageInput />
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

### 3. Using Components

**Primary way** - Use as children in parent components (shown above).

**Alternative way** - Use `toReact` adapter for integration with standard React:

```typescript
// React adapter
// Create React adapter (only when needed for standard React integration)
export const CounterPanel = toReact(useCounterPanel);

// Now can be used in standard React components
function App() {
    return (
        <div>
            <CounterPanel counter={5} message="Welcome!" />
        </div>
    );
}
```

**Note**: `toReact` is an adapter for compatibility with standard React components. The **primary pattern** is to use components through `children` property in parent structures, as this makes all dependencies explicit at the type level.

## Core Concepts

### Component Structure

The first step in the dynstruct architectural pattern is defining the **component structure**. The base generic class `ComponentStruct` acts as a structural constructor — a scaffold that provides constraints, hints, and full IntelliSense to the developer when forming the base type contract. All derived component model APIs are built on top of this contract through TypeScript's advanced type system.

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
            // Types are base structures (similar to this one) of other components.
            // No implementations (hook-constructors) are required to form the
            // structure — only type data.
            header: HeaderStruct;
            footer: FooterStruct;
            todoList: TodoListStruct;
        };

        msgScope: {
            // Message bus channel names this component works with.
            // Divided into sections: subscribe, publish, provide.
            // See @actdim/msgmesh documentation for details.
            //
            // msgScope narrows the bus working area (it is normal to use a
            // global app-wide bus) to this component's zone of responsibility.
            // This not only makes working with the bus more convenient
            // (the namespace is not polluted by other channels), but also
            // lets you immediately see the component's message scope.

            // Channels this component subscribes to (consumes messages from)
            subscribe: AppMsgChannels<'USER-UPDATED' | 'DATA-LOADED'>;

            // Channels this component publishes messages to
            publish: AppMsgChannels<'FORM-SUBMITTED'>;

            // Channels for which this component is a response-message
            // provider ("out" groups) for request-messages ("in" groups)
            provide: AppMsgChannels<'GET-USER-DATA' | 'VALIDATE-INPUT'>;
        };

        // List of effect names that will be available in this component.
        // Effect implementations are defined in ComponentDef (see below).
        effects: ['computeSummary', 'trackCounter'];
    }
>;
```

| Field | Description |
|---|---|
| `props` | Reactive property names and types. All declared properties (including nested values) become reactive after component creation. |
| `actions` | Method signatures that operate on props. Action calls are optimized for batching reactive property change application. |
| `children` | Names and types of child components. Uses base structures of other components — **no implementations required, only type data**. |
| `msgScope` | Message bus channels this component works with. Sections: `subscribe` (incoming message subscriptions), `publish` (outgoing message channels), `provide` (response provider for request-messages). Narrows the global bus scope to this component's responsibility zone. See [@actdim/msgmesh](https://www.npmjs.com/package/@actdim/msgmesh) documentation. |
| `effects` | List of effect names available in this component. Implementations are defined in `ComponentDef`. |

### Component Definition

The component implementation is created inside a **hook-constructor** function (`use<ComponentName>`) using the `ComponentDef<Struct>` type. This is where you provide the runtime implementation for the contract declared in the structure:

```typescript
const useMyComponent = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        // Component type identifier used when registering in the component tree.
        // Also used to form the component instance ID, which can be used
        // (manually) as an HTML id in the component's markup.
        regType: 'MyComponent',

        props: {
            // Default values for properties. Provided params are applied
            // automatically by the framework — no need to read them here.
            counter: 0,
            message: 'Hello',
            items: [],
        },

        actions: {
            // Method implementations (signatures match those declared
            // in the component structure). Actions perform operations on
            // properties; their calls are optimized for batching reactive
            // property change application.
            increment: () => { m.counter++; },
            updateMessage: (text) => { m.message = text; },
        },

        effects: {
            // Effect implementations. Effects are auto-tracking reactive
            // functions that re-run automatically whenever any reactive
            // property accessed inside them changes.
            //
            // Effects are accessed on the component instance by name via
            // the `effects` property (e.g. c.effects.computeSummary).
            //
            // An effect runs immediately when the component is created and
            // can later be manually paused, resumed, or stopped entirely.
            computeSummary: (component) => {
                // Re-runs whenever m.items changes
                m.message = `Total items: ${m.items.length}`;
                // Return an optional cleanup function
                return () => { /* cleanup */ };
            },
            trackCounter: (component) => {
                // Re-runs whenever m.counter changes
                if (m.counter > 100) m.message = 'Counter is high!';
            },
        },

        children: {
            // Child component instances created via their hook-constructors
            // (use*). When creating children you can initialize their
            // properties, including bindings, and assign additional (external)
            // event handlers.
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
            // Component event handlers. The type system offers a choice of
            // all supported events. See the Component Events section below
            // for the full list.
            onInit: (component) => { console.log('Initialized'); },
            onChangeCounter: (value) => {
                if (value > 100) m.message = 'Counter is high!';
            },
        },

        msgBroker: {
            // Message bus handlers declared in the component structure.
            // Defined by channels and groups in sections:
            provide: {
                // Response-message providers ("out" groups)
                // for request-messages ("in" groups).
                'GET-USER-DATA': {
                    in: {
                        callback: (msgIn, headers, component) => {
                            return { userId: '1', name: 'Alice', email: 'a@b.c' };
                        },
                    },
                },
            },
            subscribe: {
                // Handlers for incoming messages.
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

        // Message bus instance. If not specified, the bus from the
        // available component model context will be used.
        // The bus must be compatible with the message structure
        // declared in the component structure.
        msgBus: undefined,

        // Component render function that produces the view (JSX).
        // Uses automatic JSX components created for child components
        // (accessed via component.children.*.View).
        // This function is intended to be compact since all wiring
        // and initialization code is distributed across other
        // definition areas. Inline props should be used only in a
        // functional wrapper component created via toReact (or a
        // similar adapter) to integrate dynstruct into regular
        // components (for example, at the app root level). Using such
        // components directly inside dynstruct view functions
        // keeps child parameter wiring mixed into render code instead
        // of a dedicated children block, reduces compactness and
        // readability, increases side-effect risk, and harms
        // predictable reactivity.
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

| Field | Description |
|---|---|
| `regType` | Component type identifier used when registering in the component tree. Also used to form the instance ID (can be used as HTML `id`). |
| `props` | Default property values. Provided `params` are applied automatically by the framework on top of these defaults — no manual `params.x ?? default` needed. |
| `actions` | Method implementations (signatures match the structure). Optimized for batching reactive property changes. |
| `effects` | Effect implementations — methods that run automatically when any property accessed within them changes. An effect runs on component creation and can be paused, resumed, or stopped via `c.effects.<name>`. Returns an optional cleanup function. |
| `children` | Child component instances created via hook-constructors (`use*`). Properties can be initialized with values or bindings; external event handlers can be assigned. |
| `events` | Component event handlers (lifecycle, property changes). See [Component Events](#component-events). |
| `msgBroker` | Message bus handlers for channels declared in the structure. Contains `provide` (response providers) and `subscribe` (message handlers) sections. Handlers are registered through the component-scoped `msgBus`, so unmount cleanup semantics are applied to broker channels as well. |
| `msgBus` | Explicit message bus instance. If omitted, the bus from the component model context is used. Must be compatible with the declared message structure. The component uses a lifecycle-scoped `msgBus` wrapper: on unmount, subscriptions are automatically canceled and pending requests are aborted via `AbortSignal`. |
| `view` | Render function `() => JSX`. Uses the closed-over `c` and `m` variables declared at the top of the hook-constructor. Children rendered as `<c.children.Name />` (Capitalized). Intended to be compact — logic lives in other definition areas. |
| `fallbackView` | Optional error fallback `(props, component) => JSX`. Rendered instead of `view` when `useErrorBoundary: true` is set and the component catches an error. |

### Reactive Properties

Component properties are **automatically reactive** after component creation with `useComponent`. Any changes to properties will trigger UI updates:

```typescript
const def: ComponentDef<Struct> = {
    props: {
        counter: 0,
        message: 'Hello'
    },
    actions: {
        increment: () => {
            m.counter++; // Automatically triggers re-render
        }
    }
};

const c = useComponent(def, params);
const m = c.model; // m.counter and m.message are reactive
```

### Component Events

The component model provides **automatic type-safe event handlers** for the component lifecycle and property changes. IntelliSense automatically suggests all available events based on the component structure.

The full set of supported events is defined by the `ComponentEvents<TStruct>` type and is divided into three groups: **lifecycle events**, **global property change events**, and **property-specific events**.

#### Lifecycle Events

All lifecycle handlers may be `async` (return `MaybePromise<void>`). All are wrapped by the framework's error router — both sync throws and async rejections propagate to `onCatch`.

| Event | React equivalent | When |
|---|---|---|
| `onInit` | — | Called **once** when the component instance is first created, before any render. `model` and `children` are available. Use for one-time synchronous setup that does not require the DOM. |
| `onLayoutReady` | `useLayoutEffect` | Called after the component's DOM nodes are inserted into the document, **before** the browser paints. Runs synchronously — suitable for DOM measurements or scroll/focus operations. |
| `onReady` | `useEffect` | Called after the browser has painted and the component is visible. The primary hook for async work: data fetching, subscriptions, timers. |
| `onLayoutDestroy` | `useLayoutEffect` cleanup | Called synchronously when the component is about to be removed from the DOM. Mirror of `onLayoutReady`. |
| `onDestroy` | `useEffect` cleanup | Called after the component is unmounted. Release resources here. The component-scoped `msgBus` abort signal fires, automatically canceling subscriptions and pending `request(...)` calls. |
| `onCatch` | — | Central error handler. Called for errors from any lifecycle hook, effect body, property event handler, binding, or msgBus callback. See [Error Handling](#error-handling). |

```typescript
const def: ComponentDef<Struct> = {
    events: {
        // Once, before first render — sync setup only, no DOM access
        onInit: (component) => {
            console.log('created:', component.id);
        },

        // After DOM insertion, before paint — sync, for DOM measurements
        onLayoutReady: (component) => {
            const el = document.getElementById(component.id);
            console.log('height:', el?.offsetHeight);
        },

        // After paint, component visible — primary async hook
        onReady: async (component) => {
            await loadInitialData();
        },

        // Before DOM removal — sync
        onLayoutDestroy: (component) => {
            console.log('layout destroy');
        },

        // After unmount — release resources
        onDestroy: (component) => {
            console.log('destroyed');
        },

        // Catches errors from lifecycle hooks, effects, property handlers,
        // bindings, and msgBus callbacks
        onCatch: (component, error) => {
            console.error('component error:', error);
        },
    }
};
```

#### Error Handling

`onCatch` is the central error handler for a component. It is called in two situations:

**1. Errors from lifecycle hooks and other framework-managed calls**

The framework routes errors to `onCatch` from every call it wraps — synchronous throws and async rejections alike. This includes lifecycle hooks (`onInit`, `onLayoutReady`, `onReady`, `onLayoutDestroy`, `onDestroy`), **effect bodies** (`def.effects`), property event handlers, bindings, and msgBus callbacks. This is the primary pattern for handling errors from initial data loads or setup logic:

```typescript
type Struct = ComponentStruct<AppMsgStruct, {
    props: { status: 'idle' | 'loading' | 'error'; errorMessage: string };
}>;

const useMyComponent = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    async function load() {
        m.status = 'loading';
        m.errorMessage = '';
        await fetchData(); // may throw
        m.status = 'idle';
    }

    // Shared handler — used by both onCatch and manual try/catch below
    function handleError(err: unknown) {
        m.status = 'error';
        m.errorMessage = err instanceof Error ? err.message : String(err);
    }

    const def: ComponentDef<Struct> = {
        props: { status: 'idle', errorMessage: '' },
        events: {
            onReady: async () => {
                await load();
                // if load() throws, the framework calls onCatch automatically
            },
            onCatch: (_, err) => {
                handleError(err);
            },
        },
        view: () => (
            <div>
                {m.status === 'loading' && <span>Loading…</span>}
                {m.status === 'error' && <span style={{ color: 'red' }}>{m.errorMessage}</span>}
                {/* load() calls fetchData() — a plain async fn, not a dynstruct API.
                    It is not wrapped automatically, so we catch manually here. */}
                <button
                    disabled={m.status === 'loading'}
                    onClick={async () => {
                        try {
                            await load();
                        } catch (err) {
                            handleError(err); // same handler, called manually
                        }
                    }}
                >
                    Retry
                </button>
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

> **When `onCatch` is called automatically:** The framework routes errors to `onCatch` for every call that crosses the dynstruct API boundary — lifecycle hooks (`onInit`, `onLayoutReady`, `onReady`, `onLayoutDestroy`, `onDestroy`), actions (`def.actions` — wrapped in `runSafe` before MobX annotation so MobX handles batching and dynstruct handles errors), property event handlers (`onGetX`, `onChangingX`, `onChangeX`, `onPropChanging`, `onPropChange`), binding get/set functions, effect bodies, and msgBus subscriber/provider callbacks and `request(...)` calls.
>
> **When manual `try/catch` is needed:** A raw function called in an `onClick` that does not use any dynstruct API. In the pattern above, `load()` calls a plain `fetchData()` helper — so errors from the button click are caught manually with the same shared `handleError` function.

**2. Render-time errors via the error boundary**

When a component's `view` function throws during React rendering, the error boundary (enabled by default via `useErrorBoundary: true`) catches it and calls `onCatch`. The view is then replaced by either the built-in fallback UI or a custom `fallbackView` if one is defined.

```typescript
const def: ComponentDef<Struct> = {
    // Custom view shown instead of the broken component
    fallbackView: (props, component) => (
        <div style={{ color: 'red' }}>Component failed to render.</div>
    ),
    // Also receives render-time errors
    events: {
        onCatch: (_, err) => {
            console.error('Render error caught:', err);
        },
    },
    view: () => {
        if (someCondition) throw new Error('Render failed');
        return <div>Normal content</div>;
    },
};
```

Set `useErrorBoundary: false` to opt out of the boundary (useful when `onCatch` handles async errors and a render-time throw should propagate normally).

#### Global Property Change Events

These events fire when **any** reactive property changes. Useful for cross-cutting concerns like logging, validation, or synchronization.

| Event | Description |
|---|---|
| `onPropChanging` | Fires before any reactive property changes. Return `false` to cancel the change. |
| `onPropChange` | Fires after any reactive property has changed. |

```typescript
const def: ComponentDef<Struct> = {
    events: {
        // Before ANY property changes — return false to cancel
        onPropChanging: (propName, oldValue, newValue) => {
            console.log(`Property ${propName} changing:`, oldValue, '->', newValue);
            return newValue !== null; // cancel if null
        },

        // After ANY property has changed
        onPropChange: (propName, value) => {
            console.log(`Property ${propName} changed to:`, value);
        }
    }
};
```

#### Property-Specific Events (Automatically Typed)

For each property declared in `props`, the type system **automatically generates** typed event handler slots. IntelliSense provides suggestions for all properties.

| Event pattern | Description |
|---|---|
| `onGet<PropName>` | Getter interceptor — called when the property is read. Returns the value. |
| `onChanging<PropName>` | Fires before a specific property changes. Return `false` to cancel the change. |
| `onChange<PropName>` | Fires after a specific property has changed. |

```typescript
type MyStruct = ComponentStruct<AppMsgStruct, {
    props: {
        counter: number;
        text: string;
        isActive: boolean;
    };
}>;

const def: ComponentDef<MyStruct> = {
    props: {
        counter: 0,
        text: '',
        isActive: false
    },
    events: {
        // IntelliSense automatically suggests these based on props!

        // Getter interceptor — called when property is read
        onGetCounter: () => {
            console.log('Counter was read');
            return m.counter;
        },

        // Before a specific property changes — return false to cancel
        onChangingText: (oldValue, newValue) => {
            console.log('Text changing:', oldValue, '->', newValue);
            return newValue.trim(); // sanitize input
        },

        // After a specific property has changed
        onChangeText: (value) => {
            console.log('Text changed to:', value);
            c.children.child1.model.value = value;
        },

        onChangeIsActive: (value) => {
            if (value) {
                console.log('Component activated!');
            }
        }
    }
};
```

#### Real-World Example

```typescript
type FormStruct = ComponentStruct<AppMsgStruct, {
    props: {
        email: string;
        password: string;
        isValid: boolean;
    };
    children: {
        emailInput: InputStruct;
        passwordInput: InputStruct;
    };
}>;

const useForm = (params: ComponentParams<FormStruct>) => {
    let c: Component<FormStruct>;
    let m: ComponentModel<FormStruct>;

    const def: ComponentDef<FormStruct> = {
        props: {
            email: '',
            password: '',
            isValid: false
        },
        events: {
            // Validate email after it changes — onChange receives only the new value
            onChangeEmail: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                m.isValid = emailRegex.test(value) && m.password.length >= 6;
            },

            // Validate password after it changes
            onChangePassword: (value) => {
                m.isValid = m.email.includes('@') && value.length >= 6;
            },

            // Sanitize input before setting — onChanging receives (oldValue, newValue)
            onChangingEmail: (oldValue, newValue) => {
                return newValue.toLowerCase().trim();
            }
        },
        children: {
            emailInput: useInput({
                value: bind(() => m.email, v => { m.email = v; })
            }),
            passwordInput: useInput({
                value: bind(() => m.password, v => { m.password = v; })
            })
        },
        view: () => (
            <div>
                <c.children.EmailInput />
                <c.children.PasswordInput />
                <button disabled={!m.isValid}>Submit</button>
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

**Key Benefits:**
- ✅ **Full TypeScript IntelliSense** - event names are auto-generated from props
- ✅ **Type-safe parameters** - correct types for old/new values
- ✅ **Validation and sanitization** - intercept changes before they happen
- ✅ **Synchronization** - keep parent and child components in sync
- ✅ **Lifecycle hooks** - respond to component lifecycle stages

### Effects

> **Coming from React?** Effects here are **not** the equivalent of `useEffect`. For side effects that run after mount (data fetching, subscriptions, timers), use the `onReady` lifecycle event — it maps to `useEffect` and is async-safe. See [Lifecycle Events](#lifecycle-events). Effects in dynstruct are closer to MobX `autorun`: they track reactive property reads and re-execute automatically when those values change.

Effects are **auto-tracking reactive functions**. An effect runs immediately when the component is created, and then **re-runs automatically** whenever any reactive property accessed inside it changes. Effect names must first be declared in the component structure, then implemented in `ComponentDef`.

Each effect is accessible on the component instance via `c.effects.<name>` and exposes an `EffectController` with three methods:

| Method | Description |
|---|---|
| `pause()` | Suspends the effect. Property changes are ignored until resumed. |
| `resume()` | Resumes a paused effect and immediately re-evaluates it. |
| `stop()` | Stops the effect entirely. It will not run again. |

An effect can optionally return a **cleanup function** that is called when the effect is stopped or the component is destroyed.

**Example** — computed `fullName` that auto-updates when `firstName` or `lastName` changes, with pause/resume control:

```typescript
type Struct = ComponentStruct<AppMsgStruct, {
    props: {
        fullName: string;
        firstName: string;
        lastName: string;
        trackingEnabled: boolean;
    };
    children: {
        firstNameEdit: SimpleEditStruct;
        lastNameEdit: SimpleEditStruct;
    };
    // Declare effect names in the structure
    effects: 'trackNameChanges';
}>;

const useEffectDemo = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    const def: ComponentDef<Struct> = {
        props: {
            fullName: '',
            firstName: 'John',
            lastName: 'Smith',
            trackingEnabled: true,
        },
        events: {
            // Toggle effect pause/resume via a property change event
            onChangeTrackingEnabled: (v) => {
                if (v) {
                    c.effects.trackNameChanges.resume();
                } else {
                    c.effects.trackNameChanges.pause();
                }
            },
        },
        effects: {
            // Runs immediately on creation, then re-runs whenever
            // m.firstName or m.lastName changes
            trackNameChanges: (c) => {
                m.fullName = `${m.firstName} ${m.lastName}`;
            },
        },
        children: {
            firstNameEdit: useSimpleEdit({
                value: bindProp(() => m, 'firstName'),
            }),
            lastNameEdit: useSimpleEdit({
                value: bindProp(() => m, 'lastName'),
            }),
        },
        view: () => (
            <div id={c.id}>
                <div>First Name: <c.children.FirstNameEdit /></div>
                <div>Last Name: <c.children.LastNameEdit /></div>
                <div>Full Name: {m.fullName}</div>
                {m.trackingEnabled
                    ? <button onClick={() => { m.trackingEnabled = false; }}>Pause</button>
                    : <button onClick={() => { m.trackingEnabled = true; }}>Resume</button>
                }
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

In this example the `trackNameChanges` effect accesses `m.firstName` and `m.lastName`, so it re-runs whenever either changes. Clicking **Pause** calls `c.effects.trackNameChanges.pause()`, which suspends the auto-tracking — edits to the name fields no longer update `fullName` until **Resume** is clicked.

### Dynamic Content

#### Design philosophy: working with JSX, not against it

dynstruct is designed to **amplify** JSX, not replace it. The framework deliberately separates two concerns that are often tangled together:

- **Wiring** (how props, bindings, and state flow between components) belongs in `def.children` — the `useX` hook call for each child component.
- **Layout** (where components appear) belongs in `def.view` — plain JSX that reads naturally.

This separation keeps the view clean. Because bindings are declared once in the `useX` call inside `children`, the JSX in `view` contains no wiring noise — no `onChange`, no manual `value={...}` threading, no `useCallback`. Each `<c.children.Name />` is just a named slot. The result is JSX that looks structurally close to HTML while all the reactive coupling lives in one predictable place.

```typescript
// Wiring lives here — free from JSX
children: {
    firstNameEdit: useSimpleEdit({ value: bindProp(() => m, 'firstName') }),
    lastNameEdit:  useSimpleEdit({ value: bind(() => m.lastName, v => { m.lastName = v; }) }),
    emailEdit:     useSimpleEdit({ value: bindProp(() => m, 'email'), isValid: bind(() => !!m.email) }),
},

// Layout lives here — no binding noise
view: () => (
    <form>
        <c.children.FirstNameEdit />
        <c.children.LastNameEdit />
        <c.children.EmailEdit />
    </form>
),
```

The `children` field is not limited to full dynstruct components. It supports three patterns, each adding progressively more structure when needed.

---

#### 1. Named JSX Fragment (`React.FC`)

The lightest option: name a piece of JSX as a child. Declare it as `React.FC` in the struct and provide a plain function returning JSX in `def.children`. Useful for extracting a fragment that reads from the parent's reactive model — keeps the main `view` concise without requiring a separate file or a new component.

In the view, function-typed children (both `React.FC` and factory children below) are accessed with a **capitalized** name: `<c.children.Summary />`.

```typescript
type Struct = ComponentStruct<AppMsgStruct, {
    props: { counter: number };
    children: {
        summary: React.FC;
        buttons: React.FC;
    };
}>;

const def: ComponentDef<Struct> = {
    props: { counter: 0 },
    children: {
        summary: () => <div>Counter: {m.counter}</div>,
        buttons: () => (
            <div>
                <button onClick={() => m.counter++}>Add</button>
                <button onClick={() => (m.counter = 0)}>Reset</button>
            </div>
        ),
    },
    view: () => (
        <div>
            <c.children.Summary />
            <c.children.Buttons />
        </div>
    ),
};
```

This is the same pattern React uses for render props and slot components — `children` just makes the slots explicit and named.

#### 2. Factory Function (Parameterized Dynamic Children)

When you need to instantiate a child component **per render** — for example, once per item in a list — declare the child as a factory function. The function accepts JSX props and returns a component struct. The framework creates and tracks a separate component instance for each unique `key`.

This is how dynstruct handles dynamic lists: the factory child is a first-class component with its own model and bindings, but it does not require a separate file or standalone component definition.

```typescript
type Struct = ComponentStruct<AppMsgStruct, {
    props: { counter: number; text: string };
    children: {
        // Factory: accepts JSX props, returns a component struct
        dynEdit: (props: { value?: string }) => SimpleEditStruct;
    };
}>;

const def: ComponentDef<Struct> = {
    props: { counter: 0, text: 'bar' },
    children: {
        dynEdit: (params) => useSimpleEdit({ value: params.value }),
    },
    view: () => (
        <ul>
            {Array.from({ length: m.counter }).map((_, i) => (
                <li key={i}>
                    {/* key prop drives instance identity — same key = same component instance */}
                    <c.children.DynEdit key={i} value={m.text} />
                </li>
            ))}
        </ul>
    ),
};
```

The factory receives the JSX props as its `params` argument on each render. Bindings passed here (e.g. `value: params.value`) update the child's model reactively, just like any other binding.

#### 3. DynamicContent Component

When a child needs a typed reactive `data` slot and a custom `render` callback inside a proper dynstruct component, use `useDynamicContent`. It provides a component with a reactive `data` prop and a `render` function, so the content re-renders when the bound data changes.

```typescript
import { DynamicContentStruct, useDynamicContent } from '@actdim/dynstruct/componentModel/DynamicContent';

type Struct = ComponentStruct<AppMsgStruct, {
    props: { text: string };
    children: {
        content: DynamicContentStruct<string, AppMsgStruct>;
    };
}>;

const def: ComponentDef<Struct> = {
    props: { text: 'hello' },
    children: {
        content: useDynamicContent<string>({
            data: bindProp(() => m, 'text'),
            render: (_, dc) => <>{dc.model.data}</>,
        }),
    },
    view: () => <c.children.Content />,
};
```

`DynamicContentStruct` is generic: `DynamicContentStruct<TData, TMsgStruct>`. The `data` prop holds typed data bound to a parent property, and `render` produces the JSX.

#### Summary

| Pattern | Structure type | Access in view | Use case |
|---|---|---|---|
| Named JSX fragment | `React.FC` | `<c.children.Name />` | Named inline fragments, keep main view concise |
| Factory function | `(params) => ChildStruct` | `<c.children.Name key={...} prop={...} />` | Dynamic instances per render (lists, grids) |
| DynamicContent | `DynamicContentStruct<TData>` | `<c.children.Name />` | Typed reactive data with typed render callback |
| Component structure | `SomeChildStruct` | `<c.children.Name />` | Full dynstruct component with its own model and effects |

> **Naming convention:** All children are rendered in JSX using a **Capitalized** name: `<c.children.Name />`. For component structure children the camelCase name additionally gives access to the full component instance (`c.children.name.model`, `c.children.name.effects`, …). For `React.FC` and factory children only the Capitalized form exists.

### Component Wiring

Components exchange data and coordinate behavior through four complementary mechanisms. Each has a different coupling level and is appropriate for different scenarios.

#### 1. Direct Bindings (`bind` / `bindProp`)

Bindings create a live two-way link between a child prop and a parent's reactive state. They are declared when creating children inside `def.children` and make the wiring explicit at the definition level — JSX stays clean.

**`bind(getter, setter?)`** — full control with a custom getter and optional setter. The getter can compute a derived value:

```typescript
children: {
    // Derived value — child sees computed result, setter writes back to source
    fullNameEdit: useSimpleEdit({
        value: bind(
            () => `${m.firstName} ${m.lastName}`,
            (v) => {
                const [first, ...rest] = v.split(' ');
                m.firstName = first;
                m.lastName = rest.join(' ');
            },
        ),
    }),

    // Read-only derived: no setter → child prop is read-only
    lastNameEdit: useSimpleEdit({
        value: bind(() => m.lastName.toUpperCase()),
    }),
}
```

**`bindProp(target, prop)`** — shortcut for binding directly to a single reactive property; getter and setter are generated automatically:

```typescript
children: {
    firstNameEdit: useSimpleEdit({
        value: bindProp(() => m, 'firstName'),  // reads m.firstName, writes m.firstName
    }),
}
```

**Why bindings must use lazy getters — never pass `m` directly:**

`def.children` is evaluated **before** `c = useComponent(...)` and `m = c.model` are assigned. Passing `m` directly copies `undefined`:

```typescript
// ❌ WRONG — m is undefined when def.children is evaluated
children: {
    contactEdit: useContactEdit({ contact: m }),
}
c = useComponent(def, params);
m = c.model;  // too late
```

`bind(() => m)` / `bindProp(() => m, 'prop')` work because the closure is evaluated lazily during render, when `m` is already set:

```typescript
// ✅ CORRECT
children: {
    firstNameEdit: useSimpleEdit({ value: bindProp(() => m, 'firstName') }),
}
c = useComponent(def, params);
m = c.model;  // m is set before any render
```

#### 2. Direct Model Mutation and `onChangeX` Handlers

For tighter coordination, parent and children can access each other's models directly and react to property changes through typed event handlers:

```typescript
events: {
    // Fires after m.email changes — update derived state reactively
    onChangeEmail: (newValue) => {
        m.isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue);
        // Can also reach into a child's model:
        c.children.submitButton.model.isDisabled = !m.isEmailValid;
    },
},
```

This is well-suited for **intra-component coordination** — a parent reacting to one of its own props and updating another child. Avoid reaching into deeply nested siblings; use the message bus for cross-branch communication.

#### 3. Object-level Bindings

`bind(() => m)` passes the entire parent model as a prop to a child. The child reads and writes directly on the parent's reactive proxy:

```typescript
children: {
    // contactEdit reads/writes m.firstName, m.lastName, m.email on the parent model
    contactEdit: useContactEdit({
        contact: bind(() => m),
        isReadOnly: true,
    }),
}
```

This is **convenient for editor components** that take a data object and display/edit all its fields without needing a separate binding for each field. Reads are tracked by MobX; writes trigger the parent's `onChange` handlers.

> ⚠️ **Coupling trade-off:** binding a child to the parent's full model tightens the coupling significantly — the child implicitly depends on the parent's model shape. This can make the child difficult to reuse and the data flow harder to trace. Use it when both components are designed together and the relationship is intentional. In general, prefer binding individual props and keep `children` structure declarations honest about what is actually used.

#### 4. Message Bus Communication

The message bus enables **loose coupling** — components interact without holding references to each other. This is the right tool for cross-branch communication and integration with services.

See [Message Bus Communication](#message-bus-communication) for a full reference. The key distinction for wiring is the **scope** of message routing:

**Flat (bus-wide):** a message reaches any subscriber in the application:

```typescript
// Sender (any component)
c.msgBus.send({ channel: 'APP.NOTICE', payload: { text: 'Saved!' } });

// Receiver (any component, anywhere)
msgBroker: {
    subscribe: {
        'APP.NOTICE': { in: { callback: (msg) => console.log(msg.payload.text) } }
    }
}
```

**Hierarchy-scoped:** use `componentFilter` to restrict routing to the component tree. This lets a parent respond only to messages from its own descendants, and vice versa — without knowing their IDs:

```typescript
import { ComponentMsgFilter } from '@actdim/dynstruct/componentModel/contracts';

// Parent: listens only to children/descendants
msgBroker: {
    subscribe: {
        'TEST-EVENT': {
            in: {
                callback: (msg, component) => { m.received = msg.payload; },
                componentFilter: ComponentMsgFilter.FromDescendants,
            }
        }
    }
}

// Parent: provides a response service only to its own descendants
msgBroker: {
    provide: {
        'LOCAL-EVENT': {
            in: {
                callback: (msgIn, headers, component) => `Hello from ${component.id}`,
                componentFilter: ComponentMsgFilter.FromDescendants,
            }
        }
    }
}

// Child: sends up to ancestors
msgBroker: {
    subscribe: {
        'PARENT-REPLY': {
            in: {
                callback: (msg) => { m.reply = msg.payload; },
                componentFilter: ComponentMsgFilter.FromAncestors,
            }
        }
    }
}
```

Available filters: `FromDescendants`, `FromAncestors`, `FromSelf`, `FromBus` (no filter). See Storybook examples **Basic Communication** and **Parent/Child** for working demos.

#### Choosing the Right Mechanism

| Mechanism | Coupling | Use when |
|---|---|---|
| `bindProp` / `bind` (single prop) | low-medium | parent wires a value into a child; child is reusable |
| `onChangeX` handler | medium | parent reacts to its own prop change, updates sibling or child state |
| `bind(() => m)` (full model) | high | intentional tight editor pattern; both components designed together |
| Message bus (bus-wide) | very low | cross-branch, cross-feature, service integration |
| Message bus (hierarchy-scoped) | low | parent ↔ children coordination without direct references |

### Message Bus Communication

dynstruct integrates with **[@actdim/msgmesh](https://www.npmjs.com/package/@actdim/msgmesh)**, a type-safe message bus library that enables decoupled component communication.

#### Key Benefits

✅ **Type-Safe Channels** - No magic strings, full IntelliSense for channel names
✅ **Local Message Namespaces** - Component structure declares only relevant channels
✅ **Clear Component Responsibilities** - Message scope shows what component consumes/provides
✅ **Component Independence** - Components communicate without direct references
✅ **Testability** - Message bus can be easily mocked
✅ **Flexible Routing** - Connect any components, not just parent-child

#### Step 1: Define Global Message Channels

First, declare message channels at the application (or domain) level with full typing:

```typescript
import { MsgStruct, MsgBus } from '@actdim/msgmesh/contracts';
import { createMsgBus } from '@actdim/msgmesh/core';
import { BaseAppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';

// Define your application's message structure
export type AppMsgStruct = BaseAppMsgStruct<AppRoutes> &
    MsgStruct<{
        // Event message (fire-and-forget)
        'USER-CLICKED': {
            in: { buttonId: string; timestamp: number };
        };

        // Request/response message
        'GET-USER-DATA': {
            in: { userId: string };
            out: { userId: string; name: string; email: string };
        };

        // Event from child components
        'FORM-SUBMITTED': {
            in: { formData: Record<string, any> };
        };

        // Service message
        'VALIDATE-EMAIL': {
            in: { email: string };
            out: { valid: boolean; error?: string };
        };
    }>;

// Create typed message bus
export type AppMsgBus = MsgBus<AppMsgStruct, ComponentMsgHeaders>;

export function createAppMsgBus() {
    return createMsgBus<AppMsgStruct, ComponentMsgHeaders>({});
}

// Helper for selecting channels in component structures
export type AppMsgChannels<TChannel extends keyof AppMsgStruct | Array<keyof AppMsgStruct>> =
    KeysOf<AppMsgStruct, TChannel>;
```

#### Step 2: Declare Component's Message Scope

In **ComponentStruct**, explicitly declare which channels this component works with:

```typescript
import { ComponentStruct } from '@actdim/dynstruct/componentModel/contracts';
import { AppMsgStruct, AppMsgChannels } from './appDomain';

type UserPanelStruct = ComponentStruct<
    AppMsgStruct,
    {
        props: {
            userId: string;
            userData: UserData | null;
        };
        children: {
            submitButton: ButtonStruct;
            emailInput: InputStruct;
        };
        // Message scope - creates LOCAL namespace for this component
        msgScope: {
            // Channels this component SUBSCRIBES to (consumes)
            subscribe: AppMsgChannels<'USER-CLICKED' | 'FORM-SUBMITTED'>;

            // Channels this component PROVIDES (request/response handlers)
            provide: AppMsgChannels<'GET-USER-DATA' | 'VALIDATE-EMAIL'>;

            // Channels this component PUBLISHES to (sends)
            publish: AppMsgChannels<'USER-UPDATED'>;
        };
    }
>;
```

**What This Achieves:**

🎯 **Local Namespace** - Component only sees relevant channels, not the entire global list
📋 **Clear Responsibilities** - Message scope documents component's communication surface
🔒 **Type Safety** - TypeScript ensures only declared channels can be used in `msgBroker`. Using a channel not present in `AppMsgStruct` produces a compile-time error at the type alias definition.
👀 **Better Project Visibility** - Easy to understand component's external dependencies
🔗 **Communication Map** - Shows how components connect, alongside children references

#### Step 3: Implement Message Handlers

In **ComponentDef**, implement handlers for declared channels in `msgBroker`:

```typescript
import { ComponentDef, ComponentMsgFilter } from '@actdim/dynstruct/componentModel/contracts';

const useUserPanel = (params: ComponentParams<UserPanelStruct>) => {
    let c: Component<UserPanelStruct>;
    let m: ComponentModel<UserPanelStruct>;

    const def: ComponentDef<UserPanelStruct> = {
        props: {
            userId: '',
            userData: null,
        },

        msgBroker: {
            // SUBSCRIBE handlers - react to events from other components
            subscribe: {
                'USER-CLICKED': {
                    in: {
                        callback: (msg, component) => {
                            console.log('User clicked button:', msg.payload.buttonId);
                            // Update component state
                            // No runInAction needed!
                        },
                        // Filter messages by source
                        componentFilter: ComponentMsgFilter.FromDescendants
                    }
                },

                'FORM-SUBMITTED': {
                    in: {
                        callback: (msg, component) => {
                            const formData = msg.payload.formData;
                            // Handle form submission
                            m.userData = { ...m.userData, ...formData };
                        },
                        componentFilter: ComponentMsgFilter.FromDescendants
                    }
                }
            },

            // PROVIDE handlers - respond to requests from other components
            provide: {
                'GET-USER-DATA': {
                    in: {
                        callback: (msgIn, headers, component) => {
                            // Return response data
                            return {
                                userId: m.userId,
                                name: m.userData?.name ?? '',
                                email: m.userData?.email ?? ''
                            };
                        },
                        componentFilter: ComponentMsgFilter.FromDescendants
                    }
                },

                'VALIDATE-EMAIL': {
                    in: {
                        callback: (msgIn, headers, component) => {
                            const email = msgIn.payload.email;
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            return {
                                valid: emailRegex.test(email),
                                error: emailRegex.test(email) ? undefined : 'Invalid email format'
                            };
                        }
                    }
                }
            }
        },

        children: {
            submitButton: useButton({
                label: 'Submit',
                onClick: () => {
                    // SEND event (fire-and-forget)
                    c.msgBus.send({
                        channel: 'FORM-SUBMITTED',
                        payload: { formData: { name: 'Alice' } }
                    });
                }
            }),
            emailInput: useInput({
                value: bind(() => m.userData?.email ?? '', v => {
                    m.userData = { ...m.userData, email: v };
                })
            })
        },

        view: () => (
            <div>
                <c.children.EmailInput />
                <c.children.SubmitButton />
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

#### Step 4: Send Messages and Make Requests

Components use their `msgBus` to send events or make requests:

```typescript
// Send event (fire-and-forget)
c.msgBus.send({
    channel: 'USER-CLICKED',
    payload: { buttonId: 'btn-1', timestamp: Date.now() }
});

// Request/response pattern (async)
const response = await c.msgBus.request({
    channel: 'GET-USER-DATA',
    payload: { userId: '123' }
});
console.log('User data:', response.payload);

// Request with timeout
const validationResult = await c.msgBus.request(
    {
        channel: 'VALIDATE-EMAIL',
        payload: { email: 'test@example.com' }
    },
    { timeout: 5000 }
);
```

> **Unmount safety:** `c.msgBus` is bound to component lifecycle. When the component is unmounted, active subscriptions are automatically unsubscribed and pending `request(...)` calls are aborted. This prevents updating state of an already destroyed component from late async responses.

#### Message Filtering

Use **ComponentMsgFilter** to control which components can send messages to your handlers:

```typescript
import { ComponentMsgFilter } from '@actdim/dynstruct/componentModel/contracts';

msgBroker: {
    subscribe: {
        'USER-CLICKED': {
            in: {
                callback: (msg) => { /* ... */ },
                componentFilter: ComponentMsgFilter.FromDescendants  // Only from children
            }
        },
        'ADMIN-ACTION': {
            in: {
                callback: (msg) => { /* ... */ },
                componentFilter: ComponentMsgFilter.FromAncestors    // Only from parents
            }
        },
        'GLOBAL-EVENT': {
            in: {
                callback: (msg) => { /* ... */ },
                componentFilter: ComponentMsgFilter.FromBus          // From anywhere
            }
        }
    }
}
```

**Available Filters:**
- `FromDescendants` - Only messages from child components
- `FromAncestors` - Only messages from parent/ancestor components
- `FromSelf` - Only messages from this component
- `FromBus` - Messages from anywhere in the application

#### Real-World Example

See [TestContainer.tsx](src/_stories/componentModel/TestContainer.tsx) for a complete example:

```typescript
// Structure declares message scope
type Struct = ComponentStruct<
    AppMsgStruct,
    {
        props: { text: string };
        children: {
            child1: TestChildStruct;
            child2: TestChildStruct;
        };
        msgScope: {
            subscribe: AppMsgChannels<'TEST-EVENT'>;
            provide: AppMsgChannels<'LOCAL-EVENT'>;
        };
    }
>;

const def: ComponentDef<Struct> = {
    props: { text: '' },

    msgBroker: {
        subscribe: {
            'TEST-EVENT': {
                in: {
                    callback: (msg, c) => {
                        m.text = msg.payload;
                    },
                    componentFilter: ComponentMsgFilter.FromDescendants
                }
            }
        },
        provide: {
            'LOCAL-EVENT': {
                in: {
                    callback: (msgIn, headers, c) => {
                        return `Hi ${msgIn.payload} from parent ${c.id}!`;
                    },
                    componentFilter: ComponentMsgFilter.FromDescendants
                }
            }
        }
    }
};
```

#### Testing and Mocking

The message bus can be easily mocked for testing:

```typescript
import { createMsgBus } from '@actdim/msgmesh/core';

// Create mock bus for testing
const mockMsgBus = createMsgBus<AppMsgStruct, ComponentMsgHeaders>({});

// Spy on messages
const sendSpy = jest.spyOn(mockMsgBus, 'send');

// Test component
const component = useComponent(def, { msgBus: mockMsgBus });

// Verify message was sent
expect(sendSpy).toHaveBeenCalledWith({
    channel: 'USER-CLICKED',
    payload: expect.any(Object)
});
```

#### Why This Approach is Powerful

**1. Type Safety Without Magic Strings**
- All channels defined in one place with full typing
- IntelliSense shows available channels
- Compile-time errors for typos

**2. Clear Component Boundaries**
- `msgScope` documents component's external communication
- Easy to see what component consumes/provides
- Reduces cognitive load when reading code

**3. Loose Coupling**
- Components communicate without direct references
- Easy to add/remove components
- Services can be swapped without changing component code

**4. Better Project Visibility**
- Structure shows children dependencies (direct composition)
- Structure shows message dependencies (loose coupling)
- Complete picture of component's responsibilities

**5. Testability**
- Message bus can be mocked
- Test components in isolation
- Verify message contracts

**6. Flexibility**
- Connect any components (not just parent-child)
- Route messages through component hierarchy
- Filter by source with ComponentMsgFilter
- Support both events and request/response patterns

### Parent-Child Relationships

Components can access their hierarchy:

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

// Hierarchy access — available after component creation
// (inside events, effects, actions, view — not inside def.children or onInit)
const parentId  = c.getParent();
const ancestors = c.getChainUp();
const descendants = c.getChainDown();
```

## More Examples (React)

> **Note:** For basic examples (simple component, parent-child, bindings, events, effects) see the [Getting Started](#getting-started-react) and [Core Concepts](#core-concepts) sections above.

### Service Integration (API Calls)

dynstruct integrates with the **service adapter** system from [@actdim/msgmesh](https://github.com/actdim/msgmesh/?tab=readme-ov-file#service-adapters). Adapters automatically register any service class (e.g. an API client) as a message bus provider — channel names, payload types, and return types are all derived from the service class at compile time.

#### 1. Define an API client

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

#### 2. Set up adapters and service provider

Type utilities from [`@actdim/msgmesh/adapters`](https://www.npmjs.com/package/@actdim/msgmesh) transform the service class into a typed bus structure. Each public method becomes a channel (e.g. `getDataItems` → `API.TEST.GETDATAITEMS`). See [@actdim/msgmesh — Service Adapters](https://github.com/actdim/msgmesh/?tab=readme-ov-file#service-adapters) for details on how the type transformation works.

```typescript
import {
    BaseServiceSuffix, getMsgChannelSelector, MsgProviderAdapter,
    ToMsgChannelPrefix, ToMsgStruct,
} from '@actdim/msgmesh/adapters';
import { ServiceProvider } from '@actdim/dynstruct/services/react/ServiceProvider';

// "TestApiClient" → remove suffix "Client" → uppercase → "API.TEST."
type ApiPrefix = 'API';
type TestApiChannelPrefix = ToMsgChannelPrefix<
    typeof TestApiClient.name, ApiPrefix, BaseServiceSuffix
>;

// Transform service methods into a bus struct
type ApiMsgStruct = ToMsgStruct<TestApiClient, TestApiChannelPrefix>;

// Create adapter instances
const services: Record<TestApiChannelPrefix, any> = {
    'API.TEST.': new TestApiClient(),
};

const msgProviderAdapters = Object.entries(services).map(
    ([_, service]) => ({
        service,
        channelSelector: getMsgChannelSelector(services),
    }) as MsgProviderAdapter,
);

// React provider component — wraps children with registered adapters
export const ApiServiceProvider = () => ServiceProvider({ adapters: msgProviderAdapters });
```

#### 3. Use in a component

Data loading is a plain async function — it has nothing to do with effects. Call it from an event handler (`onReady`) or directly from a button click.

```typescript
type Struct = ComponentStruct<ApiMsgStruct, {
    props: {
        dataItems: DataItem[];
    };
    msgScope: {
        subscribe: ComponentMsgChannels<'API.TEST.GETDATAITEMS'>;
        publish: ComponentMsgChannels<'API.TEST.GETDATAITEMS'>;
    };
}>;

const useApiCallExample = (params: ComponentParams<Struct>) => {
    let c: Component<Struct>;
    let m: ComponentModel<Struct>;

    // Plain async function — not an effect, not an action
    async function loadData() {
        const msg = await c.msgBus.request({
            channel: 'API.TEST.GETDATAITEMS',
            payloadFn: (fn) => fn([1, 2], ['first', 'second']),
        });
        m.dataItems = msg.payload;
    }

    async function clear() {
        m.dataItems.length = 0;
    }

    const def: ComponentDef<Struct> = {
        regType: 'ApiCallExample',
        props: {
            dataItems: [],
        },
        events: {
            // Load data when the component is ready
            onReady: () => { loadData(); },
        },
        view: () => (
            <div id={c.id}>
                <button onClick={loadData}>Load data</button>
                <button onClick={clear}>Clear</button>
                <ul>
                    {m.dataItems.map((item) => (
                        <li key={item.id}>{item.id}: {item.name}</li>
                    ))}
                </ul>
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export const ApiCallExample = toReact(useApiCallExample);
```

### Navigation

```typescript
// React implementation
import { ComponentStruct, ComponentDef, ComponentParams, Component } from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react';
import { AppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';

type PageStruct = ComponentStruct<AppMsgStruct, {
    actions: { navigateToHome: () => void; navigateToProfile: (userId: string) => void };
}>;

const usePage = (params: ComponentParams<PageStruct>) => {
    let c: Component<PageStruct>;

    const def: ComponentDef<PageStruct> = {
        actions: {
            navigateToHome: () => {
                c.msgBus.send({
                    channel: 'APP.NAV.GOTO',
                    payload: { path: '/' }
                });
            },
            navigateToProfile: (userId: string) => {
                c.msgBus.send({
                    channel: 'APP.NAV.GOTO',
                    payload: { path: `/profile/${userId}` }
                });
            }
        },
        view: () => (
            <div>
                <button onClick={c.actions.navigateToHome}>Home</button>
                <button onClick={() => c.actions.navigateToProfile('123')}>
                    View Profile
                </button>
            </div>
        ),
    };

    c = useComponent(def, params);
    return c;
};

export const Page = toReact(usePage);
```

### Authentication & Security

```typescript
// React implementation
import { ComponentStruct, ComponentDef, ComponentParams, Component, ComponentModel } from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact } from '@actdim/dynstruct/componentModel/react';
import { AppMsgStruct } from '@actdim/dynstruct/appDomain/appContracts';
import { SecurityService } from '@actdim/dynstruct/services/react/SecurityService';
import { ComponentContextProvider } from '@actdim/dynstruct/componentModel/react/componentContext';

// In your app root
<ComponentContextProvider>
    <SecurityService>
        <ApiServiceProvider>
            <App />
        </ApiServiceProvider>
    </SecurityService>
</ComponentContextProvider>

// Use in component
type SecurePageStruct = ComponentStruct<AppMsgStruct, {
    props: { isAuthenticated: boolean };
    actions: { signIn: (credentials: Credentials) => void; signOut: () => void };
}>;

const useSecurePage = (params: ComponentParams<SecurePageStruct>) => {
    let c: Component<SecurePageStruct>;
    let m: ComponentModel<SecurePageStruct>;

    const def: ComponentDef<SecurePageStruct> = {
        props: { isAuthenticated: false },
        actions: {
            signIn: async (credentials) => {
                await c.msgBus.request({
                    channel: 'APP.SECURITY.AUTH.SIGNIN',
                    payload: credentials
                });
                m.isAuthenticated = true; // Reactive update
            },
            signOut: async () => {
                await c.msgBus.request({
                    channel: 'APP.SECURITY.AUTH.SIGNOUT',
                    payload: {}
                });
                m.isAuthenticated = false; // Reactive update
            }
        },
        view: () => (
            <div>
                {m.isAuthenticated ? (
                    <button onClick={c.actions.signOut}>Sign Out</button>
                ) : (
                    <button onClick={() => c.actions.signIn({ username: 'user', password: 'pass' })}>
                        Sign In
                    </button>
                )}
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

export const SecurePage = toReact(useSecurePage);
```

## Key Advantages (React Examples)

> **Note:** Examples in this section demonstrate the **React** implementation.

### Clean JSX Without Clutter

The combination of **bindings** (`bind`), **events**, and **`.View` wrappers** creates clean, readable JSX that clearly shows component structure without logic clutter:

```typescript
// React example
// ❌ Traditional React - cluttered with inline handlers and logic
<div>
    <h3>{message}</h3>
    <p>Counter: {counter}</p>
    <button onClick={() => setCounter(counter + 1)}>Increment</button>
    <button onClick={() => setCounter(0)}>Reset</button>
    <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
    />
</div>

// ✅ dynstruct - clean JSX showing structure
<div>
    <h3>{m.message}</h3>
    <p>Counter: {m.counter}</p>
    <c.children.IncrementBtn />
    <c.children.ResetBtn />
    <c.children.MessageInput />
</div>
```

### Performance Problems in Traditional React

#### Problem 1: Inline Functions Break Memoization

```typescript
// ❌ PROBLEM: New function created on every render
function TodoList({ todos }) {
    const [filter, setFilter] = useState('');

    return (
        <div>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} />
            {todos.map(todo => (
                <ExpensiveTodoItem
                    key={todo.id}
                    todo={todo}
                    // NEW FUNCTION on every render - breaks React.memo!
                    onToggle={() => toggleTodo(todo.id)}
                />
            ))}
        </div>
    );
}

// React.memo is USELESS here - onToggle is always new
const ExpensiveTodoItem = React.memo(({ todo, onToggle }) => {
    console.log('Render:', todo.id); // Logs on EVERY keystroke in filter!
    return <div onClick={onToggle}>{todo.text}</div>;
});
```

**Result:** Every keystroke in filter input re-renders ALL todo items, even though they haven't changed.

#### Problem 2: Inline Objects Break Memoization

```typescript
// ❌ PROBLEM: New object created on every render
function UserTable({ users }) {
    const [sort, setSort] = useState('name');

    return (
        <Table
            data={users}
            // NEW OBJECT on every render!
            config={{ sortable: true, filterable: true }}
            // NEW OBJECT on every render!
            style={{ padding: 10, margin: 5 }}
        />
    );
}

// React.memo is USELESS - config and style are always new references
const Table = React.memo(({ data, config, style }) => {
    console.log('Table rendered'); // Renders constantly!
    return <table style={style}>...</table>;
});
```

#### Problem 3: useCallback/useMemo Boilerplate

```typescript
// ✅ "Fixed" with hooks, but verbose and error-prone
function TodoList({ todos }) {
    const [filter, setFilter] = useState('');

    // Must wrap in useCallback
    const handleToggle = useCallback((id) => {
        toggleTodo(id);
    }, [toggleTodo]); // Don't forget dependencies!

    // Must wrap in useMemo
    const config = useMemo(() =>
        ({ sortable: true, filterable: true }), []
    );

    const style = useMemo(() =>
        ({ padding: 10, margin: 5 }), []
    );

    return (
        <div>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} />
            {todos.map(todo => (
                <ExpensiveTodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    config={config}
                    style={style}
                />
            ))}
        </div>
    );
}
```

**Issues:**
- Verbose boilerplate everywhere
- Easy to forget dependencies
- Hard to maintain
- Still need to wrap everything carefully

### MobX Reactivity Pitfalls

While MobX is capable, it has subtle issues that cause unexpected re-renders and are hard to debug:

#### Problem 1: Computed Returns New Object

```typescript
// ❌ computed recalculates on dependency changes
class UserStore {
    user = { name: "Pavel", email: "pavel@mail.com" };

    constructor() {
        makeAutoObservable(this);
    }

    get userViewModel() {
        // ❌ Returns NEW OBJECT every time
        return {
            name: this.user.name,
        };
    }
}

const userStore = new UserStore();

export const Header = observer(() => {
    const vm = userStore.userViewModel; // NEW OBJECT every render!

    return <div>Hello, {vm.name}</div>;
});

// Passing to child components breaks memoization
const App = observer(() => {
    const vm = userStore.userViewModel; // NEW reference

    return (
        <div>
            {/* ChildComponent re-renders ALWAYS, even with React.memo! */}
            <ChildComponent user={vm} />
        </div>
    );
});

const ChildComponent = React.memo(({ user }) => {
    console.log('Child rendered'); // Logs constantly!
    return <div>{user.name}</div>;
});
```

**Issue:** Computed returns new object each time, even if fields are the same. React sees new reference, so React.memo is useless. When you pass this object to child components, everything "falls apart" with constant re-renders.

#### Problem 2: Accidental Reactive Dependencies

```typescript
// ❌ Reading observables creates unwanted subscriptions
export const UsersList = observer(() => {
    const users = userStore.users
        .filter(u => u.isActive) // 👈 reading isActive on ALL users
        .map(u => u.name);       // 👈 reading name on ALL users

    return <div>{users.join(", ")}</div>;
});
```

**Issue:** Now changing `isActive` or `name` on ANY user triggers re-render of the entire list.

**Common causes of unwanted subscriptions:**
- ❌ `toJS(observable)` - reads all nested properties
- ❌ `{ ...observableObject }` - spread operator reads all properties
- ❌ `Object.keys/values/entries(observable)` - reads all properties
- ❌ `JSON.stringify(observable)` - reads everything deeply
- ❌ `map/filter/reduce` on observable arrays directly in render - creates subscriptions to all items
- ❌ Returning new objects from `computed` - breaks React.memo (see Problem 1)

#### Problem 3: Complex Combinations

```typescript
// ❌ Combining observable, computed, autorun gets complex quickly
class UserStore {
    @observable users = [];
    @observable filter = '';
    @observable sortOrder = 'asc';

    @computed get filteredUsers() {
        return this.users.filter(u => u.name.includes(this.filter));
    }

    @computed get sortedUsers() {
        return this.filteredUsers.slice().sort((a, b) =>
            this.sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );
    }

    constructor() {
        // Need runInAction for mutations
        autorun(() => {
            if (this.filter.length > 3) {
                runInAction(() => {
                    this.sortOrder = 'asc';
                });
            }
        });
    }
}
```

**Issues:**
- Need `runInAction` for mutations inside reactions
- Complex dependency chains hard to trace
- Debugging reactive flows is difficult
- Easy to create circular dependencies
- Performance issues not immediately obvious

#### Problem 4: RxJS Complexity

```typescript
// ❌ RxJS adds another layer of complexity
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';

const users$ = new BehaviorSubject([]);
const filter$ = new BehaviorSubject('');

const filteredUsers$ = combineLatest([users$, filter$]).pipe(
    debounceTime(300),
    map(([users, filter]) => users.filter(u => u.name.includes(filter))),
    distinctUntilChanged()
);

// Component must subscribe/unsubscribe
const UserList = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const sub = filteredUsers$.subscribe(setUsers);
        return () => sub.unsubscribe(); // Don't forget cleanup!
    }, []);

    return <div>{users.map(u => <div key={u.id}>{u.name}</div>)}</div>;
};
```

**Issues:**
- Entire paradigm to learn (operators, streams, subscriptions)
- Multiple abstractions (Subject, Observable, Operators)
- Manual subscription management
- Hard to debug async flows
- Easy to create memory leaks

#### Problem 5: Passing Objects Down the Hierarchy

Often, to quickly ship features, developers **cut corners** by passing objects down from parent components and using them in child components, including calling callbacks to affect upper levels.

This is **not officially an anti-pattern**, though in my opinion it should be considered one. It's a common way of parent-child interaction in React, but it **violates component isolation** and is often the cause of **unnecessary re-renders**, even when components seem independent by their properties.

**Example:**

```typescript
export function Parent() {
    const [count, setCount] = useState(0);

    const config = { pageSize: 20 }; // ❌ new object every render

    return (
        <>
            <button onClick={() => setCount(c => c + 1)}>+</button>

            <Child config={config} />
            <Child config={config} />
            <Child config={config} />
        </>
    );
}

export function Child({ config }: { config: { pageSize: number } }) {
    console.log("render child");
    return <div>{config.pageSize}</div>;
}
```

**What happens when `count` changes:**
1. `config` is created anew
2. New reference is created
3. **All children are guaranteed to re-render**

Even though the children don't use `count` at all, they re-render because `config` is a new object.

**Why this happens:**
- Quick implementation to ship faster
- Passing parent state/objects down instead of proper component boundaries
- Callbacks passed to children to modify parent state
- Seems convenient but breaks component isolation
- Hard to spot performance issues until they accumulate

### How dynstruct Solves This

**Declarative and Explicit:**

```typescript
// React implementation
type TodoListStruct = ComponentStruct<AppMsgStruct, {
    props: {
        filter: string;
        todos: Todo[];
    };
    children: {
        filterInput: InputStruct;
        todoItems: Record<string, TodoItemStruct>;
    };
}>;

const useTodoList = (params: ComponentParams<TodoListStruct>) => {
    let c: Component<TodoListStruct>;
    let m: ComponentModel<TodoListStruct>;

    const def: ComponentDef<TodoListStruct> = {
        props: {
            filter: '',
            todos: []
        },
        // Events are explicit and declarative
        events: {
            onChangeFilter: (old, newFilter) => {
                // No runInAction needed!
                // Batching happens automatically
                console.log('Filter changed:', newFilter);
            }
        },
        // Children defined once, stable references.
        // bind(() => m) passes the reactive parent model to a child that
        // reads/writes a subset of it — no per-field binding boilerplate.
        children: {
            filterInput: useInput({
                value: bind(() => m.filter, v => { m.filter = v; })
            }),
            // Contact editor reads firstName/lastName/email directly from
            // the parent model. Mutations write back through the same proxy.
            contactEdit: useContactEdit({
                contact: bind(() => m),
            }),
        },
        view: () => (
            <div>
                {/* Clean JSX — no inline handlers or binding noise */}
                <c.children.FilterInput />
                <c.children.ContactEdit />
            </div>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};
```

**Key Benefits:**

1. **📋 Explicit Structure** - All dependencies visible in type system
2. **🧹 No Inline Functions/Objects** - Stable references, no re-render issues
3. **⚡ No runInAction** - Mutations work directly, batching automatic
4. **🎯 Declarative Events** - Clear, debuggable event flow
5. **🔍 Easy Debugging** - No hidden reactive dependencies
6. **💡 Simple Mental Model** - No need to learn RxJS, no complex computed chains
7. **⚙️ Automatic Optimization** - Batching and re-render prevention built-in
8. **📦 Minimal Overhead** - Performance optimizations with clear benefits

**Important Note:**

We cannot claim that using dynstruct is **always more optimal** in terms of performance, or that it **completely eliminates** the possibility of shooting yourself in the foot. Where fine-grained optimization is truly necessary, it can be done **selectively** through other approaches - **using standard React components is not prohibited!**

However, the dynstruct approach creates conditions where **dividing the application into isolated zones of responsibility becomes both necessary and convenient**. At the same time, **deviating from the rules and stepping on rakes becomes both unnecessary and inconvenient!**

Using this component model **encourages building applications from many small, well-designed architectural blocks** and making **numerous small but correct architectural decisions**. This is useful **not only in the long term** - development becomes **faster when all rules are clear and understandable**, and **technological boundaries and constraints are well-defined**.

### Why Explicit Structure Matters

The explicit separation of **props**, **actions**, and **events** in dynstruct makes code more manageable and maintainable:

**🎯 Props as Reactive Foundation:**
- Clear declaration: "these properties are reactive"
- No confusion about what triggers re-renders
- Type-safe from the start

**⚙️ Actions as Methods:**
- Clean separation: actions modify properties
- Easy to find where state changes happen
- Predictable data flow

**📡 Events as Simple Handlers:**
- Familiar concept: "something happened, react to it"
- Both property changes AND lifecycle events
- No complex reactive chains to debug

**Benefits in Practice:**

✅ **Less Mental Overhead:**
- Don't think: "Should I use `useRef`? `useState`? Take from props?"
- Don't think: "Do I need Redux with slices, reducers, enhancers?"
- Just declare props in structure - they're reactive automatically

✅ **No Optimization Anxiety:**
- Don't think: "Do I need `useCallback` here?"
- Don't think: "Should I wrap this in `useMemo`?"
- Write straightforward code - framework handles optimization

✅ **Better Dependency Control:**
- All dependencies visible in component structure
- Clear data flow: props → actions → events → view
- Easy to trace what affects what

✅ **Easier to Maintain:**
- New developers understand the pattern immediately
- Changes are localized and predictable
- Refactoring is safer with explicit types

#### The Problem with Too Many Degrees of Freedom

Traditional React development offers **too many choices** for managing state and logic:

- Should I use `useState`? `useRef`? `useReducer`?
- Do I need Redux? MobX? Zustand? Jotai?
- Should state live in the component? In a context? In a global store?
- How should I handle derived state? `useMemo`? Computed values?
- What about side effects? `useEffect`? Custom hooks?

**The Result:** Each developer writes differently based on their:
- **Experience level** - beginners vs. experts make different choices
- **Habits** - "I always use Redux because that's what I learned"
- **Patterns from previous projects** - "We did it this way at my last job"
- **Stereotypes and misconceptions** - "Redux is better for large apps"
- **Personal taste** - "I prefer this pattern because it looks cleaner to me"
- **Laziness** - "This is faster to write, even if it's not optimal"

When your component architecture is built on **many different principles** and becomes **complex**, understanding where a problem is hiding becomes extremely difficult. Different components use different approaches, making the codebase inconsistent and hard to reason about.

**When Problems Surface:**
- ❌ **Hard to detect** - Inconsistent patterns mask the root cause
- ❌ **Hard to debug** - Need to understand multiple different approaches
- ❌ **Hard to fix** - Often requires refactoring neighboring components
- ❌ **Hard to prevent** - No clear "right way" to implement features

**dynstruct's Solution: Consistency Through Constraints**

By providing **one clear way** to structure components:
- ✅ All components follow the same pattern
- ✅ Problems are easier to spot (deviations stand out)
- ✅ Fixes are localized (explicit dependencies)
- ✅ New developers onboard faster (consistent approach)
- ✅ Code reviews focus on logic, not architecture debates

The framework constrains your choices in a **productive way** - you have fewer decisions to make, but those constraints guide you toward maintainable, scalable code.

### Performance Characteristics

- ✅ **Stable references** - `.View` components created once
- ✅ **Automatic batching** - Multiple property updates batched automatically
- ✅ **Precise reactivity** - Only properties used in view trigger re-renders
- ✅ **No accidental dependencies** - Can't accidentally subscribe to wrong properties
- ✅ **Clear data flow** - Props → Events → Model changes → View updates

This separation means you can refactor logic, add validation, or change behavior without touching your JSX markup, and without worrying about performance pitfalls.

## Architecture

### Message Channels

The framework provides standard message channels for common operations. Constants are exported from `appDomain/commonContracts` and `appDomain/securityContracts`.

#### Navigation
- `APP.NAV.GOTO` — Navigate to a path
- `APP.NAV.CONTEXT.GET` — Get current navigation context
- `APP.NAV.CONTEXT.CHANGED` — Navigation context changed event
- `APP.NAV.HISTORY.READ` — Read history entry
- `APP.NAV.HISTORY.BACK` / `APP.NAV.HISTORY.FORWARD` — Navigate history

#### Notifications
- `APP.NOTICE` — Display user notification

#### Errors
- `APP.ERROR` — Global error handler

#### HTTP
- `APP.FETCH` — HTTP request

#### Storage
- `APP.STORE.GET` — Get item from storage
- `APP.STORE.SET` — Set item in storage
- `APP.STORE.REMOVE` — Remove item from storage

#### Configuration
- `APP.CONFIG.GET` — Get app configuration
- `APP.SECURITY.CONFIG.GET` — Get security configuration

#### Authentication
- `APP.SECURITY.AUTH.SIGNIN` — Sign in user (broadcast after successful sign-in)
- `APP.SECURITY.AUTH.SIGNIN.REQUEST` — Request sign-in (provider handles credentials)
- `APP.SECURITY.AUTH.SIGNOUT` — Sign out user
- `APP.SECURITY.AUTH.SIGNOUT.REQUEST` — Request sign-out
- `APP.SECURITY.AUTH.REFRESH` — Refresh authentication token
- `APP.SECURITY.AUTH.ENSURE` — Ensure user is authenticated (triggers login flow if not)
- `APP.SECURITY.AUTH.SESSION.GET` — Get current auth session

### Component Lifecycle

Components go through the following lifecycle stages:

1. **Construction** - Component instance is created
2. **Init** - Props and children are initialized
3. **Layout** - Component structure is established
4. **Ready** - Effects are executed, component is ready for interaction
5. **Destroy** - Cleanup functions are called, resources are released

### Message Routing

Messages can be filtered by source using `ComponentMsgFilter`:

- `FromAncestors` - Only receive messages from parent components
- `FromDescendants` - Only receive messages from child components
- `FromSelf` - Only messages from this component
- `FromBus` - Messages from the global bus

```typescript
msgBroker: {
    subscribe: {
        'MY-EVENT': {
            in: {
                callback: (msg, component) => {
                    // Only triggered by parent/ancestor components
                },
                componentFilter: ComponentMsgFilter.FromAncestors
            }
        }
    }
}
```

## API Reference

### Core Modules

**Framework-Agnostic:**
- **componentModel/contracts** - Type definitions for components
- **componentModel/core** - Core utilities (binding, proxy, effects)
- **componentModel/react/componentContext** - Component registry and hierarchy
- **appDomain/appContracts** - Application message structures
- **appDomain/navigation** - Navigation utilities
- **appDomain/securityContracts** - Security type contracts and auth message channels
- **appDomain/commonContracts** - Common message channels (store, nav, config, fetch, DI)
- **services/react/SecurityService** - Security and authentication service component
- **net/client** - HTTP client base class
- **services/ServiceProvider** - Service provider factory

**Framework-Specific:**
- **componentModel/react** - React integration hooks (current)
- **componentModel/solid** - SolidJS integration hooks (planned)
- **componentModel/vue** - Vue.js integration (planned)

### Key Functions

#### `useComponent(def, params)`
Creates a component instance from a definition and parameters.

#### `toReact(useComponentFn)` (React)
Converts a component hook into a React functional component.

**Framework Adapters:**
- `toReact()` - React adapter (currently available)
- `toSolid()` - SolidJS adapter (planned)
- `toVue()` - Vue.js adapter (planned)

#### `bind(getter, setter, handlers?)`
Creates a bidirectional binding for reactive properties.

#### `registerAdapters(msgBus, adapters)`
Registers service adapters with the message bus.

#### `ServiceProvider({ adapters })`
Creates a service provider component from adapters.

## Storybook Examples

This project includes comprehensive Storybook examples demonstrating all major features:

```bash
npm run storybook
```

Available stories:

**Basics:**
- **Simple Component** — Reactive props, child components, dynamic content, factory children
- **Effects** — Auto-tracking reactive effects with pause/resume lifecycle control
- **Custom Msg Struct** — Custom message structures with typed headers

**Communication:**
- **Basic Communication** — Message bus producer/consumer pattern
- **Parent/Child** — Parent intercepts child events, provides local request/response service

**Integration:**
- **Service (Api) Call Example** — HTTP API integration via service adapters and message bus
- **Security Service Example** — Sign-in/sign-out flow and secure API access
- **Storage Service** — Storage service provider usage

## Development

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

### Type Checking

```bash
npm run typecheck
```

## Package Management

Use dedupe for the following packages to avoid version conflicts:

- http-status
- jwt-decode
- mobx
- mobx-react-lite
- mobx-utils
- path-to-regexp
- react
- react-dom
- react-router
- react-router-dom
- @actdim/utico
- @actdim/msgmesh
- rxjs
- uuid

## Contributing

This is a proprietary package. Please contact the author for contribution guidelines.

## License

Proprietary - See LICENSE file for details.

## Author

Pavel Borodaev

## Repository

https://github.com/actdim/dynstruct

## Issues

https://github.com/actdim/dynstruct/issues

## Keywords

typescript, components, react, component-model, architecture, modularity, structure, communication, message-bus, mobx, reactive, type-safe
