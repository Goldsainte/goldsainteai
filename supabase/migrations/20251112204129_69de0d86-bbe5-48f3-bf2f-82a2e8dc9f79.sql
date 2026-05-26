-- Add stripe_customer_id to profiles for caching Stripe customer IDs
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- CREATE INDEX IF NOT EXISTS on stripe_customer_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id);

-- Journal indexes for performance at scale
-- Index on status and publish_date for listing queries
CREATE INDEX IF NOT EXISTS idx_journal_articles_status_publish_date 
ON public.journal_articles(status, publish_date DESC) 
WHERE status = 'published';

-- Index on slug for article detail lookups
CREATE INDEX IF NOT EXISTS idx_journal_articles_slug 
ON public.journal_articles(slug) 
WHERE status = 'published';

-- Index on creator_id and created_at for creator article listings
CREATE INDEX IF NOT EXISTS idx_journal_articles_creator_created 
ON public.journal_articles(creator_id, created_at DESC);

-- GIN index on categories for array/jsonb contains operations
CREATE INDEX IF NOT EXISTS idx_journal_articles_categories 
ON public.journal_articles USING GIN(categories);

-- Comment explaining the indexes
COMMENT ON INDEX idx_journal_articles_status_publish_date IS 
'Optimizes published article listings ordered by publish date';
COMMENT ON INDEX idx_journal_articles_slug IS 
'Optimizes article detail page lookups by slug';
COMMENT ON INDEX idx_journal_articles_creator_created IS 
'Optimizes creator article management queries';
COMMENT ON INDEX idx_journal_articles_categories IS 
'Optimizes category-based filtering using GIN index';

