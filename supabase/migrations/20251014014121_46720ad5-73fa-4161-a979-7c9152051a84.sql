-- Rename Spotify columns to be service-agnostic in travel_posts
ALTER TABLE public.travel_posts 
  RENAME COLUMN spotify_track_id TO music_track_id;
ALTER TABLE public.travel_posts 
  RENAME COLUMN spotify_track_name TO music_track_name;
ALTER TABLE public.travel_posts 
  RENAME COLUMN spotify_track_artist TO music_track_artist;
ALTER TABLE public.travel_posts 
  RENAME COLUMN spotify_track_preview_url TO music_preview_url;
ALTER TABLE public.travel_posts 
  RENAME COLUMN spotify_track_album_art TO music_album_art;

-- Add music_service column to track which service the track is from
ALTER TABLE public.travel_posts 
  ADD COLUMN music_service text DEFAULT NULL;

-- Rename Spotify columns in moments table
ALTER TABLE public.moments 
  RENAME COLUMN spotify_track_id TO music_track_id;
ALTER TABLE public.moments 
  RENAME COLUMN spotify_track_name TO music_track_name;
ALTER TABLE public.moments 
  RENAME COLUMN spotify_track_artist TO music_track_artist;
ALTER TABLE public.moments 
  RENAME COLUMN spotify_track_preview_url TO music_preview_url;
ALTER TABLE public.moments 
  RENAME COLUMN spotify_track_album_art TO music_album_art;

-- Add music_service column to moments
ALTER TABLE public.moments 
  ADD COLUMN music_service text DEFAULT NULL;