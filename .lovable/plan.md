

# Apply Airbnb-Style Card Design to Storyboards Highlight Section

## Current State
The "Curated Journeys" section on the homepage uses tall editorial-style cards (`aspect-[4/5]` mobile, `aspect-[3/4]` desktop) with dark gradient overlays and text overlaid on images -- the same pattern that was already fixed in the marketplace.

## Changes

### File: `src/components/home/StoryboardsHighlight.tsx`

1. **Image aspect ratio**: Change from `aspect-[4/5] md:aspect-[3/4]` to `aspect-[4/3]` (landscape, matching marketplace)
2. **Remove gradient overlay**: Delete the `bg-gradient-to-t from-black/60` div
3. **Remove overlaid content**: Remove the title, location, price badge, and duration badge from on top of the image -- keep images clean
4. **Move all metadata below image**: Title, destination, price, and duration go into the content area below the image, styled consistently with `LiveTripCard`
5. **Keep vibe tags and creator attribution** below, same as current
6. **Update loading skeletons** to match the new `aspect-[4/3]` ratio
7. **Grid**: Change to `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4` for 4-column desktop layout matching marketplace

### Card structure after change:
```text
┌─────────────────────┐
│                     │
│   Clean image 4:3   │
│   (no overlay)      │
│                     │
├─────────────────────┤
│ Title          Price│
│ 📍 Destination      │
│ 📅 X nights         │
│ [tag] [tag]         │
│ 👤 By Creator       │
└─────────────────────┘
```

No other files affected.

