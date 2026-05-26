-- Create brand_partnerships table
CREATE TABLE IF NOT EXISTS public.brand_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.travel_posts(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  campaign_details TEXT NOT NULL,
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  deliverables TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.brand_partnerships ENABLE ROW LEVEL SECURITY;

-- Policy: Brands can view their own partnerships
CREATE POLICY "Brands can view their partnerships"
  ON public.brand_partnerships
  FOR SELECT
  USING (auth.uid() = brand_id);

-- Policy: Creators can view partnerships sent to them
CREATE POLICY "Creators can view their partnerships"
  ON public.brand_partnerships
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Policy: Brands can create partnerships
CREATE POLICY "Brands can create partnerships"
  ON public.brand_partnerships
  FOR INSERT
  WITH CHECK (auth.uid() = brand_id);

-- Policy: Creators can update partnership status
CREATE POLICY "Creators can update partnership status"
  ON public.brand_partnerships
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- CREATE INDEX IF NOT EXISTS for faster queries
CREATE INDEX IF NOT EXISTS idx_brand_partnerships_creator ON public.brand_partnerships(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_partnerships_brand ON public.brand_partnerships(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_partnerships_status ON public.brand_partnerships(status);

-- Create updated_at trigger
CREATE TRIGGER update_brand_partnerships_updated_at
  BEFORE UPDATE ON public.brand_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
