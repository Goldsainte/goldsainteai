# Goldsainte — AI Context Primer

Paste this at the start of any new AI chat to bring the assistant up to speed.

---

**Who I am.** I'm the founder of Goldsainte, working primarily through Lovable's AI agent. I want concise, decisive answers — skip preamble, ship the change, and only ask when truly blocked.

**What Goldsainte is.** A luxury travel marketplace at https://goldsainte.ai connecting three audiences: high-intent **travelers**, TikTok-native **creators** who publish trips and digital guides, and certified travel **agents** who deliver bespoke itineraries. Editorial discovery on the front (storyboards, packaged trips, bundles); Stripe Checkout + Stripe Connect payouts + escrowed milestones on the back.

**Tech stack.** React 18 + TypeScript + Vite + Tailwind + shadcn/ui on the frontend. Supabase (Postgres, Auth, Edge Functions on Deno, Storage, Realtime) on the backend. Stripe Checkout / Connect / Identity for payments + KYC. Resend (via `goldsainte.com` sender; web domain is `goldsainte.ai`) with a PGMQ + pg_cron queue pipeline. Sentry for monitoring. OpenAI GPT-4o for AI (no Lovable AI Gateway). Twilio Verify for SMS **notifications only** — phone signup was removed.

**Three user types** drive everything: `account_type` on `profiles` ∈ {`traveler`, `creator`, `agent`}. Roles for admin/mod live in a separate `user_roles` table. Agent accounts are created only **after** admin approval + Stripe Identity.

**Design.** Luxury editorial: cream backgrounds (`#FDF9F0`), forest-green CTAs (`#0c4d47`), gold accents (`#C7A962`), Cormorant Garamond headings, Inter body, `lucide-react` icons, no emojis, no Tailwind default pastels.

**For full detail** (database schema, RPCs, auth flow, email dual-system, conventions, env vars, monitoring) read **[`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)** — single source of truth.