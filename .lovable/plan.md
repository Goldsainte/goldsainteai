# Remove Admin Approval for Agents — Stripe Identity = Auto-Approval

Mirror the creator self-serve model: completing the 6-step `/apply/agent` form + Stripe Identity creates a live agent account automatically. No admin in the loop. Stripe Connect (payouts) remains a separate, post-login step gated only at trip-publish time.

## Auth approach (Item 2): Option A — agent sets password in the form
Same shape as the creator flow. Add a password step to `/apply/agent`, create the auth user with `supabase.auth.signUp` at form submit (so they're logged in for Identity), and use that `user.id` as `agent_id` going forward. **No temp passwords. No password emails.** Cleaner, removes Resend single-point-of-failure for login.

## Files I intend to change (scope for your confirmation)

**Backend (edge functions)**
1. `supabase/functions/_shared/createAgentAccount.ts` — **NEW**. Shared helper extracted from `approve-application`: upsert `profiles` (`account_type:'agent'`, role wiring), insert `travel_agents` (`status:'active'`), insert `user_roles` (`agent`), mark `agent_applications.user_account_created=true`, write `application_audit_log`, with the existing rollback-on-failure block. Idempotent (no-op if `user_account_created` already true).
2. `supabase/functions/stripe-identity-webhook/index.ts` — in `updateAgentApplication`, on `verified` call the shared helper instead of notifying admin. Keep existing rejection path. Add a structured error log + audit row when helper throws (this is how we surface "verified-but-no-account").
3. `supabase/functions/approve-application/index.ts` — agent branch becomes a thin wrapper that calls the shared helper (kept for brands + manual re-run safety net). Remove temp-password generation + welcome-email-with-credentials for agents (brand path unchanged for now).
4. `supabase/functions/notify-admin-verification-complete/index.ts` — stop firing for agents (brand-only).
5. `supabase/functions/agent-verification-webhook/index.ts` — already writes `verification_status:'verified'` on profiles; confirm it still runs but no longer the gate.

**Frontend — application flow**
6. `src/pages/AgentApplicationForm.tsx` — add password (+ confirm) field; on submit do `supabase.auth.signUp({email,password})` first, then insert `agent_applications` with `agent_id = user.id`. Update step-6 copy: "Verify your identity to activate your account instantly — no waiting for review."
7. `src/pages/ApplicationVerificationComplete.tsx` — replace "Our team will review… we'll email you when approved" with "Your account is live. Continue to dashboard" CTA → `/agent` (or `/creator-dashboard?tab=earnings` to nudge Stripe Connect).
8. `src/pages/ApplicationStatusCheck.tsx` — collapse status display: `pending_verification` → "Complete identity verification", `verified` → "Account active, sign in", remove `approved` branch.

**Frontend — admin teardown (Item 3)**
9. `src/pages/AdminAgentApprovals.tsx` — **DELETE**.
10. `src/routes/AppRoutes.tsx` — remove lazy import + `/admin/agent-approvals` route.
11. `src/pages/admin/ApplicationReviewDashboard.tsx` — remove agent "Approve/Reject" action UI (lines ~616, 974) and the agent `approved` branches (~653, 1011); keep brand approval intact. Update metrics tiles (~1339-1342): drop `verifiedAgents` vs separate "approved" count — for agents, `verified` = live.
12. Grep sweep for any nav link to `/admin/agent-approvals` in admin sidebar/menu and remove.

**Frontend — agent post-login (Item 5)**
13. `src/pages/agent/components/AgentSettingsTab.tsx` / Earnings tab — verify Stripe Connect onboarding CTA is present and reachable (it already calls `check-creator-stripe-status`). If the Earnings tab is creator-only, surface the same component for `account_type='agent'`. This is the only thing preventing a verified agent from publishing.

**Database (Item 4)**
14. **New migration** — narrative comment + drop the `agent_applications` admin UPDATE policy now that no admin writes status for agents (verified via migration grep: `20251202054353`, `20251203060646`, `20260518045229`). Brand admin policies stay. Update the `status` column comment from `pending_verification -> verified -> approved/rejected` to `pending_verification -> verified | rejected` for agents.

## Item 4 — full status-dependency report (grep results)

`agent_applications.status` / `admin_status` references found in app code:

| File | Lines | Action |
|---|---|---|
| `admin/ApplicationReviewDashboard.tsx` | 616, 635, 653, 974, 993, 1011, 1339-1342, 1439, 1456 | Remove agent `approved` branches; treat `verified`=live for agent metrics |
| `AdminAgentApprovals.tsx` | whole file | Delete |
| `ApplicationStatusCheck.tsx` | 67, 113, 133, 140, 148 | Drop `approved` and `pending_review` agent branches |
| `ApplicationVerificationComplete.tsx` | 49, 61 | Rewrite copy; treat `verified` as terminal-success |
| `AgentApplicationForm.tsx` | step-6 copy | Update messaging |
| `agent/components/AgentSettingsTab.tsx` | 41, 76, 195 | Reads `travel_agents.status` (not application status) — no change |
| `approve-application/index.ts` | agent branch | Becomes shared-helper wrapper |
| `stripe-identity-webhook/index.ts` | `updateAgentApplication` | Auto-creates account on `verified` |
| `notify-admin-verification-complete` | — | Skip agents |

RLS / migrations touching agent_applications statuses: `20251125030011`, `20251202054353`, `20251203060646`, `20260518045229`. Admin UPDATE policy for agent_applications is now dead-weight — drop in the new migration. No RLS predicates currently key off `status='approved'` for agents, so no access regressions.

## Reliability concerns you raised

- **Webhook failure = verified-but-no-account.** Mitigations: (a) shared helper is idempotent on `user_account_created`; (b) `approve-application` kept as manual re-run for an admin if needed; (c) new audit log row on helper failure; (d) `ApplicationReviewDashboard` gets a filter "Verified but no account" so we can see stuck rows. I'll add (d) explicitly.
- **Three→two stage collapse.** Above table is exhaustive per grep — no other consumers.

## Confirmation flow after build

`/apply/agent` (email+password+5 steps) → `signUp` → Stripe Identity → webhook fires → shared helper creates `profiles` + `travel_agents` + `user_roles` → `ApplicationVerificationComplete` shows "Account active" → login (already signed in from `signUp`) → terms modal → `/agent` dashboard → Earnings tab → Stripe Connect onboarding → `/trip-builder` publish succeeds (`stripe_charges_enabled=true`).

Awaiting your confirmation on scope before switching to build mode.
