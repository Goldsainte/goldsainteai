-- Create agent packages table (trips with backend pricing)
CREATE TABLE IF NOT EXISTS public.agent_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  
  -- Pricing structure
  wholesale_cost NUMERIC NOT NULL, -- What agent pays suppliers
  retail_price NUMERIC NOT NULL, -- What customer pays
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Commission splits
  agent_commission_percentage NUMERIC NOT NULL DEFAULT 40.0, -- Agent's share
  influencer_commission_percentage NUMERIC NOT NULL DEFAULT 40.0, -- Influencer's share
  platform_fee_percentage NUMERIC NOT NULL DEFAULT 20.0, -- Platform's share
  
  -- Package details
  inclusions JSONB DEFAULT '[]'::jsonb,
  exclusions JSONB DEFAULT '[]'::jsonb,
  terms_conditions TEXT,
  
  -- Availability
  available_from DATE,
  available_until DATE,
  max_participants INTEGER,
  
  -- Marketing assets
  images JSONB DEFAULT '[]'::jsonb,
  promotional_materials JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create influencer promotions table
CREATE TABLE IF NOT EXISTS public.influencer_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.agent_packages(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Promotion tracking
  promo_code TEXT UNIQUE NOT NULL, -- Unique code for this influencer-package combo
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_commission_earned NUMERIC DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'ended')),
  approved_by_agent BOOLEAN DEFAULT false,
  
  -- Custom terms (if different from package defaults)
  custom_influencer_commission_percentage NUMERIC,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(package_id, influencer_id)
);

-- Create shared commission bookings table
CREATE TABLE IF NOT EXISTS public.shared_commission_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.agent_packages(id),
  promotion_id UUID REFERENCES public.influencer_promotions(id),
  
  -- Customer info
  customer_id UUID REFERENCES public.profiles(id),
  guest_email TEXT,
  guest_name TEXT,
  
  -- Booking details
  booking_date DATE NOT NULL,
  travel_date DATE NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  
  -- Pricing breakdown
  retail_price NUMERIC NOT NULL,
  wholesale_cost NUMERIC NOT NULL,
  total_margin NUMERIC NOT NULL, -- retail_price - wholesale_cost
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Commission splits
  agent_commission NUMERIC NOT NULL,
  influencer_commission NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  
  -- Payment tracking
  customer_payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (customer_payment_status IN ('pending', 'paid', 'refunded')),
  agent_payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (agent_payout_status IN ('pending', 'paid', 'held')),
  influencer_payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (influencer_payout_status IN ('pending', 'paid', 'held')),
  
  stripe_payment_intent_id TEXT,
  
  booking_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (booking_status IN ('confirmed', 'completed', 'cancelled')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create commission payout requests table
CREATE TABLE IF NOT EXISTS public.commission_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('agent', 'influencer')),
  
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Payout method
  payout_method TEXT NOT NULL DEFAULT 'stripe' CHECK (payout_method IN ('stripe', 'bank_transfer', 'paypal')),
  payout_details JSONB DEFAULT '{}',
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  
  -- Related bookings
  booking_ids JSONB DEFAULT '[]'::jsonb,
  
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  
  stripe_transfer_id TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_commission_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payout_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_packages
CREATE POLICY "Anyone can view active packages"
  ON public.agent_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Agents can create their own packages"
  ON public.agent_packages FOR INSERT
  WITH CHECK (agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  ));

CREATE POLICY "Agents can update their own packages"
  ON public.agent_packages FOR UPDATE
  USING (agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  ));

-- RLS Policies for influencer_promotions
CREATE POLICY "Anyone can view active promotions"
  ON public.influencer_promotions FOR SELECT
  USING (status = 'active');

CREATE POLICY "Influencers can request to promote packages"
  ON public.influencer_promotions FOR INSERT
  WITH CHECK (auth.uid() = influencer_id);

CREATE POLICY "Influencers can view their promotions"
  ON public.influencer_promotions FOR SELECT
  USING (auth.uid() = influencer_id);

CREATE POLICY "Agents can approve promotions for their packages"
  ON public.influencer_promotions FOR UPDATE
  USING (package_id IN (
    SELECT id FROM public.agent_packages WHERE agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  ));

-- RLS Policies for shared_commission_bookings
CREATE POLICY "Agents can view bookings for their packages"
  ON public.shared_commission_bookings FOR SELECT
  USING (package_id IN (
    SELECT id FROM public.agent_packages WHERE agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Influencers can view their promoted bookings"
  ON public.shared_commission_bookings FOR SELECT
  USING (promotion_id IN (
    SELECT id FROM public.influencer_promotions WHERE influencer_id = auth.uid()
  ));

CREATE POLICY "Customers can view their bookings"
  ON public.shared_commission_bookings FOR SELECT
  USING (auth.uid() = customer_id);

-- RLS Policies for commission_payout_requests
CREATE POLICY "Users can create their own payout requests"
  ON public.commission_payout_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payout requests"
  ON public.commission_payout_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payout requests"
  ON public.commission_payout_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to calculate commission split
CREATE OR REPLACE FUNCTION public.calculate_commission_split(
  p_retail_price NUMERIC,
  p_wholesale_cost NUMERIC,
  p_agent_percentage NUMERIC,
  p_influencer_percentage NUMERIC,
  p_platform_percentage NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  total_margin NUMERIC;
  agent_commission NUMERIC;
  influencer_commission NUMERIC;
  platform_fee NUMERIC;
BEGIN
  total_margin := p_retail_price - p_wholesale_cost;
  
  agent_commission := total_margin * (p_agent_percentage / 100);
  influencer_commission := total_margin * (p_influencer_percentage / 100);
  platform_fee := total_margin * (p_platform_percentage / 100);
  
  RETURN jsonb_build_object(
    'total_margin', total_margin,
    'agent_commission', agent_commission,
    'influencer_commission', influencer_commission,
    'platform_fee', platform_fee
  );
END;
$$;

-- Create trigger to update timestamps
CREATE TRIGGER update_agent_packages_updated_at
  BEFORE UPDATE ON public.agent_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_influencer_promotions_updated_at
  BEFORE UPDATE ON public.influencer_promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_commission_bookings_updated_at
  BEFORE UPDATE ON public.shared_commission_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commission_payout_requests_updated_at
  BEFORE UPDATE ON public.commission_payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_packages_agent_id ON public.agent_packages(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_packages_active ON public.agent_packages(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_influencer_promotions_package ON public.influencer_promotions(package_id);
CREATE INDEX IF NOT EXISTS idx_influencer_promotions_influencer ON public.influencer_promotions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_promotions_promo_code ON public.influencer_promotions(promo_code);
CREATE INDEX IF NOT EXISTS idx_shared_bookings_package ON public.shared_commission_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_shared_bookings_promotion ON public.shared_commission_bookings(promotion_id);
CREATE INDEX IF NOT EXISTS idx_commission_payouts_user ON public.commission_payout_requests(user_id);
