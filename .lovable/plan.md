## Fix: Agent Application Document Uploads (RLS failure + silent advancement)

### Root cause (confirmed)
In `src/pages/AgentApplicationForm.tsx`, `supabase.auth.signUp()` creates the user but, with email confirmation enabled, **no session is established**. `authUser.id` is populated so the path looks valid, but `auth.uid()` is `null` for the storage request — RLS rejects the upload. Then `handleFileUpload` swallows the error, returns `null`, and the application row is inserted with null document paths.

### Part 1 — Server-side uploads via Edge Function (option a)

Create `supabase/functions/upload-application-document/index.ts`:
- Uses the **service-role key** (bypasses storage RLS).
- Accepts `multipart/form-data`: `file`, `userId`, `applicationEmail`, `fieldName` (one of `business_license` | `insurance_certificate` | `government_id` | `headshot`).
- Validates: field name allow-list, MIME (pdf/jpeg/png), size ≤ 50MB, that `userId` matches an existing `agent_applications` row with the same `email` (prevents arbitrary writes into someone else's folder during the pre-session window).
- Writes to `application-documents/${userId}/agent-applications/${Date.now()}_${fieldName}.${ext}` and returns `{ path }`.
- CORS + `verify_jwt = false` (no session exists yet during signup).

Rewrite `handleFileUpload` in the form to call this function via `supabase.functions.invoke('upload-application-document', { body: formData })` instead of `supabase.storage.upload(...)`. Path conventions stay identical so existing readers/signed-URL code continues to work.

### Part 2 — Hard-block submission on any upload failure

Refactor `saveDraftApplication` so upload failures abort:
- Change `handleFileUpload` to **throw** on failure (no silent `return null`, no inline toast — let the caller surface one toast).
- Wrap the four uploads in a `try/catch` that:
  - calls `setCurrentStep(5)` (Documents step) to keep the user there,
  - shows a destructive toast with the failing field + reason,
  - sets `setIsLoading(false)` so the "Saving…" button reverts,
  - `return`s before the `agent_applications` insert runs.
- For each of the four required document fields, also pre-validate the `File` object exists before attempting submission; if missing, block with a field-specific message.
- Only insert the `agent_applications` row **after** all four uploads succeed and we have four non-null paths.

### Files touched
- **new** `supabase/functions/upload-application-document/index.ts`
- **edit** `src/pages/AgentApplicationForm.tsx` (`handleFileUpload`, `saveDraftApplication`)

No DB migration needed — storage bucket and RLS policies stay as-is (browser path is no longer used for these uploads, but policies remain correct for any authenticated re-upload later).

### Verification
1. Fresh signup, upload all four documents → confirm 4 objects appear under `application-documents/${userId}/agent-applications/` and `agent_applications` row has all four `*_path` columns populated.
2. Force a failure (e.g., 60MB file) → toast shows, button returns to "Submit", user stays on step 5, no `agent_applications` row is inserted.
3. Existing admin review screens still load the documents via the same paths.
