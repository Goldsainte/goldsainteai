

## Fix Creator Onboarding: Skip Button, Required Stripe, and Submission Bug

### Issues Identified
1. **No skip button** — creators who leave onboarding have no way to return (the `OnboardingRouter` sends them back to `/onboarding/creator`, but if they navigate away there's no menu link)
2. **Stripe verification is optional** — `canProceed()` returns `true` for step 12 (Payment), meaning users can submit without completing Stripe setup
3. **Can't finish last step** — the "Launch My Profile" button calls `handleSubmit()` which updates ~30+ profile columns; likely failing silently due to a column that doesn't exist in the profiles table or a type mismatch, but the error toast may not be visible

### Plan

**1. Add "Skip for Now" button to creator onboarding**
- Add a "Skip for Now" link/button in the navigation area of `CreatorOnboardingPage.tsx`
- On skip: save partial progress to the profile (mark `account_type: 'creator'` but NOT `has_completed_creator_onboarding`) and navigate to `/creator-dashboard` or `/marketplace`
- This lets creators access the platform without completing every step

**2. Add "Complete Onboarding" link in creator dashboard/nav**
- Add a banner or nav item in the creator dashboard that links back to `/onboarding/creator` when `has_completed_creator_onboarding` is false
- This gives creators a way to return and finish onboarding later

**3. Make Stripe Connect required on step 12**
- Change `canProceed()` case 12 to check that Stripe Connect setup has been initiated (check for `stripe_account_id` on the profile or track local state after `handleStripeSetup` succeeds)
- The "Launch My Profile" button should be disabled until Stripe setup is at least started

**4. Debug and fix the last-step submission failure**
- The `handleSubmit` function updates many columns (e.g., `featured_photos`, `preferred_brand_tiers`, `aesthetic_alignment`, `tos_accepted_at`, `tiktok_verified`, `tiktok_follower_count`, etc.) — need to verify all these columns exist in the `profiles` table
- Check the database schema for missing columns and add a migration if needed
- Add better error logging/toast so failures are visible

### Files to Change
1. `src/pages/onboarding/CreatorOnboardingPage.tsx` — add skip button, require Stripe, improve error handling
2. `src/routes/AppRoutes.tsx` or creator dashboard — add "finish onboarding" banner for incomplete creators
3. **Database migration** — add any missing profile columns that cause the submission to fail

### Technical Details
- The `canProceed()` function at line 250 currently returns `true` for step 12 — change to require Stripe
- The skip button should call a lighter version of `handleSubmit` that only saves identity + account_type fields
- Need to query `profiles` table schema to identify missing columns from the ~30 fields in `handleSubmit`

