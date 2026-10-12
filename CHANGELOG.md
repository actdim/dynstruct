# Changelog

All notable changes to `@actdim/dynstruct` are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- An async action awaiting another action (after an `await`) no longer reports the same error twice when another wrapped call runs in between: an async rejection with an error already reported by a run started after it (the awaited nested run) is not reported again; concurrent calls failing with the same error object are each reported (`debt--dynstruct-review-followups`).
- A prop declared through a getter that returns a `ComponentProp` (`get x() { return prop(...) }`) takes its param (plain value or binding) again; only true computed props ignore params (`debt--dynstruct-review-followups`).
- `c.msgBus` payload normalization keeps class instances (`File`, `Blob`, `Date`, `Map`, ...) by reference; they were rebuilt from their own enumerable keys and arrived as `{}` (`bug--normalize-payload-class-instances`).
- `magic-string` (used by `@actdim/dynstruct/vite/plugin`) is a runtime `dependency` and external in the build; it was a devDependency bundled into `dist/node_modules` (`debt--dynstruct-review-followups`).

## [1.8.2] - 2026-10-11

### Fixed
- Rendering no longer breaks when a debugger is attached (VS Code integrated browser, any Chromium with DevTools/CDP open) and a React element is passed through params, e.g. `<Comp><Outlet /></Comp>`. The visible error was `Cannot read properties of undefined (reading 'mode')` in react-dom `handleThrow`; the root cause was `'run' called with illegal receiver`: `wrapUserCode` descended into the element and wrapped its DEV-only `_debugTask.run`, and the model converted/proxied the element (`bug--wrap-user-code-react-elements`).

- `regType` no longer crashes component creation in Firefox / Safari: the stack-based detection only understood V8 frames and `undefined.replace` threw for every component without `def.regType` (`feat--regtype-vite-plugin`).
- `run()` error dedup no longer suppresses the same error object forever: a nested rethrow is reported once, the same object thrown again in a later call is reported again (`bug--error-dedup-singleton-errors`).
- A plain param for a computed (getter) prop no longer crashes creation: ignored with a DEV warning (`bug--component-model-dev-guards`).
- DEV checks are no longer compiled out of `dist`: the library build froze `import.meta.env.DEV` to `false`; it now emits `process.env.NODE_ENV !== "production"`, decided by the consumer's bundler (`bug--dev-checks-stripped-in-build`).

### Added
- `@actdim/dynstruct/vite/plugin` - `dynstructPlugin()` derives `regType` at build time from the hook-constructor name (`useStorageCard` -> `'StorageCard'`) and injects it into `useComponent` (new 4th argument `meta`, `ComponentMeta`). Without the plugin: DEV stack label, production `'component'`; no stack reads in production (`feat--regtype-vite-plugin`).
- React objects (`$$typeof`: elements, portals, `memo` / `forwardRef` / `lazy` types, contexts) are never wrapped by `wrapUserCode` (`feat--react-values-opaque-and-ref-props`).
- DEV warning when one component's view is mounted more than once at the same time (`bug--component-model-dev-guards`).
- `ComponentProp.reactive: 'ref'` (`prop({ reactive: 'ref' })`): reassignment is tracked, the value is stored by reference and never converted or proxied. Use it for React content slots that start empty and are filled later (`feat--react-values-opaque-and-ref-props`).

### Changed
- **Breaking:** params are applied once, at creation: a plain param is an initial value, live input goes only through bindings (`bindProp` / `bind`); the params->model sync on every commit is removed. `toReact` props and JSX props of factory children stay live through bindings (controlled by the parent while defined, `undefined` falls back to the default). Service params `$events` / `$id` / `$key` are no longer stored in the model. Callback props replaced on later renders keep error routing. DEV warnings: plain param changed after creation, write to a read-only bound prop, `toReact` prop first passed after creation. Migration: `useChild({ open: params.open })` -> `open: bindProp(() => m, 'open')`; factory child `item: p.item` -> `item: bind(() => p.item)`; `props: { value: params.value ?? '' }` -> `props: { value: '' }` (ADR `params-initial-value-semantics`, `debt--params-initial-value-semantics`).
- **Breaking:** React values are stored in the model only in `reactive: 'ref'` props (anywhere inside them; also `false` and `'shallow'` items). No auto-detection: a React value in a deep-reactive prop (default, plain param, assignment, nested) throws in DEV; production does not check. Values read through bindings (`toReact` props incl. `children`, factory-child props, `bind` / `bindProp`) are not affected. Removes the recursive scan of every object prop on each read/write (ADR `react-values-in-ref-props`, `feat--react-values-in-ref-props`, supersedes `bug--nested-react-nodes-proxy-prevention`).
- Docs: Anti-patterns section (AGENTS.md); error handling patterns (actions wrapped automatically, helper closures via `c.run`); `regType` via the Vite plugin (`docs--dynstruct-anti-patterns`).
- Tooling: `eslint.config.mjs` repaired (broken merge), react-hooks limited to `rules-of-hooks` / `exhaustive-deps`, `prefer-const` ignores the `let c; let m` pattern; the along test hook no longer hides the test summary (`task--dynstruct-tooling-repair`).
- Docs: React values in props and `reactive: 'ref'` (AGENTS.md, `topic--02-core-concepts`, `topic--04-react-integration`, `topic--05-api-reference`); the `topic--02-core-concepts` reactivity example now uses `prop(...)` - a plain object literal is a prop value, not a prop definition (`docs--react-values-and-ref-prop`).

## [1.8.0] - 2026-10-01

Commit `2979886`.

### Fixed
- Components no longer break under the React StrictMode effect re-mount (`bug--strictmode-lifecycle`).
- `params.$events` callbacks are no longer frozen at the first render: lifecycle hooks, `onCatch` and model event handlers call the latest ones (`bug--stale-params-events`).
- Syncing incoming `params` into the model no longer mutates MobX observables during render (`bug--render-phase-props-sync`).
- `npm test` runs both the node and React vitest suites (commit `368c305`).

### Added
- `net`: `HttpClientError` / `HttpNetworkError` classification and `isNetworkFailure` (browser and node network errors).

### Changed
- Docs: child composition (`def.children`) and `bindProp` priority (`docs--child-composition-and-bindprop-priority`).
- Along protocol 4.4.1; AI commit attribution disabled.

## [1.7.2] - 2026-09-27

Commits `3c37508`, `14857fe`.

### Changed
- Docs: `ComponentStructExt`, `ComponentProp<T>` reactivity modes and other implemented features documented (`docs--missing-architectural-features`).

### Fixed
- Documentation CI workflow and lockfile synchronization.

## Earlier versions

See the [Changelog section of README.md](./README.md#changelog).
