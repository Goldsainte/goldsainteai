

## Rethink Storyboards on Creator Profile — True Pinterest Masonry

### Problem
The current "Explore Travel Ideas" section shows storyboards as small board-cover cards (3-up grid with collage thumbnails). This is a **directory of boards**, not the Pinterest experience the user wants. On Pinterest, when you visit a creator's profile, you see a **waterfall of all their pinned images** — large, beautiful, varied-height photos flowing in a masonry layout. Each pin is clickable and belongs to a board, but the visual experience is image-first, not board-first.

### Design Direction
Instead of showing storyboard cards, **flatten all storyboard items into one unified masonry feed** on the creator profile — like Pinterest's "All Pins" view. Each image is a pin; hovering shows the board name and a save/trip CTA. Above the feed, show a horizontal row of board filters (like Pinterest's board tabs) so visitors can filter by storyboard.

### Changes

**1. `src/pages/creators/CreatorPublicProfilePage.tsx`**
- Fetch ALL storyboard items (not just 3 per board) across the creator's public storyboards — query `storyboard_items` joined through `storyboards` where `owner_id = id` and `is_public = true` (or all if own profile)
- Remove the "Featured Experience" hero card (fold it into the feed)
- Replace the `CreatorStoryboardGrid` with a new `CreatorPinterestFeed` component
- Add a horizontal board filter row above the feed: pills showing each storyboard title + "All" default — clicking filters the masonry to that board's items
- Keep the "+ New Storyboard" button for own profile
- Keep "From My Travels" media gallery below as a separate section

**2. New `src/components/creator/CreatorPinterestFeed.tsx`**
- **Board filter bar**: horizontal scroll of pill buttons — "All" + each storyboard title. Active pill gets gold highlight
- **Masonry grid**: `columns-2 md:columns-3 lg:columns-4 gap-4` with `break-inside-avoid` on each pin
- Each **pin card**:
  - Image at natural aspect ratio (no cropping), `rounded-xl`
  - On hover: dark overlay with board name, pin title/caption, and a "Plan a trip like this →" CTA
  - If `isOwnProfile`, show a small delete/manage icon on hover
  - Clicking the image navigates to the storyboard detail page
- Empty state when no items: editorial CTA to create first storyboard (own profile) or "No inspiration yet" (visitor)
- Props: `items` (flattened pin data), `storyboards` (for filter bar), `isOwnProfile`, `creatorId`, `onCreateNew`

**3. Data shape for pins**
Each pin in the feed will carry:
```
{
  id: string           // storyboard_item id
  image_url: string
  title: string | null
  subtitle: string | null
  storyboard_id: string
  storyboard_title: string
  storyboard_destination: string | null
}
```
Fetched via: `storyboard_items(*, storyboards!inner(id, title, destination, is_public))` filtered by `storyboards.owner_id = id`.

**4. `src/components/creator/CreatorStoryboardGrid.tsx`**
- Keep the file but it will no longer be used on the creator profile page (still used elsewhere like My Storyboards). No changes needed.

### Visual Result
```text
  ┌─ ALL ─┬─ Amalfi ─┬─ Morocco ─┬─ Bali ─┐   ← board filter pills
  
  ┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐
  │        │ │      │ │        │ │          │
  │  tall  │ │short │ │ medium │ │          │
  │  pin   │ │ pin  │ │  pin   │ │  tall    │
  │        │ └──────┘ │        │ │  pin     │
  │        │ ┌──────┐ └────────┘ │          │
  └────────┘ │      │ ┌────────┐ └──────────┘
  ┌────────┐ │ med  │ │        │ ┌──────────┐
  │  pin   │ │ pin  │ │  pin   │ │   pin    │
  └────────┘ └──────┘ └────────┘ └──────────┘
```

### Files
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — new query for all items, board filter state, replace grid with feed
- **Create**: `src/components/creator/CreatorPinterestFeed.tsx` — masonry feed with board filters, hover overlays, pin cards

