---
protocol: along
protocol_version: "4.6.0"
slug: move-into-lib
type: task
status: done
completed: 2026-11-03
priority: medium
created: 2026-11-03
updated: 2026-11-03
agent: claude-code
tags: [demo, workspace, pages]
blocked_by: []
related: []
parent: task--demos-into-libs
plan_status: approved
---

# Live in demo/ of the dynstruct repo

The demo moved from its own repository (mempart submodule `src/packages/dynstruct-demo`) into `demo/` of the dynstruct repository. `@actdim/dynstruct` now resolves from the repository workspace (`workspace:*`); `dynstruct-mui`, `msgmesh`, `ui-core` and `utico` come from npm. `scripts/ci-workspace.mjs` and the demo's own Pages workflow are gone: the dynstruct workflow builds the demo into `/dynstruct/demo/`. Parent: root `task--demos-into-libs`.

## Requirements
- REQ-1: The demo docs, `AGENTS.md`, `README.md` and config comments MUST describe the new location, workspace and Pages path `/dynstruct/demo/`.
- REQ-2: The demo MUST still typecheck and build from mempart `src/`.

## Acceptance Criteria
- [x] Docs, AGENTS, README and `astro.config.mjs` / `withBase` / `Header.astro` comments updated; along kb-sync run.
- [x] Typecheck and build pass from mempart `src/`.
