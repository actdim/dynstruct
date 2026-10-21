---
protocol: along
protocol_version: "4.5.0"
slug: http-2xx-response-promise-throw
type: bug
status: done
completed: 2026-10-20
priority: high
created: 2026-10-20
updated: 2026-10-20
agent: claude-code
tags: [net, httpClient]
blocked_by: []
related: []
parent: bug--intake-submit-and-url-resolution
---

# getResponseResult throws a Promise and rejects non-200/204 2xx responses

`getResponseResult` (`src/net/request.ts`) ends with:

```ts
if (!(response.status === httpStatus.OK || response.status === httpStatus.NO_CONTENT)) {
    throw HttpClientError.create(response, request);
}
```

Two defects:

1. `HttpClientError.create` is `async`, so the thrown value is a `Promise`, not an error.
   msgmesh then reports `Error: [object Promise]` and `APP.ERROR` carries `"{}"`.
2. Any 2xx besides 200/204 (e.g. `201 Created`) is treated as a failure, although
   `HttpClientError.create` itself returns `null` for 2xx. Every successful
   `POST /api/v1/intake` (201) in mempart fails on the client this way.

## Acceptance Criteria
- [x] Non-2xx status throws an awaited `HttpClientError` (via `HttpClientError.assert`)
- [x] Any 2xx status (200, 201, 202, 204) returns the parsed result
- [x] Unit test covers 201 JSON response and a 4xx response
- [x] Automated tests passing
