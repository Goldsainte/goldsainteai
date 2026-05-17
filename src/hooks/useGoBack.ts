import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Returns a callback that navigates the user back to the previous page.
 *
 * Behavior:
 *  - If the browser has in-app history, calls `navigate(-1)` so the user
 *    returns to the exact page they came from.
 *  - Otherwise (e.g. the user landed on this page via a shared link or
 *    fresh tab), falls back to the provided `fallback` route, or "/" if
 *    none is provided.
 *
 * Use this anywhere a Back / Cancel / Close / "Go back" button currently
 * hardcodes a destination route. Pass the previous hardcoded route as the
 * `fallback` so direct-landing users still get a sensible destination.
 */
export function useGoBack(fallback?: string) {
  const navigate = useNavigate();
  return useCallback(() => {
    const hasHistory =
      typeof window !== "undefined" && window.history.length > 1;
    if (hasHistory) {
      navigate(-1);
    } else if (fallback) {
      navigate(fallback);
    } else {
      navigate("/");
    }
  }, [navigate, fallback]);
}