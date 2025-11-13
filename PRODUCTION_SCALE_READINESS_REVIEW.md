# Goldsainte Client Readiness Assessment

This update reflects the remediation work completed to bring the Goldsainte client closer to a production posture that can sustain ~2M monthly users. The focus areas below describe the hardened implementation and any follow-on items that remain for the platform team.

## Executive summary

* **End-to-end CSRF coverage is now in place.** All authenticated HTTP requests, including session bootstrap, presence heartbeats, and feed fetching, flow through a shared client that automatically attaches the server-issued CSRF token and retries 419 responses. Session sync failures are surfaced to Sentry and trigger a forced sign-out after repeated errors to prevent silent desynchronisation.【F:src/lib/http/client.ts†L1-L120】【F:src/lib/auth/session-service.ts†L1-L89】
* **Presence writes no longer touch public tables directly.** The browser posts to dedicated heartbeat/status endpoints, consumes optional server-side streams, and falls back to throttled polling so that users cannot spoof presence or spam shared tables from the client. Supabase presence broadcasts have been removed.【F:src/lib/realtime/presence-service.ts†L1-L123】【F:src/hooks/usePresence.ts†L1-L212】
* **The journeys feed is backed by a single paginated API.** Client fan-out and console logging were removed; requests use abort controllers to avoid duplicate work, and pagination now piggybacks on the consolidated backend endpoint.【F:src/lib/data/posts.ts†L1-L91】【F:src/pages/TravelFeed.tsx†L169-L260】
* **Observability tooling respects sampling and opt-in.** Session replay, rage-click listeners, and memory polling are gated behind environment flags and sampling rates, reducing per-session overhead while preserving diagnostics for opted-in users.【F:src/main.tsx†L1-L76】【F:src/lib/monitoring/session-replay.ts†L1-L120】
* **Routing has been modularised.** Route groups live in `src/routes`, each wrapped in a per-section Sentry error boundary with Suspense fallbacks, while the app shell focuses on global layout, onboarding, and CSRF bootstrapping.【F:src/routes/AppRoutes.tsx†L1-L220】【F:src/routes/Layouts.tsx†L1-L24】【F:src/App.tsx†L1-L147】

## Security & session management

* The shared HTTP client merges CSRF headers, includes credentials, retries transient failures (including 419), and captures telemetry for diagnostics.
* `loadSessionFromServer` and `pushSessionToServer` now use the client helper, ensuring CSRF tokens accompany every privileged request and retry policies protect against transient failures.
* The auth context tracks consecutive bootstrap failures and forces a logout with user messaging once the retry budget is exhausted, preventing silent broken sessions.【F:src/contexts/AuthContext.tsx†L1-L120】

**Follow-up:** Confirm the backend validates the `X-CSRF-Token` header on `/api/auth/session` and `/api/presence/*`, and ensure infrastructure rotates the CSRF secret alongside other credentials.

## Real-time & data fetching

* Presence heartbeats, offline marks, and snapshot retrievals now rely on authenticated REST endpoints. Optional SSE streams can be enabled through `VITE_PRESENCE_STREAM_ENDPOINT`, while periodic polling keeps roster data fresh when streaming is unavailable.
* Travel feed loading issues a single paginated request per view, cancels prior calls when navigating, and records failures through Sentry. Pagination reuses the same helper to avoid redundant Supabase fan-out.
* Notification consumption remains rate-limited via the existing queueing logic, protecting the UI thread from toast storms.【F:src/hooks/useRealtimeNotifications.ts†L1-L104】

**Follow-up:** Implement server-side rate limits for the heartbeat endpoints and consider fan-out via SSE or WebSocket proxies to keep bandwidth predictable as concurrency rises.

## Observability & performance overhead

* Session replay and rage/dead-click listeners require both an environment flag and an opt-in signal, dramatically reducing default sampling in production.
* Memory monitoring is sampled and clears automatically, preventing indefinite polling for every user session.
* Section-level error boundaries isolate faults so a failure in an admin page no longer blanks the entire SPA.

**Follow-up:** Extend structured logging to include feature flags and release identifiers per route boundary to aid large-scale incident response.

## Application architecture

* Routing logic and lazy imports now live under `src/routes`, keeping the primary app shell focused on layout orchestration and cross-cutting concerns.
* Per-route Suspense and Sentry boundaries provide isolation between marketing, auth, member, and admin surfaces, supporting independent rollout and error handling.

**Follow-up:** Monitor bundle sizes for each route group and introduce route-level preloading hints once analytics identify the heaviest surfaces.

With these changes the client is materially closer to production readiness. Remaining work centres on server-side enforcement (rate limits, CSRF validation) and ongoing observability refinements, which should be prioritised ahead of a 2M-user launch.
