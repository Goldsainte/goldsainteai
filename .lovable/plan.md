

# Add Trip-Specific FAQs to All Featured Trips

## Current State

| Trip | Current FAQs |
|------|-------------|
| Kyoto Cultural Immersion | 1 (language) |
| Santorini Sunset Escape | 1 (best time) |
| Bali Wellness Retreat | 1 (yoga experience) |
| Patagonia Adventure | 1 (fitness) |
| Amalfi Coast Long Weekend | 2 (best time, solo travel) |
| Cape Town & Winelands | 2 (visa, safety) |
| Marrakech Riad & Desert Escape | 0 |
| Swiss Alps Alpine Retreat | 0 |

## Plan

Update the `faqs` JSON column for all 8 trips with 5-6 destination-specific questions each. Each FAQ will include `question`, `answer`, and `category` fields matching the `TripFAQAccordion` format. Categories will be tailored per trip (e.g., "Culture & Etiquette", "Food & Dining", "Getting Around", "Weather & Packing", "Health & Safety").

The existing FAQs will be preserved and expanded upon. The default generic FAQs in `TripFAQAccordion` will still show as fallback for non-featured trips.

## FAQs Per Trip

### Kyoto Cultural Immersion (currently 1 → 6)
- Do I need to speak Japanese? (keep existing)
- When is the best time to visit Kyoto?
- What should I wear when visiting temples?
- Is the food accommodating for vegetarians?
- How do we get around Kyoto?
- Do I need to tip in Japan?

### Santorini Sunset Escape (currently 1 → 6)
- When is the best time to visit? (keep existing)
- How do we get to Santorini?
- Is this trip suitable for non-swimmers?
- What should I pack?
- Are the walking paths steep?
- Can I extend my stay after the trip?

### Bali Wellness Retreat (currently 1 → 6)
- Do I need yoga experience? (keep existing)
- What does a typical day look like?
- Is Bali safe for solo female travelers?
- What's the weather like?
- Are spa treatments included?
- Can I accommodate food allergies?

### Patagonia Adventure (currently 1 → 6)
- How fit do I need to be? (keep existing)
- What gear should I bring?
- What's the weather like in Patagonia?
- Is there Wi-Fi or cell service on the trail?
- What kind of accommodation is on the trek?
- Do I need travel insurance?

### Amalfi Coast Long Weekend (currently 2 → 6)
- What is the best time to visit? (keep existing)
- Is this trip suitable for solo travelers? (keep existing)
- How do we travel along the coast?
- Is the trip suitable for families?
- What food experiences are included?
- Do I need to speak Italian?

### Cape Town & Winelands (currently 2 → 6)
- Do I need a visa? (keep existing)
- Is it safe? (keep existing)
- What's the weather like?
- Are wine tastings included in the price?
- Can non-drinkers enjoy the Winelands portion?
- What wildlife might we see?

### Marrakech Riad & Desert Escape (currently 0 → 6)
- What should I wear in Morocco?
- Is it safe for solo travelers?
- How hot does it get in the desert?
- Do I need to speak French or Arabic?
- What is a riad?
- Can I drink tap water?

### Swiss Alps Alpine Retreat (currently 0 → 6)
- What fitness level is required?
- What should I pack?
- Is the trip available year-round?
- Are ski passes or equipment included?
- What language is spoken?
- How do we get to the chalet?

## Implementation

8 database UPDATE statements against the `packaged_trips` table, each setting the `faqs` column to a JSON array of 6 objects. No code changes needed -- `TripFAQAccordion` already renders these categories and questions.

