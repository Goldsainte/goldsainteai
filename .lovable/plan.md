

## Fix Mobile Responsiveness on Application Review Detail View

The screenshot shows the Brand application detail view inside the mobile Sheet with text overflow and layout issues.

### Changes in `src/pages/admin/ApplicationReviewDashboard.tsx`:

1. **Mobile Sheet width** (line 1760): Change `w-full sm:max-w-xl` to `w-full max-w-full sm:max-w-xl` and add `overflow-hidden` to prevent horizontal overflow

2. **Alert text truncation** (lines 637-641, 995-999): The "Waiting for applicant..." alert text is cut off. Add `break-words` or ensure the Alert has proper `overflow-hidden` and text wrapping

3. **Grid layouts on mobile** (line 740): Change `grid grid-cols-2 gap-6` to `grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6` for agent Business Information section

4. **Brand detail grid layouts** — same pattern: find any `grid-cols-2` in brand detail and make them `grid-cols-1 sm:grid-cols-2`

5. **Header close button + X overlap** (line 591-612, 951-970): On mobile Sheet, both "Back to list" button and the Sheet's built-in X close button show. Add `pr-8` to the header div to prevent overlap with the Sheet X button

6. **Cover image height** (line 1055): Change `h-64` to `h-48 sm:h-64` for mobile

7. **SheetContent padding** (line 1762): Change `p-6` to `p-4 sm:p-6` for tighter mobile spacing

