-- Add welcome_shown flag to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_shown boolean NOT NULL DEFAULT false;