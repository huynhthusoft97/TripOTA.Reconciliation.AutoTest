import { env } from './env.js';

export interface ApiResponse<T = any> { status: number; body: T; headers: Headers; }

async function request<T = any>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(env.authToken ? { Authorization: `Bearer ${env.authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(env.timeoutApi),
  });
  let parsed: any = null;
  const text = await res.text();
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { status: res.status, body: parsed as T, headers: res.headers };
}

export const api = {
  get: <T = any>(p: string) => request<T>('GET', p),
  post: <T = any>(p: string, b?: unknown) => request<T>('POST', p, b),
  put: <T = any>(p: string, b?: unknown) => request<T>('PUT', p, b),
};
