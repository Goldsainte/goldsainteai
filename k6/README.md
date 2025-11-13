# K6 Load Testing Suite - Week 6

Performance baseline testing for critical endpoints targeting <500ms P95 response times.

## Installation

```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Linux)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Install k6 (Windows)
choco install k6
```

## Test Structure

```
k6/
├── config.js                    # Shared configuration
├── tests/
│   ├── smoke-test.js           # Quick validation (5 users)
│   ├── feed-load-test.js       # Feed endpoint (100 users)
│   ├── search-load-test.js     # Search endpoints (100 users)
│   ├── checkout-load-test.js   # Checkout/billing (100 users)
│   └── messaging-load-test.js  # Messaging system (100 users)
└── results/                     # Test results (auto-generated)
```

## Running Tests

### 1. Smoke Test (Quick Validation)
```bash
k6 run k6/tests/smoke-test.js
```

### 2. Feed Load Test
```bash
k6 run k6/tests/feed-load-test.js
```

### 3. Search Load Test
```bash
k6 run k6/tests/search-load-test.js
```

### 4. Checkout Load Test (requires auth)
```bash
# Get auth token from browser DevTools after login
# Look for Authorization header in Network tab
AUTH_TOKEN="your_jwt_token_here" k6 run k6/tests/checkout-load-test.js
```

### 5. Messaging Load Test (requires auth)
```bash
AUTH_TOKEN="your_jwt_token_here" k6 run k6/tests/messaging-load-test.js
```

### 6. Run All Tests
```bash
# Create a results directory
mkdir -p k6/results

# Run all tests sequentially
k6 run k6/tests/smoke-test.js
k6 run k6/tests/feed-load-test.js
k6 run k6/tests/search-load-test.js
AUTH_TOKEN="..." k6 run k6/tests/checkout-load-test.js
AUTH_TOKEN="..." k6 run k6/tests/messaging-load-test.js
```

## Performance Targets

| Endpoint | P95 Latency | Error Rate | Throughput |
|----------|-------------|------------|------------|
| Feed | <500ms | <0.5% | >10 req/s |
| Search (Hotels) | <2000ms | <1% | >5 req/s |
| Search (Flights) | <2000ms | <1% | >5 req/s |
| Checkout | <1000ms | <0.5% | >10 req/s |
| Messaging | <400ms | <0.5% | >15 req/s |

## Interpreting Results

### Success Criteria
✅ **PASS**: All thresholds met
- P95 response time within targets
- Error rate below thresholds
- Throughput meets minimum requirements

❌ **FAIL**: Any threshold exceeded
- Investigate slow endpoints
- Check database query performance
- Review edge function logs
- Monitor connection pools

### Key Metrics
- **http_req_duration**: Total request duration including network
- **http_req_blocked**: Time spent blocked before connection
- **http_req_connecting**: Time spent establishing TCP connection
- **http_req_sending**: Time spent sending request
- **http_req_waiting**: Time spent waiting for response (backend latency)
- **http_req_receiving**: Time spent receiving response

## Monitoring During Tests

### Database Connections
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 second';
```

### Memory Usage
Monitor via Supabase Dashboard:
- Database CPU/Memory
- Connection pool utilization
- Cache hit rates

## Troubleshooting

### High Latency
1. Check database indexes (Week 1)
2. Verify cursor pagination is used (Week 2)
3. Check for N+1 queries
4. Review edge function cold starts

### High Error Rates
1. Check Sentry logs (Week 1)
2. Verify rate limiting thresholds
3. Check external API quotas (Amadeus)
4. Review webhook signature failures

### Connection Errors
1. Verify DATABASE_URL connection pooling
2. Check max_connections in Supabase settings
3. Monitor connection pool exhaustion
4. Review idle connection timeouts

## Next Steps (Week 7-8)

1. **CDN Caching**: Implement Cache-Control headers (Week 6)
2. **E2E Tests**: Playwright tests for critical flows (Week 6)
3. **Sentry Dashboards**: Configure alerts on P95 latency (Week 7)
4. **LogRocket**: Session replay for error tracking (Week 7)
5. **Final Validation**: Full production deployment checklist (Week 8)

## CI/CD Integration

Add to GitHub Actions workflow:
```yaml
- name: Run k6 smoke tests
  run: |
    k6 run k6/tests/smoke-test.js
    
- name: Run k6 load tests
  run: |
    k6 run k6/tests/feed-load-test.js
    k6 run k6/tests/search-load-test.js
```
