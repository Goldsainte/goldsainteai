-- Content Moderation System

-- Table to store moderation flags (AI + user reports)
CREATE TABLE IF NOT EXISTS public.content_moderation_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'story', 'message', 'profile', 'bio')),
  content_id UUID NOT NULL,
  flagged_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  flag_source TEXT NOT NULL DEFAULT 'ai' CHECK (flag_source IN ('ai', 'user', 'system')),
  violation_type TEXT NOT NULL CHECK (violation_type IN (
    'nudity', 'sexual_content', 'hate_speech', 'violence', 'graphic_content', 
    'spam', 'misinformation', 'bullying', 'harassment', 'illegal_content', 
    'self_harm', 'dangerous_organizations', 'intellectual_property', 'minor_safety', 'other'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_analysis JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed', 'dismissed', 'appealed')),
  reviewed_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table to track moderation actions taken
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'warning', 'content_removed', 'shadowban', 'temporary_ban', 'permanent_ban', 
    'account_disabled', 'content_hidden', 'comment_disabled', 'posting_restricted'
  )),
  reason TEXT NOT NULL,
  duration_hours INTEGER,
  related_flag_id UUID REFERENCES public.content_moderation_flags(id) ON DELETE SET NULL,
  enforced_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  enforced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  appeal_status TEXT CHECK (appeal_status IN ('not_appealed', 'pending', 'approved', 'rejected')),
  appeal_text TEXT,
  appealed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Blocked keywords table
CREATE TABLE IF NOT EXISTS public.blocked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  action TEXT NOT NULL DEFAULT 'hide' CHECK (action IN ('hide', 'flag', 'block')),
  category TEXT CHECK (category IN ('profanity', 'hate_speech', 'sexual', 'violence', 'spam')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Community guidelines table
CREATE TABLE IF NOT EXISTS public.community_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sensitive content labels table
CREATE TABLE IF NOT EXISTS public.sensitive_content_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  label_type TEXT NOT NULL CHECK (label_type IN (
    'graphic_violence', 'sensitive_event', 'medical', 'disturbing', 'misinformation_warning'
  )),
  warning_text TEXT NOT NULL,
  requires_click_through BOOLEAN DEFAULT true,
  info_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add moderation status to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'warned', 'restricted', 'shadowbanned', 'suspended', 'banned')),
ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_warning_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS restriction_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_shadowbanned BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.content_moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensitive_content_labels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_moderation_flags
CREATE POLICY "Users can report content"
ON public.content_moderation_flags FOR INSERT
WITH CHECK (auth.uid() = flagged_by_user_id AND flag_source = 'user');

CREATE POLICY "Users can view their own reports"
ON public.content_moderation_flags FOR SELECT
USING (auth.uid() = flagged_by_user_id);

CREATE POLICY "Admins can view all flags"
ON public.content_moderation_flags FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update flags"
ON public.content_moderation_flags FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage flags"
ON public.content_moderation_flags FOR ALL
USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'service_role');

-- RLS Policies for moderation_actions
CREATE POLICY "Users can view their own moderation actions"
ON public.moderation_actions FOR SELECT
USING (auth.uid() = target_user_id);

CREATE POLICY "Admins can manage all moderation actions"
ON public.moderation_actions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage moderation actions"
ON public.moderation_actions FOR ALL
USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'service_role');

-- RLS Policies for blocked_keywords
CREATE POLICY "Anyone can view active blocked keywords"
ON public.blocked_keywords FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage blocked keywords"
ON public.blocked_keywords FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for community_guidelines
CREATE POLICY "Anyone can view active guidelines"
ON public.community_guidelines FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage guidelines"
ON public.community_guidelines FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for sensitive_content_labels
CREATE POLICY "Anyone can view sensitive labels"
ON public.sensitive_content_labels FOR SELECT
USING (true);

CREATE POLICY "Service role can manage labels"
ON public.sensitive_content_labels FOR ALL
USING ((current_setting('request.jwt.claims', true)::json->>'role') = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flags_content ON public.content_moderation_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_flags_status ON public.content_moderation_flags(status);
CREATE INDEX IF NOT EXISTS idx_flags_severity ON public.content_moderation_flags(severity);
CREATE INDEX IF NOT EXISTS idx_actions_user ON public.moderation_actions(target_user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_actions_expires ON public.moderation_actions(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_keywords_search ON public.blocked_keywords(keyword) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_labels_post ON public.sensitive_content_labels(post_id);

-- Trigger to update timestamps
CREATE TRIGGER update_moderation_flags_updated_at
  BEFORE UPDATE ON public.content_moderation_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blocked_keywords_updated_at
  BEFORE UPDATE ON public.blocked_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guidelines_updated_at
  BEFORE UPDATE ON public.community_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default blocked keywords
INSERT INTO public.blocked_keywords (keyword, severity, action, category) VALUES
  ('spam', 'low', 'flag', 'spam'),
  ('scam', 'medium', 'flag', 'spam'),
  ('kill', 'high', 'flag', 'violence'),
  ('die', 'high', 'flag', 'violence'),
  ('terrorist', 'high', 'block', 'violence'),
  ('nude', 'high', 'block', 'sexual'),
  ('porn', 'high', 'block', 'sexual');

-- Insert default community guidelines
INSERT INTO public.community_guidelines (title, content, category, order_index) VALUES
  ('Respect Others', 'Treat everyone with respect. Do not bully, harass, or threaten others.', 'behavior', 1),
  ('No Hate Speech', 'We do not allow content that attacks people based on race, ethnicity, national origin, religion, disability, disease, age, sexual orientation, gender, or gender identity.', 'safety', 2),
  ('No Nudity or Sexual Content', 'We remove content that contains nudity or sexual activity. This includes digitally created content.', 'safety', 3),
  ('No Violence or Dangerous Content', 'We do not allow content that encourages, promotes, or glorifies violence or dangerous acts.', 'safety', 4),
  ('No Spam or Scams', 'Do not post repetitive content, engage in artificial engagement, or attempt to manipulate platform features.', 'integrity', 5),
  ('Protect Minors', 'We have zero tolerance for content that sexualizes or endangers minors.', 'safety', 6);

-- Function to check if user is restricted
CREATE OR REPLACE FUNCTION public.is_user_restricted(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_status TEXT;
  active_bans INTEGER;
BEGIN
  -- Check profile status
  SELECT account_status INTO user_status
  FROM public.profiles
  WHERE id = target_user_id;
  
  IF user_status IN ('suspended', 'banned') THEN
    RETURN true;
  END IF;
  
  -- Check for active temporary bans
  SELECT COUNT(*) INTO active_bans
  FROM public.moderation_actions
  WHERE target_user_id = target_user_id
    AND is_active = true
    AND action_type IN ('temporary_ban', 'permanent_ban', 'account_disabled')
    AND (expires_at IS NULL OR expires_at > now());
  
  RETURN active_bans > 0;
END;
$$;
