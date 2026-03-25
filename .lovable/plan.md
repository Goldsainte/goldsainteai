

## Move Stripe Setup from Creator Onboarding to Creator Dashboard

### What Changes

**1. Remove Step 5 ("Get Paid") from creator onboarding**
- Reduce `STEPS` array from 5 to 4 steps (About You, Your Niche, Portfolio, Standards)
- Remove the `stripeSetupStarted` state and `handleStripeSetup` function
- Remove the Step 5 UI block (lines 811-869) and the Stripe button from navigation (lines 893-901)
- Update `canProceed()` to remove the `case 4` check
- The final step is now Step 4 (Standards & Legal) — submit triggers on `currentStep === 3`

**2. Add Stripe Connect setup to the Earnings tab in Creator Dashboard**
- Import and render the existing `StripeConnectOnboarding` component at the top of `CreatorEarningsTab.tsx`
- Show it when the creator has no connected Stripe account (check `stripe_account_id` from profile)
- Display a banner: "Connect your payment account to start receiving earnings"

**3. Gate trip publishing on Stripe setup**
- In the Trip Builder's publish flow, check if the creator has a `stripe_account_id` before allowing publish
- If not, show a prompt directing them to the Earnings tab to set up payments first

### Files Modified
- `src/pages/onboarding/CreatorOnboardingPage.tsx` — remove Step 5, reduce to 4 steps
- `src/pages/creator/components/CreatorEarningsTab.tsx` — add `StripeConnectOnboarding` component
- Trip Builder publish logic — add Stripe account check before publishing

