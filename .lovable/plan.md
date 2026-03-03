

## Spacing Refinement: Left Column Vertical Rhythm

The left column uses `space-y-5` (20px) for all gaps between children. The right column's image card is taller, so the left content feels compressed vertically.

**Changes in `src/components/home/HomeHero.tsx`:**

1. **Increase gap after pill badge** — Change `mb-0` on the pill wrapper (line 20) to `mb-3` to add breathing room before the headline (~12px extra beyond the `space-y-5` base).

2. **Increase gap before CTAs** — Change `pt-1` on the CTA wrapper (line 42) to `pt-3` to push the buttons down, better balancing the bottom of the left column with the bottom of the image card.

3. **Increase overall spacing** — Change `space-y-5` on the left column (line 18) to `space-y-6` (24px) for slightly more generous vertical rhythm throughout.

These three tweaks spread the left column content to better match the image card's visual height.

