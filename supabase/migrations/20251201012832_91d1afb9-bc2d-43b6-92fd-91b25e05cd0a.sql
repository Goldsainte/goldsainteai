-- Grant required permissions on profiles table to fix "permission denied" errors

-- Grant SELECT, INSERT, UPDATE to authenticated users
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Grant SELECT to anon users for public profile viewing
GRANT SELECT ON public.profiles TO anon;