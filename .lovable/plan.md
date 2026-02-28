

## Update Mobile Bottom Nav Items

### File: `src/components/navigation/MobileBottomNav.tsx`

**Changes:**
1. Update imports: replace `Home, MessageCircle, Bell` with `PlaneTakeoff, Sparkles` (keep `Store, User`)
2. Replace `navItems` array from 5 items to 4:
   - Marketplace (`/marketplace`, `Store` icon)
   - Post a Trip (`/post-trip`, `PlaneTakeoff` icon)
   - Storyboards (`/travel-feed`, `Sparkles` icon)
   - Profile (role-based route, `User` icon)
3. Update grid from `grid-cols-5` to `grid-cols-4`
4. Remove `requireAuth` logic since none of these 4 items need it
5. Use hardcoded labels ("Marketplace", "Post a Trip", "Storyboards", "Profile") instead of translation keys to match the screenshot's style

