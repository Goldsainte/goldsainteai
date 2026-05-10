ALTER TABLE public.packaged_trips
ADD COLUMN IF NOT EXISTS balance_due_days INTEGER;