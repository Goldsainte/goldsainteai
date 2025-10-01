-- Fix function search path for security - drop trigger first
DROP TRIGGER IF EXISTS update_booking_preferences_timestamp ON user_booking_preferences;
DROP FUNCTION IF EXISTS update_booking_preferences_updated_at();

CREATE OR REPLACE FUNCTION update_booking_preferences_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_booking_preferences_timestamp
BEFORE UPDATE ON user_booking_preferences
FOR EACH ROW
EXECUTE FUNCTION update_booking_preferences_updated_at();