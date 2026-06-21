# Ma trận Traceability — Test ↔ User Story ↔ Spec

Mỗi test phải trace ngược về một `US-1B-0x` và mệnh đề spec trong
`../TripOTA.Reconciliation.Spec/specs/001-doisoat-1b/spec.md`. Mục tiêu: **100% spec coverage, không orphan test**.
Kiểm thử cả **API (Vitest)** và **Web UI (Playwright)**.

| US       | Work item (spec 1B)             | Vital API             | Vital UI                                           | Regression API                | Regression UI     | Perf                               |
| -------- | ------------------------------- | --------------------- | -------------------------------------------------- | ----------------------------- | ----------------- | ---------------------------------- |
| US-1B-01 | Call API Report Daily           | `api-report-health`   | ⬜                                                 | retry/pagination ⬜           | —                 | `report-ingest-load`, `api-stress` |
| US-1B-02 | Parsing Sale Ticket             | `parsing-sale-ticket` | ⬜                                                 | `wi02-parsing`                | —                 | —                                  |
| US-1B-03 | Update ticket command (non-NDC) | (sanity) ⬜           | —                                                  | `wi03-ticket-command-non-ndc` | `reconcile-flow`  | —                                  |
| US-1B-04 | Update retrieve NDC             | ⬜                    | —                                                  | ⬜                            | ⬜                | —                                  |
| US-1B-05 | Update PNR command              | —                     | —                                                  | ⬜                            | —                 | —                                  |
| US-1B-06 | Refund price (chỉ Ticket)       | —                     | —                                                  | ⬜                            | ⬜                | —                                  |
| US-1B-07 | Apply chính sách                | `policy-apply.smoke`  | —                                                  | `wi07-apply-policy`           | `reconcile-flow`  | —                                  |
| US-1B-08 | Enhance ticket face NDC         | —                     | —                                                  | ⬜                            | —                 | —                                  |
| US-1B-09 | Vé nối (source 1B)              | —                     | —                                                  | `wi09-conjunction-ticket`     | `manual-handling` | —                                  |
| US-1B-UI | Đăng nhập / phiên / shell       | —                     | `login`, `login-invalid`, `home-shell`, `navigate`, `system-navigation` (33 trang) | —                             | —                 | —                                  |

> **Vital UI seed đã xác minh trên SIT** (reconciliation-app-sit.tripota.com.vn): login hợp lệ/sai, Home shell + menu, điều hướng VAT Rate. Các test UI cho danh sách/đối soát vé (US-1B-01..09) chờ xác nhận route thật trong menu Business Management/Report.

Chú thích: tên file (không đuôi) = test đã có; ⬜ = cần bổ sung (sinh từ spec qua
`prompts/generate-tests-from-spec.md`).

## Quy ước gắn tag trong test

- `describe`/`test` mở đầu bằng `[VITAL]` / `[REGRESSION]` + mã `US-1B-0x`.
- Comment đầu file ghi: `// US-1B-0x | spec: <mệnh đề>`.
- API: gọi qua SDK (`lib/api-config` lấy token) + assert response. UI: page object trong `lib/browser/pages/`.

## Bộ dữ liệu data-driven (regression API)

`ticket-non-ndc` · `ticket-ndc` · `refund` · `pnr` · `conjunction-ticket` (vé nối) · `missing-data`

## Vital màn hình danh sách (UI screens)

| Màn hình             | Route                       | Test                          | Kiểm tra                                                                                                                                                                                  |
| -------------------- | --------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sale Policy          | `/sales-policy`             | `sales-policy-list`           | Data load đủ (cột Code/Name/Policy Type/Provider/Type/Sub Type/Actions + nút Add New); phân trang trang 2; lọc theo cột (Sale Policy Name) + empty state; route guard chưa login → /login |
| Sale Policy (detail) | `/sales-policy/update/<id>` | `sale-policy-detail`          | Click dòng → mở chi tiết "Update Sale Policy"; tên list ↔ detail khớp; nhãn + trường bắt buộc không rỗng; select có giá trị; ngày dd/mm/yyyy; nút Save                                    |
| Employees            | `/employees`                | `employees-list`              | Data load đủ: total > 0, bảng render, cột Employee No/Name/Department hiển thị                                                                                                            |
| Employees            | `/employees`                | `employees-pagination-export` | Phân trang sang trang 2 đổi dữ liệu; nút Export tải file `.xlsx`                                                                                                                          |

> Dùng `ListPage` (tái sử dụng) cho mọi màn hình danh sách. Cách thêm test: xem `how-to-add-testcase.md`.
