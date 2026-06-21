import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: Number(process.env.TIMEOUT_API ?? 5000) * 2,
    // Vitest chỉ chạy API test; browser test do Playwright runner xử lý.
    include: [
      'tests/vital/api/**/*.test.ts',
      'tests/feature/api/**/*.test.ts',
      'tests/regression/api/**/*.test.ts',
    ],
    reporters: ['default', 'junit', 'json'],
    outputFile: {
      junit: 'reports/vitest-junit.xml',
      json: 'reports/vitest-results.json',
    },
    coverage: { reportsDirectory: 'reports/coverage', reporter: ['text', 'html'] },
  },
});
