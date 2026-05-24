-- Drop overly-open / duplicate / legacy policies
DROP POLICY IF EXISTS "Anyone can submit agent application" ON public.agent_applications;
DROP POLICY IF EXISTS "Anyone can submit an agent application" ON public.agent_applications;
DROP POLICY IF EXISTS "Anyone can check agent application by email" ON public.agent_applications;
DROP POLICY IF EXISTS "Applicants can view own application by email" ON public.agent_applications;
DROP POLICY IF EXISTS "Admins can view all agent applications" ON public.agent_applications;

-- Agent: SELECT own row
CREATE POLICY "Agents can view own application"
ON public.agent_applications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Agent: INSERT own row
CREATE POLICY "Agents can insert own application"
ON public.agent_applications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Agent: UPDATE own row (the missing policy causing RLS failures on upsert→UPDATE)
CREATE POLICY "Agents can update own application"
ON public.agent_applications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins: full read access via has_role
CREATE POLICY "Admins can view all agent applications"
ON public.agent_applications
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));