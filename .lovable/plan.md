

# Simplify Traveler Onboarding: Remove AI Intake, Route to Traveler Hub

## Summary
Remove the multi-page traveler preferences wizard and Madison-based AI intake. New travelers go straight from account creation to the Traveler Hub (`/traveler`) where they fill out their profile. The flow becomes: **Sign Up → Complete Profile (role picker) → Traveler Hub**.

## Changes

### 1. Update post-auth routing (`src/lib/auth/postAuthRouting.ts`)
- Change traveler destination from `/onboarding/traveler/preferences` to `/traveler`
- For travelers, skip the `onboarding_completed` check — treat account type + profile complete as sufficient
- Auto-mark `onboarding_completed = true` is no longer a gate for travelers

### 2. Update `useRequireOnboarding` hook (`src/hooks/useRequireOnboarding.ts`)
- For travelers: remove the redirect to `/onboarding/traveler/preferences`
- Instead, just allow access if user has `account_type = 'traveler'` (regardless of `onboarding_completed`)
- Keep creator/agent checks as-is

### 3. Update `OnboardingRouter` (`src/components/routing/OnboardingRouter.tsx`)
- Change the `case 'traveler'` destination from `/onboarding/traveler/preferences` to `/traveler`

### 4. Update routes (`src/routes/AppRoutes.tsx`)
- Remove the `/onboarding/traveler/preferences` route (or redirect it to `/traveler`)
- Keep `/onboarding/creator` and other non-traveler onboarding routes intact

### 5. Update `OnboardingWelcomeModal` (`src/components/OnboardingWelcomeModal.tsx`)
- Change traveler CTA from "Post your first trip" → "Set up your Traveler Hub" pointing to `/traveler`

### 6. Mark legacy preferences page as redirect
- Change `TravelerPreferencesOnboardingPage` route to `<Navigate to="/traveler" replace />` so any old links still work

### 7. Remove Madison references
- Remove `MadisonChat` component usage from `ConciergePage.tsx` (replace with redirect to `/traveler` or marketplace)
- Remove the `/concierge` route or redirect it
- Remove `AIBookingConcierge` floating widget from `App.tsx`
- Remove `src/lib/madisonPersona.ts`
- Remove `src/hooks/useMadisonConversation.ts`
- Remove `src/components/MadisonChat.tsx`

### 8. Clean up `RequireOnboarding` (`src/components/routing/RequireOnboarding.tsx`)
- Update to skip the preferences check for travelers — if profile exists with `account_type = 'traveler'`, allow through

### 9. Auto-complete onboarding flag for new travelers
- In `CompleteProfile.tsx` (the role picker page), when a user selects "traveler", also set `onboarding_completed: true` and `is_profile_complete: true` so they aren't caught by legacy guards

## Files affected
- `src/lib/auth/postAuthRouting.ts`
- `src/hooks/useRequireOnboarding.ts`
- `src/components/routing/OnboardingRouter.tsx`
- `src/components/routing/RequireOnboarding.tsx`
- `src/routes/AppRoutes.tsx`
- `src/components/OnboardingWelcomeModal.tsx`
- `src/App.tsx` (remove AIBookingConcierge)
- `src/pages/ConciergePage.tsx` (redirect or simplify)
- `src/pages/CompleteProfile.tsx` (auto-set onboarding flags for travelers)
- Delete: `src/lib/madisonPersona.ts`, `src/components/MadisonChat.tsx`

## Not touched
- Creator onboarding (`CreatorOnboardingPage.tsx`) — stays as-is
- Agent/brand application flows — unchanged
- Traveler Hub page itself — already exists with Profile, Settings, Preferences tabs
- `TravelPreferencesWizard` component — stays available inside Settings tab of Traveler Hub for optional use

