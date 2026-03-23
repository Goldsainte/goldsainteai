

## Fix: Broken Unsplash Images for Tokyo and Amalfi

### Root Cause
The Unsplash image URLs for both **Tokyo** and **Amalfi/Amalfi Coast** in `src/utils/tripImages.ts` are returning **404 errors** — the photos have been removed or relocated by Unsplash.

### Fix
Replace the two dead URLs with working Unsplash photos:

**File: `src/utils/tripImages.ts`**

- **Line 24-25** — Replace Amalfi Coast and Amalfi entries with a working Amalfi Coast photo (e.g. `photo-1633321702518-7feccafb94d5` or similar coastal Italy image)
- **Line 36** — Replace Tokyo entry with a working Tokyo photo (e.g. `photo-1540959733332-eab4deabeeaf` — Tokyo Tower at night, a well-known stable Unsplash image)

### Also fixes (pre-existing build error)
The `DestinationAutocomplete.tsx` TypeScript errors referencing `google` namespace — these need the `@types/google.maps` package or type declarations added. This is a separate issue but is blocking the build.

