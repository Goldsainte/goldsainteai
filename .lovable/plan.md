
## What happened

- Stripe sent `identity.verification_session.verified` for `vs_1TaiAHF9Y0dnmu4YdEBqwH2P` at 3:00:06 PM → 500 (row lookup failed because `stripe_verification_session_id` wasn't persisted yet).
- That failed attempt still wrote a row into `webhook_events` with the event ID (with `error_message` set).
- The user manually resent the event at 3:16:30 PM. The webhook saw the existing `webhook_events` row, logged `"Event already processed (duplicate)"`, returned 200 — and never ran the update / provisioning / email.
- DB confirms: `agent_applications` row `75e7e1fe-…` is still `status=pending_verification`, `stripe_verification_status=pending`, `stripe_verified_at=null`. No `travel_agents` row, no welcome email, no admin notification.

So no — it did not actually work. Stripe is happy, our backend is not.

## Fix (3 parts)

### 1. Unstick this specific application (one-off data fix)

- Delete the poisoned `webhook_events` rows for this session's events (`evt_1TaiBtF9Y0dnmu4Y9NaD6BOj` and the earlier `processing` event `evt_1TaiBqF9Y0dnmu4YcK2FVoeq`, plus any earlier failed entries for the same session) so the resend isn't blocked.
- Ask the user to click **Resend** on the `verified` event one more time in Stripe. With the row backfilled and the poison entries gone, the webhook will:
  - Mark the application `verified` + set `stripe_verified_at`
  - Call `createAgentAccountFromApplication` → creates `travel_agents` row, sets `profiles.account_type='agent'`, inserts `user_roles`
  - Invoke `email-fanout` for `agent_application.identity_verified` → sends the "Welcome — Specialist" email
  - Notify admins

Fallback if the resend still misbehaves: directly invoke `createAgentAccountFromApplication` for application `75e7e1fe-adbc-4934-b056-c23e9b649b77` via a tiny one-shot edge function call, then update the row manually.

### 2. Fix the idempotency bug (root cause, prevents recurrence)

In `supabase/functions/stripe-identity-webhook/index.ts`:

- Change `isEventProcessed` to only treat an event as processed when the stored row has `error_message IS NULL` (i.e. a *successful* prior processing).
- Equivalently / additionally: in the main handler, when `recordWebhookEvent` is called after a failure, store with a deterministic flag and let retries proceed. Use upsert keyed on `event_id` so the second successful run overwrites the failure row with `error_message=null` and `processed_at=now()`.

This makes Stripe retries (and manual resends) actually do work after a transient failure, instead of silently 200-ing forever.

### 3. Sanity check

- After the resend, re-query `agent_applications` for the row and verify `status='verified'`, `stripe_verified_at` populated, `travel_agents` row exists for `user_id=900acef9-c282-4252-b95f-0088b4a215ee`, and `profiles.account_type='agent'`.
- Check `notifications` / email logs for the welcome email + admin notification.

## Technical notes

- File touched: `supabase/functions/stripe-identity-webhook/index.ts` (functions `isEventProcessed` and `recordWebhookEvent` around lines 99–141).
- One-off data ops via `supabase--insert` migration (DELETE on `webhook_events` for the two `evt_…` ids).
- No schema change needed; `webhook_events.error_message` column already exists.
- No frontend changes.
