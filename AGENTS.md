<!-- BEGIN ALONG-PROTOCOL root (managed by along-init - do not edit by hand) -->
# ALONG-PROTOCOL v4.4.7

This repo carries its own agent context, provider-agnostically. Follow it every session, whatever tool you are.

## Scope, Precedence & Subproject Placement
- **Nearest Context Boundary**: Any folder may carry its own `AGENTS.md` + `.along/`; use the NEAREST ones for the area you're working in. On conflict, the more specific wins.
- **Subproject Localization** [gate: subproject-boundary]: In submodules, nested repos or symlinked folders: all entities (issues, sessions, ADRs, history) MUST be created in the NEAREST `.along/`. Agents are STRICTLY FORBIDDEN from dumping subproject changes into the workspace root `.along/`.
- **Multi-Subproject Work** [gate: subproject-boundary]: A change spanning subprojects needs an issue in each touched `.along/`, or a root umbrella issue whose child issues there carry `parent: <umbrella key>`. Edits under a subproject `.along/` are checked by path.
- **Subproject Boundary**: only a nested `.git` or a user-run `along init` makes a subproject; never init a manifest folder.
- **Precedence**: Nearest `.along/` > higher-level `.along/` > global config (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/config/GEMINI.md`).

## At session start - read these yourself (they are NOT auto-loaded)
Use the NEAREST `.along/` for the area you're working in (fall back to a higher-level one if the folder has none):
1. `AGENTS.md` (nearest) - conventions to follow.
2. `.along/ISSUES.md` - active issue board (or query `/along-kb-search`).
3. `.along/CONSTRAINTS.md` - active architectural constraints (or full log in `.along/DECISIONS.md` / `.along/DECISIONS/`).
4. Active Issue file `.along/ISSUES/<type>--<slug>.md` for your task.
Also, when relevant: `.along/VISION.md`, `.along/GLOSSARY.md`. These reflect the state WHEN WRITTEN - verify any named file/API/flag against the real code first.

## Multi-Agent & Multi-Branch Concurrency
- **Zero-Manual-Merge Rule** [gate: projection-protection]: On merge conflicts in derived projections (`ISSUES.md`, `INDEX.md`, `DECISIONS.md`), accept either side and run `/along-issue-sync`, `/along-kb-sync`, or `/along-decision-sync` to recompile. `along git setup` registers merge drivers that do this automatically; afterwards run `along git sync`.
- **Append-Only Merge Driver**: `.along/HISTORY.md` and legacy monolithic `.along/DECISIONS.md` are append-only. Configure `.gitattributes` with `merge=union`. Modular ADR files in `.along/DECISIONS/` are isolated per-file to eliminate merge collisions.
- **Untracked Exports** [gate: untracked-exports]: `.along/dashboard.html`, `.along/DASHBOARD.md` and per-machine `.along/diagnostics/` stay out of Git.
- **Context Isolation**: Context is localized to the target issue file, session-scoped blackboard (`.along/.session/<slug>/`), and completed session logs.
- **Parallel Closeout**: `along session list`; on the user's yes `along plan approve --closeout --ready`, then `along session close --ready`.

## Mandatory Issue Anchoring
- **No Code Without Issue** [gate: require-active-issue]: Before modifying source code, agents MUST identify or create an issue in `.along/ISSUES/<type>--<slug>.md` and set `status: in-progress`.
- **Session Binding & Plan Approval** [gate: require-plan-approval]: `along start <slug>` binds THIS agent session to the issue; parallel sessions keep their own bindings. Source edits unlock after the user approves the plan (Claude Code: `ExitPlanMode`; elsewhere `along plan approve` only after the user's explicit yes). `along plan status` shows the binding.
- **Exemptions**: Read-only Q&A and 1-line micro-edits (typo fixes, comments) do not require issues.
- **Commit Binding** [gate: commit-issue-binding]: Every commit via `/along-commit` MUST bind to the active issue slug.
- **No AI Co-Authors** [gate: commit-no-ai-coauthor]: Commit messages MUST NOT carry `Co-Authored-By:` trailers naming an AI agent (GitHub lists the vendor as a contributor). `along hook install` turns runtime attribution off; opt out via `.along/config.json` `commits.allow_ai_coauthor: true`.

## Entity Ecosystem
- **Entity types**: Issues (`feat`, `bug`, `debt`, `task`, `docs`), Decisions (ADRs), Milestones, Risks, Spikes, Checklists, Sessions. Full YAML schemas: `docs/topic--domain-model.md`.
- **Canonical keys**: `<type>--<slug>` (e.g. `feat--token-refresh`). Reference by key, NEVER by file path.
- **ADRs**: Modular records in `.along/DECISIONS/ADR-YYYY-MM-DD--<slug>.md` (with legacy fallback to monolithic `DECISIONS.md`). Never edit past entries - mark superseded. Recompile projections (`.along/DECISIONS.md` board and `.along/CONSTRAINTS.md`) via `/along-decision-sync` or `along decision sync`.
- **Issue lifecycle** [gate: issue-lifecycle]: Close with `along issue done <slug>` (`status: done`, `completed`, moved to `.along/ISSUES/done/`).
- **Entity references** [gate: entity-reference-integrity]: Never delete an entity other entities reference; use `along issue rename` / `along issue supersede`.
- **Auto-entity creation**: Agents MUST automatically detect user intent (build/fix/refactor -> Issue, blocked/rate-limit -> Risk, compare/benchmark -> Spike, release/sprint -> Milestone) and create entities without prompting the user.

## Knowledge Base & Documentation
- **Stable Entry Point** [gate: stable-entry-point]: `README.md` and `docs/` never link into `.along/`; route through `docs/INDEX.md` or `docs/topic--<slug>.md`.
- **Portable Links** [gate: portable-links]: Relative Markdown links only.
- **Fact Grounding**: Agents MUST extract facts from actual code, `README.md`, `docs/`, and `package.json`. Generic LLM placeholders are strictly prohibited.
- **Fast Retrieval** [gate: fast-retrieval]: Agents MUST query `/along-kb-search` before reading whole documentation files.
- **Doc Blast Radius**: After non-trivial code changes, agents MUST map affected symbols to `docs/topic--*.md` articles and update them before completing the task.
- **Manual Document Lock** [gate: doc-manual-lock]: Documents marked with `write_policy: manual` (or `locked: true`) are protected from automated agent modification during blast radius sweeps. Modifications require an explicit documentation issue (`docs--<slug>`).
- **Managed Rule Packs** [gate: rule-pack-protection]: Never edit `.along/rules/**/*.md`; `along rules attach` owns them. Project guidelines go to `docs/topic--<slug>.md` or "Project specifics"; revert with `along rules restore`. `.along/rules/gates.yaml` and `.along/scripts/` stay repo-owned.
- **Documentation Routing Tree**:
  - Architectural choice / trade-off -> `.along/DECISIONS/` (ADR)
  - Public overview / pitch / landing page -> `README.md`
  - Technical interface contract / CLI spec -> `docs/topic--<slug>.md` (`type: reference`)
  - Conceptual explanation / comparison / philosophy -> `docs/topic--<slug>.md` (`type: explanation`, `write_policy: manual`)
  - Procedural walkthrough / runbook -> `docs/topic--<slug>.md` (`type: guide`)

## While working
- **Decisions**: Create new ADRs via `/along-decision-sync` or `along decision create <slug> --title "..."`. Add terms to `.along/GLOSSARY.md`.
- **Token hygiene**: Use quiet flags (`pytest -q`, `dotnet test -v q`), filter outputs, inspect targeted line ranges.
- **Lifecycle hooks first**: Agents MUST use `/along-test`, `/along-build`, `/along-dev` (or `.along/scripts/*.py`) before raw shell commands.
- **Post-change review**: Agents MUST inspect diffs and evaluate blast radius via `along graph-impact` (or static search fallback). Silent skips are forbidden.

## Stage & Session Completion Checklist
When a stage or session completes, agents MUST execute in this order:
1. [ ] **Tests** [gate: test_before_stop]: Run via `/along-test` with quiet flags. Zero failures.
2. [ ] **File Integrity**: `git status -u` - all new/modified files non-zero size, no empty placeholders.
3. [ ] **Code Review**: Inspect diff for side effects, verify REQ-N coverage, evaluate blast radius via `along graph-impact` (or static search), verify architectural decision compliance.
4. [ ] **Entity Reconciliation**: Close issues (`done` + move to `done/`), update milestones, resolve risks, conclude spikes.
5. [ ] **Doc Blast Radius**: Update affected `docs/topic--*.md`, `README.md` and Project specifics; add new terms to `.along/GLOSSARY.md`; touch `.along/VISION.md` only if scope/roadmap changed; run `/along-kb-sync`.
6. [ ] **Session Log** [gate: wrap_before_stop]: `along wrap <slug> --decisions <ADR...> | --no-decisions` writes `.along/SESSIONS/<YYYY>/<date>--<slug>.md` with the blackboard record; answer the decisions question explicitly.
7. [ ] **Projections** [gate: projection_sync_before_stop]: Run `/along-issue-sync` and `/along-decision-sync`.
8. [ ] **HISTORY**: Append line to `.along/HISTORY.md`.
9. [ ] **Compaction**: Advise user to run `/compact`.

## Rules
- **Contract-First Lifecycle**:
  - Agents MUST execute `.along/scripts/<action>.py` or `/along-test`, `/along-build`, `/along-dev` before raw shell commands.
  - When `.along/scripts/` is missing, `along test`/`along build` auto-detects and synthesizes hooks.
  - In submodules, execute the hook from that subproject's own `.along/scripts/`.
- **Environment Isolation**:
  - Agents MUST NOT install system-wide or global packages when a script fails. Fix the architecture (missing `bootstrap.ensure_deps()`, incorrect `uv` wrapper), not the environment.
- **Workspace Containment** [gate: workspace-containment]: Read and write only inside the workspace. Writes elsewhere are limited to the temp dir and runtime artifact dirs. Other repos need `allowed_roots` (`.along/rules/gates.yaml`, issue frontmatter, `along start --allow-root`). Never touch credential stores (`~/.ssh`, `~/.aws`).
- **Runtimes Without Along Hooks** (Claude Cowork, Cursor, OpenCode, plain shells): gates are advisory there. Agents MUST self-apply every gate-tagged rule and use the `along` CLI for tests, commits, entity changes, and wrap instead of raw tools. `along doctor` reports the enforcement level.
- **File Modification & Anti-Deletion**:
  - Never delete, truncate, or overwrite existing documentation, comments, or code unless explicitly instructed.
  - After batch edits or migrations, agents MUST run `git diff --stat` and inspect unexpected size reductions.
  - No stubs or skeletons in place of populated code [gate: anti_stub_injection].
  - Anchor edits on minimal unique chunks. Restore unintended deletions immediately.
- **Clean ASCII** [gate: typography]: ASCII punctuation only (no typographic dashes, quotes, ellipsis, bullets, NBSP/zero-width chars or BOM); `along sanitize --write` fixes them.
- **Markdown** [gate: code-fence-language]: Every code fence names a language.
- **File Content Via Tools Only** [gate: cli_safety]: Create/edit files with the agent's file tools. NEVER carry content in heredocs, `python -c`, or inline shell. Write scripts to a file first.
- **Verify Written Files**: After writing/patching, confirm parsing (`python -m compileall -q`, `bash -n`, etc.) before moving on.
- **Hermetic Tests**: Tests MUST target throwaway fixtures (`tempfile.mkdtemp()`), never the live repository. Read-only access to live state is allowed. Keep a meta-test that verifies `git status --porcelain -u` stays clean.
- **Inquiry Read-Only Invariance (Zero-Mutation Rule on Questions)** [gate: require-plan-approval]: On interrogative prompts ("is X done?", "why did Y fail?"), write/modify tools are STRICTLY PROHIBITED. Return a read-only audit report and ask for confirmation before modifying anything.
- **Mandatory Adaptive Complexity Escalation & Execution Mode Routing**: When scope touches > 3 files, crosses subsystems, or refactors core engines: single-agent execution is forbidden - route to `along-team`. Plans MUST declare `Execution Mode: Direct` or `Role-Based`. Role-based blackboards (`along scratch init`) are held to the step loop [gate: team-step-active] [gate: team-reviews-before-stop]; dropping it needs `along scratch fallback <slug> --reason "..."`.
- Windows-safe filenames [gate: windows-safe-filenames]: dates `YYYY-MM-DD`, date first.
- Keep `ISSUES.md` compact: `along context-budget --check` enforces the limit.
- Never write secrets into tracked files [gate: no-tracked-secrets].
<!-- END ALONG-PROTOCOL -->

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
- `@actdim/dynstruct/appDomain/commonContracts` - common channels: store, nav, config, fetch, DI
- `@actdim/dynstruct/appDomain/securityContracts` - auth channels and security types
- `@actdim/dynstruct/services/react/ServiceProvider`
- `@actdim/dynstruct/services/react/SecurityService`
- `@actdim/dynstruct/net/httpClient` - `HttpClient` base class for auth-aware API clients
- `@actdim/msgmesh/contracts`
- `@actdim/msgmesh/core`
- `@actdim/msgmesh/adapters`

## SecurityService and HttpClient

### SecurityService

`SecurityService` is a built-in service component - mount it near the app root. It manages `AuthInfo` state and exposes auth channels to all descendants.

- `useConventions: true` (default): handles Bearer token flow (HTTP sign-in, storage, refresh). Configure via `domainConfig.endpoints.*`.
- `useConventions: false`: delegates to custom providers via `APP.SECURITY.AUTH.SIGNIN.REQUEST` / `APP.SECURITY.AUTH.SIGNOUT.REQUEST`. Use for demos, mocks, or custom backends.

Key channels (string constants from `appDomain/securityContracts` - reference by the string value, e.g. `'APP.SECURITY.AUTH.SIGNIN'`, not by the `$AUTH_*` variable name):
- `APP.SECURITY.AUTH.SIGNIN` - authenticate and register the result; returns `AuthInfo`
- `APP.SECURITY.AUTH.SIGNOUT` - sign out, clears state
- `APP.SECURITY.AUTH.REFRESH` - refresh auth data without a full re-login; returns `AuthInfo`
- `APP.SECURITY.AUTH.ENSURE` - ensure authenticated; navigates to the sign-in page if not; returns `AuthInfo`
- `APP.SECURITY.AUTH.APPLY` - authorize an outgoing request (provided only when `useConventions: true`)
- `APP.SECURITY.AUTH.INFO.GET` - get current `AuthInfo`
- `APP.SECURITY.CONFIG.GET` / `APP.SECURITY.CONFIG.CHANGED` - read / react to `BaseSecurityDomainConfig`
- `APP.SECURITY.AUTH.SIGNIN.REQUEST` / `...SIGNOUT.REQUEST` / `...REFRESH.REQUEST` - custom-handler hooks used when `useConventions: false`

### HttpClient

`HttpClient` is the base class for typed API service clients. Extend it for each API - each public method becomes a typed bus channel via the service adapter.

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

### Auth schemes, credentials, and `AuthInfo`

SecurityService is scheme-aware. The scheme is a discriminant on both the sign-in request and the auth state:

```ts
type AuthScheme =
    | "Basic" | "Bearer" | "Digest" | "NTLM" | "Negotiate" | "VAPID"  // IANA
    | "Session" | "ApiKey";                                            // de facto
```

- `SignInCredentials` - discriminated union by `scheme`, passed to `APP.SECURITY.AUTH.SIGNIN` (and `...SIGNIN.REQUEST`). Members: `Basic`/`Bearer`/`Digest`/`Session` (`userName`, `password`), `NTLM`/`Negotiate` (+ `domain?`), `VAPID` (`privateKey`, `subject`), `ApiKey` (`apiKey`).
- `AuthInfo` - discriminated union by `scheme`, returned by sign-in/refresh/`INFO.GET` and persisted by SecurityService. All members extend `AuthInfoBase` (`isAuthenticated?`, `authority?`, `provider?`, `accessToken?`, `properties?`, `domain?`). Scheme extras: `Bearer` (`refreshToken?`, `tokenExpiresAt?`), `Session` (`sessionId?`, `refreshToken?`, `tokenExpiresAt?`), `Digest` (`realm?`, `nonce?`, `algorithm?`), `NTLM`/`Negotiate` (`negotiationToken?`), `VAPID` (`publicKey?`, `subject?`), `ApiKey` (`apiKey?`, `keyName?`, `keyLocation?`).

Built-in conventions (`useConventions: true`) currently implement `Bearer` for sign-in/refresh and `Bearer` + `Basic` for request authorization (`APPLY`). Other schemes require `useConventions: false` with your own `*.REQUEST` / `APPLY` handlers.

When editing this repo source, mirror existing import style from nearby files.

## Standard Bus Channels

dynstruct declares typed bus channels (`@actdim/msgmesh`) used by its subsystems and reusable by app code. They are members of `CommonAppMsgStruct` (`commonContracts.ts`) and `BaseSecurityMsgStruct` (`securityContracts.ts`). Each exports a string constant (`$NAV_GOTO = 'APP.NAV.GOTO'`); **reference channels by string value, not by the `$...` variable**. Channels with both `in`/`out` are request/response (`msgBus.request`); channels with only `in` are events (`msgBus.send` + subscriber).

### Common channels (`CommonAppMsgStruct`)

| Channel | In | Out |
|---|---|---|
| `APP.RELOAD` | `void` | - (event) |
| `APP.NOTICE` | `{ text; title?; detail?; severity?; presentation?; userAction?; category?; scope?; source?; properties? }` | `void` |
| `APP.CONFIG.GET` | `void` | `BaseAppDomainConfig` |
| `APP.CONFIG.SET` | `BaseAppDomainConfig` | `void` |
| `APP.CONFIG.CHANGED` | `BaseAppDomainConfig` | `void` (event) |
| `APP.NAV.GOTO` | `{ path: string \| number; params: any }` | `void` |
| `APP.NAV.CONTEXT.GET` | `void` | `NavContext` |
| `APP.NAV.CONTEXT.CHANGED` | `NavContext` | `void` (event) |
| `APP.NAV.HISTORY.READ` | `number` | `NavContext` |
| `APP.ERROR` | `ErrorPayload & { properties? }` | `boolean` |
| `APP.FETCH` | `{ url: string; params: RequestInit }` | `Response` |
| `APP.STORE.GET` | `{ key: string; useEncryption? }` | `StoreItem` |
| `APP.STORE.SET` | `{ key: string; value: any; useEncryption? }` | `void` |
| `APP.STORE.REMOVE` | `{ key: string }` | `void` |
| `APP.CONTAINER.REGISTER` | `{ id; factory }` | `void` |
| `APP.CONTAINER.RESOLVE` | `id` | `(params) => T` |

(`$NAV_HISTORY_BACK` / `$NAV_HISTORY_FORWARD` / `$MSGBUS_ERROR` are exported constants but not members of `CommonAppMsgStruct`.)

### Auth channels (`BaseSecurityMsgStruct`)

Provided by `SecurityService`. The `*.REQUEST` channels are the custom-handler hooks activated when `useConventions: false`.

| Channel | In | Out |
|---|---|---|
| `APP.SECURITY.AUTH.SIGNIN.REQUEST` | `{ credentials: SignInCredentials; auth?: AuthInfo }` | `AuthInfo` |
| `APP.SECURITY.AUTH.SIGNIN` | `{ credentials: SignInCredentials; auth?: AuthInfo }` | `AuthInfo` |
| `APP.SECURITY.AUTH.SIGNOUT.REQUEST` | `AuthInfo` | - (event) |
| `APP.SECURITY.AUTH.SIGNOUT` | `AuthInfo` | - (event) |
| `APP.SECURITY.AUTH.REFRESH.REQUEST` | `AuthInfo` | `AuthInfo` |
| `APP.SECURITY.AUTH.REFRESH` | `AuthInfo` | `AuthInfo` |
| `APP.SECURITY.AUTH.ENSURE` | `void` | `AuthInfo` |
| `APP.SECURITY.AUTH.APPLY` | `Partial<RequestInit> & { url: string; headers: Record<string,string> }` | `{ query?; headers?; credentials? }` |
| `APP.SECURITY.AUTH.INFO.GET` | `void` | `AuthInfo` |
| `APP.SECURITY.CONFIG.GET` | `void` | `BaseSecurityDomainConfig` |
| `APP.SECURITY.CONFIG.CHANGED` | `BaseSecurityDomainConfig` | - (event) |

## Component Authoring Standard

Use hook-constructors as the primary component format:

1. Define `ComponentStruct<MsgStruct, {...}>` with `props/actions/children/effects/msgScope` as needed.
2. Implement `useXxx(params: ComponentParams<Struct>)`.
3. Create `ComponentDef<Struct>` with:
- `props` defaults
- `actions` for user intent
- `events` for lifecycle and property change reactions
- `effects` for auto-tracked reactive logic
- `children` for explicit composition - **every nested dynstruct component is declared here** (via its `useXxx` hook-constructor, or as a `React.FC` fragment), never instantiated inline in `view` (see Composition and Performance Rules)
- `view` for rendering - use `<c.children.Name />` (Capitalized) for all child types
4. Instantiate via `useComponent(def, params)`.
5. Prefer `let c` and `let m` pattern:
- `c` is component instance
- `m` is `c.model` reactive model - **actions are blended into the model**, so call `m.actionName(...)` not `c.actions.actionName(...)`. `Component` has no `.actions` property.
6. Export `toReact(useXxx)` only when React component interoperability is needed. A `toReact` export is for plain React code and backward compatibility - inside another dynstruct component use the hook in `children` instead.

## Component Identity (`id`, `regType`, `$key`)

Every component instance gets a unique `id` at runtime. The framework does **not** apply it to any DOM element automatically - the component author must do so explicitly:

```tsx
view: () => <div id={c.id}>...</div>
```

**ID formation (priority order):**
1. `$id` param provided → used as-is
2. `$key` param provided → `toHtmlId(regType) + '#' + key`
3. Neither → `toHtmlId(regType) + '#' + N` (sequential per `regType` within the context)

**`regType`** - set in `def.regType` (shared across all instances). If omitted, auto-detected from source file path via stack inspection.

**`$id` / `$key`** - instance-level, passed via `ComponentParams` in JSX, in the hook-constructor call, or via binding:

```tsx
<MyComponent $id="main-card" />          // explicit, stable id
<MyComponent $key={userId} />            // → "myComponent#userId"
useMyComponent({ $key: bind(() => m.id) }) // dynamic via binding
```

Use `$id` for fully explicit ids (testing, anchors). Use `$key` to form predictable ids from domain keys. Omit both when page uniqueness is sufficient.

## State and Reactivity Rules

- Keep mutable UI state in `def.props` / `c.model`.
- Use `events` for controlled side effects on property changes:
  - `onChangingX` to validate/sanitize before set
  - `onChangeX` after set
  - `onPropChanging`/`onPropChange` for generic handlers
  - `onCatch` (not `onError`) for error handling - signature: `(error, component?) => void`
  - Lifecycle handlers may be `async`:
    - `onInit` - once on creation, before first render; sync setup only, no DOM
    - `onLayoutReady` / `onLayoutDestroy` - maps to `useLayoutEffect` / its cleanup; sync, DOM is available
    - `onReady` / `onDestroy` - maps to `useEffect` / its cleanup; async-safe, primary hook for data loading
  - Effect bodies (`def.effects`) are also wrapped by the framework error router - errors propagate to `onCatch`.
- Use `effects` for derived/auto-tracked behavior; pause/resume/stop through `c.effects.<name>`.
- Use a **getter in `def.props`** to declare a computed (auto-tracked) property. The framework detects getter-only descriptors and registers them as computed values automatically - no manual annotation needed. Declare the prop as `readonly` in the struct type. Reference `m` (not `this`) inside the getter body because TypeScript does not type `this` in `PropertyDescriptor` getters:

  ```ts
  // struct type
  type Struct = ComponentStruct<AppMsgStruct, {
    props: {
      firstName: string;
      lastName: string;
      readonly fullName: string;  // computed - mark readonly
    };
  }>;

  // def
  const def: ComponentDef<Struct> = {
    props: {
      firstName: '',
      lastName: '',
      get fullName() {
        // `this` is untyped in TS getter descriptors - use `m` instead
        return `${m.firstName} ${m.lastName}`.trim();
      },
    },
  };
  ```

  This also works for **nested object properties**: define the getter on the nested object literal inside `def.props`. The framework propagates computed annotations through any depth of nesting.
- Use `prop({ reactive: ... })` to control how a prop is tracked. Default is fully reactive. Options:
  - `reactive: false` - completely non-reactive; reads and writes are invisible to the reactivity system
  - `reactive: 'shallow'` - array container is reactive (push/pop tracked), but item properties are not

  Works for top-level and nested paths alike. Can be used without `initialValue` as a pure annotation:

  ```ts
  props: {
    config: prop({ initialValue: { debug: false }, reactive: false }),
    'user.tags': prop({ reactive: 'shallow' }),  // tags is declared elsewhere
  }
  ```

- Use bindings for value flow between parent and child. **Never pass `m` directly** to a child - `def.children` is evaluated before `m = c.model`, so `m` is `undefined` at that point. Always use a lazy getter: `bindProp(() => m, 'prop')` or `bind(() => m...)`.
- **Binding priority** (pick the first that fits):
  1. `bindProp(() => m, 'prop')` - default for two-way binding to a model prop. Typed by key path, supports nested paths (`bindProp(() => m, 'user.name')`).
  2. `bind(() => expr)` - read-only or derived value (no setter: the child cannot write back).
  3. `bind(get, set[, converter])` - **only** when the getter or setter needs specific logic (transformation, side effects, writing somewhere else, a converter).

  ```ts
  // Preferred
  open: bindProp(() => m, 'addDialogOpen'),
  // Avoid - same behavior, just longer
  open: bind(() => m.addDialogOpen, (v) => { m.addDialogOpen = v; }),
  // OK - the setter has specific logic
  open: bind(() => m.addDialogOpen, (v) => { m.addDialogOpen = v; if (!v) { m.draft = null; } }),
  ```
- Use `fallbackView` in `ComponentDef` together with `useErrorBoundary: true` to render an error fallback UI instead of `view` when the component catches a render-time error.
- Use `ComponentStructExt<Struct, {...}>` **inside** a hook-constructor to declare private reactive props, internal children (often `React.FC` sections), and effects. The extended type is invisible to callers; return `Component<Struct>` from the hook to preserve the public API. See `componentState/StateExample.tsx`.
- Use `ComponentImpl<Struct, Internals>` when you need non-reactive, per-instance data (e.g., a cache or lock). Pass initial internals as the third argument to `useComponent`; access via `c._`. Return `Component<Struct>` to hide internals from callers. See `services/react/StorageService.tsx`.

### Error handling pattern

`onCatch` is called automatically whenever an error crosses the **dynstruct API boundary**. The framework wraps all user code at component creation time. There are two propagation modes:

**Routes to `onCatch` only - error is swallowed after dispatch:**
- Lifecycle hooks: `onInit`, `onLayoutReady`, `onReady`, `onLayoutDestroy`, `onDestroy`
- Effect bodies (`def.effects`)
- Property event handlers: `onGetX`, `onChangingX`, `onChangeX`, `onPropChanging`, `onPropChange`
- Binding get/set functions (`bind`, `bindProp`)

These have no caller waiting for a return value, so swallowing after `onCatch` is safe.

**Routes to `onCatch` AND re-throws to caller:**
- Actions (`def.actions`) - caller may `await m.action()` and expect a result or a rejection
- MsgBus provider/subscriber callbacks - provider must return a response; subscriber may be awaited

Swallowing in these cases would silently return `undefined` to the caller and cause hard-to-diagnose bugs.

Manual `try/catch` is needed only for code that is **outside** this boundary - a plain function in an `onClick` that does not call any dynstruct API. Use a shared `handleError` function so both paths call the same logic:

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
        // load() calls a plain fetchData() - not a dynstruct call, so catch manually
        <button onClick={async () => {
            try { await load(); } catch (err) { handleError(err); }
        }}>Retry</button>
    ),
};
```

When `view` itself may throw, keep `useErrorBoundary: true` (default) and optionally provide `fallbackView`.

### `c.run` - manual boundary entry

`c.run(handler, silent?)` executes any code inside the framework error boundary - errors are routed to `onCatch` exactly like any framework-managed call:

```ts
// silent=true: error → onCatch, swallowed (no re-throw)
onClick={() => c.run(() => load(), true)}

// silent=false (default): error → onCatch + re-throws to caller
onClick={() => c.run(() => submit())}
```

**In practice prefer `def.actions`** - they combine error routing with automatic MobX action batching (all reactive prop mutations within the call commit as one transaction):

```ts
actions: {
    load: async () => {
        m.status = 'loading';
        await fetchData();    // all changes batched, errors → onCatch
        m.status = 'idle';
    },
},
// called as: m.load()
```

If an action is an implementation detail not needed in the public contract, declare it privately via `ComponentStructExt` - callers see only the original `Struct`:

```ts
type ImplStruct = ComponentStructExt<Struct, {
    actions: { load: () => Promise<void> };
}>;

// inside hook-constructor:
c = useComponent(def, params) as Component<ImplStruct>;
// m.load() works internally; callers receive Component<Struct>
```

Avoid:
- introducing local `useState`/`useReducer` for state that belongs to component model
- ad-hoc cross-component mutation without message bus or bindings
- passing callback props (`onSelect*`, `onNavigate*`, `onOpen*`, `onClose*`, `onChange*`, etc.) across components or features: use typed MsgMesh channels instead
- treating `def.actions` as event callbacks to pass to children: `actions` are internal model mutators for atomic, transactional local state mutations, NOT cross-component event handlers
- hidden dependencies not declared in `children` or `msgScope`
- rendering dynstruct components inline in `view` with props/callbacks (`<Xxx value={m.value} onX={() => ...} />`, including `toReact` exports) - declare them in `children` instead
- `bind(get, set)` pairs that just read and write one model prop - use `bindProp(() => m, 'prop')`
- **importing or using MobX directly** (`observable`, `computed`, `action`, `autorun`, etc.) - the framework manages reactivity internally; direct MobX usage bypasses the component model and breaks framework guarantees
- passing reactive model values to external APIs without stripping proxies - use `toPlain(value)` from `@actdim/dynstruct/componentModel/core` before handing data to REST clients, third-party libs, or `postMessage`

## Messaging & MsgMesh Integration Architecture

`@actdim/dynstruct` provides native architectural integration with `@actdim/msgmesh`.

### Architectural Principles & Best Practices:

1. **Context-Driven Bus Distribution**:
   - In standard Dynstruct applications, `msgBus` is provided at the application level via `<AppContextProvider value={{ msgBus }}>` or `<ServiceProvider>` and injected implicitly into all descendant components via `ReactComponentContext`.
   - While nested context providers or isolated buses are supported when architectural isolation is genuinely required, in most scenarios creating ad-hoc bus instances inside individual components or manually passing `msgBus` through props is unnecessary and adds boilerplate.
   - Thanks to dotted channel prefixes (`'API.USER.'`, `'APP.NAV.'`) and TypeScript type composition (`ApiStruct & MsgStruct<LocalEvents> & BaseAppMsgStruct`), channel schemas can be cleanly distributed across multiple modular files while maintaining unified compile-time validation in a single bus structure.

2. **Declarative Component Contracts (`msgScope` & `msgBroker`)**:
   - Prefer declaring communication contracts directly in the component definition: `ComponentStruct.msgScope` for type-level contracts and `ComponentDef.msgBroker` for runtime subscriptions/providers.
   - This ensures a component's inputs and outputs are immediately visible on its type definition and automatically managed by the framework, rather than hidden inside imperative `onReady` or `useEffect` hooks.

3. **Component Proxy Benefits (`c.msgBus`)**:
   When imperative messaging is needed inside actions or callbacks, use `c.msgBus` (provided automatically on the component instance). The component proxy (`getComponentMsgBus`) wraps the underlying bus with essential conveniences:
   - **Automatic MobX Observable Unwrapping (`normalizePayload`)**: All payloads sent or requested through `c.msgBus` are automatically deep-unwrapped via structural copying / `toPlain()`. This ensures MobX reactive proxies do not leak into the message bus.
   - **Automatic Lifecycle & Cancellation (`AbortSignal`)**: Every subscription (`on`, `once`, `stream`) and in-flight `request()` / `provide()` operation is automatically linked to `component.abortSignal`. When the component unmounts, all active subscriptions and pending requests are automatically cancelled without manual `unsubscribe()` or cleanup routines.
   - **Automatic Source Tracing (`sourceId: component.id`)**: Automatically sets `headers.sourceId` to the component's unique instance ID for message provenance tracking.
   - **Error Boundary & Loading State**: `c.msgBus.request(...)` runs within `component.run()`, automatically routing unhandled rejections to `onCatch` and incrementing/decrementing `component.model.$.pendingRequestCount`.
   - **Hierarchical Scoping (`ComponentMsgFilter`)**: Handlers registered in `def.msgBroker` can specify `componentFilter: ComponentMsgFilter.FromAncestors` or `ComponentMsgFilter.FromDescendants` to restrict message reception strictly to the component's sub-tree.

### Canonical Declarative Messaging Example:

```typescript
type UserCardStruct = ComponentStruct<AppMsgStruct, {
    props: { userId: string };
    msgScope: {
        subscribe: AppMsgChannels<'USER.UPDATED'>;
        publish: AppMsgChannels<'USER.SELECTED'>;
        provide: AppMsgChannels<'GET.USER.DATA'>;
    };
}>;

const def: ComponentDef<UserCardStruct> = {
    props: { userId: params.userId },
    // Declarative bus handlers - automatically wired & cleaned up on unmount
    msgBroker: {
        subscribe: {
            'USER.UPDATED': {
                in: {
                    callback: (msg, component) => {
                        console.log('Received user update:', msg.payload);
                    },
                },
            },
        },
        provide: {
            'GET.USER.DATA': {
                in: {
                    callback: (msgIn, msgOut, component) => {
                        return { id: m.userId };
                    },
                },
            },
        },
    },
    actions: {
        selectUser: () => {
            // Imperative send via proxy - automatically unwraps MobX observables
            c.msgBus.send({
                channel: 'USER.SELECTED',
                payload: { id: m.userId },
            });
        },
    },
};
```

For service APIs:
- Use `@actdim/msgmesh/adapters` (`ToMsgChannelPrefix`, `ToMsgStruct`, `getMsgChannelSelector`, `registerAdapters`) to transform service methods into typed channels.
- Provide adapters through `ServiceProvider` wrappers.

## Composition and Performance Rules

- **Nested dynstruct components go into `def.children`, never inline in `view`** (priority rule). Declare the child's struct in `children`, instantiate it with its hook-constructor, pass inputs via bindings (`bindProp` first, see Binding priority), and render it as `<c.children.Name />`.
  - Why: the child is created once and its bindings are lazy, so the parent does not track the child's values and only the child re-renders when they change - no `useMemo` / `useCallback` needed.
  - Communication, selection, and coordination between components MUST go through typed MsgMesh channels (`c.msgBus.send`, `msgBroker.subscribe`), NEVER via callback props (`onSelect*`, `onDismiss*`, `onNavigate*`).
  - Inline `<Xxx prop={m.value} />` in `view` is kept only for compatibility: the parent tracks `m.value` and re-renders on every change, causing unnecessary overhead.
  - A fragment that needs no model of its own is shortened to a `React.FC` child: `section: () => <div>{m.x}</div>` (see `componentState/StateExample.tsx`).

  ```tsx
  // struct: children: { searchBar: SearchBarStruct; userList: UserListStruct }
  children: {
      searchBar: useSearchBar({}),
      userList: useUserList({}),
  },
  // searchBar dispatches: c.msgBus.send({ channel: 'APP.SEARCH.CHANGED', payload: { query } })
  // userList subscribes in msgBroker: 'APP.SEARCH.CHANGED': { in: { callback: (msg) => { ... } } }
  view: () => (
      <div>
          <c.children.SearchBar />
          <c.children.UserList />
      </div>
  ),

  // Strictly avoid callback prop-drilling:
  // children: { searchBar: useSearchBar({ onSearch: (q) => m.query = q }) } // ANTI-PATTERN
  ```
- Keep JSX mostly structural; put behavior in `actions/events/effects`.
- Reuse existing component structures rather than creating parallel incompatible patterns.
- In `view`, render all children with a **Capitalized** name: `<c.children.Name />`. This is a JSX shortcut - instead of `<c.children.avatarView.View />` you write `<c.children.AvatarView />`. For full dynstruct component children (`ComponentStruct` types) the camelCase name additionally exposes the full component instance (`c.children.avatarView.model`, `c.children.avatarView.effects`). For `React.FC` and factory function children only the Capitalized JSX shortcut exists - these are lightweight fragments without their own model.

## File and Story Conventions

- Framework internals: `src/componentModel/*`
- React-specific internals: `src/componentModel/react/*` (e.g. `componentContext.tsx`)
- App domain contracts/utilities: `src/appDomain/*`
- Services: `src/services/*`
- Examples/stories: `src/_stories/componentModel/*`
  - `basicCommunication/` - producer/consumer pattern
  - `serviceCall/` - API adapter integration
  - `securityService/` - auth flow
  - `storageService/` - storage service
  - `componentState/` - `ComponentStructExt`, form validation with validators, `m.$` and `mapToEdit`
- Shared story styles: `src/_stories/componentModel/styles.ts` (`row`, `labelStyle`, `detailsStyle`)

When adding a feature:
- update or add Storybook example if behavior is user-visible
- keep naming aligned with existing stories and component files

## TypeScript Config Layout

Solution-style split - do not collapse it back into one config:

- `tsconfig.base.json` - shared `compilerOptions` only. `moduleResolution: "bundler"` (this is a Vite package; do NOT switch to `"node"`/`node10` (deprecated) or `nodenext` (would force `.js` import extensions)). No `baseUrl` (deprecated in TS 6.0) - `paths` targets are relative: `"@/*": ["./src/*"]`. `extends` inherits only `compilerOptions`, not `include`/`files`/`references`.
- `tsconfig.json` - pure orchestrator: `{ "files": [], "references": [...] }`. It compiles nothing itself; it only wires the leaf projects.
- `tsconfig.build.json` - library build; emits `.d.ts` to `dist`. Consumed by `vite-plugin-dts` via its `tsconfigPath` (must stay a config WITHOUT `references`, else the plugin emits zero declarations).
- `tsconfig.dev.json` - editor/dev + tests; broad `types` (node, vitest/globals, vite/client, ...).

Rules:
- Root Node files (`packageConfig.ts`, `vite.config.ts`, `vitest*.config.ts`) get node types via `types: ["node"]` in the build/dev projects - NOT by editing includes elsewhere or adding `node` to a shared `types` array (that leaks node globals into browser `src`). If the editor shows "Cannot find name 'path'/'__dirname'" on such a file, it means the file isn't routed to a project - check the `references` chain, don't hack the source with `/// <reference>`.
- Always type-check the solution with `tsc -b` (build mode), never `tsc -p` - `-p` sees `files: []` and checks nothing. Both `typecheck` and `build` scripts already use `tsc -b tsconfig.json`.

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

```tsx
// useTextField / TextFieldStruct: any dynstruct hook-constructor, e.g. from '@actdim/dynstruct-mui/TextField'
type MyStruct = ComponentStruct<AppMsgStruct, {
  props: { value: string };
  actions: { setValue: (v: string) => void };
  children: {
    valueInput: TextFieldStruct; // dynstruct child (hook-constructor)
    summary: React.FC;           // lightweight fragment, no own model
  };
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
    children: {
      valueInput: useTextField({
        value: bindProp(() => m, 'value'),
      }),
      summary: () => <span>{m.value.length} chars</span>,
    },
    effects: {
      syncSomething: () => {
        // reactive logic
      },
    },
    view: () => (
      <div>
        <c.children.ValueInput />
        <c.children.Summary />
      </div>
    ),
  };

  c = useComponent(def, params);
  m = c.model;
  return c;
};
```

## Project specifics

<!-- BEGIN ALONG-RULES -->
See the following engineering guidelines:
- `[languages/typescript.md](.along/rules/languages/typescript.md)`
- `[platforms/web.md](.along/rules/platforms/web.md)`
<!-- END ALONG-RULES -->
