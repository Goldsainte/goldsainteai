// Sentry Performance Monitoring Configuration
import * as Sentry from '@sentry/react';

export interface PerformanceMetrics {
  component: string;
  duration: number;
  operation: string;
  metadata?: Record<string, any>;
}

export interface CustomMetric {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
}

// Transaction names for key user flows
export const TRANSACTIONS = {
  FEED_LOAD: 'feed.load',
  FEED_SCROLL: 'feed.scroll',
  SEARCH_HOTELS: 'search.hotels',
  SEARCH_FLIGHTS: 'search.flights',
  CHECKOUT: 'checkout.session',
  SUBSCRIPTION_UPGRADE: 'subscription.upgrade',
  MESSAGE_SEND: 'messaging.send',
  VOICE_ACTIVATION: 'voice.activation',
  POST_CREATE: 'post.create',
  IMAGE_UPLOAD: 'media.upload',
} as const;

// Custom performance monitoring
export function trackPerformance(metrics: PerformanceMetrics) {
  Sentry.startSpan(
    {
      name: metrics.component,
      op: metrics.operation,
    },
    (span) => {
      if (metrics.metadata) {
        span.setAttribute('metadata', JSON.stringify(metrics.metadata));
      }

      // Set custom measurements
      span.setAttribute('duration', metrics.duration);

      // Add performance alerts
      if (metrics.duration > 1000) {
        Sentry.captureMessage(`Slow ${metrics.operation}: ${metrics.component}`, {
          level: 'warning',
          tags: {
            component: metrics.component,
            operation: metrics.operation,
          },
          extra: {
            duration: metrics.duration,
            ...metrics.metadata,
          },
        });
      }
    }
  );
}

// Track custom metrics
export function trackMetric(metric: CustomMetric) {
  Sentry.metrics.gauge(metric.name, metric.value, {
    unit: metric.unit,
  });
}

// Track user actions
export function trackUserAction(action: string, properties?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: 'user.action',
    message: action,
    level: 'info',
    data: properties,
  });
}

// Track API calls
export function trackAPICall(endpoint: string, duration: number, status: number) {
  Sentry.startSpan(
    {
      op: 'http.client',
      name: endpoint,
    },
    (span) => {
      span.setStatus({ code: status >= 400 ? 2 : 1 }); // 2 = error, 1 = ok
      span.setAttribute('duration', duration);
      span.setAttribute('http.status_code', status);
    }
  );

  // Alert on slow API calls
  if (duration > 2000) {
    Sentry.captureMessage(`Slow API call: ${endpoint}`, {
      level: 'warning',
      tags: { endpoint, status: status.toString() },
      extra: { duration },
    });
  }

  // Alert on API errors
  if (status >= 400) {
    Sentry.captureMessage(`API error: ${endpoint}`, {
      level: status >= 500 ? 'error' : 'warning',
      tags: { endpoint, status: status.toString() },
    });
  }
}

// Monitor memory usage
export function monitorMemory() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    
    trackMetric({
      name: 'memory.used',
      value: memory.usedJSHeapSize / 1048576, // Convert to MB
      unit: 'megabyte',
    });

    trackMetric({
      name: 'memory.total',
      value: memory.totalJSHeapSize / 1048576,
      unit: 'megabyte',
    });

    // Alert on high memory usage (>300MB)
    if (memory.usedJSHeapSize / 1048576 > 300) {
      Sentry.captureMessage('High memory usage detected', {
        level: 'warning',
        extra: {
          usedMB: memory.usedJSHeapSize / 1048576,
          totalMB: memory.totalJSHeapSize / 1048576,
          limitMB: memory.jsHeapSizeLimit / 1048576,
        },
      });
    }
  }
}

// Monitor long tasks (blocking main thread)
export function setupLongTaskMonitoring() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            Sentry.captureMessage('Long task detected', {
              level: 'warning',
              tags: { type: 'performance' },
              extra: {
                duration: entry.duration,
                startTime: entry.startTime,
                name: entry.name,
              },
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long task monitoring not supported');
    }
  }
}

// Core Web Vitals monitoring
export function setupWebVitalsMonitoring() {
  // LCP - Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as any;
    
    trackMetric({
      name: 'web_vitals.lcp',
      value: lastEntry.renderTime || lastEntry.loadTime,
      unit: 'millisecond',
      tags: { page: window.location.pathname },
    });

    if (lastEntry.renderTime > 2500) {
      Sentry.captureMessage('Poor LCP detected', {
        level: 'warning',
        tags: { metric: 'lcp', page: window.location.pathname },
        extra: { value: lastEntry.renderTime },
      });
    }
  });

  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // FID - First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    const entry = list.getEntries()[0] as any;
    
    trackMetric({
      name: 'web_vitals.fid',
      value: entry.processingStart - entry.startTime,
      unit: 'millisecond',
      tags: { page: window.location.pathname },
    });
  });

  fidObserver.observe({ entryTypes: ['first-input'] });

  // CLS - Cumulative Layout Shift
  let clsScore = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as any) {
      if (!entry.hadRecentInput) {
        clsScore += entry.value;
      }
    }

    trackMetric({
      name: 'web_vitals.cls',
      value: clsScore,
      unit: 'none',
      tags: { page: window.location.pathname },
    });

    if (clsScore > 0.1) {
      Sentry.captureMessage('Poor CLS detected', {
        level: 'warning',
        tags: { metric: 'cls', page: window.location.pathname },
        extra: { value: clsScore },
      });
    }
  });

  clsObserver.observe({ entryTypes: ['layout-shift'] });
}
