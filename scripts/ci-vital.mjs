#!/usr/bin/env node
// CI Vital — cross-platform (Windows/macOS/Linux), KHÔNG phụ thuộc `bash`/shell-quoting.
// Chạy CẢ tầng vital: API (Vitest) + Browser (Playwright), rồi LUÔN build report tổng hợp.
// Lý do thay `bash -c '...'`: trên Windows npm chạy script qua cmd.exe vốn không hiểu
// nháy đơn → chuỗi truyền vào bash bị vỡ.
import { spawnSync } from 'node:child_process';

const run = (args, extraEnv = {}) =>
  spawnSync(process.execPath, args, { stdio: 'inherit', env: { ...process.env, ...extraEnv } });

// 1) API test (Vitest) — ghi reports/vitest-results.json để report gộp vào.
const vitest = run(['node_modules/vitest/vitest.mjs', 'run', 'tests/vital/api']);

// 2) Browser test (Playwright). Máy yếu dễ OOM khi nhiều chromium song song → mặc định 1 worker
//    khi chạy local; CI (biến CI) để Playwright tự quyết; override bằng PW_WORKERS.
const workers = process.env.PW_WORKERS || (process.env.CI ? '' : '1');
const testArgs = ['node_modules/@playwright/test/cli.js', 'test', '--project=vital-browser'];
if (workers) testArgs.push(`--workers=${workers}`);
const pw = run(testArgs);

// 3) Luôn build report tổng hợp (REPORT_SOFT=1 → bước report không tự fail).
run(['scripts/build-report.mjs'], { REPORT_SOFT: '1' });
void vitest;

// Giữ hành vi cũ: report luôn sinh; không fail bước CI ở đây (pipeline gate qua JUnit).
// Đổi sang `process.exit(pw.status ?? 1)` nếu muốn npm script đỏ khi test fail.
process.exit(0);
