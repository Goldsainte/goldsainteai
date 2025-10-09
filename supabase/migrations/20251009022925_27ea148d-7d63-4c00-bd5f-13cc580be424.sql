-- Add last_active_at to travel_agents for transparency
ALTER TABLE public.travel_agents 
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_travel_agents_last_active ON public.travel_agents(last_active_at DESC);

-- Create trip photos table for user-generated content
CREATE TABLE IF NOT EXISTS public.trip_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.travel_agents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  location TEXT,
  taken_at TIMESTAMP WITH TIME ZONE,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.trip_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upload their own trip photos"
ON public.trip_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own trip photos"
ON public.trip_photos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Approved photos are publicly viewable"
ON public.trip_photos FOR SELECT
USING (is_approved = true);

CREATE POLICY "Admins can manage all trip photos"
ON public.trip_photos FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trip reports table
CREATE TABLE IF NOT EXISTS public.trip_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.travel_agents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  trip_date DATE NOT NULL,
  report_content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  would_recommend BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.trip_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own trip reports"
ON public.trip_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own trip reports"
ON public.trip_reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Approved reports are publicly viewable"
ON public.trip_reports FOR SELECT
USING (is_approved = true);

CREATE POLICY "Admins can manage all trip reports"
ON public.trip_reports FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create video testimonials table
CREATE TABLE IF NOT EXISTS public.trip_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.travel_agents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.trip_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upload their own trip videos"
ON public.trip_videos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own trip videos"
ON public.trip_videos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Approved videos are publicly viewable"
ON public.trip_videos FOR SELECT
USING (is_approved = true);

CREATE POLICY "Admins can manage all trip videos"
ON public.trip_videos FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at
CREATE TRIGGER update_trip_photos_updated_at
  BEFORE UPDATE ON public.trip_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_reports_updated_at
  BEFORE UPDATE ON public.trip_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_videos_updated_at
  BEFORE UPDATE ON public.trip_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();