# Goldsainte web client — production scale gap analysis

This document captures a comprehensive end-to-end review of the current Goldsainte web client with a focus on whether the implementation can safely support ~2M monthly active users. The assessment covers authentication, security, data access, real-time features, observability, performance, and delivery workflows. Findings are grouped by severity so the product and platform teams can prioritise remediation work.

## Methodology
* Reviewed application shell initialisation, routing, and layout orchestration (`src/main.tsx`, `src/App.tsx`).
* Analysed session management, CSRF handling, HTTP client utilities, and Supabase integrations (`src/contexts/AuthContext.tsx`, `src/lib/auth/session-service.ts`, `src/lib/security/csrf.ts`, `src/lib/http/client.ts`).
* Audited real-time/presence features, notifications, and data fetching for the primary feed (`src/lib/realtime/presence-service.ts`, `src/hooks/usePresence.ts`, `src/hooks/useRealtimeNotifications.ts`, `src/lib/data/posts.ts`, `src/pages/TravelFeed.tsx`).
* Surveyed routing surface area and supporting utilities to understand bundle shape and cross-cutting concerns (`src/routes/AppRoutes.tsx`, `src/hooks/useActivityLogger.ts`, `package.json`).

## Strengths already in place
* Shared HTTP client automatically attaches CSRF headers, retries transient failures, and captures Sentry telemetry so privileged requests have consistent protection.【F:src/lib/http/client.ts†L1-L135】
* Session bootstrap pulls tokens from a server endpoint and hydrates Supabase in-memory storage, avoiding direct refresh token storage in `localStorage`. Failures are surfaced to users and Sentry for visibility.【F:src/contexts/AuthContext.tsx†L21-L137】【F:src/lib/auth/session-service.ts†L1-L87】
* The SPA shell samples expensive diagnostics features (session replay, rage/dead-click listeners, memory monitoring) behind feature flags and randomised opt-in, reducing default overhead for the majority of users.【F:src/main.tsx†L16-L91】

## Critical blockers before targeting 2M users
1. **Backend session and CSRF dependencies are assumed but not enforced.** The client requires `/api/auth/session`, `/api/csrf-token`, and `/api/presence/*` endpoints with CSRF validation, retry-aware semantics, and SSE support. Without hardened, rate-limited services backing these routes, the app will fail to bootstrap sessions, lose CSRF coverage, or spam the presence API under load.【F:src/lib/auth/session-service.ts†L9-L87】【F:src/lib/security/csrf.ts†L1-L96】【F:src/lib/realtime/presence-service.ts†L11-L146】
2. **Presence polling still issues per-user minute traffic.** Even with heartbeats stretched to two minutes, the hook polls the roster every 60 seconds and posts visibility changes on focus/blur. At 2M users this translates to ~33k requests/second sustained and spikes on visibility changes, overwhelming any REST-backed presence service unless backed by edge caching or streaming by default.【F:src/hooks/usePresence.ts†L24-L199】
3. **Real-time notifications open dedicated Supabase channels per user.** Every authenticated session subscribes to `notifications:{userId}` without server-side fan-out or topic multiplexing. Scaling to millions of users will exceed Supabase real-time limits and creates an uncontrolled notification flood if spammers target the `notifications` table.【F:src/hooks/useRealtimeNotifications.ts†L14-L102】

## High-risk gaps to resolve
* **Feed fetching lacks caching or backpressure.** `TravelFeed` drives its own fetch + pagination via imperative state, abort controllers, and `window` scroll listeners. There is no React Query cache, request deduplication, or stale-while-revalidate strategy, so fast navigation or multiple open tabs will repeatedly fetch entire pages and recompute layout, increasing latency and backend load.【F:src/pages/TravelFeed.tsx†L40-L260】【F:src/lib/data/posts.ts†L1-L91】
* **Console logging still emits sensitive auth failures.** Session bootstrap logs raw Supabase errors to `console.error`, which will leak tokens or stack traces in production consoles shared with end users. Replace with structured Sentry reporting and redacted UI messaging only.【F:src/contexts/AuthContext.tsx†L83-L115】
* **Activity logging invokes an edge function per action with no batching or circuit breaker.** Each login logs via `supabase.functions.invoke('log-activity')` and prints failures to the console. Under heavy sign-in volume this becomes a synchronous dependency for auth and risks cascading outages if the function rate limits.【F:src/hooks/useActivityLogger.ts†L1-L26】
* **Route surface area remains monolithic.** `AppRoutes.tsx` declares hundreds of lazy imports in a single file. While the components load lazily, the generated bundle still tracks a massive route map, complicating prefetching and increasing the risk that a single bad import (or translation error) impacts the entire route table. Consider splitting by domain and preloading only the hot paths for logged-in members.【F:src/routes/AppRoutes.tsx†L1-L200】

## Medium-priority concerns
* **Presence stream fallback silently disables roster updates.** If `VITE_PRESENCE_STREAM_ENDPOINT` is absent or EventSource unsupported, the hook simply returns without substituting a websocket or long-poll fallback, leaving users reliant on the heavy 60-second polling noted above.【F:src/lib/realtime/presence-service.ts†L96-L145】
* **Notification toasts rely on client-side throttling only.** Queue trimming and timers prevent UI spam, but there is no enforcement server-side, nor acknowledgement back-pressure, so malicious actors can still enqueue bursts faster than clients flush them.【F:src/hooks/useRealtimeNotifications.ts†L23-L79】
* **Dependency footprint is large with no production test harness.** The project lists 80+ runtime packages and lacks any unit/integration test scripts beyond linting. Scaling to 2M users requires automated regression coverage and dependency review to avoid shipping exploitable vulnerabilities or regressions unnoticed.【F:package.json†L6-L105】

## Recommended next steps
1. **Back the client contracts with production-ready services.** Implement authenticated, rate-limited CSRF, session-sync, and presence endpoints that validate tokens server-side and stream roster updates by default to eliminate the minute-level polling storm.
2. **Rework real-time surfaces for multi-tenant scale.** Move presence and notification fan-out to a dedicated service (e.g., WebSocket/SSE broker or Supabase Edge function) with shard-aware channels, rate limits, and exponential backoff built in.
3. **Adopt data-fetching infrastructure.** Migrate feed fetching to React Query or SWR with cache keys, pagination cursors, and optimistic updates so that revisiting the feed does not hammer the API.
4. **Harden observability and error hygiene.** Replace remaining `console.error` calls with redacted logs, ensure Sentry scrubs PII, and add route-scoped error boundaries for the largest surfaces.
5. **Invest in automated testing and load validation.** Add unit tests for auth/session flows, end-to-end smoke tests for feed/presence, and execute load tests against the new presence/notification services before opening the gates to 2M users.

Resolving the blockers and high-risk gaps above is essential to avoid catastrophic failures under scale. Once backend contracts are hardened, client polling reduced, and data fetching stabilised, the application will be significantly closer to serving millions of users reliably.
