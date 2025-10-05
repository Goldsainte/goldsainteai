-- Add server-side role validation for admin-only operations

-- Agent verification requests should only be approved by admins
DROP POLICY IF EXISTS "Admins can update verification requests" ON public.agent_verification_requests;
CREATE POLICY "Admins can update verification requests server-side"
ON public.agent_verification_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Customer verifications should only be managed by admins
DROP POLICY IF EXISTS "Admins can manage all verifications" ON public.customer_verifications;
CREATE POLICY "Admins can manage all verifications server-side"
ON public.customer_verifications
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Activity logs admin access should be server-side validated
DROP POLICY IF EXISTS "Admins can view all activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view all activity logs server-side"
ON public.activity_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Marketplace disputes resolution should be admin-only
CREATE POLICY "Only admins can resolve disputes"
ON public.marketplace_disputes
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- User roles table should only be manageable by admins
CREATE POLICY "Only admins can manage user roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Enable RLS on user_roles if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;