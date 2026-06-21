import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../lib/browser/pages/index.js';
import { env } from '../lib/env.js';

// Project "setup": đăng nhập 1 LẦN cho môi trường đang chọn (TEST_ENV) rồi lưu storageState.
// Các test browser (vital/regression) tái dùng phiên này — KHÔNG login lại mỗi test.
const STORAGE_STATE = `.auth/${env.name}.json`;

setup('authenticate (login 1 lần → lưu storageState)', async ({ page }) => {
  if (!env.user || !env.password) {
    throw new Error(
      `Thiếu TEST_USER / TEST_PASSWORD cho môi trường "${env.name}" — đặt trong .env.${env.name}.`,
    );
  }
  const login = new LoginPage(page);
  await login.goto();
  await login.login();
  expect(await login.isLoggedIn()).toBe(true);
  await page.context().storageState({ path: STORAGE_STATE });
});
