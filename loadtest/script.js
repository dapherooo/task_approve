import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 2 },   // Ramp up to 2 users
    { duration: '10s', target: 5 },  // Ramp up to 5 users
    { duration: '5s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.5'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Try to hit root endpoint
  const res = http.get(BASE_URL, {
    tags: { name: 'RootEndpoint' },
    timeout: '10s',
  });

  // Just check if we got any response
  check(res, {
    'root endpoint responds': (r) => r.status > 0,
    'root endpoint is fast': (r) => r.timings.duration < 2000,
  });

  sleep(0.5);
}
