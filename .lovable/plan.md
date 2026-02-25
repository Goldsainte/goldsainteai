

# Make Vibe Tags, Must-Haves & Dealbreakers Collapsible Accordions

## What Changes

Convert the three pill-selection sections (Vibe & Experience Tags, Must-Haves, Dealbreakers) from always-visible `FieldBlock` wrappers into collapsible accordion items using the existing `Accordion` component from `@/components/ui/accordion`.

## Implementation

### `src/pages/TikTokLab/StoryboardEditorPage.tsx`

1. **Add import** for `Accordion, AccordionItem, AccordionTrigger, AccordionContent` from `@/components/ui/accordion`.

2. **Replace lines 574-623** — wrap the three sections in a single `<Accordion type="multiple">` so users can open any combination. Each section becomes an `AccordionItem`:

   - **Vibe & Experience Tags** — AccordionTrigger shows label + count of selected tags (e.g. "Vibe & Experience Tags · 3 selected"). Content contains the existing pill buttons.
   - **Must-Haves** — Same pattern with emerald styling. Shows count of selected items.
   - **Dealbreakers** — Same pattern with red styling. Shows count of selected items.

3. Styling: AccordionItems get `rounded-xl border border-[#E5DFC6] overflow-hidden` to match the existing trip details aesthetic. Triggers use `hover:no-underline` and `px-4 py-3`. Content gets the cream background `bg-[#FDF9F0]/30 px-4 py-4`.

No database changes. No new files. Single file edit.

