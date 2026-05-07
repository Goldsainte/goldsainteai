
## Goal
Introduce a small, elegant "Popular Trips" strip directly under the hero CTA buttons in `HomeHero` to signal that Goldsainte is a shoppable marketplace—without disrupting the editorial luxury feel.

## Where it goes
Inside `src/components/home/HomeHero.tsx`, in the LEFT column, immediately below the existing CTA button stack (the `<Link to="/marketplace">` and `<a href="#how-it-works">` block). It will live within the same flex column so the right-side image stack still aligns.

## What it looks like

```text
[ Explore Travel Marketplace ]
[ See How It Works           ]

POPULAR TRIPS  ───────────────

[img] Bali Wellness Retreat       [img] Kyoto Cultural Immersion   [img] Amalfi Coast Weekend
      From $2,199                        From $3,799                      From $2,499
```

- Small uppercase label "Popular Trips" in `#0a2225/60`, tracking-wide, `text-[11px]`, with a thin `#E5DFC6` divider line beside it.
- 3 horizontal cards in a `grid grid-cols-3 gap-3`.
- Each card:
  - Square-ish rounded thumbnail (`aspect-square`, `rounded-xl`, `object-cover`, ~64–72px tall on desktop).
  - Trip title: `font-display` or existing serif, `text-[13px]`, `text-[#0a2225]`, `line-clamp-1`.
  - Starting price: `text-[12px]`, `text-[#0a2225]/70`, format `From $2,199`.
  - Whole card is a `<Link to="/marketplace">` (static for now—no detail routing since these are illustrative).
- Hover animation: subtle `transition-transform duration-300 group-hover:scale-[1.03]` on the image, and `group-hover:text-[#0c4d47]` on title. No shadows, no borders—keeps it integrated.

## Spacing
- `mt-8` above the strip (matches existing rhythm of the hero copy spacing).
- Internal: label `mb-3`, cards `gap-3`.
- On mobile (`<md`): keep 3 columns but shrink thumbnail and font; or fall back to a horizontal scroll row (`flex overflow-x-auto snap-x`) if cramped. Plan: keep `grid grid-cols-3` with smaller text; the existing hero is already tight on mobile and 3 small cards still fit.

## Data
Hard-coded inline array of 3 items in `HomeHero.tsx`:
```ts
const popularTrips = [
  { title: "Bali Wellness Retreat", price: "From $2,199", image: heroMainImg },
  { title: "Kyoto Cultural Immersion", price: "From $3,799", image: heroSecondaryImg },
  { title: "Amalfi Coast Weekend", price: "From $2,499", image: heroTertiaryImg },
];
```
Reuses the three existing hero image imports so no new assets are needed and the visual palette stays cohesive. (If you'd prefer destination-accurate imagery, we can swap to fetched/Unsplash images in a follow-up.)

## Aesthetic alignment
- Cream `#f7f3ea` background inherited from hero—no card backgrounds needed.
- Rounded corners `rounded-xl` on thumbnails to match existing `rounded-3xl` image stack vocabulary, scaled down.
- Serif title via existing `font-display`/`font-secondary` class already used in the hero `<h1>`.
- Gold accent line beside label uses `#BFAD72`/`#E5DFC6` from the pill badge.

## Files touched
- `src/components/home/HomeHero.tsx` — add the strip JSX + small inline `popularTrips` array.
- `src/i18n/locales/en.json` — add `home.hero.popularTripsLabel` ("Popular Trips") and `home.hero.from` ("From") so copy stays translatable. Trip titles can be inlined (English-only for now) since they're illustrative.

## Out of scope
- Wiring to real marketplace data / live pricing.
- Per-trip detail page links (cards link to `/marketplace`).
- Mobile carousel behavior beyond a 3-up shrink (can revisit if cramped).
