

## Increase Headline Size & Refine Type Hierarchy

### Changes in `src/components/home/HomeHero.tsx`

**Headline (line 30):**
- Change `text-3xl leading-tight md:text-4xl lg:text-[38px]` → `text-3xl leading-[1.08] md:text-5xl lg:text-[66px]`
- Tight line-height (1.08) prevents extra vertical space despite larger font

**Body copy (line 35):**
- Change `text-sm md:text-base` → `text-sm md:text-[16px]` (stays at 16px, confirming hierarchy)
- Already well-sized; no real change needed

**No other changes** — pill spacing (`mt-6` = 24px), CTA sizing, and layout structure remain as-is.

### Result
- Headline: ~66px on desktop with ~1.08 line-height — strong visual anchor
- Body: 16px — clear subordinate hierarchy
- CTAs: unchanged weight/size — maintains balance

