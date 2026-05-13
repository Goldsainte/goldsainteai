ALTER TABLE public.bundle_purchases
  ADD COLUMN IF NOT EXISTS partner_payout numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_commission numeric NOT NULL DEFAULT 0;