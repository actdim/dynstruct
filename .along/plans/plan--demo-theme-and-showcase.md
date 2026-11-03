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
