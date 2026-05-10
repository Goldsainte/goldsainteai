
-- 1. Add columns to packaged_trips
ALTER TABLE public.packaged_trips
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS minimum_age integer,
  ADD COLUMN IF NOT EXISTS accommodation_type text,
  ADD COLUMN IF NOT EXISTS meals_included text[] DEFAULT '{}'::text[];

-- 2. Update status check constraint to allow pending_review
ALTER TABLE public.packaged_trips DROP CONSTRAINT IF EXISTS packaged_trips_status_check;
ALTER TABLE public.packaged_trips
  ADD CONSTRAINT packaged_trips_status_check
  CHECK (status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'published'::text, 'archived'::text]));

-- 3. Fix trip_itinerary_days RLS so agents (not just creators) can manage their own trip days
DROP POLICY IF EXISTS "Trip owners can manage itinerary days" ON public.trip_itinerary_days;
CREATE POLICY "Trip owners can manage itinerary days"
ON public.trip_itinerary_days
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.packaged_trips pt
    WHERE pt.id = trip_itinerary_days.trip_id
      AND (pt.creator_id = auth.uid() OR pt.agent_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.packaged_trips pt
    WHERE pt.id = trip_itinerary_days.trip_id
      AND (pt.creator_id = auth.uid() OR pt.agent_id = auth.uid())
  )
);
