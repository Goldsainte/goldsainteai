

# Make All Trip Request Fields Required

## Current State
Several fields across the 6-step wizard are marked "(optional)" and have no validation gates. Only Step 1 validates destination and dates. The following fields need to become required:

### Step 1 — Destination & Dates
- **Destination** — already required
- **Departing from** — currently "(optional)", needs required marker and validation
- **Start date / End date** — already required
- **Trip nickname** — currently "(optional)", needs required marker and validation

### Step 2 — Who & Budget
- **Adults** — has default "2", no asterisk but functionally required
- **Children** — has default "0", no asterisk
- **Occasion** — currently "(optional)", needs required marker and validation
- **Budget from / Budget to** — no asterisk, needs required marker and validation
- **Budget style** — has default "elevated", functionally required

### Step 3 — Style & Interests
- **Accommodation style** — currently "(optional)", needs required marker and validation
- **Trip pace** — has default "balanced", functionally required
- **What matters most?** — no asterisk, needs at least 1 interest selected with validation

### Step 4 — Visual Storyboard
- No text inputs; skip (storyboard is already the core step)

### Step 5 — Notes & Role
- **How flexible are you?** — currently "(optional)", needs required marker and validation
- **Special notes** — currently "(optional)", needs required marker and validation
- **Who should respond?** — has default "both", functionally required

## Changes in `src/pages/trips/PostTripPage.tsx`

### 1. Update labels
Remove all `(optional)` spans and add red asterisk `*` markers to:
- Departing from (line 422)
- Trip nickname (line 442)
- Occasion (line 462)
- Budget from (line 469)
- Budget to (line 474)
- Accommodation style (line 494)
- What matters most? (line 507)
- How flexible are you? (line 591)
- Special notes (line 597)

### 2. Add per-step validation in `goNext()`
Currently only Step 0 validates destination + dates (line 220). Expand to validate each step:

```typescript
async function goNext() {
  // Step 1
  if (currentStep === 0) {
    if (!destination || !departureCity || !startsOn || !endsOn || !title) {
      setError("Please fill in all fields.");
      return;
    }
  }
  // Step 2
  if (currentStep === 1) {
    if (!adults || !occasion || !budgetMin || !budgetMax) {
      setError("Please fill in all fields.");
      return;
    }
  }
  // Step 3
  if (currentStep === 2) {
    if (!accommodationStyle || interests.length === 0) {
      setError("Please fill in all fields and select at least one interest.");
      return;
    }
  }
  // Step 5
  if (currentStep === 4) {
    if (!flexibility || !specialNotes) {
      setError("Please fill in all fields.");
      return;
    }
  }
  setError(null);
  // ... rest of goNext
}
```

### 3. Update `handleSubmit` validation
Expand the submit guard (line 246) to check all required fields before posting.

### 4. Review step (Step 6)
Remove the conditional rendering (`{occasion && ...}`, `{departureCity && ...}`, etc.) — show all rows unconditionally since every field will have a value.

