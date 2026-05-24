## What I found this time

A fresh `auth.users` row was created at **21:12:46 UTC** for `info@cornellfacilities.com` (id `866d93db-…`, `email_confirmed_at = null`), but:

- **No `email_send_log` row** was written after 20:24 for this address.
- **No `auth-email-hook` invocation** appears in the Edge Function logs around 21:12 (the only entry today is a `shutdown` at 21:06).

So Supabase Auth created the user, but it **never called our email hook at all** — which is why the queue-based pipeline we just deployed shows nothing. Our hook isn't broken; it isn't being asked to do anything.

## Why this is happening

This address has been hammered today:

```
15:32  signup confirm     → sent
19:58  application-received → sent
20:24  welcome-professional → sent
20:53  signup attempt (deleted user)
21:12  signup attempt (current user, no hook fired)
```

Supabase Auth has **built-in per-recipient rate limiting** for outbound auth emails (default: 4 emails/hour to the same address, independent of our queue, independent of Mailgun). When the limit trips, Supabase silently skips the email send — and because the send is skipped, the email webhook is never called. From the outside it looks identical to "the hook is broken." It isn't. The send was suppressed upstream of the hook.

The current user row was created successfully; only the confirmation email was dropped.

## Fix

### 1. Unblock this address right now

Manually confirm the current `866d93db-…` user so they can proceed without waiting on the email, OR delete the user and have them sign up again from a different address to verify the hook fires end-to-end. I'll do whichever you prefer.

### 2. Verify the rate limit is the actual cause

Check the project's Auth → Rate Limits configuration and the auth logs around 21:12 for a `rate_limit_exceeded` / `email_rate_limit` event. If confirmed, that's the smoking gun and explains every "didn't get the email" report today for this address.

### 3. Two ways to prevent this from recurring

- **Raise the per-email auth rate limit** in Auth settings (e.g. 10/hour) so normal repeat signups during testing don't get silently suppressed.
- **Surface rate-limit failures in the UI.** Right now the signup form shows success even when Supabase drops the email. We should detect the Supabase rate-limit response on `signUp()` and show the user "Too many attempts for this email — wait an hour or use a different address" instead of letting them think it worked.

### 4. Going forward

With (2) and (3) in place, "the email didn't arrive" stops being mysterious — either there's a `pending`/`dlq` row in `email_send_log` (queue problem, which we can debug), or the UI tells the user it was rate-limited (Supabase suppression, which is expected behavior). No more silent drops.

## Questions before I implement

- Do you want me to **manually confirm** the current user `866d93db-…`, or **delete it** so you can re-test the signup flow from a clean state (ideally with a different email so we bypass the rate limit)?
- OK to raise the per-email auth rate limit to a higher value (e.g. 10/hour), or do you want to keep Supabase's default?
