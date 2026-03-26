
Fix storyboard management in two places: backend permissions and the creator-facing UI.

1. Break the remaining RLS recursion for storyboard deletion/editing
- Review the current `storyboard_collaborators` policies and replace the recursive owner check:
  - current problematic policy: `Owner can manage collaborators` queries `storyboards` directly
- Rebuild that policy to use the existing `is_storyboard_owner(storyboard_id, auth.uid())` helper instead of a subquery.
- Verify `storyboards`, `storyboard_items`, and `storyboard_collaborators` policies no longer reference each other in a loop.
- This is the likely reason deleting full boards still fails even though item deletion was fixed.

2. Make edit/delete obvious from the creator profile
- Add creator-only management actions to the storyboard cards shown on the creator profile flow so you can manage boards like “Miami Adventure” and “Northern Lights” directly from that page.
- Reuse the existing dropdown pattern from `MyStoryboardsPage.tsx`:
  - Edit storyboard
  - Delete storyboard
  - Sell This Experience
- Only show these controls when `isOwnProfile` is true.

3. Add full-board delete from the storyboard detail/editor page
- In `StoryboardDetailPage.tsx`, add a creator-owner “Delete Storyboard” action in the header area.
- Confirm before deleting.
- On success, redirect back to the storyboard list or creator profile and remove the deleted board from UI state.

4. Tighten the service/UI flow
- Keep `deleteStoryboard()` in `storyboardsService.ts` as the shared delete path.
- Improve error messaging so permission/RLS failures surface clearly instead of a generic “Failed to delete storyboard”.
- Refresh the relevant list after delete so removed boards disappear immediately.

5. Verify the exact boards you named
- Test deleting “Miami Adventure” and “Northern Lights” from the creator-owned storyboard surface.
- Test editing a storyboard title/description/public toggle from the detail page.
- Confirm public/shareable storyboards still work after the policy cleanup.

Technical details
- Files likely involved:
  - `supabase/migrations/...` for collaborator policy fix
  - `src/pages/creators/CreatorPublicProfilePage.tsx`
  - `src/components/creator/CreatorStoryboardGrid.tsx` or the creator storyboard surface actually rendering those cards
  - `src/pages/storyboards/StoryboardDetailPage.tsx`
  - `src/services/storyboardsService.ts`
- Root issue found:
  - `storyboard_collaborators` still has `Owner can manage collaborators` using:
    `EXISTS (SELECT 1 FROM storyboards WHERE storyboards.id = storyboard_collaborators.storyboard_id AND storyboards.owner_id = auth.uid())`
  - That can recurse against storyboard policies during full-board delete/update operations.
