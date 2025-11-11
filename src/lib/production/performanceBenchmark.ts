/**
 * Performance benchmarking and Core Web Vitals tracking
 */

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export interface PerformanceScore {
  score: number;
  rating: "good" | "needs-improvement" | "poor";
}

/**
 * Get Core Web Vitals thresholds
 */
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 },
};

/**
 * Calculate performance score
 */
function calculateScore(value: number, thresholds: { good: number; poor: number }): PerformanceScore {
  if (value <= thresholds.good) {
    return { score: 100, rating: "good" };
  }
  if (value <= thresholds.poor) {
    const range = thresholds.poor - thresholds.good;
    const position = value - thresholds.good;
    const score = 100 - Math.round((position / range) * 50);
    return { score, rating: "needs-improvement" };
  }
  return { score: 0, rating: "poor" };
}

/**
 * Get LCP (Largest Contentful Paint)
 */
export function measureLCP(): Promise<number | null> {
  return new Promise((resolve) => {
    if (!("PerformanceObserver" in window)) {
      resolve(null);
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        const value = lastEntry.renderTime || lastEntry.loadTime || 0;
        observer.disconnect();
        resolve(value);
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 10000);
    } catch (error) {
      console.error("LCP measurement error:", error);
      resolve(null);
    }
  });
}

/**
 * Get FID (First Input Delay)
 */
export function measureFID(): Promise<number | null> {
  return new Promise((resolve) => {
    if (!("PerformanceObserver" in window)) {
      resolve(null);
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as PerformanceEntry & { processingStart?: number; startTime?: number };
        const value = firstEntry.processingStart ? firstEntry.processingStart - firstEntry.startTime : 0;
        observer.disconnect();
        resolve(value);
      });

      observer.observe({ entryTypes: ["first-input"] });

      // Timeout after 30 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 30000);
    } catch (error) {
      console.error("FID measurement error:", error);
      resolve(null);
    }
  });
}

/**
 * Get CLS (Cumulative Layout Shift)
 */
export function measureCLS(): Promise<number | null> {
  return new Promise((resolve) => {
    if (!("PerformanceObserver" in window)) {
      resolve(null);
      return;
    }

    let clsValue = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value || 0;
          }
        }
      });

      observer.observe({ entryTypes: ["layout-shift"] });

      // Resolve after 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 5000);
    } catch (error) {
      console.error("CLS measurement error:", error);
      resolve(null);
    }
  });
}

/**
 * Get FCP (First Contentful Paint)
 */
export function measureFCP(): number | null {
  if (!("performance" in window) || !performance.getEntriesByType) {
    return null;
  }

  const paintEntries = performance.getEntriesByType("paint");
  const fcpEntry = paintEntries.find((entry) => entry.name === "first-contentful-paint");
  return fcpEntry?.startTime ?? null;
}

/**
 * Get TTFB (Time to First Byte)
 */
export function measureTTFB(): number | null {
  if (!("performance" in window) || !performance.getEntriesByType) {
    return null;
  }

  const navigationEntries = performance.getEntriesByType("navigation");
  if (navigationEntries.length === 0) return null;

  const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
  return navEntry.responseStart - navEntry.requestStart;
}

/**
 * Collect all Core Web Vitals
 */
export async function collectWebVitals(): Promise<WebVitalsMetrics> {
  const [lcp, fid, cls] = await Promise.all([
    measureLCP(),
    measureFID(),
    measureCLS(),
  ]);

  const fcp = measureFCP();
  const ttfb = measureTTFB();

  return {
    lcp: lcp ?? undefined,
    fid: fid ?? undefined,
    cls: cls ?? undefined,
    fcp: fcp ?? undefined,
    ttfb: ttfb ?? undefined,
  };
}

/**
 * Generate performance report
 */
export async function generatePerformanceReport(): Promise<{
  metrics: WebVitalsMetrics;
  scores: Record<string, PerformanceScore>;
  overallScore: number;
  recommendations: string[];
}> {
  const metrics = await collectWebVitals();
  const scores: Record<string, PerformanceScore> = {};
  const recommendations: string[] = [];

  // Calculate scores
  if (metrics.lcp) {
    scores.lcp = calculateScore(metrics.lcp, THRESHOLDS.lcp);
    if (scores.lcp.rating !== "good") {
      recommendations.push("Optimize LCP: Reduce server response time, optimize images, preload critical resources");
    }
  }

  if (metrics.fid) {
    scores.fid = calculateScore(metrics.fid, THRESHOLDS.fid);
    if (scores.fid.rating !== "good") {
      recommendations.push("Optimize FID: Break up long tasks, minimize JavaScript execution time");
    }
  }

  if (metrics.cls !== undefined) {
    scores.cls = calculateScore(metrics.cls * 1000, { good: 100, poor: 250 }); // Convert to comparable scale
    if (scores.cls.rating !== "good") {
      recommendations.push("Optimize CLS: Set image/video dimensions, avoid inserting content above existing content");
    }
  }

  if (metrics.fcp) {
    scores.fcp = calculateScore(metrics.fcp, THRESHOLDS.fcp);
    if (scores.fcp.rating !== "good") {
      recommendations.push("Optimize FCP: Eliminate render-blocking resources, minimize CSS, use font-display: swap");
    }
  }

  if (metrics.ttfb) {
    scores.ttfb = calculateScore(metrics.ttfb, THRESHOLDS.ttfb);
    if (scores.ttfb.rating !== "good") {
      recommendations.push("Optimize TTFB: Use CDN, enable caching, optimize database queries");
    }
  }

  // Calculate overall score
  const scoreValues = Object.values(scores).map((s) => s.score);
  const overallScore = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    : 0;

  return {
    metrics,
    scores,
    overallScore,
    recommendations,
  };
}

/**
 * Track performance metrics to backend
 */
export async function trackPerformanceMetrics(metrics: WebVitalsMetrics): Promise<void> {
  try {
    // Send to analytics endpoint
    await fetch("/api/analytics/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...metrics,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    console.error("Failed to track performance metrics:", error);
  }
}
