# Unstick Stripe Identity verification for agent applications

## Diagnosis (confirmed from data + logs)
- `create-identity-verification` failed silently when writing `stripe_verification_session_id` back to `agent_applications`. The `.update().eq().in().order('created_at').limit(1)` chain isn't supported on UPDATE by PostgREST → error `column agent_applications.created_at does not exist`. The function swallowed the error.
- Your row therefore has `stripe_verification_session_id = NULL`.
- The Stripe webhook fired correctly, verified its signature, but threw `No application found for verification session vs_1TaiAHF9Y0dnmu4YdEBqwH2P` because it looks up by that NULL column.
- Net effect: you completed verification on Stripe's side, but nothing on our side will ever update — Refresh Status just re-reads the (unchanged) row.

## Fix

### 1. `supabase/functions/create-identity-verification/index.ts`
Replace the single combined `update().order().limit()` with a two-step pattern that PostgREST handles cleanly:

1. `SELECT id FROM agent_applications WHERE email = ? AND status IN ('pending_verification','draft') ORDER BY created_at DESC LIMIT 1`
2. `UPDATE agent_applications SET stripe_verification_session_id=…, stripe_verification_status='pending' WHERE id = <found id>`

Same change for `brand_applications` (`primary_contact_email`).

Also: include `application_id` and `application_type` in the Stripe verification session `metadata` when we create it (we already pass some metadata — add these). This gives the webhook a second lookup path that doesn't depend on our DB write succeeding.

Stop swallowing the persist error — if both the update and metadata write fail, return a 500 so the UI doesn't redirect the user to a session that can never reconcile.

### 2. `supabase/functions/stripe-identity-webhook/index.ts`
In `processVerificationCompleted` (and any sibling handlers that look up the application): if the lookup by `stripe_verification_session_id` returns nothing, fall back to `session.metadata.application_id` + `application_type` before throwing. This makes the webhook resilient to the same class of bug in the future.

### 3. Backfill your stuck row (one-time)
Migration (or direct service-role call):

```sql
UPDATE agent_applications
SET stripe_verification_session_id = 'vs_1TaiAHF9Y0dnmu4YdEBqwH2P',
    stripe_verification_status = 'pending'
WHERE id = '75e7e1fe-adbc-4934-b056-c23e9b649b77';
```

Then in the Stripe dashboard (Developers → Webhooks → recent events for `vs_1TaiAHF9Y0dnmu4YdEBqwH2P`), **"Resend"** the latest `identity.verification_session.verified` (or `processing`) event. The webhook will now find your row, mark it verified, and trigger `createAgentAccountFromApplication` → `travel_agents` row + `profiles.account_type='agent'` + `user_roles` insert + completion email.

If no `verified` event exists yet (Stripe still processing), the Refresh Status button will flip on its own once Stripe sends it — because the row now has the session ID.

### 4. Verification after deploy
- Check the row: `stripe_verification_status='verified'`, `stripe_verified_at` set, `status='verified'`.
- Check `travel_agents` row exists for `user_id=900acef9-c282-4252-b95f-0088b4a215ee`.
- Check `profiles.account_type='agent'` and `user_roles` has `agent`.
- Check `application_audit_log` for an `account_provisioned` row.
- Confirm completion email in Resend logs.

## Out of scope
- Refresh Status button logic is fine — it just reads the row. No change needed.
- RLS policies — unchanged.
