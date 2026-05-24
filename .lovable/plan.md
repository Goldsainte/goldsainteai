# Fix signup UX bugs: stale draft prompt + cross-device verification

Two independent bugs from the `info@cornellfacilities.com` signup. Both are small, surgical fixes.

## Bug 1 — "Resume your previous draft?" shown to brand-new users

**Cause:** `src/pages/AgentApplicationForm.tsx` reads a single shared `localStorage` key (`agent_application_draft`) on mount and prompts to resume — regardless of which user is signed in. So any leftover draft from a previous session on that browser is offered to a brand-new account.

**Fix:** Scope the draft to the current user.
- Change the storage key to `agent_application_draft:<user.id>` (only known after auth loads).
- Only check/restore the draft if a key exists for *this* user_id.
- On logout/account switch, the other user's draft is ignored (not surfaced).
- Migrate-or-discard: if the legacy unscoped key exists, only offer it to the user whose `email` inside the stored payload matches the signed-in profile's email; otherwise silently delete it.

This makes the prompt only appear when the *current* user truly has an in-progress draft.

## Bug 2 — "Already verified? Continue" fails when user verifies on another device

**Cause:** With email confirmation enabled, `supabase.auth.signUp()` does **not** create a session until the email is confirmed. So on the desktop tab:
- There is no session, so `supabase.auth.getUser()` returns `null`.
- The polling loop (lines 190-234) and the "Already verified? Continue" button (lines 1003-1021) can never detect that the user clicked the link on their phone — the desktop has no token to refresh against the server.

**Fix:** Add a tiny public edge function `check-email-verified` that takes `{ email }` and returns `{ verified: boolean }` by looking up `auth.users.email_confirmed_at` via the service role key. Then:
- In the verify-email polling loop, if no session is present, fall back to calling this endpoint every poll cycle with the signup email.
- In the "Already verified? Continue" button, if `getUser()` returns no confirmed user, call the same endpoint as a fallback. If it returns verified, send the user to `/auth?mode=signin` (or directly sign them in if we can) with a toast asking them to sign in once — since we have no session token from the phone we can't auto-create one on desktop, but we can stop falsely telling them they aren't verified.

The endpoint only returns a boolean, never user data, so it is safe to expose unauthenticated. Add basic rate-limit handling (return boolean even on miss — no email enumeration risk beyond what signup already exposes).

## Files touched

- `src/pages/AgentApplicationForm.tsx` — scope draft key by user id, migrate legacy key safely.
- `supabase/functions/check-email-verified/index.ts` (new) — service-role lookup of `email_confirmed_at` by email.
- `supabase/functions/check-email-verified/deno.json` (new).
- `supabase/config.toml` — register new function with `verify_jwt = false`.
- `src/pages/Auth.tsx` — use the new endpoint as a fallback in both the polling effect and the "Already verified? Continue" handler; on confirmed-but-no-session, route to sign-in with prefilled email and a clear toast ("Verified on another device — please sign in here to continue").

## Validation

1. Sign up fresh on desktop with a new email; **do not** click verify on desktop. Open verification link on a second device. Within ~5s the desktop tab advances (or shows the "verified, please sign in" prompt if no session exists).
2. Sign up as a brand-new agent in a browser that previously held a draft from another email — no "Resume previous draft?" prompt appears.
3. Same user reloading mid-application still gets their *own* draft prompt.
