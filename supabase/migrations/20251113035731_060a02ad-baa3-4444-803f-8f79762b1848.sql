-- Minimal performance indexes for moments feed
CREATE INDEX IF NOT EXISTS idx_moments_user_created ON public.moments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_created_id ON public.moments(created_at DESC, id DESC);