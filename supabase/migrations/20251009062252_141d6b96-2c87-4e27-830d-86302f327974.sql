-- Direct Messaging Tables
CREATE TABLE IF NOT EXISTS public.user_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.marketplace_jobs(id) ON DELETE SET NULL,
  customer_unread_count INTEGER DEFAULT 0,
  agent_unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked'))
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.user_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Hashtags Tables
CREATE TABLE IF NOT EXISTS public.hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT UNIQUE NOT NULL,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_conversations_customer ON public.user_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_agent ON public.user_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_user_conversations_job ON public.user_conversations(job_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender ON public.conversation_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON public.post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON public.post_hashtags(hashtag_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;

-- RLS Policies for user_conversations
ALTER TABLE public.user_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON public.user_conversations FOR SELECT
  USING (
    auth.uid() = customer_id 
    OR auth.uid() IN (SELECT user_id FROM public.travel_agents WHERE id = agent_id)
  );

CREATE POLICY "Users can create conversations"
  ON public.user_conversations FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id 
    OR auth.uid() IN (SELECT user_id FROM public.travel_agents WHERE id = agent_id)
  );

CREATE POLICY "Users can update their own conversations"
  ON public.user_conversations FOR UPDATE
  USING (
    auth.uid() = customer_id 
    OR auth.uid() IN (SELECT user_id FROM public.travel_agents WHERE id = agent_id)
  );

-- RLS Policies for conversation_messages
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON public.conversation_messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.user_conversations 
      WHERE customer_id = auth.uid() 
      OR agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.conversation_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id 
    AND conversation_id IN (
      SELECT id FROM public.user_conversations 
      WHERE customer_id = auth.uid() 
      OR agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.conversation_messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- RLS Policies for hashtags (public read)
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hashtags"
  ON public.hashtags FOR SELECT
  USING (true);

-- RLS Policies for post_hashtags (public read)
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post hashtags"
  ON public.post_hashtags FOR SELECT
  USING (true);

CREATE POLICY "Users can manage hashtags for their posts"
  ON public.post_hashtags FOR ALL
  USING (
    post_id IN (SELECT id FROM public.travel_posts WHERE user_id = auth.uid())
  );

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_conversation_messages_read(
  p_conversation_id UUID,
  p_user_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversation_messages
  SET is_read = true
  WHERE conversation_id = p_conversation_id
    AND sender_type != p_user_type
    AND is_read = false;
    
  IF p_user_type = 'customer' THEN
    UPDATE public.user_conversations
    SET customer_unread_count = 0
    WHERE id = p_conversation_id;
  ELSE
    UPDATE public.user_conversations
    SET agent_unread_count = 0
    WHERE id = p_conversation_id;
  END IF;
END;
$$;

-- Function to extract and upsert hashtags
CREATE OR REPLACE FUNCTION public.extract_and_store_hashtags(
  p_post_id UUID,
  p_caption TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tag TEXT;
  v_hashtag_id UUID;
  v_tags TEXT[];
BEGIN
  -- Extract hashtags using regex
  v_tags := regexp_matches(p_caption, '#(\w+)', 'g');
  
  -- Delete existing hashtags for this post
  DELETE FROM public.post_hashtags WHERE post_id = p_post_id;
  
  -- Process each hashtag
  FOREACH v_tag IN ARRAY v_tags
  LOOP
    v_tag := lower(v_tag);
    
    -- Upsert hashtag
    INSERT INTO public.hashtags (tag, use_count, last_used_at)
    VALUES (v_tag, 1, now())
    ON CONFLICT (tag) 
    DO UPDATE SET 
      use_count = public.hashtags.use_count + 1,
      last_used_at = now()
    RETURNING id INTO v_hashtag_id;
    
    -- Link hashtag to post
    INSERT INTO public.post_hashtags (post_id, hashtag_id)
    VALUES (p_post_id, v_hashtag_id);
  END LOOP;
END;
$$;
