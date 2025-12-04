-- Add RLS policy for users to view reports filed against them
CREATE POLICY "Users can view reports against them"
ON public.reports
FOR SELECT
TO public
USING (auth.uid() = reported_user_id);

-- Add RLS policy for users to view their own chat safety events
CREATE POLICY "Users can view their own safety events"
ON public.chat_safety_events
FOR SELECT
TO public
USING (auth.uid() = sender_id);