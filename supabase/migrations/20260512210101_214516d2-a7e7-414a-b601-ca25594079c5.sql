
-- 2.1 Creator tier columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creator_tier text NOT NULL DEFAULT 'bronze'
    CHECK (creator_tier IN ('bronze','silver','gold','platinum'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lifetime_sales_count integer NOT NULL DEFAULT 0;

-- BEFORE trigger avoids recursion
CREATE OR REPLACE FUNCTION public.update_creator_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.creator_tier := CASE
    WHEN NEW.lifetime_sales_count >= 200 THEN 'platinum'
    WHEN NEW.lifetime_sales_count >= 50  THEN 'gold'
    WHEN NEW.lifetime_sales_count >= 10  THEN 'silver'
    ELSE 'bronze'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_creator_tier ON public.profiles;
CREATE TRIGGER trigger_update_creator_tier
BEFORE UPDATE OF lifetime_sales_count ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_creator_tier();

-- Helper RPC for atomic increment from webhooks
CREATE OR REPLACE FUNCTION public.increment_lifetime_sales(_user_id uuid, _delta int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET lifetime_sales_count = COALESCE(lifetime_sales_count,0) + _delta
  WHERE id = _user_id;
END;
$$;

-- 2.2 view_count on itinerary_products (packaged_trips already has it)
ALTER TABLE public.itinerary_products
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- Atomic view increment RPCs (callable by anyone via edge function)
CREATE OR REPLACE FUNCTION public.increment_trip_view(_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.packaged_trips
  SET view_count = COALESCE(view_count,0) + 1
  WHERE id = _trip_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_product_view(_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.itinerary_products
  SET view_count = COALESCE(view_count,0) + 1
  WHERE id = _product_id;
END;
$$;
