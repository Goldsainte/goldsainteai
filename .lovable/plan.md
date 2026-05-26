## Problem
A user who selected "Traveler" can end up with `account_type = 'creator'` and be routed to `/onboarding/creator`. Root cause: a stale `pending_account_type` value in sessionStorage from an earlier abandoned signup is applied to a later unrelated OAuth flow.

## Changes

### 1. `src/pages/Auth.tsx` — `handleGoogleSignIn`

Add an `else` branch to the existing `if (selectedAccountType)` block so that when **no** account type is selected, stale sessionStorage keys are explicitly cleared instead of left behind.

Current code (lines 563–572):
```
if (selectedAccountType) {
  sessionStorage.setItem('pending_account_type', selectedAccountType);
  sessionStorage.setItem('pending_welcome_email', ...);
}
```

Change to:
```
if (selectedAccountType) {
  sessionStorage.setItem('pending_account_type', selectedAccountType);
  sessionStorage.setItem('pending_welcome_email', ...);
} else {
  sessionStorage.removeItem('pending_account_type');
  sessionStorage.removeItem('pending_welcome_email');
}
```

### 2. `src/pages/AuthCallback.tsx` — pending-account-type guard

Before overriding `profiles.account_type` from `pending_account_type`, check that the profile is **brand new** — i.e. `is_profile_complete !== true` AND `onboarding_completed !== true` AND no `first_name`/`last_name`.

Current code (lines 151–174) unconditionally updates `account_type` if `pendingAccountType` differs. Change so the update only runs when the profile has no identity/completion markers.

Apply the **same brand-new guard** to the `pendingAccountType === 'agent'` block (lines 176–200) so an existing profile is never silently promoted to agent.

No other files or routing logic are touched.
