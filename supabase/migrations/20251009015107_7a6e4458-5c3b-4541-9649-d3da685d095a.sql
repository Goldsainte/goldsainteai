-- Create trip_itineraries table
CREATE TABLE IF NOT EXISTS public.trip_itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID REFERENCES public.marketplace_jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  cover_image_url TEXT,
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itinerary_items table
CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.trip_itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  item_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  location_coordinates JSONB,
  item_type TEXT NOT NULL,
  cost NUMERIC,
  currency TEXT DEFAULT 'USD',
  booking_reference TEXT,
  confirmation_number TEXT,
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create travel_documents table
CREATE TABLE IF NOT EXISTS public.travel_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.trip_itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  document_title TEXT NOT NULL,
  document_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_events table for agent calendar
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  color TEXT,
  related_job_id UUID REFERENCES public.marketplace_jobs(id) ON DELETE SET NULL,
  related_itinerary_id UUID REFERENCES public.trip_itineraries(id) ON DELETE SET NULL,
  is_all_day BOOLEAN DEFAULT false,
  reminder_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itinerary_shares table for companion sharing
CREATE TABLE IF NOT EXISTS public.itinerary_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.trip_itineraries(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_by_user_id UUID NOT NULL,
  permission_level TEXT NOT NULL DEFAULT 'view',
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_itineraries
CREATE POLICY "Users can view their own itineraries"
  ON public.trip_itineraries FOR SELECT
  USING (auth.uid() = user_id OR id IN (
    SELECT itinerary_id FROM public.itinerary_shares 
    WHERE shared_with_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can create their own itineraries"
  ON public.trip_itineraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
  ON public.trip_itineraries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries"
  ON public.trip_itineraries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for itinerary_items
CREATE POLICY "Users can view items of accessible itineraries"
  ON public.itinerary_items FOR SELECT
  USING (itinerary_id IN (
    SELECT id FROM public.trip_itineraries 
    WHERE user_id = auth.uid() OR id IN (
      SELECT itinerary_id FROM public.itinerary_shares 
      WHERE shared_with_email IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage items of their itineraries"
  ON public.itinerary_items FOR ALL
  USING (itinerary_id IN (
    SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()
  ));

-- RLS Policies for travel_documents
CREATE POLICY "Users can view documents of accessible itineraries"
  ON public.travel_documents FOR SELECT
  USING (itinerary_id IN (
    SELECT id FROM public.trip_itineraries 
    WHERE user_id = auth.uid() OR id IN (
      SELECT itinerary_id FROM public.itinerary_shares 
      WHERE shared_with_email IN (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can manage documents of their itineraries"
  ON public.travel_documents FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for calendar_events
CREATE POLICY "Agents can manage their own calendar events"
  ON public.calendar_events FOR ALL
  USING (agent_id IN (
    SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
  ));

-- RLS Policies for itinerary_shares
CREATE POLICY "Users can view shares of their itineraries"
  ON public.itinerary_shares FOR SELECT
  USING (itinerary_id IN (
    SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()
  ) OR shared_with_email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create shares for their itineraries"
  ON public.itinerary_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by_user_id AND itinerary_id IN (
    SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete shares of their itineraries"
  ON public.itinerary_shares FOR DELETE
  USING (itinerary_id IN (
    SELECT id FROM public.trip_itineraries WHERE user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itinerary_id ON public.itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day_number ON public.itinerary_items(day_number);
CREATE INDEX IF NOT EXISTS idx_travel_documents_itinerary_id ON public.travel_documents(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_agent_id ON public.calendar_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_datetime ON public.calendar_events(start_datetime);
CREATE INDEX IF NOT EXISTS idx_itinerary_shares_itinerary_id ON public.itinerary_shares(itinerary_id);

-- Create triggers for updated_at
CREATE TRIGGER update_trip_itineraries_updated_at
  BEFORE UPDATE ON public.trip_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itinerary_items_updated_at
  BEFORE UPDATE ON public.itinerary_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travel_documents_updated_at
  BEFORE UPDATE ON public.travel_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
