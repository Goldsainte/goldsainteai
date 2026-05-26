-- Add TikTok verification columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tiktok_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tiktok_follower_count integer,
ADD COLUMN IF NOT EXISTS tiktok_verified_at timestamp with time zone;

-- Add brand alignment columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_brand_tiers text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS preferred_hotel_brands text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS aesthetic_alignment text[] DEFAULT '{}';

-- Add legal compliance tracking columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tos_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS creator_agreement_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS tos_version text,
ADD COLUMN IF NOT EXISTS privacy_version text,
ADD COLUMN IF NOT EXISTS creator_agreement_version text;

-- Add AI persona columns (if not exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_persona_tone text,
ADD COLUMN IF NOT EXISTS ai_persona_audience text,
ADD COLUMN IF NOT EXISTS travel_philosophy text;

-- CREATE INDEX IF NOT EXISTS for TikTok verified creators
CREATE INDEX IF NOT EXISTS idx_profiles_tiktok_verified ON public.profiles(tiktok_verified) WHERE tiktok_verified = true;
