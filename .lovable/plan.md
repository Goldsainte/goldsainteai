

## Add Pinterest-Style Storyboard Section to Creator Profile

### Problem
The current "Curated Experiences" storyboard grid uses editorial magazine-style cards, but it doesn't convey the **Pinterest board** feel — where each storyboard is a visual collection/board with multiple preview thumbnails, item counts, and a clear "board" metaphor. The section also lacks context about what storyboards are and why they matter (creators as the supply-side engine).

### What Changes

**1. `src/pages/creators/CreatorPublicProfilePage.tsx` — Rename and reposition storyboard section**
- Rename "Curated Experiences" label to **"Explore Travel Ideas"**
- Add a short editorial subtitle below the section label: *"Curated travel storyboards by {firstName} — visual collections of destinations, experiences, and moments that inspire your next journey."*
- Ensure this section sits between the Featured Experience and "From My Travels" (already does, just making it more prominent)
- Pass full storyboard data (including items if available) to enable Pinterest-style previews

**2. `src/components/creator/CreatorStoryboardGrid.tsx` — Pinterest board-style cards**
- Redesign cards to look like **Pinterest boards** rather than single-image editorial cards:
  - Each card shows a **multi-image collage** when the storyboard has items: 1 large image + 2-3 smaller thumbnails in a grid arrangement (like Pinterest board covers)
  - If no items, fall back to single cover image as today
- Add **board metadata** below the image: title (serif), item count ("12 pins"), destination tag
- Remove the gold accent strip at top (too editorial, not Pinterest)
- Keep the hover "Plan a trip like this" CTA bar
- Adjust grid to `grid-cols-2 md:grid-cols-3 gap-6` (fewer columns, more breathing room — Pinterest uses 2-3 cols)
- Cards get `rounded-2xl` with softer shadows
- Remove the large/medium/small size variation — make all cards uniform height with `aspect-[4/5]` (tall, like Pinterest)

**3. Storyboard items query update in `CreatorPublicProfilePage.tsx`**
- Fetch a few item image URLs per storyboard (up to 3) to enable the collage preview
- Update the storyboards query to include: `storyboard_items(image_url, position)` limited to 3 items per board
- Pass item images to the grid component

### Visual Result
```text
┌─────────────────────────────────────┐
│ EXPLORE TRAVEL IDEAS                │
│ Curated storyboards by Radu...      │
├─────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ │ ┌──┬──┐  │ │ ┌──┬──┐  │ │          │
│ │ │  │  │  │ │ │  │  │  │ │  [cover] │
│ │ │big│sm│  │ │ │big│sm│  │ │          │
│ │ │  ├──┤  │ │ │  ├──┤  │ │          │
│ │ │  │sm│  │ │ │  │sm│  │ │          │
│ │ └──┴──┘  │ │ └──┴──┘  │ │          │
│ │ Morocco  │ │ Amalfi   │ │ Bali     │
│ │ 12 pins  │ │ 8 pins   │ │ 5 pins   │
│ └──────────┘ └──────────┘ └──────────┘
```

### Files
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — rename section, add subtitle, update storyboard query to include item images
- **Edit**: `src/components/creator/CreatorStoryboardGrid.tsx` — Pinterest board-style cards with collage previews, uniform grid, metadata row

