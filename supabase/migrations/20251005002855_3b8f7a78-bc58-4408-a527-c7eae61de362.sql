-- Phase 2: Payment & Financial Features

-- Create payment milestones table
CREATE TABLE IF NOT EXISTS public.payment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  milestone_number integer NOT NULL,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  percentage numeric CHECK (percentage > 0 AND percentage <= 100),
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'paid', 'disputed')),
  payment_intent_id text,
  paid_at timestamp with time zone,
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deliverables jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(job_id, milestone_number)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_milestones_job ON public.payment_milestones(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_status ON public.payment_milestones(status);

-- RLS policies for payment milestones
ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones for their jobs"
ON public.payment_milestones FOR SELECT
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE user_id = auth.uid() OR assigned_agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Agents can create milestones for assigned jobs"
ON public.payment_milestones FOR INSERT
TO authenticated
WITH CHECK (
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE assigned_agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Agents can update milestones for their jobs"
ON public.payment_milestones FOR UPDATE
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE assigned_agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  )
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.marketplace_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.travel_agents(id) ON DELETE CASCADE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  tax_rate numeric DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount numeric DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  amount_paid numeric DEFAULT 0 CHECK (amount_paid >= 0),
  currency text NOT NULL DEFAULT 'USD',
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  payment_terms text,
  notes text,
  customer_notes text,
  billing_address jsonb,
  tax_details jsonb DEFAULT '{}'::jsonb,
  paid_at timestamp with time zone,
  sent_at timestamp with time zone,
  payment_method text,
  stripe_invoice_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invoices_job ON public.marketplace_invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.marketplace_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_agent ON public.marketplace_invoices(agent_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.marketplace_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.marketplace_invoices(invoice_number);

-- RLS policies for invoices
ALTER TABLE public.marketplace_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
ON public.marketplace_invoices FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid() OR 
  agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
);

CREATE POLICY "Agents can create invoices"
ON public.marketplace_invoices FOR INSERT
TO authenticated
WITH CHECK (
  agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
);

CREATE POLICY "Agents can update their invoices"
ON public.marketplace_invoices FOR UPDATE
TO authenticated
USING (
  agent_id IN (SELECT id FROM public.travel_agents WHERE user_id = auth.uid())
);

-- Create payment plans table
CREATE TABLE IF NOT EXISTS public.payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL CHECK (total_amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  number_of_installments integer NOT NULL CHECK (number_of_installments > 0 AND number_of_installments <= 12),
  installment_amount numeric NOT NULL CHECK (installment_amount > 0),
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'defaulted')),
  installments_paid integer DEFAULT 0,
  next_payment_date date,
  auto_charge boolean DEFAULT false,
  stripe_subscription_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(job_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payment_plans_job ON public.payment_plans(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON public.payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_next_payment ON public.payment_plans(next_payment_date);

-- RLS policies for payment plans
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payment plans"
ON public.payment_plans FOR SELECT
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.marketplace_jobs WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create payment plans for their jobs"
ON public.payment_plans FOR INSERT
TO authenticated
WITH CHECK (
  job_id IN (
    SELECT id FROM public.marketplace_jobs WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their payment plans"
ON public.payment_plans FOR UPDATE
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.marketplace_jobs WHERE user_id = auth.uid()
  )
);

-- Create refund guarantees table
CREATE TABLE IF NOT EXISTS public.refund_guarantees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.marketplace_jobs(id) ON DELETE CASCADE,
  guarantee_type text NOT NULL CHECK (guarantee_type IN ('full_refund', 'partial_refund', 'service_credit', 'rebook_free')),
  coverage_percentage numeric NOT NULL DEFAULT 100 CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
  covered_amount numeric NOT NULL CHECK (covered_amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  terms_and_conditions text NOT NULL,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'expired', 'cancelled')),
  claim_deadline date,
  claimed_at timestamp with time zone,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claim_reason text,
  claim_amount numeric,
  refund_processed boolean DEFAULT false,
  refund_processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(job_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_refund_guarantees_job ON public.refund_guarantees(job_id);
CREATE INDEX IF NOT EXISTS idx_refund_guarantees_status ON public.refund_guarantees(status);

-- RLS policies for refund guarantees
ALTER TABLE public.refund_guarantees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view guarantees for their jobs"
ON public.refund_guarantees FOR SELECT
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.marketplace_jobs WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Agents can create guarantees"
ON public.refund_guarantees FOR INSERT
TO authenticated
WITH CHECK (
  job_id IN (
    SELECT id FROM public.marketplace_jobs 
    WHERE assigned_agent_id IN (
      SELECT id FROM public.travel_agents WHERE user_id = auth.uid()
    )
  )
);

-- Add multi-currency exchange rates table
CREATE TABLE IF NOT EXISTS public.currency_exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric NOT NULL CHECK (rate > 0),
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  source text DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency, effective_date)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_currency_rates_from ON public.currency_exchange_rates(from_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_to ON public.currency_exchange_rates(to_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_date ON public.currency_exchange_rates(effective_date);

-- RLS policies for currency rates (public read)
ALTER TABLE public.currency_exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view currency rates"
ON public.currency_exchange_rates FOR SELECT
TO authenticated
USING (true);

-- Add currency preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS billing_address jsonb DEFAULT '{}'::jsonb;

-- Update marketplace_jobs to support installments
ALTER TABLE public.marketplace_jobs
ADD COLUMN payment_plan_enabled boolean DEFAULT false,
ADD COLUMN installment_plan_id uuid REFERENCES public.payment_plans(id) ON DELETE SET NULL,
ADD COLUMN refund_guarantee_enabled boolean DEFAULT false,
ADD COLUMN refund_guarantee_id uuid REFERENCES public.refund_guarantees(id) ON DELETE SET NULL;

-- Create triggers for updated_at
CREATE TRIGGER update_payment_milestones_updated_at
BEFORE UPDATE ON public.payment_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.marketplace_invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_plans_updated_at
BEFORE UPDATE ON public.payment_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refund_guarantees_updated_at
BEFORE UPDATE ON public.refund_guarantees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_currency_rates_updated_at
BEFORE UPDATE ON public.currency_exchange_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_number integer;
  invoice_num text;
BEGIN
  -- Get the next sequential number
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-(\d+)') AS integer)), 0) + 1
  INTO next_number
  FROM public.marketplace_invoices;
  
  -- Format as INV-00001
  invoice_num := 'INV-' || LPAD(next_number::text, 5, '0');
  
  RETURN invoice_num;
END;
$$;

-- Function to convert currency
CREATE OR REPLACE FUNCTION public.convert_currency(
  amount numeric,
  from_curr text,
  to_curr text
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  rate numeric;
  converted_amount numeric;
BEGIN
  -- If same currency, return original amount
  IF from_curr = to_curr THEN
    RETURN amount;
  END IF;
  
  -- Get the latest exchange rate
  SELECT r.rate INTO rate
  FROM public.currency_exchange_rates r
  WHERE r.from_currency = from_curr 
    AND r.to_currency = to_curr
  ORDER BY r.effective_date DESC
  LIMIT 1;
  
  -- If no rate found, return NULL
  IF rate IS NULL THEN
    RETURN NULL;
  END IF;
  
  converted_amount := amount * rate;
  RETURN ROUND(converted_amount, 2);
END;
$$;

-- Insert some default exchange rates
INSERT INTO public.currency_exchange_rates (from_currency, to_currency, rate, source) VALUES
('USD', 'EUR', 0.92, 'default'),
('EUR', 'USD', 1.09, 'default'),
('USD', 'GBP', 0.79, 'default'),
('GBP', 'USD', 1.27, 'default'),
('USD', 'JPY', 149.50, 'default'),
('JPY', 'USD', 0.0067, 'default'),
('USD', 'AUD', 1.52, 'default'),
('AUD', 'USD', 0.66, 'default'),
('USD', 'CAD', 1.36, 'default'),
('CAD', 'USD', 0.74, 'default')
ON CONFLICT (from_currency, to_currency, effective_date) DO NOTHING;

-- Comments
COMMENT ON TABLE public.payment_milestones IS 'Tracks milestone-based payments for marketplace jobs';
COMMENT ON TABLE public.marketplace_invoices IS 'Professional invoices with tax details for marketplace transactions';
COMMENT ON TABLE public.payment_plans IS 'Installment payment plans for large bookings';
COMMENT ON TABLE public.refund_guarantees IS 'Refund protection plans for customers';
COMMENT ON TABLE public.currency_exchange_rates IS 'Currency exchange rates for multi-currency support';
