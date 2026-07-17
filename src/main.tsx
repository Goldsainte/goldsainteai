import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  });
}

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { captureGclidFromUrl } from "@/lib/analytics/gclid";
import { initAnalytics } from "@/lib/analytics/init";
// Compress oversized images in the browser before ANY storage upload
// (single choke point for all ~30 upload sites — see the module header).
import "@/lib/storageImageCompressionGuard";

// Post-publish stale-chunk guard: when a deploy replaces the JS chunks an
// open session tries to lazy-load, Vite fires this event — reload once and
// the user gets the fresh app instead of the "Something went wrong" screen.
window.addEventListener("vite:preloadError", () => {
  // Loop brake: at most one automatic reload per session.
  if (!sessionStorage.getItem("gs_chunk_reload")) {
    sessionStorage.setItem("gs_chunk_reload", "1");
    window.location.reload();
  }
});

// When a freshly published service worker takes control (skipWaiting), the
// old session's chunk map is stale — reload once so every open tab heals
// itself the moment a deploy lands.
if ("serviceWorker" in navigator) {
  let swReloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (swReloaded) return;
    swReloaded = true;
    window.location.reload();
  });
}

// Capture Google Ads click identifier (gclid) on landing so we can attribute
// downstream conversions even after navigation.
captureGclidFromUrl();

// Activate GA4 / Microsoft Clarity / search-engine verification when their env
// ids are present (safe no-op until configured).
initAnalytics();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

root.render(<App />);

// PWA service worker — register only on the production domain.
// In dev/preview, actively unregister any existing SW so Lovable previews never serve stale content.
if ("serviceWorker" in navigator) {
  const host = window.location.hostname;
  const isProduction = host === "goldsainte.ai" || host === "www.goldsainte.ai";
  if (isProduction) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister());
    }).catch(() => {});
  }
}
