#!/usr/bin/env node
// Gen SDK TypeScript-axios từ OpenAPI của BE bằng openapi-generator (JAR, chạy qua Java).
// Dùng JAR trực tiếp vì npm wrapper @openapitools/openapi-generator-cli lỗi ERR_REQUIRE_ESM
// trong project "type":"module". Mirror cấu hình SDK của repo App.
import { existsSync, mkdirSync, readdirSync, createWriteStream } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

// Nạp .env.<TEST_ENV> rồi .env để lấy API_BASE_URL (giống cách test chọn môi trường).
loadEnv({ path: `.env.${process.env.TEST_ENV || 'sit'}`, quiet: true });
loadEnv({ quiet: true });

const VERSION = '6.6.0';

// Host API BE theo môi trường (KHÁC host app). Đổi env để gen SDK môi trường khác:
//   TEST_ENV=dev npm run sdk   |   API_BASE_URL=... npm run sdk   |   SDK_SPEC=<url> npm run sdk
const ENV = process.env.TEST_ENV || 'sit';
const API_DEFAULTS = {
  local: 'http://localhost:8080',
  dev: 'https://reconciliation-api-dev.tripota.com.vn',
  sit: 'https://reconciliation-api-sit.tripota.com.vn',
};
const apiBase = (process.env.API_BASE_URL || API_DEFAULTS[ENV] || API_DEFAULTS.sit).replace(/\/+$/, '');
const SPEC = process.env.SDK_SPEC || `${apiBase}/swagger/v1/swagger.json`;
const JAR_DIR = '.openapi-generator-cli';
const JAR = path.join(JAR_DIR, `openapi-generator-cli-${VERSION}.jar`);
const JAR_URL = `https://repo1.maven.org/maven2/org/openapitools/openapi-generator-cli/${VERSION}/openapi-generator-cli-${VERSION}.jar`;

function findJava() {
  if (process.env.JAVA_HOME) {
    const j = path.join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (existsSync(j)) return j;
  }
  // Windows: dò Eclipse Adoptium (Temurin) nếu JAVA_HOME chưa set.
  const base = 'C:/Program Files/Eclipse Adoptium';
  if (existsSync(base)) {
    for (const d of readdirSync(base)) {
      const j = path.join(base, d, 'bin', 'java.exe');
      if (existsSync(j)) return j;
    }
  }
  return 'java'; // fallback: dựa vào PATH
}

async function ensureJar() {
  if (existsSync(JAR)) return;
  mkdirSync(JAR_DIR, { recursive: true });
  console.log(`Tải openapi-generator ${VERSION} …`);
  const res = await fetch(JAR_URL);
  if (!res.ok) throw new Error(`Tải JAR lỗi: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(JAR));
}

await ensureJar();
const java = findJava();
console.log(`Gen SDK từ ${SPEC}`);
const r = spawnSync(
  java,
  [
    '-jar', JAR, 'generate',
    '-i', SPEC,
    '-g', 'typescript-axios',
    '-o', 'sdk',
    '--type-mappings', 'DateTime=Date',
    '--generate-alias-as-model',
    '--api-package', 'apis',
    '--model-package', 'models',
    '--additional-properties=withSeparateModelsAndApi=true,stringEnums=true',
    '--skip-validate-spec',
  ],
  { stdio: 'inherit' },
);
process.exit(r.status ?? 1);
