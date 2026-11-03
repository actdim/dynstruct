---
protocol: along
slug: demo-setup-and-workflow
title: "Demo: Setup And Workflow"
type: topic
created: 2026-11-01
updated: 2026-11-03
tags: [setup-and-workflow, build, test, e2e, github-pages, ci, monorepo]
---

# @actdim/dynstruct-demo Setup, Build & Test Workflow

> The demo app lives in [`demo/`](../demo/README.md) of this repository; file paths in this article are relative to `demo/`.

## 1. Repository Layout

`@actdim/dynstruct-demo` lives in `demo/` of the dynstruct repository (`https://github.com/actdim/dynstruct`); in the mempart monorepo that is `src/packages/dynstruct/demo`. It depends on `@actdim/dynstruct` as `workspace:*`.

- Inside mempart, `src/pnpm-workspace.yaml` lists `packages/dynstruct/demo` and links all `@actdim` dependencies (`dynstruct`, `dynstruct-mui`, `msgmesh`, `ui-core`, `utico`) from their folders, so local development runs against library sources in the same checkout. The nested dynstruct `pnpm-workspace.yaml` is ignored there.
- In a standalone dynstruct checkout, the repository `pnpm-workspace.yaml` (packages `.` and `demo`) links the library from the folder; the other `@actdim` packages come from npm.

```text
demo/
|-- src/
|   |-- pages/          index, ssr-demo, cross-island, showcase (.astro)
|   |-- layouts/        Layout.astro
|   |-- components/     astro/ (Header, Footer), islands/, structs/, common/ (PortalProvider)
|   |-- bus/            portalMsgStruct.ts, portalBus.ts, ids.ts
|   |-- data/           sampleCatalog.ts, codeSnippets.ts
|   |-- lib/            withBase.ts
|   `-- styles/         global.css (Tailwind)
|-- public/             favicon.svg
|-- e2e/                smoke.spec.ts, fixtures.ts (console watcher), hydration.ts
|-- astro.config.mjs    base / site from DEMO_BASE / DEMO_SITE
|-- playwright.config.ts
`-- tsconfig.json
```

## Prerequisites

- Node.js 22 (the version used by the Pages workflow) and pnpm 10 (`packageManager` in `src/package.json` for mempart, in the dynstruct `package.json` for a standalone checkout).
- The mempart checkout with submodules initialized, so the `@actdim` library packages exist under `src/packages/`.
- Dependencies installed from the monorepo workspace root: `pnpm install` in `src/`.
- For e2e tests: Playwright browsers (`pnpm --filter @actdim/dynstruct-demo exec playwright install chromium`); the suite runs the `Desktop Chrome` device.

## Runner Commands

### 3.1. From the monorepo (`src/`)

| Command | Effect |
|---|---|
| `pnpm run dev:demo` | `pnpm --filter @actdim/dynstruct-demo dev` - Astro dev server with HMR |
| `pnpm run build:demo` | `pnpm --filter @actdim/dynstruct-demo build` - static build into `dist/` |
| `pnpm run test:e2e:demo` | `pnpm --filter @actdim/dynstruct-demo test:e2e` - Playwright suite |
| `pnpm --filter @actdim/dynstruct-demo preview` | Serves the last build locally |
| `pnpm --filter @actdim/dynstruct-demo typecheck` | `astro check && tsc --noEmit` |

### 3.2. Package scripts (`package.json`)

| Script | Command |
|---|---|
| `dev` | `astro dev` |
| `build` | `astro build` |
| `preview` | `astro preview` |
| `astro` | `astro` (raw CLI passthrough) |
| `typecheck` | `astro check && tsc --noEmit` |
| `test:e2e` | `playwright test` |

Local dev and local builds use base `/`. To check a Pages-style build locally, set the base before building:

```bash
DEMO_BASE=/dynstruct/demo/ pnpm --filter @actdim/dynstruct-demo build
```

### 3.3. GitHub Pages CI

The dynstruct repository workflow `.github/workflows/pages.yml` publishes one site: the docs at https://actdim.github.io/dynstruct/ and the demo at https://actdim.github.io/dynstruct/demo/. It runs on push to `main` (docs, `demo/`, `pnpm-workspace.yaml`, the workflow) and on `workflow_dispatch`.

The `build` job installs only the library (`pnpm install --filter @actdim/dynstruct`) and builds the docs. The `Build demo` step then, with `DEMO_BASE=<base_path>/demo/` and `DEMO_SITE=<origin>` from `actions/configure-pages`:

1. Runs `pnpm install --no-frozen-lockfile` for the whole repository workspace (`.` and `demo`).
2. Builds the library (`pnpm run build`), because the demo imports `@actdim/dynstruct` through its `dist/` exports.
3. Builds the demo (`pnpm --filter @actdim/dynstruct-demo build`) and copies `demo/dist` to `.dist-docs/demo`.

`dynstruct-mui`, `msgmesh`, `ui-core` and `utico` come from npm. Until they are published at `>=1.12.0` the step fails; it is `continue-on-error`, so the docs still deploy without the demo.

Reproduce the CI build from a standalone dynstruct checkout:

```bash
pnpm install --no-frozen-lockfile
pnpm run build
DEMO_BASE=/dynstruct/demo/ pnpm --filter @actdim/dynstruct-demo build
```

### 3.4. Versioning

The demo follows mempart's unified versioning: the `version` in `package.json` is changed only by `pnpm run version:sync <version>` from mempart `src/`, together with every other package and submodule. Never bump it in this repository alone.

## Quality Gates

| Gate | Command | What it guards |
|---|---|---|
| Typecheck | `pnpm --filter @actdim/dynstruct-demo typecheck` | Astro template diagnostics (`astro check`) and TypeScript (`tsc --noEmit`) |
| Build | `pnpm run build:demo` | All routes pre-render (SSG); `extractRegion` throws on missing playground region markers |
| E2E smoke and hydration | `pnpm run test:e2e:demo` | See below |
| Pages build | `Build demo` step of the dynstruct Pages workflow (CI) | Demo builds in the standalone dynstruct workspace, not only from the mempart checkout |

The Playwright config (`playwright.config.ts`) runs `pnpm build && pnpm preview --port 4322 --host localhost` as its web server on `http://localhost:4322` (reused locally, fresh in CI, 2 retries and 1 worker in CI). The auto fixture in `e2e/fixtures.ts` fails any test that logs an unexpected browser console error, warning or page error, and `waitForIslands` (`e2e/hydration.ts`) waits until every `astro-island` has dropped its `ssr` attribute. `e2e/smoke.spec.ts` covers:

- Every route (`/`, `/showcase`, `/cross-island`, `/ssr-demo`) hydrates with zero console errors and warnings.
- Raw pre-rendered HTML has no invalid DOM nesting inside `ListItemText`.
- `/ssr-demo` pre-renders every `SAMPLE_SSR_CATALOG` title and keeps state across sort and filter.
- `/cross-island` filter coordination and reset (`CATALOG.FILTER`).
- Playground overlays driven by bus channels, unique toast keys, no event replay on remount (`NOTICE.TOAST`).
- Async search through `RPC.SEARCH` and `msgBroker`.
- The playground contract panel shows an `export type` for all five scenarios.
- The reactivity demo counts committed renders without render-phase mutation.

Run the e2e suite after any change to pages, islands, structs or the bus; run typecheck after any TypeScript or `.astro` change.

## Related Topics

- [Architecture](./topic--demo-architecture.md): shell vs islands, bus lifecycle, base path, invariants.
- [Domain Model](./topic--demo-domain-model.md): channels, payloads, catalog types and routes.
- [README](../demo/README.md): quick start and route list.
