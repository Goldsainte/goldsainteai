import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SUPABASE_URL, getAuthHeaders, loadStages, thresholds } from '../config.js';

// Custom metrics
const checkoutTime = new Trend('checkout_time');
const subscriptionCheckTime = new Trend('subscription_check_time');
const checkoutErrors = new Rate('checkout_errors');

export const options = {
  stages: loadStages,
  thresholds: {
    ...thresholds,
    'checkout_time': ['p(95)<1000'],
    'subscription_check_time': ['p(95)<300'],
    'checkout_errors': ['rate<0.005'],
  },
};

// Mock auth token (in real test, get from login flow)
const authToken = __ENV.AUTH_TOKEN || '';

export default function () {
  if (!authToken) {
    console.error('AUTH_TOKEN environment variable required for checkout tests');
    return;
  }

  const headers = getAuthHeaders(authToken);

  // Test subscription check endpoint
  const checkResponse = http.post(
    `${SUPABASE_URL}/functions/v1/check-subscription`,
    JSON.stringify({}),
    { headers }
  );

  check(checkResponse, {
    'subscription check status is 200': (r) => r.status === 200,
    'subscription check response time < 300ms': (r) => r.timings.duration < 300,
  });

  subscriptionCheckTime.add(checkResponse.timings.duration);

  sleep(1);

  // Test billing info retrieval
  const billingResponse = http.post(
    `${SUPABASE_URL}/functions/v1/get-billing-info`,
    JSON.stringify({}),
    { headers }
  );

  const billingSuccess = check(billingResponse, {
    'billing info status is 200 or 404': (r) => [200, 404].includes(r.status),
    'billing info response time < 400ms': (r) => r.timings.duration < 400,
  });

  checkoutErrors.add(!billingSuccess);

  sleep(2); // Think time
}

export function handleSummary(data) {
  return {
    'results/checkout-load-test.json': JSON.stringify(data, null, 2),
    stdout: `
    ===== CHECKOUT LOAD TEST RESULTS =====
    Total Requests: ${data.metrics.http_reqs.values.count}
    Success Rate: ${(1 - data.metrics.http_req_failed.values.rate) * 100}%
    Subscription Check P95: ${data.metrics.subscription_check_time.values['p(95)']}ms
    Checkout Error Rate: ${data.metrics.checkout_errors.values.rate * 100}%
    `,
  };
}
