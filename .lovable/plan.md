

## Add Pinterest-Style Category Discovery Chips

### What Changes

**1. New shared component: `src/components/ui/CategoryChips.tsx`**
- Reusable horizontal scrollable pill bar with the 10 travel categories + "All" default
- Categories: Bucket List, Luxury Escapes, Food & Culture, Wellness & Reset, Group Trips, Romantic Getaways, Solo Travel, Cinematic Destinations, City Energy, Nature & Adventure
- Each pill: `rounded-full`, soft cream bg (`bg-[#f7f3ea]`), gold border on active (`bg-[#C7A962] text-white`), subtle hover lift
- Horizontal overflow scroll with `scrollbar-hide`, smooth scroll behavior
- Props: `activeCategory`, `onCategoryChange`, optional `className`
- Smooth `transition-all` on pill state changes

**2. `src/components/creator/CreatorPinterestFeed.tsx` — Add category chips above board filter**
- Import and render `CategoryChips` at the top, above the existing board filter pills
- Add `category` state — when a category is selected, filter `items` by matching the item's `storyboard_title`, `storyboard_destination`, or item `title`/`subtitle` against the category keywords (loose text match)
- Category filter works in combination with the board filter (both can be active)
- Animate the masonry grid on filter change with a CSS `transition-opacity` fade

**3. `src/pages/Marketplace.tsx` — Add category chips below the search bar**
- Import and render `CategoryChips` between `MarketplaceSearch` and the tabs/filters section
- Wire the active category to the existing `filters.category` state so it filters live trips and trip requests using the existing `FILTER_TAG_MAP` logic
- Map new category names to existing filter tags (e.g., "Luxury Escapes" → "Luxury", "Solo Travel" → "Solo Travel", "City Energy" → "City breaks")

### Visual
```text
┌──────────────────────────────────────────────┐
│ ○ All  ○ Bucket List  ○ Luxury Escapes  ○ Food & Culture  ○ ... →  │
│                                    (scrollable)                      │
└──────────────────────────────────────────────┘
```

### Files
- **Create**: `src/components/ui/CategoryChips.tsx`
- **Edit**: `src/components/creator/CreatorPinterestFeed.tsx` — add category filter layer
- **Edit**: `src/pages/Marketplace.tsx` — add chips below search

