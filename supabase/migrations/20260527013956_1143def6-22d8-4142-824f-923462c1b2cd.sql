DROP POLICY IF EXISTS "Anyone can view published trips" ON public.packaged_trips;

CREATE POLICY "Public can view published trips"
  ON public.packaged_trips
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

GRANT SELECT ON public.packaged_trips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packaged_trips TO authenticated;
GRANT ALL ON public.packaged_trips TO service_role;