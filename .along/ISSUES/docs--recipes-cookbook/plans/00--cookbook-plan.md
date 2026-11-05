# Cookbook plan: task-oriented recipes for dynstruct

Issue: `docs--recipes-cookbook`. Status: plan only, nothing implemented yet.
Execution Mode: Direct (docs only, no library source changes).

## 1. Problem

The current docs (`topic--01` .. `topic--05`, `AGENTS.md`) are reference-shaped: concepts, contracts,
API. They answer "what is `bindProp`", not "how do I make a form with validation". Searching the site
for "validate" lands on many granular fragments (contracts, core concepts, React integration) with no
single place that shows the whole scenario end to end. Storybook and the demo show scenarios, but as
code without explanation, and the mempart webapp has patterns that are not shown anywhere.

## 2. Goal and non-goals

- Add a new **Cookbook** section: one short recipe per everyday task, in one format.
- Do not rewrite existing pages. Allowed edits there: one "See the Cookbook" link line.
- Do not change library code or stories. Inconsistencies found go to the follow-up list (section 9).

## 3. Recipe format (fixed template)

```markdown
### <Task as "I want to ..." phrase>

**When**: one line - the situation.

```tsx
// minimal working code: struct + def + view, current API only
```

**How it works**: 2-5 lines.

**Gotchas**:
- ...

**See also**: [reference topic](./topic--0X-....md#anchor) - [story/demo source](../src/_stories/...)
```

Rules:
- Code is complete enough to paste (imports shown once per page in a "Common imports" block).
- Every code sample is taken from or checked against an existing story, demo struct, test or webapp file.
- Each recipe names the anti-pattern it replaces when there is one (callback props, reading
  `params.x`, inline dynstruct tags in `view`, direct MobX).
- English, ASCII typography, fenced blocks with a language, relative links only
  (`../src/...` links are rewritten to GitHub by `docs/.vitepress/config.ts`).

## 4. Page structure

All new files under `docs/`, frontmatter like the existing topics (`protocol: along`, `slug`, `title`,
`type: topic`, `created`, `updated`, `tags: [cookbook, ...]`).

| # | File | Title |
|---|---|---|
| 0 | `topic--cookbook.md` | Cookbook (landing page) |
| 1 | `topic--cookbook-components.md` | Components: the basics |
| 2 | `topic--cookbook-data-flow.md` | Data flow and bindings |
| 3 | `topic--cookbook-forms-validation.md` | Forms and validation |
| 4 | `topic--cookbook-composition.md` | Composition, lists and dialogs |
| 5 | `topic--cookbook-messaging.md` | Messaging (MsgMesh) |
| 6 | `topic--cookbook-services.md` | Services and API calls |
| 7 | `topic--cookbook-auth-navigation.md` | Navigation and auth |
| 8 | `topic--cookbook-errors-testing.md` | Errors, loading and testing |

### 0. `topic--cookbook.md` (landing)

- One paragraph: what the cookbook is, how it differs from the reference.
- **"I want to..." table**: task -> recipe link (all ~60 recipes, grouped by page). This table is the
  main entry point for search ("validate", "list", "dialog", "parent", "child").
- Canonical component skeleton (struct -> `useXxx` -> `def` -> `useComponent` -> `let c` / `let m`
  -> `toReact`) with numbered comments, from the `AGENTS.md` "Quick Template".
- "Five rules that save you hours" (short): no `params.x` in the hook; children in `def.children`,
  rendered as `<c.children.Name />`; bindings are lazy (`() => m`); no callback props between
  components - use the bus; no direct MobX.
- Recipe template legend (section 3).

### 1. Components: the basics (`topic--cookbook-components.md`)

| Recipe | Code basis | Key API | Gotchas to state |
|---|---|---|---|
| 1.1 Define a component | `_stories/componentModel/SimpleButton.tsx`, demo `counterStruct.tsx` | `ComponentStruct`, `ComponentDef`, `useComponent`, `toReact` | `let c`/`let m` assigned after `useComponent`; every struct prop has a default in `def.props` (`undefined` allowed) |
| 1.2 Hide internals: public vs private struct | `ConverterDemo.tsx`, `StateExample.tsx`, webapp `UserStoragesList.tsx` | `ComponentStructExt`, `as Component<ImplStruct>`, return `Component<Struct>` | private props/children/actions/effects invisible to callers |
| 1.3 Defaults vs params | `SimpleEdit.tsx`, `tests/react/params-semantics.test.tsx` | `def.props`, `ComponentParams` | plain param = initial value only (DEV warning on later change); never `params.x` in the hook |
| 1.4 Computed property | `EffectDemo.tsx`, `tests/react/component.test.tsx` | getter in `def.props`, `readonly` in struct | use `m`, not `this`; works on nested objects |
| 1.5 Actions | `EffectDemo.tsx`, `counterStruct.tsx` | `def.actions`, `m.action()` | actions live on the model, not on `c`; batched and routed to `onCatch` |
| 1.6 Mount in React, ids | `ParentChildConnectionExample.tsx`, `tests/react/hierarchy-and-children.test.tsx` | `toReact`, `$id`, `$key`, `c.id` | id is not applied to DOM automatically; `toReact` tag only at the React boundary |
| 1.7 Provide the bus at the app root | `_stories/componentModel/bootstrap.ts`, webapp `config/appConfig.ts`, `MainLayout.tsx` | `createMsgBus`, `ComponentContextProvider`, `mandatoryProvider` | one bus per app; service components mounted once near the root |
| 1.8 Prop reactivity modes | demo `reactivityStruct.tsx`, webapp `FolderContentView.tsx`, `ToastService.tsx` | `prop({ reactive: true/false/'shallow'/'ref' })` | `'ref'`: replace, do not mutate; `'shallow'`: item edits are silent |
| 1.9 React content in props (slots, icons, nodes) | `tests/react/reactElementParams.test.tsx`, ui-core `AdaptiveDialog.tsx` | `prop({ reactive: 'ref' })` | DEV throws "holds a React value" for deep-reactive props |
| 1.10 **Two kinds of `children`** | `contracts.ts` (`ComponentChildren`, `ComponentViewProps.children`) | `c.children.x` / `<c.children.X />` vs React `props.children` | lowercase key = component instance (`.model`, `.effects`), Capitalized = View; React `children` of `<Comp>...</Comp>` arrives as a prop (needs `'ref'` if stored); why children are a separate namespace (no name clash with props, not proxied, own lifecycle) |

### 2. Data flow and bindings (`topic--cookbook-data-flow.md`)

| Recipe | Code basis | Key API | Gotchas |
|---|---|---|---|
| 2.1 Pass a value parent -> child (read-only) | `StateExample.tsx`, `counterStruct.tsx` | `bind(() => m.x)`, dotted param keys (`'avatar.imageUrl'`) | `bind` without setter is read-only |
| 2.2 Two-way bind child prop to parent prop | `EffectDemo.tsx`, demo `formDemoStruct.tsx` | `bindProp(() => m, 'x')`, nested `'user.name'` | binding priority: `bindProp` > `bind(get)` > `bind(get, set)` |
| 2.3 Two-way bind with custom logic | webapp `TopBar.tsx`, `SimpleComponent.tsx` | `bind(get, set)` | only when get/set really transform |
| 2.4 Convert values (number <-> string, date <-> ts) | `ConverterDemo.tsx`, `tests/react/bindings.test.tsx` | `ValueConverter`, 3rd arg of `bind` | invalid input handling in `convertBack` |
| 2.5 Bind a whole object | `EffectDemo.tsx` (`contact: bind(() => m)`) | `bind` | shape must match the child prop type |
| 2.6 Child -> parent: tell the parent something happened | webapp `UserStoragesList.tsx` + item, `TestContainer.tsx`/`TestChild.tsx` | `c.msgBus.send`, `msgBroker.subscribe` + `ComponentMsgFilter.FromDescendants` | why not callback props; when `on*` props are fine (primitive DOM wrappers); two lists do not hear each other |
| 2.7 Call a child's action / read child model | webapp `PdfReader.tsx`, `TestContainer.tsx` | `c.children.x.model.action()` | lowercase key gives the instance |
| 2.8 React to a prop change | `TestContainer.tsx`, webapp `AdminUsersView.tsx` | `events.onChangeX`, `onChangingX` (return `false` to cancel), `onPropChange` | (verify) whether `onChangeX` fires when the prop is bound from the parent - webapp comment in `ImportToDriveDialog.tsx` says no |
| 2.9 Re-run logic when inputs change | webapp `SimilarWorksCarousel.tsx`, `ImportToDriveDialog.tsx` | `def.effects` + struct `effects: 'name'`, key in a closure | effects auto-track what they read; guard with a key to avoid refetch |
| 2.10 Read an external store reactively (i18n, theme) | ui-core `i18n/i18nRuntime.ts`, `tests/react/external-store.test.tsx` | `fromExternalStore` | never import MobX directly |
| 2.11 Pass model data to non-dynstruct code | `AGENTS.md` | `toPlain` | proxies must not leak into REST clients / `postMessage` |

### 3. Forms and validation (`topic--cookbook-forms-validation.md`)

This page is the direct answer to "how do I validate". It opens with a decision table:
built-in validators (`validator` + `c.validate()` + `m.$.propState`) vs hand-made `errors` map, and when
to use each.

| Recipe | Code basis | Key API | Gotchas |
|---|---|---|---|
| 3.1 Bind an input to a prop (native inputs) | `StateExample.tsx` | `c.mapToEdit('path')`, `mapToEdit<HTMLSelectElement>` | `exclude` arg; works with nested paths |
| 3.2 Validate a field on blur / on change | `StateExample.tsx`, `tests/react/validation-and-forms.test.tsx` | `prop({ validator: { onBlur, onChange, validate } })` | validator on a nested path is declared with a dotted key in `def.props` |
| 3.3 Show field errors | `StateExample.tsx` | `m.$.propState[path].error`, `.validation.isValid`, `m.$.isValid` | (verify) valid result contract: `undefined` vs `{ isValid: true }` |
| 3.4 Async validator (uniqueness check on server) | `validation-and-forms.test.tsx` | `validate: async (v) => ...`, `c.msgBus.request` inside | debounce/stale result handling |
| 3.5 Validate the whole form before submit | `validation-and-forms.test.tsx` | `await c.validate()`, `onSubmit` flag, `m.$.isValid` | validate one path: `c.validate('email')` |
| 3.6 Cross-field validation (password confirm, date ranges) | `validation-and-forms.test.tsx` | `events.onValidate` returning a map of path -> result | results from `def.events` and `$events` are merged |
| 3.7 Form with dynstruct-mui inputs | demo `formDemoStruct.tsx`, webapp `CreateGroupDialog.tsx` | `useTextField({ value: bindProp, error: bind, helperText: bind })` | labels via `bind(() => t(...))` |
| 3.8 Submit: disabled + loading button, server error banner | webapp `CreateGroupDialog.tsx`, `ReportDialog.tsx` | `submitting` prop, `bind(() => m.submitting)`, action with try/finally | UI text from `HttpClientError.code` + `params`, never `message` |
| 3.9 Map server validation errors to fields | `AGENTS.md` (HttpClientError), `tests/httpClientError.test.ts` | `HttpClientError.details/code/params` -> `m.$.propState` or `errors` map | (verify) whether propState can be set from outside; otherwise `errors` map |
| 3.10 Reset the form when a dialog opens | webapp `ReportDialog.tsx` (`onChangeOpen`), `ImportToDriveDialog.tsx` (effect) | `onChangeOpen` or effect with edge detection | depends on result of check 2.8 |
| 3.11 Hand-made validation (`errors` map) | demo `formDemoStruct.tsx` | `prop({ initialValue: {} })`, `validate` action | when built-in validators are not enough |

### 4. Composition, lists and dialogs (`topic--cookbook-composition.md`)

| Recipe | Code basis | Key API | Gotchas |
|---|---|---|---|
| 4.1 Split a big view into fragments | `StateExample.tsx`, `SimpleComponent.tsx` | `React.FC` child, `<c.children.Summary />` | fragments are observers - only they re-render |
| 4.2 Use a child component | `SimpleComponent.tsx`, `BasicCommunicationExample.tsx` | `def.children`, `<c.children.Button />` | never `<Button prop={m.x} />` inline in `view` |
| 4.3 Render a list of child components | webapp `UserStoragesList.tsx`, `SimpleComponent.tsx` (`dynEdit`) | factory child `(p) => useItem({ item: bind(() => p.item) })`, `<c.children.DynItem key=... item=... />` | factory props are read-only; do not pass `p` whole; item domain object in `prop({ reactive: 'ref' })` |
| 4.4 Conditionally render / lazily create a child | demo `playgroundStruct.tsx`, `SecurityServiceExample.tsx` | factory without params `() => useX({})`, `{m.flag && <c.children.X />}` | instance lifetime when hidden |
| 4.5 Put one child into another child's slot | demo `showcaseStruct.tsx`, `dialogToastStruct.tsx` | `children: () => <c.children.UserAvatar />` | one view rendered twice = DEV warning "mounted more than once" |
| 4.6 Generic render-function component | `componentModel/DynamicContent.tsx`, `SimpleComponent.tsx` | `useDynamicContent({ data, render })` | use the 2nd `render` arg |
| 4.7 Parent-controlled dialog | webapp `GroupsManager.tsx` + `CreateGroupDialog.tsx`, ui-core `AdaptiveDialog.tsx` | `open: bindProp(() => m, 'dialogOpen')`, derived `open: bind(() => Boolean(m.toDelete))` | dialog always mounted, visibility via `open` |
| 4.8 Open a global dialog from anywhere | webapp `IntakeDialog.tsx`, demo `dialogToastStruct.tsx` | `UI.X.OPEN` channel, `msgBroker.subscribe` | mounted once near root |
| 4.9 Large collections | webapp `FolderContentView.tsx` | `prop({ reactive: 'shallow' })` | replace vs mutate |
| 4.10 Use components from a UI kit (dynstruct-mui) | demo structs | `useButton`, `useTextField`, `useSelect`, ... | `value: bindProp` + `onChange` routed through an action |

### 5. Messaging (`topic--cookbook-messaging.md`)

| Recipe | Code basis | Key API | Gotchas |
|---|---|---|---|
| 5.1 Declare app channels | `customMsgStruct/CustomMsgStruct.ts`, webapp `appConfig.ts`, feature `*MsgStruct.ts` | `MsgStruct<{ 'X': { in; out } }> & BaseAppMsgStruct`, `KeysOf` / `AppMsgChannels` | event = only `in`; request = `in` + `out`; channel naming conventions |
| 5.2 Declare what a component uses | `TestChild.tsx`, `TestContainer.tsx` | `msgScope: { publish, subscribe, provide }` | a channel missing in `msgScope` is not type-legal |
| 5.3 Send an event | `basicCommunication/TestEventProducer.tsx` | `c.msgBus.send` | payload auto-unwrapped (`toPlain`), `sourceId` header set |
| 5.4 Subscribe to an event | `TestEventConsumer.tsx`, webapp `ToastService.tsx` | `def.msgBroker.subscribe` | auto-unsubscribe on unmount; imperative `c.msgBus.on` needs cleanup in `onDestroy` |
| 5.5 Request/response | `CustomMsgStructExample.tsx`, `TodoEdit.tsx` | `msgBroker.provide` (return = `out`), `await c.msgBus.request` | (verify) `group` default when omitted (stories omit, webapp passes `'in'`) |
| 5.6 React after someone else handled a request | `customMsgStruct/TodoList.tsx` | subscribe to the `out` group | fires after the provider returned |
| 5.7 Filter by topic / entity id | webapp `LibraryService.tsx`, `ErrorOverlay.tsx` | `topic: jobId`, `topic: '/.*/'` | regex topic syntax |
| 5.8 Scope messages to a subtree | `TestContainer.tsx`, `tests/react/msgbroker-and-communication.test.tsx` | `ComponentMsgFilter.FromDescendants` / `FromAncestors` | two instances on one page stay isolated |
| 5.9 State-like channels (theme, layout, filter) | webapp `appConfig.ts`, demo `bus/portalBus.ts` | `replayBufferSize: 1` | late subscribers get the current value |
| 5.10 Custom headers (priority, tenant) | `CustomMsgStruct.ts`, `TodoEdit.tsx` | `ComponentMsgHeaders & {...}`, `Component<Struct, Headers>` | |
| 5.11 Toasts / notifications | webapp `ToastService.tsx`, `appConfig.ts` | `APP.NOTICE` | single channel for all notices |
| 5.12 Talk to the bus from plain React or outside React | webapp `AppRoutes.tsx`, ui-core `LayoutService.tsx` | `msgBus.on` in `useEffect` with returned unsubscribe; `initXxxService(bus)` | show the correct cleanup (webapp currently leaks) |
| 5.13 Islands / separate React roots share one bus | demo `bus/portalBus.ts`, `PortalProvider.tsx` | singleton bus in browser, per-render on SSR | |

### 6. Services and API calls (`topic--cookbook-services.md`)

| Recipe | Code basis | Key API | Gotchas |
|---|---|---|---|
| 6.1 Expose an API client on the bus | `serviceCall/ApiServiceProvider.ts`, webapp `appConfig.ts` | `ToMsgChannelPrefix`, `ToMsgStruct`, `getMsgChannelSelector`, `ServiceProvider` | `static readonly name`; channel = `API.<NAME>.<METHOD>` |
| 6.2 Call an API method | `ServiceCallExample.tsx`, webapp `UserStoragesList.tsx` | `c.msgBus.request({ channel, payloadFn })` / positional `payload: [a, b]` | prefer `payloadFn`; result in `msg.payload` |
| 6.3 Write an HTTP client | `securityService/SecureApiClient.ts` | `extends HttpClient`, `this.fetch({ url, method, useAuth })` | requests aborted on dispose |
| 6.4 Generated clients (NSwag) behind the bus | webapp `appConfig.ts`, `api/registerAdapters.ts` | adapters + hand-written `provide` overrides | object vs positional payloads |
| 6.5 Load data when a component appears | webapp `UserStoragesList.tsx`, `ServiceCallExample.tsx` | `events.onReady` + action | `onReady` is async-safe; `onInit` has no DOM |
| 6.6 Show a loading indicator | `componentState/StateExample.tsx` | `m.$.pendingRequestCount` | counts only requests via own `c.msgBus`; manual flag alternative |
| 6.7 Search as you type (debounce + drop stale results) | webapp `AdminUsersView.tsx`, demo `asyncSearchStruct.tsx` | `onChangeQuery` + timer, sequence guard or `AbortController` | (verify) auto-abort of `c.msgBus.request` on unmount via `c.abortSignal` |
| 6.8 Write a service as a component | webapp `LibraryService.tsx`, `LangService.tsx` | `view: () => null`, `msgBroker.provide` | cleanup of imperative subscriptions in `onDestroy` |
| 6.9 Persist values (storage service) | `storageService/StorageServiceExample.tsx` | `StorageService`, `APP.STORE.SET/GET/REMOVE` | (verify) GET response shape - story and test disagree |
| 6.10 Track a background job (push + polling) | webapp `LibraryService.tsx` | topic subscription + interval fallback | optional, advanced |
| 6.11 Provide app config | `SecurityServiceExample.stories.tsx` | `appMsgBus.provide({ channel: 'APP.CONFIG.GET' })` | |

### 7. Navigation and auth (`topic--cookbook-auth-navigation.md`)

| Recipe | Code basis | Key API | Gotchas |
|---|---|---|---|
| 7.1 Declare typed routes | `bootstrap.ts`, webapp `AppRoutes.tsx` | `createNavigationRoute<Params>`, `satisfies NavRoutes`, `BaseAppMsgStruct<AppRoutes>` | |
| 7.2 Navigate from code | webapp `ExplorerPage.tsx`, `tests/react/services.test.tsx` | `APP.NAV.GOTO` (`route` / `url` / `path: -1`) | group `'ex'` vs `'in'` per payload kind (explain) |
| 7.3 Links | `tests/react/nav-link.test.tsx`, webapp `BottomNav.tsx` | `NavLink`, `createNavLinkClick`, `getUrlBuilder` | modified clicks left to browser |
| 7.4 Read query params / react to location change | webapp `ExplorerPage.tsx` | `APP.NAV.CONTEXT.GET`, `APP.NAV.CONTEXT.CHANGED` | |
| 7.5 Sign in / sign out | `SecurityServiceExample.tsx`, `LoginDialog.tsx` | `APP.SECURITY.AUTH.SIGNIN` / `SIGNOUT`, `SignInCredentials` | |
| 7.6 Protect a page | webapp `GroupsPage.tsx`, `SecurityServiceExample.tsx` | `AUTH.ENSURE` or `AUTH.INFO.GET` + redirect | |
| 7.7 Custom auth backend | `SecurityServiceExample.tsx`, `AGENTS.md` | `useConventions: false`, `*.REQUEST` + `APPLY` providers | |
| 7.8 Bearer tokens by convention | `AGENTS.md`, `tests/react/security-service-config.test.tsx` | `useConventions: true`, `endpoints.authSignIn` | init rejects without endpoints |
| 7.9 Authorized API calls | `SecureApiClient.ts` | `useAuth: true` -> `APP.SECURITY.AUTH.APPLY` | |

### 8. Errors, loading and testing (`topic--cookbook-errors-testing.md`)

| Recipe | Code basis | Key API | Gotchas |
|---|---|---|---|
| 8.1 Where errors go (one diagram) | `AGENTS.md` "Error handling pattern" | swallowed vs rethrown boundaries | table: hooks/effects/bindings vs actions/bus callbacks |
| 8.2 Handle async errors in component state | `ErrorBoundaryDemo.tsx` | `onCatch`, action + retry button | call through `m.load()`, not raw `load()` |
| 8.3 Render errors and a fallback UI | `ErrorBoundaryDemo.tsx`, `tests/react/error-boundary.test.tsx` | `useErrorBoundary`, `fallbackView` | no reset/retry API yet (link to `feat--view-error-boundary-retries`) |
| 8.4 Show collected errors | `SecurityServiceExample.tsx` | `m.$.errors` | |
| 8.5 Global error overlay / toast | `ErrorOverlay.tsx`, webapp `appConfig.ts` | `APP.ERROR`, `MSGBUS.ERROR` subscriptions | `payload.source.id` to locate the component |
| 8.6 Run a helper inside the boundary | `AGENTS.md` | `c.run(handler, silent)` | prefer actions |
| 8.7 Test a component with a fake backend | `tests/react/*.test.tsx`, webapp `tests/libraryConsumerView.test.ts` | real bus + `msgBus.provide` on API channels, `ComponentContextProvider`, Testing Library | no HTTP mocking needed |
| 8.8 Test a service / adapter in isolation | webapp `tests/libraryCatalogBrowser.test.ts` | `createMsgBus`, `msgBus.request` assertions | |
| 8.9 SSR / hydration basics | `tests/react/ssr.test.tsx`, demo `ssrCatalogStruct.tsx` | `getNextId` in context, `onInit` only on server | short, links to `topic--04` SSR section |

## 5. Wiring (additive only)

- `docs/.vitepress/config.ts`:
  - nav: `{ text: 'Cookbook', link: '/topic--cookbook' }` after "Overview";
  - sidebar: new group "Cookbook" (9 links) placed second, right after "Overview & Index".
- `docs/INDEX.md`: regenerated by `/along-kb-sync` (projection, not hand-edited).
- One link line at the top of `topic--02-core-concepts.md` and `topic--04-react-integration.md`:
  "Looking for task-oriented examples? See the [Cookbook](./topic--cookbook.md)."
- `README.md`: one line in the docs section pointing to the Cookbook (optional).
- `llms.txt` / `docs/public/llms*.txt`: regenerate if the KB sync handles them, otherwise add the
  cookbook pages manually to the index list.

## 6. Facts to verify in source before writing (do not copy from catalogs)

1. Does `onChangeX` fire when the prop is backed by a parent binding? (`core.tsx` ~L415, L597-615, L805;
   webapp comment in `ImportToDriveDialog.tsx` says it does not.) Decides recipes 2.8 and 3.10.
2. Is `c.msgBus.request` cancelled on unmount via `c.abortSignal` automatically? (`AGENTS.md` says yes;
   no example passes a signal.) Decides 6.7.
3. `APP.STORE.GET` response shape: `msg.payload.data.value` (story) vs raw value (test). Decides 6.9.
4. Validator result contract: is `undefined` a valid result, or must it be `{ isValid: true }`?
   When does `onSubmit: true` trigger? Decides 3.2-3.5.
5. Default `group` when `send`/`request` omit it; meaning of `'ex'` for `APP.NAV.GOTO` with `route`.
6. Can app code write field errors into `m.$.propState` (server-side errors), or is it read-only? Decides 3.9.
7. `ComponentMsgFilter` values combine as flags (`FromAncestors | FromDescendants`)?

## 7. Order of work

1. Verify section 6 facts (read-only).
2. Write pages in priority order: forms-validation, data-flow, composition, components, messaging,
   services, auth-navigation, errors-testing, then the landing page (its table is built last from the
   final recipe titles).
3. Wiring (section 5).
4. Verification (section 8), commit via `/along-commit`, `along wrap`.

Estimated size: ~60 recipes, each 20-50 lines; 8 pages of 250-450 lines plus the landing page.

## 8. Verification

- `along lint` on new files: ASCII typography, fence languages, relative links, no `docs/` -> `.along/` links.
- `pnpm run docs:build` succeeds; the "Cookbook" group appears in the sidebar; local search for
  "validate", "list", "dialog", "parent" returns a cookbook recipe as one of the first hits.
- Snippets not copied verbatim from an existing file are type-checked in a scratch `.tsx` inside the
  repo's `tsc -b` scope (removed afterwards).
- `/along-kb-sync` regenerates `docs/INDEX.md` with the new topics.
- `git diff --stat`: new files plus `config.ts`, `INDEX.md` and the one-line links only.

## 9. Follow-ups found during research (separate issues, not in this scope)

- `SecurityServiceExample.tsx:157` - `await await` typo.
- `StorageServiceExample.tsx` declares `msgScope.provide` but only sends/requests;
  demo `asyncSearchStruct.tsx` declares `publish: 'RPC.SEARCH'` but never uses the bus.
- Storage GET payload shape differs between story and test.
- webapp `AppRoutes.tsx` `DocumentTitleManager` - `msgBus.on` in `useEffect` without unsubscribe (mempart issue).
- No example passes `c.abortSignal`; no first-class component test harness (webapp tests mock
  `useComponent`). Possible `feat--component-test-harness`.
- The mempart webapp uses none of the built-in validation APIs (`validator`, `mapToEdit`,
  `c.validate`); worth checking why (API gaps for MUI inputs?) once the forms recipes exist.
