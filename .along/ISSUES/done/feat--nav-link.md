---
protocol: along
protocol_version: "4.5.3"
slug: nav-link
type: feat
status: done
completed: 2026-10-24
priority: high
created: 2026-10-24
updated: 2026-10-24
agent: claude-code
tags: [navigation]
milestone: v2.0.0
parent: feat--nav-links-middle-click
blocked_by: []
related: [bug--nav-service-location-sync]
---

# NavLink and link click helpers: route controls render real links

Child of the mempart issue `feat--nav-links-middle-click`. Navigation controls were buttons sending `APP.NAV.GOTO`,
so middle-click, Ctrl/Cmd+click and "open in new tab" did nothing. No link primitive existed.

## Requirements
- REQ-1: `isPlainLeftClick(event)` and `isAppHref(href)` (pure, `appDomain/navigation`).
- REQ-2: `createNavLinkClick(msgBus, href, options)` returns an anchor click handler: a plain left click on an app href
  calls `preventDefault` and sends `APP.NAV.GOTO {url, replace?, state?}`; modified, middle, new-tab and external
  clicks fall through to the browser.
- REQ-3: `NavLink` (`useNavLink`) renders `<a href>` with that handler.

## Acceptance Criteria
- [x] Plain click sends one GOTO and prevents default; Ctrl/Meta/Shift/middle clicks and external hrefs do not
- [x] `NavLink` renders `<a href>`
- [x] Automated tests passing (tests/react/nav-link.test.tsx)
