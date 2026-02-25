ALTER TABLE public.storyboards
  ADD COLUMN IF NOT EXISTS trip_length_days integer,
  ADD COLUMN IF NOT EXISTS budget_per_person boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS must_haves text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dealbreakers text[] DEFAULT '{}';