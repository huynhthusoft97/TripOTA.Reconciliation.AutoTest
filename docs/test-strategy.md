# Automation Test Strategy — Đối Soát 1B

## 1. Mục tiêu
Tự động hoá kiểm thử cho pipeline Đối soát vé 1B theo nguyên tắc SDD **test-from-spec**:
phát hiện lỗi sớm (shift-left), bảo vệ critical path hằng ngày, và đảm bảo mỗi thay đổi
trace được về spec. Tự động hoá là điều kiện để đạt tiêu chí POC: defect leakage thấp,
Req→Deploy ≤ 10 ngày.

## 2. Phạm vi
9 work item của 1B (API report, parsing, ticket command non-NDC, retrieve NDC, PNR,
refund, apply chính sách, enhance face NDC, vé nối). Kiểm thử **cả Web UI đối soát
(Playwright) lẫn API/pipeline (Vitest)** theo chiến thuật shift-left thống nhất.

## 3. Chiến thuật shift-left — 3 tầng
- **Vital (hằng ngày):** tập nhỏ, nhanh (< vài giây/test), phải pass. Chạy theo lịch + khi
  deploy SIT. Fail → chặn deploy. Bảo vệ critical path: API report sống, parsing đúng,
  update sanity, apply chính sách.
- **Regression (trước release):** phủ đủ 9 work item, **data-driven** trên các bộ NDC /
  non-NDC / refund / PNR / vé nối / thiếu dữ liệu / duplicate.
- **Performance (hằng tuần, k6):** load xử lý báo cáo theo lô + stress khi spike.

## 4. Test pyramid
Đáy rộng là **unit/integration + API/contract** cho logic parsing, mapping, rule chính
sách, ingest & update (rẻ, nhanh, nhiều). Giữa–đỉnh là **UI/E2E (Playwright)** cho các
luồng đối soát quan trọng trên web (login, dashboard, lọc, xác nhận match, xử lý tay) —
dùng page object để bền vững. Đỉnh là **performance**. UI test tập trung critical journey,
không lặp lại mọi nhánh dữ liệu đã phủ ở tầng API.

## 5. Traceability
Mỗi test gắn `US-1B-0x` + spec clause (xem `traceability.md`). Mục tiêu 100% spec coverage,
không orphan test. Defect liên kết ngược về requirement.

## 6. Test data
Bộ mẫu trong `lib/sample-data/` đại diện đủ biến thể nghiệp vụ. Nguyên tắc: không dùng dữ
liệu vé/PNR thật ngoài môi trường cho phép; ẩn danh khi cần. Dữ liệu nạp qua `loadSample()`.

## 7. Môi trường & CI/CD
`TEST_ENV` (local/sit) auto-detect URL. Secrets qua **Azure DevOps Variable Group/Key Vault**,
không commit. **Azure Pipelines**: PR→Vital (branch policy chặn merge); merge→Vital+Regression;
nightly→Vital; release→Regression+Performance (Environment check chặn deploy). JUnit của Vitest+
Playwright publish lên tab Tests; report/screenshot làm artifact. Chi tiết: `cicd.md`.

## 8. Definition of Done (Test)
- Test trace về spec clause; coverage đạt mục tiêu; không orphan test.
- Test data đầy đủ cho các biến thể.
- Vital xanh trước khi deploy SIT; regression xanh trước release.

## 9. Lộ trình tích hợp vào POC 2 tuần
- Ngày 5: chốt test strategy + ma trận traceability (tầng vital trước).
- Ngày 6–8: sinh test từ spec song song code (vital → regression), data-driven.
- Ngày 9: regression + performance smoke trên SIT; gate SIT Pass.
- Ngày 10: tổng hợp coverage vào retrospective + playbook.

## 10. Cách mở rộng
Sinh test còn thiếu bằng `prompts/generate-tests-from-spec.md`. Khi spec đổi → cập nhật
test tương ứng (change control). Có thể thêm contract test (vd Pact) cho API hãng/NDC sau POC.
