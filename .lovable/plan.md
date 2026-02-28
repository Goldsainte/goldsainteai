

## Fix: Make Creator Dashboard Profile Photo Uploadable

The avatar in the Creator Dashboard header (lines 158-163 of `CreatorDashboard.tsx`) is display-only — it has no click handler or upload capability. The `ProfilePhotoUploader` component from `src/pages/traveler/components/ProfilePhotoUploader.tsx` already handles uploads correctly (validates files, uploads to the `avatars` storage bucket, updates the `profiles` table).

### Change — `src/pages/CreatorDashboard.tsx`

1. **Import `ProfilePhotoUploader`** from `@/pages/traveler/components/ProfilePhotoUploader`.

2. **Replace the plain `<Avatar>` block** (lines 158-163) with the `ProfilePhotoUploader` component using `size="sm"` to keep it compact in the header. Wire `onUploadComplete` to update the local profile state so the new photo renders immediately without a page refresh.

3. **Add a local state updater** so when the upload completes, `profile.avatar_url` is refreshed — either by re-fetching or by updating the cached profile object.

