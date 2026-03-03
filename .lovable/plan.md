

## Hero Layout: Grid + Stretch + Space-Between

### Problem
The left column is auto-height with inconsistent spacing. The right image card is taller, creating visual imbalance. Random margin tweaks can't fix structural misalignment.

### Changes in `src/components/home/HomeHero.tsx`

**1. Section container padding** (line 14)
- Change `pb-8 pt-12 md:pt-16 lg:pt-20 md:pb-12` → `py-16 md:py-24` (96px top/bottom on desktop)

**2. Two-column layout → CSS Grid with stretch** (line 16)
- Replace `flex flex-col gap-10 md:flex-row md:items-start`
- With `grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch`
- This forces both columns to equal height

**3. Left column → flex column with space-between** (line 18)
- Replace `w-full md:w-[52%] space-y-6`
- With `flex flex-col justify-between`
- Remove all `space-y-*`, `mb-*`, `pt-*` from children — use explicit spacing instead

**4. Explicit spacing on left column children:**
- Pill badge wrapper: no extra margin (anchors to top)
- Below pill → headline: `mt-10` (40px)
- Below headline → paragraph: `mt-8` (32px)
- Below paragraph → CTA wrapper: `mt-12` (48px)
- Between CTAs: `gap-4` (16px) — already close, change from `gap-3`

**5. Right column** (line 59)
- Remove `w-full md:w-[48%]` (grid handles width now)
- The image card naturally fills the column height via stretch
- Remove the decorative offset border's `translate-y-4` influence by keeping it as-is (absolute positioned, doesn't affect flow)

**6. Image card container**
- Add `h-full` to the right column wrapper so it stretches
- Add `h-full flex flex-col` to the inner card wrapper so the image grid fills available space

### Result
- Pill top-aligns with image card top (both anchored to grid row top)
- CTA bottom-aligns with image card bottom (space-between + stretch)
- Consistent 8pt spacing scale throughout
- Mobile: stacks vertically as before (single column grid)

