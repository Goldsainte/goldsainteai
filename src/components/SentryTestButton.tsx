import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/react";
import { trackPerformance } from "@/lib/monitoring/sentry-config";
import { markCriticalFlow, captureErrorWithReplay } from "@/lib/monitoring/session-replay";
import { useState, useEffect } from "react";

export function SentryTestButton() {
  const [testCount, setTestCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Listen for Sentry initialization completion
    const handleSentryInit = () => {
      setIsInitialized(true);
    };

    window.addEventListener('sentry-initialized', handleSentryInit);

    // Robust init guard: poll for up to 2 seconds
    let pollCount = 0;
    const maxPolls = 10; // 10 polls * 200ms = 2 seconds
    const pollInterval = setInterval(() => {
      pollCount++;
      const dsnFromEnv = import.meta.env.VITE_SENTRY_DSN;
      const fallbackUsed = (window as any).__SENTRY_FALLBACK__;
      
      if (dsnFromEnv || fallbackUsed) {
        setIsInitialized(true);
        clearInterval(pollInterval);
      } else if (pollCount >= maxPolls) {
        // After 2 seconds, stop polling
        clearInterval(pollInterval);
      }
    }, 200);

    return () => {
      window.removeEventListener('sentry-initialized', handleSentryInit);
      clearInterval(pollInterval);
    };
  }, []);

  const triggerTestError = () => {
    try {
      markCriticalFlow('sentry_test', 'error_triggered');
      throw new Error('Test error from Sentry monitoring validation');
    } catch (error) {
      captureErrorWithReplay(error as Error, {
        testId: testCount,
        timestamp: new Date().toISOString(),
      });
      setTestCount(c => c + 1);
    }
  };

  const triggerSlowOperation = () => {
    markCriticalFlow('sentry_test', 'performance_test');
    const start = performance.now();
    
    // Simulate slow operation
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
      result += Math.random();
    }
    
    const duration = performance.now() - start;
    trackPerformance({
      component: 'SentryTest',
      operation: 'slow_operation',
      duration,
      metadata: { result, testCount },
    });
  };

  const triggerWarning = () => {
    Sentry.captureMessage('Test warning message', {
      level: 'warning',
      tags: { test: 'true', count: testCount.toString() },
      extra: { timestamp: Date.now() },
    });
    setTestCount(c => c + 1);
  };

  const fallbackUsed = (window as any).__SENTRY_FALLBACK__;
  const dsnFromEnv = import.meta.env.VITE_SENTRY_DSN;
  const allowControls = isInitialized && Boolean(dsnFromEnv || fallbackUsed);
  
  if (!isInitialized || !allowControls) {
    console.warn('[Sentry] No DSN available (env or fallback).');
    if (import.meta.env.DEV) {
      return (
        <div className="fixed bottom-20 left-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-sm">
          <p className="text-sm font-medium text-yellow-800 mb-1">
            ⚠️ Sentry DSN Missing
          </p>
          <p className="text-xs text-yellow-700">
            Add VITE_SENTRY_DSN to env or create /config/sentry.json
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 flex flex-col gap-2 p-4 bg-white border border-border rounded-lg shadow-lg">
      <p className="text-sm font-medium">Sentry Test Controls</p>
      <Button onClick={triggerTestError} variant="destructive" size="sm">
        Trigger Test Error
      </Button>
      <Button onClick={triggerSlowOperation} variant="outline" size="sm">
        Trigger Slow Operation
      </Button>
      <Button onClick={triggerWarning} variant="secondary" size="sm">
        Trigger Warning
      </Button>
      <p className="text-xs text-muted-foreground">Tests: {testCount}</p>
    </div>
  );
}
