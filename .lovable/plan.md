

## Plan: Wire Stats to Real Data + Pre-assign Trip Requests from Profiles

### 1. Wire Creator Stats to Real Platform Data

**Problem**: `creator_followers` and `creator_avg_views` on the `profiles` table are static, manually-entered fields. They should reflect actual platform activity.

**Solution**: Create a database function `refresh_creator_stats(p_user_id uuid)` that:
- Counts rows in `user_follows` where `following_id = p_user_id` → updates `creator_followers`
- Calculates average `view_count` from `travel_posts` where `user_id = p_user_id` → updates `creator_avg_views`

Then call this function from the two pages that display these stats:

**Database migration**:
- Create `refresh_creator_stats` function that updates `profiles.creator_followers` and `profiles.creator_avg_views` from live data
- Add a trigger on `user_follows` (INSERT/DELETE) that auto-refreshes `creator_followers` for the affected user
- Add a trigger on `travel_posts` (INSERT/DELETE/UPDATE of `view_count`) that auto-refreshes `creator_avg_views`

**No frontend changes needed** — `CreatorsPage` and `CreatorPublicProfilePage` already read these columns. The triggers keep them updated automatically.

### 2. Pre-assign Trip Requests from Creator/Agent Profiles

**Problem**: Clicking "Request a Trip" on a creator profile navigates to `/post-trip?fromCreator={id}` (or `?agentId={id}` for agents), but `PostTripPage` never reads these params. The trip goes to the general marketplace.

**Solution**:

**Database migration**:
- Add `preferred_creator_id UUID` and `preferred_agent_id UUID` columns to `trip_requests` (nullable, no FK to auth.users)

**`src/pages/trips/PostTripPage.tsx`**:
- Read `fromCreator` and `agentId` from `searchParams`
- Store them in state; persist in sessionStorage for auth redirects
- Include them in the `trip_requests` insert as `preferred_creator_id` / `preferred_agent_id`
- Show a banner on step 0: "This trip will be sent directly to [Creator/Agent Name]"
- Set `wants_role` automatically based on which param is present

**`src/pages/creators/CreatorPublicProfilePage.tsx`** and **`src/pages/agents/AgentPublicProfilePage.tsx`**: No changes needed — they already pass the correct query params.

**Notification**: After insert, if `preferred_creator_id` or `preferred_agent_id` is set, insert a notification row so the creator/agent knows they received a direct request.

### File Changes Summary

| File | Change |
|------|--------|
| Migration SQL | `refresh_creator_stats` function + triggers; add `preferred_creator_id`/`preferred_agent_id` columns |
| `src/pages/trips/PostTripPage.tsx` | Read `fromCreator`/`agentId` params, store in state, include in insert, show banner |

