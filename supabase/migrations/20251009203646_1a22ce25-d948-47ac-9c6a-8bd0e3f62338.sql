-- Add conversation types and status to user_conversations table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_conversations') THEN
    CREATE TABLE IF NOT EXISTS public.user_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      agent_id UUID REFERENCES public.travel_agents(id) ON DELETE CASCADE,
      job_id UUID REFERENCES public.marketplace_jobs(id) ON DELETE SET NULL,
      conversation_type TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      last_message_at TIMESTAMP WITH TIME ZONE,
      last_message_preview TEXT,
      customer_unread_count INTEGER DEFAULT 0,
      agent_unread_count INTEGER DEFAULT 0,
      metadata JSONB DEFAULT '{}'::jsonb,
      CONSTRAINT valid_conversation_type CHECK (conversation_type IN ('primary', 'general', 'channel', 'request')),
      CONSTRAINT valid_status CHECK (status IN ('active', 'pending', 'accepted', 'rejected', 'archived'))
    );

    -- Enable RLS
    ALTER TABLE public.user_conversations ENABLE ROW LEVEL SECURITY;

    -- Customers can view their conversations
    CREATE POLICY "Customers can view their conversations"
      ON public.user_conversations
      FOR SELECT
      USING (auth.uid() = customer_id);

    -- Agents can view their conversations
    CREATE POLICY "Agents can view their conversations"
      ON public.user_conversations
      FOR SELECT
      USING (agent_id IN (
        SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
      ));

    -- Customers can create conversations
    CREATE POLICY "Customers can create conversations"
      ON public.user_conversations
      FOR INSERT
      WITH CHECK (auth.uid() = customer_id);

    -- Both parties can update conversations
    CREATE POLICY "Conversation parties can update"
      ON public.user_conversations
      FOR UPDATE
      USING (
        auth.uid() = customer_id OR 
        agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
      );

    -- CREATE INDEX IF NOT EXISTS for performance
    CREATE INDEX IF NOT EXISTS idx_user_conversations_customer ON public.user_conversations(customer_id);
    CREATE INDEX IF NOT EXISTS idx_user_conversations_agent ON public.user_conversations(agent_id);
    CREATE INDEX IF NOT EXISTS idx_user_conversations_type ON public.user_conversations(conversation_type);
    CREATE INDEX IF NOT EXISTS idx_user_conversations_status ON public.user_conversations(status);
  ELSE
    -- Table exists, add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_conversations' AND column_name = 'conversation_type') THEN
      ALTER TABLE public.user_conversations 
        ADD COLUMN conversation_type TEXT NOT NULL DEFAULT 'general',
        ADD CONSTRAINT valid_conversation_type CHECK (conversation_type IN ('primary', 'general', 'channel', 'request'));
      
      CREATE INDEX IF NOT EXISTS idx_user_conversations_type ON public.user_conversations(conversation_type);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_conversations' AND column_name = 'status') THEN
      ALTER TABLE public.user_conversations 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'active',
        ADD CONSTRAINT valid_status CHECK (status IN ('active', 'pending', 'accepted', 'rejected', 'archived'));
      
      CREATE INDEX IF NOT EXISTS idx_user_conversations_status ON public.user_conversations(status);
    END IF;
  END IF;
END $$;

-- Update existing conversations to set appropriate types
UPDATE public.user_conversations
SET conversation_type = CASE
  WHEN job_id IS NOT NULL AND status = 'active' THEN 'primary'
  WHEN job_id IS NULL THEN 'general'
  ELSE conversation_type
END
WHERE conversation_type = 'general';
