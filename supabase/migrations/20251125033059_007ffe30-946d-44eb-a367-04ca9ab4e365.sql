-- ============================================================================
-- CLEANUP: Drop existing objects
-- ============================================================================

-- Drop existing indexes
DROP INDEX IF EXISTS idx_travel_agents_user_id;
DROP INDEX IF EXISTS idx_travel_agents_status;
DROP INDEX IF EXISTS idx_travel_agents_rating;
DROP INDEX IF EXISTS idx_travel_agents_revenue;
DROP INDEX IF EXISTS idx_brand_profiles_owner;
DROP INDEX IF EXISTS idx_brand_profiles_status;
DROP INDEX IF EXISTS idx_brand_profiles_featured;

-- Drop existing tables (cascade to remove dependencies)
DROP TABLE IF EXISTS travel_agents CASCADE;
DROP TABLE IF EXISTS brand_profiles CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS trip_proposals CASCADE;
DROP TABLE IF EXISTS trip_requests CASCADE;
DROP TABLE IF EXISTS booking_milestones CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS platform_metrics CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP MATERIALIZED VIEW IF EXISTS agent_leaderboard CASCADE;

-- Drop and recreate enums
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payout_status CASCADE;
DROP TYPE IF EXISTS public.trip_booking_status CASCADE;

CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
  'refunded'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE payout_status AS ENUM (
  'not_eligible',
  'pending',
  'in_transit',
  'paid',
  'failed',
  'reversed'
);

CREATE TYPE public.trip_booking_status AS ENUM (
  'pending',
  'pending_payment',
  'deposit_pending',
  'payment_pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'disputed'
);

-- ============================================================================
-- TRAVEL AGENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS travel_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  
  agency_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  bio TEXT,
  website TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  disputed_bookings INTEGER DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,
  average_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  
  response_time_avg_minutes INTEGER,
  acceptance_rate DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  
  is_accepting_requests BOOLEAN DEFAULT true,
  max_concurrent_bookings INTEGER DEFAULT 5,
  current_booking_count INTEGER DEFAULT 0,
  
  stripe_connect_account_id TEXT UNIQUE,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  stripe_payouts_enabled BOOLEAN DEFAULT false,
  
  onboarded_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_travel_agents_user_id ON travel_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_agents_status ON travel_agents(status);
CREATE INDEX IF NOT EXISTS idx_travel_agents_rating ON travel_agents(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_travel_agents_revenue ON travel_agents(total_revenue_cents DESC);

ALTER TABLE travel_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own profile"
  ON travel_agents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Agents can update own profile"
  ON travel_agents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view active agents"
  ON travel_agents FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage all agents"
  ON travel_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_travel_agents_updated_at
  BEFORE UPDATE ON travel_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BRAND PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  
  brand_name TEXT NOT NULL,
  brand_type TEXT NOT NULL,
  tagline TEXT,
  bio TEXT,
  website TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
  is_featured BOOLEAN DEFAULT false,
  
  regions TEXT[] DEFAULT '{}',
  cities TEXT[] DEFAULT '{}',
  style_tags TEXT[] DEFAULT '{}',
  
  total_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  
  stripe_connect_account_id TEXT UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_profiles_owner ON brand_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_status ON brand_profiles(status);
CREATE INDEX IF NOT EXISTS idx_brand_profiles_featured ON brand_profiles(is_featured);

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand owners can view own profile"
  ON brand_profiles FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Brand owners can update own profile"
  ON brand_profiles FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Public can view active brands"
  ON brand_profiles FOR SELECT
  USING (status = 'active');

CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIP REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS trip_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  
  title TEXT,
  destination TEXT,
  description TEXT,
  
  start_date DATE,
  end_date DATE,
  flexible_dates BOOLEAN DEFAULT false,
  date_flexibility_days INTEGER,
  
  travelers_adults INTEGER DEFAULT 1 CHECK (travelers_adults >= 1),
  travelers_children INTEGER DEFAULT 0 CHECK (travelers_children >= 0),
  travelers_infants INTEGER DEFAULT 0 CHECK (travelers_infants >= 0),
  
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  budget_currency TEXT DEFAULT 'USD',
  budget_per_person BOOLEAN DEFAULT true,
  
  trip_style TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  accommodation_preferences TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  accessibility_needs TEXT[] DEFAULT '{}',
  
  inspiration_links TEXT[] DEFAULT '{}',
  tiktok_link TEXT,
  
  status TEXT DEFAULT 'open' CHECK (status IN (
    'draft', 'open', 'matched', 'booked', 'completed', 'cancelled'
  )),
  selected_proposal_id UUID,
  booked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_requests_user_id ON trip_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_requests_status ON trip_requests(status);
CREATE INDEX IF NOT EXISTS idx_trip_requests_destination ON trip_requests(destination);
CREATE INDEX IF NOT EXISTS idx_trip_requests_dates ON trip_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trip_requests_created_at ON trip_requests(created_at DESC);

ALTER TABLE trip_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Travelers can manage own requests"
  ON trip_requests FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents and creators can view open requests"
  ON trip_requests FOR SELECT
  USING (
    status IN ('open', 'matched')
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND account_type IN ('agent', 'creator')
    )
  );

CREATE TRIGGER update_trip_requests_updated_at
  BEFORE UPDATE ON trip_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIP PROPOSALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS trip_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES trip_requests ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  proposer_role TEXT NOT NULL CHECK (proposer_role IN ('agent', 'creator')),
  
  headline TEXT,
  message TEXT NOT NULL,
  itinerary_summary TEXT,
  
  price_from DECIMAL(10,2),
  price_currency TEXT DEFAULT 'USD',
  price_breakdown JSONB,
  
  is_collaborative BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES auth.users,
  agent_id UUID REFERENCES auth.users,
  creator_commission_pct DECIMAL(5,2),
  agent_commission_pct DECIMAL(5,2),
  
  status TEXT DEFAULT 'sent' CHECK (status IN (
    'draft', 'sent', 'viewed', 'accepted', 'declined', 'withdrawn', 'expired'
  )),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trip_proposals_trip_request ON trip_proposals(trip_request_id);
CREATE INDEX IF NOT EXISTS idx_trip_proposals_proposer ON trip_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_trip_proposals_status ON trip_proposals(status);
CREATE INDEX IF NOT EXISTS idx_trip_proposals_created_at ON trip_proposals(created_at DESC);

ALTER TABLE trip_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proposers can manage own proposals"
  ON trip_proposals FOR ALL
  USING (auth.uid() = proposer_id)
  WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "Travelers can view proposals on own requests"
  ON trip_proposals FOR SELECT
  USING (
    trip_request_id IN (
      SELECT id FROM trip_requests WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER update_trip_proposals_updated_at
  BEFORE UPDATE ON trip_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  
  traveler_id UUID NOT NULL REFERENCES auth.users,
  agent_id UUID REFERENCES auth.users,
  creator_id UUID REFERENCES auth.users,
  brand_id UUID REFERENCES auth.users,
  
  trip_request_id UUID REFERENCES trip_requests,
  trip_proposal_id UUID REFERENCES trip_proposals,
  
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  travelers_count INTEGER NOT NULL CHECK (travelers_count >= 1),
  
  total_price_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  platform_commission_pct DECIMAL(5,2) DEFAULT 15.00,
  agent_commission_pct DECIMAL(5,2),
  creator_commission_pct DECIMAL(5,2),
  brand_commission_pct DECIMAL(5,2),
  
  platform_fee_cents BIGINT,
  agent_payout_cents BIGINT,
  creator_payout_cents BIGINT,
  brand_payout_cents BIGINT,
  
  status booking_status DEFAULT 'pending',
  
  payment_status payment_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  
  milestone_payment_enabled BOOLEAN DEFAULT false,
  milestones JSONB DEFAULT '[]'::jsonb,
  escrow_held_cents BIGINT DEFAULT 0,
  escrow_released_cents BIGINT DEFAULT 0,
  
  payout_status payout_status DEFAULT 'not_eligible',
  payout_eligible_at TIMESTAMPTZ,
  payout_scheduled_at TIMESTAMPTZ,
  payout_completed_at TIMESTAMPTZ,
  
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users,
  cancelled_at TIMESTAMPTZ,
  refund_amount_cents BIGINT,
  refunded_at TIMESTAMPTZ,
  
  is_disputed BOOLEAN DEFAULT false,
  dispute_reason TEXT,
  dispute_opened_at TIMESTAMPTZ,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution TEXT,
  
  traveler_reviewed BOOLEAN DEFAULT false,
  agent_reviewed BOOLEAN DEFAULT false,
  creator_reviewed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_commission_total CHECK (
    (COALESCE(platform_commission_pct, 0) + 
     COALESCE(agent_commission_pct, 0) + 
     COALESCE(creator_commission_pct, 0) + 
     COALESCE(brand_commission_pct, 0)) <= 100
  )
);

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'GS-' || 
         TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := generate_booking_number();
    
    WHILE EXISTS (SELECT 1 FROM bookings WHERE booking_number = NEW.booking_number) LOOP
      NEW.booking_number := generate_booking_number();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number_trigger
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_number();

CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler ON bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent ON bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_creator ON bookings(creator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_brand ON bookings(brand_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payout_status ON bookings(payout_status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment ON bookings(stripe_payment_intent_id);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Travelers can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = traveler_id);

CREATE POLICY "Agents can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Creators can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Brands can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = brand_id);

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage bookings"
  ON bookings FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BOOKING MILESTONES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  due_date DATE,
  due_condition TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'funded', 'held_in_escrow', 'released', 'refunded'
  )),
  
  stripe_payment_intent_id TEXT,
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  released_to UUID REFERENCES auth.users,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_booking ON booking_milestones(booking_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON booking_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON booking_milestones(due_date);

ALTER TABLE booking_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking participants can view milestones"
  ON booking_milestones FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE traveler_id = auth.uid() 
         OR agent_id = auth.uid()
         OR creator_id = auth.uid()
         OR brand_id = auth.uid()
    )
  );

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings ON DELETE CASCADE,
  
  reviewer_id UUID NOT NULL REFERENCES auth.users,
  reviewee_id UUID NOT NULL REFERENCES auth.users,
  reviewee_type TEXT NOT NULL CHECK (reviewee_type IN ('agent', 'creator', 'brand', 'traveler')),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  experience_rating INTEGER CHECK (experience_rating >= 1 AND experience_rating <= 5),
  
  title TEXT,
  comment TEXT,
  
  photos TEXT[] DEFAULT '{}',
  
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'flagged', 'removed')),
  flagged_reason TEXT,
  
  response TEXT,
  responded_at TIMESTAMPTZ,
  
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(booking_id, reviewer_id, reviewee_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewers can manage own reviews"
  ON reviews FOR ALL
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewees can view reviews about them"
  ON reviews FOR SELECT
  USING (auth.uid() = reviewee_id);

CREATE POLICY "Public can view published reviews"
  ON reviews FOR SELECT
  USING (status = 'published' AND is_public = true);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  trip_request_id UUID REFERENCES trip_requests,
  booking_id UUID REFERENCES bookings,
  
  sender_id UUID NOT NULL REFERENCES auth.users,
  receiver_id UUID REFERENCES auth.users,
  
  body TEXT NOT NULL,
  
  attachments JSONB DEFAULT '[]'::jsonb,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  flagged_for_review BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  contains_sensitive_info BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_trip_request ON messages(trip_request_id);
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(flagged_for_review) WHERE flagged_for_review = true;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id OR
    trip_request_id IN (SELECT id FROM trip_requests WHERE user_id = auth.uid()) OR
    booking_id IN (
      SELECT id FROM bookings 
      WHERE traveler_id = auth.uid() 
         OR agent_id = auth.uid()
         OR creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN (
    'application_update',
    'new_trip_request',
    'new_proposal',
    'proposal_accepted',
    'proposal_declined',
    'booking_confirmed',
    'payment_received',
    'milestone_funded',
    'milestone_released',
    'payout_completed',
    'review_received',
    'message_received',
    'system_announcement'
  )),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  entity_type TEXT,
  entity_id UUID,
  
  action_url TEXT,
  action_label TEXT,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_sms BOOLEAN DEFAULT false,
  sent_via_push BOOLEAN DEFAULT false,
  
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PLATFORM METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  
  total_users INTEGER DEFAULT 0,
  new_users_today INTEGER DEFAULT 0,
  active_users_today INTEGER DEFAULT 0,
  
  pending_agent_applications INTEGER DEFAULT 0,
  pending_brand_applications INTEGER DEFAULT 0,
  approved_applications_today INTEGER DEFAULT 0,
  
  total_bookings INTEGER DEFAULT 0,
  new_bookings_today INTEGER DEFAULT 0,
  completed_bookings_today INTEGER DEFAULT 0,
  cancelled_bookings_today INTEGER DEFAULT 0,
  
  total_revenue_cents BIGINT DEFAULT 0,
  revenue_today_cents BIGINT DEFAULT 0,
  platform_fees_cents BIGINT DEFAULT 0,
  payouts_today_cents BIGINT DEFAULT 0,
  
  messages_sent_today INTEGER DEFAULT 0,
  proposals_sent_today INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(metric_date)
);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON platform_metrics(metric_date DESC);

-- ============================================================================
-- ACTIVITY LOGS TABLE
-- ============================================================================

DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  
  old_values JSONB,
  new_values JSONB,
  
  details JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_commission_split(
  _total_price_cents BIGINT,
  _platform_commission_pct DECIMAL,
  _agent_commission_pct DECIMAL,
  _creator_commission_pct DECIMAL,
  _brand_commission_pct DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB;
  platform_fee_cents BIGINT;
  agent_payout_cents BIGINT;
  creator_payout_cents BIGINT;
  brand_payout_cents BIGINT;
BEGIN
  platform_fee_cents := FLOOR(_total_price_cents * _platform_commission_pct / 100);
  agent_payout_cents := FLOOR(_total_price_cents * COALESCE(_agent_commission_pct, 0) / 100);
  creator_payout_cents := FLOOR(_total_price_cents * COALESCE(_creator_commission_pct, 0) / 100);
  brand_payout_cents := FLOOR(_total_price_cents * COALESCE(_brand_commission_pct, 0) / 100);
  
  result := jsonb_build_object(
    'platform_fee_cents', platform_fee_cents,
    'agent_payout_cents', agent_payout_cents,
    'creator_payout_cents', creator_payout_cents,
    'brand_payout_cents', brand_payout_cents,
    'total_commissions_cents', platform_fee_cents + agent_payout_cents + creator_payout_cents + brand_payout_cents
  );
  
  RETURN result;
END;
$$;

-- ============================================================================
-- MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW agent_leaderboard AS
SELECT 
  ta.id,
  ta.user_id,
  ta.agency_name,
  ta.total_bookings,
  ta.total_revenue_cents,
  ta.average_rating,
  ta.review_count,
  ta.completion_rate,
  p.avatar_url,
  p.full_name,
  RANK() OVER (ORDER BY ta.total_revenue_cents DESC) as revenue_rank,
  RANK() OVER (ORDER BY ta.average_rating DESC, ta.review_count DESC) as rating_rank
FROM travel_agents ta
JOIN profiles p ON ta.user_id = p.id
WHERE ta.status = 'active'
  AND ta.total_bookings > 0;

CREATE UNIQUE INDEX idx_agent_leaderboard_id ON agent_leaderboard(id);
