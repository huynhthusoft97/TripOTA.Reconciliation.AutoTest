# Đối Soát — Automation Test Suite

Bộ khung kiểm thử **shift-left** cho trang **Đối Soát** của TripOTA, theo 3 tầng:
**Vital** (kiểm tra critical hằng ngày), **Regression** (kiểm tra trước release),
**Performance** (load test). Kiểm thử cả **Web UI (Playwright)** lẫn **API (Vitest)** theo
chiến thuật shift-left thống nhất.

> Nguyên tắc SDD: **test sinh từ spec, không sinh từ code**. Mỗi test trace ngược về
> một User Story `US-1B-0x` và mệnh đề spec trong `../TripOTA.Reconciliation.Spec/specs/001-doisoat-1b/`.
> Xem `docs/traceability.md`.

## Tech Stack

- **TypeScript** — test type-safe
- **Vitest** — API/integration test
- **Playwright** — browser automation cho Web UI đối soát (page objects)
- **k6** — performance/load test

## Vị trí (ngang cấp source & spec)

```
/
├── TripOTA.Reconciliation.Api/      # SOURCE CODE Backend ứng dụng Reconciliation (Đối Soát) (repo riêng)
├── TripOTA.Reconciliation.App/      # SOURCE CODE Frontend ứng dụng Reconciliation (Đối Soát) (repo riêng)
├── TripOTA.Reconciliation.Spec/        # repo spec (SDD: spec/plan/tasks + KB)
└── TripOTA.Reconciliation.AutoTest/    # repo này — automation test suite
```

## Quick Start

> Lần đầu dựng project từ 0: theo **[`SETUP.md`](./SETUP.md)** (step-by-step: tool → cấu trúc → cài đặt → cấu hình → sinh test → CI).

```bash
npm install
npx playwright install chromium     # browser cho Playwright (lần đầu)

npm run test:sit                    # vital (API + browser) trên SIT
npm test                            # = vital
```

## Directory Structure

```
TripOTA.Reconciliation.AutoTest/
├── tests/
│   ├── vital/                   # ⚡ Critical hằng ngày (nhanh, phải pass)
│   │   ├── api/                 #   Vitest API (qua SDK)
│   │   │   └── airline-search.test.ts
│   │   └── browser/             #   Playwright UI
│   │       ├── session.test.ts
│   │       └── system-navigation.test.ts   # smoke toàn hệ thống (33 trang)
│   └── regression/{api,browser}/   # 📋 Trước release (chờ build)
├── performance/k6/              # 🚀 Load/stress test (chờ build)
├── fixtures/auth.setup.ts       # đăng nhập 1 lần → .auth/<env>.json (storageState)
├── lib/
│   ├── env.ts · assertions.ts · api-config.ts (auth/SDK) · index.ts
│   └── browser/pages/           # 📄 Page Objects: login · app-shell · list
├── sdk/                         # client gen từ OpenAPI BE (gitignored — `npm run sdk`)
├── scripts/                     # ci-vital · build-report · open-report · gen-sdk
├── docs/ (test-strategy · traceability · cicd · how-to-add-testcase)
├── prompts/generate-tests-from-spec.md
└── azure-pipelines.yml          # Azure DevOps pipeline
```

## 3 tầng test

### ⚡ Vital (hằng ngày) — critical path phải pass

| Test              | Loại | SLA  | Mô tả                                        |
| ----------------- | ---- | ---- | -------------------------------------------- |
| API Report health | API  | < 1s | API Sale Report Daily phản hồi + đúng schema |
| Parsing           | API  | < 2s | Golden sample → field Sale Ticket đúng       |
| Policy apply      | API  | < 2s | Bản ghi đủ thông tin → áp chính sách         |
| Login             | UI   | < 5s | Đăng nhập trang đối soát                     |
| Dashboard         | UI   | < 5s | Danh sách vé đối soát hiển thị               |
| Tìm vé            | UI   | < 5s | Filter theo số vé trả kết quả                |

```bash
npm run test:vital            # API + browser
npm run test:vital:api
npm run test:vital:browser
```

### 📋 Regression (trước release)

- **API:** data-driven 9 work item trên NDC / non-NDC / refund / PNR / vé nối / thiếu dữ liệu / duplicate.
- **Browser:** luồng UI đầy đủ — lọc → mở chi tiết → xác nhận đối soát; xử lý tay vé thiếu dữ liệu / vé nối thiếu segment.

```bash
npm run test:regression
npm run test:regression:api
npm run test:regression:browser
```

### 🚀 Performance (hằng tuần, k6)

```bash
npm run test:performance         # load xử lý báo cáo theo lô
npm run test:performance:stress  # stress API report ingest
```

## Cấu hình môi trường

```bash
cp .env.example .env.sit
```

| Biến                              | Mặc định     | Mô tả                                 |
| --------------------------------- | ------------ | ------------------------------------- |
| `TEST_ENV`                        | `sit`        | `local` \| `dev` \| `sit`             |
| `API_BASE_URL`                    | auto         | Host **API BE** (Vitest API test + gen SDK đọc `/swagger/v1/swagger.json` từ đây) |
| `WEB_URL`                         | auto         | Host **App** (Playwright UI test)     |
| `TEST_USER` / `TEST_PASSWORD`     | —            | Tài khoản đăng nhập UI (không commit) |
| `AUTH_TOKEN`                      | —            | Token gọi API (không commit)          |
| `TIMEOUT_API` / `TIMEOUT_BROWSER` | 5000 / 30000 | Timeout (ms)                          |

### URL mặc định theo môi trường

| Env   | API (BE)                              | Web UI (App)                          |
| ----- | ------------------------------------- | ------------------------------------- |
| local | http://localhost:8080                 | http://localhost:3000                 |
| dev   | reconciliation-api-dev.tripota.com.vn | reconciliation-app-dev.tripota.com.vn |
| sit   | reconciliation-api-sit.tripota.com.vn | reconciliation-app-sit.tripota.com.vn |

> URL mặc định set sẵn trong `lib/env.ts` (host **API** ≠ host **App**). Tài khoản đặt trong
> `.env.<env>` (tự nạp qua dotenv, không commit). dev URL theo pattern — xác nhận khi dùng.

## Gen SDK từ Backend (OpenAPI → TypeScript)

SDK client (typed) sinh từ **Swagger của BE** (`<API_BASE_URL>/swagger/v1/swagger.json`) bằng
`openapi-generator` (typescript-axios), ra thư mục `sdk/` — dùng cho **Vitest API test**.

```bash
npm run sdk                      # gen theo TEST_ENV hiện tại (mặc định sit)
TEST_ENV=dev npm run sdk         # gen từ API dev
TEST_ENV=local npm run sdk       # gen từ API local
API_BASE_URL=https://... npm run sdk   # chỉ định host API
SDK_SPEC=https://.../swagger/v1/swagger.json npm run sdk   # chỉ định thẳng URL spec
```

Cơ chế (xem `scripts/gen-sdk.mjs`): đọc `API_BASE_URL` theo `TEST_ENV` (giống test) →
spec = `<API_BASE_URL>/swagger/v1/swagger.json`. Chạy generator qua **JAR + Java**
(`scripts/gen-sdk.mjs` tự tải JAR về `.openapi-generator-cli/` và tự dò Java).

> **Cần Java** (đã dùng Temurin JDK 17). `sdk/` + `.openapi-generator-cli/` đã **gitignore**
> (không commit bản sinh) → clone về chạy `npm run sdk` để có lại. BE thêm endpoint → chạy lại
> `npm run sdk` là client + type tự cập nhật (test thì vẫn viết tay / qua skill add-testcase).

## Demo / trình diễn (bật browser lên khi cần)

Mặc định test chạy **headless** (nhanh, cho CI). Khi trình diễn, bật cửa sổ trình duyệt

- làm chậm thao tác:

```bash
npm run demo            # mở browser, slow-motion 600ms, chạy tuần tự toàn bộ vital UI
npm run demo:login      # chỉ kịch bản "đăng nhập hợp lệ" (đẹp để mở màn)
npm run demo:headed     # mở browser, tốc độ thường (không slow-motion)
npm run ui              # Playwright UI mode — chọn/chạy từng test trực quan
```

Bật nhanh bằng biến môi trường (không cần script):

```bash
HEADED=1 SLOWMO=800 npx playwright test --project=vital-browser --workers=1
HEADED=1 npx playwright test -g "VAT Rate" --project=vital-browser   # 1 kịch bản
```

> `HEADED=1` mở cửa sổ; `SLOWMO=<ms>` làm chậm; `--workers=1` chạy tuần tự để khán giả dễ theo dõi.

## Debug browser test

```bash
npx playwright test -g "đăng nhập" --debug --project=vital-browser   # step qua từng bước
npm run report:browser                                               # HTML report + screenshot khi fail
```

## CI/CD (Azure DevOps)

Pipeline trong `azure-pipelines.yml`. Gắn test theo vòng đời:

| Trigger            | Tầng test                | Vai trò                               |
| ------------------ | ------------------------ | ------------------------------------- |
| PR                 | Vital (API + Browser)    | Branch policy: phải xanh mới merge    |
| Merge develop/main | Vital + Regression       | Bắt hồi quy sớm                       |
| Nightly 06:00 VN   | Vital                    | Cảnh báo môi trường SIT               |
| Release → SIT/UAT  | Regression + Performance | Gate trước deploy (Environment check) |

Cơ chế: `PublishTestResults@2` đẩy JUnit (Vitest + Playwright) lên **tab Tests**;
`PublishPipelineArtifact@1` lưu report + screenshot; secrets qua **Variable Group/Key Vault**;
test fail → chặn merge (branch policy) hoặc chặn deploy (Environment approval & checks).

> Chi tiết thiết lập & quality gate: xem **[`docs/cicd.md`](./docs/cicd.md)**.

### Báo cáo + video/ảnh test fail

`reports/summary.html` (HTML như email mẫu): tiêu đề PASSED/FAILED, bảng suite API/Browser,
danh sách test fail kèm **ảnh + video**. Playwright tự chụp `screenshot`/`video`/`trace` **chỉ khi fail**.

```bash
npm run ci:vital      # chạy vital + sinh report
npm run report:open   # mở reports/summary.html
```

## Thêm test case (cho QC/Dev)

QC/Dev tự thêm test case bằng Claude theo prompt template + ví dụ thực tế (màn hình Sale Policy):
xem **[`docs/how-to-add-testcase.md`](./docs/how-to-add-testcase.md)**.

## Viết test (sinh từ spec)

Test tạo từ spec/US, không từ code. Dùng `prompts/generate-tests-from-spec.md` để Claude
sinh test cho từng `US-1B-0x` (cả API và browser), rồi review. Mỗi test gắn tag US + spec clause.

### Ví dụ Browser test (page object)

```typescript
import { test, expect } from "@playwright/test";
import {
  LoginPage,
  ReconciliationListPage,
} from "../../lib/browser/pages/index.js";

test("[VITAL] dashboard đối soát tải được", async ({ page }) => {
  await new LoginPage(page).goto();
  await new LoginPage(page).login();
  const list = new ReconciliationListPage(page);
  await list.goto();
  expect(await list.isLoaded()).toBe(true);
});
```

## Liên hệ với SDD

- Test ↔ spec: `docs/traceability.md` (100% spec coverage, không orphan test).
- Definition of Done (Test): trace về spec clause; coverage đạt; vital (API + UI) xanh trước deploy SIT.
