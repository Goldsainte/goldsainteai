## Fix `ApplicationVerificationComplete.tsx` + diagnose Andre's verification

### Diagnosis of your verification (answered now)

Queried `agent_applications` for `andre.powelljr@gmail.com`:

| field | value |
|---|---|
| id | `2e7b341c-24a5-48cf-a3ba-b00f3a974f1e` |
| status | `pending_verification` |
| stripe_verification_status | `null` |
| stripe_verification_session_id | `null` |
| stripe_verified_at | `null` |
| rejection_reason | `null` |
| created_at | 2026-05-24 02:22 UTC |

**Stripe Identity was never started for your application** — no session ID, no status, no error. The document-upload RLS failure from the previous turn blocked you before you reached the Stripe step, so the application row was never created with documents and you never hit `create-identity-verification`. This page is a bug *and* you have no Stripe failure to surface — the row exists in `pending_verification` because the upload fix landed after the form had already inserted the row on a prior attempt (or the row is the orphan from the failed flow). Either way, **Stripe didn't reject you. You never reached Stripe.** Re-run the application with the upload fix in place and you'll get a real session.

### Fix 1 — Pass application_id through the URL (no more localStorage)

**`create-identity-verification/index.ts`**: change `defaultReturnUrl` (line ~327) to include the application id from `metadata.applicationId`:
```
${frontendUrl}/application/verification-complete?type=${applicationType}&application_id=${metadata.applicationId}&vs={CHECKOUT_SESSION_ID}
```
Stripe Identity supports a `{VERIFICATION_SESSION_ID}` placeholder in `return_url`; use that so the page can also fall back to looking up the row by `stripe_verification_session_id` if the application_id is missing.

**`ApplicationVerificationComplete.tsx`**: read `application_id` from `useSearchParams` first; only fall back to localStorage. Also read `verification_session` to enable the Stripe-session fallback lookup.

### Fix 2 — Distinguish all four real states

Replace the 3-state union with `'loading' | 'success' | 'pending_review' | 'failed' | 'not_found'`:

- **success** → `stripe_verification_status === 'verified'` OR `status === 'verified'`
- **failed** → `stripe_verification_status` in `('canceled','requires_input')` with `rejection_reason` present, OR `status === 'failed'`/`'rejected'`
- **pending_review** → row exists, `stripe_verification_status` is `processing`/`pending`/null but session was started (`stripe_verification_session_id IS NOT NULL`) → show real "we're still confirming, check back shortly" copy + auto-refetch every 5s for ~30s
- **not_found** → no application_id in URL or row not returned → distinct "We couldn't locate your application" message with a link to `/application/status`
- Never show success for a `pending_verification` row that hasn't been verified.

Add one retry on the DB read after a 2s delay (webhook race), but stop collapsing every miss into `error`.

### Fix 3 — Show the actual Stripe reason + retry button

Reason source: the `stripe-identity-webhook` already writes `rejection_reason` (line 643) and stores the full Stripe `last_error` inside `stripe_verification_report` (JSON). Select both columns. Map `last_error.code` to friendly copy:

| code | message |
|---|---|
| `document_expired` | Your ID document is expired. Please upload a current one. |
| `document_unverified_other` / `document_photo_*` | Your ID photo was unclear. Please retake it in good light. |
| `selfie_unverified_other` / `selfie_face_mismatch` | Your selfie didn't match your ID. Please retry the selfie. |
| `id_number_mismatch` / `name_mismatch` | The name on your ID didn't match what you entered. |
| `consent_declined` / `device_not_supported` | Verification was canceled. You can retry from any device. |
| _default_ | Show `rejection_reason` verbatim. |

Add a **"Retry verification"** primary button that calls `supabase.functions.invoke('create-identity-verification', { body: { email, applicationType, metadata: { applicationId, firstName, lastName } } })` and redirects to the returned `url`. Keep the support email as a secondary fallback link, not the primary action.

### Files touched

- **edit** `src/pages/ApplicationVerificationComplete.tsx` — new state machine, URL params, error mapping, retry button
- **edit** `supabase/functions/create-identity-verification/index.ts` — return_url carries `application_id` + `{VERIFICATION_SESSION_ID}`

No DB migration needed — all required columns exist.

### Verification steps

1. Open the page directly with `?type=agent&application_id=<bad-uuid>` → shows `not_found` state (not generic error).
2. Open with a valid `application_id` for a row in `pending_verification` with no session → shows `not_found`.
3. Open with a real `verified` row → success.
4. Force a `failed` row with `rejection_reason='document_expired'` (test row) → shows "Your ID document is expired" + Retry button.
5. Open the email link in a different browser (no localStorage) → still resolves because URL carries `application_id`.
