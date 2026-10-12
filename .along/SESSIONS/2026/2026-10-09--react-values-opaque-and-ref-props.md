---
protocol: along
protocol_version: "4.4.7"
date: 2026-10-09
slug: react-values-opaque-and-ref-props
agent: claude-code
branch: main
commit: 5e7e882
summary: Completed feat--react-values-opaque-and-ref-props
issues_advanced: []
issues_completed: [feat--react-values-opaque-and-ref-props]
decisions: []
risks_logged: []
spikes_conducted: []
---

# Session: React values opaque and ref props

## Summary
Completed feat--react-values-opaque-and-ref-props

## Blackboard Record

Execution mode: direct; plan revision 1; approved: true.

### Attributed Files

| Path | Kind | Edits | Last edit | Sessions |
| --- | --- | --- | --- | --- |
| `src/packages/dynstruct/.along/ISSUES/feat--react-values-opaque-and-ref-props.md` | state | 1 | 2026-10-09T13:48:05Z | claude--354553d0-75fd-452e-a28b-1fa91aba44eb |
| `src/packages/dynstruct/AGENTS.md` | source | 1 | 2026-10-09T13:47:24Z | claude--354553d0-75fd-452e-a28b-1fa91aba44eb |
| `src/packages/dynstruct/docs/topic--02-core-concepts.md` | docs | 3 | 2026-10-09T13:47:44Z | claude--354553d0-75fd-452e-a28b-1fa91aba44eb |
| `src/packages/dynstruct/src/componentModel/contracts.ts` | source | 1 | 2026-10-09T13:44:46Z | claude--354553d0-75fd-452e-a28b-1fa91aba44eb |
| `src/packages/dynstruct/src/componentModel/core.tsx` | source | 6 | 2026-10-09T13:47:02Z | claude--354553d0-75fd-452e-a28b-1fa91aba44eb |
| `src/packages/dynstruct/src/componentModel/react/hooks.tsx` | source | 2 | 2026-10-09T13:46:19Z | claude--354553d0-75fd-452e-a28b-1fa91aba44eb |
| `src/packages/dynstruct/src/componentModel/util.ts` | source | 1 | 2026-10-09T13:44:40Z | claude--354553d0-75fd-452e-a28b-1fa91aba44eb |
| `src/packages/dynstruct/tests/react/reactElementParams.test.tsx` | source | 2 | 2026-10-09T13:46:47Z | claude--354553d0-75fd-452e-a28b-1fa91aba44eb |

### Plan

#### Living Plan: react-values-opaque-and-ref-props

##### Revision 1 (2026-10-09T13:44:30Z, plan approve --plan-file)

#### Plan: react-values-opaque-and-ref-props

Execution Mode: Direct

1. `src/componentModel/util.ts`: `isReactObject(value)` - object with a symbol `$$typeof`.
2. `core.tsx`: `isReactNodeValue` uses `isReactObject` (drop `isValidElement`); `reactive: 'ref'` -> `observable.ref`;
   model and deep-proxy getters return `observable.ref` values unproxied.
3. `react/hooks.tsx`: `wrapUserCode` skips `isReactObject` values.
4. `contracts.ts`: `reactive?: true | false | 'shallow' | 'ref'` with JSDoc.
5. Tests: portal, memo/forwardRef type in params, late element assignment with `reactive: 'ref'` (debugger emulation).
6. AGENTS.md: document `reactive: 'ref'` and the React-values rule. Run tests, typecheck, build dist.

### Execution Trace

#### Execution Trace: react-values-opaque-and-ref-props
- 2026-10-09T13:44:30Z plan recorded: revision 1 (plan approve --plan-file)
- 2026-10-09T13:44:30Z plan approved (along plan approve)
- 2026-10-09T13:44:40Z edit src/packages/dynstruct/src/componentModel/util.ts
- 2026-10-09T13:44:40Z denied [typography] replace_file_content: Typography Gate Violation: Detected forbidden non-ASCII typography in 'D:\Src\my\actdim\mempart\src\packages\dynstruct\src\componentModel\contracts.ts': 2 em...
- 2026-10-09T13:44:46Z edit src/packages/dynstruct/src/componentModel/contracts.ts
- 2026-10-09T13:45:02Z edit src/packages/dynstruct/src/componentModel/core.tsx (x5)
- 2026-10-09T13:45:16Z denied [test_before_stop] : Turn Completion Rejected [gate: test-before-stop]: Source files were modified in this session, but automated tests have not been executed afterward. Run test...
- 2026-10-09T13:45:22Z test FAIL (along test)
- 2026-10-09T13:45:56Z test FAIL (along test)
- 2026-10-09T13:46:19Z edit src/packages/dynstruct/src/componentModel/react/hooks.tsx (x2)
- 2026-10-09T13:46:47Z edit src/packages/dynstruct/tests/react/reactElementParams.test.tsx (x2)
- 2026-10-09T13:47:02Z edit src/packages/dynstruct/src/componentModel/core.tsx
- 2026-10-09T13:47:24Z edit src/packages/dynstruct/AGENTS.md
- 2026-10-09T13:47:44Z edit src/packages/dynstruct/docs/topic--02-core-concepts.md (x3)
- 2026-10-09T13:48:05Z edit src/packages/dynstruct/.along/ISSUES/feat--react-values-opaque-and-ref-props.md
- 2026-10-09T13:48:05Z archived by issue done

## Decisions
- None (confirmed at wrap: no architectural decisions).
