# Plan: Remove MobX Mentions from Demo

Execution Mode: Direct

## Steps
1. Update Astro pages, UI structs, and sample data in `src/packages/dynstruct/demo` to eliminate MobX terminology:
   - `src/packages/dynstruct/demo/src/pages/index.astro`
   - `src/packages/dynstruct/demo/src/data/sampleCatalog.ts`
   - `src/packages/dynstruct/demo/src/data/codeSnippets.ts`
   - `src/packages/dynstruct/demo/src/components/structs/asyncSearchStruct.tsx`
   - `src/packages/dynstruct/demo/src/components/structs/catalogListStruct.tsx`
   - `src/packages/dynstruct/demo/src/components/structs/formDemoStruct.tsx`
   - `src/packages/dynstruct/demo/src/components/structs/reactivityStruct.tsx`
   - `src/packages/dynstruct/demo/src/components/structs/showcaseStruct.tsx`
2. Update Playwright smoke test assertion in `src/packages/dynstruct/demo/e2e/smoke.spec.ts`.
3. Remove direct dependencies on `mobx` and `mobx-react-lite` from `src/packages/dynstruct/demo/package.json`.
4. Update `src/packages/dynstruct/demo/astro.config.mjs` dedupe configuration.
5. Update `src/packages/dynstruct/demo/README.md` and `src/packages/dynstruct/docs/topic--demo-architecture.md` demo documentation.
6. Verify type check and Playwright e2e test execution.
