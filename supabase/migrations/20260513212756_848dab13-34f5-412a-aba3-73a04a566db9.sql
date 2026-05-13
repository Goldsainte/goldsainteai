-- Reverse loyalty points awarded for a booking
CREATE OR REPLACE FUNCTION public.reverse_booking_loyalty_points(target_booking_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_to_reverse INTEGER := 0;
  txn RECORD;
BEGIN
  -- Sum earned points for this booking that have not been reversed yet
  SELECT COALESCE(SUM(points_amount), 0) INTO total_to_reverse
  FROM public.points_transactions
  WHERE related_entity_type = 'booking'
    AND related_entity_id = target_booking_id
    AND transaction_type = 'earn';

  -- Subtract any prior reversals
  total_to_reverse := total_to_reverse - COALESCE((
    SELECT SUM(ABS(points_amount))
    FROM public.points_transactions
    WHERE related_entity_type = 'booking'
      AND related_entity_id = target_booking_id
      AND transaction_type = 'redeem'
      AND reason = 'booking_refund_reversal'
  ), 0);

  IF total_to_reverse <= 0 THEN
    RETURN 0;
  END IF;

  -- Find the user who earned the points (assume single user per booking)
  FOR txn IN
    SELECT user_id, SUM(points_amount) AS pts
    FROM public.points_transactions
    WHERE related_entity_type = 'booking'
      AND related_entity_id = target_booking_id
      AND transaction_type = 'earn'
    GROUP BY user_id
  LOOP
    INSERT INTO public.points_transactions (
      user_id, points_amount, transaction_type, reason,
      related_entity_type, related_entity_id
    ) VALUES (
      txn.user_id, -txn.pts, 'redeem', 'booking_refund_reversal',
      'booking', target_booking_id
    );

    UPDATE public.loyalty_points
    SET points_balance = GREATEST(0, points_balance - txn.pts),
        updated_at = now()
    WHERE user_id = txn.user_id;
  END LOOP;

  RETURN total_to_reverse;
END;
$$;

-- Void unpaid earnings ledger entries for a refunded booking
CREATE OR REPLACE FUNCTION public.void_booking_earnings(target_booking_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  voided_count INTEGER := 0;
BEGIN
  UPDATE public.earnings_ledger
  SET status = 'locked',
      updated_at = now()
  WHERE booking_id = target_booking_id
    AND status IN ('pending', 'available');

  GET DIAGNOSTICS voided_count = ROW_COUNT;
  RETURN voided_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reverse_booking_loyalty_points(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.void_booking_earnings(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reverse_booking_loyalty_points(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.void_booking_earnings(UUID) TO service_role;