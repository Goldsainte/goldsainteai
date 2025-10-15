-- Add missing columns to suppliers table for transportation vendor applications
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS business_address text,
ADD COLUMN IF NOT EXISTS description text;

-- Copy existing name to business_name for any existing records
UPDATE public.suppliers 
SET business_name = name 
WHERE business_name IS NULL AND name IS NOT NULL;