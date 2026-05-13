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
