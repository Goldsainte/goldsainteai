## Problem

Signup emails are now flowing through `auth-email-hook` (confirmed in logs: enqueued at 14:51:21 for andre.powelljr@gmail.com). The email pipeline is healthy. The reason it looked "default" is that the React Email templates in `supabase/functions/_shared/email-templates/` are still the unbranded scaffolded versions — black button, Arial, white background, no Goldsainte wordmark, no editorial typography.

The fully-branded design lives in `supabase/templates/confirmation.html` (cream `#f7f3ea` background, Playfair Display serif headers, dark green `#0c4d47` CTA, gold accents, wordmark logo, "What happens next" steps, footer nav). That HTML template is now bypassed because the hook intercepts the email before Supabase's native templates run.

## Fix

Port the Goldsainte branding from `supabase/templates/confirmation.html` into the 6 React Email `.tsx` templates so every auth email matches the brand.

### Files to update

1. `supabase/functions/_shared/email-templates/signup.tsx` — full editorial treatment (wordmark, "Welcome to Goldsainte" headline, tagline, dark-green CTA, "What happens next" 5-step list, footer with nav/social/legal). Mirrors `confirmation.html` exactly.
2. `supabase/functions/_shared/email-templates/recovery.tsx` — password reset variant. Headline "Reset your password", security notice block, same chrome.
3. `supabase/functions/_shared/email-templates/magic-link.tsx` — "Your sign-in link", same chrome, shorter body.
4. `supabase/functions/_shared/email-templates/invite.tsx` — "You've been invited to Goldsainte", same chrome.
5. `supabase/functions/_shared/email-templates/email-change.tsx` — "Confirm your new email", show old + new email, same chrome.
6. `supabase/functions/_shared/email-templates/reauthentication.tsx` — "Your verification code", display 6-digit OTP in a styled mono code block, same chrome.

### Shared design tokens (applied inline per React Email conventions)

- Body bg `#f7f3ea` (cream)
- Container bg `#f7f3ea`, max-width 560px, padding 48px 16px
- Wordmark: `https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/email-assets/wordmark-green-v2.png`, height 22px, centered
- Headings: Playfair Display via Google Fonts `<Head>`-injected `<link>`, fallback `Georgia, serif`, 38px, color `#0a2225`
- Body: Helvetica Neue/Arial, 16px, line-height 1.6, color `#0a2225`
- CTA button: bg `#0c4d47`, color `#f7f3ea`, 13px, letter-spacing 0.18em, uppercase, padding 18px 40px, radius 2px
- Gold accent for step numerals: `#8a7a3f` italic Playfair
- Footer: bg `#FDF9F0`, gold-tan text `#9A9079`, nav links, social, legal copyright "© 2026 Goldsainte AI Inc."
- Tagline italic `#6E6650`
- Security/footnote text 11-12px, opacity 0.55

### Shared layout helper

Add `supabase/functions/_shared/email-templates/_layout.tsx` already exists — extend it (or replace) to expose a `<BrandedShell>` wrapper component that renders the wordmark header, content slot, and full footer. Each of the 6 templates imports it and provides headline + body + optional steps. Keeps the 6 files small and consistent.

### Deployment

After editing, deploy `auth-email-hook`. (The function code itself does not change — only the template imports — but a redeploy is required to ship the new template bundle.)

### Validation

- No new signup needed (would trigger the rate limit). Instead, open Cloud → Emails → preview the `signup` template after deploy to visually confirm the cream/green/serif branding renders.
- Then on the next real signup, the inbox version will match.

## Out of scope

- No changes to rate limits, hook wiring, queue, or send infra (all confirmed working).
- No changes to `supabase/templates/confirmation.html` (legacy, now inert).
- No copy changes beyond what's needed to fit each auth event type — tone matches existing `confirmation.html`.
