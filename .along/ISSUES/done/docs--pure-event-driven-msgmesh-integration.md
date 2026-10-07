---
protocol: along
slug: pure-event-driven-msgmesh-integration
type: docs
status: done
completed: 2026-10-03
priority: high
created: 2026-10-03
updated: 2026-10-03
agent: antigravity
tags: [documentation, msgmesh, dynstruct, architecture]
blocked_by: []
related: []
---

# Document Pure Event-Driven MsgMesh Architecture and Callback Props Prohibition

## Summary
Document the architectural rules forbidding React-style callback props (onSelect*, onNavigate*, onClose*) across Dynstruct components in package documentation (README.md, topic--03-architecture-and-wiring.md, topic--04-react-integration.md, and llms-full.txt).

## Requirements
1. Document prohibition of callback props and role of actions as internal MobX mutators.
2. Document persistent DOM mounting and CSS visibility toggling for sibling views subscribing to msgBroker.
3. Update README.md, topic--03-architecture-and-wiring.md, topic--04-react-integration.md, and docs/public/llms-full.txt.
4. Verify docs:build passes without errors.
