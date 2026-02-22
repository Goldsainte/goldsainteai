

# Trip Request Detail Page: Luxury Redesign + Storyboard + Profile Linking

## Overview

Redesign the Trip Request Detail page (`/marketplace/request/:id`) to match the Farfetch x Mr & Mrs Smith luxury aesthetic used across the rest of Goldsainte, and add two critical missing features:

1. **Traveler's Storyboard** -- display the storyboard attached to this trip request so agents/creators can see the visual brief
2. **Proposer Profile Linking** -- let the proposal form auto-attach the submitter's profile with socials (TikTok, Instagram, website)

---

## Design Changes (Luxury Aesthetic)

Apply consistent Goldsainte design tokens throughout the page:

- **Background**: cream `#f7f3ea` (already present)
- **Cards**: white `#FFFFFF` with `border-[#E5DFC6]` borders, `rounded-2xl`, soft shadows
- **Headers**: serif font via `font-secondary` (Playfair Display)
- **Labels**: uppercase `text-[11px] tracking-[0.2em] text-[#7A7151]` gold accent labels for section headers
- **Inputs**: cream background `bg-[#FDFBF5]`, gold focus ring `focus:ring-[#C7A962]`, `border-[#E5DFC6]`
- **Submit button**: dark teal `bg-[#0c4d47]` with white text, `rounded-full`
- **Back link**: styled as subtle gold-accented text link
- **Sidebar cards**: white cards with `border-[#E5DFC6]`, serif section titles
- **Tips card**: keep dark teal `bg-[#0c4d47]` but refine typography to match luxury system

### Specific UI refinements:
- Section titles like "Submit a proposal", "Trip summary", "Proposals" become serif (`font-secondary`) with gold accent labels above them
- Form labels use `text-[#0a2225] font-medium` instead of generic `text-foreground`
- Helper text uses `text-[#6B7280]` instead of `text-muted-foreground`
- Proposal count badge uses gold accent styling

---

## Feature: Traveler's Storyboard Section

Add the existing `TripStoryboardViewer` component to the sidebar, between the Trip Summary card and the Tips card. This component already:
- Queries `storyboards` table by `trip_request_id`
- Fetches and displays `storyboard_items` in a visual grid
- Shows a graceful empty state if no storyboard exists

The storyboard viewer's dark styling will be updated to match the luxury aesthetic (white card with gold borders instead of dark overlay).

### Implementation:
- Import `TripStoryboardViewer` in `TripRequestDetail.tsx`
- Place it in the sidebar `<aside>` between Trip Summary and Tips
- Wrap it in a luxury-styled card container
- Pass `tripId={request.id}` (the trip request ID)

---

## Feature: Proposer Profile Auto-Linking

When an agent or creator opens the proposal form, automatically display their profile info at the top of the form:

1. Fetch the current user's profile on load (display_name, avatar_url, tiktok_handle, instagram_handle, website, bio)
2. Show a "Your Profile" preview card at the top of the proposal form with:
   - Avatar + name
   - Social links (TikTok, Instagram, website) as clickable icons
   - Short bio excerpt
   - "Edit Profile" link to their profile settings
3. This data is already stored in the `profiles` table -- no schema changes needed
4. The proposer_id is already saved with the proposal, so the profile is inherently linked

---

## Technical Details

### File: `src/pages/marketplace/TripRequestDetail.tsx`

**Changes:**
1. Add import for `TripStoryboardViewer`
2. Add state for current user's profile (`userProfile`)
3. Fetch user profile in `fetchData()` when user is logged in and not the owner
4. Restyle all cards, inputs, labels, and buttons to use luxury design tokens
5. Add `TripStoryboardViewer` in sidebar
6. Add proposer profile preview card at top of proposal form
7. Add social icons (TikTok, Instagram, Globe) from lucide-react

**Profile fields fetched for proposer card:**
- `display_name`, `full_name`, `avatar_url`
- `tiktok_handle`, `instagram_handle`, `website`
- `bio` (first ~100 chars)

### No database migrations needed
- `storyboards.trip_request_id` already exists
- Profile social fields already exist
- `proposer_id` is already saved on proposals

---

## Updated Sidebar Layout

```text
+---------------------------+
| Trip Summary              |
| (destination, dates, etc) |
+---------------------------+
|                           |
| Trip Storyboard           |
| (visual mood board grid)  |
|                           |
+---------------------------+
| Tips for Choosing         |
| (dark teal card)          |
+---------------------------+
```

---

## Summary of Changes

| Area | What Changes |
|------|-------------|
| Entire page | Luxury aesthetic: serif headers, gold accents, cream inputs, refined typography |
| Sidebar | Add TripStoryboardViewer showing traveler's visual brief |
| Proposal form | Add auto-populated "Your Profile" card with avatar, socials, bio |
| Proposal form | Restyle all inputs/labels/buttons to match luxury system |
| Back button | Gold-accented styling |

