

## Fix: Creator Storyboard Creation from Profile Page

### Problem
Two issues causing the disconnect:
1. **No creation UI on profile page** — creators can't create storyboards directly from their own profile
2. **Visibility filter** — the profile page query filters `is_public = true`, but new storyboards default to `is_public: false`, so they never appear even after creation

### Changes

**1. `src/pages/creators/CreatorPublicProfilePage.tsx`**
- When `isOwnProfile` is true, add a **"+ New Storyboard"** button next to the "Explore Travel Ideas" section label
- Clicking opens a dialog to enter title, description, and destination — creates the storyboard as `is_public: true` with `role: "creator"`
- After creation, refresh the storyboards list (re-fetch or append to local state)
- Also show the storyboard section even when `remainingStoryboards` is empty (if own profile) — display an empty state with the create CTA
- Update the storyboards query: when viewing own profile, remove the `.eq("is_public", true)` filter so drafts are also visible to the creator (with a small "Draft" badge on private ones)

**2. `src/components/creator/CreatorStoryboardGrid.tsx`**
- Add optional `isOwnProfile` prop
- When `isOwnProfile`, show a subtle "Draft" badge on cards where `is_public` is false
- Add an optional `onCreateNew` prop — when provided, render a dashed-border "+" card at the end of the grid as an additional creation entry point

### Files
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — add create dialog, update query filter for own profile, show section when empty
- **Edit**: `src/components/creator/CreatorStoryboardGrid.tsx` — add Draft badge and "+" card for own profile

