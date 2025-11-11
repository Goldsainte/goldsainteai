/**
 * Error tracking and monitoring utilities
 * In production, integrate with services like Sentry
 */

interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private enabled: boolean = true;

  /**
   * Track an error
   */
  trackError(error: Error, context?: ErrorContext): void {
    if (!this.enabled) return;

    // Log to console in development
    console.error("[Error Tracked]", {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { contexts: context });
  }

  /**
   * Track a warning
   */
  trackWarning(message: string, context?: ErrorContext): void {
    if (!this.enabled) return;

    console.warn("[Warning]", {
      message,
      context,
      timestamp: new Date().toISOString(),
    });

    // In production, send to monitoring service
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    console.log("[Event]", {
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    });

    // In production, send to analytics service
  }

  /**
   * Track performance metric
   */
  trackPerformance(metricName: string, value: number, unit: string = "ms"): void {
    if (!this.enabled) return;

    console.log("[Performance]", {
      metric: metricName,
      value,
      unit,
      timestamp: new Date().toISOString(),
    });

    // In production, send to performance monitoring service
  }

  /**
   * Measure function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.trackPerformance(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.trackPerformance(name, duration);
      this.trackError(error as Error, { ...context, action: name });
      throw error;
    }
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, email?: string): void {
    if (!this.enabled) return;

    console.log("[User Context]", { userId, email });

    // In production, set user context in error tracking service
    // Example: Sentry.setUser({ id: userId, email });
  }

  /**
   * Clear user context
   */
  clearUserContext(): void {
    if (!this.enabled) return;

    // In production, clear user context
    // Example: Sentry.setUser(null);
  }

  /**
   * Enable error tracking
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable error tracking (for testing)
   */
  disable(): void {
    this.enabled = false;
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Export types
export type { ErrorContext };
