---
protocol: along
slug: binding-divergence-limits
type: feat
status: open
priority: high
created: 2026-09-11
updated: 2026-09-11
agent: antigravity
tags: [architecture, binding, reactivity, safety]
milestone: v2.0.0
blocked_by: []
related: [binding-cycle-and-reentrancy-protection]
---

# Enforce convergence round limits for two-way bindings

Implement round tracking for two-way binding synchronization (`bindingRetries`, default 10). If two bound models fail to reach convergence because converters, validators, or conflicting change handlers bounce values back and forth, halt reconciliation and raise an explicit divergence diagnostic error detailing both values and models involved.
