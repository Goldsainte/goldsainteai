

## Fix: Infinite Recursion in Storyboards RLS Policies

### Root Cause

The `storyboards` table has a SELECT policy ("Collaborators can view storyboards") that queries `storyboard_collaborators`. But `storyboard_collaborators` has RLS policies that query back into `storyboards` (checking `owner_id = auth.uid()`). Postgres detects this circular dependency and raises the infinite recursion error.

This blocks **all** operations on the `storyboards` table, including INSERT.

### Fix

Create a `SECURITY DEFINER` helper function that checks collaborator membership without triggering RLS, then update the recursive policy to use it.

**Database migration:**

1. Create function `is_storyboard_collaborator(storyboard_uuid, user_uuid)` — `SECURITY DEFINER` with `SET search_path = 'public'` — does a direct lookup on `storyboard_collaborators` bypassing RLS.

2. Drop the problematic policy `"Collaborators can view storyboards"` on `storyboards`.

3. Re-create it using the new function instead of a subquery:
   ```sql
   CREATE POLICY "Collaborators can view storyboards"
     ON public.storyboards FOR SELECT
     TO authenticated
     USING (public.is_storyboard_collaborator(id, auth.uid()));
   ```

No frontend code changes needed — this is purely a database policy fix.

