

# Redesign Creator and Agent Public Profile Pages

## Overview
Both `/creators/:id` and `/agents/:id` profile pages currently use an older, minimal design with tiny text (11-12px), no sidebar, no SEO metadata, and no marketplace trip listings. We'll redesign them to match the BrandProfilePage's luxury two-column layout -- the same Farfetch x Mr & Mrs Smith aesthetic used across the rest of Goldsainte.

## What the New Pages Will Include

### Shared Layout (matching BrandProfilePage)
- Sticky back-navigation bar with blur backdrop
- Full-width hero image with gradient overlay, avatar, verified badge, location pills
- Two-column layout: main content (left) + sticky sidebar (right)
- SEO metadata via Helmet
- Luxury loading skeleton and empty states

### Creator Profile Page (`/creators/:id`)

**Hero Section:**
- Featured photo as cover, circular avatar overlaid at bottom-left
- Name with serif font (font-secondary), "Goldsainte Creator" verified badge
- Location pill, social handles as subtle links
- Follower count and avg views badges (top-right, similar to rating badge on BrandHero)

**Main Content (left column):**
- About section with full bio
- Niches as styled pills (rounded-full, cream background)
- Featured photos gallery (Pinterest-style masonry)
- Marketplace trips section -- query `packaged_trips` where `creator_id` matches, display as trip cards

**Sidebar (right column):**
- Stats card (followers, avg views, niches count) in white rounded card with gold border
- "Request a Trip" primary CTA button (dark teal)
- "Save to Storyboard" secondary CTA
- Social links (TikTok, Instagram) with icons
- Trust & Safety badges (same pattern as BrandProfileSidebar)

### Agent Profile Page (`/agents/:id`)

**Hero Section:**
- Featured photo as cover, avatar overlaid
- Name with serif font, "Verified Agent" badge (if verified)
- Location pill, specialties as overlay pills

**Main Content (left column):**
- About section with bio
- Specialties as styled pills
- Social links section
- Featured photos gallery
- Marketplace trips section -- query `packaged_trips` where `creator_id` matches agent's user ID and `creator_type = 'agent'`

**Sidebar (right column):**
- Rating card (stars display, review count) -- reuse same pattern as BrandProfileSidebar
- "Request a Trip" primary CTA
- "Visit Website" if available
- "Save to Storyboard" secondary CTA
- "How It Works" steps card
- Trust & Safety badges

## Technical Details

### New Shared Components

**`src/components/profile/ProfileHero.tsx`**
Reusable hero component for both creator and agent profiles. Props: name, coverImage, avatarUrl, isVerified, verifiedLabel, location, pills (tags array), stats (optional top-right badges). Uses the same gradient overlay and layout pattern as BrandHero.

**`src/components/profile/ProfileSidebar.tsx`**
Reusable sidebar for both profile types. Props: name, rating, reviewCount, onRequestTrip, onSaveToStoryboard, socialLinks, showHowItWorks, showTrustBadges. Matches BrandProfileSidebar structure.

**`src/components/profile/ProfileTripsGrid.tsx`**
Queries `packaged_trips` for the given creator/agent ID and renders published trips as luxury cards. Links each card to `/trips/:slug`. Shows an elegant empty state if no trips exist.

### Page File Changes

**`src/pages/creators/CreatorPublicProfilePage.tsx`** -- Full rewrite
- Add Helmet for SEO
- Use ProfileHero with creator data
- Two-column grid layout (matching BrandProfilePage)
- Left: About, Niches, Gallery, ProfileTripsGrid
- Right: ProfileSidebar with stats, CTAs, social links
- Proper loading skeleton and not-found state

**`src/pages/agents/AgentPublicProfilePage.tsx`** -- Full rewrite
- Add Helmet for SEO
- Use ProfileHero with agent data
- Two-column grid layout
- Left: About, Specialties, Gallery, ProfileTripsGrid
- Right: ProfileSidebar with rating, CTAs, how-it-works
- Also query `travel_agents` table for additional agent-specific data (agency_name, rating, specializations)
- Proper loading skeleton and not-found state

### Design Tokens (consistent with BrandProfilePage)
- Background: `#FDF9F0`
- Card borders: `#E5DFC6`
- Section labels: `text-xs font-semibold uppercase tracking-wide text-[#7A7151]`
- Primary text: `#0a2225`
- Secondary text: `#6B7280`
- Headers: `font-secondary` (Playfair Display)
- Primary button: `bg-[#0c4d47] text-white`
- Pills: `rounded-full bg-[#C7B892]/20 border border-[#C7B892]/30`
- Cards: `rounded-2xl border border-[#E5DFC6] bg-white`

### Data Queries
- Creator: `profiles` table (existing fields: full_name, avatar_url, bio, location, tiktok_handle, instagram_handle, creator_niches, creator_avg_views, creator_followers, featured_photos)
- Agent: `profiles` table + `travel_agents` table (for agency_name, rating, total_reviews, specializations, destinations)
- Trips: `packaged_trips` where `creator_id = profile.id` and `status = 'published'`

### Files Created
1. `src/components/profile/ProfileHero.tsx`
2. `src/components/profile/ProfileSidebar.tsx`
3. `src/components/profile/ProfileTripsGrid.tsx`

### Files Modified
1. `src/pages/creators/CreatorPublicProfilePage.tsx` (full redesign)
2. `src/pages/agents/AgentPublicProfilePage.tsx` (full redesign)

No routing or database changes needed -- routes and data already exist.
