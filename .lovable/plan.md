

# Show Full Storyboard Details When Clicking a Storyboard

## Problem
When you click on an existing storyboard, the editor page only shows photos in a builder interface. None of the storyboard metadata you entered is visible — no title display, no description, no tags, no creation date, no cover image. The page immediately jumps into "edit mode" with just photos and a search bar, giving you no context about what this storyboard was about.

## Root Cause
1. `StoryboardEditorPage` fetches only 4 fields (`id, title, created_at, related_concierge_session_id`) — ignoring `description`, `tags`, `cover_image_url`, `is_public`, `role`, `updated_at`
2. The fetched title is never even displayed — it's only used for the page heading ("Edit Storyboard")
3. `StoryboardBuilder` receives the `storyboardId` but only loads items (photos/links). It has no concept of displaying storyboard-level details
4. There is no "detail view" section — only an "edit view"

## Plan

### 1. `src/pages/TikTokLab/StoryboardEditorPage.tsx` — Full detail header + enriched data fetch

**Fetch all storyboard fields:**
Update the query from `select("id, title, created_at, related_concierge_session_id")` to `select("*")` to get description, tags, cover_image_url, is_public, role, updated_at, trip_request_id, etc.

**Add a detail hero section above the builder:**
When in edit mode, render a full storyboard detail header between the "Back" link and the StoryboardBuilder:

```text
┌──────────────────────────────────────────────────┐
│  [Cover image — full width, aspect-[21/9]]       │
│                                                  │
├──────────────────────────────────────────────────┤
│  Title (large, serif)                            │
│  Description (body text)                         │
│  Tags: [beach] [honeymoon] [luxury]              │
│  Created: Jan 15, 2026  ·  12 items  ·  Private  │
│  [Edit Details]  [Convert to Trip →]             │
└──────────────────────────────────────────────────┘
│  StoryboardBuilder (existing — photos/links)     │
└──────────────────────────────────────────────────┘
```

- **Cover image**: Full-width banner with `aspect-[21/9]` or `aspect-[16/7]`, rounded corners, gradient overlay at bottom. Falls back to cream placeholder if no cover.
- **Title**: Displayed as `text-2xl font-display` heading (not an input).
- **Description**: Full text shown, not truncated.
- **Tags**: Pill badges matching the listing page style.
- **Meta row**: Created date, item count (fetched from items), public/private badge.
- **Actions**: "Edit Details" button opens a dialog to edit title/description/tags. "Convert to Trip" button links to `/post-trip?fromStoryboard=ID`.

**Add an "Edit Details" dialog:**
A simple dialog with inputs for title, description, tags, and visibility toggle. On save, updates the `storyboards` row via Supabase and refreshes the local state.

### 2. `src/components/storyboards/StoryboardBuilder.tsx` — Pre-fill title from loaded storyboard

Currently, when editing an existing storyboard, the title input starts blank because `initialTitle` is only set from the URL query param. Update the component to also fetch the storyboard's title when `storyboardId` is provided, so the title input shows the saved title.

Add to the existing `loadItems` effect: also fetch the storyboard title and set it if `initialTitle` is empty.

### Files to Edit
- **`src/pages/TikTokLab/StoryboardEditorPage.tsx`** — Fetch all fields, add detail hero section, add edit details dialog
- **`src/components/storyboards/StoryboardBuilder.tsx`** — Load and display saved title when editing existing storyboard

No database changes needed — all fields already exist in the `storyboards` table.

