---
slug: livestore-reactive-dashboard-widgets
type: feat
status: open
priority: medium
created: 2026-08-27
updated: 2026-08-27
---

# LiveStore reactive query integration and real-time dashboard components

- Related: `@actdim/msgmesh/.agents/ISSUES/feat--livestore-event-sourcing-adapter.md`, `@actdim/msgmesh/.agents/ISSUES/feat--analytics-and-telemetry-product.md`

## Context

With MsgMesh events feeding into LiveStore (reactive SQLite/event log), Dynstruct can provide first-class component models and hooks (`useLiveQuery`, `useEventMetrics`) that bind reactive store queries directly to component props.

## Requirements

- Provide hook/component primitives to subscribe Dynstruct components to LiveStore reactive queries.
- Build ready-to-use real-time dashboard widgets (MetricCards, LatencySparkline, EventLogViewer, FunnelProgress).
- Ensure seamless reactivity with MobX/React without manual `useEffect` polling or forced re-renders.
- Provide cross-link and sample storybook demo for real-time live metrics.
