-- Create helper function to get user's tier commission bonus
CREATE OR REPLACE FUNCTION public.get_user_tier_bonus(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_bonus_percentage NUMERIC := 0;
BEGIN
  -- Get the user's current tier bonus
  SELECT ct.commission_bonus_percentage INTO v_bonus_percentage
  FROM public.creator_tier_memberships ctm
  JOIN public.creator_tiers ct ON ct.tier_name = ctm.current_tier
  WHERE ctm.user_id = p_user_id;
  
  RETURN COALESCE(v_bonus_percentage, 0);
END;
$$;

-- Update purchase_template_usage function to apply tier bonus
CREATE OR REPLACE FUNCTION public.purchase_template_usage(p_template_id uuid, p_user_creator_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_template RECORD;
  v_user_balance INTEGER;
  v_transaction_id UUID;
  v_tier_bonus NUMERIC;
  v_creator_payout NUMERIC;
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
    
    -- Get creator's tier bonus
    v_tier_bonus := public.get_user_tier_bonus(v_template.creator_id);
    
    -- Calculate payout with tier bonus: base 70% * (1 + tier_bonus/100)
    v_creator_payout := FLOOR(v_template.coin_price * 0.7 * (1 + v_tier_bonus / 100.0));
    
    -- Add coins to creator with tier bonus applied
    INSERT INTO public.user_coin_balance (user_id, balance)
    VALUES (v_template.creator_id, v_creator_payout)
    ON CONFLICT (user_id)
    DO UPDATE SET balance = public.user_coin_balance.balance + v_creator_payout,
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
    'commission_percentage', COALESCE(v_template.commission_percentage, 0),
    'tier_bonus_applied', v_tier_bonus
  );
END;
$$;

-- Update process_package_resale_commission to apply tier bonus
CREATE OR REPLACE FUNCTION public.process_package_resale_commission(p_booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking RECORD;
  v_package RECORD;
  v_commission_amount NUMERIC;
  v_tier_bonus NUMERIC;
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
  
  -- Get creator's tier bonus
  v_tier_bonus := public.get_user_tier_bonus(v_package.creator_id);
  
  -- Calculate commission with tier bonus applied
  v_commission_amount := v_booking.total_price * (v_package.resale_commission_percentage / 100) * (1 + v_tier_bonus / 100.0);
  
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
    v_booking.customer_id,
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
$$;

-- Update send_virtual_gift to apply tier bonus
CREATE OR REPLACE FUNCTION public.send_virtual_gift(p_sender_id uuid, p_recipient_id uuid, p_post_id uuid, p_gift_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_coin_cost INTEGER;
  v_current_balance INTEGER;
  v_payout_percentage NUMERIC;
  v_tier_bonus NUMERIC;
  v_creator_earnings NUMERIC;
  v_platform_fee NUMERIC;
BEGIN
  -- Get gift cost and payout percentage
  SELECT coin_cost, creator_payout_percentage
  INTO v_coin_cost, v_payout_percentage
  FROM virtual_gifts
  WHERE id = p_gift_id AND is_active = true;
  
  IF v_coin_cost IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Gift not found');
  END IF;
  
  -- Get sender's balance
  SELECT balance INTO v_current_balance
  FROM user_coin_balance
  WHERE user_id = p_sender_id;
  
  IF v_current_balance IS NULL OR v_current_balance < v_coin_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;
  
  -- Get recipient's tier bonus
  v_tier_bonus := public.get_user_tier_bonus(p_recipient_id);
  
  -- Calculate earnings with tier bonus: base payout * (1 + tier_bonus/100)
  v_creator_earnings := (v_coin_cost * v_payout_percentage / 100.0) * (1 + v_tier_bonus / 100.0);
  v_platform_fee := v_coin_cost - v_creator_earnings;
  
  -- Deduct coins from sender
  UPDATE user_coin_balance
  SET balance = balance - v_coin_cost,
      updated_at = now()
  WHERE user_id = p_sender_id;
  
  -- Record transaction
  INSERT INTO gift_transactions (sender_id, recipient_id, post_id, gift_id, coin_amount, creator_earnings, platform_fee)
  VALUES (p_sender_id, p_recipient_id, p_post_id, p_gift_id, v_coin_cost, v_creator_earnings, v_platform_fee);
  
  -- Add to creator earnings
  INSERT INTO creator_earnings (user_id, post_id, earning_type, amount, currency, status)
  VALUES (p_recipient_id, p_post_id, 'virtual_gift', v_creator_earnings, 'USD', 'pending');
  
  RETURN jsonb_build_object(
    'success', true, 
    'coins_spent', v_coin_cost, 
    'new_balance', v_current_balance - v_coin_cost,
    'tier_bonus_applied', v_tier_bonus
  );
END;
$$;