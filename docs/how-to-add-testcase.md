# Hướng dẫn thêm 1 test case bằng Claude (cho QC/Dev)

Tài liệu này giúp QC/Dev tự thêm một test case vào bộ test bằng Claude, theo đúng quy ước
của dự án. Có **prompt template** + **một ví dụ thực tế đã làm** (màn hình Sale Policy).

> Nguyên tắc: mỗi test gắn `[VITAL]`/`[REGRESSION]` + mã `US-1B-0x` + comment spec clause;
> dùng **Page Object** trong `lib/browser/pages/`; **selector phải lấy từ DOM thật**, không bịa.

---

## Quy trình 5 bước

**B1. Xác định test case** — trả lời 3 câu:
- Màn hình/URL nào? (vd `/sales-policy`)
- Kịch bản gì? (vd: mở danh sách → dữ liệu có load đủ không)
- Kỳ vọng (assertion)? (vd: có > 0 bản ghi, bảng render, cột chính hiển thị)

**B2. Cho Claude “nhìn” DOM thật** — mở Claude Code/Cowork có **Claude in Chrome**, yêu cầu
Claude mở URL trên SIT và đọc cấu trúc (bảng, nút, text phân trang). Đây là bước lấy
**selector chính xác** thay vì đoán. (Nếu không có Chrome extension: tự mở trang, F12 →
copy selector/`data-testid`, dán cho Claude.)

**B3. Dán PROMPT (mẫu bên dưới)** — Claude sinh/cập nhật:
- Page Object (tái dùng `ListPage` nếu là màn hình danh sách),
- file test trong `tests/vital/browser/` hoặc `tests/regression/browser/`,
- gắn tag + comment + cập nhật `docs/traceability.md`.

**B4. Chạy thử (demo)** — xem test chạy “sống”:
```bash
HEADED=1 SLOWMO=600 npx playwright test -g "Sale Policy" --project=vital-browser --workers=1
```

**B5. Chốt** — `npx tsc --noEmit` sạch → commit (kèm cập nhật traceability).

---

## PROMPT TEMPLATE (copy & điền)

```
Bối cảnh: repo automation test TypeScript (Vitest API + Playwright UI) cho Reconciliation
System (SIT). Quy ước: Page Object trong lib/browser/pages/, test trong tests/{vital,regression}/browser,
mỗi test gắn [VITAL]/[REGRESSION] + US-1B-0x + comment spec clause. Dùng .env.sit để đăng nhập.

Tôi muốn thêm 1 test case:
- Màn hình / URL: <vd /sales-policy>
- Tầng: <Vital | Regression>
- Kịch bản: <vd: mở danh sách, kiểm tra dữ liệu có load đủ>
- Kỳ vọng: <vd: tổng bản ghi > 0; bảng render dòng; cột Code/Name/Provider hiển thị>

Yêu cầu:
1) Mở URL trên SIT bằng Claude in Chrome, đọc DOM để lấy selector THẬT (bảng, dòng, text
   phân trang, cột). KHÔNG đoán selector.
2) Nếu là màn hình danh sách → tái dùng ListPage (lib/browser/pages/list.page.ts);
   nếu cần hành vi mới → bổ sung method vào Page Object phù hợp.
3) Viết file test theo style các test mẫu trong tests/vital/browser. Đã đăng nhập sẵn 1 lần
   qua project "setup" (storageState) — KHÔNG login lại trong test, chỉ goto + assert.
4) Gắn [VITAL]/[REGRESSION] + // US-1B-0x | spec: ... ; cập nhật docs/traceability.md.
5) Chạy npx tsc --noEmit cho sạch; đề xuất lệnh demo (HEADED=1) để tôi xem.
Không sửa source code ứng dụng. Endpoint/selector chưa chắc → hỏi tôi, đừng bịa.
```

---

## Ví dụ thực tế đã làm — Sale Policy list

**B1. Test case:** URL `/sales-policy`; Vital; kịch bản “mở danh sách → data có load đủ không”;
kỳ vọng: có bản ghi, bảng render, cột chính hiển thị.

**B2. DOM thật (Claude in Chrome đọc được):**
- Tiêu đề `Sale Policy`, nút `Add New`.
- Bảng cột: Code · Sale Policy Name · Description · Policy Type · Provider · Type · Sub Type · Effective · Actions.
- Dòng dữ liệu có `role="row"`.
- Phân trang: text `"1 - 50 of 99 items"`, 2 trang.

**B3. Kết quả Claude sinh:**
- Tái dùng `lib/browser/pages/list.page.ts` (ListPage: `isLoaded`, `rowCount`, `totalCount`, `hasColumn`).
- Test `tests/vital/browser/sales-policy-list.test.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { ListPage } from '../../../lib/browser/pages/index.js';

// US-1B-UI | Vital: màn hình danh sách Sale Policy load dữ liệu đầy đủ.
// Đã đăng nhập sẵn qua project "setup" (storageState) — không login trong test.
test('[VITAL] Sale Policy list load dữ liệu đầy đủ', async ({ page }) => {
  const list = new ListPage(page, '/sales-policy', 'Sale Policy');
  await list.goto();

  expect(await list.isLoaded()).toBe(true);                 // màn hình load
  expect(await list.totalCount()).toBeGreaterThan(0);       // "of 99 items" → có data
  expect(await list.rowCount()).toBeGreaterThan(2);         // bảng render dòng
  await expect(list.hasColumn('Sale Policy Name')).toBeVisible();
  await expect(list.hasColumn('Provider')).toBeVisible();
  await expect(list.hasColumn('Type')).toBeVisible();
});
```

**B4. Demo:**
```bash
HEADED=1 SLOWMO=600 npx playwright test -g "Sale Policy" --project=vital-browser --workers=1
```

**B5.** `npx tsc --noEmit` sạch → cập nhật traceability → commit.

---

## Mẫu “data load đủ” cho MỌI màn hình danh sách

Hầu hết màn hình list (VAT Rate, Currencies Rate, …) đều dùng được `ListPage` — chỉ đổi route + title:

```typescript
const list = new ListPage(page, '/vat-rate', 'VAT Rate');
await list.goto();
expect(await list.isLoaded()).toBe(true);
expect(await list.totalCount()).toBeGreaterThan(0);
```

## Checklist trước khi commit
- [ ] Selector lấy từ DOM thật (không đoán).
- [ ] Test gắn `[VITAL]/[REGRESSION]` + `// US-1B-0x | spec: ...`.
- [ ] Tái dùng Page Object (ListPage / LoginPage / AppShell) khi có thể.
- [ ] `npx tsc --noEmit` sạch; chạy demo thấy xanh.
- [ ] Cập nhật `docs/traceability.md`.
