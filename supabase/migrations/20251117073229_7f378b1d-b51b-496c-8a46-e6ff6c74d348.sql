-- RLS + Column-Level Security for Public Profile Viewing

-- Enable RLS on profiles (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create public read-only policy for profiles
DROP POLICY IF EXISTS "Public can view profiles read-only" ON profiles;
CREATE POLICY "Public can view profiles read-only"
ON profiles
FOR SELECT
USING (true);

-- Revoke all existing privileges on profiles from anon and authenticated
REVOKE ALL ON TABLE profiles FROM anon;
REVOKE ALL ON TABLE profiles FROM authenticated;

-- Grant SELECT on only safe public fields
GRANT SELECT (
  id,
  full_name,
  avatar_url,
  bio,
  location,
  tiktok_handle,
  instagram_handle,
  creator_niches,
  creator_avg_views,
  creator_followers,
  featured_photos,
  agent_verification_status,
  agent_agency_name,
  agent_license_number,
  agent_license_authority,
  agent_years_experience,
  agent_specialties,
  account_type
) ON profiles TO anon, authenticated;