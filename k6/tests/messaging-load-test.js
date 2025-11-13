import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SUPABASE_URL, getAuthHeaders, loadStages, thresholds } from '../config.js';

// Custom metrics
const messageLoadTime = new Trend('message_load_time');
const notificationTime = new Trend('notification_time');
const messagingErrors = new Rate('messaging_errors');

export const options = {
  stages: loadStages,
  thresholds: {
    ...thresholds,
    'message_load_time': ['p(95)<400'],
    'notification_time': ['p(95)<300'],
    'messaging_errors': ['rate<0.005'],
  },
};

const authToken = __ENV.AUTH_TOKEN || '';

export default function () {
  if (!authToken) {
    console.error('AUTH_TOKEN environment variable required for messaging tests');
    return;
  }

  const headers = getAuthHeaders(authToken);

  // Test fetching conversations
  const conversationsResponse = http.get(
    `${SUPABASE_URL}/rest/v1/conversations?select=*&order=updated_at.desc&limit=20`,
    { headers }
  );

  const conversationsSuccess = check(conversationsResponse, {
    'conversations status is 200': (r) => r.status === 200,
    'conversations response time < 400ms': (r) => r.timings.duration < 400,
  });

  messageLoadTime.add(conversationsResponse.timings.duration);
  messagingErrors.add(!conversationsSuccess);

  sleep(1);

  // Test fetching notifications
  const notificationsResponse = http.post(
    `${SUPABASE_URL}/functions/v1/get-notifications`,
    JSON.stringify({ limit: 20 }),
    { headers }
  );

  const notificationsSuccess = check(notificationsResponse, {
    'notifications status is 200': (r) => r.status === 200,
    'notifications response time < 300ms': (r) => r.timings.duration < 300,
  });

  notificationTime.add(notificationsResponse.timings.duration);
  messagingErrors.add(!notificationsSuccess);

  sleep(2); // Think time
}

export function handleSummary(data) {
  return {
    'results/messaging-load-test.json': JSON.stringify(data, null, 2),
    stdout: `
    ===== MESSAGING LOAD TEST RESULTS =====
    Total Requests: ${data.metrics.http_reqs.values.count}
    Success Rate: ${(1 - data.metrics.http_req_failed.values.rate) * 100}%
    Message Load Time P95: ${data.metrics.message_load_time.values['p(95)']}ms
    Notification Time P95: ${data.metrics.notification_time.values['p(95)']}ms
    Messaging Error Rate: ${data.metrics.messaging_errors.values.rate * 100}%
    `,
  };
}
