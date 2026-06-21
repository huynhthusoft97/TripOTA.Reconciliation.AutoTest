import { Page, expect } from '@playwright/test';
import { env } from '../../env.js';

// Khung ứng dụng sau đăng nhập (Reconciliation System): Home + menu trái + search + user.
// Menu (đã xác minh): Home · Business Management · Report · VAT Rate · Currencies Rate ·
// Virtual Account Management · System Management · Validate Transaction Information · Setting System-Provider.
export class AppShell {
  constructor(private page: Page) {}

  async isHomeLoaded(): Promise<boolean> {
    await expect(this.page.getByText('Home page')).toBeVisible({ timeout: env.timeoutBrowser });
    return true;
  }

  userName() {
    return this.page.getByText('Supper Admin');
  }

  // Click 1 mục menu theo text hiển thị (vd 'VAT Rate', 'Report').
  async openNav(label: string) {
    await this.page.getByText(label, { exact: true }).first().click();
  }

  async search(term: string) {
    await this.page.getByPlaceholder('Search ...').fill(term);
  }

  async gotoRoute(path: string) {
    await this.page.goto(path);
  }

  // Smoke 1 trang: mở route → render trong app shell, không bị đá về /login,
  // không rơi 401/403/404, có header (banner) + vùng nội dung chính (main).
  async assertPageLoaded(route: string) {
    await this.page.goto(route);
    await expect(this.page, `route ${route}: KHÔNG bị đá về /login`).not.toHaveURL(/\/login\b/i);
    await expect(this.page, `route ${route}: KHÔNG rơi vào trang lỗi (401/403/404)`).not.toHaveURL(/\/(401|403|404)\b/);
    await expect(this.page.getByRole('banner'), `route ${route}: CÓ header (banner)`).toBeVisible();
    await expect(this.page.getByRole('main'), `route ${route}: CÓ nội dung chính (main)`).toBeVisible();
  }
}
