
## Issue

The new "Luxury Intelligence" section header is left-aligned and uses different sizing than the canonical "The Goldsainte Ecosystem / Experience Goldsainte Your Way" header. The pillar body copy also renders larger than the rest of the homepage body text.

## Reference (canonical header from `RoleSpecificCTAs.tsx`)

- Container: `mx-auto max-w-3xl text-center`
- Pill: `inline-flex rounded-full bg-[#0c4d47] px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-[0.18em] text-[#D4C07A]`
- Divider: `mx-auto mt-4 block h-px w-12 bg-[#C7A962]`
- H2: `mt-5 font-secondary text-[28px] leading-[1.1] tracking-tight text-[#0a2225] md:text-[44px]`
- Subhead: `mx-auto mt-5 max-w-2xl text-[15px] md:text-base leading-relaxed text-[#5A5A5A]`

## Changes (single file: `src/sections/HomeLuxurySections.tsx`, in `TrustSafetyPaymentsSection`)

1. **Header alignment + sizing — match the Ecosystem block exactly.**
   - Wrap the header in `mx-auto max-w-3xl text-center` (centered, not left-aligned).
   - Pill: replace current eyebrow with the canonical `bg-[#0c4d47] ... text-[#D4C07A]` (drop the gold border + bfad72 variant).
   - Divider: `mx-auto mt-4 block h-px w-12 bg-[#C7A962]` (centered, narrower w-12).
   - H2: `mt-5 font-secondary text-[28px] leading-[1.1] tracking-tight text-[#0a2225] md:text-[44px]` (no `mb-4`).
   - Subhead: `mx-auto mt-5 max-w-2xl text-[15px] md:text-base leading-relaxed text-[#5A5A5A]`.

2. **Layout adjustment to support centered header.**
   - Move the header block above the two-column row so it spans full width and reads as the section header (mirroring the Ecosystem section's structure: centered header → grid of items below).
   - Below the centered header, keep the two-column row: left = pillars list, right = editorial image.

3. **Pillar body type — bring down to standard body size.**
   - Pillar body currently `text-sm md:text-[15px]`. Change to `text-sm md:text-[15px] leading-relaxed text-[#5A5A5A]` — same scale as the rest of the homepage. (Matches values used elsewhere; current `md:text-[15px]` is fine but the perceived size issue stems from line-height and the lack of muted color contrast — verify final weight matches other sections like Why Goldsainte cards which use `text-sm leading-relaxed text-[#5A5A5A]`. If still too large, drop md to `md:text-sm`.)
   - Pillar title kept at `font-secondary text-lg md:text-xl text-[#0a2225]`.

4. **No other changes** — image panel, motion, padding, and copy stay as-is.

## Acceptance

- Header pill, divider, H2, and subhead are visually identical to the "The Goldsainte Ecosystem / Experience Goldsainte Your Way" block (centered, same fonts, same sizes, same gold divider width).
- Pillar body text matches the rest of the homepage body type (no longer reads as oversized).
- Section still has the editorial image on the right with the gold sparkle caption.
