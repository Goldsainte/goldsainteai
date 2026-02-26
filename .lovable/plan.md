

# Fix Broken "Create New Storyboard" Link

## Problem
In `SaveToStoryboardButton.tsx`, the "Create New Storyboard" button navigates to `/trip/create?returnTo=...` — a route that doesn't exist. This results in the "Trip not found" page shown in the screenshot.

## Fix — `src/components/storyboards/SaveToStoryboardButton.tsx`

Change the `handleCreateNew` function to navigate to `/storyboards/new` instead of `/trip/create`. This route exists and loads the storyboard editor page.

```tsx
// Before
navigate("/trip/create?returnTo=" + encodeURIComponent(window.location.pathname));

// After
navigate("/storyboards/new");
```

Single line change in one file.

