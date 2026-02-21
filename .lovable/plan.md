
# Allow Guest Access to Post a Trip (Auth Only at Final Submit)

## What Changes

### 1. Remove `RequireAuth` from `/post-trip` route

**File: `src/routes/AppRoutes.tsx`** (around line 363-369)

Remove the `RequireAuth` wrapper so guests can browse the entire wizard, build storyboards, and only be stopped at the final "Post this trip" button.

### 2. Gate submission on auth, not page access

**File: `src/pages/trips/PostTripPage.tsx`**

In `handleSubmit` (line 150), instead of `throw new Error("Please sign in")`:
- Save the full form state (destination, dates, budget, storyboard items, etc.) to `sessionStorage` under key `goldsainte:pendingTrip`
- Redirect to `/auth?returnTo=/post-trip` so the user can sign up or sign in
- On mount, check `sessionStorage` for saved form state and restore all fields if found, then clear storage

This preserves all work across the auth redirect.

### 3. Let StoryboardBuilder work without auth

**File: `src/components/storyboards/StoryboardBuilder.tsx`**

In `saveStoryboard()` (line 179), when no user is signed in:
- Instead of throwing an error, store the storyboard data (title + items) into `sessionStorage` under key `goldsainte:pendingStoryboard`
- Call `onSaved("pending-auth")` so the parent wizard knows items were collected and shows the "Visual storyboard attached" badge on the review step
- Show a toast: "Your storyboard is saved locally. Sign in when you're ready to post."

When the user returns after auth, `PostTripPage` restores state including the storyboard marker.

### 4. Fix "Continue without signing in" button

**File: `src/pages/Auth.tsx`** (line 780)

Change `onClick={() => navigate('/')}` to read the `redirect` or `returnTo` query param and navigate there instead:
```
onClick={() => {
  const returnTo = getRedirectPathFromSearch(location.search);
  navigate(returnTo || '/');
}}
```

This uses the existing `getRedirectPathFromSearch` helper from `src/lib/auth/redirect.ts`, which already handles both `redirect` and `returnTo` params with path sanitization.

## Technical Details

### sessionStorage keys
- `goldsainte:pendingTrip` -- JSON of all form fields + `storyboardId`
- `goldsainte:pendingStoryboard` -- JSON of title + items array (used by StoryboardBuilder for guest saves)

### PostTripPage restore logic (on mount)
```typescript
useEffect(() => {
  const saved = sessionStorage.getItem('goldsainte:pendingTrip');
  if (saved) {
    const data = JSON.parse(saved);
    setDestination(data.destination || '');
    setTitle(data.title || '');
    // ... restore all fields
    setStoryboardId(data.storyboardId || null);
    setCurrentStep(data.currentStep || 0);
    sessionStorage.removeItem('goldsainte:pendingTrip');
  }
}, []);
```

### PostTripPage submit gate
```typescript
if (!user) {
  sessionStorage.setItem('goldsainte:pendingTrip', JSON.stringify({
    destination, title, startsOn, endsOn, budgetMin, budgetMax,
    budgetLevel, adults, children, occasion, accommodationStyle,
    pace, interests, aestheticTags, flexibility, specialNotes,
    wantsRole, storyboardId, currentStep
  }));
  navigate(`/auth?returnTo=${encodeURIComponent('/post-trip')}`);
  return;
}
```

### StoryboardBuilder guest save
```typescript
if (!user) {
  sessionStorage.setItem('goldsainte:pendingStoryboard', JSON.stringify({ title, items }));
  if (onSaved) onSaved("pending-auth");
  setSaving(false);
  return;
}
```

### No database changes needed
All changes are client-side routing and state management.
