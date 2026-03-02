

## Fix: Agent Application RLS Error on Submission

### Problem
The agent application form submits an INSERT with `.select().single()` to retrieve the new row's `id`. While the INSERT policy allows anonymous submissions, the SELECT policies require authentication (admin role or matching user_id/email in JWT). Since applicants are unauthenticated, the chained SELECT fails with a 401/RLS violation.

### Solution
Two changes needed:

1. **Database: Add SELECT policy for anonymous inserters** — Create a policy that allows selecting `agent_applications` rows by matching email (passed as a filter), so the `.select()` after insert can return the new row.

   ```sql
   CREATE POLICY "Applicants can read own application by email match"
   ON public.agent_applications
   FOR SELECT
   USING (true);
   ```
   
   Actually, the cleaner approach: since the insert already has `with_check: true` for public, we just need the SELECT to work for the row just inserted. The simplest fix is to **remove `.select().single()`** from the insert call and generate the UUID client-side before inserting, so we already have the ID.

2. **Code change in `src/pages/AgentApplicationForm.tsx`**:
   - Generate `id` client-side using `crypto.randomUUID()` before the insert
   - Include `id` in the insert payload
   - Remove `.select().single()` from the insert chain
   - Use the pre-generated `id` for `setDraftApplicationId` and `setApplicationId`

### Files Changed
- `src/pages/AgentApplicationForm.tsx` — Generate ID client-side, remove `.select().single()`

