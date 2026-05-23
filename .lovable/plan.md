## Findings

I read `ApplicationReviewDashboard.tsx` end-to-end and traced the approve handler. Three of the four items are already correct; only one needs an edit.

### 1. Dead `approved` branches — only one is dead

- **Line 657 (`AgentApplicationDetail`)** — DEAD. Agent lifecycle is now `pending_verification → verified → rejected/failed`. Agents cannot reach `approved`. **Remove this block.**
- **Line 1015 (`BrandApplicationDetail`)** — STILL LIVE. Brands keep the manual-review flow: `handleApprove` at line 1381 invokes `approve-application` with `action:'approve'`, which transitions brand rows to `status='approved'`. This component is brand-only, so the branch is already correctly scoped. **Keep as-is.**

### 2. Metrics tile labels — already accurate

Lines 1338-1346 compute `pendingAgents`/`pendingBrands` from `status === 'pending_verification'`. Line 1559 renders:

> **"Identity Verification In Progress"** — `{pendingAgents + pendingBrands}` — subtext: "Submitted but haven't completed Stripe Identity"

That label already says exactly what you asked for: it represents applicants who started but haven't passed Stripe Identity, not items awaiting admin action. No change.

If you want it even more literal I can change "In Progress" → "Not Yet Complete," but the current text is correct.

### 3. Recovery branch — confirmed working

Line 630 (`status === 'verified' && !application.user_id`) renders a **"Re-run Account Provisioning"** button. Click path:

```
button onClick → setApprovalDialogOpen(true)
            → ApprovalDialog
            → handleApprove (line 1381)
            → supabase.functions.invoke('approve-application',
                { action: 'approve', applicationType: 'agent', ... })
            → approve-application agent branch
            → createAgentAccountFromApplication (idempotent shared helper)
            → fetchApplications() refresh
```

The shared helper is idempotent (no-op if `user_id` already set, rolls back on partial failure, writes to `application_audit_log`). Recovery path is wired and safe.

The accompanying alert at line 622-626 already surfaces the warning ("⚠ Account record missing (webhook may have failed). Click below to re-run provisioning.") so the admin sees why the button is there.

### 4. Filter dropdown (line 1594-1600)

Current options: `all`, `pending_verification`, `verified`, `approved`, `rejected`, `failed`. All five statuses are still in the real lifecycle when you union agent + brand:

- `pending_verification` — both
- `verified` — both (terminal-live for agents, awaiting-review for brands)
- `approved` — brands only (labeled "Approved (Brands)" already)
- `rejected` — both
- `failed` — both (verification failure)

Nothing to remove. Current labels are correct.

## The single change

In `src/pages/admin/ApplicationReviewDashboard.tsx`, delete lines 657-664 (the `application.status === 'approved'` block inside `AgentApplicationDetail`). Leave the identically-structured block at 1015 inside `BrandApplicationDetail` untouched.

## Out of scope

- No edge function, RLS, or migration changes — none of them assume agents reach `approved`.
- No metrics/label rewrite — current copy already reflects the new reality.
- No filter dropdown change — every option still maps to a real status for at least one application type.
