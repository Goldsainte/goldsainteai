import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SUPABASE_URL, headers, loadStages, thresholds } from '../config.js';

// Custom metrics
const hotelSearchTime = new Trend('hotel_search_time');
const flightSearchTime = new Trend('flight_search_time');
const searchErrors = new Rate('search_errors');

export const options = {
  stages: loadStages,
  thresholds: {
    ...thresholds,
    'hotel_search_time': ['p(95)<2000'], // Hotel search may take longer
    'flight_search_time': ['p(95)<2000'],
    'search_errors': ['rate<0.01'], // 1% error tolerance for external APIs
  },
};

const testDestinations = ['NYC', 'LAX', 'MIA', 'ORD', 'DFW'];
const testDates = [
  { checkIn: '2025-06-01', checkOut: '2025-06-05' },
  { checkIn: '2025-07-15', checkOut: '2025-07-20' },
  { checkIn: '2025-08-10', checkOut: '2025-08-15' },
];

export default function () {
  const destination = testDestinations[Math.floor(Math.random() * testDestinations.length)];
  const dates = testDates[Math.floor(Math.random() * testDates.length)];

  // Test hotel search via Amadeus proxy
  const hotelResponse = http.post(
    `${SUPABASE_URL}/functions/v1/amadeus-proxy`,
    JSON.stringify({
      type: 'hotels',
      city: destination,
      check_in: dates.checkIn,
      check_out: dates.checkOut,
      guests: 2
    }),
    { headers }
  );

  const hotelSuccess = check(hotelResponse, {
    'hotel search status is 200': (r) => r.status === 200,
    'hotel search response time < 2s': (r) => r.timings.duration < 2000,
    'hotel search has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.cards && body.cards.length > 0;
      } catch {
        return false;
      }
    },
  });

  hotelSearchTime.add(hotelResponse.timings.duration);
  searchErrors.add(!hotelSuccess);

  sleep(2);

  // Test flight search via Amadeus proxy
  const flightResponse = http.post(
    `${SUPABASE_URL}/functions/v1/amadeus-proxy`,
    JSON.stringify({
      type: 'flights',
      origin: 'LAX',
      destination: destination,
      depart_date: dates.checkIn,
      return_date: dates.checkOut,
      adults: 2
    }),
    { headers }
  );

  const flightSuccess = check(flightResponse, {
    'flight search status is 200': (r) => r.status === 200,
    'flight search response time < 2s': (r) => r.timings.duration < 2000,
  });

  flightSearchTime.add(flightResponse.timings.duration);
  searchErrors.add(!flightSuccess);

  sleep(2); // Think time
}

export function handleSummary(data) {
  return {
    'results/search-load-test.json': JSON.stringify(data, null, 2),
    stdout: `
    ===== SEARCH LOAD TEST RESULTS =====
    Total Requests: ${data.metrics.http_reqs.values.count}
    Success Rate: ${(1 - data.metrics.http_req_failed.values.rate) * 100}%
    Hotel Search P95: ${data.metrics.hotel_search_time.values['p(95)']}ms
    Flight Search P95: ${data.metrics.flight_search_time.values['p(95)']}ms
    Search Error Rate: ${data.metrics.search_errors.values.rate * 100}%
    `,
  };
}
