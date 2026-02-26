

# Add Marketplace Readiness Checklist

## What
Add a visual progress checklist inside the Trip Details collapsible header area showing what's needed before submitting. Requirements match the existing validation: destination, dates/trip length, and at least 3 photos.

## Changes — `src/pages/TikTokLab/StoryboardEditorPage.tsx`

1. **Create a readiness checklist component inline** — Below the Trip Details collapsible trigger (around line 490), add a small checklist with three items:
   - Destination filled → `tripFields.destination.trim()`
   - Dates or trip length added → `tripFields.start_date || tripFields.end_date || tripFields.trip_length_days`
   - At least 3 photos → `itemCount >= 3`

   Each item shows a green check or gray circle, with a progress bar showing X/3 complete.

2. **Update the collapsible trigger subtitle** — Replace the static "fill in to submit to marketplace" text with a dynamic "X/3 ready" indicator so users see progress at a glance without opening the section.

3. **Show checklist above the Submit button** — In edit mode, display the same checklist items near the "Submit to Marketplace" button so users know exactly what's missing before clicking.

## Visual Design
- Uses existing `CheckCircle2` and `Circle` icons from lucide-react
- Green (#0c4d47) for completed items, muted gray for incomplete
- Small `Progress` bar from existing UI components showing fraction complete
- Consistent with the warm luxury design language already in use

