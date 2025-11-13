import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { 
  setupLongTaskMonitoring, 
  setupWebVitalsMonitoring,
  monitorMemory 
} from "@/lib/monitoring/sentry-config";
import { 
  setupRageClickDetection, 
  setupDeadClickDetection,
  initializeSessionReplay 
} from "@/lib/monitoring/session-replay";
import App from "./App.tsx";
import "./index.css";

// Runtime diagnostic logging
console.info('[Sentry] import.meta.env keys:', Object.keys(import.meta.env));
console.info('[Sentry] VITE_SENTRY_DSN from env:', Boolean(import.meta.env.VITE_SENTRY_DSN), 
  import.meta.env.VITE_SENTRY_DSN ? `prefix: ${import.meta.env.VITE_SENTRY_DSN.substring(0, 20)}... (length: ${import.meta.env.VITE_SENTRY_DSN.length})` : 'empty');

// Async Sentry initialization with fallback
(async () => {
  let SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
  
  // Fallback: fetch from public config if env var is missing
  if (!SENTRY_DSN) {
    console.warn('[Sentry] VITE_SENTRY_DSN not found in import.meta.env, attempting fallback fetch from /config/sentry.json');
    try {
      const response = await fetch('/config/sentry.json', { cache: 'no-store' });
      if (response.ok) {
        const config = await response.json();
        SENTRY_DSN = config.dsn;
        console.info('[Sentry] Loaded DSN from fallback config:', Boolean(SENTRY_DSN));
        // Expose fallback status for debug UI
        (window as any).__SENTRY_FALLBACK__ = true;
      }
    } catch (error) {
      console.error('[Sentry] Failed to fetch fallback config:', error);
    }
  }

  console.info('[Sentry] Final DSN present:', Boolean(SENTRY_DSN), 'mode:', import.meta.env.MODE);

  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      release: `goldsainte@${import.meta.env.VITE_APP_VERSION || 'dev'}`,
      beforeSend(event, hint) {
        if (event.exception) {
          console.error('[Sentry] Capturing exception:', hint.originalException);
        }
        return event;
      },
    });

    setupLongTaskMonitoring();
    setupWebVitalsMonitoring();
    setupRageClickDetection();
    setupDeadClickDetection();
    initializeSessionReplay();

    setInterval(monitorMemory, 30000);
    
    console.info('[Sentry] Initialization complete');
  } else {
    console.warn('[Sentry] DSN still missing after fallback attempt. Monitoring disabled.');
  }
})();

// Error fallback UI
const ErrorFallback = ({ error }: { error: unknown }) => {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-4">
          We're sorry, but something unexpected happened. Our team has been notified.
        </p>
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Error details
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
            {errorMessage}
          </pre>
        </details>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:opacity-90 transition-opacity"
        >
          Reload page
        </button>
      </div>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog>
    <App />
  </Sentry.ErrorBoundary>
);
