-- Drop existing view and recreate to query from brand_profiles table
DROP VIEW IF EXISTS brand_profiles_discovery;

CREATE VIEW brand_profiles_discovery AS
SELECT 
  bp.id AS profile_id,
  bp.owner_user_id AS user_id,
  bp.brand_name AS name,
  bp.logo_url AS avatar_url,
  bp.cover_image_url,
  bp.bio,
  bp.brand_type,
  bp.style_tags AS categories,
  bp.regions,
  bp.cities AS tags,
  bp.average_rating AS supplier_rating,
  bp.review_count AS supplier_reviews,
  bp.brand_type AS supplier_type,
  bp.status,
  bp.is_featured,
  bp.created_at
FROM brand_profiles bp
WHERE bp.status = 'active';