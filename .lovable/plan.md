# Fix auth + password reset on goldsainte.ai

## Root cause recap

Your frontend (`src/integrations/supabase/client.ts`) is hardcoded to backend **`ktzsgqrqvwtxlimctkaf.supabase.co`** — that's where your real users live. But:

1. **Signup fails** with `unexpected_failure: Hook requires authorization token` because an **Auth Hook** is enabled in that project's dashboard, and its HTTP hook secret is missing/wrong. GoTrue refuses every signup/recovery until that's fixed.
2. **Password reset fails** because the `request-password-reset` edge function is not deployed on `ktzsgqrqvwtxlimctkaf` (Lovable's tools can only deploy to a different, unused project `iwdevxltjuedijrcdejs`).

Both fixes have to happen on **your own Supabase dashboard** for project `ktzsgqrqvwtxlimctkaf` — I can't reach that project from Lovable. The steps below are what you run.

---

## Step 1 — Unblock signup (Supabase dashboard, 2 min)

1. Open your Supabase dashboard → project `ktzsgqrqvwtxlimctkaf` → **Authentication → Hooks**.
2. You'll see one or more enabled hooks (likely "Send Email Hook" or "Custom Access Token Hook"). For each enabled hook:
   - **Option A (fastest):** toggle it **off**. Default Supabase auth emails will resume, signup will work immediately.
   - **Option B (keep custom hook):** paste a valid **HTTP Hook Secret** that matches what the hook endpoint expects (the `v1,whsec_…` value from whichever service is receiving the webhook). Save.
3. Retry signup on goldsainte.ai — the `Hook requires authorization token` error disappears.

## Step 2 — Configure Site URL & Redirect allowlist

In the same dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://goldsainte.ai`
- **Redirect URLs** (add all of these):
  - `https://goldsainte.ai/**`
  - `https://www.goldsainte.ai/**`
  - `https://goldsainte.com/**`
  - `https://goldsainteai.lovable.app/**`
  - `https://a7969815-170e-4304-bb8c-07f694c52257.lovableproject.com/**`

## Step 3 — Deploy the password-reset edge function to `ktzsgqrqvwtxlimctkaf`

From your local machine, in the project root:

```bash
npx supabase login
npx supabase link --project-ref ktzsgqrqvwtxlimctkaf
npx supabase functions deploy request-password-reset --no-verify-jwt
```

Also deploy any other functions the password-reset flow depends on (the email sender / queue worker). Safest:

```bash
npx supabase functions deploy
```

(deploys every function in `supabase/functions/`). Then set the secrets that those functions need on the same project:

```bash
npx supabase secrets set RESEND_API_KEY=... LOVABLE_API_KEY=... ALLOWED_ORIGIN=https://goldsainte.ai
```

(use whichever of these you actually have; `_shared/cors.ts` already allows the goldsainte / lovable origins explicitly so `ALLOWED_ORIGIN` is only needed for an extra origin.)

## Step 4 — Widen CORS allowlist for `goldsainte.com` and the test portal

I'll update `supabase/functions/_shared/cors.ts` to add:

- `https://goldsainte.com`
- `https://www.goldsainte.com`
- `https://a7969815-170e-4304-bb8c-07f694c52257.lovableproject.com`

(`goldsainte.ai`, `www.goldsainte.ai`, `*.lovable.app` are already covered.)

After the file change, re-run `npx supabase functions deploy` (Step 3) so the new CORS list ships to `ktzsgqrqvwtxlimctkaf`.

## Step 5 — Verify

1. Hard refresh goldsainte.ai (Ctrl+F5).
2. Try **signup** with a fresh email → should succeed (no more "Hook requires authorization token").
3. Try **password reset** → POST to `/functions/v1/request-password-reset` should return `200` with proper CORS headers.

---

## Technical notes

- **Why I can't do steps 1–3 for you:** Lovable's Supabase tooling is bound to the Lovable Cloud project (`iwdevxltjuedijrcdejs`). `ktzsgqrqvwtxlimctkaf` is an external project linked only in the frontend client file, so dashboard edits and function deploys for it must be done by you (CLI / web dashboard).
- **Do not repoint `client.ts`** to the Lovable Cloud project — it has empty data; you'd lose access to all real users/trips/storyboards.
- The CORS file already uses an allowlist of explicit origins + a `.lovable.app` suffix match; Step 4 just extends that list. The file edit itself is small and safe (frontend-only / shared helper).

## What I'll do once you approve

- Edit `supabase/functions/_shared/cors.ts` to add `goldsainte.com`, `www.goldsainte.com`, and the lovableproject preview origin.
- Hand the file back to you to redeploy via `npx supabase functions deploy` (Step 3).

Everything else (auth hook, URL config, CLI deploy, secrets) is dashboard/CLI work on your side because the target project is outside Lovable's reach.
