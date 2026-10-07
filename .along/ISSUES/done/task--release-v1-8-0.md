---
protocol: along
protocol_version: "4.4.1"
slug: release-v1-8-0
type: task
status: done
completed: 2026-10-01
priority: medium
created: 2026-10-01
updated: 2026-10-01
agent: claude-code
tags: [release, versioning]
milestone: v2.0.0
blocked_by: []
related: []
---

# Release v1.8.0 and sync submodules

Minor release of the workspace: `pnpm run version:minor` bumped all packages from 1.7.2 to 1.8.0. Ships `bug--render-phase-props-sync`, `bug--stale-params-events`, `bug--strictmode-lifecycle`, `docs--child-composition-and-bindprop-priority`, and the `HttpClientError` changes (`src/net/httpClientError.ts`, `tests/httpClientError.test.ts`).

## Acceptance Criteria
- [x] `package.json` version is 1.8.0
- [x] Along context refreshed to protocol v4.4.1
- [x] `.claude/settings.json` disables commit/PR attribution (no AI `Co-Authored-By` trailers)
- [x] Automated tests passing (node 6/6, react 46/46), workspace `pnpm build` passing
- [x] Committed and pushed to origin/main
