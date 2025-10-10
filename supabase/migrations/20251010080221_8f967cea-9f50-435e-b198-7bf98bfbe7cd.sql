-- Add comprehensive fields to travel_packages table
ALTER TABLE public.travel_packages
ADD COLUMN IF NOT EXISTS package_summary text,
ADD COLUMN IF NOT EXISTS dates_info jsonb DEFAULT '{"type": "flexible"}'::jsonb,
ADD COLUMN IF NOT EXISTS booking_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS location_details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS whats_included jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS whats_not_included text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS pricing_details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS creator_story text,
ADD COLUMN IF NOT EXISTS daily_itinerary jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS travel_requirements jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS booking_cta text DEFAULT 'Book Now'::text,
ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS brochure_url text,
ADD COLUMN IF NOT EXISTS spots_total integer,
ADD COLUMN IF NOT EXISTS spots_remaining integer;

COMMENT ON COLUMN public.travel_packages.package_summary IS '1-2 paragraph sales pitch';
COMMENT ON COLUMN public.travel_packages.dates_info IS 'JSON: {type: "fixed"|"flexible", dates: [], deadline: ""}';
COMMENT ON COLUMN public.travel_packages.location_details IS 'JSON: {country, city, region, attractions: []}';
COMMENT ON COLUMN public.travel_packages.whats_included IS 'JSON: {accommodation: {}, transportation: {}, activities: [], meals: {}, perks: []}';
COMMENT ON COLUMN public.travel_packages.whats_not_included IS 'Array of items not included';
COMMENT ON COLUMN public.travel_packages.pricing_details IS 'JSON: {per_person, per_couple, deposit, installments, refund_policy, early_bird}';
COMMENT ON COLUMN public.travel_packages.daily_itinerary IS 'JSON array: [{day, title, description, activities: []}]';
COMMENT ON COLUMN public.travel_packages.travel_requirements IS 'JSON: {passport, visa, age_minimum, fitness_level, accessibility_notes}';
COMMENT ON COLUMN public.travel_packages.faqs IS 'JSON array: [{question, answer}]';
COMMENT ON COLUMN public.travel_packages.testimonials IS 'JSON array: [{name, quote, date}]';