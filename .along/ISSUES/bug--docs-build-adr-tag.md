---
protocol: along
protocol_version: "4.8.0"
slug: docs-build-adr-tag
type: bug
status: open
priority: medium
created: 2026-11-10
updated: 2026-11-10
agent: claude-code
tags: [docs, build]
blocked_by: []
related: [docs--recipes-cookbook]
---

# VitePress docs build fails on unescaped tag in ADR no-agent-vendor-dev-tooling

`pnpm run docs:build` fails at HEAD with:

```text
[vite:vue] docs/decisions/ADR-2026-11-08--no-agent-vendor-dev-tooling.md (9:166): Element is missing end tag.
```

The published ADR copy contains `pnpm --dir <pkg> run <script>` as plain text (Decision line). VitePress
compiles Markdown through the Vue template compiler, which reads `<pkg>` and `<script>` as HTML elements.
Found while verifying `docs--recipes-cookbook`; the cookbook pages build cleanly when `docs/decisions/` is
excluded.

## Requirements
- REQ-1: `pnpm run docs:build` MUST succeed with every ADR published under `docs/decisions/`.
- REQ-2: Placeholders in angle brackets in published ADRs MUST render as text (inline code or escaping), fixed at the source the KB sync publishes from, not only in the generated copy.

## Acceptance Criteria
- [ ] `pnpm run docs:build` passes at the fixed commit
- [ ] A later `along kb-sync` does not reintroduce the raw tag
