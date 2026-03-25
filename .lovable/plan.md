

## Fix: Creator Login Loop — Returning Users Sent Back to Onboarding

### Root Cause

The user `creator@goldsainte.com` has `account_type: "creator"` but `is_profile_complete: false` and `onboarding_completed: false`. This happens because the "Skip for now" button in creator onboarding sets `account_type` but does NOT set the completion flags.

On next login, `getPostAuthDestination()` sees `is_profile_complete = false` → sends user to `/auth/complete-profile` → which sees `account_type = "creator"` → redirects to `/onboarding` → which redirects to `/onboarding/creator`. The user ends up in a loop, back at creator setup as if they never registered.

Additionally, `full_name` still reads "Test Creator" because the skip handler wrote `displayName || undefined` (which was empty, so it didn't overwrite).

### Fix (3 changes)

**1. `src/lib/auth/postAuthRouting.ts` — Route incomplete creators directly to onboarding**

Instead of sending all incomplete profiles to `/auth/complete-profile`, add creator-specific routing:

```
if (accountType === "creator" && !isProfileComplete) {
  return "/onboarding/creator";
}
if (accountType === "agent" && !isProfileComplete) {
  return "/onboarding/agent";  // or /apply/agent
}
```

This skips the redundant `/auth/complete-profile` → `/onboarding` → `/onboarding/creator` redirect chain.

**2. `src/pages/onboarding/CreatorOnboardingPage.tsx` — Pre-populate from existing profile data**

Add a `useEffect` that loads the user's existing profile on mount and pre-fills `displayName`, `avatarUrl`, `bio`, etc. so returning users see their previously saved data instead of blank fields.

**3. `src/pages/onboarding/CreatorOnboardingPage.tsx` — Fix `handleSkip` to update `full_name`**

Change `full_name: displayName || undefined` to always write the display name if available, and also sync it from the fetched profile data if the user hasn't typed anything new.

### Files Modified
- `src/lib/auth/postAuthRouting.ts` — role-specific incomplete routing
- `src/pages/onboarding/CreatorOnboardingPage.tsx` — pre-populate fields on mount, fix skip handler

