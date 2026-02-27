

# Investigation: Storyboard Data Separation

## Finding
After thorough investigation, the storyboards **are correctly separated by user** at every level:

1. **Database (RLS)**: The SELECT policy on `storyboards` is `(auth.uid() = owner_id) OR (is_public = true)`. All storyboards have `is_public = false`, so users can only see their own.
2. **Application queries**: Every query (Traveler Hub, Storyboards page, dashboard stats) filters by `.eq("owner_id", authUser.id)`.
3. **Actual data**: powell's "Summer" storyboard has `owner_id = 1cf40a00...` (powell's ID). Radu's ID is `12412527...` and owns 0 storyboards.

## Possible Explanations for What You're Seeing
- **Same browser session**: If you logged out of one account and into another without a full page refresh, React Query cache may still hold the previous user's storyboards. A hard refresh (Cmd+Shift+R) would fix this.
- **Shared device**: If both accounts were used in the same browser, stale cached data may appear briefly before refetching.

## Recommended Fix
Even though the data is correct, we should add a **React Query cache clear on user change** to prevent stale data from a previous session appearing momentarily.

### Changes

#### 1. Create `useUserChange` hook to clear cache on user switch
- New file: `src/hooks/useUserChange.ts`
- Watches `user.id` changes and calls `queryClient.clear()` when user switches
- Also clears relevant `localStorage`/`sessionStorage` items

#### 2. Wire it into the app
- Call `useUserChange()` in `App.tsx` or the auth context provider so it runs globally

#### 3. Add ownership guard to StoryboardEditorPage
- In `StoryboardEditorPage.tsx`, after loading the storyboard, verify `storyboard.owner_id === authUser.id` before displaying it (for non-public storyboards)
- Show "not authorized" or redirect if mismatched

