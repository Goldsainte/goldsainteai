

# Fix: Skip Account Type Screen When Role Is Pre-selected

## Problem
When users click role-specific CTAs from the homepage (e.g., `/auth?mode=signup&role=traveler`), the `role` param is correctly parsed and stored in `selectedAccountType`, but `getInitialStep()` (line 41-48) always returns `'account-type'` for signup mode, ignoring the pre-selected role.

## Changes

### `src/pages/Auth.tsx` — Update `getInitialStep()`
Change the initial step logic so that if `role` is already provided in the URL, skip the account-type selection and go straight to the email step:

```typescript
const getInitialStep = (): AuthStep => {
  if (mode === 'signup') {
    // If role already selected via URL, skip account-type picker
    if (roleFromUrl && ['traveler', 'creator', 'agent', 'brand'].includes(roleFromUrl)) {
      return 'email';
    }
    return 'account-type';
  }
  return 'email';
};
```

That's it. The rest of the flow already works correctly:
- `selectedAccountType` is already initialized from `roleFromUrl` (line 51-53)
- `isSignUpMode` correctly detects signup context (line 65)
- `handleContinueWithEmail` routes to signup form when `selectedAccountType` is set (line 156)
- `handleSignUp` passes `selectedAccountType` to Supabase metadata and the `handle_new_user` trigger stores it in `profiles.account_type`
- Agent/brand roles correctly redirect to application flows (lines 282-318)

No other files need changes.

