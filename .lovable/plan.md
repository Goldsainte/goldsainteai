## Goal
Make the Creator homepage animation sit flush on mobile by rebalancing the remaining crowded reconstruction scene so labels, image tiles, chips, and caption spacing all fit cleanly inside the frame.

## What I’ll change

### 1. Retune the mobile composition in the reconstruction scene
- Adjust the six absolute tile positions for phone widths so they read as a clean three-row chronology.
- Pull edge tiles inward and rebalance vertical spacing so no label or image feels clipped or off-grid.

### 2. Constrain metadata labels for small screens
- Reduce the mobile footprint of the place/meta pills.
- Tighten width, padding, and type sizing so longer names stay inside the frame.
- Re-anchor the lower-right label so it does not run into the phone edge.

### 3. Raise the taxonomy chip row above the caption zone
- Move or tighten the “Stay / Dining / Sunset / Cruise / Tasting” strip on mobile.
- Preserve a consistent gap above the reserved caption band.

### 4. Keep desktop untouched
- Scope the adjustments to mobile-first classes and inline position values.
- Preserve the current desktop composition, imagery, and animation timing.

## Files
- `src/components/home/CreatorAIMagic.tsx`

## Technical details
- Update scene-2 `top` / `left` positioning values for mobile.
- Tune mobile-specific `w-*`, `h-*`, `max-w-*`, `px-*`, and `text-*` utilities on the image tiles and metadata pills.
- Adjust the chip row `bottom-*` spacing so it clears the caption safely.

## Verification
- Recheck the Creator animation around 390px width.
- Confirm no metadata labels overlap or clip.
- Confirm no image tile touches the frame awkwardly.
- Confirm the chip row clears the caption strip while the desktop layout remains balanced.