-- Add passport and visa information fields to user_booking_preferences table
ALTER TABLE public.user_booking_preferences
ADD COLUMN IF NOT EXISTS passport_number text,
ADD COLUMN IF NOT EXISTS passport_expiry date,
ADD COLUMN IF NOT EXISTS passport_issuing_country text,
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS visa_required_countries text[],
ADD COLUMN IF NOT EXISTS visa_assistance_needed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS travel_insurance text;