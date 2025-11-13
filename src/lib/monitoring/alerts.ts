// Alert Configuration and Rules
import * as Sentry from '@sentry/react';

export interface AlertRule {
  name: string;
  condition: () => boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata?: Record<string, any>;
}

// Performance alert thresholds
export const PERFORMANCE_THRESHOLDS = {
  FEED_LOAD_MS: 1000,
  API_CALL_MS: 2000,
  IMAGE_LOAD_MS: 3000,
  SEARCH_MS: 3000,
  CHECKOUT_MS: 2000,
  MEMORY_MB: 300,
  ERROR_RATE_PERCENT: 1,
  SLOW_QUERY_MS: 500,
} as const;

// Alert on slow page loads
export function checkPageLoadPerformance(duration: number, page: string) {
  if (duration > 3000) {
    Sentry.captureMessage('Slow page load', {
      level: 'warning',
      tags: { type: 'performance', page },
      extra: { duration, threshold: 3000 },
    });
  }
}

// Alert on API failures
export function checkAPIHealth(endpoint: string, errorRate: number) {
  if (errorRate > PERFORMANCE_THRESHOLDS.ERROR_RATE_PERCENT) {
    Sentry.captureMessage('High API error rate', {
      level: 'error',
      tags: { type: 'api_health', endpoint },
      extra: { errorRate, threshold: PERFORMANCE_THRESHOLDS.ERROR_RATE_PERCENT },
    });
  }
}

// Alert on database query performance
export function checkDatabasePerformance(query: string, duration: number) {
  if (duration > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
    Sentry.captureMessage('Slow database query', {
      level: 'warning',
      tags: { type: 'database', query_type: query.split(' ')[0] },
      extra: { duration, query: query.substring(0, 100) },
    });
  }
}

// Alert on failed user actions
export function checkUserActionFailure(action: string, error: Error) {
  Sentry.captureException(error, {
    level: 'error',
    tags: { type: 'user_action', action },
    contexts: {
      action: {
        name: action,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

// Alert on payment failures
export function checkPaymentFailure(
  type: 'checkout' | 'subscription' | 'refund',
  error: string,
  metadata?: Record<string, any>
) {
  Sentry.captureMessage('Payment failure detected', {
    level: 'error',
    tags: { type: 'payment', payment_type: type },
    extra: { error, ...metadata },
    fingerprint: ['payment-failure', type],
  });
}

// Alert on authentication issues
export function checkAuthenticationFailure(reason: string, userId?: string) {
  Sentry.captureMessage('Authentication failure', {
    level: 'error',
    tags: { type: 'auth', reason },
    user: userId ? { id: userId } : undefined,
  });
}

// Alert on high memory usage
export function checkMemoryUsage(usedMB: number) {
  if (usedMB > PERFORMANCE_THRESHOLDS.MEMORY_MB) {
    Sentry.captureMessage('High memory usage', {
      level: 'warning',
      tags: { type: 'resource' },
      extra: { usedMB, threshold: PERFORMANCE_THRESHOLDS.MEMORY_MB },
    });
  }
}

// Alert on image loading failures
export function checkImageLoadFailure(src: string, error: string) {
  Sentry.captureMessage('Image load failure', {
    level: 'warning',
    tags: { type: 'media' },
    extra: { src, error },
  });
}

// Alert on voice concierge failures
export function checkVoiceFailure(stage: string, error: Error) {
  Sentry.captureException(error, {
    level: 'error',
    tags: { type: 'voice_concierge', stage },
    contexts: {
      voice: {
        stage,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

// Create custom alert rules
export function evaluateAlertRules(rules: AlertRule[]) {
  rules.forEach(rule => {
    if (rule.condition()) {
      const level = rule.severity === 'critical' ? 'error' : rule.severity;
      Sentry.captureMessage(rule.message, {
        level,
        tags: { type: 'custom_alert', rule: rule.name },
        extra: rule.metadata,
      });
    }
  });
}

// Monitor critical business metrics
export function trackBusinessMetric(
  metric: 'signup' | 'subscription' | 'booking' | 'cancellation',
  value: number,
  metadata?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'business.metric',
    message: `${metric}: ${value}`,
    level: 'info',
    data: metadata,
  });

  // Alert on anomalies (e.g., sudden drop in signups)
  // This would need historical data for comparison
  Sentry.metrics.gauge(`business.${metric}`, value);
}
