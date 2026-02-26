

# Fix: Cannot Advance Past Step 1 (Your Pitch)

## Diagnosis

The "Continue" button on Step 1 is governed by `canAdvance()`:

```typescript
if (step === 0) return headline.trim().length > 0 && message.trim().length > 10;
```

Two conditions must both be true:
1. **Headline** must have at least 1 character
2. **Your Proposal** (message) must have more than 10 characters

The button shows as disabled (greyed out) when either condition fails, but there is **zero visual feedback** telling you which field is incomplete or what the requirements are. The button just stays grey with no explanation.

## Fix

**File:** `src/pages/proposals/NewProposalPage.tsx`

### 1. Add inline validation hints below each required field
- Under Headline: show "Required" in red if empty when user has interacted
- Under Message: show "Minimum 11 characters required" with current count if too short

### 2. Add a disabled-state tooltip/message near the Continue button
- When button is disabled, show a small text like "Fill in required fields to continue" so it's obvious why the button won't work

### 3. Lower the message threshold from 10 to 5
- `message.trim().length > 10` means you need **11 characters minimum**, which is unintuitive. Change to `>= 10` or reduce to a more reasonable minimum of 5 characters.

### 4. Add visual required indicators
- Add red asterisk `*` to Headline and Proposal labels (matching the pattern already used in Step 2 for "What's Included")

| File | Change |
|------|--------|
| `src/pages/proposals/NewProposalPage.tsx` | Add validation feedback messages, lower message threshold, add required field indicators, add helper text near disabled Continue button |

