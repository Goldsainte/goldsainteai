-- Add all 83+ missing fields to agent_applications table
-- Organized by sections for comprehensive agent vetting

-- SECTION 1: Professional Certifications & Memberships
ALTER TABLE agent_applications 
ADD COLUMN IF NOT EXISTS asta_verified_travel_advisor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS asta_membership_number TEXT,
ADD COLUMN IF NOT EXISTS travel_institute_cta BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS travel_institute_ctc BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS clia_certification_level TEXT,
ADD COLUMN IF NOT EXISTS iatan_id_number TEXT,
ADD COLUMN IF NOT EXISTS host_agency_name TEXT,
ADD COLUMN IF NOT EXISTS host_agency_affiliation TEXT,
ADD COLUMN IF NOT EXISTS years_with_host_agency INTEGER;

-- SECTION 2: Business Structure & Compliance
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS dba_names TEXT,
ADD COLUMN IF NOT EXISTS business_ein_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS operating_states TEXT[],
ADD COLUMN IF NOT EXISTS seller_of_travel_states TEXT[],
ADD COLUMN IF NOT EXISTS florida_registration_number TEXT,
ADD COLUMN IF NOT EXISTS california_registration_number TEXT,
ADD COLUMN IF NOT EXISTS hawaii_registration_number TEXT,
ADD COLUMN IF NOT EXISTS washington_registration_number TEXT,
ADD COLUMN IF NOT EXISTS surety_bond_amount DECIMAL,
ADD COLUMN IF NOT EXISTS surety_bond_provider TEXT,
ADD COLUMN IF NOT EXISTS surety_bond_expiration DATE,
ADD COLUMN IF NOT EXISTS background_check_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_date DATE,
ADD COLUMN IF NOT EXISTS criminal_history_disclosure TEXT;

-- SECTION 3: Client Focus & Sales Metrics
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS client_demographics TEXT[],
ADD COLUMN IF NOT EXISTS average_client_age_range TEXT,
ADD COLUMN IF NOT EXISTS percentage_repeat_clients INTEGER,
ADD COLUMN IF NOT EXISTS percentage_referral_business INTEGER,
ADD COLUMN IF NOT EXISTS annual_sales_volume TEXT,
ADD COLUMN IF NOT EXISTS number_of_active_clients INTEGER,
ADD COLUMN IF NOT EXISTS booking_volume_last_12_months INTEGER,
ADD COLUMN IF NOT EXISTS average_commission_percentage DECIMAL,
ADD COLUMN IF NOT EXISTS preferred_booking_platforms TEXT[],
ADD COLUMN IF NOT EXISTS gds_access TEXT[],
ADD COLUMN IF NOT EXISTS preferred_suppliers TEXT[],
ADD COLUMN IF NOT EXISTS consortium_memberships TEXT[];

-- SECTION 4: Social Media & Online Presence
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS facebook_page_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_profile_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_handle TEXT,
ADD COLUMN IF NOT EXISTS youtube_channel_url TEXT,
ADD COLUMN IF NOT EXISTS blog_url TEXT,
ADD COLUMN IF NOT EXISTS google_business_profile TEXT,
ADD COLUMN IF NOT EXISTS online_reviews_count INTEGER,
ADD COLUMN IF NOT EXISTS average_review_rating DECIMAL,
ADD COLUMN IF NOT EXISTS social_media_followers_total INTEGER;

-- SECTION 5: Technology & Tools
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS crm_software TEXT,
ADD COLUMN IF NOT EXISTS booking_platform TEXT,
ADD COLUMN IF NOT EXISTS accounting_software TEXT,
ADD COLUMN IF NOT EXISTS website_platform TEXT,
ADD COLUMN IF NOT EXISTS has_own_booking_engine BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comfortable_with_technology INTEGER,
ADD COLUMN IF NOT EXISTS video_conferencing_tools TEXT[],
ADD COLUMN IF NOT EXISTS ai_tools_experience TEXT[];

-- SECTION 6: Language Skills
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[],
ADD COLUMN IF NOT EXISTS language_proficiency_levels JSONB;

-- SECTION 7: Travel Experience & Expertise
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS countries_visited_count INTEGER,
ADD COLUMN IF NOT EXISTS continents_visited TEXT[],
ADD COLUMN IF NOT EXISTS fam_trips_taken_last_year INTEGER,
ADD COLUMN IF NOT EXISTS destination_expert_certifications TEXT[],
ADD COLUMN IF NOT EXISTS cruise_experience_level TEXT,
ADD COLUMN IF NOT EXISTS all_inclusive_experience TEXT,
ADD COLUMN IF NOT EXISTS tour_operator_experience TEXT,
ADD COLUMN IF NOT EXISTS accessibility_travel_experience BOOLEAN,
ADD COLUMN IF NOT EXISTS multigenerational_travel_experience BOOLEAN,
ADD COLUMN IF NOT EXISTS solo_travel_booking_experience BOOLEAN;

-- SECTION 8: Emergency & Crisis Management
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS travel_crisis_management_training BOOLEAN,
ADD COLUMN IF NOT EXISTS support_24_7 BOOLEAN,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS after_hours_availability TEXT,
ADD COLUMN IF NOT EXISTS crisis_response_examples TEXT,
ADD COLUMN IF NOT EXISTS travel_insurance_licensed BOOLEAN;

-- SECTION 9: Marketing & Content Creation
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS content_creation_experience BOOLEAN,
ADD COLUMN IF NOT EXISTS video_content_creation BOOLEAN,
ADD COLUMN IF NOT EXISTS email_marketing_platform TEXT,
ADD COLUMN IF NOT EXISTS email_list_size INTEGER,
ADD COLUMN IF NOT EXISTS monthly_content_output TEXT,
ADD COLUMN IF NOT EXISTS influencer_partnerships BOOLEAN,
ADD COLUMN IF NOT EXISTS marketing_budget_annual TEXT,
ADD COLUMN IF NOT EXISTS lead_sources TEXT[],
ADD COLUMN IF NOT EXISTS advertising_channels TEXT[];

-- SECTION 10: Legal & Compliance
ALTER TABLE agent_applications
ADD COLUMN IF NOT EXISTS privacy_policy_url TEXT,
ADD COLUMN IF NOT EXISTS terms_and_conditions_url TEXT,
ADD COLUMN IF NOT EXISTS gdpr_compliant BOOLEAN,
ADD COLUMN IF NOT EXISTS ccpa_compliant BOOLEAN,
ADD COLUMN IF NOT EXISTS client_data_protection_measures TEXT,
ADD COLUMN IF NOT EXISTS contracts_with_clients BOOLEAN,
ADD COLUMN IF NOT EXISTS legal_counsel_on_retainer BOOLEAN,
ADD COLUMN IF NOT EXISTS previous_legal_issues TEXT,
ADD COLUMN IF NOT EXISTS regulatory_violations TEXT;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_host_agency ON agent_applications(host_agency_name);
CREATE INDEX IF NOT EXISTS idx_content_creator ON agent_applications(content_creation_experience, video_content_creation);
CREATE INDEX IF NOT EXISTS idx_background_check ON agent_applications(background_check_consent, background_check_completed);
CREATE INDEX IF NOT EXISTS idx_social_media ON agent_applications(instagram_handle, tiktok_handle);
CREATE INDEX IF NOT EXISTS idx_gds_access ON agent_applications USING GIN(gds_access);