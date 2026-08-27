---
protocol: along
slug: business-telemetry-declarations
type: feat
status: open
priority: medium
created: 2026-08-27
updated: 2026-08-27
agent: antigravity
tags: []
milestone: v2.0.0-along-transition
blocked_by: []
related: []
---

# Declarative telemetry & analytics annotations in component structures

- Related: `@actdim/msgmesh/.agents/ISSUES/feat--middleware-and-metrics.md`, `@actdim/msgmesh/.agents/ISSUES/feat--analytics-and-telemetry-product.md`

## Context

To make product analytics completely declarative, Dynstruct can allow components to optionally declare telemetry annotations on their actions, events, and message broker channels (e.g. `telemetry: { eventName: 'ItemFavorited', trackDuration: true }`).

## Requirements

- Add optional `telemetry` schema metadata in `ComponentStruct` / `ComponentDef` action definitions.
- Automatically enrich outgoing message bus envelopes with component metadata (component ID, component type `regType`, action name).
- Enable seamless forwarding to telemetry sinks (Mixpanel, PostHog, OTel) without manual tracking code in view/handlers.
