
CREATE TABLE IF NOT EXISTS public.profile_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profile reviews"
  ON public.profile_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON public.profile_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != reviewee_id);

CREATE POLICY "Users can delete own reviews"
  ON public.profile_reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

CREATE INDEX IF NOT EXISTS idx_profile_reviews_reviewee ON public.profile_reviews(reviewee_id);

