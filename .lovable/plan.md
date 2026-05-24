# Agent run fixes

## 1. (BLOCKER) Fix document upload RLS — `src/pages/AgentApplicationForm.tsx`

`handleFileUpload` currently builds:
```
agent-applications/{email}/{fileName}
```
First folder segment is the literal `agent-applications`, so the policy `(storage.foldername(name))[1] = auth.uid()::text` always fails.

Change:
- `handleFileUpload(file, fieldName)` → accept `userId` and build `${userId}/agent-applications/${fileName}` (UID first, descriptive subfolder second, no email in path — emails can contain `@`/`.` which are messy in keys and leak PII).
- In `saveDraftApplication`, pass `authUser.id` into each `handleFileUpload(...)` call. The sign-up that produces `authUser` already runs before the uploads.
- Guard: if `!authUser?.id`, abort with a clear toast before attempting uploads.

No other code reads these paths from storage directly (`rg` shows only this file writes them; the path string is stored on `agent_applications.document_*` columns and read by admins via signed URLs, which work regardless of folder layout). Existing records keep their old paths; only new uploads use the new layout.

Verify: real upload of all four documents in the agent flow completes without an RLS error; rows appear under `{uid}/agent-applications/...` in the `application-documents` bucket.

## 2. (BLOCKER) Fix legal links — `src/pages/AgentApplicationForm.tsx` (~L787–789)

In the legal-acceptance array:
- `"Privacy Policy"` link `/privacy` → `/privacy-cookies` (confirmed route at `AppRoutes.tsx:192`).
- `"Agent Partnership Agreement"` link `/vendor-agreement` → `/legal/agent-agreement` (confirmed at `AppRoutes.tsx:207`).
- `"Terms of Service"` link `/terms` stays.

Also add `rel="noopener noreferrer"` alongside the existing `target="_blank"` on all three anchors so the agent doesn't lose progress and we don't open a tabnabbing hole.

Verify: click each of the three links in the form, each loads its real page in a new tab.

## 3. Diagnose Stripe Identity "Verification Issue"

Read-only investigation, no code changes yet:

1. Find the most recent `agent_applications` row with a `stripe_identity_session_id` (or whichever column stores it) — pull `id`, `email`, `admin_status`, `created_user_id`, `stripe_identity_status`, `stripe_connect_account_id`.
2. Pull `stripe-identity-webhook` edge function logs for that session id — confirm whether Stripe delivered `identity.verification_session.verified` and whether the handler returned 200.
3. Pull `create-agent-application-stripe-account` logs (and any `createAgentAccountFromApplication` invocation) for the same application id — look for thrown errors, especially `connect_not_enabled`, missing `SITE_URL`, or "Application must be approved first".
4. Query `application_audit_log` for that application_id where `action` IN (`identity_verified`, `identity_failed`, `account_provision_failed`, `account_provisioned`).
5. Check `webhook_events` table for the matching Stripe event id to confirm idempotency wasn't the culprit.

Report findings: which of the three layers failed (Stripe session itself / identity webhook / account-provisioning function / front-end branch), with the exact error message and the audit-log row id. Only then propose a fix in a follow-up.

## 4. Full agent run re-test

After (1) and (2) ship and (3) is diagnosed, run the end-to-end agent flow again and report each stage: sign-up → application form (incl. all 4 doc uploads + 3 legal links) → submit → Stripe Identity verification → return page → audit-log + DB state.

## Technical notes

- Files touched: `src/pages/AgentApplicationForm.tsx` only (sections 1 and 2). No migrations — existing storage policy is already correct; we're conforming the client to it.
- Diagnosis tools: `supabase--edge_function_logs`, `supabase--read_query` on `agent_applications`, `application_audit_log`, `webhook_events`.
- `BrandOnboarding.tsx` uses the same bucket; **out of scope** for this task (brand flow isn't part of the agent run), but worth flagging for the post-launch cleanup pass — it likely has the same RLS bug.
