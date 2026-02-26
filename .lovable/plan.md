

# Feature Comparison Section — "Two Powerful Ways to Plan Your Trip"

## Placement

Insert a new component between `<HomeHero />` and `<HowGoldsainteWorksSection />` in `src/pages/Index.tsx`. This positions it as the first thing visitors see after the hero — immediately clarifying the two core product pillars.

## Design

Inspired by the Upwork comparison table screenshot but adapted to the Mr & Mrs Smith luxury aesthetic:

- Cream background (`#FDF9F0`) with serif headers (font-secondary / Playfair Display)
- Two side-by-side columns in white cards with subtle gold border (`border-[#E5DFC6]`) and `rounded-2xl`
- Each column has a serif title, a gold divider line, and 10 checkmark rows
- Checkmarks use gold color (`#C7A962`) — no red X marks, everything is a positive feature (all checkmarks as specified)
- Rows alternate between transparent and a very subtle cream tint for readability (matching the Upwork zebra-stripe pattern)
- On mobile, columns stack vertically
- No icons beyond the checkmark — clean, text-forward, editorial

## Component Structure

**New file: `src/components/home/TwoWaysComparison.tsx`**

```
Section (bg-[#FDF9F0], max-w-6xl centered)
├── Pill badge: "Why Goldsainte"
├── Gold divider line (w-14)
├── H2: "Two Powerful Ways to Plan Your Trip" (serif)
├── Subtitle text
└── Grid (2 columns on md+, 1 on mobile)
    ├── Card 1: "Travel Marketplace"
    │   ├── Gold divider
    │   └── 10 rows with ✔ checkmark + text
    └── Card 2: "Storyboarding"
        ├── Gold divider
        └── 10 rows with ✔ checkmark + text
```

Each row: `flex items-start gap-3` with a gold `Check` icon (from lucide-react) and the feature text in `text-sm text-[#4a4a4a]`. Alternating rows get `bg-[#FAF7F0]` for the zebra effect.

## File Changes

| File | Action |
|---|---|
| `src/components/home/TwoWaysComparison.tsx` | Create — static comparison component |
| `src/pages/Index.tsx` | Edit — import and add `<TwoWaysComparison />` between `<HomeHero />` and `<HowGoldsainteWorksSection />` |
| `src/pages/HomePage.tsx` | Edit — add same component for consistency |

## Content (hardcoded, no i18n needed for now)

**Column 1: Travel Marketplace**
1. Receive multiple custom trip designs
2. Work with vetted creators & certified agents
3. Competitive bidding for better value
4. Personalized itineraries (not templates)
5. Transparent pricing proposals
6. Secure booking workflow
7. Built-in messaging & collaboration
8. Compare proposals side-by-side
9. Human expertise powered by AI
10. One platform from idea to execution

**Column 2: Storyboarding**
1. Pinterest-style visual planning
2. Save hotels, experiences & travel inspiration
3. Turn inspiration into a structured trip brief
4. Clarify your vibe before you book
5. Avoid generic itineraries
6. Guide agents with visual direction
7. Organize ideas in one place
8. Flexible, creative, and collaborative
9. Edit anytime before posting
10. Designed specifically for travel (not generic boards)

