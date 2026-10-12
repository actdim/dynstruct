---
protocol: along
slug: nested-react-nodes-proxy-prevention
type: bug
status: superseded
completed: 2026-10-11
priority: high
created: 2026-10-10
updated: 2026-10-11
parent: bug--fix-dynstruct-runtime-errors-and-history-api
tags: [core, proxy, react19]
superseded_by: feat--react-values-in-ref-props
agent: antigravity
blocked_by: []
related: []
---

# Prevent MobX deep proxying of nested React elements

Recursively check plain objects in `isReactNodeValue` so nested React elements inside props like `slotProps` are not converted to MobX proxies, preventing `_debugTask.run` illegal receiver errors in React 19 DEV mode.
