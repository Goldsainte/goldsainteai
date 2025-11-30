-- Add foreign key from bookings.trip_id to trips.id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_trip_id_fkey' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_trip_id_fkey
    FOREIGN KEY (trip_id) REFERENCES public.trips(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Add RLS policy for trips table so travelers can view their trips
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trips' 
    AND policyname = 'Users can view trips they are involved with'
  ) THEN
    CREATE POLICY "Users can view trips they are involved with"
    ON public.trips FOR SELECT
    USING (
      auth.uid() = traveler_id
      OR auth.role() = 'service_role'
    );
  END IF;
END $$;

-- Ensure RLS is enabled on trips table
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;