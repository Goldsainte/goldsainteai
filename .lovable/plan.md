

# Proposal Submission Flow — End-to-End Test Results

## Critical Bug Found: Proposals Cannot Be Submitted

The proposal form in `TripRequestDetail.tsx` has a **blocking bug** that prevents any agent or creator from successfully submitting a proposal.

### Root Cause

The `handleSubmitProposal` function (line 365-386) inserts into `trip_proposals` but **never sets `proposer_id`**:

```typescript
// Current code — proposer_id is MISSING
const { data: proposalData, error: proposalError } = await supabase
  .from("trip_proposals")
  .insert({
    trip_request_id: id,
    ...(proposerRole === 'agent' ? { agent_id: user.id } : { creator_id: user.id }),
    price_from: parseFloat(newProposal.priceFrom),
    // ...
  } as any)
```

This fails for two reasons:

1. **Schema requirement**: `proposer_id` is a required (non-nullable) column on `trip_proposals`. The insert will fail with a NOT NULL constraint violation.
2. **RLS policy**: The only INSERT policy is `auth.uid() = proposer_id`. Without `proposer_id`, RLS will reject the row even if the schema somehow allowed it.

### Secondary Issue

`acknowledged_goldsainte_policies` is not a column in the `trip_proposals` table. The `as any` cast hides this TypeScript error. The database will either silently ignore it or error.

### Additional Issue: `inclusions`/`exclusions` type mismatch

The form sends these as plain strings, but the schema defines them as `string[]` (arrays). The insert may fail or store incorrectly.

## Fix Plan

### File: `src/pages/marketplace/TripRequestDetail.tsx`

**1. Add `proposer_id` and `proposer_role` to the insert** (line ~367):
```typescript
.insert({
  trip_request_id: id,
  proposer_id: user.id,           // ← ADD THIS (required)
  proposer_role: proposerRole,    // ← ADD THIS (required)
  ...(proposerRole === 'agent' ? { agent_id: user.id } : { creator_id: user.id }),
  price_from: parseFloat(newProposal.priceFrom),
  // ...rest
})
```

**2. Remove `acknowledged_goldsainte_policies`** from the insert object — it's not a database column.

**3. Fix `inclusions`/`exclusions` to send as arrays**, splitting the textarea by newlines:
```typescript
inclusions: newProposal.included ? newProposal.included.split('\n').filter(Boolean) : null,
exclusions: newProposal.notIncluded ? newProposal.notIncluded.split('\n').filter(Boolean) : null,
```

**4. Remove the `as any` cast** so TypeScript can catch future schema mismatches.

### Summary of Changes

| Issue | Severity | Fix |
|---|---|---|
| Missing `proposer_id` | **P0 — blocks all submissions** | Add `proposer_id: user.id` to insert |
| Missing `proposer_role` in insert | P0 — required column | Add `proposer_role: proposerRole` |
| `acknowledged_goldsainte_policies` not a column | P2 — silently ignored or errors | Remove from insert |
| `inclusions`/`exclusions` sent as strings, schema expects arrays | P1 — data corruption | Split by newline into arrays |
| `as any` cast hiding type errors | P2 — maintenance risk | Remove cast |

Single file to edit: `src/pages/marketplace/TripRequestDetail.tsx`

