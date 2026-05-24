## Why you're blocked

"Too many attempts" is **Supabase Auth (GoTrue)** rejecting the request before it ever reaches our `auth-email-hook` or queue. It's enforced on Supabase's side based on three counters:

1. **Emails sent per hour** (default: 4) — per project
2. **Sign-ups / sign-ins per 5 min per IP** (default: 30)
3. **Minimum resend interval** (default: 60s)

The first two are what you're hitting after multiple test signups + resend clicks today. I cannot change these via tool — the `configure_auth` tool only exposes 4 flags (signup toggle, anonymous users, auto-confirm, HIBP). Rate-limit fields are dashboard-only.

## Plan

### Step 1 — You raise the limits in Cloud (one-time, ~30 seconds)

Open **Lovable Cloud → Auth → Rate Limits** and set:

| Setting | Current | New |
|---|---|---|
| Emails sent per hour | 4 | **30** |
| Min interval between resends | 60s | **20s** |
| Sign-ups / sign-ins per 5 min per IP | 30 | leave as-is |
| Token verifications per 5 min per IP | 30 | leave as-is |

These are sane production values — high enough that a normal user can sign up + resend twice without hitting the wall, low enough to block abuse. Save and the new limits apply immediately.

### Step 2 — I clear your current rate-limit counter

So you don't have to wait an hour for the old window to expire, once you've raised the limits I'll run a one-line delete on the `rate_limits` table for your IP / email. Fresh slate to test against.

### Step 3 — You sign up with a brand-new email

While you do, I'll tail `email_send_log` filtered to your recipient and report back:
- `pending` row appears within ~2s
- transitions to `sent` within ~5s
- `template_name = 'signup'`, no `error_message`

If all three pass, the pipeline is confirmed healthy end-to-end and the only thing that was ever wrong was the default rate limit being too tight for active testing.

### Where the limit lives (so you raise it in the right place)

- **Supabase Auth** — the "too many attempts" you're seeing now. Dashboard-controlled. **This is what you need to raise.**
- **Lovable Email provider** — separate, higher limit, surfaces as 429 inside `process-email-queue` and auto-retries via the queue. Not your current blocker.
- **Resend** — not in this path at all; we send via Lovable Emails.

Approve and I'll wait for you to bump the dashboard values, then clear the counter and watch the log on your next signup.