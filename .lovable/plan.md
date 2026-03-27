

## Fix: Template-Styled Editor with Live Preview & Customization

### Problems Identified

1. **Preview hidden by default** — `showPreview` starts `false`, button is `hidden md:flex`, so most users never see it
2. **No font/color customization** — template is locked, no way to tweak fonts or colors after selection
3. **Editor doesn't feel "styled"** — it's still a generic form with template colors on inputs, but no visual differentiation between templates
4. **"Add photos" button jumps straight to upload** — should show all 3 source options (Upload/Unsplash/Design) as equal choices
5. **Publish button styling** — the accent-colored button may have poor contrast on some templates (e.g., Midnight's yellow on dark)
6. **Mobile preview** — no way to toggle preview on mobile

### Changes (1 file: `StoryboardNewPage.tsx`)

**1. Preview on by default, toggleable everywhere**
- Set `showPreview` default to `true`
- Show the toggle button on mobile too (remove `hidden md:flex`)
- On mobile, show preview as a full-width section below the editor instead of a side column
- Add a floating "Preview" FAB on mobile

**2. Add font & color customization popover**
- Add a `<Popover>` triggered by a `<Palette>` icon button in the top bar
- Inside: font selector (switch between available Google Font pairings) and color override swatches
- Store overrides in state: `fontOverride` and `colorOverride`
- Apply overrides on top of template defaults throughout the editor and preview

**3. Better template-styled editor**
- Cover area: use template's `coverStyle` to actually shape the cover (framed = padding + rounded, split = overlay text, full-bleed = edge-to-edge)
- Content blocks: render using template's `cardStyle` more distinctly (polaroid gets white border + shadow + slight rotation, sharp = no radius, rounded = large radius)
- Add subtle template-specific decorative elements (accent-colored dividers, styled section headers)

**4. "Add photos" shows all sources by default**
- Replace the single "Add photos" dashed button with a 3-button row (Upload, Unsplash, Design) directly visible — no extra click needed
- Remove the intermediate "addMode" step for cleaner flow

**5. Bottom publish section**
- Always show the publish button at the bottom (not conditionally)
- Add a summary line: "X photos · Template: {name}"

### Files

| Action | File |
|--------|------|
| Rewrite | `src/pages/storyboards/StoryboardNewPage.tsx` |

No new files or database changes needed. The existing `StoryboardLivePreview`, `TemplatePicker`, and template definitions are fine.

