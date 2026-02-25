

# Fix: "Create New Storyboard" Redirects Away Instead of Creating

## Problem
When clicking "Create New Storyboard" on `/storyboards`, the user is redirected away instead of seeing the storyboard editor. This happens because:

1. The `/storyboards` listing page does NOT require onboarding — it just checks auth directly
2. But `/storyboards/new` (StoryboardEditorPage) uses the `useRequireOnboarding` hook, which redirects users to onboarding if their profile's `onboarding_completed` flag isn't set
3. This creates a broken experience: user can browse storyboards but can't create one

The route is already wrapped in `RequireAuth`, so authentication is guaranteed. The onboarding gate is overly aggressive for storyboard creation.

## Fix

### `src/pages/TikTokLab/StoryboardEditorPage.tsx`

Remove the `useRequireOnboarding` hook and its loading/redirect gate. The page is already protected by `RequireAuth` in the route definition. Simply render the editor directly.

- Remove the `useRequireOnboarding` import and call
- Remove the `if (checking || !allowed)` early return block
- The page will load immediately for any authenticated user

This is a small, targeted change — roughly 10 lines removed. No other files need modification.

## Files to Edit
- `src/pages/TikTokLab/StoryboardEditorPage.tsx` — Remove `useRequireOnboarding` guard

