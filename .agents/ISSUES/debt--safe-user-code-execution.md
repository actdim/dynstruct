---
slug: safe-user-code-execution
type: debt
status: open
priority: high
created: 2026-08-13
updated: 2026-08-13
---
# Ensure user code execution is properly handled across all boundaries

Ensure all user code calls across framework boundaries (lifecycle hooks, event listeners, binding getters/setters, actions, effects) are safely wrapped with `runSafe` / `onCatch` error boundary handling.

- Source: [`src/componentModel/core.tsx:L948`](file:///d:/Src/my/actdim/public/dynstruct/src/componentModel/core.tsx#L948)
