-- Add UPDATE policy for journal_analytics
CREATE POLICY "Users can update own analytics rows"
  ON public.journal_analytics FOR UPDATE
  USING (
    session_id IS NOT NULL 
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- Add index for fast analytics updates by article and session
CREATE INDEX IF NOT EXISTS idx_journal_analytics_article_session
  ON public.journal_analytics(article_id, session_id);