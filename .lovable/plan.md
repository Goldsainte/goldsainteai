

## Fix Board Visibility + Evolve Storyboard Schema for Core Responsibilities

### Bug: New board doesn't show in "Your Boards"

**Root cause**: `CreatorPublicProfilePage` fetches storyboards in a raw `useEffect` keyed on `[id, user, reviewRefreshKey]`. The `SaveToStoryboardModal` invalidates react-query caches (`["storyboards"]`), but this page doesn't use react-query — so it never re-fetches. The board exists in the database but the UI is stale.

**Fix**: After a save completes in `SaveToStoryboardModal`, bump a shared signal that the profile page listens to. Simplest approach: use a custom event (`window.dispatchEvent(new Event("storyboard-updated"))`) and listen for it in the profile page's useEffect to trigger a re-fetch by incrementing `reviewRefreshKey`.

### Schema Evolution: Storyboard as Structured Trip Content

The current `storyboards` + `storyboard_items` tables are flat — items have a position but no day/section grouping, no bookable product links, no collaboration model. To fulfill the stated responsibilities:

**Migration adds:**

1. **`storyboard_sections`** table — groups items by day/theme:
   - `id`, `storyboard_id` (FK), `title` (e.g. "Day 1 — Arrival"), `section_type` (day | theme | custom), `position`, `description`

2. **`section_id`** column on `storyboard_items` — optional FK to `storyboard_sections`, so items can belong to a day/section or remain ungrouped

3. **`bookable_product_id`** + **`bookable_product_type`** on `storyboard_items` — attach a bookable entity (hotel, experience, transfer) at the item level

4. **`storyboard_collaborators`** table — multi-user editing:
   - `storyboard_id`, `user_id`, `role` (editor | viewer), `invited_at`, `accepted_at`
   - RLS: collaborators can view/edit based on their role

5. **`status`** column on `storyboards` — `draft | published | archived` to support publishing lifecycle

6. **`forked_count`** column on `storyboards` — tracks how many times a board has been duplicated/remixed

**RLS updates:**
- Collaborators with `editor` role get update access to storyboard items
- Collaborators with `viewer` role get select access
- Existing owner-based policies remain unchanged

### Files

| Action | File | Purpose |
|--------|------|---------|
| Edit | `src/components/discovery/SaveToStoryboardModal.tsx` | Dispatch `storyboard-updated` event after save |
| Edit | `src/pages/creators/CreatorPublicProfilePage.tsx` | Listen for `storyboard-updated` event to re-fetch |
| Migration | Add `storyboard_sections` table, `section_id` + bookable columns on items, `storyboard_collaborators` table, `status` + `forked_count` on storyboards | Structured trip content schema |
| Edit | `src/services/storyboardsService.ts` | Add section CRUD, collaborator management, fork/duplicate functions |

