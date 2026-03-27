

## Storyboard Templates: Pre-Designed Layouts, Fonts, and Aesthetics

### The Problem

The current `/storyboards/new` page is a raw builder with developer jargon ("content blocks," "Step 1/2/3"). There's no creative direction — creators can't choose fonts, styles, or layouts. It feels like filling out a form, not designing a visual story.

### The Fix

Replace the stepped form with a **template-first creation flow**:

1. **Template Picker** — First screen the creator sees. A grid of 6-8 beautiful preset templates, each with a distinct aesthetic (typography, color palette, layout style). Click one to start.
2. **Visual Editor** — After picking a template, the creator fills in their content (title, destination, photos) within the template's pre-set aesthetic. Fonts, colors, and layout are already applied.
3. **Customization sidebar** — Optional: change font pairing, color palette, or layout variant after selecting a template.

### Template System (Frontend-Only, No DB Changes)

Templates are defined as TypeScript config objects — no database table needed. Each template specifies:

```text
Template = {
  id: "amalfi-golden"
  name: "Golden Hour"
  preview: "/templates/golden-hour.jpg"  (static preview image)
  fonts: { heading: "Playfair Display", body: "Inter" }
  colors: { bg: "#FDF9F0", text: "#0a2225", accent: "#C7A962" }
  layout: "magazine"  // "magazine" | "minimal" | "editorial" | "bold"
  coverStyle: "full-bleed" | "framed" | "split"
  cardStyle: "rounded" | "sharp" | "polaroid"
}
```

Layout types control how content blocks render:
- **Magazine**: Full-width hero cover, 2-column masonry grid for content images with serif captions
- **Minimal**: Centered layout, lots of whitespace, thin sans-serif type, single-column
- **Editorial**: Large title typography, alternating full-width and side-by-side image rows
- **Bold**: Dark background, large images, chunky sans-serif headings

### Changes

**1. Create `src/lib/storyboard-templates.ts`**
- Define 6-8 template configs with fonts, colors, layout, cover/card styles
- Export type definitions and the template array

**2. Create `src/components/storyboards/TemplatePicker.tsx`**
- Grid of template preview cards (3 across on desktop, 2 on mobile)
- Each card shows: preview thumbnail, template name, font sample, color dots
- Clicking selects and advances to the editor

**3. Rewrite `src/pages/storyboards/StoryboardNewPage.tsx`**
- **Phase 1 (no template selected)**: Show `TemplatePicker` full-page
- **Phase 2 (template selected)**: Show the visual editor, but now styled according to the template:
  - Title input uses the template's heading font
  - Background uses template's bg color
  - Content images render in the template's layout (masonry vs single-column vs alternating)
  - Cover area uses the template's coverStyle
- Keep all existing functionality (upload, Unsplash, design editor)
- Add a small "Change Template" button in the top bar
- Add font/color customization popover (optional override of template defaults)

**4. Create `src/components/storyboards/StoryboardPreview.tsx`**
- Live preview panel showing how the storyboard will look when published, rendered with the selected template's styles
- Shows alongside the editor on desktop, toggle-able on mobile

### UX Flow

```text
┌──────────────────────────────────────┐
│  Choose a style for your storyboard  │
│                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │Golden│  │Minima│  │Editor│       │
│  │ Hour │  │  l   │  │ ial  │       │
│  │      │  │      │  │      │       │
│  └──────┘  └──────┘  └──────┘       │
│  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ Bold │  │Tropic│  │Mono- │       │
│  │      │  │  al  │  │chrome│       │
│  └──────┘  └──────┘  └──────┘       │
└──────────────────────────────────────┘
         ↓ (click a template)
┌──────────────────────────────────────┐
│ [← Back] [Change Style] [Publish]    │
│                                      │
│  ┌─── Editor (template-styled) ───┐  │
│  │ Cover area (template layout)   │  │
│  │ Title (template heading font)  │  │
│  │ 📍 Destination                 │  │
│  │                                │  │
│  │ [Photo grid in template layout]│  │
│  │  + Add (Upload/Unsplash/Design)│  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Files

| Action | File |
|--------|------|
| Create | `src/lib/storyboard-templates.ts` |
| Create | `src/components/storyboards/TemplatePicker.tsx` |
| Create | `src/components/storyboards/StoryboardPreview.tsx` |
| Rewrite | `src/pages/storyboards/StoryboardNewPage.tsx` |

No database changes — templates are frontend config. The `storyboard_items.metadata` JSON column can store the selected template ID for rendering on the detail page.

