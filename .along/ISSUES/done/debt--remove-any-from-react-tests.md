---
protocol: along
protocol_version: "2.2.25"
slug: remove-any-from-react-tests
type: debt
status: done
priority: high
created: 2026-09-07
updated: 2026-09-07
completed: 2026-09-07
agent: antigravity
tags: [react, tests, typescript, msgbus, any-elimination]
---

# Remove any usage from React tests and message bus definitions

## Context
In `tests/react/*.test.tsx`, tests were using `BaseAppMsgStruct<any>` and `createMsgBus<TestMsgStruct, any>()` as well as stray `any` casts in mocks and callbacks. The core dynstruct and msgmesh architecture is designed for complete structural type-safety with zero `any`.

## Changes
1. Eliminated `BaseAppMsgStruct<any>` and `createMsgBus<TestMsgStruct, any>()` across all 9 test suites in `tests/react/`:
   - `bindings.test.tsx`: `type TestMsgStruct = BaseAppMsgStruct; const msgBus = createMsgBus<TestMsgStruct>();`
   - `component.test.tsx`: `type TestMsgStruct = BaseAppMsgStruct; const msgBus = createMsgBus<TestMsgStruct>();`
   - `error-boundary.test.tsx`: `type TestMsgStruct = BaseAppMsgStruct; const msgBus = createMsgBus<TestMsgStruct>();`
   - `hierarchy-and-children.test.tsx`: `type TestMsgStruct = BaseAppMsgStruct; const msgBus = createMsgBus<TestMsgStruct>();`
   - `lifecycle-and-hooks.test.tsx`: `type TestMsgStruct = BaseAppMsgStruct; const msgBus = createMsgBus<TestMsgStruct>();`
   - `msgbroker-and-communication.test.tsx`: `const msgBus = createMsgBus<TestMsgStruct>();`
   - `reactivity-and-props.test.tsx`: `type TestMsgStruct = BaseAppMsgStruct; const msgBus = createMsgBus<TestMsgStruct>();`
   - `services.test.tsx`: `type TestMsgStruct = BaseAppMsgStruct; const msgBus = createMsgBus<TestMsgStruct>();`
   - `validation-and-forms.test.tsx`: `type TestMsgStruct = BaseAppMsgStruct; const msgBus = createMsgBus<TestMsgStruct>();`
2. Removed mock and helper `any` casts in `tests/react/`:
   - `services.test.tsx`: Typed `mockAdapter` as `MsgProviderAdapter` from `@actdim/msgmesh/adapters`, eliminating `adapters={[mockAdapter as any]}`.
   - `services.test.tsx`: Replaced `Map<string, any>` with `Map<string, unknown>` and cast mock store to `PersistentStore` instead of `any`.
   - `error-boundary.test.tsx`: Changed `fallback={(err: any) => ...}` to `fallback={(err: unknown) => ...}` with proper type narrowing.
   - `lifecycle-and-hooks.test.tsx`: Replaced `useDynamicContent<any>` with concrete `useDynamicContent<{ message: string }>`.
   - `reactivity-and-props.test.tsx`: Changed `changingSpy` parameter types from `any` to `unknown`.
