# Email pipeline fixes

## Diagnostics (already gathered)

1. **Bug confirmed.** `supabase/functions/send-transactional-email/index.ts` lines 13/17:
   ```
   const SENDER_DOMAIN = "goldsainte.com"
   const FROM_DOMAIN   = "goldsainte.com"
   ```
   The verified Lovable sender subdomain is `notify.goldsainte.com` (matches `auth-email-hook` and `request-password-reset`). With the root domain, every transactional send is rejected by the email API with `no_matching_sender` — explains why bookings/proposals/receipts haven't arrived.

2. **Cron is healthy.** `cron.job` shows `process-email-queue` (jobid 15, `5 seconds`, active). Plus the auxiliary jobs (`dispatch-message-email`, reminders, monitor, etc.) are all active.

3. **email_send_log is empty for the last 24h** — zero rows of any status. That's consistent with #1: no transactional sends have been enqueued/logged recently, and the auth hook traffic from the earlier round has aged out. We won't see `sent` rows until the sender-domain fix is deployed and a real event fires.

4. `src/hooks/useEmailNotifications.ts` — confirmed no importers (`rg "useEmailNotifications|sendBookingConfirmationEmail|sendProposalReceivedEmail" src` returns only the file itself). All function bodies are `return { success: true }` stubs.

---

## Changes

### 1. Fix `send-transactional-email` sender domain
Edit `supabase/functions/send-transactional-email/index.ts`:
- `SENDER_DOMAIN` → `"notify.goldsainte.com"`
- `FROM_DOMAIN` → `"notify.goldsainte.com"` (so the visible From address matches the verified sender; this also matches what `auth-email-hook` and `request-password-reset` already use, keeping branding consistent).
- Leave `SITE_NAME` as-is.

Then `deploy_edge_functions(["send-transactional-email"])`.

### 2. Delete the dead skeleton
Delete `src/hooks/useEmailNotifications.ts` outright. It has no importers and the real path is `supabase.functions.invoke('send-transactional-email', ...)` — keeping a "DO NOT USE" stub around just invites someone to wire it up later. (If you'd rather keep it with a banner header instead, say so and I'll do that instead of deleting.)

### 3. Verify after deploy
- Re-query `cron.job` (already healthy; recheck only to confirm no regression).
- Trigger one real transactional path you can reach quickly — e.g., re-send a booking confirmation or submit a contact form — and then:
  ```sql
  SELECT DISTINCT ON (message_id) message_id, template_name, recipient_email, status, error_message, created_at
  FROM email_send_log
  WHERE created_at > now() - interval '15 minutes'
  ORDER BY message_id, created_at DESC;
  ```
  Expect to see a `pending` row flip to `sent` within ~5–10s. I'll run this and report the rows. If anything lands in `dlq`, I'll surface `error_message` and fix.

---

## Out of scope
- The other ~30 functions that still send via Resend directly (bookings, agent flows, etc.) — untouched per the earlier "Auth/welcome only" decision. They're not affected by this bug; they use their own Resend sender.
- No schema/RLS changes.

## Risk
- Changing `FROM_DOMAIN` to `notify.goldsainte.com` means the visible From address becomes `noreply@notify.goldsainte.com` instead of `noreply@goldsainte.com`. If you want the root domain to *display* while sending through the subdomain, that requires `display_from_root` to be enabled on the Lovable email domain — tell me and I'll keep `FROM_DOMAIN = "goldsainte.com"` and only change `SENDER_DOMAIN`. Default in this plan is to make both match the subdomain, which is guaranteed to work today.
