

## Merge "Meet the Creator" into Header + Add Social Presence

### What Changes

**1. Combine bio + specialties into ProfileHero**
The separate "Meet the Creator" section (lines 405-433 of CreatorPublicProfilePage) gets removed. Its content moves into `ProfileHero`:
- Bio text already renders in the hero — just remove the `line-clamp-2` restriction and allow full display (up to ~4 lines)
- Specialty pills move directly below the bio in the hero, styled as small gold-outlined capsules

**2. Add social accounts to ProfileHero**
Fetch `creator_social_accounts` in `CreatorPublicProfilePage` and pass them to `ProfileHero`. Display as a compact inline row of platform icons (Instagram, TikTok, LinkedIn, YouTube, X) with individual follower counts on hover, plus a total reach figure — positioned between the bio and the stats row.

Layout order inside the hero becomes:
```text
Avatar (gold ring)
Name + Verified badge
Bio (italic serif, up to 4 lines)
Specialty pills (gold-outlined capsules)
Gold flourish divider
Social icons row (monochrome icons · total reach)
Stats row (Followers | Storyboards | Posts)
CTA + Follow
```

**3. Fetch social data on page load**
Add `creator_social_accounts` to the existing `Promise.all` in the page's data-fetching `useEffect`, querying by `user_id = id`.

### Files

| Action | File | Purpose |
|--------|------|---------|
| Edit | `src/pages/creators/CreatorPublicProfilePage.tsx` | Fetch social accounts, pass to hero, remove "Meet the Creator" section |
| Edit | `src/components/profile/ProfileHero.tsx` | Add `specialties`, `socialAccounts` props; render pills + social icon row inside hero |

### Design Details
- Social icons: monochrome `#6B7280`, hover to `#0a2225`, `h-4.5 w-4.5`, spaced with `gap-3`
- TikTok icon: custom SVG (lucide doesn't have one) or use a small "Tk" text icon
- Total reach: `formatFollowers(total)+ followers` in `text-sm text-[#6B7280]` separated by a gold dot
- Specialty pills: `text-xs uppercase tracking-wider text-[#6B7280] border border-[#E5DFC6] rounded-full px-3 py-1` (same style currently used, just relocated)

