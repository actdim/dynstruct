# Living Plan: demo-theme-and-showcase

## Revision 1 (2026-11-03T21:36:22Z, plan approve --plan-file)

# Plan: Add theme toggle and expand component showcase with zero useState

## Execution Mode
Direct

## Problem
1. The demo portal currently lacks Light/Dark theme switching: `Layout.astro` hardcodes `class="dark"` and `PortalProvider.tsx` hardcodes a static dark MUI theme.
2. The Component Gallery (`/showcase`) incorrectly uses raw `@mui/material` components instead of `@actdim/dynstruct-mui` wrappers, uses local React `useState` instead of idiomatic Dynstruct reactive component models, lacks code examples showing Dynstruct bindings, and covers only a minimal subset of controls.

## Steps
1. **Astro Shell and Islands Theme Synchronization**:
   - In `packages/dynstruct/demo/src/layouts/Layout.astro`: add an inline `<head>` script to read stored theme or system preference before body render, preventing FOUC. Update body and containers to support light and dark Tailwind variants.
   - In `packages/dynstruct/demo/src/components/astro/Header.astro`: add a Light/Dark theme toggle button with SVG icons, updating `localStorage`, document classes, and broadcasting `APP.THEME.CHANGED` over `getPortalMsgBus()`. Add light/dark styling for navigation and borders.
   - In `packages/dynstruct/demo/src/components/common/PortalProvider.tsx`: subscribe to `APP.THEME.CHANGED` on `getPortalMsgBus()`, dynamically compute MUI theme for `'light'` and `'dark'` modes, and re-render island content seamlessly.

2. **Idiomatic Dynstruct Showcase Struct (Zero useState)**:
   - Create `packages/dynstruct/demo/src/components/structs/showcaseStruct.tsx` defining `ShowcaseGalleryStruct`:
     - Props: `tabValue`, `buttonClicks`, `textVal`, `selectVal`, `checkboxVal`, `switchVal`, `sliderVal`, `radioVal`, `ratingVal`, `activeCodeCategory`.
     - Actions: `setTab`, `incrementClicks`, `setText`, `setSelect`, `setCheckbox`, `setSwitch`, `setSlider`, `setRadio`, `setRating`, `setCodeCategory`.
     - Real `@actdim/dynstruct-mui` components across 4 categories: Actions & Controls, Form Inputs, Feedback & Status, Surfaces & Navigation.
     - Code example panels for each category demonstrating the minimal Dynstruct contract (`ComponentStruct`), definition (`ComponentDef`), and binding pattern (`bind` / reactive model prop).
   - Refactor `packages/dynstruct/demo/src/components/islands/ShowcaseGalleryIsland.tsx` to render the struct under `PortalProvider` with zero `useState` hooks.

3. **Documentation & Quality Gates**:
   - Update `packages/dynstruct/demo/README.md`, `docs/topic--demo-architecture.md`, and `docs/topic--demo-setup-and-workflow.md`.
   - Run typecheck, unit tests, and production build.

## Revision 2 (2026-11-03T21:37:41Z, plan approve --plan-file)

# Plan: Add theme toggle and expand component showcase with zero useState

## Execution Mode
Direct

## Problem
1. In Dynstruct showcase demo, components violated core Dynstruct canons: `ShowcaseGalleryIsland.tsx` and `SplitPlaygroundIsland.tsx` used React `useState` hooks directly instead of being structured as Dynstruct reactive components (`ComponentStruct` + `ComponentDef` + `useComponent` + `toReact`).
2. `ShowcaseGalleryIsland.tsx` imported raw `@mui/material` components instead of using `@actdim/dynstruct-mui` wrappers, lacked code examples showing how components connect to Dynstruct models/bindings, and covered only a handful of components.
3. No Light/Dark theme switching existed in the demo portal: `Layout.astro` hardcoded `dark` class, and `PortalProvider` hardcoded a static dark MUI theme.

## Strict Steps
1. **Refactor `SplitPlaygroundIsland` to Pure Dynstruct (Zero useState)**:
   - Create `src/components/structs/playgroundStruct.tsx`: define `PlaygroundStruct` with props (`selectedScenarioId`, `activeCodeTab`, `copyStatus`), actions (`setScenario`, `setCodeTab`, `copyCode`), and model-driven rendering.
   - Refactor `SplitPlaygroundIsland.tsx` into a thin wrapper mounting `<Playground />`.

2. **Implement Idiomatic `ShowcaseGallery` Struct (Zero useState, 20+ dynstruct-mui components)**:
   - Create `src/components/structs/showcaseStruct.tsx`: define `ShowcaseGalleryStruct` with props (`tabValue`, `buttonClicks`, `textVal`, `selectVal`, `checkboxVal`, `switchVal`, `sliderVal`, `radioVal`, `ratingVal`, `activeSnippetTab`, etc.) and actions (`setTab`, `incrementClicks`, etc.).
   - Use real `@actdim/dynstruct-mui` components: `Button`, `IconButton`, `Fab`, `ToggleButtonGroup`, `TextField`, `Select`, `Checkbox`, `Switch`, `Slider`, `RadioGroup`, `Rating`, `Card`, `Accordion`, `Tabs`, `Breadcrumbs`, `Pagination`, `Alert`, `Chip`, `Badge`, `Avatar`, `CircularProgress`, `LinearProgress`, `Skeleton`, `Tooltip`.
   - Provide minimal Dynstruct binding code examples for each category (Contract, Def, Bindings).
   - Refactor `ShowcaseGalleryIsland.tsx` to mount `<ShowcaseGallery />` with zero `useState`.

3. **Implement Full Light/Dark Theme Switching**:
   - `Layout.astro`: zero-FOUC blocking `<head>` script reading `localStorage['actdim_theme_preference']` or system media query. Add adaptive Tailwind classes for light/dark background and typography.
   - `Header.astro`: add Light/Dark toggle button with Sun/Moon icons, updating document class, `localStorage`, and broadcasting `APP.THEME.CHANGED` over `getPortalMsgBus()`. Add adaptive Tailwind styles.
   - `PortalProvider.tsx`: subscribe to `APP.THEME.CHANGED` on `getPortalMsgBus()`, dynamically build MUI theme for `'light'` and `'dark'`, updating all islands synchronously.

4. **Verification & Gates**:
   - Automated grep confirms ZERO occurrences of `useState` across `demo/src`.
   - `astro check && tsc --noEmit` passes with 0 errors.
   - `pnpm build` passes with 0 errors.
   - `npm test` in `dynstruct` passes 100% green.
