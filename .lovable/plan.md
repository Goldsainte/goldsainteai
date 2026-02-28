

## Fix: Agent Signup Button Consistency + "Skip for Now" Option

### 1. Match button shapes — `src/pages/Auth.tsx` (lines 694-718)

The Back button uses `rounded-xl` while the Continue to Application button uses `rounded-full`. Both should use the same shape (`rounded-xl`) and height (`h-12`).

**Change line 707:** `className="flex-1 h-12 rounded-full"` → `className="flex-1 h-12 rounded-xl"`
**Change line 699:** add `h-12` to Back button class so both match dimensions.

### 2. Add "Skip for Now" link — `src/pages/Auth.tsx`

Below the button row (after line 719), add a centered "Skip for now" text link that navigates the user to the traveler flow instead. This allows someone who selected agent/brand to defer the full application and still create their account as a traveler.

The link will only appear when `selectedAccountType === 'agent' || selectedAccountType === 'brand'`. Clicking it will set the account type to `'traveler'` and submit the signup form normally, bypassing the agent application redirect.

