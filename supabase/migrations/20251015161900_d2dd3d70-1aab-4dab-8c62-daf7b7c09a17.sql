-- Phase 3: Create comprehensive promotion system tables

-- Vendor promotion tiers and subscriptions
CREATE TABLE IF NOT EXISTS vendor_promotion_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES transportation_vendors(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'bronze', 'silver', 'gold', 'platinum')),
  monthly_price NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 15.0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  payment_method_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Promotional media library
CREATE TABLE IF NOT EXISTS vendor_promotional_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES transportation_vendors(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video', '360_tour')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  is_cover BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  hashtags TEXT[],
  analytics JSONB DEFAULT '{"views": 0, "clicks": 0}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Promotional packages (special deals)
CREATE TABLE IF NOT EXISTS vendor_promotional_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES transportation_vendors(id) ON DELETE CASCADE NOT NULL,
  package_name TEXT NOT NULL,
  description TEXT,
  package_photos JSONB DEFAULT '[]',
  regular_price NUMERIC NOT NULL,
  promotional_price NUMERIC NOT NULL,
  discount_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN regular_price > 0 
    THEN ROUND(((regular_price - promotional_price) / regular_price * 100)::numeric, 2)
    ELSE 0 END
  ) STORED,
  inclusions TEXT[],
  exclusions TEXT[],
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  max_bookings INTEGER,
  current_bookings INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics tracking for promoted vendors
CREATE TABLE IF NOT EXISTS vendor_promotion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES transportation_vendors(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  booking_inquiries INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  ad_spend NUMERIC DEFAULT 0,
  ctr NUMERIC GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN ROUND((clicks::numeric / impressions * 100)::numeric, 2) ELSE 0 END
  ) STORED,
  conversion_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN clicks > 0 THEN ROUND((conversions::numeric / clicks * 100)::numeric, 2) ELSE 0 END
  ) STORED,
  roi NUMERIC GENERATED ALWAYS AS (
    CASE WHEN ad_spend > 0 THEN ROUND(((revenue_generated - ad_spend) / ad_spend * 100)::numeric, 2) ELSE 0 END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(vendor_id, date)
);

-- Enable RLS
ALTER TABLE vendor_promotion_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_promotional_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_promotional_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_promotion_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Vendors can view own subscriptions"
ON vendor_promotion_subscriptions FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM transportation_vendors WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for media
CREATE POLICY "Vendors can view own media"
ON vendor_promotional_media FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM transportation_vendors WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Public can view active vendor media"
ON vendor_promotional_media FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Vendors can insert own media"
ON vendor_promotional_media FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id IN (
    SELECT id FROM transportation_vendors WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Vendors can update own media"
ON vendor_promotional_media FOR UPDATE
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM transportation_vendors WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Vendors can delete own media"
ON vendor_promotional_media FOR DELETE
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM transportation_vendors WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for packages
CREATE POLICY "Public can view active packages"
ON vendor_promotional_packages FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Vendors can manage own packages"
ON vendor_promotional_packages FOR ALL
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM transportation_vendors WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for analytics
CREATE POLICY "Admins can view all analytics"
ON vendor_promotion_analytics FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can view own analytics"
ON vendor_promotion_analytics FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM transportation_vendors WHERE supplier_id IN (
      SELECT id FROM suppliers WHERE user_id = auth.uid()
    )
  )
);

-- Storage bucket for vendor promotions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-promotions',
  'vendor-promotions',
  true,
  104857600,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'video/mp4', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for vendor-promotions bucket
CREATE POLICY "Public can view vendor promotion media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-promotions');

CREATE POLICY "Authenticated users can upload vendor promotion media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vendor-promotions');

CREATE POLICY "Users can update their own vendor promotion media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vendor-promotions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own vendor promotion media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vendor-promotions' AND (storage.foldername(name))[1] = auth.uid()::text);