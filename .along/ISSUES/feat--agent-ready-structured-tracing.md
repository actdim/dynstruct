---
protocol: along
slug: agent-ready-structured-tracing
type: feat
status: open
priority: medium
created: 2026-09-11
updated: 2026-09-11
agent: antigravity
tags: [architecture, telemetry, tracing, ai, agent]
milestone: v2.0.0
blocked_by: []
related: []
---

# Agent-ready structured tracing and Mermaid sequence diagram export

Introduce an in-memory ring-buffer (`capture: N`) for component lifecycle transitions, property changes, binding dispatches, and MsgMesh events without heavy visual UI bloat. Provide `trace.toMermaid()` sequence diagram generation and `trace.toJSON()` formatted exports to give AI coding assistants and headless test runners instant causal context during troubleshooting.
