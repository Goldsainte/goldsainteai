

# Remove Experiences from Storyboard and Post a Trip

## Scope
Strip out the "Experiences" tab (Viator search integration) from the `StoryboardBuilder` component and remove the `ExperienceCard` component. This removes the ability to search/add Viator experiences from storyboards and the Post a Trip wizard. Photos and links remain.

## Files to Delete (1 file)
1. `src/components/storyboards/ExperienceCard.tsx` — standalone experience card component

## Files to Edit

### 1. `src/components/storyboards/StoryboardBuilder.tsx`
- Remove `ViatorProduct` type definition (lines 31-42)
- Remove `MapPin` from lucide imports
- Remove `"experience"` from the `Item.kind` union and `"viator"` from `Item.source` union
- Change `activeTab` state type from `"photos" | "experiences" | "links"` to `"photos" | "links"`
- Remove `experienceResults` state (line 61)
- Remove the `else if (activeTab === "experiences")` branch in `runSearch()` (lines 99-110)
- Remove `addExperience()` function (lines 136-154)
- Remove `buildViatorBookingUrl()` function (lines 156-165)
- Remove the Experiences `TabButton` (lines 300-305)
- Update search placeholder to remove the experiences variant (line 322-324 — just use the photos placeholder always)
- Remove the entire `activeTab === "experiences"` results block (lines 382-452)
- Remove the `item.kind === "experience"` preview block (lines 502-516)
- Update empty-state text from "photos, experiences and links" to "photos and links" (lines 456-458 and 486-487)

### 2. `src/components/storyboards/TravelStoryboard.tsx`
- Remove `ExperienceCard` import (line 5)
- In the items render (lines 210-228), remove the `ExperienceCard` fallback for non-image items; either skip non-image items or render a simple text fallback

### 3. `src/i18n/locales/en.json`
- Update `storyboardDescription` (line 87) to remove "and Viator experiences" from the copy

## What stays
- The `viator-search` edge function stays deployed (no harm, may be useful later)
- Photos tab and Links tab remain fully functional
- The inspiration gallery (`TravelStoryboard`) in Post a Trip Step 4 remains

