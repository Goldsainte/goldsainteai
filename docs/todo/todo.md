# Goldsainte — Press-Launch Iteration

> **Press release: Wednesday 1 July 2026.** Expect ~300–500 visitors — **mostly travellers**
> looking for holiday packages, plus some travel agents and travel creators (influencers).
> Direction refs: [business](goldsainte_business.md) · [marketing](goldsainte_marketing.md)

---

## 🔁 Re-test before production — branch `improvements`

> `improvements` branched from `main` (production). Everything below is **not yet in prod** — re-test
> on this branch, then merge to `main` and redeploy (`send-direct-message` needs a redeploy).

### Commits on this branch (newest first)
| Commit | Change | Areas to re-test |
|--------|--------|------------------|
| `ac74bef6` | Authed "Ask a Question" + proposal "Message" → dm-model; `send-direct-message` now resolves the responder from `tripId`. Also `HomeHero` `fetchpriority` fix. | 1) **Logged-in** "Ask a Question" on a trip page → conversation appears in the inbox. 2) **Proposal "Message"** button opens a chat. 3) **Normal in-app DM** (creator↔traveller) still works — `send-direct-message` is shared. 4) **Anonymous** Ask (drawer → magic link) still works. 5) Homepage hero renders, no `fetchPriority` console warning. |
| `56b8b86d` | **Reply-notification loop** — a responder reply in an inquiry thread emails the traveller a passwordless link (`action=open`), debounced. Inlined into `send-direct-message` + `reply-notification` template + `AuthCallback action=open`. | 1) As the **concierge/responder**, reply in an inquiry conversation → the **traveller gets an email**; clicking it opens that thread. 2) **Debounce**: a 2nd responder reply within ~15 min sends **no** new email. 3) A reply in a **normal (non-inquiry) DM** sends **no** email. 4) Traveller replying to themselves sends no email. *(Resend = real email, not Inbucket.)* |
| _(analytics)_ | **Env-driven GA4 / Clarity / GSC-Bing verification / Ads label** (`src/lib/analytics/init.ts`, `main.tsx`, CSP, `vite.config.ts`). No-op until env vars set. | 1) App loads with **no** new console/CSP errors when vars are **unset**. 2) With `VITE_GA4_MEASUREMENT_ID` + `VITE_CLARITY_PROJECT_ID` set → GA4 + `clarity.ms` scripts load (Network tab), no CSP block. 3) Existing Google Ads tag still loads. |

### Regression checklist (Ask-a-Question end-to-end)
- [ ] Anonymous: submit → email → magic link → land in conversation, **single** message (no dup), correct trip + concierge label.
- [ ] Logged-in: Ask on a trip page → conversation in inbox immediately; responder = concierge/creator.
- [ ] Platform/concierge trip → `responderId` is **not null** in the `submit-trip-inquiry` / `send-direct-message` logs.
- [ ] Phone reuse doesn't break signup ("Database error saving new user" gone).
- [ ] Existing creator↔traveller DMs and message-requests still send/accept normally.

### Deploy after re-test passes
1. Merge `improvements` → `main`.
2. Redeploy edge functions: **`send-direct-message`** (responder resolution); `submit-trip-inquiry` if not already current.
3. Lovable rebuilds the frontend from `main`; smoke-test on `goldsainte.ai`.

---

## Audiences & journeys

### Travellers — primary press audience
Assumed journey:
1. Land on the homepage ![goldsainte main page](goldsainte.ai_.png)
2. Scroll, then explore curated packages, e.g. https://goldsainte.ai/marketplace/trip/cape-town
3. Some ask a question / post a trip request.

**Critical-thinking feedback (acted on / still open):**
- The press visitor is overwhelmingly a **traveller** → optimise the top of the homepage and the
  trip pages for them; treat creators/agents as a secondary, lower-funnel capture.
- **Lower hero friction** — lead with "explore", not a signup wall.
- **Two segmentation sections** ("Two Ways to Experience" vs "Experience Goldsainte Your Way")
  sit back-to-back and blur together — disambiguate or merge.
- **Instrument before launch** — one press shot; without analytics the spike teaches us nothing.

### Travel agents / creators — secondary
- They find their section on the landing page ("Experience Goldsainte Your Way") ![alt text](image.png)
  and register.
- **Registration is too complex** — it loops the user through email → type → details → … . Needs a
  review and a simpler flow.
- **Studio / profile / post-an-itinerary layout** needs polish (see Workstream B).
- **Goal:** the "first product" from onboarding ![first product](image-1.png) works **end to end** and
  creates a trip that **shows in the Trips tab** of `/creator-dashboard`.

---

## Workstream A — Traveller "Ask a Question" inquiry flow

> Status as of **2026-06-27**: core flow shipped to prod and working. Detailed history + the
> F1–F11 resolutions live in [ask_question.md](../features/ask_question.md).

### ✅ Done
- Submit → conversation created **server-side on submit** (send-on-submit) in the
  `dm_conversations` / `direct_messages` model the inbox actually reads.
- Concierge routing (package `creator_id`/`agent_id` → `CONCIERGE_USER_ID` fallback; prod secret set).
- Optional name/phone (with the `profiles_phone_unique` collision fix), reframed email + concierge
  label, inbox layout (viewport-fit, internal scroll), duplicate-message guard, prod build fallback.
- Deployed live; verified working.
- **Logged-in "Ask a Question" + proposal "Message"** now route through `send-direct-message`
  (dm-model); the responder is resolved server-side from `tripId` (creator/agent/`CONCIERGE_USER_ID`),
  so authed travellers' questions show in the inbox. *(needs `send-direct-message` redeploy)*

### ⏳ Remaining
1. ✅ **BUILT — Reply-notification loop** (inlined into `send-direct-message`, not a separate
   `notify-inquiry-reply` function). Responder reply in an inquiry thread → debounced (~15-min burst)
   passwordless email → `action=open` opens the thread; `reply-notification` template added.
   **Re-test (see top); redeploy `send-direct-message`.** *Fast-follow:* scanner-safe magic links (Q1).
2. ✅ **DONE — Logged-in "Ask a Question" + proposal "Message"** rerouted through
   `send-direct-message`; responder resolved server-side from `tripId`. *(redeploy `send-direct-message`)*
3. **Launch hardening for public traffic.**
   - **Bot/captcha (Q6):** the drawer is public and creates auth accounts — a press blast is a spam
     vector. Add Turnstile + verify server-side; clean up never-converted `auth.users`.
   - **Scanner-safe magic links (Q1):** corporate/Outlook SafeLinks prefetch the URL and can consume
     the single-use token → "link expired". Affects the submit email and the future reply email.
     Needs a click-to-complete landing (POST) or longer-lived token + a friendly re-issue page.
4. **Analytics (F10):** `inquiry_submitted` / `inquiry_converted` events — measure the one press shot.
5. **Secondary:** privacy note at submit (Q9); schedule `expire_old_pending_inquiries` via pg_cron (F9).

---

## Workstream B — Creator / agent registration & studio

### B1. Simplify the registration flow
Today it loops: email → account type → details → … . Review and flatten so a creator/agent can
register in the fewest steps, with the account-type choice made once and remembered.

### B2. Creator dashboard layout & fonts — polish (reviewed)
`/creator-dashboard` reads slightly thin / "admin panel" and is **narrower than the rest of the app**,
which fights the premium positioning the studio is selling creators on.
- [ ] **Match width:** `max-w-5xl` → **`max-w-6xl`** in [CreatorDashboard.tsx](../../src/pages/CreatorDashboard.tsx)
      (marketplace already uses `max-w-6xl`).
- [ ] **Promote section headers:** in-tab titles like "Photos, Videos & Reels" / "Social Accounts"
      `text-sm font-semibold` (sans) → **`text-lg md:text-xl font-secondary`** (the serif already used
      for "Welcome, Creator"). Biggest "feels premium" win.
- [ ] **Un-cramp the intro:** the "Welcome, Creator" subtitle `text-sm …/60 max-w-md` →
      `text-base …/70 max-w-xl`.
- [ ] **Lift body legibility:** muted `text-sm …/65` body copy → `text-[15px] …/70`.
- Leave alone (intentional editorial style): the `text-[10px]` uppercase eyebrows, the
      `text-[28px] md:text-4xl` H1.

### B3. First product end-to-end
The "first product" onboarding step must create a real trip that appears in the **Trips tab** of
`/creator-dashboard`. Verify the create → publish → list path works and fix breaks.

---

## Workstream C — Marketplace data hygiene (quick, high-visibility)
Press visitors browse the marketplace, so:
- [ ] **Remove the live test package** `zzz-test-deposit-flow` ("TEST — Deposit Flow (delete me)").
- [ ] **De-duplicate destination listings** — several appear twice with different slugs
      (cape-town / cape-town-winelands, santorini ×3, kyoto ×2, amalfi-coast ×2, patagonia ×2,
      bali ×2, marrakech ×2, swiss-alps ×2). Decide which to keep, archive the rest.

---

## Workstream D — Analytics, SEO & campaign tracking

Audit (2026-06-27): only the **Google Ads** tag is wired; GA4, Clarity, GSC and Bing are all missing.

### Current state
- ✅ **Google Ads** gtag (`AW-17180504737`) loads in `index.html`; `src/lib/analytics/conversions.ts`
  fires purchase conversions — **but the conversion label is a placeholder**
  (`REPLACE_WITH_LABEL_FROM_GOOGLE_ADS`), so **conversions aren't actually recorded yet**.
- ❌ **GA4** — not configured (no `G-XXXX` property). The GA4 `purchase` event in `conversions.ts` is a
  no-op until one exists. CSP already allows GA / Tag Manager.
- ❌ **Microsoft Clarity** — not integrated.
- ❌ **Google Search Console** — no verification (no `google-site-verification` meta).
- ❌ **Bing Webmaster** — no verification (no `msvalidate.01` meta).

### To do — code
- [x] **Env-driven setup shipped** (`src/lib/analytics/init.ts` + `main.tsx` + CSP + `vite.config.ts`).
      GA4, Clarity, GSC/Bing verification, and the Ads conversion label all activate purely by setting
      their env var — **no further code change needed**, just the IDs below.
- [ ] **GA4 events:** fire `inquiry_submitted` / `inquiry_converted` / `sign_up` (the A4 instrumentation;
      `page_view` is automatic once the GA4 id is set).
- [ ] **Sitemap:** confirm `https://goldsainte.ai/sitemap.xml` is served; submit to GSC + Bing.

### To do — accounts/dashboards (you) → then set the env var (Lovable build env + `.env.local`)
- [ ] Create the **GA4 property** → `VITE_GA4_MEASUREMENT_ID` = `G-XXXXXXX`.
- [ ] Create a **Clarity** project → `VITE_CLARITY_PROJECT_ID`.
- [ ] **Google Ads** conversion action → `VITE_GOOGLE_ADS_CONVERSION_LABEL`.
- [ ] **GSC**: verify via GA4-link/DNS (no code) *or* set `VITE_GSC_VERIFICATION`; submit sitemap.
- [ ] **Bing**: import from GSC (no code) *or* set `VITE_BING_VERIFICATION`; submit sitemap.

> The code is in place and env-driven — just set the vars (Lovable build env for prod, `.env.local`
> for local) and the tags light up. No redeploy of code needed beyond a normal Lovable rebuild.

---

## Next iteration — prioritised plan for Wednesday

### P0 — must land before press (traveller-heavy traffic)
- [ ] **C** — Marketplace cleanup: drop the test package + dedupe destinations *(fast, high visibility)*.
- [x] **A2** — Logged-in "Ask a Question" path ✅ *(done; needs `send-direct-message` redeploy)*.
- [ ] **A3** — Hardening: scanner-safe magic links + captcha on the public drawer.
- [ ] **D / A4** — Analytics & SEO foundation: GA4 + Microsoft Clarity + GSC/Bing verification + sitemap,
      plus the `inquiry_submitted` / `inquiry_converted` events *(needs IDs from you — see Workstream D)*.
- [x] **A1** — Reply-notification loop ✅ *(built on `improvements`; re-test + redeploy `send-direct-message`)*.

### P1 — creator/agent experience (they register from the press too)
- [ ] **B1** — Simplify the registration flow.
- [ ] **B2** — Creator dashboard width + serif section headers + intro/body legibility.
- [ ] **B3** — First product onboarding → creates a trip → shows in Trips tab.

### P2 — secondary / after launch
- [ ] **A5** — Privacy note at submit; schedule the inquiry-expire pg_cron job.
- [ ] Clean up never-converted `auth.users`.
- [ ] Homepage: lower hero friction + disambiguate the two segmentation sections.

> Recommendation: do **A2 + C** (cheap, high-impact) and stand up **analytics** first, then the
> **reply loop (A1)** and **hardening (A3)** before driving traffic. Creator polish (B) slots just
> under the traveller work since travellers dominate the press audience.
