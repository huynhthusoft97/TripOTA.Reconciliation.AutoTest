import { Page, expect, Locator } from '@playwright/test';

// Trang danh sách / dashboard đối soát vé.
export class ReconciliationListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/reconciliation');
  }

  get rows(): Locator {
    return this.page.getByRole('row');
  }

  async isLoaded(): Promise<boolean> {
    await expect(this.page.getByRole('heading', { name: /đối soát|reconcil/i })).toBeVisible();
    return true;
  }

  async filterByTicket(ticketNumber: string) {
    await this.page.getByPlaceholder(/số vé|ticket/i).fill(ticketNumber);
    await this.page.getByRole('button', { name: /tìm|search|lọc|filter/i }).click();
  }

  async filterBySource(source = '1B') {
    await this.page.getByLabel(/source|nguồn/i).selectOption(source);
  }

  async openTicket(ticketNumber: string) {
    await this.page.getByRole('link', { name: ticketNumber }).click();
  }

  async rowCount(): Promise<number> {
    return (await this.rows.count()) - 1; // trừ header
  }
}
