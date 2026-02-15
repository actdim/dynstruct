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
- `@actdim/dynstruct/services/react/ServiceProvider`
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
- Use `effects` for derived/auto-tracked behavior; pause/resume/stop through `c.effects.<name>`.
- Prefer `bind(...)` or `bindProp(...)` for two-way value flow between parent and child.

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
- Register handlers in `msgBroker` and use `componentFilter` when source scoping is required.
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
- App domain contracts/utilities: `src/appDomain/*`
- Services: `src/services/*`
- Examples/stories: `src/_stories/componentModel/*`

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
