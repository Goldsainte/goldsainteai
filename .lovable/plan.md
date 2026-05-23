
# Pre-launch email + signup fix

## Diagnostic results (already gathered)

**Item 2 — Cron job:** `process-email-queue` is **present and active** (jobid 15, every 5s, fires only when a queue has rows, authenticates via vault secret `email_queue_service_role_key`). Not the root cause.

**Item 3 — Queues / log (last 7 days):**
- `pgmq.q_auth_emails`: 0, `q_auth_emails_dlq`: **2**
- `pgmq.q_transactional_emails`: 0, `q_transactional_emails_dlq`: 2
- `email_send_log`: sent 8, pending 12, failed 15, dlq 4, bounced 2
- Dominant errors: `403 no_matching_sender` on `recovery` (sender-domain bug — already fixed in `request-password-reset` and `auth-email-hook`, but **the 2 messages currently in the auth DLQ were enqueued with the bad sender and will never send** — they need to be purged). Also historical `400 missing_unsubscribe` / `404 run_not_found` on recovery from before the recent fixes.

**Item 7 — Orphan users:** exactly **1** — `radu587@gmail.com` (auth id `a9ba177a-9fda-418d-9656-345909804dc3`, created 2026-05-22). Will be backfilled.

**Item 4 — Batch stopping confirmed:** `process-email-queue/index.ts` returns early on **both** 429 and 403, leaving the rest of the batch unsent until the next 5s tick.

**Item 1 — Resend scope:** confirmed Auth/welcome only. `send-welcome-email` and `test-resend` will be removed; the ~30 other Resend-using functions (bookings, agent flows, message digests, tier upgrades, etc.) stay untouched — touching them before Wednesday is too risky.

---

## Changes

### 1. Kill the Resend welcome path
- Delete `supabase/functions/send-welcome-email/` (and call `delete_edge_functions` for `send-welcome-email`).
- Delete `supabase/functions/test-resend/` (and undeploy).
- Remove the `supabase.functions.invoke('send-welcome-email', ...)` block in `src/pages/AuthCallback.tsx` (lines ~104–135) plus the `sessionStorage.getItem('pending_welcome_email')` read; also remove the `sessionStorage.setItem('pending_welcome_email', ...)` writers in `src/pages/Auth.tsx` (and any Google OAuth handler) so we stop persisting a flag nobody consumes.
- Create a new Lovable-queue welcome template:
  - `supabase/functions/_shared/transactional-email-templates/welcome.tsx` (React Email, brand styling from project memory: cream `#f7f3ea`, dark green `#0c4d47`, Playfair Display).
  - Register in `supabase/functions/_shared/transactional-email-templates/registry.ts`.
  - In `AuthCallback.tsx`, after a confirmed first sign-in, invoke `send-transactional-email` with `templateName: 'welcome'`, `recipientEmail`, `idempotencyKey: welcome-${user.id}`, and `templateData: { firstName, accountType }`. Fire-and-forget.
- Leave `RESEND_API_KEY` in production secrets — the other 30 functions still use it.

### 2. Make `process-email-queue` resilient (Item 4)
Edit `supabase/functions/process-email-queue/index.ts`:
- On **403**: move that single message to DLQ and `continue` instead of `return`. One poison message must not starve the batch.
- On **429**: still set `retry_after_until`, but `break` out of only the current queue loop (so we stop hammering the provider) rather than `return`. The dispatcher already early-exits on next tick via the `retry_after_until` check.
- Add try/catch around the DLQ / log writes so DB hiccups never crash the loop.

### 3. Purge the 2 dead auth-DLQ messages and re-trigger
Use `supabase--insert` to call `pgmq.purge_queue('auth_emails_dlq')` so the stale `no_matching_sender` rows clear out. (They're not user-visible, just noise + bad monitoring signal.) The active sender-domain code is correct now; subsequent recovery emails will go through.

### 4. Stop `handle_new_user` from swallowing failures (Item 6)
New migration: drop the `WHEN OTHERS` branch. Keep the `unique_violation` branch (it's the legitimate "user already had a profile" case from the `ON CONFLICT (id) DO NOTHING`) and let everything else raise — auth signup then fails cleanly with a 500 the user can retry, instead of producing an orphan.

### 5. Backfill the orphan (Item 7)
Use `supabase--insert` to insert a `profiles` row for `radu587@gmail.com` using the same column defaults `handle_new_user` would have written (username derived from email, `account_type='traveler'`, `is_profile_complete=false`, `onboarding_completed=false`, `email` set).

### 6. Items I can't fix with code; need user confirmation
- **Item 5 (LOVABLE_API_KEY + DNS):** I'll verify `LOVABLE_API_KEY` is set in production secrets and run the domain status check on `notify.goldsainte.com`. If anything is amber/red I'll surface it; if green I'll report green. (Screenshot has to be taken by you in **Cloud → Emails** — the agent can't capture dashboard screenshots.)
- **Item 8 (Supabase Auth settings):** I'll check via the admin API that the Auth email hook is wired to `auth-email-hook` and report "Confirm email" status; if anything is off I'll call `configure_auth` to fix.

### 7. Deploy & verify
- `deploy_edge_functions(["process-email-queue", "send-transactional-email"])` (the latter only if registry changes).
- `delete_edge_functions(["send-welcome-email", "test-resend"])`.
- Re-query `email_send_log`, queue lengths, and `cron.job` and report fresh numbers.

---

## Out of scope (explicit)
- Migrating the other ~30 Resend-using functions to the Lovable queue. Per your choice "Auth/welcome only," `RESEND_API_KEY` stays. We can plan that migration after the interview.
- Re-architecting `auth-email-hook` — already on the queue and using the correct `notify.goldsainte.com` sender per the prior fix.

## Risk notes
- Removing `WHEN OTHERS` means a future bug in `handle_new_user` (e.g. schema change) will start failing live signups loudly instead of silently. That's the desired tradeoff — silent half-creation is worse — but is worth flagging.
- The new welcome template must include an `unsubscribe_token` (the queue's `missing_unsubscribe` 400 in the logs shows what happens otherwise). I'll route via `send-transactional-email`, which generates one automatically.
