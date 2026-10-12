---
protocol: along
protocol_version: "4.4.9"
slug: dynstruct-anti-patterns
type: docs
status: done
completed: 2026-10-11
priority: medium
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
tags: [docs]
blocked_by: []
related: []
---

# Anti-patterns section with BAD/GOOD pairs

## Changes

- AGENTS.md: new "Anti-patterns" section (eager model reads with the typical TypeError, React hooks in the
  hook-constructor body reading the model, dynstruct components as JSX tags in `view`, callback props, `params.x`,
  React values in deep-reactive props, helper closures without `c.run`, one view rendered twice, hand-written
  `regType`); Component Identity updated for the Vite plugin; React values rule rewritten; error handling: the two
  patterns (actions wrapped automatically, closures via `c.run`) and the dedup behavior.
- topic--04: s.7 rewritten to the ref-only rule, new s.9 "Vite Plugin: regType From the Source";
  topic--02: React values and `regType` rows updated. llms-full regenerated (kb-sync) and copied to docs/public.

## Acceptance Criteria
- [x] Anti-patterns section with BAD/GOOD pairs
- [x] Docs consistent with the code changes of this session
- [x] kb-sync link check passes
