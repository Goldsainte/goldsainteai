-- Fix 1: Remove invalid default value for account_type
ALTER TABLE profiles 
ALTER COLUMN account_type DROP DEFAULT;

-- Fix 2: Set valid default to NULL (will be set during onboarding)
ALTER TABLE profiles 
ALTER COLUMN account_type SET DEFAULT NULL;

-- Fix 3: Update handle_new_user trigger to extract metadata correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    account_type,
    is_profile_complete,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT(
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        ' ',
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
      )
    ),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    -- account_type from metadata, or NULL (will be set during onboarding)
    CASE 
      WHEN NEW.raw_user_meta_data->>'account_type' IN ('traveler', 'creator', 'agent', 'brand')
      THEN NEW.raw_user_meta_data->>'account_type'
      ELSE NULL
    END,
    false,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    account_type = COALESCE(EXCLUDED.account_type, profiles.account_type),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;