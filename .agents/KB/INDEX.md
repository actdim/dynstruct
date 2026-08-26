# @actdim/dynstruct Knowledge Base Index

Welcome to the **@actdim/dynstruct** Knowledge Base. This knowledge base provides comprehensive architectural documentation, domain models, API references, workflows, and practical patterns for the structure-first TypeScript component framework.

## Knowledge Base Articles

- [[01-architecture.md]] — **Architecture & Design Principles**: Structure-first type scaffolding (`ComponentStruct`), hook-constructors (`useComponent`), reactive model (`ComponentModel`), decoupled message bus (`msgScope`), and React adapters (`toReact`).
- [[02-domain-model.md]] — **Domain Model & Type Contracts**: `ComponentStruct`, `ComponentDef`, two-way bindings (`bind`, `bindProp`), component state helper (`$`), and directional message filtering (`ComponentMsgFilter`).
- [[03-setup-and-workflow.md]] — **Setup, Build & Storybook Workflow**: Build scripts, Vitest test suites, Storybook catalog (`src/_stories/componentModel/`), and developer workflows.
- [[04-api-reference.md]] — **Exhaustive API Reference**: Complete API reference for `useComponent`, `toReact`, `bind`, `bindProp`, `prop`, `validate`, `mapToEdit`, `<DynamicContent />`, and `@actdim/dynstruct-mui` components.
- [[05-patterns-and-recipes.md]] — **Patterns, Recipes & Storybook Guide**: Production recipes for parent-child wiring with two-way bindings, decoupled message bus producers/consumers, directional routing, and reactive effects.

## Core Concepts & Pipeline

| Concept | Role |
|---|---|
| **`ComponentStruct`** | Pure TypeScript type declaration defining props, actions, child structures, effects, and message scope. |
| **`use<Component>`** | Hook-constructor creating component instance via `useComponent(def, params)`. |
| **`ComponentModel`** | Reactive MobX observable state proxy with automatic `onChange<Prop>` event notifications. |
| **`bind` / `bindProp`** | Two-way data binding connecting parent model state to child component props. |
| **`msgScope`** | Scoped access to `@actdim/msgmesh` message bus (`subscribe`, `publish`, `provide`) with tree filtering. |
| **`toReact`** | Memoized React functional component adapter for integration into standard React apps. |
