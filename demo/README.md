# @actdim/dynstruct-demo

> Dynstruct & Dynstruct-MUI Showcase Portal with Astro SSR and React Islands

This package is the official demonstration and architectural proof-of-concept portal for:
- **`@actdim/dynstruct`**: Structure-first component model with fine-grained MobX reactivity.
- **`@actdim/dynstruct-mui`**: Material UI component wrappers adapted to Dynstruct contracts.
- **`@actdim/msgmesh`**: Type-safe async message mesh and RPC service bus.
- **Astro SSR & Islands**: Zero-FOUC outer document shell with isolated Material UI React islands.

---

## Architectural Principles

1. **Zero-FOUC Document Shell**:
   - Navigation, header, hero banner, and layouts are built purely with native `.astro` components and Tailwind CSS.
   - Material UI and Emotion CSS-in-JS runtimes are strictly confined to interactive client islands to prevent layout shift and maintain near-100 Lighthouse performance.

2. **Declarative Message Broker (`def.msgBroker`)**:
   - Components register message bus subscriptions and RPC providers declaratively inside `def.msgBroker` (`subscribe` and `provide`).
   - Registrations are bounded to the component lifecycle and released per mount automatically, making them resilient under React StrictMode.
   - Eliminates manual `msgBus.on` and `msgBus.provide` calls from `events.onReady` / `onDestroy`.

3. **Cross-Island Event Mesh**:
   - In Astro's islands architecture, each island is an independent React root (`hydrateRoot`).
   - React Context cannot cross island boundaries.
   - `@actdim/msgmesh` coordinates independent islands over typed channels without prop drilling.

4. **Astro SSR / SSG & SEO Verification**:
   - Data is pre-fetched on the server during Astro's frontmatter execution.
   - `/ssr-demo` is pre-rendered at build time (SSG) by default with `output: 'static'`, producing 100% crawlable content accessible without client JavaScript.
   - Switching from build-time SSG to on-demand SSR requires only changing `output: 'server'` and adding an Astro deployment adapter with zero component code changes.
   - Client hydration binds MobX observables seamlessly over existing DOM nodes.

---

## Message Mesh Channels

| Channel | Kind | Payload | Description |
|---|---|---|---|
| `CATALOG.FILTER` | Pub/Sub | `{ query?: string, category?: string, minRating?: number }` | Published by `CatalogFilter` to filter items across islands; reset dispatches default filter payload |
| `NOTICE.TOAST` | Pub/Sub | `{ id: string, message: string, severity?: string, duration?: number }` | Dispatches toast alerts to the notification stack |
| `DIALOG.OPEN` | Pub/Sub | `{ dialogId: string, title: string, content: string }` | Opens modal dialog with contract-driven payload |
| `DRAWER.TOGGLE` | Pub/Sub | `{ open: boolean }` | Toggles or sets side drawer open state |
| `RPC.SEARCH` | Request/Response | In: `{ query: string }`, Out: `{ items: DemoCatalogItem[] }` | RPC search provider with debounce and latest-wins response matching |

---

## Dogfooding Islands

All demo islands are implemented as idiomatic Dynstruct structs (`useComponent` + `toReact`) using `@actdim/dynstruct-mui` components:
- `CatalogFilter` (`src/components/structs/catalogFilterStruct.tsx`): Filter controls island publishing `CATALOG.FILTER`.
- `CatalogList` (`src/components/structs/catalogListStruct.tsx`): Subscriber catalog island listening to `CATALOG.FILTER`.
- `SsrCatalog` (`src/components/structs/ssrCatalogStruct.tsx`): Pre-rendered table with live client filtering and sorting.

---

## Getting Started

From the monorepo root (`src/`):

```bash
# Launch development server
pnpm run dev:demo

# Build static/SSR production bundle
pnpm run build:demo

# Preview production build locally
pnpm --filter @actdim/dynstruct-demo preview
```

---

## Key Portal Routes

- `/` : Interactive split-screen playground comparing TypeScript contracts with live component previews.
- `/ssr-demo` : Dedicated Astro SSR / SSG verification with SEO crawler instructions.
- `/cross-island` : Independent Astro islands coordinating strictly through the MsgMesh bus.
- `/showcase` : Comprehensive gallery of all `@actdim/dynstruct-mui` components.

---

## Testing

Run static diagnostics (including Astro template check and TypeScript):

```bash
pnpm --filter @actdim/dynstruct-demo typecheck
```

Run the Playwright smoke and hydration test suite:

```bash
pnpm --filter @actdim/dynstruct-demo test:e2e
# Or from src/
pnpm run test:e2e:demo
```

The smoke suite guards against:
- Invalid HTML nesting (e.g. ListItemText block elements inside span or p tags)
- Browser console hydration errors and warnings across all pre-rendered routes
- Unintended event replay on island remount (`NOTICE.TOAST`)
- Filter state desynchronization on reset (`CATALOG.FILTER`)
- Rapid-fire toast key collisions
- Out-of-order async search RPC responses
- Playground contract panel synchronization from real source files (`#region`)
- StrictMode-safe render counter tracking without render-phase mutation

---

## Documentation

- Live demo: https://actdim.github.io/dynstruct/demo/
- [Architecture](../docs/topic--demo-architecture.md): Astro shell vs React islands, cross-island bus, declarative `msgBroker`, SSG / SSR switch, base path.
- [Domain Model](../docs/topic--demo-domain-model.md): bus channels and payloads, catalog data, routes and props contracts.
- [Setup And Workflow](../docs/topic--demo-setup-and-workflow.md): commands, typecheck, e2e and the GitHub Pages build (dynstruct repository workflow).

---

## License

MIT (c) Actdim.
