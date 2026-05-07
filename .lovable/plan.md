## Goal
Make the Creator homepage animation sit flush on mobile by rebalancing the remaining crowded scene so labels, image tiles, chips, and caption spacing all fit cleanly inside the frame.

## What I found
The remaining issue is isolated to `CreatorAIMagic`, especially scene 2 on mobile:
- The itinerary reconstruction layout still uses fixed absolute positions tuned for larger sizes.
- The right-side and bottom metadata labels can clip or crowd each other at phone widths.
- The bottom tag strip sits too close to the reserved caption area.
- The lower-right memory tile and label pair feel visually off-grid instead of flush.

## Files
- `src/components/home/CreatorAIMagic.tsx`

## Plan

### 1. Retune the scene 2 mobile composition
- Adjust the absolute tile positions specifically for mobile so the six memories read as a clean three-row chronology.
- Pull edge tiles slightly inward and rebalance vertical spacing so labels do not sit on top of each other.

### 2. Resize and constrain tile metadata for small widths
- Reduce mobile tile and label footprint where needed.
- Let labels use tighter width, padding, and type so long place names stay inside the frame.
- Prevent the lower-right label from clipping against the phone edge.

### 3. Move the taxonomy chip row into a safer mobile zone
- Raise or tighten the “Stay / Dining / Sunset / Cruise / Tasting” strip on mobile.
- Keep it visually centered while preserving a clean gap above the caption band.

### 4. Keep desktop composition intact
- Scope the adjustments to mobile-first classes and inline position values.
- Preserve the current desktop spacing, art direction, imagery, and animation timing.

### 5. Validate at phone width after the fix
- Recheck the Creator animation around 390px width.
- Confirm no labels clip, no tiles touch the frame awkwardly, and the caption strip has breathing room.

## Technical details
- Likely changes will focus on:
  - scene-2 `top` / `left` positioning values
  - mobile-specific `w-*`, `h-*`, `max-w-*`, `px-*`, and `text-*` utilities
  - tag strip `bottom-*` spacing and label anchoring

## Verification
I’ll verify the updated Creator animation at mobile-first widths, especially around 390px, and check that:
- no metadata labels clip or overlap
- no tile touches the phone frame awkwardly
- the chip row clears the caption strip
- the full composition still feels balanced on desktop