

## 1. Social Media Content Gallery (Instagram/TikTok Reels & Photos)

### Current State
The creator profile's "Storyboard Preview" section only displays static images from `featured_photos` (a string array of URLs). There is no way to upload or display video content (Reels).

### Plan

**A. Database: Add a `creator_media` table**

New table to store mixed media (photos + videos) with source metadata:

```sql
CREATE TABLE public.creator_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'instagram', 'tiktok')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  external_id TEXT,  -- Instagram/TikTok post ID
  external_url TEXT, -- Link to original post
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creator_media ENABLE ROW LEVEL SECURITY;
-- Anyone can view
CREATE POLICY "Public read" ON public.creator_media FOR SELECT USING (true);
-- Owners can manage their own
CREATE POLICY "Owner manage" ON public.creator_media FOR ALL USING (auth.uid() = user_id);
```

**B. New component: `CreatorMediaUploader.tsx`**

Added to the onboarding Portfolio step (Step 3) alongside existing featured photos:
- Upload images or short videos (MP4, MOV) up to 50MB
- Paste an Instagram or TikTok Reel URL — extract thumbnail and store the link
- Display uploaded media in a grid with type badges (image/video/Reel)
- Remove individual items

**C. New component: `CreatorMediaGallery.tsx`**

Replaces the current "Storyboard Preview" section on the public profile:
- Mixed grid of images and videos with type indicators
- Click video thumbnails to play inline or open in a lightbox
- Instagram/TikTok items show platform badges and link to original posts
- Falls back to existing `featured_photos` if no `creator_media` rows exist

**D. Update `CreatorPublicProfilePage.tsx`**

- Fetch `creator_media` for the creator
- Render `CreatorMediaGallery` instead of the static image gallery
- Keep `featured_photos` as a legacy fallback

### Files Modified/Created
- **Migration**: New `creator_media` table + RLS
- **New**: `src/components/creator/CreatorMediaUploader.tsx`
- **New**: `src/components/creator/CreatorMediaGallery.tsx`
- **Edit**: `src/pages/onboarding/CreatorOnboardingPage.tsx` — add media uploader to Step 3
- **Edit**: `src/pages/creators/CreatorPublicProfilePage.tsx` — use new gallery component

---

## 2. Review Button Not Showing

### Root Cause
The condition on line 218 is `user && user.id !== creator.id`. If the viewing user (Radu) isn't fully authenticated when the page renders (e.g., auth state still loading), `user` is `null` and the button won't appear. The `useAuth` hook's `isLoading` state isn't being checked — the page renders before auth resolves.

### Fix
- Add `isLoading` from `useAuth()` and account for it when rendering the review section
- Show the review button for all authenticated non-owner users
- For unauthenticated users, show a "Sign in to review" prompt instead of hiding the button entirely

### File Modified
- `src/pages/creators/CreatorPublicProfilePage.tsx` — destructure `isLoading` from `useAuth()`, render review button after auth loads, add sign-in prompt for guests

