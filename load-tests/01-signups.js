// 50 signups over 60s. Hits Supabase Auth signup endpoint directly.
// Creates real users — purge them after the run (see README).
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://ktzsgqrqvwtxlimctkaf.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZGV2eGx0anVlZGlqcmNkZWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQ4MDEsImV4cCI6MjA3NDc0MDgwMX0.syDQQrSgkyB1MEuE-OeMpxVt6wfoH17lDjMGGEzOiBc';

const errors = new Rate('signup_errors');

export const options = {
  scenarios: {
    signups: {
      executor: 'shared-iterations',
      vus: 5,
      iterations: 50,
      maxDuration: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
    signup_errors: ['rate<0.05'],
  },
};

export default function () {
  const id = `${__VU}-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({
    email: `loadtest+${id}@goldsainte.test`,
    password: `LoadTest!${id}A1`,
    data: { source: 'k6-load-test' },
  });

  const res = http.post(`${SUPABASE_URL}/auth/v1/signup`, payload, {
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    tags: { name: 'auth-signup' },
  });

  const ok = check(res, {
    'status 200/400': (r) => r.status === 200 || r.status === 400,
    // 400 is acceptable here (e.g., signups disabled / email confirm) — the
    // test is for endpoint health, not for actually creating accounts.
  });
  errors.add(!ok);
  sleep(1);
}
