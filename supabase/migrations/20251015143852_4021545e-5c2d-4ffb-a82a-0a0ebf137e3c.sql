-- Drop existing supplier tables to recreate with proper schema
DROP TABLE IF EXISTS public.supplier_reviews CASCADE;
DROP TABLE IF EXISTS public.supplier_vetting CASCADE;
DROP TABLE IF EXISTS public.supplier_partnerships CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;

-- Phase 1: Transportation Vendors Database Schema (Fixed)

-- Create suppliers table (main vendor registry)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  supplier_type TEXT NOT NULL CHECK (supplier_type IN ('transportation', 'hotel', 'restaurant', 'activity', 'other')),
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  commission_rate NUMERIC(5,2) DEFAULT 15.00,
  insurance_verified BOOLEAN DEFAULT false,
  license_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transportation_vendors table
CREATE TABLE IF NOT EXISTS public.transportation_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL UNIQUE,
  service_areas TEXT[] DEFAULT '{}',
  vehicle_types TEXT[] DEFAULT '{}',
  fleet_size INTEGER DEFAULT 0,
  years_in_business INTEGER,
  base_hourly_rate NUMERIC(10,2),
  minimum_booking_hours INTEGER DEFAULT 2,
  cancellation_policy TEXT,
  insurance_policy_number TEXT,
  insurance_expiry_date DATE,
  commercial_license_number TEXT,
  commercial_license_expiry DATE,
  dot_number TEXT,
  pricing_model TEXT DEFAULT 'hourly' CHECK (pricing_model IN ('hourly', 'fixed', 'distance', 'custom')),
  amenities TEXT[] DEFAULT '{}',
  languages_supported TEXT[] DEFAULT '{"English"}',
  is_promoted_vendor BOOLEAN DEFAULT false,
  promoted_until TIMESTAMPTZ,
  promotion_tier TEXT,
  featured_badge TEXT,
  average_response_time_minutes INTEGER DEFAULT 0,
  on_time_percentage NUMERIC(5,2) DEFAULT 100.00,
  total_bookings INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor_fleet table
CREATE TABLE IF NOT EXISTS public.vendor_fleet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.transportation_vendors(id) ON DELETE CASCADE NOT NULL,
  vehicle_type TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  license_plate TEXT NOT NULL,
  passenger_capacity INTEGER NOT NULL,
  luggage_capacity INTEGER,
  amenities TEXT[] DEFAULT '{}',
  hourly_rate NUMERIC(10,2),
  daily_rate NUMERIC(10,2),
  is_available BOOLEAN DEFAULT true,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  insurance_expiry_date DATE,
  registration_expiry_date DATE,
  vehicle_photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor_drivers table
CREATE TABLE IF NOT EXISTS public.vendor_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.transportation_vendors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_expiry_date DATE NOT NULL,
  phone TEXT,
  email TEXT,
  languages TEXT[] DEFAULT '{"English"}',
  rating NUMERIC(3,2) DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  background_check_status TEXT DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'approved', 'rejected')),
  background_check_date DATE,
  certifications JSONB DEFAULT '[]',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor_availability table
CREATE TABLE IF NOT EXISTS public.vendor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.transportation_vendors(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vendor_fleet(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.vendor_drivers(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendor_promotions table
CREATE TABLE IF NOT EXISTS public.vendor_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.transportation_vendors(id) ON DELETE CASCADE NOT NULL,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('promoted_vendor', 'sponsored_post', 'featured_listing', 'discount_campaign')),
  campaign_name TEXT NOT NULL,
  campaign_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_budget NUMERIC(10,2),
  total_budget NUMERIC(10,2),
  amount_spent NUMERIC(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  discount_code TEXT,
  discount_percentage NUMERIC(5,2),
  special_offer_text TEXT,
  target_locations TEXT[] DEFAULT '{}',
  target_trip_types TEXT[] DEFAULT '{}',
  promotional_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supplier_vetting table
CREATE TABLE IF NOT EXISTS public.supplier_vetting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  vetting_status TEXT DEFAULT 'pending' CHECK (vetting_status IN ('pending', 'in_review', 'approved', 'rejected')),
  background_check_status TEXT DEFAULT 'pending',
  license_check_status TEXT DEFAULT 'pending',
  insurance_check_status TEXT DEFAULT 'pending',
  reference_check_status TEXT DEFAULT 'pending',
  vetting_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  approval_decision TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supplier_reviews table
CREATE TABLE IF NOT EXISTS public.supplier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportation_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_fleet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_vetting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active verified suppliers"
  ON public.suppliers FOR SELECT
  USING (is_active = true AND is_verified = true);

CREATE POLICY "Suppliers can view own profile"
  ON public.suppliers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Suppliers can update own profile"
  ON public.suppliers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all suppliers"
  ON public.suppliers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "View active vendors"
  ON public.transportation_vendors FOR SELECT
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE is_active = true AND is_verified = true));

CREATE POLICY "Vendors view own details"
  ON public.transportation_vendors FOR SELECT
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

CREATE POLICY "Vendors update own details"
  ON public.transportation_vendors FOR UPDATE
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

CREATE POLICY "View available fleet"
  ON public.vendor_fleet FOR SELECT
  USING (is_available = true AND vendor_id IN (
    SELECT id FROM public.transportation_vendors WHERE supplier_id IN (
      SELECT id FROM public.suppliers WHERE is_active = true AND is_verified = true
    )
  ));

CREATE POLICY "Vendors manage own fleet"
  ON public.vendor_fleet FOR ALL
  USING (vendor_id IN (
    SELECT id FROM public.transportation_vendors WHERE supplier_id IN (
      SELECT id FROM public.suppliers WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "View active drivers"
  ON public.vendor_drivers FOR SELECT
  USING (is_active = true AND vendor_id IN (
    SELECT id FROM public.transportation_vendors WHERE supplier_id IN (
      SELECT id FROM public.suppliers WHERE is_active = true AND is_verified = true
    )
  ));

CREATE POLICY "Vendors manage own drivers"
  ON public.vendor_drivers FOR ALL
  USING (vendor_id IN (
    SELECT id FROM public.transportation_vendors WHERE supplier_id IN (
      SELECT id FROM public.suppliers WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "View availability"
  ON public.vendor_availability FOR SELECT
  USING (vendor_id IN (
    SELECT id FROM public.transportation_vendors WHERE supplier_id IN (
      SELECT id FROM public.suppliers WHERE is_active = true AND is_verified = true
    )
  ));

CREATE POLICY "Vendors manage own availability"
  ON public.vendor_availability FOR ALL
  USING (vendor_id IN (
    SELECT id FROM public.transportation_vendors WHERE supplier_id IN (
      SELECT id FROM public.suppliers WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "View active promotions"
  ON public.vendor_promotions FOR SELECT
  USING (is_active = true AND vendor_id IN (
    SELECT id FROM public.transportation_vendors WHERE supplier_id IN (
      SELECT id FROM public.suppliers WHERE is_active = true AND is_verified = true
    )
  ));

CREATE POLICY "Vendors manage own promotions"
  ON public.vendor_promotions FOR ALL
  USING (vendor_id IN (
    SELECT id FROM public.transportation_vendors WHERE supplier_id IN (
      SELECT id FROM public.suppliers WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Admins view all vetting"
  ON public.supplier_vetting FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage vetting"
  ON public.supplier_vetting FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Suppliers view own vetting"
  ON public.supplier_vetting FOR SELECT
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

CREATE POLICY "View verified reviews"
  ON public.supplier_reviews FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Users create reviews"
  ON public.supplier_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Suppliers respond to reviews"
  ON public.supplier_reviews FOR UPDATE
  USING (supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_user ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON public.suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_verification ON public.suppliers(verification_status);
CREATE INDEX IF NOT EXISTS idx_transport_vendors_supplier ON public.transportation_vendors(supplier_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vendor ON public.vendor_fleet(vendor_id);
CREATE INDEX IF NOT EXISTS idx_drivers_vendor ON public.vendor_drivers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_availability_vendor ON public.vendor_availability(vendor_id);
CREATE INDEX IF NOT EXISTS idx_availability_dates ON public.vendor_availability(start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_promotions_vendor ON public.vendor_promotions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vetting_supplier ON public.supplier_vetting(supplier_id);
CREATE INDEX IF NOT EXISTS idx_reviews_supplier ON public.supplier_reviews(supplier_id);

-- Triggers
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_transport_vendors_updated_at BEFORE UPDATE ON public.transportation_vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_fleet_updated_at BEFORE UPDATE ON public.vendor_fleet
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.vendor_drivers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON public.vendor_availability
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.vendor_promotions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_vetting_updated_at BEFORE UPDATE ON public.supplier_vetting
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.supplier_reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
