<!-- BEGIN ALONG-PROTOCOL ref=../AGENTS.md (managed by along-init - do not edit by hand) -->
This folder belongs to a repository that uses the ALONG structure. The full working
guidance + agent-context protocol live once in the nearest ancestor `AGENTS.md` (`../AGENTS.md`) -
read it there. This folder keeps its OWN `.along/` state; use the nearest one.
Only this folder's specifics follow.
<!-- END ALONG-PROTOCOL -->

## Project specifics

<!-- BEGIN ALONG-RULES -->
See the following engineering guidelines:
- `[languages/typescript.md](.along/rules/languages/typescript.md)`
- `[platforms/web.md](.along/rules/platforms/web.md)`
<!-- END ALONG-RULES -->

- **What**: Astro static portal with React islands showcasing `@actdim/dynstruct`, `@actdim/dynstruct-mui` and `@actdim/msgmesh`; islands share one typed msgmesh bus (`src/bus`), MUI stays inside islands, subscriptions and RPC providers go in `def.msgBroker`.
- **Routes**: `/` (playground), `/ssr-demo` (SSG data), `/cross-island` (bus between islands), `/showcase` (dynstruct-mui gallery); internal links go through `withBase` (`src/lib/withBase.ts`).
- **Commands** (from mempart `src/`): `pnpm run dev:demo`, `pnpm run build:demo`, `pnpm run test:e2e:demo`; `pnpm --filter @actdim/dynstruct-demo typecheck`.
- **Location and workspace**: `demo/` of the dynstruct repository (mempart: `src/packages/dynstruct/demo`). `@actdim/dynstruct` is `workspace:*`; outside mempart the dynstruct `pnpm-workspace.yaml` (packages `.` and `demo`) links it, and `dynstruct-mui`, `msgmesh`, `ui-core`, `utico` come from npm.
- **CI / Pages**: the dynstruct `.github/workflows/pages.yml` builds the library, then the demo with `DEMO_BASE=/dynstruct/demo/`, and deploys it next to the docs at https://actdim.github.io/dynstruct/demo/ (step is `continue-on-error` until the `@actdim` siblings 1.12.x are on npm).
- **Versioning**: never bump `version` here; use mempart `pnpm run version:sync <version>` (unified monorepo semver).
- **Knowledge base**: `docs/INDEX.md` (architecture, domain model, setup and workflow topics).
