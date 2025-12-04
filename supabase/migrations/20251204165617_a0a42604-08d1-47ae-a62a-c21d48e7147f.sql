-- Drop existing policies to recreate them properly (if they exist)
DROP POLICY IF EXISTS "Anyone can view published trips" ON packaged_trips;
DROP POLICY IF EXISTS "Agents can view their own trips" ON packaged_trips;
DROP POLICY IF EXISTS "Creators can view their own trips" ON packaged_trips;
DROP POLICY IF EXISTS "Agents can insert their own trips" ON packaged_trips;
DROP POLICY IF EXISTS "Creators can insert their own trips" ON packaged_trips;
DROP POLICY IF EXISTS "Agents can update their own trips" ON packaged_trips;
DROP POLICY IF EXISTS "Creators can update their own trips" ON packaged_trips;
DROP POLICY IF EXISTS "Agents can delete their own trips" ON packaged_trips;
DROP POLICY IF EXISTS "Creators can delete their own trips" ON packaged_trips;

-- Policy: Anyone can view published trips
CREATE POLICY "Anyone can view published trips"
ON packaged_trips
FOR SELECT
USING (status = 'published');

-- Policy: Agents can view their own trips (any status)
CREATE POLICY "Agents can view their own trips"
ON packaged_trips
FOR SELECT
USING (auth.uid() = agent_id);

-- Policy: Creators can view their own trips (any status)
CREATE POLICY "Creators can view their own trips"
ON packaged_trips
FOR SELECT
USING (auth.uid() = creator_id);

-- Policy: Agents can insert their own trips
CREATE POLICY "Agents can insert their own trips"
ON packaged_trips
FOR INSERT
WITH CHECK (auth.uid() = agent_id);

-- Policy: Creators can insert their own trips
CREATE POLICY "Creators can insert their own trips"
ON packaged_trips
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Policy: Agents can update their own trips
CREATE POLICY "Agents can update their own trips"
ON packaged_trips
FOR UPDATE
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

-- Policy: Creators can update their own trips
CREATE POLICY "Creators can update their own trips"
ON packaged_trips
FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Policy: Agents can delete their own trips
CREATE POLICY "Agents can delete their own trips"
ON packaged_trips
FOR DELETE
USING (auth.uid() = agent_id);

-- Policy: Creators can delete their own trips
CREATE POLICY "Creators can delete their own trips"
ON packaged_trips
FOR DELETE
USING (auth.uid() = creator_id);