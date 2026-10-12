---
protocol: along
protocol_version: "4.4.10"
slug: stories-lint
type: debt
status: done
completed: 2026-10-12
priority: medium
created: 2026-10-12
updated: 2026-10-12
agent: claude-code
parent: task--leftovers-after-params-semantics
tags: []
blocked_by: []
related: []
---

# Fix eslint errors in src/_stories (a11y, unescaped entities)

After the eslint config repair `pnpm lint` reported 15 pre-existing errors in `src/_stories`:
`<a onClick>` used as buttons in `ErrorOverlay.tsx` (anchor-is-valid, click-events-have-key-events,
no-static-element-interactions), `<img>` without `alt` in `AvatarView.tsx`, labels without a control in
`LoginDialog.tsx`, unescaped `"` in `Page.tsx` and `SecurityServiceExample.tsx`.

Fixes: link-styled `<button type="button">`, `alt="avatar"`, `htmlFor` / `id` derived from `c.id`, `&quot;`.

## Acceptance Criteria
- [x] `pnpm lint`: 0 errors (379 warnings remain - existing backlog, mostly `prefer-const` / `consistent-type-imports`
      / `no-unused-vars`)
- [x] `tsc -b` clean
- [x] Automated tests passing
