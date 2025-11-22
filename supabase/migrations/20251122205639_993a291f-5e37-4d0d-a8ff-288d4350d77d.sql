-- Add index for better query performance on trip_requests.user_id
CREATE INDEX IF NOT EXISTS idx_trip_requests_user_id 
ON public.trip_requests(user_id);