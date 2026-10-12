---
protocol: along
protocol_version: "4.4.10"
slug: dynstruct-review-followups
type: debt
status: done
completed: 2026-10-12
priority: high
created: 2026-10-12
updated: 2026-10-12
agent: claude-code
parent: task--leftovers-after-params-semantics
tags: []
blocked_by: []
related: []
---

# Async nested action double error report, getter prop loses param, magic-string as external dependency

Review nits left from `debt--params-initial-value-semantics` / `bug--error-dedup-singleton-errors`.

1. **Async double report** (`react/hooks.tsx` `run()`): `_runDepth` tracks only synchronous nesting. An inner action
   awaited after an `await` starts at depth 0; when another wrapped call runs between the inner report and the outer
   `.catch`, `_lastDispatchedError` is reset and the outer run reports the same error again.
   Fix: every run gets an increasing id, a reported error object remembers the reporting run id (`WeakMap`); an
   async rejection is skipped when its error was reported by a run started later (a nested run it awaited). A
   concurrent call started earlier that fails with the same object is still reported (review finding: a global
   "reported while pending" rule hid it). Thrown primitives are not tracked on the async path. The sync rule (new
   call -> reported again) is unchanged.
2. **Getter prop loses param** (`core.tsx` `createModel`): the params loop treated any getter-only descriptor as
   computed, so `get x() { return prop(...) }` silently dropped its param (and DEV warned about a computed prop).
   Fix: skip only keys classified as `computed` by the `def.props` loop.
3. **magic-string**: devDependency bundled into `dist/node_modules` by the vite plugin entry. Moved to
   `dependencies`; `packageConfig.ts` externals include `dependencies`.

## Acceptance Criteria
- [x] Tests: async nested rethrow reported once, concurrent calls with the same error object both reported,
      same async error in a later call reported again
      (`tests/react/error-dedup.test.tsx`); getter prop takes plain and binding params
      (`tests/react/dev-guards.test.tsx`). Both new failing cases verified red before the fix.
- [x] `dist/vite/plugin.es.js` imports `magic-string` bare, no `dist/**/node_modules`
- [x] AGENTS.md (error dedup), CHANGELOG `[Unreleased]`
- [x] Automated tests passing
