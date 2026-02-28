

## Fix: Remove Raw Edge Function Error from Creator Dashboard

The error banner at lines 213-217 of `src/pages/CreatorDashboard.tsx` displays the raw edge function error message ("Edge Function returned a non-2xx status code") to users. This happens when `creator-dashboard-stats` fails, which is expected if the function isn't deployed or has issues.

### Change — `src/pages/CreatorDashboard.tsx`

1. **Remove the error banner entirely** (lines 213-217) — the red error box that displays `{error}`.
2. **Update the error handling in `loadStats`** (lines 105-109 and 122-125) — instead of setting error state, just silently use `EMPTY_STATS` so the dashboard still renders cleanly with zeroed-out values. Remove the `error` state variable entirely since it's no longer needed.

This way the dashboard always renders gracefully with zero values when the backend is unavailable, rather than showing a scary red error message.

