## Auth Fixes Plan

Five targeted fixes across three files.

### 1. `src/pages/Auth.tsx` — Clear selectedAccountType on sign-in nav
Locate the three "Already have an account? Sign in" handlers (account-type step footer, email step footer when `isSignUpMode`, signup step back button). Add `setSelectedAccountType(null)` before each `setStep('email')` call.

### 2. `src/pages/Auth.tsx` — Navigation fallback in handleSignIn
At the end of `handleSignIn`, after `setIsLoading(false)` in the success path, append:
```js
const destination = redirectTarget ?? '/marketplace';
navigate(destination, { replace: true });
```

### 3. `src/contexts/AuthContext.tsx` — Fix bootstrapSession race
- Add `const sessionSetByListener = useRef(false)` at top of component.
- In `onAuthStateChange` callback, after setting user/session: `sessionSetByListener.current = true`.
- In `bootstrapSession`, before `supabase.auth.getSession()`:
```js
if (sessionSetByListener.current) { setIsLoading(false); return; }
```

### 4. `src/contexts/AuthContext.tsx` — Guard handleSessionSyncFailure
Wrap the function body's first line:
```js
if (!SESSION_SYNC_ENABLED) { setIsLoading(false); return; }
```

### 5. `src/pages/AuthCallback.tsx` — Use user_metadata.account_type on profile create
Read `accountType` from `session.user.user_metadata?.account_type` and insert it into the new profile. Update `needsCompletion` logic so travelers (account_type set via metadata) route to `/traveler` instead of `/auth/complete-profile`.

### Verification
Read each file before patching to confirm exact context. Confirm `SESSION_SYNC_ENABLED` is exported/accessible in AuthContext (import from `session-service` if needed).
