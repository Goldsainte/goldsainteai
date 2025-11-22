-- ============================================================================
-- GOLDSAINTE PLATFORM - TEST DATA SEED SCRIPT
-- ============================================================================
-- Purpose: Generate comprehensive test data for E2E testing including:
--   - 3 creators (Bronze, Gold, Platinum tiers)
--   - 2 certified agents
--   - 5 travel packages (fixed/flexible dates)
--   - 1 complex trip with 3 milestones
--   - 1 group trip with 4 travelers
--   - Test Stripe fixtures
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Test User Accounts
-- ============================================================================
-- Note: These users must be created through Supabase Auth UI or API first
-- Then run this script to populate profiles and roles

-- Test user IDs (replace with actual UUIDs after creating auth accounts)
-- You'll need to create these accounts through Supabase Auth:
--   traveler@test.com
--   creator-bronze@test.com
--   creator-gold@test.com
--   creator-platinum@test.com
--   agent1@test.com
--   agent2@test.com
--   admin@test.com

-- ============================================================================
-- STEP 2: Insert Profiles for Test Accounts
-- ============================================================================

-- Traveler Profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  avatar_url,
  account_type,
  onboarding_completed,
  welcome_shown,
  created_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'traveler@test.com',
    'Test Traveler',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=traveler',
    'traveler',
    true,
    true,
    NOW()
  );

-- Creator Profiles (Bronze, Gold, Platinum)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  avatar_url,
  bio,
  account_type,
  onboarding_completed,
  welcome_shown,
  created_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000002',
    'creator-bronze@test.com',
    'Bronze Creator',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=bronze',
    'Travel content creator - Bronze tier',
    'creator',
    true,
    true,
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'creator-gold@test.com',
    'Gold Creator',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=gold',
    'Experienced travel creator - Gold tier',
    'creator',
    true,
    true,
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'creator-platinum@test.com',
    'Platinum Creator',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=platinum',
    'Elite travel curator - Platinum tier',
    'creator',
    true,
    true,
    NOW()
  );

-- Agent Profiles
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  avatar_url,
  bio,
  account_type,
  onboarding_completed,
  welcome_shown,
  created_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000005',
    'agent1@test.com',
    'Sophie Laurent',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=agent1',
    'Certified Goldsainte Travel Agent - Europe specialist',
    'agent',
    true,
    true,
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'agent2@test.com',
    'Marcus Chen',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=agent2',
    'Certified Goldsainte Travel Agent - Asia specialist',
    'agent',
    true,
    true,
    NOW()
  );

-- Admin Profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  avatar_url,
  account_type,
  onboarding_completed,
  welcome_shown,
  created_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000007',
    'admin@test.com',
    'Platform Admin',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    -- Note: admin privileges come from user_roles; account_type
    -- is still one of the allowed values.
    'traveler',
    true,
    true,
    NOW()
  );

-- ============================================================================

-- ============================================================================
-- STEP 3: Assign User Roles
-- ============================================================================

-- Create app_role enum if not exists
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'agent', 'creator', 'traveler');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Insert roles
INSERT INTO user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'traveler'),
  ('00000000-0000-0000-0000-000000000002', 'creator'),
  ('00000000-0000-0000-0000-000000000003', 'creator'),
  ('00000000-0000-0000-0000-000000000004', 'creator'),
  ('00000000-0000-0000-0000-000000000005', 'agent'),
  ('00000000-0000-0000-0000-000000000006', 'agent'),
  ('00000000-0000-0000-0000-000000000007', 'admin');

-- ============================================================================
-- STEP 4: Set Creator Tiers
-- ============================================================================

-- Update creator profiles with tier information
UPDATE profiles SET 
  metadata = jsonb_build_object(
    'creator_tier', 'bronze',
    'commission_rate', 15,
    'total_bookings', 5,
    'total_revenue', 1200
  )
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE profiles SET 
  metadata = jsonb_build_object(
    'creator_tier', 'gold',
    'commission_rate', 30,
    'total_bookings', 25,
    'total_revenue', 8500
  )
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE profiles SET 
  metadata = jsonb_build_object(
    'creator_tier', 'platinum',
    'commission_rate', 40,
    'platinum_bonus', 20,
    'total_bookings', 100,
    'total_revenue', 45000
  )
WHERE id = '00000000-0000-0000-0000-000000000004';

-- ============================================================================
-- STEP 5: Create Travel Packages (5 packages: 3 fixed, 2 flexible)
-- ============================================================================

-- Package 1: Fixed dates - Tuscany Wine Country (Bronze Creator)
INSERT INTO travel_packages (id, creator_id, title, description, destination, duration_days, price, currency, availability_type, specific_dates_start, specific_dates_end, capacity, slots_remaining, includes, status, created_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002',
  'Tuscany Wine Country - 7 Days',
  'Experience the rolling hills of Tuscany with guided winery tours, cooking classes, and luxury villa accommodation.',
  'Tuscany, Italy',
  7,
  2400.00,
  'USD',
  'fixed',
  '2026-09-15',
  '2026-09-22',
  12,
  12,
  '["Luxury villa accommodation", "Daily breakfast", "3 winery tours", "Cooking class", "Private transfers"]',
  'published',
  NOW()
);

-- Package 2: Flexible dates - Bali Wellness Retreat (Gold Creator)
INSERT INTO travel_packages (id, creator_id, title, description, destination, duration_days, price, currency, availability_type, available_months, capacity, slots_remaining, includes, status, created_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000003',
  'Bali Wellness Retreat - 10 Days',
  'Reset your mind and body with daily yoga, spa treatments, healthy cuisine, and meditation in tropical paradise.',
  'Ubud, Bali',
  10,
  3200.00,
  'USD',
  'flexible',
  '["April", "May", "September", "October"]',
  8,
  8,
  '["Beachfront resort", "Daily yoga & meditation", "Spa treatments", "Healthy meals", "Cultural excursions"]',
  'published',
  NOW()
);

-- Package 3: Fixed dates - Iceland Northern Lights (Platinum Creator)
INSERT INTO travel_packages (id, creator_id, title, description, destination, duration_days, price, currency, availability_type, specific_dates_start, specific_dates_end, capacity, slots_remaining, includes, status, created_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000004',
  'Iceland Northern Lights Adventure - 6 Days',
  'Chase the Aurora Borealis across Iceland with expert guides, including glacier hikes, hot springs, and luxury lodges.',
  'Reykjavik, Iceland',
  6,
  4500.00,
  'USD',
  'fixed',
  '2026-11-10',
  '2026-11-16',
  6,
  6,
  '["Luxury lodge", "Northern lights tours", "Glacier hiking", "Blue Lagoon access", "All meals", "Photo guide"]',
  'published',
  NOW()
);

-- Package 4: Flexible dates - Moroccan Sahara Experience (Gold Creator)
INSERT INTO travel_packages (id, creator_id, title, description, destination, duration_days, price, currency, availability_type, available_months, capacity, slots_remaining, includes, status, created_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000003',
  'Moroccan Sahara Desert Experience - 8 Days',
  'Journey from Marrakech to the Sahara with camel treks, overnight in luxury desert camps, and explore ancient kasbahs.',
  'Marrakech & Sahara, Morocco',
  8,
  2800.00,
  'USD',
  'flexible',
  '["March", "April", "October", "November"]',
  10,
  10,
  '["Riad accommodation", "Luxury desert camp", "Camel trek", "4x4 desert tours", "All meals", "Local guides"]',
  'published',
  NOW()
);

-- Package 5: Fixed dates - Japan Cherry Blossom Tour (Platinum Creator)
INSERT INTO travel_packages (id, creator_id, title, description, destination, duration_days, price, currency, availability_type, specific_dates_start, specific_dates_end, capacity, slots_remaining, includes, status, created_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000004',
  'Japan Cherry Blossom Tour - 12 Days',
  'Experience Japan during peak cherry blossom season with stays in Tokyo, Kyoto, and Osaka, including tea ceremonies and temple visits.',
  'Tokyo, Kyoto, Osaka',
  12,
  5800.00,
  'USD',
  'fixed',
  '2026-03-28',
  '2026-04-08',
  15,
  15,
  '["Luxury hotels", "JR Pass", "Tea ceremony", "Temple visits", "Cherry blossom viewing", "Guided tours", "Some meals"]',
  'published',
  NOW()
);

-- ============================================================================
-- STEP 6: Create Complex Marketplace Trip with 3 Milestones
-- ============================================================================

-- Insert marketplace job
INSERT INTO marketplace_jobs (id, user_id, title, description, destination, travel_dates_start, travel_dates_end, budget_min, budget_max, currency, booking_type, status, created_at)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Luxury Paris Anniversary Trip',
  'Planning a 10-day anniversary celebration in Paris. Need luxury hotels, private tours, Michelin dining reservations, and day trips to Versailles and Champagne region. Budget is flexible for exceptional experiences.',
  'Paris, France',
  '2026-06-01',
  '2026-06-10',
  8000,
  12000,
  'USD',
  'package',
  'open',
  NOW()
);

-- Insert agent bid
INSERT INTO marketplace_bids (id, job_id, agent_id, proposed_price, currency, description, delivery_days, status, created_at)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000005',
  10500,
  'USD',
  'I specialize in luxury Paris experiences and have exclusive partnerships with top hotels and restaurants. I''ll create a custom itinerary with: 5-star hotel, private guided tours, confirmed Michelin reservations, day trips with private driver, and 24/7 concierge support.',
  45,
  'accepted',
  NOW()
);

-- Create 3 milestones
INSERT INTO marketplace_milestones (id, job_id, agent_id, title, description, amount, currency, sequence_order, status, created_at)
VALUES 
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 
   'Itinerary Planning & Restaurant Reservations', 
   'Complete custom itinerary with confirmed Michelin restaurant reservations for 3 dinners', 
   1500, 'USD', 1, 'funded', NOW()),
  
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 
   'Hotel & Flight Booking', 
   'Book 5-star hotel (9 nights), round-trip business class flights, and airport transfers', 
   7000, 'USD', 2, 'pending', NOW()),
  
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 
   'On-trip Concierge Support', 
   '24/7 support during trip, private driver for day trips, last-minute reservation changes', 
   2000, 'USD', 3, 'pending', NOW());

-- ============================================================================
-- STEP 7: Create Group Trip with 4 Travelers
-- ============================================================================

-- Insert group booking
INSERT INTO group_bookings (id, organizer_id, trip_name, destination, trip_start_date, trip_end_date, total_cost, currency, participant_count, status, created_at)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Friends Ski Trip to Aspen 2026',
  'Aspen, Colorado',
  '2026-02-14',
  '2026-02-21',
  4000.00,
  'USD',
  4,
  'pending',
  NOW()
);

-- Insert 4 participants (including organizer)
INSERT INTO group_participants (id, group_booking_id, user_id, email, amount_due, currency, payment_status, created_at)
VALUES 
  (gen_random_uuid(), '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'traveler@test.com', 1000.00, 'USD', 'paid', NOW()),
  (gen_random_uuid(), '40000000-0000-0000-0000-000000000001', NULL, 'friend1@test.com', 1000.00, 'USD', 'pending', NOW()),
  (gen_random_uuid(), '40000000-0000-0000-0000-000000000001', NULL, 'friend2@test.com', 1000.00, 'USD', 'pending', NOW()),
  (gen_random_uuid(), '40000000-0000-0000-0000-000000000001', NULL, 'friend3@test.com', 1000.00, 'USD', 'pending', NOW());

-- ============================================================================
-- STEP 8: Create User Travel Preferences (for AI preference learning)
-- ============================================================================

INSERT INTO user_travel_preferences (user_id, travel_style, budget_preferences, accommodation_preferences, activity_preferences, dietary_restrictions, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '{"preferred_style": "luxury", "pace": "relaxed", "group_size": "couple"}',
  '{"nightly_budget": 500, "total_trip_budget": 8000, "currency": "USD"}',
  '{"hotel_type": ["luxury_hotel", "boutique"], "star_rating": 5, "amenities": ["spa", "fine_dining", "concierge"]}',
  '{"interests": ["food_wine", "culture", "relaxation"], "activity_level": "moderate"}',
  '[]',
  NOW(),
  NOW()
);

-- ============================================================================
-- STEP 9: Create Test Activity Logs
-- ============================================================================

INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'marketplace_job_created', 'marketplace_job', '10000000-0000-0000-0000-000000000001', '{"destination": "Paris"}', NOW()),
  ('00000000-0000-0000-0000-000000000005', 'bid_placed', 'marketplace_bid', '20000000-0000-0000-0000-000000000001', '{"amount": 10500}', NOW()),
  ('00000000-0000-0000-0000-000000000001', 'bid_accepted', 'marketplace_bid', '20000000-0000-0000-0000-000000000001', '{}', NOW()),
  ('00000000-0000-0000-0000-000000000001', 'milestone_funded', 'milestone', '30000000-0000-0000-0000-000000000001', '{"amount": 1500}', NOW());

-- ============================================================================
-- STEP 10: Stripe Test Fixtures (Metadata for testing)
-- ============================================================================

-- Note: Actual Stripe operations must be done through Stripe test mode API
-- These are reference records for testing

-- Test cards to use in Stripe test mode:
-- Success: 4242 4242 4242 4242
-- Decline: 4000 0000 0000 0002
-- Require 3DS: 4000 0025 0000 3155
-- Expired: 4000 0000 0000 0069

-- ============================================================================
-- STEP 11: Create Webhook Event Records (for idempotency testing)
-- ============================================================================

-- Simulate webhook events that have been processed
INSERT INTO webhook_events (event_id, event_type, provider, payload, processing_status, processed_at, created_at)
VALUES 
  ('evt_test_001', 'payment_intent.succeeded', 'stripe', '{"id": "pi_test_001", "amount": 150000}', 'success', NOW(), NOW()),
  ('evt_test_002', 'charge.succeeded', 'stripe', '{"id": "ch_test_002", "amount": 150000}', 'success', NOW(), NOW());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify seed data was inserted correctly:

-- Check profiles
SELECT id, email, full_name FROM profiles;

-- Check user roles
SELECT ur.user_id, p.email, ur.role 
FROM user_roles ur 
JOIN profiles p ON ur.user_id = p.id;

-- Check travel packages
SELECT creator_id, title, destination, price, availability_type, status FROM travel_packages;

-- Check marketplace job with milestones
SELECT j.title, j.destination, j.status, COUNT(m.id) as milestone_count
FROM marketplace_jobs j
LEFT JOIN marketplace_milestones m ON j.id = m.job_id
WHERE j.id = '10000000-0000-0000-0000-000000000001'
GROUP BY j.id, j.title, j.destination, j.status;

-- Check group booking with participants
SELECT gb.trip_name, gb.participant_count, COUNT(gp.id) as actual_participants,
       SUM(CASE WHEN gp.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count
FROM group_bookings gb
LEFT JOIN group_participants gp ON gb.id = gp.group_booking_id
WHERE gb.id = '40000000-0000-0000-0000-000000000001'
GROUP BY gb.id, gb.trip_name, gb.participant_count;

-- Check user preferences
SELECT user_id, travel_style, budget_preferences FROM user_travel_preferences;

-- ============================================================================
-- CLEANUP (Run this to remove all test data)
-- ============================================================================

/*
-- WARNING: This will delete ALL test data. Use with caution!

DELETE FROM activity_logs WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE '%@test.com');
DELETE FROM webhook_events WHERE event_id LIKE 'evt_test_%';
DELETE FROM group_participants WHERE group_booking_id = '40000000-0000-0000-0000-000000000001';
DELETE FROM group_bookings WHERE id = '40000000-0000-0000-0000-000000000001';
DELETE FROM marketplace_milestones WHERE job_id = '10000000-0000-0000-0000-000000000001';
DELETE FROM marketplace_bids WHERE job_id = '10000000-0000-0000-0000-000000000001';
DELETE FROM marketplace_jobs WHERE id = '10000000-0000-0000-0000-000000000001';
DELETE FROM travel_packages WHERE creator_id IN (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004'
);
DELETE FROM user_travel_preferences WHERE user_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE '%@test.com');
DELETE FROM profiles WHERE email LIKE '%@test.com';
*/
