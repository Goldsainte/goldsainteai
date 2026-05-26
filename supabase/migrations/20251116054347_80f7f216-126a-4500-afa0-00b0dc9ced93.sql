-- Ensure profiles has role column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Set admin role for the specified user by joining with auth.users
UPDATE public.profiles 
SET role = 'admin' 
FROM auth.users 
WHERE profiles.id = auth.users.id 
  AND auth.users.email = 'a.powell@cornellfacilities.com';

-- CREATE INDEX IF NOT EXISTS for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

COMMENT ON COLUMN public.profiles.role IS 'User role: user, creator, agent, admin';
