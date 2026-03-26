

## Add Prominent Storyboards Section + Rename Gallery to "From My Travels"

### What
Elevate Storyboards to the **primary content section** on the creator profile — placed directly after the Hero/Editorial Intro, before everything else. Transform the current "Featured Storyboards" cards into a Pinterest-style masonry grid with richer cards (cover image, title, subtitle, item count, bookmark icon, "Plan a trip like this" CTA). Rename "Gallery" to "From My Travels". Add proper empty state with conversion CTA.

### New Page Flow
```text
1. Hero
2. Editorial Intro (bio, specialties, social)
3. ── Storyboards by {Name} ── (MAIN SECTION, Pinterest masonry)
4. From My Travels (renamed Gallery)
5. Credentials
6. Trips
7. Reviews
```

### Changes

**1. `src/pages/creators/CreatorPublicProfilePage.tsx`**
- Move storyboards section to be the **first item** in the left column (already is, but enhance)
- Change section title to `"Travel Inspiration by {displayName}"` or `"Storyboards by {displayName}"`
- Replace the simple 2-col grid with a Pinterest-style masonry layout (2 cols mobile, 3 cols md, 4 cols lg)
- **Empty state**: When no storyboards exist, show: "No storyboards yet — start a custom trip with this creator" + "Get a custom itinerary" CTA button linking to `handleRequestTrip`
- Fetch more storyboards (increase limit from 5 to 8) and also fetch `description` and item count via `storyboard_items(count)`

**2. New component: `src/components/creator/CreatorStoryboardGrid.tsx`**
- Pinterest/masonry grid component
- Each card:
  - Large cover image with aspect ratio variation for visual interest
  - Gradient overlay at bottom
  - Title (serif, white over image)
  - Subtitle/destination (smaller, beneath title)
  - Item count badge (e.g., "12 items")
  - Bookmark/save icon (top-right corner, on hover)
  - On hover: reveal "Plan a trip like this →" CTA overlay
- On card click: navigate to `/storyboards/{id}`
- "Plan a trip like this" CTA: navigate to `/post-trip?fromCreator={creatorId}&storyboard={storyboardId}&destination={destination}`
- Empty state card with dashed border and CTA

**3. `src/components/creator/CreatorMediaGallery.tsx`**
- Rename section header from "Gallery" to "From My Travels"
- No other changes needed

**4. `src/pages/creators/CreatorPublicProfilePage.tsx` — data fetch update**
- Update storyboard query to include `description` field and item count:
  ```
  .select("id, title, description, cover_image_url, destination, tags, view_count, created_at, storyboard_items(count)")
  .limit(8)
  ```

### Storyboard Card Design
```text
┌──────────────────────┐
│                  [♡] │  ← bookmark on hover
│   [cover image]      │
│                      │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← gradient
│ Luxury Morocco       │  ← serif title
│ Desert · 12 items    │  ← meta line
├──────────────────────┤
│ Plan a trip like → │  ← hover CTA
└──────────────────────┘
```

### Files
- **Create**: `src/components/creator/CreatorStoryboardGrid.tsx` — masonry grid with rich cards
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — use new grid, update query, reorder sections
- **Edit**: `src/components/creator/CreatorMediaGallery.tsx` — rename "Gallery" → "From My Travels"

