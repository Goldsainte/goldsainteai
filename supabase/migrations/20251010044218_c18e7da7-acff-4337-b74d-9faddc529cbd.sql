-- Close Friends table
CREATE TABLE IF NOT EXISTS public.close_friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_user_id)
);

-- User presence/activity status table
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stories table (if doesn't exist)
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER DEFAULT 0
);

-- Story interactions (polls, questions, etc)
CREATE TABLE IF NOT EXISTS public.story_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  interaction_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Story interaction responses
CREATE TABLE IF NOT EXISTS public.story_interaction_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID NOT NULL REFERENCES public.story_interactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(interaction_id, user_id)
);

-- Story views
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_interaction_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for close_friends
CREATE POLICY "Users can manage their own close friends list"
  ON public.close_friends
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view if they're in someone's close friends"
  ON public.close_friends
  FOR SELECT
  USING (auth.uid() = friend_user_id);

-- RLS Policies for user_presence
CREATE POLICY "Anyone can view user presence"
  ON public.user_presence
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own presence"
  ON public.user_presence
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for stories
CREATE POLICY "Users can create their own stories"
  ON public.stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public stories"
  ON public.stories
  FOR SELECT
  USING (
    visibility = 'public' 
    OR user_id = auth.uid()
    OR (visibility = 'close_friends' AND user_id IN (
      SELECT user_id FROM public.close_friends WHERE friend_user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update their own stories"
  ON public.stories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON public.stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for story_interactions
CREATE POLICY "Users can create interactions on their stories"
  ON public.story_interactions
  FOR INSERT
  WITH CHECK (story_id IN (SELECT id FROM public.stories WHERE user_id = auth.uid()));

CREATE POLICY "Users can view interactions on visible stories"
  ON public.story_interactions
  FOR SELECT
  USING (story_id IN (
    SELECT id FROM public.stories 
    WHERE visibility = 'public' 
      OR user_id = auth.uid()
      OR (visibility = 'close_friends' AND user_id IN (
        SELECT user_id FROM public.close_friends WHERE friend_user_id = auth.uid()
      ))
  ));

-- RLS Policies for story_interaction_responses
CREATE POLICY "Users can respond to interactions"
  ON public.story_interaction_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own responses"
  ON public.story_interaction_responses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Story owners can view all responses"
  ON public.story_interaction_responses
  FOR SELECT
  USING (
    interaction_id IN (
      SELECT si.id FROM public.story_interactions si
      JOIN public.stories s ON s.id = si.story_id
      WHERE s.user_id = auth.uid()
    )
  );

-- RLS Policies for story_views
CREATE POLICY "Users can create their own views"
  ON public.story_views
  FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Story owners can view who viewed their stories"
  ON public.story_views
  FOR SELECT
  USING (story_id IN (SELECT id FROM public.stories WHERE user_id = auth.uid()));

-- Trigger for user_presence updated_at
CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();