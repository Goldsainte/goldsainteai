

## Add Creator Social Accounts — Manual Entry + Public Display

### Overview
Create a new `creator_social_accounts` table for storing per-platform social data (handle, URL, follower count). Add a management UI in the Creator Dashboard Portfolio tab. Display social cards with formatted follower counts on the public profile, replacing the current basic social links.

### Database Migration

```sql
CREATE TABLE public.creator_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  followers_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.creator_social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view social accounts"
  ON public.creator_social_accounts FOR SELECT USING (true);

CREATE POLICY "Users can manage own social accounts"
  ON public.creator_social_accounts FOR ALL USING (auth.uid() = user_id);
```

### Changes

**1. New component: `src/components/creator/CreatorSocialAccountsEditor.tsx`**
- Platform dropdown (Instagram, TikTok, LinkedIn, Pinterest, YouTube, Twitter/X)
- Inputs: Profile URL, Handle, Follower Count
- Add/Edit/Delete per social entry
- Platform icons using lucide or inline SVGs
- Data stored as array of objects, managed in local state, saved via parent

**2. `src/pages/creator/components/CreatorPortfolioTab.tsx`**
- Add a "Social Accounts" section below the media gallery
- Load social accounts from `creator_social_accounts` on mount
- Save social accounts (upsert + delete removed) alongside media save

**3. New component: `src/components/creator/CreatorSocialCards.tsx`**
- Public-facing display component
- Grid of cards: platform icon, platform name, handle, formatted follower count (1.2K, 24.8K, 112K, 1.4M)
- Each card clickable → opens profile URL in new tab
- "Total social reach: XXK+ followers" header when ≥1 social exists
- Empty state: "No social profiles added yet"

**4. `src/pages/creators/CreatorPublicProfilePage.tsx`**
- Fetch `creator_social_accounts` for the creator in the initial parallel query
- Replace the current `socialLinks` array (built from `tiktok_handle`/`instagram_handle`) with data from the new table
- Render `<CreatorSocialCards>` between the media gallery and trust section (high on page for credibility)
- Still pass social data to `ProfileSidebar` for the sidebar social links

**5. `src/components/profile/ProfileSidebar.tsx`**
- Update `SocialLink` interface to include optional `followersCount`
- Show formatted follower count next to handle in sidebar

### Formatting Helper
```typescript
function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return count.toString();
}
```

### Files
- **Migration**: Create `creator_social_accounts` table
- **New**: `src/components/creator/CreatorSocialAccountsEditor.tsx` — dashboard editor
- **New**: `src/components/creator/CreatorSocialCards.tsx` — public display cards
- **Edit**: `src/pages/creator/components/CreatorPortfolioTab.tsx` — load/save socials
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — fetch + render social cards
- **Edit**: `src/components/profile/ProfileSidebar.tsx` — show follower counts

