## Audit results

Table `public.agent_applications` owner column: **`user_id`** (no `agent_id` column exists).

Current policies:

| cmd | policy | issue |
|---|---|---|
| INSERT | "Anyone can submit agent application" (public, WITH CHECK true) | overly open |
| INSERT | "Anyone can submit an agent application" (anon+authenticated, WITH CHECK true) | overly open, duplicate |
| SELECT | "Admins can view all agent applications" | keep (rewrite via `has_role`) |
| SELECT | "Applicants can view own application by email" (email-from-JWT OR user_id=auth.uid()) | keep user_id branch, drop email branch |
| UPDATE | "Admins can recover stuck agent applications" | keep |
| UPDATE | "Service role can update applications" | keep (webhooks/edge functions) |
| DELETE | "Admins can delete agent applications" | keep |
| **UPDATE for the owning agent** | **MISSING** | causes the current RLS error on upsert→UPDATE |

This confirms the diagnosis: the upsert resolves to UPDATE, and no policy lets `auth.uid() = user_id` update their own row.

## Fix

One migration that replaces the conflicting policies with a clean, `user_id`-keyed set.

### Migration SQL

```sql
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

-- Agent: INSERT own row (user_id must match the caller)
CREATE POLICY "Agents can insert own application"
ON public.agent_applications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Agent: UPDATE own row  <-- the missing policy
CREATE POLICY "Agents can update own application"
ON public.agent_applications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins: full read access via has_role (replaces inline EXISTS policy)
CREATE POLICY "Admins can view all agent applications"
ON public.agent_applications
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

Kept as-is (already correct):
- "Admins can recover stuck agent applications" (UPDATE, has_role admin)
- "Service role can update applications" (UPDATE, service_role) — needed for edge functions / webhooks
- "Admins can delete agent applications" (DELETE, can_approve_agents)

### Notes

- No app/code changes required — `saveDraftApplication` already writes `user_id = authUser.id`, so the new UPDATE policy will pass.
- Email-based "view by JWT email" branch is dropped: the user_id path covers every authenticated agent, and the email path was a data-exposure surface.
- No `agent_id` column exists, so nothing to migrate from the legacy column.

### Verification

After approval and migration:
1. Submit the agent application logged in as `info@cornellfacilities.com` — should update the existing claimed row and advance to Stripe Identity (step 6).
2. Spot-check a fresh signup: new agent → INSERT path also works under the new INSERT policy.