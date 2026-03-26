

## Fix: Cannot Delete Storyboard Items (RLS Infinite Recursion)

### Root Cause

Same infinite recursion issue we fixed for storyboard creation. The DELETE policy on `storyboard_items` does `EXISTS (SELECT 1 FROM storyboards WHERE owner_id = auth.uid())`, which triggers the collaborator SELECT policies on `storyboards`, creating a circular loop.

### Fix

Create a `SECURITY DEFINER` helper function `is_storyboard_owner(storyboard_uuid, user_uuid)` that checks ownership without triggering RLS, then update ALL `storyboard_items` policies (SELECT, INSERT, UPDATE, DELETE) to use it instead of subquerying `storyboards` directly.

**Database migration:**

1. Create function `public.is_storyboard_owner(storyboard_uuid UUID, user_uuid UUID)` — `SECURITY DEFINER`, does a direct lookup on `storyboards` bypassing RLS.

2. Drop and re-create these policies on `storyboard_items` using the new function:
   - "Users can view items in accessible storyboards" (SELECT)
   - "Users can create items in their own storyboards" (INSERT)
   - "Users can update items in their own storyboards" (UPDATE)
   - "Users can delete items in their own storyboards" (DELETE)

3. Also update the `storyboards` table's own DELETE/UPDATE policies if they have similar subquery patterns causing recursion.

No frontend changes needed — purely a database policy fix.

