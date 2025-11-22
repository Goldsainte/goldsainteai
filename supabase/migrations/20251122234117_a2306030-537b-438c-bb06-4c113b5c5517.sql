-- Add 5 admin insight columns to trip_proposals (all nullable for backward compatibility)
ALTER TABLE public.trip_proposals
ADD COLUMN IF NOT EXISTS admin_cost_basis NUMERIC,
ADD COLUMN IF NOT EXISTS admin_margin_amount NUMERIC,
ADD COLUMN IF NOT EXISTS admin_margin_percent NUMERIC,
ADD COLUMN IF NOT EXISTS admin_complexity_score INTEGER CHECK (admin_complexity_score BETWEEN 1 AND 10),
ADD COLUMN IF NOT EXISTS admin_supplier_notes TEXT;

-- Add index for admin queries
CREATE INDEX IF NOT EXISTS idx_trip_proposals_admin_complexity 
ON public.trip_proposals(admin_complexity_score) 
WHERE admin_complexity_score IS NOT NULL;

-- Add index for margin analysis
CREATE INDEX IF NOT EXISTS idx_trip_proposals_admin_margin 
ON public.trip_proposals(admin_margin_percent) 
WHERE admin_margin_percent IS NOT NULL;

-- Add comment documentation
COMMENT ON COLUMN public.trip_proposals.admin_cost_basis IS 'Internal estimate of real trip cost (hotel + flight + activities + transfers + labor)';
COMMENT ON COLUMN public.trip_proposals.admin_margin_amount IS 'Expected Goldsainte net margin in dollars';
COMMENT ON COLUMN public.trip_proposals.admin_margin_percent IS 'Margin percentage based on proposer price';
COMMENT ON COLUMN public.trip_proposals.admin_complexity_score IS 'Operational complexity rating (1-10 scale)';
COMMENT ON COLUMN public.trip_proposals.admin_supplier_notes IS 'Auto-generated supplier recommendations and operational notes';