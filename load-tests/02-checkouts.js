// 20 checkout-session creations. Hits the Stripe checkout edge function.
// Requires an authenticated session — the script signs in a pre-seeded
// load-test user first. Set LOADTEST_EMAIL / LOADTEST_PASSWORD before running.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://ktzsgqrqvwtxlimctkaf.supabase.co';
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZGV2eGx0anVlZGlqcmNkZWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQ4MDEsImV4cCI6MjA3NDc0MDgwMX0.syDQQrSgkyB1MEuE-OeMpxVt6wfoH17lDjMGGEzOiBc';
const EMAIL = __ENV.LOADTEST_EMAIL;
const PASSWORD = __ENV.LOADTEST_PASSWORD;
const TRIP_ID = __ENV.TRIP_ID || '00000000-0000-0000-0000-000000000000';

const errors = new Rate('checkout_errors');

export const options = {
  scenarios: {
    checkouts: {
      executor: 'shared-iterations',
      vus: 4,
      iterations: 20,
      maxDuration: '3m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2500'],
    checkout_errors: ['rate<0.10'],
  },
};

export function setup() {
  if (!EMAIL || !PASSWORD) {
    throw new Error('Set LOADTEST_EMAIL and LOADTEST_PASSWORD env vars');
  }
  const res = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
      },
    },
  );
  const body = res.json();
  if (!body.access_token) {
    throw new Error(`Sign-in failed: ${res.status} ${res.body}`);
  }
  return { token: body.access_token };
}

export default function (data) {
  const res = http.post(
    `${SUPABASE_URL}/functions/v1/create-cocurated-checkout`,
    JSON.stringify({ tripId: TRIP_ID, quantity: 1 }),
    {
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${data.token}`,
      },
      tags: { name: 'checkout-create' },
    },
  );

  const ok = check(res, {
    'status < 500': (r) => r.status < 500,
  });
  errors.add(!ok);
  sleep(1);
}
