

## Creator Profile — Luxury Editorial Refinement (Away from IG, Toward Mr & Mrs Smith)

### Problem
The current layout reads like an Instagram clone: compact identity bar, flat tabs with icons, `grid-cols-3 gap-1` square grid, minimal typography. It lacks the editorial warmth, generous spacing, serif-forward elegance, and visual storytelling that defines the Goldsainte / Mr & Mrs Smith aesthetic.

### Design Direction
Think **Mr & Mrs Smith hotel profile** or **Farfetch editorial**: large serif headlines, generous whitespace, warm cream backgrounds, landscape imagery with overlaid typography, gold accent dividers, and content that breathes. No tab icons, no square grids, no tight spacing.

### Changes

**1. `src/components/profile/ProfileHero.tsx` — Magazine-style header**
- Add a subtle cream-to-white gradient background instead of flat white
- Increase vertical padding to `py-10 md:py-14` for breathing room
- Enlarge avatar to `h-28 w-28 md:h-32 md:w-32` with a slightly thicker gold ring
- Upgrade name typography to `text-3xl md:text-4xl` with Playfair Display
- Style bio in `font-primary` (Cormorant Garamond) italic, `text-base`, warmer tone — feels like a magazine tagline
- Replace the compact stats row with a spaced-out treatment: each stat in its own block with the number large (`text-lg font-secondary`) and label small below — separated by thin gold dividers (like a hotel fact sheet)
- Move CTA to its own row below stats on desktop (full-width, centered) — removes the cramped 3-column feel
- Add a decorative gold flourish or thin rule between bio and stats
- Remove "How it works" strip from the page entirely — it's too utilitarian

**2. `src/pages/creators/CreatorPublicProfilePage.tsx` — Editorial page flow**
- Remove the IG-style tab bar (icons + underline tabs). Replace with elegant section labels inline with content — the page scrolls as one editorial story, not a tabbed app
- Page flow becomes a continuous editorial scroll:
  1. Header (cream gradient)
  2. Featured Experience (full-width hero card — keep as-is, it's great)
  3. "Curated Experiences" section label → Storyboard grid
  4. "From My Travels" section label → Media gallery
  5. "Meet {Name}" section (keep)
  6. Reviews
  7. Final CTA
- Section labels styled as: `font-primary text-sm uppercase tracking-[0.25em] text-[#C7A962]` with a thin gold line extending to the right (like editorial magazine section breaks)
- Alternate backgrounds: cream / white / cream between major sections
- Increase section spacing to `py-16 md:py-24`
- Remove the "How it works" strip entirely

**3. `src/components/creator/CreatorStoryboardGrid.tsx` — Editorial card refinement**
- Keep the mixed-size editorial grid (large first card, medium next two, standard rest) — this is good
- Upgrade card hover: add `shadow-2xl` on hover + subtle gold border glow (`hover:border-[#C7A962]/30`)
- Add a thin gold accent line at top of each card (2px gold strip) for magazine feel
- Increase card border-radius to `rounded-xl` (softer)
- Improve "Plan a trip like this" reveal bar: use serif font, slightly larger text, gold arrow icon

**4. `src/components/creator/CreatorMediaGallery.tsx` — Lifestyle editorial grid**
- Replace `grid-cols-3 gap-1` IG grid with `columns-2 md:columns-3 gap-4 space-y-4` masonry layout (the non-IG path already exists, just stop passing `useIgGrid`)
- Add `rounded-xl` to all images
- Add subtle hover overlay with caption text (if available)
- Remove square aspect ratio constraint — let images show at natural proportions for editorial feel

**5. Section divider pattern (reused)**
```text
── ✦ ──  or  thin gold gradient line
```
Implemented as a small component: gold dot centered with fading lines on each side, placed between major sections.

### Visual Identity Shift
```text
BEFORE (IG):                    AFTER (Mr & Mrs Smith):
─────────────────              ─────────────────
Compact bar header             Generous serif header
[Tab1] [Tab2]                  Editorial scroll
grid-cols-3 gap-1              Masonry with rounded cards  
Square crops                   Natural aspect ratios
text-xs labels                 Cormorant Garamond accents
Flat white bg                  Cream/white alternating
```

### Files
- **Edit**: `src/components/profile/ProfileHero.tsx` — magazine header with serif typography, spaced stats, centered CTA
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — remove tabs, continuous editorial scroll, gold section dividers, increased spacing
- **Edit**: `src/components/creator/CreatorStoryboardGrid.tsx` — gold accents, refined hover, serif CTA bar
- **Edit**: `src/components/creator/CreatorMediaGallery.tsx` — masonry layout (remove IG grid), rounded cards

