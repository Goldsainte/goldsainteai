

## Enhanced Content Gallery — Photos/Videos Tabs with Custom Thumbnails

### Overview
Upgrade the portfolio management (`CreatorPortfolioTab`) and public gallery (`CreatorMediaGallery`) to support separate Photos and Videos sections with tabbed navigation, custom video thumbnails, and per-item actions (set as cover, change thumbnail, delete).

### Database Migration
Add an `is_cover` boolean column to `creator_media`:
```sql
ALTER TABLE public.creator_media ADD COLUMN is_cover BOOLEAN DEFAULT false;
```
No other schema changes needed — `thumbnail_url` already exists for custom video covers.

### Changes

**1. `CreatorMediaUploader.tsx` — Split into tabbed Photos/Videos uploader**
- Add Tabs (Photos | Videos) using existing `@/components/ui/tabs`
- Photos tab: grid of `media_type = 'image'` items with hover actions (Delete, Set as Cover)
- Videos tab: grid of `media_type = 'video'` items with hover actions (Delete, Change Thumbnail)
- Separate upload buttons per tab (accept `image/*` vs `video/*`)
- Keep social link input in Videos tab
- Add `is_cover` to `MediaEntry` interface
- "Set as Cover" on a photo: sets `is_cover = true` on that item, clears others
- "Change Thumbnail" on a video: opens a file picker for a custom thumbnail image, uploads it, sets `thumbnail_url`
- Video thumbnail scrubber (Option A): use a `<video>` element + canvas to let user seek and capture a frame as a blob, upload as thumbnail. Fallback to file upload if canvas capture fails.

**2. `CreatorPortfolioTab.tsx` — Wire new fields**
- Pass `is_cover` through to the uploader and include in upsert rows
- Remove the separate "Cover Image" section at the top — cover is now selected from within the gallery photos
- Update save logic to persist `is_cover` and `thumbnail_url` changes

**3. `CreatorMediaGallery.tsx` — Tabbed public gallery**
- Add Photos/Videos tabs (default: Photos)
- Photos tab: grid of images, highlight the cover photo with a small star badge
- Videos tab: grid of videos showing custom thumbnails (or fallback frame), click to play inline or open
- Keep existing fallback/empty state logic but split by type
- Move gallery higher on the profile page (above "Who This Is For" section)

**4. `CreatorPublicProfilePage.tsx` — Reposition gallery**
- Move `<CreatorMediaGallery>` from line 366 to directly after the About section (line ~290), above specialties/audience fit
- This puts visual content higher for trust and conversion

### Files
- **Migration**: Add `is_cover` column to `creator_media`
- **Edit**: `src/components/creator/CreatorMediaUploader.tsx` — tabbed layout, per-item actions, video thumbnail picker/scrubber
- **Edit**: `src/pages/creator/components/CreatorPortfolioTab.tsx` — remove separate cover section, wire `is_cover`
- **Edit**: `src/components/creator/CreatorMediaGallery.tsx` — tabbed public view, cover badge
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — move gallery higher

### Technical Details
- Video frame capture: render `<video>` in a hidden element, seek to user-selected time, draw to `<canvas>`, export as blob, upload to storage
- Tabs use existing Radix `@/components/ui/tabs` — no new dependencies
- Empty states per tab: "No photos yet" / "No videos yet" with appropriate upload CTAs
- Cover photo stored as `is_cover = true` on the `creator_media` row (only one at a time, enforced in code)

