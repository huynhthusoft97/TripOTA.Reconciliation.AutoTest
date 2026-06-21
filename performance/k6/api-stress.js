import http from "k6/http";
import { check } from "k6";

// Stress test: API report ingest khi spike.
export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 150 },
    { duration: "30s", target: 0 },
  ],
  thresholds: { http_req_failed: ["rate<0.05"] },
};

const BASE = __ENV.API_BASE_URL;

export default function () {
  const res = http.get(`${BASE}/api/sale-report/daily?date=2026-06-18`);
  check(res, { "not 5xx": (r) => r.status < 500 });
}
