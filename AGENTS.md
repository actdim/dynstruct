# Codex Guide for `@actdim/dynstruct`

This file defines how Codex should implement and modify code in this repository.

## Goal

Produce framework-consistent `dynstruct` code:
- structure-first component composition
- explicit dependencies through `children` and `msgScope`
- typed message-bus communication through `@actdim/msgmesh`
- reactive state through component model props (not local React state by default)

## Tech Stack and Runtime

- Language: TypeScript
- UI: React adapter for dynstruct (`componentModel/react`)
- Reactivity: MobX (wrapped by dynstruct internals)
- Messaging: `@actdim/msgmesh`
- Tests: Vitest
- Build: Vite + TypeScript

## Canonical Imports

Use public package paths (or equivalent local source paths in this repo):

- `@actdim/dynstruct/componentModel/contracts`
- `@actdim/dynstruct/componentModel/react`
- `@actdim/dynstruct/componentModel/core`
- `@actdim/dynstruct/appDomain/appContracts`
- `@actdim/dynstruct/appDomain/commonContracts` — common channels: store, nav, config, fetch, DI
- `@actdim/dynstruct/appDomain/securityContracts` — auth channels and security types
- `@actdim/dynstruct/services/react/ServiceProvider`
- `@actdim/dynstruct/services/react/SecurityService`
- `@actdim/msgmesh/contracts`
- `@actdim/msgmesh/core`
- `@actdim/msgmesh/adapters`

When editing this repo source, mirror existing import style from nearby files.

## Component Authoring Standard

Use hook-constructors as the primary component format:

1. Define `ComponentStruct<MsgStruct, {...}>` with `props/actions/children/effects/msgScope` as needed.
2. Implement `useXxx(params: ComponentParams<Struct>)`.
3. Create `ComponentDef<Struct>` with:
- `props` defaults
- `actions` for user intent
- `events` for lifecycle and property change reactions
- `effects` for auto-tracked reactive logic
- `children` for explicit composition
- `view` for rendering
4. Instantiate via `useComponent(def, params)`.
5. Prefer `let c` and `let m` pattern:
- `c` is component instance
- `m` is `c.model` reactive model
6. Export `toReact(useXxx)` only when React component interoperability is needed.

## State and Reactivity Rules

- Keep mutable UI state in `def.props` / `c.model`.
- Use `events` for controlled side effects on property changes:
  - `onChangingX` to validate/sanitize before set
  - `onChangeX` after set
  - `onPropChanging`/`onPropChange` for generic handlers
  - `onCatch` (not `onError`) for error handling — signature: `(component, error, info?) => void`
  - Lifecycle handlers may be `async`:
    - `onInit` — once on creation, before first render; sync setup only, no DOM
    - `onLayoutReady` / `onLayoutDestroy` — maps to `useLayoutEffect` / its cleanup; sync, DOM is available
    - `onReady` / `onDestroy` — maps to `useEffect` / its cleanup; async-safe, primary hook for data loading
  - Effect bodies (`def.effects`) are also wrapped by the framework error router — errors propagate to `onCatch`.
- Use `effects` for derived/auto-tracked behavior; pause/resume/stop through `c.effects.<name>`.
- Prefer `bind(...)` or `bindProp(...)` for two-way value flow between parent and child. **Never pass `m` directly** to a child — `def.children` is evaluated before `m = c.model`, so `m` is `undefined` at that point. Always use a lazy getter: `bind(() => m)` or `bindProp(() => m, 'prop')`.
- Use `fallbackView` in `ComponentDef` together with `useErrorBoundary: true` to render an error fallback UI instead of `view` when the component catches a render-time error.

### Error handling pattern

`onCatch` is called automatically whenever an error crosses the **dynstruct API boundary**. This covers:
- Lifecycle hooks: `onInit`, `onLayoutReady`, `onReady`, `onLayoutDestroy`, `onDestroy` — sync and async
- Actions (`def.actions`) — wrapped in `runSafe` before MobX annotation; MobX handles batching, dynstruct handles errors
- Property event handlers: `onGetX`, `onChangingX`, `onChangeX`, `onPropChanging`, `onPropChange`
- Binding get/set functions (`bind`, `bindProp`)
- Effect bodies (`def.effects`)
- MsgBus subscriber and provider callbacks; `c.msgBus.request(...)` calls

Manual `try/catch` is needed only for code that is **outside** this boundary — a plain function in an `onClick` that does not call any dynstruct API. Use a shared `handleError` function so both paths call the same logic:

```ts
function handleError(err: unknown) {
    m.status = 'error';
    m.errorMessage = err instanceof Error ? err.message : String(err);
}

const def: ComponentDef<Struct> = {
    useErrorBoundary: false, // async errors; no render-time throwing expected
    events: {
        onReady: async () => { await load(); }, // framework routes rejection → onCatch
        onCatch: (_, err) => { handleError(err); },
    },
    view: () => (
        // load() calls a plain fetchData() — not a dynstruct call, so catch manually
        <button onClick={async () => {
            try { await load(); } catch (err) { handleError(err); }
        }}>Retry</button>
    ),
};
```

When `view` itself may throw, keep `useErrorBoundary: true` (default) and optionally provide `fallbackView`.

Avoid:
- introducing local `useState`/`useReducer` for state that belongs to component model
- ad-hoc cross-component mutation without message bus or bindings
- hidden dependencies not declared in `children` or `msgScope`

## Messaging Rules

- Define channels in message struct first.
- Narrow component responsibilities with `msgScope`:
  - `subscribe`
  - `publish`
  - `provide`
- `msgScope` channels are validated at the TypeScript type-alias level: using a non-existent channel name produces a compile-time error immediately in the `type Struct = ComponentStruct<...>` declaration.
- Register handlers in `msgBroker` and use `componentFilter` when source scoping is required.
- Standard channel constants are exported from `appDomain/commonContracts` (navigation, storage, config, fetch) and `appDomain/securityContracts` (auth). Use the constants — not raw strings — in channel references.
- Use:
  - `c.msgBus.send(...)` for fire-and-forget
  - `c.msgBus.request(...)` for request-response

For service APIs:
- use `@actdim/msgmesh/adapters` to transform service class methods into typed channels
- provide adapters through `ServiceProvider` wrappers

## Composition and Performance Rules

- Prefer parent-child composition via `children` over passing unstable inline objects/functions deep into tree.
- Keep JSX mostly structural; put behavior in `actions/events/effects`.
- Reuse existing component structures rather than creating parallel incompatible patterns.

## File and Story Conventions

- Framework internals: `src/componentModel/*`
- React-specific internals: `src/componentModel/react/*` (e.g. `componentContext.tsx`)
- App domain contracts/utilities: `src/appDomain/*`
- Services: `src/services/*`
- Examples/stories: `src/_stories/componentModel/*`
  - `basicCommunication/` — producer/consumer pattern
  - `serviceCall/` — API adapter integration
  - `securityService/` — auth flow
  - `storageService/` — storage service
- Shared story styles: `src/_stories/componentModel/styles.ts` (`row`, `labelStyle`, `detailsStyle`)

When adding a feature:
- update or add Storybook example if behavior is user-visible
- keep naming aligned with existing stories and component files

## Validation Checklist (before finishing)

Run relevant checks when possible:

```bash
pnpm run typecheck
pnpm run test
pnpm run lint
pnpm run build
```

If full run is heavy, run minimum impacted checks and state what was not run.

## Change Quality Bar

- Maintain strict typing; avoid `any` unless unavoidable and justified.
- Preserve backward compatibility of public contracts when possible.
- Keep changes minimal and local to task scope.
- Add concise comments only where logic is non-obvious.

## Quick Template

```ts
type MyStruct = ComponentStruct<AppMsgStruct, {
  props: { value: string };
  actions: { setValue: (v: string) => void };
  children: {};
  effects: 'syncSomething';
}>;

const useMy = (params: ComponentParams<MyStruct>) => {
  let c: Component<MyStruct>;
  let m: ComponentModel<MyStruct>;

  const def: ComponentDef<MyStruct> = {
    props: { value: params.value ?? '' },
    actions: {
      setValue: (v) => { m.value = v; },
    },
    effects: {
      syncSomething: () => {
        // reactive logic
      },
    },
    view: (_, c) => <div>{m.value}</div>,
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};
```
