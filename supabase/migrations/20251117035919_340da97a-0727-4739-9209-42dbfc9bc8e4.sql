-- Add missing columns to trip_requests for comprehensive trip matching
ALTER TABLE public.trip_requests
  ADD COLUMN IF NOT EXISTS accommodation_style text,
  ADD COLUMN IF NOT EXISTS pace text CHECK (pace IN ('slow', 'balanced', 'packed')),
  ADD COLUMN IF NOT EXISTS interests text[],
  ADD COLUMN IF NOT EXISTS flexibility text,
  ADD COLUMN IF NOT EXISTS special_notes text;