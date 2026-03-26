

## Remove Social Section from Sidebar

### What
Remove the "SOCIAL" card from `ProfileSidebar.tsx` since social credibility is now displayed prominently in the main content area via `CreatorSocialCards`.

### Changes

**`src/components/profile/ProfileSidebar.tsx`**
- Delete lines 191-221 (the entire `{/* Social links */}` block)
- Optionally clean up the `SocialLink` interface and `socialLinks` prop if no longer used elsewhere — but keeping them is harmless

