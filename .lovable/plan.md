

## Fix: Instagram/TikTok Reel Links Show Generic Icon Instead of Thumbnail

### Problem
When a creator adds an Instagram or TikTok Reel URL, both the uploader grid and the public gallery show a plain icon placeholder (Film icon + "Instagram Reel" text) instead of an actual thumbnail image from the post.

### Solution
Create a backend function that fetches thumbnail images from Instagram/TikTok oEmbed APIs when a link is added, and store the `thumbnail_url` alongside the entry.

### Plan

**1. New edge function: `fetch-social-thumbnail`**
- Accepts a social media URL
- Calls the free oEmbed proxy (`noembed.com/embed?url=...`) which supports both Instagram and TikTok without API keys
- Returns the thumbnail URL from the oEmbed response
- Fallback: if oEmbed fails, return `null` (keeps the current icon placeholder as a graceful degradation)

**2. Update `CreatorMediaUploader.tsx` — call edge function on link add**
- When the user clicks "Add" for an Instagram/TikTok link, call `fetch-social-thumbnail` before creating the entry
- Set the returned thumbnail as `thumbnail_url` on the `MediaEntry`
- Show a brief loading state on the Add button while fetching

**3. Update `CreatorMediaUploader.tsx` grid — render thumbnails**
- For external items with a `thumbnail_url`, render an `<img>` with the thumbnail instead of the generic Film icon
- Keep the source badge (Instagram/TikTok) overlaid on the thumbnail
- Fall back to the current icon placeholder if no thumbnail exists

**4. Update `CreatorMediaGallery.tsx` — render thumbnails on public profile**
- Same rendering logic: if `thumbnail_url` exists, show the image; otherwise show the icon placeholder
- Keep the click-to-open-external-link behavior

### Files
- **New**: `supabase/functions/fetch-social-thumbnail/index.ts`
- **Edit**: `src/components/creator/CreatorMediaUploader.tsx` — fetch thumbnail on add, render in grid
- **Edit**: `src/components/creator/CreatorMediaGallery.tsx` — render thumbnail images

### Technical Detail
```text
User pastes Instagram URL → clicks Add
  → POST /functions/v1/fetch-social-thumbnail { url }
  → Edge function calls https://noembed.com/embed?url=<encoded_url>
  → Returns { thumbnail_url: "https://..." }
  → MediaEntry created with thumbnail_url set
  → Grid renders <img> instead of icon placeholder
```

