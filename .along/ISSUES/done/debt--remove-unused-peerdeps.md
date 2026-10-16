---
protocol: along
protocol_version: "4.4.15"
slug: remove-unused-peerdeps
type: debt
status: done
completed: 2026-10-16
priority: medium
created: 2026-10-16
updated: 2026-10-16
agent: antigravity
tags: []
milestone: v2.0.0
blocked_by: []
related: []
---

# Remove unused peerDependencies (mobx-utils)

## Problem Statement / Background
mobx-utils was listed in peerDependencies of @actdim/dynstruct but was no longer imported anywhere in the codebase.

## Implementation Details
1. Removed mobx-utils from peerDependencies and package.json.
2. Verified that all observable and action utilities use native mobx without external helper packages.
3. Confirmed that pnpm install and tests run without peer dependency warnings.

## Acceptance Criteria
- [x] mobx-utils removed from peerDependencies in package.json
- [x] No broken imports or type references in dynstruct source
- [x] All automated tests pass cleanly
