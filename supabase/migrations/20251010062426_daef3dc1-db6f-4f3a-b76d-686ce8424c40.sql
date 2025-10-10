-- Virtual currency system tables

-- User coin balances
CREATE TABLE IF NOT EXISTS public.user_coin_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_purchased INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Virtual gift catalog
CREATE TABLE IF NOT EXISTS public.virtual_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  icon_url TEXT,
  coin_cost INTEGER NOT NULL,
  creator_payout_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gift transactions (when users send gifts)
CREATE TABLE IF NOT EXISTS public.gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  gift_id UUID NOT NULL REFERENCES public.virtual_gifts(id),
  coin_amount INTEGER NOT NULL,
  creator_earnings NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coin purchase history
CREATE TABLE IF NOT EXISTS public.coin_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_amount INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_coin_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_coin_balance
CREATE POLICY "Users can view their own coin balance"
  ON public.user_coin_balance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coin balance"
  ON public.user_coin_balance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for virtual_gifts
CREATE POLICY "Anyone can view active gifts"
  ON public.virtual_gifts FOR SELECT
  USING (is_active = true);

-- RLS Policies for gift_transactions
CREATE POLICY "Users can view gifts they sent"
  ON public.gift_transactions FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view gifts they received"
  ON public.gift_transactions FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can send gifts"
  ON public.gift_transactions FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for coin_purchases
CREATE POLICY "Users can view their own purchases"
  ON public.coin_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Insert default virtual gifts
INSERT INTO public.virtual_gifts (name, display_name, coin_cost, creator_payout_percentage, sort_order) VALUES
  ('heart', '❤️ Heart', 10, 50.00, 1),
  ('rose', '🌹 Rose', 50, 50.00, 2),
  ('star', '⭐ Star', 100, 50.00, 3),
  ('diamond', '💎 Diamond', 500, 50.00, 4),
  ('crown', '👑 Crown', 1000, 50.00, 5),
  ('trophy', '🏆 Trophy', 2500, 50.00, 6);

-- Function to send a gift
CREATE OR REPLACE FUNCTION public.send_virtual_gift(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_post_id UUID,
  p_gift_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coin_cost INTEGER;
  v_current_balance INTEGER;
  v_payout_percentage NUMERIC;
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
  
  -- Calculate earnings
  v_creator_earnings := (v_coin_cost * v_payout_percentage / 100.0);
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
  
  RETURN jsonb_build_object('success', true, 'coins_spent', v_coin_cost, 'new_balance', v_current_balance - v_coin_cost);
END;
$$;