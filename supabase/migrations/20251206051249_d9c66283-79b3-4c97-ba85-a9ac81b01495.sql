-- Add policy to allow anyone to view open trip requests in the marketplace
CREATE POLICY "Anyone can view open trip requests"
ON public.trip_requests
FOR SELECT
USING (status = 'open');