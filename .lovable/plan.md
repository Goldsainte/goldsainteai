

## Fix CTA Spacing: Remove Space-Between, Use Fixed 32px Gap

### Problem
Line 18: the left column uses `justify-between`, which pushes the CTA block to the column bottom — disconnecting it from the copy above.

### Changes in `src/components/home/HomeHero.tsx`

1. **Line 18** — Remove `justify-between` from the left column:
   - `flex flex-col justify-between` → `flex flex-col`

2. **Lines 20–44** — Remove the wrapping `<div>` around the top group (pill + headline + paragraph). Instead, let all children (pill, headline, paragraph, CTAs) flow naturally inside the single flex column.

3. **Line 47** — CTA group keeps `mt-8` (32px) and `gap-3`. No `mt-auto`, no space distribution.

### Result
- Paragraph → CTA: fixed 32px (`mt-8`)
- No stretching or floating — CTAs sit directly beneath the copy
- Right column image card still stretches via `items-stretch` on the grid

