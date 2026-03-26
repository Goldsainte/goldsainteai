

## "Sell My Storyboard Experience" — AI-Powered Trip Listing from Storyboard

### What This Does
Adds a "Sell This Experience" CTA to the storyboard detail page. When a creator clicks it, an edge function reads the storyboard's items (titles, descriptions, images, destination, tags) and uses OpenAI to generate a full `packaged_trips` draft — title, description, highlights, inclusions, pricing suggestion, duration, tags, and cover image. The creator reviews, tweaks, and publishes.

### Flow
```text
Storyboard Detail Page
  └─ Creator clicks "Sell This Experience" (gold CTA)
      └─ Loading state with "AI is designing your trip..."
      └─ Edge function: storyboard-to-trip
          ├─ Reads storyboard + items from DB
          ├─ Sends to OpenAI (gpt-4o) with structured output
          └─ Returns trip draft JSON
      └─ Inserts draft into packaged_trips (status: "draft")
      └─ Redirects to /trip-builder?edit={newTripId}
          └─ Creator reviews AI-generated fields, adjusts pricing, publishes
```

### Changes

**1. New edge function: `supabase/functions/storyboard-to-trip/index.ts`**
- Accepts `{ storyboardId }` + auth header
- Loads storyboard row (title, destination, description, tags, interests) and all storyboard_items (titles, subtitles, descriptions, image_urls)
- Calls OpenAI gpt-4o with tool-calling to extract structured trip data:
  - `title`, `description`, `destination`, `duration_days`, `duration_nights`, `highlights` (array), `included` (array), `not_included` (array), `tags`, `price_per_person` (suggested), `activity_level`, `cover_image_url` (first storyboard image)
- Inserts into `packaged_trips` with `status: "draft"`, `creator_id: userId`
- Returns `{ tripId, slug }`

**2. Edit `src/pages/storyboards/StoryboardDetailPage.tsx`**
- Add a "Sell This Experience" button (gold, with Sparkles icon) in the owner action bar, next to "Edit Details" and "Start a trip from this"
- On click: call the edge function, show loading spinner, then redirect to `/trip-builder?edit={tripId}`
- Only visible when `isOwner` is true

**3. Add to `src/pages/storyboards/MyStoryboardsPage.tsx`**
- Add a subtle "Sell" icon/link on each storyboard card for quick access (secondary, not blocking)

### Design Details
- CTA style: `bg-gradient-to-r from-[#C7A962] to-[#b89a55] text-white rounded-full px-6` with Sparkles icon
- Loading overlay: centered spinner with "AI is designing your marketplace listing..." text
- The generated trip pre-fills everything so the creator just needs to confirm pricing and publish

### Edge Function AI Prompt Strategy
Uses OpenAI (per project mandate) with tool-calling for structured output. The prompt instructs the model to act as a luxury travel product designer, converting visual inspiration (pin titles/descriptions) into a bookable trip listing with luxury-tier language matching the Goldsainte brand voice.

