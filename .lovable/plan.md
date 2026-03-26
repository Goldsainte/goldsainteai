

## Fix Save-to-Storyboard + Differentiate Category vs Board Filters

### Problem 1: Saved image doesn't appear in storyboard
The `SaveToStoryboardModal` creates the board and saves the item successfully, but the creator profile page never refetches its data. The `onSaveComplete` callback only increments the milestone counter — it doesn't invalidate the queries that populate the feed. The storyboards list and pin items on the creator page come from a parent query that is never told to refresh.

### Problem 2: Board filter pills look identical to category pills
Both the travel category chips (Row 1) and the storyboard board filter pills use the same visual style — small rounded pills with near-identical colors. Users can't tell which row controls discovery categories vs which filters by their own boards.

---

### Fix 1: Invalidate queries after save

**File: `src/components/discovery/SaveToStoryboardModal.tsx`**
- Import `useQueryClient` from `@tanstack/react-query`
- After successful save in `handleSave`, call `queryClient.invalidateQueries({ queryKey: ["storyboards"] })` and `queryClient.invalidateQueries({ queryKey: ["storyboard-items"] })`
- This ensures both the board list and pin items refresh on the creator profile

**File: `src/components/creator/CreatorPinterestFeed.tsx`**
- Pass a more comprehensive `onSaveComplete` that also triggers a parent data refetch if available

### Fix 2: Visually differentiate board filter pills from category pills

**File: `src/components/creator/CreatorPinterestFeed.tsx`**
- Add a section label above board pills: "Your Boards" (or "Boards" for public profiles) with a small `Layers` icon
- Change board pill styling to use a distinct look: outlined with a left-side colored dot/indicator, slightly different shape or background tone
- Active board pill uses a different accent color (e.g., dark teal `#0a2225` instead of gold `#C7A962`) to distinguish from the active category pill
- Add a subtle divider or spacing increase between the refinement chips section and the board filter section

### Files

| Action | File | Purpose |
|--------|------|---------|
| Edit | `src/components/discovery/SaveToStoryboardModal.tsx` | Invalidate storyboard queries after save |
| Edit | `src/components/creator/CreatorPinterestFeed.tsx` | Add board section label, restyle board pills for clear differentiation |

