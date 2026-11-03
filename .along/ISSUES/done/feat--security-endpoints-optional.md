---
protocol: along
protocol_version: "4.6.0"
slug: security-endpoints-optional
type: feat
status: done
completed: 2026-11-03
priority: high
created: 2026-11-03
updated: 2026-11-03
agent: claude-code
tags: [dynstruct, security, contracts]
blocked_by: []
related: []
plan_status: approved
---

# Optional auth endpoints in `BaseSecurityDomainConfig`

## Problem Statement
`BaseSecurityDomainConfig.endpoints` in `src/appDomain/commonContracts.ts` requires
`authSignIn` and `authSignOut` strings. They are used only by the built-in password-grant mode
of `SecurityService` (`useConventions: true`: POST credentials to `authSignIn`, refresh via
`authRefresh`). Apps that mount `<SecurityService useConventions={false} />` and handle
`APP.SECURITY.*` themselves (OIDC providers, as in Mempart) still have to fill URLs that are
never called, e.g. `/membership/auth/sign-in` in Mempart, which has no such server routes.

## Goals
- Apps without the conventions mode declare no auth endpoint URLs.
- The conventions mode and its docs stay unchanged.

## Requirements
- REQ-1: `endpoints` (or its `authSignIn` / `authSignOut` fields) becomes optional.
- REQ-2: With `useConventions: true`, a missing `authSignIn` fails fast with a clear error at
  `SecurityService` start, not at the first sign-in; covered by a test.
- REQ-3: No behavior change for configs that fill the fields.
- REQ-4: Docs (security topic, README config example) state that endpoints are needed only for
  the conventions mode.
- REQ-5: Released to npm first in the Mempart app-core extraction (consumer step: Mempart
  `appConfig.ts` and `@actdim/app-shell` drop the dead URLs).

## Implementation steps
1. Change the type; add the start-time check in `SecurityService` for the conventions mode.
2. Tests: config without endpoints + `useConventions: false` compiles and runs; conventions
   mode without `authSignIn` throws at start.
3. Docs; release through the monorepo-wide `version:sync`.

## Acceptance Criteria
- [x] Type and runtime check in place; existing tests green.
- [x] Docs updated.
- [x] Automated tests passing (`pnpm test`, `pnpm typecheck` in dynstruct).

## Plan overrides (2026-11-03)
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

