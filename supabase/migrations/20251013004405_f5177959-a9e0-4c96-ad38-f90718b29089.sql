-- Fix moments foreign key to reference profiles instead of auth.users
ALTER TABLE public.moments 
DROP CONSTRAINT IF EXISTS moments_user_id_fkey;

ALTER TABLE public.moments 
ADD CONSTRAINT moments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;