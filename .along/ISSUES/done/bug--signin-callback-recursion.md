---
protocol: along
protocol_version: "4.5.1"
slug: signin-callback-recursion
type: bug
status: done
completed: 2026-10-23
priority: medium
created: 2026-10-23
updated: 2026-10-23
agent: claude-code
tags: [security, auth]
parent: bug--signin-callback-and-feed-api
blocked_by: []
related: []
---

# ensureAuth nests callbackUrl when already on the sign-in page

## Problem

`SecurityService.ensureAuth()` (`src/services/react/SecurityService.tsx`) always navigates to
`domainConfig.routes.authSignInPage` with `callbackUrl = pathname + search + hash` of the current location. When the
user is already on the sign-in page and another request needs auth, the sign-in URL itself becomes the callback, so the
URL nests on every call. Reproduced in the mempart webapp: opening `/explorer` unauthenticated ends at
`/auth/sign-in?callbackUrl=/auth/sign-in?callbackUrl=/auth/sign-in?callbackUrl=/auth/sign-in?callbackUrl=/explorer`.

## Requirements

- REQ-1: A pure helper resolves the callback: on the sign-in page it keeps the existing `callbackUrl` (or `/` when
  absent); elsewhere it uses the current location. Paths compare with leading/trailing slashes normalized.
- REQ-2: `ensureAuth` uses the helper.

## Acceptance Criteria
- [x] Unit tests: current location elsewhere; already on sign-in with and without `callbackUrl`; slash normalization
- [x] Webapp: unauthenticated `/explorer` ends at `/auth/sign-in?callbackUrl=%2Fexplorer` (no nesting) in the browser
- [x] Automated tests passing
