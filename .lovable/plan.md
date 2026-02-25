
# Add Two New Featured Destinations to Curated Journeys

## Destinations to Add

1. **Marrakech, Morocco** -- A luxury riad and desert experience
2. **Swiss Alps, Switzerland** -- A premium alpine escape

Both will be inserted into the `packaged_trips` table as `platform`-curated, `published`, and `is_featured = true` trips, matching the exact data pattern of the existing 6 trips.

## Database Insert

Two new rows in `packaged_trips` with these values:

| Field | Marrakech | Swiss Alps |
|-------|-----------|------------|
| title | Marrakech Riad & Desert Escape | Swiss Alps Alpine Retreat |
| slug | marrakech | swiss-alps |
| destination | Marrakech, Morocco | Swiss Alps, Switzerland |
| duration_days | 6 | 5 |
| duration_nights | 5 | 4 |
| price_per_person | 2,599 | 3,999 |
| currency | USD | USD |
| creator_type | platform | platform |
| status | published | published |
| is_featured | true | true |
| cover_image_url | Unsplash Marrakech photo | Unsplash Swiss Alps photo |
| highlights | `["Luxury Riad Stay", "Sahara Desert Tour", "Souk Experience"]` | `["Mountain Views", "Luxury Chalet", "Alpine Wellness"]` |
| description | Curated luxury experience... | Premium alpine escape... |

**Cover images** will use high-quality Unsplash photos matching the existing aesthetic (landscape-oriented, editorial quality):
- Marrakech: `https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200`
- Swiss Alps: `https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200`

## No Code Changes Needed

The `StoryboardsHighlight` component already queries all `packaged_trips` where `is_featured = true` and `status = 'published'`, so these new trips will appear automatically in the grid once inserted. The Airbnb-style card layout (aspect-[4/3], clean image, metadata below) will apply automatically.

The grid will go from 6 to 8 trips, filling two full rows in the 4-column desktop layout.
