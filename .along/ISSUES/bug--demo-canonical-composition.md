---
protocol: along
protocol_version: "4.6.0"
slug: demo-canonical-composition
type: bug
status: in-progress
priority: high
created: 2026-11-03
updated: 2026-11-03
agent: antigravity
tags: [demo, dynstruct-mui, canonical-composition]
milestone: v2.0.0
blocked_by: []
related: []
plan_status: approved
---

# Refactor dynstruct demo structs to canonical child composition with prop-less view

## Problem and Context
In `dynstruct/demo`, component structs violated Dynstruct canonical principles by rendering child components directly inside JSX tags with inline props and event handlers (e.g., `<Tabs value={...} onChange={...} />`, `<Accordion summary={...} />`, `<Pagination count={...} />`). Furthermore, the showcased code examples in `showcaseStruct.tsx` displayed this anti-pattern as canonical binding documentation.

## Requirements
- REQ-1: The demo structs in `demo/src/components/structs/showcaseStruct.tsx` MUST declare all nested `@actdim/dynstruct-mui` components in `def.children` using their hook-constructors (`useTabs`, `useAccordion`, `usePagination`, `useButton`, etc.) with model bindings and action mutators.
- REQ-2: The `view` render function in `showcaseStruct.tsx` MUST remain prop-less for Dynstruct children, rendering only `<c.children.Name />` inside layout containers.
- REQ-3: The displayed `CODE_EXAMPLES` in `showcaseStruct.tsx` MUST document canonical Dynstruct patterns: contract declaration, `def.children` hook initialization with bindings, and clean prop-less JSX in `view`.
- REQ-4: `playgroundStruct.tsx` and interactive demo scenario structs in `demo/src/components/structs/` MUST eliminate direct JSX instantiation of Dynstruct components, routing children through `def.children`.
- REQ-5: The Astro demo portal MUST pass typechecking (`astro check && tsc --noEmit`) and build cleanly.

## Acceptance Criteria
- [ ] `showcaseStruct.tsx` wires all components via `def.children` and renders prop-less `<c.children.Name />`.
- [ ] `CODE_EXAMPLES` in `showcaseStruct.tsx` show canonical Dynstruct patterns with `children` hooks and prop-less JSX.
- [ ] `playgroundStruct.tsx` and interactive scenarios instantiate child components in `def.children`.
- [ ] `pnpm --filter @actdim/dynstruct-demo build` succeeds cleanly.
