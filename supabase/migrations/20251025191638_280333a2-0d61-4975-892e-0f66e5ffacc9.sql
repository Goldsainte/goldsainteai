-- Create search_cache table for persistent 24-hour caching
CREATE TABLE IF NOT EXISTS public.search_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for efficient expiry checking
CREATE INDEX IF NOT EXISTS idx_search_cache_expiry ON public.search_cache(expires_at);

-- Add indexes for faster booking and search history queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- Enable RLS on search_cache (public read/write for now since searches can be anonymous)
ALTER TABLE public.search_cache ENABLE ROW LEVEL SECURITY;

-- Allow all users to read and write cache (searches are public)
CREATE POLICY "Allow public read access to search cache"
  ON public.search_cache FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public write access to search cache"
  ON public.search_cache FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to search cache"
  ON public.search_cache FOR UPDATE
  TO public
  USING (true);

-- Cleanup function to remove expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.search_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;