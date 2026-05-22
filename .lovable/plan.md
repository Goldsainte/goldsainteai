
## Context

Two separate issues are conflated under "password reset emails aren't sending":

1. **The `/supabase/templates` folder having only 2 HTML files is not a bug.** Those are legacy native Supabase templates. The active templates are React Email files in `supabase/functions/_shared/email-templates/` (all 6 are present: signup, recovery, magic-link, invite, email-change, reauthentication), rendered by `auth-email-hook` and `request-password-reset`, then queued through Lovable Emails.

2. **The real bug visible in GoTrue logs:** every recent `/admin/generate_link` call returns `404 user_not_found`. `request-password-reset/index.ts` throws on that 404, so nothing is ever enqueued, nothing is logged in `email_send_log`, nothing shows in Lovable Emails or Resend. Users see "we sent a link" (or a generic error) and never receive anything.

You confirmed some affected users are already approved/active, so there's also a second failure mode in the queue itself that needs an audit.

## Plan

### 1. Fix `request-password-reset` to silent-success on unknown emails

Rewrite the edge function so that:
- If `admin/generate_link` returns `404 user_not_found`, the function logs the attempt (with `status: 'skipped_user_not_found'` in `email_send_log` for observability) and returns `{ success: true }` to the client. No email is queued. This is the standard anti-enumeration pattern and matches your answer.
- All other errors continue to return 500.
- The client (`requestPasswordReset.ts`) already handles success generically — no UI change needed; users always see "If an account exists, we've sent a reset link."

### 2. Audit and unblock approved-user resets

Investigate why approved users with valid `auth.users` rows aren't receiving the email:
- Query `email_send_log` for `template_name = 'recovery'` in the last 7 days, grouped by `status` (`pending`, `sent`, `failed`, `bounced`).
- Query the `transactional_emails` pgmq queue and DLQ for stuck or failed recovery messages.
- Check the latest `process-email-queue` edge function logs for sender errors (`no_matching_sender`, 4xx/5xx from Lovable Emails API).
- Verify the Lovable Emails project toggle is still **on** and the `notify.goldsainte.com` sender is registered.

Based on findings, the likely fixes are one or more of:
- Re-toggle Lovable Emails / re-register the sender domain via `setup_email_infra` (idempotent).
- Redeploy `process-email-queue` if cron has drifted.
- Requeue any DLQ recovery messages once the sender is healthy.

### 3. Validation

- Trigger a password reset for a **known approved user** with a real inbox → expect `email_send_log` row `recovery / sent`, email delivered from `hello@goldsainte.com`.
- Trigger a password reset for a **non-existent email** → expect `success: true` response, no email sent, log row `skipped_user_not_found`, no 404 in GoTrue logs propagating to the function as an error.
- Confirm no new entries in DLQ after both tests.

## Technical details

Files touched:
- `supabase/functions/request-password-reset/index.ts` — branch on `generateLinkResponse.status === 404` (and/or `error_code === 'user_not_found'`) → log + early-return success instead of throwing.
- No client changes.
- No schema changes.
- No template changes. The `/supabase/templates` HTML files can be left alone or deleted as cleanup (not required for the fix).

Out of scope:
- Changing the post-approval auth model.
- Adding a "no account found" branded email (you chose silent success).
- Touching signup, magic-link, or other auth flows.
