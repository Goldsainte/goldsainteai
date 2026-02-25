

# Add Extensive FAQs to All Trip Detail Pages

## Problem
The `TripDetailPage` (used at `/trip/:slug`) renders the `TripFAQs` component, which only shows FAQs if the trip has them stored in the database `faqs` JSON column. Most trips have no FAQ data, so the section is completely absent.

Meanwhile, the `TrovaTripDetailPage` (used at `/marketplace/trip/:id`) already uses `TripFAQAccordion`, which has a comprehensive set of 8 default FAQs organized by category that display when no trip-specific FAQs exist.

## Fix
Replace `TripFAQs` with `TripFAQAccordion` in `TripDetailPage`. This gives every trip an extensive FAQ section automatically, while still allowing trip-specific FAQs to override when present in the database.

### File: `src/pages/trips/TripDetailPage.tsx`

1. Change import from `TripFAQs` to `TripFAQAccordion`
2. Replace the `TripFAQs` usage with `TripFAQAccordion`, passing DB FAQs when available or falling back to defaults
3. Remove the conditional rendering (`trip.faqs && length > 0` guard) so the section always appears

### Default FAQs provided by `TripFAQAccordion` (already built):

**Traveling with Goldsainte** (4 questions)
- What's it like to travel on a Goldsainte Trip?
- How does a Goldsainte Trip actually work?
- Can I book solo?
- What if I need to cancel?

**Accommodations** (1 question)
- What does 'or similar' mean next to accommodations?

**General Travel Questions** (3 questions)
- Are flights included in the trip cost?
- Do I need any vaccines?
- Can you accommodate my dietary needs?

No database changes needed. No new components needed.

