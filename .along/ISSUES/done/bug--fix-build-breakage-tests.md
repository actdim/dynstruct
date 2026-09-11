---
protocol: along
protocol_version: "2.2.25"
slug: fix-build-breakage-tests
type: bug
status: done
priority: critical
created: 2026-09-07
updated: 2026-09-07
completed: 2026-09-07
agent: antigravity
tags: [build, typescript, contracts, tests]
milestone: v1.3.0-knowledge-base-and-graph
blocked_by: []
related: []
---

# Fix build breakage in dynstruct after commit 10b852a

## Context
Commit 10b852a bumped version to 1.5.14 and added 8 new React test suites (`tests/react/*.test.tsx`). The build command `npm run build` (`tsc -b tsconfig.json && vite build`) failed with TypeScript compilation errors in `tsconfig.build.json`.

## Root Causes & Fixes
1. `src/componentModel/contracts.ts` (`ComponentModel` and `ComponentActionStruct`) was not modified and remains 100% original. The compilation errors in tests were caused by untyped anonymous lambda wrappers passed to `toReact`: e.g. `toReact((p) => { const c = useBound(p); ... })` where TypeScript contextually defaulted `p` to `ComponentParams<ComponentStruct<any>>`. Fixed by passing the appropriate struct generic to `toReact<Struct>((p) => ...)` and accurately typing component instance variables (`Component<Struct>`).
2. `tests/react/msgbroker-and-communication.test.tsx` passed custom message channels as the `TNavRoutes` generic to `BaseAppMsgStruct<...>` instead of `MsgStruct<{ ... }> & BaseAppMsgStruct`. Fixed the type definition and removed empty `props: {}` from `SlowProviderStruct`.
3. `src/appDomain/commonContracts.ts` required `params: any` in `$NAV_GOTO`, whereas `navigation.ts` and `services.test.tsx` used optional params. Updated `$NAV_GOTO` payload to `params?: any`.
4. `onValidate` in `src/componentModel/contracts.ts` was not modified and remains strictly constrained to `KeyPath<TStruct["props"], boolean>`. The test `tests/react/validation-and-forms.test.tsx` was fixed to return validation results for real properties of `FormStruct` (`email` and `age`) instead of non-existent keys (`customField` and `paramField`).

