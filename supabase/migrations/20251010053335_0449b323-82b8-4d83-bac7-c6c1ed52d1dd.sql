-- Add crossposting columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tiktok_username TEXT,
ADD COLUMN IF NOT EXISTS instagram_username TEXT,
ADD COLUMN IF NOT EXISTS auto_share_tiktok BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_share_instagram BOOLEAN DEFAULT FALSE;