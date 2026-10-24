---
protocol: along
protocol_version: "4.5.3"
slug: empty-response-body
type: bug
status: done
completed: 2026-10-24
priority: high
created: 2026-10-24
updated: 2026-10-24
agent: claude-code
tags: [http]
milestone: v2.0.0
parent: feat--admin-impersonation
blocked_by: []
related: []
---

# HttpClient fails on 204 / empty responses (parses an empty body as JSON)

Found while verifying mempart `bug--feed-deletion-rules-and-ui` in the browser: `DELETE /api/v1/feed/:id` answered
204 and the client reported an error. `getResponseResult` falls back to the requested content type when the response
has none, so a bodiless 204 is read with `response.json()`, which throws on an empty body. Every void endpoint is
affected.

## Requirements
- REQ-1: A response without a body (204, 205, 304, or `Content-Length: 0`) resolves to `undefined` without reading it
  and without a content-type check.

## Acceptance Criteria
- [x] A 204 response to a JSON request resolves to undefined
- [x] JSON responses are still parsed
- [x] Automated tests passing (tests/responseResult.test.ts)
