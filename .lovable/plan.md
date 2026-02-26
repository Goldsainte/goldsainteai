

# Fix: Invisible "Submit Your Proposal" Button

## Root Cause

The button uses `bg-[hsl(var(--gs-green-dark))]` but the CSS variable `--gs-green-dark` is never defined in the stylesheet. This means the button renders with no background color — making white text on a white card completely invisible.

This also affects the mobile sticky CTA bar at the bottom of the page, which uses the same undefined variable.

## Fix

**File:** `src/pages/marketplace/TripRequestDetail.tsx`

Replace all instances of `bg-[hsl(var(--gs-green-dark))]` with the actual Goldsainte dark teal color `bg-[#0c4d47]` (the brand's CTA color used across every other page).

Two locations to fix:
1. **Line 588** — sidebar "Submit Your Proposal" button
2. **Line 641** — mobile sticky bottom bar "Submit Your Proposal" button

No new files needed. Single file, two line changes.

