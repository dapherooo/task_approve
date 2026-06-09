import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp up to 5 users
    { duration: '20s', target: 10 },  // Ramp up to 10 users
    { duration: '10s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Basic health check
  const res = http.get(`${BASE_URL}/health`, {
    tags: { name: 'HealthCheck' },
  });

  check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check is fast': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
