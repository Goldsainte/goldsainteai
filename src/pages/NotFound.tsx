import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Asset-like paths (/_astro/x.webp, stale build hashes, bot probes) are
    // external noise, not users lost in the app — keep them out of the error
    // stream so route-level 404s stay meaningful.
    const last = location.pathname.split("/").pop() ?? "";
    const assetLike = last.includes(".") || location.pathname.startsWith("/_");
    if (assetLike) {
      console.info("404 (asset-like, external):", location.pathname);
    } else {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDF9F0' }}>
      <div className="text-center space-y-6 px-6">
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#C7A962' }}>404</p>
        <h1 className="font-secondary text-4xl md:text-5xl" style={{ color: '#0a2225' }}>
          Page not found
        </h1>
        <p className="text-base max-w-sm mx-auto" style={{ color: '#9A9384' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center h-12 px-8 rounded-full text-sm font-medium"
          style={{ backgroundColor: '#0c4d47', color: '#E5DFC6' }}
        >
          Return to Goldsainte
        </a>
      </div>
    </div>
  );
};

export default NotFound;
