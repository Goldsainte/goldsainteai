-- Add Spotify track columns to moments table
ALTER TABLE public.moments
ADD COLUMN IF NOT EXISTS spotify_track_id text,
ADD COLUMN IF NOT EXISTS spotify_track_name text,
ADD COLUMN IF NOT EXISTS spotify_track_artist text,
ADD COLUMN IF NOT EXISTS spotify_track_preview_url text,
ADD COLUMN IF NOT EXISTS spotify_track_album_art text;