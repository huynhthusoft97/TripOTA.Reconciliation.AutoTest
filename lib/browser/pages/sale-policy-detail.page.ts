import { Page, expect } from '@playwright/test';
import { env } from '../../env.js';

// Page Object màn CHI TIẾT (Update) Sale Policy.
// Route: /sales-policy/update/<id> · tiêu đề "Update Sale Policy".
// Selector ổn định: ô text theo id thật (#salePolicyCode/#salePolicyName/#description/
// #effectiveFrom/#effectiveTo); antd select đọc theo NHÃN form-item (Provider/Type/...).
export class SalePolicyDetailPage {
  constructor(private page: Page) {}

  // Detail đã mở: URL là .../update/<id> và tiêu đề "Update Sale Policy" hiển thị.
  async isLoaded(): Promise<boolean> {
    await this.page.waitForURL(/\/sales-policy\/update\//, { timeout: env.timeoutBrowser });
    await expect(this.page.getByRole('heading', { name: 'Update Sale Policy' }))
      .toBeVisible({ timeout: env.timeoutBrowser });
    return true;
  }

  // Ô text theo id (vd 'salePolicyCode', 'salePolicyName', 'description', 'effectiveFrom').
  inputValue(id: string) {
    return this.page.locator(`#${id}`);
  }

  // Giá trị antd select theo nhãn form-item (Provider/Type/Sub Type/Policy Type/Status).
  selectValue(label: string) {
    return this.page
      .locator('.ant-form-item')
      .filter({ has: this.page.locator('.ant-form-item-label').getByText(label, { exact: true }) })
      .locator('.ant-select-selection-item')
      .first();
  }

  // Nhãn trường (form-item label) có hiển thị.
  hasLabel(label: string) {
    return this.page.locator('.ant-form-item-label').getByText(label, { exact: true }).first();
  }
}
