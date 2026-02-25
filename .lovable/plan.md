

# Problem: Proposal Submission CTA is Invisible

## What's Actually Happening

The proposal form and the "Submit a Proposal" button **do exist** in the code — they're just buried where agents can't find them:

1. **The proposal form** sits at the very bottom of the left column, below the Trip Brief card, Visual Brief gallery, and any proposals section — requiring extensive scrolling
2. **The "Submit a Proposal" CTA** is in the right sidebar, which on smaller screens stacks **below** the entire left column — meaning agents have to scroll past EVERYTHING to see it
3. **No visible call-to-action** appears near the top of the page on any screen size

The screenshot confirms this: the agent sees the hero, trip brief, special requests, vibe tags, and visual brief — but zero indication that there's a proposal form below.

## Fix Plan

### Add a Prominent Floating/Sticky CTA for Non-Owners

**File: `src/pages/marketplace/TripRequestDetail.tsx`**

1. **Add a sticky bottom bar on mobile** (visible on screens below `lg:`) with a "Submit a Proposal" button that scrolls to the form — similar to how booking apps show a sticky "Book Now" bar:

```
┌─────────────────────────────────────────┐
│  Budget: $5,000–$10,000    [Submit a Proposal]  │
└─────────────────────────────────────────┘
```

This renders at the bottom of the viewport, fixed position, only for non-owners when the request is open.

2. **Add an inline CTA right after the Trip Brief card** (above the Visual Brief) so agents see a clear prompt without scrolling to the very bottom:

```
"Interested in this trip? Submit your proposal below."
[Jump to Proposal Form ↓]
```

This is a lightweight text + button that smooth-scrolls to `#proposal-form`.

3. **Keep the existing sidebar CTA** for desktop — it's fine at `lg:` breakpoint.

### Summary

| Change | Detail |
|---|---|
| Sticky mobile CTA bar | Fixed bottom bar with "Submit a Proposal" button, visible below `lg:` breakpoint, only for non-owners on open requests |
| Inline CTA after brief | Small prompt + scroll button placed between the Trip Brief card and Visual Brief section |
| No form changes | The existing proposal form stays where it is — we're just making it findable |

Single file edit: `src/pages/marketplace/TripRequestDetail.tsx`

