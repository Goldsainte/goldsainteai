import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

// Initialize Sentry for error monitoring
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENV || import.meta.env.MODE || 'development',
  enabled: import.meta.env.PROD, // Only enable in production
  tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  beforeSend(event, hint) {
    // Filter out development errors
    if (import.meta.env.DEV) {
      return null;
    }
    return event;
  },
});

// Error fallback UI
const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
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
          {error.message}
        </pre>
      </details>
      <button
        onClick={resetError}
        className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog>
    <App />
  </Sentry.ErrorBoundary>
);
