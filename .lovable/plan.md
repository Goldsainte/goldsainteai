# Fix Step 1 Address + Years, Diagnose Document Upload

## 1. Address: autofill state + browser autocomplete (Step 1)

Currently `Business Address`, `City`, `State` are free-text `<Input>`s with no `autoComplete` hints, and Zip/Country aren't even shown on Step 1 — that's why the browser can't offer to autofill anything.

Changes in `src/pages/AgentApplicationForm.tsx` Step 1 address block:
- Add proper `autoComplete` attributes so Chrome/Safari/iOS Contacts can autofill:
  - Address → `autoComplete="street-address"`
  - City → `autoComplete="address-level2"`
  - State → `autoComplete="address-level1"`
  - Zip → `autoComplete="postal-code"` (add the missing field)
  - Country → `autoComplete="country"` (add hidden default `US`)
- Replace the State free-text input with a **Select** of all 50 US states + DC + territories (PR, VI, GU, AS, MP) using `<Select>` from shadcn. Two-letter codes as values, full name as label. This both standardizes the data and gives the "scroll to pick a state" experience.
- Add the Zip input next to State so the row is Address / City / State / Zip — matches the data already collected at submit time (`business_postal_code`).

We will **not** wire up a paid Google Places / Mapbox autocomplete in this pass. Native browser autofill (driven by the correct `autoComplete` hints above) is what most users actually expect, costs nothing, and works on iOS/Android out of the box. If you later want type-ahead address completion as you type, that requires a Google Places API key (or Mapbox/Smarty) — I'll surface that as a follow-up question after this lands.

## 2. Years of Experience: 1–9 + 10+ picker

In Step 1, replace the `Years of Experience` number `<Input>` with a shadcn `<Select>` with options `1, 2, 3, 4, 5, 6, 7, 8, 9, 10+`. Stored value stays a string; submit logic at line 449 already does `parseInt(formData.yearsExperience)` — `"10+"` would parse to `10`, which is the correct semantic for "10 or more years".

## 3. Document upload "can't get past it" — diagnose

The Documents step itself just stashes the `File` object in `formData`. The actual upload fires when you click submit, going through `handleFileUpload` → `upload-application-document` edge function → `application-documents` storage bucket. There are several known failure points:

1. **No visible error surfacing on the Documents step.** If any of the 4 uploads fails, `saveDraftApplication` throws, and the catch at line 410 routes back to `setStep(5)` — but Step 10 is the Documents step, not Step 5. So the user lands on a different page than the file pickers and sees a toast they may miss. We'll fix the step index and add an inline error banner above the upload list so the failure stays on screen.
2. **Edge function refuses if `auth.users.email` doesn't match `formData.email` exactly** (case/whitespace). The function does `email.toLowerCase()` on the incoming side but compares against `userRes.user.email.toLowerCase()` — that part is fine. But `formData.email` is taken from Step 1 readonly input, which is populated from sessionStorage. If the user signed up with `Info@Cornellfacilities.com` and signed in as `info@cornellfacilities.com` they'd match. We'll log both sides on failure so we can confirm.
3. **File size / type.** Limit is 50 MB and `application/pdf | image/jpeg | image/png`. iPhone uploads often produce `image/heic` which is **not** allowed and will 400 with "Unsupported file type: image/heic". This is very likely what's blocking you — phones default to HEIC. We'll either (a) accept HEIC in the allowlist and let the bucket store it, or (b) reject HEIC client-side with a clear "Please use JPG/PNG/PDF — your phone uploaded a HEIC file" message and a hint on how to switch iPhone camera format. Recommendation: do both — add HEIC to the allowlist *and* show a friendlier client-side message for anything outside the allowed set.
4. **Bucket missing or RLS blocking.** Worth one read query to confirm `application-documents` bucket exists and edge function has service-role write access (it does via `SUPABASE_SERVICE_ROLE_KEY`).

### Implementation for upload fix
- In `Step10Documents.tsx`, on each `<Input type="file">` `onChange`, validate the file type and size client-side before storing it; show a red inline error under the field if it fails.
- In `AgentApplicationForm.tsx` line 396 and line 410, change `setStep(5)` to `setStep(10)` (the Documents step) so the user is bounced back to the actual upload UI.
- Add a persistent error state shown at the top of Step 10 when upload fails, including the exact error from the edge function.
- In `supabase/functions/upload-application-document/index.ts`, add `image/heic` and `image/heif` to `ALLOWED_MIME` so phone uploads work without conversion, and return a more descriptive error including the filename when the type check fails.

## Files to change

- `src/pages/AgentApplicationForm.tsx` — Step 1 address fields (autoComplete + State select + Zip), Years select, fix step index on upload error, add error state
- `src/components/applications/steps/Step10Documents.tsx` — client-side validation, error banner, friendlier UX
- `supabase/functions/upload-application-document/index.ts` — allow HEIC/HEIF, better error message

## Follow-up question

After this lands, do you want **type-ahead address autocomplete** (start typing "123 Main" and get suggestions)? That requires a Google Places or Mapbox API key with billing enabled. The native browser autofill in this plan covers most users for free.
