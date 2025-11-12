-- Add RLS UPDATE policy for journal_analytics
-- Allows users to update their own analytics rows (or anonymous rows)
CREATE POLICY "journal_analytics_update"
ON public.journal_analytics
FOR UPDATE
USING (
  (auth.uid() = user_id OR user_id IS NULL)
  AND session_id IS NOT NULL
);

-- Add index for faster analytics updates
CREATE INDEX IF NOT EXISTS idx_journal_analytics_article_session 
ON public.journal_analytics(article_id, session_id);