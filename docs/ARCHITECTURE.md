# Goldsainte — Architecture

> Single source of truth for the Goldsainte codebase. New contributors (human or AI) should be able to read this document end-to-end and understand the system without opening source files. Pair with [`AI_CONTEXT_PRIMER.md`](./AI_CONTEXT_PRIMER.md) for a 200-word ramp-up.

---

## 1. Project Overview

Goldsainte is a luxury travel marketplace that connects three audiences: high-intent **travelers**, **TikTok-native creators** who publish trips and digital travel guides, and **certified travel agents** who deliver bespoke itineraries. The platform combines an editorial discovery surface (storyboards, packaged trips, bundles) with a transactional layer (Stripe Checkout, Stripe Connect payouts, escrowed milestone payments) — Condé Nast Traveler on the front, Shopify-for-trips on the back.

| | |
|---|---|
| **Live site** | https://goldsainte.ai |
| **Preview** | https://goldsainteai.lovable.app |
| **Sender domain** | `goldsainte.com` (Resend-verified) |
| **Marketplace model** | Travelers ↔ Creators ↔ Agents (3-sided) |
| **Hosting** | Lovable Cloud + Supabase managed Postgres |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5, Tailwind CSS v3, shadcn/ui, framer-motion |
| Backend | Supabase (Postgres 15, Auth, Edge Functions on Deno, Storage, Realtime) |
| Payments | Stripe Checkout, Stripe Connect (creator/agent payouts), Stripe Identity (KYC) |
| Email | Resend (sender `goldsainte.com`), PGMQ queue + pg_cron dispatcher, React Email templates |
| Monitoring | Sentry (errors + session replay + perf), structured edge logs |
| AI | OpenAI GPT-4o (canonical) — see AI mandate. Anthropic available where explicitly used. |
| SMS | Twilio Verify — **notifications only**, not auth |
| Maps / Places | Mapbox (`VITE_MAPBOX_PUBLIC_TOKEN`), Google Places (`VITE_GOOGLE_PLACES_API_KEY`), Google Maps (`VITE_GOOGLE_MAPS_API_KEY`) |
| Travel data | Amadeus (flights), Hotelbeds, Booking.com Rapid, Viator, Expedia affiliate, Unsplash (imagery) |
| Identity / Auth federations | Google OAuth, Apple Sign-In |

---

## 3. Brand & Design System

Aesthetic: **luxury editorial**. Cream surfaces, deep forest CTAs, gold accents, serif headings. No emojis, no Tailwind default brights (no emerald/amber/indigo badges).

### Palette

| Token | Hex | Use |
|---|---|---|
| Forest green (primary) | `#0c4d47` | Primary CTAs, brand voice |
| Dark navy / ink | `#0a2225` | Headings, body text |
| Gold | `#C7A962` | Accents, hairlines, badges |
| Cream | `#FDF9F0`, `#FDFBF5`, `#F6F0E4`, `#f7f3ea` | Page + surface backgrounds |
| Border | `#E5DFC6` | Card / input borders |

All colors live as HSL tokens in `src/index.css` and `tailwind.config.ts`. **Never hard-code Tailwind palette classes** (`bg-emerald-500`, `text-purple-600`, etc.) — use semantic tokens.

### Typography

- Headings: **Cormorant Garamond** (`font-secondary`)
- Body: **Inter**
- Never serif body, never sans headings on marketing surfaces.

### Component conventions

- Primary CTAs: `rounded-full bg-[#0c4d47] text-white`
- Cards / surfaces: `rounded-2xl border border-[#E5DFC6] bg-[#FDFBF5]`
- Inputs: `rounded-xl`
- Listing cards: **4:3 aspect ratio**, metadata below image (no heavy overlays)
- Icons: **`lucide-react` only** — no emoji, no Heroicons mix
- Layout: `min-h-screen flex-col` with `flex-1` content and `mt-auto` footer

### Copy lexicon (enforced)

- "Services" — not "Packages"
- "Request a Trip" — not "Book Now"
- "Storyboards" — not "Listings"
- Platform-curated voice: "Goldsainte Concierge"

---

## 4. User Types & Auth

Three roles, stored in `profiles.account_type`: **`traveler`**, **`creator`**, **`agent`**. `account_type` drives **all** post-auth routing — see `src/lib/auth/postAuthRouting.ts`.

### Auth methods

- Email + password
- Google OAuth
- Apple Sign-In (where enabled)

**Phone signup was tried and removed** (Twilio config complexity, low ROI at launch). The `profiles.phone` column is retained for outbound SMS notifications via Twilio Verify only. The `phone_exists` RPC was dropped with the rollback.

### Role-specific onboarding

- Travelers: streamlined hub at `/traveler` post-role-selection.
- Creators: 5-step `/onboarding/creator`, gated trip publishing behind Stripe Connect completion.
- Agents: formal application at `/apply/agent` (6 steps) with mandatory **Stripe Identity** KYC. Auth accounts are **created only after admin approval** — see `mem://integrations/auth-account-creation-post-approval-only`.

---

## 5. Database Architecture

All tables live in `public` unless noted. RLS is enabled on every user-facing table; complex policies use `SECURITY DEFINER` helper functions (e.g. `has_role`) to avoid recursion.

| Table | Purpose | Key relationships |
|---|---|---|
| `profiles` | One row per `auth.users` row. `account_type`, `username`, `creator_tier`, `phone`, Stripe Connect / Identity IDs. | `id` → `auth.users.id` (1:1) |
| `user_roles` | Authoritative role table (`admin`, `moderator`, `user`). **Never** store roles on `profiles`. | `user_id` → `auth.users.id` |
| `packaged_trips` | Creator/agent-published trips. JSONB itinerary, pricing, cover. | `creator_id` → `profiles.id` |
| `trip_requests` | Marketplace board where travelers post trip briefs (open). | `traveler_id` → `profiles.id` |
| `trip_proposals` | Bids from creators/agents against a `trip_request`. Lifecycle timestamps for `withdrawn`/`accepted`/`declined`. | `request_id`, `proposer_id` |
| `trip_bookings` | Direct bookings against `packaged_trips` (no proposal flow). | `trip_id`, `traveler_id` |
| `itinerary_products` | Digital travel guides sold standalone. | `creator_id` |
| `product_bundles` | Multi-product offerings (trip + guide + service). | composed via join table |
| `creator_services` | Custom human-delivered services: `custom_itinerary`, `full_trip_design`, `add_on`. | `creator_id` |
| `itinerary_purchases` | Digital guide purchase ledger. | `buyer_id`, `product_id` |
| `bundle_purchases` | Atomic bundle purchase ledger (see `create_bundle_purchase` RPC). | `buyer_id`, `bundle_id` |
| `storyboards` + `storyboard_sections` + `storyboard_collaborators` | Pinterest-style trip composition with repin attribution. | `owner_id`, `parent_storyboard_id` |
| `creator_tiers` + `creator_tier_memberships` | Bronze/Silver/Gold/Platinum tier definitions and assignments. | `creator_id` |
| `tier_progress_metrics` | Cached counters that feed tier evaluation. Mirrored to `profiles.creator_tier` for read perf. | `creator_id` |
| `reserved_usernames` | 48 squat-prevented handles enforced via trigger. | — |
| `view_dedup` | DB-backed view de-duplication (replaces in-memory). | `(entity, viewer_hash)` |
| `webhook_events` | Idempotency ledger for inbound webhooks (Stripe, others). UNIQUE on `event_id`. | — |
| `affiliate_clicks` + `affiliate_links` | Affiliate referral system with 30-day attribution. | `ref_code` |
| `email_send_log` | Append-only email audit (`pending` → `sent`/`failed`/`dlq`). | `message_id` |
| `email_send_state` | Single-row tunables: `batch_size`, `send_delay_ms`, TTLs. | — |
| `suppressed_emails` | Bounces / complaints / unsubscribes. Append-only. | — |
| `email_unsubscribe_tokens` | One token per email for one-click unsubscribe. | — |
| `email_infra_alerts` | Open/resolved infra breach ledger. | `alert_key` |
| `application_audit_log` | Immutable record of admin/system application decisions. | — |
| `pgmq.q_transactional_emails` | PGMQ queue for the new email pipeline. | — |
| `pgmq.q_auth_emails` | Higher-priority queue, drained first. | — |

---

## 6. Critical Database Functions (RPCs)

| Function | Purpose |
|---|---|
| `handle_new_user()` | `AFTER INSERT` trigger on `auth.users`. Creates `profiles` row, generates unique username (auto-suffix on collision), wrapped in `EXCEPTION` block for graceful failure. **Only writer** of `profiles` on signup. |
| `enforce_reserved_username()` | Trigger that blocks insert/update if `username` ∈ `reserved_usernames`. |
| `create_bundle_purchase(...)` | Atomic transaction that writes `bundle_purchases` and child `itinerary_purchases` together — prevents partial state on bundle checkout. |
| `track_view_atomic(...)` | DB-backed view dedup; idempotent on `(entity, viewer_hash, window)`. |
| `update_creator_tier()` | Auto-promotes creators when `lifetime_sales_count` crosses a tier threshold. |
| `has_role(_user_id, _role)` | `SECURITY DEFINER` role check used in RLS policies to avoid recursion. |
| `email_infra_cron_last_run()` | Health probe consumed by `email-infra-monitor`. |
| `email_infra_queue_depth()` | Sums depth across PGMQ queues. |
| `admin_list_email_dlq`, `admin_replay_email_dlq`, `admin_purge_email_dlq` | Admin tooling for the email dead-letter queue. |
| `enqueue_email(...)` | Inserts a render-ready payload into the appropriate PGMQ queue. |

> `phone_exists` was **removed** with the phone-signup rollback. Do not reintroduce.

---

## 7. Authentication Flow

### Email + password signup

1. User submits `/auth` form → `supabase.auth.signUp({ email, password, options: { data: { account_type } } })`.
2. Supabase inserts into `auth.users` → trigger `handle_new_user()` fires → row created in `profiles` with `account_type` from `raw_user_meta_data`.
3. Browser is redirected to `/auth/callback`.
4. `AuthCallback.tsx` performs a **retry-with-backoff** read against `profiles` (the trigger may not have committed yet on first read). It **never writes** — only reads.
5. Once the profile is found, `postAuthRouting` routes by `account_type` and onboarding completion state.

### Google OAuth

1. Before redirect, the chosen role is stored in `sessionStorage` as `pending_account_type`.
2. Google round-trip → `/auth/callback`.
3. `AuthCallback` retrieves `pending_account_type`. If the profile (created by trigger) lacks `account_type`, **a single update** patches it. Then routes normally.

### Race-condition contract

> **Only the `handle_new_user` trigger creates `profiles` rows. Frontend code MUST NOT insert.** Frontend may only `SELECT` (with retry) and `UPDATE` non-identity fields.

### Returning user / password reset

- Sign-in: `supabase.auth.signInWithPassword`.
- Forgot password: `supabase.auth.resetPasswordForEmail` → branded template at `supabase/templates/recovery.html` and `supabase/templates/confirmation.html`.

### Agent path

Agents do **not** get an auth account on application. `create-approved-account` edge function provisions the account post-admin-approval and post-Stripe Identity success.

---

## 8. Routing Architecture

| Route | Purpose |
|---|---|
| `/` | Marketplace home |
| `/auth` | Sign-in / sign-up (split-layout) |
| `/auth/callback` | OAuth + email confirmation landing |
| `/onboarding/creator` | 5-step creator wizard |
| `/onboarding/brand` | Brand onboarding (where applicable) |
| `/apply/agent` | 6-step agent application + Stripe Identity |
| `/traveler` | Traveler hub |
| `/creator-dashboard` | Creator hub (overview / trips / proposals / earnings / portfolio / settings) |
| `/agent-dashboard` | Agent hub |
| `/marketplace` | Public discovery + search |
| `/trip-requests-board` | Public marketplace of open `trip_requests` |
| `/@:username` | `UsernameRedirect` → role-appropriate profile route |
| `/@:username/shop` | Creator's shareable bio-link storefront |
| `/creators/:id` | Canonical creator public profile |
| `/trip-builder/:id?` | Trip publishing |
| `/itinerary-builder` | Digital guide publishing |
| `/bundle-builder` | Bundle composition |
| `/trip/:id`, `/itinerary-guide/:id`, `/bundle/:id` | Detail pages |
| `/proposals/:id` | 7-step bid workspace |
| `/admin/*` | Admin console (role-gated via `useAdminGuard`) |

Layout shells live in `src/routes/Layouts.tsx`; route-level error containment via `RouteSectionBoundary`.

---

## 9. Payments Architecture

- **Stripe Checkout** — trip bookings, itinerary purchases, bundle purchases.
- **Stripe Connect** — creator/agent payouts. Onboarding gates trip publishing.
- **Stripe Identity** — mandatory KYC for agents and travelers (see `mem://features/stripe-identity-expanded-to-travelers`).

### Commission / fee model

- Marketplace fee: **7% total**, split 3.5% deducted from host + 3.5% added to guest (`mem://finance/marketplace-fee-structure-split`).
- Creator tier commission rates (legacy itinerary/bundle products): Bronze 15%, Silver 12%, Gold 10%, Platinum 8%.

### Webhooks

- Handler: `supabase/functions/stripe-webhook-handler/index.ts`.
- **Every** handler call must wrap mutations in `checkAndRecordWebhook` (`_shared/webhookIdempotency.ts`) — an atomic INSERT into `webhook_events` keyed on `event_id`. Duplicate → skip. DB error → return failure so Stripe retries (better than double-process).
- Bundle purchases delegate to `create_bundle_purchase` RPC for atomicity.
- Self-referral fraud blocked with **three explicit checks** in the webhook (buyer ≠ seller, ref code owner ≠ buyer, IP heuristic).
- Refunds flow: Stripe Dashboard → webhook → DB status update.

### Escrow / milestones

Trip contracts use escrow holds with milestone-based release. See `src/lib/booking/milestones.ts` and `create-escrow-hold` edge function.

---

## 10. Email Infrastructure (Dual System)

Two pipelines exist intentionally. Both must keep working through the migration.

### Legacy pipeline (29+ direct-Resend functions)

- Edge functions call Resend directly via `fetch`.
- All such functions import **`_shared/resend-guard.ts`**, which installs a **global `fetch` wrapper** that filters recipients against `suppressed_emails` before any request reaches Resend's API. This guarantees CAN-SPAM/GDPR suppression compliance even on legacy paths.

### New pipeline (queue-based)

- Senders call `enqueue_email(...)` RPC → row lands in `pgmq.q_transactional_emails` (or `q_auth_emails`, drained first).
- `process-email-queue` edge function runs every **5 seconds** via `pg_cron`, drains in batches (`batch_size`, `send_delay_ms` configurable via `email_send_state`).
- Templates: **22 React Email templates** in `supabase/functions/_shared/transactional-email-templates/` (`registry.ts` maps template keys → components).
- TTLs: auth 15 min, transactional 60 min. Expired → DLQ.
- DLQ admin via `admin_list_email_dlq` / `admin_replay_email_dlq` / `admin_purge_email_dlq`.

### Sender domain

- Resend-verified: **`goldsainte.com`** (web domain is `goldsainte.ai`).
- Alerts from: `Goldsainte Infra <alerts@notify.goldsainte.com>`.

### Monitoring

- `email-infra-monitor` runs every 5 minutes. Checks vault secret presence, cron activity, queue depth (>100), stuck `pending` >10 min, DLQ spike (≥10/hr), `pg_cron` staleness (>60 min).
- **`email-infra-monitor` itself bypasses `resend-guard`** — it must be able to alert when the email system is the thing that's broken.
- Newly-opened breaches → direct Resend send + row in `email_infra_alerts`; recovered checks auto-resolve.

---

## 11. CORS & Security

- **Every edge function** imports `_shared/cors.ts` and uses `resolveAllowedOrigin(req)` / `buildCorsHeaders(req)`. Never set `Access-Control-Allow-Origin: *`.
- Allowlist: `goldsainte.ai`, `www.goldsainte.ai`, `goldsainteai.lovable.app`, any `*.lovable.app`, localhost dev ports. Optional override via `ALLOWED_ORIGIN` env.
- Rate limiting: `_shared/rateLimiter.ts` with DB-backed counters; apply per-endpoint.
- Bot/crawler filtering: `track-view` uses a comprehensive UA regex before counting.
- Username squatting: `reserved_usernames` (48 entries) + `enforce_reserved_username` trigger.
- TikTok embed XSS: `src/components/TikTokEmbed.tsx` uses `document.createElement` + `setAttribute` — **never** `innerHTML` with interpolation.
- Roles: stored in `user_roles`, checked via `has_role()` `SECURITY DEFINER` function. Never check roles client-side from `localStorage`.
- Secrets: server-only keys live in Supabase Vault / function env. Publishable keys (Stripe pk_, Supabase anon) may live in client.

---

## 12. Creator Economy Features

TikTok-shop-style surface area built on top of the marketplace primitives:

- **Shareable storefronts** at `/@:username/shop` (bio-link page).
- **Universal share** via `src/components/ShareButton.tsx` — native Web Share API with modal fallback. Wired into every product card.
- **TikTok video carousel** on creator profiles, lazy-loaded via `IntersectionObserver`. oEmbed proxied through `noembed.com`.
- **Creator tier system** (Bronze/Silver/Gold/Platinum) driven by `lifetime_sales_count`; tier rate cards above.
- **Performance analytics** tab with conversion benchmarking vs. tier cohort.
- **Affiliate referrals** via `?ref=` URL param, captured by `useAffiliateRefCapture`, 30-day TTL in `localStorage`, click tracked to `affiliate_clicks`. Self-referral fraud blocked at attribution time.
- **AI content tools**: `ai-content-tools` edge function — caption generator, hashtag suggester, description rewriter (GPT-4o).
- **Multi-product bundles** with atomic checkout.
- **Behavioral-learning collections** — AI curates against logged behaviors, results cached in DB with 24h TTL.

---

## 13. Critical Files Reference

### Frontend

| File | Role |
|---|---|
| `src/pages/Auth.tsx` | Sign-in / sign-up surface |
| `src/pages/AuthCallback.tsx` | Post-auth routing with retry-with-backoff |
| `src/lib/auth/postAuthRouting.ts` | Role + onboarding → destination resolver |
| `src/components/TikTokEmbed.tsx` | XSS-safe TikTok embed |
| `src/components/ShareButton.tsx` | Universal share component |
| `src/components/onboarding/GettingStartedChecklist.tsx` | Post-signup task list |
| `src/components/HowItWorksTemplate.tsx` | Shared "how it works" surface |
| `src/components/creator/CreatorServicesSection.tsx` | 4-tier creator services storefront |
| `src/components/auth/*` | Auth-related UI components |
| `src/hooks/useUserRole.ts` | Role read hook (queries `user_roles`) |
| `src/integrations/supabase/client.ts` | **Auto-generated, do not edit** |
| `src/integrations/supabase/types.ts` | **Auto-generated DB types, do not edit** |

### Edge functions

| File | Role |
|---|---|
| `supabase/functions/_shared/cors.ts` | Per-request CORS reflection over allowlist |
| `supabase/functions/_shared/rateLimiter.ts` | DB-backed rate limiting |
| `supabase/functions/_shared/resend-guard.ts` | Global suppression filter for legacy email path |
| `supabase/functions/_shared/webhookIdempotency.ts` | Atomic `webhook_events` dedup |
| `supabase/functions/_shared/transactional-email-templates/` | 22 React Email templates + `registry.ts` |
| `supabase/functions/stripe-webhook-handler/index.ts` | Payments processing |
| `supabase/functions/track-view/index.ts` | Analytics view with bot filter |
| `supabase/functions/email-infra-monitor/index.ts` | Email-system health (bypasses guard) |
| `supabase/functions/process-email-queue/index.ts` | PGMQ dispatcher (cron, 5s) |
| `supabase/functions/auth-email-hook/index.ts` | Supabase auth-email webhook → queue |
| `supabase/functions/create-approved-account/index.ts` | Post-approval account provisioning |

---

## 14. Conventions for Contributors

- **Color** — use brand palette tokens, never Tailwind defaults (`emerald-*`, `purple-*`, `amber-*` are banned for product UI).
- **Icons** — `lucide-react` only. No emojis in product UI.
- **Type** — `font-secondary` (Cormorant Garamond) headings; Inter body.
- **CTAs** — primary = `rounded-full bg-[#0c4d47] text-white`.
- **Cards** — `rounded-2xl border border-[#E5DFC6]`.
- **Inputs** — `rounded-xl`.
- **Mobile-first** — use `sm:` / `md:` / `lg:` progressively.
- **Forms** — `touched` + `getError` pattern; inline validation **on blur**.
- **Edge functions** — always import `_shared/cors.ts`; never set CORS headers manually.
- **Legacy email senders** — always import `_shared/resend-guard.ts` before any direct Resend call.
- **Stripe webhooks** — always wrap with `checkAndRecordWebhook`.
- **Profiles** — never insert from frontend; only the `handle_new_user` trigger writes.
- **Roles** — never store on `profiles`; always use `user_roles` + `has_role()`.
- **Microcopy** — "Services" / "Request a Trip" / "Storyboards" (see brand lexicon).
- **AI** — direct OpenAI GPT-4o by default; do not introduce intermediate abstractions.
- **Uploads** — 50MB cap across all uploaders.
- **Sync** — prefer custom-event patterns (e.g. `'storyboard-updated'`) over new global stores.

---

## 15. Known Decisions & Their Rationale

| Decision | Why |
|---|---|
| Removed phone signup, kept `phone` column | Twilio config complexity + low ROI at launch. Column retained for outbound SMS notifications. |
| Two parallel email systems | Gradual migration; legacy path stays safe via `resend-guard` global fetch wrapper while we cut over to PGMQ. |
| `creator_services` separate from `itinerary_products` | Custom services are **human-delivered** and bid-priced; guides are **digital products** with fixed price and instant delivery. |
| Username trigger with auto-suffix | Google OAuth users have no obvious handle; trigger guarantees uniqueness without a UI step. |
| PWA install prompt hidden 14 days on dismiss | Avoid nag fatigue. |
| Guide content **locked** rather than gated | Non-buyers still see the value preview — better conversion than a paywall redirect. |
| `profiles.creator_tier` denormalized from `tier_progress_metrics` | Read perf on every storefront/profile request; updated by `update_creator_tier`. |
| Auth accounts created **post-admin-approval** for agents | Prevents pre-vetted users from appearing in the system. |
| OpenAI GPT-4o only (no Lovable AI Gateway) | Operational control + cost ceiling enforcement. |
| `SECURITY DEFINER` helpers for role checks | Avoids RLS recursion when policies reference dependent tables. |
| 4:3 listing card aspect ratio | Editorial standard; consistent across storyboards, trips, services. |

---

## 16. Environment Variables

### Frontend (`VITE_*`, exposed to the browser)

| Var | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ref |
| `VITE_MAPBOX_PUBLIC_TOKEN` | Mapbox |
| `VITE_GOOGLE_PLACES_API_KEY` | Places autocomplete |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps JS |
| `VITE_INSTAGRAM_APP_ID` | IG embed |
| `VITE_GIPHY_API_KEY` | Giphy picker |
| `VITE_SENTRY_DSN` | Sentry browser SDK |
| `VITE_RELEASE_VERSION` | Sentry release tag |
| `VITE_NOTIFICATION_THROTTLE_MS`, `VITE_NOTIFICATION_QUEUE_SIZE` | Notification UX tunables |
| `VITE_AUTH_SESSION_ENDPOINT`, `VITE_FEED_ENDPOINT`, `VITE_PRESENCE_*`, `VITE_CSRF_TOKEN_ENDPOINT` | Optional API routes |
| `VITE_ENABLE_SESSION_REPLAY`, `VITE_REPLAY_*_SAMPLE_RATE`, `VITE_SENTRY_TRACES_SAMPLE_RATE`, `VITE_MEMORY_MONITOR_SAMPLE_RATE`, `VITE_RAGE_CLICK_SAMPLE_RATE` | Monitoring sampling |
| `VITE_BG_MUSIC_URL`, `VITE_TENANT_ID` | Misc |

### Server (Supabase Edge Functions / Node server)

| Var | Purpose |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_CLIENT_ID` | Stripe |
| `RESEND_API_KEY` | Resend |
| `OPENAI_API_KEY` | GPT-4o |
| `ANTHROPIC_API_KEY` | Claude (where explicitly used) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | SMS notifications |
| `AMADEUS_API_KEY`, `AMADEUS_API_SECRET` | Flight data |
| `UNSPLASH_ACCESS_KEY`, `VIATOR_API_KEY` | Optional travel data |
| `FROM_EMAIL`, `FRONTEND_URL`, `SUPPORT_EMAIL`, `ALLOWED_ORIGIN` | Misc |
| `EMAIL_INFRA_ALERT_TO` | Infra alert destination (defaults to `info@goldsainte.com`) |
| `CSRF_SECRET`, `PORT`, `NODE_ENV` | Node server |
| **Vault**: `email_queue_service_role_key` | Cron auth for `process-email-queue` |

---

## 17. Manual Configuration Requirements

Configuration that lives outside the repo:

### Supabase Dashboard

- Auth providers: Google OAuth (enabled), Apple Sign-In (where used)
- Site URL: `https://goldsainte.ai`
- Redirect URLs include `/auth/callback` for production, preview, and localhost
- Email templates wired to `supabase/templates/*.html`
- SMTP routed via Resend (or via `auth-email-hook` → queue)
- Vault secret `email_queue_service_role_key` populated

### Resend Dashboard

- `goldsainte.com` verified with DKIM / SPF / DMARC
- `notify.goldsainte.com` subdomain set up for `alerts@`

### Stripe Dashboard

- Webhook endpoint pointed at `stripe-webhook-handler`
- Connect onboarding flow configured (Express)
- Identity verification enabled

### Google Cloud Console

- OAuth 2.0 client with authorized redirect URIs (prod, preview, localhost) → `https://<supabase-ref>.supabase.co/auth/v1/callback`

### Domain provider

- `goldsainte.ai` → Lovable hosting
- `goldsainte.com` MX/DKIM → Resend

---

## 18. Launch Day Monitoring

| Surface | Threshold | Where |
|---|---|---|
| Sentry errors | >10/hour | Sentry dashboard |
| Failed signups | any spike | Supabase Auth Logs |
| Failed Stripe webhooks | any | Stripe Events feed |
| Resend bounce/complaint rate | >5% | Resend dashboard |
| OpenAI spend | hard cap **$200/day** | `check-ai-usage` edge function + OpenAI dashboard |
| Email queue depth | >100 | `SELECT count(*) FROM pgmq.q_transactional_emails` or `email-infra-monitor` |
| Stuck `pending` emails | >10 min | `email_send_log` (status='pending') |
| DLQ growth | ≥10 / hour | `email_send_log` (status='dlq') |
| `pg_cron` staleness | >60 min since last success | `email_infra_cron_last_run()` |
| Email infra breaches | any newly-opened | `email_infra_alerts` (auto-emails via direct Resend) |

---

_Last updated: 2026-05-16._