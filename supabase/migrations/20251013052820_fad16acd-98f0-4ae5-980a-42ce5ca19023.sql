-- Add audio start time for Spotify tracks in moments
ALTER TABLE public.moments
ADD COLUMN IF NOT EXISTS spotify_audio_start_time integer DEFAULT 0;