# Living Implementation Plan: Server-Side Rendering (SSR) and Isomorphic Runtime Support in Dynstruct

## Execution Mode
Role-Based (along-team)

## Context and Architectural Invariants
- Target package: `src/packages/dynstruct`
- Issue: `feat--ssr-isomorphic-support`
- Runtime support: Node.js SSR (Astro, Next.js, react-dom/server) and Browser Client
- Key ADR compliance:
  - `ADR-2026-10-11--params-initial-value-semantics`: Params applied once at creation; plain params are initial values.
  - `ADR-2026-10-11--react-values-in-ref-props`: React values in ref props; observable map refreshed post-commit.
- Typography: Strict ASCII compliance (no Unicode em-dashes, curly quotes, non-breaking spaces).

## Requirement Traceability Matrix (STE-CNL)
- REQ-1: Dynstruct React hooks MUST replace direct useLayoutEffect invocation with an isomorphic layout effect hook that delegates to useEffect when typeof window === 'undefined'.
- REQ-2: Dynstruct React runtime initialization MUST call enableStaticRendering(true) from mobx-react-lite when typeof window === 'undefined'.
- REQ-3: Dynstruct services (including HttpClient and SecurityService) MUST NOT directly access browser globals (window, window.location) without checking for their presence or providing a safe isomorphic fallback when running in a non-browser environment.
- REQ-4: Dynstruct component context ID generation MUST prioritize explicit $id and $key parameters and MUST allow optional custom generator injection via props.value.getNextId.
- REQ-5: Dynstruct lifecycle and messaging brokers MUST NOT attempt async subscription bindings or side-effects during server-side renderToString execution.
- REQ-6: Automated test suite MUST execute renderToString from react-dom/server on dynstruct components in a Node.js environment without throwing exceptions or logging React server warnings.

## Living Plan Steps

### Step 1: Isomorphic Layout Effect, MobX Static Rendering, and Deterministic Component IDs
- Target files:
  - `src/componentModel/react/hooks.tsx`
  - `src/componentModel/react/componentContext.tsx`
- Implementation details:
  1. Define `useIsomorphicLayoutEffect`:
     ```typescript
     const isBrowser = typeof window !== 'undefined' &&
         typeof window.document !== 'undefined' &&
         typeof window.document.createElement !== 'undefined';
     const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;
     ```
  2. Replace all 4 occurrences of `useLayoutEffect` in `hooks.tsx` (`useReactPropsBox`, `OrigView` mount, and `useComponent` handlers) with `useIsomorphicLayoutEffect`.
  3. Import `enableStaticRendering` from `mobx-react-lite`. When `typeof window === 'undefined'`, call `enableStaticRendering(true)`. Re-export `enableStaticRendering` from `hooks.tsx`.
  4. In `componentContext.tsx`, update the context object constructor to preserve custom ID generators:
     `getNextId: props.value?.getNextId ?? getNextId`.
- Mapped Requirements: REQ-1, REQ-2, REQ-4.
- Acceptance Criteria:
  - Zero direct `useLayoutEffect` calls remain in `hooks.tsx`.
  - `enableStaticRendering(true)` is activated in server runtimes.
  - Custom `getNextId` passed via `props.value` is not overwritten by default sequential generator.

### Step 2: Browser Globals Isolation in Services and HTTP Client
- Target files:
  - `src/net/httpClient.ts`
  - `src/services/react/SecurityService.tsx`
- Implementation details:
  1. In `src/net/httpClient.ts`:
     - Guard constructor `this.fetcher = fetcher || (typeof window !== 'undefined' ? window : (globalThis as unknown as IFetcher));`.
     - In query parameter URL construction, guard `window.location.origin`:
       `const origin = typeof window !== 'undefined' && window.location ? window.location.origin : (this.baseUrl || 'http://localhost');`
  2. In `src/services/react/SecurityService.tsx`:
     - Guard `window.location` in `startInteractiveSignIn`: pass `{ pathname: '', search: '', hash: '' }` fallback if `typeof window === 'undefined'`.
     - Guard `window.location.origin` in `onReady` when initializing `httpClient.baseUrl`.
- Mapped Requirements: REQ-3.
- Acceptance Criteria:
  - `new HttpClient(...)` and query serialization execute without throwing `ReferenceError: window is not defined` in Node.js.
  - `SecurityService` initializes safely in headless / non-browser environments.

### Step 3: Automated Node.js SSR Verification Tests and Documentation
- Target files:
  - `tests/react/ssr.test.tsx`
  - `docs/topic--04-react-integration.md`
- Implementation details:
  1. Create `tests/react/ssr.test.tsx` marked with `/** @vitest-environment node */`:
     - Test that `enableStaticRendering` is active in Node.js environment.
     - Test `renderToString(<DemoCard title="SSR" $key="card-1" />)` produces expected HTML markup.
     - Spy on `console.warn` and `console.error` to assert zero `useLayoutEffect does nothing on the server` warnings.
     - Test that explicit `$id` and `$key` override sequential IDs deterministically.
     - Test that factory children render correctly within SSR markup.
     - Verify dormant lifecycle: assert that `useEffect`, `onReady`, and async effects do not trigger during `renderToString`.
  2. Document the SSR contract in `docs/topic--04-react-integration.md`:
     - Components for SSR must accept initial data synchronously via initial `params`.
     - Effects, async subscriptions, and `msgmesh` brokers remain dormant until client-side hydration.
- Mapped Requirements: REQ-5, REQ-6.
- Acceptance Criteria:
  - `pnpm test` executes all test suites (Node and React) with 100% pass rate.
  - SSR test passes under Node environment with zero console warnings or errors.
  - SSR documentation is updated and linked in docs index.
