## What's happening

Your auth logs show `429 over_email_send_rate_limit` on `/signup` and `/resend`. This is Supabase's **default email service** rate limit (~2–4 emails/hour per project) — it kicks in because auth emails are still being sent by the built-in default sender, not through your verified Lovable Emails domain (`notify.goldsainte.com`).

Evidence:
- `notify.goldsainte.com` is verified ✅
- The `auth-email-hook` edge function is deployed ✅
- But `email_send_log` has **zero auth email rows in the last 48h** — meaning the hook is never being invoked. Supabase is routing all auth emails to its default sender, which has a tiny shared rate limit.

There is also a secondary bug that will bite us once the hook starts firing:
- `SENDER_DOMAIN` in `auth-email-hook/index.ts` is set to `"goldsainte.com"` (root) but the only verified sender domain is `notify.goldsainte.com`. Per the Lovable Emails contract, the queue dispatcher would reject every send with "No email domain record found".

## Plan

1. **Fix the sender subdomain in `supabase/functions/auth-email-hook/index.ts`**
   - `SENDER_DOMAIN = "notify.goldsainte.com"` (must match verified subdomain)
   - `FROM_DOMAIN = "goldsainte.com"` stays as-is so the visible From address remains `hello@goldsainte.com`
   - `ROOT_DOMAIN = "goldsainte.com"` stays as-is

2. **Redeploy `auth-email-hook`** so the corrected sender domain takes effect.

3. **Activate the auth email hook so Supabase routes auth emails to Lovable Emails** instead of the default sender. This is the actual cause of the 429s. Re-running the auth email scaffold + deploy triggers the reconcile that registers the hook with Supabase Auth, and you can monitor activation under **Cloud → Emails**. Existing templates and branding are preserved (overwrite flag handled).

4. **Verify it worked**, in this order:
   - Trigger one fresh signup
   - Confirm a new row appears in `email_send_log` with `template_name='signup'` and `status='sent'`
   - Confirm no new `over_email_send_rate_limit` entries in auth logs
   - Confirm the test email arrives from `hello@goldsainte.com`

## What this does NOT touch

- No changes to React app, routing, Supabase tables, RLS, Stripe, or any business logic
- No changes to email templates' content/branding
- No changes to transactional emails, prerender script, or recent SEO work

## Risk

Very low. Worst case is that activation takes a few minutes to propagate, during which Supabase continues to use its default sender (current behavior). No regressions to existing flows.

## Why the rate limit is appearing across multiple different users

Supabase's default email rate limit is **per-project**, not per-user. With the default sender active, the whole project shares ~2–4 emails/hour. As soon as we route through `notify.goldsainte.com`, that ceiling is replaced by Lovable Emails' queued/throttled pipeline (~120 emails/min by default, configurable).
