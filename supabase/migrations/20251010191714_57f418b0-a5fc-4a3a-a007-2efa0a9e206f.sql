-- Add status and additional fields to agent_packages
ALTER TABLE public.agent_packages 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS trip_type TEXT,
ADD COLUMN IF NOT EXISTS min_group_size INTEGER,
ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS base_price_per_person NUMERIC,
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC,
ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS payment_plan_type TEXT DEFAULT 'deposit_final',
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
ADD COLUMN IF NOT EXISTS refund_policy TEXT,
ADD COLUMN IF NOT EXISTS booking_deadline_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS booking_approval_type TEXT DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS min_signups_to_confirm INTEGER,
ADD COLUMN IF NOT EXISTS why_this_trip TEXT,
ADD COLUMN IF NOT EXISTS agent_notes TEXT,
ADD COLUMN IF NOT EXISTS ideal_for TEXT,
ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS travel_requirements TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS waiver_text TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS creator_video_url TEXT,
ADD COLUMN IF NOT EXISTS hashtags TEXT[],
ADD COLUMN IF NOT EXISTS upgrade_options JSONB DEFAULT '[]'::jsonb;

-- Create package_itinerary table for day-by-day itinerary
CREATE TABLE IF NOT EXISTS public.package_itinerary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.agent_packages(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activities JSONB DEFAULT '[]'::jsonb,
  meals_included TEXT[],
  accommodation TEXT,
  is_featured_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create package_payment_milestones table
CREATE TABLE IF NOT EXISTS public.package_payment_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.agent_packages(id) ON DELETE CASCADE,
  milestone_number INTEGER NOT NULL,
  milestone_name TEXT NOT NULL,
  amount_percentage NUMERIC NOT NULL,
  due_days_before_trip INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create package_collaborators table
CREATE TABLE IF NOT EXISTS public.package_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.agent_packages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL, -- 'creator' or 'agent'
  commission_percentage NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited', -- 'invited', 'accepted', 'declined'
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(package_id, user_id)
);

-- Create package_media_gallery table
CREATE TABLE IF NOT EXISTS public.package_media_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.agent_packages(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL, -- 'image' or 'video'
  media_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_package_itinerary_package ON public.package_itinerary(package_id);
CREATE INDEX IF NOT EXISTS idx_package_payment_milestones_package ON public.package_payment_milestones(package_id);
CREATE INDEX IF NOT EXISTS idx_package_collaborators_package ON public.package_collaborators(package_id);
CREATE INDEX IF NOT EXISTS idx_package_collaborators_user ON public.package_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_package_media_gallery_package ON public.package_media_gallery(package_id);

-- Enable RLS
ALTER TABLE public.package_itinerary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_media_gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies for package_itinerary
CREATE POLICY "Anyone can view itinerary for active packages"
ON public.package_itinerary FOR SELECT
USING (package_id IN (SELECT id FROM public.agent_packages WHERE is_active = true));

CREATE POLICY "Package collaborators can manage itinerary"
ON public.package_itinerary FOR ALL
USING (
  package_id IN (
    SELECT package_id FROM public.package_collaborators 
    WHERE user_id = auth.uid() AND status = 'accepted'
  )
);

-- RLS Policies for package_payment_milestones
CREATE POLICY "Anyone can view payment milestones for active packages"
ON public.package_payment_milestones FOR SELECT
USING (package_id IN (SELECT id FROM public.agent_packages WHERE is_active = true));

CREATE POLICY "Package collaborators can manage payment milestones"
ON public.package_payment_milestones FOR ALL
USING (
  package_id IN (
    SELECT package_id FROM public.package_collaborators 
    WHERE user_id = auth.uid() AND status = 'accepted'
  )
);

-- RLS Policies for package_collaborators
CREATE POLICY "Collaborators can view their collaborations"
ON public.package_collaborators FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Package owners can manage collaborators"
ON public.package_collaborators FOR ALL
USING (
  package_id IN (
    SELECT id FROM public.agent_packages 
    WHERE agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for package_media_gallery
CREATE POLICY "Anyone can view media for active packages"
ON public.package_media_gallery FOR SELECT
USING (package_id IN (SELECT id FROM public.agent_packages WHERE is_active = true));

CREATE POLICY "Package collaborators can manage media"
ON public.package_media_gallery FOR ALL
USING (
  package_id IN (
    SELECT package_id FROM public.package_collaborators 
    WHERE user_id = auth.uid() AND status = 'accepted'
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_package_itinerary_updated_at
BEFORE UPDATE ON public.package_itinerary
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_payment_milestones_updated_at
BEFORE UPDATE ON public.package_payment_milestones
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_collaborators_updated_at
BEFORE UPDATE ON public.package_collaborators
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_media_gallery_updated_at
BEFORE UPDATE ON public.package_media_gallery
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();