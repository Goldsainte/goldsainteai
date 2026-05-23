## What I found (definitive)

I ran `GET /v1/webhook_endpoints` against your account using `STRIPE_SECRET_KEY` and the result is genuinely `[]` — zero endpoints. I also confirmed:

- `STRIPE_SECRET_KEY` begins with **`sk_test_`** → account `acct_1SLdsPFBVaLSioru`, TEST mode.
- Stripe Identity **is enabled** — I successfully listed `identity.verification_sessions` (the test session `vs_1SXZEFFBVaLSioruH4U4D6b2` exists on the account, livemode=false).
- The `identity.verification_session.*` event family IS available on the account.

Conclusion: the `agent-verification-webhook` endpoint you can see in the Stripe Dashboard is in **Live mode**, not Test. Our edge functions and our `STRIPE_SECRET_KEY` are Test mode, so they will never see Live-mode signing secrets or events. That's the entire mismatch. Nothing is wrong with Stripe Identity availability or the API version on that endpoint — it just lives in the wrong mode for our integration.

## The single correct endpoint configuration

- **URL:** `https://iwdevxltjuedijrcdejs.supabase.co/functions/v1/stripe-identity-webhook`
- **API version:** `2024-06-20` (matches the version pinned in our Stripe SDK init)
- **Events (exactly 4):**
  - `identity.verification_session.verified`
  - `identity.verification_session.requires_input`
  - `identity.verification_session.processing`
  - `identity.verification_session.canceled`
- **Mode:** Test (since `STRIPE_SECRET_KEY` is `sk_test_…`). When you go live you'll repeat this in Live mode with a Live signing secret.

## stripe-identity-webhook vs agent-verification-webhook

Both files exist in `supabase/functions/`. They do similar things, but only one is wired up by the real flow:

- **`stripe-identity-webhook`** — Called by the application onboarding flow (`agent_applications` / `brand_applications` / traveler KYC). This is the **live, canonical handler** and the one our docs (`docs/STRIPE_IDENTITY_WEBHOOK_SETUP.md`) point Stripe at. The newly-registered endpoint must hit this URL.
- **`agent-verification-webhook`** — Older handler tied to a different schema (`agent_applications.kyc_session_id` keyed by `agent_id`, updates `profiles.agent_verification_status`). The current self-provisioning flow uses `createAgentAccountFromApplication` inside `stripe-identity-webhook`, not this file. It is **dead code** and the source of the naming confusion in the dashboard.

## Plan

1. **Create the Test-mode endpoint via Stripe API** with the URL, API version, and 4 events above. Capture the returned `secret` (`whsec_…`).
2. **Hand you the signing secret** and prompt you to paste it into `STRIPE_WEBHOOK_SECRET_IDENTITY` via the secret-update modal. (I cannot write secret values directly; this is the only step that needs your click.)
3. **Verify the secret took** by reading the deployed function env and re-firing a signed simulated `identity.verification_session.verified` event with the new secret. Expected: 200 OK, signature verified, `createAgentAccountFromApplication` runs against a fresh test `agent_applications` row, `travel_agents` + `user_roles` rows appear, audit log shows `account_provisioned`.
4. **Retire dead code**: delete `supabase/functions/agent-verification-webhook/` (both `index.ts` and the deployed function via `delete_edge_functions`) and remove the matching reference from `supabase/functions/agent-start-verification/index.ts` if it still points at the old shape. Update `mem://integrations/stripe-identity-kyc-system-comprehensive` to name `stripe-identity-webhook` as the only Identity handler.
5. **Document Live-mode handoff** in `docs/STRIPE_IDENTITY_WEBHOOK_SETUP.md`: when switching `STRIPE_SECRET_KEY` to `sk_live_…`, you must register the same endpoint in Live mode and paste that Live signing secret over `STRIPE_WEBHOOK_SECRET_IDENTITY` (or split into Test/Live secrets).

## What you'll need to do

Exactly one thing: paste the `whsec_…` value I give you into the `STRIPE_WEBHOOK_SECRET_IDENTITY` modal when it pops up. Everything else (endpoint creation, deletion of dead function, retest) I do.

## Caveats

- The endpoint will be Test-mode only. Real users in production will need a Live-mode endpoint registered the same way once you flip to `sk_live_`.
- If you want me to also delete the Live-mode `agent-verification-webhook` endpoint visible in your dashboard, I'll need a Live secret key — say the word and I'll request `STRIPE_SECRET_KEY_LIVE` via the secrets modal. Otherwise I'll leave the Live dashboard untouched.
