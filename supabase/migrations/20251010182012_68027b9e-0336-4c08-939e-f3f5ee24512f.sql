-- Add monetization fields to itinerary_templates
ALTER TABLE public.itinerary_templates
ADD COLUMN monetization_type TEXT CHECK (monetization_type IN ('free', 'coins', 'commission', 'both')),
ADD COLUMN coin_price INTEGER DEFAULT 0,
ADD COLUMN commission_percentage NUMERIC DEFAULT 0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100);

-- Add monetization fields to package_marketing_materials
ALTER TABLE public.package_marketing_materials
ADD COLUMN allow_resale BOOLEAN DEFAULT false,
ADD COLUMN resale_commission_percentage NUMERIC DEFAULT 10 CHECK (resale_commission_percentage >= 0 AND resale_commission_percentage <= 100);

-- Create template_usage_transactions table
CREATE TABLE IF NOT EXISTS public.template_usage_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.itinerary_templates(id) ON DELETE CASCADE,
  original_creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monetization_type TEXT NOT NULL,
  coins_paid INTEGER DEFAULT 0,
  commission_percentage NUMERIC DEFAULT 0,
  package_booking_id UUID REFERENCES public.package_bookings(id),
  commission_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create package_resale_transactions table
CREATE TABLE IF NOT EXISTS public.package_resale_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_package_id UUID NOT NULL REFERENCES public.package_marketing_materials(id) ON DELETE CASCADE,
  original_creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reseller_creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resold_package_id UUID REFERENCES public.package_marketing_materials(id),
  booking_id UUID REFERENCES public.package_bookings(id) ON DELETE SET NULL,
  booking_amount NUMERIC NOT NULL,
  commission_percentage NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.template_usage_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_resale_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_usage_transactions
CREATE POLICY "Original creators can view their template earnings"
  ON public.template_usage_transactions FOR SELECT
  USING (auth.uid() = original_creator_id);

CREATE POLICY "Users can view their template purchases"
  ON public.template_usage_transactions FOR SELECT
  USING (auth.uid() = user_creator_id);

CREATE POLICY "Creators can create template usage transactions"
  ON public.template_usage_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_creator_id);

-- RLS Policies for package_resale_transactions
CREATE POLICY "Original creators can view their resale earnings"
  ON public.package_resale_transactions FOR SELECT
  USING (auth.uid() = original_creator_id);

CREATE POLICY "Resellers can view their sales"
  ON public.package_resale_transactions FOR SELECT
  USING (auth.uid() = reseller_creator_id);

CREATE POLICY "Service role can manage resale transactions"
  ON public.package_resale_transactions FOR ALL
  USING (((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_template_usage_original_creator ON public.template_usage_transactions(original_creator_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_user_creator ON public.template_usage_transactions(user_creator_id);
CREATE INDEX IF NOT EXISTS idx_template_usage_template ON public.template_usage_transactions(template_id);
CREATE INDEX IF NOT EXISTS idx_package_resale_original_creator ON public.package_resale_transactions(original_creator_id);
CREATE INDEX IF NOT EXISTS idx_package_resale_reseller ON public.package_resale_transactions(reseller_creator_id);
CREATE INDEX IF NOT EXISTS idx_package_resale_booking ON public.package_resale_transactions(booking_id);

-- Function to process template purchase
CREATE OR REPLACE FUNCTION public.purchase_template_usage(
  p_template_id UUID,
  p_user_creator_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_template RECORD;
  v_user_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get template details
  SELECT * INTO v_template
  FROM public.itinerary_templates
  WHERE id = p_template_id;
  
  IF v_template IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Template not found');
  END IF;
  
  -- Check if monetization is enabled
  IF v_template.monetization_type IS NULL OR v_template.monetization_type = 'free' THEN
    -- Free template - just increment usage count
    UPDATE public.itinerary_templates
    SET usage_count = usage_count + 1
    WHERE id = p_template_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Free template accessed');
  END IF;
  
  -- Check if coins payment required
  IF v_template.monetization_type IN ('coins', 'both') AND v_template.coin_price > 0 THEN
    -- Get user's coin balance
    SELECT balance INTO v_user_balance
    FROM public.user_coin_balance
    WHERE user_id = p_user_creator_id;
    
    IF v_user_balance IS NULL OR v_user_balance < v_template.coin_price THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
    END IF;
    
    -- Deduct coins from user
    UPDATE public.user_coin_balance
    SET balance = balance - v_template.coin_price,
        updated_at = now()
    WHERE user_id = p_user_creator_id;
    
    -- Add coins to creator (70% payout, 30% platform fee)
    INSERT INTO public.user_coin_balance (user_id, balance)
    VALUES (v_template.creator_id, FLOOR(v_template.coin_price * 0.7))
    ON CONFLICT (user_id)
    DO UPDATE SET balance = public.user_coin_balance.balance + FLOOR(v_template.coin_price * 0.7),
                  updated_at = now();
  END IF;
  
  -- Create transaction record
  INSERT INTO public.template_usage_transactions (
    template_id,
    original_creator_id,
    user_creator_id,
    monetization_type,
    coins_paid,
    commission_percentage,
    status
  ) VALUES (
    p_template_id,
    v_template.creator_id,
    p_user_creator_id,
    v_template.monetization_type,
    COALESCE(v_template.coin_price, 0),
    COALESCE(v_template.commission_percentage, 0),
    CASE 
      WHEN v_template.monetization_type IN ('coins', 'both') THEN 'completed'
      ELSE 'pending'
    END
  ) RETURNING id INTO v_transaction_id;
  
  -- Increment usage count
  UPDATE public.itinerary_templates
  SET usage_count = usage_count + 1
  WHERE id = p_template_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'coins_paid', COALESCE(v_template.coin_price, 0),
    'commission_percentage', COALESCE(v_template.commission_percentage, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to process package resale commission
CREATE OR REPLACE FUNCTION public.process_package_resale_commission(
  p_booking_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_booking RECORD;
  v_package RECORD;
  v_commission_amount NUMERIC;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM public.package_bookings
  WHERE id = p_booking_id;
  
  IF v_booking IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get package details
  SELECT * INTO v_package
  FROM public.package_marketing_materials
  WHERE id = v_booking.package_id;
  
  IF v_package IS NULL OR NOT v_package.allow_resale THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate commission
  v_commission_amount := v_booking.total_price * (v_package.resale_commission_percentage / 100);
  
  -- Create resale transaction
  INSERT INTO public.package_resale_transactions (
    original_package_id,
    original_creator_id,
    reseller_creator_id,
    booking_id,
    booking_amount,
    commission_percentage,
    commission_amount,
    currency,
    status,
    paid_at
  ) VALUES (
    v_package.id,
    v_package.creator_id,
    v_booking.customer_id, -- Assuming customer is the reseller
    p_booking_id,
    v_booking.total_price,
    v_package.resale_commission_percentage,
    v_commission_amount,
    v_booking.currency,
    'completed',
    now()
  );
  
  -- Add commission to original creator's earnings
  INSERT INTO public.creator_earnings (
    user_id,
    earning_type,
    amount,
    currency,
    status
  ) VALUES (
    v_package.creator_id,
    'package_resale',
    v_commission_amount,
    v_booking.currency,
    'pending'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
