## What I found

The signup at 20:53 UTC for `info@cornellfacilities.com` (user `caea0d50-…`) DID reach Supabase Auth. The auth hook fired and returned 200 OK:

```
hook: https://lovable-api.com/.../backend/email-hook
action: user_confirmation_requested
success: true
duration: 294ms
```

But unlike every previous signup for that address (5/14, 5/15, 5/24 15:32 — all logged as `pending` → `sent`), this attempt produced **zero rows in `email_send_log`**. So the auth hook accepted the request, but the email was never enqueued into the project's queue. Two real problems are colliding:

### Problem 1 — the auth-email-hook is on the OLD direct-send pattern

`supabase/functions/auth-email-hook/index.ts` still imports `@lovable.dev/email-js` and sends inline via the managed Lovable Email API. The current standard is the queue-based pattern (calls `enqueue_email` RPC → `process-email-queue` drains it → logged in `email_send_log` with retries / DLQ).

Consequences of being on the old pattern:
- No queue → no automatic retries on transient failure or Mailgun rate-limit
- No `email_send_log` row → we have no visibility when a send silently fails (which is exactly what's happening now)
- Inconsistent with the transactional pipeline that DOES log

This explains why the previous "signup" rows existed (those went through a working path) but the latest one didn't — the hook now returns 200 to Auth without producing an enqueue record we can see.

### Problem 2 — Mailgun-side suppression is the most likely silent failure

`info@cornellfacilities.com` has received 5 emails from us in 10 days, with multiple signup attempts. Mailgun maintains its own suppression list (bounces, complaints, "previously unsubscribed") that is **independent of our `suppressed_emails` table** (which is empty for this address). When Mailgun suppresses an address, the API returns success but never delivers — exactly the symptom here.

This is not in our database; it lives in Mailgun. We can't see it from the project, but we can clear it.

## Fix

### 1. Upgrade `auth-email-hook` to the queue-based pattern

Re-scaffold `auth-email-hook` so it imports `@supabase/supabase-js` and calls `supabase.rpc('enqueue_email', ...)` against the `auth_emails` pgmq queue, then redeploy it. After this, every auth email (signup, recovery, magic link) will:
- Land in `email_send_log` with status `pending`
- Be drained by `process-email-queue` with retries
- Land as `sent` or `dlq` with an actual `error_message` we can read

Custom email templates in `_shared/email-templates/` are preserved.

### 2. Clear Mailgun suppression for `info@cornellfacilities.com`

You need to do this in the Mailgun dashboard (we can't do it from the project):
- Mailgun → Sending → Suppressions
- Search `info@cornellfacilities.com`
- Remove from Bounces, Unsubscribes, and Complaints if present

If the address shows up there, that's the root cause of the silent drop. Once removed, future sends will reach the inbox.

### 3. Re-test and verify

After steps 1 and 2:
- Sign up again with that address
- Check `email_send_log` — there should be a `pending` row within ~5s, then `sent`
- If it goes to `dlq` instead, the `error_message` column will tell us exactly what Mailgun rejected (auth, domain, rate-limit, etc.)

### 4. Going forward

With the queue-based hook in place, "the email didn't arrive" stops being a black box. Every send produces a row with a status and an error string, so we can answer the question definitively next time instead of guessing.

## Technical notes

- Files touched: `supabase/functions/auth-email-hook/index.ts` (re-scaffolded), templates in `_shared/email-templates/*.tsx` (preserved as-is)
- Deploy: `auth-email-hook`
- No DB schema changes — `enqueue_email` RPC and `auth_emails` pgmq queue already exist (transactional pipeline uses the same infra)
- No frontend changes
- Mailgun suppression clearing must be done by you in the Mailgun dashboard — not scriptable from here
