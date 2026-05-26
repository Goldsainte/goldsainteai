-- Phase 1: Trust & Safety Foundation

-- Add verification fields to travel_agents table
ALTER TABLE public.travel_agents
ADD COLUMN identity_verified boolean DEFAULT false,
ADD COLUMN identity_verification_date timestamp with time zone,
ADD COLUMN identity_document_url text,
ADD COLUMN selfie_verification_url text,
ADD COLUMN background_check_status text DEFAULT 'not_started' CHECK (background_check_status IN ('not_started', 'pending', 'approved', 'rejected')),
ADD COLUMN background_check_date timestamp with time zone,
ADD COLUMN background_check_provider text,
ADD COLUMN professional_license_verified boolean DEFAULT false,
ADD COLUMN professional_license_number text,
ADD COLUMN professional_license_expiry date,
ADD COLUMN professional_license_document_url text,
ADD COLUMN insurance_verified boolean DEFAULT false,
ADD COLUMN insurance_policy_number text,
ADD COLUMN insurance_expiry date,
ADD COLUMN insurance_document_url text,
ADD COLUMN insurance_provider text,
ADD COLUMN trust_score numeric(3,2) DEFAULT 0.00 CHECK (trust_score >= 0 AND trust_score <= 5);

-- Create verification documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for verification documents
CREATE POLICY "Agents can upload their verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.travel_agents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Agents can view their own verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.travel_agents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  has_role(auth.uid(), 'admin')
);

-- Create reports/flags table
CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_agent_id uuid REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('inappropriate_behavior', 'fraud', 'spam', 'fake_profile', 'harassment', 'other')),
  report_category text NOT NULL CHECK (report_category IN ('safety', 'quality', 'conduct', 'authenticity')),
  description text NOT NULL,
  evidence_urls jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  admin_notes text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON public.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON public.user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_severity ON public.user_reports(severity);

-- RLS policies for reports
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.user_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
ON public.user_reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.user_reports FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.user_reports FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create agent verification requests table
CREATE TABLE IF NOT EXISTS public.agent_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('identity', 'background_check', 'professional_license', 'insurance')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'expired')),
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason text,
  document_urls jsonb DEFAULT '[]'::jsonb,
  additional_info jsonb DEFAULT '{}'::jsonb,
  expiry_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_verification_requests_agent ON public.agent_verification_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.agent_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_type ON public.agent_verification_requests(verification_type);

-- RLS policies for verification requests
ALTER TABLE public.agent_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own verification requests"
ON public.agent_verification_requests FOR SELECT
TO authenticated
USING (
  agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Agents can create verification requests"
ON public.agent_verification_requests FOR INSERT
TO authenticated
WITH CHECK (
  agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all verification requests"
ON public.agent_verification_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification requests"
ON public.agent_verification_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create trigger to update updated_at
CREATE TRIGGER update_user_reports_updated_at
BEFORE UPDATE ON public.user_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.agent_verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION public.calculate_agent_trust_score(agent_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score numeric := 0;
BEGIN
  -- Base score from verifications (max 3.0)
  SELECT 
    CASE WHEN identity_verified THEN 0.75 ELSE 0 END +
    CASE WHEN background_check_status = 'approved' THEN 0.75 ELSE 0 END +
    CASE WHEN professional_license_verified THEN 0.75 ELSE 0 END +
    CASE WHEN insurance_verified THEN 0.75 ELSE 0 END
  INTO score
  FROM public.travel_agents
  WHERE id = agent_uuid;
  
  -- Add rating score (max 2.0)
  SELECT score + COALESCE((rating / 5.0 * 2.0), 0)
  INTO score
  FROM public.travel_agents
  WHERE id = agent_uuid;
  
  RETURN LEAST(score, 5.0);
END;
$$;

-- Comment on tables and columns
COMMENT ON TABLE public.user_reports IS 'Tracks user reports and flags for inappropriate behavior, fraud, etc.';
COMMENT ON TABLE public.agent_verification_requests IS 'Tracks agent verification submissions for identity, background checks, licenses, and insurance';
COMMENT ON COLUMN public.travel_agents.trust_score IS 'Calculated trust score based on verifications and ratings (0-5)';
