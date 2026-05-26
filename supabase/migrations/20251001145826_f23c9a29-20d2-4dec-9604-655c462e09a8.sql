-- Create travel agents table
CREATE TABLE IF NOT EXISTS public.travel_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name text NOT NULL,
  license_number text,
  specializations text[],
  languages text[],
  experience_years integer,
  rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0,
  bio text,
  profile_image_url text,
  commission_rate numeric(5,2) DEFAULT 10.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create marketplace jobs table (for complex bookings)
CREATE TABLE IF NOT EXISTS public.marketplace_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  booking_type text NOT NULL CHECK (booking_type IN ('hotel', 'flight', 'car', 'package', 'custom')),
  requirements jsonb NOT NULL,
  budget_min numeric,
  budget_max numeric,
  currency text NOT NULL DEFAULT 'USD',
  travel_dates jsonb,
  destination text,
  number_of_travelers integer,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_agent_id uuid REFERENCES public.travel_agents(id) ON DELETE SET NULL,
  winning_bid_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

-- Create bids table
CREATE TABLE IF NOT EXISTS public.agent_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  proposed_price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  proposal_details text NOT NULL,
  estimated_completion_days integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(job_id, agent_id)
);

-- Create agent-customer messages table
CREATE TABLE IF NOT EXISTS public.marketplace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create agent reviews table
CREATE TABLE IF NOT EXISTS public.agent_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id, agent_id)
);

-- Enable RLS on all marketplace tables
ALTER TABLE public.travel_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for travel_agents
CREATE POLICY "agents_public_view" ON public.travel_agents
FOR SELECT USING (is_active = true);

CREATE POLICY "agents_manage_own" ON public.travel_agents
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for marketplace_jobs
CREATE POLICY "jobs_users_view_own" ON public.marketplace_jobs
FOR SELECT USING (auth.uid() = user_id OR status = 'open');

CREATE POLICY "jobs_users_create_own" ON public.marketplace_jobs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_users_update_own" ON public.marketplace_jobs
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "jobs_agents_view_open" ON public.marketplace_jobs
FOR SELECT USING (
  status = 'open' OR 
  assigned_agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
);

-- RLS Policies for agent_bids
CREATE POLICY "bids_view_own" ON public.agent_bids
FOR SELECT USING (
  agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid()) OR
  job_id IN (SELECT id FROM public.marketplace_jobs WHERE user_id = auth.uid())
);

CREATE POLICY "bids_agents_create" ON public.agent_bids
FOR INSERT WITH CHECK (
  agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
);

CREATE POLICY "bids_agents_update_own" ON public.agent_bids
FOR UPDATE USING (
  agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
);

-- RLS Policies for marketplace_messages
CREATE POLICY "messages_view_own" ON public.marketplace_messages
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_send" ON public.marketplace_messages
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for agent_reviews
CREATE POLICY "reviews_public_view" ON public.agent_reviews
FOR SELECT USING (true);

CREATE POLICY "reviews_create_own" ON public.agent_reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_user_id ON public.marketplace_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_status ON public.marketplace_jobs(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_jobs_assigned_agent ON public.marketplace_jobs(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_bids_job_id ON public.agent_bids(job_id);
CREATE INDEX IF NOT EXISTS idx_agent_bids_agent_id ON public.agent_bids(agent_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_messages_job_id ON public.marketplace_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent_id ON public.agent_reviews(agent_id);

-- Add triggers for updated_at
CREATE TRIGGER update_travel_agents_updated_at
BEFORE UPDATE ON public.travel_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_jobs_updated_at
BEFORE UPDATE ON public.marketplace_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_bids_updated_at
BEFORE UPDATE ON public.agent_bids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update agent rating when reviews are added
CREATE OR REPLACE FUNCTION update_agent_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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

CREATE TRIGGER update_agent_rating_on_review
AFTER INSERT ON public.agent_reviews
FOR EACH ROW
EXECUTE FUNCTION update_agent_rating();
