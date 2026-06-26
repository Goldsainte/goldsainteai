# Ask a Question — Zero-Friction Inquiry Flow (Spec)

> **Status:** Option B (zero-friction lead capture) is **implemented** on branch `ask-aquestion`.
> This document now tracks (a) the target experience, (b) bugs found in testing on
> 2026-06-05, and (c) the next piece to build: the **agent-reply notification loop**.
> The original auth-redirect analysis (Option A) is preserved at the bottom as an appendix.

---

## Goal

**A traveller should be able to ask a specialist a question with near-zero friction — no
password, no account-type picker, no onboarding wall.**

The guiding principles:

1. **Ask first, verify later.** The traveller types their email + question on the trip page
   and is done. Identity is confirmed by clicking a magic link, not by filling a form.
2. **The magic link does double duty.** Clicking it verifies the email *and* drops the user
   straight into the live conversation with their question already sent.
3. **Profile completion is optional.** A created traveller can read and send messages with
   no name and no completed profile. Collecting a name/phone/photo is a *nice-to-have*,
   handled progressively by a non-blocking in-chat banner — never a gate.
4. **The conversation stays reachable by email.** When the specialist replies, the traveller
   gets an email whose link opens the chat log directly (again passwordless).

The whole flow is two emails: **(1)** "send your question" and **(2)** "your specialist
replied — open the chat." Everything else is optional.

---

## Target end-to-end flow

```
1. Traveller on /marketplace/trip/kyoto clicks "Ask a Question"
   → AskQuestionDrawer opens (no navigation): [email] + [your question] (+ optional first name)

2. Submit → edge function `submit-trip-inquiry` (service role, public, verify_jwt=false)
   a. Generate magic link (also creates the auth user with account_type='traveler')
   b. Insert pending_inquiries row {email, trip_id, partner_id, question, user_id, status:'pending'}
   c. (TODO) Notify the specialist that a new lead arrived
   d. Email the traveller a branded "send your question" email (Resend) with the magic link
   → Drawer shows "Check your email" inline. No page navigation.

3. Traveller clicks the link
   → /auth/verify (verifyOtp) → /auth/callback?action=ask&trip=<id>
   → AuthCallback converts the pending_inquiry:
        create conversation → insert the real question → mark inquiry 'converted'
   → navigate /messages?conversation=<id>   (MUST bypass the profile-completion gate)

4. Traveller is in the conversation, their real question already sent.
   A soft "add your name" banner appears (dismissible, never blocking).

5. Specialist replies in the web app.
   → (TODO) trigger `notify-inquiry-reply` → email the traveller:
        "‹Specialist› replied" + preview + "Open conversation" magic link
   → Link → /auth/verify → /auth/callback?action=open&conversation=<id>
   → opens the existing chat log directly (no new conversion).

6. Profile completion, if it ever happens, is the traveller's choice — from the banner
   or profile settings. It is never required to read or send messages.
```

**Clicks to first message: ~3** (open drawer → type → send) + one email click. No password,
no role picker, no onboarding.

---

## What's already built (Option B)

| Piece | Location | State |
|-------|----------|-------|
| Zero-friction drawer (email + question) | `src/components/trips/AskQuestionDrawer.tsx` | ✅ |
| `pending_inquiries` table + indexes + SELECT RLS | `supabase/migrations/20260529000001_pending_inquiries.sql` | ✅ |
| `submit-trip-inquiry` edge function (magic link + Resend) | `supabase/functions/submit-trip-inquiry/index.ts` | ✅ (`verify_jwt=false`) |
| Branded inquiry email template | `supabase/functions/_shared/email-templates/trip-inquiry.tsx` | ✅ |
| `/auth/verify` passwordless landing | `src/pages/AuthVerify.tsx` | ✅ |
| `action=ask` conversion in AuthCallback | `src/pages/AuthCallback.tsx:226-301` | ⚠️ built but fragile (see bugs) |
| Progressive "add your name" banner | `src/pages/MessagesPage.tsx` | ✅ |
| Inquiry-origin tagging (`signup_intent: 'trip_inquiry'`) | `submit-trip-inquiry` user_metadata | ✅ |

---

## Bugs & required fixes (found in testing — 2026-06-05)

Ordered by impact on the zero-friction goal.

### F1 — Magic link dumps the traveller on "Complete Your Profile" 🔴 Critical (the reported blocker)
After clicking the link, the new traveller lands on `/auth/complete-profile` (role picker +
name) instead of the chat — the exact onboarding wall this feature exists to remove.

**Why:** the `action=ask` conversion in [`AuthCallback.tsx:226-301`](../../src/pages/AuthCallback.tsx#L226-L301)
runs *before* the gate and is supposed to `navigate('/messages')` and `return`. But it is
wrapped in a `try/catch` that **silently falls through** to the profile gate at
[`AuthCallback.tsx:319-326`](../../src/pages/AuthCallback.tsx#L319-L326) on *any* failure.
For a magic-link traveller `needsCompletion` is always true (valid `account_type` but no
name, `is_profile_complete=false`), so any hiccup → onboarding wall.

**Fixes:**
1. **Exempt the inquiry flow from the gate (backstop):** when `action=ask`/`action=open` is
   present, never route to `/auth/complete-profile`. A created traveller goes to `/messages`;
   the name banner handles the rest.
2. **Make conversion robust (don't silently fall through):** move the convert step into a
   service-role edge function (`convert-inquiry`) so it can't be blocked by client RLS, and
   on conversion failure show a retry — never the onboarding page.
3. **Match the inquiry by trip:** the query currently takes the most-recent pending inquiry
   regardless of trip. Filter by the `trip` param so multi-trip users convert the right one.

### F2 — `pending_inquiries` has no UPDATE RLS policy → conversions never marked 'converted' 🔴 High (data integrity)
The migration defines a SELECT policy only
([`20260529000001_pending_inquiries.sql:39-45`](../../supabase/migrations/20260529000001_pending_inquiries.sql#L39-L45)).
The client-side `status='converted'` update in
[`AuthCallback.tsx:284-291`](../../src/pages/AuthCallback.tsx#L284-L291) runs as the
authenticated user, so RLS silently blocks it (0 rows, **no error thrown**). Rows stay
`'pending'` forever → the expire job will later flip a *converted* inquiry to `'expired'`,
and the hourly dedup check misfires.

**Fix:** do the conversion (and the status update) server-side with the service role (ties
into F1.2), or add a scoped `UPDATE` policy and stop swallowing the result.

### F3 — Lead is never delivered to the specialist unless the traveller clicks 🔴 High
`submit-trip-inquiry` emails the *traveller* but never notifies the specialist. The
conversation (and thus anything the agent can see) is only created on the first magic-link
click. If the traveller never clicks, the lead vanishes — contradicting the engagement goal.

**Fix:** notify the specialist when the inquiry is submitted (mark it an *unverified* lead to
manage spam), or at minimum surface unconverted inquiries somewhere the team monitors.
Decision needed — see Open Questions Q2.

### F4 — Email shows "this trip" instead of the real trip name 🟠 High (trust)
[`TrovaTripDetailPage.tsx:515-525`](../../src/pages/marketplace/TrovaTripDetailPage.tsx#L515-L525)
renders `TripBookingSidebar` **without a `tripTitle` prop**, so it's `undefined` all the way
to the email, which falls back to `'this trip'`
([`submit-trip-inquiry/index.ts:208`](../../supabase/functions/submit-trip-inquiry/index.ts#L208)).
A placeholder-looking email reads as spam and won't get clicked.

**Fix:** pass `tripTitle={trip.title}` to the sidebar. (Same root cause hides the trip title
in the drawer's own confirmation state.)

### F5 — Host name falls back to the generic "your specialist" 🟠 Medium (trust)
For concierge/platform trips `trip.creator?.full_name` is null, so the email greets the user
from "your specialist" while the page clearly says "Goldsainte Concierge."

**Fix:** sensible fallback (e.g. *"the Goldsainte Concierge team"*) and tie host identity to
the concierge-routing decision in F8.

### F6 — Subject line renders a raw `&rarr;` 🟠 Medium (trust/deliverability)
The received email's subject showed `&rarr;` literally. The repo subject uses a real `→`
([`submit-trip-inquiry/index.ts:232`](../../supabase/functions/submit-trip-inquiry/index.ts#L232)),
so the live email came from a **stale deploy**. Regardless: arrows/entities in subject lines
render inconsistently and nudge spam filters.

**Fix:** drop the arrow from the subject entirely; redeploy the function from `main`.

### F7 — Concierge/platform trips create an agent-less, unanswerable conversation 🟠 High
With `partner_id` null, the conversion makes a conversation with `agent_id=null`. No one owns
it, so no reply is ever sent → the reply-email loop (below) never starts.

**Fix:** route platform-trip inquiries to a concierge inbox / assignee. Decision — Q3.

### F8 — `ROOT_DOMAIN` was hardcoded to `goldsainte.ai` 🟡 Medium (dev/testing) ✅ FIXED
The function hardcoded the link origin, so magic links always pointed at production — the flow
could not be completed end-to-end from `localhost:8080` or a preview deploy (the link left your
environment).

**Fix (done):** the magic link and `redirect_to` are now built from `resolveAllowedOrigin(req)`
— the same allowlisted request origin already used for CORS. `http://localhost:8080` is in the
allowlist (`_shared/cors.ts`), so local requests get local links, previews get preview links,
and prod gets prod — from a single deployment, with no per-environment secret. Unknown origins
fall back to `ALLOWED_ORIGIN` env or `https://goldsainte.ai`. (Note: the deployed function still
needs a redeploy from this branch for the change to take effect; until then the live email keeps
pointing at prod.)

### F9 — Expire job is defined but never scheduled 🟡 Low
`expire_old_pending_inquiries()` exists
([`migration:48-60`](../../supabase/migrations/20260529000001_pending_inquiries.sql#L48-L60))
but no `cron.schedule(...)` invokes it. Mirror the `expire_old_marketplace_jobs` pg_cron
pattern, or rows accumulate in `pending` forever (worsened by F2).

### F10 — No analytics on the funnel 🟡 Low
No `inquiry_submitted` / `inquiry_converted` events. Without them the conversion rate this
feature optimizes for is unmeasurable.

### F11 — `conversation_type: 'trip_inquiry'` violates a CHECK constraint → no conversation is ever created 🔴 Critical (root cause of the empty inbox)
`user_conversations` enforces
`CHECK (conversation_type = ANY (ARRAY['primary','general','channel','request']))`,
but the conversion inserts `conversation_type: 'trip_inquiry'`
([`AuthCallback.tsx:264`](../../src/pages/AuthCallback.tsx#L264)). Postgres rejects the
insert, the F1 try/catch swallows the error, and the result is **0 conversations, 0 messages,
inquiry stuck `pending`** — exactly what `/messages` shows. The same invalid value is used in
[`TripBookingSidebar.tsx:179`](../../src/components/trips/TripBookingSidebar.tsx#L179) and
[`TripRequestDetail.tsx:552`](../../src/pages/marketplace/TripRequestDetail.tsx#L552), so
**no** conversation-creation path currently works. Verified against the local DB on 2026-06-05.

**Fix:** use an allowed value (`'general'` or `'primary'`) with `status:'active'` so the row
also lands in the default Inbox tab (the inbox query filters on `status='active'`; `'request'`
maps to a separate "Requests" tab via `status='pending'`). Fix all three call sites. Stop
swallowing the insert error (ties to F1.2).

---

## Flow re-assessment — instant access (decided 2026-06-05)

**Decision:** make the verification email a *notification channel*, not a *gate*. On submit we
create the traveller (`account_type='traveler'`, name/phone empty) **and sign them in
immediately**, dropping them straight into the conversation — no inbox round-trip.

- `submit-trip-inquiry` already calls `admin.generateLink`. Return the resulting `token_hash`
  to the client and have it call `supabase.auth.verifyOtp({ token_hash, type })` right away →
  instant session, zero email round-trip. The agent sees the lead immediately.
- Still send **one** email, but reframed: "here's your conversation / we'll email you when
  your specialist replies" — it is the entry point for the reply loop, not a wall.

**Guardrail — email ownership.** Instant sign-in means the address is not proven to belong to
the submitter, and our reply loop emails that address. Mitigate:
- Rate-limit + **captcha/Turnstile** on the public drawer (it creates accounts).
- Treat the email as **unverified** until the user clicks a real link or replies; hold/soften
  reply-notification emails until then so we never blast a stranger's inbox.
- Optional: only auto-sign-in when the email is **not** already a registered/verified user;
  otherwise fall back to the email round-trip (avoids account pre-hijacking).

**Considered & rejected for now:** Supabase anonymous sign-in (chat with no email, link later)
— purest zero-friction, but agents talk to a nameless ghost and it adds account-merging work.
Revisit only if email should be fully optional to chat.

**Profile completion stays optional** — collected progressively by the in-chat banner, never a
gate (see F1).

---

## New: Agent-reply notification loop (to build)

**Requirement:** when the specialist replies, email the traveller a link that opens the chat
log directly — passwordless.

### Trigger
A new `conversation_messages` row authored by the **agent/specialist** (not the customer) in
a conversation whose customer is an inquiry-origin traveller.

### Flow
```
agent sends message
  → DB trigger / message-send path invokes `notify-inquiry-reply` (verify_jwt=false, service role)
      a. Debounce: skip if traveller has an active recent session, or was emailed in the
         last N minutes, or hasn't yet opened the previous reply.
      b. Generate a fresh magic link, redirectTo = /auth/callback?action=open&conversation=<id>
      c. Resend a branded email: "‹Specialist› replied to your question about ‹Trip›"
         + a short preview snippet + "Open conversation →" CTA
  → traveller clicks → /auth/verify → /auth/callback?action=open&conversation=<id>
      d. AuthCallback `action=open` handler: confirm session, open that conversation
         (NO new pending-inquiry conversion), navigate /messages?conversation=<id>
```

### Notes
- Reuse `AuthVerify` + `AuthCallback`; add an `action=open` branch that just opens an existing
  conversation the user owns (RLS already scopes `user_conversations` to `customer_id`).
- The reply email's link must survive **email-scanner prefetch** (see Q1) — prefer a
  click-to-complete landing page over a GET that consumes the OTP.
- One email per burst of replies, not per message (Q4).
- If the link is expired/used, land on a friendly "get a new link" page that re-issues one.

---

## Open questions / decisions needed (what we might be missing)

| # | Question | Why it matters |
|---|----------|----------------|
| Q1 | **Email-scanner prefetch consuming single-use magic links.** Use a click-to-complete landing page (POST), a multi-use/longer-lived token, or prefetch detection? | Top cause of "the link says expired" failures in passwordless flows. Affects *both* emails. |
| Q2 | **Notify the specialist on submit (unverified) or only on first click (verified)?** | Determines whether un-clicked inquiries are still captured as leads (engagement) vs lost. Trade-off with spam. |
| Q3 | **Who owns concierge/platform-trip inquiries?** (no `partner_id`) | Without an assignee there's no responder and the reply loop never starts (F7). |
| Q4 | **Reply-email cadence / debounce + "don't email if already active."** | Avoid spamming the traveller with one email per agent message. |
| Q5 | **Magic-link expiry window + expired-link recovery UX.** | Agent may reply days later; the traveller may open the email hours later. Need re-issue path. |
| Q6 | **Bot/abuse protection on the public drawer (captcha/Turnstile) + cleanup of never-converted `auth.users`.** | A public passwordless form that creates accounts is a spam vector and pollutes the user table. |
| Q7 | **Add an optional first-name field to the drawer?** | Near-zero extra friction, but gives the specialist a human name instead of a raw email — likely lifts agent engagement. |
| Q8 | **Reply-by-email (inbound parsing) in scope?** | If not, state explicitly that replies are web-only and the email is notification-only. |
| Q9 | **Consent / privacy at submit.** | Creating an account + emailing from one form needs a clear privacy note / consent. |
| Q10 | **Session persistence expectation.** | Same-device repeat visits stay logged in and skip the magic link; the reply link is mainly for new device / expired session. Worth documenting so it isn't "fixed" by accident. |

---

## Implementation checklist

**Fixes (make the current flow actually reach the chat):**
- [ ] F11 — Replace invalid `conversation_type:'trip_inquiry'` with `'general'`/`'primary'` (+ `status:'active'`) at all 3 call sites; stop swallowing the insert error. **Root cause of the empty inbox — do first.**
- [ ] Flow — Instant sign-in on submit (return magic-link token, client `verifyOtp`) + captcha/rate-limit + unverified-email handling. See "Flow re-assessment".
- [ ] F1 — Exempt `action=ask`/`action=open` from the profile-completion gate in `AuthCallback`; make conversion robust (service-role `convert-inquiry`); match inquiry by `trip`.
- [ ] F2 — Move conversion + status update server-side (or add scoped UPDATE RLS); stop swallowing errors.
- [ ] F3 — Notify the specialist on inquiry submit (pending Q2).
- [ ] F4 — Pass `tripTitle={trip.title}` in `TrovaTripDetailPage`.
- [ ] F5 — Host-name fallback for concierge trips.
- [ ] F6 — Remove arrow from email subject; redeploy `submit-trip-inquiry` from `main`.
- [ ] F7 — Route concierge/platform inquiries to a concierge assignee (pending Q3).
- [ ] F8 — Env-drive `ROOT_DOMAIN` / link origin.
- [ ] F9 — Schedule `expire_old_pending_inquiries` via pg_cron.
- [ ] F10 — Add `inquiry_submitted` / `inquiry_converted` analytics events.

**New (agent-reply loop):**
- [ ] `notify-inquiry-reply` edge function (debounce + fresh magic link + Resend).
- [ ] DB trigger / message-send hook to invoke it on agent messages.
- [ ] `reply-notification` email template.
- [ ] `action=open` branch in `AuthCallback` (open existing conversation, no conversion).
- [ ] Scanner-safe link handling + expired-link recovery page (Q1, Q5).

---

## Appendix — superseded Option A (auth-redirect patching)

The first analysis assumed we would keep routing "Ask a Question" through `/auth` and patch
that flow (pass `role=traveler&mode=signup&action=ask`, embed the trip redirect in
`emailRedirectTo`, relax the password rules, fix "Continue without signing in", etc.). Option
B replaced this for unauthenticated travellers — they now get the drawer and never hit
`/auth`. Those Option-A fixes only matter for users who reach `/auth` through *other* entry
points and are tracked separately. Retained here for history:

- Fix 1 — `role=traveler&mode=signup` from the sidebar.
- Fix 2 — embed the trip redirect inside `emailRedirectTo`.
- Fix 4 — contextual signup copy on the auth page.
- Fix 5 — Google OAuth preserves redirect + `pending_account_type`.
- Fix 6 — trip name on the verify-email screen.
- Fix 9 — drop the special-character password rule for travellers.
- Fix 10 — fix/remove "Continue without signing in".
