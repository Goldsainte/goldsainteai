## Confirmed targets

- **Beach-photo "Apply as Travel Agent" page (KEEP, edit):** `src/pages/Auth.tsx` at route `/auth` (specifically `/auth?mode=signup&role=agent`). The split-screen with the Unsplash beach hero on the left, and email / first name / last name / phone / SMS opt-in fields on the right.
- **Duplicate to DELETE:** `src/pages/AgentSignup.tsx` at route `/apply/agent/signup`.
- **6-step application (KEEP unchanged structurally):** `src/pages/AgentApplicationForm.tsx` at route `/apply/agent`.

Final flow: `/auth?mode=signup&role=agent` (beach photo, now with password + verification) → "check your email" state → email link → `/apply/agent?verified=1` (6-step form, prefilled).

## 1. Move signup + verification logic into `Auth.tsx`

In the agent branch of the signup submit handler (currently the block at line ~373–377 that navigates to `/apply/agent/signup`):

- Add **password** and **confirm password** fields to the agent signup form (only when `selectedAccountType === 'agent'`; the existing email/password Auth flow already has password fields for other roles — reuse the same `Input` styling and the existing `passwordSchema` validator at the top of the file).
- On submit for agent role: call `supabase.auth.signUp({ email, password, options: { emailRedirectTo: \`${window.location.origin}/apply/agent?verified=1\`, data: { first_name, last_name, phone, sms_opt_in, account_type: 'agent', intended_flow: 'agent_application' } } })`.
- Reuse the duplicate-email guards (`isDuplicateEmailError`, `isDuplicateEmailSignupResponse`) — already imported in Auth.tsx.
- Defensive `supabase.auth.signOut()` if `data.session` or `data.user.email_confirmed_at` is returned (auto-confirm safety net), so the user never silently skips verification.
- On success, switch the page into a **"check your email" state** (new local state `agentCheckEmailFor: string | null`) that renders the MailCheck card currently in AgentSignup.tsx (lines 165–214) — confirmation message, resend button calling `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: '/apply/agent?verified=1' } })`, and a "Start over" link.
- Do NOT navigate away after submit; the user stays on `/auth` until they click the email link.

## 2. Delete `AgentSignup.tsx` and its route

- Delete `src/pages/AgentSignup.tsx`.
- In `src/routes/AppRoutes.tsx` remove line 352 (`<Route path="/apply/agent/signup" element={<AgentSignup />} />`) and its import.

## 3. Repoint links back to `/auth?mode=signup&role=agent`

Files I changed in the previous loop that pointed to `/apply/agent/signup` — revert each to `/auth?mode=signup&role=agent`:

- `src/components/Footer.tsx` ("Apply as a Travel Agent")
- `src/components/Header.tsx` (two CTAs)
- `src/components/home/RoleSpecificCTAs.tsx`
- `src/sections/HomeLuxurySections.tsx`
- `src/pages/HowItWorksAgent.tsx` (two CTAs)
- `src/pages/HelpCenter.tsx`
- `src/pages/Profile.tsx`
- `src/data/siteRoutes.ts` (replace the `/apply/agent/signup` entry with the existing `/auth` entry — no duplicate needed)
- `src/contexts/AuthContext.tsx` (error-string reference only)
- `src/pages/AgentApplicationForm.tsx`: the hardened gate currently redirects unauthenticated users to `/apply/agent/signup`. Change both `<Navigate>` targets to `/auth?mode=signup&role=agent` (and `?unverified=1` query for the unverified branch).
- `src/pages/AuthCallback.tsx`: no change to the Google branch (already navigates to `/apply/agent` after promoting account_type to agent).

## 4. Keep the hardened gate on `AgentApplicationForm`

The `AgentApplicationFormInner` extraction from the previous loop stays — it still prevents flash-of-form for unauthenticated visitors hitting `/apply/agent` directly. Only the redirect targets change (see above).

## 5. Confirm "exactly one of each"

After this work:
- **One quick-signup page for agents:** `src/pages/Auth.tsx` at `/auth?mode=signup&role=agent` (beach-photo, with new password + email-verify state).
- **One 6-step application:** `src/pages/AgentApplicationForm.tsx` at `/apply/agent` (gated; only reached post-verify).
- No `AgentSignup.tsx`, no `/apply/agent/signup` route.

## Verification

1. Logged-out → Footer / Header / Homepage "Apply as a Travel Agent" → all land on `/auth?mode=signup&role=agent` (beach photo).
2. Fill form (incl. password + confirm) → click Continue → "Check your email" panel renders on the same page.
3. Click email link → lands on `/apply/agent?verified=1` with name/email/phone prefilled from signup metadata.
4. Logged-out, go directly to `/apply/agent` → instant redirect to `/auth?mode=signup&role=agent`, no flash.
5. `grep "/apply/agent/signup"` returns zero results across `src/`.

## Files to edit

- `src/pages/Auth.tsx` (add password + verify state for agent branch)
- `src/routes/AppRoutes.tsx` (remove route + import)
- `src/pages/AgentSignup.tsx` (delete)
- `src/components/Footer.tsx`, `src/components/Header.tsx`, `src/components/home/RoleSpecificCTAs.tsx`, `src/sections/HomeLuxurySections.tsx`, `src/pages/HowItWorksAgent.tsx`, `src/pages/HelpCenter.tsx`, `src/pages/Profile.tsx`, `src/data/siteRoutes.ts`, `src/contexts/AuthContext.tsx`, `src/pages/AgentApplicationForm.tsx` (repoint links/redirects)
