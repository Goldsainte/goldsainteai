-- Brand discovery view for marketplace
create or replace view public.brand_profiles_discovery as
select
  p.id as profile_id,
  p.id as user_id,
  coalesce(p.full_name, p.username) as name,
  p.avatar_url,
  p.bio,
  p.creator_niches as categories,
  p.destinations_focus_tags as regions,
  p.content_style_tags as tags,
  p.country,
  p.account_type,
  s.supplier_type,
  s.name as supplier_name,
  s.is_verified as supplier_verified,
  s.rating as supplier_rating,
  s.total_reviews as supplier_reviews,
  now() as created_at
from public.profiles p
left join public.suppliers s on s.id = p.id
left join public.user_roles ur on ur.user_id = p.id
where
  ur.role = 'brand'
  or s.id is not null;