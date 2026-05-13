// 100 public storyboard views, sustained over ~60s. Pure GET load.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://goldsainteai.lovable.app';
const SLUG = __ENV.STORYBOARD_SLUG || 'sample';

const errors = new Rate('storyboard_errors');

export const options = {
  scenarios: {
    views: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: 100,
      maxDuration: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    storyboard_errors: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/s/${SLUG}`, {
    tags: { name: 'storyboard-view' },
    headers: { 'User-Agent': 'k6-loadtest/1.0' },
  });

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'has html': (r) => (r.body || '').includes('<html') || (r.body || '').includes('<!doctype'),
  });
  errors.add(!ok);
  sleep(0.5);
}
