---
protocol: along
protocol_version: "4.9.1"
date: 2026-11-24
slug: signin-ensure-drops-query
agent: antigravity
branch: main
commit: a9077d0
summary: Skip APP.NAV.GOTO in SecurityService.ensureAuth when already on the sign-in page so query params like devLogin=1 are preserved; added isSignInLocation helper, unit tests, docs, and browser verification.
milestone: v2.0.0
issues_advanced: []
issues_completed: [bug--signin-ensure-drops-query]
decisions: []
---

# Session: Signin ensure drops query

## Summary
Skip APP.NAV.GOTO in SecurityService.ensureAuth when already on the sign-in page so query params like devLogin=1 are preserved; added isSignInLocation helper, unit tests, docs, and browser verification.

## Decisions
- None (confirmed at wrap: no architectural decisions).

## Blackboard Record

Execution mode: direct; plan revision 1; approved: true.

Plan: kept with the issue (`plan/plan.md`, 1 revision(s)).

### Execution Trace

#### Execution Trace: signin-ensure-drops-query
- 2026-11-24T19:15:41Z plan approved (approved issue plan; approved_via: issue-plan)
