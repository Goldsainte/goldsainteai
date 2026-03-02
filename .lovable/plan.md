

## Increase Profile Photo Max File Size to 50MB

Update all file upload validation checks across the codebase from 10MB to 50MB. There are 10 files with this limit:

### Files to Update

1. **`src/components/ProfilePhotoModal.tsx`** — line 37: `10 * 1024 * 1024` → `50 * 1024 * 1024`, error message to "50MB"
2. **`src/pages/traveler/components/ProfilePhotoUploader.tsx`** — line 60: same change
3. **`src/components/ContentUploadModal.tsx`** — line 212: same change
4. **`src/pages/apply/BrandOnboarding.tsx`** — line 234: same change
5. **`src/components/BusinessVerificationUpload.tsx`** — line 37: same change
6. **`src/components/trips/TripImageUploader.tsx`** — line 29: same change
7. **`src/components/group-trips/TripChat.tsx`** — line 41: same change
8. **`src/components/journal/ImageUpload.tsx`** — line 38: same change
9. **`src/components/onboarding/FeaturedPhotosUploader.tsx`** — line 44: same change
10. **`src/pages/proposals/NewProposalPage.tsx`** — line 215: same change

Each change is a simple find-replace of `10 * 1024 * 1024` → `50 * 1024 * 1024` and updating the corresponding error message string from "10MB" to "50MB".

