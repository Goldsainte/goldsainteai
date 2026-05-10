CREATE TABLE public.itinerary_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  destination text NOT NULL,
  duration_days integer NOT NULL,
  price numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  cover_image_url text,
  description text,
  days jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own itinerary products"
ON public.itinerary_products
FOR ALL
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Anyone can view published itinerary products"
ON public.itinerary_products
FOR SELECT
USING (status = 'published');

CREATE TRIGGER update_itinerary_products_updated_at
BEFORE UPDATE ON public.itinerary_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_itinerary_products_creator ON public.itinerary_products(creator_id);
CREATE INDEX idx_itinerary_products_status ON public.itinerary_products(status);