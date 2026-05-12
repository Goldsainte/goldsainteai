-- Phase 4: Multi-product bundles
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  price numeric NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'USD',
  trip_id uuid REFERENCES public.packaged_trips(id) ON DELETE SET NULL,
  guide_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  view_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_bundles_creator ON public.product_bundles(creator_id);
CREATE INDEX IF NOT EXISTS idx_product_bundles_status ON public.product_bundles(status);

ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own bundles"
  ON public.product_bundles
  FOR ALL
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Anyone view published bundles"
  ON public.product_bundles
  FOR SELECT
  USING (status = 'published');

CREATE TRIGGER update_product_bundles_updated_at
  BEFORE UPDATE ON public.product_bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Track bundle purchases for analytics + idempotency
CREATE TABLE IF NOT EXISTS public.bundle_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  amount_paid numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  trip_booking_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bundle_purchases_buyer ON public.bundle_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bundle_purchases_bundle ON public.bundle_purchases(bundle_id);

ALTER TABLE public.bundle_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers view their bundle purchases"
  ON public.bundle_purchases
  FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Bundle creators view sales of their bundles"
  ON public.bundle_purchases
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.product_bundles b
    WHERE b.id = bundle_purchases.bundle_id AND b.creator_id = auth.uid()
  ));
