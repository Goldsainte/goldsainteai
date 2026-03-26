

## Make Storyboards Publicly Shareable & Independently Discoverable

### Problem
Currently, `/storyboards/:id` is wrapped in `<RequireAuth>`, so no one can view a storyboard without logging in. There's no slug for clean URLs, no Open Graph metadata for social previews, and no public-facing view page.

### Changes

**1. Database: Add `slug` column + public read RLS**
- Migration: `ALTER TABLE storyboards ADD COLUMN slug TEXT UNIQUE;`
- Create a trigger function that auto-generates a slug from `title` on insert/update (e.g., `maldives-honeymoon-abc123` — title kebab-cased + short random suffix for uniqueness)
- Add RLS policy: `SELECT` for `anon` and `authenticated` roles `WHERE is_public = true`
- Add RLS policy for `storyboard_items`: `SELECT` where parent storyboard `is_public = true`

**2. New public page: `src/pages/public/PublicStoryboardPage.tsx`**
- Route: `/s/:slug` (clean, shareable URL) — update existing `StoryboardSharePage` redirect to render this instead
- No auth required — fetches storyboard by slug (falls back to ID) using a service function
- Displays: cover image hero, title, description, destination, creator info (avatar + name with link to profile), pin count
- Masonry grid of all items (same layout as current detail page but read-only)
- CTA buttons: "Design My Trip" (links to trip request flow), "Save to My Boards" (requires auth, opens save modal), "Fork This Board" (requires auth, clones storyboard)
- Increment `view_count` on load via an RPC or direct update
- Creator attribution card at bottom with link to their public profile

**3. Open Graph / social meta for link previews**
- Add `react-helmet-async` meta tags in `PublicStoryboardPage`: `og:title`, `og:description`, `og:image` (cover_image_url or first item image), `og:url`, plus Twitter card tags
- This ensures TikTok, IG link-in-bio, X, iMessage etc. show a rich preview

**4. Update share flow**
- In `StoryboardDetailPage`, update `handleShareLink` to use `/s/{slug}` URL instead of current page URL
- Add share buttons for specific platforms: Copy Link, Share to X, Share to WhatsApp/Telegram (using `navigator.share` on mobile, explicit URLs on desktop)
- Show the public URL prominently when `is_public` is toggled on

**5. Update storyboardsService.ts**
- Add `getStoryboardBySlug(slug)` function — queries by slug first, falls back to ID
- Add `incrementViewCount(id)` function
- Update `createStoryboard` and `updateStoryboard` to handle slug generation (server-side via trigger)

**6. Route changes in `AppRoutes.tsx`**
- Change `/s/:slugOrId` from redirect to rendering `PublicStoryboardPage` directly (no auth wrapper)
- Keep `/storyboards/:id` as the authenticated editor view

### Public Page Layout
```text
┌─────────────────────────────────────────────┐
│  Cover Image (full-width, h-72, gradient)   │
│  ┌─────────────────────────────────────┐    │
│  │ STORYBOARD · 12 pins · Maldives    │    │
│  │ "Maldives Overwater Paradise"       │    │
│  │ by @RaduTravels · 1.2K views       │    │
│  └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│  [Design My Trip]  [Save Board]  [Share]    │
├─────────────────────────────────────────────┤
│  Masonry pin grid (read-only)               │
│  ┌──┐ ┌────┐ ┌──┐ ┌────┐                   │
│  │  │ │    │ │  │ │    │                   │
│  └──┘ │    │ └──┘ └────┘                   │
│       └────┘                                │
├─────────────────────────────────────────────┤
│  Creator Card: avatar + "Curated by Radu"  │
│  [View Profile] [Design My Trip]            │
├─────────────────────────────────────────────┤
│  Related Public Storyboards (carousel)      │
└─────────────────────────────────────────────┘
```

### Files

| Action | File |
|--------|------|
| Migration | Add `slug` column, trigger, public RLS policies |
| Create | `src/pages/public/PublicStoryboardPage.tsx` |
| Edit | `src/pages/public/StoryboardSharePage.tsx` → remove redirect, render public page |
| Edit | `src/routes/AppRoutes.tsx` — update `/s/:slugOrId` route |
| Edit | `src/services/storyboardsService.ts` — add `getBySlug`, `incrementViews` |
| Edit | `src/pages/storyboards/StoryboardDetailPage.tsx` — update share URL to use slug |

