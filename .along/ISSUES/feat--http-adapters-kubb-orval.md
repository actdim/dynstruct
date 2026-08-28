---
protocol: along
slug: http-adapters-kubb-orval
type: feat
status: open
priority: medium
created: 2026-08-28
updated: 2026-08-28
agent: antigravity
tags: [dynstruct, http-client, kubb, orval, api, adapters]
milestone: v2.0.0-along-transition
blocked_by: []
related: []
---

# Adapt dynstruct HttpClient for Kubb and Orval Generators

## Overview

`@actdim/dynstruct` provides `HttpClient` (`src/net/httpClient.ts`) that manages:
- Integration with `MsgBus` for authentication tokens (`$AUTH_APPLY`), configuration reloads (`$CONFIG_CHANGED`, `$CONFIG_GET`), and error routing.
- Standardized request lifecycle and normalized error processing (`HttpClientError`).
- Integration contracts specifically aligned with NSwag-generated TypeScript API client classes.

However, modern generators like **Kubb** and **Orval** generate functional API clients and expect custom fetcher / custom instance adapter functions rather than NSwag-style class wrappers.

## Goal

Create adapter interfaces and wrappers around `dynstruct`'s `HttpClient` that allow Kubb- and Orval-generated clients to execute HTTP requests through `HttpClient` to gain:
1. Automatic `MsgBus` auth token injection and refresh.
2. Centralized request error handling, status mapping, and event bus propagation.
3. Dynamic base URL and configuration management via `MsgBus`.

## Scope & Requirements

1. **Research & Signatures Definition**:
   - Inspect custom instance contract for Orval (e.g. `customInstance<T>(config: RequestConfig): Promise<T>`).
   - Inspect custom client contract for Kubb (e.g. `client<TData, TError, TVariables>(options: ClientOptions): Promise<Response<TData>>`).
2. **Adapter Implementation in `@actdim/dynstruct/net`**:
   - Provide factory functions (e.g. `createOrvalHttpAdapter(httpClient)`, `createKubbHttpAdapter(httpClient)`) that wrap `HttpClient.request` into the expected functional signatures.
   - Forward cancellation (`AbortSignal`), headers, query parameters, body serialization, and error transformations.
3. **Tests & Documentation**:
   - Add unit tests verifying functional client execution through the adapter with mocked responses and error scenarios.
   - Document usage in `@actdim/dynstruct` README / docs for both Kubb and Orval code generation workflows.

