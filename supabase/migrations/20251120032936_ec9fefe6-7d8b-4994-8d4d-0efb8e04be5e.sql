-- Create trip_internal_notes table for internal team notes
CREATE TABLE IF NOT EXISTS public.trip_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_internal_notes_trip ON public.trip_internal_notes(trip_request_id, created_at DESC);

ALTER TABLE public.trip_internal_notes ENABLE ROW LEVEL SECURITY;

-- RLS: Only assignees can view/create notes
CREATE POLICY "Assignees can view internal notes"
ON public.trip_internal_notes FOR SELECT
USING (
  trip_request_id IN (
    SELECT trip_request_id FROM public.trip_request_assignments 
    WHERE assignee_profile_id = auth.uid()
  )
);

CREATE POLICY "Assignees can create internal notes"
ON public.trip_internal_notes FOR INSERT
WITH CHECK (
  author_user_id = auth.uid() AND
  trip_request_id IN (
    SELECT trip_request_id FROM public.trip_request_assignments 
    WHERE assignee_profile_id = auth.uid()
  )
);

-- Create trip_files table for itineraries and documents
CREATE TABLE IF NOT EXISTS public.trip_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_request_id UUID NOT NULL REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  uploader_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_files_trip ON public.trip_files(trip_request_id, created_at DESC);

ALTER TABLE public.trip_files ENABLE ROW LEVEL SECURITY;

-- RLS: Trip participants can view files
CREATE POLICY "Trip participants can view files"
ON public.trip_files FOR SELECT
USING (
  trip_request_id IN (
    SELECT id FROM public.trip_requests WHERE user_id = auth.uid()
  ) OR
  trip_request_id IN (
    SELECT trip_request_id FROM public.trip_request_assignments 
    WHERE assignee_profile_id = auth.uid()
  )
);

CREATE POLICY "Assignees can upload files"
ON public.trip_files FOR INSERT
WITH CHECK (
  uploader_user_id = auth.uid() AND
  trip_request_id IN (
    SELECT trip_request_id FROM public.trip_request_assignments 
    WHERE assignee_profile_id = auth.uid()
  )
);
