## Plan

### What I will change

1. **Lock the document step to the 2-document flow**
   - Keep only **Business License** and **Insurance Certificate** in the document step.
   - Keep **Government ID** and **Professional Headshot** out of this step because identity verification is already handled in the next step by **Stripe Identity**.
   - Make sure the UI, `formData`, required-doc validation, upload calls, and edge function all match this exact 2-document contract.

2. **Harden upload authorization and auth readiness**
   - Update the submit/upload path so uploads only run when there is a real authenticated user with a confirmed email.
   - Use the current authenticated session/user as the source of truth before calling `upload-application-document`.
   - If auth is not ready or the user is not confirmed, keep the user on the document step with a clear error instead of attempting upload and getting a backend 403.

3. **Remove the duplicate “Document Upload” title**
   - Remove one of the two headings so the document step shows the title only once.
   - I’ll keep the heading inside `Step10Documents` and remove the extra `SectionHeader` from `AgentApplicationForm.tsx`.

4. **Verify step completion behavior**
   - Confirm the step requires the correct document(s), shows upload errors inline, and advances to **Stripe Identity verification** after successful upload and save.

### What I found in the current code

- The live `Step10Documents` component in the codebase already renders **2 upload fields**, not 4.
- `formData` also only tracks **2 file fields**.
- The edge function allowlist also only accepts **2 field names**.
- So the correct route is the one you asked for: **the 2-document route**, not wiring up all four.
- The remaining issues I found are:
  - the page still renders a **duplicate Document Upload header**
  - the submit path still needs a stricter **auth/session readiness guard** to avoid upload attempts when the authenticated user is not fully available
  - there is stale/misleading inline commentary in `AgentApplicationForm.tsx` that still references four documents

### Files to update

- `src/pages/AgentApplicationForm.tsx`
- `src/components/applications/steps/Step10Documents.tsx` (only if needed for messaging/consistency)
- `supabase/functions/upload-application-document/index.ts` (only if auth validation or messaging needs tightening)

### Validation

After implementation, I will test the flow by:
- reaching the **Documents** step as a confirmed authenticated user
- uploading the required document files
- confirming the upload request succeeds
- confirming the application saves successfully
- confirming the flow advances to **Stripe Identity verification**

### Technical notes

- No database migration should be needed.
- The chosen fix is: **remove the redundant Gov ID + headshot path and keep the document flow at exactly two uploads**.
- If the blocker reproduces after the code changes, I’ll inspect the edge function response path directly to determine whether the failure is a frontend auth-timing issue or a backend validation failure.