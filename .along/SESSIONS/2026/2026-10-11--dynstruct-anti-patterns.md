---
protocol: along
protocol_version: "4.4.9"
date: 2026-10-11
slug: dynstruct-anti-patterns
agent: claude-code
branch: main
commit: 5e7e882
summary: Completed docs--dynstruct-anti-patterns
issues_advanced: []
issues_completed: [docs--dynstruct-anti-patterns]
decisions: []
risks_logged: []
spikes_conducted: []
---

# Session: Dynstruct anti patterns

## Summary
Completed docs--dynstruct-anti-patterns

## Blackboard Record

Execution mode: direct; plan revision 1; approved: true.

### Attributed Files

| Path | Kind | Edits | Last edit | Sessions |
| --- | --- | --- | --- | --- |
| `src/packages/dynstruct/.along/DECISIONS/ADR-2026-10-11--react-values-in-ref-props.md` | state | 1 | 2026-10-11T17:37:15Z | claude--ba97ba4d-633b-411f-8c6d-c62c89c31ffc |
| `src/packages/dynstruct/.along/ISSUES/docs--dynstruct-anti-patterns.md` | state | 1 | 2026-10-11T17:37:37Z | claude--ba97ba4d-633b-411f-8c6d-c62c89c31ffc |
| `src/packages/dynstruct/.along/ISSUES/feat--react-values-in-ref-props.md` | state | 1 | 2026-10-11T17:37:37Z | claude--ba97ba4d-633b-411f-8c6d-c62c89c31ffc |
| `src/packages/dynstruct/AGENTS.md` | source | 4 | 2026-10-11T17:36:03Z | claude--ba97ba4d-633b-411f-8c6d-c62c89c31ffc |
| `src/packages/dynstruct/CHANGELOG.md` | source | 2 | 2026-10-11T17:37:00Z | claude--ba97ba4d-633b-411f-8c6d-c62c89c31ffc |
| `src/packages/dynstruct/docs/topic--02-core-concepts.md` | docs | 2 | 2026-10-11T17:36:40Z | claude--ba97ba4d-633b-411f-8c6d-c62c89c31ffc |
| `src/packages/dynstruct/docs/topic--04-react-integration.md` | docs | 2 | 2026-10-11T17:36:27Z | claude--ba97ba4d-633b-411f-8c6d-c62c89c31ffc |

### Plan

#### Living Plan: dynstruct-anti-patterns

##### Revision 1 (2026-10-11T17:35:21Z, plan approve --plan-file)

#### Plan: dynstruct - root-cause fixes for problems found in this session

##### Context

User: continue with the dynstruct problems discovered in this session (code, docs, tooling), going for root
causes rather than symptoms (as with the params sync). Commits later (after along is fixed). Decisions taken
with the user:
- regType: Vite plugin derives it at build time; runtime never crashes (fallback), no stack parsing in prod.
- Errors: actions are auto-wrapped by `run`; closure helpers are wrapped by the author via `c.run` (documented);
  dedup deterministic (reset at depth-0 entry), no global "forever" suppression.
- React values in props: no auto-detection; allowed only in `prop({ reactive: 'ref' })` props (anywhere inside
  them); elsewhere a hard DEV error; no check in prod.
- Eager model reads: documentation only (fails immediately on first render), no linter, no factory API.

Execution Mode: Role-Based light - implement per issue, independent review subagent on each finished issue,
full verification at the end. Work happens in dynstruct; consumer changes in dynstruct-mui and webapp go under
child issues there (`parent:` umbrella - relies on the along cross-context fix the user is doing now).

##### 1. `feat--regtype-vite-plugin` (+ crash fix)
- Runtime (`src/componentModel/react/hooks.tsx`, `core.tsx`):
  - `useComponent(def, params, internals?, meta?)` - new internal 4th arg `meta?: { regType?: string }`
    (documented as plugin-injected).
  - `regType = def.regType ?? meta?.regType ?? fallback`; fallback: DEV - best-effort stack label in `try`
    (V8 and Firefox/Safari frame formats, never throws), prod - `'component'`. No `new Error()` in prod.
- Plugin `dynstructPlugin()` (new entry, node-only, e.g. `@actdim/dynstruct/vite`): `transform` in `post`
  phase, `this.parse()` + `magic-string`; for each `useComponent(` call inside a function named `useXxx`
  (declaration or `const useXxx =`), append `meta` with `regType: 'Xxx'` (fallback: module file name);
  sourcemaps preserved; skips calls that already pass `meta`.
- Wire into: webapp `vite.config`, dynstruct storybook + vitest configs, dynstruct-mui storybook.
- Tests: plugin transform unit tests (fixtures of hook shapes); runtime: unparsable stack -> no throw,
  fallback id; meta.regType used for ids.

##### 2. `bug--error-dedup-singleton-errors`
- `run` (`hooks.tsx`): module-level depth counter; on entering `run` at depth 0 reset the
  "already reported" marker; nested rethrows in the same chain report once; the same error object in a new
  chain reports again. Remove the never-reset path.
- Docs: two patterns - functions in `def.actions` are wrapped automatically; closure helpers next to the
  component must wrap their body in `c.run(...)`; inline JSX handlers are not recommended.
- Tests: same error object from two separate action calls -> 2 reports; action -> action rethrow -> 1.

##### 3. `feat--react-values-only-in-ref-props` (supersedes `bug--nested-react-nodes-proxy-prevention`)
- `core.tsx`: remove auto-detection (`isReactNodeValue` from annotation inference, get and set traps);
  `ref` props keep values opaque (nested React values inside them are fine).
- DEV only: on model creation and on every assignment, a React value (`isReactObject`, recursively in plain
  objects/arrays) in a non-`ref` prop throws:
  `[dynstruct] Prop 'x' of '<regType>' holds a React value: declare prop({ reactive: 'ref' }) or move the content into a child component.`
- Consumers (child issues):
  - dynstruct-mui: `TextField.slotProps`, `Autocomplete.slotProps`, `Menu.items`, any other content prop found
    by the DEV error in stories/tests.
  - webapp: `ActionSheet.actions`, `children` of toReact components receiving JSX (e.g. AppShell), plus what
    the DEV error reports.
- Tests: `tests/react/reactElementParams.test.tsx` rewritten to the new contract (ref prop keeps elements by
  reference; non-ref prop with an element throws in DEV); remove the nested auto-ref expectations.
- ADR (breaking: values previously auto-stored by reference now require `ref`), CHANGELOG, docs topic--04 s.7.

##### 4. Eager model reads - documentation only (no linter)
- An eager read fails on the first render with `TypeError: Cannot read properties of undefined (reading 'x')`
  pointing at the line in `def` - it surfaces immediately in development. Covered in the anti-patterns
  section (item 6) with the typical error text so it is recognized at once.

##### 5. `task--dynstruct-tooling-repair`
- Repair `eslint.config.mjs` (broken merge in HEAD) to one valid config (reference: msgmesh/utico configs);
  run lint on src/tests; fix issues only in files touched this session; report the rest.
- `.along/scripts/test.py`: drop `--silent`.
- Dismiss the earlier chip for this.

##### 6. `docs--dynstruct-anti-patterns`
- AGENTS.md + topic--04 (+ llms via kb-sync): BAD/GOOD pairs - eager model reads in `def`; React hooks in the
  hook-constructor body reading the model (host is not an observer -> use `def.effects` / lifecycle events);
  toReact components rendered inside `view`; callback props; `params.x`; React values only in ref props;
  closure helpers wrapped in `c.run`; regType via the plugin.

##### 7. `bug--component-model-dev-guards`
- DEV warning when one component's `View` is mounted twice at the same time.
- Plain param targeting a computed (getter) prop: test current behavior; if it throws, ignore with a DEV warning.

##### Verification
- dynstruct: `npm test` (node + react), `tsc -b`, `npm run build`, lint (after repair).
- dynstruct-mui: tests/typecheck/storybook build if available; webapp: `tsc` (only pre-existing
  MediaViewerStub errors allowed), `vite build`, lint counts before/after; DEV run of stories/tests to surface
  React-value errors.
- Root `along test`. Review subagent per issue.
- No commits (user commits later after the along fix).

### Execution Trace

#### Execution Trace: dynstruct-anti-patterns
- 2026-10-11T17:35:21Z plan recorded: revision 1 (plan approve --plan-file)
- 2026-10-11T17:35:21Z plan approved (along plan approve)
- 2026-10-11T17:36:03Z edit src/packages/dynstruct/AGENTS.md (x4)
- 2026-10-11T17:36:27Z edit src/packages/dynstruct/docs/topic--04-react-integration.md (x2)
- 2026-10-11T17:36:40Z edit src/packages/dynstruct/docs/topic--02-core-concepts.md (x2)
- 2026-10-11T17:37:00Z edit src/packages/dynstruct/CHANGELOG.md (x2)
- 2026-10-11T17:37:15Z edit src/packages/dynstruct/.along/DECISIONS/ADR-2026-10-11--react-values-in-ref-props.md
- 2026-10-11T17:37:37Z edit src/packages/dynstruct/.along/ISSUES/feat--react-values-in-ref-props.md
- 2026-10-11T17:37:37Z edit src/packages/dynstruct/.along/ISSUES/docs--dynstruct-anti-patterns.md
- 2026-10-11T17:37:39Z archived by issue done
