---
protocol: along
protocol_version: "4.6.0"
slug: demo-monorepo-vite-fs-allow
type: bug
status: done
completed: 2026-11-03
priority: high
created: 2026-11-03
updated: 2026-11-03
agent: antigravity
tags: [demo, vite, astro, ssr, monorepo]
milestone: v2.0.0
blocked_by: []
related: []
plan_status: approved
---

# Fix Astro Vite fs allow list for monorepo React islands hydration

When running the demo portal (`packages/dynstruct/demo`) within the parent monorepo, Vite dev server restricts file access to the nearest detected workspace root (`packages/dynstruct`), preventing it from serving hoisted monorepo dependencies such as `@astrojs/react/dist/client.js` from `src/node_modules/.pnpm/...`. This causes HTTP 403 Forbidden errors, hydration failure of React islands (e.g. SsrCatalogIsland), and UI freezes during text input due to Astro retry storms.

## Requirements
- REQ-1: `astro.config.mjs` in the demo MUST configure Vite `server.fs.allow` to permit serving dependencies from parent monorepo and workspace root directories upwards.
- REQ-2: The configuration MUST remain fully functional both when `dynstruct` is run standalone and when embedded in a parent monorepo like `mempart`.
- REQ-3: Relevant documentation in `packages/dynstruct/demo/README.md` and repository docs MUST document Vite workspace allow list behavior and troubleshooting for monorepo setups.

## Acceptance Criteria
- [x] Vite `server.fs.allow` dynamically includes workspace and git roots above `demo`
- [x] React islands hydrate without HTTP 403 Forbidden on `@astrojs/react/dist/client.js`
- [x] Demo and documentation explain monorepo Vite serving rules
