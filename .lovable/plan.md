

# Trip Request Detail Page — Redesign for Agent/Creator Clarity

## Problems Identified

From the screenshot and code review, this page confuses agents/creators in several ways:

| Issue | Detail |
|---|---|
| **Tips card is written for travelers, not agents** | "Check reviews and destination experience", "Ask questions in chat before accepting" — these are buyer tips, not seller tips |
| **"Trip style: Not specified" clutter** | Rows showing "Not specified" add noise and make the brief look incomplete |
| **"Posted by" card is buried** | It appears below the proposals section in the sidebar — agents should see WHO they're proposing to immediately |
| **Empty proposals section dominates** | "Proposals 0" with a large empty card takes prime real estate when the agent should be reading the brief |
| **Sidebar order is wrong for agents** | Should be: Traveler → Trip Details → Budget → CTA → Tips. Currently: Traveler → Details → Budget → CTA → Tips (close but tips content is wrong) |
| **No clear "what happens next" guidance** | Agent doesn't know the workflow: submit → traveler reviews → accepts → booking created |
| **Marketplace disclaimer appears twice** | Once inside the proposal form area, once below — redundant |
| **Labels like "Trip style" vs "Travel style"** | Ambiguous — merge into one or use clearer labels like "Accommodation" and "Pace" |

## Plan

### 1. Reorder & Clean Up the Page Layout

**Left column — streamline for agents:**
- **Trip Brief card** — keep as-is (description, special requests, vibes, must-haves, dealbreakers, visual brief) — this is good
- **Remove the standalone "Proposals" section for non-owners** — agents don't need to see "0 proposals" or "3 proposals submitted". Just show the proposal count as a small note near the CTA. Only the trip OWNER sees the full proposals list
- **Proposal form** — keep below the brief, but add a clear section header: "Ready to propose?" with a one-line explanation of the workflow

**Right sidebar — reorder for agent context:**
1. **Posted by** card — MOVE TO TOP so agents immediately see who the traveler is
2. **Trip Details** card — filter out "Not specified" rows, rename confusing labels
3. **Budget** card — keep
4. **Submit Proposal CTA** — keep
5. **"How it works" card** — REPLACE the current tips card with agent-focused workflow steps
6. Remove duplicate MarketplaceDisclaimer from below the left column (keep only the one inside the form)

### 2. Fix the Tips Card → "How It Works" for Agents

Replace the current traveler-focused tips with agent/creator workflow guidance:

```
How it works
1. Review the traveler's brief and visual inspiration
2. Submit your proposal with pricing and itinerary
3. The traveler reviews and compares proposals
4. If accepted, it becomes a confirmed booking
```

### 3. Clean Up Trip Details Sidebar

- **Hide rows where value is "Not specified"** — don't show empty data
- Rename "Trip style" → "Trip type" and "Travel style" → "Accommodation preference"
- Add trip length row if available from source_metadata

### 4. Simplify Proposals Section for Non-Owners

For agents/creators viewing the page:
- Remove the large empty "Be the first to propose" card
- Instead, show a small inline note above the proposal form: "Be the first to submit a proposal" or "2 proposals already submitted — stand out with yours"
- This reduces visual noise and keeps the focus on the brief + form

### 5. Move "Posted by" to Top of Sidebar

Currently buried — move it to position 1 in the sidebar so agents immediately see the traveler identity and trust signals.

## Files to Edit

| File | Changes |
|---|---|
| `src/pages/marketplace/TripRequestDetail.tsx` | Reorder sidebar (Posted by → top), hide "Not specified" rows, replace tips card with "How it works" steps, simplify non-owner proposals section, remove duplicate disclaimer, rename ambiguous labels |

Single file edit. No database changes.

