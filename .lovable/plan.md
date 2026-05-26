## Problem
When a user signs up with email, a stale `selectedAccountType` can be restored from `sessionStorage` (under `AUTH_FLOW_STORAGE_KEY`). An earlier abandoned signup leaves a persisted auth flow object there; a later signup restores it and skips the account-type picker, passing the stale type into `supabase.auth.signUp` so the profile is created with the wrong `account_type`.

## Fix (src/pages/Auth.tsx only)

In the `persistedFlow` useMemo (lines 57–66):

1. Parse the stored JSON as before.
2. After parsing, return the stored object **only if** `stored.step === 'verify-email'`.
3. For any other step, return `null` so a new signup always starts fresh and the user passes through the account-type picker.

No other files or logic are changed.

## Verification
- A fresh email signup should always show the account-type picker first.
- A signup where the user already clicked the confirmation link on another device (step=`verify-email`) should still resume correctly.