-- ============================================
-- GOLDSAINTE DATABASE SCHEMA EXPORT
-- Generated: 2025-12-15
-- Source: Lovable Cloud (Supabase)
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CUSTOM TYPES (ENUMS)
-- ============================================

CREATE TYPE public.app_role AS ENUM (
  'admin',
  'agent',
  'traveler',
  'creator',
  'brand'
);

CREATE TYPE public.subscription_tier AS ENUM (
  'free',
  'premium',
  'enterprise'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

CREATE TYPE public.payout_status AS ENUM (
  'pending',
  'scheduled',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE public.booking_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
);

-- ============================================
-- TABLES
-- ============================================

-- Profiles (Core user data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  account_type TEXT DEFAULT 'traveler',
  account_status TEXT DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  is_profile_complete BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  sms_notifications BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  agent_verification_status TEXT,
  brand_verification_status TEXT,
  website TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  youtube_handle TEXT,
  twitter_handle TEXT,
  primary_platform TEXT,
  content_style_tags TEXT[],
  destinations_focus_tags TEXT[],
  creator_niches TEXT[],
  languages TEXT[],
  travel_budget_level TEXT,
  featured_photos TEXT[],
  home_base TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- User Subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.subscription_tier DEFAULT 'free',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Account Restrictions
CREATE TABLE public.account_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  restricted_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  lifted_at TIMESTAMP WITH TIME ZONE,
  lifted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activity Logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin Users
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_role TEXT,
  department TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  can_approve_agents BOOLEAN DEFAULT false,
  can_approve_brands BOOLEAN DEFAULT false,
  can_manage_disputes BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Travel Agents
CREATE TABLE public.travel_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  bio TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  specializations TEXT[],
  destinations TEXT[],
  languages TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  profile_image_url TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 15.00,
  identity_verified BOOLEAN DEFAULT false,
  background_check_status TEXT,
  professional_license_verified BOOLEAN DEFAULT false,
  insurance_verified BOOLEAN DEFAULT false,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Applications
CREATE TABLE public.agent_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  agency_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  business_address TEXT NOT NULL,
  business_city TEXT,
  business_state TEXT,
  business_postal_code TEXT,
  business_country TEXT,
  years_experience INTEGER NOT NULL,
  specialties TEXT[],
  destinations TEXT[],
  languages TEXT[],
  website TEXT,
  license_number TEXT,
  license_state TEXT,
  license_expiry TIMESTAMP WITH TIME ZONE,
  host_agency_name TEXT,
  accreditations TEXT,
  annual_sales_volume TEXT,
  monthly_bookings TEXT,
  average_trip_value TEXT,
  primary_focus TEXT[],
  service_types TEXT[],
  certifications JSONB,
  social_media JSONB,
  documents JSONB,
  document_government_id TEXT,
  document_business_license TEXT,
  document_insurance_cert TEXT,
  document_headshot TEXT,
  stripe_verification_session_id TEXT UNIQUE,
  stripe_verification_status TEXT DEFAULT 'pending',
  stripe_verified_at TIMESTAMP WITH TIME ZONE,
  stripe_verification_report JSONB,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  admin_reviewer_id UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  approval_notes TEXT,
  commission_rate NUMERIC(5,2),
  accepted_terms BOOLEAN DEFAULT false,
  accepted_privacy BOOLEAN DEFAULT false,
  accepted_vendor BOOLEAN DEFAULT false,
  accepted_gdpr BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  terms_version TEXT,
  why_goldsainte TEXT,
  risk_score NUMERIC,
  risk_factors JSONB,
  extended_data JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Availability
CREATE TABLE public.agent_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Badges
CREATE TABLE public.agent_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  criteria_met JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Bids
CREATE TABLE public.agent_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  proposed_price NUMERIC NOT NULL,
  agent_quoted_price NUMERIC DEFAULT 0,
  customer_facing_price NUMERIC DEFAULT 0,
  platform_service_fee NUMERIC,
  platform_success_fee NUMERIC,
  agent_payout_amount NUMERIC,
  service_fee_percentage NUMERIC DEFAULT 3.0,
  success_fee_percentage NUMERIC DEFAULT 15.0,
  currency TEXT DEFAULT 'USD',
  proposal_details TEXT NOT NULL,
  estimated_completion_days INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Inquiries
CREATE TABLE public.agent_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  inquiry_source TEXT DEFAULT 'web',
  conversation_data JSONB DEFAULT '{}',
  generated_itinerary JSONB,
  status TEXT DEFAULT 'new',
  priority TEXT,
  assigned_agent_id UUID,
  matched_agent_ids TEXT[],
  ai_match_score NUMERIC,
  marketplace_job_id UUID REFERENCES public.marketplace_jobs(id),
  converted_to_job_id UUID REFERENCES public.marketplace_jobs(id),
  contacted_at TIMESTAMP WITH TIME ZONE,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  additional_emails JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Packages
CREATE TABLE public.agent_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.travel_agents(user_id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  retail_price NUMERIC NOT NULL,
  wholesale_cost NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  base_price_per_person NUMERIC,
  deposit_percentage NUMERIC,
  deposit_amount NUMERIC,
  platform_fee_percentage NUMERIC DEFAULT 15.0,
  agent_commission_percentage NUMERIC DEFAULT 0,
  influencer_commission_percentage NUMERIC DEFAULT 0,
  cover_image_url TEXT,
  images JSONB,
  highlights JSONB,
  inclusions JSONB,
  exclusions JSONB,
  faq JSONB,
  upgrade_options JSONB,
  promotional_materials JSONB,
  hashtags TEXT[],
  trip_type TEXT,
  ideal_for TEXT,
  why_this_trip TEXT,
  creator_video_url TEXT,
  min_group_size INTEGER,
  max_participants INTEGER,
  min_signups_to_confirm INTEGER,
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  booking_deadline_days INTEGER,
  booking_approval_type TEXT,
  payment_plan_type TEXT,
  cancellation_policy TEXT,
  refund_policy TEXT,
  terms_conditions TEXT,
  travel_requirements TEXT,
  waiver_text TEXT,
  emergency_contact_required BOOLEAN DEFAULT false,
  agent_notes TEXT,
  status TEXT DEFAULT 'draft',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Performance Metrics
CREATE TABLE public.agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  total_bids_sent INTEGER DEFAULT 0,
  bids_accepted INTEGER DEFAULT 0,
  bids_declined INTEGER DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  jobs_cancelled INTEGER DEFAULT 0,
  avg_response_time_minutes INTEGER,
  avg_first_response_minutes INTEGER,
  avg_customer_rating NUMERIC,
  acceptance_rate_percentage NUMERIC,
  completion_rate_percentage NUMERIC,
  response_rate_percentage NUMERIC,
  on_time_delivery_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Response Tracking
CREATE TABLE public.agent_response_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  job_id UUID REFERENCES public.marketplace_jobs(id),
  message_id UUID REFERENCES public.marketplace_messages(id),
  inquiry_received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  first_response_at TIMESTAMP WITH TIME ZONE,
  response_time_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Reviews
CREATE TABLE public.agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.marketplace_jobs(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Terms Acceptance
CREATE TABLE public.agent_terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  vendor_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent Verification Requests
CREATE TABLE public.agent_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.travel_agents(user_id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  document_urls JSONB,
  additional_info JSONB,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Agent Profiles
CREATE TABLE public.ai_agent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_name TEXT DEFAULT 'Madison',
  voice TEXT DEFAULT 'friendly',
  personality_instructions TEXT,
  communication_style TEXT,
  preferred_language TEXT DEFAULT 'en',
  travel_preferences JSONB,
  custom_knowledge JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Bundled Packages
CREATE TABLE public.ai_bundled_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  travelers_count INTEGER DEFAULT 1,
  flight_details JSONB,
  hotel_details JSONB,
  car_details JSONB,
  total_price NUMERIC NOT NULL,
  bundled_price NUMERIC NOT NULL,
  savings_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Matching Scores
CREATE TABLE public.ai_matching_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  match_score NUMERIC NOT NULL,
  confidence_level TEXT NOT NULL,
  matching_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Usage Logs
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  endpoint TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- API Error Logs
CREATE TABLE public.api_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT,
  error_details JSONB,
  http_status INTEGER,
  request_params JSONB,
  user_id UUID,
  severity TEXT DEFAULT 'error',
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- API Health Metrics
CREATE TABLE public.api_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  metadata JSONB,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Application Audit Log
CREATE TABLE public.application_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  application_type TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID,
  actor_type TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Auto Assignment Rules
CREATE TABLE public.auto_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  destinations TEXT[],
  specializations TEXT[],
  booking_types TEXT[],
  min_budget NUMERIC,
  max_budget NUMERIC,
  priority INTEGER DEFAULT 0,
  auto_accept BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Blocked Keywords
CREATE TABLE public.blocked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT,
  severity TEXT DEFAULT 'warning',
  action TEXT DEFAULT 'flag',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  agent_id UUID,
  creator_id UUID,
  brand_id UUID,
  proposal_id UUID,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status public.booking_status DEFAULT 'pending',
  payment_status public.payment_status DEFAULT 'pending',
  payout_status public.payout_status DEFAULT 'pending',
  total_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  platform_fee NUMERIC,
  platform_fee_cents INTEGER,
  platform_commission_pct NUMERIC DEFAULT 15.0,
  agent_share NUMERIC,
  agent_earnings NUMERIC,
  agent_payout_cents INTEGER,
  agent_commission_pct NUMERIC,
  creator_share NUMERIC,
  creator_earnings NUMERIC,
  creator_payout_cents INTEGER,
  creator_commission_pct NUMERIC,
  brand_payout_cents INTEGER,
  brand_commission_pct NUMERIC,
  escrow_held_cents INTEGER,
  escrow_released_cents INTEGER,
  refund_amount_cents INTEGER,
  milestone_payment_enabled BOOLEAN DEFAULT false,
  milestones JSONB,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  payout_scheduled_at TIMESTAMP WITH TIME ZONE,
  payout_paid_at TIMESTAMP WITH TIME ZONE,
  payout_eligible_at TIMESTAMP WITH TIME ZONE,
  payout_expected_at TIMESTAMP WITH TIME ZONE,
  payout_completed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID,
  cancellation_reason TEXT,
  is_disputed BOOLEAN DEFAULT false,
  dispute_reason TEXT,
  dispute_opened_at TIMESTAMP WITH TIME ZONE,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  dispute_resolution TEXT,
  agent_reviewed BOOLEAN DEFAULT false,
  creator_reviewed BOOLEAN DEFAULT false,
  special_requests TEXT,
  notes JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Booking Cancellation Policies
CREATE TABLE public.booking_cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  booking_type TEXT NOT NULL,
  hours_before_checkin INTEGER NOT NULL,
  refund_percentage NUMERIC NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Booking Cancellations
CREATE TABLE public.booking_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.trip_bookings(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  requested_role TEXT NOT NULL,
  reason_short TEXT NOT NULL,
  reason_details TEXT,
  status TEXT DEFAULT 'pending',
  decision_by UUID,
  decision_reason TEXT,
  decided_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Booking Messages
CREATE TABLE public.booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Booking Milestones
CREATE TABLE public.booking_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  due_condition TEXT,
  stripe_payment_intent_id TEXT,
  funded_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  released_to UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Booking Modifications
CREATE TABLE public.booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amadeus_order_id TEXT,
  modification_type TEXT NOT NULL,
  original_booking_data JSONB NOT NULL,
  new_booking_data JSONB,
  reason TEXT,
  notes TEXT,
  change_fee NUMERIC,
  fare_difference NUMERIC,
  cancellation_fee NUMERIC,
  refund_amount NUMERIC,
  refund_currency TEXT,
  refund_status TEXT,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Booking Refunds
CREATE TABLE public.booking_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  cancellation_id UUID NOT NULL,
  refund_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  stripe_refund_id TEXT,
  stripe_payment_intent_id TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Booking Status History
CREATE TABLE public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.trip_bookings(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Brand Applications
CREATE TABLE public.brand_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  brand_name TEXT NOT NULL,
  brand_type TEXT NOT NULL,
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,
  primary_contact_title TEXT,
  website TEXT,
  regions TEXT[],
  style_tags TEXT[],
  stripe_verification_session_id TEXT UNIQUE,
  stripe_verification_status TEXT DEFAULT 'pending',
  stripe_verified_at TIMESTAMP WITH TIME ZONE,
  admin_status TEXT DEFAULT 'pending_review',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  user_account_created BOOLEAN DEFAULT false,
  created_user_id UUID,
  created_brand_profile_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Brand Profiles
CREATE TABLE public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  brand_type TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  description TEXT,
  tagline TEXT,
  website TEXT,
  instagram_handle TEXT,
  regions TEXT[],
  style_tags TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Creator Earnings
CREATE TABLE public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  earning_type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  source_id UUID,
  source_type TEXT,
  payout_id UUID,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Creator Profiles
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  tagline TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  home_base TEXT,
  website TEXT,
  instagram_handle TEXT,
  instagram_followers INTEGER,
  tiktok_handle TEXT,
  tiktok_followers INTEGER,
  youtube_handle TEXT,
  youtube_followers INTEGER,
  twitter_handle TEXT,
  primary_platform TEXT,
  content_style_tags TEXT[],
  destinations_focus_tags TEXT[],
  creator_niches TEXT[],
  languages TEXT[],
  travel_budget_level TEXT,
  featured_photos TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  total_followers INTEGER DEFAULT 0,
  engagement_rate NUMERIC,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  stripe_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Creator Tier Memberships
CREATE TABLE public.creator_tier_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  current_tier TEXT DEFAULT 'bronze',
  previous_tier TEXT,
  tier_since TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Creator Tiers
CREATE TABLE public.creator_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT UNIQUE NOT NULL,
  tier_level INTEGER NOT NULL,
  min_followers INTEGER DEFAULT 0,
  min_posts INTEGER DEFAULT 0,
  min_engagement_rate NUMERIC DEFAULT 0,
  min_monthly_earnings NUMERIC DEFAULT 0,
  commission_bonus_percentage NUMERIC DEFAULT 0,
  features JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Creator Verification Status
CREATE TABLE public.creator_verification_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  is_verified_creator BOOLEAN DEFAULT false,
  total_followers INTEGER DEFAULT 0,
  views_last_30_days INTEGER DEFAULT 0,
  original_content_count INTEGER DEFAULT 0,
  total_content_count INTEGER DEFAULT 0,
  verification_date TIMESTAMP WITH TIME ZONE,
  last_checked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Currency Exchange Rates
CREATE TABLE public.currency_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Curated Itineraries Cache
CREATE TABLE public.curated_itineraries_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cache_key TEXT NOT NULL,
  itineraries JSONB NOT NULL,
  preferences_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, cache_key)
);

-- Direct Messages Conversations
CREATE TABLE public.dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL,
  participant_2 UUID NOT NULL,
  initiator_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

-- Direct Messages
CREATE TABLE public.dm_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  attachments JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Escrow Disputes
CREATE TABLE public.escrow_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  milestone_id UUID,
  filed_by UUID NOT NULL,
  dispute_type TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB,
  requested_resolution TEXT,
  status TEXT DEFAULT 'open',
  resolution TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Escrow Transactions
CREATE TABLE public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  payer_id UUID NOT NULL,
  payee_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  funded_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  release_condition TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Favorites
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);

-- Hashtags
CREATE TABLE public.hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT UNIQUE NOT NULL,
  use_count INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Itinerary Templates
CREATE TABLE public.itinerary_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  duration_days INTEGER,
  template_data JSONB NOT NULL,
  cover_image_url TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  monetization_type TEXT,
  coin_price INTEGER,
  commission_percentage NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Loyalty Points
CREATE TABLE public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Loyalty Points Balance
CREATE TABLE public.loyalty_points_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  current_balance INTEGER DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Marketplace Jobs
CREATE TABLE public.marketplace_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  booking_type TEXT NOT NULL,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  budget_min NUMERIC,
  budget_max NUMERIC,
  currency TEXT DEFAULT 'USD',
  travelers_adults INTEGER DEFAULT 1,
  travelers_children INTEGER DEFAULT 0,
  requirements JSONB,
  preferences JSONB,
  status TEXT DEFAULT 'open',
  expires_at TIMESTAMP WITH TIME ZONE,
  assigned_agent_id UUID,
  accepted_bid_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Marketplace Messages
CREATE TABLE public.marketplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Marketplace Invoices
CREATE TABLE public.marketplace_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  booking_id UUID,
  job_id UUID,
  payer_id UUID NOT NULL,
  payee_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft',
  line_items JSONB,
  notes TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_invoice_id TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Moderation Actions
CREATE TABLE public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL,
  moderator_id UUID,
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  details JSONB,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Moments (Stories)
CREATE TABLE public.moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  journey_id UUID,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image',
  thumbnail_url TEXT,
  caption TEXT,
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  duration_seconds INTEGER,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  interactive_elements JSONB,
  music_track JSONB,
  filters_applied JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Moment Likes
CREATE TABLE public.moment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(moment_id, user_id)
);

-- Moment Comments
CREATE TABLE public.moment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Moment Views
CREATE TABLE public.moment_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id UUID,
  view_duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Moment Interactions
CREATE TABLE public.moment_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- OAuth States
CREATE TABLE public.oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT UNIQUE NOT NULL,
  user_id UUID,
  provider TEXT NOT NULL,
  redirect_uri TEXT,
  code_verifier TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Package Bookings
CREATE TABLE public.package_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  departure_date DATE NOT NULL,
  total_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  participants INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  special_requests TEXT,
  emergency_contact JSONB,
  waiver_signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Package Marketing Materials
CREATE TABLE public.package_marketing_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  package_name TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  cover_image_url TEXT,
  images JSONB,
  highlights TEXT[],
  price_from NUMERIC,
  currency TEXT DEFAULT 'USD',
  allow_resale BOOLEAN DEFAULT false,
  resale_commission_percentage NUMERIC DEFAULT 10,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Package Resale Transactions
CREATE TABLE public.package_resale_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_package_id UUID NOT NULL,
  original_creator_id UUID NOT NULL,
  reseller_creator_id UUID NOT NULL,
  booking_id UUID,
  booking_amount NUMERIC NOT NULL,
  commission_percentage NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Packaged Trips (Ready to Book)
CREATE TABLE public.packaged_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID,
  agent_id UUID,
  creator_type TEXT DEFAULT 'agent',
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  images JSONB,
  highlights TEXT[],
  inclusions TEXT[],
  exclusions TEXT[],
  duration_days INTEGER NOT NULL,
  duration_nights INTEGER,
  price_per_person NUMERIC NOT NULL,
  original_price NUMERIC,
  currency TEXT DEFAULT 'USD',
  deposit_percentage NUMERIC DEFAULT 20,
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER,
  activity_level TEXT,
  trip_type TEXT,
  ideal_for TEXT[],
  languages TEXT[],
  departure_dates JSONB,
  airports JSONB,
  travel_requirements TEXT,
  cancellation_policy TEXT,
  terms_conditions TEXT,
  faq JSONB,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft',
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment Milestones
CREATE TABLE public.payment_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Post Collaborators
CREATE TABLE public.post_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  role TEXT DEFAULT 'collaborator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Post Comments
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Post Hashtags
CREATE TABLE public.post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  UNIQUE(post_id, hashtag_id)
);

-- Post Likes
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post Partnerships
CREATE TABLE public.post_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  terms JSONB,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Post Saved
CREATE TABLE public.post_saved (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  collection_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post Tagged Users
CREATE TABLE public.post_tagged_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  tagged_user_id UUID NOT NULL,
  x_position NUMERIC,
  y_position NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Promotion Analytics
CREATE TABLE public.promotion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend_cents INTEGER DEFAULT 0,
  revenue_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, date)
);

-- Promotion Campaigns
CREATE TABLE public.promotion_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL,
  target_audience JSONB,
  budget_cents INTEGER,
  spent_cents INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Promoted Vendor Subscriptions
CREATE TABLE public.promoted_vendor_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  subscription_tier TEXT NOT NULL,
  stripe_subscription_id TEXT,
  display_contexts TEXT[],
  priority_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Search Cache
CREATE TABLE public.search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  search_type TEXT NOT NULL,
  results JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Search History
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  search_type TEXT NOT NULL,
  query JSONB NOT NULL,
  results_count INTEGER,
  selected_result_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Storyboard Items
CREATE TABLE public.storyboard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyboard_id UUID NOT NULL REFERENCES public.storyboards(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  source_url TEXT,
  source_platform TEXT,
  metadata JSONB,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Storyboards
CREATE TABLE public.storyboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  destination TEXT,
  is_public BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'traveler',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Suppliers
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  name TEXT NOT NULL,
  supplier_type TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,
  regions TEXT[],
  services TEXT[],
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'pending',
  insurance_verified BOOLEAN DEFAULT false,
  license_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  commission_rate NUMERIC DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Supplier Reviews
CREATE TABLE public.supplier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  booking_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  response TEXT,
  response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Supplier Vetting
CREATE TABLE public.supplier_vetting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  background_check_status TEXT DEFAULT 'pending',
  license_check_status TEXT DEFAULT 'pending',
  insurance_check_status TEXT DEFAULT 'pending',
  reference_check_status TEXT DEFAULT 'pending',
  documents JSONB,
  notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Template Usage Transactions
CREATE TABLE public.template_usage_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.itinerary_templates(id),
  original_creator_id UUID NOT NULL,
  user_creator_id UUID NOT NULL,
  monetization_type TEXT,
  coins_paid INTEGER DEFAULT 0,
  commission_percentage NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tier Progress Metrics
CREATE TABLE public.tier_progress_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  current_followers INTEGER DEFAULT 0,
  current_posts INTEGER DEFAULT 0,
  current_engagement_rate NUMERIC DEFAULT 0,
  monthly_earnings NUMERIC DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tier Upgrade History
CREATE TABLE public.tier_upgrade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_tier TEXT,
  to_tier TEXT NOT NULL,
  upgrade_type TEXT DEFAULT 'automatic',
  reason TEXT,
  metrics_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TikTok Tokens
CREATE TABLE public.tiktok_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tiktok_username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Travel Posts
CREATE TABLE public.travel_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  caption TEXT,
  media_urls JSONB NOT NULL,
  media_type TEXT DEFAULT 'image',
  location_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  destination TEXT,
  trip_type TEXT,
  tags TEXT[],
  is_original_content BOOLEAN DEFAULT true,
  is_sponsored BOOLEAN DEFAULT false,
  sponsor_brand_id UUID,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  engagement_rate NUMERIC,
  is_featured BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Travel Preferences
CREATE TABLE public.travel_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  preferred_destinations TEXT[],
  travel_style TEXT[],
  budget_range TEXT,
  preferred_accommodation TEXT[],
  dietary_restrictions TEXT[],
  accessibility_needs TEXT[],
  travel_frequency TEXT,
  preferred_activities TEXT[],
  avoid_list TEXT[],
  passport_countries TEXT[],
  home_airport TEXT,
  preferred_airlines TEXT[],
  preferred_hotel_chains TEXT[],
  loyalty_programs JSONB,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Activities
CREATE TABLE public.trip_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.packaged_trips(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  description TEXT,
  is_included BOOLEAN DEFAULT true,
  price NUMERIC,
  currency TEXT DEFAULT 'USD',
  duration_hours NUMERIC,
  activity_type TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Addons
CREATE TABLE public.trip_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.packaged_trips(id) ON DELETE CASCADE,
  addon_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  max_quantity INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Bookings
CREATE TABLE public.trip_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID,
  trip_request_id UUID,
  proposal_id UUID,
  traveler_id UUID NOT NULL,
  agent_id UUID,
  creator_id UUID,
  booking_number TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  deposit_amount NUMERIC,
  deposit_paid_at TIMESTAMP WITH TIME ZONE,
  final_payment_due TIMESTAMP WITH TIME ZONE,
  final_paid_at TIMESTAMP WITH TIME ZONE,
  platform_commission NUMERIC,
  partner_payout NUMERIC,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  payment_url TEXT,
  payment_client_secret TEXT,
  travelers_count INTEGER DEFAULT 1,
  special_requests TEXT,
  emergency_contact JSONB,
  travel_dates JSONB,
  proposal_policies JSONB,
  metadata JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Contracts
CREATE TABLE public.trip_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID,
  proposal_id UUID,
  trip_request_id UUID,
  agent_id UUID,
  traveler_id UUID NOT NULL,
  creator_id UUID,
  contract_type TEXT DEFAULT 'standard',
  contract_version TEXT DEFAULT '1.0',
  contract_data JSONB NOT NULL,
  platform_terms_accepted BOOLEAN DEFAULT false,
  agent_signed_at TIMESTAMP WITH TIME ZONE,
  traveler_signed_at TIMESTAMP WITH TIME ZONE,
  creator_signed_at TIMESTAMP WITH TIME ZONE,
  agent_signature TEXT,
  traveler_signature TEXT,
  creator_signature TEXT,
  status TEXT DEFAULT 'draft',
  valid_until TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Itinerary Days
CREATE TABLE public.trip_itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.packaged_trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activities JSONB,
  meals_included TEXT[],
  accommodation TEXT,
  transportation TEXT,
  tips TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Members
CREATE TABLE public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Trip Proposals
CREATE TABLE public.trip_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL,
  proposer_role TEXT NOT NULL,
  headline TEXT,
  message TEXT NOT NULL,
  price_from NUMERIC,
  currency TEXT DEFAULT 'USD',
  nights INTEGER,
  itinerary JSONB,
  inclusions TEXT[],
  exclusions TEXT[],
  cancellation_policy TEXT,
  deposit_percentage NUMERIC,
  valid_until TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  viewed_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Request Assignments
CREATE TABLE public.trip_request_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  assignee_id UUID NOT NULL,
  assignee_role TEXT NOT NULL,
  assigned_by TEXT DEFAULT 'ai',
  match_score NUMERIC,
  match_reasons JSONB,
  status TEXT DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Request Matches
CREATE TABLE public.trip_request_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL,
  matched_role TEXT NOT NULL,
  match_score NUMERIC NOT NULL,
  match_reasons JSONB,
  is_auto_assigned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Requests
CREATE TABLE public.trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_city TEXT,
  start_date DATE,
  end_date DATE,
  flexible_dates BOOLEAN DEFAULT false,
  travelers_adults INTEGER DEFAULT 1,
  travelers_children INTEGER DEFAULT 0,
  budget_min NUMERIC,
  budget_max NUMERIC,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  trip_type TEXT,
  accommodation_preferences TEXT[],
  activity_preferences TEXT[],
  dietary_requirements TEXT[],
  accessibility_needs TEXT[],
  special_requests TEXT,
  status TEXT DEFAULT 'draft',
  source_storyboard_id UUID,
  source_metadata JSONB,
  collection_tags TEXT[],
  storyboard_tags TEXT[],
  matched_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Trip Stories
CREATE TABLE public.trip_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  journey_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  cover_image_url TEXT,
  media_urls JSONB,
  duration_days INTEGER,
  travel_dates JSONB,
  highlights TEXT[],
  tips TEXT[],
  cost_breakdown JSONB,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Coin Balance
CREATE TABLE public.user_coin_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  balance INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Conversations
CREATE TABLE public.user_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  job_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  customer_unread_count INTEGER DEFAULT 0,
  agent_unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Conversation Messages
CREATE TABLE public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.user_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Follows
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- User Verifications
CREATE TABLE public.user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  verification_type TEXT NOT NULL,
  document_urls JSONB,
  selfie_url TEXT,
  status TEXT DEFAULT 'pending',
  stripe_verification_session_id TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Visa Requests
CREATE TABLE public.visa_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination_country TEXT NOT NULL,
  visa_type TEXT NOT NULL,
  travel_date DATE,
  duration_days INTEGER,
  purpose TEXT,
  documents JSONB,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Webhook Events (for idempotency)
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_is_verified ON public.profiles(is_verified);

-- User roles indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Travel agents indexes
CREATE INDEX idx_travel_agents_user_id ON public.travel_agents(user_id);
CREATE INDEX idx_travel_agents_is_verified ON public.travel_agents(is_verified);
CREATE INDEX idx_travel_agents_is_active ON public.travel_agents(is_active);
CREATE INDEX idx_travel_agents_rating ON public.travel_agents(rating DESC);

-- Agent applications indexes
CREATE INDEX idx_agent_applications_status ON public.agent_applications(status);
CREATE INDEX idx_agent_applications_email ON public.agent_applications(email);
CREATE INDEX idx_agent_applications_stripe_session ON public.agent_applications(stripe_verification_session_id);

-- Brand applications indexes
CREATE INDEX idx_brand_applications_admin_status ON public.brand_applications(admin_status);
CREATE INDEX idx_brand_applications_stripe_session ON public.brand_applications(stripe_verification_session_id);

-- Bookings indexes
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_agent_id ON public.bookings(agent_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at DESC);

-- Marketplace jobs indexes
CREATE INDEX idx_marketplace_jobs_user_id ON public.marketplace_jobs(user_id);
CREATE INDEX idx_marketplace_jobs_status ON public.marketplace_jobs(status);
CREATE INDEX idx_marketplace_jobs_destination ON public.marketplace_jobs(destination);
CREATE INDEX idx_marketplace_jobs_created_at ON public.marketplace_jobs(created_at DESC);

-- Trip requests indexes
CREATE INDEX idx_trip_requests_user_id ON public.trip_requests(user_id);
CREATE INDEX idx_trip_requests_status ON public.trip_requests(status);
CREATE INDEX idx_trip_requests_destination ON public.trip_requests(destination);
CREATE INDEX idx_trip_requests_created_at ON public.trip_requests(created_at DESC);

-- Trip proposals indexes
CREATE INDEX idx_trip_proposals_trip_request_id ON public.trip_proposals(trip_request_id);
CREATE INDEX idx_trip_proposals_proposer_id ON public.trip_proposals(proposer_id);
CREATE INDEX idx_trip_proposals_status ON public.trip_proposals(status);

-- Trip bookings indexes
CREATE INDEX idx_trip_bookings_traveler_id ON public.trip_bookings(traveler_id);
CREATE INDEX idx_trip_bookings_agent_id ON public.trip_bookings(agent_id);
CREATE INDEX idx_trip_bookings_status ON public.trip_bookings(status);

-- Packaged trips indexes
CREATE INDEX idx_packaged_trips_creator_id ON public.packaged_trips(creator_id);
CREATE INDEX idx_packaged_trips_agent_id ON public.packaged_trips(agent_id);
CREATE INDEX idx_packaged_trips_slug ON public.packaged_trips(slug);
CREATE INDEX idx_packaged_trips_status ON public.packaged_trips(status);
CREATE INDEX idx_packaged_trips_is_featured ON public.packaged_trips(is_featured);

-- Moments indexes
CREATE INDEX idx_moments_user_id ON public.moments(user_id);
CREATE INDEX idx_moments_journey_id ON public.moments(journey_id);
CREATE INDEX idx_moments_created_at ON public.moments(created_at DESC);
CREATE INDEX idx_moments_keyset ON public.moments(created_at DESC, id DESC);

-- Travel posts indexes
CREATE INDEX idx_travel_posts_user_id ON public.travel_posts(user_id);
CREATE INDEX idx_travel_posts_created_at ON public.travel_posts(created_at DESC);
CREATE INDEX idx_travel_posts_is_featured ON public.travel_posts(is_featured);

-- DM conversations indexes
CREATE INDEX idx_dm_conversations_participant_1 ON public.dm_conversations(participant_1);
CREATE INDEX idx_dm_conversations_participant_2 ON public.dm_conversations(participant_2);
CREATE INDEX idx_dm_conversations_last_message ON public.dm_conversations(last_message_at DESC);

-- DM messages indexes
CREATE INDEX idx_dm_messages_conversation_id ON public.dm_messages(conversation_id);
CREATE INDEX idx_dm_messages_created_at ON public.dm_messages(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Storyboards indexes
CREATE INDEX idx_storyboards_user_id ON public.storyboards(user_id);
CREATE INDEX idx_storyboards_is_public ON public.storyboards(is_public);

-- User follows indexes
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);

-- Creator profiles indexes
CREATE INDEX idx_creator_profiles_user_id ON public.creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_is_verified ON public.creator_profiles(is_verified);
CREATE INDEX idx_creator_profiles_is_featured ON public.creator_profiles(is_featured);

-- Brand profiles indexes
CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);
CREATE INDEX idx_brand_profiles_is_verified ON public.brand_profiles(is_verified);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_item ON public.favorites(item_id, item_type);

-- Search history indexes
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.search_history(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Handle new user (create profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    first_name,
    last_name,
    phone,
    account_type,
    sms_notifications,
    is_profile_complete,
    onboarding_completed
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'traveler'),
    COALESCE((NEW.raw_user_meta_data->>'sms_notifications')::boolean, false),
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Handle new user subscription
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, tier)
  VALUES (NEW.id, 'free'::subscription_tier)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Check if user has role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Get user tier
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id UUID)
RETURNS subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.user_subscriptions WHERE user_id = _user_id),
    'free'::subscription_tier
  );
$$;

-- Assign agent role on travel_agents insert
CREATE OR REPLACE FUNCTION public.assign_agent_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'agent')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update post like count
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.travel_posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.travel_posts 
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Update post comment count
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.travel_posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.travel_posts 
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Update agent rating
CREATE OR REPLACE FUNCTION public.update_agent_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.travel_agents
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM public.agent_reviews
      WHERE agent_id = NEW.agent_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.agent_reviews
      WHERE agent_id = NEW.agent_id
    )
  WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$;

-- Update supplier rating
CREATE OR REPLACE FUNCTION public.update_supplier_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Calculate bid pricing
CREATE OR REPLACE FUNCTION public.calculate_bid_pricing(
  agent_price NUMERIC,
  service_fee_pct NUMERIC DEFAULT 3.0,
  success_fee_pct NUMERIC DEFAULT 15.0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_price NUMERIC;
  service_fee NUMERIC;
  success_fee NUMERIC;
  agent_payout NUMERIC;
BEGIN
  customer_price := agent_price * (1 + service_fee_pct / 100);
  service_fee := agent_price * (service_fee_pct / 100);
  success_fee := agent_price * (success_fee_pct / 100);
  agent_payout := agent_price - success_fee;
  
  RETURN jsonb_build_object(
    'customer_facing_price', customer_price,
    'service_fee', service_fee,
    'success_fee', success_fee,
    'agent_payout', agent_payout
  );
END;
$$;

-- Generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.marketplace_invoices;
  
  invoice_num := 'INV-' || LPAD(next_number::TEXT, 5, '0');
  RETURN invoice_num;
END;
$$;

-- Expire old marketplace jobs
CREATE OR REPLACE FUNCTION public.expire_old_marketplace_jobs()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.marketplace_jobs
  SET status = 'expired'
  WHERE status = 'open'
    AND expires_at < NOW();
END;
$$;

-- Cleanup expired cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.search_cache
  WHERE expires_at < NOW();
END;
$$;

-- Cleanup expired itinerary cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_itinerary_cache()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.curated_itineraries_cache
  WHERE expires_at < NOW();
END;
$$;

-- Cleanup expired OAuth states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.oauth_states
  WHERE expires_at < now();
END;
$$;

-- Calculate creator tier progress
CREATE OR REPLACE FUNCTION public.calculate_creator_tier_progress(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_followers INTEGER;
  v_posts INTEGER;
  v_engagement_rate NUMERIC;
  v_monthly_earnings NUMERIC;
  v_bookings INTEGER;
  v_avg_rating NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_followers
  FROM public.user_follows
  WHERE following_id = p_user_id;
  
  SELECT COUNT(*) INTO v_posts
  FROM public.travel_posts
  WHERE user_id = p_user_id;
  
  SELECT 
    CASE 
      WHEN v_followers > 0 AND v_posts > 0 THEN
        ((SUM(like_count + comment_count)::NUMERIC / v_posts) / v_followers * 100)
      ELSE 0
    END INTO v_engagement_rate
  FROM public.travel_posts
  WHERE user_id = p_user_id;
  
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_earnings
  FROM public.creator_earnings
  WHERE user_id = p_user_id
    AND created_at >= now() - INTERVAL '30 days'
    AND status = 'completed';
  
  SELECT COUNT(*) INTO v_bookings
  FROM public.package_bookings pb
  JOIN public.package_marketing_materials pmm ON pb.package_id = pmm.id
  WHERE pmm.creator_id = p_user_id;
  
  SELECT AVG(rating) INTO v_avg_rating
  FROM public.agent_reviews
  WHERE agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = p_user_id
  );
  
  INSERT INTO public.tier_progress_metrics (
    user_id, current_followers, current_posts, current_engagement_rate,
    monthly_earnings, total_bookings, average_rating, last_calculated_at
  ) VALUES (
    p_user_id, v_followers, v_posts, COALESCE(v_engagement_rate, 0),
    v_monthly_earnings, v_bookings, COALESCE(v_avg_rating, 0), now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_followers = EXCLUDED.current_followers,
    current_posts = EXCLUDED.current_posts,
    current_engagement_rate = EXCLUDED.current_engagement_rate,
    monthly_earnings = EXCLUDED.monthly_earnings,
    total_bookings = EXCLUDED.total_bookings,
    average_rating = EXCLUDED.average_rating,
    last_calculated_at = now(),
    updated_at = now();
  
  RETURN jsonb_build_object(
    'followers', v_followers,
    'posts', v_posts,
    'engagement_rate', COALESCE(v_engagement_rate, 0),
    'monthly_earnings', v_monthly_earnings,
    'bookings', v_bookings,
    'average_rating', COALESCE(v_avg_rating, 0)
  );
END;
$$;

-- Get total users count
CREATE OR REPLACE FUNCTION public.get_total_users_count()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*) FROM auth.users;
$$;

-- Mark conversation messages as read
CREATE OR REPLACE FUNCTION public.mark_conversation_messages_read(
  p_conversation_id UUID,
  p_user_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.conversation_messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND sender_type != p_user_type
    AND is_read = false;
    
  IF p_user_type = 'customer' THEN
    UPDATE public.user_conversations
    SET customer_unread_count = 0
    WHERE id = p_conversation_id;
  ELSE
    UPDATE public.user_conversations
    SET agent_unread_count = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$;

-- Convert currency
CREATE OR REPLACE FUNCTION public.convert_currency(
  amount NUMERIC,
  from_curr TEXT,
  to_curr TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  rate NUMERIC;
  converted_amount NUMERIC;
BEGIN
  IF from_curr = to_curr THEN
    RETURN amount;
  END IF;
  
  SELECT r.rate INTO rate
  FROM public.currency_exchange_rates r
  WHERE r.from_currency = from_curr 
    AND r.to_currency = to_curr
  ORDER BY r.effective_date DESC
  LIMIT 1;
  
  IF rate IS NULL THEN
    RETURN NULL;
  END IF;
  
  converted_amount := amount * rate;
  RETURN ROUND(converted_amount, 2);
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Create profile on new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Create subscription on new user
CREATE TRIGGER on_auth_user_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Trigger: Update timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_travel_agents_updated_at
  BEFORE UPDATE ON public.travel_agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_marketplace_jobs_updated_at
  BEFORE UPDATE ON public.marketplace_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_trip_requests_updated_at
  BEFORE UPDATE ON public.trip_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_trip_proposals_updated_at
  BEFORE UPDATE ON public.trip_proposals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_storyboards_updated_at
  BEFORE UPDATE ON public.storyboards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Assign agent role
CREATE TRIGGER on_travel_agent_created
  AFTER INSERT ON public.travel_agents
  FOR EACH ROW EXECUTE FUNCTION public.assign_agent_role();

-- Trigger: Update post like count
CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_like_count();

-- Trigger: Update post comment count
CREATE TRIGGER on_post_comment_change
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comment_count();

-- Trigger: Update agent rating
CREATE TRIGGER on_agent_review_created
  AFTER INSERT ON public.agent_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_agent_rating();

-- Trigger: Update supplier rating
CREATE TRIGGER on_supplier_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.supplier_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_supplier_rating();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaged_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboard_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin());

-- User subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Travel agents policies
CREATE POLICY "Public agents are viewable"
  ON public.travel_agents FOR SELECT
  USING (is_active = true);

CREATE POLICY "Agents can update own record"
  ON public.travel_agents FOR UPDATE
  USING (auth.uid() = user_id);

-- Agent applications policies
CREATE POLICY "Users can view own application"
  ON public.agent_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application"
  ON public.agent_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all applications"
  ON public.agent_applications FOR SELECT
  USING (public.is_admin());

-- Brand applications policies
CREATE POLICY "Users can view own brand application"
  ON public.brand_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert brand application"
  ON public.brand_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all brand applications"
  ON public.brand_applications FOR SELECT
  USING (public.is_admin());

-- Bookings policies
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = agent_id OR auth.uid() = creator_id);

CREATE POLICY "Users can create own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Marketplace jobs policies
CREATE POLICY "Anyone can view open jobs"
  ON public.marketplace_jobs FOR SELECT
  USING (status = 'open');

CREATE POLICY "Users can view own jobs"
  ON public.marketplace_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
  ON public.marketplace_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON public.marketplace_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Trip requests policies
CREATE POLICY "Anyone can view open trip requests"
  ON public.trip_requests FOR SELECT
  USING (status = 'open');

CREATE POLICY "Users can view own trip requests"
  ON public.trip_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trip requests"
  ON public.trip_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trip requests"
  ON public.trip_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Trip proposals policies
CREATE POLICY "Users can view proposals for their requests"
  ON public.trip_proposals FOR SELECT
  USING (
    auth.uid() = proposer_id OR
    auth.uid() IN (SELECT user_id FROM public.trip_requests WHERE id = trip_request_id)
  );

CREATE POLICY "Agents/creators can create proposals"
  ON public.trip_proposals FOR INSERT
  WITH CHECK (auth.uid() = proposer_id);

-- Trip bookings policies
CREATE POLICY "Users can view own trip bookings"
  ON public.trip_bookings FOR SELECT
  USING (auth.uid() = traveler_id OR auth.uid() = agent_id OR auth.uid() = creator_id);

CREATE POLICY "Users can create trip bookings"
  ON public.trip_bookings FOR INSERT
  WITH CHECK (auth.uid() = traveler_id);

-- Packaged trips policies
CREATE POLICY "Anyone can view active packaged trips"
  ON public.packaged_trips FOR SELECT
  USING (is_active = true AND status = 'published');

CREATE POLICY "Creators can manage own trips"
  ON public.packaged_trips FOR ALL
  USING (auth.uid() = creator_id OR auth.uid() = agent_id);

-- Moments policies
CREATE POLICY "Anyone can view public moments"
  ON public.moments FOR SELECT
  USING (true);

CREATE POLICY "Users can create own moments"
  ON public.moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moments"
  ON public.moments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moments"
  ON public.moments FOR DELETE
  USING (auth.uid() = user_id);

-- Travel posts policies
CREATE POLICY "Anyone can view public posts"
  ON public.travel_posts FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view own posts"
  ON public.travel_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own posts"
  ON public.travel_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.travel_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.travel_posts FOR DELETE
  USING (auth.uid() = user_id);

-- DM conversations policies
CREATE POLICY "Users can view own conversations"
  ON public.dm_conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
  ON public.dm_conversations FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

-- DM messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.dm_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.dm_conversations
      WHERE participant_1 = auth.uid() OR participant_2 = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON public.dm_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Storyboards policies
CREATE POLICY "Users can view own storyboards"
  ON public.storyboards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public storyboards"
  ON public.storyboards FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create own storyboards"
  ON public.storyboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own storyboards"
  ON public.storyboards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own storyboards"
  ON public.storyboards FOR DELETE
  USING (auth.uid() = user_id);

-- Storyboard items policies
CREATE POLICY "Users can manage items in own storyboards"
  ON public.storyboard_items FOR ALL
  USING (
    storyboard_id IN (
      SELECT id FROM public.storyboards WHERE user_id = auth.uid()
    )
  );

-- Favorites policies
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "Anyone can view follows"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON public.user_follows FOR ALL
  USING (auth.uid() = follower_id);

-- Creator profiles policies
CREATE POLICY "Anyone can view active creator profiles"
  ON public.creator_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage own creator profile"
  ON public.creator_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Brand profiles policies
CREATE POLICY "Anyone can view active brand profiles"
  ON public.brand_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage own brand profile"
  ON public.brand_profiles FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Note: Run these in Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trip-assets', 'trip-assets', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- ============================================
-- END OF SCHEMA EXPORT
-- ============================================
