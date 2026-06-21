#!/usr/bin/env node
// Mở report tổng hợp bằng trình mặc định — cross-platform (Windows/macOS/Linux).
// Lý do: lệnh `open` chỉ có trên macOS; Windows dùng `start`, Linux dùng `xdg-open`.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';

const file = process.argv[2] || 'reports/summary.html';

if (!existsSync(file)) {
  console.error(`Chưa có ${file}. Chạy "npm run report:build" (hoặc "npm run ci:vital") trước.`);
  process.exit(1);
}

const plat = process.platform;
const [cmd, args] =
  plat === 'win32' ? ['cmd', ['/c', 'start', '', file]]
  : plat === 'darwin' ? ['open', [file]]
  : ['xdg-open', [file]];

execFile(cmd, args, (err) => {
  if (err) {
    console.error('Không mở được report tự động:', err.message);
    console.log('Mở thủ công:', file);
  } else {
    console.log('Đã mở', file);
  }
});
