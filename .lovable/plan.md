# Re-architect: Account → Verify Email → Application

## Goal
Stop doing `auth.signUp()` from inside the agent application. Make account creation a separate, prior step, gate the application behind email verification, and resume the application on next sign-in. Fix the email pipeline first so verification actually arrives.

## Step 0 — Fix email delivery (prerequisite, same change)

The queue currently has **25 pending emails older than 10 minutes** — the dispatcher is not draining. Without this, no agent can pass the new gate.

Actions:
1. Run the managed setup repair (`setup_email_infra`) to recreate the vault secret + `process-email-queue` cron and refresh the service-role key binding. Safe/idempotent.
2. Call `verify-email-infra` and require it to return `healthy: true` (vault secret present, cron active, no stuck pending, no DLQ spike) before merging.
3. Re-deploy `auth-email-hook` so Supabase Auth routes confirmation emails through our branded queue-backed template, not Supabase's rate-limited built-in sender.
4. Confirm in Cloud → Emails that the Send Email Hook is enabled and pointed at `auth-email-hook`.
5. Smoke-test: sign up a throwaway address, confirm the email arrives within ~30s, and `email_send_log` shows `sent` (not `pending`/`dlq`).

If `verify-email-infra` still fails after repair, stop and surface the failing check — do not ship the reorder.

## Step 1 — New "Create agent account" page (`/apply/agent/signup`)

New page `src/pages/AgentSignup.tsx`. Fields: first name, last name, email, phone, password, confirm password, ToS checkbox. On submit:

- Run existing duplicate-email guard (`isDuplicateEmailError` / `isDuplicateEmailSignupResponse` from `@/lib/auth/duplicateEmail`).
- `supabase.auth.signUp({ email, password, options: { data: { first_name, last_name, phone, account_type: 'agent', intended_flow: 'agent_application' }, emailRedirectTo: ${origin}/apply/agent?verified=1 } })`.
- On success show "Check your email" screen with resend button (rate-limited client-side).
- Do **not** create an `agent_applications` row yet.

Profile row: the `handle_new_user` trigger (or equivalent) should pick up `account_type='agent'` + name/phone from `raw_user_meta_data`. If it doesn't already, extend it in the migration so the profile is seeded at signup.

## Step 2 — Email verification gate

`emailRedirectTo` lands the user on `/apply/agent?verified=1`. Supabase exchanges the token → user now has a real session. No custom verification page needed for this path (the existing `ApplicationVerificationComplete` page stays, but is only used for Stripe Identity return).

## Step 3 — Application form, authenticated only

Refactor `src/pages/AgentApplicationForm.tsx`:

- Wrap the route in an auth + email-confirmed guard. If `!user` → redirect to `/apply/agent/signup`. If `user && !user.email_confirmed_at` → show "Verify your email to continue" with resend.
- **Delete the `supabase.auth.signUp(...)` block** (around line 329) and all downstream "authUser may be null" handling. `userId` comes from `useAuth()` from the first render.
- Prefill step 1 fields (first name, last name, email, phone) from `profiles` + `auth.user` — editable, but no re-typing required.
- Document uploads continue to call the `upload-application-document` edge function; with a real session, RLS is no longer the concern, but keep the edge-function path since it's already the contract.
- On final submit: upsert (not insert) `agent_applications` keyed by `user_id` so resuming overwrites the in-progress row instead of creating duplicates.

## Step 4 — Resume-on-login routing

Update `src/lib/auth/postAuthRouting.ts` and `src/components/routing/OnboardingRouter.tsx`:

- For `account_type='agent'`:
  - No `agent_applications` row → `/apply/agent` (start fresh).
  - Row exists with status `draft` / `pending_verification` (and no Stripe session) → `/apply/agent` (resume).
  - Row with Stripe session in progress → `/application/status?email=...`.
  - `verified` / `approved` → `/partner`.
- Email not yet confirmed at sign-in → `/apply/agent/signup?unverified=1` showing resend, **not** the homepage and **not** a dead-end "confirm your email" screen.

## Step 5 — Schema / data

Migration:
- Make `agent_applications.user_id` `NOT NULL` and `UNIQUE` (one in-flight app per user). Backfill / drop any orphan rows first.
- Add `status='draft'` to the allowed values if not present.
- Extend `handle_new_user` trigger to copy `account_type`, `first_name`, `last_name`, `phone` from `raw_user_meta_data` into `profiles` when present.

## Step 6 — Cleanup

- Remove the in-form signup branch, the "session may not exist yet" comments, and the localStorage `agent_application_id` writes from the signup path (the URL-based identifier from the prior fix stays for the Stripe return).
- Keep `ApplicationVerificationComplete` only for the Stripe Identity return URL.

## End-to-end verification

1. New email → `/apply/agent/signup` → submit → "check your email" → email arrives (queue drained) → click link → lands on `/apply/agent` already signed in, name/email/phone prefilled.
2. Fill application, upload docs (RLS passes because `auth.uid()` is set), submit → Stripe Identity → return → `verified`.
3. Sign out mid-application, sign back in → routed straight to `/apply/agent` with prior answers.
4. Duplicate email at step 1 → guarded with existing duplicate-email helper.
5. Sign in before clicking confirmation link → `/apply/agent/signup?unverified=1` with resend.

## Files touched
- new: `src/pages/AgentSignup.tsx`
- edit: `src/pages/AgentApplicationForm.tsx` (remove signUp, add guard, prefill, upsert)
- edit: `src/routes/AppRoutes.tsx` (add `/apply/agent/signup`)
- edit: `src/lib/auth/postAuthRouting.ts`, `src/components/routing/OnboardingRouter.tsx`
- new migration: `agent_applications` constraints + `handle_new_user` extension
- ops: `setup_email_infra`, redeploy `auth-email-hook`, verify via `verify-email-infra`
