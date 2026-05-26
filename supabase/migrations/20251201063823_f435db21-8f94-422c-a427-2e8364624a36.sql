-- Create cache table for curated itineraries
CREATE TABLE IF NOT EXISTS public.curated_itineraries_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  itineraries JSONB NOT NULL,
  preferences_hash TEXT NOT NULL,
  behavioral_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours') NOT NULL,
  UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_curated_cache_user_expires ON public.curated_itineraries_cache(user_id, expires_at);

-- Enable RLS
ALTER TABLE public.curated_itineraries_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own cache
CREATE POLICY "Users can view own itinerary cache"
  ON public.curated_itineraries_cache
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all cache entries
CREATE POLICY "Service role can manage cache"
  ON public.curated_itineraries_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_itinerary_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.curated_itineraries_cache
  WHERE expires_at < NOW();
END;
$$;
