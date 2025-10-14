-- Add volume control columns to travel_posts
ALTER TABLE travel_posts 
ADD COLUMN IF NOT EXISTS native_video_volume INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS music_volume INTEGER DEFAULT 80;

-- Add helpful comments
COMMENT ON COLUMN travel_posts.native_video_volume IS 'Volume level (0-100) for the native video audio';
COMMENT ON COLUMN travel_posts.music_volume IS 'Volume level (0-100) for the background music track';

-- Add validation trigger for volume ranges
CREATE OR REPLACE FUNCTION validate_volume_range()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.native_video_volume IS NOT NULL AND (NEW.native_video_volume < 0 OR NEW.native_video_volume > 100) THEN
    RAISE EXCEPTION 'native_video_volume must be between 0 and 100';
  END IF;
  
  IF NEW.music_volume IS NOT NULL AND (NEW.music_volume < 0 OR NEW.music_volume > 100) THEN
    RAISE EXCEPTION 'music_volume must be between 0 and 100';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS validate_post_volumes ON travel_posts;
CREATE TRIGGER validate_post_volumes
  BEFORE INSERT OR UPDATE ON travel_posts
  FOR EACH ROW
  EXECUTE FUNCTION validate_volume_range();