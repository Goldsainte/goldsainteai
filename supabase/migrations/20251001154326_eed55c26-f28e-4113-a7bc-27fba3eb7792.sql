-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'agent');

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update travel_agents table policies to require verification
DROP POLICY IF EXISTS "agents_public_view" ON public.travel_agents;
CREATE POLICY "agents_public_view"
ON public.travel_agents
FOR SELECT
USING (is_active = true AND is_verified = true);

-- Policy for admins to view all agents
CREATE POLICY "admins_view_all_agents"
ON public.travel_agents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy for admins to update agent verification
CREATE POLICY "admins_update_agent_verification"
ON public.travel_agents
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add agent role when agent profile is created
CREATE OR REPLACE FUNCTION public.assign_agent_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'agent')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_agent_created
  AFTER INSERT ON public.travel_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_agent_role();