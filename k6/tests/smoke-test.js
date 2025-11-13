import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, SUPABASE_URL, headers, smokeStages } from '../config.js';

export const options = {
  stages: smokeStages,
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Test homepage
  const homeResponse = http.get(BASE_URL);
  check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads quickly': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test feed endpoint (public)
  const feedResponse = http.get(
    `${SUPABASE_URL}/functions/v1/get-personalized-feed`,
    { headers }
  );
  check(feedResponse, {
    'feed endpoint accessible': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);

  // Test health check
  const healthResponse = http.get(`${BASE_URL}/`);
  check(healthResponse, {
    'app is healthy': (r) => r.status === 200,
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    'results/smoke-test.json': JSON.stringify(data, null, 2),
    stdout: `
    ===== SMOKE TEST RESULTS =====
    Total Requests: ${data.metrics.http_reqs.values.count}
    Success Rate: ${(1 - data.metrics.http_req_failed.values.rate) * 100}%
    P95 Response Time: ${data.metrics.http_req_duration.values['p(95)']}ms
    `,
  };
}
