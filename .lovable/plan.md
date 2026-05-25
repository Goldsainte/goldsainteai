## Goal
Make Google signup create the user account, wait for the backend profile to exist, and route first-time users to the correct account setup/onboarding page instead of looping back to the callback/loading screen.

## What I’ll change
1. Update the OAuth callback flow so it distinguishes first-time Google signups from returning Google sign-ins.
2. Adjust post-auth routing for new users so they go to account setup/onboarding immediately after profile creation.
3. Harden the callback/session readiness logic to avoid redirecting before auth and profile state are fully available.
4. Verify the route decision against the current role logic for traveler, creator, agent, and brand.

## Expected outcome
- New Google users: account is created, profile is available, then they land on the correct setup page.
- Returning Google users: they continue to their normal destination.
- No more immediate reroute back to the loading/callback screen.

## Technical details
- `src/pages/AuthCallback.tsx`
  - Refine the callback sequence after `lovable.auth.signInWithOAuth('google', ...)`.
  - Add clearer first-time-user routing based on the created profile and pending account type.
  - Prevent premature fallback to `/auth` while session/profile restoration is still settling.
- `src/lib/auth/postAuthRouting.ts`
  - Align post-auth destination logic with the desired onboarding behavior for fresh accounts.
- `src/components/routing/OnboardingRouter.tsx`
  - Ensure the onboarding router sends incomplete users to setup, not directly to a post-login destination.

## Notes
I found a mismatch in the current routing rules: new traveler accounts are effectively treated like fully-routed users, which conflicts with your expected “create account, then account setup page” flow.