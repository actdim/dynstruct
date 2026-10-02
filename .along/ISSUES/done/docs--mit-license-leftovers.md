---
protocol: along
protocol_version: "4.4.1"
slug: mit-license-leftovers
type: docs
status: done
completed: 2026-10-02
priority: high
created: 2026-10-02
updated: 2026-10-02
agent: claude-code
tags: [license, docs, release]
milestone: v2.0.0-along-transition
blocked_by: []
related: []
---

# Docs: remove leftover "Proprietary / BUSL-1.1" license text

`LICENSE` and `package.json` are MIT, but the README License section, `docs/topic--05-api-reference.md` and `llms-full.txt` (root and `docs/public/`) still say "Proprietary / BUSL-1.1".

## Acceptance Criteria
- [ ] README License section says MIT
- [ ] `docs/topic--05-api-reference.md` says MIT
- [ ] `llms-full.txt` and `docs/public/llms-full.txt` have no "Proprietary" / "BUSL"
