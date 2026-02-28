

## Show Full Labels on Mobile Pill Buttons

### File: `src/components/marketplace/MarketplaceTabs.tsx`

**Problem:** On mobile, the tabs show `shortLabel` ("Curated", "Requests") instead of the full `label` ("Curated Trips", "Trip Requests"). The layout uses `flex-col` on mobile making them compact.

**Changes (lines 44-56):**
1. Remove the `flex-col` mobile layout — use `flex-row` with `gap-1.5` at all sizes
2. Show the full `tab.label` at all breakpoints instead of switching between `shortLabel` and `label`
3. Increase mobile horizontal padding from `px-2.5` to `px-4` and text from `text-[10px]` to `text-xs`

This ensures the pill buttons display "Curated Trips" and "Trip Requests" on mobile, matching desktop.

