---
protocol: along
protocol_version: "4.4.1"
date: 2026-10-01
slug: npm-test-skips-react-suite
agent: claude-code
branch: main
commit: 677235a
summary: npm test now runs the node and React vitest suites; along test and the commit gate cover all 52 tests.
milestone: v2.0.0
issues_advanced: []
issues_completed: [bug--npm-test-skips-react-suite]
decisions: []
risks_logged: []
spikes_conducted: []
---

# Session: Npm test skips react suite

## Summary
npm test now runs the node and React vitest suites; along test and the commit gate cover all 52 tests.

## Initial Implementation Plan (Baseline)
Execution Mode: Direct. REQ-1: `npm test` runs node then React suites. REQ-2: node-only command kept as `test:node`.

## Work Completed
- `package.json`: `test` = `npm run test:node && npm run test:react`; previous command moved to `test:node`.
  `test:w`, `test:react`, `test:react:w` unchanged.

## Execution & Loop Trace
- No fix or re-plan loops. Found while re-verifying the v1.8.0 release (root `task--along-metadata-reconciliation`):
  `along test` reported only 6 tests.

## Verification Walkthrough & Gate Manifest
```text
Gate Execution Manifest:
- Workspace Isolation: EXECUTED (PASS) [mode: inherit (default)]
- File Integrity: EXECUTED (PASS)
- Automated Tests: EXECUTED (PASS) [along test: node 3 files 6/6, react 10 files 46/46]
- Diff Scope Audit: EXECUTED (PASS) [package.json scripts, two docs topics]
- Requirement Traceability: EXECUTED (PASS) [REQ-1, REQ-2]
- Blast Radius: DEGRADED (PASS) [static search, code-review-graph offline: workspace src/package.json and .github/workflows/pages.yml do not call `test`]
- Documentation Parity: EXECUTED (PASS) [docs/topic--setup-and-workflow.md scripts table, docs/topic--05-api-reference.md "Running Unit Tests"]
- Clean Typography: EXECUTED (PASS)
```
