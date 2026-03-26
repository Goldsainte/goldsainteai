

## Pinterest-Style Discovery Engine — Phase 1 Implementation

This is a large system. To ship something tangible and valuable, this plan covers the **core discovery loop** — the parts that transform the experience from "a profile page" into "a visual discovery engine." Later phases can add recommendation learning, re-pin attribution tracking, and advanced personalization.

### What Gets Built

**Phase 1 delivers:**
1. Subcategory drill-down chips with Unsplash-powered dynamic image feed
2. Save/Pin to storyboard flow from discovery images
3. Re-pin from other creators' storyboards
4. "More Like This" refinement
5. Storyboard detail page upgrade with pin grid + re-pin + trip CTA

---

### 1. Subcategory Drill-Down System

**File: `src/components/ui/CategoryChips.tsx`** — extend with subcategory data

Add a `SUBCATEGORIES` map keyed by top-level category. When a top category is selected, expose the subcategories via a new `SubcategoryChips` component rendered as a second row.

```text
SUBCATEGORIES = {
  "Luxury Escapes": ["Beach Villas", "Private Islands", "Safari Lodges", "Desert Resorts", "Yacht Travel", "Spa Retreats"],
  "Food & Culture": ["Street Food", "Fine Dining", "Wine Regions", "Local Markets", "Cooking Classes"],
  "Romantic Getaways": ["Honeymoon", "Overwater Villas", "Sunset Dinners", "Couples Spa"],
  ...all 10 categories
}
```

Each subcategory also maps to Unsplash search terms for query building.

---

### 2. Unsplash-Powered Discovery Feed

**New file: `src/components/discovery/DiscoveryFeed.tsx`**

This is the core engine. It:
- Takes the active category + subcategory path and builds an Unsplash query (e.g. "luxury beach villa travel")
- Calls the existing `unsplash-search` edge function
- Renders results in the existing masonry layout
- Supports infinite scroll (page increment on scroll)
- Mixes Unsplash results with existing storyboard pins (creator's own pins appear first, then Unsplash fills the rest)

**New file: `src/hooks/useDiscoveryFeed.ts`**

Hook managing:
- `discoveryPath`: `{ category, subcategory, tags[] }`
- Query builder: concatenates path segments into Unsplash search string
- Pagination state with `useInfiniteQuery`
- Debounced query updates on path change

---

### 3. Save to Storyboard Modal

**New file: `src/components/discovery/SaveToStoryboardModal.tsx`**

When user hovers/taps a discovery image and clicks "Save":
- Modal opens showing user's storyboards
- User picks an existing board or creates a new one
- Saves the image as a `storyboard_item` with `source_type: "unsplash"`, `source_id` (Unsplash photo ID), category path in metadata
- Toast confirmation

This reuses `addStoryboardItem` from `storyboardsService.ts`. The modal fetches boards via `getMyStoryboards`.

---

### 4. Re-Pin from Other Storyboards

**Database migration** — add columns to `storyboard_items`:
```sql
ALTER TABLE public.storyboard_items
  ADD COLUMN IF NOT EXISTS repinned_from_item_id uuid REFERENCES public.storyboard_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS repinned_from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
```

**RLS**: existing policies already allow insert into own storyboards. The re-pin just copies data with attribution.

**UI**: On the storyboard detail page and creator feed, each pin's hover overlay gets a "Save" button. Clicking opens the same `SaveToStoryboardModal`, but pre-fills `repinned_from_item_id` and `repinned_from_user_id`.

---

### 5. Discovery Feed on Creator Profile

**Edit: `src/components/creator/CreatorPinterestFeed.tsx`**

Major upgrade:
- Import `CategoryChips` + new `SubcategoryChips`
- Add `useDiscoveryFeed` hook alongside existing pins
- When category/subcategory selected: show creator's matching pins first, then Unsplash discovery images below a subtle divider
- Each image card gets hover actions: "Save to Storyboard", "More Like This", "Plan a trip"
- "More Like This" click: refines the discovery path by adding the image's tags as search terms, triggering a feed refresh
- Infinite scroll loads more Unsplash results

---

### 6. Storyboard Detail Page Upgrade

**Edit: `src/pages/storyboards/StoryboardDetailPage.tsx`**

- Add masonry pin grid (same layout as creator feed)
- Each pin shows "Save / Re-pin" on hover for non-owners
- Add "Start a trip from this storyboard" CTA button at the top
- Add "More Like This" section at the bottom: query Unsplash using the storyboard's tags/title to show related inspiration
- Add "Related Storyboards" section: query public storyboards with similar destinations/tags

---

### 7. Discovery Session State

**New file: `src/hooks/useDiscoverySession.ts`**

Client-side session state (no DB table needed for Phase 1):
```ts
{
  topCategory: string | null,
  subcategory: string | null,
  activeTags: string[],
  lastQuery: string,
}
```

Stored in React context. Every category/subcategory/tag click updates the session. The feed hook reads from this to build queries. This keeps the progressive refinement feeling without needing a database table yet.

---

### Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Edit | `src/components/ui/CategoryChips.tsx` | Add subcategory data map + `SubcategoryChips` component |
| Create | `src/components/discovery/DiscoveryFeed.tsx` | Masonry feed with Unsplash + pin mixing |
| Create | `src/components/discovery/SaveToStoryboardModal.tsx` | Save/re-pin modal with board selector |
| Create | `src/hooks/useDiscoveryFeed.ts` | Infinite query hook for Unsplash + path building |
| Create | `src/hooks/useDiscoverySession.ts` | Client-side discovery path state |
| Edit | `src/components/creator/CreatorPinterestFeed.tsx` | Integrate discovery feed, subcategory drill-down, save actions |
| Edit | `src/pages/storyboards/StoryboardDetailPage.tsx` | Masonry layout, re-pin, trip CTA, related content |
| Migration | Add `repinned_from_item_id`, `repinned_from_user_id` to `storyboard_items` | Re-pin attribution |

### What's Deferred to Phase 2
- Server-side `discovery_sessions` table with persistent learning
- Recommendation engine based on save/repin behavior
- "Similar Creators" suggestions
- Separate `/discover` page (standalone discovery outside creator profiles)
- Like/follow actions on pins
- Pin-level analytics (clicks, saves, repins)

