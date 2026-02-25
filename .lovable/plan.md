

# Part 2: Structured Storyboard Fields — Must-Haves, Dealbreakers, Budget & Vibe Tags

## Current State

The storyboard editor already has a collapsible "Trip Details" section with: destination, departure city, dates, travelers, occasion, budget min/max, budget level, accommodation style, pace, flexibility, interests pills, and special notes.

**What's missing per the spec:**

| Spec Requirement | DB Column | UI | Status |
|---|---|---|---|
| Trip length (days) | Missing | Missing | New |
| Budget per-person toggle | Missing | Missing | New |
| Vibe & Experience Tags (Romantic, Wellness, etc.) | `interests` exists but has wrong options | Partially built | Update options |
| Must-Haves (5-star hotel, yacht day, etc.) | Missing | Missing | New |
| Dealbreakers (no red-eyes, no hostels, etc.) | Missing | Missing | New |

## Plan

### 1. Database Migration

Add 3 new columns to `storyboards`:

```sql
ALTER TABLE public.storyboards
  ADD COLUMN IF NOT EXISTS trip_length_days integer,
  ADD COLUMN IF NOT EXISTS budget_per_person boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS must_haves text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dealbreakers text[] DEFAULT '{}';
```

No RLS changes needed — existing owner-based policies cover new columns.

### 2. `src/pages/TikTokLab/StoryboardEditorPage.tsx`

**Update option arrays** at the top of the file:

- Replace `INTEREST_OPTIONS` with the spec's vibe/experience tags: Romantic, Adventure, Wellness, Cultural, Nightlife, Relaxation, Luxury, Family-friendly, Food-focused, Beach, City
- Add `MUST_HAVE_OPTIONS`: 5-star hotel, Boutique hotel, All-inclusive, Private transfers, Yacht day, Guided tours, Michelin dining, Spa day, VIP nightlife, Child-friendly activities
- Add `DEALBREAKER_OPTIONS`: No red-eye flights, No long layovers, No hostels, No tourist-heavy areas, No shared rooms

**Expand `StoryboardData` type** to include `trip_length_days`, `budget_per_person`, `must_haves`, `dealbreakers`.

**Expand `tripFields` state** to include the 4 new fields.

**Update Trip Details form** — add 4 new sections inside the collapsible:

```text
Existing rows...
├── [NEW] Trip Length (days) input — between Dates row and Travelers row
├── [NEW] Budget per-person toggle — next to Budget Level
├── [NEW] Vibe & Experience Tags — replaces current Interests (same toggle-pill UI, new labels)
├── [NEW] Must-Haves — toggle pills (same pattern as interests)
├── [NEW] Dealbreakers — toggle pills + optional free-text input
└── Special Notes (existing)
```

All new fields auto-save on blur/change using the existing `saveTripField` callback, which already handles arrays and integers. The `submitToMarketplace` function already passes all `tripFields` to `trip_requests`, so new fields will need to be mapped there too (if those columns exist on `trip_requests` — if not, they go into `source_metadata` JSON).

**Update the hero summary pills** to show must-haves count and dealbreakers count if populated.

### 3. Pre-fill Hook Update

**`src/hooks/useStoryboardPrefill.ts`** — Map the 4 new fields so the Post-Trip wizard also receives them when using the "Use Trip Wizard" fallback path.

### Files to Edit
- **Database migration** — Add `trip_length_days`, `budget_per_person`, `must_haves`, `dealbreakers` columns
- **`src/pages/TikTokLab/StoryboardEditorPage.tsx`** — New fields in type, state, form UI, and submit logic
- **`src/hooks/useStoryboardPrefill.ts`** — Map new fields for wizard prefill

