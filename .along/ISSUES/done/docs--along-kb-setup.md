---
protocol: along
protocol_version: "4.6.0"
slug: along-kb-setup
type: docs
status: done
completed: 2026-11-01
priority: medium
created: 2026-11-01
updated: 2026-11-01
agent: claude-code
tags: [along, docs]
parent: task--along-init-demo-submodules
blocked_by: []
related: []
---

# Along context and knowledge base for the demo

`along init` scaffolded Along in dynstruct-demo on 2026-11-01. The repo had no KB; `AGENTS.md`
project specifics and `.along/VISION.md` were placeholders, and the Along commit gate had no test
hook (the demo only has Playwright e2e tests).

## Requirements
- REQ-1: `docs/` MUST contain architecture, domain-model and setup-and-workflow topics grounded in `src/`, `e2e/`, `astro.config.mjs` and the Pages CI.
- REQ-2: `AGENTS.md` project specifics, `.along/VISION.md` and README documentation links MUST be filled from facts.
- REQ-3: `.along/scripts/test.py` MUST run `pnpm run typecheck`; `docs/INDEX.md`, `llms.txt`, `llms-full.txt` MUST be compiled by `along kb-sync`.

## Acceptance Criteria
- [x] No scaffold placeholder text in `docs/`, `AGENTS.md` or `.along/VISION.md`.
- [x] `along test` passes (typecheck 0 errors).
- [x] `along kb-sync` reports no broken links.
