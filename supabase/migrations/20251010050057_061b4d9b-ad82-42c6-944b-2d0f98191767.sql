-- Add account types to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'user' CHECK (account_type IN ('user', 'verified', 'business', 'creator'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Create paid partnerships table
CREATE TABLE IF NOT EXISTS public.paid_partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.travel_posts(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  approved_at timestamp with time zone,
  rejected_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(post_id, brand_id)
);

-- Create partnership analytics table
CREATE TABLE IF NOT EXISTS public.partnership_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid REFERENCES public.paid_partnerships(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  click_throughs integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(partnership_id, date)
);

-- Enable RLS
ALTER TABLE public.paid_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for paid_partnerships
CREATE POLICY "Creators can create partnerships"
  ON public.paid_partnerships FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators and brands can view their partnerships"
  ON public.paid_partnerships FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = brand_id);

CREATE POLICY "Brands can update partnership status"
  ON public.paid_partnerships FOR UPDATE
  USING (auth.uid() = brand_id)
  WITH CHECK (auth.uid() = brand_id);

CREATE POLICY "Public can view approved partnerships"
  ON public.paid_partnerships FOR SELECT
  USING (status = 'approved');

-- RLS Policies for partnership_analytics
CREATE POLICY "Brands can view analytics for their partnerships"
  ON public.partnership_analytics FOR SELECT
  USING (partnership_id IN (
    SELECT id FROM public.paid_partnerships WHERE brand_id = auth.uid()
  ));

CREATE POLICY "Creators can view analytics for their partnerships"
  ON public.partnership_analytics FOR SELECT
  USING (partnership_id IN (
    SELECT id FROM public.paid_partnerships WHERE creator_id = auth.uid()
  ));

-- Trigger for partnership approval notifications
CREATE OR REPLACE FUNCTION public.notify_partnership_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  brand_username TEXT;
  creator_username TEXT;
BEGIN
  -- Get usernames
  SELECT username INTO brand_username FROM profiles WHERE id = NEW.brand_id;
  SELECT username INTO creator_username FROM profiles WHERE id = NEW.creator_id;
  
  -- Notify creator on approval/rejection
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      metadata,
      link
    ) VALUES (
      NEW.creator_id,
      'partnership_approved',
      'Partnership Approved',
      COALESCE(brand_username, 'A brand') || ' approved your partnership request',
      jsonb_build_object('partnership_id', NEW.id, 'post_id', NEW.post_id, 'brand_id', NEW.brand_id),
      '/travel-feed'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (
      user_id,
      notification_type,
      title,
      message,
      metadata,
      link
    ) VALUES (
      NEW.creator_id,
      'partnership_rejected',
      'Partnership Declined',
      COALESCE(brand_username, 'A brand') || ' declined your partnership request',
      jsonb_build_object('partnership_id', NEW.id, 'post_id', NEW.post_id, 'brand_id', NEW.brand_id),
      '/travel-feed'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_partnership_status_change
  AFTER UPDATE ON public.paid_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_partnership_status();

-- Trigger for new partnership notifications to brand
CREATE OR REPLACE FUNCTION public.notify_new_partnership_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_username TEXT;
BEGIN
  -- Get creator username
  SELECT username INTO creator_username FROM profiles WHERE id = NEW.creator_id;
  
  -- Notify brand
  INSERT INTO notifications (
    user_id,
    notification_type,
    title,
    message,
    metadata,
    link
  ) VALUES (
    NEW.brand_id,
    'partnership_request',
    'New Partnership Request',
    COALESCE(creator_username, 'A creator') || ' wants to tag you in a paid partnership',
    jsonb_build_object('partnership_id', NEW.id, 'post_id', NEW.post_id, 'creator_id', NEW.creator_id),
    '/travel-feed'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_partnership_request
  AFTER INSERT ON public.paid_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_partnership_request();

-- Update trigger for updated_at
CREATE TRIGGER update_paid_partnerships_updated_at
  BEFORE UPDATE ON public.paid_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partnership_analytics_updated_at
  BEFORE UPDATE ON public.partnership_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();