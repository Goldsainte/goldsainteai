

# Remove Cheesy Icons from Trip Detail Sections

## Problem
Multiple trip detail components use heavy, round icon badges (colored circles with Lucide icons inside) that feel generic and out of place against the refined luxury aesthetic. The "Goldsainte Concierge" section has a large dark teal circle with a sparkle emoji that looks particularly cheesy.

## Components to Update

### 1. `src/pages/marketplace/TrovaTripDetailPage.tsx` — Goldsainte Concierge Section (lines 234-246)
- Remove the large dark circle with Sparkles icon
- Replace with a simple gold monogram or just clean text — use a subtle gold "G" letter in a refined circle (thin border, no fill), or remove the avatar entirely and let the serif typography speak for itself

### 2. `src/components/trips/TripTrustBadges.tsx`
- Remove the `Users` icon from the header
- Remove the icon circles from each badge card (CreditCard, Globe, Star, MessageCircle icons in gold circles)
- Use clean text-only cards with just the serif title and description — let typography carry the design
- Remove the icon import entirely

### 3. `src/components/trips/TripTrustFooter.tsx`
- Same treatment: remove the icon circles (Shield, CreditCard, MessageCircle, FileCheck) from trust point cards
- Text-only cards with serif headers

### 4. `src/components/trips/TripActivityLevelBadge.tsx`
- Remove the large colored icon circle (Footprints, Activity, Mountain, Zap)
- Replace with a simple text label or a thin gold pill badge showing the level
- Keep the description text

### 5. `src/components/trips/TripAirportsCard.tsx`
- Remove the Plane icon circles
- Use a simple em dash or thin gold bullet as a list indicator instead

### 6. `src/components/trips/TripEssentialInfoLinks.tsx`
- Remove the Shield, FileText, AlertTriangle, MapPin icons from the link cards
- Keep the ExternalLink arrow (functional, not decorative)
- Clean text-only link cards

### 7. `src/components/trips/TripCancellationPolicySection.tsx`
- Remove the colored status icon circles (Check, AlertCircle, X)
- Remove the Shield icon from the insurance recommendation
- Use a simple colored dot or left border accent to indicate tier status (green/amber/red)

## Design Approach
Replace all decorative icon circles with editorial typography: uppercase tracking labels, serif headers, and clean whitespace. Where visual hierarchy is needed, use a thin gold left border, a small colored dot, or just font weight/size contrast. This matches Mr. and Mrs. Smith's text-forward editorial style.

## Files Modified (7 files)
- `src/pages/marketplace/TrovaTripDetailPage.tsx`
- `src/components/trips/TripTrustBadges.tsx`
- `src/components/trips/TripTrustFooter.tsx`
- `src/components/trips/TripActivityLevelBadge.tsx`
- `src/components/trips/TripAirportsCard.tsx`
- `src/components/trips/TripEssentialInfoLinks.tsx`
- `src/components/trips/TripCancellationPolicySection.tsx`

