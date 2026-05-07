# Add real imagery to Traveler & Agent home animations

## Problem

`TravelerDiscoveryMagic.tsx` and `AgentProposalMagic.tsx` currently render every "card" with only a colored gradient (`from-[#…] to-[#…]`). Unlike `CreatorAIMagic.tsx`, neither file references any `img` URLs or `<img>` tags. To viewers this reads as "the images are not showing"—it's actually that no images were ever wired in.

## Goal

Bring the Traveler and Agent vignettes up to parity with the Creator scene: every trip card, swap card, day tile, and "AI suggestion" chip should sit on a real luxury travel photograph (Santorini, Positano, Capri, Tanzania, Japan, etc.), with the existing gradient now used as a soft top-down overlay for legibility. Layout, motion, timing, and copy stay exactly as they are.

## Changes

### 1. `src/components/home/TravelerDiscoveryMagic.tsx`

- Extend the existing data arrays with an `img` field (curated Unsplash URLs, `w=400&q=70`, lazy-loaded):
  - `dayTimeline` (Cliffside Dinner / Caldera Sunset / Winery Tasting) → Santorini photos.
  - `swaps` (Canaves Oia, Selene, Private Sailboat) → matching luxury stay/dining/sailing photos.
  - `aiSuggestions` (Sommelier Tasting, Akrotiri, Vlychada) → matching photos.
  - Add a `heroImg` + 4 grid `img`s for Scene 1's "Trending in Summer" marketplace cards.
- In every card that currently has only `bg-gradient-to-br from-… to-…`, render an `<img class="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />` underneath, then keep the existing gradient as a tinted overlay (`from-[#0a2225]/55 via-[#0a2225]/15 to-transparent`) so text/icons stay readable.

### 2. `src/components/home/AgentProposalMagic.tsx`

Same approach:
- Add `img` to `days` (Positano cliffside, Capri yacht, Ravello belvedere) and to `aiTips` (Da Adolfo, Caruso suite, helicopter transfer).
- Add request-thumbnail images for Scene 1 (Tanzania safari, Japan family journey, plus the highlighted "new request" card).
- Add proposal preview images for the final scene.
- Wrap each gradient block with an `<img>` underneath + softened gradient overlay.

### 3. Image sourcing

Use the same pattern that already works in `CreatorAIMagic.tsx` (direct `images.unsplash.com/photo-…?auto=format&fit=crop&w=400&q=70` URLs). All images:
- `loading="lazy"`, `decoding="async"`.
- `object-cover` with a darkening gradient overlay so the existing white serif copy and gold hairlines remain legible.
- No new dependencies; no changes to Tailwind config or design tokens.

### 4. Out of scope

- No layout/animation/timing changes.
- No copy changes.
- No backend / data / RLS / edge function changes.
- `CreatorAIMagic.tsx` already has imagery and is left untouched.

## Verification

After the edit, open `/` in the preview, scroll to the three "How it works" animations, and confirm Traveler and Agent scenes now show real photographs behind every card (matching the Creator scene's feel) with no layout shift or text-legibility regression on mobile (375px) and desktop.
