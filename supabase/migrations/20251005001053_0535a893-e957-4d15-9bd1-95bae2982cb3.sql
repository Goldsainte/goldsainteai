-- Enable realtime for marketplace_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_messages;

-- Add notification preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications boolean DEFAULT false;