// Centralised, env-driven analytics + SEO tag setup.
//
// Each service activates ONLY when its id/string is provided via env, so this is
// a safe no-op until configured. Set these in the build env (Lovable) or
// `.env.local` (and mirror them in vite.config.ts `define`):
//
//   VITE_GA4_MEASUREMENT_ID            Google Analytics 4 — e.g. G-XXXXXXXXXX
//   VITE_CLARITY_PROJECT_ID            Microsoft Clarity project id
//   VITE_GSC_VERIFICATION              Google Search Console meta content (optional —
//                                      GA4-link or DNS verification is more robust for SPAs)
//   VITE_BING_VERIFICATION             Bing Webmaster msvalidate.01 content (optional —
//                                      importing the property from GSC is easier)
//
// Google Ads (AW-…) is already loaded statically in index.html; GA4 reuses that
// same gtag instance. Conversion label lives in conversions.ts.

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    clarity?: (...args: unknown[]) => void;
  }
}

function addVerificationMeta(name: string, content: string) {
  if (!content || document.querySelector(`meta[name="${name}"]`)) return;
  const meta = document.createElement("meta");
  meta.name = name;
  meta.content = content;
  document.head.appendChild(meta);
}

let initialised = false;

export function initAnalytics(): void {
  if (initialised || typeof window === "undefined") return;
  initialised = true;

  // Direct `import.meta.env.X` access so Vite's define-replacement applies.
  const ga4Id = import.meta.env.VITE_GA4_MEASUREMENT_ID;
  const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID;
  const gscToken = import.meta.env.VITE_GSC_VERIFICATION;
  const bingToken = import.meta.env.VITE_BING_VERIFICATION;

  // ── Google Analytics 4 ──────────────────────────────────────────────────
  // Reuse the gtag already loaded by index.html (Google Ads). gtag() is defined
  // synchronously there, so config queues even before the script finishes loading.
  if (ga4Id && typeof window.gtag === "function") {
    window.gtag("config", ga4Id, { send_page_view: true });
  }

  // ── Microsoft Clarity ───────────────────────────────────────────────────
  if (clarityId && !window.clarity) {
    (function (c: any, l: Document, a: string, r: string, i: string) {
      c[a] =
        c[a] ||
        function (...args: unknown[]) {
          (c[a].q = c[a].q || []).push(args);
        };
      const t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0];
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", clarityId);
  }

  // ── Search-engine verification (optional) ───────────────────────────────
  // For SPAs, DNS or GA4/Tag-Manager linking is the more reliable verification
  // path; these JS-injected metas are a convenience when you have the string.
  if (gscToken) addVerificationMeta("google-site-verification", gscToken);
  if (bingToken) addVerificationMeta("msvalidate.01", bingToken);
}
