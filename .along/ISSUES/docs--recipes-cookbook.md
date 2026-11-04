---
protocol: along
protocol_version: "4.6.0"
slug: recipes-cookbook
type: docs
status: in-progress
priority: medium
created: 2026-11-04
updated: 2026-11-04
agent: claude-code
tags: [docs, cookbook, dx]
milestone: v2.0.0
blocked_by: []
related: []
---

# Cookbook: task-oriented recipes section in docs

The docs are reference-shaped (concepts, API, contracts) and agent-oriented. A developer evaluating
dynstruct who asks "how do I validate a form" or "how do I pass data from parent to child" gets many
granular search hits and no single answer. The scenarios exist in Storybook stories, the demo and the
mempart webapp, but are not written down as short task-oriented recipes.

Goal: add a new "Cookbook" section (recipes) to the docs site. Existing docs stay unchanged; recipes link
to them for depth. Also clarify the two meanings of `children` (dynstruct `c.children` vs React
`props.children`).

## Requirements
- REQ-1: The docs MUST contain a new Cookbook section with one recipe per common usage scenario (component basics, parent-child data flow, bindings, validation, messaging, services, lifecycle, errors, lists, routing, auth, testing).
- REQ-2: Each recipe MUST follow one template: task, minimal working code using the current API, short explanation, gotchas, links to the reference topic and to the story/demo source.
- REQ-3: Every code sample MUST use APIs that exist in `src/` (verified against `contracts.ts` and the stories).
- REQ-4: The Cookbook MUST be reachable from the VitePress nav/sidebar and from `docs/INDEX.md`.
- REQ-5: The two meanings of `children` (dynstruct children vs React `props.children`) MUST be explained in one place.
- REQ-6: Existing doc pages MUST NOT be rewritten or truncated (additions and cross-links only).

## Acceptance Criteria
- [ ] Cookbook pages exist under `docs/` and are listed in the VitePress sidebar and nav
- [ ] Each recipe has code, explanation, gotchas and source links
- [ ] `along lint` passes on the new docs (ASCII typography, fence languages, relative links)
- [ ] VitePress docs build succeeds
- [ ] `docs/INDEX.md` regenerated via the kb sync
