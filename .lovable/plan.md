

## Compact Instagram-Style Notification Rows

Right now each notification takes up too much vertical space — title on one line, message on the next, timestamp on a third, with generous padding (`py-4 md:py-5`, `space-y-1.5`). Instagram fits everything into a single dense row.

### Changes to `src/pages/NotificationsPage.tsx`

1. **Flatten to single-line layout** — combine title + message into one inline `<p>` with the title bold and message as regular weight, separated by a space (like Instagram: "**greg_weeks_** liked your photo.")
2. **Inline the timestamp** — append the relative time on the same line in lighter text, no line break
3. **Reduce vertical padding** — drop from `py-4 md:py-5` to `py-2.5 md:py-3`
4. **Remove `space-y-1.5`** — no stacked spacing needed since everything is inline
5. **Shrink the unread dot** — keep it but move it to vertically centered (`items-center` instead of `items-start`)
6. **Reduce card inner padding** — from `p-6 md:p-8` to `p-4 md:p-5`

### Result per row
```text
• New message · You have a new message · 13 minutes ago
```
One line, dense, scannable — like Instagram's notification feed.

### File
`src/pages/NotificationsPage.tsx`

