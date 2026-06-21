import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Nạp .env.<TEST_ENV> (vd .env.sit) trước khi đọc biến — file đã .gitignore.
dotenv.config({ path: `.env.${process.env.TEST_ENV || 'sit'}`, quiet: true });
dotenv.config({ quiet: true });

const WEB_URL = process.env.WEB_URL || 'https://reconciliation-app-sit.tripota.com.vn';
const ENV = process.env.TEST_ENV || 'sit';
// Phiên đăng nhập lưu 1 lần (project "setup") rồi tái dùng — tách theo env.
const STORAGE_STATE = `.auth/${ENV}.json`;

// Demo mode: HEADED=1 mở cửa sổ trình duyệt; SLOWMO=ms làm chậm thao tác để dễ quan sát.
const HEADED = !!process.env.HEADED;
const SLOWMO = Number(process.env.SLOWMO || 0);
// Máy yếu dễ OOM khi nhiều chromium song song → mặc định 1 worker local; override PW_WORKERS.
const WORKERS = process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : (process.env.CI ? undefined : 1);

export default defineConfig({
  testDir: '.',
  timeout: Number(process.env.TIMEOUT_BROWSER ?? 30000),
  expect: { timeout: 10000 },
  outputDir: 'test-results',
  workers: WORKERS,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright', open: 'never' }],
    ['junit', { outputFile: 'reports/playwright-junit.xml' }],
    ['json', { outputFile: 'reports/playwright-results.json' }],
  ],
  use: {
    baseURL: WEB_URL,
    headless: !HEADED,
    launchOptions: { slowMo: SLOWMO },
    screenshot: 'only-on-failure',   // ảnh khi fail
    video: 'retain-on-failure',      // video khi fail
    trace: 'retain-on-failure',      // trace để debug
  },
  projects: [
    // Đăng nhập 1 LẦN → lưu storageState; các project sau tái dùng (không login lại mỗi test).
    { name: 'setup', testMatch: 'fixtures/auth.setup.ts' },
    {
      name: 'vital-browser',
      testMatch: 'tests/vital/browser/**/*.test.ts',
      dependencies: ['setup'],
      use: { storageState: STORAGE_STATE },
    },
    {
      // Feature của sprint đang làm — CHƯA gate release. Promote sang regression khi ổn định.
      name: 'feature-browser',
      testMatch: 'tests/feature/browser/**/*.test.ts',
      dependencies: ['setup'],
      use: { storageState: STORAGE_STATE },
    },
    {
      name: 'regression-browser',
      testMatch: 'tests/regression/browser/**/*.test.ts',
      dependencies: ['setup'],
      use: { storageState: STORAGE_STATE },
    },
  ],
});
