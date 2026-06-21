import { Page, expect } from '@playwright/test';

// Trang chi tiết vé — xem dữ liệu parse, trạng thái đối soát, chính sách; thao tác.
export class TicketDetailPage {
  constructor(private page: Page) {}

  async reconcileStatus(): Promise<string> {
    return (await this.page.getByTestId('reconcile-status').textContent())?.trim() ?? '';
  }

  async isPolicyApplied(): Promise<boolean> {
    return this.page.getByTestId('policy-applied').isVisible();
  }

  async confirmMatch() {
    await this.page.getByRole('button', { name: /xác nhận đối soát|confirm match/i }).click();
    await expect(this.page.getByText(/đã đối soát|reconciled|matched/i)).toBeVisible();
  }

  async markManual() {
    await this.page.getByRole('button', { name: /xử lý tay|manual/i }).click();
  }
}
