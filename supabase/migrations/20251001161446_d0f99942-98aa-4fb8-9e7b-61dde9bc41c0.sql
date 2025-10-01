-- Add opt-in columns for communication preferences to travel_agents table
ALTER TABLE public.travel_agents 
ADD COLUMN email_notifications_enabled boolean DEFAULT false,
ADD COLUMN sms_notifications_enabled boolean DEFAULT false,
ADD COLUMN whatsapp_notifications_enabled boolean DEFAULT false;