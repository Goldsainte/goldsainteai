
# Add Browse Creators & Agents Access from the Homepage

## What Changes
Add navigation links from the homepage so visitors can discover and browse creator and agent profiles directly.

## Where the Links Will Go

### 1. "Built for Every Side" Cards (HomeLuxurySections.tsx)
Currently the "Creators" and "Agents" cards link to signup/apply pages. We'll add a secondary "Browse" link to each card so visitors can explore existing profiles without signing up:
- **Creators card**: Keep existing CTA, add a "Browse Creators" text link pointing to `/creators`
- **Agents card**: Keep existing CTA, add a "Browse Agents" text link pointing to `/agents`

### 2. "Choose How You Join" Section (RoleSpecificCTAs.tsx)
Add subtle "Browse" links below each Creator and Agent card button:
- Under "Join as a Creator" button: small "Browse creators" link to `/creators`
- Under "Apply as an Agent" button: small "Browse agents" link to `/agents`

### 3. Storyboards Highlight Section (StoryboardsHighlight.tsx)
The "Explore All Curated Journeys" button already links to `/marketplace` -- no changes needed here since the marketplace trip cards already show the host, which links to their profile.

## Technical Details

### File: `src/sections/HomeLuxurySections.tsx`
In the "Built for Every Side" carousel data (around lines 36-59), add a `browseHref` and `browseLabel` field to the Creators and Agents entries. In the card rendering (around line 170), render a small secondary link below the existing CTA when `browseHref` is present.

### File: `src/components/home/RoleSpecificCTAs.tsx`
Add an optional `browseLink` and `browseLabel` field to the Creator and Agent role objects. Render a small centered text link (styled as `text-[13px] text-[#0c4d47] hover:underline`) below the button when present.

### Design
- Secondary links styled as understated text links: `text-[13px] font-medium text-[#0c4d47] hover:underline`
- Keeps the primary CTAs (signup/apply) prominent while giving browsers a discovery path
- Matches the luxury aesthetic -- no extra buttons, just elegant text links
