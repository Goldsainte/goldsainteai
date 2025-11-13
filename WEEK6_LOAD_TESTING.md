# Week 6: Load Testing & Performance Validation

## Objectives
- Establish performance baselines for critical endpoints
- Validate <500ms P95 response time targets
- Identify bottlenecks and optimize before production
- Document performance characteristics at 100 concurrent users

## Deliverables

### ✅ Day 1-3: K6 Load Testing Scripts
**Status**: Complete

#### Created Files
1. `k6/config.js` - Shared configuration and thresholds
2. `k6/tests/smoke-test.js` - Quick validation (5 users)
3. `k6/tests/feed-load-test.js` - Feed performance (100 users)
4. `k6/tests/search-load-test.js` - Search APIs (100 users)
5. `k6/tests/checkout-load-test.js` - Billing/checkout (100 users)
6. `k6/tests/messaging-load-test.js` - Messaging system (100 users)

#### Performance Targets
| Endpoint | P95 Target | Error Rate | Throughput |
|----------|------------|------------|------------|
| Feed | <500ms | <0.5% | >10 req/s |
| Hotel Search | <2s | <1% | >5 req/s |
| Flight Search | <2s | <1% | >5 req/s |
| Checkout | <1s | <0.5% | >10 req/s |
| Messaging | <400ms | <0.5% | >15 req/s |

#### Test Stages
**Load Test Profile** (100 concurrent users):
1. Ramp-up: 30s to 20 users
2. Ramp-up: 1m to 50 users
3. Ramp-up: 2m to 100 users
4. Sustained: 3m at 100 users
5. Ramp-down: 30s to 0 users

**Total Duration**: ~7 minutes per test

### 📋 Day 4-5: CDN Caching Implementation
**Status**: Pending

#### Tasks
- [ ] Add Cache-Control headers to API responses
  - Feed: `public, max-age=60, s-maxage=120`
  - Search: `public, max-age=300, s-maxage=600`
  - Static: `public, max-age=86400, immutable`
- [ ] Configure Cloudflare/Vercel caching rules
- [ ] Implement cache invalidation on mutations
- [ ] Monitor CDN hit rates (target >80%)

#### Expected Improvements
- 60-80% reduction in backend load
- <100ms P95 for cached responses
- Improved global latency distribution

### 📋 Day 6-7: E2E Integration Tests
**Status**: Pending

#### Critical User Flows (10 tests)
1. **Feed Flow**: Load → Scroll → Infinite load
2. **Search Flow**: Input → Search → Results → Details
3. **Auth Flow**: Login → Feed → Logout
4. **Posting Flow**: Create post → Upload image → Publish
5. **Subscription Flow**: View plans → Checkout → Success
6. **Messaging Flow**: Open inbox → Send message → Receive
7. **Voice Concierge**: Wake word → Query → Results
8. **Agent Marketplace**: Submit request → Match → Contact
9. **Package Booking**: Browse → Select → Payment
10. **Group Payment**: Create split → Share → Complete

#### Tools
- Playwright for browser automation
- Percy for visual regression testing
- CI integration with GitHub Actions

### 📋 Acceptance Criteria
- [ ] All k6 tests pass thresholds
- [ ] P95 latency <500ms for core endpoints
- [ ] Error rates <0.5% under 100 concurrent users
- [ ] Database connections stable (<50% pool usage)
- [ ] Memory usage stable (<200MB growth over 10min)
- [ ] CDN hit rate >80% (after Day 5)
- [ ] All E2E tests green in CI (after Day 7)
- [ ] Performance baseline documented

## Test Execution Plan

### Phase 1: Smoke Tests (Day 1)
```bash
k6 run k6/tests/smoke-test.js
```
**Goal**: Verify basic functionality with minimal load

### Phase 2: Component Load Tests (Day 2)
```bash
# Run each test individually
k6 run k6/tests/feed-load-test.js
k6 run k6/tests/search-load-test.js
AUTH_TOKEN="..." k6 run k6/tests/checkout-load-test.js
AUTH_TOKEN="..." k6 run k6/tests/messaging-load-test.js
```
**Goal**: Identify per-endpoint performance characteristics

### Phase 3: Combined Load Test (Day 3)
```bash
# Run all tests in parallel (requires orchestration)
# Or run sequentially with short breaks
```
**Goal**: Validate system behavior under realistic mixed load

### Phase 4: Stress Testing (Day 3)
Increase load to 200+ users to find breaking points

## Monitoring Checklist

During load tests, monitor:
- [ ] Supabase Database CPU/Memory
- [ ] Connection pool utilization
- [ ] Edge function execution times
- [ ] Sentry error rates
- [ ] Network latency distribution
- [ ] Cache hit rates

## Performance Optimization Checklist

If thresholds fail:
- [ ] Review database query plans
- [ ] Add missing indexes (use EXPLAIN ANALYZE)
- [ ] Optimize N+1 queries
- [ ] Increase connection pool size
- [ ] Review edge function cold start times
- [ ] Check external API rate limits
- [ ] Implement request coalescing
- [ ] Add caching layer (Redis)

## Results Documentation

After each test, document:
1. P50, P90, P95, P99 latencies
2. Error rate breakdown
3. Throughput (req/s)
4. Resource utilization (CPU, memory, connections)
5. Bottlenecks identified
6. Optimizations applied

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| External API rate limits | High latency/errors | Mock responses in tests |
| Database connection exhaustion | Complete failure | Monitor pool, add limits |
| Cold start latency | Poor P95 | Keep functions warm, optimize bundles |
| Memory leaks | Degradation over time | Monitor heap, fix leaks |

## Success Criteria

✅ **Week 6 Complete** when:
1. All k6 tests created and documented
2. Smoke tests pass consistently
3. Load tests complete with <500ms P95
4. Bottlenecks identified and documented
5. CDN caching implemented (if needed)
6. E2E tests written for 10 critical flows
7. Performance baseline established and documented

## Next Steps → Week 7

1. **Sentry Dashboards**: Configure performance alerts
2. **LogRocket Integration**: Session replay for debugging
3. **Lighthouse Audits**: Frontend performance tuning
4. **Final Polish**: Environment verification, deployment checklist
