

# Make Trip Details Visible on the Create Storyboard Page

## Problem
The "Start a Trip Board" button goes to `/storyboards/new` (create mode), but Trip Details and "Submit to Marketplace" only appear after saving (edit mode). Users expect to fill in trip details and post to the marketplace from this page directly.

## Approach
Instead of hiding Trip Details behind `effectiveMode === "edit"`, show a simplified Trip Details section on the create page too. The fields will be stored in local state and saved together when the user clicks "Save storyboard". After save, the user is redirected to the edit page (already fixed) where they can submit to marketplace.

## Changes — `src/pages/TikTokLab/StoryboardEditorPage.tsx`

1. **Show Trip Details collapsible in create mode too** — Change the guard on the Trip Details section (line 489) from `effectiveMode === "edit"` to show in both modes. In create mode, fields save to local state only (no auto-save to DB since there's no ID yet).

2. **Pass trip fields into StoryboardBuilder's save flow** — When saving a new storyboard in create mode, include the trip detail fields (destination, dates, budget, etc.) in the initial insert so they're persisted on first save.

3. **Show a "Submit to Marketplace" hint in create mode** — Add a small note below Trip Details saying "Save your storyboard first, then submit to the marketplace" so the user knows the workflow.

## Changes — `src/components/storyboards/StoryboardBuilder.tsx`

4. **Accept optional trip fields prop** — Add an optional `tripFields` prop so the parent can pass in trip detail data to be included in the storyboard insert.

5. **Include trip fields in the storyboard insert** — When creating a new storyboard, spread the trip fields into the insert payload.

## Result
Users will see Trip Details immediately when they click "Start a Trip Board". After filling in details and saving, they land on the edit page with "Submit to Marketplace" ready to click.

