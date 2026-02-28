

## Streamline Creator Onboarding: 13 Steps → 5 Steps

The current 13-step wizard is excessive. Most platforms collect this in 2-3 screens. The plan consolidates into 5 focused steps by merging related screens and deferring non-essential data.

### Current 13 Steps → Proposed 5 Steps

```text
CURRENT (13 steps)              →  PROPOSED (5 steps)
──────────────────────────────      ─────────────────────────
0. Identity                    ─┐
1. Social                      ─┤→  Step 1: "About You"
                                │   (name, photo, bio, home base,
                                │    primary platform, social handles)
                                │
2. Niche & Style               ─┐
3. Destinations                 ─┤→  Step 2: "Your Niche"
                                │   (niches, content style, budget
                                │    levels, top destinations)
                                │
4. Portfolio                   ─┐
5. Brands                      ─┤→  Step 3: "Your Portfolio"
6. How It Works (read-only)     │   (featured photos, brand alignment,
7. Pricing                     ─┘    pricing model — all optional)
                                │
8. Commitment                  ─┐
9. Safety                      ─┤→  Step 4: "Standards & Legal"
10. AI Identity                 │   (response commitment, safety +
11. Legal                      ─┘    transparency acceptance, legal
                                │    checkboxes — single scroll)
                                │
12. Payment (Stripe)           ─── → Step 5: "Get Paid"
                                     (Stripe Connect setup)
```

### What gets removed entirely
- **"How It Works" step** (step 6) — informational only, move to a tooltip or dashboard card
- **AI Identity step** (step 10) — tone, audience, philosophy are nice-to-have; defer to creator settings page
- **TikTok verification** — keep the handle field but remove the OAuth verification button (can be added to settings later)
- **Instagram followers count** — unnecessary friction; keep handle only
- **Languages selector** — defer to settings
- **Travel POV textarea** — defer to settings

### What stays but gets combined
- Steps 0+1 merge into one screen (identity + social handles)
- Steps 2+3 merge into one screen (niches + destinations)
- Steps 4+5+7 merge into one screen (portfolio + brands + pricing, all optional)
- Steps 8+9+11 merge into one screen (all policy acceptances)
- Step 12 stays as-is (Stripe)

### Changes — `src/pages/onboarding/CreatorOnboardingPage.tsx`

Complete rewrite of the STEPS array, step rendering, `canProceed()` logic, and `handleSubmit()`. The state variables for removed fields (AI tone, audiences, languages, travel POV, TikTok verification, follower counts) stay in the submit payload as null/empty so existing DB columns aren't broken, but the UI no longer collects them.

### Changes — `src/components/onboarding/LuxuryStepIndicator.tsx`

Will now receive 5 steps instead of 13 — no code changes needed, it's data-driven.

