-- Create moment_reactions table for emoji reactions on moments
CREATE TABLE IF NOT EXISTS public.moment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid NOT NULL REFERENCES public.moments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(moment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.moment_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can view reactions
CREATE POLICY "Anyone can view moment reactions"
  ON public.moment_reactions
  FOR SELECT
  USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
  ON public.moment_reactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reactions
CREATE POLICY "Users can update their own reactions"
  ON public.moment_reactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
  ON public.moment_reactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- CREATE INDEX IF NOT EXISTS for faster queries
CREATE INDEX IF NOT EXISTS idx_moment_reactions_moment_id ON public.moment_reactions(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_reactions_user_id ON public.moment_reactions(user_id);
