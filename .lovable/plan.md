

# Fix "Start a Trip Board" Post-Save Navigation

## Problem
When a user creates a new storyboard via "Start a Trip Board", the `handleStoryboardSaved` callback navigates to `/storyboards` (the listing page). This means the user never sees the Trip Details form or the "Submit to Marketplace" button — those only render in edit mode (when the storyboard ID is in the URL).

## Fix — `src/pages/TikTokLab/StoryboardEditorPage.tsx`

Change `handleStoryboardSaved` to navigate to the newly created storyboard's edit page instead of the listing:

```tsx
// Before
function handleStoryboardSaved(id: string) {
  navigate("/storyboards");
}

// After
function handleStoryboardSaved(id: string) {
  navigate(`/storyboards/${id}`);
}
```

This opens the storyboard in edit mode where Trip Details, Submit to Marketplace, and Use Trip Wizard are all visible and functional.

Single line change, one file.

