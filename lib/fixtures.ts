import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './env.js';

// Nạp dữ liệu mẫu theo tên (NDC, non-NDC, refund, PNR, vé nối, thiếu dữ liệu).
export function loadSample<T = any>(name: string): T {
  const file = join(env.dataDir, name.endsWith('.json') ? name : `${name}.sample.json`);
  return JSON.parse(readFileSync(file, 'utf-8')) as T;
}

// Các bộ dữ liệu chuẩn dùng cho data-driven regression.
export const DATASETS = [
  'ticket-non-ndc',
  'ticket-ndc',
  'refund',
  'pnr',
  'conjunction-ticket', // vé nối
  'missing-data',
] as const;
