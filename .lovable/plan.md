

## Elevate Notifications Page to Mr & Mrs Smith Luxury Aesthetic

The current page uses tiny text sizes (9-11px), a generic icon circle, and lacks the serif typography and editorial spacing used throughout the rest of the app. Here's the plan:

### Changes in `src/pages/NotificationsPage.tsx`:

1. **Remove the icon circle** — Per the editorial typography standard, drop the Sparkles icon in the green circle. Use a simple gold divider or no icon at all.

2. **Header typography** — Change the h1 from `font-display text-[20px]` to `font-secondary` (Playfair Display) with responsive sizing `text-2xl md:text-3xl`. The subtitle label should use `text-xs tracking-[0.2em] uppercase text-[#C7A962] font-medium` (gold, not gray).

3. **Description text** — Increase from `text-sm` to `text-base md:text-lg` with `text-[#6B7280]` and add `max-w-2xl` for editorial line length.

4. **Card container** — Keep `rounded-2xl` (not 3xl), increase padding to `p-6 md:p-8`, remove `text-[11px]` base size.

5. **Notification items** — Scale up typography:
   - Title: `text-sm md:text-base font-medium` (not 11px)
   - Message: `text-sm text-[#6B7280]` (not 10px)  
   - Timestamp: `text-xs text-[#9CA3AF]` (not 9px), use `formatDistanceToNow` from date-fns for relative time ("2 hours ago")
   - Add `px-4 md:px-6 py-4 md:py-5` padding per item, with `rounded-xl` hover state
   - Unread items: subtle left gold border (`border-l-2 border-[#C7A962]`) instead of background color change

6. **Empty state** — Use serif heading "Nothing new yet" with editorial body copy, no icon, centered with generous padding (`py-16`).

7. **Loading state** — Use `text-sm text-[#6B7280]` instead of 10px.

8. **Import `formatDistanceToNow`** from date-fns to replace raw `toLocaleString()`.

