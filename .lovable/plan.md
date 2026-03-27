

## Creator Profile Redesign — Luxury Storefront (Airbnb x Fiverr x Pinterest)

### What Changes

A complete restructure of `CreatorPublicProfilePage.tsx` and supporting components to follow the hierarchy: **Hero (trust) → Storyboards (desire) → Services (clarity) → Reviews (proof) → About (positioning)**.

---

### 1. Hero Section — Full-Width Destination Hero with Profile Overlay

**Replace** the current centered `ProfileHero` with a cinematic full-width cover image (using existing `cover_image_url` from profiles) and a floating profile card overlay.

- Full-width hero image (destination photo, not headshot) — uses `cover_image_url` or first storyboard image as fallback
- Floating profile card (bottom-left overlay on desktop, stacked on mobile):
  - Avatar with gold ring
  - Name + positioning title (e.g. "Luxury Europe Travel Designer") — uses `specialties[0]` or `creator_niches[0]`
  - Location
  - Star rating + review count
  - Trips completed / clients served (from `creator_profiles`)
  - Verified badge
- Single dominant CTA: **"Request a Trip"** (GS green, rounded-full)
- Follow button (secondary)
- Remove the current centered layout, stats row, and "Design My Trip" copy

**Files**: New `src/components/creator/CreatorHeroSection.tsx`, edit `CreatorPublicProfilePage.tsx`

---

### 2. Storyboards Section — Pinterest Layer (keep existing, elevate)

- Keep existing `CreatorPinterestFeed` masonry layout
- Remove the discovery/refinement chips and onboarding modals from the creator profile context (those belong on the Discover page, not a creator storefront)
- Simplify to: board filter chips + masonry grid of pins
- Each pin: large image, subtle title on hover, "Save" / "Re-pin" interaction
- Clicking a storyboard chip opens that board's pins; clicking a pin navigates to the storyboard detail page
- Section label: "Travel Collections" with gold divider

**Files**: New `src/components/creator/CreatorStorefrontFeed.tsx` (simplified version of `CreatorPinterestFeed` without discovery features), edit `CreatorPublicProfilePage.tsx`

---

### 3. Travel Services Section — Fiverr-Style Packages (NEW)

**Database**: Create `creator_services` table:
- `id`, `creator_id` (references profiles), `title`, `description`, `starting_price_cents`, `currency`, `delivery_days`, `includes` (jsonb array of strings), `revisions` (int), `is_active`, `sort_order`, `cover_image_url`, `created_at`, `updated_at`
- RLS: public read for active, creator CRUD on own rows

**UI**: Horizontal scrolling row of 3-6 service cards (Fiverr-style but luxury aesthetic):
- Each card: cover image (4/3 ratio), title, starting price ("From $X"), delivery timeline, included items (3-4 bullet points), "View Details" CTA
- Cards use white bg, `border-[#E5DFC6]`, serif title, clean sans-serif body
- No cluttered icons — text-forward, editorial feel
- Owner view: "Add Service" card with dashed border, edit/delete dropdown on existing cards

**Files**: New `src/components/creator/CreatorServicesSection.tsx`, migration SQL, edit `CreatorPublicProfilePage.tsx`

---

### 4. Reviews Section (keep, reposition)

- Move reviews below Services
- Keep existing `ReviewsList` and `WriteReviewModal`
- Add summary stats inline: average rating, total count, response time

---

### 5. About Section — Short & Sharp (NEW)

- Below reviews, a brief "About" card with:
  - Travel philosophy (italic serif, 2-3 lines max)
  - Specialties pills
  - Certifications (from `CreatorTrustSection` data)
  - "Member since" date
- Not a long bio — sharp positioning statement

**Files**: New `src/components/creator/CreatorAboutSection.tsx`

---

### 6. Final CTA Block (keep, refine)

- Keep the existing bottom CTA but update copy to match "Request a Trip" language
- Remove redundant "Design My Trip" — single CTA verb across the page

---

### Page Section Order

```text
[ Full-Width Hero Image ]
[ Profile Card Overlay: Name, Title, Stats, "Request a Trip" CTA ]
────────────────────────────────────────
[ Travel Collections — Storyboard masonry grid ]
────────────────────────────────────────
[ Travel Services — Fiverr-style package cards ]
────────────────────────────────────────
[ Reviews — Social proof ]
────────────────────────────────────────
[ About — Short positioning + credentials ]
────────────────────────────────────────
[ Final CTA — "Start Your Journey" ]
```

---

### Technical Summary

| Action | File |
|--------|------|
| Migration | Create `creator_services` table with RLS |
| Create | `src/components/creator/CreatorHeroSection.tsx` |
| Create | `src/components/creator/CreatorStorefrontFeed.tsx` |
| Create | `src/components/creator/CreatorServicesSection.tsx` |
| Create | `src/components/creator/CreatorAboutSection.tsx` |
| Edit | `src/pages/creators/CreatorPublicProfilePage.tsx` — full restructure |
| Edit | Remove `ProfileHero` usage from this page (keep component for other contexts) |

Design tokens remain consistent: cream (#FDF9F0), white cards, gold accents (#C7A962), GS green CTAs (#0c4d47), Playfair Display headers, editorial typography throughout.

