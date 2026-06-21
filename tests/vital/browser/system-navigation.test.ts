import { test, expect } from '@playwright/test';
import { AppShell } from '../../../lib/browser/pages/index.js';

// US-1B-UI | spec: điều hướng / khung hệ thống — smoke TOÀN HỆ THỐNG.
// Mọi nghiệp vụ insert daily report (gồm source 1B) đều nằm trong các trang dưới;
// vé 1B hiển thị ở "Ticket Information" (/sale-ticket), lọc cột System = "1B".
// (Gộp từ repo TripOTA.Reconciliation.Test — system smoke 33 trang.)

type Pg = { name: string; route: string; heading?: string; title?: string };

const PAGES: Pg[] = [
  { name: 'Home', route: '/' },
  // Business Management
  { name: 'Customer list', route: '/customer-list' },
  { name: 'Customer group', route: '/customer-group' },
  { name: 'Customers', route: '/customers' },
  { name: 'Office (PCC)', route: '/office-pcc' },
  { name: 'Employees', route: '/employees' },
  { name: 'Vendors', route: '/vendors' },
  { name: 'Sale Policy', route: '/sales-policy' },
  // Sale ticket / daily report (surface source 1B = Ticket Information)
  { name: 'Import file', route: '/import-file' },
  { name: 'Daily Booker Report', route: '/daily-booker-report' },
  { name: 'Sale Ticket (Ticket Information)', route: '/sale-ticket', heading: 'Ticket Information', title: 'Ticket Information' },
  { name: 'Sale Ticket from 1BK', route: '/sale-ticket-from-1bk', title: 'Sale Ticket from 1BK' },
  // Payment / transactions
  { name: 'Payment Request', route: '/payment-management/payment-request' },
  { name: 'Transaction History', route: '/transaction-history' },
  { name: 'Transaction History Details', route: '/transaction-history-details' },
  { name: 'Bank Transaction Details', route: '/bank-transaction-details' },
  { name: 'Ticket Transfer', route: '/ticket-transfer' },
  // Period Transaction Reconcile
  { name: 'Reconcile Ras-VN', route: '/ras-reconciliation' },
  { name: 'Reconcile QH', route: '/reconciliation-qh' },
  { name: 'Reconcile Sun', route: '/reconciliation-sun' },
  { name: 'Reconcile BSP', route: '/reconciliation-bsp' },
  // Report
  { name: 'Airline Ticket Report', route: '/airline-ticket-report' },
  // Accounting / settings
  { name: 'Attribute Management', route: '/attributes' },
  { name: 'Bank Setting', route: '/bank-setting' },
  { name: 'Sign in setting (FlightHub)', route: '/sign-in-setting' },
  { name: 'Setting Customer No', route: '/customer-no-setting' },
  { name: 'Currencies Rate', route: '/currency-rate' },
  { name: 'VAT Rate', route: '/vat-rate' },
  { name: 'Setting Exchange Currency', route: '/exchange-currency-setting' },
  { name: 'Setting Currency', route: '/currency-setting' },
  { name: 'Setting System - Provider', route: '/provider-system-setting', heading: 'Setting System - Provider', title: 'Setting System - Provider' },
  { name: 'Validate Transaction Information', route: '/ticket-info-configuration', heading: 'Validate Transaction Information', title: 'Validate Transaction Information' },
  // ⚠️ DEMO: cố tình để FAIL (title sai) cho team xem video trên report. Bỏ field `title` này sau khi demo.
  { name: 'Setting Document No', route: '/document-no-setting', title: 'DEMO FAIL — title cố tình sai' },
];

// Đã đăng nhập sẵn qua storageState (project "setup" — login 1 lần).
// Mỗi trang = 1 test (data-driven) → runner in tiến độ từng trang, trang nào lỗi hiện riêng.
test.describe('[VITAL] điều hướng toàn hệ thống', () => {
  for (const p of PAGES) {
    test(`mở trang: ${p.name} (${p.route})`, async ({ page }) => {
      const shell = new AppShell(page);
      await shell.assertPageLoaded(p.route);
      if (p.title) await expect(page).toHaveTitle(p.title);
      if (p.heading) {
        await expect(page.getByRole('heading', { name: p.heading, level: 2 })).toBeVisible();
      }
    });
  }
});
