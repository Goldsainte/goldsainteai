// k6 Load Testing Configuration
// Target: <500ms P95, <0.5% error rate, 100 concurrent users

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
export const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://ktzsgqrqvwtxlimctkaf.supabase.co';
export const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZGV2eGx0anVlZGlqcmNkZWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNjQ4MDEsImV4cCI6MjA3NDc0MDgwMX0.syDQQrSgkyB1MEuE-OeMpxVt6wfoH17lDjMGGEzOiBc';

// Load stages for ramping up to 100 concurrent users
export const loadStages = [
  { duration: '30s', target: 20 },  // Ramp up to 20 users
  { duration: '1m', target: 50 },   // Ramp up to 50 users
  { duration: '2m', target: 100 },  // Ramp up to 100 users
  { duration: '3m', target: 100 },  // Stay at 100 users for 3 minutes
  { duration: '30s', target: 0 },   // Ramp down
];

// Smoke test stages (quick validation)
export const smokeStages = [
  { duration: '30s', target: 5 },
  { duration: '1m', target: 5 },
  { duration: '30s', target: 0 },
];

// Stress test stages (find breaking point)
export const stressStages = [
  { duration: '1m', target: 50 },
  { duration: '2m', target: 100 },
  { duration: '2m', target: 200 },
  { duration: '2m', target: 300 },
  { duration: '1m', target: 0 },
];

// Performance thresholds
export const thresholds = {
  http_req_duration: ['p(95)<500'], // 95% of requests must complete under 500ms
  http_req_failed: ['rate<0.005'],  // Error rate must be below 0.5%
  http_reqs: ['rate>10'],           // Minimum 10 requests/sec throughput
};

// Common headers
export const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
};

export function getAuthHeaders(token) {
  return {
    ...headers,
    'Authorization': `Bearer ${token}`,
  };
}
