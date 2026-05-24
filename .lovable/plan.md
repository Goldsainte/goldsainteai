## Goal

Make `/apply/agent/signup` the single front door for new agents. `/apply/agent` (the application form) should only be reached by an already-authenticated, email-confirmed user resuming their application. Eliminate any flash of the form during the auth-loading window.

## 1. Re-point public/marketing entry points → `/apply/agent/signup`

These are entry points for prospective (unauthenticated) agents. Change the target from `/apply/agent` to `/apply/agent/signup`:

- `src/components/Footer.tsx` line 27 — "Apply as a Travel Agent" link
- `src/components/Footer.tsx` line 20 — "Find a Specialist" (this is mis-targeted; should point to `/marketplace` or `/agents`, not the application form — re-point to `/agents` / browse, NOT signup)
- `src/components/Header.tsx` lines 330 and 586 — agent CTAs
- `src/components/home/RoleSpecificCTAs.tsx` line 46 — "Apply as a Travel Agent"
- `src/sections/HomeLuxurySections.tsx` line 58
- `src/pages/HowItWorksAgent.tsx` lines 7 and 33 — "Apply now" CTA buttons
- `src/data/siteRoutes.ts` line 49 — update the registered marketing path label/target to `/apply/agent/signup`
- `src/pages/HelpCenter.tsx` line 45 — "Become an Agent" link
- `src/pages/Profile.tsx` line 252 — "Become an Agent" button (this is an unauthenticated-or-not-yet-agent user clicking from their profile; goes to signup)

## 2. Re-point authenticated-but-resuming entry points → `/apply/agent`

These already imply a signed-in user; keep them pointing at the form, but they will pass through the form's hardened gate which will bounce unauth users to signup. No change required, just confirmed:

- `src/components/routing/OnboardingRouter.tsx` lines 62/73/81 — already correctly differentiates verified vs unverified
- `src/lib/auth/postAuthRouting.ts` line 42 — post-login routing for an agent profile
- `src/hooks/useRequireOnboarding.ts` line 58 — already inside an authenticated context
- `src/pages/AgentDashboard.tsx` lines 161 and 333 — only reachable when signed in
- `src/pages/AuthCallback.tsx` line 179 — see #3
- `src/contexts/AuthContext.tsx` line 254 — error-message string only; update text to reference `/apply/agent/signup` for clarity

## 3. Fix `Auth.tsx` line 375 and `AuthCallback.tsx` line 179

- **`src/pages/Auth.tsx` line 373–377**: When `selectedAccountType === 'agent'` during email/password signup, do NOT call the account-creation auth code on this page. Instead, navigate to `/apply/agent/signup` and pass the typed `email`, `firstName`, `lastName`, `phone`, `smsOptIn` via `navigate` state so `AgentSignup` can prefill its form. Update the toast copy to say "Create your agent account" instead of "redirected to the application form".
- **`src/pages/AuthCallback.tsx` line 174–181**: A Google OAuth user who picked "agent" already has a verified email (Google verifies). They should go directly to `/apply/agent` (the form) — which is current behavior — but only after we ensure their `account_type` is set to `agent`. Add that update (mirroring the traveler/creator branch above it) before the navigate. No URL change.

## 4. Harden `AgentApplicationForm.tsx` gate

The current gate at lines 906–918 returns early on `authLoading`, but the three `useEffect`s above (prefill at 156, draft-restore at 200, autosave at 228) still run on mount before the gate decides to redirect. The draft-restore effect in particular shows a `window.confirm()` to anyone hitting the URL — including unauthenticated visitors — for a flash.

Fix by extracting the form body into a child component `<AgentApplicationFormInner />` and have the outer `AgentApplicationForm` do ONLY the gate:

```text
export default function AgentApplicationForm() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/apply/agent/signup" replace />;
  if (!user.email_confirmed_at)
    return <Navigate to="/apply/agent/signup?unverified=1" replace />;
  return <AgentApplicationFormInner user={user} />;
}
```

Move all existing state, effects, handlers, and JSX into `AgentApplicationFormInner`. Because that component only mounts after the gate passes, none of its effects (prefill, draft restore, autosave) can fire for an unauthenticated user, and the form cannot flash.

## 5. Confirm single application form

Confirmed by file scan: the only agent application form is `src/pages/AgentApplicationForm.tsx`. `src/pages/apply/` contains only `BrandOnboarding.tsx`. `AppRoutes.tsx` routes `/apply/agent` → `AgentApplicationForm` and `/apply/agent/signup` → `AgentSignup`. No stale/duplicate page. The legacy `/agent-onboarding` route already redirects to `/apply/agent` (which now passes through the hardened gate). No deletions needed.

## Verification

After implementation, manually test:
1. Logged-out, click "Apply as a Travel Agent" from footer, header, homepage → all three land on `/apply/agent/signup`.
2. Logged-out, type `/apply/agent` directly → instant redirect to `/apply/agent/signup`, no flash of the form, no draft-restore confirm dialog.
3. From `Auth.tsx` signup form pick "agent" → lands on `/apply/agent/signup` (not the application form).
4. Complete signup → email link → `/apply/agent?verified=1` → form renders prefilled.
5. Mid-application close+reopen, sign in again → routed to `/apply/agent` to resume.

## Files to edit

- `src/components/Footer.tsx`
- `src/components/Header.tsx`
- `src/components/home/RoleSpecificCTAs.tsx`
- `src/sections/HomeLuxurySections.tsx`
- `src/pages/HowItWorksAgent.tsx`
- `src/pages/HelpCenter.tsx`
- `src/pages/Profile.tsx`
- `src/data/siteRoutes.ts`
- `src/contexts/AuthContext.tsx` (error string only)
- `src/pages/Auth.tsx`
- `src/pages/AuthCallback.tsx`
- `src/pages/AgentApplicationForm.tsx` (extract inner component for hardened gate)
