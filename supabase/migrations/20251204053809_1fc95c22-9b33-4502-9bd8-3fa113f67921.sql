-- Add languages column to profiles table for multi-language support in creator onboarding
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages TEXT[];