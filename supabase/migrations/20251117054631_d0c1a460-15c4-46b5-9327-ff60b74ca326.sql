-- Migration: Add get_creator_tiktok_lab_metrics RPC function
-- This function aggregates 30-day metrics for the TikTok Lab dashboard

CREATE OR REPLACE FUNCTION get_creator_tiktok_lab_metrics(creator_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  thirty_days_ago timestamp with time zone;
  proposals_count integer;
  bookings_count integer;
  earnings_sum numeric;
BEGIN
  thirty_days_ago := now() - interval '30 days';
  
  -- Count proposals sent by this creator in last 30 days
  SELECT COUNT(*)::integer INTO proposals_count
  FROM trip_proposals
  WHERE proposer_id = creator_id_input
    AND created_at >= thirty_days_ago;
  
  -- Count confirmed bookings where this creator is involved in last 30 days
  SELECT COUNT(*)::integer INTO bookings_count
  FROM trip_bookings
  WHERE (creator_id = creator_id_input OR agent_id = creator_id_input)
    AND status IN ('confirmed', 'active', 'completed')
    AND created_at >= thirty_days_ago;
  
  -- Sum estimated earnings from confirmed bookings
  -- This assumes there's a creator_share column in trip_bookings
  SELECT COALESCE(SUM(
    CASE 
      WHEN creator_id = creator_id_input THEN COALESCE(creator_share, 0)
      ELSE 0
    END
  ), 0) INTO earnings_sum
  FROM trip_bookings
  WHERE (creator_id = creator_id_input OR agent_id = creator_id_input)
    AND status IN ('confirmed', 'active', 'completed')
    AND created_at >= thirty_days_ago;
  
  -- Build metrics object
  result := jsonb_build_object(
    'storyboard_views_30d', 0,
    'trip_requests_from_storyboards_30d', 0,
    'proposals_sent_30d', COALESCE(proposals_count, 0),
    'bookings_confirmed_30d', COALESCE(bookings_count, 0),
    'estimated_earnings_30d', COALESCE(earnings_sum, 0),
    'currency', 'USD'
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_creator_tiktok_lab_metrics(uuid) TO authenticated;

COMMENT ON FUNCTION get_creator_tiktok_lab_metrics IS 'Aggregates 30-day metrics for creator TikTok Lab dashboard including proposals sent, bookings confirmed, and estimated earnings';