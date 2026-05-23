# End-to-end creator publish-gate test

## What I'll do

1. **Sign up a throwaway creator** in the preview (`creator+test-<timestamp>@goldsainte.test`) and complete all 5 onboarding steps, exercising every Continue/Back/Skip button.
2. **Verify the welcome card** shows the new "Live" chip and Stripe-verification copy (no "in review" wording).
3. **Click "Connect payouts in Earnings"** to confirm the handoff exists, then **abandon Stripe** (don't complete it).
4. **Go to Trip Builder**, fill in a minimal trip:
   - Click **Save draft** → expect success.
   - Click **Publish** → expect block with toast "Finish Stripe payout verification…" and "Open Earnings" action.
5. **Simulate Stripe verification** by flipping `stripe_charges_enabled = true` (and setting a fake `stripe_account_id` if null) on the test creator's `profiles` row via the insert tool. This stands in for the real Stripe Connect webhook, which can't run from browser automation.
6. **Return to Trip Builder** → click **Publish** → expect success, trip row appears in `packaged_trips` with `status = 'pending_review'`.
7. **Repeat steps 4–6 in the Itinerary Builder** to confirm identical behavior (draft works, publish blocked pre-Stripe, publish succeeds post-Stripe, row in `itinerary_products` with `status = 'pending_review'`).
8. **Cleanup**: delete the test creator's profile + auth row + any created trips via the existing account-moderation edge function (or direct DB delete) so the preview DB stays tidy.

## What I'll report back

For each of the 7 numbered steps: pass/fail, exact toast/copy seen, screenshot of key states (welcome card, blocked publish, successful publish), and the resulting DB row ids + status values.

## Caveats

- Stripe Connect identity verification is simulated via DB flip, not a real Stripe round-trip. This faithfully tests the **app's gate logic** (which is what changed), but does not test the **webhook → `stripe_charges_enabled` flip** path itself. If you want the webhook path verified too, that needs to be done manually in the preview with a real Stripe test identity.
- If signup hits email confirmation, I'll either disable auto-confirm requirement for the test or use the admin path; will flag before proceeding.
- All actions run against the preview DB only.
