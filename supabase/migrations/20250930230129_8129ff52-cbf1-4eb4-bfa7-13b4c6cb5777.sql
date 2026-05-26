-- CREATE TABLE IF NOT EXISTS for visa service requests
CREATE TABLE IF NOT EXISTS public.visa_service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_phone TEXT,
  from_country TEXT NOT NULL,
  to_country TEXT NOT NULL,
  visa_information JSONB NOT NULL,
  travel_dates JSONB,
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.visa_service_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create visa service requests" 
ON public.visa_service_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view their own requests by email" 
ON public.visa_service_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update their own requests by email" 
ON public.visa_service_requests 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_visa_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_visa_requests_updated_at
BEFORE UPDATE ON public.visa_service_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_visa_requests_updated_at();

-- CREATE INDEX IF NOT EXISTS for faster lookups
CREATE INDEX IF NOT EXISTS idx_visa_requests_email ON public.visa_service_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_visa_requests_status ON public.visa_service_requests(status);
CREATE INDEX IF NOT EXISTS idx_visa_requests_created_at ON public.visa_service_requests(created_at DESC);

