

## Creator Profile — Luxury Editorial Upgrade (Content-First)

### Overview
Elevate the IG-style profile into a luxury travel magazine experience. Keep the content-first scrolling behavior but add editorial polish: a premium header, featured storyboard hero, mixed-size grid, section labels, a refined "Meet" block, and generous white space with alternating backgrounds.

### Changes by File

**1. `src/components/profile/ProfileHero.tsx` — Premium header**
- Increase avatar to 96px mobile / 112px desktop with gold ring border (`border-[#C7A962]`)
- Enlarge name to `text-2xl md:text-3xl` with Playfair Display (font-secondary)
- Add more vertical padding (`py-8 md:py-10`) for breathing room
- Style CTA as larger button with rounded-full, `h-11`, and refined microcopy below: "Designed for you · Delivered in 24–48 hours"
- Remove icon-based trust badges (BadgeCheck/Shield/Clock icons) — replace with text-only: "Verified · Secure · Responds in 24h" in small muted text
- Add subtle bottom divider: thin gold line or gradient fade instead of plain border
- Remove "How it works" strip (will be placed subtly in the page below)

**2. `src/pages/creators/CreatorPublicProfilePage.tsx` — Layout restructure**
- After header, before tab bar: add **Featured Storyboard** hero card (first storyboard with a cover image, rendered as a full-width card with large image, title overlay, description, and "Plan a trip like this" CTA)
- Add section label above featured: `"FEATURED EXPERIENCE"` in small-caps, letter-spaced, light weight
- Add section label above tab content: `"EXPLORE TRAVEL IDEAS"` for storyboards tab, `"FROM MY TRAVELS"` for moments tab
- Add "How it works" as a single-line strip between featured and tabs (subtle, muted)
- After content grid + reviews, add **"Meet {firstName}"** section: serif heading, 3-4 line bio paragraph, specialties as minimal tags — placed at bottom, white background section
- Add **final CTA block** at very bottom: "Start Your Journey With {Name}" with refined button and microcopy
- Alternate section backgrounds: header (white), featured (cream `#FDF9F0`), tabs+grid (white), meet creator (cream), CTA (white), reviews (cream)
- Increase spacing between all sections to `py-12 md:py-16`

**3. `src/components/creator/CreatorStoryboardGrid.tsx` — Mixed-size editorial grid**
- Replace uniform masonry with editorial hybrid layout:
  - First card: large, spanning 2 columns, `aspect-[4/3]`
  - Next 2 cards: medium, `aspect-[3/4]`
  - Remaining: standard masonry with varied aspects
- Upgrade card styling: stronger gradient overlay (`from-black/70`), larger title typography (`text-lg md:text-xl`), add description line below title on larger cards
- Enhanced hover: scale-105 zoom + shadow-xl lift + subtle border glow
- Keep `hideTitle` prop behavior

**4. `src/components/creator/CreatorMediaGallery.tsx` — No structural changes**
- Already has `hideTitle` and `useIgGrid` — keep as-is

### New: Featured Storyboard Component (inline in page file)
Renders the first storyboard with a cover image as a full-width hero card:
- Large image (`aspect-[16/9]` or `aspect-[2/1]`), rounded-2xl, overflow-hidden
- Gradient overlay from bottom
- Title in serif (`text-2xl md:text-3xl`), description below, destination tag
- "Plan a trip like this →" CTA overlaid at bottom-right
- Entire card clickable → navigates to storyboard detail

### Section Label Style (reused)
```
text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B7280]
```

### Files
- **Edit**: `src/components/profile/ProfileHero.tsx` — premium sizing, remove icons, gold divider
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — featured hero, section labels, meet section, CTA block, alternating backgrounds
- **Edit**: `src/components/creator/CreatorStoryboardGrid.tsx` — mixed-size editorial grid

