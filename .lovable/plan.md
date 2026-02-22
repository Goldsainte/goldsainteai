

# Hide "Built for Every Side" Section from Homepage

## What's Changing

Comment out the `BuiltForEverySideSection` from `src/pages/Index.tsx` and `src/pages/HomePage.tsx` so it no longer renders on the homepage. The component code stays untouched -- it can be re-enabled anytime by uncommenting.

Also swap the order so `RoleSpecificCTAs` comes before where `BuiltForEverySideSection` was, matching your earlier request.

## Files

**`src/pages/Index.tsx`** -- Comment out `BuiltForEverySideSection`, keep `RoleSpecificCTAs` in its place.

**`src/pages/HomePage.tsx`** -- Same change for consistency.

## Result

Homepage flow becomes:
1. Hero
2. How Goldsainte AI Works
3. Curated Journeys
4. Choose How You Join Goldsainte AI
5. Trust, Safety & Payments
6. Trust Footer (mobile)

The component and its code remain intact for easy re-activation.
