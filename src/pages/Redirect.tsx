import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// Simple redirect page to safely open external reservation links from within the preview iframe
export default function Redirect() {
  const [params] = useSearchParams();

  useEffect(() => {
    const toParam = params.get("to");
    if (!toParam) return;

    try {
      const decoded = atob(decodeURIComponent(toParam));
      // Validate allowed hosts for safety
      const allowedHosts = [
        'google.com', 'www.google.com', 'maps.google.com',
        'goo.gl', 'app.goo.gl', 'maps.app.goo.gl', 'g.co', 'g.page',
        'tripadvisor.com', 'www.tripadvisor.com',
        'opentable.com', 'www.opentable.com',
        'resy.com', 'www.resy.com',
        'sevenrooms.com', 'www.sevenrooms.com',
        'thefork.com', 'www.thefork.com', 'thefork.us', 'www.thefork.us',
        'tock.com', 'www.tock.com', 'exploretock.com', 'www.exploretock.com',
        // Additional common restaurant destinations
        'facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com',
        'instagram.com', 'www.instagram.com',
        'linktr.ee', 'www.linktr.ee',
        'yelp.com', 'www.yelp.com',
        'toasttab.com', 'www.toasttab.com',
        'square.site', 'www.square.site'
      ];
      const target = new URL(decoded);
      const hostAllowed = allowedHosts.some(h => target.hostname === h || target.hostname.endsWith(`.${h}`));
      if (!hostAllowed) return;

      // Replace current tab with the target URL
      window.location.replace(decoded);
    } catch (e) {
      // Silently fail
    }
  }, [params]);

  return (
    <main className="min-h-[50vh] flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Opening reservation page…</p>
    </main>
  );
}
