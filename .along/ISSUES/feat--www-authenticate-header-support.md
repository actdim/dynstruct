---
protocol: along
slug: www-authenticate-header-support
type: feat
status: open
priority: medium
created: 2026-08-13
updated: 2026-08-13
agent: antigravity
tags: []
milestone: v2.0.0-along-transition
blocked_by: []
related: []
---

# Support WWW-Authenticate response header in SecurityService

Add parsing and handling of server `WWW-Authenticate` headers (e.g. `Bearer`, `Digest`, `Basic`) in `SecurityService.applyAuth` to handle challenge-response authentication.

- Source: [`src/services/react/SecurityService.tsx:L510`](file:///d:/Src/my/actdim/public/dynstruct/src/services/react/SecurityService.tsx#L510)
