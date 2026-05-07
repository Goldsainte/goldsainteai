
## Goal
Replace the 4-tab "How Goldsainte AI works" accordion with a 3-tab audience-based "How Goldsainte Works" section — same layout, spacing, typography, accordion mechanics, image panel, and luxury aesthetic.

## File touched
- `src/sections/HomeLuxurySections.tsx` — only the `HowGoldsainteWorksSection` component and its `tabsData` / `tabImages` constants. Keep all other sections, imports, and styling untouched.

## Position
Already correct: in `src/pages/Index.tsx` and `src/pages/HomePage.tsx`, `<HowGoldsainteWorksSection />` renders directly after `<HomeHero />` (and after `<TwoWaysComparison />`). Per the request to sit "immediately after the hero, before the larger marketplace grid", we'll move it to render directly after `<HomeHero />` and before `<TwoWaysComparison />` in both `Index.tsx` and `HomePage.tsx`.

## Content changes

Replace `tabsData` (4 items: Personalizes / Creates / Matches / Books) with 3 audience tabs. Each tab keeps the same `id / label / icon / features[]` shape so the existing accordion + animation code keeps working unchanged.

```ts
[
  {
    id: "travelers",
    label: "For Travelers",
    icon: Compass,            // from lucide-react
    captionLabel: "Discover & Book",
    features: [
      {
        icon: Sparkles,
        title: "Book curated trips instantly.",
        description:
          "Explore ready-made itineraries and travel packages created by trusted creators and certified travel agents. Personalize your trip or book one in minutes.",
      },
    ],
  },
  {
    id: "creators",
    label: "For Creators",
    icon: Camera,             // from lucide-react
    captionLabel: "Create & Monetize",
    features: [
      {
        icon: Wand2,
        title: "Turn your trips into income.",
        description:
          "Upload travel photos, videos, or past trip content and let Goldsainte AI help transform it into a sellable itinerary others can discover, purchase, and personalize.",
      },
    ],
  },
  {
    id: "agents",
    label: "For Travel Agents",
    icon: Briefcase,          // from lucide-react
    captionLabel: "Sell & Customize",
    features: [
      {
        icon: ClipboardList,
        title: "Sell packages or bid on custom trips.",
        description:
          "List curated travel packages, customize experiences for travelers, and respond to custom trip requests from users looking for expert planning.",
      },
    ],
  },
]
```

Add a `captionLabel?: string` field to the `TabData` type. The existing image overlay currently shows `{activeTabData.label}` ("Personalizes" etc.); switch it to render `activeTabData.captionLabel ?? activeTabData.label` so the right-side caption changes per audience:
- Travelers → "Discover & Book"
- Creators → "Create & Monetize"
- Travel Agents → "Sell & Customize"

The accordion content grid currently uses `md:grid-cols-2`. Since each audience has a single feature, change to `grid-cols-1` so the body card sits flush and elegant rather than orphaned in a 2-col grid. Keep the icon + title + description layout exactly as is.

## Header copy
- Eyebrow pill: keep the existing "Powered by AI" (still true and visually anchors the section). Skip removing it to preserve the visual treatment.
- Title: change `How <span className="italic">Goldsainte AI</span> works` → `How <span className="italic">Goldsainte</span> Works`.
- Subtitle: replace with: *"A curated travel marketplace where travelers discover experiences, creators monetize itineraries, and certified agents sell or customize travel packages."*
- Footer note (about on-platform comms/payments): keep as-is — aligns with the brand's on-platform-only rule.

## Image mapping
Reuse existing imports already at the top of the file — no new assets:
- `travelers` → `santoriniStepsImg`
- `creators` → `creatorCanyonImg`
- `agents` → `agentPlanningImg`

Set `useState("travelers")` as the initial open tab.

## Icons
Add `Compass`, `Camera`, `Briefcase`, `ClipboardList` to the existing `lucide-react` import line in `HomeLuxurySections.tsx`. Leave the other icons in place — they're used elsewhere in the file (Trust & Safety section).

## Out of scope
- Visual redesign of the section (explicitly disallowed).
- Translation keys: copy is hard-coded inline today (English strings live in the component), so we'll follow the existing pattern and inline the new strings rather than introducing partial i18n.
- Changes to `HomeHero`, `TwoWaysComparison`, `StoryboardsHighlight`, or any marketplace grid component.
