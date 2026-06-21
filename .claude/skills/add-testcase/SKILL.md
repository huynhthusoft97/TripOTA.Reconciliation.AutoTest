---
name: add-testcase
description: >-
  Thêm MỚI hoặc CẬP NHẬT một automation test case (UI hoặc API) trong bộ test Đối
  Soát (TripOTA.Reconciliation.AutoTest). Dùng khi QC/Dev muốn tạo test cho một màn hình/URL hoặc
  API endpoint, HOẶC sửa/mở rộng/sửa lỗi một test đã có — skill tự đọc DOM thật, sinh
  hoặc chỉnh Page Object + test (Playwright/Vitest), gắn tag US, chạy type-check, chạy
  lại test và cập nhật traceability. Trigger khi người dùng nói: "thêm test", "tạo test
  case", "viết test cho màn hình X", "kiểm tra data load", "test trang /...",
  "QC muốn test ...", "update test ...", "sửa test ...", "thêm assertion vào test ...",
  "test ... đang fail, sửa giúp".
---

# Skill — Thêm / Cập nhật test case (Đối Soát)

Mục tiêu: QC/Dev chỉ cần mô tả **màn hình + kịch bản** (hoặc **test cần sửa**), skill tự
dựng/chỉnh test đúng chuẩn dự án `TripOTA.Reconciliation.AutoTest`. KHÔNG bắt người dùng tự viết selector hay code.

## 0. Xác định CHẾ ĐỘ (Add mới hay Update test có sẵn)

- **Add (mặc định)**: tạo test mới cho màn hình/endpoint → đi tiếp Mục 1 → Quy trình A (B1…B6).
- **Update**: người dùng muốn **sửa / mở rộng / fix** một test đã tồn tại
  (vd "thêm cột vào test Employees", "test X đang fail sửa giúp", "đổi assertion") →
  đi theo **Quy trình U** (Mục 2-U). Nếu chưa rõ test nào → hỏi tên file/đường dẫn (1 lượt).

## 1. Thu thập thông tin (hỏi gọn nếu thiếu, tối đa 1 lượt)

- **Màn hình / URL** (vd `/sales-policy`) hoặc **API endpoint**.
- **Tầng**: `Vital` (mặc định) hay `Regression`.
- **Kịch bản + kỳ vọng** (vd: "mở danh sách → data load đủ": total > 0, bảng render, cột chính hiển thị).

Nếu người dùng đã nêu đủ thông tin cơ bản, KHÔNG hỏi lại ở bước này — đọc DOM luôn.
(Lượt hỏi "nâng cao" để enhance test là **sau khi đọc DOM** — xem B1.5.)

## 2. Quy trình A — THÊM MỚI (BẮT BUỘC)

**B1 — Đọc DOM thật (không đoán selector):**

- Dùng Claude in Chrome: mở `WEB_URL` + route (WEB_URL trong `lib/env.ts` / `.env.sit`).
- Nếu bị chuyển về `/login` → đăng nhập bằng tài khoản trong `.env.sit`
  (điền form; KHÔNG in mật khẩu ra màn hình/đầu ra).
- Đọc bảng/nút/ô tìm/text phân trang/tiêu đề cột → rút **selector ổn định**:
  ưu tiên `data-testid` → `getByRole` (row/button/heading) → `getByPlaceholder` → `getByText`.

**B1.5 — Tư vấn QC (đóng vai QC expert adviser) — BẮT BUỘC sau khi đọc DOM:**

- Dựa trên **DOM thật vừa đọc** (cột, nút, ô tìm, phân trang, filter…), chủ động đề xuất
  **3–6 kịch bản test bổ sung** ngoài kịch bản gốc người dùng nêu — mỗi đề xuất 1 dòng,
  kèm lý do ngắn vì sao đáng test. Bám đúng thành phần CÓ THẬT trên màn hình, không bịa.
  Gợi ý theo thành phần quan sát được:
  - **Lọc theo cột (ag-grid)** → ô filter dưới header, selector ổn định
    `getByRole('textbox', { name: '<Tên cột> Filter Input' })`; dùng `ListPage.filterColumn(col, value)`:
    lọc trùng khớp → thu hẹp + dòng khớp hiển thị; chuỗi vô nghĩa → empty (total 0); xoá → về đủ.
    (⚠️ Đây là "search" QC thường muốn — KHÁC ô `Search ...` góc phải.)
  - Phân trang ("of N items") → sang trang 2 (`ListPage.nextPage()` / `pageRange()`), dữ liệu đổi đúng.
  - Nút hành động (`Export` → `ListPage.triggerDownload('Export')` ra file; `Add New`/`Refresh` hiển thị/chạy).
  - Cột nhạy cảm (Email, mã số…) → đúng định dạng / không rỗng.
  - Quyền/route guard → vào thẳng route khi chưa login bị đẩy về `/login`
    (`await page.goto('<route>'); await expect(page).toHaveURL(/\/login/)`).
  - ⚠️ Ô `Search ...` (góc phải, antd) trên SIT **KHÔNG lọc** danh sách — đừng viết test quanh nó;
    QC muốn "search" → dùng **filter theo cột** ở trên.
- **Hỏi QC 1 lượt** (dùng câu hỏi đa lựa chọn) xem muốn thêm kịch bản nào vào lần này;
  nêu rõ khuyến nghị (Recommended) cho 1–2 cái giá trị nhất. KHÔNG ép — QC chọn gì làm nấy.
- Nếu người dùng đã nói rõ "chỉ làm đúng kịch bản này / làm nhanh" → BỎ QUA bước hỏi, chỉ ghi
  chú 1 dòng các kịch bản nên bổ sung sau, rồi làm tiếp.

**B2 — Page Object:**

- Màn hình **danh sách** → tái dùng `lib/browser/pages/list.page.ts` (`ListPage`):
  `new ListPage(page, '<route>', '<Tiêu đề>')` với `isLoaded / rowCount / totalCount / hasColumn`.
- Màn hình **form/detail/khác** → tạo Page Object mới trong `lib/browser/pages/`,
  export trong `index.ts`. Đặt method theo hành vi (vd `open`, `submit`, `fieldValue`).

**B3 — Viết test:**

- Vị trí: `tests/vital/browser/` (UI) · `tests/regression/browser/` · hoặc `tests/{vital,regression}/api/` (Vitest API).
- UI: **KHÔNG login trong từng test** — đã đăng nhập sẵn **1 lần** qua project `setup`
  (storageState `.auth/<env>.json`, xem `fixtures/auth.setup.ts`). Test chỉ cần
  `await page.goto('<route>')` rồi assert; phiên đăng nhập có sẵn.
- Chỉ viết login trong test khi **cố ý** kiểm thử riêng luồng đăng nhập (khi đó dùng `LoginPage`).
- Tên test mở đầu `[VITAL]` hoặc `[REGRESSION]`; comment đầu file `// US-1B-0x | spec: <mệnh đề>`.
- Assertion bám đúng kịch bản người dùng nêu.

**B4 — Type-check:** chạy `npx tsc --noEmit` đến khi **sạch** (sửa nếu lỗi).

**B5 — Traceability:** thêm dòng test vào `docs/traceability.md`.

**B6 — Trả kết quả:** tên file test + **lệnh demo**:

```
HEADED=1 SLOWMO=600 npx playwright test -g "<tên test>" --project=vital-browser --workers=1
```

## 2-U. Quy trình U — CẬP NHẬT test có sẵn (BẮT BUỘC)

**U1 — Định vị test:** từ mô tả/tên người dùng, tìm file trong `vital|regression/{browser,api}/`
(dùng Grep theo tên test hoặc route). Mở **đọc nguyên file + Page Object liên quan** để hiểu
hành vi hiện tại trước khi sửa. Chưa chắc đúng file → hỏi 1 lượt.

**U2 — (Tuỳ) Chạy test hiện tại để chốt baseline:** nếu là fix lỗi/đổi hành vi, chạy
`npx playwright test -g "<tên test>"` (hoặc `vitest`) để thấy trạng thái/đỏ thật trước khi sửa.

**U3 — (Tuỳ) Đọc lại DOM thật:** chỉ khi thay đổi đụng selector mới / cột / nút / luồng mới.
Theo đúng B1 (đọc DOM, không bịa selector). Đổi assertion thuần thì bỏ qua.

**U4 — Sửa tối thiểu, đúng chuẩn (KISS/DRY):**

- Ưu tiên **sửa tại chỗ** assertion/selector; chỉ thêm test mới trong file nếu là kịch bản mới.
- Selector/hành vi chung → cân nhắc nâng lên Page Object (`ListPage`/…) để tái dùng, KHÔNG copy-paste.
- Giữ nguyên quy ước: tag `[VITAL]/[REGRESSION]`, comment `// US-1B-0x`, **chờ `login.isLoggedIn()`**
  trước khi `goto` (xem B3). KHÔNG sửa source ứng dụng.

**U5 — Type-check + chạy lại:** `npx tsc --noEmit` sạch, rồi chạy lại test mục tiêu cho **xanh**
(nếu sửa Page Object dùng chung → chạy cả project để không vỡ test khác).

**U6 — Traceability:** cập nhật dòng tương ứng trong `docs/traceability.md` nếu phạm vi/kịch bản đổi.

**U7 — Trả kết quả:** liệt kê **diff đã đổi (tóm tắt)** + file + lệnh demo (như B6). Nếu phát hiện
defect sản phẩm trong lúc sửa → nêu rõ, KHÔNG viết test xanh-giả quanh hành vi lỗi.

## 3. Quy ước

- Selector lấy từ DOM thật; KHÔNG bịa. Endpoint/selector chưa chắc → hỏi người dùng.
- Tái dùng Page Object (`ListPage` / `LoginPage` / `AppShell`) khi có thể.
- UI test PHẢI chờ `login.isLoggedIn()` trước khi `goto` (xem B3) — tránh login race.
- KHÔNG sửa source code ứng dụng (`TripOTA.Reconciliation.Api` và `TripOTA.Reconciliation.App`).
- Mỗi test phải `tsc` sạch trước khi báo hoàn tất.
- Không log/echo mật khẩu hay token.

## 4. Ví dụ tham chiếu (đã có trong repo)

Input: _"test /sales-policy, kiểm tra data load đủ"_ →
Output: tái dùng `ListPage` → `tests/vital/browser/sales-policy-list.test.ts`
(assert `totalCount() > 0`, `rowCount() > 2`, cột `Sale Policy Name/Provider/Type` hiển thị).

## 5. Mẫu code nhanh (list screen)

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, ListPage } from "../../lib/browser/pages/index.js";

// US-1B-UI | spec: <màn hình> load dữ liệu
test("[VITAL] <Tiêu đề> list load dữ liệu đầy đủ", async ({ page }) => {
  // 1 instance LoginPage; CHỜ login xong rồi mới goto (tránh login race → bị đẩy về /login).
  const login = new LoginPage(page);
  await login.goto();
  await login.login();
  expect(await login.isLoggedIn()).toBe(true);

  const list = new ListPage(page, "<route>", "<Tiêu đề>");
  await list.goto();
  expect(await list.isLoaded()).toBe(true);
  expect(await list.totalCount()).toBeGreaterThan(0);
  expect(await list.rowCount()).toBeGreaterThan(2);
  await expect(list.hasColumn("<Cột chính>")).toBeVisible();
});
```
