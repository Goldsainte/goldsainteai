## Plan

Deploy the `request-password-reset` edge function so the "Send Reset Link" button on the Auth page stops returning 404.

### Steps
1. Run `supabase--deploy_edge_functions` with `function_names: ["request-password-reset"]`.
2. Tail logs via `supabase--edge_function_logs` for `request-password-reset` to confirm the function boots without env errors (it requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which are auto-provided).
3. Call the function with `supabase--curl_edge_functions` using a test email to verify it responds 200 and enqueues the email.
4. Report back so you can retry the reset flow in the browser.

### Notes
- No code changes — this is a deploy-only action.
- If step 3 fails, I'll pull logs and iterate (likely candidates: missing `enqueue_email` RPC, missing `email_unsubscribe_tokens`/`email_send_log` tables, or the email queue worker not running).
- Frontend doesn't need republishing; edge functions go live immediately on deploy.