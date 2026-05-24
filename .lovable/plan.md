## What's actually happening

You did reach the new signup page (`/apply/agent/signup`, heading "Create your Goldsainte advisor account"), filled in your details, and clicked the button. Then you landed on the application form without ever seeing a "check your email" screen.

The cause is **two layers stacking up**:

1. **Auto-confirm email is enabled on the auth project.** When that's on, `supabase.auth.signUp()` immediately returns a fully authenticated session with `email_confirmed_at` already set. No confirmation email is ever required.
2. **`AgentSignup.tsx` (lines 38–42) has a `useEffect` that redirects any verified, signed-in user to `/apply/agent`.** It was meant to bounce *returning* verified users in — but because of #1, it also fires the instant you finish signup, so the check-email panel never renders.

Net effect: signup → instant session → effect fires → application form. Exactly what you're seeing.

The application form itself is the current (correct) form. It only looks "old" because you reached it via the wrong path — skipping verification.

## Fix

### 1. Turn off auto-confirm in auth settings
Use `configure_auth` with `auto_confirm_email: false` so Supabase actually sends the confirmation email and withholds the session until the user clicks the link.

### 2. Harden `AgentSignup.tsx` so it can't skip the check-email screen
- After a successful `signUp()` call, **always** show the "Confirm your email" panel (set `checkEmailFor` before returning), regardless of whether a session came back.
- Change the redirect `useEffect` so it only sends a verified user into the application when the page is loaded fresh (e.g. from a returning sign-in) — not while we're sitting on the just-submitted "check your email" panel. Concretely: skip the redirect while `checkEmailFor` is set.
- Defensive: if `signUp()` somehow returns a session with `email_confirmed_at` already set (e.g. someone re-enables auto-confirm later), immediately call `supabase.auth.signOut()` before showing the check-email panel, so the user can't be silently logged in without verifying.

### 3. Tighten the gate on `/apply/agent` (belt-and-braces)
`AgentApplicationForm.tsx` already redirects unauth / unverified users to `/apply/agent/signup`. Keep that. Add one extra signal: if we just arrived from the signup form (e.g. `location.state.justSignedUp`), force-render the signup check-email screen even if a session exists, so we never land on the form mid-flow.

## Files

- (auth config) `configure_auth` → `auto_confirm_email: false`
- `src/pages/AgentSignup.tsx` — always show check-email after signup; suppress auto-redirect while check-email panel is active; sign out if signup unexpectedly returns a confirmed session
- `src/pages/AgentApplicationForm.tsx` — keep gate; minor safety check on `email_confirmed_at`

## End-to-end flow after the fix

1. Click "Apply as a Travel Agent" → `/apply/agent` → unauthenticated → redirect to `/apply/agent/signup`.
2. Fill name / email / phone / password → "Create account & send confirmation".
3. Supabase sends the confirmation email. Page shows the **"Confirm your email — we sent a link to …"** panel with Resend.
4. User clicks the email link → returns to `/apply/agent?verified=1` with a real session and `email_confirmed_at` set → the application form renders, prefilled from the profile + auth metadata.
5. Complete the application → Stripe Identity → account active.
6. If they close the tab between steps 3 and 4: signing in later routes them straight to `/apply/agent` to resume (already wired in `postAuthRouting`).

## Note on existing test accounts

Any account you created during this session was auto-confirmed. After the fix they will still be considered verified (they have `email_confirmed_at`). To actually exercise the new flow you'll need a brand-new email address.
