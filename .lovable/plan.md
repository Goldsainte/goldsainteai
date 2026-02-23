

# Trip Request Detail Page -- Full Luxury Elevation

## The Problem

The previous redesign added some luxury tokens (gold labels, serif headers, cream inputs) but the page still feels flat and utilitarian compared to polished pages like Creator/Agent profiles, the marketplace, and the Creator Studio. Key issues:

- The hero image uses a generic stock photo mapper instead of the trip's actual storyboard or a higher-quality destination hero
- Text sizing is too small throughout (11px, 10px labels feel cramped, not editorial)
- The proposal form reads like a boring admin form, not a luxury experience
- Cards lack the generous padding, subtle shadows, and breathing room seen elsewhere
- The "Untitled Trip" fallback looks unpolished -- needs a more elegant fallback
- The sidebar summary card is dense and clinical rather than editorial
- The storyboard section is buried in the sidebar and too small to appreciate
- No traveler info card (who posted this request) -- agents/creators want to know who they're proposing to
- The back button and overall spacing feel generic

## Plan

### 1. Elevate the Hero Section
- Increase hero height and add a subtle vignette overlay
- Use larger serif title (text-3xl to text-4xl) with more generous spacing
- Add a "Posted by [Traveler Name]" line with avatar in the hero
- Show budget range as a prominent gold-accent pill in the hero alongside destination/dates/travelers
- Better fallback title: "Trip to [Destination]" instead of "Untitled Trip"

### 2. Promote the Storyboard to a Full-Width Section
- Move the storyboard OUT of the sidebar and into a full-width section between the hero and the two-column layout
- Make it a horizontal scrollable gallery with larger tiles (180px height instead of 110px)
- Add editorial intro text: "The traveler's visual inspiration for this journey"
- This makes the storyboard impossible to miss -- it becomes the first thing agents see after the hero

### 3. Redesign the Sidebar as an Editorial Summary
- "Trip Summary" card gets more generous padding (p-6 to p-8), larger serif header
- Each detail row uses a gold accent divider between items instead of cramped flex rows
- Budget range gets its own highlighted card-within-card with gold border
- Add trip style/travel style as elegant pill badges
- Add a "Traveler" card showing who posted the request (avatar, name, member since)

### 4. Elevate the Proposal Form
- Section headers use the gold bar accent pattern (vertical gold bar + serif title) used in onboarding forms
- Increase input sizes from text-xs to text-sm, and padding from py-2.5 to py-3
- Add more spacing between form sections (space-y-6 instead of space-y-4)
- "Your Profile" card gets a more prominent layout with larger avatar and bolder social icons
- The submit button gets larger (py-3 px-8) with a subtle gold shimmer hover effect
- Legal section uses a softer design with more readable text (text-xs not text-[11px])

### 5. Typography and Spacing Pass
- Minimum text size: 12px (no more text-[10px] or text-[9px])
- Increase vertical spacing between major sections
- Description and special requests sections get editorial-style typography (text-sm leading-relaxed)
- Gold accent labels increase from text-[11px] to text-xs for better readability

### 6. Empty States and Edge Cases
- "Untitled Trip" becomes "Trip to [Destination]" or just the destination name
- Empty proposals state gets a serif headline and editorial tone
- Storyboard empty state gets a more inviting illustration-style message

## Technical Details

### Files Modified

**`src/pages/marketplace/TripRequestDetail.tsx`** -- Major restyle:
- Restructure layout: Hero -> Full-width Storyboard -> Two-column (Form + Sidebar)
- Increase all text sizes, padding, and spacing to match luxury standard
- Add traveler profile card in sidebar
- Move storyboard from sidebar to full-width section
- Better title fallback logic
- Larger, more editorial form inputs and labels

**`src/components/TripStoryboardViewer.tsx`** -- Add a "gallery" variant:
- New `variant` prop: "sidebar" (current compact grid) or "gallery" (horizontal scroll, larger tiles)
- Gallery variant uses horizontal scrolling with snap points and larger 180px tiles
- Maintains existing sidebar variant as default

### No database changes needed
All data is already available -- profiles, storyboards, trip requests.
