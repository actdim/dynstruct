---
protocol: along
protocol_version: "4.6.0"
slug: demo-theme-and-showcase
type: feat
status: done
completed: 2026-11-03
priority: high
created: 2026-11-03
updated: 2026-11-03
agent: antigravity
tags: [demo, theme, mui, dynstruct-mui, showcase, bindings, zero-usestate]
milestone: v2.0.0
blocked_by: []
related: []
plan_status: approved
---

# Add theme toggle and expand component showcase with zero useState

Align all demo components with strict Dynstruct canons: eradicate all `useState` / `useEffect` local state anti-patterns in favor of pure Dynstruct component models (`ComponentStruct` + `ComponentDef` + `useComponent` + `toReact`), implement light and dark theme switching across Astro shell and React islands, and expand the Component Gallery (`/showcase`) to feature genuine `@actdim/dynstruct-mui` adapters with live binding examples.

## Strict Requirements
- REQ-1: ZERO `useState` IN ALL DEMO COMPONENTS: All interactive state across the demo portal (`ShowcaseGallery`, `SplitPlayground`, etc.) MUST reside in Dynstruct reactive model props (`ComponentDef.props`) and actions (`ComponentDef.actions`). Local React `useState`, `useReducer`, or mutable state hooks are strictly forbidden.
- REQ-2: ZERO RAW `@mui/material` WHERE `@actdim/dynstruct-mui` EXISTS: The showcase gallery MUST use actual `@actdim/dynstruct-mui` wrappers (`Button`, `IconButton`, `Fab`, `ToggleButtonGroup`, `TextField`, `Select`, `Checkbox`, `Switch`, `Slider`, `RadioGroup`, `Rating`, `Card`, `Accordion`, `Tabs`, `Breadcrumbs`, `Pagination`, `Alert`, `Chip`, `Badge`, `Avatar`, `CircularProgress`, `LinearProgress`, `Skeleton`, `Tooltip`).
- REQ-3: CODE EXAMPLES WITH MINIMAL STRUCT AND BINDING PATTERNS: Every showcase category MUST display clean code examples showing the exact `ComponentStruct` contract, `def.props`, `def.actions`, and binding syntax (`bind` and model actions).
- REQ-4: ZERO-FOUC THEME SWITCHING: `Layout.astro` MUST execute an inline `<head>` script before body render to apply the persisted or system theme mode to `<html>` (`class="dark"` and `data-theme`). `Header.astro` MUST provide a toggle button that updates `localStorage` and broadcasts `APP.THEME.CHANGED` over `getPortalMsgBus()`.
- REQ-5: MULTI-ISLAND THEME SYNCHRONIZATION: `PortalProvider.tsx` MUST subscribe to `APP.THEME.CHANGED` and dynamically update the Material UI theme mode across all mounted React islands without page reload.

## Acceptance Criteria
- [x] Automated grep confirms ZERO occurrences of `useState` across `packages/dynstruct/demo/src`
- [x] `SplitPlaygroundIsland` refactored into idiomatic `playgroundStruct.tsx` (`ComponentStruct` + `useComponent`) with zero `useState`
- [x] `ShowcaseGalleryIsland` refactored into idiomatic `showcaseStruct.tsx` (`ComponentStruct` + `useComponent`) with zero `useState`
- [x] Showcase features at least 20 `@actdim/dynstruct-mui` components across 4 categories (Actions, Form Inputs, Feedback, Surfaces/Nav)
- [x] Code examples provided for each showcase category demonstrating minimal `ComponentStruct` contracts and Dynstruct bindings
- [x] Header theme toggle switches between Light and Dark modes with Sun/Moon icons
- [x] Theme changes persist in `localStorage` (`actdim_theme_preference`) and synchronize across all islands via `APP.THEME.CHANGED`
- [x] Server-side rendering (SSR/SSG) has zero FOUC on page load / refresh in both Light and Dark modes
- [x] `astro check && tsc --noEmit` passes with 0 errors
- [x] `pnpm build` in demo succeeds with 0 errors
- [x] Unit tests (`npm test` in `dynstruct`) pass with 100% green status
