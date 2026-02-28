

## Fix Brand Application Mobile Overflow

The brand application detail still overflows on mobile. The root issue is that the `LuxuryCard` component and its children lack overflow containment, and several elements (emails, long text, document rows) can push content beyond the viewport.

### Changes in `src/pages/admin/ApplicationReviewDashboard.tsx`:

1. **LuxuryCard component (line 540)**: Add `overflow-hidden` to the base class so all cards constrain their children:
   - Change: `bg-white rounded-2xl border border-[#E5DFC6] shadow-sm` → add `overflow-hidden`

2. **LuxuryCardHeader padding (line 546)**: Reduce padding on mobile:
   - `p-6 pb-4` → `p-4 pb-3 sm:p-6 sm:pb-4`

3. **LuxuryCardContent padding (line 557)**: Reduce padding on mobile:
   - `p-6 pt-0` → `p-4 pt-0 sm:p-6 sm:pt-0`

4. **Email link overflow (line 1072-1077)**: Add `break-all min-w-0` to the email anchor and `min-w-0` to the flex parent so long emails wrap instead of overflowing

5. **Document row (line 1218)**: Add `min-w-0` to the flex container and `truncate` to the file name text so long file names don't push the row wider

6. **Timeline rows (lines 1250-1270)**: The `w-24` fixed width on labels is fine, but the date text beside it needs `break-words min-w-0` to prevent overflow on narrow screens. Wrap in a `min-w-0` flex container.

7. **Brand detail wrapper (line 949)**: Add `overflow-hidden` to the root `div` of `BrandApplicationDetail` to catch any remaining overflow

8. **Cover image with gallery (line 1050-1057)**: The screenshot shows images side-by-side overflowing — ensure the cover image container has `overflow-hidden` and `max-w-full`

