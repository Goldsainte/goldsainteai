import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SUPABASE_URL, headers, loadStages, thresholds } from '../config.js';

// Custom metrics
const feedLoadTime = new Trend('feed_load_time');
const feedErrors = new Rate('feed_errors');

export const options = {
  stages: loadStages,
  thresholds: {
    ...thresholds,
    'feed_load_time': ['p(95)<500'],
    'feed_errors': ['rate<0.005'],
  },
};

export default function () {
  // Test personalized feed endpoint
  const feedResponse = http.get(
    `${SUPABASE_URL}/functions/v1/get-personalized-feed`,
    { headers }
  );

  const feedSuccess = check(feedResponse, {
    'feed status is 200': (r) => r.status === 200,
    'feed response time < 500ms': (r) => r.timings.duration < 500,
    'feed has posts': (r) => {
      const body = JSON.parse(r.body);
      return body.posts && body.posts.length > 0;
    },
  });

  feedLoadTime.add(feedResponse.timings.duration);
  feedErrors.add(!feedSuccess);

  // Test cursor-based pagination
  const paginationResponse = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/fetch_feed_paginated`,
    JSON.stringify({
      cursor_timestamp: new Date().toISOString(),
      page_size: 20
    }),
    { headers }
  );

  check(paginationResponse, {
    'pagination status is 200': (r) => r.status === 200,
    'pagination response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(1); // Think time between requests
}

export function handleSummary(data) {
  return {
    'results/feed-load-test.json': JSON.stringify(data, null, 2),
    stdout: `
    ===== FEED LOAD TEST RESULTS =====
    Total Requests: ${data.metrics.http_reqs.values.count}
    Success Rate: ${(1 - data.metrics.http_req_failed.values.rate) * 100}%
    P95 Response Time: ${data.metrics.http_req_duration.values['p(95)']}ms
    Feed Load Time P95: ${data.metrics.feed_load_time.values['p(95)']}ms
    Feed Error Rate: ${data.metrics.feed_errors.values.rate * 100}%
    `,
  };
}
