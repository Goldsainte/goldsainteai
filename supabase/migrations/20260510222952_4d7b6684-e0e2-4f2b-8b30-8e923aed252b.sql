CREATE TABLE IF NOT EXISTS public.itinerary_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.itinerary_products(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id text,
  amount_paid numeric NOT NULL,
  currency text DEFAULT 'USD',
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, product_id)
);

ALTER TABLE public.itinerary_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see own purchases" ON public.itinerary_purchases
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Creators see sales of their products" ON public.itinerary_purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.itinerary_products WHERE id = product_id AND creator_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_itinerary_purchases_buyer ON public.itinerary_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_purchases_product ON public.itinerary_purchases(product_id);
