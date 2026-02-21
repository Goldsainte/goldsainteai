

# Restore and Wire Storyboard to Post a Trip

## The Problem

The storyboard builder on the Post a Trip page has two critical issues:

1. **It's hidden** -- buried behind a small "Add visual storyboard" collapsible toggle on the final review step. Most users will never see it.
2. **It's disconnected** -- even when a user builds a storyboard and clicks "Save storyboard," the resulting `storyboardId` is captured in React state but **never written to the database** when the trip is submitted. The `handleSubmit` function inserts into `trip_requests` without any storyboard reference.

This means storyboard photos, experiences, and links are lost on submission and never appear in the marketplace.

## The Fix

### 1. Promote the Storyboard Builder to Its Own Step

Move the storyboard builder from a hidden collapsible on Step 5 to **Step 4** (its own dedicated step), and shift the current Steps 4-5 forward. The new flow becomes:

| Step | Content |
|------|---------|
| 1 | Destination and Dates |
| 2 | Travelers and Budget |
| 3 | Style and Interests |
| 4 | **Visual Storyboard** (new dedicated step) |
| 5 | Flexibility and Responder Role |
| 6 | Review and Post |

The storyboard builder will render full-width with clear messaging: "Build your visual brief -- this is what creators and agents see when they receive your trip."

### 2. Link the Storyboard to the Trip Request on Submit

When the form is submitted in `handleSubmit`:

- Include the `storyboardId` in `source_metadata` as `source_storyboard_id`
- After inserting the `trip_request`, update the `storyboards` row to set `trip_request_id` to the newly created trip request ID

This creates a two-way link:
- `trip_requests.source_metadata.source_storyboard_id` points to the storyboard
- `storyboards.trip_request_id` points back to the trip request

### 3. Display the Storyboard in the Marketplace

The `TripStoryboardViewer` component already queries storyboards by `trip_request_id` and renders them. Once the link is established in step 2, trip detail pages in the marketplace will automatically show the traveler's storyboard images and experiences.

## Technical Details

### File: `src/pages/trips/PostTripPage.tsx`

**Step count change:**
- `TOTAL_STEPS` changes from `5` to `6`
- Step labels array updated to include "Storyboard" at index 3

**Step 4 content (new):**
- Render `StoryboardBuilder` component directly (not collapsed)
- Pass `mode="traveler"`, `initialTitle={title || destination}`, `destination={destination}`
- `onSaved` callback sets `storyboardId` state

**Step rendering shift:**
- Current step 3 (Flexibility/Role) becomes step 4
- Current step 4 (Review) becomes step 5
- Remove the collapsible storyboard section from the review step

**`handleSubmit` changes:**
- After inserting `trip_request`, capture the returned `id`
- Include `source_storyboard_id: storyboardId` in `source_metadata` if storyboardId exists
- If `storyboardId` exists, update `storyboards` table: `SET trip_request_id = newTripRequestId WHERE id = storyboardId`

### No database migration needed
- `storyboards.trip_request_id` column already exists
- `trip_requests.source_metadata` (jsonb) already exists and can hold `source_storyboard_id`

### Marketplace display
- `TripStoryboardViewer` already queries by `trip_request_id` -- no changes needed there
- Once the link is written on submit, storyboard items will automatically appear on trip detail pages
