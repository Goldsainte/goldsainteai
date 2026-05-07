## Match the "Curated Journeys" header to the "Why Goldsainte" pattern

### File
`src/components/home/StoryboardsHighlight.tsx` — header block only (lines ~75–86). The trip grid, "Browse all" button, and section padding stay as-is.

### Reference pattern (from `TwoWaysComparison.tsx` lines 96–106)
- Container: `text-center` (not left).
- Eyebrow: dark-green pill — `inline-block rounded-full border border-[#0c4d47] bg-[#0c4d47] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#bfad72] mb-4`.
- Gold divider: `mx-auto w-14 h-px bg-[#C7A962] mb-5`.
- H2: `font-secondary text-2xl md:text-4xl text-[#0a2225] mb-3` (no italic).
- Subhead paragraph: `text-sm md:text-base text-[#4a4a4a] max-w-2xl mx-auto mb-10 leading-relaxed`.

### Changes to apply

Replace the current left-aligned header in `StoryboardsHighlight.tsx`:

1. Wrapping div: change `text-left mb-10 md:mb-12` → `text-center mb-10 md:mb-12 max-w-3xl mx-auto`.
2. Add eyebrow pill **above** the title: `CURATED JOURNEYS` using the exact pill classes above.
3. Add the gold `w-14 h-px` divider beneath the pill.
4. Title: keep the existing copy *"Curated Journeys by Creators & Certified Agents"* but swap classes to match Why Goldsainte (`font-secondary text-2xl md:text-4xl text-[#0a2225] mb-3`, no italic, centered).
5. Drop the standalone italic line *"Book instantly. Personalize effortlessly."* — fold its meaning into a single centered description so the layout has the same eyebrow → divider → title → one paragraph rhythm as Why Goldsainte. New paragraph: *"Book instantly or personalize effortlessly — explore expertly designed trips you can book on the spot, or customize with a creator or certified travel expert to make them your own."* with classes `text-sm md:text-base text-[#4a4a4a] max-w-2xl mx-auto mb-10 leading-relaxed`.

### Out of scope
- No changes to the trip cards grid, skeletons, "Browse all curated trips" CTA, section background, or padding.
- No other components/pages touched.
- No copy changes elsewhere; no i18n key additions.
