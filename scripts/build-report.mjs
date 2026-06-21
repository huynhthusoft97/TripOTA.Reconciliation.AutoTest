#!/usr/bin/env node
// Sinh HTML report tổng hợp (API + Browser) cho auto test Đối Soát 1B.
// Đọc kết quả JSON của Vitest + Playwright trong reports/, nhúng ảnh + video cho test fail.
// Dùng: node scripts/build-report.mjs   →   reports/summary.html
import fs from 'node:fs';
import path from 'node:path';

const REPORTS = 'reports';
const OUT = path.join(REPORTS, 'summary.html');
const ENV = process.env.TEST_ENV || 'sit';
const TIER = process.env.TEST_TIER || 'Vital';
// Link "View Detailed Results": Azure DevOps build (nếu chạy trong pipeline)
const BUILD_URL =
  process.env.BUILD_URL ||
  (process.env.SYSTEM_COLLECTIONURI && process.env.SYSTEM_TEAMPROJECT && process.env.BUILD_BUILDID
    ? `${process.env.SYSTEM_COLLECTIONURI}${encodeURIComponent(process.env.SYSTEM_TEAMPROJECT)}/_build/results?buildId=${process.env.BUILD_BUILDID}`
    : '');

const readJson = (f) => {
  try { return JSON.parse(fs.readFileSync(path.join(REPORTS, f), 'utf8')); }
  catch { return null; }
};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const firstLine = (s) => String(s ?? '').replace(/\[[0-9;]*m/g, '').split('\n').map((x) => x.trim()).filter(Boolean)[0] || '';
const relFromReports = (p) => (p ? path.relative(REPORTS, p).split(path.sep).join('/') : '');

// ---------- Vitest (API) ----------
function parseVitest() {
  const j = readJson('vitest-results.json');
  const suite = { name: 'API Tests', icon: '🧪', total: 0, passed: 0, failed: [] };
  if (!j) return suite;
  suite.total = j.numTotalTests ?? 0;
  suite.passed = j.numPassedTests ?? 0;
  for (const tr of j.testResults || []) {
    for (const a of tr.assertionResults || []) {
      if (a.status === 'failed') {
        const title = [...(a.ancestorTitles || []), a.title].join(' > ');
        suite.failed.push({ title: `[API] ${title}`, error: firstLine((a.failureMessages || [])[0]) });
      }
    }
  }
  return suite;
}

// ---------- Playwright (Browser) ----------
function parsePlaywright() {
  const j = readJson('playwright-results.json');
  const suite = { name: 'Browser Tests', icon: '🌐', total: 0, passed: 0, failed: [] };
  if (!j) return suite;
  const walk = (node, file) => {
    const f = node.file || file;
    for (const s of node.suites || []) walk(s, f);
    for (const spec of node.specs || []) {
      for (const t of spec.tests || []) {
        suite.total++;
        const res = (t.results || [])[t.results.length - 1] || {};
        if (res.status === 'passed' || res.status === 'expected' || spec.ok) {
          suite.passed++;
        } else {
          const att = res.attachments || [];
          const pick = (name) => att.find((x) => x.name === name && x.path);
          suite.failed.push({
            title: `[Browser] ${spec.title}`,
            error: firstLine(res.error?.message),
            screenshot: relFromReports(pick('screenshot')?.path),
            video: relFromReports(pick('video')?.path),
            trace: relFromReports(pick('trace')?.path),
          });
        }
      }
    }
  };
  for (const s of j.suites || []) walk(s, s.file);
  // fallback từ stats nếu cần
  if (suite.total === 0 && j.stats) {
    suite.total = (j.stats.expected || 0) + (j.stats.unexpected || 0) + (j.stats.flaky || 0);
    suite.passed = j.stats.expected || 0;
  }
  return suite;
}

const api = parseVitest();
const br = parsePlaywright();
const suites = [api, br];
const total = suites.reduce((n, s) => n + s.total, 0);
const passed = suites.reduce((n, s) => n + s.passed, 0);
const failures = suites.reduce((n, s) => n + s.failed.length, 0);
const allFailed = [...api.failed, ...br.failed];
const ok = failures === 0;

// ---------- HTML ----------
const statusBadge = (s) => s.failed.length ? '<span style="color:#d64545;font-weight:700">FAILED</span>' : '<span style="color:#2e9e5b;font-weight:700">PASSED</span>';

const failedItem = (f) => `
  <li style="margin:0 0 18px">
    <div style="font-weight:700;color:#222">${esc(f.title)}</div>
    <div style="color:#d64545;margin-top:2px">Error: ${esc(f.error || 'failed')}</div>
    ${(f.screenshot || f.video) ? `<div style="margin-top:8px;display:flex;gap:12px;flex-wrap:wrap">
      ${f.screenshot ? `<a href="${esc(f.screenshot)}" target="_blank"><img src="${esc(f.screenshot)}" alt="screenshot" style="max-width:320px;border:1px solid #ddd;border-radius:6px"/></a>` : ''}
      ${f.video ? `<video src="${esc(f.video)}" controls style="max-width:320px;border:1px solid #ddd;border-radius:6px"></video>` : ''}
    </div>` : ''}
    ${f.trace ? `<div style="margin-top:4px"><a href="${esc(f.trace)}" style="color:#3367d6;font-size:13px">⬇ trace.zip (npx playwright show-trace)</a></div>` : ''}
  </li>`;

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${ok ? 'PASSED' : 'FAILED'} ${esc(TIER)} Tests Report</title></head>
<body style="margin:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f2329">
<div style="max-width:760px;margin:24px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px 32px">
  <h1 style="text-align:center;color:${ok ? '#2e9e5b' : '#d64545'};font-size:28px;margin:8px 0 24px">
    ${ok ? '✅' : '❌'} ${ok ? 'PASSED' : 'FAILED'} ${esc(TIER)} Tests Report</h1>

  <div style="background:#f7f8fa;border-radius:10px;padding:18px 22px;margin-bottom:22px">
    <div><b>Environment:</b> <span style="color:#3367d6">${esc(ENV)}</span></div>
    <div style="margin-top:6px"><b>Overall Result:</b> ${passed} / ${total} passed (${failures} failure${failures === 1 ? '' : 's'})</div>
    <div style="margin-top:6px"><b>Thời điểm:</b> ${new Date().toLocaleString('vi-VN')}</div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:22px">
    <thead><tr style="background:#eceef1">
      <th style="text-align:left;padding:12px 14px;border:1px solid #e5e7eb">Suite</th>
      <th style="text-align:left;padding:12px 14px;border:1px solid #e5e7eb">Status</th>
      <th style="text-align:left;padding:12px 14px;border:1px solid #e5e7eb">Result</th>
    </tr></thead>
    <tbody>
      ${suites.map((s) => `<tr>
        <td style="padding:12px 14px;border:1px solid #e5e7eb">${s.icon} ${esc(s.name)}</td>
        <td style="padding:12px 14px;border:1px solid #e5e7eb">${statusBadge(s)}</td>
        <td style="padding:12px 14px;border:1px solid #e5e7eb">${s.passed}/${s.total}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  ${BUILD_URL ? `<div style="text-align:center;margin:8px 0 26px">
    <a href="${esc(BUILD_URL)}" style="display:inline-block;background:#3367d6;color:#fff;text-decoration:none;font-weight:700;padding:14px 26px;border-radius:8px">View Detailed Results on Azure DevOps</a>
  </div>` : ''}

  <h2 style="color:#d64545;border-bottom:2px solid #d64545;padding-bottom:8px;margin-top:8px">
    Failed Test Cases Summary${failures ? ` (${failures})` : ''}:</h2>
  ${failures ? `<ul style="padding-left:20px;margin-top:16px">${allFailed.map(failedItem).join('')}</ul>`
    : '<p style="color:#2e9e5b;font-weight:600;margin-top:12px">🎉 Không có test fail. Tất cả đều xanh.</p>'}

  <p style="color:#8a909a;font-size:12px;margin-top:28px;text-align:center">
    Ảnh + video chỉ chụp cho test fail (Playwright). File nằm trong artifact <code>test-results/</code> của pipeline.
  </p>
</div></body></html>`;

fs.mkdirSync(REPORTS, { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`Report: ${OUT}  |  ${passed}/${total} passed, ${failures} failed`);
// Exit code phản ánh kết quả (để pipeline gate). Đặt REPORT_SOFT=1 để không fail ở bước report.
if (!ok && !process.env.REPORT_SOFT) process.exitCode = 1;
