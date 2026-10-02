# @actdim/dynstruct

> **Structure-First Component Model & Architecture for Large-Scale TypeScript Apps**

[![npm version](https://img.shields.io/npm/v/@actdim/dynstruct.svg)](https://www.npmjs.com/package/@actdim/dynstruct)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![License: BUSL-1.1](https://img.shields.io/badge/License-BUSL--1.1-red.svg)](LICENSE)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
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
        actions: { increment: () => { m.count++; } }, // Mutate directly - reactive UI updates automatically
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
| 📖 [**01. Overview & Key Advantages**](./docs/topic--01-overview-and-advantages.md) | Framework design philosophy, UI companion libraries, and comparison with MobX/React. |
| 🧩 [**02. Core Concepts**](./docs/topic--02-core-concepts.md) | `ComponentStruct`, `ComponentDef`, reactive properties, form helpers (`mapToEdit`), and events. |
| 🏗️ [**03. Architecture & Wiring**](./docs/topic--03-architecture-and-wiring.md) | Message channels, parent-child wiring, direct bindings (`bind`), and effects. |
| ⚛️ [**04. React Integration & Services**](./docs/topic--04-react-integration.md) | `useComponent`, `toReact`, API service adapters, routing, and auth providers. |
| 🛠️ [**05. API Reference & Development**](./docs/topic--05-api-reference.md) | Complete type reference, Storybook integration, and testing commands. |

---

## AI Coding Assistants (Cursor, Claude Code, Copilot, Antigravity)

To enable AI coding agents in your project to follow Dynstruct component architecture, type-safe contracts, and reactive state conventions, add a reference to the bundled LLM documentation in your project's `AGENTS.md`, `CLAUDE.md`, or `.cursorrules`:

```markdown
## Dynstruct Component Guidelines
- Reference: `node_modules/@actdim/dynstruct/llms.txt`
```

This points agents directly to the compact index and modular topics in `node_modules/@actdim/dynstruct/docs/` matching your installed version, avoiding token bloat and version mismatch.

---

## Quick Interactive Demo

Try `@actdim/dynstruct` in your browser via StackBlitz:

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/~/github.com/actdim/dynstruct?file=src/_stories/componentModel/EffectDemo.tsx)

```bash
# Run live Storybook examples locally
pnpm run storybook
```

---

## AI-Assisted Development

Developed with [Along](https://github.com/actdim/along) - a provider-agnostic context and memory system for AI coding agents.

---

## Changelog

### 1.8.0 (2026-10-01)
- `componentModel/react`: components survive the React StrictMode effect re-mount (`bug--strictmode-lifecycle`)
- `params.$events` callbacks are no longer frozen at the first render; lifecycle hooks, `onCatch` and model event handlers call the latest ones (`bug--stale-params-events`)
- Syncing incoming `params` into the model no longer mutates MobX observables during render (`bug--render-phase-props-sync`)
- `net`: `HttpClientError` / `HttpNetworkError` classification (`NetworkErrorKind`) and `isNetworkFailure`; docs on `def.children` composition and `bindProp` priority; `npm test` now runs both the node and React vitest suites

### 1.7.2 (2026-09-27)
- Docs: `ComponentStructExt`, `ComponentProp<T>` reactivity modes and other implemented features documented
- `peerDependencies` on `@actdim/msgmesh` / `@actdim/utico` aligned with published npm versions (`>=1.7.0`)
- Documentation CI workflow and lockfile synchronization fixed

### 1.7.0 - 1.7.1 (2026-09-11)
- Docs and tooling only (AI guidelines, VitePress documentation portal, GitHub Pages workflow); no library changes

### 1.5.15 (2026-09-07)
- `appDomain/commonContracts`: `params` of the `$NAV_GOTO` message is now optional
- React test suites typed without `any`

### 1.5.7 - 1.5.14 (2026-08-27 - 2026-09-07)
- Docs, Along metadata, ESLint config and version bumps only; no library changes

### 1.5.6 (2026-08-27)
- `net/request`: response `Content-Type` is validated against the requested one (throws `HttpClientError` on mismatch); `getHeaderValue`, `getBaseContentType` added
- `net/httpClient`: improved `extractApiName` and init error handling; `ToApiName` type added
- `IRequestParams` / `IRequestCallbacks` are now `type` aliases instead of interfaces

### 1.5.5 (2026-08-26)
- `services/react/SecurityService`: auth support updates; `$RELOAD` message channel added
- `globals`: `__DYNSTRUCT__` flags read from the global object instead of `window`
- tsconfig split (`tsconfig.base` / `build` / `dev`), dependency updates, AGENTS.md and KB docs

### 1.4.8 (2026-06-11)
- **Breaking:** component event handlers moved from `params` to `params.$events`
- **Breaking:** `net/apiError` renamed to `net/httpClientError`, `ApiError` renamed to `HttpClientError`
- `appDomain/securityContracts`: `$AUTH_APPLY` channel to apply auth to outgoing requests
- `ErrorBoundary` re-entrancy guard; React vitest suite added

### 1.4.7 (2026-06-08)
- Extendable security system: `AuthScheme` and per-scheme sign-in credentials (`BasicSignInCredentials`, `BearerSignInCredentials`, ...); `SecurityService` reworked
- **Breaking:** `$AUTH_SESSION_GET` / `$AUTH_SESSION_CHANGED` renamed to `$AUTH_INFO_GET` / `$AUTH_INFO_CHANGED`
- **Breaking:** `net/client` (`ClientBase`) renamed to `net/httpClient` (`HttpClient`, `extractApiName`); `componentModel/react/react` renamed to `componentModel/react/hooks`
- `appDomain/commonContracts`: message taxonomy types (`EventSeverity`, `AppMsgCategory`, `Intent`, ...); `navigation`: `getUrlBuilder`, `getUrlMatcher`

### 1.4.6 (2026-06-04)
- `publishConfig` added to `package.json`; no library changes

### 1.4.4 (2026-05-15)
- `defineByKeyPath`: default key path depth reduced from 5 to 3 after dependency upgrade

### 1.4.3 (2026-05-15)
- License and dependency updates only; no library changes

### 1.4.2 (2026-05-15)
- README cosmetic updates only; no library changes

### 1.4.1 (2026-05-11)
- Computed (getter) model props backed by MobX `computed`; `defineByKeyPath`, `observableWithPaths`
- Array observability fixes
- `ComponentProp.reactive` (`true | false | 'shallow'`) controls prop reactivity
- `toPlain` added

### 1.4.0 (2026-05-08)
- **Breaking:** `ComponentImplStruct` renamed to `ComponentStructExt`, `mapToInput` renamed to `mapToEdit`; `HtmlInputProps<T>` is generic
- `componentModel/react`: incoming params are synced into the model on every render (fixes standard React params with `toReact`)

### 1.3.8 (2026-05-05)
- Model state under `$` via `BaseComponentModel`; `mapToInput(path, exclude)` returns `HtmlInputProps`
- `bindProp` accepts key paths (`KeyPath`)
- Validation refactoring and fixes

### 1.3.7 (2026-05-01)
- `prop()`, `ComponentProp`, `isComponentProp` for declaring props with metadata
- `validate` and `mapToInput` helpers; `ChangeEventHandler` / `BlurEventHandler` types

### 1.3.5 (2026-04-28)
- **Breaking:** `ComponentBase` renamed to `Component`
- `ComponentImplStruct`, `ComponentState`, `ComponentPropState` added; `SecurityService` / `StorageService` updates

### 1.3.4 (2026-04-24)
- `ComponentChildren`: capitalized keys expose a child component's `View` for `<c.children.Name />`

### 1.3.3 (2026-04-24)
- **Breaking:** `componentModel/react` moved to `componentModel/react/react`; `componentModel/scope` and `DisposableComponent` removed
- **Breaking:** `ComponentMethodStruct` renamed to `ComponentActionStruct`; `createRecursiveProxy` replaced by `createModel`

### 1.3.2 (2026-04-22)
- **Breaking:** `SecurityProvider` replaced by `services/react/SecurityService`; `appDomain/commonContracts` split out of `appContracts`; `securityContracts` moved to `appDomain/`
- Lifecycle events `onInit`, `onLayoutReady`, `onReady`, `onLayoutDestroy`, `onDestroy`, `onCatch`; `fallbackView`; component `run` and `abortSignal`
- New channels `$NAV_HISTORY_BACK`, `$NAV_HISTORY_FORWARD`, `$CONFIG_SET`, `$CONFIG_CHANGED`; `di/diContracts`
- `componentContext` moved to `componentModel/react/`

### 1.3.1 (2026-02-21)
- Internal cleanup (type casts, unused view arguments); no API changes

### 1.3.0 (2026-02-16)
- Unmount support: component message bus subscriptions are aborted via `AbortSignal` when the component unmounts (`getComponentMsgBus` takes a global abort signal)
- `BaseSecurityMsgStruct` is now based on `MsgStruct`

### 1.2.9 (2026-02-15)
- `componentModel/react/errorBoundary`: `ErrorBoundary` added; effect fixes
- `isComponent` / `$isComponent` brand; `DynamicContent` updates
- **Breaking:** service adapters (`registerAdapters`, `MsgProviderAdapter`, `ToMsgStruct`, ...) moved from `componentModel/adapters` to `@actdim/msgmesh`

### 1.2.7 (2026-02-13)
- **Breaking:** `getFC` renamed to `toReact`
- Components implement `[Symbol.dispose]`; `onError` disposes the component
- `net/client`: requests abortable via an internal `AbortController` combined with the context `abortSignal`; `[Symbol.dispose]` support

### 1.2.6 (2026-01-22)
- **Breaking:** message channel constants renamed to dot notation (`APP.NAV.GOTO`, `APP.STORE.GET`, ...); `$KV_STORE_*` renamed to `$STORE_*`, security `$SIGNIN` etc. renamed to `$AUTH_SIGNIN` etc.
- `appDomain/util`: `toAppError`, `isAppError`; `SecurityProvider` / `SecurityContext` no longer generic over user info
- Abort handling fixes

### 1.1.7 (2026-01-16)
- Non-React services: `createServiceProvider`, `createStorageService`; React wrappers moved to `services/react/`
- **Breaking:** components created by `getFC` exported without the `FC` suffix (`NavServiceFC` -> `NavService`, `StorageServiceFC` -> `StorageService`)

### 1.1.6 (2026-01-16)
- Component id fixes
- **Breaking:** `BaseComponentContext` renamed to `BaseContext`; `useBaseAppContext` removed

### 1.1.5 (2026-01-15)
- **Breaking:** `$id` / `$key` symbols replaced with plain `$id` / `$key` params

### 1.1.4 (2026-01-15)
- **Breaking:** `componentModel/componentModel` split into `componentModel/contracts`, `componentModel/core` and `componentModel/react`
- Component id system: per-type sequential ids via context `getNextId`, `ComponentTreeNode`, `getComponentNameByCaller`; disposing fix
- `ValueConverter`, `ValidationResult` types; `StorageService` test

### 1.1.2 (2026-01-08)
- **Breaking:** service adapters refactored: `ToMsgStruct`, `ToMsgChannelPrefix`, `getMsgChannelSelector`, `BaseServiceSuffix` replace `BASE_API_CHANNEL_PREFIX` / `ToApiChannelPrefix`

### 1.1.1 (2026-01-06)
- Message broker typing fix for `msgScope` provide/subscribe channels

### 1.1.0 (2026-01-06)
- Component `effects` with `createEffect` / `EffectController` (MobX `autorun` with cleanup)
- Stricter API typing; `onDestroy` receives the component

### 1.0.7 (2026-01-05)
- **Breaking:** `Component` renamed to `ComponentDef`, `ComponentModelBase` to `ComponentBase`; `AppBusChannels` to `AppMsgChannels`
- `registerAdapters` moved to `componentModel/adapters` (takes `MsgProviderAdapter[]` and an abort signal); `ServiceProvider` added
- `DisposableComponent` implements `Disposable`

### 1.0.5 (2026-01-01)
- Version bump and VS Code snippet update only; no library changes

### 1.0.4 (2025-12-31)
- `ComponentContextProvider` / `useComponentContext`; `ComponentMsgFilter`
- `NavService` and `StorageService` components; `registerAdapters` / `MsgBusAdapterProvider`
- **Breaking:** `*BusStruct` types renamed to `*MsgStruct` (`BaseAppBusStruct` -> `BaseAppMsgStruct`, ...)

### 1.0.3 (2025-11-14)
- Component id support; `DynamicContent` / `useDynamicContent`; `globals` (`getGlobalFlags`)
- **Breaking:** `bindProp` takes a target getter (`bindProp(() => obj, 'prop')`); `$NAV_GET_CONTEXT` value changed, `$NAV_CONTEXT_CHANGED` added
- Storybook examples

### 1.0.2 (2025-11-10)
- Dependency updates only; no library changes

### 1.0.0 (2025-11-09)
- `$NAV_READ_HISTORY` / `NavHistory` added
- **Breaking:** `DisposableModel` removed
- pnpm and test tooling

### 0.9.3 (2025-10-06)
- `net/apiError`: `http-status` default import fix; package updates

### 0.9.0 (2025-07-08)
- Initial version: `componentModel` (component model, scope), `appDomain` (app contracts, navigation, security provider), `net` (`client`, `request`, `apiError`)

---

## License

Proprietary / BUSL-1.1. See [LICENSE](LICENSE) for details.
MIT License. See [LICENSE](LICENSE) for details.
