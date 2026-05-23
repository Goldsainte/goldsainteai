## Fix welcome email prop name mismatch + production readiness check

### 1. Fix AuthCallback.tsx
Line 130: change `templateData: { firstName, accountType }` to `templateData: { name: firstName, accountType }`.
Both welcome templates (`welcome-traveler.tsx`, `welcome-professional.tsx`) destructure a prop named `name`. `firstName` was silently ignored, causing the generic fallback greeting.

### 2. Re-deploy send-transactional-email
The edge function reads `templateData` at runtime. After the code change, deploy so the fix is live.

### 3. Preview both welcome templates
Call `preview-transactional-email` (or render locally) with `name: 'Alex'` for `welcome-traveler` and `name: 'Maison Atelier', accountType: 'agent'` for `welcome-professional`. Confirm the headline renders the personalized greeting, not the fallback.

### 4. Verify cron job exists and is active
Run `SELECT * FROM cron.job WHERE jobname = 'process-email-queue';` Confirm `active = true` and schedule is `*/5 * * * *` (or equivalent).

### 5. Verify Send Email Hook is wired
Check the project's auth settings to confirm the "Send Email Hook" URL points to the deployed `auth-email-hook` edge function with the correct secret.

### 6. Burst test
Manually enqueue 5 welcome emails in rapid succession to confirm the queue drains them without rate-limit errors or stuck pending rows.