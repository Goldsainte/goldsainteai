-- Drop the existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_account_type_check;

-- Re-create with 'brand' included
ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
CHECK ((account_type IS NULL) OR (account_type = ANY (ARRAY['traveler'::text, 'creator'::text, 'agent'::text, 'brand'::text])));