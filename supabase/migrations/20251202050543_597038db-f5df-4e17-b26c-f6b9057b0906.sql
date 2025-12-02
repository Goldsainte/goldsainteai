-- Drop the existing check constraint
ALTER TABLE public.brand_applications DROP CONSTRAINT IF EXISTS brand_applications_brand_type_check;

-- Add updated check constraint with all brand types
ALTER TABLE public.brand_applications ADD CONSTRAINT brand_applications_brand_type_check 
CHECK (brand_type IN ('Hotel', 'Resort', 'Villa / Home', 'Boutique Stay', 'Restaurant / Bar', 'Experience Brand', 'Retail / Design Brand', 'Tour Operator', 'Transportation', 'Other'));