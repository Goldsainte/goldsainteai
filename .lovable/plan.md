## Problem

`Primary Destinations` on `/onboarding/creator` (Step 3) uses `DestinationAutocompleteNominatim`. Two failure modes block users:

1. **Enter does nothing unless Nominatim returned suggestions.** `handleKeyDown` only adds when `suggestions.length > 0`. If Nominatim is slow, rate-limited (its public API throttles aggressively and frequently 403s from browser origins), or the over-strict type filter (`city/town/village/island/administrative/municipality` + class `place/boundary`) discards everything, the dropdown stays empty and the input is a dead end.
2. **No free-text fallback.** Users can't manually commit what they typed, and Step 2 validation requires `destinations.length > 0`, so onboarding cannot proceed → blocks every new creator signup.

## Fix (frontend-only, scoped to `DestinationAutocompleteNominatim.tsx`)

1. **Enter always adds something.**
   - If suggestions exist → add `suggestions[0]` (current behavior).
   - Else if `input.trim().length >= 2` → add the raw trimmed input as a free-text destination.
2. **Relax suggestion filter** so common results aren't discarded: keep any Nominatim result whose `class` is `place`, `boundary`, or `administrative`, OR whose `type` is in the existing set. Falls back to "show all results" if the filter yields zero but the API returned items.
3. **Resilience for Nominatim failures.**
   - On fetch error / non-OK / empty result, do not silently swallow — surface a small helper hint under the input: "Can't reach suggestions — press Enter to add manually."
   - Send a proper `User-Agent`-equivalent by adding `Accept-Language` header (Nominatim policy) and continue regardless.
4. **Comma key** also commits (Enter or `,`) — common UX expectation for tag inputs and reduces reliance on the dropdown.
5. **Helper copy update** under input: "Type a place and pick a suggestion, or press Enter to add it manually. {n}/{max} selected."

No changes to `CreatorOnboardingPage.tsx`, validation, schema, or other consumers (`TravelPreferencesWizard` keeps identical API — `value: string[]`, `onChange`).

## Validation

- On `/onboarding/creator` Step 3: type "Bali", press Enter with dropdown empty → chip appears, can proceed to Step 4.
- Type "Paris", wait for dropdown, press Enter → top suggestion added (unchanged behavior).
- Type "Tokyo," (comma) → chip added.
- Disconnect network / block nominatim → fallback hint shows, Enter still adds free text, user unblocked.
- `TravelPreferencesWizard` consumer still works (same props).

## Files

- `src/components/preferences/DestinationAutocompleteNominatim.tsx` — only file modified.
