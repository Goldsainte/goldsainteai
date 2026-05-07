## Goal
Optimize `src/components/home/HomeHero.tsx` for mobile (≤768px) while preserving the desktop layout, spacing, and luxury aesthetic.

## Issues on mobile today
- Section uses `md:min-h-[calc(100vh-56px)]` only — mobile has no height control, but the right-side image stack uses `h-full` which collapses awkwardly on small screens.
- Pill badge has tight `gap-1`, may still wrap or feel cramped at 360–390px.
- Headline `text-3xl` is large but margins (`mt-10`, `mt-8`) feel desktop-tuned; mobile needs tighter rhythm.
- Three-up "Popular Trips" grid stays `grid-cols-3` on mobile — squares get tiny (~95px) and titles truncate aggressively.
- Right column image stack: `col-span-2 row-span-2` + two thumbs is designed for landscape; on a narrow phone it becomes a thin sliver.
- Caption card text can overflow inside the dark green pill on small widths.
- CTAs `max-w-sm` is fine but vertical spacing (`mt-8`) is heavy on mobile.

## Changes (presentation only, single file)

1. **Section sizing**
   - Drop forced `md:max-h-[calc(100vh-56px)]` constraint on mobile (already md-only, keep). Add comfortable mobile padding: `py-8 md:py-12`.

2. **Pill badge**
   - Reduce mobile px and tracking: `px-3 py-1 text-[10px] tracking-[0.06em]`.
   - Use shorter dividers on mobile (`w-1.5`).
   - Ensure it stays one line via existing `whitespace-nowrap`.

3. **Typography rhythm**
   - Headline: `text-[26px] sm:text-3xl md:text-4xl lg:text-[38px]`, `mt-6 md:mt-10`.
   - Description paragraphs: `mt-5 md:mt-8` for first, tighten subsequent `mt-2`/`mt-3`.

4. **CTAs**
   - Full-width on mobile (`max-w-none md:max-w-sm`), `mt-6 md:mt-8`, slightly larger tap target (`py-3`).

5. **Popular Trips strip**
   - Keep 3-up but switch from `aspect-square` to `aspect-[4/3]` to match brand standard and give titles more breathing room.
   - Tighten gap on mobile (`gap-2 md:gap-3`).
   - Allow 2-line title on mobile (`line-clamp-2 md:line-clamp-1`).

6. **Right-side visual stack (the big mobile fix)**
   - Remove `h-full` dependency on mobile. Wrap in a fixed mobile aspect ratio (e.g. `aspect-[4/5]`) and switch to `md:h-full md:aspect-auto`.
   - Reduce decorative offset frame on mobile (`translate-x-2 translate-y-2 md:translate-x-4 md:translate-y-4`) and reduce outer radius (`rounded-3xl md:rounded-[32px]`).
   - Keep grid layout but ensure thumbs don't squish: gaps `gap-2`, padding `p-2 md:p-3`.
   - Caption card: smaller text on mobile (`text-[11px]`), tighter padding.

7. **Column order on mobile**
   - Currently copy renders first, image second. Consider keeping that order (copy first reads better on phones); confirm by leaving grid default. No change needed unless user wants image-first.

## Out of scope
- No content/copy changes.
- No business logic, query, or routing changes.
- No global CSS / token changes.

## Files
- `src/components/home/HomeHero.tsx` (only)

## Verification
- Resize preview to 375px, 414px, 768px, 1280px.
- Confirm pill stays one line, no horizontal scroll, image stack has proper height, CTAs are tappable, popular trips legible.
