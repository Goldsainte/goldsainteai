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
| _(B4)_ | **Creator surfaces polish** — tab scrollbar hidden, welcome modal above the nav, profile fonts. | 1) `/creator-dashboard` tab strip has **no OS scrollbar**; tabs still scroll. 2) First load: the welcome modal sits **above** the green nav (top not clipped). 3) `/creators/<id>`: ABOUT bio reads larger; "Member since" legible. |
| _(A3)_ | **Scanner-safe `/auth/verify`** — click-to-complete (no auto-verify on page load). | 1) Ask a question (or reply as concierge) → open the email link → it lands on a page with a **button**; clicking signs you in + opens the conversation. 2) The link still works after the email client/scanner previews it (token not pre-consumed). 3) Signup-confirmation + password-recovery links still work via the button. |
| _(B1)_ | **Registration de-loop** — `CompleteProfile` pre-selects the existing role. | 1) Register as a **creator** (esp. via **Google**) → at "Complete Your Profile" the **Creator** role is **already selected** + name prefilled; just confirm → Continue (no re-pick). 2) Email signup with a name → does **not** hit complete-profile at all. |
| _(B3)_ | **Creator Trips tab + first-product checklist** — `CreatorTripsTab` now lists the creator's `packaged_trips` (any status, with badge); checklist counts `pending_review`+`published`. | 1) As a **creator**, build a trip → it **appears in the Trips tab** of `/creator-dashboard` (with an "In review" badge). 2) "Publish your first product" Getting-Started item **ticks** after publishing. 3) A draft (autosave only) does **not** tick it. |
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
   - ✅ **Scanner-safe magic links (Q1)** — `/auth/verify` is now **click-to-complete** (`AuthVerify.tsx`):
     the token is spent only on a real button click, so scanner GET-prefetch can't burn it ("link expired").
     Covers the submit email, the reply email, and signup confirmation.
   - ⏳ **Bot/captcha (Q6):** the drawer is public and creates auth accounts. Add Turnstile + verify
     server-side; clean up never-converted `auth.users`. *(Needs a Turnstile account — you're checking.)*
4. **Analytics (F10):** `inquiry_submitted` / `inquiry_converted` events — measure the one press shot.
5. **Secondary:** privacy note at submit (Q9); schedule `expire_old_pending_inquiries` via pg_cron (F9).

---

## Workstream B — Creator / agent registration & studio

### B1. Simplify the registration flow
Traced (2026-06-27):
- ✅ **#1 already in place** — email signup passes `first_name`/`last_name`/`full_name`/`account_type`
  into metadata (`Auth.tsx:453`), so a complete email signup **skips the completion gate** entirely.
- ✅ **#2 — no more role re-ask** — `CompleteProfile` now pre-selects the role the user already chose
  (passes the existing `account_type` as `AccountTypeStep` `defaultType`), so the screen confirms
  identity instead of re-asking the role. (`AccountTypeStep` already prefills the name from Google.)
- ⏳ **Optional (not done — would over-correct):** counting `full_name` in AuthCallback `hasIdentityFields`
  would let OAuth users skip `complete-profile` entirely, but then generic Google sign-ins (no role
  chosen) default to traveler with no prompt. Decide if desired.

### B2. Creator dashboard layout & fonts — polish (reviewed)
`/creator-dashboard` reads slightly thin / "admin panel" and is **narrower than the rest of the app**,
which fights the premium positioning the studio is selling creators on.
- [x] **Match width:** `max-w-5xl` → `max-w-6xl` in `CreatorDashboard.tsx` (matches the marketplace).
- [x] **Promote section headers:** Portfolio tab "Photos, Videos & Reels" / "Social Accounts" → serif
      `text-lg md:text-xl font-secondary` (+ their descriptions `text-xs` → `text-sm`).
- [x] **Un-cramp the intro:** "Welcome, Creator" subtitle → `text-base …/70 max-w-xl`.
- [x] **Lift body legibility:** footer/body `text-sm …/65` → `text-[15px] …/70`.
- Leave alone (intentional editorial style): the `text-[10px]` uppercase eyebrows, the
      `text-[28px] md:text-4xl` H1.

### B3. First product end-to-end
The "first product" onboarding step must create a real trip that appears in the **Trips tab** of
`/creator-dashboard`.
- ✅ **Trips tab now lists trips** — `CreatorTripsTab` was a stub (no query); it now queries
  `packaged_trips` by `creator_id` (all statuses) with a Draft / In review / Live badge.
- ✅ **Checklist** "Publish your first product" now counts submitted trips (`pending_review` +
  `published`) — was `published`-only, so it never ticked (creator trips go to review).
- ⏳ **Open product decision:** trips go to `pending_review` (admin approval) before they're publicly
  bookable. Decide auto-approve / fast-track vs manual review for the launch.

### B4. Creator surfaces polish (from `next.md`)
- ✅ **Tab strip scrollbar** — `/creator-dashboard` tabs showed an always-visible OS scrollbar + a
  stray vertical bar. Hidden the native scrollbar (`overflow-y-hidden [scrollbar-width:none]
  [&::-webkit-scrollbar]:hidden`); tabs still scroll (trackpad/swipe, active tab scrolls into view).
  Mobile already uses a `Select` dropdown.
- ✅ **Welcome modal under the nav** — `OnboardingWelcomeModal` rendered at `z-50` (same as the sticky
  header) so the nav covered its top. Now **portaled to `document.body` at `z-[100]`**.
- ✅ **"Skip for now" / "A space reserved…" — kept secondary (decision):** they must not compete with
  the primary CTA. Only bumped "Skip" `text-[12px]` → `text-sm` for tappability; the italic caption
  stays small (intentional editorial flourish).
- ✅ **Public profile fonts** — ABOUT bio `text-base/lg` → `text-lg/xl` (the creator's voice gets
  presence); "Member since" meta `text-xs` → `text-sm`. Pills/eyebrows left as intentional secondary.
- ✅ **Public profile top-nav consolidated** — `/creators/<id>` had **3 stacked bars** (global nav +
  Back bar + Owner banner) with a **duplicated "Edit profile"**. Merged into **one** bar:
  Back · "Owner view" chip · single **Edit profile** · ··· (copy link / public preview). Removed the
  redundant strip + the dup; content sits higher. *(Optional follow-up: overlay Back/··· on the hero
  for a fully content-forward look.)*
- ✅ **Focus outline (app-wide)** — root cause was the global `--ring` token being **black**
  (`index.css:229`), so **every** shadcn button's focus ring was a dark box (e.g. the profile-toolbar
  `···`, image-7). Set `--ring` → **brand gold (`42 47% 58%`)** — softens every focus ring app-wide.
  The two top-bar icon buttons (profile + bell) still re-showed a ring after a Radix menu closed (focus
  returns to the trigger, image-6), so they now use a **background cue** (`focus-visible:bg-…`, ring-0)
  instead of a ring — no lingering box, keyboard nav still gets a visible state.
- ✅ **Home Base autocomplete** (`/onboarding/creator`, commit `657c70b1`) — `GoogleCityAutocomplete`
  (Google Places, `(cities)`) replaces the plain Home Base input; selecting a city saves to
  `profiles.home_base`. Graceful plain-text fallback when no key is set.
  - 🐞 **Env-var name mismatch (fixed)** — components read `VITE_GOOGLE_MAPS_API_KEY`, but `.env.example`
    + the env validator document **`VITE_GOOGLE_PLACES_API_KEY`** (what the user set). Components now read
    `VITE_GOOGLE_PLACES_API_KEY` **first**, falling back to `VITE_GOOGLE_MAPS_API_KEY`
    (`GoogleCityAutocomplete` + `DestinationAutocomplete`); added the Places key to the vite.config
    `define` block (for prod) + a dev `console.warn` when neither is set. One Google key (Places API +
    Maps JS) covers both.

#### Social handle normalization (acted on)
Handles were stored raw — incl. a leading `@`, which the `@yourhandle` placeholder *invited* — but the
profile link-builders assume a **bare** handle, so a stored `@` produced **broken links**
(`tiktok.com/@@x`, `instagram.com/@x`) and a doubled `@x` display.
- ✅ New **`src/lib/socialHandles.ts`** (`normalizeHandle` / `atHandle` / `socialUrl`) — single source of
  truth: strips `@`, whitespace and pasted profile URLs to a bare handle, and builds per-platform URLs
  (TikTok adds `@`, IG/YouTube don't).
- ✅ Applied **defensively at render** — `AgentPublicProfilePage`, `CreatorMediaGallery` — which repairs
  any existing `@…`/full-URL rows **with no migration**.
- ✅ **On save + load** in creator onboarding (`normalizeHandle`); the two handle inputs now show a fixed
  grey `@` adornment so creators type the bare handle (zero ambiguity).
- ↪️ *Follow-up (optional):* the settings editors (`CreatorSocialAccountsEditor`, `CreatorSettingsPage`)
  still store full URLs — links render fine (the builders normalize), but their stored format differs.

#### Profile vs landing-page review (acted on)
Same palette/type as the landing page, but flatter/sparser. Implemented:
- ✅ **#1 Hero trust panel** — the cover hero wasted ~⅔ of its width; added a desktop "at-a-glance"
  panel (response time + specialties) beside the identity card. Gracefully hidden when the creator has
  neither (so the empty test profile shows no change — it activates for filled profiles).
- ✅ **#2 Tighter rhythm** — content sections `py-16 md:py-20` → `py-12 md:py-16` (less cavernous).
- ✅ **#3 Curated Journeys** — the profile now fetches the creator's **published `packaged_trips`** and
  renders a card grid linking to `/marketplace/trip/<slug>`. Previously the page only surfaced guides +
  TikTok, so a creator's actual bookable products never showed. Hidden when there are no live packages.
- ⏸️ **#4 De-emphasise "NEW DESIGNER" for visitors** — not done (you didn't select it).
> Note: #1 + #3 only render with real data (specialties / response time / published trips). To see them
> on Creator 001, give it a specialty + a published trip package; otherwise only #2 is visible.

### B5. Creator-onboarding friction (from `next.md`) — assessment, **pending decisions**
Wizard is **5 steps**: 1) About You · 2) Social Profile · 3) Your Niche · 4) Portfolio · 5) Standards
(Stripe + legal). Two issues raised; reduce friction for non-technical influencers.

**(a) Step 3 — "Primary Destinations" clunky — ✅ DONE.**
- Was `DestinationAutocompleteNominatim` (free OpenStreetMap) — frequently showed **"Can't reach
  suggestions"** (rate-limits / CORS), with a pin icon overlapping the placeholder + heavy border.
- ✅ Swapped to **Google Places multi-select** (`DestinationAutocomplete`, on `VITE_GOOGLE_PLACES_API_KEY`)
  → reliable suggestions, no "Can't reach" fallback. The `MapPin` now sits beside the label (no overlap),
  with a live `n/10` count. Added an `inputClassName` prop and matched the onboarding input style
  (`border-[#E5DFC6]` + gold focus + `rounded-xl`). Made the field **optional** (`canProceed` case 2 no
  longer requires `destinations`; label `*` removed). `DestinationAutocompleteNominatim` no longer used here.
  - ✅ **Countries/regions now included** — was `types: ["(cities)"]` (cities only, so "Greece"/"Italy"
    didn't appear). Added a `types` prop (default `["(cities)"]`) and pass `["(regions)"]` for Primary
    Destinations → countries + regions/states + cities. Traveler-prefs usage keeps the cities default.
  - ✅ **Selected-chip restyle** — the chips were tiny `text-[11px]` in puffy muted-grey badges with a
    detached `×`. Rebuilt as on-brand pills (`bg-[#F6F0E4]` + `E5DFC6` border, `text-[13px]` medium, a
    gold `MapPin`, asymmetric `pl-3 pr-1.5` padding, and a proper round `×` hit-target). Dropped the
    `Badge` dependency.

**(b) Step 4 — "Portfolio" — remove to cut friction.**
- Longest, densest step and **entirely optional**: cover image, featured photos, content gallery,
  **brand-tier prefs, preferred hotel brands, aesthetic style, pricing model**.
- Cover + photos are **already editable in the dashboard Portfolio tab** → safe to drop from onboarding.
  **Brand alignment + pricing model have NO other edit surface** (set only here) → dropping them leaves
  them at DB defaults until a settings screen exists.
- ✅ **(b) Step 4 HIDDEN (reversible)** — gated behind `SHOW_PORTFOLIO_STEP = false` in
  `CreatorOnboardingPage.tsx` (wizard now 5→4 steps). All of Step 4's JSX, state, and save fields stay
  intact; flip the flag to `true` to restore instantly. Step indices are derived from the flag
  (`STANDARDS_STEP_INDEX = STEPS.length-1`), and `canProceed` was made index-aware. Audit conclusion
  stands: hiding it loses nothing the app reads (brand-alignment + pricing are write-only dead data;
  cover/photos live in the dashboard Portfolio tab).
- 📌 **TODO — decide after partner tests the 4-step flow:** completely **remove** Step 4, or
  **re-do/improve** it (e.g., a slim cover-image prompt in an existing step + move brand/pricing to a
  future Settings screen if they ever become real features). Partner to report anything important now
  missing.

### B6. Creator dashboard tabs — follow-up (from `next.md`, image-9)
The B4 scrollbar fix worked (no OS scrollbar). Remaining critical-thinking notes:
- ⚠️ **Overflow discoverability** — 11 tabs still overflow (`CONTENT` / `EARNINGS` / `SETTINGS`
  off-screen); with the scrollbar hidden the only cue is the clipped "EA…" at the edge. Add a subtle
  **right-edge fade** (+ optional chevron) shown only when the strip overflows. *(Low-risk; offered.)*
- 💭 **IA load** — 11 top-level tabs is heavy for non-technical influencers. Consider consolidating
  (groups or a "More" overflow menu) — larger change, **post-launch**.

### B7. Getting-Started checklist linkage audit (from `next.md`, image-10)
Audited the 6 **creator** items in `GettingStartedChecklist.tsx` — only **2 of 6** reflect real state:
- #2 Connect payout (`stripe_*account_id`) ✅ · #3 Publish product (trips/guides count) ✅.
- ✅ **#1 Complete profile** — now checks **real content** (`avatar_url && bio && creator_niches?.length`)
  instead of the `has_completed_creator_onboarding` wizard flag, so a filled profile ticks even if the
  creator hit *Skip* on the last onboarding step.
- ✅ **#4 Share profile** — was `creator_avg_views > 10` (imported TikTok metric). Now **completes when
  the creator opens their public profile** (clicking *View my profile* sets `gs_shared_profile_<id>` in
  localStorage + ticks immediately; persisted across reloads, like the marketplace-browse item).
- ↪️ **#6 Set notifications** — left as-is (`!!notification_preferences`); harmless false-positive.
- ↪️ **#5 Review tax** — left informational (`() => false`); the checklist is still dismissable via ✕.
  *(If we want it to reach 6/6 / auto-hide, make #5 complete-on-click too — small follow-up.)*
- ✅ **Banner ↔ checklist wording collision** — the dashboard's bottom banner *also* said "Complete your
  creator profile" but keyed on `has_completed_creator_onboarding` (wizard finished), so it contradicted
  the now-content-based checklist item (filled profile → checklist ✓ but banner still showing). Reworded
  the banner → **"Finish setting up your studio / Complete onboarding — including the creator terms…"** so
  the two surfaces track **distinct** milestones (profile *content* vs *finished wizard + legal*).

---

## Workstream C — Marketplace data hygiene (quick, high-visibility)
Press visitors browse the marketplace. **Audited live data 2026-06-29** (33 published trips).
- ✅ **Ready-to-run script:** [`marketplace_cleanup.sql`](marketplace_cleanup.sql) (preview → archive → verify;
  archive = reversible, removes from public marketplace since it queries `status='published'`).
- **7 duplicate stubs** (0 bookings, single-digit views, each with a richer high-booking sibling) → archive:
  `amalfi-coast`, `bali`, `cape-town`, `kyoto`, `marrakech`, `patagonia`, `santorini` (keep the
  descriptive-slug siblings, e.g. `kyoto-cultural-immersion` = 234 bookings).
- ⚠️ **`swiss-alps`** is the **only** Swiss Alps listing (solo empty stub, **not** a dup) — excluded from
  the dedup; decide separately (leave / replace / archive via the SQL's §4).
- ✅ **Test package** `zzz-test-deposit-flow` is **not in the published set** (already gone / unpublished);
  the SQL archives it defensively if it still exists.
- [ ] **YOU: run `marketplace_cleanup.sql` in the prod Supabase SQL editor.**

---

## Workstream D — Analytics, SEO & campaign tracking

Audit (2026-06-27): only the **Google Ads** tag is wired; GA4, Clarity, GSC and Bing are all missing.

### Current state
- ✅ **Google Ads** gtag (`AW-17180504737`) loads in `index.html`; `src/lib/analytics/conversions.ts`
  fires purchase conversions — **but the conversion label is a placeholder**
  (`REPLACE_WITH_LABEL_FROM_GOOGLE_ADS`), so **conversions aren't actually recorded yet**.
- ✅ **GA4** — configured (`G-9LFLZ9T3LS`, baked in `vite.config.ts`) and **live in prod**. Only runs on
  the production host (`init.ts` host guard) so localhost/preview don't pollute it. CSP allows the
  regional `*.google-analytics.com` collect endpoints.
- ✅ **Microsoft Clarity** — integrated (`xezjy77yv0`, baked in `vite.config.ts`); **live in prod** (same host guard).
- ❌ **Google Search Console** — no verification (no `google-site-verification` meta).
- ❌ **Bing Webmaster** — no verification (no `msvalidate.01` meta).

### To do — code
- [x] **Env-driven setup shipped** (`src/lib/analytics/init.ts` + `main.tsx` + CSP + `vite.config.ts`).
      GA4, Clarity, GSC/Bing verification, and the Ads conversion label all activate purely by setting
      their env var — **no further code change needed**, just the IDs below.
- [x] **GA4 events** (A4): `inquiry_submitted` / `inquiry_converted` / `sign_up` fired via
      `src/lib/analytics/events.ts` (no-op until the GA4 id is set). `page_view` is automatic.
- [ ] **Sitemap:** confirm `https://goldsainte.ai/sitemap.xml` is served; submit to GSC + Bing.

### To do — accounts/dashboards (you) → then set the env var (Lovable build env + `.env.local`)
- [x] Create the **GA4 property** → `VITE_GA4_MEASUREMENT_ID` = `G-9LFLZ9T3LS` ✅ **verified live** (tested on prod).
- [x] Create a **Clarity** project → `VITE_CLARITY_PROJECT_ID` = `xezjy77yv0` ✅ **verified live** (tested on prod).
- [ ] **Google Ads** conversion action → `VITE_GOOGLE_ADS_CONVERSION_LABEL`.
- [ ] **GSC**: verify via GA4-link/DNS (no code) *or* set `VITE_GSC_VERIFICATION`; submit sitemap.
- [ ] **Bing**: import from GSC (no code) *or* set `VITE_BING_VERIFICATION`; submit sitemap.

> The code is in place and env-driven — just set the vars (Lovable build env for prod, `.env.local`
> for local) and the tags light up. No redeploy of code needed beyond a normal Lovable rebuild.

---

## Workstream E — Client review batch (2026-06-30, post-deploy)
Four items from live testing. All legit; verdicts + plans below.

### E1. Inbox shows "Unknown" for the inquiry traveler — **bug, High** (image-13/14)
`get-conversations` resolves the other party as `display_name || "Unknown"` (line 84) and only selects
`display_name`. The Ask-a-Question modal collects **first name only** (`AskQuestionDrawer`), and
`submit-trip-inquiry` sets only `first_name` metadata — **no `display_name`** — so the inbox falls to
"Unknown." The concierge side also shows "Unknown / Traveler" (its profile `display_name` is null + wrong
`account_type`).
- ✅ **Fix (code, `e4233cf7`):** `get-conversations` now selects `full_name`+`first_name` and falls back
  `display_name || full_name || first_name || role-label`. Repairs existing convos, no migration. **⚠️ Needs redeploy.**
- ✅ **Fix (flow, `e4233cf7`):** `submit-trip-inquiry` sets `display_name = first_name` on the inquiry signup
  (only when null, so existing names aren't clobbered). **⚠️ Needs redeploy.**
- ☑️ **Decision:** keep the modal **first-name-only** (user confirmed) — no last-name field.
- [ ] **Data (you):** give the concierge a name so travellers see "Goldsainte Concierge" (not a role label):
  `update profiles set display_name='Goldsainte Concierge' where id='c93d67d1-db67-483c-a1c7-88d75f16131d' and (display_name is null or display_name='');`
- 🔎 Optional/cosmetic: trace the spurious `last_name = "question"` (likely `handle_new_user`) — low priority.

### E2. "Question sent" modal — check-mark green ≠ button green — ✅ **DONE** (`e4233cf7`, image-11)
Check was `text-green-600` (bright emerald); the "Got it" button is `bg-primary`. Recoloured the check to
`text-primary` so they share the same token (guaranteed match).

### E5. Dialog close-button focus box — ✅ **DONE** (image-15)
Radix auto-focuses the dialog's close `×` on open → a lingering gold box. Softened the close button in
`src/components/ui/dialog.tsx`: `rounded-full p-1`, `focus-visible:ring-0`, and a subtle
`hover/focus-visible:bg-[#E5DFC6]/60` background cue (no ring box; keyboard nav still visible).

### E3. Messages layout & fonts polish — ✅ **DONE** (image-13)
Timestamps were `text-[10px]` faint. Bumped: inbox-list "1 minute ago" → `text-[11px] text-[#6B7280]`
(darker), bubble `HH:mm` → `text-[11px]`. *(More typography passes possible later, but the legibility
complaint is resolved.)*

### E4. Landing image loading — ✅ **DONE (perf, High)**
✅ **Transform IS enabled** (tested live: a cover via `/render/image/public/…?width=200&quality=60` is
**61 KB vs 4.2 MB** for the `/object/public` original — ~68×). The transform helpers already existed
(`src/lib/images.ts` → `supabaseImageUrl` + `supabaseSrcSet`) but **weren't wired in**.
- ✅ **`TripCoverImage`** now serves the resized render-URL + a `srcSet` `[width, width×2]` (default
  `width=600`, quality 70, `resize=cover`) + `sizes`; on error it falls back to the original, then the
  bundled default. This cascades to **every** consumer — marketplace cards, homepage **Featured Trips**,
  trip-detail, creator Curated Journeys — so a card drops from ~4 MB to ~60 KB.
- Above-fold: `HomeHero` already uses `fetchPriority="high"`; Featured Trips is below the fold so `lazy`
  is correct. Added a `fetchPriority` prop to `TripCoverImage` for future above-fold use.
- ↪️ *Follow-up (optional):* the Curated-Journeys grid I hand-rolled in `CreatorPublicProfilePage` + the
  trip-detail hero use raw `<img>` — apply `supabaseImageUrl` there too when touched. Also compress at
  upload so originals aren't 4 MB.

### E6. Creator lands on the marketplace after login, not their studio — **UX bug** (item 13)
`getPostAuthDestination` (`postAuthRouting.ts:52-53`) routes complete creators/agents to `/partner`
(lands on `/marketplace?tab=trips`). A travel creator's home should be `/creator-dashboard` (Proposals /
Trips / Earnings / Performance live there), not the consumer marketplace.
- ✅ **DONE (`6a254a5d`):** creators → `/creator-dashboard`, agents → `/agent-dashboard` (`postAuthRouting.ts`). *(frontend → Lovable rebuild)*
- ☑️ `/creator-dashboard` confirmed canonical. **Follow-up:** re-assess `/partner`'s purpose (it just redirects to the marketplace).

### E7. Trip image upload → RLS error — **bug, BLOCKER** (item 14, image-16)
`TripImageUploader` uploads to `trip-assets/trip-images/<file>` — the path is **not prefixed with the
user id**, but the `trip-assets` RLS INSERT policy requires first folder = `auth.uid()` (working cover
uploads use `<userId>/trips/…`). → "new row violates row-level security policy." Breaks trip cover +
gallery upload entirely.
- ✅ **DONE (`6a254a5d`):** `TripImageUploader` path is now `${user.id}/trip-images/<file>` — used by the
  trip-builder **cover + gallery**, so both are fixed. *(frontend → Lovable rebuild)*
- 🔎 **Latent (separate, storyboards):** `StoryboardPhotoUploader` + `DesignEditorModal` use the same
  flat path (`storyboard-uploads/<file>`) → same RLS bug for that feature. Fix when storyboards are touched.

### E8. Create-trip page header too big / empty — **polish** (item 15, image-18)
The trip-builder uses the editorial "Edit Trip by Goldsainte AI" hero (eyebrow pill + big serif title +
marketing subtitle + Preview) — eats ~⅓ of the viewport before the form. It's a **workspace**, not a
landing page.
- ✅ **DONE (`6a254a5d`):** compact header — standard `BackButton` row + a tight title/`Saved`/Preview bar;
  dropped the gold line, "Trip Builder" pill, the "by Goldsainte AI" flourish, and the marketing subtitle.
  Title is now `New Trip` / `Edit Trip`. Form starts ~⅓ higher. *(frontend → Lovable rebuild)*

### E9. Stripe "not linked" on submit-for-review vs "connected" in profile — **bug + product** (item 16, image-17/19)
- ✅ **DONE (`6a254a5d`, user: gate at publish not review):** removed the Stripe gate from
  `TripBuilderPage` submission. A "publish" maps to `pending_review` (admin review) → the trip isn't live,
  so Stripe isn't required to submit. This also **resolves the inconsistency** (the stale
  `stripe_charges_enabled` no longer blocks while the profile shows "connected"). *(frontend → Lovable rebuild)*
- 🔎 **Follow-up:** when we add a real **go-live** gate (admin approval / first payout), use **one**
  Stripe-status source of truth so the profile and the gate always agree.

### E10. Package creator/agent isn't a real DB user → fall back to concierge (item 17) — ✅ **DONE (BE)**
Both `submit-trip-inquiry` + `send-direct-message` now **verify the package-resolved responder exists in
`profiles`** before using it; if it's an orphan id, they fall back to `CONCIERGE_USER_ID`. The check only
runs on the *package-resolved* responder (not caller-supplied recipients), so normal DMs aren't slowed.
**⚠️ Edge functions — needs redeploy (push to `main`).**

### E11. Messages break words mid-word (item 18, image-24) — ✅ **DONE**
Root cause: the bubble was `max-w-[70%]` with **no `w-fit`**, so as a flex item it collapsed to
*min-content* — rendering "Yes you can" one word per line. Added `w-fit` (sizes to content up to 70%, so
short messages stay on one line; long ones wrap normally) + `break-words` for long URLs. `DirectMessageInbox`.

### E12. Hovered top-menu icon invisible (item 19, image-25) — ✅ **DONE (FE — fixed my regression)**
The `User` icon turned **white** on hover (low contrast on the tan `#BFAD72` bg) and **stayed tan** on
focus (invisible). Now `group-hover:text-[#0a2225] group-focus-visible:text-[#0a2225]` — a dark icon on
both hover **and** focus = proper contrast (Header.tsx, both buttons). *(frontend → Lovable rebuild)*

### E13. Email-confirm click screen — **kept (A3 protection) + ✅ POLISHED** (item 20, image-26)
That screen is the **scanner-safe `/auth/verify`** click-to-complete page (A3) — removing it re-introduces
the "link expired" bug (scanners GET-prefetch and burn the one-time token; the button spends it only on a
real click). So we **kept** it and **polished it to brand** instead: real `logomark-gold` logo (not plain
text), gold accent divider, brand serif heading `text-[26px]/[28px]`, cream `#FDF9F0` bg, and an
`OnboardingWelcomeModal`-style green CTA with an arrow. *(frontend → Lovable rebuild)*

### E14. Published trip → marketplace 404 when status flipped in DB (item 21) — **BE / RLS**
`7-days-in-jordan` is **not anon-visible at all** (even unfiltered) → flipping `status` to `published`
**directly in the DB** doesn't satisfy the anon `packaged_trips` SELECT policy (it needs more than
`status='published'` — likely an approval/visibility flag the normal admin-publish sets). **Verify** the
RLS policy + what admin-approval writes. The normal review→approve flow probably works; DB-only flips
won't. **Backend / RLS.**

### E15. Logged-out → `/marketplace` bounces to the confirm-email gate (item 22, image-27) — **FE — edge case (NOT press-blocking)**
✅ **Checked:** `/marketplace` is a **public route** (`AppRoutes.tsx:259`, no `RequireAuth`) — a clean
logged-out user browses it fine, so the **press audience is safe**. The bounce is a **stale pending-signup
state**: the user started signup, didn't confirm, "logged out" without clearing the pending-confirmation
state, so a top-level effect re-shows the `/auth` confirm-email screen + "verified on another device"
toast. **Fix later:** clear the pending-signup/auth state fully on logout. Frontend, low priority.

---

## Workstream F — Travel-creator onboarding & studio (client review 2, 2026-06-30)
> Creator-onboarding items, separated per request. **FE** = frontend, **BE** = backend.
> Secondary audience (creators) — most are **post-launch**; F4 is the real broken flow but **not
> press-blocking** (Stripe isn't required to submit-for-review, per E9).

### F1. "Complete your profile" message persists after completing it (item 13, image-20) — **FE**
The Getting-Started "Complete your creator profile" item / studio banner still shows after the profile is
filled. The checklist item checks **content** (avatar+bio+niches, B7) while the **banner** keys on
`has_completed_creator_onboarding` (full wizard) — so a content-complete creator who skipped the final
wizard step still sees the banner. **Verify which surface** + align the "complete" definition. Frontend.

### F2. "Connect your payout account" struck out but Stripe NOT connected (item 14, image-21) — **FE**
Getting-Started #2 checks `stripe_connect_account_id || stripe_account_id` (ID exists) → marks done even
when a Stripe onboarding was started but **charges aren't enabled**. Over-reports "connected." **Fix:**
check `stripe_charges_enabled` / `payouts_enabled` (the real "ready" signal) — one source of truth (see
E9 / F4). Frontend.

### F3. "Publish your first product" — open existing draft + strike when pending (item 15) — **FE**
- The "Get started" CTA always opens a **new** trip-builder; it should **resume the creator's existing
  draft** if one exists.
- A trip in `pending_review` should **strike** the item (B3/B7 already count `pending_review` — verify it
  actually ticks). Frontend (checklist CTA target + completion).

### F4. Stripe Connect flow broken — entry point + edge function (item 16, image-22/23) — **FE + BE**
- **FE:** "Connect payouts" (Earnings tab) routes to `/creator-dashboard?tab=earnings`, but the actual
  connect UI is on the **Settings** tab → dead end. And **two** components exist
  (`CreatorStripeOnboarding` → `stripe-connect-link`; `StripeConnectOnboarding` → `stripe-connect-onboarding`)
  invoking different functions. **Consolidate** to one connect entry + component.
- **BE:** clicking connect → "we don't have an edge function." The functions **exist in the repo**
  (`stripe-connect-onboarding`, `stripe-connect-link`, `creator-stripe-onboarding`, …) → likely **not
  deployed** to prod (or the wrong one invoked). **Verify deployment** of the invoked function.
- Root of F2 + E9 (Stripe never actually connects). Creator blocker for **payouts**, not for submitting.

---

## Next iteration — prioritised plan for Wednesday

### P0 — must land before press (traveller-heavy traffic)
- [~] **C** — Marketplace cleanup: `marketplace_cleanup.sql` **ready** ✅; **you run it in prod** to drop the dups.
- [x] **A2** — Logged-in "Ask a Question" path ✅ *(merged to `main` + deployed)*.
- [~] **A3** — Hardening: scanner-safe magic links ✅; captcha on the public drawer ⏳ *(needs Turnstile)*.
- [~] **D / A4** — GA4 + Clarity **live in prod** ✅ + `inquiry_*` / `sign_up` events shipped ✅;
      **remaining:** GSC/Bing verification + sitemap submission.
- [x] **A1** — Reply-notification loop ✅ *(merged to `main` + deployed)*.

### P1 — creator/agent experience (they register from the press too)
- [x] **B1** — De-loop registration ✅ *(complete-profile pre-selects the chosen role; #1 metadata already in place)*.
- [x] **B2** — Creator dashboard width + serif section headers + intro/body legibility ✅.
- [x] **B3** — First product → shows in Trips tab ✅ *(Trips-tab query + checklist fix; auto-approve-vs-review decision still open)*.
- [x] **B4** — Creator surfaces polish: tab scrollbar hidden, welcome-modal z-index, profile fonts ✅.

### P2 — secondary / after launch
- [ ] **A5** — Privacy note at submit; schedule the inquiry-expire pg_cron job.
- [ ] Clean up never-converted `auth.users`.
- [ ] Homepage: lower hero friction + disambiguate the two segmentation sections.

> Recommendation: do **A2 + C** (cheap, high-impact) and stand up **analytics** first, then the
> **reply loop (A1)** and **hardening (A3)** before driving traffic. Creator polish (B) slots just
> under the traveller work since travellers dominate the press audience.
