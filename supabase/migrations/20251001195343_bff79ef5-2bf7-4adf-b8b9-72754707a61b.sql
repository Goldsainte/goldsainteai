-- Add commission tracking columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS base_cost numeric,
ADD COLUMN IF NOT EXISTS markup_amount numeric,
ADD COLUMN IF NOT EXISTS markup_percentage numeric DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS commission_earned numeric,
ADD COLUMN IF NOT EXISTS stripe_fee numeric,
ADD COLUMN IF NOT EXISTS net_profit numeric;

-- Add comment explaining the columns
COMMENT ON COLUMN public.bookings.base_cost IS 'The actual cost charged by the supplier (e.g., Expedia)';
COMMENT ON COLUMN public.bookings.markup_amount IS 'The markup amount added to base cost';
COMMENT ON COLUMN public.bookings.markup_percentage IS 'The percentage markup applied';
COMMENT ON COLUMN public.bookings.commission_earned IS 'Total commission before Stripe fees';
COMMENT ON COLUMN public.bookings.stripe_fee IS 'Stripe processing fee (typically 2.9% + $0.30)';
COMMENT ON COLUMN public.bookings.net_profit IS 'Final profit after all fees';