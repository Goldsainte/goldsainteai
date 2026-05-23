# Replace manual creator approval with Stripe verification gate

## Audit result (most important finding first)

I grep'd the entire repo (src, supabase/functions, supabase/migrations) for `creator_status`. Results:

- **No RLS policy gates on `creator_status`.** Marketplace visibility of `packaged_trips` / `itinerary_products` is driven by their own `status` column (`pending_review` → `published`), not by the creator's approval state.
- **No edge function reads `creator_status`.** No search, ranking, or matching function depends on it.
- **Only 4 client files reference it:** `TripBuilderPage.tsx`, `ItineraryBuilderPage.tsx`, `CreatorOnboardingPage.tsx`, `AdminCreatorApprovalsPage.tsx` (plus generated `types.ts`).
- **One migration** (`20260512023311_…sql`) added the column with default `'pending'` and an admin-only UPDATE policy.

**Conclusion:** removing the client-side `creator_status` gates fully unblocks creators. No marketplace visibility filter needs to change. The DB column can stay (harmless legacy) — no destructive migration needed for this change.

## Changes

### 1. `src/pages/onboarding/CreatorOnboardingPage.tsx`
- `handleSubmit` (line ~326): remove the `creator_status: "pending"` field from the profile update. We stop writing it entirely and treat publishing as a pure Stripe gate.
- Welcome card (lines ~398–415): remove the "In review" chip and the "Your profile is in review / publishing unlocks after approval" banner. Replace with:
  - A "Live" chip (green) next to the display name.
  - A panel: **"Your profile is live"** — "Travelers can discover and follow you now. One step left before you can publish bookable trips: connect Stripe to verify your identity and unlock payouts."
- Keep the existing "Set up payouts" block and "Connect payouts in Earnings" button unchanged.

### 2. `src/pages/TripBuilderPage.tsx` (lines 104–128)
- `.select("stripe_account_id, creator_status")` → `.select("stripe_account_id, stripe_charges_enabled")`.
- Delete the `creator_status !== "approved"` block entirely.
- Change the Stripe check from `!profile?.stripe_account_id` to `!profile?.stripe_charges_enabled`.
- Update the toast: *"Finish Stripe payout verification to unlock publishing. You can save drafts in the meantime."* — keep the existing `action: { label: "Open Earnings", onClick: … }`.

### 3. `src/pages/ItineraryBuilderPage.tsx`
- Remove the `creatorStatus` state, the `useEffect` at lines 52–60 that fetches it, and the gate at line 109.
- Add the same Stripe check as TripBuilder before publishing: fetch `stripe_charges_enabled` and block publish with the same toast + "Open Earnings" action. Drafts always allowed.
- After this, TripBuilder and ItineraryBuilder behave identically.

### 4. Retire `AdminCreatorApprovalsPage`
- The route `/admin/creator-approvals` is registered in `src/routes/AppRoutes.tsx` but **no nav link, button, or import anywhere else points to it** (confirmed via grep — only the route registration and the file itself reference it).
- Decision: **remove the route registration and delete the page file.** Clean removal, nothing to break. (If you'd prefer to keep it as a read-only "all creators" view, say the word and I'll convert it instead — but since nothing links to it, deletion is cleaner.)

### 5. Not changing
- The `profiles.creator_status` column and its admin-only UPDATE policy. Harmless legacy; removing would require a destructive migration with no benefit since no code reads it after this change.
- `trip_status` review flow (`pending_review` → admin promote → `published`). Trip-level editorial review is separate from creator-level approval and remains intact per your final flow description.

## Resulting flow

Onboarding completes → profile is live immediately (no `creator_status` written) → creator builds a trip → "Save draft" always works → "Publish" blocked **only** while `stripe_charges_enabled = false`, with an actionable toast linking to Earnings → creator completes Stripe Connect identity verification → `stripe_charges_enabled` flips true (already synced by `check-creator-stripe-status`) → publish succeeds → trip enters `pending_review` → editor promotes → trip appears in marketplace.
