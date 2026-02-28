

## Fix Footer Not Sticking to Bottom

### Root cause

The flex height chain relies on `@layer base` CSS rules which have lower cascade priority. The `#root` flex rules are in `@layer base` but lack `min-height: 100vh`, and the AppContent wrapper in `App.tsx` uses only `flex-1` without `min-h-screen`. This means the height chain from html → body → #root → content isn't guaranteed to fill the viewport.

### Changes

#### 1. Add `min-h-screen` to AppContent wrapper (`src/App.tsx`)

Change the wrapper div from:
```tsx
<div className="flex-1 flex flex-col w-full max-w-full">
```
to:
```tsx
<div className="min-h-screen flex-1 flex flex-col w-full max-w-full">
```

This makes the layout explicitly fill the viewport regardless of CSS cascade issues with `@layer base`.

#### 2. Add `min-height: 100vh` to `#root` in `src/index.css`

In the `#root` rule at line 177-181, add `min-height: 100vh` to ensure the root element itself fills the viewport:

```css
#root {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
```

These two changes make the height chain bulletproof — the footer's existing `mt-auto` will then work correctly to push it to the bottom on short pages.

### Files
1. `src/App.tsx` — add `min-h-screen` to AppContent wrapper
2. `src/index.css` — add `min-height: 100vh` to `#root`

