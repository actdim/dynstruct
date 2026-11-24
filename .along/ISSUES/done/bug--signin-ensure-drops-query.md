---
protocol: along
protocol_version: "4.8.1"
slug: signin-ensure-drops-query
type: bug
status: done
completed: 2026-11-24
priority: low
created: 2026-11-14
updated: 2026-11-24
agent: claude-code
tags: [auth, navigation]
milestone: v2.0.0
blocked_by: []
related: []
plan_status: approved
---

# Auth ensure on the sign-in page drops its query (devLogin=1)

## Problem
Found by the Mempart browser verification of 2026-11-14 (Mempart issue
`bug--intake-ui-verification-defects`, "Not in this issue"). Opening
`http://localhost:5173/auth/sign-in?devLogin=1` signed out does not sign in automatically: the URL
becomes `/auth/sign-in?callbackUrl=%2F` within a second, and the app-shell sign-in page
(`@actdim/app-shell` `auth-pages/SignInPage.tsx`, `detectDevLogin`) then reads no `devLogin`
parameter. The "Dev sign-in (localhost)" button still works.

Cause (read from the code on 2026-11-14): some request on that page gets a 401,
`APP.SECURITY.AUTH.ENSURE` runs, and `SecurityService` (`src/services/react/SecurityService.tsx`,
about line 232) sends `APP.NAV.GOTO` to `domainConfig.routes.authSignInPage` with
`callbackUrl: resolveSignInCallbackUrl(...)`. On the sign-in page itself,
`resolveSignInCallbackUrl` (`src/appDomain/navigation.ts:141`) unwraps the current URL to its
`callbackUrl` (or `/`) and the new navigation carries only that, so every other query parameter of
the sign-in page is lost.

## Requirements
- REQ-1: When an auth ensure runs while the current route is already the sign-in page, `SecurityService` MUST NOT navigate again (or MUST keep the page's existing query).
- REQ-2: A sign-in page opened with extra query parameters MUST keep them after an auth ensure.
- REQ-3: A unit test MUST cover the ensure-on-sign-in-page case (`tests/signInCallbackUrl.test.ts` or a new one).

## Acceptance Criteria
- [x] Ensure on the sign-in page keeps `devLogin=1` (unit test)
- [x] Mempart: `/auth/sign-in?devLogin=1` signs in the seeded dev user without a click
- [x] Automated tests passing

## Notes
- Step 0.3 baseline: `python .along/scripts/test.py` passed (`node` + `react` 22 files / 129 tests); `eslint` on `src/appDomain/navigation.ts`, `src/services/react/SecurityService.tsx`, `tests/signInCallbackUrl.test.ts` reported 0 errors, 29 warnings (no `-f unix` formatter in ESLint 9).
- `location` in `SecurityService.tsx` did not clash with any enclosing identifier.

## Verification
- `pnpm exec vitest --config=vitest.node.config.ts --no-cache tests/signInCallbackUrl.test.ts`: 9 passed (6 existing + 3 new).
- `pnpm run typecheck`: passed (0 errors).
- `python .along/scripts/test.py`: passed (`node` + `react` 22 files / 129 tests).
- `pnpm exec eslint src/appDomain/navigation.ts src/services/react/SecurityService.tsx tests/signInCallbackUrl.test.ts`: 0 errors, 29 warnings (unchanged from baseline).
- `pnpm run build`: passed (`dist/` rebuilt).
- Mempart browser check (on `http://localhost:5174` because port 5173 was occupied by another service):
  - Signed out -> `http://localhost:5174/auth/sign-in?devLogin=1` (no click, 5s wait): `{"href":"http://localhost:5174/explorer?driveId=b1111111-1111-1111-1111-111111111111&path=%2F"}` (auto-login succeeded).
  - Signed out -> `http://localhost:5174/explorer`: `{"href":"http://localhost:5174/auth/sign-in?callbackUrl=%2Fexplorer"}` (ensure redirect preserved).
