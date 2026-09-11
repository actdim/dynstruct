---
protocol: along
slug: binding-cycle-and-reentrancy-protection
type: feat
status: open
priority: high
created: 2026-09-11
updated: 2026-09-11
agent: antigravity
tags: [architecture, binding, reactivity, safety]
milestone: v2.0.0
blocked_by: []
related: [binding-divergence-limits]
---

# Guard two-way property bindings against re-entrancy and circular setter loops

Implement re-entrancy protection in model proxy setters (`settersInProgress` tracking). Detect circular assignments to the same property within its own change notification chain and throw explicit diagnostic errors explaining the cycle instead of causing call stack overflow or silent degradation.
