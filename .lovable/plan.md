## Goal
Make the entire Goldsainte Newsroom feel consistent and clean on mobile, with no oversized dropdown text, no content slipping under the sticky sub-nav, and a shared spacing/type system across every newsroom page.

## Plan
1. Create one shared mobile newsroom shell in `NewsroomLayout.tsx`
   - Reduce the mobile section-switcher select typography and control height so it reads like a compact utility nav, not a form field.
   - Make the sticky sub-nav reserve enough space below itself so page eyebrows/titles never sit underneath it.
   - Normalize the mobile nav bar height, padding, and stacking behavior.

2. Standardize mobile page headers across all newsroom pages
   - Apply one consistent mobile pattern for eyebrow, H1 size, intro copy width, and top spacing.
   - Fix pages that currently start too high or use larger-than-intended mobile heading sizes.
   - Bring `Archive`, `NewsroomLanding`, `MediaKit`, `CompanyFacts`, `Leadership`, `EditorialPolicy`, `PressContact`, and article pages into the same mobile rhythm.

3. Normalize mobile form and dropdown controls
   - Shrink select/input text sizing where it still feels oversized on phone screens.
   - Align paddings, arrow spacing, and field heights between the newsroom nav dropdown, archive filter dropdown, and press contact form controls.
   - Keep labels readable but lighter and more compact on small screens.

4. Fix mobile content density and section spacing
   - Tighten inconsistent vertical gaps between hero areas, section dividers, lists, and cards.
   - Prevent large desktop-style spacing from carrying into phone layouts.
   - Adjust long headlines and metadata rows so they wrap cleanly without awkward collisions.

5. Validate on the actual phone viewport
   - Check `/newsroom`, `/newsroom/archive`, `/newsroom/media-kit`, `/newsroom/company-facts`, `/newsroom/leadership`, `/newsroom/editorial-policy`, and `/newsroom/press-contact` at 390px width.
   - Confirm: no hidden headings, no dropdowns that feel too large, and a consistent mobile visual system across all pages.

## Technical details
- Primary files to update:
  - `src/pages/newsroom/NewsroomLayout.tsx`
  - `src/pages/newsroom/Archive.tsx`
  - `src/pages/newsroom/NewsroomLanding.tsx`
  - `src/pages/newsroom/MediaKit.tsx`
  - `src/pages/newsroom/CompanyFacts.tsx`
  - `src/pages/newsroom/Leadership.tsx`
  - `src/pages/newsroom/EditorialPolicy.tsx`
  - `src/pages/newsroom/PressContact.tsx`
  - `src/pages/newsroom/ArticleDetail.tsx`
  - `src/pages/newsroom/Markdown.tsx` if article body headings still feel oversized on mobile
- Implementation approach:
  - Prefer shared class patterns and consistent mobile breakpoints over one-off fixes.
  - Keep the existing newsroom visual style, but rebalance mobile type scale, padding, and sticky offsets.
  - Validate with live mobile preview screenshots before calling it done.