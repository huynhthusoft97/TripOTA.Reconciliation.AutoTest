// Cấu hình môi trường theo TEST_ENV (auto-detect URL theo môi trường).
// Tự nạp .env.<TEST_ENV> (vd .env.sit) rồi tới .env — file này đã .gitignore (chứa secrets).
import dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.TEST_ENV || 'sit'}`, quiet: true });
dotenv.config({ quiet: true });

export type TestEnv = 'local' | 'dev' | 'sit';

// webUrl = host APP (UI); apiBaseUrl = host API BE (khác host app).
const DEFAULTS: Record<TestEnv, { apiBaseUrl: string; webUrl: string }> = {
  local: {
    apiBaseUrl: 'http://localhost:8080',
    webUrl: 'http://localhost:3000',
  },
  dev: {
    apiBaseUrl: 'https://reconciliation-api-dev.tripota.com.vn',
    webUrl: 'https://reconciliation-app-dev.tripota.com.vn',
  },
  sit: {
    apiBaseUrl: 'https://reconciliation-api-sit.tripota.com.vn',
    webUrl: 'https://reconciliation-app-sit.tripota.com.vn',
  },
};

const ENV = (process.env.TEST_ENV as TestEnv) ?? 'sit';

export const env = {
  name: ENV,
  apiBaseUrl: process.env.API_BASE_URL || DEFAULTS[ENV].apiBaseUrl,
  webUrl: process.env.WEB_URL || DEFAULTS[ENV].webUrl,
  dbUrl: process.env.DB_URL || '',
  authToken: process.env.AUTH_TOKEN || '',
  user: process.env.TEST_USER || '',          // đặt trong .env.sit
  password: process.env.TEST_PASSWORD || '',   // đặt trong .env.sit (không commit)
  timeoutApi: Number(process.env.TIMEOUT_API ?? 5000),
  timeoutBrowser: Number(process.env.TIMEOUT_BROWSER ?? 30000),
};
