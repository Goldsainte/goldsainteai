

# Add Search Bar to My Storyboards Page + Link Storage Clarity

## Answers to Your Questions

**Where are links stored?**
Links are saved in the `storyboard_items` table as rows with `item_type = 'video'`, `source_type = 'tiktok' / 'youtube' / 'instagram' / 'manual'`, and the URL stored inside the `metadata` JSONB column (as `{ url: "..." }`).

**Can users see their added links?**
Yes — when viewing/editing a storyboard via StoryboardBuilder, links appear in the "Storyboard preview" section as dark cards showing the source platform and URL. However, on the My Storyboards listing page there is currently no inline preview of links.

**Do links convert when posting a trip?**
Yes. When "Convert to Trip" is clicked, the `storyboardId` is passed to the Post a Trip wizard, and StoryboardBuilder loads ALL items (photos AND links) from `storyboard_items`. Links are included in the conversion.

---

## Problem: Missing Search Bar

The search bar (photo search + link paste) lives inside `StoryboardBuilder`, which is only rendered on the storyboard editor page (`/storyboards/new` or `/storyboards/:id`). The My Storyboards listing page (`/storyboards`) only shows `TravelStoryboard` (a curated gallery) under "Browse Inspiration" — it has no search/add capability.

## Plan

### `src/pages/TikTokLab/StoryboardsPage.tsx`

Add a search + link input section above "Browse Inspiration":

1. **Photo search bar** — a text input + "Search" button that calls the `unsplash-search` edge function (same as StoryboardBuilder does). Results display as a grid of clickable images.

2. **Link paste bar** — a text input + "Add" button for TikTok/Reels/YouTube URLs.

3. **Storyboard selector** — when the user clicks a photo or adds a link, show a small dropdown/dialog asking "Which storyboard?" listing their existing boards (or "Create new"). Then call the `save-to-storyboard` edge function to persist the item.

4. **Tab toggle** — "Photos" and "Links" tabs matching the StoryboardBuilder pattern, so users can switch between searching photos and pasting links.

### Files to Edit

- **`src/pages/TikTokLab/StoryboardsPage.tsx`** — Add the search/link section between the storyboard grid and "Browse Inspiration". Include:
  - Photo/Link tab toggle
  - Search input + results grid (photos tab)
  - Link paste input (links tab)
  - Storyboard picker dialog (reuse existing storyboard list from state)
  - Call `unsplash-search` edge function for photo search
  - Call `save-to-storyboard` edge function to persist items

No database changes needed — all tables and edge functions already exist.

