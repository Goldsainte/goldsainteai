-- Add Spotify music fields to travel_posts table
ALTER TABLE travel_posts
ADD COLUMN IF NOT EXISTS spotify_track_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_track_name TEXT,
ADD COLUMN IF NOT EXISTS spotify_track_artist TEXT,
ADD COLUMN IF NOT EXISTS spotify_track_preview_url TEXT,
ADD COLUMN IF NOT EXISTS spotify_track_album_art TEXT;

-- Add index for Spotify track lookups
CREATE INDEX IF NOT EXISTS idx_travel_posts_spotify_track 
ON travel_posts(spotify_track_id) 
WHERE spotify_track_id IS NOT NULL;