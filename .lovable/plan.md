

## Enhanced Creator Public Profile Page — Conversion-Focused Redesign

### Current State
The profile page reads from the `profiles` table only, missing rich data in `creator_profiles` (tagline, content_style_tags, destinations_focus_tags, travel_budget_level, languages, etc.). The layout is functional but sparse — flat bio text, generic empty states, no trust/credibility section, no "How This Creator Works" flow, and no structured request form.

### Database Changes

**Migration: Add new columns to `creator_profiles`**
```sql
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS trips_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clients_served INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certifications TEXT[],
  ADD COLUMN IF NOT EXISTS travel_styles TEXT[],
  ADD COLUMN IF NOT EXISTS best_for TEXT[],
  ADD COLUMN IF NOT EXISTS not_ideal_for TEXT[],
  ADD COLUMN IF NOT EXISTS response_time_hours INTEGER,
  ADD COLUMN IF NOT EXISTS specialties TEXT[];
```

No new tables needed — `creator_profiles` already has tagline, content_style_tags, destinations_focus_tags, and travel_budget_level.

### Architecture

The profile page currently only queries `profiles`. It needs to also query `creator_profiles` to get the richer data. This is the key data wiring change.

```text
CreatorPublicProfilePage
├── Query: profiles (basic info)
├── Query: creator_profiles (rich creator data) ← NEW
├── Query: profile_reviews (avg rating + count)
├── Query: packaged_trips count (trips_completed fallback)
│
├── ProfileHero (enhanced with tagline, inline stats + CTAs)
├── AboutSection (structured: bio, specialties tags, travel styles)
├── TrustCredibilitySection (new component)
├── CreatorMediaGallery (existing)
├── ProfileTripsGrid (enhanced empty state)
├── HowThisCreatorWorks (new component)
├── ReviewsSection (enhanced with summary bar)
├── ProfileSidebar (enhanced with last_active, response_time, trust line)
```

### Plan by Section

**1. Hero Enhancement** — `ProfileHero.tsx`
- Add `tagline` prop displayed under the name (1-line italic text)
- Always show stats row: Trips Completed, Followers, Avg Rating (with stars)
- Add verified badge tooltip: "Verified by Goldsainte"
- Add inline Follow + Request a Trip CTAs below stats on mobile (hero bottom)
- Microcopy under Request CTA: "Tell us your preferences → get a custom itinerary"

**2. Structured About Section** — inline in `CreatorPublicProfilePage.tsx`
- "About Me" paragraph (existing bio)
- "What I Specialize In" — render `specialties` or `content_style_tags` as chips
- "Travel Style" — render `travel_styles` or `travel_budget_level` as chips
- If all empty, show a placeholder: "This creator is building their profile"

**3. Trust & Credibility Section** — new `CreatorTrustSection.tsx`
- Years of experience (from `years_experience`)
- Trips planned / clients served (from `trips_completed` / `clients_served`, fallback to published trip count)
- Certifications list (from `certifications`)
- "Verified Partner" with expandable tooltip
- Renders as a horizontal card row with icons

**4. Content Gallery** — existing `CreatorMediaGallery.tsx`
- No structural changes needed
- Add "Connect Instagram" CTA when no media items and `instagram_handle` is null
- Make social icons in sidebar clickable (already done)

**5. Marketplace Trips Empty State** — `ProfileTripsGrid.tsx`
- Replace "No trips yet" dead-end with:
  - "Trips coming soon" headline
  - "Request a custom trip from this creator" button (triggers same `onRequestTrip`)
  - Remove the sad empty box aesthetic

**6. Reviews Section Enhancement** — inline + `ReviewsList.tsx`
- Add star rating summary bar above reviews list (5-star breakdown visual)
- When 0 reviews: show empty stars + "No reviews yet — be the first" with CTA
- Always show the Write a Review button (not conditionally hidden)

**7. "How This Creator Works"** — new `HowCreatorWorks.tsx`
- Step 1: Submit your trip request (with icon)
- Step 2: Creator builds your custom itinerary
- Step 3: Review, refine & book securely
- Rendered as a horizontal 3-step card with connecting lines
- Replaces the generic sidebar "How it works" (sidebar version becomes a compact reference)

**8. Audience / Fit Section** — inline in page
- "Best For" chips (solo, couples, families, groups) from `best_for`
- "Not Ideal For" chips (optional, from `not_ideal_for`)
- Only rendered if data exists

**9. Sidebar Enhancements** — `ProfileSidebar.tsx`
- Add "Last Active" line (compute from `updated_at` on `creator_profiles` → "Active 2 days ago")
- Add "Response Time" line (from `response_time_hours` → "Responds within 24 hours")
- Add trust line: "Secure booking through Goldsainte" with shield icon
- Keep Follow + Request Trip CTAs
- Add microcopy under Request Trip: "Tell us your preferences → get a custom itinerary"

**10. Zero State Rules** — throughout
- Followers = 0 → show "New Creator" badge instead of "0"
- No content → show guided CTA instead of blank
- No trips → "Trips coming soon" + Request CTA
- No reviews → empty stars + "Be the first" CTA

**11. Request a Trip CTA Behavior** — `RequestTripModal.tsx` (new)
- Instead of redirecting to `/post-trip`, open a structured modal/drawer with:
  - Destination (text input)
  - Dates (date range picker)
  - Budget range (select: Under $2K, $2K-$5K, $5K-$10K, $10K+)
  - Preferences (textarea)
- Submits to existing trip request flow with `fromCreator` pre-set

### Files

- **New**: `src/components/creator/CreatorTrustSection.tsx`
- **New**: `src/components/creator/HowCreatorWorks.tsx`
- **New**: `src/components/creator/RequestTripModal.tsx`
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — query `creator_profiles`, wire all new sections, structured about, audience/fit section
- **Edit**: `src/components/profile/ProfileHero.tsx` — add tagline, always-show stats, inline mobile CTAs, tooltip on verified badge
- **Edit**: `src/components/profile/ProfileSidebar.tsx` — add last active, response time, trust line, microcopy
- **Edit**: `src/components/profile/ProfileTripsGrid.tsx` — enhanced empty state with CTA
- **Edit**: `src/components/profile/ReviewsList.tsx` — add rating summary bar, enhanced zero state
- **Edit**: `src/components/creator/CreatorMediaGallery.tsx` — add "Connect Instagram" CTA for empty + no handle
- **Migration**: Add new columns to `creator_profiles`

