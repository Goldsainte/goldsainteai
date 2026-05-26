-- Create group_trips table
CREATE TABLE IF NOT EXISTS public.group_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  budget_per_person DECIMAL(10,2),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'voting', 'finalized', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip_members table
CREATE TABLE IF NOT EXISTS public.trip_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.group_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Create trip_suggestions table
CREATE TABLE IF NOT EXISTS public.trip_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.group_trips(id) ON DELETE CASCADE,
  suggested_by UUID NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('hotel', 'activity', 'restaurant', 'flight')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  price DECIMAL(10,2),
  suggestion_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip_votes table
CREATE TABLE IF NOT EXISTS public.trip_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID NOT NULL REFERENCES public.trip_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote', 'neutral')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(suggestion_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_trips
CREATE POLICY "Users can view trips they are members of"
  ON public.group_trips FOR SELECT
  USING (
    auth.uid() = creator_id OR 
    EXISTS (
      SELECT 1 FROM public.trip_members 
      WHERE trip_id = group_trips.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trips"
  ON public.group_trips FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Trip creators can update their trips"
  ON public.group_trips FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Trip creators can delete their trips"
  ON public.group_trips FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS Policies for trip_members
CREATE POLICY "Users can view members of trips they belong to"
  ON public.trip_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_trips 
      WHERE id = trip_members.trip_id 
      AND (creator_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.trip_members tm 
        WHERE tm.trip_id = group_trips.id 
        AND tm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Trip creators can add members"
  ON public.trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_trips 
      WHERE id = trip_id 
      AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own membership"
  ON public.trip_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Trip creators can remove members"
  ON public.trip_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_trips 
      WHERE id = trip_id 
      AND creator_id = auth.uid()
    )
  );

-- RLS Policies for trip_suggestions
CREATE POLICY "Trip members can view suggestions"
  ON public.trip_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members 
      WHERE trip_id = trip_suggestions.trip_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can add suggestions"
  ON public.trip_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_members 
      WHERE trip_id = trip_suggestions.trip_id 
      AND user_id = auth.uid()
      AND status = 'accepted'
    )
  );

CREATE POLICY "Suggestion creators can update their suggestions"
  ON public.trip_suggestions FOR UPDATE
  USING (suggested_by = auth.uid());

CREATE POLICY "Suggestion creators can delete their suggestions"
  ON public.trip_suggestions FOR DELETE
  USING (suggested_by = auth.uid());

-- RLS Policies for trip_votes
CREATE POLICY "Trip members can view votes"
  ON public.trip_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_suggestions ts
      JOIN public.trip_members tm ON ts.trip_id = tm.trip_id
      WHERE ts.id = trip_votes.suggestion_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip members can cast votes"
  ON public.trip_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_suggestions ts
      JOIN public.trip_members tm ON ts.trip_id = tm.trip_id
      WHERE ts.id = suggestion_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'accepted'
    )
  );

CREATE POLICY "Users can update their own votes"
  ON public.trip_votes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes"
  ON public.trip_votes FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON public.trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON public.trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_suggestions_trip_id ON public.trip_suggestions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_votes_suggestion_id ON public.trip_votes(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_trip_votes_user_id ON public.trip_votes(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_group_trips_updated_at
  BEFORE UPDATE ON public.group_trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_votes_updated_at
  BEFORE UPDATE ON public.trip_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
