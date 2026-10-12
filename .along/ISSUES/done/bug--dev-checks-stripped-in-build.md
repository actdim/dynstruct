---
protocol: along
protocol_version: "4.4.9"
slug: dev-checks-stripped-in-build
type: bug
status: done
completed: 2026-10-11
priority: high
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
tags: [build, componentModel]
blocked_by: []
related: []
---

# DEV checks are compiled out of dist: import.meta.env.DEV frozen to false by the library build

## Problem

Vite library mode statically replaces `import.meta.env.*`; the dynstruct build froze `import.meta.env.DEV` to `false`,
so every DEV check was dead code in `dist` (found by the review of this session's changes). Consumers that load the
package from `dist` (the webapp) never got: React values in deep-reactive props, double-mounted view, plain param
changed after creation, write to a read-only bound prop, toReact prop passed after creation, computed-prop param
warning, the DEV regType stack label, and the DEV error payload with the component instance. Tests passed because
they run against `src`.

## Change

`vite.config.ts` (build only): plugin `dynstruct:keep-dev-checks` (`enforce: 'pre'`, magic-string with source maps)
rewrites `import.meta.env.DEV` in `src` to `(process.env.NODE_ENV !== "production")` - the standard library form
that the consumer's bundler replaces. Source code and tests are unchanged.

## Verification

- `dist/componentModel/core.es.js` / `react/hooks.es.js` keep the checks (`process.env.NODE_ENV` expressions).
- Webapp dev server serves the module with the expression replaced by `(true)`.
- Webapp production build: no `process.env` left, DEV strings eliminated as dead code.

## Also from the same review

- DEV React-value scan runs `untracked` and skips already-observable values (no effect subscriptions in DEV).
- Plugin: a member function (`children: { storageCard: (p) => useComponent(...) }`) is named after its key instead of
  inheriting the enclosing hook name.

## Acceptance Criteria
- [x] DEV checks present in dist and active in a consumer's dev build
- [x] No `process.env` in a consumer's production bundle
- [x] Automated tests passing
