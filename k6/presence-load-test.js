import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 200,
  duration: '2m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.goldsainte.com';
const CSRF_ENDPOINT = `${BASE_URL}/api/csrf-token`;
const HEARTBEAT_ENDPOINT = `${BASE_URL}/api/presence/heartbeat`;

export default function presenceLoadTest() {
  const csrfResponse = http.get(CSRF_ENDPOINT);
  check(csrfResponse, {
    'csrf token issued': (res) => res.status === 200 && (res.json('token') || res.json('reused') === true),
  });

  const token = csrfResponse.json('token');
  const cookies = csrfResponse.cookies;

  const headers = {
    'x-csrf-token': token,
    'Content-Type': 'application/json',
  };

  const heartbeatBody = JSON.stringify({ status: 'online', metadata: { shard: 'feed', latency: Math.random() * 100 } });
  const heartbeatResponse = http.post(HEARTBEAT_ENDPOINT, heartbeatBody, { headers, cookies });

  check(heartbeatResponse, {
    'heartbeat accepted': (res) => res.status === 200,
    'next heartbeat provided': (res) => Boolean(res.json('nextRecommendedHeartbeatMs')),
  });

  sleep(Math.random() * 3);
}

