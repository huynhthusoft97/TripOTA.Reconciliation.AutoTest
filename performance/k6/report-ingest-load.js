import http from 'k6/http';
import { check, sleep } from 'k6';

// Load test: xử lý API Sale Report Daily theo lô.
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // ramp-up
    { duration: '3m', target: 20 },   // steady
    { duration: '1m', target: 0 },    // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% < 2s
    http_req_failed: ['rate<0.01'],    // lỗi < 1%
  },
};

const BASE = __ENV.API_BASE_URL || 'https://doisoat-sit.tripota.internal';

export default function () {
  const res = http.get(`${BASE}/api/sale-report/daily?date=2026-06-18`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
