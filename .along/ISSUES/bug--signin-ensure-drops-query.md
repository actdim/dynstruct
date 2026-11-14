---
protocol: along
protocol_version: "4.8.1"
slug: signin-ensure-drops-query
type: bug
status: open
priority: low
created: 2026-11-14
updated: 2026-11-14
agent: claude-code
tags: [auth, navigation]
milestone: v2.0.0
blocked_by: []
related: []
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
- [ ] Ensure on the sign-in page keeps `devLogin=1` (unit test)
- [ ] Mempart: `/auth/sign-in?devLogin=1` signs in the seeded dev user without a click
- [ ] Automated tests passing
