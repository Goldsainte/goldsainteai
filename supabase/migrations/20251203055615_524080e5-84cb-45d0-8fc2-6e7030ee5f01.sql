
-- Step 1: Drop all dependent policies first
DROP POLICY IF EXISTS "Users can view members of trips they belong to" ON trip_members;
DROP POLICY IF EXISTS "Users can view trips they are members of" ON group_trips;
DROP POLICY IF EXISTS "Members can view trip messages" ON trip_messages;
DROP POLICY IF EXISTS "Members can send trip messages" ON trip_messages;

-- Step 2: Drop the old function now that dependencies are removed
DROP FUNCTION IF EXISTS public.is_trip_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_trip_member(UUID, UUID, TEXT);

-- Step 3: Create the new function with optional status parameter
CREATE FUNCTION public.is_trip_member(p_trip_id UUID, p_user_id UUID, p_status TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id 
      AND user_id = p_user_id
      AND (p_status IS NULL OR status = p_status)
  )
$$;

-- Step 4: Recreate all policies using the new function

-- trip_members: simple policy, no self-referencing subquery
CREATE POLICY "Users can view members of trips they belong to" ON trip_members
FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_trips 
    WHERE group_trips.id = trip_members.trip_id 
    AND group_trips.creator_id = auth.uid()
  )
  OR public.is_trip_member(trip_id, auth.uid(), 'accepted')
);

-- group_trips: use function instead of direct trip_members query
CREATE POLICY "Users can view trips they are members of" ON group_trips
FOR SELECT USING (
  auth.uid() = creator_id 
  OR public.is_trip_member(id, auth.uid())
);

-- trip_messages: use function for membership check
CREATE POLICY "Members can view trip messages" ON trip_messages
FOR SELECT USING (
  public.is_trip_member(trip_id, auth.uid(), 'accepted')
);

CREATE POLICY "Members can send trip messages" ON trip_messages
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  AND public.is_trip_member(trip_id, auth.uid(), 'accepted')
);
