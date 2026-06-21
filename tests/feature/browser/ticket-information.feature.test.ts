import { test, expect } from '@playwright/test';

import { ListPage } from '../../../lib/browser/pages/index.js';

// US-1B-UI | spec: màn "Ticket Information" (/sale-ticket) — surface hiển thị vé source 1B.
// [FEATURE] = test của sprint đang làm, CHƯA gate release. Đã đăng nhập sẵn qua storageState (project setup).
// Khi feature ổn định + release → promote sang tests/regression/browser/1b/ (xem README "Vòng đời test").
test.describe('[FEATURE] 1B — Ticket Information', { tag: ['@feature', '@1B'] }, () => {
  test('mở màn Ticket Information (surface 1B)', { tag: ['@US-1B-UI'] }, async ({ page }) => {
    const list = new ListPage(page, '/sale-ticket', 'Ticket Information');
    await list.goto();
    expect(await list.isLoaded()).toBe(true);
    // TODO(1B): lọc cột System='1B' rồi assert Ticket Flow Status / Customer Status / Ticket Source…
  });
});
