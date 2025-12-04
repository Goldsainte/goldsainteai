-- Add creator pricing and commitment fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'commission_only',
ADD COLUMN IF NOT EXISTS planning_fee_amount INTEGER,
ADD COLUMN IF NOT EXISTS itinerary_fee_amount INTEGER,
ADD COLUMN IF NOT EXISTS response_commitment_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS accepts_transparency_agreement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transparency_agreement_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS accepts_safety_policy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS safety_policy_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_persona_tone TEXT,
ADD COLUMN IF NOT EXISTS ai_persona_audience TEXT[],
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available',
ADD COLUMN IF NOT EXISTS unavailable_until DATE,
ADD COLUMN IF NOT EXISTS accepts_booking_calls BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS travel_philosophy TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.pricing_model IS 'Creator pricing model: commission_only, planning_fees, custom_itineraries, premium_content';
COMMENT ON COLUMN public.profiles.ai_persona_tone IS 'AI persona voice: chic, playful, cinematic, warm';
COMMENT ON COLUMN public.profiles.availability_status IS 'Creator availability: available, traveling, unavailable';