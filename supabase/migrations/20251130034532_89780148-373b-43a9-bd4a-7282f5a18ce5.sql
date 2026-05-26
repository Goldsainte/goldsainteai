-- Add discoverability column for "Shopify for Travel Agents" model
ALTER TABLE user_travel_preferences 
ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN user_travel_preferences.is_discoverable IS 
'When true, agents and creators can see this traveler''s preferences to curate matching trips';

-- CREATE INDEX IF NOT EXISTS for efficient querying of discoverable travelers
CREATE INDEX IF NOT EXISTS idx_user_travel_preferences_discoverable 
ON user_travel_preferences(is_discoverable) 
WHERE is_discoverable = true;

-- RLS Policy: Allow agents/creators to READ discoverable traveler preferences
CREATE POLICY "Agents and creators can view discoverable preferences"
ON user_travel_preferences
FOR SELECT
TO authenticated
USING (
  is_discoverable = true 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.account_type IN ('agent', 'creator')
  )
);
