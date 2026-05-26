-- Fix Priority 1: Add missing DELETE policy and database constraints

-- Allow creators to delete their own articles
CREATE POLICY "Creators can delete own articles"
  ON public.journal_articles FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.journal_creators WHERE id = creator_id
    )
  );

-- Add constraints for related articles
ALTER TABLE public.journal_related_articles
  ADD CONSTRAINT uq_related UNIQUE (article_id, related_article_id);

ALTER TABLE public.journal_related_articles
  ADD CONSTRAINT no_self_related 
  CHECK (article_id <> related_article_id);

-- Add GIN index for faster category filtering
CREATE INDEX IF NOT EXISTS idx_journal_articles_categories_gin
  ON public.journal_articles USING GIN (categories);
