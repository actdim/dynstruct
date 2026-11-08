---
protocol: along
protocol_version: "4.6.1"
slug: standalone-missing-peer-devdeps
type: bug
status: open
priority: medium
created: 2026-11-08
updated: 2026-11-08
agent: claude-code
tags: [tooling, standalone, ci]
milestone: v2.0.0
blocked_by: []
related: [task--adopt-dev-config]
---

# Standalone clone fails typecheck/build/test: peerDependencies not installed

Found while verifying `task--adopt-dev-config`; red at HEAD `ebd8c1f` before that change (identical result after it).
In a fresh clone outside Mempart (`git clone`, `pnpm install --no-frozen-lockfile`), `.npmrc` sets
`auto-install-peers=false` and most peers (`@actdim/msgmesh`, `@actdim/utico`, `mobx`, `mobx-react-lite`,
`react-router-dom`, `http-status`, ...) are not devDependencies, so they are not installed: `tsc -b tsconfig.json`
reports 168 errors (mostly `TS2307 Cannot find module`), `pnpm run build` fails and 4 of 6 node test files fail.
Inside Mempart the workspace provides them, so the problem is invisible there. `pnpm run lint` is unaffected (exit 0).
The committed `pnpm-lock.yaml` was also stale at that HEAD (a plain standalone install rewrote about 3.8k lines).

## Requirements
- REQ-1: `package.json` MUST list every peerDependency used by `src/` or `tests/` also as a devDependency with a range satisfying the peer range.
- REQ-2: A fresh standalone clone MUST pass `pnpm install --frozen-lockfile`, `pnpm run typecheck`, `pnpm run build` and `pnpm run test`.

## Acceptance Criteria
- [ ] Standalone clone: typecheck 0 errors, build exit 0, all test files pass.
- [ ] Mempart workspace `pnpm --dir src run typecheck` still passes.
