import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/react";
import { trackPerformance } from "@/lib/monitoring/sentry-config";
import { markCriticalFlow, captureErrorWithReplay } from "@/lib/monitoring/session-replay";
import { useState } from "react";

export function SentryTestButton() {
  const [testCount, setTestCount] = useState(0);

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

  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('[Sentry] VITE_SENTRY_DSN is empty at runtime');
    return (
      <div className="fixed bottom-4 right-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Sentry DSN not configured. Add VITE_SENTRY_DSN to enable monitoring.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 p-4 bg-white border border-border rounded-lg shadow-lg">
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
