# DevOps tích hợp Test vào CI/CD — Azure DevOps

Tài liệu này làm rõ **DevOps gắn automation test vào CI/CD như thế nào** cho Đối Soát 1B.
Pipeline định nghĩa trong `azure-pipelines.yml` (Azure DevOps Pipelines, YAML).

## 1. Nguyên tắc: gắn đúng tầng test vào đúng điểm vòng đời

Mục tiêu là **fail fast** mà không làm dev chậm: test nhanh chạy sớm và thường xuyên,
test chậm chạy ở mốc ít hơn.

| Sự kiện (trigger) | Tầng test chạy | Vai trò DevOps |
|-------------------|----------------|----------------|
| **PR (pull request)** vào `develop`/`main` | **Vital** (API + Browser) | Build validation; PR phải xanh mới merge |
| **CI** khi merge `develop`/`main` | **Vital + Regression** | Bảo vệ nhánh tích hợp, bắt hồi quy sớm |
| **Nightly** 06:00 giờ VN | **Vital** | Cảnh báo sớm môi trường SIT |
| **Release → SIT/UAT** | **Regression + Performance** | Gate trước khi deploy |

> Trong `azure-pipelines.yml`: stage **Vital** chạy mọi lúc; stage **Regression** có
> `condition: ne(Build.Reason,'PullRequest')` để PR không bị chậm.

## 2. Cách test "cắm" vào pipeline (4 cơ chế)

1. **Thực thi test** — agent cài Node + `npm ci`, cài browser bằng
   `npx playwright install --with-deps chromium`, rồi chạy:
   - API: `npx vitest run tests/vital/api --reporter=junit --outputFile=reports/vitest-vital.xml`
   - Browser: `npx playwright test --project=vital-browser --reporter=junit`
     (đặt `PLAYWRIGHT_JUNIT_OUTPUT_NAME=reports/playwright-vital.xml`).

2. **Công bố kết quả** — `PublishTestResults@2` đẩy file **JUnit** lên **tab Tests**
   của pipeline (pass/fail từng test, xu hướng, flaky). `failTaskOnFailedTests: true`
   để test fail làm pipeline fail.

3. **Lưu chứng cứ** — `PublishPipelineArtifact@1` upload thư mục `reports/`
   (HTML report Playwright + **screenshot/trace khi fail**) để điều tra.

4. **Bí mật & môi trường** — secrets (URL SIT, token, tài khoản UI) lấy từ
   **Variable Group** `doisoat-sit-secrets` (hoặc Azure **Key Vault**), không commit.

## 3. Quality gate — test chặn merge & deploy

- **Branch policy** (Repos → Branches → Policies trên nhánh `develop`/`main`):
  bật *Build Validation* trỏ tới pipeline này → **PR không merge được nếu Vital fail**.
- **Environments + Approvals and checks**: tạo Environment `SIT` (và `UAT`); thêm
  *check* yêu cầu pipeline test xanh → **không deploy được khi test đỏ**. Có thể thêm
  approver thủ công (TL/PO) ở UAT.
- **Release/CD**: stage deploy `dependsOn` stage test với `condition: succeeded()`.

## 4. Thiết lập một lần (DevOps checklist)

- [ ] Tạo **Variable Group** `doisoat-sit-secrets`: `SIT_API_BASE_URL`, `SIT_WEB_URL`,
      `SIT_TEST_USER`, `SIT_TEST_PASSWORD`, `SIT_AUTH_TOKEN` (đánh dấu secret).
- [ ] Tạo pipeline từ `azure-pipelines.yml` (Pipelines → New → Existing YAML).
- [ ] Tạo Environment `SIT`/`UAT` + Approvals and checks.
- [ ] Branch policy `develop`/`main`: Build Validation = pipeline này (required).
- [ ] (Tuỳ chọn) Self-hosted agent nếu SIT nằm trong mạng nội bộ TripOTA.
- [ ] (Tuỳ chọn) Service hook → Teams/Slack báo khi pipeline fail.

## 5. Performance (k6) trong CI/CD

k6 chạy ở stage riêng theo lịch (tuần) hoặc khi release, **không gắn vào PR** (tốn thời
gian). Có thể chạy bằng container k6 hoặc cài k6 trên agent:
`k6 run performance/k6/report-ingest-load.js`. Ngưỡng (p95 < 2s, lỗi < 1%) đặt trong
script; k6 trả exit code ≠ 0 khi vi phạm → fail stage.

## 6. Sơ đồ luồng

```
Dev push → PR ─┬─> [Stage Vital] ──(JUnit→tab Tests, artifact)
               │        │ fail → Branch policy chặn merge
               │        └ pass → cho merge
Merge develop ─┴─> [Vital] → [Stage Regression] ─> (publish results)
Release ───────────> [Vital+Regression+Performance] → Environment check → Deploy SIT/UAT
Nightly 06:00 ─────> [Vital] → cảnh báo
```

## 7. Báo cáo HTML + video/ảnh cho test fail

Sau khi chạy test, pipeline sinh **báo cáo HTML** (`reports/summary.html`) — tương tự mẫu
email: tiêu đề PASSED/FAILED, Environment, Overall Result, bảng suite (API/Browser), nút
**View Detailed Results on Azure DevOps**, và **Failed Test Cases Summary** (mỗi test fail kèm
lỗi + **ảnh + video**).

**Cách hoạt động:**
1. `playwright.config.ts` bật `screenshot: only-on-failure`, `video: retain-on-failure`,
   `trace: retain-on-failure` → chứng cứ chỉ sinh cho test FAIL, lưu trong `test-results/`.
2. Vitest + Playwright xuất JSON (`reports/*-results.json`) và JUnit (`reports/*-junit.xml`).
3. `scripts/build-report.mjs` đọc JSON → dựng `reports/summary.html`, nhúng ảnh/video (đường
   dẫn tương đối tới `test-results/`), link build Azure DevOps.
4. Pipeline `PublishPipelineArtifact` upload `reports/` + `test-results/` → tải về xem video/ảnh.
5. `PublishTestResults` đẩy JUnit lên **tab Tests**; bước "Quality gate" fail pipeline nếu có test đỏ.

**Chạy & xem local:**
```bash
npm run ci:vital        # chạy vital (API+UI) rồi build report (không fail giữa chừng)
npm run report:open     # mở reports/summary.html
```

**Gửi email báo cáo:** thêm 1 task gửi mail ở cuối stage (Office365/SendGrid/SMTP của tổ
chức), body = nội dung `reports/summary.html`, đính kèm `test-results/` nếu muốn ảnh/video.
Xem chỗ comment `(Tuỳ chọn) Gửi email` trong `azure-pipelines.yml`.
