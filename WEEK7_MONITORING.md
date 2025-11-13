# Week 7: Monitoring & Observability

## Objectives
- Comprehensive error and performance monitoring
- Session replay for debugging user issues
- Custom alert rules for critical events
- Business metric tracking
- Core Web Vitals monitoring

## Implementation Status

### ✅ Day 1-2: Sentry Performance Monitoring
**Status**: Complete

#### Enhanced Features
1. **Performance Tracking** (`src/lib/monitoring/sentry-config.ts`)
   - Transaction monitoring for key user flows
   - Custom performance metrics
   - API call tracking with latency alerts
   - Memory usage monitoring
   - Long task detection (>50ms blocking)
   - Core Web Vitals (LCP, FID, CLS)

2. **Alert Thresholds**
   - Feed load: >1000ms
   - API calls: >2000ms
   - Search: >3000ms
   - Checkout: >2000ms
   - Memory: >300MB
   - Error rate: >1%

3. **Custom Metrics**
   - User actions and breadcrumbs
   - Business metrics (signups, subscriptions, bookings)
   - Resource utilization
   - Database query performance

### ✅ Day 3-4: Session Replay Integration
**Status**: Complete

#### Features Implemented
1. **Session Replay** (`src/lib/monitoring/session-replay.ts`)
   - Privacy-first with text/media masking
   - Smart sampling (100% errors, 10% sessions)
   - Critical flow marking
   - User context tracking

2. **UX Issue Detection**
   - Rage click monitoring (3+ clicks in 1s)
   - Dead click detection (non-interactive elements)
   - User frustration signals
   - Breadcrumb trail for debugging

3. **Privacy Controls**
   - All text masked by default
   - Media blocked
   - Sensitive inputs hidden
   - GDPR/CCPA compliant

### ✅ Day 5-6: Alert Configuration
**Status**: Complete

#### Alert Rules (`src/lib/monitoring/alerts.ts`)
1. **Critical Alerts** (Immediate response)
   - Payment failures
   - Authentication errors
   - Database connection issues
   - API outages (>5% error rate)

2. **Warning Alerts** (1-hour response)
   - Slow performance (P95 exceeded)
   - High memory usage
   - Long tasks blocking UI
   - Poor Web Vitals

3. **Business Metrics**
   - Signup tracking
   - Subscription conversions
   - Booking completions
   - Cancellation rates

### ✅ Day 7: Documentation
**Status**: Complete

#### Created Documents
1. **Monitoring Runbook** (`docs/MONITORING_RUNBOOK.md`)
   - Sentry dashboard usage
   - Alert response procedures
   - Common debugging workflows
   - Integration with k6 load tests

2. **Implementation Guide**
   - Custom monitoring examples
   - Performance tracking patterns
   - Business metric tracking
   - Troubleshooting procedures

## Key Metrics Dashboard

### Performance Metrics
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Feed Load | <500ms | >1000ms |
| API Response | <300ms | >2000ms |
| Search Time | <2s | >3000ms |
| Checkout | <1s | >2000ms |
| Image Load | <2s | >3000ms |
| Memory Usage | <200MB | >300MB |
| Error Rate | <0.5% | >1% |

### Core Web Vitals
- **LCP**: <2.5s (Good), 2.5-4s (Needs Improvement), >4s (Poor)
- **FID**: <100ms (Good), 100-300ms (Needs Improvement), >300ms (Poor)
- **CLS**: <0.1 (Good), 0.1-0.25 (Needs Improvement), >0.25 (Poor)

### Business Metrics
- Daily signups
- Subscription conversion rate
- Booking completion rate
- Payment success rate
- Voice concierge usage
- Agent marketplace matches

## Sentry Configuration

### Integrations
- **Browser Tracing**: Track page loads and navigation
- **Session Replay**: Capture user sessions with privacy masking
- **Performance Monitoring**: 20% sampling rate in production
- **Custom Instrumentation**: Track business-critical operations

### Sampling Strategy
- **Traces**: 20% in production, 100% in development
- **Replays**: 10% of sessions, 100% of errors
- **Tier-based**: 50% for premium/enterprise users

### Privacy Settings
- Text masking: Enabled
- Media blocking: Enabled
- Input masking: Enabled
- Sensitive data filtering: Enabled

## Alert Response SLAs

### Critical Alerts
- **Response Time**: 15 minutes
- **Resolution Target**: 1 hour
- **Examples**: Payment failures, auth errors, database outages

### Warning Alerts
- **Response Time**: 1 hour
- **Resolution Target**: 24 hours
- **Examples**: Slow performance, high memory usage

### Info Alerts
- **Response Time**: Daily review
- **Resolution Target**: Weekly sprint
- **Examples**: UX issues, minor performance degradation

## Debugging Workflows

### 1. User Reported Issue
1. Search Sentry by user ID or email
2. Review session replay
3. Check error logs and breadcrumbs
4. Identify root cause
5. Create fix or workaround
6. Deploy and verify

### 2. Performance Investigation
1. Check Sentry performance dashboard
2. Identify slowest transactions
3. Review database query plans
4. Check API latency
5. Optimize code or queries
6. Validate with k6 load tests

### 3. Payment Failure
1. Check Sentry payment error logs
2. Review session replay of checkout
3. Verify Stripe webhook delivery
4. Check edge function logs
5. Confirm database state
6. Issue refund if needed

### 4. Voice Concierge Issue
1. Check voice activation errors
2. Review WebRTC connection state
3. Verify OpenAI API logs
4. Check wake word detection
5. Monitor audio processing latency
6. Watch session replay for context

## Integration with k6 Load Tests

### Load Testing with Monitoring
```bash
# Start Sentry dashboard monitoring
# Run load test
k6 run k6/tests/feed-load-test.js

# Observe in Sentry:
# - Transaction throughput
# - Error rates
# - P95/P99 latency
# - Memory usage
# - Database connections
```

### Validation Criteria
- ✅ No critical errors during load test
- ✅ P95 latency within thresholds
- ✅ Error rate <0.5%
- ✅ Memory stable (no leaks)
- ✅ Connection pools healthy

## Acceptance Criteria

### ✅ Week 7 Complete
- [x] Sentry performance monitoring integrated
- [x] Session replay with privacy controls
- [x] Custom alert rules configured
- [x] Core Web Vitals tracking
- [x] Business metric tracking
- [x] UX issue detection (rage clicks, dead clicks)
- [x] Monitoring runbook documented
- [x] Alert response procedures defined
- [x] Integration with k6 load tests

### Production Readiness Checklist
- [x] Sentry DSN configured
- [x] Release tracking enabled
- [x] Environment variables set
- [x] Alert notifications configured
- [x] Team access provisioned
- [x] Privacy settings verified
- [x] Sampling rates optimized
- [x] Dashboard bookmarks created

## Next Steps → Week 8

1. **Lighthouse Audits**: Frontend performance optimization
   - Target: >85 Performance, >95 Accessibility
   - Optimize images, code splitting, caching
   - Reduce bundle size, improve TTI

2. **Environment Verification**: Production config validation
   - Verify all env vars set correctly
   - Test edge function deployments
   - Validate database migrations
   - Confirm Stripe integration

3. **Final Deployment Checklist**: Pre-launch validation
   - Run full test suite
   - Execute load tests
   - Review Sentry dashboards
   - Verify monitoring alerts
   - Document rollback procedures

4. **Production Launch**: Go-live preparation
   - Staging → Production promotion
   - DNS configuration
   - CDN cache warming
   - Team standby for launch
   - Post-launch monitoring

## Resources

### Sentry Dashboard URLs
- Performance: `https://sentry.io/organizations/goldsainte/performance/`
- Issues: `https://sentry.io/organizations/goldsainte/issues/`
- Releases: `https://sentry.io/organizations/goldsainte/releases/`
- Alerts: `https://sentry.io/organizations/goldsainte/alerts/`

### Documentation
- [Monitoring Runbook](./docs/MONITORING_RUNBOOK.md)
- [Week 6 Load Testing](./WEEK6_LOAD_TESTING.md)
- [Week 5 Billing Hardening](./WEEK5_BILLING_HARDENING.md)
- [Production Readiness Plan](./WEEK8_PROGRESS.md)

### External Resources
- [Sentry Performance Docs](https://docs.sentry.io/product/performance/)
- [Session Replay Guide](https://docs.sentry.io/product/session-replay/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [k6 Load Testing](https://k6.io/docs/)
