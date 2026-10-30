---
protocol: along
slug: ssr-isomorphic-support
type: feat
status: done
completed: 2026-10-30
priority: high
created: 2026-10-30
updated: 2026-10-30
agent: antigravity
tags: [ssr, isomorphic, react, mobx, lifecycle, astro, next]
milestone: v2.0.0
blocked_by: []
related: []
plan_status: approved
---

# Feat: Server-Side Rendering (SSR) and Isomorphic Runtime Support in Dynstruct

## Context and Problem Statement

`@actdim/dynstruct` was originally designed around rich client-side SPA lifecycles. When rendered in a Node.js SSR runtime (e.g., Astro, Next.js, or raw `react-dom/server` via `renderToString`), several architectural conflicts arise:

1. `useLayoutEffect` in `src/componentModel/react/hooks.tsx` executes synchronously during client layout, but React emits noisy warnings and skips execution entirely during SSR on the server.
2. MobX observables and `observer` components keep reactive tracking records active in Node.js memory unless `enableStaticRendering(true)` is enabled, causing memory leaks across concurrent HTTP requests.
3. Server runtimes do not execute `useEffect` or `useLayoutEffect`. In Dynstruct, `context.register`, `registerMsgBroker`, `onReady`, `onLayoutReady`, and `effects` are tied to mount effects. If a component relies on asynchronous data fetching in `effects`, SSR renders empty initial state, breaking SEO.
4. Services like `NavService` and `StorageService` reference browser globals (`window`, `document`, `localStorage`), throwing runtime ReferenceErrors in Node.js.
5. Sequential ID generation (`getNextId`) can diverge between server and client if conditional rendering occurs, triggering React Hydration Mismatch errors.

## Requirements and Implementation Scope

### 1. Isomorphic Layout Effect
- Replace direct `useLayoutEffect` imports across `hooks.tsx` with an isomorphic hook:
  ```typescript
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  ```
- Eliminate React server warnings (`useLayoutEffect does nothing on the server`).

### 2. MobX Static Rendering for Server Runtimes
- Ensure `enableStaticRendering(true)` from `mobx-react-lite` is invoked whenever `typeof window === 'undefined'`.
- Ensure server-side renders do not leak MobX reactions or retain component models in global listener graphs.

### 3. Browser Globals Isolation
- Guard all direct calls to `window`, `document`, `history`, and `localStorage` in core services (`NavService`, `StorageService`, error reporters).
- Allow graceful fallback or dummy providers in non-browser environments.

### 4. Deterministic Component IDs and Hydration Safety
- Audit `context.getNextId(regType)` and ensure hydration predictability between server HTML and client hydration.
- Allow deterministic ID overrides via params (`$id`, `$key`).

### 5. Synchronous SSR State Contract
- Document and enforce the SSR invariant: components intended for SSR must accept initial server data synchronously via initial `params` (e.g. `initialItems`, `initialFilter`).
- Effects, async fetchers, and `msgmesh` brokers must remain dormant during `renderToString` and activate only upon client-side hydration.

### 6. Node.js Verification Tests
- Add automated test coverage in `tests/react/` or `tests/ssr/` verifying that `renderToString(<Component />)` renders valid HTML without throwing errors or printing warnings.

## Acceptance Criteria
- [x] Isomorphic layout effect hook replaces direct useLayoutEffect calls in hooks.tsx without React server warnings
- [x] MobX static rendering enableStaticRendering(true) is activated in Node.js / non-browser environments
- [x] Browser globals (window, window.location) are isolated with safe fallbacks in HttpClient and SecurityService
- [x] Deterministic component IDs are supported via $id, $key, and custom getNextId
- [x] Dormant SSR lifecycle contract enforced during renderToString (onReady and effects do not execute)
- [x] Automated Node.js SSR tests in tests/react/ssr.test.tsx pass with 100% success rate
- [x] Documentation for SSR and isomorphic runtime support added to docs/topic--04-react-integration.md
