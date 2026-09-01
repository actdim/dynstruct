---
protocol: along
protocol_version: "2.2.8"
slug: architecture
title: Architecture
type: topic
created: 2026-08-27
updated: 2026-09-02
tags: [architecture]
---

# @actdim/dynstruct Architecture

## 1. System Overview

`@actdim/dynstruct` is a structure-first component architecture and application framework for building scalable, modular TypeScript applications. It decouples UI layout, state management, inter-component communication, and external services through explicit type-level wiring and a reactive message bus.

```
+---------------------------------------------------------------------------------------------------+
|                                        @actdim/dynstruct                                          |
+---------------------------------------------------------------------------------------------------+
|  Structure-First Type Layer (Zero Runtime Cost)                                                   |
|  - ComponentStruct<TMsg, { props, actions, children, msgScope, effects }>: Pure Type Contract    |
|  - ComponentStructExt: Extended internal state definition                                         |
+---------------------------------------------------------------------------------------------------+
|  Hook-Constructor & Model Layer                                                                   |
|  - use<Component>(params: ComponentParams<Struct>): Component<Struct>                            |
|  - ComponentDef<Struct>: Runtime definition (props, actions, events, children, effects, view)     |
|  - ComponentModel<Struct>: Reactive MobX proxy with $state, $, validate(), mapToEdit()            |
|  - Two-way Data Binding: bind(get, set, converter), bindProp(target, path)                         |
+---------------------------------------------------------------------------------------------------+
|  Component Hierarchy & Message Routing                                                            |
|  - ComponentRegistryContext: Tree registration, getParent(), getChildren(), getHierarchyPath()    |
|  - Scoped MsgBroker: Narrowed bus channels (subscribe, publish, provide)                          |
|  - Directional Msg Filtering: ComponentMsgFilter.FromAncestors, ComponentMsgFilter.FromDescendants|
+---------------------------------------------------------------------------------------------------+
|  Framework Adapters & Service Integrations                                                        |
|  - toReact(useComponent): Standard React FC adapter with memoization                             |
|  - DynamicContent: Slot-based dynamic layout renderer                                             |
|  - Service Providers: ServiceProvider, StorageService, NavService, SecurityService (JWT / Auth)   |
|  - UI Integrations: @actdim/dynstruct-mui (MUI adapters: Button, Dialog, TextField, etc.)         |
+---------------------------------------------------------------------------------------------------+
```

## 2. Core Architectural Principles

### 2.1. Structure-First Composition
In traditional component models, parent components reference child implementations directly in markup (`<ChildButton />`). In `dynstruct`:
1. **Component Structures are pure types**: `CounterPanelStruct` declares child types (`children: { btn: ButtonStruct }`) without requiring any runtime JavaScript code.
2. **Explicit Dependency Tree**: The complete component dependency graph is verifiable at the TypeScript compiler level before executing runtime code.
3. **Hook-Constructors**: Each component is instantiated via a hook function (`useCounterPanel`), wiring props, actions, and child hook-constructors.

### 2.2. Reactive Component Model (`ComponentModel`)
All declared `props` automatically become reactive (powered by MobX observable proxies).
- **Actions**: Wrap state mutations in batched transactions (`runInAction`).
- **Events**: Type-safe event hooks generated with full IntelliSense (`onChange<PropName>`, `onInit`, `onReady`, `onDestroy`, `onError`).
- **Internal State Helper (`$`)**: Exposes component ID, lifecycle state, validation status (`$.propState`), and error tracking.

### 2.3. Decoupled Message Bus (`msgScope`)
Instead of prop-drilling or global singletons, components declare a `msgScope` over the application message bus (`@actdim/msgmesh`):
- `subscribe`: Channels the component listens to.
- `publish`: Channels the component dispatches events to.
- `provide`: Channels for which the component provides request/response handlers.
- **Hierarchical Routing**: Subscriptions can restrict message acceptance using `ComponentMsgFilter.FromAncestors` or `FromDescendants`.

### 2.4. React Adapter Layer (`toReact`)
`toReact` converts any dynstruct hook-constructor into an idiomatic, memoized React functional component (`React.memo`), enabling seamless integration into existing React codebases.

## 3. Cross-Links
- [Knowledge Base Root](./INDEX.md)
- [Domain Contracts](./topic--domain-model.md)
- [Setup, Build & Workflow](./topic--setup-and-workflow.md)
- [API Reference](./topic--05-api-reference.md)
