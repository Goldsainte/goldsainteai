
ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS trips_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clients_served INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certifications TEXT[],
  ADD COLUMN IF NOT EXISTS travel_styles TEXT[],
  ADD COLUMN IF NOT EXISTS best_for TEXT[],
  ADD COLUMN IF NOT EXISTS not_ideal_for TEXT[],
  ADD COLUMN IF NOT EXISTS response_time_hours INTEGER,
  ADD COLUMN IF NOT EXISTS specialties TEXT[];
