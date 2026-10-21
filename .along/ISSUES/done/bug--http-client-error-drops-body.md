---
protocol: along
protocol_version: "4.5.1"
slug: http-client-error-drops-body
type: bug
status: done
completed: 2026-10-21
priority: high
created: 2026-10-21
updated: 2026-10-21
agent: claude-code
tags: [net, i18n]
parent: feat--ui-i18n-foundation
blocked_by: []
related: []
---

# HttpClientError drops parsed response body; expose errorCode and details

## Problem
Child of the mempart umbrella `feat--ui-i18n-foundation` (architecture: mempart ADR `ui-i18n-architecture`).
The mempart webapp localizes API errors by the server's machine code (`errorCode` in the JSON body).
Today that code never reaches the client:

- `HttpClientError.create` (`src/net/httpClientError.ts:41-90`) reads and parses the response body into
  `details` and passes it as `options.cause`, but the constructor (`:30-39`) calls `super(message)` without
  `{ cause }` and stores neither `cause` nor the body. The parsed body is lost.
- The only surviving server information is `message`, built as `` `${json.detail || json.message || json.error} (HTTP_STATUS_<n>)` ``.
  Consumers (mempart `config/errorResolver.ts`) therefore show raw English server text to users.
- `IApiErrorOptions<TDetails>` already declares `cause?: TDetails` and the class is generic in `TDetails`,
  but the value is never exposed.

Depends on: nothing (wave 1, parallel with the other wave 1 issues).
Unblocks: mempart `feat--webapp-error-localization`.

## Requirements
1. `HttpClientError` keeps the parsed body and exposes it:
   - `super(message, { cause: options.cause })` (same as `HttpNetworkError` at `:125`).
   - `readonly details?: TDetails` - the parsed JSON body (or the raw text when not JSON).
   - `readonly code?: string` - `details.errorCode` when the body is an object with a string `errorCode`
     (no other field names; keep it generic: "server-provided machine code").
   - `readonly params?: Readonly<Record<string, string | number>>` - `details.params` when it is a plain object.
   - Add the three fields to `IApiErrorOptions` so `new HttpClientError(...)` callers (`request.ts:123`
     `CONTENT_TYPE_MISMATCH`) can set them; `create` fills them from the body.
2. Keep `message`, `name` (`HTTP_STATUS_<n>` / `API_ERROR_INTERNAL_ERROR` / `CONTENT_TYPE_MISMATCH`), `status`,
   `request`, `response` unchanged - existing consumers and the test at `tests/httpClientError.test.ts:128`
   (`message` contains the server text) rely on them. Document that `message` is diagnostic text, not UI text.
3. Serialization safety: `toAppError` (`src/appDomain/util.ts`) recurses into `err.cause`. Verify it handles a
   plain-object cause and `undefined` (add a guard if `toAppError(undefined)` would throw), so routing an
   `HttpClientError` through `APP.ERROR` / `MSGBUS.ERROR` cannot crash. Copy `code` / `status` into the produced
   `AppError` (`type` or `properties`) only if `AppError` has a fitting field; do not widen public types
   without need.
4. `httpClient.ts` re-wraps errors (`:201-245`): make sure an `HttpClientError` passes through with `code`,
   `params`, `details` intact (no re-construction that drops them).
5. Docs: update the HttpClient section in `AGENTS.md` / `docs/` (where `HttpClientError` is described) with the
   new fields and the rule "UI text comes from `code`, not `message`". Bump nothing manually; versioning follows
   the mempart `version:sync` flow.

## Tests (`tests/httpClientError.test.ts`, vitest)
- 400 with JSON body `{ error: 'x', errorCode: 'VALIDATION_FAILED', params: { field: 'url' } }` ->
  `code === 'VALIDATION_FAILED'`, `params.field === 'url'`, `details` equals the body, `cause` equals the body.
- 500 with a non-JSON body -> `details` is the text, `code` undefined.
- 404 with an empty body -> `details`/`code` undefined, `message` unchanged from today.
- Existing tests keep passing (`message` still contains the server text).
- `toAppError(httpClientError)` does not throw and keeps `message`/`name`.
- Run `pnpm run typecheck`, `pnpm run test`, `pnpm run lint` in the submodule.

## Acceptance Criteria
- [x] `HttpClientError` exposes `details`, `code`, `params` and sets `cause`
- [x] `create` fills them from JSON bodies; non-JSON and empty bodies handled
- [x] `httpClient.ts` preserves the fields when rethrowing; `toAppError` safe with object/undefined cause
- [x] `message`/`name`/`status` behaviour unchanged; docs updated
- [x] Automated tests passing
