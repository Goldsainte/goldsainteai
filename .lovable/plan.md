

# Link Curated Journeys to Their Creator or Agent

## What's Wrong Now
The "Curated Journeys, Ready to Book or Personalize" section on the homepage shows trip cards with a generic label like "Agent-curated journey" or "Creator + Agent collab" -- but there's no actual name, avatar, or clickable link to the creator or agent who made the trip.

## What Changes

### 1. Update the Query (StoryboardsHighlight.tsx)
Join `packaged_trips` with the `profiles` table via `creator_id` to fetch the creator/agent's name and avatar. The query becomes:

```
.select('id, slug, title, destination, ..., creator_id, creator_type, profiles!packaged_trips_creator_id_fkey(id, full_name, avatar_url, username)')
```

### 2. Add Creator/Agent Attribution to Each Card
Replace the generic "Agent-curated journey" text at the bottom of each card with a clickable host row:
- Small circular avatar (20px)
- Creator or agent name (e.g. "By Madison Clarke")
- Role label pill ("Creator" or "Agent")
- Clicking the host row navigates to `/creators/:id` or `/agents/:id`

### 3. Design
The host row sits below the vibe tags in the card footer, styled as:
- Avatar: `h-5 w-5 rounded-full object-cover`
- Name: `text-[10px] md:text-[11px] font-medium text-[#0a2225]`
- Role pill: `text-[8px] bg-[#C7B892]/20 text-[#7A7151] rounded-full px-1.5`
- The entire row is a separate clickable link (stops propagation so the card link still works)

## Technical Details

### File: `src/components/home/StoryboardsHighlight.tsx`

**Interface update:**
- Add `creator_id` to `FeaturedTrip`
- Add nested `profiles` object with `id`, `full_name`, `avatar_url`, `username`

**Query update:**
- Add `creator_id` and `profiles!packaged_trips_creator_id_fkey(id, full_name, avatar_url, username)` to the select

**Card rendering update:**
- Replace the `getCuratorLabel` text line with a host attribution row
- Use a `<Link>` to the creator or agent profile, with `onClick={e => e.stopPropagation()}` since the card itself is already a `<Link>`
- Determine profile route: if `creator_type === 'agent'` use `/agents/:id`, otherwise `/creators/:id`
- Fallback: if no profile data, show the old generic label

No database changes needed -- `creator_id` FK and profiles table already exist.
