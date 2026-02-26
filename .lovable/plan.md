

# Fix Browse Inspiration: Add Search + Fix Broken Save Flow

## Problem 1: No Search
The `TravelStoryboard` component has no search or filter input. Users can only scroll through a static grid with no way to find specific images.

## Problem 2: Broken Save Flow
The `save-to-storyboard` edge function inserts columns that **don't exist** on the `storyboard_items` table. The edge function uses `kind`, `source`, `media_url`, `caption`, `location_label`, `category_tag`, `order_index`, `layout_type`, `data` — but the actual table columns are `item_type`, `image_url`, `title`, `subtitle`, `description`, `source_type`, `source_id`, `position`, `metadata`. Every save silently fails.

Additionally, `SaveToStoryboardButton` passes `assetType: "brand_collection"` which isn't mapped in the edge function's `kindMap` (only handles `photo`, `video`, `experience`, `note`).

---

## Changes

### 1. Add search/filter to `TravelStoryboard` component
- Add a search input at the top of the component that filters images by `label`, `destination_tags`, and `mood_tags`
- Add pill-style tag filters for popular mood categories (luxury, beach, adventure, dining, etc.)
- Style to match the editorial aesthetic (serif labels, gold accents)

### 2. Fix the edge function `save-to-storyboard/index.ts`
Remap the insert to use the correct column names:
- `kind` → `item_type`
- `media_url` → `image_url`
- `caption` → `title`
- `location_label` → `subtitle`
- `order_index` → `position`
- `data` → `metadata`
- Remove `layout_type` and `category_tag` (don't exist)
- Add `source_type` and `source_id` mapping
- Add `brand_collection` to the type map

### 3. Fix `SaveToStoryboardButton` asset type
- When saving an inspiration image, pass `assetType: "photo"` instead of `"brand_collection"`, or update the edge function to handle `brand_collection` by mapping it to `item_type: "image"`.

### Summary
| Fix | File |
|-----|------|
| Add search input + tag filters | `src/components/storyboards/TravelStoryboard.tsx` |
| Fix column name mismatches | `supabase/functions/save-to-storyboard/index.ts` |
| Fix asset type mapping | `supabase/functions/save-to-storyboard/index.ts` |

