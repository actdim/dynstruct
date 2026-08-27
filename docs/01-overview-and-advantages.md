# Overview & Key Advantages

[← Back to README](../README.md) | [Next: 02. Core Concepts →](./02-core-concepts.md)

---

## What is @actdim/dynstruct?

**`@actdim/dynstruct`** is a TypeScript-based component model and architectural framework for building scalable, modular web applications. It provides a **structure-first, declarative approach** to component design with:

- **Type-safe component model** with explicit dependency wiring visible at compile-time.
- **Decoupled messaging architecture** using `@actdim/msgmesh` for inter-component and service communication.
- **Component lifecycle management** with automatic initialization, ready, layout, and cleanup hooks.
- **Zero-boilerplate reactive state** powered by MobX — properties automatically trigger UI re-renders on mutation.
- **Type-safe component events** — automatic event handlers for lifecycle and property changes with full IntelliSense.
- **UI Component Adapters** — seamless integration with design systems like Material UI (`@actdim/dynstruct-mui`).

---

## Framework Support

- ✅ **React** — Fully supported (`useComponent`, `toReact`, `toReactView`, MobX integration).
- 🚧 **SolidJS** — Planned / In development.
- 🚧 **Vue.js** — Planned.

The architectural core (`@actdim/dynstruct/componentModel/contracts`) is framework-agnostic. The exact same component structures, message buses, and business contracts work across UI frameworks.

---

## UI Component Adapters & Companion Libraries

- 🎨 **[@actdim/dynstruct-mui](https://github.com/actdim/dynstruct-mui)** — Official Material UI (MUI v5/v6) component adapters for dynstruct. Provides ready-to-use reactive hook-constructors and React components (`Button`, `TextField`, `Dialog`, `Drawer`, `Table`, `Tabs`, `Autocomplete`, etc.).

---

## Key Advantages: Why Dynstruct?

Already familiar with React, MobX, or Redux? Here is why `dynstruct` provides a superior architectural model for large-scale enterprise applications:

### 1. Type Safety Without Magic Strings
- All message channels and component props are defined in central contracts with full TypeScript typing.
- Full IDE autocomplete and IntelliSense for all props, actions, and message channels.
- Compile-time verification prevents typos and invalid props before running any code.

### 2. Clear Component Boundaries
- `msgScope` explicitly documents a component's external communication (what channels it publishes to or subscribes to).
- Anyone reading the component structure immediately understands what services or events it consumes or provides.
- Significantly reduces cognitive load when reading complex codebases.

### 3. Loose Coupling
- Components communicate over typed message channels without needing direct imports or callback drilling.
- Easy to add, move, or swap components without breaking parent/child dependencies.
- Backend services can be swapped or mocked in tests without altering UI component implementation logic.

### 4. Structure-First Visibility
- **Parent structure** explicitly references child component structures (`children: { resetBtn: ButtonStruct }`).
- Gives a complete static tree of responsibilities and dependencies at the type level.

### 5. Effortless Testing & Mocking
- The message bus can be easily mocked using standard `@actdim/msgmesh` helper utilities:
```typescript
import { createMsgBus } from '@actdim/msgmesh/core';

// Create mock bus for testing
const mockMsgBus = createMsgBus<AppMsgStruct, ComponentMsgHeaders>({});
const sendSpy = jest.spyOn(mockMsgBus, 'send');

// Instantiates component with mock bus
const component = useComponent(def, { msgBus: mockMsgBus });

// Assert message emission
expect(sendSpy).toHaveBeenCalledWith({
    channel: 'USER.CLICKED',
    payload: expect.any(Object)
});
```

---

[← Back to README](../README.md) | [Next: 02. Core Concepts →](./02-core-concepts.md)

