## Context

Auth emails on this project are intentionally routed through **Lovable Emails**, not Resend. Resend hasn't shown auth logs in 4 days because it was never sending them — that's expected.

The real issues:

1. **Supabase is not calling `auth-email-hook` for signups.** Last 24h shows only 1 auth row in `email_send_log` (a recovery), zero signups. Supabase is falling back to its default sender, which is hard rate-limited → the `over_email_send_rate_limit` 429s users are hitting.
2. **The one auth email that did reach the hook went to DLQ** with `403 no_matching_sender` from the Lovable Email API, even though `notify.goldsainte.com` is verified. This points to Lovable Emails being toggled off (or the sender registration being out of sync) at the project level.

## Fix

1. **Verify Lovable Emails is enabled for the project.** If it's off, re-enable it (`toggle_project_emails: enabled=true`). This alone should clear the `no_matching_sender` 403 since the domain is already verified.
2. **Re-run `setup_email_infra`** (idempotent). This refreshes the vault service-role key, the `process-email-queue` cron, and re-registers the sender — required after any recent service-role key rotation or partial setup.
3. **Re-deploy `auth-email-hook`** so Supabase re-registers the hook URL. This is what actually fixes the signup 429s: once the hook is active, signup emails route through our queue instead of Supabase's default sender.
4. **Validate.**
   - Trigger one fresh signup with a real inbox.
   - Confirm a new `email_send_log` row appears with `template_name='signup'` → `status='sent'`.
   - Confirm no new `over_email_send_rate_limit` entries in auth logs.
   - Confirm the email arrives from `hello@goldsainte.com`.
5. **Optional cleanup (not required for the fix):** the legacy `send-email`, `send-welcome-email`, `send-password-reset-email`, etc. still call Resend directly. They're unrelated to auth and can stay as-is. We can migrate them to the Lovable Emails queue later if you want a single pipeline.

## What this does NOT touch

React app, routing, Supabase tables, RLS, Stripe, transactional Resend functions, email templates, or the recent SEO prerender work. Risk is low — worst case the re-enable takes a minute to propagate.

## Technical detail (for reference)

- `auth-email-hook/index.ts` is already on the correct queue-based pattern (enqueues to `auth_emails` pgmq, with `sender_domain = notify.goldsainte.com`, `from = Goldsainte <hello@goldsainte.com>`).
- DLQ error `no_matching_sender` from the Lovable Email API on a verified subdomain almost always means the project-level emails toggle is off or the sender hasn't been re-registered after a service-role key rotation — both are fixed by steps 1–3 above.
- Resend's `RESEND_API_KEY` continues to be used by the ~20 legacy transactional functions guarded by `resend-guard.ts`. Those are healthy and unrelated to the auth 429s.
