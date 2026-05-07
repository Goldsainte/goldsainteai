## Goal
Clean up the mobile layout of all three homepage animations so every card, chip, and caption sits flush inside the frame without overlapping.

## What I found
All three animation components share the same structural issue on mobile:
- The floating caption sits at the very bottom of the canvas.
- Other chips / callouts are also anchored to the bottom.
- On 390px viewports, those elements collapse into the same visual space.
- Some inner card rows are still too tight, so text and badges crowd each other.

## Files
- `src/components/home/TravelerDiscoveryMagic.tsx`
- `src/components/home/CreatorAIMagic.tsx`
- `src/components/home/AgentProposalMagic.tsx`

## Plan

### 1. Create a safe bottom zone in every animation
- Replace the current floating pill caption treatment with a dedicated bottom-safe caption area.
- Keep the caption visually consistent with the luxury editorial style, but make it reserve space instead of floating over content.
- Update each scene container’s bottom padding so content clears that reserved strip.

### 2. Reposition all bottom-anchored chips above the caption zone
- Move all “recommended”, “viewing now”, “protected”, “itinerary sent”, and similar pills upward on mobile.
- Use mobile-specific offsets so they remain inside the composition and don’t collide with the caption.
- Keep wider desktop spacing unchanged where possible.

### 3. Tighten the traveler scene layouts
- In `TravelerDiscoveryMagic`, fix the recurring crowding in:
  - the “Trending in Summer” scene
  - the “Trip Confirmed” scene
- Reduce collision between the save badge and heart button.
- Give the day cards more deterministic width and slightly tighter internal spacing so text stays inside the boxes.

### 4. Tighten the creator scene layouts
- In `CreatorAIMagic`, adjust the final monetization scene so the confirmation chips and CTA state changes no longer fight for the same bottom area.
- Keep the phone frame readable while ensuring the caption and lower meta elements have their own space.

### 5. Tighten the agent scene layouts
- In `AgentProposalMagic`, rebalance the inbox/request card stack and the bottom caption spacing.
- Ensure the larger request card and any lower chips remain visually centered without touching the caption band.

### 6. Preserve visual style while improving fit
- Keep the existing palette, animation language, and typography.
- Only adjust spacing, sizing, anchoring, and layout structure where needed to prevent overlap.

## Technical details
- Likely changes will focus on:
  - `bottom-*`, `pb-*`, `gap-*`, `max-w-*`, and width utilities
  - converting a few fragile flex rows into more predictable grid/fixed-width arrangements
  - standardizing the shared `Caption` component pattern across all three files

## Verification
I’ll verify the updated animations at mobile-first widths, especially around 390px, and check that:
- no chips overlap captions
- no text spills outside cards
- no boxes touch the frame edges
- all three animations remain visually balanced on mobile and desktop