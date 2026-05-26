-- Update storyboards table to support unified system
ALTER TABLE storyboards 
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS related_trip_request_id uuid REFERENCES trip_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_trip_proposal_id uuid REFERENCES trip_proposals(id) ON DELETE SET NULL;

-- Update storyboard_items to support new unified item types
ALTER TABLE storyboard_items
  ADD COLUMN IF NOT EXISTS kind text CHECK (kind IN ('photo', 'video', 'experience', 'note')),
  ADD COLUMN IF NOT EXISTS source text CHECK (source IN ('unsplash', 'viator', 'youtube', 'tiktok', 'instagram', 'manual')),
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sort_index integer DEFAULT 0;

-- CREATE INDEX IF NOT EXISTS for efficient sort
CREATE INDEX IF NOT EXISTS storyboard_items_sort_idx ON storyboard_items(storyboard_id, sort_index);

-- Update RLS policies for public/shared storyboards visibility
DROP POLICY IF EXISTS "public can view shared storyboards" ON storyboards;
CREATE POLICY "public can view shared storyboards"
ON storyboards
FOR SELECT
USING (
  visibility IN ('shared', 'public')
);

-- Update items policy to follow parent visibility
DROP POLICY IF EXISTS "items follow parent storyboard" ON storyboard_items;
CREATE POLICY "items follow parent storyboard"
ON storyboard_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM storyboards s
    WHERE s.id = storyboard_id
    AND (
      s.owner_id = auth.uid()
      OR s.visibility IN ('shared', 'public')
    )
  )
)
WITH CHECK (auth.uid() = (
  SELECT owner_id FROM storyboards s WHERE s.id = storyboard_id
));
