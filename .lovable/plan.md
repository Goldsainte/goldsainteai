# Tier 1 + Tier 2 → 9/10 Implementation Plan

Locked target: **9/10 by next Wednesday.** Below is split into what I'll code now vs. what you own (accounts, manual QA, infra toggles).

---

## What I'll implement (code changes)

### 1. Affiliate self-referral guard
In `track-affiliate-click` and the commission-write path: reject attribution when the buyer's `user_id` equals the affiliate link's `creator_id`. Add a DB-level guard too (trigger on `affiliate_commissions` insert) so it can't be bypassed.

### 2. Affiliate commission reversal on refund
Extend `process-booking-refund` with a third RPC `reject_booking_affiliate_commissions(target_booking_id)`. It joins `affiliate_clicks → bookings` and flips matching `affiliate_commissions.status` from `pending`/`approved` to `rejected`. Paid commissions are left alone and surfaced for manual clawback.

### 3. Stripe webhook idempotency hardening
- Add unique index on `stripe_webhook_events.event_id` (or equivalent dedupe table).
- Wrap the dedupe check in `INSERT ... ON CONFLICT DO NOTHING` so concurrent retries from Stripe can't both pass the check.
- Add a daily cron to purge events older than 30 days.

### 4. Username uniqueness verification
Write a one-shot SQL test that asserts (a) `idx_profiles_username_lower` exists and is unique, (b) the retry loop in `handle_new_user` actually catches `unique_violation`. Commit as `supabase/tests/handle_new_user.sql` for future regression.

### 5. Sentry SDK wiring
- Add `@sentry/react` to the frontend, init in `src/main.tsx`, wrap `RouteSectionBoundary` to forward errors.
- Add `@sentry/deno` to a shared `_shared/sentry.ts` and import in the 5 highest-risk edge functions: `stripe-webhook`, `create-cocurated-checkout`, `process-booking-refund`, `email-fanout`, `auth-email-hook`.
- Requires a `SENTRY_DSN` secret from you (see "What you own" #1).

### 6. pgmq queue + DLQ alerting cron
New edge function `monitor-email-queue`, scheduled every 5 min via pg_cron. Posts a Slack webhook (or sends a transactional email to admin) when:
- `email_send_log` has any new `dlq` rows since last check
- queue depth > 100
Requires `ADMIN_ALERT_WEBHOOK_URL` secret.

### 7. Bundle splitting
- `React.lazy` all routes under `/admin/*`
- `React.lazy` the Fabric.js storyboard design editor
- Verify with `vite build` output that admin chunk is separate from main bundle.

### 8. OG tag prerendering for storyboard share URLs
Add an edge function `og-storyboard/:slug` that returns server-rendered HTML with `<meta property="og:*">` tags filled from the storyboard record. Update the storyboard share-link generator to point Twitter/Facebook crawlers at this endpoint via a `_redirects`-style rule, while real users still land on the React app.

---

## What you own (I can't do these for you)

1. **Create Sentry project**, paste the DSN into `SENTRY_DSN` secret. Then I'll finish wiring (#5).
2. **Slack incoming webhook** for queue alerts → `ADMIN_ALERT_WEBHOOK_URL` secret. Then #6 goes live.
3. **Toggle HIBP** in Cloud → Users → Auth Settings → "Password HIBP Check". One click.
4. **Stripe Dashboard alert** for failed webhook deliveries > 1% over 5 min (Stripe → Developers → Webhooks → Alerts).
5. **k6 load test on staging.** I can write the k6 scripts (`/tests/load/*.js`) targeting signup, checkout, storyboard view — but you run them against staging and watch the dashboards. Tell me if you want the scripts.
6. **Manual mobile QA at 375px** of the traveler signup → request-a-trip → checkout flow. ~20 min on a real phone or Chrome DevTools. Report any breaks and I'll fix.
7. **Smoke test against published URL** — the 10-step checklist from the audit. I can't drive a real Stripe payment from here.

---

## Explicitly NOT doing

- **Signup rate limiting** — backend has no good rate-limit primitives yet. Cloudflare or similar at the edge is the right place; not in app code.
- **Tier 3 items** — runbooks, PITR verification, on-call rotation, compliance sweep. Save for post-launch week 1.

---

## Sequencing

```text
Day 1 (today):   #1, #2, #3, #4   ← pure code, no secrets needed
Day 2:           #7, #8           ← bundle split + OG prerender
Day 2 (you):     create Sentry + Slack accounts, paste secrets
Day 3:           #5, #6 wired and verified
Day 3 (you):     HIBP toggle, Stripe webhook alert
Day 4:           k6 scripts handed off, you run staging soak
Day 5:           Mobile QA + smoke test
```

If staging soak is clean → ship Wednesday.

---

## Confirm before I start

- OK to add `@sentry/react` + `@sentry/deno` dependencies?
- OK to create the new edge functions `monitor-email-queue` and `og-storyboard`?
- Want the k6 load-test scripts written now (Day 1) or at the end (Day 4)?
