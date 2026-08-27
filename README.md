# @actdim/dynstruct

> **Structure-First Component Model & Architecture for Large-Scale TypeScript Apps**

[![npm version](https://img.shields.io/npm/v/@actdim/dynstruct.svg)](https://www.npmjs.com/package/@actdim/dynstruct)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-red.svg)](LICENSE)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/~/github.com/actdim/dynstruct?file=src/_stories/componentModel/EffectDemo.tsx)

---

## What is Dynstruct?

**`@actdim/dynstruct`** is a TypeScript-first component system and architectural framework. It replaces fragile prop-drilling, scattered MobX observables, and tightly-coupled component trees with **declarative component structures**, **zero-boilerplate MobX reactivity**, and **decoupled message bus channels**.

### The Problem It Solves
- **Spaghetti React State**: Scared of refactoring because prop-drilling and callback chains bleed through 5 layers of UI?
- **Implicit Dependencies**: Hard to tell what data or API services a component needs just by reading its signature?
- **Reactivity Boilerplate**: Tired of manual `makeAutoObservable`, `autorun` cleanup, and useEffect dependencies?

### The Output You Get
- ⚡ **Explicit Type-Safe Contracts**: Declare props, actions, child structures, and message channels at the TypeScript level before writing UI code.
- 🎯 **Decoupled Architecture**: Components interact over typed message channels (`@actdim/msgmesh`) rather than hard-coded callbacks.
- 🔄 **Automatic Fine-Grained Reactivity**: Mutate `model.prop = value` and UI updates automatically. Zero extra hooks or boilerplate.
- 🎨 **First-Class UI Adapter Support**: Ready-to-use Material UI adapters via [`@actdim/dynstruct-mui`](https://www.npmjs.com/package/@actdim/dynstruct-mui).

---

## 15-Second Code Snippet

```typescript
import { ComponentStruct, ComponentDef, ComponentParams } from '@actdim/dynstruct/componentModel/contracts';
import { useComponent, toReact, bind } from '@actdim/dynstruct/componentModel/react';

// 1. Declare pure type structure (Zero runtime code needed)
type CounterStruct = ComponentStruct<AppMsgStruct, {
    props: { count: number };
    actions: { increment: () => void };
}>;

// 2. Define component logic & view
const useCounter = (params: ComponentParams<CounterStruct>) => {
    let c: Component<CounterStruct>;
    let m: ComponentModel<CounterStruct>;

    const def: ComponentDef<CounterStruct> = {
        props: { count: 0 },
        actions: { increment: () => { m.count++; } }, // Mutate directly — reactive UI updates automatically
        view: () => (
            <button onClick={m.increment}>Count: {m.count}</button>
        ),
    };

    c = useComponent(def, params);
    m = c.model;
    return c;
};

// 3. Export as a native React component
export const Counter = toReact(useCounter);
```

---

## Installation

```bash
pnpm add @actdim/dynstruct @actdim/msgmesh @actdim/utico mobx mobx-react-lite react react-dom
```

---

## Documentation Index

Explore the complete guide step-by-step from core concepts to advanced patterns:

| Section | Description |
|---|---|
| 📖 [**01. Overview & Key Advantages**](./docs/01-overview-and-advantages.md) | Framework design philosophy, UI companion libraries, and comparison with MobX/React. |
| 🧩 [**02. Core Concepts**](./docs/02-core-concepts.md) | `ComponentStruct`, `ComponentDef`, reactive properties, form helpers (`mapToEdit`), and events. |
| 🏗️ [**03. Architecture & Wiring**](./docs/03-architecture-and-wiring.md) | Message channels, parent-child wiring, direct bindings (`bind`), and effects. |
| ⚛️ [**04. React Integration & Services**](./docs/04-react-integration.md) | `useComponent`, `toReact`, API service adapters, routing, and auth providers. |
| 🛠️ [**05. API Reference & Development**](./docs/05-api-reference.md) | Complete type reference, Storybook integration, and testing commands. |

---

## Quick Interactive Demo

Try `@actdim/dynstruct` in your browser via StackBlitz:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/~/github.com/actdim/dynstruct?file=src/_stories/componentModel/EffectDemo.tsx)

```bash
# Run live Storybook examples locally
pnpm run storybook
```

---

## License

Proprietary / BUSL-1.1. See [LICENSE](LICENSE) for details.
