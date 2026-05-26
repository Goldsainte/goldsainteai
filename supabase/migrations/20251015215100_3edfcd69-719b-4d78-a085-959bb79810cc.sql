-- Insert 7 diverse test travel agents linked to verified existing users
-- Wrapped in exception handler: seed user IDs may not exist in all environments
DO $$
BEGIN
INSERT INTO public.travel_agents (
  user_id,
  agency_name,
  bio,
  specializations,
  destinations,
  languages,
  experience_years,
  rating,
  total_reviews,
  commission_rate,
  is_active,
  is_verified,
  accepted_terms,
  accepted_privacy
) VALUES
  -- Agent 1: European Flight Specialist
  (
    'e5adf2cb-7705-4588-b62c-a586160d0194',
    'SkyEurope Premium Travel',
    'Specialized in European business and premium flight arrangements with 12 years experience.',
    ARRAY['flights', 'business_travel', 'premium'],
    ARRAY['Europe', 'UK', 'France', 'Germany', 'Italy'],
    ARRAY['English', 'French', 'German'],
    12,
    4.8,
    156,
    12.0,
    true,
    true,
    true,
    true
  ),
  -- Agent 2: Asia Cruise & Tour Expert
  (
    'd78710d1-04ff-4096-9211-3e2af2c28e0a',
    'Oriental Voyages & Tours',
    'Expert in Asian cruises, cultural tours, and luxury packages across Japan, Thailand, and Singapore.',
    ARRAY['cruises', 'tours', 'packages', 'luxury'],
    ARRAY['Asia', 'Japan', 'Thailand', 'Singapore', 'China'],
    ARRAY['English', 'Japanese', 'Mandarin'],
    8,
    4.9,
    203,
    15.0,
    true,
    true,
    true,
    true
  ),
  -- Agent 3: Caribbean All-Inclusive Specialist
  (
    '3c3dafd8-ae24-435d-a2ee-5029dcca946c',
    'Caribbean Dreams Resort Planners',
    'All-inclusive Caribbean resort specialist with expertise in Mexico, Jamaica, and Bahamas.',
    ARRAY['hotels', 'all_inclusive', 'packages', 'beach'],
    ARRAY['Caribbean', 'Mexico', 'Jamaica', 'Bahamas', 'Aruba'],
    ARRAY['English', 'Spanish'],
    6,
    4.7,
    142,
    10.0,
    true,
    true,
    true,
    true
  ),
  -- Agent 4: Luxury Safari & Adventure
  (
    'cf6d1042-94c1-4c1d-a455-8c537cf206ae',
    'Wild Horizons Safari Co',
    'Luxury safari and adventure specialist for Africa with perfect 5.0 rating.',
    ARRAY['tours', 'activities', 'luxury', 'safari', 'adventure'],
    ARRAY['Africa', 'Kenya', 'Tanzania', 'South Africa', 'Botswana'],
    ARRAY['English', 'Swahili'],
    10,
    5.0,
    89,
    18.0,
    true,
    true,
    true,
    true
  ),
  -- Agent 5: Budget-Friendly European Tours
  (
    '4d89c81a-ccb1-432b-af2f-9413b478384c',
    'EuroBudget Adventures',
    'Budget-friendly European tours for students and families.',
    ARRAY['tours', 'packages', 'budget', 'groups'],
    ARRAY['Europe', 'Spain', 'Portugal', 'Italy', 'Greece'],
    ARRAY['English', 'Spanish', 'Italian'],
    4,
    4.5,
    98,
    8.0,
    true,
    true,
    true,
    true
  ),
  -- Agent 6: Domestic US Flight & Hotel
  (
    '1cf40a00-135e-4781-9f9c-f6dd7094aa85',
    'USA TravelPro',
    'Domestic US travel specialist for flights, hotels, and car rentals.',
    ARRAY['flights', 'hotels', 'car_rentals', 'domestic'],
    ARRAY['USA', 'New York', 'California', 'Florida', 'Texas'],
    ARRAY['English'],
    7,
    4.6,
    178,
    10.0,
    true,
    true,
    true,
    true
  ),
  -- Agent 7: Multi-Destination Group Travel
  (
    '54fda0d6-ce29-4532-8b94-e57a4db65ddd',
    'Global Group Getaways',
    'Multi-destination group travel coordinator with 15 years experience worldwide.',
    ARRAY['groups', 'packages', 'tours', 'multi_destination'],
    ARRAY['Global', 'Europe', 'Asia', 'Americas', 'Australia'],
    ARRAY['English', 'Spanish', 'French'],
    15,
    4.9,
    234,
    14.0,
    true,
    true,
    true,
    true
  )
ON CONFLICT (user_id) DO NOTHING;
EXCEPTION
  WHEN foreign_key_violation THEN
    -- Seed user IDs don't exist in this environment, skip silently
    NULL;
END $$;