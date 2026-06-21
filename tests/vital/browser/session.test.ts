import { test, expect } from '@playwright/test';
import { AppShell } from '../../../lib/browser/pages/index.js';

// US-1B-UI | spec: phiên đăng nhập / app shell.
// Dùng phiên đã đăng nhập sẵn (storageState từ project "setup") — không login lại.
test('[VITAL] phiên đăng nhập sẵn → mở được app shell (Home)', async ({ page }) => {
  await page.goto('/');
  await expect(page, 'KHÔNG bị đá về /login').not.toHaveURL(/\/login\b/i);
  const shell = new AppShell(page);
  await shell.isHomeLoaded();
});
