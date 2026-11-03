# Living Plan: security-endpoints-optional

## Revision 1 (2026-11-03T21:33:37Z, plan approve --plan-file)

# Execution plan: feat--security-endpoints-optional (roadmap step 1)
Issue: `feat--security-endpoints-optional` in the dynstruct submodule (`src/packages/dynstruct/.along/ISSUES/`).
Spec = issue file; this plan = order and exact actions; where they differ this plan wins.

Execution Mode: Direct (one submodule, 6 files, no core engine refactor).

## Preconditions
- dynstruct is on `main`, clean apart from `.along/`, and not ahead of `origin/main`:
  `git -C src/packages/dynstruct status --short` (only `.along/` lines or nothing) and
  `git -C src/packages/dynstruct log origin/main..HEAD --oneline` (empty).
  Note: the root `git status` shows `m src/packages/dynstruct` on 2026-11-03 (untracked or modified
  content inside the submodule). If the submodule `status --short` lists anything outside `.along/`,
  stop and ask.
- No other session edits dynstruct (roadmap Wave A: plans 2 and 3 touch dynstruct-mui and ui-core only).
- Plan approved for this issue (`along plan status security-endpoints-optional` run in `src/packages/dynstruct`).

## Overrides of the issue text
Copy into the issue file in step 0 (append a section `## Plan overrides (2026-11-03)`):
1. REQ-2 "fails fast at `SecurityService` start": `SecurityService` loads its config lazily, so "start" means
   the first `init()` (first request on any `APP.SECURITY.AUTH.*` channel it provides, for example
   `APP.SECURITY.AUTH.INFO.GET` at app boot) and every `APP.SECURITY.CONFIG.CHANGED`. The check is the exported
   function `validateSecurityDomainConfig`. Only `authSignIn` is checked; `authSignOut` keeps its existing
   lazy error in `bearerSignOut`.
2. REQ-4 "security topic, README config example": dynstruct has no security topic and no README config example.
   The docs to update are `AGENTS.md` (SecurityService section, line 89), `llms-full.txt` (line 406, same text),
   `docs/topic--04-react-integration.md` (section "Auth & Security Provider (`AuthInfo`)", line 409) and
   `CHANGELOG.md` (`## [Unreleased]`).
3. REQ-5 / Mempart consumer: no Mempart source change in this plan. `src/apps/webapp/src/config/appConfig.ts`
   (lines 398-403, the `/membership/auth/*` URLs) is cleaned up by `feat--app-shell-package` (roadmap 15), after
   the type is published in 3R; the file is also owned by plan 11 before 15 (collision matrix). Reason: the
   Mempart webapp runs `useConventions={false}` (`src/components/layout/MainLayout.tsx` line 112) so the dead URLs
   are harmless, and a Mempart edit now would only add a root commit and a collision for no behavior change.
4. "release through the monorepo-wide `version:sync`" is not done here; it is roadmap step 3R.

## Files touched
| Path (relative to `src/packages/dynstruct/`) | Change |
|------|--------|
| `src/appDomain/commonContracts.ts` | `BaseSecurityDomainConfig.endpoints` and all its fields optional (lines 514-521) |
| `src/services/react/SecurityService.tsx` | new exported `validateSecurityDomainConfig`; called in `updateConfig` and `init` |
| `tests/react/security-service-config.test.tsx` | new test file |
| `src/_stories/componentModel/securityService/SecurityServiceExample.stories.tsx` | drop the `endpoints: { authSignIn: null, authSignOut: null }` block (lines 15-19) |
| `AGENTS.md`, `llms-full.txt`, `docs/topic--04-react-integration.md`, `CHANGELOG.md` | docs |
| `.along/ISSUES/feat--security-endpoints-optional.md` | overrides, status |
| Mempart root: `src/packages/dynstruct` (gitlink only) | pointer bump |

## Steps
0. Goal: bind the session, align the issue, capture the baseline.
   Actions: `cd src/packages/dynstruct`; `along start security-endpoints-optional`; append the Overrides above
   to the issue file. From `src/`: run and save outputs to the session scratchpad (`$SCRATCH`):
   `pnpm --filter @actdim/dynstruct test > $SCRATCH/01-base-test.txt 2>&1`,
   `pnpm --filter @actdim/dynstruct typecheck > $SCRATCH/01-base-typecheck.txt 2>&1`,
   `pnpm --filter @actdim/dynstruct lint > $SCRATCH/01-base-lint.txt 2>&1`,
   `pnpm --filter @actdim/dynstruct build > $SCRATCH/01-base-build.txt 2>&1`,
   `pnpm --filter ./apps/webapp typecheck > $SCRATCH/01-base-webapp-typecheck.txt 2>&1`.
   Verify: record pass/fail and the vitest summary lines (`Tests  N passed`) of both test runs (node + react)
   in `$SCRATCH/01-baseline.md`. A red baseline is recorded, not fixed; if it is red in a file this plan touches,
   stop and ask.

1. Goal: make the endpoints optional (REQ-1, REQ-3).
   Actions: in `src/appDomain/commonContracts.ts` replace the `endpoints` member of `BaseSecurityDomainConfig`
   with (keep the two RFC 8414 comment lines above `authService`):
   ```ts
   /** HTTP endpoints of the built-in conventions mode (`<SecurityService useConventions />`). Not needed when the app handles `APP.SECURITY.AUTH.*.REQUEST` itself. */
   endpoints?: {
       authSignIn?: string;
       authSignOut?: string;
       authRefresh?: string;
       // RFC 8414 ...
       authService?: string;
   };
   ```
   `routes` stays required. `SecurityService.tsx` already reads `m.domainConfig.endpoints?.authSignIn`,
   `?.authSignOut`, `?.authRefresh` (lines 261, 330, 381); no other change is needed for the type.
   Verify: `pnpm --filter @actdim/dynstruct typecheck` passes.

2. Goal: fail fast in the conventions mode (REQ-2).
   Actions: in `src/services/react/SecurityService.tsx`, above `export const useSecurityService` (line 118), add:
   ```ts
   /** Throws when the conventions mode (`useConventions: true`) has no sign-in endpoint. */
   export function validateSecurityDomainConfig(config: BaseSecurityDomainConfig | undefined, useConventions: boolean): void {
       if (!useConventions) {
           return;
       }
       if (!config?.endpoints?.authSignIn) {
           throw new Error(
               'SecurityService (useConventions: true) needs domainConfig.endpoints.authSignIn. ' +
                   'Set it, or mount <SecurityService useConventions={false} /> and handle APP.SECURITY.AUTH.SIGNIN.REQUEST.',
           );
       }
   }
   ```
   In `updateConfig` (line 129) insert `validateSecurityDomainConfig(config, m.useConventions);` directly before
   `m.domainConfig = config;` (line 140), so an invalid `APP.SECURITY.CONFIG.CHANGED` payload is rejected and the
   old config is kept. In `init` (line 146) insert `validateSecurityDomainConfig(m.domainConfig, m.useConventions);`
   after the `await lock.dispatch(...)` block and before `if (m.authInfo?.isAuthenticated)` (covers a config passed
   through the `domainConfig` prop, which skips `updateConfig`). Do not touch `bearerSignIn`'s own check (line 263).
   Verify: `pnpm --filter @actdim/dynstruct typecheck` and `lint` pass.

3. Goal: tests (REQ-2, REQ-3, issue step 2).
   Actions: create `tests/react/security-service-config.test.tsx` (picked up by `vitest.react.config.ts`,
   `tests/react/**`). Pattern: `tests/react/services.test.tsx` (React, `render`, `ComponentContextProvider`,
   `createMsgBus<BaseAppMsgStruct>()` from `@actdim/msgmesh/core`). One fresh bus per test via a helper
   `setup(config: BaseSecurityDomainConfig, useConventions: boolean)` that calls
   `msgBus.provide({ channel: 'APP.SECURITY.CONFIG.GET', callback: () => config })`,
   `msgBus.provide({ channel: 'APP.STORE.GET', callback: () => undefined })` (read by `restoreData`), then
   `render(<ComponentContextProvider value={{ msgBus }}><SecurityService useConventions={useConventions} /></ComponentContextProvider>)`
   and returns the bus; `afterEach(cleanup)`. Fixtures:
   `const routes = { authSignInPage: '/login', authSignOutPage: '/logout' };`
   `const noEndpoints: BaseSecurityDomainConfig = { id: 'test', routes };` (this line is the compile-time check of
   REQ-1: no `endpoints` key)
   `const withEndpoints: BaseSecurityDomainConfig = { id: 'test', routes, endpoints: { authSignIn: '/auth/sign-in', authSignOut: '/auth/sign-out' } };`
   Test cases (describe `SecurityService domain config`):
   - `validateSecurityDomainConfig: conventions mode without authSignIn throws` -
     `expect(() => validateSecurityDomainConfig(noEndpoints, true)).toThrow(/endpoints\.authSignIn/)`.
   - `validateSecurityDomainConfig: conventions mode with authSignIn passes` - `withEndpoints, true` does not throw.
   - `validateSecurityDomainConfig: custom mode needs no endpoints` - `noEndpoints, false` and `undefined, false` do not throw.
   - `useConventions=false without endpoints answers AUTH.INFO.GET` - `await msgBus.request({ channel: 'APP.SECURITY.AUTH.INFO.GET' })`
     resolves and `payload.scheme === 'Bearer'`.
   - `useConventions=true without endpoints rejects at init` - `await expect(msgBus.request({ channel: 'APP.SECURITY.AUTH.INFO.GET' })).rejects.toThrow(/endpoints\.authSignIn/)`.
   - `useConventions=true with endpoints answers AUTH.INFO.GET` (REQ-3) - resolves, `payload.scheme === 'Bearer'`.
   If `msgBus.request` does not reject when the provider callback throws (check how
   `tests/react/msgbroker-and-communication.test.tsx` asserts provider errors and use the same assertion form),
   assert the error the same way that file does; do not weaken the case to "no response".
   Verify: `pnpm --filter @actdim/dynstruct test` green, the 6 new cases listed in the verbose output.

4. Goal: story without dead endpoints.
   Actions: in `SecurityServiceExample.stories.tsx` delete lines 15-19 (the `endpoints` object including the commented
   URL). The story mounts `useConventions={false}` (line 48), so behavior is unchanged.
   Verify: `pnpm --filter @actdim/dynstruct typecheck` passes (stories are under `src/`).

5. Goal: docs (REQ-4).
   Actions:
   - `AGENTS.md` line 89 and `llms-full.txt` line 406 (identical text): replace
     "Configure via `domainConfig.endpoints.*`." with "Configure via `domainConfig.endpoints.authSignIn` (required in
     this mode, checked when the service initializes), `authSignOut`, `authRefresh`." and in the next bullet append
     "`domainConfig.endpoints` is not needed in this mode."
   - `docs/topic--04-react-integration.md`, section "Auth & Security Provider (`AuthInfo`)": after the paragraph
     add a `tsx` example of `BaseSecurityDomainConfig` with only `id` and `routes` mounted with
     `<SecurityService useConventions={false} />`, and one sentence: endpoints are needed only for
     `useConventions: true`; a missing `authSignIn` throws on the first security request.
   - `CHANGELOG.md`: insert above `## [1.8.3]` a section `## [Unreleased]` / `### Changed` with one bullet:
     "`BaseSecurityDomainConfig.endpoints` and its fields are optional; `useConventions: true` without
     `endpoints.authSignIn` throws when `SecurityService` initializes (`validateSecurityDomainConfig`)
     (`feat--security-endpoints-optional`)." (3R renames `[Unreleased]` to the release.)
   Verify: `pnpm --filter @actdim/dynstruct docs:build` succeeds; `along lint` in `src/packages/dynstruct` clean
   (ASCII, fence languages).

6. Goal: commit and push the submodule, then the root pointer.
   Actions: see Commit points C1, C2.
   Verify: `git -C src/packages/dynstruct log origin/main..HEAD --oneline` empty after push;
   `git status --short src/packages/dynstruct` empty in the root after C2.

7. Goal: close.
   Actions: completion checklist (`docs/topic--along-protocol.md`, via `/along-kb-search completion checklist`),
   Hand-off edits, then in `src/packages/dynstruct`:
   `along wrap security-endpoints-optional --summary "BaseSecurityDomainConfig.endpoints optional; conventions mode checks authSignIn at init; tests and docs" --no-decisions`.

## Commit points
| Id | After step | Repo | Message summary | Bound issue |
|----|------------|------|-----------------|-------------|
| C1 | 5 | dynstruct | `feat: optional security endpoints, conventions mode checks authSignIn at init (refs #security-endpoints-optional)`; then `git push origin main` | `feat--security-endpoints-optional` |
| C2 | C1 pushed | Mempart root | `chore: dynstruct pointer, optional security endpoints (refs #app-core-extraction)`; stage only `src/packages/dynstruct`; push `origin main` | `task--app-core-extraction` (epic, in-progress; same practice as commits 2fe834a, a235c61). Do not wrap the epic. |

## Final verification
From `src/`, compare with `$SCRATCH/01-baseline.md`:
- `pnpm --filter @actdim/dynstruct test` - green; test count = baseline + 6.
- `pnpm --filter @actdim/dynstruct typecheck`, `lint`, `build` - same result as baseline (green).
- `pnpm --filter ./apps/webapp typecheck` - same result as baseline (the webapp fills all fields; a loosened
  type cannot add errors).
- `grep -n "endpoints?" src/packages/dynstruct/dist/appDomain/commonContracts.d.ts` - one hit (built type is optional).

## Hand-off
- dynstruct issue: tick the three AC boxes; status set by `along wrap`.
- Epic `.along/ISSUES/task--app-core-extraction.md`: stage 0 row for dynstruct `feat--security-endpoints-optional`
  gets "(done, unpublished; publish in 3R)".
- 3R relies on: dynstruct `CHANGELOG.md` has `## [Unreleased]`; dynstruct `main` pushed.
- 15 (`feat--app-shell-package`) relies on: `endpoints` optional, `validateSecurityDomainConfig` exported from
  `@actdim/dynstruct/services/react/SecurityService`; it removes `endpoints` from Mempart `appConfig.ts` lines 398-403.

## Stop and ask the user if
- The baseline is red in `SecurityService.tsx`, `commonContracts.ts` or the react test suite.
- `msgBus.request` neither rejects nor exposes the provider error in any form the existing tests use.
- Any consumer in the workspace (`grep -rn "endpoints\." src/apps src/packages --include=*.ts --include=*.tsx`,
  excluding `node_modules` and `dist`) reads `endpoints.*` without `?.` and fails typecheck.
- The root stop gate (`wrap_before_stop`) demands a wrap of `task--app-core-extraction` after C2.
