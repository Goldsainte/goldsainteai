-- pending_inquiries: captures trip questions submitted before email verification.
-- The user (and auth record) is created server-side when the inquiry is submitted.
-- On magic-link click, AuthCallback converts the row to a real conversation.

CREATE TABLE IF NOT EXISTS public.pending_inquiries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL,
  trip_id          UUID NOT NULL,
  partner_id       UUID,                  -- agent / creator who receives the inquiry
  trip_title       TEXT,
  host_name        TEXT,
  question         TEXT NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'converted', 'expired')),
  conversation_id  UUID REFERENCES public.user_conversations(id) ON DELETE SET NULL,
  magic_link_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  converted_at     TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fast lookups used by conversion logic and admin tooling
CREATE INDEX IF NOT EXISTS idx_pending_inquiries_email
  ON public.pending_inquiries(email);

CREATE INDEX IF NOT EXISTS idx_pending_inquiries_user_id
  ON public.pending_inquiries(user_id);

CREATE INDEX IF NOT EXISTS idx_pending_inquiries_status
  ON public.pending_inquiries(status);

CREATE INDEX IF NOT EXISTS idx_pending_inquiries_trip_id
  ON public.pending_inquiries(trip_id);

-- RLS: enabled, service role bypasses; authenticated users can read their own rows
ALTER TABLE public.pending_inquiries ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see their own pending inquiries (after magic link fires)
CREATE POLICY "Users can view their own pending inquiries"
  ON public.pending_inquiries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No client-side INSERT/UPDATE — all writes go through the edge function (service role)

-- Auto-expire rows older than 7 days in 'pending' state (run by daily maintenance cron)
CREATE OR REPLACE FUNCTION public.expire_old_pending_inquiries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.pending_inquiries
  SET status = 'expired'
  WHERE status = 'pending'
    AND created_at < now() - INTERVAL '7 days';
END;
$$;
