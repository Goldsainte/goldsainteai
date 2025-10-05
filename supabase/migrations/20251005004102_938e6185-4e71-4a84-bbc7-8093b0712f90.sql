-- Phase 4: Add missing components for Advanced Agent Features

-- Function to update agent rating when review is added (if not exists)
CREATE OR REPLACE FUNCTION public.update_agent_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.travel_agents
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM public.agent_reviews
      WHERE agent_id = NEW.agent_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.agent_reviews
      WHERE agent_id = NEW.agent_id
    )
  WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_agent_rating_trigger ON public.agent_reviews;

-- Trigger for updating agent rating
CREATE TRIGGER update_agent_rating_trigger
  AFTER INSERT ON public.agent_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_rating();