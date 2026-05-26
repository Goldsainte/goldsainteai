
CREATE TABLE IF NOT EXISTS public.booking_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trip_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own booking interests"
ON public.booking_interests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own booking interests"
ON public.booking_interests FOR SELECT TO authenticated
USING (auth.uid() = user_id);
