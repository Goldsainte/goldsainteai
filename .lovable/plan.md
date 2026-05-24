
## What happened

Stripe resend worked — application is now `verified`, the welcome email arrived, and the user logged in. But two real bugs surfaced:

1. **404 from the email's "Open My Dashboard" link.** The template hardcodes a redirect to `/login?next=/onboarding/stripe-identity`. That route doesn't exist (the app uses `/n/*`, not `/onboarding/*`), and at this point the user has *already finished* Stripe Identity — so we shouldn't be sending them back to a KYC page anyway. They should land on the agent home.

2. **Auto-provisioning silently no-op'd.** Webhook logs show `"Account already provisioned for application"` with `alreadyExists: true`. The DB disagrees: `profiles.account_type='agent'` is set, but there is **no `travel_agents` row** and **no `user_roles` row** for `900acef9-…`. Root cause is in `supabase/functions/_shared/createAgentAccount.ts`:

   ```ts
   if (application.user_id) {
     return { success: true, alreadyExists: true };  // ← wrong signal
   }
   ```

   `agent_applications.user_id` is populated at signup, *before* the application is filed. So the helper short-circuits for every agent who signed up first (which is the standard flow now), skipping the `travel_agents` insert, `user_roles` insert, audit log, and welcome notification. The correct idempotency signal is the existence of a `travel_agents` row for that `user_id`.

## Fix

### 1. Fix the false-idempotent short-circuit (root cause)

In `supabase/functions/_shared/createAgentAccount.ts`:

- Remove the `if (application.user_id) return alreadyExists` early-return.
- Replace it with a check based on the `travel_agents` table: if a row with `user_id = application.user_id` already exists, return early. Otherwise, treat `application.user_id` as the resolved `userId` and proceed to step 3 (DB provisioning) — skip step 2 (auth user lookup/create) entirely, since the user is already known.
- This makes the helper truly idempotent and self-healing: any future agent stuck in this state will be fixed on the next webhook resend or manual admin re-run.
- Redeploy `stripe-identity-webhook` (it imports this helper).

### 2. Fix the broken email CTA destination

In `supabase/functions/_shared/transactional-email-templates/application-approved-professional.tsx`:

- Change the CTA URL from `/login?next=%2Fonboarding%2Fstripe-identity` to `/login?next=%2Fagent-dashboard` (the real agent home, gated by `RequireAgentTerms`).
- Update the on-page copy line that says "Complete Stripe Identity verification to unlock your dashboard" — by the time this email is sent, identity is already verified. Replace that step with something accurate ("Sign in and accept the Marketplace Terms to unlock your dashboard").
- Redeploy `send-transactional-email` so the new template is served.

### 3. Backfill this specific user (one-off)

Run the now-fixed provisioning helper for application `75e7e1fe-adbc-4934-b056-c23e9b649b77` to create the missing `travel_agents` and `user_roles` rows. Two equivalent ways:

- Curl the `stripe-identity-webhook` retry path is messy — instead, invoke the existing `approve-application` edge function (which also calls `createAgentAccountFromApplication`) for that application id. With the fix in place it will now insert the missing rows. Easiest: do the inserts directly via a small migration / data op, mirroring exactly what the helper does (travel_agents insert + user_roles insert + application_audit_log + notification). This is safer than re-running the webhook because we control the exact values.

### 4. Verify

Re-query `travel_agents` and `user_roles` for `900acef9-…` — both should now have rows. Confirm the user can hit `/agent-dashboard` after signing in (gated by `RequireAgentTerms` — if they haven't accepted terms yet they'll be sent to the terms page, which is correct).

## Technical notes / files touched

- `supabase/functions/_shared/createAgentAccount.ts` — replace the user_id-based short-circuit with a `travel_agents` existence check; skip the auth-user create branch when `application.user_id` is already set.
- `supabase/functions/_shared/transactional-email-templates/application-approved-professional.tsx` — fix CTA URL + onboarding steps copy.
- One-off data op via migration to insert `travel_agents` + `user_roles` + audit row + notification for `user_id=900acef9-c282-4252-b95f-0088b4a215ee`.
- Redeploy `stripe-identity-webhook` and `send-transactional-email`.
- No schema changes. No frontend changes.
