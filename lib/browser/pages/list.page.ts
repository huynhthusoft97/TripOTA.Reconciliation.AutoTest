import { Page, Download, expect } from '@playwright/test';
import { env } from '../../env.js';

// Page Object DÙNG CHUNG cho mọi màn hình DANH SÁCH (grid) — vd Sale Policy, VAT Rate...
// Tái sử dụng: new ListPage(page, '/sales-policy', 'Sale Policy').
export class ListPage {
  constructor(
    private page: Page,
    private route: string,
    private title: string,
  ) {}

  async goto() {
    await this.page.goto(this.route);
  }

  // Màn hình đã load: tiêu đề hiển thị.
  async isLoaded(): Promise<boolean> {
    await expect(this.page.getByText(this.title, { exact: true }).first())
      .toBeVisible({ timeout: env.timeoutBrowser });
    return true;
  }

  // Số dòng (gồm header/filter) — dùng role=row (chuẩn cho HTML/antd table).
  rows() {
    return this.page.getByRole('row');
  }

  async rowCount(): Promise<number> {
    return this.rows().count();
  }

  // Tổng bản ghi đọc từ text phân trang dạng "... of <N> items" (hỗ trợ dấu phẩy: "1,234").
  // Poll tới khi số ổn định > 0 — tránh đọc trúng "of 0 items" lúc grid antd đang nạp data async.
  // List rỗng hợp lệ: hết ~3s vẫn 0 thì trả 0.
  async totalCount(): Promise<number> {
    const loc = this.page.getByText(/of\s+[\d,]+\s+items/i).first();
    await loc.waitFor({ state: 'visible', timeout: env.timeoutBrowser });
    let total = 0;
    for (let i = 0; i < 15; i++) {
      const m = (await loc.textContent())?.match(/of\s+([\d,]+)\s+items/i);
      total = m ? Number(m[1].replace(/,/g, '')) : 0;
      if (total > 0) break;
      await this.page.waitForTimeout(200);
    }
    return total;
  }

  // Cột có tồn tại (theo tên header hiển thị).
  hasColumn(name: string) {
    return this.page.getByText(name, { exact: true }).first();
  }

  // Khoảng bản ghi đang xem dạng "1 - 50 of 208 items" (antd pagination total).
  async pageRange(): Promise<string> {
    const loc = this.page.getByText(/[\d,]+\s*-\s*[\d,]+\s+of\s+[\d,]+\s+items/i).first();
    await loc.waitFor({ state: 'visible', timeout: env.timeoutBrowser });
    return (await loc.textContent())?.trim() ?? '';
  }

  // Sang trang kế (antd: <li class="ant-pagination-next">). Chờ khoảng bản ghi đổi.
  async nextPage() {
    const before = await this.pageRange();
    const next = this.page.locator('li.ant-pagination-next');
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await expect
      .poll(() => this.pageRange(), { timeout: env.timeoutBrowser })
      .not.toBe(before);
  }

  // Mở bản ghi đầu tiên: click link đầu trong grid (ag-grid) → mở màn chi tiết.
  // Trả về text đã click (vd tên bản ghi) để đối chiếu dữ liệu list ↔ detail.
  async openFirstRow(): Promise<string> {
    const link = this.page.locator('.ag-center-cols-container a, .ag-body-viewport a').first();
    await link.waitFor({ state: 'visible', timeout: env.timeoutBrowser });
    const text = (await link.innerText()).trim();
    await link.click();
    return text;
  }

  // Ô filter theo cột của ag-grid (aria-label dạng "<Tên cột> Filter Input").
  filterInput(column: string) {
    return this.page.getByRole('textbox', { name: `${column} Filter Input` });
  }

  // Gõ giá trị vào ô filter của 1 cột rồi chờ ag-grid áp filter xong (debounce ~0.5s + render).
  // Để rỗng ('') = xoá filter. Sau khi gọi, đọc totalCount()/rowCount() để assert kết quả.
  async filterColumn(column: string, value: string) {
    await this.filterInput(column).fill(value);
    await this.page.waitForTimeout(1200);
  }

  // Bấm nút toolbar (vd "Export") và trả về file tải xuống để assert tên/định dạng.
  async triggerDownload(buttonName: string): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: env.timeoutBrowser }),
      this.page.getByRole('button', { name: buttonName }).click(),
    ]);
    return download;
  }
}
