# Agent Development Guide for `@actdim/dynstruct`

This file defines how agents should implement and modify code in this repository.

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
- `@actdim/dynstruct/net/httpClient` — `HttpClient` base class for auth-aware API clients
- `@actdim/msgmesh/contracts`
- `@actdim/msgmesh/core`
- `@actdim/msgmesh/adapters`

## SecurityService and HttpClient

### SecurityService

`SecurityService` is a built-in service component — mount it near the app root. It manages `AuthInfo` state and exposes auth channels to all descendants.

- `useConventions: true` (default): handles Bearer token flow (HTTP sign-in, storage, refresh). Configure via `domainConfig.endpoints.*`.
- `useConventions: false`: delegates to custom providers via `APP.SECURITY.AUTH.SIGNIN.REQUEST` / `APP.SECURITY.AUTH.SIGNOUT.REQUEST`. Use for demos, mocks, or custom backends.

Key channels (constants from `appDomain/securityContracts`):
- `$AUTH_SIGNIN` — sign in, returns `AuthInfo`
- `$AUTH_SIGNOUT` — sign out, clears state
- `$AUTH_ENSURE` — ensure authenticated; redirects to login if not
- `$AUTH_INFO_GET` — get current `AuthInfo`
- `$AUTH_INFO_CHANGED` — event published on auth state change

### HttpClient

`HttpClient` is the base class for typed API service clients. Extend it for each API — each public method becomes a typed bus channel via the service adapter.

- Call `this.fetch({ url, method, useAuth?, body?, contentType? })` inside methods.
- Set `useAuth: true` on a request to inject the `Authorization` header automatically (reads current `AuthInfo` from SecurityService via the bus).
- Requests are aborted on `[Symbol.dispose]()` / unmount.

Pattern: extend `HttpClient` → register via `ServiceProvider` alongside `SecurityService` → consume via `c.msgBus.request(...)`.

```ts
export class MyApiClient extends HttpClient {
    static readonly name = 'MyApiClient' as const;
    readonly name = 'MyApiClient' as const;

    getUser(id: string): Promise<User> {
        return this.fetch({ url: `/api/users/${id}`, method: 'GET', useAuth: true });
    }
}
```

See `src/_stories/componentModel/securityService/SecureApiClient.ts` for a working example.

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
- `view` for rendering — use `<c.children.Name />` (Capitalized) for all child types
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
  - `onCatch` (not `onError`) for error handling — signature: `(error, component?) => void`
  - Lifecycle handlers may be `async`:
    - `onInit` — once on creation, before first render; sync setup only, no DOM
    - `onLayoutReady` / `onLayoutDestroy` — maps to `useLayoutEffect` / its cleanup; sync, DOM is available
    - `onReady` / `onDestroy` — maps to `useEffect` / its cleanup; async-safe, primary hook for data loading
  - Effect bodies (`def.effects`) are also wrapped by the framework error router — errors propagate to `onCatch`.
- Use `effects` for derived/auto-tracked behavior; pause/resume/stop through `c.effects.<name>`.
- Use a **getter in `def.props`** to declare a computed (auto-tracked) property. The framework detects getter-only descriptors and registers them as computed values automatically — no manual annotation needed. Declare the prop as `readonly` in the struct type. Reference `m` (not `this`) inside the getter body because TypeScript does not type `this` in `PropertyDescriptor` getters:

  ```ts
  // struct type
  type Struct = ComponentStruct<AppMsgStruct, {
    props: {
      firstName: string;
      lastName: string;
      readonly fullName: string;  // computed — mark readonly
    };
  }>;

  // def
  const def: ComponentDef<Struct> = {
    props: {
      firstName: '',
      lastName: '',
      get fullName() {
        // `this` is untyped in TS getter descriptors — use `m` instead
        return `${m.firstName} ${m.lastName}`.trim();
      },
    },
  };
  ```

  This also works for **nested object properties**: define the getter on the nested object literal inside `def.props`. The framework propagates computed annotations through any depth of nesting.
- Use `prop({ reactive: ... })` to control how a prop is tracked. Default is fully reactive. Options:
  - `reactive: false` — completely non-reactive; reads and writes are invisible to the reactivity system
  - `reactive: 'shallow'` — array container is reactive (push/pop tracked), but item properties are not

  Works for top-level and nested paths alike. Can be used without `initialValue` as a pure annotation:

  ```ts
  props: {
    config: prop({ initialValue: { debug: false }, reactive: false }),
    'user.tags': prop({ reactive: 'shallow' }),  // tags is declared elsewhere
  }
  ```

- Prefer `bind(...)` or `bindProp(...)` for two-way value flow between parent and child. **Never pass `m` directly** to a child — `def.children` is evaluated before `m = c.model`, so `m` is `undefined` at that point. Always use a lazy getter: `bind(() => m)` or `bindProp(() => m, 'prop')`.
- Use `fallbackView` in `ComponentDef` together with `useErrorBoundary: true` to render an error fallback UI instead of `view` when the component catches a render-time error.
- Use `ComponentStructExt<Struct, {...}>` **inside** a hook-constructor to declare private reactive props, internal children (often `React.FC` sections), and effects. The extended type is invisible to callers; return `Component<Struct>` from the hook to preserve the public API. See `componentState/StateExample.tsx`.
- Use `ComponentImpl<Struct, Internals>` when you need non-reactive, per-instance data (e.g., a cache or lock). Pass initial internals as the third argument to `useComponent`; access via `c._`. Return `Component<Struct>` to hide internals from callers. See `services/react/StorageService.tsx`.

### Error handling pattern

`onCatch` is called automatically whenever an error crosses the **dynstruct API boundary**. This covers:
- Lifecycle hooks: `onInit`, `onLayoutReady`, `onReady`, `onLayoutDestroy`, `onDestroy` — sync and async
- Actions (`def.actions`) — wrapped by the framework; action calls are batched automatically and errors propagate to `onCatch`
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
        onCatch: (err) => { handleError(err); },
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
- **importing or using MobX directly** (`observable`, `computed`, `action`, `autorun`, etc.) — the framework manages reactivity internally; direct MobX usage bypasses the component model and breaks framework guarantees
- passing reactive model values to external APIs without stripping proxies — use `toPlain(value)` from `@actdim/dynstruct/componentModel/core` before handing data to REST clients, third-party libs, or `postMessage`

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
- In `view`, render all children with a **Capitalized** name: `<c.children.Name />`. This is a JSX shortcut — instead of `<c.children.avatarView.View />` you write `<c.children.AvatarView />`. For full dynstruct component children (`ComponentStruct` types) the camelCase name additionally exposes the full component instance (`c.children.avatarView.model`, `c.children.avatarView.effects`). For `React.FC` and factory function children only the Capitalized JSX shortcut exists — these are lightweight fragments without their own model.

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
  - `componentState/` — `ComponentStructExt`, form validation with validators, `m.$` and `mapToEdit`
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
    view: () => <div>{m.value}</div>,
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};
```
