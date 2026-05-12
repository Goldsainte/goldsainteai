## Phase 1 — Shareable Storefront (this approval)

Goal: Ship the TikTok-bio-link foundation: usernames, public `/@handle` routes, unified Shop page, share buttons on every product, and embedded TikTok video carousel on creator profiles.

I'll implement Phase 1 fully and verify before asking for Phase 2 approval.

---

### 1.1 Database migration

Single migration adding to `profiles`:
- `username text UNIQUE` with format check `^[a-z0-9-]{3,30}$`
- partial index `idx_profiles_username`
- backfill from `full_name` (lowercased, alphanumerics only, deduplicated by appending suffix on collision)
- `featured_tiktok_videos jsonb DEFAULT '[]'::jsonb` (used in 1.6, included now to avoid a second migration)

Backfill safety: wrap in a DO block that checks each generated handle for uniqueness and appends `-2`, `-3`, etc. on collision so the UNIQUE constraint doesn't fail.

### 1.2 Username editing UI

Add a reusable `<UsernameField />` (input + 500ms-debounced availability check via `supabase.from('profiles').select('id').eq('username', value).neq('id', currentUserId).maybeSingle()`), live preview `goldsainte.ai/@{username}`, and inline format/availability errors.

Mount in:
- Traveler settings (within `/travel-settings` or the traveler profile edit panel — whichever is the active edit surface)
- `CreatorSettingsTab`
- `AgentDashboard` settings section

### 1.3 Username routes

In `src/routes/AppRoutes.tsx`:
- `/@:username` → `UsernameRedirect` (looks up profile, routes by `account_type`/`role` to `/agents/:id`, `/creators/:id`, or `/travel-profile/:id`; 404 if not found)
- `/@:username/shop` → `ShopPage`

Both lazy-loaded.

### 1.4 ShopPage

`src/pages/ShopPage.tsx`:
- Fetch profile by username; if missing → NotFound
- Cover (280px / 180px mobile) + overlapping avatar, name, `@username`, verified pill (existing trust signal), follower count
- Bio
- Tabs: All / Trips / Guides (Radix `Tabs`)
- Parallel fetch `packaged_trips` (creator_id = profile.id, status='published') and `itinerary_products` (same), merge sorted by `created_at desc`
- Render with existing `LiveTripCard` and `ItineraryGuideCard`
- Empty state copy as specified
- SEO: title `{Name} (@{username}) — Goldsainte`, OG tags, canonical

### 1.5 ShareButton

Create `src/components/ShareButton.tsx` per spec — `navigator.share` when available, else fallback modal with Copy / WhatsApp / Email / X. Uses design tokens (cream/dark green/gold), not raw colors.

Mount points:
- `LiveTripCard` (top-right overlay on cover)
- `ItineraryGuideCard` (top-right overlay on cover)
- Trip detail page (`TripDetailPage`) — prominent button in header actions
- Itinerary guide detail page — same
- Creator profile page — header action
- ShopPage — header action sharing the shop URL itself

### 1.6 TikTok embeds

- Settings UI on creator profile to manage up to 6 TikTok video URLs (validated against `tiktok.com/.../video/{id}` pattern), persisted to `profiles.featured_tiktok_videos`
- `src/components/TikTokEmbed.tsx` per spec, with single global script load (guard against re-injecting `embed.js`)
- "Recent Videos" horizontal scroll carousel above products on creator profile (only renders if array non-empty)

---

### Verification before declaring Phase 1 done

- Build passes
- Migration applied; spot-check a profile got a username
- Manually visit `/@<handle>` and `/@<handle>/shop` in the preview, confirm redirect + shop renders
- Confirm ShareButton opens on a card and copies URL
- Confirm TikTok carousel renders when URLs configured

---

### Out of scope for this approval

Phases 2–4 (the rest of the creator economy build) will be planned and approved separately after Phase 1 ships.
