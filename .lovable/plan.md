

## Fix Left Column: Remove space-between, Use mt-auto for CTAs

### Problem
`justify-between` on the left column distributes space evenly, creating an oversized gap between the pill and headline. The user wants fixed spacing at the top and `margin-top: auto` on the CTA group to push it to the bottom.

### Changes in `src/components/home/HomeHero.tsx`

**Left column container (currently line 18):**
- Change `flex flex-col justify-between` → `flex flex-col`

**Top group: pill + headline + copy (lines 20–42):**
- Wrap pill, headline, and paragraph in a single `<div>`
- Pill: no extra margin
- Headline: `mt-6` (24px below pill)
- Paragraph: `mt-6` (24px below headline)

**Bottom group: CTA buttons (lines 44–55):**
- Add `mt-auto` to the CTA wrapper (pushes to bottom without stretching the top)
- Keep `mt-8` as fallback spacing on mobile (when column doesn't stretch)
- Keep `gap-3` between buttons

### Result
- Pill→headline: fixed 24px (never stretches)
- Headline→copy: fixed 24px
- Copy→CTAs: flexible — CTAs pushed to bottom via `mt-auto`
- Pill aligns with image card top, CTAs align with image card bottom

