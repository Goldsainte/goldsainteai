-- Add RLS policy to allow anyone to view open trip requests
-- This enables marketplace discovery while preserving privacy for non-open requests
CREATE POLICY "Anyone can view open trip requests"
ON public.trip_requests
FOR SELECT
USING (status = 'open');