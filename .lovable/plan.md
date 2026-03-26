

## Replace Sidebar Stats with Creator Storyboards Section

### What
Replace the Followers/Avg Views/Niches stats block in the sidebar with a compact list of the creator's public storyboards. The Storyboard is the core object of Goldsainte — showcasing them on the profile elevates trust and gives visitors actionable entry points into the creator's work.

### Changes

**1. `src/pages/creators/CreatorPublicProfilePage.tsx`**
- Fetch the creator's public storyboards: `supabase.from("storyboards").select("id, title, cover_image_url, destination, tags, view_count, created_at").eq("owner_id", id).eq("is_public", true).order("updated_at", { ascending: false }).limit(5)`
- Add this to the existing parallel `Promise.all` query
- Remove the `stats` prop from `ProfileSidebar` (Followers/Avg Views/Niches array)
- Pass new `storyboards` prop to `ProfileSidebar`

**2. `src/components/profile/ProfileSidebar.tsx`**
- Replace the `stats` prop with an optional `storyboards` array prop
- Replace the stats/rating block (lines 80-129) with:
  - If storyboards exist: render compact storyboard cards (cover image thumbnail, title, destination, view count) — each linking to `/storyboards/{id}`
  - If no storyboards: show "New Creator" with empty state messaging
- Keep rating display if `rating` exists (show above storyboards)
- Each storyboard card: small horizontal layout with thumbnail (48x48 rounded), title, destination tag, clickable

### Storyboard Card Design (in sidebar)
```text
┌─────────────────────────────────┐
│ STORYBOARDS                     │
│                                 │
│ [img] Maldives Honeymoon        │
│       Maldives · 1.2K views     │
│                                 │
│ [img] Santorini Summer          │
│       Greece · 800 views        │
│                                 │
│ View all storyboards →          │
└─────────────────────────────────┘
```

- Goldsainte aesthetic: `border-[#E5DFC6]`, warm backgrounds, gold accents
- Hover: subtle lift, border glow
- "View all storyboards →" links to `/storyboards` (or a filtered view)
- Activity indicators (lastActiveText) and CTAs remain unchanged

### Files
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — fetch storyboards, pass to sidebar
- **Edit**: `src/components/profile/ProfileSidebar.tsx` — replace stats block with storyboard cards

