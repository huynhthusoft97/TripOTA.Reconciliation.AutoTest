import { Page } from '@playwright/test';
import { env } from '../../env.js';

// Trang đăng nhập Reconciliation System (route /login).
// Selector đã xác minh trên SIT: 1 input text (username) + 1 input password + button submit "Đăng nhập".
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(user = env.user, password = env.password) {
    await this.page.locator('input[type="text"]').first().fill(user);
    await this.page.locator('input[type="password"]').first().fill(password);
    await this.page.locator('button[type="submit"]').click();
  }

  // Đăng nhập thành công → rời khỏi /login (về Home "/").
  async isLoggedIn(): Promise<boolean> {
    await this.page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: env.timeoutBrowser });
    return !this.page.url().includes('/login');
  }

  // Đăng nhập sai → vẫn ở trang /login.
  async stillOnLogin(): Promise<boolean> {
    await this.page.waitForTimeout(1500);
    return this.page.url().includes('/login');
  }
}
