# Plan: Fix Astro Vite fs allow list for monorepo React islands hydration

## Execution Mode
Direct

## Problem
In a monorepo workspace setup where `packages/dynstruct` has its own `pnpm-workspace.yaml`, Vite dev server started from `packages/dynstruct/demo` identifies `packages/dynstruct` as the workspace root. When client-side hydration scripts (such as `@astrojs/react/dist/client.js`) are served via `/@fs/` from the parent monorepo's `src/node_modules/.pnpm/...`, Vite blocks the request with HTTP 403 Forbidden because the path is outside `server.fs.allow`. This leaves React islands unhydrated and causes event replay retry storms on text input.

## Steps
1. Modify `packages/dynstruct/demo/astro.config.mjs` to configure `vite.server.fs.allow` with dynamic upward root resolution (`pnpm-workspace.yaml`, `.git`, `node_modules`).
2. Update `packages/dynstruct/demo/README.md` with architectural notes on Vite workspace boundary isolation in monorepo setups, island hydration requirements, and troubleshooting.
3. Check and update relevant documentation in `packages/dynstruct/docs/` (e.g. `topic--demo-portal.md` or `topic--astro-ssr-islands.md`) regarding Vite filesystem access and monorepo hosting.
4. Verify build and typecheck in `packages/dynstruct/demo`.
