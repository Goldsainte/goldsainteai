-- Add interactions column to moments table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'moments' AND column_name = 'interactions'
  ) THEN
    ALTER TABLE public.moments 
    ADD COLUMN interactions jsonb DEFAULT NULL;
  END IF;
END $$;

-- CREATE TABLE IF NOT EXISTS for interaction responses
CREATE TABLE IF NOT EXISTS public.moment_interaction_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  response_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(moment_id, user_id, interaction_type)
);

-- Enable RLS
ALTER TABLE public.moment_interaction_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interaction responses
CREATE POLICY "Users can view their own responses"
  ON public.moment_interaction_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own responses"
  ON public.moment_interaction_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moment owners can view all responses to their moments"
  ON public.moment_interaction_responses FOR SELECT
  USING (
    moment_id IN (
      SELECT id FROM public.moments WHERE user_id = auth.uid()
    )
  );

-- CREATE INDEX IF NOT EXISTS for better query performance
CREATE INDEX IF NOT EXISTS idx_moment_interaction_responses_moment_id 
  ON public.moment_interaction_responses(moment_id);

CREATE INDEX IF NOT EXISTS idx_moment_interaction_responses_user_id 
  ON public.moment_interaction_responses(user_id);
