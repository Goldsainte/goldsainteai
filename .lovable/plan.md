

# Fix Storyboard Back Button 404

## Problem

The back button on the My Storyboards page (`/storyboards`) navigates to `/dashboard` for non-creator/non-agent users (e.g., travelers). The route `/dashboard` does not exist in `AppRoutes.tsx`, causing a 404 page.

## Root Cause

In `src/pages/TikTokLab/StoryboardsPage.tsx` line 93:
```typescript
const backTo = isCreatorOrAgent ? "/creator-dashboard" : "/dashboard";
```

`/dashboard` is not a valid route. Travelers should go to `/traveler`, and unknown account types should go to `/` (home).

## Fix

### File: `src/pages/TikTokLab/StoryboardsPage.tsx`

Replace the simple ternary on lines 92–93 with role-aware routing:

```typescript
const backLabel = (() => {
  switch (accountType) {
    case "creator":
    case "agent":
      return "Back to Creator Studio";
    case "traveler":
      return "Back to Dashboard";
    default:
      return "Back";
  }
})();

const backTo = (() => {
  switch (accountType) {
    case "creator":
      return "/creator-dashboard";
    case "agent":
      return "/agent-dashboard";
    case "traveler":
      return "/traveler";
    default:
      return "/";
  }
})();
```

This mirrors the same logic already used in `MyStoryboardsPage.tsx` (lines 76–87), ensuring consistency and valid navigation for all user types.

### Single file change, no other files affected.

