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

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

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
}

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
