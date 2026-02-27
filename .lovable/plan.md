

# Diverse Unsplash Cover Image Selection System

## Current State
There is **no auto-cover-image selection** today. Trip creators manually upload covers via `TripBuilderForm`. When no cover is set, `LiveTripCard` falls back to a single hardcoded Unsplash URL (`photo-1469474968028-56623f02e42e`). The duplicate problem stems from this single fallback and from creators not uploading covers.

## Plan

### 1. Database: `city_image_usage` tracking table (migration)
```sql
CREATE TABLE public.city_image_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug TEXT NOT NULL,
  unsplash_photo_id TEXT NOT NULL,
  unsplash_url TEXT NOT NULL,
  photographer TEXT,
  used_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_slug, unsplash_photo_id)
);
CREATE INDEX idx_city_image_city_slug ON public.city_image_usage(city_slug);
```
RLS: public read, service-role write (edge function writes to it).

### 2. Edge function: `select-trip-cover` 
New edge function that:
- Accepts `{ destination: string, trip_id?: string }`
- Normalizes destination → `city_slug` (lowercase, trim, slugify)
- Queries Unsplash API with rotating themed keywords: `"{city} skyline"`, `"{city} luxury hotel"`, `"{city} beach"`, `"{city} street"`, `"{city} nature"`, `"{city} food"` — picks 2-3 themes per call, requests `per_page=15` each to build a pool of 30-45 candidates
- Fetches `city_image_usage` for that `city_slug` to get recently-used photo IDs
- Filters out any photo used in the last 15 entries for that city (no-repeat window)
- Also filters out same photographer within last 5 uses
- If pool gets too small (<5), expands query with `"{city}, {country}"` or landmark variants; if still small, falls back to least-recently-used
- Applies weighted random selection (higher Unsplash relevance score → higher weight, seeded by `trip_id` if provided for determinism)
- Upserts selected photo into `city_image_usage`
- Returns `{ url, unsplash_photo_id, photographer }`

### 3. Wire into Trip Builder (`TripBuilderForm.tsx`)
- When destination field is filled and cover_image_url is empty, auto-call `select-trip-cover` to suggest a cover
- Show the suggested image with a "Shuffle" button (calls the function again) and "Upload your own" option
- Only auto-assign if creator hasn't uploaded a custom image

### 4. Replace hardcoded fallback in `LiveTripCard.tsx`
- Remove the hardcoded Unsplash fallback URL
- For trips without covers: either show a placeholder gradient/icon, or call the cover selection at display time (cached per trip)
- Preferred: assign covers at creation time so display is always instant

### 5. Backfill existing trips (optional one-time)
- A small admin action or edge function that finds `packaged_trips` with null `cover_image_url`, calls `select-trip-cover` for each, and updates the row

### Files modified
- **New migration** — `city_image_usage` table + RLS
- **New edge function** — `supabase/functions/select-trip-cover/index.ts`
- **`src/components/trips/TripBuilderForm.tsx`** — auto-suggest cover + shuffle button
- **`src/components/marketplace/LiveTripCard.tsx`** — remove hardcoded fallback

