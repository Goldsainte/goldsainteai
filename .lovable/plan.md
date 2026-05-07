## Problem

In Scene 2 ("Reconstructing your journey") of `src/components/home/CreatorAIMagic.tsx`, on desktop (≥md, viewport ~1000px) several floating elements collide:

1. The header pill "Reconstructing your journey" wraps to two lines and the Day 01 / 02 / 03 chips (positioned at `top-[62px]`) sit on top of the pill's second line.
2. The bottom Megalochori tile (positioned at `top: 76%`) plus its "below" metadata label collides with the classifier tag strip ("Stay / Dining / Sunset / Cruise / Tasting") sitting at `bottom-10 sm:bottom-12`.
3. The Megalochori label itself is partially clipped behind the tag pills.

This is purely a layout/spacing issue inside one component — no data, copy, or animation logic changes needed.

## Fix

Edit only `src/components/home/CreatorAIMagic.tsx`, Scene 2 block:

1. Header pill: keep the pill on a single line on md+ by adding `whitespace-nowrap` and tightening padding, so it no longer wraps and intrudes into the Day chips row.
2. Day chips row: move from `top-[62px]` to a md-aware offset (`top-[58px] md:top-[64px]`) and add a small `mt` so chips clear the (now single-line) pill at all breakpoints.
3. Tile vertical positions: shift the three rows slightly tighter and lift Day 03 (Megalochori) up so its "below" label clears the bottom tag strip:
   - Day 01 row: `top: 28%` (was 30%)
   - Day 02 row: `top: 50%` (was 53%)
   - Day 03 row: `top: 70%` (was 76%) — this is the key fix; combined with the existing `-bottom-[42px]` label offset it ends ~84% instead of ~92%.
4. Bottom classifier tags: move from `bottom-10 sm:bottom-12` to `bottom-6 sm:bottom-8 md:bottom-6`, so they sit closer to the caption strip and out of the Megalochori label zone.
5. Optional: add `pointer-events-none` is already not needed; just verify z-index so labels render above the SVG route (already true via DOM order).

## Out of scope

- No changes to Scenes 1, 3, 4.
- No copy, animation timing, color, or font changes.
- No changes to `TravelerDiscoveryMagic.tsx` or `AgentProposalMagic.tsx`.
- No backend / data changes.

## Verification

Open `/` at viewport widths 1000px, 1280px, 1440px and 768px. During Scene 2:
- The "Reconstructing your journey" pill stays on one line and does not touch the Day chips.
- The Megalochori tile + label sits clearly above the "Stay / Dining / Sunset / Cruise / Tasting" strip with visible breathing room.
- No regression on mobile (375px) — the existing `sm:` offsets remain the fallback.
