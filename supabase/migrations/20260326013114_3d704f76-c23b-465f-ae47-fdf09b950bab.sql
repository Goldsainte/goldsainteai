CREATE TABLE IF NOT EXISTS public.creator_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  followers_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.creator_social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social accounts"
  ON public.creator_social_accounts FOR SELECT USING (true);

CREATE POLICY "Users can manage own social accounts"
  ON public.creator_social_accounts FOR ALL USING (auth.uid() = user_id);