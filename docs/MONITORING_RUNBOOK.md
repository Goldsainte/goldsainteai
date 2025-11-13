# Monitoring & Observability Runbook - Week 7

## Overview

Comprehensive monitoring infrastructure for production readiness at 1M-user scale.

## Monitoring Stack

### 1. Sentry (Error & Performance Monitoring)
- **Error tracking**: All unhandled exceptions and errors
- **Performance monitoring**: Transaction traces, API latency, database queries
- **Custom metrics**: Business KPIs, user actions, system health
- **Session replay**: User sessions with privacy masking
- **Alerts**: Automated notifications for critical issues

### 2. Custom Monitoring (src/lib/monitoring/)
- **sentry-config.ts**: Performance tracking and custom metrics
- **session-replay.ts**: Session replay with privacy controls
- **alerts.ts**: Alert rules and business metric tracking

## Key Metrics & Thresholds

### Performance Metrics
| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Feed Load Time | >1000ms | Warning |
| API Response Time | >2000ms | Warning |
| Search Time | >3000ms | Warning |
| Checkout Time | >2000ms | Error |
| Image Load Time | >3000ms | Warning |
| Memory Usage | >300MB | Warning |
| Error Rate | >1% | Error |
| Database Query | >500ms | Warning |

### Business Metrics
- User signups
- Subscription conversions
- Booking completions
- Cancellation rates
- Payment failures
- Voice concierge usage

### Core Web Vitals
- **LCP** (Largest Contentful Paint): Target <2.5s
- **FID** (First Input Delay): Target <100ms
- **CLS** (Cumulative Layout Shift): Target <0.1

## Alert Configuration

### Critical Alerts (Page immediately)
1. **Payment Failures**: Any payment processing error
2. **Authentication Failures**: User login/signup issues
3. **Database Errors**: Connection failures, constraint violations
4. **API Outages**: >5% error rate on critical endpoints

### Warning Alerts (Review within 1 hour)
1. **Slow Performance**: P95 latency exceeding thresholds
2. **High Memory Usage**: >300MB heap size
3. **Long Tasks**: Main thread blocked >50ms
4. **Poor Web Vitals**: LCP >2.5s, CLS >0.1

### Info Alerts (Daily review)
1. **User Experience Issues**: Rage clicks, dead clicks
2. **Image Load Failures**: Broken images or slow loads
3. **Business Metric Changes**: Significant metric shifts

## Using Sentry Dashboard

### 1. Performance Dashboard
URL: `https://sentry.io/organizations/goldsainte/performance/`

**Key Views**:
- **Transactions**: View slowest operations and trends
- **Web Vitals**: Monitor LCP, FID, CLS across pages
- **Database**: Identify slow queries and N+1 problems
- **HTTP Requests**: API latency and error rates

**Filtering**:
```
# View feed performance
transaction:feed.load

# View checkout errors
transaction:checkout.session AND level:error

# View by subscription tier
user.subscription:premium
```

### 2. Issues Dashboard
URL: `https://sentry.io/organizations/goldsainte/issues/`

**Issue States**:
- **Unresolved**: Needs investigation
- **Resolved**: Fixed and deployed
- **Ignored**: Known, non-critical issues

**Triage Process**:
1. Check frequency and user impact
2. Review stack trace and breadcrumbs
3. Watch session replay if available
4. Assign to team member
5. Link to GitHub issue if needed

### 3. Releases Dashboard
URL: `https://sentry.io/organizations/goldsainte/releases/`

**Track**:
- New errors introduced per release
- Performance regressions
- Adoption rate of new releases
- Crash-free session rate

## Session Replay Usage

### When to Watch Replays
1. **Critical user complaints**: See exactly what happened
2. **High rage click areas**: Identify UX friction
3. **Payment failures**: Debug checkout flow issues
4. **Dead clicks**: Find confusing UI elements
5. **Performance complaints**: Observe loading states

### Privacy Controls
- All text is masked by default
- Media files are blocked
- Sensitive inputs are hidden
- Only essential UI interactions captured

### Replay Sampling
- **Error sessions**: 100% captured
- **Premium users**: 50% captured
- **Free users**: 10% captured

## Common Debugging Workflows

### Slow Page Load Investigation
1. Check Sentry performance transaction
2. Identify slowest spans (API, DB, render)
3. Review session replay for user experience
4. Check database query performance
5. Verify image optimization
6. Look for blocking JavaScript

### Payment Failure Investigation
1. Check Sentry error for stack trace
2. Review session replay of failed attempt
3. Check Stripe webhook logs
4. Verify edge function logs
5. Confirm database transaction state
6. Check customer portal access

### Feed Performance Issue
1. Review `feed.load` transaction in Sentry
2. Check database query performance
3. Verify cursor pagination is used
4. Check image lazy loading
5. Monitor memory usage during scroll
6. Review virtualization implementation

### Voice Concierge Failure
1. Check voice activation errors in Sentry
2. Review WebRTC connection state
3. Check OpenAI API logs
4. Verify wake word detection
5. Monitor audio processing latency
6. Review session replay for context

## Custom Monitoring Implementation

### Track Performance in Code
```typescript
import { trackPerformance } from '@/lib/monitoring/sentry-config';

const startTime = performance.now();
// ... expensive operation
const duration = performance.now() - startTime;

trackPerformance({
  component: 'TravelFeed',
  operation: 'fetch',
  duration,
  metadata: { postCount: 20 },
});
```

### Track API Calls
```typescript
import { trackAPICall } from '@/lib/monitoring/sentry-config';

const startTime = Date.now();
const response = await fetch(url);
const duration = Date.now() - startTime;

trackAPICall(url, duration, response.status);
```

### Mark Critical Flows
```typescript
import { markCriticalFlow } from '@/lib/monitoring/session-replay';

// Start of checkout flow
markCriticalFlow('checkout', 'started');

// ... user actions ...

markCriticalFlow('checkout', 'payment_submitted');
```

### Track Business Metrics
```typescript
import { trackBusinessMetric } from '@/lib/monitoring/alerts';

trackBusinessMetric('subscription', 1, {
  tier: 'premium',
  source: 'upgrade',
});
```

## Alert Response Procedures

### Critical Alert Response (15 minutes)
1. Acknowledge alert in Slack/PagerDuty
2. Check Sentry for error details
3. Verify system status (database, APIs)
4. Apply immediate fix or rollback
5. Post incident update
6. Document root cause

### Warning Alert Response (1 hour)
1. Review metrics and trends
2. Check recent deployments
3. Identify affected users
4. Create fix plan or optimization ticket
5. Monitor for escalation

### Performance Degradation Response
1. Check Sentry performance dashboard
2. Review database query performance
3. Check connection pool utilization
4. Verify CDN cache hit rates
5. Monitor memory usage trends
6. Scale resources if needed

## Dashboards & Reports

### Daily Health Check
- Error rate trends (should be <0.5%)
- P95 latency trends (should be <500ms)
- Session replay insights
- Business metric summary

### Weekly Performance Review
- Core Web Vitals trends
- Slowest transactions
- Most common errors
- User experience issues (rage clicks, dead clicks)

### Monthly Business Review
- Signup conversion trends
- Subscription growth
- Booking completion rates
- Cancellation reasons

## Integration with k6 Load Tests

### Running Load Tests with Monitoring
```bash
# Start monitoring in Sentry dashboard
# Run load test
k6 run k6/tests/feed-load-test.js

# Watch Sentry performance in real-time
# Check for alerts triggered during test
# Review metrics after completion
```

### Load Test Metrics in Sentry
- Transaction throughput
- Error rates under load
- P95/P99 latency distribution
- Memory usage patterns
- Database connection pool usage

## Troubleshooting Common Issues

### High Error Rate in Sentry
1. Filter by error type
2. Check deployment timing
3. Review stack traces
4. Watch session replays
5. Rollback if needed

### Performance Degradation
1. Check database query performance
2. Verify CDN cache effectiveness
3. Monitor connection pools
4. Review recent code changes
5. Check external API latency

### Missing Transactions
1. Verify Sentry DSN is configured
2. Check tracesSampleRate setting
3. Confirm integration setup
4. Review network requests for Sentry calls

### No Session Replays
1. Check replaysSessionSampleRate
2. Verify user consent if required
3. Confirm browser compatibility
4. Review privacy settings (masking)

## Next Steps (Week 8)

1. **Lighthouse Audits**: Frontend performance optimization
2. **Environment Verification**: Production config validation
3. **Final Deployment Checklist**: Pre-launch validation
4. **Runbook Updates**: Document production procedures

## Resources

- [Sentry Performance Documentation](https://docs.sentry.io/product/performance/)
- [Session Replay Guide](https://docs.sentry.io/product/session-replay/)
- [Alert Configuration](https://docs.sentry.io/product/alerts/)
- [Custom Instrumentation](https://docs.sentry.io/platforms/javascript/performance/instrumentation/)
