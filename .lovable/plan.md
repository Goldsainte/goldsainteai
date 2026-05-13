## Goal

Extend the exact approved signup email design (logo, serif Playfair headline, italic tagline, dark green CTA, gold Roman-numeral steps, full footer with nav/social/legal) to the 5 other auth email templates — keeping the visual chrome identical and only swapping the headline, tagline, lede, CTA label, and "What happens next" steps so the content fits each flow.

All templates will continue to live in `supabase/functions/_shared/email-templates/` and be wired through the existing `auth-email-hook` (no infrastructure changes).

---

## Per-template content

### 1. Password Reset (`recovery.tsx`)
- **Subject:** Reset your Goldsainte password
- **Headline:** Reset your password.
- **Tagline:** Your account security is paramount. Use the secure link below to set a new password.
- **Lede:** We received a request to reset the password for your Goldsainte account.
- **CTA:** Reset my password
- **Steps (What happens next):**
  - I. Click the button above to open a secure password reset page.
  - II. Choose a strong, unique password you haven't used before.
  - III. You'll be signed in automatically once the new password is saved.
  - IV. Review your account activity and connected devices.
  - V. Contact our team immediately if you did not request this change.

### 2. Magic Link (`magic-link.tsx`)
- **Subject:** Your Goldsainte sign-in link
- **Headline:** Sign in to Goldsainte.
- **Tagline:** A passwordless link to access your concierge dashboard, valid for a short time only.
- **Lede:** Use the secure link below to sign in to your account — no password required.
- **CTA:** Sign me in
- **Steps:**
  - I. Click the button above to sign in instantly and securely.
  - II. You'll arrive on your personal concierge dashboard.
  - III. Pick up where you left off — saved trips, requests, and conversations.
  - IV. Continue browsing curated trips across 50+ countries.
  - V. Reach out anytime if you need assistance from our specialists.

### 3. Invite (`invite.tsx`)
- **Subject:** You've been invited to Goldsainte
- **Headline:** You're invited to Goldsainte.
- **Tagline:** A curated marketplace connecting discerning travelers with the world's most trusted specialists, creators, and brands.
- **Lede:** Accept your invitation to activate your account and begin curating your journey.
- **CTA:** Accept invitation
- **Steps:**
  - I. Accept your invitation to activate your account and secure your profile.
  - II. You'll be guided to set a password and complete your profile.
  - III. Tell us about your travel preferences so we can tailor recommendations.
  - IV. Browse trips designed by certified specialists and trusted creators.
  - V. Request a trip or book directly — every reservation is protected on-platform.

### 4. Email Change (`email-change.tsx`)
- **Subject:** Confirm your new Goldsainte email
- **Headline:** Confirm your new email.
- **Tagline:** A request was made to update the email associated with your Goldsainte account.
- **Lede:** Confirm this change to keep your account secure and continue receiving important notifications at your new address.
- **CTA:** Confirm new email
- **Steps:**
  - I. Click the button above to confirm your new email address.
  - II. Future communications and sign-ins will use the new address.
  - III. Your old email will no longer have access to this account.
  - IV. Review your account security settings if anything looks unfamiliar.
  - V. Contact our team immediately if you did not request this change.

### 5. Reauthentication (`reauthentication.tsx`)
- **Subject:** Your Goldsainte verification code
- **Headline:** Verify it's you.
- **Tagline:** A short verification step to protect sensitive account changes.
- **Lede:** Enter the verification code below to continue with the action you requested on Goldsainte.
- **CTA replacement:** A large, centered code block displaying `{token}` (using the same dark green / cream palette as the CTA) instead of a button. A small caption underneath: "This code expires in a few minutes."
- **Steps:**
  - I. Return to the Goldsainte tab where you started this action.
  - II. Enter the code above when prompted to verify your identity.
  - III. The action will complete once the code is accepted.
  - IV. The code expires shortly — request a new one if needed.
  - V. Contact our team immediately if you did not request this code.

---

## Shared elements (identical across all six templates)

- Same `<style>` block (Playfair Display + Helvetica Neue, cream `#f7f3ea` background, dark text `#0a2225`, dark green CTA `#0c4d47`, gold accents `#8a7a3f`, footer palette).
- Same header: centered Goldsainte wordmark logo from the `email-assets` bucket.
- Same divider rules and spacing.
- Same security paragraph: "Goldsainte will never email you and ask you to disclose or verify your password, credit card, or banking account number…"
- Same site footer block: nav links (Browse Trips · Specialists · About · Help · Trust & Safety · Contact), social row (LinkedIn · Instagram), legal row (Privacy · Terms · Disputes), copyright "© 2026 Goldsainte AI Inc.", and "This is an automated message — please do not reply."
- Same fallback "Or paste this link into your browser" line under the CTA (omitted only in `reauthentication.tsx`, where the OTP code replaces the link).

---

## Technical notes

- Refactor the shared chrome (style block, header, footer, security notice, steps list renderer) into a single helper inside `_shared/email-templates/` so we don't duplicate ~80 lines of CSS across six files. Each template then exports a small wrapper that supplies `{ headline, tagline, lede, ctaLabel, ctaUrl, steps }` (or, for reauth, an OTP block instead of a CTA).
- Keep each template's existing exported component name and props signature so `auth-email-hook/index.ts` continues to route correctly with no hook changes.
- Preserve the existing template variables already passed by the hook (`siteName`, `siteUrl`, `recipient`, `confirmationUrl`, `email`, `newEmail`, `token`).
- After the edits, redeploy `auth-email-hook` once so all six render with the new design.

---

## Open question before implementation

Please confirm the per-template subject lines, headlines, taglines, and the 5 "What happens next" steps above. If you'd like to tweak any wording (e.g., a different CTA label, a shorter tagline, different step copy), tell me which template and what to change and I'll fold the edits into the implementation.