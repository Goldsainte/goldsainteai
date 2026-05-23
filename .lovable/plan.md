## End-to-end agent self-provisioning test

I'll execute the full path with a throwaway email and report at each checkpoint. The most important checkpoint is the **Stripe Identity webhook firing** — without it the agent stays as `agent_applications.status='verified'` with no `travel_agents` row, and `RequireAgentTerms` bounces them to `/`.

## Pre-flight verified

- `STRIPE_WEBHOOK_SECRET_IDENTITY` is present in project secrets ✓
- `STRIPE_SECRET_KEY` is present ✓
- Webhook handler code at `supabase/functions/stripe-identity-webhook/index.ts` calls `createAgentAccountFromApplication` on `verified` status ✓

What I can't verify from code alone: whether the **Stripe Dashboard webhook endpoint is actually registered** and pointed at `https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/stripe-identity-webhook` with the `identity.verification_session.verified` event subscribed. I'll detect this empirically — if the webhook never fires after verification, that's the diagnosis.

## Test sequence

1. **Browser → `/apply/agent`**
   - Step 1: email = `agent-e2e-{ts}@goldsainte.test`, set password, **first try mismatched passwords** to confirm validation fires, then match.
   - Steps 2–5: fill required fields, click **Back** once mid-flow to verify state preservation, then forward through to submit.
   - Verify in DB: `agent_applications` row exists with `status='pending_verification'` and `user_id` populated.
   - Verify in `auth.users`: user created.

2. **Stripe Identity (test mode)**
   - Click "Verify identity," complete the test-mode flow (instant pass).
   - **Wait + poll** `application_audit_log` and `edge_function_logs` for `stripe-identity-webhook` invocation.
   - Outcome A — webhook fires: `agent_applications.status='verified'`, `travel_agents` row inserted with `status='active'`, `user_roles` has `agent`, audit log shows `account_provisioned`.
   - Outcome B — webhook silent for >60s: report that Identity webhook endpoint is NOT registered in Stripe Dashboard. Provide exact endpoint URL + event list the user needs to add.

3. **Auto-login & gate checks**
   - Navigate to `/agent` (the dashboard route — confirm whether `/agent-dashboard` or `/agent` is canonical).
   - Confirm terms-modal appears (first login), accept.
   - Confirm dashboard renders without redirect to `/`.

4. **Stripe Connect onboarding**
   - Navigate to Settings → Earnings tab, click Stripe Connect.
   - In test mode, jump to the Stripe-hosted form, submit test data, return.
   - Verify `travel_agents.stripe_charges_enabled=true`.

5. **Trip Builder publish**
   - Navigate to `/trip-builder`, fill minimum required fields.
   - Click **Submit for review**.
   - Verify `packaged_trips` row exists with `status='pending_review'`.

## Cleanup
After the run, delete the test agent: `auth.users`, `profiles`, `travel_agents`, `agent_applications`, `user_roles`, any `packaged_trips`. I'll skip cleanup if you want to inspect the data.

## What I'll report back

For each checkpoint: ✓ or ✗ with the DB row / log line / error. Specifically:
- whether mismatched-password validation actually blocks submit
- whether Back/Next preserves field state
- **whether the Identity webhook fired** (the critical one) — with edge function log timestamp and audit log row
- whether `travel_agents` got created automatically
- whether `RequireAgentTerms` lets the user into the dashboard
- whether Stripe Connect flips `stripe_charges_enabled`
- whether trip publish succeeds

## Caveats

- This creates real DB rows under your live (Lovable Cloud) project. I'll use an obviously fake email (`@goldsainte.test`) and clean up after.
- Stripe Connect onboarding in test mode is multi-screen and may require manual help if a captcha appears — I'll pause and ask if I hit one.
- If the Identity webhook isn't registered in your Stripe Dashboard, the test will halt at step 2 with a clear remediation message; I won't be able to register the endpoint for you (Stripe Dashboard action).
