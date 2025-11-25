import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { installConsoleRedaction } from "@/lib/observability/console-patch";
import { scrubPII } from "@/lib/observability/logger";
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

console.log("🚀 [Main] Starting Goldsainte initialization...");

// Install console redirection
try {
  installConsoleRedaction();
  console.log("✅ [Main] Console redaction installed");
} catch (error) {
  console.error("❌ [Main] Failed to install console redaction:", error);
}

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ [Main] Missing required environment variables:");
  if (!supabaseUrl) console.error("  - VITE_SUPABASE_URL");
  if (!supabaseKey) console.error("  - VITE_SUPABASE_PUBLISHABLE_KEY");
} else {
  console.log("✅ [Main] Environment variables validated");
}

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? (import.meta.env.PROD ? "0.2" : "1"));
const replaySessionRate = Number(import.meta.env.VITE_REPLAY_SAMPLE_RATE ?? "0.05");
const replayErrorRate = Number(import.meta.env.VITE_REPLAY_ERROR_SAMPLE_RATE ?? "1.0");
const memorySampleRate = Number(import.meta.env.VITE_MEMORY_MONITOR_SAMPLE_RATE ?? "0.05");
const rageClickSampleRate = Number(import.meta.env.VITE_RAGE_CLICK_SAMPLE_RATE ?? "0.2");

const getDiagnosticsOptIn = () => {
  try {
    return window.localStorage.getItem("goldsainte-diagnostics-opt-in") === "true";
  } catch (error) {
    return false;
  }
};

const diagnosticsOptIn = typeof window !== "undefined" ? getDiagnosticsOptIn() : false;
const replayEnabled = import.meta.env.VITE_ENABLE_SESSION_REPLAY === "true" && diagnosticsOptIn;
const enableRageClickListeners = replayEnabled && Math.random() < rageClickSampleRate;
const enableMemoryMonitor = Math.random() < memorySampleRate;

if (!sentryDsn) {
  console.warn("⚠️ [Main] Sentry DSN not configured – monitoring disabled");
}

if (sentryDsn) {
  console.log("🔧 [Main] Initializing Sentry...");
  try {
    const integrations: NonNullable<Parameters<typeof Sentry.init>[0]["integrations"]> = [
      Sentry.browserTracingIntegration(),
    ];

    if (replayEnabled) {
      integrations.push(
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        })
      );
    }

    Sentry.init({
      dsn: sentryDsn,
      integrations,
      tracesSampleRate,
      replaysSessionSampleRate: replayEnabled ? replaySessionRate : 0,
      replaysOnErrorSampleRate: replayEnabled ? replayErrorRate : 0,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_RELEASE_VERSION || "goldsainte@dev",
      beforeSend(event) {
        const sanitized = scrubPII(event);
        return sanitized;
      },
    });

    setupLongTaskMonitoring();
    setupWebVitalsMonitoring();

    if (enableRageClickListeners) {
      const teardownRage = setupRageClickDetection();
      const teardownDead = setupDeadClickDetection();
      window.addEventListener("beforeunload", () => {
        teardownRage?.();
        teardownDead?.();
      });
    }

    if (replayEnabled) {
      initializeSessionReplay();
    }

    if (enableMemoryMonitor && "memory" in performance) {
      const memoryInterval = window.setInterval(() => {
        if ("memory" in performance) {
          monitorMemory();
        }
      }, 30000);

      window.addEventListener("beforeunload", () => window.clearInterval(memoryInterval));
    }

    window.dispatchEvent(new CustomEvent("sentry-initialized"));
    console.log("✅ [Main] Sentry initialized successfully");
  } catch (error) {
    console.error("❌ [Main] Failed to initialize Sentry:", error);
    console.warn("⚠️ [Main] Continuing without Sentry monitoring");
  }
}

// Error fallback UI
const ErrorFallback = ({ error }: { error: unknown }) => {
  // Try to scrub PII but still show useful info
  const errorMessage =
    error instanceof Error ? scrubPII(error.message) : "Unknown error";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full bg-card border border-border rounded-lg p-6 shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          Something went wrong
        </h2>

        <p className="text-muted-foreground text-sm">
          We hit an unexpected issue while loading the experience.
          Our team has been notified. You can try reloading the page in the meantime.
        </p>

        {/* DEV/STAGING ONLY: expose full error for debugging */}
        {import.meta.env.DEV && (
          <details className="text-xs bg-muted rounded p-2 border border-border/40">
            <summary className="cursor-pointer mb-1 text-muted-foreground">
              Error details (dev only)
            </summary>
            <pre className="whitespace-pre-wrap text-[11px] leading-relaxed">
              {errorMessage}
            </pre>
          </details>
        )}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:opacity-90 transition-opacity text-sm font-medium"
        >
          Reload page
        </button>
      </div>
    </div>
  );
};

console.log("🎨 [Main] Mounting React app...");

try {
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);
  
  // Wrap in ErrorBoundary only if Sentry is initialized
  if (sentryDsn) {
    root.render(
      <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog>
        <App />
      </Sentry.ErrorBoundary>
    );
  } else {
    // Fallback without Sentry ErrorBoundary
    root.render(<App />);
  }
  
  console.log("✅ [Main] React app mounted successfully");
} catch (error) {
  console.error("❌ [Main] Fatal error mounting React:", error);
  
  // Fallback UI without React
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; background: #f7f3ea;">
        <div style="max-width: 28rem; width: 100%; background: white; border: 1px solid #e5dfc6; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="font-size: 1.5rem; font-weight: bold; color: #0a2225; margin-bottom: 1rem;">Unable to load application</h2>
          <p style="color: #666; font-size: 0.875rem; margin-bottom: 1rem;">Something went wrong while starting the app. Please try refreshing the page.</p>
          <pre style="background: #f5f5f5; padding: 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; overflow: auto; margin-bottom: 1rem;">${error instanceof Error ? error.message : String(error)}</pre>
          <button onclick="window.location.reload()" style="width: 100%; background: #0a2225; color: white; padding: 0.5rem 1rem; border-radius: 0.25rem; border: none; cursor: pointer; font-weight: 500;">Reload page</button>
        </div>
      </div>
    `;
  }
}
