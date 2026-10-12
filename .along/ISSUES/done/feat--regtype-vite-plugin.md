---
protocol: along
protocol_version: "4.4.9"
slug: regtype-vite-plugin
type: feat
status: done
completed: 2026-10-11
priority: high
created: 2026-10-11
updated: 2026-10-11
agent: claude-code
tags: [componentModel, vite]
blocked_by: []
related: []
---

# regType derived at build time by a Vite plugin; runtime fallback never crashes

## Problem

Without `def.regType`, `createComponent` derived the component type from the call stack
(`getComponentSourceByCaller(6)` + a V8-only regex `\(([^)]+)\)`), then called `cleanSourceRef(regType)`.
In Firefox/Safari (frames `fn@url:line:col`) the regex finds nothing -> `undefined.replace` -> TypeError:
every component without `def.regType` (all of the webapp) crashes at creation. Even in V8 the result depends on
wrapper depth, is a minified path in production and costs a `new Error()` per component.

## Changes

- Runtime (`hooks.tsx`, `core.tsx`, `contracts.ts`):
  - `useComponent(def, params, internals?, meta?)`, new `ComponentMeta = { regType?: string }` (plugin-injected).
  - `regType = def.regType ?? meta.regType ?? (DEV: stack label | 'component')`; production never reads the stack.
  - `parseStackFrameLocation` (V8 + Firefox/Safari frames) and a `getComponentSourceByCaller` that never throws.
- Plugin `src/vite/plugin.ts` -> `@actdim/dynstruct/vite/plugin`: `dynstructPlugin()` (`enforce: 'post'`,
  `this.parse()` + `magic-string`, source maps). Appends `{ regType }` to `useComponent` calls (imported name or
  alias) from the nearest named enclosing function: `useXxx` -> `Xxx`, PascalCase as is, else the module name.
  `magic-string` added as a devDependency (bundled into `dist`).
- Wired into dynstruct `vitest.react.config.ts` and `.storybook/main.ts`.

## Tests

- `tests/vitePlugin.test.ts` (node): injection shapes, aliases, nested functions, fallback, skips, source map,
  stack frame parsing for V8 and Firefox/Safari.
- `tests/react/reg-type.test.tsx`: metadata used, `def.regType` wins, unparsable stack -> `'component'` without
  throwing, plugin injects the hook name in the real transform pipeline.

## Remaining (consumer step)

- Wire the plugin into the webapp `vite.config.ts` and the dynstruct-mui storybook (issues in those contexts).

## Acceptance Criteria
- [x] No crash when the stack is unparsable; no stack reads in production
- [x] Plugin injects regType; explicit `def.regType` wins
- [x] Tests (node + react) passing; `tsc -b` and build pass; plugin loads from `dist`
- [x] Wired into webapp (`vite.config.ts`, root `task--dynstruct-1-8-2-consumer`; 85 regTypes in the production
      bundle) and the dynstruct-mui storybook (`task--content-props-as-ref`)
- [x] Plugin type is structural (`DynstructVitePlugin`), independent of the consumer's `vite` type instance
- [x] Member functions (factory children) named after their key (review finding)
