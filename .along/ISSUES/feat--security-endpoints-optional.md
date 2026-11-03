---
protocol: along
protocol_version: "4.6.0"
slug: security-endpoints-optional
type: feat
status: open
priority: high
created: 2026-11-03
updated: 2026-11-03
agent: claude-code
tags: [dynstruct, security, contracts]
blocked_by: []
related: []
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
- [ ] Type and runtime check in place; existing tests green.
- [ ] Docs updated.
- [ ] Automated tests passing (`pnpm test`, `pnpm typecheck` in dynstruct).
