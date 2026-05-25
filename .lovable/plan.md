# Plan

## What I’ll fix
1. Stop the post-login auth page and callback page from racing each other and sending a fresh Google user away before their profile state settles.
2. Treat a brand-new Google user as an onboarding user first, not as a returning signed-in user.
3. Route incomplete accounts to the profile creation / onboarding flow deterministically.

## What I found
- The OAuth return is already reaching `/auth/callback`, so this does **not** look like a wrong Google redirect URI.
- The backend trigger is already designed to create the profile row for new users.
- The likely break is app-side routing: a new Google user gets a valid session, but the auth/callback/onboarding logic disagrees about where to send them, so they bounce back instead of progressing to setup.
- There is also a mismatch in traveler handling right now: some code treats incomplete travelers as ready, which can skip the setup flow.

## Changes
1. **Harden `src/pages/AuthCallback.tsx`**
   - Keep waiting for session readiness.
   - Distinguish new/incomplete users from returning users using profile state.
   - Send incomplete Google users directly to the right setup route instead of falling through to generic post-auth routing.
   - Avoid fallback-to-`/auth` behavior while the profile row is still appearing.

2. **Align `src/lib/auth/postAuthRouting.ts`**
   - Make traveler routing consistent: incomplete traveler accounts should go to setup/onboarding, not to the normal signed-in destination.
   - Preserve creator / agent / brand routing rules.

3. **Fix auth-page auto-redirects in `src/pages/Auth.tsx`**
   - Prevent the auth screen’s “already logged in” effect from stealing control during the first Google callback/setup pass.
   - Ensure it respects incomplete profile state and sends new users to setup.

4. **Tighten onboarding handoff**
   - Verify `CompleteProfile` / `/onboarding` behavior so a user with a default OAuth-created traveler profile still reaches the actual setup flow instead of looping.

## Expected result
- User picks Google account.
- Account is created in the backend.
- Profile row exists.
- New user lands on profile creation / onboarding.
- Returning user lands on their normal destination.
- No more bounce back to the “One moment” screen.

## Technical details
- No Google Console URI change is likely needed if your current callback URI already matches and the app reaches `/auth/callback`.
- The fix is in frontend routing/state coordination, not in Google OAuth configuration.
- I’ll keep the existing backend profile trigger as the source of truth and only change the client-side routing logic around it.