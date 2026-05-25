## Problem
`AuthCallback.tsx` only listens for a Supabase session via `onAuthStateChange` / `getSession()`. After Google redirects back, nothing invokes the Lovable OAuth SDK to exchange the broker's response for tokens and call `supabase.auth.setSession`. The 5s timeout fires and the user is bounced to `/auth`.

## Fix
Have `AuthCallback` re-invoke `lovable.auth.signInWithOAuth('google', …)` on mount so the wrapper processes the return-leg tokens and seeds the Supabase session, then continue with the existing profile/routing logic.

### Steps
1. In `src/pages/AuthCallback.tsx`:
   - Import `lovable` from `@/integrations/lovable`.
   - At the start of `handleAuthCallback`, before the `getSession` wait, call:
     ```ts
     const result = await lovable.auth.signInWithOAuth('google', {
       redirect_uri: `${window.location.origin}/auth/callback`,
     });
     if (result?.error) { navigate('/auth', { replace: true }); return; }
     if (result?.redirected) return; // shouldn't happen on return leg
     ```
   - Keep the existing `onAuthStateChange` / `getSession` block as a fallback so the SDK's `setSession` is observed.
2. Leave Apple/email flows untouched (they go through `/auth/callback/apple` and Supabase-native flows respectively). Google is the only managed-OAuth provider in use.
3. No DB/edge-function changes required.

### Verification
- Trigger Google sign-in, confirm redirect back to `/auth/callback` establishes a session and routes to the proper destination instead of bouncing to `/auth`.
- Check console for `[AuthCallback]` logs and no "5s timeout" path.