

# Align Platform-Curated Trips with Mr & Mrs Smith Aesthetic

## Overview

The trip detail page and homepage cards for platform-curated trips need several refinements to match the warm, editorial luxury feel used across the rest of the site. The content and information stays -- this is purely a visual and copy polish.

## Changes

### 1. Trip Detail Page Background & Chrome

**File: `src/pages/marketplace/TrovaTripDetailPage.tsx`**

- Change page background from generic `bg-background` to warm cream `bg-[#f7f3ea]`
- Update Back button to use luxury tokens: `text-[#0a2225] hover:bg-[#FDF9F0]`
- Update loading spinner color to use `text-[#0C4D47]`
- Update error state to use luxury tokens (`bg-[#f7f3ea]`, `text-[#0a2225]`, serif heading)

### 2. Hero Title -- Handle Platform Trips Gracefully

**File: `src/components/trips/TripDetailHero.tsx`**

- When `hostName` is "Host" (the generic fallback), hide the "with Host" suffix entirely and just show the trip title
- This keeps the hero clean and editorial for platform trips without a named host

### 3. Meet Your Host Card -- Platform Concierge Treatment

**File: `src/pages/marketplace/TrovaTripDetailPage.tsx`**

- When `creator_type === 'platform'` and there is no real creator profile, replace the `MeetYourHostCard` with a "Curated by Goldsainte" card that shows:
  - The Goldsainte logo/icon instead of a broken placeholder avatar
  - "Goldsainte Concierge" as the name
  - A short editorial description: "This journey is curated by the Goldsainte team -- handpicked experiences, vetted partners, and white-glove service from start to finish."
  - No "View Full Profile" link (since there is no profile page)

### 4. Homepage Cards -- Platform Trip Attribution

**File: `src/components/home/StoryboardsHighlight.tsx`**

- For platform trips (where `creator_type === 'platform'` and no `profiles` data), show "Goldsainte Curated" with a small gold sparkle icon instead of "Agent-curated journey"
- This differentiates platform trips from agent/creator trips with a premium feel

### 5. Booking Sidebar -- Concierge Polish

**File: `src/components/trips/TripBookingSidebar.tsx`**

- For platform trips, change "Verified host" trust badge to "Goldsainte Curated" since there is no individual host to verify

## Technical Details

### TrovaTripDetailPage.tsx -- Background & Platform Host

```typescript
// Page wrapper
<div className="min-h-screen bg-[#f7f3ea]">

// Loading state
<Loader2 className="h-8 w-8 animate-spin text-[#0C4D47]" />

// Back button
<Button variant="ghost" className="mb-6 gap-2 text-[#0a2225] hover:bg-[#FDF9F0]">

// Conditional host card
{trip.creator_type === 'platform' && !trip.creator?.full_name ? (
  <section className="rounded-2xl border border-[#E5DFC6] bg-white p-6">
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A7151]">
      Curated By
    </p>
    <div className="mt-4 flex items-start gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0C4D47]">
        <Sparkles className="h-8 w-8 text-[#C7B892]" />
      </div>
      <div>
        <h3 className="font-secondary text-xl font-semibold text-[#0a2225]">
          Goldsainte Concierge
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#4a4a4a]">
          This journey is curated by the Goldsainte team...
        </p>
      </div>
    </div>
  </section>
) : (
  <MeetYourHostCard ... />
)}
```

### TripDetailHero.tsx -- Clean Title

```typescript
// Only show "with hostName" when hostName is a real name
<h1 className="font-secondary text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
  {title}
  {hostName && hostName !== "Host" && (
    <span className="text-[#C7B892]"> with {hostName}</span>
  )}
</h1>
```

### StoryboardsHighlight.tsx -- Platform Attribution

```typescript
// In the creator attribution section, for platform trips:
{trip.creator_type === 'platform' ? (
  <div className="flex items-center gap-1.5">
    <Sparkles className="h-4 w-4 text-[#C7A962]" />
    <span className="text-[10px] md:text-[11px] font-medium text-[#7A7151]">
      Goldsainte Curated
    </span>
  </div>
) : trip.profiles?.full_name ? ( ... ) : ( ... )}
```

### TripBookingSidebar.tsx -- Trust Badge

```typescript
// For platform trips, swap "Verified host" with "Goldsainte Curated"
{ icon: Shield, text: isPlatformTrip ? "Goldsainte Curated" : "Verified host" },
```

## No Database Changes

All changes are frontend styling and conditional rendering.
