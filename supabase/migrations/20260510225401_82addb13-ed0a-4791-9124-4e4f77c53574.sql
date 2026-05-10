DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'packaged_trips_agent_id_fkey'
  ) THEN
    ALTER TABLE public.packaged_trips
      ADD CONSTRAINT packaged_trips_agent_id_fkey
      FOREIGN KEY (agent_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;