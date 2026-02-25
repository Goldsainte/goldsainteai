

# Travel Storyboards → Marketplace Conversion: Gap Analysis & Plan

## What Already Exists

The storyboard system is largely built. Here is the current state:

| Feature | Status |
|---|---|
| Create a new storyboard | Done — `/storyboards/new` |
| Name the storyboard | Done — title input in StoryboardBuilder |
| Add cover image | Partial — `cover_image_url` column exists but no UI to set it |
| Add visual pins (images, links, videos, notes) | Done — photos via Unsplash search, links via paste |
| Add structured trip details | Missing — storyboard has description/tags but no trip-specific fields (destination, dates, budget, travelers, pace, interests) |
| Save as draft | Done — saves to `storyboards` table |
| Submit to marketplace | Partial — "Convert to Trip" button exists, redirects to `/post-trip?fromStoryboard=ID`, but only pre-fills title and description. No structured trip fields transfer. |
| Pinterest-style visual grid | Partial — masonry columns layout exists but no drag-to-reorder, no delete items |

## What Needs to Be Built

### 1. Structured Trip Details on Storyboard (Database)

Add optional trip-planning fields to the `storyboards` table so users can enter structured details directly on the storyboard before converting:

```sql
ALTER TABLE public.storyboards
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS departure_city text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS budget_min numeric,
  ADD COLUMN IF NOT EXISTS budget_max numeric,
  ADD COLUMN IF NOT EXISTS budget_level text,
  ADD COLUMN IF NOT EXISTS travelers_adults integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS travelers_children integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS occasion text,
  ADD COLUMN IF NOT EXISTS accommodation_style text,
  ADD COLUMN IF NOT EXISTS pace text,
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS flexibility text,
  ADD COLUMN IF NOT EXISTS special_notes text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
```

The `status` field enables draft vs. submitted tracking (`draft` | `submitted`).

### 2. Cover Image Upload UI

**`src/pages/TikTokLab/StoryboardEditorPage.tsx`** — In the detail hero section, add a "Set cover image" button that:
- Lets user pick from existing storyboard items (click any photo to set as cover)
- Updates `cover_image_url` on the `storyboards` row
- Shows immediately in the hero

### 3. Trip Details Section in Editor

**`src/pages/TikTokLab/StoryboardEditorPage.tsx`** — Add a collapsible "Trip Details" section below the hero and above the builder. This section contains the structured fields (destination, dates, budget, travelers, pace, interests, etc.) that mirror the PostTripPage wizard but in a single-page layout. Fields auto-save on blur or change.

```text
┌──────────────────────────────────────────────────┐
│  [Cover Image Hero]                              │
│  Title · Description · Tags                      │
│  [Edit Details] [Submit to Marketplace →]        │
├──────────────────────────────────────────────────┤
│  ▼ Trip Details (collapsible)                    │
│    Destination    Departure City                 │
│    Start Date     End Date                       │
│    Adults         Children        Occasion       │
│    Budget $min – $max   Budget Style             │
│    Accommodation Style  Pace                     │
│    Interests: [pills]                            │
│    Flexibility    Special Notes                  │
├──────────────────────────────────────────────────┤
│  StoryboardBuilder (photos/links)                │
└──────────────────────────────────────────────────┘
```

### 4. "Submit to Marketplace" Button

Replace the current "Convert to Trip" link (which redirects to `/post-trip`) with an inline "Submit to Marketplace" action that:
1. Validates all required trip details are filled in
2. Creates a `trip_requests` row directly from the storyboard data
3. Links the storyboard to the trip request (`trip_request_id`)
4. Updates storyboard `status` to `submitted`
5. Shows success toast and navigates to `/my-trip-requests`

This eliminates the redirect to the 6-step wizard when the user has already filled in details on the storyboard itself. The "Convert to Trip" link remains as a fallback for users who prefer the guided wizard.

### 5. Delete Items from Storyboard

**`src/components/storyboards/StoryboardBuilder.tsx`** — Add an X button on each item in the preview grid to remove items. For saved items (with `id`), delete from `storyboard_items` table. For unsaved items, remove from local state.

### 6. Improved Prefill for Post-Trip Wizard

**`src/hooks/useStoryboardPrefill.ts`** — When converting via the wizard (`/post-trip?fromStoryboard=ID`), fetch all the new structured fields from the storyboard and pre-fill the wizard form with them (destination, dates, budget, travelers, pace, interests, etc.), not just title and description.

### Files to Edit

| File | Changes |
|---|---|
| **Database migration** | Add trip detail columns + status to `storyboards` table |
| **`src/pages/TikTokLab/StoryboardEditorPage.tsx`** | Cover image picker, trip details section, submit to marketplace action |
| **`src/components/storyboards/StoryboardBuilder.tsx`** | Delete items, set-as-cover button on photos |
| **`src/hooks/useStoryboardPrefill.ts`** | Fetch and map all new structured fields for wizard prefill |
| **`src/integrations/supabase/types.ts`** | Auto-updated after migration |

### What This Does NOT Change

- The PostTripPage wizard remains intact as an alternative path
- The storyboard remains a "Pinterest-style" visual board at its core
- No changes to RLS policies (existing owner-based policies cover the new columns)
- No changes to the marketplace trip request display

