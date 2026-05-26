-- Create products table for travel gear, merchandise
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  product_type TEXT NOT NULL CHECK (product_type IN ('physical', 'digital', 'package')),
  category TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  inventory_count INTEGER,
  is_active BOOLEAN DEFAULT true,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create travel packages table for pre-made itineraries
CREATE TABLE IF NOT EXISTS public.travel_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  max_travelers INTEGER,
  included_services JSONB DEFAULT '[]'::jsonb,
  itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create affiliate links table
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC NOT NULL DEFAULT 10.0,
  platform TEXT,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create affiliate clicks tracking table
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT false,
  conversion_amount NUMERIC,
  converted_at TIMESTAMPTZ
);

-- Create product orders table
CREATE TABLE IF NOT EXISTS public.product_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.travel_packages(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  seller_payout NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'refunded')),
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  shipping_address JSONB,
  tracking_number TEXT,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create affiliate commissions table
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_click_id UUID REFERENCES public.affiliate_clicks(id) ON DELETE SET NULL,
  commission_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create live shopping events table
CREATE TABLE IF NOT EXISTS public.live_shopping_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  featured_products JSONB DEFAULT '[]'::jsonb,
  stream_url TEXT,
  viewer_count INTEGER DEFAULT 0,
  total_sales NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create live shopping viewers table for tracking
CREATE TABLE IF NOT EXISTS public.live_shopping_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.live_shopping_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  purchases_made INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_shopping_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_shopping_viewers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can manage their own products" ON public.products
  FOR ALL USING (auth.uid() = creator_id);

-- RLS Policies for travel packages
CREATE POLICY "Anyone can view active packages" ON public.travel_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can manage their own packages" ON public.travel_packages
  FOR ALL USING (auth.uid() = creator_id);

-- RLS Policies for affiliate links
CREATE POLICY "Creators can manage their own affiliate links" ON public.affiliate_links
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view active affiliate links" ON public.affiliate_links
  FOR SELECT USING (is_active = true);

-- RLS Policies for affiliate clicks
CREATE POLICY "Service role can manage clicks" ON public.affiliate_clicks
  FOR ALL USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Creators can view their affiliate clicks" ON public.affiliate_clicks
  FOR SELECT USING (affiliate_link_id IN (
    SELECT id FROM public.affiliate_links WHERE creator_id = auth.uid()
  ));

-- RLS Policies for product orders
CREATE POLICY "Buyers can view their orders" ON public.product_orders
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view their sales" ON public.product_orders
  FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Users can create orders" ON public.product_orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update their orders" ON public.product_orders
  FOR UPDATE USING (auth.uid() = seller_id);

-- RLS Policies for affiliate commissions
CREATE POLICY "Creators can view their commissions" ON public.affiliate_commissions
  FOR SELECT USING (auth.uid() = creator_id);

-- RLS Policies for live shopping events
CREATE POLICY "Anyone can view scheduled/live events" ON public.live_shopping_events
  FOR SELECT USING (status IN ('scheduled', 'live'));

CREATE POLICY "Creators can manage their events" ON public.live_shopping_events
  FOR ALL USING (auth.uid() = creator_id);

-- RLS Policies for live shopping viewers
CREATE POLICY "Service role can manage viewers" ON public.live_shopping_viewers
  FOR ALL USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Event hosts can view their viewers" ON public.live_shopping_viewers
  FOR SELECT USING (event_id IN (
    SELECT id FROM public.live_shopping_events WHERE creator_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_creator ON public.products(creator_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_creator ON public.travel_packages(creator_id);
CREATE INDEX IF NOT EXISTS idx_packages_active ON public.travel_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_creator ON public.affiliate_links(creator_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON public.affiliate_links(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link ON public.affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.product_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.product_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_commissions_creator ON public.affiliate_commissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_creator ON public.live_shopping_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.live_shopping_events(status);

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.travel_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_links_updated_at
  BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.product_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.live_shopping_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
