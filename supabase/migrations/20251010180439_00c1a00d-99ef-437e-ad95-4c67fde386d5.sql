-- Supplier/Partner Categories
CREATE TYPE public.supplier_type AS ENUM ('hotel', 'activity_provider', 'tour_guide', 'restaurant', 'transportation', 'other');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');

-- Suppliers/Partners Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  supplier_type public.supplier_type NOT NULL,
  business_name TEXT,
  business_registration_number TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  address JSONB DEFAULT '{}'::jsonb,
  
  -- Verification
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  
  -- Rating & Trust
  rating NUMERIC(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  trust_score NUMERIC(3,2) DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 5),
  
  -- Business Info
  description TEXT,
  services_offered TEXT[],
  certifications TEXT[],
  insurance_verified BOOLEAN DEFAULT false,
  license_verified BOOLEAN DEFAULT false,
  
  -- Financial
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  payment_terms TEXT DEFAULT 'Net 30',
  
  -- Documents
  verification_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supplier Reviews Table
CREATE TABLE IF NOT EXISTS public.supplier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  
  -- Review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  
  -- Detailed Ratings
  service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
  value_for_money_rating INTEGER CHECK (value_for_money_rating >= 1 AND value_for_money_rating <= 5),
  reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  
  -- Media
  photos JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  response_from_supplier TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supplier Vetting Process Table
CREATE TABLE IF NOT EXISTS public.supplier_vetting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  
  -- Vetting Checks
  background_check_status TEXT DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'passed', 'failed', 'not_required')),
  license_check_status TEXT DEFAULT 'pending' CHECK (license_check_status IN ('pending', 'verified', 'expired', 'invalid', 'not_required')),
  insurance_check_status TEXT DEFAULT 'pending' CHECK (insurance_check_status IN ('pending', 'verified', 'expired', 'insufficient', 'not_required')),
  reference_check_status TEXT DEFAULT 'pending' CHECK (reference_check_status IN ('pending', 'verified', 'failed', 'not_required')),
  
  -- Vetting Details
  vetting_notes TEXT,
  red_flags JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  
  -- Approval
  vetted_by UUID,
  vetted_at TIMESTAMP WITH TIME ZONE,
  approval_decision TEXT CHECK (approval_decision IN ('approved', 'rejected', 'pending_info', 'escalated')),
  rejection_reason TEXT,
  
  -- Expiry & Renewal
  vetting_expires_at TIMESTAMP WITH TIME ZONE,
  renewal_required BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Supplier Partnerships (Who's using which suppliers)
CREATE TABLE IF NOT EXISTS public.supplier_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  agent_id UUID REFERENCES public.travel_agents(id) ON DELETE SET NULL,
  
  -- Partnership Details
  partnership_type TEXT DEFAULT 'preferred' CHECK (partnership_type IN ('preferred', 'exclusive', 'trial', 'standard')),
  commission_override NUMERIC(5,2),
  discount_percentage NUMERIC(5,2),
  
  -- Usage Stats
  total_bookings INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  last_booking_date TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  partnership_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  partnership_end_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(supplier_id, creator_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON public.suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_suppliers_verification ON public.suppliers(verification_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON public.suppliers(rating);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_supplier ON public.supplier_reviews(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_reviews_reviewer ON public.supplier_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_supplier_vetting_supplier ON public.supplier_vetting(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_partnerships_supplier ON public.supplier_partnerships(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_partnerships_creator ON public.supplier_partnerships(creator_id);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_vetting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_partnerships ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Suppliers
CREATE POLICY "Anyone can view active verified suppliers"
  ON public.suppliers FOR SELECT
  USING (is_active = true AND verification_status = 'verified');

CREATE POLICY "Admins can manage suppliers"
  ON public.suppliers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Suppliers can view their own profile"
  ON public.suppliers FOR SELECT
  USING (contact_email IN (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS Policies - Supplier Reviews
CREATE POLICY "Anyone can view approved supplier reviews"
  ON public.supplier_reviews FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Users can create reviews for suppliers they've booked"
  ON public.supplier_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own reviews"
  ON public.supplier_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Admins can manage all reviews"
  ON public.supplier_reviews FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies - Supplier Vetting
CREATE POLICY "Admins can view all vetting records"
  ON public.supplier_vetting FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage vetting"
  ON public.supplier_vetting FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies - Supplier Partnerships
CREATE POLICY "Creators can view their partnerships"
  ON public.supplier_partnerships FOR SELECT
  USING (auth.uid() = creator_id OR agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can create partnerships"
  ON public.supplier_partnerships FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their partnerships"
  ON public.supplier_partnerships FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all partnerships"
  ON public.supplier_partnerships FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_reviews_updated_at
  BEFORE UPDATE ON public.supplier_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_vetting_updated_at
  BEFORE UPDATE ON public.supplier_vetting
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_partnerships_updated_at
  BEFORE UPDATE ON public.supplier_partnerships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update supplier rating when reviews are added
CREATE OR REPLACE FUNCTION update_supplier_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.suppliers
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM public.supplier_reviews
      WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
        AND is_verified = true
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.supplier_reviews
      WHERE supplier_id = COALESCE(NEW.supplier_id, OLD.supplier_id)
        AND is_verified = true
    )
  WHERE id = COALESCE(NEW.supplier_id, OLD.supplier_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_supplier_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_reviews
  FOR EACH ROW EXECUTE FUNCTION update_supplier_rating();

-- Function to calculate supplier trust score
CREATE OR REPLACE FUNCTION calculate_supplier_trust_score(supplier_uuid UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score NUMERIC := 0;
  vetting_record RECORD;
BEGIN
  -- Get vetting record
  SELECT * INTO vetting_record
  FROM public.supplier_vetting
  WHERE supplier_id = supplier_uuid
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Base score from verifications (max 3.0)
  SELECT 
    CASE WHEN verification_status = 'verified' THEN 1.0 ELSE 0 END +
    CASE WHEN insurance_verified THEN 0.5 ELSE 0 END +
    CASE WHEN license_verified THEN 0.5 ELSE 0 END
  INTO score
  FROM public.suppliers
  WHERE id = supplier_uuid;
  
  -- Add vetting checks (max 1.0)
  IF vetting_record IS NOT NULL THEN
    score := score + 
      CASE WHEN vetting_record.background_check_status = 'passed' THEN 0.25 ELSE 0 END +
      CASE WHEN vetting_record.license_check_status = 'verified' THEN 0.25 ELSE 0 END +
      CASE WHEN vetting_record.insurance_check_status = 'verified' THEN 0.25 ELSE 0 END +
      CASE WHEN vetting_record.reference_check_status = 'verified' THEN 0.25 ELSE 0 END;
  END IF;
  
  -- Add rating score (max 1.0)
  SELECT score + COALESCE((rating / 5.0), 0)
  INTO score
  FROM public.suppliers
  WHERE id = supplier_uuid;
  
  RETURN LEAST(score, 5.0);
END;
$$;
