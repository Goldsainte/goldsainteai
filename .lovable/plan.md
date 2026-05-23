# Creator Journey — End-to-End Fixes

## Decisions

1. **Manual creator approval is intentional.** `AdminCreatorApprovalsPage` exists and admin sign-off is the curation moat for Goldsainte. We keep `creator_status: "pending"` on onboarding completion and `TripBuilderPage` keeps the `!== "approved"` publish gate. Fix the UX so creators are never surprised by it.
2. **Avatars bucket is fine.** The current RLS (`(storage.foldername(name))[1] = auth.uid()::text`) matches `${user.id}/cover/${ts}.ext` because `foldername[1]` is the first path segment (`user.id`), not the last. No migration needed — but we'll add a code comment so a future refactor doesn't blindly move it.

## Changes

### 1. `src/pages/onboarding/CreatorOnboardingPage.tsx`

**Welcome card (post-submit screen, ~line 339–395)** — replace the generic "Welcome to Goldsainte / Creator Partner" card with a clear two-status panel:

- Pending review banner: "Your profile is in review. Our editors typically respond within 1–2 business days. You can build trip drafts now, but publishing unlocks after approval."
- Stripe payouts row: "Set up payouts (required before publishing)" with a button linking to `/creator-dashboard?tab=earnings` (Earnings tab is where Stripe Connect lives).
- Keep "View Your Dashboard" CTA.

**Fee inputs (handleSubmit, lines 274–275)** — replace:
```ts
planning_fee_amount: planningFee ? parseInt(planningFee) * 100 : null,
itinerary_fee_amount: itineraryFee ? parseInt(itineraryFee) * 100 : null,
```
with a `toCents(value)` helper that:
- returns `null` for empty
- `parseFloat`, rejects `NaN` / negative / `> 1_000_000`
- returns `Math.round(n * 100)`
- on invalid: `toast.error("Enter a valid non-negative fee (e.g. 150.50).")` and abort submit before the DB write.

Also clamp the `<Input type="number">` for fees with `min="0"` `step="0.01"`.

**Stale step comments (lines 102 / 108 / 119)** — renumber so they match the 5-step `STEPS` array and the JSX comments below:
- `// Step 2: Your Niche` → `// Step 3: Your Niche`
- `// Step 3: Portfolio (all optional)` → `// Step 4: Portfolio (all optional)`
- `// Step 4: Standards & Legal` → `// Step 5: Standards & Legal`

(The `// Step 1: About You` and the existing JSX `Step 2: Social Profile` etc. are already correct.)

**`handleSkip` (lines 169–196)** — currently sets `account_type/role: "creator"` but never sets onboarding flags, then routes to `/creator-dashboard`. `useRequireOnboarding` for creators checks `onboarding_completed || has_completed_creator_onboarding`; neither is set → user gets bounced straight back to `/onboarding/creator`. So the loop is broken today.

Fix: route Skip to `/creator-dashboard?onboarding=resume` (which dashboard already understands as "incomplete creator") AND keep flags unset so they're forced to resume. To make that work without the redirect bounce, update the routing path so skipped-creator state lands somewhere usable:
- Set `has_completed_creator_onboarding: false` explicitly (already default, but explicit).
- Navigate to `/onboarding/creator?resume=1` instead of `/creator-dashboard` — this matches the existing prefill logic in `loadExistingProfile` and avoids the dashboard bounce.
- Update toast: "Progress saved. Pick up where you left off anytime."

(If you'd rather Skip drop them on the dashboard with a banner, that's a follow-up — current `useRequireOnboarding` makes that a bigger change.)

**Cover upload (line 655–656)** — leave logic alone, add a one-line comment above the upload:
```ts
// Path MUST start with `${user.id}/...` — avatars RLS scopes by (storage.foldername(name))[1].
```

### 2. `src/pages/TripBuilderPage.tsx`

No logic change. Improve the publish-gate toasts (lines 113 and 119) to be actionable:
- pending: `"Your creator profile is still under review by our editors — you can save drafts and we'll unlock publishing once approved."`
- no stripe: `"Connect your payout account in Earnings before publishing your first trip."` + a second `toast()` with a link to `/creator-dashboard?tab=earnings`.

## Flow confirmation after fixes

```text
Signup (Google or email)
  → AuthCallback fires welcome-traveler email (name prop now correct)
  → AccountTypeStep: pick "Creator"
  → /onboarding/creator
      Step 1 About You ─ Continue gated by displayName+bio+homeBase ─ Back disabled
      Step 2 Social    ─ Continue gated by primary platform + matching handle ─ Skip routes to /onboarding/creator?resume=1
      Step 3 Niche     ─ Continue gated by ≥1 niche + ≥1 destination
      Step 4 Portfolio ─ all optional; cover upload to avatars/{uid}/cover/* (RLS-compliant)
      Step 5 Standards ─ Launch gated by 5 checkboxes; fees parsed via toCents
  → handleSubmit writes creator_status:"pending", onboarding_completed:true
  → Welcome card shows: "In review" banner + "Set up payouts" CTA → /creator-dashboard?tab=earnings
  → Dashboard → Earnings tab → Stripe Connect onboarding (creator-stripe-onboarding edge fn)
  → Trip Builder → Save Draft works any time
  → Publish blocked until creator_status='approved' AND stripe_account_id present (toasts now actionable)
  → After admin approves in /admin/creators, publish writes status='pending_review' to packaged_trips
  → Trip appears in marketplace pipeline as pending_review (admin promotes to live)
```

## Out of scope

- Adding an in-onboarding Stripe Connect step (would require a 6th step + return-URL handling). The welcome-card CTA + Earnings-tab flow covers the gap for now.
- Migrating cover images to a dedicated bucket. Current path is RLS-compliant; revisit if we add per-asset size or MIME limits.
