-- Add missing FK for agent_verification_requests to travel_agents
ALTER TABLE agent_verification_requests
ADD CONSTRAINT agent_verification_requests_agent_id_fkey
FOREIGN KEY (agent_id) REFERENCES travel_agents(user_id) ON DELETE CASCADE;

-- Add trip_request_id to trip_proposals table
ALTER TABLE trip_proposals
ADD COLUMN IF NOT EXISTS trip_request_id uuid REFERENCES trip_requests(id) ON DELETE CASCADE;

-- Update payout_status enum to include 'released' and 'on_hold'
ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'released';
ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'on_hold';

-- Create trip_bookings_ops_view for operations dashboard
CREATE OR REPLACE VIEW trip_bookings_ops_view AS
SELECT 
  b.*,
  tr.title as trip_title,
  tr.destination,
  p_traveler.email as traveler_email,
  p_partner.email as partner_email
FROM trip_bookings b
LEFT JOIN trip_requests tr ON b.trip_request_id = tr.id
LEFT JOIN profiles p_traveler ON b.traveler_id = p_traveler.id
LEFT JOIN profiles p_partner ON b.partner_id = p_partner.id;

-- Create platform_analytics view
CREATE OR REPLACE VIEW platform_analytics AS
SELECT
  COUNT(DISTINCT p.id) FILTER (WHERE p.account_type = 'traveler') as total_travelers,
  COUNT(DISTINCT p.id) FILTER (WHERE p.account_type = 'creator') as total_creators,
  COUNT(DISTINCT p.id) FILTER (WHERE p.account_type = 'agent') as total_agents,
  COUNT(DISTINCT tr.id) as total_trip_requests,
  COUNT(DISTINCT tp.id) as total_proposals,
  COUNT(DISTINCT b.id) as total_bookings,
  COALESCE(SUM(b.total_price), 0) as total_booking_value
FROM profiles p
CROSS JOIN trip_requests tr
CROSS JOIN trip_proposals tp
CROSS JOIN trip_bookings b;