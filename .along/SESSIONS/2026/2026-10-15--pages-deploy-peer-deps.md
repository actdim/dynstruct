---
protocol: along
protocol_version: "4.4.13"
date: 2026-10-15
slug: pages-deploy-peer-deps
agent: antigravity
branch: main
commit: ea09b55
summary: Fix GitHub Pages deploy failure by disabling auto-install-peers for docs
issues_advanced: []
issues_completed: [bug--pages-deploy-peer-deps]
decisions: []
risks_logged: []
spikes_conducted: []
---

# Session: Pages deploy peer deps

## Summary
Fix GitHub Pages deploy failure by disabling auto-install-peers for docs

## Decisions
- None (confirmed at wrap: no architectural decisions).

## Blackboard Record

Execution mode: direct; plan revision 1; approved: true.

### Attributed Files

| Path | Kind | Edits | Last edit | Sessions |
| --- | --- | --- | --- | --- |
| `src/packages/dynstruct/.along/.session/pages-deploy-peer-deps/plan.md` | state | 1 | 2026-10-15T17:35:11Z | antigravity--fba66bb2-5555-4dfb-be88-fdf6dcf4a35c |
| `src/packages/dynstruct/.github/workflows/pages.yml` | source | 1 | 2026-10-15T17:35:20Z | antigravity--fba66bb2-5555-4dfb-be88-fdf6dcf4a35c |
| `src/packages/dynstruct/.npmrc` | source | 1 | 2026-10-15T17:35:15Z | antigravity--fba66bb2-5555-4dfb-be88-fdf6dcf4a35c |

### Plan

#### Living Plan: pages-deploy-peer-deps

Title: Fix GitHub Pages deploy failure on unreleased peer dependencies

##### Goal
Configure pnpm to disable auto-installation of peer dependencies during docs deployment on GitHub Pages and via .npmrc.

##### Steps
- [x] Step 1: Update .github/workflows/pages.yml with --config.auto-install-peers=false
- [x] Step 2: Add .npmrc with auto-install-peers=false
- [x] Step 3: Verify docs build and test suite

### Execution Trace

#### Execution Trace: pages-deploy-peer-deps
- 2026-10-15T17:35:05Z plan approved (along start --approved; approved_via: cli-unverified)
- 2026-10-15T17:35:11Z edit src/packages/dynstruct/.along/.session/pages-deploy-peer-deps/plan.md
- 2026-10-15T17:35:15Z edit src/packages/dynstruct/.npmrc
- 2026-10-15T17:35:20Z edit src/packages/dynstruct/.github/workflows/pages.yml
- 2026-10-15T17:35:32Z test FAIL (Wrap Quality Gate)
- 2026-10-15T17:36:18Z test pass (Wrap Quality Gate)
