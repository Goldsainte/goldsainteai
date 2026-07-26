import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  // The browser's automatic scroll restoration replays the LAST scroll
  // position on reload — and it fires after first paint, racing (and often
  // beating) the scrollTo below once async content stretches the page.
  // That is why pages could open scrolled down at the footer (founder
  // report, Jul 26). Take manual control.
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      // Async pages (dashboards) render short, then stretch as data lands;
      // a late restored scroll can leave the viewport mid-page. Within 250ms
      // of a route change any non-zero scroll is almost certainly restoration
      // rather than the user, so re-assert top once after paint.
      const t = setTimeout(() => {
        if (window.scrollY === 0) return;
        window.scrollTo(0, 0);
      }, 250);
      return () => clearTimeout(t);
    }
    // Safety: reset any lingering body/html scroll locks left over from
    // closed modals, drawers, joyrides, etc. on every route change so
    // pages are always scrollable.
    try {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.height = "";
      document.body.style.width = "";
      document.body.style.paddingRight = "";
    } catch {
      /* noop */
    }
  }, [pathname, hash]);

  return null;
};
