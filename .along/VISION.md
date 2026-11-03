# Vision

_North star: scope, boundaries, non-goals, roadmap. Evolves slowly; slims as features ship._

## Scope

- Demo: public showcase portal (`demo/`, `@actdim/dynstruct-demo`) for `@actdim/dynstruct`, `@actdim/dynstruct-mui` and `@actdim/msgmesh`, deployed to https://actdim.github.io/dynstruct/demo/.
- Demo: Astro static shell (Tailwind) with React islands; Material UI confined to islands.
- Demo: idiomatic Dynstruct examples: `ComponentStruct` contracts, declarative `msgBroker`, `useComponent` + `toReact`, reactivity modes.
- Demo: cross-island coordination over a typed msgmesh bus (`CATALOG.FILTER`, `NOTICE.TOAST`, `DIALOG.OPEN`, `DRAWER.TOGGLE`, `RPC.SEARCH`).
- Demo: build-time data (SSG) on `/ssr-demo` with hydration over pre-rendered HTML.
- Demo: playground code panels taken from real struct sources (`#region` markers).
- Demo: Playwright smoke and hydration suite as the regression guard.

## Non-goals

- Demo: no backend, persistence or authentication; all data is in-memory sample data.
- Demo: not a component library; reusable code belongs in `@actdim/dynstruct`, `dynstruct-mui` or `msgmesh`.
- Demo: no on-demand SSR deployment; the Pages site stays static (SSR is documented as a config switch only).
- Demo: no independent versioning or npm publishing; the version follows mempart `pnpm run version:sync`.

## Roadmap

- Demo: keep the demo step of the Pages workflow green once the sibling `@actdim` packages 1.12.x are on npm (it is `continue-on-error` until then).
- Demo: add playground scenarios as the libraries gain features, each with `contract`, `model` and `integration` regions and an e2e check.
- Demo: extend the e2e suite to run against a base-path build (`DEMO_BASE=/dynstruct/demo/`).
