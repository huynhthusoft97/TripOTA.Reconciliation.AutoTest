# Hướng dẫn Setup Test Project — Đối Soát 1B (step by step)

Tài liệu này hướng dẫn dựng bộ automation test từ con số 0: **công cụ → cấu trúc
project → cài đặt → cấu hình → chạy thử → sinh test từ spec → CI**. Có thể làm thủ
công, hoặc nhờ Claude tự cài (xem Bước 9).

---

## 0. Yêu cầu công cụ (Tools)

| Công cụ             | Phiên bản   | Dùng để                | Kiểm tra                   |
| ------------------- | ----------- | ---------------------- | -------------------------- |
| Node.js             | ≥ 20 LTS    | chạy Vitest/Playwright | `node -v`                  |
| npm                 | đi kèm Node | quản lý package        | `npm -v`                   |
| Git                 | bất kỳ      | version control        | `git --version`            |
| Playwright browsers | —           | chạy browser test      | `npx playwright --version` |
| k6                  | ≥ 0.50      | performance test       | `k6 version`               |
| Claude Code         | mới nhất    | sinh test từ spec      | —                          |

> macOS: cài k6 bằng `brew install k6`. Linux: xem https://k6.io/docs. Windows: dùng WSL2.

---

## 1. Vị trí project (ngang cấp source & spec)

Đặt repo test **ngang cấp** với source code và repo spec, cùng thư mục cha:

```
/
├── TripOTA.Reconciliation.Api/      # source code ứng dụng (web + API)
├── TripOTA.Reconciliation.App/      # source code ứng dụng (web + API)
├── TripOTA.Reconciliation.Spec/        # repo spec (spec/plan/tasks + KB)
└── TripOTA.Reconciliation.AutoTest/    # repo test (project này)
```

---

## 2. Cấu trúc project (Structure)

Tạo các thư mục theo 3 tầng + tách API/Browser:

```bash
mkdir -p tests/vital/api tests/vital/browser \
         tests/regression/api tests/regression/browser \
         performance/k6 \
         lib/browser/pages lib/sample-data \
         docs prompts
```

Cấu trúc đích:

```
TripOTA.Reconciliation.AutoTest/
├── package.json · tsconfig.json · vitest.config.ts · playwright.config.ts
├── .env.example · .gitignore
├── vital/
│   ├── api/        # health, parsing, policy smoke
│   └── browser/    # login, dashboard, tìm vé
├── regression/
│   ├── api/        # data-driven 9 work item
│   └── browser/    # luồng đối soát đầy đủ
├── performance/k6/ # load + stress
├── lib/
│   ├── api-client.ts · env.ts · fixtures.ts · assertions.ts · index.ts
│   ├── browser/pages/   # Page Objects (login, list, detail)
│   └── sample-data/     # NDC, non-NDC, refund, PNR, vé nối, thiếu dữ liệu
├── docs/           # test-strategy.md · traceability.md
├── prompts/        # generate-tests-from-spec.md
└── azure-pipelines.yml  · docs/cicd.md
```

Nguyên tắc tách: **Vitest** chạy `*/api/**`, **Playwright** chạy `*/browser/**` (2 runner riêng).

---

## 3. Khởi tạo package & cài dependencies

```bash
npm init -y
npm pkg set type="module"

# Test runner & ngôn ngữ
npm i -D typescript @types/node vitest @vitest/coverage-v8 cross-env

# Browser automation
npm i -D @playwright/test
npx playwright install chromium      # tải browser (lần đầu)
```

> k6 cài ở cấp hệ thống (không qua npm) — xem Bước 0.

---

## 4. File cấu hình

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["vital", "regression", "lib"]
}
```

### `vitest.config.ts` (chỉ chạy API)

```typescript
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/vital/api/**/*.test.ts", "tests/regression/api/**/*.test.ts"],
    coverage: {
      reportsDirectory: "reports/coverage",
      reporter: ["text", "html"],
    },
  },
});
```

### `playwright.config.ts` (2 project: vital/regression browser)

```typescript
import { defineConfig } from "@playwright/test";
const WEB_URL = process.env.WEB_URL;
export default defineConfig({
  testDir: ".",
  use: {
    baseURL: WEB_URL,
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: [
    ["html", { outputFolder: "reports/playwright", open: "never" }],
    ["list"],
  ],
  projects: [
    { name: "vital-browser", testMatch: "tests/vital/browser/**/*.test.ts" },
    {
      name: "regression-browser",
      testMatch: "tests/regression/browser/**/*.test.ts",
    },
  ],
});
```

### `package.json` scripts (rút gọn)

```json
{
  "scripts": {
    "test": "npm run test:vital",
    "test:vital": "npm run test:vital:api && npm run test:vital:browser",
    "test:vital:api": "vitest run tests/vital/api",
    "test:vital:browser": "playwright test --project=vital-browser",
    "test:regression": "npm run test:regression:api && npm run test:regression:browser",
    "test:sit": "cross-env TEST_ENV=sit npm run test:vital",
    "test:performance": "k6 run performance/k6/report-ingest-load.js"
  }
}
```

---

## 5. Cấu hình môi trường (.env)

```bash
cp .env.example .env.sit
```

`.env.example`:

```
TEST_ENV=sit
API_BASE_URL=            # auto theo TEST_ENV nếu để trống
SALE_REPORT_URL=
WEB_URL=                 # URL web UI đối soát
TEST_USER=qc@tripota.vn
TEST_PASSWORD=           # KHÔNG commit
AUTH_TOKEN=              # KHÔNG commit
TIMEOUT_API=5000
TIMEOUT_BROWSER=30000
```

> Secret (token, mật khẩu) đưa qua `.env.*` (đã .gitignore) hoặc CI secrets — không commit.

---

## 6. Lớp tiện ích `lib/` (viết 1 lần, tái dùng)

Tạo theo thứ tự (xem code mẫu trong repo):

1. `lib/env.ts` — đọc `TEST_ENV`, auto-detect URL theo môi trường.
2. `lib/api-client.ts` — HTTP client (`api.get/post/put`) gắn token & timeout.
3. `lib/assertions.ts` — assertion nghiệp vụ: `assertTicketParsed`, `assertTicketReconciled`, `assertPolicyApplied`.
4. `lib/fixtures.ts` — `loadSample(name)` nạp dữ liệu mẫu; `DATASETS` cho data-driven.
5. `lib/browser/pages/` — Page Objects: `LoginPage`, `ReconciliationListPage`, `TicketDetailPage`.
6. `lib/sample-data/*.sample.json` — NDC, non-NDC, refund, PNR, vé nối, thiếu dữ liệu.

---

## 7. Chạy thử (smoke)

```bash
npx tsc --noEmit              # type-check: phải sạch
npm run test:vital:api        # API vital
npm run test:vital:browser    # browser vital (cần WEB_URL + tài khoản)
npm run test:sit              # cả hai trên SIT
```

Debug browser:

```bash
npx playwright test --project=vital-browser --headed --workers=1
npx playwright test -g "đăng nhập" --debug --project=vital-browser
npx playwright show-report reports/playwright
```

---

## 8. Sinh test từ spec (test-from-spec)

Mở Claude Code tại repo và dùng prompt `prompts/generate-tests-from-spec.md`. Tóm tắt:

```
Đọc ../TripOTA.Reconciliation.Spec/CLAUDE.md, spec 001-doisoat-1b/spec.md và KB GRAPH_REPORT.md.
Với mỗi US chưa có test (xem docs/traceability.md, ô ⬜):
- Sinh test Vitest (API) và/hoặc Playwright (UI) theo style file mẫu.
- Phủ happy path + edge: thiếu dữ liệu, duplicate, NDC vs non-NDC, refund, vé nối.
- Dùng loadSample(...) cho API; page object cho UI.
- Gắn tag [VITAL]/[REGRESSION] + US-1B-0x; comment đầu file ghi spec clause.
- Cập nhật docs/traceability.md.
Endpoint/selector chưa rõ → để TODO + hỏi, KHÔNG bịa.
```

---

## 9. Tự cài bằng Claude (tuỳ chọn — thay Bước 0–4)

Mở Claude Code tại thư mục `doi-soat/` và dán:

```
Giúp tôi dựng test project TripOTA.Reconciliation.AutoTest/ ngang cấp TripOTA.Reconciliation.Api, TripOTA.Reconciliation.App và TripOTA.Reconciliation.Spec.
1) Kiểm tra Node>=20, npm, git, k6 (báo cách cài nếu thiếu).
2) Tạo cấu trúc thư mục vital/{api,browser}, regression/{api,browser}, performance/k6,
   lib/{browser/pages,sample-data}, docs, prompts; thêm azure-pipelines.yml.
3) npm init + cài: typescript @types/node vitest @vitest/coverage-v8 cross-env @playwright/test.
   Chạy npx playwright install chromium.
4) Tạo tsconfig/vitest.config/playwright.config + package.json scripts như SETUP.md.
5) Tạo .env.example và lib/ (env, api-client, assertions, fixtures, page objects).
6) Chạy npx tsc --noEmit để xác nhận sạch.
Xin xác nhận trước mỗi lệnh cài đặt. Không tạo test thật ở bước này.
```

---

## 9b. Skill `/add-testcase` (đi kèm repo — không cài riêng)

Skill QC tự sinh/cập nhật test nằm sẵn trong repo tại `.claude/skills/add-testcase/SKILL.md`.
**Cách "cài" = lấy repo về** — mở thư mục project bằng Claude Code là tự có lệnh `/add-testcase`,
KHÔNG cần bước cài đặt riêng (skill phụ thuộc Page Object & `.env.sit` của chính repo này, nên
phải sống trong repo — đừng copy ra `~/.claude` hay đóng plugin).

Yêu cầu để chạy được: đã `npm install` + `npx playwright install chromium` + có `.env.sit`
(tài khoản SIT) như Bước 3 & 5.

Dùng:

```
/add-testcase add vital testcase cho <URL hoặc /route>          # tạo MỚI
/add-testcase '<đường dẫn test file>' update ... bổ sung ...     # CẬP NHẬT test có sẵn
```

Skill tự: đọc DOM thật (đăng nhập SIT) → tư vấn kịch bản (QC adviser) → tái dùng/sinh Page Object
→ viết test → `tsc` → chạy lại → cập nhật `docs/traceability.md`. Chi tiết: mở SKILL.md.

---

## 10. CI/CD (Azure DevOps)

`azure-pipelines.yml`: **PR** → Vital (branch policy chặn merge nếu fail); **merge develop/main**
→ Vital + Regression; **nightly 06:00 VN** → Vital; **release** → Regression + Performance
(Environment check chặn deploy). JUnit của Vitest + Playwright publish lên **tab Tests**;
report/screenshot làm artifact. Secrets ở **Variable Group/Key Vault**.

> Chi tiết thiết lập (variable group, branch policy, environment check): `docs/cicd.md`.

---

## Checklist hoàn tất setup

- [ ] `node -v` ≥ 20, `k6 version` chạy được
- [ ] Cấu trúc thư mục đủ 3 tầng + tách api/browser
- [ ] `npm install` xong, `npx playwright install chromium` xong
- [ ] `npx tsc --noEmit` sạch
- [ ] `.env.sit` cấu hình API_BASE_URL + WEB_URL + tài khoản
- [ ] `npm run test:vital:api` và `:browser` chạy được (dù 1 số fail do endpoint placeholder)
- [ ] Đã chạy prompt sinh test cho ≥ 1 US thật và review
- [ ] CI workflow đã thêm secrets
