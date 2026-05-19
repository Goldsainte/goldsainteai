import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
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
