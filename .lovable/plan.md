# Fix Travel Agent Application Submission

Confirmed both root causes by inspecting the live database.

## Bug 1 — Storage bucket capped at 5MB

Bucket `application-documents` currently has `file_size_limit = 5242880` (5 MB), but the UI promises 50 MB. Anything over 5 MB fails with "object exceeded the maximum allowed size".

**Fix (migration):**
- Update `storage.buckets` for id `application-documents`: set `file_size_limit = 52428800` (50 MB) and keep the existing allowed mime types (`image/jpeg, image/png, image/jpg, image/webp, application/pdf`).

**Fix (client, `src/pages/AgentApplicationForm.tsx`):**
- In `handleFileUpload`, add a 50 MB guard before calling `supabase.storage…upload(...)` so oversized files are rejected with a clear toast instead of waiting on a server error.

## Bug 2 — `business_type` constraint mismatch

Live constraint:
```
CHECK (business_type = ANY (ARRAY['independent','agency','tour_operator','dmc']))
```

Form options (Step 1 select):
```
sole_proprietor | partnership | llc | corporation
```

Every submission violates the check. This is a true vocabulary mismatch — the DB describes the *kind of travel business*, the form describes *legal entity structure*. The cleanest fix is to align the form to the schema's domain meaning (which also matches how the rest of the marketplace categorizes agents).

**Fix (client, `src/pages/AgentApplicationForm.tsx`):**
- Change `businessType` union type to `"independent" | "agency" | "tour_operator" | "dmc" | ""`.
- Replace the four `<SelectItem>` options with:
  - Independent Advisor (`independent`)
  - Agency (`agency`)
  - Tour Operator (`tour_operator`)
  - DMC / Destination Management (`dmc`)
- Keep the existing required-field validation (already enforced at line 177 / 250).

No DB constraint change needed; this preserves data integrity and matches existing rows.

## Verification
1. Reload `/apply/agent`, walk through all 6 steps.
2. Upload a 100 KB image, a 5 MB PDF, a 30 MB file — all succeed.
3. Upload a 60 MB file — rejected client-side with a friendly toast.
4. Submit with each of the 4 new business type values — insert succeeds, lands on Verification step.

## Files touched
- New migration: raise `application-documents` size limit to 50 MB.
- `src/pages/AgentApplicationForm.tsx`: add 50 MB client check; update `businessType` type + Select options.
