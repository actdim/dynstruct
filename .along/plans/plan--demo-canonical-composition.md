# Plan: Refactor dynstruct demo structs to canonical child composition with prop-less view

## Execution Mode
Direct

## Problem
In `dynstruct/demo`, component structs violated Dynstruct canonical principles by rendering child components directly inside JSX tags with inline props and event handlers (e.g., `<Tabs value={...} onChange={...} />`, `<Accordion summary={...} />`, `<Pagination count={...} />`). Furthermore, the displayed code examples in `showcaseStruct.tsx` documented this anti-pattern as canonical binding documentation.

## Strict Steps
1. **Refactor `showcaseStruct.tsx`**:
   - Update `ShowcaseGalleryStruct` to declare all child structs in `children` (or use hook constructors in `def.children`).
   - Import hook constructors from `@actdim/dynstruct-mui`: `useButton`, `useIconButton`, `useFab`, `useToggleButtonGroup`, `useTextField`, `useSelect`, `useCheckbox`, `useSwitch`, `useSlider`, `useRadioGroup`, `useRating`, `useAlert`, `useChip`, `useBadge`, `useAvatar`, `useCircularProgress`, `useLinearProgress`, `useSkeleton`, `useTooltip`, `useCard`, `useAccordion`, `useTabs`, `useBreadcrumbs`, `usePagination`.
   - Wire all 24 components inside `def.children` with reactive bindings (`bindProp(() => m, ...)` or `bind(() => m...)`) and model mutator actions.
   - Clean up `view`: replace direct JSX tag calls with `<c.children.Name />` containing zero props and zero callbacks.
   - Rewrite `CODE_EXAMPLES` for all 4 categories (`actions`, `inputs`, `feedback`, `surfaces`) to demonstrate the canonical Dynstruct architecture: `children` hooks with bindings + prop-less JSX in `view`.

2. **Refactor `playgroundStruct.tsx`**:
   - Declare demo scenario components in `def.children` via `useFormDemo`, `useCounter`, `useDialogToastDemo`, `useReactivityDemo`, `useAsyncSearchDemo`.
   - In `view`: render `<c.children.FormDemo />`, `<c.children.Counter />`, etc. based on `m.selectedScenarioId`.

3. **Refactor Demo Scenario Structs**:
   - `formDemoStruct.tsx`: Move `TextField`, `Select`, `Checkbox`, `Switch`, `Slider`, `Button` into `def.children` (`useTextField`, `useSelect`, `useCheckbox`, `useSwitch`, `useSlider`, `useButton`), render prop-less in `view`.
   - `counterStruct.tsx`: Move buttons into `def.children` (`useButton`), render prop-less in `view`.
   - `dialogToastStruct.tsx`: Move dialog, buttons, and switches into `def.children` (`useDialog`, `useButton`, `useSwitch`).
   - `asyncSearchStruct.tsx`: Move text field, button, and progress into `def.children` (`useTextField`, `useButton`, `useCircularProgress`).
   - `reactivityStruct.tsx`: Move buttons, slider, and switches into `def.children`.
   - `catalogFilterStruct.tsx`: Move inputs and buttons into `def.children`.
   - `catalogListStruct.tsx`: Move chips into `def.children` or FC slots.
   - `ssrCatalogStruct.tsx`: Move text field and buttons into `def.children`.

4. **Verification & Gates**:
   - Run `pnpm --filter @actdim/dynstruct-demo typecheck` (or `astro check && tsc --noEmit`).
   - Run `pnpm --filter @actdim/dynstruct-demo build` to verify clean build.
   - Run `pnpm test` in `dynstruct` to ensure no regressions in the core package.
