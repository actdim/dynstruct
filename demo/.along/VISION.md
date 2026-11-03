# Vision

_North star: scope, boundaries, non-goals, roadmap. Evolves slowly; slims as features ship._

## Scope

- Public showcase portal for `@actdim/dynstruct`, `@actdim/dynstruct-mui` and `@actdim/msgmesh`, deployed to https://actdim.github.io/dynstruct/demo/.
- Astro static shell (Tailwind) with React islands; Material UI confined to islands.
- Idiomatic Dynstruct examples: `ComponentStruct` contracts, declarative `msgBroker`, `useComponent` + `toReact`, reactivity modes.
- Cross-island coordination over a typed msgmesh bus (`CATALOG.FILTER`, `NOTICE.TOAST`, `DIALOG.OPEN`, `DRAWER.TOGGLE`, `RPC.SEARCH`).
- Build-time data (SSG) on `/ssr-demo` with hydration over pre-rendered HTML.
- Playground code panels taken from real struct sources (`#region` markers).
- Playwright smoke and hydration suite as the regression guard.

## Non-goals

- No backend, persistence or authentication; all data is in-memory sample data.
- Not a component library: reusable code belongs in `@actdim/dynstruct`, `dynstruct-mui` or `msgmesh`, not here.
- No on-demand SSR deployment; the Pages site stays static (SSR is documented as a config switch only).
- No independent versioning or npm publishing of the demo; the version follows mempart `pnpm run version:sync`.

## Roadmap

- Keep the demo step of the dynstruct Pages workflow green once the sibling `@actdim` packages 1.12.x are on npm (it is `continue-on-error` until then).
- Add playground scenarios as the libraries gain features, each with `contract`, `model` and `integration` regions and an e2e check.
- Extend the e2e suite to run against a base-path build (`DEMO_BASE=/dynstruct/demo/`).
- Switch dependencies to published `@actdim` versions once they are released at the required versions, so the demo step of the dynstruct Pages workflow builds without errors.
