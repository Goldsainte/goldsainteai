

# Complete Redesign: Trip Request Detail Page

## Problems (from screenshots)

1. **"Posted By" card floats randomly in the sidebar** — feels disconnected, not how marketplace listings work. On Airbnb/Fiverr, the poster identity is integrated into the brief header, not a standalone card.
2. **Too many small cards stacked in the sidebar** — Posted By, Trip Details, Competitive Context, How It Works — four separate cards creating visual clutter.
3. **Beige borders and gold labels everywhere** — `border-[#E5DFC6]`, `text-[#7A7151]` uppercase labels on every section. Over-designed, not clean.
4. **Text is too small** — 11-12px body text throughout. A luxury marketplace should have confident, readable 14-15px body copy.
5. **"Visual Brief" section with empty state** dominates the page with a beige box saying "No storyboard yet" — wasted space.
6. **The hero image is generic stock** — Bali temple for a Germany trip. This is a data issue but the hero treatment itself (dark gradient, pills) is acceptable.

## Redesign Approach

Rewrite the page to feel like a **luxury Airbnb listing crossed with a Fiverr job posting**:

### Layout: Single-column hero + two-column body

```text
┌─────────────────────────────────────────────┐
│  HERO: Full-width image, title, status pill │
│  Info pills: destination, dates, travelers  │
└─────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────┐
│                      │                      │
│  MAIN COLUMN         │  SIDEBAR (sticky)    │
│                      │                      │
│  Traveler identity   │  Budget card         │
│  (avatar + name      │  (large, prominent)  │
│   inline, not card)  │                      │
│                      │  Submit CTA          │
│  Description         │                      │
│  (15px, spacious)    │  Competitive context │
│                      │  (inline, not card)  │
│  Trip details grid   │                      │
│  (clean 2-col, no    │  How it works        │
│   beige borders)     │  (minimal list)      │
│                      │                      │
│  Interests tags      │                      │
│  Must-haves          │                      │
│  Dealbreakers        │                      │
│                      │                      │
│  Visual brief        │                      │
│  (only if exists)    │                      │
│                      │                      │
│  [Owner: Proposals]  │                      │
└──────────────────────┴──────────────────────┘
```

### Specific Changes

**1. Traveler identity moves into main column, inline**
- Small avatar + "Posted by {name} · Member since {date}" as a single line below the hero, not a sidebar card. Like how Airbnb shows the host at the top of the listing description.

**2. Trip details become a clean grid in main column**
- Remove from sidebar. Display as a subtle 2×3 or 3×2 grid with label/value pairs separated by light dividers — no beige borders, no cards. Just clean typography.

**3. Sidebar simplifies to 2 elements**
- **Budget card** (prominent, with gold accent) + **Submit CTA button** + competitive context as a single line ("1 proposal submitted") — not a separate card with icon.
- **How it works** stays as a compact dark card at bottom of sidebar.

**4. Typography upgrade**
- Description body text: 15px, `leading-relaxed`
- Section labels: 13px semibold, no ALL-CAPS tracking (feels sterile). Use sentence case or title case.
- Trip detail values: 14px

**5. Hide empty Visual Brief**
- Only render the storyboard section if the traveler actually has content. No empty beige boxes.

**6. Special Requests rendered inline**
- Merge into description flow with a subtle label, not a separate bordered section.

**7. Remove redundant gold label styling**
- Replace `GoldLabel` component with simpler section headers using serif font at 16-18px.

### File Modified

| File | Action |
|------|--------|
| `src/pages/marketplace/TripRequestDetail.tsx` | **Major rewrite** — restructure layout, move traveler identity inline, simplify sidebar, upgrade typography, hide empty states |

No new files needed.

