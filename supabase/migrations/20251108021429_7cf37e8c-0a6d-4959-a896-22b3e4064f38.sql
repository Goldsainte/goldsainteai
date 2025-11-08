-- Enable realtime for group trip tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_suggestions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_votes;

-- Set replica identity to full to capture complete row data
ALTER TABLE public.trip_suggestions REPLICA IDENTITY FULL;
ALTER TABLE public.trip_votes REPLICA IDENTITY FULL;