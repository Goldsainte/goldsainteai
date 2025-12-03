-- Create SECURITY DEFINER function to check trip membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id AND user_id = p_user_id
  )
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view members of trips they belong to" ON trip_members;

-- Create new policy using the SECURITY DEFINER function (no recursion)
CREATE POLICY "Users can view members of trips they belong to" 
ON trip_members FOR SELECT
USING (
  -- User is the trip creator
  EXISTS (
    SELECT 1 FROM group_trips
    WHERE group_trips.id = trip_members.trip_id
    AND group_trips.creator_id = auth.uid()
  )
  OR
  -- User is a member of the trip (using safe function)
  public.is_trip_member(trip_id, auth.uid())
);