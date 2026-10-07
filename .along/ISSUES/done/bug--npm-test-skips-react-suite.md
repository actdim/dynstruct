---
protocol: along
protocol_version: "4.4.1"
slug: npm-test-skips-react-suite
type: bug
status: done
completed: 2026-10-01
priority: medium
created: 2026-10-01
updated: 2026-10-01
agent: claude-code
tags: [tests, vitest, ci]
milestone: v2.0.0
blocked_by: []
related: []
---

# npm test runs only the node suite and skips the React suite

## Problem Statement
`package.json` `test` ran only `vitest.node.config.ts` (`tests/**/*.{test,spec}.ts`). The React suite
(`vitest.react.config.ts`, happy-dom, `tests/react/**`) ran only via `test:react`. Every external runner that
uses the standard `npm test` contract (`along test`, the `along commit` pre-commit gate, `pnpm -r test`, CI)
silently skipped the 46 React tests.

## Execution Mode
Direct - one script change in `package.json`.

## Requirements
- REQ-1: `npm test` runs both suites (node, then React) and fails if either fails.
- REQ-2: `test:node` keeps the previous node-only command; `test:w`, `test:react`, `test:react:w` unchanged.

## Acceptance Criteria
- [x] `along test` runs node 6/6 and React 46/46.
- [x] Automated tests passing
