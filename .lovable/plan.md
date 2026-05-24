# Fix agent application documents and upload blocker

## What I’ll change

1. Remove the redundant document requirements
- Remove **Government ID** and **Professional Headshot** from the agent application form.
- Keep identity verification in the final verification step through **Stripe Identity** only.
- Update the copy so the form no longer asks for documents that Stripe already collects later.

2. Fix the upload flow that is currently broken
- Replace the old inline upload UI in `AgentApplicationForm.tsx` with the newer `Step10Documents` component so the actual validation/error UI is used.
- Fix the step navigation bug: the form currently has **6 steps**, but upload failures are sending users to **step 10**. I’ll route failures back to the real Documents step instead.
- Make the documents step require only the remaining uploads needed for the application.

3. Update submission logic
- Remove Government ID and Headshot from the required upload list and from the upload calls.
- Stop writing `document_government_id` and `document_headshot` during application save.
- Preserve Business License and Insurance Certificate handling.

4. Align the upload edge function
- Remove unused upload field allowances for `government_id` and `headshot` from `upload-application-document` so the backend matches the form.
- Keep the current file type support for PDFs/JPG/PNG/HEIC/HEIF on the documents that remain.

## Why this should fix the blocker
I found two concrete problems in the current code:
- The form is still rendering an **older upload block** instead of the improved upload component, so the better validation and inline errors are not actually in use.
- On upload failure, the code sends users to **step 10**, but the form only has **6 steps**. That can trap the flow and make it feel like uploads never work.

## Technical notes
- Files involved:
  - `src/pages/AgentApplicationForm.tsx`
  - `src/components/applications/steps/Step10Documents.tsx`
  - `supabase/functions/upload-application-document/index.ts`
- I do **not** need a database migration for this change because the existing document columns can simply remain unused.
- I’ll verify the fix by checking the document-step wiring and making sure the upload error path returns to the correct step with visible feedback.