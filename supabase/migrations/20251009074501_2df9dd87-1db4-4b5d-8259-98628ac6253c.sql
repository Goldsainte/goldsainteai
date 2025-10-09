-- Set default status and backfill existing NULLs for travel_posts
ALTER TABLE public.travel_posts
ALTER COLUMN status SET DEFAULT 'active';

UPDATE public.travel_posts
SET status = 'active'
WHERE status IS NULL;